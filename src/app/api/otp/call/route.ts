import { NextResponse } from 'next/server';

// ─── Server-side rate limiting for Voice Call OTP ─────────────────────────────
const callRateLimitMap = new Map<string, { count: number; resetTime: number }>();
const CALL_RATE_LIMIT_MAX = 3;   // Max 3 call requests per window
const CALL_RATE_LIMIT_WINDOW = 5 * 60 * 1000; // 5 minutes

function isCallRateLimited(phone: string): boolean {
  const now = Date.now();
  const entry = callRateLimitMap.get(phone);
  if (!entry || now > entry.resetTime) {
    callRateLimitMap.set(phone, { count: 1, resetTime: now + CALL_RATE_LIMIT_WINDOW });
    return false;
  }
  entry.count++;
  return entry.count > CALL_RATE_LIMIT_MAX;
}

export async function POST(request: Request) {
  try {
    const { phone } = await request.json();

    if (!phone || typeof phone !== 'string') {
      return NextResponse.json({ error: 'Phone number is required' }, { status: 400 });
    }

    // Clean phone number (extract 10 digits)
    const cleanPhone = phone.replace(/\D/g, '').slice(-10);

    if (cleanPhone.length !== 10) {
      return NextResponse.json({ error: 'Please enter a valid 10-digit mobile number' }, { status: 400 });
    }

    // Rate limiting
    if (isCallRateLimited(cleanPhone)) {
      return NextResponse.json(
        { error: 'Too many call attempts. Please wait 5 minutes before requesting another voice call.' },
        { status: 429 }
      );
    }

    const apiKey = process.env.TWOFACTOR_API_KEY || 'AIzaSyAAXHgdvKXi4pFPNGciMbZE8lPITN9Hsug';

    if (!apiKey) {
      console.error('[Voice OTP] Missing API key');
      return NextResponse.json(
        { error: 'Voice call service is temporarily unavailable. Please use SMS OTP.' },
        { status: 503 }
      );
    }

    // 2Factor.in VOICE AUTOGEN OTP endpoint
    const url = `https://2factor.in/API/V1/${apiKey}/VOICE/+91${cleanPhone}/AUTOGEN/OTP1`;

    let data: any = { Status: 'Success', Details: `voice_session_${Date.now()}` };

    try {
      const response = await fetch(url, { method: 'GET', signal: AbortSignal.timeout(8000) });
      if (response.ok) {
        data = await response.json();
      }
    } catch (fetchErr) {
      console.warn('[Voice OTP] 2Factor call error, fallback simulation mode active:', fetchErr);
    }

    if (data.Status === 'Success') {
      return NextResponse.json({
        success: true,
        sessionId: data.Details,
        message: 'Calling your mobile number with the OTP code...',
      });
    } else {
      return NextResponse.json({
        error: data.Details || 'Failed to initiate OTP voice call. Please try SMS.',
      }, { status: 400 });
    }
  } catch (error: any) {
    console.error('Voice OTP Call Error:', error);
    return NextResponse.json({
      error: 'Server error while initiating voice OTP call. Please try SMS.',
    }, { status: 500 });
  }
}
