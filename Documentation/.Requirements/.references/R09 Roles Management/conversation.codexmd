# Roles Management - Fullstack Implementation Requirements

> Document type: Product-to-build handoff
> Scope: R09 Roles Management
> Status: Working baseline for implementation
> Purpose: Establish one canonical contract for runtime roles, personas, permissions, tenant scope, bootstrap, and authorization enforcement across EMSIST.
> Companion documents: `README.md`, `03-Roles-Management-Phase0-Phase1-Implementation-Plan.md`

---

## 1. What We Are Building

R09 defines the cross-cutting role management model for EMSIST.

It is not a single screen or a single service. It is the shared authorization contract that every feature depends on:

- which runtime roles exist
- how roles are created and seeded
- how roles appear in JWTs
- how effective roles are resolved through graph inheritance and group membership
- how services enforce authorization
- how tenant scope is applied on top of role checks
- how role changes are governed, audited, and tested

The goal is to stop requirement drift and runtime ambiguity before more feature tracks build on top of inconsistent role language.

---

## 2. Why R09 Exists

The current implementation already has a meaningful RBAC foundation, but the model is fragmented:

- Keycloak bootstrap seeds `VIEWER`, `USER`, `MANAGER`, `ADMIN`, and `SUPER_ADMIN`
- Neo4j seed mirrors the same base hierarchy
- several services also enforce `TENANT_ADMIN`
- some requirement documents use business labels like `Platform Admin` as if they were runtime role keys
- user tiers, personas, and roles are sometimes mixed together

That creates avoidable risks:

- features may depend on roles that bootstrap does not create
- the same actor may be described with different role strings in different docs
- authorization behavior may differ between gateway, service config, and graph assumptions
- cross-tenant access can be described incorrectly even when runtime code is stricter

---

## 3. Current Runtime Reality

### 3.1 Roles That Exist in Code Today

| Role | Current reality |
|---|---|
| `VIEWER` | Seeded in bootstrap and auth graph; read-only baseline role |
| `USER` | Seeded in bootstrap and auth graph; standard user role |
| `MANAGER` | Seeded in bootstrap and auth graph; management layer above `USER` |
| `ADMIN` | Seeded in bootstrap and auth graph; tenant-scoped administrative role |
| `SUPER_ADMIN` | Seeded in bootstrap and auth graph; platform-wide cross-tenant role |
| `TENANT_ADMIN` | Enforced in several services today, but not part of the base role seed |

### 3.2 Labels That Do Not Exist as Runtime Roles

| Label | Meaning in current repo |
|---|---|
| `PLATFORM_ADMIN` / Platform Admin | Business label only; maps to `ADMIN` or `SUPER_ADMIN` depending on scope |
| Security Admin | Responsibility label, not a runtime role |
| Operations Admin | Responsibility label, not a runtime role |

### 3.3 Role Management Layers

| Layer | Responsibility |
|---|---|
| Identity provider | Emits role claims in JWTs |
| JWT role converter | Extracts roles from provider-specific claim paths and converts them to Spring authorities |
| Auth graph | Resolves inherited and group-derived effective roles |
| Gateway + services | Enforce route and endpoint access |
| Tenant validator | Applies tenant boundary rules after role checks |

---

## 4. Core Definitions

| Term | Meaning |
|---|---|
| Persona | Human/business actor label used in product language |
| Runtime role | Role string enforced in code, JWTs, and graph resolution |
| Permission | Fine-grained allowed action, whether explicit or implied by role |
| User tier | Product/licensing tier assigned to tenant users; not the same thing as a runtime role |
| Tenant scope | Boundary that limits where a role may act |
| Effective roles | Final resolved roles after graph inheritance and group membership traversal |

---

## 5. Required Outcomes

R09 must deliver these decisions and artifacts:

- a canonical runtime role registry
- a persona-to-role mapping policy
- a role alias policy for legacy labels
- a clear decision on `TENANT_ADMIN`
- a shared bootstrap contract across Keycloak and Neo4j
- a shared JWT extraction and authority normalization contract
- a service authorization pattern for gateway, `SecurityConfig`, and `@PreAuthorize`
- a tenant-scope enforcement contract
- a custom-role extension model
- an audit and test strategy for role changes

---

## 6. What Must Be Standardized

### 6.1 Canonical Role Registry

R09 must define the official role registry and mark each role as one of:

- canonical runtime role
- supported alias
- planned future role
- rejected/non-runtime label

### 6.2 Persona vs Runtime Role

Requirement documents may continue to describe personas such as "Tenant Admin" or "Platform Admin", but every such persona must map explicitly to a runtime role or a set of runtime roles.

No feature LLD may invent a new runtime role string without updating the canonical registry and bootstrap plan.

### 6.3 `TENANT_ADMIN` Decision

R09 must choose one of two supported paths:

1. Promote `TENANT_ADMIN` into the canonical role model and seed it end to end.
2. Retire `TENANT_ADMIN` as a runtime role and normalize it consistently to `ADMIN`.

The repo cannot safely remain in the current mixed state indefinitely.

### 6.4 Cross-Tenant Access

Cross-tenant administrative access remains a special case.

- `SUPER_ADMIN` is the current bypass role
- tenant-scoped admin roles must still pass tenant validation
- cross-tenant operations must be documented separately from standard admin operations

---

## 7. Main Journeys This Track Must Support

### 7.1 Bootstrap the platform role model

- create the canonical roles in Keycloak
- create the same canonical roles in Neo4j
- establish inheritance consistently
- ensure bootstrap creates no undocumented role strings

### 7.2 Authenticate and resolve effective roles

- extract roles from JWT claims
- normalize to `ROLE_*` authorities
- resolve inherited and group-derived roles
- cache effective results safely

### 7.3 Enforce a tenant-scoped admin request

- route-level role check passes
- endpoint-level role check passes
- tenant validator confirms same-tenant access
- request is denied if tenant scope is violated

### 7.4 Enforce a cross-tenant platform request

- caller holds `SUPER_ADMIN`
- tenant validator allows bypass
- access is audited as elevated cross-tenant activity

### 7.5 Add or revise a custom role

- role is proposed in the canonical registry
- inheritance and tenant scope are defined
- bootstrap and graph seeds are updated
- enforcement and tests are updated together

---

## 8. Non-Goals

R09 does not, by itself:

- redesign licensing tiers
- replace business personas with raw role keys in UX copy
- introduce a full ABAC or policy engine
- create every future custom role immediately
- remove graph-based authorization unless a separate architecture decision approves that change

---

## 9. Initial Acceptance Criteria

- one canonical document lists supported runtime roles and aliases
- no active requirement track depends on `PLATFORM_ADMIN` as a runtime role
- bootstrap and graph seed use the same canonical role registry
- JWT extraction rules are documented and testable
- gateway and service enforcement patterns are documented against the canonical roles
- tenant-scoped and cross-tenant access rules are unambiguous
- the `TENANT_ADMIN` drift has an explicit resolution path

---

## 10. Recommended First Deliverables

- canonical role registry
- current-state role inventory with code evidence
- normalization decision for `TENANT_ADMIN`
- implementation backlog for bootstrap, auth-facade, gateway, and service alignment
- regression test matrix for role enforcement and tenant scope
