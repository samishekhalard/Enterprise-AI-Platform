# arc42 Architecture Documentation

This directory contains the authoritative architecture description for EMS using the arc42 structure.

Governance and ownership rules are defined in [Documentation Governance](../DOCUMENTATION-GOVERNANCE.md).

## Current Baseline

- Application databases: Polyglot persistence -- Neo4j for auth-facade RBAC/identity graph, PostgreSQL for relational domain services ([ADR-016](../adr/ADR-016-polyglot-persistence.md)).
- Authentication: provider-agnostic architecture with Keycloak as default provider.
- PostgreSQL usage: 7 domain services (tenant, user, license, notification, audit, ai, process) + Keycloak internal persistence.

## Sections

| # | Section | Purpose |
|---|---------|---------|
| 1 | [Introduction and Goals](./01-introduction-goals.md) | Business intent and goals |
| 2 | [Constraints](./02-constraints.md) | Non-negotiable constraints and standards |
| 3 | [Context and Scope](./03-context-scope.md) | External/internal context and interfaces |
| 4 | [Solution Strategy](./04-solution-strategy.md) | Strategic architecture approach |
| 5 | [Building Blocks](./05-building-blocks.md) | Static decomposition and ownership |
| 6 | [Runtime View](./06-runtime-view.md) | Key runtime scenarios |
| 7 | [Deployment View](./07-deployment-view.md) | Infrastructure and environment model |
| 8 | [Crosscutting Concepts](./08-crosscutting.md) | Shared technical policies and patterns |
| 9 | [Architecture Decisions](./09-architecture-decisions.md) | ADR index and status mapping |
| 10 | [Quality Requirements](./10-quality-requirements.md) | Quality targets and measurable criteria |
| 11 | [Risks and Technical Debt](./11-risks-technical-debt.md) | Active risks and debt posture |
| 12 | [Glossary](./12-glossary.md) | Common architecture terminology |

## Source-of-Truth Rules

- Constraints are canonical in section 2.
- Decision rationale is canonical in ADR files.
- Section 9 is an index/status view, not a rationale duplicate.

---

**Template:** arc42 v8.2  
**Last Updated:** 2026-02-25
