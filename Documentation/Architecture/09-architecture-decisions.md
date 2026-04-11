> **WP-ARCH-ALIGN (2026-03-24):** This document has been updated to reflect the frozen auth target model (Rev 2).
> See `Foundation/03-ownership-boundaries.md` SS FROZEN for the canonical decision.

# 9. Architecture Decisions

This section is the consolidated decision index for architecture governance. Each entry captures the architectural principle, its rationale, and its consequences. These decisions are design references -- not action items.

During documentation normalization and the upcoming architecture redesign, this file is the canonical decision register for the repository.

## 9.1 Data Architecture

### 9.1.1 Polyglot Persistence (ADR-001, ADR-016)

EMSIST adopts polyglot persistence: Neo4j for the identity/RBAC graph, PostgreSQL for all relational domain services.

| Database | Service(s) | Justification |
|----------|-----------|---------------|
| **Neo4j** | [AS-IS] auth-facade, definition-service. [TARGET] definition-service only. | [AS-IS] Graph-shaped RBAC: recursive role inheritance (`INHERITS_FROM`), group membership (`MEMBER_OF`), provider configuration nodes, tenant-scoped identity graph; master definition graph nodes and metadata. [TARGET] Metamodel graph (definition-service) only. Auth RBAC/identity data migrates to tenant-service PostgreSQL. |
| **PostgreSQL** | tenant-service, user-service, license-service, notification-service, audit-service, ai-service, process-service | Relational integrity, Flyway migrations, CHECK constraints, `@Version` optimistic locking, JSONB metadata, pgvector (ai-service) |
| **PostgreSQL** (Keycloak) | Keycloak | Identity provider internal persistence (`KC_DB=postgres`) |
| **Valkey 8** | auth-facade, license-service, user-service, notification-service, ai-service, api-gateway | Distributed caching: role cache, seat validation, token blacklist, rate limiting, session state |

**Decision criteria for new services:** Use Neo4j only when the data involves recursive variable-depth traversals. Use PostgreSQL for all relational, transactional, or constraint-heavy domains.

**Infrastructure images:** PostgreSQL 16 (`postgres:16-alpine`), Neo4j 5.12 Community (`neo4j:5.12.0-community`), Valkey 8 (`valkey/valkey:8-alpine`), Keycloak 24 (`quay.io/keycloak/keycloak:24.0`).

### 9.1.2 Multi-Tenancy Strategy (ADR-003, ADR-010)

Tenant isolation follows a phased approach within a polyglot persistence context:

- **Phase 1 (active):** Shared-graph tenant isolation with tenant-scoped query and context enforcement. [AS-IS] Applies to Neo4j (auth-facade, definition-service) and PostgreSQL services (row-level `tenant_id` discrimination). [TARGET] Neo4j isolation applies to definition-service only. Auth tenant isolation moves to tenant-service PostgreSQL.
- **Phase 2 (future trigger-based):** Graph-per-tenant routing with session-level database routing and tenant context propagation. Activated only when regulatory, performance, or contractual triggers require physical tenant separation.

Routing components for Phase 2: `TenantContextFilter`, `TenantRoutingResolver`, `TenantContext`, `TenantAwareSessionFactory`, and a routing cache with controlled TTL.

### 9.1.3 Schema-per-Tenant for Agent Data (ADR-026)

The Super Agent platform uses PostgreSQL schema-per-tenant isolation within `ai_db` for sensitive agent data (conversation history, knowledge embeddings, agent configurations, worker drafts, maturity scores, audit trails). Three schema categories:

- `ai_shared` -- platform-level configuration (ethics policies, tool definitions, LLM provider configs)
- `ai_benchmark` -- cross-tenant anonymized metrics with k >= 5 anonymization
- `tenant_{tenant_id}` -- full tenant isolation for agent hierarchy, conversations, and knowledge

### 9.1.4 Data Classification Access Control (ADR-017)

A third authorization dimension alongside RBAC and licensing: classification-aware access control with four levels (`OPEN`, `INTERNAL`, `CONFIDENTIAL`, `RESTRICTED`).

Effective access rule: `ALLOW = TenantActive AND RoleAllowed AND FeatureAllowed AND ClassificationAllowed`

Classification is backend-authoritative with frontend visibility filtering. Denial semantics include field masking and row omission based on the user's clearance level.

## 9.2 Application Framework and Runtime

### 9.2.1 Spring Boot 3.4.1 with Java 23 (ADR-002)

All backend services use Spring Boot 3.4.1 with Java 23 for development and Java 21 LTS as production fallback. Spring Cloud 2024.0.0 provides the dependency BOM. Lombok edge-SNAPSHOT is required for Java 23 compatibility; production builds with Java 21 use stable Lombok releases.

Alternatives rejected: Spring Boot 2.7.x (end-of-life), Quarkus (smaller ecosystem, less team expertise), Micronaut (similar concerns).

### 9.2.2 Valkey Distributed Caching (ADR-005)

Valkey 8 serves as the single-tier distributed cache across all environments. Spring framework configuration uses the `redis` namespace (`spring.data.redis`, `RedisConnectionFactory`) while pointing to Valkey runtime endpoints.

Cache key pattern: `tenant:{tenantId}:{entity}:{id}`.

Cache invalidation strategies: TTL-based expiration (primary), write-through invalidation on entity update, event-driven invalidation via Kafka (when active), and manual admin API clearing.

Alternatives rejected: commercial managed cache (unnecessary cost), Memcached (no persistence/pub-sub), Hazelcast (overcomplicated), application-only Caffeine (no cross-instance sharing).

### 9.2.3 Zero Hardcoded Text -- Centralized i18n (ADR-031)

All user-facing text is externalized into a centralized message registry with i18n support. The platform supports Arabic (RTL) as a first-class interface language alongside English, French, German, and other locales. Runtime language switching is supported without application restart or redeployment.

## 9.3 Authentication and Identity

### 9.3.1 Keycloak Authentication with BFF Pattern (ADR-004)

Keycloak 24.x serves as the identity provider, hidden behind a Backend-for-Frontend (BFF) authentication facade. Key principles:

- **Zero redirects** -- users never see the Keycloak UI
- **Native forms** -- login forms are part of the Angular application
- **Server-to-server** -- auth-facade communicates with Keycloak REST API
- **Token exchange** -- social provider tokens exchanged for Keycloak tokens (RFC 8693)
- **Tenant isolation** -- realm per tenant for complete separation

Alternatives rejected: standard OIDC redirect flow (breaks native UX), Auth0/Okta SaaS (per-MAU pricing, vendor lock-in), custom identity server (reinventing solved problems), Firebase Authentication (limited enterprise SSO).

### 9.3.2 Provider-Agnostic Auth Facade (ADR-007)

The auth-facade uses the Strategy Pattern (`IdentityProvider` interface) with externalized configuration (`AuthProperties`) and conditional bean activation (`@ConditionalOnProperty`) to support multiple identity providers. Keycloak is the default and currently the only implemented provider. The architecture enables switching providers via configuration without code changes.

Provider claim mappings are externalized to YAML (`auth.facade.role-claim-paths`, `auth.facade.user-claim-mappings`) to accommodate differences across Keycloak, Auth0, Okta, and Azure AD JWT structures.

### 9.3.3 Neo4j-Backed Identity Broker (ADR-009) [AS-IS]

[AS-IS] The auth-facade stores provider configuration, protocol mappings, and hierarchical RBAC in a Neo4j graph. This enables runtime-configurable, per-tenant identity provider selection without service restart. The graph model supports role inheritance (`INHERITS_FROM`), group membership (`MEMBER_OF`), and provider configuration nodes.

[TARGET] This decision is superseded by the frozen auth target model (Rev 2). Provider configuration, RBAC, memberships, and session control migrate to tenant-service PostgreSQL as the authoritative store. Neo4j is removed from the auth target domain. auth-facade is a transition service (then removed); auth edge endpoints migrate to api-gateway.

### 9.3.4 Multi-Provider Authentication (ADR-011)

Four additional identity providers are architecturally defined for enterprise and government requirements: Azure AD (OIDC, Microsoft 365 enterprises), UAE Pass (OAuth 2.0, UAE government compliance), LDAP/AD (LDAP v3, on-premise enterprises), and IBM IAM (SAML 2.0, IBM enterprises). All providers implement the same `IdentityProvider` interface established by ADR-007.

### 9.3.5 IdP Management UI Consolidation (ADR-008)

Identity provider management uses a component composition approach: the feature module (`identity-providers/`) contains the source-of-truth components (`ProviderManagementPage`, `ProviderListComponent`, `ProviderFormComponent`), which are embedded within the Administration page's "Identity Providers" tab. The standalone route (`/admin/identity-providers`) is retired to eliminate duplicate navigation paths.

### 9.3.6 RBAC and Licensing Integration (ADR-014)

[AS-IS] RBAC (role-based access via Neo4j graph) and licensing (feature/seat entitlement via PostgreSQL) are integrated as complementary authorization dimensions. [TARGET] RBAC data migrates from Neo4j to tenant-service PostgreSQL; the integration pattern (RBAC + licensing as complementary dimensions) remains unchanged. The effective access rule combines both: roles gate operations, licenses gate features. The master tenant receives implicit unlimited features. Feature state is returned in the auth response (not embedded in the JWT) and refreshed on token refresh. `FeatureGateServiceImpl` with Valkey cache provides the enforcement layer.

This architecture is deployment-model neutral -- the enforcement plane (RBAC + feature gates + seat validation) is identical for SaaS and on-premise deployments. Only the data source differs.

### 9.3.7 ADR-014/015 Relationship (Resolution Analysis)

ADR-014 defines the authorization architecture (how RBAC and licensing interact at runtime). ADR-015 defines the license provisioning mechanism (how licenses enter the system). These are complementary: the authorization pattern from ADR-014 survives intact regardless of whether licensing uses a SaaS database model or a cryptographic file-based model.

## 9.4 Licensing and Deployment

### 9.4.1 On-Premise Cryptographic License Architecture (ADR-015)

EMSIST supports on-premise deployment with offline-capable, cryptographic license validation. Licenses are delivered as signed files validated locally using embedded public keys. The three-tier hierarchy: Application License > Tenant License (1..N) > User Tier Seats (Tenant-Admin, Power User, Contributor, Viewer).

The existing `FeatureGateServiceImpl` and `SeatValidationServiceImpl` are reused; only the data source changes from seeded database records to parsed license file contents.

### 9.4.2 Platform Services Consolidation (ADR-006)

An architectural direction to merge `license-service` into `tenant-service` to create a unified "Tenant Lifecycle" bounded context. Rationale: licenses are fundamentally tied to tenants; atomic provisioning requires a single transaction boundary. The license-service currently operates independently as a separate microservice on port 8085. Other services (user-service, audit-service, notification-service) remain separate based on bounded context analysis.

### 9.4.3 On-Premise Licensed Software Requirements (ADR-021)

On-premise deployments follow a BYOD (Bring Your Own Database) model: customers provide database servers and licenses. EMSIST provides configuration templates, migration scripts, and connection strings. Neo4j Enterprise is recommended for production deployments requiring encryption, clustering, and fine-grained RBAC. Community edition is sufficient for development and non-critical environments.

### 9.4.4 Runtime-Agnostic COTS Deployment Contract (ADR-032)

Customer-managed COTS deployment follows a runtime-agnostic contract built around four logical deployment roles (`postgres`, `neo4j`, `keycloak`, `services`) and four canonical provisioning modes (`preflight`, `first_install`, `upgrade`, `restore`). Platform roles (postgres, neo4j, keycloak) are long-lived; the services role is replaceable. Customer data and identity state survive routine application updates. Schema, graph, and identity bootstrap changes execute as controlled batches inside `first_install` and `upgrade`.

## 9.5 Security and Operations

### 9.5.1 Production-Parity Security Baseline (ADR-022)

No environment-level security downgrades between development and production. EMSIST is a licensed COTS product; a dual-security posture ("relaxed dev" vs "secure production") is not acceptable. CI governance blocks net-new insecure transport configurations and tracks security debt burn-down.

### 9.5.2 Encryption at Rest Strategy (ADR-019)

Three-tier encryption:

| Tier | Scope | Mechanism |
|------|-------|-----------|
| **Tier 1: Volume encryption** | All data stores | LUKS/FileVault for Docker Compose, encrypted StorageClass PVs for Kubernetes |
| **Tier 2: In-transit TLS** | All service-to-datastore connections | PostgreSQL `sslmode=verify-full`, Neo4j `bolt+s://`, Valkey `--tls-port`, Kafka `SASL_SSL` |
| **Tier 3: Config encryption** | Sensitive `application.yml` values | Jasypt `PBEWITHHMACSHA512ANDAES_256` with `ENC()` property values |

### 9.5.3 Service Credential Management (ADR-020)

Per-service PostgreSQL users with least-privilege access replace the shared `postgres` superuser. Each service authenticates with a dedicated user (e.g., `svc_tenant`, `svc_user`, `svc_audit`) that can only access its own database. SCRAM-SHA-256 authentication for all users. No hardcoded credential defaults; missing credentials cause fail-fast startup failure. The audit-service user (`svc_audit`) has INSERT and SELECT only.

### 9.5.4 High Availability and Multi-Tier Architecture (ADR-018)

Phased high availability:

- **Phase 1:** Automated backup scripts for Docker Compose environments (`pg_dump`, `neo4j-admin dump`, Valkey `BGSAVE`). Volume protection guards.
- **Phase 2:** Kubernetes migration with operator-managed HA (CloudNativePG, Neo4j Helm, Valkey Sentinel, Kafka with KRaft).
- **Phase 3:** Multi-region active-passive DR with cross-region database replication.

## 9.6 Frontend Architecture

### 9.6.1 PrimeNG Migration (ADR-012)

The frontend migrates from Bootstrap 5 / ng-bootstrap to PrimeNG 21 in unstyled mode with design tokens. Drivers:

- ng-bootstrap does not support Angular 21
- PrimeNG provides 80+ enterprise components (data tables, tree tables, file upload, steppers, splitters) missing from the current stack
- Unstyled mode with design token passthrough preserves the ThinkPLUS design system (`--tp-*` CSS custom properties)
- Built-in RTL support for Arabic interface requirements
- Runtime-switchable theming enables per-tenant branding without SCSS recompilation

Migration is incremental, component-by-component, alongside ongoing feature development.

### 9.6.2 Mobile Platform Strategy (ADR-013)

A phased PWA-to-Capacitor approach for mobile:

- **Phase 1 (PWA):** Progressive Web App with responsive design, service worker, installability, and basic offline support
- **Phase 2 (Capacitor):** Native app store distribution via Capacitor for push notifications, biometric auth, and UAE Pass app-to-app OAuth flow
- **Phase 3 (Native rewrite):** Only if Phase 2 proves insufficient for a specific capability

Key considerations: UAE Pass mobile integration, foldable device support, Arabic RTL at compact viewports (320-428px), and domain-based tenant resolution adaptation for mobile (no subdomain available).

## 9.7 Super Agent Platform (ADR-023 through ADR-030)

The Super Agent platform introduces a hierarchical agent orchestration model for the ai-service. The current ai-service is a simple chatbot API with RAG support; the Super Agent architecture is an evolutionary design target.

### 9.7.1 Hierarchical Architecture (ADR-023)

One SuperAgent per tenant orchestrates domain sub-orchestrators (EA, GRC, BSC, KM, ITIL), which delegate to capability workers. This three-tier hierarchy replaces the flat orchestrator-worker pattern to address domain expertise gaps, worker management complexity, and quality gate distribution.

### 9.7.2 Agent Maturity Model (ADR-024)

Agent Trust Score (ATS) is computed across 5 dimensions (Identity 20%, Competence 25%, Reliability 25%, Compliance 15%, Alignment 15%) and determines operational autonomy across four levels:

| Level | ATS Range | Autonomy |
|-------|-----------|----------|
| Coaching | 0-39 | All actions require human approval |
| Co-pilot | 40-64 | Routine actions auto-approved, novel actions reviewed |
| Pilot | 65-84 | Most actions autonomous, high-risk still reviewed |
| Graduate | 85-100 | Full autonomy with audit trail |

### 9.7.3 Event-Driven Agent Triggers (ADR-025)

Four event source types activate agent tasks: Debezium CDC (entity lifecycle changes), ShedLock scheduler (time-based triggers), external webhooks (HMAC-verified HTTP POST), and workflow events (business process step completions). Events are published to Kafka topics and consumed by the SuperAgent Orchestrator's Event Processor.

### 9.7.4 Platform Ethics Baseline (ADR-027)

Immutable platform ethics rules plus configurable tenant conduct extensions, evaluated per-request (target < 100ms). Aligned with EU AI Act compliance requirements (risk management, automatic logging, transparency, human oversight). Ethics is enforced as engineering controls, not aspirational documentation.

### 9.7.5 Worker Sandbox and Draft Lifecycle (ADR-028)

Worker outputs follow a staged lifecycle: DRAFT -> UNDER_REVIEW -> APPROVED -> COMMITTED. Review authority is determined by the agent's maturity level (ADR-024). This prevents unreviewed agent actions from affecting production data and enables iterative quality improvement before output finalization.

### 9.7.6 Dynamic System Prompt Composition (ADR-029)

System prompts are assembled dynamically at runtime from 10 prioritized blocks stored in the database. Blocks include user context, organizational context, role-based knowledge scoping, and dynamic skill activation. Token budget management with priority-based overflow handling ensures prompts fit within model context windows.

### 9.7.7 Human-in-the-Loop with Risk x Maturity Matrix (ADR-030)

The HITL type is determined by the intersection of action risk level and agent maturity level. Four interaction types: auto-approve (low risk + Graduate), confirmation (moderate risk or mid-maturity), review (high risk or low maturity), and takeover (critical risk or Coaching-level agents). Aligned with EU AI Act Article 14 human oversight requirements.

## 9.8 Integration Architecture

### 9.8.1 Integration Governance Hub (ADR-033)

EMSIST introduces `integration-service` (port 8091) as a dedicated microservice governing four integration patterns:

1. **EMSIST to External EA/BPM tools** -- MEGA HOPEX, ARIS, webMethods synchronization
2. **Tenant to Tenant** -- controlled, auditable data sharing between EMSIST tenants
3. **Agent to Agent** -- governance of AI agent communication
4. **EMSIST to External AI Agents** -- rate-limited, policy-governed channels to Claude, Codex, Gemini

The service owns: connector registry, credential management, mapping studio and runtime, sync engine, webhook handling, agent channel governance, playground, policy engine, and outbox publisher.

Database: PostgreSQL (dedicated `integration` schema). Events: CloudEvents v1.0 format. Error format: ProblemDetail / RFC 9457. Outbox strategy: transactional outbox (poller initially, Debezium CDC later).

Integration logic cannot be absorbed into existing services (api-gateway is proxy-only, auth-facade owns identity, ai-service owns AI inference, definition-service owns the metamodel graph) without architectural compromise.

## 9.9 Active Architecture Baseline

- Polyglot persistence: [AS-IS] Neo4j for auth-facade RBAC/identity graph and definition-service metamodel, PostgreSQL for relational domain services and Keycloak internals. [TARGET] Neo4j for definition-service metamodel only. Auth RBAC/identity data migrates to tenant-service PostgreSQL. auth-facade is transition (then removed); user-service is transition (then removed). Keycloak = authentication only. api-gateway = target auth edge endpoints.
- Authentication is provider-agnostic with Keycloak as default provider.
- Active runtime services: `service-registry (eureka)`, `api-gateway`, `auth-facade`, `tenant-service`, `user-service`, `license-service`, `notification-service`, `audit-service`, `ai-service`, `definition-service`.
- `product-service`, `process-service`, and `persona-service` remain dormant build modules (not gateway-routed, not deployed).
- `license-service` remains independent in the current runtime scope.
- `integration-service` (port 8091) is architecturally defined as the integration governance hub.
- Tenant provisioning orchestration (realm/bootstrap/domain/TLS activation) is a control-plane workflow with async idempotent phases.
- Non-master tenant activation includes a mandatory valid-license gate before status can transition to `ACTIVE`.
- Classification-aware authorization is defined as policy with backend-authoritative enforcement.
- Production-parity security baseline is mandatory for COTS delivery; net-new insecure transport entries are blocked by CI governance.
- Runtime-agnostic COTS deployment contract defines four logical roles and four canonical provisioning modes.
- Frontend uses PrimeNG 21 with ThinkPLUS design tokens; mobile follows a phased PWA-to-Capacitor strategy.
- Super Agent platform (hierarchical orchestration, maturity model, sandbox, HITL, events, ethics) is designed across ADRs 023-030.

Canonical constraints: [02-constraints.md](./02-constraints.md).

## 9.10 ADR Process Rules

- Create a new section 09 decision entry for changes that are costly to reverse.
- When architecture changes, update both the section 09 decision register and impacted Architecture sections.
- Keep ADR numbering unique and monotonic.
- ADR content is consolidated into this section as the authoritative design reference.

---

## Changelog

| Timestamp | Change | Author |
|-----------|--------|--------|
| 2026-03-08 | Initial ADR summary table with ADRs 001-031 | ARCH Agent |
| 2026-03-09T14:30Z | Completeness verification pass | ARCH Agent |
| 2026-03-17 | Full consolidation of all 33 ADRs into thematic sections. Added ADR-012 (PrimeNG), ADR-013 (Mobile), ADR-032 (COTS Deployment), ADR-033 (Integration Hub). Removed status/action language; reframed as design principles. Updated ADR-005 to reflect single-tier Valkey. Updated ADR-001/016 to include definition-service. Updated ADR-003/010 for polyglot persistence context. | ARCH Agent |

---

**Previous Section:** [Crosscutting Concepts](./08-crosscutting.md)
**Next Section:** [Quality Requirements](./10-quality-requirements.md)
