import { initializeApp, getApps, getApp, type FirebaseOptions } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, initializeFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getFunctions } from 'firebase/functions';
import { getAnalytics, isSupported } from 'firebase/analytics';
import { getDatabase } from 'firebase/database';
import { initializeAppCheck, ReCaptchaEnterpriseProvider, type AppCheck } from 'firebase/app-check';

/**
 * Firebase configuration is intentionally sourced only from environment variables.
 * Add the NEXT_PUBLIC_FIREBASE_* values to .env.local before running locally.
 */
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
};

const missingFirebaseConfig = [
  ['NEXT_PUBLIC_FIREBASE_API_KEY', firebaseConfig.apiKey],
  ['NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN', firebaseConfig.authDomain],
  ['NEXT_PUBLIC_FIREBASE_PROJECT_ID', firebaseConfig.projectId],
  ['NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET', firebaseConfig.storageBucket],
  ['NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID', firebaseConfig.messagingSenderId],
  ['NEXT_PUBLIC_FIREBASE_APP_ID', firebaseConfig.appId],
].filter(([, value]) => !value);

if (missingFirebaseConfig.length > 0) {
  const errorMsg = `Missing Firebase environment variables: ${missingFirebaseConfig.map(([key]) => key).join(', ')}`;
  if (typeof window === 'undefined') {
    console.warn(`[Firebase Config] Build Warning: ${errorMsg}`);
  } else {
    throw new Error(errorMsg);
  }
}

/** Firebase app instance (singleton) */
const app = getApps().length === 0
  ? initializeApp((firebaseConfig.apiKey ? firebaseConfig : { apiKey: 'mock', projectId: 'mock-id' }) as FirebaseOptions)
  : getApp();

/** Firebase App Check (client-only, requires Firebase console enforcement setup). */
export const appCheck: AppCheck | null = (() => {
  const siteKey = process.env.NEXT_PUBLIC_FIREBASE_APPCHECK_RECAPTCHA_ENTERPRISE_SITE_KEY;
  if (typeof window === 'undefined' || !siteKey) return null;

  const appCheckState = globalThis as typeof globalThis & {
    __thenijobsAppCheckInitialized?: boolean;
  };

  if (appCheckState.__thenijobsAppCheckInitialized) return null;
  appCheckState.__thenijobsAppCheckInitialized = true;

  try {
    return initializeAppCheck(app, {
      provider: new ReCaptchaEnterpriseProvider(siteKey),
      isTokenAutoRefreshEnabled: true,
    });
  } catch (err) {
    console.warn('Firebase App Check initialization failed:', err);
    return null;
  }
})();

/** Firebase Authentication */
export const auth = getAuth(app);

/** Cloud Firestore */
export const db = (() => {
  try {
    return initializeFirestore(app, {});
  } catch {
    // Fallback to existing instance during Next.js Hot Reloads
    return getFirestore(app);
  }
})();

/** Cloud Storage */
export const storage = getStorage(app);

/** Cloud Functions */
export const functions = getFunctions(app, 'asia-south1');

/** Realtime Database */
export const rtdb = getDatabase(app);

/**
 * Firebase Analytics (lazy, client-only).
 * Returns null on the server or if analytics is unsupported.
 */
export const analytics = async () => {
  if (typeof window !== 'undefined' && await isSupported()) {
    return getAnalytics(app);
  }
  return null;
};

export default app;
