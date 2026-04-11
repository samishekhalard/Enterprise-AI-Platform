# Documentation Index

> Architecture, decision, and design documentation for EMS.

## Governance

All documentation follows [Documentation Governance](./DOCUMENTATION-GOVERNANCE.md).

## Current Architecture Baseline

- Application databases: Polyglot persistence -- Neo4j for auth-facade RBAC/identity graph, PostgreSQL for relational domain services (ADR-016).
- Identity provider: Auth-facade supports multiple providers; Keycloak is the default provider.
- PostgreSQL usage: PostgreSQL serves 7 domain services + Keycloak internal persistence.

## Documentation Sets

| Folder | Purpose | Owner |
|--------|---------|-------|
| [arc42/](./arc42/) | Architecture baseline and views | Architecture |
| [adr/](./adr/) | Architecture decision records | Architecture / SA |
| [lld/](./lld/) | Low-level design documents | SA |
| [data-models/](./data-models/) | Data model specifications | SA |
| [ai-service/](./ai-service/) | AI platform baseline docs (PRD, tech spec, epics, workflow guide) | Architecture / SA / BA |
| [governance/](./governance/) | Standards, quality gates, and agent governance | Architecture |

## Quick Navigation

1. [arc42 Architecture](./arc42/README.md)
2. [ADR Index](./adr/README.md)
3. [Low-Level Designs](./lld/)
4. [Data Models](./data-models/)
5. [AI Service Baseline](./ai-service/README.md)
6. [Frontend Production Readiness Backlog](./backlog/FRONTEND-PRODUCTION-READINESS-NON-NEGOTIABLE.md)
7. [Spring Boot Conformance Standard](./governance/SPRING-BOOT-CONFORMANCE-STANDARD.md)

## Quality Gates

- CI workflow: `.github/workflows/docs-quality.yml`
- Markdown lint configuration: `.markdownlint.yml`
- Arc42 consistency checks: `scripts/validate-docs-consistency.sh`
