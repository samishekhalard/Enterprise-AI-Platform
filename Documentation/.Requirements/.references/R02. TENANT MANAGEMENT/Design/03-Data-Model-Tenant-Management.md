# Data Model: Tenant Management

**Document ID:** DM-TM-001
**Requirement Track:** `R02`
**Version:** 2.0.0
**Status:** Draft -- provisional, not locked
**Author:** SA Agent
**Date:** 2026-03-25
**Related Tracks:** `R01`, `R04`, `R07`, `R08`
**Governing Doc:** `02-Technical-Specification-Tenant-Management.md`

---

## 1. Purpose and Scope

This document defines the **target** canonical data model for R02 Tenant Management. It describes the to-be state of the data layer -- what will exist when the target design is fully realized.

**Document rule:** The main body (sections 1--7) contains target-state content only. As-is structures appear only in section 8, and only to explain what is being removed, absorbed, or superseded.

**Databases in scope:**

- PostgreSQL (tenant-service) -- primary data store for tenant lifecycle, configuration, identity, RBAC, audit, platform registry
- Neo4j (definition-service) -- referenced where R02 intersects the definition graph; canonical Neo4j model is in R04

**This document does NOT cover:**

- Migration strategy (separate artifact)
- Object-instance table schemas (coupled to R04, not yet designed)
- Neo4j definition graph model in detail (canonical source: `R04 Design/04-Data-Model-Definition-Management.md` section 4)
- UI layout, API contracts, or implementation code
- Detailed as-is column inventories (those live in foundation artifacts and migration evidence)

---

## 2. Binding Inputs

The following decisions are sealed and binding. This document does not reopen them.

| ID | Decision | Source |
|----|----------|--------|
| FD-01 | `tenant-service` owns tenant users, RBAC, groups, memberships, provider config, session control, revocation, and session history in the target model | `Foundation/06-forks-gaps-blockers.md` section 1 |
| FD-02 | `auth-facade` is transition-only, then removed | `Foundation/06-forks-gaps-blockers.md` section 1 |
| FD-03 | `api-gateway` is the target auth edge | `Foundation/06-forks-gaps-blockers.md` section 1 |
| FD-04 | Neo4j removed from auth target domain | `Foundation/06-forks-gaps-blockers.md` section 1 |
| FD-05 | `user-service` is transition-only, then removed from tenant-user ownership | `Foundation/06-forks-gaps-blockers.md` section 1 |
| FD-06 | Graph-per-tenant flag will not be activated | `Foundation/06-forks-gaps-blockers.md` section 1 |
| AP-1 | Definitions in Neo4j, instances in PostgreSQL | R04 architectural principle |

**Tagging rules:**

1. `[TARGET]` marks structures that are part of the target design and have not yet been implemented.
2. `[CARRY-FORWARD]` marks existing structures that persist into the target model without redesign.
3. `[REMOVED]` marks structures that will be eliminated in the target model.
4. The term "auth server" is used architecturally. "Keycloak" appears only where as-is evidence requires it.
5. This document does not use `Foundation/07-feedback-ledger.md` as a source.

---

## 3. Target PostgreSQL Canonical Model

The target PostgreSQL model for `tenant-service` consists of:

- 13 carry-forward tables
- 6 auth absorption tables (per FD-01 through FD-05)
- 2 platform registry tables (per R07 alignment)
- 2 entity gap closures

### 3.1 Carry-Forward Tables

The target model retains the following tables. Column-level detail is in the migration files cited; this section documents their target role and any target-state changes.

| # | Table | Target Role | Migration Evidence | Entity |
|---|-------|-------------|-------------------|--------|
| 1 | `tenants` | Central tenant record: lifecycle, governance, routing, compliance | V1, V4, V7, V8, V11, V15 | `TenantEntity.java` |
| 2 | `tenant_domains` | Custom domain bindings per tenant (DNS, SSL, verification) | V1 | `TenantDomainEntity.java` |
| 3 | `tenant_auth_providers` | Auth provider configurations per tenant (LOCAL, AZURE_AD, SAML, OIDC, LDAP, UAEPASS) | V1 | `TenantAuthProviderEntity.java` |
| 4 | `tenant_branding` | Branding and theming per tenant (colors, typography, neumorphic controls, hover behaviour) | V1, V9 | `TenantBrandingEntity.java` |
| 5 | `tenant_session_config` | Session policy per tenant (token lifetimes, timeouts, concurrency) | V1 | `TenantSessionConfigEntity.java` |
| 6 | `tenant_mfa_config` | Multi-factor authentication policy per tenant | V1 | `TenantMFAConfigEntity.java` |
| 7 | `retention_policies` | Data retention policy definitions (seeded with compliance frameworks) | V7 | NONE -- entity gap (see 3.4) |
| 8 | `tenant_database_logs` | Audit log for database provisioning and lifecycle events | V7 | NONE -- entity gap (see 3.4) |
| 9 | `tenant_locales` | Supported locale codes per tenant | V8 | `TenantLocaleEntity.java` |
| 10 | `tenant_provisioning_steps` | Step-by-step provisioning progress per tenant | V8 | `TenantProvisioningStepEntity.java` |
| 11 | `message_registry` | Platform-wide message code registry | V8 | `MessageRegistryEntity.java` |
| 12 | `message_translation` | Locale-specific translations for message codes | V8 | `MessageTranslationEntity.java` |
| 13 | `tenant_message_translation` | Tenant-specific overrides for message translations | V12 | `TenantMessageTranslationEntity.java` |

**Target-state changes to carry-forward tables:**

| Table | Column | Change | Reason |
|-------|--------|--------|--------|
| `tenants` | `keycloak_realm` | Vestigial in target; column retained for transition but no longer authoritative | FD-04: auth graph removed from Neo4j |
| `tenants` | `auth_db_name` | Vestigial in target; auth data moves to tenant-service PG | FD-01, FD-04 |
| `tenants` | `definitions_db_name` | Vestigial in target; definition-service has no `DatabaseSelectionProvider` and graph-per-tenant will not be activated | FD-06, `05-topology-contract.md:115`, `Neo4jConfig.java` |

### 3.2 New Target Tables -- Auth Absorption

`[TARGET]` -- Per frozen decisions FD-01 through FD-05, `tenant-service` will be the single owner of tenant-scoped identity and RBAC data. The following tables represent the auth absorption target.

#### 3.2.1 tenant_users

Tenant-scoped user profiles. Would absorb `user-service` UserProfile entity and `auth-facade` UserNode graph data.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | `UUID` | PK | |
| `tenant_id` | `VARCHAR(50)` | NOT NULL, FK -> `tenants(id)` | Tenant partition |
| `auth_server_subject_id` | `VARCHAR(255)` | NOT NULL | Auth server user identifier |
| `username` | `VARCHAR(100)` | NOT NULL | |
| `email` | `VARCHAR(255)` | | |
| `display_name` | `VARCHAR(255)` | | |
| `status` | `VARCHAR(20)` | NOT NULL | Maps to UserStatus enum |
| `last_login_at` | `TIMESTAMPTZ` | | |
| `version` | `BIGINT` | NOT NULL DEFAULT 0 | Optimistic locking |
| `created_at` | `TIMESTAMPTZ` | NOT NULL | |
| `updated_at` | `TIMESTAMPTZ` | NOT NULL | |
| `created_by` | `VARCHAR(50)` | | |

**Unique constraint:** (`tenant_id`, `username`), (`tenant_id`, `auth_server_subject_id`)

#### 3.2.2 tenant_roles

RBAC role definitions per tenant. Would absorb `auth-facade` Neo4j RoleNode data.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | `UUID` | PK | |
| `tenant_id` | `VARCHAR(50)` | NOT NULL, FK -> `tenants(id)` | Tenant partition |
| `name` | `VARCHAR(100)` | NOT NULL | |
| `display_name` | `VARCHAR(255)` | | |
| `description` | `TEXT` | | |
| `parent_role_id` | `UUID` | FK -> `tenant_roles(id)` | Role hierarchy (from Neo4j INHERITS_FROM) |
| `is_system` | `BOOLEAN` | NOT NULL DEFAULT FALSE | System-defined vs tenant-defined |
| `version` | `BIGINT` | NOT NULL DEFAULT 0 | Optimistic locking |
| `created_at` | `TIMESTAMPTZ` | NOT NULL | |
| `updated_at` | `TIMESTAMPTZ` | NOT NULL | |
| `created_by` | `VARCHAR(50)` | | |

**Unique constraint:** (`tenant_id`, `name`)

#### 3.2.3 tenant_groups

User group definitions per tenant. Would absorb `auth-facade` Neo4j GroupNode data.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | `UUID` | PK | |
| `tenant_id` | `VARCHAR(50)` | NOT NULL, FK -> `tenants(id)` | Tenant partition |
| `name` | `VARCHAR(100)` | NOT NULL | |
| `display_name` | `VARCHAR(255)` | | |
| `description` | `TEXT` | | |
| `version` | `BIGINT` | NOT NULL DEFAULT 0 | Optimistic locking |
| `created_at` | `TIMESTAMPTZ` | NOT NULL | |
| `updated_at` | `TIMESTAMPTZ` | NOT NULL | |
| `created_by` | `VARCHAR(50)` | | |

**Unique constraint:** (`tenant_id`, `name`)

#### 3.2.4 tenant_memberships

Association table for user-to-role and user-to-group memberships. Would absorb `auth-facade` Neo4j HAS_ROLE and MEMBER_OF relationships.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | `UUID` | PK | |
| `tenant_id` | `VARCHAR(50)` | NOT NULL, FK -> `tenants(id)` | Tenant partition |
| `user_id` | `UUID` | NOT NULL, FK -> `tenant_users(id)` | |
| `role_id` | `UUID` | FK -> `tenant_roles(id)` | Nullable -- membership may be group-only |
| `group_id` | `UUID` | FK -> `tenant_groups(id)` | Nullable -- membership may be role-only |
| `assigned_at` | `TIMESTAMPTZ` | NOT NULL | |
| `assigned_by` | `VARCHAR(50)` | | |
| `created_at` | `TIMESTAMPTZ` | NOT NULL | |

**Constraint:** CHECK (`role_id IS NOT NULL OR group_id IS NOT NULL`) -- at least one must be set.

#### 3.2.5 tenant_user_sessions

Session tracking per tenant user. Would absorb `user-service` UserSession entity.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | `UUID` | PK | |
| `tenant_id` | `VARCHAR(50)` | NOT NULL, FK -> `tenants(id)` | Tenant partition |
| `user_id` | `UUID` | NOT NULL, FK -> `tenant_users(id)` | |
| `auth_server_session_id` | `VARCHAR(255)` | | Auth server session reference |
| `ip_address` | `VARCHAR(45)` | | IPv4 or IPv6 |
| `user_agent` | `TEXT` | | |
| `started_at` | `TIMESTAMPTZ` | NOT NULL | |
| `last_active_at` | `TIMESTAMPTZ` | | |
| `ended_at` | `TIMESTAMPTZ` | | |
| `status` | `VARCHAR(20)` | NOT NULL | Maps to SessionStatus enum |
| `created_at` | `TIMESTAMPTZ` | NOT NULL | |

#### 3.2.6 tenant_provider_configs

Auth provider protocol configuration per tenant. Would absorb `auth-facade` Neo4j ProviderNode/ConfigNode/ProtocolNode data. Extends the existing `tenant_auth_providers` table with detailed protocol-level configuration.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | `UUID` | PK | |
| `auth_provider_id` | `VARCHAR(50)` | NOT NULL, FK -> `tenant_auth_providers(id)` | Links to existing provider record |
| `protocol` | `VARCHAR(20)` | NOT NULL | SAML, OIDC, LDAP, etc. |
| `config_data` | `JSONB` | NOT NULL DEFAULT '{}' | Protocol-specific configuration |
| `is_active` | `BOOLEAN` | NOT NULL DEFAULT TRUE | |
| `validated_at` | `TIMESTAMPTZ` | | Last successful config validation |
| `version` | `BIGINT` | NOT NULL DEFAULT 0 | Optimistic locking |
| `created_at` | `TIMESTAMPTZ` | NOT NULL | |
| `updated_at` | `TIMESTAMPTZ` | NOT NULL | |

### 3.3 Target Entity Relationship Diagram

```mermaid
erDiagram
    tenants ||--o{ tenant_domains : "has"
    tenants ||--o{ tenant_auth_providers : "has"
    tenants ||--o| tenant_branding : "styled by"
    tenants ||--o| tenant_session_config : "has"
    tenants ||--o| tenant_mfa_config : "has"
    tenants }o--o| retention_policies : "governed by"
    tenants ||--o{ tenant_database_logs : "tracked by"
    tenants ||--o{ tenant_locales : "supports"
    tenants ||--o{ tenant_provisioning_steps : "provisioned via"
    tenants ||--o{ tenant_message_translation : "overrides"
    tenants ||--o{ tenant_users : "has"
    tenants ||--o{ tenant_roles : "defines"
    tenants ||--o{ tenant_groups : "defines"
    tenants ||--o{ tenant_memberships : "governs"
    message_registry ||--o{ message_translation : "translated as"
    message_registry ||--o{ tenant_message_translation : "overridden by"
    tenant_users ||--o{ tenant_memberships : "assigned"
    tenant_roles ||--o{ tenant_memberships : "grants"
    tenant_groups ||--o{ tenant_memberships : "includes"
    tenant_roles ||--o{ tenant_roles : "inherits from"
    tenant_users ||--o{ tenant_user_sessions : "tracked by"
    tenant_auth_providers ||--o{ tenant_provider_configs : "configured by"

    tenants {
        varchar50 id PK
        uuid uuid UK
        varchar255 full_name
        varchar100 slug UK
        varchar20 tenant_type
        varchar20 tier
        varchar20 status
        bigint version
    }

    tenant_domains {
        varchar50 id PK
        varchar50 tenant_id FK
        varchar255 domain UK
        varchar20 verification_method
        varchar20 ssl_status
    }

    tenant_auth_providers {
        varchar50 id PK
        varchar50 tenant_id FK
        varchar20 type
        varchar100 name
        boolean is_enabled
        jsonb config
    }

    tenant_branding {
        varchar50 tenant_id PK_FK
        varchar20 primary_color
        varchar20 surface_color
        varchar20 text_color
        varchar100 font_family
        integer corner_radius
        integer shadow_intensity
    }

    tenant_session_config {
        varchar50 tenant_id PK_FK
        integer access_token_lifetime
        integer refresh_token_lifetime
        integer idle_timeout
        integer max_concurrent_sessions
    }

    tenant_mfa_config {
        varchar50 tenant_id PK_FK
        boolean enabled
        boolean required
        text_array allowed_methods
        varchar20 default_method
    }

    retention_policies {
        varchar50 id PK
        varchar100 name
        integer default_retention_days
        varchar50 compliance_framework
    }

    tenant_database_logs {
        varchar50 id PK
        varchar50 tenant_id FK
        varchar50 event_type
        varchar20 status
        bigint duration_ms
    }

    tenant_locales {
        uuid tenant_uuid PK_FK
        varchar10 locale_code PK
    }

    tenant_provisioning_steps {
        bigserial id PK
        uuid tenant_uuid FK
        varchar50 step_name
        int step_order
        varchar20 status
    }

    message_registry {
        varchar20 code PK
        char1 type
        varchar50 category
        int http_status
    }

    message_translation {
        varchar20 code PK_FK
        varchar10 locale_code PK
        varchar255 title
    }

    tenant_message_translation {
        uuid tenant_uuid PK_FK
        varchar20 code PK_FK
        varchar10 locale_code PK
        varchar255 title
    }

    tenant_users {
        uuid id PK
        varchar50 tenant_id FK
        varchar255 auth_server_subject_id
        varchar100 username
        varchar20 status
        bigint version
    }

    tenant_roles {
        uuid id PK
        varchar50 tenant_id FK
        varchar100 name
        uuid parent_role_id FK
        boolean is_system
        bigint version
    }

    tenant_groups {
        uuid id PK
        varchar50 tenant_id FK
        varchar100 name
        bigint version
    }

    tenant_memberships {
        uuid id PK
        varchar50 tenant_id FK
        uuid user_id FK
        uuid role_id FK
        uuid group_id FK
    }

    tenant_user_sessions {
        uuid id PK
        varchar50 tenant_id FK
        uuid user_id FK
        varchar20 status
        timestamptz started_at
    }

    tenant_provider_configs {
        uuid id PK
        varchar50 auth_provider_id FK
        varchar20 protocol
        jsonb config_data
        bigint version
    }

    platform_servers {
        uuid id PK
        varchar20 server_type
        varchar255 host
        varchar20 validation_status
    }

    platform_initialization_status {
        uuid id PK
        varchar100 step_name UK
        varchar20 status
    }
```

### 3.4 Entity Gap Closures

`[TARGET]` -- The following existing tables require JPA entity creation:

| Table | Required Entity | Notes |
|-------|----------------|-------|
| `retention_policies` | `RetentionPolicyEntity` | Would include `@Version`, audit fields |
| `tenant_database_logs` | `TenantDatabaseLogEntity` | Read-heavy audit table, `@Version` may be omitted |

---

## 4. Target Graph Intersections Relevant to R02

This section describes how R02 intersects Neo4j in the target state. It does not restate the Neo4j definition graph model, which is canonical in `R04 Design/04-Data-Model-Definition-Management.md` section 4.

### 4.1 Tenant-to-Definition-Graph Intersections

In the target model, R02 intersects the definition graph at these points:

1. **Tenant provisioning seeds the definition graph.** When a tenant is provisioned, ObjectType nodes are created in Neo4j from seed data, tagged with the tenant's identifier. The `tenants.uuid` value becomes the partition key on every seeded node.

2. **`tenantId` property on every Neo4j node partitions data per tenant.** All definition-service Neo4j nodes (ObjectTypeNode, AttributeTypeNode, etc.) carry a `tenantId` property that maps to a tenant record in PostgreSQL. This is the primary cross-store reference.

3. **All tenants share a single Neo4j database.** Per FD-06, graph-per-tenant will not be activated. Tenant data is logically partitioned by `tenantId` property on every node.

### 4.2 Object Instance Intersections

`[TARGET]` Object instances will be stored in PostgreSQL per R04 architectural principle AP-1. Instance data relevant to tenant management includes:

- Instances will be governed by tenant-scoped RBAC stored in PostgreSQL (`tenant_roles`, `tenant_memberships`)
- Instances will be created by tenant users whose profiles are in PostgreSQL (`tenant_users`)
- Instances will reference object type definitions that live in Neo4j (by `objectTypeId` foreign reference)

The instance table design is open. See section 9, item UI-01.

---

## 5. Target Cross-Store Reference Model

In the target state, the following cross-store references will exist between PostgreSQL and Neo4j.

| PG Source | Neo4j Target | Mechanism | Notes |
|-----------|-------------|-----------|-------|
| `tenants.id` / `tenants.uuid` | `ObjectTypeNode.tenantId` | Application-enforced. Every Neo4j node carries a `tenantId` that matches a PG tenant record. | Primary partition key |
| `tenant_roles`, `tenant_memberships` | Object instance CRUD access | Application-enforced RBAC. PG role/permission data governs what a user can do with instances whose definitions live in Neo4j. | Requires RBAC enforcement layer |
| Audit event tables (PG) | Graph mutation events | Kafka event bridge. Neo4j mutations would publish events consumed by PG audit writers. | Event-driven, eventual consistency |
| Instance tables (PG) | `ObjectType.id` (Neo4j) | Application-enforced `objectTypeId` foreign reference. PG instance rows reference Neo4j ObjectType nodes by ID. | No cross-database FK possible |

**Cross-store enforcement rule:** No cross-database foreign keys exist or will exist between PostgreSQL and Neo4j. All cross-store references are application-enforced at the service layer. The mechanism for runtime consistency enforcement is open (see section 9, item UI-02).

---

## 6. Target Platform Registry Model

`[TARGET]` -- Part of the target model for COTS deployment and platform initialization, aligned with R07.

### 6.1 platform_servers

Registry of external infrastructure servers connected to the platform.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | `UUID` | PK | |
| `server_type` | `VARCHAR(20)` | NOT NULL, CHECK (NEO4J, POSTGRESQL, AUTH_SERVER, CACHE) | |
| `host` | `VARCHAR(255)` | NOT NULL | |
| `port` | `INTEGER` | | |
| `connection_url` | `VARCHAR(512)` | | Full connection string |
| `credentials_ref` | `VARCHAR(255)` | | Reference to secrets store, not plaintext |
| `edition` | `VARCHAR(50)` | | e.g., "Community", "Enterprise" |
| `version_info` | `VARCHAR(100)` | | Reported version string |
| `validation_status` | `VARCHAR(20)` | DEFAULT 'PENDING' | PENDING, VALID, INVALID |
| `validated_at` | `TIMESTAMPTZ` | | |
| `registered_by` | `VARCHAR(50)` | | |
| `created_at` | `TIMESTAMPTZ` | NOT NULL | |
| `updated_at` | `TIMESTAMPTZ` | NOT NULL | |

### 6.2 platform_initialization_status

Tracks platform-level initialization steps (distinct from per-tenant provisioning).

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | `UUID` | PK | |
| `step_name` | `VARCHAR(100)` | NOT NULL, UNIQUE | |
| `status` | `VARCHAR(20)` | NOT NULL, CHECK (PENDING, IN_PROGRESS, COMPLETED, FAILED) | |
| `completed_at` | `TIMESTAMPTZ` | | |
| `created_at` | `TIMESTAMPTZ` | NOT NULL | |

---

## 7. Target Constraints, Enums, and Authority Rules

### 7.1 Enums

Target enums for new tables. Carry-forward table enums are documented in migration evidence and are not restated here.

| Enum | Applies To | Values | Notes |
|------|-----------|--------|-------|
| UserStatus | `tenant_users.status` | To be defined during auth absorption design | `[TARGET]` |
| SessionStatus | `tenant_user_sessions.status` | To be defined during auth absorption design | `[TARGET]` |
| ServerType | `platform_servers.server_type` | NEO4J, POSTGRESQL, AUTH_SERVER, CACHE | `[TARGET]` |
| ValidationStatus | `platform_servers.validation_status` | PENDING, VALID, INVALID | `[TARGET]` |

### 7.2 CHECK Constraints for New Tables

| Table | Column | Constraint |
|-------|--------|------------|
| `tenant_memberships` | `role_id`, `group_id` | CHECK (`role_id IS NOT NULL OR group_id IS NOT NULL`) |
| `platform_servers` | `server_type` | IN ('NEO4J', 'POSTGRESQL', 'AUTH_SERVER', 'CACHE') |
| `platform_servers` | `validation_status` | IN ('PENDING', 'VALID', 'INVALID') |
| `platform_initialization_status` | `status` | IN ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'FAILED') |

### 7.3 Indexes for New Tables

| Index | Table | Column(s) | Type |
|-------|-------|-----------|------|
| `idx_tenant_users_tenant` | `tenant_users` | `tenant_id` | B-tree |
| `idx_tenant_users_username` | `tenant_users` | `tenant_id`, `username` | B-tree (unique) |
| `idx_tenant_users_subject` | `tenant_users` | `tenant_id`, `auth_server_subject_id` | B-tree (unique) |
| `idx_tenant_roles_tenant` | `tenant_roles` | `tenant_id` | B-tree |
| `idx_tenant_roles_name` | `tenant_roles` | `tenant_id`, `name` | B-tree (unique) |
| `idx_tenant_groups_tenant` | `tenant_groups` | `tenant_id` | B-tree |
| `idx_tenant_groups_name` | `tenant_groups` | `tenant_id`, `name` | B-tree (unique) |
| `idx_tenant_memberships_user` | `tenant_memberships` | `user_id` | B-tree |
| `idx_tenant_memberships_role` | `tenant_memberships` | `role_id` | B-tree |
| `idx_tenant_memberships_group` | `tenant_memberships` | `group_id` | B-tree |
| `idx_tenant_sessions_user` | `tenant_user_sessions` | `user_id` | B-tree |
| `idx_tenant_sessions_status` | `tenant_user_sessions` | `status` | B-tree |
| `idx_platform_servers_type` | `platform_servers` | `server_type` | B-tree |

### 7.4 Data Authority Rules

| Store | Authoritative For |
|-------|-------------------|
| PostgreSQL (tenant-service) | Tenant lifecycle, tenant configuration, branding, user identity, RBAC, session control, audit, message registry, platform registry, retention policies, provisioning state |
| Neo4j (definition-service) | Object type definitions, attribute type definitions, connections between types |
| PostgreSQL (instance tables) | Object instances (per AP-1) -- when designed |
| Auth server | Token issuance, token validation, realm configuration. The auth server is the token authority; PostgreSQL is the data-of-record authority for user profiles and RBAC. |

**Cross-store enforcement rule:** No cross-database foreign keys exist or will exist between PostgreSQL and Neo4j. All cross-store references are application-enforced at the service layer.

---

## 8. Removed / Replaced / Transition-Only Structures

This section documents structures from the current system that will be removed, absorbed, or become vestigial in the target model. Detailed as-is evidence for these structures lives in foundation artifacts and migration files.

### 8.1 Auth Graph -- Removed

`[REMOVED]` per FD-04. The Neo4j auth graph currently contains the following node types relevant to tenant management:

- TenantNode, UserNode, GroupNode, RoleNode, ProviderNode, ConfigNode, ProtocolNode
- Relationships: BELONGS_TO, HAS_ROLE, MEMBER_OF, USES, CONFIGURED_WITH, SUPPORTS, INHERITS_FROM

This graph is transition-only. Its data will migrate to `tenant-service` PostgreSQL tables defined in section 3.2. No new features should be built on the auth graph.

**Evidence:** `auth-facade/src/main/resources/neo4j/migrations/V001` through `V009`

### 8.2 auth-facade Service -- Removed

`[REMOVED]` per FD-02. The `auth-facade` Spring Boot service currently manages the Neo4j auth graph. In the target model, all auth graph data is absorbed into `tenant-service` PostgreSQL tables. The service itself will be decommissioned.

### 8.3 user-service Ownership -- Removed

`[REMOVED]` per FD-05. The `user-service` currently owns UserProfile and UserSession entities in its own PostgreSQL schema. In the target model, this data is absorbed into `tenant_users` and `tenant_user_sessions` tables owned by `tenant-service`.

### 8.4 Vestigial Columns on tenants Table

The following columns on the `tenants` table become vestigial in the target model:

| Column | Current Purpose | Target Status | Reason |
|--------|----------------|--------------|--------|
| `keycloak_realm` | Auth server realm name | Vestigial -- retained for transition | FD-04: auth data moves to PG. Column name is vendor-specific. |
| `auth_db_name` | Neo4j database name for auth-facade routing | Vestigial -- auth data moves to PG | FD-01, FD-04: auth-facade removed, auth graph removed |
| `definitions_db_name` | Column exists in PG but definition-service has **no** `DatabaseSelectionProvider` -- it is not used for routing | Vestigial -- all tenants share a single Neo4j database with `tenantId` partitioning | FD-06: graph-per-tenant not activated. Evidence: `Neo4jConfig.java` (no routing bean), `05-topology-contract.md:115` |

---

## 9. Unresolved Target Items

### UI-01: Object-Instance Table Design

**Status:** Open
**Description:** R04 architectural principle AP-1 states that object instances will be stored in PostgreSQL. However, the instance table schema has not been designed. This is coupled to R04 and requires SA verdict on column structure, tenant partitioning strategy, and the relationship between instance rows and ObjectType nodes in Neo4j.
**Blocked by:** R04 data model finalization.
**Action:** SA to design instance table schema as part of R04/R02 alignment. Do not invent schemas in this document.

### UI-02: Cross-Store Authority Enforcement

**Status:** Open
**Description:** The mechanism for maintaining consistency between PostgreSQL and Neo4j at runtime has not been decided. Options include: (a) application-layer validation on every cross-store operation, (b) Kafka event bridge for eventual consistency, (c) hybrid approach. Each option has different consistency, latency, and complexity tradeoffs.
**Blocked by:** Architecture decision required (escalate to ARCH).

### UI-03: TenantStatus Enum -- Requires Canonical Target Source

**Status:** Open -- requires canonical source before action
**Description:** The current `TenantStatus.java` enum contains 11 values: PROVISIONING, PROVISIONING_FAILED, ACTIVE, LOCKED, SUSPENDED, PENDING, DELETION_PENDING, DELETION_FAILED, DELETED, RESTORING, DECOMMISSIONED (source: `backend/common/src/main/java/com/ems/common/enums/TenantStatus.java`). The V8 CHECK constraint in PostgreSQL matches these 11 values. A reduction to fewer target values has been discussed but no canonical R02 or R04 artifact sources or approves a specific target set. Until a canonical target is authored and approved, no reconciliation action should be taken.
**Action:** If a target TenantStatus model is intended, it must be authored in a canonical R02 design artifact (PRD or this data model) and approved before any enum reduction is planned.

---

## 10. Downstream Artifacts

| Artifact | Depends On | Expected Output |
|----------|-----------|-----------------|
| ERD (full target) | This data model | Mermaid ERD showing full relational model with cross-store references annotated |
| API Contract | This data model (request/response shapes derive from entity definitions) | OpenAPI 3.1 specification for tenant management endpoints |
| Security Requirements | Authority rules from section 7.4 | Tenant isolation verification, RBAC enforcement rules, cross-store access policies |
| PRD / Story / Journey Cleanup | Canonical model for scope validation | Updated user stories and acceptance criteria aligned to the data model |
| Migration Playbook | This data model (section 3.2 target tables) + section 8 (removed structures) | Step-by-step migration from Neo4j auth graph and user-service PG to tenant-service PG |
| DBA Schema Scripts | This data model (section 3.2 + section 6 target tables) | Flyway migration SQL for auth absorption tables and platform registry tables |
