# R06 Design System Validation v5

**Version:** 1.0.0  
**Date:** March 20, 2026  
**Status:** [IMPLEMENTATION CONTRACT]  
**Owner:** Frontend Architecture
**Scope:** Feature-only supplement. Global UI governance lives in [`Documentation/design-system/`](../../../design-system/).

---

## 1. Purpose

This document defines the pass/fail validation rules for implementing Localization UI against the real EMSIST design system.
It does not redefine repo-wide design-system governance; it maps the global contract to localization surfaces.

It is a supplement to:

- [`Documentation/design-system/DESIGN-SYSTEM-CONTRACT.md`](../../../design-system/DESIGN-SYSTEM-CONTRACT.md)
- [`Documentation/design-system/COMPLIANCE-CHECKLIST.md`](../../../design-system/COMPLIANCE-CHECKLIST.md)
- [`frontend/src/app/core/theme/default-preset.ts`](../../../../frontend/src/app/core/theme/default-preset.ts)
- [`frontend/src/app/core/theme/design-system.spec.ts`](../../../../frontend/src/app/core/theme/design-system.spec.ts)

This validation contract applies to:

1. `Master Locale` administration UI
2. Shared language switcher
3. Login-route language switcher
4. Any new localization-specific Angular components

---

## 2. Localization-Specific Constraints

Apply the global token, spacing, component, accessibility, and responsive rules
from `Documentation/design-system/` first. The constraints below only narrow
that contract for localization surfaces.

### Token Rules

1. No new palette is allowed for localization.
2. All colors must come from existing `--tp-*`, `--nm-*`, or approved feature tokens.
3. Any new localization-specific token must be feature-scoped and derive from existing root tokens.
4. Prototype hex literals are reference material only and must not be copied into production component SCSS.

### Layout Rules

1. Localization admin UI must inherit the administration shell layout already present in the repo.
2. Localization runtime controls in shared shell must match the topnav pill pattern already used in [`shell-layout.component.scss`](../../../../frontend/src/app/layout/shell-layout/shell-layout.component.scss).
3. Spacing must use the canonical 4px-based `--tp-space-*` scale.
4. Mobile behavior must adapt through the existing breakpoint contract and not through ad hoc fixed widths.

### Component Rules

1. Prefer PrimeNG unstyled components already used by the repo.
2. No raw `.p-*` overrides unless required by documented passthrough styling.
3. No custom control is allowed when the repo already uses a PrimeNG equivalent.

---

## 3. Required Design-System Mapping

### Block Mapping

| Localization Surface | Required Block / Pattern |
|---|---|
| Master Locale page section | Settings Page block |
| Languages toolbar | Filter Bar pattern |
| Languages and dictionary search | Search pattern |
| Languages and dictionary tables | DataTable component contract |
| Edit and restore flows | Dialog component contract |
| Loading states | Loading States pattern |
| No-results states | Empty State block |
| Page-level API failures | Error Handling pattern |

### Component Mapping

| Need | Required Component |
|---|---|
| tabs | `p-tabs` |
| search input | `pInputText` |
| select filters | `p-select` |
| tables | `p-table` |
| dialog | `p-dialog` |
| actions | `p-button` |
| state badge | `p-tag` |
| toggle active locale | PrimeNG switch/toggle |

---

## 4. Styling Rules for Localization UI

### Master Locale Section

1. Section container styling may add feature-scoped `--loc-*` tokens only for semantics such as modified state, RTL badge, or empty markers.
2. `--loc-*` tokens must reference `--tp-*` or `--nm-*`.
3. Borders, shadows, and surfaces must reuse existing administration conventions.

### Shared Language Switcher

1. Must visually belong to the header island / topnav system already in the repo.
2. Must not introduce a standalone floating fab or drawer pattern.
3. Dropdown surface must use tokenized surface, border, and focus states.

### Login Route

1. The switcher must harmonize with the existing login screen.
2. Localization work must not expand the current login-page design-token debt.
3. New login switcher styles must use token references and logical properties.

---

## 5. Accessibility and RTL Validation

Localization UI passes design-system validation only if all of the following are true:

1. Focus styles use the approved focus-ring token behavior
2. No hover-only interaction exists without a keyboard equivalent
3. Touch targets are at least `44px`
4. Search, tabs, dialog actions, and switcher are keyboard-complete
5. Arabic or other RTL selections mirror layout correctly
6. Direction-sensitive inputs render with correct writing direction
7. Logical properties are used instead of left/right positional styling
8. Reduced-motion users do not get forced animation-heavy transitions

---

## 6. Automated Validation Commands

All localization UI work must pass these commands from `frontend/`:

```bash
npm run lint:design-system
npm run check:design-tokens
npm run check:spacing-scale
npm run check:admin-style-tokens
npm run test:design-system
```

### Interpretation

1. `lint:design-system` is build-blocking
2. `check:design-tokens` is build-blocking
3. `check:admin-style-tokens` is build-blocking on new findings
4. `check:spacing-scale` is warning-mode today, but all new localization SCSS must be clean
5. `test:design-system` is build-blocking

---

## 7. Manual Validation Checklist

### Visual Consistency

- Section looks like part of EMSIST administration, not a separate microsite
- Header switcher aligns with existing island controls
- Dialogs use the existing rounded, elevated surface language
- Search, filter, and action density match adjacent administration features

### Responsive Validation

- Desktop, tablet, and mobile verified
- Tables remain usable without clipping primary content
- Dialogs stay within viewport bounds
- Switcher remains reachable and readable on small screens

### RTL Validation

- `dir="rtl"` mirrors shell and admin content correctly
- Arabic text areas align right and preserve expected line flow
- Dropdown alignment and badges remain correct in RTL
- No icon or chevron points the wrong way after direction change

### State Validation

- Loading state uses skeleton/spinner pattern instead of blank space
- Error state uses inline banner or documented messaging pattern
- Empty search state uses documented empty-state structure
- Success feedback uses toast/banner patterns already documented

---

## 8. Required Screenshot Baselines

Playwright quality gates must eventually include screenshot baselines for:

1. Master Locale -> Languages tab on desktop
2. Master Locale -> Dictionary tab on desktop
3. Edit Translation dialog
4. Arabic runtime state with `dir="rtl"`
5. Login route with language switcher visible

The screenshot source of truth is the implemented Angular UI, not the static prototype.

---

## 9. Failure Conditions

Localization UI automatically fails design-system validation if any of the following occur:

1. A prototype `<style>` block or raw prototype token set is copied into Angular source
2. New hardcoded hex values are added to localization SCSS
3. Search, table, dialog, or switcher behavior is implemented with custom components where PrimeNG is already available
4. Language switcher styling diverges materially from the repo shell pattern
5. RTL support is partial or visually broken
6. New admin SCSS violations are introduced and require allowlisting

---

## 10. Exit Criteria

Design-system validation is complete only when:

1. All automated checks pass
2. Required screenshot baselines exist and pass in Playwright quality tests
3. Desktop, tablet, mobile, and RTL review have been completed
4. Localization UI is visually coherent with the current EMSIST administration shell
