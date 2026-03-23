import { Injectable, inject, signal, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { AuthResponse, AuthUser, AUTH_STORAGE_KEYS } from '../../models/auth.model';

/**
 * TokenService
 *
 * Manages JWT tokens securely following security best practices:
 * - Access tokens stored in memory (not localStorage) to prevent XSS
 * - Refresh tokens handled via httpOnly cookies (set by backend)
 * - Automatic token refresh before expiry
 *
 * Note: This service works with the Keycloak Auth Facade which handles
 * the actual token exchange with Keycloak.
 */
@Injectable({
  providedIn: 'root'
})
export class TokenService {
  private platformId = inject(PLATFORM_ID);

  // In-memory token storage (more secure than localStorage)
  private _accessToken = signal<string | null>(null);
  private _refreshToken = signal<string | null>(null);
  private _user = signal<AuthUser | null>(null);
  private _tokenExpiry = signal<number | null>(null);

  // Refresh timer
  private refreshTimer: ReturnType<typeof setTimeout> | null = null;

  // Callback for token refresh
  private refreshCallback: (() => Promise<void>) | null = null;

  // Public readonly signals
  readonly accessToken = this._accessToken.asReadonly();
  readonly user = this._user.asReadonly();
  readonly tokenExpiry = this._tokenExpiry.asReadonly();

  /**
   * Get current access token
   */
  getAccessToken(): string | null {
    return this._accessToken();
  }

  /**
   * Get current user
   */
  getUser(): AuthUser | null {
    return this._user();
  }

  /**
   * Check if user has valid token
   */
  hasValidToken(): boolean {
    const token = this._accessToken();
    if (!token) return false;
    return !this.isTokenExpired(token);
  }

  /**
   * Get refresh token
   */
  getRefreshToken(): string | null {
    return this._refreshToken();
  }

  /**
   * Store tokens from auth response
   */
  setTokens(authResponse: AuthResponse): void {
    this._accessToken.set(authResponse.accessToken);
    this._refreshToken.set(authResponse.refreshToken ?? null);
    this._user.set(authResponse.user);

    // Calculate expiry time
    const expiryTime = Date.now() + (authResponse.expiresIn * 1000);
    this._tokenExpiry.set(expiryTime);

    // Store user and refresh token in sessionStorage for page refresh persistence
    this.persistSession(authResponse.user, authResponse.refreshToken ?? null);

    // Schedule automatic token refresh
    this.scheduleTokenRefresh(authResponse.expiresIn);
  }

  /**
   * Clear all tokens (logout)
   */
  clearTokens(): void {
    this._accessToken.set(null);
    this._refreshToken.set(null);
    this._user.set(null);
    this._tokenExpiry.set(null);

    // Clear refresh timer
    this.cancelTokenRefresh();

    // Clear persisted data
    if (isPlatformBrowser(this.platformId)) {
      sessionStorage.removeItem(AUTH_STORAGE_KEYS.USER);
      sessionStorage.removeItem(AUTH_STORAGE_KEYS.TENANT_ID);
      sessionStorage.removeItem(AUTH_STORAGE_KEYS.REFRESH_TOKEN);
    }
  }

  /**
   * Check if token is expired
   */
  isTokenExpired(token?: string | null): boolean {
    const tokenToCheck = token ?? this._accessToken();
    if (!tokenToCheck) return true;

    try {
      const payload = this.decodeToken(tokenToCheck);
      if (!payload?.exp) return true;

      // Add 30 second buffer for network latency
      const buffer = 30;
      return Date.now() >= (payload.exp * 1000) - (buffer * 1000);
    } catch {
      return true;
    }
  }

  /**
   * Decode JWT payload (without verification - backend handles verification)
   */
  decodeToken(token: string): JwtPayload | null {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return null;

      const payload = parts[1];
      const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
      return JSON.parse(decoded);
    } catch {
      return null;
    }
  }

  /**
   * Get token claims
   */
  getTokenClaims(): JwtPayload | null {
    const token = this._accessToken();
    return token ? this.decodeToken(token) : null;
  }

  /**
   * Get time until token expires (in seconds)
   */
  getTimeUntilExpiry(): number {
    const expiry = this._tokenExpiry();
    if (!expiry) return 0;
    return Math.max(0, Math.floor((expiry - Date.now()) / 1000));
  }

  /**
   * Register callback for token refresh
   */
  onTokenRefresh(callback: () => Promise<void>): void {
    this.refreshCallback = callback;
  }

  /**
   * Restore session from storage (for page refresh)
   */
  restoreSession(): boolean {
    if (!isPlatformBrowser(this.platformId)) return false;

    try {
      const userJson = sessionStorage.getItem(AUTH_STORAGE_KEYS.USER);
      const refreshToken = sessionStorage.getItem(AUTH_STORAGE_KEYS.REFRESH_TOKEN);

      if (userJson && refreshToken) {
        const user = JSON.parse(userJson) as AuthUser;
        this._user.set(user);
        this._refreshToken.set(refreshToken);
        // Note: Access token is not restored - will need refresh
        return true;
      }
    } catch {
      // Invalid stored data
    }

    return false;
  }

  /**
   * Check if user has specific role
   */
  hasRole(role: string): boolean {
    const userRoles = this._user()?.roles ?? [];
    const normalizedRequiredRole = this.normalizeRole(role);

    return userRoles.some(userRole =>
      this.normalizeRole(userRole) === normalizedRequiredRole
    );
  }

  /**
   * Check if user has specific permission
   */
  hasPermission(permission: string): boolean {
    const user = this._user();
    return user?.permissions?.includes(permission) ?? false;
  }

  /**
   * Check if user has any of the specified roles
   */
  hasAnyRole(roles: string[]): boolean {
    return roles.some(role => this.hasRole(role));
  }

  /**
   * Normalize role names to a canonical form for reliable comparisons.
   * Examples treated as equivalent:
   * - SUPER_ADMIN
   * - super-admin
   * - superadmin
   * - ROLE_SUPER_ADMIN
   */
  private normalizeRole(role: string): string {
    return role
      .trim()
      .replace(/^ROLE_/i, '')
      .replace(/[^a-zA-Z0-9]/g, '')
      .toUpperCase();
  }

  /**
   * Check if user has all of the specified permissions
   */
  hasAllPermissions(permissions: string[]): boolean {
    return permissions.every(perm => this.hasPermission(perm));
  }

  // =========================================================================
  // Private Methods
  // =========================================================================

  /**
   * Persist session to sessionStorage for page refresh
   */
  private persistSession(user: AuthUser, refreshToken: string | null): void {
    if (!isPlatformBrowser(this.platformId)) return;

    try {
      sessionStorage.setItem(AUTH_STORAGE_KEYS.USER, JSON.stringify(user));
      sessionStorage.setItem(AUTH_STORAGE_KEYS.TENANT_ID, user.tenantId);
      if (refreshToken) {
        sessionStorage.setItem(AUTH_STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
      }
    } catch {
      // Storage might be full or disabled
    }
  }

  /**
   * Schedule automatic token refresh
   */
  private scheduleTokenRefresh(expiresIn: number): void {
    this.cancelTokenRefresh();

    // Refresh 10 seconds before expiry (minimum 5 seconds from now)
    const refreshTime = Math.max(5000, (expiresIn - 10) * 1000);

    this.refreshTimer = setTimeout(async () => {
      if (this.refreshCallback) {
        try {
          await this.refreshCallback();
        } catch (error) {
          console.error('Token refresh failed:', error);
          // Callback should handle redirect to login
        }
      }
    }, refreshTime);
  }

  /**
   * Cancel scheduled token refresh
   */
  private cancelTokenRefresh(): void {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = null;
    }
  }
}

// ============================================================================
// Types
// ============================================================================

export interface JwtPayload {
  // Standard claims
  iss?: string;  // Issuer
  sub?: string;  // Subject (user ID)
  aud?: string | string[];  // Audience
  exp?: number;  // Expiration time
  nbf?: number;  // Not before
  iat?: number;  // Issued at
  jti?: string;  // JWT ID

  // Common custom claims
  email?: string;
  name?: string;
  given_name?: string;
  family_name?: string;
  preferred_username?: string;
  roles?: string[];
  permissions?: string[];
  tenant_id?: string;
  realm?: string;

  // Keycloak specific
  realm_access?: {
    roles: string[];
  };
  resource_access?: Record<string, {
    roles: string[];
  }>;
  scope?: string;
  sid?: string;  // Session ID
  azp?: string;  // Authorized party

  // Allow additional claims
  [key: string]: unknown;
}
