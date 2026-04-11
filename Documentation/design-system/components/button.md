# Button Component

**Status:** [DOCUMENTED]
**PrimeNG Component:** `p-button`
**Module Import:** `ButtonModule`
**PrimeNG Docs:** [Button](https://primeng.org/button)

## Overview

Buttons trigger actions or navigate users. PrimeNG's `p-button` provides built-in accessibility, icon support, loading states, and multiple severity levels. All EMSIST buttons use `p-button` styled via `pt` passthrough with ThinkPLUS tokens.

## When to Use

- Triggering form submissions
- Confirming destructive actions (with danger severity)
- Navigating to a new page (use `routerLink` on the button)
- Toggling states (icon-only buttons in toolbars)

## When NOT to Use

- Inline text links -- use `<a>` with `routerLink` instead
- Menu triggers -- use `p-menu` with a trigger button
- Tab navigation -- use `p-tabs`

## Variants

| Variant | Attribute | Use Case |
|---------|----------|----------|
| Primary (filled) | `severity="primary"` | Main call-to-action per page (limit to 1) |
| Secondary (outlined) | `severity="secondary" outlined` | Secondary actions |
| Danger | `severity="danger"` | Destructive actions (delete, revoke) |
| Text | `text` | Low-emphasis actions, cancel buttons |
| Icon-only | `icon="pi pi-..." rounded text` | Toolbar actions, compact controls |
| Loading | `[loading]="true"` | Async operations in progress |

## Key Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `label` | `string` | -- | Button text |
| `icon` | `string` | -- | PrimeIcons class (e.g., `pi pi-check`) |
| `iconPos` | `'left'\|'right'\|'top'\|'bottom'` | `'left'` | Icon position relative to label |
| `severity` | `'primary'\|'secondary'\|'success'\|'info'\|'warning'\|'danger'\|'help'\|'contrast'` | -- | Color severity |
| `outlined` | `boolean` | `false` | Outlined style |
| `text` | `boolean` | `false` | Text-only style (no background/border) |
| `rounded` | `boolean` | `false` | Rounded corners |
| `raised` | `boolean` | `false` | Elevated shadow |
| `loading` | `boolean` | `false` | Show spinner, disable button |
| `disabled` | `boolean` | `false` | Disable interaction |
| `size` | `'small'\|'large'` | -- | Size variant |
| `badge` | `string` | -- | Badge value |
| `badgeSeverity` | `string` | -- | Badge color severity |

## ThinkPLUS Token Integration

Style via `pt` passthrough to apply ThinkPLUS tokens:

```html
<p-button
  label="Save"
  severity="primary"
  [pt]="{
    root: {
      style: {
        'background': 'linear-gradient(135deg, var(--tp-primary), var(--tp-primary-dark))',
        'border-color': 'var(--tp-primary)',
        'font-weight': '600',
        'padding': 'var(--tp-space-2) var(--tp-space-4)',
        'min-height': 'var(--tp-touch-target-min-size)'
      }
    }
  }"
/>
```

### Severity-to-Token Mapping

| Severity | Background | Border | Text |
|----------|-----------|--------|------|
| primary | `var(--tp-primary)` | `var(--tp-primary)` | `var(--tp-surface-light)` |
| danger | `var(--tp-danger)` | `var(--tp-danger)` | `var(--tp-surface-light)` |
| secondary | `transparent` | `var(--tp-border)` | `var(--tp-text)` |
| text | `transparent` | `none` | `var(--tp-primary)` |

## Code Examples

### Primary Action

```html
<p-button label="Create Object Type" icon="pi pi-plus" severity="primary" />
```

### Secondary Action

```html
<p-button label="Cancel" severity="secondary" outlined (onClick)="cancel()" />
```

### Danger Action with Confirmation

```html
<p-button
  label="Delete"
  icon="pi pi-trash"
  severity="danger"
  (onClick)="confirmDelete()"
/>
```

### Icon-Only Button

```html
<p-button
  icon="pi pi-pencil"
  rounded
  text
  severity="primary"
  pTooltip="Edit"
  tooltipPosition="top"
  aria-label="Edit item"
/>
```

### Loading State

```html
<p-button
  label="Saving..."
  [loading]="isSaving"
  severity="primary"
  [disabled]="isSaving"
/>
```

## Accessibility

| Requirement | Implementation |
|-------------|---------------|
| Keyboard activation | Enter and Space trigger click (built-in) |
| Focus indicator | `box-shadow: var(--tp-focus-ring)` on `:focus-visible` |
| Icon-only label | `aria-label` required on all icon-only buttons |
| Loading state | `aria-busy="true"` when loading (add manually) |
| Disabled state | `aria-disabled="true"` set automatically |
| Touch target | Minimum 44x44px via `--tp-touch-target-min-size` |
| Color contrast | White on `--tp-primary-dark` = 10.3:1 (AAA pass) |

## Do / Don't

### Do

- Limit to one primary button per page section
- Use `severity="danger"` for destructive actions
- Always add `aria-label` on icon-only buttons
- Show loading state during async operations
- Use `outlined` or `text` for secondary actions

### Don't

- Never use the `.app-btn` class for new buttons -- use `p-button` with `pt`
- Never place two primary buttons side by side
- Never disable a button without explaining why (use tooltip on the wrapper)
- Never use color alone to distinguish button types -- always pair with label/icon
