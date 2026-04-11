# Input Component

**Status:** [DOCUMENTED]
**PrimeNG Components:** `p-inputText`, `p-textarea`, `p-inputNumber`
**Module Imports:** `InputTextModule`, `TextareaModule`, `InputNumberModule`
**PrimeNG Docs:** [InputText](https://primeng.org/inputtext) | [Textarea](https://primeng.org/textarea) | [InputNumber](https://primeng.org/inputnumber)

## Overview

Input components capture user text, numeric, and multiline data. EMSIST forms use PrimeNG input components styled globally via PrimeNG CSS variables in `styles.scss`. All inputs follow the Form Validation pattern for error states.

## When to Use

- Single-line text entry (names, codes, search)
- Multiline text entry (descriptions, notes)
- Numeric values (quantities, thresholds, percentages)

## When NOT to Use

- Selecting from a predefined list -- use `p-select`
- Date input -- use `p-datePicker`
- Boolean toggle -- use `p-toggleSwitch`
- File upload -- use `p-fileUpload`

## Variants

| Variant | Component | Use Case |
|---------|-----------|----------|
| Text | `p-inputText` | Names, codes, short text |
| Textarea | `p-textarea` | Descriptions, long-form content |
| Number | `p-inputNumber` | Quantities, percentages, currency |
| With icon | `p-iconField` + `p-inputIcon` wrapper | Search fields, prefixed inputs |
| Float label | `p-floatLabel` wrapper | Compact forms |

## Key Props

### p-inputText

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `pSize` | `'small'\|'large'` | -- | Size variant |

Standard HTML attributes apply: `placeholder`, `maxlength`, `readonly`, `disabled`, `required`.

### p-textarea

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `rows` | `number` | -- | Visible rows |
| `cols` | `number` | -- | Visible columns |
| `autoResize` | `boolean` | `false` | Auto-grow with content |

### p-inputNumber

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `mode` | `'decimal'\|'currency'` | `'decimal'` | Number format mode |
| `min` | `number` | -- | Minimum value |
| `max` | `number` | -- | Maximum value |
| `step` | `number` | `1` | Increment step |
| `showButtons` | `boolean` | `false` | Show increment/decrement buttons |
| `suffix` | `string` | -- | Text after the value |
| `prefix` | `string` | -- | Text before the value |
| `useGrouping` | `boolean` | `true` | Thousands separator |

## Grey Neutral Token Mapping

All input styling is enforced globally via PrimeNG CSS variables in `styles.scss`:

| Token | Value | Purpose |
|-------|-------|---------|
| `--p-inputtext-background` | `var(--tp-surface-raised)` | Input background (#FAF8F4) |
| `--p-inputtext-border-color` | `var(--tp-border-light)` | Subtle border (#E8E5E0) |
| `--p-inputtext-focus-border-color` | `var(--tp-primary)` | Focus border (teal) |
| `--p-inputtext-invalid-border-color` | `var(--tp-error)` | Error border |
| `--p-inputtext-color` | `var(--tp-text)` | Text color |
| `--p-inputtext-border-radius` | `var(--nm-radius-lg)` | 16px radius (neumorphic) |
| `--p-inputtext-shadow` | `var(--nm-shadow-input-inset)` | Neumorphic inset shadow |
| `--p-inputtext-disabled-background` | `var(--nm-surface)` | Disabled state (#E0DDDA) |

Same pattern applies to `--p-textarea-*` tokens.

### Error State

```html
<input
  pInputText
  [ngClass]="{'ng-invalid ng-dirty': hasError}"
/>
@if (hasError) {
  <small style="color: var(--tp-error-text); margin-block-start: var(--tp-space-1);">
    {{ errorMessage }}
  </small>
}
```

## Code Examples

### Text Input with Label

```html
<div style="display: grid; gap: var(--tp-space-2);">
  <label for="name">Object Type Name</label>
  <input
    pInputText
    id="name"
    formControlName="name"
    placeholder="Enter name"
  />
  @if (form.controls.name.invalid && form.controls.name.touched) {
    <small role="alert" style="color: var(--tp-error-text);">
      Name is required
    </small>
  }
</div>
```

### Search Input with Icon

```html
<p-iconField>
  <p-inputIcon styleClass="pi pi-search" />
  <input
    pInputText
    placeholder="Search object types..."
    (input)="onSearch($event)"
  />
</p-iconField>
```

### Textarea with Auto-Resize

```html
<div style="display: grid; gap: var(--tp-space-2);">
  <label for="description">Description</label>
  <textarea
    pTextarea
    id="description"
    formControlName="description"
    [autoResize]="true"
    [rows]="3"
    placeholder="Describe this object type..."
  ></textarea>
</div>
```

### Number Input

```html
<div style="display: grid; gap: var(--tp-space-2);">
  <label for="maxFields">Maximum Fields</label>
  <p-inputNumber
    inputId="maxFields"
    formControlName="maxFields"
    [min]="1"
    [max]="100"
    [showButtons]="true"
  />
</div>
```

## Accessibility

| Requirement | Implementation |
|-------------|---------------|
| Label association | Every input has a `<label>` with matching `for`/`id` |
| Error announcement | Error messages use `role="alert"` for live announcement |
| Required fields | Add `aria-required="true"` and `required` attribute |
| Invalid state | Angular adds `aria-invalid="true"` via `ng-invalid` class |
| Focus indicator | `box-shadow: var(--tp-focus-ring)` on `:focus-visible` |
| Touch target | Minimum height `44px` via `--tp-touch-target-min-size` |
| Placeholder | Never use placeholder as the only label |

## Do / Don't

### Do

- Always pair inputs with a visible `<label>` element
- Use `role="alert"` on error messages
- Show error state on blur (not on first keypress)
- Use `p-inputNumber` for all numeric inputs (never `type="number"`)
- Set `autocomplete` attribute appropriately

### Don't

- Never use `placeholder` as a substitute for a label
- Never style error borders with hardcoded hex -- use `var(--tp-error)`
- Never skip the error message -- an invalid state must explain the problem
- Never use `type="number"` HTML input -- use `p-inputNumber` for consistent behavior
- Never override input background with white -- it must be `var(--tp-surface-raised)`
