// ==============================================================================
// V003__create_providers.cypher
// Creates supported identity providers with protocol relationships
//
// Related Documents:
// - /docs/data-models/neo4j-ems-db.md
//
// Author: DBA Agent
// Date: 2026-02-25
// ==============================================================================

// ------------------------------------------------------------------------------
// SECTION 1: KEYCLOAK - Primary self-hosted IdP
// ------------------------------------------------------------------------------

MERGE (p:Provider {name: 'KEYCLOAK'})
SET p.vendor = 'Red Hat',
    p.displayName = 'Keycloak',
    p.iconUrl = '/assets/icons/providers/keycloak.svg',
    p.description = 'Self-hosted open-source identity and access management';

WITH p
MATCH (proto:Protocol {type: 'OIDC'})
MERGE (p)-[:SUPPORTS]->(proto);

WITH 1 as dummy
MATCH (p:Provider {name: 'KEYCLOAK'})
MATCH (proto:Protocol {type: 'SAML'})
MERGE (p)-[:SUPPORTS]->(proto);

// ------------------------------------------------------------------------------
// SECTION 2: AUTH0 - Cloud identity platform
// ------------------------------------------------------------------------------

MERGE (p:Provider {name: 'AUTH0'})
SET p.vendor = 'Okta',
    p.displayName = 'Auth0',
    p.iconUrl = '/assets/icons/providers/auth0.svg',
    p.description = 'Cloud-native identity platform by Okta';

WITH p
MATCH (proto:Protocol {type: 'OIDC'})
MERGE (p)-[:SUPPORTS]->(proto);

// ------------------------------------------------------------------------------
// SECTION 3: OKTA - Enterprise identity
// ------------------------------------------------------------------------------

MERGE (p:Provider {name: 'OKTA'})
SET p.vendor = 'Okta',
    p.displayName = 'Okta',
    p.iconUrl = '/assets/icons/providers/okta.svg',
    p.description = 'Enterprise identity and access management';

WITH p
MATCH (proto:Protocol {type: 'OIDC'})
MERGE (p)-[:SUPPORTS]->(proto);

// ------------------------------------------------------------------------------
// SECTION 4: AZURE_AD - Microsoft Entra ID
// ------------------------------------------------------------------------------

MERGE (p:Provider {name: 'AZURE_AD'})
SET p.vendor = 'Microsoft',
    p.displayName = 'Microsoft Entra ID',
    p.iconUrl = '/assets/icons/providers/azure-ad.svg',
    p.description = 'Microsoft cloud identity and access management';

WITH p
MATCH (proto:Protocol {type: 'OIDC'})
MERGE (p)-[:SUPPORTS]->(proto);

// ------------------------------------------------------------------------------
// SECTION 5: GOOGLE - Google Identity
// ------------------------------------------------------------------------------

MERGE (p:Provider {name: 'GOOGLE'})
SET p.vendor = 'Google',
    p.displayName = 'Google',
    p.iconUrl = '/assets/icons/providers/google.svg',
    p.description = 'Google Workspace and consumer account authentication';

WITH p
MATCH (proto:Protocol {type: 'OIDC'})
MERGE (p)-[:SUPPORTS]->(proto);

// ------------------------------------------------------------------------------
// SECTION 6: MICROSOFT - Consumer accounts
// ------------------------------------------------------------------------------

MERGE (p:Provider {name: 'MICROSOFT'})
SET p.vendor = 'Microsoft',
    p.displayName = 'Microsoft Account',
    p.iconUrl = '/assets/icons/providers/microsoft.svg',
    p.description = 'Consumer Microsoft account authentication';

WITH p
MATCH (proto:Protocol {type: 'OIDC'})
MERGE (p)-[:SUPPORTS]->(proto);

// ------------------------------------------------------------------------------
// SECTION 7: GITHUB - Developer authentication
// ------------------------------------------------------------------------------

MERGE (p:Provider {name: 'GITHUB'})
SET p.vendor = 'Microsoft',
    p.displayName = 'GitHub',
    p.iconUrl = '/assets/icons/providers/github.svg',
    p.description = 'Developer-focused OAuth authentication';

WITH p
MATCH (proto:Protocol {type: 'OAUTH2'})
MERGE (p)-[:SUPPORTS]->(proto);

// ------------------------------------------------------------------------------
// SECTION 8: UAE_PASS - UAE Government digital identity
// ------------------------------------------------------------------------------

MERGE (p:Provider {name: 'UAE_PASS'})
SET p.vendor = 'UAE Government',
    p.displayName = 'UAE Pass',
    p.iconUrl = '/assets/icons/providers/uae-pass.svg',
    p.description = 'UAE national digital identity platform';

WITH p
MATCH (proto:Protocol {type: 'OAUTH2'})
MERGE (p)-[:SUPPORTS]->(proto);

// ------------------------------------------------------------------------------
// SECTION 9: IBM_IAM - IBM Cloud Identity (SAML)
// ------------------------------------------------------------------------------

MERGE (p:Provider {name: 'IBM_IAM'})
SET p.vendor = 'IBM',
    p.displayName = 'IBM Security Verify',
    p.iconUrl = '/assets/icons/providers/ibm.svg',
    p.description = 'IBM enterprise identity and access management (SAML 2.0)';

WITH p
MATCH (proto:Protocol {type: 'SAML'})
MERGE (p)-[:SUPPORTS]->(proto);

// ------------------------------------------------------------------------------
// SECTION 10: SAML_GENERIC - Generic SAML provider
// ------------------------------------------------------------------------------

MERGE (p:Provider {name: 'SAML_GENERIC'})
SET p.vendor = 'Generic',
    p.displayName = 'SAML Provider',
    p.iconUrl = '/assets/icons/providers/saml.svg',
    p.description = 'Generic SAML 2.0 identity provider';

WITH p
MATCH (proto:Protocol {type: 'SAML'})
MERGE (p)-[:SUPPORTS]->(proto);

// ------------------------------------------------------------------------------
// SECTION 11: LDAP_GENERIC - LDAP/Active Directory
// ------------------------------------------------------------------------------

MERGE (p:Provider {name: 'LDAP_GENERIC'})
SET p.vendor = 'Generic',
    p.displayName = 'LDAP / Active Directory',
    p.iconUrl = '/assets/icons/providers/ldap.svg',
    p.description = 'LDAP or Active Directory server';

WITH p
MATCH (proto:Protocol {type: 'LDAP'})
MERGE (p)-[:SUPPORTS]->(proto);

// ------------------------------------------------------------------------------
// SECTION 12: MIGRATION MARKER
// ------------------------------------------------------------------------------

MERGE (m:Migration {version: 'V003'})
ON CREATE SET
    m.name = 'create_providers',
    m.description = 'Creates supported identity providers with protocol relationships',
    m.appliedAt = datetime();

// ------------------------------------------------------------------------------
// END OF MIGRATION V003
// ------------------------------------------------------------------------------
