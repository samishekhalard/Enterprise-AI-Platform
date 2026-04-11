# Spacing Foundation

**Status:** [DOCUMENTED]
**Source of Truth:** `frontend/src/styles.scss` (lines 62-74)
**Last Verified:** 2026-03-12

## Base Unit

The spacing system uses a **4px (0.25rem)** base unit. All spacing values are multiples of this base, ensuring consistent vertical and horizontal rhythm across the application.

## Spacing Scale

| Token | Value (rem) | Value (px) | Multiplier | Category |
|-------|------------|-----------|------------|----------|
| `--tp-space-0` | 0 | 0 | 0x | None |
| `--tp-space-1` | 0.25rem | 4px | 1x | Tight |
| `--tp-space-2` | 0.5rem | 8px | 2x | Compact |
| `--tp-space-3` | 0.75rem | 12px | 3x | Default |
| `--tp-space-4` | 1rem | 16px | 4x | Standard |
| `--tp-space-5` | 1.25rem | 20px | 5x | Comfortable |
| `--tp-space-6` | 1.5rem | 24px | 6x | Spacious |
| `--tp-space-8` | 2rem | 32px | 8x | Section |
| `--tp-space-10` | 2.5rem | 40px | 10x | Large |
| `--tp-space-12` | 3rem | 48px | 12x | Page |
| `--tp-space-16` | 4rem | 64px | 16x | Hero |

**Note:** The scale skips 7, 9, 11, 13-15. These gaps are intentional to discourage overly fine spacing distinctions. If you need a value between existing steps, use the nearest available token.

## Usage Guidelines

### Spacing Categories

| Category | Tokens | Use Cases |
|----------|--------|-----------|
| **Tight** (4px) | `--tp-space-1` | Inline icon-to-text gaps, badge padding, tag padding |
| **Compact** (8px) | `--tp-space-2` | Form field inner padding, compact list items, chip gaps |
| **Default** (12px) | `--tp-space-3` | Default inner padding, alert padding, toolbar padding |
| **Standard** (16px) | `--tp-space-4` | Card padding, form field gaps, grid gutters |
| **Comfortable** (20px) | `--tp-space-5` | Between form groups, card-to-card vertical gaps |
| **Spacious** (24px) | `--tp-space-6` | Section padding, dialog body padding |
| **Section** (32px) | `--tp-space-8` | Between major page sections, sidebar padding |
| **Large** (40px) | `--tp-space-10` | Major visual separations, content area margins |
| **Page** (48px) | `--tp-space-12` | Page top/bottom margins, large empty state spacing |
| **Hero** (64px) | `--tp-space-16` | Hero sections, header height contributions |

## Component Spacing

Recommended spacing for common component patterns:

### Cards

```scss
.card {
  padding: var(--tp-space-4);           /* 16px internal padding */
  gap: var(--tp-space-3);               /* 12px between card content sections */
}
.card + .card {
  margin-block-start: var(--tp-space-4); /* 16px between stacked cards */
}
```

### Form Fields

```scss
.form-group {
  gap: var(--tp-space-2);               /* 8px between label and input */
}
.form-group + .form-group {
  margin-block-start: var(--tp-space-4); /* 16px between form groups */
}
.form-actions {
  margin-block-start: var(--tp-space-6); /* 24px before action buttons */
  gap: var(--tp-space-3);               /* 12px between buttons */
}
```

### List Items

```scss
.list-item {
  padding: var(--tp-space-3) var(--tp-space-4); /* 12px vertical, 16px horizontal */
}
```

### Sections

```scss
.section {
  padding: var(--tp-space-6);            /* 24px all around */
}
.section + .section {
  margin-block-start: var(--tp-space-8); /* 32px between sections */
}
```

### Page Layout

```scss
.page-content {
  padding-block-start: var(--tp-space-6);     /* 24px top */
  padding-inline: var(--tp-space-8);           /* 32px sides */
  padding-block-end: var(--tp-space-6);        /* 24px bottom */
}
```

### Admin Content Area

Defined in `frontend/src/app/core/theme/advanced-css-governance.scss`:

| Token | Default (Landscape) | Portrait |
|-------|---------------------|----------|
| `--tp-admin-content-padding-top` | 104px | 88px |
| `--tp-admin-content-padding-inline` | 32px | 12px |
| `--tp-admin-content-padding-bottom` | 24px | 16px |

## Responsive Adjustments

Reduce spacing by one step on smaller viewports to maximize content area.

| Desktop | Tablet | Mobile | Used For |
|---------|--------|--------|----------|
| `--tp-space-8` (32px) | `--tp-space-6` (24px) | `--tp-space-4` (16px) | Page padding |
| `--tp-space-6` (24px) | `--tp-space-4` (16px) | `--tp-space-3` (12px) | Section padding |
| `--tp-space-4` (16px) | `--tp-space-3` (12px) | `--tp-space-3` (12px) | Card padding |
| `--tp-space-4` (16px) | `--tp-space-3` (12px) | `--tp-space-2` (8px) | Grid gutters |

### Implementation Pattern

```scss
.page-content {
  padding-inline: var(--tp-space-8);   /* Desktop: 32px */
}

@media (max-width: 1024px) {
  .page-content {
    padding-inline: var(--tp-space-6); /* Tablet: 24px */
  }
}

@media (max-width: 767px) {
  .page-content {
    padding-inline: var(--tp-space-4); /* Mobile: 16px */
  }
}
```

## Touch Targets

Defined in `advanced-css-governance.scss`:

| Token | Value | Requirement |
|-------|-------|-------------|
| `--tp-touch-target-min-size` | `44px` | WCAG 2.1 AAA minimum touch target size |

All interactive elements (buttons, links, form controls, menu items) must meet this minimum dimension.

## Do / Don't

### Do

- Use `var(--tp-space-*)` tokens for all spacing values
- Use logical properties (`margin-block-start`, `padding-inline`) instead of physical (`margin-top`, `padding-left`)
- Reduce spacing by one step on smaller breakpoints
- Use `gap` on flex/grid containers instead of margins on children
- Use the spacing scale consistently: tight for inline, standard for structural, spacious for sections

### Don't

- Never use arbitrary values like `padding: 13px` or `margin: 1.1rem`
- Never use physical properties (`margin-left`, `padding-right`) -- use logical properties for RTL support
- Never mix `px` and `rem` for spacing -- tokens are defined in `rem`, use them as-is
- Never skip more than 2 steps in the scale within a single component (e.g., don't jump from `space-1` to `space-8`)
- Never add spacing to the scale without updating `styles.scss` `:root` and this document
