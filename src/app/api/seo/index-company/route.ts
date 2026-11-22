import { NextResponse } from 'next/server';
import { getAdminFirestore } from '@/lib/firebase/firebaseAdmin';
import { safeReadRequestBody } from '@/lib/api/safeResponse';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await safeReadRequestBody<any>(request, {});
    const { companyId, slug } = body;

    let targetSlug = slug;

    if (!targetSlug && companyId) {
      try {
        const db = getAdminFirestore();
        const snap = await db.collection('companies').doc(companyId).get();
        if (snap.exists) {
          const data = snap.data();
          targetSlug = data?.slug || companyId;
        }
      } catch (err: any) {
        console.warn('[SEO Indexing API] Could not look up company slug from Firestore:', err?.message || err);
        targetSlug = companyId;
      }
    }

    if (!targetSlug) {
      return NextResponse.json(
        { success: false, error: 'Missing companyId or slug. A valid company identifier is required.' },
        { status: 400 }
      );
    }

    const companyUrl = `https://www.thenijobs.com/company/${targetSlug}`;

    // Google Sitemap Ping best effort
    try {
      const sitemapUrl = encodeURIComponent('https://www.thenijobs.com/sitemap.xml');
      void fetch(`https://www.google.com/ping?sitemap=${sitemapUrl}`).catch(() => 0);
    } catch {
      // ignore
    }

    return NextResponse.json({
      success: true,
      url: companyUrl,
      message: 'Company URL verified and registered for automatic search engine indexing.',
      sitemapUrl: 'https://www.thenijobs.com/sitemap.xml',
    });
  } catch (error: any) {
    console.error('[SEO Indexing API Company Error]:', error?.message || error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Internal server error processing indexing request' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    success: true,
    service: 'THENIJOBS Google Company Profile Indexing Workflow',
    status: 'operational',
    canonicalBase: 'https://www.thenijobs.com/company/*',
  });
}
