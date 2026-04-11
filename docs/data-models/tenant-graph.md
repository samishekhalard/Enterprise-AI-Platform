# Tenant Graph Schema

> Legacy focused view. The canonical per-database source is [neo4j-ems-db.md](./neo4j-ems-db.md).

Each tenant has a dedicated Neo4j database (e.g., `tenant_acme`) containing all tenant-specific data. This provides complete data isolation between tenants.

## Overview

```mermaid
graph TB
    subgraph tenant["TENANT GRAPH (tenant_{slug})"]
        subgraph users["USER MANAGEMENT"]
            User((User))
            Device((Device))
            Session((Session))

            User -->|HAS_DEVICE| Device
            User -->|HAS_SESSION| Session
            User -->|REPORTS_TO| User
        end

        subgraph licenses["LICENSE MANAGEMENT"]
            TenantLicense((TenantLicense))
            TenantLicense -->|ASSIGNED_TO| User
        end

        subgraph audit["AUDIT & COMPLIANCE"]
            AuditEvent((AuditEvent))
            AuditEvent -->|PERFORMED_BY| User
        end

        subgraph ai["AI SERVICES"]
            AgentCategory((AgentCategory))
            Agent((Agent))
            Conversation((Conversation))
            Message((Message))
            KnowledgeSource((KnowledgeSource))
            Chunk((Chunk))

            Agent -->|IN_CATEGORY| AgentCategory
            Agent -->|OWNED_BY| User
            User -->|HAS_CONVERSATION| Conversation
            Conversation -->|WITH_AGENT| Agent
            Conversation -->|CONTAINS| Message
            Agent -->|HAS_KNOWLEDGE| KnowledgeSource
            KnowledgeSource -->|HAS_CHUNK| Chunk
            Chunk -.->|SIMILAR_TO| Chunk
        end

        subgraph process["PROCESS MANAGEMENT"]
            ProcessDefinition((ProcessDef))
            ProcessElement((Element))
            ProcessInstance((Instance))

            ProcessDefinition -->|CONTAINS| ProcessElement
            ProcessElement -->|FLOWS_TO| ProcessElement
            ProcessInstance -->|INSTANCE_OF| ProcessDefinition
        end

        subgraph notifications["NOTIFICATIONS"]
            Notification((Notification))
            NotificationTemplate((Template))
            NotificationPreference((Preference))

            Notification -->|SENT_TO| User
        end
    end
```

## ERD (Mermaid)

```mermaid
erDiagram
    USER ||--o{ DEVICE : HAS_DEVICE
    USER ||--o{ SESSION : HAS_SESSION
    SESSION }o--|| DEVICE : FROM_DEVICE
    USER ||--o{ TENANT_LICENSE_ASSIGNMENT : RECEIVES_SEAT
    TENANT_LICENSE ||--o{ TENANT_LICENSE_ASSIGNMENT : ASSIGNED_TO
    USER ||--o{ AUDIT_EVENT : PERFORMED_BY
    AGENT_CATEGORY ||--o{ AGENT : IN_CATEGORY
    USER ||--o{ AGENT : OWNS
    USER ||--o{ CONVERSATION : HAS_CONVERSATION
    AGENT ||--o{ CONVERSATION : WITH_AGENT
    CONVERSATION ||--o{ MESSAGE : CONTAINS
    AGENT ||--o{ KNOWLEDGE_SOURCE : HAS_KNOWLEDGE
    KNOWLEDGE_SOURCE ||--o{ KNOWLEDGE_CHUNK : HAS_CHUNK
    PROCESS_DEFINITION ||--o{ PROCESS_ELEMENT : CONTAINS
    PROCESS_ELEMENT ||--o{ PROCESS_ELEMENT : FLOWS_TO
    PROCESS_INSTANCE }o--|| PROCESS_DEFINITION : INSTANCE_OF
    USER ||--o{ NOTIFICATION : RECEIVES
    NOTIFICATION_TEMPLATE ||--o{ NOTIFICATION : GENERATES
    USER ||--o| NOTIFICATION_PREFERENCE : PREFERS

    USER {
        string id PK
        string keycloakId UK
        string email
        string displayName
        string department
        string status
    }

    DEVICE {
        string id PK
        string fingerprint
        string deviceType
        string trustLevel
        boolean isApproved
    }

    SESSION {
        string id PK
        string sessionToken UK
        string ipAddress
        datetime expiresAt
        string status
    }

    TENANT_LICENSE {
        string id PK
        string productCode
        int totalSeats
        int assignedSeats
        date validUntil
        string status
    }

    TENANT_LICENSE_ASSIGNMENT {
        datetime assignedAt
        string assignedBy
        string enabledFeatures
    }

    AUDIT_EVENT {
        string id PK
        string eventType
        string severity
        string action
        datetime timestamp
    }

    AGENT_CATEGORY {
        string id PK
        string name
        int sortOrder
        boolean isActive
    }

    AGENT {
        string id PK
        string name
        string model
        boolean ragEnabled
        string status
    }

    CONVERSATION {
        string id PK
        string title
        string status
        datetime lastMessageAt
    }

    MESSAGE {
        string id PK
        string role
        string content
        datetime createdAt
    }

    KNOWLEDGE_SOURCE {
        string id PK
        string sourceType
        string title
        string status
    }

    KNOWLEDGE_CHUNK {
        string id PK
        int chunkIndex
        string content
        string embeddingRef
    }

    PROCESS_DEFINITION {
        string id PK
        string key
        int version
        string status
    }

    PROCESS_ELEMENT {
        string id PK
        string elementType
        string bpmnId
    }

    PROCESS_INSTANCE {
        string id PK
        string status
        datetime startedAt
    }

    NOTIFICATION {
        string id PK
        string channel
        string status
        datetime sentAt
    }

    NOTIFICATION_TEMPLATE {
        string id PK
        string code
        string channel
        boolean isActive
    }

    NOTIFICATION_PREFERENCE {
        string id PK
        boolean emailEnabled
        boolean smsEnabled
        boolean pushEnabled
    }
```

## Node Definitions

### User Management

#### User

Extended user profile information (synced with Keycloak).

```mermaid
classDiagram
    class User {
        +String id
        +String keycloakId
        +String email
        +Boolean emailVerified
        +String firstName
        +String lastName
        +String displayName
        +String jobTitle
        +String department
        +String phone
        +String mobile
        +String officeLocation
        +String employeeId
        +String employeeType
        +String avatarUrl
        +String timezone
        +String locale
        +Boolean mfaEnabled
        +List~String~ mfaMethods
        +DateTime passwordLastChanged
        +DateTime passwordExpiresAt
        +Boolean accountLocked
        +DateTime lockoutEnd
        +Integer failedLoginAttempts
        +DateTime lastLoginAt
        +String lastLoginIp
        +String status
        +DateTime createdAt
        +DateTime updatedAt
    }

    User --> User : REPORTS_TO
```

**Relationships:**
- `(:User)-[:REPORTS_TO]->(:User)` - Manager relationship
- `(:User)-[:MEMBER_OF]->(:Department)` - Department membership

**Constraints:**
```cypher
CREATE CONSTRAINT user_id FOR (u:User) REQUIRE u.id IS UNIQUE;
CREATE CONSTRAINT user_keycloak FOR (u:User) REQUIRE u.keycloakId IS UNIQUE;
CREATE INDEX user_email FOR (u:User) ON (u.email);
```

#### Device

Registered user devices for security and trust management.

```mermaid
classDiagram
    class Device {
        +String id
        +String fingerprint
        +String deviceName
        +String deviceType
        +String osName
        +String osVersion
        +String browserName
        +String browserVersion
        +String trustLevel
        +Boolean isApproved
        +DateTime approvedAt
        +DateTime firstSeenAt
        +DateTime lastSeenAt
        +String lastIpAddress
        +Map lastLocation
        +Integer loginCount
        +DateTime createdAt
        +DateTime updatedAt
    }
```

**Device Types:** DESKTOP, MOBILE, TABLET, OTHER
**Trust Levels:** UNKNOWN, UNTRUSTED, TRUSTED, VERIFIED

**Relationship:** `(:User)-[:HAS_DEVICE]->(:Device)`

#### Session

Active user sessions.

```mermaid
classDiagram
    class Session {
        +String id
        +String sessionToken
        +String refreshTokenId
        +String ipAddress
        +String userAgent
        +Map location
        +DateTime createdAt
        +DateTime lastActivity
        +DateTime expiresAt
        +Boolean isRemembered
        +Boolean mfaVerified
        +String status
        +DateTime revokedAt
        +String revokeReason
    }
```

**Status:** ACTIVE, EXPIRED, REVOKED

**Relationships:**
- `(:User)-[:HAS_SESSION]->(:Session)`
- `(:Session)-[:FROM_DEVICE]->(:Device)`

### License Management

#### TenantLicense

Tenant's active license subscriptions.

```mermaid
classDiagram
    class TenantLicense {
        +String id
        +String productCode
        +Integer totalSeats
        +Integer assignedSeats
        +Date validFrom
        +Date validUntil
        +String billingCycle
        +Boolean autoRenew
        +String status
        +DateTime createdAt
        +DateTime updatedAt
    }
```

**Status:** ACTIVE, EXPIRED, SUSPENDED, CANCELLED

**Relationship:**
```cypher
(:TenantLicense)-[:ASSIGNED_TO {
    assignedAt: DateTime,
    assignedBy: String,
    enabledFeatures: [String],
    disabledFeatures: [String]
}]->(:User)
```

### Audit & Compliance

#### AuditEvent

Immutable audit trail for compliance and security.

```mermaid
classDiagram
    class AuditEvent {
        +String id
        +String eventType
        +String eventCategory
        +String severity
        +String message
        +String resourceType
        +String resourceId
        +String resourceName
        +String action
        +String outcome
        +String failureReason
        +Map oldValues
        +Map newValues
        +String ipAddress
        +String userAgent
        +String requestId
        +String correlationId
        +String serviceName
        +String serviceVersion
        +Map metadata
        +DateTime timestamp
        +DateTime expiresAt
    }
```

**Categories:** AUTH, DATA, ADMIN
**Severity:** INFO, WARNING, ERROR, CRITICAL
**Actions:** CREATE, READ, UPDATE, DELETE
**Outcome:** SUCCESS, FAILURE

**Relationships:**
- `(:AuditEvent)-[:PERFORMED_BY]->(:User)`
- `(:AuditEvent)-[:AFFECTED]->(:Resource)` - Generic resource relationship

### AI Services

#### Agent & Knowledge Graph

```mermaid
graph LR
    subgraph ai_graph["AI Knowledge Graph"]
        Agent((Agent))
        Category((Category))
        Conv((Conversation))
        Msg((Message))
        KS((KnowledgeSource))
        Chunk((Chunk))
        User((User))

        Agent -->|IN_CATEGORY| Category
        Agent -->|OWNED_BY| User
        User -->|HAS_CONVERSATION| Conv
        Conv -->|WITH_AGENT| Agent
        Conv -->|CONTAINS| Msg
        Agent -->|HAS_KNOWLEDGE| KS
        KS -->|HAS_CHUNK| Chunk
        Chunk -.->|SIMILAR_TO| Chunk
    end
```

#### Agent

AI agent configurations.

```mermaid
classDiagram
    class Agent {
        +String id
        +String name
        +String description
        +String avatarUrl
        +String systemPrompt
        +String greetingMessage
        +List~String~ conversationStarters
        +String provider
        +String model
        +Map modelConfig
        +Boolean ragEnabled
        +Boolean isPublic
        +Boolean isSystem
        +String status
        +Integer usageCount
        +DateTime createdAt
        +DateTime updatedAt
    }
```

**Providers:** OPENAI, ANTHROPIC, GEMINI, OLLAMA
**Status:** ACTIVE, INACTIVE, DELETED

#### Conversation & Messages

```mermaid
classDiagram
    class Conversation {
        +String id
        +String title
        +Integer messageCount
        +Integer totalTokens
        +String status
        +DateTime lastMessageAt
        +DateTime createdAt
        +DateTime updatedAt
    }

    class Message {
        +String id
        +String role
        +String content
        +Integer tokenCount
        +Map ragContext
        +Map metadata
        +DateTime createdAt
    }

    Conversation "1" --> "*" Message : CONTAINS
```

**Message Roles:** USER, ASSISTANT, SYSTEM

#### KnowledgeSource & Chunks

```mermaid
classDiagram
    class KnowledgeSource {
        +String id
        +String name
        +String description
        +String sourceType
        +String filePath
        +String fileType
        +Integer fileSize
        +String url
        +String status
        +Integer chunkCount
        +String errorMessage
        +DateTime processedAt
        +DateTime createdAt
        +DateTime updatedAt
    }

    class Chunk {
        +String id
        +String content
        +Float[] embedding
        +Integer chunkIndex
        +Integer tokenCount
        +Map metadata
        +DateTime createdAt
    }

    KnowledgeSource "1" --> "*" Chunk : HAS_CHUNK
    Chunk --> Chunk : SIMILAR_TO
```

**Source Types:** FILE, URL, TEXT
**File Types:** PDF, TXT, MD, CSV, DOCX
**Status:** PENDING, PROCESSING, COMPLETED, FAILED

**Vector Index:**
```cypher
CREATE VECTOR INDEX chunk_embedding FOR (c:Chunk) ON (c.embedding)
OPTIONS {indexConfig: {`vector.dimensions`: 1536, `vector.similarity_function`: 'cosine'}}
```

### Process Management

#### Process Flow

```mermaid
graph LR
    subgraph process_flow["BPMN Process Flow"]
        Start((Start))
        Task1[Task 1]
        Gateway{Gateway}
        Task2[Task 2]
        Task3[Task 3]
        End((End))

        Start -->|FLOWS_TO| Task1
        Task1 -->|FLOWS_TO| Gateway
        Gateway -->|FLOWS_TO| Task2
        Gateway -->|FLOWS_TO| Task3
        Task2 -->|FLOWS_TO| End
        Task3 -->|FLOWS_TO| End
    end
```

#### ProcessDefinition

```mermaid
classDiagram
    class ProcessDefinition {
        +String id
        +String name
        +String description
        +Integer version
        +String bpmnXml
        +String status
        +DateTime createdAt
        +DateTime updatedAt
    }

    class ProcessElement {
        +String id
        +String elementId
        +String elementType
        +String name
        +Map properties
        +Float x
        +Float y
    }

    ProcessDefinition "1" --> "*" ProcessElement : CONTAINS
    ProcessElement --> ProcessElement : FLOWS_TO
```

**Status:** DRAFT, PUBLISHED, ARCHIVED

#### ProcessInstance

```mermaid
classDiagram
    class ProcessInstance {
        +String id
        +String status
        +String currentElement
        +Map variables
        +DateTime startedAt
        +DateTime completedAt
    }
```

**Status:** RUNNING, COMPLETED, CANCELLED, FAILED

### Notifications

```mermaid
classDiagram
    class Notification {
        +String id
        +String type
        +String category
        +String subject
        +String body
        +String bodyHtml
        +String status
        +String recipientAddress
        +DateTime sentAt
        +DateTime deliveredAt
        +DateTime readAt
        +DateTime failedAt
        +String failureReason
        +Integer retryCount
        +String priority
        +DateTime scheduledAt
        +String actionUrl
        +String actionLabel
        +Map metadata
        +DateTime createdAt
        +DateTime updatedAt
        +DateTime expiresAt
    }
```

**Types:** EMAIL, PUSH, IN_APP, SMS
**Categories:** SYSTEM, MARKETING, TRANSACTIONAL, ALERT
**Status:** PENDING, SENT, DELIVERED, FAILED, READ
**Priority:** LOW, NORMAL, HIGH, URGENT

---

## Isolation Model

Each tenant graph is completely isolated:

```mermaid
flowchart LR
    Request[Request with JWT]
    Filter[TenantContextFilter]
    Context[TenantContext]
    Factory[Neo4j Session Factory]
    DB[(tenant_xxx)]

    Request --> Filter
    Filter --> Context
    Context --> Factory
    Factory --> DB
```

- No cross-tenant queries possible
- Physical graph separation
- Independent backup/restore
- Per-tenant connection routing

### Connection Routing

```java
// Tenant-aware Neo4j session
public Session getSession() {
    String tenantId = TenantContext.getCurrentTenant();
    String database = "tenant_" + tenantId;
    return driver.session(SessionConfig.forDatabase(database));
}
```

---

**Database:** Neo4j 5.x with vector index support
**Last Updated:** 2026-02-24
