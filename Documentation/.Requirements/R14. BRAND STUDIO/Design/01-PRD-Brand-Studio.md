# R14 PRD -- Brand Studio

**Date:** 2026-03-23
**Status:** Draft -- evidence-backed, pending product and architecture approval.
**Worktree:** `brand-studio-spec`
**Objective:** Deliver a full tenant branding module that safely customizes login experience, palette, typography, and logos, and applies the chosen brand across the runtime without drift.

---

## Section 0: Evidence Legend

This document uses the same evidence discipline as the tenant-management stream.

| Tag | Meaning | Evidence Rule |
|-----|---------|---------------|
| `[AS-IS]` | Confirmed in the current codebase | Must cite `file:line` or explicit repo-wide search evidence |
| `[TARGET]` | Required future behavior | Must not be described as already implemented |
| `[FORK]` | Contradictory implementations or unresolved design choices | Must be decided before build |

Rules:

- `[AS-IS]` statements without source evidence are invalid.
- `[TARGET]` statements define the requirement, not the current truth.
- `[FORK]` items block build readiness.

---

## Section 1: What We Are Building

Brand Studio is the tenant-facing and operator-safe branding system for EMSIST.

It has four mandatory pillars:

1. **Login Experience Customization** `[TARGET]`
   Tenant-aware login logo, background, copy surfaces, favicon, and auth chrome must reflect the active published brand.
2. **Color Palette Customization** `[TARGET]`
   Tenant brand selection must propagate through the runtime token system and PrimeNG theme layer without per-surface manual edits.
3. **Typography Customization** `[TARGET]`
   Approved typography packs must apply consistently to login, shell, content, and governed component surfaces.
4. **Logo and Asset Management** `[TARGET]`
   Brand assets and the object-definition icon library must be uploaded, validated, versioned, activated, and rendered consistently across splash, shell, login, favicon, and governed object-definition surfaces.

Brand Studio is not just a tenant-settings form. It is the runtime brand-delivery system for the application.

---

## Section 2: Why This Exists

The current system has branding fragments, but not a full branding module.

Key current truths:

- `[AS-IS]` The backend stores tenant branding fields including logo URLs, favicon URL, login background URL, font family, and component tokens in `TenantBrandingEntity` at `backend/tenant-service/src/main/java/com/ems/tenant/entity/TenantBrandingEntity.java:29-130`.
- `[AS-IS]` The backend exposes branding `GET`, `PUT`, and `POST /branding/validate`, but no draft, publish, rollback, or asset-upload endpoints in `backend/tenant-service/src/main/java/com/ems/tenant/controller/TenantController.java:325-350`.
- `[AS-IS]` The frontend has a theme service that can apply some root CSS vars and PrimeNG semantic primary palette in `frontend/src/app/core/theme/tenant-theme.service.ts:7-66`.
- `[AS-IS]` Tenant bootstrap resolves tenant identity but does not apply tenant branding in `frontend/src/app/core/initializers/tenant.initializer.ts:5-8` and `frontend/src/app/core/services/tenant-context.service.ts:22-31,44-57`.
- `[AS-IS]` Login, splash, shell, and favicon are still wired to static assets:
  - splash logo: `frontend/src/app/app.html:2-5`
  - shell logo: `frontend/src/app/layout/shell-layout/shell-layout.component.html:9-11`
  - login logo: `frontend/src/app/features/auth/login.page.html:11-20`
  - favicon: `frontend/src/index.html:12-13`

Therefore the current system supports partial theme editing, not true end-to-end tenant branding.

---

## Section 3: North Star

**North star:** when a published tenant brand is activated, every governed runtime surface uses that brand automatically and consistently.

This must be true for:

- splash/loading shell
- login screen
- favicon and browser title metadata
- global shell header and footer
- page surfaces and shared components
- PrimeNG component library
- tenant-specific assets such as light logo, dark logo, and auth background

The brand must load deterministically, apply once per tenant context, and reset safely when tenant context changes.

### 3.1 Default Brand Baseline `[TARGET]`

The default tenant brand baseline is the **existing live brand as it exists today**.

That means:

- the current token palette remains the fallback baseline
- the current platform logos/assets remain the fallback baseline
- any tenant with no published brand must render the current existing brand, not an invented placeholder or redesigned default

R14 is a branding-runtime project, not a default-brand redesign project.

---

## Section 4: Success Criteria

Brand Studio is complete only when all criteria below are demonstrably true.

| # | Criterion | Measurable |
|---|-----------|------------|
| 1 | Active tenant branding is loaded during application bootstrap | Runtime test proves published brand is applied before first interactive render |
| 2 | Login screen is tenant-branded | Runtime test proves logo, background, palette, and auth chrome reflect active brand |
| 3 | Shell and splash are tenant-branded | Runtime test proves shell logo, splash logo, favicon, and title metadata reflect active brand |
| 4 | Palette changes sweep through governed components without manual page overrides | Design-system runtime suite verifies representative components across desktop and mobile |
| 5 | Typography selection is consistent across login, shell, headings, body, and inputs | Runtime and visual tests verify the selected typography pack |
| 6 | Assets are uploaded and versioned safely | API and UI tests cover upload, validation, activation, replacement, and rollback |
| 7 | Draft and publish are separated | Editing a draft does not affect active users until publish is confirmed |
| 8 | Brand changes are auditable and reversible | Audit log and rollback flow are covered by integration tests |
| 9 | Anti-drift governance blocks ungoverned brand entry points | CI gates fail on hardcoded brand assets or ungoverned theme overrides |
| 10 | Theme reset is deterministic | Switching tenant context or clearing branding restores the correct active/default theme |

---

## Section 5: Scope

### 5.1 In Scope `[TARGET]`

- tenant branding draft editor
- brand asset upload and management
- tenant icon-library upload and activation for object definitions
- publish / activate / rollback flow
- login-screen customization
- favicon and document metadata branding
- shell and splash branding
- palette and typography packs
- governed component token sweep
- audit trail for brand changes
- runtime enforcement and anti-drift gates

### 5.2 Out of Scope for initial delivery `[TARGET]`

- free-form custom CSS as a general escape hatch
- arbitrary font uploads
- fully custom per-page layouts
- email-template theming
- white-label domain provisioning

These may be added later only through governed extension points.

---

## Section 6: Required Capability Map

| # | Capability | Phase | Owner |
|---|-----------|-------|-------|
| 1 | Load active branding during tenant bootstrap | 1 | R14 |
| 2 | Apply brand to splash, favicon, title, shell, and login | 1 | R14 |
| 3 | Palette selection with governed tokens | 1 | R14 |
| 4 | Typography pack selection | 1 | R14 |
| 5 | Logo, favicon, and login background asset upload | 1 | R14 |
| 6 | Brand draft editing with live preview | 1 | R14 |
| 7 | Publish / activate workflow | 1 | R14 |
| 8 | Rollback to previous published version | 2 | R14 |
| 9 | Brand audit history and compare view | 2 | R14 |
| 10 | Brand presets / starter kits | 2 | R14 |
| 11 | Brand accessibility scoring and contrast guardrails | 2 | R14 |
| 12 | Tenant icon-library management for object definitions | 1 | R14 |
| 13 | Import / export brand kit | 3 | R14 |

---

## Section 7: Runtime Lifecycle Requirement

### 7.1 Load

- `[TARGET]` On app bootstrap, tenant resolution must return both tenant identity and active branding payload.
- `[TARGET]` Tenant resolution must be driven primarily by the login link destination / hostname, because the backend already resolves tenant from `Host` / `X-Forwarded-Host`.
- `[TARGET]` The initializer must apply active branding before the app shell, splash completion, or login route renders its final branded state.
- `[TARGET]` The same load path must work for anonymous login access and authenticated in-app navigation.
- `[TARGET]` The login screen must not require tenant re-entry when tenant has already been resolved from the incoming link/hostname.

### 7.2 Save

- `[TARGET]` Editing produces a draft version only.
- `[TARGET]` Draft save validates colors, typography pack, asset references, and component token overrides.
- `[TARGET]` Draft save must not affect active users.

### 7.3 Publish

- `[TARGET]` Publish promotes the draft to the active brand version.
- `[TARGET]` Publish invalidates cached theme artifacts and refreshes active runtime state on next load.
- `[TARGET]` Publish must be auditable and reversible.

### 7.4 Sweep

- `[TARGET]` The theme sweep must update:
  - root semantic tokens
  - derived component tokens
  - PrimeNG semantic preset
  - shell logos and splash assets
  - login visuals
  - favicon and document metadata
  - any governed brand images and brand text surfaces

### 7.5 Reset

- `[TARGET]` If the tenant has no published brand, runtime must fall back to canonical default branding.
- `[TARGET]` Switching tenant context must fully replace the active theme rather than layering over the previous tenant state.

### 7.6 Session Rules `[TARGET]`

- Existing authenticated sessions must continue using the currently active published brand until the next brand refresh boundary.
- Brand publish must define one of two allowed policies:
  - `soft refresh`: active sessions pick up the new brand on navigation refresh / next bootstrap
  - `hard refresh`: active sessions receive a forced reload event and re-bootstrap into the new brand
- Phase 1 should prefer `soft refresh` unless there is a hard compliance requirement for immediate visual cutover.

### 7.7 Use Cases `[TARGET]`

1. Tenant user opens a tenant-specific login link and immediately sees the correct tenant brand.
2. Anonymous user lands on the login page from a tenant domain with no active session.
3. Authenticated tenant user refreshes the app and keeps the correct published brand.
4. Master operator publishes a new tenant brand while tenant users already have active sessions.
5. Tenant has no published custom brand and must fall back to the current default brand baseline.
6. Tenant hostname is valid but branding assets are partially missing.

### 7.8 Edge Cases and Exceptions `[TARGET]`

- Unknown hostname:
  show tenant-not-found / unresolved-tenant flow with default platform fallback styling only.
- Hostname resolved, branding missing:
  use current default brand baseline, do not fail login.
- Hostname resolved, branding payload invalid:
  reject invalid draft at publish time; runtime falls back to last valid published brand.
- Hostname resolved, asset URL broken:
  use governed fallback asset and emit monitoring/audit signal.
- User opens a stale login link after tenant domain reassignment:
  backend resolution result is authoritative; stale link must not force the wrong brand.
- Active session from tenant A while user opens tenant B link:
  tenant-context conflict behavior must be explicitly defined before build; default should be force re-bootstrap into tenant B after confirmation or logout.

---

## Section 8: Nice to Have

These are explicitly optional and should not weaken the phase-1 scope.

- **Brand starter kits** `[TARGET]`
  Prebuilt enterprise-safe presets for faster onboarding.
- **Curated tenant icon packs** `[TARGET]`
  Provide approved icon-pack starters so tenants can begin from Phosphor/IconBuddy-derived libraries without assembling every icon manually.
- **Accessibility scorecard** `[TARGET]`
  Automatic contrast and focus-visibility scoring before publish.
- **Brand preview share link** `[TARGET]`
  Share a temporary preview URL for approval without publishing.
- **Brand kit import/export** `[TARGET]`
  Export theme, assets, and governed overrides as a portable package.
- **AI-assisted palette suggestion** `[TARGET]`
  Suggest compliant palette combinations while preserving contrast guardrails.

---

## Section 9: Frozen Decisions

| ID | Status | Decision / Fork | Why it matters |
|----|--------|------------------|----------------|
| F1 | Frozen | Typography uses a predefined approved font list only | Prevents arbitrary font uploads, simplifies runtime loading, and avoids licensing drift |
| F2 | Frozen | Brand assets use internal media storage | Gives controlled validation, caching, availability, and auditability |
| F3 | Frozen | One editable draft per tenant plus one active `BrandProfile`; multiple parallel drafts are out of scope for phase 1 | Keeps authoring, publish, rollback, and runtime semantics simple and deterministic |
| F4 | Frozen | Login branding resolves tenant by hostname/link as the primary flow; manual `tenantId` entry remains a temporary dev/test exception and will be hidden from the standard frontend flow later | Preserves current backend resolution model while removing tenant re-entry from the real user path |
| F5 | Frozen | User-selectable "available brands" are platform-curated Starter Kits, not live brand profiles | Keeps runtime truth separate from authoring shortcuts and avoids users selecting historical/live runtime records directly |
| F6 | Frozen | Colors are selected from a shared Palette Pack catalog and resolved into the active brand manifest | Centralizes governance, contrast rules, and token consistency |
| F7 | Frozen | Fonts are selected from a shared Typography Pack catalog and resolved into the active brand manifest | Aligns with the approved-font policy and keeps typography deterministic at runtime |
| F8 | Frozen | The authoritative runtime brand is one assembled `BrandProfile` manifest in per-tenant PostgreSQL; editing persists to `tenant_brand_draft` | Separates active runtime truth from draft editing and keeps bootstrap deterministic |
| F9 | Frozen | Frontend branding uses static compiled SCSS plus governed runtime style-tag injection (`tenant-brand-foundation-vars`, `tenant-brand-component-vars`, `tenant-brand-fonts`) | Avoids tenant-specific SCSS generation and keeps runtime theming bounded and testable |
| F10 | Frozen | Neo4j graph semantics are limited to `(:Tenant)-[:HAS_ACTIVE_BRAND]->(:BrandProfile)` | Preserves fact-sheet/query semantics without moving brand authoring into Neo4j |
| F11 | Frozen | If graph support is needed, System Cypher is used first only to register the `BrandProfile` / `HAS_ACTIVE_BRAND` metamodel; runtime truth still stays in PostgreSQL | Separates sanctioned graph semantics from authoritative runtime storage |

All decisions in this section are frozen and must be treated as requirements.
