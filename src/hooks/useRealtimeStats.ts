'use client';

import { useState, useEffect } from 'react';
import {
  collection,
  query,
  where,
  onSnapshot,
  type QueryConstraint } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

// ============================================================
// useRealtimeCount — Live document count listener
// ============================================================

interface UseRealtimeCountOptions {
  /** Skip listening (e.g. if user isn't admin) */
  skip?: boolean;
}

/**
 * Real-time count of documents matching constraints.
 * Uses `getCountFromServer()` on mount and refreshes via `onSnapshot`.
 *
 * @example
 * ```ts
 * const { count, loading } = useRealtimeCount('users');
 * const { count: pendingBiz } = useRealtimeCount('companies', [
 *   where('verificationStatus', '==', 'pending'),
 * ]);
 * ```
 */
export function useRealtimeCount(
  collectionName: string,
  constraints: QueryConstraint[] = [],
  options: UseRealtimeCountOptions = {},
) {
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(!options.skip);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (options.skip) return;

    setLoading(true);
    setError(null);

    const q = constraints.length > 0
      ? query(collection(db, collectionName), ...constraints)
      : collection(db, collectionName);

    // Listen for changes and re-count
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        setCount(snapshot.size);
        setLoading(false);
      },
      (err) => {
        console.error(`[useRealtimeCount] ${collectionName}:`, err);
        setError(err.message);
        setLoading(false);
      },
    );

    return () => unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [collectionName, options.skip]);

  return { count, loading, error };
}

// ============================================================
// usePlatformStats — All admin dashboard stats
// ============================================================

export interface PlatformStatsData {
  totalUsers: number;
  totalBusinesses: number;
  activeJobs: number;
  totalApplications: number;
  totalLeads: number;
  totalRevenue: number;
  pendingBusinesses: number;
  pendingUsers: number;
  // ── Enhanced 15-Metric Executive Dashboard Metrics ─────────────────────────
  totalBusinessOwners: number;
  pendingBusinessApprovals: number;
  approvedBusinessOwners: number;
  activeTrials: number;
  expiredTrials: number;
  activePaidSubscriptions: number;
  pendingPayments: number;
  verifiedPayments: number;
  totalJobs: number;
  pendingJobs: number;
  pendingProducts: number;
  pendingServices: number;
}

/**
 * Real-time platform-wide stats for the admin dashboard.
 * Attaches listeners to key collections and updates counts automatically.
 */
export function usePlatformStats(skip = false) {
  const [stats, setStats] = useState<PlatformStatsData>({
    totalUsers: 0,
    totalBusinesses: 0,
    activeJobs: 0,
    totalApplications: 0,
    totalLeads: 0,
    totalRevenue: 0,
    pendingBusinesses: 0,
    pendingUsers: 0,
    totalBusinessOwners: 0,
    pendingBusinessApprovals: 0,
    approvedBusinessOwners: 0,
    activeTrials: 0,
    expiredTrials: 0,
    activePaidSubscriptions: 0,
    pendingPayments: 0,
    verifiedPayments: 0,
    totalJobs: 0,
    pendingJobs: 0,
    pendingProducts: 0,
    pendingServices: 0,
  });
  const [loading, setLoading] = useState(!skip);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (skip) return;

    const unsubscribers: (() => void)[] = [];

    const listen = (
      col: string,
      key: keyof PlatformStatsData,
      constraints: QueryConstraint[] = [],
    ) => {
      const q = constraints.length > 0
        ? query(collection(db, col), ...constraints)
        : collection(db, col);

      const unsub = onSnapshot(
        q,
        (snapshot) => {
          setStats((prev) => ({ ...prev, [key]: snapshot.size }));
        },
        (err) => {
          console.error(`[usePlatformStats] ${col}:`, err);
        },
      );
      unsubscribers.push(unsub);
    };

    // Core stats
    listen('users', 'totalUsers');
    listen('companies', 'totalBusinesses', [where('verificationStatus', '==', 'verified')]);
    // DATA-4: counted by `isActive` where the jobs read rule, every public page and
    // firestoreService.ts:99 all use `status == 'active'` — that line already carries the note
    // "matches the jobs read rule (status), not isActive". This figure is rendered as "Active
    // Listings" on admin/reports, so it should mean the same thing the site means by active.
    listen('jobs', 'activeJobs', [where('status', '==', 'active')]);
    listen('applications', 'totalApplications');
    listen('leads', 'totalLeads');

    // Pending counts
    listen('companies', 'pendingBusinesses', [where('verificationStatus', '==', 'pending')]);
    // DATA-4: the `pendingJobs` listener was removed here. It opened an onSnapshot over every
    // non-active job on each admin dashboard load, to maintain a number that was both wrong and
    // never displayed. Same shape PERF-1 removed from the home page: a live subscription is an
    // expensive way to compute something nobody reads.
    listen('users', 'pendingUsers', [where('isVerified', '==', false)]);

    // Revenue from subscriptions
    const revQ = query(
      collection(db, 'subscriptions'),
      where('status', '==', 'active'),
    );
    const revUnsub = onSnapshot(
      revQ,
      (snapshot) => {
        const total = snapshot.docs.reduce(
          (sum, d) => sum + (d.data().amount || 0),
          0,
        );
        setStats((prev) => ({ ...prev, totalRevenue: total }));
      },
      () => {
        // subscriptions collection may not exist yet
      },
    );
    unsubscribers.push(revUnsub);

    // Business Owners listener
    const boQ = query(collection(db, 'users'), where('role', '==', 'business_owner'));
    const boUnsub = onSnapshot(
      boQ,
      (snapshot) => {
        let pending = 0;
        let approved = 0;
        let trials = 0;
        let expiredTrials = 0;
        let pendingPay = 0;
        const now = Date.now();

        snapshot.docs.forEach((doc) => {
          const u = doc.data();
          const isApproved = u.approvalStatus === 'approved' || u.accountStatus === 'active';
          const isPending = !isApproved && u.approvalStatus !== 'rejected';
          if (isPending) pending++;
          if (isApproved) approved++;

          const trialEndsAtMs = u.trialEndsAt?.seconds ? u.trialEndsAt.seconds * 1000 : (u.trialEndsAt ? new Date(u.trialEndsAt).getTime() : 0);
          if (u.trialRequested || u.selectedPlan === 'trial' || u.subscriptionPlan === 'trial') {
            if (trialEndsAtMs && trialEndsAtMs < now && u.paymentStatus !== 'paid') {
              expiredTrials++;
            } else {
              trials++;
            }
          }
          if (u.paymentStatus === 'pending') {
            pendingPay++;
          }
        });

        setStats((prev) => ({
          ...prev,
          totalBusinessOwners: snapshot.size,
          pendingBusinessApprovals: pending,
          approvedBusinessOwners: approved,
          activeTrials: trials,
          expiredTrials,
          pendingPayments: pendingPay,
        }));
      },
      (err) => console.error('[usePlatformStats] business owners listener error:', err)
    );
    unsubscribers.push(boUnsub);

    // Jobs metrics
    listen('jobs', 'totalJobs');
    listen('jobs', 'pendingJobs', [where('status', '==', 'pending')]);

    // Payments and Subscriptions
    listen('payments', 'verifiedPayments', [where('status', '==', 'captured')]);
    listen('subscriptions', 'activePaidSubscriptions', [where('status', '==', 'active')]);

    // Services & Marketplace
    listen('services', 'pendingServices', [where('status', '==', 'pending')]);

    setLoading(false);

    return () => {
      unsubscribers.forEach((unsub) => unsub());
    };
  }, [skip]);

  return { stats, loading, error };
}

// ============================================================
// useEmployerStats — Employer dashboard stats
// ============================================================

export interface EmployerStatsData {
  activeJobs: number;
  totalApplications: number;
  shortlisted: number;
  interviews: number;
  hired: number;
}

export function useEmployerStats(companyId: string | undefined) {
  const [stats, setStats] = useState<EmployerStatsData>({
    activeJobs: 0,
    totalApplications: 0,
    shortlisted: 0,
    interviews: 0,
    hired: 0 });
  const [loading, setLoading] = useState(!!companyId);

  useEffect(() => {
    if (!companyId) return;

    const unsubscribers: (() => void)[] = [];

    const listen = (
      col: string,
      key: keyof EmployerStatsData,
      constraints: QueryConstraint[],
    ) => {
      const q = query(collection(db, col), ...constraints);
      const unsub = onSnapshot(q, (snapshot) => {
        setStats((prev) => ({ ...prev, [key]: snapshot.size }));
      });
      unsubscribers.push(unsub);
    };

    listen('jobs', 'activeJobs', [
      where('companyId', '==', companyId),
      where('isActive', '==', true),
    ]);
    listen('applications', 'totalApplications', [
      where('companyId', '==', companyId),
    ]);
    listen('applications', 'shortlisted', [
      where('companyId', '==', companyId),
      where('status', '==', 'shortlisted'),
    ]);
    listen('interviews', 'interviews', [
      where('companyId', '==', companyId),
    ]);
    listen('applications', 'hired', [
      where('companyId', '==', companyId),
      where('status', '==', 'selected'),
    ]);

    setLoading(false);

    return () => {
      unsubscribers.forEach((unsub) => unsub());
    };
  }, [companyId]);

  return { stats, loading };
}

// ============================================================
// useSeekerStats — Seeker dashboard stats
// ============================================================

export interface SeekerStatsData {
  appliedJobs: number;
  savedJobs: number;
  interviews: number;
  profileViews: number;
}

export function useSeekerStats(seekerId: string | undefined) {
  const [stats, setStats] = useState<SeekerStatsData>({
    appliedJobs: 0,
    savedJobs: 0,
    interviews: 0,
    profileViews: 0 });
  const [loading, setLoading] = useState(!!seekerId);

  useEffect(() => {
    if (!seekerId) return;

    const unsubscribers: (() => void)[] = [];

    const listen = (
      col: string,
      key: keyof SeekerStatsData,
      constraints: QueryConstraint[],
    ) => {
      const q = query(collection(db, col), ...constraints);
      const unsub = onSnapshot(q, (snapshot) => {
        setStats((prev) => ({ ...prev, [key]: snapshot.size }));
      });
      unsubscribers.push(unsub);
    };

    listen('applications', 'appliedJobs', [
      where('seekerId', '==', seekerId),
    ]);
    listen('savedJobs', 'savedJobs', [where('userId', '==', seekerId)]);
    listen('interviews', 'interviews', [where('seekerId', '==', seekerId)]);

    setLoading(false);

    return () => {
      unsubscribers.forEach((unsub) => unsub());
    };
  }, [seekerId]);

  return { stats, loading };
}
