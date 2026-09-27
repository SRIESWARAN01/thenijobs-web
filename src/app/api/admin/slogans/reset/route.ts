import { NextRequest, NextResponse } from 'next/server';
import { resetSloganRotation } from '@/lib/billing/sloganService';

/**
 * POST /api/admin/slogans/reset
 * Resets the dynamic slogan rotation cycle back to cycle 1 (or specified cycle)
 * and clears used IDs so the cycle starts fresh.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const cycle = typeof body.cycle === 'number' && body.cycle > 0 ? body.cycle : 1;

    await resetSloganRotation(cycle);

    return NextResponse.json({
      success: true,
      message: `Rotation cycle successfully reset to Cycle ${cycle}. All slogans available for assignment.`,
      cycle,
    });
  } catch (error: any) {
    console.error('[Admin Slogans Reset Error]:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to reset rotation cycle' },
      { status: 500 }
    );
  }
}
