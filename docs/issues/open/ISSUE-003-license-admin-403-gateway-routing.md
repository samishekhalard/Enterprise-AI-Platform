# ISSUE-003: License Management Shows "Insufficient Permissions" Due to Gateway Routing and Auth Mismatch

## Metadata

- **Issue ID:** ISSUE-003
- **Status:** In Progress
- **Priority:** High
- **Category:** API Gateway / Authorization / Tenant Licensing
- **Reported On:** 2026-03-02
- **Affected Areas:** `frontend` licensing tab, `api-gateway` docker routes, `auth-facade` admin security, `license-service` admin endpoints

## Summary

The frontend fix to disable licensing for the master tenant is in place, but licensing for regular/dominant tenants still fails with `403` (`Insufficient permissions for license management`).

Primary finding: in docker-based environments, `/api/v1/admin/licenses/**` is not explicitly routed to `license-service`, so requests are captured by the `/api/v1/admin/**` catch-all route to `auth-facade` and rejected by admin role checks.

## Update (2026-03-02)

Implemented in source:

1. Docker gateway routes now include explicit license admin and seats routes before admin catch-all:
   - `backend/api-gateway/src/main/resources/application-docker.yml`
2. Admin auth chain now allows both ADMIN and SUPER_ADMIN:
   - `backend/auth-facade/src/main/java/com/ems/auth/config/DynamicBrokerSecurityConfig.java`
3. Frontend license import now sends required `X-User-ID` from session subject:
   - `frontend/src/app/core/api/api-gateway.service.ts`
   - `frontend/src/app/features/administration/services/admin-license.service.ts`
4. Tenant manager embedded tabs now pass UUID context where available:
   - `frontend/src/app/features/administration/sections/tenant-manager/tenant-manager-section.component.ts`
   - `frontend/src/app/features/administration/sections/tenant-manager/tenant-manager-section.component.html`

Pending:

- Runtime end-to-end verification in the active deployment image/tag (dev/stg) with authenticated session.

## Evidence Collected

### 1) Frontend guard fix is present (UI-only)

- Master tenant licenses tab is disabled and guarded:
  - `frontend/src/app/features/administration/sections/tenant-manager/tenant-manager-section.component.html` (licenses tab disabled for master)
  - `frontend/src/app/features/administration/sections/tenant-manager/tenant-manager-section.component.ts` (`onTabChange`/selection guard)

### 2) Frontend licensing APIs that fail are admin-license endpoints

- `frontend/src/app/core/api/api-gateway.service.ts`
  - `GET /api/v1/admin/licenses/status`
  - `GET /api/v1/admin/licenses/current`
  - `POST /api/v1/admin/licenses/import`
- `frontend/src/app/features/administration/services/admin-license.service.ts`
  - Maps `403` to: `Insufficient permissions for license management.`

### 3) Non-docker gateway config contains correct license-admin route precedence

- `backend/api-gateway/src/main/java/com/ems/gateway/config/RouteConfig.java`
  - Explicit route `/api/v1/admin/licenses/** -> license-service`
  - Explicit route `/api/v1/tenants/*/seats/** -> license-service`
  - Declared before `/api/v1/admin/** -> auth-facade`
- Same class is `@Profile("!docker")`, so this config is inactive for docker profile.

### 4) Docker gateway route config misses license-admin routes

- `backend/api-gateway/src/main/resources/application-docker.yml`
  - Has `/api/v1/admin/** -> auth-facade`
  - Does **not** define `/api/v1/admin/licenses/**`
  - Does **not** define `/api/v1/tenants/*/seats/**`

Status update:

- Addressed in source; this section reflects pre-fix behavior.

### 5) Docker compose enables docker profile for API gateway

- `docker-compose.dev.yml` and `docker-compose.staging.yml`
  - `api-gateway` sets `SPRING_PROFILES_ACTIVE: docker`

### 6) Misrouted requests hit auth-facade admin chain

- `backend/auth-facade/src/main/java/com/ems/auth/config/DynamicBrokerSecurityConfig.java`
  - `/api/v1/admin/**` requires `hasRole("ADMIN")`
- If a license-admin request is misrouted here, `403` is expected for non-ADMIN tokens.

### 7) License-service itself is not enforcing this 403 at filter level

- `backend/license-service/src/main/java/com/ems/license/config/SecurityConfig.java`
  - `anyRequest().permitAll()`
- `backend/license-service/src/main/java/com/ems/license/controller/LicenseAdminController.java`
  - License admin endpoints exist at `/api/v1/admin/licenses/**`

Additional context:

- Frontend tenant licensing tab previously used tenant logical ID; now aligned to UUID context (fallback to ID) for tenant-scoped calls.

## Root Cause

### Primary root cause

1. **Gateway route omission in docker profile**
   - Docker route config lacks explicit license-admin and tenant-seat routes.
   - Requests fall into `/api/v1/admin/**` catch-all and are forwarded to `auth-facade`.

### Secondary root cause

2. **Authorization mismatch on misrouted path**
   - `auth-facade` admin chain enforces `hasRole('ADMIN')` only.
   - SUPER_ADMIN-only tokens can receive `403` on misrouted admin calls.

### Additional follow-up risk (post-routing)

3. **License import request header requirement**
   - `LicenseAdminController#importLicense` requires `X-User-ID` header.
   - Frontend `importLicense()` currently posts file without `X-User-ID`; this can surface as `400` after routing is fixed.

## Remediation Actions

### A) API gateway routing fix (mandatory)

1. Add explicit docker routes in `application-docker.yml`:
   - `/api/v1/admin/licenses/** -> license-service`
   - `/api/v1/tenants/*/seats/** -> license-service`
2. Ensure these routes are evaluated before `/api/v1/admin/**` catch-all.
3. Add gateway routing tests/assertions for these paths in docker profile.

### B) Authorization consistency hardening (mandatory)

1. Align admin authorization with platform role hierarchy:
   - `hasAnyRole('ADMIN','SUPER_ADMIN')` where intended.
2. Keep this aligned with ISSUE-002 remediation for admin provider/user endpoints.

### C) License import contract fix (mandatory)

1. Send `X-User-ID` for `/api/v1/admin/licenses/import` from authenticated session subject.
2. Prefer server-side derivation from JWT subject when feasible to avoid trust-on-header coupling.

### D) Operational verification (mandatory)

1. Validate in both `dev` and `stg` docker stacks.
2. Verify route hit destination with gateway debug logs and response signatures.
3. Confirm `status`, `current`, and `import` flows return expected status codes.

## Verification Plan

1. Start stack with docker profile and confirm active routes.
2. Call through gateway:
   - `GET /api/v1/admin/licenses/status`
   - `GET /api/v1/admin/licenses/current`
   - `GET /api/v1/tenants/{tenantId}/seats/availability`
3. Confirm responses come from license-service (not auth-facade).
4. Login as SUPER_ADMIN and verify licensing UI loads without 403.
5. Import a license file and verify request succeeds with valid user identity context.

## Expected Outcome After Fix

- Regular/dominant tenant licensing pages load seat/license data without false permission errors.
- Docker `dev`/`stg` behavior matches non-docker gateway routing intent.
- Licensing APIs fail only for true authorization or validation issues, not route misconfiguration.

## Related

- `docs/issues/open/ISSUE-002-tenant-auth-providers-access-denied.md`
