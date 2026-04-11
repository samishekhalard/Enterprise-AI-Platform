# ISSUE-INF-014: Valkey Has No AUTH Password Configured

| Field | Value |
|-------|-------|
| Severity | HIGH |
| Category | Security |
| Source | SEC-10 |
| Priority | P1 |
| Status | OPEN |
| Opened | 2026-03-02 |
| Blocked By | — |
| Fixes | docker-compose.*.yml, .env.example, backend service application.yml |
| Closes With | Phase 2 — Docker Tier Split |

## Description

Valkey is running without authentication. Any container on the Docker network can connect and execute commands (GET, SET, DEL, FLUSHALL) without credentials. This means a compromised service can read session tokens from the blacklist cache, manipulate role caches, or flush all cached data.

## Evidence

- docker-compose.dev.yml: Valkey service has no `--requirepass` command
- docker-compose.staging.yml: same
- No `VALKEY_PASSWORD` environment variable defined in `.env` files
- `spring.data.redis.password` not set in any backend service

## Remediation

1. Add `command: valkey-server --requirepass ${VALKEY_PASSWORD}` to Valkey service
2. Add `VALKEY_PASSWORD` to `.env.example`, `.env.dev`, `.env.staging`
3. Add `spring.data.redis.password: ${VALKEY_PASSWORD}` to services that use Valkey (auth-facade, api-gateway, license-service)

## Acceptance Criteria

- [ ] `valkey-cli ping` without password returns `NOAUTH Authentication required`
- [ ] `valkey-cli -a $VALKEY_PASSWORD ping` returns `PONG`
- [ ] All services connect to Valkey using the password from `.env`
