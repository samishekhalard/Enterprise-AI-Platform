# RadioButton

**Component:** `p-radioButton` (RadioButtonModule)
**Status:** [DOCUMENTED]
**PrimeNG:** v21 — `RadioButton` standalone component

## Token Map

| Token | Value | Usage |
|-------|-------|-------|
| `--tp-radio-size` | `20px` | Radio dimensions |
| `--tp-radio-border` | `2px solid var(--tp-border)` | Default border |
| `--tp-radio-bg` | `var(--tp-surface-raised)` | Unchecked background |
| `--tp-radio-checked-bg` | `var(--tp-surface-raised)` | Selected background |
| `--tp-radio-checked-border-color` | `var(--tp-primary)` | Selected border |
| `--tp-radio-checked-icon-color` | `var(--tp-primary)` | Inner dot color |
| `--tp-radio-hover-border-color` | `var(--tp-primary)` | Hover state |
| `--tp-radio-focus-ring` | `var(--tp-focus-ring)` | Focus indicator |
| `--tp-radio-disabled-bg` | `var(--nm-surface)` | Disabled state |

## Usage Rules

- Use for exclusive selection (pick one from N)
- Always show all options visible (2-5 options)
- For 6+ options, use `p-select` dropdown instead
- Group with `name` attribute for correct native behavior
- Never use for binary on/off (use `p-toggleSwitch` instead)

## Accessibility

- Built-in `role="radio"` and `aria-checked`
- Arrow keys navigate within group (native behavior)
- Group with `<fieldset>` + `<legend>` for screen readers
