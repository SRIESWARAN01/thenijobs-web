import { NextRequest, NextResponse } from 'next/server';
import { AI_CONNECTION_FEE_INR } from '@/lib/constants';
import { verifyRequestIdToken } from '@/lib/ai/verifyIdToken';

/**
 * AI-CONNECT-1 -- creates a Razorpay order for the one-time ₹50 AI-key connection fee.
 *
 * Mirrors seeker-public-profile/create-order/route.ts's own pattern (server-derived fixed
 * amount, webhook-activated rather than client-trusted) with one deliberate improvement: the
 * userId embedded in the order's `notes` comes from a VERIFIED ID token here, not the request
 * body. The precedent trusts a client-supplied userId directly -- workable there, but this route
 * already has verifyRequestIdToken available (built last tick for the connections routes), so
 * there is no reason not to use it and remove that trust entirely.
 */
export async function POST(req: NextRequest) {
  const verified = await verifyRequestIdToken(req);
  if (!verified.ok) {
    return NextResponse.json({ success: false, error: verified.error }, { status: verified.status });
  }

  try {
    const userId = verified.identity.uid;
    const amount = AI_CONNECTION_FEE_INR;
    const orderId = `aicf_order_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

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
              purpose: 'ai-connection-fee',
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
        console.error('[AI Connection Fee] Razorpay order creation failed:', rpResponse.status);
      } catch (rpErr) {
        console.warn('[AI Connection Fee] Razorpay order initiation error:', rpErr);
      }
    }

    // No Razorpay credentials configured (this environment's actual state) -- a genuine failure,
    // not a fallback success. This purchase is ONLY ever activated by the webhook below, which
    // cannot fire without a real order/payment to trigger it.
    return NextResponse.json({
      success: false,
      error: 'The payment gateway is not configured. Please try again later or contact support.',
    }, { status: 503 });
  } catch (error: any) {
    console.error('[AI Connection Fee Create Order Error]:', error?.message || error);
    return NextResponse.json({ error: 'Failed to create payment order' }, { status: 500 });
  }
}
