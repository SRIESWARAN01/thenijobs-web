import { NextRequest, NextResponse } from 'next/server';
import { notifyGoogleJobPosting } from '@/lib/seo/googleIndexingApi';

/**
 * /api/seo/notify-job
 *
 * Endpoint to trigger Google Indexing API notification for eligible JobPosting URLs.
 * Strictly enforces that only https://thenijobs.com/jobs/* URLs can be notified.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { url, type } = body;

    if (!url || typeof url !== 'string') {
      return NextResponse.json({ error: 'Missing or invalid "url" in request body' }, { status: 400 });
    }

    const actionType = type === 'URL_DELETED' ? 'URL_DELETED' : 'URL_UPDATED';
    const result = await notifyGoogleJobPosting(url, actionType);

    if (!result.success) {
      return NextResponse.json(result, { status: result.status || 400 });
    }

    return NextResponse.json(result, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
