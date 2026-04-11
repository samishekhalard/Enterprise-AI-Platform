# R14 Implementation Work Packages

**Purpose:** translate the frozen design set into execution-ready implementation slices.

---

## Current Baseline on 2026-03-25

Current truth in this worktree:

- backend Brand Studio persistence and draft/history/publish/rollback/catalog contracts are partially implemented
- frontend preview route has approved slices for `Typography`, `Color System`, and `Iconography`
- the real tenant-mounted editor still diverges from the approved preview and remains the main regression risk
- `Imagery`, `Login Page`, asset upload, and icon-library import are not closed end to end

Frozen execution rule from this point:

- `brand-studio-preview` is a fixture/review harness only
- the tenant-mounted `app-branding-studio` is the real product surface
- approved sections must be implemented once and reused in both places
- do not continue preview-only implementation without converging the real mounted editor

---

## WP1. Authoritative Data Model

Scope:

- `tenant_brand_profile`
- `tenant_brand_draft`
- `tenant_brand_asset`
- `tenant_icon_library`
- `tenant_icon_asset`
- audit events

Outputs:

- database schema
- entities/models
- repository contracts

Depends on:

- `09-Brand-API-and-Persistence-Spec.md`
- `13-F3-Draft-Model-Decision-Paper.md`

Exit:

- persistence schema is frozen and reviewable

---

## WP2. Backend API Layer

Scope:

- extend `resolve` to return `activeBrand`
- draft read/update/validate
- asset upload/list
- icon-library upload/list
- publish
- rollback
- history

Outputs:

- controller contracts
- request/response DTOs
- service methods

Depends on:

- WP1

Exit:

- API contract is complete and testable

---

## WP3. Frontend Runtime Layer

Scope:

- `BrandManifestService`
- `BrandRuntimeService`
- startup load path
- favicon/title binding
- injected style-tag pipeline

Outputs:

- runtime architecture implementation
- login/shell/splash brand binding

Depends on:

- WP2
- `11-Brand-Frontend-Runtime-Design.md`

Exit:

- active brand can render on bootstrap from one manifest

---

## WP4. Brand Studio Editor

Scope:

- converge approved preview sections into the real tenant-mounted editor
- starter kit selector
- palette pack selector
- typography pack selector
- asset library
- icon library
- preview
- publish/rollback UI

Typography corrective gate before broader editor work:

- complete `15-Typography-Page-Fixture-Plan.md`
- do not expand more Brand Studio screens until the Typography page is aligned to the active baselines

Outputs:

- R14-owned editor screens
- no dependency on R02 parking files

Depends on:

- WP2
- WP3
- `12-Brand-Studio-Screen-and-IA-Spec.md`
- `15-Typography-Page-Fixture-Plan.md`

Exit:

- editor can save draft, preview, and publish

---

## WP4A. Shared Section Convergence

Scope:

- extract approved `Typography`, `Color System`, and `Iconography` sections into shared components
- reuse the same components in:
  - `brand-studio-preview`
  - tenant-mounted `app-branding-studio`
- remove preview-vs-real markup drift

Outputs:

- one shared implementation per approved section
- preview route reduced to fixture harness composition
- tenant factsheet Branding tab using the same section components

Depends on:

- WP2
- WP3
- approved preview screens

Exit:

- no section exists in two divergent implementations

---

## WP4B. Imagery and Asset Management

Scope:

- logo management
- favicon management
- login background / imagery management
- asset upload and asset-library selection
- publish wiring into active brand manifest

Outputs:

- tenant asset manager UI
- backend asset upload/list/select support
- imagery preview in real editor and runtime

Depends on:

- WP2 remaining asset gaps
- WP3

Exit:

- assets are upload-backed and publishable, not URL-only

---

## WP4C. Login Surface Management

Scope:

- manage the login page brand surface from Brand Studio
- preview logo/background/title/theme metadata in the editor
- verify runtime sweep to the real login page

Outputs:

- login page management section
- runtime binding verified through the tenant bootstrap path

Depends on:

- WP3
- WP4B

Exit:

- login surface is governed from Brand Studio and rendered from the active brand manifest

---

## WP4D. Icon Library Import Closure

Scope:

- tenant icon-library upload/import endpoint
- import validation
- real imported library persistence
- active-library selection and publish

Outputs:

- end-to-end object-definition icon library flow

Depends on:

- WP2 remaining icon-library gaps
- WP4A

Exit:

- iconography is no longer preview-local only

---

## WP5. System Cypher Projection

Scope:

- metamodel registration in sanctioned System Cypher
- tenant-graph `HAS_ACTIVE_BRAND` projection

Outputs:

- metamodel spec
- projection writer
- graph query support

Depends on:

- System Cypher sanction
- WP2 publish/rollback events
- `10-Brand-System-Cypher-Projection-Spec.md`

Exit:

- graph relation is projected without becoming runtime source of truth

---

## WP6. Anti-Drift Governance

Scope:

- static checks for brand entry points
- runtime Playwright checks
- docs alignment checks

Outputs:

- CI rules
- browser-backed acceptance suite

Depends on:

- WP3
- WP4

Exit:

- brand drift is blocked in CI and visible in browser tests

---

## Rebaselined execution order

1. WP1
2. WP2
3. WP3
4. WP4A
5. WP4B
6. WP4C
7. WP4D
8. WP6
9. WP5

Reason:

- the real tenant-mounted editor must converge before more preview-only work
- assets and login are still inside scope and block a complete Brand Studio
- governance should wrap the real mounted runtime, not only the preview harness
