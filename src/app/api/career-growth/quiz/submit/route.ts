import { NextRequest, NextResponse } from 'next/server';
import { getAdminFirestore } from '@/lib/firebase/firebaseAdmin';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      quizId,
      seekerId,
      courseId,
      answers = {},
      timeTakenSeconds = 0,
    } = body;

    if (!quizId || !seekerId || !courseId) {
      return NextResponse.json(
        { success: false, error: 'quizId, seekerId, and courseId are required' },
        { status: 400 }
      );
    }

    const db = getAdminFirestore();
    const quizDoc = await db.collection('quizzes').doc(quizId).get();
    if (!quizDoc.exists) {
      return NextResponse.json({ success: false, error: 'Quiz not found' }, { status: 404 });
    }

    const quiz = quizDoc.data()!;
    if (quiz.status !== 'published') {
      return NextResponse.json({ success: false, error: 'This quiz is not currently active' }, { status: 400 });
    }

    // Check attempt limits
    const existingAttemptsSnap = await db.collection('quizAttempts')
      .where('quizId', '==', quizId)
      .where('seekerId', '==', seekerId)
      .get();

    const maxAttempts = Number(quiz.maxAttempts) || 0;
    if (maxAttempts > 0 && existingAttemptsSnap.size >= maxAttempts) {
      return NextResponse.json(
        { success: false, error: `Maximum allowed attempts (${maxAttempts}) reached for this quiz.` },
        { status: 403 }
      );
    }

    // Server-side calculation of score
    const questions: any[] = Array.isArray(quiz.questions) ? quiz.questions : [];
    let score = 0;
    let totalPoints = 0;
    const questionResults: Record<string, { isCorrect: boolean; pointsEarned: number; explanation?: string }> = {};

    for (const q of questions) {
      const qPoints = Number(q.points) || 1;
      totalPoints += qPoints;

      const userAnswers: number[] = Array.isArray(answers[q.id]) ? answers[q.id] : [];
      const correctAnswers: number[] = Array.isArray(q.correctAnswers) ? q.correctAnswers : [];

      const isCorrect =
        userAnswers.length === correctAnswers.length &&
        userAnswers.every((val) => correctAnswers.includes(val)) &&
        correctAnswers.every((val) => userAnswers.includes(val));

      if (isCorrect) {
        score += qPoints;
      }

      questionResults[q.id] = {
        isCorrect,
        pointsEarned: isCorrect ? qPoints : 0,
        explanation: q.explanation || '',
      };
    }

    const passPercentage = Number(quiz.passPercentage) || 70;
    const percentage = totalPoints > 0 ? Math.round((score / totalPoints) * 100) : 0;
    const passed = percentage >= passPercentage;

    const now = new Date();
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
      attemptNumber: existingAttemptsSnap.size + 1,
      completedAt: now,
      createdAt: now,
    };

    const attemptRef = await db.collection('quizAttempts').add(attemptData);

    // Update enrollment with best score and certificate eligibility
    const enrollmentQuery = await db.collection('enrollments')
      .where('seekerId', '==', seekerId)
      .where('courseId', '==', courseId)
      .limit(1)
      .get();

    if (!enrollmentQuery.empty) {
      const enrollmentDoc = enrollmentQuery.docs[0];
      const enrollmentData = enrollmentDoc.data();
      const currentBest = Number(enrollmentData.bestQuizScore) || 0;
      const newBest = Math.max(currentBest, percentage);

      const isCompleted = enrollmentData.status === 'completed' || Number(enrollmentData.progressPercentage) >= 100;
      const certificateEligible = isCompleted && newBest >= passPercentage;

      await enrollmentDoc.ref.update({
        bestQuizScore: newBest,
        quizAttemptCount: (Number(enrollmentData.quizAttemptCount) || 0) + 1,
        certificateEligible,
        updatedAt: now,
      });
    }

    return NextResponse.json({
      success: true,
      attemptId: attemptRef.id,
      score,
      totalPoints,
      percentage,
      passed,
      passPercentage,
      questionResults,
      attemptNumber: existingAttemptsSnap.size + 1,
    });
  } catch (error: any) {
    console.error('[Quiz Submit API error]:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to submit quiz attempt' },
      { status: 500 }
    );
  }
}
