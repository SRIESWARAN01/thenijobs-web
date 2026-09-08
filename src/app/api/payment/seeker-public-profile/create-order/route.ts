import { NextResponse } from 'next/server';
import { SEEKER_PUBLIC_PROFILE_FEE_INR } from '@/lib/constants';

/**
 * SEEKERPRIVACY-1 — creates a Razorpay order for the ₹50/year seeker public-profile fee.
 *
 * Mirrors payment/create-order/route.ts's own pattern (server-derived, fixed amount — never
 * trusts a client-supplied price), but this purchase is activated by a real server-to-server
 * Razorpay webhook (see ../webhook/route.ts), not by a client-reported "I paid" callback. The
 * userId is embedded in the order's own `notes` so the webhook — which only ever sees Razorpay's
 * own order/payment payload, never anything the client says — can identify who to activate.
 */
export async function POST(request: Request) {
  try {
    const { userId } = await request.json();

    if (!userId || typeof userId !== 'string') {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const amount = SEEKER_PUBLIC_PROFILE_FEE_INR;
    const orderId = `spp_order_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

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
              purpose: 'seeker-public-profile',
              userId,
            },
          }),
        });

        if (rpResponse.ok) {
          const rpOrder = await rpResponse.json();
          return NextResponse.json({
            success: true,
            orderId: rpOrder.id,
            amount,
            currency: 'INR',
            key: razorpayKey,
            isRazorpay: true,
          });
        }
        console.error('[Seeker Public Profile] Razorpay order creation failed:', rpResponse.status);
      } catch (rpErr) {
        console.warn('[Seeker Public Profile] Razorpay order initiation error:', rpErr);
      }
    }

    // No Razorpay credentials configured (this environment's actual state) — there is no real
    // gateway to open a checkout against, so this is a genuine failure, not a fallback success.
    // Unlike payment/create-order/route.ts's own "secure fallback / direct order response" for
    // the employer flow, this purchase is ONLY ever activated by the real webhook below, which
    // cannot fire without a real Razorpay order/payment to trigger it — inventing a fake
    // isRazorpay:false order here would let a client claim "paid" with nothing to verify against.
    return NextResponse.json({
      success: false,
      error: 'The payment gateway is not configured. Please try again later or contact support.',
    }, { status: 503 });
  } catch (error: any) {
    console.error('[Seeker Public Profile Create Order Error]:', error?.message || error);
    return NextResponse.json({ error: 'Failed to create payment order' }, { status: 500 });
  }
}
