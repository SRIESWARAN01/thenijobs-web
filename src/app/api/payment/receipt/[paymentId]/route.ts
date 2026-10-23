import { NextResponse } from 'next/server';
import { getAdminFirestore } from '@/lib/firebase/firebaseAdmin';
import { buildReceiptDataFromPayment, fetchRazorpayPayment, recordVerifiedPayment } from '@/lib/firebase/paymentAdminService';

/**
 * Verified Payment Receipt Retrieval Endpoint
 *
 * GET /api/payment/receipt/[paymentId]
 * Returns full ReceiptData ready for PDF download.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ paymentId: string }> }
) {
  const { paymentId } = await params;

  if (!paymentId) {
    return NextResponse.json({ error: 'paymentId is required' }, { status: 400 });
  }

  try {
    const db = getAdminFirestore();
    const docRef = db.collection('payments').doc(paymentId);
    const docSnap = await docRef.get();

    // If not found in Firestore, query Razorpay API to see if it can be reconciled
    if (!docSnap.exists) {
      console.log(`[Receipt API] Payment ${paymentId} not found in Firestore. Checking Razorpay...`);
      const rpPayment = await fetchRazorpayPayment(paymentId);
      if (rpPayment && (rpPayment.status === 'captured' || rpPayment.status === 'authorized')) {
        const notes = rpPayment.notes || {};
        const planSlug = notes.planSlug || 'standard';
        const record = await recordVerifiedPayment({
          orderId: rpPayment.order_id || '',
          paymentId: rpPayment.id,
          planSlug,
          amount: rpPayment.amount / 100,
          userId: notes.userId || '',
          companyId: notes.companyId || '',
          source: 'reconcile',
        });
        return NextResponse.json({
          success: true,
          receiptData: record.receiptData,
          payment: record.payment,
        });
      }

      return NextResponse.json({ error: 'Receipt not found or payment not captured' }, { status: 404 });
    }

    const paymentData = docSnap.data()!;
    if (paymentData.status !== 'captured') {
      return NextResponse.json({ 
        error: 'Payment was not captured. Receipt cannot be generated for unverified or failed transactions.' 
      }, { status: 400 });
    }

    const receiptData = buildReceiptDataFromPayment(paymentData);

    return NextResponse.json({
      success: true,
      receiptData,
      payment: paymentData,
    });
  } catch (err: any) {
    console.error(`[Receipt API] Error retrieving receipt for ${paymentId}:`, err);
    return NextResponse.json({ error: err?.message || 'Error retrieving receipt' }, { status: 500 });
  }
}
