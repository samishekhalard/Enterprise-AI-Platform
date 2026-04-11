# R14 Anti-Drift Governance -- Brand Studio

**Goal:** prevent branding from drifting into static assets, hardcoded paths, or off-contract runtime logic.

---

## 1. Governance Principles

1. **One manifest**
   All active branding must derive from one published brand manifest.
2. **One runtime service**
   All runtime application must flow through one brand runtime service.
3. **No static tenant-brand references**
   Shared app surfaces must not hardcode tenant logos, favicons, titles, or login backgrounds.
4. **No ungoverned color injection**
   Brand colors must enter via approved semantic tokens or approved component token overrides.
5. **No free-form CSS escape hatch in phase 1**
   Custom CSS stays disabled until a sandboxed and auditable extension model exists.

---

## 2. Required Sources of Truth

| Concern | Source of truth |
|---------|-----------------|
| Default platform brand | the current existing live brand, codified as the default brand manifest |
| Tenant draft brand | tenant brand draft workspace record |
| Active tenant brand | active tenant brand profile record |
| Runtime application | brand runtime service |
| Asset references | brand asset registry / media records |
| Typography packs | governed typography catalog |

---

## 3. Forbidden Patterns

The following patterns must fail code review and CI:

- hardcoded logo asset paths in app shell, login, splash, or branded shared components
- hardcoded favicon references outside the brand metadata manager
- runtime theme application outside the approved brand runtime service
- ad hoc direct `document.documentElement.style.setProperty()` calls outside the approved runtime service
- page-specific tenant theming logic that bypasses the brand manifest
- storing active brand state only in local component state

---

## 4. CI Gates

### 4.1 Static checks `[TARGET]`

- fail on hardcoded brand asset paths in branded runtime surfaces
- fail on direct static favicon references outside allowed bootstrap shell
- fail on new ungoverned theme-application code paths
- fail if frontend and backend brand contracts diverge

### 4.2 Contract checks `[TARGET]`

- manifest schema validation
- typography pack validation
- asset metadata validation
- component token allowlist validation

### 4.3 Runtime checks `[TARGET]`

- Playwright tenant-brand runtime suite:
  - splash branding
  - login branding
  - shell branding
  - favicon update
  - preview isolation
  - publish activation
  - tenant switch reset

---

## 5. Required Ownership

| Area | Owner |
|------|-------|
| Brand manifest schema | Design system + frontend architecture |
| Asset policy | Product + platform architecture |
| Typography catalog | Design system |
| Runtime service | Frontend architecture |
| Publish lifecycle | Product + backend |
| Governance scripts and CI | Frontend platform |

---

## 6. Build Readiness Checklist

Build must not start until all are true:

- runtime contract is approved
- asset storage decision is frozen
- typography model is frozen
- draft/publish lifecycle is frozen
- brand manifest schema is frozen
- Playwright acceptance plan is defined

---

## 7. Auditability Requirements

Each of these must create a traceable event:

- draft saved
- draft deleted
- assets uploaded
- assets replaced
- brand published
- brand rolled back
- publish failed

---

## 8. Current As-Is Drift Risks

- `[AS-IS]` Static shell logo: `frontend/src/app/layout/shell-layout/shell-layout.component.html:9-11`
- `[AS-IS]` Static splash logo: `frontend/src/app/app.html:2-5`
- `[AS-IS]` Static login logo: `frontend/src/app/features/auth/login.page.html:11-20`
- `[AS-IS]` Static favicon: `frontend/src/index.html:12-13`
- `[AS-IS]` Theme service can be called ad hoc and has no reset contract: `frontend/src/app/core/theme/tenant-theme.service.ts:7-22`
- `[AS-IS]` Current policy is hardcoded by Java sets, not by a durable brand-manifest contract: `backend/tenant-service/src/main/java/com/ems/tenant/service/branding/BrandingPolicyEnforcer.java:17-42,44-82`

These are the first anti-drift targets.
