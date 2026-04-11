> **WP-ARCH-ALIGN (2026-03-24):** This document has been updated to reflect the frozen auth target model (Rev 2).
> See `Foundation/03-ownership-boundaries.md` SS FROZEN for the canonical decision.

# Architecture Hub

This directory is the operational source of truth for architecture status across EMSIST.

Governance and ownership rules are defined in [Documentation Governance](../DOCUMENTATION-GOVERNANCE.md). Normalization work is tracked in [Architecture and Requirements Docs Normalization Plan](../governance/ARCH-REQUIREMENTS-DOCS-NORMALIZATION-PLAN.md).

## Current Baseline

- Application databases: [AS-IS] Polyglot persistence -- Neo4j for `auth-facade` and `definition-service`, PostgreSQL for relational domain services. [TARGET] Neo4j for `definition-service` only (canonical object types). Auth data migrates from Neo4j to `tenant-service` PostgreSQL. `auth-facade` is removed after migration; auth edge endpoints move to `api-gateway`, auth data/policy to `tenant-service`.
- Authentication: provider-agnostic architecture with Keycloak as default provider.
- PostgreSQL usage: 7 domain services (`tenant`, `user`, `license`, `notification`, `audit`, `ai`, `process`) + Keycloak internal persistence.

## Status Tags

### Repository Status

| Tag | Meaning |
|-----|---------|
| `ACTIVE` | Canonical location in current use |
| `TRANSITION` | Still in use but being normalized |
| `LEGACY` | Deprecated path kept only for compatibility or reference |
| `BLOCKED` | Cannot be treated as canonical until a structural issue is fixed |

### Code Reality Status

| Tag | Meaning |
|-----|---------|
| `IMPLEMENTED` | Materially realized in the current codebase |
| `PARTIAL` | Foundational implementation exists but docs exceed code |
| `DESIGN-ONLY` | Documented but not implemented in the current checkout |

## Repository Status Board

| Domain | Canonical Path | Repository Status | Code Reality | Notes |
|--------|----------------|-------------------|--------------|-------|
| System architecture | `Documentation/Architecture/` | `ACTIVE` | `PARTIAL` | This directory is the architecture hub and canonical 01-12 set |
| LLD | `Documentation/lld/` | `ACTIVE` | `PARTIAL` | Valid location, but decision references still need broader cleanup |
| TOGAF | `Documentation/togaf/` | `ACTIVE` | `PARTIAL` | Governance set is real, but decision traceability links still need cleanup |
| Requirements | `Documentation/.Requirements/` | `ACTIVE` | `PARTIAL` | Working product/design repository; contains both valid feature docs and duplicated system architecture |
| Placeholder arc42 path | `Documentation/arc42/` | `LEGACY` | `DESIGN-ONLY` | Placeholder only; not the canonical architecture set |
| Legacy docs path | `docs/arc42/` | `LEGACY` | `PARTIAL` | Divergent legacy tree; do not use as source of truth |
| Decision register | `Documentation/Architecture/09-architecture-decisions.md` | `ACTIVE` | `PARTIAL` | Temporary canonical decision register during documentation normalization and architecture redesign |

## Stream Status Board

| Stream | Primary Docs | Code Reality | Status | Notes |
|--------|--------------|--------------|--------|-------|
| R01 Authentication and Authorization | `Documentation/.Requirements/R01. AUTHENTICATION AND AUTHORIZATION/` | `PARTIAL` | `TRACKED` | `auth-facade` and identity-provider admin UI are substantial and active |
| R04 Master Definitions | `Documentation/.Requirements/R04. MASTER DESFINITIONS/` | `PARTIAL` | `TRACKED` | Core definition management exists in `definition-service` and frontend administration |
| R05 Agent Manager | `Documentation/.Requirements/R05. AGENT MANAGER/` | `PARTIAL` | `TRACKED` | Current AI service exists; advanced SuperAgent architecture remains ahead of code |
| R06 Localization | `Documentation/.Requirements/R06. Localization/` | `PARTIAL` | `TRACKED` | Locale/message foundations exist; administration workflow is still shallow |
| R08 Integration Hub | `Documentation/.Requirements/R08. Integration Hub/` | `DESIGN-ONLY` | `TRACKED` | No `backend/integration-service/` in current checkout |
| R09 Roles Management | `Documentation/.Requirements/R09 Roles Management/` | `PARTIAL` | `TRACKED` | Roles exist as cross-cutting auth/security behavior, not dedicated CRUD module |

## Current Structural Gaps

| Gap | Status | Owner | Tracking |
|-----|--------|-------|----------|
| Legacy `docs/arc42/` tree diverges from active architecture | `OPEN` | ARCH + DOC | [Normalization Plan](../governance/ARCH-REQUIREMENTS-DOCS-NORMALIZATION-PLAN.md) |
| `Documentation/arc42/` placeholder confuses traceability | `OPEN` | ARCH + DOC | [Normalization Plan](../governance/ARCH-REQUIREMENTS-DOCS-NORMALIZATION-PLAN.md) |
| Many scoped docs still point to a separate ADR directory instead of section 09 | `OPEN` | ARCH + DOC | [Normalization Plan](../governance/ARCH-REQUIREMENTS-DOCS-NORMALIZATION-PLAN.md) |
| Some architecture statements still understate Neo4j usage by omitting `definition-service` | `OPEN` | ARCH + DOC | This hub + future architecture cleanup |

## Update Protocol

When architecture or requirements status changes:

1. Update the relevant row in `Repository Status Board` or `Stream Status Board`.
2. Update [Discrepancy Log](../governance/DISCREPANCY-LOG.md) if the change resolves or introduces drift.
3. Update the affected architecture section below if the canonical description changed.
4. Keep code-reality tags evidence-based: do not mark `IMPLEMENTED` unless source code exists.

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
| 9 | [Architecture Decisions](./09-architecture-decisions.md) | Consolidated architecture decisions and principles |
| 10 | [Quality Requirements](./10-quality-requirements.md) | Quality targets and measurable criteria |
| 11 | [Risks and Technical Debt](./11-risks-technical-debt.md) | Active risks and debt posture |
| 12 | [Glossary](./12-glossary.md) | Common architecture terminology |

## Source-of-Truth Rules

- `Documentation/Architecture/` is the canonical architecture root.
- Constraints are canonical in section 2.
- Decision rationale and principles are canonical in section 9 during documentation normalization and architecture redesign.
- LLD, TOGAF, and `.Requirements` may extend or trace architecture, but they do not replace this directory.

---

**Last Updated:** 2026-03-19
