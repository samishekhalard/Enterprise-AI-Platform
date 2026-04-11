CREATE CONSTRAINT tenant_id IF NOT EXISTS
FOR (t:Tenant) REQUIRE t.id IS UNIQUE;

CREATE CONSTRAINT provider_name IF NOT EXISTS
FOR (p:Provider) REQUIRE p.name IS UNIQUE;

CREATE CONSTRAINT protocol_type IF NOT EXISTS
FOR (proto:Protocol) REQUIRE proto.type IS UNIQUE;

CREATE CONSTRAINT config_id IF NOT EXISTS
FOR (c:Config) REQUIRE c.id IS UNIQUE;

CREATE CONSTRAINT user_id IF NOT EXISTS
FOR (u:User) REQUIRE u.id IS UNIQUE;

CREATE CONSTRAINT group_id IF NOT EXISTS
FOR (g:Group) REQUIRE g.id IS UNIQUE;

CREATE CONSTRAINT role_name IF NOT EXISTS
FOR (r:Role) REQUIRE r.name IS UNIQUE;

CREATE INDEX config_tenant IF NOT EXISTS
FOR (c:Config) ON (c.tenantId);

CREATE INDEX config_provider IF NOT EXISTS
FOR (c:Config) ON (c.providerName);

CREATE INDEX user_email IF NOT EXISTS
FOR (u:User) ON (u.email);

CREATE INDEX user_tenant IF NOT EXISTS
FOR (u:User) ON (u.tenantId);

CREATE INDEX group_tenant IF NOT EXISTS
FOR (g:Group) ON (g.tenantId);

CREATE INDEX role_tenant IF NOT EXISTS
FOR (r:Role) ON (r.tenantId);

MERGE (oidc:Protocol {type: 'OIDC'})
ON CREATE SET
    oidc.version = '1.0',
    oidc.displayName = 'OpenID Connect',
    oidc.description = 'Modern authentication standard built on OAuth 2.0';

MERGE (saml:Protocol {type: 'SAML'})
ON CREATE SET
    saml.version = '2.0',
    saml.displayName = 'SAML 2.0',
    saml.description = 'Security Assertion Markup Language for enterprise SSO';

MERGE (ldap:Protocol {type: 'LDAP'})
ON CREATE SET
    ldap.version = '3',
    ldap.displayName = 'LDAP v3',
    ldap.description = 'Lightweight Directory Access Protocol for directory services';

MERGE (oauth2:Protocol {type: 'OAUTH2'})
ON CREATE SET
    oauth2.version = '2.0',
    oauth2.displayName = 'OAuth 2.0',
    oauth2.description = 'Authorization framework for social and third-party logins';

MERGE (keycloak:Provider {name: 'KEYCLOAK'})
ON CREATE SET
    keycloak.vendor = 'Red Hat',
    keycloak.displayName = 'Keycloak',
    keycloak.description = 'Self-hosted identity and access management';

WITH keycloak
MATCH (oidc:Protocol {type: 'OIDC'})
MERGE (keycloak)-[:SUPPORTS]->(oidc);

MERGE (viewer:Role {name: 'VIEWER'})
ON CREATE SET
    viewer.displayName = 'Viewer',
    viewer.description = 'Read-only access to resources',
    viewer.tenantId = null,
    viewer.systemRole = true,
    viewer.createdAt = datetime(),
    viewer.updatedAt = datetime();

MERGE (user:Role {name: 'USER'})
ON CREATE SET
    user.displayName = 'User',
    user.description = 'Standard user with basic CRUD operations',
    user.tenantId = null,
    user.systemRole = true,
    user.createdAt = datetime(),
    user.updatedAt = datetime();

MERGE (manager:Role {name: 'MANAGER'})
ON CREATE SET
    manager.displayName = 'Manager',
    manager.description = 'Team management and reporting access',
    manager.tenantId = null,
    manager.systemRole = true,
    manager.createdAt = datetime(),
    manager.updatedAt = datetime();

MERGE (admin:Role {name: 'ADMIN'})
ON CREATE SET
    admin.displayName = 'Administrator',
    admin.description = 'Full administrative access within tenant',
    admin.tenantId = null,
    admin.systemRole = true,
    admin.createdAt = datetime(),
    admin.updatedAt = datetime();

MERGE (superAdmin:Role {name: 'SUPER_ADMIN'})
ON CREATE SET
    superAdmin.displayName = 'Super Administrator',
    superAdmin.description = 'Full system access across all tenants',
    superAdmin.tenantId = null,
    superAdmin.systemRole = true,
    superAdmin.createdAt = datetime(),
    superAdmin.updatedAt = datetime();

MATCH (viewer:Role {name: 'VIEWER'})
MATCH (user:Role {name: 'USER'})
MERGE (user)-[:INHERITS_FROM]->(viewer);

MATCH (user:Role {name: 'USER'})
MATCH (manager:Role {name: 'MANAGER'})
MERGE (manager)-[:INHERITS_FROM]->(user);

MATCH (manager:Role {name: 'MANAGER'})
MATCH (admin:Role {name: 'ADMIN'})
MERGE (admin)-[:INHERITS_FROM]->(manager);

MATCH (admin:Role {name: 'ADMIN'})
MATCH (superAdmin:Role {name: 'SUPER_ADMIN'})
MERGE (superAdmin)-[:INHERITS_FROM]->(admin);

MERGE (administrators:Group {id: 'system-administrators'})
ON CREATE SET
    administrators.name = 'Administrators',
    administrators.displayName = 'System Administrators',
    administrators.description = 'System administrators with full access',
    administrators.tenantId = null,
    administrators.systemGroup = true,
    administrators.createdAt = datetime(),
    administrators.updatedAt = datetime();

MATCH (administrators:Group {id: 'system-administrators'})
MATCH (admin:Role {name: 'ADMIN'})
MERGE (administrators)-[:HAS_ROLE]->(admin);

MERGE (users:Group {id: 'system-users'})
ON CREATE SET
    users.name = 'Users',
    users.displayName = 'Standard Users',
    users.description = 'Default group for all users',
    users.tenantId = null,
    users.systemGroup = true,
    users.createdAt = datetime(),
    users.updatedAt = datetime();

MATCH (users:Group {id: 'system-users'})
MATCH (user:Role {name: 'USER'})
MERGE (users)-[:HAS_ROLE]->(user);

MERGE (viewers:Group {id: 'system-viewers'})
ON CREATE SET
    viewers.name = 'Viewers',
    viewers.displayName = 'Read-Only Users',
    viewers.description = 'Users with read-only access',
    viewers.tenantId = null,
    viewers.systemGroup = true,
    viewers.createdAt = datetime(),
    viewers.updatedAt = datetime();

MATCH (viewers:Group {id: 'system-viewers'})
MATCH (viewer:Role {name: 'VIEWER'})
MERGE (viewers)-[:HAS_ROLE]->(viewer);

MERGE (m:Migration {version: 'AUTH_BOOTSTRAP_V1'})
ON CREATE SET
    m.name = 'auth_tenant_bootstrap',
    m.description = 'Auth tenant bootstrap constraints, providers, roles, and groups',
    m.appliedAt = datetime();
