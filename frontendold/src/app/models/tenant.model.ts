/**
 * Enterprise Multi-Tenant Data Models
 * Supports custom domains, dynamic branding, and multi-provider authentication
 */

// ============================================================================
// Core Tenant Model
// ============================================================================

export interface EnhancedTenant {
  id: string;
  uuid: string;
  fullName: string;
  shortName: string;
  slug: string;

  // Classification
  tenantType: TenantType;
  tier: TenantTier;
  status: TenantStatus;

  // Custom Domains
  domains: TenantDomain[];
  primaryDomain?: string;

  // Authentication
  authProviders: AuthProviderConfig[];
  defaultAuthProvider?: string;

  // Branding
  branding: TenantBranding;

  // Security
  sessionConfig: TenantSessionConfig;
  mfaConfig: TenantMFAConfig;

  // Metadata
  createdAt: string;
  updatedAt: string;
}

export type TenantType = 'master' | 'dominant' | 'regular';
export type TenantTier = 'free' | 'standard' | 'professional' | 'enterprise';
export type TenantStatus = 'active' | 'locked' | 'suspended' | 'pending';

// ============================================================================
// Custom Domain Management
// ============================================================================

export interface TenantDomain {
  id: string;
  domain: string;
  isPrimary: boolean;
  isVerified: boolean;
  verificationToken?: string;
  verificationMethod: DomainVerificationMethod;
  sslStatus: SSLStatus;
  createdAt: string;
  verifiedAt?: string;
}

export type DomainVerificationMethod = 'dns-txt' | 'dns-cname' | 'file';
export type SSLStatus = 'pending' | 'provisioning' | 'active' | 'failed' | 'expired';

// ============================================================================
// Branding Configuration
// ============================================================================

export interface TenantBranding {
  // Colors
  primaryColor: string;
  primaryColorDark: string;
  secondaryColor: string;
  accentColor?: string;

  // Logo & Images
  logoUrl: string;
  logoUrlDark?: string;
  faviconUrl: string;
  loginBackgroundUrl?: string;

  // Typography
  fontFamily: string;
  headingFontFamily?: string;

  // Custom Styling
  customCss?: string;

  // Login Page
  loginTitle?: string;
  loginSubtitle?: string;
  supportEmail?: string;
  supportPhone?: string;
}

// ============================================================================
// Session Configuration
// ============================================================================

export interface TenantSessionConfig {
  // Session Timeouts (in minutes)
  accessTokenLifetime: number;  // Default: 5
  refreshTokenLifetime: number; // Default: 30
  idleTimeout: number;          // Default: 15
  absoluteTimeout: number;      // Default: 480 (8 hours)

  // Device Management
  maxConcurrentSessions: number;
  allowMultipleDevices: boolean;
  requireDeviceApproval: boolean;

  // Security
  enforceIpBinding: boolean;
  allowRememberMe: boolean;
  rememberMeDuration: number; // Days
}

// ============================================================================
// MFA Configuration
// ============================================================================

export interface TenantMFAConfig {
  enabled: boolean;
  required: boolean;
  allowedMethods: MFAMethod[];
  defaultMethod?: MFAMethod;
  gracePeriodDays: number; // Days before MFA is enforced for new users
  rememberDeviceDays: number; // Days to trust a device after MFA
}

export type MFAMethod = 'totp' | 'sms' | 'email' | 'webauthn' | 'push';

// ============================================================================
// Auth Provider Configuration (re-exported from auth.model.ts)
// ============================================================================

export interface AuthProviderConfig {
  id: string;
  type: AuthProviderType;
  name: string;
  displayName: string;
  icon?: string;
  isEnabled: boolean;
  isPrimary: boolean;
  sortOrder: number;
  config: AuthProviderSettings;
}

export type AuthProviderType = 'local' | 'azure-ad' | 'saml' | 'oidc' | 'ldap' | 'uaepass' | 'google';

export type AuthProviderSettings =
  | LocalAuthConfig
  | AzureADConfig
  | SAMLConfig
  | OIDCConfig
  | LDAPConfig
  | UAEPassConfig
  | GoogleConfig;

// ============================================================================
// Provider-Specific Configurations
// ============================================================================

export interface LocalAuthConfig {
  type: 'local';
  allowRegistration: boolean;
  requireEmailVerification: boolean;
  passwordPolicy: PasswordPolicy;
}

export interface PasswordPolicy {
  minLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSpecialChars: boolean;
  preventReuse: number; // Number of previous passwords to check
  expirationDays: number; // 0 = never expires
}

export interface AzureADConfig {
  type: 'azure-ad';
  tenantId: string;
  clientId: string;
  clientSecret?: string; // Stored encrypted on backend
  redirectUri: string;
  scopes: string[];
  allowedDomains?: string[]; // Restrict to specific email domains
}

export interface SAMLConfig {
  type: 'saml';
  entityId: string;
  ssoUrl: string;
  sloUrl?: string;
  certificate: string;
  signRequests: boolean;
  wantAssertionsSigned: boolean;
  attributeMapping: SAMLAttributeMapping;
}

export interface SAMLAttributeMapping {
  email: string;
  firstName: string;
  lastName: string;
  groups?: string;
}

export interface OIDCConfig {
  type: 'oidc';
  issuer: string;
  clientId: string;
  clientSecret?: string;
  redirectUri: string;
  scopes: string[];
  discoveryUrl?: string;
  jwksUri?: string;
}

export interface LDAPConfig {
  type: 'ldap';
  serverUrl: string;
  baseDn: string;
  bindDn: string;
  bindPassword?: string;
  userSearchFilter: string;
  groupSearchFilter?: string;
  useSsl: boolean;
  connectionTimeout: number;
}

export interface UAEPassConfig {
  type: 'uaepass';
  clientId: string;
  clientSecret?: string; // Stored encrypted on backend
  redirectUri: string;
  environment: 'staging' | 'production';
  scopes: UAEPassScope[];
  acrValues: UAEPassACRLevel;
  language: 'en' | 'ar';
}

export type UAEPassScope =
  | 'urn:uae:digitalid:profile:general'
  | 'urn:uae:digitalid:profile:general:profileType'
  | 'urn:uae:digitalid:profile:general:email'
  | 'urn:uae:digitalid:profile:general:mobile';

export type UAEPassACRLevel =
  | 'urn:safelayer:tws:policies:authentication:level:low'
  | 'urn:safelayer:tws:policies:authentication:level:medium'
  | 'urn:safelayer:tws:policies:authentication:level:high';

export interface GoogleConfig {
  type: 'google';
  clientId: string;
  clientSecret?: string;
  redirectUri: string;
  scopes: string[];
  hostedDomain?: string; // Restrict to specific Google Workspace domain
}

// ============================================================================
// Default Values
// ============================================================================

export const DEFAULT_SESSION_CONFIG: TenantSessionConfig = {
  accessTokenLifetime: 5,
  refreshTokenLifetime: 30,
  idleTimeout: 15,
  absoluteTimeout: 480,
  maxConcurrentSessions: 5,
  allowMultipleDevices: true,
  requireDeviceApproval: false,
  enforceIpBinding: false,
  allowRememberMe: true,
  rememberMeDuration: 30
};

export const DEFAULT_MFA_CONFIG: TenantMFAConfig = {
  enabled: true,
  required: false,
  allowedMethods: ['totp', 'email'],
  defaultMethod: 'totp',
  gracePeriodDays: 7,
  rememberDeviceDays: 30
};

export const DEFAULT_BRANDING: TenantBranding = {
  primaryColor: '#047481',
  primaryColorDark: '#035a64',
  secondaryColor: '#64748b',
  logoUrl: '/assets/images/logo.svg',
  faviconUrl: '/assets/favicon.ico',
  fontFamily: "'Gotham Rounded', 'Nunito', -apple-system, BlinkMacSystemFont, sans-serif"
};

export const DEFAULT_PASSWORD_POLICY: PasswordPolicy = {
  minLength: 8,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: false,
  preventReuse: 5,
  expirationDays: 90
};
