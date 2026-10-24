// ============================================================
// THENIJOBS Marketplace Local Store
// Wishlist, Recently Viewed & Product Comparison state engine
// ============================================================

export interface MarketplaceSavedItem {
  id: string;
  type: 'product' | 'service';
  name: string;
  price?: number | null;
  priceRange?: string | null;
  unit?: string;
  availability?: string;
  category?: string;
  imageUrl?: string | null;
  description?: string;
  companyName: string;
  companySlug: string;
  district: string;
  phone?: string;
  whatsapp?: string;
  isVerified?: boolean;
  savedAt?: number;
}

const WISHLIST_KEY = 'thenijobs_marketplace_wishlist';
const RECENTLY_VIEWED_KEY = 'thenijobs_marketplace_recently_viewed';
const COMPARE_KEY = 'thenijobs_marketplace_compare';

function safeGet(key: string): any[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.warn(`Error reading ${key} from localStorage:`, err);
    return [];
  }
}

function safeSet(key: string, data: any[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(data));
    window.dispatchEvent(new Event('thenijobs_marketplace_store_change'));
  } catch (err) {
    console.warn(`Error writing ${key} to localStorage:`, err);
  }
}

// ── Wishlist / Favorites ──
export function getWishlist(): MarketplaceSavedItem[] {
  return safeGet(WISHLIST_KEY);
}

export function isInWishlist(id: string): boolean {
  const list = getWishlist();
  return list.some(item => item.id === id);
}

export function toggleWishlist(item: MarketplaceSavedItem): boolean {
  const list = getWishlist();
  const exists = list.some(i => i.id === item.id);
  let updated: MarketplaceSavedItem[];
  if (exists) {
    updated = list.filter(i => i.id !== item.id);
  } else {
    updated = [{ ...item, savedAt: Date.now() }, ...list];
  }
  safeSet(WISHLIST_KEY, updated);
  return !exists;
}

export function removeFromWishlist(id: string): void {
  const list = getWishlist();
  safeSet(WISHLIST_KEY, list.filter(i => i.id !== id));
}

// ── Recently Viewed ──
export function getRecentlyViewed(): MarketplaceSavedItem[] {
  return safeGet(RECENTLY_VIEWED_KEY);
}

export function addRecentlyViewed(item: MarketplaceSavedItem): void {
  const list = getRecentlyViewed();
  const filtered = list.filter(i => i.id !== item.id);
  // Keep up to 12 most recent items
  const updated = [{ ...item, savedAt: Date.now() }, ...filtered].slice(0, 12);
  safeSet(RECENTLY_VIEWED_KEY, updated);
}

export function clearRecentlyViewed(): void {
  safeSet(RECENTLY_VIEWED_KEY, []);
}

// ── Product Comparison (Up to 3 items) ──
export function getCompareItems(): MarketplaceSavedItem[] {
  return safeGet(COMPARE_KEY);
}

export function isInCompare(id: string): boolean {
  const list = getCompareItems();
  return list.some(item => item.id === id);
}

export function toggleCompareItem(item: MarketplaceSavedItem): { added: boolean; list: MarketplaceSavedItem[]; limitReached?: boolean } {
  const list = getCompareItems();
  const exists = list.some(i => i.id === item.id);
  if (exists) {
    const updated = list.filter(i => i.id !== item.id);
    safeSet(COMPARE_KEY, updated);
    return { added: false, list: updated };
  } else {
    if (list.length >= 3) {
      return { added: false, list, limitReached: true };
    }
    const updated = [...list, item];
    safeSet(COMPARE_KEY, updated);
    return { added: true, list: updated };
  }
}

export function removeFromCompare(id: string): void {
  const list = getCompareItems();
  safeSet(COMPARE_KEY, list.filter(i => i.id !== id));
}

export function clearCompare(): void {
  safeSet(COMPARE_KEY, []);
}
