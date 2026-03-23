# ISSUE-INF-004: All Services Use `postgres` Superuser

| Field | Value |
|-------|-------|
| Severity | CRITICAL |
| Category | Security |
| Source | SEC-03 |
| Priority | P0 |
| Status | RESOLVED |
| Opened | 2026-03-02 |
| Blocked By | — |
| Fixes | infrastructure/docker/init-db.sql, .env.example, .env.dev, .env.staging, docker-compose.*.yml |
| Closes With | Phase 2 — Per-Service DB Users |
| ADR | ADR-020 |

## Description

All 7 backend services connect to PostgreSQL as the `postgres` superuser with the same password. This means any single compromised service can read, write, or DROP any of the 8 databases (master_db, user_db, license_db, notification_db, audit_db, ai_db, process_db, keycloak_db).

## Evidence

- All `application.yml` files: `spring.datasource.username: ${DATABASE_USER:postgres}`
- All `application-docker.yml` files: `DATABASE_USER: ${DATABASE_USER:-postgres}`
- `docker-compose.dev.yml`: `DATABASE_USER: ${DATABASE_USER:-postgres}` (shared across all services)
- `infrastructure/docker/init-db.sql`: Only `keycloak` user is created; no per-service users
- Only Keycloak has a dedicated, non-superuser database user

## Remediation

1. Create per-service PostgreSQL users in `init-db.sql` with SCRAM-SHA-256 authentication
2. Grant each user access to ONLY its own database
3. REVOKE ALL ON all databases FROM PUBLIC
4. Add service user credentials to `.env` files (never in source code)
5. Update docker-compose environment variables to pass per-service credentials

## Acceptance Criteria

- [ ] `psql -U svc_tenant -d master_db -c "SELECT 1"` succeeds
- [ ] `psql -U svc_tenant -d user_db -c "SELECT 1"` fails with permission denied
- [ ] Each service starts and connects with its own dedicated user
- [ ] No service uses `postgres` superuser
- [ ] All credentials are in `.env` files, not in source code

## Resolution

**Date:** 2026-03-03
**Resolved By:** DBA Agent (Phase 2 -- Per-Service DB Users)
**ADR:** ADR-020

### Changes Made

1. **Created `infrastructure/docker/init-db.sh`** -- Replaces `init-db.sql` with a shell script that reads per-service passwords from environment variables and creates 8 dedicated database users with SCRAM-SHA-256 authentication. Each user is granted access to ONLY its own database. `REVOKE ALL ON DATABASE ... FROM PUBLIC` is applied to all 8 databases.

2. **Created `infrastructure/docker/.env.dev.template`** and **`.env.staging.template`** -- Document all required environment variables with `CHANGE_ME` placeholder values. Developers copy these to `.env.dev` / `.env.staging` and replace placeholders with generated passwords.

3. **Updated `docker-compose.dev.yml`** -- PostgreSQL service now mounts `init-db.sh` (not `.sql`) and receives all `SVC_*_PASSWORD` env vars. Each backend service now uses its per-service username (hardcoded) and password (from per-service env var). No service uses `${DATABASE_USER:-postgres}` anymore.

4. **Updated `docker-compose.staging.yml`** -- Same per-service credential changes as dev.

5. **Updated `.gitignore`** -- Added `infrastructure/docker/.env.dev`, `.env.staging`, `.env.production` to prevent accidental commit of secrets.

### Per-Service User Mapping (Implemented)

| Service | DB User | Database | Privileges |
|---------|---------|----------|------------|
| tenant-service | `svc_tenant` | `master_db` | Full CRUD + DDL |
| user-service | `svc_user` | `user_db` | Full CRUD + DDL |
| license-service | `svc_license` | `license_db` | Full CRUD + DDL |
| notification-service | `svc_notify` | `notification_db` | Full CRUD + DDL |
| audit-service | `svc_audit` | `audit_db` | Append-only (INSERT + SELECT) |
| ai-service | `svc_ai` | `ai_db` | Full CRUD + DDL |
| process-service | `svc_process` | `process_db` | Full CRUD + DDL |
| keycloak | `kc_db_user` | `keycloak_db` | Full (ALL) |

### Remaining Work

- **Phase 3 (ADR-020):** Remove hardcoded fallback defaults from `application.yml` files (`${DATABASE_USER:postgres}` -> `${DATABASE_USER}`). This is a separate Java source code change that requires DEV agent involvement.
- **Production:** Kubernetes Secrets or HashiCorp Vault for credential management.
