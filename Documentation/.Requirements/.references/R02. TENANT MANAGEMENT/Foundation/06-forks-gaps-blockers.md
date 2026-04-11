# R02 Foundation Track — 06 Forks, Gaps, and Blockers

**Status:** REVIEW (Revision 2)
**Date:** 2026-03-24
**Revision:** 2 — auth-facade reclassified as transition-only/removable; api-gateway added as target auth edge; tenant-service gains provider config
**Input:** Frozen auth ownership decision Rev 2 (03-ownership-boundaries.md), topology contract Rev 2 (05-topology-contract.md), as-is audit (01–04)

---

## Section 1: Frozen Decisions

These decisions are sealed and binding for R02 and WP-ARCH-ALIGN. No R02 design, prototype, or implementation may contradict them.

### FD-01: Auth Ownership — tenant-service Owns Identity + Provider Config

| Attribute | Value |
|-----------|-------|
| **Decision** | tenant-service is the single authoritative owner of tenant users, RBAC, groups, memberships, provider config, session control, revocation, and session history in the target model |
| **Date** | 2026-03-24 |
| **Supersedes** | As-is model where auth-facade owns identity graph + provider config (Neo4j) and user-service owns profiles/sessions (PostgreSQL) |
| **Cross-ref** | `03-ownership-boundaries.md` § FROZEN: Target Auth Ownership Model (Revision 2) |

### FD-02: Auth-Facade — Transition-Only, Then Removed

| Attribute | Value |
|-----------|-------|
| **Decision** | auth-facade is transition-only. Its responsibilities migrate to api-gateway (auth edge endpoints: login, token refresh, logout, MFA verify) and tenant-service (data ownership: RBAC, provider config, session control). auth-facade is removed after migration. It is not an end-state service. |
| **Date** | 2026-03-24 |
| **Supersedes** | As-is model where auth-facade is the central auth service owning the Neo4j identity graph. Also supersedes the Rev 1 "stateless orchestrator" target. |
| **Cross-ref** | `03-ownership-boundaries.md` § FROZEN (Revision 2) |

### FD-03: Api-Gateway — Target Home for Auth Edge Endpoints

| Attribute | Value |
|-----------|-------|
| **Decision** | api-gateway is the target home for auth edge endpoints (login, token refresh, logout, MFA verify) after migration from auth-facade. |
| **Date** | 2026-03-24 |
| **Supersedes** | As-is model where api-gateway is a pure router with no auth logic |
| **Cross-ref** | `03-ownership-boundaries.md` § FROZEN (Revision 2) |

### FD-04: Neo4j Removed from Auth Target Domain

| Attribute | Value |
|-----------|-------|
| **Decision** | Neo4j is removed from the auth target domain. The auth graph (TenantNode, UserNode, GroupNode, RoleNode, ProviderNode, ConfigNode, ProtocolNode) is legacy/as-is only. Neo4j remains only for definition-service (canonical object types). |
| **Date** | 2026-03-24 |
| **Supersedes** | Both shared-graph and graph-per-tenant options for auth |
| **Cross-ref** | `05-topology-contract.md` § FROZEN: Auth Graph Topology Decision (Revision 2) |

### FD-05: User-Service — Transition-Only, Then Removed from Tenant-User Ownership

| Attribute | Value |
|-----------|-------|
| **Decision** | user-service is transition-only. Its entities (UserProfile, UserDevice, UserSession) migrate to tenant-service. The service remains operational during transition but is not the target owner. It is removed from tenant-user ownership after migration. |
| **Date** | 2026-03-24 |
| **Supersedes** | As-is model where user-service is the profile/device/session owner |
| **Cross-ref** | `03-ownership-boundaries.md` § FROZEN (Revision 2) |

### FD-06: Graph-Per-Tenant Flag — Will Not Be Activated

| Attribute | Value |
|-----------|-------|
| **Decision** | `AUTH_GRAPH_PER_TENANT_ENABLED` will not be activated. The dormant graph-per-tenant code path (provisioning, routing, bootstrap) is legacy. |
| **Date** | 2026-03-24 |
| **Supersedes** | Options 2 and 3 from `05-topology-contract.md` |
| **Cross-ref** | `05-topology-contract.md` § FROZEN |

---

## Section 2: Forks (Contested or Divergent As-Is State)

Forks are places where the codebase contains conflicting implementations, configurations, or assumptions that must be resolved.

### FORK-01: Infrastructure Topology — Docker vs Scripts

| Attribute | Value |
|-----------|-------|
| **What** | `docker-compose.yml` is decommissioned (all services commented out), but `scripts/dev-up.sh` starts a 4-stack Docker environment (PostgreSQL, Neo4j, Keycloak, Valkey) |
| **Conflict** | Documentation says "external systems" but scripts manage them as local Docker containers |
| **Impact on R02** | Low — R02 infrastructure design must reference `scripts/dev-up.sh` as the active local dev path, not `docker-compose.yml` |
| **Resolution** | Document `dev-up.sh` as the canonical local dev infrastructure path. `docker-compose.yml` is archived. |
| **Cross-ref** | `04-data-residency.md` § Infrastructure [CONTESTED] |

### FORK-02: Database Topology — Shared vs Per-Service

| Attribute | Value |
|-----------|-------|
| **What** | Local dev uses a shared `master_db` PostgreSQL database for all services. Docker compose (decommissioned) defined per-service databases. |
| **Conflict** | Service isolation model differs between local dev and target |
| **Impact on R02** | Medium — R02 must decide: does tenant-service get its own database in target, or continue sharing? |
| **Resolution** | Deferred — not blocking for R02 design. R02 uses `master_db` for dev. Target production topology is a deployment decision. |

### FORK-03: Neo4j Auth Graph — Active vs Dormant Code Paths

| Attribute | Value |
|-----------|-------|
| **What** | Two complete code paths coexist: shared graph (active, flag=false) and graph-per-tenant (dormant, flag=true) |
| **Conflict** | Both paths are fully implemented but the frozen decision removes Neo4j from auth target entirely |
| **Impact on R02** | Both code paths become legacy. No R02 work should build on either path. |
| **Resolution** | Mark both paths as legacy/transition. Do not activate graph-per-tenant. Do not extend shared graph for new auth features. |
| **Cross-ref** | `05-topology-contract.md` § Part A |

---

## Section 3: Gaps (Missing Implementation or Design)

Gaps are things that must exist in the target model but do not exist today.

### GAP-01: Neo4j → PostgreSQL Auth Data Migration

| Attribute | Value |
|-----------|-------|
| **What** | No code exists to migrate auth identity data from Neo4j graph to tenant-service PostgreSQL |
| **Scope** | TenantNode, UserNode, GroupNode, RoleNode, ProviderNode, ConfigNode, ProtocolNode + all relationships (BELONGS_TO, HAS_ROLE, MEMBER_OF, USES, CONFIGURED_WITH, SUPPORTS, INHERITS_FROM) |
| **Complexity** | High — graph relationships must be flattened to relational schema. Role hierarchy (INHERITS_FROM) needs a PostgreSQL representation. |
| **Priority** | **Blocker for transition completion**, not for R02 design (R02 designs against target PG model, migration runs separately) |
| **Cross-ref** | `05-topology-contract.md` § Part C |

### GAP-02: tenant-service PostgreSQL Schema for Auth Entities

| Attribute | Value |
|-----------|-------|
| **What** | tenant-service PostgreSQL does not yet have tables for: users (tenant-scoped), roles, groups, memberships, role hierarchy, provider configurations, protocol definitions |
| **Scope** | Full RBAC + identity schema that currently lives only in Neo4j |
| **Complexity** | High — requires schema design, migration scripts, repository layer, service layer |
| **Priority** | **Blocker for R02 implementation** — R02 tenant factsheet needs to query users, roles, groups from tenant-service PG |
| **Dependency** | SA agent must design the schema; DBA agent must write migrations |

### GAP-03: user-service → tenant-service Entity Migration

| Attribute | Value |
|-----------|-------|
| **What** | user-service owns UserProfile, UserDevice, UserSession in PostgreSQL. These must migrate to tenant-service. |
| **Scope** | 3 entities + their relationships + API surface |
| **Complexity** | Medium — same storage technology (PG→PG), but requires API migration + client updates |
| **Priority** | **Blocker for transition completion**, not for R02 design |

### GAP-04: definition-service Topology Decision

| Attribute | Value |
|-----------|-------|
| **What** | definition-service uses Neo4j but has no tenant-aware database routing. The `definitions_db_name` column exists in tenant-service control plane but no code uses it. |
| **Scope** | DefinitionTypeNode, DefinitionFieldNode + Neo4j routing |
| **Complexity** | Medium — either implement `DatabaseSelectionProvider` for definitions or confirm shared graph is sufficient |
| **Priority** | **Not blocking R02** — R02 tenant management does not depend on definition-service topology |
| **Cross-ref** | `05-topology-contract.md` § Part C (OPEN decision) |

### GAP-05: UserNode.BELONGS_TO Entity Model Annotation

| Attribute | Value |
|-----------|-------|
| **What** | V008 migration creates `BELONGS_TO` edges in the Neo4j graph, but `UserNode.java` has no `@Relationship("BELONGS_TO")` annotation |
| **Scope** | Entity model accuracy |
| **Complexity** | Low |
| **Priority** | **Not blocking** — frozen decision makes this legacy. Will not be fixed in Neo4j; the relationship migrates to tenant-service PG as a foreign key. |
| **Cross-ref** | `02-relationship-inventory.md` § Anomaly 5 |

### GAP-06: Auth-Facade Decomposition and Removal

| Attribute | Value |
|-----------|-------|
| **What** | auth-facade is transition-only. Its responsibilities must be decomposed: auth edge endpoints (login, token refresh, logout, MFA verify) migrate to api-gateway; data ownership (RBAC, provider config, identity graph) migrates to tenant-service PostgreSQL. After migration, auth-facade is removed. |
| **Scope** | All auth-facade controllers, Neo4j repositories, graph entities, provisioning service, database selection provider, routing resolver, Feign clients |
| **Complexity** | Very High — service decomposition + endpoint migration + data migration + client updates |
| **Priority** | **Blocker for transition completion**, not for R02 design (R02 designs against the target model where api-gateway serves auth edge and tenant-service owns data) |

### GAP-07: Api-Gateway Auth Endpoint Migration

| Attribute | Value |
|-----------|-------|
| **What** | api-gateway is currently a pure router (Spring Cloud Gateway). The frozen decision makes it the target home for auth edge endpoints. Auth logic (login, token refresh, logout, MFA verify) must be migrated from auth-facade to api-gateway. |
| **Scope** | Auth controller endpoints, Keycloak client integration, token handling, MFA orchestration |
| **Complexity** | High — api-gateway must gain auth logic without becoming a monolith |
| **Priority** | **Blocker for transition completion**, not for R02 design |

---

## Section 4: Blockers (Must Be Resolved Before Milestones)

### Before R02 PRD Lock

| # | Blocker | Resolution Path | Owner |
|---|---------|----------------|-------|
| B-01 | GAP-02: tenant-service PG schema for auth entities | SA designs schema → DBA writes migrations | SA + DBA |
| B-02 | Foundation Track deliverables 1–6 sealed | User reviews and approves all 6 | User |
| B-03 | WP-ARCH-ALIGN gate closed | Update Architecture/, togaf/, lld/ docs per frozen auth model | Orchestrator |

### Before R02 Implementation

| # | Blocker | Resolution Path | Owner |
|---|---------|----------------|-------|
| B-04 | B-01 + B-02 + B-03 complete | Sequential dependency | — |
| B-05 | R02 PRD locked | PRD revalidated against sealed foundation | BA + User |

### Before Transition Completion (Post-R02)

| # | Blocker | Resolution Path | Owner |
|---|---------|----------------|-------|
| B-06 | GAP-01: Neo4j → PG auth data migration | Design + implement migration scripts | SA + DBA + DEV |
| B-07 | GAP-03: user-service → tenant-service migration | Design + implement entity + API migration | SA + DEV |
| B-08 | GAP-06: auth-facade decomposition and removal | Decompose auth-facade: edge → api-gateway, data → tenant-service PG, then remove service | ARCH + SA + DEV |
| B-09 | GAP-07: api-gateway auth endpoint migration | Migrate auth edge endpoints from auth-facade to api-gateway | SA + DEV |
| B-10 | GAP-04: definition-service topology decision | User verdict required | User |

---

## Section 5: Risk Register

| ID | Risk | Likelihood | Impact | Mitigation |
|----|------|-----------|--------|------------|
| R-01 | Neo4j → PG migration loses data or corrupts relationships | Medium | High | Design migration with rollback; run against staging copy first; verify row counts + relationship integrity |
| R-02 | auth-facade decomposition breaks authentication flow | High | Critical | Feature-flag the decomposition; run auth-facade + api-gateway in parallel during transition; integration test both paths |
| R-03 | user-service deprecation breaks API consumers | Low | Medium | API compatibility layer during transition; client-by-client migration |
| R-04 | tenant-service PG schema does not fully represent Neo4j graph semantics | Medium | High | Map every graph node type + relationship to relational equivalent before coding; SA validates completeness |
| R-05 | definition-service topology deferred too long | Low | Medium | Not blocking R02; schedule decision for post-R02 planning |
| R-06 | api-gateway gains too much auth logic and becomes a monolith | Medium | Medium | Keep api-gateway auth layer thin (orchestration only); tenant-service owns all data/policy logic; api-gateway only does edge routing + Keycloak token exchange |
| R-07 | Transition period with both auth-facade and api-gateway serving auth is confusing for consumers | Medium | Medium | Document clear transition timeline; route all new consumers to api-gateway; keep auth-facade for existing consumers only during transition |

---

## Section 6: Summary

| Category | Count | Critical |
|----------|-------|----------|
| Frozen decisions | 6 | FD-02 (auth-facade removed), FD-03 (api-gateway = target auth edge) |
| Forks | 3 | FORK-03 (legacy auth graph paths) |
| Gaps | 7 | GAP-01, GAP-02, GAP-06, GAP-07 (migration + schema + decomposition + gateway migration) |
| Blockers (pre-R02) | 3 | B-01 (PG schema), B-02 (foundation seal), B-03 (doc alignment) |
| Blockers (post-R02) | 5 | B-06, B-07, B-08, B-09 (migration + decomposition + gateway) |
| Risks | 7 | R-01, R-02 (data migration + auth decomposition) |
