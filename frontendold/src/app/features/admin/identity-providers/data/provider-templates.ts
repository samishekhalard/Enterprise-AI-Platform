import { ProviderTemplate, Protocol } from '../models/provider-config.model';

/**
 * Pre-configured templates for common Identity Providers
 * These templates provide sensible defaults and help users configure providers quickly
 */
export const PROVIDER_TEMPLATES: ProviderTemplate[] = [
  {
    type: 'KEYCLOAK',
    name: 'Keycloak',
    description: 'Open source identity and access management solution',
    icon: 'assets/icons/providers/keycloak.svg',
    supportedProtocols: ['OIDC', 'SAML'],
    defaultConfig: {
      scopes: ['openid', 'profile', 'email', 'roles'],
      pkceEnabled: true,
      responseType: 'code',
      signRequests: true,
      wantAssertionsSigned: true,
      attributeMapping: {
        email: 'email',
        firstName: 'given_name',
        lastName: 'family_name',
        displayName: 'name',
        groups: 'groups',
        roles: 'realm_roles'
      }
    }
  },
  {
    type: 'AUTH0',
    name: 'Auth0',
    description: 'Flexible, drop-in solution to add authentication',
    icon: 'assets/icons/providers/auth0.svg',
    supportedProtocols: ['OIDC'],
    defaultConfig: {
      scopes: ['openid', 'profile', 'email'],
      pkceEnabled: true,
      responseType: 'code'
    }
  },
  {
    type: 'OKTA',
    name: 'Okta',
    description: 'Enterprise identity platform for workforce identity',
    icon: 'assets/icons/providers/okta.svg',
    supportedProtocols: ['OIDC', 'SAML'],
    defaultConfig: {
      scopes: ['openid', 'profile', 'email', 'groups'],
      pkceEnabled: true,
      responseType: 'code',
      signRequests: true,
      wantAssertionsSigned: true,
      attributeMapping: {
        email: 'email',
        firstName: 'firstName',
        lastName: 'lastName',
        displayName: 'displayName',
        groups: 'groups'
      }
    }
  },
  {
    type: 'AZURE_AD',
    name: 'Azure AD / Entra ID',
    description: 'Microsoft cloud identity service',
    icon: 'assets/icons/providers/azure-ad.svg',
    supportedProtocols: ['OIDC', 'SAML'],
    defaultConfig: {
      scopes: ['openid', 'profile', 'email', 'User.Read'],
      pkceEnabled: true,
      responseType: 'code',
      signRequests: true,
      wantAssertionsSigned: true,
      attributeMapping: {
        email: 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress',
        firstName: 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/givenname',
        lastName: 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/surname',
        displayName: 'http://schemas.microsoft.com/identity/claims/displayname',
        groups: 'http://schemas.microsoft.com/ws/2008/06/identity/claims/groups'
      }
    }
  },
  {
    type: 'UAE_PASS',
    name: 'UAE Pass',
    description: 'UAE national digital identity platform',
    icon: 'assets/icons/providers/uaepass.svg',
    supportedProtocols: ['OIDC'],
    defaultConfig: {
      scopes: [
        'urn:uae:digitalid:profile:general',
        'urn:uae:digitalid:profile:general:email',
        'urn:uae:digitalid:profile:general:mobile'
      ],
      pkceEnabled: false,
      responseType: 'code',
      customAttributes: {
        acrValues: 'urn:safelayer:tws:policies:authentication:level:low',
        language: 'en'
      }
    }
  },
  {
    type: 'IBM_IAM',
    name: 'IBM IAM',
    description: 'IBM Cloud Identity and Access Management',
    icon: 'assets/icons/providers/ibm-iam.svg',
    supportedProtocols: ['OIDC', 'SAML'],
    defaultConfig: {
      scopes: ['openid', 'profile', 'email'],
      pkceEnabled: true,
      responseType: 'code',
      signRequests: true,
      wantAssertionsSigned: true
    }
  },
  {
    type: 'LDAP_SERVER',
    name: 'LDAP / Active Directory',
    description: 'Connect to LDAP or Active Directory servers',
    icon: 'assets/icons/providers/ldap.svg',
    supportedProtocols: ['LDAP'],
    defaultConfig: {
      port: 389,
      useSsl: false,
      useTls: true,
      connectionTimeout: 5000,
      readTimeout: 10000,
      userSearchFilter: '(&(objectClass=person)(uid={0}))',
      groupSearchFilter: '(&(objectClass=groupOfNames)(member={0}))'
    }
  },
  {
    type: 'CUSTOM',
    name: 'Custom Provider',
    description: 'Configure a custom identity provider manually',
    icon: 'assets/icons/providers/custom.svg',
    supportedProtocols: ['OIDC', 'SAML', 'OAUTH2', 'LDAP'],
    defaultConfig: {
      scopes: ['openid', 'profile', 'email'],
      pkceEnabled: true
    }
  }
];

/**
 * Get template by provider type
 */
export function getTemplateByType(type: string): ProviderTemplate | undefined {
  return PROVIDER_TEMPLATES.find(t => t.type === type);
}

/**
 * Get templates that support a specific protocol
 */
export function getTemplatesByProtocol(protocol: Protocol): ProviderTemplate[] {
  return PROVIDER_TEMPLATES.filter(t => t.supportedProtocols.includes(protocol));
}

/**
 * Protocol options for select dropdowns
 */
export const PROTOCOL_OPTIONS: { value: Protocol; label: string; description: string }[] = [
  {
    value: 'OIDC',
    label: 'OpenID Connect',
    description: 'Modern authentication protocol built on OAuth 2.0'
  },
  {
    value: 'OAUTH2',
    label: 'OAuth 2.0',
    description: 'Authorization framework for API access'
  },
  {
    value: 'SAML',
    label: 'SAML 2.0',
    description: 'Enterprise single sign-on protocol'
  },
  {
    value: 'LDAP',
    label: 'LDAP',
    description: 'Directory service protocol for user lookup'
  }
];

/**
 * Common scopes by protocol
 */
export const COMMON_SCOPES: Record<Protocol, string[]> = {
  OIDC: ['openid', 'profile', 'email', 'address', 'phone', 'offline_access'],
  OAUTH2: ['read', 'write', 'admin', 'openid', 'profile', 'email'],
  SAML: [],
  LDAP: []
};

/**
 * SAML Name ID formats
 */
export const SAML_NAME_ID_FORMATS = [
  { value: 'urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress', label: 'Email Address' },
  { value: 'urn:oasis:names:tc:SAML:1.1:nameid-format:unspecified', label: 'Unspecified' },
  { value: 'urn:oasis:names:tc:SAML:2.0:nameid-format:persistent', label: 'Persistent' },
  { value: 'urn:oasis:names:tc:SAML:2.0:nameid-format:transient', label: 'Transient' }
];
