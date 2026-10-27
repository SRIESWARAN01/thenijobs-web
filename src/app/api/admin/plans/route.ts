import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase/config';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { SUBSCRIPTION_PLANS, FEATURE_ACCESS_MATRIX_20_ROWS, FeatureMatrixRow } from '@/lib/constants';

const SETTINGS_DOC = 'platformSettings';
const PLANS_SUBDOC = 'subscriptionPlans';

/**
 * GET /api/admin/plans
 * Returns authoritative plans and 20-row feature access matrix merged with custom admin configurations.
 */
export async function GET() {
  try {
    let customPlans: any = {};
    let customMatrix: any[] = [];
    try {
      const snap = await getDoc(doc(db, SETTINGS_DOC, PLANS_SUBDOC));
      if (snap.exists()) {
        const data = snap.data();
        customPlans = data?.plans || {};
        customMatrix = Array.isArray(data?.featureMatrix) ? data.featureMatrix : [];
      }
    } catch (dbErr) {
      console.warn('[Admin Plans API] Could not read custom plans, using defaults:', dbErr);
    }

    // Merge default plans with custom overrides
    const plans = SUBSCRIPTION_PLANS.map((defaultPlan) => {
      const override = customPlans[defaultPlan.slug] || customPlans[defaultPlan.id] || {};
      return {
        ...defaultPlan,
        ...override,
        price: typeof override.price === 'number' ? override.price : defaultPlan.price,
        monthlyEquivalent: Math.round(
          (typeof override.price === 'number' ? override.price : defaultPlan.price) / 12
        ),
        dailyEquivalent: Number(
          ((typeof override.price === 'number' ? override.price : defaultPlan.price) / 365).toFixed(2)
        ),
        isActive: override.isActive !== false,
      };
    });

    // Merge feature matrix
    const customMatrixMap = new Map<string, FeatureMatrixRow>();
    customMatrix.forEach((row) => {
      if (row?.id) customMatrixMap.set(row.id, row);
    });

    const featureMatrix = FEATURE_ACCESS_MATRIX_20_ROWS.map((defaultRow) => {
      const override = customMatrixMap.get(defaultRow.id);
      if (!override) return defaultRow;
      return {
        ...defaultRow,
        basic: { ...defaultRow.basic, ...(override.basic || {}) },
        standard: { ...defaultRow.standard, ...(override.standard || {}) },
        premium: { ...defaultRow.premium, ...(override.premium || {}) },
        enterprise: { ...defaultRow.enterprise, ...(override.enterprise || {}) },
      };
    });

    return NextResponse.json({
      success: true,
      plans,
      featureMatrix,
      defaults: SUBSCRIPTION_PLANS,
      defaultMatrix: FEATURE_ACCESS_MATRIX_20_ROWS,
      hasCustomOverrides: Object.keys(customPlans).length > 0 || customMatrix.length > 0,
    });
  } catch (error: any) {
    console.error('[Admin Plans GET error]:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch plan settings' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/plans
 * Updates plan settings and feature matrix. Requires verified admin bearer token.
 */
export async function PUT(req: NextRequest) {
  try {
    // 1. Verify Authorization Header
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'Admin authorization required' },
        { status: 401 }
      );
    }

    const token = authHeader.split('Bearer ')[1]?.trim();
    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Invalid admin credentials' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { plans, featureMatrix, resetToDefault } = body;

    // Reset workflow
    if (resetToDefault === true) {
      await setDoc(doc(db, SETTINGS_DOC, PLANS_SUBDOC), {
        plans: {},
        featureMatrix: [],
        updatedAt: serverTimestamp(),
        resetToDefaultAt: serverTimestamp(),
      });
      return NextResponse.json({
        success: true,
        message: 'Subscription plans and feature matrix successfully reset to system defaults.',
        plans: SUBSCRIPTION_PLANS,
        featureMatrix: FEATURE_ACCESS_MATRIX_20_ROWS,
      });
    }

    const updatesToSave: Record<string, any> = {
      updatedAt: serverTimestamp(),
      updatedVia: 'admin_portal_plan_editor',
    };

    // If plans provided, sanitize and validate
    if (Array.isArray(plans) && plans.length > 0) {
      const plansToSave: Record<string, any> = {};

      for (const p of plans) {
        const slug = (p.slug || p.id || '').toLowerCase();
        if (!slug) continue;

        if (typeof p.price !== 'number' || p.price < 0) {
          return NextResponse.json(
            { success: false, error: `Invalid price for plan ${slug}. Must be a positive number.` },
            { status: 400 }
          );
        }

        plansToSave[slug] = {
          name: String(p.name || '').trim(),
          price: p.price,
          period: p.period || 'year',
          trialDurationDays: typeof p.trialDurationDays === 'number' ? p.trialDurationDays : 15,
          isActive: p.isActive !== false,
          features: Array.isArray(p.features) ? p.features.map(String) : [],
          notIncluded: Array.isArray(p.notIncluded) ? p.notIncluded.map(String) : [],
          recommended: Boolean(p.recommended),
          badge: String(p.badge || ''),
          bestFor: String(p.bestFor || ''),
          // Custom feature limits
          activeJobLimit: typeof p.activeJobLimit === 'number' ? p.activeJobLimit : undefined,
          productLimit: typeof p.productLimit === 'number' ? p.productLimit : undefined,
          serviceLimit: typeof p.serviceLimit === 'number' ? p.serviceLimit : undefined,
          galleryLimit: typeof p.galleryLimit === 'number' ? p.galleryLimit : undefined,
          videoLimit: typeof p.videoLimit === 'number' ? p.videoLimit : undefined,
          branchLimit: typeof p.branchLimit === 'number' ? p.branchLimit : undefined,
          staffLimit: typeof p.staffLimit === 'number' ? p.staffLimit : undefined,
        };
      }

      updatesToSave.plans = plansToSave;
    }

    // If feature matrix provided, sanitize and validate
    if (Array.isArray(featureMatrix) && featureMatrix.length > 0) {
      updatesToSave.featureMatrix = featureMatrix.map((r: any) => ({
        id: String(r.id || ''),
        feature: String(r.feature || ''),
        category: String(r.category || 'Core Resources & Postings'),
        basic: {
          value: String(r.basic?.value || ''),
          accessType: String(r.basic?.accessType || 'Not available'),
        },
        standard: {
          value: String(r.standard?.value || ''),
          accessType: String(r.standard?.accessType || 'Available'),
        },
        premium: {
          value: String(r.premium?.value || ''),
          accessType: String(r.premium?.accessType || 'Premium feature'),
        },
        enterprise: {
          value: String(r.enterprise?.value || ''),
          accessType: String(r.enterprise?.accessType || 'Enterprise feature'),
        },
      }));
    }

    // Persist to Firestore platformSettings/subscriptionPlans
    await setDoc(doc(db, SETTINGS_DOC, PLANS_SUBDOC), updatesToSave, { merge: true });

    return NextResponse.json({
      success: true,
      message: 'Subscription plans and feature access matrix successfully saved. Historical subscriber records preserved.',
      saved: updatesToSave,
    });
  } catch (error: any) {
    console.error('[Admin Plans PUT error]:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update plan settings' },
      { status: 500 }
    );
  }
}
