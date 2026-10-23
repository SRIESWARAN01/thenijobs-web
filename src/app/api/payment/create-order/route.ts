import { NextResponse } from 'next/server';
import { ALL_VALID_PLAN_PRICES } from '@/lib/constants';
import { getAdminFirestore } from '@/lib/firebase/firebaseAdmin';

const PLAN_PRICES = ALL_VALID_PLAN_PRICES;

export async function POST(request: Request) {
  try {
    const { planSlug, planName, amount: clientAmount, companyId, userId, role } = await request.json();

    const expectedAmount = typeof planSlug === 'string' ? PLAN_PRICES[planSlug] : undefined;

    if (expectedAmount === undefined) {
      return NextResponse.json({ error: 'That subscription plan was not recognised.' }, { status: 400 });
    }

    if (expectedAmount <= 0) {
      return NextResponse.json({ error: 'No payment is required for this plan.' }, { status: 400 });
    }

    if (clientAmount !== undefined && clientAmount !== expectedAmount) {
      console.error(`[Payment Create Order] AMOUNT MISMATCH. Plan "${planSlug}" expects ₹${expectedAmount}, client sent ₹${clientAmount}.`);
      return NextResponse.json({ error: 'Payment amount does not match the selected plan. Please refresh and try again.' }, { status: 400 });
    }

    // The order is always created for the server-derived price, never whatever the client sent.
    const amount = expectedAmount;

    // Generate unique internal receipt identifier
    const receiptSeed = `order_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    // Razorpay Gateway Credentials
    const razorpayKey = process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
    const razorpaySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!razorpayKey || !razorpaySecret) {
      return NextResponse.json({
        success: false,
        error: 'Razorpay Gateway credentials are not configured.',
      }, { status: 503 });
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
            companyId: companyId || '',
            userId: userId || '',
            mode: isTestMode ? 'test' : 'live',
          },
        }),
      });

      if (rpResponse.ok) {
        const rpOrder = await rpResponse.json();

        // Securely record created order in Firestore
        try {
          const db = getAdminFirestore();
          await db.collection('orders').doc(rpOrder.id).set({
            orderId: rpOrder.id,
            planSlug: planSlug || 'standard',
            planName: planName || 'Subscription Plan',
            amount,
            currency: 'INR',
            companyId: companyId || '',
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
    return NextResponse.json({ error: 'Failed to create payment order' }, { status: 500 });
  }
}
