# Color Foundation

**Status:** [DOCUMENTED]
**Source of Truth:** `frontend/src/styles.scss`
**Last Verified:** 2026-03-22

---

## Core Palette

All colors are defined as CSS custom properties under the `--tp-*` and `--nm-*` namespaces in `:root`.

| Token | Hex | Usage |
|-------|-----|-------|
| `--tp-primary` | `#428177` | Actions, links, interactive elements |
| `--tp-primary-dark` | `#054239` | Hover states, headers |
| `--tp-surface` | `#F2EFE9` | Page background |
| `--tp-bg` | `#F2EFE9` | Root page background |
| `--tp-surface-raised` | `#FAF8F4` | Cards, panels, inputs (floating surfaces) |
| `--tp-surface-light` | `#FAF8F5` | Lighter surface variant |
| `--tp-surface-muted` | `#F0EDE7` | Muted/dimmed surface |
| `--nm-surface` | `#E0DDDA` | Recessed/inset areas (tab wells, search containers) |

## Text Colors

| Token | Hex | Usage |
|-------|-----|-------|
| `--tp-text` | `#3d3a3b` | Body text |
| `--tp-text-dark` | `#2A241C` | Headings, high-emphasis text, overlay tint base |
| `--tp-text-secondary` | `#7A7672` | Secondary information, subtitles |
| `--tp-text-muted` | `#999590` | Tertiary text, placeholders, helper copy |
| `--tp-link` | `#428177` | Link text color |
| `--tp-grey` | `#999590` | Muted text, icons |
| `--tp-grey-light` | `#D4D1CC` | Light grey borders, dividers |

## Border Tokens

| Token | Hex | Usage |
|-------|-----|-------|
| `--tp-border` | `#E0DDDA` | Default structural border (cards, panels, inputs) |
| `--nm-border-soft` | `#E0DDDA` | Neumorphic card border |
| `--tp-border-light` | `#E8E5E0` | Subtle dividers, wizard steps |

## Semantic Colors

| Token | Hex | Purpose |
|-------|-----|---------|
| `--tp-success` | `#428177` | Success states, confirmations |
| `--tp-warning` | `#988561` | Warning states, caution messages |
| `--tp-danger` | `#6b1f2a` | Errors, destructive actions, delete buttons |
| `--tp-danger-hover` | `#4a151e` | Danger button hover/pressed state |
| `--tp-warning-dark` | `#5a4a2a` | Dark warning text (toast/banner) |
| `--tp-info` | `#054239` | Informational states, help text |
| `--tp-error` | `#ef4444` | Form validation errors (distinct from danger) |

## Derived Color Tokens

These tokens are computed from core colors using `color-mix()` and provide consistent transparency variants.

| Token | Derivation | Usage |
|-------|-----------|-------|
| `--tp-danger-bg` | `color-mix(in srgb, var(--tp-danger) 6%, transparent)` | Danger alert background |
| `--tp-danger-border` | `color-mix(in srgb, var(--tp-danger) 15%, transparent)` | Danger alert border |
| `--tp-primary-bg` | `color-mix(in srgb, var(--tp-primary) 6%, transparent)` | Selected row, highlight background |
| `--tp-primary-bg-hover` | `color-mix(in srgb, var(--tp-primary) 12%, transparent)` | Hover on highlighted items |
| `--tp-error-bg` | `color-mix(in srgb, var(--tp-error) 10%, transparent)` | Error alert background |
| `--tp-error-border` | `color-mix(in srgb, var(--tp-error) 30%, transparent)` | Error alert border |
| `--tp-error-text` | `#b91c1c` (hardcoded) | Error message text color |

### Derived Color Pattern

To create new color variants, use the `color-mix(in srgb, ...)` function. This ensures all derived colors stay in sync with their base token.

```scss
/* Pattern: background variant (6% opacity) */
--tp-{name}-bg: color-mix(in srgb, var(--tp-{name}) 6%, transparent);

/* Pattern: border variant (15% opacity) */
--tp-{name}-border: color-mix(in srgb, var(--tp-{name}) 15%, transparent);

/* Pattern: hover variant (12% opacity) */
--tp-{name}-bg-hover: color-mix(in srgb, var(--tp-{name}) 12%, transparent);

/* Pattern: strong border (30% opacity) */
--tp-{name}-border-strong: color-mix(in srgb, var(--tp-{name}) 30%, transparent);
```

### Recommended Opacity Levels

| Level | Percentage | Use Case |
|-------|-----------|----------|
| Subtle background | 6% | Alert backgrounds, selected rows |
| Hover background | 12% | Hover state on subtle backgrounds |
| Light border | 15% | Alert borders, dividers |
| Medium border | 30% | Input borders, strong dividers |
| Translucent | 50% | Overlays, scrims |

---

## Three-Tier Depth Model

The design system uses three surface tiers to communicate visual hierarchy through background color alone.

```
Page background:  #F2EFE9  (--tp-surface, --tp-bg)
Recessed/inset:   #E0DDDA  (--nm-surface) -- tab wells, search containers
Cards/panels:     #FAF8F4  (--tp-surface-raised) -- floating content
```

**Canonical visual reference:** [component-showcase.html](../component-showcase.html)
defines the frozen token contract. Repo token sources and `tokens.css` must
match the values declared there.

## Shadow Tokens (RGB Channels)

Shadow tokens expose raw RGB channel values for use with `rgba()`.

| Token | RGB | Hex | Usage |
|-------|-----|-----|-------|
| `--nm-shadow-dark-rgb` | `152, 133, 97` | `#988561` | Dark shadow base (warm brown) |
| `--nm-shadow-light-rgb` | `245, 230, 208` | `#F5E6D0` | Light shadow base (Rose Gold) |
| `--nm-black-rgb` | `42, 36, 28` | `#2A241C` | Warm black for opacity composites |
| `--nm-text-deep-rgb` | `42, 36, 28` | `#2A241C` | Deep text / overlay tint base |

## Neumorphic Tokens (`--nm-*`)

| Token | Value | Usage |
|-------|-------|-------|
| `--nm-bg` | `#F2EFE9` | Neumorphic surface background (matches `--tp-bg`) |
| `--nm-shadow-dark` | `rgba(152, 133, 97, 0.38)` | Lower-right shadow (depth) |
| `--nm-shadow-light` | `rgba(255, 255, 255, 0.7)` | Upper-left highlight used by the showcase shell and inset logo treatment |
| `--nm-accent` | `#428177` | Accent color for active neumorphic elements (matches `--tp-primary`) |
| `--nm-radius` | `16px` | Default border radius for neumorphic cards |
| `--nm-depth` | `12px` | Shadow offset distance |

### Elevation Tokens

Primary declarations live in `frontend/src/app/core/theme/default-preset.scss` under the `--nm-elevation-*` namespace. Aliases under `--tp-elevation-*` are defined in `advanced-css-governance.scss` for backward compatibility.

| Primary Token | Alias | Value | Usage |
|-------|-------|-------|-------|
| `--nm-elevation-default` | `--tp-elevation-default` | `none` | Flat card resting state |
| `--nm-elevation-hover` | `--tp-elevation-hover` | `none` | Flat card hover state |
| `--nm-elevation-pressed` | `--tp-elevation-pressed` | `none` | Flat card pressed state |
| `--nm-elevation-subtle` | — | `none` | Flat card subtle lift is retired |

**Note:** New code should prefer `--nm-elevation-*` tokens. The `--tp-elevation-*` aliases exist for legacy compatibility and resolve to the same values.

## Overlay Tokens

Overlays use a warm dark brown (`#2A241C`) at reduced opacity instead of cold black, to harmonize with the warm cream background.

| Token | Value | Usage |
|-------|-------|-------|
| `--nm-overlay` | `rgba(42, 36, 28, 0.32)` | Dialog/modal backdrop |
| `--nm-overlay-strong` | `rgba(42, 36, 28, 0.36)` | High-emphasis overlays |
| `--nm-overlay-mobile` | `rgba(42, 36, 28, 0.28)` | Mobile drawer backdrop |
| `--nm-overlay-bg` | `color-mix(in srgb, var(--tp-text-dark) 24%, transparent)` | Factsheet/panel overlay |

## Glass Morphism

Glass morphism is used for overlays and dialogs only -- never for regular page content.

**Overlay backdrop:**
- Background: `rgba(var(--nm-text-deep-rgb), 0.18)`
- Effect: `backdrop-filter: blur(6px)`

**Dialog card:**
- Background: `rgba(242, 239, 233, 0.72)`
- Effect: `backdrop-filter: blur(20px)`
- Border: `1px solid rgba(255, 255, 255, 0.35)`

---

## Neumorphic Composite Tokens (`default-preset.scss`)

These composite tokens are declared in `frontend/src/app/core/theme/default-preset.scss` and provide component-level semantic tokens derived from the core palette.

### Background Tokens

| Token | Value | Usage |
|-------|-------|-------|
| `--nm-bg-card-base` | `var(--tp-surface-raised)` | Default card background |
| `--nm-bg-card-strong` | `var(--tp-surface-raised)` | Emphasized card background |
| `--nm-bg-card-gradient` | `var(--tp-surface-raised)` | Gradient card background |
| `--nm-bg-accent-soft` | `color-mix(in srgb, var(--tp-primary) 8%, transparent)` | Subtle accent highlight |
| `--nm-bg-panel-soft` | `color-mix(in srgb, var(--tp-surface) 80%, var(--tp-surface-raised))` | Soft panel background |
| `--nm-bg-palette-gradient` | `var(--tp-surface-raised)` | Palette card background |
| `--nm-bg-scrollbar-thumb` | `rgba(var(--nm-black-rgb), 0.15)` | Custom scrollbar thumb |
| `--nm-bg-danger-soft` | `color-mix(in srgb, var(--tp-danger) 6%, transparent)` | Subtle danger background |
| `--nm-bg-danger-soft-strong` | `color-mix(in srgb, var(--tp-danger) 10%, transparent)` | Emphasized danger background |
| `--nm-bg-warning-soft` | `color-mix(in srgb, var(--tp-warning) 8%, transparent)` | Subtle warning background |

### Border Tokens

| Token | Value | Usage |
|-------|-------|-------|
| `--nm-border-accent` | `1px solid color-mix(…primary 20%…)` | Accent-tinted border |
| `--nm-border-accent-soft` | `1px solid color-mix(…primary 12%…)` | Subtle accent border |
| `--nm-border-accent-hover` | `1px solid color-mix(…primary 35%…)` | Accent border on hover |
| `--nm-border-danger` | `1px solid color-mix(…danger 20%…)` | Danger-tinted border |
| `--nm-border-warning` | `1px solid color-mix(…warning 20%…)` | Warning-tinted border |
| `--nm-border-strong` | `1px solid rgba(var(--nm-black-rgb), 0.12)` | Strong structural border |
| `--nm-border-divider` | `1px solid rgba(var(--nm-black-rgb), 0.08)` | Subtle divider |
| `--nm-border-swatch` | `1px solid rgba(var(--nm-black-rgb), 0.1)` | Color swatch border |
| `--nm-border-swatch-strong` | `1px solid rgba(var(--nm-black-rgb), 0.18)` | Emphasized swatch border |

### Color Preset Tokens (Branding Studio)

| Token | Value | Usage |
|-------|-------|-------|
| `--nm-color-preset-neumorph-bg` | `color-mix(…primary 12%…surface)` | Neumorphic preset background |
| `--nm-color-preset-aqua-text` | `#0369a1` | Aqua preset text |
| `--nm-color-preset-aqua-bg` | `color-mix(…#0ea5e9 12%…surface)` | Aqua preset background |
| `--nm-color-preset-sand-text` | `#78350f` | Sand preset text |
| `--nm-color-preset-sand-bg` | `color-mix(…warning 18%…surface)` | Sand preset background (uses `--tp-warning`, not retired `--tp-primary-light`) |
| `--nm-color-preset-slate-text` | `#334155` | Slate preset text |
| `--nm-color-preset-slate-bg` | `color-mix(…#64748b 12%…surface)` | Slate preset background |

### Shadow Aliases (Branding Studio)

| Token | Resolves to | Usage |
|-------|------------|-------|
| `--nm-shadow-bs-search-inset` | `var(--nm-shadow-search-inset)` | Branding studio search inset |
| `--nm-shadow-catalog-active` | `var(--nm-shadow-tab-active)` | Active catalog tab shadow |
| `--nm-shadow-preview-inset` | `var(--nm-shadow-overview-inset)` | Preview panel inset |
| `--nm-shadow-preset-pill` | `var(--nm-shadow-pill)` | Preset pill shadow |
| `--nm-shadow-palette-field` | `var(--nm-shadow-input-inset)` | Palette field inset shadow |
| `--nm-shadow-bs-input-inset` | `var(--nm-shadow-input-inset)` | Branding studio input inset |

---

## Radius Scale

| Token | Value | Usage |
|-------|-------|-------|
| `--nm-radius-xs` | `4px` | Small badges, tiny elements |
| `--nm-radius-sm` | `8px` | Buttons, inputs, small cards |
| `--nm-radius-md` | `12px` | Medium cards, dialog inputs |
| `--nm-radius-lg` | `16px` | Cards, panels (= `--nm-radius`) |
| `--nm-radius-xl` | `20px` | Large dialogs, hero cards |
| `--nm-radius-pill` | `999px` | Pills, search bars |

## Type Scale

| Token | Value |
|-------|-------|
| `--tp-font-xs` | `0.72rem` |
| `--tp-font-sm` | `0.82rem` |
| `--tp-font-md` | `0.92rem` |
| `--tp-font-lg` | `1.1rem` |
| `--tp-font-xl` | `1.4rem` |

## Z-Index Scale

| Token | Value | Usage |
|-------|-------|-------|
| `--tp-z-base` | `0` | Default stacking |
| `--tp-z-content` | `1` | Content layers |
| `--tp-z-sidebar` | `20` | Sidebar |
| `--tp-z-header` | `40` | Header bar |
| `--tp-z-overlay` | `900` | Overlay backdrops |
| `--tp-z-modal` | `1000` | Modal dialogs |
| `--tp-z-toast` | `2000` | Toast notifications |

## Transition Tokens

| Token | Value |
|-------|-------|
| `--tp-transition-fast` | `0.12s` |
| `--tp-transition-normal` | `0.2s` |
| `--tp-transition-slow` | `0.3s` |

---

## Input Style (Inner App)

Inputs within the main application use the following token-based styling:

| Property | Value | Token |
|----------|-------|-------|
| Background | `#FAF8F4` | `var(--tp-surface-raised)` |
| Border | `1.5px solid #E0DDDA` | `1.5px solid var(--nm-border-soft)` |
| Border radius | `12px` | `var(--nm-radius-md)` |
| Focus border | `#428177` | `border-color: var(--tp-primary)` |
| Focus shadow | `0 0 0 3px rgba(accent, 0.08)` | -- |

No inset shadow is used on inputs.

---

## Contrast Requirements

EMSIST targets WCAG AAA compliance.

| Requirement | Minimum Ratio | Applies To |
|-------------|--------------|------------|
| Normal text (< 18px) | 7:1 | Body copy, labels, captions |
| Large text (>= 18px bold or >= 24px) | 4.5:1 | Headings, large UI text |
| Non-text elements | 3:1 | Icons, borders, focus indicators |

### Verified Contrast Ratios

| Foreground | Background | Ratio | Passes AAA |
|-----------|-----------|-------|------------|
| `--tp-text` (#3d3a3b) | `--tp-surface` (#F2EFE9) | 7.6:1 | Yes (normal) |
| `--tp-text-dark` (#2A241C) | `--tp-surface` (#F2EFE9) | 10.8:1 | Yes (normal) |
| `--tp-surface-light` (#FAF8F5) | `--tp-primary` (#428177) | 3.7:1 | Yes (large only) |
| `--tp-surface-light` (#FAF8F5) | `--tp-primary-dark` (#054239) | 10.1:1 | Yes (normal) |
| `--tp-surface-light` (#FAF8F5) | `--tp-danger` (#6b1f2a) | 8.9:1 | Yes (normal) |
| `--tp-error-text` (#b91c1c) | `--tp-error-bg` (~#fef2f2) | 6.1:1 | Yes (large only) |
| `--tp-text` (#3d3a3b) | `--tp-surface-light` (#FAF8F5) | 10.2:1 | Yes (normal) |

**Note:** White text on `--tp-primary` (#428177) does NOT meet AAA for normal text (3.8:1 < 7:1). Use `--tp-primary-dark` for text backgrounds that must carry white body text, or use dark text on primary backgrounds.

---

## Design Rules

### Do

- Use `var(--tp-surface-raised)` for card/panel backgrounds
- Use `var(--tp-surface-light)` for text/foreground on dark backgrounds
- Use `var(--nm-border-soft)` or `var(--tp-border)` for borders -- NOT hardcoded hex values
- Use `rgba(var(--nm-black-rgb), opacity)` -- NOT `rgba(0, 0, 0, opacity)`
- Use glass morphism for overlays/dialogs -- NOT opaque backgrounds
- Use radius scale tokens -- NOT hardcoded px values
- Use `var(--tp-primary)` for all interactive element colors
- Use `color-mix()` to derive transparent variants from existing tokens
- Test contrast ratios when pairing any foreground/background combination
- Use `--tp-primary-dark` (not `--tp-primary`) for backgrounds carrying white text
- Use semantic tokens (`--tp-danger`, `--tp-success`) instead of core tokens for state communication
- Specify individual transition properties (e.g., `transition: background-color 0.2s, border-color 0.2s`)

### Don't

- Never use `transition: all` -- specify properties explicitly
- Never use Bootstrap/Tailwind colors (`#2563eb`, `#e5e7eb`, etc.)
- Never hardcode hex values like `color: #428177` -- always use `var(--tp-primary)`
- Never use `rgba()` with hardcoded color channels -- use `color-mix()` with tokens instead
- Never rely on color alone to convey meaning -- always pair with icon, text, or pattern
- Never introduce new color tokens without adding them to `styles.scss` `:root`
- Never use `--tp-success` and `--tp-primary` interchangeably even though they share the same hex (they have different semantic meaning and may diverge in future themes)

### Exception

The login page is EXCLUDED from these rules. It uses its own teal neumorphic theme.
