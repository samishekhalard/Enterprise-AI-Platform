# R06 CI Quality Gates v5

**Version:** 1.0.0  
**Date:** March 20, 2026  
**Status:** [IMPLEMENTATION CONTRACT]  
**Owner:** Frontend Architecture / DevEx
**Scope:** Feature-only supplement. Global UI governance lives in [`Documentation/design-system/`](../../../design-system/).

---

## 1. Purpose

This document defines the CI and merge-gate contract for the frontend portion of R06 Localization.
It does not redefine repo-wide frontend CI policy; it defines the additional localization expectations that must be enforced within the global gate path.

It is based on the workflows and scripts that already exist in the repo:

- [`frontend/package.json`](../../../../frontend/package.json)
- [`.github/workflows/frontend-strict-quality.yml`](../../../../.github/workflows/frontend-strict-quality.yml)
- [`.github/workflows/ci.yml`](../../../../.github/workflows/ci.yml)
- [`frontend/playwright.quality.config.ts`](../../../../frontend/playwright.quality.config.ts)

The goal is to ensure localization UI ships with the same enforcement as other frontend work, while closing the current gap between available scripts and what CI actually runs.

---

## 2. Existing Baseline

### Current PR / Mainline Gates Already Present

`frontend-strict-quality.yml` currently runs:

1. `npm ci`
2. `npm run lint:design-system`
3. `../scripts/check-frontend-layout-contract.sh frontend`
4. `npm run format:check`
5. `npm run lint`
6. `npm run typecheck`
7. `npm run test`
8. `npm run e2e:quality`
9. `npm run build`

`ci.yml` currently runs:

1. frontend lint
2. frontend design-system lint
3. frontend unit tests
4. frontend production build
5. backend `mvn verify`
6. docker build verification

---

## 3. Required Localization Gate Additions

Localization delivery is not 0-drift unless CI also runs the repo's existing validation scripts that are currently not enforced together.

### Required Additions to `frontend-strict-quality.yml`

Add these steps before unit tests:

```bash
npm run check:design-tokens
npm run check:spacing-scale
npm run check:admin-style-tokens
npm run test:design-system
```

### Required Additions to `ci.yml`

At minimum, the frontend job must also run:

```bash
npm run format:check
npm run typecheck
npm run test:design-system
```

If CI duration becomes a concern, `frontend-strict-quality` remains the stronger gate, but localization PRs must still pass both workflows.

---

## 4. Mandatory Command Sequence

For any PR that changes localization frontend code, the expected command chain from `frontend/` is:

```bash
npm ci
npm run format:check
npm run lint
npm run typecheck
npm run lint:design-system
npm run check:design-tokens
npm run check:spacing-scale
npm run check:admin-style-tokens
npm run test:design-system
npm run test
npm run e2e:quality
npm run build
```

### Notes

1. `build` is acceptable for feature validation; `build:prod` must still pass in the general CI job
2. `check:spacing-scale` is warning-mode by implementation, but localization PR review must treat new warnings as debt to remove before merge
3. `check:admin-style-tokens` is especially important because Master Locale lives inside administration styling scope

---

## 5. Playwright Quality Gate Requirements

The existing Playwright quality config already provides:

1. browser matrix: Chromium, Firefox, WebKit, mobile Chrome, mobile Safari
2. visual regression screenshot support
3. reduced-motion test mode
4. local dev-server bootstrapping

Localization must extend this baseline with route coverage for:

1. `Administration -> Master Locale -> Languages`
2. `Administration -> Master Locale -> Dictionary`
3. edit translation dialog
4. restore dialog
5. Arabic / RTL state
6. login page with visible language switcher

### Preferred Implementation Pattern

1. Extend `frontend/e2e/quality-gates.spec.ts` or add a dedicated localization quality spec under `frontend/e2e/`
2. Mock localization APIs via `page.route(...)` until backend endpoints are stable
3. Capture deterministic screenshots only after stable mock data is seeded

---

## 6. Merge Criteria

A localization frontend PR is merge-ready only when:

1. `frontend-strict-quality` passes
2. `CI / Frontend Build & Test` passes
3. no new design-token violations are introduced
4. no new admin-style-token findings require allowlisting
5. required Angular unit tests are present and passing
6. required Playwright quality scenarios pass across the configured matrix

Recommended branch protection outside the repo:

1. require `Frontend Strict Quality`
2. require `CI / Frontend Build & Test`

---

## 7. Failure Policy

The PR must be blocked if any of the following fail:

1. formatting
2. lint
3. typecheck
4. design-system lint
5. design-system contract tests
6. Angular unit tests
7. Playwright quality tests
8. frontend build

The PR must also be blocked if:

1. localization UI introduces new screenshot diffs without explicit approval
2. RTL screenshots fail
3. Master Locale UI passes manually but lacks automated tests

---

## 8. Artifact Expectations

CI should retain the following on failure when practical:

1. Angular unit-test output
2. Playwright traces
3. Playwright screenshots
4. `admin-style-token-audit.md`
5. `admin-style-token-audit.json`

This is especially important for localization because RTL and responsive regressions are easier to debug with artifacts than with logs alone.

---

## 9. Exit Criteria

CI quality gates for R06 frontend are complete only when:

1. both existing workflows include the required localization checks
2. localization-specific unit tests are part of `npm run test`
3. localization-specific Playwright scenarios are part of `npm run e2e:quality`
4. no step relies on manual visual approval as the only verification
