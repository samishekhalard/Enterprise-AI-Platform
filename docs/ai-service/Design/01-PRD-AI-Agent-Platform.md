# Product Requirements Document: AI Agent Platform

**Product Name:** [PRODUCT_NAME]
**Version:** 1.0
**Date:** March 5, 2026
**Status:** Implementation Baseline
**Owner:** ThinkPlus Advisory

**Scope of Baseline:** This is the implementation baseline for the AI platform stream; existing EMSIST `ai-service` may be partially aligned.

---

## 1. Vision and Purpose

### 1.1 Product Vision

Build an enterprise-grade, multi-agent AI platform powered by local LLMs (Ollama) with cloud model integration (Claude, Codex, Gemini), deployed on Spring Boot and Spring Cloud microservices. The platform enables organizations to create, train, and continuously improve specialized AI agents using multiple learning methods fed by proprietary data, business patterns, customer feedback, user feedback, and curated learning materials.

### 1.2 Problem Statement

Organizations need AI agents that understand their specific domain, workflows, and institutional knowledge. Off-the-shelf models lack organizational context, cloud-only solutions raise privacy and cost concerns, and there is no unified platform to build, orchestrate, and continuously improve multiple specialized agents from proprietary data sources.

### 1.3 Key Value Propositions

- **Data Sovereignty:** Agents run locally on Ollama — sensitive data never leaves the organization
- **Continuous Improvement:** Multi-method learning pipeline that gets smarter from every interaction, correction, and feedback signal
- **Domain Expertise:** Agents trained on proprietary data, patterns, and institutional knowledge that no external model possesses
- **Cloud Augmentation:** Claude, Codex, and Gemini serve as teachers and fallbacks, not runtime dependencies
- **Microservice Scalability:** Spring Cloud architecture enables independent scaling, deployment, and evolution of each agent

### 1.4 Target Users

- **End Users:** Internal employees interacting with agents for data analysis, customer support, code review, and domain-specific tasks
- **Domain Experts:** Business analysts and subject matter experts who inject patterns, rules, and learning materials
- **ML Engineers:** Team members managing the training pipeline, model evaluation, and deployment
- **Platform Administrators:** DevOps and infrastructure teams managing the Spring Cloud deployment

---

## 2. Architecture Overview

### 2.1 Platform Layers

```
┌─────────────────────────────────────────────────────────────────────┐
│                        API Gateway (Spring Cloud Gateway)           │
├─────────────────────────────────────────────────────────────────────┤
│                     Agent Orchestrator Service                      │
│              (Routes tasks, coordinates multi-agent flows)          │
├──────────┬──────────┬──────────┬──────────┬────────────────────────┤
│  Agent:  │  Agent:  │  Agent:  │  Agent:  │   Additional Agents    │
│  Data    │ Customer │  Code    │ Document │   (Pluggable)          │
│ Analyst  │ Support  │ Reviewer │ Processor│                        │
├──────────┴──────────┴──────────┴──────────┴────────────────────────┤
│                      Agent Common Library                           │
│        (Base agent, ReAct loop, tools, memory, tracing)            │
├──────────────────────┬──────────────────────────────────────────────┤
│     RAG Module       │        Model Integration Layer               │
│  (Retrieval at       │   Orchestrator (~8B) │ Worker (~24B)         │
│   Orchestrator)      │   Ollama             │ Ollama                │
│                      │   Claude/Codex/Gemini (Teacher/Fallback)    │
├──────────────────────┴──────────────────────────────────────────────┤
│                    Validation Layer                                 │
│    (Backend rules, test suites, approval workflows)                │
├─────────────────────────────────────────────────────────────────────┤
│                    Learning Pipeline Services                       │
│  Trace Collector │ Teacher Service │ Training Orchestrator          │
│  Feedback Ingestion │ Data Preparation │ Model Evaluation           │
├─────────────────────────────────────────────────────────────────────┤
│                   Data & Knowledge Layer                            │
│  Vector Store │ Pattern Store │ Feedback DB │ Document Store        │
├─────────────────────────────────────────────────────────────────────┤
│               Tenant Isolation Boundary                             │
│          (Namespaced context, scoped skills, isolated concurrency)  │
├─────────────────────────────────────────────────────────────────────┤
│                  Spring Cloud Infrastructure                        │
│  Eureka │ Config Server │ Kafka │ Circuit Breakers │ Observability  │
└─────────────────────────────────────────────────────────────────────┘
```

### 2.2 Spring Cloud Components

| Component | Technology | Purpose |
|-----------|-----------|---------|
| Service Discovery | Eureka | Agent registration and discovery |
| Configuration | Spring Cloud Config | Centralized agent and model config |
| API Gateway | Spring Cloud Gateway | Unified entry point, routing, auth |
| Messaging | Apache Kafka | Inter-agent communication, trace collection |
| Circuit Breaking | Resilience4j | Graceful fallback when models/services are down |
| Observability | Micrometer + OpenTelemetry | Token usage, latency, error monitoring |
| Security | Spring Security + OAuth2 | API authentication and authorization |

### 2.3 Model Integration via Spring AI

The platform uses Spring AI's unified `ChatClient` abstraction to interact with all model providers through a single API. Model routing logic determines when to use local Ollama models versus cloud models based on task complexity, confidence thresholds, and cost considerations.

### 2.4 Two-Model Local Strategy

Rather than running all agents on a single Ollama model, the platform employs a **two-model architecture** for local inference:

#### 2.4.1 Orchestrator Model (Small, ~8B parameters)
- **Role:** Handles routing, context retrieval, planning, and business explanation
- **Characteristics:** Lower computational overhead, optimized for decision-making and synthesis
- **Execution Profile:** Conservative temperature settings, smaller default context window to maximize throughput
- **Responsibilities:** Request classification, RAG trigger determination, agent/skill selection, response explanation generation

#### 2.4.2 Worker Model (Large, ~24B parameters)
- **Role:** Handles execution—code changes, data analysis, document processing, test-fix loops
- **Characteristics:** Higher computational capacity for complex reasoning and multi-step tasks
- **Execution Profile:** Tighter concurrency controls to manage resource usage; higher temperature when task-appropriate
- **Responsibilities:** Primary task execution through ReAct loops, tool orchestration, detailed technical output generation

#### 2.4.3 Model Agnostic Design
- The platform does not lock users to specific models (e.g., Mistral). Organizations choose which Ollama-compatible models fill the Orchestrator and Worker roles
- **~30+ agent profiles** run on top of just **2 base models**, eliminating the need for separate 30-model deployments
- Each model receives a tailored configuration including system prompts, context window settings, tool access, and concurrency limits
- **Cloud fallback:** Claude, Codex, and Gemini remain available as teachers and high-complexity fallbacks above both local models

---

## 3. Agent System

### 3.1 Seven-Step Request Pipeline

Every request flows through a formally structured 7-step pipeline that ensures reliability, governance, and explainability:

#### Step 1: Intake
- **Input:** HTTP request via API Gateway with tenant context and authorization
- **Processing:** Request classification (task type, complexity estimate), normalization (extract parameters, resolve references), security validation
- **Output:** Normalized request object with tenant scope, classified task type, raw input parameters

#### Step 2: Retrieve
- **Trigger:** Orchestrator model receives normalized request
- **Processing:** Orchestrator determines if retrieval is needed based on task classification; triggers RAG queries for tenant-safe context
- **RAG Sources:** User stories, process docs, acceptance criteria, API docs, architecture notes, test history, skill documents (note: source code is accessed via tools, not RAG)
- **Output:** Context packet (grounded documents, relevant patterns, scoped knowledge) passed to Worker model

#### Step 3: Plan
- **Input:** Request + Retrieve context
- **Processing:** Orchestrator selects appropriate agent profile/skill (static or dynamic assignment); produces a structured execution plan with: agent/skill choice, tool sequence, expected inputs/outputs, success criteria
- **Output:** Execution plan JSON (agent name, skill name, planned steps, approval requirements if applicable)

#### Step 4: Execute
- **Input:** Execution plan
- **Processing:** **Worker Model** performs the actual task via ReAct loop:
  - Alternating Reasoning and Acting steps with observations
  - Tool calls with configurable timeouts and retries
  - Self-reflection for internal quality checking (model-driven critique)
  - Artifact generation (code, queries, documents, etc.)
- **Tool Access:** Worker model uses tools from agent's skill definition (internal tools, external tools, computation, observation, etc.)
- **Output:** Execution trace (reasoning steps, tool calls + responses, artifacts, termination reason)

#### Step 5: Validate
- **Input:** Execution artifacts and tool call history
- **Processing:** **Deterministic validation** (non-model, code-based checks):
  - Backend rules engine: validates output against configurable rules (path scope restrictions, data access limits, format requirements, PII redaction)
  - Test suites: execute unit/integration tests against generated code
  - Approval workflows: for high-impact actions (deletes, data exports, system changes), trigger human approval
  - Path-scope checks: ensure file/database operations stay within approved boundaries
- **Retry Logic:** Validation failures route back to Execute step with corrective feedback
- **Output:** Validation report (pass/fail, issues found, auto-fixes applied, approvals pending)

#### Step 6: Explain
- **Input:** Execution trace + validation report
- **Processing:** **Orchestrator Model** generates a dual-audience explanation:
  - **Business-readable summary:** What was done, why it matters, key results (for managers/non-technical stakeholders)
  - **Technical detail:** Step-by-step reasoning, tool calls made, code generated, assumptions (for engineers/developers)
  - **Artifact listing:** Files changed, queries run, tools invoked, external services called
- **Output:** Structured explanation object (summary, details, artifact list)

#### Step 7: Record
- **Input:** All artifacts from steps 1-6
- **Processing:** Complete request trace logged to distributed trace system:
  - Request classification and tenant context
  - Retrieved context and knowledge
  - Execution plan and actual execution steps
  - Tool calls and responses (timestamps, arguments, latencies)
  - Validation results and any corrections
  - Final response and explanation
  - Approval records if applicable
- **Storage:** Logs stored in trace database for learning pipeline consumption, audit, observability
- **Output:** Trace ID returned for correlation and debugging

---

### 3.2 Agent Architecture

Each agent is a Spring Boot microservice that extends a common `BaseAgent` framework providing:

- **ReAct Loop:** Reasoning + Acting cycle with configurable max turns (used in Execute step)
- **Tool Registry:** Dynamic tool binding per agent skill set
- **Memory Management:** Short-term (conversation) and long-term (vector store) memory
- **Self-Reflection:** Optional verification pass after generating responses (model-driven, part of Execute step)
- **Trace Logging:** Automatic capture of all interactions for the learning pipeline
- **Model Routing:** Intelligent escalation from Ollama Worker to cloud models for complex tasks

### 3.3 Initial Agent Types

| Agent | Domain | Key Tools | Primary Model |
|-------|--------|-----------|---------------|
| Data Analyst | SQL queries, data visualization, trend analysis | run_sql, create_chart, summarize_table | Ollama (Llama 3.1) |
| Customer Support | Ticket management, knowledge base search | search_tickets, search_kb, create_ticket | Ollama (Llama 3.1) |
| Code Reviewer | Code analysis, security scanning, PR reviews | analyze_code, run_linter, check_security | Ollama (CodeLlama) |
| Document Processor | Document parsing, summarization, extraction | parse_document, summarize, extract_entities | Ollama (Llama 3.1) |
| Orchestrator | Task routing, multi-agent coordination | route_task, coordinate_agents, aggregate_results | Ollama Orchestrator (local ~8B role) |

Cloud escalation is fallback, not primary orchestrator runtime.

### 3.4 Tool System

Tools are the actions an agent can take in the world. They are the bridge between reasoning and execution. The platform supports a comprehensive, layered tool architecture.

#### 3.4.1 Tool Categories

| Category | Description | Examples |
|----------|-------------|---------|
| **Internal Tools** | Access organizational systems and databases | `run_sql`, `call_internal_api`, `read_file`, `write_file` |
| **External Tools** | Integrate with third-party services | `search_jira`, `send_slack`, `create_email`, `query_salesforce` |
| **Agent Tools** | One agent invokes another agent as a tool | `ask_data_analyst`, `ask_code_reviewer`, `ask_compliance_agent` |
| **Knowledge Tools** | Query and update knowledge stores | `search_vector_db`, `search_knowledge_base`, `lookup_pattern` |
| **Computation Tools** | Perform calculations and transformations | `calculate`, `transform_data`, `generate_chart`, `run_script` |
| **Observation Tools** | Gather information without side effects | `get_current_time`, `check_system_status`, `read_config` |
| **Custom Tools** | User-defined tools injected at runtime via API | Dynamically registered, domain-specific |

#### 3.4.2 Tool Lifecycle

- **Registration:** Tools are registered as Spring beans with `@Description` annotations providing JSON schema for parameters and return types
- **Discovery:** Each agent declares its skill set; the tool registry resolves available tools dynamically at runtime
- **Execution:** Tools execute with configurable timeouts, retries, and circuit-breaking
- **Chaining:** Agents can chain multiple tool calls in sequence, using output from one as input to the next
- **Versioning:** Tools are versioned; agents can pin to specific tool versions for stability
- **Monitoring:** Every tool call is traced (name, arguments, response, latency, success/failure)

#### 3.4.3 Tool Composition Patterns

- **Sequential Chaining:** Agent calls tool A, uses result to call tool B (e.g., search → analyze → summarize)
- **Parallel Fan-Out:** Agent calls multiple tools simultaneously and aggregates results (e.g., search 3 databases concurrently)
- **Conditional Branching:** Agent decides which tool to call based on intermediate results
- **Agent-as-Tool:** An agent delegates a sub-task to another specialist agent (e.g., orchestrator asks data analyst to run a query)
- **Human-in-the-Loop:** Tool requires human approval before executing (e.g., sending an email, making a purchase)

#### 3.4.4 Dynamic Tool Creation

Domain experts and developers can create new tools without redeploying agents:

- **REST API registration:** Define a new tool via API with name, description, parameter schema, and endpoint
- **Webhook tools:** Wrap any webhook as an agent tool with automatic schema generation
- **Script tools:** Upload a Python or shell script that becomes an executable tool
- **Composite tools:** Combine existing tools into a new higher-level tool (e.g., "full_customer_report" = search_tickets + search_orders + summarize)

### 3.5 Skills Framework

Skills are the "expertise packages" that define what an agent knows and can do. A skill is a higher-level abstraction above tools — it combines a system prompt, a set of tools, a knowledge scope, and behavioral rules into a reusable, versionable unit.

#### 3.5.1 Skill Definition

| Component | Description | Example |
|-----------|-------------|---------|
| **Name** | Unique identifier | `data-analysis-v2` |
| **System Prompt** | Instructions that shape agent behavior for this skill | "You are a data analyst. Always explain your SQL before running it." |
| **Tool Set** | Which tools are available when this skill is active | `[run_sql, create_chart, summarize_table]` |
| **Knowledge Scope** | Which vector store collections / documents are relevant | `[data_warehouse_docs, sql_best_practices, company_metrics]` |
| **Behavioral Rules** | Guardrails and constraints | "Never run DELETE/DROP queries. Always confirm before queries that return >10K rows." |
| **Examples** | Few-shot examples of ideal behavior | Input/output pairs demonstrating correct tool use and response format |
| **Version** | Semantic version for tracking changes | `2.1.0` |

#### 3.5.2 Skill Assignment

- **Static Assignment:** An agent is configured with a fixed set of skills at deployment time
- **Dynamic Assignment:** The orchestrator can activate/deactivate skills per request based on task classification
- **Skill Stacking:** An agent can combine multiple skills for complex tasks (e.g., data-analysis + report-writing)
- **Skill Inheritance:** New skills can extend existing ones, adding tools or modifying prompts

#### 3.5.3 Skill Lifecycle

- **Creation:** Domain experts define skills via admin dashboard or API (prompt + tool set + knowledge scope + rules + examples)
- **Testing:** Skills are evaluated against a test suite before deployment
- **Deployment:** Skills are versioned and stored in the config server; agents pull active skill versions at startup
- **Monitoring:** Per-skill quality metrics track effectiveness over time
- **Improvement:** Skills are refined based on user feedback, trace analysis, and learning pipeline outputs
- **Retirement:** Deprecated skills are phased out with migration paths

#### 3.5.4 Skill Examples

| Skill | System Prompt (Summary) | Tools | Knowledge Scope |
|-------|------------------------|-------|----------------|
| `data-analysis` | SQL expert, explains queries, creates visualizations | run_sql, create_chart, list_tables | Data warehouse docs, metrics glossary |
| `ticket-resolution` | Resolves customer issues using KB and historical tickets | search_tickets, search_kb, create_ticket | KB articles, resolution playbooks |
| `code-security-review` | Identifies OWASP vulnerabilities, suggests fixes | analyze_code, check_security, suggest_fix | OWASP guidelines, company security policy |
| `document-summarization` | Extracts key points, creates executive summaries | parse_document, extract_entities, summarize | Document templates, style guide |
| `compliance-check` | Validates documents against regulatory requirements | parse_document, lookup_regulation, flag_violation | Regulatory database, compliance SOPs |
| `onboarding-assistant` | Guides new employees through onboarding tasks | search_kb, check_task_status, send_notification | Onboarding checklists, company wiki |

### 3.6 Validation Layer

The validation layer is a **deterministic, code-based verification system** that executes AFTER the Worker model completes task execution and BEFORE the response is returned to the user. This is separate from model self-reflection (which occurs during the Execute step).

#### 3.6.1 Validation Components

**Backend Rules Engine:**
- Configurable rule sets per skill and agent (defined by domain experts)
- Output validation against: path scope restrictions, data access limits, format requirements, field mappings, PII redaction rules
- Real-time rule evaluation with detailed failure reasons
- Examples: "SQL queries must only access approved table lists," "Generated code must not contain system calls," "Responses must include citations for external data"

**Test Suite Execution:**
- Unit and integration tests automatically executed against generated code, queries, documents
- Tests run in sandbox environments before deployment
- Failures block response delivery; issues route back to Execute step

**Approval Workflows:**
- For high-impact actions (data deletion, system changes, large exports), trigger synchronous or asynchronous human approval
- Approval status checked before final response delivery
- Approval records logged to trace system

**Path-Scope Checks:**
- Verify all file operations stay within approved directory boundaries
- Verify database operations target only authorized tables/schemas
- Prevent accidental or malicious access to restricted resources

#### 3.6.2 Validation Failures

- Validation failures are not treated as model errors—instead, failures generate corrective feedback
- Corrective feedback loops back to the Execute step: Worker model receives validation results and failure reasons, then re-attempts with additional constraints
- Adaptive retry policy: default 2 retry loops, with per-skill override up to 3 based on risk profile
- Successful validations allow response to proceed to Explain step

---

### 3.7 Explanation Generation

Every response includes a structured explanation generated by the **Orchestrator Model** (using information from the execution trace and validation report). Explanations serve two audiences:

#### 3.7.1 Business-Readable Summary
- Concise overview of what was done and why (for managers, stakeholders, non-technical users)
- Key results and impact statement
- Risk assessment if applicable (e.g., "This change affects 500 customer records")
- Estimated cost/savings/effort

#### 3.7.2 Technical Details
- Step-by-step reasoning and decision logic
- Tool calls made and their responses (with latencies and errors if any)
- Assumptions and constraints
- Edge cases encountered and how they were handled
- Code/query/output samples

#### 3.7.3 Artifact Listing
- Files created/modified with line counts and change summary
- Queries executed with record counts and execution time
- Tools invoked with argument/result pairs
- External services called (API, database, etc.)

---

### 3.8 Reasoning Depth Enhancement

The platform implements multiple strategies to maximize agent reasoning quality:

- **Chain-of-Thought Prompting:** System prompts that enforce step-by-step reasoning
- **ReAct Pattern:** Alternating reasoning and action steps with observation
- **Self-Reflection:** Post-response critique and revision loop
- **Multi-Agent Debate:** Multiple agent instances evaluating each other's reasoning
- **Tree-of-Thought:** Branching exploration for complex decisions
- **Scratchpad Memory:** Persistent working memory across reasoning steps

---

## 4. Multi-Source Learning Pipeline

### 4.1 Data Sources

The learning pipeline ingests training signals from six categories of data:

#### 4.1.1 Proprietary Organizational Data

- Internal databases, documents, and API responses
- Historical records and transaction data
- Domain-specific datasets unique to the organization
- **Usage:** RAG knowledge base, SFT examples, domain grounding

#### 4.1.2 Business Patterns and Rules

- Standard Operating Procedures (SOPs)
- Decision trees and workflow definitions
- Business rules and compliance requirements
- Expert-defined "when X, do Y" patterns
- **Usage:** SFT training examples, system prompt enhancement, guardrails

#### 4.1.3 Customer Feedback

- Support ticket outcomes (resolved/unresolved)
- Customer satisfaction scores (CSAT, NPS)
- Complaints and feature requests
- Chat ratings and post-interaction surveys
- **Usage:** DPO preference pairs, quality signals, weak area identification

#### 4.1.4 User Feedback (Internal)

- Thumbs up/down ratings on agent responses
- Explicit corrections ("the answer should have been X")
- Usage patterns and abandonment signals
- Domain expert annotations and reviews
- **Usage:** Gold-standard SFT examples (corrections), DPO pairs (ratings), active learning triggers

#### 4.1.5 Learning Materials and RAG Sources

- Training manuals and onboarding documentation
- Knowledge base articles and FAQs
- Expert recordings and transcripts
- Industry publications and reference materials
- Process documentation (SOPs, workflows, decision trees)
- Acceptance criteria and requirements documents
- API documentation and schema definitions
- Architecture notes and technical specifications
- Test history and quality reports
- Skill definitions and behavioral guidelines
- **Usage:** RAG vector store (real-time inference), Q&A pair generation for SFT, knowledge grounding
- **RAG Positioning Note:** RAG sits at the **Orchestrator level** (Retrieve step). The Orchestrator model decides when retrieval is needed based on task classification, fetches tenant-safe material from the vector store, and passes a smaller, grounded context packet to the Worker model for execution. **Source code is NOT a primary RAG use case**—code is accessed through repo search/read tools in the Execute step.

#### 4.1.6 Teacher Model Outputs

- Claude, Codex, and Gemini generated training examples
- Teacher model evaluations of local agent outputs
- Synthetic scenario generation for data augmentation
- Gap-filling examples for identified weak areas
- **Usage:** SFT augmentation, evaluation baselines, preference pair generation

### 4.2 Complete Learning Methods Matrix

The platform implements 13 learning methods, each addressing a different dimension of agent capability. These methods are not alternatives — they are complementary layers that work together.

#### Tier 1: Core Training Methods (Always Active)

| # | Method | Data Sources | Purpose | Frequency | Phase |
|---|--------|-------------|---------|-----------|-------|
| 1 | **Supervised Fine-Tuning (SFT)** | User corrections, patterns, teacher examples, learning materials | Teach correct agent behavior from demonstrations | Daily | 3 |
| 2 | **Direct Preference Optimization (DPO)** | Thumbs up/down, customer satisfaction, teacher preference pairs | Refine quality judgment — learn "better vs worse" | Daily | 3 |
| 3 | **RAG (Retrieval-Augmented Generation)** | Learning materials, documents, SOPs, knowledge base | Keep knowledge current without retraining the model | Real-time | 3 |
| 4 | **Knowledge Distillation** | Claude, Codex, Gemini teacher outputs | Transfer advanced reasoning from large cloud models to local Ollama models | Weekly | 3 |

#### Tier 2: Optimization Methods (Progressive Enhancement)

| # | Method | Data Sources | Purpose | Frequency | Phase |
|---|--------|-------------|---------|-----------|-------|
| 5 | **Active Learning** | Low-confidence traces, error patterns, edge cases | Identify where agents are weakest and target data collection there | Continuous | 4 |
| 6 | **Curriculum Learning** | All sources, ordered by difficulty | Train progressively from simple → complex tasks for better generalization | Weekly | 4 |
| 7 | **Reinforcement Learning (RLHF)** | Human ratings, reward model scores, outcome signals | Optimize agent behavior through reward signals rather than demonstrations | Weekly | 4 |
| 8 | **Self-Supervised Pre-training** | Domain-specific text corpora (internal docs, emails, reports) | Adapt the base model to understand domain-specific language and jargon | Monthly | 4 |

#### Tier 3: Advanced Methods (Specialized Capabilities)

| # | Method | Data Sources | Purpose | Frequency | Phase |
|---|--------|-------------|---------|-----------|-------|
| 9 | **Semi-Supervised Learning** | Small labeled set + large unlabeled internal data | Leverage abundant unlabeled data when labeled examples are scarce | Monthly | 5 |
| 10 | **Few-Shot / Zero-Shot Learning** | Skill definitions with examples, prompt templates | Enable agents to handle new task types without retraining by using in-context examples | Real-time | 2 |
| 11 | **Meta-Learning ("Learn to Learn")** | Cross-task training data, multi-domain examples | Train agents to rapidly adapt to entirely new tasks or domains with minimal examples | Monthly | 5 |
| 12 | **Contrastive Learning** | Positive/negative example pairs, similar/dissimilar documents | Learn robust representations for better retrieval, classification, and similarity detection | Weekly | 4 |
| 13 | **Federated Learning** | Distributed data across departments/divisions (no centralization) | Train on sensitive data that cannot leave its source location (e.g., cross-department learning without sharing raw data) | Monthly | 5 |

#### Learning Method Interaction Map

The methods reinforce each other in a continuous cycle:

```
Self-Supervised Pre-training (foundation)
    └─→ SFT (teach specific behaviors)
         └─→ DPO / RLHF (refine judgment and quality)
              └─→ Active Learning (identify gaps)
                   └─→ Curriculum Learning (structured improvement)
                        └─→ Knowledge Distillation (transfer from teachers)
                             └─→ Contrastive Learning (better representations)
                                  └─→ Meta-Learning (adapt to new domains)

RAG ←──── runs in parallel, always active, updated by all other methods
Few-Shot ←── runs at inference time, uses skill definitions
Semi-Supervised ←── amplifies labeled data with unlabeled data
Federated ←── enables cross-boundary learning without data sharing
```

### 4.3 Feedback Ingestion

The platform provides multiple channels for injecting training signals:

- **REST API:** Programmatic submission of ratings, corrections, patterns, and materials
- **Kafka Topics:** Event-driven ingestion from external systems (CRM, support platforms, etc.)
- **Admin Dashboard:** UI for domain experts to add patterns, review traces, and annotate data
- **Webhook Integration:** Automatic ingestion from third-party feedback systems

### 4.4 Training Orchestration

- **Real-time:** User corrections immediately update RAG and queue for next fine-tuning batch
- **Daily (2:00 AM):** Batch retraining on accumulated feedback with recency weighting
- **Weekly (Sunday 4:00 AM):** Deep training cycle with teacher augmentation and curriculum learning
- **Monthly:** Full model evaluation and potential base model upgrade
- **On-demand:** Triggered retraining when quality metrics drop below threshold

### 4.5 Data Priority Weighting

1. **User corrections** (highest) — explicit ground truth
2. **Customer feedback with outcomes** — real-world impact signal
3. **Business patterns and SOPs** — expert-encoded knowledge
4. **Positively-rated agent traces** — validated good behavior
5. **Learning materials** — institutional knowledge
6. **Teacher model synthetic data** (lowest) — generic augmentation

---

## 5. Model Management

### 5.1 Local Models (Ollama)

- Primary runtime models for all agents
- Models include Llama 3.1 (general), CodeLlama (code), and specialized fine-tuned variants
- Model versioning with rollback capability
- A/B testing infrastructure for comparing model versions

### 5.2 Cloud Models (Teacher/Fallback)

- **Claude:** Primary teacher model, complex reasoning fallback, evaluation judge
- **Codex/OpenAI:** Code generation teacher, alternative perspective generation
- **Gemini:** Multi-modal tasks, alternative teacher for diversity
- Cloud models are not runtime dependencies — agents function fully on Ollama

### 5.3 Model Evaluation

Before deploying any retrained model:

- Automated benchmark suite against held-out test set
- Comparison against current production model
- Quality gate: new model must exceed current model on key metrics
- Shadow deployment period before full rollout
- Automatic rollback if production quality degrades

---

## 6. Observability and Monitoring

### 6.1 Agent Metrics

- Response latency (P50, P95, P99)
- Tool call success/failure rates
- Model routing decisions (local vs. cloud)
- Token usage per agent per model
- Conversation completion rates

### 6.2 Learning Pipeline Metrics

- Training data volume by source
- Model quality scores over time
- Feedback ingestion rates
- Active learning trigger frequency
- Training job success/failure rates

### 6.3 Business Metrics

- User satisfaction scores (from feedback)
- Customer outcome improvements
- Cost per interaction (local vs. cloud)
- Agent adoption rates
- Time saved per task

---

## 7. Security, Privacy, and Multi-Tenancy

### 7.1 Data Sovereignty and Privacy

- All local model inference stays on-premise
- Cloud model calls are opt-in and configurable per agent
- PII detection and redaction in training data
- Role-based access control for admin operations
- Audit logging for all model deployments and data access
- Encryption at rest and in transit for all data stores

### 7.2 Multi-Tenancy and Context Isolation

**Tenant-Safe Context Isolation:**
- Each tenant's data is namespaced independently in vector stores, knowledge bases, and retrieval indexes
- Retrieval queries automatically filtered by tenant context to prevent cross-tenant data leakage
- Vector store partitioning strategy ensures tenant A's documents never appear in Retrieve results for tenant B

**Agent Profile Scoping:**
- Agent profiles are tenant-scoped; each tenant sees only their own profiles and skills
- Skills created by one tenant are not visible to other tenants
- Tool registry per-tenant (some tools may be shared, others isolated)

**Context Window Management:**
- Context windows are managed per-tenant to prevent cross-contamination
- Conversation history isolated by tenant and user
- Memory stores (short-term and long-term) segregated by tenant namespace

**Concurrency Controls:**
- Parallel model invocations limited per-tenant to prevent resource exhaustion
- Orchestrator model concurrency limits (e.g., max 10 concurrent Plan steps per tenant)
- Worker model concurrency limits (e.g., max 5 concurrent Execute steps per tenant)
- Fair-share scheduling across tenants to prevent one tenant monopolizing compute

---

## 8. Roadmap

### Phase 1: Foundation (Weeks 1-6)

- Spring Cloud infrastructure setup (Eureka, Config, Gateway, Kafka)
- Base agent framework with ReAct loop (Execute step)
- Core tool registry and execution engine (internal tools, knowledge tools)
- Basic skills framework (static skill assignment, system prompt + tool set)
- **Two-model local Ollama setup** (Orchestrator ~8B + Worker ~24B)
- Ollama integration via Spring AI with model-agnostic routing
- Single agent deployment (Data Analyst) with initial skill definition
- **Basic request pipeline** (Intake → Retrieve → Plan → Execute → Record)
- Basic trace logging
- **Few-Shot/Zero-Shot** prompting strategies in skill definitions

### Phase 2: Multi-Agent and Cloud Integration (Weeks 7-12)

- Additional specialist agents (Customer Support, Code Reviewer)
- Orchestrator agent with dynamic skill routing
- Agent-as-tool pattern (agents calling other agents)
- Tool chaining and parallel fan-out support
- Claude and Codex integration for teacher pipeline and fallback
- Model routing logic (complexity-based escalation to cloud models)
- Feedback API (ratings, corrections)
- Skill versioning and configuration via Spring Cloud Config
- **Full 7-step pipeline** with Validate and Explain steps
- **RAG at Orchestrator level** with basic tenant namespacing in vector store
- **Few-Shot/Zero-Shot** in-context learning for handling new task types without retraining

### Phase 3: Core Learning Pipeline (Weeks 13-20)

- Training data service (unified multi-source ingestion from all 6 data sources)
- **SFT pipeline** with Ollama model reloading (user corrections, patterns, teacher examples)
- **DPO pipeline** for preference learning (user ratings, customer feedback, teacher pairs)
- **RAG system** with PGVector (learning materials, documents, SOPs — real-time updates)
- **Knowledge Distillation** from Claude/Codex/Gemini teacher models
- Pattern and learning material ingestion services
- Dynamic tool creation API (REST registration, webhook tools, script tools)
- Daily automated retraining with quality gates
- Skill test suites and quality metrics per skill

### Phase 4: Advanced Learning and Optimization (Weeks 21-28)

- **Active Learning** for targeted data collection (low-confidence flagging, gap analysis)
- **Curriculum Learning** for progressive training (simple → complex task ordering)
- **RLHF** with reward model for agent behavior optimization
- **Self-Supervised Pre-training** on domain-specific corpora
- **Contrastive Learning** for improved embeddings and retrieval quality
- Model evaluation and A/B testing framework
- Admin dashboard for domain experts (pattern injection, trace review, skill management)
- Multi-agent debate for reasoning depth
- Composite tool creation (combining existing tools into higher-level actions)
- Skill stacking and inheritance

### Phase 5: Production Hardening and Advanced Methods (Weeks 29-40)

- **Semi-Supervised Learning** leveraging abundant unlabeled internal data
- **Meta-Learning** for rapid adaptation to new domains and task types
- **Federated Learning** for cross-department training without data sharing
- **Multi-tenant isolation and concurrency controls** (context window management, per-tenant rate limiting, fair-share scheduling)
- Human-in-the-loop tool approval workflows
- Comprehensive observability and alerting (per-tool, per-skill, per-agent metrics, tenant-specific dashboards)
- Security audit, PII handling, and compliance validation
- Performance optimization and load testing
- Skill marketplace (teams can publish and share skills across the organization)
- Documentation and runbooks
- User onboarding and training
- Production deployment

---

## 9. Success Criteria

- Agents resolve 70%+ of tasks without cloud model escalation
- User satisfaction rating above 4.0/5.0
- Monthly improvement in agent quality metrics from continuous learning
- Sub-2-second response latency for Ollama-powered interactions
- 99.9% platform availability
- Positive ROI within 6 months of production deployment
- **All agent responses include business-readable explanations** (Explain step generates clear, actionable summaries for all response types)
- **Deterministic validation catches 95%+ of unsafe outputs** before delivery to users (Validate step prevents harmful or non-compliant outputs from being returned)

---

## 10. Open Questions and Risks

- **Model selection:** Which Ollama base models perform best for each agent type? Requires benchmarking.
- **Two-model sizing:** Optimal orchestrator vs worker model sizes for different hardware profiles (CPU only vs GPU acceleration). When does 8B/24B split require adjustment?
- **Fine-tuning infrastructure:** GPU requirements for daily retraining at scale
- **Teacher model costs:** Budget for Claude/Codex API usage during training and evaluation
- **Data quality:** Ensuring feedback signals are clean and representative
- **Compliance:** Verify teacher model ToS permits training local models on their outputs
- **Latency:** Multi-step 7-step pipeline may increase overall latency compared to direct model inference. Optimization needed for real-time use cases.
- **Validation overhead:** Deterministic validation layer adds processing time. Balance between safety (comprehensive checks) and speed (minimal overhead).
- **Tenant isolation:** Namespace strategy for vector store partitioning at scale (1000+ tenants). How to efficiently query tenant-scoped context without performance degradation.
- **Explanation quality:** Orchestrator-generated explanations must be accurate and concise. Requires tuning prompts and potentially using teacher models for quality feedback.

---

## 11. PDF Coverage and Extension Matrix

### 11.1 PDF to Documentation Traceability

| PDF Architecture Concept | Coverage in This Baseline |
|---|---|
| Two-model local split (Orchestrator + Worker) | Section 2.4, Section 3.1 (Plan/Execute), Section 8 (roadmap) |
| Formal 7-step request pipeline | Section 3.1 |
| RAG at orchestrator level | Section 3.1 Step 2, Section 4.1.5 RAG Positioning Note |
| Deterministic validation (rules/tests/approval) | Section 3.1 Step 5, Section 3.6 |
| Explain step (business + technical + artifacts) | Section 3.1 Step 6, Section 3.7 |
| Record/audit artifacts and approvals | Section 3.1 Step 7, Section 6 |
| Tenant-safe context isolation | Section 7.2 |

### 11.2 Beyond PDF Scope (Intentional Platform Extensions)

- 13-method learning architecture (Tier 1/2/3) in Section 4.2
- Dynamic/composite/agent-as-tool framework in Section 3.4
- Sprint-ready epic decomposition in companion stories document
- Git/Claude implementation workflow guidance in companion guide
