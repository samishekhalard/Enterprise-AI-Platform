# Platform Operations and Customer Delivery

**Feature:** Production packaging, customer delivery, environment provisioning, runtime prerequisites, and data durability
**Owner:** Architecture / DevOps / Security
**Status:** [IN-PROGRESS]
**Date:** 2026-03-13

---

## Scope

This requirement domain captures the cross-cutting platform rules needed to ship EMSIST as a COTS product without exposing source code, losing customer data, or breaking authentication during upgrades.

It exists outside the screen and feature inventories because the concerns here are operational and architectural:

- production packaging and release contract
- customer environment provisioning and bootstrap
- authentication and runtime prerequisites
- data durability, backup, restore, and upgrade safety
- runtime-agnostic delivery behavior across Docker, Kubernetes, and local/native deployment

## Documentation Index

| # | Document | Status | Description |
|---|----------|--------|-------------|
| 01 | [Cross-Cutting Platform Requirements](./Design/01-Cross-Cutting-Platform-Requirements.md) | Draft | Requirement catalog, P0 rules, scope boundary, and repo baseline |
| 02 | [Acceptance Criteria and Release Gates](./Design/02-Acceptance-Criteria-and-Release-Gates.md) | Draft | Testable criteria, evidence model, and release approval gates |

## Canonical References

| Artifact | Purpose |
|----------|---------|
| [CUSTOMER-INSTALL-RUNBOOK.md](../../dev/CUSTOMER-INSTALL-RUNBOOK.md) | Operational baseline and current repo-state runbook |
| [07-deployment-view.md](../../Architecture/07-deployment-view.md) | Deployment topology, runbook boundary, startup gating |
| [08-crosscutting.md](../../Architecture/08-crosscutting.md) | Cross-cutting platform rules |
| [10-quality-requirements.md](../../Architecture/10-quality-requirements.md) | Reliability and operability scenarios |
| [07-migration-planning.md](../../togaf/07-migration-planning.md) | Phased delivery roadmap |
| [10-requirements-management.md](../../togaf/10-requirements-management.md) | Requirement governance and traceability |
| [Architecture section 9.4.4](../../Architecture/09-architecture-decisions.md#944-runtime-agnostic-cots-deployment-contract-adr-032) | Deployment contract derived from these requirements |
| [2026-03-13-r07-platform-operations-customer-delivery.md](../../../docs/superpowers/plans/2026-03-13-r07-platform-operations-customer-delivery.md) | Implementation plan |

## Outcome

The expected end state is simple:

- customer production receives versioned runtime artifacts and governed deployment artifacts, not source code or source trees
- customers can choose Docker, Kubernetes, or local/native deployment without changing the lifecycle contract
- deployment tooling preserves four logical roles: `postgres`, `neo4j`, `keycloak`, `services`
- app-tier rebuilds and upgrades never destroy Postgres, Neo4j, Valkey, or Keycloak state
- provisioning is explicit about `preflight`, `first_install`, `upgrade`, and `restore`
- release approval requires tested backup/restore and login continuity, not health checks alone
