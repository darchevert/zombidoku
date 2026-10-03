/** When to show an interstitial (full-screen) ad between levels, and when to
 * pop the shop up. Pure rules, no SDK: kept apart so they are easy to tune.
 *
 * Interstitials ramp up with the player's progress:
 *   levels 1–5   none
 *   levels 6–20  one level out of 3
 *   levels 21–40 one level out of 2
 *   level 41+    after every level
 * and are never closer together than MIN_GAP_MS, whatever the level. Players
 * who bought "remove ads" never see one. Rewarded ads are untouched: they
 * stay optional and are not covered by this module. */

const FREE_LEVELS = 5;
const ONE_IN_THREE_UNTIL = 20;
const ONE_IN_TWO_UNTIL = 40;

/** Minimum time between two interstitials. */
export const MIN_GAP_MS = 90_000;

/** Whether finishing `completedLevel` (1 = the very first level) should be
 * followed by an interstitial, from the level alone (not the time gap). */
export function isInterstitialLevel(completedLevel: number): boolean {
  if (completedLevel <= FREE_LEVELS) return false;
  if (completedLevel <= ONE_IN_THREE_UNTIL) return (completedLevel - FREE_LEVELS) % 3 === 0;
  if (completedLevel <= ONE_IN_TWO_UNTIL) return (completedLevel - ONE_IN_THREE_UNTIL) % 2 === 0;
  return true;
}

let lastInterstitialAt = 0;

/** Decides, and when the answer is yes, records that one is about to be shown. */
export function claimInterstitial(completedLevel: number, adsRemoved: boolean, now = Date.now()): boolean {
  if (adsRemoved || !isInterstitialLevel(completedLevel)) return false;
  if (now - lastInterstitialAt < MIN_GAP_MS) return false;
  lastInterstitialAt = now;
  return true;
}

// ---- Shop pop-up ---------------------------------------------------------

/** At most one automatic shop pop-up per this long (and once per launch at
 * the home screen), never during a game. */
export const SHOP_POPUP_GAP_MS = 10 * 60_000;

let lastShopPopupAt = 0;
let playedThisSession = false;

/** Call when a game screen opens: the home pop-up only follows a game. */
export function markPlayed(): void {
  playedThisSession = true;
}

/** Whether to pop the shop up on returning to the home screen. */
export function claimHomeShopPopup(now = Date.now()): boolean {
  if (!playedThisSession || now - lastShopPopupAt < SHOP_POPUP_GAP_MS) return false;
  lastShopPopupAt = now;
  return true;
}

/** Whether to pop the shop up after a lost level. */
export function claimLoseShopPopup(now = Date.now()): boolean {
  if (now - lastShopPopupAt < SHOP_POPUP_GAP_MS) return false;
  lastShopPopupAt = now;
  return true;
}
