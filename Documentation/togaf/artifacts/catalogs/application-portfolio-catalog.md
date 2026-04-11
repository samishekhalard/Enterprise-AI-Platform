> **WP-ARCH-ALIGN (2026-03-24):** This document has been updated to reflect the frozen auth target model (Rev 2).
> See `Foundation/03-ownership-boundaries.md` FROZEN for the canonical decision.

# Application Portfolio Catalog

> **Last Updated:** 2026-03-08
> **Status:** Active
> **Source:** TOGAF Phase C (Application Architecture), EMSIST Implementation Truth

## Overview

This catalog enumerates all applications and services in the EMSIST platform portfolio, including their runtime characteristics, data dependencies, and lifecycle status. Database assignments reflect the verified polyglot persistence model: [AS-IS] Neo4j for auth-facade (RBAC graph) and definition-service (type definition graph), PostgreSQL 16 for all other domain services. [TARGET] Neo4j for definition-service only; auth-facade RBAC data migrates to tenant-service (PostgreSQL); auth-facade and user-service are [TRANSITION] services to be removed.

## Service Portfolio

| App ID | Application/Service | Type | Port | Primary Database | Primary Owner | Lifecycle | Security Classification | API Style | Notes |
|--------|---------------------|------|------|------------------|---------------|-----------|------------------------|-----------|-------|
| APP-001 | api-gateway | Platform service | 8080 | N/A | Platform Team | Active | INTERNAL | REST (proxy) | Spring Cloud Gateway; routes, rate limits, CORS, tenant context extraction |
| APP-002 | auth-facade | Platform service | 8081 | [AS-IS] Neo4j 5.x + Valkey 8 | Security Team | [TRANSITION] | RESTRICTED | REST | [AS-IS] BFF authentication; RBAC graph (Neo4j); session cache (Valkey); Keycloak provider. [TARGET] Service removed after migration. Auth endpoints migrate to api-gateway; RBAC/users/sessions migrate to tenant-service (PostgreSQL). |
| APP-003 | tenant-service | Domain service | 8082 | PostgreSQL 16 | Platform Team | Active | CONFIDENTIAL | REST | [AS-IS] Tenant CRUD, TenantConfig; tenant_id column isolation. [TARGET] Tenant aggregate root + tenant users + RBAC + memberships + provider config + session control + revocation + session history. PostgreSQL authoritative. |
| APP-004 | user-service | Domain service | 8083 | PostgreSQL 16 | Platform Team | [TRANSITION] | CONFIDENTIAL | REST | [AS-IS] UserProfile, UserSession, DeviceFingerprint management. [TARGET] Entities migrate to tenant-service. Service removed after migration. |
| APP-005 | license-service | Domain service | 8085 | PostgreSQL 16 | Product Team | Active | CONFIDENTIAL | REST | TenantLicense, UserLicenseAssignment, LicenseSeat; NOT merged per ADR-006 (0% implemented) |
| APP-006 | notification-service | Domain service | 8086 | PostgreSQL 16 | Platform Team | Active | INTERNAL | REST | NotificationTemplate, NotificationLog; email channel active |
| APP-007 | audit-service | Domain service | 8087 | PostgreSQL 16 | Compliance Team | Active | RESTRICTED | REST | AuditEvent (append-only); Flyway migrations |
| APP-008 | ai-service | Domain service | 8088 | PostgreSQL 16 + pgvector | AI Team | Active | CONFIDENTIAL | REST | Conversation, AIProviderConfig; pgvector for RAG embeddings |
| APP-009 | definition-service | Domain service | 8090 | Neo4j 5.x | Engineering Team | Active | INTERNAL | REST | ObjectType/AttributeType graph management; `@Node` entities with `Neo4jRepository`; explicitly excludes JDBC/JPA auto-config |
| APP-010 | process-service | Domain service | 8089 | PostgreSQL 16 | Engineering Team | Active | INTERNAL | REST | BpmnElementType CRUD; `@Entity` with JPA/Flyway; BPMN element styling and metadata |
| APP-011 | service-registry | Infrastructure service | 8761 | N/A | Platform Team | Active | INTERNAL | REST (Eureka) | Netflix Eureka server; service discovery for all backend services |
| APP-012 | Keycloak | External/identity platform | 8180 | PostgreSQL 16 (own schema) | Security Team | External | RESTRICTED | REST/OIDC | Default identity provider; realm-per-tenant; Keycloak-managed schema |
| APP-013 | emsist-frontend | Frontend application | 4200 | N/A | Engineering Team | Active | INTERNAL | N/A | Angular 21+ SPA; standalone components, signals, OnPush; communicates via api-gateway |

## Service Classification

### By Type

| Type | Count | Services |
|------|-------|----------|
| Platform service | 2 | api-gateway, auth-facade |
| Domain service | 8 | tenant, user, license, notification, audit, ai, definition, process |
| Infrastructure service | 1 | service-registry |
| External platform | 1 | Keycloak |
| Frontend application | 1 | emsist-frontend |

### By Database Technology

| Database | Services | Notes |
|----------|----------|-------|
| Neo4j 5.x (Community) | [AS-IS] auth-facade, definition-service. [TARGET] definition-service only. | [AS-IS] auth-facade: RBAC graph; definition-service: ObjectType/AttributeType definition graph. [TARGET] Neo4j is used by definition-service only (canonical object types). Auth-facade RBAC graph migrates to tenant-service (PostgreSQL); auth-facade is removed. |
| PostgreSQL 16 | tenant, user, license, notification, audit, process, Keycloak | Domain services with JPA entities; Flyway migrations; tenant_id column discrimination |
| PostgreSQL 16 + pgvector | ai-service | Vector embeddings for RAG retrieval |
| Valkey 8 | auth-facade | Distributed session/token cache |
| N/A | api-gateway, service-registry, emsist-frontend | No direct database dependency |

### By Security Classification

| Classification | Services | Access Control |
|----------------|----------|----------------|
| RESTRICTED | auth-facade, audit-service, Keycloak | Credentials, RBAC data, audit trail; encrypted at rest; minimal access |
| CONFIDENTIAL | tenant-service, user-service, license-service, ai-service | PII, business data; tenant-scoped; role-based access |
| INTERNAL | api-gateway, notification-service, definition-service, process-service, service-registry, emsist-frontend | Operational data; standard access controls |

## Lifecycle Status Definitions

| Status | Definition |
|--------|------------|
| Active | Running in dev/staging; actively developed and maintained |
| External | Third-party managed; configured but not developed by EMSIST team |
| Planned | Designed but not yet implemented |
| Deprecated | Scheduled for removal |
| Stub | Directory exists but no source code (pom.xml only) |

## Known Stubs (Not in Active Portfolio)

| Service | Status | Notes |
|---------|--------|-------|
| persona-service | Stub | pom.xml only, no src/ directory |
| product-service | Stub | pom.xml only, no src/ directory |
