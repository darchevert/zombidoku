/** Board grows as the player advances: level 1-2 start at 4x4, and each
 * larger size sticks around for one level longer than the last (2, 3, 4,
 * 5, ... levels) before growing again, so the ramp gets gentler exactly
 * as boards get harder. Caps at 16x16. */
const MIN_SIZE = 4;
const MAX_SIZE = 16;

/** Every 5th level (from level 5) is a boss: one grid size bigger than its
 * neighbours, a real difficulty spike rather than just a label. */
export function isBossLevel(level: number): boolean {
  return level >= 5 && level % 5 === 0;
}

export function levelToSize(level: number): number {
  const base = baseSizeForLevel(level);
  return isBossLevel(level) ? Math.min(MAX_SIZE, base + 1) : base;
}

export type Difficulty = 'easy' | 'medium' | 'hard' | 'expert';

/** Difficulty follows the grid size, the thing that really makes a level
 * harder: up to 5x5 easy, 6-8 medium, 9-11 hard, 12+ expert. */
export function difficultyForSize(size: number): Difficulty {
  if (size <= 5) return 'easy';
  if (size <= 8) return 'medium';
  if (size <= 11) return 'hard';
  return 'expert';
}

export function levelDifficulty(level: number): { difficulty: Difficulty; boss: boolean } {
  return { difficulty: difficultyForSize(levelToSize(level)), boss: isBossLevel(level) };
}

export const DIFFICULTY_COLORS: Record<Difficulty, { bg: string; text: string }> = {
  easy: { bg: '#8BC34A', text: '#241B33' },
  medium: { bg: '#F0C23E', text: '#241B33' },
  hard: { bg: '#E0554F', text: '#FFFFFF' },
  expert: { bg: '#8A6BC9', text: '#FFFFFF' },
};

function baseSizeForLevel(level: number): number {
  let size = MIN_SIZE;
  let levelsUsedBySize = 0;
  let tierWidth = 2;
  while (size < MAX_SIZE) {
    levelsUsedBySize += tierWidth;
    if (level <= levelsUsedBySize) return size;
    size++;
    tierWidth++;
  }
  return MAX_SIZE;
}

export const DAILY_CHALLENGE_UNLOCK_LEVEL = 21;

/** Base score for a level scales with board size; hints and hint-cats
 * used along the way each cost points, mirroring the reference game's
 * light score pressure without punishing players for taking their time. */
export function baseLevelScore(size: number): number {
  return size * 100;
}

export function scoreForCompletion(
  size: number,
  hintsUsed: number,
  autoCatsUsed: number
): number {
  const base = baseLevelScore(size);
  const penalty = (hintsUsed + autoCatsUsed) * 25;
  return Math.max(base - penalty, size * 10);
}
