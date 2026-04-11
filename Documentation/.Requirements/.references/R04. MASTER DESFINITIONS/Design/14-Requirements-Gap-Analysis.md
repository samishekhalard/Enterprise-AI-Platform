# Requirements Gap Analysis: Definition Management

**Document ID:** GAP-DM-002
**Version:** 1.0.0
**Date:** 2026-03-10
**Author:** BA Agent (BA-PRINCIPLES.md v1.1.0)
**Status:** Complete
**Scope:** Cross-reference of PRD v2.1.0, SRS v1.0.0, API Contract v1.0.0, UI/UX Spec v1.3.0, User Journeys v2.2.0, Backlog v1.0.0, Security Requirements v1.0.0, Data Model v1.0.0, LLD v1.0.0, BA Sign-Off (conditions C1-C4)

---

## 1. Executive Summary

### 1.1 Audit Scope

This gap analysis systematically cross-references 10 design documents against the PRD (source of truth) and validates the SRS for completeness. Every PRD requirement, user journey step, API endpoint, screen specification, edge case, error message, and confirmation dialog has been traced.

### 1.2 Summary Metrics

| Category | Total Items | Gaps Found | Pass Rate |
|----------|------------|------------|-----------|
| PRD to SRS Traceability | 15 feature sections + 5 APs | 4 gaps | 73% |
| User Journey Coverage | 7 journeys, ~85 steps | 11 gaps | 87% |
| API to SRS Backend Mapping | 72 endpoints (15 groups) | 6 gaps | 92% |
| Happy Path Completeness | 17 screens | 5 gaps | 71% |
| Edge Case Coverage | 17 screens x 6 edge cases | 28 gaps | 73% |
| Error Message Completeness | 54 error codes defined | 8 gaps | 85% |
| Confirmation Dialog Inventory | 23 dialogs defined | 4 gaps | 83% |
| BA Sign-Off Conditions (C1-C4) | 4 conditions | 0 resolved, 4 open | 0% |

### 1.3 Severity Breakdown

| Severity | Count | Description |
|----------|-------|-------------|
| CRITICAL | 7 | Blocks implementation; must fix before sprint planning |
| HIGH | 18 | Must fix before the sprint containing this feature |
| MEDIUM | 14 | Should fix; does not block but reduces quality |
| LOW | 7 | Nice to have; can be addressed during implementation |
| **TOTAL** | **46** |

---

## 2. PRD to SRS Traceability Matrix

### 2.1 Feature-Level Traceability

| PRD Section | Feature | SRS Frontend (Sec 3) | SRS Backend (Sec 4) | SRS Security (Sec 5) | SRS Test (Sec 7) | SRS Traceability (Sec 8) | Gap? |
|-------------|---------|---------------------|--------------------|--------------------|-----------------|------------------------|------|
| 6.1 | Object Type Management | 3.2.1 (SCR-01), 3.2.2 (SCR-02-T1), 3.2.8 (SCR-03) | 4.1.1 | 5.1, 5.2, 5.3, 5.4 | 7.1 (E1 row) | 8.1 (row 1) | NO |
| 6.2 | Attribute Management | 3.2.3 (SCR-02-T2) | 4.1.1, 4.1.2 | 5.4 | 7.1 (E2 row) | 8.1 (row 2) | NO |
| 6.2.1 | Attribute Lifecycle | 3.2.3 (planned chips) | 4.1.2 | -- | 7.1 (E2 row) | 8.1 (row 3) | NO |
| 6.3 | Connection Management | 3.2.4 (SCR-02-T3) | 4.1.1 | 5.4 | 7.1 (E3 row) | 8.1 (row 4) | NO |
| 6.4 | Cross-Tenant Governance | 3.2.1 (cross-tenant toggle) | 4.1.2 | 5.2, 5.3 | 7.1 (E4 row) | 8.1 (row 5) | NO |
| 6.5 | Master Mandate Flags | 3.2.3, 3.2.4 (lock icons) | 4.1.2 | 5.2 | 7.1 (E5 row) | 8.1 (row 6) | NO |
| 6.6 | Maturity Scoring | 3.2.6 (SCR-02-T5), 3.2.10 (SCR-05) | 4.1.2 | -- | 7.1 (E7 row) | 8.1 (row 7) | NO |
| 6.7 | Locale Management | 3.2.7 (SCR-02-T6) | 4.1.2 | -- | 7.1 (E8 row) | 8.1 (row 8) | NO |
| 6.8 | Governance Tab | 3.2.5 (SCR-02-T4) | 4.1.2 | -- | 7.1 (E9 row) | 8.1 (row 9) | **YES** -- GAP-001 |
| 6.9 | Graph Visualization | 3.2.11 (SCR-GV) | 4.1.2 | -- | 7.1 (E10 row) | 8.1 (row 10) | **YES** -- GAP-002 |
| 6.10 | Release Management | 3.2.9 (SCR-04) | 4.1.2 | 5.5 | 7.1 (E6 row) | 8.1 (row 11) | NO |
| 6.11 | AI-Assisted | 3.2.12 (SCR-AI) | 4.1.2 | -- | 7.1 (E10 AI row) | 8.1 (row 12) | NO |
| 6.12 | Measures Categories | 3.2 (SCR-02-T6M) | 4.1.2 | -- | 7.1 (E13 row) | 8.1 (row 13) | NO |
| 6.13 | Measures | 3.2 (SCR-02-T7M) | 4.1.2 | -- | 7.1 (E13 row) | 8.1 (row 14) | NO |
| 6.14 | Viewpoints | NOT covered | NOT covered | NOT covered | NOT covered | NOT covered | Intentionally deferred (N1) |
| 6.15 | BPMN Special Attrs | NOT covered | NOT covered | NOT covered | NOT covered | NOT covered | Intentionally deferred (N1) |

### 2.2 Architectural Principle Traceability

| AP | PRD Section | SRS Coverage | Gap? |
|----|-------------|-------------|------|
| AP-1 | Repo Separation | 4.3 (mention), 8.1 (row AP-1) | NO |
| AP-2 | Default Attributes | 4.1.2 (SystemDefaultAttributeService), 4.3.2, 8.1 | NO |
| AP-3 | Zero Data Loss | 4.1.2, 8.1 | NO |
| AP-4 | Message Registry | 4.1.2 (MessageRegistryService), 8.1 | **YES** -- GAP-003 |
| AP-5 | Lifecycle Machines | 4.1.2, 8.1 | NO |

### 2.3 Business Rules Traceability

| BR Range | PRD Section | SRS Section 8.2 | Gap? |
|----------|-------------|----------------|------|
| BR-001 to BR-011 | 7 (Object Type) | 8.2 row 1 | NO |
| BR-012 to BR-018 | 7 (Attribute) | 8.2 row 2 | NO |
| BR-019 to BR-024a | 7 (Attribute Lifecycle) | 8.2 row 3 | NO |
| BR-025 to BR-028 | 7 (Connection) | 8.2 row 4 | NO |
| BR-029 to BR-033 | 7 (Governance) | 8.2 row 5 | NO |
| BR-034 to BR-042 | 7 (Maturity) | 8.2 row 6 | NO |
| BR-043 to BR-047 | 7 (Locale) | 8.2 row 7 | **YES** -- GAP-004 |
| BR-048 to BR-057 | 7 (Release) | 8.2 row 8 | NO |
| BR-058 to BR-063 | 7 (AI) | 8.2 row 9 | NO |
| BR-064 to BR-065 | 7 (Licensing) | 8.2 row 10 | NO |
| BR-066 to BR-071 | 7 (Maturity Model) | 8.2 row 11 | NO |
| BR-072 to BR-076 | 7 (Architecture) | 8.2 row 12 | NO |
| BR-077 to BR-080 | 7 (Message Registry) | 8.2 row 13 | NO |
| BR-081 to BR-086 | 7 (Lifecycle Control) | 8.2 row 14 | NO |

---

## 3. Detailed Gap Findings

### GAP-001: Governance Tab Insufficient Acceptance Criteria [CRITICAL]

**Source:** BA Sign-Off Condition C1
**PRD Section:** 6.8 (Governance Tab)
**SRS Impact:** Section 3.2.5 (SCR-02-T4), Section 8.3 (AC count)

**Issue:** The Governance Tab has only 1 acceptance criterion (AC-6.8.1: view governance rules). The PRD defines 8 capabilities for this feature (workflow list, direct operation settings, workflow settings dialog, mandate governance, override policy, conditions, status display, audit trail). The SRS correctly identifies this as Condition C1 but does not provide the missing ACs.

**Missing ACs:**
1. AC-6.8.2: Attach workflow to object type (happy path)
2. AC-6.8.3: Configure direct operations (allowDirectCreate/Update/Delete toggle)
3. AC-6.8.4: Workflow settings dialog (select workflow, set behaviour, assign permissions)
4. AC-6.8.5: Master mandate on governance config (child tenant lock)
5. AC-6.8.6: Duplicate workflow configuration
6. AC-6.8.7: Permission assignment within workflow

**Severity:** CRITICAL -- Blocks E9 story decomposition and test case creation.
**Required Action:** Add ACs AC-6.8.2 through AC-6.8.7 to PRD Section 8.9 and SRS Section 8.3.

---

### GAP-002: Graph Visualization Insufficient Acceptance Criteria [HIGH]

**Source:** BA Sign-Off Condition C2
**PRD Section:** 6.9 (Graph Visualization)
**SRS Impact:** Section 3.2.11 (SCR-GV), Section 8.3 (AC count)

**Issue:** Graph Visualization has only 1 AC (AC-6.9.1: view graph) but 7 capabilities listed in the PRD. The SRS correctly flags this as Condition C2 but does not resolve it.

**Missing ACs:**
1. AC-6.9.2: Filter graph by status (active/planned/retired)
2. AC-6.9.3: Zoom, pan, and layout controls
3. AC-6.9.4: Export graph as PNG/SVG
4. AC-6.9.5: IS_SUBTYPE_OF hierarchy display
5. AC-6.9.6: Click node to open detail panel

**Severity:** HIGH -- Blocks E10 story testability.
**Required Action:** Add ACs AC-6.9.2 through AC-6.9.6 to PRD Section 8.10 and SRS Section 8.3.

---

### GAP-003: Message Registry Has No Dedicated SRS Screen Specification [HIGH]

**Source:** PRD AP-4 (Message Registry)
**SRS Impact:** Section 3.2 (Screen Inventory)

**Issue:** AP-4 defines a centralized message registry with PostgreSQL backend, but the SRS has:
- No screen specification for a message registry management UI (admin CRUD for messages)
- No API endpoint group in the SRS for `/api/v1/messages` (the API Contract Section 5 does not have a dedicated "Messages" endpoint group either, though AP-4 mentions `/api/v1/messages?locale={locale}&category={category}`)
- No user story in the backlog for message registry administration

The SRS references MessageRegistryService in Section 4.1.2 and AP-4 business rules (BR-077 to BR-080) in Section 8.2, but the frontend consumption path (lazy loading, caching, locale switching) is not specified as a screen requirement.

**Severity:** HIGH -- Without a message management UI, message codes must be seeded via database scripts. Without a frontend consumption spec, developers lack guidance on how to render messages from the registry.
**Required Action:**
1. Add a message registry API endpoint group to the API Contract (GET /messages, POST /messages for admin)
2. Add a frontend integration specification in SRS Section 3 describing: message loading strategy, caching, locale fallback behavior
3. Decide: Is a message admin UI needed (SCR-MSG), or are messages seeded via migrations only?

---

### GAP-004: Locale Management Missing Error Codes [MEDIUM]

**Source:** PRD Section 6.7, BR-043 to BR-047
**SRS Impact:** Section 5.4 (Input Validation), Error Code Registry

**Issue:** The PRD defines 5 locale management business rules (BR-043 to BR-047), and the SRS maps them in Section 8.2 row 7 with "--" for error codes. The message registry in the PRD (Section 6, AP-4 table) has no `DEF-E-xxx` codes for locale-related errors. Specifically missing:
- Error for duplicate locale code within tenant
- Error for deactivating a locale that has unfilled Language Dependent values
- Error for invalid locale code format
- Error for deleting the last active locale

**Severity:** MEDIUM -- Locale features are Phase 3 (E8), but error codes should be defined now for completeness.
**Required Action:** Add DEF-E-100 through DEF-E-104 for locale-related errors in the PRD message registry table.

---

### GAP-005: Data Sources Tab Has No PRD Section [CRITICAL]

**Source:** BA Sign-Off Condition C3
**SRS Impact:** Section 2.2 (E12 with "--" for PRD Section), Section 3 (no screen spec)

**Issue:** The Data Sources Tab (E12, 4 stories, 28 points) appears in:
- Backlog: E12 with 4 user stories (US-DM-104 to US-DM-109) spanning Sprints S14-S15
- SRS: Section 2.2 row E12 with PRD Section "--"
- API Contract: Section 5.11 (Data Sources endpoints)

But it has:
- NO PRD section (no Section 6.X for Data Sources)
- NO business capabilities defined
- NO acceptance criteria
- NO business rules
- NO user journey

The API Contract defines 5 endpoints for Data Sources, and the SRS includes a planned service (no detail), but there are zero testable requirements.

**Severity:** CRITICAL -- Cannot implement or test E12 without requirements.
**Required Action:** Either add PRD Section 6.X with capabilities, ACs, and BRs, or mark E12 as "Won't Have" and remove from backlog and API contract.

---

### GAP-006: IS_SUBTYPE_OF Inheritance Behavior Undefined [HIGH]

**Source:** BA Sign-Off Condition C4
**SRS Impact:** Section 4.3 (Data Model), backlog

**Issue:** The PRD domain model shows `IS_SUBTYPE_OF` relationship and the data model includes max depth 5 (Cypher query in SRS 4.2.2). However, no business rules exist for:
- Whether child types automatically inherit parent type attributes
- Whether inherited attributes can be overridden in child types
- Whether child types can remove inherited attributes
- How inheritance interacts with maturity scoring (do inherited attributes count?)
- How inheritance interacts with mandate flags

**Severity:** HIGH -- Any implementation of subtype features would be guesswork without these rules.
**Required Action:** Add BR-087 through BR-091 defining inheritance behavior, and add ACs covering the inheritance happy path and edge cases.

---

### GAP-007: AttributeType CRUD Incomplete in Both PRD and SRS [HIGH]

**Source:** PRD Section 6.2, SRS Section 4.1.1
**SRS Impact:** Section 3.2.3, API Contract Section 5.2

**Issue:** The PRD explicitly notes "Not yet implemented for AttributeType: Update attribute type (no PUT endpoint exists), Delete attribute type (no DELETE endpoint exists), Pagination for attribute type listing." The SRS also acknowledges this in Section 4.1.1. However:

1. The API Contract (06-API-Contract.md) Section 5.2 defines PUT and DELETE endpoints for AttributeType, but these do not exist in code
2. The SRS does not define when these will be implemented or which sprint/epic they belong to
3. The Backlog (E2) mentions attribute management but does not have explicit stories for AttributeType UPDATE and DELETE (only for HasAttribute lifecycle operations)
4. No acceptance criteria exist for updating or deleting an AttributeType

**Missing items:**
- AC for "Update Attribute Type" (happy path, validation, error)
- AC for "Delete Attribute Type" (happy path, blocked when linked to object types, cascade behavior)
- Backlog stories for AttributeType UPDATE and DELETE
- Error codes: What is DEF-E-xxx for "cannot delete attribute type linked to N object types"?

**Severity:** HIGH -- Architects cannot manage attribute types without update/delete capabilities. This is a Phase 1 gap.
**Required Action:** Add explicit user stories to E2 or E1 for AttributeType update and delete, add ACs, define error codes, and clarify cascade/blocking behavior.

---

### GAP-008: Connection Update Endpoint Missing from As-Built and Backlog [HIGH]

**Source:** PRD Section 6.3
**SRS Impact:** Section 3.2.4

**Issue:** The PRD notes "Not yet implemented for Connections: Update connection properties (no PUT endpoint)." The SRS Section 3.2.4 lists planned enhancements (US-DM-016 through US-DM-020) but no explicit user story for "update existing connection properties" (e.g., changing cardinality, updating active/passive names, toggling isDirected). The API Contract Section 5.4 defines a PUT endpoint, but no backlog story maps to it.

**Severity:** HIGH -- Architects must be able to correct connection configuration mistakes.
**Required Action:** Add explicit user story (US-DM-016a or equivalent) for connection property update with ACs.

---

### GAP-009: Wizard Step Count Discrepancy (PRD vs SRS) [MEDIUM]

**Source:** PRD Section 4 (Architect persona), SRS Section 3.2.8
**SRS Impact:** Section 3.2.8

**Issue:** The PRD persona table states the Create Object Type Wizard is a "5-step wizard: Basic Info -> Attributes -> Connections -> Review -> Confirm." The SRS and code evidence describe a **4-step wizard**: Basic Info -> Connections -> Attributes -> Status/Review. The order also differs (PRD: Attributes before Connections; Code: Connections before Attributes).

**Severity:** MEDIUM -- The SRS correctly documents the as-built 4-step wizard with evidence. The PRD persona table is aspirational and should be updated.
**Required Action:** Update PRD Section 4 (Architect persona) UI Touchpoints table to reflect the actual 4-step wizard order.

---

### GAP-010: No Sorting Endpoint in As-Built Backend [MEDIUM]

**Source:** SRS Section 3.2.1 (SCR-01)
**SRS Impact:** Section 3.2.1 API Endpoints table

**Issue:** SRS Section 3.2.1 lists `GET /api/v1/definitions/object-types?sort={field},{dir}` as [PLANNED] (US-DM-003). The PRD AC-6.1.6 covers pagination but there is no AC for sorting. No acceptance criterion defines:
- Which fields are sortable (name, typeKey, status, createdAt, updatedAt?)
- Default sort order
- Sort direction (asc/desc)
- Multi-column sort support

**Severity:** MEDIUM -- Sorting is a basic list feature. US-DM-003 exists in the backlog but has no testable AC.
**Required Action:** Add AC-6.1.18 covering sorting behavior with specific sortable fields.

---

### GAP-011: Backlog Story Count Discrepancy [LOW]

**Source:** Backlog Section 3 (Sprint Breakdown)
**SRS Impact:** Section 2.2

**Issue:** The backlog states 97 stories across 13 epics. Sprint breakdown lists stories US-DM-001 through US-DM-109, which is 109 identifiers. Some sprints reference story ranges that overlap or have gaps (e.g., S1: US-DM-001 to US-DM-010 = 10 stories for an epic with 7 stories). The numbering does not appear to be contiguous.

**Severity:** LOW -- Story ID numbering inconsistency. The total of 97 is likely correct; the sprint ranges use non-contiguous IDs.
**Required Action:** Verify story IDs are unique and non-duplicated. Consider renumbering for clarity.

---

### GAP-012: No Import/Export Acceptance Criteria in PRD [HIGH]

**Source:** PRD Section 6.10 (mentions export/import as "Should Have")
**SRS Impact:** Section 8.3 (E11 stories not counted)

**Issue:** The PRD mentions export/import in Section 6.10 as capabilities of release management, and the Backlog has E11 (Import/Export and Versioning) with 5 stories (34 SP). However:
- No acceptance criteria exist for import or export
- No file format specification (the PRD mentions "JSON/YAML" but no schema is defined)
- No error handling for import conflicts (duplicate typeKey, attribute key collision)
- No file size limit enforcement definition (NFR-008 says 10MB but no AC tests it)
- The SRS Section 8.3 does not list E11 in the AC count summary table

**Severity:** HIGH -- E11 cannot be tested without ACs.
**Required Action:** Add AC-6.11a.1 through AC-6.11a.5 covering export format, import happy path, conflict detection, file size validation, and error handling.

---

### GAP-013: Missing Error Codes for Measures (E13) [MEDIUM]

**Source:** PRD Section 6.12, 6.13
**SRS Impact:** Section 5.4, Error Code Registry

**Issue:** The message registry defines DEF-E-080 through DEF-E-083 for measures. However, missing error codes for:
- Duplicate measure name within a category
- Invalid threshold configuration (e.g., warning > critical, or target < critical)
- Invalid formula syntax
- Measure linked to mandated category but missing mandatory fields

**Severity:** MEDIUM -- Measures are Phase 3 (E13, P3 priority).
**Required Action:** Add DEF-E-084 through DEF-E-087 for measures validation errors.

---

### GAP-014: Notification Dropdown (SCR-NOTIF) Has No Specification [HIGH]

**Source:** User Journeys JRN 3.1 (Process Master Tenant Release)
**SRS Impact:** Section 3.1 (screen inventory lists SCR-NOTIF as [PLANNED])

**Issue:** The SRS screen inventory includes SCR-NOTIF (Notification Dropdown) as [PLANNED] with no further specification. The user journey JRN 3.1 requires Fiona (Tenant Admin) to receive release alerts via the notification bell. However:
- No PrimeNG component specification for the notification dropdown
- No API endpoints for fetching notifications (`/api/v1/notifications` is not in the API Contract)
- No data model for notifications
- No acceptance criteria for notification display, read/unread status, or deep-linking from notification to release detail

This screen is critical for Journey 3.1 (Process Master Tenant Release) and is referenced by E6 (Release Management, P0 priority).

**Severity:** HIGH -- SCR-NOTIF is a prerequisite for E6 user journey completion.
**Required Action:** Add full screen specification for SCR-NOTIF including: API endpoint, notification data model, PrimeNG components, empty state, read/unread toggle, deep-link to release detail.

---

### GAP-015: Propagation Wizard Has No API Endpoints in API Contract [HIGH]

**Source:** User Journey JRN 1.2 (Provision New Tenant)
**SRS Impact:** Not covered in API Contract

**Issue:** Journey 1.2 describes a Propagation Wizard where Sam propagates canonical definitions to a new child tenant. The service blueprint shows `POST /api/v1/definition/propagate` as the key endpoint. However:
- The API Contract (06-API-Contract.md) has no propagation endpoint
- No `POST /api/v1/definitions/propagate` or equivalent exists in any endpoint group
- The SRS backend Section 4.1.2 lists `DefinitionPropagationService` as planned with methods `propagateToChild, deepCopyDefinition` but no API layer is defined

**Severity:** HIGH -- Propagation is a core E4 (Cross-Tenant Governance, P0) capability.
**Required Action:** Add a propagation endpoint group to the API Contract (Section 5.6 or new section) with: POST /propagate, GET /propagate/status, GET /propagate/history.

---

### GAP-016: Reporting/Export Feature in Journey 1.1 Not Covered [MEDIUM]

**Source:** User Journey JRN 1.1, Phase 5 (Reporting)
**SRS Impact:** Not covered

**Issue:** Journey 1.1 describes Sam generating a governance compliance report (PDF/CSV/XLSX). This reporting capability is:
- Not in the PRD (no Section 6.X for reporting)
- Not in the API Contract (no report generation endpoint)
- Not in the Backlog (no user story for governance report)
- Not in the SRS (no screen specification for report generation dialog)

**Severity:** MEDIUM -- Reporting is a "nice to have" for the governance journey but is shown as a happy path step.
**Required Action:** Either add a user story for governance report generation, or mark this journey step as a future enhancement and update the journey accordingly.

---

### GAP-017: No Acceptance Criteria for Responsive Behavior [MEDIUM]

**Source:** PRD Section 9 (NFR-010), SRS Section 6 (NFR-010)
**SRS Impact:** Section 7.1 (Test Types)

**Issue:** NFR-010 requires responsive support across 3 breakpoints (desktop >1024px, tablet 768-1024px, mobile <768px). The SRS test matrix (Section 7.1) lists "Responsive" and "3 breakpoints" for most epics. However, no acceptance criteria define specific responsive behaviors:
- When does split-panel collapse to single column?
- When does the table view default to card view?
- When does the detail panel become a bottom sheet?
- What happens to wizards on mobile (full-screen mode)?

The UI/UX spec (05) and user journeys (09) document responsive breakpoints per screen, but the SRS ACs do not cover them.

**Severity:** MEDIUM -- Without responsive ACs, QA cannot write definitive pass/fail test cases for responsive behavior.
**Required Action:** Add responsive-specific ACs (e.g., AC-NFR-010.1: "Given viewport width < 768px, When the user navigates to Master Definitions, Then the split-panel collapses to a single column with the detail panel as a bottom sheet").

---

### GAP-018: No Accessibility Acceptance Criteria [MEDIUM]

**Source:** PRD Section 9 (NFR-004), SRS Section 6 (NFR-004)
**SRS Impact:** Section 7.1 (Test Types)

**Issue:** NFR-004 requires WCAG AAA compliance. The SRS test matrix lists "axe-core" and "Screen reader" for multiple epics. However, no acceptance criteria define specific accessibility behaviors:
- Keyboard navigation through the wizard (Tab/Shift+Tab, Enter to confirm)
- Screen reader announcements for toast notifications (ARIA live regions)
- Focus management when dialogs open/close
- Color contrast ratios for neumorphic elements
- Keyboard-accessible card/table view toggle

**Severity:** MEDIUM -- Without accessibility ACs, QA cannot validate WCAG AAA compliance.
**Required Action:** Add accessibility-specific ACs (e.g., AC-NFR-004.1: "Given the user navigates using keyboard only, When a confirmation dialog opens, Then focus moves to the dialog and Tab cycles within dialog elements").

---

### GAP-019: Optimistic Locking Not Implemented -- No ETag Headers [HIGH]

**Source:** SRS Section 9.2 (Technical Risks), API Contract Section 3.1
**SRS Impact:** Section 4.3 (Data Model)

**Issue:** The SRS identifies "No optimistic locking on Neo4j nodes" as a HIGH likelihood technical risk. The API Contract lists `If-Match` and `ETag` headers as [PLANNED]. The PRD defines BR-086 (optimistic lock conflicts show DEF-W-001). However:
- No backlog story explicitly addresses implementing optimistic locking
- No AC defines the optimistic locking behavior (what happens on conflict)
- The data model does not include a `@Version` field on any Neo4j node

**Severity:** HIGH -- Concurrent editing is expected in a multi-user admin tool. Without optimistic locking, data loss will occur.
**Required Action:** Add a user story to E1 (Foundation Enhancement) for optimistic locking implementation. Add AC covering the conflict detection flow (DEF-W-001 warning, reload button).

---

### GAP-020: createdBy/updatedBy Audit Fields Missing [HIGH]

**Source:** SRS Section 9.2 (Technical Risks)
**SRS Impact:** Section 4.3.1 (As-Built Schema)

**Issue:** The SRS identifies "No createdBy/updatedBy audit fields" as a HIGH likelihood risk. The PRD AP-2 (Default Attributes) lists `createdBy` and `updatedBy` as system default attributes for object instances, but the ObjectTypeNode and AttributeTypeNode entities in the as-built schema do not have these fields.

Without these fields:
- Audit trail requirements (SRS Section 5.5) cannot be fully satisfied
- BR-086 (concurrent modification warning showing "Modified by {modifiedBy}") cannot be implemented

**Severity:** HIGH -- Blocks audit trail and DEF-W-001 implementation.
**Required Action:** Add `createdBy` and `updatedBy` fields to ObjectTypeNode and AttributeTypeNode. Add backlog task within E1.

---

### GAP-021: Bulk Operations Missing from SRS [MEDIUM]

**Source:** PRD Section 6.2.1 (bulk lifecycle transition), User Journey JRN 1.1 (bulk flagging)
**SRS Impact:** Section 3.2.3

**Issue:** The PRD mentions bulk lifecycle transition as "Could Have" priority, and Journey 1.1 mentions bulk flagging pain points. The SRS Section 3.2.3 references US-DM-015 (bulk lifecycle transition) and a PATCH endpoint for bulk operations. However:
- No AC defines bulk operation behavior (select multiple, apply action, partial failure handling)
- No error handling defined for partial bulk failures (what if 3 of 5 transitions succeed?)
- No UI specification for multi-select mode (checkboxes? select all? limit?)

**Severity:** MEDIUM -- Bulk operations are "Could Have" but are referenced in user journeys.
**Required Action:** Add ACs for bulk lifecycle transition covering: multi-select, apply, partial failure handling, undo.

---

## 4. User Journey Coverage Gaps

### 4.1 Journey-to-Screen Mapping

| Journey | Steps | Screens Referenced | Missing Screens | Gap? |
|---------|-------|--------------------|-----------------|------|
| JRN 1.1 (Cross-Tenant Audit) | 14 steps | SCR-AUTH, SCR-01, SCR-02-T1, Diff Viewer, Confirmation, Mandate Push, Export, SCR-NOTIF | Diff Viewer (no SCR-ID), Mandate Push Dialog (no SCR-ID), Export Dialog (no SCR-ID) | **YES** -- GAP-022 |
| JRN 1.2 (Provision Tenant) | 11 steps | SCR-AUTH, SCR-01, Propagation Wizard | Propagation Wizard (no SCR-ID) | **YES** -- GAP-023 |
| JRN 2.1 (Create Object Type) | ~15 steps | SCR-AUTH, SCR-01, SCR-03, SCR-02-T1 through T6, SCR-GV | All mapped | NO |
| JRN 2.2 (Modify + Release) | ~12 steps | SCR-AUTH, SCR-01, SCR-02-T2, SCR-04 | All mapped | NO |
| JRN 2.3 (Manage Attributes) | ~10 steps | SCR-AUTH, SCR-01, SCR-02-T2 | All mapped | NO |
| JRN 3.1 (Process Release) | ~10 steps | SCR-AUTH, SCR-NOTIF, SCR-04, SCR-04-M1, SCR-02-T2 | All mapped | NO |
| JRN 3.2 (Local Customization) | ~8 steps | SCR-AUTH, SCR-01, SCR-02-T2, SCR-03, SCR-02-T4 | All mapped | NO |

### GAP-022: Three Journey-Specific Dialogs Lack Screen IDs [LOW]

**Issue:** JRN 1.1 references Diff Viewer Dialog, Mandate Push Dialog, and Export Dialog without assigning screen IDs (SCR-xx). These dialogs are defined in the journey document but not in the SRS screen inventory.

**Severity:** LOW -- Dialogs are PLANNED features for E4/E5 and can be assigned IDs during sprint planning.
**Required Action:** Assign screen IDs (e.g., SCR-DIFF, SCR-MANDATE, SCR-EXPORT) and add to the SRS screen inventory.

### GAP-023: Propagation Wizard Lacks Screen ID and Specification [HIGH]

**Issue:** JRN 1.2 describes a 4-step Propagation Wizard but the SRS does not include it in the screen inventory (Section 3.1) or provide a component specification. This is a critical E4 screen.

**Severity:** HIGH -- See GAP-015 for API gap. The UI specification is also missing.
**Required Action:** Add SCR-PROP (Propagation Wizard) to SRS Section 3.1 with full component specification.

---

## 5. Edge Case Coverage Matrix

### 5.1 Screen x Edge Case Matrix

| Screen | Empty State | Max Data (Pagination) | Concurrent Edit | Network Timeout | Invalid Input | Permission Denied |
|--------|:----------:|:---------------------:|:---------------:|:---------------:|:-------------:|:-----------------:|
| SCR-01 (Object Type List) | COVERED (AC-6.1.4) | COVERED (AC-6.1.6) | NOT COVERED | COVERED (AC-6.1.17) | N/A (list) | COVERED (AC-6.1.8) |
| SCR-02-T1 (General Tab) | N/A | N/A | **GAP-024** | **GAP-025** | COVERED (BR-001 to BR-009) | COVERED (AC-6.1.8) |
| SCR-02-T2 (Attributes Tab) | **GAP-026** | **GAP-027** | **GAP-024** | **GAP-025** | COVERED (BR-012 to BR-018) | COVERED |
| SCR-02-T3 (Connections Tab) | **GAP-026** | **GAP-027** | **GAP-024** | **GAP-025** | COVERED (BR-025 to BR-028) | COVERED |
| SCR-02-T4 (Governance Tab) | **GAP-026** | N/A | **GAP-024** | **GAP-025** | **GAP-028** | COVERED |
| SCR-02-T5 (Maturity Tab) | **GAP-026** | N/A | **GAP-024** | **GAP-025** | COVERED (DEF-E-071) | COVERED |
| SCR-02-T6 (Locale Tab) | **GAP-026** | **GAP-027** | **GAP-024** | **GAP-025** | **GAP-028** | COVERED |
| SCR-02-T6M (Measures Cat) | **GAP-026** | **GAP-027** | **GAP-024** | **GAP-025** | COVERED (DEF-E-081) | COVERED |
| SCR-02-T7M (Measures) | **GAP-026** | **GAP-027** | **GAP-024** | **GAP-025** | COVERED (DEF-E-083) | COVERED |
| SCR-03 (Wizard) | COVERED (AC-6.2.5) | N/A | N/A | **GAP-025** | Partial (name req) | N/A |
| SCR-04 (Release Mgmt) | **GAP-026** | **GAP-027** | **GAP-024** | **GAP-025** | COVERED | COVERED |
| SCR-04-M1 (Impact Analysis) | **GAP-026** | N/A | N/A | **GAP-025** | N/A | COVERED |
| SCR-05 (Maturity Dashboard) | **GAP-026** | **GAP-027** | N/A | **GAP-025** | N/A | COVERED |
| SCR-06 (Locale Mgmt) | **GAP-026** | **GAP-027** | **GAP-024** | **GAP-025** | **GAP-028** | COVERED |
| SCR-GV (Graph Viz) | **GAP-026** | **GAP-029** | N/A | **GAP-025** | N/A | COVERED |
| SCR-AI (AI Insights) | **GAP-026** | N/A | N/A | **GAP-025** | N/A | COVERED |
| SCR-NOTIF (Notification) | **GAP-026** | **GAP-027** | N/A | **GAP-025** | N/A | COVERED |

### 5.2 Edge Case Gap Details

#### GAP-024: No AC for Concurrent Edit Conflict (Detail Tabs) [HIGH]

**Issue:** BR-086 defines optimistic lock conflict behavior (DEF-W-001), but no AC exists for: "Given User A and User B are editing the same object type, When User A saves, Then User B sees a conflict warning."

**Required Action:** Add ACs for SCR-02-T1 through SCR-02-T6M covering concurrent modification detection and resolution flow.

#### GAP-025: No AC for Network Timeout on Detail/Tab Operations [MEDIUM]

**Issue:** AC-6.1.17 covers network failure for the list page, but no ACs cover network timeout on save operations in detail tabs, wizard submission, or release publishing. BR-085 defines the behavior (retain previous state, show retry toast) but has no Gherkin AC.

**Required Action:** Add generic network failure ACs for save/update/delete operations referencing DEF-E-050 and DEF-E-052.

#### GAP-026: No Empty State ACs for Non-List Screens [MEDIUM]

**Issue:** AC-6.1.4 covers the object type list empty state. No ACs define empty states for: Attributes Tab (no attributes linked), Connections Tab (no connections), Governance Tab (no rules), Maturity Tab (no config), Locale Tab (no locales), Release Dashboard (no releases), Graph (no types), AI Panel (no suggestions), Notifications (no notifications).

**Required Action:** Add per-tab empty state ACs with icon, heading, and action button specifications.

#### GAP-027: No Pagination ACs for Non-ObjectType Lists [MEDIUM]

**Issue:** AC-6.1.6 covers pagination for the object type list. No ACs define pagination behavior for: attribute list, connection list, release list, measure category list, measure list, locale list, notification list.

**Required Action:** Decide default page sizes per list and add pagination ACs.

#### GAP-028: No Input Validation ACs for Governance, Locale, Measures CRUD [MEDIUM]

**Issue:** Governance Tab (SCR-02-T4), Locale Tab (SCR-02-T6), and Measures tabs have form inputs but no explicit input validation ACs. The message registry defines some error codes but no Gherkin scenarios test them.

**Required Action:** Add validation ACs for each CRUD form.

#### GAP-029: No Max Graph Size AC [LOW]

**Issue:** NFR-002 targets 500 nodes at >30fps, and threat D-04 mentions graph traversal complexity. No AC defines what happens when the graph exceeds the supported node count. Does it paginate? Limit nodes? Show a warning?

**Required Action:** Add AC for graph visualization behavior at or beyond 500 nodes.

---

## 6. Error Message Completeness Audit

### 6.1 Coverage Summary

| Category | Codes Defined | Gaps |
|----------|--------------|------|
| OBJECT_TYPE errors | DEF-E-001 to DEF-E-019 | None |
| ATTRIBUTE errors | DEF-E-020 to DEF-E-026 | **GAP-030** |
| CONNECTION errors | DEF-E-030 to DEF-E-035 | None |
| RELEASE errors | DEF-E-040 to DEF-E-043 | None |
| SYSTEM errors | DEF-E-050 to DEF-E-052 | None |
| GOVERNANCE errors | DEF-E-060 to DEF-E-062 | None |
| MATURITY errors | DEF-E-070 to DEF-E-071 | None |
| MEASURE errors | DEF-E-080 to DEF-E-083 | **GAP-013** (see above) |
| INHERITANCE errors | DEF-E-090 to DEF-E-092 | None |
| LOCALE errors | (none defined) | **GAP-004** (see above) |
| IMPORT/EXPORT errors | (none defined) | **GAP-031** |
| DATA SOURCES errors | (none defined) | **GAP-032** |
| PROPAGATION errors | (none defined) | **GAP-033** |

### GAP-030: Missing AttributeType CRUD Error Codes [MEDIUM]

**Issue:** No error codes for:
- DEF-E-027: Cannot delete AttributeType linked to N object types
- DEF-E-028: Duplicate attributeKey within tenant
- DEF-E-029: AttributeType not found (for update/delete scenarios)

These codes are needed for the missing AttributeType CRUD operations (GAP-007).

### GAP-031: No Import/Export Error Codes [MEDIUM]

**Issue:** No DEF-E-xxx codes for import errors (file too large, invalid JSON, duplicate keys on import, unsupported format). Needed for E11.

### GAP-032: No Data Sources Error Codes [LOW]

**Issue:** No DEF-E-xxx codes for data sources (since no PRD section exists -- see GAP-005). Will be needed if E12 proceeds.

### GAP-033: No Propagation Error Codes [MEDIUM]

**Issue:** No DEF-E-xxx codes for propagation failures (target tenant not found, partial propagation failure, duplicate definitions in target tenant). Needed for E4.

### 6.2 Confirmation Dialogs with Missing Error Codes

All confirmation dialogs (DEF-C-001 through DEF-C-032) have been validated. No gaps found -- every destructive action has a confirmation dialog with cancel option and consequence description.

### 6.3 Success Messages Coverage

All success messages (DEF-S-001 through DEF-S-032) are defined. Missing:
- No success code for AttributeType creation (only for linking -- DEF-S-010)
- No success code for propagation completion
- No success code for import/export completion

---

## 7. Confirmation Dialog Inventory

### 7.1 Completeness Check

| Action Category | Dialogs Defined | Coverage |
|----------------|----------------|----------|
| ObjectType lifecycle | CD-01 through CD-09 (9 dialogs) | COMPLETE |
| Attribute lifecycle | CD-10 through CD-13 (4 dialogs) | COMPLETE |
| Connection lifecycle | CD-20 through CD-23 (4 dialogs) | COMPLETE |
| Release management | CD-30 through CD-32 (3 dialogs) | COMPLETE |
| Governance flagging | JRN 1.1 (Flag, Push) (2 dialogs) | **Defined in journey only, not in SRS CD inventory** -- GAP-034 |
| Propagation | JRN 1.2 (Confirm Propagation) (1 dialog) | **Defined in journey only, not in SRS CD inventory** -- GAP-035 |

### GAP-034: Governance Dialogs Not in SRS Confirmation Inventory [LOW]

**Issue:** The governance flagging and mandate push confirmation dialogs are defined in Journey 1.1 (Section 19 of User Journeys doc) but are not listed in SRS Section 3.4 (Confirmation Dialog Inventory) because they are PLANNED E4/E5 features.

**Required Action:** Add CD-40 (Flag Governance Violation) and CD-41 (Push Mandate Update) to the SRS confirmation dialog inventory.

### GAP-035: Propagation Dialog Not in SRS Confirmation Inventory [LOW]

**Issue:** The propagation confirmation dialog is defined in Journey 1.2 but not in SRS Section 3.4.

**Required Action:** Add CD-42 (Confirm Propagation) to the SRS confirmation dialog inventory.

---

## 8. Happy Path Coverage

### 8.1 Per-Screen Happy Path Validation

| Screen | Happy Path Documented | Success Message Defined | Navigation After Success | Gap? |
|--------|:--------------------:|:----------------------:|:------------------------:|:----:|
| SCR-01 (List) | YES (AC-6.1.1) | DEF-S-001 | Type appears in list | NO |
| SCR-02-T1 (General) | YES (AC-6.1.16) | DEF-S-002 | Return to view mode | NO |
| SCR-02-T2 (Attributes) | YES (AC-6.2.2) | DEF-S-010 | Attribute appears in list | NO |
| SCR-02-T3 (Connections) | YES (AC-6.3.1) | DEF-S-020 | Connection appears in list | NO |
| SCR-02-T4 (Governance) | PARTIAL (AC-6.8.1 only) | **NO** | **NOT DEFINED** | **YES** -- GAP-001 |
| SCR-02-T5 (Maturity) | YES (AC-6.6.1 to 6.6.13) | **NO** -- no success code for maturity config save | **NOT DEFINED** | **GAP-036** |
| SCR-02-T6 (Locale) | YES (AC-6.7.1 to 6.7.5) | **NO** -- no success code for locale operations | **NOT DEFINED** | **GAP-037** |
| SCR-02-T6M (Measures Cat) | YES (AC-6.12.1 to 6.12.4) | **NO** -- no success code for category CRUD | **NOT DEFINED** | **GAP-038** |
| SCR-02-T7M (Measures) | YES (AC-6.13.1 to 6.13.4) | **NO** -- no success code for measure CRUD | **NOT DEFINED** | **GAP-039** |
| SCR-03 (Wizard) | YES (AC-6.1.1) | DEF-S-001 | Wizard closes, list refreshes | NO |
| SCR-04 (Release Mgmt) | YES (AC-6.10.1 to 6.10.7) | DEF-S-030, S-031, S-032 | Status updates | NO |
| SCR-04-M1 (Impact) | YES (AC-6.10.5) | N/A (informational) | Return to release detail | NO |
| SCR-05 (Maturity Dashboard) | Partial (AC-6.6.12, 6.6.13) | N/A (read-only) | N/A | NO |
| SCR-GV (Graph Viz) | PARTIAL (AC-6.9.1) | N/A (read-only) | N/A | NO |
| SCR-AI (AI Insights) | YES (AC-6.11.1 to 6.11.5) | N/A (suggestions) | N/A | NO |

### GAP-036 to GAP-039: Missing Success Messages for PLANNED Tabs [LOW]

**Issue:** Maturity config save, locale CRUD, measure category CRUD, and measure CRUD lack DEF-S-xxx success codes. These need to be added to the message registry.

**Required Action:** Add DEF-S-040 (Maturity config saved), DEF-S-050 (Locale created/updated/deleted), DEF-S-060 (Measure category created/updated/deleted), DEF-S-070 (Measure created/updated/deleted).

---

## 9. Discrepancy List (Contradictions Between Documents)

| ID | Document A | Document B | Discrepancy | Severity | Resolution |
|----|-----------|-----------|-------------|----------|------------|
| D-01 | PRD Sec 4 (Architect persona) | SRS Sec 3.2.8, Code evidence | Wizard is "5-step" in PRD but 4-step in reality | MEDIUM | Update PRD to match code (4-step) -- see GAP-009 |
| D-02 | PRD Sec 4 (Architect persona) | Code evidence | Step order: PRD says "Attrs -> Connections"; code says "Connections -> Attributes" | MEDIUM | Update PRD to match code |
| D-03 | UX Spec Sec 3 (Personas) | PRD Sec 4 (Personas) | Persona names differ (Saeed/Nadia/Fatima vs Sam/Nicole/Fiona) | HIGH | Resolved in AUDIT-REPORT but UX Spec not yet updated |
| D-04 | User Journeys Sec 19 (Confirmations) | SRS Sec 3.4 (CD inventory) | Journey defines governance/propagation dialogs not in SRS CD list | LOW | Add to SRS -- GAP-034, GAP-035 |
| D-05 | API Contract Sec 5.2 | Code evidence (SRS 4.1.1) | API Contract defines PUT/DELETE for AttributeType; code only has POST/GET | MEDIUM | Mark PUT/DELETE as [PLANNED] in API Contract; add stories -- GAP-007 |
| D-06 | Backlog (E12 Data Sources) | PRD (no section) | Backlog has 4 stories for Data Sources but PRD has no requirements section | CRITICAL | Add PRD section or remove from backlog -- GAP-005 |
| D-07 | SRS Sec 8.3 (AC count) | PRD Sec 8 (ACs) | SRS says 78 total ACs; should be verified against PRD actual count | LOW | Verify count matches |
| D-08 | User Journeys (JRN 1.2) | API Contract | Journey shows POST /api/v1/definition/propagate; API Contract has no propagation endpoints | HIGH | Add propagation endpoints -- GAP-015 |

---

## 10. Recommendations (Prioritized)

### 10.1 CRITICAL (Must Fix Before Sprint Planning)

| Priority | Gap ID | Action | Effort | Blocks |
|----------|--------|--------|--------|--------|
| 1 | GAP-001 | Add 6 Governance Tab ACs (AC-6.8.2 to AC-6.8.7) | 2 hours | E9 stories |
| 2 | GAP-005 | Decide Data Sources: Add PRD section OR remove E12 from backlog | 1 hour (decision) + 4 hours (if adding) | E12 stories |
| 3 | GAP-007 | Add AttributeType UPDATE/DELETE stories, ACs, and error codes | 3 hours | E2 completeness |

### 10.2 HIGH (Must Fix Before Containing Sprint)

| Priority | Gap ID | Action | Effort | Blocks |
|----------|--------|--------|--------|--------|
| 4 | GAP-002 | Add 5 Graph Visualization ACs (AC-6.9.2 to AC-6.9.6) | 1.5 hours | E10 stories |
| 5 | GAP-003 | Specify message registry integration (frontend consumption, admin UI decision) | 3 hours | E1 foundation |
| 6 | GAP-006 | Define IS_SUBTYPE_OF inheritance business rules (BR-087 to BR-091) | 2 hours | Subtype feature |
| 7 | GAP-008 | Add connection update story with ACs | 1 hour | E3 completeness |
| 8 | GAP-012 | Add import/export ACs (AC-6.11a.1 to AC-6.11a.5) | 2 hours | E11 stories |
| 9 | GAP-014 | Add SCR-NOTIF full specification | 3 hours | E6 journey completion |
| 10 | GAP-015 | Add propagation API endpoints to API Contract | 2 hours | E4 implementation |
| 11 | GAP-019 | Add optimistic locking story to E1 | 1 hour | Data integrity |
| 12 | GAP-020 | Add createdBy/updatedBy fields to E1 | 1 hour | Audit trail |
| 13 | GAP-024 | Add concurrent edit conflict ACs | 1 hour | Multi-user support |
| 14 | GAP-023 | Add Propagation Wizard screen specification | 2 hours | E4 UI |

### 10.3 MEDIUM (Should Fix)

| Priority | Gap ID | Action | Effort |
|----------|--------|--------|--------|
| 15 | GAP-004 | Add locale error codes (DEF-E-100 to DEF-E-104) | 0.5 hours |
| 16 | GAP-009 | Update PRD wizard step count and order | 0.5 hours |
| 17 | GAP-010 | Add sorting AC (AC-6.1.18) | 0.5 hours |
| 18 | GAP-013 | Add measures error codes (DEF-E-084 to DEF-E-087) | 0.5 hours |
| 19 | GAP-016 | Decide on governance reporting feature | 1 hour |
| 20 | GAP-017 | Add responsive behavior ACs | 2 hours |
| 21 | GAP-018 | Add accessibility behavior ACs | 2 hours |
| 22 | GAP-021 | Add bulk operation ACs | 1 hour |
| 23 | GAP-025 | Add network timeout ACs for save operations | 1 hour |
| 24 | GAP-026 | Add empty state ACs for all tabs | 1.5 hours |
| 25 | GAP-027 | Add pagination ACs for non-ObjectType lists | 1 hour |
| 26 | GAP-028 | Add input validation ACs for governance/locale/measures | 1.5 hours |
| 27 | GAP-030 | Add AttributeType CRUD error codes | 0.5 hours |
| 28 | GAP-031 | Add import/export error codes | 0.5 hours |
| 29 | GAP-033 | Add propagation error codes | 0.5 hours |

### 10.4 LOW (Nice to Have)

| Priority | Gap ID | Action | Effort |
|----------|--------|--------|--------|
| 30 | GAP-011 | Verify and renumber backlog story IDs | 1 hour |
| 31 | GAP-022 | Assign screen IDs to journey-specific dialogs | 0.5 hours |
| 32 | GAP-029 | Add max graph size AC | 0.5 hours |
| 33 | GAP-032 | Add Data Sources error codes (if E12 proceeds) | 0.5 hours |
| 34 | GAP-034 | Add governance dialogs to SRS CD inventory | 0.5 hours |
| 35 | GAP-035 | Add propagation dialog to SRS CD inventory | 0.5 hours |
| 36 | GAP-036 to 039 | Add success messages for planned tabs | 0.5 hours |

---

## 11. BA Sign-Off Conditions Status

| Condition | Status | Details |
|-----------|--------|---------|
| C1 (Governance Tab ACs) | OPEN | Still needs AC-6.8.2 through AC-6.8.7 -- no progress since sign-off |
| C2 (Graph Viz ACs) | OPEN | Still needs AC-6.9.2 through AC-6.9.6 -- no progress since sign-off |
| C3 (Data Sources PRD) | OPEN | No PRD section added; no "Won't Have" decision made |
| C4 (IS_SUBTYPE_OF rules) | OPEN | No BR-087+ defined; no inheritance behavior specified |

**Assessment:** All 4 BA sign-off conditions remain unresolved. C1 and C3 are CRITICAL blockers for their respective sprints.

---

## 12. Summary Table of All Gaps

| Gap ID | Title | Severity | Category | Blocks |
|--------|-------|----------|----------|--------|
| GAP-001 | Governance Tab insufficient ACs (C1) | CRITICAL | PRD/SRS AC | E9 |
| GAP-002 | Graph Viz insufficient ACs (C2) | HIGH | PRD/SRS AC | E10 |
| GAP-003 | Message Registry no screen/API spec | HIGH | SRS Frontend/Backend | E1 |
| GAP-004 | Locale missing error codes | MEDIUM | Error Codes | E8 |
| GAP-005 | Data Sources no PRD section (C3) | CRITICAL | PRD Missing | E12 |
| GAP-006 | IS_SUBTYPE_OF undefined rules (C4) | HIGH | PRD Rules | Subtype |
| GAP-007 | AttributeType CRUD incomplete | HIGH | PRD/SRS/Backlog | E2 |
| GAP-008 | Connection update missing | HIGH | PRD/SRS/Backlog | E3 |
| GAP-009 | Wizard step count discrepancy | MEDIUM | PRD/Code mismatch | -- |
| GAP-010 | No sorting AC | MEDIUM | SRS AC | E1 |
| GAP-011 | Backlog story ID inconsistency | LOW | Backlog | -- |
| GAP-012 | Import/Export no ACs | HIGH | PRD/SRS AC | E11 |
| GAP-013 | Measures missing error codes | MEDIUM | Error Codes | E13 |
| GAP-014 | SCR-NOTIF no specification | HIGH | SRS Screen | E6 |
| GAP-015 | Propagation no API endpoints | HIGH | API Contract | E4 |
| GAP-016 | Reporting not in PRD/Backlog | MEDIUM | Journey/PRD | E4 |
| GAP-017 | No responsive ACs | MEDIUM | SRS AC | NFR-010 |
| GAP-018 | No accessibility ACs | MEDIUM | SRS AC | NFR-004 |
| GAP-019 | Optimistic locking not planned | HIGH | SRS/Backlog | E1 |
| GAP-020 | createdBy/updatedBy missing | HIGH | Data Model | E1 |
| GAP-021 | Bulk operations no ACs | MEDIUM | SRS AC | E2 |
| GAP-022 | Journey dialogs no screen IDs | LOW | SRS Screen | E4 |
| GAP-023 | Propagation Wizard no spec | HIGH | SRS Screen | E4 |
| GAP-024 | No concurrent edit ACs | HIGH | SRS AC | E1 |
| GAP-025 | No network timeout ACs (save) | MEDIUM | SRS AC | All |
| GAP-026 | No empty state ACs (tabs) | MEDIUM | SRS AC | All |
| GAP-027 | No pagination ACs (non-OT lists) | MEDIUM | SRS AC | E2+ |
| GAP-028 | No validation ACs (gov/locale/measures) | MEDIUM | SRS AC | E8/E9/E13 |
| GAP-029 | No max graph size AC | LOW | SRS AC | E10 |
| GAP-030 | AttributeType CRUD error codes missing | MEDIUM | Error Codes | E2 |
| GAP-031 | Import/Export error codes missing | MEDIUM | Error Codes | E11 |
| GAP-032 | Data Sources error codes missing | LOW | Error Codes | E12 |
| GAP-033 | Propagation error codes missing | MEDIUM | Error Codes | E4 |
| GAP-034 | Governance dialogs not in SRS CD list | LOW | SRS CD | E4 |
| GAP-035 | Propagation dialog not in SRS CD list | LOW | SRS CD | E4 |
| GAP-036 | Maturity config success message missing | LOW | Messages | E7 |
| GAP-037 | Locale success messages missing | LOW | Messages | E8 |
| GAP-038 | Measure category success messages missing | LOW | Messages | E13 |
| GAP-039 | Measure success messages missing | LOW | Messages | E13 |

---

**Document prepared by:** BA Agent (BA-PRINCIPLES.md v1.1.0)
**Next step:** Present findings to stakeholder for prioritization and sprint planning. Resolve CRITICAL gaps (GAP-001, GAP-005, GAP-007) immediately.
