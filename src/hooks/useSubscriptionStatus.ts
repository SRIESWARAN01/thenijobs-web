'use client';

import { useMemo, useEffect, useRef } from 'react';
import type { Company, User } from '@/lib/types';
import {
  computeSubscriptionState,
  reconcileCompanySubscription,
  type SubscriptionState,
} from '@/lib/subscriptionService';

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

    // If trial is expired or expired sub needs syncing
    if (state.isTrialExpired && !state.isPaidActive && company.subscriptionStatus !== 'trial_expired') {
      hasReconciledRef.current = true;
      reconcileCompanySubscription(company.id, company, user?.uid).catch((err) => {
        console.warn('[useSubscriptionStatus] Auto-reconciliation error:', err);
      });
    }
  }, [company, user, state.isTrialExpired, state.isPaidActive]);

  return state;
}
