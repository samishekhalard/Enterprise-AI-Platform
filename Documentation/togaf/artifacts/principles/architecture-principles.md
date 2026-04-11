> **WP-ARCH-ALIGN (2026-03-24):** This document has been updated to reflect the frozen auth target model (Rev 2).
> See `Foundation/03-ownership-boundaries.md` S FROZEN for the canonical decision.

# Architecture Principles

## Principle Register

| ID | Principle | Rationale | Implication |
|----|-----------|-----------|-------------|
| AP-01 | Single EMS application data platform | Consistent data model and reduced operational split | All EMS services use Neo4j for domain data |
| AP-02 | Explicit identity boundary | Identity internals remain isolated from domain data | PostgreSQL is Keycloak-internal only |
| AP-03 | Secure-by-default multi-tenancy | Prevent cross-tenant leakage by design | Tenant context required in access flows and queries |
| AP-04 | Provider-agnostic auth integration | Reduce lock-in and keep integration flexibility | Identity provider abstraction maintained in auth-facade |
| AP-05 | Observable by design | Faster troubleshooting and better SLO governance | Structured logs, metrics, traces are mandatory |
| AP-06 | ADR-backed architecture change | Preserve decision traceability | Material changes require ADR updates |
| AP-07 | Defense in depth | Layered security prevents single-point compromise; three-tier encryption ensures data protection at rest, in transit, and in configuration | Volume encryption (LUKS/FileVault), TLS 1.3 for all transport, Jasypt AES-256 for sensitive config values; per-service database credentials with SCRAM-SHA-256; network segmentation between service tiers (ADR-019, ADR-020) |
| AP-08 | Fail-fast configuration | Prevent silent failures from missing or incorrect environment configuration; eliminate insecure defaults that could leak into production | No hardcoded credential fallbacks in application.yml; missing required environment variables (DB_PASSWORD, KEYCLOAK_CLIENT_SECRET, etc.) cause startup failure via Spring Boot validation; @ConfigurationProperties classes use @Validated with @NotBlank constraints (ADR-020, ADR-022) |
| AP-09 | Docs-as-code governance | Architecture documentation must stay synchronized with implementation; drift between docs and code erodes trust and causes incorrect decisions | Architecture changes must update ADR + arc42 + TOGAF alignment before merge; hourly documentation audits verify claims against codebase; three-state classification ([IMPLEMENTED], [IN-PROGRESS], [PLANNED]) is mandatory for all feature descriptions |
| AP-10 | Polyglot persistence | Right database for the right workload reduces impedance mismatch and operational complexity; a single-database strategy forces suboptimal data models | [AS-IS] Neo4j for RBAC graph traversal and identity relationships (auth-facade only). [TARGET] Neo4j for definition-service only; RBAC migrates to tenant-service (PostgreSQL). PostgreSQL for relational domain data (tenant, user, license, notification, audit, ai, process services); Valkey for distributed caching; database selection must be justified per ADR-016 |
| AP-11 | Tenant-first data isolation | All data access must be scoped to the requesting tenant; cross-tenant data leakage is a critical security failure | All data queries enforce tenant predicates (tenant_id column discrimination for PostgreSQL; graph labels for Neo4j); external API contracts use UUIDs, never internal database identifiers; tenant context is injected at the gateway and propagated through all service layers (ADR-003, ADR-010) |
| AP-12 | Default deny authorization | Reduce attack surface by requiring explicit grants; new capabilities must be consciously enabled rather than accidentally exposed | New API endpoints and feature flags are denied by default until explicitly granted in RBAC policy; composite authorization evaluates RBAC role + license entitlement + data classification level; @PreAuthorize and @FeatureGate annotations are mandatory on all protected endpoints (ADR-014) |

## Principle Compliance Notes

| Principle | Compliance Check | Evidence |
|-----------|------------------|----------|
| AP-01 | Service data-store mapping review | arc42 section 5 + code config |
| AP-02 | Keycloak persistence boundary validation | deployment/data architecture docs |
| AP-03 | Tenant isolation tests and query review | integration tests + review logs |
| AP-04 | Provider strategy contract unchanged | auth-facade design/code |
| AP-05 | Observability controls present | dashboards + alert definitions |
| AP-06 | ADR + arc42 synchronized | PR evidence |
| AP-07 | Encryption layer verification: volume (LUKS/FileVault active), transport (TLS certificates valid, no HTTP endpoints), config (Jasypt-encrypted values in application.yml); per-service credential audit (no shared passwords, SCRAM-SHA-256 auth) | infrastructure/docker/docker-compose.yml credential config + TLS certificate inventory + Jasypt ENC() values in application.yml |
| AP-08 | Startup failure test: remove required env vars and verify service refuses to start; scan application.yml for hardcoded password/secret values; verify @Validated on all @ConfigurationProperties classes | CI integration test (remove env var, assert exit code 1) + grep scan for hardcoded defaults |
| AP-09 | Hourly documentation audit results; ADR status matches implementation reality; three-state tags present on all feature descriptions; arc42 sections cross-referenced with code paths | docs/governance/DISCREPANCY-LOG.md + ADR Implementation Reality table in CLAUDE.md |
| AP-10 | Each service's data store matches ADR-016 assignment; no service uses a database technology outside its designated store; application.yml datasource config matches architecture | application-to-data-matrix.md + application.yml datasource verification per service |
| AP-11 | All repository queries include tenant predicate; no endpoint returns data without tenant context; UUID used in all external API responses (no internal long IDs exposed) | Integration tests with multi-tenant scenarios + API contract review |
| AP-12 | New endpoints have @PreAuthorize annotation; feature flags default to disabled; authorization matrix covers RBAC + license + data classification for each endpoint | SEC agent security review + endpoint annotation scan |
