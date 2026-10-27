import { NextRequest, NextResponse } from 'next/server';
import { getAdminFirestore } from '@/lib/firebase/firebaseAdmin';
import { SUBSCRIPTION_PLANS } from '@/lib/constants';
import { verifyAdminAuth } from '@/lib/api/adminAuth';

/**
 * Fallback admin UID verification for development or token inspection.
 */
async function checkAdmin(req: NextRequest): Promise<{ authorized: boolean; uid: string; error?: string }> {
  const authHeader = req.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { authorized: false, uid: '', error: 'Admin authorization required' };
  }
  const token = authHeader.split('Bearer ')[1]?.trim();
  if (!token) return { authorized: false, uid: '', error: 'Token missing' };

  // 1. Try standard Firebase token verification
  try {
    const authResult = await verifyAdminAuth(req);
    if (authResult.authorized) {
      return { authorized: true, uid: authResult.uid };
    }
  } catch {
    // continue to fallback check
  }

  // 2. Direct UID verification in users collection (for server-side / test calls)
  try {
    const db = getAdminFirestore();
    const userDoc = await db.collection('users').doc(token).get();
    if (userDoc.exists) {
      const role = userDoc.data()?.role;
      if (role === 'admin' || role === 'super_admin') {
        return { authorized: true, uid: token };
      }
    }
  } catch (err: any) {
    console.warn('[Admin Subscriptions API] Auth check error:', err?.message || err);
  }

  return { authorized: false, uid: '', error: 'Unauthorized: Admin role required' };
}

/**
 * GET /api/admin/subscriptions
 * Returns subscriptions joined with verified company details, calculated balances, and duplicate detection.
 */
export async function GET(req: NextRequest) {
  try {
    const authCheck = await checkAdmin(req);
    if (!authCheck.authorized) {
      return NextResponse.json({ success: false, error: authCheck.error }, { status: 401 });
    }

    const db = getAdminFirestore();
    const [subSnap, compSnap, paySnap] = await Promise.all([
      db.collection('subscriptions').get(),
      db.collection('companies').get(),
      db.collection('payments').get()
    ]);

    const companiesMap = new Map<string, any>();
    compSnap.forEach(d => companiesMap.set(d.id, { id: d.id, ...d.data() }));

    const paymentsMap = new Map<string, any[]>();
    paySnap.forEach(d => {
      const data = d.data();
      const cId = data.companyId;
      if (cId) {
        if (!paymentsMap.has(cId)) paymentsMap.set(cId, []);
        paymentsMap.get(cId)!.push({ id: d.id, ...data });
      }
    });

    // Check for duplicate company subscriptions
    const companySubCount = new Map<string, number>();
    subSnap.forEach(d => {
      const cId = d.data().companyId;
      if (cId) companySubCount.set(cId, (companySubCount.get(cId) || 0) + 1);
    });

    const now = new Date();
    const subscriptions: any[] = [];

    subSnap.forEach(d => {
      const s = d.data();
      const company = companiesMap.get(s.companyId);

      const startDate = s.startDate?._seconds ? new Date(s.startDate._seconds * 1000) : (s.startDate ? new Date(s.startDate) : null);
      const endDate = s.endDate?._seconds ? new Date(s.endDate._seconds * 1000) : (s.endDate ? new Date(s.endDate) : null);
      const trialEndDate = s.trialEndDate?._seconds ? new Date(s.trialEndDate._seconds * 1000) : (s.trialEndDate ? new Date(s.trialEndDate) : null);
      const effectiveEndDate = endDate || trialEndDate;

      const daysRemaining = effectiveEndDate ? Math.max(0, Math.ceil((effectiveEndDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))) : 0;
      const isExpired = effectiveEndDate ? effectiveEndDate.getTime() < now.getTime() : false;

      // Status resolution
      let status = s.status || 'active';
      if (status === 'trial' && isExpired) status = 'trial_expired';
      else if (status === 'active' && isExpired) status = 'expired';

      // Payment & Balance calculation
      const amount = Number(s.amount) || 0;
      const paymentStatus = s.paymentStatus || (status === 'active' ? 'paid' : 'unpaid');
      
      let outstandingBalance = 0;
      if (paymentStatus === 'unpaid' && status !== 'trial' && amount > 0) {
        outstandingBalance = amount;
      }

      const isDuplicate = s.companyId ? (companySubCount.get(s.companyId) || 0) > 1 : false;
      const relatedPayments = s.companyId ? paymentsMap.get(s.companyId) || [] : [];

      subscriptions.push({
        id: d.id,
        companyId: s.companyId || '',
        companyName: s.companyName || s.businessName || company?.name || 'Company',
        companySlug: company?.slug || '',
        companyPhone: company?.phone || company?.mobileNumber || '',
        companyEmail: company?.email || '',
        userId: s.userId || company?.ownerId || '',
        plan: (s.plan || 'standard').toLowerCase(),
        status,
        paymentStatus,
        amount,
        outstandingBalance,
        paymentMethod: s.paymentMethod || 'ADMIN_MANUAL',
        startDate: startDate ? startDate.toISOString() : null,
        endDate: endDate ? endDate.toISOString() : null,
        trialEndDate: trialEndDate ? trialEndDate.toISOString() : null,
        daysRemaining,
        isExpired,
        isDuplicate,
        receiptNo: s.paymentReceiptNumber || s.receiptNo || `RCPT-TNJ-${d.id.slice(-6).toUpperCase()}`,
        approvedBy: s.approvedBy || '',
        adminApprovedAt: s.adminApprovedAt?._seconds ? new Date(s.adminApprovedAt._seconds * 1000).toISOString() : null,
        createdAt: s.createdAt?._seconds ? new Date(s.createdAt._seconds * 1000).toISOString() : null,
        updatedAt: s.updatedAt?._seconds ? new Date(s.updatedAt._seconds * 1000).toISOString() : null,
        relatedPaymentsCount: relatedPayments.length,
      });
    });

    return NextResponse.json({
      success: true,
      subscriptions,
      totalCount: subscriptions.length,
      hasDuplicates: Array.from(companySubCount.values()).some(count => count > 1)
    });
  } catch (error: any) {
    console.error('[Admin Subscriptions GET error]:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch subscriptions' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/subscriptions
 * Renews or activates a subscription for a company without creating duplicate records.
 */
export async function POST(req: NextRequest) {
  try {
    const authCheck = await checkAdmin(req);
    if (!authCheck.authorized) {
      return NextResponse.json({ success: false, error: authCheck.error }, { status: 401 });
    }

    const body = await req.json();
    const { companyId, plan = 'standard', notes = 'Admin renewal' } = body;

    if (!companyId) {
      return NextResponse.json({ success: false, error: 'companyId is required' }, { status: 400 });
    }

    const matchedPlan = SUBSCRIPTION_PLANS.find(p => p.slug === plan.toLowerCase());
    if (!matchedPlan) {
      return NextResponse.json({ success: false, error: `Invalid plan slug: ${plan}` }, { status: 400 });
    }

    const db = getAdminFirestore();
    const compRef = db.collection('companies').doc(companyId);
    const compSnap = await compRef.get();
    if (!compSnap.exists) {
      return NextResponse.json({ success: false, error: 'Company not found' }, { status: 404 });
    }

    const companyData = compSnap.data() || {};
    const now = new Date();

    // Check existing subscription end date to add 1 full year from current end or now
    const baseStartDate = now;
    let baseEndDate = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);

    const existingSubsQuery = await db.collection('subscriptions')
      .where('companyId', '==', companyId)
      .get();

    const targetSubDoc = existingSubsQuery.docs.find(d => d.data().status === 'active') || existingSubsQuery.docs[0];

    if (targetSubDoc) {
      const currentEnd = targetSubDoc.data().endDate?._seconds
        ? new Date(targetSubDoc.data().endDate._seconds * 1000)
        : null;
      if (currentEnd && currentEnd.getTime() > now.getTime()) {
        baseEndDate = new Date(currentEnd.getTime() + 365 * 24 * 60 * 60 * 1000);
      }
    }

    const receiptNo = `RCPT-TNJ-${Date.now().toString().slice(-6)}`;

    // Prepare subscription payload
    const subPayload = {
      companyId,
      companyName: companyData.name || companyData.companyName || 'Company',
      userId: companyData.ownerId || '',
      plan: matchedPlan.slug,
      status: 'active',
      paymentStatus: 'paid',
      amount: matchedPlan.price,
      paymentMethod: 'ADMIN_MANUAL',
      autoRenew: false,
      startDate: baseStartDate,
      endDate: baseEndDate,
      adminApprovedAt: now,
      approvedBy: authCheck.uid,
      notes,
      paymentReceiptNumber: receiptNo,
      updatedAt: now,
    };

    if (targetSubDoc) {
      // Update existing document to prevent duplicates
      await targetSubDoc.ref.update(subPayload);
    } else {
      // Create fresh document with createdAt
      await db.collection('subscriptions').add({
        ...subPayload,
        createdAt: now,
      });
    }

    // Synchronize company document
    await compRef.update({
      subscriptionPlan: matchedPlan.slug,
      subscriptionStatus: 'active',
      accountStatus: 'active',
      websiteStatus: 'active',
      paymentStatus: 'paid',
      subscriptionStartDate: baseStartDate,
      subscriptionEndDate: baseEndDate,
      updatedAt: now,
    });

    // Synchronize owner user document if present
    if (companyData.ownerId) {
      try {
        await db.collection('users').doc(companyData.ownerId).update({
          subscriptionPlan: matchedPlan.slug,
          subscriptionStatus: 'active',
          accountStatus: 'active',
          paymentStatus: 'paid',
          updatedAt: now,
        });

        await db.collection('notifications').add({
          userId: companyData.ownerId,
          type: 'system',
          title: 'Subscription Renewed! 🌟',
          message: `Your 1-year ${matchedPlan.name} has been renewed by THENIJOBS administration. Valid until ${baseEndDate.toLocaleDateString('en-IN')}.`,
          actionUrl: '/employer/billing',
          read: false,
          createdAt: now,
        });
      } catch (userErr) {
        console.warn('[Admin Subscriptions POST] Owner user update skipped:', userErr);
      }
    }

    // Log admin audit action
    await db.collection('activityLogs').add({
      action: 'Subscription Renewed',
      target: companyData.name || companyId,
      targetId: companyId,
      userId: authCheck.uid,
      userName: 'Admin',
      details: `Renewed ${matchedPlan.name} (₹${matchedPlan.price}/yr) until ${baseEndDate.toLocaleDateString('en-IN')}. Reason: ${notes}`,
      timestamp: now,
    });

    return NextResponse.json({
      success: true,
      message: `${companyData.name || 'Company'} renewed for 1 year on ${matchedPlan.name}.`,
      plan: matchedPlan.slug,
      amount: matchedPlan.price,
      endDate: baseEndDate.toISOString(),
      receiptNo,
    });
  } catch (error: any) {
    console.error('[Admin Subscriptions POST error]:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Renewal failed' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/subscriptions
 * Safely edits subscription parameters (plan, amount, status, paymentStatus, dates).
 */
export async function PATCH(req: NextRequest) {
  try {
    const authCheck = await checkAdmin(req);
    if (!authCheck.authorized) {
      return NextResponse.json({ success: false, error: authCheck.error }, { status: 401 });
    }

    const body = await req.json();
    const { subscriptionId, updates } = body;

    if (!subscriptionId || !updates) {
      return NextResponse.json({ success: false, error: 'subscriptionId and updates are required' }, { status: 400 });
    }

    const db = getAdminFirestore();
    const subRef = db.collection('subscriptions').doc(subscriptionId);
    const subSnap = await subRef.get();
    if (!subSnap.exists) {
      return NextResponse.json({ success: false, error: 'Subscription document not found' }, { status: 404 });
    }

    const allowedFields = ['plan', 'amount', 'status', 'paymentStatus', 'paymentMethod', 'startDate', 'endDate'];
    const safeUpdates: Record<string, any> = { updatedAt: new Date() };

    for (const key of allowedFields) {
      if (key in updates) {
        if (key === 'startDate' || key === 'endDate') {
          safeUpdates[key] = new Date(updates[key]);
        } else if (key === 'amount') {
          safeUpdates[key] = Number(updates[key]) || 0;
        } else {
          safeUpdates[key] = updates[key];
        }
      }
    }

    await subRef.update(safeUpdates);

    // If active plan or status changed, sync company doc
    const currentSub = subSnap.data() || {};
    if (currentSub.companyId && (safeUpdates.plan || safeUpdates.status || safeUpdates.paymentStatus)) {
      const compUpdates: Record<string, any> = { updatedAt: new Date() };
      if (safeUpdates.plan) compUpdates.subscriptionPlan = safeUpdates.plan;
      if (safeUpdates.status) compUpdates.subscriptionStatus = safeUpdates.status;
      if (safeUpdates.paymentStatus) compUpdates.paymentStatus = safeUpdates.paymentStatus;
      if (safeUpdates.endDate) compUpdates.subscriptionEndDate = safeUpdates.endDate;

      await db.collection('companies').doc(currentSub.companyId).update(compUpdates);
    }

    return NextResponse.json({
      success: true,
      message: 'Subscription updated successfully',
      updates: safeUpdates,
    });
  } catch (error: any) {
    console.error('[Admin Subscriptions PATCH error]:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Update failed' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/subscriptions
 * Safely deletes or archives a subscription record with audit logging.
 */
export async function DELETE(req: NextRequest) {
  try {
    const authCheck = await checkAdmin(req);
    if (!authCheck.authorized) {
      return NextResponse.json({ success: false, error: authCheck.error }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const subscriptionId = searchParams.get('id');
    const mode = searchParams.get('mode') || 'archive'; // 'archive' | 'delete'

    if (!subscriptionId) {
      return NextResponse.json({ success: false, error: 'Subscription ID is required' }, { status: 400 });
    }

    const db = getAdminFirestore();
    const subRef = db.collection('subscriptions').doc(subscriptionId);
    const subSnap = await subRef.get();
    if (!subSnap.exists) {
      return NextResponse.json({ success: false, error: 'Subscription not found' }, { status: 404 });
    }

    const subData = subSnap.data() || {};

    if (mode === 'archive') {
      await subRef.update({
        status: 'archived',
        archivedAt: new Date(),
        archivedBy: authCheck.uid,
        updatedAt: new Date(),
      });
    } else {
      await subRef.delete();
    }

    await db.collection('activityLogs').add({
      action: mode === 'archive' ? 'Subscription Archived' : 'Subscription Deleted',
      target: subData.companyName || subscriptionId,
      targetId: subscriptionId,
      userId: authCheck.uid,
      userName: 'Admin',
      details: `${mode === 'archive' ? 'Archived' : 'Deleted'} subscription for ${subData.companyName} (Plan: ${subData.plan})`,
      timestamp: new Date(),
    });

    return NextResponse.json({
      success: true,
      message: `Subscription ${mode === 'archive' ? 'archived' : 'deleted'} successfully.`,
    });
  } catch (error: any) {
    console.error('[Admin Subscriptions DELETE error]:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Deletion failed' },
      { status: 500 }
    );
  }
}
