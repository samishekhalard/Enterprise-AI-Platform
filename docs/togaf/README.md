# TOGAF Workspace

This directory contains the TOGAF-oriented enterprise architecture workspace for EMS.

## Purpose

- Provide enterprise-level architecture governance and traceability.
- Keep strategy, roadmap, and implementation governance aligned.
- Link enterprise architecture artifacts with existing arc42 and ADR documentation.

## Relationship to Existing Documentation

- `docs/arc42/`: software/system architecture narrative and views.
- `docs/adr/`: architecture decision rationale and history.
- `docs/togaf/`: enterprise architecture planning, transition, and governance artifacts.

## Architecture Baseline (Current)

Per [ADR-016 Polyglot Persistence](../adr/ADR-016-polyglot-persistence.md):

- **Neo4j:** used by auth-facade for RBAC, identity graph, and provider configuration.
- **PostgreSQL:** used by 7 domain services (tenant, user, license, notification, audit, ai, process) and by Keycloak for internal persistence.
- **Valkey 8:** distributed caching for auth-facade token/session data.
- **Identity:** provider-agnostic auth architecture with Keycloak as default provider.

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
- `mapping/`: arc42/ADR to TOGAF traceability maps.
- `governance/`: architecture board rules and review checklist.
- `templates/`: reusable templates for contracts and work packages.

## Working Conventions

- Keep each file concise and actionable.
- Avoid duplicating ADR rationale; link ADRs instead.
- Update traceability matrices whenever architecture decisions change.
- Treat this workspace as docs-as-code and review through PR.

## Next Step

Start with [01-architecture-vision.md](./01-architecture-vision.md), then complete phases in order while updating `mapping/` and `artifacts/matrices/`.
