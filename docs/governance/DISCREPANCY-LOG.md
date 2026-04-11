# Documentation Discrepancy Log

> This log tracks discrepancies between documentation and codebase.
> Updated automatically during hourly audits and manually when issues are discovered.
> Baseline reference: Polyglot persistence per [ADR-016](../adr/ADR-016-polyglot-persistence.md) — Neo4j for auth-facade RBAC/identity graph; PostgreSQL for 7 relational domain services + Keycloak.

## Active Discrepancies

| Date | Document | Discrepancy | Severity | Assigned To | Resolution |
|------|----------|-------------|----------|-------------|------------|
| 2026-02-26 | arc42/06, §6.4 | Feature gate API exists in license-service but no other service calls it (no consumers) | MEDIUM | sa | PENDING |
| 2026-02-26 | arc42/06, §6.1 | Seat validation skipped for master tenant (undocumented) | LOW | doc | PENDING |
| 2026-02-26 | arc42/06, §6.1 | Circuit breaker on license-service call (undocumented) | LOW | doc | PENDING |
| 2026-02-26 | arc42/06 | MFA challenge/verify flow not documented at all | MEDIUM | doc + sa | PENDING |
| 2026-02-27 | CLAUDE.md (DoD) | License-management feature marked done with zero tests written or executed | HIGH | qa | PENDING — Tests still need to be written and executed |

## Severity Definitions

| Level | Definition | SLA |
|-------|------------|-----|
| **HIGH** | Core architecture claim is false | Fix within 24 hours |
| **MEDIUM** | Feature/component claim is inaccurate | Fix within 1 week |
| **LOW** | Minor detail mismatch | Fix when convenient |

## Resolved Discrepancies

| Date Found | Date Resolved | Document | Discrepancy | Resolution |
|------------|---------------|----------|-------------|------------|
| 2026-02-26 | 2026-03-01 | arc42/06, §6.1 | Diagram shows `AF→US: Create/update session` but no user-service client exists in auth-facade | Corrected in arc42/06 — ADR-016 polyglot persistence alignment (line removed) |
| 2026-02-26 | 2026-03-01 | arc42/06, §6.3 | Diagram claims all services query Neo4j with Cypher; reality: 7/8 services use PostgreSQL with JPA | Corrected in arc42/06 — ADR-016 polyglot persistence alignment (split into two diagrams: Neo4j for auth-facade, PostgreSQL/JPA for domain services) |
| 2026-02-26 | 2026-03-01 | arc42/06, §6.3 | Product query example uses product-service which has no source code (stub only) | Corrected in arc42/06 — ADR-016 polyglot persistence alignment (marked as [PLANNED] stub) |
| 2026-02-26 | 2026-03-01 | arc42/06, §6.5 | Diagram claims source services publish audit events to Kafka; no KafkaTemplate exists in any service | Corrected in arc42/06 — ADR-016 polyglot persistence alignment (replaced with REST + [IN-PROGRESS] Kafka) |
| 2026-02-26 | 2026-03-01 | arc42/06, §6.5 | Diagram claims audit-service persists to Neo4j; reality: uses PostgreSQL (JPA @Entity + Flyway) | Corrected in arc42/06 — ADR-016 polyglot persistence alignment (corrected to PostgreSQL/JPA) |
| 2026-02-26 | 2026-03-01 | arc42/06, §6.6 | Diagram claims Caffeine L1 + Valkey L2 two-tier cache; Caffeine does not exist anywhere; single-tier Valkey only | Corrected in arc42/06 — ADR-016 polyglot persistence alignment (replaced with single-tier Valkey) |
| 2026-02-27 | 2026-03-01 | CLAUDE.md (Agent Routing) | License-management feature implemented without spawning BA/SA/DEV/QA agents — full SDLC chain bypassed | RESOLVED — Rule 9 (Mandatory Agent Chain) added to CLAUDE.md |
| 2026-02-27 | 2026-03-01 | ON-PREMISE-LICENSING-REQUIREMENTS.md | Seat management was a documented requirement but plan deferred it; BA agent would have caught this | RESOLVED — Rule 9 requires BA plan validation |
| 2026-02-25 | 2026-02-25 | ADR-001 | Database baseline ambiguity | ADR aligned to Neo4j-only EMS app data + Keycloak-only PostgreSQL |
| 2026-02-25 | 2026-02-25 | ADR-003 | Claims graph-per-tenant | ADR updated with "Partially Implemented (25%)" |
| 2026-02-25 | 2026-02-25 | ADR-005 | Cache runtime wording mismatch | ADR updated to standardize on Valkey 8 runtime |
| 2026-02-25 | 2026-02-25 | ADR-006 | Claims merged | ADR clearly states "Proposed (Not Implemented)" |
| 2026-02-25 | 2026-02-25 | ADR-007 | Claims multi-provider | ADR states "In Progress (25%)" |
| 2026-02-25 | 2026-02-25 | arc42/03 | "has been merged" claim | Updated to "proposed to be merged (not yet implemented)" |
| 2026-02-25 | 2026-02-25 | arc42/04 | "has been merged" claim | Updated to "proposed to be merged (not yet implemented)" |
| 2026-02-25 | 2026-02-25 | docker-compose | eureka-server missing | Already commented out with TODO note |
| 2026-02-25 | 2026-02-25 | docker-compose | Missing 6 microservices | Added all 6 services (DEVOPS agent) |
| 2026-02-25 | 2026-02-25 | PostgreSQL entities | Missing @Version | Added to 6 entities (DEV agent) |
| 2026-02-25 | 2026-02-25 | audit-service | Missing correlation index | Created V2 migration (DBA agent) |
| 2026-02-25 | 2026-02-25 | CANONICAL-DATA-MODEL | Cache inconsistency | Standardized on Valkey strategy (DBA agent) |

## Audit History

| Date | Time | Agents | Discrepancies Found | New | Resolved |
|------|------|--------|---------------------|-----|----------|
| 2026-02-25 | Initial | arch, sa, doc | 7 | 7 | 0 |
| 2026-02-25 | Hourly-1 | arch, sa, doc | 12 | 7 | 5 (ADRs fixed) |
| 2026-02-26 | Arc42-06 Audit | arch, sa | 10 | 10 | 0 |
| 2026-03-01 | ADR-016 Wave 2 | doc | 0 | 0 | 8 (6 arc42/06 HIGH + 2 governance) |

## Resolution Process

1. **Identify** - Agent discovers discrepancy during audit
2. **Log** - Add to Active Discrepancies table
3. **Triage** - Assign severity and owner
4. **Decide** - Update docs OR update code (never leave in conflict)
5. **Resolve** - Move to Resolved table with resolution notes
6. **Verify** - Next audit confirms resolution

## Metrics

- **Total Active:** 5
- **High Severity:** 1
- **Medium Severity:** 2
- **Low Severity:** 2
- **Resolved Total:** 20
- **Resolution Rate:** 80% (20/25 total found)
