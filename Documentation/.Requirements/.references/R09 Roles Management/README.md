# Roles Management

**Feature:** Canonical runtime roles, permission boundaries, tenant-scoped authorization, and role lifecycle governance
**Owner:** Architecture / Security / Backend Platform
**Status:** [DRAFT]
**Date:** 2026-03-17

---

## Scope

This requirement track exists to normalize how EMSIST defines, bootstraps, resolves, enforces, and audits roles.

R09 is needed because the current repo already has a working authorization model, but the model is not described consistently across code, bootstrap scripts, and requirement documents:

- Keycloak bootstrap and Neo4j seed a 5-role base hierarchy: `VIEWER`, `USER`, `MANAGER`, `ADMIN`, `SUPER_ADMIN`
- Several services also enforce `TENANT_ADMIN`
- Some requirement documents invented labels such as `PLATFORM_ADMIN`
- Personas, runtime roles, user tiers, and permissions are sometimes treated as if they are the same thing

R09 creates one canonical source of truth for roles management so future feature tracks do not repeat this drift.

## Documentation Index

| # | Document | Status | Description |
|---|----------|--------|-------------|
| 01 | [01-As-Is-Roles-Management-Baseline.md](./01-As-Is-Roles-Management-Baseline.md) | Draft | Single-document as-is baseline from code, Architecture, TOGAF, ADRs, and related requirements |
| 02 | [02-Brainstormed-System-Role-Management-Capability-Areas.md](./02-Brainstormed-System-Role-Management-Capability-Areas.md) | Draft | Brainstormed capability areas for system role management, not yet approved requested scope |
| 03 | [03-Roles-Management-Phase0-Phase1-Implementation-Plan.md](./03-Roles-Management-Phase0-Phase1-Implementation-Plan.md) | Draft | Initial workstream plan for canonicalization and foundation work |
| 04 | [conversation.codexmd](./conversation.codexmd) | Draft | Working baseline for Codex-driven design and implementation |
| 05 | [Coversation_claude.md](./Coversation_claude.md) | Draft | Working baseline for Claude-driven design and implementation |
| 06 | [conversation.md](./conversation.md) | Draft | Tool-agnostic working baseline |

## Canonical References

| Artifact | Purpose |
|----------|---------|
| `infrastructure/keycloak/keycloak-init.sh` | Realm role bootstrap and default hierarchy |
| `backend/auth-facade/src/main/resources/neo4j/migrations/V004__create_default_roles.cypher` | Auth graph role seed and inheritance |
| `backend/auth-facade/src/main/java/com/ems/auth/graph/entity/RoleNode.java` | Role graph entity and inheritance semantics |
| `backend/auth-facade/src/main/java/com/ems/auth/security/ProviderAgnosticRoleConverter.java` | JWT role extraction and normalization |
| `backend/auth-facade/src/main/java/com/ems/auth/security/TenantAccessValidator.java` | Cross-tenant `SUPER_ADMIN` bypass rule |
| `backend/api-gateway/src/main/java/com/ems/gateway/config/SecurityConfig.java` | Gateway route-level enforcement pattern |
| Service `SecurityConfig.java` classes | Per-service endpoint authorization patterns |
| `Documentation/Architecture/09-architecture-decisions.md#936-rbac-and-licensing-integration-adr-014` | Existing RBAC and licensing rationale |

## Outcome

The expected end state is straightforward:

- EMSIST has a canonical runtime role registry
- persona labels are clearly separated from runtime roles
- user tiers and license tiers are clearly separated from roles
- bootstrap, JWT extraction, graph resolution, and service enforcement use the same role contract
- `PLATFORM_ADMIN` is treated as a business label only, not a runtime role
- `TENANT_ADMIN` is either fully normalized into the platform contract or intentionally retired with a safe migration path
