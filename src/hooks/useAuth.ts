'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth as useAuthContext } from '@/contexts/AuthContext';
import type { UserRole } from '@/lib/types';
import { getDashboardPathForRole } from '@/lib/access';

// Re-export the core useAuth hook so consumers can import from hooks/
export { useAuth as useAuthContext } from '@/contexts/AuthContext';

/**
 * Access the current authentication state, actions, and role helpers.
 * Thin re-export of the AuthContext hook for convenience.
 */
export const useAuth = useAuthContext;

/**
 * Guard hook – redirects to `/login` when the user is not authenticated
 * or does not have one of the `allowedRoles`.
 *
 * @param allowedRoles - Optional whitelist of roles. If omitted any
 *   authenticated user is allowed.
 * @param redirectTo - Path to redirect unauthenticated users to (default `/login`).
 *
 * @example
 * ```tsx
 * // Only admins
 * useRequireAuth(['admin', 'super_admin']);
 *
 * // Any logged-in user
 * useRequireAuth();
 * ```
 */
export function useRequireAuth(
  allowedRoles?: UserRole[],
  redirectTo = '/login',
  options: { skip?: boolean } = {},
) {
  const { user, loading } = useAuthContext();
  const router = useRouter();

  useEffect(() => {
    if (options.skip) return;
    if (loading) return;

    // Not authenticated → redirect to login
    if (!user) {
      router.replace(redirectTo);
      return;
    }

    // Role check (if roles were specified)
    if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
      router.replace(getDashboardPathForRole(user.role));
    }
  }, [user, loading, allowedRoles, redirectTo, router, options.skip]);

  return { user, loading };
}
