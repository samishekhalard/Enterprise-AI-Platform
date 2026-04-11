# Scenario & Edge Case Matrix

**Version:** 2.0.0
**Date:** 2026-03-11
**Total Scenarios:** 118 (84 original + 34 new for FR-08, FR-09, FR-12, FR-14, FR-15, NFR-01/02, BR-14→BR-17)

---

## Personas & RBAC Context

| Persona | Role | Locale Features Access |
|---------|------|----------------------|
| **Super Admin** | ROLE_SUPER_ADMIN | Full: Manage locales, dictionary, import/export, rollback, format config, user prefs |
| **Tenant Admin** | ROLE_ADMIN | Read: View active locales, browse dictionary. No write access to system locales |
| **End User** | ROLE_USER | Personal: Set own locale preference, language switcher, view translated UI |
| **Anonymous** | Unauthenticated | Public: Detect locale, fetch bundles (login page rendering), view format config |
| **Developer/CI** | ROLE_DEVELOPER | Tooling: Register keys via CI/CD pipeline, coverage reports |

---

## US-LM-01: System Languages Management

### Happy Scenarios

| # | Scenario | Actor | Precondition | Steps | Expected Result |
|---|----------|-------|-------------- |-------|-----------------|
| H-01 | View locale catalog | Super Admin | 10 locales seeded | Navigate to Languages tab | Table shows 10 locales with flags, pagination, search |
| H-02 | Search locales | Super Admin | 10 locales exist | Type "ar" in search | Filters to ar-AE (Arabic) |
| H-03 | Activate locale | Super Admin | fr-FR is inactive | Click toggle switch for fr-FR | fr-FR becomes active, toast "Locale activated" |
| H-04 | Deactivate locale | Super Admin | fr-FR is active, not alternative, 2+ active | Click toggle switch for fr-FR | fr-FR deactivated, toast "Locale deactivated" |
| H-05 | Set alternative locale | Super Admin | ar-AE is active | Select ar-AE radio button | ar-AE becomes alternative, previous alternative unset |
| H-06 | View format config | Super Admin | ar-AE has config | Click format config for ar-AE | Shows calendar, numeral system, currency, date format |
| H-07 | Update format config | Super Admin | ar-AE config displayed | Change calendar to "hijri", save | Config saved, toast "Format config updated" |

### Alternative Scenarios

| # | Scenario | Trigger | Expected Result |
|---|----------|---------|-----------------|
| A-01 | Deactivate locale with user migration | Super Admin deactivates de-DE while 5 users have it set | Users migrated to alternative locale, migration count shown in response |
| A-02 | Activate locale that was previously deactivated | Super Admin reactivates de-DE | Locale marked active, activated_at updated, no user migration needed |
| A-03 | No search results | Super Admin searches "xyz" | Empty state: "No locales found matching 'xyz'" |

### Edge Cases

| # | Scenario | Trigger | Expected Result | Severity |
|---|----------|---------|-----------------|----------|
| E-01 | Deactivate alternative locale (VR-02) | Super Admin toggles off alternative locale | 409 Conflict: "Cannot deactivate alternative locale. Change the alternative locale first." | CRITICAL |
| E-02 | Deactivate last active locale (VR-03) | Super Admin tries to deactivate only active locale | 409 Conflict: "Cannot deactivate the last active locale." | CRITICAL |
| E-03 | Set inactive locale as alternative | Super Admin selects inactive locale as alternative | 422: "Locale must be active to be set as alternative." | HIGH |
| E-04 | Concurrent deactivation | Two admins deactivate locales simultaneously leaving 0 active | Optimistic lock prevents: first succeeds, second gets 409 | HIGH |
| E-05 | Locale with max-length code | Code is exactly 10 chars | Renders correctly, no truncation in table | MEDIUM |

### Action Button Consequences

| Button | Action | Reversible? | Confirmation Required? | Side Effects |
|--------|--------|-------------|----------------------|--------------|
| Active toggle ON | Activates locale system-wide | Yes (deactivate later) | No | Locale appears in language switchers |
| Active toggle OFF | Deactivates locale | Yes (reactivate) | Yes (if users affected) | Users on this locale migrated to alternative |
| Alternative radio | Changes fallback locale | Yes | No | Previous alternative unset; affects content negotiation |
| Format config Save | Persists format config | Yes (edit again) | No | All users of this locale see new formats |

---

## US-LM-02: Translation Dictionary Management

### Happy Scenarios

| # | Scenario | Actor | Steps | Expected Result |
|---|----------|-------|-------|-----------------|
| H-08 | Browse dictionary | Super Admin | Navigate to Dictionary tab | Paginated table of translation keys with values per active locale |
| H-09 | Search dictionary | Super Admin | Type "login" in search | Filters to keys matching "login" (technical_name or module) |
| H-10 | Edit translation | Super Admin | Click edit on key "auth.login.welcome" | Dialog opens with text field per active locale. Save updates all edited values. |
| H-11 | Add missing translation | Super Admin | Edit key with empty ar-AE value, type Arabic text | ar-AE column now shows translation, coverage increases |
| H-12 | View translation coverage | Super Admin | Click coverage report for ar-AE | Shows: 450/500 keys translated (90%), lists 50 missing keys |

### Edge Cases

| # | Scenario | Expected Result | Severity |
|---|----------|-----------------|----------|
| E-06 | Edit with empty value | Clears translation for that locale; coverage decreases | MEDIUM |
| E-07 | Translation with HTML tags | Value sanitized: `<script>` stripped, `<b>` preserved if allowed | HIGH |
| E-08 | Translation with ICU placeholders | `{count, plural, one {# item} other {# items}}` saved as-is | MEDIUM |
| E-09 | Very long translation (>5000 chars) | Validation error: "Translation value exceeds maximum length" | MEDIUM |
| E-10 | Edit while another admin edits same key | Optimistic lock: last save wins, first saver sees conflict warning | HIGH |
| E-11 | RTL text in LTR context | Edit dialog shows RTL input field for RTL locales (dir="rtl") | MEDIUM |
| E-12 | Unicode emoji in translation | Stored and rendered correctly (UTF-8) | LOW |

---

## US-LM-03: Dictionary Import & Export

### Happy Scenarios

| # | Scenario | Actor | Steps | Expected Result |
|---|----------|-------|-------|-----------------|
| H-13 | Export dictionary CSV | Super Admin | Click "Export CSV" | Downloads `dictionary-2026-03-11.csv` with UTF-8 BOM, one column per active locale |
| H-14 | Import preview | Super Admin | Upload CSV file | Preview: "500 rows, 12 to update, 3 new keys, 0 errors" |
| H-15 | Commit import | Super Admin | Review preview, click "Confirm Import" | Translations upserted, snapshot created, cache invalidated, toast "Import complete" |

### Alternative Scenarios

| # | Scenario | Trigger | Expected Result |
|---|----------|---------|-----------------|
| A-04 | Import with errors | CSV has 2 rows with missing required columns | Preview shows: "498 valid, 2 errors" with error details. User can proceed (skips errors) or cancel. |
| A-05 | Import creates new keys | CSV contains technical_name not in dictionary | Preview shows: "3 new keys will be created" — new DictionaryEntry records created on commit |
| A-06 | Re-upload after preview | Admin uploads different file | Previous preview discarded, new preview generated |

### Edge Cases

| # | Scenario | Expected Result | Severity |
|---|----------|-----------------|----------|
| E-13 | Empty CSV file | 400: "CSV file is empty." | HIGH |
| E-14 | CSV with wrong encoding (not UTF-8) | Parser attempts detection, shows warning if non-UTF-8 characters found | MEDIUM |
| E-15 | Rate limit exceeded (VR-06) | 429: "Import rate limit exceeded. Maximum 5 imports per hour." with Retry-After header | HIGH |
| E-16 | Preview token expired (30 min) | 410: "Import preview expired or not found. Please re-upload the file." | HIGH |
| E-17 | CSV injection (`=CMD(...)`) | Cell values starting with `=`, `+`, `-`, `@` sanitized (prefixed with `'`) | CRITICAL |
| E-18 | File >10MB | 413: "File size exceeds 10 MB limit" | HIGH |
| E-19 | CSV with 50,000+ rows | Performance: pagination applied, preview caps at first 1000 rows | MEDIUM |
| E-20 | Concurrent imports by 2 admins | Rate limit per user; both can import if within their individual limits | LOW |

### Action Button Consequences

| Button | Action | Reversible? | Confirmation? | Side Effects |
|--------|--------|-------------|---------------|--------------|
| Export CSV | Downloads current dictionary | N/A (read-only) | No | None |
| Choose CSV | Opens file picker, triggers preview | Yes (cancel preview) | No | Preview stored in Valkey for 30 min |
| Confirm Import | Applies CSV changes to dictionary | Yes (via rollback) | Yes | Pre-import snapshot created, cache invalidated |

---

## US-LM-04: Dictionary Rollback

### Happy Scenarios

| # | Scenario | Actor | Steps | Expected Result |
|---|----------|-------|-------|-----------------|
| H-16 | View version history | Super Admin | Navigate to Rollback tab | Paginated list of versions with number, type (EDIT/IMPORT/ROLLBACK), date, creator |
| H-17 | Rollback to previous version | Super Admin | Click "Rollback" on version #42 | Confirmation dialog → pre-rollback snapshot created → dictionary restored → cache invalidated |
| H-18 | View version detail | Super Admin | Click version number | Shows full snapshot_data (JSON) in read-only viewer |

### Edge Cases

| # | Scenario | Expected Result | Severity |
|---|----------|-----------------|----------|
| E-21 | Rollback to version with no snapshot_data | 400: "Version 42 has no snapshot data to restore." | HIGH |
| E-22 | Rollback while another admin is editing | Optimistic lock prevents conflicts; editing admin gets 409 on save | HIGH |
| E-23 | Rollback creates chain | Rollback to v42 creates v50 (snapshot), then v51 (restore). Chain is traceable. | MEDIUM |
| E-24 | Version retention limit (50) | Oldest versions auto-deleted by @Scheduled cleanup | LOW |

### Action Button Consequences

| Button | Action | Reversible? | Confirmation? | Side Effects |
|--------|--------|-------------|---------------|--------------|
| Rollback | Restores dictionary to target version | Yes (rollback the rollback) | Yes (confirmation dialog) | Pre-rollback snapshot created, all bundles invalidated |

---

## US-LM-05: User Language Selection

### Happy Scenarios

| # | Scenario | Actor | Steps | Expected Result |
|---|----------|-------|-------|-----------------|
| H-19 | Set language preference | End User | Click language switcher in header, select "Arabic" | UI switches to Arabic, RTL layout applied, preference persisted |
| H-20 | Language persists across sessions | End User | Sign out, sign back in | Language preference restored from database, UI renders in Arabic |
| H-21 | Auto-detect on first visit | Anonymous | Visit login page with browser set to French | Login page renders in French (if fr-FR is active), detect API called |

### Alternative Scenarios

| # | Scenario | Trigger | Expected Result |
|---|----------|---------|-----------------|
| A-07 | User's preferred locale deactivated | Admin deactivates de-DE while user has it | User's preference migrated to alternative locale on next request |
| A-08 | Browser language not supported | Accept-Language: "sw-KE" (Swahili) | Fallback to alternative locale (e.g., en-US) |
| A-09 | User clears preference | User selects "Auto-detect" | Preference source set to DETECTED, browser Accept-Language used |

### Edge Cases

| # | Scenario | Expected Result | Severity |
|---|----------|-----------------|----------|
| E-25 | Set inactive locale as preference | 422: "Selected locale is not active" | HIGH |
| E-26 | Concurrent preference updates | Last write wins (user_id is PK, upsert semantics) | LOW |
| E-27 | JWT missing sub claim | 401: "Authenticated JWT subject is required" | CRITICAL |
| E-28 | Bundle request for non-existent locale | 404: "No bundle available for locale: xyz" | MEDIUM |
| E-29 | Bundle cache stale after dictionary edit | Cache invalidated within 1 second; next request gets fresh bundle | HIGH |

---

## US-LM-06: i18n Runtime (Frontend)

### Happy Scenarios

| # | Scenario | Actor | Steps | Expected Result |
|---|----------|-------|-------|-----------------|
| H-22 | App bootstraps with locale | Any User | Open app | APP_INITIALIZER detects locale, fetches bundle, renders translated UI |
| H-23 | Switch language mid-session | End User | Click switcher, select "French" | All UI text updates without page reload; RTL/LTR adjusts if needed |
| H-24 | Date/number formatting | End User | View dates on any page | Dates formatted per locale (e.g., "11 Mar 2026" for en, "11 mars 2026" for fr) |
| H-25 | Translate pipe in templates | Developer | Use `{{ 'key' | translate }}` | Resolved to translated string from bundle |

### Edge Cases

| # | Scenario | Expected Result | Severity |
|---|----------|-----------------|----------|
| E-30 | Missing translation key | Pipe returns raw key: "admin.locale.tab.languages" (visible to user as fallback) | MEDIUM |
| E-31 | Backend unreachable during bootstrap | Fallback to en-US.json from assets/i18n/ (static file) | HIGH |
| E-32 | Bundle version changes during session | Periodic poll detects new version, re-fetches bundle silently | MEDIUM |
| E-33 | IndexedDB unavailable (private browsing) | Falls back to in-memory cache only; no offline support | LOW |
| E-34 | Parameterized translation with missing params | Placeholder shown: "Welcome, {name}" (placeholder not replaced) | MEDIUM |
| E-35 | RTL↔LTR switch mid-session | `document.documentElement.dir` and `lang` attributes updated; CSS logical properties adapt | HIGH |

---

## Agentic Translation Scenarios

### Happy Scenarios

| # | Scenario | Actor | Steps | Expected Result |
|---|----------|-------|-------|-----------------|
| H-26 | AI-translate missing keys | Super Admin | Select locale ar-AE, click "AI Translate Missing" | AI agent translates all missing keys from en-US to ar-AE using LLM |
| H-27 | Review AI translations | Super Admin | View AI-generated translations in review panel | Each translation shows: original, AI translation, confidence score, accept/reject buttons |
| H-28 | Bulk accept AI translations | Super Admin | Select all high-confidence (>90%) translations, click "Accept All" | Accepted translations saved to dictionary, snapshot created |

### Edge Cases

| # | Scenario | Expected Result | Severity |
|---|----------|-----------------|----------|
| E-36 | AI translation for unsupported language | Warning: "AI translation quality may be limited for Swahili" | MEDIUM |
| E-37 | AI API rate limit | 429: queued for retry, progress bar shows estimated wait | MEDIUM |
| E-38 | AI generates inappropriate translation | Human review catches it; reject button available | HIGH |
| E-39 | AI translation with wrong RTL direction | Validation: text direction check against locale's text_direction | HIGH |
| E-40 | AI service unavailable | Graceful degradation: "AI translation unavailable. Please translate manually." | MEDIUM |
| E-41 | AI translates ICU placeholders incorrectly | Validation: placeholder integrity check (all `{param}` tokens preserved) | HIGH |

---

## RBAC Edge Cases (Cross-Cutting)

| # | Scenario | Actor | Expected Result | Severity |
|---|----------|-------|-----------------|----------|
| R-01 | Tenant Admin tries to manage locales | ROLE_ADMIN | 403: Locale management requires ROLE_SUPER_ADMIN | HIGH |
| R-02 | End User tries to access dictionary | ROLE_USER | 403: Dictionary management requires admin role | HIGH |
| R-03 | Anonymous tries to set locale preference | Unauthenticated | 401: Authentication required | CRITICAL |
| R-04 | Anonymous accesses public bundle | Unauthenticated | 200: Bundle returned (login page rendering) | CRITICAL |
| R-05 | Token expired during dictionary edit | Any admin | 401 on save; unsaved changes preserved in dialog; re-auth prompt | HIGH |
| R-06 | Super Admin from tenant A accesses tenant B locales | Super Admin | Locales are GLOBAL — no tenant isolation needed; same locales for all tenants | MEDIUM |

---

## US-LM-07: Language Switcher (FR-08)

### Happy Scenarios

| # | Scenario | Actor | Steps | Expected Result |
|---|----------|-------|-------|-----------------|
| H-29 | Open language switcher (authenticated) | End User | Click language pill in shell header topnav | Dropdown opens with active locales, current locale has checkmark |
| H-30 | Select language from switcher | End User | Click "العربية" in dropdown | UI updates to Arabic, RTL flips, `PUT /api/v1/user/locale` persists preference |
| H-31 | Language switcher on login page | Anonymous | View login page | Language switcher appears below login form, centered, uses localStorage (no API call) |
| H-32 | Persist across sessions | End User | Switch to French, sign out, sign back in | UI renders in French (restored from DB preference) |

### Edge Cases

| # | Scenario | Expected Result | Severity |
|---|----------|-----------------|----------|
| E-42 | Only 1 active locale | Language switcher hidden (nothing to switch to) | LOW |
| E-43 | Switch RTL → LTR mid-session | `document.dir` changes from `rtl` to `ltr`; layout flips within 300ms | HIGH |
| E-44 | Switch language while dialog open | Dialog remains open; text inside updates | MEDIUM |
| E-45 | Language switcher on mobile (<768px) | Moves into hamburger menu as last item before Sign Out | MEDIUM |
| E-46 | Keyboard navigation of switcher | Enter/Space opens, Arrow keys navigate, Enter selects, Escape closes | HIGH |
| E-47 | Screen reader announces language change | `aria-live="polite"` region announces "Language changed to {name}" | MEDIUM |

---

## US-LM-08: Backend i18n Infrastructure (FR-09)

### Happy Scenarios

| # | Scenario | Actor | Steps | Expected Result |
|---|----------|-------|-------|-----------------|
| H-35 | MessageResolver resolves error code | System | Exception thrown with code `AUTH-E-010` + locale `ar-AE` | Returns Arabic message from `messages_ar.properties` |
| H-36 | Accept-Language header processing | End User | API request with `Accept-Language: fr-FR` | Error responses localized to French |
| H-37 | Feign locale propagation | System | auth-facade calls license-service | `Accept-Language` header copied to outgoing Feign request |
| H-38 | Fallback chain | System | Request for `sw-KE` (Swahili, no properties file) | Falls back to `en-US` default |

### Edge Cases

| # | Scenario | Expected Result | Severity |
|---|----------|-----------------|----------|
| E-48 | Missing error code in properties | MessageResolver returns raw code as fallback | MEDIUM |
| E-49 | Parameterized message `{0}` | MessageResolver substitutes `{0}` with arg: "License limit: 50" | HIGH |
| E-50 | Concurrent locale context | Thread-local `LocaleContextHolder` isolates per-request | HIGH |
| E-51 | No Accept-Language header | Defaults to `en-US` | LOW |

---

## US-LM-09: Translation Reflection Flow (FR-12, BR-13, BR-14)

### Happy Scenarios

| # | Scenario | Actor | Steps | Expected Result |
|---|----------|-------|-------|-----------------|
| H-39 | Admin sees change immediately | Super Admin | Edit translation "auth.login.welcome" and save | Same admin session shows updated text instantly (no 5-min wait) |
| H-40 | User sees change within 5 min | End User | Admin updates translation | User's TranslationService polls `/bundle/version`, detects mismatch, re-fetches bundle within 5 min |
| H-41 | Import reflection | Super Admin | Commit CSV import | Admin sees all imported translations immediately; other users within 5 min |
| H-42 | Rollback reflection | Super Admin | Rollback to version #42 | Admin sees rolled-back translations immediately; other users within 5 min |
| H-43 | Stale bundle detection | End User | Bundle version changes from v41 to v42 on server | TranslationService detects v42 > v41 on next poll, silently re-fetches |

### Edge Cases

| # | Scenario | Expected Result | Severity |
|---|----------|-----------------|----------|
| E-52 | Backend unreachable during poll | TranslationService uses last known bundle from IndexedDB; retries next cycle | HIGH |
| E-53 | Version endpoint returns same version | No re-fetch — bundle stays cached | LOW |
| E-54 | Rapid successive edits | Each edit increments version; poll picks up latest version on next cycle | MEDIUM |
| E-55 | Admin edits while user polls | No conflict — user gets latest version after admin's save invalidates cache | MEDIUM |
| E-56 | IndexedDB full or unavailable | Falls back to in-memory cache only; no persistence across page reloads | MEDIUM |

---

## US-LM-10: String Externalization Validation (FR-14)

### Happy Scenarios

| # | Scenario | Actor | Steps | Expected Result |
|---|----------|-------|-------|-----------------|
| H-44 | Zero hardcoded strings in templates | CI/CD | Run lint rule against all `.html` templates | 0 violations (all strings use `{{ 'key' \| translate }}` pipe) |
| H-45 | All keys in en-US.json | CI/CD | Compare dictionary keys vs `en-US.json` | All 652 frontend keys present; 0 missing |

---

## US-LM-11: Tenant Translation Overrides (FR-15, BR-15→BR-18)

### Happy Scenarios

| # | Scenario | Actor | Steps | Expected Result |
|---|----------|-------|-------|-----------------|
| H-46 | View tenant overrides | Tenant Admin | Navigate to Tenant Overrides sub-tab | Paginated table: key, global value, override value, locale, actions |
| H-47 | Create override | Tenant Admin | Click "Add Override", select key + locale, enter value | Override created; cache invalidated for `bundle:{tenantId}:{locale}` |
| H-48 | Edit existing override | Tenant Admin | Click edit on override row, change value | Override updated; struck-through global value shown as diff |
| H-49 | Delete override | Tenant Admin | Click delete on override row, confirm | Override removed; bundle reverts to global value for that key |
| H-50 | Import overrides CSV | Tenant Admin | Upload CSV with technical_name, locale_code, override_value | Overrides imported; count shown: "25 imported, 10 updated, 2 skipped" |
| H-51 | Export overrides CSV | Tenant Admin | Click "Export Overrides" | CSV downloaded with columns: technical_name, locale_code, global_value, override_value, override_source |
| H-52 | Bundle merges global + override | End User (tenant) | Fetch bundle with `X-Tenant-ID` header | Bundle contains global translations + tenant overrides merged (overrides win) |
| H-53 | Anonymous gets global only (BR-18) | Anonymous | Fetch bundle without `X-Tenant-ID` | Bundle contains only global translations — no tenant overrides |

### Alternative Scenarios

| # | Scenario | Trigger | Expected Result |
|---|----------|---------|-----------------|
| A-10 | Override same key in multiple locales | Tenant Admin creates en-US + ar-AE overrides for same key | Both overrides stored independently; each locale bundle gets correct override |
| A-11 | Delete override, global value restored | Tenant Admin deletes override for "menu.records" | Next bundle fetch returns global value "Records" instead of deleted override "Patient Records" |

### Edge Cases

| # | Scenario | Expected Result | Severity |
|---|----------|-----------------|----------|
| E-57 | Tenant A tries to read Tenant B's overrides (BR-16) | 403: Tenant ID mismatch — IDOR protection validates JWT tenant_id vs path | CRITICAL |
| E-58 | Override for non-existent dictionary key | 400: `LOC-E-010` — entry_id does not exist in dictionary_entries | HIGH |
| E-59 | Override for inactive locale | 400: `LOC-E-011` — locale_code is not an active locale | HIGH |
| E-60 | Global dictionary change invalidates tenant caches (BR-17) | Admin edits global "auth.login.welcome" → ALL tenant bundle caches for that locale are invalidated | HIGH |
| E-61 | Tenant override precedence (BR-15) | Global: "Records" + Tenant override: "Patient Records" → bundle returns "Patient Records" for tenant, "Records" for others | CRITICAL |
| E-62 | Concurrent tenant + global edit | Tenant admin edits override while super admin edits global → both changes reflected correctly | MEDIUM |
| E-63 | CSV injection in override import | Values starting with `=`, `+`, `-`, `@` rejected with `LOC-E-014` | HIGH |
| E-64 | Override for key that tenant already overrides (upsert) | Existing override updated; no duplicate created | MEDIUM |
| E-65 | Large number of overrides (500+) | Paginated response; bundle generation merges efficiently | LOW |
| E-66 | Soft-disable override (is_active=false) | Override excluded from bundle merge but not deleted | MEDIUM |

---

## NFR Performance Scenarios

| # | NFR | Scenario | Expected Result | Severity |
|---|-----|----------|-----------------|----------|
| P-01 | NFR-01 | Bundle fetch (500 keys, Valkey-cached) | Response < 200ms (p95) | HIGH |
| P-02 | NFR-02 | Language switch (fetch bundle + re-render 50 components) | Total time < 500ms | HIGH |
| P-03 | NFR-01 | Bundle fetch (1000+ keys, cold cache, DB query) | Response < 500ms (p95) | MEDIUM |
