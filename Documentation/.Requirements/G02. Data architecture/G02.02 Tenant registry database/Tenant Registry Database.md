# Tenant Registry Database

**Track:** R02. TENANT MANAGEMENT  
**Database:** Tenant Registry PostgreSQL database  
**Status:** Draft  
**Supports:** `G01.02 Tenant Registry`

---

## 1. Purpose

This document defines the **platform-level tenant registry database**.

The tenant registry database owns only the platform record for each tenant:

- tenant identity
- tenant classification
- tenant routing through `tenant_url`
- current lifecycle state
- lock state
- health summary
- lifecycle event history

It does not define tenant-specific module data. Tenant-specific PostgreSQL data and tenant graphs are defined in:

- `Tenant Manager Database/Tenant Manager PostgreSQL Database.md`
- `Tenant Manager Database/Tenant Manager Neo4j Database.md`

---

## 2. Registry Tables

| Table | Purpose |
|-------|---------|
| `registry_locales` | Platform locales available to the tenant registry and other platform-admin surfaces that read registry-owned values |
| `registry_enum_sets` | Registry enum families such as tenant type, tenant status, lock status, health status, and lifecycle actions |
| `registry_enum_values` | Stable coded values inside each registry enum family |
| `registry_enum_value_translations` | Localized labels and descriptions for registry enum values |
| `tenants` | One platform registry record per tenant |
| `tenant_lifecycle_events` | One lifecycle event row per tenant action |

---

## 3. Registry Enum and Translation Rule

Any business-facing coded value in the tenant registry that must be shown in UI, exports, reports, or operator workflows must be treated the same way as in the tenant manager model:

- do not use plain free-text `VARCHAR` as the source of truth for business-facing enum values
- do not use PostgreSQL native enum types as the business contract
- the business row stores a stable enum reference
- the enum catalog stores:
  - machine-friendly numeric code such as `0`, `1`, `2`, `3`
  - stable technical name such as `ACTIVE`, `SUSPENDED`, `ARCHIVED`
  - translated display values and descriptions per locale

This is required for the registry too because `tenant_type`, `tenant_status`, `lock_status`, `health_status`, and lifecycle actions are business-facing values.

Registry translations must not be sourced from the tenant fact sheet or any tenant-specific translation store.

Use this boundary:

- tenant-specific translations belong to the tenant-specific PostgreSQL database
- platform registry translations belong to the tenant registry database

Reason:

- the tenant registry is a platform-level area
- it exists before tenant context is entered
- it must remain readable without depending on tenant-local dictionaries or tenant-locales

### 3.1 Registry Locale and Enum Catalog Tables

#### 3.1.1 `registry_locales`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `locale_code` | `VARCHAR(10)` | PK | Platform locale code |
| `display_name` | `VARCHAR(100)` | NOT NULL | Locale display name |
| `direction` | `VARCHAR(10)` | NOT NULL | `LTR` or `RTL` |
| `active_flag` | `BOOLEAN` | NOT NULL | Active-locale indicator |
| `created_at` | `TIMESTAMPTZ` | NOT NULL DEFAULT `now()` | Creation timestamp |

#### 3.1.2 `registry_enum_sets`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `enum_set_id` | `UUID` | PK, DEFAULT `gen_random_uuid()` | Enum-set identifier |
| `set_key` | `VARCHAR(100)` | UNIQUE NOT NULL | Stable technical key such as `tenant_status` |
| `set_name` | `VARCHAR(255)` | NOT NULL | Human-readable enum-set name |
| `set_description` | `TEXT` | NULL | Description of the enum family |
| `active_flag` | `BOOLEAN` | NOT NULL DEFAULT `true` | Active enum-set indicator |
| `created_at` | `TIMESTAMPTZ` | NOT NULL DEFAULT `now()` | Creation timestamp |
| `updated_at` | `TIMESTAMPTZ` | NOT NULL DEFAULT `now()` | Update timestamp |

#### 3.1.3 `registry_enum_values`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `enum_value_id` | `UUID` | PK, DEFAULT `gen_random_uuid()` | Enum-value identifier |
| `enum_set_id` | `UUID` | FK -> `registry_enum_sets(enum_set_id)`, NOT NULL | Parent enum set |
| `value_code` | `INTEGER` | NOT NULL | Stable numeric code such as `0`, `1`, `2`, `3` |
| `technical_name` | `VARCHAR(100)` | NOT NULL | Stable technical value such as `ACTIVE` |
| `sort_order` | `INTEGER` | NOT NULL | Display ordering |
| `active_flag` | `BOOLEAN` | NOT NULL DEFAULT `true` | Active-value indicator |
| `default_flag` | `BOOLEAN` | NOT NULL DEFAULT `false` | Default value indicator |
| `created_at` | `TIMESTAMPTZ` | NOT NULL DEFAULT `now()` | Creation timestamp |
| `updated_at` | `TIMESTAMPTZ` | NOT NULL DEFAULT `now()` | Update timestamp |

#### 3.1.4 `registry_enum_value_translations`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `translation_id` | `UUID` | PK, DEFAULT `gen_random_uuid()` | Translation identifier |
| `enum_value_id` | `UUID` | FK -> `registry_enum_values(enum_value_id)`, NOT NULL | Parent enum value |
| `locale_code` | `VARCHAR(10)` | FK -> `registry_locales(locale_code)`, NOT NULL | Target locale |
| `display_name` | `VARCHAR(255)` | NOT NULL | Localized display value |
| `description` | `TEXT` | NULL | Localized description |
| `help_text` | `TEXT` | NULL | Optional localized help text |
| `updated_at` | `TIMESTAMPTZ` | NOT NULL DEFAULT `now()` | Update timestamp |

### 3.2 Registry Enum Families

| Enum | Values | Meaning |
|------|--------|---------|
| `tenant_type` | `MASTER`, `DOMINANT`, `REGULAR` | Tenant classification |
| `tenant_status` | `PROVISIONING`, `ACTIVE`, `SUSPENDED`, `ARCHIVED` | Current tenant lifecycle state |
| `lock_status` | `LOCKED`, `UNLOCKED` | Editing/protection lock state |
| `health_status` | `FAILED`, `WARNING`, `HEALTHY` | Registry health summary |
| `tenant_lifecycle_action` | `CREATE`, `ACTIVATE`, `SUSPEND`, `ARCHIVE`, `RESTORE`, `PERMANENT_DELETE` | Lifecycle actions recorded in history |

Notes:

- `tenant_url` is the routing attribute used by the registry model.
- `PERMANENT_DELETE` is modeled as a lifecycle action, not as a steady-state `tenant_status`.
- These values are modeled as seeded rows in `registry_enum_sets` and `registry_enum_values`, not as PostgreSQL enum types.

---

## 4. Table Definitions

### 4.1 `tenants`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `UUID` | PK, DEFAULT `gen_random_uuid()` | Immutable tenant identifier |
| `full_name` | `VARCHAR(255)` | NOT NULL | Tenant display name |
| `shortname` | `VARCHAR(100)` | UNIQUE NOT NULL | Short tenant name |
| `tenant_url` | `VARCHAR(255)` | UNIQUE NOT NULL | Routing URL/host for the tenant |
| `tenant_type_enum_value_id` | `UUID` | FK -> `registry_enum_values(enum_value_id)`, NOT NULL | Tenant classification |
| `tenant_status_enum_value_id` | `UUID` | FK -> `registry_enum_values(enum_value_id)`, NOT NULL | Current lifecycle state |
| `lock_status_enum_value_id` | `UUID` | FK -> `registry_enum_values(enum_value_id)`, NOT NULL | Editing/protection lock state |
| `health_status_enum_value_id` | `UUID` | FK -> `registry_enum_values(enum_value_id)`, NOT NULL | Current registry health summary |
| `created_at` | `TIMESTAMPTZ` | NOT NULL DEFAULT `now()` | Record creation timestamp |
| `updated_at` | `TIMESTAMPTZ` | NOT NULL DEFAULT `now()` | Record update timestamp |

Indexes:

| Index | Columns | Type | Rationale |
|-------|---------|------|-----------|
| `pk_tenants` | `id` | PRIMARY KEY | Registry primary key |
| `uq_tenants_shortname` | `shortname` | UNIQUE | Lookup by shortname |
| `uq_tenants_tenant_url` | `tenant_url` | UNIQUE | Routing by tenant URL |

### 4.2 `tenant_lifecycle_events`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `UUID` | PK, DEFAULT `gen_random_uuid()` | Lifecycle event identifier |
| `tenant_id` | `UUID` | FK -> `tenants(id)`, NOT NULL | Parent tenant |
| `action_enum_value_id` | `UUID` | FK -> `registry_enum_values(enum_value_id)`, NOT NULL | Lifecycle action performed |
| `from_status_enum_value_id` | `UUID` | FK -> `registry_enum_values(enum_value_id)`, NULL | Status before the action when applicable |
| `to_status_enum_value_id` | `UUID` | FK -> `registry_enum_values(enum_value_id)`, NULL | Status after the action when applicable |
| `reason` | `VARCHAR(100)` | NULL | Business reason code or short label |
| `notes` | `TEXT` | NULL | Free-text operator notes |
| `acted_by` | `UUID` | NULL | Actor who initiated the action |
| `occurred_at` | `TIMESTAMPTZ` | NOT NULL DEFAULT `now()` | When the action occurred |

Indexes:

| Index | Columns | Type | Rationale |
|-------|---------|------|-----------|
| `pk_tenant_lifecycle_events` | `id` | PRIMARY KEY | Lifecycle event primary key |
| `ix_tenant_lifecycle_events_tenant` | `tenant_id` | BTREE | Retrieve tenant history |
| `ix_tenant_lifecycle_events_action` | `action_enum_value_id` | BTREE | Retrieve action-specific history |

---

## 5. Lifecycle Alignment to `G01.02 Tenant Registry`

The registry database supports these lifecycle actions from the business baseline:

| G01 journey | Registry action | Effect on tenant status |
|------------|-----------------|-------------------------|
| `Activate Tenant` | `ACTIVATE` | `PROVISIONING` or `SUSPENDED` -> `ACTIVE` |
| `Suspend Tenant` | `SUSPEND` | `ACTIVE` -> `SUSPENDED` |
| `Archive Tenant` | `ARCHIVE` | `ACTIVE` or `SUSPENDED` -> `ARCHIVED` |
| `Restore Tenant` | `RESTORE` | `ARCHIVED` -> `ACTIVE` |
| `Permanently Delete Tenant` | `PERMANENT_DELETE` | Terminal destructive action |

Notes:

- `ARCHIVED` is a registry state because it appears in the active `G01.02 Tenant Registry` journeys.
- `PERMANENT_DELETE` is retained as an action. Whether the tenant row is hard-deleted immediately or after a retention rule is an operations rule outside this document.

---

## 6. Current-to-Target Corrections

This document intentionally normalizes the current registry baseline as follows:

- use `tenant_url` as the registry routing attribute
- treat registry enums the same way as tenant-manager enums through enum references and translation tables
- remove `INACTIVE` from the active registry baseline
- include `ARCHIVED` because it is already approved in `G01.02 Tenant Registry`
- remove old architecture readings such as `definitions_db_name`
- keep tenant-specific data out of the registry document

---

## 7. Source Alignment

This registry document is aligned to:

- `G01.02 Tenant Registry`
- `G01.02.01.01 View Tenant List`
- the current platform decision that the tenant registry is separate from tenant-specific PostgreSQL and graph data
