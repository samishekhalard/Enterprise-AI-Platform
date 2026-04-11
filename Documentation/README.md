> **WP-ARCH-ALIGN (2026-03-24):** This document has been updated to reflect the frozen auth target model (Rev 2).
> See [R02 ownership boundaries](./.Requirements/.references/R02.%20TENANT%20MANAGEMENT/Foundation/03-ownership-boundaries.md) for the canonical decision.

# Documentation Index

> Architecture, decision, and design documentation for EMS.

## Governance

Documentation standards, templates, validation rules, and team principles live under [governance/](./governance/).
Operational architecture status is tracked in [Architecture Hub](./Architecture/README.md).
Canonical decision rationale is currently tracked in [Architecture Decisions](./Architecture/09-architecture-decisions.md).

## Current Architecture Baseline

- Application databases: Polyglot persistence -- [AS-IS] Neo4j for auth-facade RBAC/identity graph and definition-service metamodel graph; [TARGET] Neo4j removed from auth domain (RBAC/memberships migrate to tenant-service on PostgreSQL), Neo4j retained for definition-service only. PostgreSQL for relational domain services.
- Identity provider: Auth-facade supports multiple providers; Keycloak is the default provider.
- PostgreSQL usage: PostgreSQL serves 7 domain services + Keycloak internal persistence.

## Documentation Sets

| Folder | Purpose | Owner |
|--------|---------|-------|
| [Architecture/](./Architecture/) | Canonical architecture hub and 01-12 section set | Architecture |
| [lld/](./lld/) | Low-level design documents | SA |
| [data-models/](./data-models/) | Data model specifications | SA |
| [.Requirements/](./.Requirements/) | Module requirements, design artifacts, and feature streams | BA / SA / Architecture |
| [togaf/](./togaf/) | Enterprise architecture governance and traceability | Architecture |
| [governance/](./governance/) | Standards, quality gates, and agent governance | Architecture |

## Quick Navigation

1. [Architecture Hub](./Architecture/README.md)
2. [Low-Level Designs](./lld/)
3. [TOGAF Repository](./togaf/README.md)
4. [Requirements Streams](./.Requirements/)
5. [Data Models](./data-models/)
6. [System Graphs](./.Requirements/G02.%20Data%20architecture/G02.01.%20System%20Graphs/)
7. [Governance Checklists](./governance/checklists/)

## Quality Gates

- CI workflow: `.github/workflows/docs-quality.yml`
- Markdown lint configuration: `.markdownlint.yml`
- Legacy docs consistency checks: `scripts/validate-docs-consistency.sh`
