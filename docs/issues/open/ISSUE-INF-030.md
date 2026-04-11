# ISSUE-INF-030: process_db Created But Not Used

| Field | Value |
|-------|-------|
| Severity | LOW |
| Category | Data Isolation |
| Source | SA-AUDIT-2026-002 |
| Priority | P3 |
| Status | OPEN |
| Opened | 2026-03-02 |
| Blocked By | ISSUE-INF-028 |
| Fixes | infrastructure/docker/init-db.sql, process-service application.yml |
| Closes With | Connect process-service to process_db |

## Description

`process_db` is created in `init-db.sql` during PostgreSQL initialization, but no service connects to it. process-service is not running in Docker Compose (see ISSUE-INF-028), and its `application.yml` may default to the wrong database.

## Evidence

- `infrastructure/docker/init-db.sql`: `CREATE DATABASE process_db;` exists
- process-service `application.yml`: Contains database URL but service is not in Docker Compose
- No Flyway migrations have been applied to `process_db` in a running stack
- Database exists but has no tables

## Remediation

1. Resolve ISSUE-INF-028 first (add process-service to Docker Compose)
2. Verify process-service `application.yml` points to `process_db`
3. Confirm Flyway migrations create expected tables
4. Add per-service user for process_db (after ISSUE-INF-010 is resolved)

## Acceptance Criteria

- [ ] process-service connects to `process_db`
- [ ] Flyway migrations applied successfully
- [ ] Tables exist in `process_db`
- [ ] Per-service user `svc_process` has access to `process_db` only
