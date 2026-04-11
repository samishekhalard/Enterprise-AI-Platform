# Frontend Migration Checklist

## Phase 1: Foundation (done)

- [x] Bootstrap new Angular app (now at `frontend/`).
- [x] Add API gateway wiring (`/api/health`, `/api/version`, `/api/tenants`, `/api/v1/auth/login`).
- [x] Add quality gates (format, lint, typecheck, test, build).
- [x] Add CI workflow for `frontend/**` changes.
- [x] Add shared shell/page container layout contract (`header/content/footer`).

## Phase 2: Feature migration (next)

- [ ] Define route parity matrix vs old frontend.
- [~] Migrate authentication flows with full token/session handling.
- [x] Migrate password reset request and confirm pages.
- [ ] Migrate callback, logout, MFA, and session-management auth pages.
- [x] Migrate core error pages (access denied, session expired, tenant not found).
- [ ] Migrate administration sections module-by-module.
- [ ] Add integration tests for migrated flows.

## Phase 3: Cutover

- [ ] UAT sign-off for migrated feature parity.
- [x] Freeze legacy `frontendold/` except critical hotfixes.
- [ ] Switch deployment pipeline to `frontend/`.
- [x] Remove `frontendold/` from tracked repo (retired, local archive at `Documentation/.stale/frontendold/`).
