# 9. Architecture Decisions

This section is the decision index for architecture governance. Full rationale belongs to ADR files.

## 9.1 ADR Summary

| ADR | Decision | ADR Status | Implementation Status |
|-----|----------|------------|-----------------------|
| [ADR-001](../adr/ADR-001-neo4j-primary.md) | Neo4j as primary application database | Amended | Implemented as EMS application data standard |
| [ADR-002](../adr/ADR-002-spring-boot-3.4.md) | Spring Boot 3.4.1 baseline | Accepted | Implemented |
| [ADR-003](../adr/ADR-003-database-per-tenant.md) | Tenant isolation strategy and routing evolution | Partially Implemented | Tenant-scoped query model active |
| [ADR-004](../adr/ADR-004-keycloak-authentication.md) | Keycloak with BFF pattern | Accepted (Partially Superseded) | Implemented (default provider) |
| [ADR-005](../adr/ADR-005-valkey-caching.md) | Valkey distributed caching | Accepted | Implemented |
| [ADR-006](../adr/ADR-006-platform-services-consolidation.md) | Consolidate license-service into tenant-service | Proposed (Not Implemented) | Deferred |
| [ADR-007](../adr/ADR-007-auth-facade-provider-agnostic.md) | Provider-agnostic auth facade | In Progress (25%) | Abstraction implemented; Keycloak default |
| [ADR-008](../adr/ADR-008-idp-management-consolidation.md) | Frontend IdP management consolidation | Proposed | Not implemented |
| [ADR-009](../adr/ADR-009-auth-facade-neo4j-architecture.md) | Neo4j-backed auth provider/config graph | Accepted | Implemented in core scope |
| [ADR-010](../adr/ADR-010-graph-per-tenant-routing.md) | Graph-per-tenant routing architecture | Proposed | Design only |
| [ADR-011](../adr/ADR-011-multi-provider-authentication.md) | Multi-provider rollout plan | Proposed | Design/checklist only |
| [ADR-014](../adr/ADR-014-rbac-licensing-integration.md) | RBAC and licensing integration model | Proposed | Partially implemented |
| [ADR-015](../adr/ADR-015-on-premise-license-architecture.md) | On-premise cryptographic license architecture | Draft | Design only |
| [ADR-016](../adr/ADR-016-polyglot-persistence.md) | Polyglot persistence (Neo4j + PostgreSQL) evidence companion | Accepted | Implemented baseline |
| [ADR-017](../adr/ADR-017-data-classification-access-control.md) | Data classification access control (`OPEN`/`INTERNAL`/`CONFIDENTIAL`/`RESTRICTED`) | Proposed | Design only |
| [ADR-018](../adr/ADR-018-high-availability-multi-tier.md) | High availability and multi-tier architecture (phased: backups, K8s HA, multi-region DR) | Proposed | Design only |
| [ADR-019](../adr/ADR-019-encryption-at-rest.md) | Encryption at rest strategy (three-tier: volume, in-transit TLS, Jasypt config encryption) | Proposed | Not implemented (0%) |
| [ADR-020](../adr/ADR-020-service-credential-management.md) | Service credential management (per-service PostgreSQL users, SCRAM-SHA-256, credential externalization) | Proposed | Not implemented (0%) |
| [ADR-021](../adr/ADR-021-licensed-software-requirements.md) | On-Premise Licensed Software Requirements (BYOD model, Neo4j Enterprise for production, configuration templates) | Proposed | Not implemented (0%) |
| [ADR-022](../adr/ADR-022-production-parity-security-baseline.md) | Production-parity security baseline for COTS deployments (no dev/prod security divergence) | Accepted | Governance gate implemented, remediation in progress |

## 9.2 Active Architecture Baseline

- Polyglot persistence baseline: Neo4j for auth-facade RBAC/identity graph, PostgreSQL for relational domain services and Keycloak internals.
- Authentication is provider-agnostic with Keycloak as default provider.
- Sealed active runtime service set (2026-03-01): `api-gateway`, `auth-facade`, `tenant-service`, `user-service`, `license-service`, `notification-service`, `audit-service`, `ai-service`.
- `product-service`, `process-service`, and `persona-service` remain non-runtime build modules (not gateway-routed, not deployed).
- `license-service` remains independent in current runtime scope.
- Tenant provisioning orchestration (realm/bootstrap/domain/TLS activation) is a documented target state, pending implementation.
- Non-master tenant activation includes a mandatory valid-license gate before status can transition to `ACTIVE`.
- Classification-aware authorization is defined as target-state policy with backend-authoritative enforcement; implementation is pending.
- Production-parity security baseline is mandatory for COTS delivery; net-new insecure transport entries are blocked by CI governance.

Canonical constraints: [02-constraints.md](./02-constraints.md).

## 9.3 Proposed/Deferred Decision Areas

| Topic | Current Position | Tracking |
|-------|------------------|----------|
| Graph-per-tenant runtime cutover | Deferred until explicit operational trigger | ADR-003, ADR-010 |
| Additional auth providers rollout | Planned on top of provider abstraction | ADR-011 |
| IdP management UX consolidation | Planned | ADR-008 |
| Tenant + license service consolidation | Planned | ADR-006 |
| Tenant provisioning orchestration and activation gating | Planned control-plane workflow (async, checkpointed, retryable) | arc42 §4.6, §5.6, §6.7, §7.7, §8.11 |
| Classification-aware access rollout | Planned policy/enforcement rollout with masking and denial semantics | ADR-017, arc42 §8.3, §10.6 |
| High availability and data durability | Phased: backup automation (Phase 1), Kubernetes HA (Phase 2), multi-region DR (Phase 3) | ADR-018, arc42 §7.8 |
| Encryption at rest for all data stores | Three-tier strategy: volume-level encryption (LUKS/FileVault for Docker, encrypted StorageClass for K8s), in-transit TLS for all connections, Jasypt config encryption for all services | ADR-019, arc42 §4.7, §5.7 |
| Service credential management and isolation | Per-service PostgreSQL users with SCRAM-SHA-256, credential externalization to .env/K8s Secrets, fail-fast on missing credentials, append-only audit-service access | ADR-020, arc42 §4.8, §5.7 |
| Licensed software requirements for on-premise deployments | BYOD model: customers provide database servers/licenses; EMSIST provides config templates, migrations, connection strings; Neo4j Enterprise required for production (encryption, clustering, RBAC) | ADR-021, arc42 §4, §5, §7 |
| Production-parity security governance | No environment-level security downgrades; CI blocks net-new insecure transport configurations and tracks debt burn-down | ADR-022, arc42 §8, §10, §11 |

## 9.4 ADR Process Rules

- Create an ADR for changes that are costly to reverse.
- Keep ADR status and implementation status separate.
- When architecture changes, update both ADR and impacted arc42 sections.
- Keep ADR numbering unique and monotonic.

---

**Previous Section:** [Crosscutting Concepts](./08-crosscutting.md)
**Next Section:** [Quality Requirements](./10-quality-requirements.md)
