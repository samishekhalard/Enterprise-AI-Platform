# ISSUE-INF-007: No Independent Data Tier Lifecycle

| Field | Value |
|-------|-------|
| Severity | HIGH |
| Category | Architecture |
| Source | ARCH A2 |
| Priority | P1 |
| Status | **RESOLVED** |
| Opened | 2026-03-02 |
| Resolved | 2026-03-04 |
| Blocked By | — |
| Fixes | docker-compose.dev-data.yml, docker-compose.dev-app.yml, docker-compose.staging-data.yml, docker-compose.staging-app.yml |
| Closes With | ADR-018 Phase 1 — Docker Tier Split |

## Description

Data services (PostgreSQL, Neo4j, Valkey, Kafka) and application services share the same Docker Compose file. This means:
- Cannot upgrade databases without stopping application services
- Cannot scale data tier independently
- `depends_on` chains create tight coupling
- Data tier cannot be started/stopped independently for maintenance

## Evidence

- Single docker-compose.{env}.yml contains both tiers
- `depends_on` chains: auth-facade → keycloak-init → keycloak → postgres
- No way to run `docker compose up` for just data services

## Remediation

Split into `docker-compose.{env}-data.yml` and `docker-compose.{env}-app.yml`. Shared external network connects them. Two-phase startup scripts ensure data tier is healthy before app tier starts.

## Resolution (2026-03-04)

Split implemented across four files. `docker-compose.dev-data.yml` owns all networks and persistent volumes — `docker-compose.dev-app.yml down` cannot remove them. `scripts/dev-up.sh` performs two-phase startup (data tier healthy → app tier starts).

`Makefile` provides `make data-up`, `make data-down`, `make app-up`, `make app-down` targets for safe independent lifecycle management.

## Acceptance Criteria

- [x] `docker compose -f docker-compose.dev-data.yml up -d` starts only data services
- [x] `docker compose -f docker-compose.dev-app.yml up -d` starts only app services
- [x] Data tier upgrade does not require app tier downtime (except for schema migrations)
