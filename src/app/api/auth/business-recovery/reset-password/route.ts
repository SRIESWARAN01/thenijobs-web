import { NextRequest, NextResponse } from 'next/server';
import { completePasswordReset } from '@/lib/business/businessAuthService';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { requestId, token, newPassword } = body;

    if (!requestId || !token || !newPassword) {
      return NextResponse.json(
        { success: false, error: 'All fields are required.' },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { success: false, error: 'Password must be at least 6 characters long.' },
        { status: 400 }
      );
    }

    const result = await completePasswordReset({
      requestId,
      rawToken: token,
      newPassword,
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('[Reset Password] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to reset password.' },
      { status: 400 }
    );
  }
}
