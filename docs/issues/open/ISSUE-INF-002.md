# ISSUE-INF-002: Frontend Container Can Reach Databases Directly

| Field | Value |
|-------|-------|
| Severity | CRITICAL |
| Category | Security |
| Source | SEC-02 |
| Priority | P0 |
| Status | RESOLVED |
| Opened | 2026-03-02 |
| Blocked By | ISSUE-INF-001 |
| Fixes | docker-compose.dev.yml, docker-compose.staging.yml |
| Closes With | Phase 2 — Docker Tier Split |

## Description

The frontend (nginx) container shares the same Docker network as PostgreSQL, Neo4j, and Valkey. A compromised frontend container or an SSRF vulnerability in nginx could allow direct database access, bypassing all backend authentication and authorization.

## Evidence

- Frontend and postgres are both on `ems-dev` / `ems-staging` network
- `docker compose exec frontend ping postgres` succeeds (should fail)
- No network-level isolation between presentation and data tiers

## Remediation

Place frontend on a dedicated `ems-{env}-frontend` network with access only to api-gateway. The api-gateway bridges frontend-net and backend-net.

## Acceptance Criteria

- [ ] `docker compose exec frontend ping postgres` returns FAILURE
- [ ] `docker compose exec frontend ping neo4j` returns FAILURE
- [ ] `docker compose exec frontend ping valkey` returns FAILURE
- [ ] `docker compose exec frontend curl api-gateway:8080/actuator/health` returns SUCCESS

## Resolution

**Status:** RESOLVED
**Date:** 2026-03-03
**Changed Files:** `docker-compose.dev.yml`, `docker-compose.staging.yml`

### What Changed

The frontend container is now on a dedicated `ems-{env}-frontend` network. It can only communicate with the api-gateway, which is the sole service also attached to that network (along with `ems-{env}-backend` and `ems-{env}-data` for routing and rate-limiting).

PostgreSQL, Neo4j, Valkey, and Kafka are on `ems-{env}-data` (which is marked `internal: true`). Since the frontend is on `ems-{env}-frontend` and not on `ems-{env}-data`, it cannot reach any data store containers. A compromised frontend or SSRF in nginx can no longer access databases directly.

### Network Isolation Matrix

| Source | Can Reach postgres? | Can Reach api-gateway? |
|--------|--------------------|-----------------------|
| frontend | NO (different network) | YES (shared `ems-{env}-frontend`) |
| auth-facade | YES (shared `ems-{env}-data`) | YES (shared `ems-{env}-backend`) |
| api-gateway | YES (shared `ems-{env}-data` for valkey) | N/A |
