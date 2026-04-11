> **WP-ARCH-ALIGN (2026-03-24):** This document has been updated to reflect the frozen auth target model (Rev 2).
> See `Foundation/03-ownership-boundaries.md` S FROZEN for the canonical decision.

# Diagram Repository

## Diagram Index

This index catalogs all Mermaid diagrams across the TOGAF ADM phase documents. Each diagram is embedded inline in its owning phase document.

### TOGAF 01 -- Architecture Vision (Phase A)

| Diagram ID | Title | Type | Location | Description |
|------------|-------|------|----------|-------------|
| D-01-01 | Business Context | C4Context | `docs/togaf/01-architecture-vision.md` | External actors (tenant admins, end users, ops) and their interactions with the EMSIST platform boundary |
| D-01-02 | Technical Context | C4Container | `docs/togaf/01-architecture-vision.md` | EMSIST system boundary showing 10 microservices, external systems (Keycloak, Neo4j, PostgreSQL, Valkey, Kafka), and integration channels |
| D-01-03 | Security Architecture Layers | graph TD | `docs/togaf/01-architecture-vision.md` | Defense-in-depth layering: network segmentation, gateway controls, service-level auth, data encryption tiers |
| D-01-04 | Infrastructure 3-Phase Roadmap | gantt | `docs/togaf/01-architecture-vision.md` | Three-phase infrastructure evolution: Phase 1 Docker Compose, Phase 2 Kubernetes staging, Phase 3 production HA |

### TOGAF 02 -- Business Architecture (Phase B)

| Diagram ID | Title | Type | Location | Description |
|------------|-------|------|----------|-------------|
| D-02-01 | Business Capability Map | graph TD | `docs/togaf/02-business-architecture.md` | Top-level capability decomposition: Identity and Access, Tenant Management, Licensing, Notifications, Process Orchestration, AI/Analytics, Audit |
| D-02-02 | Tenant Onboarding Sequence | sequenceDiagram | `docs/togaf/02-business-architecture.md` | End-to-end tenant onboarding flow: admin request, tenant-service provisioning, Keycloak realm creation, license allocation, welcome notification |
| D-02-03 | Capability Gap Summary | graph LR | `docs/togaf/02-business-architecture.md` | Baseline vs target capability maturity with gap indicators for each business domain |
| D-02-04 | Phase Input Flow | graph TD | `docs/togaf/02-business-architecture.md` | Input artifacts feeding into Phase B (stakeholder concerns, vision statement, architecture principles) and output artifacts produced |

### TOGAF 03 -- Data Architecture (Phase C - Data)

| Diagram ID | Title | Type | Location | Description |
|------------|-------|------|----------|-------------|
| D-03-01 | Data Ownership Map | graph TD | `docs/togaf/03-data-architecture.md` | Service-to-data-store ownership: [AS-IS] auth-facade owns Neo4j RBAC graph. [TARGET] Neo4j owned by definition-service only; RBAC migrates to tenant-service (PostgreSQL). 7 domain services own PostgreSQL schemas, Valkey shared cache layer |
| D-03-02 | Encryption Layers | graph TD | `docs/togaf/03-data-architecture.md` | Three-tier encryption architecture: volume (LUKS/FileVault), transport (TLS 1.3), config (Jasypt AES-256) with data flow through each layer |
| D-03-03 | Data Remediation Gantt | gantt | `docs/togaf/03-data-architecture.md` | Timeline for data architecture remediation: polyglot persistence alignment, encryption rollout, tenant isolation hardening |

### TOGAF 04 -- Application Architecture (Phase C - Application)

| Diagram ID | Title | Type | Location | Description |
|------------|-------|------|----------|-------------|
| D-04-01 | Service Interaction Topology | graph TD | `docs/togaf/04-application-architecture.md` | All 10 microservices with synchronous (REST) and asynchronous (Kafka) interaction paths; database connections per service |
| D-04-02 | BFF Authentication Flow | sequenceDiagram | `docs/togaf/04-application-architecture.md` | Zero-redirect BFF pattern: Angular frontend, api-gateway (BFF), auth-facade, Keycloak; cookie-based session with backend token exchange |
| D-04-03 | Authorization Policy Evaluation | graph TD | `docs/togaf/04-application-architecture.md` | Composite authorization decision flow: RBAC role check, license entitlement check, data classification level check; deny-by-default with explicit grant |

### TOGAF 05 -- Technology Architecture (Phase D)

| Diagram ID | Title | Type | Location | Description |
|------------|-------|------|----------|-------------|
| D-05-01 | Kubernetes Target Topology | graph TD | `docs/togaf/05-technology-architecture.md` | Target K8s cluster layout: ingress controller, service mesh, pod deployments per service, persistent volume claims, external managed services |
| D-05-02 | 3-Tier Network Segmentation | graph TD | `docs/togaf/05-technology-architecture.md` | Network zones: DMZ (gateway), application tier (services), data tier (databases); allowed traffic flows between zones |
| D-05-03 | Phase 1 Backup Architecture | graph LR | `docs/togaf/05-technology-architecture.md` | Docker Compose backup strategy: pg_dump schedules, Neo4j backup commands, Valkey RDB snapshots, backup storage targets |
| D-05-04 | Phase 2 HA Architecture | graph TD | `docs/togaf/05-technology-architecture.md` | High-availability target: PostgreSQL streaming replication, Neo4j causal clustering (planned), Valkey sentinel, multi-replica services |
| D-05-05 | Phase 3 DR Architecture | graph TD | `docs/togaf/05-technology-architecture.md` | Disaster recovery topology: primary region, standby region, cross-region replication, RTO/RPO targets, failover sequence |
| D-05-06 | Credential Flow | sequenceDiagram | `docs/togaf/05-technology-architecture.md` | Per-service credential provisioning: init-db.sql creates service users, SCRAM-SHA-256 auth, environment variable injection, startup validation |

### TOGAF 06 -- Opportunities and Solutions (Phase E)

| Diagram ID | Title | Type | Location | Description |
|------------|-------|------|----------|-------------|
| D-06-01 | Work Package Dependency Graph | graph TD | `docs/togaf/06-opportunities-solutions.md` | Dependencies between work packages: foundation (auth, gateway) enabling domain services, domain services enabling integration layer |
| D-06-02 | Transition Architecture Gantt | gantt | `docs/togaf/06-opportunities-solutions.md` | Timeline for transitioning from baseline to target architecture across all work packages |

### TOGAF 07 -- Migration Planning (Phase F)

| Diagram ID | Title | Type | Location | Description |
|------------|-------|------|----------|-------------|
| D-07-01 | Transition States | stateDiagram-v2 | `docs/togaf/07-migration-planning.md` | Architecture transition states: Baseline (Docker Compose, single-tier cache), T1 (polyglot persistence aligned), T2 (K8s staging), T3 (production HA) |
| D-07-02 | Migration Dependency Graph | graph TD | `docs/togaf/07-migration-planning.md` | Migration increment dependencies: infrastructure foundations must precede service migrations; security hardening gates between increments |
| D-07-03 | Migration Timeline Gantt | gantt | `docs/togaf/07-migration-planning.md` | Detailed migration timeline with increments, milestones, and governance checkpoints |

### TOGAF 08 -- Implementation Governance (Phase G)

| Diagram ID | Title | Type | Location | Description |
|------------|-------|------|----------|-------------|
| D-08-01 | Governance Review Flow | graph TD | `docs/togaf/08-implementation-governance.md` | Architecture compliance review process: change request intake, classification (minor/major/strategic), review board evaluation, approval/rework decision, evidence archival |

### TOGAF 09 -- Architecture Change Management (Phase H)

| Diagram ID | Title | Type | Location | Description |
|------------|-------|------|----------|-------------|
| D-09-01 | Change Classification Flow | graph TD | `docs/togaf/09-architecture-change-management.md` | Change trigger evaluation: business/regulatory/technology/delivery triggers, classification into minor/major/strategic, routing to appropriate governance path |

### TOGAF 10 -- Requirements Management (Central)

| Diagram ID | Title | Type | Location | Description |
|------------|-------|------|----------|-------------|
| D-10-01 | Requirement Traceability | graph LR | `docs/togaf/10-requirements-management.md` | End-to-end traceability chain: business driver to requirement to ADR to architecture artifact to work package to implementation evidence |

## Summary

| Phase | Document | Diagram Count |
|-------|----------|---------------|
| 01 Architecture Vision | 01-architecture-vision.md | 4 |
| 02 Business Architecture | 02-business-architecture.md | 4 |
| 03 Data Architecture | 03-data-architecture.md | 3 |
| 04 Application Architecture | 04-application-architecture.md | 3 |
| 05 Technology Architecture | 05-technology-architecture.md | 6 |
| 06 Opportunities and Solutions | 06-opportunities-solutions.md | 2 |
| 07 Migration Planning | 07-migration-planning.md | 3 |
| 08 Implementation Governance | 08-implementation-governance.md | 1 |
| 09 Architecture Change Management | 09-architecture-change-management.md | 1 |
| 10 Requirements Management | 10-requirements-management.md | 1 |
| **Total** | | **28** |

## Source Format Guidance

- Preferred model source: ArchiMate modeling tool export.
- Documentation-friendly supplemental format: Mermaid embedded in markdown.
- Keep each diagram linked from its owning phase document.
- All diagrams MUST use Mermaid syntax per project Rule 7 (no ASCII art).
- Diagram IDs follow the convention `D-{phase}-{sequence}` for cross-referencing.
