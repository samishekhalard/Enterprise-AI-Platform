# Product Requirements Document: Localization & i18n

**Version:** 4.0.0
**Date:** March 11, 2026
**Status:** [IN-PROGRESS] — localization-service is code-complete; i18n runtime is [PLANNED]; personas aligned with registry; tenant overrides [PLANNED]
**Owner:** BA Agent

---

## 1. Executive Summary

The Localization & i18n feature enables EMSIST to serve a multilingual user base by providing:
1. **Admin-managed translation system** — Super Admins manage system languages, translation dictionary, import/export, and rollback
2. **User-facing language selection** — End users choose their preferred language; the UI renders in that locale
3. **AI-powered translation** — Agentic translation assists with bulk translation of missing keys using LLM providers
4. **Backend error localization** — API error messages are returned in the user's preferred locale

### Business Justification

- EMSIST targets UAE government and enterprise clients requiring Arabic (ar-AE) support
- Multi-tenant SaaS must support tenants across English, Arabic, French, Hindi markets
- Compliance with UAE government digital standards requires Arabic-first UX option

### 1.1 Competitive Context & Alternatives Considered (TOGAF Phase E)

| Alternative | Evaluation | Reason for Rejection |
|-------------|-----------|---------------------|
| **@ngx-translate** (frontend library) | Mature, widely adopted | Adds external dependency; doesn't integrate with localization-service bundle API; no Signals support |
| **@angular/localize** (Angular built-in) | ICU MessageFormat support | Compile-time only; no runtime language switching without full reload |
| **Crowdin / Lokalise / Phrase** (SaaS) | Full-featured, CDN delivery | External dependency; EMSIST is on-premise first; data sovereignty concerns for UAE government |
| **Spring `messages.properties` only** | Zero infrastructure overhead | Requires redeployment for translation updates; no admin UI; no tenant overrides |
| **Separate `message_registry` tables** | Dedicated error message system | Duplicates localization-service dictionary; two systems to maintain for the same purpose |

**Chosen approach:** Custom Signals-based `TranslationService` fetching bundles from localization-service API. This provides runtime language switching, admin-managed translations, tenant override support, and zero external dependencies — critical for on-premise UAE government deployments.

---

## 2. Personas

> **Registry compliance:** All personas reference the [EMSIST Persona Registry](../../persona/PERSONA-REGISTRY.md) as the single source of truth. Module-specific localization goals are listed below; full persona profiles (empathy maps, JTBD, demographics) live in the registry.

### 2.1 Primary Personas

| Registry ID | Name | System Role | Localization Goals |
|-------------|------|-------------|-------------------|
| [PER-UX-001](../../persona/PERSONA-REGISTRY.md#per-ux-001-sam-martinez) | **Sam Martinez** (Super Admin) | ROLE_SUPER_ADMIN | Configure system languages, manage global translations (manual + import + agentic), ensure coverage, review HITL items, manage tenant translation overrides |
| [PER-UX-003](../../persona/PERSONA-REGISTRY.md#per-ux-003-fiona-shaw) | **Fiona Shaw** (Tenant Admin) | ROLE_ADMIN | Edit translations manually, export/import dictionary, review AI-flagged ambiguous terms, manage tenant-specific translation overrides for her subsidiary |
| [PER-UX-004](../../persona/PERSONA-REGISTRY.md#per-ux-004-lisa-harrison) | **Lisa Harrison** (End User) | ROLE_USER | Work in Arabic, switch languages, see localized dates/numbers/currencies per her locale preference |
| [PER-CX-001](../../persona/PERSONA-REGISTRY.md#per-cx-001-kyle-morrison) | **Kyle Morrison** (Visitor / Pre-Auth) | Unauthenticated | See login page in detected language, select language before sign-in, evaluate platform in preferred locale |

### 2.2 Secondary Personas

| Registry ID | Name | Localization Interaction |
|-------------|------|------------------------|
| [PER-UX-002](../../persona/PERSONA-REGISTRY.md#per-ux-002-nicole-roberts) | **Nicole Roberts** (Architect) | Reviews translation key naming conventions, module structure, ensures key hierarchy aligns with object type taxonomy |
| [PER-UX-005](../../persona/PERSONA-REGISTRY.md#per-ux-005-richard-newman) | **Richard Newman** (Power User / Team Lead) | Uses localized UI daily, reports translation issues to admin, needs accurate technical terminology in preferred locale |
| [PER-UX-006](../../persona/PERSONA-REGISTRY.md#per-ux-006-dana-kelly) | **Dana Kelly** (Viewer / Executive) | Consumes localized dashboards and reports, requires correct number/date/currency formatting per locale |
| [PER-EX-001](../../persona/PERSONA-REGISTRY.md#per-ex-001-andrew-davis) | **Andrew Davis** (Support Engineer) | Troubleshoots locale-related issues, reads localized error messages, reproduces user-reported translation bugs |
| [PER-EX-002](../../persona/PERSONA-REGISTRY.md#per-ex-002-oliver-kent) | **Oliver Kent** (DevOps) | Manages localization-service deployment, Valkey cache configuration, bundle cache invalidation monitoring |
| [PER-AX-001](../../persona/PERSONA-REGISTRY.md#per-ax-001-emsist-ai-assistant) | **EMSIST AI Assistant** (Agent) | Performs agentic translation of missing keys, classifies ambiguous terms for HITL review, validates placeholder integrity |

---

## 3. Feature Requirements

### FR-01: System Languages Management [IMPLEMENTED]
- **As** Super Admin, **I can** view, activate, deactivate, and configure system locales
- **Acceptance:** Locale table with toggle, alternative radio, format config accordion
- **Evidence:** [master-locale-section.component.html](frontend/src/app/features/administration/sections/master-locale/master-locale-section.component.html), [LocaleService.java](backend/localization-service/src/main/java/com/ems/localization/service/LocaleService.java)

### FR-02: Translation Dictionary [IMPLEMENTED]
- **As** Super Admin, **I can** browse, search, and edit translation key-value pairs per locale
- **Acceptance:** Paginated table with dynamic locale columns, edit dialog
- **Evidence:** [DictionaryController.java](backend/localization-service/src/main/java/com/ems/localization/controller/DictionaryController.java)

### FR-03: Dictionary Import/Export [IMPLEMENTED]
- **As** Super Admin, **I can** export dictionary as CSV and import CSV with preview
- **Acceptance:** UTF-8 BOM CSV, preview with stats, commit with snapshot, rate limiting (5/hr)
- **Evidence:** [DictionaryService.java](backend/localization-service/src/main/java/com/ems/localization/service/DictionaryService.java)

### FR-04: Dictionary Rollback [IMPLEMENTED]
- **As** Super Admin, **I can** view version history and rollback to any previous version
- **Acceptance:** Version table with type badges, rollback creates pre-rollback snapshot
- **Evidence:** [DictionaryService.java](backend/localization-service/src/main/java/com/ems/localization/service/DictionaryService.java)

### FR-05: User Language Preference [IMPLEMENTED]
- **As** End User, **I can** set my preferred locale via API
- **Acceptance:** `PUT /api/v1/user/locale`, persisted per user_id, upsert semantics
- **Evidence:** [UserLocaleController.java](backend/localization-service/src/main/java/com/ems/localization/controller/UserLocaleController.java)

### FR-06: Translation Bundle API [IMPLEMENTED]
- **As** Frontend, **I can** fetch a translation bundle for a given locale
- **Acceptance:** `GET /api/v1/locales/{code}/bundle`, Valkey-cached, version header
- **Evidence:** [UserLocaleController.java](backend/localization-service/src/main/java/com/ems/localization/controller/UserLocaleController.java)

### FR-07: Frontend i18n Runtime [PLANNED]
- **As** End User, **I can** see all UI text in my preferred language without page reload
- **Acceptance:** TranslationService, TranslatePipe, LocalizedDatePipe, APP_INITIALIZER, fallback chain
- **Components:** See [03-i18n-Infrastructure-Backlog.md](../Backlog/03-i18n-Infrastructure-Backlog.md) items 5-12

### FR-08: Language Switcher [PLANNED]
- **As** End User, **I can** switch language via a dropdown in the header
- **Acceptance:** Matches island button style, shows flag + code, persists preference
- **Design:** See [05-UI-UX-Design-Spec.md](05-UI-UX-Design-Spec.md) section 3.1

### FR-09: Backend i18n Infrastructure [PLANNED]
- **As** System, backend error messages are returned in the user's locale
- **Acceptance:** MessageResolver, LocaleContextFilter, LocalePropagationInterceptor
- **Components:** See [03-i18n-Infrastructure-Backlog.md](../Backlog/03-i18n-Infrastructure-Backlog.md) items 1-4

### FR-10: Agentic Translation with HITL [PLANNED]
- **As** Super Admin or Tenant Admin, **I can** request AI translation for missing keys
- **Acceptance:** Confidence scoring, bulk accept >90%, placeholder validation, HITL review for ambiguous terms only
- **HITL trigger:** Agent flags terms with multiple contextual meanings (e.g., "bank" as financial institution vs. river bank) for admin review
- **Non-HITL:** Simple, unambiguous translations are auto-applied with ACTIVE status
- **Design:** See [05-UI-UX-Design-Spec.md](05-UI-UX-Design-Spec.md) section 3.5

### FR-11: Translation Workflow (3 Scenarios) [PLANNED]
- **Scenario 1 — Manual:** Tenant Admin selects a dictionary entry, edits the translation value, saves. No approval workflow. Translation goes live immediately.
- **Scenario 2 — Import/Export:** Tenant Admin exports CSV, edits externally, imports with preview. No human validation required (preview serves as validation). Committed translations go live immediately.
- **Scenario 3 — Agentic:** Translation agent translates missing keys. Simple terms are auto-applied (ACTIVE). Ambiguous terms (multiple contextual meanings) are flagged as PENDING_REVIEW for admin HITL approval.
- **Acceptance:** All 3 scenarios produce live translations. Only agentic ambiguous terms require admin review.
- **No new roles:** Existing ROLE_SUPER_ADMIN and ROLE_ADMIN handle all translation work. No ROLE_TRANSLATOR or ROLE_REVIEWER needed.
- **No CAT tools:** CSV import/export + agentic translation cover all use cases.

### FR-12: Translation Reflection Flow [PLANNED]
- **As** End User, after an admin updates a translation, **I see** the change reflected within 5 minutes without page reload
- **As** Admin editing translations, **I see** changes reflected immediately in the same session after save
- **Acceptance:** TranslationService polls `/bundle/version` every 5 min; on version mismatch, re-fetches bundle; Signal update triggers pipe re-render
- **Design:** See [00-Benchmark-Report.md](00-Benchmark-Report.md) Part 6B

### FR-13: Duplication Detection [PLANNED — Next Release]
- **As** Admin, **I can** see a duplication flag on dictionary entries that share identical translation values within the same locale
- **Acceptance:** Warning badge in admin UI, list of duplicate entries, manual consolidation

### FR-14: String Externalization [PLANNED]
- **As** System, all 816 hardcoded strings (652 frontend + 164 backend) are externalized to translation keys
- **Acceptance:** 0% → 100% coverage ratio
- **Inventory:** See [01-Frontend-String-Inventory.md](../Backlog/01-Frontend-String-Inventory.md), [02-Backend-String-Inventory.md](../Backlog/02-Backend-String-Inventory.md)

### FR-15: Tenant-Specific Translation Overrides [PLANNED]
- **As** Tenant Admin ([PER-UX-003](../../persona/PERSONA-REGISTRY.md#per-ux-003-fiona-shaw)), **I can** override specific global translation values for my tenant
- **Architecture:** Overlay pattern — global translations remain the base; tenant overrides replace matching keys at bundle generation time
- **Acceptance:**
  - New `tenant_translation_overrides` table with `(tenant_id, entry_id, locale_code)` unique constraint
  - Bundle endpoint merges global + tenant overrides when `X-Tenant-ID` header is present
  - Anonymous/no-tenant requests receive global translations only
  - Tenant Admin can create, edit, delete, import, and export overrides for their tenant
  - Cache key includes tenant_id: `bundle:{tenantId}:{localeCode}`
- **Use cases:**
  - Healthcare tenant: `"menu.records"` → `"Patient Records"` (global: `"Records"`)
  - Insurance tenant: `"menu.records"` → `"Claim Records"`
- **Admin UI:** "Tenant Overrides" sub-tab visible to ROLE_ADMIN, showing key | global value | override value | locale | actions
- **Design:** See [04-Data-Model.md](04-Data-Model.md) section 2.7

---

## 4. Non-Functional Requirements

| ID | Category | Requirement |
|----|----------|-------------|
| NFR-01 | Performance | Bundle fetch < 200ms (Valkey-cached) |
| NFR-02 | Performance | Language switch < 500ms (no page reload) |
| NFR-03 | Availability | Static fallback (en-US.json) when backend unreachable |
| NFR-04 | Security | CSV injection prevention (SEC-04) |
| NFR-05 | Security | 10MB file size limit for imports |
| NFR-06 | Accessibility | WCAG AAA color contrast, keyboard navigation, ARIA roles |
| NFR-07 | RTL | Full RTL support for Arabic/Hebrew locales |
| NFR-08 | Scalability | 50-version retention with scheduled cleanup (INF-01) |
| NFR-09 | Caching | Bundle cached in Valkey, invalidated on dictionary commit |
| NFR-10 | Rate Limiting | Max 5 imports per hour per user |

---

## 5. Business Rules

| ID | Rule |
|----|------|
| BR-01 | Cannot deactivate the alternative locale — must change alternative first |
| BR-02 | Cannot deactivate the last active locale |
| BR-03 | Locale must be active to be set as alternative |
| BR-04 | Deactivating a locale with assigned users migrates them to the alternative |
| BR-05 | Import preview tokens expire after 30 minutes (Valkey TTL) |
| BR-06 | Every dictionary modification creates a version snapshot |
| BR-07 | Rollback creates a pre-rollback snapshot before restoring |
| BR-08 | Translation bundles use a GLOBAL base dictionary with optional tenant-specific overrides (overlay pattern) |
| BR-09 | Anonymous users can fetch bundles and detect locale (public endpoints) |
| BR-10 | AI translations must preserve `{param}` placeholder tokens |
| BR-11 | Manual and imported translations go live immediately (ACTIVE status) — no approval workflow |
| BR-12 | Agentic translations of ambiguous terms are flagged PENDING_REVIEW until admin approves |
| BR-13 | Translation updates are reflected to other users within 5 minutes via bundle version polling |
| BR-14 | Admin sees translation updates immediately after save (same-session reflection) |
| BR-15 | Tenant translation overrides take precedence over global translations for the same key+locale |
| BR-16 | Tenant overrides are isolated — Tenant A cannot see or modify Tenant B's overrides |
| BR-17 | Modifying a global translation invalidates all tenant-specific caches for that locale |
| BR-18 | Anonymous/unauthenticated users receive global translations only (no tenant overrides) |

---

## 6. Out of Scope

- Real-time collaborative editing of translations
- External CAT tool integration (Trados, Memsource, Crowdin) — CSV import/export covers this use case
- Automatic string extraction from source code (manual key registration)
- Dedicated ROLE_TRANSLATOR or ROLE_REVIEWER roles — existing admin roles are sufficient
- Translator screenshots/visual context — admin-driven workflow does not require visual context
- **Bulk find-and-replace in translations** (deferred to next release) — Rationale:
  - Requires a regex/pattern matching engine safe for multi-locale text (Arabic + English + CJK character sets)
  - Needs a preview-with-undo workflow showing all affected entries before applying, with rollback capability
  - Concurrent edit protection required (admin A doing bulk replace while admin B edits creates version conflicts)
  - **Phase 1 (current release):** Duplication detection flag (FR-13) lets admins identify problematic entries first
  - **Phase 2 (next release):** Bulk find-and-replace with preview, scope selection (all locales vs. single locale), and versioned snapshot before applying

---

## 7. Change Management (TOGAF Phase H)

### 7.1 Translation Change Governance

| Change Type | Approval | Rollback | Impact |
|-------------|----------|----------|--------|
| Manual translation edit | None — ACTIVE immediately | Rollback to previous version via Rollback tab | Single key+locale |
| CSV import | Preview-and-confirm gate (30-min TTL) | Pre-import snapshot auto-created | Batch (up to 50,000 rows) |
| Agentic AI translation | Auto-applied for unambiguous; HITL review for ambiguous | Rollback to pre-AI snapshot | Batch (missing keys) |
| Tenant override | None — ACTIVE immediately | Delete override to revert to global | Single tenant+key+locale |
| Schema migration (V2, V3) | DBA review required | Flyway migration history | Database schema |

### 7.2 Version Retention Policy

- **50-version retention:** Only the latest 50 dictionary versions are kept ([INF-01])
- **Automatic cleanup:** `@Scheduled` task purges versions beyond 50th (ordered by `version_number DESC`)
- **Snapshot integrity:** Every modification (edit, import, rollback) creates a JSONB snapshot before applying changes

### 7.3 Cache Invalidation Protocol

| Trigger | Cache Keys Invalidated | Reflection Time |
|---------|----------------------|-----------------|
| Dictionary edit/import/rollback | `bundle:global:{locale}` + ALL `bundle:*:{locale}` tenant keys | Admin: immediate; Users: ≤5 min |
| Tenant override CRUD | `bundle:{tenantId}:{locale}` only | Admin: immediate; Tenant users: ≤5 min |
| Locale activation/deactivation | All bundle keys | All users: ≤5 min |

### 7.4 Backward Compatibility

- Adding new translation keys: **Non-breaking** — frontend falls back to English for missing keys
- Removing translation keys: **Breaking** — requires coordinated frontend + dictionary cleanup
- Schema migrations: **Forward-only** via Flyway — no manual DDL permitted

---

## Changelog

| Version | Date | Changes |
|---------|------|---------|
| 4.0.0 | 2026-03-11 | TOGAF alignment: added §1.1 Competitive Context (Phase E), §7 Change Management (Phase H); all 8 TOGAF phases now have evidence |
| 3.0.0 | 2026-03-11 | Persona alignment: replaced ad-hoc personas with official registry references (PER-UX-001/003/004, PER-CX-001) + 6 secondary personas; added FR-15 (tenant-specific translation overrides, overlay pattern); added BR-15 to BR-18 (tenant override rules); updated BR-08 (global→overlay); expanded bulk find-and-replace deferral rationale (Phase 1/Phase 2); removed tenant overrides from Out of Scope |
| 2.0.0 | 2026-03-11 | Stakeholder feedback: added FR-11 (3-scenario workflow), FR-12 (translation reflection), FR-13 (duplication detection), BR-11 to BR-14; updated EX-01/EX-02 decisions; expanded out-of-scope |
| 1.0.0 | 2026-03-11 | Initial PRD with FR-01 through FR-11, NFRs, business rules |
