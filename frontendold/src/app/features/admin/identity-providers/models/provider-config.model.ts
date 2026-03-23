/**
 * Identity Provider Configuration Models
 * For Dynamic Identity Broker Management UI
 */

// ============================================================================
// Core Types
// ============================================================================

export type Protocol = 'OIDC' | 'SAML' | 'LDAP' | 'OAUTH2';

export type ProviderType =
  | 'KEYCLOAK'
  | 'AUTH0'
  | 'OKTA'
  | 'AZURE_AD'
  | 'UAE_PASS'
  | 'IBM_IAM'
  | 'LDAP_SERVER'
  | 'CUSTOM';

export type ProviderStatus = 'active' | 'inactive' | 'pending' | 'error';

// ============================================================================
// Provider Configuration
// ============================================================================

export interface ProviderConfig {
  id?: string;
  providerName: string;
  providerType: ProviderType;
  protocol: Protocol;
  displayName: string;
  enabled: boolean;
  status?: ProviderStatus;

  // OIDC/OAuth2 fields
  clientId?: string;
  clientSecret?: string;
  discoveryUrl?: string;
  authorizationUrl?: string;
  tokenUrl?: string;
  userInfoUrl?: string;
  jwksUrl?: string;
  scopes?: string[];
  responseType?: string;
  pkceEnabled?: boolean;

  // SAML fields
  metadataUrl?: string;
  entityId?: string;
  acsUrl?: string;
  sloUrl?: string;
  certificate?: string;
  privateKey?: string;
  signRequests?: boolean;
  wantAssertionsSigned?: boolean;
  nameIdFormat?: string;
  attributeMapping?: SAMLAttributeMapping;

  // LDAP fields
  serverUrl?: string;
  port?: number;
  bindDn?: string;
  bindPassword?: string;
  userSearchBase?: string;
  userSearchFilter?: string;
  groupSearchBase?: string;
  groupSearchFilter?: string;
  useSsl?: boolean;
  useTls?: boolean;
  connectionTimeout?: number;
  readTimeout?: number;

  // Common / Advanced
  idpHint?: string;
  iconUrl?: string;
  sortOrder?: number;
  allowedDomains?: string[];
  defaultRoles?: string[];
  groupMappings?: GroupMapping[];
  customAttributes?: Record<string, string>;

  // Metadata
  createdAt?: string;
  updatedAt?: string;
  lastTestedAt?: string;
  testResult?: 'success' | 'failure' | 'pending';
}

// ============================================================================
// Supporting Types
// ============================================================================

export interface SAMLAttributeMapping {
  email: string;
  firstName: string;
  lastName: string;
  displayName?: string;
  groups?: string;
  roles?: string;
}

export interface GroupMapping {
  externalGroup: string;
  internalRole: string;
}

// ============================================================================
// Provider Template
// ============================================================================

export interface ProviderTemplate {
  type: ProviderType;
  name: string;
  description: string;
  icon: string;
  supportedProtocols: Protocol[];
  defaultConfig: Partial<ProviderConfig>;
}

// ============================================================================
// Form Field Configuration
// ============================================================================

export interface FormFieldConfig {
  name: keyof ProviderConfig;
  label: string;
  type: 'text' | 'password' | 'url' | 'number' | 'textarea' | 'select' | 'checkbox' | 'tags';
  placeholder?: string;
  hint?: string;
  required?: boolean;
  validators?: string[];
  options?: { value: string; label: string }[];
  protocols?: Protocol[]; // Only show for these protocols
  providerTypes?: ProviderType[]; // Only show for these provider types
  section?: 'basic' | 'protocol' | 'advanced';
}

// ============================================================================
// API Response Types
// ============================================================================

export interface ProviderConfigResponse {
  provider: ProviderConfig;
  success: boolean;
  message?: string;
}

export interface ProviderListResponse {
  providers: ProviderConfig[];
  total: number;
  page: number;
  pageSize: number;
}

export interface TestConnectionResponse {
  success: boolean;
  message: string;
  details?: {
    discoveryUrl?: string;
    issuer?: string;
    supportedScopes?: string[];
    endpoints?: Record<string, string>;
  };
  error?: string;
}

// ============================================================================
// Factory Functions
// ============================================================================

export function createEmptyProviderConfig(): ProviderConfig {
  return {
    providerName: '',
    providerType: 'CUSTOM',
    protocol: 'OIDC',
    displayName: '',
    enabled: false,
    scopes: ['openid', 'profile', 'email'],
    pkceEnabled: true,
    signRequests: true,
    wantAssertionsSigned: true,
    useSsl: true,
    connectionTimeout: 5000,
    readTimeout: 10000,
    sortOrder: 0
  };
}

export function createProviderFromTemplate(template: ProviderTemplate): ProviderConfig {
  return {
    ...createEmptyProviderConfig(),
    providerType: template.type,
    protocol: template.supportedProtocols[0],
    ...template.defaultConfig
  };
}

// ============================================================================
// Validation Helpers
// ============================================================================

export function getRequiredFieldsForProtocol(protocol: Protocol): (keyof ProviderConfig)[] {
  const common: (keyof ProviderConfig)[] = ['providerName', 'displayName', 'protocol'];

  switch (protocol) {
    case 'OIDC':
      return [...common, 'clientId', 'discoveryUrl'];
    case 'OAUTH2':
      return [...common, 'clientId', 'authorizationUrl', 'tokenUrl'];
    case 'SAML':
      return [...common, 'entityId', 'metadataUrl'];
    case 'LDAP':
      return [...common, 'serverUrl', 'bindDn', 'userSearchBase', 'userSearchFilter'];
    default:
      return common;
  }
}

export function isValidProviderConfig(config: ProviderConfig): boolean {
  const requiredFields = getRequiredFieldsForProtocol(config.protocol);
  return requiredFields.every(field => {
    const value = config[field];
    return value !== undefined && value !== null && value !== '';
  });
}
