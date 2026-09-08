import { NextRequest, NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { getAdminFirestore } from '@/lib/firebase/firebaseAdmin';
import { verifyRequestIdToken } from '@/lib/ai/verifyIdToken';
import { decryptApiKey } from '@/lib/ai/keyEncryption';
import { createOpenAIProvider } from '@/lib/ai/providers/openaiProvider';
import { createGeminiProvider } from '@/lib/ai/providers/geminiProvider';

/**
 * AI-CONNECT-1: re-runs a live test call against the caller's own stored, decrypted key.
 * The raw key is decrypted only in memory for this one request and never returned in the
 * response -- only success/latency/error, the same fields `status` already exposes.
 */
export async function POST(req: NextRequest) {
  const verified = await verifyRequestIdToken(req);
  if (!verified.ok) {
    return NextResponse.json({ success: false, error: verified.error }, { status: verified.status });
  }

  try {
    const ref = getAdminFirestore().collection('aiConnections').doc(verified.identity.uid);
    const snap = await ref.get();
    const data = snap.exists ? snap.data() || {} : {};

    if (!data.encryptedKey) {
      return NextResponse.json({ success: false, error: 'No AI key is connected.' }, { status: 404 });
    }

    const apiKey = decryptApiKey({ ciphertext: data.encryptedKey, iv: data.iv, authTag: data.authTag });
    const providerClient = data.provider === 'openai'
      ? createOpenAIProvider(apiKey, data.model)
      : createGeminiProvider(apiKey, data.model);

    const result = await providerClient.testConnection();

    await ref.update({
      status: result.success ? 'connected' : 'error',
      lastTested: FieldValue.serverTimestamp(),
      lastError: result.success ? null : (result.error || 'Test call failed'),
      updatedAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({
      success: result.success,
      status: result.success ? 'connected' : 'error',
      latencyMs: result.latencyMs,
      error: result.success ? undefined : result.error,
    });
  } catch (err: any) {
    console.error('[AI Connections] Test failed:', err?.message || err);
    return NextResponse.json({ success: false, error: 'Could not test your AI connection right now.' }, { status: 500 });
  }
}
