'use client';

import { useState, useCallback, useEffect } from 'react';

export interface RecentlyViewedJob {
  id: string;
  title: string;
  companyName: string;
  district: string;
  jobType: string;
  salaryMin?: number;
  salaryMax?: number;
  viewedAt: number; // timestamp
}

const STORAGE_KEY = 'thenijobs_recently_viewed';
const MAX_ITEMS = 10;

function getStoredJobs(): RecentlyViewedJob[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function storeJobs(jobs: RecentlyViewedJob[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(jobs));
  } catch {
    // localStorage might be full
  }
}

export function useRecentlyViewed() {
  const [recentJobs, setRecentJobs] = useState<RecentlyViewedJob[]>([]);

  // Load on mount
  useEffect(() => {
    setRecentJobs(getStoredJobs());
  }, []);

  const addToRecentlyViewed = useCallback((job: Omit<RecentlyViewedJob, 'viewedAt'>) => {
    setRecentJobs(prev => {
      // Remove if already exists
      const filtered = prev.filter(j => j.id !== job.id);
      // Add to the front
      const updated = [{ ...job, viewedAt: Date.now() }, ...filtered].slice(0, MAX_ITEMS);
      storeJobs(updated);
      return updated;
    });
  }, []);

  const clearRecentlyViewed = useCallback(() => {
    setRecentJobs([]);
    storeJobs([]);
  }, []);

  return { recentJobs, addToRecentlyViewed, clearRecentlyViewed };
}
