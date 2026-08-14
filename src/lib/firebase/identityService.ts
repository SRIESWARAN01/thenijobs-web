/**
 * THENIJOBS Identity Service
 * Generates unique THENIJOBS IDs, usernames, and registration numbers.
 * Uses Firestore transactions for atomic counter increments.
 */

import { doc, getDoc, setDoc, runTransaction, serverTimestamp } from 'firebase/firestore';
import { db } from './config';

// ===== THENIJOBS ID =====

/**
 * Generate a unique THENIJOBS ID.
 * Format: TJ-C-00001 (company) or TJ-S-00001 (seeker)
 */
export async function generateTheniJobsId(
  type: 'company' | 'seeker'
): Promise<string> {
  const prefix = type === 'company' ? 'TJ-C' : 'TJ-S';
  const counterRef = doc(db, 'counters', `theniJobsId_${type}`);

  const newCount = await runTransaction(db, async (transaction) => {
    const counterDoc = await transaction.get(counterRef);
    const currentCount = counterDoc.exists() ? (counterDoc.data().count || 0) : 0;
    const nextCount = currentCount + 1;
    transaction.set(counterRef, { count: nextCount, updatedAt: serverTimestamp() });
    return nextCount;
  });

  return `${prefix}-${String(newCount).padStart(5, '0')}`;
}

// ===== USERNAME =====

/**
 * Generate a unique username from display name.
 * Checks Firestore to ensure uniqueness, appends numbers if needed.
 */
export async function generateUsername(displayName: string): Promise<string> {
  // Clean and create base slug
  let base = displayName
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

  if (!base || base.length < 2) {
    base = `user-${Date.now().toString(36)}`;
  }

  // Truncate to reasonable length
  if (base.length > 30) base = base.substring(0, 30);

  // Check if username exists
  let username = base;
  let attempt = 0;
  const maxAttempts = 50;

  while (attempt < maxAttempts) {
    const check = await getDoc(doc(db, 'usernames', username));
    if (!check.exists()) {
      return username;
    }
    attempt++;
    username = `${base}-${attempt}`;
  }

  // Fallback: use timestamp
  return `${base}-${Date.now().toString(36).slice(-4)}`;
}

/**
 * Reserve a username in Firestore (call after generating)
 */
export async function reserveUsername(
  username: string,
  uid: string,
  ownerType: 'company' | 'seeker'
): Promise<void> {
  await setDoc(doc(db, 'usernames', username), {
    uid,
    ownerType,
    createdAt: serverTimestamp(),
  });
}

/**
 * Check if a username is available
 */
export async function isUsernameAvailable(username: string): Promise<boolean> {
  const snap = await getDoc(doc(db, 'usernames', username));
  return !snap.exists();
}

// ===== REGISTRATION NUMBER =====

/**
 * Generate a unique registration number.
 * Format: TNJ-2026-00001
 */
export async function generateRegistrationNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const counterRef = doc(db, 'counters', `regNumber_${year}`);

  const newCount = await runTransaction(db, async (transaction) => {
    const counterDoc = await transaction.get(counterRef);
    const currentCount = counterDoc.exists() ? (counterDoc.data().count || 0) : 0;
    const nextCount = currentCount + 1;
    transaction.set(counterRef, { count: nextCount, updatedAt: serverTimestamp() });
    return nextCount;
  });

  return `TNJ-${year}-${String(newCount).padStart(5, '0')}`;
}

// ===== ASSIGN ALL IDENTITY FIELDS =====

/**
 * Generate and assign all identity fields for a user.
 * Call during registration or admin creation.
 */
export async function assignIdentity(
  uid: string,
  displayName: string,
  ownerType: 'company' | 'seeker'
): Promise<{
  theniJobsId: string;
  username: string;
  registrationNumber: string;
}> {
  const [theniJobsId, username, registrationNumber] = await Promise.all([
    generateTheniJobsId(ownerType),
    generateUsername(displayName),
    generateRegistrationNumber(),
  ]);

  // Reserve the username
  await reserveUsername(username, uid, ownerType);

  // Update user doc with identity fields
  const { setDoc: setDocFn, doc: docFn } = await import('firebase/firestore');
  await setDocFn(docFn(db, 'users', uid), {
    theniJobsId,
    username,
    registrationNumber,
  }, { merge: true });

  return { theniJobsId, username, registrationNumber };
}
