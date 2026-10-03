import { NextRequest, NextResponse } from 'next/server';
import { getAdminFirestore } from '@/lib/firebase/firebaseAdmin';
import { verifyAdminAuth } from '@/lib/api/adminAuth';

/**
 * PUT /api/admin/slogans/[id]
 * Updates slogan fields: text, language, category, isActive.
 * SECURITY: Requires admin authentication.
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await verifyAdminAuth(req);
  if (!authResult.authorized) return authResult.response;

  try {
    const { id } = await params;
    const body = await req.json();
    const db = getAdminFirestore();
    const docRef = db.collection('billingSlogans').doc(id);

    const snap = await docRef.get();
    if (!snap.exists) {
      return NextResponse.json({ success: false, error: 'Slogan not found' }, { status: 404 });
    }

    const updates: Record<string, any> = {};
    if (typeof body.text === 'string' && body.text.trim()) updates.text = body.text.trim();
    if (body.language === 'ta' || body.language === 'en') updates.language = body.language;
    if (typeof body.category === 'string') updates.category = body.category;
    if (typeof body.isActive === 'boolean') updates.isActive = body.isActive;
    updates.updatedAt = new Date().toISOString();

    await docRef.update(updates);

    return NextResponse.json({
      success: true,
      message: 'Slogan updated successfully.',
      updates,
    });
  } catch (error: any) {
    console.error('[Admin Slogan PUT Error]:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to update slogan' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/slogans/[id]
 * Deletes or disables a slogan.
 * SECURITY: Requires admin authentication.
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await verifyAdminAuth(req);
  if (!authResult.authorized) return authResult.response;

  try {
    const { id } = await params;
    const db = getAdminFirestore();
    const docRef = db.collection('billingSlogans').doc(id);

    const snap = await docRef.get();
    if (!snap.exists) {
      return NextResponse.json({ success: false, error: 'Slogan not found' }, { status: 404 });
    }

    await docRef.delete();

    return NextResponse.json({
      success: true,
      message: 'Slogan deleted successfully.',
    });
  } catch (error: any) {
    console.error('[Admin Slogan DELETE Error]:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to delete slogan' },
      { status: 500 }
    );
  }
}
