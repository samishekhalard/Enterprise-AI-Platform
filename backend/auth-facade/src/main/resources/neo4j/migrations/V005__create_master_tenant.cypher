// ==============================================================================
// V005__create_master_tenant.cypher
// Creates the master tenant with default Keycloak configuration
//
// Note: Client secret should be configured via environment variable
// The placeholder 'ENC(configure-via-env)' indicates Jasypt encryption required
//
// Related Documents:
// - /docs/data-models/neo4j-ems-db.md
//
// Author: DBA Agent
// Date: 2026-02-25
// ==============================================================================

// ------------------------------------------------------------------------------
// SECTION 1: CREATE MASTER TENANT
// ------------------------------------------------------------------------------

MERGE (t:Tenant {id: 'master'})
SET t.domain = 'localhost',
    t.name = 'Master Tenant',
    t.active = true,
    t.createdAt = datetime(),
    t.updatedAt = datetime();

// ------------------------------------------------------------------------------
// SECTION 2: LINK MASTER TENANT TO KEYCLOAK PROVIDER
// ------------------------------------------------------------------------------

MATCH (t:Tenant {id: 'master'})
MATCH (p:Provider {name: 'KEYCLOAK'})
MERGE (t)-[:USES]->(p);

// ------------------------------------------------------------------------------
// SECTION 3: CREATE DEFAULT KEYCLOAK CONFIGURATION
// Note: Only create if config doesn't exist (using MERGE with id based on tenant+provider)
// ------------------------------------------------------------------------------

MATCH (t:Tenant {id: 'master'})
MATCH (p:Provider {name: 'KEYCLOAK'})
// Check if config already exists for this tenant/provider combination
OPTIONAL MATCH (t)-[:CONFIGURED_WITH]->(existing:Config {providerName: 'KEYCLOAK'})
WITH t, p, existing
WHERE existing IS NULL
CREATE (c:Config {
    id: randomUUID(),
    tenantId: 'master',
    providerName: 'KEYCLOAK',
    displayName: 'Master Keycloak',
    protocol: 'OIDC',
    clientId: 'ems-client',
    clientSecretEncrypted: 'ENC(configure-via-env)',
    discoveryUrl: 'http://localhost:8180/realms/master/.well-known/openid-configuration',
    authorizationUrl: 'http://localhost:8180/realms/master/protocol/openid-connect/auth',
    tokenUrl: 'http://localhost:8180/realms/master/protocol/openid-connect/token',
    userInfoUrl: 'http://localhost:8180/realms/master/protocol/openid-connect/userinfo',
    jwksUrl: 'http://localhost:8180/realms/master/protocol/openid-connect/certs',
    issuerUrl: 'http://localhost:8180/realms/master',
    scopes: ['openid', 'profile', 'email'],
    enabled: true,
    priority: 1,
    trustEmail: true,
    storeToken: false,
    linkExistingAccounts: true,
    createdAt: datetime(),
    updatedAt: datetime()
})
CREATE (t)-[:CONFIGURED_WITH]->(c)
CREATE (p)-[:HAS_CONFIG]->(c);

// ------------------------------------------------------------------------------
// SECTION 4: MIGRATION MARKER
// ------------------------------------------------------------------------------

MERGE (m:Migration {version: 'V005'})
ON CREATE SET
    m.name = 'create_master_tenant',
    m.description = 'Creates the master tenant with default Keycloak configuration',
    m.appliedAt = datetime();

// ------------------------------------------------------------------------------
// END OF MIGRATION V005
// ------------------------------------------------------------------------------
