import { getAdminFirestore } from '@/lib/firebase/firebaseAdmin';
import { getPlan } from '@/lib/plans';

/**
 * AI-CONNECT-1: server-side entitlement check for connecting a personal AI provider key.
 *
 * D-AI-ACCESS (owner, 2026-09-07) explicitly decides two cases only: a seeker pays a Rs50
 * THENIJOBS connection fee; an Enterprise-plan company gets full access with no fee. It does NOT
 * say what a non-Enterprise employer may do here -- rather than guess a number or a bypass the
 * owner never stated, that case is refused with a clear reason instead of silently allowed or
 * silently charged. Role and plan are both read from Firestore via the Admin SDK, never trusted
 * from anything the client sent (same discipline as api/ai/route.ts's own identity handling).
 */
export type ConnectionAccessResult =
  | { allowed: true; reason: 'seeker_fee_paid' | 'enterprise_bypass' | 'admin' }
  | { allowed: false; status: number; error: string };

export async function checkConnectionAccess(uid: string): Promise<ConnectionAccessResult> {
  const db = getAdminFirestore();

  const userSnap = await db.collection('users').doc(uid).get();
  if (!userSnap.exists) {
    return { allowed: false, status: 404, error: 'User record not found.' };
  }
  const role = (userSnap.data() || {}).role as string | undefined;

  if (role === 'admin' || role === 'super_admin') {
    return { allowed: true, reason: 'admin' };
  }

  if (role === 'employer' || role === 'business_owner') {
    const companiesSnap = await db.collection('companies').where('ownerId', '==', uid).limit(1).get();
    if (companiesSnap.empty) {
      return { allowed: false, status: 403, error: 'No company profile found for this account.' };
    }
    const company = companiesSnap.docs[0].data();
    const plan = getPlan(company.subscriptionPlan);
    if (plan.slug === 'enterprise') {
      return { allowed: true, reason: 'enterprise_bypass' };
    }
    return {
      allowed: false,
      status: 403,
      error: 'Connecting your own AI key is currently available on the Enterprise plan. Upgrade to connect, or use THENIJOBS AI credits instead.',
    };
  }

  if (role === 'job_seeker') {
    const connSnap = await db.collection('aiConnections').doc(uid).get();
    const feePaid = connSnap.exists && connSnap.data()?.feePaid === true;
    if (feePaid) {
      return { allowed: true, reason: 'seeker_fee_paid' };
    }
    return {
      allowed: false,
      status: 402,
      error: 'Connecting your own AI key costs a one-time Rs50 THENIJOBS connection fee.',
    };
  }

  return { allowed: false, status: 403, error: 'This account type cannot connect an AI key.' };
}
