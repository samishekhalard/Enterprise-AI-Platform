// ==============================================================================
// V002__create_protocols.cypher
// Creates standard authentication protocols
//
// Related Documents:
// - /docs/data-models/neo4j-ems-db.md
//
// Author: DBA Agent
// Date: 2026-02-25
// ==============================================================================

// ------------------------------------------------------------------------------
// SECTION 1: AUTHENTICATION PROTOCOLS
// Using MERGE for idempotency
// ------------------------------------------------------------------------------

// OpenID Connect (OIDC) - Modern standard built on OAuth 2.0
MERGE (oidc:Protocol {type: 'OIDC'})
SET oidc.version = '1.0',
    oidc.displayName = 'OpenID Connect',
    oidc.description = 'Modern authentication standard built on OAuth 2.0';

// SAML 2.0 - Enterprise SSO standard
MERGE (saml:Protocol {type: 'SAML'})
SET saml.version = '2.0',
    saml.displayName = 'SAML 2.0',
    saml.description = 'Security Assertion Markup Language for enterprise SSO';

// LDAP v3 - Directory services
MERGE (ldap:Protocol {type: 'LDAP'})
SET ldap.version = '3',
    ldap.displayName = 'LDAP v3',
    ldap.description = 'Lightweight Directory Access Protocol for directory services';

// OAuth 2.0 - Authorization framework
MERGE (oauth2:Protocol {type: 'OAUTH2'})
SET oauth2.version = '2.0',
    oauth2.displayName = 'OAuth 2.0',
    oauth2.description = 'Authorization framework for social and third-party logins';

// ------------------------------------------------------------------------------
// SECTION 2: MIGRATION MARKER
// ------------------------------------------------------------------------------

MERGE (m:Migration {version: 'V002'})
ON CREATE SET
    m.name = 'create_protocols',
    m.description = 'Creates standard authentication protocols',
    m.appliedAt = datetime();

// ------------------------------------------------------------------------------
// END OF MIGRATION V002
// ------------------------------------------------------------------------------
