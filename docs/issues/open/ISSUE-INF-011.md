# ISSUE-INF-011: application.yml Defaults Point to Wrong Database

| Field | Value |
|-------|-------|
| Severity | HIGH |
| Category | Data Isolation |
| Source | SA F2 |
| Priority | P1 |
| Status | OPEN |
| Opened | 2026-03-02 |
| Blocked By | — |
| Fixes | All 7 backend service application.yml files |
| Closes With | Phase 2 or Phase 3 |

## Description

In local development (without Docker overrides), all backend services default to connecting to `master_db` instead of their own database. Docker Compose corrects this via `application-docker.yml` overrides, but local development breaks data isolation.

## Evidence

- `backend/user-service/src/main/resources/application.yml`: `url: ${DATABASE_URL:jdbc:postgresql://localhost:5432/master_db}`
- Same for license-service, notification-service, audit-service, process-service
- Docker overrides (application-docker.yml) correctly point to per-service databases
- Local dev without overrides: all services write to `master_db`

## Remediation

Remove fallback database URL defaults or change them to the correct per-service database:
- `${DATABASE_URL}` (no default — fails fast) or
- `${DATABASE_URL:jdbc:postgresql://localhost:5432/user_db}` (correct default)

## Acceptance Criteria

- [ ] Each service's application.yml references its own database (or no default)
- [ ] Running locally without Docker overrides connects to the correct database
- [ ] Flyway migrations do not collide across services in local development
