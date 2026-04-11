# ISSUE-INF-008: Hardcoded Credential Defaults in application.yml

| Field | Value |
|-------|-------|
| Severity | HIGH |
| Category | Security |
| Source | SEC-06 |
| Priority | P1 |
| Status | OPEN |
| Opened | 2026-03-02 |
| Blocked By | — |
| Fixes | All 7 backend service application.yml files |
| Closes With | Phase 2 or Phase 3 |
| ADR | ADR-020 |

## Description

All backend `application.yml` files contain hardcoded fallback defaults for sensitive values. For example: `${DATABASE_USER:postgres}`, `${DATABASE_PASSWORD:changeme}`. If a deployment misconfiguration omits the environment variable, the service silently connects using the insecure default instead of failing fast.

## Evidence

- `backend/tenant-service/src/main/resources/application.yml`: `username: ${DATABASE_USER:postgres}`
- Same pattern in all 7 backend services
- `docker-compose.dev.yml`: `JASYPT_PASSWORD: dev_jasypt_secret_change_me` as default value
- Keycloak: `KC_DB_PASSWORD: ${KC_DB_PASSWORD:-keycloak}` — literal `keycloak` as default

## Remediation

Remove all `:default` fallback values for sensitive configuration:
- `${DATABASE_USER:postgres}` → `${DATABASE_USER}`
- `${DATABASE_PASSWORD:changeme}` → `${DATABASE_PASSWORD}`
- Application fails fast with clear error if env var is missing

This is a config cleanup (removing defaults from YAML), NOT a Java source code change.

## Acceptance Criteria

- [ ] No `application.yml` contains hardcoded passwords or usernames as fallback defaults
- [ ] Service fails to start with descriptive error if `DATABASE_USER` env var is missing
- [ ] All credentials sourced from `.env` file or K8s Secrets
