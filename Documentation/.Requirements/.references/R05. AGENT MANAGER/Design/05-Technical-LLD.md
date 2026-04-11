# Technical Low-Level Design: AI Agent Platform

**Document:** 05-Technical-LLD.md
**Version:** 1.9.0
**Date:** 2026-03-09
**Status:** [PLANNED] -- Design baseline; no code exists yet
**Author:** SA Agent + SEC Agent + DBA Agent + BA Agent
**Cross-References:** 01-PRD Section 2-3, 02-Tech-Spec Sections 2-9, 03-Epics US-1 through US-13, ADR-023 through ADR-030, BA Domain Model (super-agent-domain-model.md)

**Changelog:**

| Version | Date | Changes |
|---------|------|---------|
| 1.9.0 | 2026-03-09T22:00Z | SA Agent: Added 20 missing edge cases and exception handling specs (P0-P2 from elite team audit). P0: ChatRequest @Size(max=32000) validation with token budget calculation (4.2, 4.9.1 AI-MSG-001); conversation-level concurrency control via Valkey mutex (7.8, AI-CONV-001); embedding provider circuit breaker with Resilience4j config and retry queue (7.9, AI-EMB-001); schema creation failure compensation workflow with retry/provisioning state machine (6.13.6, AI-PROV-001); ethics engine fail-closed/fail-open with tenant-configurable mode and retroactive evaluation (6.14.8, AI-ETH-001). P1: RAG zero-chunk fallback with ragContextUsed metadata flag (7.13, AI-RAG-001); token limit exceeded truncation cascade preserving system prompt (7.10, AI-TKN-001); sub-orchestrator failure propagation with retry and failover logic (7.11, AI-ORCH-001); CDC event debounce with 5s Valkey coalescing window (3.24.1); agent-busy-when-triggered queueing with trigger_event_queue table and DLQ (3.23c, 3.24.2); SSE missed-event recovery with Last-Event-Id and sse_event_buffer table (6.10.1); Flyway migration failure recovery for tenant schemas (6.13.7, AI-PROV-002); knowledge source FAILED_EXTRACTION/FAILED_EMBEDDING refined lifecycle with retry API (3.13.1). P2: conversation deleted mid-stream graceful termination (7.12); agent name UNIQUE(name,tenant_id) constraint (4.15.2, AI-AGT-001); agent deletion cascade with orphan handling (4.15.3); ATS evaluation minimum data requirements per dimension (3.19.1); maturity level change cooldown 7d promotion/3d demotion (3.19.2); ATS NUMERIC(5,2) precision with HALF_UP rounding and inclusive boundaries (3.19.3); benchmark outlier detection with p5/p95 suppression (3.30.2). New tables: trigger_event_queue (3.23c), embedding_retry_queue (7.9), sse_event_buffer (6.10.1), outlier_thresholds (3.30.2). Updated ToC with all new subsections. |
| 1.8.0 | 2026-03-09T20:30Z | SA Agent: Added Section 4.15.1 HITL Escalation Chain [PLANNED] -- 4-level escalation flow (AGENT_DESIGNER -> TENANT_ADMIN -> PLATFORM_ADMIN -> auto-reject), configurable timeouts per risk level, hitl_escalation_config table, PUT /api/v1/ai/admin/hitl/escalation-config endpoint, Mermaid sequence diagram. Added Section 4.19.1 Cross-Tenant Error Codes [PLANNED] -- 10 error codes (AI-CT-001 through AI-CT-010) for cross-tenant operations from master tenant, covering 403/404/408/409/422/429/503 scenarios. Addresses Gaps 4 (MEDIUM) and 8 (MEDIUM) from superadmin gap analysis. |
| 1.7.0 | 2026-03-09T18:00Z | BA Agent: Added Section 3.11.1 PLATFORM_ADMIN Auditable Actions [PLANNED] -- 11 auditable admin action types with before/after state schemas, justification requirements, immutability guarantees, and partial index for admin audit queries. Added Section 3.30.1 Benchmark Opt-Out Data Handling [PLANNED] -- opt-out/re-opt-in lifecycle, consent window data flow (Mermaid sequence diagram), tenant_registry consent columns, cross-tenant aggregation query pattern respecting consent windows, PLATFORM_ADMIN visibility rules. Addresses Gaps 9 (LOW) and 10 (LOW) from superadmin gap analysis. |
| 1.6.0 | 2026-03-09T14:30Z | SA Agent: Final implementation-readiness pass -- all gaps closed, all cross-references verified, document fully complete. Added Super Agent API gateway security routes to Section 6.3; added 4 Super Agent Kafka topics (agent.events.entity_lifecycle, agent.events.scheduled, agent.audit, ethics.policy.updated) with full message schemas, consumer groups, and DLQ config to Sections 5.2-5.5; corrected Section 6.13.1 tenant schema table names to match canonical LLD table names from Sections 3.16-3.35; added Appendices to Table of Contents; verified all cross-references (ADR-023 through ADR-030, arc42 sections, BA 35-entity traceability). Zero TODOs, zero TBDs, zero placeholders remaining. |
| 1.5.2 | 2026-03-09 | SA+DBA Wave 6 remediation: (GAP-DBA-004) Added risk_level to tool_registrations with CHECK constraint; (GAP-DBA-005) Added tool_authorizations table; (GAP-DBA-006) Added event_sources table (3.23b); (GAP-DBA-011) Added polymorphic FK strategy note for agent_maturity_scores; (GAP-DBA-012) Added worker_tasks table (3.20b); (GAP-DBA-022) Enhanced schema allocation contents for ai_shared, ai_benchmark, tenant_{uuid}; (GAP-DBA-025) Added tenant_registry table; (GAP-DBA-026) Changed inclusion_condition from string to jsonb; (GAP-DBA-027) Added TENANT_SCOPED to staleness_policy; (GAP-DBA-030) Fixed embedding dimension to 1536 (text-embedding-3-large); (GAP-DBA-031) Added schema_lifecycle_events table; (A-04) Fixed domain types to canonical EA/PERF/GRC/KM/SD; (A-05) Added max_concurrent_orchestrators, max_concurrent_workers, ethics_policy_id to super_agents; (QA-AC-001) Added Section 4.20 Export Endpoints; (QA-API-002) Added MATURITY_LEVEL_INSUFFICIENT error; (SEC-F01) Added STRIDE threat model (6.14.6); (SEC-F03) Added content safety technology note; (SEC-F05) Added HMAC context boundary rotation; (SEC-F06) Added PII detection technology note; (SEC-F08) Added decision_signature to APPROVAL_DECISIONS; (SEC-F09) Added EU AI Act Article 52 transparency (6.14.7); (SA-09) Added agent_skills (3.31), knowledge_items (3.32), skill_assessments (3.33), learning_records (3.34) tables and BA-to-LLD traceability matrix (3.35); updated ToC, index strategy, cross-reference matrix |
| 1.5.1 | 2026-03-08 | SA agent remediation: (SA-08) Corrected API path prefix from /api/v1/agents/, /api/v1/maturity/, /api/v1/drafts/, /api/v1/approvals/, /api/v1/events/, /api/v1/ethics/, /api/v1/benchmarks/ to canonical /api/v1/ai/ prefix in Sections 4.10-4.18 and sequence diagrams 7.5-7.7; (GAP-DBA-023) Replaced 6-database Super Agent allocation in Section 3.5 with single ai_db per ADR-026 (ai_shared, ai_benchmark, tenant_{uuid} schemas); (GAP-DBA-015) Replaced cross-database REFERENCES tenants(id) FK with application-enforced comments in Sections 3.11, 3.12, 3.13, 3.14; (SEC-F04) Fixed string concatenation in Section 6.13.2 schema selection with UUID validation and parameterized query; (MEDIUM) Fixed 5 index column references in Section 3.4 to match actual DDL columns: workers.maturity_level->capability_type, ats_score_history.dimension->measurement_period, prompt_blocks.active->status, event_triggers.enabled->status, policy_violations.resolved->resolution_status |
| 1.5.0 | 2026-03-08 | DBA agent: Added Section 3.29.1 Prompt Composition Algorithm and Seed Data [PLANNED] -- block composition algorithm (Mermaid flowchart + pseudo-code), token budget allocation per model (GPT-4o/Claude/Gemini/Llama), block priority weights with min/max tokens and trim strategies, overflow handling algorithm (Mermaid flowchart + worked examples), 16 seed data INSERT statements covering all 10 block types, Valkey cache strategy with invalidation events; cross-references ADR-029, Tech Spec 3.27, Doc 08 Sections 1.6-1.7 and 8 |
| 1.4.0 | 2026-03-08 | SA agent: Super Agent Platform data model and API contracts -- 15 new database tables (3.16-3.30) with Mermaid ER diagrams for agent hierarchy, maturity, sandbox, events, HITL, ethics, benchmarks, prompts, audit; 9 new API endpoint groups (4.10-4.18); 3 event-driven data flow sequence diagrams (7.5-7.7); updated ToC and cross-reference matrix; all tagged [PLANNED]; sourced from BA domain model (35 entities) and ADR-023 through ADR-030 |
| 1.3.0 | 2026-03-08 | SEC agent: Added Super Agent security sections -- Agent-Level Security Architecture (6.11), Agent-to-Agent Authentication (6.12), Cross-Tenant Data Boundary Enforcement (6.13), Ethics Policy Enforcement Pipeline (6.14), Prompt Injection Defense for Multi-Agent (6.15), PII Sanitization for Agent Pipeline (6.16). All new sections tagged [PLANNED]. References ADR-023 through ADR-030, Benchmarking Study Sections 9-10, BA domain model security entities. |
| 1.2.0 | 2026-03-07 | P0+P1 propagation: Added audit_events (3.11), agent_publish_submissions (3.12), knowledge_sources (3.13), notifications (3.14) tables; agent configuration lifecycle state diagram (3.15); updated index strategy (3.4), database-per-service allocation (3.5), cross-reference matrix |
| 1.1.0 | 2026-03-07 | Phase A: pipeline_runs (3.6), agent_artifacts (3.7), rag_search_log (3.8), rag_chunking_config (3.9), agent_templates (3.10) tables; security sections 6.7-6.10 |
| 1.0.0 | 2026-03-05 | Initial LLD baseline |

---

## Table of Contents

1. [Maven Multi-Project Configuration](#1-maven-multi-project-configuration)
2. [Application Configuration Files](#2-application-configuration-files)
3. [Database Schema Design](#3-database-schema-design)
   - 3.1 Entity Relationship Diagram
   - 3.2 PGVector Extension for Embedding Storage
   - 3.3 Flyway Migration Scripts
   - 3.4 Index Strategy Summary
   - 3.5 Database-per-Service Allocation
   - 3.6 Pipeline Run State Machine Table [PLANNED]
   - 3.7 Agent Artifacts Table [PLANNED]
   - 3.8 RAG Search Log Table [PLANNED]
   - 3.9 RAG Chunking Configuration Table [PLANNED]
   - 3.10 Agent Templates Table [PLANNED]
   - 3.11 Audit Events Table [PLANNED]
   - 3.11.1 PLATFORM_ADMIN Auditable Actions [PLANNED]
   - 3.12 Agent Publish Submissions Table [PLANNED]
   - 3.13 Knowledge Sources Table [PLANNED]
   - 3.13.1 Knowledge Source Error States and Retry [PLANNED]
   - 3.14 Notifications Table [PLANNED]
   - 3.15 Agent Configuration Lifecycle State Diagram [PLANNED]
   - 3.16 Super Agents Table [PLANNED]
   - 3.17 Sub-Orchestrators Table [PLANNED]
   - 3.18 Workers Table [PLANNED]
   - 3.19 Agent Maturity Scores Table [PLANNED]
   - 3.19.1 ATS Evaluation Minimum Data Requirements [PLANNED]
   - 3.19.2 Maturity Level Change Cooldown [PLANNED]
   - 3.19.3 ATS Score Precision and Boundary Rules [PLANNED]
   - 3.20 ATS Score History Table [PLANNED]
   - 3.20b Worker Tasks Table [PLANNED]
   - 3.21 Worker Drafts Table [PLANNED]
   - 3.22 Draft Reviews Table [PLANNED]
   - 3.23 Approval Checkpoints Table [PLANNED]
   - 3.23b Event Sources Table [PLANNED]
   - 3.23c Trigger Event Queue Table [PLANNED]
   - 3.24 Event Triggers Table [PLANNED]
   - 3.24.1 CDC Event Debounce Strategy [PLANNED]
   - 3.24.2 Agent Busy Fallback and Event Queuing [PLANNED]
   - 3.25 Event Schedules Table [PLANNED]
   - 3.26 Ethics Policies Table [PLANNED]
   - 3.27 Conduct Policies Table [PLANNED]
   - 3.28 Policy Violations Table [PLANNED]
   - 3.29 Prompt Blocks Table [PLANNED]
   - 3.29.1 Prompt Composition Algorithm and Seed Data [PLANNED]
   - 3.30 Benchmark Metrics Table [PLANNED]
   - 3.30.1 Benchmark Opt-Out Data Handling [PLANNED]
   - 3.30.2 Benchmark Outlier Detection [PLANNED]
   - 3.31 Agent Skills Table [PLANNED]
   - 3.32 Knowledge Items Table [PLANNED]
   - 3.33 Skill Assessments Table [PLANNED]
   - 3.34 Learning Records Table [PLANNED]
   - 3.35 BA-to-LLD Entity Traceability Matrix [PLANNED]
4. [API Contracts (OpenAPI 3.1)](#4-api-contracts-openapi-31)
   - 4.1 Common Schemas
   - 4.2 Agent Chat API
   - 4.3 Pipeline API
   - 4.4 Skill Management API
   - 4.5 Tool Management API
   - 4.6 Feedback API
   - 4.7 Training and Model Management API
   - 4.8 Tenant Management API
   - 4.9 Error Code Catalog
   - 4.9.1 Edge Case Error Codes (Elite Team Audit) [PLANNED]
   - 4.10 Super Agent Management API [PLANNED]
   - 4.11 Sub-Orchestrator API [PLANNED]
   - 4.12 Worker API [PLANNED]
   - 4.13 Agent Maturity API [PLANNED]
   - 4.14 Draft Sandbox API [PLANNED]
   - 4.15 Approval Checkpoints API [PLANNED]
   - 4.15.1 HITL Escalation Chain [PLANNED]
   - 4.15.2 Agent Name Uniqueness Constraint [PLANNED]
   - 4.15.3 Agent Deletion and Conversation Orphan Handling [PLANNED]
   - 4.16 Event Triggers API [PLANNED]
   - 4.17 Ethics and Conduct Policies API [PLANNED]
   - 4.18 Cross-Tenant Benchmarks API [PLANNED]
   - 4.19 Super Agent Error Codes [PLANNED]
   - 4.19.1 Cross-Tenant Error Codes [PLANNED]
   - 4.20 Export Endpoints [PLANNED]
5. [Inter-Service Communication](#5-inter-service-communication)
6. [Security Architecture](#6-security-architecture)
   - 6.1 JWT Token Validation Flow
   - 6.2 Tenant Context Extraction
   - 6.3 API Gateway Route Security Rules
   - 6.4 RBAC Role Definitions
   - 6.5 Service-to-Service Authentication
   - 6.6 Data Protection
   - 6.7 Prompt Injection Defense Architecture [PLANNED]
   - 6.8 Pre-Cloud Sanitization Pipeline [PLANNED]
   - 6.9 Data Retention Architecture [PLANNED]
   - 6.10 Redis Caching Strategy [PLANNED]
   - 6.10.1 SSE Event Replay and Missed-Event Recovery [PLANNED]
   - 6.11 Agent-Level Security Architecture [PLANNED]
   - 6.12 Agent-to-Agent Authentication [PLANNED]
   - 6.13 Cross-Tenant Data Boundary Enforcement [PLANNED]
   - 6.13.6 Schema Creation Failure and Provisioning Recovery [PLANNED]
   - 6.13.7 Flyway Migration Failure Recovery for Tenant Schemas [PLANNED]
   - 6.14 Ethics Policy Enforcement Pipeline [PLANNED]
   - 6.14.8 Ethics Engine Fail-Open vs Fail-Closed Decision [PLANNED]
   - 6.15 Prompt Injection Defense for Multi-Agent [PLANNED]
   - 6.16 PII Sanitization for Agent Pipeline [PLANNED]
7. [Data Flow Diagrams](#7-data-flow-diagrams)
   - 7.1 Seven-Step Request Pipeline
   - 7.2 Training Data Flow
   - 7.3 Feedback Loop
   - 7.4 Tenant Isolation in Vector Store Queries
   - 7.5 Event-Driven Agent Activation: Entity Change to Draft Commit [PLANNED]
   - 7.6 User Request Through Super Agent Hierarchy [PLANNED]
   - 7.7 Scheduled Trigger: Automated Periodic Execution [PLANNED]
   - 7.8 Conversation-Level Concurrency Control [PLANNED]
   - 7.9 Embedding Provider Circuit Breaker Flow [PLANNED]
   - 7.10 Token Limit Exceeded Truncation Cascade [PLANNED]
   - 7.11 Sub-Orchestrator Failure Propagation [PLANNED]
   - 7.12 Conversation Deleted Mid-Stream [PLANNED]
   - 7.13 RAG Zero-Chunk Fallback [PLANNED]
8. [Class Diagrams](#8-class-diagrams)
   - 8.1 BaseAgent Hierarchy
   - 8.2 Request Pipeline Components
   - 8.3 Skill and Tool System
   - 8.4 Validation Service Chain
   - 8.5 TraceLogger and AgentTrace
   - 8.6 Model Router
   - 8.7 Learning Pipeline Classes
- [Appendix A: Service Port Allocation](#appendix-a-service-port-allocation)
- [Appendix B: Technology Stack Summary](#appendix-b-technology-stack-summary)
- [Appendix C: Cross-Reference Matrix](#appendix-c-cross-reference-matrix)

---

## 1. Maven Multi-Project Configuration

**Status:** [PLANNED]
**Cross-Reference:** 02-Tech-Spec Section 2, 04-Git-Structure Section 1

The platform uses a Maven multi-module build with a parent POM providing centralized dependency management. The project structure follows the repository layout defined in the Git Structure guide, with four top-level module groups: `infrastructure`, `libraries`, `agents`, and `learning`.

### 1.1 Root POM (pom.xml)

```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0
         https://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>

    <parent>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-parent</artifactId>
        <version>3.4.1</version>
        <relativePath/>
    </parent>

    <groupId>com.emsist.ai</groupId>
    <artifactId>agent-platform</artifactId>
    <version>1.0.0-SNAPSHOT</version>
    <packaging>pom</packaging>
    <name>AI Agent Platform</name>
    <description>Multi-agent AI platform with local LLM inference and continuous learning</description>

    <modules>
        <!-- Infrastructure Services -->
        <module>infrastructure/eureka-server</module>
        <module>infrastructure/config-server</module>
        <module>infrastructure/api-gateway</module>

        <!-- Shared Libraries -->
        <module>libraries/agent-common</module>

        <!-- Agent Microservices -->
        <module>agents/agent-orchestrator</module>
        <module>agents/agent-data-analyst</module>
        <module>agents/agent-customer-support</module>
        <module>agents/agent-code-reviewer</module>
        <module>agents/agent-document-processor</module>

        <!-- Learning Pipeline Services -->
        <module>learning/trace-collector</module>
        <module>learning/feedback-service</module>
        <module>learning/teacher-service</module>
        <module>learning/training-data-service</module>
        <module>learning/training-orchestrator</module>
        <module>learning/model-evaluator</module>
    </modules>

    <properties>
        <!-- Java -->
        <java.version>21</java.version>
        <maven.compiler.source>21</maven.compiler.source>
        <maven.compiler.target>21</maven.compiler.target>
        <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>

        <!-- Spring -->
        <spring-boot.version>3.4.1</spring-boot.version>
        <spring-cloud.version>2024.0.0</spring-cloud.version>
        <spring-ai.version>1.0.0</spring-ai.version>

        <!-- Database -->
        <postgresql.version>42.7.4</postgresql.version>
        <flyway.version>10.21.0</flyway.version>
        <pgvector-java.version>0.1.6</pgvector-java.version>

        <!-- Messaging -->
        <kafka.version>3.7.1</kafka.version>

        <!-- Observability -->
        <micrometer.version>1.14.2</micrometer.version>
        <opentelemetry.version>1.44.1</opentelemetry.version>

        <!-- Utilities -->
        <lombok.version>1.18.34</lombok.version>
        <mapstruct.version>1.6.3</mapstruct.version>

        <!-- Testing -->
        <testcontainers.version>1.20.4</testcontainers.version>
        <archunit.version>1.3.0</archunit.version>
    </properties>

    <dependencyManagement>
        <dependencies>
            <!-- Spring Cloud BOM -->
            <dependency>
                <groupId>org.springframework.cloud</groupId>
                <artifactId>spring-cloud-dependencies</artifactId>
                <version>${spring-cloud.version}</version>
                <type>pom</type>
                <scope>import</scope>
            </dependency>

            <!-- Spring AI BOM -->
            <dependency>
                <groupId>org.springframework.ai</groupId>
                <artifactId>spring-ai-bom</artifactId>
                <version>${spring-ai.version}</version>
                <type>pom</type>
                <scope>import</scope>
            </dependency>

            <!-- Internal library -->
            <dependency>
                <groupId>com.emsist.ai</groupId>
                <artifactId>agent-common</artifactId>
                <version>${project.version}</version>
            </dependency>

            <!-- PGVector -->
            <dependency>
                <groupId>com.pgvector</groupId>
                <artifactId>pgvector</artifactId>
                <version>${pgvector-java.version}</version>
            </dependency>

            <!-- Testcontainers BOM -->
            <dependency>
                <groupId>org.testcontainers</groupId>
                <artifactId>testcontainers-bom</artifactId>
                <version>${testcontainers.version}</version>
                <type>pom</type>
                <scope>import</scope>
            </dependency>
        </dependencies>
    </dependencyManagement>

    <!-- Common dependencies for ALL modules -->
    <dependencies>
        <dependency>
            <groupId>org.projectlombok</groupId>
            <artifactId>lombok</artifactId>
            <optional>true</optional>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-test</artifactId>
            <scope>test</scope>
        </dependency>
    </dependencies>

    <build>
        <pluginManagement>
            <plugins>
                <plugin>
                    <groupId>org.springframework.boot</groupId>
                    <artifactId>spring-boot-maven-plugin</artifactId>
                    <configuration>
                        <excludes>
                            <exclude>
                                <groupId>org.projectlombok</groupId>
                                <artifactId>lombok</artifactId>
                            </exclude>
                        </excludes>
                        <image>
                            <name>emsist/${project.artifactId}:${project.version}</name>
                        </image>
                    </configuration>
                </plugin>
                <plugin>
                    <groupId>org.flywaydb</groupId>
                    <artifactId>flyway-maven-plugin</artifactId>
                    <version>${flyway.version}</version>
                </plugin>
            </plugins>
        </pluginManagement>
    </build>

    <profiles>
        <!-- Development profile (default) -->
        <profile>
            <id>dev</id>
            <activation>
                <activeByDefault>true</activeByDefault>
            </activation>
            <properties>
                <spring.profiles.active>dev</spring.profiles.active>
            </properties>
        </profile>

        <!-- Staging profile -->
        <profile>
            <id>staging</id>
            <properties>
                <spring.profiles.active>staging</spring.profiles.active>
            </properties>
        </profile>

        <!-- Production profile -->
        <profile>
            <id>prod</id>
            <properties>
                <spring.profiles.active>prod</spring.profiles.active>
            </properties>
            <build>
                <plugins>
                    <plugin>
                        <groupId>org.springframework.boot</groupId>
                        <artifactId>spring-boot-maven-plugin</artifactId>
                        <executions>
                            <execution>
                                <goals>
                                    <goal>build-image</goal>
                                </goals>
                            </execution>
                        </executions>
                    </plugin>
                </plugins>
            </build>
        </profile>

        <!-- Integration test profile -->
        <profile>
            <id>integration</id>
            <build>
                <plugins>
                    <plugin>
                        <groupId>org.apache.maven.plugins</groupId>
                        <artifactId>maven-failsafe-plugin</artifactId>
                        <executions>
                            <execution>
                                <goals>
                                    <goal>integration-test</goal>
                                    <goal>verify</goal>
                                </goals>
                            </execution>
                        </executions>
                    </plugin>
                </plugins>
            </build>
        </profile>
    </profiles>
</project>
```

### 1.2 Per-Module Dependencies

#### 1.2.1 libraries/agent-common (pom.xml)

Shared library consumed by all agent and learning services.

```xml
<project>
    <parent>
        <groupId>com.emsist.ai</groupId>
        <artifactId>agent-platform</artifactId>
        <version>1.0.0-SNAPSHOT</version>
        <relativePath>../../pom.xml</relativePath>
    </parent>

    <artifactId>agent-common</artifactId>
    <name>Agent Common Library</name>
    <description>Base agent framework, pipeline, tools, skills, tracing</description>

    <!-- Library JAR, not a Spring Boot app -->
    <packaging>jar</packaging>

    <dependencies>
        <!-- Spring Boot core (auto-configuration, DI) -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter</artifactId>
        </dependency>

        <!-- Spring AI - Ollama -->
        <dependency>
            <groupId>org.springframework.ai</groupId>
            <artifactId>spring-ai-ollama-spring-boot-starter</artifactId>
        </dependency>

        <!-- Spring AI - Anthropic (Claude teacher/fallback) -->
        <dependency>
            <groupId>org.springframework.ai</groupId>
            <artifactId>spring-ai-anthropic-spring-boot-starter</artifactId>
        </dependency>

        <!-- Spring AI - OpenAI (Codex teacher/fallback) -->
        <dependency>
            <groupId>org.springframework.ai</groupId>
            <artifactId>spring-ai-openai-spring-boot-starter</artifactId>
        </dependency>

        <!-- Spring AI - PGVector store -->
        <dependency>
            <groupId>org.springframework.ai</groupId>
            <artifactId>spring-ai-pgvector-store-spring-boot-starter</artifactId>
        </dependency>

        <!-- Spring Data JPA (SkillDefinition, TenantProfile entities) -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-data-jpa</artifactId>
        </dependency>

        <!-- Kafka (trace publishing) -->
        <dependency>
            <groupId>org.springframework.kafka</groupId>
            <artifactId>spring-kafka</artifactId>
        </dependency>

        <!-- Resilience4j (circuit breakers for tool execution) -->
        <dependency>
            <groupId>org.springframework.cloud</groupId>
            <artifactId>spring-cloud-starter-circuitbreaker-resilience4j</artifactId>
        </dependency>

        <!-- Eureka client (service discovery) -->
        <dependency>
            <groupId>org.springframework.cloud</groupId>
            <artifactId>spring-cloud-starter-netflix-eureka-client</artifactId>
        </dependency>

        <!-- Spring Cloud Config client -->
        <dependency>
            <groupId>org.springframework.cloud</groupId>
            <artifactId>spring-cloud-starter-config</artifactId>
        </dependency>

        <!-- Observability -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-actuator</artifactId>
        </dependency>
        <dependency>
            <groupId>io.micrometer</groupId>
            <artifactId>micrometer-tracing-bridge-otel</artifactId>
        </dependency>

        <!-- Validation -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-validation</artifactId>
        </dependency>

        <!-- Jackson (JSON serialization) -->
        <dependency>
            <groupId>com.fasterxml.jackson.core</groupId>
            <artifactId>jackson-databind</artifactId>
        </dependency>
        <dependency>
            <groupId>com.fasterxml.jackson.datatype</groupId>
            <artifactId>jackson-datatype-jsr310</artifactId>
        </dependency>
    </dependencies>
</project>
```

#### 1.2.2 agents/agent-orchestrator (pom.xml)

```xml
<project>
    <parent>
        <groupId>com.emsist.ai</groupId>
        <artifactId>agent-platform</artifactId>
        <version>1.0.0-SNAPSHOT</version>
        <relativePath>../../pom.xml</relativePath>
    </parent>

    <artifactId>agent-orchestrator</artifactId>
    <name>Agent Orchestrator</name>
    <description>Task routing, coordination, 7-step pipeline host</description>

    <dependencies>
        <dependency>
            <groupId>com.emsist.ai</groupId>
            <artifactId>agent-common</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-web</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-data-jpa</artifactId>
        </dependency>
        <dependency>
            <groupId>org.postgresql</groupId>
            <artifactId>postgresql</artifactId>
            <scope>runtime</scope>
        </dependency>
        <dependency>
            <groupId>org.flywaydb</groupId>
            <artifactId>flyway-core</artifactId>
        </dependency>
        <dependency>
            <groupId>org.flywaydb</groupId>
            <artifactId>flyway-database-postgresql</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-data-redis</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-security</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-oauth2-resource-server</artifactId>
        </dependency>

        <!-- Test -->
        <dependency>
            <groupId>org.testcontainers</groupId>
            <artifactId>postgresql</artifactId>
            <scope>test</scope>
        </dependency>
        <dependency>
            <groupId>org.testcontainers</groupId>
            <artifactId>kafka</artifactId>
            <scope>test</scope>
        </dependency>
    </dependencies>

    <build>
        <plugins>
            <plugin>
                <groupId>org.springframework.boot</groupId>
                <artifactId>spring-boot-maven-plugin</artifactId>
            </plugin>
        </plugins>
    </build>
</project>
```

#### 1.2.3 Specialist Agent POMs (agent-data-analyst, agent-customer-support, agent-code-reviewer, agent-document-processor)

All specialist agents share the same dependency pattern. They differ only in `artifactId` and `name`.

```xml
<project>
    <parent>
        <groupId>com.emsist.ai</groupId>
        <artifactId>agent-platform</artifactId>
        <version>1.0.0-SNAPSHOT</version>
        <relativePath>../../pom.xml</relativePath>
    </parent>

    <artifactId>agent-data-analyst</artifactId>
    <!-- Or: agent-customer-support, agent-code-reviewer, agent-document-processor -->
    <name>Agent Data Analyst</name>

    <dependencies>
        <dependency>
            <groupId>com.emsist.ai</groupId>
            <artifactId>agent-common</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-web</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-data-jpa</artifactId>
        </dependency>
        <dependency>
            <groupId>org.postgresql</groupId>
            <artifactId>postgresql</artifactId>
            <scope>runtime</scope>
        </dependency>
        <dependency>
            <groupId>org.flywaydb</groupId>
            <artifactId>flyway-core</artifactId>
        </dependency>
        <dependency>
            <groupId>org.flywaydb</groupId>
            <artifactId>flyway-database-postgresql</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-security</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-oauth2-resource-server</artifactId>
        </dependency>

        <!-- Test -->
        <dependency>
            <groupId>org.testcontainers</groupId>
            <artifactId>postgresql</artifactId>
            <scope>test</scope>
        </dependency>
    </dependencies>

    <build>
        <plugins>
            <plugin>
                <groupId>org.springframework.boot</groupId>
                <artifactId>spring-boot-maven-plugin</artifactId>
            </plugin>
        </plugins>
    </build>
</project>
```

#### 1.2.4 learning/trace-collector (pom.xml)

```xml
<project>
    <parent>
        <groupId>com.emsist.ai</groupId>
        <artifactId>agent-platform</artifactId>
        <version>1.0.0-SNAPSHOT</version>
        <relativePath>../../pom.xml</relativePath>
    </parent>

    <artifactId>trace-collector</artifactId>
    <name>Trace Collector Service</name>
    <description>Kafka consumer that persists agent execution traces</description>

    <dependencies>
        <dependency>
            <groupId>com.emsist.ai</groupId>
            <artifactId>agent-common</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-web</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-data-jpa</artifactId>
        </dependency>
        <dependency>
            <groupId>org.postgresql</groupId>
            <artifactId>postgresql</artifactId>
            <scope>runtime</scope>
        </dependency>
        <dependency>
            <groupId>org.flywaydb</groupId>
            <artifactId>flyway-core</artifactId>
        </dependency>
        <dependency>
            <groupId>org.flywaydb</groupId>
            <artifactId>flyway-database-postgresql</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.kafka</groupId>
            <artifactId>spring-kafka</artifactId>
        </dependency>

        <!-- Test -->
        <dependency>
            <groupId>org.testcontainers</groupId>
            <artifactId>postgresql</artifactId>
            <scope>test</scope>
        </dependency>
        <dependency>
            <groupId>org.testcontainers</groupId>
            <artifactId>kafka</artifactId>
            <scope>test</scope>
        </dependency>
        <dependency>
            <groupId>org.springframework.kafka</groupId>
            <artifactId>spring-kafka-test</artifactId>
            <scope>test</scope>
        </dependency>
    </dependencies>

    <build>
        <plugins>
            <plugin>
                <groupId>org.springframework.boot</groupId>
                <artifactId>spring-boot-maven-plugin</artifactId>
            </plugin>
        </plugins>
    </build>
</project>
```

#### 1.2.5 learning/feedback-service (pom.xml)

```xml
<project>
    <parent>
        <groupId>com.emsist.ai</groupId>
        <artifactId>agent-platform</artifactId>
        <version>1.0.0-SNAPSHOT</version>
        <relativePath>../../pom.xml</relativePath>
    </parent>

    <artifactId>feedback-service</artifactId>
    <name>Feedback Service</name>
    <description>Ingests user ratings, corrections, and customer feedback</description>

    <dependencies>
        <dependency>
            <groupId>com.emsist.ai</groupId>
            <artifactId>agent-common</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-web</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-data-jpa</artifactId>
        </dependency>
        <dependency>
            <groupId>org.postgresql</groupId>
            <artifactId>postgresql</artifactId>
            <scope>runtime</scope>
        </dependency>
        <dependency>
            <groupId>org.flywaydb</groupId>
            <artifactId>flyway-core</artifactId>
        </dependency>
        <dependency>
            <groupId>org.flywaydb</groupId>
            <artifactId>flyway-database-postgresql</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.kafka</groupId>
            <artifactId>spring-kafka</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-security</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-oauth2-resource-server</artifactId>
        </dependency>
    </dependencies>

    <build>
        <plugins>
            <plugin>
                <groupId>org.springframework.boot</groupId>
                <artifactId>spring-boot-maven-plugin</artifactId>
            </plugin>
        </plugins>
    </build>
</project>
```

#### 1.2.6 learning/teacher-service (pom.xml)

```xml
<project>
    <parent>
        <groupId>com.emsist.ai</groupId>
        <artifactId>agent-platform</artifactId>
        <version>1.0.0-SNAPSHOT</version>
        <relativePath>../../pom.xml</relativePath>
    </parent>

    <artifactId>teacher-service</artifactId>
    <name>Teacher Service</name>
    <description>Cloud model teacher pipeline (Claude, Codex, Gemini)</description>

    <dependencies>
        <dependency>
            <groupId>com.emsist.ai</groupId>
            <artifactId>agent-common</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-web</artifactId>
        </dependency>

        <!-- All three cloud AI providers -->
        <dependency>
            <groupId>org.springframework.ai</groupId>
            <artifactId>spring-ai-anthropic-spring-boot-starter</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.ai</groupId>
            <artifactId>spring-ai-openai-spring-boot-starter</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.ai</groupId>
            <artifactId>spring-ai-vertex-ai-gemini-spring-boot-starter</artifactId>
        </dependency>

        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-data-jpa</artifactId>
        </dependency>
        <dependency>
            <groupId>org.postgresql</groupId>
            <artifactId>postgresql</artifactId>
            <scope>runtime</scope>
        </dependency>
        <dependency>
            <groupId>org.flywaydb</groupId>
            <artifactId>flyway-core</artifactId>
        </dependency>
        <dependency>
            <groupId>org.flywaydb</groupId>
            <artifactId>flyway-database-postgresql</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.kafka</groupId>
            <artifactId>spring-kafka</artifactId>
        </dependency>
    </dependencies>

    <build>
        <plugins>
            <plugin>
                <groupId>org.springframework.boot</groupId>
                <artifactId>spring-boot-maven-plugin</artifactId>
            </plugin>
        </plugins>
    </build>
</project>
```

#### 1.2.7 learning/training-data-service, learning/training-orchestrator, learning/model-evaluator

These three services share a common dependency pattern with the additions noted below.

| Service | Extra Dependencies |
|---------|-------------------|
| training-data-service | `spring-ai-pgvector-store-spring-boot-starter` (vector store queries) |
| training-orchestrator | `spring-boot-starter-quartz` (scheduled training jobs), all Spring AI provider starters |
| model-evaluator | `spring-ai-ollama-spring-boot-starter`, `spring-ai-anthropic-spring-boot-starter` (model comparison) |

All three follow the same parent/dependency structure as `trace-collector` above, adding only the extra dependencies listed.

#### 1.2.8 infrastructure/eureka-server (pom.xml)

```xml
<project>
    <parent>
        <groupId>com.emsist.ai</groupId>
        <artifactId>agent-platform</artifactId>
        <version>1.0.0-SNAPSHOT</version>
        <relativePath>../../pom.xml</relativePath>
    </parent>

    <artifactId>eureka-server</artifactId>
    <name>Eureka Server</name>

    <dependencies>
        <dependency>
            <groupId>org.springframework.cloud</groupId>
            <artifactId>spring-cloud-starter-netflix-eureka-server</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-actuator</artifactId>
        </dependency>
    </dependencies>

    <build>
        <plugins>
            <plugin>
                <groupId>org.springframework.boot</groupId>
                <artifactId>spring-boot-maven-plugin</artifactId>
            </plugin>
        </plugins>
    </build>
</project>
```

#### 1.2.9 infrastructure/config-server (pom.xml)

```xml
<project>
    <parent>
        <groupId>com.emsist.ai</groupId>
        <artifactId>agent-platform</artifactId>
        <version>1.0.0-SNAPSHOT</version>
        <relativePath>../../pom.xml</relativePath>
    </parent>

    <artifactId>config-server</artifactId>
    <name>Config Server</name>

    <dependencies>
        <dependency>
            <groupId>org.springframework.cloud</groupId>
            <artifactId>spring-cloud-config-server</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.cloud</groupId>
            <artifactId>spring-cloud-starter-netflix-eureka-client</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-actuator</artifactId>
        </dependency>
    </dependencies>

    <build>
        <plugins>
            <plugin>
                <groupId>org.springframework.boot</groupId>
                <artifactId>spring-boot-maven-plugin</artifactId>
            </plugin>
        </plugins>
    </build>
</project>
```

#### 1.2.10 infrastructure/api-gateway (pom.xml)

```xml
<project>
    <parent>
        <groupId>com.emsist.ai</groupId>
        <artifactId>agent-platform</artifactId>
        <version>1.0.0-SNAPSHOT</version>
        <relativePath>../../pom.xml</relativePath>
    </parent>

    <artifactId>api-gateway</artifactId>
    <name>API Gateway</name>

    <dependencies>
        <dependency>
            <groupId>org.springframework.cloud</groupId>
            <artifactId>spring-cloud-starter-gateway</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.cloud</groupId>
            <artifactId>spring-cloud-starter-netflix-eureka-client</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.cloud</groupId>
            <artifactId>spring-cloud-starter-config</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.cloud</groupId>
            <artifactId>spring-cloud-starter-circuitbreaker-reactor-resilience4j</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-security</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-oauth2-resource-server</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-actuator</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-data-redis-reactive</artifactId>
        </dependency>
    </dependencies>

    <build>
        <plugins>
            <plugin>
                <groupId>org.springframework.boot</groupId>
                <artifactId>spring-boot-maven-plugin</artifactId>
            </plugin>
        </plugins>
    </build>
</project>
```

### 1.3 Module Dependency Graph

```mermaid
graph TD
    subgraph Infrastructure
        ES[eureka-server]
        CS[config-server]
        GW[api-gateway]
    end

    subgraph Libraries
        AC[agent-common]
    end

    subgraph Agents
        AO[agent-orchestrator]
        ADA[agent-data-analyst]
        ACS[agent-customer-support]
        ACR[agent-code-reviewer]
        ADP[agent-document-processor]
    end

    subgraph Learning
        TC[trace-collector]
        FS[feedback-service]
        TS[teacher-service]
        TDS[training-data-service]
        TO[training-orchestrator]
        ME[model-evaluator]
    end

    AO --> AC
    ADA --> AC
    ACS --> AC
    ACR --> AC
    ADP --> AC

    TC --> AC
    FS --> AC
    TS --> AC
    TDS --> AC
    TO --> AC
    ME --> AC

    CS --> ES
    GW --> ES
    GW --> CS
```

---

## 2. Application Configuration Files

**Status:** [PLANNED]
**Cross-Reference:** 02-Tech-Spec Section 7

All services pull shared configuration from Spring Cloud Config Server backed by a Git repository. Each service has a `bootstrap.yml` that points to the config server, plus an `application.yml` for local overrides during development.

### 2.1 Shared Configuration (config-repo/application.yml)

This file is served by the Config Server to all services as the baseline configuration.

```yaml
# config-repo/application.yml
# Shared defaults for all AI Agent Platform services
spring:
  # -- AI Model Providers --
  ai:
    ollama:
      base-url: http://ollama:11434
    anthropic:
      api-key: ${ANTHROPIC_API_KEY:}
      chat:
        options:
          model: claude-sonnet-4-5-20250929
          temperature: 0.5
          max-tokens: 4096
    openai:
      api-key: ${OPENAI_API_KEY:}
      chat:
        options:
          model: gpt-4
          temperature: 0.5
          max-tokens: 4096

  # -- Database (PostgreSQL + PGVector) --
  datasource:
    url: jdbc:postgresql://postgres:5432/${spring.application.name}
    username: ${DB_USERNAME:agent_platform}
    password: ${DB_PASSWORD:agent_platform_secret}
    hikari:
      maximum-pool-size: 10
      minimum-idle: 2
      connection-timeout: 20000

  jpa:
    hibernate:
      ddl-auto: validate
    open-in-view: false
    properties:
      hibernate:
        format_sql: false
        default_schema: public

  flyway:
    enabled: true
    locations: classpath:db/migration
    baseline-on-migrate: true

  # -- Kafka --
  kafka:
    bootstrap-servers: kafka:9092
    producer:
      key-serializer: org.apache.kafka.common.serialization.StringSerializer
      value-serializer: org.springframework.kafka.support.serializer.JsonSerializer
      acks: all
      retries: 3
    consumer:
      auto-offset-reset: earliest
      key-deserializer: org.apache.kafka.common.serialization.StringDeserializer
      value-deserializer: org.springframework.kafka.support.serializer.JsonDeserializer
      properties:
        spring.json.trusted.packages: "com.emsist.ai.*"

  # -- Valkey/Redis (session + cache) --
  data:
    redis:
      host: valkey
      port: 6379
      timeout: 2000ms

# -- Eureka Client --
eureka:
  client:
    service-url:
      defaultZone: http://eureka-server:8761/eureka/
    registry-fetch-interval-seconds: 10
  instance:
    prefer-ip-address: true
    lease-renewal-interval-in-seconds: 10
    lease-expiration-duration-in-seconds: 30

# -- Agent Platform Common --
agent:
  models:
    orchestrator:
      model: "llama3.1:8b"
      temperature: 0.3
      num-ctx: 4096
      max-concurrent: 10
    worker:
      model: "devstral-small:24b"
      temperature: 0.7
      num-ctx: 8192
      max-concurrent: 5

  routing:
    cloud-threshold: 0.7
    default-model: worker
    fallback-model: claude

  react-loop:
    max-turns: 10
    self-reflection: true
    tool-timeout-ms: 30000
    tool-retries: 2

  pipeline:
    validation-enabled: true
    explanation-enabled: true
    max-retries-on-validation-failure: 2
    max-retries-upper-bound: 3

  tenant:
    isolation-enabled: true
    default-namespace: "global"

  training:
    daily-cron: "0 0 2 * * *"
    weekly-cron: "0 0 4 * * SUN"
    quality-gate-threshold: 0.85
    recency-decay-factor: 0.95

# -- Resilience4j --
resilience4j:
  circuitbreaker:
    configs:
      default:
        sliding-window-size: 10
        failure-rate-threshold: 50
        wait-duration-in-open-state: 30s
        permitted-number-of-calls-in-half-open-state: 3
        slow-call-duration-threshold: 10s
        slow-call-rate-threshold: 80
    instances:
      ollama:
        base-config: default
        wait-duration-in-open-state: 60s
      claude:
        base-config: default
        failure-rate-threshold: 30
      tool-execution:
        base-config: default
        sliding-window-size: 20
  retry:
    configs:
      default:
        max-attempts: 3
        wait-duration: 1s
        retry-exceptions:
          - java.io.IOException
          - java.util.concurrent.TimeoutException
  timelimiter:
    configs:
      default:
        timeout-duration: 30s
    instances:
      ollama:
        timeout-duration: 120s
      claude:
        timeout-duration: 60s

# -- Actuator --
management:
  endpoints:
    web:
      exposure:
        include: health,info,metrics,prometheus,refresh
  endpoint:
    health:
      show-details: when-authorized
  metrics:
    tags:
      application: ${spring.application.name}
    distribution:
      percentiles-histogram:
        http.server.requests: true

# -- Logging --
logging:
  level:
    com.emsist.ai: DEBUG
    org.springframework.ai: INFO
    org.apache.kafka: WARN
  pattern:
    console: "%d{ISO8601} [%thread] [%X{traceId:-}] %-5level %logger{36} - %msg%n"
```

### 2.2 Infrastructure Service Configs

#### 2.2.1 Eureka Server (infrastructure/eureka-server/src/main/resources/application.yml)

```yaml
spring:
  application:
    name: eureka-server

server:
  port: 8761

eureka:
  client:
    register-with-eureka: false
    fetch-registry: false
  server:
    enable-self-preservation: true
    eviction-interval-timer-in-ms: 5000
    renewal-percent-threshold: 0.85
```

#### 2.2.2 Config Server (infrastructure/config-server/src/main/resources/application.yml)

```yaml
spring:
  application:
    name: config-server
  cloud:
    config:
      server:
        git:
          uri: ${CONFIG_REPO_URI:file:///config-repo}
          default-label: main
          search-paths: "{application}"
          clone-on-start: true
  profiles:
    active: native

server:
  port: 8888

eureka:
  client:
    service-url:
      defaultZone: http://eureka-server:8761/eureka/
```

#### 2.2.3 API Gateway (infrastructure/api-gateway/src/main/resources/application.yml)

```yaml
spring:
  application:
    name: api-gateway
  cloud:
    gateway:
      discovery:
        locator:
          enabled: true
          lower-case-service-id: true
      default-filters:
        - DedupeResponseHeader=Access-Control-Allow-Origin
      routes:
        # Agent Orchestrator
        - id: agent-orchestrator
          uri: lb://agent-orchestrator
          predicates:
            - Path=/api/v1/agents/orchestrate,/api/v1/pipeline/**
          filters:
            - StripPrefix=0

        # Agent Chat (by type)
        - id: agent-chat
          uri: lb://agent-orchestrator
          predicates:
            - Path=/api/v1/agents/{agentId}/chat
          filters:
            - StripPrefix=0

        # Skills Management
        - id: skills
          uri: lb://agent-orchestrator
          predicates:
            - Path=/api/v1/skills/**
          filters:
            - StripPrefix=0

        # Tool Management
        - id: tools
          uri: lb://agent-orchestrator
          predicates:
            - Path=/api/v1/tools/**
          filters:
            - StripPrefix=0

        # Feedback
        - id: feedback
          uri: lb://feedback-service
          predicates:
            - Path=/api/v1/feedback/**
          filters:
            - StripPrefix=0

        # Training & Models
        - id: training
          uri: lb://training-orchestrator
          predicates:
            - Path=/api/v1/training/**,/api/v1/models/**
          filters:
            - StripPrefix=0

        # Patterns & Materials
        - id: patterns
          uri: lb://feedback-service
          predicates:
            - Path=/api/v1/patterns/**,/api/v1/materials/**
          filters:
            - StripPrefix=0

        # Traces
        - id: traces
          uri: lb://trace-collector
          predicates:
            - Path=/api/v1/traces/**
          filters:
            - StripPrefix=0

        # Tenant Management
        - id: tenants
          uri: lb://agent-orchestrator
          predicates:
            - Path=/api/v1/tenants/**
          filters:
            - StripPrefix=0

        # Validation Rules
        - id: validation
          uri: lb://agent-orchestrator
          predicates:
            - Path=/api/v1/validation/**
          filters:
            - StripPrefix=0

  security:
    oauth2:
      resourceserver:
        jwt:
          issuer-uri: ${KEYCLOAK_ISSUER_URI:http://keycloak:8080/realms/emsist}

server:
  port: 8080

# Rate limiting via Valkey
  data:
    redis:
      host: valkey
      port: 6379
```

### 2.3 Agent Service Configs

#### 2.3.1 agent-orchestrator (config-repo/agent-orchestrator.yml)

```yaml
spring:
  application:
    name: agent-orchestrator

server:
  port: 8090

# Orchestrator-specific model config
agent:
  orchestrator:
    routing-strategy: complexity-based
    max-multi-agent-depth: 3
    plan-timeout-ms: 15000

  models:
    orchestrator:
      temperature: 0.2
      num-ctx: 4096
    worker:
      temperature: 0.7
      num-ctx: 8192

  pipeline:
    steps:
      intake:
        classification-prompt: "Classify this request by type and complexity"
      retrieve:
        top-k: 10
        similarity-threshold: 0.75
      plan:
        max-plan-steps: 15
      execute:
        max-turns: 10
      validate:
        enabled: true
      explain:
        enabled: true
      record:
        async: true
```

#### 2.3.2 agent-data-analyst (config-repo/agent-data-analyst.yml)

```yaml
spring:
  application:
    name: agent-data-analyst

server:
  port: 8091

agent:
  type: data-analyst
  default-skill: "data-analysis-v1"
  max-turns: 12
  self-reflection: true

  tools:
    run-sql:
      timeout-ms: 30000
      max-rows: 10000
      allowed-operations: [SELECT]
      blocked-operations: [DELETE, DROP, TRUNCATE, ALTER]
    create-chart:
      timeout-ms: 15000
      output-format: png
    summarize-table:
      timeout-ms: 20000
```

#### 2.3.3 agent-customer-support (config-repo/agent-customer-support.yml)

```yaml
spring:
  application:
    name: agent-customer-support

server:
  port: 8092

agent:
  type: customer-support
  default-skill: "ticket-resolution-v1"
  max-turns: 8
  self-reflection: false

  tools:
    search-tickets:
      timeout-ms: 10000
      max-results: 50
    search-kb:
      timeout-ms: 10000
      max-results: 20
    create-ticket:
      timeout-ms: 5000
      requires-approval: false
```

#### 2.3.4 agent-code-reviewer (config-repo/agent-code-reviewer.yml)

```yaml
spring:
  application:
    name: agent-code-reviewer

server:
  port: 8093

agent:
  type: code-reviewer
  default-skill: "code-security-review-v1"
  max-turns: 15
  self-reflection: true

  models:
    worker:
      model: "devstral-small:24b"
      temperature: 0.3
      num-ctx: 16384

  tools:
    analyze-code:
      timeout-ms: 60000
      supported-languages: [java, typescript, python, go]
    run-linter:
      timeout-ms: 30000
    check-security:
      timeout-ms: 45000
      owasp-categories: [injection, xss, auth, crypto, ssrf]
```

#### 2.3.5 agent-document-processor (config-repo/agent-document-processor.yml)

```yaml
spring:
  application:
    name: agent-document-processor

server:
  port: 8094

agent:
  type: document-processor
  default-skill: "document-summarization-v1"
  max-turns: 8
  self-reflection: false

  tools:
    parse-document:
      timeout-ms: 30000
      max-file-size-mb: 50
      supported-formats: [pdf, docx, xlsx, csv, txt, md, html]
    extract-entities:
      timeout-ms: 20000
    summarize:
      timeout-ms: 25000
      max-summary-length: 2000
```

### 2.4 Learning Pipeline Service Configs

#### 2.4.1 trace-collector (config-repo/trace-collector.yml)

```yaml
spring:
  application:
    name: trace-collector

  kafka:
    consumer:
      group-id: trace-collector-group

server:
  port: 8095

trace:
  collection:
    batch-size: 100
    flush-interval-ms: 5000
    retention-days: 90
  review:
    confidence-threshold: 0.5
    auto-flag-enabled: true
```

#### 2.4.2 feedback-service (config-repo/feedback-service.yml)

```yaml
spring:
  application:
    name: feedback-service

server:
  port: 8096

feedback:
  rating:
    scale: 5
    negative-threshold: 2
  correction:
    auto-queue-for-training: true
    priority: highest
  pattern:
    expansion:
      max-examples-per-pattern: 10
  material:
    chunking:
      chunk-size: 512
      chunk-overlap: 50
    embedding:
      model: "nomic-embed-text"
      batch-size: 50
```

#### 2.4.3 teacher-service (config-repo/teacher-service.yml)

```yaml
spring:
  application:
    name: teacher-service

server:
  port: 8097

teacher:
  claude:
    enabled: true
    model: claude-sonnet-4-5-20250929
    max-daily-calls: 1000
    cost-budget-usd: 50.0
  codex:
    enabled: true
    model: gpt-4
    max-daily-calls: 500
    cost-budget-usd: 30.0
  gemini:
    enabled: false
    model: gemini-1.5-pro
  evaluation:
    system-prompt: "You are an expert evaluator. Score the agent response on accuracy, helpfulness, and safety. Return a JSON with scores 1-5 for each dimension."
  gap-filling:
    max-examples-per-area: 50
    diversity-sampling: true
```

#### 2.4.4 training-data-service (config-repo/training-data-service.yml)

```yaml
spring:
  application:
    name: training-data-service

server:
  port: 8098

training-data:
  sources:
    traces:
      min-rating: 4
      lookback-days: 30
    corrections:
      lookback-days: 90
    patterns:
      include-inactive: false
    teacher:
      synthetic-limit: 200
  dataset:
    recency-decay-factor: 0.95
    min-examples-for-training: 100
    max-examples-per-dataset: 10000
    holdout-ratio: 0.1
    curriculum-enabled: false
  export:
    format: jsonl
    output-dir: /data/training-datasets
```

#### 2.4.5 training-orchestrator (config-repo/training-orchestrator.yml)

```yaml
spring:
  application:
    name: training-orchestrator

server:
  port: 8099

training:
  schedule:
    daily:
      enabled: true
      cron: "0 0 2 * * *"
      methods: [SFT, DPO, RAG_UPDATE]
    weekly:
      enabled: true
      cron: "0 0 4 * * SUN"
      methods: [SFT, DPO, KNOWLEDGE_DISTILLATION, CURRICULUM]
    monthly:
      enabled: false
      cron: "0 0 3 1 * *"
      methods: [SELF_SUPERVISED, CONTRASTIVE, SEMI_SUPERVISED]
  quality-gate:
    threshold: 0.85
    metrics: [accuracy, f1-score, latency-p95]
    auto-deploy: true
    shadow-period-hours: 4
  ollama:
    model-prefix: "agent"
    modelfile-template: /config/modelfile-template.txt
  sft:
    epochs: 3
    learning-rate: 2e-5
    lora-rank: 16
    lora-alpha: 16
    batch-size: 4
    max-seq-length: 4096
  dpo:
    beta: 0.1
    learning-rate: 5e-7
    epochs: 1
    batch-size: 4
```

#### 2.4.6 model-evaluator (config-repo/model-evaluator.yml)

```yaml
spring:
  application:
    name: model-evaluator

server:
  port: 8100

evaluator:
  benchmark:
    test-set-path: /data/eval/test-set.jsonl
    metrics: [accuracy, f1, bleu, latency]
    per-agent-eval: true
  comparison:
    baseline-model: "current-production"
    candidate-timeout-ms: 120000
  ab-testing:
    enabled: false
    traffic-split: 0.1
    min-sample-size: 100
    significance-level: 0.05
  reporting:
    output-dir: /data/eval/reports
    notify-on-completion: true
```

---

## 3. Database Schema Design

**Status:** [PLANNED]
**Cross-Reference:** 02-Tech-Spec Sections 3.7, 3.9, 3.12, 4.1-4.5

All services use PostgreSQL 16 with PGVector extension for embedding storage. Each service owns its own database following the database-per-service pattern. Flyway manages schema migrations.

### 3.1 Entity Relationship Diagram

```mermaid
erDiagram
    TENANT_PROFILE ||--o{ SKILL_DEFINITION : "scopes"
    TENANT_PROFILE ||--o{ AGENT_TRACE : "owns"
    TENANT_PROFILE ||--o{ FEEDBACK_ENTRY : "owns"
    TENANT_PROFILE ||--o{ TOOL_REGISTRATION : "scopes"

    SKILL_DEFINITION ||--o{ SKILL_TOOL_SET : "has"
    SKILL_DEFINITION ||--o{ SKILL_KNOWLEDGE_SCOPE : "has"
    SKILL_DEFINITION ||--o| SKILL_DEFINITION : "inherits from"

    AGENT_TRACE ||--o{ TOOL_CALL_TRACE : "contains"
    AGENT_TRACE ||--o{ FEEDBACK_ENTRY : "receives"
    AGENT_TRACE ||--|{ PIPELINE_STEP_TRACE : "has"

    FEEDBACK_ENTRY ||--o| USER_CORRECTION : "may have"

    TRAINING_JOB ||--o{ TRAINING_DATASET_ENTRY : "uses"
    TRAINING_JOB ||--o| MODEL_VERSION : "produces"

    MODEL_VERSION ||--o{ MODEL_DEPLOYMENT : "deployed as"

    APPROVAL_RECORD ||--|| AGENT_TRACE : "gates"

    VALIDATION_RULE ||--o{ VALIDATION_RESULT : "produces"

    TENANT_PROFILE {
        uuid id PK
        string tenant_id UK
        string namespace
        jsonb allowed_tools
        jsonb allowed_skills
        string data_classification
        int max_orchestrator_concurrency
        int max_worker_concurrency
        long version
        timestamp created_at
        timestamp updated_at
        uuid created_by
        uuid updated_by
    }

    SKILL_DEFINITION {
        uuid id PK
        string skill_key UK
        string name
        string semantic_version
        uuid tenant_id FK
        text system_prompt
        text behavioral_rules
        text few_shot_examples
        uuid parent_skill_id FK
        boolean active
        long version
        timestamp created_at
        timestamp updated_at
        uuid created_by
        uuid updated_by
    }

    SKILL_TOOL_SET {
        uuid id PK
        uuid skill_id FK
        string tool_name
    }

    SKILL_KNOWLEDGE_SCOPE {
        uuid id PK
        uuid skill_id FK
        string collection_name
    }

    AGENT_TRACE {
        uuid id PK
        string trace_id UK
        uuid tenant_id FK
        string agent_type
        string skill_id
        string model_used
        text request_content
        text response_content
        string task_type
        string complexity_level
        float confidence_score
        int turns_used
        long latency_ms
        long token_count_input
        long token_count_output
        string pipeline_run_id
        string status
        text error_message
        long version
        timestamp created_at
        timestamp updated_at
    }

    TOOL_CALL_TRACE {
        uuid id PK
        uuid agent_trace_id FK
        string tool_name
        text arguments
        text result
        long latency_ms
        boolean success
        int sequence_order
        timestamp called_at
    }

    PIPELINE_STEP_TRACE {
        uuid id PK
        uuid agent_trace_id FK
        string step_name
        long duration_ms
        text input_summary
        text output_summary
        string status
        int sequence_order
        timestamp started_at
        timestamp completed_at
    }

    FEEDBACK_ENTRY {
        uuid id PK
        uuid tenant_id FK
        uuid agent_trace_id FK
        string feedback_type
        int rating
        text comment
        string source
        uuid user_id
        long version
        timestamp created_at
        timestamp updated_at
    }

    USER_CORRECTION {
        uuid id PK
        uuid feedback_id FK
        text original_response
        text corrected_response
        text correction_reason
        boolean queued_for_training
        timestamp created_at
    }

    TRAINING_JOB {
        uuid id PK
        string job_type
        string status
        string trigger_type
        jsonb config
        int total_examples
        float quality_score_before
        float quality_score_after
        string model_path
        text error_message
        long version
        timestamp started_at
        timestamp completed_at
        timestamp created_at
    }

    TRAINING_DATASET_ENTRY {
        uuid id PK
        uuid training_job_id FK
        string source_type
        text input_text
        text output_text
        text rejected_text
        float weight
        float complexity_score
        string agent_type
        timestamp created_at
    }

    MODEL_VERSION {
        uuid id PK
        string model_name
        string semantic_version
        string model_path
        string base_model
        string training_method
        uuid training_job_id FK
        float quality_score
        jsonb benchmark_results
        string status
        long version
        timestamp created_at
        timestamp deployed_at
        timestamp retired_at
    }

    MODEL_DEPLOYMENT {
        uuid id PK
        uuid model_version_id FK
        string deployment_type
        string environment
        float traffic_percentage
        string status
        timestamp deployed_at
        timestamp rolled_back_at
    }

    TOOL_REGISTRATION {
        uuid id PK
        uuid tenant_id FK
        string name UK
        text description
        string tool_type
        jsonb parameter_schema
        jsonb return_schema
        string endpoint_url
        string http_method
        string semantic_version
        string risk_level "LOW, MEDIUM, HIGH, CRITICAL -- drives HITL per ADR-030"
        boolean active
        long version
        timestamp created_at
        timestamp updated_at
        uuid created_by
    }

    APPROVAL_RECORD {
        uuid id PK
        uuid agent_trace_id FK
        uuid tenant_id FK
        string action_type
        text action_description
        string status
        uuid requested_by
        uuid approved_by
        text approval_notes
        timestamp requested_at
        timestamp resolved_at
    }

    VALIDATION_RULE {
        uuid id PK
        uuid tenant_id FK
        string rule_name
        string rule_type
        text rule_definition
        string scope
        string severity
        boolean active
        long version
        timestamp created_at
        timestamp updated_at
    }

    VALIDATION_RESULT {
        uuid id PK
        uuid agent_trace_id FK
        uuid rule_id FK
        boolean passed
        text failure_reason
        text corrective_action
        timestamp evaluated_at
    }
```

### 3.2 PGVector Extension for Embedding Storage

The vector store is managed through Spring AI's PGVector integration. The following table holds document embeddings for RAG retrieval.

```sql
-- V1__create_pgvector_extension.sql
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Spring AI PGVector store table (standard schema)
CREATE TABLE IF NOT EXISTS vector_store (
    id          UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    content     TEXT NOT NULL,
    metadata    JSONB DEFAULT '{}',
    embedding   vector(1536),  -- default dimension for text-embedding-3-large; see note below
    tenant_id   UUID NOT NULL,
    created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tenant-scoped HNSW index for fast approximate nearest neighbor search
CREATE INDEX IF NOT EXISTS idx_vector_store_embedding
    ON vector_store USING hnsw (embedding vector_cosine_ops)
    WITH (m = 16, ef_construction = 200);

-- Tenant filter index (every RAG query is scoped by tenant)
CREATE INDEX IF NOT EXISTS idx_vector_store_tenant
    ON vector_store (tenant_id);

-- JSONB metadata index for filtering by document type, source, etc.
CREATE INDEX IF NOT EXISTS idx_vector_store_metadata
    ON vector_store USING gin (metadata jsonb_path_ops);
```

> **Configurable Embedding Dimension Note** [PLANNED]
>
> The `vector(1536)` column dimension is the default for OpenAI `text-embedding-3-large`. Dimension is model-dependent: 1536 for `text-embedding-3-large`, 768 for `text-embedding-3-small`. Configure via application property `spring.ai.vectorstore.pgvector.dimensions`. The `rag_chunking_config` table (Section 3.9) also stores `embedding_dimension` per collection, allowing different collections to use different models. Changing the embedding model for an existing collection requires a **re-embedding migration**: (1) create a new `vector_store` column or table with the target dimension, (2) re-embed all existing chunks using the new model, (3) rebuild HNSW indexes, (4) swap the active column/table atomically. A re-embedding runbook will be provided in `docs/ai-service/runbooks/re-embedding-migration.md`.

### 3.3 Flyway Migration Scripts

Migrations are organized per service. Each service has its own Flyway migration directory at `src/main/resources/db/migration/`.

#### 3.3.1 agent-orchestrator Migrations

```sql
-- V1__create_tenant_profiles.sql
CREATE TABLE IF NOT EXISTS tenant_profiles (
    id                          UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    tenant_id                   VARCHAR(255) NOT NULL UNIQUE,
    namespace                   VARCHAR(255) NOT NULL,
    allowed_tools               JSONB DEFAULT '[]',
    allowed_skills              JSONB DEFAULT '[]',
    data_classification         VARCHAR(50) DEFAULT 'INTERNAL',
    max_orchestrator_concurrency INT DEFAULT 10,
    max_worker_concurrency      INT DEFAULT 5,
    version                     BIGINT NOT NULL DEFAULT 0,
    created_at                  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at                  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_by                  UUID,
    updated_by                  UUID
);

CREATE INDEX IF NOT EXISTS idx_tenant_profiles_tenant ON tenant_profiles (tenant_id);
```

```sql
-- V2__create_skill_definitions.sql
CREATE TABLE IF NOT EXISTS skill_definitions (
    id                UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    skill_key         VARCHAR(255) NOT NULL UNIQUE,
    name              VARCHAR(255) NOT NULL,
    semantic_version  VARCHAR(50) NOT NULL DEFAULT '1.0.0',
    tenant_id         UUID,
    system_prompt     TEXT NOT NULL,
    behavioral_rules  TEXT,
    few_shot_examples TEXT,
    parent_skill_id   UUID REFERENCES skill_definitions(id),
    active            BOOLEAN NOT NULL DEFAULT FALSE,
    version           BIGINT NOT NULL DEFAULT 0,
    created_at        TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_by        UUID,
    updated_by        UUID
);

CREATE TABLE IF NOT EXISTS skill_tool_sets (
    id        UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    skill_id  UUID NOT NULL REFERENCES skill_definitions(id) ON DELETE CASCADE,
    tool_name VARCHAR(255) NOT NULL
);

CREATE TABLE IF NOT EXISTS skill_knowledge_scopes (
    id              UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    skill_id        UUID NOT NULL REFERENCES skill_definitions(id) ON DELETE CASCADE,
    collection_name VARCHAR(255) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_skill_definitions_tenant ON skill_definitions (tenant_id);
CREATE INDEX IF NOT EXISTS idx_skill_definitions_active ON skill_definitions (active) WHERE active = TRUE;
CREATE INDEX IF NOT EXISTS idx_skill_tool_sets_skill ON skill_tool_sets (skill_id);
CREATE INDEX IF NOT EXISTS idx_skill_knowledge_scopes_skill ON skill_knowledge_scopes (skill_id);
```

```sql
-- V3__create_tool_registrations.sql
CREATE TABLE IF NOT EXISTS tool_registrations (
    id               UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    tenant_id        UUID,
    name             VARCHAR(255) NOT NULL,
    description      TEXT,
    tool_type        VARCHAR(50) NOT NULL DEFAULT 'REST',
    parameter_schema JSONB DEFAULT '{}',
    return_schema    JSONB DEFAULT '{}',
    endpoint_url     VARCHAR(1024),
    http_method      VARCHAR(10) DEFAULT 'POST',
    semantic_version VARCHAR(50) NOT NULL DEFAULT '1.0.0',
    risk_level       VARCHAR(20) NOT NULL DEFAULT 'LOW', -- Drives HITL approval per ADR-030
    active           BOOLEAN NOT NULL DEFAULT TRUE,
    version          BIGINT NOT NULL DEFAULT 0,
    created_at       TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_by       UUID,
    CONSTRAINT uq_tool_name_tenant UNIQUE (name, tenant_id),
    CONSTRAINT chk_tool_risk_level CHECK (risk_level IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL'))
);

CREATE INDEX IF NOT EXISTS idx_tool_registrations_tenant ON tool_registrations (tenant_id);
CREATE INDEX IF NOT EXISTS idx_tool_registrations_active ON tool_registrations (active) WHERE active = TRUE;
```

```sql
-- V3b__create_tool_authorizations.sql (agent-orchestrator) [PLANNED]
-- Per-agent tool grants: controls which agents can use which tools
CREATE TABLE IF NOT EXISTS tool_authorizations (
    id                    UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    agent_id              UUID NOT NULL, -- FK to workers (application-enforced, polymorphic)
    tool_registration_id  UUID NOT NULL REFERENCES tool_registrations(id) ON DELETE CASCADE,
    granted_by            UUID NOT NULL, -- User who granted the authorization
    granted_at            TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    expires_at            TIMESTAMP WITH TIME ZONE,
    scope                 JSONB DEFAULT '{}', -- Restricts tool usage (e.g., read-only, specific parameters)
    revoked_at            TIMESTAMP WITH TIME ZONE,
    CONSTRAINT uq_agent_tool UNIQUE (agent_id, tool_registration_id) WHERE revoked_at IS NULL
);

CREATE INDEX IF NOT EXISTS idx_tool_authorizations_agent ON tool_authorizations (agent_id) WHERE revoked_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_tool_authorizations_tool ON tool_authorizations (tool_registration_id);
```

```sql
-- V4__create_validation_rules.sql
CREATE TABLE IF NOT EXISTS validation_rules (
    id              UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    tenant_id       UUID,
    rule_name       VARCHAR(255) NOT NULL,
    rule_type       VARCHAR(50) NOT NULL,
    rule_definition TEXT NOT NULL,
    scope           VARCHAR(100) DEFAULT 'GLOBAL',
    severity        VARCHAR(20) NOT NULL DEFAULT 'ERROR',
    active          BOOLEAN NOT NULL DEFAULT TRUE,
    version         BIGINT NOT NULL DEFAULT 0,
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_validation_rules_tenant ON validation_rules (tenant_id);
CREATE INDEX IF NOT EXISTS idx_validation_rules_scope ON validation_rules (scope);
```

#### 3.3.2 trace-collector Migrations

```sql
-- V1__create_agent_traces.sql
CREATE TABLE IF NOT EXISTS agent_traces (
    id                  UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    trace_id            VARCHAR(255) NOT NULL UNIQUE,
    tenant_id           UUID NOT NULL,
    agent_type          VARCHAR(100) NOT NULL,
    skill_id            VARCHAR(255),
    model_used          VARCHAR(255),
    request_content     TEXT NOT NULL,
    response_content    TEXT,
    task_type           VARCHAR(50),
    complexity_level    VARCHAR(20),
    confidence_score    REAL,
    turns_used          INT DEFAULT 0,
    latency_ms          BIGINT,
    token_count_input   BIGINT DEFAULT 0,
    token_count_output  BIGINT DEFAULT 0,
    pipeline_run_id     VARCHAR(255),
    status              VARCHAR(20) NOT NULL DEFAULT 'COMPLETED',
    error_message       TEXT,
    version             BIGINT NOT NULL DEFAULT 0,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tool_call_traces (
    id              UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    agent_trace_id  UUID NOT NULL REFERENCES agent_traces(id) ON DELETE CASCADE,
    tool_name       VARCHAR(255) NOT NULL,
    arguments       TEXT,
    result          TEXT,
    latency_ms      BIGINT,
    success         BOOLEAN NOT NULL DEFAULT TRUE,
    sequence_order  INT NOT NULL DEFAULT 0,
    called_at       TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pipeline_step_traces (
    id              UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    agent_trace_id  UUID NOT NULL REFERENCES agent_traces(id) ON DELETE CASCADE,
    step_name       VARCHAR(50) NOT NULL,
    duration_ms     BIGINT,
    input_summary   TEXT,
    output_summary  TEXT,
    status          VARCHAR(20) NOT NULL DEFAULT 'COMPLETED',
    sequence_order  INT NOT NULL DEFAULT 0,
    started_at      TIMESTAMP WITH TIME ZONE,
    completed_at    TIMESTAMP WITH TIME ZONE
);

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_agent_traces_tenant ON agent_traces (tenant_id);
CREATE INDEX IF NOT EXISTS idx_agent_traces_agent_type ON agent_traces (agent_type);
CREATE INDEX IF NOT EXISTS idx_agent_traces_created ON agent_traces (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_agent_traces_status ON agent_traces (status);
CREATE INDEX IF NOT EXISTS idx_agent_traces_confidence ON agent_traces (confidence_score)
    WHERE confidence_score < 0.5;
CREATE INDEX IF NOT EXISTS idx_agent_traces_pipeline ON agent_traces (pipeline_run_id);
CREATE INDEX IF NOT EXISTS idx_tool_call_traces_agent ON tool_call_traces (agent_trace_id);
CREATE INDEX IF NOT EXISTS idx_pipeline_step_traces_agent ON pipeline_step_traces (agent_trace_id);
```

```sql
-- V2__create_validation_results.sql
CREATE TABLE IF NOT EXISTS validation_results (
    id               UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    agent_trace_id   UUID NOT NULL REFERENCES agent_traces(id) ON DELETE CASCADE,
    rule_id          UUID,
    passed           BOOLEAN NOT NULL,
    failure_reason   TEXT,
    corrective_action TEXT,
    evaluated_at     TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_validation_results_trace ON validation_results (agent_trace_id);
CREATE INDEX IF NOT EXISTS idx_validation_results_failed ON validation_results (passed) WHERE passed = FALSE;
```

```sql
-- V3__create_approval_records.sql
CREATE TABLE IF NOT EXISTS approval_records (
    id                UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    agent_trace_id    UUID NOT NULL REFERENCES agent_traces(id),
    tenant_id         UUID NOT NULL,
    action_type       VARCHAR(100) NOT NULL,
    action_description TEXT,
    status            VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    requested_by      UUID,
    approved_by       UUID,
    approval_notes    TEXT,
    requested_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    resolved_at       TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_approval_records_tenant ON approval_records (tenant_id);
CREATE INDEX IF NOT EXISTS idx_approval_records_status ON approval_records (status)
    WHERE status = 'PENDING';
```

#### 3.3.3 feedback-service Migrations

```sql
-- V1__create_feedback_tables.sql
CREATE TABLE IF NOT EXISTS feedback_entries (
    id              UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    tenant_id       UUID NOT NULL,
    agent_trace_id  UUID,
    feedback_type   VARCHAR(50) NOT NULL,
    rating          INT CHECK (rating >= 1 AND rating <= 5),
    comment         TEXT,
    source          VARCHAR(50) NOT NULL DEFAULT 'USER',
    user_id         UUID,
    version         BIGINT NOT NULL DEFAULT 0,
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_corrections (
    id                  UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    feedback_id         UUID NOT NULL REFERENCES feedback_entries(id) ON DELETE CASCADE,
    original_response   TEXT NOT NULL,
    corrected_response  TEXT NOT NULL,
    correction_reason   TEXT,
    queued_for_training BOOLEAN NOT NULL DEFAULT TRUE,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS business_patterns (
    id           UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    tenant_id    UUID NOT NULL,
    name         VARCHAR(255) NOT NULL,
    description  TEXT,
    pattern_type VARCHAR(50) NOT NULL,
    trigger_text TEXT NOT NULL,
    response_text TEXT NOT NULL,
    agent_type   VARCHAR(100),
    active       BOOLEAN NOT NULL DEFAULT TRUE,
    version      BIGINT NOT NULL DEFAULT 0,
    created_at   TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_by   UUID
);

CREATE TABLE IF NOT EXISTS learning_materials (
    id                UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    tenant_id         UUID NOT NULL,
    title             VARCHAR(500) NOT NULL,
    content_type      VARCHAR(50) NOT NULL,
    source_path       VARCHAR(1024),
    raw_content       TEXT,
    chunk_count       INT DEFAULT 0,
    embedding_status  VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    agent_type        VARCHAR(100),
    version           BIGINT NOT NULL DEFAULT 0,
    created_at        TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_by        UUID
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_feedback_entries_tenant ON feedback_entries (tenant_id);
CREATE INDEX IF NOT EXISTS idx_feedback_entries_trace ON feedback_entries (agent_trace_id);
CREATE INDEX IF NOT EXISTS idx_feedback_entries_type ON feedback_entries (feedback_type);
CREATE INDEX IF NOT EXISTS idx_feedback_entries_rating ON feedback_entries (rating);
CREATE INDEX IF NOT EXISTS idx_feedback_entries_created ON feedback_entries (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_corrections_queued ON user_corrections (queued_for_training)
    WHERE queued_for_training = TRUE;
CREATE INDEX IF NOT EXISTS idx_business_patterns_tenant ON business_patterns (tenant_id);
CREATE INDEX IF NOT EXISTS idx_business_patterns_agent ON business_patterns (agent_type);
CREATE INDEX IF NOT EXISTS idx_learning_materials_tenant ON learning_materials (tenant_id);
CREATE INDEX IF NOT EXISTS idx_learning_materials_status ON learning_materials (embedding_status);
```

#### 3.3.4 training-orchestrator Migrations

```sql
-- V1__create_training_tables.sql
CREATE TABLE IF NOT EXISTS training_jobs (
    id                  UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    job_type            VARCHAR(50) NOT NULL,
    status              VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    trigger_type        VARCHAR(50) NOT NULL DEFAULT 'SCHEDULED',
    config              JSONB DEFAULT '{}',
    total_examples      INT DEFAULT 0,
    quality_score_before REAL,
    quality_score_after  REAL,
    model_path          VARCHAR(1024),
    error_message       TEXT,
    version             BIGINT NOT NULL DEFAULT 0,
    started_at          TIMESTAMP WITH TIME ZONE,
    completed_at        TIMESTAMP WITH TIME ZONE,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS training_dataset_entries (
    id               UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    training_job_id  UUID NOT NULL REFERENCES training_jobs(id) ON DELETE CASCADE,
    source_type      VARCHAR(50) NOT NULL,
    input_text       TEXT NOT NULL,
    output_text      TEXT NOT NULL,
    rejected_text    TEXT,
    weight           REAL DEFAULT 1.0,
    complexity_score REAL,
    agent_type       VARCHAR(100),
    created_at       TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS model_versions (
    id                UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    model_name        VARCHAR(255) NOT NULL,
    semantic_version  VARCHAR(50) NOT NULL,
    model_path        VARCHAR(1024) NOT NULL,
    base_model        VARCHAR(255) NOT NULL,
    training_method   VARCHAR(50),
    training_job_id   UUID REFERENCES training_jobs(id),
    quality_score     REAL,
    benchmark_results JSONB DEFAULT '{}',
    status            VARCHAR(20) NOT NULL DEFAULT 'CREATED',
    version           BIGINT NOT NULL DEFAULT 0,
    created_at        TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    deployed_at       TIMESTAMP WITH TIME ZONE,
    retired_at        TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS model_deployments (
    id                 UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    model_version_id   UUID NOT NULL REFERENCES model_versions(id),
    deployment_type    VARCHAR(50) NOT NULL DEFAULT 'FULL',
    environment        VARCHAR(50) NOT NULL DEFAULT 'PRODUCTION',
    traffic_percentage REAL DEFAULT 100.0,
    status             VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    deployed_at        TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    rolled_back_at     TIMESTAMP WITH TIME ZONE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_training_jobs_status ON training_jobs (status);
CREATE INDEX IF NOT EXISTS idx_training_jobs_type ON training_jobs (job_type);
CREATE INDEX IF NOT EXISTS idx_training_jobs_created ON training_jobs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_training_dataset_entries_job ON training_dataset_entries (training_job_id);
CREATE INDEX IF NOT EXISTS idx_training_dataset_entries_source ON training_dataset_entries (source_type);
CREATE INDEX IF NOT EXISTS idx_model_versions_status ON model_versions (status);
CREATE INDEX IF NOT EXISTS idx_model_versions_name ON model_versions (model_name, semantic_version);
CREATE INDEX IF NOT EXISTS idx_model_deployments_version ON model_deployments (model_version_id);
CREATE INDEX IF NOT EXISTS idx_model_deployments_active ON model_deployments (status)
    WHERE status = 'ACTIVE';
```

### 3.6 Pipeline Run State Machine Table (`pipeline_runs`) [PLANNED]

<!-- Addresses R1: formal pipeline state machine -->

**Status:** [PLANNED] -- Not yet implemented. Designed per validation recommendation R1.

The `pipeline_runs` table persists the state of each seven-step agent pipeline execution. It implements a formal state machine with optimistic locking (`version`), per-state timeouts, retry tracking, and an optional human-approval gate.

```sql
-- V7__create_pipeline_runs.sql (agent-orchestrator)
CREATE TABLE pipeline_runs (
    id                UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    run_id            VARCHAR(100) NOT NULL UNIQUE,
    tenant_id         UUID NOT NULL,
    current_state     VARCHAR(30) NOT NULL DEFAULT 'QUEUED',
    previous_state    VARCHAR(30),
    trigger_type      VARCHAR(30) NOT NULL DEFAULT 'USER_REQUEST',
    failure_reason    TEXT,
    retry_count       INT NOT NULL DEFAULT 0,
    max_retries       INT NOT NULL DEFAULT 2,
    state_entered_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    timeout_at        TIMESTAMP WITH TIME ZONE,
    state_metadata    JSONB DEFAULT '{}',
    version           BIGINT NOT NULL DEFAULT 0,
    created_at        TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_pipeline_state CHECK (current_state IN (
        'QUEUED','INTAKE','RETRIEVE','PLAN','EXECUTE',
        'VALIDATE','EXPLAIN','RECORD','COMPLETED',
        'FAILED','CANCELLED','AWAITING_APPROVAL'
    )),
    CONSTRAINT chk_trigger_type CHECK (trigger_type IN (
        'USER_REQUEST','RETRY','APPROVAL_GRANTED','TIMEOUT_RECOVERY'
    ))
);

CREATE INDEX idx_pipeline_runs_tenant_state
    ON pipeline_runs(tenant_id, current_state);
CREATE INDEX idx_pipeline_runs_timeout
    ON pipeline_runs(timeout_at)
    WHERE current_state NOT IN ('COMPLETED','FAILED','CANCELLED');
```

#### 3.6.1 Pipeline State Machine Transitions

```mermaid
stateDiagram-v2
    [*] --> QUEUED : User request / Retry / Timeout recovery

    QUEUED --> INTAKE : Dispatcher picks up
    QUEUED --> CANCELLED : User cancels

    INTAKE --> RETRIEVE : Input parsed successfully
    INTAKE --> FAILED : Parse error / timeout

    RETRIEVE --> PLAN : Context retrieved
    RETRIEVE --> FAILED : Retrieval error / timeout

    PLAN --> EXECUTE : Plan accepted
    PLAN --> FAILED : Planning error / timeout

    EXECUTE --> VALIDATE : Execution complete
    EXECUTE --> AWAITING_APPROVAL : High-risk action detected
    EXECUTE --> FAILED : Execution error / timeout

    VALIDATE --> EXPLAIN : Validation passed
    VALIDATE --> EXECUTE : Validation failed (retry)
    VALIDATE --> FAILED : Max retries exceeded / timeout

    EXPLAIN --> RECORD : Explanation generated
    EXPLAIN --> FAILED : Explanation error / timeout

    RECORD --> COMPLETED : Trace persisted
    RECORD --> FAILED : Persistence error / timeout

    AWAITING_APPROVAL --> VALIDATE : Approved by user
    AWAITING_APPROVAL --> FAILED : Rejected or approval timeout

    COMPLETED --> [*]
    FAILED --> [*]
    CANCELLED --> [*]
```

#### 3.6.2 Default State Timeouts

| State | Default Timeout (seconds) | Rationale |
|-------|--------------------------|-----------|
| QUEUED | 300 | Maximum wait in dispatch queue before timeout |
| INTAKE | 30 | Input parsing is fast; detect stalls quickly |
| RETRIEVE | 60 | RAG + context retrieval may involve multiple queries |
| PLAN | 30 | LLM planning step; single inference call |
| EXECUTE | 300 | Tool execution may involve external APIs |
| VALIDATE | 60 | Output validation + optional re-execution |
| EXPLAIN | 30 | Explanation generation; single inference call |
| RECORD | 30 | Trace persistence to database |
| AWAITING_APPROVAL | 86400 | Human approval gate; 24-hour default |

### 3.7 Agent Artifacts Table (`agent_artifacts`) [PLANNED]

<!-- Addresses R2: agent_artifacts table -->

**Status:** [PLANNED] -- Not yet implemented. Designed per validation recommendation R2.

The `agent_artifacts` table stores deliverables produced by agent pipeline executions. Each artifact is linked to an `agent_trace` and supports content deduplication via SHA-256 hashing, large binary storage via external URL (S3/MinIO), and a supersession chain for versioned outputs.

```sql
-- V8__create_agent_artifacts.sql (trace-collector)
CREATE TABLE agent_artifacts (
    id                UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    agent_trace_id    UUID NOT NULL REFERENCES agent_traces(id),
    tenant_id         UUID NOT NULL,
    artifact_type     VARCHAR(50) NOT NULL,
    name              VARCHAR(500) NOT NULL,
    content           TEXT,
    content_url       VARCHAR(2000),
    content_hash      VARCHAR(64),
    content_size_bytes BIGINT,
    mime_type         VARCHAR(100),
    metadata          JSONB DEFAULT '{}',
    status            VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    superseded_by     UUID REFERENCES agent_artifacts(id),
    version           BIGINT NOT NULL DEFAULT 0,
    created_at        TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_artifact_type CHECK (artifact_type IN (
        'CODE','PATCH','TEST_RESULT','REPORT','QUERY',
        'DOCUMENT','CONFIG','DATA_EXPORT','DIAGRAM','OTHER'
    )),
    CONSTRAINT chk_artifact_status CHECK (status IN (
        'DRAFT','FINAL','SUPERSEDED','REJECTED'
    ))
);

CREATE INDEX idx_agent_artifacts_trace
    ON agent_artifacts(agent_trace_id);
CREATE INDEX idx_agent_artifacts_tenant_type
    ON agent_artifacts(tenant_id, artifact_type);
CREATE INDEX idx_agent_artifacts_hash
    ON agent_artifacts(content_hash);
```

### 3.8 RAG Search Log Table (`rag_search_log`) [PLANNED]

<!-- Addresses R3: RAG search logging -->

**Status:** [PLANNED] -- Not yet implemented. Designed per validation recommendation R3.

The `rag_search_log` table records every RAG retrieval query, its results, and whether those results were actually used by the agent. This enables knowledge gap detection (queries with zero or low-relevance results) and retrieval quality analytics.

```sql
-- V9__create_rag_search_log.sql (agent-orchestrator)
CREATE TABLE rag_search_log (
    id                     UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    agent_trace_id         UUID REFERENCES agent_traces(id),
    tenant_id              UUID NOT NULL,
    collection_name        VARCHAR(200) NOT NULL,
    query_text             TEXT NOT NULL,
    results_returned       INT NOT NULL DEFAULT 0,
    top_similarity_score   FLOAT,
    bottom_similarity_score FLOAT,
    results_used           BOOLEAN NOT NULL DEFAULT true,
    gap_reason             TEXT,
    latency_ms             BIGINT NOT NULL,
    queried_at             TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_rag_search_log_trace
    ON rag_search_log(agent_trace_id);
CREATE INDEX idx_rag_search_log_tenant_collection
    ON rag_search_log(tenant_id, collection_name);
CREATE INDEX idx_rag_search_log_gap
    ON rag_search_log(tenant_id, results_used);
```

### 3.9 RAG Chunking Configuration Table (`rag_chunking_config`) [PLANNED]

<!-- Addresses R4: RAG chunking specification, R15: configurable embedding dimension -->

**Status:** [PLANNED] -- Not yet implemented. Designed per validation recommendations R4 and R15.

The `rag_chunking_config` table stores per-tenant, per-collection chunking and embedding parameters. This makes chunk size, overlap, break priority, deduplication, and embedding model/dimension fully configurable without code changes.

```sql
-- V10__create_rag_chunking_config.sql (agent-orchestrator)
CREATE TABLE rag_chunking_config (
    id                    UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    tenant_id             UUID NOT NULL,
    collection_name       VARCHAR(200) NOT NULL,
    chunk_size_chars      INT NOT NULL DEFAULT 1500,
    chunk_overlap_chars   INT NOT NULL DEFAULT 200,
    break_priority        VARCHAR(20) NOT NULL DEFAULT 'PARAGRAPH',
    sha256_dedup_enabled  BOOLEAN NOT NULL DEFAULT true,
    min_chunk_size_chars  INT NOT NULL DEFAULT 100,
    embedding_model       VARCHAR(200) NOT NULL DEFAULT 'text-embedding-3-large',
    embedding_dimension   INT NOT NULL DEFAULT 1536, -- 1536 for text-embedding-3-large, 768 for text-embedding-3-small
    version               BIGINT NOT NULL DEFAULT 0,
    created_at            TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at            TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_rag_chunking_tenant_collection UNIQUE(tenant_id, collection_name),
    CONSTRAINT chk_break_priority CHECK (break_priority IN (
        'PARAGRAPH','SENTENCE','WORD','CHARACTER'
    ))
);
```

### 3.10 Agent Templates Table (`agent_templates`) [PLANNED]

<!-- Addresses Agent Builder vision -->

**Status:** [PLANNED] -- Not yet implemented. Supports the Agent Builder paradigm where users create, fork, and publish agent configurations.

The `agent_templates` table stores agent template definitions for the Template Gallery. Templates can be system-seeded, user-created, or forked from the gallery. Each template carries full agent configuration (system prompt, model config, behavioral rules) plus gallery metadata (tags, ratings, usage counts).

```sql
-- V11__create_agent_templates.sql (agent-orchestrator)
CREATE TABLE agent_templates (
    id                  UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    tenant_id           UUID NOT NULL,
    name                VARCHAR(200) NOT NULL,
    description         TEXT,
    avatar_url          VARCHAR(500),
    system_prompt       TEXT,
    greeting_message    TEXT,
    conversation_starters JSONB DEFAULT '[]',
    model_config        JSONB NOT NULL DEFAULT '{}',
    behavioral_rules    JSONB DEFAULT '[]',
    template_source     VARCHAR(20) NOT NULL DEFAULT 'USER_CREATED',
    parent_template_id  UUID REFERENCES agent_templates(id),
    gallery_visible     BOOLEAN NOT NULL DEFAULT false,
    tags                JSONB DEFAULT '[]',
    author_id           UUID,
    author_name         VARCHAR(200),
    usage_count         INT NOT NULL DEFAULT 0,
    fork_count          INT NOT NULL DEFAULT 0,
    average_rating      FLOAT NOT NULL DEFAULT 0.0,
    is_system           BOOLEAN NOT NULL DEFAULT false,
    status              VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    template_version    VARCHAR(20) NOT NULL DEFAULT '1.0.0',
    version             BIGINT NOT NULL DEFAULT 0,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_template_source CHECK (template_source IN (
        'SYSTEM_SEED','USER_CREATED','GALLERY_FORK'
    )),
    CONSTRAINT chk_template_status CHECK (status IN (
        'DRAFT','ACTIVE','DEPRECATED','RETIRED'
    ))
);

CREATE INDEX idx_agent_templates_tenant
    ON agent_templates(tenant_id);
CREATE INDEX idx_agent_templates_gallery
    ON agent_templates(tenant_id, gallery_visible)
    WHERE gallery_visible = true;
CREATE INDEX idx_agent_templates_parent
    ON agent_templates(parent_template_id);
```

#### 3.10.1 Agent Template Junction Tables [PLANNED]

```sql
-- V12__create_agent_template_junctions.sql (agent-orchestrator)

-- Links templates to skills
CREATE TABLE agent_template_skills (
    id          UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    template_id UUID NOT NULL REFERENCES agent_templates(id) ON DELETE CASCADE,
    skill_id    UUID NOT NULL REFERENCES skill_definitions(id) ON DELETE CASCADE,
    CONSTRAINT uq_template_skill UNIQUE(template_id, skill_id)
);

CREATE INDEX idx_agent_template_skills_template
    ON agent_template_skills(template_id);
CREATE INDEX idx_agent_template_skills_skill
    ON agent_template_skills(skill_id);

-- Links templates to tools
CREATE TABLE agent_template_tools (
    id          UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    template_id UUID NOT NULL REFERENCES agent_templates(id) ON DELETE CASCADE,
    tool_id     UUID NOT NULL REFERENCES tool_registrations(id) ON DELETE CASCADE,
    CONSTRAINT uq_template_tool UNIQUE(template_id, tool_id)
);

CREATE INDEX idx_agent_template_tools_template
    ON agent_template_tools(template_id);
CREATE INDEX idx_agent_template_tools_tool
    ON agent_template_tools(tool_id);
```

### 3.11 Audit Events Table (`audit_events`) [PLANNED]

<!-- Addresses P0: Enterprise audit logging -->

**Status:** [PLANNED] -- Not yet implemented. Provides a comprehensive enterprise audit trail for all user and system actions across the AI Agent Platform.

The `audit_events` table records every significant action taken by users or the system. It captures who did what, to which target, when, and from where. The `details` JSONB column stores diffs, old/new values, and additional metadata specific to each action type.

```sql
-- V13__create_audit_events.sql (agent-orchestrator)
CREATE TABLE audit_events (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID NOT NULL, -- Application-enforced FK to tenant-service.tenants(id); cross-database FK not possible in PostgreSQL
    user_id         UUID NOT NULL,
    user_name       VARCHAR(255) NOT NULL,
    action          VARCHAR(100) NOT NULL,  -- CREATE_AGENT, UPDATE_AGENT, DELETE_AGENT, PUBLISH_TEMPLATE, etc.
    target_type     VARCHAR(50) NOT NULL,   -- AGENT, SKILL, TEMPLATE, KNOWLEDGE_SOURCE, PIPELINE_RUN
    target_id       UUID,
    target_name     VARCHAR(255),
    details         JSONB,                  -- diff, old/new values, metadata
    ip_address      INET,
    user_agent      TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_events_tenant_date ON audit_events(tenant_id, created_at DESC);
CREATE INDEX idx_audit_events_user ON audit_events(tenant_id, user_id);
CREATE INDEX idx_audit_events_action ON audit_events(tenant_id, action);
CREATE INDEX idx_audit_events_target ON audit_events(tenant_id, target_type, target_id);
```

**Action catalog:**

| Action | Target Type | Description |
|--------|-------------|-------------|
| `CREATE_AGENT` | AGENT | New agent configuration created |
| `UPDATE_AGENT` | AGENT | Agent configuration modified (details contains diff) |
| `DELETE_AGENT` | AGENT | Agent soft-deleted |
| `RESTORE_AGENT` | AGENT | Agent restored from soft-delete |
| `PUBLISH_TEMPLATE` | TEMPLATE | Agent published to gallery |
| `UNPUBLISH_TEMPLATE` | TEMPLATE | Agent removed from gallery |
| `APPROVE_PUBLISH` | TEMPLATE | Reviewer approved publish submission |
| `REJECT_PUBLISH` | TEMPLATE | Reviewer rejected publish submission |
| `CREATE_SKILL` | SKILL | New skill definition created |
| `UPDATE_SKILL` | SKILL | Skill definition modified |
| `DELETE_SKILL` | SKILL | Skill definition removed |
| `CREATE_KNOWLEDGE_SOURCE` | KNOWLEDGE_SOURCE | Knowledge source registered |
| `REINDEX_KNOWLEDGE_SOURCE` | KNOWLEDGE_SOURCE | Knowledge source reindexed |
| `DELETE_KNOWLEDGE_SOURCE` | KNOWLEDGE_SOURCE | Knowledge source removed |
| `IMPORT_AGENT` | AGENT | Agent configuration imported from JSON/YAML |
| `EXPORT_AGENT` | AGENT | Agent configuration exported |
| `ROLLBACK_AGENT` | AGENT | Agent rolled back to previous version |
| `PIPELINE_COMPLETED` | PIPELINE_RUN | Pipeline run completed (details contains summary) |
| `PIPELINE_FAILED` | PIPELINE_RUN | Pipeline run failed (details contains error) |

#### 3.11.1 PLATFORM_ADMIN Auditable Actions [PLANNED]

> **Status:** [PLANNED] -- Not yet implemented. Addresses Gap 9 (Admin Audit Trail Specification) from superadmin gap analysis.
> **Source:** PRD Section 7.2.1, Business Rules BR-100, BR-104, BR-112.

The following PLATFORM_ADMIN-specific actions extend the `audit_events` action catalog above. These actions are performed exclusively from the master tenant context (tenant_id = `00000000-0000-0000-0000-000000000000`) and target other tenants or platform-wide configurations.

**PLATFORM_ADMIN audit entry schema (extends `audit_events.details` JSONB):**

| Field | Type | Description |
|-------|------|-------------|
| `actor_id` | UUID | PLATFORM_ADMIN user ID |
| `actor_role` | VARCHAR | Always `PLATFORM_ADMIN` |
| `target_tenant_id` | UUID | Tenant affected by the action (NULL for platform-wide actions) |
| `action_type` | VARCHAR | One of the actions listed below |
| `before_state` | JSONB | State before the action (NULL for create actions) |
| `after_state` | JSONB | State after the action |
| `justification` | TEXT | Optional human-readable reason (MANDATORY for suspension and override actions per BR-112) |
| `ip_address` | INET | IP address of the PLATFORM_ADMIN at action time |
| `timestamp` | TIMESTAMPTZ | Immutable action timestamp |

**Auditable PLATFORM_ADMIN actions:**

| Action Type | Target Type | Before State | After State | Justification Required | Description |
|-------------|-------------|-------------|------------|----------------------|-------------|
| `TENANT_PROVISIONED` | TENANT | `null` | `{ "tenant_id": "...", "name": "...", "org_id": "...", "schema": "tenant_{uuid}", "ethics_version": "v1.0", "maturity_level": "COACHING" }` | No | New tenant created with schema, ethics, and maturity baseline |
| `TENANT_SUSPENDED` | TENANT | `{ "status": "ACTIVE", "super_agent_status": "ENABLED" }` | `{ "status": "SUSPENDED", "suspended_agents": N, "suspended_workers": N, "paused_triggers": N }` | **Yes** (BR-112) | Tenant Super Agent suspended with cascading impact |
| `TENANT_REACTIVATED` | TENANT | `{ "status": "SUSPENDED" }` | `{ "status": "ACTIVE", "super_agent_status": "ENABLED", "resumed_triggers": N }` | No | Tenant Super Agent reactivated |
| `AGENT_SUSPENDED` | AGENT | `{ "agent_id": "...", "tenant_id": "...", "status": "ACTIVE", "agent_type": "SUB_ORCHESTRATOR" }` | `{ "agent_id": "...", "tenant_id": "...", "status": "SUSPENDED" }` | **Yes** | Individual agent suspended by PLATFORM_ADMIN |
| `AGENT_REACTIVATED` | AGENT | `{ "agent_id": "...", "status": "SUSPENDED" }` | `{ "agent_id": "...", "status": "ACTIVE" }` | No | Individual agent reactivated |
| `SUPER_AGENT_ENABLED` | SUPER_AGENT | `{ "tenant_id": "...", "status": "DISABLED" }` | `{ "tenant_id": "...", "status": "ENABLED", "cloned_from": "platform_template_v1.0" }` | No | Super Agent enabled for tenant (clone-on-setup if first time) |
| `SUPER_AGENT_DISABLED` | SUPER_AGENT | `{ "tenant_id": "...", "status": "ENABLED", "active_workers": N }` | `{ "tenant_id": "...", "status": "DISABLED", "terminated_tasks": N, "paused_triggers": N }` | No | Super Agent disabled for tenant |
| `ETHICS_BASELINE_UPDATED` | ETHICS_POLICY | `{ "rule_id": "ETH-001", "version": "v1.0", "sensitivity": 0.85 }` | `{ "rule_id": "ETH-001", "version": "v1.1", "sensitivity": 0.90 }` | **Yes** | Platform ethics baseline rule modified |
| `BENCHMARK_OPT_OUT_TOGGLED` | BENCHMARK_CONFIG | `{ "tenant_id": "...", "opted_in": true }` | `{ "tenant_id": "...", "opted_in": false, "exclusion_effective_date": "2026-03-09" }` | No | Tenant benchmark participation toggled |
| `HITL_ESCALATION_OVERRIDE` | APPROVAL_CHECKPOINT | `{ "checkpoint_id": "...", "status": "PENDING", "tenant_id": "...", "agent_id": "..." }` | `{ "checkpoint_id": "...", "status": "OVERRIDDEN", "decision": "APPROVE", "overridden_by": "PLATFORM_ADMIN" }` | **Yes** | PLATFORM_ADMIN overrides a pending HITL approval |
| `MATURITY_SCORE_ADJUSTED` | AGENT_MATURITY | `{ "agent_id": "...", "tenant_id": "...", "dimension": "accuracy", "score": 65 }` | `{ "agent_id": "...", "tenant_id": "...", "dimension": "accuracy", "score": 72, "adjusted_by": "PLATFORM_ADMIN" }` | **Yes** | Manual maturity score adjustment |

**Immutability guarantees:**

- Audit entries are append-only; no UPDATE or DELETE operations are permitted on `audit_events` rows
- Database-level protection: the application role for audit writes has INSERT privilege only (no UPDATE/DELETE)
- Admin audit entries are retained for a minimum of 7 years per regulatory compliance (BR-104)
- A `PLATFORM_ADMIN` cannot edit, redact, or delete any audit entry, including their own

**Index support for admin audit queries:**

```sql
-- V__add_admin_audit_indexes.sql (ai-service) [PLANNED]
-- Optimizes admin audit trail queries from the master tenant dashboard
CREATE INDEX idx_audit_events_admin_role ON audit_events(tenant_id, created_at DESC)
    WHERE action IN ('TENANT_PROVISIONED', 'TENANT_SUSPENDED', 'TENANT_REACTIVATED',
                     'AGENT_SUSPENDED', 'AGENT_REACTIVATED', 'SUPER_AGENT_ENABLED',
                     'SUPER_AGENT_DISABLED', 'ETHICS_BASELINE_UPDATED',
                     'BENCHMARK_OPT_OUT_TOGGLED', 'HITL_ESCALATION_OVERRIDE',
                     'MATURITY_SCORE_ADJUSTED');
```

### 3.12 Agent Publish Submissions Table (`agent_publish_submissions`) [PLANNED]

<!-- Addresses P1: Gallery publish review queue -->

**Status:** [PLANNED] -- Not yet implemented. Provides a review queue for agents submitted for gallery publication.

The `agent_publish_submissions` table manages the review workflow when users submit agent configurations for publication to the Template Gallery. Submissions require reviewer approval before the agent becomes visible in the gallery.

```sql
-- V14__create_agent_publish_submissions.sql (agent-orchestrator)
CREATE TABLE agent_publish_submissions (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id           UUID NOT NULL, -- Application-enforced FK to tenant-service.tenants(id); cross-database FK not possible in PostgreSQL
    agent_config_id     UUID NOT NULL REFERENCES agent_templates(id),
    submitted_by        UUID NOT NULL,
    reviewer_id         UUID,
    status              VARCHAR(20) NOT NULL DEFAULT 'PENDING',  -- PENDING, APPROVED, REJECTED
    submission_notes    TEXT,
    review_feedback     TEXT,
    submitted_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    reviewed_at         TIMESTAMPTZ,
    CONSTRAINT chk_publish_status CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED'))
);

CREATE INDEX idx_publish_submissions_tenant_status
    ON agent_publish_submissions(tenant_id, status);
CREATE INDEX idx_publish_submissions_agent
    ON agent_publish_submissions(agent_config_id);
CREATE INDEX idx_publish_submissions_reviewer
    ON agent_publish_submissions(reviewer_id)
    WHERE reviewer_id IS NOT NULL;
```

### 3.13 Knowledge Sources Table (`knowledge_sources`) [PLANNED]

<!-- Addresses P1: RAG knowledge management -->

**Status:** [PLANNED] -- Not yet implemented. Provides metadata management for RAG knowledge sources linked to agent configurations.

The `knowledge_sources` table stores metadata about document collections available for RAG retrieval. Each source tracks its ingestion pipeline status, document/chunk counts, and chunking configuration. The actual vector embeddings remain in the `vector_store` table; this table manages the source-level metadata and lifecycle.

```sql
-- V15__create_knowledge_sources.sql (agent-orchestrator)
CREATE TABLE knowledge_sources (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID NOT NULL, -- Application-enforced FK to tenant-service.tenants(id); cross-database FK not possible in PostgreSQL
    name            VARCHAR(255) NOT NULL,
    description     TEXT,
    source_type     VARCHAR(50) NOT NULL,   -- UPLOAD, URL, DATABASE, API
    status          VARCHAR(20) NOT NULL DEFAULT 'PENDING',  -- PENDING, INDEXING, READY, FAILED, STALE
    document_count  INTEGER DEFAULT 0,
    chunk_count     INTEGER DEFAULT 0,
    last_indexed_at TIMESTAMPTZ,
    config          JSONB,                  -- chunking strategy, embedding model, refresh schedule
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_source_type CHECK (source_type IN ('UPLOAD', 'URL', 'DATABASE', 'API')),
    CONSTRAINT chk_source_status CHECK (status IN ('PENDING', 'INDEXING', 'READY', 'FAILED', 'STALE'))
);

CREATE INDEX idx_knowledge_sources_tenant
    ON knowledge_sources(tenant_id);
CREATE INDEX idx_knowledge_sources_status
    ON knowledge_sources(tenant_id, status);
```

**Knowledge source lifecycle:**

```mermaid
stateDiagram-v2
    [*] --> PENDING: Create source
    PENDING --> INDEXING: Upload documents / Trigger index
    INDEXING --> READY: Indexing complete
    INDEXING --> FAILED: Indexing error
    FAILED --> INDEXING: Retry index
    READY --> STALE: Source data changed / Schedule triggered
    STALE --> INDEXING: Reindex
    READY --> [*]: Delete source
    FAILED --> [*]: Delete source
```

**Config JSONB structure:**

```json
{
  "chunking": {
    "strategy": "SENTENCE",
    "chunkSize": 512,
    "chunkOverlap": 50,
    "breakPriority": ["PARAGRAPH", "SENTENCE", "WORD"]
  },
  "embedding": {
    "model": "nomic-embed-text",
    "dimensions": 768
  },
  "refresh": {
    "schedule": "0 2 * * *",
    "autoReindex": true
  }
}
```

#### 3.13.1 Knowledge Source Error States and Retry [PLANNED]

**Status:** [PLANNED] -- Addresses P1 gap: no explicit FAILED_EXTRACTION and FAILED_EMBEDDING states in knowledge_sources status enum.
**Cross-Reference:** Section 7.9 (Embedding Provider Circuit Breaker), Section 4.9.1 (AI-EMB-001)

The existing knowledge_sources status enum (`PENDING, INDEXING, READY, FAILED, STALE`) is too coarse to distinguish between extraction failures (document parsing errors) and embedding failures (provider unavailable). The refined lifecycle adds two explicit failure states and a retry mechanism. [PLANNED]

**Refined status enum:**

```sql
-- Update knowledge_sources status constraint [PLANNED]
ALTER TABLE knowledge_sources
    DROP CONSTRAINT chk_source_status,
    ADD CONSTRAINT chk_source_status CHECK (status IN (
        'UPLOADING', 'EXTRACTING', 'EXTRACTED', 'EMBEDDING',
        'INDEXED', 'FAILED_EXTRACTION', 'FAILED_EMBEDDING',
        'STALE'
    ));

-- Add error detail column [PLANNED]
ALTER TABLE knowledge_sources ADD COLUMN error_message TEXT;
ALTER TABLE knowledge_sources ADD COLUMN retry_count INTEGER NOT NULL DEFAULT 0;
```

**Refined lifecycle state diagram:** [PLANNED]

```mermaid
stateDiagram-v2
    [*] --> UPLOADING: Create source + upload file
    UPLOADING --> EXTRACTING: File received, start text extraction

    EXTRACTING --> EXTRACTED: Text extraction complete
    EXTRACTING --> FAILED_EXTRACTION: Parse error (corrupt PDF, unsupported format)

    EXTRACTED --> EMBEDDING: Start vector embedding
    EMBEDDING --> INDEXED: All chunks embedded successfully
    EMBEDDING --> FAILED_EMBEDDING: Embedding provider unavailable (AI-EMB-001)

    FAILED_EXTRACTION --> EXTRACTING: Retry extraction
    FAILED_EMBEDDING --> EMBEDDING: Retry embedding (provider recovered)

    INDEXED --> STALE: Source data changed
    STALE --> EXTRACTING: Re-index triggered

    FAILED_EXTRACTION --> [*]: Delete source
    FAILED_EMBEDDING --> [*]: Delete source
    INDEXED --> [*]: Delete source
```

**Retry API endpoint:** [PLANNED]

```yaml
paths:
  /api/v1/ai/knowledge/{knowledgeSourceId}/retry:
    post:
      operationId: retryKnowledgeSourceProcessing
      summary: Retry failed extraction or embedding for a knowledge source [PLANNED]
      tags: [Knowledge]
      security:
        - bearerAuth: []
      parameters:
        - name: knowledgeSourceId
          in: path
          required: true
          schema:
            type: string
            format: uuid
      responses:
        '202':
          description: Retry initiated
        '409':
          description: Source not in a failed state
```

---

### 3.14 Notifications Table (`notifications`) [PLANNED]

<!-- Addresses P1: Notification center -->

**Status:** [PLANNED] -- Not yet implemented. Provides an in-app notification center for asynchronous user communication.

The `notifications` table stores per-user notifications for events such as training completions, agent evaluation results, publish approvals/rejections, and system alerts. Notifications support deep linking to the relevant screen and track read/unread status. A partial index on unread notifications ensures fast badge count queries.

```sql
-- V16__create_notifications.sql (agent-orchestrator)
CREATE TABLE notifications (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id   UUID NOT NULL, -- Application-enforced FK to tenant-service.tenants(id); cross-database FK not possible in PostgreSQL
    user_id     UUID NOT NULL,
    category    VARCHAR(50) NOT NULL,   -- TRAINING, AGENT, FEEDBACK, APPROVAL
    title       VARCHAR(255) NOT NULL,
    message     TEXT,
    link        VARCHAR(500),           -- deep link to related screen
    is_read     BOOLEAN DEFAULT FALSE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_notification_category CHECK (category IN (
        'TRAINING', 'AGENT', 'FEEDBACK', 'APPROVAL', 'SYSTEM', 'KNOWLEDGE'
    ))
);

CREATE INDEX idx_notifications_user_unread
    ON notifications(tenant_id, user_id, is_read)
    WHERE is_read = FALSE;
CREATE INDEX idx_notifications_user_date
    ON notifications(tenant_id, user_id, created_at DESC);
```

**Notification category descriptions:**

| Category | Trigger Events | Example |
|----------|---------------|---------|
| `TRAINING` | Training job completed, model evaluation finished | "Training job TRN-042 completed with 94.2% accuracy" |
| `AGENT` | Agent created, deleted, restored, version rolled back | "Agent 'Sales Assistant' was soft-deleted" |
| `FEEDBACK` | Feedback threshold reached, correction submitted | "Agent 'Code Reviewer' received 10 new corrections" |
| `APPROVAL` | Publish submission approved/rejected | "Your agent 'Data Analyst Pro' was approved for gallery" |
| `SYSTEM` | System maintenance, quota warnings | "Your tenant is at 90% of the agent configuration limit" |
| `KNOWLEDGE` | Knowledge source indexed, failed, stale | "Knowledge source 'Product Docs' indexing failed" |

### 3.15 Agent Configuration Lifecycle State Diagram [PLANNED]

<!-- Addresses P0: Agent lifecycle management with soft delete and publish workflow -->

**Status:** [PLANNED] -- Not yet implemented. Defines the formal state machine for agent configuration lifecycle, including soft delete and gallery publication.

The agent configuration lifecycle extends the existing `agent_templates.status` column (Section 3.10) with additional states for the publish review workflow and soft delete. This requires updating the `chk_template_status` constraint on the `agent_templates` table.

**Updated status constraint:**

```sql
-- V17__update_agent_template_status.sql (agent-orchestrator)
ALTER TABLE agent_templates
    DROP CONSTRAINT chk_template_status;

ALTER TABLE agent_templates
    ADD CONSTRAINT chk_template_status CHECK (status IN (
        'DRAFT', 'ACTIVE', 'SUBMITTED_FOR_REVIEW', 'PUBLISHED', 'REJECTED',
        'SOFT_DELETED', 'PERMANENTLY_DELETED', 'DEPRECATED', 'RETIRED'
    ));

ALTER TABLE agent_templates
    ADD COLUMN deleted_at TIMESTAMPTZ,
    ADD COLUMN previous_status VARCHAR(20);
```

**Lifecycle state diagram:**

```mermaid
stateDiagram-v2
    [*] --> DRAFT: Create / Fork

    DRAFT --> ACTIVE: Activate
    ACTIVE --> SUBMITTED_FOR_REVIEW: Submit for gallery publish
    SUBMITTED_FOR_REVIEW --> PUBLISHED: Reviewer approves
    SUBMITTED_FOR_REVIEW --> REJECTED: Reviewer rejects
    REJECTED --> DRAFT: Revise and resubmit

    PUBLISHED --> ACTIVE: Unpublish from gallery
    ACTIVE --> DRAFT: Major revision

    state soft_delete <<choice>>
    DRAFT --> soft_delete: Soft delete
    ACTIVE --> soft_delete: Soft delete
    PUBLISHED --> soft_delete: Soft delete
    REJECTED --> soft_delete: Soft delete
    soft_delete --> SOFT_DELETED: Record previous_status + deleted_at

    SOFT_DELETED --> DRAFT: Restore (if previous was DRAFT)
    SOFT_DELETED --> ACTIVE: Restore (if previous was ACTIVE)
    SOFT_DELETED --> PERMANENTLY_DELETED: 30-day retention expired
    PERMANENTLY_DELETED --> [*]
```

**State transition rules:**

| From State | To State | Trigger | Side Effects |
|------------|----------|---------|-------------|
| DRAFT | ACTIVE | User activates | Agent available for use |
| ACTIVE | SUBMITTED_FOR_REVIEW | User submits for publish | Creates `agent_publish_submissions` record |
| SUBMITTED_FOR_REVIEW | PUBLISHED | Reviewer approves | Sets `gallery_visible = true`, creates audit event |
| SUBMITTED_FOR_REVIEW | REJECTED | Reviewer rejects | Records feedback in submission, creates audit event |
| REJECTED | DRAFT | User revises | Clears rejection, allows resubmission |
| PUBLISHED | ACTIVE | User unpublishes | Sets `gallery_visible = false` |
| Any | SOFT_DELETED | User deletes | Sets `deleted_at = NOW()`, stores `previous_status` |
| SOFT_DELETED | Previous state | User restores | Clears `deleted_at`, restores `previous_status` |
| SOFT_DELETED | PERMANENTLY_DELETED | 30-day cron job | Cascades to delete skills/tools junctions, audit event |

### 3.16 Super Agents Table (`super_agents`) [PLANNED]

> **Source:** BA Domain Model entity #1 (SuperAgent), ADR-023 (Hierarchical Architecture), ADR-026 (Schema-per-Tenant).
> **Status:** [PLANNED] -- Stored in tenant schema (`tenant_{uuid}.super_agents`).

```mermaid
erDiagram
    SUPER_AGENTS ||--o{ SUB_ORCHESTRATORS : "coordinates"
    SUPER_AGENTS ||--|| AGENT_MATURITY_SCORES : "has maturity"
    SUPER_AGENTS {
        uuid id PK
        uuid tenant_id FK "NOT NULL"
        string name "NOT NULL, max 255"
        text description
        string status "NOT NULL, DEFAULT 'ACTIVE'"
        jsonb routing_config "Static + dynamic routing rules"
        jsonb default_prompt_blocks "Default identity prompt block IDs"
        integer max_concurrent_orchestrators "DEFAULT 5"
        integer max_concurrent_workers "DEFAULT 20"
        uuid ethics_policy_id FK "Tenant conduct/ethics policy"
        bigint version "NOT NULL, DEFAULT 0 (@Version)"
        timestamp created_at "NOT NULL"
        timestamp updated_at "NOT NULL"
        uuid created_by FK
        uuid updated_by FK
    }
```

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PK, NOT NULL | Primary key |
| tenant_id | UUID | FK, NOT NULL | Tenant reference (also schema boundary) |
| name | VARCHAR(255) | NOT NULL | Display name |
| description | TEXT | | Purpose description |
| status | VARCHAR(50) | NOT NULL, DEFAULT 'ACTIVE' | Active, Suspended, Decommissioned |
| routing_config | JSONB | | Static keyword rules + dynamic routing thresholds |
| default_prompt_blocks | JSONB | | Array of default prompt block IDs for identity |
| max_concurrent_orchestrators | INTEGER | DEFAULT 5 | Maximum concurrent sub-orchestrators |
| max_concurrent_workers | INTEGER | DEFAULT 20 | Maximum concurrent workers across all sub-orchestrators |
| ethics_policy_id | UUID | FK | Reference to tenant conduct policies or ethics baseline |
| version | BIGINT | NOT NULL, DEFAULT 0 | Optimistic locking |
| created_at | TIMESTAMP | NOT NULL | Creation timestamp (UTC) |
| updated_at | TIMESTAMP | NOT NULL | Last update timestamp (UTC) |
| created_by | UUID | FK | Creator user reference |
| updated_by | UUID | FK | Last updater reference |

**Business rules:** One SuperAgent per tenant. Status transitions: Active -> Suspended -> Active, Active -> Decommissioned (terminal).

---

### 3.17 Sub-Orchestrators Table (`sub_orchestrators`) [PLANNED]

> **Source:** BA Domain Model entity #2 (SubOrchestrator), ADR-023.
> **Status:** [PLANNED]

```mermaid
erDiagram
    SUB_ORCHESTRATORS ||--o{ WORKERS : "manages"
    SUB_ORCHESTRATORS }o--|| SUPER_AGENTS : "coordinated by"
    SUB_ORCHESTRATORS ||--|| AGENT_MATURITY_SCORES : "has maturity"
    SUB_ORCHESTRATORS {
        uuid id PK
        uuid tenant_id FK "NOT NULL"
        uuid super_agent_id FK "NOT NULL"
        string name "NOT NULL, max 255"
        string domain_type "NOT NULL (EA, PERF, GRC, KM, SD)"
        text description
        string status "NOT NULL, DEFAULT 'ACTIVE'"
        jsonb planning_rules "Domain-specific task decomposition rules"
        jsonb quality_criteria "Domain-specific quality gates"
        bigint version "NOT NULL, DEFAULT 0"
        timestamp created_at "NOT NULL"
        timestamp updated_at "NOT NULL"
        uuid created_by FK
        uuid updated_by FK
    }
```

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PK, NOT NULL | Primary key |
| tenant_id | UUID | FK, NOT NULL | Tenant reference |
| super_agent_id | UUID | FK, NOT NULL | Parent SuperAgent |
| name | VARCHAR(255) | NOT NULL | Display name |
| domain_type | VARCHAR(50) | NOT NULL | EA, PERF, GRC, KM, SD |
| description | TEXT | | Domain purpose description |
| status | VARCHAR(50) | NOT NULL, DEFAULT 'ACTIVE' | Active, Suspended, Decommissioned |
| planning_rules | JSONB | | Domain-specific task decomposition rules |
| quality_criteria | JSONB | | Domain-specific quality gate definitions |
| version | BIGINT | NOT NULL, DEFAULT 0 | Optimistic locking |
| created_at / updated_at | TIMESTAMP | NOT NULL | Audit timestamps |
| created_by / updated_by | UUID | FK | Audit user references |

---

### 3.18 Workers Table (`workers`) [PLANNED]

> **Source:** BA Domain Model entity #3 (Worker), ADR-023.
> **Status:** [PLANNED]

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PK, NOT NULL | Primary key |
| tenant_id | UUID | FK, NOT NULL | Tenant reference |
| sub_orchestrator_id | UUID | FK, NOT NULL | Parent SubOrchestrator |
| name | VARCHAR(255) | NOT NULL | Display name |
| capability_type | VARCHAR(50) | NOT NULL | DATA_QUERY, ANALYSIS, CALCULATION, REPORT, NOTIFICATION |
| description | TEXT | | Capability description |
| status | VARCHAR(50) | NOT NULL, DEFAULT 'ACTIVE' | Active, Suspended, Decommissioned |
| tool_config | JSONB | | Authorized tools configuration |
| version | BIGINT | NOT NULL, DEFAULT 0 | Optimistic locking |
| created_at / updated_at | TIMESTAMP | NOT NULL | Audit timestamps |
| created_by / updated_by | UUID | FK | Audit user references |

---

### 3.19 Agent Maturity Scores Table (`agent_maturity_scores`) [PLANNED]

> **Source:** BA Domain Model entity #4 (AgentMaturityProfile), ADR-024 (Agent Maturity Model).
> **Status:** [PLANNED]

```mermaid
erDiagram
    AGENT_MATURITY_SCORES ||--o{ ATS_SCORE_HISTORY : "tracks history"
    AGENT_MATURITY_SCORES {
        uuid id PK
        uuid agent_id FK "NOT NULL, UNIQUE per tenant"
        uuid tenant_id FK "NOT NULL"
        string agent_type "SUPER_AGENT, SUB_ORCHESTRATOR, WORKER"
        string maturity_level "NOT NULL (COACHING, CO_PILOT, PILOT, GRADUATE)"
        float composite_ats "NOT NULL, 0.0-100.0"
        float identity_score "NOT NULL, 0.0-100.0"
        float competence_score "NOT NULL, 0.0-100.0"
        float reliability_score "NOT NULL, 0.0-100.0"
        float compliance_score "NOT NULL, 0.0-100.0"
        float alignment_score "NOT NULL, 0.0-100.0"
        integer tasks_completed "NOT NULL, DEFAULT 0"
        date level_achieved_date "When current level was reached"
        date promotion_eligible_date "Earliest possible promotion"
        bigint version "NOT NULL, DEFAULT 0"
        timestamp created_at "NOT NULL"
        timestamp updated_at "NOT NULL"
    }
```

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PK, NOT NULL | Primary key |
| agent_id | UUID | FK, NOT NULL, UNIQUE per tenant | Reference to super_agent, sub_orchestrator, or worker |
| tenant_id | UUID | FK, NOT NULL | Tenant reference |
| agent_type | VARCHAR(50) | NOT NULL | SUPER_AGENT, SUB_ORCHESTRATOR, WORKER |
| maturity_level | VARCHAR(50) | NOT NULL | COACHING, CO_PILOT, PILOT, GRADUATE |
| composite_ats | FLOAT | NOT NULL | Composite ATS score (0-100) |
| identity_score | FLOAT | NOT NULL | Identity dimension (weight 20%) |
| competence_score | FLOAT | NOT NULL | Competence dimension (weight 25%) |
| reliability_score | FLOAT | NOT NULL | Reliability dimension (weight 25%) |
| compliance_score | FLOAT | NOT NULL | Compliance dimension (weight 15%) |
| alignment_score | FLOAT | NOT NULL | Alignment dimension (weight 15%) |
| tasks_completed | INTEGER | NOT NULL, DEFAULT 0 | Total completed tasks |
| level_achieved_date | DATE | | When current level was reached |
| promotion_eligible_date | DATE | | Earliest promotion date (30 days sustained) |
| version | BIGINT | NOT NULL, DEFAULT 0 | Optimistic locking |

> **Polymorphic FK strategy for `agent_id`:** The `agent_id` column references one of three tables: `super_agents`, `sub_orchestrators`, or `workers`. Since PostgreSQL does not support polymorphic foreign keys, the reference is **application-enforced** with a discriminator column `agent_type VARCHAR(50) CHECK IN ('SUPER_AGENT', 'SUB_ORCHESTRATOR', 'WORKER')`. The application layer validates that `agent_id` exists in the correct table based on `agent_type` before insert/update. A composite unique constraint `UNIQUE(agent_id, tenant_id)` prevents duplicate maturity records per agent within a tenant. This approach was chosen over separate FK columns (one per target table) because: (a) the ATS scoring algorithm is agent-type-agnostic, (b) it avoids N nullable FK columns, and (c) it simplifies the query path for maturity dashboards.

#### 3.19.1 ATS Evaluation Minimum Data Requirements [PLANNED]

**Status:** [PLANNED] -- Addresses P2 gap: no minimum sample size before ATS scores are considered statistically valid.
**Cross-Reference:** ADR-024 (Agent Maturity Model), Section 4.13 (Agent Maturity API)

Before the ATS evaluation engine calculates dimension scores, it verifies that sufficient data exists for each dimension. If the minimum data threshold is not met, the dimension score is `NULL`, the composite score is not calculated, and the maturity level defaults to `COACHING`. [PLANNED]

**Minimum data thresholds per ATS dimension:**

| Dimension | Minimum Events Required | Data Source | Rationale |
|-----------|------------------------|-------------|-----------|
| Identity (20%) | >= 10 authentication events | Agent identity verification logs | Need enough auth events to establish identity consistency |
| Competence (25%) | >= 25 completed tasks | `worker_tasks` WHERE `status = 'COMPLETED'` | Statistical significance for task success rate |
| Reliability (25%) | >= 50 task executions | `worker_tasks` (all statuses) | Need sufficient sample for mean/variance of latency, error rate |
| Compliance (15%) | >= 10 ethics checks | `policy_violations` + ethics evaluation logs | Minimum policy evaluations to assess compliance pattern |
| Alignment (15%) | >= 15 feedback data points | `feedback_entries` linked to agent traces | Minimum user feedback for meaningful alignment score |

**Evaluation behavior when minimums are not met:** [PLANNED]

```
IF any dimension has insufficient data:
  - That dimension's score = NULL
  - composite_ats = NULL (cannot compute weighted average with NULLs)
  - maturity_level = 'COACHING' (default, lowest level)
  - promotion_eligible_date = NULL (cannot promote without valid scores)
  - API response includes: insufficientDataDimensions: ["IDENTITY", "COMPETENCE"]
```

---

#### 3.19.2 Maturity Level Change Cooldown [PLANNED]

**Status:** [PLANNED] -- Addresses P2 gap: no cooldown period after promotion/demotion to prevent oscillation.
**Cross-Reference:** ADR-024, Section 4.13 (Maturity API `/promote` endpoint)

After any maturity level change (promotion or demotion), a cooldown period applies during which automatic level changes are suppressed. This prevents rapid oscillation between levels when scores hover near thresholds. [PLANNED]

**Cooldown rules:**

| Change Type | Cooldown Duration | Rationale |
|-------------|-------------------|-----------|
| Promotion (e.g., COACHING -> CO_PILOT) | 7 days (configurable) | Allow time to validate agent at new level |
| Demotion (e.g., PILOT -> CO_PILOT) | 3 days (configurable) | Shorter to allow quick recovery after correction |
| PLATFORM_ADMIN manual override | 0 days (bypass) | Emergency changes; audited in audit trail |

**Schema extension:** [PLANNED]

```sql
-- Add cooldown columns to agent_maturity_scores [PLANNED]
ALTER TABLE agent_maturity_scores
    ADD COLUMN last_level_change_at TIMESTAMPTZ,
    ADD COLUMN cooldown_until TIMESTAMPTZ;
```

**Cooldown enforcement logic:** [PLANNED]

```
ON promotion/demotion request:
  IF NOW() < cooldown_until AND requester != PLATFORM_ADMIN:
    RETURN 409 "Level change cooldown active until {cooldown_until}"
  ELSE:
    Apply level change
    SET last_level_change_at = NOW()
    IF promotion:
      SET cooldown_until = NOW() + INTERVAL '7 days'
    ELSE IF demotion:
      SET cooldown_until = NOW() + INTERVAL '3 days'
    LOG: maturity_level_change {old, new, cooldown_until, override=false}
```

---

#### 3.19.3 ATS Score Precision and Boundary Rules [PLANNED]

**Status:** [PLANNED] -- Addresses P2 gap: no precision specification for ATS scores and ambiguous threshold boundaries.
**Cross-Reference:** ADR-024, Section 3.19 (agent_maturity_scores table)

**Score storage type:** All ATS scores (composite and per-dimension) are stored as `NUMERIC(5,2)` instead of `FLOAT` to avoid floating-point precision errors at threshold boundaries. [PLANNED]

```sql
-- Alter score columns from FLOAT to NUMERIC(5,2) [PLANNED]
ALTER TABLE agent_maturity_scores
    ALTER COLUMN composite_ats TYPE NUMERIC(5,2),
    ALTER COLUMN identity_score TYPE NUMERIC(5,2),
    ALTER COLUMN competence_score TYPE NUMERIC(5,2),
    ALTER COLUMN reliability_score TYPE NUMERIC(5,2),
    ALTER COLUMN compliance_score TYPE NUMERIC(5,2),
    ALTER COLUMN alignment_score TYPE NUMERIC(5,2);
```

**Maturity level thresholds (inclusive lower bound):** [PLANNED]

| Maturity Level | Score Range | Threshold Comparison |
|----------------|-------------|---------------------|
| COACHING | 0.00 -- 39.99 | `composite_ats < 40.00` |
| CO_PILOT | 40.00 -- 64.99 | `composite_ats >= 40.00 AND composite_ats < 65.00` |
| PILOT | 65.00 -- 84.99 | `composite_ats >= 65.00 AND composite_ats < 85.00` |
| GRADUATE | 85.00 -- 100.00 | `composite_ats >= 85.00` |

**Rounding strategy:** All scores are rounded to 2 decimal places using `HALF_UP` rounding (Java `RoundingMode.HALF_UP`). Example: 64.995 rounds to 65.00 (promotion to PILOT), 64.994 rounds to 64.99 (remains CO_PILOT). [PLANNED]

---

### 3.20 ATS Score History Table (`ats_score_history`) [PLANNED]

> **Source:** BA Domain Model entity #6 (ATSScoreHistory), ADR-024.
> **Status:** [PLANNED] -- Append-only table.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PK, NOT NULL | Primary key |
| maturity_score_id | UUID | FK, NOT NULL | Reference to agent_maturity_scores |
| tenant_id | UUID | FK, NOT NULL | Tenant reference |
| composite_ats | FLOAT | NOT NULL | Composite score at recording time |
| identity_score | FLOAT | NOT NULL | Identity dimension score |
| competence_score | FLOAT | NOT NULL | Competence dimension score |
| reliability_score | FLOAT | NOT NULL | Reliability dimension score |
| compliance_score | FLOAT | NOT NULL | Compliance dimension score |
| alignment_score | FLOAT | NOT NULL | Alignment dimension score |
| measurement_period | VARCHAR(50) | NOT NULL | daily, weekly, monthly |
| recorded_at | TIMESTAMP | NOT NULL | When this snapshot was recorded |

---

### 3.20b Worker Tasks Table (`worker_tasks`) [PLANNED]

> **Source:** Supports `worker_drafts.task_id` FK -- provides task tracking for worker execution assignments.
> **Status:** [PLANNED]

```sql
-- V__create_worker_tasks.sql (ai-service, tenant_{uuid} schema) [PLANNED]
CREATE TABLE worker_tasks (
    id              UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    worker_id       UUID NOT NULL, -- FK to workers (application-enforced)
    tenant_id       UUID NOT NULL, -- Application-enforced FK to tenant-service
    task_type       VARCHAR(50) NOT NULL, -- DATA_QUERY, ANALYSIS, CALCULATION, REPORT, NOTIFICATION
    payload         JSONB, -- Task input payload (prompt, parameters, context)
    status          VARCHAR(20) NOT NULL DEFAULT 'PENDING', -- PENDING, RUNNING, COMPLETED, FAILED, CANCELLED
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    completed_at    TIMESTAMP WITH TIME ZONE,
    CONSTRAINT chk_worker_task_status CHECK (status IN (
        'PENDING', 'RUNNING', 'COMPLETED', 'FAILED', 'CANCELLED'
    ))
);

CREATE INDEX idx_worker_tasks_worker_status ON worker_tasks(worker_id, status);
CREATE INDEX idx_worker_tasks_tenant ON worker_tasks(tenant_id, created_at DESC);
```

---

### 3.21 Worker Drafts Table (`worker_drafts`) [PLANNED]

> **Source:** BA Domain Model entity #14 (WorkerDraft), ADR-028 (Worker Sandbox).
> **Status:** [PLANNED]

```mermaid
erDiagram
    WORKER_DRAFTS ||--o{ DRAFT_REVIEWS : "reviewed by"
    WORKER_DRAFTS }o--|| WORKERS : "produced by"
    WORKER_DRAFTS {
        uuid id PK
        uuid worker_id FK "NOT NULL"
        uuid task_id FK "NOT NULL"
        uuid tenant_id FK "NOT NULL"
        integer draft_version "NOT NULL, DEFAULT 1"
        jsonb content "Draft output content"
        jsonb context "Input context (prompt, RAG results)"
        string status "NOT NULL (DRAFT, UNDER_REVIEW, APPROVED, etc.)"
        string risk_level "NOT NULL (LOW, MEDIUM, HIGH, CRITICAL)"
        float confidence_score "0.0-1.0"
        string reviewer_type "AUTO, SUB_ORCHESTRATOR, HUMAN"
        uuid reviewer_id FK
        text review_feedback
        timestamp created_at "NOT NULL"
        timestamp reviewed_at
        timestamp committed_at
    }
```

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PK, NOT NULL | Primary key |
| worker_id | UUID | FK, NOT NULL | Worker that produced the draft |
| task_id | UUID | FK -> worker_tasks, NOT NULL | Originating task (see Section 3.20b) |
| tenant_id | UUID | FK, NOT NULL | Tenant reference |
| draft_version | INTEGER | NOT NULL, DEFAULT 1 | Version number (increments on revision) |
| content | JSONB | NOT NULL | Draft output content |
| context | JSONB | | Input context (prompt, RAG results, reasoning) |
| status | VARCHAR(50) | NOT NULL | DRAFT, UNDER_REVIEW, REVISION_REQUESTED, APPROVED, COMMITTED, REJECTED |
| risk_level | VARCHAR(50) | NOT NULL | LOW, MEDIUM, HIGH, CRITICAL |
| confidence_score | FLOAT | | Worker self-assessed confidence (0.0-1.0) |
| reviewer_type | VARCHAR(50) | | AUTO, SUB_ORCHESTRATOR, HUMAN |
| reviewer_id | UUID | FK | ID of reviewer (agent or user) |
| review_feedback | TEXT | | Feedback for REVISION_REQUESTED |
| created_at | TIMESTAMP | NOT NULL | Draft creation time |
| reviewed_at | TIMESTAMP | | Review completion time |
| committed_at | TIMESTAMP | | Commit time (output delivered) |

**Business rules:** Append-only versioning -- revised drafts create new rows with incremented `draft_version`. Original drafts are never modified (EU AI Act Article 12).

---

### 3.22 Draft Reviews Table (`draft_reviews`) [PLANNED]

> **Source:** BA Domain Model entity #15 (DraftReview), ADR-028.
> **Status:** [PLANNED]

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PK, NOT NULL | Primary key |
| draft_id | UUID | FK, NOT NULL | Reference to worker_drafts |
| tenant_id | UUID | FK, NOT NULL | Tenant reference |
| reviewer_type | VARCHAR(50) | NOT NULL | AUTO, SUB_ORCHESTRATOR, HUMAN |
| reviewer_id | UUID | FK | Reviewer identity |
| decision | VARCHAR(50) | NOT NULL | APPROVED, REJECTED, REVISION_REQUESTED |
| feedback | TEXT | | Qualitative feedback |
| quality_score | FLOAT | | Domain-specific quality assessment (0.0-1.0) |
| reviewed_at | TIMESTAMP | NOT NULL | Review completion time |

---

### 3.23 Approval Checkpoints Table (`approval_checkpoints`) [PLANNED]

> **Source:** BA Domain Model entity #20 (ApprovalCheckpoint), ADR-030 (HITL).
> **Status:** [PLANNED]

```mermaid
erDiagram
    APPROVAL_CHECKPOINTS ||--o| APPROVAL_DECISIONS : "resolved by"
    APPROVAL_CHECKPOINTS }o--|| WORKER_DRAFTS : "for draft"
    APPROVAL_CHECKPOINTS }o--|| ESCALATION_RULES : "governed by"
    APPROVAL_CHECKPOINTS {
        uuid id PK
        uuid draft_id FK "NOT NULL"
        uuid tenant_id FK "NOT NULL"
        string checkpoint_type "CONFIRMATION, DATA_ENTRY, REVIEW, TAKEOVER"
        string status "PENDING, COMPLETED, EXPIRED, ESCALATED"
        string risk_level "LOW, MEDIUM, HIGH, CRITICAL"
        uuid assigned_to FK "User ID of assigned reviewer"
        timestamp deadline "Timeout deadline"
        integer escalation_count "DEFAULT 0"
        timestamp created_at "NOT NULL"
        timestamp completed_at
    }

    APPROVAL_DECISIONS {
        uuid id PK
        uuid checkpoint_id FK "NOT NULL"
        uuid tenant_id FK "NOT NULL"
        string decision_type "APPROVED, REJECTED, DATA_PROVIDED, TAKEN_OVER"
        text decision_reason
        uuid decided_by FK "User who decided"
        jsonb modified_content "If reviewer modified the output"
        string decision_signature "HMAC-SHA256 digital signature"
        timestamp decided_at "NOT NULL"
    }

    ESCALATION_RULES {
        uuid id PK
        uuid tenant_id FK "NOT NULL"
        string risk_level "NOT NULL"
        string maturity_level "NOT NULL"
        string hitl_type "CONFIRMATION, DATA_ENTRY, REVIEW, TAKEOVER"
        integer timeout_hours "Default timeout in hours"
        string escalation_target "Role or user ID"
        float confidence_threshold "Override threshold (default 0.5)"
        string status "ACTIVE, INACTIVE"
        timestamp created_at "NOT NULL"
        timestamp updated_at "NOT NULL"
    }
```

> **Approval digital signature (SEC-F08):** The `decision_signature` field in APPROVAL_DECISIONS stores an HMAC-SHA256 digest computed over `checkpoint_id || decision_type || decided_by || decided_at` using a per-tenant signing key stored in a vault (HashiCorp Vault or AWS KMS). This ensures non-repudiation: a tampered decision row will fail signature verification during compliance audit queries. The signing key is rotated quarterly; the key version is encoded in the signature prefix (e.g., `v1:hmac-sha256:...`). [PLANNED]

---

### 3.23b Event Sources Table (`event_sources`) [PLANNED]

> **Source:** ADR-025 (Event-Driven Agent Triggers). Provides event trigger configuration for source registration.
> **Status:** [PLANNED]

```sql
-- V__create_event_sources.sql (ai-service, tenant_{uuid} schema) [PLANNED]
CREATE TABLE event_sources (
    id              UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    tenant_id       UUID NOT NULL, -- Application-enforced FK to tenant-service
    source_type     VARCHAR(20) NOT NULL,
    source_config   JSONB NOT NULL, -- Source-specific configuration (e.g., entity type, webhook URL, cron)
    active          BOOLEAN NOT NULL DEFAULT true,
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_event_source_type CHECK (source_type IN (
        'ENTITY_LIFECYCLE', 'TIME_BASED', 'EXTERNAL_WEBHOOK', 'WORKFLOW_EVENT'
    ))
);

CREATE INDEX idx_event_sources_tenant_type_active
    ON event_sources(tenant_id, source_type, active);
```

---

### 3.23c Trigger Event Queue Table (`trigger_event_queue`) [PLANNED]

> **Source:** P1 gap: Agent-busy-when-triggered fallback; queues events when target agent is at max concurrency.
> **Status:** [PLANNED]

```sql
-- V__create_trigger_event_queue.sql (ai-service, tenant_{uuid} schema) [PLANNED]
CREATE TABLE trigger_event_queue (
    id              UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    tenant_id       UUID NOT NULL,
    trigger_id      UUID NOT NULL, -- FK to event_triggers (application-enforced)
    target_agent_id UUID NOT NULL,
    event_payload   JSONB NOT NULL,
    queued_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    retry_count     INTEGER NOT NULL DEFAULT 0,
    max_retries     INTEGER NOT NULL DEFAULT 3,
    status          VARCHAR(20) NOT NULL DEFAULT 'QUEUED',
    dlq_reason      VARCHAR(100),
    processed_at    TIMESTAMPTZ,
    CONSTRAINT chk_teq_status CHECK (status IN ('QUEUED', 'PROCESSING', 'COMPLETED', 'DLQ'))
);

CREATE INDEX idx_trigger_event_queue_pending
    ON trigger_event_queue(tenant_id, status, queued_at)
    WHERE status = 'QUEUED';
CREATE INDEX idx_trigger_event_queue_dlq
    ON trigger_event_queue(tenant_id, status)
    WHERE status = 'DLQ';
```

**Queue constraints:** Max queue depth per agent per tenant: 100 events. If queue exceeds 100, new events are sent directly to DLQ with `dlq_reason = 'AGENT_CAPACITY_EXCEEDED'`. TENANT_ADMIN is alerted via SSE when DLQ rate exceeds 10 events per hour. [PLANNED]

---

### 3.24 Event Triggers Table (`event_triggers`) [PLANNED]

> **Source:** BA Domain Model entity #17 (EventTrigger), ADR-025 (Event-Driven Triggers).
> **Status:** [PLANNED]

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PK, NOT NULL | Primary key |
| tenant_id | UUID | FK, NOT NULL | Tenant reference |
| trigger_type | VARCHAR(50) | NOT NULL | ENTITY_LIFECYCLE, TIME_BASED, EXTERNAL, WORKFLOW |
| entity_type | VARCHAR(255) | | Entity type for lifecycle triggers |
| event_name | VARCHAR(255) | NOT NULL | Event name (e.g., "kpi.threshold.breached") |
| condition_expression | TEXT | | Condition expression (JSON Path or SpEL) |
| target_agent_type | VARCHAR(50) | | SUPER_AGENT, SUB_ORCHESTRATOR |
| target_agent_id | UUID | FK | Specific agent to activate |
| status | VARCHAR(50) | NOT NULL, DEFAULT 'ACTIVE' | ACTIVE, PAUSED, DISABLED |
| version | BIGINT | NOT NULL, DEFAULT 0 | Optimistic locking |
| created_at / updated_at | TIMESTAMP | NOT NULL | Audit timestamps |
| created_by / updated_by | UUID | FK | Audit user references |

#### 3.24.1 CDC Event Debounce Strategy [PLANNED]

**Status:** [PLANNED] -- Addresses P1 gap: rapid CDC events (e.g., multiple entity updates in quick succession) could trigger redundant agent activations.
**Cross-Reference:** ADR-025 (Event-Driven Agent Triggers), Section 5.3.4 (EntityLifecycleEvent), Section 7.5 (Event-Driven Activation)

When multiple CDC events arrive for the same entity_id within a short window, only the latest event is processed. This prevents wasted agent executions on intermediate states. [PLANNED]

**Debounce mechanism:**

```mermaid
sequenceDiagram
    participant Kafka as Kafka (entity_lifecycle)
    participant ETS as EventTriggerService
    participant Valkey as Valkey (debounce keys)
    participant Agent as Target Agent

    Kafka->>ETS: Event 1: CUSTOMER_UPDATED (C-42, v1)
    ETS->>Valkey: SETEX debounce:C-42 (TTL=5s, value=event1_id)
    Note over ETS: Start 5s debounce timer

    Kafka->>ETS: Event 2: CUSTOMER_UPDATED (C-42, v2) [+2s]
    ETS->>Valkey: SETEX debounce:C-42 (TTL=5s, value=event2_id)
    Note over ETS: Timer reset -- event 1 superseded

    Kafka->>ETS: Event 3: CUSTOMER_UPDATED (C-42, v3) [+3s]
    ETS->>Valkey: SETEX debounce:C-42 (TTL=5s, value=event3_id)
    Note over ETS: Timer reset again

    Note over Valkey: 5 seconds elapse with no new event for C-42
    Valkey-->>ETS: Key expired (TTL callback via keyspace notification)
    ETS->>ETS: Process ONLY event 3 (latest)
    ETS->>Agent: activateForEvent(trigger, event3_payload)
```

**Configuration:** [PLANNED]
- Coalescing window: 5 seconds (default, configurable per trigger via `event_triggers.condition_expression` JSONB field)
- Valkey key pattern: `{tenant_id}:debounce:{entity_type}:{entity_id}` with TTL = coalescing window
- Implementation: Valkey keyspace notifications (`__keyevent@0__:expired`) consumed by `EventTriggerService`

---

#### 3.24.2 Agent Busy Fallback and Event Queuing [PLANNED]

**Status:** [PLANNED] -- Addresses P1 gap: undefined behavior when a trigger fires but the target agent is at max concurrency.
**Cross-Reference:** Section 3.23c (trigger_event_queue table), Section 3.16 (super_agents.max_concurrent_workers)

When an event trigger fires but the target agent is at maximum concurrency (checked against `super_agents.max_concurrent_workers` or per-sub-orchestrator limits), the event is queued rather than dropped. [PLANNED]

**Queue processing rules:** [PLANNED]

| Rule | Value | Description |
|------|-------|-------------|
| Queue check interval | 30 seconds | ShedLock-based scheduled job |
| Max queue depth per agent | 100 events | Events beyond 100 go to DLQ |
| Max retries per event | 3 | After 3 failed delivery attempts, event goes to DLQ |
| DLQ alert threshold | 10 events/hour | TENANT_ADMIN notified via SSE when exceeded |
| Queue priority | FIFO by `queued_at` | Oldest events processed first |

**Concurrency check before activation:** [PLANNED]

```
ON trigger fired for target_agent_id:
  active_count = SELECT COUNT(*) FROM worker_tasks
                 WHERE worker_id IN (SELECT id FROM workers WHERE sub_orchestrator_id IN
                   (SELECT id FROM sub_orchestrators WHERE super_agent_id = :target_agent_id))
                 AND status IN ('RUNNING', 'PENDING')

  IF active_count >= super_agents.max_concurrent_workers:
    INSERT INTO trigger_event_queue (trigger_id, target_agent_id, event_payload, status='QUEUED')
    IF queue_depth_for_agent > 100:
      UPDATE trigger_event_queue SET status='DLQ', dlq_reason='AGENT_CAPACITY_EXCEEDED'
      ALERT TENANT_ADMIN via SSE
  ELSE:
    Activate agent normally
```

---

### 3.25 Event Schedules Table (`event_schedules`) [PLANNED]

> **Source:** BA Domain Model entity #18 (EventSchedule), ADR-025.
> **Status:** [PLANNED]

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PK, NOT NULL | Primary key |
| trigger_id | UUID | FK, NOT NULL | Reference to event_triggers |
| tenant_id | UUID | FK, NOT NULL | Tenant reference |
| cron_expression | VARCHAR(255) | NOT NULL | Cron expression (Spring format) |
| timezone | VARCHAR(50) | NOT NULL, DEFAULT 'UTC' | Schedule timezone |
| recurrence_type | VARCHAR(50) | NOT NULL | DAILY, WEEKLY, MONTHLY, QUARTERLY, CUSTOM |
| next_execution | TIMESTAMP | | Calculated next execution time |
| last_execution | TIMESTAMP | | Last execution time |
| status | VARCHAR(50) | NOT NULL, DEFAULT 'ACTIVE' | ACTIVE, PAUSED, DISABLED |
| created_at / updated_at | TIMESTAMP | NOT NULL | Audit timestamps |

---

### 3.26 Ethics Policies Table (`ethics_policies`) [PLANNED]

> **Source:** BA Domain Model entity #23 (EthicsPolicy), ADR-027 (Platform Ethics Baseline).
> **Status:** [PLANNED] -- Stored in shared schema (not per-tenant). Immutable platform baseline.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PK, NOT NULL | Primary key |
| rule_id | VARCHAR(50) | NOT NULL, UNIQUE | Platform rule ID (e.g., ETH-001) |
| rule_description | TEXT | NOT NULL | Human-readable rule description |
| enforcement_point | VARCHAR(50) | NOT NULL | PRE_EXECUTION, POST_EXECUTION, QUERY_LEVEL |
| failure_action | VARCHAR(50) | NOT NULL | BLOCK, FLAG, ALERT |
| rule_expression | TEXT | | Machine-evaluable rule expression |
| scope | VARCHAR(50) | NOT NULL, DEFAULT 'PLATFORM' | PLATFORM (immutable) |
| status | VARCHAR(50) | NOT NULL, DEFAULT 'ACTIVE' | Always ACTIVE for platform rules |
| created_at | TIMESTAMP | NOT NULL | Creation timestamp |

---

### 3.27 Conduct Policies Table (`conduct_policies`) [PLANNED]

> **Source:** BA Domain Model entity #24 (ConductPolicy), ADR-027.
> **Status:** [PLANNED] -- Stored in tenant schema. Configurable per tenant.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PK, NOT NULL | Primary key |
| tenant_id | UUID | FK, NOT NULL | Tenant reference |
| policy_name | VARCHAR(255) | NOT NULL | Display name |
| policy_type | VARCHAR(50) | NOT NULL | DATA_HANDLING, APPROVAL, CONTENT, INDUSTRY |
| rule_expression | TEXT | NOT NULL | Machine-evaluable condition |
| industry_regulation | VARCHAR(100) | | HIPAA, SOX, FERPA, FISMA, etc. |
| enforcement_point | VARCHAR(50) | NOT NULL | PRE_EXECUTION, POST_EXECUTION |
| failure_action | VARCHAR(50) | NOT NULL | BLOCK, FLAG, ALERT, ESCALATE |
| status | VARCHAR(50) | NOT NULL, DEFAULT 'ACTIVE' | ACTIVE, INACTIVE, ARCHIVED |
| version | BIGINT | NOT NULL, DEFAULT 0 | Optimistic locking |
| created_at / updated_at | TIMESTAMP | NOT NULL | Audit timestamps |
| created_by / updated_by | UUID | FK | Audit user references |

---

### 3.28 Policy Violations Table (`policy_violations`) [PLANNED]

> **Source:** BA Domain Model entity #25 (PolicyViolation), ADR-027.
> **Status:** [PLANNED]

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PK, NOT NULL | Primary key |
| tenant_id | UUID | FK, NOT NULL | Tenant reference |
| policy_id | UUID | FK, NOT NULL | Reference to ethics_policies or conduct_policies |
| policy_type | VARCHAR(50) | NOT NULL | PLATFORM_ETHICS, TENANT_CONDUCT |
| agent_id | UUID | FK | Agent that caused the violation |
| violation_type | VARCHAR(100) | NOT NULL | BOUNDARY_PROBING, PRIVILEGE_ESCALATION, DATA_EXFILTRATION, CONTENT_SAFETY |
| severity | VARCHAR(50) | NOT NULL | LOW, MEDIUM, HIGH, CRITICAL |
| description | TEXT | NOT NULL | Violation description |
| execution_trace_id | UUID | FK | Link to execution trace |
| resolution_status | VARCHAR(50) | NOT NULL, DEFAULT 'OPEN' | OPEN, INVESTIGATING, RESOLVED, DISMISSED |
| resolved_by | UUID | FK | User who resolved |
| resolution_notes | TEXT | | Resolution description |
| detected_at | TIMESTAMP | NOT NULL | Detection timestamp |
| resolved_at | TIMESTAMP | | Resolution timestamp |

---

### 3.29 Prompt Blocks Table (`prompt_blocks`) [PLANNED]

> **Source:** BA Domain Model entity #34 (PromptBlock), ADR-029 (Dynamic System Prompt Composition).
> **Status:** [PLANNED] -- Hybrid scope: platform blocks in shared schema, tenant blocks in tenant schema.

```mermaid
erDiagram
    PROMPT_BLOCKS ||--o{ PROMPT_COMPOSITIONS : "assembled into"
    PROMPT_BLOCKS {
        uuid id PK
        uuid tenant_id FK "NULL for platform blocks"
        string block_type "NOT NULL (IDENTITY, DOMAIN, USER_CONTEXT, etc.)"
        string scope "PLATFORM or TENANT"
        text content "NOT NULL, prompt text"
        jsonb inclusion_condition "JSONB structured condition expression for block inclusion"
        integer ordering_priority "1=highest (Identity), 10=lowest (History)"
        string staleness_policy "STABLE, SESSION_SCOPED, TENANT_SCOPED, EPHEMERAL, IMMUTABLE"
        string status "ACTIVE, INACTIVE, ARCHIVED"
        bigint version "NOT NULL, DEFAULT 0"
        timestamp created_at "NOT NULL"
        timestamp updated_at "NOT NULL"
    }

    PROMPT_COMPOSITIONS {
        uuid id PK
        uuid execution_trace_id FK "NOT NULL"
        uuid tenant_id FK "NOT NULL"
        string composition_hash "SHA-256 of assembled prompt"
        integer total_tokens "Token count of assembled prompt"
        jsonb included_blocks "Array of block IDs + order"
        jsonb truncated_blocks "Blocks truncated for context window"
        timestamp assembled_at "NOT NULL"
    }
```

**Block types** (from ADR-029):

| Block Type | Ordering Priority | Always Included | Staleness |
|------------|------------------|-----------------|-----------|
| IDENTITY | 1 | Yes | STABLE |
| DOMAIN_KNOWLEDGE | 2 | When domain matches | STABLE |
| USER_CONTEXT | 3 | Yes | SESSION_SCOPED |
| ROLE_PRIVILEGES | 4 | Yes | SESSION_SCOPED |
| ACTIVE_SKILLS | 5 | When skill matches | STABLE |
| TOOL_DECLARATIONS | 6 | When tools relevant | STABLE |
| ETHICS_BASELINE | 7 | Yes | IMMUTABLE |
| ETHICS_EXTENSIONS | 8 | Yes | TENANT_SCOPED |
| TASK_INSTRUCTION | 9 | Per task | EPHEMERAL |
| CONVERSATION_HISTORY | 10 | When continuing | SESSION_SCOPED |

---

### 3.29.1 Prompt Composition Algorithm and Seed Data [PLANNED]

> **Source:** ADR-029 (Dynamic System Prompt Composition), 02-Tech-Spec Section 3.27 (DynamicPromptComposer), 08-Agent-Prompt-Templates Sections 1.6-1.7, 8.
> **Status:** [PLANNED] -- No prompt composition engine exists in the current codebase. This section specifies the algorithm, token budget management, overflow handling, seed data, and cache strategy for the `DynamicPromptComposer` service operating against the `prompt_blocks` table defined in Section 3.29 above.
> **Cross-References:** LLD Section 3.29 (DDL), Tech Spec Section 3.27 (service class), Doc 08 Section 1.6 (composition pipeline), Doc 08 Section 1.7 (block type reference), Doc 08 Section 8 (full composed prompt example).

#### 3.29.1.1 Block Composition Algorithm

The `DynamicPromptComposer` executes the following deterministic pipeline at each agent invocation. The algorithm takes four inputs (agentId, userId, tenantId, taskContext) and produces a composed system prompt string with auditable metadata.

```mermaid
flowchart TD
    START([Incoming Request:<br/>agentId, userId,<br/>tenantId, taskContext]) --> CACHE_CHECK{Check Valkey:<br/>prompt:{tenantId}:{userId}:{agentId}:{taskHash}}

    CACHE_CHECK -->|Hit & not stale| RETURN_CACHED[Return cached<br/>ComposedPrompt]
    CACHE_CHECK -->|Miss or stale| RESOLVE_USER

    RESOLVE_USER[Step 1: Resolve User Context<br/>user-service GET /api/v1/users/{userId}/context<br/>Cache in Valkey 30min TTL] --> RESOLVE_ROLE
    RESOLVE_ROLE[Step 2: Resolve Role Privileges<br/>RBAC/ABAC store<br/>Cache in Valkey session TTL] --> LOAD_BLOCKS
    LOAD_BLOCKS[Step 3: Load prompt_blocks<br/>WHERE scope=PLATFORM OR tenant_id=tenantId<br/>AND status=ACTIVE<br/>ORDER BY ordering_priority ASC] --> FILTER_BLOCKS

    FILTER_BLOCKS[Step 4: Evaluate inclusion_condition<br/>for each block against taskContext,<br/>user role, domain classification] --> RESOLVE_DYNAMIC

    RESOLVE_DYNAMIC[Step 5: Resolve dynamic blocks<br/>- USER_CONTEXT from Step 1 result<br/>- ROLE_PRIVILEGES from Step 2 result<br/>- ACTIVE_SKILLS from skill assignments<br/>- TOOL_DECLARATIONS from tool registry<br/>- TASK_INSTRUCTION from taskContext<br/>- CONVERSATION_HISTORY from conv store] --> SUBSTITUTE

    SUBSTITUTE[Step 6: Variable substitution<br/>Replace template placeholders<br/>with resolved values] --> TOKEN_COUNT

    TOKEN_COUNT[Step 7: Token count each block<br/>using model tokenizer] --> BUDGET_CHECK{Total tokens ><br/>system prompt budget?}

    BUDGET_CHECK -->|No| ASSEMBLE
    BUDGET_CHECK -->|Yes| OVERFLOW[Step 8: Overflow handling<br/>Trim lowest-priority<br/>truncatable blocks first<br/>See Section 3.29.1.4]

    OVERFLOW --> ASSEMBLE

    ASSEMBLE[Step 9: Concatenate blocks<br/>in priority order with<br/>section separators] --> HASH

    HASH[Step 10: SHA-256 hash<br/>of composed prompt] --> AUDIT_RECORD

    AUDIT_RECORD[Step 11: Write PromptComposition<br/>audit record to prompt_compositions<br/>table with block versions,<br/>token counts, truncation log] --> CACHE_STORE

    CACHE_STORE[Step 12: Cache in Valkey<br/>key = prompt:{tenantId}:{userId}:{agentId}:{taskHash}<br/>TTL = min of block staleness policies] --> RETURN

    RETURN([Return ComposedPrompt<br/>+ composition metadata])
```

**Algorithm pseudo-code:**

```
FUNCTION compose(agentId, userId, tenantId, taskContext, modelConfig):

    // Step 0: Check cache
    cacheKey = "prompt:" + tenantId + ":" + userId + ":" + agentId + ":" + sha256(taskContext)
    cached = valkey.get(cacheKey)
    IF cached IS NOT NULL AND NOT stale:
        RETURN cached

    // Step 1-2: Resolve user context and role
    userContext = resolveUserContext(userId, tenantId)        // Valkey-cached, 30min TTL
    rolePrivileges = resolveRolePrivileges(userId, tenantId) // Valkey-cached, session TTL

    // Step 3: Load all candidate prompt blocks
    blocks = promptBlockRepo.findByTenantAndScope(tenantId, "ACTIVE")
        .orderBy(ordering_priority ASC)

    // Step 4: Filter by inclusion condition
    resolvedBlocks = []
    FOR EACH block IN blocks:
        IF evaluateCondition(block.inclusion_condition, taskContext, userContext):
            resolved = ResolvedBlock(
                blockId    = block.id,
                blockType  = block.block_type,
                version    = block.version,
                priority   = block.ordering_priority,
                staleness  = block.staleness_policy,
                canTruncate = block.block_type NOT IN [IDENTITY, ETHICS_BASELINE, TASK_INSTRUCTION]
            )

            // Step 5-6: Resolve dynamic content and substitute variables
            resolved.content = substituteVariables(
                block.content,
                userContext, rolePrivileges, taskContext
            )

            // Step 7: Count tokens
            resolved.tokenCount = modelConfig.tokenizer.count(resolved.content)
            resolvedBlocks.add(resolved)

    // Step 8: Enforce token budget
    systemPromptBudget = modelConfig.systemPromptBudget
    totalTokens = SUM(resolvedBlocks.map(b -> b.tokenCount))
    truncatedBlocks = []

    IF totalTokens > systemPromptBudget:
        truncatedBlocks = enforceTokenBudget(resolvedBlocks, systemPromptBudget)

    // Step 9: Assemble
    composedPrompt = resolvedBlocks
        .filter(b -> b.tokenCount > 0)
        .sortBy(b -> b.priority)
        .map(b -> b.content)
        .join("\n\n---\n\n")

    // Step 10: Hash
    compositionHash = sha256(composedPrompt)

    // Step 11: Audit record
    promptCompositions.insert(
        executionTraceId = taskContext.traceId,
        agentId          = agentId,
        userId           = userId,
        tenantId         = tenantId,
        compositionHash  = compositionHash,
        blocksUsed       = resolvedBlocks.map(b -> {b.blockId, b.blockType, b.version, b.tokenCount}),
        totalTokenCount  = SUM(resolvedBlocks.map(b -> b.tokenCount)),
        blocksTruncated  = truncatedBlocks,
        composedAt       = NOW()
    )

    // Step 12: Cache with minimum staleness TTL
    minTTL = MIN(resolvedBlocks.map(b -> stalenessTTL(b.staleness)))
    valkey.set(cacheKey, composedPrompt, minTTL)

    RETURN ComposedPrompt(composedPrompt, compositionHash, resolvedBlocks, truncatedBlocks)
```

#### 3.29.1.2 Token Budget Allocation Table

Token budgets are allocated per model to ensure the system prompt, conversation history, and response all fit within the context window. The system prompt budget governs how much space the composed prompt from `DynamicPromptComposer` can consume.

| Model | Context Window | System Prompt Budget | Conversation Budget | Response Budget |
|-------|---------------|---------------------|--------------------|-----------------|
| GPT-4o | 128K tokens | 16,000 (12.5%) | 96,000 (75.0%) | 16,000 (12.5%) |
| Claude 3.5 Sonnet | 200K tokens | 24,000 (12.0%) | 152,000 (76.0%) | 24,000 (12.0%) |
| Gemini 1.5 Pro | 1M tokens | 64,000 (6.4%) | 872,000 (87.2%) | 64,000 (6.4%) |
| Llama 3.1 70B (Ollama) | 128K tokens | 16,000 (12.5%) | 96,000 (75.0%) | 16,000 (12.5%) |

**Configuration storage:** Model token budgets are stored in the `model_configurations` table (managed by the ai-service) and loaded at startup. Administrators can override the default split per tenant via the Agent Builder settings UI.

**Budget calculation formula:**

```
systemPromptBudget = contextWindow * systemPromptPercentage
conversationBudget = contextWindow * conversationPercentage
responseBudget     = contextWindow * responsePercentage

INVARIANT: systemPromptBudget + conversationBudget + responseBudget <= contextWindow
```

#### 3.29.1.3 Block Priority Weights

When the total token count of all resolved blocks exceeds the `systemPromptBudget`, the overflow handling algorithm (Section 3.29.1.4) trims blocks starting from the lowest priority. Blocks marked "Never trim" are guaranteed inclusion regardless of budget pressure.

| Block Category | Priority (1=highest) | Min Tokens | Max Tokens | Trim Strategy | Staleness Policy |
|---------------|---------------------|------------|------------|---------------|------------------|
| IDENTITY | 1 | 200 | 500 | Never trim | STABLE |
| DOMAIN_KNOWLEDGE | 2 | 500 | 4,000 | Trim oldest/least-relevant paragraphs | STABLE |
| USER_CONTEXT | 3 | 100 | 600 | Truncate to name + role + department | SESSION_SCOPED |
| ROLE_PRIVILEGES | 4 | 100 | 500 | Reduce to permissions list only | SESSION_SCOPED |
| ACTIVE_SKILLS | 5 | 200 | 2,000 | Keep top-3 task-relevant skills | STABLE |
| TOOL_DECLARATIONS | 6 | 150 | 1,500 | Keep top-5 tools by relevance | STABLE |
| ETHICS_BASELINE | 7 | 150 | 400 | Never trim | IMMUTABLE |
| ETHICS_EXTENSIONS | 8 | 100 | 400 | Never trim | TENANT_SCOPED |
| TASK_INSTRUCTION | 9 | 200 | 2,000 | Never trim | EPHEMERAL |
| CONVERSATION_HISTORY | 10 | 0 | 4,000 | Truncate oldest messages first | SESSION_SCOPED |

**Total guaranteed minimum (never-trim blocks):** IDENTITY (200) + ETHICS_BASELINE (150) + ETHICS_EXTENSIONS (100) + TASK_INSTRUCTION (200) = **650 tokens**. This fits comfortably within all model budgets.

**Total maximum (all blocks at max):** 500 + 4,000 + 600 + 500 + 2,000 + 1,500 + 400 + 400 + 2,000 + 4,000 = **15,900 tokens**. This fits within all model budgets (smallest budget is GPT-4o/Llama at 16,000).

#### 3.29.1.4 Overflow Handling Algorithm

When the total token count of resolved blocks exceeds the system prompt budget, the following trimming algorithm executes. It processes blocks from lowest priority to highest, applying the trim strategy defined in Section 3.29.1.3.

```mermaid
flowchart TD
    START([Total tokens > systemPromptBudget]) --> CALC[Calculate overflow:<br/>overflow = totalTokens - systemPromptBudget]

    CALC --> SORT[Sort truncatable blocks<br/>by priority DESC<br/>Priority 10 first, then 9, 8...]

    SORT --> LOOP{Any truncatable<br/>blocks remaining<br/>AND overflow > 0?}

    LOOP -->|No truncatable blocks left| WARN[Log WARNING:<br/>Cannot fit within budget<br/>even after all truncation.<br/>Proceed with over-budget prompt<br/>and flag in audit record.]
    LOOP -->|Yes| PICK[Pick lowest-priority<br/>truncatable block]

    PICK --> CHECK_MIN{block.tokenCount ><br/>block.minTokens?}

    CHECK_MIN -->|Yes: can trim| TRIM_CALC[trimAmount = MIN of:<br/>1. overflow<br/>2. block.tokenCount - block.minTokens]
    CHECK_MIN -->|No: already at minimum| SKIP[Skip this block,<br/>move to next higher priority]

    TRIM_CALC --> APPLY_TRIM[Apply trim strategy:<br/>- CONVERSATION_HISTORY: drop oldest messages<br/>- DOMAIN_KNOWLEDGE: drop least-relevant paragraphs<br/>- ACTIVE_SKILLS: keep top-N by task relevance<br/>- TOOL_DECLARATIONS: keep top-N by relevance<br/>- USER_CONTEXT: keep name + role + dept only<br/>- ROLE_PRIVILEGES: keep permissions list only]

    APPLY_TRIM --> LOG_TRIM[Log trimmed block:<br/>blockId, originalTokens,<br/>trimmedTokens, strategy]

    LOG_TRIM --> UPDATE[overflow -= trimAmount<br/>block.tokenCount -= trimAmount]

    UPDATE --> LOOP
    SKIP --> LOOP

    WARN --> DONE([Return with<br/>truncation metadata])
    LOOP -->|overflow <= 0| DONE
```

**Trimming order example** (for a 16,000-token budget with 18,500 tokens resolved):

| Step | Block | Original Tokens | Trim Strategy Applied | Tokens After Trim | Overflow Remaining |
|------|-------|----------------|----------------------|-------------------|--------------------|
| 0 | -- | -- | -- | -- | 2,500 |
| 1 | CONVERSATION_HISTORY (P10) | 3,800 | Drop oldest 2,500 tokens of messages | 1,300 | 0 |

If CONVERSATION_HISTORY alone cannot absorb the overflow:

| Step | Block | Original Tokens | Trim Strategy Applied | Tokens After Trim | Overflow Remaining |
|------|-------|----------------|----------------------|-------------------|--------------------|
| 0 | -- | -- | -- | -- | 5,200 |
| 1 | CONVERSATION_HISTORY (P10) | 3,800 | Truncate to 0 (min = 0) | 0 | 1,400 |
| 2 | TOOL_DECLARATIONS (P6) | 1,500 | Keep top-5 tools | 800 | 700 |
| 3 | ACTIVE_SKILLS (P5) | 1,800 | Keep top-3 skills | 1,100 | 0 |

**Audit logging:** Every truncation event is recorded in the `blocks_truncated` JSONB column of the `prompt_compositions` table (Section 3.29 ER diagram) with the following structure:

```json
{
  "blocks_truncated": [
    {
      "block_id": "blk-history-session",
      "block_type": "CONVERSATION_HISTORY",
      "original_tokens": 3800,
      "trimmed_to_tokens": 1300,
      "trim_strategy": "DROP_OLDEST_MESSAGES",
      "messages_dropped": 12
    }
  ]
}
```

#### 3.29.1.5 Seed Data Specification

The following seed data populates the `prompt_blocks` table for a new platform installation. These blocks have `scope = 'PLATFORM'` and `tenant_id = NULL`, making them visible to all tenants. Tenant-specific blocks are created through the Agent Builder UI (Doc 08, Section 7.7 Prompt Block Governance).

**DDL reference:** The `prompt_blocks` table DDL is defined in Section 3.29 above. The seed data INSERT uses the column layout from that ER diagram.

```sql
-- =============================================================================
-- Seed Data: Platform Prompt Blocks
-- Flyway migration: V{next}__seed_platform_prompt_blocks.sql
-- Source: Doc 08 Sections 1.6, 1.7, 8; ADR-029; BA Domain Model Entity #34
-- Status: [PLANNED]
-- =============================================================================

-- Block Type 1: IDENTITY blocks
-- Reference: Doc 08, Section 1.7, Block Type 1

INSERT INTO prompt_blocks (id, tenant_id, block_type, scope, content, inclusion_condition, ordering_priority, staleness_policy, status, version, created_at, updated_at)
VALUES
(
    'b0000001-0000-0000-0000-000000000001',
    NULL,
    'IDENTITY',
    'PLATFORM',
    'You are {{agentName}}, the Super Agent for {{tenantName}}.
You are the tenant''s organizational brain -- the top-level AI orchestrator that receives all requests, classifies them by domain, and delegates to domain-specific Sub-Orchestrators.

Your role in the hierarchy:
- Tier 1: Super Agent (you) -- tenant-level orchestrator
- Tier 2: Sub-Orchestrators -- domain-expert planners
- Tier 3: Workers -- capability executors

You do NOT execute tasks directly. You plan, delegate, review, and compose final responses.',
    '{"agent_tier": "SUPER_AGENT"}',
    1,
    'STABLE',
    'ACTIVE',
    1,
    NOW(),
    NOW()
),
(
    'b0000001-0000-0000-0000-000000000002',
    NULL,
    'IDENTITY',
    'PLATFORM',
    'You are {{agentName}}, a {{domainName}} Sub-Orchestrator for {{tenantName}}.
Your role is to plan and coordinate {{domainName}}-domain tasks by decomposing requests into sub-tasks for capability workers. You specialize in {{frameworkList}}.

You do NOT execute tasks directly. You plan, delegate to workers, review their outputs, and compose final responses.',
    '{"agent_tier": "SUB_ORCHESTRATOR"}',
    1,
    'STABLE',
    'ACTIVE',
    1,
    NOW(),
    NOW()
),
(
    'b0000001-0000-0000-0000-000000000003',
    NULL,
    'IDENTITY',
    'PLATFORM',
    'You are {{agentName}}, a {{capabilityType}} Worker for {{tenantName}}.
Your role is to execute specific tasks assigned by your Sub-Orchestrator. You focus exclusively on {{capabilityDescription}}.

You receive structured task assignments and return structured results. You do NOT make planning decisions or interact directly with users.',
    '{"agent_tier": "WORKER"}',
    1,
    'STABLE',
    'ACTIVE',
    1,
    NOW(),
    NOW()
);

-- Block Type 2: DOMAIN_KNOWLEDGE blocks (one per domain)
-- Reference: Doc 08, Section 1.7, Block Type 2

INSERT INTO prompt_blocks (id, tenant_id, block_type, scope, content, inclusion_condition, ordering_priority, staleness_policy, status, version, created_at, updated_at)
VALUES
(
    'b0000002-0000-0000-0000-000000000001',
    NULL,
    'DOMAIN_KNOWLEDGE',
    'PLATFORM',
    '## EA Domain Knowledge
You operate within the TOGAF ADM framework. Key concepts:
- Architecture Building Blocks (ABBs) and Solution Building Blocks (SBBs)
- Architecture Repository: reference models, standards, governance log
- Capability-based planning: map business capabilities to technology components
- Maturity assessment levels: Initial, Managed, Defined, Measured, Optimized

When decomposing EA tasks:
1. Identify which ADM phase the request relates to (Preliminary, A-H, Requirements)
2. Determine which repository artifacts are needed
3. Assign data retrieval to Data Query Workers
4. Assign analysis to Analysis Workers
5. Assign report composition to Report Workers',
    '{"domain": "EA"}',
    2,
    'STABLE',
    'ACTIVE',
    1,
    NOW(),
    NOW()
),
(
    'b0000002-0000-0000-0000-000000000002',
    NULL,
    'DOMAIN_KNOWLEDGE',
    'PLATFORM',
    '## Performance Management Domain Knowledge
You operate within balanced scorecard (BSC) and EFQM frameworks. Key concepts:
- Four BSC perspectives: Financial, Customer, Internal Process, Learning & Growth
- EFQM Excellence Model: Enablers (Leadership, Strategy, People, Resources, Processes) and Results
- KPI hierarchies: Strategic > Tactical > Operational
- Target-setting methodologies: SMART criteria, benchmarking, trend analysis

When decomposing Performance tasks:
1. Identify the framework context (BSC, EFQM, or custom)
2. Determine which KPI data sources are needed
3. Assign data retrieval to Data Query Workers
4. Assign calculation to Calculation Workers
5. Assign visualization/reporting to Report Workers',
    '{"domain": "PERF"}',
    2,
    'STABLE',
    'ACTIVE',
    1,
    NOW(),
    NOW()
),
(
    'b0000002-0000-0000-0000-000000000003',
    NULL,
    'DOMAIN_KNOWLEDGE',
    'PLATFORM',
    '## GRC Domain Knowledge
You operate within ISO 31000 and COBIT frameworks. Key concepts:
- Risk identification, assessment, treatment, and monitoring lifecycle
- Control objectives and control activities mapping
- Compliance obligation tracking and evidence collection
- Audit trail and regulatory reporting requirements

When decomposing GRC tasks:
1. Identify the governance framework context (ISO 31000, COBIT, custom)
2. Determine which risk/control registers are relevant
3. Assign data retrieval to Data Query Workers
4. Assign risk analysis to Analysis Workers
5. Assign compliance reporting to Report Workers',
    '{"domain": "GRC"}',
    2,
    'STABLE',
    'ACTIVE',
    1,
    NOW(),
    NOW()
),
(
    'b0000002-0000-0000-0000-000000000004',
    NULL,
    'DOMAIN_KNOWLEDGE',
    'PLATFORM',
    '## Knowledge Management Domain Knowledge
You operate within knowledge management best practices. Key concepts:
- Taxonomy and ontology management for organizational knowledge
- Content quality scoring: accuracy, completeness, currency, relevance
- Knowledge sharing patterns: communities of practice, lessons learned, best practices
- Knowledge lifecycle: create, capture, organize, access, use, retire

When decomposing KM tasks:
1. Identify the knowledge domain and content type
2. Determine which knowledge bases and taxonomies apply
3. Assign content retrieval to Data Query Workers
4. Assign quality assessment to Analysis Workers
5. Assign content composition to Report Workers',
    '{"domain": "KM"}',
    2,
    'STABLE',
    'ACTIVE',
    1,
    NOW(),
    NOW()
),
(
    'b0000002-0000-0000-0000-000000000005',
    NULL,
    'DOMAIN_KNOWLEDGE',
    'PLATFORM',
    '## Service Design Domain Knowledge
You operate within ITIL and service management frameworks. Key concepts:
- Service catalog management: service definitions, SLAs, OLAs
- Service lifecycle: strategy, design, transition, operation, continual improvement
- Incident, problem, and change management processes
- Service level management and capacity planning

When decomposing SD tasks:
1. Identify the ITIL process context
2. Determine which CMDB and service catalog entries are relevant
3. Assign data retrieval to Data Query Workers
4. Assign process analysis to Analysis Workers
5. Assign service reporting to Report Workers',
    '{"domain": "SD"}',
    2,
    'STABLE',
    'ACTIVE',
    1,
    NOW(),
    NOW()
);

-- Block Type 3: USER_CONTEXT template
-- Reference: Doc 08, Section 1.7, Block Type 3

INSERT INTO prompt_blocks (id, tenant_id, block_type, scope, content, inclusion_condition, ordering_priority, staleness_policy, status, version, created_at, updated_at)
VALUES
(
    'b0000003-0000-0000-0000-000000000001',
    NULL,
    'USER_CONTEXT',
    'PLATFORM',
    '## User Context
- Name: {{userName}}
- Role: {{userRole}}
- Department: {{userDepartment}}
- Seniority: {{userSeniority}}
- Language: {{userLanguage}}
- Active Portfolios: {{activePortfolios}}
- Interests: {{userInterests}}
- Session Start: {{sessionStartTime}}

Adapt your communication style for a {{userSeniority}}-level stakeholder.
Use vocabulary appropriate for {{userRole}} professionals.',
    '{"always": true}',
    3,
    'SESSION_SCOPED',
    'ACTIVE',
    1,
    NOW(),
    NOW()
);

-- Block Type 4: ROLE_PRIVILEGES template
-- Reference: Doc 08, Section 1.7, Block Type 4

INSERT INTO prompt_blocks (id, tenant_id, block_type, scope, content, inclusion_condition, ordering_priority, staleness_policy, status, version, created_at, updated_at)
VALUES
(
    'b0000004-0000-0000-0000-000000000001',
    NULL,
    'ROLE_PRIVILEGES',
    'PLATFORM',
    '## Access Permissions
- Data Access Level: {{dataAccessLevel}}
- Knowledge Scopes Authorized: {{authorizedScopes}}
- Restricted Scopes: {{restrictedScopes}}
- Tool Authorization Level: {{toolAccessLevel}}
- Approval Authority: {{approvalAuthority}}

When retrieving knowledge for this user, include documents up to {{dataAccessLevel}} classification.
Exclude documents from restricted scopes unless the user has explicit read-only access.',
    '{"always": true}',
    4,
    'SESSION_SCOPED',
    'ACTIVE',
    1,
    NOW(),
    NOW()
);

-- Block Type 5: ACTIVE_SKILLS template
-- Reference: Doc 08, Section 1.7, Block Type 5

INSERT INTO prompt_blocks (id, tenant_id, block_type, scope, content, inclusion_condition, ordering_priority, staleness_policy, status, version, created_at, updated_at)
VALUES
(
    'b0000005-0000-0000-0000-000000000001',
    NULL,
    'ACTIVE_SKILLS',
    'PLATFORM',
    '## Active Skills for This Session

{{#each activeSkills}}
### Skill: {{this.name}} (v{{this.version}})
Behavioral Rules:
{{this.behavioralRules}}
{{/each}}

Only use the skills listed above. If a task requires a skill not listed, escalate to the Super Agent for re-routing.',
    '{"has_skills": true}',
    5,
    'STABLE',
    'ACTIVE',
    1,
    NOW(),
    NOW()
);

-- Block Type 6: TOOL_DECLARATIONS template
-- Reference: Doc 08, Section 1.7, Block Type 6

INSERT INTO prompt_blocks (id, tenant_id, block_type, scope, content, inclusion_condition, ordering_priority, staleness_policy, status, version, created_at, updated_at)
VALUES
(
    'b0000006-0000-0000-0000-000000000001',
    NULL,
    'TOOL_DECLARATIONS',
    'PLATFORM',
    '## Available Tools
You have access to these tools (filtered by maturity level {{maturityLevel}}):

{{#each availableTools}}
{{@index}}. {{this.name}}({{this.parameters}}) -> {{this.returnType}}
   {{this.description}}
{{/each}}

Only use the tools listed above. Do NOT attempt to call tools not in this list.',
    '{"has_tools": true}',
    6,
    'STABLE',
    'ACTIVE',
    1,
    NOW(),
    NOW()
);

-- Block Type 7: ETHICS_BASELINE (immutable, platform-wide)
-- Reference: Doc 08, Section 1.7, Block Type 7; ADR-027

INSERT INTO prompt_blocks (id, tenant_id, block_type, scope, content, inclusion_condition, ordering_priority, staleness_policy, status, version, created_at, updated_at)
VALUES
(
    'b0000007-0000-0000-0000-000000000001',
    NULL,
    'ETHICS_BASELINE',
    'PLATFORM',
    '## Platform Ethics Baseline (Immutable -- Do Not Override)
ETH-001: Never transmit PII to external/cloud LLMs without sanitization.
ETH-002: Never access data belonging to another tenant under any circumstances.
ETH-003: Log every decision and action in the immutable audit trail.
ETH-004: Always disclose that you are an AI system in response metadata.
ETH-005: Never generate content that facilitates harm to individuals or organizations.
ETH-006: Flag outputs affecting individuals for bias review when bias score exceeds threshold.
ETH-007: Provide a decision explanation for every output.

These rules are non-negotiable. Tenant conduct policies may add restrictions but can never weaken or override these platform rules.',
    '{"always": true}',
    7,
    'IMMUTABLE',
    'ACTIVE',
    1,
    NOW(),
    NOW()
);

-- Block Type 8: ETHICS_EXTENSIONS template (tenant-specific conduct policies)
-- Reference: Doc 08, Section 1.7, Block Type 8; ADR-027

INSERT INTO prompt_blocks (id, tenant_id, block_type, scope, content, inclusion_condition, ordering_priority, staleness_policy, status, version, created_at, updated_at)
VALUES
(
    'b0000008-0000-0000-0000-000000000001',
    NULL,
    'ETHICS_EXTENSIONS',
    'PLATFORM',
    '## Tenant Conduct Policies ({{tenantName}})
{{#each conductPolicies}}
{{this.code}}: {{this.description}}
{{/each}}

These tenant policies supplement the platform ethics baseline above. They may add restrictions but cannot weaken platform rules.',
    '{"always": true}',
    8,
    'TENANT_SCOPED',
    'ACTIVE',
    1,
    NOW(),
    NOW()
);

-- Block Type 9: TASK_INSTRUCTION template
-- Reference: Doc 08, Section 1.7, Block Type 9

INSERT INTO prompt_blocks (id, tenant_id, block_type, scope, content, inclusion_condition, ordering_priority, staleness_policy, status, version, created_at, updated_at)
VALUES
(
    'b0000009-0000-0000-0000-000000000001',
    NULL,
    'TASK_INSTRUCTION',
    'PLATFORM',
    '## Current Task
The user has requested: "{{userQuery}}"

Task classification:
- Domain: {{taskDomain}}
- Task type: {{taskType}}
- Complexity: {{taskComplexity}}
- Requires RAG: {{requiresRag}}

{{#if executionPlan}}
Execution plan:
{{executionPlan}}
{{/if}}',
    '{"always": true}',
    9,
    'EPHEMERAL',
    'ACTIVE',
    1,
    NOW(),
    NOW()
);

-- Block Type 10: CONVERSATION_HISTORY template
-- Reference: Doc 08, Section 1.7, Block Type 10

INSERT INTO prompt_blocks (id, tenant_id, block_type, scope, content, inclusion_condition, ordering_priority, staleness_policy, status, version, created_at, updated_at)
VALUES
(
    'b0000010-0000-0000-0000-000000000001',
    NULL,
    'CONVERSATION_HISTORY',
    'PLATFORM',
    '## Recent Conversation Context
[{{messageCount}} messages prior in this session]

{{#each recentMessages}}
{{this.role}} ({{this.timestamp}}): {{this.content}}
{{/each}}',
    '{"has_conversation": true}',
    10,
    'SESSION_SCOPED',
    'ACTIVE',
    1,
    NOW(),
    NOW()
);
```

**Seed data summary:**

| Block Type | Count | Scope | Template Variables |
|-----------|-------|-------|-------------------|
| IDENTITY | 3 | PLATFORM | agentName, tenantName, domainName, frameworkList, capabilityType, capabilityDescription |
| DOMAIN_KNOWLEDGE | 5 | PLATFORM | domain (EA, PERF, GRC, KM, SD) |
| USER_CONTEXT | 1 | PLATFORM | userName, userRole, userDepartment, userSeniority, userLanguage, activePortfolios, userInterests, sessionStartTime |
| ROLE_PRIVILEGES | 1 | PLATFORM | dataAccessLevel, authorizedScopes, restrictedScopes, toolAccessLevel, approvalAuthority |
| ACTIVE_SKILLS | 1 | PLATFORM | activeSkills (array with name, version, behavioralRules) |
| TOOL_DECLARATIONS | 1 | PLATFORM | maturityLevel, availableTools (array with name, parameters, returnType, description) |
| ETHICS_BASELINE | 1 | PLATFORM | (no variables -- immutable content) |
| ETHICS_EXTENSIONS | 1 | PLATFORM | tenantName, conductPolicies (array with code, description) |
| TASK_INSTRUCTION | 1 | PLATFORM | userQuery, taskDomain, taskType, taskComplexity, requiresRag, executionPlan |
| CONVERSATION_HISTORY | 1 | PLATFORM | messageCount, recentMessages (array with role, timestamp, content) |
| **Total** | **16** | | |

#### 3.29.1.6 Cache Strategy for Prompt Blocks

Prompt blocks and composed prompts are cached in Valkey to minimize database reads and user-service calls during repeated agent invocations within a session.

```mermaid
flowchart LR
    subgraph IMMUTABLE["Immutable / Stable Blocks"]
        ETH[ETHICS_BASELINE<br/>Key: pb:platform:ethics:v{version}<br/>TTL: Until version change<br/>Invalidate: admin config update]
        ID[IDENTITY<br/>Key: pb:{tenantId}:identity:{agentId}:v{version}<br/>TTL: 24 hours<br/>Invalidate: agent config update]
        DK[DOMAIN_KNOWLEDGE<br/>Key: pb:{tenantId}:domain:{domainCode}:v{version}<br/>TTL: 24 hours<br/>Invalidate: domain config update]
        SK[ACTIVE_SKILLS<br/>Key: pb:{tenantId}:skills:{agentId}:v{version}<br/>TTL: 24 hours<br/>Invalidate: skill assignment change]
        TD[TOOL_DECLARATIONS<br/>Key: pb:{tenantId}:tools:{agentId}:{maturityLevel}<br/>TTL: 24 hours<br/>Invalidate: tool registry or maturity change]
    end

    subgraph SESSION["Session-Scoped Blocks"]
        UC[USER_CONTEXT<br/>Key: pb:user:{userId}:context<br/>TTL: 30 minutes<br/>Invalidate: session end or profile change]
        RP[ROLE_PRIVILEGES<br/>Key: pb:user:{userId}:rbac<br/>TTL: 30 minutes<br/>Invalidate: role change by admin]
        EE[ETHICS_EXTENSIONS<br/>Key: pb:{tenantId}:conduct:v{version}<br/>TTL: 1 hour<br/>Invalidate: conduct policy update]
        CH[CONVERSATION_HISTORY<br/>Key: pb:conv:{conversationId}:history<br/>TTL: 30 minutes<br/>Invalidate: new message added]
    end

    subgraph EPHEMERAL["Ephemeral Blocks (Never Cached)"]
        TI[TASK_INSTRUCTION<br/>Always resolved fresh<br/>from taskContext input]
    end

    subgraph COMPOSED["Composed Prompt Cache"]
        CP[Full Composed Prompt<br/>Key: prompt:{tenantId}:{userId}:{agentId}:{taskHash}<br/>TTL: MIN of all block staleness TTLs<br/>Invalidate: any constituent block change]
    end

    IMMUTABLE --> CP
    SESSION --> CP
    EPHEMERAL --> CP
```

**Cache tier summary:**

| Tier | Block Types | Cache Key Pattern | TTL | Invalidation Event |
|------|------------|-------------------|-----|-------------------|
| **Immutable** | ETHICS_BASELINE | `pb:platform:ethics:v{version}` | Until version bump | `ethics.baseline.updated` |
| **Stable** | IDENTITY, DOMAIN_KNOWLEDGE, ACTIVE_SKILLS, TOOL_DECLARATIONS | `pb:{tenantId}:{type}:{id}:v{version}` | 24 hours | `agent.config.updated`, `skill.assignment.changed`, `tool.registry.updated` |
| **Session-scoped** | USER_CONTEXT, ROLE_PRIVILEGES, CONVERSATION_HISTORY | `pb:user:{userId}:{type}` or `pb:conv:{convId}:history` | 30 minutes | Session end, profile change, role change, new message |
| **Tenant-scoped** | ETHICS_EXTENSIONS | `pb:{tenantId}:conduct:v{version}` | 1 hour | `conduct.policy.updated` |
| **Ephemeral** | TASK_INSTRUCTION | (not cached) | N/A | N/A -- always resolved fresh |
| **Composed** | Full assembled prompt | `prompt:{tenantId}:{userId}:{agentId}:{taskHash}` | MIN(constituent TTLs) | Any constituent block invalidated |

**Invalidation strategy:**

1. **Event-driven invalidation.** When an agent configuration, skill assignment, tool registration, user profile, role assignment, or conduct policy changes, the originating service publishes a Kafka event (per ADR-025 Event-Driven Agent Triggers). The ai-service consumes these events and deletes the affected Valkey cache keys.
2. **TTL-based expiry.** All cached entries have a TTL as a safety net. Even if an invalidation event is missed, stale data expires within the defined window.
3. **Composed prompt invalidation.** The composed prompt cache key includes a `taskHash` (SHA-256 of the task context). Different tasks for the same user/agent produce different cache keys. When any constituent block is invalidated, the composed prompt is also evicted (the composed prompt TTL is set to the minimum of all constituent block TTLs).

---

### 3.30 Benchmark Metrics Table (`benchmark_metrics`) [PLANNED]

> **Source:** BA Domain Model entity #29 (BenchmarkMetric), ADR-026 (Cross-Tenant Intelligence).
> **Status:** [PLANNED] -- Stored in shared benchmark schema (anonymized).

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PK, NOT NULL | Primary key |
| metric_type | VARCHAR(100) | NOT NULL | response_latency, accuracy, cost_per_task, etc. |
| domain | VARCHAR(50) | | EA, PERF, GRC, KM, SD, or NULL for all |
| value | FLOAT | NOT NULL | Aggregated metric value |
| percentile_25 | FLOAT | | 25th percentile |
| percentile_50 | FLOAT | | 50th percentile (median) |
| percentile_75 | FLOAT | | 75th percentile |
| contributing_tenants | INTEGER | NOT NULL | Number of tenants contributing (k-anonymity >= 5) |
| aggregation_period | VARCHAR(50) | NOT NULL | DAILY, WEEKLY, MONTHLY |
| published_at | TIMESTAMP | NOT NULL | When metric was published to shared schema |

**Privacy guarantees:** No tenant_id, no user_id, no content. Contributing_tenants must be >= 5 (k-anonymity). Only aggregated percentiles stored.

#### 3.30.1 Benchmark Opt-Out Data Handling [PLANNED]

> **Status:** [PLANNED] -- Not yet implemented. Addresses Gap 10 (Benchmark Opt-Out Data Handling) from superadmin gap analysis.
> **Source:** PRD Section 7.2.1 (BR-113), US-E20.1 (Benchmark Opt-In and Consent), US-E21.6 (Cross-Tenant Benchmark Comparison).

This section defines the data lifecycle when a tenant opts out of (or re-opts-in to) cross-tenant benchmarking.

**Opt-Out Behavior:**

| Aspect | Behavior |
|--------|----------|
| **Historical data** | RETAINED in `ai_benchmark` schema -- NOT deleted |
| **Future aggregations** | EXCLUDED -- the anonymization pipeline skips this tenant's data from the opt-out date forward |
| **Internal tenant analytics** | UNAFFECTED -- the tenant can still view their own historical benchmark data from their tenant schema |
| **Cross-tenant queries** | Filter clause: `WHERE opted_in = true` (or `WHERE exclusion_effective_date IS NULL OR exclusion_effective_date > aggregation_period_end`) applied to all cross-tenant benchmark aggregation queries |
| **Audit trail** | Audit log entry created for the opt-out event (action: `BENCHMARK_OPT_OUT_TOGGLED`, see Section 3.11.1) |

**Re-Opt-In Behavior:**

| Aspect | Behavior |
|--------|----------|
| **Historical data (pre-opt-out)** | Remains EXCLUDED from cross-tenant aggregations -- honors the original consent withdrawal window |
| **New data (post re-opt-in)** | INCLUDED in cross-tenant aggregations from the re-opt-in date forward |
| **Consent window** | The system tracks three dates: `original_opt_in_date`, `opt_out_date`, and `re_opt_in_date`. Only data from active consent windows is included in aggregations |
| **Audit trail** | Audit log entry created for the re-opt-in event |

**Consent window data flow:**

```mermaid
sequenceDiagram
    participant T as Tenant
    participant AP as Anonymization Pipeline
    participant BS as Benchmark Schema

    Note over T,BS: Phase 1: Opted-In (data flows normally)
    T->>AP: Tenant metrics (opted_in = true)
    AP->>BS: Anonymized metrics included in aggregation

    Note over T,BS: Phase 2: Opt-Out
    T->>AP: Opt-out request
    AP-->>BS: Historical data RETAINED but EXCLUDED from new aggregations
    Note over AP: Pipeline skips this tenant's data

    Note over T,BS: Phase 3: Re-Opt-In
    T->>AP: Re-opt-in request
    AP->>BS: NEW metrics included from re-opt-in date forward
    Note over BS: Pre-opt-out data remains excluded (consent window honored)
```

**Tenant benchmark consent table extension (stored in `ai_shared.tenant_registry`):**

```sql
-- V__add_benchmark_consent_columns.sql (ai_shared schema) [PLANNED]
ALTER TABLE ai_shared.tenant_registry ADD COLUMN benchmark_opted_in BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE ai_shared.tenant_registry ADD COLUMN benchmark_consent_version VARCHAR(20);
ALTER TABLE ai_shared.tenant_registry ADD COLUMN benchmark_opt_in_date TIMESTAMPTZ;
ALTER TABLE ai_shared.tenant_registry ADD COLUMN benchmark_opt_out_date TIMESTAMPTZ;
ALTER TABLE ai_shared.tenant_registry ADD COLUMN benchmark_re_opt_in_date TIMESTAMPTZ;
```

**Cross-tenant aggregation query pattern (anonymization pipeline):**

```sql
-- Only include metrics from tenants with active benchmark consent
-- Respects consent windows: excludes data from opt-out periods
SELECT metric_type, domain,
       percentile_cont(0.25) WITHIN GROUP (ORDER BY value) AS p25,
       percentile_cont(0.50) WITHIN GROUP (ORDER BY value) AS p50,
       percentile_cont(0.75) WITHIN GROUP (ORDER BY value) AS p75,
       COUNT(DISTINCT anonymized_tenant_hash) AS contributing_tenants
FROM ai_benchmark.benchmark_metrics bm
JOIN ai_shared.tenant_registry tr ON bm.anonymized_tenant_hash = tr.anonymized_hash
WHERE tr.benchmark_opted_in = true
  AND bm.published_at >= COALESCE(tr.benchmark_re_opt_in_date, tr.benchmark_opt_in_date)
GROUP BY metric_type, domain
HAVING COUNT(DISTINCT anonymized_tenant_hash) >= 5;  -- k-anonymity enforcement
```

**PLATFORM_ADMIN visibility:**

- PLATFORM_ADMIN can view the opt-out status of all tenants from the master tenant dashboard (US-E21.6)
- Tenants that have opted out are clearly marked in the benchmark comparison view
- PLATFORM_ADMIN cannot force a tenant to opt in; benchmark participation is always tenant-controlled (BR-092)

**Business rules:**

- BR-092: Benchmark participation is opt-in; tenants must explicitly consent.
- BR-113: Pre-opt-out data remains excluded on re-opt-in to honor the original consent withdrawal.
- BR-104: Both opt-out and re-opt-in events are audited in the admin audit trail.

#### 3.30.2 Benchmark Outlier Detection [PLANNED]

**Status:** [PLANNED] -- Addresses P2 gap: no outlier detection for cross-tenant benchmark data.
**Cross-Reference:** Section 3.30 (Benchmark Metrics), Section 4.18 (Cross-Tenant Benchmarks API), ADR-026

Extreme outlier data points can skew cross-tenant aggregations, producing misleading benchmark comparisons. Percentile-based outlier suppression ensures aggregations reflect typical performance ranges. [PLANNED]

**Outlier suppression rules:** [PLANNED]

| Rule | Default | Configurable | Description |
|------|---------|-------------|-------------|
| Lower bound | 5th percentile (p5) | Yes, per metric | Data points below p5 are flagged as outliers |
| Upper bound | 95th percentile (p95) | Yes, per metric | Data points above p95 are flagged as outliers |
| Suppression behavior | Excluded from aggregation | N/A | Outliers are not included in cross-tenant percentile calculations |
| Raw data retention | Retained | N/A | Outlier data points are kept in raw table, flagged `is_outlier = true` |

**Schema extension:** [PLANNED]

```sql
-- Add outlier flag to benchmark raw data table [PLANNED]
ALTER TABLE ai_benchmark.benchmark_metrics
    ADD COLUMN is_outlier BOOLEAN NOT NULL DEFAULT FALSE;

-- Outlier threshold configuration per metric [PLANNED]
CREATE TABLE ai_benchmark.outlier_thresholds (
    id              UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    metric_type     VARCHAR(100) NOT NULL UNIQUE,
    lower_percentile NUMERIC(5,2) NOT NULL DEFAULT 5.00,
    upper_percentile NUMERIC(5,2) NOT NULL DEFAULT 95.00,
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by      UUID
);
```

**Outlier detection query (executed during aggregation pipeline):** [PLANNED]

```sql
-- Mark outliers before aggregation [PLANNED]
WITH bounds AS (
    SELECT metric_type,
           percentile_cont(0.05) WITHIN GROUP (ORDER BY value) AS p5,
           percentile_cont(0.95) WITHIN GROUP (ORDER BY value) AS p95
    FROM ai_benchmark.benchmark_metrics
    WHERE aggregation_period = :period AND is_outlier = false
    GROUP BY metric_type
)
UPDATE ai_benchmark.benchmark_metrics bm
SET is_outlier = true
FROM bounds b
WHERE bm.metric_type = b.metric_type
  AND (bm.value < b.p5 OR bm.value > b.p95)
  AND bm.aggregation_period = :period;
```

**Aggregation query (outliers excluded):** [PLANNED]

```sql
SELECT metric_type, domain,
       percentile_cont(0.25) WITHIN GROUP (ORDER BY value) AS p25,
       percentile_cont(0.50) WITHIN GROUP (ORDER BY value) AS p50,
       percentile_cont(0.75) WITHIN GROUP (ORDER BY value) AS p75,
       COUNT(DISTINCT anonymized_tenant_hash) AS contributing_tenants
FROM ai_benchmark.benchmark_metrics
WHERE is_outlier = false
  AND aggregation_period = :period
GROUP BY metric_type, domain
HAVING COUNT(DISTINCT anonymized_tenant_hash) >= 5;
```

---

### 3.31 Agent Skills Table (`agent_skills`) [PLANNED]

> **Source:** BA Domain Model entity #7 (Skill), aggregate "Skills and Knowledge".
> **Status:** [PLANNED]

```sql
-- V__create_agent_skills.sql (ai-service, tenant_{uuid} schema) [PLANNED]
CREATE TABLE agent_skills (
    id                      UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    tenant_id               UUID NOT NULL,  -- Application-enforced FK to tenant-service
    agent_id                UUID NOT NULL,  -- Polymorphic FK: sub_orchestrators or workers
    agent_type              VARCHAR(20) NOT NULL, -- Discriminator: 'SUB_ORCHESTRATOR' or 'WORKER'
    skill_template_id       UUID,           -- FK to skill_templates (ai_shared schema), NULL if custom
    name                    VARCHAR(200) NOT NULL,
    version                 VARCHAR(20) NOT NULL DEFAULT '1.0.0', -- Semantic versioning per BR-020
    system_prompt_fragment  TEXT NOT NULL,   -- Prompt fragment contributed to dynamic composition
    behavioral_rules        JSONB DEFAULT '[]', -- Array of behavioral rule strings
    few_shot_examples       JSONB DEFAULT '[]', -- Array of input/output example pairs
    priority                INTEGER NOT NULL DEFAULT 100, -- Ordering weight for prompt composition
    domain                  VARCHAR(10),    -- EA, PERF, GRC, KM, SD
    status                  VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    created_at              TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_by              UUID,           -- Application-enforced FK to user-service
    version_col             INTEGER NOT NULL DEFAULT 0, -- @Version optimistic locking
    CONSTRAINT chk_skill_agent_type CHECK (agent_type IN ('SUB_ORCHESTRATOR', 'WORKER')),
    CONSTRAINT chk_skill_status CHECK (status IN ('DRAFT', 'PUBLISHED', 'DEPRECATED', 'RETIRED')),
    CONSTRAINT chk_skill_domain CHECK (domain IS NULL OR domain IN ('EA', 'PERF', 'GRC', 'KM', 'SD'))
);

CREATE INDEX idx_agent_skills_tenant_agent ON agent_skills(tenant_id, agent_id, agent_type);
CREATE INDEX idx_agent_skills_tenant_domain ON agent_skills(tenant_id, domain) WHERE status = 'PUBLISHED';
CREATE INDEX idx_agent_skills_template ON agent_skills(skill_template_id) WHERE skill_template_id IS NOT NULL;
```

> **Polymorphic FK note:** `agent_id` references either `sub_orchestrators.id` or `workers.id` based on the `agent_type` discriminator column. Referential integrity is enforced at the application layer (Spring JPA `@PrePersist` validator), not via database FK constraint. See GAP-DBA-011 note.

**Business rules (from BA):**
- BR-020: Skills are independently versioned using semantic versioning.
- BR-021: Skills are the primary composition primitive combining prompt fragment, behavioral rules, tool bindings, knowledge scopes, and few-shot examples.
- BR-023: A skill must be bound to at least one tool (validated at publish time).
- BR-026: A deprecated skill cannot be assigned to new agents; a retired skill is forcibly removed.

---

### 3.32 Knowledge Items Table (`knowledge_items`) [PLANNED]

> **Source:** BA Domain Model entity #9 (KnowledgeScope), aggregate "Skills and Knowledge".
> **Status:** [PLANNED]

```sql
-- V__create_knowledge_items.sql (ai-service, tenant_{uuid} schema) [PLANNED]
CREATE TABLE knowledge_items (
    id                  UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    tenant_id           UUID NOT NULL,  -- Application-enforced FK to tenant-service
    skill_id            UUID NOT NULL REFERENCES agent_skills(id) ON DELETE CASCADE,
    collection_name     VARCHAR(200) NOT NULL, -- Vector store collection name
    scope_type          VARCHAR(30) NOT NULL,  -- DOCUMENT, FRAMEWORK_REFERENCE, RAG_COLLECTION
    portfolio_alignment VARCHAR(100),   -- Organizational portfolio context for retrieval filtering
    access_level        VARCHAR(20) NOT NULL DEFAULT 'STANDARD', -- STANDARD, RESTRICTED, CONFIDENTIAL
    domain_framework_id UUID,           -- FK to domain_frameworks (ai_shared), NULL if not framework-aligned
    metadata            JSONB DEFAULT '{}', -- Additional scope metadata (e.g., document types, date ranges)
    status              VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    version_col         INTEGER NOT NULL DEFAULT 0, -- @Version optimistic locking
    CONSTRAINT chk_knowledge_scope_type CHECK (scope_type IN ('DOCUMENT', 'FRAMEWORK_REFERENCE', 'RAG_COLLECTION')),
    CONSTRAINT chk_knowledge_access CHECK (access_level IN ('STANDARD', 'RESTRICTED', 'CONFIDENTIAL')),
    CONSTRAINT chk_knowledge_status CHECK (status IN ('ACTIVE', 'INACTIVE'))
);

CREATE INDEX idx_knowledge_items_skill ON knowledge_items(skill_id);
CREATE INDEX idx_knowledge_items_tenant_collection ON knowledge_items(tenant_id, collection_name);
CREATE INDEX idx_knowledge_items_tenant_access ON knowledge_items(tenant_id, access_level) WHERE status = 'ACTIVE';
```

**Business rules (from BA):**
- BR-024: Knowledge scopes define which vector store collections a skill can access during RAG retrieval. Scopes are filtered by user role at retrieval time (post-retrieval authorization).
- BR-025: Knowledge scopes are aligned with portfolio types and domain frameworks.
- BR-102: A user cannot receive knowledge above their data access clearance level.

---

### 3.33 Skill Assessments Table (`skill_assessments`) [PLANNED]

> **Source:** BA Domain Model entity #4 (AgentMaturityProfile) -- skill-level dimension of maturity scoring.
> **Status:** [PLANNED]

```sql
-- V__create_skill_assessments.sql (ai-service, tenant_{uuid} schema) [PLANNED]
CREATE TABLE skill_assessments (
    id                  UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    tenant_id           UUID NOT NULL,  -- Application-enforced FK to tenant-service
    skill_id            UUID NOT NULL REFERENCES agent_skills(id) ON DELETE CASCADE,
    agent_id            UUID NOT NULL,  -- Polymorphic FK: the agent owning the skill
    agent_type          VARCHAR(20) NOT NULL,
    dimension           VARCHAR(30) NOT NULL, -- ATS dimension: IDENTITY, COMPETENCE, RELIABILITY, COMPLIANCE, ALIGNMENT
    score               FLOAT NOT NULL CHECK (score >= 0.0 AND score <= 1.0),
    evidence            JSONB NOT NULL DEFAULT '{}', -- Evidence backing the score (e.g., task success rates, error counts)
    assessed_at         TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    assessed_by         VARCHAR(30) NOT NULL DEFAULT 'SYSTEM', -- SYSTEM (automated) or user UUID
    CONSTRAINT chk_assessment_agent_type CHECK (agent_type IN ('SUB_ORCHESTRATOR', 'WORKER')),
    CONSTRAINT chk_assessment_dimension CHECK (dimension IN (
        'IDENTITY', 'COMPETENCE', 'RELIABILITY', 'COMPLIANCE', 'ALIGNMENT'
    ))
);

CREATE INDEX idx_skill_assessments_skill ON skill_assessments(skill_id, assessed_at DESC);
CREATE INDEX idx_skill_assessments_agent ON skill_assessments(tenant_id, agent_id, agent_type);
```

**Purpose:** Tracks per-skill competency scores across the five ATS dimensions (ADR-024). Used by the maturity promotion algorithm to determine whether an agent's skills meet the threshold for the next maturity level. Append-only: new assessments supersede old ones by timestamp.

---

### 3.34 Learning Records Table (`learning_records`) [PLANNED]

> **Source:** BA Domain Model entities #26 (ExecutionTrace), #27 (TraceStep) -- learning feedback loop.
> **Status:** [PLANNED]

```sql
-- V__create_learning_records.sql (ai-service, tenant_{uuid} schema) [PLANNED]
CREATE TABLE learning_records (
    id                  UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    tenant_id           UUID NOT NULL,  -- Application-enforced FK to tenant-service
    agent_id            UUID NOT NULL,  -- Polymorphic FK: the agent that learned
    agent_type          VARCHAR(20) NOT NULL,
    skill_id            UUID REFERENCES agent_skills(id) ON DELETE SET NULL, -- Skill context (NULL if general)
    execution_trace_id  UUID,           -- FK to execution traces (audit-service), cross-service reference
    record_type         VARCHAR(30) NOT NULL, -- POSITIVE_FEEDBACK, NEGATIVE_FEEDBACK, CORRECTION, DEMOTION_EVENT, PROMOTION_EVENT
    payload             JSONB NOT NULL, -- Type-specific learning data (e.g., user correction, feedback score, promotion reason)
    applied             BOOLEAN NOT NULL DEFAULT false, -- Whether this record has been consumed by the learning pipeline
    applied_at          TIMESTAMP WITH TIME ZONE, -- When the learning pipeline consumed this record
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_learning_agent_type CHECK (agent_type IN ('SUB_ORCHESTRATOR', 'WORKER')),
    CONSTRAINT chk_learning_record_type CHECK (record_type IN (
        'POSITIVE_FEEDBACK', 'NEGATIVE_FEEDBACK', 'CORRECTION', 'DEMOTION_EVENT', 'PROMOTION_EVENT'
    ))
);

CREATE INDEX idx_learning_records_agent ON learning_records(tenant_id, agent_id, agent_type, created_at DESC);
CREATE INDEX idx_learning_records_unapplied ON learning_records(tenant_id, applied) WHERE applied = false;
CREATE INDEX idx_learning_records_skill ON learning_records(skill_id) WHERE skill_id IS NOT NULL;
```

**Purpose:** Captures all learning signals (feedback, corrections, maturity events) for the continuous learning pipeline. Records are consumed by the training job scheduler to fine-tune agent behavior. The `applied` flag and `applied_at` timestamp track consumption status, preventing duplicate processing.

---

### 3.35 BA-to-LLD Entity Traceability Matrix [PLANNED]

> **Source:** SA-09 finding. Maps all 35 BA domain entities to their corresponding LLD table definitions.

| # | BA Entity | BA Aggregate | LLD Table Name | LLD Section | Schema |
|---|-----------|-------------|----------------|-------------|--------|
| 1 | SuperAgent | Agent Hierarchy | `super_agents` | 3.16 | tenant_{uuid} |
| 2 | SubOrchestrator | Agent Hierarchy | `sub_orchestrators` | 3.17 | tenant_{uuid} |
| 3 | Worker | Agent Hierarchy | `workers` | 3.18 | tenant_{uuid} |
| 4 | AgentMaturityProfile | Agent Maturity | `agent_maturity_scores` | 3.19 | tenant_{uuid} |
| 5 | ATSDimension | Agent Maturity | `agent_maturity_scores.dimension` (column, not table) | 3.19 | tenant_{uuid} |
| 6 | ATSScoreHistory | Agent Maturity | `ats_score_history` | 3.20 | tenant_{uuid} |
| 7 | Skill | Skills and Knowledge | `agent_skills` | 3.31 | tenant_{uuid} |
| 8 | SkillTemplate | Skills and Knowledge | `agent_templates` (reused, `is_skill_template` flag) | 3.10 | ai_shared |
| 9 | KnowledgeScope | Skills and Knowledge | `knowledge_items` | 3.32 | tenant_{uuid} |
| 10 | DomainFramework | Skills and Knowledge | `domain_frameworks` (reference data, ai_shared) | 3.5 (noted) | ai_shared |
| 11 | Tool | Tools and Execution | `tool_registrations` | 3.1 (ER) | ai_shared |
| 12 | ToolRiskLevel | Tools and Execution | `tool_registrations.risk_level` (column, not table) | 3.1 (ER) | ai_shared |
| 13 | ToolAuthorization | Tools and Execution | `tool_authorizations` | 3.1 (after ER) | tenant_{uuid} |
| 14 | WorkerDraft | Sandbox and Drafts | `worker_drafts` | 3.21 | tenant_{uuid} |
| 15 | DraftReview | Sandbox and Drafts | `draft_reviews` | 3.22 | tenant_{uuid} |
| 16 | DraftVersion | Sandbox and Drafts | `worker_drafts.draft_version` (column, append-only rows) | 3.21 | tenant_{uuid} |
| 17 | EventTrigger | Events and Triggers | `event_triggers` | 3.24 | tenant_{uuid} |
| 18 | EventSchedule | Events and Triggers | `event_schedules` | 3.25 | tenant_{uuid} |
| 19 | EventSource | Events and Triggers | `event_sources` | 3.23b | tenant_{uuid} |
| 20 | ApprovalCheckpoint | HITL | `approval_checkpoints` | 3.23 (ER) | tenant_{uuid} |
| 21 | ApprovalDecision | HITL | `approval_decisions` | 3.23 (ER) | tenant_{uuid} |
| 22 | EscalationRule | HITL | `escalation_rules` | 3.23 (ER) | tenant_{uuid} |
| 23 | EthicsPolicy | Ethics and Governance | `ethics_policies` | 3.26 | ai_shared |
| 24 | ConductPolicy | Ethics and Governance | `conduct_policies` | 3.27 | tenant_{uuid} |
| 25 | PolicyViolation | Ethics and Governance | `policy_violations` | 3.28 | tenant_{uuid} |
| 26 | ExecutionTrace | Audit | `pipeline_runs` + `agent_traces` | 3.6, 3.1 (ER) | tenant_{uuid} |
| 27 | TraceStep | Audit | `rag_search_log` + `agent_artifacts` | 3.8, 3.7 | tenant_{uuid} |
| 28 | TenantSuperAgentClone | Cross-Tenant | `super_agents.cloned_from_template_id` (column) | 3.16 | tenant_{uuid} |
| 29 | BenchmarkMetric | Cross-Tenant | `benchmark_metrics` | 3.30 | ai_benchmark |
| 30 | BenchmarkComparison | Cross-Tenant | Computed at query time (no persistent table) | 4.18 (API) | -- |
| 31 | UserContextSnapshot | User Context | Valkey cache (no persistent table) | 6.10 | -- |
| 32 | UserRole | User Context | user-service domain (cross-service reference) | -- | user_db |
| 33 | PortfolioAssignment | User Context | user-service domain (cross-service reference) | -- | user_db |
| 34 | PromptBlock | Dynamic Prompts | `prompt_blocks` | 3.29 | ai_shared + tenant_{uuid} |
| 35 | PromptComposition | Dynamic Prompts | `prompt_compositions` | 3.29 (ER) | tenant_{uuid} |

> **Coverage summary:** 35/35 BA entities mapped. 28 have dedicated LLD tables or columns. 3 are implemented as columns within parent tables (entities #5, #12, #16). 2 are computed/cached at runtime (entities #30, #31). 2 reside in user-service (entities #32, #33, cross-service references).

---

### 3.4 Index Strategy Summary

| Table | Index | Type | Purpose |
|-------|-------|------|---------|
| vector_store | embedding (HNSW) | vector_cosine_ops | Fast ANN similarity search for RAG |
| vector_store | tenant_id (BTREE) | BTREE | Every RAG query scoped by tenant |
| vector_store | metadata (GIN) | GIN jsonb_path_ops | Filter by document type, source |
| agent_traces | tenant_id (BTREE) | BTREE | Tenant-scoped trace queries |
| agent_traces | created_at DESC | BTREE | Recent traces for training data |
| agent_traces | confidence_score (partial) | BTREE | Flag low-confidence for review |
| feedback_entries | rating (BTREE) | BTREE | DPO pair generation (positive vs negative) |
| user_corrections | queued_for_training (partial) | BTREE | Find unprocessed corrections |
| training_jobs | status (BTREE) | BTREE | Monitor running jobs |
| model_deployments | status (partial) | BTREE | Find active deployments |
| skill_definitions | active (partial) | BTREE | Resolve only active skills |
| pipeline_runs | tenant_id, current_state (composite) | BTREE | Tenant-scoped state queries |
| pipeline_runs | timeout_at (partial) | BTREE | Timeout watchdog for non-terminal states |
| agent_artifacts | agent_trace_id | BTREE | Artifacts per trace lookup |
| agent_artifacts | tenant_id, artifact_type (composite) | BTREE | Tenant-scoped type filtering |
| agent_artifacts | content_hash | BTREE | SHA-256 deduplication lookups |
| rag_search_log | agent_trace_id | BTREE | Search logs per trace |
| rag_search_log | tenant_id, collection_name (composite) | BTREE | Per-collection analytics |
| rag_search_log | tenant_id, results_used (composite) | BTREE | Knowledge gap detection |
| agent_templates | tenant_id | BTREE | Tenant-scoped template queries |
| agent_templates | tenant_id, gallery_visible (partial) | BTREE | Gallery listing (visible only) |
| agent_templates | parent_template_id | BTREE | Fork chain traversal |
| agent_template_skills | template_id | BTREE | Skills per template |
| agent_template_tools | template_id | BTREE | Tools per template |
| audit_events | tenant_id, created_at DESC (composite) | BTREE | Tenant-scoped chronological queries |
| audit_events | tenant_id, user_id (composite) | BTREE | Per-user audit trail |
| audit_events | tenant_id, action (composite) | BTREE | Action-type filtering |
| audit_events | tenant_id, target_type, target_id (composite) | BTREE | Target-specific audit trail |
| agent_publish_submissions | tenant_id, status (composite) | BTREE | Review queue filtering |
| agent_publish_submissions | agent_config_id | BTREE | Submissions per agent |
| agent_publish_submissions | reviewer_id (partial) | BTREE | Reviewer workload (non-null only) |
| knowledge_sources | tenant_id | BTREE | Tenant-scoped source queries |
| knowledge_sources | tenant_id, status (composite) | BTREE | Status-filtered source listing |
| notifications | tenant_id, user_id, is_read (partial) | BTREE | Unread notification badge count (WHERE is_read = FALSE) |
| notifications | tenant_id, user_id, created_at DESC (composite) | BTREE | Chronological notification feed |
| super_agents | tenant_id | BTREE | Tenant-scoped super agent queries |
| super_agents | tenant_id, status (composite) | BTREE | Active super agents per tenant |
| sub_orchestrators | super_agent_id | BTREE | Sub-orchestrators per super agent |
| sub_orchestrators | tenant_id, domain (composite) | BTREE | Domain-scoped orchestrator lookup |
| workers | sub_orchestrator_id | BTREE | Workers per sub-orchestrator |
| workers | tenant_id, capability_type (composite) | BTREE | Capability-filtered worker queries |
| workers | tenant_id, status (composite) | BTREE | Active worker listing |
| agent_maturity_scores | agent_id, agent_type (composite) | BTREE | Maturity lookup by agent |
| agent_maturity_scores | tenant_id, maturity_level (composite) | BTREE | Tenant-scoped maturity distribution |
| ats_score_history | agent_id, recorded_at DESC (composite) | BTREE | Chronological score history |
| ats_score_history | tenant_id, measurement_period (composite) | BTREE | Period-specific analytics |
| worker_drafts | worker_id, status (composite) | BTREE | Draft queue per worker |
| worker_drafts | tenant_id, status (composite) | BTREE | Tenant-scoped draft review queue |
| worker_drafts | tenant_id, created_at DESC (composite) | BTREE | Chronological draft listing |
| draft_reviews | draft_id | BTREE | Reviews per draft |
| draft_reviews | reviewer_id, created_at DESC (composite) | BTREE | Reviewer activity trail |
| approval_checkpoints | pipeline_run_id | BTREE | Checkpoints per pipeline run |
| approval_checkpoints | tenant_id, status (composite) | BTREE | Pending approval queue |
| approval_decisions | checkpoint_id | BTREE | Decisions per checkpoint |
| escalation_rules | checkpoint_id | BTREE | Rules per checkpoint |
| event_triggers | tenant_id, status (partial) | BTREE | Active triggers per tenant (WHERE status = 'ACTIVE') |
| event_triggers | tenant_id, source_type (composite) | BTREE | Triggers by event source type |
| event_triggers | target_agent_id | BTREE | Triggers targeting specific agent |
| event_schedules | trigger_id | BTREE | Schedules per trigger |
| event_schedules | next_fire_at (BTREE) | BTREE | Scheduler polling for due events |
| ethics_policies | tenant_id (partial NULL) | BTREE | Platform-level policies (WHERE tenant_id IS NULL) |
| ethics_policies | tenant_id, active (composite) | BTREE | Active tenant policies |
| conduct_policies | ethics_policy_id | BTREE | Conduct rules per ethics policy |
| policy_violations | agent_id, created_at DESC (composite) | BTREE | Agent violation history |
| policy_violations | tenant_id, severity (composite) | BTREE | Severity-filtered violation queries |
| policy_violations | tenant_id, resolution_status (partial) | BTREE | Unresolved violations (WHERE resolution_status = 'OPEN') |
| prompt_blocks | tenant_id, block_type (composite) | BTREE | Block lookup by type |
| prompt_blocks | tenant_id, status (partial) | BTREE | Active blocks per tenant (WHERE status = 'ACTIVE') |
| prompt_compositions | agent_id, active (partial) | BTREE | Active composition per agent |
| prompt_compositions | tenant_id | BTREE | Tenant-scoped composition queries |
| benchmark_metrics | tenant_id, metric_name, recorded_at DESC (composite) | BTREE | Tenant metric time-series |
| benchmark_metrics | agent_id, metric_name (composite) | BTREE | Per-agent metric lookup |
| benchmark_metrics | anonymized_tenant_hash, metric_name (composite) | BTREE | Cross-tenant anonymized benchmarking |
| worker_tasks | worker_id, status (composite) | BTREE | Task queue per worker |
| worker_tasks | tenant_id, created_at DESC (composite) | BTREE | Chronological task listing |
| event_sources | tenant_id, source_type, active (composite) | BTREE | Active sources by type per tenant |
| tool_authorizations | agent_id, tool_registration_id (partial) | BTREE | Active authorizations (WHERE revoked_at IS NULL) |
| tenant_registry | tenant_external_id (unique) | BTREE | Cross-service tenant lookup |
| tenant_registry | status (partial) | BTREE | Active tenants (WHERE status = 'ACTIVE') |
| schema_lifecycle_events | tenant_id, event_type (composite) | BTREE | Lifecycle event audit trail |
| schema_lifecycle_events | created_at DESC | BTREE | Chronological lifecycle queries |
| agent_skills | tenant_id, agent_id, agent_type (composite) | BTREE | Skills per agent |
| agent_skills | tenant_id, domain (partial) | BTREE | Published skills by domain (WHERE status = 'PUBLISHED') |
| agent_skills | skill_template_id (partial) | BTREE | Skills derived from template (WHERE skill_template_id IS NOT NULL) |
| knowledge_items | skill_id | BTREE | Knowledge scopes per skill |
| knowledge_items | tenant_id, collection_name (composite) | BTREE | Collection-scoped queries |
| knowledge_items | tenant_id, access_level (partial) | BTREE | Active items by access level (WHERE status = 'ACTIVE') |
| skill_assessments | skill_id, assessed_at DESC (composite) | BTREE | Latest assessment per skill |
| skill_assessments | tenant_id, agent_id, agent_type (composite) | BTREE | Assessments per agent |
| learning_records | tenant_id, agent_id, agent_type, created_at DESC (composite) | BTREE | Learning history per agent |
| learning_records | tenant_id, applied (partial) | BTREE | Unapplied records for learning pipeline (WHERE applied = false) |
| learning_records | skill_id (partial) | BTREE | Skill-scoped learning (WHERE skill_id IS NOT NULL) |

### 3.5 Database-per-Service Allocation

| Service | Database Name | Tables Owned |
|---------|--------------|-------------|
| agent-orchestrator | `agent_orchestrator` | tenant_profiles, skill_definitions, skill_tool_sets, skill_knowledge_scopes, tool_registrations, validation_rules, vector_store, pipeline_runs, rag_search_log, rag_chunking_config, agent_templates, agent_template_skills, agent_template_tools, audit_events, agent_publish_submissions, knowledge_sources, notifications |
| trace-collector | `trace_collector` | agent_traces, tool_call_traces, pipeline_step_traces, validation_results, approval_records, agent_artifacts |
| feedback-service | `feedback_service` | feedback_entries, user_corrections, business_patterns, learning_materials |
| training-orchestrator | `training_orchestrator` | training_jobs, training_dataset_entries, model_versions, model_deployments |
| teacher-service | `teacher_service` | teacher_evaluations, synthetic_examples (lightweight tables for teacher outputs) |
| training-data-service | `training_data_service` | dataset_snapshots, data_quality_metrics (aggregation and export tables) |
| model-evaluator | `model_evaluator` | evaluation_runs, benchmark_results (evaluation history) |
| ai-service (Super Agent) | `ai_db` [PLANNED] | All Super Agent tables below, allocated per ADR-026 schema model |

**Super Agent table allocation within `ai_db` (per ADR-026 Schema-per-Tenant):**

| Schema | Tables | Scope |
|--------|--------|-------|
| `ai_shared` | platform_config, model_registry, tool_registrations, ethics_policies (ethics_baseline_rules), prompt_blocks (scope=PLATFORM), tenant_registry | Platform-wide, shared across all tenants. Contains immutable platform rules, global tool definitions, model registry, and tenant schema management. |
| `ai_benchmark` | benchmark_runs, benchmark_metrics (anonymized aggregates), trend_data | Cross-tenant anonymized analytics (k-anonymity >= 5). No tenant_id, no user_id, no content. |
| `tenant_{uuid}` | super_agents, sub_orchestrators, workers, worker_tasks, agent_maturity_scores, ats_score_history, worker_drafts, draft_reviews, approval_checkpoints, approval_decisions, escalation_rules, event_sources, event_triggers, event_schedules, conduct_policies, policy_violations, prompt_blocks (scope=TENANT), prompt_compositions, tool_authorizations, agent_skills, knowledge_items, skill_assessments, learning_records, schema_lifecycle_events | Per-tenant isolated data |

**Tenant Registry Table (`tenant_registry`)** -- Stored in `ai_shared` schema [PLANNED]:

```sql
-- V__create_tenant_registry.sql (ai_shared schema) [PLANNED]
-- Manages schema-per-tenant lifecycle for the ai_db database
CREATE TABLE ai_shared.tenant_registry (
    id               UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    tenant_id        UUID UNIQUE NOT NULL,
    schema_name      VARCHAR(100) UNIQUE NOT NULL, -- e.g., tenant_{uuid}
    status           VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_at       TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    last_accessed_at TIMESTAMP WITH TIME ZONE,
    schema_version   INTEGER NOT NULL DEFAULT 1,
    CONSTRAINT chk_tenant_registry_status CHECK (status IN (
        'ACTIVE', 'SUSPENDED', 'MIGRATING', 'ARCHIVED'
    ))
);
```

**Schema Lifecycle Events Table (`schema_lifecycle_events`)** -- Stored in `ai_shared` schema [PLANNED]:

```sql
-- V__create_schema_lifecycle_events.sql (ai_shared schema) [PLANNED]
-- Audit trail for tenant schema lifecycle operations
CREATE TABLE ai_shared.schema_lifecycle_events (
    id              UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    tenant_id       UUID NOT NULL,
    event_type      VARCHAR(30) NOT NULL,
    performed_by    VARCHAR(100) NOT NULL,
    performed_at    TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    details         JSONB, -- Migration version, schema size, rollback info, etc.
    CONSTRAINT chk_schema_event_type CHECK (event_type IN (
        'CREATED', 'MIGRATED', 'SUSPENDED', 'ARCHIVED', 'RESTORED'
    ))
);

CREATE INDEX idx_schema_lifecycle_tenant ON ai_shared.schema_lifecycle_events(tenant_id, performed_at DESC);
```

Each agent service (data-analyst, customer-support, code-reviewer, document-processor) does NOT own its own database. Agents are stateless microservices that interact with the orchestrator's database for skills and tools, the trace-collector for logging, and the feedback-service for feedback.

> **Note [PLANNED]:** All Super Agent tables reside in a single `ai_db` PostgreSQL database per ADR-026. Each tenant gets its own schema (`tenant_{uuid}`) within this database. The `ai_shared` schema contains platform-level immutable records (ethics baseline, platform prompt blocks). The `ai_benchmark` schema stores anonymized cross-tenant metrics (k-anonymity >= 5). See ADR-026 for schema isolation details and defense-in-depth layers.

---

## 4. API Contracts (OpenAPI 3.1)

**Status:** [PLANNED]
**Cross-Reference:** 02-Tech-Spec Section 8, 01-PRD Sections 3.1-3.7

All APIs follow these conventions per SA-PRINCIPLES.md:
- Path-based versioning: `/api/v1/...`
- Kebab-case for paths, camelCase for JSON properties
- RFC 7807 Problem Details for error responses
- Bearer JWT authentication on all endpoints
- Pagination via `page`, `size`, `sort` query parameters

### 4.1 Common Schemas

```yaml
# Reusable schemas referenced by all API contracts
components:
  schemas:
    # RFC 7807 Problem Details
    ProblemDetail:
      type: object
      properties:
        type:
          type: string
          format: uri
          description: "URI reference identifying the problem type"
          example: "https://api.emsist.com/problems/validation-error"
        title:
          type: string
          description: "Short human-readable summary"
          example: "Validation Error"
        status:
          type: integer
          description: "HTTP status code"
          example: 400
        detail:
          type: string
          description: "Human-readable explanation"
          example: "The 'rating' field must be between 1 and 5"
        instance:
          type: string
          format: uri
          description: "URI reference identifying the specific occurrence"
        timestamp:
          type: string
          format: date-time
        traceId:
          type: string
          description: "Distributed trace ID for correlation"
      required: [type, title, status]

    # Paginated response wrapper
    PageResponse:
      type: object
      properties:
        content:
          type: array
          items: {}
        page:
          type: integer
          example: 0
        size:
          type: integer
          example: 20
        totalElements:
          type: integer
          format: int64
        totalPages:
          type: integer
        first:
          type: boolean
        last:
          type: boolean

    # Audit metadata (embedded in all entities)
    AuditMetadata:
      type: object
      properties:
        createdAt:
          type: string
          format: date-time
        updatedAt:
          type: string
          format: date-time
        createdBy:
          type: string
          format: uuid
        updatedBy:
          type: string
          format: uuid
        version:
          type: integer
          format: int64

  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT
      description: "Keycloak-issued JWT with tenant context"
```

### 4.2 Agent Chat API

```yaml
openapi: 3.1.0
info:
  title: Agent Chat API
  version: 1.0.0
  description: |
    Send messages to AI agents and receive structured responses.
    All requests flow through the 7-step pipeline.
    Cross-Reference: PRD Section 3.1

paths:
  /api/v1/agents/{agentId}/chat:
    post:
      operationId: chatWithAgent
      tags: [Agent Chat]
      summary: Send a message to a specific agent
      description: |
        Routes the message through the 7-step pipeline (Intake, Retrieve, Plan,
        Execute, Validate, Explain, Record) using the specified agent type.
      security:
        - bearerAuth: []
      parameters:
        - name: agentId
          in: path
          required: true
          schema:
            type: string
            enum: [data-analyst, customer-support, code-reviewer, document-processor]
          description: "Agent type identifier"
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/ChatRequest'
            example:
              message: "Show me the top 10 customers by revenue this quarter"
              conversationId: "conv-123e4567-e89b"
              context:
                department: "sales"
                dataSource: "crm_warehouse"
      responses:
        '200':
          description: Agent response with explanation
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ChatResponse'
        '400':
          description: Invalid request
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ProblemDetail'
        '401':
          description: Missing or invalid JWT
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ProblemDetail'
        '403':
          description: Insufficient permissions or tenant mismatch
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ProblemDetail'
        '429':
          description: Rate limit exceeded (per-tenant concurrency limit)
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ProblemDetail'
        '503':
          description: Agent or model unavailable (circuit breaker open)
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ProblemDetail'

  /api/v1/agents/orchestrate:
    post:
      operationId: orchestrateTask
      tags: [Agent Chat]
      summary: Let the orchestrator route the task to the best agent
      description: |
        The orchestrator classifies the request and routes it to the
        most appropriate specialist agent automatically.
      security:
        - bearerAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/ChatRequest'
      responses:
        '200':
          description: Orchestrated agent response
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ChatResponse'

components:
  schemas:
    ChatRequest:
      type: object
      required: [message]
      properties:
        message:
          type: string
          minLength: 1
          maxLength: 32000
          description: |
            User message content. [PLANNED]
            Validated with @Size(min=1, max=32000) on the DTO.
            The 32,000 character limit is derived from token budget constraints:
            message (~8,000 tokens) + system_prompt (~4,000 tokens) + RAG_context (~4,000 tokens)
            must fit within the model context window (e.g., GPT-4o 128K, Claude 200K, Llama 8K).
            The message character limit is the most restrictive to support Llama-class models.
            If message exceeds 32,000 characters, return error AI-MSG-001 (see Section 4.9.1).
        conversationId:
          type: string
          description: "Optional conversation ID for context continuity"
        skillOverride:
          type: string
          description: "Force a specific skill instead of auto-selection"
        context:
          type: object
          additionalProperties: true
          description: "Additional context key-value pairs"
        options:
          $ref: '#/components/schemas/ChatOptions'

    ChatOptions:
      type: object
      properties:
        maxTurns:
          type: integer
          minimum: 1
          maximum: 20
          default: 10
        selfReflection:
          type: boolean
          default: true
        explanationLevel:
          type: string
          enum: [none, summary, full]
          default: full
        streamResponse:
          type: boolean
          default: false

    ChatResponse:
      type: object
      properties:
        traceId:
          type: string
          description: "Unique trace ID for this interaction"
        agentType:
          type: string
          description: "Which agent processed the request"
        content:
          type: string
          description: "Agent response content"
        explanation:
          $ref: '#/components/schemas/Explanation'
        artifacts:
          type: array
          items:
            $ref: '#/components/schemas/Artifact'
        validation:
          $ref: '#/components/schemas/ValidationSummary'
        metadata:
          $ref: '#/components/schemas/ResponseMetadata'

    Explanation:
      type: object
      properties:
        businessSummary:
          type: string
          description: "Non-technical summary of what was done"
        technicalDetail:
          type: string
          description: "Technical step-by-step breakdown"
        artifactList:
          type: array
          items:
            type: string
          description: "List of artifacts created or modified"

    Artifact:
      type: object
      properties:
        type:
          type: string
          enum: [code, query, chart, document, data]
        name:
          type: string
        content:
          type: string
        mimeType:
          type: string

    ValidationSummary:
      type: object
      properties:
        passed:
          type: boolean
        issueCount:
          type: integer
        issues:
          type: array
          items:
            type: string

    ResponseMetadata:
      type: object
      properties:
        modelUsed:
          type: string
        turnsUsed:
          type: integer
        latencyMs:
          type: integer
          format: int64
        tokenCountInput:
          type: integer
          format: int64
        tokenCountOutput:
          type: integer
          format: int64
        skillId:
          type: string
        pipelineRunId:
          type: string
```

### 4.3 Pipeline API

```yaml
paths:
  /api/v1/pipeline/execute:
    post:
      operationId: executePipeline
      tags: [Pipeline]
      summary: Execute the full 7-step request pipeline
      description: |
        Explicit pipeline execution with step-level control.
        Returns the full pipeline result including per-step traces.
      security:
        - bearerAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/PipelineRequest'
      responses:
        '200':
          description: Pipeline execution result
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/PipelineResponse'

  /api/v1/pipeline/{runId}/status:
    get:
      operationId: getPipelineStatus
      tags: [Pipeline]
      summary: Get status of a pipeline run
      security:
        - bearerAuth: []
      parameters:
        - name: runId
          in: path
          required: true
          schema:
            type: string
      responses:
        '200':
          description: Pipeline run status
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/PipelineStatus'
        '404':
          description: Pipeline run not found
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ProblemDetail'

components:
  schemas:
    PipelineRequest:
      type: object
      required: [message]
      properties:
        message:
          type: string
        agentType:
          type: string
          description: "Optional, auto-routed if omitted"
        skillId:
          type: string
        validationRuleIds:
          type: array
          items:
            type: string
            format: uuid
        requireApproval:
          type: boolean
          default: false
        context:
          type: object
          additionalProperties: true

    PipelineResponse:
      type: object
      properties:
        runId:
          type: string
        status:
          type: string
          enum: [COMPLETED, FAILED, PENDING_APPROVAL]
        content:
          type: string
        explanation:
          $ref: '#/components/schemas/Explanation'
        artifacts:
          type: array
          items:
            $ref: '#/components/schemas/Artifact'
        validation:
          $ref: '#/components/schemas/ValidationSummary'
        steps:
          type: array
          items:
            $ref: '#/components/schemas/PipelineStepResult'
        metadata:
          $ref: '#/components/schemas/ResponseMetadata'

    PipelineStepResult:
      type: object
      properties:
        stepName:
          type: string
          enum: [INTAKE, RETRIEVE, PLAN, EXECUTE, VALIDATE, EXPLAIN, RECORD]
        status:
          type: string
          enum: [COMPLETED, FAILED, SKIPPED]
        durationMs:
          type: integer
          format: int64
        summary:
          type: string

    PipelineStatus:
      type: object
      properties:
        runId:
          type: string
        status:
          type: string
        currentStep:
          type: string
        startedAt:
          type: string
          format: date-time
        completedAt:
          type: string
          format: date-time
```

### 4.4 Skill Management API

```yaml
paths:
  /api/v1/skills:
    get:
      operationId: listSkills
      tags: [Skills]
      summary: List skill definitions
      security:
        - bearerAuth: []
      parameters:
        - name: agentType
          in: query
          schema:
            type: string
        - name: active
          in: query
          schema:
            type: boolean
        - name: page
          in: query
          schema:
            type: integer
            default: 0
        - name: size
          in: query
          schema:
            type: integer
            default: 20
      responses:
        '200':
          description: Paginated list of skills
          content:
            application/json:
              schema:
                allOf:
                  - $ref: '#/components/schemas/PageResponse'
                  - properties:
                      content:
                        type: array
                        items:
                          $ref: '#/components/schemas/SkillDefinitionDto'
    post:
      operationId: createSkill
      tags: [Skills]
      summary: Create a new skill definition
      security:
        - bearerAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/CreateSkillRequest'
      responses:
        '201':
          description: Skill created
          headers:
            Location:
              schema:
                type: string
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/SkillDefinitionDto'
        '400':
          description: Invalid skill definition
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ProblemDetail'
        '409':
          description: Skill key already exists
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ProblemDetail'

  /api/v1/skills/{skillId}:
    get:
      operationId: getSkill
      tags: [Skills]
      summary: Get skill definition by ID
      security:
        - bearerAuth: []
      parameters:
        - name: skillId
          in: path
          required: true
          schema:
            type: string
            format: uuid
      responses:
        '200':
          description: Skill definition
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/SkillDefinitionDto'
        '404':
          description: Skill not found
    put:
      operationId: updateSkill
      tags: [Skills]
      summary: Update a skill definition
      security:
        - bearerAuth: []
      parameters:
        - name: skillId
          in: path
          required: true
          schema:
            type: string
            format: uuid
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/UpdateSkillRequest'
      responses:
        '200':
          description: Skill updated
        '404':
          description: Skill not found
        '409':
          description: Optimistic lock conflict
    delete:
      operationId: deleteSkill
      tags: [Skills]
      summary: Soft-delete a skill definition
      security:
        - bearerAuth: []
      parameters:
        - name: skillId
          in: path
          required: true
          schema:
            type: string
            format: uuid
      responses:
        '204':
          description: Skill deactivated

  /api/v1/skills/{skillId}/activate:
    post:
      operationId: activateSkill
      tags: [Skills]
      summary: Activate a skill (makes it available for agent use)
      security:
        - bearerAuth: []
      parameters:
        - name: skillId
          in: path
          required: true
          schema:
            type: string
            format: uuid
      responses:
        '200':
          description: Skill activated

  /api/v1/skills/{skillId}/test:
    post:
      operationId: testSkill
      tags: [Skills]
      summary: Run test cases against a skill
      security:
        - bearerAuth: []
      parameters:
        - name: skillId
          in: path
          required: true
          schema:
            type: string
            format: uuid
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: array
              items:
                $ref: '#/components/schemas/SkillTestCase'
      responses:
        '200':
          description: Test results
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/SkillTestResult'

components:
  schemas:
    CreateSkillRequest:
      type: object
      required: [skillKey, name, systemPrompt, toolSet]
      properties:
        skillKey:
          type: string
          pattern: "^[a-z0-9-]+$"
          example: "data-analysis-v2"
        name:
          type: string
          example: "Data Analysis Skill"
        systemPrompt:
          type: string
          maxLength: 16000
        toolSet:
          type: array
          items:
            type: string
          example: ["run_sql", "create_chart", "summarize_table"]
        knowledgeScopes:
          type: array
          items:
            type: string
          example: ["data_warehouse_docs", "sql_best_practices"]
        behavioralRules:
          type: string
        fewShotExamples:
          type: string
        parentSkillId:
          type: string
          format: uuid

    UpdateSkillRequest:
      type: object
      properties:
        name:
          type: string
        systemPrompt:
          type: string
        toolSet:
          type: array
          items:
            type: string
        knowledgeScopes:
          type: array
          items:
            type: string
        behavioralRules:
          type: string
        fewShotExamples:
          type: string
        version:
          type: integer
          format: int64
          description: "Required for optimistic locking"

    SkillDefinitionDto:
      type: object
      properties:
        id:
          type: string
          format: uuid
        skillKey:
          type: string
        name:
          type: string
        semanticVersion:
          type: string
        systemPrompt:
          type: string
        toolSet:
          type: array
          items:
            type: string
        knowledgeScopes:
          type: array
          items:
            type: string
        behavioralRules:
          type: string
        fewShotExamples:
          type: string
        parentSkillId:
          type: string
          format: uuid
        active:
          type: boolean
        audit:
          $ref: '#/components/schemas/AuditMetadata'

    SkillTestCase:
      type: object
      required: [input, expectedOutput]
      properties:
        input:
          type: string
        expectedOutput:
          type: string
        evaluationCriteria:
          type: string

    SkillTestResult:
      type: object
      properties:
        totalCases:
          type: integer
        passed:
          type: integer
        failed:
          type: integer
        results:
          type: array
          items:
            type: object
            properties:
              input:
                type: string
              expected:
                type: string
              actual:
                type: string
              passed:
                type: boolean
              score:
                type: number
```

### 4.5 Tool Management API

```yaml
paths:
  /api/v1/tools:
    get:
      operationId: listTools
      tags: [Tools]
      summary: List all registered tools
      security:
        - bearerAuth: []
      parameters:
        - name: type
          in: query
          schema:
            type: string
            enum: [STATIC, REST, WEBHOOK, SCRIPT, COMPOSITE]
        - name: active
          in: query
          schema:
            type: boolean
      responses:
        '200':
          description: List of tools
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/ToolDefinitionDto'
    post:
      operationId: registerTool
      tags: [Tools]
      summary: Register a new dynamic tool
      security:
        - bearerAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/RegisterToolRequest'
      responses:
        '201':
          description: Tool registered
          headers:
            Location:
              schema:
                type: string
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ToolDefinitionDto'
        '409':
          description: Tool name already exists for this tenant

  /api/v1/tools/webhook:
    post:
      operationId: registerWebhookTool
      tags: [Tools]
      summary: Register a webhook as a tool
      security:
        - bearerAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/WebhookToolRequest'
      responses:
        '201':
          description: Webhook tool registered

  /api/v1/tools/composite:
    post:
      operationId: createCompositeTool
      tags: [Tools]
      summary: Create a composite tool from existing tools
      security:
        - bearerAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/CompositeToolRequest'
      responses:
        '201':
          description: Composite tool created

  /api/v1/tools/{toolId}:
    delete:
      operationId: deregisterTool
      tags: [Tools]
      summary: Deactivate a dynamic tool
      security:
        - bearerAuth: []
      parameters:
        - name: toolId
          in: path
          required: true
          schema:
            type: string
            format: uuid
      responses:
        '204':
          description: Tool deactivated

components:
  schemas:
    RegisterToolRequest:
      type: object
      required: [name, description, parameterSchema, endpointUrl]
      properties:
        name:
          type: string
          pattern: "^[a-z_][a-z0-9_]*$"
        description:
          type: string
        parameterSchema:
          type: object
          description: "JSON Schema for tool parameters"
        returnSchema:
          type: object
        endpointUrl:
          type: string
          format: uri
        httpMethod:
          type: string
          enum: [GET, POST, PUT, DELETE]
          default: POST

    WebhookToolRequest:
      type: object
      required: [name, description, webhookUrl]
      properties:
        name:
          type: string
        description:
          type: string
        webhookUrl:
          type: string
          format: uri
        method:
          type: string
          default: POST
        parameterSchema:
          type: object

    CompositeToolRequest:
      type: object
      required: [name, description, steps]
      properties:
        name:
          type: string
        description:
          type: string
        steps:
          type: array
          items:
            type: object
            properties:
              toolName:
                type: string
              inputMapping:
                type: object
              outputKey:
                type: string

    ToolDefinitionDto:
      type: object
      properties:
        id:
          type: string
          format: uuid
        name:
          type: string
        description:
          type: string
        toolType:
          type: string
        parameterSchema:
          type: object
        returnSchema:
          type: object
        endpointUrl:
          type: string
        semanticVersion:
          type: string
        active:
          type: boolean
        audit:
          $ref: '#/components/schemas/AuditMetadata'
```

### 4.6 Feedback API

```yaml
paths:
  /api/v1/feedback/rating:
    post:
      operationId: submitRating
      tags: [Feedback]
      summary: Submit a rating for an agent response
      security:
        - bearerAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/UserRatingRequest'
      responses:
        '201':
          description: Rating submitted
        '400':
          description: Invalid rating value
        '404':
          description: Referenced trace not found

  /api/v1/feedback/correction:
    post:
      operationId: submitCorrection
      tags: [Feedback]
      summary: Submit an explicit correction for an agent response
      description: |
        Corrections are the highest-priority training signal. They are
        immediately queued for the next fine-tuning batch.
      security:
        - bearerAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/UserCorrectionRequest'
      responses:
        '201':
          description: Correction submitted and queued for training

  /api/v1/feedback/stats:
    get:
      operationId: getFeedbackStats
      tags: [Feedback]
      summary: Get feedback statistics for the current tenant
      security:
        - bearerAuth: []
      parameters:
        - name: agentType
          in: query
          schema:
            type: string
        - name: fromDate
          in: query
          schema:
            type: string
            format: date
        - name: toDate
          in: query
          schema:
            type: string
            format: date
      responses:
        '200':
          description: Feedback statistics
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/FeedbackStats'

components:
  schemas:
    UserRatingRequest:
      type: object
      required: [traceId, rating]
      properties:
        traceId:
          type: string
          description: "Trace ID of the agent interaction"
        rating:
          type: integer
          minimum: 1
          maximum: 5
        comment:
          type: string
          maxLength: 2000

    UserCorrectionRequest:
      type: object
      required: [traceId, correctedResponse]
      properties:
        traceId:
          type: string
        correctedResponse:
          type: string
          maxLength: 32000
        correctionReason:
          type: string
          maxLength: 2000

    FeedbackStats:
      type: object
      properties:
        totalRatings:
          type: integer
        averageRating:
          type: number
        ratingDistribution:
          type: object
          additionalProperties:
            type: integer
        totalCorrections:
          type: integer
        correctionsByAgent:
          type: object
          additionalProperties:
            type: integer
        period:
          type: object
          properties:
            from:
              type: string
              format: date
            to:
              type: string
              format: date
```

### 4.7 Training and Model Management API

```yaml
paths:
  /api/v1/training/trigger:
    post:
      operationId: triggerTraining
      tags: [Training]
      summary: Trigger an on-demand training job
      security:
        - bearerAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/TrainingTriggerRequest'
      responses:
        '202':
          description: Training job accepted
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/TrainingJobDto'
        '409':
          description: Training job already in progress

  /api/v1/training/status:
    get:
      operationId: getTrainingStatus
      tags: [Training]
      summary: Get status of the current or most recent training job
      security:
        - bearerAuth: []
      responses:
        '200':
          description: Training job status
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/TrainingJobDto'

  /api/v1/training/history:
    get:
      operationId: getTrainingHistory
      tags: [Training]
      summary: List training job history
      security:
        - bearerAuth: []
      parameters:
        - name: page
          in: query
          schema:
            type: integer
            default: 0
        - name: size
          in: query
          schema:
            type: integer
            default: 20
      responses:
        '200':
          description: Training history
          content:
            application/json:
              schema:
                allOf:
                  - $ref: '#/components/schemas/PageResponse'
                  - properties:
                      content:
                        type: array
                        items:
                          $ref: '#/components/schemas/TrainingJobDto'

  /api/v1/models/versions:
    get:
      operationId: listModelVersions
      tags: [Models]
      summary: List all model versions
      security:
        - bearerAuth: []
      parameters:
        - name: status
          in: query
          schema:
            type: string
            enum: [CREATED, DEPLOYED, SHADOW, RETIRED]
      responses:
        '200':
          description: Model versions
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/ModelVersionDto'

  /api/v1/models/rollback/{version}:
    post:
      operationId: rollbackModel
      tags: [Models]
      summary: Rollback to a previous model version
      security:
        - bearerAuth: []
      parameters:
        - name: version
          in: path
          required: true
          schema:
            type: string
      responses:
        '200':
          description: Rollback initiated
        '404':
          description: Version not found

components:
  schemas:
    TrainingTriggerRequest:
      type: object
      required: [jobType]
      properties:
        jobType:
          type: string
          enum: [SFT, DPO, RAG_UPDATE, KNOWLEDGE_DISTILLATION, FULL]
        agentType:
          type: string
          description: "Target specific agent type, or 'all'"
        config:
          type: object
          additionalProperties: true

    TrainingJobDto:
      type: object
      properties:
        id:
          type: string
          format: uuid
        jobType:
          type: string
        status:
          type: string
          enum: [PENDING, RUNNING, EVALUATING, DEPLOYING, COMPLETED, FAILED]
        triggerType:
          type: string
          enum: [SCHEDULED, ON_DEMAND, QUALITY_DROP]
        totalExamples:
          type: integer
        qualityScoreBefore:
          type: number
        qualityScoreAfter:
          type: number
        modelPath:
          type: string
        errorMessage:
          type: string
        startedAt:
          type: string
          format: date-time
        completedAt:
          type: string
          format: date-time

    ModelVersionDto:
      type: object
      properties:
        id:
          type: string
          format: uuid
        modelName:
          type: string
        semanticVersion:
          type: string
        baseModel:
          type: string
        trainingMethod:
          type: string
        qualityScore:
          type: number
        benchmarkResults:
          type: object
        status:
          type: string
          enum: [CREATED, DEPLOYED, SHADOW, RETIRED]
        deployedAt:
          type: string
          format: date-time
```

### 4.8 Tenant Management API

```yaml
paths:
  /api/v1/tenants/{tenantId}/profile:
    get:
      operationId: getTenantProfile
      tags: [Tenants]
      summary: Get tenant profile and AI platform settings
      security:
        - bearerAuth: []
      parameters:
        - name: tenantId
          in: path
          required: true
          schema:
            type: string
      responses:
        '200':
          description: Tenant profile
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/TenantProfileDto'
        '404':
          description: Tenant profile not found
    put:
      operationId: updateTenantProfile
      tags: [Tenants]
      summary: Update tenant AI platform configuration
      security:
        - bearerAuth: []
      parameters:
        - name: tenantId
          in: path
          required: true
          schema:
            type: string
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/UpdateTenantProfileRequest'
      responses:
        '200':
          description: Profile updated

  /api/v1/tenants/{tenantId}/skills:
    get:
      operationId: getTenantSkills
      tags: [Tenants]
      summary: Get skills available to a tenant
      security:
        - bearerAuth: []
      parameters:
        - name: tenantId
          in: path
          required: true
          schema:
            type: string
      responses:
        '200':
          description: Tenant skills (global + tenant-specific)
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/SkillDefinitionDto'

components:
  schemas:
    TenantProfileDto:
      type: object
      properties:
        id:
          type: string
          format: uuid
        tenantId:
          type: string
        namespace:
          type: string
        allowedTools:
          type: array
          items:
            type: string
        allowedSkills:
          type: array
          items:
            type: string
        dataClassification:
          type: string
          enum: [PUBLIC, INTERNAL, CONFIDENTIAL, RESTRICTED]
        maxOrchestratorConcurrency:
          type: integer
        maxWorkerConcurrency:
          type: integer
        audit:
          $ref: '#/components/schemas/AuditMetadata'

    UpdateTenantProfileRequest:
      type: object
      properties:
        namespace:
          type: string
        allowedTools:
          type: array
          items:
            type: string
        allowedSkills:
          type: array
          items:
            type: string
        dataClassification:
          type: string
        maxOrchestratorConcurrency:
          type: integer
          minimum: 1
          maximum: 50
        maxWorkerConcurrency:
          type: integer
          minimum: 1
          maximum: 20
        version:
          type: integer
          format: int64
```

### 4.9 Error Code Catalog

| HTTP Status | Error Type URI | Title | Applies To |
|-------------|---------------|-------|------------|
| 400 | `/problems/validation-error` | Validation Error | All endpoints |
| 400 | `/problems/invalid-skill-definition` | Invalid Skill Definition | POST /skills |
| 401 | `/problems/authentication-required` | Authentication Required | All endpoints |
| 403 | `/problems/access-denied` | Access Denied | All endpoints |
| 403 | `/problems/tenant-mismatch` | Tenant Mismatch | Cross-tenant access attempt |
| 404 | `/problems/resource-not-found` | Resource Not Found | GET by ID |
| 409 | `/problems/conflict` | Conflict | Duplicate key or optimistic lock |
| 409 | `/problems/training-in-progress` | Training Already Running | POST /training/trigger |
| 422 | `/problems/unprocessable-entity` | Unprocessable Entity | Invalid pipeline request |
| 429 | `/problems/rate-limited` | Rate Limit Exceeded | Per-tenant concurrency |
| 500 | `/problems/internal-error` | Internal Server Error | All endpoints |
| 503 | `/problems/service-unavailable` | Service Unavailable | Circuit breaker open |
| 503 | `/problems/model-unavailable` | Model Unavailable | Ollama/cloud model down |

### 4.9.1 Edge Case Error Codes (Elite Team Audit) [PLANNED]

**Status:** [PLANNED]
**Cross-Reference:** Elite team audit findings P0-P2; extends Section 4.9 catalog.

The following error codes address 20 edge case and exception handling gaps identified by the elite team audit. All use RFC 7807 Problem Details format. [PLANNED]

| Error Code | HTTP Status | Error Type URI | Title | Scenario | Priority |
|------------|-------------|----------------|-------|----------|----------|
| AI-MSG-001 | 400 | `/problems/message-too-long` | Message Too Long | ChatRequest.message exceeds 32,000 character limit | P0 |
| AI-CONV-001 | 409 | `/problems/concurrent-stream` | Concurrent Stream Conflict | Another SSE stream is active for this conversation_id | P0 |
| AI-EMB-001 | 503 | `/problems/embedding-unavailable` | Embedding Provider Unavailable | Circuit breaker OPEN for embedding API; includes `Retry-After: 60` header | P0 |
| AI-PROV-001 | 503 | `/problems/schema-creation-failed` | Schema Creation Failed | `CREATE SCHEMA tenant_{uuid}` failed after 3 retries | P0 |
| AI-PROV-002 | 503 | `/problems/tenant-schema-outdated` | Tenant Schema Outdated | Flyway migration failed; tenant operations blocked until resolved | P1 |
| AI-ETH-001 | 503 | `/problems/ethics-engine-unavailable` | Ethics Engine Unavailable | Ethics engine unreachable; fail-closed default blocks all ethics-gated actions | P0 |
| AI-TKN-001 | 422 | `/problems/token-limit-exceeded` | Token Limit Exceeded | prompt + context > model max_tokens after truncation cascade exhausted | P1 |
| AI-ORCH-001 | 500 | `/problems/sub-orchestrator-failed` | Sub-Orchestrator Failed | Sub-orchestrator failed after 2 retries; includes domain and error details | P1 |
| AI-AGT-001 | 409 | `/problems/agent-name-duplicate` | Agent Name Duplicate | UNIQUE(name, tenant_id) constraint violated on agents table | P2 |
| AI-RAG-001 | 200 | N/A (metadata flag) | N/A | RAG retrieval returned 0 chunks above threshold; response includes `ragContextUsed: false` | P1 |

**Token budget calculation for AI-MSG-001:** [PLANNED]

```
Model context window budget:
  - System prompt (identity + ethics + skills): ~4,000 tokens (reserved)
  - RAG context (retrieved chunks):              ~4,000 tokens (reserved)
  - Conversation history (last N turns):         ~2,000 tokens (reserved)
  - User message:                                ~8,000 tokens (max)
  - Output buffer:                               ~2,000 tokens (reserved)
  ---
  Total for Llama-class models (8K context):     ~20,000 tokens

  32,000 characters ~ 8,000 tokens (avg 4 chars/token)
  Validation: @Size(max=32000) on ChatRequest.message field
```

---

### 4.10 Super Agent Management API [PLANNED]

**Status:** [PLANNED]
**Cross-Reference:** ADR-023 (Hierarchical Architecture), BA Domain Model -- SuperAgent aggregate, 02-Tech-Spec Section 3.22

```yaml
openapi: 3.1.0
paths:
  /api/v1/ai/super-agent:
    get:
      operationId: getSuperAgent
      summary: Get the tenant's super agent configuration
      description: >
        Returns the single Super Agent (Tier 1) for the authenticated tenant.
        Each tenant has exactly one Super Agent instance. [PLANNED]
      tags: [Super Agent]
      security:
        - bearerAuth: []
      parameters:
        - $ref: '#/components/parameters/X-Tenant-Id'
      responses:
        '200':
          description: Super Agent configuration
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/SuperAgentResponse'
        '401':
          $ref: '#/components/responses/Unauthorized'
        '403':
          $ref: '#/components/responses/Forbidden'
        '404':
          description: No Super Agent configured for this tenant
          content:
            application/json:
              schema:
                $ref: '#/components/responses/NotFound'
    put:
      operationId: updateSuperAgent
      summary: Update super agent configuration
      tags: [Super Agent]
      security:
        - bearerAuth: []
      parameters:
        - $ref: '#/components/parameters/X-Tenant-Id'
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/SuperAgentUpdateRequest'
      responses:
        '200':
          description: Updated Super Agent
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/SuperAgentResponse'
        '400':
          $ref: '#/components/responses/ValidationError'
        '409':
          description: Optimistic lock conflict (version mismatch)
          content:
            application/json:
              schema:
                $ref: '#/components/responses/Conflict'

  /api/v1/ai/super-agent/status:
    get:
      operationId: getSuperAgentStatus
      summary: Get real-time status of the super agent and its hierarchy
      description: >
        Returns operational status including active sub-orchestrators,
        running workers, pending approvals, and maturity summary.
      tags: [Super Agent]
      security:
        - bearerAuth: []
      responses:
        '200':
          description: Super Agent status dashboard
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/SuperAgentStatusResponse'

components:
  schemas:
    SuperAgentResponse:
      type: object
      properties:
        id:
          type: string
          format: uuid
        tenantId:
          type: string
          format: uuid
        name:
          type: string
        status:
          type: string
          enum: [ACTIVE, SUSPENDED, INITIALIZING]
        maxConcurrentOrchestrators:
          type: integer
        maxConcurrentWorkers:
          type: integer
        ethicsPolicyId:
          type: string
          format: uuid
        maturitySummary:
          $ref: '#/components/schemas/MaturitySummary'
        version:
          type: integer
          format: int64
        createdAt:
          type: string
          format: date-time
        updatedAt:
          type: string
          format: date-time

    SuperAgentUpdateRequest:
      type: object
      properties:
        name:
          type: string
          maxLength: 255
        maxConcurrentOrchestrators:
          type: integer
          minimum: 1
          maximum: 50
        maxConcurrentWorkers:
          type: integer
          minimum: 1
          maximum: 200
        ethicsPolicyId:
          type: string
          format: uuid
        version:
          type: integer
          format: int64
          description: Required for optimistic locking
      required: [version]

    SuperAgentStatusResponse:
      type: object
      properties:
        superAgentId:
          type: string
          format: uuid
        status:
          type: string
        activeOrchestrators:
          type: integer
        activeWorkers:
          type: integer
        pendingApprovals:
          type: integer
        pendingDrafts:
          type: integer
        maturityDistribution:
          type: object
          additionalProperties:
            type: integer
          description: "Map of maturity level to count, e.g. {COACHING: 3, CO_PILOT: 5, PILOT: 2, GRADUATE: 1}"
```

### 4.11 Sub-Orchestrator API [PLANNED]

**Status:** [PLANNED]
**Cross-Reference:** ADR-023 (Hierarchical Architecture), BA Domain Model -- SubOrchestrator entity, 02-Tech-Spec Section 3.23

```yaml
openapi: 3.1.0
paths:
  /api/v1/ai/sub-orchestrators:
    get:
      operationId: listSubOrchestrators
      summary: List all sub-orchestrators for the tenant's super agent
      tags: [Sub-Orchestrators]
      security:
        - bearerAuth: []
      parameters:
        - $ref: '#/components/parameters/X-Tenant-Id'
        - name: domain
          in: query
          schema:
            type: string
          description: Filter by canonical domain type (e.g., EA, PERF, GRC, KM, SD)
        - name: status
          in: query
          schema:
            type: string
            enum: [ACTIVE, SUSPENDED, INITIALIZING]
        - name: page
          in: query
          schema:
            type: integer
            default: 0
        - name: size
          in: query
          schema:
            type: integer
            default: 20
            maximum: 100
      responses:
        '200':
          description: Paginated list of sub-orchestrators
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/PagedSubOrchestratorResponse'
    post:
      operationId: createSubOrchestrator
      summary: Create a new sub-orchestrator under the super agent
      tags: [Sub-Orchestrators]
      security:
        - bearerAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/SubOrchestratorCreateRequest'
      responses:
        '201':
          description: Created sub-orchestrator
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/SubOrchestratorResponse'
        '400':
          $ref: '#/components/responses/ValidationError'
        '409':
          description: Domain already has an active sub-orchestrator

  /api/v1/ai/sub-orchestrators/{orchestratorId}:
    get:
      operationId: getSubOrchestrator
      summary: Get a specific sub-orchestrator
      tags: [Sub-Orchestrators]
      parameters:
        - name: orchestratorId
          in: path
          required: true
          schema:
            type: string
            format: uuid
      responses:
        '200':
          description: Sub-orchestrator details
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/SubOrchestratorResponse'
        '404':
          $ref: '#/components/responses/NotFound'
    put:
      operationId: updateSubOrchestrator
      summary: Update a sub-orchestrator
      tags: [Sub-Orchestrators]
      parameters:
        - name: orchestratorId
          in: path
          required: true
          schema:
            type: string
            format: uuid
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/SubOrchestratorUpdateRequest'
      responses:
        '200':
          description: Updated sub-orchestrator
        '409':
          description: Optimistic lock conflict
    delete:
      operationId: deactivateSubOrchestrator
      summary: Deactivate a sub-orchestrator (soft delete)
      tags: [Sub-Orchestrators]
      parameters:
        - name: orchestratorId
          in: path
          required: true
          schema:
            type: string
            format: uuid
      responses:
        '204':
          description: Sub-orchestrator deactivated

components:
  schemas:
    SubOrchestratorResponse:
      type: object
      properties:
        id:
          type: string
          format: uuid
        superAgentId:
          type: string
          format: uuid
        domain:
          type: string
        status:
          type: string
          enum: [ACTIVE, SUSPENDED, INITIALIZING]
        maxConcurrentWorkers:
          type: integer
        delegationStrategy:
          type: string
          enum: [ROUND_ROBIN, SKILL_MATCH, LOAD_BALANCED, MATURITY_PREFERRED]
        workerCount:
          type: integer
        version:
          type: integer
          format: int64
        createdAt:
          type: string
          format: date-time

    SubOrchestratorCreateRequest:
      type: object
      properties:
        domain:
          type: string
          maxLength: 100
        maxConcurrentWorkers:
          type: integer
          minimum: 1
          maximum: 20
        delegationStrategy:
          type: string
          enum: [ROUND_ROBIN, SKILL_MATCH, LOAD_BALANCED, MATURITY_PREFERRED]
          default: SKILL_MATCH
      required: [domain]

    SubOrchestratorUpdateRequest:
      type: object
      properties:
        maxConcurrentWorkers:
          type: integer
          minimum: 1
          maximum: 20
        delegationStrategy:
          type: string
          enum: [ROUND_ROBIN, SKILL_MATCH, LOAD_BALANCED, MATURITY_PREFERRED]
        status:
          type: string
          enum: [ACTIVE, SUSPENDED]
        version:
          type: integer
          format: int64
      required: [version]
```

### 4.12 Worker API [PLANNED]

**Status:** [PLANNED]
**Cross-Reference:** ADR-023 (Hierarchical Architecture), ADR-028 (Worker Sandbox Draft Lifecycle), BA Domain Model -- Worker entity, 02-Tech-Spec Section 3.24

```yaml
openapi: 3.1.0
paths:
  /api/v1/ai/workers:
    get:
      operationId: listWorkers
      summary: List workers, optionally filtered by sub-orchestrator or maturity
      tags: [Workers]
      security:
        - bearerAuth: []
      parameters:
        - $ref: '#/components/parameters/X-Tenant-Id'
        - name: subOrchestratorId
          in: query
          schema:
            type: string
            format: uuid
        - name: maturityLevel
          in: query
          schema:
            type: string
            enum: [COACHING, CO_PILOT, PILOT, GRADUATE]
        - name: status
          in: query
          schema:
            type: string
            enum: [ACTIVE, SUSPENDED, SANDBOX_ONLY]
        - name: page
          in: query
          schema:
            type: integer
            default: 0
        - name: size
          in: query
          schema:
            type: integer
            default: 20
      responses:
        '200':
          description: Paginated list of workers
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/PagedWorkerResponse'

  /api/v1/ai/workers/{workerId}:
    get:
      operationId: getWorker
      summary: Get a specific worker with maturity profile and skills
      tags: [Workers]
      parameters:
        - name: workerId
          in: path
          required: true
          schema:
            type: string
            format: uuid
      responses:
        '200':
          description: Worker details including maturity profile
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/WorkerDetailResponse'
    put:
      operationId: updateWorker
      summary: Update worker configuration
      tags: [Workers]
      parameters:
        - name: workerId
          in: path
          required: true
          schema:
            type: string
            format: uuid
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/WorkerUpdateRequest'
      responses:
        '200':
          description: Updated worker
        '409':
          description: Optimistic lock conflict

  /api/v1/ai/workers/{workerId}/execute:
    post:
      operationId: executeWorkerTask
      summary: Submit a task for worker execution
      description: >
        Submits a task to a specific worker. If the worker's maturity level
        requires sandbox mode (COACHING or CO_PILOT), the result is produced
        as a WorkerDraft requiring review before commit. [PLANNED]
      tags: [Workers]
      parameters:
        - name: workerId
          in: path
          required: true
          schema:
            type: string
            format: uuid
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/WorkerTaskRequest'
      responses:
        '202':
          description: Task accepted for execution
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/WorkerTaskAcceptedResponse'

components:
  schemas:
    WorkerDetailResponse:
      type: object
      properties:
        id:
          type: string
          format: uuid
        subOrchestratorId:
          type: string
          format: uuid
        name:
          type: string
        agentType:
          type: string
        maturityLevel:
          type: string
          enum: [COACHING, CO_PILOT, PILOT, GRADUATE]
        sandboxMode:
          type: boolean
          description: "True if maturity requires draft sandbox (COACHING, CO_PILOT)"
        status:
          type: string
          enum: [ACTIVE, SUSPENDED, SANDBOX_ONLY]
        skills:
          type: array
          items:
            type: string
        trustScore:
          $ref: '#/components/schemas/TrustScoreSummary'
        version:
          type: integer
          format: int64

    TrustScoreSummary:
      type: object
      properties:
        compositeScore:
          type: number
          format: double
          minimum: 0.0
          maximum: 1.0
        dimensions:
          type: object
          properties:
            identity:
              type: number
            competence:
              type: number
            reliability:
              type: number
            compliance:
              type: number
            alignment:
              type: number

    WorkerTaskRequest:
      type: object
      properties:
        taskDescription:
          type: string
          maxLength: 5000
        contextData:
          type: object
          additionalProperties: true
        priority:
          type: string
          enum: [LOW, NORMAL, HIGH, URGENT]
          default: NORMAL
        timeoutSeconds:
          type: integer
          minimum: 10
          maximum: 600
          default: 120
      required: [taskDescription]

    WorkerTaskAcceptedResponse:
      type: object
      properties:
        taskId:
          type: string
          format: uuid
        workerId:
          type: string
          format: uuid
        sandboxMode:
          type: boolean
        estimatedCompletionSeconds:
          type: integer
        statusUrl:
          type: string
          format: uri
          description: "Poll this URL for task completion status"
```

### 4.13 Agent Maturity API [PLANNED]

**Status:** [PLANNED]
**Cross-Reference:** ADR-024 (Agent Maturity Model), ADR-030 (HITL Risk-Maturity Matrix), BA Domain Model -- AgentMaturityProfile + ATSDimension, 02-Tech-Spec Section 3.25

```yaml
openapi: 3.1.0
paths:
  /api/v1/ai/maturity/{agentId}:
    get:
      operationId: getAgentMaturity
      summary: Get current maturity profile for an agent
      description: >
        Returns the Agent Trust Score (ATS) with all 5 dimensions
        (Identity 20%, Competence 25%, Reliability 25%, Compliance 15%,
        Alignment 15%) and the derived maturity level. [PLANNED]
      tags: [Maturity]
      security:
        - bearerAuth: []
      parameters:
        - name: agentId
          in: path
          required: true
          schema:
            type: string
            format: uuid
        - name: agentType
          in: query
          required: true
          schema:
            type: string
            enum: [SUPER_AGENT, SUB_ORCHESTRATOR, WORKER]
      responses:
        '200':
          description: Agent maturity profile
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/AgentMaturityResponse'
        '404':
          $ref: '#/components/responses/NotFound'

  /api/v1/ai/maturity/{agentId}/history:
    get:
      operationId: getMaturityHistory
      summary: Get ATS score history for an agent over time
      tags: [Maturity]
      parameters:
        - name: agentId
          in: path
          required: true
          schema:
            type: string
            format: uuid
        - name: dimension
          in: query
          schema:
            type: string
            enum: [IDENTITY, COMPETENCE, RELIABILITY, COMPLIANCE, ALIGNMENT, COMPOSITE]
        - name: from
          in: query
          schema:
            type: string
            format: date-time
        - name: to
          in: query
          schema:
            type: string
            format: date-time
        - name: granularity
          in: query
          schema:
            type: string
            enum: [HOURLY, DAILY, WEEKLY]
            default: DAILY
      responses:
        '200':
          description: Score history time series
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/MaturityHistoryResponse'

  /api/v1/ai/maturity/{agentId}/promote:
    post:
      operationId: requestMaturityPromotion
      summary: Request maturity level promotion for an agent
      description: >
        Triggers a maturity promotion evaluation. If the agent's ATS composite
        score meets the threshold for the next level, the promotion is granted.
        Promotions from CO_PILOT to PILOT and above require HITL approval. [PLANNED]
      tags: [Maturity]
      parameters:
        - name: agentId
          in: path
          required: true
          schema:
            type: string
            format: uuid
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/PromotionRequest'
      responses:
        '200':
          description: Promotion evaluation result
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/PromotionResultResponse'
        '409':
          description: Promotion already pending or agent at maximum level

components:
  schemas:
    AgentMaturityResponse:
      type: object
      properties:
        agentId:
          type: string
          format: uuid
        agentType:
          type: string
          enum: [SUPER_AGENT, SUB_ORCHESTRATOR, WORKER]
        maturityLevel:
          type: string
          enum: [COACHING, CO_PILOT, PILOT, GRADUATE]
        compositeScore:
          type: number
          format: double
          minimum: 0.0
          maximum: 1.0
        dimensions:
          type: array
          items:
            $ref: '#/components/schemas/ATSDimensionScore'
        promotionThreshold:
          type: number
          format: double
          description: "Score needed for next level (null if GRADUATE)"
        lastEvaluatedAt:
          type: string
          format: date-time

    ATSDimensionScore:
      type: object
      properties:
        dimension:
          type: string
          enum: [IDENTITY, COMPETENCE, RELIABILITY, COMPLIANCE, ALIGNMENT]
        score:
          type: number
          format: double
          minimum: 0.0
          maximum: 1.0
        weight:
          type: number
          format: double
          description: "Weight in composite: Identity=0.20, Competence=0.25, Reliability=0.25, Compliance=0.15, Alignment=0.15"
        weightedScore:
          type: number
          format: double

    PromotionRequest:
      type: object
      properties:
        agentType:
          type: string
          enum: [SUPER_AGENT, SUB_ORCHESTRATOR, WORKER]
        justification:
          type: string
          maxLength: 1000
      required: [agentType]

    PromotionResultResponse:
      type: object
      properties:
        approved:
          type: boolean
        previousLevel:
          type: string
        newLevel:
          type: string
          description: "Only set if approved"
        requiresHumanApproval:
          type: boolean
          description: "True if HITL gate was triggered (CO_PILOT->PILOT, PILOT->GRADUATE)"
        approvalCheckpointId:
          type: string
          format: uuid
          description: "Set if requiresHumanApproval is true"
        reason:
          type: string
```

### 4.14 Draft Sandbox API [PLANNED]

**Status:** [PLANNED]
**Cross-Reference:** ADR-028 (Worker Sandbox Draft Lifecycle), BA Domain Model -- WorkerDraft + DraftReview, 02-Tech-Spec Section 3.26

```yaml
openapi: 3.1.0
paths:
  /api/v1/ai/drafts:
    get:
      operationId: listDrafts
      summary: List worker drafts, optionally filtered by status or worker
      tags: [Drafts]
      security:
        - bearerAuth: []
      parameters:
        - $ref: '#/components/parameters/X-Tenant-Id'
        - name: status
          in: query
          schema:
            type: string
            enum: [DRAFT, UNDER_REVIEW, APPROVED, REJECTED, COMMITTED, EXPIRED]
        - name: workerId
          in: query
          schema:
            type: string
            format: uuid
        - name: page
          in: query
          schema:
            type: integer
            default: 0
        - name: size
          in: query
          schema:
            type: integer
            default: 20
      responses:
        '200':
          description: Paginated list of drafts
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/PagedDraftResponse'

  /api/v1/ai/drafts/{draftId}:
    get:
      operationId: getDraft
      summary: Get draft details including content diff and review history
      tags: [Drafts]
      parameters:
        - name: draftId
          in: path
          required: true
          schema:
            type: string
            format: uuid
      responses:
        '200':
          description: Draft details with content and reviews
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/DraftDetailResponse'

  /api/v1/ai/drafts/{draftId}/submit-review:
    post:
      operationId: submitDraftForReview
      summary: Submit a draft for human or senior-agent review
      description: >
        Transitions draft from DRAFT to UNDER_REVIEW. The reviewer is
        determined by the HITL risk-maturity matrix (ADR-030). [PLANNED]
      tags: [Drafts]
      parameters:
        - name: draftId
          in: path
          required: true
          schema:
            type: string
            format: uuid
      responses:
        '200':
          description: Draft submitted for review
        '409':
          description: Draft not in DRAFT status

  /api/v1/ai/drafts/{draftId}/review:
    post:
      operationId: reviewDraft
      summary: Approve or reject a draft
      tags: [Drafts]
      parameters:
        - name: draftId
          in: path
          required: true
          schema:
            type: string
            format: uuid
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/DraftReviewRequest'
      responses:
        '200':
          description: Review recorded, draft status updated
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/DraftReviewResponse'
        '409':
          description: Draft not in UNDER_REVIEW status

  /api/v1/ai/drafts/{draftId}/commit:
    post:
      operationId: commitDraft
      summary: Commit an approved draft to production
      description: >
        Transitions from APPROVED to COMMITTED. The draft content is
        applied to the target entity (e.g., agent response delivered
        to user, configuration change applied). [PLANNED]
      tags: [Drafts]
      parameters:
        - name: draftId
          in: path
          required: true
          schema:
            type: string
            format: uuid
      responses:
        '200':
          description: Draft committed successfully
        '409':
          description: Draft not in APPROVED status

components:
  schemas:
    DraftDetailResponse:
      type: object
      properties:
        id:
          type: string
          format: uuid
        workerId:
          type: string
          format: uuid
        workerName:
          type: string
        status:
          type: string
          enum: [DRAFT, UNDER_REVIEW, APPROVED, REJECTED, COMMITTED, EXPIRED]
        contentType:
          type: string
          description: "Type of draft content (e.g., CHAT_RESPONSE, CONFIG_CHANGE, CODE_OUTPUT)"
        content:
          type: object
          additionalProperties: true
          description: "The draft content (schema varies by contentType)"
        diffSummary:
          type: string
          description: "Human-readable summary of what changed vs production"
        reviews:
          type: array
          items:
            $ref: '#/components/schemas/DraftReviewSummary'
        versionNumber:
          type: integer
        createdAt:
          type: string
          format: date-time
        expiresAt:
          type: string
          format: date-time
          description: "Drafts expire after configurable TTL (default 24h)"

    DraftReviewRequest:
      type: object
      properties:
        decision:
          type: string
          enum: [APPROVE, REJECT, REQUEST_CHANGES]
        comment:
          type: string
          maxLength: 2000
        suggestedChanges:
          type: object
          additionalProperties: true
      required: [decision]

    DraftReviewResponse:
      type: object
      properties:
        reviewId:
          type: string
          format: uuid
        draftId:
          type: string
          format: uuid
        newStatus:
          type: string
          enum: [APPROVED, REJECTED, UNDER_REVIEW]
        decision:
          type: string
        reviewerType:
          type: string
          enum: [HUMAN, SENIOR_AGENT, AUTO_APPROVED]

    DraftReviewSummary:
      type: object
      properties:
        reviewId:
          type: string
          format: uuid
        reviewerType:
          type: string
          enum: [HUMAN, SENIOR_AGENT, AUTO_APPROVED]
        reviewerId:
          type: string
        decision:
          type: string
          enum: [APPROVE, REJECT, REQUEST_CHANGES]
        comment:
          type: string
        reviewedAt:
          type: string
          format: date-time
```

### 4.15 Approval Checkpoints API [PLANNED]

**Status:** [PLANNED]
**Cross-Reference:** ADR-030 (HITL Risk-Maturity Matrix), BA Domain Model -- ApprovalCheckpoint + ApprovalDecision + EscalationRule, 02-Tech-Spec Section 3.29

```yaml
openapi: 3.1.0
paths:
  /api/v1/ai/approvals:
    get:
      operationId: listPendingApprovals
      summary: List pending approval checkpoints for the authenticated user
      tags: [Approvals]
      security:
        - bearerAuth: []
      parameters:
        - $ref: '#/components/parameters/X-Tenant-Id'
        - name: status
          in: query
          schema:
            type: string
            enum: [PENDING, APPROVED, REJECTED, ESCALATED, TIMED_OUT]
        - name: interactionType
          in: query
          schema:
            type: string
            enum: [CONFIRMATION, DATA_ENTRY, REVIEW, TAKEOVER]
        - name: page
          in: query
          schema:
            type: integer
            default: 0
        - name: size
          in: query
          schema:
            type: integer
            default: 20
      responses:
        '200':
          description: Paginated list of approval checkpoints
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/PagedApprovalResponse'

  /api/v1/ai/approvals/{checkpointId}:
    get:
      operationId: getApprovalCheckpoint
      summary: Get checkpoint details including context, decisions, and escalation rules
      tags: [Approvals]
      parameters:
        - name: checkpointId
          in: path
          required: true
          schema:
            type: string
            format: uuid
      responses:
        '200':
          description: Approval checkpoint details
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ApprovalCheckpointDetailResponse'

  /api/v1/ai/approvals/{checkpointId}/decide:
    post:
      operationId: decideApproval
      summary: Submit a decision (approve, reject, or request more info) for a checkpoint
      tags: [Approvals]
      parameters:
        - name: checkpointId
          in: path
          required: true
          schema:
            type: string
            format: uuid
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/ApprovalDecisionRequest'
      responses:
        '200':
          description: Decision recorded
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ApprovalDecisionResponse'
        '409':
          description: Checkpoint not in PENDING or ESCALATED status

components:
  schemas:
    ApprovalCheckpointDetailResponse:
      type: object
      properties:
        id:
          type: string
          format: uuid
        pipelineRunId:
          type: string
          format: uuid
        stepName:
          type: string
        interactionType:
          type: string
          enum: [CONFIRMATION, DATA_ENTRY, REVIEW, TAKEOVER]
        riskLevel:
          type: string
          enum: [LOW, MEDIUM, HIGH, CRITICAL]
        agentMaturityLevel:
          type: string
          enum: [COACHING, CO_PILOT, PILOT, GRADUATE]
        status:
          type: string
          enum: [PENDING, APPROVED, REJECTED, ESCALATED, TIMED_OUT]
        context:
          type: object
          additionalProperties: true
          description: "Rich context for the human reviewer (what the agent did, why approval needed)"
        timeoutMinutes:
          type: integer
        escalationRules:
          type: array
          items:
            $ref: '#/components/schemas/EscalationRuleSummary'
        decisions:
          type: array
          items:
            $ref: '#/components/schemas/ApprovalDecisionSummary'
        createdAt:
          type: string
          format: date-time
        expiresAt:
          type: string
          format: date-time

    ApprovalDecisionRequest:
      type: object
      properties:
        decision:
          type: string
          enum: [APPROVE, REJECT, REQUEST_INFO]
        comment:
          type: string
          maxLength: 2000
        additionalData:
          type: object
          additionalProperties: true
          description: "For DATA_ENTRY interaction type: the data the human provides"
      required: [decision]

    ApprovalDecisionResponse:
      type: object
      properties:
        decisionId:
          type: string
          format: uuid
        checkpointId:
          type: string
          format: uuid
        decision:
          type: string
        newCheckpointStatus:
          type: string
        pipelineResumed:
          type: boolean
          description: "True if the pipeline was unblocked by this decision"

    EscalationRuleSummary:
      type: object
      properties:
        conditionType:
          type: string
          enum: [TIMEOUT, REJECTION_COUNT, RISK_THRESHOLD]
        conditionValue:
          type: string
        escalateToRole:
          type: string

    ApprovalDecisionSummary:
      type: object
      properties:
        decisionId:
          type: string
          format: uuid
        decidedBy:
          type: string
        decision:
          type: string
        comment:
          type: string
        decidedAt:
          type: string
          format: date-time
```

### 4.15.1 HITL Escalation Chain [PLANNED]

**Status:** [PLANNED]
**Cross-Reference:** ADR-030 (HITL Risk-Maturity Matrix), Section 3.23 (Approval Checkpoints Table), Section 6.4 (RBAC Role Definitions), 10-Full-Stack-Integration-Spec Section 11.7 (SSE)

#### Escalation Levels

When a HITL approval checkpoint is created, it is assigned to a designated approver based on the risk level and the agent's maturity level (per ADR-030). If the designated approver does not respond within the configured timeout, the checkpoint escalates through up to 4 levels: [PLANNED]

| Level | Approver | Trigger | Default Timeout |
|-------|----------|---------|-----------------|
| L1 | **AGENT_DESIGNER** (low/medium risk) or **TENANT_ADMIN** (high/critical risk) | Checkpoint created | 24h (non-critical), 4h (critical) |
| L2 | **TENANT_ADMIN** (if L1 was AGENT_DESIGNER) or **PLATFORM_ADMIN** (if L1 was TENANT_ADMIN) | L1 timeout exceeded | Same as L1 timeout duration |
| L3 | **PLATFORM_ADMIN** in master tenant (UUID: `00000000-0000-0000-0000-000000000000`) | L2 timeout exceeded | Same as L1 timeout duration |
| L4 | **System** (automatic) | L3 timeout exceeded | N/A -- immediate |

At L4, the system performs the `final_action` configured for the tenant: either `AUTO_REJECT` (default) or `AUTO_APPROVE`. Both actions are logged to the audit trail with reason `TIMEOUT_AUTO_REJECT` or `TIMEOUT_AUTO_APPROVE`. [PLANNED]

#### Escalation Notifications

At each escalation level, the following notifications are dispatched: [PLANNED]

| Channel | Mechanism | Target |
|---------|-----------|--------|
| In-app real-time | SSE push event (`hitl.escalated`) | New approver's active session |
| In-app badge | Badge counter increment on HITL approval queue | New approver |
| Email (optional) | SMTP via notification-service | New approver (if `notify_email = true` in config) |
| Audit log | Kafka event to `agent.audit` topic | Permanent record |

#### PLATFORM_ADMIN Override

A user with `PLATFORM_ADMIN` role operating from the master tenant can recall or override any pending HITL checkpoint at any escalation level, regardless of the current assigned approver. This is modeled as a decision with `decision_type = 'OVERRIDDEN'` and `overridden_by = PLATFORM_ADMIN` in the `approval_decisions` table. [PLANNED]

#### Escalation Sequence Diagram

```mermaid
sequenceDiagram
    participant W as Worker Agent
    participant HITL as HITLService
    participant L1 as L1 Approver<br/>(AGENT_DESIGNER)
    participant L2 as L2 Approver<br/>(TENANT_ADMIN)
    participant L3 as L3 Approver<br/>(PLATFORM_ADMIN<br/>Master Tenant)
    participant SSE as SSE Push
    participant Audit as Kafka: agent.audit

    Note over W,HITL: Step 1: Checkpoint Created
    W->>HITL: requestApproval(draftId, riskLevel=MEDIUM)
    HITL->>HITL: Lookup escalation_config for tenant + risk_level
    HITL->>HITL: Assign to L1 approver (AGENT_DESIGNER)<br/>Set deadline = now + l1_timeout_hours
    HITL->>SSE: approval.requested {checkpointId, assignedTo: L1}
    HITL->>Audit: LOG: hitl_checkpoint_created

    Note over HITL,L1: Step 2: L1 Timeout (e.g., 24h elapsed)
    HITL->>HITL: Scheduler detects deadline exceeded<br/>escalation_count = 1
    HITL->>HITL: Update status = ESCALATED<br/>Reassign to L2 (TENANT_ADMIN)<br/>Set new deadline = now + l2_timeout_hours
    HITL->>SSE: hitl.escalated {checkpointId, newLevel: 2, newApprover: TENANT_ADMIN, previousApprover: AGENT_DESIGNER, escalationReason: TIMEOUT}
    HITL->>Audit: LOG: hitl_escalated {level: 2}

    alt L2 Approves
        L2->>HITL: decide(checkpointId, APPROVE)
        HITL->>SSE: approval.decided {checkpointId, decision: APPROVED}
        HITL->>Audit: LOG: hitl_decided {decidedBy: TENANT_ADMIN}
    else L2 Timeout
        Note over HITL,L2: Step 3: L2 Timeout
        HITL->>HITL: Scheduler detects deadline exceeded<br/>escalation_count = 2
        HITL->>HITL: Update status = ESCALATED<br/>Reassign to L3 (PLATFORM_ADMIN in master tenant)<br/>Set new deadline = now + l3_timeout_hours
        HITL->>SSE: hitl.escalated {checkpointId, newLevel: 3, newApprover: PLATFORM_ADMIN, previousApprover: TENANT_ADMIN, escalationReason: TIMEOUT}
        HITL->>Audit: LOG: hitl_escalated {level: 3, crossTenant: true}

        alt L3 Approves/Rejects
            L3->>HITL: decide(checkpointId, APPROVE/REJECT)
            HITL->>SSE: approval.decided {checkpointId, decision: ...}
            HITL->>Audit: LOG: hitl_decided {decidedBy: PLATFORM_ADMIN}
        else L3 Timeout (Step 4: Final Auto-Action)
            HITL->>HITL: Scheduler detects deadline exceeded<br/>escalation_count = 3
            HITL->>HITL: Read final_action from hitl_escalation_config<br/>Execute AUTO_REJECT or AUTO_APPROVE
            HITL->>SSE: approval.decided {checkpointId, decision: AUTO_REJECT, reason: TIMEOUT_AUTO_REJECT}
            HITL->>Audit: LOG: hitl_auto_action {finalAction: AUTO_REJECT, totalEscalations: 3}
        end
    end
```

#### Tenant-Configurable Escalation Settings

Each tenant can configure escalation behavior per risk level. The configuration is stored in the `hitl_escalation_config` table in the tenant's schema (`tenant_{uuid}`): [PLANNED]

```sql
-- V__create_hitl_escalation_config.sql (ai-service, tenant_{uuid} schema) [PLANNED]
CREATE TABLE hitl_escalation_config (
    id                UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    tenant_id         UUID NOT NULL, -- Application-enforced FK to tenant-service
    risk_level        VARCHAR(20) NOT NULL,
    l1_timeout_hours  INTEGER NOT NULL DEFAULT 24,
    l2_timeout_hours  INTEGER NOT NULL DEFAULT 24,
    l3_timeout_hours  INTEGER NOT NULL DEFAULT 24,
    final_action      VARCHAR(20) NOT NULL DEFAULT 'AUTO_REJECT',
    notify_email      BOOLEAN NOT NULL DEFAULT false,
    version           BIGINT NOT NULL DEFAULT 0, -- Optimistic locking
    created_at        TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_by        UUID, -- Application-enforced FK to user-service
    updated_by        UUID, -- Application-enforced FK to user-service
    CONSTRAINT chk_escalation_risk_level CHECK (risk_level IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    CONSTRAINT chk_escalation_final_action CHECK (final_action IN ('AUTO_REJECT', 'AUTO_APPROVE')),
    CONSTRAINT chk_l1_timeout_positive CHECK (l1_timeout_hours > 0),
    CONSTRAINT chk_l2_timeout_positive CHECK (l2_timeout_hours > 0),
    CONSTRAINT chk_l3_timeout_positive CHECK (l3_timeout_hours > 0),
    CONSTRAINT uq_escalation_tenant_risk UNIQUE (tenant_id, risk_level)
);

CREATE INDEX idx_escalation_config_tenant ON hitl_escalation_config(tenant_id);
```

**Default seed data per risk level:** [PLANNED]

| Risk Level | L1 Timeout | L2 Timeout | L3 Timeout | Final Action | Email |
|------------|-----------|-----------|-----------|--------------|-------|
| LOW | 48h | 48h | 48h | AUTO_APPROVE | false |
| MEDIUM | 24h | 24h | 24h | AUTO_REJECT | false |
| HIGH | 4h | 4h | 4h | AUTO_REJECT | true |
| CRITICAL | 4h | 4h | 4h | AUTO_REJECT | true |

#### Escalation Configuration API

```yaml
openapi: 3.1.0
paths:
  /api/v1/ai/admin/hitl/escalation-config:
    get:
      operationId: getEscalationConfig
      summary: Get HITL escalation configuration for the tenant
      description: >
        Returns all escalation configurations (one per risk level) for the
        authenticated tenant. PLATFORM_ADMIN can query any tenant via
        X-Target-Tenant-Id header. [PLANNED]
      tags: [HITL Administration]
      security:
        - bearerAuth: []
      parameters:
        - $ref: '#/components/parameters/X-Tenant-Id'
      responses:
        '200':
          description: List of escalation configurations (one per risk level)
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/HitlEscalationConfigResponse'
        '401':
          $ref: '#/components/responses/Unauthorized'
        '403':
          $ref: '#/components/responses/Forbidden'

    put:
      operationId: updateEscalationConfig
      summary: Update HITL escalation configuration for a specific risk level
      description: >
        Updates the escalation timeout and final-action settings for a given
        risk level. Requires TENANT_ADMIN or PLATFORM_ADMIN role. Changes
        take effect for new checkpoints only; existing pending checkpoints
        retain their original deadlines. [PLANNED]
      tags: [HITL Administration]
      security:
        - bearerAuth: []
      parameters:
        - $ref: '#/components/parameters/X-Tenant-Id'
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/HitlEscalationConfigRequest'
      responses:
        '200':
          description: Configuration updated
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/HitlEscalationConfigResponse'
        '400':
          description: Invalid timeout values (must be > 0)
        '401':
          $ref: '#/components/responses/Unauthorized'
        '403':
          description: Non-admin user attempted configuration change
        '404':
          description: No escalation config found for specified risk level (use POST to create)

components:
  schemas:
    HitlEscalationConfigRequest:
      type: object
      properties:
        riskLevel:
          type: string
          enum: [LOW, MEDIUM, HIGH, CRITICAL]
        l1TimeoutHours:
          type: integer
          minimum: 1
          description: "Hours before escalation from L1 to L2"
        l2TimeoutHours:
          type: integer
          minimum: 1
          description: "Hours before escalation from L2 to L3"
        l3TimeoutHours:
          type: integer
          minimum: 1
          description: "Hours before escalation from L3 to final auto-action"
        finalAction:
          type: string
          enum: [AUTO_REJECT, AUTO_APPROVE]
          description: "Action when all escalation levels are exhausted"
        notifyEmail:
          type: boolean
          description: "Send email notifications on escalation"
      required: [riskLevel]

    HitlEscalationConfigResponse:
      type: object
      properties:
        id:
          type: string
          format: uuid
        tenantId:
          type: string
          format: uuid
        riskLevel:
          type: string
          enum: [LOW, MEDIUM, HIGH, CRITICAL]
        l1TimeoutHours:
          type: integer
        l2TimeoutHours:
          type: integer
        l3TimeoutHours:
          type: integer
        finalAction:
          type: string
          enum: [AUTO_REJECT, AUTO_APPROVE]
        notifyEmail:
          type: boolean
        updatedAt:
          type: string
          format: date-time
        updatedBy:
          type: string
          format: uuid
```

### 4.15.2 Agent Name Uniqueness Constraint [PLANNED]

**Status:** [PLANNED] -- Addresses P2 gap: no uniqueness constraint on agent names within a tenant.
**Cross-Reference:** Section 3.16 (super_agents), Section 3.17 (sub_orchestrators), Section 3.18 (workers), Section 4.9.1 (AI-AGT-001)

Agent names must be unique within a tenant to prevent confusion in dashboards, logs, and API responses. The uniqueness constraint applies separately to each agent tier table. [PLANNED]

**Database constraints:** [PLANNED]

```sql
-- Add UNIQUE(name, tenant_id) constraints [PLANNED]
ALTER TABLE super_agents ADD CONSTRAINT uq_super_agent_name_tenant UNIQUE(name, tenant_id);
ALTER TABLE sub_orchestrators ADD CONSTRAINT uq_sub_orch_name_tenant UNIQUE(name, tenant_id);
ALTER TABLE workers ADD CONSTRAINT uq_worker_name_tenant UNIQUE(name, tenant_id);
```

**Error response:** When a duplicate name is attempted, the API returns error AI-AGT-001 (409 Conflict):

```json
{
  "code": "AI-AGT-001",
  "type": "/problems/agent-name-duplicate",
  "title": "Agent Name Duplicate",
  "detail": "An agent named 'Revenue Analyzer' already exists in this tenant",
  "status": 409
}
```

---

### 4.15.3 Agent Deletion and Conversation Orphan Handling [PLANNED]

**Status:** [PLANNED] -- Addresses P2 gap: undefined behavior for conversations, triggers, and drafts when an agent is deleted.
**Cross-Reference:** Section 3.15 (Agent Configuration Lifecycle), Section 3.16-3.18 (Agent tables), Section 3.24 (Event Triggers)

When an agent (super_agent, sub_orchestrator, or worker) is deleted, the following cascading actions ensure data integrity. Deletion is always **soft delete** (never hard delete) to preserve audit trail and historical data. [PLANNED]

**Deletion cascade rules:** [PLANNED]

| Step | Action | Details |
|------|--------|---------|
| 1 | Soft delete agent | Set `status = 'DELETED'`, `deleted_at = NOW()` on the agent record |
| 2 | Close active conversations | For all active SSE streams referencing this agent, send system message: "This agent has been decommissioned" and close the stream |
| 3 | Mark historical conversations | Set `agent_deleted = true` on all conversations linked to this agent; data retained for audit |
| 4 | Deactivate triggers | `UPDATE event_triggers SET status = 'DISABLED' WHERE target_agent_id = :agentId` |
| 5 | Cancel pending drafts | `UPDATE worker_drafts SET status = 'CANCELLED', cancelled_reason = 'AGENT_DELETED' WHERE worker_id = :agentId AND status IN ('DRAFT', 'UNDER_REVIEW')` |
| 6 | Audit log | Write audit event: `action = 'AGENT_DELETED'`, `details = {agentId, agentType, cascadeActions: [triggers_disabled, drafts_cancelled]}` |

**Schema extension for soft delete:** [PLANNED]

```sql
-- Add soft delete columns to all agent tables [PLANNED]
ALTER TABLE super_agents ADD COLUMN deleted_at TIMESTAMPTZ;
ALTER TABLE sub_orchestrators ADD COLUMN deleted_at TIMESTAMPTZ;
ALTER TABLE workers ADD COLUMN deleted_at TIMESTAMPTZ;
```

**Agent deletion state diagram:** [PLANNED]

```mermaid
stateDiagram-v2
    [*] --> ACTIVE
    ACTIVE --> SUSPENDED: Suspend
    SUSPENDED --> ACTIVE: Reactivate
    ACTIVE --> DELETED: Delete (soft)
    SUSPENDED --> DELETED: Delete (soft)
    DELETED --> [*]: Terminal (preserved for audit)

    note right of DELETED
        On entry to DELETED:
        1. Close active streams
        2. Mark conversations
        3. Disable triggers
        4. Cancel pending drafts
        5. Audit log entry
    end note
```

---

### 4.16 Event Triggers API [PLANNED]

**Status:** [PLANNED]
**Cross-Reference:** ADR-025 (Event-Driven Agent Triggers), BA Domain Model -- EventTrigger + EventSchedule + EventSource, 02-Tech-Spec Section 3.28

```yaml
openapi: 3.1.0
paths:
  /api/v1/ai/event-triggers:
    get:
      operationId: listEventTriggers
      summary: List event triggers for the tenant
      tags: [Events]
      security:
        - bearerAuth: []
      parameters:
        - $ref: '#/components/parameters/X-Tenant-Id'
        - name: sourceType
          in: query
          schema:
            type: string
            enum: [ENTITY_LIFECYCLE, TIME_BASED, EXTERNAL_SYSTEM, USER_WORKFLOW]
        - name: enabled
          in: query
          schema:
            type: boolean
        - name: targetAgentId
          in: query
          schema:
            type: string
            format: uuid
        - name: page
          in: query
          schema:
            type: integer
            default: 0
        - name: size
          in: query
          schema:
            type: integer
            default: 20
      responses:
        '200':
          description: Paginated list of event triggers
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/PagedEventTriggerResponse'
    post:
      operationId: createEventTrigger
      summary: Create a new event trigger
      tags: [Events]
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/EventTriggerCreateRequest'
      responses:
        '201':
          description: Event trigger created
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/EventTriggerResponse'
        '400':
          $ref: '#/components/responses/ValidationError'

  /api/v1/ai/event-triggers/{triggerId}:
    get:
      operationId: getEventTrigger
      summary: Get event trigger details including schedule and execution history
      tags: [Events]
      parameters:
        - name: triggerId
          in: path
          required: true
          schema:
            type: string
            format: uuid
      responses:
        '200':
          description: Event trigger details
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/EventTriggerDetailResponse'
    put:
      operationId: updateEventTrigger
      summary: Update an event trigger
      tags: [Events]
      parameters:
        - name: triggerId
          in: path
          required: true
          schema:
            type: string
            format: uuid
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/EventTriggerUpdateRequest'
      responses:
        '200':
          description: Updated trigger
        '409':
          description: Optimistic lock conflict
    delete:
      operationId: deleteEventTrigger
      summary: Delete (disable) an event trigger
      tags: [Events]
      parameters:
        - name: triggerId
          in: path
          required: true
          schema:
            type: string
            format: uuid
      responses:
        '204':
          description: Trigger deleted

  /api/v1/ai/event-triggers/{triggerId}/test:
    post:
      operationId: testEventTrigger
      summary: Fire a test event to verify trigger configuration
      description: >
        Fires a synthetic event matching this trigger's conditions.
        The resulting agent execution runs in sandbox mode regardless
        of agent maturity level. [PLANNED]
      tags: [Events]
      parameters:
        - name: triggerId
          in: path
          required: true
          schema:
            type: string
            format: uuid
      responses:
        '202':
          description: Test event fired
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/TestEventResponse'

components:
  schemas:
    EventTriggerResponse:
      type: object
      properties:
        id:
          type: string
          format: uuid
        name:
          type: string
        sourceType:
          type: string
          enum: [ENTITY_LIFECYCLE, TIME_BASED, EXTERNAL_SYSTEM, USER_WORKFLOW]
        eventPattern:
          type: string
          description: "JSON path or regex pattern to match incoming events"
        targetAgentId:
          type: string
          format: uuid
        targetAgentType:
          type: string
          enum: [SUPER_AGENT, SUB_ORCHESTRATOR, WORKER]
        enabled:
          type: boolean
        schedule:
          $ref: '#/components/schemas/EventScheduleSummary'
        lastFiredAt:
          type: string
          format: date-time
        fireCount:
          type: integer
          format: int64
        version:
          type: integer
          format: int64

    EventTriggerCreateRequest:
      type: object
      properties:
        name:
          type: string
          maxLength: 255
        sourceType:
          type: string
          enum: [ENTITY_LIFECYCLE, TIME_BASED, EXTERNAL_SYSTEM, USER_WORKFLOW]
        eventPattern:
          type: string
          maxLength: 2000
        targetAgentId:
          type: string
          format: uuid
        targetAgentType:
          type: string
          enum: [SUPER_AGENT, SUB_ORCHESTRATOR, WORKER]
        enabled:
          type: boolean
          default: true
        schedule:
          $ref: '#/components/schemas/EventScheduleCreateRequest'
        taskTemplate:
          type: string
          maxLength: 5000
          description: "Template for the task description sent to the agent when trigger fires"
      required: [name, sourceType, eventPattern, targetAgentId, targetAgentType]

    EventScheduleSummary:
      type: object
      properties:
        cronExpression:
          type: string
        timezone:
          type: string
        nextFireAt:
          type: string
          format: date-time

    EventScheduleCreateRequest:
      type: object
      properties:
        cronExpression:
          type: string
          description: "Cron expression for TIME_BASED triggers (e.g., '0 0 2 * * ?' for daily 2AM)"
        timezone:
          type: string
          default: UTC
      required: [cronExpression]

    TestEventResponse:
      type: object
      properties:
        testEventId:
          type: string
          format: uuid
        triggerId:
          type: string
          format: uuid
        sandboxMode:
          type: boolean
          description: "Always true for test events"
        statusUrl:
          type: string
          format: uri
```

### 4.17 Ethics and Conduct Policies API [PLANNED]

**Status:** [PLANNED]
**Cross-Reference:** ADR-027 (Platform Ethics Baseline), BA Domain Model -- EthicsPolicy + ConductPolicy + PolicyViolation, 02-Tech-Spec Section 3.30

```yaml
openapi: 3.1.0
paths:
  /api/v1/ai/ethics/policies:
    get:
      operationId: listEthicsPolicies
      summary: List ethics policies (platform-level immutable + tenant-level configurable)
      description: >
        Returns both platform-level immutable ethics rules (7 baseline rules
        per ADR-027) and tenant-configurable conduct extensions. Platform
        rules cannot be modified or overridden. [PLANNED]
      tags: [Ethics]
      security:
        - bearerAuth: []
      parameters:
        - $ref: '#/components/parameters/X-Tenant-Id'
        - name: scope
          in: query
          schema:
            type: string
            enum: [PLATFORM, TENANT, ALL]
            default: ALL
        - name: active
          in: query
          schema:
            type: boolean
            default: true
      responses:
        '200':
          description: List of ethics policies with their conduct rules
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/EthicsPolicyListResponse'

  /api/v1/ai/ethics/policies/tenant:
    post:
      operationId: createTenantConductPolicy
      summary: Create a tenant-specific conduct policy extension
      description: >
        Tenants can add conduct rules that extend (never weaken) the
        platform ethics baseline. For example, a healthcare tenant may
        add HIPAA-specific conduct rules. [PLANNED]
      tags: [Ethics]
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/ConductPolicyCreateRequest'
      responses:
        '201':
          description: Conduct policy created
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ConductPolicyResponse'
        '400':
          description: Policy weakens platform baseline (rejected)

  /api/v1/ai/ethics/policies/tenant/{policyId}:
    put:
      operationId: updateTenantConductPolicy
      summary: Update a tenant conduct policy
      tags: [Ethics]
      parameters:
        - name: policyId
          in: path
          required: true
          schema:
            type: string
            format: uuid
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/ConductPolicyUpdateRequest'
      responses:
        '200':
          description: Updated conduct policy
        '400':
          description: Update would weaken platform baseline
        '409':
          description: Optimistic lock conflict

  /api/v1/ai/ethics/violations:
    get:
      operationId: listPolicyViolations
      summary: List policy violations for the tenant
      tags: [Ethics]
      parameters:
        - $ref: '#/components/parameters/X-Tenant-Id'
        - name: severity
          in: query
          schema:
            type: string
            enum: [LOW, MEDIUM, HIGH, CRITICAL]
        - name: resolved
          in: query
          schema:
            type: boolean
        - name: agentId
          in: query
          schema:
            type: string
            format: uuid
        - name: page
          in: query
          schema:
            type: integer
            default: 0
        - name: size
          in: query
          schema:
            type: integer
            default: 20
      responses:
        '200':
          description: Paginated list of policy violations
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/PagedViolationResponse'

  /api/v1/ai/ethics/violations/{violationId}/resolve:
    post:
      operationId: resolveViolation
      summary: Mark a policy violation as resolved
      tags: [Ethics]
      parameters:
        - name: violationId
          in: path
          required: true
          schema:
            type: string
            format: uuid
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/ViolationResolutionRequest'
      responses:
        '200':
          description: Violation resolved
        '409':
          description: Violation already resolved

components:
  schemas:
    EthicsPolicyListResponse:
      type: object
      properties:
        platformPolicies:
          type: array
          items:
            $ref: '#/components/schemas/EthicsPolicySummary'
          description: "Immutable platform-level ethics rules (7 baseline rules)"
        tenantPolicies:
          type: array
          items:
            $ref: '#/components/schemas/EthicsPolicySummary'
          description: "Tenant-configurable conduct extensions"

    EthicsPolicySummary:
      type: object
      properties:
        id:
          type: string
          format: uuid
        name:
          type: string
        scope:
          type: string
          enum: [PLATFORM, TENANT]
        immutable:
          type: boolean
        active:
          type: boolean
        conductRules:
          type: array
          items:
            $ref: '#/components/schemas/ConductRuleSummary'

    ConductRuleSummary:
      type: object
      properties:
        id:
          type: string
          format: uuid
        ruleCode:
          type: string
        description:
          type: string
        severity:
          type: string
          enum: [LOW, MEDIUM, HIGH, CRITICAL]
        enforcementAction:
          type: string
          enum: [LOG, WARN, BLOCK, SUSPEND_AGENT]

    ConductPolicyCreateRequest:
      type: object
      properties:
        name:
          type: string
          maxLength: 255
        description:
          type: string
          maxLength: 2000
        conductRules:
          type: array
          items:
            $ref: '#/components/schemas/ConductRuleCreateRequest'
      required: [name, conductRules]

    ConductRuleCreateRequest:
      type: object
      properties:
        ruleCode:
          type: string
          maxLength: 100
          pattern: "^[A-Z][A-Z0-9_]+$"
        description:
          type: string
          maxLength: 1000
        severity:
          type: string
          enum: [LOW, MEDIUM, HIGH, CRITICAL]
        enforcementAction:
          type: string
          enum: [LOG, WARN, BLOCK, SUSPEND_AGENT]
        validationExpression:
          type: string
          maxLength: 2000
          description: "SpEL or JSON path expression to evaluate against agent output"
      required: [ruleCode, description, severity, enforcementAction]

    ConductPolicyUpdateRequest:
      type: object
      properties:
        name:
          type: string
        description:
          type: string
        active:
          type: boolean
        version:
          type: integer
          format: int64
      required: [version]

    ViolationResolutionRequest:
      type: object
      properties:
        resolution:
          type: string
          maxLength: 2000
        correctiveAction:
          type: string
          enum: [ACKNOWLEDGED, AGENT_RETRAINED, POLICY_UPDATED, FALSE_POSITIVE]
      required: [resolution, correctiveAction]
```

### 4.18 Cross-Tenant Benchmarks API [PLANNED]

**Status:** [PLANNED]
**Cross-Reference:** ADR-026 (Schema-per-Tenant), BA Domain Model -- BenchmarkMetric + BenchmarkComparison, 02-Tech-Spec Section 3.31

```yaml
openapi: 3.1.0
paths:
  /api/v1/ai/benchmarks:
    get:
      operationId: getTenantBenchmarks
      summary: Get the tenant's own benchmark metrics
      tags: [Benchmarks]
      security:
        - bearerAuth: []
      parameters:
        - $ref: '#/components/parameters/X-Tenant-Id'
        - name: metricName
          in: query
          schema:
            type: string
          description: "Filter by metric name (e.g., avg_response_time, task_success_rate)"
        - name: agentId
          in: query
          schema:
            type: string
            format: uuid
        - name: from
          in: query
          schema:
            type: string
            format: date-time
        - name: to
          in: query
          schema:
            type: string
            format: date-time
        - name: granularity
          in: query
          schema:
            type: string
            enum: [HOURLY, DAILY, WEEKLY, MONTHLY]
            default: DAILY
      responses:
        '200':
          description: Tenant benchmark metrics
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/BenchmarkMetricsResponse'

  /api/v1/ai/benchmarks/compare:
    get:
      operationId: getAnonymizedComparison
      summary: Get anonymized cross-tenant benchmark comparison
      description: >
        Returns the tenant's metrics compared against anonymized aggregate
        statistics from other tenants. Uses k-anonymity (k >= 5) to ensure
        no individual tenant can be identified. Only returns comparison
        data when at least 5 tenants contribute to the metric. [PLANNED]
      tags: [Benchmarks]
      security:
        - bearerAuth: []
      parameters:
        - $ref: '#/components/parameters/X-Tenant-Id'
        - name: metricName
          in: query
          required: true
          schema:
            type: string
        - name: period
          in: query
          schema:
            type: string
            enum: [LAST_7_DAYS, LAST_30_DAYS, LAST_90_DAYS]
            default: LAST_30_DAYS
      responses:
        '200':
          description: Anonymized comparison data
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/BenchmarkComparisonResponse'
        '422':
          description: Insufficient tenant pool for k-anonymity (fewer than 5 tenants)

components:
  schemas:
    BenchmarkMetricsResponse:
      type: object
      properties:
        tenantId:
          type: string
          format: uuid
        metrics:
          type: array
          items:
            $ref: '#/components/schemas/BenchmarkMetricEntry'

    BenchmarkMetricEntry:
      type: object
      properties:
        metricName:
          type: string
        agentId:
          type: string
          format: uuid
        value:
          type: number
          format: double
        unit:
          type: string
          description: "e.g., ms, percentage, count"
        recordedAt:
          type: string
          format: date-time

    BenchmarkComparisonResponse:
      type: object
      properties:
        metricName:
          type: string
        period:
          type: string
        tenantValue:
          type: number
          format: double
          description: "The requesting tenant's metric value"
        aggregateStats:
          $ref: '#/components/schemas/AggregateStats'
        percentileRank:
          type: number
          format: double
          minimum: 0.0
          maximum: 100.0
          description: "Tenant's percentile rank among all tenants"
        tenantPoolSize:
          type: integer
          description: "Number of tenants contributing to comparison (always >= 5)"
        kAnonymityMet:
          type: boolean
          description: "Always true when data is returned; false triggers 422"

    AggregateStats:
      type: object
      properties:
        mean:
          type: number
          format: double
        median:
          type: number
          format: double
        p25:
          type: number
          format: double
        p75:
          type: number
          format: double
        p90:
          type: number
          format: double
        min:
          type: number
          format: double
        max:
          type: number
          format: double
        stdDev:
          type: number
          format: double
```

### 4.19 Super Agent Error Codes [PLANNED]

**Status:** [PLANNED]

The following error codes extend the catalog in Section 4.9 for Super Agent endpoints:

| HTTP Status | Error Type URI | Title | Applies To |
|-------------|---------------|-------|------------|
| 400 | `/problems/invalid-trigger-pattern` | Invalid Event Pattern | POST /events/triggers |
| 400 | `/problems/policy-weakens-baseline` | Policy Weakens Platform Baseline | POST /ethics/policies/tenant |
| 403 | `/problems/immutable-policy` | Cannot Modify Immutable Policy | PUT /ethics/policies |
| 403 | `/problems/maturity-level-insufficient` | Maturity Level Insufficient | Any endpoint requiring minimum maturity (distinct from RBAC `ACCESS_DENIED`; indicates the agent's ATS score/maturity level is too low for the requested operation) |
| 404 | `/problems/agent-not-found` | Agent Not Found | GET /maturity/{agentId} |
| 409 | `/problems/draft-wrong-status` | Draft Not In Expected Status | POST /drafts/{id}/review |
| 409 | `/problems/promotion-pending` | Promotion Already Pending | POST /maturity/{id}/promote |
| 409 | `/problems/checkpoint-resolved` | Checkpoint Already Resolved | POST /approvals/{id}/decide |
| 422 | `/problems/insufficient-k-anonymity` | Insufficient Tenant Pool | GET /benchmarks/compare |
| 422 | `/problems/maturity-threshold-not-met` | Maturity Threshold Not Met | POST /maturity/{id}/promote |
| 429 | `/problems/agent-concurrency-exceeded` | Agent Concurrency Limit Exceeded | POST /workers/{id}/execute |
| 503 | `/problems/sandbox-unavailable` | Draft Sandbox Unavailable | POST /workers/{id}/execute |

### 4.19.1 Cross-Tenant Error Codes [PLANNED]

**Status:** [PLANNED]
**Cross-Reference:** Section 6.13 (Cross-Tenant Data Boundary Enforcement), Section 4.15.1 (HITL Escalation Chain), ADR-026 (Schema-per-Tenant), ADR-027 (Platform Ethics Baseline)

The following error codes are specific to cross-tenant operations initiated by `PLATFORM_ADMIN` users from the master tenant (UUID: `00000000-0000-0000-0000-000000000000`). These extend the Super Agent error catalog in Section 4.19 and use the RFC 7807 Problem Details format: [PLANNED]

| Error Code | HTTP Status | Error Type URI | Scenario | Response Body |
|------------|-------------|----------------|----------|---------------|
| AI-CT-001 | 403 | `/problems/cross-tenant-forbidden` | Non-PLATFORM_ADMIN attempts cross-tenant access | `{"code":"AI-CT-001","type":"/problems/cross-tenant-forbidden","title":"Cross-Tenant Access Denied","detail":"Cross-tenant access requires PLATFORM_ADMIN role","status":403}` |
| AI-CT-002 | 404 | `/problems/target-tenant-not-found` | Target tenant not found | `{"code":"AI-CT-002","type":"/problems/target-tenant-not-found","title":"Tenant Not Found","detail":"Tenant {tenantId} not found","tenantId":"...","status":404}` |
| AI-CT-003 | 409 | `/problems/tenant-already-suspended` | Tenant already in SUSPENDED state | `{"code":"AI-CT-003","type":"/problems/tenant-already-suspended","title":"Tenant Already Suspended","detail":"Tenant {tenantId} is already in SUSPENDED state","tenantId":"...","status":409}` |
| AI-CT-004 | 422 | `/problems/master-tenant-immutable` | Cannot suspend the master tenant | `{"code":"AI-CT-004","type":"/problems/master-tenant-immutable","title":"Master Tenant Protected","detail":"Master tenant cannot be suspended","status":422}` |
| AI-CT-005 | 422 | `/problems/ethics-baseline-immutable` | Attempt to modify immutable platform ethics rules (ETH-001 to ETH-007) | `{"code":"AI-CT-005","type":"/problems/ethics-baseline-immutable","title":"Immutable Ethics Baseline","detail":"Rules ETH-001 to ETH-007 are immutable baseline rules","status":422}` |
| AI-CT-006 | 429 | `/problems/cross-tenant-rate-limited` | Cross-tenant query rate limit exceeded | `{"code":"AI-CT-006","type":"/problems/cross-tenant-rate-limited","title":"Rate Limit Exceeded","detail":"Rate limit: max 100 cross-tenant queries per minute","status":429,"retryAfterSeconds":60}` |
| AI-CT-007 | 503 | `/problems/target-tenant-agent-unavailable` | Target tenant's agent is unavailable (e.g., suspended, decommissioned) | `{"code":"AI-CT-007","type":"/problems/target-tenant-agent-unavailable","title":"Agent Unavailable","detail":"Agent for tenant {tenantId} is currently unavailable","tenantId":"...","status":503}` |
| AI-CT-008 | 408 | `/problems/hitl-escalation-timeout` | HITL approval timed out at all escalation levels (L1 through L3) | `{"code":"AI-CT-008","type":"/problems/hitl-escalation-timeout","title":"HITL Timeout","detail":"HITL approval timed out after escalation to all levels","checkpointId":"...","finalAction":"AUTO_REJECT","status":408}` |
| AI-CT-009 | 422 | `/problems/k-anonymity-violation` | Benchmark query would expose data below k-anonymity threshold | `{"code":"AI-CT-009","type":"/problems/k-anonymity-violation","title":"K-Anonymity Threshold Violation","detail":"Query would expose data below k-anonymity threshold (k<5)","status":422}` |
| AI-CT-010 | 422 | `/problems/tenant-decommission-blocked` | Cannot decommission tenant with active workers | `{"code":"AI-CT-010","type":"/problems/tenant-decommission-blocked","title":"Decommission Blocked","detail":"Cannot decommission: {count} workers still active. Suspend first.","activeWorkerCount":0,"tenantId":"...","status":422}` |

#### Cross-Tenant Error State Diagram

```mermaid
stateDiagram-v2
    [*] --> RequestReceived
    RequestReceived --> RoleCheck: Validate caller role
    RoleCheck --> AI_CT_001: Not PLATFORM_ADMIN
    RoleCheck --> TenantLookup: PLATFORM_ADMIN confirmed

    TenantLookup --> AI_CT_002: Tenant not found
    TenantLookup --> RateCheck: Tenant found

    RateCheck --> AI_CT_006: Rate limit exceeded
    RateCheck --> OperationDispatch: Within rate limit

    OperationDispatch --> SuspendFlow: Operation = SUSPEND
    OperationDispatch --> DecommissionFlow: Operation = DECOMMISSION
    OperationDispatch --> EthicsFlow: Operation = MODIFY_ETHICS
    OperationDispatch --> BenchmarkFlow: Operation = BENCHMARK_QUERY
    OperationDispatch --> AgentFlow: Operation = AGENT_QUERY

    SuspendFlow --> AI_CT_004: Target is master tenant
    SuspendFlow --> AI_CT_003: Already suspended
    SuspendFlow --> Success: Suspended

    DecommissionFlow --> AI_CT_010: Active workers exist
    DecommissionFlow --> Success: Decommissioned

    EthicsFlow --> AI_CT_005: Immutable baseline rule
    EthicsFlow --> Success: Policy updated

    BenchmarkFlow --> AI_CT_009: k-anonymity violation
    BenchmarkFlow --> Success: Data returned

    AgentFlow --> AI_CT_007: Agent unavailable
    AgentFlow --> Success: Agent responded

    AI_CT_001 --> [*]
    AI_CT_002 --> [*]
    AI_CT_003 --> [*]
    AI_CT_004 --> [*]
    AI_CT_005 --> [*]
    AI_CT_006 --> [*]
    AI_CT_007 --> [*]
    AI_CT_008 --> [*]
    AI_CT_009 --> [*]
    AI_CT_010 --> [*]
    Success --> [*]
```

#### Retry Guidance for Cross-Tenant Errors

| Error Code | Retryable | Strategy |
|------------|-----------|----------|
| AI-CT-001 | No | Client error -- requires role elevation |
| AI-CT-002 | No | Client error -- tenant does not exist |
| AI-CT-003 | No | Client error -- idempotent (already in desired state) |
| AI-CT-004 | No | Client error -- business rule violation |
| AI-CT-005 | No | Client error -- immutable rule |
| AI-CT-006 | Yes | Wait `retryAfterSeconds` (from response), then retry |
| AI-CT-007 | Yes | 3 attempts with exponential backoff (1s, 2s, 4s) |
| AI-CT-008 | No | Timeout is terminal; review escalation config or manually override |
| AI-CT-009 | No | Client error -- insufficient tenant pool |
| AI-CT-010 | No | Client error -- suspend active workers first, then retry decommission |

---

### 4.20 Export Endpoints [PLANNED]

**Status:** [PLANNED]

```yaml
openapi: 3.1.0
paths:
  /api/v1/ai/hierarchy/export:
    get:
      operationId: exportHierarchy
      summary: Export the agent hierarchy (Super Agent, Sub-Orchestrators, Workers) as PDF
      tags: [Export]
      security:
        - bearerAuth: []
      parameters:
        - $ref: '#/components/parameters/X-Tenant-Id'
        - name: format
          in: query
          required: true
          schema:
            type: string
            enum: [pdf]
          description: Export format
      responses:
        '200':
          description: Hierarchy export file
          content:
            application/pdf:
              schema:
                type: string
                format: binary
        '401':
          $ref: '#/components/responses/Unauthorized'
        '403':
          $ref: '#/components/responses/Forbidden'

  /api/v1/ai/maturity/export:
    get:
      operationId: exportMaturityScores
      summary: Export agent maturity scores and ATS history as CSV
      tags: [Export]
      security:
        - bearerAuth: []
      parameters:
        - $ref: '#/components/parameters/X-Tenant-Id'
        - name: format
          in: query
          required: true
          schema:
            type: string
            enum: [csv]
          description: Export format
        - name: from
          in: query
          schema:
            type: string
            format: date
          description: Start date for score history
        - name: to
          in: query
          schema:
            type: string
            format: date
          description: End date for score history
      responses:
        '200':
          description: Maturity export file
          content:
            text/csv:
              schema:
                type: string
        '401':
          $ref: '#/components/responses/Unauthorized'
        '403':
          $ref: '#/components/responses/Forbidden'
```

---

## 5. Inter-Service Communication

**Status:** [PLANNED]
**Cross-Reference:** 02-Tech-Spec Section 6, 01-PRD Section 2.2

### 5.1 Kafka Topic Design

```mermaid
graph LR
    subgraph Producers
        AO[agent-orchestrator]
        ADA[agent-data-analyst]
        ACS[agent-customer-support]
        ACR[agent-code-reviewer]
        ADP[agent-document-processor]
        FS[feedback-service]
        TO[training-orchestrator]
        MS[material-service]
        AIS["ai-service (Super Agent) [PLANNED]"]
        EXT["External Systems [PLANNED]"]
        SCHED["Event Scheduler [PLANNED]"]
    end

    subgraph Topics
        T1[agent.traces]
        T2[feedback.signals]
        T3[feedback.customer]
        T4[knowledge.updates]
        T5[training.data.priority]
        T6[agent.tasks]
        T7[agent.results]
        T8[model.events]
        T9["agent.events.entity_lifecycle [PLANNED]"]
        T10["agent.events.scheduled [PLANNED]"]
        T11["agent.audit [PLANNED]"]
        T12["ethics.policy.updated [PLANNED]"]
    end

    subgraph Consumers
        TC[trace-collector]
        TDS[training-data-service]
        FS2[feedback-service]
        DP[document-processor]
        AllAgents[All Agents]
        ETS["EventTriggerService [PLANNED]"]
        AuditC["Audit Persistence [PLANNED]"]
        PolicyC["TenantPolicyCache [PLANNED]"]
    end

    AO --> T1
    ADA --> T1
    ACS --> T1
    ACR --> T1
    ADP --> T1
    T1 --> TC

    FS --> T2
    T2 --> TDS

    FS --> T5
    T5 --> TO

    MS --> T4
    T4 --> DP

    AO --> T6
    T6 --> ADA
    T6 --> ACS
    T6 --> ACR
    T6 --> ADP

    ADA --> T7
    ACS --> T7
    ACR --> T7
    ADP --> T7
    T7 --> AO

    TO --> T8
    T8 --> AllAgents

    EXT --> T9
    T9 --> ETS

    SCHED --> T10
    T10 --> ETS

    AIS --> T11
    T11 --> AuditC

    AIS --> T12
    T12 --> PolicyC
```

### 5.2 Topic Specifications

| Topic | Partitions | Replication Factor | Retention | Key | Value Schema |
|-------|-----------|-------------------|-----------|-----|-------------|
| `agent.traces` | 6 | 3 | 90 days | traceId (String) | AgentTraceEvent |
| `feedback.signals` | 3 | 3 | 30 days | traceId (String) | FeedbackSignalEvent |
| `feedback.customer` | 3 | 3 | 30 days | customerId (String) | CustomerFeedbackEvent |
| `knowledge.updates` | 3 | 3 | 7 days | materialId (String) | KnowledgeUpdateEvent |
| `training.data.priority` | 1 | 3 | 7 days | correctionId (String) | TrainingExampleEvent |
| `agent.tasks` | 6 | 3 | 1 day | taskId (String) | AgentTaskEvent |
| `agent.results` | 6 | 3 | 1 day | taskId (String) | AgentResultEvent |
| `model.events` | 1 | 3 | 30 days | modelName (String) | ModelEvent |
| `agent.events.entity_lifecycle` | 6 | 3 | 7 days | entityId (String) | EntityLifecycleEvent |
| `agent.events.scheduled` | 3 | 3 | 1 day | triggerId (String) | ScheduledTriggerEvent |
| `agent.audit` | 6 | 3 | 90 days | traceId (String) | AgentAuditEvent |
| `ethics.policy.updated` | 1 | 3 | 7 days | tenantId (String) | PolicyUpdatedEvent |

### 5.3 Message Schemas

#### 5.3.1 AgentTraceEvent

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "required": ["traceId", "tenantId", "agentType", "timestamp"],
  "properties": {
    "traceId": { "type": "string" },
    "tenantId": { "type": "string", "format": "uuid" },
    "agentType": { "type": "string" },
    "skillId": { "type": "string" },
    "modelUsed": { "type": "string" },
    "taskType": { "type": "string" },
    "complexityLevel": { "type": "string", "enum": ["SIMPLE", "MODERATE", "COMPLEX", "CODE_SPECIFIC"] },
    "requestContent": { "type": "string" },
    "responseContent": { "type": "string" },
    "confidenceScore": { "type": "number", "minimum": 0, "maximum": 1 },
    "turnsUsed": { "type": "integer" },
    "latencyMs": { "type": "integer" },
    "tokenCountInput": { "type": "integer" },
    "tokenCountOutput": { "type": "integer" },
    "pipelineRunId": { "type": "string" },
    "toolCalls": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "toolName": { "type": "string" },
          "arguments": { "type": "string" },
          "result": { "type": "string" },
          "latencyMs": { "type": "integer" },
          "success": { "type": "boolean" }
        }
      }
    },
    "pipelineSteps": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "stepName": { "type": "string" },
          "durationMs": { "type": "integer" },
          "status": { "type": "string" }
        }
      }
    },
    "status": { "type": "string", "enum": ["COMPLETED", "FAILED", "TIMEOUT"] },
    "errorMessage": { "type": "string" },
    "timestamp": { "type": "string", "format": "date-time" }
  }
}
```

#### 5.3.2 FeedbackSignalEvent

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "required": ["traceId", "signalType", "timestamp"],
  "properties": {
    "traceId": { "type": "string" },
    "tenantId": { "type": "string", "format": "uuid" },
    "signalType": { "type": "string", "enum": ["POSITIVE", "NEGATIVE", "CORRECTION"] },
    "rating": { "type": "integer", "minimum": 1, "maximum": 5 },
    "comment": { "type": "string" },
    "correctedResponse": { "type": "string" },
    "correctionReason": { "type": "string" },
    "userId": { "type": "string", "format": "uuid" },
    "agentType": { "type": "string" },
    "timestamp": { "type": "string", "format": "date-time" }
  }
}
```

#### 5.3.3 ModelEvent

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "required": ["eventType", "modelName", "version", "timestamp"],
  "properties": {
    "eventType": { "type": "string", "enum": ["DEPLOYED", "ROLLED_BACK", "SHADOW_START", "SHADOW_END", "RETIRED"] },
    "modelName": { "type": "string" },
    "version": { "type": "string" },
    "previousVersion": { "type": "string" },
    "qualityScore": { "type": "number" },
    "trafficPercentage": { "type": "number" },
    "environment": { "type": "string" },
    "timestamp": { "type": "string", "format": "date-time" }
  }
}
```

#### 5.3.4 EntityLifecycleEvent [PLANNED]

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "required": ["eventId", "tenantId", "entityType", "entityId", "changeType", "timestamp"],
  "properties": {
    "eventId": { "type": "string", "format": "uuid" },
    "tenantId": { "type": "string", "format": "uuid" },
    "entityType": { "type": "string", "description": "Source entity type (e.g., CUSTOMER, ORDER, INVOICE)" },
    "entityId": { "type": "string", "description": "Source entity ID" },
    "changeType": { "type": "string", "enum": ["CREATED", "UPDATED", "DELETED", "STATUS_CHANGED"] },
    "changedFields": {
      "type": "array",
      "items": { "type": "string" },
      "description": "List of fields that changed (for UPDATED events)"
    },
    "sourceSystem": { "type": "string", "description": "External system that produced the event (e.g., CRM, ERP)" },
    "payload": { "type": "object", "description": "Entity snapshot or diff payload" },
    "correlationId": { "type": "string", "description": "Optional correlation ID for event chaining" },
    "timestamp": { "type": "string", "format": "date-time" }
  }
}
```

#### 5.3.5 ScheduledTriggerEvent [PLANNED]

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "required": ["triggerId", "tenantId", "triggerName", "taskDescription", "timestamp"],
  "properties": {
    "triggerId": { "type": "string", "format": "uuid" },
    "tenantId": { "type": "string", "format": "uuid" },
    "triggerName": { "type": "string", "description": "Human-readable trigger name" },
    "scheduleExpression": { "type": "string", "description": "Cron expression that fired this event" },
    "taskDescription": { "type": "string", "description": "Rendered task description with resolved context" },
    "targetAgentType": { "type": "string", "enum": ["SUPER_AGENT", "SUB_ORCHESTRATOR"] },
    "targetAgentId": { "type": "string", "format": "uuid" },
    "fireCount": { "type": "integer", "description": "Number of times this trigger has fired" },
    "timestamp": { "type": "string", "format": "date-time" }
  }
}
```

#### 5.3.6 AgentAuditEvent [PLANNED]

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "required": ["auditId", "tenantId", "action", "agentId", "agentType", "timestamp"],
  "properties": {
    "auditId": { "type": "string", "format": "uuid" },
    "tenantId": { "type": "string", "format": "uuid" },
    "action": {
      "type": "string",
      "enum": [
        "DRAFT_COMMITTED", "DRAFT_REJECTED", "DRAFT_CREATED",
        "APPROVAL_GRANTED", "APPROVAL_DENIED", "APPROVAL_ESCALATED",
        "MATURITY_PROMOTED", "MATURITY_DEMOTED",
        "POLICY_VIOLATION", "POLICY_EVALUATED",
        "SCHEDULED_TASK_COMPLETED", "EVENT_TRIGGER_FIRED",
        "TOOL_EXECUTED", "AGENT_ACTIVATED", "AGENT_DEACTIVATED"
      ]
    },
    "agentId": { "type": "string", "format": "uuid" },
    "agentType": { "type": "string", "enum": ["SUPER_AGENT", "SUB_ORCHESTRATOR", "WORKER"] },
    "targetEntityType": { "type": "string", "description": "Type of entity being acted upon" },
    "targetEntityId": { "type": "string", "description": "ID of entity being acted upon" },
    "userId": { "type": "string", "format": "uuid", "description": "User who initiated the action (if human-initiated)" },
    "details": { "type": "object", "description": "Action-specific metadata" },
    "executionTraceId": { "type": "string", "description": "Link to execution trace for full audit chain" },
    "duration": { "type": "integer", "description": "Action duration in milliseconds" },
    "timestamp": { "type": "string", "format": "date-time" }
  }
}
```

#### 5.3.7 PolicyUpdatedEvent [PLANNED]

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "required": ["eventType", "tenantId", "policyId", "updatedBy", "timestamp"],
  "properties": {
    "eventType": { "type": "string", "enum": ["CONDUCT_POLICY_CREATED", "CONDUCT_POLICY_UPDATED", "CONDUCT_POLICY_DEACTIVATED"] },
    "tenantId": { "type": "string", "format": "uuid" },
    "policyId": { "type": "string", "format": "uuid" },
    "policyVersion": { "type": "integer", "description": "New version number after update" },
    "updatedBy": { "type": "string", "format": "uuid", "description": "Admin user who made the change" },
    "previousHash": { "type": "string", "description": "SHA-256 hash of previous policy state for verification" },
    "newHash": { "type": "string", "description": "SHA-256 hash of new policy state" },
    "changeDescription": { "type": "string", "description": "Human-readable summary of what changed" },
    "timestamp": { "type": "string", "format": "date-time" }
  }
}
```

### 5.4 Consumer Group Strategy

| Consumer Group | Topics | Instances | Strategy |
|---------------|--------|-----------|----------|
| `trace-collector-group` | agent.traces | 2 | All traces consumed by trace-collector for persistence |
| `training-data-group` | feedback.signals | 1 | Single consumer ensures ordering per trace |
| `feedback-customer-group` | feedback.customer | 2 | External customer feedback processing |
| `knowledge-processor-group` | knowledge.updates | 2 | Document chunking and embedding |
| `training-priority-group` | training.data.priority | 1 | Priority corrections processed sequentially |
| `agent-task-{agentType}` | agent.tasks | 1 per agent type | Each agent type has its own consumer group |
| `model-events-{service}` | model.events | 1 per service | Every agent service subscribes for model updates |
| `event-trigger-group` | agent.events.entity_lifecycle | 2 | EventTriggerService matches events to active triggers [PLANNED] |
| `scheduled-trigger-group` | agent.events.scheduled | 1 | Sequential processing of scheduled trigger events [PLANNED] |
| `agent-audit-group` | agent.audit | 2 | Audit event persistence and compliance logging [PLANNED] |
| `ethics-policy-reload-{instance}` | ethics.policy.updated | 1 per ai-service instance | Each instance refreshes its TenantPolicyCache independently [PLANNED] |

### 5.5 Dead Letter Queue Configuration

Each consumer group has a corresponding DLQ topic for messages that fail processing after maximum retries.

```yaml
# Shared Kafka consumer DLQ config
spring:
  kafka:
    consumer:
      properties:
        spring.kafka.listener.concurrency: 3
    listener:
      ack-mode: RECORD
      default-error-handler:
        type: DefaultErrorHandler
        back-off:
          initial-interval: 1000
          multiplier: 2.0
          max-interval: 30000
        max-retries: 3
```

| Source Topic | DLQ Topic | Retry Policy |
|-------------|-----------|-------------|
| agent.traces | agent.traces.dlq | 3 retries, exponential backoff |
| feedback.signals | feedback.signals.dlq | 3 retries, exponential backoff |
| training.data.priority | training.data.priority.dlq | 5 retries (critical data) |
| knowledge.updates | knowledge.updates.dlq | 3 retries |
| agent.tasks | agent.tasks.dlq | 2 retries (time-sensitive) |
| model.events | model.events.dlq | 3 retries |
| agent.events.entity_lifecycle | agent.events.entity_lifecycle.dlq | 3 retries, exponential backoff |
| agent.events.scheduled | agent.events.scheduled.dlq | 5 retries (scheduled tasks are critical; must not be silently dropped) |
| agent.audit | agent.audit.dlq | 5 retries (audit events are compliance-critical; DLQ alerts on entry) |
| ethics.policy.updated | ethics.policy.updated.dlq | 3 retries (policy reload failure triggers BLOCK-on-stale fallback) |

---

## 6. Security Architecture

**Status:** [PLANNED]
**Cross-Reference:** 01-PRD Section 7, 02-Tech-Spec Section 1.2

### 6.1 JWT Token Validation Flow

All API requests pass through the Spring Cloud Gateway, which validates the JWT issued by Keycloak before routing to downstream services.

```mermaid
sequenceDiagram
    participant Client
    participant Gateway as API Gateway
    participant Keycloak
    participant Service as Agent Service

    Client->>Gateway: POST /api/v1/agents/data-analyst/chat<br/>Authorization: Bearer {JWT}
    Gateway->>Gateway: Extract JWT from Authorization header
    Gateway->>Keycloak: GET /.well-known/openid-configuration<br/>(cached JWKS)
    Keycloak-->>Gateway: JWKS public keys
    Gateway->>Gateway: Validate JWT signature (RS256)
    Gateway->>Gateway: Check token expiry (exp claim)
    Gateway->>Gateway: Verify issuer (iss == Keycloak realm URL)
    Gateway->>Gateway: Verify audience (aud contains platform client)

    alt Token Invalid
        Gateway-->>Client: 401 Unauthorized<br/>ProblemDetail: authentication-required
    end

    Gateway->>Gateway: Extract tenant context from JWT claims<br/>(tenantId, roles, userId)
    Gateway->>Gateway: Check rate limit (per-tenant, via Valkey)

    alt Rate Limited
        Gateway-->>Client: 429 Too Many Requests
    end

    Gateway->>Service: Forward request with<br/>X-Tenant-Id, X-User-Id, X-Roles headers
    Service->>Service: Validate tenant context<br/>Apply tenant-scoped data filtering
    Service-->>Gateway: 200 OK (response)
    Gateway-->>Client: 200 OK (response)
```

### 6.2 Tenant Context Extraction

The JWT issued by Keycloak contains custom claims for tenant isolation:

```json
{
  "sub": "user-uuid-here",
  "iss": "https://keycloak.example.com/realms/emsist",
  "aud": "agent-platform",
  "exp": 1709741234,
  "iat": 1709737634,
  "realm_access": {
    "roles": ["USER", "DOMAIN_EXPERT"]
  },
  "tenant_id": "tenant-uuid-here",
  "tenant_namespace": "acme-corp",
  "preferred_username": "john.doe@acme.com"
}
```

The gateway extracts these claims and propagates them as HTTP headers:

| JWT Claim | Propagated Header | Used By |
|-----------|------------------|---------|
| `tenant_id` | `X-Tenant-Id` | All services for data scoping |
| `sub` | `X-User-Id` | Audit fields (createdBy, updatedBy) |
| `realm_access.roles` | `X-Roles` | Authorization checks |
| `tenant_namespace` | `X-Tenant-Namespace` | Vector store namespace selection |

### 6.3 API Gateway Route Security Rules

```yaml
# Security filter chain for the API Gateway
spring:
  security:
    oauth2:
      resourceserver:
        jwt:
          issuer-uri: ${KEYCLOAK_ISSUER_URI}
          jwk-set-uri: ${KEYCLOAK_ISSUER_URI}/protocol/openid-connect/certs

# Route-level security rules
gateway:
  security:
    routes:
      # Public endpoints (no auth required)
      - pattern: /actuator/health
        auth: NONE
      - pattern: /eureka/**
        auth: NONE

      # User-level endpoints
      - pattern: /api/v1/agents/*/chat
        auth: AUTHENTICATED
        roles: [USER, DOMAIN_EXPERT, ML_ENGINEER, ADMIN]
      - pattern: /api/v1/pipeline/execute
        auth: AUTHENTICATED
        roles: [USER, DOMAIN_EXPERT, ML_ENGINEER, ADMIN]
      - pattern: /api/v1/feedback/**
        auth: AUTHENTICATED
        roles: [USER, DOMAIN_EXPERT, ML_ENGINEER, ADMIN]

      # Domain expert endpoints
      - pattern: /api/v1/skills/**
        auth: AUTHENTICATED
        roles: [DOMAIN_EXPERT, ML_ENGINEER, ADMIN]
      - pattern: /api/v1/tools/**
        auth: AUTHENTICATED
        roles: [DOMAIN_EXPERT, ML_ENGINEER, ADMIN]
      - pattern: /api/v1/patterns/**
        auth: AUTHENTICATED
        roles: [DOMAIN_EXPERT, ML_ENGINEER, ADMIN]
      - pattern: /api/v1/materials/**
        auth: AUTHENTICATED
        roles: [DOMAIN_EXPERT, ML_ENGINEER, ADMIN]

      # ML Engineer endpoints
      - pattern: /api/v1/training/**
        auth: AUTHENTICATED
        roles: [ML_ENGINEER, ADMIN]
      - pattern: /api/v1/models/**
        auth: AUTHENTICATED
        roles: [ML_ENGINEER, ADMIN]

      # Super Agent endpoints [PLANNED] (See Sections 4.10-4.20)
      - pattern: /api/v1/ai/super-agent
        auth: AUTHENTICATED
        roles: [ADMIN]
      - pattern: /api/v1/ai/super-agent/**
        auth: AUTHENTICATED
        roles: [ADMIN]
      - pattern: /api/v1/ai/sub-orchestrators
        auth: AUTHENTICATED
        roles: [ADMIN]
      - pattern: /api/v1/ai/sub-orchestrators/**
        auth: AUTHENTICATED
        roles: [ADMIN]
      - pattern: /api/v1/ai/workers
        auth: AUTHENTICATED
        roles: [DOMAIN_EXPERT, ML_ENGINEER, ADMIN]
      - pattern: /api/v1/ai/workers/**
        auth: AUTHENTICATED
        roles: [DOMAIN_EXPERT, ML_ENGINEER, ADMIN]
      - pattern: /api/v1/ai/maturity/**
        auth: AUTHENTICATED
        roles: [DOMAIN_EXPERT, ML_ENGINEER, ADMIN]
      - pattern: /api/v1/ai/drafts
        auth: AUTHENTICATED
        roles: [USER, DOMAIN_EXPERT, ML_ENGINEER, ADMIN]
      - pattern: /api/v1/ai/drafts/**
        auth: AUTHENTICATED
        roles: [USER, DOMAIN_EXPERT, ML_ENGINEER, ADMIN]
      - pattern: /api/v1/ai/approvals
        auth: AUTHENTICATED
        roles: [DOMAIN_EXPERT, ML_ENGINEER, ADMIN]
      - pattern: /api/v1/ai/approvals/**
        auth: AUTHENTICATED
        roles: [DOMAIN_EXPERT, ML_ENGINEER, ADMIN]
      - pattern: /api/v1/ai/event-triggers
        auth: AUTHENTICATED
        roles: [ADMIN]
      - pattern: /api/v1/ai/event-triggers/**
        auth: AUTHENTICATED
        roles: [ADMIN]
      - pattern: /api/v1/ai/ethics/**
        auth: AUTHENTICATED
        roles: [ADMIN]
      - pattern: /api/v1/ai/benchmarks
        auth: AUTHENTICATED
        roles: [DOMAIN_EXPERT, ML_ENGINEER, ADMIN]
      - pattern: /api/v1/ai/benchmarks/**
        auth: AUTHENTICATED
        roles: [DOMAIN_EXPERT, ML_ENGINEER, ADMIN]
      - pattern: /api/v1/ai/hierarchy/export
        auth: AUTHENTICATED
        roles: [ADMIN]
      - pattern: /api/v1/ai/maturity/export
        auth: AUTHENTICATED
        roles: [DOMAIN_EXPERT, ML_ENGINEER, ADMIN]

      # Admin-only endpoints
      - pattern: /api/v1/tenants/**
        auth: AUTHENTICATED
        roles: [ADMIN]
      - pattern: /api/v1/validation/rules
        auth: AUTHENTICATED
        roles: [ADMIN, ML_ENGINEER]
```

### 6.4 RBAC Role Definitions

| Role | Description | Permissions |
|------|-------------|------------|
| `USER` | End user interacting with agents | Chat with agents, submit feedback (ratings and corrections), view own traces |
| `DOMAIN_EXPERT` | Business analyst managing skills and patterns | All USER permissions + create/update skills, register tools, add patterns, upload materials |
| `ML_ENGINEER` | ML team managing training pipeline | All DOMAIN_EXPERT permissions + trigger training, manage models, view all traces, configure validation rules |
| `ADMIN` | Platform administrator | All permissions + tenant management, user management, system configuration |

### 6.5 Service-to-Service Authentication

Internal service-to-service calls (between microservices within the platform) use propagated JWT tokens. The gateway passes the original user's JWT to downstream services, which re-validate it.

```mermaid
sequenceDiagram
    participant Orchestrator as agent-orchestrator
    participant DataAnalyst as agent-data-analyst
    participant TraceCollector as trace-collector

    Note over Orchestrator: Receives request with<br/>X-Tenant-Id, X-User-Id headers

    Orchestrator->>DataAnalyst: POST /internal/execute<br/>Authorization: Bearer {service-jwt}<br/>X-Tenant-Id: {tenant}<br/>X-Correlation-Id: {trace-id}
    DataAnalyst->>DataAnalyst: Validate service JWT<br/>Check internal-service role
    DataAnalyst-->>Orchestrator: 200 OK (result)

    Orchestrator->>TraceCollector: Kafka: agent.traces<br/>(async, tenant context in message)
```

For async Kafka communication, tenant context is embedded directly in the message payload (not in headers), ensuring tenant isolation persists across async boundaries.

### 6.6 Data Protection

| Data Category | At Rest | In Transit | Access Control |
|--------------|---------|-----------|----------------|
| User messages | PostgreSQL encryption (via PDE or TDE) | TLS 1.3 | Tenant-scoped queries |
| Agent responses | PostgreSQL encryption | TLS 1.3 | Tenant-scoped queries |
| Embeddings (vector store) | PGVector within PostgreSQL | TLS 1.3 | Tenant namespace filtering |
| Training data | Encrypted volume mounts | TLS 1.3 | ML_ENGINEER role only |
| Model weights | Encrypted Ollama volume | N/A (local only) | ADMIN role for deployment |
| API keys (Claude, etc.) | Kubernetes Secrets / Vault | Env var injection | Never in code/config files |
| Kafka messages | Disk encryption | SASL_SSL | Consumer group ACLs |

### 6.7 Prompt Injection Defense Architecture [PLANNED]

<!-- Addresses R8: prompt injection defense -->

**Status:** [PLANNED] -- Not yet implemented. Addresses OWASP LLM01 (Prompt Injection).

The prompt injection defense layer operates within the INTAKE step of the seven-step pipeline. It comprises four cooperating components: input sanitization, boundary markers between system and user content, canary tokens for detecting prompt leakage, and phase-based tool restrictions that limit which tools are available at each pipeline step.

```mermaid
classDiagram
    class PromptSanitizationFilter {
        -List~Pattern~ injectionPatterns
        -BoundaryMarkerService boundaryService
        -CanaryTokenService canaryService
        +sanitizeInput(rawInput: String) SanitizedInput
        +injectBoundaryMarkers(systemPrompt: String, userInput: String) BoundedPrompt
        +validateOutput(output: String) OutputValidationResult
    }

    class BoundaryMarkerService {
        -String sentinelSecret
        +generateSentinelTokens(sessionId: String) SentinelPair
        +verifyTokenIntegrity(response: String, expected: SentinelPair) boolean
    }

    class CanaryTokenService {
        -String canarySecret
        +injectCanary(systemPrompt: String) CanaryInjectedPrompt
        +detectCanaryTrigger(output: String) boolean
    }

    class PhaseToolRestrictionPolicy {
        -Map~PipelinePhase, Set~String~~ phaseAllowedTools
        +getAllowedTools(phase: PipelinePhase) Set~String~
    }

    class PipelinePhase {
        <<enumeration>>
        INTAKE
        RETRIEVE
        PLAN
        EXECUTE
        VALIDATE
        EXPLAIN
        RECORD
    }

    PromptSanitizationFilter --> BoundaryMarkerService : uses
    PromptSanitizationFilter --> CanaryTokenService : uses
    PhaseToolRestrictionPolicy --> PipelinePhase : restricts by
```

**Tool restriction sets:**

| Tool Set | Tools Included | Available In Phases |
|----------|---------------|---------------------|
| `READ_TOOLS` | database_query (SELECT), file_read, api_get, knowledge_search | RETRIEVE, PLAN, VALIDATE, EXPLAIN |
| `WRITE_TOOLS` | database_execute (INSERT/UPDATE/DELETE), file_write, api_post, api_put, api_delete | EXECUTE only |
| `SYSTEM_TOOLS` | trace_log, metric_emit, cache_read, cache_write | All phases |

**Sanitization flow in the Intake step:**

```mermaid
sequenceDiagram
    participant User
    participant Orchestrator
    participant Sanitizer as PromptSanitizationFilter
    participant Boundary as BoundaryMarkerService
    participant Canary as CanaryTokenService
    participant LLM as Ollama / Cloud Model

    User->>Orchestrator: Chat message (raw input)
    Orchestrator->>Sanitizer: sanitizeInput(rawInput)

    Sanitizer->>Sanitizer: Apply regex patterns<br/>(strip known injection vectors)
    Sanitizer->>Sanitizer: Detect suspicious tokens<br/>(IGNORE PREVIOUS, SYSTEM:, etc.)

    alt Injection detected
        Sanitizer-->>Orchestrator: SanitizedInput(blocked=true, reason)
        Orchestrator-->>User: 400 Bad Request<br/>"Input contains disallowed patterns"
    else Input clean
        Sanitizer->>Boundary: generateSentinelTokens(sessionId)
        Boundary-->>Sanitizer: SentinelPair(start, end)

        Sanitizer->>Canary: injectCanary(systemPrompt)
        Canary-->>Sanitizer: CanaryInjectedPrompt

        Sanitizer->>Sanitizer: injectBoundaryMarkers(canaryPrompt, cleanInput)
        Sanitizer-->>Orchestrator: SanitizedInput(boundedPrompt, sentinelPair)

        Orchestrator->>LLM: boundedPrompt
        LLM-->>Orchestrator: response

        Orchestrator->>Sanitizer: validateOutput(response)
        Sanitizer->>Boundary: verifyTokenIntegrity(response, sentinelPair)
        Sanitizer->>Canary: detectCanaryTrigger(response)

        alt Canary triggered or sentinel violated
            Sanitizer-->>Orchestrator: OutputValidationResult(compromised=true)
            Orchestrator-->>User: Redacted response + security alert logged
        else Output clean
            Sanitizer-->>Orchestrator: OutputValidationResult(clean=true)
            Orchestrator-->>User: Agent response
        end
    end
```

### 6.8 Pre-Cloud Sanitization Pipeline [PLANNED]

<!-- Addresses R10: pre-cloud PII sanitization -->

**Status:** [PLANNED] -- Not yet implemented. Ensures no PII or tenant-identifying data is sent to external cloud LLM providers.

When the ModelRouter selects a cloud provider (Claude, OpenAI) instead of the local Ollama instance, the request must pass through a sanitization pipeline that strips tenant identifiers, detects and anonymizes PII entities, and logs a sanitization report for audit. If sanitization fails (e.g., PII cannot be reliably stripped), the request falls back to the local Ollama model.

```mermaid
sequenceDiagram
    participant MR as ModelRouter
    participant CSP as CloudSanitizationPipeline
    participant PII as PIIDetectionService
    participant Audit as AuditService
    participant Cloud as Cloud LLM (Claude/OpenAI)
    participant Ollama as Ollama (Local)

    MR->>CSP: sanitizeForCloud(request)
    CSP->>CSP: stripTenantIdentifiers(request)
    CSP->>PII: detectPII(strippedRequest)
    PII-->>CSP: PIIDetectionResult(entities, confidence)

    alt PII detected with high confidence
        CSP->>CSP: anonymizeEntities(request, entities)
        CSP->>Audit: logSanitizationReport(original, anonymized, entities)
        Audit-->>CSP: reportId
        CSP-->>MR: SanitizedRequest(anonymizedPrompt, reportId)
        MR->>Cloud: anonymizedPrompt
        Cloud-->>MR: response
        MR->>MR: rehydrateEntityPlaceholders(response, entities)
    else PII detection fails or low confidence
        CSP->>Audit: logSanitizationFailure(reason)
        CSP-->>MR: SanitizationFailure(reason)
        MR->>Ollama: originalPrompt (fallback to local)
        Ollama-->>MR: response
    end
```

**PII categories detected:**

| Category | Detection Method | Anonymization |
|----------|-----------------|---------------|
| Tenant IDs (UUID) | Regex + context | Replace with `[TENANT_REF]` |
| Email addresses | Regex | Replace with `[EMAIL_N]` |
| Phone numbers | Regex + libphonenumber | Replace with `[PHONE_N]` |
| Personal names | NER model (spaCy/Presidio) | Replace with `[PERSON_N]` |
| Street addresses | NER model | Replace with `[ADDRESS_N]` |
| Credit card numbers | Luhn + regex | Replace with `[CARD_N]` |
| Custom patterns | Tenant-configurable regex | Replace with `[CUSTOM_N]` |

### 6.9 Data Retention Architecture [PLANNED]

<!-- Addresses R11: data retention policy -->

**Status:** [PLANNED] -- Not yet implemented. Defines retention periods for all AI platform data categories in compliance with GDPR/CCPA requirements.

| Data Category | Active Period | Archive Period | Purge Action | Rationale |
|---------------|--------------|----------------|--------------|-----------|
| Agent traces | 90 days | 1 year | DELETE | Operational debugging window + compliance archive |
| Feedback entries | 2 years | -- | ANONYMIZE | Long-term model improvement; anonymize PII after active period |
| Training data | 5 years | -- | DELETE | Model provenance and reproducibility requirement |
| Conversation history | 30 days | -- | DELETE | User privacy; short retention for session continuity |
| Audit logs | 3 years | 7 years | ARCHIVE | Regulatory compliance (SOC 2, GDPR Article 30) |
| RAG search logs | 90 days | -- | DELETE | Knowledge gap analytics; no long-term PII value |
| Agent artifacts | 90 days | 1 year | DELETE | Aligned with parent trace retention |
| Pipeline run records | 90 days | 1 year | DELETE | Aligned with agent trace retention |
| Model versions | Indefinite | -- | N/A | Model provenance; never auto-deleted |
| Model deployments | Indefinite | -- | N/A | Deployment audit trail; never auto-deleted |

**DataRetentionJob** is implemented as a nightly Spring Batch job (`@Scheduled(cron = "0 0 2 * * ?")`) that:

1. Queries each table for records past their active retention period
2. For ANONYMIZE actions: replaces PII fields with anonymized placeholders, preserves aggregate metrics
3. For DELETE actions: hard-deletes records in batches (1000 per batch, configurable)
4. For ARCHIVE actions: copies records to cold storage (S3/MinIO archive bucket), then deletes from active table
5. Logs a retention execution report to the audit log with counts per table and action
6. Emits Prometheus metrics: `data_retention_records_processed_total{table, action}`

**Tenant override:** Tenants may configure shorter retention periods (never longer) via the `tenant_profiles.data_classification` field. A `RESTRICTED` classification halves all active periods.

### 6.10 Redis Caching Strategy [PLANNED]

<!-- Addresses R12: caching strategy -->

**Status:** [PLANNED] -- Not yet implemented. Defines the Valkey/Redis caching strategy for the AI platform.

**Cache key namespace:** `{tenant_id}:{cache_type}:{entity_id}`

Example: `550e8400-e29b-41d4-a716-446655440000:skill:code-review-v2`

| Cache Entry | TTL | Invalidation Strategy | Key Pattern |
|-------------|-----|----------------------|-------------|
| Skill definitions | 5 min | Kafka `skill.updated` event | `{tenant}:skill:{skill_key}` |
| Tenant profile | 10 min | Kafka `tenant.profile.updated` event | `{tenant}:profile:config` |
| Model routing decisions | 1 min | Time-based only (no event) | `{tenant}:model-route:{model_hash}` |
| RAG query results (same session) | 30 min | Session end (explicit eviction) | `{tenant}:rag-cache:{query_hash}` |
| Tool registration metadata | 5 min | Kafka `tool.updated` event | `{tenant}:tool:{tool_name}` |
| Rate limit counters | 60 sec | Time-based (sliding window) | `{tenant}:rate:{user_id}:{endpoint}` |

**Data that must NOT be cached:**

| Data Category | Reason |
|---------------|--------|
| PII data (user messages, personal info) | Privacy compliance; cache is shared infrastructure |
| Agent traces | Large payloads; write-heavy, not read-heavy |
| Training data | Too large; accessed in batch, not random-access |
| Conversation history | Session-scoped; use in-memory session state instead |
| Secrets / API keys | Security; never store credentials in cache |

**Cache architecture:**

```mermaid
graph LR
    subgraph Application Layer
        Orch[agent-orchestrator]
        Worker[agent-*-worker]
    end

    subgraph Cache Layer
        Valkey[(Valkey 8)]
    end

    subgraph Event Bus
        Kafka[(Kafka)]
    end

    Orch -->|GET/SET| Valkey
    Worker -->|GET| Valkey
    Kafka -->|skill.updated| Orch
    Kafka -->|tenant.profile.updated| Orch
    Kafka -->|tool.updated| Orch
    Orch -->|EVICT on event| Valkey
```

#### 6.10.1 SSE Event Replay and Missed-Event Recovery [PLANNED]

**Status:** [PLANNED] -- Addresses P1 gap: no mechanism for SSE clients to recover missed events after network reconnection.
**Cross-Reference:** Section 4.2 (Agent Chat API, streamResponse), Section 7.8 (Conversation-Level Concurrency Control)

When an SSE connection drops and the client reconnects, the server supports `Last-Event-Id` header-based replay to deliver any events missed during the disconnection. [PLANNED]

**Event replay mechanism:** [PLANNED]

1. Server assigns monotonically increasing event IDs per channel per tenant (format: `{tenant_id}-{channel}-{sequence}`)
2. Events are stored in a circular buffer table with a TTL of 5 minutes and max 1000 events per channel
3. On reconnection, client sends `Last-Event-Id` header with the last received event ID
4. Server replays all events after that ID from the buffer
5. If the requested ID is beyond the buffer (events too old or buffer overflowed), server sends a `SYNC_REQUIRED` meta-event; client must perform a full state refresh via REST API

**SSE event buffer table:** [PLANNED]

```sql
-- sse_event_buffer (tenant_{uuid} schema) [PLANNED]
CREATE TABLE sse_event_buffer (
    event_id    BIGSERIAL PRIMARY KEY,
    channel     VARCHAR(100) NOT NULL,    -- e.g., 'conversation:C-1', 'notifications', 'maturity:A-5'
    tenant_id   UUID NOT NULL,
    payload     JSONB NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-cleanup: TTL index deletes events older than 5 minutes
-- Implemented via pg_cron or application-level scheduled cleanup
CREATE INDEX idx_sse_buffer_channel_seq ON sse_event_buffer(tenant_id, channel, event_id);
CREATE INDEX idx_sse_buffer_cleanup ON sse_event_buffer(created_at);
```

**Reconnection sequence:** [PLANNED]

```mermaid
sequenceDiagram
    participant Client as SSE Client
    participant Server as AI Service
    participant Buffer as sse_event_buffer

    Client->>Server: GET /api/v1/ai/stream/subscribe<br/>Last-Event-Id: 42

    Server->>Buffer: SELECT * FROM sse_event_buffer<br/>WHERE channel=:ch AND event_id > 42<br/>ORDER BY event_id ASC

    alt Events found in buffer
        Buffer-->>Server: Events 43, 44, 45
        Server-->>Client: SSE: id=43, data={...}
        Server-->>Client: SSE: id=44, data={...}
        Server-->>Client: SSE: id=45, data={...}
        Server-->>Client: SSE: (resume live stream)
    else Events too old (not in buffer)
        Server-->>Client: SSE: event=SYNC_REQUIRED, data={reason: "Events expired from buffer"}
        Note over Client: Client calls REST API<br/>for full state refresh
    end
```

**Buffer cleanup job:** A scheduled job (every 60 seconds) deletes events older than 5 minutes: `DELETE FROM sse_event_buffer WHERE created_at < NOW() - INTERVAL '5 minutes'`. Max 1000 events per channel enforced by the application layer on insert (delete oldest if count exceeds 1000). [PLANNED]

---

### 6.11 Agent-Level Security Architecture [PLANNED]

<!-- Addresses ADR-024 (Agent Maturity Model), ADR-028 (Worker Sandbox); See Benchmarking Study Section 10.3 -->

**Status:** [PLANNED] -- Not yet implemented. Defines the per-maturity tool authorization model for Super Agent hierarchical architecture.
**Cross-Reference:** 01-PRD Section 7.9, ADR-024, ADR-028, Benchmarking Study Section 10.3
**Risk Rating:** HIGH -- Without maturity-based authorization, all agents operate with equal authority regardless of demonstrated competence.

#### 6.11.1 Tool Risk Classification

Every tool registered in the Tool Registry is classified by risk level. Risk is determined by the maximum across four factors: data sensitivity, action reversibility, blast radius, and regulatory exposure (See Benchmarking Study Section 10.3).

| Risk Level | Tool Categories | Examples | Reversibility | External Impact |
|------------|---------------|---------|---------------|-----------------|
| **LOW** | READ, ANALYZE | `database_query` (SELECT), `file_read`, `api_get`, `knowledge_search`, `calculate`, `summarize`, `classify` | N/A (read/compute only) | None |
| **MEDIUM** | DRAFT | `generate_report`, `compose_email`, `create_ticket_draft`, `prepare_document` | Reversible (sandbox) | None (sandbox) |
| **HIGH** | WRITE | `database_execute` (INSERT/UPDATE), `file_write`, `api_post`, `send_notification`, `create_ticket` | Partially reversible | Yes -- modifies external state |
| **CRITICAL** | DELETE | `database_execute` (DELETE/DROP), `file_delete`, `api_delete`, `revoke_access`, `deactivate_user` | Irreversible without backup | Yes -- destroys external state |

#### 6.11.2 Authorization Matrix: Maturity x Tool Risk

The Agent Trust Score (ATS, ADR-024) maturity level determines which tool risk levels are available. This creates a progressive autonomy gradient where trust is earned through demonstrated performance (See BA domain model entities: `ToolAuthorization`, `ToolRiskLevel`, `AgentMaturityProfile`).

| Maturity Level | ATS Range | LOW (READ/ANALYZE) | MEDIUM (DRAFT) | HIGH (WRITE) | CRITICAL (DELETE) | Human Oversight |
|---------------|-----------|---------------------|----------------|--------------|-------------------|-----------------|
| **Coaching** | 0-39 | Allowed | Sandboxed (all outputs reviewed) | Blocked | Blocked | All outputs reviewed before delivery |
| **Co-pilot** | 40-64 | Allowed | Allowed (outputs reviewed) | Blocked | Blocked | All write-intent actions reviewed |
| **Pilot** | 65-84 | Allowed | Allowed | Allowed (low-risk writes only) | Blocked | High-risk writes reviewed; low-risk auto-approved |
| **Graduate** | 85-100 | Allowed | Allowed | Allowed | Allowed (with audit) | Monitoring only; post-hoc audit |

**Dynamic Grant/Revoke:**

```mermaid
stateDiagram-v2
    [*] --> Coaching : Agent created (ATS=0)
    Coaching --> CoPilot : ATS >= 40 sustained 30 days
    CoPilot --> Coaching : ATS drops below 40
    CoPilot --> Pilot : ATS >= 65 sustained 30 days
    Pilot --> CoPilot : ATS drops below 65
    Pilot --> Graduate : ATS >= 85 sustained 30 days
    Graduate --> Pilot : ATS drops below 85
    Graduate --> Coaching : Critical compliance violation
    Pilot --> Coaching : Critical compliance violation
    CoPilot --> Coaching : Critical compliance violation
```

- Promotion requires sustained ATS above threshold for 30 days with minimum 100 completed tasks
- Score-based demotion is immediate (no grace period)
- Critical compliance violation triggers immediate demotion to Coaching regardless of current ATS
- Per-tenant independence: same agent configuration may be Graduate for Tenant A and Coaching for Tenant B

#### 6.11.3 Phase-Based Tool Restrictions (Super Agent Extension)

In addition to maturity-based authorization, tools are restricted by the pipeline phase in which they are invoked. This prevents unintended side effects during planning phases and limits the attack surface of prompt injection (See Section 6.7 for base implementation, this section extends for multi-agent context).

| Pipeline Phase | Allowed Tool Categories | Rationale |
|---------------|------------------------|-----------|
| INTAKE | None | Input processing only |
| RETRIEVE | READ | Information gathering; no state changes |
| PLAN | READ, ANALYZE | Task decomposition requires analysis but no mutations |
| EXECUTE | READ, ANALYZE, DRAFT, WRITE (per maturity) | Primary execution phase |
| VALIDATE | READ, ANALYZE | Validation must not modify state |
| EXPLAIN | READ | Explanation may reference data but not modify |
| RECORD | SYSTEM (audit logging only) | Only audit trail writes permitted |

**Orchestrator-Role Restriction:** Agents with the SUPER_AGENT or SUB_ORCHESTRATOR role are permanently restricted from WRITE and DELETE tools regardless of phase or maturity. Only WORKER-role agents executing in the EXECUTE phase may use write-class tools. This follows the principle of separation of orchestration from execution authority (See ADR-023).

#### 6.11.4 STRIDE Threat Model: Agent Tool Authorization

| Threat | Attack Vector | Mitigation | Risk |
|--------|--------------|------------|------|
| **Spoofing** | Agent claims higher maturity to access restricted tools | Per-agent JWT with maturity claims validated at tool invocation (Section 6.12) | HIGH -- Mitigated |
| **Tampering** | Modify ATS score in database to gain unauthorized tool access | ATS updates through dedicated service only; audit trail on all score changes; RLS on maturity tables | HIGH -- Mitigated |
| **Repudiation** | Agent denies executing a restricted tool | Every tool invocation logged in execution trace with agent identity, tool name, and parameters | MEDIUM -- Mitigated |
| **Information Disclosure** | Agent uses READ tools to exfiltrate data across tenant boundary | Schema isolation + RLS + JPA filter ensure all queries scoped to tenant (Section 6.13) | CRITICAL -- Mitigated by defense-in-depth |
| **Denial of Service** | Agent flood-invokes tools to exhaust resources | Per-agent, per-tenant rate limiting; tool invocation quotas per maturity level | MEDIUM -- Mitigated |
| **Elevation of Privilege** | Coaching agent bypasses authorization to invoke WRITE tool | Authorization check at ToolExecutionService: `if (tool.riskLevel > agent.maxAllowedRisk) throw UnauthorizedToolException` | CRITICAL -- Mitigated |

### 6.12 Agent-to-Agent Authentication [PLANNED]

<!-- Addresses ADR-023 (Hierarchical Architecture), ADR-024 (Maturity Model); See Benchmarking Study Section 10.4 -->

**Status:** [PLANNED] -- Not yet implemented. Defines internal JWT for agent-to-agent communication within the hierarchical Super Agent architecture.
**Cross-Reference:** 01-PRD Section 7.9.2, ADR-023, ADR-024, Benchmarking Study Section 10.4
**Risk Rating:** HIGH -- Without agent-to-agent authentication, any logical agent within the service can impersonate another, bypassing maturity-based controls.

#### 6.12.1 Why Infrastructure Auth Is Insufficient

The ai-service hosts the Super Agent, sub-orchestrators, and workers within a single JVM process. Infrastructure-level authentication (mTLS between services) cannot distinguish between these logical agents. Agent-to-agent authentication addresses:

1. **Agent impersonation:** A prompt injection causing a worker to generate output formatted as a sub-orchestrator instruction
2. **Trust boundary enforcement:** A Coaching worker's request to invoke a CRITICAL tool must be rejected even if it originates from within the same service
3. **Audit attribution:** Every action must be attributed to a specific agent identity, not just a service process

#### 6.12.2 Agent Identity Token (JWT) Structure

```json
{
  "sub": "agent:worker:data-analyst-v2",
  "iss": "emsist-agent-platform",
  "aud": "emsist-agent-platform",
  "tenant_id": "550e8400-e29b-41d4-a716-446655440000",
  "agent_type": "WORKER",
  "agent_role": "DATA_ANALYST",
  "maturity_level": "PILOT",
  "ats_score": 62,
  "allowed_tool_categories": ["READ", "ANALYZE", "DRAFT", "WRITE_LOW"],
  "parent_agent": "agent:sub-orch:analytics-domain",
  "trace_id": "tr-20260307-abc123",
  "iat": 1741305600,
  "exp": 1741305900
}
```

#### 6.12.3 Token Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Token lifetime | 5 minutes | Agent tasks are short-lived; short tokens limit exploitation window |
| Signing algorithm | RS256 | Asymmetric signing aligns with existing Keycloak JWT infrastructure; verification without sharing private key |
| Scope claims | Embedded in token | Tool categories, maturity level, and parent agent embedded to avoid additional lookups |
| Token refresh | Not applicable | Issued per-task; expires on task completion |
| Revocation | Blocklist in Valkey | Demoted or deactivated agent token IDs added to short-lived Valkey blocklist |

#### 6.12.4 Scope-Limited Agent Credentials

```mermaid
graph TD
    subgraph "Super Agent Token Scope"
        SA["READ + ANALYZE + DRAFT + WRITE + DELETE<br/>Can delegate to any sub-orchestrator<br/>Can access all domains within tenant"]
    end

    subgraph "Sub-Orchestrator Token Scope"
        SO["READ + ANALYZE + DRAFT + WRITE (domain-scoped)<br/>Can delegate to workers within domain<br/>Cannot access other domains' data"]
    end

    subgraph "Worker Token Scope"
        W["READ + ANALYZE + DRAFT (per maturity)<br/>Cannot delegate to other agents<br/>Scoped to assigned task only"]
    end

    SA --> SO
    SO --> W
```

#### 6.12.5 Credential Rotation and Revocation

| Trigger | Action | Rationale |
|---------|--------|-----------|
| Task completion | Token expires (5-minute TTL) | No credential persists beyond its purpose |
| Maturity level change | Existing tokens invalidated; new tokens with updated claims | Permission changes take immediate effect |
| Security incident | All agent tokens for affected tenant blocklisted in Valkey | Contain potential compromise |
| Platform deployment | All agent signing keys rotated | Defense against key compromise during deployment |

#### 6.12.6 STRIDE Threat Model: Agent-to-Agent Authentication

| Threat | Attack Vector | Mitigation | Risk |
|--------|--------------|------------|------|
| **Spoofing** | Worker generates output mimicking sub-orchestrator instruction format | JWT signature verification on all inter-agent messages; `agent_type` claim validation | CRITICAL -- Mitigated |
| **Tampering** | Modify agent JWT claims to elevate privileges | RS256 asymmetric signature prevents claim modification without private key | CRITICAL -- Mitigated |
| **Repudiation** | Agent denies issuing a delegation instruction | Every delegation logged with issuer JWT hash in execution trace | MEDIUM -- Mitigated |
| **Information Disclosure** | Leaked agent JWT reveals maturity scores and tool permissions | 5-minute TTL limits exposure window; Valkey blocklist for immediate revocation | MEDIUM -- Mitigated |
| **Denial of Service** | Flood delegation requests to overwhelm agent token issuance | Rate limiting on token issuance per agent per minute | LOW -- Mitigated |
| **Elevation of Privilege** | Worker forges a Super Agent JWT to invoke CRITICAL tools | RSA private key held only by platform token issuer; workers cannot forge tokens | CRITICAL -- Mitigated |

### 6.13 Cross-Tenant Data Boundary Enforcement [PLANNED]

<!-- Addresses ADR-026 (Schema-per-Tenant); See Benchmarking Study Section 10.5 -->

**Status:** [PLANNED] -- Not yet implemented. Current codebase uses row-level isolation (`tenant_id` column). This section defines schema-per-tenant isolation with defense-in-depth for Super Agent data.
**Cross-Reference:** 01-PRD Section 7.2, 7.9.3, ADR-026, Benchmarking Study Section 10.5
**Risk Rating:** CRITICAL -- Cross-tenant data leakage in an AI platform could expose organizational strategy, financial analysis, and proprietary knowledge.

#### 6.13.1 Schema-per-Tenant PostgreSQL Isolation

Each tenant's agent data resides in a separate PostgreSQL schema. Schema selection occurs at connection acquisition time (See BA domain model entity: `TenantSuperAgentClone`).

**Tenant Schema Content (per ADR-026):**

| Table Category | Tables (per canonical LLD Sections 3.16-3.35) | Sensitivity |
|----------------|--------|------------|
| Agent Configuration | `super_agents` (3.16), `sub_orchestrators` (3.17), `workers` (3.18), `agent_skills` (3.31), `tool_authorizations` (3.1) | High (IP) |
| Task Execution | `worker_tasks` (3.20b), `pipeline_runs` (3.6) | High (operational) |
| Knowledge Base | `knowledge_items` (3.32), `knowledge_sources` (3.13), vector_store (3.2 -- pgvector) | Critical (proprietary) |
| Maturity | `agent_maturity_scores` (3.19), `ats_score_history` (3.20), `skill_assessments` (3.33), `learning_records` (3.34) | Medium |
| Drafts | `worker_drafts` (3.21), `draft_reviews` (3.22) | High (analysis) |
| HITL | `approval_checkpoints` (3.23), `approval_decisions` (3.23 ER), `escalation_rules` (3.23 ER) | High (decisions) |
| Events | `event_sources` (3.23b), `event_triggers` (3.24), `event_schedules` (3.25) | Medium |
| Ethics | `conduct_policies` (3.27), `policy_violations` (3.28) | High (governance) |
| Prompts | `prompt_blocks` (3.29, scope=TENANT), `prompt_compositions` (3.29 ER) | Medium |
| Lifecycle | `schema_lifecycle_events` (3.5) | Medium (audit) |

#### 6.13.2 Connection-Level Schema Selection

```java
// TenantSchemaInterceptor (Spring HandlerInterceptor)
@Component
public class TenantSchemaInterceptor implements HandlerInterceptor {

    @Override
    public boolean preHandle(HttpServletRequest request, ...) {
        String tenantId = request.getHeader("X-Tenant-Id");
        String jwtTenantId = extractTenantFromJwt(request);

        // Validation: header must match JWT claim
        if (!tenantId.equals(jwtTenantId)) {
            throw new CrossTenantViolationException(tenantId, jwtTenantId);
        }

        // Set schema search path for this request
        TenantContextHolder.setCurrentTenant(tenantId);
        return true;
    }
}
```

```java
// TenantConnectionProvider (Hibernate MultiTenancyStrategy.SCHEMA)
@Override
public Connection getConnection(String tenantIdentifier) {
    // Validate tenant identifier is a valid UUID before schema selection
    UUID.fromString(tenantIdentifier); // throws IllegalArgumentException if invalid
    String schemaName = "tenant_" + tenantIdentifier.replace("-", "_");
    // Use validated schema name -- no direct user input in SQL
    Connection connection = dataSource.getConnection();
    try (var stmt = connection.prepareStatement("SET search_path TO ?")) {
        stmt.setString(1, schemaName);
        stmt.execute();
    }
    return connection;
}
```

#### 6.13.3 Defense-in-Depth Layers

```mermaid
graph LR
    A["Request<br/>(JWT with tenant_id)"] --> B["API Gateway<br/>(Extract + Validate tenant_id)"]
    B -->|"X-Tenant-Id header"| C["AI Service<br/>(Validate tenant_id = JWT claim)"]
    C -->|"SET search_path = tenant_{id}"| D["PostgreSQL<br/>(Schema boundary)"]
    C -->|"RLS: tenant_id = current_setting"| D
    C -->|"JPA filter: WHERE tenant_id = ?"| D
```

**Layer Details:**

| Layer | Implementation | What It Prevents | Failure Mode |
|-------|---------------|-----------------|-------------|
| **Schema isolation** | `SET search_path = tenant_{id}` at connection acquisition | Application code querying wrong tenant's tables | If bypassed, Layer 2 catches it |
| **Row-Level Security** | PostgreSQL RLS policies: `USING (tenant_id = current_setting('app.current_tenant')::uuid)` | Application bug setting wrong schema path | Database rejects cross-tenant rows |
| **JPA tenant filter** | Hibernate `@Filter` annotation: `WHERE tenant_id = :currentTenantId` | Database misconfiguration or missing RLS | Application-level enforcement independent of DB config |
| **PGVector metadata filter** | Mandatory `tenant_id` filter on all vector similarity searches | RAG retrieval returning other tenant's knowledge documents | Embedding search scoped to tenant schema + metadata filter |

#### 6.13.4 Benchmark Metrics Anonymization Pipeline

```mermaid
graph TD
    subgraph "Tenant A Schema"
        A_MT["agent_maturity_scores"]
        A_TR["execution_traces"]
    end

    subgraph "Tenant B Schema"
        B_MT["agent_maturity_scores"]
        B_TR["execution_traces"]
    end

    subgraph "Anonymization Pipeline"
        EX["Metrics Extractor<br/>(numeric only)"]
        AN["Anonymizer<br/>(strip tenant_id, user_id, content)"]
        KA["k-Anonymity Checker<br/>(min 5 tenants per bucket)"]
    end

    subgraph "Shared Benchmark Schema"
        BM["anonymized_metrics"]
        BA["aggregated_benchmarks"]
    end

    A_MT --> EX
    A_TR --> EX
    B_MT --> EX
    B_TR --> EX
    EX --> AN
    AN --> KA
    KA -->|"k >= 5"| BM
    KA -->|"k < 5"| SUPPRESS["Metric Suppressed"]
    BM --> BA
```

**Data that NEVER crosses tenant boundary:** agent configurations, knowledge base content, conversation history, user identifiers, execution trace content, draft content.

**Data that crosses (anonymized only):** agent execution time percentiles, tool usage frequency counts, maturity level distribution histograms, error rate by category.

#### 6.13.5 STRIDE Threat Model: Cross-Tenant Isolation

| Threat | Attack Vector | Mitigation | Risk |
|--------|--------------|------------|------|
| **Spoofing** | Attacker forges X-Tenant-Id header to access another tenant's schema | JWT tenant_id claim validated against header; mismatch = 403 + security alert | CRITICAL -- Mitigated |
| **Tampering** | SQL injection modifying SET search_path to access another schema | Parameterized schema selection (no string concatenation); RLS as backup | CRITICAL -- Mitigated |
| **Information Disclosure** | RAG similarity search returns other tenant's knowledge documents | Schema isolation + PGVector mandatory metadata filter + JPA tenant filter (3 layers) | CRITICAL -- Mitigated by defense-in-depth |
| **Information Disclosure** | Anonymized benchmark data enables tenant re-identification | k-anonymity (k >= 5); suppress metrics from small cohorts; no content in benchmarks | HIGH -- Mitigated |
| **Elevation of Privilege** | Tenant admin modifies RLS policies to access other schemas | RLS policies managed by platform DBA role, not tenant admin role; tenant DB user has no ALTER privilege | CRITICAL -- Mitigated |

#### 6.13.6 Schema Creation Failure and Provisioning Recovery [PLANNED]

**Status:** [PLANNED] -- Addresses P0 gap: undefined behavior when `CREATE SCHEMA tenant_{uuid}` fails during provisioning.
**Cross-Reference:** Section 3.5 (Database-per-Service Allocation), Section 3.5 (`tenant_registry` table), ADR-026

When a new tenant is provisioned, the platform creates a PostgreSQL schema `tenant_{uuid}`. If this operation fails (disk full, connection timeout, permission denied), the following compensation workflow applies. [PLANNED]

**Provisioning state machine:**

```mermaid
stateDiagram-v2
    [*] --> PROVISIONING_REQUESTED: Tenant onboarding event
    PROVISIONING_REQUESTED --> SCHEMA_CREATING: Start schema creation

    SCHEMA_CREATING --> SCHEMA_CREATED: CREATE SCHEMA success
    SCHEMA_CREATING --> PROVISIONING_FAILED: CREATE SCHEMA fails

    PROVISIONING_FAILED --> SCHEMA_CREATING: Retry (up to 3x, exponential backoff)
    PROVISIONING_FAILED --> MANUAL_INTERVENTION: 3 retries exhausted

    SCHEMA_CREATED --> MIGRATING: Run Flyway migrations
    MIGRATING --> ACTIVE: All migrations pass
    MIGRATING --> MIGRATION_FAILED: Flyway error (see 6.13.7)

    MANUAL_INTERVENTION --> SCHEMA_CREATING: PLATFORM_ADMIN retriggers

    ACTIVE --> [*]
```

**Compensation workflow steps:** [PLANNED]

1. `CREATE SCHEMA tenant_{uuid}` fails
2. Log error with tenant_id, SQL error code, and stack trace to `schema_lifecycle_events`
3. Set `tenant_registry.status = 'PROVISIONING_FAILED'`
4. Retry up to 3 times with exponential backoff: 5s, 15s, 45s
5. After 3 failures:
   - Alert PLATFORM_ADMIN via SSE notification + email (notification category: `SYSTEM`)
   - Log to `schema_lifecycle_events` with `event_type = 'PROVISIONING_FAILED'` and `details = {retries: 3, last_error: "..."}`
   - Tenant remains in `PROVISIONING_FAILED` state; all API calls for this tenant return AI-PROV-001 (503)
   - Manual intervention required: PLATFORM_ADMIN can retry via `POST /api/v1/ai/admin/tenants/{id}/provision`

**Tenant registry status extension:** [PLANNED]

```sql
-- Update tenant_registry status constraint [PLANNED]
ALTER TABLE ai_shared.tenant_registry
    DROP CONSTRAINT chk_tenant_registry_status,
    ADD CONSTRAINT chk_tenant_registry_status CHECK (status IN (
        'PROVISIONING_REQUESTED', 'SCHEMA_CREATING', 'PROVISIONING_FAILED',
        'MIGRATING', 'MIGRATION_FAILED', 'ACTIVE', 'SUSPENDED', 'ARCHIVED'
    ));
```

---

#### 6.13.7 Flyway Migration Failure Recovery for Tenant Schemas [PLANNED]

**Status:** [PLANNED] -- Addresses P1 gap: undefined behavior when Flyway migration fails on a tenant schema.
**Cross-Reference:** Section 3.3 (Flyway Migration Scripts), Section 3.5 (`schema_lifecycle_events` table), Section 6.13.6 (provisioning state machine)

If a Flyway migration fails on a tenant schema (e.g., during schema version upgrade), the following recovery workflow applies. [PLANNED]

**Recovery steps:** [PLANNED]

1. Flyway migration fails -- transaction rolls back automatically (Flyway default behavior)
2. Set `tenant_registry.status = 'MIGRATION_FAILED'`
3. Record failed version in `schema_lifecycle_events`: `event_type = 'MIGRATION_FAILED'`, `details = {flyway_version: "V42", error: "..."}`
4. Block all operations for that tenant -- all API calls return AI-PROV-002 (503): `"Tenant schema is outdated; migration required"`
5. PLATFORM_ADMIN notification via SSE + email
6. Recovery options:
   - **Automated retry:** `POST /api/v1/ai/admin/tenants/{id}/migrate` -- re-runs Flyway migration from last successful version
   - **Manual hotfix:** PLATFORM_ADMIN applies hotfix SQL via `POST /api/v1/ai/admin/tenants/{id}/migrate/hotfix` (audited, body contains SQL statement logged to `schema_lifecycle_events` with `performed_by` and full SQL text)

**Migration retry endpoint:** [PLANNED]

```yaml
paths:
  /api/v1/ai/admin/tenants/{tenantId}/migrate:
    post:
      operationId: retryTenantMigration
      summary: Retry Flyway migration for a tenant schema [PLANNED]
      tags: [Admin]
      security:
        - bearerAuth: []
      parameters:
        - name: tenantId
          in: path
          required: true
          schema:
            type: string
            format: uuid
      responses:
        '200':
          description: Migration succeeded
        '403':
          description: Requires PLATFORM_ADMIN role
        '409':
          description: Tenant not in MIGRATION_FAILED state
        '503':
          description: Migration failed again (see details)
```

---

### 6.14 Ethics Policy Enforcement Pipeline [PLANNED]

<!-- Addresses ADR-027 (Platform Ethics Baseline); See Benchmarking Study Section 10.6 -->

**Status:** [PLANNED] -- Not yet implemented. Defines the runtime ethics enforcement pipeline operating at pre-execution and post-execution points in the agent pipeline.
**Cross-Reference:** 01-PRD Section 7.7-7.8, ADR-027, Benchmarking Study Section 10.6
**Risk Rating:** CRITICAL -- Ethics enforcement is the primary compliance control for EU AI Act Articles 9, 12, 13, 14.

#### 6.14.1 Enforcement Engine Architecture

The ethics engine operates as a stateless evaluation service invoked at two pipeline points: pre-execution (before tools run) and post-execution (after output generated). Platform policies are evaluated first (non-negotiable), then tenant policies (See BA domain model entities: `EthicsPolicy`, `ConductPolicy`, `PolicyViolation`).

```mermaid
sequenceDiagram
    participant Agent as Agent Pipeline
    participant Engine as Ethics Engine
    participant Platform as Platform Policies (Immutable)
    participant Tenant as Tenant Policies (Configurable)
    participant Tool as Tool Registry
    participant Audit as Audit Trail

    Note over Agent,Audit: PRE-EXECUTION CHECK

    Agent->>Engine: preCheck(action, agentContext)
    Engine->>Platform: evaluate(action, platformRules ETH-001..ETH-007)
    Platform-->>Engine: PlatformResult (ALLOW | BLOCK)

    alt Platform blocks
        Engine->>Audit: LOG: ethics_violation (platform, rule_id, action)
        Engine-->>Agent: BLOCKED (platform_rule_id, reason)
    else Platform allows
        Engine->>Tenant: evaluate(action, tenantConductRules)
        Tenant-->>Engine: TenantResult (ALLOW | BLOCK | ESCALATE)

        alt Tenant blocks
            Engine->>Audit: LOG: conduct_violation (tenant, rule_id, action)
            Engine-->>Agent: BLOCKED (tenant_rule_id, reason)
        else Tenant escalates
            Engine->>Audit: LOG: conduct_escalation (tenant, rule_id, action)
            Engine-->>Agent: ESCALATE (requires human approval via HITL)
        else Both allow
            Engine->>Audit: LOG: policy_evaluation (passed, rules_evaluated)
            Engine-->>Agent: ALLOWED
            Agent->>Tool: execute(action)
        end
    end

    Note over Agent,Audit: POST-EXECUTION VALIDATION

    Tool-->>Agent: tool_result
    Agent->>Engine: postCheck(output, agentContext)
    Engine->>Engine: PII leakage check
    Engine->>Engine: Cross-tenant data check
    Engine->>Engine: Content safety check (ETH-005)
    Engine->>Engine: Bias detection check (ETH-006)
    Engine->>Engine: Tenant conduct compliance check

    alt Violation detected
        Engine->>Audit: LOG: post_execution_violation (check_type, details)
        Engine-->>Agent: BLOCKED (violation_type, remediation)
    else Output clean
        Engine->>Audit: LOG: post_execution_passed (checks_run, scores)
        Engine-->>Agent: ALLOWED (output_cleared)
    end
```

#### 6.14.2 Policy Evaluation Classes

```mermaid
classDiagram
    class EthicsPolicyEngine {
        -PlatformPolicyStore platformPolicies
        -TenantPolicyCache tenantPolicies
        -AuditLogger auditLogger
        +preCheck(action: AgentAction, context: AgentContext) PolicyResult
        +postCheck(output: AgentOutput, context: AgentContext) PolicyResult
    }

    class PlatformPolicyStore {
        -List~PlatformRule~ immutableRules
        +evaluate(action: AgentAction) PlatformResult
        +getRules() List~PlatformRule~
    }

    class TenantPolicyCache {
        -Map~UUID_TenantPolicySet~ cache
        -KafkaConsumer policyUpdateConsumer
        +evaluate(action: AgentAction, tenantId: UUID) TenantResult
        +refreshCache(tenantId: UUID) void
        +onPolicyUpdated(event: PolicyUpdatedEvent) void
    }

    class PlatformRule {
        <<immutable>>
        +String ruleId
        +String description
        +String enforcementPoint
        +String failureAction
    }

    class TenantConductRule {
        +UUID id
        +UUID tenantId
        +String ruleType
        +String condition
        +String action
        +boolean active
        +Instant createdAt
        +Instant updatedAt
    }

    class PolicyResult {
        <<enumeration>>
        ALLOWED
        BLOCKED
        ESCALATED
    }

    class ContentSafetyClassifier {
        +classify(content: String) SafetyScore
        +detectBias(output: String, context: AgentContext) BiasScore
    }

    EthicsPolicyEngine --> PlatformPolicyStore : evaluates platform rules
    EthicsPolicyEngine --> TenantPolicyCache : evaluates tenant rules
    EthicsPolicyEngine --> ContentSafetyClassifier : content + bias checks
    TenantPolicyCache ..> TenantConductRule : caches
    PlatformPolicyStore ..> PlatformRule : stores
```

> **Content Safety Technology** [PLANNED]: Content safety classification (ETH-005) uses a classifier model -- either OpenAI Moderation API for cloud-routed requests or a locally fine-tuned safety classifier running on Ollama for on-premises deployments. The classifier returns per-category scores (hate, self-harm, sexual, violence, etc.) with configurable thresholds per tenant. Bias detection (ETH-006) uses statistical distribution analysis across protected attributes (gender, ethnicity, age) with configurable significance thresholds (default: p < 0.05). Output distributions that deviate beyond the configured threshold trigger a `FLAG` action and mandatory human review before the output is committed.

#### 6.14.3 Policy Hot-Reload via Kafka

Tenant administrators can update conduct policies without platform restart:

1. Admin calls `PUT /api/v1/ai/ethics/policies/tenant/{id}` with updated policy
2. `EthicsPolicyService` writes change to tenant schema (`conduct_rules` table)
3. `EthicsPolicyService` publishes `PolicyUpdatedEvent` to Kafka topic `ethics.policy.updated`
4. All ai-service instances subscribe; `TenantPolicyCache.onPolicyUpdated()` atomically swaps the in-memory policy set for the affected tenant
5. Next agent invocation evaluates against updated policies
6. Policy change recorded in audit trail: administrator identity, old policy, new policy, timestamp

**Atomic swap** prevents inconsistent evaluation during update window: the entire tenant policy set is replaced in a single operation, not incrementally updated.

#### 6.14.4 Breach Detection Patterns

| Pattern | Detection Method | Threshold | Response | Risk |
|---------|-----------------|-----------|----------|------|
| Repeated boundary probing | Agent attempts actions just outside authorized scope | 3+ attempts in 1 hour | Reduce maturity level; alert tenant admin | HIGH |
| Privilege escalation attempts | Agent outputs contain instructions to increase own permissions | Any occurrence | Block; security incident; isolate agent | CRITICAL |
| Data exfiltration pattern | Agent accumulates sensitive data across multiple READ operations | Anomaly detection on data volume | Alert security team; increase monitoring | HIGH |
| Conduct policy circumvention | Agent rephrases requests to avoid policy triggers | Semantic similarity between blocked and subsequent requests | Alert tenant admin; increase monitoring | MEDIUM |

#### 6.14.5 Alerting Severity Tiers

| Severity | Definition | Notification | Response Time |
|----------|-----------|--------------|---------------|
| **CRITICAL** | Platform ethics violation (ETH-001 through ETH-007) | Tenant admin + platform security team + audit log | Immediate (agent execution suspended) |
| **HIGH** | Tenant conduct violation with potential regulatory impact | Tenant admin + compliance officer + audit log | Within 1 hour |
| **MEDIUM** | Tenant conduct violation without regulatory impact | Tenant admin + audit log | Within 24 hours |
| **LOW** | Policy warning (near-threshold behavior) | Audit log only | Advisory in next report |

#### 6.14.6 STRIDE Threat Model: Ethics Enforcement Engine

| Threat | Attack Vector | Mitigation | Risk |
|--------|--------------|------------|------|
| **Spoofing** | Attacker forges ethics approval by calling internal engine API directly, bypassing the pipeline | Ethics engine API is internal-only (no gateway route); inter-service JWT required; all evaluation results cryptographically linked to execution trace via `execution_trace_id` | CRITICAL -- Mitigated |
| **Tampering** | Modified ethics rules at runtime to weaken enforcement (e.g., disabling ETH-001) | Platform ethics policies are immutable (`scope = 'PLATFORM'`, no UPDATE/DELETE allowed); tenant conduct policies versioned with audit trail; Kafka hot-reload uses atomic swap preventing partial updates | CRITICAL -- Mitigated |
| **Repudiation** | Ethics bypass goes unlogged, making it impossible to prove a check was skipped | Every ethics evaluation (pass or fail) is logged to `policy_violations` and audit trail with evaluation timestamp, rules evaluated, and decision; dual-write audit model (compliance + analytics) | HIGH -- Mitigated |
| **Information Disclosure** | Ethics policy rules reveal business logic or compliance strategy to unauthorized users | Policy rules are tenant-scoped; read access requires `ETHICS_ADMIN` role; platform policies are generic (not tenant-specific); API responses include only violation summary, not full rule content | MEDIUM -- Mitigated |
| **Denial of Service** | Malicious actor triggers thousands of policy evaluations to overload the ethics engine | Rate limiting per tenant (existing API gateway rate limiter); ethics engine is stateless and horizontally scalable; circuit breaker on tenant policy cache refresh; evaluation timeout of 5 seconds with BLOCK-on-timeout fallback | HIGH -- Mitigated |
| **Elevation of Privilege** | Agent output includes instructions to disable ethics checks for subsequent requests | Ethics engine operates independently of agent output; agent cannot modify its own pipeline configuration; maturity-based access control means lower-maturity agents have stricter checks; privilege escalation attempt patterns trigger maturity demotion (Section 6.14.4) | CRITICAL -- Mitigated |

#### 6.14.7 EU AI Act Article 52 Transparency Compliance [PLANNED]

> **Regulatory requirement (SEC-F09):** EU AI Act Article 52 mandates that users interacting with an AI system must be informed they are interacting with AI, not a human. The platform satisfies this through three mechanisms:
>
> 1. **System-level disclosure:** Every agent response includes a metadata header `X-AI-Generated: true` and a footer disclaimer configurable per tenant (default: "This response was generated by an AI agent and should be reviewed by a qualified professional").
> 2. **Maturity-level transparency:** The agent's current maturity level (COACHING, CO_PILOT, PILOT, GRADUATE) is included in the response metadata so downstream consumers know the level of human oversight applied.
> 3. **Audit trail linkage:** Every agent output includes an `execution_trace_id` that links to the full decision chain (ethics evaluation results, HITL checkpoints, tool invocations) for regulatory inspection. This satisfies Article 12 (record-keeping) in conjunction with Article 52 (transparency).
>
> **Implementation:** The `AgentResponseEnricher` post-processor (see Section 8 class diagrams) adds these fields before the response is returned to the caller. Platform ethics policy ETH-007 (Transparency) enforces that no agent output may suppress or modify the AI disclosure header. [PLANNED]

#### 6.14.8 Ethics Engine Fail-Open vs Fail-Closed Decision [PLANNED]

**Status:** [PLANNED] -- Addresses P0 gap: undefined behavior when the ethics engine is unavailable.
**Cross-Reference:** Section 6.14.1 (Enforcement Engine Architecture), Section 6.14.5 (Alerting Severity Tiers), ADR-027

**Default behavior: FAIL-CLOSED.** When the ethics engine is unreachable (timeout, circuit breaker open, or internal error), all actions requiring an ethics check are **blocked** by default. This is the safe default for regulatory compliance (EU AI Act Article 9). [PLANNED]

**Fail mode behavior matrix:**

| Fail Mode | Behavior | When to Use | Risk |
|-----------|----------|-------------|------|
| `FAIL_CLOSED` (default) | All ethics-gated actions BLOCKED; error AI-ETH-001 returned | Production, regulated industries, HIPAA/SOX tenants | LOW -- no unvetted actions pass through |
| `FAIL_OPEN_WITH_AUDIT` | Action proceeds but every action is logged with `ethics_bypassed=true` flag for mandatory post-hoc review | Non-regulated tenants who prioritize availability over compliance | MEDIUM -- unvetted actions may execute |

**Tenant-configurable fail mode:** [PLANNED]

```sql
-- Add to ai_shared.tenant_registry [PLANNED]
ALTER TABLE ai_shared.tenant_registry
    ADD COLUMN ethics_fail_mode VARCHAR(30) NOT NULL DEFAULT 'FAIL_CLOSED'
    CONSTRAINT chk_ethics_fail_mode CHECK (ethics_fail_mode IN ('FAIL_CLOSED', 'FAIL_OPEN_WITH_AUDIT'));
```

**FAIL-CLOSED sequence:** [PLANNED]

```mermaid
sequenceDiagram
    participant Agent as Agent Pipeline
    participant Engine as Ethics Engine
    participant Audit as Audit Trail
    participant SSE as SSE Notification
    participant Admin as TENANT_ADMIN

    Agent->>Engine: preCheck(action, context)
    Engine--xAgent: TIMEOUT / 503

    alt FAIL_CLOSED (default)
        Agent->>Audit: LOG: ethics_check_skipped, reason=ENGINE_UNAVAILABLE, action=BLOCKED
        Agent-->>Agent: Return AI-ETH-001 (503)
        Agent->>SSE: Notify TENANT_ADMIN: "Ethics engine temporarily unavailable, actions paused"
    else FAIL_OPEN_WITH_AUDIT
        Agent->>Audit: LOG: ethics_check_skipped, reason=ENGINE_UNAVAILABLE, ethics_bypassed=true, action=PROCEED
        Agent->>Agent: Continue execution (action proceeds)
        Agent->>SSE: Notify TENANT_ADMIN: "Ethics check bypassed -- post-hoc review required"
        Note over Admin: All bypassed actions appear in<br/>mandatory review queue
    end
```

**Post-hoc review for FAIL_OPEN_WITH_AUDIT:** [PLANNED]

When the ethics engine recovers, a background job re-evaluates all actions executed during the outage window (identified by `ethics_bypassed=true` flag in audit trail). Violations detected retroactively are flagged for TENANT_ADMIN review with severity escalation. The re-evaluation query:

```sql
-- Retroactive ethics evaluation query [PLANNED]
SELECT ae.id, ae.action_type, ae.details
FROM audit_events ae
WHERE ae.tenant_id = :tenantId
  AND ae.details->>'ethics_bypassed' = 'true'
  AND ae.details->>'retroactive_evaluation' IS NULL
ORDER BY ae.event_time ASC;
```

---

### 6.15 Prompt Injection Defense for Multi-Agent [PLANNED]

<!-- Extends Section 6.7 with agent-to-agent injection vectors; See Benchmarking Study Section 10.1 -->

**Status:** [PLANNED] -- Not yet implemented. Extends the existing prompt injection defense (Section 6.7) with agent-to-agent injection vectors specific to the hierarchical Super Agent architecture.
**Cross-Reference:** Section 6.7 (base defense), 01-PRD Section 7.3, ADR-023, Benchmarking Study Section 10.1
**Risk Rating:** CRITICAL -- Agent-to-agent prompt injection is the most dangerous LLM-specific threat in multi-agent systems because worker outputs are typically trusted more than user inputs.

#### 6.15.1 Multi-Agent Attack Surface

The hierarchical architecture introduces injection vectors that do not exist in single-agent systems. Each agent handoff creates an injection opportunity.

```mermaid
graph TD
    subgraph "Injection Attack Surface"
        A["User Input<br/>(Direct Injection)"] --> B["Super Agent"]
        B --> C["Sub-Orchestrator"]
        C --> D["Worker A"]
        C --> E["Worker B"]

        F["RAG Knowledge Base<br/>(Indirect Injection)"] --> B
        F --> D

        D -->|"Worker output containing<br/>injected instructions"| C
        E -->|"Worker output containing<br/>injected instructions"| C
        C -->|"Aggregated output containing<br/>injected instructions"| B
    end

    style A fill:#c0392b,color:#ffffff
    style F fill:#c0392b,color:#ffffff
```

**Agent-to-agent injection is particularly dangerous because:**
- Worker outputs are typically trusted more than user inputs (they come from "inside" the system)
- Output validation may be less rigorous for inter-agent communication
- A compromised worker can influence higher-level agents that aggregate its output

#### 6.15.2 Multi-Agent Defense Layers

The following defenses extend Section 6.7's base `PromptSanitizationFilter` for the multi-agent context:

**Layer 1: Sub-orchestrator instruction validation.** When a sub-orchestrator sends instructions to a worker, the instructions are signed with the sub-orchestrator's agent JWT. The worker validates the signature before processing. If the signature is invalid, the instruction is rejected and a security alert is logged.

**Layer 2: Worker output sanitization.** Before a worker's output is returned to the sub-orchestrator, it passes through the output sanitization filter that detects:
- Sentinel token fragments (indicating system prompt leakage)
- JSON tool definitions or API schemas (indicating attempted tool injection)
- Agent identity claims or maturity level assertions (indicating privilege escalation attempts)
- Instructions formatted as sub-orchestrator or Super Agent commands (indicating impersonation)

**Layer 3: Cross-agent context poisoning prevention.** When a sub-orchestrator aggregates outputs from multiple workers, each worker's output is enclosed in signed context boundaries:

```
===WORKER_OUTPUT:worker-id:hmac-signature===
[worker output content]
===END_WORKER_OUTPUT:worker-id:hmac-signature===
```

The sub-orchestrator validates all boundary signatures before aggregation. If any signature is invalid or if output content contains boundary markers, the output is quarantined and the worker is flagged.

> **Security note:** Context boundary markers MUST be rotated per-session or use HMAC-based dynamic markers (HMAC-SHA256 with session-specific keys) to prevent attackers from learning and forging static marker patterns. The HMAC key is derived from the session ID and a per-tenant secret, ensuring markers are unique per session and per tenant.

**Layer 4: Prompt signing (emerging technique).** System prompts for each agent in the hierarchy are cryptographically signed. Any modification (including injection of additional instructions through concatenation) invalidates the signature. The LLM response includes a verification check: if the prompt hash in the response metadata does not match the signed prompt hash, injection is suspected.

#### 6.15.3 Defense Architecture Class Diagram

```mermaid
classDiagram
    class MultiAgentInjectionDefense {
        -AgentJwtValidator jwtValidator
        -OutputSanitizer outputSanitizer
        -ContextBoundaryService boundaryService
        -PromptSigningService promptSigner
        +validateInstruction(instruction: String, senderJwt: AgentJwt) ValidationResult
        +sanitizeWorkerOutput(output: String, workerId: String) SanitizedOutput
        +createContextBoundary(output: String, workerId: String) BoundedOutput
        +verifyPromptIntegrity(response: String, originalPromptHash: String) IntegrityResult
    }

    class OutputSanitizer {
        -List~Pattern~ injectionPatterns
        -List~Pattern~ toolDefinitionPatterns
        -List~Pattern~ agentImpersonationPatterns
        +sanitize(output: String) SanitizationResult
    }

    class ContextBoundaryService {
        -AgentJwtService jwtService
        +wrapOutput(output: String, workerId: String) BoundedOutput
        +validateBoundaries(aggregatedContent: String) List~BoundaryValidation~
    }

    class PromptSigningService {
        -KeyPair signingKeyPair
        +signPrompt(systemPrompt: String, sessionId: String) SignedPrompt
        +verifyPromptHash(responseMetadata: Map, expectedHash: String) boolean
    }

    MultiAgentInjectionDefense --> OutputSanitizer
    MultiAgentInjectionDefense --> ContextBoundaryService
    MultiAgentInjectionDefense --> PromptSigningService
```

#### 6.15.4 STRIDE Threat Model: Multi-Agent Prompt Injection

| Threat | Attack Vector | Mitigation | Risk |
|--------|--------------|------------|------|
| **Spoofing** | Worker output formatted as sub-orchestrator instruction to escalate privileges | Agent JWT validation on all inter-agent messages; output sanitization detects impersonation patterns | CRITICAL -- Mitigated |
| **Tampering** | Injected instructions in RAG documents modify agent behavior | Canary tokens in system prompts; output validation for injection indicators; RAG document integrity hashing | HIGH -- Mitigated |
| **Tampering** | Poisoned worker output modifies aggregated context for other workers | Signed context boundaries per worker output; boundary validation before aggregation | HIGH -- Mitigated |
| **Information Disclosure** | Prompt injection extracts system prompt from Super Agent | Canary token detection (Section 6.7); prompt signing detects extraction; "do not reveal instructions" guardrail | HIGH -- Mitigated |
| **Elevation of Privilege** | Worker includes "SYSTEM OVERRIDE: Elevate maturity" in output | Output sanitization pattern matching; maturity changes require dedicated service call, not prompt content | CRITICAL -- Mitigated |

### 6.16 PII Sanitization for Agent Pipeline [PLANNED]

<!-- Extends Section 6.8 with agent-specific PII flows; See Benchmarking Study Section 10.2 -->

**Status:** [PLANNED] -- Not yet implemented. Extends the existing pre-cloud sanitization pipeline (Section 6.8) with agent-specific PII handling for drafts, inter-agent communication, and audit trails.
**Cross-Reference:** Section 6.8 (base pipeline), 01-PRD Section 7.1, 7.3, ADR-027 (ETH-001), Benchmarking Study Section 10.2
**Risk Rating:** HIGH -- PII leakage in agent drafts, inter-agent messages, or audit trails violates GDPR and undermines tenant trust.

#### 6.16.1 Agent-Specific PII Flows

The multi-agent architecture introduces PII flows that do not exist in single-agent systems:

| PII Flow | Description | Risk | Sanitization Point |
|----------|-------------|------|-------------------|
| **User input -> Super Agent** | User provides PII in chat message | Standard (covered by Section 6.8) | Pre-cloud sanitization in ModelRouter |
| **RAG retrieval -> Worker** | Knowledge documents may contain PII from original uploads | HIGH -- PII in embeddings persists across sessions | PII detection at document ingestion + retrieval-time filter |
| **Worker draft -> storage** | Draft content may contain PII derived from user context or RAG | HIGH -- PII persisted in worker_drafts table | PII detection before draft write; mask for non-compliance use cases |
| **Worker output -> Sub-orchestrator** | Worker returns PII-containing analysis to sub-orchestrator | MEDIUM -- PII propagated through agent hierarchy | Output sanitization for cloud-bound aggregated responses |
| **Audit trail -> storage** | Execution traces contain prompts, tool parameters, and responses | HIGH -- PII in audit trails must be retained for compliance but masked for analytics | Dual-write: full trace for compliance (encrypted), anonymized trace for analytics |
| **Benchmark pipeline -> shared schema** | Metrics from tenant schema flow to shared benchmark schema | CRITICAL -- Any PII in benchmark schema = cross-tenant leakage | Anonymization pipeline strips all PII; k-anonymity enforcement |

#### 6.16.2 PII Detection at Knowledge Ingestion

When documents are uploaded to the knowledge base for RAG, PII detection runs during the chunking phase before embeddings are created:

```mermaid
sequenceDiagram
    participant Upload as Document Upload API
    participant Chunk as Chunking Service
    participant PII as PII Detection Service
    participant Embed as Embedding Service
    participant Store as PGVector Store

    Upload->>Chunk: Process document (PDF, DOCX, etc.)
    Chunk->>Chunk: Split into chunks (512 tokens)

    loop For each chunk
        Chunk->>PII: detectPII(chunk)
        PII-->>Chunk: PIIResult (entities found, positions)

        alt PII detected
            Chunk->>Chunk: Create sanitized variant (PII masked)
            Chunk->>Embed: Embed sanitized variant (for cloud model use)
            Chunk->>Store: Store both: original (tenant-only, encrypted) + sanitized (cloud-safe)
        else No PII
            Chunk->>Embed: Embed original
            Chunk->>Store: Store original
        end
    end
```

**Dual storage model:** Original chunks with PII are stored encrypted in the tenant schema (accessible only to local Ollama inference). Sanitized chunks are used when the ModelRouter selects a cloud provider. This preserves full context for local inference while protecting PII during cloud calls.

> **PII Detection Technology** [PLANNED]: PII detection uses a two-layer approach: (1) regex patterns for structured PII (email addresses, phone numbers, credit card numbers, national IDs) and (2) a Named Entity Recognition (NER) model (e.g., Microsoft Presidio backed by spaCy `en_core_web_trf`) for unstructured PII (person names, addresses, dates of birth, medical terms). Entity types are configurable per tenant -- for example, a healthcare tenant may add HIPAA-specific entity types (diagnosis codes, prescription IDs) while a financial tenant adds PCI-DSS types (account numbers, routing numbers). Detection confidence thresholds are configurable (default: 0.85 for NER, exact match for regex).

#### 6.16.3 Draft Content PII Handling

Worker drafts stored in `worker_drafts` may contain PII derived from user context, RAG retrieval, or tool execution results. PII handling follows these rules:

| Draft State | PII Handling | Rationale |
|-------------|-------------|-----------|
| DRAFT (in sandbox) | Full PII retained (encrypted at rest) | Worker needs full context for revision |
| UNDER_REVIEW | Full PII visible to authorized reviewer only | Reviewer needs context to assess quality |
| APPROVED | PII retained for committed output | Output may legitimately contain PII (e.g., customer report) |
| COMMITTED | PII subject to tenant data retention policy | Standard data lifecycle applies |
| REJECTED | PII anonymized after 30-day retention | Rejected drafts have no business value; anonymize for training data only |

#### 6.16.4 Audit Trail PII Handling

Audit trails create a fundamental tension: they must contain sufficient detail for compliance (EU AI Act Article 12) while not becoming an uncontrolled PII repository.

**Resolution: Dual-write audit model:**

| Audit Layer | PII Content | Access Control | Retention |
|-------------|------------|----------------|-----------|
| **Compliance audit** | Full PII (encrypted at rest) | Compliance officers + tenant admin only | Per regulatory requirement (3-7 years) |
| **Analytics audit** | PII anonymized (irreversible tokens) | Broader analytics access | Standard analytics retention (90 days) |
| **Cross-tenant benchmark** | No PII (aggregated metrics only) | All tenants (shared schema) | Indefinite (anonymized) |

**Right-to-erasure handling:** When a GDPR Article 17 erasure request is received:
1. Analytics audit records: PII already anonymized; no action needed
2. Compliance audit records: PII fields replaced with irreversible tokens (preserving audit structure)
3. Cross-tenant benchmarks: no PII present; no action needed
4. Erasure action logged in compliance audit with erasure certificate

#### 6.16.5 STRIDE Threat Model: Agent PII Flows

| Threat | Attack Vector | Mitigation | Risk |
|--------|--------------|------------|------|
| **Information Disclosure** | Cloud LLM call includes PII from RAG documents | Dual storage (sanitized variant for cloud use); pre-cloud sanitization pipeline (Section 6.8) | HIGH -- Mitigated |
| **Information Disclosure** | Worker draft containing PII accessible to unauthorized user | Draft visibility restricted to assigned reviewer + tenant admin; encrypted at rest | HIGH -- Mitigated |
| **Information Disclosure** | Audit trail searched for PII by unauthorized analyst | Dual-write model: analytics audit has anonymized PII only; compliance audit has restricted access | HIGH -- Mitigated |
| **Information Disclosure** | Benchmark pipeline leaks tenant PII to shared schema | Anonymization pipeline strips all PII; k-anonymity enforcement; automated tests verify anonymization | CRITICAL -- Mitigated |
| **Tampering** | Attacker modifies PII anonymization to be reversible | Irreversible tokenization (SHA-256 hash without salt); no reverse mapping stored | MEDIUM -- Mitigated |
| **Repudiation** | Denied PII was in audit trail after erasure request | Erasure certificates with cryptographic hash of erased records; erasure action logged | MEDIUM -- Mitigated |

---

## 7. Data Flow Diagrams

**Status:** [PLANNED]
**Cross-Reference:** 01-PRD Section 3.1, 02-Tech-Spec Sections 3.9, 4.1-4.5

### 7.1 Seven-Step Request Pipeline (Sequence Diagram)

```mermaid
sequenceDiagram
    participant User
    participant GW as API Gateway
    participant Orch as Orchestrator
    participant OrcModel as Orchestrator Model<br/>(~8B Ollama)
    participant RAG as RAG / PGVector
    participant Worker as Worker Model<br/>(~24B Ollama)
    participant Tools as Tool Registry
    participant Val as Validation Service
    participant Trace as Trace Collector<br/>(via Kafka)

    User->>GW: POST /api/v1/agents/data-analyst/chat
    GW->>GW: Validate JWT, extract tenant
    GW->>Orch: Forward with X-Tenant-Id

    Note over Orch: Step 1: INTAKE
    Orch->>Orch: Classify request type and complexity
    Orch->>Orch: Normalize input, extract parameters

    Note over Orch,RAG: Step 2: RETRIEVE
    Orch->>OrcModel: "Should retrieval be triggered?"
    OrcModel-->>Orch: Yes, retrieve [data_warehouse_docs]
    Orch->>RAG: Semantic search (query, tenantId, topK=10)
    RAG-->>Orch: Retrieved context documents

    Note over Orch,OrcModel: Step 3: PLAN
    Orch->>OrcModel: Generate execution plan<br/>(request + context)
    OrcModel-->>Orch: ExecutionPlan {skill, tools, steps}

    Note over Orch,Worker: Step 4: EXECUTE
    Orch->>Orch: Resolve skill -> system prompt + tools
    Orch->>Worker: ReAct loop (system prompt, tools)
    loop ReAct Turns (max 10)
        Worker->>Worker: Reasoning step
        Worker->>Tools: Tool call (e.g., run_sql)
        Tools-->>Worker: Tool result
        Worker->>Worker: Observation + next reasoning
    end
    Worker-->>Orch: Final response + artifacts

    Note over Orch,Val: Step 5: VALIDATE
    Orch->>Val: Validate response against rules
    Val->>Val: Check path scope, data access, format
    Val->>Val: Run test suites on code artifacts
    alt Validation Failed
        Val-->>Orch: ValidationResult {failed, issues}
        Orch->>Worker: Retry with corrective feedback
        Worker-->>Orch: Corrected response
    end
    Val-->>Orch: ValidationResult {passed}

    Note over Orch,OrcModel: Step 6: EXPLAIN
    Orch->>OrcModel: Generate explanation<br/>(trace + validation report)
    OrcModel-->>Orch: Explanation {business, technical, artifacts}

    Note over Orch,Trace: Step 7: RECORD
    Orch->>Trace: Kafka: agent.traces (full trace)

    Orch-->>GW: PipelineResponse
    GW-->>User: 200 OK {content, explanation, artifacts}
```

### 7.2 Training Data Flow

```mermaid
graph TD
    subgraph Data Sources
        UC[User Corrections<br/>feedback-service]
        UR[User Ratings<br/>feedback-service]
        CF[Customer Feedback<br/>External CRM/Kafka]
        BP[Business Patterns<br/>Domain Expert input]
        LM[Learning Materials<br/>Document uploads]
        TM[Teacher Models<br/>Claude/Codex/Gemini]
    end

    subgraph Ingestion Layer
        FK1[Kafka: feedback.signals]
        FK2[Kafka: feedback.customer]
        FK3[Kafka: knowledge.updates]
        FK4[Kafka: training.data.priority]
    end

    subgraph Processing
        TDS[training-data-service<br/>Unified Dataset Builder]
        TS[teacher-service<br/>Gap-filling, evaluation]
        DP[document-processor<br/>Chunk + embed]
    end

    subgraph Training
        TO[training-orchestrator<br/>SFT + DPO + RAG Update]
        ME[model-evaluator<br/>Benchmark + quality gate]
    end

    subgraph Deployment
        OL[Ollama<br/>Model import + serve]
        VS[PGVector<br/>Updated embeddings]
    end

    UC -->|Priority queue| FK4
    UR --> FK1
    CF --> FK2
    BP --> FK1
    LM --> FK3

    FK1 --> TDS
    FK2 --> TDS
    FK3 --> DP
    FK4 --> TO

    DP -->|Embeddings| VS
    DP -->|Q&A pairs| TDS

    TDS -->|Built dataset| TO
    TM --> TS
    TS -->|Synthetic examples| TDS
    TS -->|Gap analysis| TDS

    TO -->|Trained model| ME
    ME -->|Quality gate pass| OL
    TO -->|RAG update| VS

    ME -.->|Quality gate fail| TO
```

### 7.3 Feedback Loop (User Rating to Model Improvement)

```mermaid
sequenceDiagram
    participant User
    participant Agent as Agent Service
    participant FB as feedback-service
    participant Kafka
    participant TDS as training-data-service
    participant TO as training-orchestrator
    participant ME as model-evaluator
    participant Ollama

    User->>Agent: Chat request
    Agent-->>User: Response (traceId: T-123)

    User->>FB: POST /api/v1/feedback/correction<br/>{traceId: T-123, correctedResponse: "..."}
    FB->>FB: Save correction to DB
    FB->>Kafka: training.data.priority<br/>{correction, priority: HIGHEST}

    Note over TO: Daily 2:00 AM retraining
    TO->>TDS: buildDataset("all", daily config)
    TDS->>TDS: Source 1: Positive traces (SFT)
    TDS->>TDS: Source 2: User corrections (SFT, highest weight)
    TDS->>TDS: Source 3: Business patterns (SFT)
    TDS->>TDS: Source 4: Preference pairs (DPO)
    TDS->>TDS: Source 5: Learning materials
    TDS->>TDS: Source 6: Teacher synthetic (fill gaps)
    TDS-->>TO: TrainingDataset (N examples)

    TO->>TO: Run SFT training (LoRA)
    TO->>TO: Run DPO training
    TO->>TO: Update RAG vector store

    TO->>ME: Evaluate new model vs production
    ME->>ME: Run benchmark suite
    ME->>ME: Compare quality scores

    alt New model better
        ME-->>TO: Quality gate PASSED
        TO->>Ollama: Deploy new model version
        TO->>Kafka: model.events {DEPLOYED}
    else New model worse
        ME-->>TO: Quality gate FAILED
        TO->>TO: Log failure, keep current model
    end
```

### 7.4 Tenant Isolation in Vector Store Queries

```mermaid
sequenceDiagram
    participant Orch as Orchestrator
    participant TCS as TenantContextService
    participant PGV as PGVector Store

    Orch->>TCS: retrieveForTenant(query, tenantId="T-001", topK=10)
    TCS->>TCS: Build metadata filter:<br/>WHERE tenantId = 'T-001'
    TCS->>PGV: SELECT content, embedding<br/>FROM vector_store<br/>WHERE tenantId = 'T-001'<br/>ORDER BY embedding <=> query_embedding<br/>LIMIT 10
    PGV-->>TCS: 10 documents (all belong to T-001)
    TCS-->>Orch: Tenant-safe context documents

    Note over Orch: Tenant T-002's documents<br/>are NEVER returned to T-001
```

### 7.5 Event-Driven Agent Activation: Entity Change to Draft Commit [PLANNED]

**Status:** [PLANNED]
**Cross-Reference:** ADR-025 (Event-Driven Agent Triggers), ADR-028 (Worker Sandbox Draft Lifecycle), ADR-030 (HITL Risk-Maturity Matrix), 02-Tech-Spec Sections 3.26, 3.28, 3.29

This sequence shows the full lifecycle: an entity change in an external system produces a Kafka event, which is matched by an event trigger, activates a worker agent, produces a sandboxed draft, goes through review, and is committed.

```mermaid
sequenceDiagram
    participant Ext as External System<br/>(e.g., CRM)
    participant Kafka as Kafka
    participant ETS as EventTriggerService
    participant SA as SuperAgent
    participant SubO as SubOrchestrator
    participant Worker as Worker Agent<br/>(maturity: CO_PILOT)
    participant Sandbox as DraftSandboxService
    participant HITL as HITLService
    participant Human as Human Reviewer
    participant AuditK as Kafka: agent.audit

    Note over Ext,Kafka: Step 1: Entity Change Event
    Ext->>Kafka: agent.events.entity_lifecycle<br/>{type: CUSTOMER_UPDATED, customerId: C-42}

    Note over Kafka,ETS: Step 2: Event Trigger Matching
    Kafka->>ETS: Consume event
    ETS->>ETS: Match against active triggers<br/>(source_type=ENTITY_LIFECYCLE,<br/>pattern matches CUSTOMER_UPDATED)
    ETS->>ETS: Resolve target agent from trigger config

    Note over ETS,SA: Step 3: Agent Activation
    ETS->>SA: activateForEvent(triggerId, eventPayload)
    SA->>SA: Determine domain from trigger config
    SA->>SubO: delegate(domain=SD, task)

    Note over SubO,Worker: Step 4: Worker Selection & Execution
    SubO->>SubO: Select worker by delegation strategy<br/>(SKILL_MATCH: customer-analysis skill)
    SubO->>Worker: execute(task, sandboxMode=true)
    Worker->>Worker: ReAct loop execution<br/>(tools: database_query, analyze)
    Worker-->>SubO: WorkerResult {content, artifacts}

    Note over SubO,Sandbox: Step 5: Draft Creation (Sandbox)
    SubO->>Sandbox: createDraft(workerId, result)
    Sandbox->>Sandbox: Store as DRAFT status<br/>(content immutable per version)
    Sandbox-->>SubO: Draft {id: D-99, status: DRAFT}

    Note over Sandbox,HITL: Step 6: HITL Review Determination
    Sandbox->>HITL: evaluateReviewRequirement(draft, worker.maturity)
    HITL->>HITL: Risk=MEDIUM x Maturity=CO_PILOT<br/>=> interactionType=REVIEW
    HITL->>Sandbox: submitForReview(draftId: D-99)
    Sandbox->>Sandbox: Status: DRAFT -> UNDER_REVIEW

    Note over HITL,Human: Step 7: Human Review
    HITL->>Human: Notification: Draft D-99 requires review
    Human->>Sandbox: GET /api/v1/ai/drafts/D-99
    Sandbox-->>Human: Draft content + diff summary
    Human->>Sandbox: POST /api/v1/ai/drafts/D-99/review<br/>{decision: APPROVE, comment: "Looks good"}
    Sandbox->>Sandbox: Status: UNDER_REVIEW -> APPROVED

    Note over Sandbox,AuditK: Step 8: Commit & Audit
    Sandbox->>Sandbox: POST /api/v1/ai/drafts/D-99/commit
    Sandbox->>Sandbox: Status: APPROVED -> COMMITTED
    Sandbox->>Sandbox: Apply draft content to target entity
    Sandbox->>AuditK: agent.audit<br/>{action: DRAFT_COMMITTED, draftId: D-99}
```

### 7.6 User Request Through Super Agent Hierarchy [PLANNED]

**Status:** [PLANNED]
**Cross-Reference:** ADR-023 (Hierarchical Architecture), ADR-024 (Agent Maturity Model), ADR-029 (Dynamic System Prompt Composition), 02-Tech-Spec Sections 3.22, 3.23, 3.24, 3.27

This sequence shows a user request flowing through the three-tier hierarchy: Super Agent classifies and routes, Sub-Orchestrator plans execution, Workers execute tasks (with sandbox for non-Graduate maturity), and the response is assembled and returned.

```mermaid
sequenceDiagram
    participant User
    participant GW as API Gateway
    participant SA as SuperAgent<br/>(Tier 1)
    participant PC as PromptComposer
    participant SubO as SubOrchestrator<br/>(Tier 2: PERF)
    participant W1 as Worker A<br/>(PILOT, sql-analysis)
    participant W2 as Worker B<br/>(COACHING, chart-gen)
    participant Sandbox as DraftSandboxService
    participant HITL as HITLService
    participant Tools as Tool Registry
    participant Trace as Trace Collector<br/>(via Kafka)

    User->>GW: POST /api/v1/ai/super-agent/chat<br/>{message: "Analyze Q1 revenue trends"}
    GW->>GW: Validate JWT, extract tenant
    GW->>SA: Forward with X-Tenant-Id

    Note over SA: Tier 1: Classification & Routing
    SA->>SA: Classify request domain: PERF
    SA->>SA: Assess complexity: MEDIUM
    SA->>SA: Check ethics policy: PASS
    SA->>SubO: delegate(task, priority=NORMAL)

    Note over SubO: Tier 2: Planning & Delegation
    SubO->>SubO: Decompose into sub-tasks:<br/>1. SQL query for revenue data<br/>2. Chart generation from results
    SubO->>SubO: Select workers by SKILL_MATCH

    Note over SubO,W1: Tier 3a: Worker A (PILOT - direct execution)
    SubO->>PC: composePrompt(workerId=W1, task=sql-analysis)
    PC->>PC: Assemble blocks: [IDENTITY, ROLE,<br/>DOMAIN, TOOLS, ETHICS, TENANT_CONTEXT]
    PC-->>SubO: Composed system prompt
    SubO->>W1: execute(prompt, task="Query Q1 revenue")
    W1->>Tools: run_sql(SELECT ... FROM revenue WHERE quarter='Q1')
    Tools-->>W1: ResultSet {rows: [...]}
    W1-->>SubO: WorkerResult {data: revenue_data}
    Note over W1: PILOT maturity: no sandbox needed<br/>(low-risk READ tool)

    Note over SubO,W2: Tier 3b: Worker B (COACHING - sandbox required)
    SubO->>PC: composePrompt(workerId=W2, task=chart-gen)
    PC-->>SubO: Composed system prompt
    SubO->>W2: execute(prompt, task="Generate chart", sandboxMode=true)
    W2->>Tools: generate_chart(data=revenue_data, type=line)
    Tools-->>W2: Chart artifact
    W2-->>SubO: WorkerResult {artifact: chart_svg}

    Note over Sandbox,HITL: Worker B output goes through sandbox
    SubO->>Sandbox: createDraft(workerId=W2, result=chart)
    Sandbox-->>SubO: Draft {id: D-100, status: DRAFT}
    Sandbox->>HITL: evaluateReviewRequirement(draft, COACHING)
    HITL->>HITL: Risk=LOW x Maturity=COACHING<br/>=> interactionType=REVIEW
    HITL->>Sandbox: Auto-review by SubOrchestrator<br/>(senior agent review for LOW risk)
    Sandbox->>Sandbox: Status: DRAFT -> APPROVED -> COMMITTED

    Note over SubO,SA: Tier 2: Assembly
    SubO->>SubO: Combine Worker A data + Worker B chart
    SubO-->>SA: AggregatedResult {data, chart, explanation}

    Note over SA,Trace: Tier 1: Response & Audit
    SA->>SA: Final ethics check on combined output
    SA->>Trace: Kafka: agent.traces (full hierarchy trace)
    SA-->>GW: PipelineResponse {content, artifacts}
    GW-->>User: 200 OK {revenue analysis + chart}
```

### 7.7 Scheduled Trigger: Automated Periodic Execution [PLANNED]

**Status:** [PLANNED]
**Cross-Reference:** ADR-025 (Event-Driven Agent Triggers), BA Domain Model -- EventSchedule entity, 02-Tech-Spec Section 3.28

This sequence shows a time-based trigger (cron schedule) firing automatically, activating an agent for a periodic task such as daily report generation or data quality audit.

```mermaid
sequenceDiagram
    participant Scheduler as Event Scheduler<br/>(Quartz/Spring Scheduler)
    participant ETS as EventTriggerService
    participant Kafka as Kafka
    participant SA as SuperAgent
    participant SubO as SubOrchestrator<br/>(KM)
    participant Worker as Worker Agent<br/>(GRADUATE maturity)
    participant Tools as Tool Registry
    participant Notify as NotificationService
    participant AuditK as Kafka: agent.audit

    Note over Scheduler: Daily 2:00 AM UTC trigger fires
    Scheduler->>Scheduler: Check event_schedules table<br/>WHERE next_fire_at <= NOW()
    Scheduler->>ETS: fireTrigger(triggerId=T-55)

    Note over ETS: Trigger Resolution
    ETS->>ETS: Load trigger config:<br/>name="Daily Data Quality Report"<br/>source_type=TIME_BASED<br/>target=SubOrchestrator(KM)
    ETS->>ETS: Render task template with<br/>current date context
    ETS->>Kafka: agent.events.scheduled<br/>{triggerId: T-55, task: "Generate daily DQ report"}

    Note over Kafka,SA: Event -> Agent Activation
    Kafka->>SA: Consume scheduled event
    SA->>SA: Route to KM domain
    SA->>SubO: delegate(task="Daily DQ report", source=SCHEDULED)

    Note over SubO,Worker: Worker Execution (GRADUATE - full autonomy)
    SubO->>Worker: execute(task, sandboxMode=false)
    Note over Worker: GRADUATE maturity: no sandbox,<br/>full tool access including WRITE
    Worker->>Tools: database_query("SELECT quality metrics...")
    Tools-->>Worker: Quality metrics data
    Worker->>Tools: generate_report(data, template=DQ_DAILY)
    Tools-->>Worker: Report artifact (PDF)
    Worker->>Tools: file_write(report, path=/reports/dq/)
    Tools-->>Worker: File written successfully
    Worker-->>SubO: WorkerResult {report, summary}

    Note over SubO,Notify: Notification & Audit
    SubO-->>SA: Result {report generated, 3 quality issues found}
    SA->>Notify: sendNotification(recipients=DQ_TEAM,<br/>message="Daily DQ report ready: 3 issues")
    SA->>AuditK: agent.audit<br/>{action: SCHEDULED_TASK_COMPLETED,<br/>triggerId: T-55, duration: 45s}

    Note over Scheduler: Update schedule
    Scheduler->>Scheduler: Update event_schedules:<br/>last_fired_at=NOW(),<br/>next_fire_at=tomorrow 2:00 AM,<br/>fire_count++
```

### 7.8 Conversation-Level Concurrency Control [PLANNED]

**Status:** [PLANNED] -- Addresses P0 gap: no mechanism to prevent concurrent SSE streams on the same conversation.
**Cross-Reference:** Section 4.2 (Agent Chat API), Section 4.9.1 (AI-CONV-001)

Only one active SSE stream is permitted per conversation_id at a time. Optimistic locking via the `version` column on the conversations table prevents concurrent writes; a per-conversation mutex in Valkey prevents concurrent streams. [PLANNED]

```mermaid
sequenceDiagram
    participant ClientA as Client A
    participant ClientB as Client B
    participant GW as API Gateway
    participant AI as AI Service
    participant Valkey as Valkey Cache
    participant DB as PostgreSQL

    ClientA->>GW: POST /chat (conversationId=C-1, stream=true)
    GW->>AI: Forward
    AI->>Valkey: SETNX conv-lock:C-1 (TTL=300s)
    Valkey-->>AI: OK (lock acquired)
    AI->>DB: SELECT version FROM conversations WHERE id=C-1
    AI-->>ClientA: SSE stream opened

    Note over ClientA,AI: Stream active for C-1

    ClientB->>GW: POST /chat (conversationId=C-1, stream=true)
    GW->>AI: Forward
    AI->>Valkey: SETNX conv-lock:C-1 (TTL=300s)
    Valkey-->>AI: FAIL (lock exists)
    AI-->>ClientB: 409 AI-CONV-001 "Another stream is active for this conversation"

    Note over ClientA,AI: Client A finishes streaming

    AI->>Valkey: DEL conv-lock:C-1
    AI->>DB: UPDATE conversations SET version=version+1 WHERE id=C-1 AND version=:expected
```

**Valkey lock key pattern:** `{tenant_id}:conv-lock:{conversation_id}` with TTL of 300 seconds (5 minutes max stream duration). If the stream ends normally or errors, the lock is released immediately via `DEL`. The TTL acts as a safety net for abandoned connections. [PLANNED]

---

### 7.9 Embedding Provider Circuit Breaker Flow [PLANNED]

**Status:** [PLANNED] -- Addresses P0 gap: no circuit breaker for embedding API calls.
**Cross-Reference:** Section 3.2 (PGVector), Section 3.13 (Knowledge Sources), Appendix B (Resilience4j)

```mermaid
sequenceDiagram
    participant Client as Knowledge Upload API
    participant Svc as EmbeddingService
    participant CB as Resilience4j CircuitBreaker
    participant Embed as Embedding Provider<br/>(OpenAI / Ollama)
    participant Queue as Retry Queue (DB)

    alt Circuit Breaker CLOSED (normal)
        Client->>Svc: embedDocument(doc)
        Svc->>CB: execute(embedCall)
        CB->>Embed: POST /embeddings
        Embed-->>CB: 200 OK (vectors)
        CB-->>Svc: vectors
        Svc-->>Client: 200 (indexed)
    end

    alt Circuit Breaker OPEN (after 5 failures in 60s)
        Client->>Svc: embedDocument(doc)
        Svc->>CB: execute(embedCall)
        CB-->>Svc: CircuitBreakerOpenException
        Svc->>Queue: INSERT INTO embedding_retry_queue (doc_id, retry_at=NOW()+60s)
        Svc-->>Client: 503 AI-EMB-001 + Retry-After: 60
    end

    alt Circuit Breaker HALF_OPEN (probe after 30s)
        CB->>Embed: POST /embeddings (probe request)
        Embed-->>CB: 200 OK
        CB->>CB: Transition to CLOSED
        Note over Queue: Background job processes retry queue
    end
```

**Resilience4j configuration:** [PLANNED]

```yaml
resilience4j:
  circuitbreaker:
    instances:
      embedding-provider:
        sliding-window-size: 10
        failure-rate-threshold: 50
        wait-duration-in-open-state: 30s
        permitted-number-of-calls-in-half-open-state: 3
        slow-call-duration-threshold: 10s
        slow-call-rate-threshold: 80
```

**Retry queue table:** [PLANNED]

```sql
-- embedding_retry_queue (tenant_{uuid} schema) [PLANNED]
CREATE TABLE embedding_retry_queue (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id  UUID NOT NULL REFERENCES knowledge_sources(id),
    tenant_id    UUID NOT NULL,
    retry_at     TIMESTAMPTZ NOT NULL,
    retry_count  INTEGER NOT NULL DEFAULT 0,
    max_retries  INTEGER NOT NULL DEFAULT 5,
    status       VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    error_message TEXT,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_retry_status CHECK (status IN ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED'))
);

CREATE INDEX idx_embedding_retry_pending ON embedding_retry_queue(retry_at)
    WHERE status = 'PENDING';
```

---

### 7.10 Token Limit Exceeded Truncation Cascade [PLANNED]

**Status:** [PLANNED] -- Addresses P1 gap: no pre-flight token count check before sending to LLM.
**Cross-Reference:** Section 3.29.1 (Prompt Composition Algorithm), Section 4.9.1 (AI-TKN-001)

Before sending a prompt to the LLM, the system performs a pre-flight token count check. If `system_prompt + RAG_context + conversation_history + user_message > model_max_tokens`, the following truncation cascade is applied in order. The cascade preserves the most important context (system prompt, user message) and trims the least important (history, RAG) first. [PLANNED]

```mermaid
flowchart TD
    START([Pre-flight token count]) --> CHECK{Total tokens ><br/>model_max_tokens?}
    CHECK -->|No| SEND[Send to LLM]
    CHECK -->|Yes| STEP1

    STEP1["Step 1: Truncate RAG context<br/>(remove lowest-similarity chunks first)"] --> CHECK1{Still over limit?}
    CHECK1 -->|No| SEND
    CHECK1 -->|Yes| STEP2

    STEP2["Step 2: Truncate conversation history<br/>(remove oldest turns first, keep last 2)"] --> CHECK2{Still over limit?}
    CHECK2 -->|No| SEND
    CHECK2 -->|Yes| STEP3

    STEP3["Step 3: Summarize remaining history<br/>(replace N turns with 1 summary)"] --> CHECK3{Still over limit?}
    CHECK3 -->|No| SEND
    CHECK3 -->|Yes| STEP4

    STEP4["Step 4: Truncate user message<br/>(keep first 16,000 chars + '...[truncated]')"] --> CHECK4{Still over limit?}
    CHECK4 -->|No| SEND
    CHECK4 -->|Yes| ERROR[Return AI-TKN-001<br/>422 Unprocessable Entity]
```

**Truncation priority table (lowest priority truncated first):** [PLANNED]

| Priority | Component | Truncation Strategy | Min Retained |
|----------|-----------|---------------------|-------------|
| 1 (trim first) | RAG context | Remove chunks below cosine similarity threshold, then by ascending similarity | 0 chunks (can be fully removed) |
| 2 | Conversation history | Remove oldest turns first | Last 2 turns |
| 3 | History summary | Replace remaining history with LLM-generated 1-sentence summary | 1 summary sentence |
| 4 | User message | Truncate at 16,000 chars with `...[truncated]` suffix | 16,000 chars |
| 5 (never trim) | System prompt | Never truncated | Full prompt |

**Response metadata when truncation occurs:** [PLANNED]

The `ResponseMetadata` schema (Section 4.2) includes additional fields when truncation was applied:

```yaml
# Additional fields in ResponseMetadata when truncation occurs [PLANNED]
truncationApplied:
  type: boolean
  description: "True if any component was truncated before LLM call"
truncationDetails:
  type: object
  properties:
    ragChunksRemoved:
      type: integer
    historyTurnsRemoved:
      type: integer
    messageTruncated:
      type: boolean
```

---

### 7.11 Sub-Orchestrator Failure Propagation [PLANNED]

**Status:** [PLANNED] -- Addresses P1 gap: undefined behavior when a sub-orchestrator fails during task execution.
**Cross-Reference:** Section 7.6 (User Request Through Super Agent Hierarchy), ADR-023 (Hierarchical Architecture), Section 4.9.1 (AI-ORCH-001)

```mermaid
sequenceDiagram
    participant SA as SuperAgent
    participant SubO as SubOrchestrator (PERF)
    participant W1 as Worker A
    participant W2 as Worker B
    participant FallbackSubO as General SubOrchestrator
    participant Audit as Kafka: agent.audit

    SA->>SubO: delegate(task, domain=PERF)

    Note over SubO: Sub-Orchestrator encounters error
    SubO->>W1: execute(subtask-1)
    W1-->>SubO: WorkerResult (success)
    SubO->>W2: execute(subtask-2)
    W2--xSubO: TIMEOUT / 500 Error

    Note over SubO: Failure handling
    SubO->>SubO: Mark W2 task as FAILED
    SubO->>SubO: Cancel all pending workers

    SubO-->>SA: SubOrchestratorFailure{domain=PERF, error=W2_TIMEOUT, completedTasks=1, failedTasks=1}

    Note over SA: SuperAgent retry decision
    SA->>SA: Classify error: TRANSIENT (timeout)
    SA->>SA: Retry attempt 1/2

    SA->>SubO: delegate(task, domain=PERF, retryAttempt=1)
    SubO--xSA: SubOrchestratorFailure (same error)

    SA->>SA: Retry attempt 2/2 FAILED
    SA->>SA: Try failover to General SubOrchestrator
    SA->>FallbackSubO: delegate(task, domain=GENERAL)
    FallbackSubO-->>SA: AggregatedResult (partial)

    SA->>Audit: agent.audit{action=SUB_ORCH_FAILOVER, originalDomain=PERF, failoverDomain=GENERAL, retries=2}
    SA-->>SA: Return partial result to caller
```

**Failure propagation rules:** [PLANNED]

| Error Type | Classification | SuperAgent Action | Max Retries |
|------------|---------------|-------------------|-------------|
| Worker timeout | TRANSIENT | Retry same sub-orchestrator | 2 |
| Worker 500 error | TRANSIENT | Retry same sub-orchestrator | 2 |
| Sub-orchestrator OOM | NON_TRANSIENT | Failover to General sub-orchestrator | 0 |
| Ethics violation | TERMINAL | Fail entire task with ethics error | 0 |
| All retries exhausted | TERMINAL | Failover to General sub-orchestrator; if that also fails, return AI-ORCH-001 | 1 (failover) |

**Worker cancellation on sub-orchestrator failure:** [PLANNED]

When a sub-orchestrator fails, all its pending `worker_tasks` records are set to `status = 'CANCELLED'` with `cancelled_reason = 'SUB_ORCHESTRATOR_FAILED'`. Workers that have already completed are not affected; their results are preserved for potential use in a retry.

---

### 7.12 Conversation Deleted Mid-Stream [PLANNED]

**Status:** [PLANNED] -- Addresses P2 gap: undefined behavior when a conversation is deleted while an SSE stream is active.
**Cross-Reference:** Section 7.8 (Conversation-Level Concurrency Control), Section 4.2 (Agent Chat API)

If an administrator or user deletes a conversation while an SSE stream is active for that conversation, the server detects the deletion and gracefully terminates the stream. [PLANNED]

**Detection mechanism:** The Valkey conversation lock key (`{tenant_id}:conv-lock:{conversation_id}`) is checked periodically (every heartbeat interval, default 15s). If the conversation record no longer exists in the database (detected via cache invalidation event or periodic poll), the stream is terminated.

```mermaid
sequenceDiagram
    participant Client as Streaming Client
    participant AI as AI Service
    participant Valkey as Valkey
    participant DB as PostgreSQL
    participant Admin as Admin Client

    Client->>AI: SSE stream active for conversation C-1
    AI->>AI: Heartbeat tick (every 15s)

    Admin->>DB: DELETE FROM conversations WHERE id = 'C-1'
    Admin->>Valkey: PUBLISH conv-deleted:C-1

    AI->>Valkey: SUBSCRIBE conv-deleted:C-1
    Valkey-->>AI: Deletion event received

    AI-->>Client: SSE event: {type: "error", data: "Conversation has been deleted"}
    AI-->>Client: SSE stream closed
    AI->>Valkey: DEL conv-lock:C-1

    Note over Client: Frontend shows toast:<br/>"This conversation was deleted<br/>by an administrator"
```

---

### 7.13 RAG Zero-Chunk Fallback [PLANNED]

**Status:** [PLANNED] -- Addresses P1 gap: undefined behavior when vector similarity search returns 0 results.
**Cross-Reference:** Section 3.2 (PGVector), Section 3.8 (RAG Search Log), Section 6.10 (Caching Strategy)

When the RAG retrieval step (Step 2: Retrieve in the 7-step pipeline) returns 0 chunks above the similarity threshold, the agent falls back to responding from base model knowledge only. [PLANNED]

```mermaid
sequenceDiagram
    participant Agent as Agent Pipeline (Step 2: Retrieve)
    participant VS as Vector Store (PGVector)
    participant Log as rag_search_log
    participant LLM as LLM Provider

    Agent->>VS: SELECT * FROM vector_store<br/>WHERE tenant_id=:tid<br/>ORDER BY embedding <=> :query_embedding<br/>LIMIT 10
    VS-->>Agent: Results (all below threshold)

    Agent->>Agent: Filter: cosine_similarity > 0.7 (configurable)
    Note over Agent: 0 chunks pass threshold

    Agent->>Log: INSERT INTO rag_search_log<br/>{query, results_count=0, threshold=0.7,<br/>fallback=BASE_KNOWLEDGE}

    Agent->>Agent: Proceed to Step 3 (Plan)<br/>WITHOUT RAG context

    Agent->>LLM: System prompt + user message<br/>(no RAG context section)
    LLM-->>Agent: Response from base knowledge

    Agent-->>Agent: Set metadata: ragContextUsed=false

    Note over Agent: Response includes metadata flag<br/>for frontend indicator
```

**Configurable similarity threshold:** [PLANNED]

The minimum cosine similarity threshold is configurable per agent via the `tool_config` JSONB field on the `workers` table:

```json
{
  "rag": {
    "minSimilarityThreshold": 0.7,
    "maxChunksReturned": 10,
    "fallbackBehavior": "BASE_KNOWLEDGE"
  }
}
```

**Frontend indicator:** When `ragContextUsed: false` is present in the response metadata, the frontend displays a subtle indicator: "Response generated without document context". This helps users understand that the answer may not reflect their organization's proprietary knowledge base. [PLANNED]

---

## 8. Class Diagrams

**Status:** [PLANNED]
**Cross-Reference:** 02-Tech-Spec Sections 3.1-3.12

### 8.1 BaseAgent Hierarchy

```mermaid
classDiagram
    class BaseAgent {
        <<abstract>>
        #ModelRouter modelRouter
        #ToolRegistry toolRegistry
        #SkillService skillService
        #ConversationMemory conversationMemory
        #VectorMemory vectorMemory
        #TraceLogger traceLogger
        #SelfReflection selfReflection
        +process(AgentRequest) AgentResponse
        #getAgentType()* String
        #getActiveSkillId(AgentRequest)* String
        #getMaxTurns()* int
        #shouldReflect(AgentRequest)* boolean
        #estimateComplexity(AgentRequest) ComplexityLevel
        #buildSystemPrompt(ResolvedSkill, AgentRequest) String
        #handleError(Exception, AgentRequest) AgentResponse
    }

    class DataAnalystAgent {
        -String defaultSkillId
        +getAgentType() String
        +getActiveSkillId(AgentRequest) String
        +getMaxTurns() int
        +shouldReflect(AgentRequest) boolean
    }

    class CustomerSupportAgent {
        -String defaultSkillId
        +getAgentType() String
        +getActiveSkillId(AgentRequest) String
        +getMaxTurns() int
        +shouldReflect(AgentRequest) boolean
    }

    class CodeReviewerAgent {
        -String defaultSkillId
        +getAgentType() String
        +getActiveSkillId(AgentRequest) String
        +getMaxTurns() int
        +shouldReflect(AgentRequest) boolean
    }

    class DocumentProcessorAgent {
        -String defaultSkillId
        +getAgentType() String
        +getActiveSkillId(AgentRequest) String
        +getMaxTurns() int
        +shouldReflect(AgentRequest) boolean
    }

    class OrchestratorAgent {
        -RequestPipeline pipeline
        +getAgentType() String
        +orchestrate(PipelineRequest) PipelineResponse
    }

    BaseAgent <|-- DataAnalystAgent
    BaseAgent <|-- CustomerSupportAgent
    BaseAgent <|-- CodeReviewerAgent
    BaseAgent <|-- DocumentProcessorAgent
    BaseAgent <|-- OrchestratorAgent

    BaseAgent --> ModelRouter
    BaseAgent --> ToolRegistry
    BaseAgent --> SkillService
    BaseAgent --> TraceLogger
```

### 8.2 Request Pipeline Components

```mermaid
classDiagram
    class RequestPipeline {
        -ModelRouter modelRouter
        -RagService ragService
        -SkillService skillService
        -ValidationService validationService
        -ExplanationService explanationService
        -TraceLogger traceLogger
        +execute(PipelineRequest) PipelineResponse
        -intake(PipelineRequest) ClassifiedRequest
        -plan(ClassifiedRequest, RetrievalContext) ExecutionPlan
        -execute(ExecutionPlan, RetrievalContext) AgentResponse
        -retry(ExecutionPlan, RetrievalContext, ValidationResult) AgentResponse
    }

    class PipelineRequest {
        +String message
        +String tenantId
        +String userId
        +String agentType
        +String skillId
        +Map~String,Object~ context
    }

    class PipelineResponse {
        +String content
        +String businessExplanation
        +String technicalDetail
        +List~Artifact~ artifacts
        +ValidationResult validation
        +ResponseMetadata metadata
    }

    class ClassifiedRequest {
        +String taskType
        +ComplexityLevel complexity
        +String domain
        +String normalizedInput
        +Map~String,String~ extractedParams
    }

    class ExecutionPlan {
        +String skillId
        +String agentType
        +List~String~ plannedSteps
        +List~String~ toolSequence
        +List~ValidationRule~ validationRules
        +boolean requiresApproval
        +adjustForValidationFailures(List~ValidationIssue~) void
    }

    class RetrievalContext {
        +List~Document~ documents
        +double maxRelevanceScore
        +int documentCount
    }

    RequestPipeline --> PipelineRequest
    RequestPipeline --> PipelineResponse
    RequestPipeline --> ClassifiedRequest
    RequestPipeline --> ExecutionPlan
    RequestPipeline --> RetrievalContext
    RequestPipeline --> ModelRouter
    RequestPipeline --> RagService
    RequestPipeline --> ValidationService
    RequestPipeline --> ExplanationService
```

### 8.3 Skill and Tool System

```mermaid
classDiagram
    class SkillDefinition {
        +UUID id
        +String skillKey
        +String name
        +String semanticVersion
        +UUID tenantId
        +String systemPrompt
        +List~String~ toolSet
        +List~String~ knowledgeScopes
        +String behavioralRules
        +String fewShotExamples
        +UUID parentSkillId
        +boolean active
        +Long version
        +Instant createdAt
        +Instant updatedAt
    }

    class SkillService {
        -SkillRepository skillRepository
        -ToolRegistry toolRegistry
        -VectorStoreService vectorStore
        +resolve(String skillId) ResolvedSkill
        +resolveForTask(AgentRequest) List~ResolvedSkill~
        +create(SkillDefinition) SkillDefinition
        +activate(String id) void
        +runTestSuite(String id, List~TestCase~) SkillTestResult
    }

    class ResolvedSkill {
        +String id
        +String systemPrompt
        +List~FunctionCallback~ tools
        +VectorStoreRetriever knowledgeRetriever
        +List~BehavioralRule~ rules
        +List~Example~ examples
    }

    class ToolRegistry {
        -Map~String,FunctionCallback~ staticTools
        -DynamicToolStore dynamicToolStore
        +resolve(List~String~ toolNames) List~FunctionCallback~
    }

    class ToolExecutor {
        -CircuitBreakerRegistry circuitBreakerRegistry
        -TraceLogger traceLogger
        +execute(String toolName, String arguments) String
    }

    class DynamicToolStore {
        -ToolRegistrationRepository repository
        +register(ToolDefinition def) void
        +exists(String name) boolean
        +get(String name) FunctionCallback
        +listAll() List~ToolDefinition~
    }

    class ToolRegistration {
        +UUID id
        +UUID tenantId
        +String name
        +String description
        +String toolType
        +JsonNode parameterSchema
        +JsonNode returnSchema
        +String endpointUrl
        +String httpMethod
        +String semanticVersion
        +boolean active
    }

    SkillService --> SkillDefinition
    SkillService --> ResolvedSkill
    SkillService --> ToolRegistry
    ToolRegistry --> DynamicToolStore
    ToolExecutor --> ToolRegistry
    DynamicToolStore --> ToolRegistration
    SkillDefinition "0..1" --> SkillDefinition : parentSkillId
```

### 8.4 Validation Service Chain

```mermaid
classDiagram
    class ValidationService {
        -List~ValidationRule~ globalRules
        -TestRunner testRunner
        -ApprovalService approvalService
        +validate(AgentResponse, List~ValidationRule~) ValidationResult
        -mergeRules(List~ValidationRule~, List~ValidationRule~) List~ValidationRule~
    }

    class ValidationRule {
        <<interface>>
        +check(AgentResponse response) boolean
        +toIssue(AgentResponse response) ValidationIssue
        +getRuleName() String
        +getSeverity() Severity
    }

    class PathScopeRule {
        -List~String~ allowedPaths
        +check(AgentResponse) boolean
    }

    class DataAccessRule {
        -List~String~ allowedTables
        -List~String~ blockedOperations
        +check(AgentResponse) boolean
    }

    class FormatRule {
        -String expectedFormat
        -JsonSchema schema
        +check(AgentResponse) boolean
    }

    class PIIRedactionRule {
        -List~Pattern~ piiPatterns
        +check(AgentResponse) boolean
    }

    class ValidationResult {
        +boolean passed
        +List~ValidationIssue~ issues
    }

    class ValidationIssue {
        +String ruleName
        +Severity severity
        +String description
        +String suggestedFix
    }

    class TestRunner {
        +run(List~CodeArtifact~ artifacts) TestResult
    }

    class ApprovalService {
        +requestApproval(AgentResponse response) ApprovalStatus
    }

    ValidationService --> ValidationRule
    ValidationService --> TestRunner
    ValidationService --> ApprovalService
    ValidationService --> ValidationResult
    ValidationResult --> ValidationIssue

    ValidationRule <|.. PathScopeRule
    ValidationRule <|.. DataAccessRule
    ValidationRule <|.. FormatRule
    ValidationRule <|.. PIIRedactionRule
```

### 8.5 TraceLogger and AgentTrace

```mermaid
classDiagram
    class TraceLogger {
        -KafkaTemplate~String,AgentTrace~ kafkaTemplate
        +startTrace(AgentRequest, String agentType) TraceContext
        +publish(AgentTrace trace) void
        +recordPipeline(ClassifiedRequest, RetrievalContext, ExecutionPlan, AgentResponse, ValidationResult, Explanation) void
    }

    class TraceContext {
        -AgentRequest request
        -String agentType
        -Instant startTime
        -List~ToolCallTrace~ toolCalls
        -List~PipelineStepTrace~ pipelineSteps
        +success(AgentResponse response) void
        +failure(Exception error) void
        +setSkillId(String skillId) void
        +addToolCall(ToolCallTrace call) void
        +addPipelineStep(PipelineStepTrace step) void
        +toAgentTrace() AgentTrace
    }

    class AgentTrace {
        +String traceId
        +UUID tenantId
        +String agentType
        +String skillId
        +String modelUsed
        +String requestContent
        +String responseContent
        +String taskType
        +ComplexityLevel complexityLevel
        +float confidenceScore
        +int turnsUsed
        +long latencyMs
        +long tokenCountInput
        +long tokenCountOutput
        +String pipelineRunId
        +String status
        +String errorMessage
        +List~ToolCallTrace~ toolCalls
        +List~PipelineStepTrace~ pipelineSteps
        +Instant createdAt
    }

    class ToolCallTrace {
        +String toolName
        +String arguments
        +String result
        +long latencyMs
        +boolean success
        +int sequenceOrder
        +Instant calledAt
    }

    class PipelineStepTrace {
        +String stepName
        +long durationMs
        +String inputSummary
        +String outputSummary
        +String status
        +int sequenceOrder
    }

    TraceLogger --> TraceContext
    TraceLogger --> AgentTrace
    TraceContext --> AgentTrace : toAgentTrace()
    AgentTrace "1" --> "*" ToolCallTrace
    AgentTrace "1" --> "*" PipelineStepTrace
```

### 8.6 Model Router

```mermaid
classDiagram
    class ModelRouter {
        -ChatClient orchestratorClient
        -ChatClient workerClient
        -ChatClient claudeClient
        -ChatClient codexClient
        -ComplexityEstimator complexityEstimator
        -String orchestratorModel
        -String workerModel
        -double cloudThreshold
        +route(ComplexityLevel, TaskType) ChatClient
        +selectPlan(ClassifiedRequest, RetrievalContext) ExecutionPlan
        +generateExplanation(String prompt) String
        +fallback(String agentType, Exception) ChatClient
        -isOrchestrationTask(TaskType) boolean
    }

    class ComplexityEstimator {
        +estimate(AgentRequest) ComplexityLevel
    }

    class ComplexityLevel {
        <<enumeration>>
        SIMPLE
        MODERATE
        COMPLEX
        CODE_SPECIFIC
    }

    class TaskType {
        <<enumeration>>
        PLANNING
        ROUTING
        EXPLAINING
        EXECUTION
        CODE
        DATA
        DOCUMENT
    }

    ModelRouter --> ComplexityEstimator
    ModelRouter --> ComplexityLevel
    ModelRouter --> TaskType
```

### 8.7 Learning Pipeline Classes

```mermaid
classDiagram
    class TrainingOrchestrator {
        -TrainingDataService trainingDataService
        -SFTTrainer sftTrainer
        -DPOTrainer dpoTrainer
        -RagUpdater ragUpdater
        -ModelEvaluator evaluator
        -OllamaModelService ollamaService
        +dailyRetraining() void
        +weeklyDeepTraining() void
        +onDemandTraining(TrainingConfig) TrainingJob
    }

    class TrainingDataService {
        -TraceStore traceStore
        -CorrectionStore correctionStore
        -PatternStore patternStore
        -DocumentStore documentStore
        -TeacherService teacherService
        +buildDataset(String agentType, TrainingConfig) TrainingDataset
    }

    class TrainingDataset {
        -List~TrainingExample~ sftExamples
        -List~PreferencePair~ preferencePairs
        -List~TrainingExample~ knowledgeDerived
        -List~TrainingExample~ syntheticExamples
        +addSFTExamples(List~TrainingExample~) void
        +addPreferencePairs(List~PreferencePair~) void
        +applyRecencyWeighting(double decayFactor) void
        +sortByComplexity() void
        +identifyGaps() List~String~
    }

    class TeacherService {
        -ChatClient claudeClient
        -ChatClient codexClient
        +fillGaps(List~String~ weakAreas, int limit) List~TrainingExample~
        +evaluate(AgentTrace) QualityScore
        +generatePreferencePair(String task) PreferencePair
    }

    class ModelEvaluator {
        +benchmark(String modelPath, TestSet) EvalResult
        +compare(String candidateModel, String baselineModel) ComparisonResult
    }

    class OllamaModelService {
        +deployModel(String modelPath, String version) void
        +rollback(String previousVersion) void
        +getCurrentModel() String
    }

    class TrainingConfig {
        +String agentType
        +int traceLimit
        +Duration lookbackPeriod
        +int syntheticLimit
        +double decayFactor
        +boolean useCurriculum
        +daily() TrainingConfig$
        +weekly() TrainingConfig$
    }

    TrainingOrchestrator --> TrainingDataService
    TrainingOrchestrator --> ModelEvaluator
    TrainingOrchestrator --> OllamaModelService
    TrainingDataService --> TrainingDataset
    TrainingDataService --> TeacherService
    TrainingOrchestrator ..> TrainingConfig
```

---

## Appendix A: Service Port Allocation

| Service | Port | Category |
|---------|------|----------|
| eureka-server | 8761 | Infrastructure |
| config-server | 8888 | Infrastructure |
| api-gateway | 8080 | Infrastructure |
| agent-orchestrator | 8090 | Agent |
| agent-data-analyst | 8091 | Agent |
| agent-customer-support | 8092 | Agent |
| agent-code-reviewer | 8093 | Agent |
| agent-document-processor | 8094 | Agent |
| trace-collector | 8095 | Learning |
| feedback-service | 8096 | Learning |
| teacher-service | 8097 | Learning |
| training-data-service | 8098 | Learning |
| training-orchestrator | 8099 | Learning |
| model-evaluator | 8100 | Learning |

## Appendix B: Technology Stack Summary

| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| Runtime | Java | 21 (LTS) | Application runtime |
| Framework | Spring Boot | 3.4.1 | Microservice framework |
| Cloud | Spring Cloud | 2024.0.0 | Service discovery, config, gateway |
| AI | Spring AI | 1.0.0 | LLM integration (Ollama, Claude, OpenAI) |
| Database | PostgreSQL | 16+ | Relational data store |
| Vector DB | PGVector | 0.7.4+ | Embedding storage for RAG |
| Cache | Valkey | 8+ | Session cache, rate limiting |
| Messaging | Apache Kafka | 3.7+ | Inter-service async communication |
| LLM Runtime | Ollama | Latest | Local model serving |
| Service Discovery | Netflix Eureka | Via Spring Cloud | Service registry |
| Circuit Breaker | Resilience4j | Via Spring Cloud | Fault tolerance |
| Migration | Flyway | 10.21+ | Database schema versioning |
| Build | Maven | 3.9+ | Multi-module build |
| Container | Docker | Latest | Service containerization |

## Appendix C: Cross-Reference Matrix

| LLD Section | PRD Section | Tech-Spec Section | Epic/Story |
|-------------|-------------|-------------------|------------|
| 1. Maven Config | 2.2 | 1.1, 2 | US-1.1 to US-1.5 |
| 2. App Config | 2.2 | 7.1, 7.2 | US-1.2, US-1.3 |
| 3. DB Schema (3.1-3.5) | 3.4, 3.5, 4.1-4.5 | 3.7, 3.12, 4.1-4.5 | US-2.3, US-4.1, US-5.1 |
| 3.6 Pipeline Runs | 3.9 | 3.9 | R1 (validation) |
| 3.7 Agent Artifacts | 3.5 | 4.1 | R2 (validation) |
| 3.8 RAG Search Log | 3.4 | 3.12 | R3 (validation) |
| 3.9 RAG Chunking Config | 3.4 | 3.12 | R4, R15 (validation) |
| 3.10 Agent Templates | 3.3 | 3.5 | Agent Builder vision |
| 3.11 Audit Events | 3.8 (Audit) | 3.18 (AuditService) | P0: Enterprise audit log |
| 3.12 Publish Submissions | 3.3 | 3.16 (AgentBuilderService) | P1: Gallery publish review |
| 3.13 Knowledge Sources | 3.4 | 3.20 (KnowledgeSourceService) | P1: RAG knowledge management |
| 3.14 Notifications | 3.8 | 3.19 (NotificationService) | P1: Notification center |
| 3.15 Agent Lifecycle States | 3.3, 3.8 | 3.16 (AgentBuilderService) | P0: Soft delete + publish workflow |
| 4. API Contracts (4.1-4.9) | 3.1-3.7 | 8.1-8.7 | US-2.1, US-3.1, US-4.1, US-11.1 |
| 5. Kafka Topics (5.1-5.5) | 2.2 | 6 | US-1.4, US-5.1 |
| 6. Security (6.1-6.6) | 7.1, 7.2 | 1.2 | US-1.5, US-13.1 |
| 6.7 Prompt Injection Defense | 7.3 | 3.10 | R8 (validation), US-10.1 |
| 6.8 Pre-Cloud Sanitization | 7.4 | 3.11 | R10 (validation), US-10.3 |
| 6.9 Data Retention | 7.4 | -- | R11 (validation), US-10.4 |
| 6.10 Redis Caching Strategy | -- | -- | R12 (validation) |
| 3.16 Super Agents | -- | 3.22 (SuperAgentService) | ADR-023: Hierarchical architecture |
| 3.17 Sub-Orchestrators | -- | 3.23 (SubOrchestratorService) | ADR-023: Tier 2 domain delegation |
| 3.18 Workers | -- | 3.24 (WorkerService) | ADR-023: Tier 3 task execution |
| 3.19 Agent Maturity Scores | -- | 3.25 (AgentMaturityService) | ADR-024: ATS 5-dimension scoring |
| 3.20 ATS Score History | -- | 3.25 (AgentMaturityService) | ADR-024: Score time-series tracking |
| 3.21 Worker Drafts | -- | 3.26 (DraftSandboxService) | ADR-028: Sandbox draft lifecycle |
| 3.22 Draft Reviews | -- | 3.26 (DraftSandboxService) | ADR-028: Review workflow |
| 3.23 Approval Checkpoints | -- | 3.29 (HITLService) | ADR-030: Risk-maturity HITL matrix |
| 3.24 Event Triggers | -- | 3.28 (EventTriggerService) | ADR-025: Event-driven activation |
| 3.25 Event Schedules | -- | 3.28 (EventTriggerService) | ADR-025: Time-based triggers |
| 3.26 Ethics Policies | -- | 3.30 (EthicsPolicyEngine) | ADR-027: Platform ethics baseline |
| 3.27 Conduct Policies | -- | 3.30 (EthicsPolicyEngine) | ADR-027: Tenant conduct extensions |
| 3.28 Policy Violations | -- | 3.30 (EthicsPolicyEngine) | ADR-027: Violation tracking |
| 3.29 Prompt Blocks | -- | 3.27 (DynamicPromptComposer) | ADR-029: Modular prompt composition |
| 3.30 Benchmark Metrics | -- | 3.31 (CrossTenantBenchmarkService) | ADR-026: Anonymized cross-tenant benchmarks |
| 3.31 Agent Skills | -- | 3.24 (WorkerService), 3.27 (DynamicPromptComposer) | BA entity #7: Skill composition primitive |
| 3.32 Knowledge Items | -- | 3.20 (KnowledgeSourceService) | BA entity #9: KnowledgeScope RAG access |
| 3.33 Skill Assessments | -- | 3.25 (AgentMaturityService) | ADR-024: Per-skill ATS dimension scoring |
| 3.34 Learning Records | -- | 3.25 (AgentMaturityService), 3.9 (training) | ADR-024: Continuous learning feedback loop |
| 3.35 Traceability Matrix | -- | -- | SA-09: BA-to-LLD 35-entity mapping |
| 3.20b Worker Tasks | -- | 3.24 (WorkerService) | ADR-028: Worker task queue |
| 3.23b Event Sources | -- | 3.28 (EventTriggerService) | ADR-025: Event source registration |
| 4. API Contracts (4.1-4.9) | 3.1-3.7 | 8.1-8.7 | US-2.1, US-3.1, US-4.1, US-11.1 |
| 4.10 Super Agent API | -- | 3.22 (SuperAgentService) | ADR-023: Super agent management |
| 4.11 Sub-Orchestrator API | -- | 3.23 (SubOrchestratorService) | ADR-023: Orchestrator CRUD |
| 4.12 Worker API | -- | 3.24 (WorkerService) | ADR-023, ADR-028: Worker execution |
| 4.13 Maturity API | -- | 3.25 (AgentMaturityService) | ADR-024: ATS scoring and promotion |
| 4.14 Draft Sandbox API | -- | 3.26 (DraftSandboxService) | ADR-028: Draft review workflow |
| 4.15 Approval API | -- | 3.29 (HITLService) | ADR-030: HITL approval gates |
| 4.15.1 HITL Escalation Chain | -- | 3.29 (HITLService) | ADR-030: Escalation levels, timeout config, PLATFORM_ADMIN override |
| 4.16 Event Triggers API | -- | 3.28 (EventTriggerService) | ADR-025: Trigger CRUD + test fire |
| 4.17 Ethics API | -- | 3.30 (EthicsPolicyEngine) | ADR-027: Policy + violation management |
| 4.18 Benchmarks API | -- | 3.31 (CrossTenantBenchmarkService) | ADR-026: Anonymized comparison |
| 4.19 Super Agent Errors | -- | -- | Error codes for sections 4.10-4.18 |
| 4.19.1 Cross-Tenant Errors | -- | 6.13 (CrossTenantBoundaryService) | AI-CT-001 through AI-CT-010: Master tenant cross-tenant operations |
| 4.20 Export Endpoints | -- | -- | QA-AC-001: Hierarchy PDF + maturity CSV export |
| 5. Kafka Topics (5.1-5.5) | 2.2 | 6 | US-1.4, US-5.1; Super Agent topics: agent.events.entity_lifecycle (ADR-025), agent.events.scheduled (ADR-025), agent.audit (ADR-027), ethics.policy.updated (ADR-027) |
| 6. Security (6.1-6.6) | 7.1, 7.2 | 1.2 | US-1.5, US-13.1 |
| 6.7 Prompt Injection Defense | 7.3 | 3.10 | R8 (validation), US-10.1 |
| 6.8 Pre-Cloud Sanitization | 7.4 | 3.11 | R10 (validation), US-10.3 |
| 6.9 Data Retention | 7.4 | -- | R11 (validation), US-10.4 |
| 6.10 Redis Caching Strategy | -- | -- | R12 (validation) |
| 6.11 Agent-Level Security | -- | -- | ADR-023, ADR-024: Maturity-based authorization |
| 6.12 Agent-to-Agent Auth | -- | -- | ADR-023: Inter-agent JWT |
| 6.13 Cross-Tenant Boundaries | -- | -- | ADR-026: Schema-per-tenant enforcement |
| 6.14 Ethics Enforcement Pipeline | -- | -- | ADR-027: Policy evaluation in pipeline |
| 6.14.6 STRIDE Threat Model | -- | -- | SEC-F01: Ethics engine threat analysis |
| 6.14.7 EU AI Act Art. 52 | -- | -- | SEC-F09: Transparency compliance |
| 6.15 Multi-Agent Prompt Injection | -- | -- | ADR-029: Prompt block isolation |
| 6.16 PII Sanitization (Agent) | -- | -- | ADR-029: Agent pipeline PII scrubbing |
| 7. Data Flows (7.1-7.4) | 3.1, 4.1-4.5 | 3.9, 4.1-4.5 | US-11.1, US-5.1, US-4.2 |
| 7.5 Event-Driven Activation | -- | 3.26, 3.28, 3.29 | ADR-025, ADR-028, ADR-030 |
| 7.6 User Request Hierarchy | -- | 3.22, 3.23, 3.24, 3.27 | ADR-023, ADR-024, ADR-029 |
| 7.7 Scheduled Trigger | -- | 3.28 | ADR-025: TIME_BASED trigger flow |
| 7.8 Conversation Concurrency | -- | -- | P0: Per-conversation Valkey mutex, optimistic locking |
| 7.9 Embedding Circuit Breaker | -- | -- | P0: Resilience4j circuit breaker for embedding API |
| 7.10 Token Truncation Cascade | -- | 3.27 (DynamicPromptComposer) | P1: Pre-flight token count with priority truncation |
| 7.11 Sub-Orchestrator Failure | -- | 3.22, 3.23 | P1: Retry + failover propagation logic |
| 7.12 Conversation Deleted Mid-Stream | -- | -- | P2: Graceful SSE termination on deletion |
| 7.13 RAG Zero-Chunk Fallback | -- | 3.20 (KnowledgeSourceService) | P1: Base-knowledge fallback when RAG returns 0 chunks |
| 3.13.1 Knowledge Source Error States | -- | 3.20 (KnowledgeSourceService) | P1: FAILED_EXTRACTION/FAILED_EMBEDDING refined lifecycle |
| 3.19.1 ATS Minimum Data | -- | 3.25 (AgentMaturityService) | P2: Statistical minimum before ATS evaluation |
| 3.19.2 Maturity Cooldown | -- | 3.25 (AgentMaturityService) | P2: 7d promotion / 3d demotion cooldown |
| 3.19.3 ATS Score Precision | -- | 3.25 (AgentMaturityService) | P2: NUMERIC(5,2) with HALF_UP rounding |
| 3.23c Trigger Event Queue | -- | 3.28 (EventTriggerService) | P1: Agent-busy event queuing with DLQ |
| 3.24.1 CDC Event Debounce | -- | 3.28 (EventTriggerService) | P1: 5s Valkey coalescing window |
| 3.24.2 Agent Busy Fallback | -- | 3.28 (EventTriggerService) | P1: Queuing when agent at max concurrency |
| 3.30.2 Benchmark Outlier Detection | -- | 3.31 (CrossTenantBenchmarkService) | P2: p5/p95 outlier suppression |
| 4.9.1 Edge Case Error Codes | -- | -- | P0-P2: 10 new error codes from elite team audit |
| 4.15.2 Agent Name Uniqueness | -- | -- | P2: UNIQUE(name, tenant_id) constraint |
| 4.15.3 Agent Deletion Cascade | -- | -- | P2: Soft delete with orphan handling |
| 6.10.1 SSE Missed-Event Recovery | -- | -- | P1: Last-Event-Id replay with sse_event_buffer |
| 6.13.6 Schema Creation Failure | -- | -- | P0: Provisioning compensation workflow |
| 6.13.7 Flyway Migration Recovery | -- | -- | P1: Tenant schema migration failure handling |
| 6.14.8 Ethics Fail-Closed | -- | 3.30 (EthicsPolicyEngine) | P0: Fail-closed default with FAIL_OPEN_WITH_AUDIT option |
| 8. Class Diagrams | 3.2, 3.4, 3.5, 3.6 | 3.1-3.12 | US-2.1, US-2.2, US-2.3, US-11.1 |
