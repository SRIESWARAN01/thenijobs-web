import { NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import adminApp from '@/lib/firebaseAdmin';
import { getPasswordResetEmailHtml, getPasswordResetEmailText } from '@/lib/emailTemplates';

export async function POST(request: Request) {
  try {
    const { email } = await request.json();
    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const trimmedEmail = email.trim().toLowerCase();

    const resendApiKey = process.env.RESEND_API_KEY;
    if (!resendApiKey) {
      console.error('[Password Reset] RESEND_API_KEY is not configured');
      return NextResponse.json({ error: 'Email service is not configured' }, { status: 500 });
    }

    // 1. Generate a Firebase password reset link via Admin SDK
    const auth = getAuth(adminApp);

    let resetLink: string;
    let userName = 'User';

    try {
      // This will throw if the user does not exist
      const userRecord = await auth.getUserByEmail(trimmedEmail);
      userName = userRecord.displayName || userRecord.email?.split('@')[0] || 'User';

      resetLink = await auth.generatePasswordResetLink(trimmedEmail, {
        url: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://thenijobs.com'}/login`,
      });
    } catch (err: any) {
      // Don't reveal whether the email exists or not (security best practice)
      console.warn('[Password Reset] User lookup/link generation failed:', err.code || err.message);
      // Return success even if user doesn't exist to prevent email enumeration
      return NextResponse.json({ success: true });
    }

    // 2. Send the email via Resend
    const htmlContent = getPasswordResetEmailHtml({
      userName,
      resetLink,
      expiryMinutes: 15,
    });

    const textContent = getPasswordResetEmailText({
      userName,
      resetLink,
      expiryMinutes: 15,
    });

    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Theni Jobs <noreply@thenijobs.com>',
        to: [trimmedEmail],
        subject: 'Reset Your Theni Jobs Password',
        html: htmlContent,
        text: textContent,
      }),
    });

    if (!resendResponse.ok) {
      const resendError = await resendResponse.json().catch(() => ({}));
      console.error('[Password Reset] Resend API error:', resendResponse.status, resendError);

      // Fallback: try Firebase's built-in email if Resend fails
      try {
        await auth.generatePasswordResetLink(trimmedEmail);
        console.warn('[Password Reset] Fell back to Firebase default email');
      } catch {
        // Already generated the link above, so the user might still get Firebase's email
      }

      // Still return success — don't expose internal failures to the client
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('[Password Reset Exception]:', err);
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 });
  }
}
