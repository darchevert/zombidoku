/** Rewarded-ad integration point.
 *
 * THIS IS A MOCK. A real rewarded ad needs a native ad SDK (e.g.
 * `react-native-google-mobile-ads` + AdMob ad unit IDs) wired up as an
 * Expo config plugin and built via EAS — none of which can be installed,
 * compiled, or tested in this sandboxed, browser-only dev environment (no
 * native build tooling, no device, no AdMob account with an app/ad units
 * created in it yet). Shipping an unverifiable native SDK integration
 * blind was judged worse than being upfront about it: `showRewardedAd`
 * below simulates the same async "load → show → reward" shape a real SDK
 * call would have, so swapping in the real implementation later is a
 * one-function change, not a redesign of the calling code in GameScreen.
 *
 * What's already wired in ahead of the real SDK, since it doesn't depend
 * on which ad network is used:
 * - App Tracking Transparency (`ensureTrackingPermission`, iOS only) —
 *   asked once, right before the first ad, so a real AdMob integration
 *   already has a permission answer to read.
 *
 * Still missing for a real EU/France launch, beyond the SDK itself:
 * - A GDPR/ePrivacy consent flow (Google's User Messaging Platform SDK)
 *   — ATT alone covers Apple's requirement, not the EU's separate consent
 *   requirement for ad identifiers. This needs its own native SDK +
 *   config, same "can't verify blind" reasoning as the ad SDK itself.
 *
 * To go live: install `react-native-google-mobile-ads`, configure it as
 * an Expo config plugin in app.json, create a rewarded ad unit in the
 * AdMob account (an app must exist there first — see README), add the
 * UMP consent flow, and replace the body of `showRewardedAd` with the
 * SDK's load/show calls, resolving `true` only from its actual reward
 * callback.
 */

import { ensureTrackingPermission } from './tracking';

const MOCK_AD_DURATION_MS = 1500;

/** Resolves `true` once the (simulated) rewarded ad has been watched to
 * completion, `false` if it was skipped/failed to load. Never rejects. */
export async function showRewardedAd(): Promise<boolean> {
  await ensureTrackingPermission();
  return new Promise((resolve) => {
    setTimeout(() => resolve(true), MOCK_AD_DURATION_MS);
  });
}
