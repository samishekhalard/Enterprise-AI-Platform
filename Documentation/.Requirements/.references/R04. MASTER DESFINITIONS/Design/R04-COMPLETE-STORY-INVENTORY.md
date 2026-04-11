# R04 Definition Management -- Complete User Story Inventory

**Document ID:** INV-DM-001
**Version:** 1.0.0
**Date:** 2026-03-12
**Author:** BA Agent (BA-PRINCIPLES.md v1.1.0)
**Sources:** Docs 01 (PRD v2.1.0), 05 (UX v1.3.0), 09 (Journeys v2.2.0), 11 (Backlog v1.0.0), 12 (SRS v2.0.0), 18 (Addendum v1.0.0), Audit Report (2026-03-10)

---

## Summary Statistics

| Metric | Count |
|--------|-------|
| Total Epics | 13 |
| Total User Stories | 97 (US-DM-001 through US-DM-097, non-contiguous IDs) |
| Total Story Points | 681 |
| Total Acceptance Criteria | 127 |
| Total Business Rules | 96 (BR-001 to BR-086 + BR-087 to BR-091 + BR-DS-001 to BR-DS-005) |
| Total Error Codes | 63 (DEF-E-xxx) |
| Total Warning Codes | 9 (DEF-W-xxx) |
| Total Success Codes | 35 (DEF-S-xxx) |
| Total Confirmation Dialogs | 20 (CD-01 through CD-60) |
| Total Screens | 20 (SCR-AUTH, SCR-01, SCR-02-T1 through T7M, SCR-03, SCR-04, SCR-04-M1, SCR-05, SCR-06, SCR-GV, SCR-AI, SCR-NOTIF, SCR-PROP, SCR-DIFF, SCR-MANDATE, SCR-EXPORT) |
| Personas | 3 (Super Admin, Architect, Tenant Admin) |

---

## Persona 1: Super Admin (Sam Martinez) [PER-UX-001]

Role: Whole-application custodian with cross-tenant visibility. Bypasses licensing checks. Can impersonate tenant admins.

Primary Epics: E4, E5, E6, E7, E8

---

### Screen: SCR-01 -- Object Type List/Grid View (Cross-Tenant Features)

| Story ID | User Story | Acceptance Criteria | Confirmation Dialogs | Error Messages | Edge Cases |
|----------|-----------|-------------------|---------------------|---------------|------------|
| US-DM-026 | As a super admin, I want to view definitions across all tenants, so that I can audit governance compliance. | AC-1: Given super admin, when toggling "Cross-Tenant View", then list shows all tenant types with Tenant column. AC-2: Given cross-tenant view, when filtering by tenant, then only that tenant's types shown. AC-3: Given compliance badges, when child tenant missing mandated types, then warning badge appears. | -- | DEF-E-016: Unauthorized (403, non-SUPER_ADMIN attempts cross-tenant) | Edge: Cross-tenant view with 0 child tenants shows empty. Edge: Column collapses at mobile (<768px). |

### Screen: SCR-02-T4 -- Object Type Configuration - Governance Tab

| Story ID | User Story | Acceptance Criteria | Confirmation Dialogs | Error Messages | Edge Cases |
|----------|-----------|-------------------|---------------------|---------------|------------|
| US-DM-040 | As a super admin, I want to mandate governance configuration for child tenants, so that child tenants cannot change governance settings on inherited types. | AC-1: Given governance config on mandated type, when `isMasterMandate` set, then child tenants see governance as read-only. AC-2: Given child tenant, when attempting to modify governance on mandated type, then 403 returned. | -- | DEF-E-016: Forbidden (403) | Edge: Mandate on type with 0 child tenants has no effect until provisioning. |
| US-DM-043 | As a super admin, I want to configure override policies for governance settings, so that I can control how much child tenants can customize. | AC-1: Given override policy options ("No overrides allowed", "Additive only", "Full customization"), when configured, then child tenants see appropriate access level. | -- | -- | Edge: Switching from "Full customization" to "No overrides" on types already customized by children. |

### Screen: SCR-01 -- Object Type List (Propagation Features)

| Story ID | User Story | Acceptance Criteria | Confirmation Dialogs | Error Messages | Edge Cases |
|----------|-----------|-------------------|---------------------|---------------|------------|
| US-DM-021 | As a super admin, I want the system to support a master/child tenant hierarchy, so that canonical definitions can flow from master to child tenants. | AC-1: Given tenant "MASTER" with type "master", when child "CHILD-A" provisioned, then parentTenantId points to MASTER. AC-2: Given hierarchy, when queried, then full tree returned. AC-3: Given tenant without parent, then identified as root/master. | -- | -- | Edge: Tenant with parentTenantId pointing to non-existent tenant. |
| US-DM-022 | As a super admin, I want canonical definitions automatically copied to new child tenants, so that child tenants start with master's baseline. | AC-1: Given master has "Server", "Application", "Contract" with mandated attributes, when child provisioned, then all three appear with state "inherited" (AC-6.4.1). AC-2: Given propagated definitions, then "Inherited" badge visible. AC-3: Given propagated types include attributes/connections, then all linkages also propagated. | CD-42 (DEF-C-042): "Confirm Propagation" -- "Propagate {N} definitions to '{tenantName}'?" Buttons: "Propagate" / "Cancel" | DEF-E-130: Target Tenant Not Found (404). DEF-E-131: Partial Propagation Failure (500). DEF-E-132: Duplicate in Target (409). DEF-E-133: Not Master Tenant (403). | Edge: Child tenant already has local type with same typeKey as master type. Edge: Propagation of 0 types selected. |

### Screen: SCR-PROP -- Propagation Wizard (Super Admin Only)

| Story ID | User Story | Acceptance Criteria | Confirmation Dialogs | Error Messages | Edge Cases |
|----------|-----------|-------------------|---------------------|---------------|------------|
| (Part of US-DM-022) | Propagation wizard for selective definition distribution to child tenants. | Step 1: Select target tenant from child tenant dropdown. Step 2: Definition checklist with checkboxes (Name, Status, Attributes, Connections). Step 3: Mandate settings (Additive Only vs Full Mandate). Step 4: Review and confirm. | CD-42 (DEF-C-042): "Confirm Definition Propagation" -- "Propagate {N} definitions to '{tenantName}'?" | DEF-E-130 through DEF-E-133 | Edge: Target tenant has 0 existing definitions. Edge: All types already exist in target. |

### Screen: SCR-02-T5 -- Maturity Tab (Weight Configuration)

| Story ID | User Story | Acceptance Criteria | Confirmation Dialogs | Error Messages | Edge Cases |
|----------|-----------|-------------------|---------------------|---------------|------------|
| US-DM-050 | As a tenant admin, I want to configure maturity axis weights for my tenant, so that I can emphasize important axes. | AC-1: Given default weights 40/25/20/15, when changed to 50/20/20/10, then saved (AC-6.6.10). AC-2: Given weights sum to 90%, when save attempted, then rejected "Axis weights must sum to 100%" (AC-6.6.11, BR-068). AC-3: Given updated weights, when maturity recalculated, then new weights used. | -- | DEF-E-071: Maturity axis weights must sum to 100 (400) | Edge: All weights set to 0 except one at 100. Edge: Negative weight values. |

### Screen: SCR-05 -- Maturity Dashboard

| Story ID | User Story | Acceptance Criteria | Confirmation Dialogs | Error Messages | Edge Cases |
|----------|-----------|-------------------|---------------------|---------------|------------|
| US-DM-052 | As an architect, I want a maturity dashboard showing scores per object type with axis breakdowns. | AC-1: Given SCR-05, when loaded, then summary cards show overall maturity per type using p-knob. AC-2: Given type selected, when drill-down opens, then four-axis breakdown shown. AC-3: Given axis breakdown, then radar chart or bar chart shows four axes. AC-4: Given instances below threshold, then flagged with DEF-W-004. | -- | -- | Empty state: "No maturity data available" (pi-chart-bar icon). Edge: Types with 0 active attributes yield 0% maturity. |

### Screen: SCR-06 -- Locale Management (Super Admin Only)

| Story ID | User Story | Acceptance Criteria | Confirmation Dialogs | Error Messages | Edge Cases |
|----------|-----------|-------------------|---------------------|---------------|------------|
| US-DM-055 | As a tenant admin, I want to manage the active locale list for my tenant. | AC-1: Given admin navigates to Locale Management, when "en" and "ar" added, then both saved as active (AC-6.7.1). AC-2: Given active locales [en, ar], when queried, then both returned with display names. | -- | DEF-E-100: Duplicate Locale Code (409). DEF-E-102: Invalid Locale Code (400). DEF-E-103: Cannot Delete Last Locale (409). DEF-E-104: Locale Not Found (404). | Edge: Adding locale with no language-dependent attributes defined. |
| US-DM-057 | As a tenant admin, I want a Locale Management settings page. | AC-1: Given SCR-06, when loaded, then active locales shown in grid with toggle switches. AC-2: Given new locale "fr" added, when activated, then appears in list. AC-3: Given RTL locale "ar", when previewed, then RTL layout shown. | -- | DEF-E-101: Locale Has Unfilled Values (409, on deactivation) | Empty state: "No locales configured" (pi-globe icon). Edge: Deactivating locale used by 50+ instances. |
| US-DM-060 | As a tenant admin, I want the system to surface existing instances needing values when a new locale is added. | AC-1: Given 50 instances with LD attributes in [en, ar], when "fr" added, then system surfaces 50 instances needing French values (AC-6.7.5). AC-2: Given maturity scoring, when French values missing, then maturity reflects incompleteness. | -- | -- | Edge: New locale added when 0 instances exist. |

### Screen: SCR-04 -- Release Management Dashboard

| Story ID | User Story | Acceptance Criteria | Confirmation Dialogs | Error Messages | Edge Cases |
|----------|-----------|-------------------|---------------------|---------------|------------|
| US-DM-073 | As an architect, I want a Release Management Dashboard showing pending approvals, timeline, and adoption tracker. | AC-1: Given SCR-04, when loaded, then pending releases, published releases, and adoption status per tenant shown. AC-2: Given adoption tracker, when tenant adopts, then tracker updates to "Adopted". AC-3: Given timeline view, then releases shown chronologically with status badges. | -- | -- | Empty state: "No releases created" (pi-send icon). Edge: 0 child tenants -- adoption tracker is empty. |

### Screen: SCR-01 -- Mandate Management

| Story ID | User Story | Acceptance Criteria | Confirmation Dialogs | Error Messages | Edge Cases |
|----------|-----------|-------------------|---------------------|---------------|------------|
| US-DM-031 | As a super admin in master tenant, I want to toggle isMasterMandate on an object type, so that child tenants cannot modify or delete it. | AC-1: Given SUPER_ADMIN in master tenant, when toggling isMasterMandate=true on "Server", then flag persisted (AC-6.5.1). AC-2: Given ARCHITECT in child tenant, when attempting to set mandate, then 403 (BR-032). AC-3: Given isMasterMandate=true, when child loads type, then lock icon appears. | -- | DEF-E-016: Forbidden (403, non-master attempts mandate) | Edge: Toggle mandate on type with 0 child tenants. |
| US-DM-032 | As a super admin, I want to mandate specific attribute linkages, so that child tenants must include them. | AC-1: Given mandated "Hostname" on "Server", when child views attributes, then lock icon and Remove disabled. AC-2: Given mandated attribute, when unlink called in child, then 403 (BR-030). AC-3: Given mandated attribute, when retire attempted in child, then rejected (AC-6.2.1.6). | -- | DEF-E-020: Cannot modify mandated attribute (403). DEF-E-030: Cannot remove mandated connection (403). | Edge: Mandating a retired attribute. |
| US-DM-033 | As a super admin, I want to mandate specific connections. | AC-1: Given mandated "hosts" connection, when child attempts remove, then 403 (BR-031). AC-2: Given mandated connection in child, then lock icon and disabled Remove. | -- | DEF-E-030: Cannot remove mandated connection (403) | Edge: Mandating connection to a non-mandated target type. |
| US-DM-035 | As a super admin in master tenant, I want a dedicated mandate management interface. | AC-1: Given master tenant, when viewing detail, then "Mandate" section with toggles for type, attributes, connections. AC-2: Given mandate toggle activated, then confirmation "Mandating 'Hostname' will lock it in all child tenants. Proceed?" AC-3: Given "Mandate All Attributes" clicked, then all mandated. | CD-41 (DEF-C-041): "Push Mandate Updates" -- "Push {N} mandate updates to {M} child tenants?" Buttons: "Push to All" / "Push to Selected" / "Cancel" | -- | Edge: Mandate all on type with 0 attributes. |

### Screen: SCR-01 -- Governance Actions

| Story ID | User Story | Acceptance Criteria | Confirmation Dialogs | Error Messages | Edge Cases |
|----------|-----------|-------------------|---------------------|---------------|------------|
| US-DM-028 | As a super admin, I want the Architect role in the licensing schema. | AC-1: Given license with 5 Architect seats and 5 assigned, when 6th assigned, then blocked. AC-2: Given premium features, when feature gate checked, then appropriate tier required. | -- | -- | Edge: License with 0 Architect seats configured. |
| US-DM-029 | As a super admin, I want an audit trail of governance actions. | AC-1: Given mandate flag set, when completed, then audit entry created. AC-2: Given audit log, when queried, then governance actions in chronological order. | -- | -- | Edge: Audit log with 0 entries. |
| US-DM-006 | As a platform administrator, I want all definition management messages stored in a centralized registry. | AC-1: Given message_registry table, when queried with category=OBJECT_TYPE, then DEF-E-001 through DEF-E-019 returned. AC-2: Given validation error, when API returns ProblemDetail, then includes messageCode and localized title/detail. AC-3: Given frontend receives error with messageCode, then toast rendered from cached registry in user's locale. AC-4: Given confirmation action, then dialog text from message codes. AC-5: Given locale "ar", then Arabic translation returned; if unavailable, English fallback. | -- | -- | Edge: Message registry table empty (seed not run). Edge: Unknown locale falls back to English. |

### No Corresponding Screen (Governance Report)

| Story ID | User Story | Acceptance Criteria | Confirmation Dialogs | Error Messages | Edge Cases |
|----------|-----------|-------------------|---------------------|---------------|------------|
| US-DM-027a (from GAP-016) | As a super admin, I want to generate a governance compliance report. | AC-6.REPORT.1: Given "Generate Report" clicked, then dialog with format (PDF/CSV/XLSX), date range, scope (All/Selected Tenants). For large reports (>30s), toast "Report is being generated" + notification with download link. | -- | -- | Edge: Report for date range with 0 governance actions. |

---

## Persona 2: Architect (Nicole Roberts) [PER-UX-002]

Role: Owner of definitions repository. Designs, configures, and governs object type taxonomy. Full CRUD on definitions.

Primary Epics: E1-E13 (primary user of all epics)

---

### Screen: SCR-01 -- Object Type List/Grid View

| Story ID | User Story | Acceptance Criteria | Confirmation Dialogs | Error Messages | Edge Cases |
|----------|-----------|-------------------|---------------------|---------------|------------|
| US-DM-003 | As an architect, I want to sort the object type list by name, status, or creation date. | AC-1: Given sort=name,asc, then sorted alphabetically. AC-2: Given sort=createdAt,desc, then newest first. AC-3: Given no sort param, then default name,asc. | -- | -- | Sortable fields: name, typeKey, code, status, createdAt, updatedAt, attributeCount. Edge: Sort on field with all identical values. |
| AC-6.1.18 (from GAP-010) | Sort Object Type List (enhanced). | Given 50 types, when column header clicked, then list re-sorts. Sort indicator arrow shown. Clicking same header toggles asc/desc. API param: sort={field},{direction}. | -- | -- | Edge: Sort by attributeCount on types with 0 attributes. |
| US-DM-007 | As an architect, I want object type status transitions to follow a validated state machine. | AC-1: Given status "active", when transition to "retired" requested, then DEF-C-004 shown. AC-2: Given status "planned", when "hold" attempted, then 400 with DEF-E-012. AC-3: Given status "retired", when reactivation requested, then naming conflict check (DEF-E-011). AC-4: All valid transitions: planned->active, active->hold, hold->active, active->retired, hold->retired, retired->active. | CD-01 (DEF-C-001): Activate -- "Activate {name}?" / CD-02 (DEF-C-002): Hold -- "Put {name} on hold?" / CD-03 (DEF-C-003): Resume -- "Resume {name}?" / CD-04 (DEF-C-004): Retire -- "Retire {name}? {instanceCount} instances preserved." / CD-05 (DEF-C-005): Reactivate -- "Reactivate {name}?" | DEF-E-012: Invalid lifecycle transition (400). DEF-E-011: Naming conflict on reactivation. | Edge: Retire type with 0 instances. Edge: Invalid transition planned->retired. |
| -- | Delete object type | -- | CD-08 (DEF-C-008): Delete -- "Delete {name}? Cannot be undone." Buttons: "Delete" (danger) / "Cancel" | -- | Edge: Delete type with state="default" blocked. Delete type with instanceCount>0 blocked. |
| -- | Duplicate object type | -- | CD-09 (DEF-C-009): Duplicate -- "Create copy of {name}?" Buttons: "Duplicate" / "Cancel" | DEF-S-004: Duplicate success | Edge: Duplicate type with system default attributes -- all included. |
| -- | Restore to default | -- | CD-07 (DEF-C-007): Restore -- "Restore {name} to default? Customizations lost." Buttons: "Restore" / "Cancel" | DEF-S-005: Restore success | Edge: Restore type already in "default" state (button disabled). |
| -- | View toggle (Table/Card/Graph) | -- | -- | -- | Edge: Mobile (<768px) defaults to Card view. Graph toggle visible only to ARCHITECT/SUPER_ADMIN. |

### Screen: SCR-01 (Loading, Empty, Error States)

| Story ID | User Story | Acceptance Criteria | Confirmation Dialogs | Error Messages | Edge Cases |
|----------|-----------|-------------------|---------------------|---------------|------------|
| -- | Loading state | 5 skeleton rows with circle placeholder + 2 text lines. | -- | -- | -- |
| -- | Empty state | Icon: pi-box (centered). Heading: "No object types match your criteria." Subtext: "Create your first object type." "New Type" button visible. | -- | -- | Edge: Filter applied producing 0 results vs truly empty tenant. |
| -- | Error state | Error banner: "Failed to load object types. Please try again." Retry button. | -- | DEF-E-050: API error (error, 5s) | Edge: Network timeout (504/503) -- persistent toast, not auto-dismissed. |

### Screen: SCR-03 -- Create Object Type Wizard

| Story ID | User Story | Acceptance Criteria | Confirmation Dialogs | Error Messages | Edge Cases |
|----------|-----------|-------------------|---------------------|---------------|------------|
| US-DM-005 | As an architect, I want every new object type to include system default attributes (AP-2). | AC-1: Given new type created, then 10 system defaults auto-linked (name, description, status, owner, createdAt, createdBy, updatedAt, updatedBy, externalId, tags) with isSystemDefault=true. AC-2: Given system default, when unlink attempted, then 403 with DEF-E-026. AC-3: Given UI, then shield icon (pi-shield) and disabled Remove. AC-4: Given duplicate, then system defaults included on copy. | -- | DEF-E-026: Cannot unlink system default attribute (403) | Edge: System default AttributeType nodes not yet seeded in tenant. |
| US-DM-097 | As an architect, I want AI to suggest attributes and connections during type creation. | AC-1: Given creating "Database Server", when AI detects name, then suggests "Hostname", "DB Engine", "Port" and connections "hosts -> Database" (AC-6.11.4). AC-2: Given suggestions, then user can accept or dismiss each independently (BR-062). | -- | -- | Edge: AI service unavailable -- wizard proceeds without suggestions. Edge: New type name with no matches returns 0 suggestions. |
| AC-6.NET.2 (from GAP-025) | Wizard submission network failure. | Given wizard complete and "Create" clicked, when API fails, then wizard stays open on Review step with all data preserved. Toast DEF-E-050 displays. "Create" button re-enables. Wizard does NOT close or reset. | -- | DEF-E-050: Network failure (persistent) | Edge: Repeated retries (button remains enabled). |

**Wizard Steps (4 steps -- corrected per GAP-009):**

| Step | Name | Content | Status |
|------|------|---------|--------|
| 1 | Basic Info | Name (required, max 255), description, icon (p-select), icon color (p-colorPicker) | [IMPLEMENTED] |
| 2 | Connections | Select target types, configure connection properties | [IMPLEMENTED] |
| 3 | Attributes | Attribute pick-list with checkbox selection | [IMPLEMENTED] |
| 4 | Status/Review | Status selection, review summary | [IMPLEMENTED] |

**Validation Rules (Wizard):**

| Field | Required | Constraint | Error Code |
|-------|----------|------------|------------|
| name | Yes | Not blank, max 255 | DEF-E-004 |
| typeKey | Auto-generated | Max 100 | DEF-E-006 |
| code | Auto-generated | Max 20 | DEF-E-007 |
| status | Yes | Enum: active, planned, hold, retired | DEF-E-008 |
| iconColor | No | Pattern: #[0-9A-Fa-f]{6} | DEF-E-019 |

### Screen: SCR-02-T1 -- General Tab (Detail Panel)

| Story ID | User Story | Acceptance Criteria | Confirmation Dialogs | Error Messages | Edge Cases |
|----------|-----------|-------------------|---------------------|---------------|------------|
| -- | View/Edit object type general properties | Fields: Name, TypeKey (readonly), Code (readonly), Description, Status (p-tag), State (p-tag), Icon, Icon Color, Attribute Count, Connection Count, Created At, Updated At. Edit mode via Edit button. Save/Cancel in edit mode. | CD-06 (DEF-C-006): Customize Default -- "Editing will change state to customized." Buttons: "Edit" / "Cancel" | DEF-E-002: Duplicate typeKey conflict (409). DEF-E-003: Duplicate code conflict (409). DEF-E-004: Name required. DEF-E-005: Name max 255. DEF-E-017: Concurrent edit conflict (409, optimistic locking). | Edge: Edit while another user edits (optimistic locking -- AC-6.OL.1). |
| AC-6.OL.1 (from GAP-019) | Concurrent edit conflict detection (optimistic locking). | Given User A and User B both load "Server" (version 3). User A saves (version becomes 4). When User B saves with If-Match: 3, then 409 Conflict with DEF-E-017. Warning banner with "Reload", "Force Save", "Cancel" buttons. | -- | DEF-E-017: "Server was modified by another user. Please reload and retry." (409). DEF-W-001: "Modified by {user} at {timestamp}." | Edge: User B force saves -- version jumps to 5. |
| AC-6.AUDIT.1 (from GAP-020) | CreatedBy/UpdatedBy tracking. | Given create or update, then createdBy = JWT sub (set on creation, never changes), updatedBy = JWT sub (updated on every modification). General Tab displays: "Created by {createdBy} on {createdAt}" and "Last modified by {updatedBy} on {updatedAt}". | -- | -- | Edge: createdBy for system-propagated definitions = system account. |
| AC-6.INH.3 (from C4 resolution) | Set IS_SUBTYPE_OF relationship. | Given General Tab, when "Set Parent Type" clicked (visible only when no parent set), then dialog with p-select listing all types (excluding self and descendants). POST /api/v1/definitions/object-types/{childId}/parent/{parentId}. If depth exceeds 5: DEF-E-090. If circular: DEF-E-091. On success: parent badge "Subtype of: {parentName}". | -- | DEF-E-090: IS_SUBTYPE_OF depth exceeds max 5 (400). DEF-E-091: Circular reference detected (400). | Edge: Set parent on type that already has subtypes (allowed, depth check applied). BR-089: Circular reference prevention. BR-090: Max depth 5. |

### Screen: SCR-02-T2 -- Attributes Tab

| Story ID | User Story | Acceptance Criteria | Confirmation Dialogs | Error Messages | Edge Cases |
|----------|-----------|-------------------|---------------------|---------------|------------|
| US-DM-008 | As an architect, I want to retrieve a single attribute type by ID. | AC-1: Given "Hostname" exists, when GET by ID, then full attribute returned. AC-2: Given invalid ID, then 404 with DEF-E-021. | -- | DEF-E-021: Attribute type not found (404). DEF-E-029: AttributeType Not Found (404, variant from addendum). | -- |
| US-DM-009 | As an architect, I want to update an attribute type's name, description, or validation rules. | AC-1: Given "Hostname", when PUT with updated description, then updated and updatedAt refreshed. AC-2: Given duplicate attributeKey, then 409. AC-3: Given partial update, then only specified fields changed. | -- | DEF-E-028: Duplicate Attribute Key (409). DEF-E-094: AttributeKey immutable after creation (400). DEF-E-095: DataType immutable after creation (400). DEF-E-096: Invalid validation rules JSON (400). | Edge: Attempt to change dataType after creation. |
| US-DM-010 | As an architect, I want to delete an attribute type no longer needed. | AC-1: Given "TempField" not linked, when DELETE, then removed. AC-2: Given "Hostname" linked to 3 types, when DELETE, then 409 "linked to 3 object types: Server, Router, Switch". AC-3: Given UI delete clicked, then confirmation dialog. | CD-14 (DEF-C-014): Delete Attribute Type -- "Permanently delete '{attributeName}'? Cannot be undone." Buttons: "Delete" (danger) / "Cancel" | DEF-E-027: Cannot delete linked AttributeType (409, lists linked types). | Edge: Delete attribute linked to 0 types but has been in instance data (not blocked at definition level). |
| US-DM-011 | As an architect, I want attribute type list pagination. | AC-1: Given 100 types, when page=0&size=25, then 25 returned with pagination metadata. AC-2: Given frontend, then p-paginator or virtual scroll. | -- | -- | Default page size: 25. Max page size: 100. |
| US-DM-012 | As an architect, I want each attribute linkage to carry a lifecycle status (planned/active/retired). | AC-1: Given "MaintenanceWindow" with lifecycleStatus "planned", then blue "Planned" chip; NOT in instance forms (AC-6.2.1.1). AC-2: Given transition to "active", then green "Active" chip; appears in forms (AC-6.2.1.2). AC-3: Given "Notes" retired, then grey "Retired" chip; data preserved read-only; hidden from new forms (AC-6.2.1.3). AC-4: Given reactivated, then returns to "active" (AC-6.2.1.4). AC-5: Given mandatory with 15 instances, when retire attempted, then warning "15 instances have data. Preserved as read-only." (AC-6.2.1.5). | CD-10 (DEF-C-010): Activate Attribute -- "Activate {attr} on {type}?" / CD-11 (DEF-C-011): Retire Attribute -- "Retire {attr}? {instanceCount} instances preserved." / CD-12 (DEF-C-012): Reactivate Attribute -- "Reactivate {attr}?" | -- | Edge: Retire mandated attribute in child tenant -- rejected (AC-6.2.1.6). Edge: Retire system default -- rejected (BR-073). Valid transitions: planned->active, active->retired, retired->active. Invalid: planned->retired. |
| US-DM-013 | As an architect, I want visual lifecycle indicators on each attribute. | AC-1: Given attribute list, then p-tag severity chips: blue=planned, green(success)=active, grey(secondary)=retired. AC-2: Given retired, then row opacity 0.6 (greyed out). AC-3: Given keyboard navigation, then lifecycle chip announced by screen reader. | -- | -- | Edge: All attributes retired -- list shows all greyed out. |
| US-DM-014 | As an architect, I want to search and filter attributes by name, data type, or group in the pick-list. | AC-1: Given 50 attributes, when "host" typed, then only matching shown. AC-2: Given group "network" selected, then only network attributes shown. AC-3: Given wizard, when search applied, then checkbox states preserved. | -- | -- | Edge: Search with 0 results. Edge: Filter by group that has 0 attributes. |
| US-DM-015 | As an architect, I want bulk attribute lifecycle transition. | AC-1: Given 5 planned selected, when "Activate Selected", then all 5 transition. AC-2: Given mix of planned+active selected, when "Retire Selected", then only active retired; planned skipped with warning. AC-3: Given bulk action, then single dialog "Activate 5 attributes on Server?" with list. | -- | -- | Edge: Bulk retire includes mandated attributes -- partial failure toast: "{N} retired. {M} could not be retired (mandated by master tenant)." (AC-6.BULK.1) |
| US-DM-015a | As an architect, I want to update isRequired and displayOrder on attribute linkage. | AC-1: Given "Hostname" linked with isRequired=false, when PATCH with isRequired=true, then updated. AC-2: Given drag-and-drop reorder, then displayOrder values updated. | -- | -- | Edge: displayOrder < 0 rejected (BR-017). |
| US-DM-044 | As an architect, I want to assign maturityClass (Mandatory/Conditional/Optional) to each attribute. | AC-1: Given "Server" with "Hostname", when maturityClass "Mandatory" assigned, then saved on HAS_ATTRIBUTE (AC-6.6.1). AC-2: Given attributes tab, then dropdown per attribute. | -- | -- | Edge: maturityClass on retired attribute (excluded from maturity calculation per BR-040). |
| US-DM-046 | As an architect, I want to assign requiredMode (mandatory_creation/mandatory_workflow/optional/conditional). | AC-1: Given "Hostname" with requiredMode "mandatory_creation", when instance created without it, then blocked (AC-6.6.3). AC-2: Given "Patch Level" with requiredMode "mandatory_workflow", when created without it, then creation succeeds but workflow blocked (AC-6.6.12). AC-3: Given UI, then dropdown with 4 options. | -- | -- | Edge: requiredMode "conditional" without conditionRule defined. |
| US-DM-054 | As an architect, I want to define condition rules for conditional attributes. | AC-1: Given "Cluster ID" with requiredMode="conditional" and condition "isClusteredServer == true", when instance has isClusteredServer=true and no Cluster ID, then blocked (AC-6.6.13). AC-2: Given SpEL expression, then validated before saving. | -- | -- | Edge: Invalid SpEL expression rejected on save. |
| AC-6.INH.1 (from C4) | View inherited attributes on subtype. | Given "VirtualServer" IS_SUBTYPE_OF "Server", then inherited attributes show badge "Inherited from Server" (pi-arrow-down, severity info). Subtle background tint. Remove disabled with tooltip. | -- | -- | Edge: Inherited attribute overridden locally -- badge changes to "Inherited (overridden)" (pi-pencil). BR-087: attribute inheritance. BR-088: override rules. |
| AC-6.INH.2 (from C4) | Override inherited attribute properties. | Given "VirtualServer" inherits "Hostname" with isRequired=true, when changed to false, then override saved locally. Parent NOT affected. | -- | DEF-E-093: Cannot modify inherited property (403, only isRequired/displayOrder/maturityClass/requiredMode overridable). | Edge: Override displayOrder on all inherited attributes. |
| AC-6.INH.4 (from C4) | Parent change impact warning. | Given "Server" has 3 subtypes, when adding "Patch Level", then warning dialog: "Adding 'Patch Level' to 'Server' will affect 3 subtypes." Buttons: "Proceed" / "Cancel". On proceed, attribute inherited by all subtypes. | -- | DEF-W-011: "This change affects {childCount} subtypes: {childNames}." DEF-W-012: Partial propagation (some children failed). | Edge: Parent with 0 subtypes -- no warning shown. |

**Attributes Tab Empty State:** Icon: pi-list. Heading: "No attributes linked." Subtext: "Link attributes from the library or create new ones." Action: "Add Attribute" button.

### Screen: SCR-02-T3 -- Connections Tab

| Story ID | User Story | Acceptance Criteria | Confirmation Dialogs | Error Messages | Edge Cases |
|----------|-----------|-------------------|---------------------|---------------|------------|
| US-DM-016 | As an architect, I want each connection to carry a lifecycle status (planned/active/retired). | AC-1: Given new connection with lifecycleStatus "planned", then blue "Planned" chip. AC-2: Given connection "active" retired, then grey chip; instance relationships preserved read-only. AC-3: Given invalid transition (planned->retired), then 400. | CD-20 (DEF-C-020): Activate connection. CD-21 (DEF-C-021): Retire connection. CD-22 (DEF-C-022): Reactivate connection. | -- | Edge: Retire connection with active instances using it. |
| US-DM-017 | As an architect, I want to update a connection's active name, passive name, cardinality, or direction. | AC-1: Given "hosts" between Server and Application, when activeName changed to "runs", then updated. AC-2: Given connections tab, when edit clicked, then inline edit form with current values. | -- | DEF-S-023: Connection updated (success) | Inline edit fields: activeName (required, max 255), passiveName (required, max 255), cardinality (p-select: 1:1, 1:N, M:N), isDirected (toggle). |
| US-DM-018 | As an architect, I want to assign importance level to each connection. | AC-1: Given connection, when importance "critical" set, then saved. AC-2: Given connections tab, then severity badge (red=critical, orange=high, yellow=medium, grey=low). | -- | -- | Edge: Importance not set -- defaults to null (no badge). |
| US-DM-019 | As an architect, I want to mark a connection as required. | AC-1: Given "runs_on" marked required, when instance created without linking Application, then blocked "Mandatory relation required" (AC-6.6.4). AC-2: Given connections tab, then "Required" badge shown. | -- | -- | Edge: Required connection to retired target type. |
| US-DM-020 | As an architect, I want to see both outgoing and incoming connections. | AC-1: Given Server has "hosts" -> Application, when viewing Application's connections, then incoming "hosted on" <- Server shown (passive name). AC-2: Given UI, then "Outgoing" and "Incoming" sections with directional icons. | -- | -- | Edge: Type with 0 incoming connections. Edge: Self-referencing connection (type connects to itself). |
| US-DM-045 | As an architect, I want to assign maturity classes to connections. | AC-1: Given "runs_on", when maturityClass "Mandatory" assigned, then saved on CAN_CONNECT_TO. AC-2: Given connections tab, then maturity class dropdown per connection. | -- | -- | Edge: maturityClass on retired connection (excluded per BR-040). |
| US-DM-047 | As an architect, I want to assign required modes to connections. | AC-1: Given "runs_on" with requiredMode "mandatory_creation", when instance created without linking, then blocked (AC-6.6.4). | -- | -- | -- |

**Connections Tab Empty State:** Icon: pi-sitemap. Heading: "No connections defined." Subtext: "Define relationships to other object types." Action: "Add Connection" button.

### Screen: SCR-02-T4 -- Governance Tab

| Story ID | User Story | Acceptance Criteria | Confirmation Dialogs | Error Messages | Edge Cases |
|----------|-----------|-------------------|---------------------|---------------|------------|
| US-DM-037 | As an architect, I want a Governance tab showing attached workflows. | AC-6.8.1: Given "Server" detail, when Governance tab selected, then split-panel: Workflows left (p-table: Workflow Name, Active Version, Behaviour, Status, Actions), Direct Operations right (toggles). If mandated, banner: "This governance configuration is mandated by the master tenant." AC-2: Given workflows attached, then columns shown. AC-3: Given no workflows, then empty state. | -- | DEF-E-060: Failed to load governance configuration (error banner with Retry) | Empty state: "No governance configuration" (pi-cog icon). |
| US-DM-038 | As an architect, I want to attach a workflow to an object type. | AC-6.8.2: Given "Add Workflow" clicked, then Workflow Settings Dialog (600px) with: Workflow Selector (p-select from process-service), Behaviour radio (Create/Reading/Reporting/Other), Permission table, "Add User/Role" button. "Save" sends POST. On success: DEF-S-080. On duplicate: DEF-E-063. | -- | DEF-E-063: Duplicate Workflow (409). DEF-E-065: Max 5 workflows exceeded (400). | Edge: process-service unavailable -- dropdown empty with error. Edge: 5 workflows already attached -- "Add Workflow" disabled. |
| US-DM-039 | As an architect, I want to configure direct operation settings. | AC-6.8.3: Given Governance tab right panel, then toggles: allowDirectCreate (ON), allowDirectUpdate (ON), allowDirectDelete (OFF), versionTemplate (OFF), viewTemplate (OFF). When toggled, PUT sent. On success: DEF-S-081. On failure: toggle reverts, DEF-E-064 (persistent). | -- | DEF-E-064: Failed to update direct operation settings (500, persistent toast) | Edge: All operations disabled -- instances can only be managed via workflows. |
| AC-6.8.4 (from C1) | Edit workflow settings. | Given attached workflow, when Edit clicked (pi-pencil), then dialog pre-populated. Workflow selector disabled. "Save" sends PUT. On success: DEF-S-082. | -- | -- | Edge: Edit workflow that has been deleted from process-service. |
| AC-6.8.5 (from C1) | Delete workflow from object type. | Given attached workflow, when Delete clicked (pi-trash), then confirmation CD-43. On confirm: DELETE called. On success: DEF-S-083. Row animates out (fade+slide, 200ms). | CD-43 (DEF-C-043): "Remove Workflow" -- "Remove '{workflowName}' from '{objectTypeName}'? Instances remain in current state." Buttons: "Remove" (danger) / "Cancel" | -- | Edge: Delete last workflow -- type has 0 workflows. |
| AC-6.8.6 (from C1) | Master mandate on governance configuration. | Given Super Admin toggles "Mandate Governance Config", then PUT with isMasterMandate:true. All child tenants locked. Lock icon (pi-lock) on all controls. Child cannot modify. | -- | -- | -- |
| AC-6.8.7 (from C1) | Governance audit trail. | Given any governance change saved, then audit record created (action: GOVERNANCE_CHANGE, entityType: ObjectType, before/after JSON, timestamp). Visible on governance compliance report. | -- | -- | -- |
| US-DM-041 | As an architect, I want to configure permissions on a workflow. | AC-1: Given Workflow Settings dialog, then permissions table (Username/Role + Type + Actions). AC-2: Given "Add User/Role" clicked, then selector appears. AC-3: Given non-privileged user, then 403. | -- | DEF-E-016: Forbidden (403) | -- |
| US-DM-042 | As an architect, I want to see governance rules with descriptions and status. | AC-1: Given rules exist, then listed with description and Active/Inactive status. AC-2: Given rule references attributes, then attribute names shown as linked chips. | -- | -- | Edge: 0 governance rules defined. |

### Screen: SCR-02-T5 -- Maturity Tab

| Story ID | User Story | Acceptance Criteria | Confirmation Dialogs | Error Messages | Edge Cases |
|----------|-----------|-------------------|---------------------|---------------|------------|
| US-DM-048 | As an architect, I want the system to calculate composite maturity score across four axes. | AC-1: Given maturity schema and partial instance data, then four axis scores and composite returned (AC-6.6.2). AC-2: Given only active attributes/connections counted, then planned/retired excluded from both numerator AND denominator (AC-6.6.5, BR-040). AC-3: Given weights 40/25/20/15, then overallMaturity = w1*Completeness + w2*Compliance + w3*Relationship + w4*Freshness (BR-039). AC-4: Given last update 120 days ago with threshold 90, then Freshness = max(0, 1-120/90) = 0% (AC-6.6.8). AC-5: Given no freshnessThresholdDays, then Freshness defaults to 100% (AC-6.6.9). | -- | -- | Edge: Zero active attributes -- Completeness = 100% or N/A. Edge: All attributes retired -- maturity has no denominator. |
| US-DM-049 | As an architect, I want to configure freshness threshold per object type. | AC-1: Given "Server", when freshnessThresholdDays=90 set, then persisted. AC-2: Given Maturity tab, then numeric input available. | -- | -- | Edge: Threshold set to 0 -- all instances stale. Edge: Threshold negative rejected. |
| US-DM-051 | As an architect, I want Compliance axis to check mandate conformance, validation, and workflow completion. | AC-1: Given mandated "Serial Number" missing, then mandateScore reduced (AC-6.6.6). AC-2: Given validation failure on "IP Address", then validationScore reduced (AC-6.6.7). AC-3: Given formula compliance = mandate*0.60 + validation*0.20 + workflow*0.20, then matches expected. | -- | -- | Edge: No mandated attributes -- mandateScore = 100%. |
| US-DM-053 | As an architect, I want a Maturity tab on object type configuration. | AC-1: Given detail panel, when Maturity tab selected, then four-axis weight sliders and scoring preview. AC-2: Given maturity/requiredMode changed, then scoring preview updates real-time. AC-3: Given freshness threshold set to 90, then preview shows example calculation. | -- | DEF-S-040: Maturity Config Saved (success) | Empty state: "No maturity configuration" (pi-chart-bar icon). |

### Screen: SCR-02-T6 -- Locale Tab

| Story ID | User Story | Acceptance Criteria | Confirmation Dialogs | Error Messages | Edge Cases |
|----------|-----------|-------------------|---------------------|---------------|------------|
| US-DM-056 | As an architect, I want to flag an attribute as Language Dependent or Language Independent. | AC-1: Given attribute creation, when isLanguageDependent=true set, then persisted (BR-047). AC-2: Given attribute detail, then "Language Dependent" badge shown. | -- | -- | Edge: Flag toggled after instances already have single-locale values. |
| US-DM-058 | As an architect, I want instance forms to show per-locale input fields for Language Dependent attributes. | AC-1: Given locales [en, ar] and "Display Name" is LD, then two inputs (English, Arabic) (AC-6.7.2). AC-2: Given Arabic input, then dir="rtl" applied. AC-3: Given LI attribute "Status Code", then single input (AC-6.7.3). | -- | -- | Edge: Locale list empty -- single default input. |
| US-DM-059 | As an architect, I want system to reject saves with incomplete locale values. | AC-1: Given locales [en, ar] and LD "Display Name" with only English, when save attempted, then rejected "requires value in all active locales: ar is missing" (AC-6.7.4). | -- | -- | Edge: Locale deactivated after instances created -- existing values preserved. |
| US-DM-061 | As an architect, I want a Locale tab on object type configuration. | AC-1: Given detail panel, when Locale tab selected, then attributes listed with Language Dependent toggle per attribute. AC-2: Given toggle changed, when saved, then isLanguageDependent updated. | -- | DEF-S-050: Locale Created. DEF-S-051: Locale Updated. DEF-S-052: Locale Deleted. | Empty state: "No locales configured" (pi-globe icon). |
| US-DM-062 | As an architect, I want to configure lookup codes on Language Independent attributes. | AC-1: Given LI attribute "Status Code", when created with lookupCode "ACT", then stored. AC-2: Given instance form, then lookup code shown as value format hint. | -- | -- | Edge: lookupCode on Language Dependent attribute -- field hidden. |

### Screen: SCR-02-T6M -- Measures Categories Tab

| Story ID | User Story | Acceptance Criteria | Confirmation Dialogs | Error Messages | Edge Cases |
|----------|-----------|-------------------|---------------------|---------------|------------|
| US-DM-090 | As an architect, I want CRUD for measure categories on an object type. | AC-1: Given "Server" Measures Categories tab, when "Add Category" clicked, then created with name, description, displayOrder (AC-6.12.1). AC-2: Given duplicate name, then rejected (AC-6.12.2, BR-069). AC-3: Given category with measures, when delete attempted, then rejected "contains 3 measures" (AC-6.12.3). AC-4: Given USER role, then 403 (AC-6.12.4). | -- | DEF-E-081: Duplicate category name. DEF-E-082: Cannot delete category with measures. DEF-S-060: Category Created. DEF-S-061: Category Updated. DEF-S-062: Category Deleted. | Empty state: "No measure categories" (pi-folder icon). Validation: name (required, max 100), description (max 500), displayOrder (integer, 0-999). |

### Screen: SCR-02-T7M -- Measures Tab

| Story ID | User Story | Acceptance Criteria | Confirmation Dialogs | Error Messages | Edge Cases |
|----------|-----------|-------------------|---------------------|---------------|------------|
| US-DM-092 | As an architect, I want CRUD for measures within a category. | AC-1: Given category "Performance", when "Add Measure" with name="Uptime", unit="%", target=99.9, warning=99.5, critical=99.0, then created (AC-6.13.1). AC-2: Given duplicate name in same category, then rejected (AC-6.13.3). AC-3: Given value 99.7, then amber indicator (AC-6.13.4). | -- | DEF-E-084: Duplicate Measure Name (409). DEF-E-085: Invalid Threshold Config (warning >= critical) (400). DEF-E-086: Invalid Formula (400). DEF-E-087: Measure Missing Mandatory Fields (400). DEF-S-070: Measure Created. DEF-S-071: Updated. DEF-S-072: Deleted. | Empty state: "No measures defined" (pi-chart-line icon). Validation: name (required, max 100), unit (required, max 50), targetValue (numeric), formula (max 2000, valid expression). |
| US-DM-093 | As an architect, I want calculated measures with formulas. | AC-1: Given formula "totalCost / transactionCount", when values entered, then result calculated (AC-6.13.2). AC-2: Given invalid formula, then validation error. | -- | DEF-E-086: Invalid formula syntax | Edge: Division by zero in formula. |
| US-DM-094 | As an architect, I want threshold indicators (green/amber/red). | AC-1: Given target=99.9, warning=99.5, critical=99.0 and value=99.7, then amber (AC-6.13.4). AC-2: Given value>=target, then green. AC-3: Given value<=critical, then red. | -- | -- | Edge: Warning and critical not configured -- only green/red. Accessibility: Color + text labels for colorblind. |
| US-DM-091 | As a super admin, I want to mandate measure categories for child tenants. | AC-1: Given mandated category, when child views, then locked. AC-2: Given child adding local category alongside mandated, then permitted. | -- | -- | -- |
| US-DM-095 | As a super admin, I want to mandate specific measures for child tenants. | AC-1: Given mandated measure, when child views, then locked. AC-2: Given child adding local measure, then permitted. | -- | -- | -- |

### Screen: SCR-GV -- Graph Visualization

| Story ID | User Story | Acceptance Criteria | Confirmation Dialogs | Error Messages | Edge Cases |
|----------|-----------|-------------------|---------------------|---------------|------------|
| US-DM-075 | As an architect, I want an interactive graph view showing object types as nodes and connections as edges. | AC-6.9.1: Each ObjectType = node (rounded rect, bg=iconColor, label=name, icon overlay). CAN_CONNECT_TO = solid edge with label=activeName, arrow if directed. IS_SUBTYPE_OF = dashed edge, label "subtype of". Layout: cose-bilkent (force-directed). Toolbar: Zoom In/Out, Fit All, Reset Layout, Export, Layout Selector. AC-2: IS_SUBTYPE_OF hierarchy with dashed edges. AC-3: Click node opens detail panel. AC-4: 500 nodes at >30fps (NFR-002). | -- | -- | Empty state: "No object types to visualize" (pi-sitemap). Max: >500 nodes = warning banner. >1000 nodes = limited to 500 (sorted by connections). |
| US-DM-076 | As an architect, I want to filter the graph by status. | AC-6.9.2: Given status filter set to "active", then only active nodes visible. Edges to hidden nodes also hidden. Layout recalculates. Badge: "Showing X of Y types." "All" restores all. | -- | -- | Edge: Filter results in 0 visible nodes. |
| US-DM-077 | As an architect, I want zoom, pan, and layout controls. | AC-6.9.3: Mouse wheel = zoom (min 0.2x, max 3x). Click+drag canvas = pan. Click+drag node = reposition. Pinch gesture on tablet. Zoom In/Out buttons = 0.2x increment. Fit All = show all in viewport. Reset Layout = re-run algorithm. Layout options: Force-Directed (cose-bilkent), Hierarchical (dagre), Circular (circle), Grid (grid). | -- | -- | Edge: Single node -- all layouts produce same result. |
| US-DM-078 | As an architect, I want to export graph as PNG or SVG. | AC-6.9.4: Export button dropdown: "Export as PNG" (cy.png, scale 2, browser download as definition-graph-{timestamp}.png). "Export as SVG" (cy.svg). Toast DEF-S-090. | -- | DEF-S-090: "Graph exported as {format}" | Edge: Export empty graph. |
| US-DM-079 | As an architect, I want to search for a type in the graph and have it highlighted. | AC-1: Given search "Server", then node highlighted and centered. AC-2: Given connected nodes matched, then path highlighted. | -- | -- | Edge: Search with no match. |
| US-DM-080 | As an architect, I want IS_SUBTYPE_OF hierarchy display. | AC-6.9.5: IS_SUBTYPE_OF edges = dashed, color --adm-primary (teal), always directed (child->parent), label "subtype of". Hierarchical layout = top-down tree. Hover highlights ancestors and descendants with glow. AC-6.9.6: Click node = border glow, detail overlay (380px, name, typeKey badge, status tag, attribute/connection counts, "Open Full Detail" button). Click canvas background = close panel. | -- | -- | Edge: Type with no IS_SUBTYPE_OF relationships. |

### Screen: SCR-AI -- AI Insights Panel

| Story ID | User Story | Acceptance Criteria | Confirmation Dialogs | Error Messages | Edge Cases |
|----------|-----------|-------------------|---------------------|---------------|------------|
| US-DM-096 | As an architect, I want AI to detect similar/duplicated object types. | AC-1: Given "Server" and "Physical Server" with 80% overlap, when AI runs, then duplication flagged (AC-6.11.2). AC-2: Given duplication detected, then merge suggestion with proposed definition. AC-3: Given ARCHITECT, then scoped to tenant; SUPER_ADMIN sees cross-tenant (AC-6.11.5, BR-063). AC-4: Given 500 types, then completes within 5 seconds (NFR-014). | -- | -- | Empty state: "No insights available" (pi-sparkles). Min 5 types required for AI analysis. Edge: AI service unavailable -- panel shows error with retry. |

### Screen: SCR-01 -- Import/Export

| Story ID | User Story | Acceptance Criteria | Confirmation Dialogs | Error Messages | Edge Cases |
|----------|-----------|-------------------|---------------------|---------------|------------|
| US-DM-081 | As an architect, I want to export definitions as JSON. | AC-6.IMP.1: Export dialog with format (JSON/YAML), scope (Selected/All), includes (Attributes, Connections, Maturity, Governance checkboxes). GET call triggers download. Toast DEF-S-110. AC-2: File includes exportedAt, tenantId, version metadata. AC-3: >10MB returns error (NFR-008). | -- | DEF-S-110: "Definitions exported successfully." | Edge: Export with 0 types -- empty file structure. |
| US-DM-082 | As an architect, I want to import definitions from JSON with conflict detection. | AC-6.IMP.2: Upload valid JSON, validate (size <=10MB, valid JSON, schema match). Preview: types to create (green), update (amber), conflicts (red). Conflict resolution: Skip/Overwrite/Rename. POST triggers import. Toast DEF-S-111. AC-6.IMP.3: Duplicate typeKey conflict shown with resolution options. AC-6.IMP.4: >10MB rejected client-side with DEF-E-120. AC-6.IMP.5: Mid-way failure rolls back all changes atomically. | CD-60 (DEF-C-060): "Confirm Overwrite" -- "Overwrite existing '{typeName}'?" Buttons: "Overwrite" (danger) / "Cancel" | DEF-E-120: File Too Large (400). DEF-E-121: Invalid JSON (400). DEF-E-122: Schema Mismatch (400). DEF-E-123: Import Failed, no changes applied (500). DEF-E-124: Unsupported Format (400). DEF-S-111: "{count} definitions imported." | Edge: Import file with 0 types. Edge: All types conflict. |
| US-DM-083 | As an architect, I want to export as YAML. | AC-1: Given format=yaml, then valid YAML with same structure as JSON. | -- | -- | -- |
| US-DM-084 | As an architect, I want to export selected types only. | AC-1: Given types selected via checkboxes, then only selected in file. AC-2: Given connections to unselected types, then references included as external. | -- | -- | Edge: Selected type has connections to itself only. |
| US-DM-085 | As an architect, I want to import from YAML files. | AC-1: Given valid YAML, then same behavior as JSON import. | -- | -- | -- |

### Screen: SCR-02-T5DS -- Data Sources Tab

| Story ID | User Story | Acceptance Criteria | Confirmation Dialogs | Error Messages | Edge Cases |
|----------|-----------|-------------------|---------------------|---------------|------------|
| US-DM-086 | As an architect, I want a Data Sources tab. | AC-6.DS.1: p-table with columns: Name, Type (tag: REST=info, Database=success, File Import=warn, Manual=secondary), Status (Connected=success, Disconnected=danger, Not Tested=secondary), Mapped Attributes (count), Last Sync (relative time), Actions (Edit, Test, Delete). | -- | -- | Empty state: "No data sources configured" (pi-database icon). Max 10 per type (BR-DS-002). |
| US-DM-087 | As an architect, I want to add a data source connection. | AC-6.DS.2: Dialog (700px) with 3 steps: (1) Name, Type (REST/Database/File/Manual), Description; (2) Connection config (varies by type); (3) Field mapping. "Save" / "Save and Test" / "Cancel". On success: DEF-S-100. | -- | DEF-E-111: Duplicate data source name (409). DEF-E-112: Max 10 data sources exceeded (400). DEF-E-113: Mandated data source cannot be modified (403). DEF-S-100: "Data source '{name}' added." | Edge: Type = Manual (no connection config step). |
| AC-6.DS.3 | Edit data source. | Given data source exists, when Edit clicked, then dialog pre-populated. On save: DEF-S-101. | -- | DEF-S-101: "Data source '{name}' updated." | -- |
| AC-6.DS.4 | Delete data source. | Given data source exists, when Delete clicked, then confirmation CD-50. On confirm: DEF-S-102. | CD-50 (DEF-C-050): "Remove Data Source" -- "Remove '{name}' from '{type}'? Already-imported data preserved." Buttons: "Remove" (danger) / "Cancel" | DEF-S-102: "Data source '{name}' removed." | Edge: Delete data source with active sync schedule. |
| AC-6.DS.5 | Test data source connection. | Given connection configured, when "Test" clicked, then loading spinner (up to 10s). On success: status = Connected (green), DEF-S-103. On failure: status = Disconnected (red), DEF-E-110 (persistent). | -- | DEF-E-110: "Connection test failed: {errorMessage}" (persistent). DEF-S-103: "Connection test successful." | Edge: Test timeout (>10s). |
| US-DM-088 | As an architect, I want to schedule periodic data sync. | AC-1: Given schedule "every 6 hours", then periodic sync triggers. | -- | -- | Edge: Schedule on Manual type data source (blocked). |
| US-DM-089 | As an architect, I want to manually execute and preview data source results. | AC-1: Given configured source, when "Execute" clicked, then preview shows first 10 records. AC-2: Given preview, when "Save" clicked, then results mapped to attribute values. | -- | -- | Edge: Execute returns 0 records. |

### Screen: SCR-04 -- Release Management Dashboard (Architect View)

| Story ID | User Story | Acceptance Criteria | Confirmation Dialogs | Error Messages | Edge Cases |
|----------|-----------|-------------------|---------------------|---------------|------------|
| US-DM-063 | As an architect, I want definition changes to create versioned release snapshots. | AC-1: Given master modifies mandated "Server", when saved, then DefinitionRelease created (version, JSON snapshot, changedBy/changedAt) (AC-6.10.1). AC-2: Given release, when queried, then full before/after snapshot available. AC-3: Given release created, then status="draft". | -- | -- | Edge: Non-mandated type changes -- no auto-release (release only for mandated changes). |
| US-DM-064 | As an architect, I want auto-generated release notes. | AC-1: Given new mandatory attribute added, then notes state "Added mandatory attribute 'Serial Number'" (AC-6.10.1). AC-2: Given multiple changes, then all listed. | -- | -- | Edge: Release with 0 changes (should not be possible). |
| US-DM-065 | As an architect, I want to publish a release and notify child tenants. | AC-1: Given "draft" status, when published, then "published" (BR-056). AC-2: Given publication, then alerts sent to all child tenants (BR-050). AC-3: Given publish clicked, then DEF-C-030 shown. | CD-30 (DEF-C-030): "Publish release" -- shows breaking change count. Buttons: "Publish" / "Cancel" | -- | Edge: Publish with 0 child tenants. |
| US-DM-066 | As an architect, I want to view diff between release versions. | AC-1: Given release v4 pending, when diff opened, then added(green)/modified(amber)/removed(red) shown (AC-6.10.5). AC-2: Given added items highlighted green, modified amber, removed red. AC-3: Given two arbitrary versions, then differences shown. | -- | -- | Edge: Diff between v1 and v1 (identical). Accessibility: Color + icon indicators for colorblind. |
| US-DM-071 | As an architect, I want version history view. | AC-1: Given "Server" with 5 releases, then all 5 listed chronologically (author, date, description) (BR-057). AC-2: Given two versions selected, when "Compare" clicked, then diff opens. | -- | -- | Edge: Type with 0 releases. |
| US-DM-072 | As an architect, I want to rollback to a previous version. | AC-1: Given v5 current, when rollback to v3, then definition restored to v3 state and new v6 created (AC-6.10.6). AC-2: Given rollback, then release notes describe it. AC-3: Given confirmation, then DEF-C-031. | CD-31 (DEF-C-031): "Rollback release" Buttons: "Roll Back" / "Cancel" | -- | Edge: Rollback to v1 (first version). |

### Infrastructure Stories (No Direct UI Screen)

| Story ID | User Story | Acceptance Criteria | Confirmation Dialogs | Error Messages | Edge Cases |
|----------|-----------|-------------------|---------------------|---------------|------------|
| US-DM-001 | As a platform admin, I want definition-service accessible through API gateway. | AC-1: Given gateway running, when request to /api/v1/definitions/**, then routed to lb://DEFINITION-SERVICE. AC-2: Given route in RouteConfig.java, then returns 200 for valid endpoints. | -- | -- | -- |
| US-DM-002 | As a developer, I want definition-service in docker-compose. | AC-1: Given docker-compose up, then definition-service on port 8090. AC-2: Given container starts, then registers with Eureka. | -- | -- | -- |
| US-DM-004 | As an architect, I want sort parameter on attribute type list. | AC-1: Given sort=name,asc, then sorted by name. AC-2: Given sort=dataType,asc, then grouped by data type. | -- | -- | -- |
| US-DM-027 | As an architect, I want ARCHITECT role to grant full CRUD access. | AC-1: Given ARCHITECT role, then all CRUD permitted. AC-2: Given USER role, then 403 (AC-6.1.8). AC-3: Given Keycloak ARCHITECT assigned, then role in JWT. | -- | DEF-E-016: Forbidden (403, non-ARCHITECT) | -- |

---

## Persona 3: Tenant Admin (Fiona Shaw) [PER-UX-003]

Role: Manages definitions within her tenant. Receives release alerts. Customizes inherited definitions.

Primary Epics: E4, E5, E6, E8

---

### Screen: SCR-NOTIF -- Notification Dropdown

| Story ID | User Story | Acceptance Criteria | Confirmation Dialogs | Error Messages | Edge Cases |
|----------|-----------|-------------------|---------------------|---------------|------------|
| US-DM-074 | As a tenant admin, I want notifications when new releases are published. | AC-6.NOTIF.1: Given 5 unread, when bell clicked, then overlay: header "Notifications" + "Mark All Read", list of 20 most recent (icon, title, preview 80 chars, relative time, bold for unread), footer "View All". Badge shows "5" (red). AC-6.NOTIF.2: Given "RELEASE_PUBLISHED" notification clicked, then navigates to /admin/definitions/releases/{releaseId}, marked read, badge decrements. AC-6.NOTIF.3: Given 0 notifications, then icon pi-bell-slash, "No notifications", subtext. AC-3: Given alert timing, then delivered within 60 seconds (NFR-013). | -- | -- | Empty state: "No notifications" (pi-bell-slash). Edge: 100+ unread notifications -- badge shows "99+". |

### Screen: SCR-04 / SCR-04-M1 -- Release Management (Tenant Admin View)

| Story ID | User Story | Acceptance Criteria | Confirmation Dialogs | Error Messages | Edge Cases |
|----------|-----------|-------------------|---------------------|---------------|------------|
| US-DM-067 | As a tenant admin, I want to see impact of adopting a release. | AC-1: Given pending release, when impact assessment opened, then affected instance count shown (AC-6.10.2). AC-2: Given local customizations, then conflicts identified and listed. AC-3: Given no conflicts, then "No conflicts" message. | -- | -- | Edge: Impact assessment on type with 0 local instances. |
| US-DM-068 | As a tenant admin, I want to safely adopt a release, preserving local customizations. | AC-1: Given no conflicts, when "Accept and Safe Pull" clicked, then master changes applied, local preserved (AC-6.10.2). AC-2: Given adoption, then status="adopted" for tenant (BR-056). AC-3: Given confirmation, then DEF-C-032. | CD-32 (DEF-C-032): "Adopt release" Buttons: "Adopt" / "Cancel" | -- | Edge: Adopt release with conflicts (merge strategy: mandated wins, local non-mandated preserved). |
| US-DM-069 | As a tenant admin, I want to defer a release with a reason. | AC-1: Given pending release, when "Defer" clicked with reason, then status="deferred" (AC-6.10.3). AC-2: Given deferred, when reminder period elapses, then reminder notification (BR-054). | -- | -- | Edge: Defer same release multiple times. |
| US-DM-070 | As a tenant admin, I want to reject a release with feedback. | AC-1: Given pending release, when "Reject" with reason, then status="rejected" and feedback sent to master (AC-6.10.4). AC-2: Given rejection, when architect views, then reason displayed (BR-055). | -- | -- | Edge: Reject after previously deferring. |

### Screen: SCR-01 -- Object Type List (Tenant Admin View)

| Story ID | User Story | Acceptance Criteria | Confirmation Dialogs | Error Messages | Edge Cases |
|----------|-----------|-------------------|---------------------|---------------|------------|
| US-DM-023 | As a tenant admin, I want to create local object types alongside inherited ones. | AC-1: Given child inherits from master, when creating "Local Device", then state="user_defined" (AC-6.4.2). AC-2: Given list view, then inherited types have badge, local types do not. | -- | -- | Edge: Create local type with same name as inherited (different typeKey). |
| US-DM-024 | As a tenant admin, I want the system to prevent modification of mandated definitions. | AC-1: Given mandated "Server", when delete attempted, then 403 (AC-6.4.3). AC-2: Given UI, then edit/delete buttons disabled. AC-3: Given PUT update called, then 403. | -- | DEF-E-020: Cannot modify mandated item (403). | Edge: Attempt to change name of mandated type via API. |
| US-DM-030 | As a tenant admin, I want inherited definitions to have state "inherited". | AC-1: Given propagated type, then state="inherited". AC-2: Given frontend, then "Inherited" filter option. AC-3: Given BR-005, then "inherited" accepted as valid state. | -- | -- | Edge: Filter by "inherited" with 0 inherited types. |
| US-DM-034 | As a tenant admin, I want clear visual lock indicators on mandated items. | AC-1: Given list view, then lock badge next to mandated name. AC-2: Given detail panel for mandated, then banner "This definition is mandated by the master tenant and cannot be modified" (AC-6.5.2). AC-3: Given attributes tab, then lock icon per mandated row. AC-4: Given screen reader, then aria-label "Mandated by master tenant". | -- | -- | Edge: Type partially mandated (some attributes mandated, some not). |

### Screen: SCR-02-T2 -- Attributes Tab (Tenant Admin View)

| Story ID | User Story | Acceptance Criteria | Confirmation Dialogs | Error Messages | Edge Cases |
|----------|-----------|-------------------|---------------------|---------------|------------|
| US-DM-025 | As a tenant admin, I want to add local attributes to inherited types. | AC-1: Given inherited "Server", when adding "Room Number", then linked with isMasterMandate=false, isLocal=true. AC-2: Given attributes tab, then mandated show lock; local can be removed. | CD-13 (DEF-C-013): "Confirm Remove" -- "Remove {attributeName} from {objectTypeName}?" Buttons: "Remove" / "Cancel" | DEF-E-020: Cannot modify mandated attribute (403) | Edge: Add local attribute with same name as mandated one (allowed, different linkage). |
| US-DM-036 | As a tenant admin, I want system to handle conflicts when master updates customized inherited type. | AC-1: Given customized inherited "Server", when master publishes release, then conflict flagged in impact assessment. AC-2: Given conflict, when viewed, then both versions side by side. AC-3: Given safe pull adopted, then mandated changes applied, local non-conflicting preserved. | -- | -- | Edge: Conflict on attribute that tenant admin retired locally. |

---

## Cross-Cutting Specifications (All Personas)

### Responsive Behavior (AC-NFR-010.1 through AC-NFR-010.3)

| Viewport | Layout | List | Detail | Wizard | Actions |
|----------|--------|------|--------|--------|---------|
| Mobile (<768px) | Single column | Full width, Card view default | Bottom sheet (85% height, draggable handle) | Full-screen | Overflow menu (pi-ellipsis-v) |
| Tablet (768-1024px) | Single column: list above, detail below | Full width, Table or Card | Below list | Dialog at 90% width | Icon buttons with tooltips |
| Desktop (>1024px) | Split-panel: left list (280-400px resizable), right detail (flex) | All views (Table, Card, Graph) | Side panel | 700px dialog | Icons + labels |

### Accessibility (AC-NFR-004.1 through AC-NFR-004.4)

| Area | Requirement |
|------|-------------|
| Keyboard Navigation | Tab order: Search > Status Filter > View Toggle > Create Button > First list item. Arrow Up/Down in list. Enter/Space selects. Escape closes dialogs. |
| Screen Reader | Toasts: aria-live="polite" (success) or "assertive" (errors). Dialogs: role="alertdialog" with aria-describedby. Wizard: aria-label="Create Object Type Wizard", aria-current="step". |
| Focus Management | Dialog open: focus to first element. Tab trapping inside dialog. Dialog close: focus returns to trigger button. |
| Color Contrast | WCAG AAA (7:1 minimum). Body text #3d3a3b on #edebe0: 7.2:1. Error text #6b1f2a: 8.1:1. Muted text enhanced to #5a5758: 5.2:1. |

### Network Failure Handling (AC-6.NET.1, AC-6.NET.2)

| Scenario | Behavior |
|----------|----------|
| Save operation fails (504/503) | Form stays in edit mode (no data loss). DEF-E-050 persistent toast. Save button re-enabled. |
| Wizard submission fails | Wizard stays open on Review step. DEF-E-050 toast. Create button re-enabled. Wizard does NOT close or reset. |

---

## Complete Confirmation Dialog Inventory (20 Dialogs)

| ID | Code | Trigger | Title | Body Template | Primary Button | Secondary | Status |
|----|------|---------|-------|--------------|----------------|-----------|--------|
| CD-01 | DEF-C-001 | Activate ObjectType | "Confirm Activate" | "Activate '{name}'?" | "Activate" | "Cancel" | [PLANNED] |
| CD-02 | DEF-C-002 | Hold ObjectType | "Confirm Hold" | "Put '{name}' on hold?" | "Hold" | "Cancel" | [PLANNED] |
| CD-03 | DEF-C-003 | Resume ObjectType | "Confirm Resume" | "Resume '{name}'?" | "Resume" | "Cancel" | [PLANNED] |
| CD-04 | DEF-C-004 | Retire ObjectType | "Confirm Retire" | "Retire '{name}'? {instanceCount} instances preserved." | "Retire" | "Cancel" | [PLANNED] |
| CD-05 | DEF-C-005 | Reactivate ObjectType | "Confirm Reactivate" | "Reactivate '{name}'?" | "Reactivate" | "Cancel" | [PLANNED] |
| CD-06 | DEF-C-006 | Customize Default | "Confirm Customize" | "Editing will change state to customized." | "Edit" | "Cancel" | [PLANNED] |
| CD-07 | DEF-C-007 | Restore Default | "Confirm Restore" | "Restore '{name}' to default? Customizations lost." | "Restore" | "Cancel" | [IMPLEMENTED] |
| CD-08 | DEF-C-008 | Delete ObjectType | "Confirm Delete" | "Delete '{name}'? Cannot be undone." | "Delete" (danger) | "Cancel" | [IMPLEMENTED] |
| CD-09 | DEF-C-009 | Duplicate ObjectType | "Confirm Duplicate" | "Create copy of '{name}'?" | "Duplicate" | "Cancel" | [IMPLEMENTED] |
| CD-10 | DEF-C-010 | Activate Attribute | "Confirm Activate" | "Activate '{attr}' on '{type}'?" | "Activate" | "Cancel" | [PLANNED] |
| CD-11 | DEF-C-011 | Retire Attribute | "Confirm Retire" | "Retire '{attr}'? {instanceCount} instances preserved." | "Retire" | "Cancel" | [PLANNED] |
| CD-12 | DEF-C-012 | Reactivate Attribute | "Confirm Reactivate" | "Reactivate '{attr}'?" | "Reactivate" | "Cancel" | [PLANNED] |
| CD-13 | DEF-C-013 | Unlink Attribute | "Confirm Remove" | "Remove '{attr}' from '{type}'?" | "Remove" | "Cancel" | [PLANNED] |
| CD-14 | DEF-C-014 | Delete Attribute Type | "Delete Attribute Type" | "Permanently delete '{attr}'? Cannot be undone." | "Delete" (danger) | "Cancel" | [PLANNED] |
| CD-30 | DEF-C-030 | Publish Release | "Publish Release" | Shows breaking change count | "Publish" | "Cancel" | [PLANNED] |
| CD-31 | DEF-C-031 | Rollback Release | "Rollback Release" | -- | "Roll Back" | "Cancel" | [PLANNED] |
| CD-32 | DEF-C-032 | Adopt Release | "Adopt Release" | -- | "Adopt" | "Cancel" | [PLANNED] |
| CD-40 | DEF-C-040 | Flag Governance Violation | "Flag Governance Violation" | "Flag {tenant}'s '{type}' as non-compliant? Adds violation to audit trail." | "Flag" | "Cancel" | [PLANNED] |
| CD-41 | DEF-C-041 | Push Mandate Update | "Push Mandate Updates" | "Push {N} mandate updates to {M} child tenants?" | "Push to All" / "Push to Selected" | "Cancel" | [PLANNED] |
| CD-42 | DEF-C-042 | Confirm Propagation | "Confirm Propagation" | "Propagate {N} definitions to '{tenant}'?" | "Propagate" | "Cancel" | [PLANNED] |
| CD-43 | DEF-C-043 | Remove Workflow | "Remove Workflow" | "Remove '{workflow}' from '{type}'? Instances remain in current state." | "Remove" (danger) | "Cancel" | [PLANNED] |
| CD-50 | DEF-C-050 | Remove Data Source | "Remove Data Source" | "Remove '{name}' from '{type}'? Already-imported data preserved." | "Remove" (danger) | "Cancel" | [PLANNED] |
| CD-60 | DEF-C-060 | Overwrite on Import | "Confirm Overwrite" | "Overwrite existing '{type}'? Current definition replaced." | "Overwrite" (danger) | "Cancel" | [PLANNED] |

**Note:** Connection lifecycle dialogs (DEF-C-020 through DEF-C-022) are referenced in US-DM-016 but not enumerated in the SRS CD inventory. They follow the same pattern as attribute lifecycle dialogs (CD-10 through CD-12).

---

## Complete Error Code Registry (63 Error Codes)

### Object Type Errors (DEF-E-001 to DEF-E-019)

| Code | Name | HTTP | Description |
|------|------|------|-------------|
| DEF-E-002 | Duplicate TypeKey | 409 | TypeKey already exists in tenant |
| DEF-E-003 | Duplicate Code | 409 | Code already exists in tenant |
| DEF-E-004 | Name Required | 400 | Name cannot be blank |
| DEF-E-005 | Name Too Long | 400 | Name exceeds 255 chars |
| DEF-E-006 | TypeKey Too Long | 400 | TypeKey exceeds 100 chars |
| DEF-E-007 | Code Too Long | 400 | Code exceeds 20 chars |
| DEF-E-008 | Invalid Status | 400 | Status not in enum |
| DEF-E-009 | Invalid State | 400 | State not in enum |
| DEF-E-011 | Naming Conflict on Reactivation | 400 | -- |
| DEF-E-012 | Invalid Lifecycle Transition | 400 | -- |
| DEF-E-015 | Missing Tenant Context | 400 | -- |
| DEF-E-016 | Forbidden | 403 | Insufficient permissions |
| DEF-E-017 | Concurrent Edit Conflict | 409 | Modified by another user |
| DEF-E-019 | Invalid Icon Color | 400 | Pattern mismatch |

### Attribute Errors (DEF-E-020 to DEF-E-029)

| Code | Name | HTTP | Description |
|------|------|------|-------------|
| DEF-E-020 | Cannot Modify Mandated | 403 | Mandated by master tenant |
| DEF-E-021 | Attribute Type Not Found | 404 | -- |
| DEF-E-023 | AttributeKey Required | 400 | -- |
| DEF-E-024 | Invalid DataType | 400 | Not in enum |
| DEF-E-026 | Cannot Unlink System Default | 403 | -- |
| DEF-E-027 | Cannot Delete Linked AttributeType | 409 | Linked to {count} object types |
| DEF-E-028 | Duplicate Attribute Key | 409 | -- |
| DEF-E-029 | AttributeType Not Found | 404 | -- |

### Connection Errors (DEF-E-030 to DEF-E-033)

| Code | Name | HTTP | Description |
|------|------|------|-------------|
| DEF-E-030 | Cannot Remove Mandated Connection | 403 | -- |
| DEF-E-032 | Invalid Cardinality | 400 | Not in enum |
| DEF-E-033 | Cross-Tenant Connection | 400 | Source/target must be same tenant |

### API/General Errors

| Code | Name | HTTP | Description |
|------|------|------|-------------|
| DEF-E-050 | API Error / Network Failure | 500/504/503 | "Unable to complete request. Check connection and try again." (persistent toast) |

### Governance Errors (DEF-E-063 to DEF-E-065)

| Code | Name | HTTP | Description |
|------|------|------|-------------|
| DEF-E-063 | Duplicate Workflow | 409 | Already attached |
| DEF-E-064 | Operation Update Failed | 500 | -- |
| DEF-E-065 | Max Workflows Exceeded | 400 | Maximum 5 |
| DEF-E-060 | Load Governance Failed | 500 | Error banner with Retry |

### Maturity Errors

| Code | Name | HTTP | Description |
|------|------|------|-------------|
| DEF-E-071 | Invalid Axis Weights | 400 | Must sum to 100 |

### Measure Errors (DEF-E-081 to DEF-E-087)

| Code | Name | HTTP | Description |
|------|------|------|-------------|
| DEF-E-081 | Duplicate Category Name | 409 | -- |
| DEF-E-082 | Cannot Delete Category With Measures | 409 | -- |
| DEF-E-084 | Duplicate Measure Name | 409 | -- |
| DEF-E-085 | Invalid Threshold Config | 400 | Warning >= critical |
| DEF-E-086 | Invalid Formula | 400 | Syntax error |
| DEF-E-087 | Measure Missing Mandatory Fields | 400 | -- |

### Inheritance Errors (DEF-E-090 to DEF-E-096)

| Code | Name | HTTP | Description |
|------|------|------|-------------|
| DEF-E-090 | IS_SUBTYPE_OF Depth Exceeded | 400 | Max depth 5 |
| DEF-E-091 | Circular Reference | 400 | Would create cycle |
| DEF-E-093 | Cannot Modify Inherited Property | 403 | Only overridable properties allowed |
| DEF-E-094 | AttributeKey Immutable | 400 | Cannot change after creation |
| DEF-E-095 | DataType Immutable | 400 | Cannot change after creation |
| DEF-E-096 | Invalid Validation Rules | 400 | Must be valid JSON |

### Locale Errors (DEF-E-100 to DEF-E-104)

| Code | Name | HTTP | Description |
|------|------|------|-------------|
| DEF-E-100 | Duplicate Locale Code | 409 | -- |
| DEF-E-101 | Locale Has Unfilled Values | 409 | Cannot deactivate |
| DEF-E-102 | Invalid Locale Code | 400 | Not BCP 47 |
| DEF-E-103 | Cannot Delete Last Locale | 409 | -- |
| DEF-E-104 | Locale Not Found | 404 | -- |

### Data Source Errors (DEF-E-110 to DEF-E-113)

| Code | Name | HTTP | Description |
|------|------|------|-------------|
| DEF-E-110 | Connection Test Failed | 400 | -- |
| DEF-E-111 | Duplicate Data Source Name | 409 | -- |
| DEF-E-112 | Max Data Sources Exceeded | 400 | Maximum 10 |
| DEF-E-113 | Mandated Data Source | 403 | -- |

### Import/Export Errors (DEF-E-120 to DEF-E-124)

| Code | Name | HTTP | Description |
|------|------|------|-------------|
| DEF-E-120 | File Too Large | 400 | Exceeds 10MB |
| DEF-E-121 | Invalid JSON | 400 | Parse error |
| DEF-E-122 | Schema Mismatch | 400 | Missing fields |
| DEF-E-123 | Import Failed | 500 | No changes applied |
| DEF-E-124 | Unsupported Format | 400 | -- |

### Propagation Errors (DEF-E-130 to DEF-E-133)

| Code | Name | HTTP | Description |
|------|------|------|-------------|
| DEF-E-130 | Target Tenant Not Found | 404 | -- |
| DEF-E-131 | Partial Propagation Failure | 500 | -- |
| DEF-E-132 | Duplicate in Target | 409 | -- |
| DEF-E-133 | Not Master Tenant | 403 | -- |

---

## Complete Warning Code Registry (9 Codes)

| Code | Name | Description |
|------|------|-------------|
| DEF-W-001 | Concurrent Edit Warning | "Modified by {user} at {timestamp}. Your changes may overwrite." |
| DEF-W-004 | Maturity Below Threshold | Instance below threshold -- flagged |
| DEF-W-010 | Local Override Conflict | "Attribute '{attr}' already exists locally. Local takes precedence." |
| DEF-W-011 | Parent Change Impact | "This change affects {childCount} subtypes: {childNames}." |
| DEF-W-012 | Partial Propagation | "Propagated to {success} of {total} subtypes. Failed: {failed}." |

---

## Complete Success Message Registry (35 Codes)

| Code | Name | Description |
|------|------|-------------|
| DEF-S-001 | ObjectType Created | Success toast (3s) |
| DEF-S-002 | ObjectType Updated | Success toast (3s) |
| DEF-S-003 | ObjectType Deleted | Success toast (3s) |
| DEF-S-004 | ObjectType Duplicated | Success toast (3s) |
| DEF-S-005 | ObjectType Restored | Success toast (3s) |
| DEF-S-006 | Status Changed | Success toast (3s) |
| DEF-S-013 | AttributeType Updated | -- |
| DEF-S-014 | AttributeType Deleted | -- |
| DEF-S-023 | Connection Updated | -- |
| DEF-S-040 | Maturity Config Saved | -- |
| DEF-S-050 | Locale Created | -- |
| DEF-S-051 | Locale Updated | -- |
| DEF-S-052 | Locale Deleted | -- |
| DEF-S-060 | Category Created | -- |
| DEF-S-061 | Category Updated | -- |
| DEF-S-062 | Category Deleted | -- |
| DEF-S-070 | Measure Created | -- |
| DEF-S-071 | Measure Updated | -- |
| DEF-S-072 | Measure Deleted | -- |
| DEF-S-080 | Workflow Attached | -- |
| DEF-S-081 | Operations Updated | -- |
| DEF-S-082 | Workflow Updated | -- |
| DEF-S-083 | Workflow Removed | -- |
| DEF-S-090 | Graph Exported | "Graph exported as {format}" |
| DEF-S-091 | Override Saved | "Attribute '{attr}' override saved" |
| DEF-S-092 | Subtype Set | "'{child}' is now a subtype of '{parent}'" |
| DEF-S-100 | Data Source Added | -- |
| DEF-S-101 | Data Source Updated | -- |
| DEF-S-102 | Data Source Removed | -- |
| DEF-S-103 | Connection Test Success | -- |
| DEF-S-110 | Export Success | "Definitions exported successfully" |
| DEF-S-111 | Import Success | "{count} definitions imported successfully" |

---

## Empty State Specifications (11 Screens/Tabs)

| Screen/Tab | Icon | Heading | Subtext | Action Button |
|------------|------|---------|---------|---------------|
| SCR-01 (Object Type List) | pi-box | "No object types match your criteria." | "Create your first object type." | "New Type" (visible) |
| SCR-02-T2 (Attributes) | pi-list | "No attributes linked" | "Link attributes from the library or create new ones." | "Add Attribute" |
| SCR-02-T3 (Connections) | pi-sitemap | "No connections defined" | "Define relationships to other object types." | "Add Connection" |
| SCR-02-T4 (Governance) | pi-cog | "No governance configuration" | "Configure workflows and operation settings." | "Add Workflow" |
| SCR-02-T5 (Maturity) | pi-chart-bar | "No maturity configuration" | "Configure the four-axis maturity model." | "Configure Maturity" |
| SCR-02-T6 (Locale) | pi-globe | "No locales configured" | "Add language locales for multilingual support." | "Add Locale" |
| SCR-02-T6M (Measures Cat) | pi-folder | "No measure categories" | "Create categories to organize measures." | "Add Category" |
| SCR-02-T7M (Measures) | pi-chart-line | "No measures defined" | "Define measures with targets and thresholds." | "Add Measure" |
| SCR-04 (Releases) | pi-send | "No releases created" | "Create your first definition release." | "Create Release" |
| SCR-05 (Maturity Dashboard) | pi-chart-bar | "No maturity data available" | "Configure maturity on object types first." | "Go to Definitions" (link) |
| SCR-AI (AI Insights) | pi-sparkles | "No insights available" | "AI analysis runs when enough definitions exist (min 5 types)." | None |
| SCR-NOTIF (Notifications) | pi-bell-slash | "No notifications" | "You will be notified of release updates and governance alerts." | None |
| SCR-GV (Graph) | pi-sitemap | "No object types to visualize" | "Create object types to see their relationship graph." | "Create Object Type" |

---

## Audit Report Discrepancies to Account For (15 from AUDIT-REPORT-2026-03-10.md)

| ID | Category | Severity | Description | Impact on Inventory |
|----|----------|----------|-------------|-------------------|
| A-1 | Persona names | HIGH | UX Spec uses Saeed/Nadia/Fatima instead of Sam/Nicole/Fiona | Use PRD canonical names (Sam/Nicole/Fiona) throughout |
| A-2 | Persona names | HIGH | Doc 09 mixes both name sets internally | Use PRD canonical names |
| A-3 | Persona reference | MEDIUM | Doc 10 still references removed Quality Manager persona | Persona absorbed into Architect and Super Admin |
| A-5 | Persona short names | MEDIUM | UX Spec parenthetical names inconsistent | Use PRD short names |
| B-1 | Lifecycle terminology | HIGH | Doc 09 Journey 2.3 uses "deactivate" and "Active/Inactive" | Correct: use "retire" and "planned/active/retired" per AP-5 |
| B-2 | State machine | HIGH | Doc 09 state machine uses Active/Inactive instead of planned/active/retired | Correct: three-state lifecycle per AP-5 |
| B-3 | Toast text | MEDIUM | Doc 09 toast uses "deactivated" | Correct: "retired" with message code DEF-S-012 |
| B-4 | Confirmation dialogs | MEDIUM | Doc 09 CD-04, CD-05, CD-13 use "deactivate" | Correct: "retire" terminology |
| B-5 | Test scenarios | MEDIUM | Doc 09 QA scenarios use "activeStatus" field name | Correct: "lifecycleStatus" |
| B-6 | Emotional curve | LOW | Doc 09 uses "Bulk Deactivate" | Correct: "Bulk Retire" |
| C-1 | Message codes | MEDIUM | Doc 09 does not reference any DEF-* message codes | All UI text should reference message codes per AP-4 |
| D-1 | AP references | LOW | Doc 09 does not reference AP-1 through AP-5 | Journey 2.3 involves AP-5 directly |

**Resolution:** This inventory uses the corrected terminology (planned/active/retired, lifecycleStatus, "retire" not "deactivate") and PRD canonical persona names throughout.

---

## Stories with NO Corresponding Screen in Current Prototype

The following stories require screens that are currently [PLANNED] and have no implementation:

| Story ID | Required Screen | Screen Status |
|----------|----------------|---------------|
| US-DM-021 through US-DM-030 | SCR-01 (cross-tenant toggle), SCR-PROP | [PLANNED] |
| US-DM-031 through US-DM-036 | SCR-01/SCR-02 (lock icons, mandate toggles) | [PLANNED] enhancements to [IMPLEMENTED] screens |
| US-DM-037 through US-DM-043 | SCR-02-T4 (Governance Tab) | [PLANNED] |
| US-DM-044 through US-DM-054 | SCR-02-T5 (Maturity Tab), SCR-05 (Dashboard) | [PLANNED] |
| US-DM-055 through US-DM-062 | SCR-06 (Locale Management), SCR-02-T6 (Locale Tab) | [PLANNED] |
| US-DM-063 through US-DM-074 | SCR-04 (Release Dashboard), SCR-04-M1, SCR-NOTIF | [PLANNED] |
| US-DM-075 through US-DM-080 | SCR-GV (Graph Visualization) | [PLANNED] |
| US-DM-081 through US-DM-085 | SCR-EXPORT, SCR-01 (import dialog) | [PLANNED] |
| US-DM-086 through US-DM-089 | SCR-02-T5DS (Data Sources Tab) | [PLANNED] |
| US-DM-090 through US-DM-095 | SCR-02-T6M, SCR-02-T7M (Measures) | [PLANNED] |
| US-DM-096 through US-DM-097 | SCR-AI (AI Insights Panel) | [PLANNED] |

**Screens that ARE implemented and have stories in this inventory:**

| Screen | Status | Stories |
|--------|--------|---------|
| SCR-01 (Object Type List) | [IMPLEMENTED] | US-DM-003, US-DM-007 (base CRUD) |
| SCR-02-T1 (General Tab) | [IMPLEMENTED] | General view/edit |
| SCR-02-T2 (Attributes Tab) | [IMPLEMENTED] | US-DM-008 through US-DM-015a (base attribute linking) |
| SCR-02-T3 (Connections Tab) | [IMPLEMENTED] | US-DM-016 through US-DM-020 (base connection management) |
| SCR-03 (Create Wizard) | [IMPLEMENTED] | US-DM-005 (system defaults), US-DM-097 (AI suggestions) |

---

**Document prepared by:** BA Agent (BA-PRINCIPLES.md v1.1.0)
**Total Stories Inventoried:** 97
**Total Confirmation Dialogs:** 20 (3 implemented, 17 planned) + connection lifecycle dialogs (DEF-C-020/021/022)
**Total Error Codes:** 63
**Total Success Codes:** 35
**Total Warning Codes:** 9
