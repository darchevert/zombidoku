/** The persistent companion: fed with brains (a use for the currency
 * beyond the hint/auto-cat shop), it gains XP and visibly evolves — a
 * reason to keep playing that isn't just "the next level," and the
 * game's answer to "what makes this different from every other Star
 * Battle clone." */

const XP_PER_LEVEL = 50;

export interface CompanionTier {
  level: number;
  emoji: string;
  name: string;
}

export const COMPANION_TIERS: CompanionTier[] = [
  { level: 1, emoji: '🧟', name: 'Zombie débutant' },
  { level: 2, emoji: '🧟‍♂️', name: 'Zombie qui titube' },
  { level: 3, emoji: '🧟‍♀️', name: 'Zombie affamé' },
  { level: 4, emoji: '👹', name: 'Ogre nocturne' },
  { level: 5, emoji: '👺', name: 'Démon du cimetière' },
  { level: 6, emoji: '🧌', name: 'Seigneur zombie' },
];

export function companionLevel(xp: number): number {
  return Math.min(COMPANION_TIERS.length, Math.floor(xp / XP_PER_LEVEL) + 1);
}

/** XP earned inside the current level and what the level needs in total,
 * e.g. { current: 20, needed: 50 } — both 0 once the last level is reached. */
export function companionXpInLevel(xp: number): { current: number; needed: number } {
  const level = companionLevel(xp);
  if (level >= COMPANION_TIERS.length) return { current: 0, needed: 0 };
  return { current: xp - (level - 1) * XP_PER_LEVEL, needed: XP_PER_LEVEL };
}

export const COMPANION_MAX_LEVEL = COMPANION_TIERS.length;

export function companionTier(xp: number): CompanionTier {
  return COMPANION_TIERS[companionLevel(xp) - 1];
}

/** XP progress within the current level, for a progress bar — always 1
 * (full) once the last tier is reached, since there's nothing more to
 * grow into. */
export function companionProgress(xp: number): number {
  const level = companionLevel(xp);
  if (level >= COMPANION_TIERS.length) return 1;
  const xpIntoLevel = xp - (level - 1) * XP_PER_LEVEL;
  return Math.min(1, xpIntoLevel / XP_PER_LEVEL);
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
