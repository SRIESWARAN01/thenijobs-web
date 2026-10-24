/**
 * THENIJOBS — Google Indexing API Integration
 *
 * Implements Google's official Indexing API for JobPosting notifications.
 * Reference: https://developers.google.com/search/apis/indexing-api/v3/quickstart
 *
 * CRITICAL POLICY ENFORCEMENT:
 * Per Google's official guidelines, the Indexing API can ONLY be used for pages
 * with JobPosting or BroadcastEvent embedded in VideoObject.
 * This module STRICTLY refuses to send URLs for products, services, companies,
 * or general website pages. Only valid https://www.thenijobs.com/jobs/* URLs are allowed.
 */

import crypto from 'crypto';
import { getServiceAccountCredentials } from '@/lib/firebase/firebaseAdmin';

let cachedIndexingToken: { token: string; expiresAt: number } | null = null;

async function getIndexingAccessToken(): Promise<string | null> {
  const now = Date.now();
  if (cachedIndexingToken && cachedIndexingToken.expiresAt > now + 60000) {
    return cachedIndexingToken.token;
  }

  const credentials = getServiceAccountCredentials();
  if (!credentials || !credentials.client_email || !credentials.private_key) {
    return null;
  }

  try {
    let clockOffsetMs = 0;
    try {
      const headRes = await fetch('https://www.google.com', { method: 'HEAD', cache: 'no-store' });
      const dateHeader = headRes.headers.get('date');
      if (dateHeader) {
        clockOffsetMs = new Date(dateHeader).getTime() - Date.now();
      }
    } catch {
      // Ignore network clock fallback
    }

    const trueNowSeconds = Math.floor((Date.now() + clockOffsetMs) / 1000);
    const iat = trueNowSeconds - 30;
    const exp = iat + 3540; // 59 minutes

    const header = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url');
    const claimSet = Buffer.from(JSON.stringify({
      iss: credentials.client_email,
      scope: 'https://www.googleapis.com/auth/indexing',
      aud: 'https://oauth2.googleapis.com/token',
      exp,
      iat,
    })).toString('base64url');

    const signer = crypto.createSign('RSA-SHA256');
    signer.update(`${header}.${claimSet}`);
    const signature = signer.sign(credentials.private_key, 'base64url');
    const jwt = `${header}.${claimSet}.${signature}`;

    const res = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion: jwt,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.access_token) {
        cachedIndexingToken = {
          token: data.access_token,
          expiresAt: now + (data.expires_in || 3600) * 1000,
        };
        return data.access_token;
      }
    } else {
      const errBody = await res.text();
      console.warn('[GoogleIndexingAPI] OAuth2 token exchange rejected:', res.status, errBody);
    }
  } catch (err) {
    console.warn('[GoogleIndexingAPI] Error obtaining indexing access token:', err);
  }

  return null;
}

export interface IndexingNotificationResult {
  success: boolean;
  url: string;
  type: 'URL_UPDATED' | 'URL_DELETED';
  status?: number;
  message?: string;
  error?: string;
}

/**
 * Notifies Google of a new/updated or deleted JobPosting URL.
 *
 * Strictly validates that only genuine JobPosting URLs are processed.
 */
export async function notifyGoogleJobPosting(
  jobUrl: string,
  type: 'URL_UPDATED' | 'URL_DELETED' = 'URL_UPDATED',
): Promise<IndexingNotificationResult> {
  // 1. Strict URL validation — only https://www.thenijobs.com/jobs/* (or https://www.thenijobs.com/jobs/*)
  const jobUrlPattern = /^https:\/\/(www\.)?thenijobs\.com\/jobs\/[a-zA-Z0-9_\-]+$/;
  if (!jobUrlPattern.test(jobUrl)) {
    return {
      success: false,
      url: jobUrl,
      type,
      error: 'Invalid URL. Google Indexing API can only be used for published individual job postings (https://www.thenijobs.com/jobs/*).',
    };
  }

  // 2. Obtain OAuth2 access token with indexing scope
  const token = await getIndexingAccessToken();
  if (!token) {
    return {
      success: false,
      url: jobUrl,
      type,
      message: 'Indexing API skipped: Google service account credentials not configured or unauthorized.',
    };
  }

  // 3. Send publish notification to Google Indexing API v3
  try {
    const res = await fetch('https://indexing.googleapis.com/v3/urlNotifications:publish', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        url: jobUrl,
        type,
      }),
    });

    if (res.ok) {
      const body = await res.json();
      return {
        success: true,
        url: jobUrl,
        type,
        status: res.status,
        message: `Successfully notified Google: ${type} at ${body.urlNotificationMetadata?.latestUpdate?.notifyTime || new Date().toISOString()}`,
      };
    }

    const errData = await res.json().catch(() => ({}));
    const errMsg = errData.error?.message || `HTTP ${res.status}`;
    console.warn(`[GoogleIndexingAPI] Notification failed for ${jobUrl}:`, res.status, errMsg);

    return {
      success: false,
      url: jobUrl,
      type,
      status: res.status,
      error: errMsg,
    };
  } catch (err: any) {
    console.error(`[GoogleIndexingAPI] Network error notifying Google for ${jobUrl}:`, err);
    return {
      success: false,
      url: jobUrl,
      type,
      error: err.message || 'Network error',
    };
  }
}
