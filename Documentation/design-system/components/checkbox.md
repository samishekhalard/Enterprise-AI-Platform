# Checkbox

**Component:** `p-checkbox` (CheckboxModule)
**Status:** [DOCUMENTED]
**PrimeNG:** v21 — `Checkbox` standalone component

## Token Map

| Token | Value | Usage |
|-------|-------|-------|
| `--tp-checkbox-size` | `20px` | Checkbox dimensions |
| `--tp-checkbox-border` | `2px solid var(--tp-border)` | Default border |
| `--tp-checkbox-border-radius` | `var(--nm-radius-xs)` (4px) | Corner radius |
| `--tp-checkbox-bg` | `var(--tp-surface-raised)` | Unchecked background |
| `--tp-checkbox-checked-bg` | `var(--tp-primary)` | Checked fill |
| `--tp-checkbox-checked-border-color` | `var(--tp-primary)` | Checked border |
| `--tp-checkbox-checked-icon-color` | `var(--tp-surface-light)` | Checkmark color |
| `--tp-checkbox-hover-border-color` | `var(--tp-primary)` | Hover state |
| `--tp-checkbox-focus-ring` | `var(--tp-focus-ring)` | Focus indicator |
| `--tp-checkbox-disabled-bg` | `var(--nm-surface)` | Disabled state |

## Usage Rules

- Always pair with a visible `<label>`
- Use for binary or multi-select options
- Never use as a toggle replacement (use `p-toggleSwitch` for on/off)
- Group related checkboxes visually with consistent spacing (`--tp-space-3`)

## Accessibility

- Built-in `role="checkbox"` and `aria-checked`
- Space key toggles (native behavior)
- Label must be associated via `inputId` prop matching `<label for="...">`
- Minimum 44px touch target (handled by `--tp-touch-target`)
