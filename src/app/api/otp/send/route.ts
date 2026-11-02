import { NextResponse } from 'next/server';
import { safeReadRequestBody, safeParseResponse } from '@/lib/api/safeResponse';

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
    const body = await safeReadRequestBody<{ phone?: string }>(request, {});
    const { phone } = body;

    if (!phone || typeof phone !== 'string') {
      return NextResponse.json({ success: false, error: 'Phone number is required' }, { status: 400 });
    }

    // Clean phone number (extract 10 digits)
    const cleanPhone = phone.replace(/\D/g, '').slice(-10);

    if (cleanPhone.length !== 10) {
      return NextResponse.json({ success: false, error: 'Please enter a valid 10-digit mobile number' }, { status: 400 });
    }

    // Rate limiting — prevent OTP abuse / brute force
    if (isOtpRateLimited(cleanPhone)) {
      return NextResponse.json(
        { success: false, error: 'Too many OTP requests. Please wait 5 minutes and try again.' },
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

    let parsedResponse: any = null;
    try {
      const response = await fetch(url, { method: 'GET', signal: AbortSignal.timeout(8000) });
      const safe = await safeParseResponse<any>(response);
      parsedResponse = safe.data;
    } catch (fetchErr: any) {
      console.error('[OTP Send] 2Factor call error:', fetchErr);
    }

    if (parsedResponse && parsedResponse.Status === 'Success') {
      return NextResponse.json({
        success: true,
        sessionId: parsedResponse.Details,
        message: 'OTP sent successfully to your mobile number via SMS',
      });
    } else {
      return NextResponse.json({
        success: false,
        error: parsedResponse?.Details || 'Failed to send OTP via SMS gateway. Please try again.',
      }, { status: 400 });
    }
  } catch (error: any) {
    console.error('OTP Send Error:', error);
    return NextResponse.json({
      success: false,
      error: 'Server error while sending OTP. Please try again.',
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json(
    { success: false, error: 'Method Not Allowed. Send a POST request with phone.' },
    { status: 405 }
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
