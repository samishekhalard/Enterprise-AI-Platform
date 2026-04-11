# ISSUE-005: Auth Boundary Bypass via Permissive Gateway and Header Trust

## Metadata

- **Issue ID:** ISSUE-005
- **Status:** Open
- **Priority:** Critical
- **Category:** Security / Authorization / Infrastructure
- **Reported On:** 2026-03-03
- **Affected Areas:** `api-gateway`, `tenant-service`, `user-service`, `license-service`, `audit-service`, `notification-service`, `ai-service`, Docker exposure model

## Summary

Authentication and authorization are not enforced at the API gateway boundary, while multiple downstream services accept all requests and trust caller-supplied identity headers (`X-User-ID`, `X-Tenant-ID`) for authorization decisions.

This creates a direct path for unauthorized data access and privilege abuse if an attacker can reach gateway routes or exposed service ports.

## Trigger / Problem Statement

- Triggered by security re-inspection after admin navigation/auth concerns.
- This matters now because the current trust model allows identity spoofing and privileged operations without cryptographic identity verification at service boundaries.

## Environment

- **Environment:** local/dev/stg configurations (code-level finding; impact depends on deployment exposure)
- **Frontend build/tag:** `0.1.0`
- **Backend build/tag:** `0.1.0`
- **Browser/Device:** N/A (server-side trust boundary issue)
- **User/Role:** Any network caller with HTTP access to exposed endpoints
- **Tenant Context:** All tenants potentially affected

## Evidence Collected

- API gateway permits all exchanges:
  - `backend/api-gateway/src/main/java/com/ems/gateway/config/SecurityConfig.java` (`.anyExchange().permitAll()`)
- Tenant service allows tenant management APIs without JWT:
  - `backend/tenant-service/src/main/java/com/ems/tenant/config/SecurityConfig.java` (`/api/tenants/**` is `permitAll`)
- User service allows all requests and trusts headers:
  - `backend/user-service/src/main/java/com/ems/user/config/SecurityConfig.java` (`.anyRequest().permitAll()`)
  - `backend/user-service/src/main/java/com/ems/user/controller/UserController.java` (uses `X-User-ID` and `X-Tenant-ID` as identity source)
- License service allows all requests, including admin/internal routes:
  - `backend/license-service/src/main/java/com/ems/license/config/SecurityConfig.java` (`.anyRequest().permitAll()`)
  - `backend/license-service/src/main/java/com/ems/license/controller/LicenseAdminController.java` (`/api/v1/admin/licenses/**` trusts `X-User-ID`)
  - `backend/license-service/src/main/java/com/ems/license/controller/SeatValidationController.java` (`/api/v1/internal/seats/**` without auth boundary)
- Additional services also `permitAll`:
  - `backend/audit-service/src/main/java/com/ems/audit/config/SecurityConfig.java`
  - `backend/notification-service/src/main/java/com/ems/notification/config/SecurityConfig.java`
  - `backend/ai-service/src/main/java/com/ems/ai/config/SecurityConfig.java`
- Host-exposed service ports widen attack surface:
  - `docker-compose.dev.yml` and `docker-compose.staging.yml` expose gateway and multiple backend services directly on host ports.

## Root Cause

### Confirmed Root Cause

1. API gateway is configured as a pass-through router and does not enforce JWT authorization for protected routes.
2. Downstream services are configured with `permitAll` and rely on untrusted HTTP headers for user/tenant identity.
3. Deployment files expose backend service ports directly, enabling bypass of intended trust boundaries.

### Contributing Factors

- Trust-by-convention architecture (“gateway validates, services trust”) is not implemented consistently.
- Missing service-to-service authentication for “internal” endpoints.
- Lack of deny-by-default policy at both gateway and service layers.

## Remediation Actions

1. Enforce JWT validation and authorization at gateway for all non-public routes (deny-by-default).
2. Remove host port exposure for backend microservices; expose only gateway and required edge endpoints.
3. Replace header-trust authorization with authenticated principal/claims extraction in services.
4. Protect internal service endpoints with service authentication (mTLS or signed service token).
5. Add automated security regression tests for unauthenticated and header-spoofed requests.

## Verification Plan

1. Attempt protected API calls without Authorization header and confirm `401/403`.
2. Attempt header spoof (`X-User-ID`, `X-Tenant-ID`) with invalid/absent JWT and confirm denial.
3. Verify direct access to backend service ports is not reachable externally.
4. Validate auth/login/refresh/logout happy paths still operate through gateway.

## Acceptance Criteria

- [ ] Non-public APIs are inaccessible without valid JWT and correct roles.
- [ ] Identity headers cannot grant privileges without validated token claims.
- [ ] Internal service endpoints require authenticated service identity.
- [ ] Backend services are not directly exposed on host in deployment profiles.

## Risks / Dependencies

- Hardening will break clients that currently rely on implicit header trust.
- Requires coordinated changes across gateway, service security configs, and deployment manifests.

## Related

- `docs/issues/open/ISSUE-004-admin-back-forward-login-history-loop.md`
- `docs/issues/open/ISSUE-INF-009.md`
- `docs/issues/open/ISSUE-INF-006.md`
