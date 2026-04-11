// ==============================================================================
// V006__create_default_groups.cypher
// Creates default system groups with role assignments
//
// System Groups:
// - Administrators - ADMIN role
// - Users - USER role
// - Viewers - VIEWER role
//
// Related Documents:
// - /docs/data-models/neo4j-ems-db.md
//
// Author: DBA Agent
// Date: 2026-02-25
// ==============================================================================

// ------------------------------------------------------------------------------
// SECTION 1: ADMINISTRATORS GROUP
// ------------------------------------------------------------------------------

MERGE (g:Group {id: 'system-administrators'})
SET g.name = 'Administrators',
    g.displayName = 'System Administrators',
    g.description = 'System administrators with full access',
    g.tenantId = null,
    g.systemGroup = true,
    g.createdAt = datetime(),
    g.updatedAt = datetime();

// Assign ADMIN role to Administrators group
MATCH (g:Group {id: 'system-administrators'})
MATCH (r:Role {name: 'ADMIN'})
MERGE (g)-[:HAS_ROLE]->(r);

// ------------------------------------------------------------------------------
// SECTION 2: USERS GROUP
// ------------------------------------------------------------------------------

MERGE (g:Group {id: 'system-users'})
SET g.name = 'Users',
    g.displayName = 'Standard Users',
    g.description = 'Default group for all users',
    g.tenantId = null,
    g.systemGroup = true,
    g.createdAt = datetime(),
    g.updatedAt = datetime();

// Assign USER role to Users group
MATCH (g:Group {id: 'system-users'})
MATCH (r:Role {name: 'USER'})
MERGE (g)-[:HAS_ROLE]->(r);

// ------------------------------------------------------------------------------
// SECTION 3: VIEWERS GROUP
// ------------------------------------------------------------------------------

MERGE (g:Group {id: 'system-viewers'})
SET g.name = 'Viewers',
    g.displayName = 'Read-Only Users',
    g.description = 'Users with read-only access',
    g.tenantId = null,
    g.systemGroup = true,
    g.createdAt = datetime(),
    g.updatedAt = datetime();

// Assign VIEWER role to Viewers group
MATCH (g:Group {id: 'system-viewers'})
MATCH (r:Role {name: 'VIEWER'})
MERGE (g)-[:HAS_ROLE]->(r);

// ------------------------------------------------------------------------------
// SECTION 4: MIGRATION MARKER
// ------------------------------------------------------------------------------

MERGE (m:Migration {version: 'V006'})
ON CREATE SET
    m.name = 'create_default_groups',
    m.description = 'Creates default system groups with role assignments',
    m.appliedAt = datetime();

// ------------------------------------------------------------------------------
// END OF MIGRATION V006
// ------------------------------------------------------------------------------
