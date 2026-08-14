'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  type QueryConstraint,
  type DocumentData,
  type Query,
  serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

// ───────────────────────────── Types ─────────────────────────────

export interface UseCollectionOptions {
  /** Skip the real-time listener (data will stay empty) */
  skip?: boolean;
}

export interface UseCollectionReturn<T> {
  data: T[];
  loading: boolean;
  error: string | null;
  /** Force re-attach the listener */
  refresh: () => void;
}

export interface UseDocumentReturn<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

export interface UseMutationReturn {
  loading: boolean;
  error: string | null;
}

// ───────────────────────────── useCollection ─────────────────────

/**
 * Subscribe to a Firestore collection in real-time with optional query constraints.
 *
 * @example
 * ```ts
 * const { data: jobs, loading } = useCollection<Job>('jobs', [
 *   where('isActive', '==', true),
 *   orderBy('createdAt', 'desc'),
 *   limit(20),
 * ]);
 * ```
 */
export function useCollection<T extends DocumentData>(
  collectionName: string,
  queryConstraints: QueryConstraint[] = [],
  options: UseCollectionOptions = {},
): UseCollectionReturn<T> {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(!options.skip);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Serialise constraints so the effect doesn't re-run on every render
  // when the caller constructs constraints inline.
  const constraintsRef = useRef(queryConstraints);
  constraintsRef.current = queryConstraints;

  const refresh = useCallback(() => setRefreshKey((k) => k + 1), []);

  useEffect(() => {
    if (options.skip) return;

    setLoading(true);
    setError(null);

    let q: Query<DocumentData>;
    if (constraintsRef.current.length > 0) {
      q = query(collection(db, collectionName), ...constraintsRef.current);
    } else {
      q = collection(db, collectionName);
    }

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const docs = snapshot.docs.map(
          (d) => ({ id: d.id, ...d.data() }) as unknown as T,
        );
        setData(docs);
        setLoading(false);
      },
      (err) => {
        console.error(`[useCollection] ${collectionName}:`, err);
        setError(err.message);
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, [collectionName, options.skip, refreshKey]);

  return { data, loading, error, refresh };
}

// ───────────────────────────── useDocument ────────────────────────

/**
 * Subscribe to a single Firestore document in real-time.
 *
 * @example
 * ```ts
 * const { data: user, loading } = useDocument<User>('users', userId);
 * ```
 */
export function useDocument<T extends DocumentData>(
  collectionName: string,
  docId: string | null | undefined,
): UseDocumentReturn<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(!!docId);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!docId) {
      setData(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const unsubscribe = onSnapshot(
      doc(db, collectionName, docId),
      (snap) => {
        if (snap.exists()) {
          setData({ id: snap.id, ...snap.data() } as unknown as T);
        } else {
          setData(null);
        }
        setLoading(false);
      },
      (err) => {
        console.error(`[useDocument] ${collectionName}/${docId}:`, err);
        setError(err.message);
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, [collectionName, docId]);

  return { data, loading, error };
}

// ───────────────────────────── useAddDocument ────────────────────

/**
 * Add a new document to a Firestore collection.
 *
 * @example
 * ```ts
 * const { addDocument, loading } = useAddDocument('jobs');
 * await addDocument({ title: 'React Dev', ... });
 * ```
 */
export function useAddDocument(collectionName: string) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addDocument = useCallback(
    async (data: DocumentData): Promise<string> => {
      setLoading(true);
      setError(null);
      try {
        const docRef = await addDoc(collection(db, collectionName), {
          ...data,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp() });
        return docRef.id;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to add document';
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [collectionName],
  );

  return { addDocument, loading, error };
}

// ───────────────────────────── useUpdateDocument ─────────────────

/**
 * Update an existing Firestore document.
 *
 * @example
 * ```ts
 * const { updateDocument } = useUpdateDocument('jobs');
 * await updateDocument(jobId, { isActive: false });
 * ```
 */
export function useUpdateDocument(collectionName: string) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateDocument = useCallback(
    async (docId: string, data: Partial<DocumentData>): Promise<void> => {
      setLoading(true);
      setError(null);
      try {
        await updateDoc(doc(db, collectionName, docId), {
          ...data,
          updatedAt: serverTimestamp() });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to update document';
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [collectionName],
  );

  return { updateDocument, loading, error };
}

// ───────────────────────────── useDeleteDocument ─────────────────

/**
 * Delete a Firestore document.
 *
 * @example
 * ```ts
 * const { deleteDocument } = useDeleteDocument('jobs');
 * await deleteDocument(jobId);
 * ```
 */
export function useDeleteDocument(collectionName: string) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const deleteDocument = useCallback(
    async (docId: string): Promise<void> => {
      setLoading(true);
      setError(null);
      try {
        await deleteDoc(doc(db, collectionName, docId));
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to delete document';
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [collectionName],
  );

  return { deleteDocument, loading, error };
}
