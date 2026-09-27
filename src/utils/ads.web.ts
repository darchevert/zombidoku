/** Rewarded-ad integration point — web implementation.
 *
 * No ad SDK runs in a browser tab, and `ADS_SUPPORTED` in GameScreen
 * already hides the ad-prompt UI on web — this file exists so the rare
 * caller that isn't platform-gated (or a stray test) still gets a
 * well-behaved simulated "load → show → reward" flow instead of pulling
 * in the native-only SDK. See ads.ts for the real iOS/Android
 * implementation and why this needs its own file rather than a
 * `Platform.OS` branch inside a single shared one. */

const MOCK_AD_DURATION_MS = 1500;

export function showRewardedAd(): Promise<boolean> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(true), MOCK_AD_DURATION_MS);
  });
}
