import { NextRequest, NextResponse } from 'next/server';
import { getAdminFirestore, syncClockSkew } from '@/lib/firebase/firebaseAdmin';

export async function POST(req: NextRequest) {
  try {
    await syncClockSkew();
    const body = await req.json();
    const {
      seekerId,
      courseId,
      seekerName,
      seekerEmail,
      learningPathId,
      learningPathTitle,
    } = body;

    if (!seekerId || !courseId) {
      return NextResponse.json(
        { success: false, error: 'seekerId and courseId are required' },
        { status: 400 }
      );
    }

    const db = getAdminFirestore();

    // 1. Fetch Course details
    const courseDoc = await db.collection('skillCourses').doc(courseId).get();
    if (!courseDoc.exists) {
      return NextResponse.json(
        { success: false, error: 'Course not found' },
        { status: 404 }
      );
    }
    const courseData = courseDoc.data()!;

    // 2. Fetch Seeker Enrollment
    const enrollmentSnap = await db.collection('enrollments')
      .where('seekerId', '==', seekerId)
      .where('courseId', '==', courseId)
      .limit(1)
      .get();

    if (enrollmentSnap.empty) {
      return NextResponse.json(
        { success: false, error: 'You are not enrolled in this course.' },
        { status: 403 }
      );
    }

    const enrollmentDoc = enrollmentSnap.docs[0];
    const enrollment = enrollmentDoc.data();

    // 3. Verify Course Completion (progress >= 100 or completed status)
    const progress = Number(enrollment.progressPercentage) || 0;
    const isCompleted = enrollment.status === 'completed' || progress >= 100;
    if (!isCompleted) {
      return NextResponse.json(
        {
          success: false,
          error: `Course is not yet completed (${progress}% done). Please complete all lessons to be eligible for certification.`,
        },
        { status: 400 }
      );
    }

    // 4. Verify Quiz Requirement (if required by course)
    if (courseData.quizRequired) {
      // Find the course quiz pass percentage
      const quizSnap = await db.collection('quizzes')
        .where('courseId', '==', courseId)
        .where('status', '==', 'published')
        .limit(1)
        .get();

      const requiredPass = quizSnap.empty
        ? 70
        : (Number(quizSnap.docs[0].data().passPercentage) || 70);

      const bestScore = Number(enrollment.bestQuizScore) || 0;
      if (bestScore < requiredPass) {
        return NextResponse.json(
          {
            success: false,
            error: `You must pass the course assessment with at least ${requiredPass}% to claim your certificate (Current best: ${bestScore}%).`,
          },
          { status: 400 }
        );
      }
    }

    // 5. Check if Certificate already issued
    const existingCertSnap = await db.collection('certificates')
      .where('seekerId', '==', seekerId)
      .where('courseId', '==', courseId)
      .where('status', '==', 'issued')
      .limit(1)
      .get();

    if (!existingCertSnap.empty) {
      const existingCert = existingCertSnap.docs[0];
      return NextResponse.json({
        success: true,
        alreadyIssued: true,
        certificate: {
          id: existingCert.id,
          ...existingCert.data(),
        },
      });
    }

    // 6. Generate Verification ID & create Certificate
    const dateSegment = Date.now().toString(36).toUpperCase();
    const randSegment = Math.random().toString(36).substring(2, 6).toUpperCase();
    const verificationId = `TNJOBS-CERT-${dateSegment}-${randSegment}`;

    const now = new Date();
    const candidateName = seekerName?.trim() || enrollment.seekerName?.trim() || 'Learner';
    const candidateEmail = seekerEmail?.trim() || enrollment.seekerEmail?.trim() || '';

    const certData = {
      verificationId,
      seekerId,
      seekerName: candidateName,
      seekerEmail: candidateEmail,
      courseId,
      courseTitle: courseData.title || enrollment.courseTitle || 'Professional Course',
      learningPathId: learningPathId || enrollment.learningPathId || '',
      learningPathTitle: learningPathTitle || enrollment.learningPathTitle || '',
      status: 'issued',
      issueDate: now,
      completionDate: enrollment.completedAt?.toDate ? enrollment.completedAt.toDate() : now,
      quizScore: enrollment.bestQuizScore ?? null,
      createdAt: now,
    };

    const certRef = await db.collection('certificates').add(certData);

    // 7. Update enrollment doc
    await enrollmentDoc.ref.update({
      certificateEligible: true,
      certificateId: certRef.id,
      updatedAt: now,
    });

    return NextResponse.json({
      success: true,
      alreadyIssued: false,
      certificate: {
        id: certRef.id,
        ...certData,
      },
    });
  } catch (error: any) {
    console.error('[Certificate Issue API error]:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to issue certificate' },
      { status: 500 }
    );
  }
}
