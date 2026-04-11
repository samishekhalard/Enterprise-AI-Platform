# Typography Foundation

**Status:** [DOCUMENTED]
**Source of Truth:** `frontend/src/styles.scss` `:root` block (token declarations) and `@font-face` blocks
**Last Verified:** 2026-03-22

**Canonical visual reference:** [component-showcase.html](../component-showcase.html)
defines the frozen typography contract. Repo token sources, docs, tests, and
governance must match the font stack and token values declared there.

## Font Stack

```scss
body {
  font-family:
    'Gotham Rounded',    /* Primary brand font */
    'Nunito',            /* Fallback: similar rounded sans-serif */
    'Segoe UI',          /* Windows system font */
    -apple-system,       /* macOS system font */
    BlinkMacSystemFont,  /* Chrome macOS system font */
    sans-serif;          /* Generic fallback */
}
```

**Primary font:** Gotham Rounded is the brand typeface, loaded via `@font-face` from local OTF files in `/assets/fonts/`. The `font-display: swap` declaration ensures text remains visible during font loading.

**Fallback strategy:** Nunito is the first fallback because it shares Gotham Rounded's rounded terminal style, providing the closest visual match when the primary font is unavailable. After Nunito, the stack falls through to platform system fonts.

## Font Weights

Three weight ranges are defined via `@font-face`:

| Weight Name | CSS Range | File | Usage |
|-------------|----------|------|-------|
| Book | 300-400 | `GothamRounded-Book.otf` | Body text, labels, secondary content |
| Medium | 500-600 | `GothamRounded-Medium.otf` | Subheadings, emphasized text, nav items |
| Bold | 700 | `GothamRounded-Bold.otf` | Headings, buttons, strong emphasis |

### Recommended Usage

| Context | `font-weight` | Result |
|---------|--------------|--------|
| Body text | `400` (normal) | Book |
| Labels, captions | `400` | Book |
| Button text | `600` | Medium |
| Subheadings (h3, h4) | `500` or `600` | Medium |
| Headings (h1, h2) | `700` | Bold |
| Navigation items | `600` | Medium |
| Table headers | `600` | Medium |
| Badges, tags | `600` | Medium |

## Type Scale

### Implementation Tokens

The live type scale is defined as CSS custom properties in `styles.scss`:

| Token | Value | Approximate px | Use Case |
|-------|-------|---------------|----------|
| `--tp-font-xs` | `0.72rem` | ~11.5px | Captions, helper text, timestamps, microcopy |
| `--tp-font-sm` | `0.82rem` | ~13px | Table cells, compact content, labels |
| `--tp-font-md` | `0.92rem` | ~14.7px | Default body text, form inputs |
| `--tp-font-lg` | `1.15rem` | ~18.4px | Card titles, subheadings, emphasized text |
| `--tp-font-xl` | `1.35rem` | ~21.6px | Section headings, page titles |

All component SCSS must use `var(--tp-font-*)` tokens for font sizes. Hardcoded `rem` or `px` values are lint violations unless explicitly documented as approved exceptions.

### Semantic Guidance Scale

The following scale provides semantic guidance for heading hierarchy and text roles. Components should map from this guidance to the closest `--tp-font-*` token.

| Level | Recommended Token | Line Height | Weight | Use Case |
|-------|------------------|-------------|--------|----------|
| Display | `clamp()` or `--tp-font-xl` | 1.2 | 700 | Hero sections, landing pages |
| H1 | `--tp-font-xl` | 1.2 | 700 | Page titles |
| H2 | `--tp-font-xl` | 1.3 | 700 | Section headings |
| H3 | `--tp-font-lg` | 1.4 | 600 | Card titles, subsections |
| H4 | `--tp-font-md` | 1.4 | 600 | Minor headings, group labels |
| Body | `--tp-font-md` | 1.5 | 400 | Default body text |
| Body Small | `--tp-font-sm` | 1.5 | 400 | Table cells, compact content |
| Caption | `--tp-font-xs` | 1.4 | 400 | Captions, helper text, timestamps |
| Overline | `--tp-font-xs` | 1.4 | 600 | Category labels, overline text (uppercase) |

## Heading Hierarchy

Headings use `--tp-text-dark` (#161616) for maximum contrast against the surface background.

```scss
h1 {
  font-size: 1.953rem;    /* ~31px */
  font-weight: 700;
  line-height: 1.2;
  color: var(--tp-text-dark);
}

h2 {
  font-size: 1.563rem;    /* ~25px */
  font-weight: 700;
  line-height: 1.3;
  color: var(--tp-text-dark);
}

h3 {
  font-size: 1.25rem;     /* 20px */
  font-weight: 600;
  line-height: 1.4;
  color: var(--tp-text-dark);
}

h4 {
  font-size: 1rem;        /* 16px */
  font-weight: 600;
  line-height: 1.4;
  color: var(--tp-text-dark);
}
```

**Note:** In `styles.scss`, `h2`, `h3`, `h4`, and `p` have `margin: 0` reset. All vertical spacing between headings and content must be set explicitly using spacing tokens.

## Body Text

| Property | Value |
|----------|-------|
| Font size | `1rem` (16px) |
| Line height | 1.5 |
| Color | `var(--tp-text)` (#3d3a3b) |
| Paragraph spacing | 0 (reset in styles.scss); use `var(--tp-space-3)` or `var(--tp-space-4)` between paragraphs |

### Paragraph Spacing Pattern

Since margins are reset to 0, use explicit spacing:

```html
<p style="margin-block-end: var(--tp-space-3)">First paragraph.</p>
<p>Second paragraph.</p>
```

Or with a utility class:

```scss
.text-block > * + * {
  margin-block-start: var(--tp-space-3);
}
```

## Text Colors

| Token | Usage |
|-------|-------|
| `var(--tp-text-dark)` | Headings, high-emphasis text |
| `var(--tp-text)` | Body text, labels |
| `var(--tp-text-secondary)` | Secondary information |
| `var(--tp-text-muted)` | Tertiary content, placeholders |
| `var(--tp-surface-light)` | Text on dark backgrounds (buttons, headers) — warm near-white |
| `var(--tp-error-text)` | Validation error messages |

## RTL / Bidirectional Text

- Use `text-align: start` instead of `text-align: left`
- Use `text-align: end` instead of `text-align: right`
- Use `direction` and `unicode-bidi` properties for mixed-direction content
- Long text in RTL locales may require different line-height adjustments for Arabic script

## Do / Don't

### Do

- Use the defined font stack via `body` inheritance -- do not redeclare `font-family` on individual components
- Use `rem` for all font sizes to respect user browser settings
- Use `var(--tp-text-dark)` for headings and `var(--tp-text)` for body
- Use semantic weight values: `400` for body, `600` for emphasis, `700` for headings
- Maintain heading hierarchy (h1 > h2 > h3) -- do not skip levels
- Set `font-display: swap` on all `@font-face` declarations

### Don't

- Never use `px` for font sizes -- always use `rem`
- Never use `font-weight: bold` -- use explicit numeric weights (`700`)
- Never introduce font sizes outside the type scale without design system approval
- Never use `text-align: left` or `text-align: right` -- use `start` and `end` for RTL support
- Never set `line-height` below 1.2 for any text -- it harms readability
- Never use a font-family not in the defined stack
