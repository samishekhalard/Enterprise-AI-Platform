/**
 * Authentication Data Models
 * Supports Keycloak Auth Facade integration with multi-provider SSO
 */

// ============================================================================
// Authentication Response
// ============================================================================

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  idToken?: string;
  tokenType: 'Bearer';
  expiresIn: number; // Seconds until access token expires
  refreshExpiresIn: number; // Seconds until refresh token expires
  scope: string;
  user: AuthUser;
  mfaRequired?: boolean;
  mfaToken?: string; // Temporary token for MFA flow
}

export interface AuthUser {
  id: string;
  email: string;
  emailVerified: boolean;
  firstName: string;
  lastName: string;
  displayName: string;
  avatar?: string;
  locale: string;
  timezone?: string;
  roles: string[];
  permissions: string[];
  tenantId: string;
  tenantRole: TenantRole;
  authProvider: string;
  lastLogin?: string;
  createdAt: string;
}

export type TenantRole = 'owner' | 'admin' | 'member' | 'viewer' | 'guest';

// ============================================================================
// Login Requests
// ============================================================================

export interface LoginRequest {
  email: string;
  password: string;
  tenantId: string;
  rememberMe?: boolean;
  deviceInfo?: DeviceInfo;
}

export interface SocialLoginRequest {
  provider: SocialProvider;
  tenantId: string;
  redirectUri: string;
  state?: string;
}

export type SocialProvider = 'azure-ad' | 'google' | 'uaepass' | 'saml' | 'oidc';

export interface DeviceInfo {
  deviceId: string;
  deviceType: 'web' | 'mobile' | 'desktop';
  browser: string;
  os: string;
  ipAddress?: string;
  userAgent: string;
}

// ============================================================================
// OAuth / OIDC Callback
// ============================================================================

export interface OAuthCallbackParams {
  code: string;
  state: string;
  error?: string;
  errorDescription?: string;
}

export interface SAMLCallbackParams {
  SAMLResponse: string;
  RelayState?: string;
}

export interface TokenExchangeRequest {
  subjectToken: string;
  subjectTokenType: 'access_token' | 'id_token';
  tenantId: string;
}

// ============================================================================
// MFA (Multi-Factor Authentication)
// ============================================================================

export interface MFASetupRequest {
  method: MFAMethodType;
  phoneNumber?: string; // For SMS
  email?: string; // For Email
}

export interface MFASetupResponse {
  method: MFAMethodType;
  secret?: string; // For TOTP
  qrCodeUri?: string; // For TOTP
  recoveryCodes?: string[]; // Backup codes
  phoneNumber?: string; // Masked phone for SMS
  email?: string; // Masked email
}

export interface MFAVerifyRequest {
  mfaToken: string; // Temporary token from login
  code: string;
  method: MFAMethodType;
  trustDevice?: boolean;
}

export interface MFAVerifyResponse {
  success: boolean;
  authResponse?: AuthResponse; // Returned on success
  attemptsRemaining?: number;
  error?: string;
}

export type MFAMethodType = 'totp' | 'sms' | 'email' | 'webauthn' | 'push';

export interface MFAStatus {
  enabled: boolean;
  methods: MFAMethodStatus[];
  preferredMethod?: MFAMethodType;
}

export interface MFAMethodStatus {
  method: MFAMethodType;
  configured: boolean;
  verified: boolean;
  lastUsed?: string;
}

// ============================================================================
// Password Management
// ============================================================================

export interface PasswordResetRequest {
  email: string;
  tenantId: string;
}

export interface PasswordResetConfirmRequest {
  token: string;
  newPassword: string;
  confirmPassword: string;
}

export interface PasswordChangeRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface PasswordValidationResult {
  valid: boolean;
  errors: PasswordValidationError[];
  strength: PasswordStrength;
}

export interface PasswordValidationError {
  code: string;
  message: string;
}

export type PasswordStrength = 'weak' | 'fair' | 'good' | 'strong' | 'very-strong';

// ============================================================================
// Session Management
// ============================================================================

export interface Session {
  id: string;
  userId: string;
  tenantId: string;
  deviceInfo: DeviceInfo;
  ipAddress: string;
  location?: GeoLocation;
  createdAt: string;
  lastActiveAt: string;
  expiresAt: string;
  isCurrent: boolean;
}

export interface GeoLocation {
  city?: string;
  region?: string;
  country: string;
  countryCode: string;
}

export interface SessionListResponse {
  sessions: Session[];
  currentSessionId: string;
}

// ============================================================================
// Token Management
// ============================================================================

export interface TokenRefreshRequest {
  refreshToken: string;
  tenantId: string;
}

export interface TokenIntrospectionResponse {
  active: boolean;
  scope?: string;
  clientId?: string;
  username?: string;
  tokenType?: string;
  exp?: number;
  iat?: number;
  sub?: string;
  aud?: string;
  iss?: string;
  tenantId?: string;
}

// ============================================================================
// Auth State (for Angular signals)
// ============================================================================

export interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: AuthUser | null;
  accessToken: string | null;
  error: AuthError | null;
  mfaRequired: boolean;
  mfaToken: string | null;
}

export interface AuthError {
  code: AuthErrorCode;
  message: string;
  details?: Record<string, unknown>;
}

export type AuthErrorCode =
  | 'invalid_credentials'
  | 'account_locked'
  | 'account_disabled'
  | 'mfa_required'
  | 'mfa_invalid'
  | 'token_expired'
  | 'token_invalid'
  | 'session_expired'
  | 'tenant_not_found'
  | 'provider_error'
  | 'network_error'
  | 'unknown_error';

// ============================================================================
// Auth Events (for audit logging)
// ============================================================================

export interface AuthEvent {
  id: string;
  type: AuthEventType;
  userId?: string;
  tenantId: string;
  ipAddress: string;
  userAgent: string;
  success: boolean;
  errorCode?: string;
  metadata?: Record<string, unknown>;
  timestamp: string;
}

export type AuthEventType =
  | 'login'
  | 'logout'
  | 'login_failed'
  | 'mfa_setup'
  | 'mfa_verify'
  | 'password_change'
  | 'password_reset_request'
  | 'password_reset_complete'
  | 'session_created'
  | 'session_revoked'
  | 'token_refresh'
  | 'token_revoked';

// ============================================================================
// Constants
// ============================================================================

export const AUTH_STORAGE_KEYS = {
  ACCESS_TOKEN: 'auth_access_token',
  REFRESH_TOKEN: 'auth_refresh_token',
  USER: 'auth_user',
  TENANT_ID: 'auth_tenant_id',
  MFA_TOKEN: 'auth_mfa_token',
  DEVICE_ID: 'auth_device_id'
} as const;

export const AUTH_ENDPOINTS = {
  LOGIN: '/api/v1/auth/login',
  LOGOUT: '/api/v1/auth/logout',
  REFRESH: '/api/v1/auth/refresh',
  SOCIAL: '/api/v1/auth/social',
  MFA_SETUP: '/api/v1/auth/mfa/setup',
  MFA_VERIFY: '/api/v1/auth/mfa/verify',
  PASSWORD_RESET: '/api/v1/auth/password/reset',
  PASSWORD_RESET_CONFIRM: '/api/v1/auth/password/reset/confirm',
  PASSWORD_CHANGE: '/api/v1/auth/password/change',
  SESSIONS: '/api/v1/auth/sessions',
  INTROSPECT: '/api/v1/auth/token/introspect'
} as const;

export const INITIAL_AUTH_STATE: AuthState = {
  isAuthenticated: false,
  isLoading: true,
  user: null,
  accessToken: null,
  error: null,
  mfaRequired: false,
  mfaToken: null
};
