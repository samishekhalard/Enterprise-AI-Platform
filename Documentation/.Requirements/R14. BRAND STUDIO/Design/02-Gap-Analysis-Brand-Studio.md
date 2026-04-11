# R14 Gap Analysis -- Brand Studio

**Date:** 2026-03-23
**Method:** repo inspection across frontend, backend, requirements, runtime bootstrap, login, shell, and branding persistence.
**Verdict:** the current system contains branding primitives, but it is not a complete branding module.

---

## Executive Verdict

Current state is **partial branding infrastructure**, not end-to-end tenant branding.

What exists:

- branding persistence fields in backend
- branding read/update/validate API
- a partial theme application service
- a branding editor component with live preview logic
- component-token experimentation and policy enforcement

What does not exist yet:

- guaranteed bootstrap application of branding
- runtime branding of login, splash, shell, and favicon
- draft/publish/rollback lifecycle
- asset upload pipeline
- typography management end to end
- anti-drift enforcement for brand entry points

---

## Gap Ledger

| Area | As-Is Evidence | Gap | Required Action |
|------|----------------|-----|-----------------|
| Tenant resolution model | `backend/tenant-service/src/main/java/com/ems/tenant/controller/TenantController.java:70-140`, `frontend/src/app/core/services/tenant-context.service.ts:22-31` | Backend already resolves tenant from hostname, but the frontend branding/runtime contract does not yet treat link/hostname resolution as the primary brand-loading path | Make hostname/login-link tenant resolution the primary runtime-brand entry point |
| Tenant bootstrap | `frontend/src/app/core/initializers/tenant.initializer.ts:5-8`, `frontend/src/app/core/services/tenant-context.service.ts:22-31,44-57` | Tenant bootstrap resolves tenant identity only; branding is not applied | Extend bootstrap to load active branding and apply it before branded surfaces render |
| Resolved tenant payload | `backend/tenant-service/src/main/java/com/ems/tenant/controller/TenantController.java:107-129` | Backend already returns branding in resolve response, but frontend ignores it | Map and consume resolved branding in frontend bootstrap |
| Runtime theme application | `frontend/src/app/core/theme/tenant-theme.service.ts:7-22,24-66` | Theme service applies only a subset of tokens and only Prime primary semantic palette | Create full theme manifest sweep covering semantic, derived, component, asset, and metadata layers |
| Theme reset | `frontend/src/app/core/theme/tenant-theme.service.ts:7-22` | Service has apply/preview only; no deterministic reset or tenant-switch replacement | Add reset/replace semantics and default-theme restore |
| Login branding | `frontend/src/app/features/auth/login.page.html:11-20`, `frontend/src/app/features/auth/login.page.ts:44-76` | Login uses static logo and locally computed tenant name; no active branding load | Bind login to active branding manifest and tenant-aware metadata |
| Login tenant input | `frontend/src/app/features/auth/login.page.ts:42,99-126` | Login still requires manual tenantId submission even though tenant is already resolved from hostname at bootstrap | Remove tenant re-entry from the resolved-host flow; keep only an explicitly governed exception path if needed |
| Login background | `frontend/src/app/features/auth/login.page.html:1-212`, repo-wide search on 2026-03-23 shows no runtime use of `loginBackgroundUrl` outside form/model paths | Field exists but is not rendered | Add governed login background rendering with accessibility and performance constraints |
| Splash branding | `frontend/src/app/app.html:2-5` | Splash uses static logo and copy | Route splash through active branding manifest |
| Shell branding | `frontend/src/app/layout/shell-layout/shell-layout.component.html:9-11` | Shell logo is static | Replace with brand-aware asset source and fallback policy |
| Favicon branding | `frontend/src/index.html:12-13` | Favicon is static HTML, not runtime-controlled | Add runtime favicon and title/meta manager |
| Frontend branding contract | `frontend/src/app/core/api/models.ts:312-363` | Frontend branding models omit `fontFamily` even though backend accepts it | Align TypeScript contract with backend contract |
| Frontend form model | `frontend/src/app/features/administration/models/administration.models.ts:236-281` | Branding form has no `fontFamily` field | Add typography pack selection to form model and save payload |
| Typography editor | `frontend/src/app/features/administration/sections/tenant-manager/branding-studio/global-branding-form.component.html:138-145` | Typography is readonly display only | Replace with governed typography selection UI |
| Typography runtime | `frontend/src/styles.scss:91-101`, `frontend/src/app/core/theme/tenant-theme.service.ts:55-56` | Typography is globally fixed; runtime service explicitly removes body font override | Introduce typography packs with deterministic runtime application |
| Branding editor mount | repo-wide search on 2026-03-23 for `app-branding-studio` returned only `frontend/src/app/features/administration/sections/tenant-manager/branding-studio/branding-studio.component.ts:104` | Branding studio component exists but is not mounted in a live template | Wire the editor into the live tenant-branding management route/surface |
| Save lifecycle | `frontend/src/app/features/administration/sections/tenant-manager/branding-studio/branding-studio.component.ts:340-379` | Save validates then immediately updates persisted branding; no draft/publish separation | Introduce draft save and explicit publish flow |
| API lifecycle | `frontend/src/app/core/api/api-gateway.service.ts:374-399`, `backend/tenant-service/src/main/java/com/ems/tenant/controller/TenantController.java:325-350` | Only `GET`, `PUT`, `validate`; no draft, publish, rollback, version history | Add full brand lifecycle API surface |
| Asset management UX | `frontend/src/app/features/administration/sections/tenant-manager/branding-studio/global-branding-form.component.html:102-145` | Asset management is URL entry only | Add upload, validation, preview, crop, and replacement workflow |
| Asset management backend | repo-wide search on 2026-03-23 found no tenant-branding multipart upload endpoints in tenant-service | No upload/storage pipeline for brand assets | Add media storage and branding asset endpoints |
| Palette governance | `frontend/src/app/features/administration/sections/tenant-manager/branding-studio/branding-policy.config.ts:25-145`, `backend/tenant-service/src/main/java/com/ems/tenant/service/branding/BrandingPolicyEnforcer.java:44-166` | Approved palette is extremely narrow and hardcoded; not brand-system scalable | Replace hardcoded palette lists with governed palette packs and contrast rules |
| Custom CSS | `backend/tenant-service/src/main/java/com/ems/tenant/service/branding/BrandingPolicyEnforcer.java:293-315`, `frontend/src/app/features/administration/sections/tenant-manager/branding-studio/global-branding-form.component.html:278-289` | Custom CSS exists as a field but is disabled by policy | Keep disabled for phase 1; if ever enabled, require sandboxed and auditable extension points only |
| Component sweep coverage | `frontend/src/app/core/theme/tenant-theme.service.ts:16-18`, `frontend/src/app/features/administration/sections/tenant-manager/branding-studio/branding-studio.component.ts:157-169` | Component overrides exist, but runtime brand adoption is partial and not tied to active published brand | Move component token overrides under published theme manifest |
| Audit and rollback | repo inspection on 2026-03-23 found no dedicated brand-profile history or publish audit flow in frontend/backend branding path | No brand-profile history, approval, compare, rollback | Add brand profile history model and audit events |
| Anti-drift governance | current governance guards design-system tokens, not brand-runtime entry points | Brand-specific drift can still enter via static assets, static HTML, or ungoverned component assets | Add brand-runtime CI checks and Playwright coverage |

---

## Most Critical Gaps

### G1. Branding does not load at bootstrap

- `[AS-IS]` `initializeTenant()` only waits for tenant context bootstrap and auth text preload in `frontend/src/app/core/initializers/tenant.initializer.ts:5-8`.
- `[AS-IS]` `TenantContextService.applyResolvedTenant()` writes tenant id and tenant name only in `frontend/src/app/core/services/tenant-context.service.ts:44-57`.
- `[AS-IS]` The backend already resolves tenant from hostname and returns branding in `backend/tenant-service/src/main/java/com/ems/tenant/controller/TenantController.java:70-140`.
- Impact: users can never rely on branding being present before login, splash, or shell render.

### G2. Login and shell are still statically branded

- `[AS-IS]` Login logo is hardcoded to `/assets/images/logo.png` in `frontend/src/app/features/auth/login.page.html:11-20`.
- `[AS-IS]` Shell logo is hardcoded to `assets/images/thinkplus-logo-colored.svg` in `frontend/src/app/layout/shell-layout/shell-layout.component.html:9-11`.
- `[AS-IS]` Splash logo is hardcoded to `assets/images/logo.svg` in `frontend/src/app/app.html:2-5`.
- `[AS-IS]` Favicon is static in `frontend/src/index.html:12-13`.
- `[AS-IS]` Login still asks for tenantId manually in `frontend/src/app/features/auth/login.page.ts:42,99-126`, despite bootstrap hostname resolution already existing.
- Impact: even perfect palette changes cannot make the app truly white-label.

### G3. Typography is not a real product capability

- `[AS-IS]` Backend accepts and stores `fontFamily` in `backend/tenant-service/src/main/java/com/ems/tenant/controller/dto/BrandingUpdateRequest.java:21-22,49` and `backend/tenant-service/src/main/java/com/ems/tenant/entity/TenantBrandingEntity.java:53-55`.
- `[AS-IS]` Frontend `TenantBranding` and `UpdateTenantBrandingRequest` do not include `fontFamily` in `frontend/src/app/core/api/models.ts:312-363`.
- `[AS-IS]` Frontend form model also omits it in `frontend/src/app/features/administration/models/administration.models.ts:236-281`.
- `[AS-IS]` UI shows typography as readonly only in `frontend/src/app/features/administration/sections/tenant-manager/branding-studio/global-branding-form.component.html:138-145`.
- Impact: typography is persisted on one side of the contract but not operable end to end.

### G4. There is no brand lifecycle, only update-in-place

- `[AS-IS]` Frontend uses `validate` then `PUT` save in `frontend/src/app/features/administration/sections/tenant-manager/branding-studio/branding-studio.component.ts:340-379`.
- `[AS-IS]` Backend exposes only `GET`, `PUT`, and `POST /validate` in `backend/tenant-service/src/main/java/com/ems/tenant/controller/TenantController.java:325-350`.
- Impact: no draft, no publish, no approval, no rollback, no safe preview.

### G5. Asset management is not a real asset pipeline

- `[AS-IS]` Branding UI uses plain URL text inputs for logo, favicon, and login background in `frontend/src/app/features/administration/sections/tenant-manager/branding-studio/global-branding-form.component.html:102-145`.
- `[AS-IS]` Repo inspection on 2026-03-23 found no branding upload endpoint in tenant-service.
- Impact: no validation of mime type, size, dimensions, optimization, or availability.

---

## Requirement Implication

A valid R14 implementation cannot be a small edit to the existing branding form. It requires:

1. a runtime brand manifest and application pipeline
2. a draft/publish/version lifecycle
3. asset storage and delivery
4. typography as a governed product choice
5. CI/runtime anti-drift gates that specifically cover brand entry points
