# R02 Tenant Management — Clean Review Brief

**Status:** For review  
**Date:** 2026-03-25  
**Purpose:** One readable brief for user review. This document is intentionally kept at requirement-review level. It is not a migration plan, low-level design, or implementation playbook.

---

## 1. Objectives

### 1.1 Product Objective

Objective:

- define and confirm `R02` as a product capability with three core management responsibilities:

1. **Manage tenants**
   The system must support the full tenant management lifecycle, including creation, configuration, activation, suspension, and other governed lifecycle actions.
   Tenant management must be reviewable, operationally controlled, and aligned with the platform registry, provisioning model, and ownership rules.

2. **Manage object definitions**
   The system must support the controlled management of object definitions, including their attributes, relationships, and governing metadata.
   Object definition management must align with approved master-definition rules and must be reviewable, version-aware, and administratively governed.

3. **Manage object instances**
   The system must support the creation and management of real runtime object instances derived from approved definitions.
   Object instance management must preserve structural integrity, traceability, and alignment with the approved information model and tenant context.

### 1.2 Supporting Architecture Objective

Objective:

- define and align the full supporting architecture required to enable the product objective across the same review layers already used in the documentation set:
  - **Business layer**
    - capability map
    - value streams and business processes
    - business services
    - personas
    - journeys
    - touchpoints
    - channels
  - **Application layer**
    - application portfolio
    - service ownership and boundaries
    - service interaction model
    - API surfaces and contracts
    - orchestration and runtime responsibilities
    - edge, routing, and discovery components
  - **Information layer**
    - platform / system graph
    - object definition graph
    - object instance graph
    - PostgreSQL canonical model
    - ERD
    - system of record and cross-store references
  - **Security and control layer**
    - authentication and authorization constraints
    - tenant context enforcement
    - access control
    - auditability
  - **Integration layer**
    - external system integrations
    - connector definitions and boundaries
    - ingress/egress channels
    - event, sync, and webhook contracts
  - **Operations and technology layer**
    - platform setup and initialization
    - external server registration
    - deployment/runtime topology
    - backup, restore, and rollback

Rule:

- nothing should be approved in isolation

### 1.3 Success Criteria

This review exercise is successful only if all of the following are true:

1. the product objective is stated clearly and accepted
2. the supporting architecture layers are stated clearly and accepted
3. previously answered decisions are not reopened casually in the review baseline
4. the review baseline cleanly separates:
   - product objective
   - supporting architecture layers
   - later implementation, migration, and operational concerns
5. the next required artifacts are obvious and reviewable

### 1.4 Closure Criteria

This review exercise is closed only when:

1. the user approves this objective framing
2. the user agrees that nothing is approved in isolation
3. the user agrees on the exact bundle that must be aligned before `R02` closure:
   - business capability and journey material
   - application/service boundaries and interactions
   - information model:
     - system graph
     - object definition graph
     - object instance graph
     - PostgreSQL canonical model
     - ERD
   - security/control rules
   - integration contracts
   - operations/platform setup model
   - stories
   - touchpoints
   - prototypes / PRD
4. this brief is accepted as the readable review baseline for the next clean artifacts

---

## 2. Current Status

What is already sealed:

- Auth target model
- Documentation alignment for the auth target model

What is **not** approved yet:

- To-be non-auth system graph
- PostgreSQL target data model
- ERD
- Journeys
- Stories
- Touchpoints
- Prototypes / PRD lock

So the current state is:

- `R02` is **partially aligned**
- overall `R02` approval is **still blocked**

---

## 3. What This Brief Is Trying To Clarify

The current package became hard to review because several documents mix:

- strategic vision
- tactical design
- migration/coexistence mechanics
- operational setup
- as-is evidence

This brief separates them.

The main review subject is:

- the product objective
- the supporting architecture layers that must be approved beside it
- the boundary between reviewable design and later implementation detail

The active review scope for this brief is:

- [R02. TENANT MANAGEMENT](/Users/mksulty/Claude/Projects/Emsist-app/.worktrees/tenant-factsheet-spec/Documentation/.Requirements/R02.%20TENANT%20MANAGEMENT)
- [R04. MASTER DESFINITIONS](/Users/mksulty/Claude/Projects/Emsist-app/.worktrees/tenant-factsheet-spec/Documentation/.Requirements/R04.%20MASTER%20DESFINITIONS)

Rule:

- `R02` and `R04` must not be worked or reviewed in isolation where object definitions, object instances, or the supporting graph/model stack are concerned.

---

## 4. The Three Graph Concerns

### 4.1 Platform / System Graph

This is the tenant-centered structural graph of the platform itself.

It is **not** the same thing as object definitions.

Examples of the kind of structure this graph must express:

- `Tenant -> User`
- `Tenant -> Integration`
- `Tenant -> Agent`
- `Tenant -> License`
- other tenant-centered platform relationships required by the product

Important rule:

- auth authority remains in `PostgreSQL + auth server`
- the system graph must not silently become the auth source of truth again

This graph is new and must be designed from scratch.
It must not be anchored to old seed data.

### 4.2 Object Definition Graph

This is the graph of **object definitions**.

It should be understood as:

- a database of object definitions
- with their attributes
- and their allowed relationships to other object definitions

Examples such as:

- `business_domain`
- `application`
- `epic`

are **definitions**, not the whole system graph.

This area must explicitly align with:

- [R04. MASTER DESFINITIONS](/Users/mksulty/Claude/Projects/Emsist-app/.worktrees/tenant-factsheet-spec/Documentation/.Requirements/R04.%20MASTER%20DESFINITIONS)

### 4.3 Object Instance Graph

This is the graph of real runtime instances created during work.

Examples:

- a real tenant instance
- a real application instance
- a real business domain instance
- other tenant data created from approved definitions

This area has already been discussed directionally.

What the documents still fail to do is express that direction cleanly and consistently, especially:

- what an instance is
- how it is created
- how it is validated against definitions
- where it is authoritative
- how it relates to PostgreSQL records such as the tenant registry

---

## 5. PostgreSQL and ERD Must Be Designed Beside the Graph

The graph cannot be approved alone.

The following must be designed in parallel:

### PostgreSQL Canonical Model

Must define:

- service ownership
- authoritative tables
- cross-store references
- registry structures
- audit and control data

### ERD

Must define:

- cross-references between PostgreSQL and graph data
- what is authoritative where
- how tenant records, users, definitions, instances, and registry data connect

Rule:

- **system graph approval without PostgreSQL model and ERD approval is not enough**

---

## 6. Platform Setup Assumption

The target deployment is a COTS-style platform setup against external servers.

At minimum, the platform must account for:

- external `Neo4j Enterprise` server
- external `PostgreSQL` server
- external `auth server`

`Keycloak` may be the default ready endpoint, but the architecture must stay vendor-neutral at this level.

The important sequence is:

1. configure server connections
2. validate connectivity
3. register those servers in the platform registry
4. initialize required internal structures
5. only then provision tenant-scoped structures

This is a setup / technical initialization concern, not a business-admin workflow.

---

## 7. What Is Not Open Anymore

The following topics were already answered earlier by the user and must **not** be reopened casually in downstream drafts:

- platform graph scope
- graph ownership
- graph topology
- object instance direction
- cross-store authority direction

So the remaining problem is not lack of decisions.

The remaining problem is that the current documents do not express those decisions cleanly, consistently, and at the right abstraction level.

---

## 8. What This Brief Intentionally Does Not Do

To keep this reviewable, this brief does **not** attempt to lock:

- CRUD endpoint migration detail
- Eureka/gateway rewiring detail
- feature-flag rollout detail
- coexistence phase scripting
- detailed rollback playbooks
- final factsheet tab design
- final renderer-registry design

Those belong in later artifacts after the core target model is frozen.

---

## 9. Requirement Tracks In Scope And Affected

The following requirement tracks are directly in scope for this review or must be updated together with it:

- [R01. AUTHENTICATION AND AUTHORIZATION](/Users/mksulty/Claude/Projects/Emsist-app/.worktrees/tenant-factsheet-spec/Documentation/.Requirements/R01.%20AUTHENTICATION%20AND%20AUTHORIZATION)
- [R02. TENANT MANAGEMENT](/Users/mksulty/Claude/Projects/Emsist-app/.worktrees/tenant-factsheet-spec/Documentation/.Requirements/R02.%20TENANT%20MANAGEMENT)
- [R04. MASTER DESFINITIONS](/Users/mksulty/Claude/Projects/Emsist-app/.worktrees/tenant-factsheet-spec/Documentation/.Requirements/R04.%20MASTER%20DESFINITIONS)
- [R07. PLATFORM OPERATIONS AND CUSTOMER DELIVERY](/Users/mksulty/Claude/Projects/Emsist-app/.worktrees/tenant-factsheet-spec/Documentation/.Requirements/R07.%20PLATFORM%20OPERATIONS%20AND%20CUSTOMER%20DELIVERY)
- [R08. Integration Hub](/Users/mksulty/Claude/Projects/Emsist-app/.worktrees/tenant-factsheet-spec/Documentation/.Requirements/R08.%20Integration%20Hub)

And then the aligned architecture stack must be updated again:

- `Architecture/`
- `togaf/`
- `lld/`
- `R02 PRD`
- journeys / stories / touchpoints / prototypes

---

## 10. Review Checklist

This is the actual review sequence that makes sense now:

1. Review and freeze the **platform/system graph**
2. Review and freeze the **object definition graph** with `R04` in scope
3. Review and freeze the **object instance graph direction**
4. Review and freeze the **PostgreSQL canonical model**
5. Review and freeze the **ERD**
6. Then update:
   - journeys
   - stories
   - touchpoints
   - prototypes
   - PRD

Until then:

- no overall `R02` approval
- no PRD lock
- no prototype lock
- no implementation for graph-dependent scope

---

## 11. Immediate Next Deliverables

The next documents worth reviewing are:

1. a clean **system graph concept document**
2. a clean **PostgreSQL target data model**
3. a clean **ERD input brief**

Those should be written as separate artifacts with clear boundaries, instead of mixed into one overloaded document.
