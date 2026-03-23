# ISSUE-INF-019: Session Lifecycle Not Enforced End-to-End

| Field | Value |
|-------|-------|
| Severity | MEDIUM |
| Category | Architecture |
| Source | SA-AUDIT-2026-002 |
| Priority | P2 |
| Status | OPEN |
| Opened | 2026-03-02 |
| Blocked By | — |
| Fixes | auth-facade, api-gateway, frontend |
| Closes With | Session TTL governance + concurrent session limits |

## Description

While auth-facade implements login/logout/refresh flows and token blacklisting in Valkey, there is no enforced governance over session lifetimes:

1. No maximum concurrent session limit per user
2. No inactivity timeout (idle session expiry)
3. No session revocation on password change
4. Token blacklist TTL is not guaranteed to match token lifetime
5. Frontend does not enforce idle timeout (no activity watchdog)

## Evidence

- `AuthServiceImpl.java`: Implements login/logout/refresh but no concurrent session tracking
- `TokenServiceImpl.java`: Blacklists tokens on logout with TTL, but no idle timeout mechanism
- No `auth:sessions:{userId}` counter in Valkey
- Frontend `auth-facade.ts`: No idle timeout or activity detection

## Remediation

1. Add concurrent session tracking in Valkey (`auth:sessions:{userId}` → set of active JTIs)
2. Configure Keycloak session limits (SSO Session Idle, SSO Session Max)
3. Add frontend idle timeout with warning dialog
4. Revoke all sessions on password change
5. Document session TTL governance in arc42/08

## Acceptance Criteria

- [ ] Maximum concurrent sessions configurable per tenant
- [ ] Inactivity timeout enforced (configurable, default 30min)
- [ ] Password change revokes all existing sessions
- [ ] Session lifecycle documented in arc42/06 and arc42/08
