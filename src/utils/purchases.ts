/** In-app purchases through RevenueCat (iOS/Android; Metro picks
 * purchases.web.ts on web).
 *
 * Like the ad SDK, RevenueCat's native module does not exist in Expo Go, so
 * it is only loaded in a real build; in Expo Go the shop shows the products
 * with a fake price and "buying" is simulated, so the screen stays testable.
 * Every product is a consumable with fixed content (config/revenuecat.ts):
 * the app grants it right after a successful purchase and remembers the
 * transaction id so the same purchase is never granted twice.
 */
import { Platform } from 'react-native';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import {
  REMOVE_ADS_PRODUCT_ID,
  REVENUECAT_API_KEYS,
  SHOP_PRODUCTS,
  isRevenueCatConfigured,
  type ShopProduct,
} from '../config/revenuecat';

export interface ShopItem extends ShopProduct {
  priceString: string;
  /** True in Expo Go, where the price and the purchase are simulated. */
  mock: boolean;
  // The RevenueCat package to buy (real builds only).
  pkg?: unknown;
}

export type ShopState = 'ready' | 'unavailable';

type PurchasesModule = typeof import('react-native-purchases');

let sdk: PurchasesModule | null | undefined;
function getSdk(): PurchasesModule | null {
  if (sdk === undefined) {
    // Same reasoning as ads.ts: never load the native module in Expo Go.
    if (Constants.executionEnvironment === ExecutionEnvironment.StoreClient) {
      sdk = null;
    } else {
      try {
        sdk = require('react-native-purchases') as PurchasesModule;
      } catch {
        sdk = null;
      }
    }
  }
  return sdk;
}

let configured = false;
function configure(mod: PurchasesModule): boolean {
  const key = Platform.OS === 'ios' ? REVENUECAT_API_KEYS.ios : REVENUECAT_API_KEYS.android;
  if (!isRevenueCatConfigured(key)) return false;
  if (!configured) {
    mod.default.configure({ apiKey: key });
    configured = true;
  }
  return true;
}

/** The products to show, with the price the store returns for the player's
 * country and currency. `unavailable` when RevenueCat is not configured yet
 * or the store returned no matching product. */
export async function loadShop(): Promise<{ state: ShopState; items: ShopItem[] }> {
  const mod = getSdk();
  if (!mod) {
    return {
      state: 'ready',
      items: SHOP_PRODUCTS.map((p) => ({ ...p, priceString: '0,99 €', mock: true })),
    };
  }
  try {
    if (!configure(mod)) return { state: 'unavailable', items: [] };
    const offerings = await mod.default.getOfferings();
    const packages = offerings.current?.availablePackages ?? [];
    const items: ShopItem[] = [];
    for (const product of SHOP_PRODUCTS) {
      const pkg = packages.find((p) => p.product.identifier === product.id);
      if (pkg) items.push({ ...product, priceString: pkg.product.priceString, mock: false, pkg });
    }
    return { state: items.length > 0 ? 'ready' : 'unavailable', items };
  } catch {
    return { state: 'unavailable', items: [] };
  }
}

/** Asks the store whether this account already bought "remove ads" (a
 * reinstall or a new phone). `restore` also re-syncs with the store account. */
export async function hasRemovedAds(restore = false): Promise<boolean> {
  const mod = getSdk();
  if (!mod) return false;
  try {
    if (!configure(mod)) return false;
    const info = restore ? await mod.default.restorePurchases() : await mod.default.getCustomerInfo();
    return info.allPurchasedProductIdentifiers.includes(REMOVE_ADS_PRODUCT_ID);
  } catch {
    return false;
  }
}

export type PurchaseResult =
  | { status: 'success'; transactionId: string }
  | { status: 'cancelled' }
  | { status: 'error' };

/** Starts the store's purchase sheet. Never throws. */
export async function buyItem(item: ShopItem): Promise<PurchaseResult> {
  if (item.mock) {
    return new Promise((resolve) =>
      setTimeout(() => resolve({ status: 'success', transactionId: `mock-${Date.now()}` }), 600)
    );
  }
  const mod = getSdk();
  if (!mod || !item.pkg) return { status: 'error' };
  try {
    const result = await mod.default.purchasePackage(item.pkg as Parameters<typeof mod.default.purchasePackage>[0]);
    const transactionId = result.transaction?.transactionIdentifier ?? `${item.id}-${Date.now()}`;
    return { status: 'success', transactionId };
  } catch (e) {
    const cancelled = (e as { userCancelled?: boolean } | null)?.userCancelled === true;
    return cancelled ? { status: 'cancelled' } : { status: 'error' };
  }
}
