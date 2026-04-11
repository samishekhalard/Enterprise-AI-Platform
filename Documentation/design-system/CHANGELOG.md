# EMSIST Design System Changelog

## [1.1.0] -- 2026-03-22

### Removed -- Token Retirement
- **Gold tokens retired:** `--tp-primary-light` and `--tp-accent-gold` removed from `:root` declarations. 3 SCSS usages remapped (`about.page.scss` → `--tp-primary`, `default-preset.scss` → `--tp-warning`, `license-manager` → `--tp-warning`). Runtime injection updated (`tenant-theme.service.ts`: `secondaryColor` → `--tp-warning`). 6 TypeScript hardcoded `#b9a779` values replaced with `#988561` or `#8FB8AE`.
- **White tokens retired:** `--tp-white` and `--tp-on-primary` removed from `:root` declarations. All 23 `var(--tp-white)` usages replaced with `var(--tp-surface-light)` (#FAF8F5). All `rgba(255,255,255,...)` patterns replaced with `color-mix(in srgb, var(--tp-surface-light) N%, transparent)`. SVG data URI `%23ffffff` replaced with `%23FAF8F5`. PrimeNG `contrastColor` updated from `#ffffff` to `#FAF8F5`.
- Guard test retained in `design-system.spec.ts` to prevent `var(--tp-white)` background re-introduction

### Changed -- Grey Neutral Alignment
- PrimeNG primary scale `300` updated from `#b9a779` (gold) to `#8FB8AE` (teal tint) in `default-preset.ts`
- Branding Studio "Golden Wheat" renamed to "Warm Wheat" with `#988561` replacing `#b9a779`
- Default branding `secondaryColor` changed from `#b9a779` to `#988561`
- Password-reset input given explicit `background: var(--tp-surface-raised)` to prevent browser-default white

### Fixed -- Documentation Reconciliation
- 8 component docs updated: `var(--tp-white)` backgrounds → `var(--tp-surface-raised)`
- Contract color table: removed `--tp-white`, `--tp-on-primary`, `--tp-primary-light` rows
- Color foundation: removed gold/white from Core Palette, updated contrast guidance
- Acceptance register transformed from inventory format with 25-item verdicts
- Historical specs under `specs/` retained as-is (dated audit trail)

## [1.0.0] -- 2026-03-12

### Added -- Sprint 1: Foundation & Governance
- Design System Contract (`DESIGN-SYSTEM-CONTRACT.md`) -- single entry point for all agents
- UX Agent Principles (`UX-PRINCIPLES.md`) v1.0.0
- Extended color tokens: `--tp-text-dark`, `--tp-white`, `--tp-danger-bg`, `--tp-danger-border`, `--tp-primary-bg`, `--tp-primary-bg-hover`, `--tp-error`, `--tp-error-bg`, `--tp-error-border`, `--tp-error-text`
- Spacing scale tokens: `--tp-space-0` through `--tp-space-16` (4px base, 11 levels)
- Updated DEV-PRINCIPLES.md to v1.3 -- PrimeNG rules, Frontend Do/Don't, performance targets
- Updated QA-PRINCIPLES.md to v2.1 -- Lighthouse gates, RTL testing, design token compliance
- Updated GOVERNANCE-FRAMEWORK.md to v2.2 -- UX agent registered
- Updated FRONTEND-ADVANCED-CSS-GOVERNANCE.md -- token mapping, code examples, PrimeNG equivalents, RTL guide

### Added -- Sprint 2: Blocks & Patterns
- 8 Block templates: List Page, Detail Page, Form Page, Dashboard, Settings Page, Filter Bar, Empty State, Header
- 7 Pattern specs: Search, Pagination, Date/Time, Form Validation, Loading States, Error Handling, Table Actions

### Fixed -- Sprint 3: Codebase Remediation
- Replaced 37+ hardcoded hex colors with `var(--tp-*)` tokens across user-embedded, license-embedded, provider-embedded SCSS
- Replaced 82-line custom pagination with `p-paginator`
- Standardized date formatting to Angular `DatePipe` (removed `toLocaleString()`)
- Standardized empty states with icon + message pattern
- Added search debounce (300ms, min 3 chars) with RxJS Subject

### Added -- Sprint 4: Component Catalog
- 3 Foundation docs: Color, Spacing, Typography
- 10 Component docs: Button, Card, DataTable, Input, Dialog, Toast, Select, Tabs, Menu, Paginator

### Added -- Sprint 5: Automation
- `scripts/check-design-tokens.sh` -- lint for hardcoded hex colors
- `scripts/check-spacing-scale.sh` -- lint for non-standard spacing values
- `scripts/design-token-allowlist.txt` -- legitimate hex color exceptions
- `COMPLIANCE-CHECKLIST.md` -- self-assessment for design system compliance
- Updated evidence hook to require `design-system-ack.md` for feature work under `frontend/src/app/features/`
- This changelog (`docs/design-system/CHANGELOG.md`)
