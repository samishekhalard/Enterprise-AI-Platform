# ADR-010: Graph-per-Tenant Routing Architecture

**Status:** Proposed
**Date:** 2026-02-25
**Decision Makers:** Solution Architect, Architecture Team
**Category:** Tactical ADR (Data Access and Routing)
**Extends:** [ADR-003](./ADR-003-database-per-tenant.md)
**Related:** [ADR-001](./ADR-001-neo4j-primary.md), [ADR-009](./ADR-009-auth-facade-neo4j-architecture.md)

## Context and Problem Statement

ADR-001 establishes Neo4j as the single EMS application database. ADR-003 defines the multi-tenancy evolution path. Current runtime uses tenant-scoped query isolation on shared graph data.

For future enterprise/compliance scenarios, we may need graph-per-tenant routing with Neo4j multi-database capabilities.

This ADR defines the tactical routing approach for that future state.

## Decision Drivers

1. Stronger tenant isolation options for regulatory/compliance use cases.
2. Predictable performance isolation between tenant workloads.
3. Controlled evolution path from shared-graph isolation to per-tenant graph routing.
4. Low overhead routing and clear developer ergonomics.
5. Explicit observability of routing behavior.

## Decision (Proposed)

If graph-per-tenant mode is activated, implement **session-level database routing** with tenant context propagation.

### Routing Strategy

- Resolve tenant routing metadata at request ingress.
- Propagate tenant context through service execution.
- Create Neo4j sessions bound to tenant database at session config level.
- Keep explicit system-graph access methods for master/shared metadata.

### High-Level Components

| Component | Responsibility |
| ----------- | ---------------- |
| `TenantContextFilter` | Resolve and set tenant context |
| `TenantRoutingResolver` | Map tenant to routing/database metadata |
| `TenantContext` | Immutable request-scoped routing context |
| `TenantAwareSessionFactory` | Create tenant-bound Neo4j sessions |
| Routing cache | Cache tenant routing metadata with controlled TTL |

### Operational Modes

| Mode | Description | Default |
| ------ | ------------- | --------- |
| Shared graph mode | Tenant isolation by query/context guards in a shared graph | Active |
| Graph-per-tenant mode | Tenant requests routed to tenant-specific Neo4j databases | Proposed |

## Consequences

### Positive

- Clear tactical blueprint for future isolation upgrades.
- Minimal per-request routing overhead with session-level selection.
- Stronger tenant-level operational isolation when required.

### Negative

- More complex lifecycle management for tenant database provisioning.
- Additional observability and operational controls required.
- Potential migration complexity from shared mode to per-tenant mode.

## Trigger Conditions for Implementation

Graph-per-tenant mode should be scheduled only when one or more conditions are met:

1. Regulatory requirement mandates physical tenant data separation.
2. Material performance isolation issues in shared mode.
3. Contractual requirement for tenant-level restore/mobility control.

## Implementation Guardrails

- No silent fallback across tenant/system databases.
- Mandatory routing context checks for data operations.
- Routing audit logs must include tenant and database identifiers.
- Migration plan must include rollback path and verification checks.

## References

- [ADR-003](./ADR-003-database-per-tenant.md)
- [ADR-001](./ADR-001-neo4j-primary.md)
- [Neo4j Multi-Database Documentation](https://neo4j.com/docs/operations-manual/current/database-administration/)
