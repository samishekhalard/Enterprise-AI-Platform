# As-Is Roles Management Baseline

**Track:** R09 Roles Management
**Status:** Draft
**Date:** 2026-03-17
**Purpose:** Capture the current state of role management in EMSIST from the codebase and the existing architecture / requirements documentation before defining the canonical R09 contract.

---

## 1. Scope of This Baseline

This document records the current role-management reality across:

- runtime code and bootstrap scripts
- auth-facade graph model and JWT role extraction
- gateway and service authorization enforcement
- frontend enforcement reality
- `Architecture`
- `togaf`
- ADRs
- current requirement and LLD documents that materially affect role management

This is an as-is document, not a target-state design.

---

## 2. Executive Summary

The current platform already has a real RBAC foundation, but it is fragmented across multiple role vocabularies.

What clearly exists in code today:

- a base 5-role seeded hierarchy: `VIEWER`, `USER`, `MANAGER`, `ADMIN`, `SUPER_ADMIN`
- Keycloak bootstrap for those 5 roles and superadmin assignment
- Neo4j role nodes with transitive inheritance
- JWT role extraction from multiple claim paths
- tenant-aware effective-role resolution in auth-facade
- `SUPER_ADMIN` cross-tenant bypass in `TenantAccessValidator`
- route and endpoint checks in gateway and multiple downstream services

What also exists, but is not aligned with the base seed:

- `TENANT_ADMIN` is enforced in several services
- `AUDITOR` is enforced in audit-service
- license tiers define `ROLE_TENANT_ADMIN`, `ROLE_POWER_USER`, `ROLE_CONTRIBUTOR`, and `ROLE_VIEWER`

What does not exist as a first-class runtime role in code:

- `PLATFORM_ADMIN`
- a dedicated roles-management API or UI surface for CRUD on runtime roles
- frontend role-based route guarding beyond simple authentication
- a single canonical role registry used consistently by bootstrap, services, and documents

The documentation is ahead of the implementation in some places and behind it in others:

- some documents correctly describe the 5-role hierarchy
- some documents assume or promote `TENANT_ADMIN`
- some documents use persona labels like Platform Admin as if they were runtime roles
- `Documentation/Architecture/` documents a richer authorization context with `responsibilities`, `policyVersion`, `clearanceLevel`, and `uiVisibility`, but no matching runtime implementation was found in backend code search

---

## 3. Codebase As-Is

### 3.1 Runtime Role Strings Observed in Code

| Role / Label | Exists in runtime code? | Current interpretation | Evidence |
|---|---|---|---|
| `VIEWER` | Yes | Base seeded role; read-only baseline | `infrastructure/keycloak/keycloak-init.sh` lines 198-224; `backend/auth-facade/src/main/resources/neo4j/migrations/V004__create_default_roles.cypher` lines 20-27 |
| `USER` | Yes | Base seeded role | `keycloak-init.sh` lines 198-224; `V004__create_default_roles.cypher` lines 29-36 |
| `MANAGER` | Yes | Base seeded role | `keycloak-init.sh` lines 198-224; `V004__create_default_roles.cypher` lines 38-45 |
| `ADMIN` | Yes | Base seeded tenant-scoped administrative role | `keycloak-init.sh` lines 198-224; `V004__create_default_roles.cypher` lines 47-54 |
| `SUPER_ADMIN` | Yes | Base seeded cross-tenant platform role | `keycloak-init.sh` lines 198-224, 321-341; `V004__create_default_roles.cypher` lines 56-63 |
| `TENANT_ADMIN` | Partially | Enforced in several services and license/user-tier mappings, but not part of the base Keycloak / Neo4j default seed | `backend/api-gateway/src/main/java/com/ems/gateway/config/SecurityConfig.java` lines 69-70; `backend/user-service/src/main/java/com/ems/user/config/SecurityConfig.java` lines 43-45; `backend/license-service/src/main/java/com/ems/license/entity/UserTier.java` lines 15-33 |
| `AUDITOR` | Partially | Enforced in audit-service, but not part of the base seed | `backend/audit-service/src/main/java/com/ems/audit/config/SecurityConfig.java` lines 42-45 |
| `POWER_USER` | No as base runtime role seed | License/user tier mapped to `ROLE_POWER_USER`; not part of the default role hierarchy | `backend/license-service/src/main/java/com/ems/license/entity/UserTier.java` lines 20-24 |
| `CONTRIBUTOR` | No as base runtime role seed | License/user tier mapped to `ROLE_CONTRIBUTOR`; not part of the default role hierarchy | `backend/license-service/src/main/java/com/ems/license/entity/UserTier.java` lines 23-24 |
| `PLATFORM_ADMIN` | No | Business/persona label only; no implementation found in bootstrap, graph seed, or service enforcement | Repo search across backend + infrastructure found no runtime role definition |

### 3.2 Bootstrap and Default Hierarchy

The base runtime bootstrap is clear and internally consistent for the 5 default roles:

- Keycloak creates `VIEWER USER MANAGER ADMIN SUPER_ADMIN` and wires composites as `SUPER_ADMIN > ADMIN > MANAGER > USER > VIEWER` in `keycloak-init.sh` lines 198-224.
- The same hierarchy is seeded in Neo4j by `V004__create_default_roles.cypher` lines 20-88.
- The bootstrap assigns `SUPER_ADMIN` to the `superadmin` user in `keycloak-init.sh` lines 321-341.
- Keycloak bootstrap also explicitly ensures the built-in `roles` client scope is a default scope so JWTs include `realm_access.roles` in `keycloak-init.sh` lines 414-455.

Interpretation:

- the platform has a real seeded runtime hierarchy
- that hierarchy does not include `TENANT_ADMIN`, `AUDITOR`, `POWER_USER`, or `CONTRIBUTOR`

### 3.3 Auth Graph Model and Effective Role Resolution

The auth-facade graph model supports more than flat JWT role checks:

- `RoleNode` is a Neo4j `@Node("Role")` with `tenantId`, `systemRole`, and `INHERITS_FROM` relationships in `backend/auth-facade/src/main/java/com/ems/auth/graph/entity/RoleNode.java` lines 14-59.
- `RoleNode` supports transitive effective-role expansion in code via `getEffectiveRoles()` in `RoleNode.java` lines 79-98.
- `AuthGraphRepository` resolves effective roles transitively from user roles, group membership, and inheritance using Cypher in `backend/auth-facade/src/main/java/com/ems/auth/graph/repository/AuthGraphRepository.java` lines 132-171.
- The tenant-scoped lookup explicitly limits roles to `rootRole.tenantId = $tenantId OR rootRole.tenantId IS NULL` in `AuthGraphRepository.java` lines 161-166.
- `GraphRoleService` caches effective roles and exposes authorities in `backend/auth-facade/src/main/java/com/ems/auth/service/GraphRoleService.java` lines 16-137.

Interpretation:

- custom and tenant-scoped roles are structurally possible in the graph model
- the graph model is more expressive than the currently documented base 5-role bootstrap
- role management is implemented as a graph capability, but not as an end-user role-management product surface

### 3.4 JWT Role Extraction and Normalization

JWT role extraction is already provider-agnostic in auth-facade:

- `ProviderAgnosticRoleConverter` extracts authorities from configured claim paths in `backend/auth-facade/src/main/java/com/ems/auth/security/ProviderAgnosticRoleConverter.java` lines 15-149.
- Supported claim families include `realm_access.roles`, `resource_access`, `roles`, `groups`, and `permissions` in `ProviderAgnosticRoleConverter.java` lines 20-25 and `backend/auth-facade/src/main/resources/application.yml` lines 79-88.
- Roles are normalized to Spring `ROLE_*` authorities in `ProviderAgnosticRoleConverter.java` lines 63-73.

However, the same extraction pattern is also duplicated in multiple services:

- api-gateway `SecurityConfig` lines 97-120
- user-service `SecurityConfig` lines 55-74
- definition-service `SecurityConfig` lines 65-74
- similar patterns appear in tenant-service, license-service, notification-service, ai-service, process-service, and audit-service

Interpretation:

- the role-extraction contract exists
- the implementation is not centralized in one shared library across all services

### 3.5 Tenant Scope and Cross-Tenant Access

Tenant boundary enforcement exists, but it is not uniformly applied across all services:

- `TenantAccessValidator` in auth-facade blocks tenant mismatches and allows only `SUPER_ADMIN` bypass in `backend/auth-facade/src/main/java/com/ems/auth/security/TenantAccessValidator.java` lines 10-88.
- The validator treats both `super-admin` and `SUPER_ADMIN` as bypass values in lines 30-34 and 81-87.
- `SUPER_ADMIN` is the only coded cross-tenant bypass role in this validator.

Interpretation:

- cross-tenant platform access is implemented
- the bypass role is `SUPER_ADMIN`, not `PLATFORM_ADMIN`
- tenant-boundary enforcement is currently strongest in auth-facade, not uniformly standardized in all services

### 3.6 Enforcement Surfaces Observed

| Surface | As-is enforcement |
|---|---|
| api-gateway | `/api/v1/admin/**` requires `ADMIN` or `SUPER_ADMIN`; `/api/v1/tenants/*/seats/**` requires `TENANT_ADMIN`, `ADMIN`, or `SUPER_ADMIN` |
| auth-facade admin controllers | `@PreAuthorize("hasAnyRole('ADMIN','SUPER_ADMIN')")` on admin provider and admin user endpoints |
| tenant-service | `/api/tenants/**` requires `TENANT_ADMIN`, `ADMIN`, or `SUPER_ADMIN` |
| user-service | `/api/v1/users/**` and `/api/v1/admin/**` require `TENANT_ADMIN`, `ADMIN`, or `SUPER_ADMIN` |
| license-service | admin routes require `ADMIN` or `SUPER_ADMIN`; seat routes allow `TENANT_ADMIN`, `ADMIN`, or `SUPER_ADMIN` |
| notification-service | template routes allow `TENANT_ADMIN`, `ADMIN`, or `SUPER_ADMIN` |
| ai-service | provider routes allow `TENANT_ADMIN`, `ADMIN`, or `SUPER_ADMIN` |
| process-service | protected process routes allow `TENANT_ADMIN`, `ADMIN`, or `SUPER_ADMIN` |
| audit-service | audit routes allow `AUDITOR`, `TENANT_ADMIN`, `ADMIN`, or `SUPER_ADMIN` |
| definition-service | `/api/v1/definitions/**` requires `SUPER_ADMIN` only |
| frontend | `authGuard` only checks whether the user is authenticated; it does not check roles |

Representative evidence:

- `backend/api-gateway/src/main/java/com/ems/gateway/config/SecurityConfig.java` lines 69-70
- `backend/user-service/src/main/java/com/ems/user/config/SecurityConfig.java` lines 43-45
- `backend/definition-service/src/main/java/com/ems/definition/config/SecurityConfig.java` lines 44-49
- `backend/audit-service/src/main/java/com/ems/audit/config/SecurityConfig.java` lines 42-45
- `frontend/src/app/core/auth/auth.guard.ts` lines 5-16

### 3.7 Frontend Reality

The frontend currently understands authentication, but not robust role-based authorization:

- `authGuard` checks only `session.isAuthenticated()` in `frontend/src/app/core/auth/auth.guard.ts` lines 5-16.
- No dedicated frontend role guard was found in repo search.
- The R01 Playwright plan explicitly states that no role-based guard exists in the frontend codebase and that role-guard tests are planned in `Documentation/.Requirements/R01. AUTHENTICATION AND AUTHORIZATION/Design/14-Playwright-Test-Plan.md` lines 1111-1153.

Interpretation:

- backend role checks are the real enforcement plane today
- frontend route-level and component-level role gating is still incomplete

### 3.8 What Does Not Exist in Code Today

The following capabilities were not found as implemented runtime features:

- no first-class runtime role named `PLATFORM_ADMIN`
- no dedicated `RoleController` or `/roles` CRUD API for runtime role management
- no dedicated frontend roles-management module for managing the canonical role registry
- no shared, platform-wide canonical role registry artifact consumed directly by bootstrap + services
- no runtime implementation found for `responsibilities`, `policyVersion`, `clearanceLevel`, or `uiVisibility` in the backend auth flow

These are either gaps, planned capabilities, or documentation-only concepts.

---

## 4. Documentation As-Is

### 4.1 Architecture

`Documentation/Architecture/` describes role management as part of a broader composite authorization model.

What it says:

- Neo4j is the RBAC / identity graph for auth-facade in `Documentation/Architecture/04-solution-strategy.md` lines 5, 21 and `Documentation/Architecture/05-building-blocks.md` lines 110-122.
- Authorization is composite: RBAC + licensing + data classification in `Documentation/Architecture/08-crosscutting.md` lines 61-68.
- The backend is the authoritative enforcement plane in `Documentation/Architecture/08-crosscutting.md` lines 70-72.
- A target-state authorization context includes `roles`, `responsibilities`, `features`, `clearanceLevel`, `policyVersion`, and `uiVisibility` in `Documentation/Architecture/08-crosscutting.md` lines 74-107 and `Documentation/Architecture/06-runtime-view.md` lines 42-60, 312-319.

As-is interpretation:

- `Documentation/Architecture/` is directionally aligned with the implemented RBAC foundation
- `Documentation/Architecture/` also describes target-state authorization concepts that are not yet visible in code as a full implemented contract
- The canonical architecture text says frontend enforcement uses `authGuard`, but the actual `authGuard` only checks authentication, not roles

### 4.2 TOGAF

The most relevant TOGAF artifacts are consistent about some parts of the runtime model and explicit about some gaps.

What it says:

- TOGAF architecture vision positions EMSIST as using composite authorization and strict tenant isolation in `Documentation/togaf/01-architecture-vision.md` lines 39-41.
- ABB-005 documents gateway enforcement of `ADMIN` / `SUPER_ADMIN` for admin routes and `TENANT_ADMIN` / `ADMIN` / `SUPER_ADMIN` for seat routes in `Documentation/togaf/artifacts/building-blocks/ABB-005-api-gateway-routing.md` lines 43-53, 61-66, 273-282.
- ABB-002 documents `SUPER_ADMIN` as the only tenant-isolation bypass and also records gaps where only auth-facade has strong tenant-validation logic in `Documentation/togaf/artifacts/building-blocks/ABB-002-tenant-context-enforcement.md` lines 486-495 and 628-640.
- ABB-006 mixes licensing tiers with RBAC role strings, documenting `TENANT_ADMIN`, `POWER_USER`, `CONTRIBUTOR`, and `VIEWER` tier-to-role mappings in `Documentation/togaf/artifacts/building-blocks/ABB-006-license-entitlement-management.md` lines 25-46, 65-76, 276-286, 417-418, 494.

As-is interpretation:

- TOGAF matches the implemented gateway and tenant-boundary patterns reasonably well
- TOGAF also reinforces the `TENANT_ADMIN` vocabulary, which is only partially aligned with the base bootstrap
- TOGAF blurs user tiers and runtime roles in the licensing area

### 4.3 ADRs

The most relevant ADRs are ADR-007 and ADR-014.

What they say:

- ADR-007 defines provider-agnostic claim extraction with role paths `realm_access.roles`, `resource_access`, `roles`, `groups`, and `permissions` in `Documentation/Architecture/09-architecture-decisions.md#932-provider-agnostic-auth-facade-adr-007`.
- ADR-014 states that the RBAC system is a 5-level hierarchy `SUPER_ADMIN > ADMIN > MANAGER > USER > VIEWER` in `Documentation/Architecture/09-architecture-decisions.md#936-rbac-and-licensing-integration-adr-014`.
- ADR-014 is still `Proposed`, not fully accepted / fully implemented in code, and it introduces a richer frontend/backend enforcement model including feature context and policy separation in `ADR-014` lines 16-37, 117-120, and 199-205.

As-is interpretation:

- ADR-007 strongly aligns with implemented role-extraction code
- ADR-014 is partially aligned, but still describes a partly target-state composite authorization model

### 4.4 Requirement and LLD Documents

What they say:

- R01 data model states the default role hierarchy is `SUPER_ADMIN --> ADMIN --> MANAGER --> USER --> VIEWER` in `Documentation/.Requirements/R01. AUTHENTICATION AND AUTHORIZATION/Design/04-Data-Model-Authentication-Authorization.md` lines 152-168.
- The same R01 document also shows example JWT payloads containing `TENANT_ADMIN` in `realm_access.roles` in lines 883-903.
- R01 API contract documents `/api/v1/admin/**` as `ADMIN` / `SUPER_ADMIN` and `/api/v1/tenants/*/seats/**` as `TENANT_ADMIN`, `ADMIN`, or `SUPER_ADMIN` in `Documentation/.Requirements/R01. AUTHENTICATION AND AUTHORIZATION/Design/06-API-Contract.md` lines 602-606 and 1605-1666.
- The R01 Playwright plan explicitly states frontend role guards do not yet exist in `R01 ... /14-Playwright-Test-Plan.md` lines 1111-1153.
- On-premise licensing requirements preserve the 5-role hierarchy and map Tenant-Admin tier to `ADMIN`, not to a separate canonical runtime role, in `Documentation/requirements/ON-PREMISE-LICENSING-REQUIREMENTS.md` lines 227-256 and 386-425.
- R08 Integration Hub now explicitly states `PLATFORM_ADMIN` is not a runtime role and records the `TENANT_ADMIN` drift in `Documentation/lld/integration-hub-spec.md` lines 841-854 and `Documentation/.Requirements/R08. Integration Hub/conversation.codexmd` lines 49-64.

As-is interpretation:

- R01 contains both aligned material and drift-driving examples
- licensing requirements push toward "Tenant-Admin tier maps to `ADMIN`"
- other feature tracks have already started needing explicit clarification because the role vocabulary is not canonical

---

## 5. Exists / Not Exists / Drift Matrix

| Item | Code as-is | Documentation as-is | Finding |
|---|---|---|---|
| Base 5-role hierarchy (`VIEWER`, `USER`, `MANAGER`, `ADMIN`, `SUPER_ADMIN`) | Exists | Exists in R01, ADR-014, Architecture, TOGAF | Aligned |
| `SUPER_ADMIN` cross-tenant bypass | Exists | Exists in TOGAF ABB-002 and R01 security docs | Aligned |
| `TENANT_ADMIN` enforcement | Exists in gateway and several services | Exists in many requirement and TOGAF docs | Partially aligned, but not in base seed |
| `TENANT_ADMIN` in bootstrap | Does not exist in base Keycloak / Neo4j seed | Often implied or assumed | Drift |
| `AUDITOR` enforcement | Exists in audit-service | Appears in some docs | Partial role with unclear canonical status |
| `POWER_USER` / `CONTRIBUTOR` role strings | Exist as user-tier-to-RBAC mappings | Exist in licensing docs and TOGAF | Tier / role boundary is blurred |
| `PLATFORM_ADMIN` runtime role | Does not exist | Appears in older business / feature language | Docs-only label |
| Dedicated role-management CRUD API | Not found | Not consistently specified | Gap |
| Dedicated frontend role guard | Does not exist | Planned / assumed in some docs | Docs ahead of code |
| Authorization context with `responsibilities`, `policyVersion`, `clearanceLevel`, `uiVisibility` | Not found in runtime code search | Documented in Architecture target-state material | Docs ahead of code |
| Central canonical role registry | Does not exist | No single authoritative document yet | Gap |
| Shared role extraction implementation | Partially exists in auth-facade, but service code duplicates extraction | Implied as a platform pattern | Partial implementation |
| Persona vs runtime role separation | Not standardized | Mixed across docs | Drift |
| User tier vs runtime role separation | Not standardized | Mixed across licensing and auth docs | Drift |

---

## 6. What R09 Must Treat as Confirmed As-Is Facts

The following should be treated as confirmed starting assumptions for R09 unless code changes first:

1. The only default seeded runtime hierarchy today is `SUPER_ADMIN > ADMIN > MANAGER > USER > VIEWER`.
2. `SUPER_ADMIN` is the coded cross-tenant bypass role.
3. `TENANT_ADMIN` is already a live runtime dependency in several service security chains, even though it is not part of the base seed.
4. `PLATFORM_ADMIN` is not a runtime role.
5. The auth graph model supports transitive and tenant-scoped effective-role resolution.
6. The frontend does not yet provide real role-based route enforcement.
7. Documentation currently mixes runtime roles, personas, authorization policy concepts, and license/user tiers.

---

## 7. Immediate Implications for R09 Requirements

R09 should start by resolving the following, in this order:

1. Publish a canonical runtime role registry.
2. Decide the fate of `TENANT_ADMIN`:
   - canonize and seed it end to end, or
   - normalize tenant-admin semantics to `ADMIN`.
3. Decide the canonical status of `AUDITOR`.
4. Separate persona labels from runtime roles.
5. Separate user tiers / license tiers from runtime roles.
6. Decide whether Architecture target-state authorization context fields are in R09 scope or remain future-state.
7. Standardize whether shared role-extraction logic should live in one reusable platform component.
8. Define whether EMSIST needs a first-class role-management API / UI or only a canonical internal contract.

---

## 8. Evidence Inventory Used for This Baseline

### Runtime Code

- `infrastructure/keycloak/keycloak-init.sh`
- `backend/auth-facade/src/main/resources/neo4j/migrations/V004__create_default_roles.cypher`
- `backend/auth-facade/src/main/java/com/ems/auth/graph/entity/RoleNode.java`
- `backend/auth-facade/src/main/java/com/ems/auth/graph/repository/AuthGraphRepository.java`
- `backend/auth-facade/src/main/java/com/ems/auth/security/ProviderAgnosticRoleConverter.java`
- `backend/auth-facade/src/main/java/com/ems/auth/security/TenantAccessValidator.java`
- `backend/auth-facade/src/main/java/com/ems/auth/service/GraphRoleService.java`
- `backend/api-gateway/src/main/java/com/ems/gateway/config/SecurityConfig.java`
- `backend/user-service/src/main/java/com/ems/user/config/SecurityConfig.java`
- `backend/definition-service/src/main/java/com/ems/definition/config/SecurityConfig.java`
- `backend/audit-service/src/main/java/com/ems/audit/config/SecurityConfig.java`
- `backend/license-service/src/main/java/com/ems/license/entity/UserTier.java`
- `frontend/src/app/core/auth/auth.guard.ts`

### Architecture and Requirements

- `Documentation/Architecture/04-solution-strategy.md`
- `Documentation/Architecture/06-runtime-view.md`
- `Documentation/Architecture/08-crosscutting.md`
- `Documentation/togaf/01-architecture-vision.md`
- `Documentation/togaf/artifacts/building-blocks/ABB-002-tenant-context-enforcement.md`
- `Documentation/togaf/artifacts/building-blocks/ABB-005-api-gateway-routing.md`
- `Documentation/togaf/artifacts/building-blocks/ABB-006-license-entitlement-management.md`
- `Documentation/Architecture/09-architecture-decisions.md#932-provider-agnostic-auth-facade-adr-007`
- `Documentation/Architecture/09-architecture-decisions.md#936-rbac-and-licensing-integration-adr-014`
- `Documentation/.Requirements/R01. AUTHENTICATION AND AUTHORIZATION/Design/04-Data-Model-Authentication-Authorization.md`
- `Documentation/.Requirements/R01. AUTHENTICATION AND AUTHORIZATION/Design/06-API-Contract.md`
- `Documentation/.Requirements/R01. AUTHENTICATION AND AUTHORIZATION/Design/14-Playwright-Test-Plan.md`
- `Documentation/requirements/ON-PREMISE-LICENSING-REQUIREMENTS.md`
- `Documentation/.Requirements/R08. Integration Hub/conversation.codexmd`
- `Documentation/lld/integration-hub-spec.md`
