# Roles Management - Phase 0 + Phase 1 Implementation Plan

**Track:** R09 Roles Management
**Status:** Draft
**Date:** 2026-03-17
**Purpose:** Turn the current role model into a governed, testable, and implementation-ready platform contract.

---

## 1. Scope Position

This implementation plan must stay subordinate to the eventual approved R09 scope.

- [02-Brainstormed-System-Role-Management-Capability-Areas.md](./02-Brainstormed-System-Role-Management-Capability-Areas.md)

That document is a brainstorming record, not an approved feature contract.

The following items were discussed as possible capability areas:

1. view seeded and custom system roles
2. create custom system roles
3. edit custom system roles
4. delete custom system roles
5. configure inheritance between system roles
6. configure how tenant tiers map to system roles
7. preview effective access from inheritance
8. audit changes to system-role configuration

This plan must not treat those brainstormed items as approved scope without an explicit design decision.

---

## 2. Delivery Shape

| Phase | Goal | Outcome |
|---|---|---|
| Phase 0 | Canonicalize the model | One agreed role registry, alias policy, scope model, and drift decision |
| Phase 1 | Align the foundation | Bootstrap, auth-facade, gateway, and service enforcement follow the same role contract |

---

## 3. Phase 0 Workstreams

### WP-BA-01 - Current-State Role Inventory

**Outputs:**

- inventory of runtime roles currently seeded, enforced, or referenced
- matrix of persona labels vs runtime roles vs user tiers
- list of drift points across code and documentation

**Must confirm:**

- `VIEWER`, `USER`, `MANAGER`, `ADMIN`, and `SUPER_ADMIN` are the base seeded roles
- `TENANT_ADMIN` is enforced in some services today
- `PLATFORM_ADMIN` is not a runtime role

### WP-BA-02 - Canonical Registry Decision

**Outputs:**

- canonical role registry
- alias table for non-runtime labels
- decision record for `TENANT_ADMIN`

**Decision gate:**

Choose exactly one:

1. Keep `TENANT_ADMIN` as a canonical runtime role and seed it end to end.
2. Retire `TENANT_ADMIN` and normalize all tenant-admin semantics to `ADMIN`.

### WP-BA-03 - Role Semantics Model

**Outputs:**

- definitions for persona, runtime role, permission, user tier, and tenant scope
- rule set for cross-tenant access
- rule set for tenant-local admin access

### WP-SA-01 - Architecture Contract

**Outputs:**

- bootstrap contract for Keycloak + Neo4j
- JWT claim extraction contract
- effective-role resolution contract for inheritance and group membership
- enforcement contract for gateway, `SecurityConfig`, and `@PreAuthorize`

---

## 4. Phase 1 Workstreams

If those capability areas are later approved, Phase 1 implementation should support them in a code-aligned order:

- system role catalog visibility
- custom role lifecycle
- inheritance management
- tier-to-system-role mapping
- effective access preview
- auditability

The exact mechanics remain open until the canonical role and tier model is approved.

### WP-BE-01 - Bootstrap Alignment

**Outputs:**

- updated Keycloak bootstrap role seed
- updated Neo4j role seed
- shared canonical hierarchy

**Acceptance criteria:**

- bootstrap creates exactly the documented canonical runtime roles
- no service depends on an undeclared role

### WP-BE-02 - Auth-Facade Alignment

**Outputs:**

- normalized role constants and role resolution behavior
- clear handling for aliases and legacy labels if needed
- tests for inheritance, group resolution, and tenant scope

**Acceptance criteria:**

- effective roles resolve consistently from JWT + graph state
- `SUPER_ADMIN` cross-tenant bypass remains explicit and tested

### WP-BE-03 - Gateway and Service Enforcement Alignment

**Outputs:**

- route-level enforcement matrix
- service-level enforcement matrix
- update plan for every `SecurityConfig` using non-canonical role strings

**Acceptance criteria:**

- gateway and downstream services use the same canonical role contract
- admin endpoints document when they require tenant scope vs cross-tenant privilege

### WP-QA-01 - Regression Test Matrix

**Outputs:**

- tests for seeded roles
- tests for JWT claim extraction paths
- tests for tenant-local vs cross-tenant access
- tests for any alias or migration behavior

**Acceptance criteria:**

- role regression tests cover bootstrap, conversion, enforcement, and tenant validation

---

## 5. Risks

| Risk | Impact | Mitigation |
|---|---|---|
| `TENANT_ADMIN` remains half-supported | Runtime inconsistency between bootstrap and enforcement | Force a Phase 0 decision and implement it in Phase 1 |
| Docs keep inventing new role labels | New feature tracks encode invalid role strings | R09 becomes the canonical role registry for all new tracks |
| Personas and tiers stay mixed with roles | Incorrect auth design and confusing UX language | Separate persona, runtime role, permission, and tier definitions explicitly |
| Cross-tenant rules drift across services | Security regressions or hidden privilege escalation | Standardize `SUPER_ADMIN` cross-tenant rules and add regression tests |

---

## 6. Assumptions

- Keycloak remains the identity provider baseline for current deployments
- auth-facade remains the effective-role resolution layer
- Neo4j role inheritance remains part of the platform contract for now
- gateway and service-level Spring Security remain the enforcement mechanism
- approved scope must be fixed before implementation mechanics are finalized

---

## 7. Rollout Gates

| Gate | Criteria |
|---|---|
| G1 | Canonical role registry approved |
| G2 | `TENANT_ADMIN` decision approved |
| G3 | Bootstrap and graph seed aligned |
| G4 | Gateway and service enforcement matrix aligned |
| G5 | Role regression suite passes |

---

## 8. Recommended Next Documents

- canonical role registry
- current-state code evidence matrix
- service-by-service enforcement matrix
- migration checklist for any deprecated role strings
