import {
  HttpErrorResponse,
  HttpHandlerFn,
  HttpInterceptorFn,
  HttpRequest,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, catchError, filter, switchMap, take, throwError } from 'rxjs';
import { ApiGatewayService } from '../api/api-gateway.service';
import { SessionService } from '../services/session.service';
import { TenantContextService } from '../services/tenant-context.service';

let isRefreshing = false;
const refreshCompleted$ = new BehaviorSubject<boolean>(false);

export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const session = inject(SessionService);
  const api = inject(ApiGatewayService);
  const router = inject(Router);
  const tenantContext = inject(TenantContextService);

  const isApiRequest = request.url.includes('/api/');
  const isPublic = isPublicEndpoint(request.url);

  if (!isApiRequest || isPublic) {
    return next(request);
  }

  const accessToken = session.accessToken();
  const tenantId = tenantContext.tenantId();

  const extraHeaders: Record<string, string> = {};
  if (accessToken && !request.headers.has('Authorization')) {
    extraHeaders['Authorization'] = `Bearer ${accessToken}`;
  }
  if (tenantId && !request.headers.has('X-Tenant-ID')) {
    extraHeaders['X-Tenant-ID'] = tenantId;
  }

  const authRequest =
    Object.keys(extraHeaders).length > 0 ? request.clone({ setHeaders: extraHeaders }) : request;

  return next(authRequest).pipe(
    catchError((error: unknown) => {
      if (!(error instanceof HttpErrorResponse) || error.status !== 401) {
        return throwError(() => error);
      }

      return handleUnauthorized(authRequest, next, api, session, router, tenantId);
    }),
  );
};

function handleUnauthorized(
  request: HttpRequest<unknown>,
  next: HttpHandlerFn,
  api: ApiGatewayService,
  session: SessionService,
  router: Router,
  tenantId: string | null,
): ReturnType<HttpHandlerFn> {
  const refreshToken = session.refreshToken();
  if (!refreshToken) {
    forceLogout(session, router);
    return throwError(() => new Error('Session expired: no refresh token.'));
  }

  const buildRetryHeaders = (token: string): Record<string, string> => {
    const headers: Record<string, string> = { Authorization: `Bearer ${token}` };
    if (tenantId) headers['X-Tenant-ID'] = tenantId;
    return headers;
  };

  if (isRefreshing) {
    return refreshCompleted$.pipe(
      filter(Boolean),
      take(1),
      switchMap(() => {
        const updatedAccessToken = session.accessToken();
        if (!updatedAccessToken) {
          forceLogout(session, router);
          return throwError(
            () => new Error('Session expired: refresh did not return access token.'),
          );
        }

        return next(request.clone({ setHeaders: buildRetryHeaders(updatedAccessToken) }));
      }),
    );
  }

  isRefreshing = true;
  refreshCompleted$.next(false);

  return api.refreshToken({ refreshToken }).pipe(
    catchError((refreshError: unknown) => {
      isRefreshing = false;
      refreshCompleted$.next(false);
      forceLogout(session, router);
      return throwError(() => refreshError);
    }),
    switchMap((response) => {
      const updatedAccessToken = response.accessToken ?? null;
      if (!updatedAccessToken) {
        forceLogout(session, router);
        return throwError(() => new Error('Session expired: missing refreshed token.'));
      }

      session.setTokens(
        updatedAccessToken,
        response.refreshToken ?? refreshToken,
        session.isPersistentSession(),
      );
      isRefreshing = false;
      refreshCompleted$.next(true);

      return next(request.clone({ setHeaders: buildRetryHeaders(updatedAccessToken) }));
    }),
  );
}

function forceLogout(session: SessionService, router: Router): void {
  const returnUrl = router.url;
  session.clearTokens();
  void router.navigate(['/auth/login'], {
    queryParams: {
      reason: 'session_expired',
      returnUrl,
    },
    replaceUrl: true,
  });
}

function isPublicEndpoint(url: string): boolean {
  return (
    url.includes('/api/v1/auth/login') ||
    url.includes('/api/v1/auth/messages') ||
    url.includes('/api/v1/auth/refresh') ||
    url.includes('/api/v1/auth/logout') ||
    url.includes('/api/v1/auth/password/reset') ||
    url.includes('/api/tenants/resolve') ||
    url.includes('/api/health') ||
    url.includes('/api/version')
  );
}
