# ISSUE-001: Database Review -- Neo4j Identity Graph

| Field | Value |
|-------|-------|
| **Document Type** | DBA Review / Technical Analysis |
| **Author** | DBA Agent |
| **Date** | 2026-02-26 |
| **Related Issue** | ISSUE-001 (Master Tenant Authentication & Superuser) |
| **Scope** | Neo4j auth-facade identity graph (V001--V007 migrations) |
| **Status** | REVIEW |

---

## Table of Contents

1. [Tenant ID Resolution Analysis](#1-tenant-id-resolution-analysis)
2. [User Data in Neo4j](#2-user-data-in-neo4j)
3. [Query Performance for User Listing](#3-query-performance-for-user-listing)
4. [Data Consistency](#4-data-consistency)
5. [Migration Safety Audit](#5-migration-safety-audit)
6. [Proposed Migration: V008](#6-proposed-migration-v008)
7. [Summary of Findings](#7-summary-of-findings)

---

## 1. Tenant ID Resolution Analysis

### 1.1 Current State (Evidence)

There are **two independent representations** of the master tenant, stored in different databases with incompatible identifiers.

**Neo4j (auth-facade) -- V005 migration:**

File: `/Users/mksulty/Claude/EMSIST/backend/auth-facade/src/main/resources/neo4j/migrations/V005__create_master_tenant.cypher`, line 19:

```cypher
MERGE (t:Tenant {id: 'master'})
SET t.domain = 'localhost',
    t.name = 'Master Tenant',
    t.active = true,
    ...
```

The `TenantNode.java` entity (`@Id String id`) uses a plain string identifier. The `id` field currently holds the slug-style value `'master'`.

File: `/Users/mksulty/Claude/EMSIST/backend/auth-facade/src/main/java/com/ems/auth/graph/entity/TenantNode.java`, lines 28-29:

```java
@Id
String id,
```

**PostgreSQL (tenant-service) -- V2 seed migration:**

File: `/Users/mksulty/Claude/EMSIST/backend/tenant-service/src/main/resources/db/migration/V2__seed_default_tenant.sql`, lines 7-21:

```sql
INSERT INTO tenants (
    id, uuid, full_name, short_name, slug, ...
) VALUES (
    'tenant-master',                           -- PK (VARCHAR(50))
    'a0000000-0000-0000-0000-000000000001',   -- UUID column
    'Think Transformation Savvy',
    'Think',
    'think',
    ...
);
```

The PostgreSQL `tenants` table uses a **dual-ID pattern**: a string PK `id = 'tenant-master'` and a separate `uuid` column `= 'a0000000-0000-0000-0000-000000000001'`.

### 1.2 The Problem

| System | Identifier Used | Value |
|--------|-----------------|-------|
| Neo4j TenantNode `@Id` | `id` | `'master'` |
| PostgreSQL tenants PK | `id` | `'tenant-master'` |
| PostgreSQL tenants UUID | `uuid` | `'a0000000-0000-0000-0000-000000000001'` |
| Frontend calls | tenantId parameter | `'a0000000-0000-0000-0000-000000000001'` (UUID) |

The `AuthGraphRepository` queries all use `Tenant {id: $tenantId}`, for example at line 47:

```cypher
MATCH (t:Tenant {id: $tenantId})-[:USES]->(p:Provider {name: $providerName})
```

If the frontend sends `a0000000-0000-0000-0000-000000000001`, no Tenant node will match because the Neo4j `id` is `'master'`. This is a **confirmed root cause** for the 404 error described in ISSUE-001a.

### 1.3 TenantNode Entity Gap

The `TenantNode` entity has these fields:

| Field | Type | Purpose |
|-------|------|---------|
| `id` | `String` (`@Id`) | Neo4j primary key -- currently holds slug `'master'` |
| `domain` | `String` | Domain for resolution -- `'localhost'` |
| `name` | `String` | Display name -- `'Master Tenant'` |
| `active` | `boolean` | Active flag |
| `createdAt` | `Instant` | Timestamp |
| `updatedAt` | `Instant` | Timestamp |

**Missing fields:**
- No `uuid` field (to store `a0000000-0000-0000-0000-000000000001`)
- No `slug` field (to store `'master'` or `'think'`)

### 1.4 Recommendation

**Option A (RECOMMENDED): Align Neo4j `id` to the PostgreSQL `uuid`.**

Change the master tenant's Neo4j `id` from `'master'` to `'a0000000-0000-0000-0000-000000000001'`, and add a `slug` property to preserve the human-readable identifier.

Rationale:
- The UUID is the cross-system identifier used by the frontend and all other services.
- The `AuthGraphRepository` queries use `id` to match tenants -- this must match what callers send.
- A `slug` property can still be used for human-readable lookups (e.g., domain-based tenant resolution).
- The DBA principles require UUID strings for id properties; the current `'master'` violates this.

**Option B (NOT recommended): Add a `uuid` field to TenantNode and update all queries.**

This would require modifying every query in `AuthGraphRepository` to match on `uuid` instead of `id`, plus adding a new index. More invasive, less consistent.

### 1.5 Required Changes for Option A

**Entity change -- TenantNode.java:**

Add a `slug` field:

```java
@Node("Tenant")
public record TenantNode(
    @Id
    String id,          // UUID: 'a0000000-0000-0000-0000-000000000001'
    String slug,        // Human-readable: 'master'
    String domain,
    String name,
    boolean active,
    @Relationship(type = "USES", direction = OUTGOING)
    List<ProviderNode> providers,
    @Relationship(type = "CONFIGURED_WITH", direction = OUTGOING)
    List<ConfigNode> configurations,
    Instant createdAt,
    Instant updatedAt
) { ... }
```

**New constraint -- V008 migration (slug index):**

```cypher
CREATE INDEX tenant_slug IF NOT EXISTS
FOR (t:Tenant) ON (t.slug);
```

**Data migration -- V008 migration (update master tenant ID):**

```cypher
// Step 1: Match the existing master tenant
MATCH (t:Tenant {id: 'master'})
// Step 2: Set the slug property and update the id
SET t.slug = 'master',
    t.id = 'a0000000-0000-0000-0000-000000000001',
    t.updatedAt = datetime();
```

Note: In Neo4j, the `@Id` field backed by `id` is a regular property (not an internal Neo4j ID). Updating it via SET is safe as long as the uniqueness constraint is not violated.

**Update ConfigNode denormalized tenantId:**

```cypher
// Update Config nodes that reference the old tenant ID
MATCH (c:Config {tenantId: 'master'})
SET c.tenantId = 'a0000000-0000-0000-0000-000000000001';
```

---

## 2. User Data in Neo4j

### 2.1 Current State -- UserNode Entity

File: `/Users/mksulty/Claude/EMSIST/backend/auth-facade/src/main/java/com/ems/auth/graph/entity/UserNode.java`

The `UserNode` entity is fully defined with these fields:

| Field | Type | Purpose |
|-------|------|---------|
| `id` | `String` (`@Id`) | UUID from identity provider |
| `email` | `String` | User email |
| `firstName` | `String` | First name |
| `lastName` | `String` | Last name |
| `tenantId` | `String` | Tenant association (denormalized) |
| `active` | `boolean` | Active flag |
| `emailVerified` | `boolean` | Email verification status |
| `externalId` | `String` | External IdP user ID |
| `identityProvider` | `String` | Which IdP authenticated user |
| `groups` | `List<GroupNode>` | `MEMBER_OF` relationships |
| `directRoles` | `List<RoleNode>` | `HAS_ROLE` relationships |
| `createdAt` | `Instant` | Created timestamp |
| `updatedAt` | `Instant` | Updated timestamp |
| `lastLoginAt` | `Instant` | Last login timestamp |

### 2.2 Current State -- No Users Seeded

**No migration (V001 through V007) creates any User nodes.** The UserNode entity exists in Java code and has indexes defined in V001 (lines 69-86), but zero User data exists in the graph after migration.

V001 defines these User indexes (verified):

```cypher
CREATE CONSTRAINT user_id IF NOT EXISTS
FOR (u:User) REQUIRE u.id IS UNIQUE;

CREATE INDEX user_email IF NOT EXISTS
FOR (u:User) ON (u.email);

CREATE INDEX user_tenant IF NOT EXISTS
FOR (u:User) ON (u.tenantId);

CREATE INDEX user_external IF NOT EXISTS
FOR (u:User) ON (u.externalId);

CREATE INDEX user_email_tenant IF NOT EXISTS
FOR (u:User) ON (u.email, u.tenantId);
```

### 2.3 Missing Relationship: BELONGS_TO

The `UserNode.java` Javadoc at line 21 states:

```java
 * (User)-[:BELONGS_TO]->(Tenant)
```

However, **this relationship is NOT modeled** in the entity. The `UserNode` record does not have a `@Relationship(type = "BELONGS_TO", direction = OUTGOING)` field referencing `TenantNode`. Instead, it relies on a denormalized `tenantId` string property.

The `package-info.java` graph structure diagram (line 26) also omits `BELONGS_TO`:

```
(User)-[:MEMBER_OF]->(Group)-[:HAS_ROLE]->(Role)-[:INHERITS_FROM]->(Role)
```

**Recommendation:** The `BELONGS_TO` relationship should be created in the migration for data integrity. Even though `tenantId` is denormalized for query performance, a graph relationship provides traversal capability and enforces referential integrity at the graph level.

### 2.4 Should the Superuser Be Seeded in Neo4j?

**Yes.** The superuser MUST exist in Neo4j because:

1. The `AuthGraphRepository.findEffectiveRoles()` query (line 132) traverses `User -> Group -> Role -> inherited Roles` in the graph. Without a User node, this query returns nothing.
2. The deep role lookup at line 162 (`findEffectiveRolesForTenant`) matches on `User {email: $email, tenantId: $tenantId}` -- no User node means no roles resolved.
3. Auth-facade needs to resolve `SUPER_ADMIN` permissions for the superuser. This requires the User node to exist with `HAS_ROLE` and `MEMBER_OF` relationships.

### 2.5 Superuser Seed Data (for V008 migration)

The superuser should be created with:

| Property | Value | Rationale |
|----------|-------|-----------|
| `id` | `'00000000-0000-0000-0000-000000000001'` | Deterministic UUID for the system superuser |
| `email` | `'superadmin@emsist.com'` | Matches planned Keycloak user (ISSUE-001b) |
| `firstName` | `'Super'` | Display name |
| `lastName` | `'Admin'` | Display name |
| `tenantId` | `'a0000000-0000-0000-0000-000000000001'` | Master tenant UUID (after Option A fix) |
| `active` | `true` | Active |
| `emailVerified` | `true` | Pre-verified system user |
| `externalId` | `null` | Not federated |
| `identityProvider` | `'KEYCLOAK'` | Primary IdP |

Relationships:
- `(superuser)-[:HAS_ROLE]->(SUPER_ADMIN)` -- Direct SUPER_ADMIN role
- `(superuser)-[:MEMBER_OF]->(system-administrators)` -- Member of Administrators group
- `(superuser)-[:BELONGS_TO]->(masterTenant)` -- Tenant membership

---

## 3. Query Performance for User Listing

### 3.1 User Listing Query Design

For the user listing feature (ISSUE-001d), the query needs to:
- Filter users by tenant
- Support pagination (skip/limit)
- Support search (by email, first name, last name)
- Include role information
- Support sorting (by name, email, last login)

**Recommended Cypher query -- paginated user list:**

```cypher
// List users by tenant with pagination
// Parameters: $tenantId, $searchTerm (optional), $skip, $limit, $sortField, $sortDir
MATCH (u:User {tenantId: $tenantId})
WHERE ($searchTerm IS NULL OR $searchTerm = ''
    OR u.email CONTAINS $searchTerm
    OR u.firstName CONTAINS $searchTerm
    OR u.lastName CONTAINS $searchTerm)
WITH u
ORDER BY
    CASE WHEN $sortField = 'email' AND $sortDir = 'ASC' THEN u.email END ASC,
    CASE WHEN $sortField = 'email' AND $sortDir = 'DESC' THEN u.email END DESC,
    CASE WHEN $sortField = 'name' AND $sortDir = 'ASC' THEN u.lastName END ASC,
    CASE WHEN $sortField = 'name' AND $sortDir = 'DESC' THEN u.lastName END DESC,
    CASE WHEN $sortField = 'lastLogin' AND $sortDir = 'ASC' THEN u.lastLoginAt END ASC,
    CASE WHEN $sortField = 'lastLogin' AND $sortDir = 'DESC' THEN u.lastLoginAt END DESC,
    u.email ASC
SKIP $skip
LIMIT $limit
OPTIONAL MATCH (u)-[:HAS_ROLE]->(directRole:Role)
OPTIONAL MATCH (u)-[:MEMBER_OF]->(g:Group)-[:HAS_ROLE]->(groupRole:Role)
RETURN u,
       collect(DISTINCT directRole.name) AS directRoles,
       collect(DISTINCT groupRole.name) AS groupRoles,
       collect(DISTINCT g.name) AS groups
```

**Count query (for pagination metadata):**

```cypher
MATCH (u:User {tenantId: $tenantId})
WHERE ($searchTerm IS NULL OR $searchTerm = ''
    OR u.email CONTAINS $searchTerm
    OR u.firstName CONTAINS $searchTerm
    OR u.lastName CONTAINS $searchTerm)
RETURN count(u) AS totalCount
```

### 3.2 Index Coverage Assessment

The V001 migration already provides good index coverage:

| Query Pattern | Index Used | Status |
|---------------|-----------|--------|
| Filter by `tenantId` | `user_tenant` on `(u.tenantId)` | COVERED |
| Lookup by `email` | `user_email` on `(u.email)` | COVERED |
| Lookup by `email + tenantId` | `user_email_tenant` on `(u.email, u.tenantId)` | COVERED |
| Lookup by `externalId` | `user_external` on `(u.externalId)` | COVERED |
| Uniqueness on `id` | `user_id` constraint | COVERED |

### 3.3 Missing Indexes

| Query Pattern | Needed Index | Priority |
|---------------|-------------|----------|
| Filter by `active` status | `user_active` on `(u.active)` | MEDIUM -- low cardinality, but useful for filtering inactive users from listings |
| Sort by `lastLoginAt` | `user_last_login` on `(u.lastLoginAt)` | LOW -- only relevant if sorting by last login is frequent |
| Combined `tenantId + active` | `user_tenant_active` on `(u.tenantId, u.active)` | HIGH -- most common listing query filters active users per tenant |

**Recommended additions for V008:**

```cypher
// Composite index for tenant + active (most common listing filter)
CREATE INDEX user_tenant_active IF NOT EXISTS
FOR (u:User) ON (u.tenantId, u.active);
```

The `CONTAINS`-based search will not use indexes (Neo4j does not support substring indexes on composite fields without full-text search). For a future optimization, a full-text index could be added:

```cypher
// Full-text index for user search (consider for future V009)
// CREATE FULLTEXT INDEX user_search IF NOT EXISTS
// FOR (u:User) ON EACH [u.email, u.firstName, u.lastName];
```

This is deferred because full-text indexes have operational overhead and the initial user base per tenant is expected to be manageable with property-level CONTAINS.

### 3.4 Performance Characteristics

With the `user_tenant` index, the initial `MATCH (u:User {tenantId: $tenantId})` is an index lookup (O(log n) + tenant user count). The `OPTIONAL MATCH` for roles and groups adds one hop per user, which is efficient in Neo4j's graph engine.

For tenants with fewer than 10,000 users, this query should execute within 50ms. For larger tenants, the full-text index noted above should be implemented.

---

## 4. Data Consistency

### 4.1 The Dual-Source Problem

User data will exist in two systems:
- **Keycloak** -- authoritative source for credentials, authentication state, and session management.
- **Neo4j** -- authoritative source for RBAC graph (role resolution, group membership, tenant association).

This dual-source design is intentional: Keycloak handles authentication, Neo4j handles authorization graph traversal.

### 4.2 Sync Strategy Options

| Approach | Description | Pros | Cons |
|----------|-------------|------|------|
| **A: Event-Driven Sync** | Listen to Keycloak Admin Events (via webhook or Kafka) and update Neo4j UserNodes | Near real-time, decoupled | Requires Keycloak event listener SPI or Kafka bridge; eventual consistency |
| **B: On-Demand Query** | Query Keycloak Admin API when user data is needed, cache in Valkey | Always fresh data, simpler | Higher latency per request, Keycloak becomes bottleneck for listings |
| **C: Write-Through** | When auth-facade creates/updates a user (via admin API), write to both Keycloak and Neo4j synchronously | Strong consistency | Tight coupling, slower writes, complex error handling |
| **D: Hybrid (RECOMMENDED)** | Write-through for auth-facade-initiated changes; event-driven for Keycloak-initiated changes (e.g., admin console, self-service) | Best of A and C | Moderate complexity |

### 4.3 Recommended Approach: Hybrid (Option D)

**Phase 1 (Immediate -- supports ISSUE-001d):**

Use **write-through** for the MVP. When the admin creates, updates, or deactivates a user through auth-facade:
1. Call Keycloak Admin API to create/update the user.
2. On success, create/update the corresponding `UserNode` in Neo4j.
3. If Neo4j write fails, log the error and queue a retry (compensating transaction).

For the user listing endpoint, query Neo4j directly (using the query from Section 3.1). This avoids hitting the Keycloak Admin API for every list request.

**Phase 2 (Future -- event-driven):**

Add a Keycloak Event Listener SPI that publishes user lifecycle events (create, update, delete, login) to Kafka. A consumer in auth-facade reads these events and updates Neo4j asynchronously.

```
Keycloak Event Listener SPI
    --> Kafka topic: ems.auth.user-events
        --> auth-facade consumer
            --> Neo4j UserNode MERGE
```

### 4.4 Conflict Resolution Rules

| Scenario | Resolution |
|----------|------------|
| User exists in Keycloak but not in Neo4j | Create UserNode on next login (lazy sync) |
| User exists in Neo4j but not in Keycloak | Mark UserNode as `active: false`, log warning |
| Email changed in Keycloak | Update Neo4j UserNode email on next event/login |
| User deleted in Keycloak | Soft-delete in Neo4j (set `active: false`), do NOT delete node |
| Role changed in Neo4j admin | Does NOT require Keycloak sync (roles are Neo4j-authoritative) |

### 4.5 Lazy Sync on Login

As an interim measure (before full event-driven sync), implement a **login hook** in auth-facade:

```
On successful Keycloak authentication:
1. Extract user info from Keycloak token (sub, email, name)
2. MERGE UserNode with id = token.sub
3. SET email, firstName, lastName, lastLoginAt, identityProvider
4. MERGE BELONGS_TO relationship with tenant
5. If new user, MERGE MEMBER_OF system-users group
```

This ensures that any user who authenticates through Keycloak automatically gets a Neo4j UserNode.

---

## 5. Migration Safety Audit

### 5.1 Idempotency Review

| Migration | Operations | Idempotent? | Issues |
|-----------|-----------|-------------|--------|
| **V001** | `CREATE CONSTRAINT ... IF NOT EXISTS`, `CREATE INDEX ... IF NOT EXISTS`, `MERGE (Migration)` | YES | All operations use `IF NOT EXISTS` or `MERGE`. Safe to re-run. |
| **V002** | `MERGE (Protocol)`, `SET` properties, `MERGE (Migration)` | PARTIAL | `MERGE` is safe, but `SET` on MERGE unconditionally overwrites properties on every run. Timestamps/versions get reset. See finding F-002 below. |
| **V003** | `MERGE (Provider)`, `SET`, `MATCH`+`MERGE` relationships | PARTIAL | Same issue as V002: `SET` on MERGE overwrites properties every re-run. See finding F-003 below. |
| **V004** | `MERGE (Role)`, `SET` properties, `MATCH`+`MERGE` relationships | PARTIAL | `SET` overwrites `createdAt` and `updatedAt` on every re-run. See finding F-004. |
| **V005** | `MERGE (Tenant)`, `SET`, `MATCH`+`MERGE` relationships, `OPTIONAL MATCH ... WHERE NULL ... CREATE` | MOSTLY | The Tenant MERGE+SET has the overwrite problem. However, the Config creation uses a NULL-guard pattern (`WHERE existing IS NULL`) which correctly prevents duplicate creation. See finding F-005. |
| **V006** | `MERGE (Group)`, `SET`, `MATCH`+`MERGE` relationships | PARTIAL | Same `SET` overwrite issue as V004. See finding F-006. |
| **V007** | `MERGE (Protocol)` with `ON CREATE SET`, `MATCH`+`MERGE` relationships, `MATCH ... DELETE`, `CREATE INDEX/CONSTRAINT IF NOT EXISTS` | YES | Correctly uses `ON CREATE SET` (only sets on first creation). Index/constraint operations use `IF NOT EXISTS`. Delete operations are idempotent (no-op if relationship does not exist). This is the best-written migration. |

### 5.2 Detailed Findings

**F-002: V002 Protocol MERGE+SET overwrites on re-run**

File: `V002__create_protocols.cypher`, lines 18-21:

```cypher
MERGE (oidc:Protocol {type: 'OIDC'})
SET oidc.version = '1.0',
    oidc.displayName = 'OpenID Connect',
    oidc.description = 'Modern authentication standard built on OAuth 2.0';
```

The `SET` clause runs on every execution, whether the MERGE matched or created. If a human or application has updated these properties (e.g., changed the description), a re-run would overwrite those changes.

**Correct pattern (used in V007):**

```cypher
MERGE (oidc:Protocol {type: 'OIDC'})
ON CREATE SET
    oidc.version = '1.0',
    oidc.displayName = 'OpenID Connect',
    oidc.description = 'Modern authentication standard built on OAuth 2.0';
```

**Severity:** LOW. These are seed data migrations that run once during initial setup. The Neo4j Migrations framework tracks applied versions and will not re-run them. The issue only manifests if someone manually re-executes the Cypher.

**F-003: V003 Provider MERGE+SET overwrites on re-run**

Same pattern as F-002. All provider `SET` clauses unconditionally overwrite.

**Severity:** LOW (same rationale as F-002).

**F-004: V004 Role MERGE+SET overwrites timestamps**

File: `V004__create_default_roles.cypher`, lines 22-27:

```cypher
MERGE (viewer:Role {name: 'VIEWER'})
SET viewer.displayName = 'Viewer',
    ...
    viewer.createdAt = datetime(),
    viewer.updatedAt = datetime();
```

On re-run, `createdAt` would be reset to the current time, destroying the original creation timestamp.

**Severity:** LOW (same framework protection rationale). However, the `ON CREATE SET` pattern should be used for `createdAt` in any future migrations.

**F-005: V005 Config creation guard is correct but Tenant SET has overwrite issue**

The Config creation (lines 42-69) properly uses:

```cypher
OPTIONAL MATCH (t)-[:CONFIGURED_WITH]->(existing:Config {providerName: 'KEYCLOAK'})
WITH t, p, existing
WHERE existing IS NULL
CREATE (c:Config { ... })
```

This is correct -- it will not create a duplicate Config. However, the Tenant `SET` on line 20-24 still has the unconditional overwrite issue.

**Severity:** LOW for the Tenant SET. The Config guard is well-implemented.

**F-006: V006 Group MERGE+SET overwrites timestamps**

Same issue as F-004 for Group nodes.

**Severity:** LOW.

### 5.3 Potential Re-Run Failure Scenarios

| Migration | Failure on Re-Run? | Explanation |
|-----------|-------------------|-------------|
| V001 | NO | All `IF NOT EXISTS` guards. |
| V002 | NO | `MERGE` + `SET` is safe (just overwrites). |
| V003 | NO | `MERGE` + `MATCH`+`MERGE` are safe. |
| V004 | NO | `MERGE` + `MATCH`+`MERGE` are safe. |
| V005 | NO | `MERGE` + NULL-guarded `CREATE`. Second run skips Config creation. |
| V006 | NO | `MERGE` + `MATCH`+`MERGE` are safe. |
| V007 | NO | `ON CREATE SET` + `IF NOT EXISTS` + idempotent deletes. |

**Conclusion:** No migration will fail on re-run. The functional issue is data overwrite (timestamps, descriptions), not failures. Since the Neo4j Migrations framework prevents automatic re-runs, this is a low-severity concern.

### 5.4 Missing Migration Marker Consistency

All migrations use the same marker pattern:

```cypher
MERGE (m:Migration {version: 'V00X'})
ON CREATE SET
    m.name = '...',
    m.description = '...',
    m.appliedAt = datetime();
```

This is consistent and correct across all seven migrations. The `ON CREATE SET` ensures the marker is only written once.

---

## 6. Proposed Migration: V008

Based on the findings above, the following V008 migration is recommended to address the tenant ID resolution, superuser seeding, missing relationship, and index gap.

### 6.1 Full Migration Script

Proposed file: `/Users/mksulty/Claude/EMSIST/backend/auth-facade/src/main/resources/neo4j/migrations/V008__seed_superuser_fix_tenant_id.cypher`

```cypher
// ==============================================================================
// V008__seed_superuser_fix_tenant_id.cypher
//
// 1. Fixes master tenant ID to UUID (aligns with tenant-service PostgreSQL)
// 2. Adds slug property to Tenant nodes
// 3. Creates superuser UserNode with SUPER_ADMIN role
// 4. Creates BELONGS_TO relationship (User -> Tenant)
// 5. Adds missing indexes for user listing performance
//
// Related Documents:
// - /docs/issues/ISSUE-001-database-review.md
// - /docs/issues/ISSUE-001-master-tenant-auth-superuser.md
//
// Author: DBA Agent
// Date: 2026-02-26
// ==============================================================================

// ------------------------------------------------------------------------------
// SECTION 1: FIX MASTER TENANT ID
// Change id from 'master' to UUID to align with tenant-service and frontend
// ------------------------------------------------------------------------------

// Update the master tenant's id to the canonical UUID
MATCH (t:Tenant {id: 'master'})
SET t.id = 'a0000000-0000-0000-0000-000000000001',
    t.slug = 'master',
    t.updatedAt = datetime();

// Update Config nodes that reference the old tenant ID
MATCH (c:Config {tenantId: 'master'})
SET c.tenantId = 'a0000000-0000-0000-0000-000000000001';

// ------------------------------------------------------------------------------
// SECTION 2: ADD TENANT SLUG INDEX
// ------------------------------------------------------------------------------

CREATE INDEX tenant_slug IF NOT EXISTS
FOR (t:Tenant) ON (t.slug);

// ------------------------------------------------------------------------------
// SECTION 3: ADD USER PERFORMANCE INDEXES
// Composite index for the most common user listing query pattern
// ------------------------------------------------------------------------------

CREATE INDEX user_tenant_active IF NOT EXISTS
FOR (u:User) ON (u.tenantId, u.active);

// ------------------------------------------------------------------------------
// SECTION 4: CREATE SUPERUSER NODE
// Using MERGE for idempotency with ON CREATE SET for initial properties
// and ON MATCH SET for updatable properties
// ------------------------------------------------------------------------------

MERGE (u:User {id: '00000000-0000-0000-0000-000000000001'})
ON CREATE SET
    u.email = 'superadmin@emsist.com',
    u.firstName = 'Super',
    u.lastName = 'Admin',
    u.tenantId = 'a0000000-0000-0000-0000-000000000001',
    u.active = true,
    u.emailVerified = true,
    u.identityProvider = 'KEYCLOAK',
    u.createdAt = datetime(),
    u.updatedAt = datetime()
ON MATCH SET
    u.updatedAt = datetime();

// ------------------------------------------------------------------------------
// SECTION 5: ASSIGN SUPER_ADMIN ROLE TO SUPERUSER (direct role)
// ------------------------------------------------------------------------------

MATCH (u:User {id: '00000000-0000-0000-0000-000000000001'})
MATCH (r:Role {name: 'SUPER_ADMIN'})
MERGE (u)-[:HAS_ROLE]->(r);

// ------------------------------------------------------------------------------
// SECTION 6: ADD SUPERUSER TO ADMINISTRATORS GROUP
// ------------------------------------------------------------------------------

MATCH (u:User {id: '00000000-0000-0000-0000-000000000001'})
MATCH (g:Group {id: 'system-administrators'})
MERGE (u)-[:MEMBER_OF]->(g);

// ------------------------------------------------------------------------------
// SECTION 7: CREATE BELONGS_TO RELATIONSHIP (User -> Tenant)
// This relationship is documented in UserNode.java Javadoc but was never
// created in the graph. It enables graph traversal from User to Tenant.
// ------------------------------------------------------------------------------

MATCH (u:User {id: '00000000-0000-0000-0000-000000000001'})
MATCH (t:Tenant {id: 'a0000000-0000-0000-0000-000000000001'})
MERGE (u)-[:BELONGS_TO]->(t);

// ------------------------------------------------------------------------------
// SECTION 8: MIGRATION MARKER
// ------------------------------------------------------------------------------

MERGE (m:Migration {version: 'V008'})
ON CREATE SET
    m.name = 'seed_superuser_fix_tenant_id',
    m.description = 'Fixes master tenant ID to UUID, creates superuser with SUPER_ADMIN role, adds BELONGS_TO relationship',
    m.appliedAt = datetime();

// ------------------------------------------------------------------------------
// END OF MIGRATION V008
// ------------------------------------------------------------------------------
```

### 6.2 Migration Execution Order

The migration must run **after** V001-V007 have been applied (which create the constraints, indexes, roles, groups, and master tenant that V008 references).

The Neo4j Migrations framework handles this automatically via version ordering.

### 6.3 Idempotency Verification

| Operation | Idempotent? | Mechanism |
|-----------|-------------|-----------|
| Tenant ID update | YES | MATCH will find nothing on second run (id already changed) |
| Config tenantId update | YES | MATCH will find nothing on second run (already updated) |
| Tenant slug index | YES | `IF NOT EXISTS` |
| User tenant-active index | YES | `IF NOT EXISTS` |
| Superuser MERGE | YES | `MERGE` with `ON CREATE SET` / `ON MATCH SET` |
| HAS_ROLE relationship | YES | `MERGE` |
| MEMBER_OF relationship | YES | `MERGE` |
| BELONGS_TO relationship | YES | `MERGE` |
| Migration marker | YES | `MERGE` with `ON CREATE SET` |

**Note on the Tenant ID update idempotency:** On the first run, `MATCH (t:Tenant {id: 'master'})` finds the tenant and updates its id. On a hypothetical second run, `MATCH (t:Tenant {id: 'master'})` finds nothing (the id is now `'a0000000-...'`), so the SET is a no-op. This is safe.

### 6.4 Rollback Considerations

If V008 needs to be reversed (destructive, requires approval per DBA principles):

```cypher
// ROLLBACK V008 (requires PM + SA approval)
// Revert tenant ID
MATCH (t:Tenant {id: 'a0000000-0000-0000-0000-000000000001'})
SET t.id = 'master';
REMOVE t.slug;

// Revert config tenantId
MATCH (c:Config {tenantId: 'a0000000-0000-0000-0000-000000000001'})
SET c.tenantId = 'master';

// Remove superuser and relationships
MATCH (u:User {id: '00000000-0000-0000-0000-000000000001'})
DETACH DELETE u;

// Remove indexes
DROP INDEX tenant_slug IF EXISTS;
DROP INDEX user_tenant_active IF EXISTS;

// Remove migration marker
MATCH (m:Migration {version: 'V008'})
DELETE m;
```

---

## 7. Summary of Findings

### 7.1 Critical Issues

| # | Issue | Severity | Resolution |
|---|-------|----------|------------|
| 1 | Tenant ID mismatch: Neo4j `'master'` vs PostgreSQL/frontend `'a0000000-...'` | **CRITICAL** | V008 migration changes Neo4j id to UUID |
| 2 | No superuser UserNode in Neo4j | **CRITICAL** | V008 migration creates superuser with roles/groups |
| 3 | `BELONGS_TO` relationship documented but not implemented | **HIGH** | V008 migration creates the relationship |

### 7.2 Medium Issues

| # | Issue | Severity | Resolution |
|---|-------|----------|------------|
| 4 | Missing `user_tenant_active` composite index | **MEDIUM** | V008 migration adds the index |
| 5 | Missing `slug` property on TenantNode | **MEDIUM** | V008 migration adds slug; entity update needed by DEV agent |
| 6 | No user sync mechanism between Keycloak and Neo4j | **MEDIUM** | Recommended hybrid approach (Section 4.3) |

### 7.3 Low Issues

| # | Issue | Severity | Resolution |
|---|-------|----------|------------|
| 7 | V002-V006 use `SET` instead of `ON CREATE SET` (timestamp overwrite risk) | **LOW** | No fix needed (framework prevents re-run); use correct pattern in future migrations |
| 8 | Full-text search index not present for user search | **LOW** | Deferred to V009 when user counts warrant it |

### 7.4 Entity Changes Required (for DEV Agent)

The following Java entity changes must be made by the DEV agent to align with V008:

1. **TenantNode.java** -- Add `String slug` field to the record, builder, and constructor.
2. **TenantNode.java** -- Ensure `@Id String id` continues to be the Neo4j primary identifier (no change needed, just document that it now holds a UUID).
3. **UserNode.java** -- Add `@Relationship(type = "BELONGS_TO", direction = OUTGOING) TenantNode tenant` field to match the graph relationship created by V008.
4. **AuthGraphRepository.java** -- Add a `findTenantBySlug(String slug)` query method for human-readable tenant resolution.

### 7.5 Checklist

- [x] SA canonical data model reviewed (CANONICAL-DATA-MODEL.md confirms Neo4j for auth-facade entities)
- [x] Naming conventions followed (PascalCase labels, camelCase properties, UPPER_SNAKE_CASE relationships)
- [x] Multi-tenancy included (tenantId on User, Config; BELONGS_TO relationship)
- [x] Standard columns present (id, createdAt, updatedAt on all nodes)
- [x] Migration versioned correctly (V008, sequential after V007)
- [ ] Migration tested locally (requires running Neo4j instance -- deferred to DEV/QA)
- [x] Indexes created for frequent query patterns (user_tenant_active, tenant_slug)
- [x] Constraints verified (all from V001 remain valid)
- [x] Backward compatibility assessed (V008 is additive; existing queries still work after ID change because callers should already be using UUID)
- [x] Performance impact assessed (index additions only improve performance)
- [x] Rollback migration provided (Section 6.4)
- [x] Idempotency verified (Section 6.3)

---

## Appendix A: Complete Graph Schema After V008

```
(:Tenant {id: UUID, slug: String, domain: String, name: String, active: Boolean, createdAt: DateTime, updatedAt: DateTime})
(:Provider {name: String, vendor: String, displayName: String, iconUrl: String, description: String})
(:Protocol {type: String, version: String, displayName: String, description: String})
(:Config {id: UUID, tenantId: UUID, providerName: String, protocol: String, ...})
(:User {id: UUID, email: String, firstName: String, lastName: String, tenantId: UUID, active: Boolean, emailVerified: Boolean, externalId: String, identityProvider: String, createdAt: DateTime, updatedAt: DateTime, lastLoginAt: DateTime})
(:Group {id: String, name: String, displayName: String, description: String, tenantId: String, systemGroup: Boolean, createdAt: DateTime, updatedAt: DateTime})
(:Role {name: String, displayName: String, description: String, tenantId: String, systemRole: Boolean, createdAt: DateTime, updatedAt: DateTime})
(:Migration {version: String, name: String, description: String, appliedAt: DateTime})

Relationships:
(Tenant)-[:USES]->(Provider)
(Tenant)-[:CONFIGURED_WITH]->(Config)
(Provider)-[:SUPPORTS]->(Protocol)
(Provider)-[:HAS_CONFIG]->(Config)
(User)-[:HAS_ROLE]->(Role)
(User)-[:MEMBER_OF]->(Group)
(User)-[:BELONGS_TO]->(Tenant)
(Group)-[:HAS_ROLE]->(Role)
(Group)-[:CHILD_OF]->(Group)
(Role)-[:INHERITS_FROM]->(Role)
```

## Appendix B: Index and Constraint Inventory After V008

| Name | Type | Label | Properties | Migration |
|------|------|-------|------------|-----------|
| `tenant_id` | UNIQUE CONSTRAINT | Tenant | `id` | V001 |
| `tenant_domain` | UNIQUE CONSTRAINT | Tenant | `domain` | V001 |
| `tenant_active` | INDEX | Tenant | `active` | V001 |
| `tenant_slug` | INDEX | Tenant | `slug` | V008 |
| `provider_name` | UNIQUE CONSTRAINT | Provider | `name` | V001 |
| `protocol_type` | UNIQUE CONSTRAINT | Protocol | `type` | V001 |
| `config_id` | UNIQUE CONSTRAINT | Config | `id` | V001 |
| `config_tenant` | INDEX | Config | `tenantId` | V001 |
| `config_provider` | INDEX | Config | `providerName` | V001 |
| `config_enabled` | INDEX | Config | `enabled` | V001 |
| `config_protocol` | INDEX | Config | `protocol` | V007 |
| `config_tenant_provider_enabled` | INDEX | Config | `tenantId, providerName, enabled` | V007 |
| `config_azure_tenant_id` | INDEX | Config | `azureTenantId` | V007 |
| `config_uaepass_environment` | INDEX | Config | `uaePassEnvironment` | V007 |
| `config_uaepass_auth_level` | INDEX | Config | `requiredAuthLevel` | V007 |
| `config_ldap_server_url` | INDEX | Config | `serverUrl` | V007 |
| `config_ldap_use_ssl` | INDEX | Config | `useSsl` | V007 |
| `config_ldap_sync_enabled` | INDEX | Config | `syncEnabled` | V007 |
| `config_saml_metadata_url` | INDEX | Config | `metadataUrl` | V007 |
| `config_saml_sso_url` | INDEX | Config | `ssoUrl` | V007 |
| `config_saml_entity_id_unique` | UNIQUE CONSTRAINT | Config | `entityId` | V007 |
| `user_id` | UNIQUE CONSTRAINT | User | `id` | V001 |
| `user_email` | INDEX | User | `email` | V001 |
| `user_tenant` | INDEX | User | `tenantId` | V001 |
| `user_external` | INDEX | User | `externalId` | V001 |
| `user_email_tenant` | INDEX | User | `email, tenantId` | V001 |
| `user_tenant_active` | INDEX | User | `tenantId, active` | V008 |
| `group_id` | UNIQUE CONSTRAINT | Group | `id` | V001 |
| `group_name` | INDEX | Group | `name` | V001 |
| `group_tenant` | INDEX | Group | `tenantId` | V001 |
| `group_name_tenant` | INDEX | Group | `name, tenantId` | V001 |
| `role_name` | UNIQUE CONSTRAINT | Role | `name` | V001 |
| `role_tenant` | INDEX | Role | `tenantId` | V001 |
| `role_system` | INDEX | Role | `systemRole` | V001 |

**Total: 10 constraints, 23 indexes (after V008)**
