import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { phone } = await request.json();
    if (!phone) {
      return NextResponse.json({ error: 'Phone number is required' }, { status: 400 });
    }

    // Normalize phone number: strip non-digits, take last 10 digits
    const cleanPhone = phone.replace(/\D/g, '').slice(-10);
    if (cleanPhone.length !== 10) {
      return NextResponse.json({ error: 'Invalid phone number. Must be a 10-digit number.' }, { status: 400 });
    }

    const apiKey = 'c97e4a9d-65fa-11f1-8f15-0200cd936042';
    // 2factor.in Send OTP URL
    // Format: https://2factor.in/API/V1/{api_key}/SMS/{phone_number}/AUTOGEN
    // We prefix with 91 for Indian mobile numbers
    const response = await fetch(`https://2factor.in/API/V1/${apiKey}/SMS/91${cleanPhone}/AUTOGEN`, {
      method: 'GET',
    });

    const data = await response.json();

    if (data.Status === 'Success') {
      return NextResponse.json({
        success: true,
        sessionId: data.Details, // This is the SessionId used for verification
      });
    } else {
      console.error('[OTP Send Error] 2Factor Response:', data);
      return NextResponse.json({
        error: data.Details || 'Failed to send OTP'
      }, { status: 400 });
    }
  } catch (err: any) {
    console.error('[OTP Send Exception]:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
