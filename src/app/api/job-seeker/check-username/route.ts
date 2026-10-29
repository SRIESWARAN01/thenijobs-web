import { NextResponse } from 'next/server';
import { getAdminFirestore } from '@/lib/firebase/firebaseAdmin';

export const RESERVED_JOB_SEEKER_USERNAMES = new Set([
  'admin',
  'api',
  'job-seeker',
  'seeker',
  'employer',
  'login',
  'register',
  'register-business',
  'profile',
  'dashboard',
  'settings',
  'edit',
  'new',
  'create',
  '_fallback',
  'demo',
  'demo-seeker',
  'jobs',
  'companies',
  'businesses',
  'courses',
  'terms',
  'privacy',
  'contact',
  'about',
  'marketplace',
  'portfolio',
  'sitemap',
  'robots',
]);

const USERNAME_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/**
 * Validates and checks availability of a custom job seeker username.
 * GET /api/job-seeker/check-username?username=...&userId=...
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const rawUsername = searchParams.get('username') || '';
    const userId = searchParams.get('userId') || '';

    const username = rawUsername.trim().toLowerCase();

    if (!username) {
      return NextResponse.json({
        available: false,
        error: 'Username cannot be empty',
        errorTa: 'Username காலியாக இருக்கக்கூடாது',
      }, { status: 400 });
    }

    if (username.length < 3 || username.length > 35) {
      return NextResponse.json({
        available: false,
        error: 'Username must be between 3 and 35 characters',
        errorTa: 'Username 3 முதல் 35 எழுத்துக்கள் வரை இருக்க வேண்டும்',
      }, { status: 200 });
    }

    if (!USERNAME_REGEX.test(username)) {
      return NextResponse.json({
        available: false,
        error: 'Username can only contain lowercase letters, numbers, and single hyphens',
        errorTa: 'Username-ல் சிறிய ஆங்கில எழுத்துக்கள், எண்கள் மற்றும் ஒற்றை ஹைபன்கள் (-) மட்டுமே இருக்கலாம்',
      }, { status: 200 });
    }

    if (RESERVED_JOB_SEEKER_USERNAMES.has(username)) {
      return NextResponse.json({
        available: false,
        error: `"${username}" is a reserved system name. Please choose another username.`,
        errorTa: `"${username}" என்பது ஒதுக்கப்பட்ட பெயர். தயவுசெய்து வேறு username தேர்வு செய்யவும்.`,
      }, { status: 200 });
    }

    const db = getAdminFirestore();

    // 1. Check portfolioSlugs collection
    const slugDoc = await db.collection('portfolioSlugs').doc(username).get();
    if (slugDoc.exists) {
      const slugData = slugDoc.data();
      if (slugData?.ownerId && slugData.ownerId !== userId) {
        return NextResponse.json({
          available: false,
          error: `Username "${username}" is already taken. Please choose another username.`,
          errorTa: `"${username}" என்ற username ஏற்கெனவே பயன்பாட்டில் உள்ளது. வேறு பெயரைத் தேர்வு செய்யவும்.`,
        }, { status: 200 });
      }
    }

    // 2. Check portfolioSites collection
    const siteSnap = await db.collection('portfolioSites')
      .where('customUrl', '==', username)
      .limit(1)
      .get();

    if (!siteSnap.empty) {
      const siteData = siteSnap.docs[0].data();
      if (siteData?.ownerId && siteData.ownerId !== userId) {
        return NextResponse.json({
          available: false,
          error: `Username "${username}" is already taken by another candidate. Please choose another username.`,
          errorTa: `"${username}" என்ற username மற்றொரு விண்ணப்பதாரரால் பயன்படுத்தப்பட்டுள்ளது. வேறு பெயரைத் தேர்வு செய்யவும்.`,
        }, { status: 200 });
      }
    }

    // 3. Check seekerProfiles collection
    const profileSnap = await db.collection('seekerProfiles')
      .where('customUrl', '==', username)
      .limit(1)
      .get();

    if (!profileSnap.empty) {
      const profDoc = profileSnap.docs[0];
      if (profDoc.id !== userId) {
        return NextResponse.json({
          available: false,
          error: `Username "${username}" is already registered. Please choose another username.`,
          errorTa: `"${username}" பதிவு செய்யப்பட்டுள்ளது. வேறு பெயரைத் தேர்வு செய்யவும்.`,
        }, { status: 200 });
      }
    }

    return NextResponse.json({
      available: true,
      username,
      url: `https://www.thenijobs.com/job-seeker/${username}`,
      message: 'Username is available!',
      messageTa: 'இந்த username கிடைக்கிறது! பயன்படுத்தலாம்.',
    });
  } catch (error: any) {
    console.error('[Check Username Error]:', error?.message || error);
    return NextResponse.json({ error: 'Failed to check username availability' }, { status: 500 });
  }
}
