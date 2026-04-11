# PrimeNG Migration Implementation Plan

**Document Version:** 1.0.0
**Status:** DRAFT
**Created:** 2026-02-26
**Author:** DEV Agent
**Audience:** Frontend developers, ARCH, SA

---

## Table of Contents

1. [Current Codebase Inventory](#1-current-codebase-inventory)
2. [Package Changes](#2-package-changes)
3. [Configuration Changes](#3-configuration-changes)
4. [Step-by-Step Migration Tasks](#4-step-by-step-migration-tasks)
5. [ThinkPLUS Custom Preset](#5-thinkplus-custom-preset)
6. [PWA Setup Steps](#6-pwa-setup-steps)
7. [Responsive and Foldable Setup](#7-responsive-and-foldable-setup)
8. [Risk Register](#8-risk-register)
9. [DEV-PRINCIPLES.md Update Proposal](#9-dev-principlesmd-update-proposal)

---

## 1. Current Codebase Inventory

### 1.1 ng-bootstrap Import Audit

**Result: ZERO files import from `@ng-bootstrap/ng-bootstrap`.**

Despite `@ng-bootstrap/ng-bootstrap` being listed in `package.json` as a dependency (v20.0.0), no source file in `frontend/src/` actually imports any ng-bootstrap directive, component, or module. The package is installed but entirely unused. All modals, dropdowns, tooltips, and interactive components are custom-built using native Angular patterns (signals, `@if`/`@for`, CSS transitions).

Files verified (exhaustive search of `frontend/src/app/`):
- Zero imports of `NgbModal`, `NgbDropdown`, `NgbTooltip`, `NgbCollapse`, `NgbAccordion`, `NgbDatepicker`, `NgbNav`, `NgbPagination`, `NgbTypeahead`, `NgbAlert`, `NgbPopover`, `NgbCarousel`, `NgbOffcanvas`, `NgbProgressbar`, or `NgbToast`.

### 1.2 Bootstrap CSS Class Usage

**866 total occurrences of Bootstrap-compatible CSS classes across 24 files.**

All of these classes are either (a) custom-defined in `styles.scss` and component SCSS files that happen to use Bootstrap naming conventions, or (b) rely on Bootstrap's global CSS loaded via `angular.json`. The global `node_modules/bootstrap/dist/css/bootstrap.min.css` is loaded in `angular.json` and provides the base grid system, utility classes, and component defaults.

#### Files Using Bootstrap CSS Classes (by occurrence count)

| File | Occurrences | Key Bootstrap Classes Used |
|------|-------------|---------------------------|
| `pages/administration/administration.page.ts` | 276 | `btn`, `btn-primary`, `btn-sm`, `btn-outline-secondary`, `btn-outline-danger`, `btn-close`, `modal-*`, `form-control`, `form-select`, `form-label`, `form-group`, `card`, `card-body`, `card-header`, `badge`, `table`, `d-flex`, `gap-*`, `mb-*`, `mt-*`, `text-muted`, `text-primary`, `text-success`, `text-danger`, `fw-*`, `bg-*`, `col-*`, `row`, `alert`, `rounded` |
| `components/persona-form/persona-form.component.html` | 138 | `card`, `card-header`, `card-body`, `form-control`, `form-select`, `form-label`, `col-*`, `row`, `rounded-pill`, `text-muted`, `text-uppercase`, `text-primary`, `mb-*`, `fw-*`, `bg-opacity-*`, `border-primary`, `small` |
| `components/journey-form/journey-form.component.html` | 108 | `card`, `card-header`, `card-body`, `form-control`, `form-select`, `form-label`, `col-*`, `row`, `rounded-pill`, `btn`, `btn-outline-*`, `d-flex`, `gap-*`, `badge`, `alert`, `text-muted`, `fw-*`, `mb-*`, `bg-secondary` |
| `components/provider-form/provider-form.component.ts` | 91 | `form-group`, `form-label`, `form-control`, `btn`, `btn-primary`, `btn-outline` |
| `components/product-list/product-list.component.ts` | 79 | `btn`, `btn-primary`, `btn-sm`, `table` (custom classes with Bootstrap naming) |
| `components/preview/preview.component.html` | 53 | `card`, `card-body`, `badge`, `bg-primary`, `bg-secondary`, `bg-success`, `bg-danger`, `bg-warning`, `d-flex`, `flex-wrap`, `gap-*`, `text-muted`, `text-primary`, `text-success`, `text-danger`, `fw-*`, `mb-*`, `p-*`, `rounded`, `fst-italic`, `fs-*`, `small`, `btn-group` |
| `components/product-modal/product-modal.component.ts` | 21 | `modal-*`, `form-group`, `form-label`, `form-control`, `btn`, `btn-primary`, `btn-link`, `btn-close` |
| `components/bpmn-toolbar/bpmn-toolbar.component.ts` | 19 | `btn`, `d-flex`, `gap-*` |
| `components/provider-list/provider-list.component.ts` | 17 | `btn`, `btn-primary`, `btn-danger`, `btn-outline`, `modal-*` |
| `components/bpmn-properties-panel/bpmn-properties-panel.component.ts` | 16 | `form-control`, `form-label`, `form-select`, `btn`, `badge` |
| `components/bpmn-canvas/bpmn-canvas.component.ts` | 13 | `btn`, `form-control` |
| `components/export/export.component.ts` | 9 | `btn`, `card`, `badge` |
| `pages/personas/personas.page.ts` | 4 | `badge`, `fw-bold`, `text-muted` |
| `pages/profile/profile.page.ts` | 3 | Custom classes (minimal Bootstrap) |
| `features/admin/identity-providers/pages/provider-management.page.ts` | 3 | `btn`, `badge` |
| `features/admin/identity-providers/components/provider-embedded/provider-embedded.component.ts` | 3 | `btn`, `btn-primary`, `btn-sm` |
| `shared/tag-input/tag-input.component.ts` | 3 | `badge`, `form-control`, `btn-close` |
| `pages/login/login.page.ts` | 2 | `form-group` (custom styled) |
| `pages/auth/password-reset/password-reset-confirm.page.ts` | 2 | `form-group` |
| `shared/confidence-badge/confidence-badge.component.ts` | 2 | `btn-group`, `btn` |
| `components/shared/page-layout/page-layout.component.ts` | 1 | `btn` (in docstring) |
| `components/shared/page-layout/page-layout.component.html` | 1 | Layout classes |
| `pages/auth/password-reset/password-reset.page.ts` | 1 | `form-group` |
| `pages/process-modeler/process-modeler.page.ts` | 1 | Minimal |

### 1.3 SCSS Files and Bootstrap Dependencies

| SCSS File | Bootstrap Dependency | Notes |
|-----------|---------------------|-------|
| `src/styles.scss` | **HIGH** - Contains ~989 lines of Bootstrap override styles for `.btn-*`, `.card-*`, `.form-control`, `.form-select`, `.form-label`, `.badge`, `.table`, `.dropdown-*`, `.list-group-item`, `.modal-*`, utility classes (`.d-flex`, `.gap-*`, `.mb-*`, etc.) | This is the main file that bridges Bootstrap CSS to ThinkPLUS design tokens via CSS custom properties. |
| `src/app/app.scss` | **MEDIUM** - Overrides `.btn-primary`, `.btn-outline-primary`, `.btn-outline-secondary`, `.form-control`, `.form-select`, `.form-label`, `.card`, `.card-header`, `.text-*`, `.badge.*`, `.btn-sm` | App-level Bootstrap overrides for the shell layout. |
| `src/styles/_breadcrumb.scss` | **NONE** - All custom classes (`.breadcrumb-nav`, `.breadcrumb-item`, `.breadcrumb-link`, `.breadcrumb-current`) | Does not depend on Bootstrap breadcrumb component. |
| `src/styles/_docker.scss` | **NONE** - All custom classes (`.docker-container`, `.docker-nav-item`, etc.) | Fully custom sidebar component. |
| `src/styles/_layout.scss` | **NONE** - Imports `_breadcrumb`, `_docker`, `_main-container` | Composition file, no direct Bootstrap usage. |
| `src/styles/_main-container.scss` | **NONE** - All custom classes | Fully custom layout system. |
| `src/app/pages/login/login.page.scss` | **NONE** - All custom styled | Login page is completely self-contained with custom CSS. |
| `src/app/pages/administration/administration.styles.scss` | **HIGH** (47,522 tokens) - Uses Bootstrap grid (`.row`, `.col-*`), utilities, component classes extensively | Largest SCSS file in the project. |
| `src/app/pages/process-modeler/process-modeler.page.scss` | **LOW** - Mostly custom BPMN styles | Minimal Bootstrap dependency. |
| `src/app/components/bpmn-canvas/bpmn-canvas.component.scss` | **NONE** | BPMN-specific styles only. |
| `src/app/components/bpmn-toolbar/bpmn-toolbar.component.scss` | **LOW** | Mostly custom styles. |
| `src/app/components/bpmn-palette-docker/bpmn-palette-docker.component.scss` | **NONE** | Custom dock component. |
| `src/app/components/bpmn-properties-panel/bpmn-properties-panel.component.scss` | **LOW** | Mostly custom panel styles. |
| `src/app/components/persona-form/persona-form.component.scss` | **MEDIUM** | Form-specific overrides. |
| `src/app/components/journey-form/journey-form.component.scss` | **MEDIUM** | Form-specific overrides. |
| `src/app/components/preview/preview.component.scss` | **MEDIUM** | Uses Bootstrap card/badge patterns. |
| `src/app/components/shared/breadcrumb/breadcrumb.component.scss` | **NONE** | Imports from `_breadcrumb.scss`. |
| `src/app/components/shared/page-layout/page-layout.component.scss` | **LOW** | Custom layout styles. |
| `src/app/features/admin/identity-providers/components/provider-form/provider-form.component.scss` | **MEDIUM** | Form styling. |
| `src/app/features/admin/identity-providers/components/provider-list/provider-list.component.scss` | **LOW** | List/card styling. |

### 1.4 *ngIf/*ngFor Legacy Syntax (Bonus: Should Migrate to @if/@for)

**60 total occurrences of `*ngIf` and `*ngFor` in 6 files** that violate DEV-PRINCIPLES:

| File | Count | Notes |
|------|-------|-------|
| `components/journey-form/journey-form.component.html` | 23 | Heaviest legacy usage |
| `components/preview/preview.component.html` | 22 | Extensive legacy usage |
| `components/persona-form/persona-form.component.html` | 11 | Mixed with `@if`/`@for` |
| `shared/tag-input/tag-input.component.ts` | 2 | Uses `*ngIf` and `*ngFor` |
| `shared/confidence-badge/confidence-badge.component.ts` | 1 | Single `*ngFor` |
| `pages/auth/mfa/mfa-setup.page.ts` | 1 | Single `*ngIf` |

### 1.5 Component Count Summary

| Category | Count | Files |
|----------|-------|-------|
| **Pages (full-page components)** | 14 | login, products, personas, process-modeler, administration, profile, landing, callback, logout, mfa-verify, mfa-setup, password-reset, password-reset-confirm, saml-acs, uaepass-callback, access-denied, session-expired, tenant-not-found |
| **Feature components** | 3 | provider-list, provider-form, provider-embedded |
| **Shared components** | 2 | breadcrumb, page-layout |
| **Business components** | 10 | product-list, product-modal, persona-form, journey-form, preview, export, bpmn-canvas, bpmn-toolbar, bpmn-palette-docker, bpmn-properties-panel |
| **Utility components** | 2 | tag-input, confidence-badge |
| **Side menu** | 1 | side-menu |
| **Total** | ~32 | - |

---

## 2. Package Changes

### 2.1 Packages to Install

```bash
# PrimeNG 21 with its theme engine and icon library
npm install primeng@latest @primeng/themes@latest primeicons@latest

# Angular Animations (required by PrimeNG transitions)
npm install @angular/animations@^21.1.0

# Optional: PrimeFlex for utility classes (replaces Bootstrap utilities)
# NOTE: PrimeFlex may be unnecessary if we define our own utilities or use
# PrimeNG's built-in responsive features. Evaluate during Phase 1.
# npm install primeflex@latest
```

**Rationale:**
- `primeng`: Core component library (DataTable, Dialog, InputText, Dropdown, Button, etc.)
- `@primeng/themes`: Theme engine for PrimeNG 21 (replaces the old `primeng/resources` theme files)
- `primeicons`: Icon library for PrimeNG components
- `@angular/animations`: Required by PrimeNG for dialog/overlay transitions

### 2.2 Packages to Eventually Remove (After Full Migration)

```bash
# Remove ONLY after all Bootstrap classes are replaced
npm uninstall bootstrap @ng-bootstrap/ng-bootstrap @popperjs/core
```

| Package | Current Version | Reason for Removal |
|---------|----------------|-------------------|
| `bootstrap` | ^5.3.8 | CSS framework replaced by PrimeNG + custom SCSS |
| `@ng-bootstrap/ng-bootstrap` | ^20.0.0 | UNUSED - zero imports in codebase; dead dependency |
| `@popperjs/core` | ^2.11.8 | Only needed by Bootstrap dropdowns/tooltips |

### 2.3 Packages to Keep (No Changes)

| Package | Version | Reason |
|---------|---------|--------|
| `apexcharts` | ^5.6.0 | Data visualization (not a Bootstrap/PrimeNG concern) |
| `ng-apexcharts` | ^2.0.4 | Angular wrapper for ApexCharts |
| `bpmn-js` | ^18.12.0 | BPMN process modeler |
| `bpmn-js-properties-panel` | ^5.51.0 | BPMN properties panel |
| `@bpmn-io/properties-panel` | ^3.39.0 | Properties panel base |
| `camunda-bpmn-moddle` | ^7.0.1 | Camunda BPMN extensions |
| `diagram-js-grid` | ^2.0.1 | Canvas grid overlay |
| `diagram-js-minimap` | ^5.3.0 | Canvas minimap |

### 2.4 Coexistence Strategy During Migration

During migration, both Bootstrap and PrimeNG will be installed simultaneously. This is the recommended approach:

1. **Phase 1**: Install PrimeNG alongside Bootstrap. Both CSS frameworks loaded in `angular.json`.
2. **Phase 2-5**: Migrate components one-by-one. Each PR removes Bootstrap classes from specific files and replaces with PrimeNG equivalents.
3. **Phase 6**: Remove Bootstrap CSS from `angular.json`, uninstall packages.

**CSS Conflict Mitigation:**
- PrimeNG 21 uses a scoped design token system (`--p-*` CSS custom properties) that does not conflict with Bootstrap's class names.
- Bootstrap's `.btn`, `.card`, etc. will coexist with PrimeNG's `<p-button>`, `<p-card>`, etc. since PrimeNG uses its own component selectors.
- The main risk area is global utility classes (`.d-flex`, `.gap-*`, etc.) which Bootstrap provides but PrimeNG does not. We will define our own lightweight utility classes or use PrimeFlex.

---

## 3. Configuration Changes

### 3.1 angular.json Style Imports

**Current** (`angular.json` lines 80-86):
```json
"styles": [
  "node_modules/bootstrap/dist/css/bootstrap.min.css",
  "node_modules/bpmn-js/dist/assets/diagram-js.css",
  "node_modules/bpmn-js/dist/assets/bpmn-js.css",
  "node_modules/bpmn-js/dist/assets/bpmn-font/css/bpmn-embedded.css",
  "node_modules/diagram-js-minimap/assets/diagram-js-minimap.css",
  "src/styles.scss"
]
```

**During Migration** (Phase 1 - add PrimeNG icons, keep Bootstrap):
```json
"styles": [
  "node_modules/bootstrap/dist/css/bootstrap.min.css",
  "node_modules/primeicons/primeicons.css",
  "node_modules/bpmn-js/dist/assets/diagram-js.css",
  "node_modules/bpmn-js/dist/assets/bpmn-js.css",
  "node_modules/bpmn-js/dist/assets/bpmn-font/css/bpmn-embedded.css",
  "node_modules/diagram-js-minimap/assets/diagram-js-minimap.css",
  "src/styles.scss"
]
```

**After Full Migration** (Phase 6 - remove Bootstrap):
```json
"styles": [
  "node_modules/primeicons/primeicons.css",
  "node_modules/bpmn-js/dist/assets/diagram-js.css",
  "node_modules/bpmn-js/dist/assets/bpmn-js.css",
  "node_modules/bpmn-js/dist/assets/bpmn-font/css/bpmn-embedded.css",
  "node_modules/diagram-js-minimap/assets/diagram-js-minimap.css",
  "src/styles.scss"
]
```

### 3.2 app.config.ts Provider Setup

PrimeNG 21 uses `providePrimeNG()` in the application config. The theme is configured programmatically, not via CSS imports.

**Updated `frontend/src/app/app.config.ts`:**

```typescript
import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
  APP_INITIALIZER
} from '@angular/core';
import { provideRouter, withComponentInputBinding, withViewTransitions } from '@angular/router';
import { provideHttpClient, withInterceptors, withFetch } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { providePrimeNG } from 'primeng/config';
import { ThinkPlusPreset } from './theme/thinkplus-preset';
import { routes } from './app.routes';
import { initializeTenant } from './core/initializers/tenant.initializer';
import { authInterceptor, loggingInterceptor } from './core/interceptors/auth.interceptor';
import { AuthFacade, KeycloakAuthFacade } from './core/auth';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),

    // Auth Facade
    { provide: AuthFacade, useClass: KeycloakAuthFacade },

    // Router
    provideRouter(routes, withComponentInputBinding(), withViewTransitions()),

    // HTTP Client
    provideHttpClient(withFetch(), withInterceptors([loggingInterceptor, authInterceptor])),

    // Animations (required by PrimeNG overlays/dialogs)
    provideAnimationsAsync(),

    // PrimeNG with ThinkPLUS custom preset
    providePrimeNG({
      theme: {
        preset: ThinkPlusPreset,
        options: {
          prefix: 'p',
          darkModeSelector: '.dark-mode',
          cssLayer: {
            name: 'primeng',
            order: 'primeng, thinkplus'
          }
        }
      },
      ripple: true
    }),

    // Tenant initialization
    {
      provide: APP_INITIALIZER,
      useFactory: initializeTenant,
      multi: true
    }
  ]
};
```

### 3.3 Animation Module Setup

PrimeNG 21 requires Angular animations for dialogs, overlays, and transitions. Using `provideAnimationsAsync()` is the recommended approach for standalone applications as it lazy-loads the animations module.

**No additional configuration needed** beyond the `provideAnimationsAsync()` call in `app.config.ts` above.

---

## 4. Step-by-Step Migration Tasks

### Phase A: Infrastructure (Install, Configure, Create Preset)

**Estimated Effort: 2 days**

#### Task A1: Install PrimeNG Packages

**Files to change:** `frontend/package.json`

```bash
cd frontend
npm install primeng@latest @primeng/themes@latest primeicons@latest @angular/animations@^21.1.0
```

**Effort:** 15 minutes

#### Task A2: Create ThinkPLUS Preset File

**Files to create:** `frontend/src/app/theme/thinkplus-preset.ts`

Create the custom PrimeNG preset that maps ThinkPLUS design tokens to PrimeNG's design token system. See [Section 5](#5-thinkplus-custom-preset) for the full preset definition.

**Effort:** 4 hours

#### Task A3: Update app.config.ts

**Files to change:** `frontend/src/app/app.config.ts`

Add `provideAnimationsAsync()` and `providePrimeNG()` with the ThinkPLUS preset as shown in Section 3.2.

**Effort:** 30 minutes

#### Task A4: Update angular.json

**Files to change:** `frontend/angular.json`

Add `primeicons.css` to styles array. Keep Bootstrap for now.

**Effort:** 10 minutes

#### Task A5: Remove Unused @ng-bootstrap/ng-bootstrap

**Files to change:** `frontend/package.json`

Since no file imports from ng-bootstrap, it can be safely removed immediately:

```bash
npm uninstall @ng-bootstrap/ng-bootstrap
```

**Effort:** 5 minutes

#### Task A6: Create Bootstrap Utility Replacements

**Files to create:** `frontend/src/styles/_utilities.scss`

Define standalone utility classes (`.flex`, `.flex-column`, `.gap-*`, `.mb-*`, etc.) that replicate the Bootstrap utilities we actually use. This ensures we can remove Bootstrap CSS without losing utility classes.

**Effort:** 2 hours

#### Task A7: Migrate *ngIf/*ngFor to @if/@for

**Files to change:**
- `components/journey-form/journey-form.component.html` (23 occurrences)
- `components/preview/preview.component.html` (22 occurrences)
- `components/persona-form/persona-form.component.html` (11 occurrences)
- `shared/tag-input/tag-input.component.ts` (2 occurrences)
- `shared/confidence-badge/confidence-badge.component.ts` (1 occurrence)
- `pages/auth/mfa/mfa-setup.page.ts` (1 occurrence)

**What to replace:** `*ngIf="condition"` with `@if (condition) { ... }`, `*ngFor="let item of items"` with `@for (item of items; track item) { ... }`

**Effort:** 3 hours

---

### Phase B: Shared/Global Components (Layout, Navigation, Breadcrumb)

**Estimated Effort: 2 days**

#### Task B1: Migrate styles.scss Bootstrap Overrides to PrimeNG Tokens

**Files to change:** `frontend/src/styles.scss`

**What to replace:**
- `.btn`, `.btn-primary`, `.btn-secondary`, `.btn-outline-*`, `.btn-sm`, `.btn-lg` overrides -> Replace with PrimeNG `<p-button>` component usage. Remove these override blocks.
- `.card`, `.card-header`, `.card-body`, `.card-title` overrides -> Replace with PrimeNG `<p-card>` component. Remove overrides.
- `.form-control`, `.form-select`, `.form-label` overrides -> Replace with PrimeNG `<p-inputtext>`, `<p-select>`, PrimeNG label styling.
- `.badge` overrides -> Replace with PrimeNG `<p-tag>` or `<p-badge>`.
- `.table` overrides -> Replace with PrimeNG `<p-table>`.
- `.dropdown-*` overrides -> Replace with PrimeNG `<p-menu>` or `<p-select>`.
- `.modal-*` overrides -> Replace with PrimeNG `<p-dialog>`.
- `.list-group-item` overrides -> Replace with PrimeNG `<p-listbox>`.
- Keep all custom CSS properties (`:root { --tp-* }`) and SCSS variables as they feed the preset.
- Keep all utility classes (`.w-100`, `.d-flex`, etc.) until they are replaced by our `_utilities.scss`.

**Effort:** 6 hours

#### Task B2: Migrate Breadcrumb Component

**Files to change:**
- `components/shared/breadcrumb/breadcrumb.component.ts`
- `components/shared/breadcrumb/breadcrumb.component.scss`

**Current:** Custom HTML `<nav>` with `<ol class="breadcrumb">` items.
**PrimeNG replacement:** `<p-breadcrumb [model]="items" [home]="homeItem" />`

```typescript
// Before
template: `
  <nav class="breadcrumb-nav" aria-label="Breadcrumb">
    <ol class="breadcrumb">
      @for (item of items; track item.label; let last = $last) { ... }
    </ol>
  </nav>
`

// After
import { Breadcrumb } from 'primeng/breadcrumb';
template: `<p-breadcrumb [model]="menuItems" [home]="home" />`
```

**Effort:** 1 hour

#### Task B3: Migrate Page Layout Component

**Files to change:**
- `components/shared/page-layout/page-layout.component.ts`
- `components/shared/page-layout/page-layout.component.html`
- `components/shared/page-layout/page-layout.component.scss`

**Current:** Uses `.btn` class reference in docstring. Layout is mostly custom.
**PrimeNG replacement:** Update docstring examples to use `<p-button>`. Layout structure stays custom (PrimeNG does not dictate layout patterns).

**Effort:** 30 minutes

#### Task B4: Migrate Tag Input Component

**Files to change:** `shared/tag-input/tag-input.component.ts`

**Current:** Uses `*ngIf`, `*ngFor`, `.badge`, `.form-control`, `.btn-close`, `--bs-primary` CSS var.
**PrimeNG replacement:**
- Replace `*ngIf`/`*ngFor` with `@if`/`@for`
- Replace `<input class="form-control">` with `<p-inputtext>` or `<p-chips>` (PrimeNG Chips component is a direct replacement for tag input)
- Replace `.badge` with `<p-tag>`
- Remove `--bs-primary` reference

```typescript
// PrimeNG Chips is a direct replacement
import { Chips } from 'primeng/chips';
template: `<p-chips [(ngModel)]="values" [placeholder]="placeholder()" />`
```

**Effort:** 1 hour

#### Task B5: Migrate Confidence Badge Component

**Files to change:** `shared/confidence-badge/confidence-badge.component.ts`

**Current:** Uses `*ngFor`, `.btn-group`, `.btn`.
**PrimeNG replacement:**
- Replace `*ngFor` with `@for`
- Replace `.btn-group` + `.btn` buttons with `<p-selectbutton>` (PrimeNG SelectButton is a perfect match for this pattern)

```typescript
import { SelectButton } from 'primeng/selectbutton';
template: `<p-selectbutton [options]="levelOptions" [(ngModel)]="selectedLevel" />`
```

**Effort:** 1 hour

---

### Phase C: Auth Pages (Login, MFA)

**Estimated Effort: 1 day**

#### Task C1: Login Page

**Files to change:** `pages/login/login.page.ts`, `pages/login/login.page.scss`

**Current:** Uses `.form-group` class (2 occurrences). Everything else is custom styled.
**PrimeNG replacement:**
- Replace `<input class="form-control">` with `<p-inputtext>` wrapped in `<p-iconfield>` + `<p-inputicon>` for the icon treatment
- Replace `<div class="form-group">` with PrimeNG's `<div class="p-field">` pattern
- Replace `<button class="submit-btn">` with `<p-button label="Sign In" />`

**Note:** The login page is heavily custom-styled with its own glassmorphism design. PrimeNG components will be used for semantic correctness but most visual styling remains custom.

**Effort:** 2 hours

#### Task C2: MFA Verify Page

**Files to change:** `pages/auth/mfa/mfa-verify.page.ts`

**Current:** All custom styled with inline styles. No Bootstrap classes.
**PrimeNG replacement:**
- Replace `<input>` with `<p-inputotp [length]="6" />` (PrimeNG InputOtp for verification codes)
- Replace `<button>` with `<p-button>`
- Replace checkbox with `<p-checkbox>`

**Effort:** 1 hour

#### Task C3: MFA Setup Page

**Files to change:** `pages/auth/mfa/mfa-setup.page.ts`

**Current:** Uses `*ngIf` (1 occurrence), all custom styled.
**PrimeNG replacement:**
- Migrate `*ngIf` to `@if`
- Replace `<input>` with `<p-inputtext>`
- Replace `<button>` with `<p-button>`

**Effort:** 45 minutes

#### Task C4: Password Reset Pages

**Files to change:**
- `pages/auth/password-reset/password-reset.page.ts`
- `pages/auth/password-reset/password-reset-confirm.page.ts`

**Current:** Uses `.form-group` (3 total occurrences). Custom styled.
**PrimeNG replacement:**
- Replace `<input>` with `<p-inputtext>` and `<p-password>` (for password fields with strength meter)
- Replace `<button>` with `<p-button>`

**Effort:** 1 hour

---

### Phase D: Admin Pages (Administration, Users, Licenses, Settings)

**Estimated Effort: 5 days** (Largest effort - administration page has 276 Bootstrap class occurrences)

#### Task D1: Administration Page - Buttons

**Files to change:** `pages/administration/administration.page.ts`

**What to replace (partial list):**
- `<button class="btn btn-primary btn-sm">` -> `<p-button label="..." size="small" />`
- `<button class="btn btn-outline-secondary btn-sm">` -> `<p-button label="..." severity="secondary" [outlined]="true" size="small" />`
- `<button class="btn btn-outline-danger btn-sm">` -> `<p-button label="..." severity="danger" [outlined]="true" size="small" />`
- `<button class="btn-close">` -> `<p-button icon="pi pi-times" [rounded]="true" [text]="true" />`

**Effort:** 3 hours

#### Task D2: Administration Page - Modals/Dialogs

**Files to change:** `pages/administration/administration.page.ts`

**What to replace:**
- `<div class="modal-overlay">` + `<div class="modal-header/body/footer">` -> `<p-dialog [visible]="..." [modal]="true" header="...">`
- All custom modal backdrop handling replaced by PrimeNG Dialog's built-in modal behavior

**Effort:** 4 hours

#### Task D3: Administration Page - Forms

**Files to change:** `pages/administration/administration.page.ts`

**What to replace:**
- `<input class="form-control">` -> `<input pInputText />`
- `<select class="form-select">` -> `<p-select [options]="..." />`
- `<textarea class="form-control">` -> `<textarea pInputTextarea></textarea>`
- `<label class="form-label">` -> `<label>` (PrimeNG uses `<div class="p-field">` wrapper pattern)

**Effort:** 3 hours

#### Task D4: Administration Page - Cards

**Files to change:** `pages/administration/administration.page.ts`

**What to replace:**
- `<div class="card"><div class="card-header">...<div class="card-body">` -> `<p-card header="...">`
- Card variant styling via PrimeNG's style class system

**Effort:** 2 hours

#### Task D5: Administration Page - Tables

**Files to change:** `pages/administration/administration.page.ts`

**What to replace:**
- `<table class="table">` -> `<p-table [value]="data" [paginator]="true" [rows]="10">`
- Column templates, sorting, filtering all built-in with PrimeNG DataTable

**Effort:** 3 hours

#### Task D6: Administration Page - Badges and Status Indicators

**Files to change:** `pages/administration/administration.page.ts`

**What to replace:**
- `<span class="badge bg-primary">` -> `<p-tag value="..." severity="info" />`
- `<span class="badge bg-success">` -> `<p-tag value="..." severity="success" />`
- `<span class="badge bg-danger">` -> `<p-tag value="..." severity="danger" />`
- `<span class="badge bg-warning">` -> `<p-tag value="..." severity="warn" />`
- `<span class="badge bg-secondary">` -> `<p-tag value="..." severity="secondary" />`

**Effort:** 1 hour

#### Task D7: Administration Page - Utilities and Layout

**Files to change:** `pages/administration/administration.page.ts`, `pages/administration/administration.styles.scss`

**What to replace:**
- `.d-flex`, `.flex-column`, `.gap-*`, `.mb-*`, `.mt-*`, `.p-*`, `.text-muted`, `.text-primary`, `.fw-*`, `.col-*`, `.row` -> Custom utility classes from `_utilities.scss` or inline Flexbox/Grid CSS
- `.alert` -> `<p-message>` or `<p-inlinemessage>`
- `.rounded` -> Custom border-radius

**Effort:** 4 hours

#### Task D8: Administration Page - SCSS Overhaul

**Files to change:** `pages/administration/administration.styles.scss`

Remove all Bootstrap dependency from the SCSS file. Replace Bootstrap variables/mixins with ThinkPLUS design tokens and PrimeNG theme variables.

**Effort:** 4 hours

#### Task D9: Identity Provider Components

**Files to change:**
- `features/admin/identity-providers/components/provider-form/provider-form.component.ts` (91 occurrences)
- `features/admin/identity-providers/components/provider-list/provider-list.component.ts` (17 occurrences)
- `features/admin/identity-providers/components/provider-embedded/provider-embedded.component.ts` (3 occurrences)
- `features/admin/identity-providers/pages/provider-management.page.ts` (3 occurrences)

**What to replace:**
- All `form-group`/`form-label`/`form-control` -> PrimeNG form components
- All `btn`/`btn-primary`/`btn-outline`/`btn-danger` -> `<p-button>`
- All `modal-*` -> `<p-dialog>`
- All `badge` -> `<p-tag>`

**Effort:** 4 hours

---

### Phase E: Feature Pages (Products, Personas, BPMN Modeler)

**Estimated Effort: 4 days**

#### Task E1: Product List Component

**Files to change:** `components/product-list/product-list.component.ts`

**What to replace (79 occurrences):**
- Product table -> `<p-table>` with column templates, sorting, filtering
- `<button class="btn btn-primary btn-sm">` -> `<p-button>`
- Search input -> `<p-iconfield><p-inputicon /><input pInputText /></p-iconfield>`
- Empty state -> `<p-table>` has built-in empty message template

**Effort:** 4 hours

#### Task E2: Product Modal Component

**Files to change:** `components/product-modal/product-modal.component.ts`

**What to replace (21 occurrences):**
- `<div class="modal-overlay">` -> `<p-dialog [visible]="..." [modal]="true">`
- `<div class="modal-header/body/footer">` -> PrimeNG Dialog regions (header/content/footer templates)
- Form controls -> PrimeNG equivalents
- File upload -> `<p-fileupload>` or keep custom with PrimeNG button

**Effort:** 2 hours

#### Task E3: Persona Form Component

**Files to change:**
- `components/persona-form/persona-form.component.html` (138 occurrences)
- `components/persona-form/persona-form.component.ts`
- `components/persona-form/persona-form.component.scss`

**What to replace:**
- All `.card`/`.card-header`/`.card-body` -> `<p-card>` or `<p-fieldset>` (fieldset is better for form sections)
- All `.form-control`/`.form-select`/`.form-label` -> PrimeNG form components
- All `.col-*`/`.row`/`.g-*` -> CSS Grid or PrimeNG Grid system
- All `.badge` -> `<p-tag>`
- All `.text-muted`/`.text-primary`/`.text-uppercase`/`.fw-*` -> Custom utility classes
- All `.rounded-pill` -> PrimeNG's built-in rounded inputs via `[style]` or CSS class
- All `*ngIf`/`*ngFor` -> `@if`/`@for`

**Effort:** 6 hours

#### Task E4: Journey Form Component

**Files to change:**
- `components/journey-form/journey-form.component.html` (108 occurrences)
- `components/journey-form/journey-form.component.ts`
- `components/journey-form/journey-form.component.scss`

**What to replace:** Same patterns as E3 (cards, forms, grid, badges, utilities, legacy syntax).
- `.alert` -> `<p-message>` or `<p-inlinemessage>`
- Stage selection buttons -> `<p-selectbutton>` or `<p-togglebutton>`
- Stage cards with drag reorder -> `<p-orderlist>` or custom with `<p-card>`
- All `*ngIf`/`*ngFor` -> `@if`/`@for`

**Effort:** 6 hours

#### Task E5: Preview Component

**Files to change:**
- `components/preview/preview.component.html` (53 occurrences)
- `components/preview/preview.component.ts`
- `components/preview/preview.component.scss`

**What to replace:**
- `.btn-group` tab switcher -> `<p-selectbutton>` or `<p-tabview>`
- All `.card`/`.card-body` -> `<p-card>`
- All `.badge` -> `<p-tag>`
- All Bootstrap utility classes -> Custom utilities
- All `*ngIf`/`*ngFor` -> `@if`/`@for`

**Effort:** 3 hours

#### Task E6: Export Component

**Files to change:** `components/export/export.component.ts`

**What to replace (9 occurrences):**
- `.btn` -> `<p-button>`
- `.card` -> `<p-card>`
- `.badge` -> `<p-tag>`

**Effort:** 1 hour

#### Task E7: BPMN Components

**Files to change:**
- `components/bpmn-toolbar/bpmn-toolbar.component.ts` (19 occurrences)
- `components/bpmn-properties-panel/bpmn-properties-panel.component.ts` (16 occurrences)
- `components/bpmn-canvas/bpmn-canvas.component.ts` (13 occurrences)

**What to replace:**
- Toolbar buttons -> `<p-button>` (icon-only buttons with `[rounded]="true" [text]="true"`)
- Properties panel form fields -> PrimeNG form components
- Form controls -> `pInputText`, `<p-select>`, `<p-inputnumber>`

**Note:** BPMN components have their own heavy custom SCSS (bpmn-js integrations). PrimeNG replaces only the Angular form/button elements, not the bpmn-js canvas styling.

**Effort:** 4 hours

#### Task E8: Personas Page

**Files to change:** `pages/personas/personas.page.ts`

**What to replace (4 occurrences):**
- Tab navigation -> `<p-tabview>` or keep custom tabs with `<p-button>` styling
- `.badge` -> `<p-tag>`
- `.fw-bold` / `.text-muted` -> Custom utilities

**Effort:** 1 hour

#### Task E9: Products Page

**Files to change:** `pages/products/products.page.ts`

**What to replace:** Minimal - mostly delegates to child components.

**Effort:** 30 minutes

#### Task E10: Profile Page

**Files to change:** `pages/profile/profile.page.ts`

**What to replace (3 occurrences):**
- `.btn-secondary` custom button -> `<p-button severity="secondary">`
- Minimal changes needed.

**Effort:** 30 minutes

---

### Phase F: Remove Bootstrap

**Estimated Effort: 1 day**

#### Task F1: Remove Bootstrap from angular.json

**Files to change:** `frontend/angular.json`

Remove `"node_modules/bootstrap/dist/css/bootstrap.min.css"` from the styles array.

#### Task F2: Clean Up styles.scss

**Files to change:** `frontend/src/styles.scss`

Remove all Bootstrap override sections (`.card`, `.btn-*`, `.form-control`, `.modal-*`, etc.). Keep:
- Font face declarations
- CSS custom properties (`:root { --tp-* }`)
- SCSS variables
- Base styles (html, body, typography)
- Custom utility classes
- Glass/animation utilities
- WCAG focus styles
- Scrollbar styles
- Print styles

#### Task F3: Clean Up app.scss

**Files to change:** `frontend/src/app/app.scss`

Remove the "LEGACY STYLES" section (lines 748-881) that overrides Bootstrap components.

#### Task F4: Uninstall Bootstrap Packages

```bash
npm uninstall bootstrap @popperjs/core
```

#### Task F5: Visual Regression Testing

Run full visual regression across all pages to confirm no styling regressions after Bootstrap removal.

#### Task F6: Update Budget Limits

**Files to change:** `frontend/angular.json`

Update the production budget limits since PrimeNG's tree-shaken bundle may differ from Bootstrap:

```json
"budgets": [
  {
    "type": "initial",
    "maximumWarning": "600kB",
    "maximumError": "1.2MB"
  }
]
```

**Effort:** Monitor and adjust as needed.

---

## 5. ThinkPLUS Custom Preset

The PrimeNG 21 design token system uses a preset object to define all component styling. Below is the ThinkPLUS preset mapping current design tokens from `styles.scss` and `UI-DEVELOPMENT-GUIDELINES.md`.

**File: `frontend/src/app/theme/thinkplus-preset.ts`**

```typescript
import { definePreset } from '@primeng/themes';
import Aura from '@primeng/themes/aura';

/**
 * ThinkPLUS PrimeNG Preset
 *
 * Maps ThinkPLUS design tokens to PrimeNG's design token system.
 * Based on: src/styles.scss and docs/UI-DEVELOPMENT-GUIDELINES.md
 *
 * Brand Colors:
 *   Primary (Teal):  #047481 / dark: #035a66 / light: #5ee7f7
 *   Secondary (Blue): #2c5282 / dark: #1a365d / light: #4299e1
 *
 * Gray Scale:
 *   50: #f7fafc, 100: #edf2f7, 200: #e2e8f0, 300: #cbd5e0,
 *   400: #545e6e, 500: #454e5c, 600: #2d3748, 700: #1a202c
 */
export const ThinkPlusPreset = definePreset(Aura, {
  // =========================================================================
  // PRIMITIVE TOKENS (Base palette)
  // =========================================================================
  primitive: {
    borderRadius: {
      none: '0',
      xs: '2px',
      sm: '0.375rem',   // 6px - $border-radius-sm / --tp-radius-sm
      md: '0.5rem',      // 8px - $border-radius / --tp-radius-md
      lg: '0.75rem',     // 12px - $border-radius-lg / --tp-radius-lg
      xl: '1rem',        // 16px - $border-radius-xl / --tp-radius-xl
    },
    // ThinkPLUS teal palette as "primary" primitive
    teal: {
      50: '#e6f7f8',
      100: '#b3e8ec',
      200: '#80d9e0',
      300: '#4dcad4',
      400: '#26bbc8',
      500: '#047481',   // Primary brand color
      600: '#035a66',   // Dark variant
      700: '#024850',
      800: '#013640',
      900: '#012430',
      950: '#001820'
    },
    // ThinkPLUS blue palette as "secondary"
    blue: {
      50: '#ebf1f9',
      100: '#c2d4ec',
      200: '#99b7df',
      300: '#709ad2',
      400: '#4299e1',
      500: '#2c5282',   // Secondary brand color
      600: '#1a365d',
      700: '#153054',
      800: '#10244a',
      900: '#0b1841',
      950: '#060c30'
    },
    // ThinkPLUS gray palette (surface/text tokens)
    slate: {
      50: '#f7fafc',    // $gray-50 - bg-light
      100: '#edf2f7',   // $gray-100
      200: '#e2e8f0',   // $gray-200 - borders
      300: '#cbd5e0',   // $gray-300
      400: '#545e6e',   // $gray-400 - text-muted (WCAG AAA)
      500: '#454e5c',   // $gray-500 - text-secondary
      600: '#2d3748',   // $gray-600
      700: '#1a202c',   // $gray-700 - text-primary
      800: '#171923',
      900: '#0d0f12',
      950: '#050607'
    },
    // Semantic colors
    green: {
      500: '#276749',   // $success / $green
      600: '#1e5138'
    },
    red: {
      500: '#c53030',   // $danger / $error
      600: '#a32828'
    },
    orange: {
      500: '#c05621',   // $warning / $orange
      600: '#9a451a'
    },
    sky: {
      500: '#2b6cb0',   // $info
      600: '#22578f'
    }
  },

  // =========================================================================
  // SEMANTIC TOKENS (Role-based aliases)
  // =========================================================================
  semantic: {
    // Transition durations matching ThinkPLUS design system
    transitionDuration: '0.2s',

    // Focus ring matching --tp-focus-ring
    focusRing: {
      width: '3px',
      style: 'solid',
      color: 'rgba(4, 116, 129, 0.4)',
      offset: '2px'
    },

    // Icon size
    iconSize: '1rem',

    // Anchor/link styling
    anchorGutter: '2px',

    // Primary color tokens -> Teal
    primary: {
      50: '{teal.50}',
      100: '{teal.100}',
      200: '{teal.200}',
      300: '{teal.300}',
      400: '{teal.400}',
      500: '{teal.500}',
      600: '{teal.600}',
      700: '{teal.700}',
      800: '{teal.800}',
      900: '{teal.900}',
      950: '{teal.950}'
    },

    // Color scheme for surfaces and text
    colorScheme: {
      light: {
        // Surface colors
        surface: {
          0: '#ffffff',
          50: '{slate.50}',      // #f7fafc
          100: '{slate.100}',    // #edf2f7
          200: '{slate.200}',    // #e2e8f0
          300: '{slate.300}',    // #cbd5e0
          400: '{slate.400}',    // #545e6e
          500: '{slate.500}',    // #454e5c
          600: '{slate.600}',    // #2d3748
          700: '{slate.700}',    // #1a202c
          800: '{slate.800}',
          900: '{slate.900}',
          950: '{slate.950}'
        },
        // Primary color in light mode
        primary: {
          color: '{teal.500}',
          contrastColor: '#ffffff',
          hoverColor: '{teal.600}',
          activeColor: '{teal.700}'
        },
        // Highlight (selection)
        highlight: {
          background: 'rgba(4, 116, 129, 0.1)',
          focusBackground: 'rgba(4, 116, 129, 0.15)',
          color: '{teal.600}',
          focusColor: '{teal.700}'
        },
        // Content area background (--tp-bg)
        ground: {
          background: '#faf9f5'
        },
        // Text colors
        text: {
          color: '{slate.700}',         // --tp-text
          hoverColor: '{slate.800}',
          mutedColor: '{slate.400}',     // --tp-text-muted
          hoverMutedColor: '{slate.500}'
        },
        // Form field colors
        formField: {
          background: '#ffffff',
          disabledBackground: '{slate.100}',
          filledBackground: '{slate.50}',
          filledHoverBackground: '{slate.50}',
          filledFocusBackground: '#ffffff',
          borderColor: '{slate.200}',
          hoverBorderColor: '{slate.300}',
          focusBorderColor: '{teal.500}',
          invalidBorderColor: '{red.500}',
          color: '{slate.700}',
          disabledColor: '{slate.400}',
          placeholderColor: '{slate.400}',
          invalidPlaceholderColor: '{red.500}',
          floatLabelColor: '{slate.400}',
          floatLabelFocusColor: '{teal.500}',
          floatLabelActiveColor: '{slate.500}',
          floatLabelInvalidColor: '{red.500}',
          iconColor: '{slate.400}',
          shadow: '0 1px 2px rgba(0, 0, 0, 0.02)'
        },
        // Overlay (dialog/popover) styling
        overlay: {
          select: {
            background: '#ffffff',
            borderColor: '{slate.200}',
            color: '{slate.700}'
          },
          popover: {
            background: '#ffffff',
            borderColor: '{slate.200}',
            color: '{slate.700}'
          },
          modal: {
            background: '#ffffff',
            borderColor: '{slate.200}',
            color: '{slate.700}'
          }
        },
        // Navigation colors
        navigation: {
          item: {
            focusBackground: '{slate.50}',
            activeBackground: 'rgba(4, 116, 129, 0.08)',
            color: '{slate.600}',
            focusColor: '{slate.700}',
            activeColor: '{teal.500}',
            icon: {
              color: '{slate.400}',
              focusColor: '{slate.500}',
              activeColor: '{teal.500}'
            }
          },
          submenuLabel: {
            background: 'transparent',
            color: '{slate.400}'
          },
          submenuIcon: {
            color: '{slate.400}',
            focusColor: '{slate.500}',
            activeColor: '{teal.500}'
          }
        }
      }
    }
  },

  // =========================================================================
  // COMPONENT TOKENS (Per-component overrides)
  // =========================================================================
  components: {
    // Button - Match ThinkPLUS .btn styling
    button: {
      root: {
        borderRadius: '{borderRadius.md}',
        paddingX: '1.25rem',
        paddingY: '0.625rem',
        gap: '0.5rem',
        fontWeight: '500',
        transitionDuration: '{transitionDuration}',
        sm: {
          fontSize: '0.875rem',
          paddingX: '1rem',
          paddingY: '0.5rem'
        },
        lg: {
          fontSize: '1rem',
          paddingX: '1.75rem',
          paddingY: '0.75rem'
        }
      },
      colorScheme: {
        light: {
          root: {
            primary: {
              background: 'linear-gradient(135deg, {teal.500} 0%, {teal.600} 100%)',
              hoverBackground: 'linear-gradient(135deg, {teal.600} 0%, {teal.700} 100%)',
              activeBackground: '{teal.700}',
              borderColor: '{teal.500}',
              hoverBorderColor: '{teal.600}',
              activeBorderColor: '{teal.700}',
              color: '#ffffff',
              hoverColor: '#ffffff',
              activeColor: '#ffffff',
              focusRing: {
                color: 'rgba(4, 116, 129, 0.4)',
                shadow: '0 0 0 3px rgba(4, 116, 129, 0.4)'
              }
            },
            secondary: {
              background: '{slate.600}',
              hoverBackground: '{slate.700}',
              activeBackground: '{slate.800}',
              borderColor: '{slate.600}',
              hoverBorderColor: '{slate.700}',
              color: '#ffffff',
              hoverColor: '#ffffff',
              activeColor: '#ffffff'
            }
          },
          outlined: {
            primary: {
              borderColor: '{teal.500}',
              color: '{teal.500}',
              hoverBackground: '{teal.500}',
              hoverColor: '#ffffff'
            },
            secondary: {
              borderColor: '{slate.200}',
              color: '{slate.500}',
              hoverBackground: '{slate.100}',
              hoverBorderColor: '{slate.300}',
              hoverColor: '{slate.700}'
            }
          },
          text: {
            primary: {
              color: '{teal.500}',
              hoverBackground: 'rgba(4, 116, 129, 0.08)'
            }
          }
        }
      }
    },

    // Card - Match ThinkPLUS .card styling
    card: {
      root: {
        background: '#ffffff',
        borderRadius: '{borderRadius.lg}',
        color: '{slate.700}',
        shadow: '0 1px 2px rgba(0, 0, 0, 0.05)'
      },
      body: {
        padding: '1.5rem',
        gap: '0.75rem'
      },
      title: {
        fontWeight: '600',
        fontSize: '1.125rem'
      },
      subtitle: {
        color: '{slate.400}'
      }
    },

    // Dialog - Match ThinkPLUS .modal-content styling (glass morphism)
    dialog: {
      root: {
        borderRadius: '{borderRadius.xl}',
        background: 'rgba(255, 255, 255, 0.95)',
        borderColor: 'rgba(255, 255, 255, 0.3)',
        shadow: '0 8px 32px rgba(0, 0, 0, 0.12), 0 24px 64px rgba(0, 0, 0, 0.08)',
        padding: '0'
      },
      header: {
        padding: '1.25rem 1.5rem',
        borderColor: 'rgba(0, 0, 0, 0.06)'
      },
      content: {
        padding: '1.5rem'
      },
      footer: {
        padding: '1.25rem 1.5rem',
        borderColor: 'rgba(0, 0, 0, 0.06)',
        gap: '0.75rem'
      }
    },

    // DataTable - Match ThinkPLUS .table styling
    datatable: {
      root: {
        transitionDuration: '{transitionDuration}'
      },
      headerCell: {
        background: '{slate.50}',
        borderColor: '{slate.200}',
        color: '{slate.700}',
        padding: '1rem',
        fontWeight: '500'
      },
      bodyCell: {
        borderColor: '{slate.100}',
        padding: '1rem'
      },
      rowToggleButton: {
        hoverBackground: '{slate.50}'
      }
    },

    // InputText - Match ThinkPLUS .form-control
    inputtext: {
      root: {
        background: '#ffffff',
        borderColor: '{slate.200}',
        hoverBorderColor: '{slate.300}',
        focusBorderColor: '{teal.500}',
        invalidBorderColor: '{red.500}',
        color: '{slate.700}',
        placeholderColor: '{slate.400}',
        borderRadius: '{borderRadius.md}',
        paddingX: '1rem',
        paddingY: '0.75rem',
        shadow: '0 1px 2px rgba(0, 0, 0, 0.02)',
        transitionDuration: '0.2s'
      }
    },

    // Select (Dropdown) - Match ThinkPLUS .form-select
    select: {
      root: {
        background: '#ffffff',
        borderColor: '{slate.200}',
        hoverBorderColor: '{slate.300}',
        focusBorderColor: '{teal.500}',
        borderRadius: '{borderRadius.md}',
        shadow: '0 1px 2px rgba(0, 0, 0, 0.02)',
        transitionDuration: '0.2s'
      }
    },

    // Tag (Badge) - Match ThinkPLUS .badge
    tag: {
      root: {
        fontWeight: '500',
        fontSize: '0.75rem',
        padding: '0.375rem 0.75rem',
        borderRadius: '50rem'
      }
    },

    // Breadcrumb
    breadcrumb: {
      root: {
        background: 'transparent',
        padding: '0',
        transitionDuration: '{transitionDuration}'
      },
      item: {
        color: '{teal.500}',
        hoverColor: '{teal.600}',
        gap: '0.75rem'
      },
      separator: {
        color: '{slate.400}'
      }
    },

    // Tooltip
    tooltip: {
      root: {
        borderRadius: '{borderRadius.md}',
        padding: '0.5rem 0.75rem',
        background: '{slate.700}',
        color: '#ffffff',
        shadow: '0 4px 16px rgba(0, 0, 0, 0.12)'
      }
    },

    // Menu (Dropdown menu)
    menu: {
      root: {
        borderRadius: '{borderRadius.lg}',
        background: '#ffffff',
        borderColor: '{slate.200}',
        shadow: '0 4px 16px rgba(0, 0, 0, 0.12), 0 2px 4px rgba(0, 0, 0, 0.06)',
        padding: '0.5rem'
      },
      item: {
        borderRadius: '{borderRadius.md}',
        padding: '0.75rem 1rem',
        focusBackground: '{slate.50}',
        color: '{slate.600}',
        focusColor: '{slate.700}',
        gap: '0.5rem'
      }
    },

    // Toast
    toast: {
      root: {
        borderRadius: '{borderRadius.lg}',
        shadow: '0 4px 16px rgba(0, 0, 0, 0.12)'
      }
    },

    // Tabs
    tabs: {
      tab: {
        background: 'transparent',
        hoverBackground: '{slate.50}',
        activeBackground: 'transparent',
        borderColor: '{slate.200}',
        activeBorderColor: '{teal.500}',
        color: '{slate.500}',
        hoverColor: '{slate.700}',
        activeColor: '{teal.500}',
        fontWeight: '500',
        padding: '0.75rem 1.25rem'
      }
    },

    // Checkbox
    checkbox: {
      root: {
        borderRadius: '{borderRadius.sm}',
        width: '1.25rem',
        height: '1.25rem',
        borderColor: '{slate.300}',
        hoverBorderColor: '{teal.500}',
        focusBorderColor: '{teal.500}',
        checkedBackground: '{teal.500}',
        checkedHoverBackground: '{teal.600}',
        checkedBorderColor: '{teal.500}'
      }
    },

    // Toggle Switch
    toggleswitch: {
      root: {
        background: '{slate.300}',
        hoverBackground: '{slate.400}',
        checkedBackground: '{teal.500}',
        checkedHoverBackground: '{teal.600}',
        borderRadius: '50rem'
      }
    }
  }
});
```

---

## 6. PWA Setup Steps

### 6.1 Add Angular PWA

```bash
cd frontend
ng add @angular/pwa --project bitx-prodct
```

This will:
- Add `@angular/service-worker` to dependencies
- Create `ngsw-config.json`
- Create `manifest.webmanifest`
- Register the service worker in `main.ts`
- Add manifest link to `index.html`

### 6.2 ngsw-config.json Configuration

**File: `frontend/ngsw-config.json`**

```json
{
  "$schema": "./node_modules/@angular/service-worker/config/schema.json",
  "index": "/index.html",
  "assetGroups": [
    {
      "name": "app",
      "installMode": "prefetch",
      "resources": {
        "files": [
          "/favicon.ico",
          "/index.html",
          "/manifest.webmanifest",
          "/*.css",
          "/*.js"
        ]
      }
    },
    {
      "name": "assets",
      "installMode": "lazy",
      "updateMode": "prefetch",
      "resources": {
        "files": [
          "/assets/**",
          "/*.(svg|cur|jpg|jpeg|png|apng|webp|avif|gif|otf|ttf|woff|woff2)"
        ],
        "urls": [
          "https://fonts.googleapis.com/**",
          "https://fonts.gstatic.com/**"
        ]
      }
    }
  ],
  "dataGroups": [
    {
      "name": "api-auth",
      "urls": ["/api/v1/auth/**"],
      "cacheConfig": {
        "strategy": "freshness",
        "maxSize": 0,
        "maxAge": "0u",
        "timeout": "10s"
      }
    },
    {
      "name": "api-tenant",
      "urls": ["/api/v1/tenants/**"],
      "cacheConfig": {
        "strategy": "performance",
        "maxSize": 50,
        "maxAge": "1h",
        "timeout": "5s"
      }
    },
    {
      "name": "api-users",
      "urls": ["/api/v1/users/**"],
      "cacheConfig": {
        "strategy": "freshness",
        "maxSize": 100,
        "maxAge": "5m",
        "timeout": "5s"
      }
    },
    {
      "name": "api-licenses",
      "urls": ["/api/v1/licenses/**"],
      "cacheConfig": {
        "strategy": "performance",
        "maxSize": 50,
        "maxAge": "30m",
        "timeout": "5s"
      }
    },
    {
      "name": "api-products",
      "urls": ["/api/v1/products/**"],
      "cacheConfig": {
        "strategy": "performance",
        "maxSize": 200,
        "maxAge": "1h",
        "timeout": "5s"
      }
    },
    {
      "name": "api-audit",
      "urls": ["/api/v1/audit/**"],
      "cacheConfig": {
        "strategy": "freshness",
        "maxSize": 0,
        "maxAge": "0u",
        "timeout": "10s"
      }
    }
  ],
  "navigationUrls": [
    "/**",
    "!/**/*.*",
    "!/**/api/**"
  ],
  "navigationRequestStrategy": "freshness"
}
```

**Data Group Strategy Notes:**
- `freshness` (network-first): For auth, users, audit - data must be current
- `performance` (cache-first): For tenants, licenses, products - can tolerate staleness

### 6.3 manifest.webmanifest Customization

**File: `frontend/src/manifest.webmanifest`**

```json
{
  "name": "ThinkPLUS Enterprise Management System",
  "short_name": "ThinkPLUS",
  "description": "Multi-tenant enterprise management platform with IAM, license management, and process modeling",
  "start_url": "/",
  "scope": "/",
  "display": "standalone",
  "orientation": "any",
  "background_color": "#faf9f5",
  "theme_color": "#047481",
  "dir": "ltr",
  "lang": "en",
  "categories": ["business", "productivity"],
  "icons": [
    {
      "src": "assets/icons/icon-72x72.png",
      "sizes": "72x72",
      "type": "image/png",
      "purpose": "maskable any"
    },
    {
      "src": "assets/icons/icon-96x96.png",
      "sizes": "96x96",
      "type": "image/png",
      "purpose": "maskable any"
    },
    {
      "src": "assets/icons/icon-128x128.png",
      "sizes": "128x128",
      "type": "image/png",
      "purpose": "maskable any"
    },
    {
      "src": "assets/icons/icon-144x144.png",
      "sizes": "144x144",
      "type": "image/png",
      "purpose": "maskable any"
    },
    {
      "src": "assets/icons/icon-152x152.png",
      "sizes": "152x152",
      "type": "image/png",
      "purpose": "maskable any"
    },
    {
      "src": "assets/icons/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "maskable any"
    },
    {
      "src": "assets/icons/icon-384x384.png",
      "sizes": "384x384",
      "type": "image/png",
      "purpose": "maskable any"
    },
    {
      "src": "assets/icons/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "maskable any"
    }
  ],
  "screenshots": [
    {
      "src": "assets/screenshots/login-wide.png",
      "sizes": "1280x720",
      "type": "image/png",
      "form_factor": "wide",
      "label": "ThinkPLUS Login"
    },
    {
      "src": "assets/screenshots/administration-narrow.png",
      "sizes": "390x844",
      "type": "image/png",
      "form_factor": "narrow",
      "label": "ThinkPLUS Administration"
    }
  ],
  "shortcuts": [
    {
      "name": "Products",
      "short_name": "Products",
      "description": "Manage product portfolio",
      "url": "/products",
      "icons": [{ "src": "assets/icons/package.svg", "sizes": "96x96" }]
    },
    {
      "name": "Process Modeler",
      "short_name": "Processes",
      "description": "BPMN process editor",
      "url": "/process-modeler",
      "icons": [{ "src": "assets/icons/git-branch.svg", "sizes": "96x96" }]
    }
  ]
}
```

### 6.4 Offline Fallback Page

Create a minimal offline fallback page:

**File: `frontend/src/offline.html`**

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>ThinkPLUS - Offline</title>
  <style>
    body {
      font-family: 'Gotham Rounded', 'Nunito', system-ui, sans-serif;
      background: #faf9f5;
      color: #1a202c;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      margin: 0;
      text-align: center;
      padding: 2rem;
    }
    .offline-card {
      max-width: 400px;
      background: white;
      border-radius: 16px;
      padding: 3rem 2rem;
      box-shadow: 0 4px 16px rgba(0,0,0,0.08);
    }
    h1 { font-size: 1.5rem; margin: 1rem 0 0.5rem; color: #047481; }
    p { color: #545e6e; line-height: 1.6; }
    button {
      margin-top: 1.5rem;
      padding: 0.75rem 2rem;
      background: #047481;
      color: white;
      border: none;
      border-radius: 8px;
      font-size: 1rem;
      cursor: pointer;
    }
    button:hover { background: #035a66; }
  </style>
</head>
<body>
  <div class="offline-card">
    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#047481" stroke-width="1.5">
      <line x1="1" y1="1" x2="23" y2="23"/>
      <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55"/>
      <path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39"/>
      <path d="M10.71 5.05A16 16 0 0 1 22.56 9"/>
      <path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88"/>
      <path d="M8.53 16.11a6 6 0 0 1 6.95 0"/>
      <line x1="12" y1="20" x2="12.01" y2="20"/>
    </svg>
    <h1>You're Offline</h1>
    <p>It looks like you've lost your internet connection. Some features may be unavailable until you reconnect.</p>
    <button onclick="window.location.reload()">Try Again</button>
  </div>
</body>
</html>
```

Add this to the assets in `angular.json`:
```json
{
  "glob": "offline.html",
  "input": "src",
  "output": "/"
}
```

---

## 7. Responsive and Foldable Setup

### 7.1 PrimeNG Responsive DataTable Configuration

PrimeNG DataTable supports built-in responsive modes:

```typescript
// Stack layout on mobile (each row becomes a card)
<p-table [value]="users" [responsiveLayout]="'stack'" breakpoint="768px">
  <ng-template pTemplate="header">
    <tr>
      <th>Name</th>
      <th>Email</th>
      <th>Status</th>
    </tr>
  </ng-template>
  <ng-template pTemplate="body" let-user>
    <tr>
      <td><span class="p-column-title">Name</span>{{ user.name }}</td>
      <td><span class="p-column-title">Email</span>{{ user.email }}</td>
      <td><span class="p-column-title">Status</span><p-tag [value]="user.status" /></td>
    </tr>
  </ng-template>
</p-table>
```

For scroll layout (horizontal scroll on mobile):
```typescript
<p-table [value]="data" [responsiveLayout]="'scroll'" [scrollable]="true">
```

### 7.2 Foldable CSS Utility Classes

**File: `frontend/src/styles/_foldable.scss`**

```scss
// ============================================
// FOLDABLE DEVICE SUPPORT
// Samsung Galaxy Fold, Microsoft Surface Duo, etc.
// ============================================

// Foldable breakpoints
$fold-min: 280px;   // Single screen (folded)
$fold-max: 653px;   // Dual screen boundary

// Spanning detection
@media (horizontal-viewport-segments: 2) {
  // Dual-screen horizontal layout (e.g., Surface Duo landscape)
  .fold-split-horizontal {
    display: grid;
    grid-template-columns: env(viewport-segment-width 0 0) env(viewport-segment-width 1 0);
    column-gap: env(viewport-segment-left 1 0);
  }
}

@media (vertical-viewport-segments: 2) {
  // Dual-screen vertical layout (e.g., Surface Duo portrait)
  .fold-split-vertical {
    display: grid;
    grid-template-rows: env(viewport-segment-height 0 0) env(viewport-segment-height 0 1);
    row-gap: env(viewport-segment-top 0 1);
  }
}

// Foldable-aware container
.fold-container {
  width: 100%;
  max-width: 100%;

  // When on a foldable device, respect the fold line
  @media (horizontal-viewport-segments: 2) {
    display: grid;
    grid-template-columns: env(viewport-segment-width 0 0) env(viewport-segment-width 1 0);
    gap: env(viewport-segment-left 1 0);
  }
}

// Sidebar on one panel, content on another
.fold-sidebar-layout {
  @media (horizontal-viewport-segments: 2) {
    .docker-container {
      width: env(viewport-segment-width 0 0);
      max-width: env(viewport-segment-width 0 0);
    }
    .main-container {
      width: env(viewport-segment-width 1 0);
    }
  }
}

// Hide content that should only show on specific panels
.fold-primary-only {
  @media (horizontal-viewport-segments: 2) {
    grid-column: 1;
  }
}

.fold-secondary-only {
  @media (horizontal-viewport-segments: 2) {
    grid-column: 2;
  }
}

// Responsive helpers for narrow foldable screens
@media (max-width: $fold-min) {
  .fold-compact {
    padding: 8px !important;
    font-size: 14px !important;
  }

  .fold-hide {
    display: none !important;
  }

  .fold-stack {
    flex-direction: column !important;
  }
}
```

### 7.3 Updated Breakpoint System

Extend the existing breakpoints with foldable and ultra-wide support:

**Add to `frontend/src/styles.scss`:**

```scss
// Foldable and extended breakpoints
$breakpoint-fold: 280px;      // Galaxy Fold closed
$breakpoint-fold-open: 653px; // Galaxy Fold open
$breakpoint-sm: 576px;        // Small phones
$breakpoint-md: 768px;        // Tablets
$breakpoint-lg: 992px;        // Laptops
$breakpoint-xl: 1200px;       // Desktops
$breakpoint-xxl: 1400px;      // Large desktops
$breakpoint-2k: 1920px;       // 2K monitors
$breakpoint-ultrawide: 2560px;// Ultra-wide monitors
$breakpoint-4k: 3840px;       // 4K displays
```

---

## 8. Risk Register

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| **CSS specificity conflicts** between Bootstrap and PrimeNG during coexistence phase | Medium | Medium | Use PrimeNG's `cssLayer` option to control cascade order. PrimeNG components use their own selectors (`p-button`, `p-card`) that don't clash with Bootstrap class selectors. |
| **Bundle size increase** during coexistence (both Bootstrap and PrimeNG loaded) | High | Low | Temporary. PrimeNG uses tree-shaking so only imported components are bundled. After Bootstrap removal, overall size should decrease. Monitor with `ng build --stats-json`. |
| **Visual regression** when removing Bootstrap utility classes | Medium | High | Create comprehensive visual regression test suite (Playwright screenshots) before starting migration. Run after each phase. |
| **PrimeNG 21 breaking changes** from rapid release cycle | Low | Medium | Pin exact PrimeNG version in `package.json` (not `^`). Test thoroughly before upgrading. |
| **Animation performance** on low-power devices | Low | Low | Use `provideAnimationsAsync()` (lazy-loaded). PrimeNG animations are CSS-based, not JavaScript-based. Respect `prefers-reduced-motion` media query. |
| **BPMN components styling interference** | Low | Medium | BPMN components (bpmn-js) use their own CSS loaded via `angular.json`. PrimeNG should not interfere since bpmn-js uses its own class namespace. Test the canvas area specifically. |
| **ApexCharts + PrimeNG tooltip conflicts** | Low | Low | Both have tooltip implementations. Use only PrimeNG tooltips for Angular components and ApexCharts' built-in tooltips for charts. Avoid mixing. |
| **Budget limits exceeded** after adding PrimeNG | Medium | Low | Temporarily increase `maximumWarning` and `maximumError` in `angular.json` budgets. Optimize after migration by removing Bootstrap. |
| **Theme customization limitations** in PrimeNG preset API | Low | Medium | PrimeNG 21's design token system is comprehensive. For any gap, fall back to global CSS overrides targeting `[class*="p-"]` selectors. |
| **Migration takes longer than estimated** due to administration page complexity | Medium | Medium | The administration page is ~1500+ lines with 276 Bootstrap class occurrences. Consider breaking it into smaller sub-components during migration to reduce complexity. |

### Rollback Strategy

If migration needs to be aborted at any phase:

1. **During Phase A-E (coexistence):** Simply revert the PrimeNG changes in affected files. Bootstrap CSS is still loaded and functional.
2. **After Phase F (Bootstrap removed):** Revert the `angular.json` change to re-add `bootstrap.min.css`, revert `styles.scss` cleanup, and reinstall packages.
3. **Git strategy:** Each phase should be a separate branch/PR. If any phase causes issues, the PR can be reverted cleanly.

---

## 9. DEV-PRINCIPLES.md Update Proposal

The current `docs/governance/agents/DEV-PRINCIPLES.md` (v1.0.0) lists:

```
| UI Library | PrimeNG | Latest |
```

This is aspirational. The actual codebase uses Bootstrap 5 + custom CSS. The following update reflects the migration plan:

### Proposed Change

Replace the Technology Stack table row:

**Current:**
```markdown
| UI Library | PrimeNG | Latest |
```

**Updated:**
```markdown
| UI Library | PrimeNG + Bootstrap (migration) | PrimeNG 21 (target), Bootstrap 5.3.8 (being replaced) |
```

After migration completes, update to:
```markdown
| UI Library | PrimeNG | 21.x |
```

### Additional Standards to Add

Add to the Angular/TypeScript Standards section:

```markdown
#### PrimeNG Component Standards

- Import PrimeNG components individually (tree-shaking): `import { Button } from 'primeng/button';`
- Use the ThinkPLUS preset for theming - do NOT override PrimeNG styles with global CSS
- Prefer PrimeNG components over custom implementations:
  - `<p-button>` instead of `<button class="btn">`
  - `<p-dialog>` instead of custom modal overlays
  - `<p-table>` instead of `<table class="table">`
  - `<p-select>` instead of `<select class="form-select">`
  - `<p-tag>` instead of `<span class="badge">`
  - `<p-inputtext>` instead of `<input class="form-control">`
  - `<p-breadcrumb>` instead of custom breadcrumb HTML
  - `<p-chips>` instead of custom tag input components
  - `<p-selectbutton>` instead of `.btn-group` toggle buttons
- Add `data-testid` attributes to PrimeNG components for E2E testing
- Use PrimeNG's built-in responsive features (`responsiveLayout`, `breakpoint`)
```

### Forbidden Practices to Add

```markdown
- Never use Bootstrap CSS classes in new code (use PrimeNG components)
- Never import Bootstrap JavaScript (already not used, but explicitly forbidden)
- Never override PrimeNG component styles with `!important` (use the preset/token system)
- Never mix `*ngIf/*ngFor` with `@if/@for` in the same template (use `@if/@for` only)
```

---

## Effort Summary

| Phase | Description | Estimated Effort | Dependencies |
|-------|-------------|-----------------|--------------|
| A | Infrastructure (install, configure, preset, *ngIf migration) | 2 days | None |
| B | Shared/Global components | 2 days | Phase A |
| C | Auth pages | 1 day | Phase A |
| D | Admin pages (heaviest phase) | 5 days | Phase B |
| E | Feature pages (products, personas, BPMN) | 4 days | Phase B |
| F | Remove Bootstrap | 1 day | Phases C, D, E |
| **Total** | | **15 days** | |

**Recommended execution order:** A -> B -> C -> D + E (parallel) -> F

**Note:** Phase D and Phase E can be executed in parallel by different developers since they modify non-overlapping files. Phase C (auth pages) is also independent and can run in parallel with D and E.

---

## Appendix: Component Migration Mapping

| Bootstrap / Custom Pattern | PrimeNG Replacement | Import |
|---------------------------|---------------------|--------|
| `<button class="btn btn-primary">` | `<p-button label="..." />` | `import { Button } from 'primeng/button';` |
| `<button class="btn btn-outline-*">` | `<p-button label="..." [outlined]="true" />` | `Button` |
| `<button class="btn btn-sm">` | `<p-button label="..." size="small" />` | `Button` |
| `<button class="btn-close">` | `<p-button icon="pi pi-times" [rounded]="true" [text]="true" />` | `Button` |
| `<div class="card"><div class="card-body">` | `<p-card>` | `import { Card } from 'primeng/card';` |
| `<div class="modal-overlay"><div class="modal-*">` | `<p-dialog [visible]="..." [modal]="true">` | `import { Dialog } from 'primeng/dialog';` |
| `<input class="form-control">` | `<input pInputText />` | `import { InputText } from 'primeng/inputtext';` |
| `<textarea class="form-control">` | `<textarea pInputTextarea></textarea>` | `import { Textarea } from 'primeng/textarea';` |
| `<select class="form-select">` | `<p-select [options]="..." />` | `import { Select } from 'primeng/select';` |
| `<span class="badge bg-*">` | `<p-tag value="..." severity="..." />` | `import { Tag } from 'primeng/tag';` |
| `<table class="table">` | `<p-table [value]="...">` | `import { Table } from 'primeng/table';` |
| `.btn-group` toggle | `<p-selectbutton [options]="..." />` | `import { SelectButton } from 'primeng/selectbutton';` |
| `.alert` | `<p-message severity="..." text="..." />` | `import { Message } from 'primeng/message';` |
| `<nav class="breadcrumb">` | `<p-breadcrumb [model]="..." />` | `import { Breadcrumb } from 'primeng/breadcrumb';` |
| Custom tag input | `<p-chips [(ngModel)]="..." />` | `import { Chips } from 'primeng/chips';` |
| Custom dropdown menu | `<p-menu [model]="..." [popup]="true" />` | `import { Menu } from 'primeng/menu';` |
| `.form-group` wrapper | `<div class="p-field">` | CSS class only |
| `<input type="checkbox">` | `<p-checkbox />` | `import { Checkbox } from 'primeng/checkbox';` |
| Custom toggle switch | `<p-toggleswitch />` | `import { ToggleSwitch } from 'primeng/toggleswitch';` |
| `<div class="spinner-border">` | `<p-progressspinner />` | `import { ProgressSpinner } from 'primeng/progressspinner';` |
| Skeleton loading | `<p-skeleton />` | `import { Skeleton } from 'primeng/skeleton';` |
| Toast notifications | `<p-toast />` + `MessageService` | `import { Toast } from 'primeng/toast';` |
| Pagination | `<p-paginator />` | `import { Paginator } from 'primeng/paginator';` |
| Tooltip | `pTooltip="..."` directive | `import { Tooltip } from 'primeng/tooltip';` |
| MFA code input | `<p-inputotp [length]="6" />` | `import { InputOtp } from 'primeng/inputotp';` |
| Password input with reveal | `<p-password />` | `import { Password } from 'primeng/password';` |
| File upload | `<p-fileupload />` | `import { FileUpload } from 'primeng/fileupload';` |
| Tab navigation | `<p-tabview>` or `<p-tabs>` | `import { Tabs } from 'primeng/tabs';` |
| Accordion sections | `<p-accordion>` | `import { Accordion } from 'primeng/accordion';` |

---

## Related Documents

- [UI Development Guidelines](/Users/mksulty/Claude/EMSIST/frontend/docs/UI-DEVELOPMENT-GUIDELINES.md)
- [Frontend Implementation Plan](/Users/mksulty/Claude/EMSIST/frontend/docs/FRONTEND-IMPLEMENTATION-PLAN.md)
- [DEV Agent Principles](/Users/mksulty/Claude/EMSIST/docs/governance/agents/DEV-PRINCIPLES.md)
- [PrimeNG 21 Documentation](https://primeng.org/)
- [PrimeNG Theming Guide](https://primeng.org/theming)
