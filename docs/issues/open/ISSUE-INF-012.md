# ISSUE-INF-012: ai-service Missing sslmode=verify-full

| Field | Value |
|-------|-------|
| Severity | HIGH |
| Category | Security |
| Source | SEC-08 |
| Priority | P1 |
| Status | OPEN |
| Opened | 2026-03-02 |
| Blocked By | — |
| Fixes | backend/ai-service/src/main/resources/application.yml |
| Closes With | Phase 2 or Phase 3 |
| ADR | ADR-019 |

## Description

6 of 7 backend services include `?sslmode=verify-full` in their PostgreSQL JDBC URLs to enforce TLS encryption in transit. The ai-service is the exception — it constructs the JDBC URL without the SSL parameter, relying on the PostgreSQL driver default (`prefer` or `disable`).

## Evidence

- `backend/ai-service/src/main/resources/application.yml`: JDBC URL without `?sslmode=verify-full`
- Other 6 services: JDBC URLs include `?sslmode=verify-full`
- PostgreSQL driver default is `prefer` (opportunistic) not `require` (mandatory)

## Remediation

Add `?sslmode=verify-full` to ai-service JDBC URL template.

## Acceptance Criteria

- [ ] ai-service application.yml includes `sslmode=verify-full` in JDBC URL
- [ ] All 7 services have consistent TLS enforcement for PostgreSQL connections
