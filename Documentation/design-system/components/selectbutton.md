# SelectButton Component

**Status:** [DOCUMENTED]
**PrimeNG Component:** `p-selectbutton`
**Module Import:** `SelectButtonModule`
**PrimeNG Docs:** [SelectButton](https://primeng.org/selectbutton)

## Overview

`p-selectbutton` is the segmented-choice control for choosing one option from a
small, mutually exclusive set. In EMSIST it is appropriate for view mode,
density, or style choices where all options should remain visible.

## When to Use

- 2 to 5 mutually exclusive options
- view-mode switches such as `Table` vs `Cards`
- compact configuration choices that benefit from direct comparison

## When NOT to Use

- large option sets
- multi-select choices
- binary on/off state where `p-toggleSwitch` is clearer

## Usage Rules

- Keep option labels short.
- Prefer icons plus text only when the meaning is obvious.
- Use a real label or heading above the control group.
- Bind to a documented tokenized style treatment instead of local raw overrides.

## Accessibility

- Provide an accessible group label.
- Ensure the selected state is visible without relying on color alone.
- Do not use tooltips as the sole explanation for option meaning.

## Example

```html
<label for="surface-density">Surface density</label>
<p-selectbutton
  inputId="surface-density"
  [options]="densityOptions"
  optionLabel="label"
  optionValue="value"
  [ngModel]="density()"
  (ngModelChange)="density.set($event)"
/>
```
