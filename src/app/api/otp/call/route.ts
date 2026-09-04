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

    // SEC-1: this used to fall back to a literal that was byte-identical to the live
    // Firebase web API key. That made the guard below dead code, and sent a Google
    // credential to the SMS vendor as if it were their API key.
    const apiKey = process.env.TWOFACTOR_API_KEY;

    if (!apiKey) {
      console.error('[Voice OTP] Missing API key');
      return NextResponse.json(
        { error: 'Voice call service is temporarily unavailable. Please use SMS OTP.' },
        { status: 503 }
      );
    }

    // 2Factor.in VOICE AUTOGEN OTP endpoint
    const url = `https://2factor.in/API/V1/${apiKey}/VOICE/+91${cleanPhone}/AUTOGEN/OTP1`;

    // SEC-1: this used to start as { Status: 'Success', Details: 'voice_session_<ts>' } and
    // keep that value whenever the vendor call failed, so a failed call answered "success"
    // with a session id the route invented. Combined with the verify route accepting fixed
    // codes for any 'voice_session_' id, that was a phone-verification bypass. A call that
    // does not succeed is now reported as a failure.
    let data: any = null;

    try {
      const response = await fetch(url, { method: 'GET', signal: AbortSignal.timeout(8000) });
      if (response.ok) {
        data = await response.json();
      } else {
        console.error('[Voice OTP] 2Factor responded', response.status);
      }
    } catch (fetchErr) {
      console.error('[Voice OTP] 2Factor call failed:', fetchErr);
    }

    if (!data) {
      return NextResponse.json(
        { error: 'Could not place the verification call right now. Please use SMS OTP.' },
        { status: 502 }
      );
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
