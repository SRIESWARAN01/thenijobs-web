import { collection, addDoc, serverTimestamp, query, orderBy, limit as firestoreLimit, getDocs, where, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

export interface AdminActivityLog {
  id?: string;
  userId: string;
  userName: string;
  userEmail?: string;
  action: string;
  module: string;
  target?: string;
  targetId?: string;
  details?: string;
  oldValue?: string;
  newValue?: string;
  timestamp?: any;
  date?: string;
  time?: string;
}

/**
 * Log an admin action to the `adminActivityLogs` Firestore collection.
 */
export async function logAdminAction(
  userId: string,
  userName: string,
  action: string,
  module: string,
  options?: {
    userEmail?: string;
    target?: string;
    targetId?: string;
    details?: string;
    oldValue?: string;
    newValue?: string;
  },
) {
  try {
    const now = new Date();
    await addDoc(collection(db, 'adminActivityLogs'), {
      userId,
      userName,
      action,
      module,
      target: options?.target || '',
      targetId: options?.targetId || '',
      details: options?.details || '',
      oldValue: options?.oldValue || '',
      newValue: options?.newValue || '',
      userEmail: options?.userEmail || '',
      timestamp: serverTimestamp(),
      date: now.toISOString().slice(0, 10),
      time: now.toTimeString().slice(0, 8),
    });
  } catch (err) {
    console.error('[ActivityLogger] Failed to log admin action:', err);
  }
}

/**
 * Fetch recent admin activity logs.
 */
export async function getAdminActivityLogs(limitCount = 50, moduleFilter?: string) {
  const constraints: any[] = [orderBy('timestamp', 'desc'), firestoreLimit(limitCount)];
  if (moduleFilter) {
    constraints.unshift(where('module', '==', moduleFilter));
  }

  const q = query(collection(db, 'adminActivityLogs'), ...constraints);
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as AdminActivityLog[];
}
