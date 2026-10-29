import fs from 'fs';
import path from 'path';
import { initializeApp, getApps, cert, type App } from 'firebase-admin/app';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';
import { getAuth, type Auth } from 'firebase-admin/auth';

let adminApp: App | null = null;
let clockSkewSyncPromise: Promise<number> | null = null;

/**
 * In development or environments where the local machine clock may be desynchronized
 * from Google servers, this adjusts Date.now() and global Date by the detected offset to prevent
 * "16 UNAUTHENTICATED: Request had invalid authentication credentials" OAuth JWT rejections.
 */
export async function syncClockSkew(): Promise<number> {
  if (clockSkewSyncPromise) return clockSkewSyncPromise;
  clockSkewSyncPromise = (async () => {
    try {
      const res = await fetch('https://www.google.com', { method: 'HEAD', cache: 'no-store' });
      const dateHeader = res.headers.get('date');
      if (dateHeader) {
        const serverTime = new Date(dateHeader).getTime();
        const skew = Date.now() - serverTime;
        if (Math.abs(skew) > 60_000) {
          console.warn(`[firebaseAdmin] Compensating for system clock skew (${Math.round(skew / 1000)}s offset from Google servers)...`);
          const OriginalDate = Date;
          const originalNow = OriginalDate.now.bind(OriginalDate);
          Date.now = () => originalNow() - skew;

          const PatchedDate = function(this: any, ...args: any[]) {
            if (!(this instanceof PatchedDate)) {
              return new (OriginalDate as any)(Date.now()).toString();
            }
            if (args.length === 0) {
              return new (OriginalDate as any)(Date.now());
            }
            return new (OriginalDate as any)(...args);
          } as any;
          PatchedDate.prototype = OriginalDate.prototype;
          PatchedDate.now = () => originalNow() - skew;
          PatchedDate.UTC = OriginalDate.UTC;
          PatchedDate.parse = OriginalDate.parse;
          global.Date = PatchedDate;
        }
        return skew;
      }
    } catch {
      // Ignore network errors during skew check; proceed with system clock
    }
    return 0;
  })();
  return clockSkewSyncPromise;
}

export function getServiceAccountCredentials(): Record<string, any> | null {
  // 1. Single env var JSON string (Vercel standard)
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (raw) {
    try {
      let str = typeof raw === 'string' ? raw.trim() : raw;
      // Strip outer quotes if enclosed in single or double quotes
      if (typeof str === 'string' && ((str.startsWith("'") && str.endsWith("'")) || (str.startsWith('"') && str.endsWith('"')))) {
        str = str.slice(1, -1).trim();
      }
      // Decode Base64 if not starting with JSON bracket
      if (typeof str === 'string' && !str.startsWith('{')) {
        try {
          const decoded = Buffer.from(str, 'base64').toString('utf8').trim();
          if (decoded.startsWith('{')) {
            str = decoded;
          }
        } catch {
          // not base64
        }
      }
      const parsed = typeof str === 'string' ? JSON.parse(str) : str;
      if (parsed.private_key && typeof parsed.private_key === 'string') {
        parsed.private_key = parsed.private_key.replace(/\\n/g, '\n');
      }
      return parsed;
    } catch (e) {
      console.error('[firebaseAdmin] FIREBASE_SERVICE_ACCOUNT_KEY is set but is not valid JSON:', (e as any)?.message);
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

  // 3. Local serviceAccountKey.json (Development environment only).
  // Never trace or load a workstation credential into a production deployment.
  if (process.env.NODE_ENV !== 'production') {
    try {
      const candidatePaths = [
        path.join(process.cwd(), 'serviceAccountKey.json'),
        path.join(process.cwd(), 'thenijobs-web-main', 'serviceAccountKey.json'),
        typeof __dirname !== 'undefined' ? path.resolve(__dirname, '../../../serviceAccountKey.json') : '',
        typeof __dirname !== 'undefined' ? path.resolve(__dirname, '../../../../serviceAccountKey.json') : '',
      ].filter(Boolean);
      for (const localKeyPath of candidatePaths) {
        if (fs.existsSync(localKeyPath)) {
          const fileContent = fs.readFileSync(localKeyPath, 'utf8');
          const parsed = JSON.parse(fileContent);
          if (parsed.private_key && typeof parsed.private_key === 'string') {
            parsed.private_key = parsed.private_key.replace(/\\n/g, '\n');
          }
          return parsed;
        }
      }
    } catch (err: any) {
      console.warn('[firebaseAdmin] Could not read local serviceAccountKey.json:', err?.message || err);
    }
  }

  return null;
}

export function getAdminApp(): App {
  if (adminApp) return adminApp;

  const existing = getApps();
  if (existing.length > 0) {
    adminApp = existing[0];
    return adminApp;
  }

  // Proactively trigger non-blocking clock skew check in node environment
  if (typeof fetch === 'function') {
    void syncClockSkew();
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

/**
 * Returns the Firebase Admin Auth instance.
 */
export function getAdminAuth(): Auth {
  return getAuth(getAdminApp());
}


