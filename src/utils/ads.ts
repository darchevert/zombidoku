/** Rewarded-ad integration point — iOS/Android implementation.
 *
 * Wired to the real `react-native-google-mobile-ads` SDK, currently
 * pointed at Google's official TEST ad unit (`TestIds.REWARDED` — see
 * src/config/adIds.js's `USE_TEST_ADS` flag). Test ads are real,
 * clearly-labeled ads served by Google's own inventory — they exercise
 * the full load/show/reward flow, they just never pay out and would fail
 * store review as the *only* ad integration. Once real AdMob apps and a
 * rewarded ad unit exist (see docs/store-submission.md §1), fill in
 * `ANDROID_REWARDED_UNIT_ID`/`IOS_REWARDED_UNIT_ID` in src/config/adIds.js
 * and flip `USE_TEST_ADS` to `false` — nothing here needs to change.
 *
 * This file is deliberately NOT imported on web: see ads.web.ts, picked
 * automatically by Metro's platform-extension resolution instead. A
 * static top-level import of the ad SDK here is safe on iOS/Android, but
 * would break the web *bundle* (not just crash at runtime) if this file
 * were ever bundled for web — one of the SDK's modules statically
 * imports React Native's native codegen internals, which Metro refuses
 * to bundle for web outright, before any code even runs. Splitting by
 * platform file, rather than an in-file `Platform.OS` check or a dynamic
 * `import()` (which still isn't enough here — Metro traces a dynamic
 * import's own module graph too), keeps this file's real SDK usage
 * completely out of the web bundle's dependency graph.
 *
 * GDPR consent: `showRewardedAd` runs Google's UMP flow (`AdsConsent`)
 * before the first request; the Settings screen re-opens it via
 * `showPrivacyOptions` when the region requires that entry point.
 */

import { Platform } from 'react-native';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import { ensureTrackingPermission } from './tracking';
import { USE_TEST_ADS, ANDROID_REWARDED_UNIT_ID, IOS_REWARDED_UNIT_ID } from '../config/adIds';

type AdsModule = typeof import('react-native-google-mobile-ads');

// The SDK is a native module: it does not exist inside Expo Go (only in an
// EAS / dev-client build), and merely importing it there throws
// "RNGoogleMobileAdsModule could not be found". So it is required lazily,
// inside try/catch, and Expo Go falls back to a simulated ad.
let sdk: AdsModule | null | undefined;
function getSdk(): AdsModule | null {
  if (sdk === undefined) {
    // A try/catch is not enough on its own: Metro reports an error thrown
    // while a module initialises as a fatal red screen in dev even when the
    // caller catches it, so Expo Go must be detected up front instead.
    if (Constants.executionEnvironment === ExecutionEnvironment.StoreClient) {
      sdk = null;
    } else {
      try {
        sdk = require('react-native-google-mobile-ads') as AdsModule;
      } catch {
        sdk = null;
      }
    }
  }
  return sdk;
}

const MOCK_AD_DURATION_MS = 1500;

// Only ever read once USE_TEST_ADS is flipped to false.
const REAL_UNIT_IDS = { android: ANDROID_REWARDED_UNIT_ID, ios: IOS_REWARDED_UNIT_ID };

let mobileAdsInitPromise: Promise<unknown> | null = null;

/** Resolves `true` once a rewarded ad has been watched to completion and
 * the reward earned, `false` if it failed to load, errored, or was
 * closed early. Never rejects. */
export async function showRewardedAd(): Promise<boolean> {
  const ads = getSdk();
  if (!ads) {
    return new Promise((resolve) => setTimeout(() => resolve(true), MOCK_AD_DURATION_MS));
  }
  const { AdsConsent, RewardedAd, RewardedAdEventType, AdEventType, TestIds } = ads;

  await ensureTrackingPermission();

  // GDPR/UMP: shows Google's consent form when the user's region requires
  // one, and only lets ads be requested once consent allows it.
  try {
    await AdsConsent.gatherConsent();
    if (!(await AdsConsent.getConsentInfo()).canRequestAds) return false;
  } catch {
    return false;
  }

  if (!mobileAdsInitPromise) {
    // Coalesced so a second ad request before the first finishes
    // initializing doesn't call initialize() twice.
    mobileAdsInitPromise = ads.default().initialize();
  }
  await mobileAdsInitPromise;

  const adUnitId = USE_TEST_ADS ? TestIds.REWARDED : Platform.select(REAL_UNIT_IDS)!;

  return new Promise((resolve) => {
    const rewarded = RewardedAd.createForAdRequest(adUnitId);
    let earnedReward = false;
    let settled = false;

    function finish(result: boolean) {
      if (settled) return;
      settled = true;
      unsubscribeLoaded();
      unsubscribeEarned();
      unsubscribeError();
      unsubscribeClosed();
      resolve(result);
    }

    const unsubscribeLoaded = rewarded.addAdEventListener(RewardedAdEventType.LOADED, () => {
      rewarded.show().catch(() => finish(false));
    });
    const unsubscribeEarned = rewarded.addAdEventListener(RewardedAdEventType.EARNED_REWARD, () => {
      earnedReward = true;
    });
    const unsubscribeError = rewarded.addAdEventListener(AdEventType.ERROR, () => finish(false));
    const unsubscribeClosed = rewarded.addAdEventListener(AdEventType.CLOSED, () => finish(earnedReward));

    rewarded.load();
  });
}

/** True when UMP requires an entry point to re-open the privacy choices
 * (EEA/UK users must be able to change their consent at any time). */
export async function privacyOptionsRequired(): Promise<boolean> {
  const ads = getSdk();
  if (!ads) return false;
  try {
    const info = await ads.AdsConsent.getConsentInfo();
    return info.privacyOptionsRequirementStatus === ads.AdsConsentPrivacyOptionsRequirementStatus.REQUIRED;
  } catch {
    return false;
  }
}

export async function showPrivacyOptions(): Promise<void> {
  try {
    await getSdk()?.AdsConsent.showPrivacyOptionsForm();
  } catch {
    // ignore
  }
}
