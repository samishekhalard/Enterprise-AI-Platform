/**
 * Development Environment Configuration
 */
export const environment = {
  production: false,

  // API Configuration
  apiUrl: 'http://localhost:8080',  // API Gateway - routes to all services
  authApiUrl: 'http://localhost:8080', // API Gateway - routes /api/v1/auth/** to auth-facade

  // Keycloak / Auth Facade Configuration
  keycloakUrl: 'http://localhost:8180',
  keycloakRealm: 'master',

  // Default tenant for development
  defaultTenantId: 'dev-tenant-1',
  defaultTenantSlug: 'thinkplus-dev',

  // Feature Flags
  enableDebugLogging: true,
  enableMockData: false, // Disabled - always use real backend
  enableDevTools: true,
  enableUiPreviewBypassAuth: true, // Development only: allow opening protected pages for UI review
  enableAiAssistant: false,

  // Session Configuration
  sessionTimeoutMinutes: 30,
  tokenRefreshIntervalMinutes: 4,

  // OAuth/OIDC Callback URLs
  oauthCallbackUrl: 'http://localhost:4200/auth/callback',
  uaepassCallbackUrl: 'http://localhost:4200/auth/uaepass/callback',
  samlAcsUrl: 'http://localhost:4200/auth/saml/acs',

  // UAE Pass Configuration (Staging)
  uaepass: {
    environment: 'staging' as const,
    authorizationUrl: 'https://stg-id.uaepass.ae/idshub/authorize',
    tokenUrl: 'https://stg-id.uaepass.ae/idshub/token',
    userInfoUrl: 'https://stg-id.uaepass.ae/idshub/userinfo',
    logoutUrl: 'https://stg-id.uaepass.ae/idshub/logout'
  },

  // Version Info
  version: '1.0.0-dev',
  buildDate: new Date().toISOString()
};

export type Environment = typeof environment;
