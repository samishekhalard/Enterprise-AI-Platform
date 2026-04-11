# R02 Complete Story Inventory

**Date:** 2026-03-23
**Scope:** Tenant Management -- all user stories
**Pattern:** `US-TM-{###}`
**Role Model:** ADMIN + tenant type context (no SUPER_ADMIN)
**Traceability:** Each story maps to screens, interactions, API groups, error codes, and messages

---

## Stories

### US-TM-01: Create New Tenant

| Field | Content |
|-------|---------|
| **ID** | US-TM-01 |
| **Title** | Create New Tenant |
| **As a** | ADMIN in MASTER tenant |
| **I want to** | create a new tenant through a single creation form |
| **So that** | new organizations can be onboarded |
| **Acceptance Criteria** | 1. Single form (no stepper): Name, Domain, Tenant Admin Email, License Allocation. 2. Slug auto-generated from name (not shown in form, not editable). 3. No duplicate names or domains allowed. 4. Provisioning feedback with 6 steps: Master PG, Per-tenant PG, Keycloak Realm + Admin User, Per-tenant Neo4j, Defaults, Activate. 5. On success, navigate to the new tenant's Fact Sheet. 6. On failure at any provisioning step, display the failing step and allow retry. |
| **Screens** | Tenant List (entry point), Create Tenant Form (modal/dialog), Fact Sheet (landing after create) |
| **API Group** | `POST /api/tenants`, `GET /api/tenants/{id}/provisioning-status` |
| **Messages** | TEN-S-001 (created), TEN-E-002 (duplicate/invalid name), TEN-E-004 (provisioning failure), TEN-E-009 (invalid domain), TEN-E-010 (domain already claimed), TEN-E-016 (invalid admin email), TEN-I-001 (provisioning in progress) |
| **Phase** | 1 |
| **Story Points** | 8 |
| **Status** | `[AS-IS]` basic create exists, `[TARGET]` single form + provisioning flow |

---

### US-TM-02: View and Edit Tenant Details

| Field | Content |
|-------|---------|
| **ID** | US-TM-02 |
| **Title** | View and Edit Tenant Details |
| **As a** | ADMIN |
| **I want to** | view and edit tenant details in the fact sheet banner |
| **So that** | I can manage tenant identity and settings |
| **Acceptance Criteria** | 1. Banner displays name, slug, type, status, and KPIs (user count, integration count, last activity). 2. Inline edit for name and editable settings. 3. ADMIN(MASTER) can edit any tenant. 4. ADMIN(REGULAR) can edit own tenant only. 5. ADMIN(DOMINANT) can edit own tenant only. 6. Changes saved optimistically with rollback on failure. |
| **Screens** | Fact Sheet Banner |
| **API Group** | `GET /api/tenants/{id}`, `PATCH /api/tenants/{id}` |
| **Messages** | TEN-S-002 (updated), TEN-E-005 (unauthorized), TEN-E-006 (validation failure) |
| **Phase** | 1 |
| **Story Points** | 8 |
| **Status** | `[AS-IS]` basic view exists, `[TARGET]` full banner with KPIs |

---

### US-TM-03: View Tenant Fact Sheet

| Field | Content |
|-------|---------|
| **ID** | US-TM-03 |
| **Title** | View Tenant Fact Sheet |
| **As a** | ADMIN |
| **I want to** | view the complete tenant fact sheet with all 8 tabs |
| **So that** | I can manage all aspects of a tenant from one place |
| **Acceptance Criteria** | 1. Fact sheet consists of a banner hero section and 8 tabs: Users, Branding, Integrations, Dictionary, Agents, Studio, Audit Log, Health Checks. 2. Tab visibility governed by role + tenantType matrix. 3. Each tab badge shows the count of related entities. 4. Empty tabs display an empty state with a creation prompt where applicable. 5. ADMIN(MASTER) can navigate to any tenant's fact sheet. 6. ADMIN(REGULAR) can navigate to own tenant's fact sheet only. 7. ADMIN(DOMINANT) can navigate to own tenant's fact sheet only. 8. Tabs load content lazily on first activation. |
| **Screens** | Fact Sheet (all tabs) |
| **API Group** | `GET /api/tenants/{id}` (banner), `GET /api/tenants/{id}/{tabEntity}` (per tab) |
| **Messages** | None specific -- delegated to individual tab stories |
| **Phase** | 1 (shell + banner), 2 (tab content) |
| **Story Points** | 21 |
| **Status** | `[AS-IS]` 5-tab hardcoded modal, `[TARGET]` 8-tab fact sheet |

---

### US-TM-04: Manage Tenant Lifecycle

| Field | Content |
|-------|---------|
| **ID** | US-TM-04 |
| **Title** | Manage Tenant Lifecycle |
| **As a** | ADMIN in MASTER tenant |
| **I want to** | change a tenant's lifecycle state |
| **So that** | I can activate, suspend, archive, restore, or permanently delete tenants |
| **Acceptance Criteria** | 1. Valid transitions: PROVISIONING to ACTIVE, ACTIVE to SUSPENDED, SUSPENDED to ACTIVE, ACTIVE to ARCHIVED, SUSPENDED to ARCHIVED, ARCHIVED to SUSPENDED (restore), ARCHIVED to DELETED (permanent). 2. MASTER tenant is protected from suspension, archival, and deletion (TEN-E-008). 3. Confirmation dialogs required for destructive actions (suspend, archive, delete). 4. Suspending a tenant terminates all active user sessions. 5. Archiving a tenant enforces 90-day data retention before deletion is permitted. 6. Invalid transitions are rejected with appropriate error messaging. |
| **Screens** | Lifecycle Dialog (triggered from Banner actions menu) |
| **API Group** | `PATCH /api/tenants/{id}/lifecycle` |
| **Messages** | TEN-S-003 (activated), TEN-S-004 (suspended), TEN-S-005 (archived), TEN-S-006 (restored), TEN-S-013 (deleted), TEN-W-003 (sessions will be terminated), TEN-W-004 (data retention warning), TEN-C-001 (confirm suspend), TEN-C-002 (confirm archive), TEN-C-003 (confirm delete), TEN-C-007 (confirm restore), TEN-E-007 (invalid transition), TEN-E-008 (master tenant protected) |
| **Phase** | 1 |
| **Story Points** | 13 |
| **Status** | `[AS-IS]` basic status field exists, `[TARGET]` full state machine with dialogs |

---

### US-TM-05: Manage Tenant Branding

| Field | Content |
|-------|---------|
| **ID** | US-TM-05 |
| **Title** | Manage Tenant Branding |
| **As a** | ADMIN |
| **I want to** | customize tenant branding (logo, colors, typography) |
| **So that** | the tenant has its own visual identity |
| **Acceptance Criteria** | 1. Upload logo in PNG or SVG format, maximum 2 MB, minimum 64x64 pixels. 2. Select color palette: primary, secondary, accent. 3. Live preview of branding changes before publishing. 4. Draft/publish workflow -- changes are saved as draft until explicitly published. 5. Publishing replaces the active branding for all tenant users. 6. ADMIN(MASTER) can edit branding for any tenant. 7. ADMIN(REGULAR) and ADMIN(DOMINANT) can edit branding for own tenant only. |
| **Screens** | Branding Tab |
| **API Group** | `GET /api/tenants/{id}/branding`, `PUT /api/tenants/{id}/branding`, `POST /api/tenants/{id}/branding/publish` |
| **Messages** | TEN-S-007 (branding saved as draft), TEN-S-008 (branding published), TEN-W-005 (unsaved branding changes), TEN-C-004 (confirm publish), TEN-E-005 (unauthorized), TEN-E-012 (invalid file format or size) |
| **Phase** | 2 |
| **Story Points** | 13 |
| **Status** | `[AS-IS]` basic branding exists, `[TARGET]` full draft/publish flow |

---

### US-TM-06: Search and Filter Tenant List

| Field | Content |
|-------|---------|
| **ID** | US-TM-06 |
| **Title** | Search and Filter Tenant List |
| **As a** | ADMIN in MASTER tenant |
| **I want to** | search, filter, and sort the tenant list |
| **So that** | I can quickly find tenants |
| **Acceptance Criteria** | 1. Full-text search across name, slug, and domain. 2. Filter by type: MASTER, REGULAR, DOMINANT. 3. Filter by status: all lifecycle states (PROVISIONING, ACTIVE, SUSPENDED, ARCHIVED). 4. Filter by date range (created date). 5. Sort by name, created date, status, or user count. 6. Server-side pagination with configurable page size. 7. Result count displayed. 8. Empty state when no results match filters. |
| **Screens** | Tenant List |
| **API Group** | `GET /api/tenants?search=&type=&status=&sort=&page=&size=` |
| **Messages** | TEN-I-002 (no tenants match filters) |
| **Phase** | 1 |
| **Story Points** | 8 |
| **Status** | `[AS-IS]` basic list exists, `[TARGET]` full search/filter/sort |

---

### US-TM-07: Manage Tenant Integrations

| Field | Content |
|-------|---------|
| **ID** | US-TM-07 |
| **Title** | Manage Tenant Integrations |
| **As a** | ADMIN |
| **I want to** | configure identity provider integrations for a tenant |
| **So that** | users can authenticate via external providers |
| **Acceptance Criteria** | 1. Add, edit, and remove integrations (SAML, OIDC, LDAP). 2. Connection test validates provider reachability and configuration. 3. Enable/disable toggle per integration without deleting configuration. 4. Provider-specific configuration forms with field-level validation. 5. ADMIN(MASTER) can manage integrations for any tenant. 6. ADMIN(REGULAR) and ADMIN(DOMINANT) can manage integrations for own tenant only. |
| **Screens** | Integrations Tab |
| **API Group** | `GET /api/tenants/{id}/integrations`, `POST /api/tenants/{id}/integrations`, `PUT /api/tenants/{id}/integrations/{intId}`, `DELETE /api/tenants/{id}/integrations/{intId}` |
| **Messages** | TEN-S-009 (integration saved), TEN-E-005 (unauthorized), TEN-E-013 (connection test failed), TEN-E-014 (invalid provider configuration) |
| **Phase** | 2 |
| **Story Points** | 13 |
| **Status** | `[TARGET]` |

---

### US-TM-08: Manage Tenant Users

| Field | Content |
|-------|---------|
| **ID** | US-TM-08 |
| **Title** | Manage Tenant Users |
| **As a** | ADMIN |
| **I want to** | view, invite, and manage users within a tenant |
| **So that** | I can control access |
| **Acceptance Criteria** | 1. User list with search and filter (by role, status). 2. Invite users by email address. 3. Assign and change roles for existing users. 4. Remove users with confirmation. 5. License seat validation -- block invite when seats are exhausted. 6. ADMIN(MASTER) can manage users for any tenant. 7. ADMIN(REGULAR) and ADMIN(DOMINANT) can manage users for own tenant only. |
| **Screens** | Users Tab |
| **API Group** | `GET /api/tenants/{id}/users`, `POST /api/tenants/{id}/users/invite`, `DELETE /api/tenants/{id}/users/{userId}` |
| **Messages** | TEN-S-010 (user invited), TEN-W-001 (license seats nearly exhausted), TEN-C-005 (confirm user removal), TEN-E-005 (unauthorized), TEN-E-011 (license seats exhausted) |
| **Phase** | 2 |
| **Story Points** | 13 |
| **Status** | `[TARGET]` |

---

### US-TM-09: Manage Tenant Dictionary

| Field | Content |
|-------|---------|
| **ID** | US-TM-09 |
| **Title** | Manage Tenant Dictionary |
| **As a** | ADMIN |
| **I want to** | manage the object type dictionary for a tenant |
| **So that** | the tenant's data model can be customized |
| **Acceptance Criteria** | 1. View seeded object types inherited from master. 2. Add tenant-specific object types. 3. Edit attributes on tenant-specific types. 4. Inherited (seeded) types are read-only at the tenant level. 5. Publish changes to make them effective. 6. ADMIN(MASTER) can manage dictionaries for any tenant. 7. ADMIN(REGULAR) and ADMIN(DOMINANT) can manage dictionaries for own tenant only. |
| **Screens** | Dictionary Tab |
| **API Group** | `GET /api/tenants/{id}/object-types`, `POST /api/tenants/{id}/object-types`, `PUT /api/tenants/{id}/object-types/{typeId}` |
| **Messages** | TEN-S-011 (dictionary updated), TEN-C-006 (confirm publish), TEN-E-005 (unauthorized) |
| **Phase** | 3 |
| **Story Points** | 13 |
| **Status** | `[TARGET]` |

---

### US-TM-10: Manage Tenant Agents

| Field | Content |
|-------|---------|
| **ID** | US-TM-10 |
| **Title** | Manage Tenant Agents |
| **As a** | ADMIN |
| **I want to** | deploy and manage AI agents for a tenant |
| **So that** | tenants can use automated capabilities |
| **Acceptance Criteria** | 1. View list of deployed agents for the tenant. 2. Deploy agents from the master agent catalog. 3. Configure per-tenant agent settings. 4. Enable/disable agents without removing configuration. 5. ADMIN(MASTER) can manage agents for any tenant. 6. ADMIN(REGULAR) and ADMIN(DOMINANT) can manage agents for own tenant only. |
| **Screens** | Agents Tab |
| **API Group** | `GET /api/tenants/{id}/agents`, `POST /api/tenants/{id}/agents/deploy` |
| **Messages** | TEN-S-012 (agent deployed), TEN-E-005 (unauthorized) |
| **Phase** | 3 |
| **Story Points** | 8 |
| **Status** | `[TARGET]` |

---

### US-TM-11: View Tenant Studio

| Field | Content |
|-------|---------|
| **ID** | US-TM-11 |
| **Title** | View Tenant Studio |
| **As a** | ADMIN |
| **I want to** | access the studio workspace for a tenant |
| **So that** | I can manage process definitions and workflows |
| **Acceptance Criteria** | 1. View list of process definitions scoped to the tenant. 2. Link to studio editor opens in context of the selected tenant. 3. Workspace is tenant-scoped -- no cross-tenant data leakage. 4. ADMIN(MASTER) can access studio for any tenant. 5. ADMIN(REGULAR) and ADMIN(DOMINANT) can access studio for own tenant only. |
| **Screens** | Studio Tab |
| **API Group** | `GET /api/tenants/{id}/studio` |
| **Messages** | None specific |
| **Phase** | 3 |
| **Story Points** | 5 |
| **Status** | `[TARGET]` |

---

### US-TM-12: View Tenant Audit Log

| Field | Content |
|-------|---------|
| **ID** | US-TM-12 |
| **Title** | View Tenant Audit Log |
| **As a** | ADMIN |
| **I want to** | view the audit log for a tenant |
| **So that** | I can track all administrative actions |
| **Acceptance Criteria** | 1. Chronological event list with newest first. 2. Filter by action type (create, update, delete, lifecycle change). 3. Filter by user who performed the action. 4. Filter by date range. 5. Event detail expansion shows full payload diff. 6. Export audit log as CSV. 7. ADMIN(MASTER) can view audit logs for any tenant. 8. ADMIN(REGULAR) and ADMIN(DOMINANT) can view audit logs for own tenant only. |
| **Screens** | Audit Log Tab |
| **API Group** | `GET /api/tenants/{id}/audit-log?action=&user=&from=&to=` |
| **Messages** | TEN-I-006 (no audit events match filters) |
| **Phase** | 2 |
| **Story Points** | 8 |
| **Status** | `[TARGET]` |

---

### US-TM-13: View Tenant Health Checks

| Field | Content |
|-------|---------|
| **ID** | US-TM-13 |
| **Title** | View Tenant Health Checks |
| **As a** | ADMIN in MASTER tenant |
| **I want to** | view health check status for a tenant |
| **So that** | I can monitor infrastructure health |
| **Acceptance Criteria** | 1. Health dashboard per tenant showing: database connectivity, Keycloak realm status, Neo4j graph status, service endpoint availability. 2. Status indicators: healthy, degraded, down. 3. Auto-refresh at configurable interval. 4. Historical health data for the last 24 hours. 5. Only ADMIN(MASTER) can view health checks (not visible to REGULAR or DOMINANT). |
| **Screens** | Health Checks Tab |
| **API Group** | `GET /api/tenants/{id}/health` |
| **Messages** | TEN-W-006 (degraded component detected), TEN-E-015 (health check endpoint unreachable) |
| **Phase** | 3 |
| **Story Points** | 8 |
| **Status** | `[TARGET]` |

---

## Summary Table

| ID | Title | Phase | SP | Status |
|----|-------|-------|----|--------|
| US-TM-01 | Create New Tenant | 1 | 13 | `[AS-IS]` partial |
| US-TM-02 | View and Edit Tenant Details | 1 | 8 | `[AS-IS]` partial |
| US-TM-03 | View Tenant Fact Sheet | 1-2 | 21 | `[AS-IS]` partial |
| US-TM-04 | Manage Tenant Lifecycle | 1 | 13 | `[AS-IS]` partial |
| US-TM-05 | Manage Tenant Branding | 2 | 13 | `[AS-IS]` partial |
| US-TM-06 | Search and Filter Tenant List | 1 | 8 | `[AS-IS]` partial |
| US-TM-07 | Manage Tenant Integrations | 2 | 13 | `[TARGET]` |
| US-TM-08 | Manage Tenant Users | 2 | 13 | `[TARGET]` |
| US-TM-09 | Manage Tenant Dictionary | 3 | 13 | `[TARGET]` |
| US-TM-10 | Manage Tenant Agents | 3 | 8 | `[TARGET]` |
| US-TM-11 | View Tenant Studio | 3 | 5 | `[TARGET]` |
| US-TM-12 | View Tenant Audit Log | 2 | 8 | `[TARGET]` |
| US-TM-13 | View Tenant Health Checks | 3 | 8 | `[TARGET]` |
| **Total** | | | **144** | |

---

## Phase Breakdown

| Phase | Stories | SP | Focus |
|-------|---------|-----|-------|
| 0 | -- | -- | Requirements (this package) |
| 1 | US-TM-01, 02, 03 (shell), 04, 06 | 63 | Core CRUD + lifecycle + list |
| 2 | US-TM-03 (tabs), 05, 07, 08, 12 | 47 | Tab content + branding + integrations |
| 3 | US-TM-09, 10, 11, 13 | 34 | Dictionary + agents + studio + health |

---

## Traceability Notes

1. **US-TM-03 merger** -- This story was formerly split into US-TM-03 (Tenant Admin view) and US-TM-06 (Super Admin view). They have been merged into a single story per the R02 role model, which uses ADMIN + tenant type context instead of separate SUPER_ADMIN and Tenant Admin roles.

2. **US-TM-06 re-purpose** -- The former US-TM-06 (Super Admin tenant view) has been re-purposed as Search and Filter Tenant List. The previous story was a restricted Super Admin view that is no longer needed under the unified ADMIN role model.

3. **New stories US-TM-07 through US-TM-13** -- These map one-to-one to the 8 frozen tabs on the Tenant Fact Sheet. The Users tab was already implied by the original US-TM-03 but is now given its own dedicated story (US-TM-08) for clarity.

4. **Story-to-tab mapping:**

   | Tab | Story |
   |-----|-------|
   | Users | US-TM-08 |
   | Branding | US-TM-05 |
   | Integrations | US-TM-07 |
   | Dictionary | US-TM-09 |
   | Agents | US-TM-10 |
   | Studio | US-TM-11 |
   | Audit Log | US-TM-12 |
   | Health Checks | US-TM-13 |
