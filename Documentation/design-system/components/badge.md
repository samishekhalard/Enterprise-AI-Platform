# Badge

**Component:** `p-badge` (BadgeModule)
**Status:** [DOCUMENTED]
**PrimeNG:** v21 — `Badge` standalone component

## Token Map

| Token | Value | Usage |
|-------|-------|-------|
| `--tp-badge-min-width` | `1.25rem` | Minimum badge size |
| `--tp-badge-height` | `1.25rem` | Badge height |
| `--tp-badge-font-size` | `0.72rem` | Counter text size |
| `--tp-badge-font-weight` | `700` | Bold numerals |
| `--tp-badge-bg` | `var(--tp-primary)` | Default background |
| `--tp-badge-color` | `var(--tp-surface-light)` | Text on badge |
| `--tp-badge-border-radius` | `var(--nm-radius-pill)` | Circular shape |

## Usage Rules

- Use for numeric counts on tab headers, icons, and navigation items
- Use `[value]` prop with formatted count string
- For counts >= 1000, use `Intl.NumberFormat` for locale-aware display
- Maximum value display: `99+` for space-constrained contexts
- Never use as a standalone status indicator — use `p-tag` instead
