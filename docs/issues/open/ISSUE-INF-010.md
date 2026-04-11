# ISSUE-INF-010: No Per-Service Database Users in init-db.sql

| Field | Value |
|-------|-------|
| Severity | HIGH |
| Category | Data Isolation |
| Source | SA F1 |
| Priority | P1 |
| Status | RESOLVED |
| Opened | 2026-03-02 |
| Blocked By | — |
| Fixes | infrastructure/docker/init-db.sql, .env.example |
| Closes With | Phase 2 — Per-Service DB Users |
| ADR | ADR-020 |

## Description

`init-db.sql` creates 8 databases but only 1 dedicated user (`keycloak`). All other services use the `postgres` superuser. The script does not create per-service users or revoke public access to databases.

## Evidence

- `infrastructure/docker/init-db.sql` lines 14-28: Only `keycloak` user created
- No `CREATE USER svc_tenant`, `svc_user`, etc.
- No `REVOKE ALL ON DATABASE ... FROM PUBLIC` statements
- PostgreSQL default: `PUBLIC` can connect to any database

## Remediation

Add to `init-db.sql`:
1. Create 7 per-service users with `ENCRYPTED PASSWORD` (SCRAM-SHA-256)
2. Passwords sourced from environment variables (docker-entrypoint passes them)
3. `GRANT ALL PRIVILEGES ON DATABASE {db} TO {user}` for each service
4. `REVOKE ALL ON DATABASE {db} FROM PUBLIC` for all databases

## Acceptance Criteria

- [ ] 7 per-service users exist in PostgreSQL after init
- [ ] Each user can ONLY access its own database
- [ ] `PUBLIC` role has no access to any application database

## Resolution

**Date:** 2026-03-03
**Resolved By:** DBA Agent (Phase 2 -- Per-Service DB Users)
**ADR:** ADR-020

### Changes Made

The original `init-db.sql` has been replaced by `infrastructure/docker/init-db.sh`, a shell script that:

1. **Creates 8 per-service users** (including `kc_db_user` for Keycloak, replacing the old `keycloak` user) with passwords sourced from environment variables. Passwords are SCRAM-SHA-256 encrypted.

2. **Grants minimal permissions per user:**
   - `CONNECT ON DATABASE` -- user can only connect to its own database
   - `USAGE, CREATE ON SCHEMA public` -- user can use and create tables in the public schema
   - `SELECT, INSERT, UPDATE, DELETE ON TABLES` (or `SELECT, INSERT` only for audit-service)
   - `USAGE, SELECT ON SEQUENCES` -- for auto-increment and serial columns
   - `ALTER DEFAULT PRIVILEGES` -- future tables created by superuser are also accessible

3. **Revokes PUBLIC access** on all 8 databases (`REVOKE ALL ON DATABASE ... FROM PUBLIC`).

4. **Adds `process_db`** -- was missing from the original `init-db.sql` but required by process-service.

5. **Preserves all existing schema and seed data** from the original `init-db.sql` (tenants, domains, auth providers, branding, licenses, audit logs tables and master tenant seed data).

### Files Created/Modified

| File | Action |
|------|--------|
| `infrastructure/docker/init-db.sh` | NEW -- replaces init-db.sql |
| `infrastructure/docker/.env.dev.template` | NEW -- env var template for dev |
| `infrastructure/docker/.env.staging.template` | NEW -- env var template for staging |
| `docker-compose.dev.yml` | MODIFIED -- per-service credentials |
| `docker-compose.staging.yml` | MODIFIED -- per-service credentials |
| `.gitignore` | MODIFIED -- added infrastructure/docker/.env.* patterns |

### Note

The original `infrastructure/docker/init-db.sql` is retained for reference but is no longer mounted by either docker-compose file. Both compose files now mount `init-db.sh` instead.
