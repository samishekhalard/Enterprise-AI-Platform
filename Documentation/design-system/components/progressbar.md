# ProgressBar

**Component:** `p-progressbar` (ProgressBarModule)
**Status:** [DOCUMENTED]
**PrimeNG:** v21 — `ProgressBar` standalone component

## Token Map

| Token | Value | Usage |
|-------|-------|-------|
| `--tp-progressbar-height` | `8px` | Bar thickness |
| `--tp-progressbar-bg` | `var(--nm-surface)` | Track background |
| `--tp-progressbar-value-bg` | `var(--tp-primary)` | Fill color |
| `--tp-progressbar-border-radius` | `var(--nm-radius-pill)` | Rounded ends |
| `--tp-progressbar-label-color` | `var(--tp-surface-light)` | Label on fill |

## Usage Rules

- Use for provisioning progress, upload progress, and completion tracking
- Set `[showValue]="true"` only when bar is tall enough (> 16px)
- For thin bars (8px), show percentage as adjacent text
- Use `[mode]="'indeterminate'"` when progress is unknown
- Always pair with `aria-label` describing the operation
