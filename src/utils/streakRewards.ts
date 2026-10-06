/** Bonus schedule for the night-streak calendar. Milestones get further
 * apart *and* more valuable as the streak grows ("croissant mais bien
 * mesuré") — frequent enough early on to feel rewarding, but never so
 * dense that showing up every single night stops feeling special. */
export interface StreakReward {
  emoji: string;
  /** i18n key + params for the reward's name (see i18n/translations). */
  labelKey: string;
  labelParams: { n: number };
  hints: number;
  autoCats: number;
  mice: number;
  brains: number;
}

interface Milestone {
  day: number;
  reward: StreakReward;
}

function reward(
  emoji: string,
  labelKey: string,
  n: number,
  partial: Partial<Omit<StreakReward, 'emoji' | 'labelKey' | 'labelParams'>>
): StreakReward {
  return { emoji, labelKey, labelParams: { n }, hints: 0, autoCats: 0, mice: 0, brains: 0, ...partial };
}

const MILESTONES: Milestone[] = [
  { day: 2, reward: reward('🦇', 'reward.bat', 1, { mice: 1 }) },
  { day: 3, reward: reward('💡', 'reward.bulb', 1, { hints: 1 }) },
  { day: 5, reward: reward('🧟', 'reward.zombie', 1, { autoCats: 1 }) },
  { day: 7, reward: reward('🧠', 'reward.brains', 5, { brains: 5 }) },
  { day: 10, reward: reward('💡', 'reward.bulb', 2, { hints: 2 }) },
  { day: 14, reward: reward('🧠', 'reward.brains', 10, { brains: 10 }) },
  { day: 21, reward: reward('🎁', 'reward.pack', 0, { hints: 2, autoCats: 2, mice: 2, brains: 10 }) },
  { day: 30, reward: reward('🏆', 'reward.mega', 0, { hints: 3, autoCats: 3, mice: 3, brains: 20 }) },
];

const LAST_TABLE_DAY = MILESTONES[MILESTONES.length - 1].day;
const CYCLE_DAYS = 7;

/** Past the hand-tuned table, bonuses keep coming every `CYCLE_DAYS`
 * nights rather than getting denser — only the payout keeps climbing a
 * little each cycle, so the pacing stays measured indefinitely. */
function extendedMilestone(day: number): Milestone | null {
  if (day <= LAST_TABLE_DAY) return null;
  const daysPast = day - LAST_TABLE_DAY;
  if (daysPast % CYCLE_DAYS !== 0) return null;
  const tier = daysPast / CYCLE_DAYS;
  return {
    day,
    reward: reward('🎖️', 'reward.tier', tier + 1, {
      brains: 5 + tier * 2,
      hints: 1,
      autoCats: 1,
      mice: 1,
    }),
  };
}

/** The reward for surviving exactly `day` consecutive nights, or `null`
 * if that night is a plain one (no bonus). */
export function milestoneForDay(day: number): StreakReward | null {
  const known = MILESTONES.find((m) => m.day === day);
  if (known) return known.reward;
  return extendedMilestone(day)?.reward ?? null;
}

/** The next milestone day at or after `fromDay` (inclusive) — 0 means
 * "tonight itself is a bonus night". */
export function nextMilestoneDay(fromDay: number): number {
  for (const m of MILESTONES) {
    if (m.day >= fromDay) return m.day;
  }
  const daysPast = fromDay - LAST_TABLE_DAY;
  const remainder = daysPast % CYCLE_DAYS;
  return remainder === 0 ? fromDay : fromDay + (CYCLE_DAYS - remainder);
}
