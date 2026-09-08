import { initializeApp, getApps, cert, type App } from 'firebase-admin/app';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';

/**
 * HOSTING-1 — a real server identity for Firestore writes that used to go through the
 * unauthenticated client web API key via raw REST calls, denied outright once the
 * default-deny rules (RULES-1) are live in production. Deliberately NOT auto-initialized at
 * module load: a missing or malformed credential must fail the one request that needed it,
 * not crash `next build`/`next dev` for every route in the app.
 *
 * Credential source: `FIREBASE_SERVICE_ACCOUNT_KEY`, the JSON key downloaded from Firebase
 * Console → Project Settings → Service Accounts → Generate new private key, set as a single
 * env var (never a file path — Vercel's serverless functions have no writable filesystem to
 * read one from reliably). No credential exists in this environment's `.env.local` (it only
 * carries the 8 public `NEXT_PUBLIC_FIREBASE_*` web-config keys) — provisioning the real one
 * on Vercel is the owner's own follow-up action, tracked in `docs/active/BRANCH_DISPOSITIONS.md`.
 */

let adminApp: App | null = null;
let initError: Error | null = null;

function getAdminApp(): App {
  if (adminApp) return adminApp;
  if (initError) throw initError;

  const existing = getApps();
  if (existing.length > 0) {
    adminApp = existing[0];
    return adminApp;
  }

  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (!raw) {
    initError = new Error(
      'FIREBASE_SERVICE_ACCOUNT_KEY is not set. Server-side writes cannot use a real Firebase ' +
      'identity without it — generate one at Firebase Console → Project Settings → ' +
      'Service Accounts → Generate new private key, and set its JSON as this env var.'
    );
    throw initError;
  }

  let serviceAccount: Record<string, unknown>;
  try {
    serviceAccount = JSON.parse(raw);
  } catch {
    initError = new Error('FIREBASE_SERVICE_ACCOUNT_KEY is set but is not valid JSON.');
    throw initError;
  }

  adminApp = initializeApp({ credential: cert(serviceAccount as any) });
  return adminApp;
}

/**
 * Throws — never silently falls back to an insecure path — when no real credential is
 * configured. Callers turn this into a clear 5xx, matching this repo's own established
 * "Refusing to activate..." convention (`payment/verify/route.ts`) rather than a cheerful
 * fake success or a quiet return to the unauthenticated REST write this phase is closing.
 */
export function getAdminFirestore(): Firestore {
  return getFirestore(getAdminApp());
}
