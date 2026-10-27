import type { User, UserRole } from '@/lib/types';

/**
 * Validates whether a redirect URL is safe to prevent open redirect vulnerabilities.
 * Must start with a single '/' and not '//' or protocols like 'http:', 'https:', 'javascript:'.
 */
export function isSafeRedirectUrl(url: string | null | undefined): boolean {
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim();
  if (!trimmed.startsWith('/')) return false;
  if (trimmed.startsWith('//')) return false;
  if (trimmed.includes('javascript:') || trimmed.includes('data:')) return false;
  return true;
}

/**
 * Checks whether a business owner / employer account is fully approved and active.
 */
export function isBusinessOwnerActive(user: Partial<User> | null | undefined): boolean {
  if (!user) return false;
  const isApproved = user.approvalStatus === 'approved' || user.accountStatus === 'active';
  const isNotRejected = user.approvalStatus !== 'rejected' && user.accountStatus !== 'rejected';
  return Boolean(isApproved && isNotRejected);
}

/**
 * Centralized Redirection Matrix for THENIJOBS authentication.
 * Resolves the deterministic landing route for any user based on their role,
 * account status, approval status, and plan selection.
 *
 * Matrix:
 * 1. Admin / Super Admin                -> /admin/dashboard
 * 2. Job Seeker                        -> customRedirectUrl or /seeker/dashboard
 * 3. Business Owner (Approved & Active)-> customRedirectUrl or /employer/dashboard
 * 4. Business Owner (Rejected)         -> /register-business (revision screen)
 * 5. Business Owner (Plan Not Selected)-> /register-business?step=plan
 * 6. Business Owner (Pending Approval) -> /register-business (waiting for admin review)
 * 7. Business Owner (Trial Expired)    -> /employer/dashboard (trial expired checkout gate)
 * 8. Unassigned / Role Not Selected    -> /register (role selection prompt)
 */
export function resolveAuthRedirect(
  user: Partial<User> | null | undefined,
  customRedirectUrl?: string | null
): string {
  if (!user) return '/login';

  const role = user.role as UserRole | undefined;

  // 1. Admin / Super Admin
  if (role === 'admin' || role === 'super_admin') {
    return '/admin/dashboard';
  }

  // 2. Job Seeker
  if (role === 'job_seeker') {
    if (isSafeRedirectUrl(customRedirectUrl)) {
      return customRedirectUrl!;
    }
    return '/seeker/dashboard';
  }

  // 3-7. Business Owner / Employer Hierarchy
  if (role === 'business_owner' || role === 'employer') {
    const isRejected = user.approvalStatus === 'rejected' || user.accountStatus === 'rejected';
    if (isRejected) {
      return '/register-business';
    }

    const isTrialExpired =
      user.accountStatus === 'trial_expired' ||
      user.subscriptionStatus === 'trial_expired';
    if (isTrialExpired) {
      return '/employer/dashboard';
    }

    // Check if business owner has picked a plan or free trial
    const hasPlanOrTrial = Boolean(
      user.selectedPlan ||
      user.subscriptionPlan ||
      user.trialRequested ||
      user.paymentStatus === 'paid'
    );

    if (role === 'business_owner' && !hasPlanOrTrial) {
      return '/register-business?step=plan';
    }

    const isApproved = user.approvalStatus === 'approved' || user.accountStatus === 'active';
    if (!isApproved) {
      // Pending Admin Review
      return '/register-business';
    }

    // Approved & active
    if (isSafeRedirectUrl(customRedirectUrl)) {
      return customRedirectUrl!;
    }
    return '/employer/dashboard';
  }

  // Supplier or Service Provider accounts
  if (role === 'supplier' || role === 'service_provider') {
    if (isSafeRedirectUrl(customRedirectUrl)) {
      return customRedirectUrl!;
    }
    return '/employer/dashboard';
  }

  // Employee / Staff account
  if (role === 'employee') {
    if (isSafeRedirectUrl(customRedirectUrl)) {
      return customRedirectUrl!;
    }
    return '/employer/dashboard';
  }

  // 8. Pending role selection or unassigned
  return '/register';
}

/**
 * Maps Firebase Auth error codes into friendly, actionable UI messages.
 */
export function getFriendlyAuthErrorMessage(codeOrMessage: unknown, defaultMessage?: string): string {
  const code = typeof codeOrMessage === 'object' && codeOrMessage !== null && 'code' in codeOrMessage
    ? String((codeOrMessage as any).code)
    : typeof codeOrMessage === 'string'
    ? codeOrMessage
    : '';

  switch (code) {
    case 'auth/popup-closed-by-user':
      return 'Sign-in was cancelled. The Google window was closed before completing.';
    case 'auth/popup-blocked':
      return 'The Google sign-in popup was blocked by your browser. Please allow popups for this site and try again.';
    case 'auth/cancelled-popup-request':
      return 'A sign-in request is already in progress. Please complete or dismiss it.';
    case 'auth/unauthorized-domain':
      return 'This domain is not authorized for Google Sign-In in Firebase Console. Please add it to Authorized Domains.';
    case 'auth/operation-not-allowed':
      return 'Google Sign-In is not enabled in Firebase Authentication console. Please enable it in the Firebase Console.';
    case 'auth/account-exists-with-different-credential':
      return 'An account already exists with this email address using email/password. Please enter your password to link your Google account.';
    case 'auth/credential-already-in-use':
      return 'This Google account is already linked to another user account.';
    case 'auth/network-request-failed':
      return 'Network connection error during sign-in. Please check your internet connection.';
    case 'auth/user-disabled':
      return 'This user account has been disabled by an administrator. Please contact support.';
    case 'auth/invalid-credential':
      return 'Invalid or expired credentials. Please try signing in again.';
    case 'auth/user-not-found':
      return 'No account found with this email. Please check your credentials or create a new account.';
    case 'auth/wrong-password':
      return 'Incorrect password. Please verify and try again.';
    default: {
      const msg = typeof codeOrMessage === 'object' && codeOrMessage !== null && 'message' in codeOrMessage
        ? String((codeOrMessage as any).message)
        : typeof codeOrMessage === 'string' && codeOrMessage
        ? codeOrMessage
        : defaultMessage || 'Authentication failed. Please try again.';
      return msg;
    }
  }
}
