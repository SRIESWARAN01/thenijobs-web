import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST() {
  try {
    const cookieStore = await cookies();
    cookieStore.set('session', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      expires: new Date(0), // expire immediately
      path: '/',
    });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('[Logout API Error]:', err);
    return NextResponse.json({ error: 'Failed to clear session' }, { status: 500 });
  }
}
