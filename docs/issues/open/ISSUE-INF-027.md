# ISSUE-INF-027: Flyway `repair-on-mismatch` Enabled

| Field | Value |
|-------|-------|
| Severity | MEDIUM |
| Category | Data Isolation |
| Source | SA-AUDIT-2026-002 |
| Priority | P2 |
| Status | OPEN |
| Opened | 2026-03-02 |
| Blocked By | — |
| Fixes | Backend service application.yml files |
| Closes With | Disable repair-on-mismatch, add migration validation |

## Description

Some backend services have Flyway configured with `repair-on-mismatch: true`, which silently repairs migration checksum mismatches instead of failing. This means if a migration file is accidentally modified after being applied, Flyway will accept the change without alerting anyone — potentially masking schema drift between environments.

## Evidence

- Multiple `application.yml` files contain: `spring.flyway.repair-on-mismatch: true`
- This setting was likely added to work around development migration edits
- In production, this could mask unauthorized schema modifications

## Remediation

1. Set `spring.flyway.repair-on-mismatch: false` in all environments
2. Add explicit `flyway repair` step to migration runbooks for intentional repairs
3. Add checksum validation to CI/CD pipeline
4. Document migration modification policy

## Acceptance Criteria

- [ ] `repair-on-mismatch` is `false` in all services
- [ ] Migration checksum mismatches cause startup failure
- [ ] Intentional repairs use explicit `flyway repair` command
- [ ] CI/CD validates migration checksums
