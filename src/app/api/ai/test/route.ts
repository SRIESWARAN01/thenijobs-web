import { NextRequest, NextResponse } from 'next/server';
import { createGeminiProvider } from '@/lib/ai/providers/geminiProvider';
import { createGroqProvider } from '@/lib/ai/providers/groqProvider';
import { createOpenAIProvider } from '@/lib/ai/providers/openaiProvider';

const PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const API_KEY = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;

/**
 * AI-2 — establish that the caller is an admin, or refuse.
 *
 * Returns the caller's uid when they are an admin, and null otherwise. Every failure returns
 * null: no token, a token that will not verify, a user document that cannot be read or does not
 * exist, and any role that is not admin or super_admin.
 *
 * The role is read through the Firestore REST API with the caller's OWN ID TOKEN as the bearer
 * credential, so the request is authenticated as that user and the existing
 * `allow read: if isOwner(userId) || isAdmin()` rule permits it. Reading it with
 * NEXT_PUBLIC_FIREBASE_API_KEY instead would be an UNAUTHENTICATED request and denied outright
 * once the default-deny rules are live — the same trap PAY-1 recorded for the payment writes.
 * An API key is not an authorization credential.
 */
async function adminUidOrNull(req: NextRequest): Promise<string | null> {
  const authHeader = req.headers.get('authorization');
  const idToken = authHeader?.startsWith('Bearer ') ? authHeader.slice('Bearer '.length).trim() : '';
  if (!idToken || !PROJECT_ID || !API_KEY) return null;

  try {
    const verifyRes = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      },
    );
    const verifyData = await verifyRes.json().catch(() => null);
    if (!verifyRes.ok || !verifyData?.users?.length) return null;

    const uid = verifyData.users[0].localId as string;

    const userRes = await fetch(
      `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/users/${uid}`,
      { headers: { Authorization: `Bearer ${idToken}` } },
    );
    if (!userRes.ok) return null;

    const userDoc = await userRes.json().catch(() => null);
    const role = userDoc?.fields?.role?.stringValue;
    return role === 'admin' || role === 'super_admin' ? uid : null;
  } catch (err) {
    console.error('[AI Test API] admin check failed:', err);
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    // AI-2: this route had no identity check at all. AI-1 stopped it falling back to the
    // server's provider keys, which is what made it cost the owner money, but left it open to
    // anyone — an unauthenticated credential-testing oracle on the platform's own domain, and
    // the only route under src/app/api/** with nothing guarding it. It is reachable only from
    // the admin AI-settings screen, so it asks for an admin.
    const adminUid = await adminUidOrNull(req);
    if (!adminUid) {
      return NextResponse.json(
        { success: false, error: 'Administrator sign-in is required to test a provider connection.' },
        { status: 403 },
      );
    }

    const { provider, apiKey, model } = await req.json();

    // AI-1: this endpoint has no authentication, and it used to fall back to the SERVER's
    // GROQ_API_KEY / GEMINI_API_KEY / OPENAI_API_KEY when the caller sent none. So anyone able
    // to POST here could spend the owner's provider quota, and use the response as an oracle
    // for whether those keys were live — without ever holding one.
    //
    // The only caller, the admin AI-settings page, returns early unless it has a key and
    // always sends it, so requiring one costs that page nothing. A caller must now bring their
    // own key, which makes this useless as a way to spend ours.
    //
    // This is NOT the whole fix. The endpoint still needs an admin check, which has to be
    // added alongside the admin page that calls it; that page is currently held by another
    // branch. Recorded in the ledger rather than half-done here.
    const resolvedApiKey = typeof apiKey === 'string' ? apiKey.trim() : '';

    if (!provider || !resolvedApiKey) {
      return NextResponse.json(
        { success: false, error: 'Provider and API Key are required' },
        { status: 400 }
      );
    }

    let providerInstance: any = null;

    switch (provider) {
      case 'gemini':
        providerInstance = createGeminiProvider(resolvedApiKey, model || 'gemini-flash-latest');
        break;
      case 'groq':
        providerInstance = createGroqProvider(resolvedApiKey, model || 'llama-3.3-70b-versatile');
        break;
      case 'openai':
        providerInstance = createOpenAIProvider(resolvedApiKey, model || 'gpt-4o-mini');
        break;
      default:
        return NextResponse.json(
          { success: false, error: `Unsupported provider: ${provider}` },
          { status: 400 }
        );
    }

    const testResult = await providerInstance.testConnection();

    return NextResponse.json(testResult);
  } catch (err: any) {
    console.error('[AI Test API Error]:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Connection test failed' },
      { status: 500 }
    );
  }
}
