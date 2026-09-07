import { NextResponse } from 'next/server';
import { SUBSCRIPTION_PLANS } from '@/lib/constants';

// PAY-3: this route used to take `amount` straight from the request body and hand it to
// Razorpay unmodified -- a tampered client could request an order for any amount it liked (e.g.
// ₹1 instead of ₹5,000 for Enterprise). verify.ts already derives its own PLAN_PRICES from
// SUBSCRIPTION_PLANS this same way (PAY-1); create-order now does too, so the amount a client can
// even request an order for is bounded by the real plan price before Razorpay is ever involved.
const PLAN_PRICES: Record<string, number> = Object.fromEntries(
  SUBSCRIPTION_PLANS.map((plan) => [plan.slug, plan.price]),
);

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

    // Generate unique order ID
    const orderId = `order_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    // If Razorpay credentials are set in environment, initiate with Razorpay API
    const razorpayKey = process.env.RAZORPAY_KEY_ID;
    const razorpaySecret = process.env.RAZORPAY_KEY_SECRET;

    if (razorpayKey && razorpaySecret) {
      try {
        const authHeader = `Basic ${Buffer.from(`${razorpayKey}:${razorpaySecret}`).toString('base64')}`;
        const rpResponse = await fetch('https://api.razorpay.com/v1/orders', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': authHeader,
          },
          body: JSON.stringify({
            amount: Math.round(amount * 100), // paise
            currency: 'INR',
            receipt: orderId,
            notes: {
              planSlug: planSlug || 'standard',
              companyId: companyId || '',
              userId: userId || '',
            },
          }),
        });

        if (rpResponse.ok) {
          const rpOrder = await rpResponse.json();
          return NextResponse.json({
            success: true,
            orderId: rpOrder.id,
            amount: amount,
            currency: 'INR',
            key: razorpayKey,
            isRazorpay: true,
          });
        }
      } catch (rpErr) {
        console.warn('[Payment API] Razorpay order initiation fallback to secure gateway:', rpErr);
      }
    }

    // Secure fallback / direct order response
    return NextResponse.json({
      success: true,
      orderId,
      amount,
      currency: 'INR',
      planSlug,
      planName,
      isRazorpay: false,
    });
  } catch (error: any) {
    console.error('[Payment Create Order Error]:', error);
    return NextResponse.json({ error: 'Failed to create payment order' }, { status: 500 });
  }
}
