# EMS Neo4j Database Schema

## Status

- **Authority level:** Canonical database schema for EMS application data
- **Database:** `neo4j` (single EMS application database)
- **Engine:** Neo4j 5.x
- **Ownership:** EMS platform teams
- **Supersedes (as authority):** `master-graph.md`, `tenant-graph.md`, `neo4j-auth-graph-schema.md`, `graph-per-tenant-schema.md`

## Purpose

This file is the single authoritative data-model definition for EMS application persistence.

- All EMS domain data is modeled in Neo4j.
- Keycloak internal identity persistence remains outside EMS and is documented separately in [keycloak-postgresql-db.md](./keycloak-postgresql-db.md).
- Legacy split schema files remain available as implementation views, but this file is the standard.

## Database Boundary

```mermaid
flowchart LR
    subgraph ems["EMS Application Data (Neo4j)"]
        N["neo4j<br/>tenants, auth graph, licensing, audit, AI, process metadata"]
    end

    subgraph kc["Keycloak Internal Data"]
        K["keycloak_db (PostgreSQL)<br/>realm/user/session internals"]
    end

    U["EMS Services"] --> N
    A["auth-facade / Keycloak"] --> K
    A --> N
```

## Canonical Graph Domains

| Domain | Core Nodes | Notes |
|---|---|---|
| Tenant Management | `Tenant`, `Domain`, `Branding`, `SessionConfig`, `MFAConfig`, `TenantAuthProvider` | Tenant identity, routing, and security posture |
| Authentication & RBAC | `Provider`, `Protocol`, `Config`, `User`, `Group`, `Role` | Multi-provider auth and role inheritance |
| Licensing | `LicenseProduct`, `LicenseFeature`, `TenantLicense`, `UserLicenseAssignment` | Feature and seat enforcement model |
| Operations | `AuditEvent`, `Notification`, `NotificationTemplate`, `NotificationPreference` | Observability and communication |
| AI | `Agent`, `AgentCategory`, `Conversation`, `Message`, `KnowledgeSource`, `KnowledgeChunk` | AI and RAG metadata |
| Process | `ProcessDefinition`, `ProcessElement`, `ProcessInstance` | BPMN orchestration metadata |

## Consolidated ERD (Mermaid)

```mermaid
erDiagram
    TENANT ||--o{ DOMAIN : HAS_DOMAIN
    TENANT ||--o| BRANDING : HAS_BRANDING
    TENANT ||--o| SESSION_CONFIG : HAS_SESSION_CONFIG
    TENANT ||--o| MFA_CONFIG : HAS_MFA_CONFIG
    TENANT ||--o{ TENANT_AUTH_PROVIDER : HAS_AUTH_PROVIDER

    TENANT ||--o{ CONFIG : CONFIGURED_WITH
    PROVIDER ||--o{ CONFIG : HAS_CONFIG
    PROVIDER ||--o{ PROTOCOL : SUPPORTS

    TENANT ||--o{ USER : HAS_USER
    USER }o--o{ GROUP : MEMBER_OF
    USER }o--o{ ROLE : HAS_ROLE
    GROUP }o--o{ ROLE : HAS_ROLE
    ROLE }o--o{ ROLE : INHERITS_FROM
    GROUP }o--o{ GROUP : CHILD_OF

    LICENSE_PRODUCT ||--o{ LICENSE_FEATURE : HAS_FEATURE
    TENANT ||--o{ TENANT_LICENSE : HAS_LICENSE
    TENANT_LICENSE }o--|| LICENSE_PRODUCT : FOR_PRODUCT
    TENANT_LICENSE ||--o{ USER_LICENSE_ASSIGNMENT : ASSIGNED_TO
    USER ||--o{ USER_LICENSE_ASSIGNMENT : RECEIVES_SEAT

    USER ||--o{ AUDIT_EVENT : PERFORMED_BY
    USER ||--o{ NOTIFICATION : RECEIVES
    NOTIFICATION_TEMPLATE ||--o{ NOTIFICATION : GENERATES
    USER ||--o| NOTIFICATION_PREFERENCE : PREFERS

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

    TENANT {
        string id PK
        string slug UK
        string status
        string tier
    }
    USER {
        string id PK
        string tenantId
        string email
        string status
    }
    ROLE {
        string id PK
        string tenantId
        string name
    }
    LICENSE_PRODUCT {
        string id PK
        string code UK
        string name
    }
    TENANT_LICENSE {
        string id PK
        string tenantId
        int totalSeats
        int assignedSeats
        string status
    }
```

## Tenancy and Isolation Standard

- Tenant isolation is enforced by tenant-scoped graph ownership and service-layer tenancy controls.
- Every tenant-owned node must carry `tenantId` and remain reachable from its owning `Tenant`.
- Cross-tenant relationships are forbidden for domain data.
- Master/system nodes (for example provider catalog and protocol catalog) are global read-mostly reference nodes.

## Constraints and Index Baseline

```cypher
CREATE CONSTRAINT tenant_id IF NOT EXISTS
FOR (t:Tenant) REQUIRE t.id IS UNIQUE;

CREATE CONSTRAINT tenant_slug IF NOT EXISTS
FOR (t:Tenant) REQUIRE t.slug IS UNIQUE;

CREATE CONSTRAINT user_id IF NOT EXISTS
FOR (u:User) REQUIRE u.id IS UNIQUE;

CREATE CONSTRAINT role_key IF NOT EXISTS
FOR (r:Role) REQUIRE (r.tenantId, r.name) IS UNIQUE;

CREATE CONSTRAINT license_product_code IF NOT EXISTS
FOR (p:LicenseProduct) REQUIRE p.code IS UNIQUE;

CREATE INDEX user_email IF NOT EXISTS
FOR (u:User) ON (u.email);

CREATE INDEX audit_timestamp IF NOT EXISTS
FOR (a:AuditEvent) ON (a.timestamp);
```

## Migration Standard

- Migration tool: Neo4j Migrations.
- Path: `backend/*/src/main/resources/neo4j/migrations/`.
- Naming: `V{number}__{description}.cypher`.
- Migrations must be additive and backward compatible where possible.

## Legacy View Mapping

These files are still useful for focused reading, but they are no longer the source of truth:

- [master-graph.md](./master-graph.md) - tenant registry focused view
- [tenant-graph.md](./tenant-graph.md) - tenant-domain operational view
- [neo4j-auth-graph-schema.md](./neo4j-auth-graph-schema.md) - auth and RBAC focused view
- [graph-per-tenant-schema.md](./graph-per-tenant-schema.md) - historical tenancy strategy notes
- [provider-config-extensions.md](./provider-config-extensions.md) - provider-specific config field catalog

---

**Last Updated:** 2026-02-27
