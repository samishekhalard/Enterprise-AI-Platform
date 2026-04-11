# Business Requirements: Graph-per-Tenant Multi-Tenancy

**Document Type:** Business Requirements Document (BRD)
**Version:** 1.0
**Status:** Draft
**Date:** 2026-02-25
**Author:** BA Agent
**Stakeholders:** Architecture Team, Security Team, DevOps, Compliance

---

## 1. Executive Summary

This document defines the business requirements for implementing graph-per-tenant isolation using Neo4j multi-database architecture in the EMS platform. The enhancement migrates from the current column-discrimination model (tenant_id filtering) to physical database isolation for Neo4j graph data, providing enterprise-grade data isolation, compliance readiness, and independent tenant lifecycle management.

### 1.1 Business Drivers

| Driver | Description | Priority |
|--------|-------------|----------|
| Enterprise Sales | Large enterprise customers require physical data isolation guarantees | High |
| Data Residency | UAE government contracts require data residency compliance | High |
| GDPR Compliance | European customers require strict data isolation for Article 17 (Right to Erasure) | High |
| Performance Isolation | Eliminate noisy-neighbor concerns for premium tenants | Medium |
| Independent Operations | Per-tenant backup, restore, and lifecycle management | Medium |

### 1.2 Scope

**In Scope:**
- Neo4j graph database isolation per tenant
- Tenant provisioning workflow with database creation
- Dynamic database routing based on tenant context
- Per-tenant backup and restore capabilities
- Audit trail for database operations
- Data residency tagging

**Out of Scope:**
- PostgreSQL database-per-tenant (remains column discrimination)
- Keycloak realm isolation (existing implementation)
- Cross-tenant data federation (explicitly prohibited)

---

## 2. Business Objects

### 2.1 Tenant Graph Database

**Definition:** A dedicated Neo4j database instance for each tenant, named `tenant_{slug}`, containing all tenant-specific graph data.

| Attribute | Type | Description |
|-----------|------|-------------|
| databaseName | String | Neo4j database name (format: `tenant_{slug}`) |
| status | Enum | PROVISIONING, ACTIVE, SUSPENDED, ARCHIVED, DELETED |
| createdAt | DateTime | Database creation timestamp |
| sizeBytes | Long | Current database size in bytes |
| dataResidencyRegion | String | Geographic region for data storage (e.g., UAE, EU, US) |
| lastBackupAt | DateTime | Last successful backup timestamp |
| retentionPolicy | String | Data retention policy identifier |

**Business Rules:**
- BR-GPT-001: Database name MUST follow pattern `tenant_{slug}` where slug is URL-safe
- BR-GPT-002: Database MUST be created before tenant status transitions to ACTIVE
- BR-GPT-003: Database MUST NOT be deleted while tenant status is ACTIVE or SUSPENDED
- BR-GPT-004: Database size MUST be monitored and alerts triggered at 80% of tier limit

### 2.2 Master Graph (System Database)

**Definition:** The central Neo4j `system` database containing tenant registry, license products, and system-wide reference data. This database is shared across all tenants but contains no tenant business data.

| Node Type | Description | Tenant-Specific |
|-----------|-------------|-----------------|
| Tenant | Tenant registry with database routing info | No (system-wide) |
| LicenseProduct | Product catalog | No (system-wide) |
| LicenseFeature | Feature definitions | No (system-wide) |
| BpmnElementType | BPMN element types | No (system-wide) |

**Business Rules:**
- BR-GPT-005: Master graph MUST NOT contain any tenant business data
- BR-GPT-006: Master graph MUST contain the database name reference for each tenant
- BR-GPT-007: Tenant node in master graph MUST be created before tenant database is provisioned

### 2.3 Tenant Graph Content

**Definition:** Data types stored within each tenant's dedicated graph database.

| Data Domain | Node Types | Description |
|-------------|------------|-------------|
| User Management | User, Device, Session | Extended user profiles synced from IdP |
| License Management | TenantLicense | Tenant license assignments |
| Audit | AuditEvent | Compliance audit trail |
| AI Services | Agent, Conversation, Message, KnowledgeSource, Chunk | AI chatbot data with vector embeddings |
| Process Management | ProcessDefinition, ProcessElement, ProcessInstance | BPMN process data |
| Notifications | Notification, NotificationTemplate, NotificationPreference | Notification history |

**Business Rules:**
- BR-GPT-008: All tenant business data MUST reside in tenant-specific database only
- BR-GPT-009: Vector embeddings for AI/RAG MUST be stored in tenant database
- BR-GPT-010: Audit events MUST be immutable after creation

### 2.4 Database Provisioning Request

**Definition:** A request object representing the lifecycle event of creating a new tenant database.

| Attribute | Type | Required | Description |
|-----------|------|----------|-------------|
| tenantId | String | Yes | Target tenant identifier |
| requestedBy | String | Yes | User ID of requester (platform admin) |
| dataResidencyRegion | String | Yes | Required data residency region |
| retentionPolicyId | String | Yes | Data retention policy to apply |
| requestedAt | DateTime | Auto | Request timestamp |
| status | Enum | Auto | PENDING, IN_PROGRESS, COMPLETED, FAILED |
| completedAt | DateTime | Auto | Completion timestamp |
| errorMessage | String | Auto | Error details if failed |

---

## 3. User Stories

### 3.1 Epic: Tenant Provisioning with Graph Isolation

#### US-GPT-001: Provision Tenant with Isolated Graph Database

**As a** platform administrator,
**I want to** provision a new tenant with a dedicated Neo4j graph database,
**So that** the tenant's data is physically isolated from other tenants.

**Acceptance Criteria:**

| # | Criterion |
|---|-----------|
| AC-001.1 | **Given** I am authenticated as a platform administrator with `tenant:create` permission, **When** I submit a create tenant request with `fullName`, `shortName`, `slug`, `tier`, `dataResidencyRegion`, and `retentionPolicyId`, **Then** a new tenant record is created in PostgreSQL with status `PROVISIONING` |
| AC-001.2 | **Given** a tenant record exists with status `PROVISIONING`, **When** the provisioning workflow executes, **Then** a Neo4j database named `tenant_{slug}` is created |
| AC-001.3 | **Given** the tenant database is created successfully, **When** the provisioning workflow continues, **Then** the required schema constraints and indexes are applied to the new database |
| AC-001.4 | **Given** schema setup completes successfully, **When** the provisioning workflow continues, **Then** seed data (default roles, permissions) is inserted into the tenant database |
| AC-001.5 | **Given** all provisioning steps complete successfully, **When** the workflow finishes, **Then** the tenant status transitions to `ACTIVE` and the `databaseName` field is populated in the master graph |
| AC-001.6 | **Given** any provisioning step fails, **When** the workflow detects the failure, **Then** the tenant status transitions to `PROVISIONING_FAILED` with error details logged |
| AC-001.7 | **Given** provisioning fails, **When** I view the tenant details, **Then** I can see the specific error message and retry the provisioning |

**Alternative Scenarios:**

| # | Scenario |
|---|----------|
| AC-001.A1 | **Given** the requested slug already exists (duplicate), **When** I submit the create request, **Then** a 409 Conflict error is returned with message "Tenant slug already exists" |
| AC-001.A2 | **Given** Neo4j cluster is unavailable, **When** provisioning attempts database creation, **Then** the request is queued for retry with exponential backoff (max 3 retries) |

**Edge Cases:**

| # | Edge Case |
|---|-----------|
| AC-001.E1 | **Given** the slug contains special characters, **When** I submit the create request, **Then** the slug is normalized to lowercase alphanumeric with hyphens only |
| AC-001.E2 | **Given** the slug exceeds 50 characters, **When** I submit the create request, **Then** a 400 Bad Request error is returned with validation details |

**Permissions:**

| # | Permission Requirement |
|---|------------------------|
| AC-001.P1 | **Given** I do not have `tenant:create` permission, **When** I attempt to provision a tenant, **Then** a 403 Forbidden error is returned |
| AC-001.P2 | **Given** I have `tenant:create` permission but am not a platform admin (wrong tenant type), **When** I attempt to provision a tenant, **Then** a 403 Forbidden error is returned |

**Error Handling:**

| # | Error Scenario |
|---|----------------|
| AC-001.ER1 | **Given** Neo4j returns "database limit exceeded" error, **When** provisioning fails, **Then** the error is logged with severity CRITICAL and platform admin is notified |
| AC-001.ER2 | **Given** database creation succeeds but schema setup fails, **When** provisioning fails, **Then** the partially created database is marked for cleanup |

---

#### US-GPT-002: Verify Tenant Data Isolation

**As a** tenant administrator,
**I want** assurance that my organization's data is physically isolated from other tenants,
**So that** I can trust the platform with sensitive business data.

**Acceptance Criteria:**

| # | Criterion |
|---|-----------|
| AC-002.1 | **Given** I am authenticated as a user of tenant A, **When** I execute any query, **Then** the query executes against database `tenant_{tenant_a_slug}` only |
| AC-002.2 | **Given** I am authenticated as a user of tenant A, **When** I attempt to access data from tenant B, **Then** the request fails with 403 Forbidden (database routing prevents cross-tenant access) |
| AC-002.3 | **Given** a Cypher query is executed, **When** the query does not specify a database, **Then** the TenantAwareSessionFactory automatically routes to the correct tenant database |
| AC-002.4 | **Given** I view my tenant's settings page, **When** I access the "Data Isolation" section, **Then** I can see confirmation that my data resides in an isolated database with the data residency region displayed |

**Alternative Scenarios:**

| # | Scenario |
|---|----------|
| AC-002.A1 | **Given** the tenant context is not available in the request, **When** a database query is attempted, **Then** the request fails with 401 Unauthorized |
| AC-002.A2 | **Given** a service-to-service call without proper tenant header, **When** the call is processed, **Then** the request fails with 400 Bad Request "Missing tenant context" |

**Edge Cases:**

| # | Edge Case |
|---|-----------|
| AC-002.E1 | **Given** a background job runs without HTTP context, **When** the job executes, **Then** the tenant context MUST be explicitly set from the job configuration |

---

#### US-GPT-003: Audit Database Operations

**As an** auditor,
**I want to** verify tenant isolation and review all database operations,
**So that** I can ensure compliance with data protection regulations.

**Acceptance Criteria:**

| # | Criterion |
|---|-----------|
| AC-003.1 | **Given** a tenant database is created, **When** the provisioning completes, **Then** an audit event of type `TENANT_DATABASE_CREATED` is recorded with: tenantId, databaseName, dataResidencyRegion, requestedBy, timestamp |
| AC-003.2 | **Given** I am an auditor with `audit:read` permission, **When** I query audit events for database operations, **Then** I can filter by: tenantId, eventType (TENANT_DATABASE_*), dateRange, performedBy |
| AC-003.3 | **Given** any database schema change occurs (migration), **When** the change completes, **Then** an audit event of type `TENANT_SCHEMA_UPDATED` is recorded with version information |
| AC-003.4 | **Given** I request an isolation verification report, **When** the report generates, **Then** it confirms: database exists, database name matches tenant slug, no cross-database relationships exist |
| AC-003.5 | **Given** audit events exist, **When** I attempt to modify or delete them, **Then** the operation fails with 403 Forbidden (audit events are immutable) |

**Main Scenario (Happy Path):**

| # | Scenario |
|---|----------|
| AC-003.M1 | **Given** I navigate to Audit > Database Operations, **When** I select a tenant and date range, **Then** I see a paginated list of all database lifecycle events with 25 events per page |

**Pagination:**

| # | Pagination Requirement |
|---|------------------------|
| AC-003.PG1 | **Given** more than 25 audit events match the filter, **When** I view the results, **Then** pagination controls show total count and page navigation |

**Empty State:**

| # | Empty State |
|---|-------------|
| AC-003.ES1 | **Given** no audit events match the filter criteria, **When** I view the results, **Then** a message "No database operations found for the selected criteria" is displayed |

---

#### US-GPT-004: Delete Tenant and Remove Data

**As a** platform administrator,
**I want to** completely delete a tenant including all graph data,
**So that** I can honor data deletion requests and comply with GDPR Article 17.

**Acceptance Criteria:**

| # | Criterion |
|---|-----------|
| AC-004.1 | **Given** I am a platform admin with `tenant:delete` permission, **When** I initiate tenant deletion for an ACTIVE tenant, **Then** I must first suspend the tenant (status cannot transition directly from ACTIVE to DELETED) |
| AC-004.2 | **Given** a tenant is in SUSPENDED status, **When** I initiate deletion with confirmation code, **Then** the tenant status transitions to `DELETION_PENDING` |
| AC-004.3 | **Given** a tenant is in `DELETION_PENDING` status, **When** the 72-hour grace period expires, **Then** the deletion workflow executes automatically |
| AC-004.4 | **Given** the deletion workflow executes, **When** all steps complete, **Then** the Neo4j database `tenant_{slug}` is permanently dropped |
| AC-004.5 | **Given** the database is dropped, **When** the workflow continues, **Then** the tenant record in PostgreSQL is soft-deleted (marked as DELETED with deletedAt timestamp) |
| AC-004.6 | **Given** tenant deletion completes, **When** I search for the tenant, **Then** the tenant does not appear in default queries but can be found with `includeDeleted=true` filter for audit purposes |
| AC-004.7 | **Given** I attempt to delete a MASTER or protected tenant, **When** the delete request is submitted, **Then** a 403 Forbidden error is returned with message "Protected tenants cannot be deleted" |

**Alternative Scenarios:**

| # | Scenario |
|---|----------|
| AC-004.A1 | **Given** a tenant is in `DELETION_PENDING` status and within the grace period, **When** I cancel the deletion, **Then** the tenant status reverts to SUSPENDED |
| AC-004.A2 | **Given** database deletion fails due to Neo4j error, **When** the workflow detects the failure, **Then** the status transitions to `DELETION_FAILED` and an alert is sent to platform admins |

**Data Model:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| tenantId | String | Yes | Tenant being deleted |
| deletionRequestedBy | String | Yes | Admin who initiated deletion |
| deletionRequestedAt | DateTime | Yes | When deletion was requested |
| gracePeriodExpiresAt | DateTime | Yes | When grace period ends (72 hours) |
| deletionConfirmationCode | String | Yes | 6-digit code required for confirmation |
| deletionCompletedAt | DateTime | No | When deletion workflow completed |
| backupRetainedUntil | DateTime | No | Final backup retention date (30 days post-deletion) |

---

#### US-GPT-005: Backup and Restore Tenant Database

**As a** platform administrator,
**I want to** perform independent backup and restore operations per tenant,
**So that** I can recover individual tenant data without affecting other tenants.

**Acceptance Criteria:**

| # | Criterion |
|---|-----------|
| AC-005.1 | **Given** automated backups are configured, **When** the daily backup job runs at 02:00 UTC, **Then** each tenant database is backed up independently to cloud storage |
| AC-005.2 | **Given** a backup completes, **When** the job finishes, **Then** the backup metadata (tenantId, size, timestamp, checksum, storageLocation) is recorded |
| AC-005.3 | **Given** I am a platform admin, **When** I navigate to Tenant > Backups, **Then** I see a list of available backups with date, size, and retention expiry |
| AC-005.4 | **Given** I initiate a restore operation, **When** I select a backup point, **Then** I must confirm with a warning that current data will be overwritten |
| AC-005.5 | **Given** restore is confirmed, **When** the restore executes, **Then** the tenant status transitions to `RESTORING` during the operation |
| AC-005.6 | **Given** restore completes, **When** the tenant becomes available, **Then** the tenant status returns to ACTIVE and an audit event is recorded |
| AC-005.7 | **Given** backup retention policy is 30 days, **When** a backup exceeds 30 days age, **Then** the backup is automatically deleted (except compliance-tagged backups) |

**Alternative Scenarios:**

| # | Scenario |
|---|----------|
| AC-005.A1 | **Given** a tenant requests point-in-time recovery, **When** transaction logs are available, **Then** recovery can restore to any point within the log retention window (7 days) |
| AC-005.A2 | **Given** compliance requires extended retention, **When** a backup is tagged `compliance-hold`, **Then** the backup is retained until the hold is released |

**Edge Cases:**

| # | Edge Case |
|---|-----------|
| AC-005.E1 | **Given** a backup is in progress, **When** another backup is requested for the same tenant, **Then** the request is rejected with "Backup already in progress" |
| AC-005.E2 | **Given** cloud storage is unavailable, **When** backup fails, **Then** retry with exponential backoff (max 5 retries) and alert on final failure |

---

### 3.2 Epic: Query Routing and Data Access

#### US-GPT-006: Route Queries to Correct Tenant Database

**As a** backend service,
**I want** all Neo4j queries to automatically route to the correct tenant database,
**So that** developers do not need to manually specify the database in every query.

**Acceptance Criteria:**

| # | Criterion |
|---|-----------|
| AC-006.1 | **Given** a request contains a valid JWT with tenant_id claim, **When** the TenantContextFilter processes the request, **Then** the tenant ID is stored in TenantContext thread-local |
| AC-006.2 | **Given** TenantContext has a valid tenant ID, **When** a Neo4j session is requested, **Then** TenantAwareNeo4jSessionFactory returns a session bound to `tenant_{slug}` database |
| AC-006.3 | **Given** a reactive/WebFlux request, **When** tenant context propagation occurs, **Then** the context is propagated via Reactor context (not thread-local) |
| AC-006.4 | **Given** an async operation (@Async method), **When** the operation executes on a different thread, **Then** the tenant context is properly propagated to the new thread |
| AC-006.5 | **Given** the system graph needs to be queried (tenant registry), **When** a system database query is executed, **Then** the query explicitly targets the `system` database bypassing tenant routing |

**Technical Validation:**

| # | Validation |
|---|------------|
| AC-006.V1 | **Given** a query execution, **When** logs are reviewed, **Then** the target database name is logged at DEBUG level |
| AC-006.V2 | **Given** tenant context is missing, **When** a data query is attempted, **Then** an exception is thrown preventing query execution |

---

#### US-GPT-007: Prevent Cross-Tenant Data Access

**As a** security officer,
**I want** technical controls that make cross-tenant data access impossible,
**So that** even malicious or buggy code cannot access another tenant's data.

**Acceptance Criteria:**

| # | Criterion |
|---|-----------|
| AC-007.1 | **Given** each tenant has a dedicated Neo4j database, **When** queries execute, **Then** the Neo4j driver session is bound to a single database (no cross-database queries) |
| AC-007.2 | **Given** a user's JWT contains tenant_id for tenant A, **When** a request includes a path parameter for tenant B, **Then** the request is rejected with 403 Forbidden before any database query executes |
| AC-007.3 | **Given** application code attempts to query a database other than the one bound to the session, **When** the query is submitted, **Then** the Neo4j driver rejects the query (database is fixed per session) |
| AC-007.4 | **Given** integration tests for tenant isolation, **When** the test suite runs, **Then** automated tests verify that tenant A cannot query tenant B's database |
| AC-007.5 | **Given** security scanning is configured, **When** code is committed, **Then** static analysis flags any hardcoded database names in Cypher queries |

**Business Rules:**

| # | Rule |
|---|------|
| AC-007.R1 | Cross-tenant queries MUST NOT be supported at the application level |
| AC-007.R2 | No API endpoint shall accept both tenant_id in JWT and a different tenant_id in request body |
| AC-007.R3 | Service-to-service calls MUST propagate tenant context via X-Tenant-ID header |

---

### 3.3 Epic: Compliance and Data Residency

#### US-GPT-008: Tag Data Residency Region

**As a** compliance officer,
**I want** each tenant's data tagged with its data residency region,
**So that** I can demonstrate compliance with data sovereignty regulations.

**Acceptance Criteria:**

| # | Criterion |
|---|-----------|
| AC-008.1 | **Given** I create a new tenant, **When** I select a data residency region (UAE, EU, US, APAC), **Then** the tenant record stores the selected region |
| AC-008.2 | **Given** a data residency region is selected, **When** the tenant database is provisioned, **Then** the database is created on Neo4j infrastructure in the specified region (requires geo-distributed Neo4j) |
| AC-008.3 | **Given** a tenant has a residency region, **When** I view tenant details, **Then** the data residency region is displayed prominently |
| AC-008.4 | **Given** compliance requires it, **When** I generate a data residency report, **Then** the report lists all tenants with their residency regions and database locations |
| AC-008.5 | **Given** a tenant requests residency region change, **When** the change is approved, **Then** data migration is performed with full audit trail |

**Business Rules:**

| # | Rule |
|---|------|
| AC-008.R1 | Data residency region CANNOT be changed without explicit approval from tenant admin and compliance officer |
| AC-008.R2 | UAE government tenants MUST be tagged with UAE residency and CANNOT be changed |

---

#### US-GPT-009: Comply with GDPR Right to Erasure

**As a** data protection officer,
**I want** the ability to completely erase a tenant's data,
**So that** I can comply with GDPR Article 17 requests.

**Acceptance Criteria:**

| # | Criterion |
|---|-----------|
| AC-009.1 | **Given** a GDPR erasure request is received, **When** I process the request, **Then** I can initiate tenant deletion with erasure flag |
| AC-009.2 | **Given** erasure is requested, **When** the deletion workflow executes, **Then** all data in the tenant's Neo4j database is permanently deleted (DROP DATABASE) |
| AC-009.3 | **Given** erasure completes, **When** I generate an erasure certificate, **Then** the certificate confirms: database dropped, backups deleted, audit trail retained (per legal requirement) |
| AC-009.4 | **Given** the 30-day backup retention period applies, **When** erasure is requested, **Then** all existing backups for the tenant are immediately queued for deletion |
| AC-009.5 | **Given** erasure audit requirements, **When** data is deleted, **Then** a minimal audit record is retained: tenantId, erasureRequestedAt, erasureCompletedAt, erasurePerformedBy (no business data retained) |

---

#### US-GPT-010: Enforce Data Retention Policies

**As a** compliance officer,
**I want** configurable data retention policies per tenant,
**So that** I can comply with industry-specific data retention requirements.

**Acceptance Criteria:**

| # | Criterion |
|---|-----------|
| AC-010.1 | **Given** I am configuring a tenant, **When** I select a retention policy, **Then** I can choose from predefined policies: 1-year, 3-year, 7-year, indefinite |
| AC-010.2 | **Given** a retention policy is applied, **When** data exceeds the retention period, **Then** an automated job identifies data eligible for deletion |
| AC-010.3 | **Given** data is identified for deletion, **When** the retention job runs, **Then** audit events older than the retention period are archived then deleted |
| AC-010.4 | **Given** a tenant has custom retention requirements, **When** I configure retention, **Then** I can specify different periods for different data types (e.g., audit: 7 years, conversations: 1 year) |
| AC-010.5 | **Given** retention policy violation, **When** compliance scan runs, **Then** violations are reported in the compliance dashboard |

**Data Model - Retention Policy:**

| Field | Type | Description |
|-------|------|-------------|
| policyId | String | Unique policy identifier |
| policyName | String | Display name (e.g., "7-Year Financial Compliance") |
| defaultRetentionDays | Integer | Default retention period |
| dataTypeOverrides | Map | Per-data-type retention (e.g., {"audit": 2555, "conversation": 365}) |
| complianceFramework | String | Applicable framework (GDPR, SOC2, HIPAA, UAE_GOV) |

---

## 4. Data Model

### 4.1 PostgreSQL Schema (Tenant Registry)

The tenant-service PostgreSQL database stores tenant registry information:

| Attribute Name | Data Type | Required | Description |
|----------------|-----------|----------|-------------|
| id | VARCHAR(50) | Yes | Primary key (format: tenant-{uuid8}) |
| uuid | UUID | Yes | System-generated UUID |
| full_name | VARCHAR(255) | Yes | Full organization name |
| short_name | VARCHAR(100) | Yes | Short display name |
| slug | VARCHAR(100) | Yes | URL-safe identifier (unique) |
| description | TEXT | No | Organization description |
| logo_url | VARCHAR(500) | No | Logo URL |
| tenant_type | VARCHAR(20) | Yes | MASTER, DOMINANT, REGULAR |
| tier | VARCHAR(20) | Yes | FREE, STANDARD, PROFESSIONAL, ENTERPRISE |
| status | VARCHAR(20) | Yes | PENDING, PROVISIONING, ACTIVE, SUSPENDED, LOCKED, DELETION_PENDING, DELETED |
| database_name | VARCHAR(100) | Yes | Neo4j database name (tenant_{slug}) |
| data_residency_region | VARCHAR(20) | Yes | UAE, EU, US, APAC |
| retention_policy_id | VARCHAR(50) | Yes | Foreign key to retention policy |
| keycloak_realm | VARCHAR(100) | No | Keycloak realm name |
| is_protected | BOOLEAN | Yes | Cannot be deleted if true |
| version | BIGINT | Yes | Optimistic locking |
| created_at | TIMESTAMP | Yes | Creation timestamp |
| updated_at | TIMESTAMP | Yes | Last update timestamp |
| created_by | VARCHAR(50) | No | Creating user ID |
| deleted_at | TIMESTAMP | No | Soft delete timestamp |

### 4.2 Neo4j Master Graph Schema (system database)

| Node Label | Key Properties | Description |
|------------|----------------|-------------|
| Tenant | id, slug, databaseName, status | Tenant registry with database routing |
| LicenseProduct | code, name, tier | License product catalog |
| LicenseFeature | code, name | Feature definitions |
| BpmnElementType | code, bpmnType, category | BPMN element type definitions |

**Tenant Node Properties:**

| Property | Type | Indexed | Description |
|----------|------|---------|-------------|
| id | String | Yes | Tenant identifier |
| slug | String | Yes | URL-safe identifier |
| databaseName | String | No | Target database name |
| status | String | No | Current status |
| dataResidencyRegion | String | No | Data residency tag |
| createdAt | DateTime | No | Creation timestamp |

**Indexes (system database):**

```cypher
CREATE CONSTRAINT tenant_id IF NOT EXISTS FOR (t:Tenant) ON (t.id);
CREATE CONSTRAINT tenant_slug IF NOT EXISTS FOR (t:Tenant) ON (t.slug);
CREATE CONSTRAINT license_product_code IF NOT EXISTS FOR (lp:LicenseProduct) ON (lp.code);
CREATE CONSTRAINT bpmn_element_code IF NOT EXISTS FOR (b:BpmnElementType) ON (b.code);
```

### 4.3 Neo4j Tenant Graph Schema (tenant_{slug} database)

Each tenant database contains the following node types. See `/docs/data-models/neo4j-ems-db.md` for the canonical complete schema.

| Domain | Node Labels | Key Relationships |
|--------|-------------|-------------------|
| User Management | User, Device, Session | REPORTS_TO, HAS_DEVICE, HAS_SESSION |
| License | TenantLicense | ASSIGNED_TO (User) |
| Audit | AuditEvent | PERFORMED_BY (User) |
| AI | Agent, Conversation, Message, KnowledgeSource, Chunk | HAS_CONVERSATION, CONTAINS, SIMILAR_TO |
| Process | ProcessDefinition, ProcessElement, ProcessInstance | FLOWS_TO, CONTAINS, INSTANCE_OF |
| Notification | Notification | SENT_TO (User) |

**Required Indexes per Tenant Database:**

```cypher
-- Created during tenant provisioning
CREATE CONSTRAINT user_id IF NOT EXISTS FOR (u:User) ON (u.id);
CREATE INDEX user_email IF NOT EXISTS FOR (u:User) ON (u.email);
CREATE CONSTRAINT audit_id IF NOT EXISTS FOR (a:AuditEvent) ON (a.id);
CREATE INDEX audit_timestamp IF NOT EXISTS FOR (a:AuditEvent) ON (a.timestamp);
CREATE CONSTRAINT agent_id IF NOT EXISTS FOR (ag:Agent) ON (ag.id);
CREATE CONSTRAINT process_def_id IF NOT EXISTS FOR (p:ProcessDefinition) ON (p.id);

-- Vector index for RAG
CREATE VECTOR INDEX chunk_embedding IF NOT EXISTS
FOR (c:Chunk) ON (c.embedding)
OPTIONS {indexConfig: {`vector.dimensions`: 1536, `vector.similarity_function`: 'cosine'}};
```

---

## 5. Business Rules

### 5.1 Data Storage Rules

| Rule ID | Rule | Rationale |
|---------|------|-----------|
| BR-DS-001 | Graph data (relationships, AI/RAG, process flows) MUST be stored in Neo4j | Graph databases excel at relationship traversal |
| BR-DS-002 | Relational data (tenant registry, configurations) MUST be stored in PostgreSQL | Relational data benefits from ACID guarantees |
| BR-DS-003 | Audit events MUST be stored in tenant-specific Neo4j database | Physical isolation for compliance |
| BR-DS-004 | System-wide reference data (license products, BPMN types) MUST be stored in master graph | Single source of truth for catalog data |
| BR-DS-005 | User profiles MUST be synced from IdP to tenant Neo4j database | Local copy for relationship queries |
| BR-DS-006 | Vector embeddings for AI/RAG MUST be stored in tenant Neo4j database | Tenant isolation for AI data |

### 5.2 Provisioning Rules

| Rule ID | Rule | Rationale |
|---------|------|-----------|
| BR-PR-001 | Database name MUST follow pattern `tenant_{slug}` | Consistent naming for operations |
| BR-PR-002 | Database provisioning MUST be idempotent | Safe for retry on failure |
| BR-PR-003 | Schema migrations MUST be versioned | Track changes across environments |
| BR-PR-004 | Seed data MUST include default roles | Tenant usable immediately after provisioning |
| BR-PR-005 | Provisioning failure MUST NOT leave orphaned databases | Cleanup on failure |
| BR-PR-006 | Provisioning timeout is 5 minutes | Prevent stuck provisioning jobs |

### 5.3 Backup and Restore Rules

| Rule ID | Rule | Rationale |
|---------|------|-----------|
| BR-BR-001 | Daily automated backups at 02:00 UTC for all tenants | Regular backup cadence |
| BR-BR-002 | Backup retention default is 30 days | Balance storage cost with recovery needs |
| BR-BR-003 | Compliance-hold backups are retained indefinitely | Legal/compliance requirements |
| BR-BR-004 | Point-in-time recovery requires transaction logs | Granular recovery capability |
| BR-BR-005 | Restore operations require platform admin approval | Prevent accidental data loss |
| BR-BR-006 | Backup verification runs weekly (restore to test environment) | Ensure backups are recoverable |

### 5.4 Security Rules

| Rule ID | Rule | Rationale |
|---------|------|-----------|
| BR-SEC-001 | Cross-tenant database queries are technically impossible | Physical isolation |
| BR-SEC-002 | Tenant context MUST be validated from JWT, not request body | Prevent tenant impersonation |
| BR-SEC-003 | Database credentials MUST be encrypted at rest | Secret protection |
| BR-SEC-004 | Service accounts per tenant database are NOT used | Single admin account simplifies management |
| BR-SEC-005 | TLS 1.3 required for all database connections | Encryption in transit |

---

## 6. Compliance Requirements

### 6.1 GDPR Compliance

| Requirement | Implementation |
|-------------|----------------|
| Article 17 - Right to Erasure | DROP DATABASE removes all tenant data |
| Article 20 - Data Portability | Export API generates JSON/CSV dump from tenant database |
| Article 25 - Privacy by Design | Physical isolation prevents accidental data exposure |
| Article 30 - Records of Processing | Audit events record all data access |
| Article 32 - Security of Processing | Encryption at rest (Neo4j) and in transit (TLS 1.3) |
| Article 33 - Breach Notification | Isolated databases limit breach scope |

### 6.2 UAE Data Residency

| Requirement | Implementation |
|-------------|----------------|
| Data must remain in UAE | Data residency region tag enforces UAE storage |
| Government tenant protection | Protected flag prevents deletion of government tenants |
| Local backup storage | Backups stored in UAE region cloud storage |
| Audit trail for government access | All access logged with immutable audit events |

### 6.3 SOC 2 Controls

| Control | Implementation |
|---------|----------------|
| CC6.1 - Logical Access | Database-level isolation |
| CC6.6 - Encryption | TLS 1.3 in transit, encryption at rest |
| CC7.2 - Monitoring | Audit events for all database operations |
| CC7.3 - Incident Response | Isolated databases contain breach scope |

### 6.4 Audit Trail Requirements

| Event Type | Retention | Required Fields |
|------------|-----------|-----------------|
| TENANT_DATABASE_CREATED | 7 years | tenantId, databaseName, region, requestedBy, timestamp |
| TENANT_DATABASE_DELETED | 7 years | tenantId, databaseName, deletedBy, timestamp, reason |
| TENANT_DATABASE_RESTORED | 7 years | tenantId, databaseName, restoredBy, backupTimestamp, timestamp |
| TENANT_SCHEMA_UPDATED | 7 years | tenantId, databaseName, schemaVersion, updatedBy, timestamp |
| TENANT_BACKUP_CREATED | 1 year | tenantId, backupId, size, checksum, timestamp |
| TENANT_DATA_EXPORTED | 7 years | tenantId, exportedBy, timestamp, recordCount |

---

## 7. Validation Rules

### 7.1 Tenant Slug Validation

| Rule | Constraint |
|------|------------|
| Format | Lowercase alphanumeric with hyphens only |
| Pattern | `^[a-z0-9][a-z0-9-]*[a-z0-9]$` |
| Length | 3-50 characters |
| Reserved | Cannot use: `system`, `admin`, `api`, `www`, `master`, `default` |
| Uniqueness | Must be unique across all tenants (active and deleted) |

### 7.2 Data Residency Region Validation

| Region Code | Description | Available |
|-------------|-------------|-----------|
| UAE | United Arab Emirates | Yes |
| EU | European Union | Yes |
| US | United States | Yes |
| APAC | Asia Pacific | Planned |

### 7.3 Retention Policy Validation

| Policy | Minimum Days | Maximum Days |
|--------|--------------|--------------|
| Audit Events | 365 | Indefinite |
| Conversations | 30 | 2555 (7 years) |
| Notifications | 30 | 365 |
| Process Instances | 365 | Indefinite |

---

## 8. Non-Functional Requirements

### 8.1 Performance

| Metric | Requirement |
|--------|-------------|
| Database provisioning time | < 60 seconds (P95) |
| Query routing overhead | < 5ms per request |
| Backup time per 1GB | < 5 minutes |
| Restore time per 1GB | < 10 minutes |
| Database count per Neo4j cluster | Up to 1000 databases |

### 8.2 Availability

| Metric | Requirement |
|--------|-------------|
| Database availability | 99.9% uptime |
| Backup success rate | 99.99% |
| Restore success rate | 99.9% |
| Provisioning success rate | 99.9% |

### 8.3 Scalability

| Metric | Requirement |
|--------|-------------|
| Maximum tenants | 1000 per Neo4j cluster |
| Maximum database size | 100GB per tenant database |
| Maximum concurrent sessions | 100 per tenant |
| Horizontal scaling | Neo4j cluster can scale to 3+ replicas |

---

## 9. Dependencies and Prerequisites

### 9.1 Technical Prerequisites

| Prerequisite | Description | Status |
|--------------|-------------|--------|
| Neo4j Enterprise | Multi-database feature requires Enterprise license | Required |
| Neo4j 5.x | Vector index support for AI/RAG | Required |
| Neo4j Cluster | High availability for production | Required |
| Cloud Storage | Backup storage (S3-compatible) | Required |
| Kubernetes | Container orchestration for scaling | Existing |

### 9.2 Related ADRs

| ADR | Title | Status |
|-----|-------|--------|
| ADR-001 | Neo4j as Primary Database | Accepted |
| ADR-003 | Multi-Tenancy Strategy | Partially Implemented |
| ADR-009 | Auth Facade with Neo4j | Accepted |

### 9.3 Related Services

| Service | Impact |
|---------|--------|
| tenant-service | Add database provisioning, deletion, status tracking |
| auth-facade | Add tenant-aware Neo4j session factory |
| audit-service | Store audit events in tenant Neo4j database |
| ai-service | Store AI data in tenant Neo4j database |
| process-service | Store BPMN data in tenant Neo4j database |

---

## 10. Appendix

### 10.1 Glossary

| Term | Definition |
|------|------------|
| Graph-per-Tenant | Architecture where each tenant has a dedicated Neo4j database |
| Master Graph | The shared `system` database containing tenant registry |
| Tenant Graph | A dedicated database named `tenant_{slug}` for a single tenant |
| Data Residency | Geographic location where data is physically stored |
| Column Discrimination | Current multi-tenancy approach using tenant_id column filtering |

### 10.2 References

- [Neo4j Multi-Database Documentation](https://neo4j.com/docs/operations-manual/current/manage-databases/)
- [ADR-003: Multi-Tenancy Strategy](/docs/adr/ADR-003-database-per-tenant.md)
- [EMS Neo4j Database Schema (Canonical)](/docs/data-models/neo4j-ems-db.md)
- GDPR Article 17: Right to Erasure
- UAE Federal Decree-Law No. 45 of 2021 (Data Protection)

---

## 11. Approval

| Role | Name | Date | Signature |
|------|------|------|-----------|
| Business Analyst | BA Agent | 2026-02-25 | Drafted |
| Solution Architect | | | |
| Security Architect | | | |
| DBA | | | |
| Product Manager | | | |

---

**Document History:**

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-02-25 | BA Agent | Initial draft |
