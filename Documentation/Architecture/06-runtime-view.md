> **WP-ARCH-ALIGN (2026-03-24):** This document has been updated to reflect the frozen auth target model (Rev 2).
> See `Foundation/03-ownership-boundaries.md` SS FROZEN for the canonical decision.

# 6. Runtime View

This section documents key runtime scenarios. Strategic decisions remain in [Solution Strategy](./04-solution-strategy.md).

## 6.1 User Login with Seat Validation and Authorization Context

```mermaid
sequenceDiagram
    participant U as User
    participant FE as Frontend
    participant GW as API Gateway
    participant AF as auth-facade
    participant IDP as Identity Provider (Keycloak default)
    participant LS as license-service
    participant VK as Valkey

    U->>FE: Submit credentials
    FE->>GW: POST /api/v1/auth/login
    GW->>AF: Forward request
    AF->>IDP: Authenticate

    alt Invalid credentials
        IDP-->>AF: 401
        AF-->>GW: 401
        GW-->>FE: Login failed
    else Valid credentials
        IDP-->>AF: Tokens + claims
        AF->>LS: Validate seat(tenantUuid, userId)
        LS->>VK: Check cache
        alt Cache miss
            LS->>LS: Resolve active assignment
            LS->>VK: Cache result (TTL)
        end
        alt No active seat
            LS-->>AF: invalid
            AF-->>GW: 403 NO_ACTIVE_SEAT
            GW-->>FE: Access denied
        else Active seat
            LS-->>AF: valid + seat info
            AF->>LS: Get user feature set
            LS-->>AF: features[]
            AF->>AF: Resolve effective roles + responsibilities + clearance
            AF-->>GW: Auth response + authorization context
            GW-->>FE: Auth response + authorization context
        end
    end
```

> **Design note:** [AS-IS] auth-facade does NOT call user-service. The only Feign client in auth-facade is
> `LicenseServiceClient`. Session/user state is managed via Keycloak tokens and Neo4j graph, not via user-service REST calls.
> [TARGET] auth-facade is a transition service (then removed). Auth edge endpoints (login, refresh, logout, MFA) migrate to api-gateway. Tenant users, RBAC, session control, and provider config migrate to tenant-service (PostgreSQL). user-service is also a transition service (then removed).

Authorization context payload contract:

- `roles`: effective roles after inheritance.
- `responsibilities`: policy keys resolved by backend policy mapping.
- `features`: license-validated feature list.
- `clearanceLevel`: user data-classification clearance for this tenant context.
- `policyVersion`: policy package version returned by backend.
- `uiVisibility`: frontend rendering hints derived from policy; backend remains authoritative.

## 6.2 Token Refresh

```mermaid
sequenceDiagram
    participant FE as Frontend
    participant GW as API Gateway
    participant AF as auth-facade
    participant IDP as Identity Provider (Keycloak default)

    FE->>GW: POST /api/v1/auth/refresh
    GW->>AF: Forward refresh token
    AF->>IDP: Refresh grant
    AF->>LS: Refresh user feature set
    LS-->>AF: features[]
    AF->>AF: Recompute responsibilities + uiVisibility + clearance
    IDP-->>AF: New token pair
    AF-->>GW: Token response + authorization context
    GW-->>FE: Token response + authorization context
```

## 6.3 Tenant-Scoped Data Query

### Domain Services (PostgreSQL / Spring Data JPA)

All active domain services (tenant-service, user-service, license-service, notification-service,
audit-service, ai-service) use PostgreSQL with Spring Data JPA.
Tenant isolation is enforced via `tenant_id` column filtering.

```mermaid
sequenceDiagram
    participant C as Client
    participant GW as API Gateway
    participant TS as tenant-service
    participant PG as PostgreSQL

    C->>GW: GET /api/v1/tenants/{tenantId}
    GW->>TS: Forward + X-Tenant-ID header
    TS->>PG: SELECT * FROM tenants WHERE id = ?
    PG-->>TS: Tenant-scoped result
    TS-->>GW: Response (JSON)
    GW-->>C: Response
```

### auth-facade (Neo4j / Spring Data Neo4j) [AS-IS]

[AS-IS] Only auth-facade uses Neo4j for its authentication graph (providers, roles, groups, tenants). [TARGET] This runtime path is removed. Auth graph data migrates to tenant-service PostgreSQL. Neo4j is removed from the auth target domain. api-gateway becomes the auth edge endpoint. tenant-service owns RBAC, provider config, and session control.

```mermaid
sequenceDiagram
    participant C as Client
    participant GW as API Gateway
    participant AF as auth-facade
    participant NEO as Neo4j

    C->>GW: GET /api/v1/auth/providers
    GW->>AF: Forward + tenant context
    AF->>NEO: MATCH (t:Tenant)-[:HAS_PROVIDER]->(p:Provider) WHERE t.tenantId = $tenantId RETURN p
    NEO-->>AF: Graph-scoped result
    AF-->>GW: Response (JSON)
    GW-->>C: Response
```

### definition-service (Neo4j / Spring Data Neo4j)

definition-service uses Neo4j for metamodel graph storage.

> **Scope note:** `product-service` and `persona-service` are stub-only (have `pom.xml` but no `src/`
> directory). `process-service` has source code but is intentionally kept out of active runtime
> scope. All three are excluded from current runtime flow scope.

## 6.4 Feature and Classification Gate Check

```mermaid
sequenceDiagram
    participant C as Client
    participant S as Service
    participant LS as license-service
    participant PE as Policy Engine

    C->>S: Execute gated operation
    S->>LS: Check feature access
    alt Feature denied
        LS-->>S: allowed=false
        S-->>C: 403 feature_denied
    else Feature allowed
        LS-->>S: allowed=true
        S->>PE: Check classification access (user, resource)
        alt Classification denied
            PE-->>S: denied
            S-->>C: 403 classification_denied
        else Allowed
            PE-->>S: allowed/masked
            S-->>C: 2xx success (full or masked payload)
        end
    end
```

## 6.5 Audit Event Processing

### REST API Ingestion

audit-service exposes a REST API (`AuditController`) and persists to PostgreSQL using
JPA (`AuditEventEntity` with `@Entity` / `@Table(name = "audit_events")`).
Schema managed by Flyway.

```mermaid
sequenceDiagram
    participant SRC as Source Service
    participant AUD as audit-service (REST)
    participant PG as PostgreSQL

    SRC->>AUD: POST /api/v1/audit-events (JSON)
    AUD->>PG: INSERT INTO audit_events (...)
    PG-->>AUD: Stored
    AUD-->>SRC: 201 Created
```

### Kafka Consumer Path

Kafka consumers exist in audit-service and notification-service but are disabled by default
(`@ConditionalOnProperty(name = "spring.kafka.enabled", havingValue = "true", matchIfMissing = false)`).
No Kafka producers (`KafkaTemplate`) exist anywhere in the codebase. When enabled, the target
flow is:

```mermaid
sequenceDiagram
    participant SRC as Source Service
    participant K as Kafka
    participant AUD as audit-service

    SRC->>K: Publish audit event
    K->>AUD: Deliver event (consumer enabled via spring.kafka.enabled=true)
    AUD->>AUD: Persist to PostgreSQL
```

## 6.6 Cache Read/Write Pattern

Single-tier Valkey distributed cache. The caching architecture uses Valkey 8 as the sole cache layer. Caffeine (L1 in-process cache) is not part of the design baseline -- the platform uses a single distributed cache tier to avoid cache coherence complexity across service replicas.

Services use Spring `@Cacheable` / `@CacheEvict` annotations backed by Valkey (via Spring Data Redis).
The backing data store depends on the service: PostgreSQL for domain services, [AS-IS] Neo4j for auth-facade. [TARGET] auth-facade is removed; auth data moves to tenant-service PostgreSQL.

Cache key pattern: `tenant:{tenantId}:{entity}:{id}`

```mermaid
sequenceDiagram
    participant S as Service
    participant VK as Valkey
    participant DB as Database (PostgreSQL or Neo4j)

    S->>VK: GET key (@Cacheable)
    alt Cache hit
        VK-->>S: Cached value
    else Cache miss
        VK-->>S: null
        S->>DB: Query (JPA or Cypher)
        DB-->>S: Result
        S->>VK: SET key with TTL
        VK-->>S: OK
    end

    Note over S,VK: Cache invalidation via @CacheEvict on write operations
```

Cache invalidation strategies:

1. **Time-based** -- TTL expiration (primary strategy)
2. **Write-through** -- Invalidate on entity update via `@CacheEvict`
3. **Event-driven** -- Kafka events trigger invalidation (when Kafka producers are active)
4. **Manual** -- Admin API for cache clearing

Spring framework properties and APIs use the `redis` namespace (`spring.data.redis`, `RedisConnectionFactory`) while pointing to the Valkey runtime endpoint.

## 6.7 Tenant Creation and Provisioning

```mermaid
sequenceDiagram
    participant SA as Superadmin
    participant FE as Frontend
    participant GW as API Gateway
    participant TS as tenant-service API
    participant W as Provisioning Worker
    participant KC as Keycloak Admin API
    participant DB as PostgreSQL
    participant DNS as DNS Provider (Customer/Managed)
    participant TLS as Certificate Manager/Ingress
    participant LS as license-service

    SA->>FE: Create tenant (name, slug, primary domain mode)
    FE->>GW: POST /api/tenants
    GW->>TS: Forward request
    TS->>DB: Persist tenant + provisioning job (PENDING/PROVISIONING)
    TS-->>FE: 202 Accepted + jobId

    W->>KC: Create realm/client/roles/admin
    W->>DB: Execute schema bootstrap + migrations + seeds

    alt Managed subdomain mode (e.g., acme.emsist.com)
        W->>DNS: Create DNS record via provider API
    else Custom domain mode (e.g., app.customer.com)
        W-->>SA: Publish DNS challenge instructions (TXT/CNAME)
        SA->>DNS: Customer admin applies DNS record
        W->>DNS: Verify challenge
    end

    W->>TLS: Issue/bind certificate and route
    W->>LS: Validate tenant license entitlement
    alt Valid tenant license
        W->>TS: Run readiness checks and promote status
        TS->>DB: Update tenant status ACTIVE
    else Missing/invalid tenant license
        W->>TS: Mark provisioning failed (license gate)
        TS->>DB: Update tenant status PROVISIONING_FAILED
    end
```

Failure path contract:

- Any failed phase sets tenant to `PROVISIONING_FAILED` with step-specific error details.
- Retry resumes from last successful checkpoint; previously completed phases are not repeated unless explicitly requested.
- Each phase retry uses idempotency key `{tenantUuid}:{jobId}:{phase}` with bounded retry budget.
- Terminal phase failure triggers phase-specific compensation before final failure state commit.

## 6.8 Session Lifecycle (End-to-End)

This section documents the full session lifecycle from login through logout, covering token issuance, refresh, blacklisting, and session termination.

```mermaid
sequenceDiagram
    participant U as User
    participant FE as Frontend
    participant GW as API Gateway
    participant AF as auth-facade
    participant IDP as Keycloak
    participant VK as Valkey

    Note over U,VK: LOGIN
    U->>FE: Submit credentials
    FE->>GW: POST /api/v1/auth/login
    GW->>AF: Forward request
    AF->>IDP: Authenticate (password grant)
    IDP-->>AF: Tokens (access + refresh)
    AF->>AF: Build authorization context
    AF-->>FE: Auth response + tokens

    Note over U,VK: ACTIVE SESSION
    FE->>GW: API request + Bearer token
    GW->>GW: Extract tenant from JWT
    GW->>AF: Forward with X-Tenant-ID
    GW->>VK: Check token blacklist

    Note over U,VK: TOKEN REFRESH
    FE->>GW: POST /api/v1/auth/refresh
    GW->>AF: Forward refresh token
    AF->>IDP: Refresh grant
    IDP-->>AF: New access + refresh tokens
    AF-->>FE: Updated tokens

    Note over U,VK: LOGOUT
    FE->>GW: POST /api/v1/auth/logout
    GW->>AF: Forward
    AF->>IDP: Revoke refresh token
    AF->>VK: Blacklist access token JTI (auth:blacklist:{jti})
    AF-->>FE: 204 No Content
```

### Session Lifecycle Capabilities

| Capability | Description |
|------------|-------------|
| Login flow | auth-facade authenticates via Keycloak, returns tokens + authorization context |
| Token refresh | auth-facade obtains new token pair from Keycloak |
| Logout | Revokes refresh token in Keycloak, blacklists access token JTI in Valkey |
| Token blacklist | Valkey-backed blacklist with TTL matching token expiry |
| Blacklist check | Gateway checks Valkey for blacklisted JTIs before forwarding requests |
| MFA pending flow | Valkey `auth:mfa:pending:{hash}` with 5min TTL for pending MFA verification |
| Concurrent session limits | Per-user concurrent session cap enforcement |
| Inactivity timeout | Idle-session detection and termination |

## 6.9 Service-to-Service Authentication

Backend services communicate over the Docker network. The design requires authenticated service-to-service communication to prevent implicit trust on network boundaries.

```mermaid
sequenceDiagram
    participant GW as API Gateway
    participant AF as auth-facade
    participant TS as tenant-service
    participant US as user-service

    Note over GW,US: Target: Authenticated Inter-Service Communication
    GW->>AF: HTTP request with propagated JWT
    GW->>TS: HTTP request with propagated JWT
    GW->>US: HTTP request with propagated JWT
    Note right of TS: Services validate JWT and verify caller identity
```

### Authentication Options

| Option | Description | Complexity | Suitability |
|--------|-------------|------------|-------------|
| JWT propagation | Gateway forwards user JWT; downstream services validate it | Low | Good for Docker Compose environments |
| mTLS | Mutual TLS certificates between all services | Medium | Good for Kubernetes with cert-manager |
| Service mesh (Istio/Linkerd) | Sidecar proxies handle mutual auth transparently | High | Best for Kubernetes deployments |

Per the production-parity security baseline, internal APIs (`/api/v1/internal/**`) require explicit service authentication and least privilege. Gateway deny-by-default for internal edge exposure is mandatory.

## 6.10 Integration Hub Runtime Scenarios

The integration-service (port 8091) serves as the Integration and Communication Governance Hub, governing four integration patterns:

1. **EMSIST to External EA/BPM tools** -- MEGA HOPEX, ARIS, webMethods
2. **Tenant to Tenant** -- Controlled, auditable data sharing between EMSIST tenants
3. **Agent to Agent** -- Governance of AI agent communication
4. **EMSIST to External AI Agents** -- Integration with Claude, Codex, Gemini under rate-limited, policy-governed channels

### 6.10.1 External System Synchronization

```mermaid
sequenceDiagram
    participant EXT as External EA Tool (HOPEX/ARIS)
    participant GW as API Gateway
    participant IS as integration-service
    participant PG as PostgreSQL (integration schema)
    participant K as Kafka
    participant DS as definition-service
    participant AUD as audit-service

    EXT->>GW: POST /api/v1/webhooks/inbound (HMAC-signed)
    GW->>IS: Forward with X-Tenant-ID
    IS->>IS: Validate HMAC signature
    IS->>IS: Normalize payload to CloudEvents v1.0
    IS->>PG: Store webhook receipt + raw payload
    IS->>IS: Apply mapping (versioned, JEXL transformation)
    IS->>K: Publish normalized event
    K->>DS: Deliver to definition-service consumer
    IS->>AUD: Audit event (data leaving/entering platform)
```

### 6.10.2 Sync Engine Flow

```mermaid
sequenceDiagram
    participant SCHED as Scheduler (cron from sync_profiles)
    participant SE as Sync Engine
    participant CR as Connector Registry
    participant VAULT as Credential Store
    participant EXT as External System
    participant MR as Mapping Runtime
    participant PG as PostgreSQL
    participant K as Kafka
    participant AUD as audit-service

    SCHED->>SE: Trigger sync run (profile ID, tenant context)
    SE->>CR: Get connector config + health status
    SE->>VAULT: Retrieve credentials (encrypted DB or Vault)
    SE->>EXT: Execute read operation (REST/SOAP/MCP)
    EXT-->>SE: Response payload
    SE->>MR: Transform via versioned mapping
    MR-->>SE: Mapped objects
    SE->>PG: Update checkpoint + store run metadata
    SE->>K: Publish sync results via transactional outbox
    SE->>AUD: Audit sync run completion
```

Key design principles for integration-service:

- **Control-plane only** -- stores config, mappings, policies, checkpoints, run metadata, and masked samples; never full data replicas.
- **Plugin boundary** -- plugins handle API-client, pagination, and object mapping for specific external systems. Generic concerns (retry, credentials, rate limiting, audit) remain in the core framework.
- **Tenant isolation** -- every connector, sync profile, mapping, and policy is scoped to a tenant.
- **Transactional outbox** -- guaranteed Kafka delivery via outbox pattern (Phase 1: poller, Phase 2: Debezium CDC).

## 6.11 Super Agent Runtime Scenarios

> The following runtime scenarios document the Super Agent platform behavior.
> The current ai-service is a chatbot API with CRUD agent configurations, custom WebClient LLM providers,
> PostgreSQL `ai_db` with 7 tables, and zero Kafka usage, zero tool binding, zero agent hierarchy.

### 6.11.1 User to SuperAgent Task Orchestration

```mermaid
sequenceDiagram
    participant U as User
    participant FE as Angular Frontend
    participant GW as API Gateway
    participant SA as SuperAgent Orchestrator
    participant ME as Maturity Engine
    participant SO as Domain Sub-Orchestrator
    participant PC as Prompt Composer
    participant W as Capability Worker
    participant AI as Spring AI ChatClient
    participant LLM as LLM Provider
    participant SM as Sandbox Manager
    participant EE as Ethics Engine
    participant HITL as HITL Coordinator
    participant NS as notification-service
    participant AUD as audit-service

    U->>FE: Submit task request (e.g., "Analyze Q3 risk exposure")
    FE->>GW: POST /api/v1/ai/tasks {tenantId, taskDescription, context}
    GW->>SA: Forward + X-Tenant-ID header + JWT

    Note over SA: Step 1: Task Classification
    SA->>SA: Classify task domain (GRC domain detected)
    SA->>SA: Assess task complexity (multi-step analysis)

    Note over SA,ME: Step 2: Agent Maturity Check
    SA->>ME: getAgentMaturity(tenantId, agentId)
    ME-->>SA: ATS {level: CO_PILOT, score: 58, dimensions: {...}}

    Note over SA,SO: Step 3: Domain Routing
    SA->>SO: delegateTask(task, maturityContext)
    SO->>SO: Decompose into worker tasks (data retrieval, analysis, report generation)

    Note over SO,W: Step 4: Worker Execution (per subtask)
    SO->>W: assignTask(subtask, workerConfig)

    Note over W,PC: Step 5: Dynamic Prompt Assembly
    W->>PC: composePrompt(agentId, userId, taskContext, tenantId)
    PC->>PC: Resolve 10-block prompt: identity + domain + user + role + skills + tools + ethics + knowledge + task + output
    PC->>PC: Apply token budget (reserve 40% for LLM response)
    PC-->>W: composedSystemPrompt (within token budget)

    Note over W,LLM: Step 6: LLM Invocation
    W->>AI: ChatClient.prompt(systemPrompt, userMessage)
    AI->>LLM: HTTP request (OpenAI/Anthropic/Custom)
    LLM-->>AI: LLM response (streamed)
    AI-->>W: ChatResponse

    Note over W,SM: Step 7: Sandbox Draft Creation
    W->>SM: createDraft(workerId, output, metadata)
    SM->>SM: Store as DRAFT in tenant schema

    Note over SM,EE: Step 8: Ethics Validation
    SM->>EE: validateDraft(draft, platformBaseline, tenantConduct)
    EE->>EE: Check platform rules (immutable) + tenant conduct (configurable)
    EE-->>SM: ethicsResult {passed: true, flags: []}

    Note over SM,HITL: Step 9: HITL Decision (Risk x Maturity Matrix)
    SM->>SM: classifyRisk(task) = MEDIUM
    SM->>SM: lookupMatrix(risk=MEDIUM, maturity=CO_PILOT) = APPROVAL_GATE

    SM->>HITL: requestApproval(draft, interactionType=APPROVAL_GATE)
    HITL->>NS: sendNotification(reviewerId, approvalRequest)
    NS-->>FE: SSE push notification to reviewer

    Note over FE,HITL: Step 10: Human Review
    FE->>HITL: POST /api/v1/hitl/decisions {draftId, decision: APPROVE}
    HITL->>SM: transitionDraft(draftId, APPROVED)
    SM->>SM: Transition DRAFT -> APPROVED -> COMMITTED

    Note over SM,AUD: Step 11: Audit + Response
    SM->>AUD: POST /api/v1/audit-events {agentTask, draftLifecycle, hitlDecision}
    SM-->>SO: committedResult
    SO-->>SA: aggregatedResult
    SA-->>GW: taskResponse {result, metadata, auditRef}
    GW-->>FE: 200 OK + task result
    FE-->>U: Display result with provenance metadata
```

**Key Design Principles:**

- **Three-tier routing:** SuperAgent classifies by domain, Sub-Orchestrator decomposes into subtasks, Worker executes. This prevents the orchestrator from becoming a complexity bottleneck when managing 20+ capability workers across 5 professional domains.
- **Maturity check before delegation:** The SuperAgent queries agent maturity before routing to determine the appropriate oversight level. A Coaching-level agent on the same task would trigger a HUMAN_TAKEOVER instead of APPROVAL_GATE.
- **Dynamic 10-block prompt composition:** The Prompt Composer assembles the system prompt from database-stored blocks with conditional inclusion, respecting a token budget that reserves 40% of the context window for the LLM response.
- **Sandbox-first output:** Worker outputs are never delivered directly to users. Every output enters the sandbox as a DRAFT and progresses through the lifecycle before being COMMITTED.
- **Risk x maturity HITL matrix:** The HITL interaction type is determined by the intersection of action risk level and agent maturity level, achieving less than 10% human intervention for Graduate agents while maintaining 100% review for Coaching agents.

### 6.11.2 Event-Triggered Automated Task

This scenario illustrates how an entity change in a source service database triggers the
Super Agent to autonomously execute a task, without any user interaction initiating the flow.

```mermaid
sequenceDiagram
    participant SDB as Source Service DB (PostgreSQL)
    participant CDC as Debezium CDC Connector
    participant K as Kafka
    participant EP as Event Processor (ai-service)
    participant TR as Trigger Rule Engine
    participant SA as SuperAgent Orchestrator
    participant EE as Ethics Engine
    participant SO as Domain Sub-Orchestrator
    participant W as Capability Worker
    participant PC as Prompt Composer
    participant AI as Spring AI ChatClient
    participant LLM as LLM Provider
    participant SM as Sandbox Manager
    participant HITL as HITL Coordinator
    participant NS as notification-service
    participant AUD as audit-service

    Note over SDB,CDC: Step 1: Entity Change Detection
    SDB->>SDB: UPDATE risk_assessments SET score = 92 WHERE id = ?
    CDC->>CDC: Capture WAL change via logical replication slot
    CDC->>K: Publish to topic: agent.entity.lifecycle {tenantId, entity: "risk_assessment", op: "UPDATE", before: {score: 45}, after: {score: 92}}

    Note over K,EP: Step 2: Event Consumption
    K->>EP: Deliver event (consumer group: ai-service-events)
    EP->>EP: Deserialize event, extract tenantId
    EP->>EP: Set tenant context (schema resolution for tenant data)

    Note over EP,TR: Step 3: Trigger Rule Evaluation
    EP->>TR: evaluateRules(event)
    TR->>TR: Match rules: "risk_assessment.score > 80 AND delta > 30" = TRUE
    TR-->>EP: matchedRules [{ruleId, action: "risk_escalation_analysis", priority: HIGH}]

    Note over EP,SA: Step 4: SuperAgent Dispatch
    EP->>SA: dispatchEventTask(event, matchedRule, tenantContext)
    SA->>SA: Classify domain: GRC
    SA->>SA: Assess event-triggered task risk level = HIGH (score change > 40 points)

    Note over SA,EE: Step 5: Ethics Pre-Check
    SA->>EE: preCheckEvent(event, taskType)
    EE->>EE: Validate: no PII in event payload, action within tenant scope
    EE-->>SA: preCheckResult {approved: true}

    Note over SA,SO: Step 6: Domain Delegation
    SA->>SO: delegateEventTask(task, maturityContext, eventMetadata)
    SO->>SO: Decompose: fetch risk context, analyze delta, generate alert

    Note over SO,LLM: Step 7: Worker Execution
    SO->>W: assignTask(subtask)
    W->>PC: composePrompt(agentId, eventContext, tenantId)
    PC-->>W: composedSystemPrompt
    W->>AI: ChatClient.prompt(systemPrompt, eventContext)
    AI->>LLM: HTTP request
    LLM-->>AI: Analysis response
    AI-->>W: ChatResponse

    Note over W,SM: Step 8: Sandbox + Ethics Post-Check
    W->>SM: createDraft(workerId, output, eventRef)
    SM->>EE: validateDraft(draft, platformBaseline, tenantConduct)
    EE-->>SM: ethicsResult {passed: true}

    Note over SM,HITL: Step 9: HITL Routing (event-triggered = elevated risk)
    SM->>SM: classifyRisk(task) = HIGH (event-triggered + score delta)
    SM->>SM: lookupMatrix(risk=HIGH, maturity=PILOT) = APPROVAL_GATE
    SM->>HITL: requestApproval(draft, APPROVAL_GATE, timeout=4h)
    HITL->>NS: notifyReviewer(reviewerId, approvalRequest)
    NS-->>NS: SSE push to reviewer Angular frontend

    Note over HITL,SM: Step 10: Approval or Timeout Escalation
    alt Reviewer approves within SLA
        HITL-->>SM: decision: APPROVE
        SM->>SM: DRAFT -> APPROVED -> COMMITTED
    else Timeout (4h SLA breached)
        HITL->>HITL: Escalate to next-level reviewer
        HITL->>NS: notifyEscalatedReviewer(managerId, escalation)
    end

    Note over SM,AUD: Step 11: Audit Trail
    SM->>AUD: POST /api/v1/audit-events {eventSource: CDC, trigger: risk_threshold, draftLifecycle, hitlDecision}
    AUD-->>AUD: Store with full provenance chain
```

**Key Design Principles:**

- **Debezium CDC for entity lifecycle events:** Database WAL-based change capture ensures no application code changes are needed in source services to generate events.
- **Trigger Rule Engine:** Event-to-task mapping is defined as configurable rules, not hardcoded logic. Tenant administrators can define rules stored in `event_trigger_rules` table in the tenant schema.
- **Ethics pre-check before dispatch:** Event-triggered tasks undergo ethics validation before the SuperAgent dispatches them.
- **Elevated risk for autonomous triggers:** Event-triggered tasks carry inherently higher risk than user-initiated tasks because no human explicitly requested the action.
- **Timeout escalation:** If a reviewer does not respond within the configured SLA window, the HITL Coordinator escalates to the next-level reviewer.

### 6.11.3 HITL Approval Flow

```mermaid
sequenceDiagram
    participant SM as Sandbox Manager
    participant HITL as HITL Coordinator
    participant K as Kafka
    participant NS as notification-service
    participant FE as Angular HITL Portal
    participant R as Human Reviewer
    participant AUD as audit-service
    participant ME as Maturity Engine

    Note over SM,HITL: Step 1: Approval Request Creation
    SM->>HITL: requestApproval(draftId, riskLevel=MEDIUM, maturityLevel=CO_PILOT)
    HITL->>HITL: Lookup matrix[MEDIUM][CO_PILOT] = APPROVAL_GATE
    HITL->>HITL: Determine reviewer(s) from tenant HITL config
    HITL->>HITL: Set SLA timeout (MEDIUM risk = 4 hours)

    Note over HITL,NS: Step 2: Reviewer Notification
    HITL->>K: Publish to topic: hitl.approval.requested {draftId, reviewerId, interactionType, timeout}
    K->>NS: Deliver to notification-service consumer
    NS->>NS: Create persistent notification record
    NS->>FE: SSE push: {type: APPROVAL_REQUIRED, draftId, urgency: MEDIUM}
    FE->>FE: Display approval badge + toast notification

    Note over FE,R: Step 3: Reviewer Opens HITL Portal
    R->>FE: Navigate to HITL Approval Queue
    FE->>FE: Load pending approvals (filtered by reviewer permissions)
    FE->>FE: Display draft with context panel

    Note over R,FE: Step 4: Review Context Presented
    FE->>R: Show: draft content, risk assessment, agent maturity score
    FE->>R: Show: agent execution trace (prompt, tools used, sources cited)
    FE->>R: Show: ethics validation result (platform + tenant)
    FE->>R: Show: previous draft versions (if revision cycle)

    Note over R,HITL: Step 5: Reviewer Decision
    alt APPROVE
        R->>FE: Click APPROVE with optional comment
        FE->>HITL: POST /api/v1/hitl/decisions {draftId, decision: APPROVE, comment}
        HITL->>SM: transitionDraft(draftId, APPROVED)
        SM->>SM: UNDER_REVIEW -> APPROVED
        SM->>SM: APPROVED -> COMMITTED (apply to production data)
        HITL->>K: Publish to topic: approval.decision {draftId, decision: APPROVED, reviewerId}
    else REJECT
        R->>FE: Click REJECT with rejection reason (mandatory)
        FE->>HITL: POST /api/v1/hitl/decisions {draftId, decision: REJECT, reason}
        HITL->>SM: transitionDraft(draftId, REJECTED)
        SM->>SM: UNDER_REVIEW -> REJECTED (terminal state)
        HITL->>K: Publish to topic: approval.decision {draftId, decision: REJECTED}
    else REQUEST_CHANGES
        R->>FE: Click REQUEST CHANGES with feedback
        FE->>HITL: POST /api/v1/hitl/decisions {draftId, decision: REQUEST_CHANGES, feedback}
        HITL->>SM: transitionDraft(draftId, REVISION_REQUESTED)
        SM->>SM: UNDER_REVIEW -> REVISION_REQUESTED
        Note over SM: Worker receives revision feedback and creates new draft version
        SM->>SM: REVISION_REQUESTED -> DRAFT (new version)
    else TAKEOVER
        R->>FE: Click TAKEOVER (assume control of the task)
        FE->>HITL: POST /api/v1/hitl/decisions {draftId, decision: TAKEOVER}
        HITL->>SM: transitionDraft(draftId, HUMAN_OVERRIDE)
        SM->>SM: UNDER_REVIEW -> HUMAN_OVERRIDE (terminal for agent)
        Note over R: Reviewer completes the task manually
    end

    Note over HITL,AUD: Step 6: Audit Trail
    HITL->>AUD: POST /api/v1/audit-events {type: HITL_DECISION, draftId, decision, reviewerId, timeToDecision}
    AUD->>AUD: Store with full decision metadata

    Note over HITL,ME: Step 7: Maturity Feedback Loop
    HITL->>ME: reportHitlOutcome(agentId, tenantId, decision)
    ME->>ME: Update ATS dimensions based on outcome
    Note over ME: APPROVE -> positive signal to Competence + Reliability
    Note over ME: REJECT -> negative signal to Competence
    Note over ME: TAKEOVER -> strong negative signal to Reliability + Compliance
```

**Key Design Principles:**

- **Four HITL interaction types:** AUTO_APPROVE (no human involved, for Graduate+low-risk), APPROVAL_GATE (lightweight yes/no/revise), INPUT_COLLECTION (human provides missing information), and HUMAN_TAKEOVER (human assumes full control).
- **Mandatory rejection reason:** Rejections require a reason so the worker (and maturity engine) can learn from the feedback.
- **TAKEOVER as terminal state:** When a reviewer takes over, the agent's task is terminated. This is the strongest signal to the maturity engine and may trigger a maturity level demotion.
- **Maturity feedback loop:** Every HITL decision feeds back into the agent's ATS score, creating a reinforcement loop where good agents earn more autonomy.
- **Kafka for decision events:** HITL decisions are published to Kafka (`approval.decision` topic) for event sourcing, enabling audit replay and analytics.

### 6.11.4 Agent Maturity Evaluation

```mermaid
sequenceDiagram
    participant SL as ShedLock Scheduler
    participant ME as Maturity Engine
    participant AR as Agent Repository (tenant schema)
    participant MR as Metrics Repository (tenant schema)
    participant K as Kafka
    participant SA as SuperAgent Orchestrator
    participant BA as Benchmark Aggregator
    participant AUD as audit-service

    Note over SL,ME: Step 1: Scheduled Evaluation Trigger
    SL->>ME: triggerMaturityEvaluation() (daily, ShedLock-protected)
    ME->>ME: Acquire lock: "maturity-eval-{tenantId}" (ShedLock ensures single execution)

    Note over ME,MR: Step 2: Per-Agent Dimension Scoring
    ME->>AR: getAllActiveAgents(tenantId)
    AR-->>ME: agents [{agentId, currentLevel, currentATS}]

    loop For each agent
        ME->>MR: getMetrics(agentId, window=30d)
        MR-->>ME: metrics {taskCount, successRate, hallucinations, avgLatency, policyViolations, userRatings}

        Note over ME: Step 3: Calculate 5 Dimensions
        ME->>ME: Identity = configHashStability * 0.20
        ME->>ME: Competence = (successRate - hallucinationRate) * 0.25
        ME->>ME: Reliability = (1 - performanceVariance) * uptime * 0.25
        ME->>ME: Compliance = (1 - policyViolationRate) * 0.15
        ME->>ME: Alignment = userSatisfactionScore * 0.15

        ME->>ME: ATS = sum(dimensions) scaled to 0-100

        Note over ME: Step 4: Level Determination
        ME->>ME: Determine level from ATS: Coaching(0-39), Co-pilot(40-64), Pilot(65-84), Graduate(85-100)

        alt Level Upgrade Detected
            ME->>ME: Verify sustained performance (30 consecutive days above threshold)
            ME->>ME: Verify all dimensions meet minimum thresholds for target level
            alt Sustained + All Dimensions Pass
                ME->>AR: updateAgentLevel(agentId, newLevel, newATS)
                ME->>K: Publish to topic: maturity.level.changed {agentId, tenantId, oldLevel, newLevel, ATS, direction: UPGRADE}
                ME->>SA: expandPermissions(agentId, newLevel)
                Note over SA: Fewer HITL gates, broader tool access, higher autonomy
            else Insufficient Sustained Performance
                ME->>ME: Log: upgrade deferred (sustained period not met)
            end
        else Level Downgrade Detected
            ME->>ME: Immediate demotion (no sustained period required for safety)
            ME->>AR: updateAgentLevel(agentId, newLevel, newATS)
            ME->>K: Publish to topic: maturity.level.changed {agentId, tenantId, oldLevel, newLevel, ATS, direction: DOWNGRADE}
            ME->>SA: restrictPermissions(agentId, newLevel)
            Note over SA: More HITL gates, restricted tool access, reduced autonomy
        else No Level Change
            ME->>AR: updateATS(agentId, newATS)
        end
    end

    Note over ME,BA: Step 5: Benchmark Contribution
    ME->>BA: contributeMetrics(tenantId, anonymizedDimensionScores)

    Note over ME,AUD: Step 6: Audit Trail
    ME->>AUD: POST /api/v1/audit-events {type: MATURITY_EVAL, agentCount, levelChanges, evaluationWindow}
    AUD->>AUD: Store evaluation summary
```

**Key Design Principles:**

- **ShedLock for distributed scheduling:** The evaluation runs daily, protected by ShedLock to ensure exactly-once execution even in a multi-instance deployment.
- **Asymmetric promotion/demotion:** Promotion requires 30 consecutive days of sustained performance above the threshold. Demotion is immediate. This ensures trust is earned slowly and safety responses are immediate.
- **Minimum per-dimension thresholds:** An agent cannot reach a higher level with 90% Competence but 5% Compliance. Every dimension must meet the level-specific minimum threshold, preventing gaming of the composite score through one strong dimension.
- **Kafka events for level transitions:** Level changes are published to Kafka so that other services can react: the SuperAgent adjusts routing, the HITL Coordinator updates the approval matrix, and the audit service records the transition.
- **Permission cascade via SuperAgent:** When maturity changes, the SuperAgent Orchestrator immediately adjusts the agent's operational permissions including tool access scope, HITL gate frequency, and maximum task complexity.

### 6.11.5 Cross-Tenant Benchmark Collection

```mermaid
sequenceDiagram
    participant ME_A as Tenant A Maturity Engine
    participant BA as Benchmark Aggregator
    participant AS as ai_db.ai_benchmark (Shared Schema)
    participant KA as k-Anonymity Checker
    participant DPE as Differential Privacy Engine
    participant Q as Deferred Queue (Valkey)
    participant ME_B as Tenant B Maturity Engine
    participant AUD as audit-service

    Note over ME_A,BA: Step 1: Tenant A Contributes Metrics
    ME_A->>BA: contributeMetrics(tenantId=A, {agentType: "GRC_Analyst", dimensions: {identity: 72, competence: 68, reliability: 75, compliance: 81, alignment: 63}, level: PILOT})

    Note over BA,KA: Step 2: k-Anonymity Check
    BA->>BA: Strip tenant identifier, retain only agentType + domain
    BA->>KA: checkAnonymity(agentType="GRC_Analyst", k=5)
    KA->>AS: SELECT COUNT(DISTINCT contributing_cluster) FROM benchmarks WHERE agent_type = 'GRC_Analyst'

    alt k-Anonymity Satisfied (>= 5 distinct tenant clusters)
        KA-->>BA: anonymityCheck {satisfied: true, currentK: 7}

        Note over BA,DPE: Step 3a: Apply Differential Privacy
        BA->>DPE: addNoise(dimensions, epsilon=1.0)
        DPE->>DPE: Apply Laplacian noise to each dimension score
        DPE-->>BA: noisyDimensions {identity: 73, competence: 67, reliability: 76, compliance: 80, alignment: 64}

        Note over BA,AS: Step 4a: Store Anonymized Aggregate
        BA->>AS: INSERT INTO ai_benchmark (agent_type, domain, period, dimension_avg, dimension_p50, dimension_p90, sample_size, contributing_clusters)
        AS-->>BA: Stored

        Note over BA,AUD: Step 5a: Audit (Anonymized)
        BA->>AUD: POST /api/v1/audit-events {type: BENCHMARK_CONTRIBUTION, agentType: "GRC_Analyst", anonymized: true}

    else k-Anonymity NOT Satisfied (< 5 distinct tenant clusters)
        KA-->>BA: anonymityCheck {satisfied: false, currentK: 3}

        Note over BA,Q: Step 3b: Defer Metrics
        BA->>Q: enqueue(agentType="GRC_Analyst", encryptedMetrics, ttl=90d)
        Note over Q: Metrics held in Valkey until k-threshold met or TTL expires

        Note over BA,AUD: Step 5b: Audit (Deferred)
        BA->>AUD: POST /api/v1/audit-events {type: BENCHMARK_DEFERRED, agentType: "GRC_Analyst", reason: "k_anonymity_insufficient", currentK: 3}
    end

    Note over AS,ME_B: Step 6: Tenant B Reads Benchmark
    ME_B->>AS: SELECT dimension_avg, dimension_p50, dimension_p90 FROM ai_benchmark WHERE agent_type = 'GRC_Analyst' AND period = '2026-Q1'
    AS-->>ME_B: benchmarkData {avg: {identity: 71, competence: 65, ...}, p50: {...}, p90: {...}, sampleSize: 42}
    ME_B->>ME_B: Compare tenant B's agent scores against benchmark percentiles
    ME_B->>ME_B: Flag underperforming dimensions for improvement recommendations
```

**Key Design Principles:**

- **k-Anonymity threshold of k=5:** Metrics are not stored in the shared benchmark schema until at least 5 distinct tenant clusters contribute data for the same agent type.
- **Differential privacy noise:** Even after k-anonymity is satisfied, Laplacian noise (epsilon=1.0) is added to dimension scores before aggregation, providing mathematical guarantees against reconstruction attacks.
- **Deferred queue with TTL:** When k-anonymity is not met, metrics are encrypted and queued in Valkey with a 90-day TTL.
- **Shared benchmark schema vs tenant schemas:** Benchmark data lives in a shared schema accessible to all tenants for reading, writable only by the Benchmark Aggregator. Tenant-specific agent data remains isolated in per-tenant schemas.
- **Aggregated statistics only:** The shared schema stores only aggregated statistics (averages, percentiles, sample sizes) with differential privacy noise. No raw scores, no individual agent IDs, and no tenant identifiers are stored.

---

## Changelog

| Timestamp | Change | Author |
|-----------|--------|--------|
| 2026-03-08 | Wave 3-4: Added Super Agent runtime scenarios (6.10.1-6.10.5) | ARCH Agent |
| 2026-03-09T14:30Z | Wave 6: Final completeness pass | ARCH Agent |
| 2026-03-17 | Consolidated ADR design principles into arc42. Removed status tags and implementation tracking. Added integration hub runtime scenarios (6.10) from ADR-033. Fixed cache design to reflect single-tier Valkey (no Caffeine L1). Renumbered Super Agent scenarios to 6.11. | SA Agent |

---

**Previous Section:** [Building Blocks](./05-building-blocks.md)
**Next Section:** [Deployment View](./07-deployment-view.md)
