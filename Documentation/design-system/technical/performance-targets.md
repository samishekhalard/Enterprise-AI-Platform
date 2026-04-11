# Performance Targets

**Status:** [DOCUMENTED]
**Version:** 1.0.0

## Product Targets

These are the default UI performance targets for route-level experiences in
EMSIST.

| Metric | Target |
|---|---|
| Lighthouse Performance | `>= 90` |
| Largest Contentful Paint (LCP) | `<= 2.5s` |
| First Contentful Paint (FCP) | `<= 1.8s` |
| Cumulative Layout Shift (CLS) | `<= 0.1` |
| Total Blocking Time (TBT) | `<= 200ms` |

## Design-System Implications

- Token, layout, and component choices must not create large layout shifts.
- Initial loads prefer skeletons over spinner-only blank states.
- Above-the-fold imagery must be optimized and sized explicitly.
- Heavy overlays, charts, and large lists should load lazily or by route/section demand.

## What To Measure

Measure at minimum:

- login route
- administration shell
- the heaviest active management surface

## Optimization Rules

- Lazy-load route modules and feature-heavy overlays.
- Avoid duplicated custom primitives that ship extra styling and state logic.
- Prefer tokenized surfaces and shared components instead of feature-scoped CSS forks.
- Keep table and dialog rendering incremental where possible.

## Evidence Required

- dated Lighthouse output or equivalent CI artifact
- route or screen reference
- environment used for the measurement
- note of any exception that is still open and why
