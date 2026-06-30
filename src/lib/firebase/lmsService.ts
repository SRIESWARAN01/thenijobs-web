'use client';

import {
  collection, doc, addDoc, setDoc, updateDoc, deleteDoc,
  getDocs, getDoc, query, where, orderBy, limit,
  serverTimestamp, Timestamp, increment, writeBatch,
  getCountFromServer,
  type DocumentData, type QueryConstraint,
} from 'firebase/firestore';
import { db } from './config';
import { normaliseTimestamps } from './serializers';
import type {
  Course, CourseModule, Lesson, Quiz, QuizQuestion,
  Enrollment, EnrollmentProgress, QuizAttempt,
  Certificate, CertificateTemplate,
  GamificationProfile, Badge, AchievementLevel,
  AdminLMSStats, CourseAnalytics, UserPerformance,
  CompletedCourseEntry, EarnedCertificateEntry,
} from '../types/lms';
import { XP_EVENTS, LEVEL_THRESHOLDS, BADGE_DEFINITIONS } from '../types/lms';

// ============================================================
// HELPERS
// ============================================================

async function fetchLMSCollection<T>(
  path: string,
  constraints: QueryConstraint[] = [],
): Promise<T[]> {
  const q = constraints.length > 0
    ? query(collection(db, path), ...constraints)
    : collection(db, path);
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...normaliseTimestamps(d.data()) }) as unknown as T);
}

async function fetchLMSDoc<T>(path: string, docId: string): Promise<T | null> {
  const snap = await getDoc(doc(db, path, docId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...normaliseTimestamps(snap.data()) } as unknown as T;
}

function generateCertNumber(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let id = '';
  for (let i = 0; i < 6; i++) id += chars.charAt(Math.floor(Math.random() * chars.length));
  return `TNI-CERT-${id}`;
}

function getLevel(xp: number): AchievementLevel {
  if (xp >= LEVEL_THRESHOLDS.master) return 'master';
  if (xp >= LEVEL_THRESHOLDS.expert) return 'expert';
  if (xp >= LEVEL_THRESHOLDS.achiever) return 'achiever';
  if (xp >= LEVEL_THRESHOLDS.learner) return 'learner';
  return 'beginner';
}

// ============================================================
// COURSES CRUD
// ============================================================

export async function createCourse(data: Omit<Course, 'id' | 'createdAt' | 'updatedAt' | 'enrollmentCount' | 'completionCount' | 'avgRating'>): Promise<string> {
  const ref = await addDoc(collection(db, 'courses'), {
    ...data,
    enrollmentCount: 0,
    completionCount: 0,
    avgRating: 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateCourse(courseId: string, data: Partial<Course>): Promise<void> {
  await updateDoc(doc(db, 'courses', courseId), {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteCourse(courseId: string): Promise<void> {
  // Soft delete — mark as archived
  await updateDoc(doc(db, 'courses', courseId), {
    isPublished: false,
    status: 'archived',
    updatedAt: serverTimestamp(),
  });
}

export async function getCourse(courseId: string): Promise<Course | null> {
  return fetchLMSDoc<Course>('courses', courseId);
}

export async function listCourses(constraints: QueryConstraint[] = []): Promise<Course[]> {
  return fetchLMSCollection<Course>('courses', constraints);
}

export async function listPublishedCourses(): Promise<Course[]> {
  return fetchLMSCollection<Course>('courses', [
    where('isPublished', '==', true),
    orderBy('createdAt', 'desc'),
  ]);
}

export async function listFeaturedCourses(): Promise<Course[]> {
  return fetchLMSCollection<Course>('courses', [
    where('isPublished', '==', true),
    where('isFeatured', '==', true),
    limit(6),
  ]);
}

// ============================================================
// MODULES & LESSONS
// ============================================================

export async function addModule(courseId: string, data: Omit<CourseModule, 'id' | 'courseId' | 'createdAt' | 'lessonsCount'>): Promise<string> {
  const ref = await addDoc(collection(db, 'courses', courseId, 'modules'), {
    ...data,
    courseId,
    lessonsCount: 0,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateModule(courseId: string, moduleId: string, data: Partial<CourseModule>): Promise<void> {
  await updateDoc(doc(db, 'courses', courseId, 'modules', moduleId), data);
}

export async function deleteModule(courseId: string, moduleId: string): Promise<void> {
  await deleteDoc(doc(db, 'courses', courseId, 'modules', moduleId));
}

export async function getModules(courseId: string): Promise<CourseModule[]> {
  return fetchLMSCollection<CourseModule>(`courses/${courseId}/modules`, [orderBy('order', 'asc')]);
}

export async function addLesson(courseId: string, moduleId: string, data: Omit<Lesson, 'id' | 'courseId' | 'moduleId' | 'createdAt'>): Promise<string> {
  const ref = await addDoc(collection(db, 'courses', courseId, 'modules', moduleId, 'lessons'), {
    ...data,
    courseId,
    moduleId,
    createdAt: serverTimestamp(),
  });
  // Update lesson count
  await updateDoc(doc(db, 'courses', courseId, 'modules', moduleId), {
    lessonsCount: increment(1),
  });
  // Update course total
  await updateDoc(doc(db, 'courses', courseId), {
    totalLessons: increment(1),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateLesson(courseId: string, moduleId: string, lessonId: string, data: Partial<Lesson>): Promise<void> {
  await updateDoc(doc(db, 'courses', courseId, 'modules', moduleId, 'lessons', lessonId), data);
}

export async function deleteLesson(courseId: string, moduleId: string, lessonId: string): Promise<void> {
  await deleteDoc(doc(db, 'courses', courseId, 'modules', moduleId, 'lessons', lessonId));
  await updateDoc(doc(db, 'courses', courseId, 'modules', moduleId), { lessonsCount: increment(-1) });
  await updateDoc(doc(db, 'courses', courseId), { totalLessons: increment(-1), updatedAt: serverTimestamp() });
}

export async function getLessons(courseId: string, moduleId: string): Promise<Lesson[]> {
  return fetchLMSCollection<Lesson>(`courses/${courseId}/modules/${moduleId}/lessons`, [orderBy('order', 'asc')]);
}

export async function getAllCourseLessons(courseId: string): Promise<Lesson[]> {
  const modules = await getModules(courseId);
  const allLessons: Lesson[] = [];
  for (const mod of modules) {
    const lessons = await getLessons(courseId, mod.id);
    allLessons.push(...lessons);
  }
  return allLessons.sort((a, b) => a.order - b.order);
}

// ============================================================
// QUIZZES
// ============================================================

export async function createQuiz(data: Omit<Quiz, 'id' | 'createdAt'>): Promise<string> {
  const ref = await addDoc(collection(db, 'quizzes'), {
    ...data,
    createdAt: serverTimestamp(),
  });
  // Link quiz to module if moduleId is provided
  if (data.moduleId) {
    await updateDoc(doc(db, 'courses', data.courseId, 'modules', data.moduleId), {
      quizId: ref.id,
    });
  }
  return ref.id;
}

export async function updateQuiz(quizId: string, data: Partial<Quiz>): Promise<void> {
  await updateDoc(doc(db, 'quizzes', quizId), data);
}

export async function getQuiz(quizId: string): Promise<Quiz | null> {
  return fetchLMSDoc<Quiz>('quizzes', quizId);
}

export async function getCourseQuizzes(courseId: string): Promise<Quiz[]> {
  return fetchLMSCollection<Quiz>('quizzes', [where('courseId', '==', courseId)]);
}

export async function submitQuizAttempt(
  enrollmentId: string,
  quizId: string,
  answers: Record<string, number>,
  score: number,
  passed: boolean,
): Promise<void> {
  const enrollRef = doc(db, 'enrollments', enrollmentId);
  const enrollSnap = await getDoc(enrollRef);
  if (!enrollSnap.exists()) throw new Error('Enrollment not found');

  const existing = enrollSnap.data();
  const prevAttempts = existing.quizAttempts?.[quizId]?.attempts || 0;

  await updateDoc(enrollRef, {
    [`quizAttempts.${quizId}`]: {
      quizId,
      score,
      attempts: prevAttempts + 1,
      ...(passed ? { passedAt: serverTimestamp() } : {}),
      lastAttemptAt: serverTimestamp(),
      answers,
    },
    lastAccessedAt: serverTimestamp(),
  });
}

// ============================================================
// ENROLLMENT & PROGRESS
// ============================================================

export async function enrollInCourse(userId: string, courseId: string, courseName: string): Promise<string> {
  const enrollId = `${userId}_${courseId}`;
  const existing = await fetchLMSDoc<Enrollment>('enrollments', enrollId);
  if (existing) return enrollId; // Already enrolled

  // Get first module and lesson
  const modules = await getModules(courseId);
  let firstLessonId = '';
  let firstModuleId = modules[0]?.id || '';
  if (firstModuleId) {
    const lessons = await getLessons(courseId, firstModuleId);
    firstLessonId = lessons[0]?.id || '';
  }

  await setDoc(doc(db, 'enrollments', enrollId), {
    userId,
    courseId,
    courseName,
    status: 'active',
    enrolledAt: serverTimestamp(),
    progress: {
      completedLessons: [],
      currentModuleId: firstModuleId,
      currentLessonId: firstLessonId,
    },
    progressPercent: 0,
    totalWatchTime: 0,
    quizAttempts: {},
    lastAccessedAt: serverTimestamp(),
  });

  // Increment enrollment count
  await updateDoc(doc(db, 'courses', courseId), {
    enrollmentCount: increment(1),
  });

  return enrollId;
}

export async function getEnrollment(userId: string, courseId: string): Promise<Enrollment | null> {
  return fetchLMSDoc<Enrollment>('enrollments', `${userId}_${courseId}`);
}

export async function getUserEnrollments(userId: string): Promise<Enrollment[]> {
  return fetchLMSCollection<Enrollment>('enrollments', [
    where('userId', '==', userId),
    orderBy('lastAccessedAt', 'desc'),
  ]);
}

export async function markLessonComplete(
  enrollmentId: string,
  lessonId: string,
  courseId: string,
  totalLessons: number,
): Promise<{ progressPercent: number; courseCompleted: boolean }> {
  const enrollRef = doc(db, 'enrollments', enrollmentId);
  const enrollSnap = await getDoc(enrollRef);
  if (!enrollSnap.exists()) throw new Error('Enrollment not found');

  const data = enrollSnap.data();
  const completedLessons: string[] = data.progress?.completedLessons || [];

  if (!completedLessons.includes(lessonId)) {
    completedLessons.push(lessonId);
  }

  const progressPercent = totalLessons > 0
    ? Math.round((completedLessons.length / totalLessons) * 100)
    : 0;
  const courseCompleted = progressPercent >= 100;

  const updates: Record<string, any> = {
    'progress.completedLessons': completedLessons,
    progressPercent,
    lastAccessedAt: serverTimestamp(),
  };

  if (courseCompleted) {
    updates.status = 'completed';
    updates.completedAt = serverTimestamp();
  }

  await updateDoc(enrollRef, updates);

  if (courseCompleted) {
    await updateDoc(doc(db, 'courses', courseId), {
      completionCount: increment(1),
    });
  }

  return { progressPercent, courseCompleted };
}

export async function updateWatchTime(enrollmentId: string, seconds: number): Promise<void> {
  await updateDoc(doc(db, 'enrollments', enrollmentId), {
    totalWatchTime: increment(seconds),
    lastAccessedAt: serverTimestamp(),
  });
}

export async function updateCurrentLesson(enrollmentId: string, moduleId: string, lessonId: string): Promise<void> {
  await updateDoc(doc(db, 'enrollments', enrollmentId), {
    'progress.currentModuleId': moduleId,
    'progress.currentLessonId': lessonId,
    lastAccessedAt: serverTimestamp(),
  });
}

// ============================================================
// CERTIFICATES
// ============================================================

export async function generateCertificate(
  userId: string,
  courseId: string,
  enrollmentId: string,
  userName: string,
  userPhoto: string,
  courseName: string,
  templateId: string,
): Promise<Certificate> {
  const certNumber = generateCertNumber();
  const verificationUrl = `/verify/certificate/${certNumber}`;

  const certData = {
    userId,
    courseId,
    enrollmentId,
    userName,
    userPhoto,
    courseName,
    completionDate: serverTimestamp(),
    certificateNumber: certNumber,
    templateId,
    signatureUrl: '',
    qrCodeData: verificationUrl,
    verificationUrl,
    issuedAt: serverTimestamp(),
    isValid: true,
  };

  const ref = await addDoc(collection(db, 'certificates'), certData);

  // Link certificate to enrollment
  await updateDoc(doc(db, 'enrollments', enrollmentId), {
    certificateId: ref.id,
  });

  return { id: ref.id, ...certData } as unknown as Certificate;
}

export async function verifyCertificate(certNumber: string): Promise<Certificate | null> {
  const results = await fetchLMSCollection<Certificate>('certificates', [
    where('certificateNumber', '==', certNumber),
    limit(1),
  ]);
  return results[0] || null;
}

export async function getUserCertificates(userId: string): Promise<Certificate[]> {
  return fetchLMSCollection<Certificate>('certificates', [
    where('userId', '==', userId),
    orderBy('issuedAt', 'desc'),
  ]);
}

// ============================================================
// CERTIFICATE TEMPLATES
// ============================================================

export async function createCertificateTemplate(data: Omit<CertificateTemplate, 'id' | 'createdAt'>): Promise<string> {
  const ref = await addDoc(collection(db, 'certificateTemplates'), {
    ...data,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateCertificateTemplate(templateId: string, data: Partial<CertificateTemplate>): Promise<void> {
  await updateDoc(doc(db, 'certificateTemplates', templateId), data);
}

export async function getCertificateTemplates(): Promise<CertificateTemplate[]> {
  return fetchLMSCollection<CertificateTemplate>('certificateTemplates');
}

export async function getDefaultTemplate(): Promise<CertificateTemplate | null> {
  const templates = await fetchLMSCollection<CertificateTemplate>('certificateTemplates', [
    where('isDefault', '==', true),
    limit(1),
  ]);
  return templates[0] || null;
}

// ============================================================
// GAMIFICATION
// ============================================================

export async function getGamificationProfile(userId: string): Promise<GamificationProfile | null> {
  return fetchLMSDoc<GamificationProfile>('gamification', userId);
}

export async function addXP(userId: string, amount: number, reason: string): Promise<GamificationProfile> {
  const profileRef = doc(db, 'gamification', userId);
  const snap = await getDoc(profileRef);

  if (!snap.exists()) {
    const newProfile: Omit<GamificationProfile, 'userId'> = {
      xpTotal: amount,
      level: getLevel(amount),
      currentStreak: 0,
      longestStreak: 0,
      lastLearningDate: new Date().toISOString().split('T')[0],
      badges: [],
      achievements: [],
      weeklyXpHistory: [],
    };
    await setDoc(profileRef, { userId, ...newProfile });
    return { userId, ...newProfile };
  }

  const data = snap.data();
  const newXP = (data.xpTotal || 0) + amount;
  const newLevel = getLevel(newXP);

  await updateDoc(profileRef, {
    xpTotal: increment(amount),
    level: newLevel,
  });

  return { ...data, userId, xpTotal: newXP, level: newLevel } as GamificationProfile;
}

export async function updateStreak(userId: string): Promise<{ currentStreak: number; longestStreak: number }> {
  const profileRef = doc(db, 'gamification', userId);
  const snap = await getDoc(profileRef);
  const today = new Date().toISOString().split('T')[0];

  if (!snap.exists()) {
    await setDoc(profileRef, {
      userId,
      xpTotal: 0,
      level: 'beginner',
      currentStreak: 1,
      longestStreak: 1,
      lastLearningDate: today,
      badges: [],
      achievements: [],
      weeklyXpHistory: [],
    });
    return { currentStreak: 1, longestStreak: 1 };
  }

  const data = snap.data();
  const lastDate = data.lastLearningDate || '';

  if (lastDate === today) {
    return { currentStreak: data.currentStreak || 0, longestStreak: data.longestStreak || 0 };
  }

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  let newStreak: number;
  if (lastDate === yesterdayStr) {
    newStreak = (data.currentStreak || 0) + 1;
  } else {
    newStreak = 1;
  }

  const newLongest = Math.max(newStreak, data.longestStreak || 0);

  await updateDoc(profileRef, {
    currentStreak: newStreak,
    longestStreak: newLongest,
    lastLearningDate: today,
  });

  return { currentStreak: newStreak, longestStreak: newLongest };
}

export async function awardBadge(userId: string, badge: Badge): Promise<void> {
  const profileRef = doc(db, 'gamification', userId);
  const snap = await getDoc(profileRef);

  if (!snap.exists()) return;
  const existing = (snap.data().badges || []) as Badge[];
  if (existing.some(b => b.id === badge.id)) return; // Already has badge

  await updateDoc(profileRef, {
    badges: [...existing, badge],
  });
}

export async function getLeaderboard(limitCount = 50): Promise<GamificationProfile[]> {
  return fetchLMSCollection<GamificationProfile>('gamification', [
    orderBy('xpTotal', 'desc'),
    limit(limitCount),
  ]);
}

// ============================================================
// PORTFOLIO SYNC
// ============================================================

export async function syncCourseToProfile(
  userId: string,
  courseEntry: CompletedCourseEntry,
  earnedSkills: string[],
  certEntry?: EarnedCertificateEntry,
): Promise<void> {
  const profileRef = doc(db, 'seekerProfiles', userId);
  const snap = await getDoc(profileRef);
  if (!snap.exists()) return;

  const data = snap.data();
  const completedCourses = data.completedCourses || [];
  const existingSkills: string[] = data.skills || [];
  const earnedCertificates = data.earnedCertificates || [];

  // Avoid duplicates
  if (!completedCourses.some((c: any) => c.courseId === courseEntry.courseId)) {
    completedCourses.push(courseEntry);
  }

  const mergedSkills = Array.from(new Set([...existingSkills, ...earnedSkills]));

  const updates: Record<string, any> = {
    completedCourses,
    skills: mergedSkills,
  };

  if (certEntry && !earnedCertificates.some((c: any) => c.certificateId === certEntry.certificateId)) {
    updates.earnedCertificates = [...earnedCertificates, certEntry];
  }

  await updateDoc(profileRef, updates);
}

// ============================================================
// ADMIN ANALYTICS
// ============================================================

export async function getAdminLMSStats(): Promise<AdminLMSStats> {
  const [courses, enrollments, certificates] = await Promise.all([
    fetchLMSCollection<Course>('courses'),
    fetchLMSCollection<Enrollment>('enrollments'),
    getCountFromServer(collection(db, 'certificates')),
  ]);

  const publishedCourses = courses.filter(c => c.isPublished);
  const uniqueLearners = new Set(enrollments.map(e => e.userId));
  const activeLearners = new Set(
    enrollments.filter(e => e.status === 'active').map(e => e.userId)
  );
  const completedEnrollments = enrollments.filter(e => e.status === 'completed');
  const totalWatchTimeHours = enrollments.reduce((sum, e) => sum + ((e.totalWatchTime || 0) / 3600), 0);

  const courseEnrollmentMap: Record<string, number> = {};
  enrollments.forEach(e => {
    courseEnrollmentMap[e.courseId] = (courseEnrollmentMap[e.courseId] || 0) + 1;
  });

  const mostPopular = Object.entries(courseEnrollmentMap)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([courseId, enrollmentCount]) => {
      const course = courses.find(c => c.id === courseId);
      return { courseId, courseName: course?.title || 'Unknown', enrollments: enrollmentCount };
    });

  return {
    totalLearners: uniqueLearners.size,
    activeLearners: activeLearners.size,
    courseCompletionRate: enrollments.length > 0
      ? Math.round((completedEnrollments.length / enrollments.length) * 100)
      : 0,
    totalCourses: courses.length,
    publishedCourses: publishedCourses.length,
    totalWatchTime: Math.round(totalWatchTimeHours * 10) / 10,
    totalCertificates: certificates.data().count,
    mostPopularCourses: mostPopular,
  };
}

// ============================================================
// LMS NOTIFICATIONS
// ============================================================

export async function createLMSNotification(
  userId: string,
  type: string,
  title: string,
  message: string,
  actionUrl?: string,
): Promise<void> {
  await addDoc(collection(db, 'notifications'), {
    userId,
    type,
    title,
    message,
    read: false,
    actionUrl: actionUrl || null,
    createdAt: serverTimestamp(),
  });
}
