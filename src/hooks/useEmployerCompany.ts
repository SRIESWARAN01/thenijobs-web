'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { db } from '@/lib/firebase/config';
import {
  doc,
  onSnapshot,
  collection,
  query,
  where,
  getDocs,
  setDoc,
} from 'firebase/firestore';
import type { CompanyEntity } from '@/lib/company/companyResolver';

export type { CompanyEntity };

export function useEmployerCompany() {
  const { user } = useAuth();
  const [company, setCompany] = useState<CompanyEntity | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const resolveAndListen = useCallback(() => {
    if (!user?.uid) {
      setCompany(null);
      setLoading(false);
      return () => {};
    }

    setLoading(true);
    let unsubPrimary: (() => void) | null = null;
    let isCancelled = false;

    // Helper to listen to a verified canonical company doc
    const listenToDoc = (compId: string) => {
      if (unsubPrimary) unsubPrimary();
      return onSnapshot(
        doc(db, 'companies', compId),
        (snap) => {
          if (isCancelled) return;
          if (snap.exists()) {
            const compData = { id: snap.id, ...snap.data() } as CompanyEntity;
            setCompany(compData);
            setLoading(false);

            // Self-heal: If user doc is missing companyId, link it
            if ((user as any)?.companyId !== compId) {
              setDoc(doc(db, 'users', user.uid), { companyId: compId }, { merge: true }).catch(() => {});
            }

            // Self-heal: If company ownerId was guest or unassigned, claim it
            if (!compData.ownerId || compData.ownerId.startsWith('guest_')) {
              setDoc(doc(db, 'companies', compId), { ownerId: user.uid }, { merge: true }).catch(() => {});
            }
          } else {
            // Document missing, run fallback query
            fallbackQuery();
          }
        },
        (err) => {
          if (isCancelled) return;
          console.warn('[useEmployerCompany] primary listener warning:', err.message);
          fallbackQuery();
        },
      );
    };

    const fallbackQuery = async () => {
      if (isCancelled) return;
      try {
        // Priority 2: Query by ownerId
        const qOwner = query(collection(db, 'companies'), where('ownerId', '==', user.uid));
        const snapOwner = await getDocs(qOwner);
        if (!snapOwner.empty && !isCancelled) {
          const foundDoc = snapOwner.docs[0];
          unsubPrimary = listenToDoc(foundDoc.id);
          return;
        }

        // Priority 3: Query by ownerEmail
        if (user.email) {
          const qEmail = query(
            collection(db, 'companies'),
            where('ownerEmail', '==', user.email.toLowerCase().trim()),
          );
          const snapEmail = await getDocs(qEmail);
          if (!snapEmail.empty && !isCancelled) {
            const foundDoc = snapEmail.docs[0];
            unsubPrimary = listenToDoc(foundDoc.id);
            return;
          }
        }

        // Priority 4: Query by employeeIds array containing user.uid
        const qEmployee = query(
          collection(db, 'companies'),
          where('employeeIds', 'array-contains', user.uid),
        );
        const snapEmployee = await getDocs(qEmployee);
        if (!snapEmployee.empty && !isCancelled) {
          const foundDoc = snapEmployee.docs[0];
          unsubPrimary = listenToDoc(foundDoc.id);
          return;
        }

        if (!isCancelled) {
          setCompany(null);
          setLoading(false);
        }
      } catch (err: any) {
        if (!isCancelled) {
          console.error('[useEmployerCompany] fallback resolution error:', err);
          setError(err.message || 'Failed to resolve company');
          setLoading(false);
        }
      }
    };

    const directCompanyId = (user as any)?.companyId;
    if (directCompanyId) {
      unsubPrimary = listenToDoc(directCompanyId);
    } else {
      fallbackQuery();
    }

    return () => {
      isCancelled = true;
      if (unsubPrimary) unsubPrimary();
    };
  }, [user?.uid, (user as any)?.companyId, user?.email]);

  useEffect(() => {
    const unsub = resolveAndListen();
    return () => {
      if (unsub) unsub();
    };
  }, [resolveAndListen]);

  return {
    company,
    companyId: company?.id || null,
    loading,
    error,
    refresh: resolveAndListen,
  };
}
