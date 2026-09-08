import { NextRequest, NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { getAdminFirestore } from '@/lib/firebase/firebaseAdmin';
import { verifyRequestIdToken } from '@/lib/ai/verifyIdToken';
import { checkConnectionAccess } from '@/lib/ai/aiConnectionAccess';
import { encryptApiKey, maskApiKey } from '@/lib/ai/keyEncryption';
import { createOpenAIProvider } from '@/lib/ai/providers/openaiProvider';
import { createGeminiProvider } from '@/lib/ai/providers/geminiProvider';
import { PROVIDER_MODELS } from '@/lib/ai/providers/index';

/**
 * AI-CONNECT-1: connect (or replace) the caller's own OpenAI/Gemini key.
 *
 * Order matters here: access is checked BEFORE the key is ever touched, so a request that will
 * be refused never encrypts or test-calls anything; the key is tested BEFORE it is written, so a
 * bad key never gets stored as if it were good; the raw key never appears in the response, only
 * `maskedKey`.
 */
export async function POST(req: NextRequest) {
  const verified = await verifyRequestIdToken(req);
  if (!verified.ok) {
    return NextResponse.json({ success: false, error: verified.error }, { status: verified.status });
  }

  const body = await req.json().catch(() => null);
  const provider = body?.provider as 'openai' | 'gemini' | undefined;
  const apiKey = body?.apiKey as string | undefined;
  const model = body?.model as string | undefined;

  if (!provider || (provider !== 'openai' && provider !== 'gemini')) {
    return NextResponse.json({ success: false, error: 'provider must be "openai" or "gemini".' }, { status: 400 });
  }
  if (!apiKey || typeof apiKey !== 'string' || apiKey.trim().length < 10) {
    return NextResponse.json({ success: false, error: 'A valid API key is required.' }, { status: 400 });
  }
  if (!model || !PROVIDER_MODELS[provider]?.includes(model)) {
    return NextResponse.json({ success: false, error: `model must be one of: ${PROVIDER_MODELS[provider]?.join(', ')}` }, { status: 400 });
  }

  const access = await checkConnectionAccess(verified.identity.uid);
  if (!access.allowed) {
    return NextResponse.json({ success: false, error: access.error }, { status: access.status });
  }

  try {
    const providerClient = provider === 'openai'
      ? createOpenAIProvider(apiKey, model)
      : createGeminiProvider(apiKey, model);

    const testResult = await providerClient.testConnection();
    if (!testResult.success) {
      return NextResponse.json(
        { success: false, error: testResult.error || 'Could not verify this key with the provider.' },
        { status: 400 }
      );
    }

    const encrypted = encryptApiKey(apiKey);

    await getAdminFirestore().collection('aiConnections').doc(verified.identity.uid).set({
      provider,
      model,
      encryptedKey: encrypted.ciphertext,
      iv: encrypted.iv,
      authTag: encrypted.authTag,
      maskedKey: maskApiKey(apiKey),
      status: 'connected',
      lastTested: FieldValue.serverTimestamp(),
      lastError: null,
      connectedAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    }, { merge: true });

    return NextResponse.json({ success: true, provider, model, maskedKey: maskApiKey(apiKey), status: 'connected' });
  } catch (err: any) {
    console.error('[AI Connections] Connect failed:', err?.message || err);
    return NextResponse.json({ success: false, error: 'Could not connect your AI key right now.' }, { status: 500 });
  }
}
