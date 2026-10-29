// ============================================================
// THENIJOBS — Business Constants & Client-Safe Utilities
// Safe for both Client Components and Server-Side execution
// ============================================================

export interface EligibleBusinessPublic {
  id: string;
  name: string;
  taluk: string;
}

/**
 * The 8 Approved Eligible Business IDs matching database records:
 * 1. Agrimore — Chinnamanur (ik3pWBDVVUR3Sb51knwK)
 * 2. Sarvesh Super Market — Theni (mWWNVrCGounWsmXdaRGL)
 * 3. Apex Scholar Publication — Theni (oKDQpFZ3bx9C4S0Z0ti9)
 * 4. Suruliraj Chemicals — Theni (u9sYSAG9YoGrept1FbSe)
 * 5. M K Security Solutions & Electronics — Theni (7K95afmwXMddFJo8PeRB)
 * 6. Chennai Bakes — Uthamapalayam (SDv5CaYdxKRWOXl4ej84)
 * 7. SVR Heritage Hall — Uthamapalayam (VG1PwPzKXofu1fLxLIpk)
 * 8. AGS IT Solutions — Theni (vMQgOwNd2fZ4Nm8870Dw)
 */
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

/**
 * Returns safe public metadata for the 8 eligible businesses for dropdown selection.
 * Never exposes private phone numbers, emails, or internal credentials.
 */
export function getEligibleBusinessesPublicList(): EligibleBusinessPublic[] {
  return [
    { id: 'ik3pWBDVVUR3Sb51knwK', name: 'Agrimore', taluk: 'Chinnamanur' },
    { id: 'mWWNVrCGounWsmXdaRGL', name: 'Sarvesh Super Market', taluk: 'Theni' },
    { id: 'oKDQpFZ3bx9C4S0Z0ti9', name: 'Apex Scholar Publication', taluk: 'Theni' },
    { id: 'u9sYSAG9YoGrept1FbSe', name: 'Suruliraj Chemicals', taluk: 'Theni' },
    { id: '7K95afmwXMddFJo8PeRB', name: 'M K Security Solutions & Electronics', taluk: 'Theni' },
    { id: 'SDv5CaYdxKRWOXl4ej84', name: 'Chennai Bakes', taluk: 'Uthamapalayam' },
    { id: 'VG1PwPzKXofu1fLxLIpk', name: 'SVR Heritage Hall', taluk: 'Uthamapalayam' },
    { id: 'vMQgOwNd2fZ4Nm8870Dw', name: 'AGS IT Solutions', taluk: 'Theni' },
  ];
}

/**
 * Normalizes Indian mobile number to clean 10 digits.
 */
export function normalizePhoneNumber(raw?: string | null): string {
  if (!raw) return '';
  const digits = raw.replace(/\D/g, '');
  if (digits.length === 10) return digits;
  if (digits.length === 12 && digits.startsWith('91')) return digits.slice(2);
  if (digits.length === 11 && digits.startsWith('0')) return digits.slice(1);
  return digits.slice(-10);
}

/**
 * Masks phone number for secure display: e.g. 9843913423 -> 98****3423
 */
export function maskPhoneNumber(phone?: string | null): string {
  const norm = normalizePhoneNumber(phone);
  if (norm.length !== 10) return '**********';
  return `${norm.slice(0, 2)}****${norm.slice(-4)}`;
}

/**
 * Masks email address: e.g. agrimorein@gmail.com -> a*****n@gmail.com
 */
export function maskEmail(email?: string | null): string {
  if (!email || !email.includes('@')) return '*****@***.***';
  const [local, domain] = email.trim().toLowerCase().split('@');
  if (local.length <= 2) return `${local[0]}*@${domain}`;
  return `${local[0]}****${local.slice(-1)}@${domain}`;
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

  return `THENIJOBS — Business Account Recovery Request\n\nRequest ID: ${params.requestId}\nBusiness Name: ${params.businessName}\nRegistered Business Mobile: ${maskPhoneNumber(params.registeredMobile)}\nRequester Contact Mobile: ${params.requesterMobile}\n${params.registeredEmail ? `Registered Email: ${maskEmail(params.registeredEmail)}\n` : ''}Date: ${dateStr}\nStatus: Pending Admin Verification\n\nPlease verify the business identity before authorizing account recovery.\nAdmin Dashboard: https://www.thenijobs.com/admin/business-recovery`;
}
