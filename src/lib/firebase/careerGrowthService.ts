'use client';

import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  getDoc,
  setDoc,
  query,
  where,
  orderBy,
  limit,
  getCountFromServer,
  serverTimestamp,
  increment,
  runTransaction,
  Timestamp,
  type DocumentData,
  type QueryConstraint,
} from 'firebase/firestore';
import { db } from './config';
import type {
  SkillCategory,
  Course,
  LearningPath,
  Lesson,
  Quiz,
  QuizQuestion,
  QuizAttempt,
  Enrollment,
  LessonProgress,
  Certificate,
  CertificateTemplate,
  CareerGrowthStats,
  CareerGrowthSettings,
  AIContentRequest,
} from '@/lib/types/careerGrowth';

// ============================================================
// HELPERS
// ============================================================

function normaliseTimestamps<T extends DocumentData>(data: T): T {
  const result: DocumentData = { ...data };
  for (const key of Object.keys(result)) {
    if (result[key] instanceof Timestamp) {
      result[key] = (result[key] as Timestamp).toDate();
    }
  }
  return result as T;
}

async function fetchCollection<T>(
  collectionName: string,
  constraints: QueryConstraint[] = [],
): Promise<T[]> {
  const q = constraints.length > 0
    ? query(collection(db, collectionName), ...constraints)
    : collection(db, collectionName);
  const snapshot = await getDocs(q);
  return snapshot.docs.map(
    (d) => ({ id: d.id, ...normaliseTimestamps(d.data()) }) as unknown as T,
  );
}

async function fetchDocument<T>(
  collectionName: string,
  docId: string,
): Promise<T | null> {
  const snap = await getDoc(doc(db, collectionName, docId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...normaliseTimestamps(snap.data()) } as unknown as T;
}

async function getCount(
  collectionName: string,
  constraints: QueryConstraint[] = [],
): Promise<number> {
  const q = constraints.length > 0
    ? query(collection(db, collectionName), ...constraints)
    : collection(db, collectionName);
  const snapshot = await getCountFromServer(q);
  return snapshot.data().count;
}

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
    .substring(0, 80)
    + '-' + Date.now().toString(36);
}

// ============================================================
// CAREER GROWTH STATS
// ============================================================

export async function getCareerGrowthStats(): Promise<CareerGrowthStats> {
  const [
    totalCourses,
    publishedCourses,
    draftCourses,
    totalLearningPaths,
    activeEnrollments,
    completedEnrollments,
    pendingReviews,
    certificatesIssued,
    totalQuizAttempts,
  ] = await Promise.all([
    getCount('skillCourses'),
    getCount('skillCourses', [where('status', '==', 'published')]),
    getCount('skillCourses', [where('status', '==', 'draft')]),
    getCount('learningPaths'),
    getCount('enrollments', [where('status', '==', 'active')]),
    getCount('enrollments', [where('status', '==', 'completed')]),
    getCount('skillCourses', [where('status', '==', 'pending_review')]),
    getCount('certificates'),
    getCount('quizAttempts'),
  ]);

  const completionPercentage =
    activeEnrollments + completedEnrollments > 0
      ? Math.round(
          (completedEnrollments / (activeEnrollments + completedEnrollments)) * 100,
        )
      : 0;

  return {
    totalCourses,
    publishedCourses,
    draftCourses,
    totalLearningPaths,
    activeEnrollments,
    completedLearningPaths: completedEnrollments,
    completionPercentage,
    pendingReviews,
    certificatesIssued,
    totalQuizAttempts,
  };
}

// ============================================================
// SKILL CATEGORIES
// ============================================================

export async function getSkillCategories(
  activeOnly = false,
): Promise<SkillCategory[]> {
  const constraints: QueryConstraint[] = [orderBy('order', 'asc')];
  if (activeOnly) constraints.unshift(where('isActive', '==', true));
  return fetchCollection<SkillCategory>('skillCategories', constraints);
}

export async function getSkillCategory(id: string): Promise<SkillCategory | null> {
  return fetchDocument<SkillCategory>('skillCategories', id);
}

export async function createSkillCategory(
  data: Omit<SkillCategory, 'id' | 'courseCount' | 'createdAt' | 'updatedAt'>,
): Promise<string> {
  const docRef = await addDoc(collection(db, 'skillCategories'), {
    ...data,
    courseCount: 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function updateSkillCategory(
  id: string,
  data: Partial<SkillCategory>,
): Promise<void> {
  const { id: _, createdAt, ...rest } = data as any;
  await updateDoc(doc(db, 'skillCategories', id), {
    ...rest,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteSkillCategory(id: string): Promise<void> {
  // Check for active courses before deleting
  const courseCount = await getCount('skillCourses', [
    where('categoryId', '==', id),
    where('status', 'in', ['published', 'draft', 'pending_review']),
  ]);
  if (courseCount > 0) {
    throw new Error(
      `Cannot delete category: ${courseCount} active course(s) still assigned. Reassign or archive them first.`,
    );
  }
  await deleteDoc(doc(db, 'skillCategories', id));
}

// ============================================================
// COURSES
// ============================================================

export async function getCourses(filters?: {
  status?: string;
  categoryId?: string;
  difficulty?: string;
  search?: string;
  limitCount?: number;
}): Promise<Course[]> {
  const constraints: QueryConstraint[] = [];
  if (filters?.status) constraints.push(where('status', '==', filters.status));
  if (filters?.categoryId) constraints.push(where('categoryId', '==', filters.categoryId));
  if (filters?.difficulty) constraints.push(where('difficulty', '==', filters.difficulty));
  constraints.push(orderBy('createdAt', 'desc'));
  if (filters?.limitCount) constraints.push(limit(filters.limitCount));
  return fetchCollection<Course>('skillCourses', constraints);
}

export async function getCourse(id: string): Promise<Course | null> {
  return fetchDocument<Course>('skillCourses', id);
}

export async function getCourseBySlug(slug: string): Promise<Course | null> {
  const results = await fetchCollection<Course>('skillCourses', [
    where('slug', '==', slug),
    limit(1),
  ]);
  return results[0] || null;
}

export async function createCourse(
  data: Omit<Course, 'id' | 'slug' | 'enrollmentCount' | 'completionCount' | 'rating' | 'reviewCount' | 'createdAt' | 'updatedAt'>,
): Promise<string> {
  const slug = generateSlug(data.title);
  const docRef = await addDoc(collection(db, 'skillCourses'), {
    ...data,
    slug,
    enrollmentCount: 0,
    completionCount: 0,
    rating: 0,
    reviewCount: 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  // Update category course count
  if (data.categoryId) {
    try {
      await updateDoc(doc(db, 'skillCategories', data.categoryId), {
        courseCount: increment(1),
        updatedAt: serverTimestamp(),
      });
    } catch {
      // Category may not exist yet
    }
  }

  return docRef.id;
}

export async function updateCourse(
  id: string,
  data: Partial<Course>,
): Promise<void> {
  const { id: _, createdAt, ...rest } = data as any;
  await updateDoc(doc(db, 'skillCourses', id), {
    ...rest,
    updatedAt: serverTimestamp(),
  });
}

export async function publishCourse(id: string): Promise<void> {
  const course = await getCourse(id);
  if (!course) throw new Error('Course not found');

  // Validate required fields before publishing
  if (!course.title?.trim()) throw new Error('Course title is required');
  if (!course.shortDescription?.trim()) throw new Error('Short description is required');
  if (!course.categoryId) throw new Error('Skill category is required');
  if (!course.instructorName?.trim()) throw new Error('Instructor name is required');

  // Validate lessons exist
  const lessonCount = await getCount('lessons', [
    where('courseId', '==', id),
    where('status', '==', 'published'),
  ]);
  if (lessonCount === 0) throw new Error('At least one published lesson is required');

  await updateDoc(doc(db, 'skillCourses', id), {
    status: 'published',
    publishedAt: serverTimestamp(),
    lessonCount,
    updatedAt: serverTimestamp(),
  });
}

export async function unpublishCourse(id: string): Promise<void> {
  await updateDoc(doc(db, 'skillCourses', id), {
    status: 'unpublished',
    updatedAt: serverTimestamp(),
  });
}

export async function archiveCourse(id: string): Promise<void> {
  await updateDoc(doc(db, 'skillCourses', id), {
    status: 'archived',
    updatedAt: serverTimestamp(),
  });
}

export async function duplicateCourse(id: string): Promise<string> {
  const course = await getCourse(id);
  if (!course) throw new Error('Course not found');

  const { id: _, slug: _slug, enrollmentCount, completionCount, rating, reviewCount, publishedAt, createdAt, updatedAt, ...rest } = course;

  return createCourse({
    ...rest,
    title: `${rest.title} (Copy)`,
    status: 'draft',
  });
}

// ============================================================
// LESSONS
// ============================================================

export async function getLessons(courseId: string): Promise<Lesson[]> {
  return fetchCollection<Lesson>('lessons', [
    where('courseId', '==', courseId),
    orderBy('order', 'asc'),
  ]);
}

export async function getLesson(id: string): Promise<Lesson | null> {
  return fetchDocument<Lesson>('lessons', id);
}

export async function createLesson(
  data: Omit<Lesson, 'id' | 'createdAt' | 'updatedAt'>,
): Promise<string> {
  const docRef = await addDoc(collection(db, 'lessons'), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function updateLesson(
  id: string,
  data: Partial<Lesson>,
): Promise<void> {
  const { id: _, createdAt, ...rest } = data as any;
  await updateDoc(doc(db, 'lessons', id), {
    ...rest,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteLesson(id: string): Promise<void> {
  await deleteDoc(doc(db, 'lessons', id));
}

export async function reorderLessons(
  courseId: string,
  orderedIds: string[],
): Promise<void> {
  await Promise.all(
    orderedIds.map((lessonId, index) =>
      updateDoc(doc(db, 'lessons', lessonId), {
        order: index + 1,
        updatedAt: serverTimestamp(),
      }),
    ),
  );
}

// ============================================================
// QUIZZES
// ============================================================

export async function getQuizzes(courseId: string): Promise<Quiz[]> {
  return fetchCollection<Quiz>('quizzes', [
    where('courseId', '==', courseId),
    orderBy('createdAt', 'desc'),
  ]);
}

export async function getQuiz(id: string): Promise<Quiz | null> {
  return fetchDocument<Quiz>('quizzes', id);
}

export async function createQuiz(
  data: Omit<Quiz, 'id' | 'createdAt' | 'updatedAt'>,
): Promise<string> {
  const docRef = await addDoc(collection(db, 'quizzes'), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function updateQuiz(
  id: string,
  data: Partial<Quiz>,
): Promise<void> {
  const { id: _, createdAt, ...rest } = data as any;
  await updateDoc(doc(db, 'quizzes', id), {
    ...rest,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteQuiz(id: string): Promise<void> {
  await deleteDoc(doc(db, 'quizzes', id));
}

/**
 * Get quiz questions for a learner — NEVER include correctAnswers.
 * Server-side validation only.
 */
export async function getQuizForLearner(
  quizId: string,
): Promise<Omit<Quiz, 'questions'> & { questions: Omit<QuizQuestion, 'correctAnswers'>[] } | null> {
  const quiz = await getQuiz(quizId);
  if (!quiz) return null;

  return {
    ...quiz,
    questions: quiz.questions.map(({ correctAnswers, ...q }) => q),
  };
}

/**
 * Submit quiz attempt — server-side answer validation.
 * Returns the attempt with server-calculated score.
 */
export async function submitQuizAttempt(
  quizId: string,
  seekerId: string,
  courseId: string,
  answers: Record<string, number[]>,
  timeTakenSeconds: number,
): Promise<QuizAttempt> {
  const quiz = await getQuiz(quizId);
  if (!quiz) throw new Error('Quiz not found');
  if (quiz.status !== 'published') throw new Error('Quiz is not available');

  // Check max attempts
  const existingAttempts = await getCount('quizAttempts', [
    where('quizId', '==', quizId),
    where('seekerId', '==', seekerId),
  ]);
  if (quiz.maxAttempts > 0 && existingAttempts >= quiz.maxAttempts) {
    throw new Error(`Maximum attempts (${quiz.maxAttempts}) reached`);
  }

  // Server-side score calculation
  let score = 0;
  let totalPoints = 0;
  for (const question of quiz.questions) {
    totalPoints += question.points;
    const userAnswer = answers[question.id] || [];
    const correct = question.correctAnswers;

    if (
      userAnswer.length === correct.length &&
      userAnswer.every((a) => correct.includes(a)) &&
      correct.every((c) => userAnswer.includes(c))
    ) {
      score += question.points;
    }
  }

  const percentage = totalPoints > 0 ? Math.round((score / totalPoints) * 100) : 0;
  const passed = percentage >= quiz.passPercentage;

  const attemptData = {
    quizId,
    courseId,
    seekerId,
    answers,
    score,
    totalPoints,
    percentage,
    passed,
    timeTakenSeconds,
    attemptNumber: existingAttempts + 1,
    completedAt: serverTimestamp(),
    createdAt: serverTimestamp(),
  };

  const docRef = await addDoc(collection(db, 'quizAttempts'), attemptData);

  return { id: docRef.id, ...attemptData } as unknown as QuizAttempt;
}

export async function getQuizAttempts(
  quizId: string,
  seekerId: string,
): Promise<QuizAttempt[]> {
  return fetchCollection<QuizAttempt>('quizAttempts', [
    where('quizId', '==', quizId),
    where('seekerId', '==', seekerId),
    orderBy('createdAt', 'desc'),
  ]);
}

// ============================================================
// LEARNING PATHS
// ============================================================

export async function getLearningPaths(filters?: {
  status?: string;
  limitCount?: number;
}): Promise<LearningPath[]> {
  const constraints: QueryConstraint[] = [];
  if (filters?.status) constraints.push(where('status', '==', filters.status));
  constraints.push(orderBy('createdAt', 'desc'));
  if (filters?.limitCount) constraints.push(limit(filters.limitCount));
  return fetchCollection<LearningPath>('learningPaths', constraints);
}

export async function getLearningPath(id: string): Promise<LearningPath | null> {
  return fetchDocument<LearningPath>('learningPaths', id);
}

export async function createLearningPath(
  data: Omit<LearningPath, 'id' | 'slug' | 'enrollmentCount' | 'completionCount' | 'createdAt' | 'updatedAt'>,
): Promise<string> {
  const slug = generateSlug(data.title);
  const docRef = await addDoc(collection(db, 'learningPaths'), {
    ...data,
    slug,
    enrollmentCount: 0,
    completionCount: 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function updateLearningPath(
  id: string,
  data: Partial<LearningPath>,
): Promise<void> {
  const { id: _, createdAt, ...rest } = data as any;
  await updateDoc(doc(db, 'learningPaths', id), {
    ...rest,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteLearningPath(id: string): Promise<void> {
  await deleteDoc(doc(db, 'learningPaths', id));
}

// ============================================================
// ENROLLMENTS
// ============================================================

export async function enrollInCourse(
  seekerId: string,
  seekerName: string,
  seekerEmail: string,
  courseId: string,
  courseTitle: string,
  learningPathId?: string,
  learningPathTitle?: string,
): Promise<string> {
  // Check for duplicate enrollment
  const existing = await fetchCollection<Enrollment>('enrollments', [
    where('seekerId', '==', seekerId),
    where('courseId', '==', courseId),
    where('status', 'in', ['active', 'completed']),
    limit(1),
  ]);
  if (existing.length > 0) {
    throw new Error('Already enrolled in this course');
  }

  const enrollment: Omit<Enrollment, 'id'> = {
    seekerId,
    seekerName,
    seekerEmail,
    courseId,
    courseTitle,
    learningPathId: learningPathId || '',
    learningPathTitle: learningPathTitle || '',
    status: 'active',
    progressPercentage: 0,
    completedLessons: [],
    quizAttemptCount: 0,
    certificateEligible: false,
    enrolledAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  const docRef = await addDoc(collection(db, 'enrollments'), enrollment);

  // Increment course enrollment count
  try {
    await updateDoc(doc(db, 'skillCourses', courseId), {
      enrollmentCount: increment(1),
      updatedAt: serverTimestamp(),
    });
  } catch {
    // Course may not exist
  }

  return docRef.id;
}

export async function getEnrollments(
  seekerId: string,
  status?: string,
): Promise<Enrollment[]> {
  const constraints: QueryConstraint[] = [
    where('seekerId', '==', seekerId),
  ];
  if (status) constraints.push(where('status', '==', status));
  constraints.push(orderBy('enrolledAt', 'desc'));
  return fetchCollection<Enrollment>('enrollments', constraints);
}

export async function getEnrollment(id: string): Promise<Enrollment | null> {
  return fetchDocument<Enrollment>('enrollments', id);
}

export async function getCourseEnrollment(
  seekerId: string,
  courseId: string,
): Promise<Enrollment | null> {
  const results = await fetchCollection<Enrollment>('enrollments', [
    where('seekerId', '==', seekerId),
    where('courseId', '==', courseId),
    where('status', 'in', ['active', 'completed']),
    limit(1),
  ]);
  return results[0] || null;
}

export async function getAllEnrollments(filters?: {
  courseId?: string;
  status?: string;
  limitCount?: number;
}): Promise<Enrollment[]> {
  const constraints: QueryConstraint[] = [];
  if (filters?.courseId) constraints.push(where('courseId', '==', filters.courseId));
  if (filters?.status) constraints.push(where('status', '==', filters.status));
  constraints.push(orderBy('enrolledAt', 'desc'));
  if (filters?.limitCount) constraints.push(limit(filters.limitCount));
  return fetchCollection<Enrollment>('enrollments', constraints);
}

// ============================================================
// LESSON PROGRESS
// ============================================================

export async function markLessonCompleted(
  seekerId: string,
  courseId: string,
  lessonId: string,
  enrollmentId: string,
  timeSpentSeconds: number,
): Promise<void> {
  const progressId = `${seekerId}_${lessonId}`;

  await setDoc(doc(db, 'lessonProgress', progressId), {
    seekerId,
    courseId,
    lessonId,
    enrollmentId,
    isCompleted: true,
    timeSpentSeconds,
    completedAt: serverTimestamp(),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }, { merge: true });

  // Update enrollment progress
  const enrollment = await getEnrollment(enrollmentId);
  if (enrollment) {
    const completedLessons = enrollment.completedLessons.includes(lessonId)
      ? enrollment.completedLessons
      : [...enrollment.completedLessons, lessonId];

    // Get total lesson count for this course
    const totalLessons = await getCount('lessons', [
      where('courseId', '==', courseId),
      where('status', '==', 'published'),
    ]);

    const progressPercentage = totalLessons > 0
      ? Math.round((completedLessons.length / totalLessons) * 100)
      : 0;

    const isCompleted = progressPercentage >= 100;

    await updateDoc(doc(db, 'enrollments', enrollmentId), {
      completedLessons,
      lastAccessedLessonId: lessonId,
      lastAccessedAt: serverTimestamp(),
      progressPercentage,
      status: isCompleted ? 'completed' : 'active',
      ...(isCompleted ? { completedAt: serverTimestamp() } : {}),
      updatedAt: serverTimestamp(),
    });

    // If completed, update course completion count
    if (isCompleted) {
      try {
        await updateDoc(doc(db, 'skillCourses', courseId), {
          completionCount: increment(1),
          updatedAt: serverTimestamp(),
        });
      } catch {
        // ignore
      }
    }
  }
}

export async function getLessonProgressForCourse(
  seekerId: string,
  courseId: string,
): Promise<LessonProgress[]> {
  return fetchCollection<LessonProgress>('lessonProgress', [
    where('seekerId', '==', seekerId),
    where('courseId', '==', courseId),
  ]);
}

// ============================================================
// CERTIFICATES
// ============================================================

export async function issueCertificate(
  seekerId: string,
  seekerName: string,
  seekerEmail: string,
  courseId: string,
  courseTitle: string,
  quizScore?: number,
  learningPathId?: string,
  learningPathTitle?: string,
): Promise<string> {
  // Verify completion server-side
  const enrollment = await getCourseEnrollment(seekerId, courseId);
  if (!enrollment || enrollment.status !== 'completed') {
    throw new Error('Course not completed. Cannot issue certificate.');
  }

  // Check for existing certificate
  const existing = await fetchCollection<Certificate>('certificates', [
    where('seekerId', '==', seekerId),
    where('courseId', '==', courseId),
    where('status', '==', 'issued'),
    limit(1),
  ]);
  if (existing.length > 0) {
    return existing[0].id;
  }

  const verificationId = `TNJOBS-CERT-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

  const docRef = await addDoc(collection(db, 'certificates'), {
    verificationId,
    seekerId,
    seekerName,
    seekerEmail,
    courseId,
    courseTitle,
    learningPathId: learningPathId || '',
    learningPathTitle: learningPathTitle || '',
    status: 'issued',
    issueDate: serverTimestamp(),
    quizScore: quizScore ?? null,
    completionDate: enrollment.completedAt || serverTimestamp(),
    createdAt: serverTimestamp(),
  });

  // Update enrollment
  await updateDoc(doc(db, 'enrollments', enrollment.id), {
    certificateEligible: true,
    certificateId: docRef.id,
    updatedAt: serverTimestamp(),
  });

  return docRef.id;
}

export async function getCertificates(seekerId: string): Promise<Certificate[]> {
  return fetchCollection<Certificate>('certificates', [
    where('seekerId', '==', seekerId),
    where('status', '==', 'issued'),
    orderBy('issueDate', 'desc'),
  ]);
}

export async function getCertificate(id: string): Promise<Certificate | null> {
  return fetchDocument<Certificate>('certificates', id);
}

export async function verifyCertificate(
  verificationId: string,
): Promise<Certificate | null> {
  const results = await fetchCollection<Certificate>('certificates', [
    where('verificationId', '==', verificationId),
    limit(1),
  ]);
  return results[0] || null;
}

export async function revokeCertificate(
  id: string,
  revokedBy: string,
  reason: string,
): Promise<void> {
  await updateDoc(doc(db, 'certificates', id), {
    status: 'revoked',
    revokedAt: serverTimestamp(),
    revokedBy,
    revokedReason: reason,
  });
}

export async function getAllCertificates(
  limitCount?: number,
): Promise<Certificate[]> {
  const constraints: QueryConstraint[] = [orderBy('issueDate', 'desc')];
  if (limitCount) constraints.push(limit(limitCount));
  return fetchCollection<Certificate>('certificates', constraints);
}

// ============================================================
// CERTIFICATE TEMPLATES
// ============================================================

export async function getCertificateTemplates(): Promise<CertificateTemplate[]> {
  return fetchCollection<CertificateTemplate>('certificateTemplates', [
    orderBy('createdAt', 'desc'),
  ]);
}

export async function createCertificateTemplate(
  data: Omit<CertificateTemplate, 'id' | 'createdAt' | 'updatedAt'>,
): Promise<string> {
  const docRef = await addDoc(collection(db, 'certificateTemplates'), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
}

// ============================================================
// CAREER GROWTH SETTINGS
// ============================================================

export async function getCareerGrowthSettings(): Promise<CareerGrowthSettings> {
  const snap = await getDoc(doc(db, 'settings', 'careerGrowth'));
  if (!snap.exists()) {
    // Return defaults
    return {
      enableAIAssistant: true,
      enableCertificates: true,
      enableLearningPaths: true,
      maxEnrollmentsPerSeeker: 10,
      requireQuizForCertificate: true,
      minimumQuizScore: 70,
    };
  }
  return snap.data() as CareerGrowthSettings;
}

export async function updateCareerGrowthSettings(
  data: Partial<CareerGrowthSettings>,
  updatedBy: string,
): Promise<void> {
  await setDoc(doc(db, 'settings', 'careerGrowth'), {
    ...data,
    updatedBy,
    updatedAt: serverTimestamp(),
  }, { merge: true });
}

// ============================================================
// AI CONTENT REQUESTS
// ============================================================

export async function saveAIContentRequest(
  data: Omit<AIContentRequest, 'id' | 'createdAt' | 'updatedAt'>,
): Promise<string> {
  const docRef = await addDoc(collection(db, 'aiContentRequests'), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function getAIContentRequests(
  limitCount = 20,
): Promise<AIContentRequest[]> {
  return fetchCollection<AIContentRequest>('aiContentRequests', [
    orderBy('createdAt', 'desc'),
    limit(limitCount),
  ]);
}

export async function updateAIContentRequest(
  id: string,
  data: Partial<AIContentRequest>,
): Promise<void> {
  const { id: _, createdAt, ...rest } = data as any;
  await updateDoc(doc(db, 'aiContentRequests', id), {
    ...rest,
    updatedAt: serverTimestamp(),
  });
}
