// ==============================================================================
// V007__provider_config_extensions.cypher
// Extends Config node with multi-provider authentication properties
// Adds indexes for provider-specific queries and constraints for uniqueness
//
// Related Documents:
// - /docs/lld/auth-providers-lld.md
// - /docs/data-models/provider-config-extensions.md
// - /docs/data-models/neo4j-ems-db.md
//
// Providers Extended:
// - AZURE_AD (Microsoft Entra ID) - OIDC
// - UAE_PASS (UAE Government) - OAuth 2.0
// - LDAP_GENERIC (Active Directory/LDAP) - LDAP v3
// - IBM_IAM (IBM Security Verify) - SAML 2.0
//
// Author: DBA Agent
// Date: 2026-02-25
// ==============================================================================

// ------------------------------------------------------------------------------
// SECTION 1: PROTOCOL UPDATES
// Ensure all required protocols exist with correct metadata
// ------------------------------------------------------------------------------

// OAUTH2 protocol for UAE Pass (distinct from OIDC)
MERGE (p:Protocol {type: 'OAUTH2'})
ON CREATE SET
    p.version = '2.0',
    p.displayName = 'OAuth 2.0',
    p.description = 'Authorization framework for delegated access';

// ------------------------------------------------------------------------------
// SECTION 2: PROVIDER UPDATES
// Update existing providers and add new protocol support
// ------------------------------------------------------------------------------

// Update UAE Pass to support OAUTH2 protocol (not OIDC)
MATCH (uae:Provider {name: 'UAE_PASS'})
MATCH (oauth2:Protocol {type: 'OAUTH2'})
MERGE (uae)-[:SUPPORTS]->(oauth2);

// Remove OIDC support from UAE Pass if exists (UAE Pass uses OAuth2, not OIDC)
MATCH (uae:Provider {name: 'UAE_PASS'})-[r:SUPPORTS]->(oidc:Protocol {type: 'OIDC'})
DELETE r;

// Update IBM_IAM to support SAML protocol
MATCH (ibm:Provider {name: 'IBM_IAM'})
SET ibm.displayName = 'IBM Security Verify',
    ibm.description = 'IBM enterprise identity and access management (SAML 2.0)';

MATCH (ibm:Provider {name: 'IBM_IAM'})
MATCH (saml:Protocol {type: 'SAML'})
MERGE (ibm)-[:SUPPORTS]->(saml);

// Remove OIDC support from IBM_IAM if exists (primary protocol is SAML)
MATCH (ibm:Provider {name: 'IBM_IAM'})-[r:SUPPORTS]->(oidc:Protocol {type: 'OIDC'})
DELETE r;

// ------------------------------------------------------------------------------
// SECTION 3: CONFIG NODE INDEXES
// Create indexes for provider-specific property queries
// All indexes use IF NOT EXISTS for idempotency
// ------------------------------------------------------------------------------

// --- Azure AD Indexes ---
// Index for Azure AD tenant lookup (common query: find configs by Azure tenant)
CREATE INDEX config_azure_tenant_id IF NOT EXISTS
FOR (c:Config) ON (c.azureTenantId);

// Index for allowed domains queries (useful for domain-based provider selection)
// Note: Neo4j does not support indexes on list properties directly
// The allowedDomains will be stored as JSON string for indexing

// --- UAE Pass Indexes ---
// Index for UAE Pass environment lookup (STAGING vs PRODUCTION)
CREATE INDEX config_uaepass_environment IF NOT EXISTS
FOR (c:Config) ON (c.uaePassEnvironment);

// Index for authentication level requirement queries
CREATE INDEX config_uaepass_auth_level IF NOT EXISTS
FOR (c:Config) ON (c.requiredAuthLevel);

// --- LDAP Indexes ---
// Index for LDAP server URL lookup
CREATE INDEX config_ldap_server_url IF NOT EXISTS
FOR (c:Config) ON (c.serverUrl);

// Index for LDAP SSL configuration queries
CREATE INDEX config_ldap_use_ssl IF NOT EXISTS
FOR (c:Config) ON (c.useSsl);

// Index for sync-enabled LDAP configurations
CREATE INDEX config_ldap_sync_enabled IF NOT EXISTS
FOR (c:Config) ON (c.syncEnabled);

// --- SAML/IBM IAM Indexes ---
// Index for SAML metadata URL lookup
CREATE INDEX config_saml_metadata_url IF NOT EXISTS
FOR (c:Config) ON (c.metadataUrl);

// Index for SAML SSO URL lookup
CREATE INDEX config_saml_sso_url IF NOT EXISTS
FOR (c:Config) ON (c.ssoUrl);

// --- General Provider Indexes ---
// Index for protocol-based queries across all configs
CREATE INDEX config_protocol IF NOT EXISTS
FOR (c:Config) ON (c.protocol);

// Composite index for tenant + provider + enabled (most common query pattern)
CREATE INDEX config_tenant_provider_enabled IF NOT EXISTS
FOR (c:Config) ON (c.tenantId, c.providerName, c.enabled);

// ------------------------------------------------------------------------------
// SECTION 4: CONSTRAINTS
// Add uniqueness constraints for critical identifiers
// All constraints use IF NOT EXISTS for idempotency
// ------------------------------------------------------------------------------

// SAML Entity ID must be unique across all configurations
// This is a SAML requirement - each SP has a unique entity ID
CREATE CONSTRAINT config_saml_entity_id_unique IF NOT EXISTS
FOR (c:Config) REQUIRE c.entityId IS UNIQUE;

// ------------------------------------------------------------------------------
// SECTION 5: MIGRATION VERIFICATION
// Log migration completion with a marker node
// ------------------------------------------------------------------------------

// Create migration marker for tracking
MERGE (m:Migration {version: 'V007'})
ON CREATE SET
    m.name = 'provider_config_extensions',
    m.description = 'Extended Config node for multi-provider authentication',
    m.appliedAt = datetime(),
    m.providersAffected = ['AZURE_AD', 'UAE_PASS', 'LDAP_GENERIC', 'IBM_IAM'];

// ------------------------------------------------------------------------------
// END OF MIGRATION V007
// ------------------------------------------------------------------------------
