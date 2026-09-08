import { NextRequest } from 'next/server';

/**
 * AI-CONNECT-1: shared verified-identity helper for the connections routes.
 *
 * Same pattern as api/ai/route.ts's own inline block (AI-1) -- identity comes ONLY from a
 * verified ID token, never from anything the request body says. Extracted here because 4 new
 * routes (connect/test/disconnect/status) all need it verbatim; duplicating a security-critical
 * check four times means a future fix has to remember to touch four files instead of one.
 */
export interface VerifiedIdentity {
  uid: string;
}

export type VerifyResult =
  | { ok: true; identity: VerifiedIdentity }
  | { ok: false; status: number; error: string };

export async function verifyRequestIdToken(req: NextRequest): Promise<VerifyResult> {
  const authHeader = req.headers.get('authorization');
  const idToken = authHeader?.startsWith('Bearer ') ? authHeader.slice('Bearer '.length).trim() : '';

  if (!idToken) {
    return { ok: false, status: 401, error: 'Sign in required.' };
  }

  try {
    const verifyUrl = `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${process.env.NEXT_PUBLIC_FIREBASE_API_KEY}`;
    const verifyRes = await fetch(verifyUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken }),
    });
    const verifyData = await verifyRes.json().catch(() => null);

    if (!verifyRes.ok || !verifyData?.users?.length) {
      return { ok: false, status: 401, error: 'Your session could not be verified. Please sign in again.' };
    }

    return { ok: true, identity: { uid: verifyData.users[0].localId as string } };
  } catch (err) {
    console.error('[AI Connections] Token verification failed:', err);
    return { ok: false, status: 503, error: 'Your session could not be verified right now. Please try again shortly.' };
  }
}
