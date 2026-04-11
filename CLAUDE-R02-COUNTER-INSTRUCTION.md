# R02 Tenant Management — Counter-Instruction to Brand Studio Stream

**From:** `tenant-factsheet-spec` worktree (R02 Tenant Management)
**To:** `brand-studio-spec` worktree (R14 Brand Studio)
**Date:** 2026-03-23

## Purpose

This document responds to `CLAUDE-BRAND-STUDIO-HANDOFF.md` and establishes the file/route/API boundary between R02 and R14.

---

## 1. Files owned by R02 in `tenant-factsheet-spec`

### Parking prototype components (DO NOT TOUCH)

| File | Purpose |
|------|---------|
| `frontend/src/app/_parking/parking-preview.component.ts` | Root orchestrator for all R02 parking screens |
| `frontend/src/app/_parking/tenant-list/tenant-list.component.ts` | Tenant list with grid/table toggle |
| `frontend/src/app/_parking/tenant-list/tenant-list.component.html` | Tenant list template |
| `frontend/src/app/_parking/tenant-list/tenant-list.component.scss` | Tenant list styles |
| `frontend/src/app/_parking/tenant-list/tenant-list.models.ts` | TenantSummary, TenantStatus, sample data |
| `frontend/src/app/_parking/tenant-factsheet/tenant-factsheet.component.ts` | Fact sheet with 8-tab shell |
| `frontend/src/app/_parking/tenant-factsheet/tenant-factsheet.component.html` | Fact sheet template (includes Branding tab placeholder) |
| `frontend/src/app/_parking/tenant-factsheet/tenant-factsheet.component.scss` | Fact sheet styles (includes `.branding-*` placeholder CSS) |
| `frontend/src/app/_parking/tenant-factsheet/tenant-factsheet.models.ts` | TenantFactsheet, FactsheetTab, tab metadata, sample data |
| `frontend/src/app/_parking/create-tenant-form/create-tenant-form.component.ts` | Create tenant wizard (3-step) |
| `frontend/src/app/_parking/create-tenant-form/create-tenant-form.component.html` | Create tenant template |
| `frontend/src/app/_parking/create-tenant-form/create-tenant-form.component.scss` | Create tenant styles |
| `frontend/src/app/_parking/create-tenant-form/create-tenant.models.ts` | Wizard models, provisioning steps |
| `frontend/src/app/_parking/lifecycle-dialogs/lifecycle-dialogs.component.ts` | Suspend/restore/archive dialogs |
| `frontend/src/app/_parking/lifecycle-dialogs/lifecycle-dialogs.component.html` | Lifecycle dialog template |
| `frontend/src/app/_parking/lifecycle-dialogs/lifecycle-dialogs.component.scss` | Lifecycle dialog styles |

### Shared files R02 has modified (COORDINATE before editing)

| File | R02 changes | Brand Studio safe to edit? |
|------|-------------|---------------------------|
| `frontend/src/styles.scss` | Added `--tp-*` / `--p-*` tokens for Slider, Checkbox, RadioButton, Tag, Badge, ProgressBar, Breadcrumb, SelectButton | Yes — Brand Studio may ADD new `--tp-*` / `--p-*` token groups. Do NOT modify or remove existing R02 token groups. |
| `frontend/src/app/core/api/models.ts` | TenantStatus, TenantType, Tenant interface, request DTOs | Brand Studio should NOT modify Tenant-related types. May add Brand-related types. |
| `Documentation/design-system/component-showcase.html` | Added sections 19-25 (Checkbox through Breadcrumb) | Brand Studio may add new sections. Do NOT modify existing sections 1-25. |
| `Documentation/design-system/DESIGN-SYSTEM-CONTRACT.md` | Added 7 component entries | Brand Studio may add entries. Do NOT remove existing entries. |

### R02 requirement documents (DO NOT TOUCH)

| File |
|------|
| `Documentation/.Requirements/R02. TENANT MANAGEMENT/Design/01-PRD-Tenant-Management.md` |
| `Documentation/.Requirements/R02. TENANT MANAGEMENT/Design/00-FACT-SHEET-PATTERN.md` |
| `Documentation/.Requirements/R02. TENANT MANAGEMENT/Design/R02-STALE-DOC-IMPACT-MAP.md` |
| `Documentation/.Requirements/R02. TENANT MANAGEMENT/Design/R02-COMPLETE-STORY-INVENTORY.md` |
| `Documentation/.Requirements/R02. TENANT MANAGEMENT/Design/R02-MESSAGE-CODE-REGISTRY.md` |
| `Documentation/.Requirements/R02. TENANT MANAGEMENT/Design/R02-screen-flow-prototype.html` |
| `Documentation/.Requirements/R02. TENANT MANAGEMENT/Design/R02-journey-map.html` |
| `Documentation/.Requirements/R02. TENANT MANAGEMENT/Design/R02-journey-maps.md` |
| `Documentation/.Requirements/R02. TENANT MANAGEMENT/Design/_parking/*` |

---

## 2. Routes and screens owned by R02

| Route / Screen | Owner | Notes |
|----------------|-------|-------|
| `/parking` (dev-only preview) | R02 | Full parking preview with list → factsheet → create → lifecycle flow |
| Tenant List (grid + table views) | R02 | Search, filter (type/status dropdowns), pagination |
| Tenant Fact Sheet (8-tab shell) | R02 | Banner + tabs: users, branding, integrations, dictionary, agents, studio, audit, health |
| Create Tenant Wizard (3-step) | R02 | Step 1: Identity, Step 2: Configuration, Step 3: Provisioning |
| Lifecycle Dialogs (suspend/restore/archive) | R02 | Confirmation dialogs with typed reason/notes |

---

## 3. Branding tab — placeholder only, R14 owns the real implementation

R02 **does** need the Branding tab in the fact sheet. It is currently a placeholder shell:

- Tab entry in `FACTSHEET_TABS`: `{ value: 'branding', label: 'Branding', icon: 'pi pi-palette', count: null }`
- Template: static color swatches, logo upload placeholder, Preview/Publish buttons (non-functional)
- SCSS: `.branding-content`, `.branding-section`, `.branding-actions` (placeholder layout only)

**R02 will:**
- Keep the Branding tab entry in the tab list
- Keep the placeholder shell UI
- Reference Brand Studio as the implementation owner in PRD Section 6
- NOT implement color pickers, palette packs, typography packs, brand profiles, or draft workspaces

**R14 will eventually:**
- Replace the placeholder content with the real Brand Studio editor
- Own all runtime brand resolution, CSS variable injection, and brand assembly

---

## 4. Labels and messages R02 will reference

R02 will use these branding-related labels/messages in its own screens. These are **R02 message codes**, not Brand Studio codes:

| Code | Context | Text |
|------|---------|------|
| (in PRD) | Fact sheet Branding tab title | "Branding" |
| (in PRD) | Create tenant Step 2 | "Seed default roles, permissions, and branding" (provisioning step label) |

R02 will NOT define Brand Studio error codes, success messages, or validation messages.

---

## 5. API contracts R02 will reference but NOT define

| API | R02 usage | Owner |
|-----|-----------|-------|
| `GET /api/tenants/{id}/branding` | Fact sheet Branding tab — display current brand | R14 |
| `PUT /api/tenants/{id}/branding` | Fact sheet Branding tab — publish brand | R14 |
| `GET /api/tenants/{id}/branding/draft` | Fact sheet Branding tab — draft workspace | R14 |
| Brand manifest/profile schema | Referenced as dependency in PRD | R14 |

R02 **does** own these tenant lifecycle APIs:
- `POST /api/tenants` (create)
- `GET /api/tenants` (list)
- `GET /api/tenants/{id}` (detail/factsheet)
- `PUT /api/tenants/{id}` (update)
- `POST /api/tenants/{id}/suspend` (lifecycle)
- `POST /api/tenants/{id}/reactivate` (lifecycle)
- `POST /api/tenants/{id}/decommission` (lifecycle)
- `GET /api/tenants/{id}/health` (health checks)

---

## 6. File paths Brand Studio must avoid

While `tenant-factsheet-spec` work is in progress, Brand Studio must NOT edit:

### Hard avoid (R02 owned exclusively)

- `frontend/src/app/_parking/**/*`
- `Documentation/.Requirements/R02. TENANT MANAGEMENT/**/*`

### Coordinate first (shared, R02 has active edits)

- `frontend/src/styles.scss` — add only, do not modify existing `--tp-*` / `--p-*` groups
- `frontend/src/app/core/api/models.ts` — add brand types, do not modify tenant types
- `Documentation/design-system/component-showcase.html` — add sections, do not modify existing
- `Documentation/design-system/DESIGN-SYSTEM-CONTRACT.md` — add entries, do not remove existing
- `Documentation/design-system/components/*.md` — add new files, do not modify R02's 7 new files

### Safe for Brand Studio (no R02 interest)

- `frontend/src/app/features/administration/sections/tenant-manager/branding-studio/**/*`
- `Documentation/.Requirements/R14. BRAND STUDIO/**/*`
- Any new `frontend/src/app/features/brand-studio/**/*` path
- Any new `frontend/src/app/shared/brand-*/**/*` components

---

## 7. Neo4j graph boundary

R02 owns:
- `(:Tenant)` node properties (identity, status, type, tier, health, lifecycle timestamps)
- `(:Tenant)-[:HAS_USER]->(:User)` (users tab)
- `(:Tenant)-[:HAS_INTEGRATION]->(:Provider)` (integrations tab)
- `(:Tenant)-[:HAS_DEFINITION]->(:ObjectType)` (dictionary tab)
- `(:Tenant)-[:HAS_AGENT]->(:Agent)` (agents tab)

R14 owns (per frozen decisions):
- `(:Tenant)-[:HAS_ACTIVE_BRAND]->(:BrandProfile)` (branding tab)

R02 will reference `HAS_ACTIVE_BRAND` as a known relationship in the fact sheet pattern but will NOT define its target node schema.

---

## Summary

| Concern | R02 owns | R14 owns | Overlap zone |
|---------|----------|----------|--------------|
| Tenant CRUD + lifecycle | Yes | No | None |
| Fact sheet shell (8 tabs) | Yes | No | Branding tab content |
| Brand runtime architecture | No | Yes | None |
| Branding tab placeholder | Yes (shell) | Yes (real content) | R14 replaces R02 placeholder |
| `styles.scss` token groups | Existing groups | May add new groups | Additive only |
| `models.ts` types | Tenant types | Brand types | Separate namespaces |
| Neo4j `:Tenant` node | Properties + most relationships | `HAS_ACTIVE_BRAND` relationship | R14 extends, R02 references |
