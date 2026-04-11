# R06 UI Specification v5

**Version:** 1.0.0  
**Date:** March 20, 2026  
**Status:** [IMPLEMENTATION CONTRACT]  
**Owner:** Frontend Architecture
**Scope:** Feature-only supplement. Global UI governance lives in [`Documentation/design-system/`](../../../design-system/).

---

## 1. Purpose

This document is the authoritative UI contract for the Angular implementation of R06 Localization.
It converts the prototype into implementation-ready screen scope for the current repo.
It does not redefine repo-wide tokens, component rules, or frontend governance.

This spec is intentionally constrained by the existing frontend structure:

- Administration is rendered inside [`frontend/src/app/features/administration/administration.page.html`](../../../../frontend/src/app/features/administration/administration.page.html)
- The current placeholder lives in [`frontend/src/app/features/administration/sections/master-locale/master-locale-section.component.ts`](../../../../frontend/src/app/features/administration/sections/master-locale/master-locale-section.component.ts)
- Shared shell chrome is rendered by [`frontend/src/app/layout/shell-layout/shell-layout.component.html`](../../../../frontend/src/app/layout/shell-layout/shell-layout.component.html)
- The auth entry screen is rendered by [`frontend/src/app/features/auth/login.page.html`](../../../../frontend/src/app/features/auth/login.page.html)

This document does not settle backend ownership, endpoint naming, or tenant-database topology. Those remain governed by ADR/LLD decisions.

---

## 2. Scope

### In Scope for v5 UI Delivery

1. Master Locale administration surface under `Administration -> Master Locale`
2. Global language switcher for authenticated shell and administration header
3. Login-route language switcher for unauthenticated users
4. Runtime RTL/LTR visual switching
5. Dictionary editing dialog
6. Restore-to-original dialog

### Explicitly Out of Scope

1. CSV import/export UI
2. Version history / rollback tab
3. Tenant override management UI
4. A standalone localization application shell
5. Replacing the administration page header with a separate prototype header

Those items may be added later, but they are not part of the v5 delivery contract.

---

## 3. Source of Truth Hierarchy

Use these sources by concern, not as competing parallel contracts:

1. Repo-wide tokens, blocks, patterns, components, and shared UI governance come from [`Documentation/design-system/DESIGN-SYSTEM-CONTRACT.md`](../../../design-system/DESIGN-SYSTEM-CONTRACT.md).
2. R06 screen scope, placement, and localization-specific behavior come from this file.
3. [`prototype/v5-dictionary-prototype.html`](../prototype/v5-dictionary-prototype.html) is visual and interaction guidance only.
4. Existing Angular shell and administration structure decide implementation details when neither document above does.

The prototype is not permission to recreate a second page shell inside Angular.

---

## 4. Angular Ownership

### Required File Targets

- `frontend/src/app/features/administration/sections/master-locale/master-locale-section.component.ts`
- `frontend/src/app/features/administration/sections/master-locale/master-locale-section.component.html`
- `frontend/src/app/features/administration/sections/master-locale/master-locale-section.component.scss`
- `frontend/src/app/features/administration/services/admin-locale.service.ts`
- `frontend/src/app/features/administration/models/administration.models.ts`
- `frontend/src/app/core/i18n/translation.service.ts`
- `frontend/src/app/core/i18n/translate.pipe.ts`
- `frontend/src/app/core/i18n/locale-state.service.ts`
- `frontend/src/app/layout/language-switcher/language-switcher.component.ts`
- `frontend/src/app/layout/language-switcher/language-switcher.component.html`
- `frontend/src/app/layout/language-switcher/language-switcher.component.scss`

### Placement Rules

- Master Locale remains a section rendered by `AdministrationPageComponent`.
- The generic language switcher is a shared component, not an administration-only widget.
- The login page consumes the shared switcher component instead of duplicating switcher markup.
- The prototype header/footer are reference material only; Angular must reuse the real app shell patterns already in the repo.

---

## 5. Screen Inventory

### Screen A: Master Locale -> Languages

**Route**

- `/administration?section=master-locale`

**Container**

- Render inside the existing administration content region and breadcrumb shell.

**Primary Elements**

1. Section title: `Master Locale`
2. Section description: short administrative summary
3. Tab set with exactly two tabs in v5:
   - `Languages`
   - `Dictionary`
4. Search field for languages
5. Languages table
6. Empty state for no search results
7. Inline loading state
8. Inline error banner with retry action

**Languages Table Columns**

1. `Active`
2. `Code`
3. `Language Name`
4. `Native Name`
5. `Direction`
6. `Actions`

**Languages Table Rules**

1. English is always shown first and is locked active.
2. Active state is shown with a switch or toggle control.
3. `View Dictionary` is the row-level action.
4. Search filters by code, language name, and native name.
5. Mobile does not introduce a second bespoke card implementation in v5; horizontal scroll is acceptable.

### Screen B: Master Locale -> Dictionary

**Entry Path**

- Via the `Dictionary` tab, defaulting to the currently selected language
- Via `View Dictionary` from the languages table, which sets the target language context

**Primary Elements**

1. Back action to `Languages`
2. Title: `Dictionary - {Language Name} ({code})`
3. Direction badge when target language is RTL
4. Search field for dictionary entries
5. Module filter
6. Count label
7. Dictionary table
8. Pagination

**Dictionary Table Columns**

1. `Technical Name`
2. `Module`
3. `English Default`
4. `{Target Language} Value`
5. `Actions`

**Dictionary Table Rules**

1. Search matches technical key and English default value.
2. Module filter values are driven by API data or the returned dictionary page.
3. Empty translations render an explicit empty marker, not blank whitespace.
4. Modified translations must be visually distinct.
5. Actions:
   - `Edit` always visible
   - `Restore` visible only when current value differs from master/original

### Screen C: Edit Translation Dialog

**Fields**

1. Technical name, read-only
2. Module, read-only
3. English default/reference, read-only
4. Translation value, editable
5. Character count
6. Validation message region

**Behavior**

1. Open from dictionary row action
2. Save button disabled while request is pending
3. Validation is inline and non-toast
4. Arabic and other RTL locales set the text area to `dir="rtl"`
5. Close on cancel, close button, or Escape

### Screen D: Restore to Original Dialog

**Elements**

1. Confirmation copy
2. Key display
3. Two-column comparison on desktop:
   - Current value
   - Master/original value
4. Cancel and Restore actions

**Behavior**

1. Collapse to stacked comparison blocks below tablet width
2. Restore action is destructive and styled accordingly
3. Dialog closes only after success or explicit cancel

### Screen E: Global Language Switcher

**Placement**

1. Inside [`shell-layout.component.html`](../../../../frontend/src/app/layout/shell-layout/shell-layout.component.html) top navigation
2. Inside [`administration.page.html`](../../../../frontend/src/app/features/administration/administration.page.html) right-side header island, before `Sign out`
3. Inside [`login.page.html`](../../../../frontend/src/app/features/auth/login.page.html), below the primary auth card content

**Switcher Rules**

1. Shows only active languages
2. Shows native name and code
3. Indicates current language
4. Supports keyboard navigation, Escape close, and outside click close
5. Triggers document `lang` and `dir` updates
6. Persists the chosen locale through the runtime persistence service

---

## 6. Visual Contract

### Must Match

1. Use the existing ThinkPLUS / EMSIST administration visual language already present in the shell and prototype
2. Use the real design tokens from `styles.scss`, `default-preset.ts`, and existing SCSS layers
3. Preserve the patterned background, island surfaces, rounded controls, and green-gold palette

### Must Not Happen

1. Do not inline the prototype token block into Angular components
2. Do not build a second app shell inside `master-locale-section`
3. Do not copy raw HTML classes like `nm-table` or `nm-btn` unless backed by existing Angular styling contracts
4. Do not introduce a third visual language for localization screens

### PrimeNG Mapping

Use existing Angular and PrimeNG patterns in preference to bespoke HTML widgets:

- `p-tabs` for the two top-level tabs
- `p-inputText` for search and read-only input fields where appropriate
- `p-select` for module filter and page size
- `p-table` for languages and dictionary grids
- `p-dialog` for edit and restore flows
- `p-button` for actions
- `p-toggleswitch` or equivalent PrimeNG switch for active-state control
- `p-tag` for direction or status badges
- `p-message` or banner pattern for inline page errors

---

## 7. State Model

Every screen must implement all of the following states.

### Data States

1. Initial loading
2. Loaded with data
3. Loaded with empty result after filtering
4. Recoverable API error
5. Action pending
6. Action success
7. Action failure

### UI States

1. LTR locale
2. RTL locale
3. Desktop
4. Tablet
5. Mobile
6. Reduced-motion preference

### Empty-State Copy Rules

- Search-empty states must mention the filter intent
- True no-data states must explain what the user can do next
- Empty states must use the repo empty-state pattern rather than ad hoc gray text

---

## 8. Accessibility Contract

### Required

1. One `h1` remains owned by the page shell; `master-locale-section` starts at `h2` or `h3`
2. Search inputs have explicit labels or `aria-label`
3. Tabs follow proper `tablist`, `tab`, and `tabpanel` semantics
4. Dialogs trap focus and restore focus on close
5. Icon-only controls have `aria-label`
6. Error banners use `role="alert"` when blocking or corrective
7. Switcher exposes `aria-expanded`, `aria-haspopup`, and active option state
8. All interactive elements meet the 44px minimum touch target

### RTL Rules

1. Use logical properties only
2. Direction badge is visual only; document `dir` remains the source of truth
3. Directional icons may mirror only when semantic direction matters
4. Input fields for RTL translations align and flow correctly

---

## 9. Responsive Contract

### Desktop: `>1024px`

- Full table layout
- Dialog comparison shows side-by-side columns
- Header switcher remains inline with existing actions

### Tablet: `768px-1024px`

- Toolbar stacks when needed
- Tables may scroll horizontally
- Dialogs remain centered and constrained

### Mobile: `<768px`

- Section padding compresses to token scale
- Search and filters stack vertically
- Tables remain horizontally scrollable in v5
- Dialog width uses viewport-constrained layout
- Switcher remains usable one-handed and keyboard accessible

---

## 10. Runtime Integration Contract

### Translation Runtime Consumption

The UI must consume a generic runtime service, not the auth-only `AuthUiTextService`.

Required runtime capabilities:

1. active locale signal
2. available locale signal
3. bundle preload
4. sync translation lookup
5. document `lang` / `dir` updates
6. English fallback bundle

### Coexistence Rule

`AuthUiTextService` may remain temporarily for auth-only fallback, but new localization UI and language switching must be built on the generic runtime.

---

## 11. Acceptance Criteria

The UI is not done until all of the following are true:

1. `Master Locale` in Angular matches the two-tab prototype scope
2. The administration page uses the real shell and not a duplicated prototype shell
3. Language switching works in administration, shell, and login route
4. Switching to Arabic updates visible runtime text and document direction
5. Dialogs are keyboard-accessible and focus-safe
6. Empty, loading, and error states exist for both tabs
7. The design-system validation checklist passes
8. The Angular unit test contract passes
9. The CI quality gate contract passes

---

## 12. Deferred Items

The following are explicitly deferred and must not be quietly added during v5 implementation:

1. Import/export tab
2. Rollback/version history tab
3. Tenant override tab
4. Coverage reporting widgets
5. Locale format configuration subpanels

Any attempt to include them requires a new contract revision.
