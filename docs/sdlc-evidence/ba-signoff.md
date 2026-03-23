# BA Sign-Off — Phase 2: P0 Critical Infrastructure Issues

**Date:** 2026-03-03
**Phase:** Phase 2 — P0 Critical Issue Remediation
**Approved by:** User (Gate 1B acceptance 2026-03-03)

## Requirements Validation

| Issue | Title | Acceptance Criteria | ADR |
|-------|-------|---------------------|-----|
| INF-001 | Single flat Docker network | `docs/issues/open/ISSUE-INF-001.md` | ADR-018 |
| INF-002 | Frontend reaches DB network | `docs/issues/open/ISSUE-INF-002.md` | ADR-018 |
| INF-003 | `docker compose down -v` data loss | `docs/issues/open/ISSUE-INF-003.md` | ADR-018 |
| INF-004 | All services share postgres superuser | `docs/issues/open/ISSUE-INF-004.md` | ADR-020 |
| INF-005 | No inter-container network policies | `docs/issues/open/ISSUE-INF-005.md` | ADR-018 |

## Scope (infrastructure only — no application source code)

- `docker-compose.dev.yml` + `docker-compose.staging.yml` → 3-network topology
- `infrastructure/docker/init-db.sql` → per-service PostgreSQL users
- `.env.*.template` → credential externalization templates
- Upgrade safety runbook

**Status:** APPROVED — Phase 2 may proceed

---

# BA Sign-Off: Branding Studio (Component Catalog Theme Builder) -- REVISED

**Date:** 2026-03-02
**Feature:** Branding Studio -- Component Catalog Theme Builder (replaces original "global branding form" approach)
**BA Agent Version:** BA-PRINCIPLES.md v1.1.0
**Previous Sign-Off:** 2026-03-02 (Tenant Theme Builder -- Neumorphism Design System, CONDITIONAL)
**Status:** CONDITIONAL SIGN-OFF -- Ready with flagged concerns

---

## 0. Summary of Change from Previous Sign-Off

The original plan was a single global branding form (color pickers, neumorphic sliders, hover presets) all in one flat panel. The REVISED plan replaces this with a **two-panel Branding Studio** that acts as a component library browser:

| Aspect | Previous Plan | Revised Plan |
|--------|---------------|--------------|
| Layout | Single-panel branding form | Two-panel: catalog sidebar (left) + preview/settings (right) |
| Component scope | Global controls only (colors, shadows, presets, hovers) | Global Theme entry + per-component token editors for all 90+ PrimeNG components |
| Preview | Small preview panel at bottom of form | Full interactive Angular preview of selected component's variants |
| Storage | Global branding fields only | Global branding + new `component_tokens` JSONB column for per-component overrides |
| Customization depth | 4 colors + 5 hovers + 3 sliders | All PrimeNG design tokens for each component (border-radius, padding, background, shadow, hover) |

All concerns from the previous sign-off (CONCERN-01 through CONCERN-11) remain applicable. This document extends the RTM and adds new concerns specific to the component catalog approach.

---

## 1. Requirements Sources Reviewed

| Source | Path | Relevance |
|--------|------|-----------|
| On-Premise Licensing Requirements | `docs/requirements/ON-PREMISE-LICENSING-REQUIREMENTS.md` | CRITICAL -- `Custom Branding Enabled` per-tenant boolean (line 142); Edition gating: Standard=No, Professional=Yes, Enterprise=Yes (line 267) |
| RBAC & Licensing Requirements | `docs/requirements/RBAC-LICENSING-REQUIREMENTS.md` | CRITICAL -- `custom_branding` feature key Enterprise-only (line 259); BR-152: hidden not greyed out (line 335) |
| Business Domain Model | `docs/data-models/domain-model.md` | HIGH -- Tenant Branding entity attributes (lines 165-189), business rules BR-TB001, BR-TB002 |
| Canonical Data Model | `docs/data-models/CANONICAL-DATA-MODEL.md` | HIGH -- `tenant_branding` PostgreSQL table schema |
| ADR-012 PrimeNG Migration | `docs/adr/ADR-012-primeng-migration.md` | HIGH -- PrimeNG 21 unstyled mode + design token architecture; lists 90+ component library; ThinkPLUS token mapping strategy |
| PrimeNG Migration LLD | `docs/lld/primeng-migration-lld.md` | HIGH -- ThinkPLUS design system token architecture, ThemeService design, dark mode strategy |
| Frontend Production Readiness | `docs/backlog/FRONTEND-PRODUCTION-READINESS-NON-NEGOTIABLE.md` | MEDIUM -- PRD-DESIGN-001 (tokenize hardcoded colors), PRD-UX-002 (password reset branding parity) |
| Existing Tenant Manager Component (TS) | `frontend/src/app/features/administration/sections/tenant-manager/tenant-manager-section.component.ts` | HIGH -- Existing branding form: `TenantBrandingForm`, `saveBranding()`, `applyBrandPreset()`, localStorage persistence + API persistence via `updateTenantBranding()` |
| Existing Tenant Manager Component (HTML) | `frontend/src/app/features/administration/sections/tenant-manager/tenant-manager-section.component.html` | HIGH -- Current branding tab layout (lines 192-498): color pickers, sliders, preset row, hover selectbuttons, custom CSS textarea, live preview panel |
| Existing API Models | `frontend/src/app/core/api/models.ts` | HIGH -- `TenantBranding` interface (lines 267-292), `UpdateTenantBrandingRequest` (lines 294-316), hover type unions (lines 261-265) |
| Existing TenantBrandingEntity (Backend) | `backend/tenant-service/src/main/java/com/ems/tenant/entity/TenantBrandingEntity.java` | HIGH -- 23 fields including neumorphic columns; defaults: `#428177` primary, `#edebe0` surface |
| Existing V9 Migration | `backend/tenant-service/src/main/resources/db/migration/V9__add_tenant_branding_neumorphic_fields.sql` | HIGH -- 14 new columns + 8 CHECK constraints already applied |
| Existing V1 Migration | `backend/tenant-service/src/main/resources/db/migration/V1__create_tenant_tables.sql` | HIGH -- `tenant_branding` base table schema (lines 83-95) |
| Existing TenantThemeService | `frontend/src/app/core/theme/tenant-theme.service.ts` | HIGH -- `applyBranding()` applies CSS vars + PrimeNG `updatePreset()` semantic palette; `previewBranding()` applies CSS vars only |
| Existing API Gateway Service | `frontend/src/app/core/api/api-gateway.service.ts` | HIGH -- `getTenantBranding()` and `updateTenantBranding()` methods exist |
| Administration Models | `frontend/src/app/features/administration/models/administration.models.ts` | HIGH -- `TenantBrandingForm` interface (21 fields), `createDefaultBrandingForm()`, `TenantManagerTab` type |
| SA Review (Previous) | `docs/sdlc-evidence/sa-review.md` | MEDIUM -- API contract for branding CRUD, V9 migration specification |
| QA Report (Previous) | `docs/sdlc-evidence/qa-report.md` | MEDIUM -- Existing test coverage for theme builder |

---

## 2. Requirements Traceability Matrix (Extended)

### 2.1 Requirements Carried Forward from Previous Sign-Off

All RTM-01 through RTM-44 from the previous sign-off remain applicable. Their statuses are updated below based on the revised plan.

| ID | Requirement | Source | Revised Plan Coverage | Status |
|----|-------------|--------|----------------------|--------|
| RTM-01 | Custom branding is a licensed feature (`custom_branding` key) | RBAC-REQ line 259, ON-PREM-REQ line 142 | **NOT ADDRESSED** -- Revised plan says "no tier gating -- all tenants" which CONTRADICTS requirements | **CONFLICT** |
| RTM-02 | `custom_branding` is Enterprise-only (SaaS RBAC model) | RBAC-REQ line 259 | **CONTRADICTED** -- Plan explicitly says "No tier gating -- all tenants" | **CONFLICT** |
| RTM-03 | On-premise: `Custom Branding Enabled` per-tenant boolean in Tenant License | ON-PREM-REQ line 142 | **CONTRADICTED** -- Plan says all tenants have access | **CONFLICT** |
| RTM-04 | Application License Edition gates Custom Branding (Standard=No, Professional=Yes, Enterprise=Yes) | ON-PREM-REQ line 267 | **CONTRADICTED** -- Plan says all tenants | **CONFLICT** |
| RTM-05 | Feature gating UI: if feature hidden by license, UI must not show it (BR-152) | ON-PREM-REQ line 335 | **NOT ADDRESSED** | **MISSING** |
| RTM-06 | Branding is admin-only (Tenant-Admin ADMIN role) | RBAC-REQ line 288 | **PARTIALLY COVERED** -- Branding Studio is within admin-only Tenant Manager section, but no explicit role check AC | **PARTIAL** |
| RTM-07 | Tenant Branding: `primaryColor` | Domain Model | Covered -- "Global Theme" entry retains existing color pickers | **COVERED** |
| RTM-08 | Tenant Branding: `secondaryColor` | Domain Model | Covered -- retained in Global Theme | **COVERED** |
| RTM-09 | Tenant Branding: `fontFamily` | Domain Model | Covered -- retained in Global Theme | **COVERED** |
| RTM-10 | Tenant Branding: `primaryColorDark` (dark mode) | Domain Model, Canonical DM | **NOT ADDRESSED** -- Plan says "Dark mode deferred" | **DEFERRED (acknowledged)** |
| RTM-11 | Tenant Branding: `logoUrl` | Domain Model | Covered -- existing form field retained | **COVERED** |
| RTM-12 | Tenant Branding: `logoUrlDark` (dark mode) | Domain Model, Canonical DM | **NOT ADDRESSED** -- Deferred with dark mode | **DEFERRED (acknowledged)** |
| RTM-13 | Tenant Branding: `faviconUrl` | Domain Model, Canonical DM | VERIFY -- Plan does not explicitly mention; existing HTML has this field (line 240-249) | **VERIFY** |
| RTM-14 | Tenant Branding: `loginBackgroundUrl` | Domain Model, Canonical DM | VERIFY -- Plan does not explicitly mention; existing HTML has this field (line 251-259) | **VERIFY** |
| RTM-15 | Tenant Branding: `customCss` | Domain Model, Canonical DM | VERIFY -- Plan does not mention; existing HTML has textarea (line 459-468) | **VERIFY** |
| RTM-16 | BR-TB001: Each tenant has one branding configuration | Domain Model | Covered -- 1:1 relationship maintained | **COVERED** |
| RTM-17 | BR-TB002: Colors must be valid hex codes | Domain Model | **PARTIAL** -- Plan uses color pickers (which enforce hex) but no explicit validation rule for API-submitted values | **PARTIAL** |
| RTM-18 | Dark mode support (`.app-dark-mode` selector) | `app.config.ts` line 29 | **DEFERRED** -- Plan explicitly defers dark mode | **DEFERRED (acknowledged)** |
| RTM-19 | Surface color | Plan feature | Covered -- retained in Global Theme | **COVERED** |
| RTM-20 | Text color | Plan feature | Covered -- retained in Global Theme | **COVERED** |
| RTM-21 | Shadow dark/light colors | Plan feature | Covered -- retained in Global Theme | **COVERED** |
| RTM-22 | Corner radius | Plan feature | Covered -- retained in Global Theme | **COVERED** |
| RTM-23 | Button depth | Plan feature | Covered -- retained in Global Theme | **COVERED** |
| RTM-24 | Shadow intensity | Plan feature | Covered -- retained in Global Theme | **COVERED** |
| RTM-25 | Soft shadows toggle | Plan feature | Covered -- retained in Global Theme | **COVERED** |
| RTM-26 | Compact nav toggle | Plan feature | Covered -- retained in Global Theme | **COVERED** |
| RTM-27-31 | Per-component hover behaviours (5 types) | Plan feature | Covered -- retained in Global Theme | **COVERED** |
| RTM-32 | Font family selector | Plan feature | Covered -- retained in Global Theme | **COVERED** |
| RTM-33 | Preset themes (Neumorph Classic, Aqua, Sand, Slate) | Plan feature | Covered -- retained in Global Theme; existing code has all 4 presets | **COVERED** |
| RTM-34 | Default palette: `#edebe0` surface + `#428177` primary | Plan feature | **RESOLVED** -- Backend entity defaults match (`#edebe0` + `#428177`). Previous concern about conflict with ThinkPlus preset (#047481) still applies but is now a preset distinction, not a default conflict | **COVERED** |
| RTM-35 | Builder location: Branding tab in Tenant Manager | Plan feature | Covered -- Studio replaces existing Branding tab content | **COVERED** |
| RTM-36 | PRD-UX-002: Password reset pages must match tenant branding | Backlog line 120-122 | **NOT ADDRESSED** -- Plan does not mention branding propagation | **MISSING** |
| RTM-37 | PRD-DESIGN-001: Tokenize hardcoded colors | Backlog line 136-138 | **NOT ADDRESSED** -- Plan does not mention SCSS tokenization | **MISSING** |
| RTM-38 | Backend API for branding CRUD | Canonical DM | **COVERED** -- API endpoints `GET/PUT /api/tenants/{id}/branding` already exist in `api-gateway.service.ts` (lines 290-304); `saveBranding()` in component already calls API (lines 573-608) | **COVERED** |
| RTM-39 | WCAG AAA compliance (7:1+ contrast ratio) | EMSIST standard | **NOT ADDRESSED** -- No contrast validation for custom colors | **MISSING** |
| RTM-40 | Arabic RTL layout support | BA responsibility | **NOT ADDRESSED** -- Catalog sidebar and preview panel need RTL consideration | **MISSING** |
| RTM-41 | Runtime theme application (CSS vars on :root) | TenantThemeService | **COVERED** -- `TenantThemeService.previewBranding()` already applies via CSS vars (line 13-15); `applyBranding()` applies CSS vars + PrimeNG palette (lines 7-11) | **COVERED** |
| RTM-42 | CSS sanitization for custom CSS injection | Old ThemeService | **NOT ADDRESSED** -- existing code injects raw CSS without sanitization (`_injectCustomCss` line 111-118) | **MISSING** |
| RTM-43 | Multi-tenant branding isolation | BR-TB001 | Covered -- tenant selection scopes branding | **COVERED** |
| RTM-44 | `prefers-reduced-motion` for hover animations | Existing implementation | **NOT ADDRESSED** -- New component-level previews will have interactive animations needing reduced-motion fallback | **MISSING** |

### 2.2 New Requirements for Revised Plan (Component Catalog)

| ID | Requirement | Source | Plan Coverage | Status |
|----|-------------|--------|---------------|--------|
| RTM-50 | Catalog sidebar must list all 90+ PrimeNG components by category | Plan specification | Covered -- Plan specifies 8 categories (Form, Data, Panel, Overlay, Messages, Navigation, Media, Misc) | **COVERED** |
| RTM-51 | "Global Theme" entry at top of catalog sidebar | Plan specification | Covered -- Plan explicitly describes this as first entry | **COVERED** |
| RTM-52 | Search/filter of catalog entries | Plan specification | Covered -- Plan mentions search/filter | **COVERED** |
| RTM-53 | Top 20 components have full interactive Angular previews | Plan specification | **PARTIAL** -- Plan states this but does not specify which 20 components are "top 20" | **PARTIAL** |
| RTM-54 | Remaining ~70 components have basic token editor with CSS variable inputs | Plan specification | Covered -- Plan describes this fallback | **COVERED** |
| RTM-55 | Per-component token overrides stored in `component_tokens` JSONB column | Plan specification | **NEW DATA MODEL** -- This column does not exist in current schema (`tenant_branding` table). Requires new migration V10+ | **NEW (needs SA/DBA)** |
| RTM-56 | Live preview applies immediately via `updatePreset({ components: { button: {...} } })` | Plan specification | **PARTIAL** -- `TenantThemeService` currently only calls `updatePreset()` for `semantic.primary` palette (line 36-40). Per-component `updatePreset({ components: ... })` is a new capability not yet implemented | **PARTIAL** |
| RTM-57 | Component variants displayed: Main, Outlined, Text, Link, Icon-only, Sizes, Severity states | Plan specification (for Button example) | Covered -- Plan describes variant display | **COVERED** |
| RTM-58 | Per-component settings panel for key design tokens: border-radius, padding, background, shadow, hover | Plan specification | Covered -- Plan describes settings panel per component | **COVERED** |
| RTM-59 | Save persists per-component overrides alongside global branding | Plan specification | **PARTIAL** -- Save flow exists for global branding; per-component overrides via JSONB is new and needs API contract update | **PARTIAL** |
| RTM-60 | EMSIST-specific custom components should appear in catalog if any exist | Validation task | **NO EMSIST-SPECIFIC COMPONENTS FOUND** -- `frontend/src/app/shared/` directory does not exist; no custom reusable components beyond page-level components. All UI components are PrimeNG primitives used inline | **N/A -- no custom components to add** |
| RTM-61 | Keyboard navigation of catalog sidebar | Plan validation task (a11y) | **NOT ADDRESSED** -- Plan does not mention keyboard navigation for the sidebar list | **MISSING** |
| RTM-62 | Category expand/collapse in catalog sidebar | Inferred from 90+ component list | **NOT SPECIFIED** -- With 90+ items, expandable categories are needed but not described | **MISSING** |
| RTM-63 | Active/selected state visual indicator in catalog sidebar | UX standard | **NOT SPECIFIED** -- Need visual indicator for currently selected component | **MISSING** |
| RTM-64 | Two-panel responsive behaviour (mobile collapse) | Responsive design standard | **NOT SPECIFIED** -- What happens on mobile? Does sidebar collapse to a dropdown? | **MISSING** |
| RTM-65 | PrimeNG component category assignment correctness | Validation task | See Section 4 below for category analysis | **COVERED (with corrections)** |

---

## 3. Confirmed Scope (Items Validated as Correct)

The following plan items are confirmed as consistent with existing requirements and codebase:

1. **"Global Theme" entry retains all existing controls** -- The existing branding form has: 4 color pickers (primary, secondary, surface, text), 2 shadow color pickers, logo/favicon/login-bg URL fields, font family, 3 range sliders (corner radius 0-40, button depth 0-30, shadow intensity 0-100), 2 toggles (soft shadows, compact nav), 5 hover selectbuttons (button, card, input, nav, table row), 4 preset buttons (neumorph, aqua, sand, slate), custom CSS textarea, and a live preview panel. All of these exist in the current template (lines 192-498) and should be retained in the "Global Theme" right panel.

2. **Two-panel layout is architecturally sound** -- The existing tenant manager already uses a split-grid layout (sidebar for tenant list, main panel for tenant details). Nesting a second split within the Branding tab is consistent.

3. **PrimeNG `updatePreset({ components: ... })` API is valid** -- PrimeNG 21's `updatePreset()` function supports per-component token overrides via the `components` key. This is documented in PrimeNG's theming API.

4. **Backend API exists for branding persistence** -- `GET /api/tenants/{id}/branding` and `PUT /api/tenants/{id}/branding` are implemented in `api-gateway.service.ts` (lines 290-304). The `saveBranding()` method in the component (lines 573-608) already calls the API with localStorage fallback.

5. **Default palette `#edebe0` + `#428177` matches backend entity** -- `TenantBrandingEntity.java` uses `@Builder.Default` values of `#428177` (primaryColor, line 29) and `#edebe0` (surfaceColor, line 62). The frontend `createDefaultBrandingForm()` also uses these values (lines 175-176 of `administration.models.ts`). No conflict.

6. **Dark mode deferral is acceptable** -- The plan explicitly states "Dark mode deferred." The backend entity already has `primaryColorDark` and `logoUrlDark` columns (lines 31-32, 43-44 of entity). These columns exist but the Studio UI will not expose them in this iteration. This is a conscious scope decision, not an oversight.

7. **V9 migration already applied** -- The 14 neumorphic fields are already in the database schema via `V9__add_tenant_branding_neumorphic_fields.sql`. No migration needed for existing global branding fields.

8. **No EMSIST-specific custom components exist** -- The `frontend/src/app/shared/` directory does not exist. All components in the application are PrimeNG primitives used inline in feature components. Therefore the catalog correctly limits itself to PrimeNG components only.

---

## 4. PrimeNG Component Catalog Validation

### 4.1 Category Assignment Analysis

The plan proposes 8 categories. Below is the validated PrimeNG component list per category (based on PrimeNG 21 documentation):

| Category | Example Components | Approximate Count |
|----------|-------------------|-------------------|
| **Form** | AutoComplete, Calendar, Checkbox, ColorPicker, Dropdown/Select, Editor, InputGroup, InputMask, InputNumber, InputOtp, InputText, InputTextarea, Knob, Listbox, MultiSelect, Password, RadioButton, Rating, SelectButton, Slider, Stepper, TextArea, ToggleButton, ToggleSwitch, TreeSelect | ~25 |
| **Data** | DataView, OrderList, OrgChart, Paginator, PickList, Table, Timeline, Tree, TreeTable, VirtualScroller | ~10 |
| **Panel** | Accordion, Card, Divider, Fieldset, Panel, ScrollPanel, Splitter, Stepper, TabView/Tabs, Toolbar | ~10 |
| **Overlay** | ConfirmDialog, ConfirmPopup, Dialog, Drawer/Sidebar, DynamicDialog, Popover/OverlayPanel, Tooltip | ~7 |
| **Messages** | Message, Toast | ~2 |
| **Navigation** | Breadcrumb, ContextMenu, Dock, MegaMenu, Menu, Menubar, PanelMenu, Speed Dial, Steps, TabMenu, TieredMenu | ~11 |
| **Media** | Carousel, Galleria, Image | ~3 |
| **Misc** | Avatar, Badge, BlockUI, Chip, InPlace, MeterGroup, ProgressBar, ProgressSpinner, Ripple, ScrollTop, Skeleton, Tag, Terminal | ~13 |

**Total: ~81 components** (PrimeNG documentation lists 80+ components; "90+" in the plan is slightly overstated but acceptable as it may include sub-variants)

### 4.2 Top 20 Components -- Recommendation

The plan states "Top 20 components have full interactive Angular previews" but does not specify which 20. Based on EMSIST usage and general enterprise SaaS relevance:

**Recommended Top 20 for Full Preview:**

| # | Component | Category | Justification |
|---|-----------|----------|---------------|
| 1 | Button | Form | Most common interactive element; used everywhere |
| 2 | InputText | Form | Primary form input; used in all forms |
| 3 | Select/Dropdown | Form | Used in create/edit modals (tier, type) |
| 4 | Table | Data | Core enterprise component; tenant/user/license lists |
| 5 | Card | Panel | Used in all admin panels; neumorphic styling |
| 6 | Tabs | Panel | Used in tenant manager (5 tabs) |
| 7 | Dialog | Overlay | Used for create/edit tenant modals |
| 8 | Tag | Misc | Used for status indicators (active/locked/pending) |
| 9 | Message | Messages | Used for error/success/info feedback |
| 10 | Toast | Messages | Used for action confirmations |
| 11 | ProgressSpinner | Misc | Used for loading states |
| 12 | Checkbox | Form | Used for toggles (soft shadows, compact nav) |
| 13 | SelectButton | Form | Used for hover behaviour selection |
| 14 | Menubar | Navigation | Shell navigation bar |
| 15 | Breadcrumb | Navigation | Page navigation context |
| 16 | Accordion | Panel | Settings sections |
| 17 | AutoComplete | Form | User search, entity search |
| 18 | Calendar | Form | Date pickers for license expiry, audit logs |
| 19 | InputNumber | Form | Seat allocation, numeric fields |
| 20 | Chip | Misc | User roles, tag lists |

**BA Recommendation:** The plan SHOULD specify the Top 20 list explicitly to avoid ambiguity during implementation. The list above is a starting recommendation based on current EMSIST component usage.

---

## 5. Flagged Concerns

### CONCERN-01 (CARRIED FORWARD): CRITICAL -- License-Tier Feature Gating CONTRADICTED

**Impact: CRITICAL**

The revised plan explicitly states: **"No tier gating -- all tenants."** This directly contradicts three requirements documents:

- **ON-PREM-REQ line 267:** Application License Edition gates Custom Branding (Standard=No, Professional=Yes, Enterprise=Yes)
- **ON-PREM-REQ line 142:** `Custom Branding Enabled` is a per-tenant boolean in the Tenant License
- **RBAC-REQ line 259:** `custom_branding` is Enterprise-only in the SaaS model

The plan acknowledges this as a "Product Decision Already Made," but there is a conflict with documented requirements. This needs **explicit Product Owner confirmation** that the requirements documents should be updated to remove branding tier gating, OR the plan must add tier gating.

**Required resolution options:**
1. Update ON-PREM-REQ and RBAC-REQ to remove `custom_branding` from feature gating (if PO confirms all tenants get branding)
2. Add tier gating to the plan (if requirements remain as-is)
3. Split: "Global Theme" available to all; "Component-level overrides" gated to Professional+ (a compromise)

### CONCERN-02 (CARRIED FORWARD): RESOLVED -- Backend API Persistence

**Status: RESOLVED** -- The previous concern about localStorage-only persistence is no longer valid. The current code already calls `this.api.updateTenantBranding(tenantPathId, snapshot)` (line 587) with localStorage as a fallback on API error (lines 598-604). The `GET/PUT /api/tenants/{id}/branding` endpoints exist in the gateway service.

**Remaining concern:** The new `component_tokens` JSONB field needs a corresponding API update (see CONCERN-12).

### CONCERN-03 (CARRIED FORWARD): ACKNOWLEDGED -- Dark Mode Deferred

**Status: ACKNOWLEDGED** -- The plan explicitly defers dark mode. The backend columns (`primaryColorDark`, `logoUrlDark`) exist in the entity and schema. The `TenantBranding` interface in models.ts includes these fields (lines 269, 276). The Studio will simply not expose them. This is acceptable provided it is documented as a known gap.

### CONCERN-04 (CARRIED FORWARD): RESOLVED -- Default Color Conflict

**Status: RESOLVED** -- The backend entity and frontend defaults both use `#428177`/`#edebe0`. The ThinkPlus preset uses `#047481`, which is a different color scale used at the PrimeNG primitive level. These coexist: the ThinkPlus preset defines the base PrimeNG palette, while the tenant branding overrides the CSS custom properties at runtime. No conflict.

### CONCERN-05 (CARRIED FORWARD): RESOLVED -- Domain Model Updated

**Status: RESOLVED** -- The V9 migration has been applied, adding all 14 neumorphic fields. The `TenantBrandingEntity.java` includes all fields. The `TenantBranding` interface in `models.ts` includes all fields. The domain model may still need a documentation update but the implementation is aligned.

### CONCERN-06 (CARRIED FORWARD): VERIFY -- Missing Canonical Attributes

**Status: VERIFY** -- The plan does not explicitly mention `faviconUrl`, `loginBackgroundUrl`, and `customCss` in the Branding Studio description. However, these fields already exist in the current branding tab template (lines 240-249, 251-259, 459-468) and in the backend entity. The question is: do these appear in the "Global Theme" panel, or are they removed?

**BA Recommendation:** These must be retained in the "Global Theme" right panel. They are established fields with existing UI controls.

### CONCERN-07 (CARRIED FORWARD): MISSING -- WCAG AAA Contrast Validation

**Impact: HIGH**

With per-component token overrides, the risk of inaccessible color combinations increases dramatically. The Studio needs:
- A real-time contrast ratio indicator when the admin picks text-on-background colors
- Warning when contrast ratio falls below 7:1 (AAA) or 4.5:1 (AA minimum)
- Applied to: text vs surface, text vs primary, text vs secondary, button label vs button background

### CONCERN-08 (PREVIOUS -- RESOLVED): Runtime Theme Application

**Status: RESOLVED** -- `TenantThemeService.previewBranding()` applies CSS vars in real-time (line 13-15). `applyBranding()` applies CSS vars + PrimeNG semantic palette via `updatePreset()` (lines 7-11). The plan's use of `updatePreset({ components: { button: {...} } })` is an extension of this existing mechanism.

### CONCERN-09 (CARRIED FORWARD): EXTENDED -- Hover Scope for Component Catalog

**Status: EXTENDED** -- With the component catalog approach, per-component hover behaviour becomes a per-component token override rather than a global setting. The existing 5 hover types (button, card, input, nav, table row) should become settings within the respective component's settings panel rather than separate global controls. The plan should clarify:
- Are the 5 global hover controls retained in "Global Theme"?
- Can individual component hover be overridden separately in the component settings panel?
- If both exist, which takes precedence?

### CONCERN-10 (CARRIED FORWARD): MISSING -- `prefers-reduced-motion`

All 20 interactive component previews with animations must respect `@media (prefers-reduced-motion: reduce)`. This is especially important for the live preview panel showing hover effects.

### CONCERN-11 (CARRIED FORWARD): MISSING -- RTL Layout

The two-panel layout (sidebar left, preview right) must be mirrored for RTL. In RTL mode:
- Catalog sidebar should be on the right
- Preview/settings panel should be on the left
- All component previews must render correctly in RTL

### CONCERN-12 (NEW): CRITICAL -- `component_tokens` JSONB Column Requires New Migration + API Update

**Impact: CRITICAL**

The plan specifies storing per-component token overrides in a new `component_tokens` JSONB column in `tenant_branding`. This requires:

1. **New Flyway migration (V10+):** `ALTER TABLE tenant_branding ADD COLUMN component_tokens JSONB DEFAULT '{}'::jsonb;`
2. **Backend entity update:** Add `@Column(name = "component_tokens", columnDefinition = "jsonb")` to `TenantBrandingEntity.java`
3. **API contract update:** Extend `UpdateTenantBrandingRequest` to include `componentTokens` field
4. **Frontend model update:** Extend `TenantBranding` and `UpdateTenantBrandingRequest` interfaces
5. **Domain model update:** Add `componentTokens` to the Tenant Branding entity definition

**This is new data model work and must go through the BA -> SA -> DBA chain.**

### CONCERN-13 (NEW): HIGH -- JSONB Structure Definition Missing

**Impact: HIGH**

The plan says per-component overrides are stored in a `component_tokens` JSONB column but does not define the JSON structure. Questions:

1. What is the key structure? `{ "button": { "borderRadius": "8px", ... }, "card": { ... } }` ?
2. What are the valid keys per component? (PrimeNG has hundreds of design tokens per component)
3. How are component names mapped? PrimeNG uses `p-button`, but design token keys use `button`. Which convention?
4. What is the maximum size of this JSONB? (90 components x N tokens could be large)
5. Should there be validation on the JSONB structure?

**BA Recommendation:** Define a schema for the JSONB structure before SA designs the API contract. The schema should list:
- Top-level keys: PrimeNG component names (lowercase, no `p-` prefix)
- Per-component keys: A defined subset of PrimeNG design tokens (not all tokens -- only the ones exposed in the settings panel)
- Value types: CSS values (strings for colors, px values for dimensions)

### CONCERN-14 (NEW): MEDIUM -- Catalog Sidebar UX Details Missing

**Impact: MEDIUM**

The plan describes the catalog sidebar at a high level but lacks UX details:

1. **Category expansion:** Are categories expandable/collapsible? (Needed for 80+ items)
2. **Component count per category:** Should the category header show count (e.g., "Form (25)")?
3. **Search behaviour:** Does search filter across categories or within selected category?
4. **Empty search state:** What appears when search matches nothing?
5. **Selected state:** How is the currently selected component highlighted?
6. **Keyboard navigation:** Can users Tab/Arrow through the catalog list?
7. **Scroll behaviour:** The sidebar needs its own scroll independent of the main content

### CONCERN-15 (NEW): MEDIUM -- Preview Panel Content for Non-Top-20 Components

**Impact: MEDIUM**

The plan says remaining ~70 components have "a basic token editor with key CSS variable inputs." Questions:

1. What does "key CSS variable inputs" mean? Which variables per component?
2. Is there any preview at all for these components, or just raw token input fields?
3. How does the admin know what the token values will look like without a preview?
4. Should there be a generic "component preview" (perhaps a static screenshot or placeholder)?

### CONCERN-16 (NEW): MEDIUM -- Save Granularity

**Impact: MEDIUM**

With per-component overrides added to the save flow:

1. Does "Save" in the Studio save BOTH global theme AND all component overrides in one API call?
2. Or does each component have its own save action?
3. Can the admin reset a single component's overrides back to global defaults?
4. Is there an "undo" or "revert" per component?

### CONCERN-17 (NEW): LOW -- Performance of 20 Interactive Angular Previews

**Impact: LOW**

Rendering 20 full interactive Angular component previews with all variants (e.g., Button: Main, Outlined, Text, Link, Icon-only, 4 sizes, 7 severity states = potentially 56 preview instances just for Button) could impact performance. The plan should consider:

1. Lazy rendering: only render the preview for the currently selected component
2. Virtual scrolling within the preview panel if variant list is long
3. Debouncing token changes to avoid excessive `updatePreset()` calls

---

## 6. Contradictions Between Requirements Documents

| Document A | Document B | Contradiction | Resolution Needed |
|-----------|-----------|---------------|-------------------|
| RBAC-REQ: `custom_branding` is Enterprise-only (line 259) | ON-PREM-REQ: Custom Branding is Professional+ (line 267) | Tier threshold differs (Enterprise vs Professional+) | Clarify with PO |
| ON-PREM-REQ: `Custom Branding Enabled` is per-tenant boolean (line 142) | RBAC-REQ: Tier-based feature gating | Two different gating mechanisms | Clarify: does on-premise boolean supersede tier? |
| RBAC-REQ BR-152: Feature hidden (invisible) | RBAC-REQ AC-2 line 688: "greyed out with upgrade prompt" | Invisible vs greyed out | Clarify for Branding tab specifically |
| **REVISED PLAN: "No tier gating -- all tenants"** | **ALL requirements docs** | Plan contradicts all documented requirements | **PO must confirm** |

---

## 7. Existing Implementation Inventory (What Must Be Preserved)

| Component | Path | What Exists | Disposition in Revised Plan |
|-----------|------|-------------|---------------------------|
| `TenantBrandingForm` interface | `administration.models.ts` lines 150-172 | 21 fields for global branding | PRESERVE -- becomes the "Global Theme" form model |
| `createDefaultBrandingForm()` | `administration.models.ts` lines 174-198 | Default values matching backend entity defaults | PRESERVE |
| Branding tab HTML | `tenant-manager-section.component.html` lines 192-498 | Full form: color pickers, sliders, presets, hover selects, custom CSS, preview | REPLACE -- content becomes "Global Theme" right panel when "Global Theme" is selected in sidebar |
| Branding preset methods | `tenant-manager-section.component.ts` lines 519-566 | 4 presets: neumorph, aqua, sand, slate | PRESERVE -- presets apply to Global Theme |
| `saveBranding()` | `tenant-manager-section.component.ts` lines 573-608 | API persist + localStorage fallback | EXTEND -- must also save `component_tokens` |
| `syncBrandingFormFromSelection()` | `tenant-manager-section.component.ts` lines 610-622 | Load branding from API when tenant selected | EXTEND -- must also load `component_tokens` |
| `TenantThemeService` | `frontend/src/app/core/theme/tenant-theme.service.ts` | `applyBranding()` and `previewBranding()` | EXTEND -- must support per-component `updatePreset()` |
| `TenantBrandingEntity` | `backend/tenant-service/.../entity/TenantBrandingEntity.java` | 23 fields for global branding | EXTEND -- add `component_tokens` JSONB field |
| V1 migration (base table) | `V1__create_tenant_tables.sql` lines 83-95 | `tenant_branding` with 9 base columns | PRESERVE |
| V9 migration (neumorphic) | `V9__add_tenant_branding_neumorphic_fields.sql` | 14 neumorphic columns + 8 CHECK constraints | PRESERVE |
| `TenantBranding` interface | `frontend/src/app/core/api/models.ts` lines 267-292 | 22 readonly fields | EXTEND -- add `componentTokens` |
| `UpdateTenantBrandingRequest` interface | `models.ts` lines 294-316 | 17 optional fields | EXTEND -- add `componentTokens` |
| Hover type unions | `models.ts` lines 261-265 | 5 hover type aliases | PRESERVE |
| API methods | `api-gateway.service.ts` lines 290-304 | `getTenantBranding()`, `updateTenantBranding()` | PRESERVE (no API change needed if JSONB is included in existing endpoints) |

---

## 8. Global Theme Panel Completeness Check

The plan says "When Global Theme selected: existing global branding form." Verified against current HTML template:

| Control Group | Controls | Lines in Current HTML | In Revised Plan? |
|---------------|----------|----------------------|-----------------|
| Asset URLs | logoUrl, faviconUrl, loginBackgroundUrl | 229-259 | VERIFY -- not explicitly mentioned |
| Colors (4) | primary, secondary, surface, text | 262-300 | Yes |
| Shadow Colors (2) | shadowDark, shadowLight | 302-320 | Yes |
| Font Family | fontFamily text input | 322-330 | Yes |
| Range Sliders (3) | cornerRadius (0-40), buttonDepth (0-30), shadowIntensity (0-100) | 332-366 | Yes |
| Toggles (2) | softShadows, compactNav | 369-388 | Yes |
| Hover Selects (5) | button, card, input, nav, tableRow selectbuttons | 390-457 | Yes |
| Custom CSS | textarea | 459-468 | VERIFY -- not explicitly mentioned |
| Preset Row (4) | neumorph, aqua, sand, slate buttons | 213-226 | Yes (presets mentioned) |
| Preview Panel | CSS-var-driven mini preview | 470-497 | VERIFY -- does Global Theme still have a preview? Or does the right panel replace it? |

**BA Recommendation:** The plan SHOULD explicitly state that all existing controls are retained in the "Global Theme" panel. Asset URLs (logo, favicon, login background), Custom CSS textarea, and the mini preview panel must not be dropped.

---

## 9. Sign-Off

**CONDITIONAL SIGN-OFF: Requirements validated with 4 CRITICAL/HIGH new concerns on top of carried-forward concerns.**

### Blocking Concerns (Must Resolve Before SA/DEV)

| Priority | Concern | Resolution Required |
|----------|---------|-------------------|
| **CRITICAL** | CONCERN-01: License gating contradicted by "no tier gating" decision | PO must confirm: update requirements docs OR add tier gating to plan |
| **CRITICAL** | CONCERN-12: `component_tokens` JSONB requires new migration + API contract + entity update | Must go through BA -> SA -> DBA chain; SA must define JSONB schema |
| **HIGH** | CONCERN-13: JSONB structure for per-component tokens undefined | BA must define component token schema (keys, valid values, size constraints) |
| **HIGH** | CONCERN-07: WCAG AAA contrast validation missing for custom colors | Must include contrast checker in Studio |

### Non-Blocking Concerns (Should Address During Implementation)

| Priority | Concern | Recommendation |
|----------|---------|---------------|
| **MEDIUM** | CONCERN-14: Catalog sidebar UX details (categories, search, keyboard) | UX agent should produce wireframe |
| **MEDIUM** | CONCERN-15: Non-Top-20 component preview content | Define what "basic token editor" shows |
| **MEDIUM** | CONCERN-16: Save granularity (single save vs per-component) | Decide: single API call recommended |
| **MEDIUM** | CONCERN-09: Hover scope overlap (global vs per-component) | Define precedence rule |
| **MEDIUM** | CONCERN-06: Verify faviconUrl, loginBackgroundUrl, customCss retained | Confirm these are in "Global Theme" panel |
| **LOW** | CONCERN-17: Performance of 20 interactive previews | Use lazy rendering |
| **LOW** | CONCERN-10: `prefers-reduced-motion` for preview animations | Add media query |
| **LOW** | CONCERN-11: RTL layout for two-panel Studio | Mirror sidebar/preview |
| **LOW** | CONCERN-53 (RTM-53): Top 20 component list not specified | Use recommended list from Section 4.2 |

### Conditions for Proceeding to SA

The plan can proceed to SA after:

1. **PO confirms license gating decision** -- Either "all tenants" is approved (and requirements docs updated) or tier gating is added to the plan
2. **BA defines `component_tokens` JSONB schema** -- Structure, valid keys per component, value types, size constraints
3. **Top 20 component list is specified** -- Which 20 get full previews
4. **Existing Global Theme controls confirmed retained** -- faviconUrl, loginBackgroundUrl, customCss, preview panel

---

**BA Agent:** SDLC Orchestration Agent (BA role)
**Principles Version:** BA-PRINCIPLES.md v1.1.0
**Key Constraints Applied:**
1. Define business objects first -- flagged new `component_tokens` entity attribute needing BA -> SA -> DBA chain (CONCERN-12, CONCERN-13)
2. Traceability required -- Extended RTM with 15 new entries (RTM-50 through RTM-65) covering component catalog requirements
3. No implementation details -- Focused on WHAT the catalog displays, not HOW tokens are stored or rendered

---

# BA Sign-Off: Master Definitions (Object Types)

**Date:** 2026-03-04
**Feature:** Master Definitions -- Object Types administration section
**BA Agent Version:** BA-PRINCIPLES.md v1.1.0
**Status:** APPROVED

---

## 1. Requirements Sources Reviewed

| Source | Path | Relevance |
|--------|------|-----------|
| RBAC & Licensing Requirements | `docs/requirements/RBAC-LICENSING-REQUIREMENTS.md` | CRITICAL -- Master Definitions is dock position 4, SUPER_ADMIN-only (BR-044, lines 399, 514, 590, 634, 1087) |
| On-Premise Licensing Requirements | `docs/requirements/ON-PREMISE-LICENSING-REQUIREMENTS.md` | LOW -- No specific mention of Object Types or definitions beyond general feature gating |
| Graph-per-Tenant Requirements | `docs/requirements/GRAPH-PER-TENANT-REQUIREMENTS.md` | MEDIUM -- Defines tenant-scoped graph data patterns; references ProcessDefinition but not ObjectType specifically |
| Auth Providers Requirements | `docs/requirements/AUTH-PROVIDERS-REQUIREMENTS.md` | LOW -- No Object Type references |
| Business Domain Model | `docs/data-models/domain-model.md` | HIGH -- Current model does NOT include ObjectType or definition entities; this is new domain content |
| DDA Definition Tables (migration 019) | `dda-process-analyst-analysis/backend/migrations/019_create_definition_tables.sql` | CRITICAL -- Source schema: definition_object_types, definition_attribute_types, definition_object_symbols, definition_relationship_types, definition_model_types, junction tables |
| DDA Seed Data (migration 020) | `dda-process-analyst-analysis/backend/migrations/020_seed_default_definitions.sql` | HIGH -- 12 default object symbols, 12 default object types, 24 default attribute types, 14 default relationship types, 8 model types |
| DDA Status/Code Migration (migration 051) | `dda-process-analyst-analysis/backend/migrations_pending/051_add_object_type_status_code.sql` | HIGH -- Adds `status` (active/planned/hold/retired) and `code` (OBJ_NNN auto-generated) columns |
| DDA Icon Color Migration (migration 063) | `dda-process-analyst-analysis/backend/migrations_pending/063_add_object_type_icon_color.sql` | HIGH -- Adds `icon_name` (lucide) and `icon_color` (hex) columns directly on object_types |
| DDA TypeScript Types | `dda-process-analyst-react/src/components/Definitions/types.ts` | HIGH -- Full type system: ObjectType, ObjectSymbol, AttributeType, RelationshipType, ModelType, DefinitionState, ObjectTypeStatus, ValidationRules, FormData interfaces |
| DDA ObjectType Wizard | `dda-process-analyst-react/src/pages/ObjectTypeWizard/` | HIGH -- 4-step wizard: StepBasicInfo (name, description, icon, icon color), StepConnections (relationship type, direction, target), StepAttributes (attribute type, required, display order), StepStatus (active/planned/hold/retired) |
| Existing EMSIST Placeholder | `frontend/src/app/features/administration/sections/master-definitions/` | HIGH -- Placeholder component exists with dummy DefinitionType data (id, name, description, propertyCount, updatedAt); already wired into administration.page at dock position 4 |
| Existing Administration Models | `frontend/src/app/features/administration/models/administration.models.ts` | HIGH -- AdminSection type includes 'master-definitions'; DefinitionType interface exists (lines 100-106) but is a simplified stub |
| Open Issues | `docs/issues/open/` | REVIEWED -- No existing issues reference Object Types or Master Definitions specifically |

---

## 2. Requirements Traceability Matrix (RTM)

### 2.1 Requirements from RBAC-LICENSING-REQUIREMENTS.md

| ID | Requirement | Source Reference | Plan Coverage | Status |
|----|-------------|------------------|---------------|--------|
| RTM-MD-01 | Master Definitions is the 4th dock section in the administration page | RBAC-REQ line 399, 514 | **COVERED** -- Plan places the feature in the existing pre-wired `master-definitions` placeholder at dock position 4 | **COVERED** |
| RTM-MD-02 | Master Definitions is restricted to SUPER_ADMIN only (BR-044) | RBAC-REQ line 634, 1087 | **COVERED** -- The administration page already gates section visibility by role; Master Definitions shows "Denied" for ADMIN and below (line 1087). No additional authorization logic needed in the plan because the dock-level guard already exists | **COVERED** |
| RTM-MD-03 | ADMIN role is denied access to Master Definitions | RBAC-REQ line 590 | **COVERED** -- Same dock-level guard as RTM-MD-02. Plan inherits this from existing infrastructure | **COVERED** |
| RTM-MD-04 | SUPER_ADMIN can manage definitions (full CRUD) | RBAC-REQ line 499 ("manage the entire platform including ... definitions") | **COVERED** -- Plan includes CRUD operations for ObjectType with list, create (wizard), detail/edit views | **COVERED** |
| RTM-MD-05 | All five dock sections visible to SUPER_ADMIN including Master Definitions | RBAC-REQ lines 394-400, US-002a AC-1 | **COVERED** -- Placeholder already renders at position 4; plan replaces placeholder content with functional ObjectType management | **COVERED** |

### 2.2 Multi-Tenancy Requirements

| ID | Requirement | Source Reference | Plan Coverage | Status |
|----|-------------|------------------|---------------|--------|
| RTM-MD-06 | Tenant isolation via `tenantId` property on every graph node | Plan specification + auth-facade UserNode pattern | **COVERED** -- Plan specifies `tenantId` property on ObjectType, AttributeType, ObjectSymbol nodes in Neo4j, matching the existing `UserNode` pattern in auth-facade | **COVERED** |
| RTM-MD-07 | Each tenant's definitions are isolated from other tenants | EMSIST multi-tenancy standard | **COVERED** -- All queries filter by tenantId; CAN_CONNECT_TO, HAS_ATTRIBUTE, HAS_SYMBOL relationships are tenant-scoped | **COVERED** |
| RTM-MD-08 | Default/seed definitions are available to all tenants | DDA migration 020 pattern (12 default object types, 24 attribute types) | **PARTIALLY COVERED** -- Plan describes `state: default` for seed data but does not explicitly describe how seed data is provisioned per tenant. Two approaches: (a) global seed data shared via `state=default` marker, (b) per-tenant copy on first access. Plan should clarify | **CONCERN (non-blocking)** |

### 2.3 CRUD Operations for ObjectType

| ID | Requirement | Source Reference | Plan Coverage | Status |
|----|-------------|------------------|---------------|--------|
| RTM-MD-09 | List all ObjectTypes for the current tenant | DDA DefinitionCatalogPage + plan specification | **COVERED** -- Table list view as default with card toggle | **COVERED** |
| RTM-MD-10 | Create ObjectType via 4-step wizard (Basic Info, Connections, Attributes, Status) | DDA ObjectTypeWizard (4 steps) + plan specification | **COVERED** -- Plan specifies PrimeNG p-stepper 4-step wizard matching DDA's structure | **COVERED** |
| RTM-MD-11 | Edit existing ObjectType | DDA DefinitionEditModal + plan specification | **COVERED** -- Detail view with right-panel split-grid pattern | **COVERED** |
| RTM-MD-12 | Delete ObjectType | DDA ROW_ACTIONS includes delete (requiresZeroInstances=true) | **COVERED** -- Plan includes delete. DDA pattern requires zero linked instances before deletion, which is a business rule the plan should carry forward | **COVERED** |
| RTM-MD-13 | Duplicate ObjectType | DDA ROW_ACTIONS includes duplicate | **NOT EXPLICITLY COVERED** -- Plan does not mention duplicate/clone action. DDA supports it for all states | **MISSING (non-blocking)** |
| RTM-MD-14 | Restore customized ObjectType to default | DDA ROW_ACTIONS includes restore for state=customized | **NOT EXPLICITLY COVERED** -- Plan does not mention restore-to-default action | **MISSING (non-blocking)** |
| RTM-MD-15 | View ObjectType Fact Sheet (read-only detail) | DDA ObjectTypeFactSheetPage | **PARTIALLY COVERED** -- Plan describes a detail view but does not distinguish between view-only fact sheet and editable form. DDA has both | **PARTIAL** |

### 2.4 Attribute Management (HAS_ATTRIBUTE Relationship)

| ID | Requirement | Source Reference | Plan Coverage | Status |
|----|-------------|------------------|---------------|--------|
| RTM-MD-16 | ObjectType has attributes via HAS_ATTRIBUTE relationship | DDA migration 019 (definition_object_default_attributes junction), plan specification | **COVERED** -- Plan specifies HAS_ATTRIBUTE relationship with properties: isRequired, displayOrder | **COVERED** |
| RTM-MD-17 | Attributes have: attributeKey, name, dataType, attributeGroup, description, defaultValue, validationRules | DDA types.ts AttributeType interface | **COVERED** -- Plan lists all required attribute properties including validationRules as JSON | **COVERED** |
| RTM-MD-18 | Supported data types: string, text, integer, float, boolean, date, datetime, enum, json | DDA migration 019 data_type column + plan specification | **COVERED** -- Plan lists all 9 data types | **COVERED** |
| RTM-MD-19 | Attributes can be marked as required or optional (isRequired) | DDA migration 019 is_required column on junction table | **COVERED** -- Plan includes isRequired as relationship property | **COVERED** |
| RTM-MD-20 | Attributes have display ordering (displayOrder) | DDA migration 019 display_order column on junction table | **COVERED** -- Plan includes displayOrder as relationship property | **COVERED** |
| RTM-MD-21 | Validation rules stored as JSON (min, max, pattern, enum_values) | DDA types.ts ValidationRules interface | **COVERED** -- Plan specifies validationRules as JSON property | **COVERED** |

### 2.5 Connection Management (CAN_CONNECT_TO Relationship)

| ID | Requirement | Source Reference | Plan Coverage | Status |
|----|-------------|------------------|---------------|--------|
| RTM-MD-22 | ObjectTypes can connect to other ObjectTypes via CAN_CONNECT_TO | Plan specification + DDA definition_relationship_types table | **COVERED** -- Plan specifies CAN_CONNECT_TO relationship between ObjectType nodes | **COVERED** |
| RTM-MD-23 | Connection properties: relationshipKey, activeName, passiveName | DDA migration 019 definition_relationship_types columns | **COVERED** -- Plan lists all connection properties | **COVERED** |
| RTM-MD-24 | Cardinality: one-to-one, one-to-many, many-to-many | DDA migration 019 cardinality column (1:1, 1:n, n:m) | **COVERED** -- Plan lists all three cardinality options | **COVERED** |
| RTM-MD-25 | isDirected property on connections | DDA migration 019 is_directed column | **COVERED** -- Plan includes isDirected boolean | **COVERED** |
| RTM-MD-26 | Connection direction: outgoing or incoming | DDA WizardConnection interface (direction: 'outgoing' or 'incoming') | **COVERED** -- Plan wizard Step 2 (Connections) includes direction selection | **COVERED** |

### 2.6 Status Lifecycle

| ID | Requirement | Source Reference | Plan Coverage | Status |
|----|-------------|------------------|---------------|--------|
| RTM-MD-27 | ObjectType status: active, planned, hold, retired | DDA migration 051 + DDA StepStatus STATUS_OPTIONS + plan specification | **COVERED** -- Plan lists all four status values; wizard Step 4 handles status selection | **COVERED** |
| RTM-MD-28 | Default status for new ObjectType is 'active' | DDA migration 051 (DEFAULT 'active') | **COVERED** -- Consistent with DDA behavior | **COVERED** |
| RTM-MD-29 | Status transitions follow logical lifecycle (active can go to hold or retired; planned can go to active or retired) | DDA StepStatus -- no explicit transition rules enforced | **NOT SPECIFIED** -- Neither DDA nor the plan enforce transition rules. DDA allows free status selection. This is acceptable for an admin tool -- no blocking concern | **ACCEPTABLE** |

### 2.7 State Types (Three-State Model)

| ID | Requirement | Source Reference | Plan Coverage | Status |
|----|-------------|------------------|---------------|--------|
| RTM-MD-30 | State types: default, customized, user_defined | DDA migration 019 (CHECK constraint on state column) + plan specification | **COVERED** -- Plan specifies all three state types | **COVERED** |
| RTM-MD-31 | Default definitions cannot be deleted (only customized or restored) | DDA ROW_ACTIONS -- delete allowed for all states but requiresZeroInstances; restore only for customized | **PARTIALLY COVERED** -- Plan does not explicitly mention state-specific action restrictions. DDA allows delete for default state types if zero instances. Plan should clarify whether default-state items can be deleted | **CONCERN (non-blocking)** |
| RTM-MD-32 | Editing a default definition changes its state to 'customized' | DDA state management pattern (original_id references) | **NOT EXPLICITLY COVERED** -- Plan does not describe state transition on edit. DDA uses `original_id` to track which default was customized. Plan should clarify | **CONCERN (non-blocking)** |

### 2.8 ObjectSymbol Management (HAS_SYMBOL Relationship)

| ID | Requirement | Source Reference | Plan Coverage | Status |
|----|-------------|------------------|---------------|--------|
| RTM-MD-33 | ObjectType has an associated symbol via HAS_SYMBOL relationship | Plan specification + DDA symbol_id FK | **COVERED** -- Plan specifies HAS_SYMBOL relationship | **COVERED** |
| RTM-MD-34 | Symbols have: name, symbolKey, iconType (lucide/svg/image_url), iconData | DDA migration 019 definition_object_symbols columns | **COVERED** -- Plan covers symbol properties | **COVERED** |
| RTM-MD-35 | ObjectType also has direct iconName and iconColor properties | DDA migration 063 (icon_name, icon_color on object_types table) | **COVERED** -- Plan lists iconName (lucide icon name) and iconColor (hex color) as ObjectType properties | **COVERED** |
| RTM-MD-36 | Icon picker with common lucide icons in wizard Step 1 | DDA StepBasicInfo COMMON_ICONS array (48 icons) + COLOR_PRESETS array (19 colors) | **COVERED** -- Plan wizard includes icon and color selection in Step 1 (Basic Info) | **COVERED** |

### 2.9 Subtype Hierarchy (IS_SUBTYPE_OF Relationship)

| ID | Requirement | Source Reference | Plan Coverage | Status |
|----|-------------|------------------|---------------|--------|
| RTM-MD-37 | ObjectType can have a parent type via IS_SUBTYPE_OF relationship | Plan specification + DDA super_type_id FK (migration 019) | **COVERED** -- Plan specifies IS_SUBTYPE_OF relationship | **COVERED** |
| RTM-MD-38 | Subtype inherits attributes from parent type | Implied by IS_SUBTYPE_OF semantics | **NOT SPECIFIED** -- Neither DDA nor plan explicitly define attribute inheritance behavior. This is a design decision for SA agent | **DEFERRED TO SA** |

### 2.10 Admin Access Control

| ID | Requirement | Source Reference | Plan Coverage | Status |
|----|-------------|------------------|---------------|--------|
| RTM-MD-39 | Only SUPER_ADMIN can access Master Definitions | RBAC-REQ BR-044, line 1087 | **COVERED** -- Inherited from existing dock-level guard. Plan does not need additional authorization logic | **COVERED** |
| RTM-MD-40 | ADMIN, MANAGER, USER, VIEWER roles denied | RBAC-REQ US-002b AC-1 (line 590) | **COVERED** -- Inherited from existing infrastructure | **COVERED** |

### 2.11 WCAG AAA Compliance

| ID | Requirement | Source Reference | Plan Coverage | Status |
|----|-------------|------------------|---------------|--------|
| RTM-MD-41 | WCAG AAA compliance (7:1+ contrast ratio) | EMSIST standard | **COVERED** -- Plan uses PrimeNG DataView and p-stepper components which inherit ThinkPlus preset with WCAG AAA contrast ratios. Custom icon color picker should warn on low contrast | **COVERED** |
| RTM-MD-42 | Keyboard navigation for all interactive elements | EMSIST standard | **COVERED** -- PrimeNG components provide built-in keyboard navigation. Wizard stepper, table, card toggle all have keyboard support out of the box | **COVERED** |
| RTM-MD-43 | Arabic RTL layout support | EMSIST standard (BA responsibility) | **NOT EXPLICITLY COVERED** -- Plan does not mention RTL considerations for the split-grid detail view or wizard steps. PrimeNG components support RTL natively, but custom layout CSS must be RTL-aware | **CONCERN (non-blocking)** |

### 2.12 Card/Table Toggle (EMSIST Standard)

| ID | Requirement | Source Reference | Plan Coverage | Status |
|----|-------------|------------------|---------------|--------|
| RTM-MD-44 | Default list view is Table (DataView) | EMSIST standard + plan specification | **COVERED** -- Plan specifies table as default view | **COVERED** |
| RTM-MD-45 | Card toggle available via signal-based toggle | EMSIST standard (signal<'grid' or 'table'>('table') pattern) | **COVERED** -- Plan specifies signal-based toggle matching existing pattern used in tenant-manager | **COVERED** |
| RTM-MD-46 | Empty state shown when no definitions exist for the tenant | EMSIST standard | **NOT EXPLICITLY COVERED** -- Plan does not describe the empty state. Should show a message like "No object types defined. Create your first type." with a call-to-action button | **CONCERN (non-blocking)** |

### 2.13 DDA Features NOT in Plan (Scope Gap Analysis)

| ID | DDA Feature | Source | In Plan? | Assessment |
|----|-------------|--------|----------|------------|
| RTM-MD-47 | Model Types (definition_model_types) -- containers that define which object types and relationship types are allowed | DDA migration 019, 020 | **NOT IN PLAN** -- Plan scope is limited to Object Types, not Model Types | **ACCEPTABLE** -- Model Types can be a future phase; Object Types are independently useful |
| RTM-MD-48 | Definition Catalog page with tabbed navigation across all definition types | DDA DefinitionCatalogPage.tsx | **NOT IN PLAN** -- Plan focuses only on Object Types sub-section | **ACCEPTABLE** -- Can extend to full catalog later |
| RTM-MD-49 | Merge action (merge one ObjectType into another) | DDA ROW_ACTIONS merge action | **NOT IN PLAN** | **ACCEPTABLE** -- Advanced feature for future phase |
| RTM-MD-50 | Object Instance linking (instance_count tracking) | DDA types.ts instance_count on ObjectType | **NOT IN PLAN** -- Object instances are a separate feature domain | **ACCEPTABLE** -- Instances are operational data, not definition metadata |
| RTM-MD-51 | Batch attribute management (owned attributes/connections) | DDA migration 086 (owned_attributes_connections) | **NOT IN PLAN** | **ACCEPTABLE** -- Can be added later |

---

## 3. Confirmed Scope (Items Validated as Correct)

The following plan items are confirmed as consistent with DDA source material and EMSIST requirements:

1. **New `definition-service` on port 8090** -- No port conflict with existing services (8080-8089 used). A dedicated microservice is consistent with EMSIST's service-per-domain architecture. Uses Spring Data Neo4j, consistent with the graph-oriented nature of definitions (ObjectType nodes, relationship edges).

2. **Neo4j graph model** -- ObjectType, AttributeType, ObjectSymbol as nodes with HAS_ATTRIBUTE, CAN_CONNECT_TO, HAS_SYMBOL, IS_SUBTYPE_OF relationships. This maps directly to DDA's relational schema (migrations 019, 020, 051, 063) but expressed as a native graph model rather than junction tables. Neo4j is the correct choice for modeling type hierarchies and connection graphs.

3. **Tenant isolation via `tenantId` property** -- Matches the existing `UserNode` pattern in auth-facade. DDA's original schema is single-tenant (no tenant column); the plan correctly adds tenant scoping for EMSIST's multi-tenant requirements.

4. **Frontend placement in existing `master-definitions` placeholder** -- The placeholder component already exists at `frontend/src/app/features/administration/sections/master-definitions/master-definitions-section.component.ts` (line 17) with dock position 4. The plan replaces the dummy content with functional ObjectType management.

5. **4-step wizard using PrimeNG p-stepper** -- Directly maps to DDA's ObjectTypeWizard: Step 1 (Basic Info: name, description, icon, color), Step 2 (Connections), Step 3 (Attributes), Step 4 (Status). PrimeNG's p-stepper is the correct equivalent of DDA's custom React stepper.

6. **Table list with card toggle** -- Matches EMSIST standard pattern (signal-based toggle). DDA uses a table-only view; the plan improves on this by adding the card view toggle.

7. **Detail view with right-panel split-grid** -- Matches the tenant-manager pattern. DDA uses a full-page FactSheet; the plan adapts this to EMSIST's embedded split-grid UX.

8. **Status lifecycle values** -- `active`, `planned`, `hold`, `retired` -- exact match with DDA (migration 051, StepStatus.tsx).

9. **State types** -- `default`, `customized`, `user_defined` -- exact match with DDA (migration 019 CHECK constraint).

10. **SUPER_ADMIN-only access** -- Correctly inherits from existing RBAC dock-level guard (RBAC-REQ BR-044, line 1087).

---

## 4. DDA-to-EMSIST Data Model Mapping

The plan proposes a Neo4j graph model. Below is the mapping from DDA's relational schema to the proposed graph model:

| DDA Relational (PostgreSQL) | EMSIST Graph (Neo4j) | Notes |
|---------------------------|---------------------|-------|
| `definition_object_types` table | `ObjectType` node | Add `tenantId` property; keep `name`, `typeKey`, `code`, `description`, `iconName`, `iconColor`, `status`, `state` |
| `definition_attribute_types` table | `AttributeType` node | Add `tenantId`; keep `attributeKey`, `name`, `dataType`, `attributeGroup`, `description`, `defaultValue`, `validationRules` |
| `definition_object_symbols` table | `ObjectSymbol` node | Add `tenantId`; keep `name`, `symbolKey`, `iconType`, `iconData`, `description`, `state` |
| `definition_object_default_attributes` junction | `HAS_ATTRIBUTE` relationship (ObjectType->AttributeType) | Properties: `isRequired`, `displayOrder` |
| `definition_relationship_types` table + source/target FKs | `CAN_CONNECT_TO` relationship (ObjectType->ObjectType) | Properties: `relationshipKey`, `activeName`, `passiveName`, `cardinality`, `isDirected` |
| `symbol_id` FK on object_types | `HAS_SYMBOL` relationship (ObjectType->ObjectSymbol) | One-to-one |
| `super_type_id` FK on object_types | `IS_SUBTYPE_OF` relationship (ObjectType->ObjectType) | One-to-one (child to parent) |

---

## 5. Business Rules Catalog

| ID | Rule | Entities Affected | Source |
|----|------|-------------------|--------|
| BR-MD-001 | Only SUPER_ADMIN role can access Master Definitions section | All definition entities | RBAC-REQ BR-044 |
| BR-MD-002 | Each ObjectType must have a unique `typeKey` within the tenant | ObjectType | DDA migration 019 (UNIQUE on type_key); plan must scope uniqueness to tenantId |
| BR-MD-003 | ObjectType `code` is auto-generated in format OBJ_NNN | ObjectType | DDA migration 051 (trigger generate_object_type_code) |
| BR-MD-004 | ObjectType `status` must be one of: active, planned, hold, retired | ObjectType | DDA migration 051 (CHECK constraint) |
| BR-MD-005 | ObjectType `state` must be one of: default, customized, user_defined | ObjectType, AttributeType, ObjectSymbol | DDA migration 019 (CHECK constraint) |
| BR-MD-006 | Editing a default-state item should change its state to 'customized' and set `originalId` reference | ObjectType, AttributeType, ObjectSymbol | DDA original_id FK pattern |
| BR-MD-007 | Deleting an ObjectType is only permitted when it has zero linked object instances | ObjectType | DDA ROW_ACTIONS (requiresZeroInstances: true) |
| BR-MD-008 | Default ObjectType status for newly created types is 'active' | ObjectType | DDA migration 051 (DEFAULT 'active') |
| BR-MD-009 | AttributeType `dataType` must be one of: string, text, integer, float, boolean, date, datetime, enum, json | AttributeType | DDA migration 019 + plan specification |
| BR-MD-010 | CAN_CONNECT_TO `cardinality` must be one of: one-to-one, one-to-many, many-to-many | CAN_CONNECT_TO relationship | DDA migration 019 (1:1, 1:n, n:m) |
| BR-MD-011 | IconColor must be a valid hex color code | ObjectType | DDA migration 063 (VARCHAR(20) for icon_color) |
| BR-MD-012 | Seed/default definitions should be available to every tenant upon first access | All definition entities | DDA migration 020 seeding pattern |
| BR-MD-013 | Attribute assignment (`HAS_ATTRIBUTE`) display order must be a positive integer | HAS_ATTRIBUTE relationship | DDA migration 019 (display_order INTEGER DEFAULT 0) |

---

## 6. Flagged Concerns

### CONCERN-MD-01: Non-Blocking -- Seed Data Provisioning Strategy Undefined

**Impact: MEDIUM**

The plan specifies `state: default` for seed definitions but does not define how seed data reaches each tenant's graph space in Neo4j. DDA uses PostgreSQL migration scripts to insert seed data once into a shared table. In EMSIST's multi-tenant Neo4j model, two strategies exist:

1. **Copy-on-create:** When a new tenant is provisioned, the definition-service copies all default ObjectTypes, AttributeTypes, and ObjectSymbols into the tenant's graph space with `state=default` and the tenant's `tenantId`. This ensures complete tenant isolation.
2. **Shared defaults with tenant overlay:** Default definitions are stored once (e.g., with `tenantId=SYSTEM`) and each tenant can create `customized` or `user_defined` overrides. Queries merge system defaults with tenant-specific records.

**BA Recommendation:** Strategy 1 (copy-on-create) is simpler and maintains strict tenant isolation. Strategy 2 saves storage but adds query complexity. The SA agent should decide.

### CONCERN-MD-02: Non-Blocking -- Duplicate and Restore Actions Missing from Plan

**Impact: LOW**

DDA supports "Duplicate" (clone an ObjectType) and "Restore Default" (revert a customized item to its original state) actions. The plan does not mention these. They are non-essential for MVP but should be on the backlog.

### CONCERN-MD-03: Non-Blocking -- Empty State Not Described

**Impact: LOW**

The plan does not describe what the list view shows when a tenant has zero ObjectTypes (before seed data or after deleting all). EMSIST standard requires an empty state with a call-to-action.

### CONCERN-MD-04: Non-Blocking -- State Transition on Edit Not Specified

**Impact: LOW**

When an admin edits a `state=default` ObjectType, it should transition to `state=customized` and set `originalId` to the default's ID. This is the DDA pattern but the plan does not explicitly state it. The SA agent should include this in the technical design.

### CONCERN-MD-05: Non-Blocking -- RTL Layout for Split-Grid Detail View

**Impact: LOW**

The plan uses a right-panel split-grid pattern (same as tenant-manager). For Arabic RTL, the panel positions should mirror. PrimeNG's Splitter component supports `dir="rtl"` natively, but custom CSS must also be RTL-aware. This should be addressed during UX/DEV implementation.

### CONCERN-MD-06: Non-Blocking -- typeKey Uniqueness Scope

**Impact: MEDIUM**

DDA enforces `type_key` uniqueness globally (single-tenant app). In EMSIST, uniqueness must be scoped to `tenantId` -- two different tenants can have ObjectTypes with the same `typeKey`. The Neo4j uniqueness constraint must be a composite of `(tenantId, typeKey)`, not just `typeKey`. The SA/DBA agents must handle this.

### CONCERN-MD-07: Non-Blocking -- Model Types Excluded from Scope

**Impact: LOW**

DDA has a Model Types entity (definition_model_types) that defines which ObjectTypes and RelationshipTypes are allowed in specific model notations (BPMN, ArchiMate, etc.). The plan correctly excludes this from the current scope. It should be documented as a future phase in the backlog.

---

## 7. Requirements Gap Summary

| Category | Total | Covered | Partially Covered | Missing | Acceptable Exclusions |
|----------|-------|---------|-------------------|---------|----------------------|
| RBAC/Access Control | 5 | 5 | 0 | 0 | 0 |
| Multi-Tenancy | 3 | 2 | 1 | 0 | 0 |
| CRUD Operations | 7 | 4 | 1 | 2 | 0 |
| Attribute Management | 6 | 6 | 0 | 0 | 0 |
| Connection Management | 5 | 5 | 0 | 0 | 0 |
| Status Lifecycle | 3 | 2 | 0 | 0 | 1 |
| State Types | 3 | 1 | 1 | 1 | 0 |
| Symbol Management | 4 | 4 | 0 | 0 | 0 |
| Subtype Hierarchy | 2 | 1 | 0 | 0 | 1 |
| WCAG AAA | 3 | 2 | 0 | 1 | 0 |
| Card/Table Toggle | 3 | 2 | 0 | 1 | 0 |
| DDA Features Not in Plan | 5 | 0 | 0 | 0 | 5 |
| **TOTALS** | **49** | **34** | **3** | **5** | **7** |

- **34 COVERED** (69%) -- fully addressed by the plan
- **3 PARTIALLY COVERED** (6%) -- addressed but need clarification from SA
- **5 MISSING** (10%) -- not in plan, flagged as non-blocking concerns
- **7 ACCEPTABLE EXCLUSIONS** (14%) -- deliberately out of scope, no blocking impact

---

## 8. Sign-Off

**APPROVED -- Plan scope is complete for Object Types MVP. No blocking concerns.**

All 5 requirements from RBAC-LICENSING-REQUIREMENTS.md are fully covered. The 7 non-blocking concerns (CONCERN-MD-01 through CONCERN-MD-07) should be addressed by the SA agent during technical design or logged in the backlog for future phases.

### Items for SA Agent to Address

| Item | Concern | Decision Needed |
|------|---------|----------------|
| Seed data provisioning (copy-on-create vs shared defaults) | CONCERN-MD-01 | SA decides strategy |
| typeKey composite uniqueness constraint (tenantId + typeKey) | CONCERN-MD-06 | SA/DBA design constraint |
| State transition on edit (default -> customized + originalId) | CONCERN-MD-04 | SA includes in data model |
| IS_SUBTYPE_OF attribute inheritance behavior | RTM-MD-38 | SA defines inheritance rules |
| Empty state UX | CONCERN-MD-03 | UX agent designs |
| RTL split-grid layout | CONCERN-MD-05 | UX/DEV implement |
| Duplicate and Restore actions | CONCERN-MD-02 | Backlog for phase 2 |

### Conditions Met for SA Handoff

1. All RBAC requirements validated (BR-044 access control confirmed)
2. Business objects defined (ObjectType, AttributeType, ObjectSymbol)
3. All relationships documented (HAS_ATTRIBUTE, CAN_CONNECT_TO, HAS_SYMBOL, IS_SUBTYPE_OF)
4. Status lifecycle defined (active/planned/hold/retired)
5. State model defined (default/customized/user_defined)
6. 13 business rules catalogued (BR-MD-001 through BR-MD-013)
7. RTM covers 49 requirements across 12 categories
8. DDA-to-EMSIST data model mapping provided
9. Plan aligns with existing frontend placeholder and dock position 4

---

**BA Agent:** SDLC Orchestration Agent (BA role)
**Principles Version:** BA-PRINCIPLES.md v1.1.0
**Key Constraints Applied:**
1. Define business objects first -- ObjectType, AttributeType, ObjectSymbol entities defined with relationships and business rules before technical design
2. Traceability required -- RTM with 49 entries linking DDA source, RBAC requirements, and plan items
3. No implementation details -- Focused on WHAT the definitions represent and their business rules, not HOW they are stored or queried

---

# BA Sign-Off: service-registry (eureka) — Infrastructure Sealing

**Date:** 2026-03-06
**Feature:** Eureka Service Registry — final-stage sealing
**Agent:** ba (infrastructure verification — no business domain model required)
**Status:** APPROVED

## Scope

Infrastructure service only — no business logic, no domain model.
BA sign-off confirms infrastructure requirements are met.

## Requirements Verified

| Requirement | Source | Status |
|-------------|--------|--------|
| All active services must register with a service discovery mechanism | arc42/05, ADR-002 (Spring Cloud BOM) | ✅ Met |
| Service registry must expose a health endpoint for startup gating | DevOps healthcheck policy | ✅ Met — `/actuator/health` |
| Registry must gate all microservice startup ordering | docker-compose startup policy | ✅ Met — `condition: service_healthy` |
| Registry must not require persistence | Infrastructure principle | ✅ Met — in-memory registry, `register-with-eureka: false` |
| Must be included in Maven reactor build | Build reproducibility | ✅ Met — added to `backend/pom.xml` |

**Sign-off:** Infrastructure requirements satisfied. Ready for sealed runtime baseline.
