/**
 * Maps standard Firebase Authentication error codes to user-friendly, readable error messages.
 * 
 * @param error The error thrown by Firebase Authentication
 * @returns A friendly, localized English error message
 */
export function mapAuthError(error: any): string {
  if (!error) return 'An unknown authentication error occurred.';

  // Retrieve code from error object (could be err.code or err.message containing the code)
  const code = error.code || (typeof error.message === 'string' ? error.message : '');

  if (code.includes('auth/invalid-credential') || code.includes('auth/wrong-password') || code.includes('auth/user-not-found')) {
    return 'Invalid email or password. Please verify your credentials and try again.';
  }

  if (code.includes('auth/invalid-email')) {
    return 'Please enter a valid email address.';
  }

  if (code.includes('auth/email-already-in-use')) {
    return 'This email address is already registered. Please sign in instead.';
  }

  if (code.includes('auth/weak-password')) {
    return 'Password is too weak. It must be at least 6 characters.';
  }

  if (code.includes('auth/too-many-requests')) {
    return 'Too many failed login attempts. Please try again later or reset your password.';
  }

  if (code.includes('auth/user-disabled')) {
    return 'This account has been disabled. Please contact support.';
  }

  if (code.includes('auth/operation-not-allowed')) {
    return 'This sign-in method is currently disabled.';
  }

  if (code.includes('auth/popup-closed-by-user')) {
    return 'The sign-in popup was closed before completion. Please try again.';
  }

  if (code.includes('auth/network-request-failed')) {
    return 'Network connection failed. Please check your internet connection and try again.';
  }

  // Fallback to error message, cleaning up Firebase prefix if present
  const rawMessage = error.message || String(error);
  if (rawMessage.startsWith('Firebase:')) {
    return rawMessage.replace(/^Firebase:\s*(Error\s*)?\(auth\/[^)]+\)\.?\s*/i, '').trim() || 'Authentication failed.';
  }

  return rawMessage;
}
