# Frontend Advanced CSS Governance

## Purpose

This document defines advanced CSS implementation rules for EMSIST frontend screens so styling is resilient, accessible, and localization-ready across devices and interaction modes.

Scope:
- `frontend/src/styles.scss`
- `frontend/src/app/core/theme/advanced-css-governance.scss`
- Shell and administration layout/component SCSS files

## Mandatory Standards

| Area | Standard | Why it is mandatory |
|------|----------|---------------------|
| Feature detection | Use `@supports` for optional effects (`backdrop-filter`, etc.) and keep a functional fallback path | Prevent broken UI on less capable browsers |
| Input modality | Apply hover-only styling inside `@media (hover: hover) and (pointer: fine)` | Avoid false hover behavior on touch devices |
| Accessibility utility | Keep `.sr-only` utility available globally for assistive-only text | Preserve screen-reader context without visual clutter |
| Orientation behavior | Use orientation-aware tokens for key spacing/layout values | Improve readability and touch ergonomics in portrait/landscape |
| Logical properties | Prefer `inset-inline-*`, `padding-inline`, `border-inline-*` over left/right variants where feasible | Native RTL/LTR support with less override code |
| Print behavior | Use `.u-no-print` / `.u-print-only` for environment-specific visibility | Keep print output usable and uncluttered |

## Implemented Baseline (2026-03-04)

The following are now implemented:

- Shared governance layer:
  - `frontend/src/app/core/theme/advanced-css-governance.scss`
- Global import:
  - `frontend/src/styles.scss`
- Applied in production SCSS:
  - `frontend/src/app/layout/shell-layout/shell-layout.component.scss`
  - `frontend/src/app/features/administration/administration.page.scss`

## Enforcement and QA

| Gate | Command / Evidence | Expected result |
|------|---------------------|-----------------|
| Admin style token drift | `frontend/package.json` script `check:admin-style-tokens` | No new hardcoded color/style debt in admin SCSS |
| Browser + visual + SEO quality | `npm run e2e:quality` | Cross-browser and visual/SEO baseline passes |
| Build safety | `npm run build` | Frontend compiles after CSS changes |

## DoD for New UI Styling

- No unconditional hover-only behavior for touch-sensitive controls.
- No reliance on unsupported effects without `@supports` fallback.
- New spacing/alignment should use logical properties unless physically directional behavior is required.
- Accessibility context text uses `.sr-only` when not visually rendered.
- Administrative styling changes pass `check:admin-style-tokens`.

