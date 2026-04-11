# R02 Foundation Track — System Nodes / Metamodel

**Status:** PARTIAL — Auth target sealed + WP-ARCH-ALIGN closed. To-be system graph: OPEN, pending user review.
**Created:** 2026-03-24
**Prerequisite for:** R02 PRD lock, prototype approval, baseline commit

## Deliverables

| # | Artifact | File | Status |
|---|----------|------|--------|
| 1 | Canonical tenant/system node inventory | `01-node-inventory.md` | APPROVED (with reservations) |
| 2 | Relationship inventory | `02-relationship-inventory.md` | APPROVED (with reservations) |
| 3 | Ownership boundaries by module | `03-ownership-boundaries.md` | APPROVED (Rev 2 — frozen auth decision sealed) |
| 4 | Data residency / storage mapping | `04-data-residency.md` | APPROVED (with reservations) |
| 5 | Neo4j topology position or topology-neutral contract | `05-topology-contract.md` | APPROVED (Rev 2 — auth topology frozen, definition-service open) |
| 6 | Forks, gaps, and blockers | `06-forks-gaps-blockers.md` | APPROVED (Rev 2 — 6 frozen decisions, 7 gaps, 8 blockers) |
| 7 | To-be system graph (non-auth) | `07-tobe-system-graph.md` | REVISION 3 — rewritten against feedback ledger, user verdict required |
| 7a | Feedback ledger | `07-feedback-ledger.md` | ACTIVE — binding revision input |

## Acceptance Criteria

- All 7 deliverables complete (6 original + to-be system graph)
- User reviews and approves each
- No ambiguity on node ownership, relationships, or storage
- Topology decision is explicit (Neo4j-committed or topology-neutral)
- Blockers resolved or documented with mitigation

## After Foundation Approval

1. Revalidate R02 PRD against sealed foundation
2. Revalidate journey maps against sealed nodes
3. Revalidate prototypes against canonical data model

## WP-ARCH-ALIGN: Architecture Documentation Alignment Gate

**Trigger:** Auth/domain/storage decisions are frozen
**Must happen before:** Implementation planning or coding
**Blocking:** R02 PRD lock, prototype approval, baseline commit

> After foundation decision freeze and before implementation, update arc42 + TOGAF + R02 foundation docs to reflect the sealed target auth architecture and remove conflicting Neo4j/user-service target-state assumptions.

### Scope

**Documentation/Architecture (arc42):**

| File | Reason |
|------|--------|
| `README.md` | May reference outdated auth/storage topology |
| `04-solution-strategy.md` | Target auth strategy must match frozen decisions |
| `05-building-blocks.md` | Service boundaries and ownership must align |
| `08-crosscutting.md` | Auth, RBAC, session, multi-tenancy cross-cutting concerns |
| `09-architecture-decisions.md` | ADRs must reflect frozen topology, not stale assumptions |
| `11-risks-technical-debt.md` | Neo4j removal, user-service scope change = new risks |
| `06-runtime-view.md` | Still says auth user/session state is Keycloak + Neo4j; says auth-facade does not call user-service |
| `03-context-scope.md` | System context still shows Neo4j as auth-facade's auth graph store; keeps user-service in core picture |
| `07-deployment-view.md` | If runtime topology changes are described there |

**Documentation/togaf:**

| File | Reason |
|------|--------|
| `README.md` | TOGAF overview must match target architecture |
| `02-business-architecture.md` | Business services and capability ownership still put user management in user-service and RBAC in Neo4j/auth-facade |
| `03-data-architecture.md` | Data ownership, storage homes, Neo4j role must align |
| `04-application-architecture.md` | Service responsibilities must match frozen model |
| `07-migration-planning.md` | As-is → target transition must be explicit |
| `08-implementation-governance.md` | Implementation rules must enforce frozen decisions |
| `09-architecture-change-management.md` | Change log must record the decision |
| `governance/review-checklist.md` | Checklist must validate against frozen model |
| `artifacts/building-blocks/ABB-001-identity-orchestration.md` | Identity orchestration must match target |
| `artifacts/building-blocks/ABB-002-tenant-context-enforcement.md` | Still assumes graph-level tenant enforcement and legacy auth access rules |
| `artifacts/catalogs/application-portfolio-catalog.md` | Service catalog must reflect new ownership |
| `artifacts/catalogs/data-entity-catalog.md` | Entity ownership must match frozen decisions |
| `artifacts/matrices/application-to-data-matrix.md` | App-to-data mapping must align |
| `artifacts/matrices/application-to-technology-matrix.md` | (Recommended) Technology mapping should reflect target stack |

**Documentation/lld:**

| File | Reason |
|------|--------|
| `auth-facade-lld.md` | Auth-facade service design — must reflect stateless orchestration role, not graph-owner |
| `auth-providers-lld.md` | Auth provider design — must align with target Keycloak-primary model |
| `graph-per-tenant-lld.md` | Graph-per-tenant design — must be marked as-is/deprecated or aligned with frozen topology |
| `database-durability-strategy.md` | Storage durability — must reflect target storage homes |
| `license-service-onprem-lld.md` | License service — verify no stale auth/user-service assumptions |
| `integration-hub-spec.md` | Integration design — verify service boundary assumptions |
| `deployment-installer-blueprint.md` | Deployment — must reflect target runtime topology |

### Acceptance Criteria

- No document presents Neo4j as the target auth store
- No document presents user-service as the target owner of tenant users/RBAC/session control
- No document presents auth-facade as the target/end-state auth service
- Target auth model is consistent everywhere:
  - **Keycloak** = authentication only
  - **tenant-service PostgreSQL** = tenant users/RBAC/provider config/policy/session control/revocation/session history
  - **api-gateway** = target auth edge endpoints (migrated from auth-facade)
  - **auth-facade** = [TRANSITION] then removed
  - **user-service** = [TRANSITION] then removed
  - **Valkey** = cache
  - **Kafka** = propagation
  - **Neo4j** removed from auth target domain (definition-service only)
- As-is vs target vs transition is explicit in every affected document
- No baselined document in `Architecture/`, `togaf/`, or `lld/` may contradict the frozen auth model
- Implementation cannot start until this gate is closed

### Gate Closure

- All files in scope reviewed and updated — **DONE (2026-03-24)**
- User approves the aligned documentation set — **APPROVED (2026-03-25)**
- No conflicting target-state assumptions remain — **VERIFIED (2026-03-25): 4 leftovers fixed, supervisor verdict: approved**

### Execution Log (2026-03-24)

| Category | Files Updated | Edits | Status |
|----------|--------------|-------|--------|
| Architecture/ (arc42) | 12 | ~20 sections tagged [AS-IS]/[TARGET]/[TRANSITION] | COMPLETE |
| togaf/ | 19 | ~25 sections tagged [AS-IS]/[TARGET]/[TRANSITION] | COMPLETE |
| lld/ | 7 | ~38 sections tagged [AS-IS]/[TARGET]/[TRANSITION] | COMPLETE |
| Documentation/ (top-level) | 2 (README.md, DOCUMENTATION-GOVERNANCE.md) | 2 sections tagged | COMPLETE |
| **Total** | **40 files** | **~85 sections** | **COMPLETE** |

**Frozen model applied (Rev 2):**
- Keycloak = authentication only
- tenant-service = tenant users, RBAC, memberships, provider config, session control, revocation, session history (PostgreSQL)
- api-gateway = target auth edge endpoints (migrated from auth-facade)
- auth-facade = [TRANSITION] then removed
- user-service = [TRANSITION] then removed
- Neo4j = removed from auth target domain (definition-service only)

**Verification:** grep sweep confirms zero untagged "Neo4j for auth-facade" references in Architecture/, togaf/, or lld/.

## Subtrack Status

| Subtrack | Status | Date |
|----------|--------|------|
| Auth target model (Rev 2) | **SEALED** (subtrack only) | 2026-03-24 |
| WP-ARCH-ALIGN (40 files aligned) | **CLOSED** (subtrack only) | 2026-03-25 |
| To-be system graph (non-auth) | **REVISION 3 — rewritten against feedback ledger, user verdict required** | `07-tobe-system-graph.md` |
| PostgreSQL target data model | **NOT STARTED** | — |
| ERD | **NOT STARTED** | — |
| Journeys | **NOT STARTED** | — |
| Stories | **NOT STARTED** | — |
| Touchpoints | **NOT STARTED** | — |
| Prototypes / PRD | **NOT STARTED** | — |

## Overall R02 Approval Rule

**No overall R02 approval is granted until ALL of the following are frozen and user-approved as one aligned stack:**

1. To-be system graph (nodes, relationships, ownership, boundaries)
2. PostgreSQL target data model (canonical tables, ownership by service, migration target, constraints)
3. ERD (reviewed, approved, consistent with service boundaries and target ownership)
4. Journeys
5. Stories
6. Touchpoints
7. Prototypes / PRD

**Until then:**
- Auth decision = sealed subtrack only
- Documentation alignment = closed subtrack only
- **Overall R02 approval = BLOCKED**
- No claim of final design approval
- No claim of baseline lock
- Partial subtrack approvals may exist, but they do not constitute overall approval

## What May Proceed

- Design work on open subtracks (system graph, PG model, ERD, journeys, stories, touchpoints, prototypes)
- Implementation work is **blocked** until the full design stack is frozen and approved

## Next Steps

1. User reviews to-be system graph proposal (`07-tobe-system-graph.md`)
2. PostgreSQL target data model design
3. ERD
4. Journeys, stories, touchpoints, prototype flows, PRD
