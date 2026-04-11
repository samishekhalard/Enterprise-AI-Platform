> **WP-ARCH-ALIGN (2026-03-24):** This document has been updated to reflect the frozen auth target model (Rev 2).
> See `Foundation/03-ownership-boundaries.md` FROZEN for the canonical decision.

# Data Entity Catalog

> **Last Updated:** 2026-03-08
> **Status:** Active
> **Source:** TOGAF Phase C (Data Architecture), ADR-016 Polyglot Persistence, EMSIST Implementation Truth
>
> **CRITICAL CORRECTION (2026-03-08):** Previous version incorrectly listed Neo4j as the data store for ALL services. The verified reality is that ONLY auth-facade uses Neo4j (for the RBAC graph). ALL other domain services use PostgreSQL 16. This catalog now reflects the correct polyglot persistence model.
>
> **AUTH TARGET MODEL UPDATE (2026-03-24):** Per the frozen auth target model (Rev 2), auth-facade Neo4j entities (Role, Permission, RoleAssignment, ProviderConfig) are [AS-IS]. [TARGET] These entities migrate to tenant-service (PostgreSQL). Neo4j remains only for definition-service. Auth-facade and user-service are [TRANSITION] services to be removed.

## Overview

This catalog documents all data entities in the EMSIST platform, their owning service, physical data store, data classification, and tenant scoping. The persistence model follows ADR-016 (Polyglot Persistence):

- **Neo4j 5.x** -- [AS-IS] RBAC identity graph (auth-facade only) + definition graph (definition-service). [TARGET] Definition graph (definition-service) only. Auth RBAC entities migrate to tenant-service (PostgreSQL).
- **PostgreSQL 16** -- [TARGET] Authoritative store for all domain data including tenant users, RBAC, memberships, sessions (tenant-service). [AS-IS] 7 services + Keycloak.
- **Valkey 8** -- [TARGET] Cache only -- non-authoritative. No persistent auth state.

## Entity Catalog

### auth-facade Entities (Neo4j 5.x) -- [AS-IS / TRANSITION]

> **[TARGET]** These entities migrate to tenant-service (PostgreSQL). Auth-facade is removed after migration. Neo4j is removed from the auth domain.

| Entity ID | Entity | Owning Service | Data Store | Tenant Scoped | Data Classification | Retention Policy | Encryption | Notes |
|-----------|--------|----------------|------------|---------------|---------------------|------------------|------------|-------|
| DE-001 | Role | auth-facade | Neo4j | Yes | RESTRICTED | Indefinite | At-rest (volume) | Graph node; hierarchical role inheritance via relationships |
| DE-002 | Permission | auth-facade | Neo4j | Yes | RESTRICTED | Indefinite | At-rest (volume) | Graph node; granular permission definitions |
| DE-003 | RoleAssignment | auth-facade | Neo4j | Yes | RESTRICTED | Indefinite | At-rest (volume) | Graph relationship; links users to roles with optional scope constraints |
| DE-004 | ProviderConfig | auth-facade | Neo4j | Yes | RESTRICTED | Indefinite | At-rest (volume) + Jasypt (secrets) | Identity provider configuration per tenant (currently Keycloak only) |

### tenant-service Entities (PostgreSQL 16)

| Entity ID | Entity | Owning Service | Data Store | Tenant Scoped | Data Classification | Retention Policy | Encryption | Notes |
|-----------|--------|----------------|------------|---------------|---------------------|------------------|------------|-------|
| DE-005 | Tenant | tenant-service | PostgreSQL | Yes (self-referencing) | CONFIDENTIAL | Indefinite | At-rest (volume) | Root tenant entity; tenant_id column isolation; Flyway-managed schema |
| DE-006 | TenantConfig | tenant-service | PostgreSQL | Yes | CONFIDENTIAL | Indefinite | At-rest (volume) | Per-tenant configuration: branding, feature flags, locale, security policy overrides |

### user-service Entities (PostgreSQL 16) -- [AS-IS / TRANSITION]

> **[TARGET]** These entities migrate to tenant-service (PostgreSQL). User-service is removed after migration.

| Entity ID | Entity | Owning Service | Data Store | Tenant Scoped | Data Classification | Retention Policy | Encryption | Notes |
|-----------|--------|----------------|------------|---------------|---------------------|------------------|------------|-------|
| DE-007 | UserProfile | user-service | PostgreSQL | Yes | CONFIDENTIAL | Account lifetime + 90d post-deletion | At-rest (volume) | PII: name, email, phone; GDPR data subject |
| DE-008 | UserSession | user-service | PostgreSQL | Yes | INTERNAL | 30 days | At-rest (volume) | Session metadata; active session tracking; complements Valkey session cache |
| DE-009 | DeviceFingerprint | user-service | PostgreSQL | Yes | INTERNAL | 1 year | At-rest (volume) | Device metadata for trusted device registry and anomaly detection |

### license-service Entities (PostgreSQL 16)

| Entity ID | Entity | Owning Service | Data Store | Tenant Scoped | Data Classification | Retention Policy | Encryption | Notes |
|-----------|--------|----------------|------------|---------------|---------------------|------------------|------------|-------|
| DE-010 | TenantLicense | license-service | PostgreSQL | Yes | CONFIDENTIAL | Contract lifetime + 2 years | At-rest (volume) | License type, status, activation/expiration dates, feature entitlements |
| DE-011 | UserLicenseAssignment | license-service | PostgreSQL | Yes | CONFIDENTIAL | License lifetime | At-rest (volume) | Maps users to licenses; tracks assignment date and assigning admin |
| DE-012 | LicenseSeat | license-service | PostgreSQL | Yes | CONFIDENTIAL | License lifetime | At-rest (volume) | Seat allocation within a license; enforces seat count limits |

### notification-service Entities (PostgreSQL 16)

| Entity ID | Entity | Owning Service | Data Store | Tenant Scoped | Data Classification | Retention Policy | Encryption | Notes |
|-----------|--------|----------------|------------|---------------|---------------------|------------------|------------|-------|
| DE-013 | NotificationTemplate | notification-service | PostgreSQL | Yes | INTERNAL | Indefinite | At-rest (volume) | Template definitions with channel type, subject, body with variable placeholders |
| DE-014 | NotificationLog | notification-service | PostgreSQL | Yes | INTERNAL | 1 year | At-rest (volume) | Delivery log: recipient, channel, status, timestamp, retry count |

### audit-service Entities (PostgreSQL 16)

| Entity ID | Entity | Owning Service | Data Store | Tenant Scoped | Data Classification | Retention Policy | Encryption | Notes |
|-----------|--------|----------------|------------|---------------|---------------------|------------------|------------|-------|
| DE-015 | AuditEvent | audit-service | PostgreSQL | Yes | RESTRICTED | 7 years (regulatory) | At-rest (volume) | Append-only; actor, action, target, timestamp, tenant context, before/after state; Flyway-managed |

### ai-service Entities (PostgreSQL 16 + pgvector)

| Entity ID | Entity | Owning Service | Data Store | Tenant Scoped | Data Classification | Retention Policy | Encryption | Notes |
|-----------|--------|----------------|------------|---------------|---------------------|------------------|------------|-------|
| DE-016 | Conversation | ai-service | PostgreSQL | Yes | CONFIDENTIAL | 1 year or user-requested deletion | At-rest (volume) | Conversation history with message chain; linked to user profile |
| DE-017 | AIProviderConfig | ai-service | PostgreSQL | Yes | CONFIDENTIAL | Indefinite | At-rest (volume) + Jasypt (API keys) | AI model provider settings: model ID, temperature, max tokens, API endpoint |
| DE-018 | DocumentEmbedding | ai-service | PostgreSQL (pgvector) | Yes | CONFIDENTIAL | Document lifetime | At-rest (volume) | Vector embeddings for RAG retrieval; pgvector extension |

### definition-service Entities (PostgreSQL 16)

| Entity ID | Entity | Owning Service | Data Store | Tenant Scoped | Data Classification | Retention Policy | Encryption | Notes |
|-----------|--------|----------------|------------|---------------|---------------------|------------------|------------|-------|
| DE-019 | ProcessDefinition | definition-service | PostgreSQL | Yes | INTERNAL | Indefinite | At-rest (volume) | BPMN 2.0 process definitions; XML storage; version tracking |
| DE-020 | ProcessInstance | definition-service | PostgreSQL | Yes | INTERNAL | 2 years post-completion | At-rest (volume) | Runtime process execution state; linked to ProcessDefinition version |

### Keycloak Entities (PostgreSQL 16 -- Keycloak-managed)

| Entity ID | Entity | Owning Service | Data Store | Tenant Scoped | Data Classification | Retention Policy | Encryption | Notes |
|-----------|--------|----------------|------------|---------------|---------------------|------------------|------------|-------|
| DE-021 | Realm | Keycloak | PostgreSQL (Keycloak schema) | N/A | RESTRICTED | Platform lifetime | At-rest (volume) | Keycloak-managed; one realm per tenant |
| DE-022 | KeycloakUser | Keycloak | PostgreSQL (Keycloak schema) | Yes (via realm) | RESTRICTED | Realm lifetime | At-rest (volume) + BCrypt (passwords) | Keycloak-managed; credentials never accessed directly by EMSIST services |
| DE-023 | Client | Keycloak | PostgreSQL (Keycloak schema) | Yes (via realm) | RESTRICTED | Realm lifetime | At-rest (volume) | OAuth2/OIDC client definitions; client secrets encrypted |
| DE-024 | KeycloakSession | Keycloak | PostgreSQL (Keycloak schema) | Yes (via realm) | INTERNAL | Session TTL | At-rest (volume) | Keycloak-managed session persistence |

### Cache Entities (Valkey 8 -- Ephemeral)

| Entity ID | Entity | Owning Service | Data Store | Tenant Scoped | Data Classification | Retention Policy | Encryption | Notes |
|-----------|--------|----------------|------------|---------------|---------------------|------------------|------------|-------|
| DE-025 | SessionCache | auth-facade | Valkey | Yes | RESTRICTED | TTL-based (configurable) | In-transit (TLS) | Distributed session state; primary session store for BFF pattern |
| DE-026 | TokenValidationCache | auth-facade | Valkey | Yes | RESTRICTED | TTL-based (short-lived) | In-transit (TLS) | Cached token validation results to reduce Keycloak round-trips |

## Data Classification Definitions

| Classification | Description | Access Requirements | Examples |
|----------------|-------------|---------------------|----------|
| OPEN | Public data, no restrictions | None | API documentation, public endpoints |
| INTERNAL | Internal operational data | Authenticated user | Notification templates, process definitions |
| CONFIDENTIAL | Business-sensitive, PII | Authenticated + authorized role | User profiles, license data, conversations |
| RESTRICTED | Security-critical, credentials | Privileged access only, encrypted | RBAC graph, audit events, Keycloak credentials, session data |

## Data Store Summary

| Data Store | Technology | Entity Count | Services | Notes |
|------------|-----------|-------------|----------|-------|
| Neo4j 5.x (Community) | Graph database | [AS-IS] 4 (auth-facade). [TARGET] 0 (auth entities migrate to tenant-service PostgreSQL). | [AS-IS] auth-facade only. [TARGET] None (auth-facade removed). | [AS-IS] RBAC nodes and relationships. [TARGET] Migrated to tenant-service PostgreSQL. |
| PostgreSQL 16 | Relational database | 18 | tenant, user, license, notification, audit, ai, definition, Keycloak | Flyway migrations; tenant_id column isolation |
| PostgreSQL 16 + pgvector | Relational + vector | 1 | ai-service | Vector similarity search for RAG |
| Valkey 8 | Distributed cache | 2 | auth-facade | Ephemeral; TTL-managed |
| **Total** | | **25** | | |
