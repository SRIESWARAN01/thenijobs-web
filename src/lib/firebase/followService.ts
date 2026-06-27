'use client';

import { db } from '@/lib/firebase/config';
import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  query,
  where,
  onSnapshot,
  increment,
  updateDoc,
  serverTimestamp,
  getDocs,
} from 'firebase/firestore';
import { useState, useEffect } from 'react';

// ─── Deterministic doc ID ───────────────────────────────────────
function followDocId(userId: string, companyId: string) {
  return `${userId}_${companyId}`;
}

// ─── Follow a company ──────────────────────────────────────────
export async function followCompany(userId: string, companyId: string) {
  const docId = followDocId(userId, companyId);
  await setDoc(doc(db, 'companyFollows', docId), {
    userId,
    companyId,
    followedAt: serverTimestamp(),
  });
  // Increment follower count on company
  await updateDoc(doc(db, 'companies', companyId), {
    followerCount: increment(1),
    newFollowers: increment(1),
  }).catch(() => {});
}

// ─── Unfollow a company ────────────────────────────────────────
export async function unfollowCompany(userId: string, companyId: string) {
  const docId = followDocId(userId, companyId);
  await deleteDoc(doc(db, 'companyFollows', docId));
  // Decrement follower count and increment unfollow count on company
  await updateDoc(doc(db, 'companies', companyId), {
    followerCount: increment(-1),
    unfollowCount: increment(1),
  }).catch(() => {});
}

// ─── Real-time hook: is the current user following this company? ─
export function useIsFollowing(userId: string | undefined, companyId: string | undefined) {
  const [following, setFollowing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId || !companyId) {
      setFollowing(false);
      setLoading(false);
      return;
    }

    const docId = followDocId(userId, companyId);
    const unsub = onSnapshot(
      doc(db, 'companyFollows', docId),
      (snap) => {
        setFollowing(snap.exists());
        setLoading(false);
      },
      () => {
        setFollowing(false);
        setLoading(false);
      }
    );

    return () => unsub();
  }, [userId, companyId]);

  return { following, loading };
}

// ─── Real-time hook: follower count ────────────────────────────
export function useFollowerCount(companyId: string | undefined) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!companyId) return;

    const unsub = onSnapshot(
      doc(db, 'companies', companyId),
      (snap) => {
        setCount(snap.data()?.followerCount || 0);
      },
      () => {}
    );

    return () => unsub();
  }, [companyId]);

  return count;
}
