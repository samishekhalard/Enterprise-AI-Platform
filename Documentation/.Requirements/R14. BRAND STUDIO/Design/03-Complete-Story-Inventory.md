# R14 Complete Story Inventory -- Brand Studio

**Date:** 2026-03-23
**Scope:** Full tenant branding system
**Pattern:** `US-BS-{###}`

---

## Stories

### US-BS-01: Load Active Brand at Bootstrap

| Field | Content |
|-------|---------|
| **ID** | US-BS-01 |
| **Title** | Load Active Brand at Bootstrap |
| **As a** | tenant user or anonymous visitor |
| **I want** | the active tenant brand to load before the main UI settles |
| **So that** | the app feels consistently tenant-owned from first paint |
| **Acceptance Criteria** | 1. Tenant resolution returns active brand manifest. 2. Bootstrap applies active brand before final splash exit. 3. Login route receives the same active brand without a second inconsistent render. 4. Missing brand falls back to platform default. 5. Switching tenant context replaces prior theme completely. |
| **API Group** | `GET /api/tenants/resolve` or equivalent active-brand bootstrap endpoint |
| **Phase** | 1 |

### US-BS-02: Customize Login Experience

| Field | Content |
|-------|---------|
| **ID** | US-BS-02 |
| **Title** | Customize Login Experience |
| **As a** | tenant admin |
| **I want** | to configure login logo, background, and auth-shell look |
| **So that** | the sign-in experience is white-label and tenant-aware |
| **Acceptance Criteria** | 1. Login uses published tenant logo. 2. Login background can be configured from an approved asset. 3. Auth shell colors derive from active brand tokens. 4. Contrast and readability pass accessibility checks. 5. Missing optional assets use governed fallbacks. |
| **Phase** | 1 |

### US-BS-03: Manage Brand Assets

| Field | Content |
|-------|---------|
| **ID** | US-BS-03 |
| **Title** | Manage Brand Assets |
| **As a** | tenant admin |
| **I want** | to upload and manage logo in light, logo in dark, and login background |
| **So that** | brand assets are reliable and consistent everywhere |
| **Acceptance Criteria** | 1. Logos and login background can be uploaded, replaced, removed, and previewed. 2. Logo validation enforces SVG or PNG only with governed size limits. 3. Uploaded assets receive immutable identifiers/URLs. 4. Asset use is version-aware and auditable. 5. Favicon is not a direct user-managed input; backend/browser integration derives and renders it from the active logo set. |
| **Phase** | 1 |

### US-BS-04: Select Palette Pack

| Field | Content |
|-------|---------|
| **ID** | US-BS-04 |
| **Title** | Select Palette Pack |
| **As a** | tenant admin |
| **I want** | to choose a governed palette pack |
| **So that** | brand colors propagate safely without breaking contrast or component consistency |
| **Acceptance Criteria** | 1. Palette selection updates semantic tokens and derived component tokens. 2. Preview shows effect across representative components. 3. Invalid or unsafe combinations cannot be published. |
| **Phase** | 1 |

### US-BS-05: Select Typography Pack

| Field | Content |
|-------|---------|
| **ID** | US-BS-05 |
| **Title** | Select Typography Pack |
| **As a** | tenant admin |
| **I want** | to choose from approved typography packs |
| **So that** | text styling matches tenant identity without introducing licensing or performance risk |
| **Acceptance Criteria** | 1. Typography choices are from an approved catalog only. 2. Headings, body, inputs, and shell reflect the pack. 3. Fonts preload correctly and fall back safely. |
| **Phase** | 1 |

### US-BS-06: Live Preview Brand Draft

| Field | Content |
|-------|---------|
| **ID** | US-BS-06 |
| **Title** | Live Preview Brand Draft |
| **As a** | tenant admin |
| **I want** | a safe preview of my current draft |
| **So that** | I can evaluate the effect before publishing |
| **Acceptance Criteria** | 1. Preview affects only the editor session. 2. Preview covers login, shell, and representative governed components. 3. Exiting preview restores active branding. |
| **Phase** | 1 |

### US-BS-07: Save Draft

| Field | Content |
|-------|---------|
| **ID** | US-BS-07 |
| **Title** | Save Brand Draft |
| **As a** | tenant admin |
| **I want** | to save unfinished branding work without activating it |
| **So that** | I can iterate safely |
| **Acceptance Criteria** | 1. Save stores a draft revision only. 2. Active users do not see draft changes. 3. Draft validation errors are shown inline. |
| **Phase** | 1 |

### US-BS-08: Publish Brand

| Field | Content |
|-------|---------|
| **ID** | US-BS-08 |
| **Title** | Publish Brand |
| **As a** | tenant admin |
| **I want** | to activate a validated draft |
| **So that** | all users receive the new brand |
| **Acceptance Criteria** | 1. Publish requires explicit confirmation. 2. Active brand version is replaced atomically. 3. Cache invalidation and runtime refresh rules are deterministic. 4. Publish is auditable. |
| **Phase** | 1 |

### US-BS-09: Roll Back to Previous Brand

| Field | Content |
|-------|---------|
| **ID** | US-BS-09 |
| **Title** | Roll Back Brand |
| **As a** | tenant admin |
| **I want** | to restore a previous published version |
| **So that** | I can recover from a bad release quickly |
| **Acceptance Criteria** | 1. Version history shows published revisions. 2. Rollback restores theme, assets, and metadata together. 3. Rollback is auditable. |
| **Phase** | 2 |

### US-BS-10: Audit Brand Changes

| Field | Content |
|-------|---------|
| **ID** | US-BS-10 |
| **Title** | Audit Brand Changes |
| **As a** | tenant admin or master operator |
| **I want** | to review who changed branding and when |
| **So that** | branding changes are accountable |
| **Acceptance Criteria** | 1. Draft save, publish, rollback, and asset replacement events are logged. 2. Audit entries show actor, timestamp, target version, and summary. |
| **Phase** | 2 |

### US-BS-11: Enforce Brand Governance in CI

| Field | Content |
|-------|---------|
| **ID** | US-BS-11 |
| **Title** | Enforce Brand Governance in CI |
| **As a** | platform owner |
| **I want** | build gates that block brand drift |
| **So that** | static logos, hardcoded favicons, and off-contract theme paths cannot re-enter the codebase |
| **Acceptance Criteria** | 1. CI fails on ungoverned brand asset references. 2. CI fails on bypassing the brand manifest/runtime service. 3. Runtime tests verify tenant-branded surfaces. |
| **Phase** | 1 |

### US-BS-12: Manage Brand Presets

| Field | Content |
|-------|---------|
| **ID** | US-BS-12 |
| **Title** | Manage Brand Presets |
| **As a** | tenant admin |
| **I want** | approved starter presets |
| **So that** | brand setup is faster and safer |
| **Acceptance Criteria** | 1. Presets are curated and accessible. 2. Presets are implemented through the same manifest contract as custom brands. |
| **Phase** | 2 |

### US-BS-13: Manage Tenant Icon Library

| Field | Content |
|-------|---------|
| **ID** | US-BS-13 |
| **Title** | Manage Tenant Icon Library |
| **As a** | tenant admin |
| **I want** | to upload, activate, and govern the icon library used by object definitions |
| **So that** | icon selection in object-definition flows comes from the tenant's approved active library instead of hardcoded frontend arrays |
| **Acceptance Criteria** | 1. A default governed icon library can be seeded from approved Phosphor/IconBuddy-derived assets. 2. Tenant admins can upload or replace a governed icon library package. 3. Object-definition icon pickers read from the active published icon library only. 4. Draft icon-library changes do not affect active users until publish. 5. Icon-library activation is auditable and versioned. |
| **Phase** | 1 |
