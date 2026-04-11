# Technical Specification: Tenant Management

**Requirement Track:** `R02`  
**Status:** Draft -- provisional, not locked  
**Owner:** Architecture / SA  
**Date:** 2026-03-25  
**Related Tracks:** `R01`, `R04`, `R07`, `R08`

---

## 1. Overview and Scope

### 1.1 Purpose

This document defines the technical-design baseline for Tenant Management.

It exists to translate the `R02` product objective into a reviewable application and information design without collapsing into migration notes, prototype notes, or low-level implementation detail.

### 1.2 Product Scope

`R02` must enable the system to:

1. manage tenants
2. manage object definitions in tenant context
3. manage object instances in tenant context

### 1.3 Scope Rule

`R02` is not standalone for object-definition or object-instance concerns.

The following tracks are part of the active design scope:

- `R04` for object definition management
- `R01` for authentication and authorization constraints
- `R07` for platform setup, provisioning, backup, restore, and delivery
- `R08` for integration-boundary implications

---

## 2. Document Position

This document is a canonical `R02` design artifact.

It is not:

- the final PRD
- the final data model
- the final ERD
- a migration playbook
- a prototype approval document

Its role is to define the technical-design baseline that the other `R02` artifacts must align with.

---

## 3. Current Binding Inputs

The following inputs are already binding at subtrack level:

1. auth target model (Rev 2)
2. `tenant-service` is the target owner for tenant-scoped users, RBAC, memberships, provider config, session control, revocation, and session history
3. `api-gateway` is the target auth edge
4. `auth-facade` and `user-service` are transition services, not end-state owners
5. `R02` and `R04` must not be designed in isolation where object definitions, object instances, or the information model are concerned

The following are still open and therefore keep this specification provisional:

1. non-auth to-be system graph expression in canonical artifacts
2. PostgreSQL canonical model
3. ERD
4. full journey/touchpoint/prototype alignment

---

## 4. Capability-to-Application Baseline

### 4.1 Core Capability Areas

| Capability Area | Technical Meaning |
|-----------------|------------------|
| Tenant management | Tenant lifecycle, governance state, provisioning trigger, tenant-scoped operations |
| Object definition management | Management of tenant-usable object definitions, aligned with `R04` |
| Object instance management | Management of runtime instances created from approved definitions |

### 4.2 Primary Runtime Components in Scope

| Component | Role in `R02` |
|-----------|---------------|
| `api-gateway` | External edge, routing, tenant context entry, target home for auth edge endpoints |
| `service-registry` | Service discovery and registration runtime component |
| `tenant-service` | Target aggregate owner for tenant management and tenant-scoped control data |
| `definition-service` | Current owner of definition graph concerns; final boundary for non-auth graph work must be expressed canonically, not assumed |
| `auth server` | Authentication provider/runtime; vendor-specific implementation may default to Keycloak but architecture must stay vendor-neutral |
| `audit-service` | Immutable audit capture for tenant-management actions |
| `integration-service` | Relevant where tenant management intersects with connector/integration ownership and onboarding |

### 4.3 Boundary Rule

This specification must define:

- what `tenant-service` owns
- what `tenant-service` does not own
- where `definition-service` remains relevant
- where `api-gateway` participates as edge only
- what remains in external infrastructure rather than application-owned persistence

It must not reopen already answered auth-boundary decisions.

---

## 5. Information Design Baseline

### 5.1 Information Areas That Must Align

The `R02` information design is not only a graph discussion.

It must align all of the following:

1. platform / system graph
2. object definition graph
3. object instance graph
4. PostgreSQL canonical model
5. ERD

### 5.2 Current Rule

None of the above may be approved in isolation.

The graph is one part of the information design, not the whole of it.

### 5.3 Cross-Track Rule

Object-definition and object-instance information design must be aligned with `R04` and then folded back into the canonical `R02` package.

---

## 6. Security and Control Baseline

Tenant Management must operate inside the `R01` constraints rather than redefining them.

This means the technical design must respect:

- tenant isolation
- authorization boundaries
- auditability
- session control
- provider / auth-server integration boundaries

Security/control design for `R02` must therefore describe how tenant actions are:

- authenticated
- authorized
- audited
- constrained by tenant scope

without reintroducing auth-domain ownership drift.

---

## 7. Operations and Platform Setup Baseline

Tenant Management is coupled to platform setup and provisioning.

The technical design must therefore align with `R07` on:

- external PostgreSQL server usage
- external Neo4j server usage where applicable
- external auth server usage
- platform setup and initialization
- registry/registration of external infrastructure
- tenant provisioning into already registered infrastructure
- backup, restore, and rollback implications

This document does not replace `R07`, but it must state the `R02` dependencies on `R07` clearly.

---

## 8. Integration Baseline

Tenant Management is also affected by `R08` where tenant lifecycle or tenant ownership intersects with:

- connector ownership
- integration onboarding
- integration governance
- cross-system synchronization or registration

This specification must therefore identify `R02` integration touchpoints without trying to redesign the Integration Hub inside `R02`.

---

## 9. Required Downstream Artifacts

This specification is only one part of the canonical `R02` design set.

The following companion artifacts must be authored or repaired beside it:

1. `01-PRD-Tenant-Management.md`
2. story inventory
3. journey maps
4. message registry / code registry
5. data model artifact
6. API contract artifact
7. security requirements artifact
8. test strategy artifact

---

## 10. Immediate Open Design Items

The following items remain open at technical-design level and require canonical treatment in the correct artifacts:

1. the final non-auth system-graph expression
2. the PostgreSQL canonical model for tenant/object-definition/object-instance concerns
3. the ERD
4. the exact technical boundary between `tenant-service` and `definition-service` for non-auth graph concerns
5. the canonical expression of object-instance storage, validation, and authority

These must be resolved in canonical `R02` and `R04` artifacts, not in side documents alone.
