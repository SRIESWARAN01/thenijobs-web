import crypto from 'crypto';

/**
 * AI-CONNECT-1: encrypt-at-rest for a user's own provider API key.
 *
 * This is deliberately a SEPARATE, stricter idiom from platformSettings/aiConfig's plaintext
 * (but admin-only-readable) provider keys: a connected user's key is never stored in cleartext
 * anywhere, and firestore.rules denies every client -- including the owning user -- from reading
 * the stored document at all (see aiConnections/{uid} in firestore.rules). Only this module,
 * running server-side with AI_KEY_ENCRYPTION_SECRET, can turn ciphertext back into a usable key.
 *
 * AES-256-GCM: a random IV per encryption (never reused), and the auth tag is stored alongside
 * the ciphertext so decryption fails loudly (not silently) if either is tampered with.
 */

const ALGORITHM = 'aes-256-gcm';

let cachedKey: Buffer | null = null;
let initError: Error | null = null;

function getEncryptionKey(): Buffer {
  if (cachedKey) return cachedKey;
  if (initError) throw initError;

  const raw = process.env.AI_KEY_ENCRYPTION_SECRET;
  if (!raw) {
    initError = new Error(
      'AI_KEY_ENCRYPTION_SECRET is not set. A connected provider key cannot be encrypted or ' +
      'decrypted without it -- generate one with `openssl rand -base64 32` and set it as this ' +
      'env var before AI-CONNECT-1\'s routes can be used.'
    );
    throw initError;
  }

  const key = Buffer.from(raw, 'base64');
  if (key.length !== 32) {
    initError = new Error(
      `AI_KEY_ENCRYPTION_SECRET must decode (base64) to exactly 32 bytes for AES-256-GCM, got ${key.length}.`
    );
    throw initError;
  }

  cachedKey = key;
  return cachedKey;
}

export interface EncryptedPayload {
  ciphertext: string; // base64
  iv: string; // base64
  authTag: string; // base64
}

/** Encrypt a raw provider API key. Throws if AI_KEY_ENCRYPTION_SECRET is missing/invalid. */
export function encryptApiKey(plaintext: string): EncryptedPayload {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(12); // 96-bit IV, the GCM-recommended size
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return {
    ciphertext: ciphertext.toString('base64'),
    iv: iv.toString('base64'),
    authTag: authTag.toString('base64'),
  };
}

/** Decrypt a stored payload back to the raw provider API key. Throws on tamper or bad secret. */
export function decryptApiKey(payload: EncryptedPayload): string {
  const key = getEncryptionKey();
  const iv = Buffer.from(payload.iv, 'base64');
  const authTag = Buffer.from(payload.authTag, 'base64');

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  const plaintext = Buffer.concat([
    decipher.update(Buffer.from(payload.ciphertext, 'base64')),
    decipher.final(),
  ]);

  return plaintext.toString('utf8');
}

/** Mask a raw key for display, same convention as aiConfigService.ts's maskApiKey. */
export function maskApiKey(key: string): string {
  if (!key || key.length < 10) return key ? '****' : '';
  return `${key.slice(0, 6)}...${key.slice(-4)}`;
}
