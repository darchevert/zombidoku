import type { Puzzle } from './types';
import { findSolutions, hasUniqueSolution } from './solver';

const DELTAS: Array<[number, number]> = [
  [-1, 0],
  [1, 0],
  [0, -1],
  [0, 1],
];

type Rng = () => number;

function shuffled<T>(arr: T[], rng: Rng): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Random permutation of columns, one per row, where no two cats in
 * consecutive rows sit within one column of each other (the "no touching,
 * including diagonally" rule). Cats in non-adjacent rows can never touch,
 * so only consecutive rows need checking. */
function generateSolution(size: number, rng: Rng): number[] | null {
  const usedCols = new Array<boolean>(size).fill(false);
  const solution = new Array<number>(size).fill(-1);

  function backtrack(row: number, prevCol: number): boolean {
    if (row === size) return true;
    for (const col of shuffled(Array.from({ length: size }, (_, i) => i), rng)) {
      if (usedCols[col]) continue;
      if (prevCol >= 0 && Math.abs(col - prevCol) <= 1) continue;
      usedCols[col] = true;
      solution[row] = col;
      if (backtrack(row + 1, col)) return true;
      usedCols[col] = false;
    }
    return false;
  }

  return backtrack(0, -1) ? solution : null;
}

/** Grows `size` connected, irregularly-shaped regions outward from the
 * solution cells until they tile the whole board — a randomized
 * multi-source flood fill, similar to a Voronoi diagram with jitter. */
function growRegions(size: number, solution: number[], rng: Rng): number[][] {
  const regions: number[][] = Array.from({ length: size }, () =>
    new Array<number>(size).fill(-1)
  );
  const frontiers: Array<Array<[number, number]>> = [];

  for (let r = 0; r < size; r++) {
    const c = solution[r];
    regions[r][c] = r;
    frontiers.push([[r, c]]);
  }

  const cellCounts = new Array<number>(size).fill(1);
  let remaining = size * size - size;
  let activeRegions = Array.from({ length: size }, (_, i) => i);

  while (remaining > 0) {
    activeRegions = activeRegions.filter((r) => frontiers[r].length > 0);
    if (activeRegions.length === 0) break;

    // Softly bias growth toward smaller regions (weighted random, not a
    // strict minimum) so sizes stay in a reasonable range without ending
    // up perfectly uniform — real levels have some small and some large
    // regions.
    const weights = activeRegions.map((r) => 1 / (cellCounts[r] + 2));
    const totalWeight = weights.reduce((a, b) => a + b, 0);
    let pick = rng() * totalWeight;
    let region = activeRegions[activeRegions.length - 1];
    for (let i = 0; i < activeRegions.length; i++) {
      pick -= weights[i];
      if (pick <= 0) {
        region = activeRegions[i];
        break;
      }
    }
    const frontier = frontiers[region];
    const idx = Math.floor(rng() * frontier.length);
    const [row, col] = frontier[idx];
    frontier.splice(idx, 1);

    for (const [dr, dc] of shuffled(DELTAS, rng)) {
      const nr = row + dr;
      const nc = col + dc;
      if (nr < 0 || nr >= size || nc < 0 || nc >= size) continue;
      if (regions[nr][nc] !== -1) continue;
      regions[nr][nc] = region;
      remaining--;
      cellCounts[region]++;
      frontier.push([nr, nc]);
    }
  }

  // Any cell unreachable from its own region's growth (fully boxed in by
  // faster-growing neighbors) gets absorbed by an adjacent region.
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (regions[r][c] !== -1) continue;
      for (const [dr, dc] of DELTAS) {
        const nr = r + dr;
        const nc = c + dc;
        if (nr >= 0 && nr < size && nc >= 0 && nc < size && regions[nr][nc] !== -1) {
          regions[r][c] = regions[nr][nc];
          break;
        }
      }
    }
  }

  return regions;
}

function isConnected(
  regions: number[][],
  size: number,
  regionId: number,
  excluding: [number, number]
): boolean {
  const cells: Array<[number, number]> = [];
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (regions[r][c] !== regionId) continue;
      if (r === excluding[0] && c === excluding[1]) continue;
      cells.push([r, c]);
    }
  }
  if (cells.length <= 1) return true;

  const visited = new Set<string>([`${cells[0][0]},${cells[0][1]}`]);
  const stack: Array<[number, number]> = [cells[0]];
  while (stack.length > 0) {
    const [r, c] = stack.pop()!;
    for (const [dr, dc] of DELTAS) {
      const nr = r + dr;
      const nc = c + dc;
      if (nr === excluding[0] && nc === excluding[1]) continue;
      if (nr < 0 || nr >= size || nc < 0 || nc >= size) continue;
      if (regions[nr][nc] !== regionId) continue;
      const key = `${nr},${nc}`;
      if (visited.has(key)) continue;
      visited.add(key);
      stack.push([nr, nc]);
    }
  }
  return visited.size === cells.length;
}

/** A valid solution uses every region exactly once, so an alternate
 * solution's cat at (row, altCol) is the *only* cell representing its
 * region among that solution's cats. Reassigning that single cell to any
 * neighboring region drops its old region's count to zero in the
 * alternate placement, invalidating it as a solution — while the true
 * solution is untouched, since it never sits on this cell. Repair loops
 * until the solver finds nothing left to break, or `deadline` passes:
 * on larger boards the space of alternate solutions can be large enough
 * that proving uniqueness gets expensive, so callers bound how long any
 * single repair attempt is allowed to run. */
type RepairStepResult = 'unique' | 'repaired' | 'stuck';

/** Runs a single repair pass in place: checks whether `regions` currently
 * has a unique solution and, if not, tries to break exactly one alternate
 * solution by reassigning a single boundary cell to a neighboring region
 * (mutating `regions` on a 'repaired' result). Shared by the wall-clock
 * (`tryRepairUniqueness`) and iteration-bounded (deterministic) repair
 * loops below, which differ only in how they decide when to stop calling
 * this. `deadline` is forwarded to the solver's search only — pass
 * `undefined` for an exact, unbounded check. */
function repairStep(
  size: number,
  regions: number[][],
  solution: number[],
  rng: Rng,
  deadline?: number
): RepairStepResult {
  const solutions = findSolutions(size, regions, 2, deadline);
  if (solutions.length <= 1) return 'unique';

  const alt = solutions.find((s) => s.some((c, r) => c !== solution[r]));
  if (!alt) return 'unique';

  const rows = shuffled(Array.from({ length: size }, (_, i) => i), rng).filter(
    (r) => alt[r] !== solution[r]
  );

  for (const row of rows) {
    const altCol = alt[row];
    const curReg = regions[row][altCol];

    const neighborRegions = new Set<number>();
    for (const [dr, dc] of DELTAS) {
      const nr = row + dr;
      const nc = altCol + dc;
      if (nr < 0 || nr >= size || nc < 0 || nc >= size) continue;
      if (regions[nr][nc] !== curReg) neighborRegions.add(regions[nr][nc]);
    }
    if (neighborRegions.size === 0) continue;
    if (!isConnected(regions, size, curReg, [row, altCol])) continue;

    const options = shuffled(Array.from(neighborRegions), rng);
    regions[row][altCol] = options[0];
    return 'repaired';
  }

  return 'stuck';
}

function tryRepairUniqueness(
  size: number,
  regions: number[][],
  solution: number[],
  deadline: number,
  rng: Rng
): boolean {
  while (Date.now() < deadline) {
    const result = repairStep(size, regions, solution, rng, deadline);
    if (result === 'unique') return true;
    if (result === 'stuck') return false;
  }
  return false;
}

/** Deterministic counterpart to `tryRepairUniqueness`: bounded by an
 * iteration count instead of a wall-clock deadline, and each pass proves
 * uniqueness exactly (no time-boxed partial search) — see
 * `generatePuzzleDeterministic`'s doc comment for why. */
function tryRepairUniquenessDeterministic(
  size: number,
  regions: number[][],
  solution: number[],
  rng: Rng,
  maxIterations: number
): boolean {
  for (let i = 0; i < maxIterations; i++) {
    const result = repairStep(size, regions, solution, rng);
    if (result === 'unique') return true;
    if (result === 'stuck') return false;
  }
  return false;
}

/** Total time budget for a single generatePuzzle call. Region-repair cost
 * grows steeply with board size (more alternate solutions to search
 * through and break), so bigger boards get more time — but always a
 * bounded amount, so the UI's "generating..." spinner never hangs. */
function budgetForSize(size: number): number {
  return Math.min(2500, Math.max(400, size * 90));
}

/** Generates a puzzle. Any region layout grown from a solution is always
 * fully playable — the solution's own cells never move, so it always
 * remains one valid answer — the only question is whether it's the
 * *only* one. Strict uniqueness is proven for small-to-medium boards
 * within the time budget; on the largest boards (roughly 12x12+) the
 * search space of alternate solutions can outgrow that budget, so
 * generation falls back to the best (typically still very constrained,
 * just not provably unique) layout found so far rather than blocking.
 *
 * `rng` defaults to `Math.random` but can be swapped for a seeded
 * generator (see `utils/seededRandom.ts`). Note that a seeded rng alone
 * does *not* make this call reproducible: `hasUniqueSolution`/
 * `tryRepairUniqueness` below bail out on wall-clock deadlines, and which
 * candidate layout ends up accepted can depend on real CPU timing, not
 * just the rng sequence, whenever a check runs long enough to nearly hit
 * its 150ms sub-budget. That's fine for interactive play (any valid,
 * provably-unique board is as good as any other) but not for the daily
 * challenge, which needs the exact same board on every device — see
 * `generatePuzzleDeterministic` in `utils/dailyChallenge.ts`'s caller,
 * which sidesteps this by never time-boxing its uniqueness checks. */
export function generatePuzzle(size: number, rng: Rng = Math.random): Puzzle {
  const deadline = Date.now() + budgetForSize(size);
  let fallback: Puzzle | null = null;

  while (Date.now() < deadline) {
    const solution = generateSolution(size, rng);
    if (!solution) continue;

    while (Date.now() < deadline) {
      const regions = growRegions(size, solution, rng);
      const checkDeadline = Math.min(deadline, Date.now() + 150);
      if (hasUniqueSolution({ size, regions }, checkDeadline)) {
        return { size, regions, solution };
      }
      fallback = { size, regions, solution };

      const repairDeadline = Math.min(deadline, Date.now() + 150);
      if (tryRepairUniqueness(size, regions, solution, repairDeadline, rng)) {
        return { size, regions, solution };
      }
      fallback = { size, regions, solution };
    }
  }

  if (fallback) return fallback;
  throw new Error(`Failed to generate a ${size}x${size} puzzle`);
}

// Random region growth on a fixed solution is only rarely unique on its
// own for a 9x9 board (measured well under 10% of the time) — repair is
// what makes most candidates usable, not a rare rescue. So the
// deterministic path keeps it, just bounded by iteration counts instead
// of wall-clock deadlines. Both bounds below are generous relative to
// measured behavior: a repair attempt that's going to succeed almost
// always does so within its first few passes, and a fresh candidate is
// almost always either immediately unique or repairable well within
// double digits of outer attempts.
const DAILY_MAX_ATTEMPTS = 300;
const DAILY_REPAIR_MAX_ITERATIONS = 60;

/** Reproducible generation for the daily challenge: the same seed always
 * produces the same board, on any device, at any time, forever — required
 * since the puzzle is shared by every player on a given date and a retry
 * after losing must land on the exact same board, not a new one.
 *
 * Structurally the same two-level search as `generatePuzzle` (fresh
 * region layout, then repair it in place, then try a different layout if
 * repair gets stuck) but with every bound expressed as an iteration count
 * rather than a wall-clock deadline — a result that depends on real CPU
 * timing anywhere in the loop is, by definition, not reproducible. Each
 * `repairStep` call also runs its solver search to exact completion
 * (`deadline: undefined`) instead of a time-boxed partial one — safe for
 * a 9x9 board, where `generatePuzzle`'s own (much larger) size-scaled
 * budget already comfortably proves uniqueness today. */
export function generatePuzzleDeterministic(size: number, rng: Rng): Puzzle {
  for (let attempt = 0; attempt < DAILY_MAX_ATTEMPTS; attempt++) {
    const solution = generateSolution(size, rng);
    if (!solution) continue;

    const regions = growRegions(size, solution, rng);
    if (hasUniqueSolution({ size, regions })) {
      return { size, regions, solution };
    }
    if (tryRepairUniquenessDeterministic(size, regions, solution, rng, DAILY_REPAIR_MAX_ITERATIONS)) {
      return { size, regions, solution };
    }
  }
  throw new Error(
    `Failed to find a unique ${size}x${size} puzzle within ${DAILY_MAX_ATTEMPTS} deterministic attempts`
  );
}
