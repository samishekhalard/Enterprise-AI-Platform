// ==============================================================================
// V004__create_default_roles.cypher
// Creates default role hierarchy with inheritance
//
// Role Hierarchy:
// SUPER_ADMIN -> ADMIN -> MANAGER -> USER -> VIEWER
//
// Related Documents:
// - /docs/data-models/neo4j-ems-db.md
//
// Author: DBA Agent
// Date: 2026-02-25
// ==============================================================================

// ------------------------------------------------------------------------------
// SECTION 1: CREATE BASE ROLES
// All roles are system roles (cannot be deleted)
// ------------------------------------------------------------------------------

// VIEWER - Read-only access
MERGE (viewer:Role {name: 'VIEWER'})
SET viewer.displayName = 'Viewer',
    viewer.description = 'Read-only access to resources',
    viewer.tenantId = null,
    viewer.systemRole = true,
    viewer.createdAt = datetime(),
    viewer.updatedAt = datetime();

// USER - Standard user with basic CRUD
MERGE (user:Role {name: 'USER'})
SET user.displayName = 'User',
    user.description = 'Standard user with basic CRUD operations',
    user.tenantId = null,
    user.systemRole = true,
    user.createdAt = datetime(),
    user.updatedAt = datetime();

// MANAGER - Team management and reporting
MERGE (manager:Role {name: 'MANAGER'})
SET manager.displayName = 'Manager',
    manager.description = 'Team management and reporting access',
    manager.tenantId = null,
    manager.systemRole = true,
    manager.createdAt = datetime(),
    manager.updatedAt = datetime();

// ADMIN - Full administrative access within tenant
MERGE (admin:Role {name: 'ADMIN'})
SET admin.displayName = 'Administrator',
    admin.description = 'Full administrative access within tenant',
    admin.tenantId = null,
    admin.systemRole = true,
    admin.createdAt = datetime(),
    admin.updatedAt = datetime();

// SUPER_ADMIN - Full system access across all tenants
MERGE (superAdmin:Role {name: 'SUPER_ADMIN'})
SET superAdmin.displayName = 'Super Administrator',
    superAdmin.description = 'Full system access across all tenants',
    superAdmin.tenantId = null,
    superAdmin.systemRole = true,
    superAdmin.createdAt = datetime(),
    superAdmin.updatedAt = datetime();

// ------------------------------------------------------------------------------
// SECTION 2: CREATE ROLE INHERITANCE HIERARCHY
// SUPER_ADMIN -> ADMIN -> MANAGER -> USER -> VIEWER
// ------------------------------------------------------------------------------

// USER inherits from VIEWER
MATCH (user:Role {name: 'USER'})
MATCH (viewer:Role {name: 'VIEWER'})
MERGE (user)-[:INHERITS_FROM]->(viewer);

// MANAGER inherits from USER
MATCH (manager:Role {name: 'MANAGER'})
MATCH (user:Role {name: 'USER'})
MERGE (manager)-[:INHERITS_FROM]->(user);

// ADMIN inherits from MANAGER
MATCH (admin:Role {name: 'ADMIN'})
MATCH (manager:Role {name: 'MANAGER'})
MERGE (admin)-[:INHERITS_FROM]->(manager);

// SUPER_ADMIN inherits from ADMIN
MATCH (superAdmin:Role {name: 'SUPER_ADMIN'})
MATCH (admin:Role {name: 'ADMIN'})
MERGE (superAdmin)-[:INHERITS_FROM]->(admin);

// ------------------------------------------------------------------------------
// SECTION 3: MIGRATION MARKER
// ------------------------------------------------------------------------------

MERGE (m:Migration {version: 'V004'})
ON CREATE SET
    m.name = 'create_default_roles',
    m.description = 'Creates default role hierarchy with inheritance',
    m.appliedAt = datetime();

// ------------------------------------------------------------------------------
// END OF MIGRATION V004
// ------------------------------------------------------------------------------
