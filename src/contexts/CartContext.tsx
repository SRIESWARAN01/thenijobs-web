'use client';

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  type ReactNode,
} from 'react';

// ─────────────────────────────────── Types ───────────────────────────────────

export interface CartItem {
  productId: string;
  name: string;
  price: number;
  image: string;
  stock: number;
  quantity: number;
}

interface CartContextValue {
  items: CartItem[];
  loading: boolean;
  cartCount: number;
  cartTotal: number;
  addToCart: (item: Omit<CartItem, 'quantity'> & { quantity?: number }) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, qty: number) => void;
  clearCart: () => void;
}

// ─────────────────────────────── Constants ───────────────────────────────────

const STORAGE_KEY = 'thenijobs_shop_cart';

// ──────────────────────────────── Context ────────────────────────────────────

const CartContext = createContext<CartContextValue | undefined>(undefined);

// ─────────────────────── localStorage helpers ────────────────────────────────

function loadCartFromStorage(): CartItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as CartItem[];
  } catch {
    console.warn('[CartContext] Failed to parse cart from localStorage.');
    return [];
  }
}

function saveCartToStorage(items: CartItem[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    console.warn('[CartContext] Failed to persist cart to localStorage.');
  }
}

// ──────────────────────────────── Provider ───────────────────────────────────

interface CartProviderProps {
  children: ReactNode;
}

/**
 * CartProvider — wrap your shop subtree with this to enable cart state.
 * Persists to localStorage under the key `thenijobs_shop_cart`.
 */
export function CartProvider({ children }: CartProviderProps) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);

  // ── Load from localStorage on mount ──────────────────────────────────────
  useEffect(() => {
    const stored = loadCartFromStorage();
    setItems(stored);
    setLoading(false);
  }, []);

  // ── Persist to localStorage whenever items change ─────────────────────────
  useEffect(() => {
    // Skip the first render where items is still the empty initial array
    // and loading is still true — we don't want to wipe stored data.
    if (loading) return;
    saveCartToStorage(items);
  }, [items, loading]);

  // ── addToCart ─────────────────────────────────────────────────────────────
  const addToCart = useCallback(
    (incoming: Omit<CartItem, 'quantity'> & { quantity?: number }) => {
      const qty = incoming.quantity ?? 1;
      setItems((prev) => {
        const existing = prev.find((i) => i.productId === incoming.productId);
        if (existing) {
          // Clamp to available stock
          const newQty = Math.min(existing.quantity + qty, incoming.stock);
          return prev.map((i) =>
            i.productId === incoming.productId ? { ...i, quantity: newQty } : i,
          );
        }
        return [
          ...prev,
          {
            productId: incoming.productId,
            name: incoming.name,
            price: incoming.price,
            image: incoming.image,
            stock: incoming.stock,
            quantity: Math.min(qty, incoming.stock),
          },
        ];
      });
    },
    [],
  );

  // ── removeFromCart ────────────────────────────────────────────────────────
  const removeFromCart = useCallback((productId: string) => {
    setItems((prev) => prev.filter((i) => i.productId !== productId));
  }, []);

  // ── updateQuantity ────────────────────────────────────────────────────────
  const updateQuantity = useCallback((productId: string, qty: number) => {
    if (qty <= 0) {
      setItems((prev) => prev.filter((i) => i.productId !== productId));
      return;
    }
    setItems((prev) =>
      prev.map((i) => {
        if (i.productId !== productId) return i;
        // Clamp to stock
        return { ...i, quantity: Math.min(qty, i.stock) };
      }),
    );
  }, []);

  // ── clearCart ─────────────────────────────────────────────────────────────
  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  // ── Computed values ───────────────────────────────────────────────────────
  const cartCount = useMemo(
    () => items.reduce((sum, i) => sum + i.quantity, 0),
    [items],
  );

  const cartTotal = useMemo(
    () => items.reduce((sum, i) => sum + i.price * i.quantity, 0),
    [items],
  );

  // ── Context value ─────────────────────────────────────────────────────────
  const value = useMemo<CartContextValue>(
    () => ({
      items,
      loading,
      cartCount,
      cartTotal,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
    }),
    [items, loading, cartCount, cartTotal, addToCart, removeFromCart, updateQuantity, clearCart],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

// ───────────────────────────────── Hook ──────────────────────────────────────

/**
 * Access the shop cart state and actions.
 * Must be used inside `<CartProvider>`.
 */
export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return ctx;
}
