# Tag Component

**Status:** [DOCUMENTED]
**PrimeNG Component:** `p-tag`
**Module Import:** `TagModule`
**PrimeNG Docs:** [Tag](https://primeng.org/tag)

## Overview

`p-tag` is the governed status-chip primitive for compact semantic labeling in
tables, cards, and detail metadata.

## When to Use

- status labels such as `Active`, `Pending`, `Protected`, `Expired`
- compact categorical chips in list and detail surfaces
- lightweight metadata that should remain non-interactive

## When NOT to Use

- actionable pills that trigger state changes
- long descriptive text
- primary page badges that need richer iconography or count treatment

## Token Map

| Token | Value | Usage |
|-------|-------|-------|
| `--tp-tag-border-radius` | `var(--nm-radius-pill)` | Always pill-shaped |
| `--tp-tag-font-size` | `0.72rem` | Compact text |
| `--tp-tag-font-weight` | `600` | Medium weight |
| `--tp-tag-padding` | `0.15rem 0.5rem` | Compact padding |

## Severity Mapping

| Meaning | Severity |
|---|---|
| success / healthy | `success` |
| informational / protected / directed | `info` or `secondary` |
| warning / pending | `warn` |
| destructive / expired / error | `danger` or `contrast` only when explicitly documented |

## Severity Variants

| Severity | Background | Text |
|----------|-----------|------|
| `primary` | `--tp-primary` | `--tp-surface-light` |
| `success` | `--tp-primary` at 12% | `--tp-primary-dark` |
| `info` | `--tp-info` at 12% | `--tp-info` |
| `warn` | `--tp-warning` at 12% | `--tp-warning-dark` |
| `danger` | `--tp-danger` at 12% | `--tp-danger` |
| `secondary` | `--tp-border` at 40% | `--tp-text` |

## Usage Rules

- Use `[rounded]="true"` for pill shape by default.
- Keep labels short, ideally one or two words.
- Use for status indicators, type badges, and categorical labels.
- Pair with readable text; do not use a tag as the only explanation of state in complex flows.
- Never use tags as buttons; they are read-only indicators.

## Accessibility

- Tags are informational, not interactive, unless explicitly turned into another documented primitive.
- Color is supplementary; label text must communicate the state.

## Example

```html
<p-tag [value]="tenant.status" [severity]="statusSeverity(tenant.status)" [rounded]="true" />
```
