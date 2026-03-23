import { Injectable, inject, signal, computed, PLATFORM_ID } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';
import { Observable, of, throwError } from 'rxjs';
import { tap, catchError, switchMap, finalize } from 'rxjs/operators';

import { AuthFacade } from './auth-facade';
import { TokenService } from '../services/token.service';
import { TenantResolverService } from '../services/tenant-resolver.service';
import { environment } from '../../../environments/environment';
import {
  AuthResponse,
  AuthState,
  AuthError,
  AuthErrorCode,
  LoginRequest,
  MFAVerifyRequest,
  MFAVerifyResponse,
  MFASetupRequest,
  MFASetupResponse,
  MFAStatus,
  PasswordResetRequest,
  PasswordChangeRequest,
  SessionListResponse,
  AUTH_ENDPOINTS,
  INITIAL_AUTH_STATE
} from '../../models/auth.model';

/**
 * Keycloak Auth Facade Implementation
 *
 * Implements AuthFacade for Keycloak-based authentication.
 * Uses the Backend Auth Facade (BFF pattern) for all Keycloak interactions.
 *
 * To switch to a different provider (Auth0, Okta):
 * 1. Create a new class extending AuthFacade
 * 2. Update app.config.ts: { provide: AuthFacade, useClass: NewAuthFacade }
 */
@Injectable()
export class KeycloakAuthFacade extends AuthFacade {
  private http = inject(HttpClient);
  private router = inject(Router);
  private tokenService = inject(TokenService);
  private tenantResolver = inject(TenantResolverService);
  private platformId = inject(PLATFORM_ID);

  // Private state
  private _state = signal<AuthState>(INITIAL_AUTH_STATE);
  private _returnUrl = signal<string | null>(null);

  // Public readonly signals (implementing AuthFacade)
  readonly user = computed(() => this._state().user);
  readonly isAuthenticated = computed(() => this._state().isAuthenticated);
  readonly isLoading = computed(() => this._state().isLoading);
  readonly error = computed(() => this._state().error);
  readonly mfaRequired = computed(() => this._state().mfaRequired);

  constructor() {
    super();
    this.tokenService.onTokenRefresh(() => this.refreshToken());
    this.restoreSession();
  }

  // =========================================================================
  // Auth API URL
  // =========================================================================

  private get authApiUrl(): string {
    return (environment as any).authApiUrl ?? environment.apiUrl;
  }

  // =========================================================================
  // Authentication Methods
  // =========================================================================

  login(email: string, password: string, rememberMe = false): Observable<AuthResponse> {
    this.setLoading(true);
    this.clearError();

    const request: LoginRequest = {
      email,
      password,
      tenantId: this.tenantResolver.tenantId() ?? '',
      rememberMe,
      deviceInfo: this.getDeviceInfo()
    };
    const tenantId = this.tenantResolver.tenantId();

    return this.http.post<AuthResponse>(
      `${this.authApiUrl}${AUTH_ENDPOINTS.LOGIN}`,
      request,
      { headers: tenantId ? { 'X-Tenant-ID': tenantId } : {} }
    ).pipe(
      tap(response => this.handleAuthResponse(response)),
      catchError(error => this.handleAuthError(error)),
      finalize(() => this.setLoading(false))
    );
  }

  /**
   * Initiate login with external identity provider
   * Uses kc_idp_hint for Keycloak identity brokering
   */
  loginWithProvider(providerId: string, returnUrl?: string): void {
    if (!isPlatformBrowser(this.platformId)) return;

    // Store return URL
    if (returnUrl) {
      this.setReturnUrl(returnUrl);
    }

    const state = this.generateState();

    // Store state for CSRF protection
    sessionStorage.setItem('auth_state', state);

    // Redirect to Backend Auth Facade endpoint
    // The backend will handle kc_idp_hint and redirect to Keycloak
    const redirectUrl = `${this.authApiUrl}/api/v1/auth/login/${providerId}`;
    const params = new URLSearchParams({
      redirectUri: `${window.location.origin}/auth/callback`,
      state
    });

    window.location.href = `${redirectUrl}?${params.toString()}`;
  }

  handleAuthCallback(code: string, state: string): Observable<AuthResponse> {
    // Verify state
    const storedState = sessionStorage.getItem('auth_state');
    if (state !== storedState) {
      return throwError(() => ({
        code: 'invalid_state' as AuthErrorCode,
        message: 'Invalid state parameter'
      }));
    }

    sessionStorage.removeItem('auth_state');
    this.setLoading(true);

    return this.http.post<AuthResponse>(
      `${this.authApiUrl}${AUTH_ENDPOINTS.SOCIAL}/callback`,
      { code, state, tenantId: this.tenantResolver.tenantId() }
    ).pipe(
      tap(response => {
        this.handleAuthResponse(response);
        this.handlePostLoginRedirect();
      }),
      catchError(error => this.handleAuthError(error)),
      finalize(() => this.setLoading(false))
    );
  }

  logout(redirectToLogin = true): Observable<void> {
    this.setLoading(true);

    return this.http.post<void>(
      `${this.authApiUrl}${AUTH_ENDPOINTS.LOGOUT}`,
      { tenantId: this.tenantResolver.tenantId() }
    ).pipe(
      tap(() => this.handleLogout(redirectToLogin)),
      catchError(() => {
        this.handleLogout(redirectToLogin);
        return of(undefined);
      }),
      finalize(() => this.setLoading(false))
    );
  }

  logoutLocal(redirectToLogin = true): void {
    this.handleLogout(redirectToLogin);
  }

  // =========================================================================
  // MFA Methods
  // =========================================================================

  verifyMfa(code: string, method: string, trustDevice = false): Observable<AuthResponse> {
    const mfaToken = this._state().mfaToken;
    if (!mfaToken) {
      return throwError(() => ({
        code: 'mfa_invalid' as AuthErrorCode,
        message: 'MFA session expired'
      }));
    }

    this.setLoading(true);

    const request: MFAVerifyRequest = {
      mfaToken,
      code,
      method: method as MFAVerifyRequest['method'],
      trustDevice
    };

    return this.http.post<MFAVerifyResponse>(
      `${this.authApiUrl}${AUTH_ENDPOINTS.MFA_VERIFY}`,
      request
    ).pipe(
      switchMap(response => {
        if (response.success && response.authResponse) {
          this.handleAuthResponse(response.authResponse);
          return of(response.authResponse);
        }
        return throwError(() => ({
          code: 'mfa_invalid' as AuthErrorCode,
          message: response.error ?? 'Invalid MFA code'
        }));
      }),
      catchError(error => this.handleAuthError(error)),
      finalize(() => this.setLoading(false))
    );
  }

  setupMfa(method: string, phoneNumber?: string): Observable<MFASetupResponse> {
    const request: MFASetupRequest = {
      method: method as MFASetupRequest['method'],
      phoneNumber
    };

    return this.http.post<MFASetupResponse>(
      `${this.authApiUrl}${AUTH_ENDPOINTS.MFA_SETUP}`,
      request
    );
  }

  getMfaStatus(): Observable<MFAStatus> {
    return this.http.get<MFAStatus>(`${this.authApiUrl}${AUTH_ENDPOINTS.MFA_SETUP}`);
  }

  // =========================================================================
  // Password Methods
  // =========================================================================

  requestPasswordReset(email: string): Observable<void> {
    const request: PasswordResetRequest = {
      email,
      tenantId: this.tenantResolver.tenantId() ?? ''
    };

    return this.http.post<void>(
      `${this.authApiUrl}${AUTH_ENDPOINTS.PASSWORD_RESET}`,
      request
    );
  }

  resetPassword(token: string, newPassword: string): Observable<void> {
    return this.http.post<void>(
      `${this.authApiUrl}${AUTH_ENDPOINTS.PASSWORD_RESET_CONFIRM}`,
      { token, newPassword, confirmPassword: newPassword }
    );
  }

  changePassword(currentPassword: string, newPassword: string): Observable<void> {
    const request: PasswordChangeRequest = {
      currentPassword,
      newPassword,
      confirmPassword: newPassword
    };

    return this.http.post<void>(
      `${this.authApiUrl}${AUTH_ENDPOINTS.PASSWORD_CHANGE}`,
      request
    );
  }

  // =========================================================================
  // Token & Session Methods
  // =========================================================================

  getAccessToken(): string | null {
    return this.tokenService.getAccessToken();
  }

  refreshToken(): Promise<void> {
    const tenantId = this.tenantResolver.tenantId();
    const refreshToken = this.tokenService.getRefreshToken();
    if (!refreshToken) {
      return Promise.reject(new Error('No refresh token'));
    }

    return new Promise((resolve, reject) => {
      this.http.post<AuthResponse>(
        `${this.authApiUrl}${AUTH_ENDPOINTS.REFRESH}`,
        { refreshToken },
        { headers: tenantId ? { 'X-Tenant-ID': tenantId } : {} }
      ).pipe(
        tap(response => {
          this.tokenService.setTokens(response);
          this.updateAuthState({ user: response.user });
        }),
        catchError(error => {
          this.handleLogout(true);
          return throwError(() => error);
        })
      ).subscribe({
        next: () => resolve(),
        error: (err) => reject(err)
      });
    });
  }

  getSessions(): Observable<SessionListResponse> {
    return this.http.get<SessionListResponse>(`${this.authApiUrl}${AUTH_ENDPOINTS.SESSIONS}`);
  }

  revokeSession(sessionId: string): Observable<void> {
    return this.http.delete<void>(`${this.authApiUrl}${AUTH_ENDPOINTS.SESSIONS}/${sessionId}`);
  }

  revokeOtherSessions(): Observable<void> {
    return this.http.delete<void>(`${this.authApiUrl}${AUTH_ENDPOINTS.SESSIONS}/others`);
  }

  // =========================================================================
  // Authorization Methods
  // =========================================================================

  hasRole(role: string): boolean {
    return this.tokenService.hasRole(role);
  }

  hasPermission(permission: string): boolean {
    return this.tokenService.hasPermission(permission);
  }

  // =========================================================================
  // Utility Methods
  // =========================================================================

  setReturnUrl(url: string): void {
    this._returnUrl.set(url);
    if (isPlatformBrowser(this.platformId)) {
      sessionStorage.setItem('auth_return_url', url);
    }
  }

  // =========================================================================
  // Private Methods
  // =========================================================================

  private handleAuthResponse(response: AuthResponse): void {
    if (response.mfaRequired && response.mfaToken) {
      this.updateAuthState({
        isAuthenticated: false,
        isLoading: false,
        mfaRequired: true,
        mfaToken: response.mfaToken,
        error: null
      });
    } else {
      this.tokenService.setTokens(response);
      this.updateAuthState({
        isAuthenticated: true,
        isLoading: false,
        user: response.user,
        mfaRequired: false,
        mfaToken: null,
        error: null
      });
    }
  }

  private handleAuthError(error: HttpErrorResponse): Observable<never> {
    let authError: AuthError;
    const backendCode = this.extractBackendCode(error.error);
    const backendMessage = this.extractBackendMessage(error.error);

    if (backendCode) {
      authError = { code: backendCode as AuthErrorCode, message: backendMessage ?? 'Authentication failed' };
    } else if (error.status === 401) {
      authError = { code: 'invalid_credentials', message: 'Invalid email or password' };
    } else if (error.status === 403) {
      authError = { code: 'account_disabled', message: 'Account is disabled or locked' };
    } else if (error.status === 0) {
      authError = { code: 'network_error', message: 'Unable to connect to server' };
    } else if (error.status === 503) {
      authError = { code: 'provider_error', message: backendMessage ?? 'Authentication service is temporarily unavailable' };
    } else if (error.status === 404) {
      authError = { code: 'provider_error', message: 'Authentication service endpoint is unavailable' };
    } else if (error.status >= 500) {
      authError = { code: 'provider_error', message: backendMessage ?? `Authentication service error (HTTP ${error.status})` };
    } else if (backendMessage) {
      authError = { code: 'unknown_error', message: backendMessage };
    } else {
      authError = {
        code: 'unknown_error',
        message: error.status ? `Authentication failed (HTTP ${error.status})` : 'Unable to complete authentication'
      };
    }

    this.updateAuthState({ isLoading: false, error: authError });
    return throwError(() => authError);
  }

  private extractBackendCode(payload: unknown): string | undefined {
    if (!payload || typeof payload !== 'object') return undefined;
    const body = payload as Record<string, unknown>;

    if (typeof body['code'] === 'string') return body['code'];
    if (typeof body['errorCode'] === 'string') return body['errorCode'];
    if (typeof body['error'] === 'string') return body['error'];

    const nestedError = body['error'];
    if (nestedError && typeof nestedError === 'object') {
      const nestedBody = nestedError as Record<string, unknown>;
      if (typeof nestedBody['code'] === 'string') return nestedBody['code'];
    }

    return undefined;
  }

  private extractBackendMessage(payload: unknown): string | undefined {
    if (typeof payload === 'string') return payload;
    if (!payload || typeof payload !== 'object') return undefined;

    const body = payload as Record<string, unknown>;
    const directKeys = ['message', 'detail', 'error_description', 'title'] as const;
    for (const key of directKeys) {
      if (typeof body[key] === 'string' && body[key].trim().length > 0) {
        return body[key];
      }
    }

    if (typeof body['error'] === 'string' && body['error'].trim().length > 0) {
      return body['error'];
    }

    const nestedError = body['error'];
    if (nestedError && typeof nestedError === 'object') {
      const nestedBody = nestedError as Record<string, unknown>;
      if (typeof nestedBody['message'] === 'string' && nestedBody['message'].trim().length > 0) {
        return nestedBody['message'];
      }
    }

    const errors = body['errors'];
    if (Array.isArray(errors) && errors.length > 0 && typeof errors[0] === 'string') {
      return errors[0];
    }

    return undefined;
  }

  private handleLogout(redirectToLogin: boolean): void {
    this.tokenService.clearTokens();
    this._state.set(INITIAL_AUTH_STATE);
    this._returnUrl.set(null);

    if (isPlatformBrowser(this.platformId)) {
      sessionStorage.removeItem('auth_return_url');
      sessionStorage.removeItem('auth_state');
    }

    if (redirectToLogin) {
      this.router.navigate(['/login']);
    }
  }

  private handlePostLoginRedirect(): void {
    let returnUrl = this._returnUrl();
    if (!returnUrl && isPlatformBrowser(this.platformId)) {
      returnUrl = sessionStorage.getItem('auth_return_url');
    }

    if (isPlatformBrowser(this.platformId)) {
      sessionStorage.removeItem('auth_return_url');
    }

    this._returnUrl.set(null);

    const defaultPage = '/administration';
    this.router.navigateByUrl(returnUrl ?? defaultPage);
  }

  private restoreSession(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    const hasSession = this.tokenService.restoreSession();
    if (hasSession) {
      const user = this.tokenService.getUser();
      if (user) {
        this.updateAuthState({ isAuthenticated: true, isLoading: false, user });
      }
    } else {
      this.updateAuthState({ isLoading: false });
    }
  }

  private updateAuthState(partial: Partial<AuthState>): void {
    this._state.update(current => ({ ...current, ...partial }));
  }

  private setLoading(loading: boolean): void {
    this.updateAuthState({ isLoading: loading });
  }

  private clearError(): void {
    this.updateAuthState({ error: null });
  }

  private generateState(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  private getDeviceInfo() {
    if (!isPlatformBrowser(this.platformId)) return undefined;

    return {
      deviceId: this.getOrCreateDeviceId(),
      deviceType: 'web' as const,
      browser: this.getBrowserName(),
      os: this.getOSName(),
      userAgent: navigator.userAgent
    };
  }

  private getOrCreateDeviceId(): string {
    let deviceId = localStorage.getItem('device_id');
    if (!deviceId) {
      deviceId = this.generateState();
      localStorage.setItem('device_id', deviceId);
    }
    return deviceId;
  }

  private getBrowserName(): string {
    const ua = navigator.userAgent;
    if (ua.includes('Firefox')) return 'Firefox';
    if (ua.includes('Chrome')) return 'Chrome';
    if (ua.includes('Safari')) return 'Safari';
    if (ua.includes('Edge')) return 'Edge';
    return 'Unknown';
  }

  private getOSName(): string {
    const ua = navigator.userAgent;
    if (ua.includes('Windows')) return 'Windows';
    if (ua.includes('Mac')) return 'macOS';
    if (ua.includes('Linux')) return 'Linux';
    if (ua.includes('Android')) return 'Android';
    if (ua.includes('iOS')) return 'iOS';
    return 'Unknown';
  }
}
