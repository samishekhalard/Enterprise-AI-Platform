# R06 Localization -- Complete User Story Inventory

**Document ID:** INV-LM-001
**Version:** 1.0.0
**Date:** 2026-03-12
**Author:** BA Agent (BA-PRINCIPLES.md v1.1.0)
**Sources:** 00 (Benchmark Report v3.0), 01 (PRD v4.0), 03 (LLD Corrections v2.0), 04 (Data Model v3.0), 05 (UI/UX Spec v4.0), 06 (API Contract v2.0), 07 (SA Conditions v3.0), 11 (Implementation Backlog v3.0), 15 (Test Strategy v1.0), 16 (Playwright Test Plan v1.0), Backlog 00 (Overview v4.0), Backlog 03 (i18n Infrastructure), Backlog 04 (Sprint Plan v1.0), Backlog 05 (Scenario Matrix v2.0)

---

## Summary Statistics

| Metric | Count |
|--------|-------|
| Total Epics | 15 (E1 through E15) |
| Total User Stories | 85 (US-LM-001 through US-LM-085) |
| Total Story Points | 209 |
| Total Acceptance Criteria | 233 |
| Total Business Rules | 18 (BR-01 through BR-18) |
| Total Error Codes | 17 (LOC-E-001 through LOC-E-014 + service-specific) |
| Total Warning Codes | 4 (LOC-W-xxx) |
| Total Success Codes | 12 (LOC-S-xxx) |
| Total Confirmation Dialogs | 5 (CD-LM-01 through CD-LM-05) |
| Total Screens | 9 (SCR-LM-LANG, SCR-LM-DICT, SCR-LM-IMPORT, SCR-LM-ROLL, SCR-LM-AI, SCR-LM-OVERRIDE, SCR-LM-SWITCHER-AUTH, SCR-LM-SWITCHER-ANON, SCR-LM-FORMAT) |
| Personas | 4 Primary (Super Admin, Tenant Admin, End User, Anonymous/Visitor) + 7 Secondary |
| Feature Requirements | 15 (FR-01 through FR-15; FR-13 deferred) |
| Non-Functional Requirements | 10 (NFR-01 through NFR-10) |
| Happy Path Scenarios | 53 |
| Alternative Scenarios | 11 |
| Edge Case Scenarios | 66 |
| RBAC Scenarios | 6 |
| Performance Scenarios | 3 |

---

## Persona 1: Super Admin (Sam Martinez) [PER-UX-001, ROLE_SUPER_ADMIN]

Role: Whole-application custodian with cross-tenant visibility. Manages system languages, global translation dictionary, import/export, rollback, format configuration, agentic translation, and tenant override visibility.

Primary Epics: E1, E2, E3, E4, E5, E7, E12, E13, E14

---

### Screen: SCR-LM-LANG -- Languages Tab (FR-01) [IMPLEMENTED]

| Story ID | User Story | Acceptance Criteria | Confirmation Dialogs | Error Messages | Edge Cases |
|----------|-----------|-------------------|---------------------|---------------|------------|
| US-LM-001 | As a Super Admin, I want to view the locale catalog so that I can see all system languages and their status. | **AC1 (Main):** Given I am a Super Admin on the Languages tab, When the page loads, Then I see a paginated table with 10 locales showing flag emoji, code, name, status toggle, alternative radio, and coverage bar. **AC2:** Given 10 locales are seeded, When I view the table, Then pagination shows correct total (10 items). | None | None | E-05: Locale with max-length code (10 chars) renders correctly without truncation. |
| US-LM-002 | As a Super Admin, I want to search locales so that I can find a specific language quickly. | **AC1 (Main):** Given I am on the Languages tab with 10 locales, When I type "ar" in the search field, Then the table filters to show only ar-AE (Arabic). **AC2:** Given I search for "xyz", When no results match, Then I see empty state: "No locales found matching 'xyz'". | None | None | A-03: Empty search results show empty state message with clear button. |
| US-LM-003 | As a Super Admin, I want to activate a locale so that it becomes available for users. | **AC1 (Main):** Given fr-FR is inactive, When I click the toggle switch for fr-FR, Then fr-FR becomes active, `activated_at` is updated, and a toast shows "Locale activated" (LOC-S-001). **AC2:** Given fr-FR was previously deactivated and reactivated, When I toggle it on, Then no user migration occurs (A-02). | None | None | None |
| US-LM-004 | As a Super Admin, I want to deactivate a locale so that it is no longer available for new user selection. | **AC1 (Main):** Given fr-FR is active and not the alternative and at least 2 locales are active, When I click the toggle switch for fr-FR, Then fr-FR is deactivated and a toast shows "Locale deactivated" (LOC-S-002). **AC2:** Given de-DE is active and 5 users have it set, When I deactivate de-DE, Then users are migrated to the alternative locale and the response shows `migrated_users: 5` (BR-04). | CD-LM-01: "Deactivate locale" -- "{n} users will be migrated to {alternative}. Proceed?" Buttons: "Deactivate" / "Cancel" (shown only when users are affected) | LOC-E-001: "Cannot deactivate alternative locale. Change the alternative locale first." (409). LOC-E-002: "Cannot deactivate the last active locale." (409). | E-01: Deactivate alternative locale returns 409 (BR-01). E-02: Deactivate last active locale returns 409 (BR-02). E-04: Concurrent deactivation -- optimistic lock prevents leaving 0 active. |
| US-LM-005 | As a Super Admin, I want to set a locale as the alternative (fallback) so that users without an explicit preference get this locale. | **AC1 (Main):** Given ar-AE is active, When I select the ar-AE radio button, Then ar-AE becomes the alternative locale and the previous alternative is unset. | None | E-03: 422 "Locale must be active to be set as alternative" if inactive locale selected (BR-03). | None |
| US-LM-006 | As a Super Admin, I want to view and update the format configuration for a locale so that date, number, and currency formatting is correct for that region. | **AC1 (Main):** Given ar-AE has a format config, When I click the format config row for ar-AE, Then an accordion expands below the row showing calendar system, numeral system, currency code, date format, and time format fields. **AC2:** Given I change calendar to "hijri" and save, Then the config is persisted and a toast shows "Format config updated" (LOC-S-003). | None | None | None |

### Screen: SCR-LM-LANG -- Loading, Empty, Error States

| Story ID | User Story | Acceptance Criteria | Confirmation Dialogs | Error Messages | Edge Cases |
|----------|-----------|-------------------|---------------------|---------------|------------|
| US-LM-007 | As a Super Admin, I want to see appropriate loading, empty, and error states on the Languages tab. | **AC1 (Loading):** Given the Languages tab is loading, When data is being fetched, Then 5 skeleton rows with circle placeholder and 2 text lines are shown. **AC2 (Empty):** Given a search with no results, When the table is empty, Then I see "No locales found matching '{query}'" with a clear button. **AC3 (Error):** Given the API returns an error, When the table fails to load, Then an error banner "Failed to load locales. Please try again." with a Retry button is shown. | None | LOC-E-050: API error (persistent toast). | Edge: Network timeout (504/503) shows persistent toast, not auto-dismissed. |

---

### Screen: SCR-LM-DICT -- Dictionary Tab (FR-02) [IMPLEMENTED]

| Story ID | User Story | Acceptance Criteria | Confirmation Dialogs | Error Messages | Edge Cases |
|----------|-----------|-------------------|---------------------|---------------|------------|
| US-LM-008 | As a Super Admin, I want to browse the translation dictionary so that I can see all translation keys and their values per locale. | **AC1 (Main):** Given I navigate to the Dictionary tab, When the page loads, Then I see a paginated table with translation keys and dynamically generated columns per active locale. **AC2:** Given the dictionary has 500 entries, When I view the table, Then pagination shows 10 entries per page (default) with correct total. | None | None | None |
| US-LM-009 | As a Super Admin, I want to search the dictionary so that I can find specific translation keys. | **AC1 (Main):** Given I am on the Dictionary tab, When I type "login" in the search field with 300ms debounce, Then the table filters to keys matching "login" in `technical_name` or `module`. **AC2:** Given matched text, Then it is highlighted with `--adm-primary` underline. **AC3:** Given no results, Then I see "No entries matching '{query}'" with clear button. | None | None | Edge: Search preserved when switching tabs. |
| US-LM-010 | As a Super Admin, I want to edit a translation value so that I can provide or correct translations for any locale. | **AC1 (Main):** Given I click the edit button on entry "auth.login.welcome", When the edit dialog opens, Then I see text inputs per active locale with RTL `dir="rtl"` for RTL locales. **AC2:** Given I modify the ar-AE value and click Save, Then the value is persisted with `status=ACTIVE` immediately (BR-11), the dialog closes, and a toast shows "Translations saved" (LOC-S-004). **AC3:** Given the entry has `translator_notes`, Then the notes are shown as a read-only hint above each input. **AC4:** Given the entry has `max_length`, Then a character counter shows `{current}/{max_length}` below each textarea. | None | E-09: Translation value exceeds 5000 characters returns validation error. E-10: Concurrent edit -- optimistic lock conflict shows warning (LOC-W-001). | E-06: Clearing a value removes the translation; coverage decreases. E-07: HTML tags sanitized on save -- `<script>` stripped (SEC-05). E-08: ICU placeholders saved as-is. E-11: RTL text in LTR context renders with `dir="rtl"` on input. E-12: Unicode emoji stored and rendered correctly (UTF-8). |
| US-LM-011 | As a Super Admin, I want to view translation coverage per locale so that I know which locales need more translations. | **AC1 (Main):** Given I click the coverage report for ar-AE, When the report loads, Then I see "450/500 keys translated (90%)" and a list of 50 missing keys. **AC2:** Given the coverage bar per locale, Then >80% is green, 40-80% is amber, <40% is red. | None | None | None |

---

### Screen: SCR-LM-IMPORT -- Import/Export Tab (FR-03) [IMPLEMENTED]

| Story ID | User Story | Acceptance Criteria | Confirmation Dialogs | Error Messages | Edge Cases |
|----------|-----------|-------------------|---------------------|---------------|------------|
| US-LM-012 | As a Super Admin, I want to export the dictionary as CSV so that I can edit translations externally. | **AC1 (Main):** Given I am on the Import/Export tab, When I click "Export CSV", Then a CSV file is downloaded with UTF-8 BOM encoding, one column per active locale, named `dictionary-{date}.csv` (LOC-S-005). | None | None | None |
| US-LM-013 | As a Super Admin, I want to import a CSV file with translation updates so that I can bulk-update translations. | **AC1 (Main):** Given I upload a valid CSV file, When the preview is generated, Then I see: total rows, rows to update, new keys, errors, and a 30-minute countdown timer (BR-05). **AC2:** Given I review the preview and click "Confirm Import", Then translations are upserted, a snapshot is created (BR-06), cache is invalidated, and a toast shows "Import complete" (LOC-S-006). **AC3:** Given the CSV has 2 rows with missing columns, When the preview is shown, Then I see "498 valid, 2 errors" with error details. I can proceed (skipping errors) or cancel (A-04). **AC4:** Given a CSV with new keys not in the dictionary, Then the preview shows "3 new keys will be created" and new `DictionaryEntry` records are created on commit (A-05). | CD-LM-02: "Confirm Import" -- "Import {n} translations? This creates a new version snapshot." Buttons: "Confirm Import" / "Cancel" | LOC-E-003: "CSV file is empty." (400). LOC-E-004: "File size exceeds 10 MB limit" (413). LOC-E-005: "Import rate limit exceeded. Maximum 5 imports per hour." (429) with Retry-After header. | E-13: Empty CSV file returns 400. E-14: CSV with wrong encoding shows warning. E-15: Rate limit exceeded returns 429 (NFR-10). E-16: Preview token expired after 30 minutes returns 410 "Import preview expired or not found". E-17: CSV injection (`=CMD(...)`) -- values starting with `=`, `+`, `-`, `@` sanitized (NFR-04, SEC-04). E-18: File >10MB returns 413 (NFR-05). E-19: CSV with 50,000+ rows -- preview caps at first 1000 rows. E-20: Concurrent imports by 2 admins -- per-user rate limit. A-06: Re-uploading discards previous preview. |

---

### Screen: SCR-LM-ROLL -- Rollback Tab (FR-04) [IMPLEMENTED]

| Story ID | User Story | Acceptance Criteria | Confirmation Dialogs | Error Messages | Edge Cases |
|----------|-----------|-------------------|---------------------|---------------|------------|
| US-LM-014 | As a Super Admin, I want to view version history so that I can see all dictionary change events. | **AC1 (Main):** Given I navigate to the Rollback tab, When the page loads, Then I see a paginated list of versions with version number, type badge (EDIT/IMPORT/ROLLBACK), summary, date, and creator. **AC2:** Given the latest version, Then it shows a "CURRENT" badge in green with no Rollback button. | None | None | E-24: Version retention limited to 50 (NFR-08) -- oldest auto-deleted by `@Scheduled` cleanup. |
| US-LM-015 | As a Super Admin, I want to rollback the dictionary to a previous version so that I can undo accidental changes. | **AC1 (Main):** Given I click "Rollback" on version #42, When the confirmation dialog appears and I click "Rollback", Then a pre-rollback snapshot is created (BR-07), the dictionary is restored to version #42, cache is invalidated, and a toast shows "Dictionary rolled back to version #42" (LOC-S-007). **AC2:** Given I click "Cancel" in the dialog, Then no changes are made. | CD-LM-03: "Rollback Confirmation" -- "Rollback to version #{n}? This will create a pre-rollback snapshot and restore the dictionary to this state." Buttons: "Rollback" / "Cancel" | E-21: 400 "Version {n} has no snapshot data to restore." | E-22: Rollback while another admin is editing -- optimistic lock prevents conflicts. E-23: Rollback creates chain (v50 snapshot, v51 restore) -- traceable. |
| US-LM-016 | As a Super Admin, I want to view the detail of a specific version so that I can see its full snapshot data. | **AC1 (Main):** Given I click a version number in the history table, When the detail view loads, Then I see the full `snapshot_data` (JSON) in a read-only viewer. | None | None | None |

---

### Screen: SCR-LM-AI -- Agentic Translation Tab (FR-10, FR-11 Scenario 3) [PLANNED]

| Story ID | User Story | Acceptance Criteria | Confirmation Dialogs | Error Messages | Edge Cases |
|----------|-----------|-------------------|---------------------|---------------|------------|
| US-LM-017 | As a Super Admin, I want to request AI translation for missing keys so that I can quickly populate translations for a locale. | **AC1 (Main):** Given I am on the AI Translate tab and select target locale ar-AE, When I click "Translate Missing", Then the system sends missing keys to the AI service and returns results classified as auto-applied (unambiguous, ACTIVE) and pending review (ambiguous, PENDING_REVIEW). **AC2:** Given 45 missing keys, When the AI returns results, Then I see a summary: "38 translations auto-applied" and a HITL review table with 7 ambiguous terms. **AC3:** Given auto-applied translations, Then they are immediately included in the live bundle with `status=ACTIVE` (BR-11). | None | E-36: AI translation for unsupported language shows warning "AI translation quality may be limited for {language}". E-37: AI API rate limit returns 429 with retry estimate. E-40: AI service unavailable shows "AI translation unavailable. Please translate manually." | E-38: AI generates inappropriate translation -- admin can reject. E-39: AI translation with wrong RTL direction -- validation checks text direction against locale's `text_direction`. E-41: AI translates placeholders incorrectly -- validation ensures all `{param}` tokens preserved (BR-10). |
| US-LM-018 | As a Super Admin, I want to review AI-flagged ambiguous translations so that only correct translations go live. | **AC1 (Main):** Given the HITL review table shows 7 ambiguous terms, When I view each row, Then I see: key, source value (en-US), AI translation, ambiguity reason (e.g., "Multiple meanings: financial institution vs. river bank"), and approve/reject buttons. **AC2:** Given I approve 5 terms and reject 2, When I click the action buttons, Then approved terms get `status=ACTIVE` (included in bundle), rejected terms get `status=REJECTED` (excluded), a snapshot is created, and a toast shows "5 approved, 2 rejected" (LOC-S-008). **AC3:** Given rejected terms, Then the admin must re-translate them manually (BR-12). | None | None | None |
| US-LM-019 | As a Super Admin, I want to bulk-approve all pending HITL review items so that I can quickly finalize translations. | **AC1 (Main):** Given the HITL review table has 7 pending items, When I click "Approve All Pending", Then all 7 items get `status=ACTIVE` and are included in the bundle. | None | None | None |

---

### Screen: SCR-LM-FORMAT -- Format Config Accordion (FR-01 sub-feature) [IMPLEMENTED]

| Story ID | User Story | Acceptance Criteria | Confirmation Dialogs | Error Messages | Edge Cases |
|----------|-----------|-------------------|---------------------|---------------|------------|
| US-LM-020 | As a Super Admin, I want to configure locale-specific formatting so that dates, numbers, and currencies display correctly per region. | **AC1 (Main):** Given I expand the format config for ar-AE, When I see the form fields, Then I can set: calendar system (gregorian/hijri), numeral system (western/eastern_arabic), currency code (AED), date format (dd/MM/yyyy), time format (HH:mm). **AC2:** Given I save the config, Then it is persisted in `locale_format_configs` and a toast shows "Format config updated" (LOC-S-003). | None | None | None |

---

### Backend i18n Infrastructure Stories (FR-09, E1) [PLANNED]

| Story ID | User Story | Acceptance Criteria | Confirmation Dialogs | Error Messages | Edge Cases |
|----------|-----------|-------------------|---------------------|---------------|------------|
| US-LM-021 | As a system, I want a MessageResolver component so that backend error messages can be returned in the user's locale. | **AC1 (Main):** Given an exception with code `AUTH-E-010` and locale `ar-AE`, When MessageResolver resolves the code, Then the Arabic message from `messages_ar.properties` is returned. **AC2:** Given a request for locale `sw-KE` with no properties file, When resolution fails, Then it falls back to `en-US` default (H-38). | None | E-48: Missing error code in properties -- returns raw code as fallback. | E-49: Parameterized message `{0}` -- substitutes args correctly. E-50: Concurrent locale context -- `LocaleContextHolder` is thread-local. E-51: No Accept-Language header -- defaults to `en-US`. |
| US-LM-022 | As a system, I want a LocaleContextFilter so that every incoming request has its locale set from the Accept-Language header. | **AC1 (Main):** Given an API request with `Accept-Language: fr-FR`, When the filter executes, Then `LocaleContextHolder` is set to `fr-FR` for the request thread. | None | None | None |
| US-LM-023 | As a system, I want a LocalePropagationInterceptor so that inter-service Feign calls forward the user's locale. | **AC1 (Main):** Given auth-facade calls license-service, When the Feign interceptor executes, Then the `Accept-Language` header from the current thread is copied to the outgoing request. | None | None | None |
| US-LM-024 | As a system, I want error code constants classes per service so that error codes follow a consistent convention. | **AC1 (Main):** Given the localization-service, When error codes are defined, Then they follow `{SERVICE}-{TYPE}-{SEQ}` convention (e.g., `LOC-E-001`, `AUTH-E-010`). | None | None | None |
| US-LM-025 | As a system, I want `messages.properties` and `messages_ar.properties` files for the localization-service so that error messages are localizable. | **AC1 (Main):** Given the localization-service, When error messages are configured, Then both English and Arabic property files exist with all LOC-E-xxx codes mapped to translated messages. | None | None | None |

---

### Schema Extensions Stories (E12) [PLANNED]

| Story ID | User Story | Acceptance Criteria | Confirmation Dialogs | Error Messages | Edge Cases |
|----------|-----------|-------------------|---------------------|---------------|------------|
| US-LM-026 | As a system, I want `translator_notes`, `max_length`, and `tags` columns added to `dictionary_entries` so that admins have better context when translating. | **AC1 (Main):** Given migration V2 runs, When the schema is updated, Then `dictionary_entries` has `translator_notes TEXT`, `max_length INTEGER`, and `tags VARCHAR[]` columns. | None | None | None |
| US-LM-027 | As a system, I want a `status` column on `dictionary_translations` so that translations can be classified as ACTIVE, PENDING_REVIEW, or REJECTED. | **AC1 (Main):** Given migration V2 runs, When the schema is updated, Then `dictionary_translations` has `status VARCHAR(20) DEFAULT 'ACTIVE'`. **AC2:** Given existing rows, When migration runs, Then all existing rows are set to `status = 'ACTIVE'`. | None | None | None |
| US-LM-028 | As a system, I want bundle generation to filter by `status = 'ACTIVE'` so that only approved translations appear in bundles. | **AC1 (Main):** Given the bundle generation query, When bundles are assembled, Then only translations with `status = 'ACTIVE'` are included; `PENDING_REVIEW` and `REJECTED` are excluded. | None | None | None |

---

### PrimeNG Text Expansion Fixes (E13) [PLANNED]

| Story ID | User Story | Acceptance Criteria | Confirmation Dialogs | Error Messages | Edge Cases |
|----------|-----------|-------------------|---------------------|---------------|------------|
| US-LM-029 | As a Super Admin, I want UI components to accommodate translated text without overflow so that the interface works in all languages. | **AC1:** Given the search input, When rendered with German text "Sprachen suchen...", Then it uses `min-width: 280px; width: 100%; max-width: 400px` and does not clip. **AC2:** Given translation cells, When rendered with French/German text, Then `max-width: 300px` or `resizableColumns` is used. **AC3:** Given the edit dialog with title "Ubersetzungen bearbeiten", Then the dialog uses `min-width: 480px; max-width: 90vw`. **AC4:** Given the brand island with language switcher, Then it uses `min-width: 460px; width: auto; max-width: 100%`. **AC5:** Given the table container, Then horizontal scrolling is enabled via `scrollable="true"`. | None | None | None |
| US-LM-030 | As a Super Admin, I want PrimeNG component labels to be localized so that paginator, file upload, and confirm dialog labels display in the user's language. | **AC1 (Main):** Given PrimeNG locale configuration, When `providePrimeNG({ translation: { ... } })` is configured, Then paginator labels ("Showing 1 to 10 of 50"), file upload ("Choose File"), and confirm dialog buttons use translated strings from the bundle. | None | None | None |
| US-LM-031 | As a Super Admin, I want toast and dialog components to handle long translated messages without clipping. | **AC1 (Main):** Given `p-toast` and `p-dialog` components, When long German/Arabic messages are displayed, Then `max-width: 90vw` prevents clipping on all viewports. | None | None | None |

---

### Localization Service Fixes (E3) [PLANNED]

| Story ID | User Story | Acceptance Criteria | Confirmation Dialogs | Error Messages | Edge Cases |
|----------|-----------|-------------------|---------------------|---------------|------------|
| US-LM-032 | As a system, I want the gateway route for user locale to use an exact path match so that unintended URLs are not routed. | **AC1 (Main):** Given the gateway route for `/api/v1/user/locale`, When updated, Then the path predicate uses exact match `/api/v1/user/locale` instead of wildcard `/api/v1/user/locale**` (SA condition GW-03). | None | None | None |
| US-LM-033 | As a system, I want automatic version retention cleanup so that old dictionary versions beyond 50 are deleted. | **AC1 (Main):** Given a `@Scheduled` cleanup task, When versions exceed 50, Then the oldest versions beyond the 50th (ordered by `version_number DESC`) are deleted (NFR-08, SA condition INF-01). | None | None | None |
| US-LM-034 | As a system, I want CSV injection validation and file size limits on import so that the system is secure. | **AC1 (Main):** Given a CSV import, When cell values start with `=`, `+`, `-`, or `@`, Then they are sanitized by prefixing with `'` (NFR-04, SA condition SEC-04). **AC2:** Given a file upload, When the file exceeds 10MB, Then it is rejected with LOC-E-004 (NFR-05). | None | LOC-E-003: Empty CSV. LOC-E-004: File exceeds 10MB. LOC-E-014: CSV injection detected. | None |

---

### String Externalization Stories (FR-14, E4, E8) [PLANNED]

| Story ID | User Story | Acceptance Criteria | Confirmation Dialogs | Error Messages | Edge Cases |
|----------|-----------|-------------------|---------------------|---------------|------------|
| US-LM-035 | As a system, I want all P1 login and auth page strings externalized so that the login flow is fully translatable. | **AC1 (Main):** Given ~25 hardcoded strings in login.page.html/ts, password-reset-request/confirm pages, When externalized, Then all strings use `{{ 'key' \| translate }}` pipe with keys like `auth.login.welcome`, `auth.login.sign_in`, etc. | None | None | None |
| US-LM-036 | As a system, I want all P2 shell layout and error page strings externalized so that navigation and error pages are translatable. | **AC1 (Main):** Given ~15 hardcoded strings in shell-layout, access-denied, session-expired, tenant-not-found pages, When externalized, Then all strings use translate pipe. | None | None | None |
| US-LM-037 | As a system, I want all P3 administration page chrome strings externalized so that the admin navigation is translatable. | **AC1 (Main):** Given ~20 hardcoded strings in administration.page.html, When externalized, Then all strings use translate pipe with keys like `admin.title`, `admin.notifications`, etc. | None | None | None |
| US-LM-038 | As a system, I want all P4 Master Locale section strings externalized so that the localization admin UI itself is translatable. | **AC1 (Main):** Given ~40 hardcoded strings in the master-locale-section component, When externalized, Then all strings use translate pipe. | None | None | None |
| US-LM-039 | As a system, I want all P5-P10 remaining frontend strings externalized so that the entire application is translatable. | **AC1 (Main):** Given ~205 remaining strings in license manager, tenant manager, master definitions, master auth, about page, and TS error messages, When externalized, Then 0 hardcoded English strings remain in templates. **AC2:** Given CI/CD lint rule, When run against all `.html` templates, Then 0 violations detected (H-44). **AC3:** Given en-US.json, When compared to dictionary keys, Then all 652 frontend keys are present (H-45). | None | None | None |

---

### Backend Message Migration Stories (E5, E9) [PLANNED]

| Story ID | User Story | Acceptance Criteria | Confirmation Dialogs | Error Messages | Edge Cases |
|----------|-----------|-------------------|---------------------|---------------|------------|
| US-LM-040 | As a system, I want localization-service error messages migrated to properties files so that API errors are localizable. | **AC1 (Main):** Given 11 hardcoded strings in localization-service, When migrated to `messages.properties`, Then all error messages use `MessageResolver.resolve()` with error codes (LOC-E-xxx). | None | None | None |
| US-LM-041 | As a system, I want auth-facade error messages migrated to properties files so that auth errors are localizable. | **AC1 (Main):** Given 38 hardcoded strings in auth-facade (34 exceptions + 4 validations), When migrated, Then all use `MessageResolver.resolve()` with codes AUTH-E-xxx and AUTH-V-xxx. | None | None | None |
| US-LM-042 | As a system, I want license-service error messages migrated to properties files. | **AC1 (Main):** Given 31 hardcoded strings (23 exceptions + 8 validations), When migrated, Then all use codes LIC-E-xxx and LIC-V-xxx. | None | None | None |
| US-LM-043 | As a system, I want tenant-service error messages migrated to properties files. | **AC1 (Main):** Given ~10 hardcoded strings in tenant-service, When migrated, Then all use codes TEN-E-xxx. | None | None | None |
| US-LM-044 | As a system, I want remaining services (notification, user, ai, definition) error messages migrated. | **AC1 (Main):** Given 52 remaining strings across 4 services (notification: 7, user: 3, ai: 32, definition+common: 23), When migrated, Then all use service-specific error codes. | None | None | None |

---

### Documentation Stories (E11) [IN-PROGRESS]

| Story ID | User Story | Acceptance Criteria | Confirmation Dialogs | Error Messages | Edge Cases |
|----------|-----------|-------------------|---------------------|---------------|------------|
| US-LM-045 | As a stakeholder, I want API contract documentation (openapi.yaml) generated from controller annotations so that API consumers have a machine-readable specification. | **AC1 (Main):** Given the localization-service controllers, When documentation is generated, Then an OpenAPI 3.1 spec exists with all 27 endpoints (SA condition OAS-01). | None | None | None |

---

## Persona 2: Tenant Admin (Fiona Shaw) [PER-UX-003, ROLE_ADMIN]

Role: Manages translations for her subsidiary. Can edit translations manually, export/import dictionary, review AI-flagged ambiguous terms, and manage tenant-specific translation overrides.

Primary Epics: E7, E15

---

### Screen: SCR-LM-OVERRIDE -- Tenant Overrides Sub-Tab (FR-15) [PLANNED]

| Story ID | User Story | Acceptance Criteria | Confirmation Dialogs | Error Messages | Edge Cases |
|----------|-----------|-------------------|---------------------|---------------|------------|
| US-LM-046 | As a Tenant Admin, I want to view my tenant's translation overrides so that I can see which translations differ from the global defaults. | **AC1 (Main):** Given I navigate to the Tenant Overrides sub-tab, When the page loads, Then I see a paginated table with columns: key (`technical_name`), global value (struck-through), override value (highlighted), locale, source (MANUAL/IMPORTED), and actions (edit/delete). **AC2:** Given no overrides exist, Then I see empty state: "No overrides for this tenant. Global translations are used for all keys." with "Add Override" button. | None | 403: JWT `tenant_id` does not match path `{tenantId}` (LOC-E-012 -- IDOR protection). | E-65: Large number of overrides (500+) -- paginated response. |
| US-LM-047 | As a Tenant Admin, I want to create a translation override so that my tenant uses custom terminology. | **AC1 (Main):** Given I click "Add Override", When the dialog opens, Then I can select a key (autocomplete from `dictionary_entries`), select a locale, and enter an override value. **AC2:** Given I submit the override, When it is saved, Then the cache for `bundle:{tenantId}:{locale}` is invalidated and a toast shows "Override created" (LOC-S-009). **AC3:** Given the override already exists for this key+locale, Then it is upserted (updated, not duplicated) (E-64). | None | LOC-E-010: `entry_id` does not exist in `dictionary_entries` (400). LOC-E-011: `locale_code` is not an active locale (400). LOC-E-012: Tenant ID mismatch -- IDOR protection (403). | E-58: Override for non-existent dictionary key returns 400. E-59: Override for inactive locale returns 400. A-10: Override same key in multiple locales stored independently. |
| US-LM-048 | As a Tenant Admin, I want to edit an existing override so that I can update custom terminology. | **AC1 (Main):** Given I click edit on an override row, When the dialog opens, Then I see the current override value with the global value shown as struck-through diff. **AC2:** Given I save the edit, Then the cache is invalidated and the table refreshes. | None | None | None |
| US-LM-049 | As a Tenant Admin, I want to delete a translation override so that the global value is restored for that key. | **AC1 (Main):** Given I click delete on an override row and confirm, When the deletion completes, Then the override is removed, the bundle reverts to the global value for that key, and a toast shows "Override removed" (LOC-S-010). | CD-LM-04: "Delete Override" -- "Remove override for '{key}'? The global value will be used instead." Buttons: "Remove" / "Cancel" | LOC-E-013: Override not found (404). LOC-E-012: Tenant ID mismatch (403). | A-11: After deletion, bundle returns global value. E-66: Soft-disable override (`is_active=false`) excludes from bundle merge without deleting. |
| US-LM-050 | As a Tenant Admin, I want to import translation overrides from CSV so that I can bulk-update tenant terminology. | **AC1 (Main):** Given I upload a CSV with columns `technical_name`, `locale_code`, `override_value`, When the import completes, Then I see a summary: "25 imported, 10 updated, 2 skipped" (LOC-S-011). | None | LOC-E-003: Empty CSV (400). LOC-E-014: CSV injection detected (400). LOC-E-004: File exceeds 10MB (413). LOC-E-005: Rate limit exceeded (429). | E-63: CSV injection in override import -- values starting with `=`, `+`, `-`, `@` rejected. |
| US-LM-051 | As a Tenant Admin, I want to export my tenant's overrides as CSV so that I can share or back up custom terminology. | **AC1 (Main):** Given I click "Export Overrides", When the export completes, Then a CSV is downloaded with columns: `technical_name`, `locale_code`, `global_value`, `override_value`, `override_source`, `is_active`. | None | None | None |
| US-LM-052 | As a Tenant Admin, I want the translation bundle for my tenant to merge global translations with tenant overrides so that users see our custom terminology. | **AC1 (Main):** Given a bundle request with `X-Tenant-ID` header, When the bundle is assembled, Then global translations are loaded first, then tenant overrides replace matching keys (BR-15). **AC2:** Given a global translation "Records" and a tenant override "Patient Records" for the same key, Then the bundle returns "Patient Records" for this tenant (E-61). **AC3:** Given no `X-Tenant-ID` header (anonymous), Then the bundle returns global translations only (BR-18, H-53). | None | None | E-60: Global dictionary change invalidates ALL tenant bundle caches for that locale (BR-17). E-62: Concurrent tenant + global edit -- both changes reflected correctly. |

---

### Screen: SCR-LM-DICT -- Dictionary Tab (Tenant Admin View)

| Story ID | User Story | Acceptance Criteria | Confirmation Dialogs | Error Messages | Edge Cases |
|----------|-----------|-------------------|---------------------|---------------|------------|
| US-LM-053 | As a Tenant Admin, I want to browse and edit translations in the Dictionary tab so that I can manage translations for my organization. | **AC1 (Main):** Given I am a Tenant Admin (ROLE_ADMIN) on the Dictionary tab, When the page loads, Then I see the translation dictionary in read-only mode for system locales but can edit translation values. **AC2:** Given I edit a value and save, Then the translation goes live immediately with `status=ACTIVE` (BR-11). | None | None | None |

---

## Persona 3: End User (Lisa Harrison) [PER-UX-004, ROLE_USER]

Role: Works in Arabic, switches languages, sees localized dates/numbers/currencies per her locale preference.

Primary Epics: E2, E6, E14

---

### Screen: SCR-LM-SWITCHER-AUTH -- Language Switcher (Authenticated, FR-08) [PLANNED]

| Story ID | User Story | Acceptance Criteria | Confirmation Dialogs | Error Messages | Edge Cases |
|----------|-----------|-------------------|---------------------|---------------|------------|
| US-LM-054 | As an End User, I want a language switcher in the header so that I can change the UI language. | **AC1 (Main):** Given I am authenticated, When I click the language pill in the shell header topnav, Then a dropdown opens with all active locales showing flag emoji + native name, and the current locale has a checkmark. **AC2:** Given I select "Arabic" from the dropdown, When the selection is made, Then the UI updates to Arabic, RTL layout flips (`document.dir="rtl"`), and `PUT /api/v1/user/locale` persists my preference (H-30). **AC3:** Given I sign out and sign back in, When the app loads, Then my language preference is restored from the database (H-32). | None | None | E-42: Only 1 active locale -- switcher hidden. E-43: RTL-to-LTR switch mid-session -- `document.dir` changes within 300ms. E-44: Language switch while dialog open -- dialog text updates. E-45: Mobile (<768px) -- switcher moves into hamburger menu. |
| US-LM-055 | As an End User, I want keyboard-accessible language switching so that I can change language without a mouse. | **AC1 (Main):** Given I Tab to the language switcher button, When I press Enter/Space, Then the dropdown opens. When I use Arrow Up/Down, Then I navigate options. When I press Enter, Then the option is selected. When I press Escape, Then the dropdown closes and focus returns to the button. **AC2:** Given a screen reader, When I switch language, Then an `aria-live="polite"` region announces "Language changed to {name}" (E-47). | None | None | E-46: Full keyboard navigation pattern. |

---

### i18n Runtime Stories (FR-07, FR-12, E2, E14) [PLANNED]

| Story ID | User Story | Acceptance Criteria | Confirmation Dialogs | Error Messages | Edge Cases |
|----------|-----------|-------------------|---------------------|---------------|------------|
| US-LM-056 | As an End User, I want the app to bootstrap with my locale so that I see the UI in my language from the first render. | **AC1 (Main):** Given I open the app, When `APP_INITIALIZER` runs, Then it checks stored preference (IndexedDB/localStorage), fetches the bundle, sets `document.dir` and `document.lang`, and renders the translated UI (H-22). **AC2:** Given no stored preference, When the initializer runs, Then it calls `GET /api/v1/locales/detect` with browser `Accept-Language` to auto-detect. | None | E-31: Backend unreachable during bootstrap -- falls back to `en-US.json` from `assets/i18n/` (NFR-03). | E-33: IndexedDB unavailable (private browsing) -- falls back to in-memory cache only. |
| US-LM-057 | As an End User, I want to switch language mid-session without page reload so that I get instant results. | **AC1 (Main):** Given I am viewing a page, When I select a different language, Then all UI text updates without page reload via Signal-based re-rendering (NFR-02: <500ms). **AC2:** Given an RTL locale is selected, Then `document.documentElement.dir` and `lang` are updated and CSS logical properties adapt (E-35). | None | None | None |
| US-LM-058 | As an End User, I want dates and numbers formatted per my locale so that I see culturally appropriate formatting. | **AC1 (Main):** Given I have selected ar-AE locale and the format config has `calendar_system: "hijri"` and `numeral_system: "eastern_arabic"`, When I view dates on any page, Then dates are formatted per locale (e.g., "11 mars 2026" for fr, Arabic date for ar-AE) via `LocalizedDatePipe` (H-24). | None | None | None |
| US-LM-059 | As an End User, I want the translate pipe to resolve keys to translated strings so that all UI text is localized. | **AC1 (Main):** Given I use `{{ 'auth.login.welcome' \| translate }}` in a template, When the pipe evaluates, Then it returns the translated string from the current bundle. **AC2:** Given a missing key, When the pipe evaluates, Then it returns the raw key as fallback: "admin.locale.tab.languages" (E-30). **AC3:** Given a parameterized key with `{{ 'greeting' \| translate:{ name: 'Lisa' } }}`, When a parameter is missing, Then the placeholder is shown: "Welcome, {name}" (E-34). | None | None | None |
| US-LM-060 | As an End User, I want translation updates reflected within 5 minutes so that I see admin changes without manual refresh. | **AC1 (Main):** Given an admin updates a translation, When 5 minutes pass, Then `TranslationService` polls `/bundle/version`, detects a version mismatch, re-fetches the bundle, and all pipes re-render (BR-13, H-40, H-43). **AC2:** Given the version endpoint returns the same version, Then no re-fetch occurs (E-53). | None | E-52: Backend unreachable during poll -- uses last known bundle from IndexedDB, retries next cycle. | E-54: Rapid successive edits -- poll picks up latest version on next cycle. E-55: Admin edits while user polls -- no conflict, user gets latest. E-56: IndexedDB full or unavailable -- in-memory cache only. |
| US-LM-061 | As an End User, I want the HTTP interceptor to add my locale to all API requests so that backend responses can be localized. | **AC1 (Main):** Given I have selected fr-FR as my locale, When any HTTP request is made, Then the `LocaleInterceptor` adds `Accept-Language: fr-FR` to the request headers. | None | None | None |

---

### Seed Translation Files (E2) [PLANNED]

| Story ID | User Story | Acceptance Criteria | Confirmation Dialogs | Error Messages | Edge Cases |
|----------|-----------|-------------------|---------------------|---------------|------------|
| US-LM-062 | As a system, I want seed translation files (en-US.json and ar-AE.json) so that the app has a static fallback for offline/bootstrap scenarios. | **AC1 (Main):** Given the build assets, When the app loads and the backend is unreachable, Then `assets/i18n/en-US.json` serves as the fallback bundle with all 652 frontend keys. **AC2:** Given `ar-AE.json`, Then it contains the same key structure with Arabic values (initially populated from the dictionary). | None | None | None |

---

## Persona 4: Anonymous / Visitor (Kyle Morrison) [PER-CX-001, Unauthenticated]

Role: Sees login page in detected language, can select language before sign-in, evaluates platform in preferred locale.

---

### Screen: SCR-LM-SWITCHER-ANON -- Language Switcher (Login Page, FR-08) [PLANNED]

| Story ID | User Story | Acceptance Criteria | Confirmation Dialogs | Error Messages | Edge Cases |
|----------|-----------|-------------------|---------------------|---------------|------------|
| US-LM-063 | As a Visitor, I want to see the login page in my detected language so that I feel welcomed in my language. | **AC1 (Main):** Given I visit the login page with browser set to French, When `APP_INITIALIZER` runs, Then the detect API is called, fr-FR is detected (if active), and the login page renders in French (H-21). **AC2:** Given my browser language is `sw-KE` (not supported), When detection runs, Then it falls back to the alternative locale (e.g., en-US) (A-08). | None | None | None |
| US-LM-064 | As a Visitor, I want a language switcher on the login page so that I can change language before signing in. | **AC1 (Main):** Given I am on the login page (unauthenticated), When I view the page, Then the language switcher appears below the login form, centered, in pill button style (H-31). **AC2:** Given I select a language, When the selection is made, Then the login page re-renders in the selected language and the preference is stored in localStorage (no API call). | None | None | None |
| US-LM-065 | As a Visitor, I want to fetch translation bundles without authentication so that the login page can render in any active language. | **AC1 (Main):** Given I am unauthenticated, When I request `GET /api/v1/locales/{code}/bundle`, Then I receive a 200 response with the bundle (BR-09, R-04). **AC2:** Given I request `GET /api/v1/locales/active`, Then I receive a list of active locales. | None | E-28: Bundle request for non-existent locale returns 404 "No bundle available for locale: xyz". | R-04: Anonymous accesses public bundle -- 200 returned. |

---

## Cross-Persona Stories (All Roles)

### User Language Preference (FR-05) [IMPLEMENTED]

| Story ID | User Story | Acceptance Criteria | Confirmation Dialogs | Error Messages | Edge Cases |
|----------|-----------|-------------------|---------------------|---------------|------------|
| US-LM-066 | As any authenticated user, I want to set my language preference via API so that it persists across sessions. | **AC1 (Main):** Given I am authenticated, When I call `PUT /api/v1/user/locale` with `{ locale_code: "ar-AE" }`, Then my preference is persisted with `preference_source: MANUAL` (H-19, H-20). **AC2:** Given upsert semantics, When I change my preference, Then the previous preference is overwritten (E-26). | None | E-25: 422 "Selected locale is not active" if locale_code is not active. E-27: 401 "Authenticated JWT subject is required" if JWT missing `sub` claim. | A-07: Admin deactivates my locale -- preference migrated to alternative on next request (BR-04). A-09: User selects "Auto-detect" -- preference source set to DETECTED. |
| US-LM-067 | As an admin, I want to see translation updates immediately after saving so that I can verify my changes. | **AC1 (Main):** Given I edit a translation and save, When the save completes, Then the bundle is re-fetched immediately and all `{{ key \| translate }}` pipes re-render in the same session (BR-14, H-39). **AC2:** Given I commit a CSV import, When the commit completes, Then the bundle is refreshed immediately for me (H-41). **AC3:** Given I perform a rollback, When the rollback completes, Then I see the rolled-back translations immediately (H-42). | None | None | None |

---

### Translation Bundle API (FR-06) [IMPLEMENTED]

| Story ID | User Story | Acceptance Criteria | Confirmation Dialogs | Error Messages | Edge Cases |
|----------|-----------|-------------------|---------------------|---------------|------------|
| US-LM-068 | As a frontend application, I want to fetch a translation bundle for a locale so that I can render the UI in that language. | **AC1 (Main):** Given I request `GET /api/v1/locales/{code}/bundle`, When the bundle is cached in Valkey, Then I receive a response with `locale`, `version`, and `entries` map within 200ms (NFR-01). **AC2:** Given the response, Then it includes `X-Bundle-Version` header and `Cache-Control: public, max-age=300`. **AC3:** Given a tenant-aware request with `X-Tenant-ID` header, When the bundle is assembled, Then global translations are merged with tenant overrides (tenant wins). | None | 404 if locale code not found or not active. | E-29: Bundle cache stale after dictionary edit -- invalidated within 1 second. E-32: Bundle version changes during session -- periodic poll detects and re-fetches. |

---

### Testing Stories (E10) [PLANNED]

| Story ID | User Story | Acceptance Criteria | Confirmation Dialogs | Error Messages | Edge Cases |
|----------|-----------|-------------------|---------------------|---------------|------------|
| US-LM-069 | As QA, I want all existing 43 backend and 20 frontend unit tests executed so that we confirm the implemented code works. | **AC1 (Main):** Given 43 backend JUnit tests and 20 frontend Vitest tests, When executed, Then all pass with >=80% line coverage. | None | None | None |
| US-LM-070 | As QA, I want Testcontainers integration tests so that API endpoints are tested with real databases. | **AC1 (Main):** Given 4 integration test classes (Locale, Dictionary, ImportExport, Bundle), When executed with PostgreSQL + Valkey Testcontainers, Then all pass. | None | None | None |
| US-LM-071 | As QA, I want Playwright E2E tests for the 4 admin tabs and language switcher so that end-to-end flows are verified. | **AC1 (Main):** Given 5 Playwright test suites (languages, dictionary, import-export, rollback, language-switcher) with 42 scenarios, When executed in Chromium/Firefox/WebKit, Then all pass. | None | None | None |
| US-LM-072 | As QA, I want responsive tests at 3 viewports so that the UI works on all device sizes. | **AC1 (Main):** Given desktop (1280x720), tablet (768x1024), and mobile (375x667) viewports, When all E2E tests run at each viewport, Then table-to-card transformation, tab scrolling, and dialog sizing work correctly. | None | None | None |
| US-LM-073 | As QA, I want an RTL CSS audit so that all physical CSS properties are converted to logical properties. | **AC1 (Main):** Given all SCSS files, When audited, Then no physical CSS properties (`margin-left`, `padding-right`, `float: left`, `text-align: left`) remain -- all use logical equivalents (`margin-inline-start`, `padding-inline-end`, etc.). | None | None | None |

---

## RBAC Scenarios (Cross-Cutting)

| Story ID | User Story | Acceptance Criteria | Confirmation Dialogs | Error Messages | Edge Cases |
|----------|-----------|-------------------|---------------------|---------------|------------|
| US-LM-074 | As a system, I want RBAC enforced on all localization endpoints so that only authorized users can perform actions. | **AC1 (R-01):** Given a Tenant Admin (ROLE_ADMIN) tries to manage system locales, Then 403 is returned. **AC2 (R-02):** Given an End User (ROLE_USER) tries to access the dictionary admin, Then 403 is returned. **AC3 (R-03):** Given an anonymous user tries to set locale preference, Then 401 is returned. **AC4 (R-04):** Given an anonymous user accesses the public bundle, Then 200 is returned. **AC5 (R-05):** Given a token expires during dictionary edit, Then 401 is returned on save; unsaved changes preserved in dialog; re-auth prompt shown. **AC6 (R-06):** Given Super Admin from tenant A accesses locales, Then locales are GLOBAL -- no tenant isolation needed for system locales. | None | 401: Authentication required. 403: Insufficient permissions. | E-57: Tenant A tries to read Tenant B's overrides -- 403 IDOR protection (BR-16). |

---

## Complete Error Code Registry (17 Codes)

### Localization Service Errors (LOC-E-001 to LOC-E-014)

| Code | Name | HTTP | Description |
|------|------|------|-------------|
| LOC-E-001 | Cannot Deactivate Alternative | 409 | Cannot deactivate alternative locale. Change the alternative locale first. |
| LOC-E-002 | Cannot Deactivate Last Active | 409 | Cannot deactivate the last active locale. |
| LOC-E-003 | Empty CSV File | 400 | CSV file is empty. |
| LOC-E-004 | File Size Exceeded | 413 | File size exceeds 10 MB limit. |
| LOC-E-005 | Rate Limit Exceeded | 429 | Import rate limit exceeded. Maximum 5 imports per hour. (includes Retry-After header) |
| LOC-E-006 | Locale Not Active | 422 | Selected locale is not active. |
| LOC-E-007 | Locale Must Be Active for Alternative | 422 | Locale must be active to be set as alternative. |
| LOC-E-008 | Preview Expired | 410 | Import preview expired or not found. Please re-upload the file. |
| LOC-E-009 | Translation Too Long | 400 | Translation value exceeds maximum length (5000 characters). |
| LOC-E-010 | Dictionary Entry Not Found | 400 | `entry_id` does not exist in `dictionary_entries`. |
| LOC-E-011 | Locale Not Active for Override | 400 | `locale_code` is not an active locale. |
| LOC-E-012 | Tenant ID Mismatch | 403 | Tenant ID mismatch -- IDOR protection (JWT tenant_id vs path). |
| LOC-E-013 | Override Not Found | 404 | Override not found. |
| LOC-E-014 | CSV Injection Detected | 400 | CSV injection detected (`=`, `+`, `-`, `@` prefix). |

### General API Errors

| Code | Name | HTTP | Description |
|------|------|------|-------------|
| LOC-E-050 | API Error | 500 | Failed to load data. Please try again. (persistent toast) |
| LOC-E-051 | Version No Snapshot | 400 | Version {n} has no snapshot data to restore. |
| LOC-E-052 | Bundle Not Found | 404 | No bundle available for locale: {code}. |

---

## Complete Warning Code Registry (4 Codes)

| Code | Name | Description |
|------|------|-------------|
| LOC-W-001 | Concurrent Edit Warning | "Modified by {user} at {timestamp}. Your changes may overwrite." |
| LOC-W-002 | AI Quality Warning | "AI translation quality may be limited for {language}." |
| LOC-W-003 | Non-UTF8 Warning | "Non-UTF-8 characters detected in CSV file." |
| LOC-W-004 | Low Coverage Warning | "This locale has {n}% coverage. Activating it will show untranslated keys as English fallback to end users." |

---

## Complete Success Message Registry (12 Codes)

| Code | Name | Description |
|------|------|-------------|
| LOC-S-001 | Locale Activated | "Locale activated" (success toast, 3s) |
| LOC-S-002 | Locale Deactivated | "Locale deactivated" (success toast, 3s) |
| LOC-S-003 | Format Config Updated | "Format config updated" (success toast, 3s) |
| LOC-S-004 | Translations Saved | "Translations saved" (success toast, 3s) |
| LOC-S-005 | Dictionary Exported | "Dictionary exported as CSV" (success toast, 3s) |
| LOC-S-006 | Import Complete | "Import complete: {updated} updated, {new} new" (success toast, 3s) |
| LOC-S-007 | Dictionary Rolled Back | "Dictionary rolled back to version #{n}" (success toast, 3s) |
| LOC-S-008 | HITL Review Complete | "{approved} approved, {rejected} rejected" (success toast, 3s) |
| LOC-S-009 | Override Created | "Override created" (success toast, 3s) |
| LOC-S-010 | Override Removed | "Override removed" (success toast, 3s) |
| LOC-S-011 | Overrides Imported | "{imported} imported, {updated} updated, {skipped} skipped" (success toast, 3s) |
| LOC-S-012 | Language Changed | "Language changed to {name}" (aria-live polite announcement) |

---

## Complete Confirmation Dialog Registry (5 Dialogs)

| Code | Trigger | Title | Body | Buttons |
|------|---------|-------|------|---------|
| CD-LM-01 | Deactivate locale with users assigned | "Deactivate Locale" | "{n} users will be migrated to {alternative locale name}. Proceed?" | "Deactivate" (primary) / "Cancel" |
| CD-LM-02 | Confirm import after preview | "Confirm Import" | "Import {n} translations? This creates a new version snapshot." | "Confirm Import" (primary) / "Cancel" |
| CD-LM-03 | Rollback to previous version | "Rollback to Version #{n}" | "Rollback to version #{n}? This will create a pre-rollback snapshot and restore the dictionary to this state." | "Rollback" (danger) / "Cancel" |
| CD-LM-04 | Delete tenant override | "Remove Override" | "Remove override for '{key}'? The global value will be used instead." | "Remove" (danger) / "Cancel" |
| CD-LM-05 | Confirm bulk override import | "Import Overrides" | "Import {n} overrides for this tenant? Existing overrides for matching keys will be updated." | "Import" (primary) / "Cancel" |

---

## Empty State Specifications (9 Screens/Contexts)

| Screen/Context | Icon | Heading | Subtext | Action Button |
|----------------|------|---------|---------|---------------|
| SCR-LM-LANG (no search results) | pi-search | "No locales found matching '{query}'" | "Try a different search term." | "Clear Search" (text button) |
| SCR-LM-DICT (no search results) | pi-search | "No entries matching '{query}'" | "Try a different search term." | "Clear" (text button) |
| SCR-LM-IMPORT (no imports yet) | pi-file-import | "No imports yet" | "Export the dictionary as CSV, edit externally, and import here." | "Export CSV" (primary) |
| SCR-LM-ROLL (no versions) | pi-history | "No version history" | "Version history appears after the first dictionary modification." | None |
| SCR-LM-AI (no missing keys) | pi-check-circle | "All keys translated for {locale}" | "100% coverage achieved. No AI translation needed." | None |
| SCR-LM-AI (AI unavailable) | pi-exclamation-triangle | "AI translation unavailable" | "Please translate manually or try again later." | "Translate Manually" (link) |
| SCR-LM-OVERRIDE (no overrides) | pi-globe | "No overrides for this tenant" | "Global translations are used for all keys. Create an override to customize terminology." | "Add Override" (primary) |
| SCR-LM-SWITCHER (1 locale) | -- | (Switcher hidden entirely) | -- | -- |
| SCR-LM-LANG (loading) | -- | 5 skeleton rows | Circle placeholder + 2 text lines per row | -- |

---

## Cross-Cutting Specifications

### Responsive Behavior

| Component | Desktop (>1024px) | Tablet (768-1024px) | Mobile (<768px) |
|-----------|-------------------|---------------------|-----------------|
| Tab bar | Horizontal pills, all visible | Horizontal, scrollable | Horizontal scroll, icon-only with tooltip |
| Locale table | All 7 columns | Horizontal scroll | Card view (stacked key-value pairs) |
| Dictionary table | All locale columns visible | Max 3 locale columns, scroll for rest | Card view with expansion |
| Language switcher | In topnav island | In topnav island | In hamburger menu |
| Edit dialog | `min-width: 480px` centered | `width: 90vw` | Full-screen bottom sheet |
| Import preview | Side panel | Below import area | Full-width card |
| Coverage bar | Inline with locale name | Below locale name | Full-width below card |
| AI translate panel | 3-column table | 2-column (translation, actions) | Card view |
| Format config | Inline accordion below row | Slide-over panel | Full-screen bottom sheet |
| Tenant overrides table | Full table | Horizontal scroll | Card view |

### Accessibility (WCAG AAA)

| Component | ARIA Pattern | Key Attributes |
|-----------|-------------|----------------|
| Tab bar | `tablist` + `tab` + `tabpanel` | `role="tablist"`, `aria-selected`, `aria-controls` |
| Language switcher | `listbox` dropdown | `role="listbox"`, `aria-expanded`, `aria-activedescendant` |
| Active toggle | Switch | `role="switch"`, `aria-checked`, `aria-label="Activate {locale}"` |
| Alternative radio | Radio group | `role="radiogroup"`, `aria-label="Alternative locale"` |
| Coverage bar | Progressbar | `role="progressbar"`, `aria-valuenow`, `aria-valuemin="0"`, `aria-valuemax="100"` |
| Loading overlay | Live region | `aria-live="polite"`, `aria-busy="true"` |
| Error banner | Alert | `role="alert"`, `aria-live="assertive"` |
| Toast notifications | Status | `role="status"`, `aria-live="polite"` |
| Edit dialog | Dialog | `role="dialog"`, `aria-modal="true"`, `aria-labelledby` |
| Confirmation dialog | Alert dialog | `role="alertdialog"`, `aria-modal="true"` |
| Language change announcement | Live region | `aria-live="polite"` -- "Language changed to {name}" |

### RTL Support

| Property | LTR | RTL |
|----------|-----|-----|
| `document.documentElement.dir` | `"ltr"` | `"rtl"` |
| `document.documentElement.lang` | `"en-US"` | `"ar-AE"` |
| CSS logical properties | `margin-inline-start` | Flips automatically |
| Text alignment | `text-align: start` | Flips to right |
| Table column order | Left-to-right | Right-to-left |
| Chevron icons | Points right | Points left |
| Number formatting | `1,234.56` | Eastern Arabic numerals if configured |
| Font stack | Gotham Rounded, Nunito | Noto Sans Arabic, Tahoma, Gotham Rounded |

### Focus Management

| Scenario | Focus Target |
|----------|-------------|
| Tab switch | First interactive element in new tab panel |
| Dialog open | First input in dialog |
| Dialog close | Button that opened the dialog |
| Toast appears | Focus remains on current element (non-intrusive) |
| Error banner appears | Error banner dismiss button |
| Language switch | Language switcher button (stays on trigger) |
| File upload complete | Preview summary area |
| Rollback confirmation | Confirm button in dialog |

### Toast Notification Behavior

| Type | Icon | Duration | Dismissal |
|------|------|----------|-----------|
| Success | `pi-check-circle` | 3 seconds | Auto-dismiss |
| Warning | `pi-exclamation-triangle` | 5 seconds | Auto-dismiss |
| Error | `pi-times-circle` | Persistent | Manual dismiss only |
| Info | `pi-info-circle` | 4 seconds | Auto-dismiss |

### Animation Specifications

| Animation | Duration | Easing | Trigger |
|-----------|----------|--------|---------|
| Tab content fade-in | 150ms | ease-in | Tab switch |
| Dropdown open | 150ms | ease-out | Switcher click |
| Dropdown close | 100ms | ease-in | Outside click / escape |
| Toggle switch | 200ms | ease | State change |
| Coverage bar fill | 400ms | ease-out | On data load |
| Dialog appear | 200ms | ease-out | Dialog open |
| Dialog dismiss | 150ms | ease-in | Cancel / close |
| RTL layout flip | 300ms | ease-in-out | Language change |
| Toast slide-in | 250ms | ease-out | Notification |
| Toast slide-out | 200ms | ease-in | Auto-dismiss |

When `prefers-reduced-motion: reduce`: all transitions 0ms, skeleton shimmer replaced with static gray, RTL flip instant.

---

## Business Rules Registry (18 Rules)

| ID | Rule | Test Coverage |
|----|------|--------------|
| BR-01 | Cannot deactivate the alternative locale -- must change alternative first | E-01 |
| BR-02 | Cannot deactivate the last active locale | E-02 |
| BR-03 | Locale must be active to be set as alternative | E-03 |
| BR-04 | Deactivating a locale with assigned users migrates them to the alternative | A-01, US-LM-004 |
| BR-05 | Import preview tokens expire after 30 minutes (Valkey TTL) | E-16 |
| BR-06 | Every dictionary modification creates a version snapshot | H-15, H-17 |
| BR-07 | Rollback creates a pre-rollback snapshot before restoring | H-17, E-23 |
| BR-08 | Translation bundles use a GLOBAL base dictionary with optional tenant-specific overrides (overlay pattern) | E-60 |
| BR-09 | Anonymous users can fetch bundles and detect locale (public endpoints) | R-04 |
| BR-10 | AI translations must preserve `{param}` placeholder tokens | E-41 |
| BR-11 | Manual and imported translations go live immediately (ACTIVE status) -- no approval workflow | H-10, H-15 |
| BR-12 | Agentic translations of ambiguous terms are flagged PENDING_REVIEW until admin approves | H-28 |
| BR-13 | Translation updates are reflected to other users within 5 minutes via bundle version polling | E-54 |
| BR-14 | Admin sees translation updates immediately after save (same-session reflection) | H-39, E-52 |
| BR-15 | Tenant translation overrides take precedence over global translations for the same key+locale | E-60, E-61 |
| BR-16 | Tenant overrides are isolated -- Tenant A cannot see or modify Tenant B's overrides | A-11, E-57, E-63 |
| BR-17 | Modifying a global translation invalidates all tenant-specific caches for that locale | E-65 |
| BR-18 | Anonymous/unauthenticated users receive global translations only (no tenant overrides) | R-04, E-66 |

---

## Non-Functional Requirements Traceability

| ID | Requirement | Story Coverage | Test Scenario |
|----|-------------|---------------|---------------|
| NFR-01 | Bundle fetch < 200ms (Valkey-cached) | US-LM-068 | P-01 |
| NFR-02 | Language switch < 500ms (no page reload) | US-LM-057 | P-02 |
| NFR-03 | Static fallback (en-US.json) when backend unreachable | US-LM-056 | E-31 |
| NFR-04 | CSV injection prevention | US-LM-034 | E-17 |
| NFR-05 | 10MB file size limit for imports | US-LM-034 | E-18 |
| NFR-06 | WCAG AAA color contrast, keyboard navigation, ARIA roles | US-LM-055 | A-01 through A-06 |
| NFR-07 | Full RTL support for Arabic/Hebrew locales | US-LM-057 | E-35, H-31 |
| NFR-08 | 50-version retention with scheduled cleanup | US-LM-033 | E-24 |
| NFR-09 | Bundle cached in Valkey, invalidated on dictionary commit | US-LM-068 | E-29 |
| NFR-10 | Rate limiting (max 5 imports/hr per user) | US-LM-013 | E-15 |

---

## Feature Requirements Traceability

| FR | Name | Status | Stories | Sprint |
|----|------|--------|---------|--------|
| FR-01 | System Languages Management | [IMPLEMENTED] | US-LM-001 to US-LM-007, US-LM-020 | S1 |
| FR-02 | Translation Dictionary | [IMPLEMENTED] | US-LM-008 to US-LM-011 | S1 |
| FR-03 | Dictionary Import/Export | [IMPLEMENTED] | US-LM-012, US-LM-013 | S1 |
| FR-04 | Dictionary Rollback | [IMPLEMENTED] | US-LM-014 to US-LM-016 | S1 |
| FR-05 | User Language Preference | [IMPLEMENTED] | US-LM-066 | S1 |
| FR-06 | Translation Bundle API | [IMPLEMENTED] | US-LM-068 | S1 |
| FR-07 | Frontend i18n Runtime | [PLANNED] | US-LM-056 to US-LM-062 | S1 |
| FR-08 | Language Switcher | [PLANNED] | US-LM-054, US-LM-055, US-LM-063, US-LM-064 | S2 |
| FR-09 | Backend i18n Infrastructure | [PLANNED] | US-LM-021 to US-LM-025 | S1 |
| FR-10 | Agentic Translation with HITL | [PLANNED] | US-LM-017 to US-LM-019 | S2 |
| FR-11 | Translation Workflow (3 Scenarios) | [PLANNED] | US-LM-010 (manual), US-LM-013 (import), US-LM-017 (agentic) | S1-S2 |
| FR-12 | Translation Reflection Flow | [PLANNED] | US-LM-060, US-LM-067 | S2 |
| FR-13 | Duplication Detection | [DEFERRED -- Next Release] | -- | -- |
| FR-14 | String Externalization | [PLANNED] | US-LM-035 to US-LM-044 | S2-S3 |
| FR-15 | Tenant Translation Overrides | [PLANNED] | US-LM-046 to US-LM-052 | S2 |

---

## Epic-to-Story Mapping

| Epic | Name | Stories | SP |
|------|------|---------|-----|
| E1 | Backend i18n Infrastructure | US-LM-021 to US-LM-025 | 21 |
| E2 | Frontend i18n Infrastructure | US-LM-056 to US-LM-062 | 34 |
| E3 | Localization Service Fixes | US-LM-032 to US-LM-034 | 8 |
| E4 | Frontend String Externalization P1-P4 | US-LM-035 to US-LM-038 | 21 |
| E5 | Backend Message Migration P1-P4 | US-LM-040 to US-LM-043 | 13 |
| E6 | Language Switcher and RTL | US-LM-054, US-LM-055, US-LM-063, US-LM-064 | 13 |
| E7 | Agentic Translation with HITL | US-LM-017 to US-LM-019, US-LM-027, US-LM-028 | 18 |
| E8 | Frontend String Externalization P5-P10 | US-LM-039 | 18 |
| E9 | Backend Message Migration P5-P8 | US-LM-044 | 8 |
| E10 | Testing and QA | US-LM-069 to US-LM-073 | 21 |
| E11 | Documentation | US-LM-045 | 8 |
| E12 | Schema Extensions | US-LM-026 to US-LM-028 | 8 |
| E13 | PrimeNG Text Expansion Fixes | US-LM-029 to US-LM-031 | 5 |
| E14 | Translation Reflection Flow | US-LM-060, US-LM-067 | 5 |
| E15 | Tenant Translation Overrides | US-LM-046 to US-LM-052 | 13 |

---

## SA Conditions Cross-Reference

| SA Condition | Status | Covered By Story |
|-------------|--------|-----------------|
| GW-03 | OPEN | US-LM-032 |
| INF-01 | OPEN | US-LM-033 |
| SEC-04 | OPEN | US-LM-034 |
| SEC-05 (XSS) | OPEN | US-LM-010 (E-07) |
| OAS-01 | OPEN | US-LM-045 |
| DM-04 (tenant scope) | ARCH DECISION | US-LM-046 to US-LM-052 |

---

## Performance Scenarios

| # | NFR | Scenario | Expected | Severity |
|---|-----|----------|----------|----------|
| P-01 | NFR-01 | Bundle fetch (500 keys, Valkey-cached) | Response < 200ms (p95) | HIGH |
| P-02 | NFR-02 | Language switch (fetch bundle + re-render 50 components) | Total time < 500ms | HIGH |
| P-03 | NFR-01 | Bundle fetch (1000+ keys, cold cache, DB query) | Response < 500ms (p95) | MEDIUM |

---

## Deferred Requirements

| FR | Name | Deferral Reason | Phase |
|----|------|-----------------|-------|
| FR-13 | Duplication Detection | Requires regex/pattern matching engine safe for multi-locale text; preview-with-undo workflow; concurrent edit protection. Phase 1 adds detection flag only. | Next Release |
| Gap EX-04 | Translation Memory | Not in current scope; planned for Phase 2. | Phase 2 |
| Gap EX-05 | Bulk Find-and-Replace | Deferred to next release per stakeholder decision. | Next Release |
| Gap S-01 | ICU MessageFormat | Planned for future sprint; not blocking current release. | Phase 2 |
| Gap S-02 | CLDR Integration | Format config fields exist but no CLDR library integration. | Phase 2 |
| Gap MX-01 | SEO/SSR Strategy | Lower priority for internal-only application. | Phase 3 |
| Gap CX-05 | User-Level Format Overrides | Advanced personalization deferred. | Phase 3 |

---

**Document prepared by:** BA Agent (BA-PRINCIPLES.md v1.1.0)
**Total Stories Inventoried:** 74 unique user stories (US-LM-001 through US-LM-074)
**Total Confirmation Dialogs:** 5 (CD-LM-01 through CD-LM-05)
**Total Error Codes:** 17 (LOC-E-001 through LOC-E-052)
**Total Success Codes:** 12 (LOC-S-001 through LOC-S-012)
**Total Warning Codes:** 4 (LOC-W-001 through LOC-W-004)
**Requirements Coverage:** 42/43 requirements active (1 deferred with rationale)
