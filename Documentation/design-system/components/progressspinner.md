# ProgressSpinner Component

**Status:** [DOCUMENTED]
**PrimeNG Component:** `p-progressSpinner`
**Module Import:** `ProgressSpinnerModule`
**PrimeNG Docs:** [ProgressSpinner](https://primeng.org/progressspinner)

## Overview

`p-progressSpinner` is the secondary loading indicator for EMSIST. It is allowed
for inline refresh states, dialog-local loading, and compact progress feedback.
It is not the default for initial page load.

## When to Use

- inline refresh inside a toolbar, table card, or status row
- loading inside a dialog after the dialog has already opened
- compact secondary loading while previously loaded content remains visible

## When NOT to Use

- first page load or first section load when a skeleton can represent the final layout
- full-page blank loading states
- long-running progress where a progress bar or explicit status is clearer

## Usage Rules

- Initial load: use `p-skeleton`.
- Refresh or background fetch: use a small inline spinner.
- Dialog-only fetch: center the spinner inside the dialog body.
- Keep spinner size compact and pair it with nearby text when the context is not obvious.

## Accessibility

- Provide an accessible label or adjacent visible text.
- Mark decorative spinners `aria-hidden="true"` only when the surrounding text already announces loading.
- Do not trap focus on a spinner-only container.

## Example

```html
@if (refreshing()) {
  <div class="inline-loading" role="status" aria-live="polite">
    <p-progressSpinner
      strokeWidth="6"
      [style]="{ width: '1.25rem', height: '1.25rem' }"
      aria-label="Refreshing tenant data"
    />
    <span>Refreshing tenant data…</span>
  </div>
}
```
