# Frontend Production Readiness Backlog (Non-Negotiable)

**Created:** 2026-02-28  
**Status:** Active  
**Scope:** `frontend` + `api-gateway` + `auth-facade` + core downstream service security alignment

---

## Release Policy

- Production release is blocked until all `P0` tasks are complete and verified.
- `P1` tasks are required for first stable production UX baseline.
- `P2` tasks are quality hardening and should be completed in the next sprint.

---

## Top 10 Improvement Register

| # | Improvement | Priority | Production Critical | Status |
|---|-------------|----------|---------------------|--------|
| 1 | Add route guards for authenticated pages | P0 | Yes | Done |
| 2 | Add logout flow | P0 | Yes | Done |
| 3 | Ensure `/error/*` renders chromeless | P1 | Yes | Not Started |
| 4 | Brand password reset pages | P1 | Yes | Not Started |
| 5 | Add skip link + WCAG-compliant focus treatment | P0 | Yes | Done |
| 6 | Remove deprecated legacy landing page and make administration default landing | P1 | Yes | Done |
| 7 | Migrate hardcoded hex colors to CSS tokens | P2 | No | Not Started |
| 8 | Add global toast/snackbar service | P2 | No | Not Started |
| 9 | Keep login labels persistently visible (WCAG) | P0 | Yes | Done |
| 10 | Add dedicated 404 page | P1 | No | Not Started |

---

## 16-Item Execution Progress (Granular P0 Slice)

**Last Updated:** 2026-03-01

| # | Item | Status | Evidence |
|---|------|--------|----------|
| 1 | Add `authGuard` to `/administration`, `/tenants` | Done | `frontend/src/app/app.routes.ts` |
| 2 | Redirect unauthenticated users to login with `returnUrl` | Done | `frontend/src/app/core/auth/auth.guard.ts` |
| 3 | Add route-guard unit + e2e unauthorized tests | Done | `frontend/src/app/core/auth/auth.guard.spec.ts`, `frontend/e2e/auth-guard.spec.ts` |
| 4 | Add logout action in shell/admin menu | Done | `frontend/src/app/layout/shell-layout/*`, `frontend/src/app/features/administration/administration.page.*` |
| 5 | Call `POST /api/v1/auth/logout` via gateway service | Done | `frontend/src/app/core/api/api-gateway.service.ts` |
| 6 | Clear local session tokens and redirect to login | Done | `frontend/src/app/core/services/session.service.ts`, `frontend/src/app/core/auth/gateway-auth-facade.service.ts` |
| 7 | Add logged-out success feedback | Done | `frontend/src/app/features/auth/login.page.ts`, `frontend/src/app/features/auth/login.page.html` |
| 8 | Remove static default tenant as request source of truth | Done | `frontend/src/app/core/interceptors/tenant-header.interceptor.ts`, `frontend/src/app/core/services/tenant-context.service.ts` |
| 9 | Ensure runtime `X-Tenant-ID` is UUID | Done | `frontend/src/app/core/services/tenant-context.service.ts` |
| 10 | Keep compatibility mapping only where required | Done | `frontend/src/environments/environment*.ts`, `frontend/src/environments/environment.model.ts` |
| 11 | Add frontend auth token interceptor | Done | `frontend/src/app/core/interceptors/auth.interceptor.ts`, `frontend/src/app/app.config.ts` |
| 12 | Attach `Authorization: Bearer` on protected calls | Done | `frontend/src/app/core/interceptors/auth.interceptor.ts` |
| 13 | Add one-time refresh/retry on `401` | Done | `frontend/src/app/core/interceptors/auth.interceptor.ts` |
| 14 | On refresh failure, clear session and redirect login | Done | `frontend/src/app/core/interceptors/auth.interceptor.ts` |
| 15 | Add skip link to shell | Done | `frontend/src/app/layout/shell-layout/shell-layout.component.html`, `frontend/src/app/layout/shell-layout/shell-layout.component.scss` |
| 16 | Replace box-shadow-only focus with explicit outline | Done | `shell-layout.component.scss`, `login.page.scss`, `styles.scss` |

---

## P0 Blockers (Must Complete Before Production)

### PRD-AUTH-001: Protect application routes with auth guard
- [x] Add `authGuard` to `/administration`, `/tenants`.
- [x] Redirect unauthenticated users to `/auth/login` with `returnUrl`.
- [x] Add route-guard unit tests and e2e unauthorized-access tests.
- **Target files:** `frontend/src/app/app.routes.ts`, `frontend/src/app/core/auth/*` (new)

### PRD-AUTH-002: Implement logout and session termination flow
- [x] Add logout action in shell/admin user menu.
- [x] Call `POST /api/v1/auth/logout` through `ApiGatewayService`.
- [x] Clear local session tokens and redirect to login.
- [x] Add "logged-out" success feedback.
- **Target files:** `frontend/src/app/layout/*`, `frontend/src/app/features/administration/*`, `frontend/src/app/core/api/api-gateway.service.ts`

### PRD-AUTH-003: Fix tenant identity source of truth (UUID-first)
- [x] Stop relying on static `defaultTenantId` for all requests.
- [x] Ensure `X-Tenant-ID` is always tenant UUID resolved at runtime.
- [x] Keep compatibility mapping only where explicitly required.
- **Target files:** `frontend/src/environments/*`, `frontend/src/app/core/interceptors/tenant-header.interceptor.ts`

### PRD-AUTH-004: Add frontend auth token interceptor
- [x] Attach `Authorization: Bearer <accessToken>` to protected API calls.
- [x] Add one-time refresh/retry flow on `401` using `/api/v1/auth/refresh`.
- [x] On refresh failure, clear session and redirect to `/auth/login`.
- **Target files:** `frontend/src/app/core/interceptors/*` (new), `frontend/src/app/app.config.ts`

### PRD-ACCESS-001: Accessibility non-negotiables
- [x] Add skip link to shell (`Skip to main content`).
- [x] Replace box-shadow-only focus with explicit outline (`3px` + offset).
- [x] Keep login form labels visible at all times.
- **Target files:** `frontend/src/app/layout/shell-layout/*`, `frontend/src/app/features/auth/login.page.scss`

### PRD-SEC-001: Enforce downstream service authorization
- [ ] Remove permissive `permitAll()` placeholders from tenant/user/notification/license service configs.
- [ ] Require JWT validation and minimum role checks where applicable.
- [ ] Restrict internal license validation endpoint to trusted service access pattern.
- **Target files:** `backend/*/config/SecurityConfig.java`

---

## P1 Production Baseline Tasks

### PRD-INT-001: Tenant resolver bootstrap integration
- [ ] Implement startup tenant resolution (`/api/tenants/resolve`) before app boot.
- [ ] Persist resolved tenant context (UUID, branding, auth providers) in readonly state.
- [ ] Route to `tenant-not-found` page when unresolved.
- **Target files:** `frontend/src/app/core/initializers/*` (new), `frontend/src/app/core/services/*` (new)

### PRD-INT-002: Replace hardcoded provider lists with backend data
- [ ] Login page provider options come from backend (`/api/v1/auth/providers` and/or resolved tenant config).
- [ ] Tenant administration provider panel loads real tenant providers from backend.
- [ ] Remove static mock provider arrays from UI.
- **Target files:** `frontend/src/app/features/auth/*`, `frontend/src/app/features/admin/identity-providers/*`

### PRD-UX-001: Error and recovery UX
- [ ] Mark `/error/*` routes as chromeless in shell decision logic.
- [ ] Add proper 404 page and route (`**` -> 404 component).
- [ ] Add consistent user messaging for `403 no_active_seat`.
- **Target files:** `frontend/src/app/app.ts`, `frontend/src/app/app.routes.ts`, `frontend/src/app/features/errors/*`

### PRD-UX-002: Password reset branding parity
- [ ] Apply branded background, logo, typography, and shell-free layout to reset pages.
- [ ] Ensure phishing-resistance cues match login branding.
- **Target files:** `frontend/src/app/features/auth/password-reset/*`

### PRD-ADM-001: Administration-first landing and KPI experience
- [x] Remove deprecated legacy landing page.
- [x] Set `/administration` as default and wildcard route target.
- [ ] Continue KPI cards, loading skeletons, empty/error states, and actions in administration modules.
- **Target files:** `frontend/src/app/app.routes.ts`, `frontend/src/app/features/administration/*`

---

## P2 Quality Hardening Tasks

### PRD-DESIGN-001: Tokenize hardcoded colors
- [ ] Replace hardcoded hex colors in feature SCSS with `--tp-*` or next-gen token set.
- [ ] Add lint/check to prevent introducing new raw color literals.
- **Target files:** `frontend/src/styles.scss`, `frontend/src/app/**/*.scss`

### PRD-UX-003: Add global notifications and confirmation patterns
- [ ] Implement global toast service.
- [ ] Implement reusable confirmation dialog pattern for destructive actions.
- **Target files:** `frontend/src/app/core/ui/*` (new), shell layout integration

### PRD-UX-004: Add skeleton loaders and responsive refinement
- [ ] Replace "Loading..." text with skeleton components in key views.
- [ ] Improve tablet breakpoint behavior and mobile table scroll hints.
- **Target files:** administration and tenants feature styles/templates

---

## Verification Checklist (Release Evidence)

### Security and Auth Evidence
- [ ] Unauthenticated navigation to protected routes redirects to login.
- [ ] Authenticated session can logout and cannot call protected APIs afterwards.
- [ ] `X-Tenant-ID` header is UUID and matches selected/resolved tenant.
- [ ] `Authorization` header is present for protected API calls.
- [ ] Non-master user with no seat gets deterministic `403 no_active_seat` UX.

### Multi-Tenant and Provider Evidence
- [ ] Tenant resolved from domain at startup.
- [ ] Login and tenant admin display provider list from backend, not static mocks.
- [ ] Cross-tenant IDOR attempts are denied at backend authorization layer.

### UX and Accessibility Evidence
- [ ] Skip link, keyboard navigation, visible labels, and focus outline checks pass.
- [ ] Error pages render without full shell chrome.
- [ ] 404 route preserves user context with recovery actions.

### Test and Build Evidence
- [ ] `frontend`: `npm run typecheck`, `npm run build`, e2e smoke.
- [ ] `backend`: targeted security/integration tests for auth, tenant, license paths.
- [ ] Staging runbook includes screenshots and API call traces for all P0 gates.

---

## Ownership

- **Product/UX:** finalize intended UX behavior for administration landing, errors, and reset flows.
- **Frontend:** implement P0/P1/P2 UI and routing tasks.
- **Backend:** enforce security hardening and service trust boundaries.
- **QA/Security:** own release evidence and gate sign-off.
