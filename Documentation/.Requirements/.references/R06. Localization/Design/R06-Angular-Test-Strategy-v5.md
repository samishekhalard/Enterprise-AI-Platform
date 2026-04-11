# R06 Angular Test Strategy v5

**Version:** 1.0.0  
**Date:** March 20, 2026  
**Status:** [IMPLEMENTATION CONTRACT]  
**Owner:** Frontend QA / Frontend Architecture
**Scope:** Feature-only supplement. Global UI governance lives in [`Documentation/design-system/`](../../../design-system/).

---

## 1. Purpose

This document defines the Angular unit-test contract for the v5 localization implementation.
It does not redefine repo-wide frontend test policy; it defines the additional Angular coverage required for R06.

It replaces earlier localization test assumptions that referenced files and modules not present in the repo.
The strategy here is anchored to the current frontend stack:

- Angular 21 test builder via [`frontend/angular.json`](../../../../frontend/angular.json)
- `ng test --watch=false` via [`frontend/package.json`](../../../../frontend/package.json)
- Angular TestBed-based specs already present under `frontend/src/app/**/*.spec.ts`
- `vi.fn()`-style spies used inside the current repo

This strategy covers unit and component tests only. Playwright remains covered separately by CI quality gates.

---

## 2. Ground Rules

### Test Runtime

1. Run tests through `npm run test`
2. Use Angular TestBed for services, pipes, and standalone components
3. Use `vi.fn()` for spies where appropriate
4. Do not rely on `vi.mock()` as a primary mechanism
5. Use `HttpTestingController` for HTTP-backed services

### PrimeNG / JSDOM Compatibility

Any spec that uses PrimeNG tabs, dialogs, selects, or overlays must include a `ResizeObserver` test shim when JSDOM requires it.

### Test Design Rules

1. Test behavior, not implementation details
2. Assert signals, rendered text, ARIA state, and API interactions
3. Avoid brittle full-DOM snapshot tests
4. Prefer small deterministic mock payloads

---

## 3. Required Spec Files

The following spec files are required for v5 completion.

| File | Scope | Required |
|---|---|---|
| `frontend/src/app/core/i18n/translation.service.spec.ts` | generic runtime bundle loading and lookup | yes |
| `frontend/src/app/core/i18n/translate.pipe.spec.ts` | runtime pipe rendering | yes |
| `frontend/src/app/core/i18n/locale-state.service.spec.ts` | locale state, persistence, `lang`/`dir` updates | yes |
| `frontend/src/app/layout/language-switcher/language-switcher.component.spec.ts` | shared switcher behavior | yes |
| `frontend/src/app/features/administration/services/admin-locale.service.spec.ts` | admin API orchestration | yes |
| `frontend/src/app/features/administration/sections/master-locale/master-locale-section.component.spec.ts` | Master Locale UI | yes |

### Existing Specs That Must Continue Passing

- [`auth-ui-text.service.spec.ts`](../../../../frontend/src/app/core/i18n/auth-ui-text.service.spec.ts)
- [`locale-header.interceptor.spec.ts`](../../../../frontend/src/app/core/interceptors/locale-header.interceptor.spec.ts)
- [`design-system.spec.ts`](../../../../frontend/src/app/core/theme/design-system.spec.ts)

---

## 4. Scenario Matrix

### 4.1 `translation.service.spec.ts`

Required scenarios:

1. loads active locale bundle successfully
2. caches or reuses bundle for repeated locale selection
3. falls back to embedded English bundle when API request fails
4. returns key or default fallback when translation is missing
5. updates active locale signal
6. exposes active language list from runtime bootstrap
7. handles RTL locale metadata correctly
8. preserves existing auth fallback coexistence during migration

### 4.2 `translate.pipe.spec.ts`

Required scenarios:

1. resolves translated value for a known key
2. updates rendered value when active locale changes
3. falls back safely for missing keys
4. handles empty or null input without throwing

### 4.3 `locale-state.service.spec.ts`

Required scenarios:

1. initializes locale from persisted preference when available
2. falls back to browser locale when no preference exists
3. updates `document.documentElement.lang`
4. updates `document.documentElement.dir`
5. persists locale after user selection
6. rejects unsupported locale selections safely

If backend persistence ownership is still unresolved, this service must be tested against the chosen adapter boundary and not against a guessed endpoint.

### 4.4 `language-switcher.component.spec.ts`

Required scenarios:

1. renders only active languages
2. shows the current locale
3. opens and closes correctly
4. closes on Escape
5. closes on outside click
6. supports keyboard navigation
7. emits locale selection or calls the runtime service
8. reflects RTL option metadata in the menu
9. sets accessible ARIA state correctly

### 4.5 `admin-locale.service.spec.ts`

Required scenarios:

1. loads languages list
2. loads dictionary page for selected language
3. applies search and module filter parameters
4. updates translation successfully
5. restores translation successfully
6. surfaces API errors in a predictable contract
7. normalizes page state for empty results

This spec must test service methods, not hardcode unresolved endpoint paths from conflicting design docs.

### 4.6 `master-locale-section.component.spec.ts`

Required scenarios:

1. loads the default tab on init
2. switches between `Languages` and `Dictionary`
3. filters languages from search input
4. opens dictionary context from a language row action
5. shows empty state when search returns no rows
6. shows inline error state on load failure
7. filters dictionary rows by search
8. filters dictionary rows by module
9. opens edit dialog with row data
10. validates translation input
11. saves translation and refreshes visible state
12. opens restore dialog only for modified entries
13. confirms restore and refreshes visible state
14. applies RTL indicators for RTL target languages
15. preserves keyboard accessibility for tabs and dialogs

---

## 5. Test Setup Patterns

### Service Specs

Use:

```ts
provideHttpClient();
provideHttpClientTesting();
```

Assert outbound requests with `HttpTestingController`.

### Component Specs

Use:

```ts
provideRouter([]);
provideAnimations();
providePrimeNG({ theme: { preset: DefaultPrimePreset } });
```

Stub service boundaries with `useValue` providers and `vi.fn()`.

### PrimeNG Compatibility Shim

For tabs/dialog/select specs, include the same `ResizeObserver` fallback pattern already used in current administration component specs.

---

## 6. Test Data Contract

The frontend test suite must use small canonical fixtures.

### Languages Fixture

At minimum:

1. `en` active and locked
2. `ar` active and RTL
3. `fr` inactive and LTR

### Dictionary Fixture

At minimum include:

1. one translated key
2. one empty translation
3. one modified translation
4. one RTL translation value
5. one shell/admin key that proves non-auth runtime usage

---

## 7. What Must Not Be Tested

1. Raw CSS token definitions already covered by `design-system.spec.ts`
2. The nonexistent standalone `localization-service`
3. End-to-end routing behavior that belongs in Playwright
4. Unfrozen backend endpoint ownership choices

---

## 8. Definition of Done

Angular localization unit testing is complete only when:

1. All required spec files exist
2. All existing related specs still pass
3. `npm run test` passes locally and in CI
4. Runtime, switcher, and Master Locale section behaviors are each covered by focused tests
5. Arabic / RTL behavior is covered by at least one service-level test and one component-level test
6. No localization behavior is covered solely by manual testing
