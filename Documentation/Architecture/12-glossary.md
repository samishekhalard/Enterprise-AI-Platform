> **WP-ARCH-ALIGN (2026-03-24):** This document has been updated to reflect the frozen auth target model (Rev 2).
> See `Foundation/03-ownership-boundaries.md` FROZEN for the canonical decision.

# 12. Glossary

## 12.1 Domain Terms

| Term | Definition |
|------|------------|
| Agent Trust Score (ATS)  | Composite score (0-100) across 5 dimensions measuring agent maturity: accuracy, safety, efficiency, compliance, user satisfaction. See ADR-024 |
| Benchmark Metric  | Anonymized cross-tenant agent performance data collected for maturity model calibration. Subject to k-anonymity (k >= 5). See ADR-024 |
| Conduct Policy  | Tenant-configurable ethics rules extending the immutable platform baseline. Governs what agents can and cannot do. See ADR-027 |
| Draft Lifecycle  | State machine for worker outputs: DRAFT -> UNDER_REVIEW -> APPROVED -> COMMITTED (or REJECTED). See ADR-028 |
| Event Trigger  | Mechanism that initiates agent tasks from 4 sources: entity lifecycle (CDC), scheduled (ShedLock), external (webhooks), workflow events. See ADR-025 |
| Feature Gate | Runtime access control based on entitlements |
| HITL (Human-in-the-Loop)  | Interaction model where humans review, approve, or override agent actions. 4 types: confirmation, data entry, review, takeover. See ADR-030 |
| License | Entitlement granting access to products/features |
| Maturity Level  | One of 4 progressive autonomy stages: Coaching (ATS 0-39), Co-pilot (ATS 40-64), Pilot (ATS 65-84), Graduate (ATS 85-100). See ADR-024 |
| Platform Ethics Baseline  | Immutable set of ethical constraints applied to all agents across all tenants. Cannot be overridden by tenant conduct policies. See ADR-027 |
| Prompt Block  | One of 10 composable sections of a dynamic system prompt: identity preamble, role definition, domain context, tenant rules, tool bindings, safety rails, output format, memory context, knowledge base selection, conversation history. See ADR-029 |
| Realm | Keycloak identity domain boundary (default provider context) |
| Seat | User-level license assignment |
| Sub-Orchestrator  | Domain-scoped orchestrator (e.g., HR, Finance, IT) that receives tasks from SuperAgent and delegates to specialized workers. See ADR-023 |
| Super Admin | Platform-level administrator with master-tenant privileges |
| SuperAgent  | Tenant-level AI orchestration brain that decomposes tasks and dispatches to domain sub-orchestrators. One SuperAgent per tenant. See ADR-023 |
| Tenant | Organization using EMS with isolated data and configuration scope |
| Tenant Admin | Administrative user responsible for tenant-level governance |
| Token Budget  | Maximum token allocation per LLM model for prompt composition. Managed by the prompt composer with overflow handling. See ADR-029 |
| Worker  | Capability-level execution unit that performs specific tasks (e.g., invoice processing, onboarding). Operates within a sandbox. See ADR-023, ADR-028 |
| Worker Sandbox  | Isolated execution environment where worker outputs are staged as drafts before approval. Prevents uncommitted changes from reaching production data. See ADR-028 |

## 12.2 Architecture Terms

| Term | Definition |
|------|------------|
| ABAC | Attribute/context-based authorization checks |
| ADR | Architecture Decision Record |
| Approval Matrix  | Decision table mapping risk level x maturity level to required HITL interaction type. See ADR-030 |
| arc42 | Structured architecture documentation template |
| BFF | Backend-for-Frontend pattern |
| CDC (Change Data Capture)  | Pattern for detecting and publishing data changes as events. EMSIST uses Debezium for Kafka-based CDC. See ADR-025 |
| CQRS | Separation of write and read responsibilities |
| DynamicToolStore  | Runtime tool resolution mechanism that binds tools to workers based on task context, tenant configuration, and maturity level permissions |
| Hierarchical Orchestration  | Pattern where a root agent (SuperAgent) delegates to domain orchestrators (Sub-Orchestrators) which delegate to task executors (Workers). See ADR-023 |
| RAG | Retrieval-Augmented Generation workflow |
| RBAC | Role-based authorization model |
| ReAct Loop  | Reasoning + Acting pattern for LLM agents: the model reasons about what action to take, executes a tool, observes the result, and decides the next step. Implemented via Spring AI ChatClient |
| Schema-per-Tenant  | Database isolation strategy where each tenant gets a dedicated PostgreSQL schema within the same database. Provides strong isolation without requiring separate database instances. See ADR-026 |
| Tool Registry  | Central catalog of available tools (functions) that workers can invoke during task execution. Supports dynamic tool binding via Spring AI |
| Worker Draft  | Uncommitted output produced by a worker, stored in the sandbox until approved through the HITL process |

## 12.3 Technology Terms

| Term | Definition |
|------|------------|
| Debezium  | Open-source distributed platform for change data capture. Monitors PostgreSQL WAL and publishes entity lifecycle events to Kafka |
| Handlebars  | Templating engine used for prompt block variable substitution in the dynamic prompt composer |
| Kafka | Event streaming platform |
| Keycloak | Default identity provider implementation |
| Neo4j | [AS-IS] Graph database for auth-facade RBAC/identity graph (ADR-016); [TARGET] Removed from auth domain -- retained for definition-service only. RBAC/memberships migrate to tenant-service (PostgreSQL). |
| Ollama  | Local LLM inference runtime for running open-source models (Llama, Mistral) without cloud API dependency |
| pgvector | PostgreSQL extension for vector similarity search, used for RAG (Retrieval-Augmented Generation) knowledge embeddings |
| PostgreSQL | Relational database for 7 domain services + Keycloak internal persistence (ADR-016) |
| ShedLock  | Distributed lock library for scheduled tasks. Ensures only one instance executes a scheduled trigger in a multi-node deployment |
| Spring AI  | Spring ecosystem module providing model-agnostic LLM integration, tool binding, and ReAct agent loop. Target replacement for custom WebClient providers |
| Valkey | Distributed cache data store |

## 12.4 Quality and Operations Terms

| Term | Definition |
|------|------------|
| HPA | Horizontal Pod Autoscaler |
| MTBF | Mean Time Between Failures |
| MTTR | Mean Time to Recovery |
| RFC 7807 | Standardized HTTP problem detail format |
| SLI | Service Level Indicator |
| SLO | Service Level Objective |

## 12.5 Abbreviations

| Abbreviation | Meaning |
|--------------|---------|
| API | Application Programming Interface |
| ATS | Agent Trust Score |
| BPMN | Business Process Model and Notation |
| CDC | Change Data Capture |
| CI/CD | Continuous Integration / Continuous Deployment |
| DLQ | Dead Letter Queue |
| HITL | Human-in-the-Loop |
| IAM | Identity and Access Management |
| JWT | JSON Web Token |
| LLM | Large Language Model |
| OIDC | OpenID Connect |
| ReAct | Reasoning + Acting (agent pattern) |
| SLA | Service Level Agreement |
| SSE | Server-Sent Events |
| TLS | Transport Layer Security |
| WAL | Write-Ahead Log (PostgreSQL) |

## 12.6 Super Agent Domain Terms

Terms for the Super Agent platform capabilities.

| Term | Definition | Reference |
|------|------------|-----------|
| Coaching Level | Lowest maturity stage (ATS < 40). All agent actions require human approval | ADR-024 |
| Co-pilot Level | Second maturity stage (ATS 40-64). Routine actions auto-approved, novel actions require review | ADR-024 |
| Correlation ID | Unique identifier linking all events in a single agent task execution chain. Used for distributed tracing and event deduplication | ADR-025 |
| Draft Content Hash | Hash of worker output stored in sandbox, used to verify integrity during approval workflow | ADR-028 |
| Event Chain Depth | Maximum number of cascading events from a single trigger. Default limit: 5. Prevents infinite loops | ADR-025 |
| Graduate Level | Highest maturity stage (ATS >= 85). Full autonomy with audit trail. Requires sustained performance across all 5 dimensions | ADR-024 |
| Identity Preamble | First prompt block (highest priority). Establishes the agent's core identity and capabilities | ADR-029 |
| k-Anonymity | Privacy property ensuring each benchmark metric record is indistinguishable from at least k-1 other records. EMSIST requires k >= 5 | ADR-024, ADR-026 |
| Pilot Level | Third maturity stage (ATS 65-84). Most actions autonomous, high-risk actions still reviewed | ADR-024 |
| Prompt Integrity Hash | Cryptographic hash of assembled system prompt, stored for audit trail and tamper detection | ADR-029 |
| Safety Rails | Prompt block containing ethical boundaries, prohibited actions, and escalation triggers | ADR-029 |
| Tenant Conduct Extension | Configurable ethics rules that extend (but cannot weaken) the platform baseline for a specific tenant | ADR-027 |

---

## Changelog

| Timestamp | Change | Author |
|-----------|--------|--------|
| 2026-03-08 | Wave 3: Added Super Agent Domain Terms (Section 12.6), agent-related entries across 12.1-12.5 | ARCH Agent |
| 2026-03-09T14:30Z | Wave 6 (Final completeness): Corrected ATS maturity level ranges to match ADR-024 -- Co-pilot from "40-65" to "40-64", Pilot from "65-85" to "65-84" in Sections 12.1 and 12.6. Zero remaining TODOs, TBDs, or placeholders. | ARCH Agent |

---

**Previous Section:** [Risks and Technical Debt](./11-risks-technical-debt.md)
**Back to Index:** [Architecture README](./README.md)
