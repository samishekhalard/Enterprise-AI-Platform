// ============================================================================
// EMS Auth Facade - Tenant Graph Template
// Version: 1.0.0
// Description: Template script for provisioning new tenant Neo4j databases.
//              Applied to each new tenant database during provisioning.
// Author: DBA Agent
// Date: 2026-02-25
// Database: tenant_{slug} database
// Traceability: /docs/lld/graph-per-tenant-lld.md
// ============================================================================
//
// USAGE:
//   This template is executed by TenantProvisioningService when creating
//   a new tenant database. Replace $tenantId and $tenantSlug with actual values.
//
// IDEMPOTENCY:
//   All statements use IF NOT EXISTS or MERGE to ensure safe re-execution.
//
// ============================================================================

// ============================================================================
// 1. USER MANAGEMENT CONSTRAINTS AND INDEXES
// ============================================================================

// User node constraints
CREATE CONSTRAINT user_id IF NOT EXISTS
FOR (u:User) REQUIRE u.id IS UNIQUE;

CREATE CONSTRAINT user_keycloak_id IF NOT EXISTS
FOR (u:User) REQUIRE u.keycloakId IS UNIQUE;

// User indexes for common queries
CREATE INDEX user_email IF NOT EXISTS
FOR (u:User) ON (u.email);

CREATE INDEX user_status IF NOT EXISTS
FOR (u:User) ON (u.status);

CREATE INDEX user_department IF NOT EXISTS
FOR (u:User) ON (u.department);

CREATE INDEX user_employee_type IF NOT EXISTS
FOR (u:User) ON (u.employeeType);

// Device constraints and indexes
CREATE CONSTRAINT device_id IF NOT EXISTS
FOR (d:Device) REQUIRE d.id IS UNIQUE;

CREATE INDEX device_fingerprint IF NOT EXISTS
FOR (d:Device) ON (d.fingerprint);

CREATE INDEX device_trust_level IF NOT EXISTS
FOR (d:Device) ON (d.trustLevel);

// Session constraints and indexes
CREATE CONSTRAINT session_id IF NOT EXISTS
FOR (s:Session) REQUIRE s.id IS UNIQUE;

CREATE INDEX session_status IF NOT EXISTS
FOR (s:Session) ON (s.status);

CREATE INDEX session_expires_at IF NOT EXISTS
FOR (s:Session) ON (s.expiresAt);

// ============================================================================
// 2. RBAC (ROLE-BASED ACCESS CONTROL) CONSTRAINTS AND INDEXES
// ============================================================================

// Role constraints
CREATE CONSTRAINT role_id IF NOT EXISTS
FOR (r:Role) REQUIRE r.id IS UNIQUE;

CREATE INDEX role_name IF NOT EXISTS
FOR (r:Role) ON (r.name);

CREATE INDEX role_is_system IF NOT EXISTS
FOR (r:Role) ON (r.isSystem);

// Group constraints
CREATE CONSTRAINT group_id IF NOT EXISTS
FOR (g:Group) REQUIRE g.id IS UNIQUE;

CREATE INDEX group_name IF NOT EXISTS
FOR (g:Group) ON (g.name);

CREATE INDEX group_is_active IF NOT EXISTS
FOR (g:Group) ON (g.isActive);

// ============================================================================
// 3. AUDIT EVENT CONSTRAINTS AND INDEXES
// ============================================================================

CREATE CONSTRAINT audit_event_id IF NOT EXISTS
FOR (a:AuditEvent) REQUIRE a.id IS UNIQUE;

CREATE INDEX audit_timestamp IF NOT EXISTS
FOR (a:AuditEvent) ON (a.timestamp);

CREATE INDEX audit_event_type IF NOT EXISTS
FOR (a:AuditEvent) ON (a.eventType);

CREATE INDEX audit_event_category IF NOT EXISTS
FOR (a:AuditEvent) ON (a.eventCategory);

CREATE INDEX audit_resource_type IF NOT EXISTS
FOR (a:AuditEvent) ON (a.resourceType);

CREATE INDEX audit_outcome IF NOT EXISTS
FOR (a:AuditEvent) ON (a.outcome);

// Composite index for common audit queries
CREATE INDEX audit_type_timestamp IF NOT EXISTS
FOR (a:AuditEvent) ON (a.eventType, a.timestamp);

// ============================================================================
// 4. AI SERVICES CONSTRAINTS AND INDEXES
// ============================================================================

// Agent constraints
CREATE CONSTRAINT agent_id IF NOT EXISTS
FOR (ag:Agent) REQUIRE ag.id IS UNIQUE;

CREATE INDEX agent_name IF NOT EXISTS
FOR (ag:Agent) ON (ag.name);

CREATE INDEX agent_status IF NOT EXISTS
FOR (ag:Agent) ON (ag.status);

CREATE INDEX agent_provider IF NOT EXISTS
FOR (ag:Agent) ON (ag.provider);

CREATE INDEX agent_is_public IF NOT EXISTS
FOR (ag:Agent) ON (ag.isPublic);

// Agent Category constraints
CREATE CONSTRAINT agent_category_id IF NOT EXISTS
FOR (ac:AgentCategory) REQUIRE ac.id IS UNIQUE;

CREATE INDEX agent_category_name IF NOT EXISTS
FOR (ac:AgentCategory) ON (ac.name);

// Conversation constraints
CREATE CONSTRAINT conversation_id IF NOT EXISTS
FOR (c:Conversation) REQUIRE c.id IS UNIQUE;

CREATE INDEX conversation_status IF NOT EXISTS
FOR (c:Conversation) ON (c.status);

CREATE INDEX conversation_created_at IF NOT EXISTS
FOR (c:Conversation) ON (c.createdAt);

// Message constraints
CREATE CONSTRAINT message_id IF NOT EXISTS
FOR (m:Message) REQUIRE m.id IS UNIQUE;

CREATE INDEX message_role IF NOT EXISTS
FOR (m:Message) ON (m.role);

// Knowledge Source constraints (RAG)
CREATE CONSTRAINT knowledge_source_id IF NOT EXISTS
FOR (ks:KnowledgeSource) REQUIRE ks.id IS UNIQUE;

CREATE INDEX knowledge_source_status IF NOT EXISTS
FOR (ks:KnowledgeSource) ON (ks.status);

CREATE INDEX knowledge_source_type IF NOT EXISTS
FOR (ks:KnowledgeSource) ON (ks.sourceType);

// Chunk constraints with vector index for similarity search
CREATE CONSTRAINT chunk_id IF NOT EXISTS
FOR (ch:Chunk) REQUIRE ch.id IS UNIQUE;

// Vector index for RAG embedding similarity search
// Dimensions: 1536 (OpenAI ada-002 / text-embedding-3-small compatible)
// Similarity: Cosine distance
CREATE VECTOR INDEX chunk_embedding IF NOT EXISTS
FOR (c:Chunk) ON (c.embedding)
OPTIONS {indexConfig: {
    `vector.dimensions`: 1536,
    `vector.similarity_function`: 'cosine'
}};

// ============================================================================
// 5. PROCESS MANAGEMENT (BPMN) CONSTRAINTS AND INDEXES
// ============================================================================

// Process Definition constraints
CREATE CONSTRAINT process_definition_id IF NOT EXISTS
FOR (pd:ProcessDefinition) REQUIRE pd.id IS UNIQUE;

CREATE INDEX process_definition_name IF NOT EXISTS
FOR (pd:ProcessDefinition) ON (pd.name);

CREATE INDEX process_definition_status IF NOT EXISTS
FOR (pd:ProcessDefinition) ON (pd.status);

// Process Element constraints
CREATE CONSTRAINT process_element_id IF NOT EXISTS
FOR (pe:ProcessElement) REQUIRE pe.id IS UNIQUE;

CREATE INDEX process_element_type IF NOT EXISTS
FOR (pe:ProcessElement) ON (pe.elementType);

// Process Instance constraints
CREATE CONSTRAINT process_instance_id IF NOT EXISTS
FOR (pi:ProcessInstance) REQUIRE pi.id IS UNIQUE;

CREATE INDEX process_instance_status IF NOT EXISTS
FOR (pi:ProcessInstance) ON (pi.status);

CREATE INDEX process_instance_started_at IF NOT EXISTS
FOR (pi:ProcessInstance) ON (pi.startedAt);

// ============================================================================
// 6. NOTIFICATION CONSTRAINTS AND INDEXES
// ============================================================================

CREATE CONSTRAINT notification_id IF NOT EXISTS
FOR (n:Notification) REQUIRE n.id IS UNIQUE;

CREATE INDEX notification_status IF NOT EXISTS
FOR (n:Notification) ON (n.status);

CREATE INDEX notification_type IF NOT EXISTS
FOR (n:Notification) ON (n.type);

CREATE INDEX notification_category IF NOT EXISTS
FOR (n:Notification) ON (n.category);

CREATE INDEX notification_created_at IF NOT EXISTS
FOR (n:Notification) ON (n.createdAt);

// Composite index for inbox queries
CREATE INDEX notification_status_created IF NOT EXISTS
FOR (n:Notification) ON (n.status, n.createdAt);

// ============================================================================
// 7. LICENSE CONSTRAINTS AND INDEXES
// ============================================================================

CREATE CONSTRAINT tenant_license_id IF NOT EXISTS
FOR (tl:TenantLicense) REQUIRE tl.id IS UNIQUE;

CREATE INDEX tenant_license_status IF NOT EXISTS
FOR (tl:TenantLicense) ON (tl.status);

CREATE INDEX tenant_license_valid_until IF NOT EXISTS
FOR (tl:TenantLicense) ON (tl.validUntil);

// ============================================================================
// 8. SCHEMA VERSION TRACKING
// ============================================================================

CREATE CONSTRAINT schema_version_id IF NOT EXISTS
FOR (sv:SchemaVersion) REQUIRE sv.id IS UNIQUE;

// ============================================================================
// 9. DEFAULT ROLES (SEED DATA)
// ============================================================================

// Super Admin - Full system access
MERGE (sa:Role {id: 'role-super-admin'})
ON CREATE SET
    sa.name = 'SUPER_ADMIN',
    sa.description = 'Full system access',
    sa.permissions = ['*'],
    sa.isSystem = true,
    sa.createdAt = datetime();

// Tenant Admin - Full tenant access
MERGE (ta:Role {id: 'role-tenant-admin'})
ON CREATE SET
    ta.name = 'TENANT_ADMIN',
    ta.description = 'Full tenant access',
    ta.permissions = ['tenant:*', 'user:*', 'license:*', 'audit:read', 'agent:*', 'process:*'],
    ta.isSystem = true,
    ta.createdAt = datetime();

// Manager - Team management access
MERGE (m:Role {id: 'role-manager'})
ON CREATE SET
    m.name = 'MANAGER',
    m.description = 'Team management access',
    m.permissions = ['user:read', 'report:*', 'process:*', 'agent:read', 'agent:use'],
    m.isSystem = true,
    m.createdAt = datetime();

// User - Standard user access
MERGE (u:Role {id: 'role-user'})
ON CREATE SET
    u.name = 'USER',
    u.description = 'Standard user access',
    u.permissions = ['self:*', 'dashboard:read', 'ai:use', 'process:execute'],
    u.isSystem = true,
    u.createdAt = datetime();

// Guest - Read-only access
MERGE (g:Role {id: 'role-guest'})
ON CREATE SET
    g.name = 'GUEST',
    g.description = 'Read-only guest access',
    g.permissions = ['dashboard:read'],
    g.isSystem = true,
    g.createdAt = datetime();

// ============================================================================
// 10. ROLE INHERITANCE HIERARCHY
// ============================================================================

// Create role inheritance relationships
// TENANT_ADMIN inherits from SUPER_ADMIN permissions scope
MATCH (ta:Role {id: 'role-tenant-admin'})
MATCH (sa:Role {id: 'role-super-admin'})
MERGE (ta)-[:INHERITS_FROM]->(sa);

// MANAGER inherits from TENANT_ADMIN permissions scope
MATCH (m:Role {id: 'role-manager'})
MATCH (ta:Role {id: 'role-tenant-admin'})
MERGE (m)-[:INHERITS_FROM]->(ta);

// USER inherits from MANAGER permissions scope
MATCH (u:Role {id: 'role-user'})
MATCH (m:Role {id: 'role-manager'})
MERGE (u)-[:INHERITS_FROM]->(m);

// GUEST inherits from USER permissions scope
MATCH (g:Role {id: 'role-guest'})
MATCH (u:Role {id: 'role-user'})
MERGE (g)-[:INHERITS_FROM]->(u);

// ============================================================================
// 11. DEFAULT AGENT CATEGORIES (SEED DATA)
// ============================================================================

// General category
MERGE (general:AgentCategory {id: 'category-general'})
ON CREATE SET
    general.name = 'General',
    general.description = 'General purpose AI assistants',
    general.icon = 'robot',
    general.sortOrder = 0,
    general.isActive = true,
    general.createdAt = datetime();

// Productivity category
MERGE (productivity:AgentCategory {id: 'category-productivity'})
ON CREATE SET
    productivity.name = 'Productivity',
    productivity.description = 'Productivity and workflow assistants',
    productivity.icon = 'zap',
    productivity.sortOrder = 1,
    productivity.isActive = true,
    productivity.createdAt = datetime();

// Analysis category
MERGE (analysis:AgentCategory {id: 'category-analysis'})
ON CREATE SET
    analysis.name = 'Analysis',
    analysis.description = 'Data analysis and reporting assistants',
    analysis.icon = 'chart-bar',
    analysis.sortOrder = 2,
    analysis.isActive = true,
    analysis.createdAt = datetime();

// Support category
MERGE (support:AgentCategory {id: 'category-support'})
ON CREATE SET
    support.name = 'Support',
    support.description = 'Customer and internal support assistants',
    support.icon = 'headphones',
    support.sortOrder = 3,
    support.isActive = true,
    support.createdAt = datetime();

// ============================================================================
// 12. SET TENANT SCHEMA VERSION
// ============================================================================

MERGE (sv:SchemaVersion {id: 'current'})
SET sv.version = '1.0.0',
    sv.appliedAt = datetime(),
    sv.migrations = ['V001__tenant_template'],
    sv.tenantSlug = $tenantSlug,
    sv.description = 'Initial tenant graph schema';

// ============================================================================
// 13. VERIFICATION QUERIES
// ============================================================================

// These queries can be used to verify the schema was applied correctly:
//
// Count constraints:
// SHOW CONSTRAINTS YIELD name RETURN count(*) AS constraintCount
//
// Count indexes:
// SHOW INDEXES YIELD name RETURN count(*) AS indexCount
//
// Verify roles:
// MATCH (r:Role) RETURN r.name, r.isSystem
//
// Verify role hierarchy:
// MATCH path = (child:Role)-[:INHERITS_FROM*]->(parent:Role)
// RETURN [n IN nodes(path) | n.name] AS hierarchy
//
// ============================================================================
