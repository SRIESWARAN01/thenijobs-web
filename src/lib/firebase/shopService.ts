import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  getCountFromServer,
  increment,
  Timestamp,
  type QueryConstraint,
} from 'firebase/firestore';
import { db } from './config';
import { normaliseTimestamps } from './serializers';
import type { Product, Order, OrderStatus, Coupon, ProductReview } from '@/lib/types';

// ─────────────────────────────────────────────
// Collection references
// ─────────────────────────────────────────────
const PRODUCTS_COL = 'products';
const ORDERS_COL = 'orders';
const COUPONS_COL = 'coupons';
const REVIEWS_COL = 'productReviews';

// ─────────────────────────────────────────────
// Return types
// ─────────────────────────────────────────────

export interface CouponValidationResult {
  valid: boolean;
  coupon?: Coupon;
  discountAmount: number;
  errorMessage?: string;
}

export interface ShopStats {
  totalProducts: number;
  totalOrders: number;
  totalRevenue: number;
  pendingOrders: number;
  totalCustomers: number;
  whatsappLeads: number;
}

export interface ShopCustomer {
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  orderCount: number;
  totalSpent: number;
  lastOrderAt: Date;
}

// ─────────────────────────────────────────────
// PRODUCTS
// ─────────────────────────────────────────────

export interface GetProductsFilters {
  category?: string;
  isActive?: boolean;
  isFeatured?: boolean;
  search?: string;
  limitCount?: number;
}

/**
 * Fetch products from Firestore with optional filters.
 * Client-side `search` filter is applied after fetching because Firestore
 * does not support full-text search natively.
 */
export async function getProducts(filters: GetProductsFilters = {}): Promise<Product[]> {
  const { category, isActive, isFeatured, search, limitCount } = filters;

  const constraints: QueryConstraint[] = [orderBy('createdAt', 'desc')];

  if (category && category !== 'All') {
    constraints.push(where('category', '==', category));
  }
  if (typeof isActive === 'boolean') {
    constraints.push(where('isActive', '==', isActive));
  }
  if (typeof isFeatured === 'boolean') {
    constraints.push(where('isFeatured', '==', isFeatured));
  }
  if (limitCount) {
    constraints.push(limit(limitCount));
  }

  const q = query(collection(db, PRODUCTS_COL), ...constraints);
  const snap = await getDocs(q);

  let products = snap.docs.map((d) =>
    normaliseTimestamps({ id: d.id, ...d.data() } as Product),
  );

  if (search) {
    const term = search.toLowerCase();
    products = products.filter(
      (p) =>
        p.name.toLowerCase().includes(term) ||
        p.description.toLowerCase().includes(term) ||
        (p.tags ?? []).some((t) => t.toLowerCase().includes(term)),
    );
  }

  return products;
}

/** Fetch a single product by Firestore document ID. */
export async function getProductById(id: string): Promise<Product | null> {
  const ref = doc(db, PRODUCTS_COL, id);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return normaliseTimestamps({ id: snap.id, ...snap.data() } as Product);
}

/** Create a new product. `rating` and `reviewCount` default to 0. */
export async function createProduct(
  data: Omit<Product, 'id' | 'createdAt' | 'updatedAt' | 'rating' | 'reviewCount'>,
): Promise<string> {
  const ref = await addDoc(collection(db, PRODUCTS_COL), {
    ...data,
    rating: 0,
    reviewCount: 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

/** Update fields on an existing product. `updatedAt` is always refreshed. */
export async function updateProduct(
  id: string,
  data: Partial<Product>,
): Promise<void> {
  const ref = doc(db, PRODUCTS_COL, id);
  const rest = { ...data } as Record<string, any>;
  delete rest.id;
  delete rest.createdAt;
  await updateDoc(ref, { ...rest, updatedAt: serverTimestamp() });
}

/** Permanently delete a product document. */
export async function deleteProduct(id: string): Promise<void> {
  await deleteDoc(doc(db, PRODUCTS_COL, id));
}

// ─────────────────────────────────────────────
// ORDERS
// ─────────────────────────────────────────────

export interface GetOrdersFilters {
  customerId?: string;
  status?: OrderStatus;
  limitCount?: number;
}

/** Fetch orders with optional customer / status filters. */
export async function getOrders(filters: GetOrdersFilters = {}): Promise<Order[]> {
  const { customerId, status, limitCount } = filters;

  const constraints: QueryConstraint[] = [orderBy('createdAt', 'desc')];

  if (customerId) {
    constraints.push(where('customerId', '==', customerId));
  }
  if (status) {
    constraints.push(where('status', '==', status));
  }
  if (limitCount) {
    constraints.push(limit(limitCount));
  }

  const q = query(collection(db, ORDERS_COL), ...constraints);
  const snap = await getDocs(q);
  return snap.docs.map((d) =>
    normaliseTimestamps({ id: d.id, ...d.data() } as Order),
  );
}

/** Fetch a single order by document ID. */
export async function getOrderById(id: string): Promise<Order | null> {
  const ref = doc(db, ORDERS_COL, id);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return normaliseTimestamps({ id: snap.id, ...snap.data() } as Order);
}

/**
 * Create a new order.
 * - Writes the document with `status = 'pending'` and `whatsappSent = false`.
 * - If `couponCode` is present, increments the coupon's `usedCount` by 1.
 */
export async function createOrder(
  data: Omit<Order, 'id' | 'createdAt' | 'updatedAt' | 'whatsappSent'>,
): Promise<string> {
  const ref = await addDoc(collection(db, ORDERS_COL), {
    ...data,
    status: data.status ?? 'pending',
    whatsappSent: false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  // Increment coupon usage count when a coupon code was applied
  if (data.couponCode) {
    try {
      const couponSnap = await getDocs(
        query(
          collection(db, COUPONS_COL),
          where('code', '==', data.couponCode.toUpperCase()),
          limit(1),
        ),
      );
      if (!couponSnap.empty) {
        await updateDoc(couponSnap.docs[0].ref, {
          usedCount: increment(1),
        });
      }
    } catch (err) {
      // Non-fatal: log and continue — the order has already been saved.
      console.error('[shopService] Failed to increment coupon usedCount:', err);
    }
  }

  return ref.id;
}

/** Update the status of an existing order. */
export async function updateOrderStatus(
  id: string,
  status: OrderStatus,
): Promise<void> {
  await updateDoc(doc(db, ORDERS_COL, id), {
    status,
    updatedAt: serverTimestamp(),
  });
}

// ─────────────────────────────────────────────
// COUPONS
// ─────────────────────────────────────────────

/**
 * Validate a coupon code against the current cart total.
 *
 * Returns `{ valid: true, coupon, discountAmount }` on success,
 * or `{ valid: false, discountAmount: 0, errorMessage }` on failure.
 */
export async function validateCoupon(
  code: string,
  cartTotal: number,
): Promise<CouponValidationResult> {
  if (!code.trim()) {
    return { valid: false, discountAmount: 0, errorMessage: 'Please enter a coupon code.' };
  }

  const q = query(
    collection(db, COUPONS_COL),
    where('code', '==', code.trim().toUpperCase()),
    limit(1),
  );
  const snap = await getDocs(q);

  if (snap.empty) {
    return { valid: false, discountAmount: 0, errorMessage: 'Coupon code not found.' };
  }

  const coupon = normaliseTimestamps({
    id: snap.docs[0].id,
    ...snap.docs[0].data(),
  } as Coupon);

  if (!coupon.isActive) {
    return { valid: false, discountAmount: 0, errorMessage: 'This coupon is no longer active.' };
  }

  const now = new Date();
  if (coupon.expiresAt < now) {
    return { valid: false, discountAmount: 0, errorMessage: 'This coupon has expired.' };
  }

  if (coupon.usedCount >= coupon.maxUses) {
    return {
      valid: false,
      discountAmount: 0,
      errorMessage: 'This coupon has reached its maximum usage limit.',
    };
  }

  if (cartTotal < coupon.minOrderAmount) {
    return {
      valid: false,
      discountAmount: 0,
      errorMessage: `Minimum order amount of ₹${coupon.minOrderAmount.toFixed(2)} is required to use this coupon.`,
    };
  }

  const discountAmount =
    coupon.discountType === 'percentage'
      ? parseFloat(((cartTotal * coupon.discountValue) / 100).toFixed(2))
      : coupon.discountValue;

  return { valid: true, coupon, discountAmount };
}

/** Fetch all coupons ordered by creation date. */
export async function getCoupons(): Promise<Coupon[]> {
  const q = query(collection(db, COUPONS_COL), orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) =>
    normaliseTimestamps({ id: d.id, ...d.data() } as Coupon),
  );
}

/** Create a new coupon. `usedCount` defaults to 0. */
export async function createCoupon(
  data: Omit<Coupon, 'id' | 'createdAt' | 'usedCount'>,
): Promise<string> {
  // Normalise code to upper-case for consistent lookups.
  const ref = await addDoc(collection(db, COUPONS_COL), {
    ...data,
    code: data.code.trim().toUpperCase(),
    usedCount: 0,
    // Convert Date → Timestamp so Firestore stores it correctly.
    expiresAt:
      data.expiresAt instanceof Date
        ? Timestamp.fromDate(data.expiresAt)
        : data.expiresAt,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

/** Update fields on an existing coupon. */
export async function updateCoupon(
  id: string,
  data: Partial<Coupon>,
): Promise<void> {
  const rest = { ...data } as Record<string, any>;
  delete rest.id;
  delete rest.createdAt;

  // Convert Date → Timestamp if the caller passes a JS Date for expiresAt.
  if (rest.expiresAt instanceof Date) {
    rest.expiresAt = Timestamp.fromDate(rest.expiresAt);
  }

  await updateDoc(doc(db, COUPONS_COL, id), rest);
}

/** Permanently delete a coupon document. */
export async function deleteCoupon(id: string): Promise<void> {
  await deleteDoc(doc(db, COUPONS_COL, id));
}

// ─────────────────────────────────────────────
// PRODUCT REVIEWS
// ─────────────────────────────────────────────

/** Fetch all approved reviews for a product. */
export async function getProductReviews(productId: string): Promise<ProductReview[]> {
  const q = query(
    collection(db, REVIEWS_COL),
    where('productId', '==', productId),
    where('isApproved', '==', true),
    orderBy('createdAt', 'desc'),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) =>
    normaliseTimestamps({ id: d.id, ...d.data() } as ProductReview),
  );
}

/**
 * Add a new product review (pending approval).
 * `isApproved` defaults to `false` until an admin approves it.
 */
export async function addProductReview(
  data: Omit<ProductReview, 'id' | 'createdAt' | 'isApproved'>,
): Promise<string> {
  const ref = await addDoc(collection(db, REVIEWS_COL), {
    ...data,
    isApproved: false,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

/** Approve a product review, making it publicly visible. */
export async function approveProductReview(id: string): Promise<void> {
  await updateDoc(doc(db, REVIEWS_COL, id), { isApproved: true });
}

/** Permanently delete a product review. */
export async function deleteProductReview(id: string): Promise<void> {
  await deleteDoc(doc(db, REVIEWS_COL, id));
}

// ─────────────────────────────────────────────
// SHOP STATS
// ─────────────────────────────────────────────

/**
 * Aggregate key shop statistics in a single batched call.
 * Uses `getCountFromServer` where a full document list is not needed.
 */
export async function getShopStats(): Promise<ShopStats> {
  const [
    productCountSnap,
    orderSnap,
    pendingOrderCountSnap,
    whatsappLeadSnap,
  ] = await Promise.all([
    getCountFromServer(collection(db, PRODUCTS_COL)),
    getDocs(
      query(collection(db, ORDERS_COL), where('status', '!=', 'cancelled')),
    ),
    getCountFromServer(
      query(collection(db, ORDERS_COL), where('status', '==', 'pending')),
    ),
    getCountFromServer(
      query(collection(db, ORDERS_COL), where('whatsappSent', '==', true)),
    ),
  ]);

  // Aggregate revenue and unique customers from the order snapshot.
  let totalRevenue = 0;
  const customerSet = new Set<string>();

  for (const d of orderSnap.docs) {
    const order = d.data() as Omit<Order, 'id'>;
    totalRevenue += order.totalAmount ?? 0;
    if (order.customerId) customerSet.add(order.customerId);
  }

  return {
    totalProducts: productCountSnap.data().count,
    totalOrders: orderSnap.size,
    totalRevenue: parseFloat(totalRevenue.toFixed(2)),
    pendingOrders: pendingOrderCountSnap.data().count,
    totalCustomers: customerSet.size,
    whatsappLeads: whatsappLeadSnap.data().count,
  };
}

// ─────────────────────────────────────────────
// SHOP CUSTOMERS
// ─────────────────────────────────────────────

/**
 * Derive a unique customer list from all orders.
 * Groups by `customerId` and aggregates order count, total spend, and
 * the most-recent order date.
 */
export async function getShopCustomers(): Promise<ShopCustomer[]> {
  const snap = await getDocs(
    query(collection(db, ORDERS_COL), orderBy('createdAt', 'desc')),
  );

  const customerMap = new Map<string, ShopCustomer>();

  for (const d of snap.docs) {
    const order = normaliseTimestamps({ id: d.id, ...d.data() } as Order);
    const {
      customerId,
      customerName,
      customerEmail,
      customerPhone,
      totalAmount,
      createdAt,
    } = order;

    if (!customerId) continue;

    const existing = customerMap.get(customerId);
    if (existing) {
      existing.orderCount += 1;
      existing.totalSpent = parseFloat((existing.totalSpent + totalAmount).toFixed(2));
      // Keep the most-recent order date (docs are ordered desc, first entry wins)
    } else {
      customerMap.set(customerId, {
        customerId,
        customerName,
        customerEmail,
        customerPhone,
        orderCount: 1,
        totalSpent: parseFloat((totalAmount ?? 0).toFixed(2)),
        lastOrderAt: createdAt,
      });
    }
  }

  return Array.from(customerMap.values()).sort(
    (a, b) => b.lastOrderAt.getTime() - a.lastOrderAt.getTime(),
  );
}
