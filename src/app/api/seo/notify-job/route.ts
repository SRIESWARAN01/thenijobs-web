import { NextRequest, NextResponse } from 'next/server';
import { notifyGoogleJobPosting } from '@/lib/seo/googleIndexingApi';
import { safeReadRequestBody } from '@/lib/api/safeResponse';

/**
 * /api/seo/notify-job
 *
 * Endpoint to trigger Google Indexing API notification for eligible JobPosting URLs.
 * Strictly enforces that only https://www.thenijobs.com/jobs/* URLs can be notified.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await safeReadRequestBody<{ url?: string; type?: string }>(req, {});
    const { url, type } = body;

    if (!url || typeof url !== 'string') {
      return NextResponse.json({ success: false, error: 'Missing or invalid "url" in request body' }, { status: 400 });
    }

    const actionType = type === 'URL_DELETED' ? 'URL_DELETED' : 'URL_UPDATED';
    const result = await notifyGoogleJobPosting(url, actionType);

    if (!result.success) {
      return NextResponse.json(result, { status: result.status || 400 });
    }

    return NextResponse.json(result, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || 'Internal server error' }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    success: true,
    service: 'THENIJOBS Google Job Notification API',
    status: 'operational',
  });
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      Allow: 'POST, GET, OPTIONS',
      'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
