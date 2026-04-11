# Data Model: Localization Service

**Version:** 3.0.0
**Date:** March 11, 2026
**Status:** [IMPLEMENTED] — 6 core tables exist in `V1__init.sql`; schema extensions [PLANNED]; tenant overrides [PLANNED] (overlay pattern)
**Owner:** DBA Agent

**Evidence:** [V1__init.sql](backend/localization-service/src/main/resources/db/migration/V1__init.sql)

---

## 1. Entity-Relationship Diagram

```mermaid
erDiagram
    SYSTEM_LOCALES {
        bigserial id PK
        varchar10 code UK "e.g., en-US, ar-AE"
        varchar100 name "e.g., English (United States)"
        varchar4 country_code "e.g., US, AE"
        int lcid "Windows LCID"
        varchar3 text_direction "LTR or RTL"
        boolean is_active "Default false"
        boolean is_alternative "Only one true"
        timestamp activated_at
        timestamp created_at
        timestamp updated_at
        bigint version "@Version optimistic lock"
    }

    DICTIONARY_ENTRIES {
        bigserial id PK
        varchar255 technical_name UK "e.g., auth.login.welcome"
        varchar100 module "e.g., auth, admin, shell"
        text translator_notes "[PLANNED] Context hint for admins"
        integer max_length "[PLANNED] Character limit per context"
        varchar_array tags "[PLANNED] Categorization tags"
        timestamp created_at
        timestamp updated_at
        bigint version "@Version"
    }

    DICTIONARY_TRANSLATIONS {
        bigserial id PK
        bigint entry_id FK
        varchar10 locale_code FK
        text value "Translated text"
        varchar20 status "[PLANNED] ACTIVE, PENDING_REVIEW, REJECTED"
        timestamp created_at
        timestamp updated_at
        bigint version "@Version"
    }

    DICTIONARY_VERSIONS {
        bigserial id PK
        int version_number UK "Auto-increment per commit"
        varchar20 change_type "EDIT, IMPORT, ROLLBACK"
        varchar500 change_summary
        jsonb snapshot_data "Full dictionary snapshot"
        boolean is_current "Only one true"
        varchar255 created_by "User email/ID"
        timestamp created_at
        bigint version "@Version"
    }

    USER_LOCALE_PREFERENCES {
        bigserial id PK
        varchar255 user_id UK "JWT sub claim"
        varchar10 locale_code FK
        varchar20 preference_source "MANUAL, DETECTED, MIGRATED"
        timestamp created_at
        timestamp updated_at
    }

    LOCALE_FORMAT_CONFIGS {
        bigserial id PK
        bigint locale_id FK UK
        varchar50 calendar_system "gregorian, hijri"
        varchar20 numeral_system "western, eastern_arabic"
        varchar10 currency_code "USD, AED, EUR"
        varchar50 date_format "dd/MM/yyyy, MM/dd/yyyy"
        varchar50 time_format "HH:mm, hh:mm a"
        timestamp created_at
        timestamp updated_at
    }

    TENANT_TRANSLATION_OVERRIDES {
        bigserial id PK
        varchar50 tenant_id "[PLANNED] Tenant UUID"
        bigint entry_id FK
        varchar10 locale_code FK
        text override_value "Tenant-specific translation"
        varchar20 override_source "MANUAL, IMPORTED"
        boolean is_active "Default true"
        varchar255 created_by "Admin who created override"
        timestamp created_at
        timestamp updated_at
        bigint version "@Version"
    }

    SYSTEM_LOCALES ||--o{ DICTIONARY_TRANSLATIONS : "locale_code"
    DICTIONARY_ENTRIES ||--o{ DICTIONARY_TRANSLATIONS : "entry_id"
    SYSTEM_LOCALES ||--o| LOCALE_FORMAT_CONFIGS : "locale_id"
    SYSTEM_LOCALES ||--o{ USER_LOCALE_PREFERENCES : "locale_code"
    SYSTEM_LOCALES ||--o{ TENANT_TRANSLATION_OVERRIDES : "locale_code"
    DICTIONARY_ENTRIES ||--o{ TENANT_TRANSLATION_OVERRIDES : "entry_id"
```

---

## 2. Table Details

### 2.1 system_locales

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | `BIGSERIAL` | PK | Auto-generated |
| `code` | `VARCHAR(10)` | UNIQUE, NOT NULL | BCP 47 format |
| `name` | `VARCHAR(100)` | NOT NULL | Display name |
| `country_code` | `VARCHAR(4)` | NOT NULL | ISO 3166-1 alpha-2 |
| `lcid` | `INTEGER` | | Windows Locale ID |
| `text_direction` | `VARCHAR(3)` | NOT NULL, DEFAULT 'LTR' | 'LTR' or 'RTL' |
| `is_active` | `BOOLEAN` | DEFAULT FALSE | Available in language switcher |
| `is_alternative` | `BOOLEAN` | DEFAULT FALSE | Fallback locale (only one) |
| `activated_at` | `TIMESTAMP` | | When last activated |
| `created_at` | `TIMESTAMP` | DEFAULT NOW() | |
| `updated_at` | `TIMESTAMP` | DEFAULT NOW() | |
| `version` | `BIGINT` | DEFAULT 0 | `@Version` optimistic lock |

**Seed data:** 10 locales (en-US, ar-AE, fr-FR, de-DE, es-ES, it-IT, pt-BR, ja-JP, zh-CN, hi-IN). Only en-US is active and alternative by default.

**Indexes:**
- `idx_system_locales_code` on `code` (unique)
- `idx_system_locales_active` on `is_active`

### 2.2 dictionary_entries

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | `BIGSERIAL` | PK | |
| `technical_name` | `VARCHAR(255)` | UNIQUE, NOT NULL | Dot-separated key |
| `module` | `VARCHAR(100)` | | Grouping (auth, admin, shell, etc.) |
| `translator_notes` | `TEXT` | | [PLANNED] Context hint for admins (e.g., "button label", "error toast") |
| `max_length` | `INTEGER` | | [PLANNED] Character limit per UI context (validated on save) |
| `tags` | `VARCHAR[]` | | [PLANNED] Categorization (ui, error, email, notification, etc.) |
| `created_at` | `TIMESTAMP` | DEFAULT NOW() | |
| `updated_at` | `TIMESTAMP` | DEFAULT NOW() | |
| `version` | `BIGINT` | DEFAULT 0 | `@Version` |

**Planned fields rationale (stakeholder decision 2026-03-11):**
- `translator_notes` — Provides context for admins editing translations (e.g., "This is a short button label")
- `max_length` — Validates that translations fit within PrimeNG UI constraints (e.g., 200px cell = ~25 chars)
- `tags` — Enables filtering by category in the dictionary tab
- ~~`screenshot_url`~~ — Removed per stakeholder decision: admin-driven workflow does not require visual context
- ~~`glossary_enforced`~~ — Deferred: glossary feature not in current scope

**Indexes:**
- `idx_dict_entries_name` on `technical_name` (unique)
- `idx_dict_entries_module` on `module`

### 2.3 dictionary_translations

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | `BIGSERIAL` | PK | |
| `entry_id` | `BIGINT` | FK → dictionary_entries, NOT NULL | |
| `locale_code` | `VARCHAR(10)` | FK → system_locales.code, NOT NULL | |
| `value` | `TEXT` | | Translation text (max 5000 chars enforced at app level) |
| `status` | `VARCHAR(20)` | DEFAULT 'ACTIVE' | [PLANNED] ACTIVE, PENDING_REVIEW, REJECTED |
| `created_at` | `TIMESTAMP` | DEFAULT NOW() | |
| `updated_at` | `TIMESTAMP` | DEFAULT NOW() | |
| `version` | `BIGINT` | DEFAULT 0 | `@Version` |

**Unique constraint:** `(entry_id, locale_code)` — one translation per entry per locale

**Status field rationale (stakeholder decision 2026-03-11):**

| Status | Included in Bundle | Set By |
|--------|-------------------|--------|
| `ACTIVE` | Yes | Manual edit, CSV import, agent auto-translation (unambiguous terms) |
| `PENDING_REVIEW` | No | Agent flags ambiguous/multi-meaning term for HITL review |
| `REJECTED` | No | Admin rejects agent suggestion; must re-translate manually |

**Note:** No `DRAFT` or `UNDER_REVIEW` states. Manual translations and imports are trusted immediately. Only agentic translations of complex terms require HITL review.

**Indexes:**
- `idx_dict_translations_entry` on `entry_id`
- `idx_dict_translations_locale` on `locale_code`

### 2.4 dictionary_versions

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | `BIGSERIAL` | PK | |
| `version_number` | `INTEGER` | UNIQUE, NOT NULL | Auto-incremented |
| `change_type` | `VARCHAR(20)` | NOT NULL | EDIT, IMPORT, ROLLBACK |
| `change_summary` | `VARCHAR(500)` | | Human-readable description |
| `snapshot_data` | `JSONB` | | Full dictionary state at this version |
| `is_current` | `BOOLEAN` | DEFAULT FALSE | Points to latest version |
| `created_by` | `VARCHAR(255)` | | User who created this version |
| `created_at` | `TIMESTAMP` | DEFAULT NOW() | |
| `version` | `BIGINT` | DEFAULT 0 | `@Version` |

**Note:** `snapshot_data` is excluded from list queries (DTO projection) to avoid large payloads. Only loaded when viewing version detail or performing rollback.

**Indexes:**
- `idx_dict_versions_number` on `version_number` (unique)
- `idx_dict_versions_current` on `is_current`

### 2.5 user_locale_preferences

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | `BIGSERIAL` | PK | |
| `user_id` | `VARCHAR(255)` | UNIQUE, NOT NULL | JWT `sub` claim |
| `locale_code` | `VARCHAR(10)` | FK → system_locales.code, NOT NULL | |
| `preference_source` | `VARCHAR(20)` | | MANUAL, DETECTED, MIGRATED |
| `created_at` | `TIMESTAMP` | DEFAULT NOW() | |
| `updated_at` | `TIMESTAMP` | DEFAULT NOW() | |

**Upsert semantics:** `ON CONFLICT (user_id) DO UPDATE` — last write wins

### 2.6 locale_format_configs

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | `BIGSERIAL` | PK | |
| `locale_id` | `BIGINT` | FK → system_locales, UNIQUE, NOT NULL | One config per locale |
| `calendar_system` | `VARCHAR(50)` | | gregorian, hijri, buddhist |
| `numeral_system` | `VARCHAR(20)` | | western, eastern_arabic, devanagari |
| `currency_code` | `VARCHAR(10)` | | ISO 4217 (USD, AED, EUR) |
| `date_format` | `VARCHAR(50)` | | Pattern string |
| `time_format` | `VARCHAR(50)` | | Pattern string |
| `created_at` | `TIMESTAMP` | DEFAULT NOW() | |
| `updated_at` | `TIMESTAMP` | DEFAULT NOW() | |

### 2.7 tenant_translation_overrides [PLANNED]

**Status:** [PLANNED] — Overlay pattern for tenant-specific translation customization (FR-15)

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | `BIGSERIAL` | PK | |
| `tenant_id` | `VARCHAR(50)` | NOT NULL | Cross-service reference to tenant UUID (no DB FK) |
| `entry_id` | `BIGINT` | FK → dictionary_entries, NOT NULL | Global key being overridden |
| `locale_code` | `VARCHAR(10)` | FK → system_locales.code, NOT NULL | |
| `override_value` | `TEXT` | NOT NULL | Tenant-specific translation (max 5000 chars at app level) |
| `override_source` | `VARCHAR(20)` | DEFAULT 'MANUAL' | `MANUAL` or `IMPORTED` |
| `is_active` | `BOOLEAN` | DEFAULT TRUE | Soft-disable without deleting |
| `created_by` | `VARCHAR(255)` | | Admin who created the override |
| `created_at` | `TIMESTAMP` | DEFAULT NOW() | |
| `updated_at` | `TIMESTAMP` | DEFAULT NOW() | |
| `version` | `BIGINT` | DEFAULT 0 | `@Version` optimistic lock |

**Unique constraint:** `(tenant_id, entry_id, locale_code)` — one override per tenant per entry per locale

**Indexes:**
- `idx_tenant_overrides_lookup` on `(tenant_id, locale_code)` WHERE `is_active = TRUE` — partial index for bundle generation
- `idx_tenant_overrides_entry` on `entry_id` — for cascade invalidation when global entry changes

**Bundle merge precedence:**
1. Load global translations (`dictionary_translations WHERE status = 'ACTIVE'`)
2. Load tenant overrides (`tenant_translation_overrides WHERE tenant_id = ? AND is_active = TRUE`)
3. Merge: tenant overrides replace global values for matching keys
4. Cache key: `bundle:{tenantId}:{localeCode}` (null tenantId → `bundle:global:{localeCode}`)

**Security:**
- Tenant isolation enforced via `TenantAccessValidator` — Tenant A cannot access Tenant B's overrides
- Endpoints require `ROLE_ADMIN` or `ROLE_SUPER_ADMIN`
- `tenant_id` validated against JWT `tenant_id` claim via `X-Tenant-ID` header

---

## 3. Scope Classification

| Entity | Scope | Rationale |
|--------|-------|-----------|
| system_locales | GLOBAL | Same locales for all tenants |
| dictionary_entries | GLOBAL | Same keys for all tenants |
| dictionary_translations | GLOBAL | Base translations shared by all tenants |
| dictionary_versions | GLOBAL | Single version history |
| user_locale_preferences | GLOBAL (user-scoped) | Per-user preference, not per-tenant |
| locale_format_configs | GLOBAL | Format config tied to locale, not tenant |
| tenant_translation_overrides | TENANT-SCOPED | [PLANNED] Per-tenant overrides that overlay global translations |

**Architecture Decision (SA condition DM-04, updated):** Core entities (6 tables) are GLOBAL. Tenant-specific translation overrides use the **overlay pattern** — a separate `tenant_translation_overrides` table scoped by `tenant_id` that merges with global translations at bundle generation time. Global translations remain the base; tenants customize only the keys they need to differ.

---

## 4. Translation Bundle (Computed DTO)

**Architecture Decision (SA condition SB-03):** `translation_bundle` is NOT a table. It is a computed DTO assembled at runtime:

```json
{
  "locale": "ar-AE",
  "version": 48,
  "entries": {
    "auth.login.welcome": "مرحباً بكم في EMSIST",
    "auth.login.sign_in": "تسجيل الدخول",
    "admin.nav.administration": "الإدارة"
  }
}
```

**Assembly (global bundle):**
```sql
SELECT e.technical_name, t.value
FROM dictionary_entries e
JOIN dictionary_translations t ON e.id = t.entry_id
WHERE t.locale_code = :code AND t.status = 'ACTIVE'
```

**Assembly (tenant-aware bundle):** [PLANNED]
```sql
-- Step 1: Global base
SELECT e.technical_name, t.value FROM dictionary_entries e
JOIN dictionary_translations t ON e.id = t.entry_id
WHERE t.locale_code = :code AND t.status = 'ACTIVE'

-- Step 2: Tenant overrides (merged in application code)
SELECT e.technical_name, o.override_value FROM dictionary_entries e
JOIN tenant_translation_overrides o ON e.id = o.entry_id
WHERE o.tenant_id = :tenantId AND o.locale_code = :code AND o.is_active = TRUE
```

**Caching:**
- Global bundle: `bundle:global:{locale_code}` — invalidated on dictionary commit
- Tenant bundle: `bundle:{tenant_id}:{locale_code}` — invalidated on override change or global dictionary commit

---

## Changelog

| Version | Date | Changes |
|---------|------|---------|
| 3.0.0 | 2026-03-11 | Added tenant_translation_overrides table (overlay pattern, FR-15); updated ER diagram with tenant override relationships; updated scope classification (DM-04 revised); updated bundle assembly with tenant-aware merge logic |
| 2.0.0 | 2026-03-11 | Stakeholder feedback: added translator_notes, max_length, tags to dictionary_entries; added status to dictionary_translations; removed screenshot_url; documented status workflow for agentic HITL |
| 1.0.0 | 2026-03-11 | Initial data model with ER diagram, all 6 tables documented |
