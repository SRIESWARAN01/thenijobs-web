import type { UserRole } from '@/lib/types';

// All roles that map to the unified Business account
const BUSINESS_ROLES: UserRole[] = [
  'business',
  'employer',
  'pending_employer',
  'business_owner',
  'supplier',
  'service_provider',
  'entrepreneur',
];

export function isAdminRole(role?: UserRole | null) {
  return role === 'admin' || role === 'super_admin';
}

/** Returns true for the unified 'business' role and all legacy business roles */
export function isBusinessRole(role?: UserRole | null) {
  return !!role && BUSINESS_ROLES.includes(role);
}

/**
 * @deprecated Use `isBusinessRole` instead.
 * Kept for backward compatibility during migration.
 */
export function isEmployerPortalRole(role?: UserRole | null) {
  return isBusinessRole(role);
}

export function getDashboardPathForRole(role?: UserRole | null) {
  if (isAdminRole(role)) return '/admin/dashboard';
  if (isBusinessRole(role)) return '/business/dashboard';
  return '/seeker/dashboard';
}

export function getSafePostLoginRedirect(
  requestedPath: string | null | undefined,
  role?: UserRole | null,
) {
  const dashboardPath = getDashboardPathForRole(role);
  if (!requestedPath || !requestedPath.startsWith('/')) return dashboardPath;
  if (requestedPath.startsWith('//')) return dashboardPath;

  if (isAdminRole(role) && requestedPath.startsWith('/admin/')) return requestedPath;

  if (isBusinessRole(role)) {
    // Allow access to the unified /business/* dashboard
    if (requestedPath.startsWith('/business/')) return requestedPath;
    // Also allow legacy /employer/* and /service/* paths (they'll redirect internally)
    if (requestedPath.startsWith('/employer/')) return requestedPath;
    if (requestedPath.startsWith('/service/')) return requestedPath;
  }

  if (role === 'job_seeker' && requestedPath.startsWith('/seeker/')) {
    return requestedPath;
  }

  return dashboardPath;
}
