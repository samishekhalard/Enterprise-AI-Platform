# 2. Constraints

## 2.1 Technical Constraints

| ID | Constraint | Rationale |
|----|------------|-----------|
| TC-01 | **Polyglot Persistence (Neo4j + PostgreSQL)** | Neo4j for auth-facade RBAC/identity graph; PostgreSQL for 6 active relational domain services. See [ADR-016](../adr/ADR-016-polyglot-persistence.md). |
| TC-02 | **Java 23 / Spring Boot 3.4.1** | Current language/runtime baseline with strong ecosystem support. See [ADR-002](../adr/ADR-002-spring-boot-3.4.md). |
| TC-03 | **Angular 21+** | Frontend framework baseline (signals, standalone components). |
| TC-04 | **Provider-Agnostic Authentication with Keycloak Default** | Auth architecture supports multiple identity providers via auth-facade; Keycloak is the default/current provider. See [ADR-004](../adr/ADR-004-keycloak-authentication.md) and [ADR-007](../adr/ADR-007-auth-facade-provider-agnostic.md). |
| TC-05 | **Valkey Distributed Cache** | Runtime uses Valkey as the distributed cache database. See [ADR-005](../adr/ADR-005-valkey-caching.md). |
| TC-06 | **PostgreSQL for Domain Services + Keycloak** | PostgreSQL serves tenant-service, user-service, license-service, notification-service, audit-service, ai-service, and Keycloak internal persistence. Tenant-scoped product/process/persona are modeled as domain objects, not standalone services. See [ADR-016](../adr/ADR-016-polyglot-persistence.md). |
| TC-07 | **Docker/Kubernetes** | Container-based deployment and orchestration model. |
| TC-08 | **REST/JSON APIs** | Service API communication standard. |
| TC-09 | **Kafka** | Event streaming backbone for asynchronous integration. |
| TC-10 | **Tenant UUID as Canonical External Identifier** | All external API paths/headers/query params must use tenant UUID (`a0000000-0000-0000-0000-000000000001` style). Legacy aliases (`tenant-master`, `master`) are compatibility-only. |

## 2.2 Version Baseline

| Component | Version | Status |
|-----------|---------|--------|
| Java | 23 (dev) / 21 LTS (prod) | Active |
| Spring Boot | 3.4.1 | Active |
| Spring Cloud | 2024.0.0 | Active |
| Angular | 21.1.0 | Active |
| Neo4j | 5.x | Active |
| PostgreSQL (domain services + Keycloak) | 16+ | Active |
| Keycloak | 24.0.1 | Active |
| Valkey cache | Valkey 8+ | Active |
| Flyway | 10.8.1 | Active |

## 2.3 Organizational Constraints

| ID | Constraint | Impact |
|----|------------|--------|
| OC-01 | Small cross-functional team | Prioritize clarity, automation, and maintainable patterns |
| OC-02 | Delivery speed requirements | Prefer pragmatic solutions over speculative complexity |
| OC-03 | Open-source preference | Favor OSS tooling where feasible |
| OC-04 | Cloud-native runtime target | Design for containers, observability, and horizontal scale |
| OC-05 | Docs-as-code governance | Architecture changes must update arc42 + ADR alignment |

## 2.4 Conventions

### Engineering Conventions

| Area | Convention |
|------|------------|
| Java style | Google Java Style + Checkstyle |
| TypeScript style | Angular Style Guide + ESLint |
| API errors | RFC 7807 Problem Details |
| API versioning | URI path versioning (`/api/v1`) |
| Tenant identifier | UUID-first on all external contracts (`X-Tenant-ID`, path params, query params) |
| Git commits | Conventional Commits |
| Architecture docs | arc42 + ADR in `docs/` |

### Documentation Conventions

| Rule | Standard |
|------|----------|
| Arc42 file set | Only `01`-`12` + `README` under `docs/arc42/` |
| Decision rationale | ADRs are the canonical source |
| Section ownership | Enforced by `docs/DOCUMENTATION-GOVERNANCE.md` |
| Automated quality checks | `.github/workflows/docs-quality.yml` |

## 2.5 Out of Scope (Current Release)

| Item | Status | Notes |
|------|--------|-------|
| Graph-per-tenant routing runtime | Planned | Designed in ADR-003/ADR-010, not implemented |
| Relational database as sole application store | Not Applicable | Polyglot persistence adopted per ADR-016 |
| Multi-database support beyond current baseline | Planned | MySQL/SQL Server deferred |
| Tenant integration hub | Planned | Deferred until explicit product requirement |

---

**Previous Section:** [Introduction and Goals](./01-introduction-goals.md)
**Next Section:** [Context and Scope](./03-context-scope.md)
