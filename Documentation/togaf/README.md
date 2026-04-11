> **WP-ARCH-ALIGN (2026-03-24):** This document has been updated to reflect the frozen auth target model (Rev 2).
> See `Foundation/03-ownership-boundaries.md` FROZEN for the canonical decision.

# TOGAF Workspace

This directory contains the TOGAF-oriented enterprise architecture workspace for EMS.

## Purpose

- Provide enterprise-level architecture governance and traceability.
- Keep strategy, roadmap, and implementation governance aligned.
- Link enterprise architecture artifacts with the canonical architecture set and ADR documentation.

## Relationship to Existing Documentation

- `Documentation/Architecture/`: software/system architecture narrative and views.
- `Documentation/Architecture/09-architecture-decisions.md`: temporary canonical decision register during normalization and redesign.
- `Documentation/togaf/`: enterprise architecture planning, transition, and governance artifacts.

## Architecture Baseline (Current)

Per [Architecture section 9.1.1](../Architecture/09-architecture-decisions.md#911-polyglot-persistence-adr-001-adr-016):

- **Neo4j:** [AS-IS] used by auth-facade for RBAC, identity graph, and provider configuration, and by definition-service for the metamodel graph. [TARGET] Neo4j is used by definition-service only (canonical object types). Auth-domain graph nodes (RBAC, identity, provider config) migrate to tenant-service on PostgreSQL. Auth-facade is removed after migration.
- **PostgreSQL:** used by 7 domain services (tenant, user, license, notification, audit, ai, process) and by Keycloak for internal persistence.
- **Valkey 8:** distributed caching for auth-facade token/session data.
- **Valkey 8:** [TARGET] Cache only -- non-authoritative. No persistent auth state in Valkey.
- **Identity:** [AS-IS] provider-agnostic auth architecture with Keycloak as default provider, auth-facade as orchestrator. [TARGET] Keycloak handles authentication only (login, MFA, token issuance, federation). tenant-service owns tenant users, RBAC, memberships, session control, and revocation (PostgreSQL authoritative). api-gateway becomes the edge home for auth endpoints. auth-facade is removed after migration.

## TOGAF ADM Deliverables (Working Set)

| File | ADM Phase | Purpose |
|------|-----------|---------|
| `01-architecture-vision.md` | A | Vision, scope, stakeholders, business outcomes |
| `02-business-architecture.md` | B | Capabilities, value streams, operating model |
| `03-data-architecture.md` | C (Data) | Data entities, ownership, quality, lifecycle |
| `04-application-architecture.md` | C (Application) | Application services, interfaces, interactions |
| `05-technology-architecture.md` | D | Platform, runtime, infrastructure standards |
| `06-opportunities-solutions.md` | E | Solution options and work package candidates |
| `07-migration-planning.md` | F | Transition roadmap and dependency plan |
| `08-implementation-governance.md` | G | Architecture contracts and compliance controls |
| `09-architecture-change-management.md` | H | Change triggers and architecture lifecycle |
| `10-requirements-management.md` | Central | Requirement backlog and traceability |

## Supporting Folders

- `artifacts/catalogs/`: architecture catalogs.
- `artifacts/matrices/`: traceability matrices.
- `artifacts/principles/`: architecture principles.
- `artifacts/repository/`: ABB/SBB and capability registers.
- `artifacts/diagrams/`: diagram index and source conventions.
- `mapping/`: architecture/ADR to TOGAF traceability maps.
- `governance/`: architecture board rules and review checklist.
- `templates/`: reusable templates for contracts and work packages.

## Working Conventions

- Keep each file concise and actionable.
- Avoid duplicating ADR rationale; link ADRs instead.
- Update traceability matrices whenever architecture decisions change.
- Treat this workspace as docs-as-code and review through PR.

## Next Step

Start with [01-architecture-vision.md](./01-architecture-vision.md), then complete phases in order while updating `mapping/` and `artifacts/matrices/`.
