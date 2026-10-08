import type { ExpoConfig } from 'expo/config';
import { ANDROID_APP_ID, IOS_APP_ID } from './src/config/adIds';

// A TS config rather than a static app.json so the AdMob App IDs below
// come from the same src/config/adIds.ts file utils/ads.ts reads at
// runtime — one file to edit when swapping test IDs for real ones,
// instead of keeping app.json and the runtime config in sync by hand.
const config: ExpoConfig = {
  name: 'Zombidoku',
  slug: 'zombidoku',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'dark',
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'com.darchevert.zombidoku',
    buildNumber: '1',
  },
  android: {
    package: 'com.darchevert.zombidoku',
    versionCode: 6,
    adaptiveIcon: {
      backgroundColor: '#241B33',
      foregroundImage: './assets/android-icon-foreground.png',
      backgroundImage: './assets/android-icon-background.png',
      monochromeImage: './assets/android-icon-monochrome.png',
    },
    predictiveBackGestureEnabled: false,
  },
  web: {
    favicon: './assets/favicon.png',
  },
  splash: {
    image: './assets/splash-icon.png',
    resizeMode: 'contain',
    backgroundColor: '#241B33',
  },
  extra: {
    eas: {
      projectId: '03395c33-adff-4734-8fcd-3abb7f2afa1d',
    },
  },
  plugins: [
    [
      'expo-splash-screen',
      {
        image: './assets/splash-icon.png',
        backgroundColor: '#241B33',
        resizeMode: 'contain',
      },
    ],
    [
      'expo-tracking-transparency',
      {
        userTrackingPermission:
          'Zombidoku utilise cet identifiant pour proposer des publicités récompensées pertinentes et financer le jeu.',
      },
    ],
    [
      'react-native-google-mobile-ads',
      {
        androidAppId: ANDROID_APP_ID,
        iosAppId: IOS_APP_ID,
      },
    ],
  ],
};

export default config;
