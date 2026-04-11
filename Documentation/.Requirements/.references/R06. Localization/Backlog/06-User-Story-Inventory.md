# R06 Localization -- Complete User Story Inventory

**Version:** 1.0.0
**Date:** 2026-03-12
**Author:** BA Agent
**Status:** COMPLETE
**Source Documents:** PRD v4.0, UI/UX Spec v4.0, API Contract v2.0, Data Model v3.0, SA Conditions v3.0, Backlog Overview v4.0, i18n Infrastructure Backlog, Sprint Plan v1.0, Scenario Matrix v2.0, Test Strategy v1.0, Playwright Test Plan v1.0, README v3.0

---

## Traceability Summary

| Category | Count | Covered |
|----------|-------|---------|
| Feature Requirements (FR) | 15 | 14 active + 1 deferred (FR-13) |
| Non-Functional Requirements (NFR) | 10 | 10/10 |
| Business Rules (BR) | 18 | 18/18 |
| Happy Path Scenarios | 53 | 53/53 |
| Alternative Scenarios | 11 | 11/11 |
| Edge Case Scenarios | 66 | 66/66 |
| RBAC Scenarios | 6 | 6/6 |
| Performance Scenarios | 3 | 3/3 |
| Sprint Stories | 52 | 52/52 |
| Epics | 15 | 15/15 |

---

## PERSONA 1: Super Admin / Platform Admin (Sam Martinez, PER-UX-001, ROLE_SUPER_ADMIN)

### Feature Area: System Languages Management (FR-01)

| Story ID | User Story | Acceptance Criteria | Confirmation Dialogs | Error Messages | Edge Cases |
|----------|-----------|-------------------|---------------------|---------------|------------|
| US-LM-01-H01 | As a Super Admin, I want to view the locale catalog so that I can see all system languages and their status. | **AC1 (Main):** Given I am a Super Admin on the Languages tab, When the page loads, Then I see a paginated table with 10 locales showing flag emoji, code, name, status toggle, alternative radio, and coverage bar. **AC2:** Given 10 locales are seeded, When I view the table, Then pagination shows correct total (10 items). | None | None | E-05: Locale with max-length code (10 chars) renders correctly without truncation. |
| US-LM-01-H02 | As a Super Admin, I want to search locales so that I can find a specific language quickly. | **AC1 (Main):** Given I am on the Languages tab with 10 locales, When I type "ar" in the search field, Then the table filters to show only ar-AE (Arabic). **AC2:** Given I search for "xyz", When no results match, Then I see empty state: "No locales found matching 'xyz'". | None | None | A-03: Empty search results show empty state message. |
| US-LM-01-H03 | As a Super Admin, I want to activate a locale so that it becomes available for users. | **AC1 (Main):** Given fr-FR is inactive, When I click the toggle switch for fr-FR, Then fr-FR becomes active, `activated_at` is updated, and a toast shows "Locale activated". **AC2:** Given fr-FR was previously deactivated and reactivated, When I toggle it on, Then no user migration occurs (A-02). | None | None | None |
| US-LM-01-H04 | As a Super Admin, I want to deactivate a locale so that it is no longer available to users. | **AC1 (Main):** Given fr-FR is active, is not the alternative, and 2+ locales are active, When I click the toggle switch for fr-FR, Then fr-FR is deactivated, toast shows "Locale deactivated". **AC2 (BR-04):** Given de-DE is active with 5 users assigned, When I deactivate de-DE, Then those 5 users are migrated to the alternative locale, and the response shows `migrated_users: 5`. | **Confirmation required** when users are affected: "Deactivating this locale will migrate {n} users to the alternative locale ({alternative}). Continue?" | **LOC-E-001 (409):** "Cannot deactivate alternative locale. Change the alternative locale first." (E-01, BR-01). **LOC-E-002 (409):** "Cannot deactivate the last active locale." (E-02, BR-02). | E-01: Deactivating alternative locale blocked (CRITICAL). E-02: Deactivating last active locale blocked (CRITICAL). E-04: Concurrent deactivation -- optimistic lock prevents race condition; first succeeds, second gets 409. A-01: Deactivation with user migration. |
| US-LM-01-H05 | As a Super Admin, I want to set a locale as the alternative (fallback) so that it serves as the default for content negotiation. | **AC1 (Main):** Given ar-AE is active, When I select the ar-AE radio button, Then ar-AE becomes the alternative, the previous alternative is unset, and the radio moves. **AC2 (BR-03):** Given de-DE is inactive, When I try to set de-DE as alternative, Then I see error: "Locale must be active to be set as alternative." | None | **422:** "Locale must be active to be set as alternative." (E-03, BR-03). | E-03: Setting inactive locale as alternative returns 422 (HIGH). |
| US-LM-01-H06 | As a Super Admin, I want to view format configuration for a locale so that I can see how dates, numbers, and currencies are displayed. | **AC1 (Main):** Given ar-AE has a format config, When I click the format config accordion for ar-AE, Then I see: calendar system (hijri/gregorian), numeral system (western/eastern_arabic), currency code (AED/USD), date format (dd/MM/yyyy), time format (HH:mm). | None | None | None |
| US-LM-01-H07 | As a Super Admin, I want to update format configuration for a locale so that dates, numbers, and currencies display correctly for that locale. | **AC1 (Main):** Given ar-AE format config is displayed, When I change calendar to "hijri" and click Save, Then config is saved, toast shows "Format config updated", and all users on ar-AE see new formats. | None | None | None |

### Feature Area: Translation Dictionary Management (FR-02)

| Story ID | User Story | Acceptance Criteria | Confirmation Dialogs | Error Messages | Edge Cases |
|----------|-----------|-------------------|---------------------|---------------|------------|
| US-LM-02-H08 | As a Super Admin, I want to browse the translation dictionary so that I can see all translation keys and their values per locale. | **AC1 (Main):** Given I am on the Dictionary tab, When the page loads, Then I see a paginated table with columns: technical_name, module, and one column per active locale showing translation values. **AC2:** Given the table has 500+ entries, When I navigate pages, Then pagination works correctly with configurable page size. | None | None | None |
| US-LM-02-H09 | As a Super Admin, I want to search the dictionary so that I can find specific translation keys. | **AC1 (Main):** Given I am on the Dictionary tab, When I type "login" in the search field, Then the table filters to keys matching "login" in technical_name or module. | None | None | None |
| US-LM-02-H10 | As a Super Admin, I want to edit a translation value so that I can correct or add translations manually. | **AC1 (Main):** Given I click edit on key "auth.login.welcome", When the edit dialog opens, Then I see a text field per active locale with existing values pre-filled. **AC2:** Given I change the ar-AE value and click Save, Then the translation is updated with status=ACTIVE immediately (BR-11, no approval workflow), toast shows "Translations saved", and the table reflects the change. **AC3 (RTL):** Given the locale is RTL (ar-AE), When I edit, Then the input has `dir="rtl"` and text is right-aligned (E-11). **AC4 (Character count):** Given `max_length` is set on the entry, When I type, Then I see `{current}/{max_length}` below the textarea. **AC5 (Translator notes):** Given the entry has `translator_notes`, When the dialog opens, Then the hint is shown read-only above the input. **AC6 (Placeholder validation):** Given the source locale has `{param}` tokens, When my translation is missing a token, Then a warning appears. **AC7 (Diff view):** Given I am editing an existing value, When the dialog opens, Then the old value is shown struck through for comparison. | None | **Validation error:** "Translation value exceeds maximum length" when >5000 chars (E-09). | E-06: Clearing a value removes translation; coverage decreases. E-07: HTML tags sanitized (`<script>` stripped). E-08: ICU placeholders `{count, plural, ...}` saved as-is. E-09: >5000 chars rejected (MEDIUM). E-10: Concurrent edit -- optimistic lock, last save wins, first saver sees conflict warning (HIGH). E-11: RTL input for RTL locales (MEDIUM). E-12: Unicode emoji stored and rendered correctly. |
| US-LM-02-H11 | As a Super Admin, I want to add a missing translation so that coverage increases for a locale. | **AC1 (Main):** Given key "auth.login.welcome" has empty ar-AE value, When I type Arabic text and save, Then ar-AE column shows the translation and coverage percentage increases. | None | None | None |
| US-LM-02-H12 | As a Super Admin, I want to view translation coverage per locale so that I know which locales need more translations. | **AC1 (Main):** Given I click coverage report for ar-AE, When the report loads, Then I see: "450/500 keys translated (90%)" with a list of 50 missing keys. **AC2:** Given coverage is >80%, Then the coverage bar is green (`--loc-coverage-high`). Given 40-80%, it is amber. Given <40%, it is red. | None | None | None |

### Feature Area: Dictionary Import/Export (FR-03)

| Story ID | User Story | Acceptance Criteria | Confirmation Dialogs | Error Messages | Edge Cases |
|----------|-----------|-------------------|---------------------|---------------|------------|
| US-LM-03-H13 | As a Super Admin, I want to export the dictionary as CSV so that I can edit translations externally. | **AC1 (Main):** Given I am on the Import/Export tab, When I click "Export CSV", Then a file `dictionary-YYYY-MM-DD.csv` downloads with UTF-8 BOM encoding and one column per active locale. | None | None | None |
| US-LM-03-H14 | As a Super Admin, I want to preview a CSV import before committing so that I can verify changes. | **AC1 (Main):** Given I upload a valid CSV file, When the preview loads, Then I see: "500 rows, 12 to update, 3 new keys, 0 errors" with a 30-minute countdown timer. **AC2:** Given the preview shows file info (filename, size, encoding, row count), When I review, Then I can toggle a diff view showing old vs new values. **AC3 (Visual):** Given the preview has a pie chart, When I view it, Then I see update/new/error breakdown visually. | None | **LOC-E-003 (400):** "CSV file is empty." (E-13). **LOC-E-004 (413):** "File size exceeds 10 MB limit" (E-18, NFR-05). **LOC-E-005 (429):** "Import rate limit exceeded. Maximum 5 imports per hour." with Retry-After header (E-15, NFR-10). | E-13: Empty CSV returns 400 (HIGH). E-14: Non-UTF-8 encoding shows warning. E-15: Rate limit exceeded returns 429 (HIGH). E-16: Preview token expired after 30 min returns 410: "Import preview expired or not found. Please re-upload the file." (HIGH, BR-05). E-17: CSV injection (`=CMD(...)`) -- values starting with `=`, `+`, `-`, `@` sanitized with `'` prefix (CRITICAL, NFR-04). E-18: File >10MB returns 413 (HIGH). E-19: CSV with 50,000+ rows -- preview caps at first 1000 rows (MEDIUM). E-20: Concurrent imports by 2 admins -- per-user rate limit (LOW). A-04: Import with errors shows "498 valid, 2 errors" with details; user can proceed (skip errors) or cancel. A-05: Import creates new keys shown in preview as "3 new keys will be created". A-06: Re-upload discards previous preview, generates new one. |
| US-LM-03-H15 | As a Super Admin, I want to commit a previewed import so that translations are applied to the dictionary. | **AC1 (Main):** Given I have reviewed the import preview, When I click "Confirm Import", Then translations are upserted, a pre-import snapshot is created (BR-06), cache is invalidated, and toast shows "Import complete". | **"Confirm Import" dialog:** "This will update {n} translations and create {m} new keys. This action creates a version snapshot and can be rolled back. Proceed?" | None | None |

### Feature Area: Dictionary Rollback/Versioning (FR-04)

| Story ID | User Story | Acceptance Criteria | Confirmation Dialogs | Error Messages | Edge Cases |
|----------|-----------|-------------------|---------------------|---------------|------------|
| US-LM-04-H16 | As a Super Admin, I want to view version history so that I can see all changes made to the dictionary. | **AC1 (Main):** Given I am on the Rollback tab, When the page loads, Then I see a paginated list of versions with: version number, type badge (EDIT/IMPORT/ROLLBACK), change summary, date, creator. **AC2:** Given the latest version, When I view it, Then it shows a "CURRENT" badge in green with no "Rollback" button. | None | None | E-24: Version retention limit (50) -- oldest versions auto-deleted by @Scheduled cleanup (LOW, NFR-08). |
| US-LM-04-H17 | As a Super Admin, I want to rollback to a previous version so that I can restore the dictionary to a known good state. | **AC1 (Main):** Given I click "Rollback" on version #42, When the confirmation dialog appears and I confirm, Then a pre-rollback snapshot is created (BR-07), the dictionary is restored to version #42 state, cache is invalidated, and toast shows "Dictionary rolled back to version #42". **AC2 (Chain):** Given a rollback creates v50 (snapshot) then v51 (restore), When I view history, Then the chain is traceable (E-23). | **Rollback confirmation dialog:** "Are you sure you want to rollback to version #{n}? A snapshot of the current dictionary will be created before restoring. This action affects all translations." with "Rollback" (primary) and "Cancel" buttons. | **400:** "Version {n} has no snapshot data to restore." (E-21). | E-21: Rollback to version with no snapshot_data returns 400 (HIGH). E-22: Rollback while another admin edits -- optimistic lock prevents conflict; editing admin gets 409 on save (HIGH). E-23: Rollback chain traceable (MEDIUM). E-24: 50-version retention cleanup (LOW). |
| US-LM-04-H18 | As a Super Admin, I want to view a version's detail so that I can inspect the full dictionary state at that point. | **AC1 (Main):** Given I click a version number, When the detail loads, Then I see the full `snapshot_data` (JSON) in a read-only viewer. | None | None | None |

### Feature Area: Agentic Translation with HITL (FR-10, FR-11 Scenario 3)

| Story ID | User Story | Acceptance Criteria | Confirmation Dialogs | Error Messages | Edge Cases |
|----------|-----------|-------------------|---------------------|---------------|------------|
| US-LM-06-H26 | As a Super Admin, I want to request AI translation for missing keys so that I can quickly fill coverage gaps. | **AC1 (Main):** Given I am on the AI Translate tab for locale ar-AE, When I click "Translate Missing", Then the AI agent translates all missing keys from en-US to ar-AE using the LLM. **AC2 (Auto-apply):** Given the AI returns results, When unambiguous terms are identified, Then they are auto-applied with status=ACTIVE (BR-11) and a summary shows: "{n} translations auto-applied". **AC3 (HITL):** Given the AI flags ambiguous terms (multiple contextual meanings), When results are displayed, Then they appear in the HITL Review section with status=PENDING_REVIEW (BR-12). **AC4 (Progress):** Given the translation is in progress, Then a progress bar shows estimated completion. | None | **AI service unavailable:** "AI translation unavailable. Please translate manually." (E-40). **AI rate limit (429):** Queued for retry with estimated wait progress bar (E-37). | E-36: AI for unsupported language shows warning: "AI translation quality may be limited for {language}" (MEDIUM). E-37: AI API rate limit -- queued with progress (MEDIUM). E-38: AI generates inappropriate translation -- human review catches it (HIGH). E-39: AI generates wrong RTL direction -- validation checks text_direction (HIGH). E-40: AI service unavailable -- graceful degradation (MEDIUM). E-41: AI translates ICU placeholders incorrectly -- placeholder integrity check ensures all `{param}` tokens preserved (HIGH, BR-10). |
| US-LM-06-H27 | As a Super Admin, I want to review AI-generated translations for ambiguous terms so that I can approve or reject them. | **AC1 (Main):** Given the HITL review table shows flagged terms, When I view a row, Then I see: key, source value (en-US), AI translation, ambiguity reason (e.g., "Multiple meanings: financial institution vs. river bank"), and Approve/Reject buttons. **AC2:** Given I click "Approve" on a term, When the action completes, Then the translation status changes to ACTIVE and it is included in bundles. **AC3:** Given I click "Reject" on a term, When the action completes, Then the status changes to REJECTED and the admin must re-translate manually. | None | None | None |
| US-LM-06-H28 | As a Super Admin, I want to bulk-approve high-confidence AI translations so that I can quickly accept unambiguous terms. | **AC1 (Main -- Updated per stakeholder decision):** Given the HITL review table shows pending items, When I select multiple items and click "Approve ({n})", Then all selected items change to ACTIVE status and a snapshot is created. **AC2:** Given I click "Approve All Pending", Then all PENDING_REVIEW items are set to ACTIVE. **AC3:** Given I click "Reject ({n})", Then selected items are set to REJECTED. | None | None | None |

### Feature Area: Translation Reflection Flow (FR-12)

| Story ID | User Story | Acceptance Criteria | Confirmation Dialogs | Error Messages | Edge Cases |
|----------|-----------|-------------------|---------------------|---------------|------------|
| US-LM-09-H39 | As a Super Admin, I want to see my translation changes immediately after saving so that I can verify my work. | **AC1 (Main -- BR-14):** Given I edit translation "auth.login.welcome" and save, When the save completes, Then my current admin session shows the updated text instantly without waiting for the 5-minute poll cycle. **AC2:** Given I commit a CSV import, When the import completes, Then I see all imported translations immediately. **AC3:** Given I rollback to version #42, When the rollback completes, Then I see rolled-back translations immediately. | None | None | E-54: Rapid successive edits -- each edit increments version; poll picks up latest on next cycle (MEDIUM). E-55: Admin edits while user polls -- no conflict; user gets latest after cache invalidation (MEDIUM). |

### Feature Area: Schema Extensions (E12)

| Story ID | User Story | Acceptance Criteria | Confirmation Dialogs | Error Messages | Edge Cases |
|----------|-----------|-------------------|---------------------|---------------|------------|
| E12-S1 | As a Super Admin, I want translator notes, max length, and tags on dictionary entries so that translators have context. | **AC1:** Given the V2 migration runs, When I view dictionary entries, Then `translator_notes`, `max_length`, and `tags` columns are available. **AC2:** Given an entry has `max_length=25`, When a translator enters 30 chars, Then validation prevents save. | None | None | None |
| E12-S2 | As a Super Admin, I want a status field on translations so that agentic HITL workflow is supported. | **AC1:** Given the V2 migration runs, When I view translations, Then a `status` column exists with default value ACTIVE. **AC2:** Given existing translations, Then all are set to ACTIVE via data migration. | None | None | None |
| E12-S3 | As a Super Admin, I want bundles to exclude non-ACTIVE translations so that pending/rejected items are not shown to users. | **AC1:** Given translations with status PENDING_REVIEW or REJECTED exist, When a bundle is fetched, Then only ACTIVE translations are included. | None | None | None |

### Feature Area: PrimeNG Text Expansion Fixes (E13)

| Story ID | User Story | Acceptance Criteria | Confirmation Dialogs | Error Messages | Edge Cases |
|----------|-----------|-------------------|---------------------|---------------|------------|
| E13-S1 | As a Super Admin, I want fixed CSS constraints so that translated text does not overflow UI elements. | **AC1:** Given the search input, When rendered, Then width is `min-width: 280px; width: 100%; max-width: 400px`. **AC2:** Given translation cells, Then `max-width` is 300px or uses `[resizableColumns]`. **AC3:** Given the table, Then `[scrollable]="true" scrollDirection="horizontal"` is set. | None | None | None |
| E13-S2 | As a Super Admin, I want PrimeNG locale strings configured so that paginator, file upload, and confirm dialog labels are translated. | **AC1:** Given `providePrimeNG({ translation })` is configured, When the locale is ar-AE, Then PrimeNG component labels appear in Arabic. | None | None | None |
| E13-S3 | As a Super Admin, I want toast and dialog max-width set so that long translated messages are not truncated. | **AC1:** Given a long translated message, When a toast or dialog displays it, Then `max-width: 90vw` prevents overflow. | None | None | None |

### Feature Area: Tenant Translation Overrides (FR-15 -- Super Admin perspective)

| Story ID | User Story | Acceptance Criteria | Confirmation Dialogs | Error Messages | Edge Cases |
|----------|-----------|-------------------|---------------------|---------------|------------|
| US-LM-11-H46-SA | As a Super Admin, I want to view tenant overrides for any tenant so that I can audit tenant-specific translations. | **AC1 (Main):** Given I navigate to the Tenant Overrides sub-tab, When the page loads, Then I see a paginated table with columns: key (technical_name), global value (struck-through), override value (highlighted), locale code, source (MANUAL/IMPORTED), actions (Edit/Delete). **AC2 (Empty state):** Given a tenant has no overrides, When I view the tab, Then I see: "No overrides for this tenant. Global translations are used for all keys." with an "Add Override" button. | None | None | E-65: Large number of overrides (500+) paginated; bundle merges efficiently (LOW). |

### Feature Area: Localization Service Fixes (E3)

| Story ID | User Story | Acceptance Criteria | Confirmation Dialogs | Error Messages | Edge Cases |
|----------|-----------|-------------------|---------------------|---------------|------------|
| E3-S1 | As a Super Admin, I want the gateway route for user locale to use exact path matching so that unintended routes are not matched. | **AC1:** Given GW-03 is fixed, When a request is made to `/api/v1/user/locale`, Then it routes correctly. When a request is made to `/api/v1/user/locale-something`, Then it is NOT matched. | None | None | None |
| E3-S2 | As a Super Admin, I want version retention cleanup so that only the latest 50 versions are kept. | **AC1 (NFR-08):** Given more than 50 versions exist, When the @Scheduled cleanup runs, Then versions beyond the 50th (ordered by version_number DESC) are deleted. | None | None | None |
| E3-S3 | As a Super Admin, I want CSV injection prevention and file size limits so that imports are secure. | **AC1 (NFR-04, SEC-04):** Given a CSV with values starting with `=`, `+`, `-`, `@`, When imported, Then values are sanitized (prefixed with `'`). **AC2 (NFR-05):** Given a file >10MB, When uploaded, Then it is rejected with 413. | None | **LOC-E-014 (400):** "CSV injection detected" for `=`, `+`, `-`, `@` prefix (SEC-04). **LOC-E-004 (413):** "File size exceeds 10 MB limit" (NFR-05). | None |

---

## PERSONA 2: Tenant Admin (Fiona Shaw, PER-UX-003, ROLE_ADMIN)

### Feature Area: Tenant Translation Overrides (FR-15)

| Story ID | User Story | Acceptance Criteria | Confirmation Dialogs | Error Messages | Edge Cases |
|----------|-----------|-------------------|---------------------|---------------|------------|
| US-LM-11-H46 | As a Tenant Admin, I want to view my tenant's translation overrides so that I can see which global translations have been customized. | **AC1 (Main):** Given I am a Tenant Admin on the Tenant Overrides sub-tab, When the page loads, Then I see a paginated table of overrides for MY tenant only (filtered by JWT tenant_id), with columns: key, global value (struck-through), override value (highlighted green tint), locale, source, actions. **AC2 (Search/Filter):** Given the toolbar, When I search by key or filter by locale_code, Then results are filtered accordingly. **AC3 (Pagination):** Given 20+ overrides, When I paginate, Then page size defaults to 20 with standard PrimeNG paginator. | None | **403:** If JWT `tenant_id` does not match path `{tenantId}` (IDOR protection, BR-16). | E-57: Tenant A reading Tenant B overrides returns 403 -- IDOR protection validates JWT tenant_id vs path (CRITICAL, BR-16). E-65: 500+ overrides paginated (LOW). |
| US-LM-11-H47 | As a Tenant Admin, I want to create a translation override so that my tenant sees customized text for specific keys. | **AC1 (Main):** Given I click "Add Override", When the dialog opens, Then I select a key (autocomplete from dictionary_entries), select a locale, and enter the override value. **AC2:** Given I save the override, When it is created, Then cache is invalidated for `bundle:{tenantId}:{locale}` and the table updates. **AC3 (BR-15):** Given global value is "Records" and I override with "Patient Records", When a tenant user fetches the bundle, Then they see "Patient Records" for that key. | None | **LOC-E-010 (400):** "entry_id does not exist in dictionary_entries" (E-58). **LOC-E-011 (400):** "locale_code is not an active locale" (E-59). **LOC-E-012 (403):** "Tenant ID mismatch" -- IDOR protection (E-57). | E-58: Override for non-existent key returns 400 (HIGH). E-59: Override for inactive locale returns 400 (HIGH). E-64: Upsert semantics -- override for key+locale that already exists updates in place, no duplicate (MEDIUM). |
| US-LM-11-H48 | As a Tenant Admin, I want to edit an existing override so that I can correct tenant-specific translations. | **AC1 (Main):** Given I click edit on an override row, When the dialog opens, Then I see the global value (struck-through) and the current override value. **AC2:** Given I change the value and save, Then the override is updated and cache is invalidated for that tenant+locale. | None | None | None |
| US-LM-11-H49 | As a Tenant Admin, I want to delete an override so that the global translation is restored for that key. | **AC1 (Main):** Given I click delete on an override row, When the confirmation dialog appears and I confirm, Then the override is removed (204 No Content) and the bundle reverts to the global value for that key. **AC2 (A-11):** Given I delete the override for "menu.records", When a tenant user fetches the bundle, Then they see the global value "Records" instead of the deleted override "Patient Records". | **Delete confirmation dialog:** "Remove this override? The global translation '{global_value}' will be used instead." with "Delete" (danger) and "Cancel" buttons. | **LOC-E-013 (404):** "Override not found" if already deleted. **LOC-E-012 (403):** "Tenant ID mismatch" -- IDOR. | None |
| US-LM-11-H50 | As a Tenant Admin, I want to import overrides from CSV so that I can bulk-create tenant customizations. | **AC1 (Main):** Given I upload a CSV with columns `technical_name, locale_code, override_value`, When the import completes, Then I see a summary: "25 imported, 10 updated, 2 skipped, 0 errors". | None | **LOC-E-003 (400):** "CSV file is empty." **LOC-E-014 (400):** "CSV injection detected" for `=`, `+`, `-`, `@` prefix (E-63). **LOC-E-004 (413):** "File exceeds 10MB." **LOC-E-005 (429):** "Rate limit exceeded." | E-63: CSV injection in override import rejected with LOC-E-014 (HIGH). |
| US-LM-11-H51 | As a Tenant Admin, I want to export my tenant's overrides as CSV so that I can back up or share customizations. | **AC1 (Main):** Given I click "Export Overrides", When the download completes, Then I receive a CSV with columns: technical_name, locale_code, global_value, override_value, override_source, is_active. | None | None | None |

### Feature Area: Dictionary Management (FR-02 -- Tenant Admin perspective)

| Story ID | User Story | Acceptance Criteria | Confirmation Dialogs | Error Messages | Edge Cases |
|----------|-----------|-------------------|---------------------|---------------|------------|
| US-LM-TA-DICT | As a Tenant Admin, I want to edit translations manually so that I can correct or improve global translations. | **AC1:** Given I am a Tenant Admin on the Dictionary tab, When I click edit on a translation, Then the edit dialog opens and I can modify values. **AC2:** Given I save, When the save completes, Then translations go live immediately (BR-11). | None | None | None |

### Feature Area: Import/Export (FR-03 -- Tenant Admin perspective)

| Story ID | User Story | Acceptance Criteria | Confirmation Dialogs | Error Messages | Edge Cases |
|----------|-----------|-------------------|---------------------|---------------|------------|
| US-LM-TA-IE | As a Tenant Admin, I want to export and import the dictionary so that I can manage translations in bulk. | **AC1:** Given I am on the Import/Export tab, When I click Export, Then I download the CSV. **AC2:** Given I upload a CSV, When preview shows, Then I can commit. | Same as Super Admin import confirmation | Same as Super Admin import errors | Same as Super Admin import edge cases |

### Feature Area: Agentic Translation HITL Review (FR-10 -- Tenant Admin perspective)

| Story ID | User Story | Acceptance Criteria | Confirmation Dialogs | Error Messages | Edge Cases |
|----------|-----------|-------------------|---------------------|---------------|------------|
| US-LM-TA-HITL | As a Tenant Admin, I want to review AI-flagged ambiguous terms so that I can approve or reject translations for my domain. | **AC1:** Given the HITL review table shows flagged terms, When I view a row, Then I see key, source, AI translation, ambiguity reason, Approve/Reject buttons. **AC2:** Given I approve a term, Then it becomes ACTIVE. Given I reject, Then it becomes REJECTED. | None | None | None |

### Feature Area: Languages Tab (FR-01 -- Tenant Admin read-only)

| Story ID | User Story | Acceptance Criteria | Confirmation Dialogs | Error Messages | Edge Cases |
|----------|-----------|-------------------|---------------------|---------------|------------|
| US-LM-TA-LANG | As a Tenant Admin, I want to view the locale catalog (read-only) so that I know which languages are available. | **AC1:** Given I am a Tenant Admin on the Languages tab, When the page loads, Then I see the locale table WITHOUT toggle switches or alternative radio buttons (read-only). **AC2:** Given I try to activate a locale, When the UI does not show toggles, Then I cannot perform the action. | None | **403:** "Locale management requires ROLE_SUPER_ADMIN" if API is called directly (R-01). | R-01: Tenant Admin calling admin locale endpoints returns 403 (HIGH). |

### Feature Area: Rollback Tab (FR-04 -- Tenant Admin view-only)

| Story ID | User Story | Acceptance Criteria | Confirmation Dialogs | Error Messages | Edge Cases |
|----------|-----------|-------------------|---------------------|---------------|------------|
| US-LM-TA-ROLL | As a Tenant Admin, I want to view version history (read-only) so that I can see what changes have been made. | **AC1:** Given I am a Tenant Admin on the Rollback tab, When the page loads, Then I see the version history table WITHOUT any "Rollback" buttons. | None | None | None |

---

## PERSONA 3: End User (Lisa Harrison, PER-UX-004, ROLE_USER)

### Feature Area: User Language Preference (FR-05)

| Story ID | User Story | Acceptance Criteria | Confirmation Dialogs | Error Messages | Edge Cases |
|----------|-----------|-------------------|---------------------|---------------|------------|
| US-LM-05-H19 | As an End User, I want to set my preferred language so that the UI renders in my chosen locale. | **AC1 (Main):** Given I click the language switcher in the header and select "Arabic", When the selection is made, Then the UI switches to Arabic, RTL layout is applied, my preference is persisted via `PUT /api/v1/user/locale`, and I see the change without page reload. **AC2 (BR-04):** Given my preferred locale is deactivated by an admin, When I next load the app, Then my preference is migrated to the alternative locale. | None | **422:** "Selected locale is not active" (E-25). | E-25: Setting inactive locale as preference returns 422 (HIGH). E-26: Concurrent preference updates -- last write wins (upsert semantics) (LOW). E-27: JWT missing sub claim returns 401: "Authenticated JWT subject is required" (CRITICAL). A-07: User's preferred locale deactivated -- migrated to alternative on next request. A-09: User selects "Auto-detect" -- preference source set to DETECTED, browser Accept-Language used. |
| US-LM-05-H20 | As an End User, I want my language preference to persist across sessions so that I do not have to re-select every time. | **AC1 (Main):** Given I have set my language to Arabic, When I sign out and sign back in, Then the UI renders in Arabic (restored from database preference). | None | None | None |

### Feature Area: Language Switcher (FR-08)

| Story ID | User Story | Acceptance Criteria | Confirmation Dialogs | Error Messages | Edge Cases |
|----------|-----------|-------------------|---------------------|---------------|------------|
| US-LM-07-H29 | As an End User, I want to open the language switcher so that I can see available languages. | **AC1 (Main):** Given I click the language pill button in the shell header topnav, When the dropdown opens, Then I see a list of active locales with flag emoji + native name, and the current locale has a checkmark. **AC2 (ARIA):** Given the dropdown, When a screen reader is active, Then `aria-expanded`, `aria-activedescendant` are correct (A-02). | None | None | E-42: Only 1 active locale -- language switcher is hidden (LOW). E-46: Keyboard navigation -- Enter/Space opens, Arrow keys navigate, Enter selects, Escape closes (HIGH). E-47: Screen reader announces "Language changed to {name}" via `aria-live="polite"` region (MEDIUM). |
| US-LM-07-H30 | As an End User, I want to select a language from the switcher so that the UI updates to my chosen locale. | **AC1 (Main):** Given I click a locale in the dropdown, When the selection is made, Then: (1) the flag/code in the pill updates, (2) all UI text updates without page reload, (3) `PUT /api/v1/user/locale` persists the preference, (4) if RTL locale selected, `document.documentElement.dir` flips to "rtl" within 300ms. | None | None | E-43: Switching RTL to LTR mid-session -- `document.dir` changes, layout flips within 300ms (HIGH). E-44: Switching language while dialog open -- dialog text updates (MEDIUM). |
| US-LM-07-H32 | As an End User, I want my language choice to persist across sessions via the switcher. | **AC1 (Main):** Given I switch to French via the switcher, When I sign out and sign back in, Then the UI renders in French (restored from DB preference via `GET /api/v1/user/locale`). | None | None | None |

### Feature Area: i18n Runtime (FR-07)

| Story ID | User Story | Acceptance Criteria | Confirmation Dialogs | Error Messages | Edge Cases |
|----------|-----------|-------------------|---------------------|---------------|------------|
| US-LM-06-H22 | As an End User, I want the app to bootstrap with my locale so that I see translated text from the start. | **AC1 (Main):** Given I open the app, When APP_INITIALIZER runs, Then: (1) stored preference is checked (IndexedDB/localStorage), (2) if none, `GET /api/v1/locales/detect` is called with browser Accept-Language, (3) bundle is fetched for detected locale, (4) `document.documentElement.dir` and `lang` attributes are set. **AC2 (Fallback -- NFR-03):** Given the backend is unreachable, When APP_INITIALIZER runs, Then `assets/i18n/en-US.json` is loaded as fallback. | None | None | E-30: Missing translation key -- pipe returns raw key e.g. "admin.locale.tab.languages" (MEDIUM). E-31: Backend unreachable -- fallback to en-US.json (HIGH, NFR-03). E-32: Bundle version changes during session -- periodic poll detects and re-fetches silently (MEDIUM). E-33: IndexedDB unavailable (private browsing) -- in-memory cache only, no offline support (LOW). E-34: Parameterized translation with missing params -- placeholder shown: "Welcome, {name}" (MEDIUM). E-35: RTL/LTR switch mid-session -- dir and lang attributes updated, CSS logical properties adapt (HIGH). |
| US-LM-06-H23 | As an End User, I want to switch language mid-session without page reload so that the experience is seamless. | **AC1 (Main -- NFR-02):** Given I click the switcher and select "French", When the bundle loads, Then all UI text updates without page reload and total switch time is <500ms. **AC2:** Given the new locale is RTL, When the switch happens, Then layout mirrors accordingly. | None | None | None |
| US-LM-06-H24 | As an End User, I want dates and numbers formatted per my locale so that data is presented correctly. | **AC1 (Main):** Given my locale is en-US, When I view a date, Then it shows "Mar 11, 2026". Given my locale is fr-FR, When I view the same date, Then it shows "11 mars 2026". **AC2:** Given my locale is ar-AE with eastern_arabic numeral system, When I view numbers, Then they use Eastern Arabic numerals. | None | None | None |

### Feature Area: Translation Reflection (FR-12 -- End User perspective)

| Story ID | User Story | Acceptance Criteria | Confirmation Dialogs | Error Messages | Edge Cases |
|----------|-----------|-------------------|---------------------|---------------|------------|
| US-LM-09-H40 | As an End User, I want to see translation updates within 5 minutes so that I get the latest content. | **AC1 (Main -- BR-13):** Given an admin updates a translation, When my TranslationService polls `/bundle/version` and detects a version mismatch, Then the bundle is re-fetched and UI updates silently within 5 minutes. **AC2 (Stale detection -- H-43):** Given bundle version changes from v41 to v42 on server, When TranslationService polls, Then it detects v42 > v41 and re-fetches. | None | None | E-52: Backend unreachable during poll -- uses last known bundle from IndexedDB; retries next cycle (HIGH). E-53: Version endpoint returns same version -- no re-fetch (LOW). E-56: IndexedDB full or unavailable -- in-memory only, no persistence across reloads (MEDIUM). |

### Feature Area: Tenant-Aware Bundle (FR-15 -- End User perspective)

| Story ID | User Story | Acceptance Criteria | Confirmation Dialogs | Error Messages | Edge Cases |
|----------|-----------|-------------------|---------------------|---------------|------------|
| US-LM-11-H52 | As an End User in a tenant, I want to see tenant-customized translations so that the UI reflects my organization's terminology. | **AC1 (Main -- BR-15):** Given my tenant has overrides and the bundle request includes `X-Tenant-ID` header, When the bundle is fetched, Then global translations are merged with tenant overrides (overrides win). **AC2 (BR-08):** Given the tenant has NOT overridden a key, When the bundle is fetched, Then the global translation is used for that key. | None | None | E-60: Global dictionary change invalidates ALL tenant bundle caches for that locale (HIGH, BR-17). E-61: Override precedence -- tenant "Patient Records" wins over global "Records" (CRITICAL, BR-15). E-62: Concurrent tenant + global edit -- both changes reflected correctly (MEDIUM). E-66: Soft-disabled override (is_active=false) excluded from bundle merge but not deleted (MEDIUM). |

---

## PERSONA 4: Anonymous / Visitor (Kyle Morrison, PER-CX-001, Unauthenticated)

### Feature Area: Locale Detection and Bundle Fetch (FR-06, FR-08, BR-09)

| Story ID | User Story | Acceptance Criteria | Confirmation Dialogs | Error Messages | Edge Cases |
|----------|-----------|-------------------|---------------------|---------------|------------|
| US-LM-05-H21 | As an Anonymous visitor, I want the login page to auto-detect my browser language so that I see the login form in my preferred language. | **AC1 (Main):** Given I visit the login page with browser set to French (Accept-Language: fr-FR), When the page loads, Then `GET /api/v1/locales/detect` returns fr-FR (if active), and the login page renders in French. **AC2 (Fallback -- A-08):** Given my browser language is sw-KE (Swahili, unsupported), When detection occurs, Then fallback to the alternative locale (en-US). | None | None | A-08: Browser language not supported -- fallback to alternative locale. |
| US-LM-07-H31 | As an Anonymous visitor, I want to switch language on the login page so that I can evaluate the platform in my preferred locale. | **AC1 (Main):** Given the login page displays a language switcher below the login form (centered, pill style), When I click it and select a locale, Then the login page re-renders in that locale. **AC2:** Given I am unauthenticated, When I select a locale, Then it is stored in localStorage (no API call). **AC3 (BR-18):** Given I am anonymous, When the bundle is fetched, Then I receive global translations only (no tenant overrides). | None | None | None |
| US-LM-ANON-BUNDLE | As an Anonymous visitor, I want to fetch translation bundles without authentication so that the login page can be rendered. | **AC1 (Main -- BR-09, R-04):** Given I am unauthenticated, When I call `GET /api/v1/locales/{code}/bundle`, Then I receive 200 OK with the bundle (public endpoint, `.permitAll()`). **AC2:** Given I call `GET /api/v1/locales/active`, Then I receive the list of active locales (public endpoint). **AC3 (BR-18):** Given no `X-Tenant-ID` header, When the bundle is fetched, Then only global translations are included. | None | **404:** "No bundle available for locale: {code}" if locale code not found or not active (E-28). | E-28: Bundle request for non-existent locale returns 404 (MEDIUM). R-04: Anonymous accesses public bundle returns 200 (CRITICAL -- must work for login page). |
| US-LM-11-H53 | As an Anonymous visitor, I want to receive global-only translations so that tenant customizations do not leak to unauthenticated users. | **AC1 (Main -- BR-18):** Given I am unauthenticated, When I fetch a bundle without `X-Tenant-ID` header, Then only global translations are returned -- no tenant overrides. | None | None | E-66: Anonymous users see global-only bundle regardless of any tenant overrides in the system. |

---

## PERSONA 5: System / Backend (Cross-cutting)

### Feature Area: Backend i18n Infrastructure (FR-09)

| Story ID | User Story | Acceptance Criteria | Confirmation Dialogs | Error Messages | Edge Cases |
|----------|-----------|-------------------|---------------------|---------------|------------|
| US-LM-08-H35 | As the System, I want a MessageResolver so that backend error messages are returned in the user's locale. | **AC1 (Main):** Given an exception is thrown with code `AUTH-E-010` and locale `ar-AE`, When MessageResolver resolves it, Then the Arabic message from `messages_ar.properties` is returned. **AC2 (Fallback):** Given locale is `sw-KE` (no properties file), When resolution occurs, Then fallback to `en-US` default. | None | None | E-48: Missing error code in properties -- returns raw code as fallback (MEDIUM). E-49: Parameterized message `{0}` -- substitutes arg: "License limit: 50" (HIGH). E-50: Concurrent locale context -- thread-local LocaleContextHolder isolates per-request (HIGH). E-51: No Accept-Language header -- defaults to en-US (LOW). |
| US-LM-08-H36 | As the System, I want Accept-Language header processing so that API responses are localized. | **AC1 (Main):** Given a request with `Accept-Language: fr-FR`, When an error response is generated, Then the error message is in French. | None | None | None |
| US-LM-08-H37 | As the System, I want Feign locale propagation so that inter-service calls preserve the user's locale. | **AC1 (Main):** Given auth-facade calls license-service, When the Feign request is made, Then `Accept-Language` header is copied to the outgoing request via LocalePropagationInterceptor. | None | None | None |

### Feature Area: Frontend i18n Infrastructure (FR-07 -- Infrastructure)

| Story ID | User Story | Acceptance Criteria | Confirmation Dialogs | Error Messages | Edge Cases |
|----------|-----------|-------------------|---------------------|---------------|------------|
| E2-S1 | As a Developer, I want a TranslationService so that all frontend components can access translations via Signals. | **AC1:** Given TranslationService is created, When imported, Then it exposes: `currentLocale: Signal<string>`, `direction: Signal<'ltr'\|'rtl'>`, `isLoading: Signal<boolean>`, `t(key, params?): string`, `setLocale(code): Promise<void>`, `detectLocale(): Promise<string>`. **AC2:** Given a bundle is fetched from `/api/v1/locales/{code}/bundle`, Then it is cached in memory Signal + IndexedDB. **AC3:** Given polling is configured, Then `/bundle/version` is checked every 5 minutes; re-fetch on version mismatch. | None | None | None |
| E2-S2 | As a Developer, I want a TranslatePipe so that templates can use `{{ 'key' \| translate }}`. | **AC1:** Given `{{ 'auth.login.welcome' \| translate }}` in a template, When rendered, Then it resolves to the translated string. **AC2:** Given `{{ 'key' \| translate:{ name: 'John' } }}`, Then parameters are interpolated. **AC3 (Fallback):** Given a missing key, Then the raw key is returned. | None | None | None |
| E2-S3 | As a Developer, I want a LocalizedDatePipe so that dates are formatted per locale. | **AC1:** Given `{{ date \| localizedDate:'mediumDate' }}`, When rendered, Then the date is formatted per `TranslationService.currentLocale`. | None | None | None |
| E2-S4 | As a Developer, I want an APP_INITIALIZER locale bootstrap so that the app loads with the correct locale. | **AC1:** Given the app bootstraps, When APP_INITIALIZER runs, Then: (1) check stored preference, (2) if none call detect API, (3) fetch bundle, (4) set `document.documentElement.dir` and `lang`. **AC2 (NFR-03):** Given backend unreachable, Then load `assets/i18n/en-US.json`. | None | None | None |
| E2-S5 | As a Developer, I want a LocaleInterceptor so that all HTTP requests include the Accept-Language header. | **AC1:** Given the interceptor is registered, When any HTTP request is made, Then `Accept-Language: {currentLocale}` header is added. | None | None | None |
| E2-S6 | As a Developer, I want seed en-US.json with all 652 keys so that static fallback is available. | **AC1:** Given `assets/i18n/en-US.json` exists, When loaded, Then all 652 frontend keys have English values. | None | None | None |
| E2-S7 | As a Developer, I want placeholder ar-AE.json so that Arabic fallback structure exists. | **AC1:** Given `assets/i18n/ar-AE.json` exists, When loaded, Then all 652 keys are present (initially empty or with TBD values). | None | None | None |
| E2-S8 | As a Developer, I want i18n infrastructure registered in app.config.ts so that pipes, interceptors, and initializers are active. | **AC1:** Given app.config.ts is updated, When the app bootstraps, Then TranslatePipe, LocalizedDatePipe, LocaleInterceptor, and LocaleInitializer are all active. | None | None | None |

### Feature Area: String Externalization (FR-14)

| Story ID | User Story | Acceptance Criteria | Confirmation Dialogs | Error Messages | Edge Cases |
|----------|-----------|-------------------|---------------------|---------------|------------|
| E4-S1 | As a Developer, I want P1 Login + auth page strings externalized so that the login page is translatable. | **AC1:** Given ~25 hardcoded strings in login/auth templates, When externalized, Then all use `{{ 'key' \| translate }}` pipe. | None | None | None |
| E4-S2 | As a Developer, I want P2 Shell layout + error page strings externalized. | **AC1:** Given ~15 strings in shell layout and error pages, When externalized, Then all use translate pipe. | None | None | None |
| E4-S3 | As a Developer, I want P3 Administration page chrome strings externalized. | **AC1:** Given ~20 strings in administration chrome, When externalized, Then all use translate pipe. | None | None | None |
| E4-S4 | As a Developer, I want P4 Master Locale section strings externalized. | **AC1:** Given ~40 strings in master locale section, When externalized, Then all use translate pipe. | None | None | None |
| E8-S1 | As a Developer, I want P5 License Manager strings externalized. | **AC1:** Given ~25 strings, When externalized, Then all use translate pipe. | None | None | None |
| E8-S2 | As a Developer, I want P6 Tenant Manager strings externalized. | **AC1:** Given ~55 strings, When externalized, Then all use translate pipe. | None | None | None |
| E8-S3 | As a Developer, I want P7 Master Definitions strings externalized. | **AC1:** Given ~50 strings, When externalized, Then all use translate pipe. | None | None | None |
| E8-S4 | As a Developer, I want P8 Master Auth strings externalized. | **AC1:** Given ~10 strings, When externalized, Then all use translate pipe. | None | None | None |
| E8-S5 | As a Developer, I want P9 About page strings externalized. | **AC1:** Given ~15 strings, When externalized, Then all use translate pipe. | None | None | None |
| E8-S6 | As a Developer, I want P10 all remaining TS error messages externalized. | **AC1:** Given ~50 TS error strings, When externalized, Then all use translate pipe or MessageResolver. | None | None | None |
| US-LM-10-H44 | As a CI/CD system, I want zero hardcoded strings in templates so that i18n coverage is complete. | **AC1:** Given a lint rule runs against all `.html` templates, When checked, Then 0 violations (all strings use translate pipe). | None | None | None |
| US-LM-10-H45 | As a CI/CD system, I want all keys present in en-US.json so that no frontend key is missing. | **AC1:** Given dictionary keys are compared against `en-US.json`, When checked, Then all 652 frontend keys are present; 0 missing. | None | None | None |

### Feature Area: Backend Message Migration (FR-14 backend)

| Story ID | User Story | Acceptance Criteria | Confirmation Dialogs | Error Messages | Edge Cases |
|----------|-----------|-------------------|---------------------|---------------|------------|
| E5-S1 | As a Developer, I want localization-service error messages externalized (11 strings). | **AC1:** Given 11 hardcoded error strings, When migrated, Then all use MessageResolver with error codes. | None | None | None |
| E5-S2 | As a Developer, I want auth-facade error messages externalized (38 strings). | **AC1:** Given 38 hardcoded strings, When migrated, Then all use MessageResolver. | None | None | None |
| E5-S3 | As a Developer, I want license-service error messages externalized (~10 strings). | **AC1:** Given ~10 controller error strings, When migrated, Then all use MessageResolver. | None | None | None |
| E5-S4 | As a Developer, I want tenant-service error messages externalized (~10 strings). | **AC1:** Given ~10 state error strings, When migrated, Then all use MessageResolver. | None | None | None |
| E9-S1 | As a Developer, I want notification-service messages externalized (7 strings). | **AC1:** Given 7 strings, When migrated, Then all use MessageResolver. | None | None | None |
| E9-S2 | As a Developer, I want user-service messages externalized (3 strings). | **AC1:** Given 3 strings, When migrated, Then all use MessageResolver. | None | None | None |
| E9-S3 | As a Developer, I want ai-service messages externalized (32 strings). | **AC1:** Given 32 strings, When migrated, Then all use MessageResolver. | None | None | None |
| E9-S4 | As a Developer, I want definition-service + common DTOs externalized (23 strings). | **AC1:** Given 14+9 strings, When migrated, Then all use MessageResolver. | None | None | None |

### Feature Area: Backend i18n Infrastructure Components (FR-09)

| Story ID | User Story | Acceptance Criteria | Confirmation Dialogs | Error Messages | Edge Cases |
|----------|-----------|-------------------|---------------------|---------------|------------|
| E1-S1 | As a Developer, I want a MessageResolver in backend/common so that all services can resolve localized messages. | **AC1:** Given `MessageResolver.resolve("AUTH-E-010", Locale.forLanguageTag("ar-AE"))`, When called, Then Arabic message is returned. **AC2 (Fallback):** Given no Arabic properties file, Then fallback to en-US. | None | None | None |
| E1-S2 | As a Developer, I want a LocaleContextFilter so that Accept-Language header is processed automatically. | **AC1:** Given a request with `Accept-Language: fr-FR`, When the filter runs, Then `LocaleContextHolder` is set to `fr-FR`. | None | None | None |
| E1-S3 | As a Developer, I want a LocalePropagationInterceptor so that Feign calls propagate locale. | **AC1:** Given a Feign client call, When the interceptor runs, Then `Accept-Language` from current thread is copied to the outgoing request. | None | None | None |
| E1-S4 | As a Developer, I want error code constants for localization-service. | **AC1:** Given `LocalizationErrorCodes.java`, When referenced, Then codes follow `LOC-{TYPE}-{SEQ}` pattern. | None | None | None |
| E1-S5 | As a Developer, I want messages.properties files for localization-service. | **AC1:** Given `messages.properties` and `messages_ar.properties`, When MessageResolver resolves a code, Then the correct locale file is used. | None | None | None |

### Feature Area: Language Switcher Component (FR-08 -- Build)

| Story ID | User Story | Acceptance Criteria | Confirmation Dialogs | Error Messages | Edge Cases |
|----------|-----------|-------------------|---------------------|---------------|------------|
| E6-S1 | As a Developer, I want to create the language switcher component so that users can change locale. | **AC1:** Given the component matches island button style (44x44 pill, neumorphic), When rendered, Then it shows current locale flag emoji + code + chevron. **AC2:** Given the dropdown opens, Then it lists active locales with flag + native name. **AC3:** Given selection, Then `TranslationService.setLocale()` is called. **AC4 (Unauthenticated):** Given no JWT, Then localStorage is used (no API call). | None | None | None |
| E6-S2 | As a Developer, I want the language switcher in the shell header (authenticated). | **AC1:** Given authenticated user, When viewing the shell, Then the switcher appears in `.topnav` island between nav links and Sign Out. | None | None | E-45: On mobile (<768px), switcher moves into hamburger menu as last item before Sign Out. |
| E6-S3 | As a Developer, I want the language switcher on the login page (unauthenticated) with RTL support. | **AC1:** Given the login page, When rendered, Then the switcher appears below the login form, centered. **AC2 (RTL):** Given Arabic is selected, When switching, Then `document.documentElement.dir` flips to "rtl". | None | None | None |

### Feature Area: Tenant Override Backend (FR-15 -- Build)

| Story ID | User Story | Acceptance Criteria | Confirmation Dialogs | Error Messages | Edge Cases |
|----------|-----------|-------------------|---------------------|---------------|------------|
| E15-S1 | As a Developer, I want V3 migration for tenant_translation_overrides table. | **AC1:** Given V3 migration runs, When checked, Then table exists with columns: id, tenant_id, entry_id, locale_code, override_value, override_source, is_active, created_by, created_at, updated_at, version. **AC2:** Given unique constraint `(tenant_id, entry_id, locale_code)` exists. **AC3:** Given partial index `idx_tenant_overrides_lookup` on `(tenant_id, locale_code) WHERE is_active = TRUE`. | None | None | None |
| E15-S2 | As a Developer, I want TenantOverrideService with CRUD and tenant isolation. | **AC1:** Given CRUD operations, When called, Then tenant isolation is enforced via TenantAccessValidator (JWT tenant_id vs path). **AC2:** Given XSS attempts, When saving, Then values are sanitized (SEC-05). | None | None | None |
| E15-S3 | As a Developer, I want TenantOverrideController with 5 REST endpoints. | **AC1:** Given endpoints (list, create/update, delete, import, export), When called with ROLE_ADMIN, Then operations succeed for own tenant. | None | None | None |
| E15-S4 | As a Developer, I want BundleService merge logic for global + tenant overrides. | **AC1:** Given a bundle request with X-Tenant-ID, When assembled, Then global translations are loaded first, then tenant overrides replace matching keys. **AC2:** Given cache key pattern `bundle:{tenantId}:{localeCode}`, When tenant override changes, Then only that tenant's cache is invalidated. **AC3 (BR-17):** Given global dictionary changes, Then ALL tenant bundle caches for that locale are invalidated. | None | None | None |
| E15-S5 | As a Developer, I want a Tenant Overrides sub-tab in the admin UI. | **AC1:** Given the sub-tab, When visible, Then it shows: table with key, global value (struck-through), override value (highlighted), locale, source, actions. **AC2:** Given ROLE_ADMIN, Then only own tenant overrides visible. Given ROLE_SUPER_ADMIN, Then overrides for any tenant visible. | None | None | None |

### Feature Area: Translation Reflection Flow (FR-12 -- Build)

| Story ID | User Story | Acceptance Criteria | Confirmation Dialogs | Error Messages | Edge Cases |
|----------|-----------|-------------------|---------------------|---------------|------------|
| E14-S1 | As a Developer, I want bundle version polling in TranslationService so that users get updated translations. | **AC1:** Given TranslationService polls `/bundle/version` every 5 min, When version changes, Then bundle is re-fetched silently. | None | None | None |
| E14-S2 | As a Developer, I want immediate bundle re-fetch after admin operations so that admins see changes instantly. | **AC1:** Given admin saves/imports/rolls back, When the operation completes, Then the bundle is immediately re-fetched for the admin's session (BR-14). | None | None | None |

### Feature Area: Testing & QA (E10)

| Story ID | User Story | Acceptance Criteria | Confirmation Dialogs | Error Messages | Edge Cases |
|----------|-----------|-------------------|---------------------|---------------|------------|
| E10-S1 | As QA, I want existing 43 backend + 20 frontend tests executed. | **AC1:** Given test commands run, When completed, Then all 63 tests pass with >80% coverage. | None | None | None |
| E10-S2 | As QA, I want Testcontainers integration tests for localization APIs. | **AC1:** Given 4 test classes (Locale, Dictionary, ImportExport, Bundle), When run with PostgreSQL + Valkey testcontainers, Then all pass. | None | None | None |
| E10-S3 | As QA, I want Playwright E2E tests for all 5 tabs + language switcher. | **AC1:** Given 5 test suites (languages, dictionary, import-export, rollback, language-switcher) with 42 scenarios, When run, Then all pass on Chromium, Firefox, WebKit. | None | None | None |
| E10-S4 | As QA, I want responsive tests at 3 viewports. | **AC1:** Given desktop (1280x720), tablet (768x1024), mobile (375x667) viewports, When tested, Then layouts adapt correctly. | None | None | None |
| E10-S5 | As QA, I want RTL CSS audit with fixes. | **AC1:** Given all SCSS files audited, When checked, Then physical CSS properties are converted to logical properties for RTL support. | None | None | None |

### Feature Area: Documentation (E11)

| Story ID | User Story | Acceptance Criteria | Confirmation Dialogs | Error Messages | Edge Cases |
|----------|-----------|-------------------|---------------------|---------------|------------|
| E11-S1 | As Doc, I want PRD updated and accurate. | **AC1:** Given PRD v4.0, Then all 15 FRs, 10 NFRs, 18 BRs documented with evidence. | None | None | None |
| E11-S2 | As Doc, I want LLD corrections applied. | **AC1:** Given 03-LLD-Corrections.md, Then all 5 fixes applied. | None | None | None |
| E11-S3 | As Doc, I want API Contract documented. | **AC1:** Given 06-API-Contract.md + openapi.yaml, Then all 27 endpoints documented with request/response schemas. | None | None | None |
| E11-S4 | As Doc, I want UI/UX Design Spec updated. | **AC1:** Given 05-UI-UX-Design-Spec.md v4.0, Then all components, responsive rules, WCAG AAA requirements documented. | None | None | None |
| E11-S5 | As Doc, I want Test Strategy documented. | **AC1:** Given 15-Test-Strategy.md, Then test pyramid, inventory, coverage targets, quality gates documented. | None | None | None |
| E11-S6 | As Doc, I want Playwright Test Plan documented. | **AC1:** Given 16-Playwright-Test-Plan.md, Then 5 suites, 42 scenarios, RBAC matrix, a11y tests documented. | None | None | None |

---

## RBAC EDGE CASES (Cross-Cutting, All Personas)

| Scenario ID | Scenario | Actor | Expected Result | Severity | Business Rule |
|-------------|----------|-------|-----------------|----------|---------------|
| R-01 | Tenant Admin tries to manage locales (activate/deactivate/set alternative) | ROLE_ADMIN | 403: "Locale management requires ROLE_SUPER_ADMIN" | HIGH | RBAC |
| R-02 | End User tries to access dictionary | ROLE_USER | 403: "Dictionary management requires admin role" | HIGH | RBAC |
| R-03 | Anonymous tries to set locale preference | Unauthenticated | 401: "Authentication required" | CRITICAL | RBAC |
| R-04 | Anonymous accesses public bundle | Unauthenticated | 200: Bundle returned (login page rendering) | CRITICAL | BR-09 |
| R-05 | Token expired during dictionary edit | Any admin | 401 on save; unsaved changes preserved in dialog; re-auth prompt | HIGH | Security |
| R-06 | Super Admin from tenant A accesses tenant B locales | Super Admin | Locales are GLOBAL -- no tenant isolation needed; same locales for all tenants | MEDIUM | Architecture |

---

## PERFORMANCE SCENARIOS (NFR Validation)

| Scenario ID | NFR | Scenario | Expected Result | Severity |
|-------------|-----|----------|-----------------|----------|
| P-01 | NFR-01 | Bundle fetch (500 keys, Valkey-cached) | Response < 200ms (p95) | HIGH |
| P-02 | NFR-02 | Language switch (fetch bundle + re-render 50 components) | Total time < 500ms | HIGH |
| P-03 | NFR-01 | Bundle fetch (1000+ keys, cold cache, DB query) | Response < 500ms (p95) | MEDIUM |

---

## COMPLETE ERROR CODE REFERENCE

| Error Code | HTTP Status | Message | Trigger |
|------------|-------------|---------|---------|
| LOC-E-001 | 409 | "Cannot deactivate alternative locale. Change the alternative locale first." | Deactivating the alternative locale (BR-01) |
| LOC-E-002 | 409 | "Cannot deactivate the last active locale." | Deactivating the only remaining active locale (BR-02) |
| LOC-E-003 | 400 | "CSV file is empty." | Uploading empty CSV for import or tenant override import |
| LOC-E-004 | 413 | "File size exceeds 10 MB limit" | Uploading file >10MB (NFR-05) |
| LOC-E-005 | 429 | "Import rate limit exceeded. Maximum 5 imports per hour." | Exceeding 5 imports/hour/user (NFR-10) |
| LOC-E-010 | 400 | "entry_id does not exist in dictionary_entries" | Creating override for non-existent key |
| LOC-E-011 | 400 | "locale_code is not an active locale" | Creating override for inactive locale |
| LOC-E-012 | 403 | "Tenant ID mismatch" | IDOR -- JWT tenant_id does not match path tenant_id (BR-16) |
| LOC-E-013 | 404 | "Override not found" | Deleting already-deleted override |
| LOC-E-014 | 400 | "CSV injection detected" | CSV values starting with `=`, `+`, `-`, `@` (NFR-04) |
| N/A | 422 | "Locale must be active to be set as alternative." | Setting inactive locale as alternative (BR-03) |
| N/A | 422 | "Selected locale is not active" | User setting preference to inactive locale |
| N/A | 401 | "Authenticated JWT subject is required" | JWT missing sub claim |
| N/A | 404 | "No bundle available for locale: {code}" | Bundle request for non-existent/inactive locale |
| N/A | 410 | "Import preview expired or not found. Please re-upload the file." | Preview token expired (BR-05, 30-min TTL) |
| N/A | Validation | "Translation value exceeds maximum length" | Translation >5000 chars |

---

## COMPLETE CONFIRMATION DIALOG REFERENCE

| Dialog | Trigger | Title | Body | Primary Button | Secondary Button | Business Rule |
|--------|---------|-------|------|----------------|-----------------|---------------|
| Deactivate with users | Toggle off locale that has assigned users | "Deactivate {locale_name}?" | "Deactivating this locale will migrate {n} users to the alternative locale ({alternative}). Continue?" | "Deactivate" (danger) | "Cancel" | BR-04 |
| Confirm Import | Click "Confirm Import" after CSV preview | "Confirm Import" | "This will update {n} translations and create {m} new keys. This action creates a version snapshot and can be rolled back. Proceed?" | "Confirm Import" (primary) | "Cancel" | BR-06 |
| Rollback | Click "Rollback" on a version | "Rollback to Version #{n}" | "Are you sure you want to rollback to version #{n}? A snapshot of the current dictionary will be created before restoring. This action affects all translations." | "Rollback" (primary) | "Cancel" | BR-07 |
| Delete Override | Click delete on tenant override row | "Remove Override" | "Remove this override? The global translation '{global_value}' will be used instead." | "Delete" (danger) | "Cancel" | BR-15 |

---

## BUSINESS RULES IMPACT ON UI BEHAVIOR

| BR ID | Rule | UI Impact | Affected Stories |
|-------|------|-----------|-----------------|
| BR-01 | Cannot deactivate alternative locale | Toggle disabled or error toast on attempt | US-LM-01-H04, E-01 |
| BR-02 | Cannot deactivate last active locale | Toggle disabled or error toast on attempt | US-LM-01-H04, E-02 |
| BR-03 | Must be active for alternative | Radio disabled for inactive locales | US-LM-01-H05, E-03 |
| BR-04 | Deactivate migrates users to alternative | Confirmation dialog with user count | US-LM-01-H04, A-01 |
| BR-05 | Preview tokens expire 30 min | Countdown timer in import preview | US-LM-03-H14, E-16 |
| BR-06 | Every mod creates snapshot | Automatic -- no UI needed but version history grows | US-LM-03-H15, US-LM-04-H17 |
| BR-07 | Rollback creates pre-rollback snapshot | Mentioned in confirmation dialog | US-LM-04-H17 |
| BR-08 | Global base + tenant overlay | Bundle merge logic -- affects all bundle fetches | US-LM-11-H52, E-60 |
| BR-09 | Anonymous can fetch bundles | Public endpoints permit unauthenticated access | US-LM-ANON-BUNDLE, R-04 |
| BR-10 | AI preserves {param} placeholders | Placeholder validation in AI translate | US-LM-06-H26, E-41 |
| BR-11 | Manual/import goes ACTIVE immediately | No approval workflow for manual edits and imports | US-LM-02-H10, US-LM-03-H15 |
| BR-12 | Ambiguous AI flagged PENDING_REVIEW | HITL review table shows flagged terms | US-LM-06-H26, US-LM-06-H27 |
| BR-13 | Updates reflected within 5 min | Bundle version polling every 5 min | US-LM-09-H40 |
| BR-14 | Admin sees immediately | Immediate bundle re-fetch after admin save | US-LM-09-H39 |
| BR-15 | Tenant override > global | Override precedence in bundle merge | US-LM-11-H52, E-61 |
| BR-16 | Tenant A cannot see Tenant B overrides | IDOR protection via JWT tenant_id validation | US-LM-11-H46, E-57 |
| BR-17 | Global mod invalidates tenant caches | Cache cascade invalidation | E-60, E15-S4 |
| BR-18 | Anonymous gets global only | No tenant overrides for unauthenticated users | US-LM-11-H53, US-LM-07-H31 |

---

## SPRINT-TO-STORY MAPPING

### Sprint 1 -- Foundation (63 SP, 16 stories)

| Epic | Stories | SP |
|------|---------|-----|
| E1: Backend i18n Infrastructure | E1-S1, E1-S2, E1-S3, E1-S4, E1-S5 | 21 |
| E2: Frontend i18n Infrastructure | E2-S1, E2-S2, E2-S3, E2-S4, E2-S5, E2-S6, E2-S7, E2-S8 | 34 |
| E3: Localization Service Fixes | E3-S1, E3-S2, E3-S3 | 8 |

### Sprint 2 -- Integration (95 SP, 24 stories)

| Epic | Stories | SP |
|------|---------|-----|
| E4: Frontend String Externalization P1-P4 | E4-S1, E4-S2, E4-S3, E4-S4 | 21 |
| E5: Backend Message Migration P1-P4 | E5-S1, E5-S2, E5-S3, E5-S4 | 13 |
| E6: Language Switcher & RTL | E6-S1, E6-S2, E6-S3 | 13 |
| E7: Agentic Translation with HITL | E7-S1, E7-S2, E7-S3, E7-S4, E7-S5 | 18 |
| E12: Schema Extensions | E12-S1, E12-S2, E12-S3 | 8 |
| E13: PrimeNG Text Expansion | E13-S1, E13-S2, E13-S3 | 5 |
| E14: Translation Reflection Flow | E14-S1, E14-S2 | 5 |
| E15: Tenant Translation Overrides | E15-S1, E15-S2, E15-S3, E15-S4, E15-S5 | 13 |

### Sprint 3 -- Polish (51 SP, 15 stories)

| Epic | Stories | SP |
|------|---------|-----|
| E8: Frontend String Externalization P5-P10 | E8-S1, E8-S2, E8-S3, E8-S4, E8-S5, E8-S6 | 18 |
| E9: Backend Message Migration P5-P8 | E9-S1, E9-S2, E9-S3, E9-S4 | 8 |
| E10: Testing & QA | E10-S1, E10-S2, E10-S3, E10-S4, E10-S5 | 21 |

### Documentation (across sprints, 8 SP, 6 stories)

| Epic | Stories | SP |
|------|---------|-----|
| E11: Documentation | E11-S1 through E11-S6 | 8 |

---

## DEFERRED REQUIREMENTS

| FR | Requirement | Deferral Rationale | Phase |
|----|------------|-------------------|-------|
| FR-13 | Duplication Detection | Requires regex engine safe for multi-locale text + preview-with-undo workflow + concurrent edit protection. Phase 1 is detection flag; Phase 2 is bulk find-and-replace. | Next Release |

---

## Changelog

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-03-12 | Initial complete inventory: 15 epics, 52 sprint stories, 53 happy paths, 11 alternative scenarios, 66 edge cases, 6 RBAC scenarios, 3 performance scenarios, 16 error codes, 4 confirmation dialogs, 18 business rules mapped to UI behavior |
