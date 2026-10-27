import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { getAdminFirestore } from '@/lib/firebase/firebaseAdmin';
import { URGENT_HIRING_BADGE_FEE_INR, URGENT_HIRING_DURATION_HOURS, VALID_URGENT_FEES } from '@/lib/constants';
import { dispatchTalukWhatsAppBroadcast } from '@/lib/urgentJobBroadcast';

export async function POST(request: Request) {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      jobId,
      userId,
      fee,
      amount: requestedAmount,
    } = await request.json();

    if (!jobId || !userId) {
      return NextResponse.json({ error: 'Missing jobId or userId' }, { status: 400 });
    }

    // Determine validated fee (₹99 or ₹149)
    const rawFee = Number(fee || requestedAmount);
    const feePaid = (rawFee && (VALID_URGENT_FEES as readonly number[]).includes(rawFee))
      ? rawFee
      : URGENT_HIRING_BADGE_FEE_INR;

    // Verify HMAC SHA-256 signature if secret is configured
    const razorpaySecret = process.env.RAZORPAY_KEY_SECRET;
    if (razorpaySecret && razorpay_signature && razorpay_order_id && razorpay_payment_id) {
      const generatedSignature = crypto
        .createHmac('sha256', razorpaySecret)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest('hex');

      if (generatedSignature !== razorpay_signature) {
        return NextResponse.json({ error: 'Invalid payment signature' }, { status: 400 });
      }
    }

    const db = getAdminFirestore();
    const jobRef = db.collection('jobs').doc(jobId);
    const jobSnap = await jobRef.get();

    if (!jobSnap.exists) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    const jobData = jobSnap.data() || {};
    const now = new Date();
    const urgentUntilDate = new Date(now.getTime() + URGENT_HIRING_DURATION_HOURS * 60 * 60 * 1000);
    const paymentId = razorpay_payment_id || `urg_pay_${Date.now()}`;
    const planTier = feePaid === 149 ? 'super_spotlight' : 'standard_spotlight';

    // 1. Update the Job Document with 48h Urgent Spotlight
    await jobRef.set(
      {
        isUrgent: true,
        urgentUntil: urgentUntilDate.toISOString(),
        urgentPurchasedAt: now.toISOString(),
        urgentFeePaid: feePaid,
        urgentPaymentId: paymentId,
        urgentTier: planTier,
        urgentDurationHours: URGENT_HIRING_DURATION_HOURS,
        updatedAt: now.toISOString(),
      },
      { merge: true }
    );

    // 2. Log Payment Record
    const paymentRef = db.collection('payments').doc(paymentId);
    await paymentRef.set(
      {
        paymentId,
        orderId: razorpay_order_id || 'manual_order',
        userId,
        jobId,
        companyId: jobData.companyId || '',
        purpose: 'urgent-badge',
        planTier,
        amount: feePaid,
        currency: 'INR',
        status: 'paid',
        receiptNumber: `TJ-URG-${now.getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
        createdAt: now.toISOString(),
      },
      { merge: true }
    );

    // 3. Instant auto-broadcast to the relevant taluk WhatsApp alert channel
    const broadcastResult = await dispatchTalukWhatsAppBroadcast(
      {
        id: jobId,
        title: jobData.title || 'Urgent Position',
        companyName: jobData.companyName || jobData.company?.name || 'Local Company',
        location: jobData.location || 'Theni',
        district: jobData.district || 'Theni',
        salaryMin: jobData.salaryMin,
        salaryMax: jobData.salaryMax,
        salary: jobData.salary,
        openings: jobData.openings,
        jobType: jobData.jobType,
        description: jobData.description,
      },
      {
        feePaid,
        userId,
        paymentId,
      }
    );

    return NextResponse.json({
      success: true,
      message: '48-Hour Urgent Hiring Spotlight activated and broadcasted to Taluk channel successfully!',
      urgentUntil: urgentUntilDate.toISOString(),
      feePaid,
      planTier,
      taluk: broadcastResult.taluk,
      channelName: broadcastResult.channelName,
      channelTamilName: broadcastResult.channelTamilName,
      channelUrl: broadcastResult.channelUrl,
      directWhatsAppShareUrl: broadcastResult.directWhatsAppShareUrl,
      whatsAppBroadcastText: broadcastResult.broadcastText,
    });
  } catch (error: any) {
    console.error('[Urgent Badge Verify Error]:', error);
    return NextResponse.json({ error: error.message || 'Verification failed' }, { status: 500 });
  }
}
