import type { CellState, Puzzle } from './types';
import { findDeductions } from './deduction';

/** Hand-made boards for the guided first levels. Each has exactly one
 * solution and can be solved with the in-game deductions alone (mark the
 * cells a placed zombie rules out, then place the one forced zombie), and
 * starts with a cemetery of a single cell so the first move is obvious. */
export const TUTORIAL_LEVELS = 2;

const TUTORIAL_PUZZLES: Puzzle[] = [
  {
    size: 4,
    regions: [
      [1, 0, 0, 0],
      [1, 3, 0, 0],
      [3, 3, 3, 2],
      [3, 3, 3, 3],
    ],
    solution: [2, 0, 3, 1],
  },
  {
    size: 5,
    regions: [
      [1, 1, 1, 0, 1],
      [1, 1, 1, 1, 1],
      [1, 2, 2, 2, 3],
      [1, 2, 2, 2, 3],
      [1, 4, 2, 3, 3],
    ],
    solution: [3, 0, 2, 4, 1],
  },
];

/** The scripted board for a level, or null once the player is past the tutorial. */
export function tutorialPuzzleForLevel(level: number): Puzzle | null {
  if (level < 1 || level > TUTORIAL_LEVELS) return null;
  const p = TUTORIAL_PUZZLES[level - 1];
  return { size: p.size, regions: p.regions.map((r) => r.slice()), solution: p.solution.slice() };
}

export type TutorialStep =
  /** Cells to cross out: they share a row, column, cemetery or edge with a zombie. */
  | { phase: 'mark'; cells: Array<{ row: number; col: number }> }
  /** The one cell that must hold a zombie, and the reason it's forced. */
  | { phase: 'place'; cells: Array<{ row: number; col: number }>; reason: 'region' | 'row' | 'col' }
  | { phase: 'done'; cells: [] };

/** What the coach should ask for next, from the board as it stands. */
export function tutorialStep(puzzle: Puzzle, grid: CellState[][]): TutorialStep {
  const { xCells, zombieCell } = findDeductions(puzzle, grid);
  if (xCells.length > 0) return { phase: 'mark', cells: xCells };
  if (!zombieCell) return { phase: 'done', cells: [] };

  // Why is it forced? The first unit (cemetery, row, column) where it is the
  // only empty cell left.
  const { size, regions } = puzzle;
  const { row, col } = zombieCell;
  const onlyOne = (cells: Array<[number, number]>) =>
    cells.filter(([r, c]) => grid[r][c] === 'empty').length === 1;
  const regionCells: Array<[number, number]> = [];
  for (let r = 0; r < size; r++)
    for (let c = 0; c < size; c++) if (regions[r][c] === regions[row][col]) regionCells.push([r, c]);
  const rowCells: Array<[number, number]> = Array.from({ length: size }, (_, c) => [row, c]);
  const colCells: Array<[number, number]> = Array.from({ length: size }, (_, r) => [r, col]);
  const reason = onlyOne(regionCells) ? 'region' : onlyOne(rowCells) ? 'row' : onlyOne(colCells) ? 'col' : 'region';
  return { phase: 'place', cells: [zombieCell], reason };
}
