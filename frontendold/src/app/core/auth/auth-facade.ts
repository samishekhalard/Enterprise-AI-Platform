import { Signal } from '@angular/core';
import { Observable } from 'rxjs';
import { AuthResponse, AuthUser, AuthError, MFAStatus, MFASetupResponse, SessionListResponse } from '../../models/auth.model';

/**
 * Abstract Auth Facade
 *
 * This abstract class serves as the DI token for authentication.
 * Components inject this abstraction, not the concrete implementation.
 *
 * Benefits:
 * - Testability: Swap with a test-specific AuthFacade implementation when needed
 * - Provider agnostic: Switch between Keycloak, Auth0, Okta via app.config.ts
 * - Clean architecture: UI components don't know implementation details
 *
 * Usage in components:
 * ```typescript
 * @Component({...})
 * export class LoginComponent {
 *   constructor(protected auth: AuthFacade) {}
 * }
 * ```
 *
 * Configuration in app.config.ts:
 * ```typescript
 * { provide: AuthFacade, useClass: KeycloakAuthFacade }
 * ```
 */
export abstract class AuthFacade {
  // =========================================================================
  // Reactive State (Signals)
  // =========================================================================

  /** Current authenticated user (null if not authenticated) */
  abstract readonly user: Signal<AuthUser | null>;

  /** Whether user is currently authenticated */
  abstract readonly isAuthenticated: Signal<boolean>;

  /** Whether an auth operation is in progress */
  abstract readonly isLoading: Signal<boolean>;

  /** Current auth error (null if no error) */
  abstract readonly error: Signal<AuthError | null>;

  /** Whether MFA verification is required */
  abstract readonly mfaRequired: Signal<boolean>;

  // =========================================================================
  // Authentication Methods
  // =========================================================================

  /**
   * Login with email and password
   * @param email User email
   * @param password User password
   * @param rememberMe Whether to persist session
   */
  abstract login(email: string, password: string, rememberMe?: boolean): Observable<AuthResponse>;

  /**
   * Initiate login with external identity provider
   * Handles redirect to IdP (uses kc_idp_hint for Keycloak, connection for Auth0, etc.)
   * @param providerId Provider alias (e.g., 'google', 'microsoft', 'uaepass', 'saml')
   * @param returnUrl URL to redirect after successful authentication
   */
  abstract loginWithProvider(providerId: string, returnUrl?: string): void;

  /**
   * Handle OAuth/OIDC callback after provider redirect
   * @param code Authorization code
   * @param state State parameter for CSRF protection
   */
  abstract handleAuthCallback(code: string, state: string): Observable<AuthResponse>;

  /**
   * Logout and clear session
   * @param redirectToLogin Whether to redirect to login page after logout
   */
  abstract logout(redirectToLogin?: boolean): Observable<void>;

  /**
   * Logout locally without API call (for errors, session expiry)
   */
  abstract logoutLocal(redirectToLogin?: boolean): void;

  // =========================================================================
  // MFA Methods
  // =========================================================================

  /**
   * Verify MFA code during login
   * @param code The MFA code entered by user
   * @param method The MFA method (totp, sms, email, etc.)
   * @param trustDevice Whether to trust this device for future logins
   */
  abstract verifyMfa(code: string, method: string, trustDevice?: boolean): Observable<AuthResponse>;

  /**
   * Setup MFA method for user
   * @param method The MFA method to setup
   * @param phoneNumber Phone number for SMS method
   */
  abstract setupMfa(method: string, phoneNumber?: string): Observable<MFASetupResponse>;

  /**
   * Get current MFA status
   */
  abstract getMfaStatus(): Observable<MFAStatus>;

  // =========================================================================
  // Password Methods
  // =========================================================================

  /**
   * Request password reset email
   */
  abstract requestPasswordReset(email: string): Observable<void>;

  /**
   * Reset password with token
   */
  abstract resetPassword(token: string, newPassword: string): Observable<void>;

  /**
   * Change password (authenticated user)
   */
  abstract changePassword(currentPassword: string, newPassword: string): Observable<void>;

  // =========================================================================
  // Token & Session Methods
  // =========================================================================

  /**
   * Get current access token
   */
  abstract getAccessToken(): string | null;

  /**
   * Refresh access token
   */
  abstract refreshToken(): Promise<void>;

  /**
   * Get active sessions
   */
  abstract getSessions(): Observable<SessionListResponse>;

  /**
   * Revoke a specific session
   */
  abstract revokeSession(sessionId: string): Observable<void>;

  /**
   * Revoke all other sessions (keep current)
   */
  abstract revokeOtherSessions(): Observable<void>;

  // =========================================================================
  // Authorization Methods
  // =========================================================================

  /**
   * Check if user has specific role
   */
  abstract hasRole(role: string): boolean;

  /**
   * Check if user has specific permission
   */
  abstract hasPermission(permission: string): boolean;

  // =========================================================================
  // Utility Methods
  // =========================================================================

  /**
   * Set return URL for after login
   */
  abstract setReturnUrl(url: string): void;
}
