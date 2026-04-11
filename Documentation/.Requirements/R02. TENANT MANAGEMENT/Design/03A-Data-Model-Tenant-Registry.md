# 03A — Tenant Registry Data Model

**Track:** R02. TENANT MANAGEMENT
**Chunk:** Tenant Registry (1 of N)
**Database:** PostgreSQL — master catalog
**Status:** Draft — pending review

---

## 1. Purpose and Scope

This artifact covers the **tenant registry table only**.

- One database: PostgreSQL master catalog
- One table: `tenants`
- Everything else is a separate chunk

This is not the full R02 data model. It is the first chunk of a database-by-database rewrite mandated by the review comments register (`REVIEW-COMMENTS-REGISTER.md`, entries RC-001 through RC-018) and the rewrite brief (`03-DATA-MODEL-REWRITE-BRIEF.md`).

### What this artifact does not cover

- Tenant-scoped management tables (session config, MFA config, auth providers)
- Branding (RC-008: excluded from this review scope)
- License storage (security concern: requires tamper-resistant design — separate chunk)
- Audit log table (PRD capability #9, Phase 2 management)
- Health check table (PRD capability #12, Phase 3 management, MASTER only)
- Graph databases (system, definition, instance)
- Platform registry

---

## 2. Registry Boundary

The tenant registry is the minimum set of fields required to:

1. **Identify** a tenant (UUID, name, shortname)
2. **Route** a request to the correct tenant (domain)
3. **Classify** a tenant (type)
4. **Gate** access to a tenant (status, protection flag)
5. **Audit** record lifecycle (created_at, updated_at)

**Separation rule:** if a field governs tenant-scoped runtime behavior, operational monitoring, infrastructure routing, or downstream service configuration, it does not belong on the registry record. It belongs to a tenant-scoped management chunk or an infrastructure chunk.

---

## 3. Target `tenants` Table

**Database:** PostgreSQL master catalog
**Schema:** public (or tenant_registry if schema isolation is adopted)

| Column | Type | Constraints | Source / Justification |
|--------|------|-------------|----------------------|
| `id` | `UUID` | PK, DEFAULT gen_random_uuid() | RC-001 (`REVIEW-COMMENTS-REGISTER.md`): UUID is the approved identifier method. Replaces dual `id` VARCHAR + `uuid` UUID pattern in as-is `TenantEntity.java:25–30`. |
| `full_name` | `VARCHAR(255)` | NOT NULL | Technical carry-forward: `TenantEntity.java:32–33` (`full_name`, NOT NULL); `_parking/create-tenant.models.ts:86` (`tenantName`). |
| `shortname` | `VARCHAR(100)` | UNIQUE NOT NULL | RC-002 (`REVIEW-COMMENTS-REGISTER.md`): renamed from `slug` per prior agreement. As-is: `TenantEntity.java:38–39` (`slug`, UNIQUE NOT NULL). |
| `description` | `TEXT` | | Technical carry-forward: `TenantEntity.java:41–42`; `_parking/create-tenant.models.ts:14`. |
| `tenant_type` | `VARCHAR(20)` | NOT NULL, CHECK (tenant_type IN ('MASTER', 'DOMINANT', 'REGULAR')) | `01-PRD-Tenant-Management.md:166` (Type Badge: "MASTER, REGULAR, or DOMINANT — color-coded"), `:290` (filter values), `:812` (immutable after creation). |
| `domain` | `VARCHAR(255)` | UNIQUE NOT NULL | RC-007 (`REVIEW-COMMENTS-REGISTER.md`): tenant domain is the URL/host attribute used for routing the user to the tenant. Collapsed from multi-row `tenant_domains` child table (`TenantDomainEntity`) to a single attribute per RC-007 decision. |
| `status` | `VARCHAR(20)` | NOT NULL | `01-PRD-Tenant-Management.md:128` (Capability #4: Manage Tenant Lifecycle — state machine), `:167` (Status Indicator with semantic color). See section 5, item 1 for enum values. |
| `is_protected` | `BOOLEAN` | NOT NULL DEFAULT FALSE | Technical carry-forward: `TenantEntity.java:78–80` (`is_protected`, NOT NULL, default false). |
| `created_at` | `TIMESTAMPTZ` | NOT NULL DEFAULT now() | Technical carry-forward: `TenantEntity.java:121–123` (`@CreationTimestamp`, NOT NULL, not updatable). |
| `updated_at` | `TIMESTAMPTZ` | NOT NULL DEFAULT now() | Technical carry-forward: `TenantEntity.java:125–127` (`@UpdateTimestamp`, NOT NULL). |

### Indexes

| Index | Columns | Type | Rationale |
|-------|---------|------|-----------|
| `pk_tenants` | `id` | PRIMARY KEY | UUID PK |
| `uq_tenants_shortname` | `shortname` | UNIQUE | Lookup by shortname |
| `uq_tenants_domain` | `domain` | UNIQUE | Request routing by domain |

### Not included: `created_by`

No canonical R02 requirement artifact (PRD, stories, fact sheet, review comments register) cites `created_by` as a registry requirement. As-is `TenantEntity.java:129–130` carries it, but without requirement backing it is excluded from the target model.

---

## 4. Excluded Fields

Fields from the as-is `TenantEntity.java` or rejected `03-Data-Model-Tenant-Management.md` that are excluded from the target registry table, with grounded rationale for each.

### RC-corrected removals

| Field | Rationale |
|-------|-----------|
| `tier` | RC-003, RC-018 (`REVIEW-COMMENTS-REGISTER.md`): not a registry attribute. The licensing model uses 4 license types (tenant, admin, user, viewer), not a tenant-tier field. |
| `version` | RC-004 (`REVIEW-COMMENTS-REGISTER.md`): JPA optimistic-locking implementation concern, not a business attribute. |
| `slug` | RC-002 (`REVIEW-COMMENTS-REGISTER.md`): renamed to `shortname`. The `slug` column in `TenantEntity.java:38–39` is replaced by `shortname`. |
| `id` (VARCHAR) + `uuid` (UUID) | RC-001 (`REVIEW-COMMENTS-REGISTER.md`): replaced by single UUID PK. The as-is pattern (`TenantEntity.java:25–30`) uses a synthetic VARCHAR `id` plus a separate `uuid` column. |
| `logo_url` | RC-008 (`REVIEW-COMMENTS-REGISTER.md`): branding field. Branding is excluded from this review scope. As-is: `TenantEntity.java:44–45`. |

### Vestigial fields (no longer required by target architecture)

| Field | Rationale |
|-------|-----------|
| `keycloak_realm` | Vestigial per frozen decision FD-04 (`06-forks-gaps-blockers.md`). As-is: `TenantEntity.java:59–60`. Auth absorption eliminates the need for a per-tenant Keycloak realm reference on the registry. |
| `auth_db_name` | Vestigial per FD-01, FD-04 (`06-forks-gaps-blockers.md`). As-is: `TenantEntity.java:62–63`. Auth is absorbed into tenant-service; no separate auth database per tenant. |
| `definitions_db_name` | Vestigial per FD-06 (`06-forks-gaps-blockers.md`). As-is: `TenantEntity.java:65–66`. Definition-service has no tenant-aware database routing (`05-topology-contract.md:113–117`). |

### Fields belonging to other chunks

| Field | Rationale |
|-------|-----------|
| `default_locale` | As-is: `TenantEntity.java:74–76`. Governs tenant-scoped runtime behavior (locale selection), not registry identity. Belongs to tenant-scoped management chunk. |
| `identity_endpoint` | As-is: `TenantEntity.java:68–69`. No settled R02 requirement defines this field's purpose or consumer. |
| `baseline_version` | As-is: `TenantEntity.java:71–72`. No settled R02 requirement defines this field's purpose or consumer. |
| `short_name` | As-is: `TenantEntity.java:35–36`. Consolidated into `full_name` + `shortname` (which replaces `slug`). |
| Suspension columns (`suspension_reason`, `suspension_notes`, `suspended_at`, `estimated_reactivation_date`) | As-is: `TenantEntity.java:82–92`. Lifecycle detail — placement on registry vs management chunk is unresolved. See section 5, item 2. |
| Deletion columns (`decommissioned_at`) | As-is: `TenantEntity.java:94–95`. Same as suspension columns — placement unresolved. See section 5, item 2. |
| `last_activity_at` | As-is: `TenantEntity.java:97–98`. Operational metric, not registry identity. |
| `created_by` | As-is: `TenantEntity.java:129–130`. No canonical source cites it as a registry requirement. |
| Session/MFA/auth provider tables | As-is: `TenantSessionConfigEntity`, `TenantMFAConfigEntity`, `TenantAuthProviderEntity` (referenced in `TenantEntity.java:100–115`). Tenant-scoped management concerns — separate chunk. |
| Branding | RC-008 (`REVIEW-COMMENTS-REGISTER.md`). As-is: `TenantBrandingEntity` (referenced in `TenantEntity.java:108–109`). Excluded from this review scope. |
| `tenant_domains` table | RC-007 (`REVIEW-COMMENTS-REGISTER.md`): collapsed to single `domain` attribute on the registry. As-is: `TenantDomainEntity` (referenced in `TenantEntity.java:100–102`). |

### Fields from rejected data model with no as-is backing

| Field | Rationale |
|-------|-----------|
| `data_residency_region` | Appeared in rejected `03-Data-Model-Tenant-Management.md` only. Does not exist in `TenantEntity.java`. No R02 requirement artifact (PRD, stories, fact sheet) specifies data residency as a tenant attribute. |
| `database_name` | Appeared in rejected `03-Data-Model-Tenant-Management.md` only. Does not exist in `TenantEntity.java`. Infrastructure concern for per-tenant database routing — not registry identity. |
| `retention_policy_id` | Appeared in rejected data model only. No as-is backing, no settled requirement. |

### Provisioning inputs excluded from registry persistence

| Field | Rationale |
|-------|-----------|
| `admin_email` | Provisioning input, not a tenant-registry attribute. The create form collects admin email to establish the initial tenant-admin linkage. Tenant-to-current-admin linkage is an R02 package-level concern deferred to a later chunk (see section 6, item 5). |
| License seat counts | Security concern: storing license allocations as plain database columns allows direct manipulation, bypassing business rules. License storage requires a tamper-resistant design — separate chunk (see section 6, item 1). |

### Runtime-derived values excluded from registry persistence

| Field | Rationale |
|-------|-----------|
| `health_status` | RC-005 (`REVIEW-COMMENTS-REGISTER.md`): no specification in any R02 artifact defines what health/operational flags are, where they are stored, or whether they are persisted or runtime-computed. Unresolved — see section 5, item 3. |

---

## 5. Unresolved Registry-Only Items

These items affect the tenant registry but cannot be resolved without explicit decision or additional specification.

### 5.1 TenantStatus enum values

The as-is `TenantStatus` enum (referenced by `TenantEntity.java:55–57`) contains 11 values. No canonical R02 source defines a target reduction. The target enum values are **unresolved** — they require an explicit decision before this artifact can be finalized.

As-is values for reference only (not a target proposal):

```
PENDING, ACTIVE, SUSPENDED, DEACTIVATED, ARCHIVED,
DECOMMISSIONED, PROVISIONING, PROVISIONING_FAILED,
MAINTENANCE, LOCKED, ERROR
```

### 5.2 Lifecycle fields placement

The as-is entity carries suspension columns (`suspension_reason`, `suspension_notes`, `suspended_at`, `estimated_reactivation_date`) and deletion columns (`decommissioned_at`) directly on the `tenants` table.

**Decision needed:** do these fields belong on the registry record, or should they be managed in a separate lifecycle/management chunk? The answer depends on whether lifecycle state transitions are a registry-level or management-level concern.

### 5.3 RC-005 health/operational flags

RC-005 (`REVIEW-COMMENTS-REGISTER.md`): "Required tenant flags and health-related fields were provided earlier but are missing from the current model."

No R02 artifact specifies what these flags are, their data types, their storage location, or whether they are persisted or runtime-computed. This item remains **unresolved** until a specification is provided.

---

## 6. Deferred to Subsequent Chunks

These items are explicitly out of scope for the Tenant Registry chunk but are tracked as R02 package-level concerns requiring their own design chunks.

1. **License storage design:** Tamper-resistant storage for 4 license types (tenant, admin, user, viewer). Cannot be plain database columns. Assigned during tenant provisioning, read-only on frontend.
2. **Audit log table:** Phase 2 management concern (`01-PRD-Tenant-Management.md:133`, capability #9). Columns, retention policy, query patterns.
3. **Health check table:** Phase 3 management concern (`01-PRD-Tenant-Management.md:136`, capability #12, MASTER tenant only).
4. **RC-005 health/operational flags:** No specification yet. Design decision pending on what the flags are and whether they are stored or computed.
5. **Tenant-to-current-admin linkage:** `admin_email` is a provisioning input. How the registry relates to its current admin user is an R02 package-level concern. Must not be dropped from R02 — deferred to a tenant-management or auth-management chunk.

---

## 7. Source Register

This artifact is derived from:

| Source | Role |
|--------|------|
| `REVIEW-COMMENTS-REGISTER.md` (RC-001 through RC-018) | Binding review corrections |
| `03-DATA-MODEL-REWRITE-BRIEF.md` | Rewrite mandate and structure rules |
| `01-PRD-Tenant-Management.md` | Canonical requirement source |
| `TenantEntity.java` | As-is technical baseline |
| `_parking/create-tenant.models.ts` | Approved supporting input (RC-017) |
| `06-forks-gaps-blockers.md` (FD-01 through FD-06) | Frozen architecture decisions |
| `05-topology-contract.md` | Database topology baseline |

**RC items referenced but not marked as addressed:** RC-001, RC-002, RC-003, RC-004, RC-005, RC-006, RC-007, RC-008, RC-009, RC-010, RC-011, RC-012, RC-013, RC-015, RC-016, RC-018. Status updates to the register will occur only after this draft is reviewed and approved.
