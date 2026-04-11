# Requirement to ADR Matrix

This matrix traces all 22 architecture-significant requirements from [TOGAF 10 - Requirements Management](../../10-requirements-management.md) to their governing ADRs, related arc42 sections, originating TOGAF ADM phase, and current status.

## Security Requirements (12)

| Req ID | Requirement Summary | Priority | Related ADR(s) | Related Arc42 Section(s) | TOGAF Phase | Status |
|--------|---------------------|----------|----------------|--------------------------|-------------|--------|
| RQ-SEC-001 | 100% tenant data isolation -- every data-access path must be scoped to authenticated tenant | Critical | ADR-003 (Graph-per-Tenant), ADR-010 (Tenant Isolation) | 06 (Runtime View), 08 (Crosscutting) | Phase B (Business) + Phase C (Data) | Active |
| RQ-SEC-002 | Account protection policy enforced on invalid credential attempts | Critical | ADR-004 (Keycloak) | 08 (Crosscutting) | Phase C (Application) | Active |
| RQ-SEC-003 | 401 response for expired access tokens | Critical | ADR-004 (Keycloak), ADR-007 (Provider-Agnostic Auth) | 08 (Crosscutting) | Phase C (Application) | Active |
| RQ-SEC-004 | 100% Cypher injection attempts blocked | Critical | ADR-001 (Neo4j), ADR-009 (Input Validation) | 08 (Crosscutting) | Phase C (Application) | Active |
| RQ-SEC-005 | 100% XSS attack payloads sanitized or escaped | Critical | -- | 08 (Crosscutting) | Phase C (Application) | Active |
| RQ-SEC-006 | Complete authorization context (roles, responsibilities, features, policyVersion) returned on login/refresh | High | ADR-014 (RBAC + Licensing), ADR-017 (Data Classification) | 08 (Crosscutting), 10 (Quality) | Phase C (Application) | Active |
| RQ-SEC-007 | 100% backend enforcement (403) on frontend/UI bypass attempts | Critical | ADR-014 (RBAC + Licensing) | 08 (Crosscutting), 10 (Quality) | Phase C (Application) | Active |
| RQ-SEC-008 | Default deny enforced for missing policy mappings | Critical | ADR-014 (RBAC + Licensing) | 08 (Crosscutting), 10 (Quality) | Phase C (Application) | Active |
| RQ-SEC-009 | Volume-level encryption at rest for all data stores (LUKS/FileVault for Docker, encrypted StorageClass for K8s) | High | ADR-019 (Encryption at Rest) | 04 (Solution Strategy), 05 (Building Blocks) | Phase D (Technology) | Active |
| RQ-SEC-010 | TLS in-transit for all service-to-datastore connections | High | ADR-019 (Encryption at Rest) | 04 (Solution Strategy), 05 (Building Blocks) | Phase D (Technology) | Active |
| RQ-SEC-011 | Per-service database credentials with least privilege (SCRAM-SHA-256, credential externalization) | High | ADR-020 (Service Credential Management) | 04 (Solution Strategy), 05 (Building Blocks) | Phase D (Technology) | Active |
| RQ-SEC-012 | Production-parity security baseline -- zero net-new insecure transport entries vs approved allowlist | High | ADR-022 (Production-Parity Security) | 08 (Crosscutting), 10 (Quality), 11 (Risks) | Phase D (Technology) + Phase H (Change Mgmt) | Active |

## Performance Requirements (4)

| Req ID | Requirement Summary | Priority | Related ADR(s) | Related Arc42 Section(s) | TOGAF Phase | Status |
|--------|---------------------|----------|----------------|--------------------------|-------------|--------|
| RQ-PERF-001 | Core GET endpoint p95 latency < 100 ms under normal load | High | -- | 10 (Quality Requirements) | Phase C (Application) | Active |
| RQ-PERF-002 | Complex query endpoint p95 latency < 500 ms | High | -- | 10 (Quality Requirements) | Phase C (Application) | Active |
| RQ-PERF-003 | Cached read path response < 5 ms typical | Medium | ADR-005 (Valkey Cache) | 06 (Runtime View), 08 (Crosscutting), 10 (Quality) | Phase D (Technology) | Active |
| RQ-PERF-004 | Sustained throughput >= 1000 req/s on target profile | High | -- | 10 (Quality Requirements) | Phase D (Technology) | Active |

## Reliability Requirements (3)

| Req ID | Requirement Summary | Priority | Related ADR(s) | Related Arc42 Section(s) | TOGAF Phase | Status |
|--------|---------------------|----------|----------------|--------------------------|-------------|--------|
| RQ-REL-001 | >= 99.9% monthly uptime | Critical | ADR-018 (HA Multi-Tier) | 07 (Deployment View), 10 (Quality) | Phase D (Technology) + Phase E (Opportunities) | Active |
| RQ-REL-002 | Service restart recovery < 30 seconds | High | -- | 07 (Deployment View), 10 (Quality) | Phase D (Technology) | Active |
| RQ-REL-003 | Automated database backups with validated restore procedures (Phase 1 of HA strategy) | High | ADR-018 (HA Multi-Tier) | 07 (Deployment View) | Phase D (Technology) | Active |

## Infrastructure Requirements (3)

| Req ID | Requirement Summary | Priority | Related ADR(s) | Related Arc42 Section(s) | TOGAF Phase | Status |
|--------|---------------------|----------|----------------|--------------------------|-------------|--------|
| RQ-INF-001 | Three-network tier segmentation (public ingress, application tier, data tier) | High | ADR-018 (HA Multi-Tier) | 07 (Deployment View) | Phase D (Technology) | Active |
| RQ-INF-002 | Kubernetes HA deployment with operator-managed databases (Phase 2 of HA strategy) | Medium | ADR-018 (HA Multi-Tier) | 07 (Deployment View) | Phase E (Opportunities) + Phase F (Migration) | Active |
| RQ-INF-003 | Encrypted backup storage for all automated database backups | High | ADR-018 (HA Multi-Tier), ADR-019 (Encryption at Rest) | 07 (Deployment View) | Phase D (Technology) | Active |

## Traceability Summary

### Requirements by TOGAF Phase

| TOGAF Phase | Requirement Count | Requirement IDs |
|-------------|-------------------|-----------------|
| Phase B (Business Architecture) | 1 | RQ-SEC-001 |
| Phase C (Application Architecture) | 9 | RQ-SEC-002 through RQ-SEC-008, RQ-PERF-001, RQ-PERF-002 |
| Phase D (Technology Architecture) | 10 | RQ-SEC-009 through RQ-SEC-012, RQ-PERF-003, RQ-PERF-004, RQ-REL-001 through RQ-REL-003, RQ-INF-001, RQ-INF-003 |
| Phase E (Opportunities and Solutions) | 2 | RQ-REL-001, RQ-INF-002 |
| Phase F (Migration Planning) | 1 | RQ-INF-002 |
| Phase H (Architecture Change Mgmt) | 1 | RQ-SEC-012 |

### Requirements by ADR Coverage

| ADR | ADR Title | Requirements Covered | Count |
|-----|-----------|---------------------|-------|
| ADR-001 | Neo4j as Primary Database | RQ-SEC-004 | 1 |
| ADR-003 | Graph-per-Tenant Isolation | RQ-SEC-001 | 1 |
| ADR-004 | Keycloak as Default IdP | RQ-SEC-002, RQ-SEC-003 | 2 |
| ADR-005 | Valkey Distributed Cache | RQ-PERF-003 | 1 |
| ADR-007 | Provider-Agnostic Auth | RQ-SEC-003 | 1 |
| ADR-009 | Input Validation | RQ-SEC-004 | 1 |
| ADR-010 | Tenant Isolation | RQ-SEC-001 | 1 |
| ADR-014 | RBAC + Licensing Composite Auth | RQ-SEC-006, RQ-SEC-007, RQ-SEC-008 | 3 |
| ADR-017 | Data Classification | RQ-SEC-006 | 1 |
| ADR-018 | HA Multi-Tier Architecture | RQ-REL-001, RQ-REL-003, RQ-INF-001, RQ-INF-002, RQ-INF-003 | 5 |
| ADR-019 | Encryption at Rest | RQ-SEC-009, RQ-SEC-010, RQ-INF-003 | 3 |
| ADR-020 | Service Credential Management | RQ-SEC-011 | 1 |
| ADR-022 | Production-Parity Security | RQ-SEC-012 | 1 |
| (none) | No governing ADR | RQ-SEC-005, RQ-PERF-001, RQ-PERF-002, RQ-PERF-004, RQ-REL-002 | 5 |

### Uncovered Requirements (No ADR)

The following 5 requirements have no governing ADR. They are enforced through implementation standards and quality scenarios rather than explicit architecture decisions:

| Req ID | Requirement | Enforcement Mechanism |
|--------|-------------|----------------------|
| RQ-SEC-005 | XSS sanitization | Spring Security defaults, Angular built-in sanitization |
| RQ-PERF-001 | GET p95 < 100 ms | Performance testing (qa-perf agent), SLO monitoring |
| RQ-PERF-002 | Complex query p95 < 500 ms | Performance testing (qa-perf agent), query optimization |
| RQ-PERF-004 | Throughput >= 1000 req/s | Load testing (k6/Gatling), HPA autoscaling |
| RQ-REL-002 | Restart recovery < 30s | Spring Boot Actuator probes, container health checks |

## Legend

| Field | Values |
|-------|--------|
| Priority | Critical, High, Medium |
| Status | **Active** = requirement is baselined and governs current/future work; **Planned** = requirement accepted but implementation not yet scheduled; **Proposed** = under review, not yet baselined |
| TOGAF Phase | Phase B = Business Architecture; Phase C = Information Systems (Application + Data); Phase D = Technology Architecture; Phase E = Opportunities and Solutions; Phase F = Migration Planning; Phase H = Architecture Change Management |
| Arc42 Sections | 04 = Solution Strategy; 05 = Building Block View; 06 = Runtime View; 07 = Deployment View; 08 = Crosscutting Concepts; 10 = Quality Requirements; 11 = Risks and Technical Debt |
