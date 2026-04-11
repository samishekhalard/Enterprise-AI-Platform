# R02 Foundation Track — 02 Relationship Inventory (As-Is)

**Status:** [AS-IS] Complete factual inventory based on codebase inspection
**Date:** 2026-03-24
**Audit Scope:** JPA annotations, Neo4j @Relationship, Flyway migrations, cross-service soft references
**Input:** 38 entities from `01-node-inventory.md`

---

## Relationship Totals

| Category | Count |
|----------|-------|
| Database-level FKs (PostgreSQL) | 20 |
| Neo4j graph relationships | 9 |
| Cross-service soft references | 27 |
| **Grand Total** | **56** |

> Counts above are **unique directional edges**, not bidirectional pairs.

---

## TENANT SERVICE — PostgreSQL FK Relationships

### Tenant → TenantDomain (1:N, bidirectional)

| Attribute | Value |
|-----------|-------|
| Parent annotation | `@OneToMany(mappedBy = "tenant", cascade = ALL, orphanRemoval = true)` |
| Child annotation | `@ManyToOne(fetch = LAZY)` + `@JoinColumn(name = "tenant_id", nullable = false)` |
| FK column | `tenant_domains.tenant_id` → `tenants.id` |
| ON DELETE | CASCADE (migration) |
| Evidence (parent) | `TenantEntity.java:100-102` |
| Evidence (child) | `TenantDomainEntity.java:25-27` |
| Evidence (SQL) | `V1__create_tenant_tables.sql:41` |

### Tenant → TenantAuthProvider (1:N, bidirectional)

| Attribute | Value |
|-----------|-------|
| Parent annotation | `@OneToMany(mappedBy = "tenant", cascade = ALL, orphanRemoval = true)` |
| Child annotation | `@ManyToOne(fetch = LAZY)` + `@JoinColumn(name = "tenant_id", nullable = false)` |
| FK column | `tenant_auth_providers.tenant_id` → `tenants.id` |
| ON DELETE | CASCADE (migration) |
| Evidence (parent) | `TenantEntity.java:104-106` |
| Evidence (child) | `TenantAuthProviderEntity.java:28-30` |
| Evidence (SQL) | `V1__create_tenant_tables.sql:63` |

### Tenant → TenantBranding (1:1, bidirectional, shared PK)

| Attribute | Value |
|-----------|-------|
| Parent annotation | `@OneToOne(mappedBy = "tenant", cascade = ALL, orphanRemoval = true)` |
| Child annotation | `@OneToOne(fetch = LAZY)` + `@MapsId` + `@JoinColumn(name = "tenant_id")` |
| FK column | `tenant_branding.tenant_id` = `tenants.id` (shared PK) |
| ON DELETE | CASCADE (migration) |
| Evidence (parent) | `TenantEntity.java:108-109` |
| Evidence (child) | `TenantBrandingEntity.java:24-27` |
| Evidence (SQL) | `V1__create_tenant_tables.sql:84` |

### Tenant → TenantSessionConfig (1:1, bidirectional, shared PK)

| Attribute | Value |
|-----------|-------|
| Parent annotation | `@OneToOne(mappedBy = "tenant", cascade = ALL, orphanRemoval = true)` |
| Child annotation | `@OneToOne(fetch = LAZY)` + `@MapsId` + `@JoinColumn(name = "tenant_id")` |
| FK column | `tenant_session_config.tenant_id` = `tenants.id` (shared PK) |
| ON DELETE | CASCADE (migration) |
| Evidence (parent) | `TenantEntity.java:111-112` |
| Evidence (child) | `TenantSessionConfigEntity.java:22-25` |
| Evidence (SQL) | `V1__create_tenant_tables.sql:101` |

### Tenant → TenantMFAConfig (1:1, bidirectional, shared PK)

| Attribute | Value |
|-----------|-------|
| Parent annotation | `@OneToOne(mappedBy = "tenant", cascade = ALL, orphanRemoval = true)` |
| Child annotation | `@OneToOne(fetch = LAZY)` + `@MapsId` + `@JoinColumn(name = "tenant_id")` |
| FK column | `tenant_mfa_config.tenant_id` = `tenants.id` (shared PK) |
| ON DELETE | CASCADE (migration) |
| Evidence (parent) | `TenantEntity.java:114-115` |
| Evidence (child) | `TenantMFAConfigEntity.java:26-29` |
| Evidence (SQL) | `V1__create_tenant_tables.sql:114` |

### Standalone Entities (no JPA relationships)

| Entity | PK Strategy | Notes |
|--------|-------------|-------|
| MessageRegistryEntity | `code` (VARCHAR 20) | Immutable, no FK |
| MessageTranslationEntity | Composite `@IdClass(code, localeCode)` | No JPA FK to MessageRegistry |
| TenantLocaleEntity | Composite `@IdClass(tenantUuid, localeCode)` | `tenantUuid` is soft ref (no FK) |
| TenantMessageTranslationEntity | Composite `@IdClass(tenantUuid, code, localeCode)` | `tenantUuid` is soft ref (no FK) |
| TenantProvisioningStepEntity | Auto-increment Long | `tenantUuid` is soft ref (no FK) |

---

## USER SERVICE — PostgreSQL FK Relationships

### UserProfile → UserDevice (1:N, bidirectional)

| Attribute | Value |
|-----------|-------|
| Parent annotation | `@OneToMany(mappedBy = "user", cascade = ALL, orphanRemoval = true)` |
| Child annotation | `@ManyToOne(fetch = LAZY)` + `@JoinColumn(name = "user_id", nullable = false)` |
| FK column | `user_devices.user_id` → `user_profiles.id` |
| ON DELETE | CASCADE (migration) |
| Evidence (parent) | `UserProfileEntity.java:132-134` |
| Evidence (child) | `UserDeviceEntity.java:35-37` |
| Evidence (SQL) | `V2__user_devices.sql:7` |

### UserProfile → UserProfile (N:1, self-referential)

| Attribute | Value |
|-----------|-------|
| Annotation | None (implicit via migration) |
| FK column | `user_profiles.manager_id` → `user_profiles.id` |
| ON DELETE | Not specified (defaults to NO ACTION) |
| Cascade | None |
| Direction | Unidirectional (no inverse side) |
| Nullable | Yes |
| Evidence (entity) | `UserProfileEntity.java:78-79` |
| Evidence (SQL) | `V1__user_profiles.sql:25` |

### Standalone Entities

| Entity | Notes |
|--------|-------|
| UserSessionEntity | All references (userId, tenantId, deviceId) are soft — no JPA annotations, no DB FK |

---

## LICENSE SERVICE — PostgreSQL FK Relationships

### LicenseFile ↔ ApplicationLicense (1:1, bidirectional)

| Attribute | Value |
|-----------|-------|
| Parent annotation | `@OneToOne(mappedBy = "licenseFile", cascade = ALL, orphanRemoval = true, fetch = LAZY)` |
| Child annotation | `@OneToOne(fetch = LAZY)` + `@JoinColumn(name = "license_file_id", nullable = false, unique = true)` |
| FK column | `application_licenses.license_file_id` → `license_files.id` |
| ON DELETE | CASCADE (migration) |
| Evidence (parent) | `LicenseFileEntity.java:107-108` |
| Evidence (child) | `ApplicationLicenseEntity.java:36-38` |
| Evidence (SQL) | `V4__create_on_premise_licensing_schema.sql:125-126` |

### ApplicationLicense → TenantLicense (1:N, bidirectional)

| Attribute | Value |
|-----------|-------|
| Parent annotation | `@OneToMany(mappedBy = "applicationLicense", cascade = ALL, orphanRemoval = true)` |
| Child annotation | `@ManyToOne(fetch = LAZY)` + `@JoinColumn(name = "application_license_id", nullable = false)` |
| FK column | `tenant_licenses.application_license_id` → `application_licenses.id` |
| ON DELETE | CASCADE (migration) |
| Evidence (parent) | `ApplicationLicenseEntity.java:95-97` |
| Evidence (child) | `TenantLicenseEntity.java:44-46` |
| Evidence (SQL) | `V4__create_on_premise_licensing_schema.sql:184-185` |

### TenantLicense → TierSeatAllocation (1:N, bidirectional)

| Attribute | Value |
|-----------|-------|
| Parent annotation | `@OneToMany(mappedBy = "tenantLicense", cascade = ALL, orphanRemoval = true)` |
| Child annotation | `@ManyToOne(fetch = LAZY)` + `@JoinColumn(name = "tenant_license_id", nullable = false)` |
| FK column | `tier_seat_allocations.tenant_license_id` → `tenant_licenses.id` |
| ON DELETE | CASCADE (migration) |
| Unique constraint | (tenantLicenseId, tier) — exactly 4 records per license |
| Evidence (parent) | `TenantLicenseEntity.java:80-82` |
| Evidence (child) | `TierSeatAllocationEntity.java:38-40` |
| Evidence (SQL) | `V4__create_on_premise_licensing_schema.sql:225-226` |

### TenantLicense → UserLicenseAssignment (1:N, bidirectional)

| Attribute | Value |
|-----------|-------|
| Parent annotation | `@OneToMany(mappedBy = "tenantLicense", cascade = ALL)` — **no orphanRemoval** |
| Child annotation | `@ManyToOne(fetch = LAZY)` + `@JoinColumn(name = "tenant_license_id", nullable = false)` |
| FK column | `user_license_assignments.tenant_license_id` → `tenant_licenses.id` |
| ON DELETE | CASCADE (migration) |
| Unique constraint | (userId, tenantId) — one seat per user per tenant |
| Evidence (parent) | `TenantLicenseEntity.java:85-87` |
| Evidence (child) | `UserLicenseAssignmentEntity.java:42-44` |
| Evidence (SQL) | `V4__create_on_premise_licensing_schema.sql:284-285` |

### Standalone Entities

| Entity | Notes |
|--------|-------|
| RevocationEntryEntity | No JPA relationships. Immutable. `revokedLicenseId` matches `license_files.licenseId` by convention only. |

---

## NOTIFICATION SERVICE — PostgreSQL FK Relationships

### Notification → NotificationTemplate (N:1, implicit)

| Attribute | Value |
|-----------|-------|
| JPA annotation | **None** — `templateId` is a bare UUID column, no `@ManyToOne` |
| FK column | `notifications.template_id` → `notification_templates.id` |
| ON DELETE | Not specified (defaults to NO ACTION) |
| Direction | Unidirectional (no inverse side) |
| Evidence (entity) | `NotificationEntity.java:57-58` |
| Evidence (SQL) | `V1__notifications.sql:53` |

**Anomaly:** DB-level FK exists but JPA annotation is missing. Hibernate won't manage this relationship.

### Standalone Entities

| Entity | Notes |
|--------|-------|
| NotificationTemplateEntity | No JPA relationships. `tenantId` is soft ref. |
| NotificationPreferenceEntity | No JPA relationships. `tenantId` and `userId` are soft refs. |

---

## AUDIT SERVICE — No FK Relationships

| Entity | Notes |
|--------|-------|
| AuditEventEntity | Immutable log. All references (tenantId, userId) are soft. No FK constraints. |

---

## AI SERVICE — PostgreSQL FK Relationships

### Agent → AgentCategory (N:1, unidirectional)

| Attribute | Value |
|-----------|-------|
| Annotation | `@ManyToOne(fetch = LAZY)` + `@JoinColumn(name = "category_id")` |
| FK column | `agents.category_id` → `agent_categories.id` |
| ON DELETE | Not specified (defaults to NO ACTION) |
| Nullable | Yes |
| Direction | Unidirectional (no inverse side on AgentCategory) |
| Evidence (entity) | `AgentEntity.java:75-77` |
| Evidence (SQL) | `V1__ai_agents.sql:34` |

### Agent → KnowledgeSource (1:N, bidirectional)

| Attribute | Value |
|-----------|-------|
| Parent annotation | `@OneToMany(mappedBy = "agent", cascade = ALL, orphanRemoval = true)` |
| Child annotation | `@ManyToOne(fetch = LAZY)` + `@JoinColumn(name = "agent_id", nullable = false)` |
| FK column | `knowledge_sources.agent_id` → `agents.id` |
| ON DELETE | CASCADE (migration) |
| Evidence (parent) | `AgentEntity.java:108-110` |
| Evidence (child) | `KnowledgeSourceEntity.java:30-32` |
| Evidence (SQL) | `V1__ai_agents.sql:99` |

### KnowledgeSource → KnowledgeChunk (1:N, bidirectional)

| Attribute | Value |
|-----------|-------|
| Parent annotation | `@OneToMany(mappedBy = "source", cascade = ALL, orphanRemoval = true)` |
| Child annotation | `@ManyToOne(fetch = LAZY)` + `@JoinColumn(name = "source_id", nullable = false)` |
| FK column | `knowledge_chunks.source_id` → `knowledge_sources.id` |
| ON DELETE | CASCADE (migration) |
| Evidence (parent) | `KnowledgeSourceEntity.java:83-85` |
| Evidence (child) | `KnowledgeChunkEntity.java:30-32` |
| Evidence (SQL) | `V1__ai_agents.sql:128` |

### Conversation → Agent (N:1, unidirectional)

| Attribute | Value |
|-----------|-------|
| Annotation | `@ManyToOne(fetch = LAZY)` + `@JoinColumn(name = "agent_id", nullable = false)` |
| FK column | `conversations.agent_id` → `agents.id` |
| ON DELETE | CASCADE (migration) |
| Direction | Unidirectional (no inverse side on Agent) |
| Evidence (entity) | `ConversationEntity.java:37-39` |
| Evidence (SQL) | `V1__ai_agents.sql:59` |

### Conversation → Message (1:N, bidirectional)

| Attribute | Value |
|-----------|-------|
| Parent annotation | `@OneToMany(mappedBy = "conversation", cascade = ALL, orphanRemoval = true)` + `@OrderBy("createdAt ASC")` |
| Child annotation | `@ManyToOne(fetch = LAZY)` + `@JoinColumn(name = "conversation_id", nullable = false)` |
| FK column | `messages.conversation_id` → `conversations.id` |
| ON DELETE | CASCADE (migration) |
| Evidence (parent) | `ConversationEntity.java:68-71` |
| Evidence (child) | `MessageEntity.java:29-31` |
| Evidence (SQL) | `V1__ai_agents.sql:81` |

### KnowledgeChunk.agentId (denormalized, no FK)

| Attribute | Value |
|-----------|-------|
| Column | `knowledge_chunks.agent_id` (UUID) |
| JPA annotation | None — bare column |
| FK constraint | None in migration |
| Purpose | Denormalized from `source_id` → `knowledge_sources.agent_id` for query performance |
| Evidence | `KnowledgeChunkEntity.java:34-35`, `V1__ai_agents.sql:129` |

### Standalone Entities

| Entity | Notes |
|--------|-------|
| AgentCategoryEntity | No outgoing relationships. Referenced by Agent.categoryId. |

---

## PROCESS SERVICE — No FK Relationships

| Entity | Notes |
|--------|-------|
| BpmnElementTypeEntity | `tenantId` is soft ref (nullable). No FK constraints. |

---

## AUTH FACADE — Neo4j Graph Relationships

### TenantNode -[:USES]→ ProviderNode

| Attribute | Value |
|-----------|-------|
| Annotation | `@Relationship(type = "USES", direction = OUTGOING)` |
| Cardinality | 1:N |
| Direction | Unidirectional (OUTGOING) |
| Evidence | `TenantNode.java:50-51` |

### TenantNode -[:CONFIGURED_WITH]→ ConfigNode

| Attribute | Value |
|-----------|-------|
| Annotation | `@Relationship(type = "CONFIGURED_WITH", direction = OUTGOING)` |
| Cardinality | 1:N |
| Direction | Unidirectional (OUTGOING) |
| Evidence | `TenantNode.java:56-57` |

### UserNode -[:MEMBER_OF]→ GroupNode

| Attribute | Value |
|-----------|-------|
| Annotation | `@Relationship(type = "MEMBER_OF", direction = OUTGOING)` |
| Cardinality | N:N |
| Direction | Unidirectional (OUTGOING) |
| Evidence | `UserNode.java:75-76` |

### UserNode -[:HAS_ROLE]→ RoleNode

| Attribute | Value |
|-----------|-------|
| Annotation | `@Relationship(type = "HAS_ROLE", direction = OUTGOING)` |
| Cardinality | N:N |
| Direction | Unidirectional (OUTGOING) |
| Evidence | `UserNode.java:81-82` |

### GroupNode -[:HAS_ROLE]→ RoleNode

| Attribute | Value |
|-----------|-------|
| Annotation | `@Relationship(type = "HAS_ROLE", direction = OUTGOING)` |
| Cardinality | N:N |
| Direction | Unidirectional (OUTGOING) |
| Evidence | `GroupNode.java:60-61` |

### GroupNode -[:CHILD_OF]→ GroupNode (self-referential)

| Attribute | Value |
|-----------|-------|
| Annotation | `@Relationship(type = "CHILD_OF", direction = OUTGOING)` |
| Cardinality | N:N (nested hierarchy) |
| Direction | Unidirectional (OUTGOING) |
| Evidence | `GroupNode.java:66-67` |

### RoleNode -[:INHERITS_FROM]→ RoleNode (self-referential)

| Attribute | Value |
|-----------|-------|
| Annotation | `@Relationship(type = "INHERITS_FROM", direction = OUTGOING)` |
| Cardinality | N:N (transitive inheritance) |
| Direction | Unidirectional (OUTGOING) |
| Evidence | `RoleNode.java:58-59` |

### ProviderNode -[:SUPPORTS]→ ProtocolNode

| Attribute | Value |
|-----------|-------|
| Annotation | `@Relationship(type = "SUPPORTS", direction = OUTGOING)` |
| Cardinality | 1:N |
| Direction | Unidirectional (OUTGOING) |
| Evidence | `ProviderNode.java:53-54` |

### ProviderNode -[:HAS_CONFIG]→ ConfigNode

| Attribute | Value |
|-----------|-------|
| Annotation | `@Relationship(type = "HAS_CONFIG", direction = OUTGOING)` |
| Cardinality | 1:N |
| Direction | Unidirectional (OUTGOING) |
| Evidence | `ProviderNode.java:59-60` |

---

## Cross-Service Soft References

These are fields that reference entities in other services **without** a DB-level FK constraint. Enforcement is application-level only.

### tenant-service → (referenced BY other services)

Every service except auth-facade references `tenantId` as a soft key:

| Referencing Entity | Field | Type | Evidence |
|---|---|---|---|
| UserProfileEntity | `tenantId` | VARCHAR 50 | `UserProfileEntity.java:36` |
| UserDeviceEntity | `tenantId` | VARCHAR 50 | `UserDeviceEntity.java:39` |
| UserSessionEntity | `tenantId` | VARCHAR 50 | `UserSessionEntity.java:35` |
| TenantLicenseEntity | `tenantId` | VARCHAR 50 | `TenantLicenseEntity.java:50` |
| UserLicenseAssignmentEntity | `tenantId` | VARCHAR 50 | `UserLicenseAssignmentEntity.java:51` |
| NotificationEntity | `tenantId` | VARCHAR 50 | `NotificationEntity.java:33` |
| NotificationTemplateEntity | `tenantId` | VARCHAR 50 (nullable) | `NotificationTemplateEntity.java:31` |
| NotificationPreferenceEntity | `tenantId` | VARCHAR 50 | `NotificationPreferenceEntity.java:26` |
| AuditEventEntity | `tenantId` | VARCHAR 50 | `AuditEventEntity.java:34` |
| AgentEntity | `tenantId` | VARCHAR 50 | `AgentEntity.java:34` |
| ConversationEntity | `tenantId` | VARCHAR 50 | `ConversationEntity.java:31` |
| KnowledgeSourceEntity | `tenantId` | VARCHAR 50 | `KnowledgeSourceEntity.java:34` |
| BpmnElementTypeEntity | `tenantId` | VARCHAR 50 (nullable) | `BpmnElementTypeEntity.java:34` |
| TenantLocaleEntity | `tenantUuid` | UUID | `TenantLocaleEntity.java` |
| TenantMessageTranslationEntity | `tenantUuid` | UUID | `TenantMessageTranslationEntity.java` |
| TenantProvisioningStepEntity | `tenantUuid` | UUID | `TenantProvisioningStepEntity.java:35` |

**Note:** tenant-service itself uses two ID formats — `id` (VARCHAR 50, `tenant-{uuid8}`) and `uuid` (UUID). External services reference one or the other inconsistently.

### user-service → (referenced BY other services)

| Referencing Entity | Field | Type | Evidence |
|---|---|---|---|
| UserSessionEntity | `userId` | UUID | `UserSessionEntity.java:32` |
| UserSessionEntity | `deviceId` | UUID | `UserSessionEntity.java:38` |
| UserSessionEntity | `revokedBy` | UUID | `UserSessionEntity.java:89` |
| UserDeviceEntity | `approvedBy` | UUID | `UserDeviceEntity.java:75` |
| UserLicenseAssignmentEntity | `userId` | UUID | `UserLicenseAssignmentEntity.java:47` |
| UserLicenseAssignmentEntity | `assignedBy` | UUID | `UserLicenseAssignmentEntity.java:65` |
| LicenseFileEntity | `importedBy` | UUID | `LicenseFileEntity.java:90` |
| NotificationEntity | `userId` | UUID | `NotificationEntity.java:36` |
| NotificationPreferenceEntity | `userId` | UUID | `NotificationPreferenceEntity.java:29` |
| AuditEventEntity | `userId` | UUID | `AuditEventEntity.java:37` |
| AgentEntity | `ownerId` | UUID | `AgentEntity.java:37` |
| ConversationEntity | `userId` | UUID | `ConversationEntity.java:34` |

### Keycloak → (referenced BY services)

| Referencing Entity | Field | Type | Evidence |
|---|---|---|---|
| UserProfileEntity | `keycloakId` | UUID | `UserProfileEntity.java:33` |
| TenantEntity | `keycloakRealm` | String | `TenantEntity.java` |

---

## Identified Anomalies

### 1. Missing JPA Annotation on DB FK

**NotificationEntity.templateId** — a DB-level FK to `notification_templates.id` exists in the migration (`V1__notifications.sql:53`), but the entity has no `@ManyToOne` annotation. Hibernate does not manage this relationship.

### 2. Self-Referential FK Without Cascade

**UserProfileEntity.managerId** — self-referential FK defined in migration (`V1__user_profiles.sql:25`) with no `ON DELETE` clause. If a manager is deleted, subordinates' `managerId` becomes a dangling reference.

### 3. No orphanRemoval on UserLicenseAssignment

**TenantLicenseEntity → UserLicenseAssignmentEntity** uses `cascade = ALL` but **no `orphanRemoval`**. All other 1:N parent relationships use `orphanRemoval = true`. This means removing an assignment from the parent's collection won't automatically delete it.

### 4. Dual Tenant ID Formats

tenant-service uses `id` (VARCHAR 50, `tenant-{uuid8}`) and `uuid` (UUID) interchangeably. Some cross-service references use `tenantId` (VARCHAR 50), others use `tenantUuid` (UUID). No consistent convention.

### 5. BELONGS_TO Missing From Entity Model (Present in Graph Data)

`UserNode` has a `tenantId` field (denormalized) but **no** `@Relationship(type = "BELONGS_TO")` annotation to `TenantNode` in the Java entity model. However, the `BELONGS_TO` edge **does** exist in the graph — it is created by the Neo4j migration `V008__fix_master_tenant_seed_superuser.cypher`. This means:

- **Entity model:** No `@Relationship("BELONGS_TO")` — Spring Data Neo4j will not hydrate or manage this edge
- **Graph data:** `(User)-[:BELONGS_TO]->(Tenant)` edges exist, created by Cypher migrations
- **Risk:** The entity model and the graph schema are out of sync — queries using Spring Data Neo4j repository methods won't traverse BELONGS_TO, but raw Cypher queries will find it

### 6. Denormalized agentId in KnowledgeChunk

`KnowledgeChunkEntity.agentId` duplicates the value reachable via `source.agent.id`. No FK constraint. Could drift if a source is reassigned to a different agent.

---

## Relationship Patterns Summary

| Pattern | Count | Examples |
|---------|-------|---------|
| Bidirectional 1:N with cascade ALL + orphanRemoval | 8 | Tenant→Domain, Agent→KnowledgeSource |
| Bidirectional 1:1 with @MapsId (shared PK) | 3 | Tenant→Branding, Tenant→SessionConfig, Tenant→MFAConfig |
| Bidirectional 1:1 with @JoinColumn | 1 | LicenseFile↔ApplicationLicense |
| Unidirectional N:1 | 3 | Agent→Category, Conversation→Agent, UserProfile→self |
| Bidirectional 1:N without orphanRemoval | 1 | TenantLicense→UserLicenseAssignment |
| Implicit FK (migration only, no JPA) | 1 | Notification→NotificationTemplate |
| Neo4j unidirectional OUTGOING | 9 | All graph relationships |
| Cross-service soft reference (no FK) | 27 | tenantId, userId across all services |
| Composite PK (no FK) | 3 | TenantLocale, TenantMessageTranslation, MessageTranslation |
