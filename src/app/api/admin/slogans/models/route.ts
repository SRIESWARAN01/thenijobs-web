import { NextRequest, NextResponse } from 'next/server';
import {
  getBillingModelSlogansMapping,
  updateBillingModelSloganMapping,
} from '@/lib/billing/sloganService';
import { BILLING_MODELS } from '@/lib/billing/sloganLibrary';
import { verifyAdminAuth } from '@/lib/api/adminAuth';
import { safeReadRequestBody } from '@/lib/api/safeResponse';

/**
 * GET /api/admin/slogans/models
 * Returns all supported billing models along with their currently configured Tamil and English slogans.
 * SECURITY: Requires admin authentication.
 */
export async function GET(req: NextRequest) {
  const authResult = await verifyAdminAuth(req);
  if (!authResult.authorized) return authResult.response;

  try {
    const mappings = await getBillingModelSlogansMapping();
    const enriched = BILLING_MODELS.map((model) => ({
      ...model,
      assignedSloganIdTa: mappings[model.id]?.sloganIdTa || model.defaultSloganIdTa,
      assignedSloganIdEn: mappings[model.id]?.sloganIdEn || model.defaultSloganIdEn,
    }));

    return NextResponse.json({
      success: true,
      billingModels: enriched,
      modelMappings: mappings,
    });
  } catch (error: any) {
    console.error('[Admin Slogan Models GET Error]:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to fetch billing model mappings' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/slogans/models
 * Updates the assigned slogans for a specific billing model.
 * SECURITY: Requires admin authentication.
 */
export async function POST(req: NextRequest) {
  const authResult = await verifyAdminAuth(req);
  if (!authResult.authorized) return authResult.response;

  try {
    const body = await safeReadRequestBody<any>(req, {});
    const { modelId, sloganIdTa, sloganIdEn } = body;

    if (!modelId) {
      return NextResponse.json(
        { success: false, error: 'modelId is required' },
        { status: 400 }
      );
    }

    const updated = await updateBillingModelSloganMapping(modelId, sloganIdTa, sloganIdEn);

    return NextResponse.json({
      success: true,
      message: `Billing model "${modelId}" updated successfully.`,
      modelMappings: updated,
    });
  } catch (error: any) {
    console.error('[Admin Slogan Models POST Error]:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to update model mapping' },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      Allow: 'POST, GET, OPTIONS',
      'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
