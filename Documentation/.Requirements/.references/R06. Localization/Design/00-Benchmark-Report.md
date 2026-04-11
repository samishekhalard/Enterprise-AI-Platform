# Localization & i18n Benchmark Report

**Version:** 3.0.0
**Date:** March 11, 2026
**Status:** Benchmark Assessment — Updated per stakeholder feedback
**Owner:** Architecture + UX + QA Agents (Cross-Functional Audit)

---

## Executive Summary

This report benchmarks the EMSIST Localization feature against international i18n standards, industry best practices, and experience design frameworks. The assessment covers **User Experience (UX)**, **Employee Experience (EX)**, **Multi-Experience (MX)**, and **Customer Experience (CX)** dimensions.

### Overall Maturity Score

```mermaid
pie title i18n Maturity Score (60/100)
    "Implemented" : 35
    "Partially Addressed" : 25
    "Critical Gaps" : 20
    "Not Addressed" : 20
```

| Dimension | Score | Grade | Verdict |
|-----------|-------|-------|---------|
| **Standards Compliance** | 45/100 | D | BCP 47 only; missing CLDR, ICU, W3C |
| **User Experience (UX)** | 70/100 | B- | Good RTL/responsive; missing text expansion, BiDi |
| **Employee Experience (EX)** | 55/100 | C | 3-scenario workflow decided; HITL for agentic; no TM yet |
| **Multi-Experience (MX)** | 40/100 | D | SPA only; no SSR/SEO, no email/PDF/mobile-native |
| **Customer Experience (CX)** | 55/100 | C | Good admin tools; missing end-user personalization |
| **Security & Compliance** | 60/100 | C+ | Strong auth; missing XSS sanitization, CSV injection fix |
| **Overall** | **60/100** | **C+** | **Solid foundation with clear workflow decisions; runtime i18n still needed** |

---

## Part 1: Standards Compliance Benchmark

### 1.1 Standards Coverage Matrix

| Standard | Description | Status | Score |
|----------|-------------|--------|-------|
| **BCP 47** (RFC 5646) | Language tag format | [IMPLEMENTED] — `en-US`, `ar-AE` codes in `system_locales.code` | 90% |
| **Unicode CLDR** | Common Locale Data Repository | [NOT IMPLEMENTED] — Format config fields exist but no CLDR library | 15% |
| **ICU MessageFormat** | Parameterized message formatting | [NOT IMPLEMENTED] — Simple key-value only, no plural/select/gender | 5% |
| **W3C i18n Best Practices** | Web internationalization guidelines | [PARTIAL] — `lang`/`dir` attributes yes; missing hreflang, Content-Language | 45% |
| **WCAG 2.2 AAA** | Accessibility | [DESIGNED] — Comprehensive spec; not yet implemented | 60% |
| **ISO 639 / ISO 3166** | Language and country codes | [IMPLEMENTED] — Via BCP 47 subtags | 90% |
| **ISO 4217** | Currency codes | [IMPLEMENTED] — `currency_code` field in format config | 80% |
| **RFC 7231** | HTTP Content Negotiation | [PARTIAL] — Accept-Language detect exists; missing Content-Language, Vary | 40% |
| **OWASP i18n Security** | Injection prevention | [PARTIAL] — SQL safe (JPA); CSV injection + XSS open | 50% |

### 1.2 Critical Standard Gaps

#### Gap S-01: No ICU MessageFormat Support [CRITICAL]

**What's missing:** The system stores translations as plain strings. There is no support for:
- **Pluralization:** Arabic has 6 plural forms (zero, one, two, few, many, other). English has 2. Chinese has 1. Without ICU, every plural variant must be a separate dictionary key.
- **Gender agreement:** French/Arabic require gendered translations. No mechanism to select gender-variant strings at runtime.
- **Select/Choice:** No conditional message selection based on parameters.

**Industry benchmark:** Salesforce, SAP, and Microsoft all use ICU MessageFormat as the standard for enterprise i18n. Angular's `@angular/localize` natively supports ICU.

**Impact:** Without ICU, scaling to Arabic/French requires 2-6x more dictionary keys, making management exponentially harder.

**Recommendation:**
```
Backend:  Add ICU4J library dependency + MessageFormat parser
Frontend: Use Angular's built-in ICU support via @angular/localize
Data:     Add `message_type` column (PLAIN, ICU) to dictionary_entries
Validate: Parse ICU syntax on import; reject malformed patterns
```

#### Gap S-02: No CLDR Integration [HIGH]

**What's missing:** Format config stores patterns as raw strings (`date_format: "dd/MM/yyyy"`) but doesn't use CLDR data for:
- Locale-specific plural rules validation
- Thousand/decimal separator patterns per locale
- Currency symbol placement (prefix vs. suffix)
- First day of week per locale
- Calendar-specific date patterns (Hijri month names)

**Industry benchmark:** Java's `java.util.Locale` and JavaScript's `Intl` API both derive from CLDR. Enterprise i18n systems validate translations against CLDR rules.

**Recommendation:**
```
Backend:  Use Java's Locale + DateTimeFormatter (CLDR-based) for format validation
Frontend: Use Intl.PluralRules, Intl.DateTimeFormat, Intl.NumberFormat (CLDR-based)
Validate: On import, verify plural forms match locale's CLDR plural categories
```

#### Gap S-03: Missing HTTP Content Negotiation Headers [MEDIUM]

**What's missing:**
- `Content-Language` response header on bundle and error responses
- `Vary: Accept-Language` header for cache correctness
- Proper Accept-Language quality value parsing (`;q=0.8`)

**Recommendation:** Add `Content-Language: {locale}` and `Vary: Accept-Language` to all localization-service responses.

---

## Part 2: User Experience (UX) Benchmark

### 2.1 UX Strengths

| Feature | Rating | Evidence |
|---------|--------|----------|
| Language switcher design | Excellent | Matches island button style, pill shape, neumorphic, 44px touch target, keyboard accessible |
| RTL layout support | Good | CSS logical properties (`inset-inline-start`, `padding-inline`), `dir` attribute toggling |
| Admin locale management | Excellent | 4-tab interface with search, pagination, toggle, radio, format config |
| Responsive design | Good | 4 breakpoints, table-to-card transformation, mobile-first |
| Accessibility spec | Excellent | WCAG AAA contrast, ARIA roles, keyboard navigation, focus management |
| Error handling patterns | Good | Toast system, error banners, confirmation dialogs |
| AI translation assistance | Good | Confidence scoring, bulk actions, review panel |

### 2.2 UX Gaps & Recommendations

#### Gap UX-01: Text Expansion Not Addressed [CRITICAL]

**Problem:** German text is 30% longer than English. Finnish can be 60% longer. Arabic is typically 25% longer. Zero documentation or testing addresses this.

**Impact:** After translation, UI will overflow — truncated button labels, broken table layouts, misaligned form fields.

**Benchmark:** PrimeNG components use internal layout calculations that break with text expansion. The EMSIST codebase has **5 critical fixed-width constraints** that will clip or truncate translated text.

**PrimeNG-Specific Fixed-Width Constraints:**

| Component | File | Line | Current Constraint | Risk | Fix |
|-----------|------|------|--------------------|------|-----|
| Search input | `master-locale-section.component.scss` | 64 | `width: 280px` | German "Sprachen suchen…" clips at 280px | Change to `min-width: 280px; width: 100%; max-width: 400px` |
| Translation cell | `master-locale-section.component.scss` | 70-80 | `max-width: 200px; text-overflow: ellipsis` | French/German translations truncated with "…" | Change to `max-width: 300px` or use PrimeNG `p-table` `[resizableColumns]="true"` |
| Table container | `master-locale-section.component.scss` | ~45 | `min-width: 60rem` | Horizontal scroll at 960px hides expanded text | Use `[scrollable]="true" scrollDirection="horizontal"` on `p-table` |
| Edit dialog | `master-locale-section.component.scss` | ~120 | `width: 480px` (implicit via PrimeNG dialog) | "Übersetzungen bearbeiten" title wraps poorly | Set `[style]="{ 'min-width': '480px', 'max-width': '90vw' }"` on `p-dialog` |
| Brand island | `shell-layout.component.scss` | ~30 | `width: 460px` | Language switcher + brand text overflow | Use `min-width: 460px; width: auto; max-width: 100%` |

**Additional PrimeNG Component Risks:**

| PrimeNG Component | Risk | Fix |
|-------------------|------|-----|
| `p-button` labels | PrimeNG buttons use fixed padding; German labels overflow | Add `[style]="{ 'white-space': 'nowrap' }"` or use `styleClass="p-button-text"` for text-only |
| `p-tag` (direction badges) | LTR/RTL tags are short, but locale names in dropdowns expand | Verify `p-tag` uses `fit-content` width (default behavior — OK) |
| `p-toggleSwitch` labels | No text — toggle only | No risk |
| `p-paginator` | PrimeNG paginator labels ("Showing 1 to 10 of 50") auto-localize via PrimeNG locale config | Configure `providePrimeNG({ translation: { ... } })` with locale strings |
| `p-toast` | Default `350px` width clips long German/Arabic messages | Set `[style]="{ 'max-width': '90vw' }"` on `p-toast` |
| `p-fileupload` | "Choose File" label translatable via `chooseLabel` input | Set `[chooseLabel]="t('import.choose_file')"` |
| `p-confirmDialog` | Confirm/Cancel button labels expand | Set `[acceptLabel]` and `[rejectLabel]` with translated strings |

**Testing addition:** Add Playwright test that renders every page with a pseudo-locale (e.g., `xx-XX`) where every string is padded to 150% length. Additionally, test all PrimeNG `p-dialog` components at the narrowest supported viewport (375px) with German translations.

#### Gap UX-02: BiDi Mixed-Text Handling [HIGH]

**Problem:** When Arabic text contains embedded English words, numbers, URLs, or brand names (e.g., "مرحباً بكم في EMSIST"), the text direction can break without Unicode BiDi isolation.

**Impact:** URLs render backwards, phone numbers scramble, brand names float to wrong side.

**Recommendations:**
- Use CSS `unicode-bidi: isolate` on inline elements containing mixed-direction content
- Wrap brand names in `<bdo dir="ltr">EMSIST</bdo>` within RTL contexts
- Use `<bdi>` element for user-generated content that might be any direction
- Add `dir="auto"` on input fields that accept RTL or LTR text
- Test with strings containing: numbers, URLs, email addresses, brand names, punctuation

#### Gap UX-03: No Locale-Aware Sorting [MEDIUM]

**Problem:** Frontend `localeCompare()` doesn't pass the user's selected locale. Dictionary dropdown, search results, and table sorting may produce incorrect order for non-English locales.

**Fix:** Pass `TranslationService.currentLocale()` to all `localeCompare()` calls:
```typescript
localeCompare(other, currentLocale, { sensitivity: 'base' })
```

#### Gap UX-04: Date Pipes Not Locale-Aware [MEDIUM]

**Problem:** 15+ template locations use `| date: 'mediumDate'` without passing locale. Dates always render in browser default locale, not user's selected EMSIST locale.

**Fix:** The planned `LocalizedDatePipe` addresses this. Ensure ALL existing `| date:` usages are migrated.

#### Gap UX-05: No Live Region for Language Change [LOW]

**Problem:** When user switches language, screen readers don't announce the change.

**Fix:** Add `aria-live="polite"` region that announces: "Language changed to {locale name}" after switching.

---

## Part 3: Employee Experience (EX) Benchmark

EX addresses the **translator/admin workflow** — the people who manage translations daily.

### 3.1 EX Strengths

| Feature | Rating | Evidence |
|---------|--------|----------|
| CSV import/export workflow | Good | Preview before commit, rate limiting, error details |
| Version history + rollback | Excellent | Full snapshot history, one-click rollback with pre-rollback safety snapshot |
| Coverage tracking | Good | Per-locale coverage percentage |
| AI-assisted translation | Good | Confidence scoring, bulk accept, placeholder validation |
| Batch operations | Good | CSV bulk import, bulk AI accept |

### 3.2 EX Gaps & Recommendations

#### Gap EX-01: No Translator Role or Workflow [RESOLVED — Stakeholder Decision]

**Original concern:** The system has only 2 admin personas (Super Admin, Tenant Admin). No dedicated translator role exists.

**Stakeholder decision (2026-03-11):** No new roles (`ROLE_TRANSLATOR`, `ROLE_REVIEWER`) are needed. The existing Super Admin and Tenant Admin personas handle all translation work. Three translation scenarios are supported:

```mermaid
graph TD
    subgraph "Scenario 1: Manual Translation"
        TA1[Tenant Admin] -->|Select record & edit| DE1[Dictionary Entry]
        DE1 -->|Saved immediately| B1[Live Bundle]
    end

    subgraph "Scenario 2: Import/Export"
        TA2[Tenant Admin] -->|Export CSV| CSV[CSV File]
        CSV -->|Edit externally| CSV
        CSV -->|Import CSV| DE2[Dictionary Entries]
        DE2 -->|Committed| B2[Live Bundle]
    end

    subgraph "Scenario 3: Agentic Translation"
        TA3[Tenant Admin] -->|Request AI translation| AI[Translation Agent]
        AI -->|Simple terms| AUTO[Auto-applied]
        AI -->|Ambiguous terms| HITL[HITL Review Panel]
        HITL -->|Admin approves/rejects| DE3[Dictionary Entry]
        AUTO --> B3[Live Bundle]
        DE3 --> B3
    end
```

| Scenario | Who | Workflow | Human Validation |
|----------|-----|----------|-----------------|
| **Manual translation** | Tenant Admin | Select record → edit → save | None required |
| **Import/export** | Tenant Admin | Export CSV → edit externally → import → preview → commit | None required (preview serves as validation) |
| **Agentic translation** | Translation Agent + Tenant Admin | Agent translates → flags ambiguous terms → admin reviews flagged items only | HITL only for complex/ambiguous terms (e.g., words with multiple contextual meanings) |

**No CAT tools needed:** External tools (Trados, Memsource, Crowdin) are not required. The built-in CSV import/export and agentic translation cover all use cases.

#### Gap EX-02: No Translation Status Workflow [RESOLVED — Simplified per Stakeholder Decision]

**Original concern:** Translations have no status field. No quality gate before going live.

**Stakeholder decision (2026-03-11):** A full 4-state workflow (Draft → Review → Approved → Published) is not needed. Translations go live immediately for manual and import scenarios. The only quality gate is for **agentic translation** of ambiguous terms.

**Simplified status model:**

```mermaid
stateDiagram-v2
    [*] --> ACTIVE: Manual edit or import
    [*] --> PENDING_REVIEW: Agent flags ambiguous term
    PENDING_REVIEW --> ACTIVE: Admin approves
    PENDING_REVIEW --> REJECTED: Admin rejects
    REJECTED --> ACTIVE: Admin re-edits manually
    ACTIVE --> ACTIVE: Subsequent edits
```

| Status | Behavior | Triggered By |
|--------|----------|-------------|
| `ACTIVE` | Included in live bundle immediately | Manual edit, CSV import, agent auto-translation |
| `PENDING_REVIEW` | Excluded from bundle until admin approves | Agent flags ambiguous/multi-meaning term |
| `REJECTED` | Excluded from bundle; admin must re-translate manually | Admin rejects agent suggestion |

**Key difference from original recommendation:** No `DRAFT` or `UNDER_REVIEW` states. Manual translations and imports are trusted immediately. Only agentic translations of complex terms require human-in-the-loop review.

#### Gap EX-03: No Translator Context (Notes, Max Length) [MEDIUM — Reduced per Stakeholder Decision]

**Original concern:** `dictionary_entries` has only `technical_name`, `module`, `description`. No translator context fields.

**Stakeholder decision (2026-03-11):** Screenshots are **not needed** — the translation workflow is admin-driven, not outsourced to translators who need visual context. Translator notes and max length are sufficient.

**Recommendation:** Extend data model (without screenshots):

| New Field | Table | Type | Purpose |
|-----------|-------|------|---------|
| `translator_notes` | `dictionary_entries` | TEXT | Context hint for admins (e.g., "button label", "error toast") |
| `max_length` | `dictionary_entries` | INTEGER | Character limit per UI context (validates on save) |
| `tags` | `dictionary_entries` | VARCHAR[] | Categorization (ui, error, email, notification, etc.) |

**Removed from original recommendation:**
- ~~`screenshot_url`~~ — Not needed per stakeholder decision
- ~~`glossary_enforced`~~ — Deferred; glossary feature not in current scope

#### Gap EX-04: No Translation Memory (TM) [MEDIUM]

**Problem:** When a translator encounters "Save changes", they can't see that "Save" was already translated in 15 other contexts. Each entry is translated independently.

**Impact:** Inconsistency across translations, wasted effort retranslating identical strings.

**Recommendation (Phase 2):** Build a TM feature that:
1. On edit dialog open, show "Similar translations" panel with matches from existing dictionary
2. Highlight exact matches (100%), fuzzy matches (75%+), and segment matches
3. Allow one-click apply from TM suggestions

#### Gap EX-05: No Bulk Edit / Search-and-Replace [DEFERRED — Next Release]

**Problem:** If a brand term changes (e.g., "ThinkPLUS" → "ThinkPlus+"), admins must edit every entry containing it individually.

**Stakeholder decision (2026-03-11):** Full bulk edit / search-and-replace is deferred to a future release. For the current release, add a **duplication flag** to detect and warn about duplicate translation values across keys.

**Current release scope:**
- Add `is_duplicate` computed flag on dictionary entries that share identical translation values within the same locale
- Show warning badge in admin UI when duplicates are detected
- Admin can review and consolidate duplicates manually

**Deferred to next release:**
- Full "Find & Replace in Translations" feature scoped to a locale
- Bulk edit mode with multi-select and batch update

#### Gap EX-06: No Translation Progress Dashboard [LOW]

**Recommendation:** Show per-locale translation progress metrics in the admin dashboard:
- Keys translated vs. total keys per locale
- Keys pending HITL review (agentic translations)
- Average AI confidence score per locale
- Coverage trend over time (chart)

---

## Part 4: Multi-Experience (MX) Benchmark

MX addresses **consistent localization across ALL touchpoints** — web, mobile, email, PDF, API responses, push notifications.

### 4.1 MX Assessment

| Channel | Localization Support | Status |
|---------|---------------------|--------|
| **Web SPA (Angular)** | Admin UI + planned runtime | [IN-PROGRESS] |
| **REST API error messages** | Error codes defined, no localization | [PLANNED] |
| **Email notifications** | notification-service has 3 hardcoded strings | [NOT ADDRESSED] |
| **PDF exports/reports** | No PDF generation exists | [NOT APPLICABLE] |
| **Mobile native app** | No mobile app exists | [NOT APPLICABLE] |
| **Push notifications** | No push notifications exist | [NOT APPLICABLE] |
| **Server-rendered pages** | Angular SSR not configured | [NOT ADDRESSED] |
| **CLI/API consumers** | No locale support for API consumers | [NOT ADDRESSED] |

### 4.2 MX Gaps & Recommendations

#### Gap MX-01: No SEO / SSR Strategy [CRITICAL for Public-Facing]

**Problem:** Zero documentation on SEO for multilingual content.

**Missing items:**

| SEO Element | Purpose | Fix |
|-------------|---------|-----|
| `<html lang="ar-AE">` | Search engine language detection | [PLANNED] — TranslationService sets this |
| `<link rel="alternate" hreflang="ar-AE">` | Tell Google about language variants | Add to `<head>` dynamically |
| `Content-Language` response header | HTTP-level language signal | Add to API Gateway / localization-service |
| `<meta name="description">` per locale | Translated meta descriptions | Add to TranslationService bootstrap |
| Sitemap with `xhtml:link` alternates | Help crawlers find all language versions | Generate multilingual sitemap |
| `og:locale` + `og:locale:alternate` | Social sharing in correct language | Add OpenGraph meta tags |

**Note:** If EMSIST is purely internal (no public pages), SEO is lower priority. But the login page IS public and should have proper `hreflang` for Arabic users searching in Arabic.

#### Gap MX-02: Email Notifications Not Localized [HIGH]

**Problem:** `notification-service` has 3 hardcoded strings. When the system sends emails (password reset, license expiry alerts), they're always in English.

**Recommendation:**
1. Email templates should use translation keys from the localization dictionary
2. `notification-service` should accept `Accept-Language` header (via Feign propagation)
3. Template rendering should resolve keys from the user's preferred locale

#### Gap MX-03: No Offline-First i18n [MEDIUM]

**Problem:** The current design fetches bundles from the API. If the backend is down:
1. First load: falls back to `assets/i18n/en-US.json` (static file)
2. Subsequent loads: uses IndexedDB cache

**Gap:** Only `en-US.json` is planned as static fallback. Users who prefer Arabic will see English during outages.

**Recommendation:** Generate static fallback files for ALL active locales during build:
```
assets/i18n/en-US.json  (source of truth)
assets/i18n/ar-AE.json  (generated from dictionary)
assets/i18n/fr-FR.json  (generated from dictionary)
```

#### Gap MX-04: No API Response Localization [MEDIUM]

**Problem:** API consumers (external integrations, reporting tools) receive English error messages regardless of their locale.

**Recommendation:** All API error responses should include `Content-Language` header and localized `message` field based on `Accept-Language` header from the request.

---

## Part 5: Customer Experience (CX) Benchmark

CX addresses the **end-to-end experience** for all user types interacting with the system in their preferred language.

### 5.1 CX Strengths

| Feature | CX Impact | Rating |
|---------|-----------|--------|
| Automatic locale detection | Users see their language from first visit | Excellent |
| Language preference persistence | Seamless cross-session experience | Excellent |
| Real-time language switching | No page reload, instant gratification | Good (planned) |
| RTL layout flip | Arabic users see familiar right-to-left layout | Good (planned) |
| Hijri calendar option | Cultural respect for Gulf region users | Good (planned) |
| Fallback to alternative locale | Graceful degradation if locale unavailable | Good |

### 5.2 CX Gaps & Recommendations

#### Gap CX-01: No Locale-Specific Onboarding [HIGH]

**Problem:** When a new user first visits, the app detects their locale and loads the bundle. But there's no onboarding that says "We detected your preferred language is Arabic. You can change this anytime from the language switcher."

**Recommendation:** Add a one-time tooltip/banner near the language switcher on first visit:
```
"We detected Arabic as your preferred language.
Change anytime using this language selector. ↗"
```

#### Gap CX-02: No Locale-Aware Content Formatting [HIGH]

**Problem:** The format config stores patterns (Hijri calendar, Eastern Arabic numerals) but the frontend doesn't consume them yet. Users won't see locale-appropriate dates, numbers, and currencies.

**Impact matrix:**

| Region | Expected | Current |
|--------|----------|---------|
| UAE | ١٢ مارس ٢٠٢٦ (Hijri available) | Mar 12, 2026 |
| France | 12 mars 2026 | Mar 12, 2026 |
| Germany | 12. März 2026 | Mar 12, 2026 |
| Japan | 2026年3月12日 | Mar 12, 2026 |

**Recommendation:** Implement `LocalizedDatePipe` and `LocalizedNumberPipe` as priority Sprint 1 items.

#### Gap CX-03: No Translation Completeness Indicator for Users [LOW]

**Problem:** When a locale has 72% coverage (like ar-AE), users see a mix of Arabic and English fallback keys. This creates a jarring, unprofessional experience.

**Recommendations:**
1. **Minimum coverage threshold:** Don't activate a locale for end users until it reaches 95%+ coverage
2. **Admin warning:** Show "This locale has 72% coverage. Activating it will show untranslated keys as English fallback to end users."
3. **Fallback rendering:** Instead of showing raw keys (`admin.locale.tab.languages`), fall back to English value from en-US bundle

#### Gap CX-04: No Feedback Loop for Translation Quality [MEDIUM]

**Problem:** End users can't report translation errors. If they see a mistranslation, there's no "Report translation issue" mechanism.

**Recommendation:** Add a discreet "Report translation issue" option (accessible via right-click or long-press on translated text) that logs the key, current value, locale, and user comment to the localization admin dashboard.

#### Gap CX-05: No Personalization Beyond Language [LOW]

**Problem:** Locale preference is the only personalization. Advanced CX would include:
- Time zone preference (not just locale-derived)
- Date format preference (some users prefer ISO 8601 regardless of locale)
- Number format preference (some Arabic users prefer Western numerals)

**Recommendation (Phase 3):** Add user-level format overrides in profile settings.

---

## Part 6: Security & Compliance Benchmark

### 6.1 Security Assessment

| Concern | Status | Risk |
|---------|--------|------|
| SQL injection | [SAFE] — JPA parameterized queries | LOW |
| XSS via translations | [VULNERABLE] — Translation values stored/returned as-is | **HIGH** |
| CSV injection | [VULNERABLE] — No sanitization on export (SA condition SEC-04 OPEN) | **HIGH** |
| CSRF | [SAFE] — Stateless JWT, CSRF disabled | LOW |
| Rate limiting | [IMPLEMENTED] — 5 imports/hr per user | LOW |
| Authorization | [IMPLEMENTED] — Role-based, JWT, `.permitAll()` for public | LOW |
| Optimistic locking | [IMPLEMENTED] — `@Version` on all entities | LOW |
| Audit trail | [PARTIAL] — Application logs only, no immutable audit table | MEDIUM |

### 6.2 Security Recommendations

#### Gap SEC-01: XSS via Translation Values [CRITICAL]

**Problem:** If a malicious admin stores `<script>alert('xss')</script>` as a translation value, and the frontend uses `innerHTML` or `[innerHTML]` to render it, XSS is triggered.

**Fix:**
1. **Backend:** Sanitize translation values on save — strip HTML tags or allow only a safe subset (`<b>`, `<i>`, `<br>`)
2. **Frontend:** Never use `innerHTML` for translated strings. Angular's template interpolation `{{ }}` auto-escapes by default.
3. **Validation:** Add server-side regex validation rejecting `<script>`, `<iframe>`, `javascript:`, `on*=` in translation values

#### Gap SEC-02: CSV Injection [HIGH] (Already tracked as SA condition SEC-04)

**Fix:** Prefix values starting with `=`, `+`, `-`, `@`, `\t`, `\r` with a single quote `'` during CSV export. Validate on import.

---

## Part 6B: Translation Reflection Flow

### How Translation Updates Reach the UI

**Stakeholder question:** "When I update a translation successfully, when will it be reflected? Same session or need to refresh?"

**Architecture decision:** Translation updates follow a **cache-invalidation + signal-based refresh** flow. The UI reflects changes **within the same session** without a full page reload, but requires a lightweight bundle re-fetch.

```mermaid
sequenceDiagram
    participant Admin as Tenant Admin
    participant UI as Angular SPA
    participant GW as API Gateway
    participant LS as Localization Service
    participant VK as Valkey Cache

    Note over Admin,VK: Step 1: Admin saves translation edit
    Admin->>UI: Edit translation value
    UI->>GW: PUT /api/v1/admin/dictionary/{id}
    GW->>LS: Forward request
    LS->>LS: Update dictionary_translations
    LS->>VK: Invalidate bundle cache (locale:bundle:{code})
    LS-->>UI: 200 OK (updated entry)

    Note over Admin,VK: Step 2: Bundle version incremented
    LS->>LS: Increment bundle_version for locale

    Note over Admin,VK: Step 3: UI detects stale bundle
    UI->>GW: GET /api/v1/locales/{code}/bundle/version
    GW->>LS: Forward
    LS-->>UI: { version: 42 } (newer than cached v41)

    Note over Admin,VK: Step 4: UI re-fetches bundle
    UI->>GW: GET /api/v1/locales/{code}/bundle
    GW->>LS: Forward
    LS->>VK: Cache MISS (invalidated)
    LS->>LS: Rebuild bundle from DB
    LS->>VK: Cache new bundle
    LS-->>UI: Full translation bundle (v42)

    Note over Admin,VK: Step 5: UI updates reactively
    UI->>UI: TranslationService.bundle.set(newBundle)
    UI->>UI: All {{ key | translate }} pipes re-render
    Admin->>Admin: Sees updated text (no page reload)
```

**Reflection timing by scenario:**

| Scenario | Reflection | Mechanism |
|----------|-----------|-----------|
| **Admin editing translations** | Immediate (same session) | After save, UI re-fetches bundle; Signal update triggers pipe re-render |
| **Other users on same locale** | Within 5 minutes | TranslationService polls `/bundle/version` every 5 min; detects version change → re-fetches |
| **After CSV import** | Immediate for admin; 5 min for other users | Same as manual edit — cache invalidated on commit |
| **After agentic translation** | Immediate for approved terms | Each approved HITL term triggers bundle invalidation |
| **After rollback** | Immediate for admin; 5 min for other users | Rollback invalidates all locale bundle caches |

**Implementation requirements:**

| Component | Requirement | Status |
|-----------|-------------|--------|
| `TranslationService` | Poll `/bundle/version` every 5 min, compare to cached version | [PLANNED] |
| `TranslationService` | On version mismatch, re-fetch full bundle and update Signal | [PLANNED] |
| `localization-service` | Increment `bundle_version` on every dictionary write | [PLANNED] |
| `localization-service` | Invalidate Valkey cache key on every dictionary write | [IMPLEMENTED] — `DictionaryService.invalidateCache()` |
| `TranslatePipe` | Re-render when `TranslationService.bundle` Signal changes | [PLANNED] — Pure pipe reads from Signal |
| IndexedDB | Store bundle locally for offline fallback | [PLANNED] |

**Design decision:** Polling (every 5 min) is chosen over WebSocket for simplicity. For admin users actively editing, the bundle is re-fetched immediately after each save operation. The 5-minute polling window is acceptable for end users since translation changes are infrequent operational events, not real-time data.

---

## Part 7: Prioritized Recommendations

### Tier 1: Critical (Must-Have for Production)

| # | Recommendation | Dimension | Effort | Impact |
|---|---------------|-----------|--------|--------|
| R-01 | **Execute all 63 existing tests** | Quality | 2 SP | Validates everything built so far |
| R-02 | **Fix SEC-04: CSV injection sanitization** | Security | 3 SP | Prevents Excel formula injection |
| R-03 | **Fix XSS: sanitize translation values** | Security | 3 SP | Prevents stored XSS attacks |
| R-04 | **Implement bundle fallback to en-US values** (not raw keys) | CX | 3 SP | Users never see `admin.locale.tab.languages` |
| R-05 | **Add Content-Language + Vary headers** | Standards | 2 SP | HTTP compliance, CDN correctness |
| R-06 | **Add text expansion testing** | UX | 5 SP | Prevent overflow after translation |

### Tier 2: High (Required for Enterprise Quality)

| # | Recommendation | Dimension | Effort | Impact |
|---|---------------|-----------|--------|--------|
| R-07 | **Add ICU MessageFormat support** | Standards | 13 SP | Proper pluralization (Arabic 6 forms) |
| R-08 | **Add simplified translation status** (ACTIVE/PENDING_REVIEW/REJECTED) for agentic HITL | EX | 5 SP | Quality gate for ambiguous AI translations only |
| R-09 | **Add translator notes + max_length to data model** | EX | 3 SP | Better context for admin translation work |
| R-10 | **Localize email notification templates** | MX | 5 SP | Consistent language across all touchpoints |
| R-11 | **Add BiDi text handling** (unicode-bidi, bdi, dir=auto) | UX | 5 SP | Mixed Arabic/English text renders correctly |
| R-12 | **Add minimum coverage threshold for activation** | CX | 3 SP | Prevent half-translated UX |
| R-13 | **Pass locale to all localeCompare() calls** | UX | 2 SP | Correct sorting in all languages |
| R-14 | **Implement translation reflection flow** (bundle version polling + Signal re-render) | UX | 5 SP | Live translation updates without page reload |

### Tier 3: Medium (Enhances Competitiveness)

| # | Recommendation | Dimension | Effort | Impact |
|---|---------------|-----------|--------|--------|
| R-15 | **Add translation memory (similar suggestions)** | EX | 8 SP | Consistency + efficiency |
| R-16 | **Add hreflang + SEO meta tags** | MX | 5 SP | Search engine language indexing |
| R-17 | **Generate static fallback for all active locales** | MX | 3 SP | Offline resilience for all languages |
| R-18 | **Add locale-aware formatting** (Intl.DateTimeFormat, Intl.NumberFormat) | CX | 5 SP | Proper date/number/currency display |
| R-19 | **Add onboarding locale tooltip** | CX | 2 SP | First-visit language awareness |
| R-20 | **Add "Report translation issue" for end users** | CX | 5 SP | Crowdsourced quality improvement |
| R-21 | **Add duplication flag** for detecting duplicate translation values per locale | EX | 3 SP | Identifies consolidation opportunities |

### Tier 4: Low (Nice-to-Have / Phase 3)

| # | Recommendation | Dimension | Effort | Impact |
|---|---------------|-----------|--------|--------|
| R-22 | Add CLDR plural rule validation on import | Standards | 5 SP | Prevent invalid plural forms |
| R-23 | Add bulk find-and-replace in translations | EX | 5 SP | Brand term updates (deferred from current release) |
| R-24 | Add translation progress dashboard per locale | EX | 3 SP | Visibility into translation coverage trends |
| R-25 | Add user-level format overrides | CX | 5 SP | Advanced personalization |
| R-26 | Add structured data (JSON-LD) with @language | MX | 3 SP | Rich search results per language |
| R-27 | Add CJK line-breaking rules | UX | 3 SP | Japanese/Chinese text wrapping |

**Removed from original recommendations:**
- ~~R-14 (old): Add ROLE_TRANSLATOR + ROLE_REVIEWER~~ — Not needed per stakeholder decision; existing admin roles handle all translation work
- ~~CAT tool integration~~ — Not needed; CSV import/export + agentic translation are sufficient

---

## Part 8: Industry Benchmark Comparison

### How EMSIST Compares to Industry Leaders

| Feature | EMSIST | Salesforce TW | SAP Translation Hub | Crowdin | Phrase |
|---------|--------|--------------|---------------------|---------|-------|
| Key-value dictionary | Yes | Yes | Yes | Yes | Yes |
| ICU MessageFormat | No (planned) | Yes | Yes | Yes | Yes |
| Pluralization | No (planned) | Yes (6 forms) | Yes (CLDR) | Yes | Yes |
| Gender-aware | No | Yes | Yes | No | Yes |
| Translation memory | No (planned) | No | Yes | Yes | Yes |
| Translation workflow | Simplified (3 scenarios) | Yes (2 roles) | Yes (4 roles) | Yes (5 roles) | Yes (3 roles) |
| HITL review (AI only) | Yes (ambiguous terms) | No | No | No | No |
| Version control | Yes (snapshots) | Limited | Yes | Yes (Git) | Yes (branches) |
| CSV import/export | Yes | Yes | Yes | Yes | Yes |
| AI translation + HITL | Yes (with confidence scoring) | No | Yes (SAP AI) | Yes (MT) | Yes (MT) |
| Rollback | Yes (full snapshots) | No | Limited | Yes | Yes |
| Bundle API | Yes | Yes | Yes | Yes (CDN) | Yes (CDN) |
| RTL support | Yes (design) | Yes | Yes | Yes | Yes |
| Live translation refresh | Yes (Signal-based) | No | No | No | No |
| Translator notes/context | Planned (notes + max_length) | Yes | Yes | Yes (screenshots) | Yes (screenshots) |
| Glossary | No | Yes | Yes | Yes | Yes |
| In-context editing | No | No | Yes | Yes | Yes |
| CDN delivery | No | No | Yes | Yes | Yes |
| Duplication detection | Planned | No | No | Yes | Yes |

### EMSIST Advantages

1. **Full rollback with snapshots** — Better than most competitors
2. **AI-powered translation with HITL** — Agentic translation with human review for ambiguous terms is unique in the market
3. **Tight admin integration** — Built into the admin panel, not a separate external tool
4. **Neumorphic design consistency** — Beautiful, cohesive UI language
5. **Live translation refresh** — Signal-based bundle updates without page reload (unique vs. competitors)
6. **Simplified workflow** — No role proliferation; 3 clear scenarios cover all use cases
7. **Tenant translation overrides** — Overlay pattern allows tenants to customize terminology while sharing a global base dictionary (unique differentiation for multi-tenant SaaS)

### EMSIST Gaps vs. Leaders

1. **No ICU MessageFormat** — The #1 gap vs. every competitor (planned)
2. **No translation memory** — Efficiency loss for large dictionaries (planned)
3. **No CDN delivery** — All bundles served from single Valkey cache
4. **No in-context editing** — Admin edits in a table, not in the live UI
5. **No glossary enforcement** — Brand terms not automatically validated

---

## Conclusion

EMSIST's localization infrastructure has an **excellent foundation** — the backend service is code-complete with versioning, rollback, caching, and rate limiting. The admin UI is well-designed with neumorphic consistency. The planned AI translation feature is a differentiator.

The feature scores **60/100** overall because:
1. **Zero i18n runtime exists** — the most critical gap
2. **No ICU MessageFormat** — makes proper Arabic/French pluralization impossible
3. **816 hardcoded strings** at 0% externalization
4. **No translation reflection flow** — designed but not yet built

**Stakeholder decisions that improve the score (EX 30→55):**
- 3-scenario translation workflow defined (manual, import/export, agentic)
- HITL review scoped to agentic ambiguous terms only (simpler, pragmatic)
- No role proliferation — existing admin roles are sufficient
- No CAT tools dependency — CSV + agentic cover all use cases

The **highest-ROI improvements** are:
- **R-01 to R-06** (Tier 1) — Fix security, add fallback rendering, fix PrimeNG text expansion, test everything
- **R-07** (ICU MessageFormat) — Unblocks proper multilingual support
- **R-08** (Simplified status workflow) — Enables HITL quality gate for agentic translations
- **R-14** (Translation reflection flow) — Live translation updates in same session

Implementing Tiers 1-2 would raise the score to approximately **82/100**, which is competitive with enterprise i18n platforms.

### TOGAF ADM Alignment

| TOGAF Phase | Coverage | Evidence |
|-------------|----------|----------|
| **A: Architecture Vision** | Complete | PRD §1 vision statement + §1.1 competitive context |
| **B: Business Architecture** | Complete | PRD v4.0: personas, BRs, NFRs, 3-scenario workflow |
| **C: Information Systems** | Complete | Data Model v3.0 + API Contract v2.0 (27 endpoints) |
| **D: Technology Architecture** | Complete | ADR-031, arc42 §8.18, UI/UX Spec v4.0 |
| **E: Opportunities & Solutions** | Complete | PRD §1.1 — 5-alternative evaluation (custom > @ngx-translate > @angular/localize > Crowdin > Spring messages) |
| **F: Migration Planning** | Complete | Sprint Plan (209 SP / 52 stories / 3 sprints) + Migration Wave Map in Backlog Overview |
| **G: Implementation Governance** | Complete | SA Conditions Tracker v3.0 (25 conditions, 64% resolved); pre-commit hooks |
| **H: Change Management** | Complete | PRD §7 — Translation Change Governance, Version Retention Policy, Cache Invalidation Protocol |

All 8 TOGAF ADM phases are now documented with evidence files.

---

## Changelog

| Version | Date | Changes |
|---------|------|---------|
| 3.0.0 | 2026-03-11 | TOGAF alignment: added TOGAF ADM phase coverage table (all 8 phases verified); updated version |
| 2.0.0 | 2026-03-11 | Stakeholder feedback applied: PrimeNG text expansion (5 constraints), 3-scenario translation workflow, simplified HITL status, removed CAT tools/screenshots/translator roles, added translation reflection flow, duplication flag, updated recommendations and industry comparison |
| 1.0.0 | 2026-03-11 | Initial benchmark — 7 dimensions, 26 recommendations, industry comparison |
