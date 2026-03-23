# Architecture Decision Records (ADRs)

This directory contains Architecture Decision Records (ADRs) documenting significant architectural decisions made in the EMS project.

## What is an ADR?

An Architecture Decision Record captures an important architectural decision made along with its context and consequences. ADRs help:

- Document the "why" behind decisions
- Provide context for future developers
- Track the evolution of the architecture
- Enable informed decision-making

## ADR Index

| ADR | Title | Status | Date |
|-----|-------|--------|------|
| [ADR-001](./ADR-001-neo4j-primary.md) | Neo4j as Primary EMS Application Database | Superseded by ADR-016 | 2026-02-24 |
| [ADR-002](./ADR-002-spring-boot-3.4.md) | Spring Boot 3.4.1 with Java 23 | Accepted | 2026-02-24 |
| [ADR-003](./ADR-003-database-per-tenant.md) | Multi-Tenancy Strategy | Partially Implemented | 2026-02-24 |
| [ADR-004](./ADR-004-keycloak-authentication.md) | Keycloak with BFF Pattern | Accepted (Partially Superseded) | 2026-02-24 |
| [ADR-005](./ADR-005-valkey-caching.md) | Valkey Distributed Caching | Accepted | 2026-02-24 |
| [ADR-006](./ADR-006-platform-services-consolidation.md) | Platform Services Consolidation | Proposed | 2026-02-24 |
| [ADR-007](./ADR-007-auth-facade-provider-agnostic.md) | Provider-Agnostic Auth Facade | In Progress | 2026-02-24 |
| [ADR-008](./ADR-008-idp-management-consolidation.md) | Identity Provider Management UI Consolidation | Proposed | 2026-02-25 |
| [ADR-009](./ADR-009-auth-facade-neo4j-architecture.md) | Auth Facade Dynamic Identity Broker with Neo4j Graph | Accepted | 2026-02-25 |
| [ADR-010](./ADR-010-graph-per-tenant-routing.md) | Graph-per-Tenant Routing Architecture | Proposed | 2026-02-25 |
| [ADR-011](./ADR-011-multi-provider-authentication.md) | Multi-Provider Authentication Implementation | Proposed | 2026-02-25 |
| [ADR-012](./ADR-012-primeng-migration.md) | PrimeNG Migration (Bootstrap/ng-bootstrap Replacement) | Proposed | 2026-02-26 |
| [ADR-013](./ADR-013-mobile-platform-strategy.md) | Mobile Platform Strategy (PWA, Capacitor, Flutter) | Proposed | 2026-02-26 |
| [ADR-014](./ADR-014-rbac-licensing-integration.md) | RBAC and Licensing Integration Architecture | Proposed | 2026-02-26 |
| [ADR-015](./ADR-015-on-premise-license-architecture.md) | On-Premise Cryptographic License Architecture | Draft | 2026-02-26 |
| [ADR-016](./ADR-016-polyglot-persistence.md) | Polyglot Persistence -- Neo4j for Identity Graph, PostgreSQL for Domain Services | Accepted | 2026-02-27 |
| [ADR-017](./ADR-017-data-classification-access-control.md) | Data Classification Access Control | Proposed | 2026-02-27 |
| [ADR-018](./ADR-018-high-availability-multi-tier.md) | High Availability and Multi-Tier Architecture | Proposed | 2026-03-02 |
| [ADR-019](./ADR-019-encryption-at-rest.md) | Encryption at Rest Strategy | Proposed | 2026-03-02 |
| [ADR-020](./ADR-020-service-credential-management.md) | Service Credential Management | Proposed | 2026-03-02 |
| [ADR-021](./ADR-021-licensed-software-requirements.md) | On-Premise Licensed Software Requirements (BYOD) | Proposed | 2026-03-03 |
| [ADR-022](./ADR-022-production-parity-security-baseline.md) | Production-Parity Security Baseline (COTS) | Accepted | 2026-03-04 |

## ADR Statuses

| Status | Description |
|--------|-------------|
| **Proposed** | Under discussion |
| **Accepted** | Approved and in effect |
| **Amended** | Accepted ADR updated to reflect changed/actual state |
| **In Progress** | Decision accepted/proposed, implementation partially complete |
| **Partially Implemented** | Strategy adopted in phases; only subset implemented |
| **Deprecated** | No longer valid, superseded |
| **Superseded** | Replaced by another ADR |
| **Partially Superseded** | Parts replaced by another ADR |

## ADR Template

When creating a new ADR, use the following template:

```markdown
# ADR-NNN: Title

**Status:** Proposed | Accepted | Deprecated | Superseded by [ADR-XXX]
**Date:** YYYY-MM-DD
**Decision Makers:** [names]

## Context

What is the issue that we're seeing that motivates this decision?

## Decision

What is the change that we're proposing and/or doing?

## Consequences

What becomes easier or more difficult to do because of this change?

### Positive
- ...

### Negative
- ...

### Neutral
- ...

## Alternatives Considered

What other options were considered and why were they rejected?

## References

- Links to relevant documentation, discussions, or research
```

## Creating a New ADR

1. Copy the template above
2. Create a new file: `ADR-NNN-short-title.md`
3. Fill in all sections
4. Add to the index table above
5. Get approval from architecture team
6. Update status to "Accepted"

## Related Documentation

- [Architecture Overview](../arc42/09-architecture-decisions.md)
- [Technical Constraints](../arc42/02-constraints.md)

---

**Format:** [MADR](https://adr.github.io/madr/) (Markdown Any Decision Records)
**Last Updated:** 2026-03-04
