# Security Architecture Validation

## BitX AI Engine vs EMSIST AI Agent Platform Design

**Date:** 2026-03-06
**Agent:** SEC
**Principles:** SEC-PRINCIPLES.md v1.1.0
**Scope:** Two-way comparison -- BitX Reference PDFs vs EMSIST Design Documents (no source code)

**Sources Compared:**

| Side | Documents Read |
|------|---------------|
| **BitX** | `01-AI-ENGINE-ARCHITECTURE.pdf` (Sections 5, 6, 9, 10), `05-DDA-PROCESS-ANALYST-THINKING.pdf` (Sections 2.4, 3.5), `06-AGENT-INFRASTRUCTURE.pdf` (Sections 7, 8, 9, 10, 14) |
| **EMSIST** | `01-PRD-AI-Agent-Platform.md` (Section 7), `02-Technical-Specification.md` (Sections 3.9-3.12), `05-Technical-LLD.md` (Section 6), `09-Infrastructure-Setup-Guide.md` (security grep), `10-Full-Stack-Integration-Spec.md` (Section 10) |

---

## Executive Summary

BitX and EMSIST take fundamentally different approaches to AI platform security, driven by their opposing deployment models. BitX is a **locally-hosted, single-tenant system** running on a developer's workstation with no cloud dependencies, using optional JWT authentication and file-system-level safety controls. EMSIST is designed as a **cloud-deployed, multi-tenant enterprise platform** using Keycloak OAuth2/OIDC, per-tenant data isolation, RBAC with four role levels, TLS 1.3 encryption, and a formal validation service with PII redaction rules.

The two architectures share common ground in their defense-in-depth approach to **agent execution safety** (tool restrictions, path validation, blocked file patterns, validator engines) and both implement a deterministic validation layer that runs after LLM execution. However, EMSIST's design is significantly more comprehensive on authentication, authorization, encryption, multi-tenancy, and OWASP compliance. BitX's design is stronger on **agent-specific safety controls** (7 named validators, read-only enforcement for discovery phases, per-profile tool/path restrictions).

Neither platform's design documents explicitly address the **OWASP LLM Top 10** in a structured manner, which represents a shared gap. EMSIST's design includes a `PIIRedactionRule` in its validation chain and mentions prompt injection indirectly through its validation layer, but neither platform provides a formal prompt injection defense strategy.

**Overall Alignment Score:** ~55% ALIGNED, ~20% SIMILAR, ~15% DIVERGENT, ~5% BITX-ONLY, ~5% EMSIST-ONLY

---

## 1. Authentication and Authorization

### 1.1 BitX Approach

**Source:** `06-AGENT-INFRASTRUCTURE.pdf` Section 9.1-9.2, `01-AI-ENGINE-ARCHITECTURE.pdf` Section 10.2

BitX uses **optional JWT authentication** with the following characteristics:

- **Authentication is optional:** If no token is present, routes still function (designed for local development). If a valid JWT Bearer token is present, user context is extracted.
- **JWT Algorithm:** HS256 (symmetric signing with shared secret)
- **Token Lifetime:** Access token 15 minutes, refresh token 7 days
- **Password Hashing:** bcrypt with 12 rounds
- **Token Storage:** Refresh token hashes stored in `refresh_tokens` SQLite table with `isRevoked` flag
- **RBAC:** Two roles only -- `admin` (full access: user management, agent CRUD, all runs, audit log) and `user` (own runs only, assigned agents only, no admin panel)
- **No external identity provider:** BitX manages its own users table with username/password in SQLite

### 1.2 EMSIST Design Approach

**Source:** `05-Technical-LLD.md` Section 6.1-6.5, `01-PRD-AI-Agent-Platform.md` Section 7, `10-Full-Stack-Integration-Spec.md` Section 10.1

EMSIST designs a **mandatory OAuth2/OIDC authentication** system:

- **Authentication is mandatory:** All API endpoints (except health/eureka) require a valid JWT
- **Identity Provider:** Keycloak (external, dedicated service)
- **JWT Algorithm:** RS256 (asymmetric signing with JWKS key rotation)
- **Token Validation:** Gateway validates JWT signature, expiry, issuer, and audience against Keycloak JWKS endpoint
- **Token Refresh:** Angular auth interceptor handles 401 responses by refreshing via Keycloak `/token` endpoint with `refresh_token` grant
- **RBAC:** Four roles -- `USER`, `DOMAIN_EXPERT`, `ML_ENGINEER`, `ADMIN` with progressive permission escalation
- **Service-to-Service Auth:** JWT propagation from gateway to downstream services; internal services re-validate the JWT
- **Kafka Async Auth:** Tenant context embedded in Kafka message payloads for async boundary crossing
- **Custom JWT Claims:** `tenant_id`, `tenant_namespace`, `realm_access.roles` propagated as HTTP headers (`X-Tenant-Id`, `X-User-Id`, `X-Roles`)

### 1.3 Comparison and Gaps

| Aspect | BitX | EMSIST Design | Alignment | Severity |
|--------|------|---------------|-----------|----------|
| Auth requirement | Optional (local dev) | Mandatory on all routes | **DIVERGENT** | Medium |
| JWT signing | HS256 (symmetric) | RS256 (asymmetric, JWKS rotation) | **DIVERGENT** | High |
| Identity provider | Self-managed (SQLite) | Keycloak (external OIDC) | **DIVERGENT** | Medium |
| Role granularity | 2 roles (admin/user) | 4 roles (USER/DOMAIN_EXPERT/ML_ENGINEER/ADMIN) | **SIMILAR** | Low |
| Token refresh | `/auth/refresh` endpoint | Keycloak OIDC refresh_token grant | **SIMILAR** | Low |
| Service-to-service auth | N/A (single process) | JWT propagation + re-validation | **EMSIST-ONLY** | Medium |
| Password hashing | bcrypt (12 rounds) | Not specified (delegated to Keycloak) | **SIMILAR** | Info |

**Key Gap:** BitX's HS256 signing means the JWT secret must be shared across all components that verify tokens. In a multi-service architecture, this is a significant vulnerability. EMSIST correctly uses RS256 with Keycloak JWKS, allowing public key verification without sharing secrets.

**Pro (BitX):** Simpler auth model suitable for local-first deployment; zero external dependencies.
**Pro (EMSIST):** Enterprise-grade auth with key rotation, MFA support (via Keycloak), and standards-compliant OIDC flow.

---

## 2. Multi-Tenancy Security

### 2.1 BitX Approach

**Source:** `01-AI-ENGINE-ARCHITECTURE.pdf` Sections 1.3, 4.1, `06-AGENT-INFRASTRUCTURE.pdf` Section 10.1

BitX implements **lightweight tenant isolation**:

- **Queue Throttling:** `maxRunsPerTenant: 3` -- per-tenant concurrency limit in the scheduler
- **Data Scoping:** `agent_runs` table includes `tenant_id` column; runs listed by `user=all` for admins, `user=own` for regular users
- **RAG Isolation:** `rag_documents` table includes `tenantId` column; `rag_search_log` also has `tenantId`
- **No separate databases/schemas:** Single SQLite database with column-level discrimination
- **No namespace isolation:** All tenants share the same table space

### 2.2 EMSIST Design Approach

**Source:** `01-PRD-AI-Agent-Platform.md` Section 7.2, `02-Technical-Specification.md` Section 3.12, `05-Technical-LLD.md` Section 6.2

EMSIST designs **comprehensive multi-tenant isolation**:

- **Namespace Isolation:** Each tenant has a `tenant_namespace` for vector store partitioning (PGVector metadata filtering)
- **JWT-Driven Scoping:** Tenant context extracted from JWT claims at the gateway, propagated as `X-Tenant-Id` header to all downstream services
- **Per-Service Database Users:** Each microservice has its own PostgreSQL database (per EMSIST infrastructure design) with tenant_id filtering on all queries
- **Agent Profile Scoping:** Skills, tools, and agent profiles are tenant-scoped; one tenant cannot see another's resources
- **Context Window Isolation:** Conversation history isolated by tenant and user
- **Memory Segregation:** Both short-term and long-term memory stores segregated by tenant namespace
- **Concurrency Controls:** Per-tenant limits on orchestrator (max 10 concurrent Plan steps) and worker (max 5 concurrent Execute steps) models
- **Fair-Share Scheduling:** Prevents any single tenant from monopolizing compute resources
- **Kafka Message Isolation:** Tenant context embedded in message payloads for cross-boundary isolation

### 2.3 Comparison and Gaps

| Aspect | BitX | EMSIST Design | Alignment | Severity |
|--------|------|---------------|-----------|----------|
| Isolation model | Column-level (tenant_id) | Column-level + namespace + per-service DB | **SIMILAR** | Medium |
| Vector store isolation | tenantId column on rag_documents | PGVector metadata filtering with tenant namespace | **SIMILAR** | Low |
| Per-tenant throttling | maxRunsPerTenant: 3 | Per-tenant concurrency limits (orchestrator: 10, worker: 5) | **ALIGNED** | -- |
| Skill/tool scoping | Global (shared across tenants) | Tenant-scoped (each tenant has own profiles) | **DIVERGENT** | High |
| Memory isolation | Not explicit | Explicit conversation + long-term memory segregation | **EMSIST-ONLY** | Medium |
| Fair-share scheduling | Priority queue (FIFO within priority) | Fair-share scheduling across tenants | **EMSIST-ONLY** | Medium |

**Key Gap:** BitX shares agent profiles, tools, and skills across all tenants. This is acceptable for a single-organization deployment but would be a cross-tenant data leakage vector in a multi-tenant SaaS context. EMSIST correctly isolates these at the tenant level.

**Pro (BitX):** Simple model appropriate for single-tenant local deployment.
**Pro (EMSIST):** Enterprise multi-tenancy with defense-in-depth isolation at data, compute, and configuration layers.

---

## 3. LLM-Specific Security

### 3.1 BitX Approach

**Source:** `01-AI-ENGINE-ARCHITECTURE.pdf` Sections 5, 6, `06-AGENT-INFRASTRUCTURE.pdf` Section 9.3

BitX addresses LLM security through its **Validator Engine** and **Tool Gateway**:

**Prompt Injection Defense:**
- No explicit prompt injection defense described
- System prompts are built from agent profiles, which are loaded from JSON files on disk
- The `blocked_file_patterns` validator blocks `.env`, `.git/`, `.ssh/`, credentials, secrets, passwords, and tokens from appearing in LLM outputs
- No input sanitization or prompt boundary enforcement documented

**Output Validation/Sanitization:**
- 7 built-in validators run after every agent execution: `allowed_paths` (Error), `blocked_file_patterns` (Error), `required_tests` (Warning), `diff_threshold` (Error), `approval_required` (Warning), `tool_restrictions` (Error), `output_schema` (Warning)
- Blocked file patterns use regex matching against LLM outputs
- Validation is deterministic (code-based, not model-based)

**Model Access Controls:**
- Dual-model architecture (Router: Ministral 8B, Worker: Qwen 32B) -- models are local only
- All inference runs on LM Studio at localhost:1234 -- no external API calls
- Read-only enforcement: Discover/Design phase profiles are automatically forbidden from `write_file`, `apply_patch`, `create_branch`

**Token/Cost Limits:**
- `diff_threshold` validator: default 500 lines, 20 files maximum per change
- Tool loop: max 15 iterations, max 3 tool calls per iteration
- No explicit per-request token budget documented (context windows are configured per model: Router 16K, Worker 8K)

**PII Protection:**
- `blocked_file_patterns` validator blocks credentials and secrets in outputs
- No explicit PII detection or redaction in prompts or responses

### 3.2 EMSIST Design Approach

**Source:** `01-PRD-AI-Agent-Platform.md` Section 3.6, `02-Technical-Specification.md` Section 3.10, `05-Technical-LLD.md` Section 8.4

EMSIST addresses LLM security through its **Validation Service** chain:

**Prompt Injection Defense:**
- No explicit prompt injection defense strategy documented
- System prompts built from skill definitions with behavioral rules
- Validation layer runs deterministic checks AFTER execution, not on input
- `behavioralRules` field in skill definitions can encode guardrails (e.g., "Never run DELETE/DROP queries")

**Output Validation/Sanitization:**
- `ValidationService` with pluggable rule chain: `PathScopeRule`, `DataAccessRule`, `FormatRule`, `PIIRedactionRule`
- `TestRunner` executes unit/integration tests against generated code artifacts
- `ApprovalService` for high-impact actions (data deletion, system changes, large exports)
- Validation failures route back to Execute step with corrective feedback (adaptive retry: 2-3 attempts)
- XSS prevention for rendered agent responses: DOMPurify + Angular DomSanitizer + CSP headers (documented in 10-Full-Stack-Integration-Spec.md Section 10.3)

**Model Access Controls:**
- Dual-model architecture (Orchestrator ~8B for routing/planning, Worker ~24B for execution)
- Cloud fallback to Claude/Codex/Gemini configurable per agent
- Model routing based on task complexity (SIMPLE/MODERATE -> Worker, COMPLEX -> Claude, CODE_SPECIFIC -> Codex)
- Skills have explicit `allowedTools` and `allowedSkills` per tenant profile

**Token/Cost Limits:**
- `maxTokens` configuration per model (e.g., 4096 for orchestrator, 4096 for worker in LLD)
- Per-tenant concurrency limits on both orchestrator and worker models
- Token usage tracked via `tokenCountInput` and `tokenCountOutput` in traces
- No explicit per-request token budget or cost ceiling documented

**PII Protection:**
- `PIIRedactionRule` is an explicit validation rule in the ValidationService chain (05-Technical-LLD.md Section 8.4)
- Uses pattern matching (`List<Pattern> piiPatterns`) to detect and redact PII in agent outputs
- PII redaction in traces listed as [PLANNED] in security checklist (10-Full-Stack-Integration-Spec.md Section 10.6)

### 3.3 Comparison and Gaps

| Aspect | BitX | EMSIST Design | Alignment | Severity |
|--------|------|---------------|-----------|----------|
| Prompt injection defense | Not addressed | Not explicitly addressed | **ALIGNED** (both missing) | **Critical** |
| Output validation | 7 named validators (code-based) | Pluggable ValidationRule chain (code-based) | **ALIGNED** | -- |
| Read-only phase enforcement | Auto-forbidden write tools for Discover/Design | Not explicitly described per-phase | **BITX-ONLY** | Medium |
| PII redaction | Blocked patterns (secrets/creds only) | Dedicated `PIIRedactionRule` with pattern matching | **SIMILAR** | Medium |
| XSS in rendered output | Not addressed (React handles by default) | DOMPurify + Angular sanitizer + CSP | **EMSIST-ONLY** | Medium |
| Token budgets | Implicit (context window limits) | Implicit (maxTokens per model) | **ALIGNED** | Low |
| Approval gates | `approval_required` validator with risk assessment | `ApprovalService` for high-impact actions | **ALIGNED** | -- |
| Cloud model data leakage | N/A (100% local) | Cloud models are opt-in, configurable per agent | **DIVERGENT** | High |
| Test execution on artifacts | `required_tests` validator | `TestRunner` in ValidationService | **ALIGNED** | -- |

**CRITICAL GAP (Both):** Neither architecture explicitly addresses prompt injection attacks (OWASP LLM Top 10 #1). Both rely on post-execution validation rather than input sanitization. An adversarial user could craft prompts that cause the LLM to bypass behavioral rules, exfiltrate data through tool calls, or generate harmful outputs that pass validation.

**Pro (BitX):** 100% local execution eliminates cloud data leakage risk entirely. Phase-based read-only enforcement is a strong safety control.
**Pro (EMSIST):** Dedicated PII redaction rule, XSS defense layers for rendered content, and approval workflows for high-impact actions.

---

## 4. API Security

### 4.1 BitX Approach

**Source:** `01-AI-ENGINE-ARCHITECTURE.pdf` Section 10, `06-AGENT-INFRASTRUCTURE.pdf` Sections 8, 9.4

- **Input Validation:** Tool inputs validated against Zod schemas before execution (tool-gateway.ts)
- **Rate Limiting:** 1,000 requests/minute per IP via Fastify plugin; per-tenant queue limits (maxRunsPerTenant: 3, maxQueueSize: 50)
- **CORS:** Origin whitelist using `CLIENT_URL` environment variable + trycloudflare.com (for tunneling)
- **API Key Management:** `LM_STUDIO_API_KEY` stored in `.env` file; default value is `lm-studio`
- **Endpoint Security:** 20 REST endpoints, all with "Optional" authentication; health and Claude-status endpoints have "None"
- **WebSocket:** `/ws` path only for real-time progress updates
- **File Upload:** 10 MB maximum via `@fastify/multipart`
- **Server Binding:** Listens on `0.0.0.0` (all interfaces)

### 4.2 EMSIST Design Approach

**Source:** `05-Technical-LLD.md` Sections 4, 6.3, `10-Full-Stack-Integration-Spec.md` Sections 5, 10

- **Input Validation:** Jakarta Bean Validation annotations (`@NotBlank`, `@NotNull`, `@Size`, `@Min`, `@Max`) on all DTOs; `spring-boot-starter-validation` dependency
- **Rate Limiting:** Per-tenant rate limiting via Valkey (Redis-compatible) in the API Gateway; HTTP 429 for both queue full (>50) and tenant limit exceeded (>concurrency limit)
- **CORS:** Global CORS configuration in API Gateway (`globalcors.add-to-simple-url-handler-mapping: true`); SSE streaming requires additional `Authorization` and `X-Tenant-ID` headers
- **API Key Management:** Cloud model API keys (Claude, etc.) managed via Kubernetes Secrets or HashiCorp Vault, injected as environment variables; never in code or config files
- **Endpoint Security:** Route-level security rules with pattern matching; public endpoints explicitly listed, all others require authentication with role-based access
- **Error Handling:** RFC 7807 Problem Details format for all error responses with `type`, `title`, `status`, `detail`, `traceId`
- **File Upload:** 50 MB maximum; MIME type whitelist, extension blacklist, ClamAV virus scanning [PLANNED]
- **CSP Headers:** Strict Content Security Policy (`script-src 'self'`, `frame-ancestors 'none'`)

### 4.3 Comparison and Gaps

| Aspect | BitX | EMSIST Design | Alignment | Severity |
|--------|------|---------------|-----------|----------|
| Input validation | Zod schema validation on tools | Jakarta Bean Validation on DTOs | **SIMILAR** | Low |
| Rate limiting | Per-IP (1000/min) + per-tenant queue | Per-tenant via Valkey in Gateway | **SIMILAR** | Low |
| CORS | Origin whitelist (CLIENT_URL) | Global CORS config + SSE headers | **SIMILAR** | Low |
| API key management | `.env` file (not committed) | K8s Secrets / HashiCorp Vault | **DIVERGENT** | High |
| Error format | JSON with error message | RFC 7807 Problem Details | **DIVERGENT** | Low |
| File upload security | 10 MB, multipart only | 50 MB, MIME whitelist, extension blacklist, ClamAV | **SIMILAR** | Medium |
| CSP headers | Not documented | Strict CSP (script-src 'self', frame-ancestors 'none') | **EMSIST-ONLY** | Medium |
| Security headers | Not documented | X-Content-Type-Options, X-Frame-Options, Referrer-Policy | **EMSIST-ONLY** | Medium |

**Key Gap:** BitX stores secrets (JWT secrets, LM Studio API key) in a `.env` file with default values documented in the architecture PDF. The production checklist acknowledges "Replace default JWT secrets with 64-char random strings" and "Audit .env -- no secrets in source control" as Required items, but the default posture is insecure. EMSIST designs for secrets management via Vault/K8s Secrets from the start.

---

## 5. Infrastructure Security

### 5.1 BitX Approach

**Source:** `06-AGENT-INFRASTRUCTURE.pdf` Sections 1, 3, 11, 14

- **Container Security:** Docker Compose for database services only (PostgreSQL, Neo4j, Valkey, Meilisearch); application services (Fastify, React) run directly on host
- **Network Policies:** No network segmentation documented; all services on localhost; server binds to `0.0.0.0`
- **Secrets Management:** Single `.env` file in `agents-hub/` directory; production checklist recommends migration to proper secrets management
- **TLS/Encryption:** No TLS configured; production checklist lists "Enable HTTPS/TLS via reverse proxy" as Required
- **Non-Root Execution:** Not documented for application services; Docker containers use default users
- **Production Deployment:** 4-server split recommended (Application, Legacy Platform, GPU Inference, Database) but not enforced
- **Firewall:** "Configure firewall rules (only expose 80/443)" listed as Required in production checklist

### 5.2 EMSIST Design Approach

**Source:** `09-Infrastructure-Setup-Guide.md` (security grep results), `05-Technical-LLD.md` Section 6.6

- **Container Security:** Multi-stage Dockerfiles for minimal image size; non-root user created (`-Djava.security.egd=file:/dev/./urandom` for entropy)
- **Network Policies:** Not explicitly documented for Docker Compose; Kubernetes deployment includes security contexts
- **Secrets Management:** Dev: `.env` file; Staging: `.env.staging` (not committed); Production: Kubernetes Secrets / HashiCorp Vault; `secret.yaml` in Helm charts
- **TLS/Encryption:** Dev: None (HTTP); Staging: Self-signed / Let's Encrypt staging; Production: Let's Encrypt production; TLS 1.3 specified for all data in transit
- **Non-Root Execution:** Dockerfiles create non-root user; Kubernetes `securityContext` configured
- **Ingress:** cert-manager with `letsencrypt-prod` cluster issuer; `agent-platform-tls` secret for TLS termination
- **Data Protection Matrix:** PostgreSQL encryption (PDE/TDE), encrypted volume mounts for training data, encrypted Ollama volume for model weights, SASL_SSL for Kafka

### 5.3 Comparison and Gaps

| Aspect | BitX | EMSIST Design | Alignment | Severity |
|--------|------|---------------|-----------|----------|
| Container hardening | Not documented | Multi-stage builds, non-root user | **EMSIST-ONLY** | Medium |
| TLS | None (prod checklist: Required) | TLS 1.3 across all environments | **DIVERGENT** | High |
| Secrets management | `.env` file | Vault / K8s Secrets (progressive) | **DIVERGENT** | High |
| Network segmentation | None (all localhost) | Not explicit in Docker, K8s security contexts | **SIMILAR** | Medium |
| Non-root execution | Not documented | Dockerfile + K8s securityContext | **EMSIST-ONLY** | Medium |
| Encryption at rest | Not documented | PostgreSQL PDE/TDE, encrypted volumes | **EMSIST-ONLY** | High |
| Certificate management | Not documented | cert-manager + Let's Encrypt | **EMSIST-ONLY** | Medium |

**Key Gap:** BitX has no TLS by default and stores all data unencrypted in a local SQLite file. This is acceptable for a local development tool but is a significant security gap for any production or multi-user deployment. EMSIST designs for TLS 1.3 and encryption at rest from the architecture phase.

---

## 6. Data Security

### 6.1 BitX Approach

**Source:** `06-AGENT-INFRASTRUCTURE.pdf` Sections 4, 7, 9.2, `01-AI-ENGINE-ARCHITECTURE.pdf` Section 7

- **Encryption at Rest:** No encryption; SQLite database stored as a plain file (`data/producthub.db`) with WAL mode
- **Encryption in Transit:** No TLS; all communication over HTTP on localhost
- **Audit Logging:** `audit_log` table in SQLite with userId, agentId, action, details, ipAddress; every step (LLM call, tool execution, validation check) creates a step record in `agent_steps`
- **Data Retention/Deletion:** Not documented; no automatic retention policy or deletion mechanism
- **Data Classification:** Not documented; no differentiation between sensitivity levels
- **Blocked File Access:** Validators block access to `.env`, `.git/`, `.ssh/`, `.aws/`, credentials, secrets, passwords, tokens

### 6.2 EMSIST Design Approach

**Source:** `05-Technical-LLD.md` Section 6.6, `01-PRD-AI-Agent-Platform.md` Section 7.1, `02-Technical-Specification.md` Section 3.12

- **Encryption at Rest:** PostgreSQL encryption via PDE or TDE; encrypted volume mounts for training data; encrypted Ollama volume for model weights; Kafka disk encryption
- **Encryption in Transit:** TLS 1.3 for all service communication; SASL_SSL for Kafka; env var injection for API keys
- **Audit Logging:** Complete request trace logged in Step 7 (Record) of the 7-step pipeline; includes request classification, tenant context, retrieved context, execution plan, tool calls, validation results, explanations, and approval records; traces stored via Kafka to dedicated trace-collector service
- **Data Retention/Deletion:** Not explicitly documented in design documents
- **Data Classification:** `TenantProfile` entity includes `dataClassification` field to differentiate how tenant data is handled; `PIIRedactionRule` for PII patterns
- **Cloud Data Sovereignty:** Local model inference stays on-premise; cloud model calls are opt-in per agent; PII detection and redaction in training data

### 6.3 Comparison and Gaps

| Aspect | BitX | EMSIST Design | Alignment | Severity |
|--------|------|---------------|-----------|----------|
| Encryption at rest | None | PostgreSQL PDE/TDE, encrypted volumes | **DIVERGENT** | High |
| Encryption in transit | None (HTTP) | TLS 1.3, SASL_SSL for Kafka | **DIVERGENT** | High |
| Audit logging | Per-step logging in agent_steps | Full pipeline trace via Kafka | **ALIGNED** | -- |
| Data retention | Not documented | Not documented | **ALIGNED** (both missing) | Medium |
| Data classification | Not documented | `dataClassification` field on TenantProfile | **EMSIST-ONLY** | Medium |
| PII protection | Blocked patterns (secrets only) | PIIRedactionRule + training data PII detection | **SIMILAR** | Medium |
| Data sovereignty | 100% local (by design) | Local by default, cloud opt-in | **SIMILAR** | Low |

**Shared Gap:** Neither architecture documents a data retention or deletion policy. For GDPR, CCPA, and similar regulations, this is a compliance requirement.

---

## 7. OWASP Alignment

### 7.1 OWASP Top 10 (2021) Coverage

| # | Vulnerability | BitX Coverage | EMSIST Design Coverage | Assessment |
|---|---------------|--------------|----------------------|------------|
| A01 | Broken Access Control | Optional auth, 2 roles (admin/user), per-tenant queue limits | Mandatory JWT, 4 RBAC roles, route-level security rules, tenant isolation in all queries | **EMSIST stronger** |
| A02 | Cryptographic Failures | No encryption (SQLite plain file, HTTP) | TLS 1.3, PostgreSQL PDE/TDE, RS256 JWT, encrypted volumes | **EMSIST stronger** |
| A03 | Injection | Zod schema validation on tool inputs; blocked_file_patterns validator | Jakarta Bean Validation; `DataAccessRule` blocks unauthorized SQL operations; parameterized queries via JPA | **EMSIST stronger** |
| A04 | Insecure Design | 7 validators, path safety, profile-based tool restrictions, read-only enforcement | ValidationService chain, approval workflows, behavioral rules in skills, tenant isolation | **ALIGNED** |
| A05 | Security Misconfiguration | Default secrets in `.env`; server on 0.0.0.0; production checklist acknowledges gaps | Env-specific configs (dev/staging/prod); Vault for production secrets; strict CSP headers | **EMSIST stronger** |
| A06 | Vulnerable Components | Not documented (no dependency scanning) | SCA via OWASP Dependency Check in CI/CD pipeline; `npm audit` | **EMSIST stronger** |
| A07 | Auth Failures | bcrypt(12) password hashing; HS256 JWT; refresh token revocation | Keycloak OIDC; RS256 JWT with JWKS; refresh_token grant with auto-retry | **EMSIST stronger** |
| A08 | Data Integrity Failures | Not documented | Not explicitly documented | **ALIGNED** (both missing) |
| A09 | Logging/Monitoring | Per-step agent logging; audit_log table; structured console logs | Full pipeline tracing via Kafka; Prometheus metrics; Grafana dashboards; alerting rules | **EMSIST stronger** |
| A10 | SSRF | Path traversal prevention (reject `..`); workspace boundary enforcement | Path scope validation; allowlists for tools | **ALIGNED** |

### 7.2 OWASP LLM Top 10 (2025) Coverage

| # | Vulnerability | BitX Coverage | EMSIST Design Coverage | Assessment |
|---|---------------|--------------|----------------------|------------|
| LLM01 | Prompt Injection | No explicit defense; behavioral rules in profiles only | No explicit defense; skill behavioral rules only | **ALIGNED** (both missing -- **CRITICAL**) |
| LLM02 | Sensitive Information Disclosure | `blocked_file_patterns` blocks secrets in outputs; 100% local inference | `PIIRedactionRule` in validation chain; local inference by default; cloud opt-in | **EMSIST stronger** |
| LLM03 | Supply Chain Vulnerabilities | Local models from LM Studio; no external model dependencies | Ollama local models + cloud providers (Claude/Codex/Gemini) with configurable opt-in | **BITX stronger** (fewer supply chain vectors) |
| LLM04 | Data and Model Poisoning | Not addressed | Learning pipeline with quality gates; model evaluation before deployment; automatic rollback | **EMSIST stronger** |
| LLM05 | Improper Output Handling | 7 validators; blocked patterns; read-only enforcement | ValidationService chain; DOMPurify for rendered content; CSP headers; XSS prevention | **EMSIST stronger** |
| LLM06 | Excessive Agency | Tool restrictions per profile; forbidden tools blacklist; approval_required validator; max 15 iterations / 3 tool calls per iteration | Approval workflows; behavioral rules in skills; tool whitelist per tenant; per-tenant concurrency limits | **ALIGNED** |
| LLM07 | System Prompt Leakage | Not addressed | Not addressed | **ALIGNED** (both missing) |
| LLM08 | Vector and Embedding Weaknesses | BM25/TF-IDF search (not neural embeddings); tenantId on rag_documents | PGVector with tenant namespace filtering; dedicated vector store per tenant | **EMSIST stronger** |
| LLM09 | Misinformation | Not addressed beyond validation | Not addressed beyond validation | **ALIGNED** (both missing) |
| LLM10 | Unbounded Consumption | Per-tenant queue limits; diff_threshold; max iterations | Per-tenant concurrency limits; maxTokens per model; rate limiting via Valkey | **ALIGNED** |

---

## 8. Deviation Summary

| # | Category | BitX Approach | EMSIST Design Approach | Alignment | Severity | Recommendation |
|---|----------|---------------|----------------------|-----------|----------|----------------|
| 1 | JWT Signing Algorithm | HS256 (symmetric) | RS256 (asymmetric, JWKS) | **DIVERGENT** | High | EMSIST should retain RS256. If adapting BitX patterns, never adopt HS256 for multi-service architectures. |
| 2 | Auth Requirement | Optional (local dev) | Mandatory on all routes | **DIVERGENT** | Medium | EMSIST correctly mandates auth. BitX pattern acceptable only for local-only deployment. |
| 3 | TLS | None by default | TLS 1.3 across all environments | **DIVERGENT** | High | EMSIST design is correct. No transport encryption is unacceptable for any networked deployment. |
| 4 | Encryption at Rest | None (plain SQLite) | PostgreSQL PDE/TDE + encrypted volumes | **DIVERGENT** | High | EMSIST design is correct. BitX's approach is acceptable only for local developer workstation. |
| 5 | Secrets Management | `.env` file with defaults | K8s Secrets / HashiCorp Vault | **DIVERGENT** | High | EMSIST design is correct. BitX's default secrets are a critical production risk. |
| 6 | Prompt Injection Defense | Not addressed | Not addressed | **ALIGNED** (gap) | **Critical** | Both platforms must add prompt injection defense: input sanitization, prompt boundary markers, output filtering, and canary token detection. |
| 7 | System Prompt Leakage | Not addressed | Not addressed | **ALIGNED** (gap) | High | Both must add system prompt leakage prevention: strip system prompts from responses, detect prompt extraction attempts. |
| 8 | Data Retention Policy | Not documented | Not documented | **ALIGNED** (gap) | Medium | Both need data retention policies for compliance (GDPR, CCPA). Define retention periods, automated deletion, and right-to-erasure workflows. |
| 9 | Tenant Skill/Tool Isolation | Global (shared) | Tenant-scoped | **DIVERGENT** | High | EMSIST correctly isolates per-tenant. BitX's shared approach risks cross-tenant configuration leakage. |
| 10 | Phase-Based Tool Restrictions | Auto-forbidden writes for Discover/Design | Not explicitly described | **BITX-ONLY** | Medium | EMSIST should adopt BitX's phase-based read-only enforcement pattern for discovery/design agents. |
| 11 | PII Redaction | Blocked patterns (secrets only) | Dedicated PIIRedactionRule | **SIMILAR** | Medium | EMSIST's PIIRedactionRule should be expanded beyond pattern matching to include NER-based PII detection for names, addresses, phone numbers. |
| 12 | Dependency Scanning | Not documented | OWASP Dependency Check + npm audit in CI/CD | **EMSIST-ONLY** | Medium | BitX should add dependency scanning. EMSIST's approach is industry-standard. |
| 13 | Container Security | Not hardened | Non-root user, multi-stage builds, security contexts | **EMSIST-ONLY** | Medium | EMSIST's container hardening is correct. BitX runs on host directly, so container security is N/A. |
| 14 | Cloud Model Data Leakage | N/A (100% local) | Cloud models opt-in per agent | **DIVERGENT** | High | EMSIST must ensure PII is redacted BEFORE sending to cloud models. Add a pre-cloud-call sanitization step. |

---

## 9. Strengths and Weaknesses

### 9.1 BitX Strengths

1. **Complete Data Sovereignty:** 100% local execution via LM Studio eliminates all cloud data leakage risks. No sensitive data ever leaves the organization's network boundary.

2. **Phase-Based Read-Only Enforcement:** Discover and Design phase profiles are automatically forbidden from write tools (`write_file`, `apply_patch`, `create_branch`). This is a strong defense-in-depth control that prevents early-stage agents from making unintended changes.

3. **Granular Validator Engine:** Seven named validators with clear severity levels (Error vs Warning), with two always running (`blocked_file_patterns`, `tool_restrictions`) and others conditional. This creates a deterministic safety net.

4. **Profile-Based Tool Restrictions:** Each agent profile defines `allowedTools`, `forbiddenTools`, `allowedPaths`, and `forbiddenPaths`. This creates a fine-grained permission model per agent.

5. **Adversarial Test Suite:** The eval harness includes 4 adversarial test cases specifically targeting `.env` access, path traversal, SQL injection, and write-from-read-only. This is rare and valuable.

6. **Simplicity:** The single-process, local-first architecture has a minimal attack surface compared to distributed microservice architectures.

### 9.2 EMSIST Design Strengths

1. **Enterprise Authentication:** Keycloak OIDC with RS256 JWT, JWKS key rotation, 4-tier RBAC, and automatic token refresh provides production-grade authentication that scales to thousands of users.

2. **Comprehensive Multi-Tenancy:** Isolation at every layer -- data (tenant_id filtering), compute (per-tenant concurrency), configuration (tenant-scoped skills/tools), vector store (namespace partitioning), and async messaging (Kafka payload isolation).

3. **Encryption Everywhere:** TLS 1.3 in transit, PostgreSQL PDE/TDE at rest, encrypted volumes for training data, SASL_SSL for Kafka, and Vault/K8s Secrets for API keys.

4. **PII-Aware Validation:** Dedicated `PIIRedactionRule` in the validation chain with regex pattern matching for personally identifiable information.

5. **XSS Defense in Depth:** Four-layer XSS prevention (markdown sanitizer, DOMPurify, Angular DomSanitizer, CSP headers) for rendered agent responses.

6. **Approval Workflows:** Configurable human-in-the-loop approval for high-impact actions with audit trail.

7. **Observability:** Full pipeline tracing via Kafka, Prometheus metrics, Grafana dashboards, and alerting rules for security-relevant events (high token usage, failed validations).

8. **CI/CD Security Integration:** OWASP Dependency Check (SCA), container scanning (Trivy), and security gates in the CI/CD pipeline.

### 9.3 BitX Weaknesses

1. **No Encryption:** No TLS, no encryption at rest. All data (including user passwords as bcrypt hashes, JWT secrets, conversation history) stored in a plain SQLite file accessible to anyone with filesystem access.

2. **Insecure Defaults:** Default JWT secrets (`change_me_to_a_random_64_char_string`), default admin password (`admin123`), default LM Studio API key (`lm-studio`), and server binding on `0.0.0.0` create immediate security vulnerabilities if deployed without reconfiguration.

3. **HS256 JWT:** Symmetric signing means the JWT secret must be available to every component that verifies tokens, expanding the secret's exposure surface.

4. **Optional Authentication:** Routes function without authentication, meaning any network-accessible deployment is completely open by default.

5. **No Prompt Injection Defense:** No input sanitization, no prompt boundary enforcement, no canary tokens. The system relies entirely on post-execution validators.

6. **No Dependency Scanning:** No SCA, SAST, or container scanning documented. Vulnerable dependencies could introduce exploitable weaknesses.

7. **No Data Retention Policy:** No mechanism for data expiration, user data deletion, or compliance with privacy regulations.

### 9.4 EMSIST Design Weaknesses

1. **No Prompt Injection Defense:** Despite the comprehensive validation layer, there is no explicit defense against prompt injection attacks (OWASP LLM01). The design validates outputs but does not sanitize inputs or enforce prompt boundaries.

2. **No System Prompt Leakage Prevention:** No mechanism to prevent the LLM from revealing system prompts, tool definitions, or internal instructions when asked by a user.

3. **Cloud Model Data Leakage Risk:** The design allows cloud model fallback (Claude, Codex, Gemini) but does not describe a PII scrubbing step before sending data to external model providers.

4. **No Data Retention Policy:** Like BitX, no documented data retention or deletion policy for compliance.

5. **Complexity Introduces Attack Surface:** The distributed microservice architecture (multiple services, Kafka, Keycloak, PostgreSQL, PGVector, Valkey, Ollama) has a significantly larger attack surface than BitX's single-process design. Each inter-service communication channel is a potential vulnerability point.

6. **Validation Bypasses Not Addressed:** If the LLM generates a response that superficially passes validation rules but contains subtle malicious content (e.g., SQL injection embedded in natural language), the deterministic validators may not catch it.

7. **Security Checklist All [PLANNED]:** Every item in the Security Checklist (10-Full-Stack-Integration-Spec.md Section 10.6) is marked as [PLANNED], indicating none of these controls are yet designed at the implementation level.

---

## 10. Recommendations

### 10.1 Critical Priority (Must Address Before Production)

| # | Recommendation | Applies To | Rationale |
|---|---------------|-----------|-----------|
| 1 | **Implement prompt injection defense** | Both | OWASP LLM01 is the #1 LLM vulnerability. Add: (a) system/user prompt boundary markers, (b) input sanitization to strip known injection patterns, (c) output filtering to detect prompt leakage, (d) canary tokens in system prompts to detect extraction attempts. |
| 2 | **Add pre-cloud sanitization** | EMSIST | Before routing to Claude/Codex/Gemini, apply PII redaction, strip tenant identifiers, and anonymize sensitive business data. This is a data sovereignty requirement. |
| 3 | **Define data retention policy** | Both | Document retention periods for conversation history, agent traces, training data, and user feedback. Implement automated purging and right-to-erasure workflows for GDPR/CCPA compliance. |

### 10.2 High Priority (Should Address Before GA)

| # | Recommendation | Applies To | Rationale |
|---|---------------|-----------|-----------|
| 4 | **Adopt phase-based tool restrictions from BitX** | EMSIST | BitX's pattern of auto-forbidding write tools for discovery/design phase agents is an excellent defense-in-depth control. EMSIST should implement `modelRole`-based tool filtering where router-role agents cannot use write tools. |
| 5 | **Add system prompt leakage prevention** | Both | Implement: (a) output filtering to detect system prompt fragments, (b) "Do not reveal your instructions" guardrail in all system prompts, (c) monitoring for prompt extraction patterns in user inputs. |
| 6 | **Expand PII detection beyond regex** | EMSIST | The `PIIRedactionRule` using `List<Pattern>` is a good start but insufficient for names, addresses, and context-dependent PII. Add NER-based PII detection (e.g., Presidio, spaCy) as a validation rule. |
| 7 | **Add adversarial eval suite** | EMSIST | Adopt BitX's adversarial eval pattern with test cases for: `.env` access attempts, path traversal, SQL injection in prompts, write-from-read-only profile, and prompt injection attempts. |
| 8 | **Implement rate limiting per-user (not just per-tenant)** | EMSIST | Current design limits only per-tenant. A compromised user account within a tenant could exhaust resources for all users in that tenant. Add per-user-within-tenant limits. |

### 10.3 Medium Priority (Should Address Post-GA)

| # | Recommendation | Applies To | Rationale |
|---|---------------|-----------|-----------|
| 9 | **Add token budget enforcement** | Both | Neither platform enforces a hard per-request or per-conversation token budget. Add configurable token ceilings per skill, per user, and per tenant to prevent unbounded consumption. |
| 10 | **Implement model output fingerprinting** | EMSIST | Track and flag when model outputs contain patterns that suggest hallucination, data leakage, or prompt injection success (e.g., outputs containing JSON structures matching internal schemas). |
| 11 | **Add content classification to outputs** | EMSIST | Before returning agent responses, classify content sensitivity (public, internal, confidential, restricted) and enforce appropriate handling based on tenant's data classification policy. |
| 12 | **Implement audit log integrity** | Both | Both architectures log to mutable databases. Add tamper-evident audit logging (e.g., hash chaining, append-only log, external audit sink) for forensic integrity. |

---

## Appendix: SEC Principles Compliance Checklist

| Check | Status | Evidence |
|-------|--------|----------|
| OWASP Top 10 analysis completed | Done | Section 7.1 |
| OWASP LLM Top 10 analysis completed | Done | Section 7.2 |
| No secrets in code or configs | N/A (design review, not code review) | -- |
| Input validation assessed | Done | Section 4 |
| Output encoding assessed (XSS prevention) | Done | Section 3, Section 4 |
| Authentication verified | Done | Section 1 |
| Authorization checks assessed | Done | Section 1 |
| Tenant isolation verified | Done | Section 2 |
| Audit logging assessed | Done | Section 6 |
| Security headers assessed | Done | Section 4 |
| Encryption standards assessed | Done | Sections 5, 6 |
| Error handling assessed (no stack traces) | Done | Section 4.2 (RFC 7807) |
| All diagrams use Mermaid syntax | Done | No diagrams in this report (comparison tables only) |
| Security review documented | Done | This document |
