# Tenant Management — Feature Documentation

**Feature:** Tenant Management  
**Requirement Track:** `R02`  
**Owner:** BA / Architecture / SA  
**Status:** `[PROVISIONAL]` — canonical design package under refinement; not yet baselined  
**Date:** 2026-03-25

---

## Purpose

This package is the canonical requirement and design set for Tenant Management.

The product scope of `R02` is:

1. manage tenants
2. manage object definitions in tenant context
3. manage object instances in tenant context

`R02` must not be designed in isolation where object definitions, object instances, the information model, or tenant-scoped governance are concerned. Those areas are coupled to:

- [R04. MASTER DESFINITIONS](../R04.%20MASTER%20DESFINITIONS/README.md)
- `R01` for authentication and authorization constraints
- `R07` for platform setup, provisioning, backup, restore, and delivery
- `R08` for integration-boundary implications

---

## Governance Position

This track is still provisional because the full to-be design bundle is not yet sealed.

Nothing in `R02` may be treated as baselined until the following are aligned and approved together:

- business/journey/touchpoint scope
- service/application boundaries and interactions
- information model:
  - platform / system graph
  - object definition graph
  - object instance graph
  - PostgreSQL canonical model
  - ERD
- security/control rules
- integration implications
- operations/setup model
- PRD, stories, and prototypes

---

## Canonical Artifact Set

The following documents are the canonical `R02` design package.

### Foundation

| # | Document | Status | Purpose |
|---|----------|--------|---------|
| 00 | [Foundation Track](./Foundation/00-FOUNDATION-TRACK.md) | Active | Foundation governance, approvals, and remaining blockers |
| 01 | [Node Inventory](./Foundation/01-node-inventory.md) | Approved with reservations | As-is/foundation inventory |
| 02 | [Relationship Inventory](./Foundation/02-relationship-inventory.md) | Approved with reservations | As-is/foundation inventory |
| 03 | [Ownership Boundaries](./Foundation/03-ownership-boundaries.md) | Approved (Rev 2) | Frozen auth/domain ownership baseline |
| 04 | [Data Residency](./Foundation/04-data-residency.md) | Approved with reservations | Storage and retention baseline |
| 05 | [Topology Contract](./Foundation/05-topology-contract.md) | Approved (Rev 2) | Auth topology frozen; non-auth graph still subject to final design alignment |
| 06 | [Forks, Gaps, Blockers](./Foundation/06-forks-gaps-blockers.md) | Approved (Rev 2) | Known gaps and decision pressure points |

### Design

| # | Document | Status | Purpose |
|---|----------|--------|---------|
| 00 | [Fact Sheet Pattern](./Design/00-FACT-SHEET-PATTERN.md) | Draft | Pattern guidance for fact-sheet style views |
| 01 | [PRD](./Design/01-PRD-Tenant-Management.md) | Draft | Primary product requirement document |
| 02 | [Technical Specification](./Design/02-Technical-Specification-Tenant-Management.md) | Draft | Technical-design baseline for `R02` |
| 03 | [Data Model](./Design/03-Data-Model-Tenant-Management.md) | Draft | Canonical data model — PG schema, graph scope, cross-store references |
| -- | [Story Inventory](./Design/R02-COMPLETE-STORY-INVENTORY.md) | Draft | Story-level traceability |
| -- | [Journey Maps](./Design/R02-journey-maps.md) | Draft | Journey and touchpoint material |
| -- | [Message Code Registry](./Design/R02-MESSAGE-CODE-REGISTRY.md) | Draft | UX/API message code registry |
| -- | [Stale Doc Impact Map](./Design/R02-STALE-DOC-IMPACT-MAP.md) | Draft | Documentation change impact map |
| -- | `R02-screen-flow-prototype.html` / `R02-journey-map.html` | Draft | Visual review aids only; not baseline |

---

## Non-Canonical Repair Artifacts

The following files are review and repair artifacts. They are useful for correction, but they are not the canonical source of truth for `R02`.

| Document | Role |
|----------|------|
| [PROVISIONAL.md](./PROVISIONAL.md) | Governance guardrail preventing false baseline claims |
| [07-tobe-system-graph.md](./Foundation/07-tobe-system-graph.md) | Problematic draft under revision; not approved |
| [07-feedback-ledger.md](./Foundation/07-feedback-ledger.md) | Partial feedback capture; not the full canonical decision record |
| [REVIEW-BRIEF.md](./REVIEW-BRIEF.md) | Review aid created to restore readability; not the requirement baseline |

Rule:

- no statement from these repair artifacts becomes authoritative unless it is folded back into the canonical `R02` and related requirement documents

---

## Immediate Authoring Priorities

The next authoring work for `R02` is:

1. repair the `R02` design package in canonical documents, not in side documents
2. align `R02` and `R04` on object definition and object instance concerns
3. separate product requirement, design baseline, and later implementation/migration concerns cleanly
4. ensure the to-be model is expressed in the proper requirement artifacts before any baseline claim is made

### Expected Next Canonical Documents

To reach the same usable design depth as `R04`, `R02` is expected to grow the following canonical artifacts:

| Planned Artifact | Purpose |
|------------------|---------|
| Tenant Management Technical Specification | Application/service design baseline for `R02` |
| Tenant Management Data Model | PostgreSQL canonical model, graph boundaries, cross-store references |
| Tenant Management API Contract | External and internal API surfaces for tenant management flows |
| Tenant Management Security Requirements | Tenant isolation, authorization, audit, and control requirements |
| Tenant Management Test Strategy | Requirement-to-test coverage and release gates |

These are not auto-approved by being listed here. They are the expected canonical artifacts to be authored inside the `R02` package.

---

## Review Rule

Until the full design bundle is aligned, `R02` remains:

- reviewable
- editable
- traceable

but **not baselined**.
