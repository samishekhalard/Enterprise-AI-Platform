# ADR-003: Multi-Tenancy Strategy for Neo4j Application Data

**Status:** Partially Implemented (Shared-Graph Isolation Active, Graph-per-Tenant Proposed)
**Date:** 2026-02-24
**Updated:** 2026-02-25
**Decision Makers:** Architecture Team
**Category:** Strategic ADR (Tenancy and Data Isolation)

## Context

EMS is a multi-tenant SaaS platform that requires strict tenant isolation while balancing operational simplicity and scalability.

With [ADR-001](./ADR-001-neo4j-primary.md), Neo4j is the single EMS application database. The tenancy strategy therefore needs to define:

1. How tenant isolation is enforced in the current runtime.
2. How the architecture can evolve to stronger physical isolation when required.
3. Which triggers justify moving from logical isolation to graph-per-tenant routing.

## Decision

Adopt a **phased Neo4j tenancy strategy**:

### Phase 1 (Current): Shared-Graph Tenant Isolation

Use shared Neo4j databases with strict tenant-scoped query and context enforcement.

- Tenant context is resolved per request.
- Repository/service access patterns enforce tenant predicates.
- Cross-tenant data access is prevented by design controls, tests, and reviews.

### Phase 2 (Proposed): Graph-per-Tenant Routing

When required by compliance/performance/contractual triggers, route tenant requests to tenant-specific Neo4j databases.

Implementation mechanics are defined in [ADR-010](./ADR-010-graph-per-tenant-routing.md).

## Current Implementation State

### What is Active

| Area | Current State |
| ------ | --------------- |
| Application data platform | Neo4j |
| Isolation approach | Tenant-scoped query/context enforcement |
| Tenancy guardrails | Context propagation + query review/testing |
| Identity provider internal persistence | PostgreSQL (Keycloak only, outside EMS domain data) |

### What is Not Yet Active

| Area | Status |
| ------ | -------- |
| Per-tenant Neo4j database routing | Proposed |
| Automated tenant database provisioning lifecycle | Proposed |
| Tenant-database-level backup/restore workflows | Proposed |

## Consequences

### Positive

- Clear and enforceable current-state isolation model.
- Lower operational complexity than immediate multi-database rollout.
- Compatible with incremental evolution to stronger isolation.

### Negative

- Shared-graph mode relies on robust guardrails and discipline.
- Per-tenant physical isolation benefits are deferred.
- Migration to graph-per-tenant requires careful operational planning.

## Trigger Conditions for Phase 2

Move toward graph-per-tenant mode when one or more conditions are true:

1. Regulatory requirement mandates physical tenant separation.
2. Tenant-level performance isolation becomes materially necessary.
3. Contractual obligations require tenant-specific restore/mobility boundaries.

## Implementation Notes

- This ADR defines the strategic tenancy model.
- Tactical routing/session mechanics belong to [ADR-010](./ADR-010-graph-per-tenant-routing.md).
- Identity-domain graph architecture details remain in [ADR-009](./ADR-009-auth-facade-neo4j-architecture.md).

## Related Documents

- [ADR-001](./ADR-001-neo4j-primary.md) - Neo4j application data standard.
- [ADR-009](./ADR-009-auth-facade-neo4j-architecture.md) - Identity graph architecture.
- [ADR-010](./ADR-010-graph-per-tenant-routing.md) - Proposed routing architecture.
- [Graph-per-Tenant LLD](../lld/graph-per-tenant-lld.md) - Detailed implementation design.
- [Graph-per-Tenant Requirements](../requirements/GRAPH-PER-TENANT-REQUIREMENTS.md).

## Review Checklist

### Shared-Graph Isolation (Current)

- [x] Tenant context propagation pattern defined.
- [x] Tenant-scoped data access pattern defined.
- [ ] Tenant-isolation regression suite fully hardened.
- [ ] Isolation observability/alerting maturity validated.

### Graph-per-Tenant Routing (Future)

- [ ] Trigger conditions formally met and approved.
- [ ] ADR-010 implementation plan approved.
- [ ] Provisioning, migration, rollback, and backup procedures validated.
- [ ] Operational readiness sign-off completed.
