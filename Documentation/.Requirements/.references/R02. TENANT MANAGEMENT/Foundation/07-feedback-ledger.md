# R02 Foundation Track — 07 Feedback Ledger

**Status:** ACTIVE — Binding revision input for 07-tobe-system-graph.md rewrite
**Date:** 2026-03-25
**Source:** User review of 07-tobe-system-graph.md (draft 2)

---

## Feedback Items

### FB-01: definition-service Absorption Is NOT Approved

| Attribute | Value |
|-----------|-------|
| **Severity** | BLOCKING |
| **What** | Draft 2 presents definition-service absorption into tenant-service as a frozen decision. It is NOT frozen. |
| **Required** | Present definition-service absorption as an **option requiring user verdict**, not as settled truth. Show alternatives (keep separate, absorb, hybrid). Mark as `[DECISION REQUIRED]`. |
| **Cross-ref** | Part 1 §1.5 line 150, Part 2 §2.1 |

### FB-02: Graph Scope Is Not Just definition-service Reuse

| Attribute | Value |
|-----------|-------|
| **Severity** | BLOCKING |
| **What** | Draft 2 reduces the to-be system graph to "definition-service entities moved to tenant-service." The system graph is broader: it must describe platform metamodel, tenant definition graphs, AND object instance graphs as a coherent three-layer architecture with their own lifecycle, provisioning, validation, and cross-references to PostgreSQL. |
| **Required** | Treat the three-layer graph (System Cypher, Object Definition Cypher, Object Instance Cypher) as the primary design subject. definition-service is one implementation detail within that design. |

### FB-03: VOO3 Items Are Object Definitions, Not the Whole System Graph

| Attribute | Value |
|-----------|-------|
| **Severity** | CORRECTION |
| **What** | Draft 2 conflates VOO3 seed data (24 object types) with the entire system graph. VOO3 items are object **definitions** seeded into Layer 2. They are not Layer 1 (system metamodel) and not Layer 3 (instances). |
| **Required** | Clearly separate: Layer 1 system metamodel (the schema-of-schemas), Layer 2 tenant definitions (seeded from Layer 1, includes VOO3 types), Layer 3 instances (actual tenant data). VOO3 is a seed source for Layer 2, not the system graph itself. |

### FB-04: Missing Section — Platform Initialization / External Infrastructure Registration

| Attribute | Value |
|-----------|-------|
| **Severity** | BLOCKING |
| **What** | Draft 2 has no section describing how the platform discovers, validates, and registers external infrastructure. |
| **Required** | Add a section covering the COTS deployment vision: external Neo4j Enterprise server, external PostgreSQL server, external auth server (Keycloak), configuration, connection validation, server registration in platform registry, THEN database/cypher/auth structure provisioning. Do not assume Docker-managed infrastructure. |

### FB-05: Missing Section — PostgreSQL Canonical Model Impact

| Attribute | Value |
|-----------|-------|
| **Severity** | BLOCKING |
| **What** | Draft 2 has a thin §2.5 but does not describe what the three-layer graph means for the PostgreSQL canonical model design. |
| **Required** | Explicit section: which PG tables are affected, what cross-references exist between PG and Neo4j, what new PG tables may be needed (if any), how RBAC tables govern graph access, how audit integrates. This feeds directly into the PG canonical model and ERD subtracks. |

### FB-06: Missing Section — ERD Impact

| Attribute | Value |
|-----------|-------|
| **Severity** | BLOCKING |
| **What** | No ERD impact section. The three-layer graph has direct implications for the ERD (cross-references, foreign keys, audit trails). |
| **Required** | Add a section identifying every PG ↔ Neo4j cross-reference that must appear in the ERD. This is input for the ERD subtrack, not the ERD itself. |

### FB-07: Missing Section — Backup / Restore / Rollback

| Attribute | Value |
|-----------|-------|
| **Severity** | BLOCKING |
| **What** | No backup/restore/rollback strategy for the three-layer graph. Graph data is tenant-critical. |
| **Required** | Add a section covering: Neo4j backup strategy (per-tenant vs whole-database), consistency between PG and Neo4j during restore, rollback strategy for provisioning failures, data durability requirements. |

### FB-08: Missing Section — JTBD / Planned Work Items

| Attribute | Value |
|-----------|-------|
| **Severity** | BLOCKING |
| **What** | Part 4 (Dependencies and Blockers) is a passive gate list. It does not describe actionable work items or jobs-to-be-done. |
| **Required** | Convert dependencies into real JTBD / planned work items with: description, acceptance criteria, owner, blocking/blocked-by relationships, estimated complexity. These should be traceable to implementation. |

### FB-09: Missing Section — Affected Requirement Tracks and Documents

| Attribute | Value |
|-----------|-------|
| **Severity** | BLOCKING |
| **What** | Draft 2 has a thin §2.6 but does not systematically identify every requirement track (R01, R04, R07, R08) and document (Architecture/, togaf/, lld/) affected by the to-be graph. |
| **Required** | Comprehensive list of every downstream document that must change once 07 is approved, organized by category (requirement tracks, architecture docs, togaf docs, lld docs, PRD). |

### FB-10: Provisioning Must Reflect COTS Deployment Vision

| Attribute | Value |
|-----------|-------|
| **Severity** | CORRECTION |
| **What** | Provisioning flow in §2.3 and Phase 2 assumes Docker-managed infrastructure. |
| **Required** | Provisioning must reflect: (1) external Neo4j Enterprise server already registered, (2) external PostgreSQL server already registered, (3) external Keycloak already registered, (4) platform provisions tenant structures INTO those registered servers. Infrastructure registration is a separate concern from tenant provisioning. |

### FB-11: Factsheet Impacts Must Not Invent Unapproved UI Outcomes

| Attribute | Value |
|-----------|-------|
| **Severity** | CORRECTION |
| **What** | §2.4 invents factsheet tabs (Definitions, Instances, Integrations) that are not approved. |
| **Required** | Factsheet impact section must describe what graph data becomes AVAILABLE to the factsheet, not what tabs or UI elements are created. UI design is a separate UX subtrack. Mark any UI speculation as `[PROPOSED — UX verdict required]`. |

### FB-12: Object-Instance Modeling Is Unresolved

| Attribute | Value |
|-----------|-------|
| **Severity** | CORRECTION |
| **What** | Draft 2 describes Layer 3 (Object Instance Cypher) as if the design is settled. It is not. Instance modeling (how instances store dynamic attributes, how validation works, how connections are enforced) is an open design question. |
| **Required** | Mark Layer 3 design as `[DESIGN OPEN — requires SA verdict]`. Present the current best-understanding but flag every assumption. Do not present instance modeling as frozen. |

### FB-13: `default/customized/user_defined` Is Attribute-Level Classification

| Attribute | Value |
|-----------|-------|
| **Severity** | CORRECTION |
| **What** | Draft 2 presents the `state` field (default/customized/user_defined) as a state machine on ObjectType. In the as-is codebase, this is an attribute-level classification. |
| **Required** | Verify whether `state` applies at ObjectType level, attribute level, or both. If it is attribute-level only, correct the draft. If it is proposed as ObjectType-level for the target model, mark as `[PROPOSED — requires validation]`. |

### FB-14: Current/Transition/Target Impacts Must Be Concrete

| Attribute | Value |
|-----------|-------|
| **Severity** | CORRECTION |
| **What** | Impact sections in Part 2 are shallow tables with one-line descriptions. |
| **Required** | Each impact must describe: what exists today (with evidence path), what changes in target, what the migration path is, and what breaks if not addressed. Impacts must be actionable, not summary-level. |

---

## Unresolved Decisions Requiring User Verdict

| ID | Decision | Options | Blocking |
|----|----------|---------|----------|
| UD-01 | definition-service absorption | A: Absorb into tenant-service, B: Keep separate, C: Hybrid (shared Neo4j, separate API) | System graph ownership |
| UD-02 | Neo4j topology for graph layers | A: Shared database with tenantId, B: Database-per-tenant, C: Shared for system + per-tenant for definitions/instances | All phases |
| UD-03 | Object-instance modeling approach | A: Dynamic attributes as Neo4j properties, B: Attribute nodes with values, C: Hybrid | Phase 3 |
| UD-04 | `state` field scope | A: ObjectType-level, B: Attribute-level, C: Both | Definition layer design |

---

## Ledger Rules

1. Every feedback item in this ledger is **binding** for the 07 rewrite
2. Items marked BLOCKING must be fully addressed — partial compliance is not acceptable
3. Items marked CORRECTION must be fixed — the current text is factually wrong or misleading
4. The rewritten 07 must reference this ledger in its header
5. After user approval of the rewrite, this ledger is archived (not deleted)
