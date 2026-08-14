import { db } from '@/lib/firebase/config';
import { doc, getDoc, updateDoc, increment, collection, addDoc, serverTimestamp } from 'firebase/firestore';
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
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      return { allowed: false, requiredCredits, currentBalance: 0, message: 'User record not found' };
    }

    const userData = userSnap.data();
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
    console.error('[Credit Check Error]:', err);
    // Graceful fallback during dev if field isn't set
    return { allowed: true, requiredCredits, currentBalance: 100 };
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
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      aiCreditsUsed: increment(creditsToDeduct),
    });
    return true;
  } catch (err) {
    console.error('[Credit Deduction Error]:', err);
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
    const logsRef = collection(db, 'aiUsageLogs');
    await addDoc(logsRef, {
      ...log,
      timestamp: serverTimestamp(),
      createdAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error('[Log AI Usage Error]:', err);
  }
}
