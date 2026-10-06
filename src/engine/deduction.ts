import type { CellState, Puzzle } from './types';

export interface Deduction {
  /** Cells the player could have marked ✕ themselves just by noticing
   * they share a row, column, cemetery, or an adjacent cell with a
   * zombie already placed — not yet marked, but not a guess either. */
  xCells: Array<{ row: number; col: number }>;
  /** A cell that's the *only* remaining candidate for its row, column,
   * or cemetery — i.e. provably the zombie's spot, not a guess. `null`
   * when no such single exists yet. */
  zombieCell: { row: number; col: number } | null;
}

/** True if `(row, col)` is ruled out by a zombie already on the board —
 * same row, same column, same cemetery, or touching (including
 * diagonally). This is exactly the reasoning a player doing it by hand
 * would use; it never looks at the puzzle's hidden solution. */
function isRuledOutByPlacedZombies(
  row: number,
  col: number,
  grid: CellState[][],
  regions: number[][],
  size: number
): boolean {
  const region = regions[row][col];
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (grid[r][c] !== 'zombie') continue;
      if (r === row) return true;
      if (c === col) return true;
      if (regions[r][c] === region) return true;
      if (Math.abs(r - row) <= 1 && Math.abs(c - col) <= 1) return true;
    }
  }
  return false;
}

/** One level of honest logical deduction from the *visible* board state
 * (placed zombies, marked ✕'s, and the region colors) — never the
 * hidden `puzzle.solution`. Two techniques, both things a careful player
 * could spot themselves:
 *
 * 1. Any empty cell conflicting with an already-placed zombie can be
 *    marked ✕ (`xCells`).
 * 2. Once those are accounted for, if some row/column/cemetery has
 *    exactly one candidate cell left, that cell must be the zombie
 *    (`zombieCell`) — a "hidden single", the same move a Sudoku player
 *    calls out by inspection.
 *
 * This is a single pass, not a full solver: it won't chain a forced
 * placement into the next round of eliminations, so a harder board
 * state may come back with both fields empty even though a human
 * solver could grind through it with more steps. Callers should treat
 * an empty result as "nothing obvious right now", not "unsolvable". */
export function findDeductions(puzzle: Pick<Puzzle, 'size' | 'regions'>, grid: CellState[][]): Deduction {
  const { size, regions } = puzzle;

  const xCells: Array<{ row: number; col: number }> = [];
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (grid[r][c] !== 'empty') continue;
      if (isRuledOutByPlacedZombies(r, c, grid, regions, size)) {
        xCells.push({ row: r, col: c });
      }
    }
  }
  const newlyRuledOut = new Set(xCells.map((p) => `${p.row},${p.col}`));

  function isCandidate(r: number, c: number): boolean {
    const state = grid[r][c];
    if (state !== 'empty') return false;
    return !newlyRuledOut.has(`${r},${c}`);
  }

  let zombieCell: { row: number; col: number } | null = null;

  for (let r = 0; r < size && !zombieCell; r++) {
    if (grid[r].includes('zombie')) continue;
    const candidates: number[] = [];
    for (let c = 0; c < size; c++) if (isCandidate(r, c)) candidates.push(c);
    if (candidates.length === 1) zombieCell = { row: r, col: candidates[0] };
  }

  if (!zombieCell) {
    for (let c = 0; c < size && !zombieCell; c++) {
      let hasZombie = false;
      const candidates: number[] = [];
      for (let r = 0; r < size; r++) {
        if (grid[r][c] === 'zombie') hasZombie = true;
        if (isCandidate(r, c)) candidates.push(r);
      }
      if (!hasZombie && candidates.length === 1) zombieCell = { row: candidates[0], col: c };
    }
  }

  if (!zombieCell) {
    for (let regionId = 0; regionId < size && !zombieCell; regionId++) {
      let hasZombie = false;
      const candidates: Array<{ row: number; col: number }> = [];
      for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
          if (regions[r][c] !== regionId) continue;
          if (grid[r][c] === 'zombie') hasZombie = true;
          if (isCandidate(r, c)) candidates.push({ row: r, col: c });
        }
      }
      if (!hasZombie && candidates.length === 1) zombieCell = candidates[0];
    }
  }

  return { xCells, zombieCell };
}
