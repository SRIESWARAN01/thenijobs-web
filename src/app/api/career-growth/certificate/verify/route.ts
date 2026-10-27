import { NextRequest, NextResponse } from 'next/server';
import { getAdminFirestore } from '@/lib/firebase/firebaseAdmin';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const verificationId = searchParams.get('id');

    if (!verificationId) {
      return NextResponse.json(
        { success: false, error: 'Certificate verification ID is required' },
        { status: 400 }
      );
    }

    const db = getAdminFirestore();
    const certQuery = await db.collection('certificates')
      .where('verificationId', '==', verificationId.trim().toUpperCase())
      .limit(1)
      .get();

    if (certQuery.empty) {
      return NextResponse.json(
        { success: false, error: 'Certificate not found. Please verify the ID.' },
        { status: 404 }
      );
    }

    const certData = certQuery.docs[0].data();
    const issueDate = certData.issueDate?._seconds
      ? new Date(certData.issueDate._seconds * 1000).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
      : 'Verified';

    return NextResponse.json({
      success: true,
      certificate: {
        id: certQuery.docs[0].id,
        verificationId: certData.verificationId,
        seekerName: certData.seekerName,
        courseTitle: certData.courseTitle,
        learningPathTitle: certData.learningPathTitle || null,
        status: certData.status || 'issued',
        issueDate,
        quizScore: certData.quizScore || null,
        organization: 'THENIJOBS Career Growth & Skill Development Institute',
        isValid: certData.status === 'issued',
      }
    });
  } catch (error: any) {
    console.error('[Certificate Verification API error]:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to verify certificate' },
      { status: 500 }
    );
  }
}
