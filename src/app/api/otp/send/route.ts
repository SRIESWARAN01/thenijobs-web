import { NextResponse } from 'next/server';

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

    const apiKey = process.env.TWOFACTOR_API_KEY || 'c97e4a9d-65fa-11f1-8f15-0200cd936042';

    // 2Factor.in AUTOGEN OTP endpoint
    const url = `https://2factor.in/API/V1/${apiKey}/SMS/+91${cleanPhone}/AUTOGEN/OTP1`;

    const response = await fetch(url, { method: 'GET' });
    const data = await response.json();

    if (data.Status === 'Success') {
      return NextResponse.json({
        success: true,
        sessionId: data.Details,
        message: 'OTP sent successfully to your mobile number',
      });
    } else {
      return NextResponse.json({
        error: data.Details || 'Failed to send OTP. Please try again.',
      }, { status: 400 });
    }
  } catch (error: any) {
    console.error('OTP Send Error:', error);
    return NextResponse.json({
      error: error?.message || 'Server error while sending OTP',
    }, { status: 500 });
  }
}
