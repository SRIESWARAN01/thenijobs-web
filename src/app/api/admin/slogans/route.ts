import { NextRequest, NextResponse } from 'next/server';
import { getAdminFirestore } from '@/lib/firebase/firebaseAdmin';
import { getAdminSloganLibrary, seedMasterSlogansIfNeeded } from '@/lib/billing/sloganService';
import { BillingSlogan } from '@/lib/billing/sloganLibrary';
import { verifyAdminAuth } from '@/lib/api/adminAuth';

/**
 * GET /api/admin/slogans
 * Fetches all approved billing slogans along with the current rotation cycle status.
 * SECURITY: Requires admin authentication.
 */
export async function GET(req: NextRequest) {
  const authResult = await verifyAdminAuth(req);
  if (!authResult.authorized) return authResult.response;

  try {
    const data = await getAdminSloganLibrary();
    return NextResponse.json({
      success: true,
      slogans: data.slogans,
      rotationState: data.rotationState,
      totalCount: data.slogans.length,
    });
  } catch (error: any) {
    console.error('[Admin Slogans GET Error]:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to fetch slogans' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/slogans
 * - If body contains { action: 'seed' } or { action: 'reseed' }, populates/syncs the 100 master slogans.
 * - Otherwise creates a new custom billing slogan.
 * SECURITY: Requires admin authentication.
 */
export async function POST(req: NextRequest) {
  const authResult = await verifyAdminAuth(req);
  if (!authResult.authorized) return authResult.response;

  try {
    const body = await req.json();

    if (body.action === 'seed' || body.action === 'reseed') {
      const seededCount = await seedMasterSlogansIfNeeded(body.action === 'reseed');
      return NextResponse.json({
        success: true,
        message: `Successfully seeded ${seededCount} master slogans into library.`,
        seededCount,
      });
    }

    const { text, language, category, sloganNumber } = body;
    if (!text || !text.trim()) {
      return NextResponse.json(
        { success: false, error: 'Slogan text is required.' },
        { status: 400 }
      );
    }

    const db = getAdminFirestore();
    const id = `slogan_custom_${Date.now()}`;
    const newSlogan: BillingSlogan = {
      id,
      text: text.trim(),
      language: language === 'en' ? 'en' : 'ta',
      sloganNumber: typeof sloganNumber === 'number' ? sloganNumber : Date.now() % 1000,
      category: category || 'custom',
      isActive: true,
      usageCount: 0,
      lastUsedAt: null,
      createdAt: new Date().toISOString(),
    };

    await db.collection('billingSlogans').doc(id).set(newSlogan);

    return NextResponse.json({
      success: true,
      slogan: newSlogan,
      message: 'New billing slogan created successfully.',
    });
  } catch (error: any) {
    console.error('[Admin Slogans POST Error]:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to create slogan' },
      { status: 500 }
    );
  }
}
