# R14 Brand Runtime Contract

**Purpose:** define when branding loads, where it is saved, how it is applied, and how the theme sweep works at runtime.

---

## 1. Source of Truth

### 1.1 Persisted source `[TARGET]`

The persisted source of truth must be a **Brand Manifest** attached to:

- one tenant draft workspace for editing
- one active tenant brand profile for runtime

Authoritative storage must be per-tenant PostgreSQL records owned by tenant-service.

If a Neo4j relationship view is later required for fact-sheet navigation or graph visualization, it must be a derived projection only, not the editable system of record.

The manifest must include:

- brand profile id
- semantic palette tokens
- typography pack id
- asset ids and resolved URLs
- component token overrides
- metadata such as app title, favicon, and auth copy overrides

See also:

- `07-Brand-Domain-and-Graph-Model.md`
- `08-Brand-Catalog-and-Assembly-Design.md`
- `09-Brand-API-and-Persistence-Spec.md`
- `10-Brand-System-Cypher-Projection-Spec.md`
- `11-Brand-Frontend-Runtime-Design.md`
- `12-Brand-Studio-Screen-and-IA-Spec.md`
- `13-F3-Draft-Model-Decision-Paper.md`
- `14-Implementation-Work-Packages.md`

### 1.2 Runtime source `[TARGET]`

At runtime, exactly one **active brand manifest** is applied per tenant context.

Draft workspaces are never the runtime source for ordinary users.

### 1.3 Default fallback `[TARGET]`

If no tenant-specific published brand exists, runtime must fall back to the **current existing brand baseline now in production/source control**.

This fallback must include:

- current semantic tokens
- current default logos
- backend/browser-derived favicon based on the active logo set
- current default login treatment
- current shell identity assets

---

## 2. Save Model

### 2.1 Draft save `[TARGET]`

Draft save writes to persistent storage without activating the runtime profile.

Required operations:

1. validate payload
2. validate asset references
3. normalize manifest
4. save tenant draft workspace
5. return draft summary and preview payload

### 2.2 Publish `[TARGET]`

Publish must:

1. validate the current tenant draft workspace
2. assemble a new active brand profile
3. replace the prior active tenant-brand relation
4. emit audit event
5. invalidate cached theme artifacts

### 2.3 Rollback `[TARGET]`

Rollback must restore a prior brand profile as the new active brand profile.

---

## 3. Load Model

### 3.1 Anonymous / login load `[TARGET]`

For anonymous routes such as login:

1. resolve tenant by the incoming login link destination / hostname
2. fetch active brand manifest
3. apply brand before final auth-shell render
4. apply favicon/title metadata before user interaction

Validated as-is basis:

- backend resolves tenant from `Host` / `X-Forwarded-Host` in `backend/tenant-service/src/main/java/com/ems/tenant/controller/TenantController.java:70-140`
- frontend bootstrap already calls `resolveTenant()` in `frontend/src/app/core/services/tenant-context.service.ts:22-31`

### 3.2 Authenticated app load `[TARGET]`

For authenticated routes:

1. resolve tenant
2. fetch active brand manifest
3. apply brand before shell and routed feature content settle

### 3.3 Tenant switch `[TARGET]`

When tenant context changes:

1. dispose prior theme state
2. reset to the current existing default brand manifest
3. apply new tenant manifest atomically

### 3.4 Login input rule `[TARGET]`

If tenant has already been resolved from the incoming hostname/link, login must not ask the user to type tenant identity again.

The only allowed exception is a governed fallback path for non-tenant-aware environments such as:

- local development
- support/admin override mode
- explicitly unresolved generic platform login

That exception flow must be visually and architecturally separated from the normal tenant login path.

---

## 4. Theme Sweep

The theme sweep is the operation that fans branding through the runtime.

### 4.1 Sweep stages `[TARGET]`

1. **Reset stage**
   Clear prior tenant-specific root vars, component token overrides, asset bindings, and metadata.
2. **Core token stage**
   Apply semantic and derived CSS variables to `:root`.
3. **PrimeNG stage**
   Apply semantic and component tokens through the approved PrimeNG preset/update path.
4. **Asset stage**
   Apply splash logo, shell logo, login logo, backend/browser-derived favicon, and login background.
5. **Metadata stage**
   Apply document title, theme-color/meta tags, and any governed auth copy overrides.
6. **Verification stage**
   Mark branding runtime ready only after the sweep completes.

### 4.2 Sweep scope `[TARGET]`

The sweep must update all of these surfaces:

- splash
- login
- shell header
- footer if branded
- backend/browser-derived favicon
- browser title and theme metadata
- governed shared components
- representative PrimeNG primitives

---

## 5. Current As-Is Contract Failures

- `[AS-IS]` Bootstrap does not apply branding: `frontend/src/app/core/initializers/tenant.initializer.ts:5-8`.
- `[AS-IS]` Tenant context ignores resolved branding: `frontend/src/app/core/services/tenant-context.service.ts:44-57`.
- `[AS-IS]` Backend already resolves tenant and returns branding by hostname: `backend/tenant-service/src/main/java/com/ems/tenant/controller/TenantController.java:70-140`.
- `[AS-IS]` Theme service preview path only applies root vars, not full branding: `frontend/src/app/core/theme/tenant-theme.service.ts:20-22`.
- `[AS-IS]` Theme service applies only selected root vars and primary semantic palette: `frontend/src/app/core/theme/tenant-theme.service.ts:24-66`.
- `[AS-IS]` Login, splash, shell, and favicon are static:
  - `frontend/src/app/features/auth/login.page.html:11-20`
  - `frontend/src/app/app.html:2-5`
  - `frontend/src/app/layout/shell-layout/shell-layout.component.html:9-11`
  - `frontend/src/index.html:12-13`
- `[AS-IS]` Login still requires tenant re-entry: `frontend/src/app/features/auth/login.page.ts:42,99-126`

---

## 6. Mandatory Implementation Rules

1. No route may hardcode tenant logos or favicon outputs.
2. No branded runtime surface may bypass the brand manifest service.
3. Draft preview must be session-local.
4. Publish must be the only path that changes active branding.
5. Theme reset must be explicit and testable.
6. Asset references must come from governed asset records, not ad hoc text inputs alone.
7. Favicon is not a direct user-managed upload surface in phase 1; backend/browser integration must derive and render it from the active logo set.

---

## 7. Testable Acceptance

Brand runtime is acceptable only when Playwright proves:

- login uses the active brand
- shell uses the active brand
- splash uses the active brand
- favicon updates
- hostname-based login resolution applies the correct brand without tenant re-entry
- switching tenant updates the theme correctly
- brand preview does not leak into active runtime after exit

---

## 8. Session, Use Case, and Exception Matrix

### 8.1 Session policy `[TARGET]`

- Published brand affects new anonymous visits immediately after publish.
- Existing authenticated sessions follow the chosen refresh policy:
  - preferred phase-1 policy: adopt new brand on next navigation reload / bootstrap
- Forced mid-session hard swaps should be avoided unless explicitly required.

### 8.2 Primary use cases `[TARGET]`

1. User opens `tenant-specific login URL` and sees the correct tenant brand immediately.
2. User with active session refreshes and the same tenant brand is restored.
3. Tenant with no custom published brand falls back to the current default brand.
4. Tenant publish occurs while users are active; new sessions get the new brand, active sessions follow refresh policy.

### 8.3 Exceptions `[TARGET]`

- unresolved tenant hostname
- support/admin generic login
- local development without tenant-aware hostname
- broken asset delivery
- tenant/domain mismatch across open sessions and newly opened links

Each exception must have:

- fallback branding rule
- security rule
- user-facing behavior
- audit/monitoring rule
