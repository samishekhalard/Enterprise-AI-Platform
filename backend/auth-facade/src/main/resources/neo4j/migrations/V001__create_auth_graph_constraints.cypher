// ==============================================================================
// V001__create_auth_graph_constraints.cypher
// Creates constraints and indexes for auth graph
//
// Related Documents:
// - /docs/data-models/neo4j-ems-db.md
//
// Author: DBA Agent
// Date: 2026-02-25
// ==============================================================================

// ------------------------------------------------------------------------------
// SECTION 1: TENANT CONSTRAINTS AND INDEXES
// ------------------------------------------------------------------------------

// Tenant ID must be unique (primary identifier)
CREATE CONSTRAINT tenant_id IF NOT EXISTS
FOR (t:Tenant) REQUIRE t.id IS UNIQUE;

// Tenant domain must be unique (used for tenant resolution)
CREATE CONSTRAINT tenant_domain IF NOT EXISTS
FOR (t:Tenant) REQUIRE t.domain IS UNIQUE;

// Index for filtering active tenants
CREATE INDEX tenant_active IF NOT EXISTS
FOR (t:Tenant) ON (t.active);

// ------------------------------------------------------------------------------
// SECTION 2: PROVIDER CONSTRAINTS
// ------------------------------------------------------------------------------

// Provider name must be unique (e.g., KEYCLOAK, AUTH0, AZURE_AD)
CREATE CONSTRAINT provider_name IF NOT EXISTS
FOR (p:Provider) REQUIRE p.name IS UNIQUE;

// ------------------------------------------------------------------------------
// SECTION 3: PROTOCOL CONSTRAINTS
// ------------------------------------------------------------------------------

// Protocol type must be unique (OIDC, SAML, LDAP, OAUTH2)
CREATE CONSTRAINT protocol_type IF NOT EXISTS
FOR (proto:Protocol) REQUIRE proto.type IS UNIQUE;

// ------------------------------------------------------------------------------
// SECTION 4: CONFIG CONSTRAINTS AND INDEXES
// ------------------------------------------------------------------------------

// Config ID must be unique (UUID)
CREATE CONSTRAINT config_id IF NOT EXISTS
FOR (c:Config) REQUIRE c.id IS UNIQUE;

// Index for tenant lookup
CREATE INDEX config_tenant IF NOT EXISTS
FOR (c:Config) ON (c.tenantId);

// Index for provider lookup
CREATE INDEX config_provider IF NOT EXISTS
FOR (c:Config) ON (c.providerName);

// Index for enabled/disabled filtering
CREATE INDEX config_enabled IF NOT EXISTS
FOR (c:Config) ON (c.enabled);

// ------------------------------------------------------------------------------
// SECTION 5: USER CONSTRAINTS AND INDEXES
// ------------------------------------------------------------------------------

// User ID must be unique (UUID)
CREATE CONSTRAINT user_id IF NOT EXISTS
FOR (u:User) REQUIRE u.id IS UNIQUE;

// Index for email lookup
CREATE INDEX user_email IF NOT EXISTS
FOR (u:User) ON (u.email);

// Index for tenant filtering
CREATE INDEX user_tenant IF NOT EXISTS
FOR (u:User) ON (u.tenantId);

// Index for external ID lookup (federated users)
CREATE INDEX user_external IF NOT EXISTS
FOR (u:User) ON (u.externalId);

// Composite index for email + tenant (most common lookup)
CREATE INDEX user_email_tenant IF NOT EXISTS
FOR (u:User) ON (u.email, u.tenantId);

// ------------------------------------------------------------------------------
// SECTION 6: GROUP CONSTRAINTS AND INDEXES
// ------------------------------------------------------------------------------

// Group ID must be unique (UUID)
CREATE CONSTRAINT group_id IF NOT EXISTS
FOR (g:Group) REQUIRE g.id IS UNIQUE;

// Index for name lookup
CREATE INDEX group_name IF NOT EXISTS
FOR (g:Group) ON (g.name);

// Index for tenant filtering
CREATE INDEX group_tenant IF NOT EXISTS
FOR (g:Group) ON (g.tenantId);

// Composite index for name + tenant
CREATE INDEX group_name_tenant IF NOT EXISTS
FOR (g:Group) ON (g.name, g.tenantId);

// ------------------------------------------------------------------------------
// SECTION 7: ROLE CONSTRAINTS AND INDEXES
// ------------------------------------------------------------------------------

// Role name must be unique
CREATE CONSTRAINT role_name IF NOT EXISTS
FOR (r:Role) REQUIRE r.name IS UNIQUE;

// Index for tenant filtering
CREATE INDEX role_tenant IF NOT EXISTS
FOR (r:Role) ON (r.tenantId);

// Index for system role filtering
CREATE INDEX role_system IF NOT EXISTS
FOR (r:Role) ON (r.systemRole);

// ------------------------------------------------------------------------------
// SECTION 8: MIGRATION MARKER
// ------------------------------------------------------------------------------

MERGE (m:Migration {version: 'V001'})
ON CREATE SET
    m.name = 'create_auth_graph_constraints',
    m.description = 'Creates constraints and indexes for auth graph',
    m.appliedAt = datetime();

// ------------------------------------------------------------------------------
// END OF MIGRATION V001
// ------------------------------------------------------------------------------
