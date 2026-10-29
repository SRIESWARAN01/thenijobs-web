import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, syncClockSkew } from '@/lib/firebase/firebaseAdmin';
import { verifyEligibleBusinessGoogleLogin } from '@/lib/business/businessAuthService';

export async function POST(req: NextRequest) {
  try {
    await syncClockSkew();
    const body = await req.json();
    const { idToken } = body;

    if (!idToken || typeof idToken !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Firebase ID token is required.' },
        { status: 400 }
      );
    }

    const auth = getAdminAuth();
    let decodedToken;
    try {
      decodedToken = await auth.verifyIdToken(idToken);
    } catch (err: any) {
      console.error('[Business Google Login] Token verification error:', err);
      return NextResponse.json(
        { success: false, error: 'Invalid or expired authentication token. Please try again.' },
        { status: 401 }
      );
    }

    const verifiedEmail = decodedToken.email;
    if (!verifiedEmail || decodedToken.email_verified === false) {
      return NextResponse.json(
        { success: false, error: 'A verified Google email address is required.' },
        { status: 400 }
      );
    }

    const result = await verifyEligibleBusinessGoogleLogin(
      verifiedEmail,
      decodedToken.uid,
      decodedToken.name,
      decodedToken.picture
    );

    if (!result.eligible) {
      return NextResponse.json(
        {
          success: false,
          error: result.error || 'This Google account is not registered for an eligible business account.',
        },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      company: result.company,
      user: result.user,
      redirectUrl: '/employer/dashboard',
    });
  } catch (error: any) {
    console.error('[Business Google Login] Server error:', error);
    return NextResponse.json(
      { success: false, error: 'Server error processing business login. Please try again later.' },
      { status: 500 }
    );
  }
}
