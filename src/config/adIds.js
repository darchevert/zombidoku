// Plain JS, not TS: app.config.ts (a Node/CJS context, not bundled by
// Metro) can only `require()` plain JS files transitively — Expo only
// transpiles the top-level app.config.ts itself, not files it imports.
// This is the one file both app.config.ts (native SDK init) and
// utils/ads.ts (ad unit requests) import, so there's a single place to
// edit when swapping test IDs for real ones.
//
// The App IDs below are Google's official public TEST App IDs — safe to
// ship during development, since they only ever serve clearly-labeled
// test ads, but they must be replaced before a real store submission or
// ads simply won't show in production. See docs/store-submission.md §1:
// once an app exists in the AdMob console for each platform, replace the
// two values below with the real App IDs (format
// `ca-app-pub-XXXXXXXXXXXXXXXX~YYYYYYYYYY`) and flip `USE_TEST_ADS` to
// `false` — that's the entire migration.

const USE_TEST_ADS = false;

const TEST_ANDROID_APP_ID = 'ca-app-pub-3940256099942544~3347511713';
const TEST_IOS_APP_ID = 'ca-app-pub-3940256099942544~1458002511';

// Real IDs from the AdMob console (Zombidoku Android / iOS). Only used once
// USE_TEST_ADS is false.
const REAL_ANDROID_APP_ID = 'ca-app-pub-5218071664586608~1360475200';
const REAL_IOS_APP_ID = 'ca-app-pub-5218071664586608~3031901099';

const ANDROID_APP_ID = USE_TEST_ADS ? TEST_ANDROID_APP_ID : REAL_ANDROID_APP_ID;
const IOS_APP_ID = USE_TEST_ADS ? TEST_IOS_APP_ID : REAL_IOS_APP_ID;

// Real rewarded ad unit IDs, once created (one per platform — an AdMob
// ad unit belongs to a specific app). Ignored entirely while
// USE_TEST_ADS is true, which uses the SDK's own TestIds.REWARDED
// instead (see utils/ads.ts) rather than duplicating Google's test unit
// IDs here.
const ANDROID_REWARDED_UNIT_ID = 'ca-app-pub-5218071664586608/6201738344';
const IOS_REWARDED_UNIT_ID = 'ca-app-pub-5218071664586608/1165034087';

// Interstitial ad unit IDs (one per platform). Empty until the units exist in
// the AdMob console: no interstitial is requested while an ID is empty.
const ANDROID_INTERSTITIAL_UNIT_ID = 'ca-app-pub-5218071664586608/7826870690';
const IOS_INTERSTITIAL_UNIT_ID = 'ca-app-pub-5218071664586608/1589688849';

module.exports = {
  USE_TEST_ADS,
  ANDROID_APP_ID,
  IOS_APP_ID,
  ANDROID_REWARDED_UNIT_ID,
  IOS_REWARDED_UNIT_ID,
  ANDROID_INTERSTITIAL_UNIT_ID,
  IOS_INTERSTITIAL_UNIT_ID,
};
