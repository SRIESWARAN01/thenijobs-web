import { NextRequest, NextResponse } from 'next/server';
import { verifyRecoveryToken } from '@/lib/business/businessAuthService';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { requestId, token } = body;

    if (!requestId || !token) {
      return NextResponse.json(
        { valid: false, error: 'Missing request ID or recovery token.' },
        { status: 400 }
      );
    }

    const check = await verifyRecoveryToken(requestId, token);

    if (!check.valid) {
      return NextResponse.json(
        { valid: false, error: check.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      valid: true,
      businessName: check.businessName,
    });
  } catch (error: any) {
    console.error('[Verify Recovery Token] Error:', error);
    return NextResponse.json(
      { valid: false, error: 'Failed to verify recovery token.' },
      { status: 500 }
    );
  }
}
