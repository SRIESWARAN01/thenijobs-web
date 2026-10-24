import { NextResponse } from 'next/server';
import { notifyGoogleJobPosting } from '@/lib/seo/googleIndexingApi';
import { getAdminFirestore } from '@/lib/firebase/firebaseAdmin';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { jobId, slug, type = 'URL_UPDATED' } = body;

    let targetSlug = slug;

    if (!targetSlug && jobId) {
      try {
        const db = getAdminFirestore();
        const snap = await db.collection('jobs').doc(jobId).get();
        if (snap.exists) {
          const data = snap.data();
          targetSlug = data?.slug || jobId;
        }
      } catch (err: any) {
        console.warn('[SEO Indexing API] Could not look up job slug from Firestore:', err?.message || err);
        targetSlug = jobId;
      }
    }

    if (!targetSlug) {
      return NextResponse.json(
        { error: 'Missing jobId or slug. A valid job identifier is required.' },
        { status: 400 }
      );
    }

    const jobUrl = `https://www.thenijobs.com/jobs/${targetSlug}`;

    const result = await notifyGoogleJobPosting(
      jobUrl,
      type === 'URL_DELETED' ? 'URL_DELETED' : 'URL_UPDATED'
    );

    return NextResponse.json(result, { status: result.success ? 200 : 202 });
  } catch (error: any) {
    console.error('[SEO Indexing API Error]:', error?.message || error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Internal server error processing indexing request' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    service: 'THENIJOBS Google Indexing API Integration',
    status: 'operational',
    policy: 'Strictly restricted to JobPosting URLs on https://www.thenijobs.com/jobs/*',
  });
}
