# Architecture Principles

## Principle Register

| ID | Principle | Rationale | Implication |
|----|-----------|-----------|-------------|
| AP-01 | Single EMS application data platform | Consistent data model and reduced operational split | All EMS services use Neo4j for domain data |
| AP-02 | Explicit identity boundary | Identity internals remain isolated from domain data | PostgreSQL is Keycloak-internal only |
| AP-03 | Secure-by-default multi-tenancy | Prevent cross-tenant leakage by design | Tenant context required in access flows and queries |
| AP-04 | Provider-agnostic auth integration | Reduce lock-in and keep integration flexibility | Identity provider abstraction maintained in auth-facade |
| AP-05 | Observable by design | Faster troubleshooting and better SLO governance | Structured logs, metrics, traces are mandatory |
| AP-06 | ADR-backed architecture change | Preserve decision traceability | Material changes require ADR updates |

## Principle Compliance Notes

| Principle | Compliance Check | Evidence |
|-----------|------------------|----------|
| AP-01 | Service data-store mapping review | arc42 section 5 + code config |
| AP-02 | Keycloak persistence boundary validation | deployment/data architecture docs |
| AP-03 | Tenant isolation tests and query review | integration tests + review logs |
| AP-04 | Provider strategy contract unchanged | auth-facade design/code |
| AP-05 | Observability controls present | dashboards + alert definitions |
| AP-06 | ADR + arc42 synchronized | PR evidence |
