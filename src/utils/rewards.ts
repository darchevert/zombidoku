import type { Difficulty } from './levelConfig';

export type BonusKind = 'hint' | 'autoCat' | 'bat';

export const BONUS_EMOJI: Record<BonusKind, string> = {
  hint: '💡',
  autoCat: '🧟',
  bat: '🦇',
};

export interface Reward {
  brains: number;
  bonuses: BonusKind[];
}

const BONUS_KINDS: BonusKind[] = ['hint', 'autoCat', 'bat'];

function randomBonus(rand: () => number): BonusKind {
  return BONUS_KINDS[Math.floor(rand() * BONUS_KINDS.length)];
}

function between(min: number, max: number, rand: () => number): number {
  return min + Math.floor(rand() * (max - min + 1));
}

// ---------------------------------------------------------------- levels

const LEVEL_TABLE: Record<Difficulty, { brains: number; bonusChance: number; extraChance: number }> = {
  easy: { brains: 3, bonusChance: 0.15, extraChance: 0 },
  medium: { brains: 4, bonusChance: 0.3, extraChance: 0 },
  hard: { brains: 6, bonusChance: 0.55, extraChance: 0 },
  // Expert always drops one bonus, and sometimes a second one.
  expert: { brains: 8, bonusChance: 1, extraChance: 0.25 },
};

/** What clearing a level pays, on top of the score: brains plus a chance of
 * bonuses that grows with the difficulty. A boss level always drops at
 * least one bonus and pays 50% more brains. */
export function rollLevelReward(
  difficulty: Difficulty,
  boss: boolean,
  rand: () => number = Math.random
): Reward {
  const row = LEVEL_TABLE[difficulty];
  const bonuses: BonusKind[] = [];
  if (boss || rand() < row.bonusChance) bonuses.push(randomBonus(rand));
  if (rand() < row.extraChance) bonuses.push(randomBonus(rand));
  return { brains: boss ? Math.round(row.brains * 1.5) : row.brains, bonuses };
}

// ----------------------------------------------------------------- tombs

export type TombKind = 'small' | 'chest';

/** How each tomb may be opened per day, and what it costs in brains once
 * the free and ad options are used up. */
export const TOMB_RULES = {
  small: { freePerDay: 1, adsPerDay: 3, brainCost: 8 },
  chest: { freePerDay: 0, adsPerDay: 1, brainCost: 30 },
} as const;

/** The odds shown to the player in the tombs screen (kept next to the roll
 * below so the two cannot drift apart). */
export const TOMB_ODDS = {
  small: { brainsMin: 2, brainsMax: 4, bonusChance: 0.5 },
  chest: { brainsMin: 8, brainsMax: 15, guaranteedBonuses: 2, thirdBonusChance: 0.15 },
} as const;

export function rollTomb(kind: TombKind, rand: () => number = Math.random): Reward {
  if (kind === 'small') {
    const o = TOMB_ODDS.small;
    return {
      brains: between(o.brainsMin, o.brainsMax, rand),
      bonuses: rand() < o.bonusChance ? [randomBonus(rand)] : [],
    };
  }
  const o = TOMB_ODDS.chest;
  const bonuses: BonusKind[] = Array.from({ length: o.guaranteedBonuses }, () => randomBonus(rand));
  if (rand() < o.thirdBonusChance) bonuses.push(randomBonus(rand));
  return { brains: between(o.brainsMin, o.brainsMax, rand), bonuses };
}

/** Counts per bonus kind, e.g. ['hint','hint','bat'] -> { hint: 2, bat: 1 }. */
export function countBonuses(bonuses: BonusKind[]): Array<{ kind: BonusKind; n: number }> {
  return BONUS_KINDS.map((kind) => ({ kind, n: bonuses.filter((b) => b === kind).length })).filter((c) => c.n > 0);
}
