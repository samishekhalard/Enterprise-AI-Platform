> **WP-ARCH-ALIGN (2026-03-24):** This document has been updated to reflect the frozen auth target model (Rev 2).
> See `Foundation/03-ownership-boundaries.md` FROZEN for the canonical decision.

# 2. Constraints

## 2.1 Technical Constraints

| ID | Constraint | Rationale |
|----|------------|-----------|
| TC-01 | **Polyglot Persistence (Neo4j + PostgreSQL)** | [AS-IS] Neo4j for auth-facade RBAC/identity graph; [TARGET] RBAC/memberships migrate to tenant-service (PostgreSQL), Neo4j retained for definition-service only. PostgreSQL for relational domain services. See polyglot persistence design decision. |
| TC-02 | **Java 23 / Spring Boot 3.4.1** | Current language/runtime baseline with strong ecosystem support. See Spring Boot technology baseline. |
| TC-03 | **Angular 21+** | Frontend framework baseline (signals, standalone components). |
| TC-04 | **Provider-Agnostic Authentication with Keycloak Default** | Auth architecture supports multiple identity providers via auth-facade; Keycloak is the default/current provider. See authentication and provider-agnostic design decisions. |
| TC-05 | **Valkey Distributed Cache** | Runtime uses Valkey as the distributed cache database. See Valkey caching design decision. |
| TC-06 | **PostgreSQL for Domain Services + Keycloak** | PostgreSQL serves tenant-service, user-service, license-service, notification-service, audit-service, ai-service, and Keycloak internal persistence. Tenant-scoped product/process/persona are modeled as domain objects, not standalone services. See polyglot persistence design decision. |
| TC-07 | **Docker/Kubernetes** | Container-based deployment and orchestration model. |
| TC-08 | **REST/JSON APIs** | Service API communication standard. |
| TC-09 | **Kafka** | Event streaming backbone for asynchronous integration. |
| TC-10 | **Tenant UUID as Canonical External Identifier** | All external API paths/headers/query params must use tenant UUID (`a0000000-0000-0000-0000-000000000001` style). Legacy aliases (`tenant-master`, `master`) are compatibility-only. |
| TC-11 | **Spring AI 1.0+ for LLM integration**  | Standardized ChatClient + ReAct tool loop replacing custom WebClient providers. See Super Agent hierarchical architecture design. |
| TC-12 | **EU AI Act compliance**  | Risk classification, human oversight requirements, transparency obligations. See platform ethics baseline design. |
| TC-13 | **Agent token budget limits**  | Per-model ceiling (GPT-4o 128K, Claude 200K, Gemini 1M, Llama 128K). See dynamic system prompt composition design. |
| TC-14 | **Schema-per-tenant for agent data**  | PostgreSQL schema isolation for worker drafts, maturity scores, conversation history. See schema-per-tenant agent data design. |
| TC-15 | **Debezium CDC for entity lifecycle events**  | Kafka Connect source connector for event-driven agent triggers. See event-driven agent triggers design. |

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
| Spring AI | 1.0+ |  |
| Debezium | 2.x |  |
| ShedLock | 5.x |  |

## 2.3 Organizational Constraints

| ID | Constraint | Impact |
|----|------------|--------|
| OC-01 | Small cross-functional team | Prioritize clarity, automation, and maintainable patterns |
| OC-02 | Delivery speed requirements | Prefer pragmatic solutions over speculative complexity |
| OC-03 | Open-source preference | Favor OSS tooling where feasible |
| OC-04 | Cloud-native runtime target | Design for containers, observability, and horizontal scale |
| OC-05 | Docs-as-code governance | Architecture changes must update Architecture documents alignment |

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
| Architecture docs | Architecture documents in `docs/` |

### Documentation Conventions

| Rule | Standard |
|------|----------|
| Arc42 file set | Only `01`-`12` + `README` under `Documentation/Architecture/` |
| Decision rationale | `Documentation/Architecture/09-architecture-decisions.md` is the canonical source during normalization |
| Section ownership | Enforced by `Documentation/DOCUMENTATION-GOVERNANCE.md` |
| Automated quality checks | `.github/workflows/docs-quality.yml` |

## 2.5 Out of Scope (Current Release)

| Item | Status | Notes |
|------|--------|-------|
| Graph-per-tenant routing runtime | Deferred | Designed but not part of current release |
| Relational database as sole application store | Not Applicable | Polyglot persistence adopted per ADR-016 |
| Multi-database support beyond current baseline | Planned | MySQL/SQL Server deferred |
| Tenant integration hub | Planned | Deferred until explicit product requirement |
| Super Agent autonomous mode (Graduate level, ATS >= 85) | Deferred | Requires maturity model validation across tenants |
| Multi-model agent routing (different LLM per worker) | Deferred | Design complete, implementation deferred |

---

## Changelog

| Timestamp | Change | Author |
|-----------|--------|--------|
| 2026-03-08 | Wave 2-3: Added Super Agent technical constraints TC-11 through TC-15, version baseline additions (Spring AI, Debezium, ShedLock), out of scope items | ARCH Agent |
| 2026-03-09T14:30Z | Wave 6 (Final completeness): Verified TC-11 through TC-15 complete with rationale. All constraints have context and justification. Zero TODOs, TBDs, or placeholders. Changelog added. | ARCH Agent |

---

**Previous Section:** [Introduction and Goals](./01-introduction-goals.md)
**Next Section:** [Context and Scope](./03-context-scope.md)
