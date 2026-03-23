/**
 * User Management Models
 *
 * Interfaces for the tenant user administration feature.
 * Used by UserAdminService and user management components.
 */

/**
 * Represents a user within a tenant context.
 */
export interface TenantUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  displayName: string;
  active: boolean;
  emailVerified: boolean;
  roles: string[];
  groups: string[];
  identityProvider: string;
  lastLoginAt: string | null;
  createdAt: string;
}

/**
 * Parameters for filtering and paginating the user list.
 */
export interface UserListParams {
  page?: number;
  size?: number;
  search?: string;
  role?: string;
  status?: string;
}

/**
 * Generic paged response from the API.
 */
export interface PagedResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

/**
 * Available user roles with display metadata.
 */
export type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'MANAGER' | 'USER' | 'VIEWER';

/**
 * Role display configuration for UI rendering.
 */
export interface RoleDisplay {
  label: string;
  cssClass: string;
}

/**
 * Map of role identifiers to their display properties.
 */
export const ROLE_DISPLAY_MAP: Record<UserRole, RoleDisplay> = {
  SUPER_ADMIN: { label: 'Super Admin', cssClass: 'role-super-admin' },
  ADMIN: { label: 'Admin', cssClass: 'role-admin' },
  MANAGER: { label: 'Manager', cssClass: 'role-manager' },
  USER: { label: 'User', cssClass: 'role-user' },
  VIEWER: { label: 'Viewer', cssClass: 'role-viewer' }
};

/**
 * User status filter options.
 */
export const USER_STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' }
] as const;

/**
 * User role filter options.
 */
export const USER_ROLE_OPTIONS: { value: string; label: string }[] = [
  { value: '', label: 'All Roles' },
  { value: 'SUPER_ADMIN', label: 'Super Admin' },
  { value: 'ADMIN', label: 'Admin' },
  { value: 'MANAGER', label: 'Manager' },
  { value: 'USER', label: 'User' },
  { value: 'VIEWER', label: 'Viewer' }
];

/**
 * Page size options for the user list pagination.
 */
export const PAGE_SIZE_OPTIONS = [10, 25, 50] as const;
