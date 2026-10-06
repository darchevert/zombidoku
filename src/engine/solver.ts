import type { Conflict, Puzzle } from './types';

/** Core solver shared by countSolutions/findSolutions. Uses a
 * minimum-remaining-values (MRV) heuristic — at each step it assigns the
 * unassigned row with the fewest legal columns left, rather than rows in
 * fixed order — which is what keeps this tractable up to 16x16: a fixed
 * row order backtracks deep into doomed branches before noticing a row
 * ran out of options, while MRV notices (and prunes) immediately. */
/** `deadline` (Date.now()-comparable ms) bounds worst-case search time on
 * an unlucky region layout during generation — a partial, possibly
 * incomplete result is returned rather than blocking indefinitely.
 * Gameplay call sites never pass one and always get an exact answer. */
function search(
  size: number,
  regions: number[][],
  limit: number,
  deadline?: number
): number[][] {
  const assigned = new Array<number>(size).fill(-1);
  const usedCols = new Array<boolean>(size).fill(false);
  const usedRegions = new Array<boolean>(size).fill(false);
  const results: number[][] = [];
  let nodes = 0;
  let timedOut = false;

  function candidatesFor(row: number): number[] {
    const cols: number[] = [];
    const above = row > 0 ? assigned[row - 1] : -1;
    const below = row < size - 1 ? assigned[row + 1] : -1;
    for (let col = 0; col < size; col++) {
      if (usedCols[col]) continue;
      if (above >= 0 && Math.abs(col - above) <= 1) continue;
      if (below >= 0 && Math.abs(col - below) <= 1) continue;
      if (usedRegions[regions[row][col]]) continue;
      cols.push(col);
    }
    return cols;
  }

  function backtrack(remaining: number): void {
    if (results.length >= limit || timedOut) return;
    if (deadline !== undefined && (++nodes & 1023) === 0 && Date.now() > deadline) {
      timedOut = true;
      return;
    }
    if (remaining === 0) {
      results.push(assigned.slice());
      return;
    }

    // Pick the unassigned row with the fewest legal columns left — this
    // both prunes dead ends immediately (0 candidates) and keeps the
    // branching factor as low as possible at every step.
    let bestRow = -1;
    let bestCols: number[] | null = null;
    for (let row = 0; row < size; row++) {
      if (assigned[row] !== -1) continue;
      const cols = candidatesFor(row);
      if (cols.length === 0) return;
      if (bestCols === null || cols.length < bestCols.length) {
        bestRow = row;
        bestCols = cols;
        if (cols.length === 1) break;
      }
    }
    if (bestRow === -1 || bestCols === null) return;

    for (const col of bestCols) {
      if (results.length >= limit) return;
      const region = regions[bestRow][col];
      assigned[bestRow] = col;
      usedCols[col] = true;
      usedRegions[region] = true;

      backtrack(remaining - 1);

      assigned[bestRow] = -1;
      usedCols[col] = false;
      usedRegions[region] = false;
    }
  }

  backtrack(size);
  return results;
}

/** Counts solutions to a regioned "no-touch queens" puzzle, stopping early
 * once `limit` distinct solutions have been found. Used to guarantee every
 * generated puzzle has exactly one solution. */
export function countSolutions(
  size: number,
  regions: number[][],
  limit = 2,
  deadline?: number
): number {
  return search(size, regions, limit, deadline).length;
}

/** Note: with a `deadline`, a result of exactly 1 is not an ironclad
 * uniqueness proof — the search may have timed out after finding only
 * the first solution. See `search`'s doc comment for why generation
 * treats that as an acceptable trade-off on large boards. */
export function hasUniqueSolution(
  puzzle: Pick<Puzzle, 'size' | 'regions'>,
  deadline?: number
): boolean {
  return countSolutions(puzzle.size, puzzle.regions, 2, deadline) === 1;
}

/** Returns up to `limit` distinct valid cat placements (column per row).
 * Used by the generator to find alternate solutions it needs to break. */
export function findSolutions(
  size: number,
  regions: number[][],
  limit = 2,
  deadline?: number
): number[][] {
  return search(size, regions, limit, deadline);
}

/** Finds every rule violation among the cats the player has currently
 * placed, so the board can highlight them live. */
export function findConflicts(
  size: number,
  regions: number[][],
  cats: Array<{ row: number; col: number }>
): Conflict[] {
  const conflicts = new Map<string, Conflict>();
  const add = (row: number, col: number, reason: Conflict['reason']) => {
    conflicts.set(`${row},${col}`, { row, col, reason });
  };

  for (let i = 0; i < cats.length; i++) {
    for (let j = i + 1; j < cats.length; j++) {
      const a = cats[i];
      const b = cats[j];
      if (a.row === b.row) {
        add(a.row, a.col, 'row');
        add(b.row, b.col, 'row');
      }
      if (a.col === b.col) {
        add(a.row, a.col, 'col');
        add(b.row, b.col, 'col');
      }
      if (regions[a.row][a.col] === regions[b.row][b.col]) {
        add(a.row, a.col, 'region');
        add(b.row, b.col, 'region');
      }
      if (Math.abs(a.row - b.row) <= 1 && Math.abs(a.col - b.col) <= 1) {
        add(a.row, a.col, 'adjacent');
        add(b.row, b.col, 'adjacent');
      }
    }
  }

  return Array.from(conflicts.values());
}

/** True once the player has placed exactly one non-conflicting cat per
 * row, column and region — i.e. the puzzle is solved. */
export function isSolved(
  size: number,
  regions: number[][],
  cats: Array<{ row: number; col: number }>
): boolean {
  if (cats.length !== size) return false;
  if (findConflicts(size, regions, cats).length > 0) return false;
  const rows = new Set(cats.map((c) => c.row));
  const cols = new Set(cats.map((c) => c.col));
  const regs = new Set(cats.map((c) => regions[c.row][c.col]));
  return rows.size === size && cols.size === size && regs.size === size;
}
