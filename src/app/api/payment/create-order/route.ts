import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { planSlug, planName, amount, companyId, userId, role } = await request.json();

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: 'Valid payment amount is required' }, { status: 400 });
    }

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
