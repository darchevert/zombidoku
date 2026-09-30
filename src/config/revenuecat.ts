// RevenueCat configuration for the in-app shop.
//
// The two keys below are the PUBLIC SDK keys of the RevenueCat project
// (dashboard > Project settings > API keys: "Apple App Store" and "Google
// Play Store"). They are meant to be shipped inside the app, unlike a secret
// key. While they still contain XXXX the shop reports "unavailable" on real
// builds instead of crashing.

export const REVENUECAT_API_KEYS = {
  ios: 'appl_yvGTUijEeySKFFVQQalQjyogYxW',
  android: 'goog_tfptjiNqRILEErewyEgxneQLDrb',
};

export function isRevenueCatConfigured(platformKey: string): boolean {
  return !/X{4,}/.test(platformKey);
}

export interface ProductGrant {
  brains: number;
  hints: number;
  autoCats: number;
  mice: number;
}

export interface ShopProduct {
  /** Product identifier, identical in App Store Connect, Google Play Console
   * and the RevenueCat offering. All are CONSUMABLES with a fixed content:
   * no random paid loot, so nothing needs odds disclosure. */
  id: string;
  emoji: string;
  /** i18n key of the product's name. */
  titleKey: string;
  grant: ProductGrant;
}

const none = { brains: 0, hints: 0, autoCats: 0, mice: 0 };

export const SHOP_PRODUCTS: ShopProduct[] = [
  { id: 'zombidoku_brains_small', emoji: '🧠', titleKey: 'shop.brainsSmall', grant: { ...none, brains: 60 } },
  { id: 'zombidoku_brains_medium', emoji: '🧠', titleKey: 'shop.brainsMedium', grant: { ...none, brains: 200 } },
  { id: 'zombidoku_brains_large', emoji: '🧠', titleKey: 'shop.brainsLarge', grant: { ...none, brains: 500 } },
  {
    id: 'zombidoku_bonus_pack',
    emoji: '🎁',
    titleKey: 'shop.bonusPack',
    grant: { ...none, hints: 5, autoCats: 5, mice: 5 },
  },
  {
    id: 'zombidoku_mega_pack',
    emoji: '👑',
    titleKey: 'shop.megaPack',
    grant: { brains: 400, hints: 10, autoCats: 10, mice: 10 },
  },
];
