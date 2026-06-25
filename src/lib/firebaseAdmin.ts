/**
 * Firebase Admin SDK — server-only singleton.
 *
 * Used by Next.js API route handlers (e.g. Razorpay webhook) that need
 * direct Firestore access outside of Cloud Functions.
 *
 * Credentials resolution order:
 *  1. GOOGLE_APPLICATION_CREDENTIALS_JSON env var (stringified service-account JSON)
 *  2. Application Default Credentials (works on GCP / Firebase App Hosting)
 */
import { initializeApp, getApps, cert, type App } from 'firebase-admin/app';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';

function getOrInitApp(): App {
  const existing = getApps();
  if (existing.length > 0) return existing[0];

  const credJson = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;
  if (credJson) {
    try {
      const serviceAccount = JSON.parse(credJson);
      return initializeApp({ credential: cert(serviceAccount) });
    } catch (err) {
      console.error('[firebaseAdmin] Failed to parse GOOGLE_APPLICATION_CREDENTIALS_JSON:', err);
    }
  }

  // Fallback: Application Default Credentials (e.g. on GCP)
  return initializeApp();
}

const adminApp: App = getOrInitApp();

/** Firestore instance for server-side use */
export const adminDb: Firestore = getFirestore(adminApp);

export default adminApp;
