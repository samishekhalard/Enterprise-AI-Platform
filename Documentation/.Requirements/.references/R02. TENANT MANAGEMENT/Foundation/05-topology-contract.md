# R02 Foundation Track — 05 Topology Contract (Design Options)

**Status:** [AS-IS] topology evidence + [FROZEN] auth graph decision + [OPEN] definition-service topology
**Date:** 2026-03-24 (as-is evidence) | 2026-03-24 (auth topology frozen)
**Classification:** Auth graph topology decided. Definition-service topology still requires user verdict.

---

## FROZEN: Auth Graph Topology Decision (Revision 2)

> **Decision date:** 2026-03-24
> **Revision:** 2 — auth-facade reclassified as transition-only (removed after migration); api-gateway becomes target auth edge; tenant-service gains provider config
> **Status:** FROZEN — binding for R02 and WP-ARCH-ALIGN
> **Cross-reference:** `03-ownership-boundaries.md` § FROZEN: Target Auth Ownership Model (Revision 2)

### Decision

**Neo4j is removed from the auth target domain.** The auth graph (TenantNode, UserNode, GroupNode, RoleNode, ProviderNode, ConfigNode, ProtocolNode) is legacy/as-is only. No R02 design may target Neo4j for auth identity, RBAC, provider config, or session data.

**auth-facade is transition-only, then removed.** Its responsibilities migrate to api-gateway (auth edge endpoints) and tenant-service (data ownership, RBAC, provider config, session control). auth-facade is not an end-state service.

### Target Auth Storage

| Store | State | Target Role |
|-------|-------|------------|
| **Keycloak** | TARGET | Authentication only (login, MFA, token issuance, federation) |
| **tenant-service PostgreSQL** | TARGET | Authoritative owner of tenant users, RBAC, groups, memberships, provider config, sessions, revocation, session history |
| **api-gateway** | TARGET | Edge + target home for auth endpoints (login, token refresh, logout) migrated from auth-facade |
| **Valkey** | TARGET | Cache only (tokens, sessions, routing metadata) |
| **auth-facade** | **[TRANSITION]** — then removed | Current auth orchestrator. Operates during migration. Not target. |
| **Neo4j (auth-facade)** | **[LEGACY/AS-IS]** — auth graph remains operational during transition but is not the target store |

### What This Means for Topology Options Below

- **Options 1–4 in Part B are now historical** — they documented the design space before the auth decision was frozen.
- The auth graph topology question is **closed**: Neo4j is not the target for auth regardless of shared vs per-tenant.
- The only **open topology question** is for **definition-service** (canonical object types), which continues to use Neo4j. definition-service topology (shared vs per-tenant) still requires a user verdict.
- Any remaining system graph discussion is **non-auth only**.

### Auth Graph Transition Implications

- The existing auth Neo4j graph (V001–V009 migrations) remains operational as-is during transition.
- No new auth features should be built against Neo4j.
- The graph-per-tenant code path (`AUTH_GRAPH_PER_TENANT_ENABLED`) becomes irrelevant for auth — it will not be activated.
- auth-facade continues to operate during transition but all its responsibilities must be migrated before it can be removed.
- auth-facade edge endpoints (login, token refresh, logout, MFA verify) migrate to api-gateway.
- auth-facade data ownership (provider config, RBAC graph, identity data) migrates to tenant-service PostgreSQL.
- Migration from Neo4j auth graph to tenant-service PostgreSQL is a blocker documented in `06-forks-gaps-blockers.md`.

---

## Part A: As-Is Topology Evidence

### What Exists in the Codebase Today

The codebase contains **two complete, non-conflicting code paths** for Neo4j topology, controlled by a single feature flag:

| Code Path | Flag Value | Runtime Status |
|-----------|-----------|----------------|
| Shared graph (single database) | `AUTH_GRAPH_PER_TENANT_ENABLED=false` (default) | **ACTIVE** |
| Graph-per-tenant (multi-database) | `AUTH_GRAPH_PER_TENANT_ENABLED=true` | **DORMANT** |

### Shared Graph Path (Active)

When the flag is `false` (current default):

1. `TenantContextFilter` extracts `X-Tenant-ID` header → sets string ThreadLocal only
2. `TenantAwareAuthDatabaseSelectionProvider.getDatabaseSelection()` → returns `DatabaseSelection.undecided()`
3. Spring Data Neo4j uses the default connection from `spring.neo4j.uri`
4. All tenants' graph nodes coexist in the default `neo4j` database
5. Tenant isolation is by `tenantId` field on graph nodes (label + property filtering)
6. `Neo4jDataInitializer` runs seed data on startup (`@ConditionalOnExpression` — only when flag is false)

**Evidence:** `TenantAwareAuthDatabaseSelectionProvider.java`, `TenantContextFilter.java`, `Neo4jDataInitializer.java`

### Graph-Per-Tenant Path (Dormant)

When the flag is `true`:

1. `TenantContextFilter` extracts `X-Tenant-ID` → calls `TenantRoutingResolver.resolve()`
2. Resolver checks Valkey cache (`tenant:routing:{id}:auth-facade`, 5-min TTL)
3. Cache miss → calls tenant-service `GET /internal/routing/{tenantIdentifier}`
4. Returns `TenantRoutingContext(tenantId, slug, authDbName, defaultLocale, baselineVersion)`
5. Sets `TenantRoutingContextHolder.setCurrent(context)` (ThreadLocal)
6. `TenantAwareAuthDatabaseSelectionProvider.getDatabaseSelection()` → returns `DatabaseSelection.byName(context.authDbName())`
7. All Neo4j queries route to the tenant-specific database

**Provisioning flow** (also behind `@ConditionalOnProperty`):
- `POST /internal/provision/tenants/{tenantId}` triggers `AuthTenantProvisioningService`
- Creates Neo4j database: `CREATE DATABASE {dbName} IF NOT EXISTS`
- Applies `auth-tenant-bootstrap.cypher` (constraints, indexes, protocols, providers, roles, groups)
- Seeds tenant graph data (TenantNode, ConfigNode, provider links)
- Provisions Keycloak realm if not master

**Evidence:** `AuthTenantProvisioningService.java`, `InternalProvisioningController.java`, `TenantRoutingResolver.java`, `auth-tenant-bootstrap.cypher`

### Control-Plane Schema (Tenant-Service)

Migrations V7 and V8 add routing metadata columns to the `tenants` table:

| Column | Type | Purpose |
|--------|------|---------|
| `auth_db_name` | VARCHAR(255) | Neo4j database name for auth-facade |
| `definitions_db_name` | VARCHAR(255) | Neo4j database name for definition-service |
| `identity_endpoint` | VARCHAR(512) | Reserved for future physical separation |
| `baseline_version` | VARCHAR(50) | Control-plane schema version |
| `data_residency_region` | VARCHAR(20) | Compliance region (UAE, EU, US, APAC) |

Supporting tables: `retention_policies`, `tenant_database_logs` (provisioning audit trail)

**Evidence:** `V7__tenant_database_routing.sql`, `V8__per_service_routing_metadata.sql`

### Definition-Service Gap

definition-service uses Neo4j but has **no** tenant-aware database routing. It uses the default Spring Data Neo4j connection. Per-tenant routing for definitions would require implementing a `DatabaseSelectionProvider` similar to auth-facade.

**Evidence:** `definition-service/config/Neo4jConfig.java` — only sets Cypher DSL dialect, no `DatabaseSelectionProvider` bean.

### Neo4j Migrations (Shared Graph)

9 migrations exist in `auth-facade/src/main/resources/neo4j/migrations/`:

| Migration | Content |
|-----------|---------|
| V001 | Constraints and indexes (tenant_id, provider_name, protocol_type, etc.) |
| V002 | Protocol nodes (OIDC, SAML, LDAP, OAUTH2) |
| V003 | Provider nodes (KEYCLOAK, AUTH0, OKTA, AZURE_AD, GOOGLE, etc.) |
| V004 | Default role hierarchy (SUPER_ADMIN → ADMIN → MANAGER → USER → VIEWER) |
| V005 | Master tenant + Keycloak config + OIDC link |
| V006 | Default groups |
| V007 | Provider config extensions |
| V008 | Fix master tenant seed + superuser (`BELONGS_TO` edge created here) |
| V009 | Update superadmin email |

Separate bootstrap file `auth-tenant-bootstrap.cypher` (182 lines) replicates V001–V004 content for new per-tenant databases.

### TenantNode Model

```java
@Node("Tenant")
public record TenantNode(
    @Id String id,
    String domain,
    String name,
    boolean active,
    @Relationship(type = "USES", direction = OUTGOING) List<ProviderNode> providers,
    @Relationship(type = "CONFIGURED_WITH", direction = OUTGOING) List<ConfigNode> configurations,
    Instant createdAt,
    Instant updatedAt
)
```

**No `databaseName` or routing field on TenantNode.** Routing metadata lives in tenant-service control-plane only.

---

## Part B: Auth Topology Options [HISTORICAL — Decision Frozen]

> **Note:** The options below document the design space that was evaluated before the auth topology decision was frozen on 2026-03-24. They are retained as decision record context. The frozen decision is: **Neo4j removed from auth target domain** (see § FROZEN above). These options no longer apply to auth. For definition-service topology, a separate evaluation is needed.

### Option 1: Stay on Shared Graph (Flag Remains Off)

**Description:** All tenants continue sharing the default `neo4j` database. Tenant isolation by `tenantId` property on nodes. The graph-per-tenant code remains dormant.

**Node model impact:**
- No change. Current entity annotations work as-is.
- `UserNode.BELONGS_TO` annotation gap remains (edge exists in data, not in entity model).

**Relationship model impact:**
- No change. All relationships traverse within a single graph.
- Cross-tenant queries are possible (risk or feature, depending on use case).

**Storage/routing impact:**
- Single Neo4j database. No `DatabaseSelectionProvider` routing.
- definition-service and auth-facade share the same graph space.
- No Valkey routing cache needed.

**Migration impact:**
- None. Current V001–V009 migrations are sufficient.
- No need for `auth-tenant-bootstrap.cypher` or provisioning API.

**Risk:**
- **Tenant data leak via query bugs** — a missing `WHERE tenantId = $tenantId` clause returns cross-tenant data.
- **Scale ceiling** — single graph must hold all tenants' identity data. Neo4j Community Edition has no multi-database support; Enterprise required only if switching to Option 2 later.
- **No data residency compliance** — all tenant data co-located. Cannot satisfy UAE/EU/APAC region constraints at the graph layer.
- **Index contention** — all tenants' nodes share indexes.

**What R02 would need to change:**
- R02 can proceed with shared graph assumptions.
- Factsheet prototype tabs (Users, Integrations, etc.) query by tenantId filter — no routing logic needed.
- Provisioning step tracking remains PostgreSQL-only (no Neo4j database creation step).

---

### Option 2: Enable Graph-Per-Tenant (Flip the Flag)

**Description:** Set `AUTH_GRAPH_PER_TENANT_ENABLED=true`. Each tenant gets its own Neo4j database. Routing via Valkey-cached control-plane metadata.

**Node model impact:**
- Per-tenant databases contain isolated copies of Protocol, Provider, Role, Group nodes (seeded by `auth-tenant-bootstrap.cypher`).
- TenantNode becomes the root of an isolated graph rather than one of many in a shared graph.
- `UserNode.BELONGS_TO` becomes implicit (the user is IN the tenant's database = belongs to that tenant).
- System-wide roles (`tenantId=null`) need a design decision: live in every tenant DB (duplicated) or in a shared system DB?

**Relationship model impact:**
- No cross-tenant graph traversal possible (physical isolation).
- `RoleNode.INHERITS_FROM` hierarchy is duplicated per tenant database.
- Global provider definitions (ProviderNode) are duplicated per tenant database.

**Storage/routing impact:**
- Neo4j Enterprise Edition required (multi-database).
- Valkey caches routing metadata (5-min TTL, dual-key: slug + UUID).
- tenant-service control-plane provides `auth_db_name` per tenant.
- definition-service continues on shared graph unless separately routed (using `definitions_db_name`).

**Migration impact:**
- Existing shared-graph migrations (V001–V009) apply to master tenant database only.
- New tenant databases bootstrapped by `auth-tenant-bootstrap.cypher`.
- **Migration of existing tenants** from shared graph to per-tenant databases is not implemented — no code exists for splitting an existing shared graph into per-tenant databases.
- Flyway-style versioned migrations for per-tenant databases need a strategy (currently only bootstrap, no incremental per-tenant migrations).

**Risk:**
- **Neo4j Enterprise licensing cost** — multi-database is an Enterprise feature.
- **No existing-tenant migration path** — the provisioning code creates NEW databases but cannot split existing shared-graph data.
- **Operational complexity** — N databases to backup, monitor, upgrade.
- **definition-service gap** — continues on shared graph. Inconsistent isolation model.
- **Dormant code activation risk** — feature has not been exercised in production. Tests exist but integration coverage in a multi-tenant deployment is unverified.

**What R02 would need to change:**
- Tenant provisioning flow gains a Neo4j database creation step (already scaffolded).
- Tenant factsheet could show database-level health per tenant (database status, size, migration version).
- Tenant suspension/decommission needs database-level operations (offline/drop database).
- R02 PRD must account for provisioning failure modes (database creation timeout, bootstrap failure, partial provisioning).

---

### Option 3: Hybrid — Shared Graph Now, Per-Tenant Later (Phased Cutover)

**Description:** Keep the flag off for R02 delivery. Design R02 against shared-graph assumptions. Plan a cutover milestone for per-tenant activation post-R02.

**Node model impact:**
- R02 designs against the shared-graph model.
- Per-tenant model is deferred but architecturally protected (no code changes that would block future activation).

**Relationship model impact:**
- Same as Option 1 for R02 scope.
- R02 queries must include `tenantId` filtering (which they already do).

**Storage/routing impact:**
- Same as Option 1 for R02 scope.
- Control-plane columns (`auth_db_name`, `definitions_db_name`) remain null/unused.

**Migration impact:**
- None for R02.
- Post-R02: requires a data migration plan to split shared graph into per-tenant databases (not yet implemented).

**Risk:**
- **Deferred complexity** — the migration from shared to per-tenant is the hardest step and is currently unimplemented.
- **Design lock-in** — R02 designs that assume shared graph (e.g., cross-tenant admin queries) may not work after cutover.
- **definition-service remains unresolved** — neither shared nor per-tenant is explicitly committed to.

**What R02 would need to change:**
- R02 proceeds with shared-graph query patterns.
- R02 must NOT design features that depend on cross-tenant graph traversal (those would break on cutover).
- R02 provisioning flow remains PostgreSQL + Keycloak only (no Neo4j database step).
- R02 factsheet does not show per-tenant database health.

---

### Option 4: Topology-Neutral Contract

**Description:** R02 defines an abstract data access contract that is topology-agnostic. Services query through a repository interface that hides whether the underlying store is shared or per-tenant.

**Node model impact:**
- Entity annotations remain as-is.
- Repository interfaces add explicit `tenantId` parameters (already the case for most queries).
- No assumption about physical database boundaries in the domain layer.

**Relationship model impact:**
- Queries are always tenant-scoped regardless of physical topology.
- Cross-tenant queries are explicitly marked as admin/system operations.

**Storage/routing impact:**
- `DatabaseSelectionProvider` handles routing transparently.
- Services don't need to know whether they're on shared or per-tenant graph.

**Migration impact:**
- None for R02.
- Topology switch becomes an infrastructure decision, not an application code change.

**Risk:**
- **Abstraction overhead** — adds a contract layer that may not be needed if topology is decided.
- **False safety** — the contract hides real differences (e.g., cross-tenant joins are free in shared graph, impossible in per-tenant).
- **definition-service still needs its own decision** — the neutral contract doesn't resolve whether definitions are shared or per-tenant.

**What R02 would need to change:**
- R02 query patterns must always include tenant scoping.
- R02 must not assume cross-tenant graph traversal.
- R02 provisioning flow remains abstract (steps vary by topology).
- Factsheet health tab design must be topology-neutral (show what's queryable, not database internals).

---

## Part C: Decision Dependencies

### Decisions — Current Status

| Decision | Status | Resolution |
|----------|--------|------------|
| **Auth graph topology** | **FROZEN** | Neo4j removed from auth target domain. Auth data migrates to tenant-service PostgreSQL. |
| **Auth graph per-tenant flag** | **FROZEN** | `AUTH_GRAPH_PER_TENANT_ENABLED` will not be activated. Graph-per-tenant code is legacy. |
| **Neo4j Edition (for auth)** | **FROZEN** | Irrelevant — auth does not target Neo4j. |
| **System roles location** | **FROZEN** | tenant-service PostgreSQL — no Neo4j role hierarchy in target. |
| **Existing-tenant migration (Neo4j → PG)** | **OPEN — blocker** | Migration path from Neo4j auth graph to tenant-service PostgreSQL is not implemented. Documented in `06-forks-gaps-blockers.md`. |
| **UserNode.BELONGS_TO** | **FROZEN** | Legacy — will not be fixed in Neo4j entity model. Relationship migrates to tenant-service PostgreSQL. |
| **definition-service topology** | **OPEN — user verdict required** | Shared graph (current) vs per-tenant (`definitions_db_name` column exists but no routing code). |
| **Neo4j Edition (for definitions)** | **OPEN** | Depends on definition-service topology decision. Community = shared only. |

### What Can Proceed Without the Open Decisions

| Work Item | Why It's Safe |
|-----------|---------------|
| R02 entity model (PostgreSQL) | Definition-service topology does not affect R02 tenant management |
| R02 API contracts | All APIs already use tenantId scoping |
| R02 frontend prototypes | UI queries by tenantId regardless of topology |
| R02 audit/notification design | These services don't use Neo4j |
| R02 license model | Entirely PostgreSQL-based |
| R02 provisioning flow | Auth provisioning is PostgreSQL + Keycloak only (frozen). Definition-service provisioning is out of R02 scope. |
| R02 factsheet | Health tab shows tenant-service PG status, not Neo4j database status (frozen). |

---

## Part D: Evidence Index

| Artifact | Path | Relevance |
|----------|------|-----------|
| Feature flag config | `auth-facade/.../config/AuthGraphPerTenantProperties.java` | Controls topology switch |
| Database selection | `auth-facade/.../tenant/TenantAwareAuthDatabaseSelectionProvider.java` | Routes queries |
| Routing resolver | `auth-facade/.../tenant/TenantRoutingResolver.java` | Valkey cache + control-plane lookup |
| Tenant context filter | `auth-facade/.../filter/TenantContextFilter.java` | HTTP request → routing context |
| Provisioning service | `auth-facade/.../service/AuthTenantProvisioningService.java` | Creates tenant databases |
| Provisioning endpoint | `auth-facade/.../controller/InternalProvisioningController.java` | Internal API |
| Bootstrap script | `auth-facade/.../resources/neo4j/auth-tenant-bootstrap.cypher` | Per-tenant DB schema seed |
| Tenant template | `auth-facade/.../resources/neo4j/tenant-template.cypher` | Full per-tenant schema (406 lines) |
| Shared migrations | `auth-facade/.../resources/neo4j/migrations/V001–V009` | Shared graph schema |
| Control-plane routing | `tenant-service/.../db/migration/V7__tenant_database_routing.sql` | Routing columns |
| Per-service metadata | `tenant-service/.../db/migration/V8__per_service_routing_metadata.sql` | Service-specific routing |
| Neo4j config | `auth-facade/.../config/Neo4jConfig.java` | Bean registration |
| Definition Neo4j config | `definition-service/.../config/Neo4jConfig.java` | No routing (gap) |
| TenantNode entity | `auth-facade/.../graph/entity/TenantNode.java` | No routing field |
| Neo4j data initializer | `auth-facade/.../graph/Neo4jDataInitializer.java` | Shared-graph seed (conditional) |
