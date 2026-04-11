> **WP-ARCH-ALIGN (2026-03-24):** This document has been updated to reflect the frozen auth target model (Rev 2).
> See `Foundation/03-ownership-boundaries.md` FROZEN for the canonical decision.

# Application to Data Matrix

This matrix maps each EMSIST application component to its data stores, access patterns, data classification levels, and encryption status.

## Matrix

| Application | Neo4j 5.x | PostgreSQL 16 | Valkey 8 | Kafka | Browser Storage | Data Classification | Encryption (At-Rest / In-Transit) | Access Pattern |
|-------------|-----------|---------------|----------|-------|-----------------|--------------------|------------------------------------|----------------|
| api-gateway | - | - | R | - | - | Internal (token blacklist lookups) | N/A / TLS termination | Read (Valkey), Pass-through (HTTP) |
| auth-facade | [AS-IS] R/W | - | [AS-IS] R/W | - | - | Confidential (RBAC graph, sessions, tokens) | Planned LUKS / Neo4j planned `bolt+s://`, Valkey planned TLS | CRUD | [TRANSITION] Service removed after migration; Neo4j R/W migrates to tenant-service (PostgreSQL). |
| tenant-service | - | R/W | - | Planned Pub | - | Confidential (tenant config, org hierarchy). [TARGET] Also: tenant users, RBAC, memberships, provider config, session control, revocation. | Planned LUKS / `sslmode=verify-full` [IMPLEMENTED] | CRUD |
| user-service | - | [TRANSITION] R/W | - | Planned Pub | - | Confidential (user profiles, PII). [TRANSITION] Entities migrate to tenant-service; service removed. | Planned LUKS / `sslmode=verify-full` [IMPLEMENTED] | CRUD |
| license-service | - | R/W | R/W | Planned Pub | - | Confidential (license keys, seat allocations) | Planned LUKS / `sslmode=verify-full` [IMPLEMENTED] | CRUD |
| notification-service | - | R/W | - | Sub (disabled) | - | Internal (notification templates, delivery log) | Planned LUKS / `sslmode=verify-full` [IMPLEMENTED] | CRUD |
| audit-service | - | R/W | - | Sub (disabled) | - | Confidential (immutable audit records) | Planned LUKS / `sslmode=verify-full` [IMPLEMENTED] | Append-only |
| ai-service | - | R/W (pgvector) | Planned R/W | Planned Pub/Sub | - | Confidential (embeddings, RAG context) | Planned LUKS / `sslmode` **not configured** [PLANNED] | CRUD |
| definition-service | R/W | - | - | Planned Pub | - | Internal (BPMN definitions, workflow state) | Planned LUKS / Neo4j planned `bolt+s://` | CRUD |
| service-registry | - | - | - | - | - | N/A (ephemeral registry) | N/A / N/A | In-memory registry |
| frontend | - | - | - | - | localStorage, sessionStorage | Restricted (JWT tokens in memory, preferences in storage) | Browser-managed / HTTPS | Read-only (API consumer) |
| Keycloak | - | R/W (dedicated DB) | - | - | - | Confidential (identity, credentials, realm config) | Planned LUKS / `sslmode=verify-full` [IMPLEMENTED] | CRUD |

## Data Store Summary

| Data Store | Services Using It | Total Consumers |
|------------|-------------------|-----------------|
| Neo4j 5.x (Community) | [AS-IS] auth-facade, definition-service. [TARGET] definition-service only. | [AS-IS] 2. [TARGET] 1. |
| PostgreSQL 16 | tenant-service, user-service, license-service, notification-service, audit-service, ai-service, Keycloak | 7 |
| Valkey 8 | auth-facade (active R/W), api-gateway (active R), license-service (active R/W) | 3 active, 1 planned (ai-service) |
| Kafka (Confluent 7.5) | audit-service (consumer, disabled), notification-service (consumer, disabled) | 0 active, 2 disabled, 4 planned producers |
| Browser Storage | frontend | 1 |

## Data Classification Levels

| Level | Definition | Examples |
|-------|-----------|----------|
| Confidential | Requires encryption at rest and strict access control; contains PII, credentials, or business-critical data | User profiles, RBAC graph, license keys, audit records, AI embeddings |
| Internal | Internal operational data; limited external exposure risk | Notification templates, BPMN definitions, workflow state |
| Restricted | Sensitive tokens handled in memory only; must not persist unencrypted | JWT access tokens (frontend memory), session identifiers |
| N/A | No persistent data | service-registry (ephemeral) |

## Access Pattern Definitions

| Pattern | Description | Applicable Services |
|---------|-------------|---------------------|
| CRUD | Full Create, Read, Update, Delete operations | tenant-service, user-service, license-service, notification-service, ai-service, definition-service, auth-facade, Keycloak |
| Append-only | INSERT and SELECT only; no UPDATE or DELETE permitted | audit-service |
| Read-only | Consumes data via API calls; no direct database access | frontend |
| Read + Pass-through | Reads from Valkey (token blacklist) and routes HTTP requests without persisting data | api-gateway |
| In-memory registry | Holds ephemeral service registration data in memory; no persistent store | service-registry (Eureka) |

## Legend

| Symbol | Meaning |
|--------|---------|
| `R/W` | Active read/write access to this data store |
| `R` | Active read-only access to this data store |
| `Planned R/W` | Designed but not yet implemented |
| `Planned Pub` | Kafka producer planned but no KafkaTemplate exists |
| `Planned Sub` | Kafka consumer planned but no listener exists |
| `Sub (disabled)` | Kafka consumer code exists (`@KafkaListener`) but disabled via `kafka.enabled=false` |
| `-` | No interaction with this data store |
| `[IMPLEMENTED]` | Verified in code |
| `[PLANNED]` | Design only, not yet built |

## Notes

- **Neo4j** [AS-IS] is used by two services: **auth-facade** (RBAC graph, sessions) and **definition-service** (BPMN object/attribute type graph via `@Node` entities and `Neo4jRepository`). [TARGET] Neo4j is used by definition-service only (canonical object types). Auth-facade RBAC graph migrates to tenant-service (PostgreSQL); auth-facade is removed after migration. definition-service explicitly excludes `DataSourceAutoConfiguration`. All other domain services use PostgreSQL.
- **api-gateway** reads from Valkey via `ReactiveStringRedisTemplate` in `TokenBlacklistFilter` to check token blacklist status. It does not write to Valkey.
- **license-service** actively uses Valkey via `StringRedisTemplate` in `FeatureGateServiceImpl` (feature gate caching) and `SeatValidationServiceImpl` (seat allocation tracking).
- **audit-service** has Kafka consumer code (`AuditEventListener` with `@KafkaListener`) but it is disabled by default (`kafka.enabled=${KAFKA_ENABLED:false}`). It enforces append-only semantics: the target-state `svc_audit` database user will have only INSERT and SELECT privileges (ADR-020).
- **notification-service** has Kafka consumer code (`NotificationEventListener` with `@KafkaListener`) but it is disabled by default (`kafka.enabled=${KAFKA_ENABLED:false}`).
- **Kafka** infrastructure exists in docker-compose (Confluent 7.5.0). Two services have consumer implementations (audit-service, notification-service) but both are disabled via config flag. No service has KafkaTemplate (producer) implementations.
- **PostgreSQL TLS**: 6 of 7 PostgreSQL services have `sslmode=verify-full` implemented. ai-service is the exception (PLANNED).
- **Keycloak** has its own dedicated PostgreSQL database and user. It does not share the domain services' databases.
- **frontend** stores JWT tokens in memory (not localStorage) for security; only user preferences use browser storage.
