import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminAuth } from '@/lib/api/adminAuth';
import { rejectRecoveryRequest } from '@/lib/business/businessAuthService';
import { safeReadRequestBody } from '@/lib/api/safeResponse';

export async function POST(req: NextRequest) {
  const authResult = await verifyAdminAuth(req);
  if (!authResult.authorized) return authResult.response;

  try {
    const body = await safeReadRequestBody<{ requestId?: string; reason?: string }>(req, {});
    const { requestId, reason } = body;

    if (!requestId || typeof requestId !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Request ID is required.' },
        { status: 400 }
      );
    }

    const result = await rejectRecoveryRequest(requestId, authResult.uid, reason || 'Identity verification failed.');

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('[Admin Business Recovery Reject] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to reject recovery request.' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    { success: false, error: 'Method Not Allowed. Use POST.' },
    { status: 405, headers: { Allow: 'POST, OPTIONS' } }
  );
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
