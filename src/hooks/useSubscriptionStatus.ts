'use client';

import { useMemo, useEffect, useRef } from 'react';
import type { Company, User } from '@/lib/types';
import {
  computeSubscriptionState,
  type SubscriptionState,
} from '@/lib/subscriptionService';

/**
 * Client-side hook that computes the authoritative subscription state
 * from the centralized `computeSubscriptionState` function.
 *
 * C5 FIX: Reconciliation (transitioning expired trials/subscriptions in
 * Firestore) is now performed via a server-side API route instead of
 * direct client-side Firestore writes. The old approach was silently
 * blocked by Firestore security rules (`companyModerationUnchanged`).
 */
export function useSubscriptionStatus(
  company?: Partial<Company> | null,
  user?: Partial<User> | null,
): SubscriptionState {
  const state = useMemo(() => {
    return computeSubscriptionState(company, user);
  }, [company, user]);

  const hasReconciledRef = useRef(false);

  useEffect(() => {
    if (!company?.id || hasReconciledRef.current) return;

    // Detect if reconciliation is needed:
    // 1. Trial expired but Firestore not updated yet
    // 2. Paid subscription expired but Firestore not updated yet
    const needsTrialReconcile =
      state.isTrialExpired && !state.isPaidActive &&
      company.subscriptionStatus !== 'trial_expired' &&
      company.subscriptionStatus !== 'suspended';

    const needsPaidReconcile =
      state.isPaidExpired &&
      company.subscriptionStatus !== 'subscription_expired' &&
      company.subscriptionStatus !== 'suspended';

    if (needsTrialReconcile || needsPaidReconcile) {
      hasReconciledRef.current = true;

      // C5 FIX: Call server-side API instead of writing to Firestore directly
      fetch('/api/subscription/reconcile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyId: company.id,
          ownerUid: user?.uid,
        }),
      }).catch((err) => {
        console.warn('[useSubscriptionStatus] Server reconciliation error:', err);
      });
    }
  }, [company, user, state.isTrialExpired, state.isPaidActive, state.isPaidExpired]);

  return state;
}
