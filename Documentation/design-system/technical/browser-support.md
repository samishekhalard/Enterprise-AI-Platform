# Browser Support

**Status:** [DOCUMENTED]
**Version:** 1.0.0

## Supported Browsers

EMSIST targets modern evergreen desktop and mobile browsers with support for
logical properties, CSS custom properties, `color-mix()`, and the PrimeNG 21
runtime baseline.

| Browser Family | Support Level |
|---|---|
| Chrome | Current and previous major stable release |
| Edge | Current and previous major stable release |
| Safari | Current and previous major stable release on macOS and iOS |
| Firefox | Current stable release |

## Not Supported

- Internet Explorer
- Legacy EdgeHTML
- Browsers that do not support CSS logical properties or CSS custom properties

## Required Capabilities

- CSS custom properties
- CSS logical properties
- `color-mix()`
- ES modules
- `ResizeObserver`
- modern flex and grid layout support

## Compatibility Rules

- Prefer progressive enhancement instead of browser-specific forks.
- Avoid introducing new dependencies that require separate polyfill pipelines unless the repo already provides them.
- When using new CSS or browser APIs, confirm graceful degradation or documented fallback behavior.

## Verification Matrix

Before closing a new UI surface, verify:

- primary route on desktop Chrome or Edge
- primary route on Safari
- responsive route on a mobile viewport
- keyboard and focus behavior in at least one Chromium browser and Safari

## Do / Don't

### Do

- Use semantic HTML and PrimeNG primitives that already handle evergreen browser behavior.
- Keep layout built on grid, flex, and logical properties.
- Document any required fallback when an API is optional.

### Don't

- Do not add browser-specific stylesheets.
- Do not rely on unsupported legacy prefixes as a governance strategy.
- Do not ship critical UI behavior that only works in one engine.
