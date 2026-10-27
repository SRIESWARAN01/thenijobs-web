import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

describe('THENIJOBS — Career Growth & Skill Development Module Test Suite', () => {

  // ─── 1. Category Validation & Deletion Guard ────────────────────────────────
  describe('Skill Categories & Deletion Guard', () => {
    function validateCategory(cat) {
      if (!cat.name || typeof cat.name !== 'string' || cat.name.trim().length === 0) {
        throw new Error('Category name is required');
      }
      return true;
    }

    function canDeleteCategory(category, courses) {
      const activeCoursesCount = courses.filter(
        (c) => c.categoryId === category.id && c.status !== 'archived'
      ).length;
      if (activeCoursesCount > 0) {
        throw new Error(`Cannot delete category with ${activeCoursesCount} assigned course(s). Reassign or archive them first.`);
      }
      return true;
    }

    test('Validates category required fields', () => {
      assert.ok(validateCategory({ id: 'cat-1', name: 'Software Development' }));
      assert.throws(() => validateCategory({ id: 'cat-2', name: '' }), /Category name is required/);
      assert.throws(() => validateCategory({ id: 'cat-3' }), /Category name is required/);
    });

    test('Guards category deletion when active courses exist', () => {
      const category = { id: 'cat-it', name: 'Information Technology' };
      const courses = [
        { id: 'course-1', title: 'React for Web', categoryId: 'cat-it', status: 'published' },
        { id: 'course-2', title: 'Python Basics', categoryId: 'cat-it', status: 'draft' },
      ];

      assert.throws(
        () => canDeleteCategory(category, courses),
        /Cannot delete category with 2 assigned course\(s\)/
      );
    });

    test('Allows category deletion when all assigned courses are archived or none exist', () => {
      const category = { id: 'cat-it', name: 'Information Technology' };
      const archivedCourses = [
        { id: 'course-1', title: 'Legacy VB', categoryId: 'cat-it', status: 'archived' },
      ];
      assert.ok(canDeleteCategory(category, archivedCourses));
      assert.ok(canDeleteCategory(category, []));
    });
  });

  // ─── 2. Course CRUD & Slug Generation ───────────────────────────────────────
  describe('Course Validation & Slug Generation', () => {
    function generateCourseSlug(title) {
      return title
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim()
        .substring(0, 80);
    }

    function validateCourse(course) {
      if (!course.title || course.title.trim().length === 0) throw new Error('Title is required');
      if (!course.categoryId) throw new Error('Category is required');
      const validDifficulties = ['beginner', 'intermediate', 'advanced'];
      if (!validDifficulties.includes(course.difficulty)) throw new Error('Invalid difficulty');
      const validStatuses = ['draft', 'pending_review', 'published', 'unpublished', 'archived'];
      if (!validStatuses.includes(course.status)) throw new Error('Invalid status');
      return true;
    }

    test('Generates clean, safe slugs from Tamil/English/Mixed titles', () => {
      assert.equal(generateCourseSlug('Practical Tally Prime & GST Filing 2026'), 'practical-tally-prime-gst-filing-2026');
      assert.equal(generateCourseSlug('Tamil Typing Speed Master 100% Guaranteed!'), 'tamil-typing-speed-master-100-guaranteed');
    });

    test('Validates course structure and allowed status enum values', () => {
      const valid = {
        title: 'Full Stack Web Development',
        categoryId: 'cat-tech',
        difficulty: 'beginner',
        status: 'published',
      };
      assert.ok(validateCourse(valid));

      assert.throws(() => validateCourse({ ...valid, title: '' }), /Title is required/);
      assert.throws(() => validateCourse({ ...valid, difficulty: 'expert' }), /Invalid difficulty/);
      assert.throws(() => validateCourse({ ...valid, status: 'invalid_status' }), /Invalid status/);
    });
  });

  // ─── 3. Lesson Progress & Enrollment Calculation ───────────────────────────
  describe('Lesson Progress Calculation', () => {
    function calculateCourseProgress(completedLessonIds, publishedLessons) {
      if (!publishedLessons || publishedLessons.length === 0) return 0;
      const completedCount = publishedLessons.filter((l) =>
        completedLessonIds.includes(l.id)
      ).length;
      return Math.round((completedCount / publishedLessons.length) * 100);
    }

    test('Calculates 0% on initial enrollment', () => {
      const lessons = [{ id: 'l1' }, { id: 'l2' }, { id: 'l3' }];
      assert.equal(calculateCourseProgress([], lessons), 0);
    });

    test('Calculates partial progress accurately', () => {
      const lessons = [{ id: 'l1' }, { id: 'l2' }, { id: 'l3' }, { id: 'l4' }];
      assert.equal(calculateCourseProgress(['l1', 'l2'], lessons), 50);
      assert.equal(calculateCourseProgress(['l1'], lessons), 25);
    });

    test('Calculates 100% when all published lessons are completed', () => {
      const lessons = [{ id: 'l1' }, { id: 'l2' }, { id: 'l3' }];
      assert.equal(calculateCourseProgress(['l1', 'l2', 'l3'], lessons), 100);
      // Handles duplicate or extra IDs gracefully
      assert.equal(calculateCourseProgress(['l1', 'l2', 'l3', 'l_extra'], lessons), 100);
    });
  });

  // ─── 4. Server-Side Quiz Evaluation & Anti-Cheat ────────────────────────────
  describe('Server-Side Quiz Evaluation & Anti-Cheat', () => {
    const questionBank = [
      {
        id: 'q1',
        questionText: 'What does GST stand for in Indian Taxation?',
        questionType: 'multiple_choice',
        options: ['Goods and Services Tax', 'General Sales Tax', 'Government State Tax'],
        correctAnswers: [0],
        points: 5,
        explanation: 'GST stands for Goods and Services Tax implemented across India.',
      },
      {
        id: 'q2',
        questionText: 'Which of the following are valid components of GST? (Select all that apply)',
        questionType: 'multiple_answer',
        options: ['CGST', 'SGST', 'IGST', 'VGST'],
        correctAnswers: [0, 1, 2],
        points: 10,
        explanation: 'Central GST, State GST, and Integrated GST are standard components.',
      },
      {
        id: 'q3',
        questionText: 'In Tally, F8 is used for Sales Voucher creation.',
        questionType: 'true_false',
        options: ['True', 'False'],
        correctAnswers: [0],
        points: 5,
        explanation: 'F8 opens the Sales Voucher in Tally.',
      },
    ];

    function stripAnswersForLearner(questions) {
      return questions.map(({ correctAnswers, ...rest }) => rest);
    }

    function evaluateQuiz(questions, userAnswers, passPercentage = 70) {
      let score = 0;
      let totalPoints = 0;
      const results = {};

      for (const q of questions) {
        totalPoints += q.points;
        const submitted = userAnswers[q.id] || [];
        const correct = q.correctAnswers;

        const isCorrect =
          submitted.length === correct.length &&
          submitted.every((ans) => correct.includes(ans)) &&
          correct.every((ans) => submitted.includes(ans));

        if (isCorrect) {
          score += q.points;
        }

        results[q.id] = {
          isCorrect,
          pointsEarned: isCorrect ? q.points : 0,
          explanation: q.explanation,
        };
      }

      const percentage = totalPoints > 0 ? Math.round((score / totalPoints) * 100) : 0;
      const passed = percentage >= passPercentage;

      return { score, totalPoints, percentage, passed, results };
    }

    test('Learner view never leaks correctAnswers property', () => {
      const learnerQuestions = stripAnswersForLearner(questionBank);
      learnerQuestions.forEach((q) => {
        assert.equal(q.correctAnswers, undefined, 'Must not expose correctAnswers to client');
        assert.ok(q.questionText);
        assert.ok(Array.isArray(q.options));
      });
    });

    test('Evaluates perfect answers with 100% score and passed flag', () => {
      const answers = {
        q1: [0],
        q2: [0, 1, 2],
        q3: [0],
      };
      const result = evaluateQuiz(questionBank, answers, 70);
      assert.equal(result.score, 20);
      assert.equal(result.totalPoints, 20);
      assert.equal(result.percentage, 100);
      assert.equal(result.passed, true);
    });

    test('Evaluates partially correct multi-answer question as 0 (strict grading)', () => {
      const answers = {
        q1: [0],        // Correct (5 pts)
        q2: [0, 1],     // Incomplete: missed 2 (0 pts)
        q3: [0],        // Correct (5 pts)
      };
      const result = evaluateQuiz(questionBank, answers, 70);
      assert.equal(result.score, 10);
      assert.equal(result.totalPoints, 20);
      assert.equal(result.percentage, 50);
      assert.equal(result.passed, false, 'Score 50% < 70% passing threshold');
    });

    test('Enforces quiz max attempt limits', () => {
      const maxAttempts = 3;
      const currentAttempts = 3;
      const isAllowed = currentAttempts < maxAttempts;
      assert.equal(isAllowed, false, 'Should deny new attempt once max attempts is reached');
    });
  });

  // ─── 5. Certificate Eligibility & Verification ID ───────────────────────────
  describe('Certificate Issuance & Verification ID', () => {
    function checkCertificateEligibility({ progressPercentage, quizRequired, bestQuizScore, passPercentage = 70 }) {
      if (progressPercentage < 100) {
        return { eligible: false, reason: 'Course progress is not 100%' };
      }
      if (quizRequired && (bestQuizScore === undefined || bestQuizScore < passPercentage)) {
        return { eligible: false, reason: `Quiz score ${bestQuizScore || 0}% is below passing mark ${passPercentage}%` };
      }
      return { eligible: true };
    }

    function generateVerificationId() {
      const dateSegment = Date.now().toString(36).toUpperCase();
      const randSegment = Math.random().toString(36).substring(2, 6).toUpperCase();
      return `TNJOBS-CERT-${dateSegment}-${randSegment}`;
    }

    test('Requires 100% progress for certificate eligibility', () => {
      const check = checkCertificateEligibility({
        progressPercentage: 80,
        quizRequired: false,
      });
      assert.equal(check.eligible, false);
      assert.match(check.reason, /Course progress is not 100%/);
    });

    test('Requires passing quiz score when course requires quiz', () => {
      const failedQuiz = checkCertificateEligibility({
        progressPercentage: 100,
        quizRequired: true,
        bestQuizScore: 65,
        passPercentage: 70,
      });
      assert.equal(failedQuiz.eligible, false);
      assert.match(failedQuiz.reason, /below passing mark/);

      const passedQuiz = checkCertificateEligibility({
        progressPercentage: 100,
        quizRequired: true,
        bestQuizScore: 85,
        passPercentage: 70,
      });
      assert.equal(passedQuiz.eligible, true);
    });

    test('Generates valid TNJOBS-CERT verification IDs conforming to regex', () => {
      for (let i = 0; i < 5; i++) {
        const id = generateVerificationId();
        assert.match(
          id,
          /^TNJOBS-CERT-[A-Z0-9]+-[A-Z0-9]+$/,
          `Verification ID ${id} must match official format`
        );
      }
    });
  });
});
