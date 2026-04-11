# Business Requirements Document: Localization (R06)

**Document ID:** R06-BRD-v5
**Version:** 5.0.0
**Date:** 2026-03-19
**Status:** [PLANNED]
**Owner:** BA Agent
**Supersedes:** 01-PRD.md v4.0.0

---

## Change Log

| Version | Date | Summary |
|---------|------|---------|
| 5.0.0 | 2026-03-19 | Complete rewrite based on validated user decisions. Removes phantom `localization-service` architecture. Aligns with actual codebase: `message_registry` + `message_translation` in tenant-service `master_db`, `AuthUiTextService` + `AuthLocalizedMessageResolver` in frontend/auth-facade. Introduces dictionary and translation tables, tenant cloning model, simplified admin UI. Cancels import/export, AI translation, HITL review, rollback, versioning, format configs, overlay pattern. |

---

## Companion Delivery Contracts

The following documents are mandatory companion contracts for implementation. This BRD defines business intent and feature scope; these documents define the v5 delivery contract for UI scope, design-system compliance, Angular test coverage, and CI enforcement.

| Contract | Purpose |
|----------|---------|
| [`R06-UI-Spec-v5.md`](./R06-UI-Spec-v5.md) | Authoritative Angular UI scope for v5, including `Languages`, `Dictionary`, edit/restore dialogs, and shared language switcher placement. |
| [`R06-Design-System-Validation-v5.md`](./R06-Design-System-Validation-v5.md) | Pass/fail design-system contract for localization UI against the real EMSIST design system. |
| [`R06-Angular-Test-Strategy-v5.md`](./R06-Angular-Test-Strategy-v5.md) | Required Angular unit/component test inventory and scenario coverage for v5 localization delivery. |
| [`R06-CI-Quality-Gates-v5.md`](./R06-CI-Quality-Gates-v5.md) | Required CI and merge-gate checks for localization frontend work. |

When a business requirement in this BRD needs UI behavior, automated test scope, or design-system interpretation, these four documents are the governing implementation references.

---

## 1. Business Objectives

### 1.1 Why Localization Matters for EMSIST

EMSIST is a multi-tenant SaaS platform targeting UAE government agencies and enterprise clients. Localization is a business-critical capability for the following reasons:

| Objective | Business Value |
|-----------|---------------|
| **UAE government compliance** | UAE digital government standards mandate Arabic-first UX as an option for all government-facing systems. Without Arabic support, EMSIST cannot be deployed to government tenants. |
| **Multi-market expansion** | Tenants operate across English, Arabic, French, Hindi, and other language markets. Each tenant must be able to activate the languages relevant to their workforce. |
| **User productivity** | End users working in their preferred language make fewer errors and complete tasks faster. A language switcher in the header removes friction. |
| **Tenant autonomy** | Each tenant must be able to customize translations independently without affecting other tenants or requiring platform-level changes. |
| **Developer velocity** | Centralizing all translatable strings in a dictionary eliminates hardcoded strings scattered across 816+ locations in the codebase, making future string changes a data operation rather than a code change. |

### 1.2 Current State Assessment

The following localization infrastructure already exists in the codebase:

| Component | Location | Status |
|-----------|----------|--------|
| `message_registry` table | `tenant-service` `master_db` (V8 migration) | Exists. Stores error/warning/confirmation/info/label/status metadata (code, type, category, http_status, default_title, default_detail). |
| `message_translation` table | `tenant-service` `master_db` (V8 migration) | Exists. Stores localized title/detail per code + locale_code. Currently has Arabic translations for AUTH and COM codes. |
| `tenant_message_translation` table | `tenant-service` `master_db` (V12 migration) | Exists. Tenant-scoped overrides keyed by (tenant_uuid, code, locale_code). |
| `MessageRegistryEntity` | `backend/tenant-service` | Exists. JPA entity mapping `message_registry` table. |
| `MessageRegistryService` | `backend/tenant-service` | Exists. Service layer for message resolution. |
| `InternalMessageRegistryController` | `backend/tenant-service` | Exists. Internal API for cross-service message resolution. |
| `AuthLocalizedMessageResolver` | `backend/auth-facade` | Exists. Resolves error messages with locale candidate chain (full tag, language, English fallback). |
| `MessageRegistryClient` | `backend/auth-facade` | Exists. Feign client calling tenant-service internal message API. |
| `AuthUiTextService` | `frontend/src/app/core/i18n/` | Exists. Signal-based service that preloads AUTH UI messages with hardcoded fallbacks for 25 codes. |
| `localeHeaderInterceptor` | `frontend/src/app/core/interceptors/` | Exists. HTTP interceptor that sends `Accept-Language` header based on browser language. |
| `MasterLocaleSectionComponent` | `frontend/src/app/features/administration/sections/master-locale/` | Exists. Stub admin UI with hardcoded language/region dropdowns. No backend integration. |
| Seeded messages | V8, V12, V13, V14 migrations | Exists. 42 message codes seeded (8 COM-*, 17 AUTH-E/C-*, 9 AUTH-I/C/E-*, 16 AUTH-L-*) with Arabic translations. |

**What does NOT exist** (contrary to previous design documents):

| Claimed Component | Reality |
|-------------------|---------|
| `localization-service` microservice | Does not exist. No `backend/localization-service/` directory. |
| `system_locales` table | Does not exist. |
| `dictionary_entries` table | Does not exist. |
| `dictionary_translations` table | Does not exist. |
| `dictionary_versions` table | Does not exist. |
| `user_locale_preferences` table | Does not exist. |
| `locale_format_configs` table | Does not exist. |
| `tenant_translation_overrides` table (overlay pattern) | Does not exist. `tenant_message_translation` exists but is a different schema. |
| Valkey bundle caching | Does not exist. |
| TranslationService (general-purpose) | Does not exist. `AuthUiTextService` is limited to AUTH codes. |
| TranslatePipe | Does not exist. |

### 1.3 Target State

Evolve the existing `message_registry` + `message_translation` infrastructure in `tenant-service` by adding a **dictionary** table for all translatable UI strings and a **translation** table for their localized values. No new microservice. The message registry continues to provide error/warning metadata; the dictionary provides all user-facing text.

---

## 2. Stakeholders and Personas

### 2.1 Primary Personas

| Registry ID | Name | System Role | Localization Goals |
|-------------|------|-------------|-------------------|
| PER-UX-001 | **Sam Martinez** (Super Admin) | ROLE_SUPER_ADMIN | Manages the master language list. Seeds the master dictionary with all translatable strings. Manages master dictionary entries and translations. Views coverage reports. |
| PER-UX-003 | **Fiona Shaw** (Tenant Admin) | ROLE_ADMIN | Activates/deactivates languages for her tenant. Edits translations in her tenant's cloned dictionary. Restores individual translations to the master default. Sets the tenant's default language. |
| PER-UX-004 | **Lisa Harrison** (End User) | ROLE_USER | Works in her preferred language. Switches language via the header language switcher. Sees all UI text, error messages, labels, and navigation in the selected language. |
| PER-CX-001 | **Kyle Morrison** (Visitor) | Unauthenticated | Sees the login page in the language detected from the browser. Can switch language before signing in. Evaluates the platform in the preferred locale. |

### 2.2 RACI Matrix

| Activity | Super Admin | Tenant Admin | End User | Visitor |
|----------|:-----------:|:------------:|:--------:|:-------:|
| Manage master language list | **A/R** | I | - | - |
| Manage master dictionary | **A/R** | I | - | - |
| Activate/deactivate tenant languages | I | **A/R** | I | - |
| Edit tenant translations | C | **A/R** | - | - |
| Restore translation to master default | - | **A/R** | - | - |
| Set tenant default language | C | **A/R** | - | - |
| Switch UI language | - | R | **R** | **R** |
| Store language preference | - | R | **R** | - |

---

## 3. Feature Requirements

### FR-01: Master Language List Management [PLANNED]

**Description:** The system maintains a master list of supported languages based on Google Workspace language codes. Super Admin can view the full list. Each language has a code, display name, and text direction (LTR/RTL).

**Source:** Google Workspace Admin Directory API language codes (https://developers.google.com/workspace/admin/directory/v1/languages)

**Actors:** Super Admin (PER-UX-001)

**Preconditions:** User is authenticated with ROLE_SUPER_ADMIN.

**Testable Requirements:**
| ID | Requirement |
|----|-------------|
| FR-01.1 | The `supported_languages` table in `master_db` contains the full Google Workspace language code list with columns: `code` (PK, VARCHAR(10)), `display_name` (VARCHAR(100)), `text_direction` (VARCHAR(3), default 'LTR'), `created_at` (TIMESTAMP). |
| FR-01.2 | Super Admin can view the full language list via the Administration > Localization section. |
| FR-01.3 | The language list is read-only at the master level. Languages are not added or removed by users; they are seeded from the Google Workspace reference. |

---

### FR-02: Dictionary Management [PLANNED]

**Description:** The dictionary table in `master_db` stores every translatable string in the EMSIST platform. Each entry has a unique `technical_name`, a `default_value` (always English), and an optional `module` reference.

**Actors:** Super Admin (PER-UX-001)

**Preconditions:** User is authenticated with ROLE_SUPER_ADMIN.

**Testable Requirements:**
| ID | Requirement |
|----|-------------|
| FR-02.1 | The `dictionary` table in `master_db` has columns: `technical_name` (PK, VARCHAR(255)), `default_value` (TEXT, NOT NULL), `module` (VARCHAR(100), nullable), `created_at` (TIMESTAMP), `updated_at` (TIMESTAMP). |
| FR-02.2 | `technical_name` is a unique key for every translatable string (e.g., `BTN_SIGN_IN`, `AUTH-E-028`, `NAV_ADMINISTRATION`). |
| FR-02.3 | `default_value` is always English and is always present (NOT NULL). |
| FR-02.4 | `module` is an optional reference to which module owns the string (e.g., `AUTH`, `ADMIN`, `SHELL`, `COMMON`). |
| FR-02.5 | Super Admin can create new dictionary entries via the admin UI or API. |
| FR-02.6 | Super Admin can edit `default_value` and `module` of existing dictionary entries. |
| FR-02.7 | Super Admin can delete dictionary entries. Deleting an entry cascades to all translations in the `translation` table and all tenant-cloned copies. |
| FR-02.8 | Super Admin can browse, search, and filter the dictionary by `technical_name` and `module`. |
| FR-02.9 | The dictionary is paginated with a default page size of 20 rows. |
| FR-02.10 | Error codes (e.g., `AUTH-E-028`) serve as `technical_name` values in the dictionary. The `message_registry` table continues to store metadata (type, category, http_status). The dictionary stores the human-readable text. |

---

### FR-03: Master Translation Management [PLANNED]

**Description:** The translation table in `master_db` stores translated text for each dictionary entry per locale. English text is NOT stored here -- it is the `default_value` in the dictionary table.

**Actors:** Super Admin (PER-UX-001)

**Preconditions:** User is authenticated with ROLE_SUPER_ADMIN. Target language exists in the master language list.

**Testable Requirements:**
| ID | Requirement |
|----|-------------|
| FR-03.1 | The `translation` table in `master_db` has columns: `technical_name` (FK to dictionary, VARCHAR(255)), `locale_code` (VARCHAR(10)), `value` (TEXT), `created_at` (TIMESTAMP), `updated_at` (TIMESTAMP). Primary key is (`technical_name`, `locale_code`). |
| FR-03.2 | English translations are never stored in the `translation` table. English text is always read from `dictionary.default_value`. |
| FR-03.3 | Super Admin can view translations for a specific language by clicking the action button on the language row in the language list. |
| FR-03.4 | The translation view displays a table with columns: `technical_name`, `EN default` (read-only, from dictionary.default_value), `[selected language] value` (editable). |
| FR-03.5 | Super Admin can edit a translation value inline or via an edit dialog. |
| FR-03.6 | Super Admin can clear a translation value (set to NULL/empty), which means the system will fall back to the English default. |
| FR-03.7 | The translation view is paginated with a default page size of 20 rows. |
| FR-03.8 | The translation view supports search/filter by `technical_name` and `module`. |
| FR-03.9 | The translation view shows a coverage indicator: "X / Y keys translated (Z%)" for the selected language. |

---

### FR-04: Language Activation/Deactivation per Tenant [PLANNED]

**Description:** Tenant Admin can activate or deactivate languages from the master language list for their tenant. Only activated languages are available to end users in the language switcher.

**Actors:** Tenant Admin (PER-UX-003)

**Preconditions:** User is authenticated with ROLE_ADMIN. Tenant has been provisioned with cloned dictionary data.

**Testable Requirements:**
| ID | Requirement |
|----|-------------|
| FR-04.1 | The Tenant Admin sees a language list page showing all languages from the master list with a checkbox per language indicating active/inactive for this tenant. |
| FR-04.2 | Tenant Admin can activate a language by checking the checkbox. The language becomes available in the tenant's language switcher. |
| FR-04.3 | Tenant Admin can deactivate a language by unchecking the checkbox. The language is removed from the tenant's language switcher. |
| FR-04.4 | The tenant's default language checkbox is always checked and locked (disabled). It cannot be unchecked. See BR-01. |
| FR-04.5 | The `tenant_active_languages` table in the tenant's database stores which languages are active for the tenant: `tenant_id` (FK), `locale_code` (VARCHAR(10)), `is_active` (BOOLEAN), `activated_at` (TIMESTAMP). |
| FR-04.6 | Only active languages are returned by the language switcher API for the tenant. |
| FR-04.7 | Deactivating a language does NOT delete the tenant's translations for that language. Translations are preserved and restored when the language is re-activated. |

---

### FR-05: Default Language Configuration [PLANNED]

**Description:** Each tenant has a default language. The default language is the fallback when a user has no explicit language preference. The system-wide fallback language is always English and is not configurable.

**Actors:** Tenant Admin (PER-UX-003)

**Preconditions:** User is authenticated with ROLE_ADMIN.

**Testable Requirements:**
| ID | Requirement |
|----|-------------|
| FR-05.1 | Tenant Admin can set the tenant's default language from the list of active languages. |
| FR-05.2 | The default language is persisted in the tenant configuration (e.g., `tenants.default_locale` column or tenant settings table). |
| FR-05.3 | The default language is always active and cannot be deactivated. See BR-01. |
| FR-05.4 | The system-wide fallback language is always English (`en`). This is not configurable by any user. See BR-02. |
| FR-05.5 | When a new tenant is provisioned, the default language is English unless specified otherwise during provisioning. |

---

### FR-06: Language Switcher in Application Header [PLANNED]

**Description:** A language switcher component in the application header allows users to select their preferred language. Pre-authentication, browser language detection determines the initial language. Post-authentication, the user's stored preference takes precedence.

**Actors:** End User (PER-UX-004), Visitor (PER-CX-001), Tenant Admin (PER-UX-003)

**Note:** The UX design for the language switcher requires user approval before implementation. This FR defines the functional behavior; visual design is deferred to the UX agent.

**Testable Requirements:**
| ID | Requirement |
|----|-------------|
| FR-06.1 | The language switcher appears in the application header and is visible on all pages, including the pre-authentication login page. |
| FR-06.2 | The language switcher displays the list of active languages for the current tenant (post-auth) or all system languages (pre-auth). |
| FR-06.3 | Selecting a language from the switcher immediately updates all visible UI text to the selected language without a full page reload. |
| FR-06.4 | Pre-authentication: the initial language is determined by browser language detection (`navigator.languages`). If the detected language is not in the active list, English is used. |
| FR-06.5 | Post-authentication: the initial language is the user's stored preference (FR-07). If no preference is stored, the tenant's default language (FR-05) is used. |
| FR-06.6 | Changing the language via the switcher updates the user's stored preference (FR-07) if the user is authenticated. |

---

### FR-07: User Language Preference Storage [PLANNED]

**Description:** Each authenticated user's language preference is stored and retrieved across sessions. The preference is stored in the user's profile or a dedicated preferences table.

**Actors:** End User (PER-UX-004), Tenant Admin (PER-UX-003)

**Preconditions:** User is authenticated.

**Testable Requirements:**
| ID | Requirement |
|----|-------------|
| FR-07.1 | When a user selects a language via the language switcher (FR-06), the preference is persisted to the backend. |
| FR-07.2 | The user's language preference is stored as a `locale_code` value (e.g., `ar`, `fr`, `de`) associated with the user's ID. |
| FR-07.3 | On subsequent logins, the user's stored preference is loaded and applied before the UI renders. |
| FR-07.4 | If the user's stored language is no longer active for the tenant, the system falls back to the tenant's default language and updates the stored preference. |
| FR-07.5 | The preference storage uses upsert semantics: last write wins, no versioning. |

---

### FR-08: Frontend String Externalization [PLANNED]

**Description:** All hardcoded strings in the frontend codebase (652+ identified) are replaced with calls to the translation service or translate pipe. No user-visible string remains hardcoded in Angular templates or TypeScript files.

**Actors:** System (internal requirement)

**Testable Requirements:**
| ID | Requirement |
|----|-------------|
| FR-08.1 | A `TranslationService` (Signal-based) is implemented in `frontend/src/app/core/i18n/`. It loads the translation bundle for the user's selected language and exposes a `translate(technicalName: string): string` method. |
| FR-08.2 | A `TranslatePipe` is implemented for use in Angular templates: `{{ 'BTN_SIGN_IN' \| translate }}`. |
| FR-08.3 | The `TranslationService` supports parameter interpolation: `translate('WELCOME_MSG', { tenantName: 'Acme' })` produces "Welcome to Acme". |
| FR-08.4 | The `TranslationService` falls back to the English `default_value` if no translation exists for the selected language. See BR-02. |
| FR-08.5 | All 652+ frontend hardcoded strings identified in `01-Frontend-String-Inventory.md` are externalized to dictionary entries and referenced via the TranslatePipe or TranslationService. |
| FR-08.6 | The existing `AuthUiTextService` is refactored to use the general `TranslationService` instead of maintaining its own hardcoded fallback map and separate API call. |
| FR-08.7 | The `TranslationService` loads the translation bundle during application initialization (before the first route renders). |
| FR-08.8 | Language switching via the switcher (FR-06) triggers the `TranslationService` to reload the bundle for the new language. The Signal-based reactivity causes all pipes and template bindings to re-render without page reload. |

---

### FR-09: Backend Message Resolution via Dictionary [PLANNED]

**Description:** All backend error messages, validation messages, and user-facing strings (164+ identified) are resolved through the dictionary. The existing `AuthLocalizedMessageResolver` pattern is generalized to a `MessageResolver` that any backend service can use.

**Actors:** System (internal requirement)

**Testable Requirements:**
| ID | Requirement |
|----|-------------|
| FR-09.1 | A single resolver pattern exists: given a `technical_name` and a `locale_code`, the resolver returns the translated `value` from the `translation` table. If no translation exists, it returns the `default_value` from the `dictionary` table (English fallback). |
| FR-09.2 | The resolver supports parameter interpolation: `resolve("AUTH-E-022", "ar", Map.of("retryAfterSeconds", 30))` returns the Arabic string with `{retryAfterSeconds}` replaced by `30`. |
| FR-09.3 | All 164+ backend hardcoded strings identified in `02-Backend-String-Inventory.md` are externalized to dictionary entries. |
| FR-09.4 | The existing `AuthLocalizedMessageResolver` in `auth-facade` continues to work but resolves text from the dictionary table instead of (or in addition to) the `message_registry.default_title` / `message_translation.title` fields. |
| FR-09.5 | The `message_registry` table continues to store metadata (type, category, http_status). The dictionary provides the human-readable text. The error code (e.g., `AUTH-E-028`) IS the `technical_name` in the dictionary. |
| FR-09.6 | The locale for resolution is determined by the `Accept-Language` HTTP header sent by the frontend (existing `localeHeaderInterceptor`). |

---

### FR-10: Tenant Provisioning -- Dictionary Cloning [PLANNED]

**Description:** When a new tenant is provisioned, the master dictionary and translation tables are cloned into the tenant's own database. Each tenant gets their own independent copy of all dictionary entries and translations.

**Actors:** System (automated during provisioning)

**Preconditions:** Tenant provisioning flow exists (tenant_provisioning_steps table in V8 migration).

**Testable Requirements:**
| ID | Requirement |
|----|-------------|
| FR-10.1 | During tenant provisioning, a new step `CLONE_DICTIONARY` is added to the provisioning workflow. |
| FR-10.2 | The `CLONE_DICTIONARY` step copies all rows from `master_db.dictionary` into the tenant's database `dictionary` table. |
| FR-10.3 | The `CLONE_DICTIONARY` step copies all rows from `master_db.translation` into the tenant's database `translation` table. |
| FR-10.4 | The cloned tables have the same schema as the master tables but are fully independent. Changes to the master dictionary do NOT automatically propagate to tenant copies. |
| FR-10.5 | If the `CLONE_DICTIONARY` step fails, the provisioning status is set to `FAILED` with an error message. The step can be retried. |
| FR-10.6 | The provisioning step is idempotent: re-running it on an already-provisioned tenant does not create duplicate entries (upsert or truncate-and-reload semantics). |

---

### FR-11: Tenant Translation Management [PLANNED]

**Description:** Tenant Admin can view and edit translations in their tenant's cloned dictionary. The admin can also restore individual translations to the master default value.

**Actors:** Tenant Admin (PER-UX-003)

**Preconditions:** User is authenticated with ROLE_ADMIN. Tenant has been provisioned.

**Testable Requirements:**
| ID | Requirement |
|----|-------------|
| FR-11.1 | Tenant Admin sees a "Languages" page in the tenant administration section showing the list of languages with activation checkboxes (FR-04) and an action button per language. |
| FR-11.2 | Clicking the action button for a language opens the dictionary view for that language. |
| FR-11.3 | The dictionary view shows a table with columns: `technical_name`, `EN default` (from dictionary.default_value), `[selected language] value` (editable, from the tenant's translation table). |
| FR-11.4 | Tenant Admin can edit a translation value for any dictionary entry in any active language. Changes are saved immediately to the tenant's translation table. |
| FR-11.5 | Each row has a "Restore to original" action that resets the tenant's translation value to the value from the master dictionary (the value that was cloned during provisioning). |
| FR-11.6 | The "Restore to original" action requires a confirmation dialog: "Restore this translation to the master default? Your custom translation will be lost." |
| FR-11.7 | The dictionary view is paginated (default 20 rows), searchable by `technical_name` and `module`, and sortable by `technical_name`. |
| FR-11.8 | The dictionary view shows a visual indicator for entries where the tenant's value differs from the master default (e.g., a "Customized" badge). |

---

### FR-12: Fallback Behavior [PLANNED]

**Description:** When a translation is missing for the user's selected language, the system falls back to the English default value. This fallback is automatic and transparent to the user.

**Actors:** System (internal requirement)

**Testable Requirements:**
| ID | Requirement |
|----|-------------|
| FR-12.1 | Frontend: if the `TranslationService` cannot find a translation for `technical_name` in the selected language, it returns the English `default_value` from the dictionary. |
| FR-12.2 | Backend: if the resolver cannot find a translation for `technical_name` + `locale_code` in the translation table, it returns the `default_value` from the dictionary table. |
| FR-12.3 | The fallback chain is: selected language translation --> English default_value. There is no intermediate fallback (no language family fallback, no tenant default language fallback). |
| FR-12.4 | If neither translation nor default_value exists (entry missing from dictionary), the system returns the `technical_name` itself as a last-resort fallback, making missing entries visible to developers. |

---

## 4. Non-Functional Requirements

| ID | Category | Requirement | Measurable Target |
|----|----------|-------------|-------------------|
| NFR-01 | Performance | Translation bundle fetch must be fast enough that language switching feels instantaneous. | Bundle API response < 500ms for a dictionary of 1000 entries. |
| NFR-02 | Performance | Language switching must not require a full page reload. | Signal-based reactivity re-renders all translated text in < 200ms after bundle is loaded. |
| NFR-03 | Performance | The dictionary admin view must load and paginate efficiently even with 1000+ entries. | Page load < 1s, pagination response < 300ms. |
| NFR-04 | Accessibility | All localization UI must meet WCAG 2.2 Level AAA. | Color contrast ratio >= 7:1, full keyboard navigation, ARIA labels on all interactive elements. |
| NFR-05 | Accessibility | RTL languages (Arabic, Hebrew, Urdu) must render with correct text direction. | `dir="rtl"` on `<html>` element when RTL language is active. All layout components respond to direction change. |
| NFR-06 | Security | Translation values must be sanitized to prevent XSS. | HTML tags stripped on save. `<script>` tags never stored or rendered. |
| NFR-07 | Security | Dictionary management APIs require appropriate role-based access. | Master dictionary: ROLE_SUPER_ADMIN only. Tenant dictionary: ROLE_ADMIN for the specific tenant. |
| NFR-08 | Security | Tenant isolation must be enforced for dictionary data. | Tenant A cannot read or modify Tenant B's dictionary or translations. Enforced via tenant context in JWT. |
| NFR-09 | Availability | If the translation bundle API is unreachable, the frontend must degrade gracefully. | `TranslationService` uses a cached bundle from the previous successful load. If no cache exists, English fallback strings from an embedded static file are used. |
| NFR-10 | Data Integrity | Dictionary cloning during tenant provisioning must be atomic. | Either all entries are cloned or none are. Failed cloning is retryable. |
| NFR-11 | Scalability | The dictionary schema must support at least 2000 entries and 50 languages without performance degradation. | Query performance verified with 2000 entries x 50 languages = 100,000 translation rows. |

---

## 5. Business Rules

| ID | Rule | Enforced By |
|----|------|-------------|
| BR-01 | The tenant's default language cannot be deactivated. The checkbox for the default language is always checked and disabled in the UI. To change the default language, the admin must first set a different language as default. | Frontend (disabled checkbox) + Backend (validation on deactivate API). |
| BR-02 | The system-wide fallback language is always English (`en`). This is hardcoded and not configurable by any user role. If a translation is missing for any language, the English `default_value` is returned. | Frontend (TranslationService fallback logic) + Backend (resolver fallback logic). |
| BR-03 | English is always available as a language. It cannot be deactivated for any tenant. | Backend (validation: reject deactivation of `en`). |
| BR-04 | Every dictionary entry must have a non-null, non-empty `default_value` (English text). | Database (NOT NULL constraint) + Backend (validation on create/update). |
| BR-05 | The `technical_name` must be unique across the entire dictionary. No two entries can share the same key. | Database (PRIMARY KEY constraint). |
| BR-06 | Error codes from the `message_registry` (e.g., `AUTH-E-028`) serve as `technical_name` values in the dictionary. The message registry provides metadata; the dictionary provides the text. These two tables are linked by the code/technical_name but are separate concerns. | Application layer (seed scripts ensure both tables are populated for error codes). |
| BR-07 | During tenant provisioning, the master dictionary and translations are cloned in full. No partial cloning. | Provisioning step logic. |
| BR-08 | Tenant translations are independent after cloning. Changes to the master dictionary do NOT automatically propagate to existing tenant copies. New entries added to the master after cloning are NOT available to existing tenants until a manual sync or re-clone is triggered. | Architecture decision (simplicity over real-time sync). |
| BR-09 | Deactivating a language for a tenant preserves all translation data for that language. Re-activating the language restores the translations. | Backend (deactivation toggles `is_active` flag, does not delete translation rows). |
| BR-10 | The `module` field in the dictionary is informational only. It has no effect on resolution logic. It exists solely to help admins filter and organize the dictionary. | Application layer. |
| BR-11 | Translation parameter placeholders use the format `{paramName}`. Both frontend and backend must preserve these placeholders during editing and resolve them at render/response time. | Frontend (TranslationService.translate) + Backend (resolver.resolve). |
| BR-12 | Pre-authentication language detection uses the browser's `navigator.languages` array. The first supported language in the array is used. If none match, English is used. | Frontend (localeHeaderInterceptor + TranslationService init logic). |
| BR-13 | Post-authentication language is determined by: (1) user's stored preference, (2) tenant's default language, (3) English. This is a strict priority chain. | Frontend (TranslationService init logic post-auth). |
| BR-14 | The "Restore to original" action in the tenant dictionary view replaces the tenant's translation with the value from the master dictionary at the time of the last clone/sync. It does NOT fetch the current master value in real time. | Application layer (restore reads from a stored "original_value" or a master snapshot). |

---

## 6. Data Model

### 6.1 Master Database Tables (tenant-service `master_db`)

#### `supported_languages` (New Table)

| Attribute Name | Data Type | Required | Description |
|----------------|-----------|----------|-------------|
| `code` | VARCHAR(10) | Yes (PK) | Language code from Google Workspace list (e.g., `en`, `ar`, `fr`, `de`, `hi`, `zh-CN`). |
| `display_name` | VARCHAR(100) | Yes | Human-readable name (e.g., "English", "Arabic", "French"). |
| `native_name` | VARCHAR(100) | No | Name in the language itself (e.g., "English", "Arabic", "Francais"). |
| `text_direction` | VARCHAR(3) | Yes | `LTR` or `RTL`. Default: `LTR`. |
| `created_at` | TIMESTAMP | Yes | Row creation timestamp. |

#### `dictionary` (New Table)

| Attribute Name | Data Type | Required | Description |
|----------------|-----------|----------|-------------|
| `technical_name` | VARCHAR(255) | Yes (PK) | Unique key for the translatable string (e.g., `BTN_SIGN_IN`, `AUTH-E-028`). |
| `default_value` | TEXT | Yes | English text. Always present. |
| `module` | VARCHAR(100) | No | Module that owns this string (e.g., `AUTH`, `ADMIN`, `SHELL`, `COMMON`). Informational only. |
| `created_at` | TIMESTAMP | Yes | Row creation timestamp. |
| `updated_at` | TIMESTAMP | Yes | Row last-update timestamp. |

#### `translation` (New Table)

| Attribute Name | Data Type | Required | Description |
|----------------|-----------|----------|-------------|
| `technical_name` | VARCHAR(255) | Yes (PK, FK -> dictionary) | Foreign key to dictionary. |
| `locale_code` | VARCHAR(10) | Yes (PK) | Language code (e.g., `ar`, `fr`, `de`). Composite PK with `technical_name`. |
| `value` | TEXT | Yes | Translated text in the target language. |
| `created_at` | TIMESTAMP | Yes | Row creation timestamp. |
| `updated_at` | TIMESTAMP | Yes | Row last-update timestamp. |

**Note:** English is NOT stored in the `translation` table. English text comes from `dictionary.default_value`.

#### Existing Tables (Unchanged)

| Table | Role | Relationship to Dictionary |
|-------|------|---------------------------|
| `message_registry` | Stores error/warning/confirmation/info/label/status metadata (code, type, category, http_status, default_title, default_detail). | The `code` column (e.g., `AUTH-E-028`) maps to `dictionary.technical_name`. The `default_title` and `default_detail` fields in `message_registry` will be superseded by `dictionary.default_value` for user-facing text. Metadata fields (type, category, http_status) remain in `message_registry`. |
| `message_translation` | Stores localized title/detail per code + locale_code. | Will be superseded by the `translation` table. Migration plan: populate `dictionary` + `translation` from `message_registry` + `message_translation` data, then deprecate `message_translation` in a future release. |
| `tenant_message_translation` | Tenant-scoped overrides. | Will be superseded by the tenant-cloned `translation` table. Each tenant gets their own copy. |

### 6.2 Tenant Database Tables (Cloned During Provisioning)

Each tenant database receives cloned copies of:

#### `dictionary` (Cloned from Master)

Same schema as master `dictionary` table. Contains all entries from the master at the time of cloning.

#### `translation` (Cloned from Master)

Same schema as master `translation` table. Contains all translations from the master at the time of cloning. Tenant Admin can edit values independently.

#### `tenant_active_languages` (New Table, Per-Tenant)

| Attribute Name | Data Type | Required | Description |
|----------------|-----------|----------|-------------|
| `locale_code` | VARCHAR(10) | Yes (PK) | Language code from `supported_languages`. |
| `is_active` | BOOLEAN | Yes | Whether this language is active for the tenant. |
| `activated_at` | TIMESTAMP | No | When the language was last activated. |
| `deactivated_at` | TIMESTAMP | No | When the language was last deactivated. |

### 6.3 User Preference Storage

| Attribute Name | Data Type | Required | Description |
|----------------|-----------|----------|-------------|
| `user_id` | VARCHAR(255) | Yes (PK or UK) | User identifier from JWT `sub` claim. |
| `locale_code` | VARCHAR(10) | Yes | User's preferred language code. |
| `updated_at` | TIMESTAMP | Yes | Last time the preference was changed. |

**Implementation note:** This may be stored as a column on an existing user profile/settings table rather than a standalone table. The exact location is a DBA/SA decision.

### 6.4 Entity Relationship Diagram

```mermaid
erDiagram
    supported_languages {
        varchar10 code PK "e.g., en, ar, fr"
        varchar100 display_name "e.g., English"
        varchar100 native_name "e.g., English"
        varchar3 text_direction "LTR or RTL"
        timestamp created_at
    }

    dictionary {
        varchar255 technical_name PK "e.g., BTN_SIGN_IN"
        text default_value "English text (always present)"
        varchar100 module "e.g., AUTH, ADMIN"
        timestamp created_at
        timestamp updated_at
    }

    translation {
        varchar255 technical_name PK_FK "FK to dictionary"
        varchar10 locale_code PK "e.g., ar, fr"
        text value "Translated text"
        timestamp created_at
        timestamp updated_at
    }

    message_registry {
        varchar20 code PK "e.g., AUTH-E-028"
        char1 type "E, W, C, I, S, L"
        varchar50 category "e.g., AUTH"
        int http_status "e.g., 401"
        varchar255 default_title "Superseded by dictionary"
        text default_detail "Superseded by dictionary"
    }

    tenant_active_languages {
        varchar10 locale_code PK "Per-tenant"
        boolean is_active
        timestamp activated_at
        timestamp deactivated_at
    }

    dictionary ||--o{ translation : "technical_name"
    message_registry ||--o| dictionary : "code = technical_name"
    supported_languages ||--o{ translation : "code = locale_code"
    supported_languages ||--o{ tenant_active_languages : "code = locale_code"
```

---

## 7. User Stories

### Epic 1: Master Language List Management (FR-01)

#### US-R06-001: View Master Language List

**As** a Super Admin (PER-UX-001),
**I want** to view the list of all supported languages,
**So that** I can see which languages are available in the EMSIST platform.

**Acceptance Criteria:**

1. **AC1 -- Main Scenario (Happy Path):**
   Given I am authenticated as a Super Admin,
   When I navigate to Administration > Localization > Languages,
   Then I see a table with columns: Language Code, Display Name, Native Name, Text Direction,
   And the table shows all languages from the Google Workspace language code list,
   And the table is paginated with 20 rows per page.

2. **AC2 -- Search:**
   Given I am on the Languages page,
   When I type "arab" in the search field,
   Then the table filters to show only languages matching "arab" in display name or native name (e.g., "Arabic").

3. **AC3 -- Empty Search:**
   Given I am on the Languages page,
   When I search for "xyz" and no languages match,
   Then I see an empty state message: "No languages found matching 'xyz'" with a "Clear" button.

4. **AC4 -- RTL Indicator:**
   Given the language list is displayed,
   When I view an RTL language (e.g., Arabic, Hebrew),
   Then the Text Direction column shows "RTL" with a distinct visual indicator.

5. **AC5 -- Permissions:**
   Given I am authenticated with ROLE_USER (not ROLE_SUPER_ADMIN),
   When I attempt to access Administration > Localization,
   Then I receive a 403 Forbidden error and do not see the page.

---

### Epic 2: Dictionary Management (FR-02)

#### US-R06-002: Browse Master Dictionary

**As** a Super Admin (PER-UX-001),
**I want** to browse the master dictionary of all translatable strings,
**So that** I can see every text string in the EMSIST platform that can be translated.

**Acceptance Criteria:**

1. **AC1 -- Main Scenario (Happy Path):**
   Given I am authenticated as a Super Admin,
   When I navigate to Administration > Localization > Dictionary,
   Then I see a paginated table with columns: Technical Name, Default Value (EN), Module,
   And the table shows 20 entries per page by default,
   And the table is sorted by `technical_name` ascending.

2. **AC2 -- Search by Technical Name:**
   Given I am on the Dictionary page,
   When I type "AUTH-E" in the search field,
   Then the table filters to show only entries where `technical_name` contains "AUTH-E".

3. **AC3 -- Filter by Module:**
   Given I am on the Dictionary page,
   When I select "AUTH" from the module filter dropdown,
   Then the table shows only entries where `module` = "AUTH".

4. **AC4 -- Empty State:**
   Given the dictionary has no entries (e.g., fresh installation before seeding),
   When I navigate to the Dictionary page,
   Then I see an empty state: "No dictionary entries found. Use the seed script to populate the dictionary."

5. **AC5 -- Pagination:**
   Given the dictionary has 816 entries,
   When I view the table,
   Then the pagination control shows "Page 1 of 41" and I can navigate to any page.

6. **AC6 -- Error State:**
   Given the dictionary API returns an error,
   When I navigate to the Dictionary page,
   Then I see an error banner: "Failed to load dictionary. Please try again." with a "Retry" button.

#### US-R06-003: Create Dictionary Entry

**As** a Super Admin (PER-UX-001),
**I want** to create a new dictionary entry,
**So that** new translatable strings can be added to the platform.

**Acceptance Criteria:**

1. **AC1 -- Main Scenario (Happy Path):**
   Given I am on the Dictionary page,
   When I click "Add Entry" and fill in: Technical Name = "BTN_SAVE", Default Value = "Save", Module = "COMMON",
   And I click "Save",
   Then the entry is created in the dictionary table,
   And a success toast shows: "Dictionary entry created.",
   And the new entry appears in the table.

2. **AC2 -- Duplicate Technical Name:**
   Given a dictionary entry with `technical_name` = "BTN_SAVE" already exists,
   When I attempt to create another entry with `technical_name` = "BTN_SAVE",
   Then a validation error shows: "An entry with technical name 'BTN_SAVE' already exists."

3. **AC3 -- Missing Required Fields:**
   Given I click "Add Entry",
   When I leave Technical Name or Default Value empty and click "Save",
   Then validation errors show: "Technical Name is required." and/or "Default Value is required."

4. **AC4 -- Technical Name Format:**
   Given I enter a technical_name value,
   When the value exceeds 255 characters,
   Then a validation error shows: "Technical Name must not exceed 255 characters."

#### US-R06-004: Edit Dictionary Entry

**As** a Super Admin (PER-UX-001),
**I want** to edit the default value or module of a dictionary entry,
**So that** I can correct or update English text.

**Acceptance Criteria:**

1. **AC1 -- Main Scenario (Happy Path):**
   Given I am on the Dictionary page and entry "BTN_SIGN_IN" exists with default_value "Sign In",
   When I click the edit action on "BTN_SIGN_IN",
   And I change default_value to "Log In" and click "Save",
   Then the entry is updated in the dictionary,
   And a success toast shows: "Dictionary entry updated.",
   And the table reflects the new default_value.

2. **AC2 -- Technical Name is Read-Only:**
   Given I am editing a dictionary entry,
   When the edit form is displayed,
   Then the Technical Name field is read-only and cannot be modified.

3. **AC3 -- Empty Default Value:**
   Given I am editing a dictionary entry,
   When I clear the Default Value field and click "Save",
   Then a validation error shows: "Default Value is required."

#### US-R06-005: Delete Dictionary Entry

**As** a Super Admin (PER-UX-001),
**I want** to delete a dictionary entry,
**So that** obsolete strings can be removed from the platform.

**Acceptance Criteria:**

1. **AC1 -- Main Scenario (Happy Path):**
   Given I am on the Dictionary page and entry "DEPRECATED_LABEL" exists,
   When I click the delete action on "DEPRECATED_LABEL",
   Then a confirmation dialog shows: "Delete dictionary entry 'DEPRECATED_LABEL'? This will also delete all translations for this entry across all languages. This action cannot be undone.",
   And when I click "Delete",
   Then the entry is deleted from the dictionary,
   And all translations for this entry are deleted from the translation table,
   And a success toast shows: "Dictionary entry deleted."

2. **AC2 -- Cancel Delete:**
   Given the delete confirmation dialog is displayed,
   When I click "Cancel",
   Then no changes are made and the dialog closes.

3. **AC3 -- Cascade to Tenant Copies:**
   Given a dictionary entry is deleted from the master,
   When tenant dictionaries are next synced,
   Then the deleted entry is flagged for removal from tenant copies.
   **Note:** Since tenant copies are independent after cloning (BR-08), immediate cascade is NOT automatic. This is a future sync consideration.

---

### Epic 3: Master Translation Management (FR-03)

#### US-R06-006: View Translations for a Language

**As** a Super Admin (PER-UX-001),
**I want** to view all translations for a specific language,
**So that** I can see the translation status and edit missing or incorrect translations.

**Acceptance Criteria:**

1. **AC1 -- Main Scenario (Happy Path):**
   Given I am on the Languages page (FR-01),
   When I click the action button for "Arabic (ar)",
   Then I see a dictionary view table with columns: Technical Name, EN Default, Arabic Value,
   And each row shows the `technical_name`, the English `default_value` (read-only), and the Arabic `translation.value` (editable or empty),
   And the table is paginated with 20 rows per page.

2. **AC2 -- Coverage Indicator:**
   Given the dictionary has 816 entries and 400 have Arabic translations,
   When I view the Arabic translation view,
   Then I see a coverage indicator: "400 / 816 translated (49%)".

3. **AC3 -- Missing Translation Highlight:**
   Given a dictionary entry has no Arabic translation,
   When I view the row in the Arabic translation view,
   Then the Arabic Value column shows an empty cell with a visual indicator (e.g., muted italic "No translation") distinguishing it from an intentionally blank value.

4. **AC4 -- Search:**
   Given I am in the Arabic translation view,
   When I type "login" in the search field,
   Then the table filters to entries where `technical_name` or `default_value` contains "login".

5. **AC5 -- Filter by Translation Status:**
   Given I am in the Arabic translation view,
   When I select "Missing translations only" from a filter,
   Then the table shows only entries that have no Arabic translation.

#### US-R06-007: Edit a Translation

**As** a Super Admin (PER-UX-001),
**I want** to edit the translation value for a dictionary entry in a specific language,
**So that** I can provide or correct translations.

**Acceptance Criteria:**

1. **AC1 -- Main Scenario (Happy Path):**
   Given I am in the Arabic translation view and entry "BTN_SIGN_IN" shows EN default "Sign In",
   When I click the edit action on "BTN_SIGN_IN",
   And I enter the Arabic value and click "Save",
   Then the translation is saved to the `translation` table with `technical_name` = "BTN_SIGN_IN", `locale_code` = "ar",
   And a success toast shows: "Translation saved.",
   And the coverage indicator updates.

2. **AC2 -- RTL Text Input:**
   Given I am editing a translation for an RTL language (Arabic, Hebrew, Urdu),
   When the edit field is displayed,
   Then the text input has `dir="rtl"` attribute for correct text direction.

3. **AC3 -- Parameter Placeholder Preservation:**
   Given the English default is "Welcome to {tenantName}",
   When I enter the Arabic translation,
   Then the `{tenantName}` placeholder must be preserved in the translation value,
   And a hint shows: "Placeholders: {tenantName} -- must be preserved in translation."

4. **AC4 -- Clear Translation:**
   Given I am editing an existing Arabic translation for "BTN_SIGN_IN",
   When I clear the value and click "Save",
   Then the translation row is deleted from the `translation` table,
   And the system will fall back to the English default for this entry,
   And the coverage indicator decreases.

---

### Epic 4: Tenant Language Management (FR-04, FR-05)

#### US-R06-008: Activate/Deactivate Languages for Tenant

**As** a Tenant Admin (PER-UX-003),
**I want** to activate and deactivate languages for my tenant,
**So that** my users only see the languages relevant to our organization.

**Acceptance Criteria:**

1. **AC1 -- Main Scenario (Happy Path):**
   Given I am authenticated as a Tenant Admin,
   When I navigate to Tenant Settings > Languages,
   Then I see a list of all languages from the master list with a checkbox per language,
   And the tenant's currently active languages have checked checkboxes,
   And the default language checkbox is checked and disabled (locked).

2. **AC2 -- Activate a Language:**
   Given "French (fr)" is currently inactive for my tenant,
   When I check the checkbox for French,
   Then French is activated for my tenant,
   And a success toast shows: "French activated.",
   And French appears in the language switcher for my tenant's users.

3. **AC3 -- Deactivate a Language:**
   Given "French (fr)" is currently active and is NOT the default language,
   When I uncheck the checkbox for French,
   Then French is deactivated for my tenant,
   And a success toast shows: "French deactivated.",
   And French is removed from the language switcher,
   And French translations are preserved (not deleted).

4. **AC4 -- Cannot Deactivate Default Language:**
   Given "English (en)" is the tenant's default language,
   When I view the checkbox for English,
   Then the checkbox is checked and disabled,
   And a tooltip shows: "Default language cannot be deactivated. Change the default language first."

5. **AC5 -- Cannot Deactivate English:**
   Given English is always required (BR-03),
   When I view the checkbox for English,
   Then the checkbox is checked and disabled regardless of whether English is the default.

6. **AC6 -- Permissions:**
   Given I am authenticated with ROLE_USER (not ROLE_ADMIN),
   When I attempt to access Tenant Settings > Languages,
   Then I receive a 403 Forbidden error.

#### US-R06-009: Set Tenant Default Language

**As** a Tenant Admin (PER-UX-003),
**I want** to set the default language for my tenant,
**So that** users without a personal preference see content in our organization's primary language.

**Acceptance Criteria:**

1. **AC1 -- Main Scenario (Happy Path):**
   Given my tenant has English and Arabic activated,
   When I click "Set as Default" on Arabic,
   Then Arabic becomes the tenant's default language,
   And the Arabic checkbox becomes locked (disabled),
   And the English checkbox becomes unlockable (if it was the previous default),
   And a success toast shows: "Default language changed to Arabic."

2. **AC2 -- Cannot Set Inactive Language as Default:**
   Given "French (fr)" is inactive for my tenant,
   When I attempt to set French as the default,
   Then a validation error shows: "Language must be activated before it can be set as default."

3. **AC3 -- Default Language Affects New Users:**
   Given the tenant's default language is Arabic,
   When a new user logs in for the first time (no stored preference),
   Then the UI renders in Arabic.

---

### Epic 5: Language Switcher (FR-06)

#### US-R06-010: Language Switcher in Header (Pre-Auth)

**As** a Visitor (PER-CX-001),
**I want** to see the login page in my browser's language and switch to another language,
**So that** I can sign in using a language I understand.

**Acceptance Criteria:**

1. **AC1 -- Main Scenario (Browser Detection):**
   Given my browser's primary language is Arabic (`navigator.languages[0]` = "ar"),
   When I navigate to the EMSIST login page,
   Then the login page renders in Arabic,
   And the language switcher in the header shows "Arabic" as the selected language.

2. **AC2 -- Switch Language Before Login:**
   Given I am on the login page in Arabic,
   When I click the language switcher and select "English",
   Then all login page text updates to English without a page reload,
   And the language switcher shows "English" as the selected language.

3. **AC3 -- Unsupported Browser Language:**
   Given my browser's primary language is "ko" (Korean) and Korean is not in the active language list,
   When I navigate to the login page,
   Then the login page renders in English (system fallback).

4. **AC4 -- Language Switcher Shows All System Languages:**
   Given the EMSIST system has English, Arabic, and French as active languages,
   When I open the language switcher on the login page (pre-auth, no tenant context),
   Then I see English, Arabic, and French as options.

#### US-R06-011: Language Switcher in Header (Post-Auth)

**As** an End User (PER-UX-004),
**I want** to switch my UI language via the header,
**So that** I can work in my preferred language.

**Acceptance Criteria:**

1. **AC1 -- Main Scenario (Stored Preference):**
   Given I am authenticated and my stored language preference is Arabic,
   When the application loads,
   Then all UI text renders in Arabic,
   And the language switcher shows "Arabic" as the selected language.

2. **AC2 -- Switch Language:**
   Given I am authenticated and working in Arabic,
   When I click the language switcher and select "French",
   Then all UI text updates to French without a page reload,
   And my language preference is updated to "fr" in the backend,
   And the language switcher shows "French".

3. **AC3 -- Tenant-Specific Language List:**
   Given my tenant has only English and Arabic activated,
   When I open the language switcher,
   Then I see only English and Arabic as options (not French or other inactive languages).

4. **AC4 -- No Stored Preference:**
   Given I am authenticated for the first time and have no stored language preference,
   When the application loads,
   Then the UI renders in the tenant's default language (FR-05).

---

### Epic 6: Frontend String Externalization (FR-08)

#### US-R06-012: TranslationService Implementation

**As** a Developer (system requirement),
**I want** a centralized TranslationService that loads and serves translations,
**So that** all frontend components can render text in the user's selected language.

**Acceptance Criteria:**

1. **AC1 -- Service Initialization:**
   Given the application is starting,
   When the APP_INITIALIZER runs,
   Then the `TranslationService` loads the translation bundle for the user's language from the backend API,
   And stores it in a Signal-based reactive store.

2. **AC2 -- Translate Method:**
   Given the bundle is loaded with `{ "BTN_SIGN_IN": "Sign In" }`,
   When a component calls `translationService.translate('BTN_SIGN_IN')`,
   Then the method returns "Sign In".

3. **AC3 -- Parameter Interpolation:**
   Given the bundle contains `{ "WELCOME_MSG": "Welcome to {tenantName}" }`,
   When a component calls `translationService.translate('WELCOME_MSG', { tenantName: 'Acme' })`,
   Then the method returns "Welcome to Acme".

4. **AC4 -- Missing Key Fallback:**
   Given the bundle does not contain key "NONEXISTENT_KEY",
   When a component calls `translationService.translate('NONEXISTENT_KEY')`,
   Then the method returns "NONEXISTENT_KEY" (the key itself, as a last-resort fallback).

5. **AC5 -- Language Switch Reload:**
   Given the user switches language from English to Arabic via the switcher,
   When the TranslationService receives the language change event,
   Then it fetches the Arabic bundle from the backend,
   And updates the Signal store,
   And all `TranslatePipe` instances in templates re-render with Arabic text.

#### US-R06-013: TranslatePipe Implementation

**As** a Developer (system requirement),
**I want** a TranslatePipe for Angular templates,
**So that** I can externalize strings in HTML templates with minimal code changes.

**Acceptance Criteria:**

1. **AC1 -- Basic Usage:**
   Given the TranslatePipe is available,
   When I use `{{ 'BTN_SIGN_IN' | translate }}` in a template,
   Then it renders the translated value for the current language.

2. **AC2 -- With Parameters:**
   Given the TranslatePipe supports parameters,
   When I use `{{ 'WELCOME_MSG' | translate:{ tenantName: tenant.name } }}` in a template,
   Then it renders the interpolated translated value.

3. **AC3 -- Reactive Update:**
   Given the user switches language,
   When the TranslationService updates its Signal store,
   Then all instances of the TranslatePipe automatically re-render with the new language's values.

#### US-R06-014: Externalize All Frontend Strings

**As** a Developer (system requirement),
**I want** all 652+ hardcoded frontend strings replaced with TranslatePipe/TranslationService calls,
**So that** the entire UI is translatable.

**Acceptance Criteria:**

1. **AC1 -- Login Page Strings:**
   Given the login page currently has 25 hardcoded strings (per `01-Frontend-String-Inventory.md`),
   When the externalization is complete,
   Then all 25 strings use the TranslatePipe or TranslationService,
   And no hardcoded English text remains in `login.page.html` or `login.page.ts`.

2. **AC2 -- AuthUiTextService Refactored:**
   Given `AuthUiTextService` currently maintains a separate hardcoded fallback map,
   When externalization is complete,
   Then `AuthUiTextService` is refactored to delegate to the general `TranslationService`,
   And the hardcoded `AUTH_UI_FALLBACKS` map is removed.

3. **AC3 -- All Modules Covered:**
   Given the string inventory identifies strings across AUTH, ADMIN, SHELL, and other modules,
   When externalization is complete,
   Then all 652+ strings are converted to dictionary entries with corresponding TranslatePipe usage,
   And no hardcoded user-facing English strings remain in the frontend codebase.

4. **AC4 -- Verification:**
   Given all strings are externalized,
   When the application runs with the Arabic translation bundle loaded,
   Then no English text appears in the UI (except proper nouns, brand names, and technical identifiers that are not translatable).

---

### Epic 7: Backend Message Resolution (FR-09)

#### US-R06-015: Unified Message Resolver

**As** a Developer (system requirement),
**I want** a single resolver pattern for all backend message resolution,
**So that** any backend service can resolve localized messages consistently.

**Acceptance Criteria:**

1. **AC1 -- Main Scenario:**
   Given a dictionary entry exists with `technical_name` = "AUTH-E-028" and `default_value` = "Invalid credentials",
   And a translation exists with `locale_code` = "ar" and `value` = "Arabic translation",
   When the resolver is called with `resolve("AUTH-E-028", "ar")`,
   Then it returns the Arabic `value`.

2. **AC2 -- Fallback to English:**
   Given a dictionary entry exists with `technical_name` = "AUTH-E-028" and `default_value` = "Invalid credentials",
   And no French translation exists,
   When the resolver is called with `resolve("AUTH-E-028", "fr")`,
   Then it returns "Invalid credentials" (the English default_value).

3. **AC3 -- Parameter Interpolation:**
   Given a dictionary entry has `default_value` = "Try again in {retryAfterSeconds} seconds",
   When the resolver is called with `resolve("AUTH-E-022", "en", Map.of("retryAfterSeconds", 30))`,
   Then it returns "Try again in 30 seconds".

4. **AC4 -- AuthLocalizedMessageResolver Integration:**
   Given `AuthLocalizedMessageResolver` currently resolves from `message_registry` + `message_translation`,
   When the dictionary is populated,
   Then `AuthLocalizedMessageResolver` is updated to resolve text from the `dictionary` + `translation` tables,
   And the `message_registry` continues to provide metadata (type, category, http_status).

#### US-R06-016: Externalize All Backend Strings

**As** a Developer (system requirement),
**I want** all 164+ hardcoded backend strings replaced with resolver calls,
**So that** all backend error messages are translatable.

**Acceptance Criteria:**

1. **AC1 -- Auth-Facade Strings:**
   Given `auth-facade` has 38 hardcoded strings (per `02-Backend-String-Inventory.md`),
   When externalization is complete,
   Then all 38 strings are dictionary entries and resolved through the message resolver,
   And no hardcoded English error messages remain in auth-facade source code.

2. **AC2 -- All Services Covered:**
   Given the backend string inventory covers auth-facade, tenant-service, and other services,
   When externalization is complete,
   Then all 164+ strings are dictionary entries,
   And the resolver is used consistently across all services.

---

### Epic 8: Tenant Provisioning (FR-10)

#### US-R06-017: Clone Dictionary During Provisioning

**As** a System (automated process),
**I want** the master dictionary and translations to be cloned into a new tenant's database during provisioning,
**So that** each tenant starts with the full set of translatable strings and translations.

**Acceptance Criteria:**

1. **AC1 -- Main Scenario (Happy Path):**
   Given a new tenant "Acme Corp" is being provisioned,
   And the master dictionary has 816 entries with Arabic translations for 400 entries,
   When the `CLONE_DICTIONARY` provisioning step executes,
   Then the tenant's database contains 816 dictionary entries,
   And 400 Arabic translation entries,
   And a provisioning step record shows status = "COMPLETED".

2. **AC2 -- Provisioning Step Failure:**
   Given the tenant database is unreachable during cloning,
   When the `CLONE_DICTIONARY` step fails,
   Then the provisioning step record shows status = "FAILED" with an error message,
   And the step can be retried.

3. **AC3 -- Idempotent Re-Run:**
   Given the `CLONE_DICTIONARY` step has already completed for tenant "Acme Corp",
   When the step is re-run (e.g., during retry after a later step failed),
   Then no duplicate entries are created (upsert semantics),
   And the step completes successfully.

4. **AC4 -- Default Language Activation:**
   Given a new tenant is provisioned with default language = English,
   When provisioning completes,
   Then English is marked as active in the tenant's `tenant_active_languages` table.

---

### Epic 9: Fallback Behavior (FR-12)

#### US-R06-018: Frontend Fallback Chain

**As** an End User (PER-UX-004),
**I want** the UI to always show text even if translations are incomplete,
**So that** I never see blank labels or broken UI.

**Acceptance Criteria:**

1. **AC1 -- Translation Exists:**
   Given I am working in Arabic and the entry "BTN_SIGN_IN" has an Arabic translation "Arabic text",
   When the UI renders the Sign In button,
   Then the button text is "Arabic text".

2. **AC2 -- Translation Missing, Default Exists:**
   Given I am working in French and the entry "BTN_SIGN_IN" has no French translation but has default_value "Sign In",
   When the UI renders the Sign In button,
   Then the button text is "Sign In" (English fallback).

3. **AC3 -- Entry Missing from Dictionary:**
   Given I am working in any language and the key "NONEXISTENT_KEY" does not exist in the dictionary,
   When the UI attempts to render this key,
   Then the text "NONEXISTENT_KEY" is displayed (making the gap visible to developers).

4. **AC4 -- Offline/API Failure Fallback:**
   Given the translation bundle API is unreachable,
   When the TranslationService cannot load the bundle,
   Then it uses a cached bundle from the last successful load,
   And if no cache exists, it uses an embedded English fallback bundle.

---

## 8. Out of Scope

The following items are explicitly excluded from this release. They were considered and deliberately deferred or cancelled based on validated user decisions.

| Item | Status | Rationale |
|------|--------|-----------|
| **Standalone `localization-service` microservice** | Cancelled | No new microservice. Localization evolves within `tenant-service` (backend) and `frontend`. Reduces deployment complexity. |
| **Dictionary import/export (CSV)** | Cancelled | Security concern: CSV import opens an attack vector for injection and data corruption. All dictionary management is done through the admin UI. |
| **AI-powered translation** | Deferred (future phase) | Requires LLM integration, confidence scoring, and content safety review. Not needed for initial localization launch. |
| **Human-in-the-Loop (HITL) review workflow** | Deferred (future phase) | Only relevant when AI translation is implemented. No review workflow needed for manual admin-entered translations. |
| **Dictionary rollback/versioning** | Cancelled | Adds complexity (JSONB snapshots, version retention, cleanup jobs) that is not justified for the current scale. Admin edits are final. If a mistake is made, the admin corrects it manually. |
| **Locale format configuration** (calendar system, numeral system, currency, date/time format) | Deferred (future phase) | The Angular `LOCALE_ID` and built-in pipes handle date/number/currency formatting. Custom format config tables are premature. |
| **Tenant translation override overlay pattern** | Cancelled | Replaced by the simpler cloning model. Each tenant gets a full copy of the dictionary. No overlay/merge at runtime. |
| **Translation reflection/polling** (automatic bundle refresh every 5 minutes) | Deferred (future phase) | Users can refresh the page to get updated translations. Real-time polling adds complexity for minimal UX benefit at current scale. |
| **Duplication detection** | Deferred (future phase) | Nice-to-have for dictionary hygiene but not needed for launch. |
| **Bulk find-and-replace** | Deferred (future phase) | Complex regex engine with multi-locale safety is not needed at launch. |
| **Valkey/Redis bundle caching** | Deferred (future phase) | Direct database queries are sufficient at current scale (< 2000 entries). Caching can be added when performance data justifies it. |
| **Tenant translation override propagation to master** | Cancelled | Tenant translations are independent. No mechanism to push tenant changes back to the master dictionary. |
| **Real-time collaborative editing of translations** | Out of scope | Single-user editing model is sufficient. |
| **External CAT tool integration** (Trados, Memsource, Crowdin) | Out of scope | Not needed for admin-managed translations. |
| **Dedicated ROLE_TRANSLATOR or ROLE_REVIEWER roles** | Out of scope | Existing ROLE_SUPER_ADMIN and ROLE_ADMIN are sufficient. |

---

## 9. Dependencies

| Dependency | Type | Impact |
|------------|------|--------|
| `tenant-service` database (`master_db`) | Schema change | New tables (`supported_languages`, `dictionary`, `translation`) via Flyway migration. Must not conflict with existing V1-V15 migrations. |
| `message_registry` + `message_translation` tables | Data migration | Existing error/label codes and Arabic translations must be migrated to the new `dictionary` + `translation` tables. `message_registry` metadata fields remain. |
| `tenant_message_translation` table | Deprecation path | Existing tenant-scoped overrides must be migrated to the tenant-cloned `translation` table model. |
| `auth-facade` `AuthLocalizedMessageResolver` | Refactoring | Must be updated to resolve text from `dictionary` + `translation` instead of (or in addition to) `message_registry` + `message_translation`. |
| `auth-facade` `MessageRegistryClient` | Refactoring | May need new API endpoints for dictionary-based resolution. |
| Frontend `AuthUiTextService` | Refactoring | Must be refactored to use the general `TranslationService`. Hardcoded fallback map to be removed. |
| Frontend `localeHeaderInterceptor` | Enhancement | May need to use the `TranslationService`'s selected language instead of raw `navigator.languages`. |
| Tenant provisioning workflow | Enhancement | New `CLONE_DICTIONARY` step must be added to the provisioning pipeline. |
| `MasterLocaleSectionComponent` | Replacement | Existing stub component must be replaced with fully functional language and dictionary management UI. |
| Google Workspace language codes | External reference | Master language list sourced from external reference. Must be seeded during initial migration. |
| Frontend string inventory (652+ strings) | Development effort | All frontend strings must be cataloged, assigned `technical_name` values, and converted to use TranslatePipe. |
| Backend string inventory (164+ strings) | Development effort | All backend strings must be cataloged, assigned `technical_name` values, and converted to use the resolver. |
| [`R06-UI-Spec-v5.md`](./R06-UI-Spec-v5.md) | Delivery contract | Governs final Angular UI scope and screen behavior for v5. |
| [`R06-Design-System-Validation-v5.md`](./R06-Design-System-Validation-v5.md) | Delivery contract | Governs design-system compliance, RTL validation, and screenshot baseline expectations. |
| [`R06-Angular-Test-Strategy-v5.md`](./R06-Angular-Test-Strategy-v5.md) | Delivery contract | Governs required frontend unit/component test coverage for localization. |
| [`R06-CI-Quality-Gates-v5.md`](./R06-CI-Quality-Gates-v5.md) | Delivery contract | Governs required CI checks and merge readiness for localization frontend work. |

---

## 10. Acceptance Criteria Matrix

This matrix maps each Feature Requirement to its test scenarios for traceability.

| FR | User Story | Test Scenario | Type |
|----|-----------|---------------|------|
| FR-01 | US-R06-001 | View language list with pagination, search, empty state | Functional |
| FR-01 | US-R06-001 | ROLE_USER cannot access language management | Authorization |
| FR-02 | US-R06-002 | Browse dictionary with pagination, search, filter, empty state | Functional |
| FR-02 | US-R06-003 | Create entry (happy path, duplicate, missing fields, max length) | Functional + Validation |
| FR-02 | US-R06-004 | Edit entry (happy path, read-only PK, empty default) | Functional + Validation |
| FR-02 | US-R06-005 | Delete entry (happy path, cancel, cascade consideration) | Functional |
| FR-03 | US-R06-006 | View translations (happy path, coverage, missing highlight, search, filter) | Functional |
| FR-03 | US-R06-007 | Edit translation (happy path, RTL input, placeholder preservation, clear) | Functional |
| FR-04 | US-R06-008 | Activate/deactivate languages (happy path, locked default, English always on, permissions) | Functional + Authorization |
| FR-05 | US-R06-009 | Set default language (happy path, inactive language rejection, new user effect) | Functional + Validation |
| FR-06 | US-R06-010 | Language switcher pre-auth (browser detection, switch, unsupported language) | Functional |
| FR-06 | US-R06-011 | Language switcher post-auth (stored preference, switch, tenant-specific list) | Functional |
| FR-07 | US-R06-011 | User preference stored on language switch, loaded on login | Functional |
| FR-08 | US-R06-012 | TranslationService (init, translate, interpolation, missing key, language switch) | Unit + Integration |
| FR-08 | US-R06-013 | TranslatePipe (basic, parameters, reactive update) | Unit |
| FR-08 | US-R06-014 | All 652+ frontend strings externalized, AuthUiTextService refactored | Regression |
| FR-09 | US-R06-015 | Message resolver (happy path, English fallback, interpolation, AuthLocalizedMessageResolver integration) | Unit + Integration |
| FR-09 | US-R06-016 | All 164+ backend strings externalized | Regression |
| FR-10 | US-R06-017 | Dictionary cloning (happy path, failure, idempotent, default language activation) | Integration |
| FR-11 | US-R06-008 | Tenant dictionary view (browse, edit, restore to original, customized indicator) | Functional |
| FR-12 | US-R06-018 | Fallback chain (translation exists, missing, entry missing, API failure) | Functional + Resilience |

### NFR Test Scenarios

| NFR | Test Scenario | Type |
|-----|---------------|------|
| NFR-01 | Bundle API response time < 500ms for 1000 entries | Performance |
| NFR-02 | Language switch re-renders in < 200ms after bundle load | Performance |
| NFR-03 | Dictionary page loads in < 1s, pagination < 300ms | Performance |
| NFR-04 | WCAG 2.2 AAA compliance on all localization UI | Accessibility |
| NFR-05 | RTL rendering with `dir="rtl"` on HTML element | Accessibility |
| NFR-06 | XSS: `<script>alert('x')</script>` stripped on save, not rendered | Security |
| NFR-07 | ROLE_USER cannot access dictionary management APIs | Security |
| NFR-08 | Tenant A cannot read/modify Tenant B's dictionary via API manipulation | Security |
| NFR-09 | TranslationService degrades gracefully when API unreachable | Resilience |
| NFR-10 | Dictionary cloning is atomic (all-or-nothing) | Data Integrity |
| NFR-11 | 2000 entries x 50 languages query performance < 1s | Scalability |

---

## 11. Glossary

| Term | Definition |
|------|-----------|
| **Dictionary** | The table storing all translatable strings in EMSIST. Each entry has a unique `technical_name` and an English `default_value`. |
| **Translation** | A localized text value for a dictionary entry in a specific language. Stored in the `translation` table. |
| **Technical Name** | The unique identifier for a translatable string (e.g., `BTN_SIGN_IN`, `AUTH-E-028`). Used as the primary key in the dictionary and referenced in code. |
| **Default Value** | The English text for a dictionary entry. Always present. Used as the fallback when no translation exists. |
| **Message Registry** | The existing `message_registry` table that stores metadata about error, warning, confirmation, info, label, and status messages (type, category, http_status). Separate from the dictionary's text content. |
| **Bundle** | A JSON payload containing all translations for a specific language, fetched by the frontend TranslationService. Format: `{ "technical_name": "translated_value", ... }`. |
| **Cloning** | The process of copying the master dictionary and translation tables into a tenant's database during provisioning. |
| **Fallback** | The mechanism by which the system returns the English default_value when a translation is missing for the requested language. |
| **Locale Code** | A language identifier following BCP 47 format (e.g., `en`, `ar`, `fr`, `zh-CN`). Used to identify languages throughout the system. |
| **Master Database** | The `master_db` PostgreSQL database owned by `tenant-service`. Stores the authoritative dictionary, translations, and language list. |

---

## Appendix A: Migration Strategy for Existing Data

The current codebase has 42 message codes seeded across V8, V12, V13, and V14 migrations in the `message_registry` + `message_translation` tables. These must be migrated to the new `dictionary` + `translation` tables.

### Migration Steps

1. **Create new tables** (`supported_languages`, `dictionary`, `translation`) via a new Flyway migration (V16 or later).
2. **Seed `supported_languages`** from the Google Workspace language code list.
3. **Migrate existing message_registry entries to dictionary:**
   ```sql
   INSERT INTO dictionary (technical_name, default_value, module, created_at, updated_at)
   SELECT code, default_title, category, created_at, updated_at
   FROM message_registry
   ON CONFLICT (technical_name) DO NOTHING;
   ```
4. **Migrate existing message_translation entries to translation:**
   ```sql
   INSERT INTO translation (technical_name, locale_code, value, created_at, updated_at)
   SELECT code, locale_code, title, created_at, updated_at
   FROM message_translation
   ON CONFLICT (technical_name, locale_code) DO NOTHING;
   ```
5. **Seed remaining 816 - 42 = 774+ dictionary entries** from the frontend and backend string inventories.
6. **Retain `message_registry`** for metadata (type, category, http_status). Do not delete.
7. **Deprecate `message_translation`** and `tenant_message_translation` in a future release after all consumers are migrated to the new tables.

### Backward Compatibility

During the migration period, both the old (`message_registry` + `message_translation`) and new (`dictionary` + `translation`) systems will coexist. The resolver must check the new tables first, then fall back to the old tables, then fall back to English defaults.

---

## Appendix B: String Inventory Summary

| Module | Frontend Strings | Backend Strings | Total |
|--------|-----------------|-----------------|-------|
| AUTH | 25 | 38 | 63 |
| ADMIN | ~200 | ~40 | ~240 |
| SHELL | ~100 | ~20 | ~120 |
| COMMON | ~150 | ~30 | ~180 |
| Other modules | ~177 | ~36 | ~213 |
| **Total** | **652** | **164** | **816** |

Full inventories: `Backlog/01-Frontend-String-Inventory.md`, `Backlog/02-Backend-String-Inventory.md`.

---

**End of Document**
