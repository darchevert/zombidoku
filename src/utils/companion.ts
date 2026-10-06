/** The persistent companion: fed with brains (a use for the currency
 * beyond the hint/auto-cat shop), it gains XP and visibly evolves — a
 * reason to keep playing that isn't just "the next level," and the
 * game's answer to "what makes this different from every other Star
 * Battle clone." */

/** XP needed to leave each level (level 1 -> 2 first). Each step asks more
 * than the last, so the top levels are a real long-term goal; a feeding is
 * always 10 XP for 2 brains (see store.ts). The last level has no target. */
const XP_TO_NEXT_LEVEL = [50, 60, 80, 100, 130, 160, 200, 250, 300];

export interface CompanionTier {
  level: number;
  emoji: string;
}

export const COMPANION_TIERS: CompanionTier[] = [
  { level: 1, emoji: '🧟' },
  { level: 2, emoji: '🧟‍♂️' },
  { level: 3, emoji: '🧟‍♀️' },
  { level: 4, emoji: '💀' },
  { level: 5, emoji: '👹' },
  { level: 6, emoji: '👺' },
  { level: 7, emoji: '🧙' },
  { level: 8, emoji: '🧛' },
  { level: 9, emoji: '🧌' },
  { level: 10, emoji: '☠️' },
];

export const COMPANION_MAX_LEVEL = COMPANION_TIERS.length;

/** XP at which each level starts: [0, 50, 110, 190, ...]. */
const LEVEL_START_XP = XP_TO_NEXT_LEVEL.reduce<number[]>(
  (acc, need) => [...acc, acc[acc.length - 1] + need],
  [0]
);

export function companionLevel(xp: number): number {
  let level = 1;
  while (level < COMPANION_MAX_LEVEL && xp >= LEVEL_START_XP[level]) level++;
  return level;
}

/** XP earned inside the current level and what the level needs in total,
 * e.g. { current: 20, needed: 50 } — both 0 once the last level is reached. */
export function companionXpInLevel(xp: number): { current: number; needed: number } {
  const level = companionLevel(xp);
  if (level >= COMPANION_MAX_LEVEL) return { current: 0, needed: 0 };
  return { current: xp - LEVEL_START_XP[level - 1], needed: XP_TO_NEXT_LEVEL[level - 1] };
}

export function companionTier(xp: number): CompanionTier {
  return COMPANION_TIERS[companionLevel(xp) - 1];
}

/** XP progress within the current level, for a progress bar — always 1
 * (full) once the last tier is reached, since there's nothing more to
 * grow into. */
export function companionProgress(xp: number): number {
  const { current, needed } = companionXpInLevel(xp);
  return needed === 0 ? 1 : Math.min(1, current / needed);
}

export interface Accessory {
  id: string;
  emoji: string;
  name: string;
  cost: number;
}

export const ACCESSORIES: Accessory[] = [
  { id: 'bow', emoji: '🎀', name: 'Nœud', cost: 15 },
  { id: 'glasses', emoji: '🕶️', name: 'Lunettes', cost: 20 },
  { id: 'scarf', emoji: '🧣', name: 'Écharpe', cost: 20 },
  { id: 'flower', emoji: '🌸', name: 'Fleur', cost: 15 },
  { id: 'crown', emoji: '👑', name: 'Couronne', cost: 40 },
];
