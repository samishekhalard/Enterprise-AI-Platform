# Accessibility Foundation

**Status:** [DOCUMENTED]
**Version:** 1.0.0

## Purpose

This foundation defines the non-negotiable accessibility baseline for all EMSIST
UI. Component docs may add tighter requirements, but they must not weaken the
rules here.

## Baseline Rules

| Area | Required Rule |
|---|---|
| Landmarks | Every route-level page uses `app-page-frame` and exposes a clear page title. Major areas use semantic `header`, `main`, `nav`, `section`, and `footer` landmarks where appropriate. |
| Keyboard | Every interactive control is reachable and usable with keyboard only. No critical action depends on pointer hover. |
| Focus | Interactive controls must expose a visible `:focus-visible` treatment using the tokenized focus ring. Focus must remain inside dialogs while open and return to the triggering control when they close. |
| Touch target | Interactive targets are at least 44px in both dimensions. |
| Labels | Inputs have visible labels or an explicit accessible name. Icon-only buttons require `aria-label`. |
| Feedback | Validation and error messaging uses inline messages, banners, or toast according to the documented pattern and exposes `role="alert"` or `role="status"` where needed. |
| Contrast | Minimum contrast is 4.5:1 for normal text and 3:1 for large text and UI boundaries. Aim for AAA where practical on primary surfaces. |
| Motion | Motion must be meaningful, short, and disabled or reduced under `prefers-reduced-motion`. |
| Directionality | Layouts must use logical properties so RTL does not require a parallel stylesheet. |
| Tooltips | Tooltips are supplementary only. They never carry the sole accessible name or the only path to understanding a control. |

## Required Evidence

Every feature that claims compliance needs dated evidence for:

- keyboard-only traversal of the primary happy path
- visible focus screenshots or test video for page, dialog, table, and form states
- contrast verification for primary text, muted text, buttons, tags, and alerts
- screen-reader naming checks for icon-only controls and form fields
- reduced-motion spot check for animated surfaces
- RTL spot check for directional layouts and icons

## Implementation Rules

### Structure

- Route templates must use `app-page-frame`.
- Dialog content uses PrimeNG dialog components instead of custom modal shells.
- Lists and tables expose clear headings and action labels.

### Focus And Keyboard

- Use `p-button`, `p-select`, `p-table`, `p-dialog`, and other PrimeNG primitives instead of recreating focus and keyboard behavior by hand.
- Do not remove outlines unless the replacement focus treatment is visible and tokenized.
- When a row has secondary action buttons, those actions must stop row-click propagation.

### Forms

- Required fields show a visible required marker and expose `aria-required="true"` where applicable.
- Invalid fields surface inline guidance near the control.
- Submit-on-error flows scroll or move focus to the first invalid field.

### Feedback

- Page or section errors: inline banner/message.
- Field errors: inline validation text.
- Action feedback: toast.
- Destructive confirmation: dialog or confirm dialog, not tooltip or toast.

## Automation Hooks

The following repo checks enforce part of this foundation:

- `scripts/check-frontend-layout-contract.sh`
- `scripts/check-spacing-scale.sh`
- `scripts/generate-design-system-baseline-report.sh`
- `scripts/frontend-governance.sh`

Manual verification is still required for keyboard traversal, contrast, and
screen-reader output.

## Do / Don't

### Do

- Use semantic HTML before ARIA.
- Keep accessible names stable between loading and loaded states.
- Use logical properties and `text-align: start/end`.
- Guard hover-only enhancements with `@media (hover: hover)`.

### Don't

- Do not use `::ng-deep` or raw `.p-*` overrides that hide focus or break state styling.
- Do not rely on color alone for status, validation, or severity.
- Do not put critical instructions only in placeholder text or tooltips.
- Do not create custom dialog, table, or select primitives when PrimeNG already covers the behavior.
