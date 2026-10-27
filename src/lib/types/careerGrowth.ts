// ============================================================
// Career Growth & Skill Development — Type Definitions
// ============================================================

// ===== SKILL CATEGORY =====
export interface SkillCategory {
  id: string;
  name: string;
  nameTamil?: string;
  description: string;
  iconUrl?: string;
  iconEmoji?: string;
  order: number;
  isActive: boolean;
  courseCount: number;
  createdAt: any;
  updatedAt: any;
}

// ===== COURSE =====
export type CourseStatus = 'draft' | 'pending_review' | 'published' | 'unpublished' | 'archived';
export type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced';
export type CourseLanguage = 'tamil' | 'english' | 'both';

export interface Course {
  id: string;
  title: string;
  slug: string;
  shortDescription: string;
  fullDescription: string;
  categoryId: string;
  categoryName?: string;
  thumbnailUrl?: string;
  instructorName: string;
  instructorProfile?: string;
  instructorPhotoUrl?: string;
  difficulty: DifficultyLevel;
  duration: string;
  durationMinutes?: number;
  language: CourseLanguage;
  learningObjectives: string[];
  prerequisites: string[];
  lessonCount: number;
  quizRequired: boolean;
  certificateEligible: boolean;
  visibility: 'public' | 'enrolled_only' | 'private';
  status: CourseStatus;
  enrollmentCount: number;
  completionCount: number;
  rating: number;
  reviewCount: number;
  tags: string[];
  createdBy: string;
  reviewedBy?: string;
  reviewNote?: string;
  publishedAt?: any;
  createdAt: any;
  updatedAt: any;
}

// ===== LEARNING PATH =====
export type LearningPathStatus = 'draft' | 'published' | 'unpublished' | 'archived';

export interface LearningPathCourse {
  courseId: string;
  courseTitle?: string;
  order: number;
  isRequired: boolean;
  prerequisiteCourseIds: string[];
}

export interface LearningPath {
  id: string;
  title: string;
  slug: string;
  description: string;
  careerGoal: string;
  thumbnailUrl?: string;
  courses: LearningPathCourse[];
  estimatedDuration: string;
  estimatedDurationMinutes?: number;
  difficulty: DifficultyLevel;
  completionRequirements: string;
  status: LearningPathStatus;
  enrollmentCount: number;
  completionCount: number;
  tags: string[];
  createdBy: string;
  publishedAt?: any;
  createdAt: any;
  updatedAt: any;
}

// ===== LESSON =====
export type LessonType = 'text' | 'video' | 'document' | 'external_resource' | 'assignment' | 'quiz';

export interface Lesson {
  id: string;
  courseId: string;
  title: string;
  description: string;
  type: LessonType;
  content: string;
  videoUrl?: string;
  documentUrl?: string;
  externalUrl?: string;
  order: number;
  estimatedMinutes: number;
  isRequired: boolean;
  completionCriteria: 'view' | 'time_spent' | 'quiz_pass' | 'assignment_submit';
  status: 'draft' | 'published';
  createdBy: string;
  createdAt: any;
  updatedAt: any;
}

// ===== QUIZ & ASSESSMENT =====
export type QuestionType = 'multiple_choice' | 'multiple_answer' | 'true_false';

export interface QuizQuestion {
  id: string;
  questionText: string;
  questionType: QuestionType;
  options: string[];
  /** Index(es) of correct options. Stored server-side, never sent to client before submission. */
  correctAnswers: number[];
  explanation?: string;
  points: number;
  order: number;
}

export interface Quiz {
  id: string;
  courseId: string;
  lessonId?: string;
  title: string;
  description: string;
  questions: QuizQuestion[];
  passPercentage: number;
  maxAttempts: number;
  timeLimitMinutes: number;
  randomizeQuestions: boolean;
  status: 'draft' | 'published';
  createdBy: string;
  createdAt: any;
  updatedAt: any;
}

export interface QuizAttempt {
  id: string;
  quizId: string;
  courseId: string;
  seekerId: string;
  answers: Record<string, number[]>;
  /** Server-calculated score, never trust client */
  score: number;
  totalPoints: number;
  percentage: number;
  passed: boolean;
  timeTakenSeconds: number;
  attemptNumber: number;
  completedAt: any;
  createdAt: any;
}

// ===== ENROLLMENT & PROGRESS =====
export type EnrollmentStatus = 'active' | 'completed' | 'dropped';

export interface Enrollment {
  id: string;
  seekerId: string;
  seekerName?: string;
  seekerEmail?: string;
  courseId: string;
  courseTitle?: string;
  learningPathId?: string;
  learningPathTitle?: string;
  status: EnrollmentStatus;
  progressPercentage: number;
  completedLessons: string[];
  lastAccessedLessonId?: string;
  lastAccessedAt?: any;
  quizAttemptCount: number;
  bestQuizScore?: number;
  certificateEligible: boolean;
  certificateId?: string;
  enrolledAt: any;
  completedAt?: any;
  updatedAt: any;
}

export interface LessonProgress {
  id: string;
  seekerId: string;
  courseId: string;
  lessonId: string;
  enrollmentId: string;
  isCompleted: boolean;
  timeSpentSeconds: number;
  completedAt?: any;
  createdAt: any;
  updatedAt: any;
}

// ===== CERTIFICATE =====
export type CertificateStatus = 'issued' | 'revoked';

export interface Certificate {
  id: string;
  verificationId: string;
  seekerId: string;
  seekerName: string;
  seekerEmail?: string;
  courseId: string;
  courseTitle: string;
  learningPathId?: string;
  learningPathTitle?: string;
  status: CertificateStatus;
  issueDate: any;
  quizScore?: number;
  completionDate: any;
  revokedAt?: any;
  revokedBy?: string;
  revokedReason?: string;
  templateId?: string;
  createdAt: any;
}

// ===== CERTIFICATE TEMPLATE =====
export interface CertificateTemplate {
  id: string;
  title: string;
  organizationName: string;
  logoUrl?: string;
  primaryColor: string;
  secondaryColor: string;
  eligibilityRules: {
    requireCourseCompletion: boolean;
    minimumQuizScore?: number;
    requireAllLessons: boolean;
  };
  isDefault: boolean;
  createdBy: string;
  createdAt: any;
  updatedAt: any;
}

// ===== AI CONTENT ASSISTANT =====
export type AIContentType =
  | 'course_outline'
  | 'lesson_content'
  | 'quiz_questions'
  | 'learning_objectives'
  | 'prerequisites'
  | 'career_path'
  | 'skill_gap_analysis';

export interface AIContentRequest {
  id: string;
  contentType: AIContentType;
  prompt: string;
  context?: string;
  generatedContent: string;
  status: 'draft' | 'approved' | 'rejected';
  reviewedBy?: string;
  reviewNote?: string;
  createdBy: string;
  createdAt: any;
  updatedAt: any;
}

// ===== CAREER GROWTH SETTINGS =====
export interface CareerGrowthSettings {
  enableAIAssistant: boolean;
  enableCertificates: boolean;
  enableLearningPaths: boolean;
  defaultCertificateTemplateId?: string;
  maxEnrollmentsPerSeeker: number;
  requireQuizForCertificate: boolean;
  minimumQuizScore: number;
  updatedBy?: string;
  updatedAt?: any;
}

// ===== ADMIN CAREER GROWTH STATS =====
export interface CareerGrowthStats {
  totalCourses: number;
  publishedCourses: number;
  draftCourses: number;
  totalLearningPaths: number;
  activeEnrollments: number;
  completedLearningPaths: number;
  completionPercentage: number;
  pendingReviews: number;
  certificatesIssued: number;
  totalQuizAttempts: number;
}
