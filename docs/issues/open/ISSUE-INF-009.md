# ISSUE-INF-009: 7/8 Backend Services Lack JWT Validation

| Field | Value |
|-------|-------|
| Severity | HIGH |
| Category | Security |
| Source | SEC-07 |
| Priority | P1 |
| Status | OPEN |
| Opened | 2026-03-02 |
| Blocked By | — |
| Fixes | Backend service security configurations (source code change) |
| Closes With | Phase 3 — Requires SEC + DEV agents |

## Description

Only `auth-facade` has a `JwtValidationFilter` that validates JWT tokens. All other 7 backend services use Spring Security with `.permitAll()` — meaning any request that reaches them (via API gateway or directly) is accepted without authentication.

The API gateway adds tenant context headers but does NOT validate JWT tokens. If a service port is exposed (ISSUE-INF-006), requests bypass both gateway and auth entirely.

## Evidence

- `backend/auth-facade/src/main/java/.../filter/JwtValidationFilter.java` — EXISTS
- Other 7 services: No JWT filter, no `@PreAuthorize` on endpoints
- Spring Security config in most services: `.authorizeHttpRequests(auth -> auth.anyRequest().permitAll())`

## Remediation

Add JWT validation filter to each backend service:
1. Shared JWT validation library in `backend/common/`
2. Each service imports and configures the filter
3. API gateway validates JWT and forwards claims as headers
4. Backend services verify JWT signature + check claims

**Note:** This is a source code change requiring SEC + DEV agents (Phase 3).

## Acceptance Criteria

- [ ] Each backend service validates JWT tokens on protected endpoints
- [ ] Requests without valid JWT return 401
- [ ] Requests with valid JWT but wrong tenant return 403
