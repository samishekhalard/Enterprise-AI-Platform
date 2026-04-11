# Technical Specification: AI Agent Platform

**Product Name:** [PRODUCT_NAME]
**Version:** 1.0
**Date:** March 5, 2026
**Status:** Implementation Baseline

**Scope of Baseline:** This is the implementation baseline for the AI platform stream; existing EMSIST `ai-service` may be partially aligned.

---

## 1. Technology Stack

**Conformance Note:** This specification defines phased implementation alignment. Existing runtime components may remain on legacy patterns during migration windows while preserving API compatibility.

### 1.1 Core Framework

| Layer | Technology | Version |
|-------|-----------|---------|
| Runtime | Java 21 (LTS) | 21+ |
| Framework | Spring Boot | 3.3+ |
| Cloud | Spring Cloud | 2024.x |
| AI Integration | Spring AI | 1.0+ |
| Build | Gradle or Maven | Latest |
| Containerization | Docker + Docker Compose | Latest |
| Orchestration | Kubernetes (production) | 1.28+ |

### 1.2 Spring Cloud Components

| Component | Implementation | Config Key |
|-----------|---------------|------------|
| Service Discovery | spring-cloud-starter-netflix-eureka-client | `eureka.client.service-url` |
| Config Server | spring-cloud-config-server (Git backend) | `spring.cloud.config.server.git.uri` |
| API Gateway | spring-cloud-starter-gateway | `spring.cloud.gateway.routes` |
| Circuit Breaker | spring-cloud-starter-circuitbreaker-resilience4j | `resilience4j.circuitbreaker` |
| Load Balancer | spring-cloud-starter-loadbalancer | Automatic with Eureka |

### 1.3 Spring AI Model Providers

| Provider | Dependency | Config Key |
|----------|-----------|------------|
| Ollama (local) | spring-ai-ollama-spring-boot-starter | `spring.ai.ollama.*` |
| Anthropic (Claude) | spring-ai-anthropic-spring-boot-starter | `spring.ai.anthropic.*` |
| OpenAI (Codex) | spring-ai-openai-spring-boot-starter | `spring.ai.openai.*` |
| Google (Gemini) | spring-ai-vertex-ai-gemini-spring-boot-starter | `spring.ai.vertex.ai.*` |

### 1.4 Data Stores

| Store | Technology | Purpose |
|-------|-----------|---------|
| Relational DB | PostgreSQL 16 | Agent traces, feedback, metadata |
| Vector Store | PGVector (via Spring AI) | RAG embeddings, learning materials |
| Message Broker | Apache Kafka 3.7 | Inter-agent messaging, event streaming |
| Cache | Redis 7 | Session memory, conversation context |
| Object Storage | MinIO / S3 | Training artifacts, model files |

---

## 2. Project Structure

```
agent-platform/
├── infrastructure/
│   ├── eureka-server/              # Service discovery
│   ├── config-server/              # Centralized configuration
│   ├── api-gateway/                # Spring Cloud Gateway
│   └── docker-compose.yml          # Local development stack
│
├── libraries/
│   └── agent-common/               # Shared agent framework
│       ├── src/main/java/
│       │   ├── agent/
│       │   │   ├── BaseAgent.java
│       │   │   ├── AgentRequest.java
│       │   │   ├── AgentResponse.java
│       │   │   └── ReactLoop.java
│       │   ├── model/
│       │   │   ├── ModelRouter.java
│       │   │   ├── ModelConfig.java
│       │   │   └── ComplexityEstimator.java
│       │   ├── tools/
│       │   │   ├── ToolRegistry.java
│       │   │   ├── ToolExecutor.java
│       │   │   └── ToolDefinition.java
│       │   ├── memory/
│       │   │   ├── ConversationMemory.java
│       │   │   ├── VectorMemory.java
│       │   │   └── ScratchpadMemory.java
│       │   ├── reasoning/
│       │   │   ├── SelfReflection.java
│       │   │   ├── ChainOfThought.java
│       │   │   └── MultiAgentDebate.java
│       │   └── trace/
│       │       ├── TraceLogger.java
│       │       ├── AgentTrace.java
│       │       └── TraceKafkaProducer.java
│       └── build.gradle
│
├── agents/
│   ├── agent-orchestrator/         # Task routing and coordination
│   ├── agent-data-analyst/         # SQL, charts, data analysis
│   ├── agent-customer-support/     # Tickets, knowledge base
│   ├── agent-code-reviewer/        # Code analysis, security
│   └── agent-document-processor/   # Document parsing, summarization
│
├── learning/
│   ├── trace-collector/            # Kafka consumer, stores traces
│   ├── feedback-service/           # Ingests all feedback types
│   ├── teacher-service/            # Claude/Codex teacher pipeline
│   ├── training-data-service/      # Unified dataset builder
│   ├── training-orchestrator/      # Coordinates learning cycles
│   └── model-evaluator/            # Benchmarking and quality gates
│
├── data-ingestion/
│   ├── pattern-service/            # Business patterns and rules
│   ├── material-service/           # Learning materials ingestion
│   └── document-processor/         # Chunking, embedding pipeline
│
├── docs/
│   ├── 01-PRD-AI-Agent-Platform.md
│   ├── 02-Technical-Specification.md
│   ├── 03-Epics-and-User-Stories.md
│   ├── architecture/
│   │   └── diagrams/
│   └── runbooks/
│
└── scripts/
    ├── setup-local.sh
    ├── deploy.sh
    └── training/
        ├── prepare-sft-data.py
        ├── run-sft.py
        ├── run-dpo.py
        └── evaluate-model.py
```

---

## 3. Agent Common Library

### 3.1 BaseAgent

```java
@Component
public abstract class BaseAgent {

    protected final ModelRouter modelRouter;
    protected final ToolRegistry toolRegistry;
    protected final ConversationMemory conversationMemory;
    protected final VectorMemory vectorMemory;
    protected final TraceLogger traceLogger;
    protected final SelfReflection selfReflection;

    public AgentResponse process(AgentRequest request) {
        TraceContext trace = traceLogger.startTrace(request, getAgentType());

        try {
            // Select model based on task complexity
            ChatClient client = modelRouter.route(
                estimateComplexity(request), TaskType.EXECUTION
            );

            // Get tools available for this agent's skill set
            List<FunctionCallback> tools = toolRegistry.resolve(getSkillSet());

            // Build system prompt with patterns and knowledge
            String systemPrompt = buildSystemPrompt(request);

            // Execute ReAct loop
            AgentResponse response = reactLoop.execute(
                client, systemPrompt, request, tools, getMaxTurns()
            );

            // Optional self-reflection for complex tasks
            if (shouldReflect(request)) {
                response = selfReflection.verify(client, request, response);
            }

            trace.success(response);
            return response;

        } catch (Exception e) {
            trace.failure(e);
            return handleError(e, request);
        }
    }

    protected abstract String getAgentType();
    protected abstract List<String> getSkillSet();
    protected abstract int getMaxTurns();
    protected abstract boolean shouldReflect(AgentRequest request);
}
```

### 3.2 Model Router (Two-Model Architecture)

The ModelRouter supports a two-model local architecture where smaller orchestrator models handle routing/planning and larger worker models handle execution:

```java
@Service
public class ModelRouter {

    private final ChatClient orchestratorClient;    // ~8B model for routing, planning, explaining
    private final ChatClient workerClient;          // ~24B model for execution
    private final ChatClient claudeClient;          // Cloud teacher/fallback
    private final ChatClient codexClient;           // Cloud teacher/fallback
    private final ComplexityEstimator complexityEstimator;

    @Value("${agent.models.orchestrator.model:llama3.1:8b}")
    private String orchestratorModel;

    @Value("${agent.models.worker.model:devstral-small:24b}")
    private String workerModel;

    @Value("${agent.routing.cloud-threshold:0.7}")
    private double cloudThreshold;

    // Route to appropriate model based on task type
    public ChatClient route(ComplexityLevel level, TaskType taskType) {
        // Orchestration tasks (planning, routing, explaining) use smaller orchestrator model
        if (isOrchestrationTask(taskType)) {
            return orchestratorClient;
        }

        // Execution tasks use worker model or cloud based on complexity
        return switch (level) {
            case SIMPLE, MODERATE -> workerClient;
            case COMPLEX -> claudeClient;
            case CODE_SPECIFIC -> codexClient;
        };
    }

    private boolean isOrchestrationTask(TaskType taskType) {
        return taskType == TaskType.PLANNING
            || taskType == TaskType.ROUTING
            || taskType == TaskType.EXPLAINING;
    }

    // Plan generation is always orchestrator-owned
    public ExecutionPlan selectPlan(ClassifiedRequest classified, RetrievalContext context) {
        return orchestratorClient.prompt()
            .system("Generate a structured execution plan")
            .user(formatPlanPrompt(classified, context))
            .call()
            .entity(ExecutionPlan.class);
    }

    // Explanation generation is always orchestrator-owned
    public String generateExplanation(String prompt) {
        return orchestratorClient.prompt()
            .system("Generate business and technical explanation")
            .user(prompt)
            .call()
            .content();
    }

    private String formatPlanPrompt(ClassifiedRequest classified, RetrievalContext context) {
        return String.format("Classified request: %s\nContext: %s", classified, context);
    }

    // Fallback: if local models fail or confidence is low, escalate to cloud
    public ChatClient fallback(String agentType, Exception originalError) {
        log.warn("Local models failed for {}, escalating to Claude", agentType);
        return claudeClient;
    }
}

enum TaskType {
    PLANNING, ROUTING, EXPLAINING, EXECUTION, CODE, DATA, DOCUMENT
}
```

#### 3.2.1 ModelRouter Interface Contract

The following methods are normative and referenced by Sections 3.8 and 3.9:

```java
public ChatClient route(ComplexityLevel level, TaskType taskType);
public ExecutionPlan selectPlan(ClassifiedRequest classified, RetrievalContext context);
public String generateExplanation(String prompt);
public ChatClient fallback(String agentType, Exception originalError);
```

### 3.3 ReAct Loop

```java
@Component
public class ReactLoop {

    public AgentResponse execute(
        ChatClient client,
        String systemPrompt,
        AgentRequest request,
        List<FunctionCallback> tools,
        int maxTurns
    ) {
        List<Message> messages = new ArrayList<>();
        messages.add(new SystemMessage(systemPrompt));
        messages.add(new UserMessage(request.getContent()));

        for (int turn = 0; turn < maxTurns; turn++) {
            ChatResponse response = client.prompt()
                .messages(messages)
                .functions(tools)
                .call()
                .chatResponse();

            AssistantMessage assistant = response.getResult().getOutput();
            messages.add(assistant);

            // If model called tools, execute them and continue loop
            if (assistant.hasToolCalls()) {
                for (ToolCall call : assistant.getToolCalls()) {
                    String result = toolExecutor.execute(
                        call.name(), call.arguments()
                    );
                    messages.add(new ToolResponseMessage(call.id(), result));
                }
            } else {
                // No tool calls = final answer
                return AgentResponse.builder()
                    .content(assistant.getContent())
                    .messages(messages)
                    .turnsUsed(turn + 1)
                    .build();
            }
        }

        return AgentResponse.maxTurnsReached(messages);
    }
}
```

### 3.4 Tool Registry and Execution

```java
@Service
public class ToolRegistry {

    private final Map<String, FunctionCallback> staticTools;
    private final DynamicToolStore dynamicToolStore;

    // Resolve tools for a skill set (static + dynamic)
    public List<FunctionCallback> resolve(List<String> toolNames) {
        List<FunctionCallback> resolved = new ArrayList<>();

        for (String name : toolNames) {
            // Check static (Spring bean) tools first
            if (staticTools.containsKey(name)) {
                resolved.add(staticTools.get(name));
            }
            // Then check dynamically registered tools
            else if (dynamicToolStore.exists(name)) {
                resolved.add(dynamicToolStore.get(name));
            }
        }
        return resolved;
    }

    // Static tools registered as Spring beans
    @Bean
    @Description("Execute SQL query against the data warehouse")
    public Function<SqlRequest, SqlResponse> runSql(DataWarehouseService dw) {
        return request -> dw.execute(request.query(), request.limit());
    }

    @Bean
    @Description("Search the internal knowledge base by keyword or semantic query")
    public Function<SearchRequest, SearchResponse> searchKb(KnowledgeBaseService kb) {
        return request -> kb.search(request.query(), request.topK());
    }

    // Agent-as-Tool: one agent callable by another
    @Bean
    @Description("Ask the data analyst agent to answer a data question")
    public Function<AgentToolRequest, AgentToolResponse> askDataAnalyst(
        @Qualifier("dataAnalystAgent") BaseAgent dataAnalyst
    ) {
        return request -> {
            AgentResponse response = dataAnalyst.process(
                AgentRequest.fromToolCall(request.question())
            );
            return new AgentToolResponse(response.getContent());
        };
    }
}
```

### 3.5 Tool Execution Engine

```java
@Service
public class ToolExecutor {

    private final CircuitBreakerRegistry circuitBreakerRegistry;
    private final TraceLogger traceLogger;

    public String execute(String toolName, String arguments) {
        CircuitBreaker cb = circuitBreakerRegistry.circuitBreaker(toolName);

        ToolTrace trace = traceLogger.startToolTrace(toolName, arguments);

        try {
            String result = cb.executeSupplier(() -> {
                FunctionCallback tool = toolRegistry.get(toolName);
                return tool.call(arguments);
            });
            trace.success(result);
            return result;

        } catch (TimeoutException e) {
            trace.timeout();
            return "{\"error\": \"Tool '" + toolName + "' timed out\"}";
        } catch (Exception e) {
            trace.failure(e);
            return "{\"error\": \"Tool '" + toolName + "' failed: " + e.getMessage() + "\"}";
        }
    }
}
```

### 3.6 Dynamic Tool Registration API

```java
@RestController
@RequestMapping("/api/tools")
public class DynamicToolController {

    private final DynamicToolStore dynamicToolStore;

    // Register a new tool at runtime (no redeploy needed)
    @PostMapping
    public ResponseEntity<ToolDefinition> registerTool(@RequestBody ToolDefinition def) {
        // def contains: name, description, parameterSchema, endpoint (URL or script path)
        dynamicToolStore.register(def);
        return ResponseEntity.created(URI.create("/api/tools/" + def.getName())).body(def);
    }

    // Register a webhook as a tool
    @PostMapping("/webhook")
    public ResponseEntity<ToolDefinition> registerWebhook(@RequestBody WebhookToolRequest req) {
        ToolDefinition def = ToolDefinition.builder()
            .name(req.getName())
            .description(req.getDescription())
            .parameterSchema(req.getParameterSchema())
            .executor(new WebhookToolExecutor(req.getWebhookUrl(), req.getMethod()))
            .build();
        dynamicToolStore.register(def);
        return ResponseEntity.created(URI.create("/api/tools/" + def.getName())).body(def);
    }

    // Create a composite tool from existing tools
    @PostMapping("/composite")
    public ResponseEntity<ToolDefinition> createComposite(@RequestBody CompositeToolRequest req) {
        // req contains: name, description, steps (ordered list of tool calls with data mapping)
        ToolDefinition def = compositeToolBuilder.build(req);
        dynamicToolStore.register(def);
        return ResponseEntity.created(URI.create("/api/tools/" + def.getName())).body(def);
    }

    @GetMapping
    public List<ToolDefinition> listTools() {
        return dynamicToolStore.listAll();
    }
}
```

### 3.7 Skills Framework Implementation

```java
// Skill definition stored in config/database
@Entity
@Table(name = "skills")
public class SkillDefinition {

    @Id
    private String id;                    // e.g., "data-analysis-v2"
    private String name;                  // Human-readable name
    private String version;               // Semantic version
    private String tenantId;              // For multi-tenant isolation

    @Column(columnDefinition = "TEXT")
    private String systemPrompt;          // Instructions for the agent

    @ElementCollection
    private List<String> toolSet;         // Tool names available for this skill

    @ElementCollection
    private List<String> knowledgeScopes; // Vector store collections to include

    @Column(columnDefinition = "TEXT")
    private String behavioralRules;       // JSON: guardrails and constraints

    @Column(columnDefinition = "TEXT")
    private String fewShotExamples;       // JSON: input/output example pairs

    private String parentSkillId;         // For skill inheritance
    private boolean active;
}

@Service
public class SkillService {

    private final SkillRepository skillRepository;
    private final ToolRegistry toolRegistry;
    private final VectorStoreService vectorStore;

    // Resolve a skill into a ready-to-use agent configuration
    public ResolvedSkill resolve(String skillId) {
        SkillDefinition def = skillRepository.findActiveById(skillId)
            .orElseThrow(() -> new SkillNotFoundException(skillId));

        // Handle skill inheritance
        if (def.getParentSkillId() != null) {
            SkillDefinition parent = skillRepository.findActiveById(def.getParentSkillId())
                .orElseThrow();
            def = mergeWithParent(def, parent);
        }

        return ResolvedSkill.builder()
            .systemPrompt(buildFullPrompt(def))
            .tools(toolRegistry.resolve(def.getToolSet()))
            .knowledgeRetriever(vectorStore.retrieverFor(def.getKnowledgeScopes()))
            .rules(parseRules(def.getBehavioralRules()))
            .examples(parseExamples(def.getFewShotExamples()))
            .build();
    }

    private String buildFullPrompt(SkillDefinition def) {
        StringBuilder prompt = new StringBuilder();
        prompt.append(def.getSystemPrompt()).append("\n\n");

        // Add behavioral rules
        if (def.getBehavioralRules() != null) {
            prompt.append("## Rules\n").append(def.getBehavioralRules()).append("\n\n");
        }

        // Add few-shot examples
        if (def.getFewShotExamples() != null) {
            prompt.append("## Examples\n").append(def.getFewShotExamples()).append("\n");
        }

        return prompt.toString();
    }

    // Dynamic skill assignment: orchestrator picks skills per request
    public List<ResolvedSkill> resolveForTask(AgentRequest request) {
        List<SkillDefinition> matching = skillRepository.findMatchingSkills(
            request.getClassification(), request.getDomain()
        );
        return matching.stream().map(s -> resolve(s.getId())).toList();
    }
}

// Skill management API for domain experts
@RestController
@RequestMapping("/api/skills")
public class SkillController {

    @PostMapping
    public ResponseEntity<SkillDefinition> createSkill(@RequestBody SkillDefinition skill) {
        skill.setVersion("1.0.0");
        skill.setActive(false); // starts inactive until tested
        SkillDefinition saved = skillService.create(skill);
        return ResponseEntity.created(URI.create("/api/skills/" + saved.getId())).body(saved);
    }

    @PostMapping("/{id}/activate")
    public ResponseEntity<Void> activateSkill(@PathVariable String id) {
        skillService.activate(id);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{id}/test")
    public SkillTestResult testSkill(@PathVariable String id, @RequestBody List<TestCase> cases) {
        return skillService.runTestSuite(id, cases);
    }

    @GetMapping
    public List<SkillDefinition> listSkills(
        @RequestParam(required = false) String agentType,
        @RequestParam(required = false) Boolean active
    ) {
        return skillService.list(agentType, active);
    }
}
```

### 3.8 Updated BaseAgent with Skills Integration

```java
@Component
public abstract class BaseAgent {

    protected final ModelRouter modelRouter;
    protected final ToolRegistry toolRegistry;
    protected final SkillService skillService;
    protected final ConversationMemory conversationMemory;
    protected final VectorMemory vectorMemory;
    protected final TraceLogger traceLogger;
    protected final SelfReflection selfReflection;

    public AgentResponse process(AgentRequest request) {
        TraceContext trace = traceLogger.startTrace(request, getAgentType());

        try {
            // Resolve skill(s) for this request
            ResolvedSkill skill = skillService.resolve(getActiveSkillId(request));

            // Select model based on task complexity
            ChatClient client = modelRouter.route(
                estimateComplexity(request), TaskType.EXECUTION
            );

            // Build system prompt from skill definition + RAG context
            String systemPrompt = buildSystemPrompt(skill, request);

            // Execute ReAct loop with skill's tool set
            AgentResponse response = reactLoop.execute(
                client, systemPrompt, request, skill.getTools(), getMaxTurns()
            );

            // Optional self-reflection for complex tasks
            if (shouldReflect(request)) {
                response = selfReflection.verify(client, request, response);
            }

            trace.success(response);
            trace.setSkillId(skill.getId());
            return response;

        } catch (Exception e) {
            trace.failure(e);
            return handleError(e, request);
        }
    }

    protected abstract String getAgentType();
    protected abstract String getActiveSkillId(AgentRequest request);
    protected abstract int getMaxTurns();
    protected abstract boolean shouldReflect(AgentRequest request);
}
```

### 3.9 Request Pipeline (7-Step Formal Pipeline)

The Request Pipeline implements a formal 7-step execution flow where BaseAgent, ReactLoop, ToolRegistry, SkillService, and Training Pipeline all operate within the Execute step:

```java
@Service
public class RequestPipeline {

    private final ModelRouter modelRouter;
    private final RagService ragService;
    private final SkillService skillService;
    private final ValidationService validationService;
    private final ExplanationService explanationService;
    private final TraceLogger traceLogger;

    public PipelineResponse execute(PipelineRequest request) {
        // Step 1: Intake — classify and normalize the request
        ClassifiedRequest classified = intake(request);

        // Step 2: Retrieve — tenant-safe RAG to gather context
        RetrievalContext context = ragService.retrieve(
            classified, request.getTenantId());

        // Step 3: Plan — orchestrator model selects profile and creates execution plan
        ExecutionPlan plan = plan(classified, context);

        // Step 4: Execute — worker model runs through ReAct loop (BaseAgent, ReactLoop, ToolRegistry operate here)
        AgentResponse rawResponse = execute(plan, context);

        // Step 5: Validate — deterministic checks (business rules, security, compliance)
        ValidationResult validation = validationService.validate(
            rawResponse, plan.getValidationRules());
        if (!validation.passed()) {
            rawResponse = retry(plan, context, validation);
        }

        // Step 6: Explain — orchestrator generates business-facing explanations
        Explanation explanation = explanationService.generate(
            classified, rawResponse, plan);

        // Step 7: Record — log everything for observability and learning
        traceLogger.recordPipeline(classified, context, plan,
            rawResponse, validation, explanation);

        return PipelineResponse.builder()
            .content(rawResponse.getContent())
            .businessExplanation(explanation.getBusinessSummary())
            .technicalDetail(explanation.getTechnicalDetail())
            .artifacts(rawResponse.getArtifacts())
            .validation(validation)
            .build();
    }

    private ClassifiedRequest intake(PipelineRequest request) {
        // Normalize input, classify by type, determine domain and complexity
        return new ClassifiedRequest(request);
    }

    private ExecutionPlan plan(ClassifiedRequest classified, RetrievalContext context) {
        // Orchestrator model chooses: which skill, which tools, which validation rules
        return modelRouter.selectPlan(classified, context);
    }

    private AgentResponse execute(ExecutionPlan plan, RetrievalContext context) {
        // Delegate to BaseAgent/ReactLoop with skill's tools
        // This is where the main agent reasoning loop operates
        ResolvedSkill skill = skillService.resolve(plan.getSkillId());
        BaseAgent agent = getAgentForSkill(skill);
        return agent.process(AgentRequest.fromPlan(plan, context));
    }

    private AgentResponse retry(ExecutionPlan plan, RetrievalContext context,
                                ValidationResult validation) {
        // If validation failed, adjust plan and retry
        plan.adjustForValidationFailures(validation.getIssues());
        // Adaptive retry policy:
        // default max retries = 2, upper bound = 3 when skill risk profile allows
        return execute(plan, context);
    }
}
```

### 3.10 Validation Service (Deterministic Validation Layer)

```java
@Service
public class ValidationService {

    private final List<ValidationRule> globalRules;
    private final TestRunner testRunner;
    private final ApprovalService approvalService;

    public ValidationResult validate(AgentResponse response, List<ValidationRule> taskRules) {
        List<ValidationIssue> issues = new ArrayList<>();

        // Backend rules: path scope, data access, format, business logic
        for (ValidationRule rule : mergeRules(globalRules, taskRules)) {
            if (!rule.check(response)) {
                issues.add(rule.toIssue(response));
            }
        }

        // Test suites for generated code artifacts
        if (response.hasCodeArtifacts()) {
            TestResult testResult = testRunner.run(response.getCodeArtifacts());
            if (!testResult.allPassed()) {
                issues.add(ValidationIssue.testFailure(testResult));
            }
        }

        // Approval workflow for high-impact actions (data deletion, access grants, etc.)
        if (response.requiresApproval()) {
            ApprovalStatus status = approvalService.requestApproval(response);
            if (status != ApprovalStatus.APPROVED) {
                issues.add(ValidationIssue.approvalRequired(status));
            }
        }

        return new ValidationResult(issues.isEmpty(), issues);
    }
}
```

### 3.11 Explanation Service

The Explanation Service uses the orchestrator model to generate human-readable explanations of agent actions:

```java
@Service
public class ExplanationService {

    private final ChatClient orchestratorClient;
    private final static String EXPLANATION_SYSTEM_PROMPT = """
        You are an expert at explaining technical decisions in business terms.
        Given an agent's action and the context, generate:
        1. A brief business summary (1-2 sentences)
        2. Technical details for developers
        3. A list of artifacts created
        """;

    public Explanation generate(ClassifiedRequest request,
                                AgentResponse response,
                                ExecutionPlan plan) {
        String prompt = buildExplanationPrompt(request, response, plan);

        String explanation = orchestratorClient.prompt()
            .system(EXPLANATION_SYSTEM_PROMPT)
            .user(prompt)
            .call()
            .content();

        return Explanation.parse(explanation);
        // Returns: businessSummary, technicalDetail, artifactList
    }

    private String buildExplanationPrompt(ClassifiedRequest request,
                                         AgentResponse response,
                                         ExecutionPlan plan) {
        return String.format("""
            Request: %s
            Plan: %s
            Response: %s
            Explain what was done and why.
            """, request.getClassification(), plan.getName(), response.getContent());
    }
}
```

### 3.12 Tenant Context Isolation

```java
@Service
public class TenantContextService {

    private final VectorStoreService vectorStore;
    private final SkillRepository skillRepository;

    // Tenant-safe retrieval: only returns documents tagged with tenant's namespace
    public List<Document> retrieveForTenant(String query, String tenantId, int topK) {
        return vectorStore.search(query, topK,
            MetadataFilter.where("tenantId").eq(tenantId));
    }

    // Tenant-scoped skill resolution: global skills + tenant-specific overrides
    public List<SkillDefinition> getSkillsForTenant(String tenantId) {
        return skillRepository.findByTenantIdOrGlobal(tenantId);
    }

    // Tenant profile: custom configuration per tenant
    @Entity
    @Table(name = "tenant_profiles")
    public static class TenantProfile {
        @Id
        private String tenantId;
        private String namespace;           // Vector store namespace
        private List<String> allowedTools;  // Tool whitelist
        private List<String> allowedSkills; // Skill allowlist
        private String dataClassification;  // How to handle tenant data
    }
}
```

---

## 4. Learning Pipeline

### 4.1 Trace Collection

```java
@Component
public class TraceLogger {

    private final KafkaTemplate<String, AgentTrace> kafkaTemplate;

    public TraceContext startTrace(AgentRequest request, String agentType) {
        return new TraceContext(request, agentType, Instant.now());
    }

    // Called on completion — publishes to Kafka for async processing
    public void publish(AgentTrace trace) {
        kafkaTemplate.send("agent-traces", trace.getTraceId(), trace);
    }
}

// Trace Collector Service (Kafka Consumer)
@Service
public class TraceCollectorService {

    @KafkaListener(topics = "agent-traces", groupId = "trace-collector")
    public void collectTrace(AgentTrace trace) {
        traceRepository.save(trace);
        metricsService.recordTrace(trace);

        // Auto-flag low-confidence interactions for review
        if (trace.getConfidenceScore() < confidenceThreshold) {
            reviewQueue.add(trace);
        }
    }
}
```

### 4.2 Feedback Ingestion Service

```java
@RestController
@RequestMapping("/api/feedback")
public class FeedbackController {

    // User rates an agent response (thumbs up/down or 1-5 stars)
    @PostMapping("/rating")
    public ResponseEntity<Void> submitRating(@RequestBody UserRating rating) {
        ratingRepository.save(rating);

        if (rating.isNegative()) {
            retrainingQueue.add(rating.getTraceId());
            kafkaTemplate.send("feedback-signals",
                FeedbackSignal.negative(rating));
        } else {
            kafkaTemplate.send("feedback-signals",
                FeedbackSignal.positive(rating));
        }
        return ResponseEntity.ok().build();
    }

    // User provides an explicit correction
    @PostMapping("/correction")
    public ResponseEntity<Void> submitCorrection(@RequestBody UserCorrection correction) {
        correctionRepository.save(correction);
        // Corrections are gold-standard training data — highest priority
        kafkaTemplate.send("training-data-priority",
            TrainingExample.fromCorrection(correction));
        return ResponseEntity.ok().build();
    }
}

// Customer feedback from external systems (CRM, support platform)
@Service
public class CustomerFeedbackIngestion {

    @KafkaListener(topics = "customer-feedback")
    public void processCustomerFeedback(CustomerFeedback feedback) {
        TrainingSignal signal = feedbackMapper.mapToSignal(feedback);
        trainingDataStore.addSignal(signal);
    }
}

// Business pattern injection by domain experts
@RestController
@RequestMapping("/api/patterns")
public class PatternController {

    @PostMapping
    public ResponseEntity<Pattern> addPattern(@RequestBody BusinessPattern pattern) {
        Pattern saved = patternRepository.save(pattern);

        // Expand pattern into multiple training examples
        List<TrainingExample> examples = patternExpander.expand(pattern);
        trainingDataStore.addExamples(examples);

        return ResponseEntity.created(URI.create("/api/patterns/" + saved.getId()))
            .body(saved);
    }
}

// Learning material ingestion
@Service
public class MaterialIngestionService {

    @KafkaListener(topics = "knowledge-updates")
    public void processNewMaterial(LearningMaterial material) {
        // Chunk and embed for RAG
        List<Document> chunks = documentProcessor.chunkAndEmbed(material);
        vectorStore.add(chunks);

        // Generate Q&A pairs for fine-tuning
        List<TrainingExample> qaPairs = qaGenerator.generateFromDocument(material);
        trainingDataStore.addExamples(qaPairs);
    }
}
```

### 4.3 Training Data Service

```java
@Service
public class TrainingDataService {

    public TrainingDataset buildDataset(String agentType, TrainingConfig config) {
        TrainingDataset dataset = new TrainingDataset();

        // Source 1: User-rated agent traces (SFT)
        List<AgentTrace> positiveTraces = traceStore.getByRating(
            agentType, Rating.POSITIVE, config.getTraceLimit());
        dataset.addSFTExamples(convertToSFT(positiveTraces));

        // Source 2: User corrections (highest priority SFT)
        List<UserCorrection> corrections = correctionStore.getRecent(
            agentType, config.getLookbackPeriod());
        dataset.addSFTExamples(convertCorrectionsToSFT(corrections));

        // Source 3: Business patterns (SFT)
        List<Pattern> patterns = patternStore.getForAgent(agentType);
        dataset.addSFTExamples(expandPatterns(patterns));

        // Source 4: Preference pairs from ratings (DPO)
        List<AgentTrace> posTraces = traceStore.getByRating(agentType, Rating.POSITIVE);
        List<AgentTrace> negTraces = traceStore.getByRating(agentType, Rating.NEGATIVE);
        dataset.addPreferencePairs(buildPairs(posTraces, negTraces));

        // Source 5: Learning materials (knowledge grounding)
        List<Document> materials = documentStore.getMaterials(agentType);
        dataset.addKnowledgeDerived(generateQA(materials));

        // Source 6: Teacher-generated examples (fill gaps)
        List<String> weakAreas = dataset.identifyGaps();
        if (!weakAreas.isEmpty()) {
            List<TrainingExample> synthetic = teacherService.fillGaps(
                weakAreas, config.getSyntheticLimit());
            dataset.addSyntheticExamples(synthetic);
        }

        // Apply recency weighting — recent data counts more
        dataset.applyRecencyWeighting(config.getDecayFactor());

        // Apply curriculum ordering if requested
        if (config.useCurriculum()) {
            dataset.sortByComplexity();
        }

        return dataset;
    }
}
```

### 4.4 Teacher Service

```java
@Service
public class TeacherService {

    private final ChatClient claudeClient;
    private final ChatClient codexClient;

    // Generate synthetic training examples for weak areas
    public List<TrainingExample> fillGaps(List<String> weakAreas, int limit) {
        return weakAreas.stream()
            .flatMap(area -> generateForArea(area, limit / weakAreas.size()).stream())
            .toList();
    }

    // Score a local agent's output using Claude as judge
    public QualityScore evaluate(AgentTrace trace) {
        String evaluation = claudeClient.prompt()
            .system(EVALUATION_PROMPT)
            .user(trace.toEvaluationFormat())
            .call()
            .content();
        return QualityScore.parse(evaluation);
    }

    // Generate preference pairs: Claude (good) vs Ollama (potentially weak)
    public PreferencePair generatePreferencePair(String task) {
        String claudeResponse = claudeClient.prompt().user(task).call().content();
        String ollamaResponse = ollamaClient.prompt().user(task).call().content();

        // Have Claude judge which is better
        String judgment = claudeClient.prompt()
            .system("Compare these two responses. Which is better and why?")
            .user("Task: " + task + "\nA: " + claudeResponse + "\nB: " + ollamaResponse)
            .call()
            .content();

        return new PreferencePair(task, claudeResponse, ollamaResponse, judgment);
    }
}
```

### 4.5 Training Orchestrator

```java
@Service
public class TrainingOrchestrator {

    // Daily: retrain on accumulated feedback
    @Scheduled(cron = "0 0 2 * * *")
    public void dailyRetraining() {
        log.info("Starting daily retraining cycle");

        TrainingDataset dataset = trainingDataService.buildDataset("all",
            TrainingConfig.daily());

        // Run SFT
        SFTResult sftResult = sftTrainer.train(dataset.getSFTExamples());

        // Run DPO
        DPOResult dpoResult = dpoTrainer.train(dataset.getPreferencePairs());

        // Update RAG
        ragUpdater.refreshVectorStore(dataset.getKnowledgeDerived());

        // Evaluate new model against current production model
        EvalResult eval = evaluator.benchmark(sftResult.getModelPath(), testSet);

        if (eval.betterThan(currentProductionModel)) {
            ollamaService.deployModel(sftResult.getModelPath(), nextVersion());
            notificationService.notify("New model deployed: " + nextVersion());
        } else {
            log.warn("New model did not pass quality gate. Skipping deployment.");
            notificationService.notify("Training completed but model not deployed — "
                + "quality score: " + eval.getScore());
        }
    }

    // Weekly: deep training with teacher augmentation
    @Scheduled(cron = "0 0 4 * * SUN")
    public void weeklyDeepTraining() {
        // Identify systematic weaknesses
        List<WeakArea> gaps = analyzer.findWeaknesses(
            traceStore.getLastWeek());

        // Teacher-generated targeted training
        List<TrainingExample> targeted = teacherService.fillGaps(
            gaps.stream().map(WeakArea::getDescription).toList(), 500);

        // Full curriculum training
        TrainingDataset fullDataset = trainingDataService.buildDataset("all",
            TrainingConfig.weekly().withCurriculum(true));
        fullDataset.addSyntheticExamples(targeted);

        curriculumTrainer.train(fullDataset);
    }
}
```

---

## 5. Fine-Tuning Infrastructure

### 5.1 SFT Pipeline

Training data is formatted for the target model and fine-tuned using LoRA adapters:

```python
# scripts/training/run-sft.py
from unsloth import FastLanguageModel
from trl import SFTTrainer
from datasets import load_dataset

model, tokenizer = FastLanguageModel.from_pretrained(
    "meta-llama/Llama-3.1-8B-Instruct", load_in_4bit=True
)
model = FastLanguageModel.get_peft_model(model, r=16, lora_alpha=16)

dataset = load_dataset("json", data_files="training_data/sft_examples.jsonl")

trainer = SFTTrainer(
    model=model,
    tokenizer=tokenizer,
    train_dataset=dataset["train"],
    max_seq_length=4096,
    num_train_epochs=3,
)
trainer.train()

# Export and import to Ollama
model.save_pretrained_merged("models/agent-v{version}", tokenizer)
# Then: ollama create agent-v{version} -f Modelfile
```

### 5.2 DPO Pipeline

```python
# scripts/training/run-dpo.py
from trl import DPOTrainer, DPOConfig
from datasets import load_dataset

config = DPOConfig(
    beta=0.1,
    learning_rate=5e-7,
    num_train_epochs=1,
    per_device_train_batch_size=4,
)

dataset = load_dataset("json", data_files="training_data/preference_pairs.jsonl")

trainer = DPOTrainer(
    model=model,
    ref_model=ref_model,
    args=config,
    train_dataset=dataset["train"],
    tokenizer=tokenizer,
)
trainer.train()
```

### 5.3 RLHF Pipeline

```python
# scripts/training/run-rlhf.py
# Reward model training + PPO optimization
from trl import RewardTrainer, PPOTrainer, PPOConfig
from datasets import load_dataset

# Step 1: Train reward model from human ratings
reward_dataset = load_dataset("json", data_files="training_data/reward_data.jsonl")
# Each example: {"prompt": ..., "chosen": ..., "rejected": ..., "score_chosen": 4.5, "score_rejected": 2.1}

reward_trainer = RewardTrainer(
    model=reward_model,
    train_dataset=reward_dataset["train"],
    tokenizer=tokenizer,
)
reward_trainer.train()

# Step 2: PPO optimization using reward model
ppo_config = PPOConfig(
    learning_rate=1e-6,
    batch_size=16,
    mini_batch_size=4,
)

ppo_trainer = PPOTrainer(
    model=model,
    ref_model=ref_model,
    config=ppo_config,
    tokenizer=tokenizer,
    dataset=prompts_dataset,
    reward_model=reward_model,
)
ppo_trainer.train()
```

### 5.4 Contrastive Learning Pipeline

```python
# scripts/training/run-contrastive.py
# Improve embeddings for better RAG retrieval
from sentence_transformers import SentenceTransformer, InputExample, losses

model = SentenceTransformer("all-MiniLM-L6-v2")

# Build training pairs from user feedback:
# - Positive pairs: query + document that led to good answer
# - Negative pairs: query + document that led to bad answer
train_examples = []
for trace in positive_traces:
    train_examples.append(InputExample(
        texts=[trace.query, trace.retrieved_doc],
        label=1.0  # similar
    ))
for trace in negative_traces:
    train_examples.append(InputExample(
        texts=[trace.query, trace.retrieved_doc],
        label=0.0  # dissimilar
    ))

train_dataloader = DataLoader(train_examples, shuffle=True, batch_size=32)
train_loss = losses.CosineSimilarityLoss(model)

model.fit(
    train_objectives=[(train_dataloader, train_loss)],
    epochs=3,
    output_path="models/embeddings-v{version}"
)
```

### 5.5 Self-Supervised Domain Pre-training

```python
# scripts/training/run-domain-pretrain.py
# Continue pre-training on domain-specific text
from transformers import AutoModelForCausalLM, TrainingArguments, Trainer
from datasets import load_dataset

# Collect domain text: internal docs, emails, reports, knowledge base
dataset = load_dataset("text", data_files={
    "train": "training_data/domain_corpus/*.txt"
})

training_args = TrainingArguments(
    output_dir="models/domain-pretrained",
    num_train_epochs=1,
    per_device_train_batch_size=4,
    learning_rate=2e-5,
    warmup_steps=500,
    save_steps=1000,
)

trainer = Trainer(
    model=model,
    args=training_args,
    train_dataset=tokenized_dataset,
)
trainer.train()
# Then run SFT on top of this domain-adapted model
```

### 5.6 Semi-Supervised Learning

```java
// Java orchestration for semi-supervised learning
@Service
public class SemiSupervisedTrainer {

    // Pseudo-labeling: use confident model predictions as training data
    public List<TrainingExample> generatePseudoLabels(
        List<String> unlabeledInputs, double confidenceThreshold
    ) {
        List<TrainingExample> pseudoLabeled = new ArrayList<>();

        for (String input : unlabeledInputs) {
            AgentResponse response = agent.process(AgentRequest.of(input));

            if (response.getConfidenceScore() > confidenceThreshold) {
                pseudoLabeled.add(TrainingExample.builder()
                    .input(input)
                    .output(response.getContent())
                    .source("pseudo-label")
                    .confidence(response.getConfidenceScore())
                    .build());
            }
        }
        return pseudoLabeled;
    }

    // Combine real labeled data + pseudo-labeled data for training
    @Scheduled(cron = "0 0 3 1 * *") // Monthly
    public void semiSupervisedCycle() {
        List<TrainingExample> labeled = trainingDataStore.getLabeledExamples();
        List<String> unlabeled = trainingDataStore.getUnlabeledInputs(10000);

        List<TrainingExample> pseudoLabeled = generatePseudoLabels(unlabeled, 0.9);

        // Combine with lower weight on pseudo-labels
        TrainingDataset dataset = new TrainingDataset();
        dataset.addExamples(labeled, 1.0);       // full weight
        dataset.addExamples(pseudoLabeled, 0.5);  // half weight

        sftTrainer.train(dataset);
    }
}
```

### 5.7 Meta-Learning Service

```java
// Meta-learning: train agents to adapt quickly to new tasks
@Service
public class MetaLearningService {

    // MAML-style: prepare model to be good at fine-tuning
    // Generates "task families" from different domains
    public void trainMetaLearner() {
        List<TaskFamily> families = taskFamilyGenerator.generate();
        // Each family: data-analysis tasks, customer-support tasks, etc.

        for (TaskFamily family : families) {
            // Inner loop: fine-tune on small support set from this family
            Model adapted = innerLoopAdapt(baseModel, family.getSupportSet());

            // Outer loop: evaluate on query set, update base model
            Loss loss = evaluate(adapted, family.getQuerySet());
            baseModel.updateMetaGradients(loss);
        }

        // Result: a base model that can adapt to NEW task families with very few examples
        ollamaService.deployModel(baseModel, "meta-" + version);
    }

    // When a new domain/skill is introduced, rapid adaptation
    public Model rapidAdapt(String newSkillId, List<TrainingExample> fewExamples) {
        // Only needs 5-20 examples to adapt to a new skill
        ResolvedSkill skill = skillService.resolve(newSkillId);
        return innerLoopAdapt(metaModel, fewExamples);
    }
}
```

### 5.8 Federated Learning Coordinator

```java
// Federated learning: train across departments without sharing raw data
@Service
public class FederatedLearningCoordinator {

    // Each department runs local training and shares only model updates
    @Scheduled(cron = "0 0 4 1 * *") // Monthly
    public void federatedTrainingRound() {
        Model globalModel = ollamaService.getCurrentModel();

        List<ModelUpdate> localUpdates = new ArrayList<>();

        for (Department dept : departmentRegistry.getParticipating()) {
            // Each department trains on their LOCAL data
            // Only gradient updates are sent back — never raw data
            ModelUpdate update = dept.getTrainingClient().trainLocal(
                globalModel.getWeights(),
                dept.getLocalDataConfig()
            );
            localUpdates.add(update);
        }

        // Aggregate updates using federated averaging
        Model updatedGlobal = federatedAveraging(globalModel, localUpdates);

        // Evaluate and deploy
        EvalResult eval = evaluator.benchmark(updatedGlobal, testSet);
        if (eval.betterThan(globalModel)) {
            ollamaService.deployModel(updatedGlobal, "federated-" + version);
        }
    }
}
```

### 5.9 Ollama Model Deployment

```bash
# Modelfile for importing fine-tuned model
FROM ./models/agent-v{version}
SYSTEM "You are a specialized agent for [PRODUCT_NAME]..."
PARAMETER temperature 0.7
PARAMETER num_ctx 4096
```

```java
// Java service to manage Ollama model lifecycle
@Service
public class OllamaModelService {

    public void deployModel(String modelPath, String version) {
        // Create Modelfile
        String modelfile = generateModelfile(modelPath, version);
        Files.writeString(Path.of("Modelfile"), modelfile);

        // Import to Ollama
        processRunner.run("ollama", "create",
            "agent-" + version, "-f", "Modelfile");

        // Update Spring AI config to point to new model
        configService.update("spring.ai.ollama.chat.model", "agent-" + version);
    }

    public void rollback(String previousVersion) {
        configService.update("spring.ai.ollama.chat.model",
            "agent-" + previousVersion);
    }
}
```

---

## 6. Kafka Topic Design

| Topic | Producer | Consumer | Purpose |
|-------|----------|----------|---------|
| `agent-traces` | All agents | trace-collector | Interaction logging |
| `feedback-signals` | feedback-service | training-data-service | Ratings, corrections |
| `customer-feedback` | External CRM/support | feedback-service | Customer satisfaction data |
| `knowledge-updates` | material-service | document-processor | New learning materials |
| `training-data-priority` | feedback-service | training-orchestrator | High-priority corrections |
| `agent-tasks` | orchestrator | Specialist agents | Task routing |
| `agent-results` | Specialist agents | orchestrator | Task results |
| `model-events` | training-orchestrator | All agents | Model version updates |

---

## 7. Configuration Management

### 7.1 Spring Cloud Config Structure

```
config-repo/
├── application.yml              # Shared defaults
├── agent-orchestrator.yml       # Orchestrator-specific
├── agent-data-analyst.yml       # Data analyst agent config
├── agent-customer-support.yml   # Customer support agent config
├── training-orchestrator.yml    # Training schedule and thresholds
├── model-routing.yml            # Model routing rules
├── pipeline.yml                 # Pipeline policy and step controls
└── tenant-config.yml            # Tenant namespace and isolation settings
```

### 7.2 Key Configuration Properties

```yaml
# application.yml (shared)
spring:
  ai:
    ollama:
      base-url: http://localhost:11434
    anthropic:
      api-key: ${ANTHROPIC_API_KEY}
      chat:
        model: claude-sonnet-4-5-20250929
    openai:
      api-key: ${OPENAI_API_KEY}
      chat:
        model: gpt-4

agent:
  # Two-model local architecture
  models:
    orchestrator:
      model: "llama3.1:8b"
      temperature: 0.3
      num-ctx: 4096
    worker:
      model: "devstral-small:24b"  # example; model-agnostic role binding
      temperature: 0.7
      num-ctx: 8192

  # Request pipeline configuration
  pipeline:
    validation-enabled: true
    explanation-enabled: true
    max-retries-on-validation-failure: 2
    max-retries-upper-bound: 3
    skill-retry-override-enabled: true

  # Routing and model selection
  routing:
    cloud-threshold: 0.7
    default-model: worker
    fallback-model: claude

  # React loop settings
  react-loop:
    max-turns: 10
    self-reflection: true

  # Tenant and multi-tenancy
  tenant:
    isolation-enabled: true
    default-namespace: "global"

  # Training configuration
  training:
    daily-cron: "0 0 2 * * *"
    weekly-cron: "0 0 4 * * SUN"
    quality-gate-threshold: 0.85
    recency-decay-factor: 0.95
```

---

## 8. API Endpoints

### 8.1 Agent API (via Gateway)

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/agents/{type}/chat` | Send message to specific agent |
| POST | `/api/agents/orchestrate` | Let orchestrator route the task |
| GET | `/api/agents/{type}/status` | Agent health and stats |

### 8.2 Request Pipeline API

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/pipeline/execute` | Execute full 7-step pipeline |
| GET | `/api/pipeline/{runId}/status` | Get pipeline run status |
| GET | `/api/pipeline/{runId}/explanation` | Get explanation for a pipeline run |

### 8.3 Validation API

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/validation/rules` | Add validation rule |
| GET | `/api/validation/rules` | List validation rules |
| POST | `/api/validation/validate` | Validate an agent response |

### 8.4 Tenant Management API

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/tenants/{id}/namespace` | Configure tenant namespace |
| GET | `/api/tenants/{id}/skills` | Get tenant's available skills |
| GET | `/api/tenants/{id}/profile` | Get tenant profile and settings |

### 8.5 Feedback API

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/feedback/rating` | Submit thumbs up/down or star rating |
| POST | `/api/feedback/correction` | Submit explicit correction |
| GET | `/api/feedback/stats` | Feedback statistics |

### 8.6 Knowledge Management API

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/patterns` | Add business pattern |
| PUT | `/api/patterns/{id}` | Update pattern |
| POST | `/api/materials` | Upload learning material |
| GET | `/api/materials` | List materials |

### 8.7 Training API

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/training/trigger` | Trigger on-demand training |
| GET | `/api/training/status` | Current training job status |
| GET | `/api/training/history` | Training history and quality scores |
| GET | `/api/models/versions` | List deployed model versions |
| POST | `/api/models/rollback/{version}` | Rollback to previous version |

---

## 9. Deployment

### 9.1 Docker Compose (Development - Two-Model Architecture)

```yaml
services:
  postgres:
    image: pgvector/pgvector:pg16
    ports: ["5432:5432"]

  redis:
    image: redis:7-alpine
    ports: ["6379:6379"]

  kafka:
    image: confluentinc/cp-kafka:7.6.0
    ports: ["9092:9092"]

  ollama:
    image: ollama/ollama:latest
    ports: ["11434:11434"]
    volumes: ["ollama-data:/root/.ollama"]
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              count: 1
              capabilities: [gpu]
    # Post-start initialization:
    # ollama pull llama3.1:8b     (orchestrator model)
    # ollama pull devstral-small:24b   (worker model example)

  eureka-server:
    build: ./infrastructure/eureka-server
    ports: ["8761:8761"]

  config-server:
    build: ./infrastructure/config-server
    ports: ["8888:8888"]

  api-gateway:
    build: ./infrastructure/api-gateway
    ports: ["8080:8080"]
    depends_on: [eureka-server, config-server]

  agent-orchestrator:
    build: ./agents/agent-orchestrator
    depends_on: [eureka-server, config-server, kafka, ollama]

  agent-data-analyst:
    build: ./agents/agent-data-analyst
    depends_on: [eureka-server, config-server, kafka, ollama, postgres]

  training-orchestrator:
    build: ./learning/training-orchestrator
    depends_on: [kafka, postgres, ollama]

volumes:
  ollama-data:
```

### 9.2 GPU Requirements (Two-Model Architecture)

| Component | GPU Needed | Minimum VRAM |
|-----------|-----------|-------------|
| Orchestrator model (8B) inference | Yes | 8 GB |
| Worker model (24B baseline) inference | Yes | 16 GB |
| Both models concurrent inference | Yes | 24 GB |
| SFT training (8B with LoRA) | Yes | 16 GB |
| DPO training (8B) | Yes | 24 GB |
| Embedding generation | Optional | 4 GB |

---

## 10. Testing Strategy

| Test Type | Scope | Tools |
|-----------|-------|-------|
| Unit Tests | Individual components | JUnit 5, Mockito |
| Integration Tests | Service interactions | Spring Boot Test, Testcontainers |
| Agent Tests | End-to-end agent behavior | Custom eval harness |
| Model Tests | Model quality benchmarks | Python eval scripts |
| Load Tests | Performance under scale | k6, Gatling |
| Contract Tests | API compatibility | Spring Cloud Contract |

---

## 11. PDF Parity and Extension Matrix

### 11.1 PDF to Documentation Coverage

| PDF Architecture Concept | Coverage in This Baseline |
|---|---|
| Two-model local split | Sections 3.2, 3.9, 7.2, 9.1, 9.2 |
| 7-step pipeline | Section 3.9 |
| RAG at orchestrator level | Section 3.9 (Retrieve), Section 3.12 |
| Deterministic validation layer | Section 3.10 |
| Explain step (business + technical + artifacts) | Section 3.11 |
| Record/audit artifacts and approvals | Section 3.9 (Record), Section 4.1 |
| Tenant-safe isolation | Section 3.12 and Section 7.2 |

### 11.2 Beyond PDF Scope (Intentional)

- 13 learning methods and training orchestration (Sections 4 and 5)
- Dynamic/composite/agent-as-tool framework (Sections 3.4 to 3.6)
- Sprint-level epic decomposition (companion stories document)
- Git/Claude workflow and repository operating guide (companion guide)
