import { NextResponse } from 'next/server';
import { ALL_VALID_PLAN_PRICES } from '@/lib/constants';
import { safeReadRequestBody, safeParseResponse } from '@/lib/api/safeResponse';

const PLAN_PRICES = ALL_VALID_PLAN_PRICES;

export async function POST(request: Request) {
  try {
    const { planSlug, planName, amount: clientAmount, companyId, userId, role } = await safeReadRequestBody<{
      planSlug?: string;
      planName?: string;
      amount?: number;
      companyId?: string;
      userId?: string;
      role?: string;
    }>(request, {});

    const rawSlug = typeof planSlug === 'string' ? planSlug.trim().toLowerCase() : '';
    const cleanSlug = rawSlug.replace(/^subscription_/, '');
    const expectedAmount = PLAN_PRICES[cleanSlug] ?? (rawSlug ? PLAN_PRICES[rawSlug] : undefined);

    if (expectedAmount === undefined) {
      return NextResponse.json({ success: false, error: 'That subscription plan was not recognised.' }, { status: 400 });
    }

    if (expectedAmount <= 0) {
      return NextResponse.json({ success: false, error: 'No payment is required for this plan.' }, { status: 400 });
    }

    if (clientAmount !== undefined && Number(clientAmount) !== expectedAmount) {
      console.warn(`[Payment Create Order] Note: client requested ₹${clientAmount}, authoritative server price is ₹${expectedAmount}.`);
    }

    // The order is always created for the server-derived price, never whatever the client sent.
    const amount = expectedAmount;

    // Automatically resolve companyId if omitted (non-blocking best effort)
    let resolvedCompanyId = companyId || '';
    if (!resolvedCompanyId && userId) {
      try {
        const { getAdminFirestore } = await import('@/lib/firebase/firebaseAdmin');
        const db = getAdminFirestore();
        const compSnap = await db.collection('companies').where('ownerId', '==', userId).limit(1).get();
        if (!compSnap.empty) {
          resolvedCompanyId = compSnap.docs[0].id;
        }
      } catch (err) {
        console.warn('[Payment Create Order] Could not resolve company for user:', err);
      }
    }

    // Generate unique internal receipt identifier
    const receiptSeed = `order_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    // Razorpay Gateway Credentials
    const rawKey = process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || '';
    const rawSecret = process.env.RAZORPAY_KEY_SECRET || '';
    const razorpayKey = rawKey.trim().replace(/^["']|["']$/g, '');
    const razorpaySecret = rawSecret.trim().replace(/^["']|["']$/g, '');

    if (!razorpayKey || !razorpaySecret) {
      console.error('[Payment API] Razorpay credentials missing. Key:', !!razorpayKey, 'Secret:', !!razorpaySecret);
      return NextResponse.json({
        success: false,
        error: 'Razorpay Gateway credentials are not configured on the server. Please add RAZORPAY_KEY_SECRET and RAZORPAY_KEY_ID in Vercel Environment Variables.',
      }, { 
        status: 503,
        headers: { 'Content-Type': 'application/json; charset=utf-8' }
      });
    }

    try {
      const authHeader = `Basic ${Buffer.from(`${razorpayKey}:${razorpaySecret}`).toString('base64')}`;
      const isTestMode = razorpayKey.startsWith('rzp_test_');

      const rpResponse = await fetch('https://api.razorpay.com/v1/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authHeader,
        },
        body: JSON.stringify({
          amount: Math.round(amount * 100), // paise
          currency: 'INR',
          receipt: receiptSeed,
          notes: {
            planSlug: planSlug || 'standard',
            planName: planName || 'Subscription Plan',
            companyId: resolvedCompanyId,
            userId: userId || '',
            mode: isTestMode ? 'test' : 'live',
          },
        }),
      });

      if (rpResponse.ok) {
        const parsed = await safeParseResponse<any>(rpResponse);
        const rpOrder = parsed.data;
        if (!rpOrder?.id) {
          return NextResponse.json({
            success: false,
            error: 'Razorpay Gateway returned an unexpected response. Please try again.',
          }, { status: 502 });
        }

        // Securely record created order in Firestore (non-blocking best-effort)
        try {
          const { getAdminFirestore } = await import('@/lib/firebase/firebaseAdmin');
          const db = getAdminFirestore();
          await db.collection('orders').doc(rpOrder.id).set({
            orderId: rpOrder.id,
            planSlug: planSlug || 'standard',
            planName: planName || 'Subscription Plan',
            amount,
            currency: 'INR',
            companyId: resolvedCompanyId,
            userId: userId || '',
            role: role || 'employer',
            status: 'created',
            mode: isTestMode ? 'test' : 'live',
            createdAt: new Date(),
            updatedAt: new Date(),
          }, { merge: true });
        } catch (dbErr) {
          console.warn('[Payment Create Order] Order tracking log skipped (non-blocking):', dbErr);
        }

        return NextResponse.json({
          success: true,
          orderId: rpOrder.id,
          amount: amount,
          currency: 'INR',
          key: razorpayKey,
          isRazorpay: true,
          mode: isTestMode ? 'test' : 'live',
        });
      }

      const errorData = await rpResponse.text();
      console.error('[Payment API] Razorpay order creation failed:', rpResponse.status, errorData);
      return NextResponse.json({
        success: false,
        error: `Razorpay Gateway rejected order creation (${rpResponse.status}). Please try again.`,
      }, { status: 502 });
    } catch (rpErr: any) {
      console.error('[Payment API] Razorpay order network error:', rpErr);
      return NextResponse.json({
        success: false,
        error: 'Unable to connect to Razorpay Gateway. Please check your internet connection.',
      }, { status: 502 });
    }
  } catch (error: any) {
    console.error('[Payment Create Order Error]:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to create payment order' },
      { status: 500, headers: { 'Content-Type': 'application/json; charset=utf-8' } }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    { success: false, error: 'Method Not Allowed. Use POST.' },
    { status: 405, headers: { Allow: 'POST, OPTIONS' } }
  );
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
