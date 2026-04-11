/**
 * Models for the Authentication Source Wizard (US-AC-02).
 *
 * Defines protocol types, wizard step state, form models for each
 * of the 5 supported protocols, attribute/group mappings, sync config,
 * and the composite wizard state.
 */

export type AuthSourceProtocol = 'LDAP' | 'SAML' | 'SCIM' | 'OAUTH2' | 'OIDC';

export type WizardStep = 'protocol' | 'connection' | 'mapping' | 'sync' | 'review';

export const WIZARD_STEPS: readonly WizardStep[] = [
  'protocol',
  'connection',
  'mapping',
  'sync',
  'review',
];

export const WIZARD_STEP_LABELS: Record<WizardStep, string> = {
  protocol: 'Protocol',
  connection: 'Connection',
  mapping: 'Mapping',
  sync: 'Sync & Tenants',
  review: 'Test & Review',
};

export interface ProtocolCard {
  readonly protocol: AuthSourceProtocol;
  readonly label: string;
  readonly description: string;
  readonly useCases: string;
  readonly icon: string;
}

export const PROTOCOL_CARDS: readonly ProtocolCard[] = [
  {
    protocol: 'LDAP',
    label: 'LDAP / Active Directory',
    description: 'Connect to on-premise directory services for user authentication and sync.',
    useCases: 'Corporate AD, OpenLDAP, eDirectory',
    icon: 'phosphorDesktopThin',
  },
  {
    protocol: 'SAML',
    label: 'SAML 2.0',
    description: 'Federate with SAML-compliant identity providers for SSO.',
    useCases: 'ADFS, Shibboleth, Ping Identity',
    icon: 'phosphorShieldThin',
  },
  {
    protocol: 'SCIM',
    label: 'SCIM 2.0',
    description: 'Automate user provisioning and de-provisioning via SCIM protocol.',
    useCases: 'Azure AD SCIM, Okta SCIM, OneLogin',
    icon: 'phosphorArrowsClockwiseThin',
  },
  {
    protocol: 'OAUTH2',
    label: 'OAuth 2.0',
    description: 'Authorize via OAuth 2.0 flows with external authorization servers.',
    useCases: 'Custom OAuth servers, social logins',
    icon: 'phosphorKeyThin',
  },
  {
    protocol: 'OIDC',
    label: 'OpenID Connect',
    description: 'Authenticate via OIDC-compliant providers with auto-discovery.',
    useCases: 'Keycloak, Auth0, Azure AD, Google',
    icon: 'phosphorIdentificationCardThin',
  },
];

// ─── Step 1: Protocol ─────────────────────────────────────────────
export interface ProtocolStepState {
  displayName: string;
  protocol: AuthSourceProtocol | null;
}

// ─── Step 2: Connection (protocol-specific) ────────────────────────
export interface LdapConnectionState {
  serverUrls: string;
  baseDn: string;
  searchFilter: string;
  bindDn: string;
  bindPassword: string;
  tlsMode: 'NONE' | 'STARTTLS' | 'LDAPS';
  tlsMinVersion: 'TLS1.2' | 'TLS1.3';
  connectionPoolSize: number;
  sslCertVerification: boolean;
  referralFollowing: boolean;
}

export interface SamlConnectionState {
  metadataSource: 'url' | 'upload';
  metadataUrl: string;
  metadataXml: string;
  entityId: string;
  assertionConsumerUrl: string;
  ssoUrl: string;
  sloUrl: string;
  nameIdFormat: string;
  signatureAlgorithm: string;
  signRequests: boolean;
  encryptAssertions: boolean;
}

export interface ScimConnectionState {
  endpointUrl: string;
  authMethod: 'BEARER' | 'OAUTH2_CC';
  bearerToken: string;
  userResourcePath: string;
  groupResourcePath: string;
  schemaExtensions: string;
  pageSize: number;
  paginationType: 'INDEX' | 'CURSOR';
  realtimePush: boolean;
  webhookUrl: string;
}

export interface OAuthConnectionState {
  authorizationUrl: string;
  tokenUrl: string;
  userInfoUrl: string;
  clientId: string;
  clientSecret: string;
  scopes: string;
  responseType: string;
  pkceEnabled: boolean;
}

export interface OidcConnectionState {
  discoveryUrl: string;
  clientId: string;
  clientSecret: string;
  scopes: string;
  responseType: string;
  pkceEnabled: boolean;
}

export type ConnectionState =
  | LdapConnectionState
  | SamlConnectionState
  | ScimConnectionState
  | OAuthConnectionState
  | OidcConnectionState;

// ─── Step 3: Mapping ──────────────────────────────────────────────
export interface AttributeMapping {
  sourceAttribute: string;
  targetAttribute: string;
  transform: 'NONE' | 'LOWERCASE' | 'UPPERCASE' | 'TRIM';
}

export interface GroupRoleMapping {
  sourceGroup: string;
  targetRole: string;
}

export interface MappingStepState {
  attributeMappings: AttributeMapping[];
  groupRoleMappings: GroupRoleMapping[];
}

// ─── Step 4: Sync & Tenants ───────────────────────────────────────
export interface SyncConfig {
  syncEnabled: boolean;
  intervalMinutes: number;
  fullSyncCron: string;
  conflictResolution: 'SOURCE_WINS' | 'TARGET_WINS' | 'MANUAL';
}

export interface TenantAssignment {
  tenantId: string;
  tenantName: string;
  assigned: boolean;
}

export interface SyncStepState {
  sync: SyncConfig;
  tenantAssignments: TenantAssignment[];
}

// ─── Step 5: Test & Review ────────────────────────────────────────
export interface TestCheckResult {
  name: string;
  description: string;
  status: 'pending' | 'running' | 'success' | 'failure';
  message?: string;
}

// ─── Composite Wizard State ───────────────────────────────────────
export interface AuthSourceWizardState {
  protocolStep: ProtocolStepState;
  ldapConnection: LdapConnectionState;
  samlConnection: SamlConnectionState;
  scimConnection: ScimConnectionState;
  oauthConnection: OAuthConnectionState;
  oidcConnection: OidcConnectionState;
  mapping: MappingStepState;
  syncStep: SyncStepState;
  testResults: TestCheckResult[];
}

export const DEFAULT_LDAP_CONNECTION: LdapConnectionState = {
  serverUrls: '',
  baseDn: '',
  searchFilter: '(uid={0})',
  bindDn: '',
  bindPassword: '',
  tlsMode: 'STARTTLS',
  tlsMinVersion: 'TLS1.2',
  connectionPoolSize: 5,
  sslCertVerification: true,
  referralFollowing: false,
};

export const DEFAULT_SAML_CONNECTION: SamlConnectionState = {
  metadataSource: 'url',
  metadataUrl: '',
  metadataXml: '',
  entityId: '',
  assertionConsumerUrl: '',
  ssoUrl: '',
  sloUrl: '',
  nameIdFormat: 'urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress',
  signatureAlgorithm: 'RSA_SHA256',
  signRequests: true,
  encryptAssertions: false,
};

export const DEFAULT_SCIM_CONNECTION: ScimConnectionState = {
  endpointUrl: '',
  authMethod: 'BEARER',
  bearerToken: '',
  userResourcePath: '/Users',
  groupResourcePath: '/Groups',
  schemaExtensions: '',
  pageSize: 100,
  paginationType: 'INDEX',
  realtimePush: false,
  webhookUrl: '',
};

export const DEFAULT_OAUTH_CONNECTION: OAuthConnectionState = {
  authorizationUrl: '',
  tokenUrl: '',
  userInfoUrl: '',
  clientId: '',
  clientSecret: '',
  scopes: 'openid profile email',
  responseType: 'code',
  pkceEnabled: true,
};

export const DEFAULT_OIDC_CONNECTION: OidcConnectionState = {
  discoveryUrl: '',
  clientId: '',
  clientSecret: '',
  scopes: 'openid profile email',
  responseType: 'code',
  pkceEnabled: true,
};

export const DEFAULT_MAPPING: MappingStepState = {
  attributeMappings: [
    { sourceAttribute: 'email', targetAttribute: 'email', transform: 'LOWERCASE' },
    { sourceAttribute: 'given_name', targetAttribute: 'firstName', transform: 'NONE' },
    { sourceAttribute: 'family_name', targetAttribute: 'lastName', transform: 'NONE' },
  ],
  groupRoleMappings: [],
};

export const DEFAULT_SYNC: SyncStepState = {
  sync: {
    syncEnabled: true,
    intervalMinutes: 60,
    fullSyncCron: '0 2 * * *',
    conflictResolution: 'SOURCE_WINS',
  },
  tenantAssignments: [],
};

export function createDefaultWizardState(): AuthSourceWizardState {
  return {
    protocolStep: { displayName: '', protocol: null },
    ldapConnection: { ...DEFAULT_LDAP_CONNECTION },
    samlConnection: { ...DEFAULT_SAML_CONNECTION },
    scimConnection: { ...DEFAULT_SCIM_CONNECTION },
    oauthConnection: { ...DEFAULT_OAUTH_CONNECTION },
    oidcConnection: { ...DEFAULT_OIDC_CONNECTION },
    mapping: {
      attributeMappings: DEFAULT_MAPPING.attributeMappings.map((m) => ({ ...m })),
      groupRoleMappings: [],
    },
    syncStep: {
      sync: { ...DEFAULT_SYNC.sync },
      tenantAssignments: [],
    },
    testResults: [],
  };
}
