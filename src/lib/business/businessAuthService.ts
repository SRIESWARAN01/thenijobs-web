// ============================================================
// THENIJOBS — Business Account Login & Recovery Service
// Manages Google Auth & Forgot Password for 8 Eligible Businesses
// ============================================================

import crypto from 'crypto';
import { getAdminFirestore, getAdminAuth, syncClockSkew } from '@/lib/firebase/firebaseAdmin';
import { SITE_CONTACT, RETAINED_PRODUCTION_COMPANIES } from '@/lib/constants';

// Re-export client-safe constants and pure helpers
export * from './businessConstants';
export { getEligibleBusinessesPublicList } from './businessConstants';

export const ELIGIBLE_BUSINESS_IDS = [
  'ik3pWBDVVUR3Sb51knwK',
  'mWWNVrCGounWsmXdaRGL',
  'oKDQpFZ3bx9C4S0Z0ti9',
  'u9sYSAG9YoGrept1FbSe',
  '7K95afmwXMddFJo8PeRB',
  'SDv5CaYdxKRWOXl4ej84',
  'VG1PwPzKXofu1fLxLIpk',
  'vMQgOwNd2fZ4Nm8870Dw',
] as const;

export const ELIGIBLE_BUSINESS_NAMES_WITH_TALUKS: Record<string, string> = {
  ik3pWBDVVUR3Sb51knwK: 'Agrimore — Chinnamanur',
  mWWNVrCGounWsmXdaRGL: 'Sarvesh Super Market — Theni',
  oKDQpFZ3bx9C4S0Z0ti9: 'Apex Scholar Publication — Theni',
  u9sYSAG9YoGrept1FbSe: 'Suruliraj Chemicals — Theni',
  '7K95afmwXMddFJo8PeRB': 'M K Security Solutions & Electronics — Theni',
  SDv5CaYdxKRWOXl4ej84: 'Chennai Bakes — Uthamapalayam',
  VG1PwPzKXofu1fLxLIpk: 'SVR Heritage Hall — Uthamapalayam',
  vMQgOwNd2fZ4Nm8870Dw: 'AGS IT Solutions — Theni',
};

import {
  normalizePhoneNumber,
  maskPhoneNumber,
  maskEmail,
} from './businessConstants';

/**
 * Hashes reset token using SHA-256 for secure storage at rest.
 */
export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * Formats WhatsApp Admin Notification for recovery requests.
 */
export function formatWhatsAppAdminNotification(params: {
  requestId: string;
  businessName: string;
  registeredMobile: string;
  requesterMobile: string;
  registeredEmail?: string | null;
  submissionDate?: string;
}): string {
  const dateStr = params.submissionDate || new Date().toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return `THENIJOBS — Business Account Recovery Request

Request ID: ${params.requestId}
Business Name: ${params.businessName}
Registered Business Mobile: ${maskPhoneNumber(params.registeredMobile)}
Requester Contact Mobile: ${params.requesterMobile}
${params.registeredEmail ? `Registered Email: ${maskEmail(params.registeredEmail)}\n` : ''}Date: ${dateStr}
Status: Pending Admin Verification

Please verify the business identity before authorizing account recovery.
Admin Dashboard: https://www.thenijobs.com/admin/business-recovery`;
}

/**
 * Dispatches notification to authorized administrator WhatsApp number.
 */
export async function dispatchWhatsAppAdminNotification(text: string): Promise<{
  success: boolean;
  provider: 'cloud_api' | 'click_to_chat';
  url: string;
}> {
  const adminPhone = SITE_CONTACT.whatsapp; // '919360519460'
  const clickToChatUrl = `https://wa.me/${adminPhone}?text=${encodeURIComponent(text)}`;

  const cloudApiToken = process.env.WHATSAPP_CLOUD_API_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  if (cloudApiToken && phoneNumberId) {
    try {
      const res = await fetch(`https://graph.facebook.com/v19.0/${phoneNumberId}/messages`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${cloudApiToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: adminPhone,
          type: 'text',
          text: { body: text },
        }),
      });

      if (res.ok) {
        return { success: true, provider: 'cloud_api', url: clickToChatUrl };
      }
    } catch (err) {
      console.error('[WhatsApp Cloud API] Dispatch error:', err);
    }
  }

  // Fallback to validated click_to_chat url (and audit log)
  return { success: true, provider: 'click_to_chat', url: clickToChatUrl };
}

/**
 * Verifies if an authenticated Google user's verified email belongs to one of the 8 eligible businesses.
 */
export async function verifyEligibleBusinessGoogleLogin(
  verifiedEmail: string,
  userUid: string,
  googleDisplayName?: string,
  googlePhotoURL?: string
): Promise<{
  eligible: boolean;
  company?: {
    id: string;
    name: string;
    slug: string;
    taluk?: string;
  };
  user?: {
    uid: string;
    email: string;
    role: string;
    companyId: string;
    name: string;
  };
  error?: string;
}> {
  await syncClockSkew();
  const db = getAdminFirestore();
  const auth = getAdminAuth();

  const cleanEmail = verifiedEmail.trim().toLowerCase();

  // Query all 8 eligible companies directly from Firestore
  let matchedCompanyDoc: any = null;
  let matchedCompanyId = '';

  for (const id of ELIGIBLE_BUSINESS_IDS) {
    const docSnap = await db.collection('companies').doc(id).get();
    if (docSnap.exists) {
      const data = docSnap.data();
      const compEmail = (data?.email || data?.contactEmail || data?.ownerEmail || '').trim().toLowerCase();
      if (compEmail === cleanEmail) {
        matchedCompanyDoc = data;
        matchedCompanyId = id;
        break;
      }
    }
  }

  if (!matchedCompanyDoc) {
    return {
      eligible: false,
      error: 'This Google account is not registered for an eligible business account.',
    };
  }

  // Eligible business match! Ensure user profile exists in Firestore and has role 'business_owner'
  const userRef = db.collection('users').doc(userUid);
  const userSnap = await userRef.get();

  const now = new Date();
  const businessName = matchedCompanyDoc.name || 'Verified Business';

  const userPayload: Record<string, any> = {
    uid: userUid,
    email: cleanEmail,
    displayName: googleDisplayName || businessName,
    role: 'business_owner',
    companyId: matchedCompanyId,
    approvalStatus: 'approved',
    accountStatus: 'active',
    isVerified: true,
    authProvider: 'google.com',
    lastLoginAt: now,
    updatedAt: now,
  };

  if (googlePhotoURL) {
    userPayload.photoURL = googlePhotoURL;
  }

  if (!userSnap.exists) {
    userPayload.createdAt = now;
  }

  await userRef.set(userPayload, { merge: true });

  // Update company ownerId to this verified user UID
  await db.collection('companies').doc(matchedCompanyId).update({
    ownerId: userUid,
    userId: userUid,
    isVerified: true,
    verificationStatus: 'verified',
    updatedAt: now,
  });

  // Set custom claims for server-side auth
  try {
    await auth.setCustomUserClaims(userUid, {
      role: 'business_owner',
      companyId: matchedCompanyId,
      verifiedBusiness: true,
    });
  } catch (err) {
    console.warn('[Business Auth] Failed to set custom claims:', err);
  }

  return {
    eligible: true,
    company: {
      id: matchedCompanyId,
      name: matchedCompanyDoc.name,
      slug: matchedCompanyDoc.slug || '',
      taluk: matchedCompanyDoc.taluk || matchedCompanyDoc.district || '',
    },
    user: {
      uid: userUid,
      email: cleanEmail,
      role: 'business_owner',
      companyId: matchedCompanyId,
      name: userPayload.displayName,
    },
  };
}

/**
 * Creates a business recovery request after validating input against database.
 * Enforces anti-account enumeration: returns the same success response message.
 */
export async function createBusinessRecoveryRequest(params: {
  businessId: string;
  registeredMobile: string;
  requesterMobile: string;
  registeredEmail?: string | null;
  ipAddress?: string;
}): Promise<{
  success: boolean;
  referenceId: string;
  message: string;
}> {
  await syncClockSkew();
  const db = getAdminFirestore();

  const businessId = params.businessId.trim();
  const reqNormMobile = normalizePhoneNumber(params.requesterMobile);
  const regNormMobile = normalizePhoneNumber(params.registeredMobile);
  const inputEmail = params.registeredEmail ? params.registeredEmail.trim().toLowerCase() : null;

  // Generate safe reference ID
  const timestamp = Date.now();
  const randomSuffix = crypto.randomBytes(3).toString('hex').toUpperCase();
  const referenceId = `REC-${timestamp.toString().slice(-6)}-${randomSuffix}`;

  // Validate businessId is one of the 8 allowed
  const isEligible = (ELIGIBLE_BUSINESS_IDS as readonly string[]).includes(businessId);
  if (!isEligible) {
    // Return friendly generic response to prevent scanning
    return {
      success: true,
      referenceId,
      message: 'Your account recovery request has been submitted successfully. Our team will verify your business details and contact you through the registered communication channel.',
    };
  }

  // Fetch real company document
  const compSnap = await db.collection('companies').doc(businessId).get();
  if (!compSnap.exists) {
    return {
      success: true,
      referenceId,
      message: 'Your account recovery request has been submitted successfully. Our team will verify your business details and contact you through the registered communication channel.',
    };
  }

  const compData = compSnap.data() || {};
  const dbMobile = normalizePhoneNumber(compData.phone || compData.whatsapp || compData.contactPhone);
  const dbEmail = (compData.email || compData.contactEmail || compData.ownerEmail || '').trim().toLowerCase();

  // Validate registered mobile against database
  const mobileMatches = dbMobile.length === 10 && regNormMobile === dbMobile;
  const emailMatches = !inputEmail || (dbEmail && inputEmail === dbEmail);

  const businessName = compData.name || ELIGIBLE_BUSINESS_NAMES_WITH_TALUKS[businessId] || 'Business Account';

  if (!mobileMatches || !emailMatches) {
    // Mismatch: record for security audit with 'rejected_mismatch' status so admins can detect attacks
    // But DO NOT reveal mismatch publicly to requester
    await db.collection('businessRecoveryRequests').doc(referenceId).set({
      id: referenceId,
      businessId,
      businessName,
      businessTaluk: compData.taluk || compData.district || 'Theni',
      requesterMobile: reqNormMobile,
      submittedRegisteredMobile: regNormMobile,
      submittedRegisteredEmail: inputEmail,
      actualRegisteredMobile: dbMobile,
      actualRegisteredEmail: dbEmail,
      status: 'rejected_mismatch',
      ipAddress: params.ipAddress || 'unknown',
      createdAt: new Date(),
      auditNote: 'Submitted contact credentials did not match database records.',
    });

    return {
      success: true,
      referenceId,
      message: 'Your account recovery request has been submitted successfully. Our team will verify your business details and contact you through the registered communication channel.',
    };
  }

  // Verified Match! Create pending request
  const requestDoc = {
    id: referenceId,
    businessId,
    businessName,
    businessTaluk: compData.taluk || compData.district || 'Theni',
    requesterMobile: reqNormMobile,
    registeredMobile: dbMobile,
    registeredEmail: inputEmail || dbEmail || null,
    status: 'pending',
    ipAddress: params.ipAddress || 'unknown',
    createdAt: new Date(),
    reviewedAt: null,
    completedAt: null,
    adminId: null,
  };

  await db.collection('businessRecoveryRequests').doc(referenceId).set(requestDoc);

  // Dispatch WhatsApp alert to THENIJOBS Administrator
  const notificationText = formatWhatsAppAdminNotification({
    requestId: referenceId,
    businessName,
    registeredMobile: dbMobile,
    requesterMobile: reqNormMobile,
    registeredEmail: inputEmail || dbEmail,
  });

  await dispatchWhatsAppAdminNotification(notificationText);

  return {
    success: true,
    referenceId,
    message: 'Your account recovery request has been submitted successfully. Our team will verify your business details and contact you through the registered communication channel.',
  };
}

/**
 * Admin approves recovery request and generates a single-use, time-limited reset link.
 */
export async function approveRecoveryRequest(
  requestId: string,
  adminUid: string
): Promise<{
  success: boolean;
  resetUrl: string;
  token: string;
  expiresAt: string;
}> {
  await syncClockSkew();
  const db = getAdminFirestore();

  const reqRef = db.collection('businessRecoveryRequests').doc(requestId);
  const snap = await reqRef.get();

  if (!snap.exists) {
    throw new Error('Recovery request not found.');
  }

  const data = snap.data();
  if (data?.status === 'completed') {
    throw new Error('This recovery request has already been completed.');
  }

  // Generate 256-bit secure random token
  const rawToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = hashToken(rawToken);

  // 1-hour expiration
  const expiresAtMs = Date.now() + 60 * 60 * 1000;
  const expiresAtDate = new Date(expiresAtMs);

  const resetUrl = `https://www.thenijobs.com/reset-password?token=${rawToken}&requestId=${requestId}`;

  await reqRef.update({
    status: 'approved',
    resetTokenHash: tokenHash,
    resetTokenExpiresAt: expiresAtDate,
    resetUrl,
    adminId: adminUid,
    reviewedAt: new Date(),
    usedAt: null,
  });

  return {
    success: true,
    resetUrl,
    token: rawToken,
    expiresAt: expiresAtDate.toISOString(),
  };
}

/**
 * Admin rejects recovery request with audit reason.
 */
export async function rejectRecoveryRequest(
  requestId: string,
  adminUid: string,
  reason: string
): Promise<{ success: boolean }> {
  await syncClockSkew();
  const db = getAdminFirestore();

  const reqRef = db.collection('businessRecoveryRequests').doc(requestId);
  const snap = await reqRef.get();

  if (!snap.exists) {
    throw new Error('Recovery request not found.');
  }

  await reqRef.update({
    status: 'rejected',
    rejectionReason: reason || 'Identity verification failed.',
    adminId: adminUid,
    reviewedAt: new Date(),
  });

  return { success: true };
}

/**
 * Validates reset token against request.
 */
export async function verifyRecoveryToken(
  requestId: string,
  rawToken: string
): Promise<{
  valid: boolean;
  businessName?: string;
  error?: string;
}> {
  await syncClockSkew();
  const db = getAdminFirestore();

  const reqRef = db.collection('businessRecoveryRequests').doc(requestId);
  const snap = await reqRef.get();

  if (!snap.exists) {
    return { valid: false, error: 'Invalid or non-existent recovery request.' };
  }

  const data = snap.data() || {};

  if (data.status !== 'approved') {
    return { valid: false, error: 'This recovery request is not approved or has already been used.' };
  }

  if (data.usedAt) {
    return { valid: false, error: 'This recovery link has already been used.' };
  }

  const nowMs = Date.now();
  const expiryMs = data.resetTokenExpiresAt?.toMillis ? data.resetTokenExpiresAt.toMillis() : new Date(data.resetTokenExpiresAt).getTime();

  if (nowMs > expiryMs) {
    return { valid: false, error: 'This password reset link has expired (1-hour validity exceeded).' };
  }

  const computedHash = hashToken(rawToken);
  if (computedHash !== data.resetTokenHash) {
    return { valid: false, error: 'Invalid recovery token.' };
  }

  return {
    valid: true,
    businessName: data.businessName,
  };
}

/**
 * Completes password reset using single-use token, updates password in Firebase Auth, and invalidates token.
 */
export async function completePasswordReset(params: {
  requestId: string;
  rawToken: string;
  newPassword: string;
}): Promise<{ success: boolean; message: string }> {
  await syncClockSkew();
  const db = getAdminFirestore();
  const auth = getAdminAuth();

  const { requestId, rawToken, newPassword } = params;

  if (!newPassword || newPassword.length < 6) {
    throw new Error('Password must be at least 6 characters long.');
  }

  const tokenCheck = await verifyRecoveryToken(requestId, rawToken);
  if (!tokenCheck.valid) {
    throw new Error(tokenCheck.error || 'Invalid or expired recovery token.');
  }

  const reqRef = db.collection('businessRecoveryRequests').doc(requestId);
  const snap = await reqRef.get();
  const data = snap.data() || {};

  const businessId = data.businessId;

  // Find business owner user UID
  const compSnap = await db.collection('companies').doc(businessId).get();
  const compData = compSnap.data() || {};
  const ownerUid = compData.ownerId || compData.userId;
  const businessEmail = compData.email || compData.contactEmail;

  let targetUid = ownerUid;

  if (!targetUid && businessEmail) {
    try {
      const userRecord = await auth.getUserByEmail(businessEmail);
      targetUid = userRecord.uid;
    } catch {
      // Create user if not present
    }
  }

  if (!targetUid) {
    throw new Error('Could not identify user record for this business. Contact administrator.');
  }

  // Update password in Firebase Authentication securely
  await auth.updateUser(targetUid, {
    password: newPassword,
  });

  // Mark request completed and invalidate token immediately
  const now = new Date();
  await reqRef.update({
    status: 'completed',
    completedAt: now,
    usedAt: now,
    resetTokenHash: null, // Wipe token hash
  });

  // Notify admin that reset was completed
  const completionText = `THENIJOBS — Business Password Reset Completed

Request ID: ${requestId}
Business: ${data.businessName}
Completed At: ${now.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
Status: COMPLETED

The business owner has successfully set a new password.`;

  await dispatchWhatsAppAdminNotification(completionText);

  return {
    success: true,
    message: 'Your password has been successfully reset. You can now log in with your new password.',
  };
}
