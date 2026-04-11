# ISSUE-002: Tenant Authentication Tab Shows "No Identity Providers" Despite Preconfigured Keycloak

## Metadata

- **Issue ID:** ISSUE-002
- **Status:** In Progress
- **Priority:** High
- **Category:** Authentication / Authorization / UX
- **Reported On:** 2026-03-01
- **Affected Areas:** `frontend` tenant authentication tab, `auth-facade` admin provider APIs

## Summary

In `Administration -> Tenant Manager -> Authentication`, the UI shows:

- `Access denied for tenant providers. Verify ADMIN scope and tenant context.`
- `No identity providers configured for this tenant.`

This is incorrect for the master tenant because Keycloak is preconfigured by design.

## Update (2026-03-02)

Implemented in source:

1. Backend admin authorization now accepts both ADMIN and SUPER_ADMIN:
   - `backend/auth-facade/src/main/java/com/ems/auth/config/DynamicBrokerSecurityConfig.java`
   - `backend/auth-facade/src/main/java/com/ems/auth/controller/AdminProviderController.java`
   - `backend/auth-facade/src/main/java/com/ems/auth/controller/AdminUserController.java`
2. Frontend tenant tab now uses tenant UUID context for auth/user/license embedded components (fallback to ID):
   - `frontend/src/app/features/administration/sections/tenant-manager/tenant-manager-section.component.ts`
   - `frontend/src/app/features/administration/sections/tenant-manager/tenant-manager-section.component.html`

Pending:

- Runtime verification in target environment (`dev`/`stg`) with real session token and provider list load.

## Evidence Collected

### 1) Frontend is receiving `403` and still rendering empty-state

- Provider error mapping explicitly maps HTTP `403` to the shown message:
  - `frontend/src/app/features/admin/identity-providers/provider-embedded.component.ts` (`resolveErrorMessage`, status `403`)
- On error, providers are cleared and empty-state card remains visible:
  - `frontend/src/app/features/admin/identity-providers/provider-embedded.component.ts` (`this.providers.set([])` in error path)
  - `frontend/src/app/features/admin/identity-providers/provider-embedded.component.html` (empty-state card rendered when list empty)

### 2) Admin provider endpoint currently requires `ADMIN` role only

- Global admin security matcher:
  - `backend/auth-facade/src/main/java/com/ems/auth/config/DynamicBrokerSecurityConfig.java`
  - `requestMatchers("/api/v1/admin/**").hasRole("ADMIN")`
- Controller method-level guards:
  - `backend/auth-facade/src/main/java/com/ems/auth/controller/AdminProviderController.java`
  - `@PreAuthorize("hasRole('ADMIN')")` on admin provider endpoints
- Same pattern exists for tenant user admin endpoints:
  - `backend/auth-facade/src/main/java/com/ems/auth/controller/AdminUserController.java`
  - `@PreAuthorize("hasRole('ADMIN')")`

Status update:

- Addressed in source using `hasAnyRole('ADMIN','SUPER_ADMIN')`; this section reflects pre-fix behavior.

### 3) Runtime logs show token has `ROLE_SUPER_ADMIN` but not `ROLE_ADMIN`

Observed in `ems-stg-auth-facade-1` logs at `2026-03-01T13:49:48` for request:

- `GET /api/v1/admin/tenants/tenant-master/providers`
- Granted authorities include `ROLE_SUPER_ADMIN` (and built-ins), but no `ROLE_ADMIN`

This creates an authorization mismatch when endpoint checks `hasRole('ADMIN')` strictly.

### 4) Keycloak master provider is expected to exist by design

- Master tenant bootstrap in auth graph:
  - `backend/auth-facade/src/main/resources/neo4j/migrations/V005__create_master_tenant.cypher`
  - `backend/auth-facade/src/main/resources/neo4j/migrations/V008__fix_master_tenant_seed_superuser.cypher`
- Resolver has explicit master fallback returning default Keycloak config:
  - `backend/auth-facade/src/main/java/com/ems/auth/provider/Neo4jProviderResolver.java`
  - `listProviders()` returns default when `RealmResolver.isMasterTenant(tenantId)` is true

## Current Setup (As Implemented)

1. **Master tenant identity baseline**
   - Tenant service seeds master tenant as `tenant-master` with UUID `68cd2a56-98c9-4ed4-8534-c299566d5b27`:
     - `backend/tenant-service/src/main/resources/db/migration/V2__seed_default_tenant.sql`

2. **Frontend tenant context**
   - Default tenant and aliases map to master UUID:
     - `frontend/src/environments/environment.development.ts`
     - `frontend/src/environments/environment.production.ts`

3. **Authentication bootstrap**
   - Keycloak init creates `SUPER_ADMIN` hierarchy and superadmin user attribute `tenant_id`:
     - `infrastructure/keycloak/keycloak-init.sh`

4. **Tenant Authentication tab call path**
   - Frontend selects tenant from tenant list and calls:
     - `GET /api/v1/admin/tenants/{tenantId}/providers`
   - In current UI, `{tenantId}` uses `tenant.id` from tenant list:
     - `frontend/src/app/features/administration/sections/tenant-manager/tenant-manager-section.component.html`

## Existing Design Documents (Relevant)

- `docs/requirements/RBAC-LICENSING-REQUIREMENTS.md`
  - US-002f / US-002a define SUPER_ADMIN admin-access expectations and inheritance behavior
- `docs/lld/auth-facade-lld.md`
  - Defines admin provider management API under `/api/v1/admin/tenants/{tenantId}/providers`
- `docs/adr/ADR-004-keycloak-authentication.md`
  - Keycloak-first BFF architecture baseline
- `docs/adr/ADR-009-auth-facade-neo4j-architecture.md`
  - Dynamic provider resolver and per-tenant auth config in Neo4j
- `docs/data-models/neo4j-auth-graph-schema.md`
  - Auth graph model with Tenant/Provider/Config relationships

## Root Cause

Primary root cause:

1. **Authorization rule mismatch for superadmin**
   - Backend enforces `hasRole('ADMIN')` on admin provider endpoints.
   - Runtime token contains `ROLE_SUPER_ADMIN` but not always `ROLE_ADMIN`.
   - No role hierarchy mapping is applied at authorization checks to infer ADMIN from SUPER_ADMIN.
   - Result: request is rejected with `403` before provider resolution.

Additional confirmed root cause:

2. **Tenant identifier mismatch in frontend tenant tabs**
   - Tenant-scoped admin APIs are expected to align with token tenant context (UUID in current setup).
   - The tenant manager tab passed logical tenant ID (`tenant.id`) instead of UUID to auth/user/license embedded components.
   - This can trigger tenant-context authorization failures.

Secondary root cause (UX):

3. **Frontend conflates authorization failure with empty data**
   - On `403`, providers list is reset to empty and empty-state message still renders.
   - User sees contradictory signals: access denied + "No identity providers configured."

Operational risk observed during investigation:

4. **Neo4j container instability in local stacks**
   - `ems-stg-neo4j-1` and `ems-dev-neo4j-1` were exited (137), causing `auth-facade` health degradation.
   - This is a separate reliability issue that can break non-master provider reads.

## Remediation Actions

### A) Backend authorization fix (mandatory)

1. Change admin endpoint authorization to allow superadmin explicitly:
   - `hasAnyRole('ADMIN','SUPER_ADMIN')`
2. Apply consistently in:
   - `DynamicBrokerSecurityConfig` admin matcher
   - `AdminProviderController` method guards
   - `AdminUserController` method guards
   - Any admin-only checks implemented manually (e.g., `EventController#requireAdminRole`)
3. Add integration tests for:
   - `ROLE_ADMIN` access = allowed
   - `ROLE_SUPER_ADMIN` access = allowed
   - non-admin roles = denied

### B) Frontend error-state correction (mandatory)

1. Suppress empty-state card when there is an API error.
2. Keep provider list rendering conditional on successful fetch.
3. Show explicit unauthorized guidance only for `403`.

### C) Tenant identifier consistency hardening (recommended)

1. Standardize which identifier is used in admin APIs (UUID vs logical ID).
2. Ensure tenant ID in route path, token claim, and auth-graph tenant key use one canonical format or strict mapping layer.

### D) Environment stabilization (recommended)

1. Restore Neo4j containers in dev/stg stacks.
2. Verify `auth-facade` healthy after Neo4j restoration.
3. Add pre-flight check in environment scripts for Neo4j container readiness.

## Verification Plan

1. Login as superadmin and open:
   - `Administration -> Tenant Manager -> Authentication`
2. Confirm provider list returns `200` and displays Keycloak config for master tenant.
3. Confirm no empty-state appears when access fails.
4. Run auth-facade security tests covering ADMIN and SUPER_ADMIN variants.
5. Validate both `dev` and `stg` stacks with healthy Neo4j.

## Expected Outcome After Fix

- Master tenant authentication tab displays the preconfigured Keycloak provider.
- SUPER_ADMIN can access tenant authentication/provider management as intended by requirements.
- UI no longer misreports "No identity providers configured" on authorization failures.
