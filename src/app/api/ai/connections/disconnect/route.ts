import { NextRequest, NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { getAdminFirestore } from '@/lib/firebase/firebaseAdmin';
import { verifyRequestIdToken } from '@/lib/ai/verifyIdToken';

/**
 * AI-CONNECT-1: genuinely removes the stored key material -- FieldValue.delete() on the
 * encrypted payload and every derived field, not a hidden "disabled" flag next to a still-present
 * ciphertext. `feePaid`/`feePaidVia` are deliberately NOT deleted: the Rs50 is a one-time
 * THENIJOBS connection *right*, not a per-key charge, so a seeker who already paid can disconnect
 * and later connect a replacement key without paying again. `connect` only ever re-tests and
 * re-encrypts; it never re-checks a fee that disconnect has already satisfied.
 */
export async function POST(req: NextRequest) {
  const verified = await verifyRequestIdToken(req);
  if (!verified.ok) {
    return NextResponse.json({ success: false, error: verified.error }, { status: verified.status });
  }

  try {
    const ref = getAdminFirestore().collection('aiConnections').doc(verified.identity.uid);
    const snap = await ref.get();
    if (!snap.exists) {
      return NextResponse.json({ success: true, wasConnected: false });
    }

    await ref.update({
      provider: FieldValue.delete(),
      model: FieldValue.delete(),
      encryptedKey: FieldValue.delete(),
      iv: FieldValue.delete(),
      authTag: FieldValue.delete(),
      maskedKey: FieldValue.delete(),
      status: FieldValue.delete(),
      lastTested: FieldValue.delete(),
      lastError: FieldValue.delete(),
      connectedAt: FieldValue.delete(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({ success: true, wasConnected: true });
  } catch (err: any) {
    console.error('[AI Connections] Disconnect failed:', err?.message || err);
    return NextResponse.json({ success: false, error: 'Could not disconnect your AI key right now.' }, { status: 500 });
  }
}
