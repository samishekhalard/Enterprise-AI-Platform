// ==============================================================================
// V008__fix_master_tenant_seed_superuser.cypher
// Fixes master tenant ID mismatch, corrects client ID, seeds superuser,
// and creates missing BELONGS_TO relationship.
//
// Problems Addressed:
// 1. Tenant ID 'master' does not match frontend/PostgreSQL UUID convention
// 2. Config clientId 'ems-client' does not match application.yml 'ems-auth-facade'
// 3. No User nodes exist - role resolution returns empty
// 4. BELONGS_TO relationship documented in UserNode.java but never created
//
// Idempotency:
// - All node operations use MERGE with ON CREATE SET / ON MATCH SET
// - All indexes use IF NOT EXISTS
// - Relationship creation uses MERGE (safe to re-run)
// - Tenant ID migration uses conditional logic to handle both states
//
// Related Documents:
// - /docs/data-models/neo4j-ems-db.md
// - backend/auth-facade/src/main/java/com/ems/auth/graph/entity/UserNode.java
// - backend/auth-facade/src/main/java/com/ems/auth/graph/entity/TenantNode.java
//
// Dependencies:
// - V004__create_default_roles.cypher (SUPER_ADMIN role: Role {name: 'SUPER_ADMIN'})
// - V005__create_master_tenant.cypher (master tenant: Tenant {id: 'master'})
// - V006__create_default_groups.cypher (admin group: Group {id: 'system-administrators'})
//
// Author: DBA Agent
// Date: 2026-02-26
// ==============================================================================

// ------------------------------------------------------------------------------
// SECTION 1: FIX MASTER TENANT ID
// Change Tenant.id from 'master' to UUID '68cd2a56-98c9-4ed4-8534-c299566d5b27'
// and add slug property to preserve the original identifier.
//
// Strategy: MATCH the old-id tenant, update its id to the UUID.
// If the tenant already has the UUID (re-run), the MATCH simply finds nothing
// and no changes are made. Then MERGE on the UUID ensures the node exists.
// ------------------------------------------------------------------------------

// Step 1a: Rename existing 'master' tenant to UUID (only runs if old ID still exists)
MATCH (t:Tenant {id: 'master'})
SET t.id = '68cd2a56-98c9-4ed4-8534-c299566d5b27',
    t.slug = 'master',
    t.updatedAt = datetime();

// Step 1b: Ensure tenant exists with UUID (idempotent - covers re-run or fresh install)
MERGE (t:Tenant {id: '68cd2a56-98c9-4ed4-8534-c299566d5b27'})
ON CREATE SET
    t.domain = 'localhost',
    t.name = 'Master Tenant',
    t.slug = 'master',
    t.active = true,
    t.createdAt = datetime(),
    t.updatedAt = datetime()
ON MATCH SET
    t.slug = coalesce(t.slug, 'master'),
    t.updatedAt = datetime();

// Step 1c: Ensure USES relationship to Keycloak provider exists for the UUID tenant
MATCH (t:Tenant {id: '68cd2a56-98c9-4ed4-8534-c299566d5b27'})
MATCH (p:Provider {name: 'KEYCLOAK'})
MERGE (t)-[:USES]->(p);

// ------------------------------------------------------------------------------
// SECTION 2: FIX CLIENT ID AND DENORMALIZED TENANT ID ON CONFIG NODES
// Update Config.clientId from 'ems-client' to 'ems-auth-facade' to match
// application.yml default: ${KEYCLOAK_CLIENT_ID:ems-auth-facade}
//
// Also update Config.tenantId from 'master' to the UUID for all affected nodes.
// ------------------------------------------------------------------------------

// Step 2a: Fix clientId on master Keycloak config
MATCH (c:Config {clientId: 'ems-client', providerName: 'KEYCLOAK'})
SET c.clientId = 'ems-auth-facade',
    c.updatedAt = datetime();

// Step 2b: Fix denormalized tenantId on all Config nodes still referencing 'master'
MATCH (c:Config {tenantId: 'master'})
SET c.tenantId = '68cd2a56-98c9-4ed4-8534-c299566d5b27',
    c.updatedAt = datetime();

// Step 2c: Re-link CONFIGURED_WITH if tenant was renamed
// (relationship should already exist from V005, but ensure it points to UUID tenant)
MATCH (t:Tenant {id: '68cd2a56-98c9-4ed4-8534-c299566d5b27'})
MATCH (c:Config {tenantId: '68cd2a56-98c9-4ed4-8534-c299566d5b27'})
MERGE (t)-[:CONFIGURED_WITH]->(c);

// ------------------------------------------------------------------------------
// SECTION 3: CREATE SUPERUSER USER NODE
// Seeds the first User node so that role resolution via graph traversal
// returns actual results. Properties match UserNode.java record fields.
//
// Uses MERGE on id to ensure idempotency. ON CREATE SET prevents overwriting
// existing data on re-run.
// ------------------------------------------------------------------------------

MERGE (u:User {id: '00000000-0000-0000-0000-000000000001'})
ON CREATE SET
    u.email = 'superadmin@emsist.local',
    u.firstName = 'Super',
    u.lastName = 'Admin',
    u.tenantId = '68cd2a56-98c9-4ed4-8534-c299566d5b27',
    u.active = true,
    u.emailVerified = true,
    u.externalId = null,
    u.identityProvider = 'keycloak',
    u.lastLoginAt = null,
    u.createdAt = datetime(),
    u.updatedAt = datetime();

// ------------------------------------------------------------------------------
// SECTION 4: CREATE SUPERUSER RELATIONSHIPS
// (User)-[:HAS_ROLE]->(Role {name: 'SUPER_ADMIN'})    -- from V004
// (User)-[:MEMBER_OF]->(Group {id: 'system-administrators'})  -- from V006
// (User)-[:BELONGS_TO]->(Tenant {id: 'a0000000-...'})  -- documented in UserNode.java
//
// All use MERGE for idempotency.
// ------------------------------------------------------------------------------

// Step 4a: Assign SUPER_ADMIN role directly to superuser
MATCH (u:User {id: '00000000-0000-0000-0000-000000000001'})
MATCH (r:Role {name: 'SUPER_ADMIN'})
MERGE (u)-[:HAS_ROLE]->(r);

// Step 4b: Add superuser to system-administrators group
MATCH (u:User {id: '00000000-0000-0000-0000-000000000001'})
MATCH (g:Group {id: 'system-administrators'})
MERGE (u)-[:MEMBER_OF]->(g);

// Step 4c: Create BELONGS_TO relationship to master tenant
// This relationship type is documented in UserNode.java but was never created
// by any prior migration
MATCH (u:User {id: '00000000-0000-0000-0000-000000000001'})
MATCH (t:Tenant {id: '68cd2a56-98c9-4ed4-8534-c299566d5b27'})
MERGE (u)-[:BELONGS_TO]->(t);

// ------------------------------------------------------------------------------
// SECTION 5: COMPOSITE INDEX FOR USER QUERIES
// Supports common query pattern: find active users within a tenant
// Used by AuthGraphRepository.findEffectiveRolesForTenant which filters on
// u.tenantId and u.active
// ------------------------------------------------------------------------------

CREATE INDEX user_tenant_active IF NOT EXISTS
FOR (u:User) ON (u.tenantId, u.active);

// ------------------------------------------------------------------------------
// SECTION 6: CLEAN UP ORPHANED OLD TENANT NODE (if any)
// If the id rename in Section 1 left a duplicate node (should not happen since
// we SET the id in-place), remove the orphan. This is a safety net.
// ------------------------------------------------------------------------------

// Remove any tenant node still carrying the old 'master' id that has no
// relationships (i.e., it was duplicated rather than renamed)
OPTIONAL MATCH (orphan:Tenant {id: 'master'})
WHERE NOT (orphan)--()
DELETE orphan;

// ------------------------------------------------------------------------------
// SECTION 7: MIGRATION MARKER
// ------------------------------------------------------------------------------

MERGE (m:Migration {version: 'V008'})
ON CREATE SET
    m.name = 'fix_master_tenant_seed_superuser',
    m.description = 'Fixes master tenant ID to UUID, corrects client ID to ems-auth-facade, seeds superuser with SUPER_ADMIN role and group membership, creates BELONGS_TO relationship',
    m.appliedAt = datetime(),
    m.fixes = ['tenant-id-mismatch', 'client-id-mismatch', 'missing-superuser', 'missing-belongs-to'];

// ------------------------------------------------------------------------------
// END OF MIGRATION V008
// ------------------------------------------------------------------------------
