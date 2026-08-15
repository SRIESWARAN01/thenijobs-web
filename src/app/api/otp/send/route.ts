import { NextResponse } from 'next/server';

// ─── Server-side rate limiting ─────────────────────────────────────────────
const otpRateLimitMap = new Map<string, { count: number; resetTime: number }>();
const OTP_RATE_LIMIT_MAX = 5;   // Max 5 OTP requests per window
const OTP_RATE_LIMIT_WINDOW = 5 * 60 * 1000; // 5 minutes

function isOtpRateLimited(phone: string): boolean {
  const now = Date.now();
  const entry = otpRateLimitMap.get(phone);
  if (!entry || now > entry.resetTime) {
    otpRateLimitMap.set(phone, { count: 1, resetTime: now + OTP_RATE_LIMIT_WINDOW });
    return false;
  }
  entry.count++;
  return entry.count > OTP_RATE_LIMIT_MAX;
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

    // Rate limiting — prevent OTP abuse / brute force
    if (isOtpRateLimited(cleanPhone)) {
      return NextResponse.json(
        { error: 'Too many OTP requests. Please wait 5 minutes and try again.' },
        { status: 429 }
      );
    }

    const apiKey = process.env.TWOFACTOR_API_KEY;

    if (!apiKey) {
      // In dev or when key not yet configured, return a session ID for demo/test mode
      console.warn('[OTP Send] TWOFACTOR_API_KEY not set. Using test mode session.');
      return NextResponse.json({
        success: true,
        sessionId: `test_session_${cleanPhone}_${Date.now()}`,
        message: 'OTP sent to mobile number (Test/Sandbox: Use 123456 or 999999 if testing)',
      });
    }

    // 2Factor.in AUTOGEN OTP endpoint
    const url = `https://2factor.in/API/V1/${apiKey}/SMS/+91${cleanPhone}/AUTOGEN/OTP1`;

    const response = await fetch(url, { method: 'GET', signal: AbortSignal.timeout(8000) });
    const data = await response.json();

    if (data.Status === 'Success') {
      return NextResponse.json({
        success: true,
        sessionId: data.Details,
        message: 'OTP sent successfully to your mobile number via SMS',
      });
    } else {
      return NextResponse.json({
        error: data.Details || 'Failed to send OTP. Please try again.',
      }, { status: 400 });
    }
  } catch (error: any) {
    console.error('OTP Send Error:', error);
    return NextResponse.json({
      error: 'Server error while sending OTP. Please try again.',
    }, { status: 500 });
  }
}
