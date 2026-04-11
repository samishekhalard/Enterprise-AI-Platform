# Slider

**Component:** `p-slider` (SliderModule)
**Status:** [DOCUMENTED]
**PrimeNG:** v21 — `Slider` standalone component

## Token Map

| Token | Value | Usage |
|-------|-------|-------|
| `--tp-slider-track-bg` | `var(--nm-surface)` | Track background |
| `--tp-slider-track-height` | `6px` | Track thickness |
| `--tp-slider-track-border-radius` | `var(--nm-radius-pill)` | Track rounding |
| `--tp-slider-range-bg` | `var(--tp-primary)` | Active range fill |
| `--tp-slider-handle-bg` | `var(--tp-surface-raised)` | Handle background |
| `--tp-slider-handle-border` | `2px solid var(--tp-primary)` | Handle border |
| `--tp-slider-handle-size` | `20px` | Handle dimensions |
| `--tp-slider-handle-border-radius` | `50%` | Handle shape (circle) |
| `--tp-slider-handle-hover-bg` | `var(--tp-surface-light)` | Handle hover |
| `--tp-slider-handle-focus-ring` | `var(--tp-focus-ring)` | Focus indicator |

## Usage Rules

- Always pair with a visible label and numeric display showing current value
- Use `[min]` and `[max]` props — never rely on defaults
- Show available/remaining values in a header row above the slider
- For license allocation: slider + numeric readout pattern
- Touch target: handle must meet `--tp-touch-target` (44px) minimum

## Accessibility

- Built-in `role="slider"`, `aria-valuemin`, `aria-valuemax`, `aria-valuenow`
- Arrow keys adjust value (native behavior)
- Pair with `aria-label` or visible label via `aria-labelledby`
