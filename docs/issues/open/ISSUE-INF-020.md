# ISSUE-INF-020: Token Blacklist Not Verified in API Gateway

| Field | Value |
|-------|-------|
| Severity | MEDIUM |
| Category | Security |
| Source | SEC-12 |
| Priority | P2 |
| Status | OPEN |
| Opened | 2026-03-02 |
| Blocked By | — |
| Fixes | backend/api-gateway |
| Closes With | Gateway filter checks Valkey blacklist before routing |

## Description

When a user logs out, auth-facade adds the token's `jti` to the Valkey blacklist (`auth:blacklist:{jti}`). However, the API gateway does not check this blacklist when validating incoming JWTs. A logged-out token remains usable until it naturally expires.

## Evidence

- `api-gateway/src/.../filter/TenantContextFilter.java`: Extracts tenant from JWT but does not check blacklist
- `api-gateway/pom.xml` line 43-44: `spring-boot-starter-data-redis-reactive` **IS present** — gateway already has Valkey connectivity (used for rate limiting)
- `api-gateway/src/main/resources/application.yml` lines 79-82: `spring.data.redis` **IS configured**
- `auth-facade/src/.../service/TokenServiceImpl.java`: Adds `jti` to blacklist on logout
- **Actual gap:** `TokenBlacklistFilter` class does not exist in api-gateway — the Valkey connection is used for rate limiting but not for JWT blacklist lookup

> **QA Correction (2026-03-03):** Earlier evidence incorrectly stated "No Valkey dependency in api-gateway pom.xml". QA cross-verification confirmed the dependency and configuration already exist. Only the `TokenBlacklistFilter` implementation is missing.

## Remediation

1. Create `TokenBlacklistFilter` in api-gateway that checks `auth:blacklist:{jti}` on every request (Valkey dependency already present — no new dependency needed)
2. If JTI found in blacklist → return 401 Unauthorized
3. Filter order: TenantContextFilter → TokenBlacklistFilter → Route

## Acceptance Criteria

- [ ] API gateway checks Valkey blacklist for every authenticated request
- [ ] Logged-out tokens are rejected immediately (not after natural expiry)
- [ ] Blacklist check adds <5ms latency (Valkey GET is O(1))
- [ ] Gateway gracefully handles Valkey unavailability (fail-open with logging)
