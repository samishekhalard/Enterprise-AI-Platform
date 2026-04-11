# ISSUE-INF-028: process-service Has No Docker Compose Entry

| Field | Value |
|-------|-------|
| Severity | LOW |
| Category | Architecture |
| Source | ARCH-AUDIT-2026-001 |
| Priority | P3 |
| Status | OPEN |
| Opened | 2026-03-02 |
| Blocked By | — |
| Fixes | docker-compose.*.yml |
| Closes With | Add process-service to Docker Compose or document as excluded |

## Description

process-service exists as a backend module (`backend/process-service/`) with source code, Flyway migrations, and a Dockerfile, but it has no entry in any Docker Compose file. It cannot be started as part of the development or staging stack.

## Evidence

- `backend/process-service/` exists with `src/main/java/`, `pom.xml`, `Dockerfile`
- `backend/process-service/src/main/resources/db/migration/` contains Flyway migrations
- docker-compose.dev.yml: No `process-service` service entry
- docker-compose.staging.yml: No `process-service` service entry
- `process_db` is created in `init-db.sql` but unused

## Remediation

1. Add `process-service` to Docker Compose files with proper configuration
2. Route through API gateway (see ISSUE-INF-029)
3. Verify Flyway migrations run against `process_db`

## Acceptance Criteria

- [ ] process-service starts in Docker Compose stack
- [ ] Flyway migrations apply to process_db
- [ ] Health check passes at `/actuator/health`
