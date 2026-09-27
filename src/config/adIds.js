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

const USE_TEST_ADS = true;

const ANDROID_APP_ID = 'ca-app-pub-3940256099942544~3347511713';
const IOS_APP_ID = 'ca-app-pub-3940256099942544~1458002511';

// Real rewarded ad unit IDs, once created (one per platform — an AdMob
// ad unit belongs to a specific app). Ignored entirely while
// USE_TEST_ADS is true, which uses the SDK's own TestIds.REWARDED
// instead (see utils/ads.ts) rather than duplicating Google's test unit
// IDs here.
const ANDROID_REWARDED_UNIT_ID = '';
const IOS_REWARDED_UNIT_ID = '';

module.exports = {
  USE_TEST_ADS,
  ANDROID_APP_ID,
  IOS_APP_ID,
  ANDROID_REWARDED_UNIT_ID,
  IOS_REWARDED_UNIT_ID,
};
