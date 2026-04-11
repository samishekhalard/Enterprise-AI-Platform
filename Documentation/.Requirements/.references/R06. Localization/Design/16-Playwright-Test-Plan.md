# Playwright Test Plan: Localization Management

**Version:** 1.0.0
**Date:** March 11, 2026
**Status:** [PLANNED] — No E2E tests written yet
**Owner:** QA-INT Agent

---

## 1. Test Configuration

| Setting | Value |
|---------|-------|
| **Framework** | Playwright 1.50+ |
| **Browsers** | Chromium, Firefox, WebKit |
| **Viewports** | Desktop (1280x720), Tablet (768x1024), Mobile (375x667) |
| **Base URL** | `http://localhost:4200` |
| **Auth** | Pre-authenticated via storage state (Super Admin, Tenant Admin, End User) |
| **API Mocking** | Route interception for localization-service endpoints |

---

## 2. Test Suites

### 2.1 Languages Tab — `languages.spec.ts`

| # | Scenario | Steps | Expected | Priority |
|---|----------|-------|----------|----------|
| L-01 | View locale catalog | Navigate to Master Locale → Languages tab | Table shows 10 locales with flags, pagination | P1 |
| L-02 | Search locales | Type "ar" in search field | Filters to ar-AE row | P1 |
| L-03 | Activate locale | Click toggle switch for de-DE | Toggle turns green, toast "Locale activated" | P1 |
| L-04 | Deactivate locale (no users) | Click toggle switch for active fr-FR | Toggle turns gray, toast "Locale deactivated" | P1 |
| L-05 | Deactivate alternative (blocked) | Click toggle for alternative locale | Toast error "Cannot deactivate alternative locale" | P1 |
| L-06 | Deactivate last active (blocked) | Deactivate all except one, try last | Toast error "Cannot deactivate the last active locale" | P1 |
| L-07 | Set alternative | Click radio for ar-AE | Radio selected, previous alternative unset | P1 |
| L-08 | Format config expand | Click format config for ar-AE | Accordion expands with calendar, numeral, currency fields | P2 |
| L-09 | Coverage bar display | View locale table | Each active locale shows coverage bar with correct percentage | P2 |
| L-10 | Empty search result | Search "xyz" | Empty state "No locales found matching 'xyz'" | P3 |
| L-11 | Responsive — mobile | Set viewport 375px | Table converts to card layout | P2 |

### 2.2 Dictionary Tab — `dictionary.spec.ts`

| # | Scenario | Steps | Expected | Priority |
|---|----------|-------|----------|----------|
| D-01 | Browse dictionary | Switch to Dictionary tab | Paginated table with keys and locale columns | P1 |
| D-02 | Search keys | Type "login" in search | Filters to auth.login.* entries | P1 |
| D-03 | Edit translation | Click edit button on entry | Dialog opens with inputs per locale, RTL input for ar-AE | P1 |
| D-04 | Save translation | Edit ar-AE value, click Save | Dialog closes, toast "Translations saved", table updated | P1 |
| D-05 | Cancel edit | Open edit dialog, click Cancel | Dialog closes, no changes persisted | P2 |
| D-06 | Empty translation | Clear ar-AE value, save | Value shows "—" in table, coverage decreases | P2 |
| D-07 | Long translation | Enter 5001 chars | Validation error "exceeds maximum length" | P2 |
| D-08 | Translation with placeholders | Enter "Hello {name}" | Saved as-is, placeholders preserved | P3 |
| D-09 | RTL input direction | Edit ar-AE field | Input has dir="rtl", text right-aligned | P2 |

### 2.3 Import/Export Tab — `import-export.spec.ts`

| # | Scenario | Steps | Expected | Priority |
|---|----------|-------|----------|----------|
| IE-01 | Export CSV | Click "Export CSV" button | CSV file downloaded with UTF-8 BOM encoding | P1 |
| IE-02 | Import preview | Upload valid CSV | Preview shows: total rows, updates, new keys, errors | P1 |
| IE-03 | Commit import | Review preview, click "Confirm Import" | Toast "Import complete", dictionary updated | P1 |
| IE-04 | Import with errors | Upload CSV with missing columns | Preview shows error count with details | P2 |
| IE-05 | Empty CSV | Upload empty file | Error "CSV file is empty" | P2 |
| IE-06 | Large file (>10MB) | Upload 11MB file | Error "File size exceeds 10 MB limit" | P2 |
| IE-07 | Rate limit | Upload 6 files in 1 hour | 6th shows "Rate limit exceeded" with retry-after | P2 |
| IE-08 | Preview timer | Upload CSV, wait | Timer counts down from 30:00 | P3 |
| IE-09 | CSV injection | Upload CSV with `=CMD()` values | Values sanitized (prefixed with `'`) | P1 (Security) |

### 2.4 Rollback Tab — `rollback.spec.ts`

| # | Scenario | Steps | Expected | Priority |
|---|----------|-------|----------|----------|
| R-01 | View version history | Switch to Rollback tab | Paginated table with version #, type badge, summary, date | P1 |
| R-02 | Rollback to version | Click "Rollback" on version #42 | Confirmation dialog appears | P1 |
| R-03 | Confirm rollback | Click "Rollback" in dialog | Toast "Dictionary rolled back", new version at top | P1 |
| R-04 | Cancel rollback | Click "Cancel" in dialog | Dialog closes, no changes | P2 |
| R-05 | Current version badge | View latest version row | Shows "CURRENT" badge in green | P2 |
| R-06 | No rollback on current | View current version | No "Rollback" button shown | P2 |

### 2.5 Language Switcher — `language-switcher.spec.ts`

| # | Scenario | Steps | Expected | Priority |
|---|----------|-------|----------|----------|
| LS-01 | Open switcher | Click language button in header | Dropdown opens with active locales | P1 |
| LS-02 | Select language | Click "Arabic" in dropdown | Flag/code updates, UI text changes, RTL applied | P1 |
| LS-03 | RTL layout flip | Select ar-AE | `document.dir="rtl"`, layout mirrors, text right-aligned | P1 |
| LS-04 | Persistence | Select Arabic, refresh page | Arabic still selected (localStorage for anon, DB for auth) | P1 |
| LS-05 | Keyboard navigation | Tab to button, ArrowDown, Enter | Navigates and selects with keyboard only | P2 |
| LS-06 | Escape closes | Press Escape while dropdown open | Dropdown closes, focus returns to button | P2 |
| LS-07 | Click outside closes | Click anywhere outside dropdown | Dropdown closes | P2 |
| LS-08 | Login page switcher | Navigate to login (unauthenticated) | Switcher appears at bottom of login form | P1 |
| LS-09 | Active check mark | Open dropdown | Current locale has checkmark icon | P3 |

---

## 3. RBAC Test Matrix

| Scenario | Actor | Expected |
|----------|-------|----------|
| Super Admin sees all tabs | ROLE_SUPER_ADMIN | 5 tabs visible, all actions enabled |
| Tenant Admin sees read-only | ROLE_ADMIN | 2 tabs (Languages, Dictionary), no toggle/edit/import |
| End User sees no locale section | ROLE_USER | Master Locale section hidden |
| Anonymous accesses public bundle | Unauthenticated | `GET /api/v1/locales/*/bundle` returns 200 |
| Anonymous blocked from admin | Unauthenticated | `GET /api/v1/admin/locales` returns 401 |

---

## 4. Accessibility Tests

| # | Test | Method | Target |
|---|------|--------|--------|
| A-01 | Tab bar keyboard navigation | `tablist` ARIA pattern | Arrow keys between tabs |
| A-02 | Language switcher ARIA | `listbox` pattern | `aria-expanded`, `aria-activedescendant` |
| A-03 | Toggle switch labels | `role="switch"`, `aria-checked` | Screen reader announces state |
| A-04 | Dialog focus trap | Tab cycling within dialog | Focus stays within edit/rollback dialog |
| A-05 | Color contrast | axe-core scan | Zero violations at AAA level |
| A-06 | Skip link | `Tab` from page load | "Skip to main content" link visible on focus |

---

## 5. Responsive Tests

| Viewport | Key Verifications |
|----------|-------------------|
| Desktop (1280x720) | Full table, all columns visible, side-by-side panels |
| Tablet (768x1024) | Horizontal scroll on tables, stacked toolbar |
| Mobile (375x667) | Card layout for tables, icon-only tabs, full-screen dialogs |

---

## 6. Test Data Setup

```typescript
// fixtures/localization.ts
export const TEST_LOCALES = [
  { code: 'en-US', name: 'English', active: true, alternative: true },
  { code: 'ar-AE', name: 'Arabic', active: true, alternative: false },
  { code: 'fr-FR', name: 'French', active: true, alternative: false },
  { code: 'de-DE', name: 'German', active: false, alternative: false },
];

export const TEST_DICTIONARY = [
  { key: 'auth.login.welcome', en: 'Welcome', ar: 'مرحباً', fr: 'Bienvenue' },
  { key: 'auth.login.sign_in', en: 'Sign In', ar: 'تسجيل الدخول', fr: 'Se connecter' },
];
```

---

## Changelog

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-03-11 | Initial Playwright plan — 5 suites, 42 scenarios, RBAC matrix, a11y, responsive |
