// ============================================================
// LMS (Learning Management System) Types for THENIJOBS Academy
// ============================================================

import type { Timestamp } from 'firebase/firestore';

// ===== COURSE =====

export type CourseDifficulty = 'beginner' | 'intermediate' | 'advanced';
export type CourseStatus = 'draft' | 'published' | 'archived';
export type LessonType = 'video' | 'text' | 'quiz';
export type QuizType = 'module' | 'final';
export type EnrollmentStatus = 'active' | 'completed' | 'dropped';

export interface Course {
  id: string;
  title: string;
  description: string;
  category: string;
  thumbnail: string;
  difficulty: CourseDifficulty;
  totalModules: number;
  totalLessons: number;
  estimatedHours: number;
  skills: string[];
  prerequisites: string[];
  certificateTemplateId: string;
  isPublished: boolean;
  isFeatured: boolean;
  enrollmentCount: number;
  completionCount: number;
  avgRating: number;
  createdBy: string;
  createdAt: Timestamp | Date;
  updatedAt: Timestamp | Date;
}

export interface CourseModule {
  id: string;
  courseId: string;
  title: string;
  description: string;
  order: number;
  quizId?: string;
  lessonsCount: number;
  createdAt: Timestamp | Date;
}

export interface Lesson {
  id: string;
  courseId: string;
  moduleId: string;
  title: string;
  type: LessonType;
  youtubeVideoId?: string;
  videoDuration?: number; // seconds
  content?: string; // for text lessons
  order: number;
  isPreview: boolean;
  assignment?: LessonAssignment;
  createdAt: Timestamp | Date;
}

export interface LessonAssignment {
  title: string;
  description: string;
  type: 'text' | 'file' | 'link';
}

// ===== QUIZ =====

export interface Quiz {
  id: string;
  title: string;
  courseId: string;
  moduleId?: string;
  type: QuizType;
  passingScore: number; // percentage
  allowRetake: boolean;
  maxAttempts: number;
  timeLimit?: number; // minutes
  questions: QuizQuestion[];
  createdAt: Timestamp | Date;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number; // index
  explanation?: string;
}

// ===== ENROLLMENT & PROGRESS =====

export interface Enrollment {
  id: string; // `${userId}_${courseId}`
  userId: string;
  courseId: string;
  courseName: string;
  status: EnrollmentStatus;
  enrolledAt: Timestamp | Date;
  completedAt?: Timestamp | Date;
  progress: EnrollmentProgress;
  progressPercent: number; // 0-100
  totalWatchTime: number; // seconds
  quizAttempts: Record<string, QuizAttempt>;
  certificateId?: string;
  lastAccessedAt: Timestamp | Date;
}

export interface EnrollmentProgress {
  completedLessons: string[]; // lesson IDs
  currentModuleId: string;
  currentLessonId: string;
}

export interface QuizAttempt {
  quizId: string;
  score: number;
  attempts: number;
  passedAt?: Timestamp | Date;
  lastAttemptAt: Timestamp | Date;
  answers: Record<string, number>; // questionId -> selectedOption
}

export interface LessonWatchProgress {
  lessonId: string;
  enrollmentId: string;
  maxWatchedTime: number; // seconds
  totalWatchTime: number;
  completed: boolean;
  completedAt?: Timestamp | Date;
}

// ===== CERTIFICATE =====

export interface Certificate {
  id: string;
  userId: string;
  courseId: string;
  enrollmentId: string;
  userName: string;
  userPhoto: string;
  courseName: string;
  completionDate: Timestamp | Date;
  certificateNumber: string; // TNI-CERT-XXXXX
  templateId: string;
  signatureUrl: string;
  qrCodeData: string;
  verificationUrl: string;
  pdfUrl?: string; // Storage path
  issuedAt: Timestamp | Date;
  isValid: boolean;
}

export interface CertificateTemplate {
  id: string;
  name: string;
  backgroundImage: string;
  logoPosition: 'top-left' | 'top-center' | 'top-right';
  signatureImage: string;
  signatoryName: string;
  signatoryTitle: string;
  colorScheme: {
    primary: string;
    secondary: string;
    accent: string;
    text: string;
  };
  fontFamily: string;
  isDefault: boolean;
  createdBy: string;
  createdAt: Timestamp | Date;
}

// ===== GAMIFICATION =====

export type BadgeId =
  | 'first_course'
  | 'quiz_master'
  | 'speed_learner'
  | 'streak_7'
  | 'streak_30'
  | 'five_courses'
  | 'ten_courses'
  | 'perfect_score'
  | 'early_bird'
  | 'dedicated_learner';

export type AchievementLevel = 'beginner' | 'learner' | 'achiever' | 'expert' | 'master';

export interface Badge {
  id: BadgeId;
  name: string;
  description: string;
  icon: string;
  earnedAt: Timestamp | Date;
  courseId?: string;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  unlockedAt: Timestamp | Date;
}

export interface GamificationProfile {
  userId: string;
  xpTotal: number;
  level: AchievementLevel;
  currentStreak: number;
  longestStreak: number;
  lastLearningDate: string; // YYYY-MM-DD
  badges: Badge[];
  achievements: Achievement[];
  weeklyXpHistory: { week: string; xp: number }[];
}

// ===== LEARNER STATS =====

export interface LearnerStats {
  totalCourses: number;
  completedCourses: number;
  totalHours: number;
  currentStreak: number;
  xp: number;
  level: AchievementLevel;
  badgesCount: number;
}

export interface CompletedCourseEntry {
  courseId: string;
  courseName: string;
  completedAt: Timestamp | Date;
  certificateId?: string;
}

export interface EarnedCertificateEntry {
  certificateId: string;
  courseName: string;
  issuedAt: Timestamp | Date;
}

// ===== ADMIN ANALYTICS =====

export interface AdminLMSStats {
  totalLearners: number;
  activeLearners: number;
  courseCompletionRate: number;
  totalCourses: number;
  publishedCourses: number;
  totalWatchTime: number; // hours
  totalCertificates: number;
  mostPopularCourses: { courseId: string; courseName: string; enrollments: number }[];
}

export interface CourseAnalytics {
  courseId: string;
  courseName: string;
  enrollmentCount: number;
  completionCount: number;
  completionRate: number;
  avgWatchTime: number; // hours
  avgQuizScore: number;
  certificatesIssued: number;
}

export interface UserPerformance {
  userId: string;
  userName: string;
  userPhoto?: string;
  enrolledCourses: number;
  completedCourses: number;
  totalWatchTime: number;
  avgQuizScore: number;
  xpTotal: number;
  level: AchievementLevel;
  lastActiveAt?: Timestamp | Date;
}

// ===== XP CONFIGURATION =====

export const XP_EVENTS = {
  LESSON_COMPLETE: 10,
  QUIZ_PASS: 25,
  QUIZ_PERFECT: 50,
  COURSE_COMPLETE: 100,
  DAILY_STREAK: 5,
  FIRST_ENROLLMENT: 15,
  ASSIGNMENT_SUBMIT: 20,
} as const;

export const LEVEL_THRESHOLDS: Record<AchievementLevel, number> = {
  beginner: 0,
  learner: 100,
  achiever: 500,
  expert: 1500,
  master: 5000,
};

export const BADGE_DEFINITIONS: Record<BadgeId, { name: string; description: string; icon: string }> = {
  first_course: { name: 'First Steps', description: 'Completed your first course', icon: '🎯' },
  quiz_master: { name: 'Quiz Master', description: 'Passed 10 quizzes with 80%+', icon: '🧠' },
  speed_learner: { name: 'Speed Learner', description: 'Completed a course within 24 hours', icon: '⚡' },
  streak_7: { name: '7-Day Streak', description: 'Learned 7 days in a row', icon: '🔥' },
  streak_30: { name: '30-Day Streak', description: 'Learned 30 days in a row', icon: '💎' },
  five_courses: { name: 'Course Explorer', description: 'Completed 5 courses', icon: '🗺️' },
  ten_courses: { name: 'Knowledge Seeker', description: 'Completed 10 courses', icon: '📚' },
  perfect_score: { name: 'Perfect Score', description: 'Got 100% on a quiz', icon: '💯' },
  early_bird: { name: 'Early Bird', description: 'Started learning before 7 AM', icon: '🌅' },
  dedicated_learner: { name: 'Dedicated Learner', description: 'Spent 50+ hours learning', icon: '🏆' },
};

// ===== COURSE CATEGORIES =====

export const COURSE_CATEGORIES = [
  'Accounting & Finance',
  'Computer Skills',
  'Communication',
  'Digital Marketing',
  'Driving & Transport',
  'Office Administration',
  'Sales & Marketing',
  'Retail & Customer Service',
  'Agriculture',
  'Healthcare',
  'Manufacturing',
  'Construction',
  'Hospitality',
  'Education & Teaching',
  'Software & IT',
  'Business Management',
  'Personal Development',
  'Language Skills',
] as const;

export type CourseCategory = typeof COURSE_CATEGORIES[number];
