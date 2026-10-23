import fs from 'fs';
import path from 'path';
import { initializeApp, getApps, cert, type App } from 'firebase-admin/app';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';

let adminApp: App | null = null;

export function getServiceAccountCredentials(): Record<string, any> | null {
  // 1. Single env var JSON string (Vercel standard)
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (raw) {
    try {
      const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
      if (parsed.private_key && typeof parsed.private_key === 'string') {
        parsed.private_key = parsed.private_key.replace(/\\n/g, '\n');
      }
      return parsed;
    } catch (e) {
      console.error('[firebaseAdmin] FIREBASE_SERVICE_ACCOUNT_KEY is set but is not valid JSON:', e);
    }
  }

  // 2. Individual env vars (Vercel alternative)
  if (process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
    return {
      project_id: process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'thenijobs-9f01d',
      client_email: process.env.FIREBASE_CLIENT_EMAIL,
      private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    };
  }

  // 3. Local serviceAccountKey.json (Development environment)
  try {
    const localKeyPath = path.join(process.cwd(), 'serviceAccountKey.json');
    if (fs.existsSync(localKeyPath)) {
      const fileContent = fs.readFileSync(localKeyPath, 'utf8');
      const parsed = JSON.parse(fileContent);
      if (parsed.private_key && typeof parsed.private_key === 'string') {
        parsed.private_key = parsed.private_key.replace(/\\n/g, '\n');
      }
      return parsed;
    }
  } catch (err) {
    console.warn('[firebaseAdmin] Could not read local serviceAccountKey.json:', err);
  }

  return null;
}

function getAdminApp(): App {
  if (adminApp) return adminApp;

  const existing = getApps();
  if (existing.length > 0) {
    adminApp = existing[0];
    return adminApp;
  }

  const credentials = getServiceAccountCredentials();
  if (!credentials) {
    throw new Error(
      'FIREBASE_SERVICE_ACCOUNT_KEY is not set. Server-side writes cannot use a real Firebase ' +
      'identity without it — generate one at Firebase Console → Project Settings → ' +
      'Service Accounts → Generate new private key, and set its JSON as this env var.'
    );
  }

  try {
    adminApp = initializeApp({ credential: cert(credentials as any) });
    return adminApp;
  } catch (err: any) {
    console.error('[firebaseAdmin] Failed to initialize Firebase Admin with credentials:', err?.message || err);
    throw err;
  }
}

/**
 * Returns the Firebase Admin Firestore instance.
 */
export function getAdminFirestore(): Firestore {
  return getFirestore(getAdminApp());
}

