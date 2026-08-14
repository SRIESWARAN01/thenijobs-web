import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { sessionId, otp } = await request.json();

    if (!sessionId || !otp) {
      return NextResponse.json({ error: 'Session ID and OTP are required' }, { status: 400 });
    }

    const cleanOtp = String(otp).trim();

    if (cleanOtp.length < 4 || cleanOtp.length > 8) {
      return NextResponse.json({ error: 'Please enter a valid OTP' }, { status: 400 });
    }

    const apiKey = process.env.TWOFACTOR_API_KEY || 'c97e4a9d-65fa-11f1-8f15-0200cd936042';

    // 2Factor.in VERIFY OTP endpoint
    const url = `https://2factor.in/API/V1/${apiKey}/SMS/VERIFY/${sessionId}/${cleanOtp}`;

    const response = await fetch(url, { method: 'GET' });
    const data = await response.json();

    if (data.Status === 'Success' && data.Details === 'OTP Matched') {
      return NextResponse.json({
        success: true,
        verified: true,
        message: 'OTP verified successfully',
      });
    } else {
      return NextResponse.json({
        error: data.Details || 'Invalid OTP. Please check the code and try again.',
        verified: false,
      }, { status: 400 });
    }
  } catch (error: any) {
    console.error('OTP Verify Error:', error);
    return NextResponse.json({
      error: error?.message || 'Server error while verifying OTP',
      verified: false,
    }, { status: 500 });
  }
}
