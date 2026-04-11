# MultiSelect Component

**Status:** [DOCUMENTED]
**PrimeNG Component:** `p-multiSelect`
**Module Import:** `MultiSelectModule`
**PrimeNG Docs:** [MultiSelect](https://primeng.org/multiselect)

## Overview

MultiSelect allows users to select multiple values from a dropdown list with checkboxes. In EMSIST, it is used for multi-value filters, role assignment, and tag selection. Styled globally via PrimeNG CSS variables in `styles.scss` with Grey Neutral tokens.

## When to Use

- Selecting multiple values from a predefined list (roles, tags, categories)
- Multi-value filters (filter by multiple statuses)
- Assigning multiple items (permissions, groups)

## When NOT to Use

- Single selection -- use `p-select`
- Binary on/off -- use `p-toggleSwitch`
- Free-text tags -- use `p-chips`
- Fewer than 3 options -- use checkboxes

## Variants

| Variant | Props | Use Case |
|---------|-------|----------|
| Basic | `[options]` + `optionLabel` | Simple multi-select |
| With filter | `[filter]="true"` | Searchable options |
| With chips | `display="chip"` | Show selected as chips |
| Grouped | Grouped options | Categorized selections |

## Key Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `options` | `any[]` | -- | Array of options |
| `optionLabel` | `string` | `'label'` | Property name for display text |
| `optionValue` | `string` | -- | Property name for value |
| `placeholder` | `string` | -- | Placeholder text |
| `filter` | `boolean` | `false` | Enable search filtering |
| `display` | `'comma'\|'chip'` | `'comma'` | Display mode for selected items |
| `showClear` | `boolean` | `false` | Show clear button |
| `maxSelectedLabels` | `number` | `3` | Max labels before summarizing |
| `disabled` | `boolean` | `false` | Disable interaction |
| `appendTo` | `string` | -- | Append overlay to (`'body'`) |

## Grey Neutral Token Mapping

| Token | Value | Purpose |
|-------|-------|---------|
| `--p-multiselect-background` | `var(--tp-surface-raised)` | Input background (#FAF8F4) |
| `--p-multiselect-border-color` | `var(--tp-border-light)` | Subtle border (#E8E5E0) |
| `--p-multiselect-focus-border-color` | `var(--tp-primary)` | Focus border (teal) |
| `--p-multiselect-color` | `var(--tp-text)` | Text color |
| `--p-multiselect-border-radius` | `var(--nm-radius-lg)` | 16px radius (neumorphic) |
| `--p-multiselect-overlay-background` | `var(--tp-surface-raised)` | Panel background |
| `--p-multiselect-overlay-shadow` | `var(--nm-shadow-dialog)` | Panel shadow |
| `--p-multiselect-option-selected-background` | `color-mix(…primary 14%…)` | Selected highlight |

## Code Examples

### Basic MultiSelect

```html
<div style="display: grid; gap: var(--tp-space-2);">
  <label for="roles">Assigned Roles</label>
  <p-multiSelect
    inputId="roles"
    [options]="availableRoles"
    optionLabel="name"
    optionValue="id"
    formControlName="roleIds"
    placeholder="Select roles"
    appendTo="body"
  />
</div>
```

### MultiSelect with Chips

```html
<p-multiSelect
  [options]="tags"
  optionLabel="name"
  formControlName="tags"
  display="chip"
  [filter]="true"
  placeholder="Add tags..."
  appendTo="body"
/>
```

## Accessibility

| Requirement | Implementation |
|-------------|---------------|
| Label association | Use `inputId` prop and matching `<label for>` |
| Keyboard navigation | Arrow keys navigate; Space toggles selection; Escape closes |
| Screen reader | Selected count announced; options list announced on open |
| Focus indicator | `box-shadow: var(--tp-focus-ring)` on focus |
| Touch target | Minimum 44px height |

## Do / Don't

### Do

- Use `appendTo="body"` to prevent overlay clipping
- Enable `[filter]="true"` when options exceed 7 items
- Use `display="chip"` for better visibility of selections
- Set `maxSelectedLabels` to prevent overflow

### Don't

- Never use multiselect for single selection -- use `p-select`
- Never render more than 50 options without filtering
- Never omit the label
