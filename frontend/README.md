# Frontend (Migration Baseline)

`frontend` is the new Angular 21 frontend baseline for EMS. It is intentionally small, strictly typed, and wired directly to the backend API gateway so we can migrate features in controlled increments.

## Goals

- Ship a clean foundation with enforceable quality gates.
- `frontendold/` has been retired from the tracked repo. A local reference archive exists at `Documentation/.stale/frontendold/`.

## Implemented wiring

- `GET /api/health` and `GET /api/version` from administration modules.
- `GET /api/tenants` on tenants page.
- `POST /api/v1/auth/login` smoke-test form.
- `X-Tenant-ID` header interceptor for API calls.

## Run locally

```bash
cd frontend
npm install
npm run start
```

Notes:

- `npm run start` uses `proxy.conf.json` and routes `/api/*` to `http://localhost:8080`.
- To call backend directly without proxy, set `apiBaseUrl` in `src/environments/environment.development.ts`.

## Governance (always-on cleanliness)

Local gates:

```bash
npm run format:check
npm run lint
npm run typecheck
npm run test
npm run build
```

One-shot gate:

```bash
npm run validate
```

CI gate:

- `.github/workflows/frontend-strict-quality.yml` runs strict checks on PRs/pushes that touch `frontend/**`.

## Layout contract (mandatory for every migrated module)

- Global shell container: `src/app/layout/shell-layout/`
- Page frame container: `src/app/layout/page-frame/`
- Every page must follow: `header-container` -> `content-container` -> `footer-container`
- Use shared utility classes for consistency: `.app-panel`, `.app-alert`, `.app-btn`
- Automated enforcement: `scripts/check-frontend-layout-contract.sh frontend`

## Migration policy

1. Build new or migrated features only in `frontend/`.
2. Keep components standalone and feature-scoped.
3. Keep API access in `src/app/core/api/`.
4. Use `PageFrame` for every module page to avoid layout drift.
5. Remove old frontend only after user-facing parity and sign-off.

Detailed phases are tracked in [MIGRATION-CHECKLIST.md](./MIGRATION-CHECKLIST.md).
