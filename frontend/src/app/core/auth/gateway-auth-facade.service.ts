import { inject, Injectable, Signal, signal } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, map, Observable, of, tap } from 'rxjs';
import { ApiGatewayService } from '../api/api-gateway.service';
import { LoginResponse } from '../api/models';
import { SessionService } from '../services/session.service';
import { TenantContextService } from '../services/tenant-context.service';
import { AuthFacade, LoginCredentials } from './auth-facade';

@Injectable({
  providedIn: 'root',
})
export class GatewayAuthFacadeService implements AuthFacade {
  private readonly messageState = signal<string | null>(null);
  private readonly api = inject(ApiGatewayService);
  private readonly session = inject(SessionService);
  private readonly tenantContext = inject(TenantContextService);
  private readonly router = inject(Router);

  readonly isAuthenticated: Signal<boolean>;
  readonly message = this.messageState.asReadonly();

  constructor() {
    this.isAuthenticated = this.session.isAuthenticated;
  }

  login(credentials: LoginCredentials): Observable<LoginResponse> {
    const tenantSet = this.tenantContext.setTenantFromInput(credentials.tenantId);
    if (!tenantSet) {
      return of({
        success: false,
        message: 'Tenant ID must be a valid UUID or recognized alias.',
      });
    }

    return this.api
      .login({
        identifier: credentials.identifier,
        password: credentials.password,
        tenantId: credentials.tenantId,
      })
      .pipe(
        tap((payload) => {
          if (payload.accessToken) {
            this.session.setTokens(
              payload.accessToken,
              payload.refreshToken ?? null,
              credentials.rememberMe,
            );
            this.messageState.set(null);
          }
        }),
      );
  }

  logout(): Observable<void> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      this.logoutLocal('logged_out');
      return of(void 0);
    }

    return this.api.logout({ refreshToken }).pipe(
      catchError(() => of(void 0)),
      map(() => {
        this.logoutLocal('logged_out');
      }),
    );
  }

  logoutLocal(redirectReason: 'logged_out' | 'session_expired' = 'logged_out'): void {
    const returnUrl = this.router.url;
    this.session.clearTokens();
    this.messageState.set(
      redirectReason === 'session_expired'
        ? 'Your session expired. Please sign in again.'
        : 'You have been signed out successfully.',
    );
    void this.router.navigate(['/auth/login'], {
      queryParams: {
        returnUrl,
        reason: redirectReason,
        loggedOut: redirectReason === 'logged_out' ? '1' : undefined,
      },
      replaceUrl: true,
    });
  }

  getAccessToken(): string | null {
    return this.session.accessToken();
  }

  getRefreshToken(): string | null {
    return this.session.refreshToken();
  }
}
