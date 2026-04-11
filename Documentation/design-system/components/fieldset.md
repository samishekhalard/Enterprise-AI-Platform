# Fieldset Component

**Status:** [DOCUMENTED]
**PrimeNG Component:** `p-fieldset`
**Module Import:** `FieldsetModule`
**PrimeNG Docs:** [Fieldset](https://primeng.org/fieldset)

## Overview

Fieldset groups related form fields under a collapsible section with a legend header. In EMSIST, fieldsets are used to organize complex forms into logical sections. Styled globally via PrimeNG CSS variables in `styles.scss` with Grey Neutral tokens.

## When to Use

- Grouping related form fields (e.g., "Contact Details", "Security Settings")
- Collapsible form sections to reduce visual clutter
- Separating optional fields from required fields

## When NOT to Use

- Content sections without forms -- use `p-card`
- Tab-based form sections -- use `p-tabs`
- Accordion-style multiple expandable sections -- use `p-accordion`

## Variants

| Variant | Props | Use Case |
|---------|-------|----------|
| Basic | `legend` only | Static form group |
| Toggleable | `[toggleable]="true"` | Collapsible form section |

## Key Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `legend` | `string` | -- | Section header text |
| `toggleable` | `boolean` | `false` | Allow collapse/expand |
| `collapsed` | `boolean` | `false` | Initial collapsed state |

## Grey Neutral Token Mapping

| Token | Value | Purpose |
|-------|-------|---------|
| `--p-fieldset-background` | `var(--tp-surface-raised)` | Fieldset background (#FAF8F4) |
| `--p-fieldset-border-color` | `var(--tp-border-light)` | Subtle border (#E8E5E0) |
| `--p-fieldset-border-radius` | `var(--nm-radius-lg)` | 16px radius (neumorphic) |
| `--p-fieldset-color` | `var(--tp-text)` | Text color |
| `--p-fieldset-legend-background` | `var(--tp-surface)` | Legend background (#F2EFE9) |
| `--p-fieldset-legend-color` | `var(--tp-text-dark)` | Legend text |
| `--p-fieldset-legend-border-color` | `var(--tp-border)` | Legend border |
| `--p-fieldset-legend-font-weight` | `600` | Legend weight |

## Code Examples

### Basic Fieldset

```html
<p-fieldset legend="Contact Information">
  <div style="display: grid; gap: var(--tp-space-4);">
    <div style="display: grid; gap: var(--tp-space-2);">
      <label for="email">Email</label>
      <input pInputText id="email" formControlName="email" />
    </div>
    <div style="display: grid; gap: var(--tp-space-2);">
      <label for="phone">Phone</label>
      <input pInputText id="phone" formControlName="phone" />
    </div>
  </div>
</p-fieldset>
```

### Toggleable Fieldset

```html
<p-fieldset legend="Advanced Settings" [toggleable]="true" [collapsed]="true">
  <div style="display: grid; gap: var(--tp-space-4);">
    <div style="display: grid; gap: var(--tp-space-2);">
      <label for="timeout">Session Timeout (minutes)</label>
      <p-inputNumber inputId="timeout" formControlName="timeout" [min]="5" [max]="120" />
    </div>
  </div>
</p-fieldset>
```

## Accessibility

| Requirement | Implementation |
|-------------|---------------|
| Semantic structure | Renders as native `<fieldset>` with `<legend>` |
| Keyboard navigation | Toggle button is focusable and activates with Enter/Space |
| Screen reader | Legend text announces the group label |
| ARIA attributes | `aria-expanded` set on toggle button |

## Do / Don't

### Do

- Use descriptive legend text that identifies the group
- Use `[toggleable]="true"` for optional/advanced sections
- Keep fieldsets to 3-6 fields per group

### Don't

- Never nest fieldsets more than one level deep
- Never use fieldset for non-form content grouping
- Never hide required fields in collapsed fieldsets
