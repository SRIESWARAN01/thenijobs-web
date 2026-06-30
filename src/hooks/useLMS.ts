'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { collection, query, where, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useAuth } from '@/hooks/useAuth';
import { normaliseTimestamps } from '@/lib/firebase/serializers';
import type {
  Course, Enrollment, GamificationProfile, Certificate,
} from '@/lib/types/lms';
import {
  getUserEnrollments, getEnrollment, enrollInCourse,
  getGamificationProfile, getUserCertificates,
  getLeaderboard, listPublishedCourses, listFeaturedCourses,
  getModules, getLessons,
} from '@/lib/firebase/lmsService';
import type { CourseModule, Lesson } from '@/lib/types/lms';

// ===== useCourses — Real-time published course list =====

export function useCourses(categoryFilter?: string) {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const constraints = [where('isPublished', '==', true), orderBy('createdAt', 'desc')];
    const q = query(collection(db, 'courses'), ...constraints);

    const unsubscribe = onSnapshot(q, (snap) => {
      let list = snap.docs.map(d => ({ id: d.id, ...normaliseTimestamps(d.data()) }) as unknown as Course);
      if (categoryFilter) {
        list = list.filter(c => c.category === categoryFilter);
      }
      setCourses(list);
      setLoading(false);
    }, (err) => {
      console.error('[useCourses] Error:', err);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [categoryFilter]);

  return { courses, loading };
}

// ===== useAdminCourses — All courses for admin =====

export function useAdminCourses() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'courses'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snap) => {
      setCourses(snap.docs.map(d => ({ id: d.id, ...normaliseTimestamps(d.data()) }) as unknown as Course));
      setLoading(false);
    }, (err) => {
      console.error('[useAdminCourses] Error:', err);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  return { courses, loading };
}

// ===== useEnrollment — Current user's enrollment for a course =====

export function useEnrollment(courseId: string) {
  const { user } = useAuth();
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.uid || !courseId) {
      setEnrollment(null);
      setLoading(false);
      return;
    }

    const enrollId = `${user.uid}_${courseId}`;
    const unsubscribe = onSnapshot(
      collection(db, 'enrollments'),
      { includeMetadataChanges: false },
      () => {
        // Re-fetch on any change
        getEnrollment(user.uid, courseId).then(e => {
          setEnrollment(e);
          setLoading(false);
        });
      },
    );

    // Also do initial fetch
    getEnrollment(user.uid, courseId).then(e => {
      setEnrollment(e);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user?.uid, courseId]);

  const enroll = useCallback(async (courseName: string) => {
    if (!user?.uid) return null;
    return enrollInCourse(user.uid, courseId, courseName);
  }, [user?.uid, courseId]);

  return { enrollment, loading, enroll };
}

// ===== useMyEnrollments — All enrollments for current user =====

export function useMyEnrollments() {
  const { user } = useAuth();
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.uid) {
      setEnrollments([]);
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'enrollments'),
      where('userId', '==', user.uid),
      orderBy('lastAccessedAt', 'desc'),
    );

    const unsubscribe = onSnapshot(q, (snap) => {
      setEnrollments(snap.docs.map(d => ({ id: d.id, ...normaliseTimestamps(d.data()) }) as unknown as Enrollment));
      setLoading(false);
    }, (err) => {
      console.error('[useMyEnrollments] Error:', err);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user?.uid]);

  return { enrollments, loading };
}

// ===== useCourseContent — Modules + Lessons for a course =====

export function useCourseContent(courseId: string) {
  const [modules, setModules] = useState<(CourseModule & { lessons: Lesson[] })[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalLessons, setTotalLessons] = useState(0);

  useEffect(() => {
    if (!courseId) return;
    setLoading(true);

    (async () => {
      try {
        const mods = await getModules(courseId);
        let count = 0;
        const modsWithLessons = await Promise.all(
          mods.map(async (mod) => {
            const lessons = await getLessons(courseId, mod.id);
            count += lessons.length;
            return { ...mod, lessons };
          }),
        );
        setModules(modsWithLessons);
        setTotalLessons(count);
      } catch (err) {
        console.error('[useCourseContent] Error:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, [courseId]);

  return { modules, totalLessons, loading };
}

// ===== useGamification — Current user's gamification profile =====

export function useGamification() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<GamificationProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.uid) {
      setProfile(null);
      setLoading(false);
      return;
    }

    const unsubscribe = onSnapshot(
      collection(db, 'gamification'),
      () => {
        getGamificationProfile(user.uid).then(p => {
          setProfile(p);
          setLoading(false);
        });
      },
    );

    getGamificationProfile(user.uid).then(p => {
      setProfile(p);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user?.uid]);

  return { profile, loading };
}

// ===== useMyCertificates =====

export function useMyCertificates() {
  const { user } = useAuth();
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.uid) {
      setCertificates([]);
      setLoading(false);
      return;
    }

    getUserCertificates(user.uid).then(certs => {
      setCertificates(certs);
      setLoading(false);
    }).catch(err => {
      console.error('[useMyCertificates] Error:', err);
      setLoading(false);
    });
  }, [user?.uid]);

  return { certificates, loading };
}

// ===== useLeaderboard =====

export function useLeaderboard(count = 50) {
  const [data, setData] = useState<GamificationProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getLeaderboard(count).then(d => {
      setData(d);
      setLoading(false);
    }).catch(err => {
      console.error('[useLeaderboard] Error:', err);
      setLoading(false);
    });
  }, [count]);

  return { data, loading };
}
