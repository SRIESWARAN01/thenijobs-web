import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminAuth } from '@/lib/api/adminAuth';
import { approveRecoveryRequest } from '@/lib/business/businessAuthService';

export async function POST(req: NextRequest) {
  const authResult = await verifyAdminAuth(req);
  if (!authResult.authorized) return authResult.response;

  try {
    const body = await req.json();
    const { requestId } = body;

    if (!requestId || typeof requestId !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Request ID is required.' },
        { status: 400 }
      );
    }

    const result = await approveRecoveryRequest(requestId, authResult.uid);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('[Admin Business Recovery Approve] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to approve recovery request.' },
      { status: 500 }
    );
  }
}
