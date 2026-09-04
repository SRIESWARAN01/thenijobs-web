import { NextResponse } from 'next/server';

// ─── Server-side rate limiting ─────────────────────────────────────────────
const verifyRateLimitMap = new Map<string, { count: number; resetTime: number }>();
const VERIFY_RATE_LIMIT_MAX = 5;      // C7 FIX: Max 5 verify attempts per session (reduced from 10)
const VERIFY_RATE_LIMIT_WINDOW = 5 * 60 * 1000; // 5 minutes

function isVerifyRateLimited(sessionId: string): boolean {
  const now = Date.now();
  const entry = verifyRateLimitMap.get(sessionId);
  if (!entry || now > entry.resetTime) {
    verifyRateLimitMap.set(sessionId, { count: 1, resetTime: now + VERIFY_RATE_LIMIT_WINDOW });
    return false;
  }
  entry.count++;
  return entry.count > VERIFY_RATE_LIMIT_MAX;
}

export async function POST(request: Request) {
  try {
    const { sessionId, otp } = await request.json();

    if (!sessionId || !otp) {
      return NextResponse.json({ error: 'Session ID and OTP are required' }, { status: 400 });
    }

    const cleanOtp = String(otp).trim();

    if (cleanOtp.length < 4 || cleanOtp.length > 8) {
      return NextResponse.json({ error: 'Please enter a valid 6-digit OTP' }, { status: 400 });
    }

    // Validate OTP is numeric only
    if (!/^\d+$/.test(cleanOtp)) {
      return NextResponse.json({ error: 'OTP must contain only numbers' }, { status: 400 });
    }

    // Rate limiting — prevent brute force OTP guessing
    if (isVerifyRateLimited(sessionId)) {
      return NextResponse.json(
        { error: 'Too many verification attempts. Please request a new OTP.' },
        { status: 429 }
      );
    }

    const apiKey = process.env.TWOFACTOR_API_KEY;

    // SEC-1: the session id comes from the caller, so a 'test_session_' or 'voice_session_'
    // prefix is only meaningful when no provider is configured at all. Previously these
    // prefixes were honoured unconditionally, which meant anyone could present an id they
    // made up themselves and verify it with 123456 — no message and no call required.
    if (sessionId.startsWith('test_session_') || sessionId.startsWith('voice_session_')) {
      if (apiKey) {
        return NextResponse.json({
          error: 'Invalid or expired session. Please request a new OTP.',
          verified: false,
        }, { status: 400 });
      }
      if (cleanOtp === '123456' || cleanOtp === '999999') {
        return NextResponse.json({
          success: true,
          verified: true,
          message: 'OTP verified successfully',
        });
      }
      return NextResponse.json({
        error: 'Invalid OTP. Please check the code and try again.',
        verified: false,
      }, { status: 400 });
    }

    if (!apiKey) {
      // SEC-1: this used to answer verified:true for ANY code once the key was unset, which
      // turned a missing environment variable into an open door. With no provider there is
      // nothing to verify against, so say so instead of asserting success.
      console.error('[OTP Verify] TWOFACTOR_API_KEY is not set; cannot verify a real session.');
      return NextResponse.json({
        error: 'Verification is temporarily unavailable. Please try again later.',
        verified: false,
      }, { status: 503 });
    }

    // 2Factor.in VERIFY OTP endpoint
    const url = `https://2factor.in/API/V1/${apiKey}/SMS/VERIFY/${sessionId}/${cleanOtp}`;

    const response = await fetch(url, { method: 'GET', signal: AbortSignal.timeout(8000) });
    const data = await response.json();

    if (data.Status === 'Success' && data.Details === 'OTP Matched') {
      return NextResponse.json({
        success: true,
        verified: true,
        message: 'OTP verified successfully',
      });
    } else {
      const errorMsg = data.Details === 'OTP Expired' 
        ? 'OTP has expired. Please click Resend OTP or Call Again.' 
        : (data.Details || 'Invalid OTP. Please check the 6-digit code and try again.');

      return NextResponse.json({
        error: errorMsg,
        verified: false,
      }, { status: 400 });
    }
  } catch (error: any) {
    console.error('OTP Verify Error:', error);
    return NextResponse.json({
      error: 'Server error while verifying OTP. Please try again.',
      verified: false,
    }, { status: 500 });
  }
}
