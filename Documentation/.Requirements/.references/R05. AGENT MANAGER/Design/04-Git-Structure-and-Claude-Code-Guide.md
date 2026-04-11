# Git Repository Structure and Claude Code Workflow Guide

**Product Name:** [PRODUCT_NAME]
**Version:** 1.2.0
**Date:** March 7, 2026
**Status:** Implementation Baseline

**Scope of Baseline:** This is the implementation baseline for the AI platform stream; existing EMSIST `ai-service` may be partially aligned.

---

## 1. Recommended Git Repository Structure

For a Spring Cloud multi-agent platform of this scale, use a **mono-repo** approach with clear module boundaries. This keeps documentation, services, and shared libraries in sync.

```
agent-platform/
│
├── docs/                                    # All product documentation
│   ├── ai-service/
│   │   ├── Design/                             # Design documents
│   │   │   ├── 01-PRD-AI-Agent-Platform.md
│   │   │   ├── 02-Technical-Specification.md
│   │   │   ├── 03-Epics-and-User-Stories.md
│   │   │   ├── 04-Git-Structure-and-Claude-Code-Guide.md
│   │   │   └── README.md
│   │   ├── validation/                         # Validation reports
│   │   └── security/                           # NEW [PLANNED]: Security documentation
│   │       ├── PROMPT-INJECTION-DEFENSE.md     # Prompt injection defense design
│   │       ├── DATA-RETENTION-POLICY.md        # GDPR/CCPA retention schedules
│   │       ├── OWASP-LLM-CONTROLS.md          # OWASP LLM Top 10 control mapping
│   │       └── THREAT-MODEL.md                 # AI-specific threat model
│   ├── architecture/
│   │   ├── diagrams/
│   │   │   ├── system-architecture.mermaid
│   │   │   ├── learning-pipeline-flow.mermaid
│   │   │   └── agent-interaction-flow.mermaid
│   │   └── adr/                             # Architecture Decision Records
│   │       ├── 001-use-spring-cloud.md
│   │       ├── 002-ollama-as-primary-runtime.md
│   │       ├── 003-multi-method-learning.md
│   │       └── template.md
│   ├── runbooks/
│   │   ├── deployment.md
│   │   ├── training-pipeline.md
│   │   ├── model-rollback.md
│   │   └── incident-response.md
│   └── api/
│       └── openapi.yaml
│
├── infrastructure/
│   ├── eureka-server/
│   │   ├── src/
│   │   ├── Dockerfile
│   │   └── build.gradle
│   ├── config-server/
│   │   ├── src/
│   │   ├── Dockerfile
│   │   └── build.gradle
│   ├── api-gateway/
│   │   ├── src/
│   │   ├── Dockerfile
│   │   └── build.gradle
│   └── config-repo/                         # Git-backed config files
│       ├── application.yml
│       ├── agent-orchestrator.yml
│       ├── agent-data-analyst.yml
│       ├── agent-customer-support.yml
│       ├── training-orchestrator.yml
│       ├── model-routing.yml
│       ├── pipeline.yml                     # Pipeline configuration
│       ├── tenant-config.yml                # Tenant settings
│       ├── security.yml                     # NEW [PLANNED]: Prompt injection patterns, PII regex, tool restrictions
│       └── eval.yml                         # NEW [PLANNED]: Eval harness config, quality gate thresholds
│
├── libraries/
│   └── agent-common/
│       ├── src/main/java/com/[company]/agent/
│       │   ├── core/                        # BaseAgent, AgentRequest/Response
│       │   ├── model/                       # ModelRouter, ComplexityEstimator
│       │   ├── tools/                       # ToolRegistry, ToolExecutor, DynamicToolStore
│       │   │   ├── ToolRegistry.java
│       │   │   ├── ToolExecutor.java
│       │   │   ├── DynamicToolStore.java
│       │   │   ├── CompositeToolBuilder.java
│       │   │   └── AgentToolAdapter.java    # Agent-as-tool pattern
│       │   ├── skills/                      # Skills framework
│       │   │   ├── SkillDefinition.java
│       │   │   ├── SkillService.java
│       │   │   ├── ResolvedSkill.java
│       │   │   └── SkillTestRunner.java
│       │   ├── pipeline/                    # 7-step request pipeline
│       │   │   ├── RequestPipeline.java
│       │   │   ├── PipelineRequest.java
│       │   │   ├── PipelineResponse.java
│       │   │   └── ExecutionPlan.java
│       │   ├── validation/                  # Deterministic validation layer
│       │   │   ├── ValidationService.java
│       │   │   ├── ValidationRule.java
│       │   │   ├── ValidationResult.java
│       │   │   └── TestRunner.java
│       │   ├── explanation/                 # Explanation generation
│       │   │   ├── ExplanationService.java
│       │   │   └── Explanation.java
│       │   ├── tenant/                      # Multi-tenant context isolation
│       │   │   ├── TenantContextService.java
│       │   │   └── TenantConfig.java
│       │   ├── security/                     # LLM security controls [PLANNED]
│       │   │   ├── PromptSanitizationFilter.java       # Input sanitization for prompt injection defense
│       │   │   ├── BoundaryMarkerService.java          # Sentinel token generation/verification
│       │   │   ├── CanaryTokenService.java             # Canary token injection/detection
│       │   │   ├── CloudSanitizationPipeline.java      # Pre-cloud PII sanitization
│       │   │   ├── PIIDetectionService.java            # PII pattern matching (regex + NER)
│       │   │   └── PhaseToolRestrictionPolicy.java     # READ_TOOLS vs WRITE_TOOLS enforcement
│       │   ├── memory/                      # Conversation, vector, scratchpad
│       │   ├── reasoning/                   # CoT, self-reflection, multi-agent debate
│       │   └── trace/                       # TraceLogger, AgentTrace
│       ├── src/test/java/
│       └── build.gradle
│
├── agents/
│   ├── agent-orchestrator/
│   │   ├── src/
│   │   ├── Dockerfile
│   │   └── build.gradle
│   ├── agent-builder-service/                  # NEW [PLANNED]: Template CRUD, fork, publish, version, gallery
│   │   ├── src/main/java/
│   │   │   ├── controller/
│   │   │   │   └── AgentBuilderController.java
│   │   │   ├── service/
│   │   │   │   ├── TemplateGalleryService.java
│   │   │   │   ├── TemplateVersioningService.java
│   │   │   │   └── TemplateForkService.java
│   │   │   └── model/
│   │   │       ├── AgentTemplate.java
│   │   │       ├── AgentTemplateGalleryItem.java
│   │   │       └── AgentBuilderState.java
│   │   └── pom.xml
│   ├── agent-eval-harness/                     # NEW [PLANNED]: Quality evaluation harness
│   │   ├── src/main/java/
│   │   │   ├── eval/
│   │   │   │   ├── EvalHarnessService.java
│   │   │   │   ├── EvalTestCase.java
│   │   │   │   ├── EvalResult.java
│   │   │   │   └── AdversarialTestSuite.java
│   │   │   └── benchmark/
│   │   │       ├── BenchmarkRunner.java
│   │   │       └── QualityScoreCalculator.java
│   │   ├── src/test/resources/eval/
│   │   │   ├── standard-test-cases.jsonl
│   │   │   └── adversarial-test-cases.jsonl
│   │   └── pom.xml
│   ├── agent-data-analyst/                     # Seed agent configuration
│   ├── agent-customer-support/
│   ├── agent-code-reviewer/
│   ├── agent-document-processor/
│   └── ai-service/                              # NEW [PLANNED]: AI platform service
│       ├── src/main/java/com/emsist/ai/
│       │   ├── audit/                            # Audit log [PLANNED]
│       │   │   ├── AuditController.java
│       │   │   ├── AuditService.java
│       │   │   ├── AuditEvent.java
│       │   │   ├── AuditFilter.java
│       │   │   ├── AuditRepository.java
│       │   │   └── AuditAspect.java              # @Auditable AOP aspect
│       │   ├── notification/                     # Notification center [PLANNED]
│       │   │   ├── NotificationController.java
│       │   │   ├── NotificationService.java
│       │   │   ├── Notification.java
│       │   │   └── NotificationRepository.java
│       │   ├── knowledge/                        # Knowledge source management [PLANNED]
│       │   │   ├── KnowledgeSourceController.java
│       │   │   ├── KnowledgeSourceService.java
│       │   │   ├── KnowledgeSource.java
│       │   │   ├── ChunkPreviewService.java
│       │   │   └── KnowledgeSourceRepository.java
│       │   ├── comparison/                       # Agent comparison [PLANNED]
│       │   │   ├── AgentComparisonController.java
│       │   │   ├── AgentComparisonService.java
│       │   │   └── ComparisonResult.java
│       │   └── rbac/                             # Role-based access [PLANNED]
│       │       ├── AiRoleGuard.java
│       │       ├── AiRole.java
│       │       └── RolePermissionMatrix.java
│       └── src/main/resources/db/migration/      # Flyway migrations [PLANNED]
│           ├── V8__create_audit_events.sql
│           ├── V9__create_agent_publish_submissions.sql
│           ├── V10__create_knowledge_sources.sql
│           └── V11__create_notifications.sql
│
├── frontend/                                     # NEW [PLANNED]: AI platform frontend
│   └── src/app/features/ai/
│       ├── audit-log/                            # Audit log viewer [PLANNED]
│       │   ├── audit-log.component.ts
│       │   ├── audit-log.component.html
│       │   └── audit-log.component.scss
│       ├── pipeline-viewer/                      # Pipeline run viewer [PLANNED]
│       │   ├── pipeline-viewer.component.ts
│       │   └── pipeline-run-detail.component.ts
│       ├── notification-center/                  # Notification center [PLANNED]
│       │   ├── notification-panel.component.ts
│       │   └── notification-preferences.component.ts
│       ├── knowledge-sources/                    # Knowledge source management [PLANNED]
│       │   ├── knowledge-source-list.component.ts
│       │   ├── knowledge-upload.component.ts
│       │   └── chunk-preview.component.ts
│       ├── agent-comparison/                     # Agent comparison [PLANNED]
│       │   └── agent-comparison.component.ts
│       ├── agent-settings/                       # Agent preferences [PLANNED]
│       │   └── ai-preferences.component.ts
│       └── guards/                               # Route guards [PLANNED]
│           └── ai-role.guard.ts
│
├── learning/
│   ├── trace-collector/
│   ├── feedback-service/
│   ├── teacher-service/
│   ├── training-data-service/
│   ├── training-orchestrator/
│   └── model-evaluator/
│
├── data-ingestion/
│   ├── pattern-service/
│   ├── material-service/
│   └── document-processor/
│
├── scripts/
│   ├── setup-local.sh
│   ├── deploy.sh
│   └── training/
│       ├── prepare-sft-data.py
│       ├── run-sft.py               # Supervised fine-tuning
│       ├── run-dpo.py               # Direct preference optimization
│       ├── run-rlhf.py              # Reinforcement learning from human feedback
│       ├── run-contrastive.py       # Contrastive learning for embeddings
│       ├── run-domain-pretrain.py   # Self-supervised domain pre-training
│       └── evaluate-model.py
│
├── docker-compose.yml
├── docker-compose.prod.yml
├── build.gradle                             # Root build file (multi-project)
├── settings.gradle                          # Module declarations
├── .gitignore
├── .claude/                                 # Claude Code configuration
│   ├── settings.json
│   └── CLAUDE.md                            # Project context for Claude Code
└── CLAUDE.md                                # Root project context
```

---

## 2. Branching Strategy

Use **trunk-based development** with short-lived feature branches:

```
main                    ← production-ready, always deployable
  ├── feature/US-1.1-eureka-setup
  ├── feature/US-2.1-base-agent-react-loop
  ├── feature/US-4.2-user-corrections
  ├── feature/US-11.1-request-pipeline
  ├── feature/US-12.1-two-model-router
  ├── feature/US-13.1-tenant-rag-isolation
  ├── fix/agent-routing-timeout
  └── docs/update-technical-spec
```

**Rules:**

- `main` is protected — requires PR review and passing CI
- Feature branches named `feature/US-{id}-{short-description}`
- Bug fixes named `fix/{short-description}`
- Documentation updates named `docs/{short-description}`
- Branches should be short-lived (< 1 week)
- Squash merge to main for clean history

---

## 3. Switching to Claude Code

### 3.1 What is Claude Code?

Claude Code is a command-line AI agent that runs in your terminal, directly inside your git repository. It can read files, write code, run commands, execute tests, make git commits, and create PRs — all while understanding your full project context.

### 3.2 Installation

```bash
# Install Claude Code
npm install -g @anthropic-ai/claude-code

# Navigate to your project
cd agent-platform

# Start Claude Code
claude
```

### 3.3 Setting Up Project Context (CLAUDE.md)

Create a `CLAUDE.md` file at the root of your repo. This is the most important file — Claude Code reads it automatically and uses it to understand your project. Think of it as onboarding documentation for your AI pair programmer.

```markdown
# CLAUDE.md

## Project Overview
[PRODUCT_NAME] is a multi-agent AI platform built on Spring Boot 3.3+ and Spring Cloud.
It employs a two-model local architecture with an orchestrator model for routing, planning, and explanation, and a worker model for execution.
Requests flow through a 7-step pipeline (Intake → Retrieve → Plan → Execute → Validate → Explain → Record) with multi-tenant context isolation.
Agents run on local Ollama models with Claude/Codex/Gemini as teacher models.
The platform supports continuous learning from multiple data sources.

## Tech Stack
- Java 21, Spring Boot 3.3+, Spring Cloud 2024.x, Spring AI 1.0+
- Gradle multi-project build
- PostgreSQL 16 + PGVector, Redis 7, Apache Kafka 3.7
- Ollama for local LLM inference
- Docker + Kubernetes for deployment

## Project Structure
- infrastructure/ — Spring Cloud infrastructure services
- libraries/agent-common/ — Shared agent framework
  - pipeline/ — 7-step request pipeline (Intake, Retrieve, Plan, Execute, Validate, Explain, Record)
  - validation/ — Deterministic validation layer (backend rules, test runner, approval workflows)
  - explanation/ — Business and technical explanation generation
  - tenant/ — Multi-tenant context isolation and namespace management
  - tools/ — ToolRegistry, ToolExecutor, DynamicToolStore, CompositeToolBuilder
  - skills/ — Skills framework (SkillDefinition, SkillService, SkillTestRunner)
  - memory/ — Conversation, vector, scratchpad
  - reasoning/ — CoT, self-reflection, multi-agent debate
  - trace/ — TraceLogger, AgentTrace
- agents/ — Individual agent microservices
- learning/ — Training pipeline services
- data-ingestion/ — Feedback and data ingestion services
- docs/ — Product documentation

## Build and Test
- Build: ./gradlew build
- Test: ./gradlew test
- Single module: ./gradlew :agents:agent-data-analyst:test
- Docker: docker-compose up -d

## Conventions
- Follow Spring Boot conventions for package structure
- Use constructor injection (not field injection)
- All new code must have unit tests
- Use Lombok @Slf4j for logging
- Configuration via application.yml, not hardcoded values
- All REST endpoints must have OpenAPI annotations

## Key Design Decisions
- Two-model local strategy: smaller orchestrator model for routing/planning/explaining, larger worker model for execution
- RAG sits at orchestrator level, not inside individual agents
- Deterministic validation layer (code-based, not model-based) gates all outputs before delivery
- Tenant-safe context isolation via namespaced vector stores and scoped skills
- Agent profiles map to Skills on base models — not separate model deployments
- All inter-service communication goes through Kafka
- Model routing is configurable via Spring Cloud Config
- Training data service aggregates from 6 sources (see PRD)
- Quality gate required before model deployment

## Four Core Abstractions
1. **Tools** — atomic actions agents can take (SQL query, API call, file read)
   - Static tools = Spring beans; Dynamic tools = registered at runtime via API
   - Agent-as-tool pattern: agents can call other agents
   - Composite tools: multi-step workflows packaged as single tools
2. **Skills** — expertise packages (system prompt + tool set + knowledge scope + rules + examples)
   - Skills are versioned, testable, and assignable per agent or per request
   - Skills support inheritance and stacking
   - Domain experts manage skills via admin dashboard
3. **Learning Methods** — 13 methods across 3 tiers
   - Tier 1 (Core): SFT, DPO, RAG, Knowledge Distillation
   - Tier 2 (Optimization): Active Learning, Curriculum, RLHF, Self-Supervised, Contrastive
   - Tier 3 (Advanced): Semi-Supervised, Few-Shot/Zero-Shot, Meta-Learning, Federated
4. **Pipeline** — 7-step request lifecycle (Intake → Retrieve → Plan → Execute → Validate → Explain → Record)
   - Deterministic validation gate between Execute and response delivery
   - Orchestrator model handles Plan + Explain; Worker model handles Execute
   - All steps are traced and auditable
```

### 3.4 Daily Workflows with Claude Code

**Updating documentation:**
```
> claude

You: Update the technical spec to add a new section about the embedding
     pipeline we discussed. The pipeline uses Spring AI's EmbeddingClient
     with PGVector and processes documents in 512-token chunks with 50-token
     overlap.

Claude: [reads current tech spec, adds the section, commits]
```

**Implementing a user story:**
```
You: Implement US-2.1 Base Agent with ReAct Loop. Follow the technical
     spec in docs/ai-service/02-Technical-Specification.md section 3.

Claude: [reads the spec, creates BaseAgent.java, ReactLoop.java, writes
         tests, runs them, commits]
```

**Updating the PRD after a stakeholder meeting:**
```
You: We decided in today's meeting to add a new agent type: "Compliance
     Agent" that checks documents against regulatory requirements. Update
     the PRD with a new entry in the agent table, add it to the roadmap
     in Phase 3, and create a new epic in the user stories doc.

Claude: [updates all four documents consistently, commits]
```

**Creating a PR:**
```
You: Create a PR for the feedback ingestion work on this branch

Claude: [reviews all commits, creates PR with summary and test plan]
```

### 3.5 Claude Code Tips for This Project

**Keep CLAUDE.md updated.** Every time you make a major architectural decision, add it. Claude Code reads this first and it shapes everything it does.

**Use `/` commands.** Claude Code has built-in commands like `/review` for code review, `/commit` for smart commits, and `/pr` for pull request creation.

**Reference docs.** When asking Claude Code to implement something, point it to the relevant spec: "implement this following the design in docs/ai-service/02-Technical-Specification.md section 4.3"

**Multi-file changes.** Claude Code handles multi-file changes well. Ask it to "update all agents to support the new tracing format" and it will find and update all relevant files.

**Run tests.** Always ask Claude Code to run tests after making changes: "implement this feature and make sure all tests pass"

---

## 4. Recommended Git Workflow with Claude Code

### Step 1: Add these docs to your repo

```bash
cd agent-platform
mkdir -p docs/ai-service
# Copy the four AI-service baseline documents into this folder
git add docs/
git commit -m "Add AI service documentation baseline"
```

### Step 2: Create CLAUDE.md

```bash
# Create the CLAUDE.md file at root (see template above)
git add CLAUDE.md
git commit -m "Add Claude Code project context"
```

### Step 3: Start building with Claude Code

```bash
claude

# Ask Claude Code to scaffold the project
You: Based on the technical spec in docs/ai-service/02-Technical-Specification.md,
     scaffold the Gradle multi-project build with all the module directories
     and build files. Start with infrastructure and agent-common.
```

### Step 4: Iterate sprint by sprint

Reference the epics and user stories document when starting each sprint. Claude Code can read the acceptance criteria and implement accordingly:

```
You: We're starting Sprint 1 focused on Epic 1 (Spring Cloud Infrastructure).
     Let's begin with US-1.1: Service Discovery Setup. Read the acceptance
     criteria in docs/ai-service/03-Epics-and-User-Stories.md and implement it.
```

---

## 5. Documentation Maintenance Practices

- **PRD updates:** After every major decision or scope change
- **Tech spec updates:** When implementation deviates from or extends the spec
- **User stories:** Update acceptance criteria as requirements clarify; add new stories as discovered
- **ADRs:** Create a new ADR for every significant technical decision
- **Runbooks:** Write as you build each component; don't defer to the end

Use Claude Code to keep all docs in sync — when you change the tech spec, ask it to verify consistency with the PRD and user stories.

---

## 6. Development Guidelines for New Modules [PLANNED]

> **Status:** All modules described in this section are `[PLANNED]`. No source code exists yet. These guidelines define the development rules that will apply once implementation begins.

### 6.1 Security Module Development Guidelines [PLANNED]

The `security/` package in `libraries/agent-common/` contains LLM-specific security controls addressing OWASP LLM Top 10 risks (primarily LLM01 Prompt Injection and LLM07 System Prompt Leakage).

**Review requirements:**

| File | Review Required | Rationale |
|------|----------------|-----------|
| `PromptSanitizationFilter.java` | DEV + SEC agent | Security-critical input filter; prompt injection defense |
| `CloudSanitizationPipeline.java` | DEV + SEC agent | PII stripping before cloud model calls; GDPR/CCPA compliance |
| `BoundaryMarkerService.java` | DEV agent | Sentinel token generation for system/user prompt boundary enforcement |
| `CanaryTokenService.java` | DEV + SEC agent | Canary token injection/detection for leakage monitoring |
| `PIIDetectionService.java` | DEV + SEC agent | PII pattern matching (regex + NER); false-positive tuning required |
| `PhaseToolRestrictionPolicy.java` | DEV + ARCH agent | Enforces READ_TOOLS vs WRITE_TOOLS per pipeline phase; affects agent capability model |

**Development rules:**

- Changes to the `security/` package require SEC agent sign-off via `docs/sdlc-evidence/sec-review.md` before commits are merged
- Injection pattern lists in `infrastructure/config-repo/security.yml` must be reviewed by SEC agent quarterly
- Changes to `PhaseToolRestrictionPolicy.java` require ARCH agent approval because they affect the agent capability model (which pipeline phases can invoke which tool categories)
- All security classes must have >= 90% unit test coverage (higher than the standard 80% threshold)
- Adversarial test cases that exercise security controls must be maintained in `agents/agent-eval-harness/src/test/resources/eval/adversarial-test-cases.jsonl`

### 6.2 Eval Harness Module Guidelines [PLANNED]

The `agent-eval-harness` is a Maven module under `agents/` but is **not** deployed as a runtime service. It runs as a CI pipeline job to gate model deployments and agent configuration changes.

**Module characteristics:**

| Aspect | Detail |
|--------|--------|
| Module path | `agents/agent-eval-harness/` |
| Build tool | Maven (pom.xml) |
| Runtime | CI job only -- not a Spring Boot service, not in Docker Compose |
| Test data | `src/test/resources/eval/standard-test-cases.jsonl` (checked in) |
| Adversarial data | `src/test/resources/eval/adversarial-test-cases.jsonl` (may be in restricted-access repository if containing sensitive attack patterns) |
| Quality gate | Configurable threshold in `infrastructure/config-repo/eval.yml` |

**Development rules:**

- Standard test cases are checked into the repository under `src/test/resources/eval/standard-test-cases.jsonl`
- Adversarial test cases containing sensitive attack patterns may be stored in a restricted-access repository (separate from main repo) to avoid leaking attack vectors
- Adding or modifying test cases requires QA agent review
- The eval harness integrates into CI/CD as a stage after integration tests and before deployment (see `09-Infrastructure-Setup-Guide.md` Section 8)
- Quality score thresholds are configured in `infrastructure/config-repo/eval.yml`, not hardcoded

### 6.3 Agent Builder Service Guidelines [PLANNED]

The `agent-builder-service` is a Spring Boot microservice deployed alongside `agent-orchestrator`. It provides the backend for the Agent Builder UI, managing template CRUD, forking, publishing, versioning, and gallery browsing.

**Module characteristics:**

| Aspect | Detail |
|--------|--------|
| Module path | `agents/agent-builder-service/` |
| Build tool | Maven (pom.xml) |
| Runtime | Spring Boot microservice (deployed in Docker Compose) |
| Database | PostgreSQL (tenant-scoped) |
| Depends on | `libraries/agent-common/` |

**Development rules:**

- Template CRUD operations are tenant-scoped; queries must always filter by `tenant_id`
- System seed templates (source = `SYSTEM_SEED`) are read-only for all tenants; only platform administrators can modify them
- Fork operations create independent copies with no parent propagation (changes to the parent template do not cascade to forks)
- Gallery publish requires tenant admin approval for `ORGANIZATION` scope; `TEAM` scope requires team lead approval
- Template versioning uses semantic versioning:
  - **Patch** (x.y.Z) -- prompt text changes, minor config tweaks
  - **Minor** (x.Y.0) -- new skills/tools added, behavioral rule changes
  - **Major** (X.0.0) -- model change, breaking schema changes, capability removals
- The `AgentBuilderController` follows the same REST conventions as other EMSIST controllers (paginated list endpoints with `page`, `size`, `sort` parameters; `X-Tenant-ID` header required)

### 6.4 Security Documentation Guidelines [PLANNED]

The `docs/ai-service/security/` directory contains AI-specific security documentation separate from the platform-wide security docs in `docs/governance/`.

| Document | Content | Owner |
|----------|---------|-------|
| `PROMPT-INJECTION-DEFENSE.md` | Input sanitization strategies, boundary marker design, canary token protocol, output filtering rules | SEC + SA agents |
| `DATA-RETENTION-POLICY.md` | GDPR/CCPA retention schedules per data category (conversations, embeddings, traces, artifacts) | SEC + BA agents |
| `OWASP-LLM-CONTROLS.md` | Mapping of OWASP LLM Top 10 risks to platform controls with implementation status | SEC agent |
| `THREAT-MODEL.md` | AI-specific STRIDE threat model covering prompt injection, model theft, training data poisoning, etc. | SEC + ARCH agents |

**Development rules:**

- These documents follow the same three-state classification (`[IMPLEMENTED]`, `[IN-PROGRESS]`, `[PLANNED]`) as all other EMSIST documentation
- `OWASP-LLM-CONTROLS.md` must be updated whenever a security control is implemented or a new OWASP LLM risk is identified
- `THREAT-MODEL.md` must be reviewed by SEC agent before each release

### 6.5 Configuration File Guidelines [PLANNED]

Two new configuration files are added to `infrastructure/config-repo/`:

**`security.yml`** -- LLM security configuration:
- Prompt injection pattern definitions (regex patterns for known injection techniques)
- PII detection regex patterns and NER model configuration
- Tool restriction policies per pipeline phase (READ_TOOLS vs WRITE_TOOLS)
- Canary token secret rotation schedule
- Cloud sanitization toggle (`CLOUD_SANITIZATION_ENABLED`)

**`eval.yml`** -- Evaluation harness configuration:
- Quality gate score thresholds (minimum pass score for model deployment)
- Test suite selection (which test case files to include)
- Benchmark runner configuration (parallelism, timeout, retry policy)
- Adversarial test weight in overall score calculation

**Development rules:**

- `security.yml` changes require SEC agent review
- `eval.yml` changes require QA agent review
- Neither file should contain secrets; secrets are injected via environment variables (see `09-Infrastructure-Setup-Guide.md` Section 5)

---

## 7. CLAUDE.md Security-Critical Paths [PLANNED]

The following section should be added to the project-specific `CLAUDE.md` file (see Section 3.3 template above) once the security, eval harness, and agent builder modules are implemented:

```markdown
## Security-Critical Paths

The following paths contain security-sensitive code that requires elevated review:

| Path | Review Required | Rationale |
|------|----------------|-----------|
| `libraries/agent-common/security/` | SEC agent sign-off | LLM security controls (prompt injection, PII sanitization, tool restrictions) |
| `infrastructure/config-repo/security.yml` | Quarterly SEC review | Injection patterns, PII regex, tool policies |
| `agents/agent-eval-harness/src/test/resources/eval/adversarial-test-cases.jsonl` | Restricted access | Contains attack vectors; must not leak to public repositories |

## Agent Builder Conventions

- Template CRUD is tenant-scoped; always include X-Tenant-ID header
- System seed templates are read-only; fork before customizing
- Gallery publish requires admin approval for ORGANIZATION scope
- Template versioning follows semver (patch/minor/major)
```

> **Note:** This section is a template for future inclusion. It will be integrated into the actual CLAUDE.md once the modules exist in the codebase.

---

## 8. Changelog

| Version | Date | Changes |
|---------|------|---------|
| 1.2.0 | 2026-03-07 | Added ai-service backend packages under `agents/ai-service/`: `audit/` (AuditController, AuditService, AuditEvent, AuditFilter, AuditRepository, AuditAspect), `notification/` (NotificationController, NotificationService, Notification, NotificationRepository), `knowledge/` (KnowledgeSourceController, KnowledgeSourceService, KnowledgeSource, ChunkPreviewService, KnowledgeSourceRepository), `comparison/` (AgentComparisonController, AgentComparisonService, ComparisonResult), `rbac/` (AiRoleGuard, AiRole, RolePermissionMatrix). Added Flyway migrations V8-V11 (audit_events, agent_publish_submissions, knowledge_sources, notifications). Added frontend components under `frontend/src/app/features/ai/`: audit-log, pipeline-viewer, notification-center, knowledge-sources, agent-comparison, agent-settings, guards. All new entries tagged `[PLANNED]`. |
| 1.1.0 | 2026-03-07 | Added security module directories (`libraries/agent-common/security/`), eval harness module (`agents/agent-eval-harness/`), agent builder service (`agents/agent-builder-service/`). Added development guidelines sections 6.1-6.5 and CLAUDE.md security-critical paths template (Section 7). All new sections tagged `[PLANNED]`. |
| 1.0.0 | 2026-03-05 | Initial document: mono-repo structure, branching strategy, Claude Code setup guide, recommended git workflow, documentation maintenance practices. |
