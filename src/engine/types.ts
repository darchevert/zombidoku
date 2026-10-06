/** 'wrong' is a locked-in mistake: a losing double-tap guess. It behaves
 * like 'x' for puzzle logic (excluded, not a zombie) but is rendered as a
 * red cross and can never be changed back — a permanent record of the
 * life it cost. */
export type CellState = 'empty' | 'x' | 'wrong' | 'zombie';

/** A generated puzzle: an NxN board partitioned into N connected
 * "cemetery" regions, with exactly one valid zombie placement per
 * row/column/region such that no two zombies touch (including
 * diagonally) — or they'd multiply. */
export interface Puzzle {
  size: number;
  /** regions[row][col] -> region id in [0, size) */
  regions: number[][];
  /** solution[row] -> column of the zombie in that row */
  solution: number[];
}

export interface Conflict {
  row: number;
  col: number;
  reason: 'row' | 'col' | 'region' | 'adjacent';
}
