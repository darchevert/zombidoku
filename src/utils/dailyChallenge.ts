import { generatePuzzleDeterministic } from '../engine/generator';
import type { Puzzle } from '../engine/types';
import { todayKey } from './date';
import { hashStringToSeed, mulberry32 } from './seededRandom';

/** Fixed board size for the daily challenge, independent of the player's
 * own level — it's a single shared puzzle, so its difficulty can't scale
 * per-player. Matches the size a player reaches around the unlock level
 * (see DAILY_CHALLENGE_UNLOCK_LEVEL in levelConfig.ts). */
export const DAILY_CHALLENGE_SIZE = 9;

/** Bigger than a regular level's flat reward (see BRAIN_REWARD in
 * GameScreen) since there's only one shot at it per day. */
export const DAILY_CHALLENGE_BRAIN_REWARD = 10;

/** Same puzzle for every player on a given calendar day (UTC): the board
 * is generated with a PRNG seeded from the date string instead of
 * Math.random, so it comes out byte-for-byte identical wherever and
 * whenever it's generated that day — including on a retry after losing. */
export function generateDailyPuzzle(dateKey: string = todayKey()): Puzzle {
  const seed = hashStringToSeed(`zombidoku-daily-${dateKey}`);
  return generatePuzzleDeterministic(DAILY_CHALLENGE_SIZE, mulberry32(seed));
}
