'use client';

import { db } from '@/lib/firebase/config';
import {
  doc,
  setDoc,
  deleteDoc,
  increment,
  updateDoc,
  serverTimestamp,
  onSnapshot,
  collection,
  query,
  where,
} from 'firebase/firestore';
import { useState, useEffect } from 'react';

// ─── Deterministic doc ID ───────────────────────────────────────
function likeDocId(userId: string, productId: string) {
  return `${userId}_${productId}`;
}

// ─── Like a product ────────────────────────────────────────────
export async function likeProduct(
  userId: string,
  productId: string,
  companyId: string
) {
  const docId = likeDocId(userId, productId);
  await setDoc(doc(db, 'productLikes', docId), {
    userId,
    productId,
    companyId,
    likedAt: serverTimestamp(),
  });
  // Increment like count on the product document
  await updateDoc(doc(db, 'products', productId), {
    likeCount: increment(1),
  }).catch(() => {});
}

// ─── Unlike a product ─────────────────────────────────────────
export async function unlikeProduct(userId: string, productId: string) {
  const docId = likeDocId(userId, productId);
  await deleteDoc(doc(db, 'productLikes', docId));
  // Decrement like count on the product document
  await updateDoc(doc(db, 'products', productId), {
    likeCount: increment(-1),
  }).catch(() => {});
}

// ─── Hook: get all products liked by this user for a company ───
export function useUserProductLikes(
  userId: string | undefined,
  companyId: string | undefined
) {
  const [likedProductIds, setLikedProductIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId || !companyId) {
      setLikedProductIds(new Set());
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'productLikes'),
      where('userId', '==', userId),
      where('companyId', '==', companyId)
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        const ids = new Set<string>();
        snap.docs.forEach((d) => ids.add(d.data().productId));
        setLikedProductIds(ids);
        setLoading(false);
      },
      () => {
        setLikedProductIds(new Set());
        setLoading(false);
      }
    );

    return () => unsub();
  }, [userId, companyId]);

  return { likedProductIds, loading };
}
