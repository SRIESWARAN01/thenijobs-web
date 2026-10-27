import { NextRequest, NextResponse } from 'next/server';
import { getAdminFirestore } from '@/lib/firebase/firebaseAdmin';
import {
  getAdminSloganLibrary,
  seedMasterSlogansIfNeeded,
  updateBillingModelSloganMapping,
} from '@/lib/billing/sloganService';
import {
  BillingSlogan,
  SLOGAN_CATEGORIES,
  BILLING_MODELS,
  SloganCategory,
  SloganLanguage,
} from '@/lib/billing/sloganLibrary';
import { verifyAdminAuth } from '@/lib/api/adminAuth';

/**
 * GET /api/admin/slogans
 * Fetches approved billing slogans, rotation cycle state, model mappings, and taxonomy metadata.
 * Supports filtering by category, billingModel, language, status, and search query.
 * SECURITY: Requires admin authentication.
 */
export async function GET(req: NextRequest) {
  const authResult = await verifyAdminAuth(req);
  if (!authResult.authorized) return authResult.response;

  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');
    const billingModel = searchParams.get('billingModel');
    const language = searchParams.get('language');
    const status = searchParams.get('status');
    const search = searchParams.get('search')?.toLowerCase();

    const data = await getAdminSloganLibrary();
    let filteredSlogans = data.slogans;

    if (language && (language === 'ta' || language === 'en')) {
      filteredSlogans = filteredSlogans.filter((s) => s.language === language);
    }
    if (category && category !== 'all') {
      filteredSlogans = filteredSlogans.filter((s) => s.category === category);
    }
    if (billingModel && billingModel !== 'all') {
      filteredSlogans = filteredSlogans.filter((s) => s.billingModel === billingModel);
    }
    if (status === 'active') {
      filteredSlogans = filteredSlogans.filter((s) => s.isActive);
    } else if (status === 'inactive') {
      filteredSlogans = filteredSlogans.filter((s) => !s.isActive);
    }
    if (search) {
      filteredSlogans = filteredSlogans.filter(
        (s) =>
          s.text.toLowerCase().includes(search) ||
          s.id.toLowerCase().includes(search) ||
          (s.billingModel && s.billingModel.toLowerCase().includes(search))
      );
    }

    return NextResponse.json({
      success: true,
      slogans: filteredSlogans,
      allSlogansCount: data.slogans.length,
      rotationState: data.rotationState,
      modelMappings: data.modelMappings,
      categories: SLOGAN_CATEGORIES,
      billingModels: BILLING_MODELS,
      totalCount: filteredSlogans.length,
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
 * - action: 'seed' | 'reseed' -> Populates/syncs the 100 master slogans and model defaults.
 * - action: 'assign_model' -> Assigns specific slogans to a billing model.
 * - action: 'set_default' -> Sets a slogan as default for its category and language.
 * - Otherwise creates a new billing slogan.
 * SECURITY: Requires admin authentication.
 */
export async function POST(req: NextRequest) {
  const authResult = await verifyAdminAuth(req);
  if (!authResult.authorized) return authResult.response;

  try {
    const body = await req.json();

    // 1. Seed / Reseed 100 Slogans
    if (body.action === 'seed' || body.action === 'reseed') {
      const seededCount = await seedMasterSlogansIfNeeded(body.action === 'reseed');
      return NextResponse.json({
        success: true,
        message: `Successfully seeded/synced ${seededCount} master slogans into library.`,
        seededCount,
      });
    }

    // 2. Assign Slogans to a Billing Model
    if (body.action === 'assign_model') {
      const { modelId, sloganIdTa, sloganIdEn } = body;
      if (!modelId) {
        return NextResponse.json(
          { success: false, error: 'Billing model ID is required.' },
          { status: 400 }
        );
      }
      const updated = await updateBillingModelSloganMapping(modelId, sloganIdTa, sloganIdEn);
      return NextResponse.json({
        success: true,
        message: `Billing model "${modelId}" updated successfully with assigned slogans.`,
        modelMappings: updated,
      });
    }

    // 3. Set Slogan as Default
    if (body.action === 'set_default') {
      const { sloganId } = body;
      if (!sloganId) {
        return NextResponse.json(
          { success: false, error: 'Slogan ID is required.' },
          { status: 400 }
        );
      }
      const db = getAdminFirestore();
      const targetDoc = await db.collection('billingSlogans').doc(sloganId).get();
      if (!targetDoc.exists) {
        return NextResponse.json({ success: false, error: 'Slogan not found' }, { status: 404 });
      }

      const targetData = targetDoc.data() as BillingSlogan;
      // Clear existing default in this category and language
      const existingDefaults = await db
        .collection('billingSlogans')
        .where('category', '==', targetData.category)
        .where('language', '==', targetData.language)
        .where('isDefault', '==', true)
        .get();

      const batch = db.batch();
      for (const d of existingDefaults.docs) {
        batch.update(d.ref, { isDefault: false });
      }
      batch.update(targetDoc.ref, { isDefault: true, updatedAt: new Date().toISOString() });
      await batch.commit();

      return NextResponse.json({
        success: true,
        message: `Slogan #${targetData.sloganNumber} set as default for ${targetData.category} (${targetData.language.toUpperCase()}).`,
      });
    }

    // 4. Create New Slogan
    const { text, language, category, sloganNumber, billingModel, isDefault } = body;
    if (!text || !text.trim()) {
      return NextResponse.json(
        { success: false, error: 'Slogan text is required.' },
        { status: 400 }
      );
    }

    const validCategories: SloganCategory[] = [
      'business_growth',
      'recruitment',
      'trust_quality',
      'theni_pride',
      'custom',
    ];
    const targetCategory: SloganCategory = validCategories.includes(category)
      ? category
      : 'custom';
    const targetLang: SloganLanguage = language === 'en' ? 'en' : 'ta';

    const db = getAdminFirestore();
    const id = `slogan_custom_${Date.now()}`;
    const newSlogan: BillingSlogan = {
      id,
      text: text.trim(),
      language: targetLang,
      sloganNumber: typeof sloganNumber === 'number' ? sloganNumber : (Date.now() % 1000) + 100,
      category: targetCategory,
      billingModel: billingModel || null,
      isActive: true,
      isDefault: Boolean(isDefault),
      usageCount: 0,
      lastUsedAt: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
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
      { success: false, error: error?.message || 'Failed to process request' },
      { status: 500 }
    );
  }
}
