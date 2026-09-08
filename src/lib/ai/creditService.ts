import { getAdminFirestore } from '@/lib/firebase/firebaseAdmin';
import { FieldValue } from 'firebase-admin/firestore';
import { AI_CREDIT_COSTS, AIFeatureKey } from './config';

export interface AIUsageLog {
  userId: string;
  role: string;
  feature: AIFeatureKey;
  creditsUsed: number;
  provider: string;
  model: string;
  timestamp: any;
  success: boolean;
  errorCode?: string;
}

/** Check if user has enough AI credits for the requested feature */
export async function checkUserCredits(userId: string, feature: AIFeatureKey): Promise<{
  allowed: boolean;
  requiredCredits: number;
  currentBalance: number;
  message?: string;
}> {
  const requiredCredits = AI_CREDIT_COSTS[feature] || 1;

  if (!userId) {
    return { allowed: false, requiredCredits, currentBalance: 0, message: 'User not authenticated' };
  }

  try {
    const userSnap = await getAdminFirestore().collection('users').doc(userId).get();

    if (!userSnap.exists) {
      return { allowed: false, requiredCredits, currentBalance: 0, message: 'User record not found' };
    }

    const userData = userSnap.data() || {};
    const aiCredits = userData.aiCredits || 0;
    const aiCreditsUsed = userData.aiCreditsUsed || 0;
    const currentBalance = Math.max(0, aiCredits - aiCreditsUsed);

    if (currentBalance < requiredCredits) {
      return {
        allowed: false,
        requiredCredits,
        currentBalance,
        message: `Insufficient AI credits. Required: ${requiredCredits}, Available: ${currentBalance}. Please upgrade or purchase credits.`,
      };
    }

    return { allowed: true, requiredCredits, currentBalance };
  } catch (err: any) {
    // HOSTING-1: this used to read through the unauthenticated client SDK (no signed-in
    // session server-side), so this branch was not a rare failure -- it was the path every
    // call took, always, regardless of the user's real balance. It now reads through a real
    // server identity (see firebaseAdmin.ts); this branch is a genuine failure again --
    // either no FIREBASE_SERVICE_ACCOUNT_KEY is configured yet, or a real Firestore error.
    // The specific reason is logged for the owner; the caller sees a generic message, same
    // as before, since a balance that can't be verified is still not evidence of one to spend.
    console.error('[Credit Check Error]:', err?.message || err);
    return {
      allowed: false,
      requiredCredits,
      currentBalance: 0,
      message: 'Could not verify your AI credit balance right now. Please try again shortly.',
    };
  }
}

/** Atomically deduct AI credits after successful Groq API execution */
export async function deductUserCredits(
  userId: string,
  feature: AIFeatureKey
): Promise<boolean> {
  const creditsToDeduct = AI_CREDIT_COSTS[feature] || 1;

  if (!userId) return false;

  try {
    await getAdminFirestore().collection('users').doc(userId).update({
      aiCreditsUsed: FieldValue.increment(creditsToDeduct),
    });
    return true;
  } catch (err: any) {
    console.error('[Credit Deduction Error]:', err?.message || err);
    return false;
  }
}

/** Log AI execution metrics for admin analytics */
export async function logAIUsage(log: {
  userId: string;
  role: string;
  feature: AIFeatureKey;
  creditsUsed: number;
  provider: string;
  model: string;
  success: boolean;
  errorCode?: string;
}) {
  try {
    await getAdminFirestore().collection('aiUsageLogs').add({
      ...log,
      timestamp: FieldValue.serverTimestamp(),
      createdAt: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error('[Log AI Usage Error]:', err?.message || err);
  }
}
