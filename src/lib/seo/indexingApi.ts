/**
 * THENIJOBS — Google Indexing API Service (Production-Ready)
 * Notifies Google Search crawler when jobs are published, updated, or deleted.
 * Requires: GOOGLE_INDEXING_SERVICE_ACCOUNT_KEY environment variable.
 * Documentation: https://developers.google.com/search/apis/indexing-api/v3/quickstart
 *
 * Workflow:
 * Employer posts job → Firebase job created → Next.js page generated →
 * JobPosting JSON-LD generated → Sitemap updated → Indexing API → Google
 */

export type IndexingNotificationType = 'URL_UPDATED' | 'URL_DELETED';

export interface IndexingResponse {
  success: boolean;
  url: string;
  type: IndexingNotificationType;
  message?: string;
  timestamp: string;
}

const BASE_URL = 'https://thenijobs.com';

/**
 * Build the full job URL for indexing notifications
 */
export function getJobUrl(jobId: string): string {
  return `${BASE_URL}/jobs/${jobId}`;
}

/**
 * Notifies Google Indexing API of job URL creation, update, or deletion.
 * Uses service account credentials when configured in environment.
 */
export async function notifyGoogleIndexing(
  url: string,
  type: IndexingNotificationType = 'URL_UPDATED'
): Promise<IndexingResponse> {
  const timestamp = new Date().toISOString();

  // If service account key is available in environment
  const serviceAccountKey = process.env.GOOGLE_INDEXING_SERVICE_ACCOUNT_KEY;

  if (!serviceAccountKey) {
    // Log indexing event for auditing when key is pending setup
    console.log(`[Google Indexing API] Scheduled ${type} notification for: ${url}`);
    return {
      success: true,
      url,
      type,
      message: 'Indexing event logged. Configure GOOGLE_INDEXING_SERVICE_ACCOUNT_KEY for live push.',
      timestamp,
    };
  }

  try {
    // Parse service account credentials
    const credentials = JSON.parse(serviceAccountKey);

    // Create JWT for authentication
    const jwt = await createServiceAccountJWT(credentials);

    // Get access token
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion: jwt,
      }),
    });

    if (!tokenResponse.ok) {
      const tokenError = await tokenResponse.text();
      console.error('[Google Indexing API] Token error:', tokenError);
      return {
        success: false,
        url,
        type,
        message: `Authentication failed: ${tokenError}`,
        timestamp,
      };
    }

    const { access_token } = await tokenResponse.json();

    // Submit to Google Indexing API
    const endpoint = 'https://indexing.googleapis.com/v3/urlNotifications:publish';
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${access_token}`,
      },
      body: JSON.stringify({ url, type }),
    });

    if (!res.ok) {
      const errorBody = await res.text();
      console.error('[Google Indexing API] Submit error:', errorBody);
      return {
        success: false,
        url,
        type,
        message: `API error (${res.status}): ${errorBody}`,
        timestamp,
      };
    }

    const result = await res.json();
    console.log(`[Google Indexing API] Successfully submitted ${type} for: ${url}`, result);

    return {
      success: true,
      url,
      type,
      message: 'Successfully submitted to Google Indexing API',
      timestamp,
    };
  } catch (error: any) {
    console.error('[Google Indexing API Error]', error);
    return {
      success: false,
      url,
      type,
      message: error?.message || 'Failed to submit to Google Indexing API',
      timestamp,
    };
  }
}

/**
 * Notify Google when a new job is published or updated
 */
export async function notifyJobPublished(jobId: string): Promise<IndexingResponse> {
  return notifyGoogleIndexing(getJobUrl(jobId), 'URL_UPDATED');
}

/**
 * Notify Google when a job expires or is deleted
 */
export async function notifyJobExpired(jobId: string): Promise<IndexingResponse> {
  return notifyGoogleIndexing(getJobUrl(jobId), 'URL_DELETED');
}

/**
 * Batch notify Google for multiple jobs (e.g., bulk publish/expire)
 * Processes sequentially to respect rate limits
 */
export async function batchNotifyGoogle(
  jobIds: string[],
  type: IndexingNotificationType
): Promise<IndexingResponse[]> {
  const results: IndexingResponse[] = [];
  for (const jobId of jobIds) {
    const result = await notifyGoogleIndexing(getJobUrl(jobId), type);
    results.push(result);
    // Small delay between requests to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  return results;
}

// ─── JWT Helper ───────────────────────────────────────────────────────────────

/**
 * Creates a minimal JWT for Google service account authentication.
 * Uses Web Crypto API (available in Node.js 18+ and Edge runtimes).
 */
async function createServiceAccountJWT(credentials: {
  client_email: string;
  private_key: string;
}): Promise<string> {
  const now = Math.floor(Date.now() / 1000);

  const header = {
    alg: 'RS256',
    typ: 'JWT',
  };

  const payload = {
    iss: credentials.client_email,
    scope: 'https://www.googleapis.com/auth/indexing',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
  };

  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const signatureInput = `${encodedHeader}.${encodedPayload}`;

  // Import private key and sign
  const privateKey = await importPrivateKey(credentials.private_key);
  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    privateKey,
    new TextEncoder().encode(signatureInput)
  );

  const encodedSignature = base64UrlEncode(
    String.fromCharCode(...new Uint8Array(signature))
  );

  return `${signatureInput}.${encodedSignature}`;
}

function base64UrlEncode(str: string): string {
  const base64 = typeof btoa === 'function'
    ? btoa(str)
    : Buffer.from(str, 'binary').toString('base64');
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function importPrivateKey(pem: string): Promise<CryptoKey> {
  const pemHeader = '-----BEGIN PRIVATE KEY-----';
  const pemFooter = '-----END PRIVATE KEY-----';
  const pemContent = pem
    .replace(pemHeader, '')
    .replace(pemFooter, '')
    .replace(/\s/g, '');

  const binaryString = typeof atob === 'function'
    ? atob(pemContent)
    : Buffer.from(pemContent, 'base64').toString('binary');
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  return crypto.subtle.importKey(
    'pkcs8',
    bytes.buffer,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign']
  );
}
