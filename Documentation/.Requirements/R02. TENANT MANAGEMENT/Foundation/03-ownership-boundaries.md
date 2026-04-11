# R02 Foundation Track — 03 Ownership Boundaries by Module

**Status:** [AS-IS] audit + [FROZEN] target auth ownership decision
**Date:** 2026-03-24 (as-is audit) | 2026-03-24 (auth decision frozen)
**Audit Scope:** All backend services — entity ownership, API surface, cross-service communication
**Input:** 38 entities from `01-node-inventory.md`, 56 relationships from `02-relationship-inventory.md`

---

## FROZEN: Target Auth Ownership Model (Revision 2)

> **Decision date:** 2026-03-24
> **Revision:** 2 — auth-facade reclassified from "stateless target" to "transition-only, then removed"; api-gateway added as target auth edge
> **Status:** FROZEN — binding for R02 and WP-ARCH-ALIGN

### Target Service Roles

| Service | State | Target Role | Owns |
|---------|-------|------------|------|
| **Keycloak** | TARGET | Authentication only (login, MFA, token issuance, federation) | Realms, credentials, identity provider federation |
| **tenant-service** | TARGET | Tenant aggregate root + tenant users + RBAC + memberships + provider config + session control + revocation + session history | PostgreSQL: tenants, tenant users, roles, groups, memberships, sessions, devices, MFA, branding, domains, auth providers, provider config, provisioning, messages |
| **api-gateway** | TARGET | Edge + target home for auth endpoints after migration | Routes + auth edge endpoints (login, token refresh, logout) migrated from auth-facade |
| **auth-facade** | **[TRANSITION]** — then removed | Current auth orchestrator. Responsibilities migrate to api-gateway (edge) + tenant-service (data/policy). Service is removed after migration. | Neo4j (legacy), Valkey (cache) — both transition-only |
| **user-service** | **[TRANSITION]** — then removed from tenant-user ownership | Current owner of user profiles, devices, sessions. Entities migrate to tenant-service. | PostgreSQL: user_profiles, user_devices, user_sessions (transition only) |
| **Valkey** | TARGET | Cache only — non-authoritative | Tokens, sessions, routing metadata, rate limits |
| **Kafka** | TARGET | Propagation — event delivery | Audit events, notification events |
| **Neo4j** | **Removed from auth target domain.** Remains for definition-service (canonical object types) only. | Auth graph nodes (TenantNode, UserNode, GroupNode, RoleNode, ProviderNode, ConfigNode, ProtocolNode) become legacy/as-is. |

### What This Means for R02

1. **tenant-service** is the single target owner of tenant users, RBAC, group memberships, provider config, session control, revocation, and session history.
2. **api-gateway** is the target home for auth edge endpoints (login, token refresh, logout, MFA verify) — these migrate from auth-facade.
3. **auth-facade** is transition-only. It operates during migration but is not the target. No R02 design may treat auth-facade as an end-state service.
4. **user-service** is transition-only. Its entities (UserProfile, UserDevice, UserSession) migrate to tenant-service. No R02 design may treat user-service as the target user owner.
5. **Neo4j auth graph** (TenantNode, UserNode, GroupNode, RoleNode, etc.) is legacy/as-is. The target model does not use Neo4j for auth. Neo4j remains only for definition-service.
6. **No R02 design may assume** auth-facade is the target auth service, user-service is the target user owner, or that Neo4j is the target RBAC/identity store.

---

## As-Is Service Inventory

---

## Service Inventory

| # | Service | Port | Database | Entity Count | Feign Clients |
|---|---------|------|----------|--------------|---------------|
| 1 | tenant-service | 8082 | PostgreSQL | 11 | 0 |
| 2 | auth-facade | 8081 | Neo4j + Valkey | 7 (graph nodes) | 3 |
| 3 | user-service | 8083 | PostgreSQL | 3 | 0 |
| 4 | license-service | 8085 | PostgreSQL | 6 | 0 |
| 5 | audit-service | 8087 | PostgreSQL | 1 | 0 (Kafka consumer) |
| 6 | notification-service | 8086 | PostgreSQL | 3 | 0 (Kafka consumer) |
| 7 | ai-service | 8088 | PostgreSQL (+ pgvector) | 6 | 0 |
| 8 | process-service | 8089 | PostgreSQL | 1 | 0 |
| 9 | definition-service | 8090 | Neo4j | 2 (graph nodes) | 0 |
| 10 | api-gateway | 8080 | None | 0 | 0 (router) |
| 11 | eureka-server | 8761 | None | 0 | 0 (registry) |
| 12 | common (library) | — | — | 0 | — |

> **Note:** definition-service and its entities (ObjectTypeNode, AttributeTypeNode) were not in deliverable 1. They were discovered during this boundary audit and should be added to the node inventory if the foundation is sealed.

---

## Service Details

### 1. TENANT-SERVICE

**Artifact:** tenant-service
**Package:** `com.ems.tenant`
**Port:** 8082
**Database:** PostgreSQL (`master_db`)
**Migrations:** 13

**Owned Entities:**

| Entity | Table |
|--------|-------|
| TenantEntity | `tenants` |
| TenantDomainEntity | `tenant_domains` |
| TenantAuthProviderEntity | `tenant_auth_providers` |
| TenantBrandingEntity | `tenant_branding` |
| TenantSessionConfigEntity | `tenant_session_config` |
| TenantMFAConfigEntity | `tenant_mfa_config` |
| TenantProvisioningStepEntity | `tenant_provisioning_steps` |
| TenantLocaleEntity | `tenant_locales` |
| TenantMessageTranslationEntity | `tenant_message_translation` |
| MessageRegistryEntity | `message_registry` |
| MessageTranslationEntity | `message_translation` |

**Public API Surface:**

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/tenants` | List tenants (paginated, filtered) |
| GET | `/api/tenants/{tenantId}` | Get tenant by ID |
| POST | `/api/tenants` | Create tenant |
| PUT | `/api/tenants/{tenantId}` | Update tenant |
| DELETE | `/api/tenants/{tenantId}` | Delete tenant |
| POST | `/api/tenants/{tenantId}/lock` | Lock tenant |
| POST | `/api/tenants/{tenantId}/unlock` | Unlock tenant |
| POST | `/api/tenants/{tenantId}/activate` | Activate pending tenant |
| POST | `/api/tenants/{tenantId}/suspend` | Suspend active tenant |
| POST | `/api/tenants/{tenantId}/reactivate` | Reactivate suspended tenant |
| POST | `/api/tenants/{tenantId}/decommission` | Permanently retire tenant |
| GET | `/api/tenants/resolve` | Resolve tenant from hostname |
| GET | `/api/tenants/stats` | Tenant statistics |
| GET | `/api/tenants/validate/slug/{slug}` | Validate slug availability |
| GET | `/api/tenants/validate/short-code/{shortCode}` | Validate short code |
| GET | `/api/tenants/{tenantId}/domains` | List domains |
| POST | `/api/tenants/{tenantId}/domains` | Add domain |
| POST | `/api/tenants/{tenantId}/domains/{domainId}/verify` | Verify domain |
| DELETE | `/api/tenants/{tenantId}/domains/{domainId}` | Remove domain |
| GET | `/api/tenants/{tenantId}/branding` | Get branding config |
| PUT | `/api/tenants/{tenantId}/branding` | Update branding |
| POST | `/api/tenants/{tenantId}/branding/validate` | Validate branding |
| PUT | `/api/tenants/{tenantId}/auth-providers` | Configure auth providers |
| GET | `/api/tenants/{tenantId}/config` | Full tenant config |

**Internal API Surface:**

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/v1/internal/tenants/{tenantId}/routing` | Neo4j routing data (for auth-facade) |
| GET | `/api/v1/internal/messages/{code}` | Message template resolution (i18n) |

**Cross-Service Dependencies:** None outbound. Foundational service.

**Evidence:**
- Main: `backend/tenant-service/src/main/java/com/ems/tenant/TenantServiceApplication.java`
- Controllers: `backend/tenant-service/src/main/java/com/ems/tenant/controller/`

---

### 2. AUTH-FACADE

**Artifact:** auth-facade
**Package:** `com.ems.auth`
**Port:** 8081
**Database:** Neo4j (identity graph), Valkey (session/token cache)

**Owned Entities (Neo4j Graph Nodes):**

| Entity | Neo4j Label |
|--------|-------------|
| TenantNode | `:Tenant` |
| UserNode | `:User` |
| GroupNode | `:Group` |
| RoleNode | `:Role` |
| ProviderNode | `:Provider` |
| ConfigNode | `:Config` |
| ProtocolNode | `:Protocol` |

**Public API Surface:**

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/api/auth/login` | Primary login |
| POST | `/api/auth/mfa/verify` | MFA challenge verification |
| POST | `/api/auth/token/refresh` | Refresh access token |
| POST | `/api/auth/logout` | Token revocation |

**Feign Clients (outbound):**

| Client | Target Service | Endpoint | Purpose | Evidence |
|--------|---------------|----------|---------|----------|
| TenantServiceClient | tenant-service | `GET /api/v1/internal/tenants/{tenantId}/routing` | Fetch tenant routing config | `backend/auth-facade/src/main/java/com/ems/auth/client/TenantServiceClient.java` |
| LicenseServiceClient | license-service | `GET /api/v1/internal/seats/validate` | Validate user seat at login | `backend/auth-facade/src/main/java/com/ems/auth/client/LicenseServiceClient.java` |
| MessageRegistryClient | tenant-service | `GET /api/v1/internal/messages/{code}` | Resolve i18n messages | `backend/auth-facade/src/main/java/com/ems/auth/client/MessageRegistryClient.java` |

**Resilience:** LicenseServiceClient has circuit breaker + time limiter.

**Evidence:**
- Main: `backend/auth-facade/src/main/java/com/ems/auth/AuthFacadeApplication.java`
- Clients: `backend/auth-facade/src/main/java/com/ems/auth/client/`

---

### 3. USER-SERVICE

**Artifact:** user-service
**Package:** `com.ems.user`
**Port:** 8083
**Database:** PostgreSQL (`master_db`)
**Migrations:** 4

**Owned Entities:**

| Entity | Table |
|--------|-------|
| UserProfileEntity | `user_profiles` |
| UserDeviceEntity | `user_devices` |
| UserSessionEntity | `user_sessions` |

**Public API Surface:**

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/v1/users/me` | Get own profile |
| PATCH | `/api/v1/users/me` | Update own profile |
| GET | `/api/v1/users/me/sessions` | List own sessions |
| DELETE | `/api/v1/users/me/sessions/{sessionId}` | Revoke own session |
| GET | `/api/v1/users/me/devices` | List own devices |
| POST | `/api/v1/users/me/devices/{deviceId}/trust` | Trust device |
| DELETE | `/api/v1/users/me/devices/{deviceId}` | Remove device |
| GET | `/api/v1/users` | List users (admin) |
| GET | `/api/v1/users/{userId}` | Get user (admin) |
| POST | `/api/v1/users` | Create user (admin) |
| PATCH | `/api/v1/users/{userId}` | Update user (admin) |
| DELETE | `/api/v1/users/{userId}` | Delete user (admin) |
| POST | `/api/v1/users/{userId}/enable` | Enable user |
| POST | `/api/v1/users/{userId}/disable` | Disable user |
| GET | `/api/v1/users/{userId}/sessions` | List user sessions (admin) |
| DELETE | `/api/v1/users/{userId}/sessions` | Revoke all sessions (admin) |
| GET | `/api/v1/users/{userId}/devices` | List devices (admin) |
| POST | `/api/v1/users/{userId}/devices/{deviceId}/block` | Block device |
| POST | `/api/v1/users/{userId}/devices/{deviceId}/approve` | Approve device |
| GET | `/api/v1/admin/sessions` | All tenant sessions |
| DELETE | `/api/v1/admin/sessions` | Revoke all tenant sessions |

**Internal API Surface:**

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/api/v1/internal/users/{keycloakId}/sync` | Sync user from Keycloak |

**Cross-Service Dependencies:** None outbound. Syncs from Keycloak directly.

**Evidence:**
- Main: `backend/user-service/src/main/java/com/ems/user/UserServiceApplication.java`
- Controller: `backend/user-service/src/main/java/com/ems/user/controller/UserController.java`

---

### 4. LICENSE-SERVICE

**Artifact:** license-service
**Package:** `com.ems.license`
**Port:** 8085
**Database:** PostgreSQL (`master_db`)
**Migrations:** 4

**Owned Entities:**

| Entity | Table |
|--------|-------|
| LicenseFileEntity | `license_files` |
| ApplicationLicenseEntity | `application_licenses` |
| TenantLicenseEntity | `tenant_licenses` |
| TierSeatAllocationEntity | `tier_seat_allocations` |
| UserLicenseAssignmentEntity | `user_license_assignments` |
| RevocationEntryEntity | `revocation_entries` |

**Public API Surface:**

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/v1/admin/licenses/tenant/{tenantId}` | Get tenant license |
| PUT | `/api/v1/admin/licenses/tenant/{tenantId}` | Update tenant license |
| POST | `/api/v1/admin/licenses/tenant/{tenantId}/revoke` | Revoke tenant license |
| POST | `/api/v1/seats` | Assign seat |
| DELETE | `/api/v1/seats/{seatId}` | Revoke seat |
| GET | `/api/v1/seats/user/{userId}` | Get user seats |
| GET | `/api/v1/features/user` | User's features |
| GET | `/api/v1/features/tenant` | Tenant's feature gates |
| GET | `/api/v1/public/features` | Public feature list |

**Internal API Surface:**

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/v1/internal/seats/validate` | Validate user seat (for auth-facade) |
| DELETE | `/api/v1/internal/seats/cache` | Invalidate seat cache |

**Cross-Service Dependencies:** None outbound. Queried by auth-facade.

**Evidence:**
- Main: `backend/license-service/src/main/java/com/ems/license/LicenseServiceApplication.java`
- Controllers: `backend/license-service/src/main/java/com/ems/license/controller/`

---

### 5. AUDIT-SERVICE

**Artifact:** audit-service
**Package:** `com.ems.audit`
**Port:** 8087
**Database:** PostgreSQL (`master_db`)
**Migrations:** 2

**Owned Entities:**

| Entity | Table |
|--------|-------|
| AuditEventEntity | `audit_events` |

**Public API Surface:**

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/v1/audit/events` | Query audit events (filtered) |
| GET | `/api/v1/audit/events/{eventId}` | Get event details |
| GET | `/api/v1/audit/events/export` | Export audit log (CSV) |

**Async Consumption (Kafka):**

| Topic | Listener | Purpose | Evidence |
|-------|----------|---------|----------|
| `audit-events` | `AuditEventListener` | Consume audit events from all services | `backend/audit-service/src/main/java/com/ems/audit/listener/AuditEventListener.java` |

**Cross-Service Dependencies:** Kafka consumer only. No Feign clients.

**Evidence:**
- Main: `backend/audit-service/src/main/java/com/ems/audit/AuditServiceApplication.java`
- Controller: `backend/audit-service/src/main/java/com/ems/audit/controller/AuditController.java`

---

### 6. NOTIFICATION-SERVICE

**Artifact:** notification-service
**Package:** `com.ems.notification`
**Port:** 8086
**Database:** PostgreSQL (`master_db`)
**Migrations:** 2

**Owned Entities:**

| Entity | Table |
|--------|-------|
| NotificationEntity | `notifications` |
| NotificationTemplateEntity | `notification_templates` |
| NotificationPreferenceEntity | `notification_preferences` |

**Public API Surface:**

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/api/v1/notifications/send` | Send notification |
| GET | `/api/v1/notifications` | List notifications |
| GET | `/api/v1/notifications/preferences/me` | Get preferences |
| PUT | `/api/v1/notifications/preferences/me` | Update preferences |
| GET | `/api/v1/notifications/templates` | List templates (admin) |
| POST | `/api/v1/notifications/templates` | Create template (admin) |
| PUT | `/api/v1/notifications/templates/{templateId}` | Update template (admin) |

**Async Consumption (Kafka):**

| Topic | Listener | Purpose | Evidence |
|-------|----------|---------|----------|
| `notification-events` | `NotificationEventListener` | Consume notification requests from all services | `backend/notification-service/src/main/java/com/ems/notification/listener/NotificationEventListener.java` |

**Cross-Service Dependencies:** Kafka consumer only. No Feign clients.

**Evidence:**
- Main: `backend/notification-service/src/main/java/com/ems/notification/NotificationServiceApplication.java`
- Controllers: `backend/notification-service/src/main/java/com/ems/notification/controller/`

---

### 7. AI-SERVICE

**Artifact:** ai-service
**Package:** `com.ems.ai`
**Port:** 8088
**Database:** PostgreSQL (`master_db`, pgvector extension)
**Migrations:** 3

**Owned Entities:**

| Entity | Table |
|--------|-------|
| AgentEntity | `agents` |
| AgentCategoryEntity | `agent_categories` |
| ConversationEntity | `conversations` |
| MessageEntity | `messages` |
| KnowledgeSourceEntity | `knowledge_sources` |
| KnowledgeChunkEntity | `knowledge_chunks` |

**Public API Surface:**

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/api/v1/conversations` | Start conversation |
| GET | `/api/v1/conversations/{conversationId}` | Get conversation |
| POST | `/api/v1/conversations/{conversationId}/messages` | Send message |
| GET | `/api/v1/agents` | List agents |
| GET | `/api/v1/agents/{agentId}` | Get agent |
| POST | `/api/v1/agents` | Create agent (admin) |
| PUT | `/api/v1/agents/{agentId}` | Update agent (admin) |
| POST | `/api/v1/agents/{agentId}/knowledge/upload` | Upload knowledge source |
| GET | `/api/v1/agents/{agentId}/knowledge` | List knowledge sources |
| DELETE | `/api/v1/agents/{agentId}/knowledge/{sourceId}` | Remove source |
| GET | `/api/v1/ai/providers` | List LLM providers |

**Cross-Service Dependencies:** None outbound. Standalone service.

**Evidence:**
- Main: `backend/ai-service/src/main/java/com/ems/ai/AiServiceApplication.java`
- Controllers: `backend/ai-service/src/main/java/com/ems/ai/controller/`

---

### 8. PROCESS-SERVICE

**Artifact:** process-service
**Package:** `com.ems.process`
**Port:** 8089
**Database:** PostgreSQL (`master_db`)
**Migrations:** 4

**Owned Entities:**

| Entity | Table |
|--------|-------|
| BpmnElementTypeEntity | `bpmn_element_types` |

**Public API Surface:**

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/v1/bpmn/definitions` | List BPMN definitions |
| GET | `/api/v1/bpmn/definitions/{definitionId}` | Get definition |
| POST | `/api/v1/bpmn/definitions` | Create definition (admin) |
| POST | `/api/v1/bpmn/processes` | Start process instance |

**Cross-Service Dependencies:** None outbound. Standalone service.

**Evidence:**
- Main: `backend/process-service/src/main/java/com/ems/process/ProcessServiceApplication.java`
- Controller: `backend/process-service/src/main/java/com/ems/process/controller/BpmnElementTypeController.java`

---

### 9. DEFINITION-SERVICE

**Artifact:** definition-service
**Package:** `com.ems.definition`
**Port:** 8090
**Database:** Neo4j (graph database for canonical schema metadata)

> **Note:** This service was not covered in `01-node-inventory.md`. Its entities (ObjectTypeNode, AttributeTypeNode) should be added if the foundation is sealed.

**Owned Entities (Neo4j):**

| Entity | Neo4j Label |
|--------|-------------|
| ObjectTypeNode | `:ObjectType` |
| AttributeTypeNode | `:AttributeType` |

**Public API Surface:**

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/v1/definitions/objects` | List object types (platform-wide) |
| GET | `/api/v1/definitions/objects/{objectTypeId}` | Get type definition |
| POST | `/api/v1/definitions/objects` | Create type (platform admin) |
| PUT | `/api/v1/definitions/objects/{objectTypeId}` | Update type |
| GET | `/api/v1/definitions/attributes/{objectTypeId}` | Get attributes for type |
| POST | `/api/v1/definitions/attributes` | Add attribute (platform admin) |

**Cross-Service Dependencies:** None outbound. Read-only canonical model.

**Evidence:**
- Main: `backend/definition-service/src/main/java/com/ems/definition/DefinitionServiceApplication.java`
- Controllers: `backend/definition-service/src/main/java/com/ems/definition/controller/`

---

### 10. API-GATEWAY

**Artifact:** api-gateway
**Package:** `com.ems.gateway`
**Port:** 8080
**Type:** Spring Cloud Gateway (stateless router)

**Routing Table:**

| Route Pattern | Target | Discovery |
|---------------|--------|-----------|
| `/services/auth/**` | `lb://AUTH-FACADE` | Eureka |
| `/services/tenants/**` | `lb://TENANT-SERVICE` | Eureka |
| `/services/users/**` | `lb://USER-SERVICE` | Eureka |
| `/services/licenses/**` | `lb://LICENSE-SERVICE` | Eureka |
| `/services/audit/**` | `lb://AUDIT-SERVICE` | Eureka |
| `/services/ai/**` | `lb://AI-SERVICE` | Eureka |
| `/services/definitions/**` | `lb://DEFINITION-SERVICE` | Eureka |

**Evidence:**
- Main: `backend/api-gateway/src/main/java/com/ems/gateway/ApiGatewayApplication.java`
- Config: `backend/api-gateway/src/main/resources/application.yml`

---

### 11. EUREKA-SERVER

**Artifact:** eureka-server
**Port:** 8761
**Type:** Spring Cloud Netflix Eureka (service registry)
**Evidence:** `backend/eureka-server/src/main/java/com/ems/registry/EurekaServerApplication.java`

---

### 12. COMMON (Shared Library)

**Artifact:** ems-common
**Package:** `com.ems.common`
**Type:** Shared library (not a standalone service)
**Contains:** Common DTOs, exception types, enums (TenantStatus, TenantType, etc.), utility classes
**Evidence:** `backend/common/pom.xml`

---

## Cross-Service Communication Matrix

```
                    tenant  auth   user   license  audit  notif  ai  process  defn  gateway
tenant-service        —      ·      ·       ·       K→     K→    ·     ·       ·      ·
auth-facade          F←      —      ·      F←       K→     K→    ·     ·       ·      ·
user-service          ·      ·      —       ·       K→     K→    ·     ·       ·      ·
license-service       ·      ·      ·       —       K→     K→    ·     ·       ·      ·
audit-service         ·      ·      ·       ·        —      ·    ·     ·       ·      ·
notification-service  ·      ·      ·       ·        ·      —    ·     ·       ·      ·
ai-service            ·      ·      ·       ·       K→     K→    —     ·       ·      ·
process-service       ·      ·      ·       ·       K→     K→    ·     —       ·      ·
definition-service    ·      ·      ·       ·        ·      ·    ·     ·       —      ·
api-gateway           R→     R→     R→      R→       R→     R→   R→    R→      R→     —
```

**Legend:** `F←` = Feign client call, `K→` = Kafka event publish, `R→` = Gateway route, `·` = no dependency

---

## Database Ownership Summary

| Database | Services | Purpose |
|----------|----------|---------|
| PostgreSQL (`master_db`) | tenant, user, license, audit, notification, ai, process | All relational data. Flyway migrations scoped per service. |
| Neo4j | auth-facade, definition-service | Identity graph (auth), canonical object types (definitions) |
| Valkey (Redis) | auth-facade, user, license, ai, notification, gateway | Sessions, tokens, caches, rate limits |
| Keycloak | auth-facade, user-service, tenant-service | Master identity provider (realms, users, roles) |

---

## Key Observations

### 1. Single Shared PostgreSQL Database

All 7 SQL-based services share `master_db`. Flyway migrations are scoped per service with unique `flyway_schema_history` tables to avoid conflicts. There is no physical database-per-service isolation.

### 2. auth-facade Is the Only Service With Outbound Feign Calls

Only auth-facade makes synchronous cross-service HTTP calls (to tenant-service and license-service). All other inter-service communication is async via Kafka.

### 3. Dependency Direction Is Clean

No circular dependencies. The dependency graph is acyclic:
- **Foundation tier:** tenant-service, definition-service (no outbound dependencies)
- **Identity tier:** auth-facade (depends on tenant-service, license-service)
- **Domain tier:** user-service, license-service, ai-service, process-service (standalone)
- **Cross-cutting tier:** audit-service, notification-service (Kafka consumers only)
- **Edge tier:** api-gateway, eureka-server (infrastructure)

### 4. definition-service Not in Node Inventory

This service owns 2 Neo4j node types (ObjectTypeNode, AttributeTypeNode) that were not discovered in deliverable 1. The node inventory should be updated if the foundation is sealed.

### 5. Tenant Isolation Is Header-Based

All tenant-scoped services read `X-Tenant-ID` from the request header. There is no database-level tenant isolation (row-level security or separate schemas). Enforcement is application-level.
