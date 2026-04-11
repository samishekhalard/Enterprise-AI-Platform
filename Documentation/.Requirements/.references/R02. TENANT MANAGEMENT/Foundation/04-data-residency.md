# R02 Foundation Track — 04 Data Residency / Storage Mapping (As-Is)

**Status:** [AS-IS] Complete factual inventory based on codebase inspection
**Date:** 2026-03-24
**Audit Scope:** Database configuration, Flyway migrations, Docker infrastructure, encryption, retention
**Input:** Services from `03-ownership-boundaries.md`

---

## Storage Systems Overview

| System | Technology | Instance Count | Managed By |
|--------|-----------|---------------|------------|
| Relational DB | PostgreSQL | 1 (shared, per-service DBs in Docker) | [CONTESTED] see below |
| Graph DB | Neo4j | 1 (default) | [CONTESTED] see below |
| Cache | Valkey (Redis-compatible) | 1 (shared) | `backend/docker-compose.yml` |
| Identity Provider | Keycloak | 1 | [CONTESTED] see below |
| Event Streaming | Kafka (Confluent) | 1 | `backend/docker-compose.yml` |

> **[CONTESTED] Infrastructure ownership is contradictory in the repo:**
> - `infrastructure/docker/docker-compose.yml` contains `services: {}` with a comment stating PostgreSQL, Neo4j, and Keycloak are external and must never be started from this repo.
> - `scripts/dev-up.sh` is a 4-stack startup script that actively manages PostgreSQL, Neo4j, Keycloak, and all services via `docker-compose.dev-postgres.yml`, `docker-compose.dev-neo4j.yml`, `docker-compose.dev-keycloak.yml`, and `docker-compose.dev-services.yml`.
> - `README.md` and `backend/auth-facade/README.md` reference repo-managed dev startup flows.
>
> **As-is fact:** Both positions coexist in the repo. The "external" claim and the "repo-managed" startup script are both present.

---

## Service → Storage Mapping

| Service | PostgreSQL DB | Neo4j | Valkey | Keycloak Admin | Kafka |
|---------|--------------|-------|--------|----------------|-------|
| tenant-service | `master_db` | — | — | Yes (`admin-cli`) | producer |
| auth-facade | — | Yes (bolt) | Yes | Yes (`admin-cli`) | producer |
| user-service | `user_db` | — | Yes | Yes (`admin-cli`) | — |
| license-service | `license_db` | — | Yes | — | — |
| audit-service | `audit_db` | — | — | — | consumer |
| notification-service | `notification_db` | — | — | — | consumer |
| ai-service | `ai_db` | — | Yes | — | producer |
| process-service | `process_db` | — | — | — | — |
| definition-service | — | Yes (bolt) | — | — | — |
| api-gateway | — | — | Yes | — | — |

**Evidence:** Each service's `application.yml` under `backend/{service}/src/main/resources/`

---

## PostgreSQL Configuration

### Local Development

All services share a **single PostgreSQL instance** at `localhost:5432`.

- **Primary database:** `master_db` (used by tenant-service and as default fallback)
- **Credentials:** `${DATABASE_USER:postgres}` / `${DATABASE_PASSWORD:postgres}`
- **No database-per-service isolation** in local dev

### Docker Profile

Per-service databases are configured:

| Service | Database | Evidence |
|---------|----------|----------|
| tenant-service | `master_db` | `application.yml` datasource URL |
| user-service | `user_db` | `application.yml` datasource URL |
| license-service | `license_db` | `application.yml` datasource URL |
| audit-service | `audit_db` | `application.yml` datasource URL |
| notification-service | `notification_db` | `application.yml` datasource URL |
| ai-service | `ai_db` | `application.yml` datasource URL |
| process-service | `process_db` | `application.yml` datasource URL |

### Flyway Schema History (Per-Service Isolation)

Each service maintains its own Flyway history table to prevent migration conflicts:

| Service | History Table |
|---------|---------------|
| tenant-service | `flyway_schema_history` (default) |
| user-service | `flyway_schema_history_user` |
| license-service | `flyway_schema_history_license` |
| audit-service | `flyway_schema_history_audit` |
| notification-service | `flyway_schema_history_notification` |
| ai-service | `ai_service_schema_history` |
| process-service | `flyway_schema_history_process` |

### PostgreSQL Extensions Required

| Extension | Used By | Purpose | Evidence |
|-----------|---------|---------|----------|
| `uuid-ossp` | tenant-service, user-service | UUID generation | `V1__create_tenant_tables.sql:7` |
| `pgcrypto` | tenant-service | Cryptographic functions | `V1__create_tenant_tables.sql:9` |
| `pgvector` | ai-service | Vector similarity search (1536-dim) | `V1__ai_agents.sql:4` |

---

## Neo4j Configuration

### Runtime Configuration (Default)

Both auth-facade and definition-service connect to the **same Neo4j bolt endpoint** by default.

| Service | URI | Default DB | Evidence |
|---------|-----|------------|----------|
| auth-facade | `bolt://localhost:7687` (local) / `bolt://neo4j:7687` (docker) | `neo4j` (implicit) | `application.yml:27-31` |
| definition-service | `bolt://localhost:7687` (local) / `bolt://neo4j:7687` (docker) | `neo4j` (implicit) | `application.yml:13-17` |

**Credentials:**
- `${NEO4J_USER:neo4j}` / `${NEO4J_PASSWORD:}` (local, empty default)
- `${NEO4J_PASSWORD:password123}` (docker profile, definition-service)

### [FORK] Graph-Per-Tenant Scaffolding

The codebase contains **feature-flagged graph-per-tenant database routing** that is **disabled by default**:

| Artifact | Purpose | Evidence |
|----------|---------|----------|
| `AuthGraphPerTenantProperties` | Config: `auth.graph-per-tenant.enabled` (default: `false`) | `auth-facade/.../config/AuthGraphPerTenantProperties.java` |
| `TenantAwareAuthDatabaseSelectionProvider` | `DatabaseSelectionProvider` that routes Neo4j queries to tenant-specific databases when enabled | `auth-facade/.../tenant/TenantAwareAuthDatabaseSelectionProvider.java` |
| `AuthTenantProvisioningService` | Provisions tenant-specific Neo4j databases | `auth-facade/.../service/AuthTenantProvisioningService.java` |
| Tenant routing metadata | V7/V8 migrations add database routing columns to tenant-service | `tenant-service/.../db/migration/V7__tenant_database_routing.sql`, `V8__per_service_routing_metadata.sql` |

**As-is fact:** The default runtime uses a single shared Neo4j database. Graph-per-tenant multi-database routing is scaffolded but feature-flagged off. **This is a topology decision that belongs in deliverable 5, not a settled fact.**

### Neo4j Migrations (auth-facade)

Located at `backend/auth-facade/src/main/resources/neo4j/migrations/`:

| Migration | Purpose |
|-----------|---------|
| V001–V007 | Initial graph schema, seed data |
| V008 | Fix master tenant seed + superuser (`BELONGS_TO` edge created here) |

---

## Valkey (Redis) Configuration

### Single Shared Instance

All caching services connect to the same Valkey instance at `localhost:6379` / `valkey:6379`.

| Service | Purpose | TTL | Evidence |
|---------|---------|-----|----------|
| auth-facade | Token blacklist, MFA sessions, routing cache | Session-scoped | `application.yml:15-25` |
| license-service | Seat validation cache | 5 minutes | `application.yml:37-40` |
| user-service | Session validation | Session-scoped | `application.yml:37-40` |
| ai-service | Conversation context cache | Conversation-scoped | `application.yml:39-42` |
| api-gateway | Rate limiting state | Request-scoped | `application.yml:87-90` |

**Docker:** `valkey/valkey:8-alpine`, port 6379, volume `valkey_data:/data`
**Evidence:** `backend/docker-compose.yml:12-25`

**Connection Pool (auth-facade):**
- Lettuce: max-active 10, max-idle 5, min-idle 1
- Timeout: 2000ms
- Password: `${VALKEY_PASSWORD:}` (optional)

---

## Keycloak Configuration

### Three Services Connect to Keycloak Admin API

| Service | Server URL | Admin Credentials | Purpose | Evidence |
|---------|-----------|-------------------|---------|----------|
| auth-facade | `http://localhost:8180` | `${KEYCLOAK_ADMIN:admin}` | JWT validation, realm management | `application.yml:109-118` |
| tenant-service | `http://localhost:8180` | `${KEYCLOAK_ADMIN:admin}` | Realm provisioning, provider config | `application.yml:54-60` |
| user-service | `http://localhost:8180` | `${KEYCLOAK_ADMIN:admin}` | User sync from Keycloak | `application.yml:52-58` |

**JWT Configuration:**
- Issuer URI: `${KEYCLOAK_ISSUER_URI:http://localhost:8180/realms/master}`
- JWKS URI: `${KEYCLOAK_JWKS_URI:http://localhost:8180/realms/master/protocol/openid-connect/certs}`
- Client ID: `ems-auth-facade`

---

## Kafka Configuration

### Event Topics

| Topic | Producer(s) | Consumer | Purpose | Evidence |
|-------|------------|----------|---------|----------|
| `audit-events` | tenant, auth-facade, user, license, ai, process | audit-service (group: `audit-service`) | Audit trail | `audit-service/application.yml:37-43` |
| `notification-events` | tenant, auth-facade, user, license, ai, process | notification-service (group: `notification-service`) | Notifications | `notification-service/application.yml:56-62` |

**Docker:** `confluentinc/cp-kafka:7.6.0`, port 9092 (host) / 29092 (internal)
**Evidence:** `backend/docker-compose.yml:30-55`

---

## Flyway Migration Inventory

### tenant-service (15 migrations)

| File | Tables/Changes |
|------|---------------|
| `V1__create_tenant_tables.sql` | tenants, tenant_domains, tenant_auth_providers, tenant_branding, tenant_session_config, tenant_mfa_config |
| `V2__seed_default_tenant.sql` | Master tenant seed data |
| `V3__add_development_domains.sql` | Development domain records |
| `V4__protect_master_tenant.sql` | Master tenant protection trigger |
| `V7__tenant_database_routing.sql` | Tenant-to-database routing metadata |
| `V8__per_service_routing_metadata.sql` | Per-service routing overrides |
| `V9__add_tenant_branding_neumorphic_fields.sql` | 14 neumorphic design columns |
| `V10__add_component_tokens_jsonb.sql` | PrimeNG component token JSONB |
| `V11__add_tenant_lifecycle_columns.sql` | Lifecycle tracking columns |
| `V12__auth_problem_messages_and_tenant_overrides.sql` | Message catalog |
| `V13__auth_ui_message_catalog.sql` | Auth UI localization |
| `V14__auth_login_label_messages.sql` | Login label strings |
| `V15__add_version_column.sql` | @Version for optimistic locking |

### user-service (4 migrations)

| File | Tables/Changes |
|------|---------------|
| `V1__user_profiles.sql` | user_profiles |
| `V2__user_devices.sql` | user_devices |
| `V3__user_sessions.sql` | user_sessions |
| `V4__add_version_column.sql` | @Version column |

### license-service (4 migrations)

| File | Tables/Changes |
|------|---------------|
| `V1__licenses.sql` | Legacy SaaS tables (dropped in V3) |
| `V2__add_version_column.sql` | @Version column |
| `V3__drop_saas_licensing_tables.sql` | Drop deprecated SaaS tables |
| `V4__create_on_premise_licensing_schema.sql` | license_files, application_licenses, tenant_licenses, tier_seat_allocations, user_license_assignments, revocation_entries |

### audit-service (2 migrations)

| File | Tables/Changes |
|------|---------------|
| `V1__audit_events.sql` | audit_events (13 indexes) |
| `V2__add_correlation_index.sql` | correlation_id index |

### notification-service (2 migrations)

| File | Tables/Changes |
|------|---------------|
| `V1__notifications.sql` | notification_templates, notifications, notification_preferences |
| `V2__add_version_column.sql` | @Version column |

### ai-service (3 migrations)

| File | Tables/Changes |
|------|---------------|
| `V1__ai_agents.sql` | agents, agent_categories, conversations, messages, knowledge_sources, knowledge_chunks |
| `V2__seed_categories.sql` | Seed agent categories |
| `V3__add_version_column.sql` | @Version column |

### process-service (4 migrations)

| File | Tables/Changes |
|------|---------------|
| `V1__create_bpmn_element_types.sql` | bpmn_element_types |
| `V2__seed_bpmn_element_types.sql` | Seed BPMN element definitions |
| `V3__update_bpmn_element_colors.sql` | Update color codes |
| `V4__add_version_column.sql` | @Version column |

---

## Special Data Types

### BYTEA (Binary)

| Table | Column | Service | Content |
|-------|--------|---------|---------|
| `license_files` | `raw_content` | license-service | Complete .lic file |
| `license_files` | `signature` | license-service | Ed25519 signature (~64 bytes) |

### JSONB (33 columns across all services)

| Service | Table | Column(s) | Content |
|---------|-------|-----------|---------|
| tenant-service | tenant_auth_providers | config | Protocol-specific auth settings |
| tenant-service | tenant_branding | component_tokens | PrimeNG token overrides (max 512KB) |
| user-service | user_profiles | mfa_methods | MFA method array |
| user-service | user_devices | last_location | Geolocation (lat/lon) |
| user-service | user_sessions | location | Session geolocation |
| license-service | application_licenses | features, degraded_features | Feature lists |
| license-service | tenant_licenses | features | Tenant feature subset |
| license-service | license_files | payload_json | Decoded license JSON |
| audit-service | audit_events | old_values, new_values, metadata | Change tracking |
| notification-service | notification_templates | variables | Template variable metadata |
| notification-service | notifications | template_data, metadata | Notification payload |
| ai-service | agents | conversation_starters, model_config | AI configuration |
| ai-service | messages | rag_context, metadata | RAG retrieval context |
| ai-service | knowledge_chunks | metadata | Chunk indexing info |

### Vector (pgvector)

| Table | Column | Dimensions | Index | Service |
|-------|--------|-----------|-------|---------|
| `knowledge_chunks` | `embedding` | 1536 | HNSW (cosine) | ai-service |

### TEXT (Unbounded)

| Service | Table | Column(s) |
|---------|-------|-----------|
| ai-service | agents | system_prompt, greeting_message |
| ai-service | messages | content |
| ai-service | knowledge_chunks | content |
| ai-service | knowledge_sources | description, error_message |
| audit-service | audit_events | message, failure_reason |
| notification-service | notification_templates | body_template, body_html_template |
| notification-service | notifications | body, body_html, failure_reason |
| process-service | bpmn_element_types | icon_svg |

---

## Encryption & Security

### Jasypt Encryption

**All 8 domain services** include the Jasypt dependency in their `pom.xml`. Explicit Jasypt configuration blocks appear in:

| Service | Config File | Evidence |
|---------|-------------|----------|
| auth-facade | `application.yml` (production) | `auth-facade/application.yml:47-56` |
| auth-facade | `application-local.yml` | `auth-facade/application-local.yml:28` |
| auth-facade | `application-test.yml` | `auth-facade/test/resources/application-test.yml:32` |
| auth-facade | `application-auth-integration.yml` | `auth-facade/test/resources/application-auth-integration.yml:57` |
| tenant-service | `application-test.yml` | `tenant-service/test/resources/application-test.yml:18` |

**auth-facade production config (most detailed):**

| Setting | Value |
|---------|-------|
| Algorithm | PBEWITHHMACSHA512ANDAES_256 |
| Key | `${JASYPT_PASSWORD}` (no default, required at runtime) |
| Iterations | 1000 |
| Salt | RandomSaltGenerator |
| IV | RandomIvGenerator |
| Output | Base64 |

**Known usage:** auth-facade uses Jasypt for ConfigNode encrypted fields (clientSecretEncrypted, bindPasswordEncrypted, spPrivateKeyEncrypted). Other services include the dependency but their runtime usage has not been audited.

### PII Locations

| Data | Table | Column(s) | Encryption | Retention |
|------|-------|-----------|-----------|-----------|
| User email, names | user_profiles | email, firstName, lastName | None (app-level ACL) | Until user deleted |
| Password hashes | Keycloak | — | bcrypt (Keycloak-managed) | Keycloak retention |
| MFA methods | user_profiles | mfa_methods | None | Until MFA revoked |
| Session tokens | user_sessions | session_token | None (VARCHAR 500) | Until session expires |
| Device location | user_devices | last_location | None (JSONB) | Until device removed |
| Auth provider secrets | ConfigNode (Neo4j) | *Encrypted fields | Jasypt | Until provider disabled |

---

## Data Retention & Lifecycle

### TTL / Expiry Policies

| Entity | TTL | Column | Purge Mechanism | Evidence |
|--------|-----|--------|----------------|----------|
| Audit events | 365 days | `expires_at` | Cron: 02:00 UTC daily | `audit-service/application.yml:60-62` |
| Notifications | User-defined | `expires_at` | Cron: 03:00 UTC daily | `notification-service/application.yml:89` |
| User sessions | 8 hours (default absolute) | `expires_at` | Application-level check | `tenant_session_config` defaults |
| License files | Never deleted | — | Marked `SUPERSEDED` | Append-only design |
| Revocation entries | Never deleted | — | INSERT-only, no UPDATE/DELETE | Immutable by design |

### Immutable Data

| Entity | Service | Write Pattern |
|--------|---------|--------------|
| AuditEventEntity | audit-service | INSERT only, no UPDATE |
| RevocationEntryEntity | license-service | INSERT only, no UPDATE/DELETE |
| MessageRegistryEntity | tenant-service | INSERT only (@CreationTimestamp) |

---

## Key Observations

### 1. Local Dev vs Docker: Different Database Topology

In local development, all services share `master_db`. In Docker, each service has its own database (`ai_db`, `audit_db`, etc.). This means local dev **cannot catch cross-database FK issues** that would surface in Docker.

### 2. [FORK] Neo4j Database Isolation

**Default runtime:** auth-facade and definition-service connect to the same Neo4j bolt endpoint. With graph-per-tenant disabled (default), all graph nodes live in the default `neo4j` database with label-based isolation only.

**Scaffolded alternative:** `AuthGraphPerTenantProperties` (`enabled = false` by default) + `TenantAwareAuthDatabaseSelectionProvider` + tenant routing metadata (V7/V8 migrations) provide a graph-per-tenant multi-database path that is feature-flagged off. This is a topology decision deferred to deliverable 5.

### 3. Valkey Has No Key Namespace Isolation

All services share port 6379 with no database index or key prefix configuration visible. Risk of key collision between services.

### 4. No Row-Level Security

Tenant isolation is enforced at the application level via `X-Tenant-ID` header filtering. No PostgreSQL row-level security (RLS) policies exist in any migration.

### 5. Session Tokens Stored in Plain Text

`user_sessions.session_token` is VARCHAR(500) with no database-level encryption. Security relies on application-level access control only.

### 6. JSONB Column Count Is High (33)

33 JSONB columns across services indicates significant schema flexibility but also potential for schema drift (no JSONB schema validation at DB level).
