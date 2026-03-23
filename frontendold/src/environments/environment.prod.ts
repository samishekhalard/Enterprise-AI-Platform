/**
 * Production Environment Configuration
 */
export const environment = {
  production: true,

  // API Configuration
  apiUrl: 'https://api.thinkplus.ae',

  // Keycloak / Auth Facade Configuration
  keycloakUrl: 'https://auth.thinkplus.ae',
  keycloakRealm: 'master',

  // Default tenant for production (master tenant)
  defaultTenantId: 'thinkplus-master',
  defaultTenantSlug: 'thinkplus',

  // Feature Flags
  enableDebugLogging: false,
  enableMockData: false,
  enableDevTools: false,
  enableAiAssistant: false,

  // Session Configuration
  sessionTimeoutMinutes: 30,
  tokenRefreshIntervalMinutes: 4,

  // OAuth/OIDC Callback URLs (will be dynamically set based on tenant domain)
  oauthCallbackUrl: '/auth/callback',
  uaepassCallbackUrl: '/auth/uaepass/callback',
  samlAcsUrl: '/auth/saml/acs',

  // UAE Pass Configuration (Production)
  uaepass: {
    environment: 'production' as const,
    authorizationUrl: 'https://id.uaepass.ae/idshub/authorize',
    tokenUrl: 'https://id.uaepass.ae/idshub/token',
    userInfoUrl: 'https://id.uaepass.ae/idshub/userinfo',
    logoutUrl: 'https://id.uaepass.ae/idshub/logout'
  },

  // Version Info
  version: '1.0.0',
  buildDate: new Date().toISOString()
};

export type Environment = typeof environment;
