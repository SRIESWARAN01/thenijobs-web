import { NextResponse } from 'next/server';
import { URGENT_HIRING_BADGE_FEE_INR } from '@/lib/constants';

/**
 * URGENT-BADGE-1 — creates a Razorpay order for the ₹99 48-Hour Urgent Hiring Spotlight fee.
 * 
 * Server-derived fixed amount — never trusts a client-supplied price.
 * Notes embed purpose: 'urgent-badge', jobId, and userId so server-side verify/webhook can activate it.
 */
export async function POST(request: Request) {
  try {
    const { jobId, userId } = await request.json();

    if (!jobId || typeof jobId !== 'string') {
      return NextResponse.json({ error: 'Job ID is required' }, { status: 400 });
    }
    if (!userId || typeof userId !== 'string') {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const amount = URGENT_HIRING_BADGE_FEE_INR;
    const orderId = `urg_order_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    const razorpayKey = process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
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
              purpose: 'urgent-badge',
              jobId,
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
        console.error('[Urgent Badge] Razorpay order creation failed:', rpResponse.status);
      } catch (rpErr) {
        console.warn('[Urgent Badge] Razorpay order initiation error:', rpErr);
      }
    }

    // Fallback order ID for dev/test environments without Razorpay keys configured
    return NextResponse.json({
      success: true,
      orderId,
      amount,
      currency: 'INR',
      key: razorpayKey || 'rzp_test_placeholder',
      isRazorpay: false,
    });
  } catch (error: any) {
    console.error('[Urgent Badge Create Order Error]:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
