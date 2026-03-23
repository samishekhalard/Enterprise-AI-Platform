import { inject } from '@angular/core';
import { Router, CanActivateFn, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { TokenService } from '../services/token.service';
import { environment } from '../../../environments/environment';

/**
 * Auth Guard
 *
 * Protects routes that require authentication.
 * Redirects to login page if not authenticated.
 *
 * Usage in routes:
 * {
 *   path: 'products',
 *   component: ProductsPage,
 *   canActivate: [authGuard]
 * }
 *
 * With required roles:
 * {
 *   path: 'admin',
 *   component: AdminPage,
 *   canActivate: [authGuard],
 *   data: { roles: ['ADMIN', 'SUPER_ADMIN'] }
 * }
 */
export const authGuard: CanActivateFn = (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot
) => {
  if (environment.enableUiPreviewBypassAuth) {
    return true;
  }

  const authService = inject(AuthService);
  const tokenService = inject(TokenService);
  const router = inject(Router);

  // Check if authenticated
  if (!authService.isAuthenticated()) {
    // Store the attempted URL for redirecting after login
    authService.setReturnUrl(state.url);

    // Redirect to login
    return router.createUrlTree(['/login'], {
      queryParams: { returnUrl: state.url }
    });
  }

  // Check if MFA is required
  if (authService.mfaRequired()) {
    return router.createUrlTree(['/auth/mfa/verify']);
  }

  // Check role-based access if roles are specified in route data
  const requiredRoles = route.data['roles'] as string[] | undefined;
  if (requiredRoles && requiredRoles.length > 0) {
    const hasRole = tokenService.hasAnyRole(requiredRoles);
    if (!hasRole) {
      // User doesn't have required role
      return router.createUrlTree(['/errors/access-denied']);
    }
  }

  // Check permission-based access if permissions are specified
  const requiredPermissions = route.data['permissions'] as string[] | undefined;
  if (requiredPermissions && requiredPermissions.length > 0) {
    const hasPermissions = tokenService.hasAllPermissions(requiredPermissions);
    if (!hasPermissions) {
      return router.createUrlTree(['/errors/access-denied']);
    }
  }

  return true;
};

/**
 * Guest Guard
 *
 * Protects routes that should only be accessible to non-authenticated users.
 * Redirects to appropriate landing page if already authenticated.
 *
 * Usage in routes:
 * {
 *   path: 'login',
 *   component: LoginPage,
 *   canActivate: [guestGuard]
 * }
 */
export const guestGuard: CanActivateFn = () => {
  if (environment.enableUiPreviewBypassAuth) {
    return true;
  }

  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated()) {
    // Already logged in, redirect to administration
    return router.createUrlTree(['/administration']);
  }

  return true;
};

/**
 * MFA Guard
 *
 * Allows access only when MFA verification is required.
 * Used for MFA verification page.
 */
export const mfaGuard: CanActivateFn = () => {
  if (environment.enableUiPreviewBypassAuth) {
    return true;
  }

  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.mfaRequired()) {
    // No MFA required, redirect appropriately
    if (authService.isAuthenticated()) {
      return router.createUrlTree(['/administration']);
    }
    return router.createUrlTree(['/login']);
  }

  return true;
};

/**
 * Role Guard Factory
 *
 * Creates a guard that checks for specific roles.
 *
 * Usage:
 * {
 *   path: 'admin',
 *   component: AdminPage,
 *   canActivate: [roleGuard('ADMIN', 'SUPER_ADMIN')]
 * }
 */
export function roleGuard(...roles: string[]): CanActivateFn {
  return (route, state) => {
    const authService = inject(AuthService);
    const tokenService = inject(TokenService);
    const router = inject(Router);

    if (!authService.isAuthenticated()) {
      authService.setReturnUrl(state.url);
      return router.createUrlTree(['/login']);
    }

    if (!tokenService.hasAnyRole(roles)) {
      return router.createUrlTree(['/errors/access-denied']);
    }

    return true;
  };
}

/**
 * Permission Guard Factory
 *
 * Creates a guard that checks for specific permissions.
 *
 * Usage:
 * {
 *   path: 'settings',
 *   component: SettingsPage,
 *   canActivate: [permissionGuard('settings:read', 'settings:write')]
 * }
 */
export function permissionGuard(...permissions: string[]): CanActivateFn {
  return (route, state) => {
    const authService = inject(AuthService);
    const tokenService = inject(TokenService);
    const router = inject(Router);

    if (!authService.isAuthenticated()) {
      authService.setReturnUrl(state.url);
      return router.createUrlTree(['/login']);
    }

    if (!tokenService.hasAllPermissions(permissions)) {
      return router.createUrlTree(['/errors/access-denied']);
    }

    return true;
  };
}

/**
 * Landing Redirect Guard
 *
 * Redirects authenticated users to the appropriate landing page based on tenant type:
 * - Master tenant: /administration
 * - Regular/Dominant tenant: /products
 *
 * Usage in routes:
 * {
 *   path: '',
 *   canActivate: [landingRedirectGuard],
 *   component: EmptyComponent
 * }
 */
export const landingRedirectGuard: CanActivateFn = () => {
  if (environment.enableUiPreviewBypassAuth) {
    return inject(Router).createUrlTree(['/administration']);
  }

  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isAuthenticated()) {
    return router.createUrlTree(['/login']);
  }

  // Redirect all tenants to administration
  return router.createUrlTree(['/administration']);
};
