# Tooltip Directive

**Status:** [DOCUMENTED]
**PrimeNG Directive:** `pTooltip`
**Module Import:** `TooltipModule`
**PrimeNG Docs:** [Tooltip](https://primeng.org/tooltip)

## Overview

`pTooltip` provides supplemental hover and focus help for compact controls. It
is allowed only when the control already has a clear accessible name and the
tooltip adds optional clarification.

## When to Use

- icon-only actions that already expose `aria-label`
- short clarification for dense table or editor controls
- truncated metadata where the full text is useful but non-critical

## When NOT to Use

- essential instructions required to use a control
- validation or error feedback
- long-form help content

## Usage Rules

- Tooltip content must be short and specific.
- Every tooltip target must still be understandable without the tooltip.
- Prefer tooltip text that names the action, not the implementation detail.
- Keep tooltip usage light in dense tables to avoid noisy hover behavior.

## Accessibility

- The target control still needs `aria-label`, visible text, or both.
- Tooltip-only naming is forbidden.
- Tooltip behavior must work on keyboard focus, not just hover.

## Example

```html
<button
  type="button"
  pButton
  [text]="true"
  aria-label="Duplicate object type"
  pTooltip="Duplicate"
>
  <ng-icon name="phosphorCopyThin" aria-hidden="true" />
</button>
```
