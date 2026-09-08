import { NextRequest, NextResponse } from 'next/server';
import { getAdminFirestore } from '@/lib/firebase/firebaseAdmin';
import { verifyRequestIdToken } from '@/lib/ai/verifyIdToken';

/**
 * AI-CONNECT-1: the caller's own connection status. Never returns encryptedKey/iv/authTag --
 * only fields safe to show in a settings UI.
 */
export async function GET(req: NextRequest) {
  const verified = await verifyRequestIdToken(req);
  if (!verified.ok) {
    return NextResponse.json({ success: false, error: verified.error }, { status: verified.status });
  }

  try {
    const snap = await getAdminFirestore().collection('aiConnections').doc(verified.identity.uid).get();
    const data = snap.exists ? snap.data() || {} : {};

    // A document can exist with only feePaid/feePaidVia set (disconnect preserves the fee
    // entitlement but deletes the key material) -- `encryptedKey` presence is what "connected"
    // actually means, not mere document existence.
    if (!data.encryptedKey) {
      return NextResponse.json({ success: true, connected: false, feePaid: data.feePaid === true });
    }

    return NextResponse.json({
      success: true,
      connected: true,
      feePaid: data.feePaid === true,
      provider: data.provider,
      model: data.model,
      maskedKey: data.maskedKey,
      status: data.status,
      lastTested: data.lastTested?.toMillis?.() ?? null,
      lastError: data.lastError ?? null,
      connectedAt: data.connectedAt?.toMillis?.() ?? null,
    });
  } catch (err: any) {
    console.error('[AI Connections] Status read failed:', err?.message || err);
    return NextResponse.json({ success: false, error: 'Could not load your connection status right now.' }, { status: 500 });
  }
}
