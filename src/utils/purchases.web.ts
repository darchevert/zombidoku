/** Web build: there are no store purchases here (the shop button is hidden
 * on web anyway), this only keeps imports valid. See purchases.ts. */
import type { ShopProduct } from '../config/revenuecat';

export interface ShopItem extends ShopProduct {
  priceString: string;
  mock: boolean;
  pkg?: unknown;
}

export type ShopState = 'ready' | 'unavailable';

export async function loadShop(): Promise<{ state: ShopState; items: ShopItem[] }> {
  return { state: 'unavailable', items: [] };
}

export async function hasRemovedAds(_restore = false): Promise<boolean> {
  return false;
}

export type PurchaseResult =
  | { status: 'success'; transactionId: string }
  | { status: 'cancelled' }
  | { status: 'error' };

export async function buyItem(_item: ShopItem): Promise<PurchaseResult> {
  return { status: 'error' };
}
