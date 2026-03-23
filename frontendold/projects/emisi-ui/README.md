# emisi-ui

Branded UI library for EMISI (Angular 21 + PrimeNG 21).

## Included

- Brand tokens: `EMISI_BRAND_TOKENS`
- Accessibility tokens: `EMISI_WCAG_TARGETS`, `EMISI_BREAKPOINTS`, `EMISI_TOUCH_TARGET_MIN`
- PrimeNG preset: `EmisiPrimePreset`
- Standalone primitives:
  - `emisi-page-shell`
  - `emisi-section-header`
  - `emisi-surface-card`
  - `emisi-keyboard-hints`
  - `emisi-skip-link`
- Branded stylesheet assets:
  - `emisi-ui/styles/emisi-theme.scss`
  - `emisi-ui/styles/_tokens.scss`

## Build

```bash
ng build emisi-ui
```

## Usage

1. Configure PrimeNG theme preset:

```ts
import { providePrimeNG } from 'primeng/config';
import { EmisiPrimePreset } from 'emisi-ui';

providePrimeNG({
  theme: {
    preset: EmisiPrimePreset
  }
});
```

2. Import global branding stylesheet in app styles:

```scss
@use 'emisi-ui/styles/emisi-theme';
```

3. Enable optional AAA mode per page/app (when needed):

```html
<body class="emisi-theme emisi-aaa">
  ...
</body>
```

4. Use primitives:

```html
<emisi-skip-link targetId="main-content" />

<emisi-page-shell title="Administration" subtitle="Tenant and identity control">
  <emisi-keyboard-hints
    [hints]="[
      { keys: ['G', 'H'], description: 'Go to Home' },
      { keys: ['Ctrl', 'K'], description: 'Command Search' }
    ]" />

  <emisi-section-header title="Overview" description="Platform status" />

  <emisi-surface-card variant="raised">
    Content
  </emisi-surface-card>
</emisi-page-shell>
```

## Accessibility Coverage

- WCAG 2.2 A/AA-ready baseline through focus, target size, contrast-oriented tokens, reduced motion, and forced-colors support.
- Optional AAA mode via `.emisi-aaa` / `[data-contrast='aaa']`.
- Device-oriented responsive utilities for mobile, tablet (iPad), desktop web, and foldable media queries.
