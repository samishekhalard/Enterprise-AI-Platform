import { inject } from '@angular/core';
import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { catchError, switchMap, throwError, from, BehaviorSubject, filter, take } from 'rxjs';
import { TokenService } from '../services/token.service';
import { TenantResolverService } from '../services/tenant-resolver.service';
import { AuthService } from '../services/auth.service';
import { environment } from '../../../environments/environment';

/**
 * Auth Interceptor
 *
 * Attaches authentication headers to outgoing requests:
 * - Authorization: Bearer <token>
 * - X-Tenant-ID: <tenant_id>
 *
 * Handles 401/403 responses:
 * - 401: Attempt token refresh, retry request, or redirect to login
 * - 403: Redirect to access denied page
 */

// Track refresh state to prevent multiple simultaneous refreshes
let isRefreshing = false;
const refreshSubject = new BehaviorSubject<boolean>(false);

export const authInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
) => {
  const tokenService = inject(TokenService);
  const tenantResolver = inject(TenantResolverService);
  const authService = inject(AuthService);
  const router = inject(Router);

  // Skip auth for public endpoints
  if (isPublicEndpoint(req.url)) {
    return next(addTenantHeader(req, tenantResolver));
  }

  // Get access token
  const token = tokenService.getAccessToken();

  // Add auth headers
  let authReq = req;
  if (token) {
    authReq = addAuthHeaders(req, token, tenantResolver);
  } else {
    authReq = addTenantHeader(req, tenantResolver);
  }

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        return handle401Error(authReq, next, tokenService, authService, router);
      }

      if (error.status === 403) {
        return handle403Error(error, router);
      }

      return throwError(() => error);
    })
  );
};

/**
 * Add authorization and tenant headers
 */
function addAuthHeaders(
  req: HttpRequest<unknown>,
  token: string,
  tenantResolver: TenantResolverService
): HttpRequest<unknown> {
  const tenantId = tenantResolver.tenantId();

  return req.clone({
    setHeaders: {
      Authorization: `Bearer ${token}`,
      ...(tenantId ? { 'X-Tenant-ID': tenantId } : {})
    }
  });
}

/**
 * Add tenant header only (for public endpoints)
 */
function addTenantHeader(
  req: HttpRequest<unknown>,
  tenantResolver: TenantResolverService
): HttpRequest<unknown> {
  const tenantId = tenantResolver.tenantId();

  if (!tenantId) {
    return req;
  }

  return req.clone({
    setHeaders: {
      'X-Tenant-ID': tenantId
    }
  });
}

/**
 * Handle 401 Unauthorized
 * Attempt token refresh and retry the request
 */
function handle401Error(
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
  tokenService: TokenService,
  authService: AuthService,
  router: Router
) {
  // If already refreshing, wait for it to complete
  if (isRefreshing) {
    return refreshSubject.pipe(
      filter(refreshed => refreshed),
      take(1),
      switchMap(() => {
        const newToken = tokenService.getAccessToken();
        if (newToken) {
          return next(addAuthHeadersSimple(req, newToken));
        }
        return throwError(() => new Error('No token after refresh'));
      })
    );
  }

  isRefreshing = true;
  refreshSubject.next(false);

  return from(authService.refreshToken()).pipe(
    switchMap(() => {
      isRefreshing = false;
      refreshSubject.next(true);

      const newToken = tokenService.getAccessToken();
      if (newToken) {
        return next(addAuthHeadersSimple(req, newToken));
      }
      return throwError(() => new Error('No token after refresh'));
    }),
    catchError(error => {
      isRefreshing = false;
      refreshSubject.next(false);

      // Refresh failed - log out user
      authService.logoutLocal(false);

      // Redirect to login with return URL
      router.navigate(['/login'], {
        queryParams: {
          returnUrl: router.url,
          reason: 'session_expired'
        }
      });

      return throwError(() => error);
    })
  );
}

/**
 * Handle 403 Forbidden
 */
function handle403Error(
  error: HttpErrorResponse,
  router: Router
) {
  // Check if it's a specific permission error
  const errorCode = error.error?.code;

  if (errorCode === 'insufficient_permissions') {
    router.navigate(['/errors/access-denied'], {
      state: { message: error.error?.message }
    });
  } else if (errorCode === 'account_locked') {
    router.navigate(['/errors/account-locked']);
  } else {
    router.navigate(['/errors/access-denied']);
  }

  return throwError(() => error);
}

/**
 * Simple auth header addition (for retry after refresh)
 */
function addAuthHeadersSimple(
  req: HttpRequest<unknown>,
  token: string
): HttpRequest<unknown> {
  return req.clone({
    setHeaders: {
      Authorization: `Bearer ${token}`
    }
  });
}

/**
 * Check if URL is a public endpoint
 */
function isPublicEndpoint(url: string): boolean {
  const publicPaths = [
    '/api/tenants/resolve',
    '/api/v1/auth/login',
    '/api/v1/auth/social',
    '/api/v1/auth/password/reset',
    '/api/health',
    '/api/version'
  ];

  return publicPaths.some(path => url.includes(path));
}

/**
 * Logging Interceptor (for development)
 */
export const loggingInterceptor: HttpInterceptorFn = (req, next) => {
  if (!environment.enableDebugLogging) {
    return next(req);
  }

  const started = Date.now();
  console.log(`[HTTP] ${req.method} ${req.url}`);

  return next(req).pipe(
    catchError(error => {
      const elapsed = Date.now() - started;
      console.error(`[HTTP] ${req.method} ${req.url} failed after ${elapsed}ms`, error);
      return throwError(() => error);
    })
  );
};
