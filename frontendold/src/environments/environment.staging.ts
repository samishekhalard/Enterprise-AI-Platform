/**
 * Staging Environment Configuration
 *
 * Used when the frontend runs inside Docker alongside the backend services.
 * API requests are proxied by nginx to the api-gateway container.
 */
export const environment = {
  production: true,

  // API Configuration - nginx proxies /api/ to api-gateway:8080
  apiUrl: '',  // Empty string = same origin, nginx handles proxying
  authApiUrl: '',

  // Keycloak / Auth Facade Configuration
  // In staging Docker, Keycloak is accessible via host port 8180
  keycloakUrl: 'http://localhost:18180',
  keycloakRealm: 'master',

  // Default tenant for staging (master tenant)
  defaultTenantId: 'tenant-master',
  defaultTenantSlug: 'master',

  // Feature Flags
  enableDebugLogging: true,
  enableMockData: false,
  enableDevTools: false,
  enableAiAssistant: false,

  // Session Configuration
  sessionTimeoutMinutes: 30,
  tokenRefreshIntervalMinutes: 4,

  // OAuth/OIDC Callback URLs
  oauthCallbackUrl: 'http://localhost:14200/auth/callback',
  uaepassCallbackUrl: 'http://localhost:14200/auth/uaepass/callback',
  samlAcsUrl: 'http://localhost:14200/auth/saml/acs',

  // UAE Pass Configuration (Staging)
  uaepass: {
    environment: 'staging' as const,
    authorizationUrl: 'https://stg-id.uaepass.ae/idshub/authorize',
    tokenUrl: 'https://stg-id.uaepass.ae/idshub/token',
    userInfoUrl: 'https://stg-id.uaepass.ae/idshub/userinfo',
    logoutUrl: 'https://stg-id.uaepass.ae/idshub/logout'
  },

  // Version Info
  version: '1.0.0-staging',
  buildDate: new Date().toISOString()
};

export type Environment = typeof environment;
