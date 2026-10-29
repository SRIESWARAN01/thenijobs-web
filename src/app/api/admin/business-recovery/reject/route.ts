import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminAuth } from '@/lib/api/adminAuth';
import { rejectRecoveryRequest } from '@/lib/business/businessAuthService';

export async function POST(req: NextRequest) {
  const authResult = await verifyAdminAuth(req);
  if (!authResult.authorized) return authResult.response;

  try {
    const body = await req.json();
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
