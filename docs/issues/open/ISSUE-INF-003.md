# ISSUE-INF-003: `docker compose down -v` Destroys All Data

| Field | Value |
|-------|-------|
| Severity | CRITICAL |
| Category | HA |
| Source | ARCH A1 |
| Priority | P0 |
| Status | RESOLVED |
| Opened | 2026-03-02 |
| Resolved | 2026-03-03 |
| Blocked By | -- |
| Fixes | docker-compose.dev.yml, docker-compose.staging.yml, scripts/dev-up.sh, scripts/staging-up.sh, scripts/safe-upgrade.sh |
| Closes With | Phase 2 -- Docker Tier Split |

## Description

Running `docker compose down -v` destroys ALL named volumes including PostgreSQL data, Neo4j graphs, and Valkey persistence. Since all services (data + app) live in a single compose file, there is no way to stop application services without risking data tier volumes. This was the **root cause of reported data loss during major upgrades**.

## Evidence

- Single docker-compose.{env}.yml contains both data services (postgres, neo4j, valkey) and application services
- Named volumes (`dev_postgres_data`, `dev_neo4j_data`, etc.) are defined in the same file
- `docker compose down -v` removes all volumes indiscriminately
- No lifecycle separation between data tier and app tier

## Remediation

1. Split compose into `docker-compose.{env}-data.yml` (data tier) and `docker-compose.{env}-app.yml` (app tier)
2. Data tier volumes are ONLY in data compose -- `docker compose -f app.yml down` cannot touch data volumes
3. Update startup scripts to two-phase: data tier first, app tier second
4. Update teardown to reverse order: app tier first, data tier second (never `-v` on data tier)
5. Keep backward-compatible wrapper via `include` directive

## Acceptance Criteria

- [x] `docker compose -f docker-compose.staging-app.yml down` does NOT remove data volumes
- [x] `docker compose -f docker-compose.staging-data.yml ps` shows data services still running after app tier stop
- [x] Data survives full app tier rebuild: stop app -> rebuild -> start app -> data preserved

## Resolution

**Resolved on 2026-03-03** by splitting Docker Compose files into data and app tiers.

### Files Created

| File | Purpose |
|------|---------|
| `docker-compose.dev-data.yml` | Dev data tier: postgres, neo4j, valkey, kafka + all data volumes + all 3 networks |
| `docker-compose.dev-app.yml` | Dev app tier: keycloak, backend services, frontend + `dev_frontend_node_modules` volume + networks as `external: true` |
| `docker-compose.staging-data.yml` | Staging data tier: same pattern with staging_ prefixes |
| `docker-compose.staging-app.yml` | Staging app tier: same pattern, no frontend node_modules volume (uses built nginx image) |

### Files Modified

| File | Change |
|------|--------|
| `docker-compose.dev.yml` | Replaced with `include:` wrapper combining data + app tiers |
| `docker-compose.staging.yml` | Replaced with `include:` wrapper combining data + app tiers |
| `scripts/dev-up.sh` | Two-phase startup (data tier first, wait for healthy, then app tier); safe `--down` stops app tier first; fixed `init-db.sql` -> `init-db.sh` reference |
| `scripts/staging-up.sh` | Two-phase startup; mandatory backup before `--build`; fixed `init-db.sql` -> `init-db.sh` reference |
| `scripts/safe-upgrade.sh` | Stops and rebuilds only app tier; data tier stays running throughout upgrade; uses tier-specific compose files |
| `runbooks/operations/RUNBOOK-011-DOCKER-VOLUME-MANAGEMENT.md` | Added Tier-Split Architecture section; updated all commands to use tier-specific files; fixed `init-db.sql` -> `init-db.sh` references; added troubleshooting for app-tier-cannot-connect-to-data-tier |

### Architecture

The network topology is owned by the data tier:
- Data tier defines all 3 networks (`ems-{env}-data`, `ems-{env}-backend`, `ems-{env}-frontend`)
- App tier references them as `external: true`
- `docker compose -f app.yml down` cannot remove networks that data services depend on

The `include:` directive (Docker Compose V2.20+, Docker 24+) provides backward compatibility:
- `docker compose -f docker-compose.{env}.yml up` still works exactly as before
- Existing CI/CD pipelines and documentation referencing the wrapper files continue to function
