import { NextResponse } from 'next/server';
import { getOrReconcilePaymentStatus } from '@/lib/firebase/paymentAdminService';
import { safeReadRequestBody } from '@/lib/api/safeResponse';

/**
 * Payment Reconciliation API
 *
 * GET /api/payment/reconcile?orderId=...&paymentId=...
 * POST /api/payment/reconcile { orderId, paymentId }
 *
 * Enables frontend and administrators to verify and recover in-flight transactions:
 * 1. Checks if payment is recorded as 'captured' in Firestore.
 * 2. If missing from Firestore, queries Razorpay REST API directly.
 * 3. If Razorpay confirms status is 'captured', securely creates all Firestore records
 *    and returns receiptData ready for immediate PDF download.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const orderId = searchParams.get('orderId') || undefined;
  const paymentId = searchParams.get('paymentId') || undefined;

  if (!orderId && !paymentId) {
    return NextResponse.json({ success: false, error: 'orderId or paymentId is required' }, { status: 400 });
  }

  try {
    const result = await getOrReconcilePaymentStatus(orderId, paymentId);
    return NextResponse.json(result, { headers: { 'Content-Type': 'application/json; charset=utf-8' } });
  } catch (err: any) {
    console.error('[Payment Reconcile GET Error]:', err);
    return NextResponse.json(
      { success: false, error: err?.message || 'Reconciliation error' },
      { status: 500, headers: { 'Content-Type': 'application/json; charset=utf-8' } }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await safeReadRequestBody<{ orderId?: string; paymentId?: string }>(request, {});
    const orderId = body.orderId || undefined;
    const paymentId = body.paymentId || undefined;

    if (!orderId && !paymentId) {
      return NextResponse.json({ success: false, error: 'orderId or paymentId is required' }, { status: 400 });
    }

    const result = await getOrReconcilePaymentStatus(orderId, paymentId);
    return NextResponse.json(result, { headers: { 'Content-Type': 'application/json; charset=utf-8' } });
  } catch (err: any) {
    console.error('[Payment Reconcile POST Error]:', err);
    return NextResponse.json(
      { success: false, error: err?.message || 'Reconciliation error' },
      { status: 500, headers: { 'Content-Type': 'application/json; charset=utf-8' } }
    );
  }
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
