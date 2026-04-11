# Select Component

**Status:** [DOCUMENTED]
**PrimeNG Component:** `p-select` (renamed from `p-dropdown` in PrimeNG 21)
**Module Import:** `SelectModule`
**PrimeNG Docs:** [Select](https://primeng.org/select)

## Overview

The Select component provides a dropdown list for choosing one option from a predefined set. In EMSIST, selects are used for category filters, status selectors, and form fields with constrained options. Use `p-select` (not the deprecated `p-dropdown`).

## When to Use

- Choosing one value from 5-15 options
- Category or status filters
- Form fields with predefined options (role, type, severity)

## When NOT to Use

- Fewer than 3 options -- use radio buttons
- More than 15 options -- use `p-autoComplete` with search
- Multiple selection -- use `p-multiSelect`
- Boolean on/off -- use `p-toggleSwitch`

## Variants

| Variant | Props | Use Case |
|---------|-------|----------|
| Basic | `[options]` + `optionLabel` | Simple list selection |
| Grouped | `[group]="true"` with grouped options | Categorized options |
| Editable | `[editable]="true"` | Allow custom value entry |
| With filter | `[filter]="true"` | Searchable options (> 7 items) |
| Clearable | `[showClear]="true"` | Optional field, allow deselection |
| With template | Custom `selectedItem` / `item` templates | Rich option display |

## Key Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `options` | `any[]` | -- | Array of options |
| `optionLabel` | `string` | `'label'` | Property name for display text |
| `optionValue` | `string` | -- | Property name for value (default: whole object) |
| `placeholder` | `string` | -- | Placeholder text when empty |
| `filter` | `boolean` | `false` | Enable search filtering |
| `filterBy` | `string` | `optionLabel` | Field(s) to filter on |
| `showClear` | `boolean` | `false` | Show clear button |
| `editable` | `boolean` | `false` | Allow typed custom values |
| `disabled` | `boolean` | `false` | Disable interaction |
| `appendTo` | `string` | -- | Append overlay to (`'body'` recommended) |
| `panelStyle` | `object` | -- | Dropdown panel styles |
| `virtualScroll` | `boolean` | `false` | Enable virtual scroll for large lists |
| `virtualScrollItemSize` | `number` | -- | Item height for virtual scroll |

## Grey Neutral Token Mapping

All styling is enforced globally via PrimeNG CSS variables in `styles.scss`:

| Token | Value | Purpose |
|-------|-------|---------|
| `--p-select-background` | `var(--tp-surface-raised)` | Input background (#FAF8F4) |
| `--p-select-border-color` | `var(--tp-border-light)` | Subtle border (#E8E5E0) |
| `--p-select-focus-border-color` | `var(--tp-primary)` | Focus border (teal) |
| `--p-select-color` | `var(--tp-text)` | Text color |
| `--p-select-border-radius` | `var(--nm-radius-lg)` | 16px radius (neumorphic) |
| `--p-select-overlay-background` | `var(--tp-surface-raised)` | Dropdown panel background |
| `--p-select-overlay-shadow` | `var(--nm-shadow-dialog)` | Dropdown panel shadow |
| `--p-select-option-selected-background` | `color-mix(…primary 14%…)` | Selected option highlight |

## Code Examples

### Basic Select

```html
<div style="display: grid; gap: var(--tp-space-2);">
  <label for="category">Category</label>
  <p-select
    inputId="category"
    [options]="categories"
    optionLabel="name"
    optionValue="id"
    formControlName="categoryId"
    placeholder="Select a category"
    appendTo="body"
  />
</div>
```

### Filterable Select

```html
<p-select
  [options]="objectTypes"
  optionLabel="name"
  [filter]="true"
  filterBy="name,code"
  placeholder="Search object types..."
  appendTo="body"
/>
```

### Select with Custom Template

```html
<p-select
  [options]="statuses"
  optionLabel="label"
  formControlName="status"
  appendTo="body"
>
  <ng-template pTemplate="selectedItem" let-item>
    <div style="display: flex; align-items: center; gap: var(--tp-space-2);">
      <span [style.color]="item.color" class="pi pi-circle-fill"></span>
      {{ item.label }}
    </div>
  </ng-template>
  <ng-template pTemplate="item" let-item>
    <div style="display: flex; align-items: center; gap: var(--tp-space-2);">
      <span [style.color]="item.color" class="pi pi-circle-fill"></span>
      {{ item.label }}
    </div>
  </ng-template>
</p-select>
```

## Accessibility

| Requirement | Implementation |
|-------------|---------------|
| Label association | Use `inputId` prop and matching `<label for>` |
| Keyboard navigation | Arrow keys cycle options; Enter selects; Escape closes |
| ARIA attributes | `role="combobox"`, `aria-expanded`, `aria-activedescendant` set automatically |
| Screen reader | Selected value announced; option list announced on open |
| Focus indicator | `box-shadow: var(--tp-focus-ring)` on focus |
| Touch target | Minimum 44px height via `--tp-touch-target-min-size` |
| Filter input | Automatically focused when panel opens with `[filter]="true"` |

## Do / Don't

### Do

- Use `appendTo="body"` to prevent overlay clipping inside scrollable containers
- Enable `[filter]="true"` when options exceed 7 items
- Use `[showClear]="true"` for optional fields
- Provide meaningful `placeholder` text
- Use `optionValue` to bind the value property, not the entire object

### Don't

- Never use `p-dropdown` -- it is deprecated; use `p-select`
- Never use a select for binary choices -- use radio buttons or toggle
- Never render more than 50 options without virtual scrolling
- Never hardcode panel styles -- Grey Neutral tokens are set globally
- Never use select without a label -- `inputId` + `<label>` is required
