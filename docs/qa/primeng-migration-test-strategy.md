# PrimeNG Migration Test Strategy

**Document Version:** 1.0.0
**Status:** DRAFT
**Created:** 2026-02-26
**Author:** QA Lead Agent
**Last Updated:** 2026-02-26

---

## Table of Contents

1. [Overview](#1-overview)
2. [Migration Test Approach](#2-migration-test-approach)
3. [Unit Test Strategy (Vitest)](#3-unit-test-strategy-vitest)
4. [E2E Test Strategy (Playwright)](#4-e2e-test-strategy-playwright)
5. [Accessibility Test Strategy](#5-accessibility-test-strategy)
6. [PWA Test Strategy](#6-pwa-test-strategy)
7. [Responsive and Foldable Device Test Strategy](#7-responsive-and-foldable-device-test-strategy)
8. [Performance Test Strategy](#8-performance-test-strategy)
9. [Test Execution Matrix](#9-test-execution-matrix)
10. [Go/No-Go Criteria](#10-gono-go-criteria)
11. [Risk Assessment](#11-risk-assessment)
12. [Appendices](#12-appendices)

---

## 1. Overview

### 1.1 Purpose

This document defines the comprehensive test strategy for migrating the EMSIST frontend from Bootstrap 5 + ng-bootstrap 20 to PrimeNG 21, adding PWA support, and implementing responsive/foldable device capabilities. The migration is planned as an incremental, component-by-component process where Bootstrap and PrimeNG coexist temporarily.

### 1.2 Scope

| Area | In Scope | Out of Scope |
|------|----------|--------------|
| UI Component Migration | Bootstrap to PrimeNG swap for all 18+ components | Backend API changes |
| PWA Support | Service worker, offline mode, installability | Native mobile app |
| Responsive/Foldable | Viewport adaptation, Samsung Fold segments | Hardware device testing |
| Visual Regression | Screenshot comparison pre/post swap | Manual visual design review |
| Accessibility | WCAG AAA compliance, RTL, screen readers | Cognitive accessibility |
| Performance | Bundle size, Lighthouse, FCP, TTI | Server-side performance |

### 1.3 Current Test Infrastructure

Verified from `/frontend/package.json` and configuration files:

| Tool | Version | Purpose | Config File |
|------|---------|---------|-------------|
| Vitest | ^3.1.0 | Unit testing | `frontend/vitest.config.ts` |
| @vitest/coverage-v8 | ^3.1.0 | Code coverage | Thresholds: 80/70/80/80 |
| @playwright/test | ^1.58.2 | E2E testing | `frontend/playwright.config.ts` |
| @axe-core/playwright | ^4.11.1 | Accessibility | `accessibility` project |
| jsdom | ^26.0.0 | DOM environment | vitest environment |
| @analogjs/vite-plugin-angular | ^1.17.0 | Angular/Vite integration | vitest plugin |

### 1.4 Current Test Assets

Verified from the codebase:

| Category | Count | Files |
|----------|-------|-------|
| Unit test specs | 13 | `frontend/src/**/*.spec.ts` |
| E2E test files | 7 | `frontend/e2e/*.e2e.ts` |
| Accessibility tests | 1 | `frontend/e2e/accessibility.a11y.ts` |
| Existing Playwright projects | 7 | chromium, firefox, webkit, Mobile Chrome, Mobile Safari, Microsoft Edge, accessibility |

### 1.5 Test Scripts

```bash
npm run test           # vitest run
npm run test:watch     # vitest (watch mode)
npm run test:coverage  # vitest run --coverage
npm run e2e            # playwright test
npm run e2e:ui         # playwright test --ui
npm run e2e:headed     # playwright test --headed
npm run e2e:a11y       # playwright test --project=accessibility
```

### 1.6 Testing Pyramid Targets

Per QA principles (docs/governance/agents/QA-PRINCIPLES.md), the project follows a 70/20/10 ratio:

```
           /\
          /  \   E2E Tests (10%) - Playwright
         /    \  Critical user journeys only
        /------\
       /        \  Integration Tests (20%)
      /          \ API mocks, component interaction
     /--------------\
    /                \  Unit Tests (70%) - Vitest
   /                  \ Business logic, services, pipes
  /____________________\
```

---

## 2. Migration Test Approach

### 2.1 Incremental Migration Phases

The migration proceeds in five phases. At every phase boundary, Bootstrap and PrimeNG coexist. Testing must account for both libraries being loaded simultaneously.

| Phase | Name | Description | Duration |
|-------|------|-------------|----------|
| A | Coexistence Setup | Install PrimeNG alongside Bootstrap; configure theming | 1 week |
| B | Shared Components | Migrate breadcrumb, sidebar, page-layout, tag-input, confidence-badge | 2 weeks |
| C | Page Components | Migrate product-list, product-modal, persona-form, journey-form, export, preview, provider-list, provider-form, provider-embedded | 3 weeks |
| D | Cleanup | Remove Bootstrap, ng-bootstrap, @popperjs/core; final CSS purge | 1 week |
| E | PWA + Responsive | Service worker, offline support, foldable viewports | 2 weeks |

### 2.2 Visual Regression Testing

#### 2.2.1 Baseline Capture

Before any migration work begins, capture visual baselines for every page and component state.

**Tool:** Playwright screenshot comparison (`expect(page).toHaveScreenshot()`)

**Baseline Pages:**

| Page | Route | States to Capture |
|------|-------|-------------------|
| Login | `/login` | Default, email form expanded, validation errors, SSO buttons |
| Products | `/products` | Empty state, list view, card view, with sidebar |
| Product Modal | `/products` (modal open) | Create, edit, delete confirmation |
| Personas | `/personas` | List, detail, journey map |
| BPMN Modeler | `/process-modeler` | Empty canvas, with elements, properties panel open |
| Administration | `/administration` | Skeleton state |
| Identity Providers | `/admin/identity-providers` | List, create form, embedded view |
| Profile | `/profile` | Skeleton state |
| Error Pages | `/errors/*` | tenant-not-found, access-denied, session-expired |

**Capture Script Template:**

```typescript
// e2e/visual-regression/baseline.e2e.ts
import { test, expect, Page } from '@playwright/test';

test.describe('Visual Regression Baselines', () => {
  test('login-page-default', async ({ page }) => {
    await mockTenantResolution(page);
    await page.goto('/login');
    await expect(page).toHaveScreenshot('login-default.png', {
      fullPage: true,
      maxDiffPixelRatio: 0.01,
    });
  });

  test('login-page-email-form', async ({ page }) => {
    await mockTenantResolution(page);
    await page.goto('/login');
    await page.getByRole('button', { name: /sign in with email/i }).click();
    await expect(page).toHaveScreenshot('login-email-form.png', {
      fullPage: true,
      maxDiffPixelRatio: 0.01,
    });
  });

  // Repeat for every page/state combination
});
```

**Viewport Configurations for Visual Regression:**

| Viewport Name | Width | Height | Rationale |
|---------------|-------|--------|-----------|
| Mobile Small | 320 | 640 | Smallest supported device |
| Mobile Standard | 375 | 812 | iPhone 12/13/14 |
| Tablet Portrait | 768 | 1024 | iPad portrait |
| Desktop Standard | 1280 | 720 | Current Playwright default |
| Desktop Large | 1920 | 1080 | Full HD |

#### 2.2.2 Comparison After Each Component Swap

After each component is migrated from Bootstrap to PrimeNG:

1. Run the visual regression suite against the baseline screenshots
2. Accept intentional visual changes (PrimeNG styling) as new baselines
3. Flag unintentional visual regressions (layout breaks, missing elements, overflow)
4. Update baselines only after QA review and approval

**Threshold Configuration:**

```typescript
// playwright.config.ts addition for visual regression
{
  name: 'visual-regression',
  testMatch: '**/*.visual.ts',
  use: {
    ...devices['Desktop Chrome'],
    screenshot: 'on',
  },
  expect: {
    toHaveScreenshot: {
      maxDiffPixelRatio: 0.02,  // 2% pixel difference allowed
      threshold: 0.2,            // Color difference threshold per pixel
      animations: 'disabled',    // Disable animations for stable screenshots
    },
  },
}
```

#### 2.2.3 Component-Level Smoke Tests After Each Swap

For each component swapped from ng-bootstrap to PrimeNG, execute these smoke checks:

| Check | Method | Pass Criteria |
|-------|--------|---------------|
| Component renders | Playwright locator visibility | Element present in DOM and visible |
| No console errors | `page.on('console')` listener | Zero `error` level messages |
| No uncaught exceptions | `page.on('pageerror')` listener | Zero unhandled exceptions |
| Layout intact | Bounding box comparison | Position within 5px of baseline |
| Interactive elements respond | Click/type/select actions | Expected state changes occur |
| Animations complete | Wait for animation end | No stuck transitions |

**Smoke Test Template:**

```typescript
// e2e/migration-smoke/component-smoke.e2e.ts
test.describe('Post-Migration Smoke: [ComponentName]', () => {
  const consoleErrors: string[] = [];
  const pageErrors: string[] = [];

  test.beforeEach(async ({ page }) => {
    page.on('console', msg => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });
    page.on('pageerror', err => pageErrors.push(err.message));
  });

  test.afterEach(async () => {
    expect(consoleErrors).toEqual([]);
    expect(pageErrors).toEqual([]);
  });

  test('renders without errors', async ({ page }) => {
    // Navigate to page containing the migrated component
    // Assert visibility of PrimeNG elements
    // Assert no Bootstrap CSS classes remain on migrated elements
  });
});
```

#### 2.2.4 Full Regression After Each Migration Phase

At the conclusion of each phase (A through E), execute the complete regression suite:

| Suite | Command | Scope |
|-------|---------|-------|
| Unit Tests | `npm run test:coverage` | All 13+ spec files |
| E2E Core | `npm run e2e` | All 7 E2E test files across 6 browser projects |
| Accessibility | `npm run e2e:a11y` | All accessibility tests |
| Visual Regression | `npx playwright test --project=visual-regression` | All baseline comparisons |
| Migration Smoke | `npx playwright test --project=migration-smoke` | Component-specific smoke |

### 2.3 Coexistence Testing

During phases A through C, Bootstrap and PrimeNG styles coexist. This creates unique testing challenges.

#### 2.3.1 CSS Conflict Detection

```typescript
// e2e/migration-smoke/css-conflict.e2e.ts
test.describe('CSS Coexistence Checks', () => {
  test('no Bootstrap/PrimeNG class collisions on migrated components', async ({ page }) => {
    await setupAuthenticatedSession(page);
    await page.goto('/products');

    // Check that migrated PrimeNG components do not have Bootstrap grid classes
    const migratedElements = page.locator('[class*="p-"]');
    const count = await migratedElements.count();

    for (let i = 0; i < count; i++) {
      const el = migratedElements.nth(i);
      const classes = await el.getAttribute('class');
      // PrimeNG components should not also have Bootstrap utility classes
      // that could cause visual conflicts
      const hasConflict = classes?.match(/\bcol-(sm|md|lg|xl)-\d+\b/)
        && classes?.match(/\bp-col-\d+\b/);
      expect(hasConflict).toBeFalsy();
    }
  });

  test('Bootstrap components not yet migrated still render correctly', async ({ page }) => {
    await setupAuthenticatedSession(page);
    await page.goto('/products');

    // Verify non-migrated Bootstrap modals still function
    const createButton = page.getByRole('button', { name: /add|create|new/i });
    if (await createButton.isVisible()) {
      await createButton.click();
      const modal = page.locator('.modal, [role="dialog"]');
      await expect(modal).toBeVisible();
      await page.keyboard.press('Escape');
    }
  });

  test('no duplicate component rendering', async ({ page }) => {
    await setupAuthenticatedSession(page);
    await page.goto('/products');

    // Ensure that for each UI role, only one component system renders
    // For example, only one tooltip system, one dropdown system, etc.
    const bootstrapTooltips = await page.locator('.tooltip.bs-tooltip-auto').count();
    const primeTooltips = await page.locator('.p-tooltip').count();
    // Both should not be active on the same element
  });
});
```

#### 2.3.2 Bundle Size Monitoring During Coexistence

During coexistence, the bundle will be larger than either Bootstrap-only or PrimeNG-only. Track and set limits.

| Phase | Expected JS Budget | Expected CSS Budget | Total Budget |
|-------|-------------------|---------------------|--------------|
| Baseline (Bootstrap only) | Measure | Measure | Measure |
| Phase A (Both loaded) | Baseline + 200KB gzip | Baseline + 80KB gzip | Baseline + 280KB gzip |
| Phase B (Shared migrated) | Baseline + 180KB gzip | Baseline + 60KB gzip | Baseline + 240KB gzip |
| Phase C (Pages migrated) | Baseline + 120KB gzip | Baseline + 40KB gzip | Baseline + 160KB gzip |
| Phase D (Bootstrap removed) | Target | Target | Target (see Section 8) |

---

## 3. Unit Test Strategy (Vitest)

### 3.1 Current Unit Test State

Verified from the codebase, existing unit tests:

| Test File | Component/Service | Framework Patterns Used |
|-----------|-------------------|------------------------|
| `product.service.spec.ts` | ProductService | `TestBed`, `jasmine.createSpyObj`, signals |
| `persona-studio.service.spec.ts` | PersonaStudioService | TestBed DI |
| `bpmn.model.spec.ts` | BPMN models | Plain assertions |
| `bpmn-modeler.service.spec.ts` | BpmnModelerService | Service testing |
| `bpmn-element-registry.service.spec.ts` | BpmnElementRegistryService | Service testing |
| `bpmn-toolbar.component.spec.ts` | BpmnToolbarComponent | Component testing |
| `bpmn-canvas.component.spec.ts` | BpmnCanvasComponent | Component testing |
| `bpmn-extensions.model.spec.ts` | BPMN extension models | Model testing |
| `auth.guards.spec.ts` | Auth guards | Guard testing |
| `provider-admin.service.spec.ts` | ProviderAdminService | Service testing |
| `provider-embedded.component.spec.ts` | ProviderEmbeddedComponent | Component testing |
| `provider-form.component.spec.ts` | ProviderFormComponent | Component testing |
| `provider-list.component.spec.ts` | ProviderListComponent | Component testing |

**Current Setup File:** `frontend/src/test-setup.ts` - Initializes Angular TestBed with BrowserDynamicTestingModule, mocks localStorage/sessionStorage/crypto.

**Current Coverage Thresholds** (from `vitest.config.ts`):
- Statements: 80%
- Branches: 70%
- Functions: 80%
- Lines: 80%

### 3.2 How to Update Component Tests When Swapping ng-bootstrap to PrimeNG

#### 3.2.1 Before/After Pattern

When a component is migrated, its test file must be updated to reflect the new PrimeNG imports and DOM structure.

**Before (Bootstrap/ng-bootstrap):**

```typescript
import { NgbModal, NgbModule } from '@ng-bootstrap/ng-bootstrap';

describe('ProductListComponent', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ProductListComponent, NgbModule],
      providers: [
        { provide: NgbModal, useValue: mockNgbModal }
      ]
    });
  });

  it('should open modal when create button is clicked', () => {
    const modalSpy = vi.spyOn(mockNgbModal, 'open');
    component.openCreateDialog();
    expect(modalSpy).toHaveBeenCalled();
  });
});
```

**After (PrimeNG):**

```typescript
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { ConfirmationService } from 'primeng/api';

describe('ProductListComponent', () => {
  let dialogService: DialogService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ProductListComponent],
      providers: [
        { provide: DialogService, useValue: mockDialogService },
        { provide: ConfirmationService, useValue: mockConfirmationService }
      ]
    });
    dialogService = TestBed.inject(DialogService);
  });

  it('should open dialog when create button is clicked', () => {
    const dialogSpy = vi.spyOn(dialogService, 'open');
    component.openCreateDialog();
    expect(dialogSpy).toHaveBeenCalled();
  });
});
```

#### 3.2.2 Migration Checklist Per Component Test

For each component test file being updated:

```
[ ] Replace ng-bootstrap imports with PrimeNG equivalents
[ ] Update TestBed providers (NgbModal -> DialogService, etc.)
[ ] Update DOM queries to match PrimeNG selectors
[ ] Replace Bootstrap CSS class assertions with PrimeNG class assertions
[ ] Update event binding tests (ngbDropdownToggle -> pButton click, etc.)
[ ] Verify reactive forms still bind correctly to PrimeNG form components
[ ] Add PrimeNG-specific tests (see Section 3.3)
[ ] Verify all existing test cases still pass with updated assertions
[ ] No references to ng-bootstrap remain in the test file
```

### 3.3 Mocking PrimeNG Components in Tests

#### 3.3.1 Test Helper Module

Create a shared test helper that provides PrimeNG mock components for use in unit tests.

**File:** `frontend/src/testing/primeng-test-helpers.ts`

```typescript
import { Component, Input, Output, EventEmitter } from '@angular/core';

// Stub for p-table when the full DataTable is not needed
@Component({
  selector: 'p-table',
  template: '<ng-content></ng-content>',
  standalone: true,
})
export class MockTable {
  @Input() value: any[] = [];
  @Input() paginator = false;
  @Input() rows = 10;
  @Input() totalRecords = 0;
  @Input() lazy = false;
  @Output() onLazyLoad = new EventEmitter();
  @Output() onSort = new EventEmitter();
  @Output() selectionChange = new EventEmitter();
}

// Stub for p-dialog
@Component({
  selector: 'p-dialog',
  template: '<ng-content></ng-content>',
  standalone: true,
})
export class MockDialog {
  @Input() visible = false;
  @Input() header = '';
  @Input() modal = false;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() onHide = new EventEmitter();
}

// Stub for p-dropdown
@Component({
  selector: 'p-dropdown',
  template: '<select></select>',
  standalone: true,
})
export class MockDropdown {
  @Input() options: any[] = [];
  @Input() placeholder = '';
  @Input() optionLabel = '';
  @Output() onChange = new EventEmitter();
}

// Stub for p-confirmdialog
@Component({
  selector: 'p-confirmdialog',
  template: '',
  standalone: true,
})
export class MockConfirmDialog {}

// Stub for p-toast
@Component({
  selector: 'p-toast',
  template: '',
  standalone: true,
})
export class MockToast {}

// Stub for p-breadcrumb
@Component({
  selector: 'p-breadcrumb',
  template: '<nav><ng-content></ng-content></nav>',
  standalone: true,
})
export class MockBreadcrumb {
  @Input() model: any[] = [];
  @Input() home: any;
}

// Re-export all mocks for convenience
export const PRIMENG_TEST_DECLARATIONS = [
  MockTable,
  MockDialog,
  MockDropdown,
  MockConfirmDialog,
  MockToast,
  MockBreadcrumb,
];
```

#### 3.3.2 Service Mocking Patterns

```typescript
// Mock MessageService (PrimeNG toast notifications)
const mockMessageService = {
  add: vi.fn(),
  addAll: vi.fn(),
  clear: vi.fn(),
};

// Mock ConfirmationService (PrimeNG confirm dialogs)
const mockConfirmationService = {
  confirm: vi.fn(),
  close: vi.fn(),
};

// Mock DialogService (PrimeNG dynamic dialogs)
const mockDialogService = {
  open: vi.fn().mockReturnValue({
    onClose: new Subject(),
    close: vi.fn(),
  } as unknown as DynamicDialogRef),
};

// Mock TreeNode for p-tree
const mockTreeNodes: TreeNode[] = [
  {
    label: 'Node 1',
    data: { id: '1' },
    children: [
      { label: 'Child 1.1', data: { id: '1.1' } },
    ],
  },
];
```

### 3.4 Testing PrimeNG Reactive Forms Integration

PrimeNG form components integrate with Angular reactive forms via `ngModel` or `formControlName`. Unit tests must verify both binding directions.

#### 3.4.1 Form Control Binding Tests

```typescript
describe('PrimeNG Reactive Forms Integration', () => {
  let component: UserFormComponent;
  let fixture: ComponentFixture<UserFormComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        UserFormComponent,
        ReactiveFormsModule,
        // Import actual PrimeNG components for form integration tests
        // (not mocks) to verify real binding behavior
        InputTextModule,
        DropdownModule,
        CalendarModule,
        CheckboxModule,
      ],
    });

    fixture = TestBed.createComponent(UserFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should bind form control value to p-dropdown', () => {
    component.form.get('role')?.setValue('admin');
    fixture.detectChanges();

    const dropdown = fixture.debugElement.query(By.directive(Dropdown));
    expect(dropdown.componentInstance.value).toBe('admin');
  });

  it('should update form control when p-dropdown selection changes', () => {
    const dropdown = fixture.debugElement.query(By.directive(Dropdown));
    dropdown.componentInstance.onChange.emit({ value: 'viewer' });
    fixture.detectChanges();

    expect(component.form.get('role')?.value).toBe('viewer');
  });

  it('should show validation error on p-inputtext when form control is invalid', () => {
    const emailControl = component.form.get('email');
    emailControl?.setValue('');
    emailControl?.markAsTouched();
    fixture.detectChanges();

    const inputElement = fixture.debugElement.query(By.css('input[formControlName="email"]'));
    // PrimeNG adds ng-invalid and ng-dirty classes via Angular forms
    expect(inputElement.nativeElement.classList).toContain('ng-invalid');
  });

  it('should disable PrimeNG components when form control is disabled', () => {
    component.form.get('status')?.disable();
    fixture.detectChanges();

    const dropdown = fixture.debugElement.query(By.directive(Dropdown));
    expect(dropdown.componentInstance.disabled).toBeTruthy();
  });

  it('should handle PrimeNG calendar date binding with form control', () => {
    const testDate = new Date(2026, 0, 15);
    component.form.get('validUntil')?.setValue(testDate);
    fixture.detectChanges();

    const calendar = fixture.debugElement.query(By.directive(Calendar));
    expect(calendar.componentInstance.value).toEqual(testDate);
  });
});
```

#### 3.4.2 Form Validation Display Tests

```typescript
describe('PrimeNG Form Validation Display', () => {
  it('should display PrimeNG p-message for validation errors', () => {
    component.form.get('email')?.setValue('invalid');
    component.form.get('email')?.markAsTouched();
    fixture.detectChanges();

    const errorMessage = fixture.debugElement.query(By.css('small.p-error'));
    expect(errorMessage).toBeTruthy();
    expect(errorMessage.nativeElement.textContent).toContain('valid email');
  });

  it('should apply p-invalid class to invalid form fields', () => {
    component.form.get('name')?.setValue('');
    component.form.get('name')?.markAsTouched();
    fixture.detectChanges();

    const input = fixture.debugElement.query(By.css('[formControlName="name"]'));
    expect(input.classes['p-invalid']).toBeTruthy();
  });
});
```

### 3.5 Coverage Targets Per Phase

| Phase | Statement Coverage | Branch Coverage | Function Coverage | Line Coverage | Notes |
|-------|-------------------|-----------------|-------------------|---------------|-------|
| Baseline (pre-migration) | >= 80% | >= 70% | >= 80% | >= 80% | Measure and record |
| Phase A (coexistence) | >= 80% | >= 70% | >= 80% | >= 80% | No coverage drop |
| Phase B (shared) | >= 80% | >= 70% | >= 80% | >= 80% | New PrimeNG wrapper tests |
| Phase C (pages) | >= 82% | >= 72% | >= 82% | >= 82% | Increase from new tests |
| Phase D (cleanup) | >= 85% | >= 75% | >= 85% | >= 85% | Final target |
| Phase E (PWA) | >= 85% | >= 75% | >= 85% | >= 85% | Includes service worker tests |

### 3.6 Unit Test Naming Convention

Per QA principles, follow the pattern: `{methodName}_{scenario}_{expectedBehavior}`

```typescript
// Correct:
it('onSort_whenColumnHeaderClicked_shouldEmitSortEvent', () => { ... });
it('filterUsers_withEmptySearchQuery_shouldReturnAllUsers', () => { ... });
it('openDialog_whenCreateButtonClicked_shouldShowCreateForm', () => { ... });

// Incorrect:
it('should sort', () => { ... });
it('test filter', () => { ... });
```

---

## 4. E2E Test Strategy (Playwright)

### 4.1 Current E2E Test Coverage

Verified from `frontend/e2e/`:

| File | Test Count | Coverage Area |
|------|------------|---------------|
| `auth.e2e.ts` | 12 tests | Login, MFA, password reset, logout, protected routes, error pages |
| `products.e2e.ts` | Exists | Product CRUD flows |
| `bpmn.e2e.ts` | Exists | BPMN modeler interactions |
| `identity-providers.e2e.ts` | Exists | Identity provider management |
| `responsive.e2e.ts` | 3 tests | Mobile/tablet/desktop viewport layout |
| `accessibility.a11y.ts` | 11 tests | WCAG 2.1 AA compliance |
| `debug-api.e2e.ts` | Exists | API debugging |

### 4.2 Critical User Flows to Test After Migration

#### 4.2.1 Login/Auth Flow

These tests already exist in `frontend/e2e/auth.e2e.ts`. After PrimeNG migration, the following must still pass with updated selectors.

| TC-ID | Test Case | Priority | PrimeNG Impact |
|-------|-----------|----------|----------------|
| AUTH-001 | Display sign-in options and email login form | HIGH | Button selectors may change to `p-button` |
| AUTH-002 | Show validation errors for empty fields | HIGH | Error messages may use `p-message` |
| AUTH-003 | Show validation error for invalid email | HIGH | Input validation styling changes |
| AUTH-004 | Toggle password visibility | HIGH | Input addon pattern changes to `p-password` |
| AUTH-005 | Navigate to forgot password | MEDIUM | Link element unchanged |
| AUTH-006 | Redirect to products after successful login | HIGH | Route unchanged, button selector may change |
| AUTH-007 | Protected route redirects to login | HIGH | No PrimeNG impact |
| AUTH-008 | MFA verification page display | HIGH | Code input may use `p-inputotp` |
| AUTH-009 | Logout and redirect | MEDIUM | No PrimeNG impact |
| AUTH-010 | Password reset form and submission | MEDIUM | Form inputs change to PrimeNG |

**Selector Migration Guide for Auth Tests:**

| Current Selector | PrimeNG Equivalent |
|------------------|--------------------|
| `button.submit-btn[type="submit"]` | `p-button[type="submit"], button.p-button` |
| `.toggle-password` | `p-password .p-password-toggle-icon` |
| `input[name="code"]` | `p-inputotp input, p-inputtext[name="code"]` |
| `.modal, [role="dialog"]` | `p-dialog [role="dialog"], .p-dialog` |

#### 4.2.2 Data Table Interactions

The data table is a critical migration target. PrimeNG `p-table` replaces custom Bootstrap tables.

| TC-ID | Test Case | Priority | Expected Behavior |
|-------|-----------|----------|-------------------|
| TABLE-001 | Sort by column header click | HIGH | Column sorted ascending, indicator shown |
| TABLE-002 | Reverse sort on second click | HIGH | Column sorted descending |
| TABLE-003 | Filter by text input | HIGH | Rows filtered, count updated |
| TABLE-004 | Filter by dropdown selection | HIGH | Rows filtered by selected value |
| TABLE-005 | Paginate to next page | HIGH | Next page rows displayed, page indicator updated |
| TABLE-006 | Change page size | MEDIUM | Table refreshes with new row count |
| TABLE-007 | Export to CSV | MEDIUM | File downloaded with correct data |
| TABLE-008 | Export to Excel | MEDIUM | File downloaded with correct format |
| TABLE-009 | Row selection (single) | HIGH | Row highlighted, detail panel updates |
| TABLE-010 | Row selection (multi) | MEDIUM | Multiple rows highlighted, bulk actions enabled |
| TABLE-011 | Column reordering | LOW | Columns rearranged via drag |
| TABLE-012 | Column visibility toggle | LOW | Columns hidden/shown |
| TABLE-013 | Empty state display | HIGH | Empty message when no data |
| TABLE-014 | Loading state display | MEDIUM | Skeleton/spinner during data fetch |

**PrimeNG Table Test Example:**

```typescript
// e2e/data-table.e2e.ts
test.describe('PrimeNG DataTable', () => {
  test('TABLE-001: sort by column header click', async ({ page }) => {
    await setupAuthenticatedSession(page);
    await mockUsersApiResponse(page);
    await page.goto('/admin/users');

    // Click sortable column header
    const nameHeader = page.locator('th[psortablecolumn="name"]');
    await nameHeader.click();

    // Verify sort indicator
    const sortIcon = nameHeader.locator('.p-sortable-column-icon');
    await expect(sortIcon).toBeVisible();

    // Verify first row is alphabetically first
    const firstRow = page.locator('.p-datatable-tbody tr').first();
    await expect(firstRow.locator('td').first()).toContainText('Alice');
  });

  test('TABLE-005: paginate to next page', async ({ page }) => {
    await setupAuthenticatedSession(page);
    await mockUsersApiResponse(page, { totalRecords: 50 });
    await page.goto('/admin/users');

    // Click next page button
    const nextButton = page.locator('.p-paginator-next');
    await nextButton.click();

    // Verify page indicator updated
    const currentPage = page.locator('.p-paginator-page.p-highlight');
    await expect(currentPage).toContainText('2');
  });

  test('TABLE-007: export to CSV', async ({ page }) => {
    await setupAuthenticatedSession(page);
    await mockUsersApiResponse(page);
    await page.goto('/admin/users');

    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.getByRole('button', { name: /export/i }).click(),
      page.getByRole('menuitem', { name: /csv/i }).click(),
    ]);

    expect(download.suggestedFilename()).toContain('.csv');
  });
});
```

#### 4.2.3 Modal Dialogs

| TC-ID | Test Case | Priority |
|-------|-----------|----------|
| MODAL-001 | Open create dialog | HIGH |
| MODAL-002 | Close dialog with X button | HIGH |
| MODAL-003 | Close dialog with Escape key | HIGH |
| MODAL-004 | Submit form in dialog | HIGH |
| MODAL-005 | Validation errors in dialog | HIGH |
| MODAL-006 | Confirmation dialog accept | HIGH |
| MODAL-007 | Confirmation dialog reject | HIGH |
| MODAL-008 | Dialog backdrop click (dismiss if configured) | MEDIUM |
| MODAL-009 | Nested dialog z-index stacking | LOW |
| MODAL-010 | Focus trap within dialog | HIGH |

#### 4.2.4 Form Submissions

| TC-ID | Test Case | Priority |
|-------|-----------|----------|
| FORM-001 | Submit valid form | HIGH |
| FORM-002 | Display required field validation | HIGH |
| FORM-003 | Display email format validation | HIGH |
| FORM-004 | Display min/max length validation | MEDIUM |
| FORM-005 | Display pattern validation | MEDIUM |
| FORM-006 | Dropdown selection persistence | HIGH |
| FORM-007 | Calendar date picker selection | MEDIUM |
| FORM-008 | Checkbox/toggle binding | MEDIUM |
| FORM-009 | Multi-select tag input | MEDIUM |
| FORM-010 | Form reset/clear | MEDIUM |

#### 4.2.5 RTL Layout Validation

| TC-ID | Test Case | Priority |
|-------|-----------|----------|
| RTL-001 | Page layout mirrors for RTL locale | HIGH |
| RTL-002 | Navigation sidebar on right side | HIGH |
| RTL-003 | Text alignment right-to-left | HIGH |
| RTL-004 | PrimeNG DataTable columns RTL order | HIGH |
| RTL-005 | Form labels and inputs RTL alignment | HIGH |
| RTL-006 | Breadcrumb separator direction | MEDIUM |
| RTL-007 | Icons mirror appropriately | MEDIUM |
| RTL-008 | Dialog close button position (left side for RTL) | MEDIUM |
| RTL-009 | Pagination direction reversed | MEDIUM |
| RTL-010 | Charts and visualizations RTL support | LOW |

**RTL Test Example:**

```typescript
// e2e/rtl.e2e.ts
test.describe('RTL Layout Validation', () => {
  test.beforeEach(async ({ page }) => {
    await mockTenantResolution(page);
    // Set Arabic locale/RTL direction
    await page.addInitScript(() => {
      document.documentElement.setAttribute('dir', 'rtl');
      document.documentElement.setAttribute('lang', 'ar');
    });
  });

  test('RTL-001: page layout mirrors for RTL locale', async ({ page }) => {
    await setupAuthenticatedSession(page);
    await page.goto('/products');

    const direction = await page.evaluate(() =>
      getComputedStyle(document.documentElement).direction
    );
    expect(direction).toBe('rtl');

    // Verify sidebar is on the right
    const sidebar = page.locator('.docker-container, aside');
    if (await sidebar.isVisible()) {
      const box = await sidebar.boundingBox();
      const viewportWidth = page.viewportSize()?.width ?? 1280;
      // In RTL, sidebar should be on the right side
      expect((box?.x ?? 0) + (box?.width ?? 0)).toBeGreaterThan(viewportWidth * 0.7);
    }
  });

  test('RTL-002: PrimeNG DataTable columns RTL order', async ({ page }) => {
    await setupAuthenticatedSession(page);
    await page.goto('/admin/users');

    // Last defined column should appear leftmost in RTL
    const headers = page.locator('.p-datatable-thead th');
    const firstHeaderBox = await headers.first().boundingBox();
    const lastHeaderBox = await headers.last().boundingBox();

    // In RTL, the "first" column in DOM should be on the right
    expect((firstHeaderBox?.x ?? 0)).toBeGreaterThan((lastHeaderBox?.x ?? 0));
  });
});
```

#### 4.2.6 Responsive Breakpoint Testing

Extend the existing `frontend/e2e/responsive.e2e.ts` tests:

| TC-ID | Viewport | Test Case | Priority |
|-------|----------|-----------|----------|
| RESP-001 | 320x640 | Login form usable (already exists) | HIGH |
| RESP-002 | 375x812 | Email/password form usable (already exists) | HIGH |
| RESP-003 | 768x1024, 1440x900 | Layout integrity (already exists) | HIGH |
| RESP-004 | 320x640 | PrimeNG DataTable stacks to card layout | HIGH |
| RESP-005 | 375x812 | Navigation menu collapses to hamburger | HIGH |
| RESP-006 | 768x1024 | Sidebar collapsed to icons | MEDIUM |
| RESP-007 | 1920x1080 | Full layout with expanded sidebar | MEDIUM |
| RESP-008 | 320x640 | Dialog/modal fits within viewport | HIGH |
| RESP-009 | 375x812 | Form inputs full width on mobile | HIGH |
| RESP-010 | 768x1024 | Tab navigation wraps properly | MEDIUM |

---

## 5. Accessibility Test Strategy

### 5.1 Current Accessibility Test Coverage

Verified from `frontend/e2e/accessibility.a11y.ts`:

| Test Group | Tests | WCAG Level |
|------------|-------|------------|
| Login Page A11y | 4 tests | WCAG 2.1 AA |
| Products Page A11y | 4 tests | WCAG 2.1 AA |
| Color Contrast | 2 tests | WCAG 2.1 AA |
| Keyboard Navigation | 2 tests | WCAG 2.1 AA |
| Screen Reader Compatibility | 1 test | Basic |
| Reduced Motion | 1 test | WCAG 2.1 AA |

### 5.2 axe-core Automated Scans Per Page

After migration, run axe-core scans on every page. The current tests only cover login and products.

**Pages Requiring axe-core Coverage:**

| Page | Route | Priority | Notes |
|------|-------|----------|-------|
| Login | `/login` | HIGH | Already covered |
| Products | `/products` | HIGH | Already covered |
| Personas | `/personas` | HIGH | Must add |
| BPMN Modeler | `/process-modeler` | MEDIUM | Canvas excluded from axe |
| Administration | `/administration` | HIGH | Must add |
| Identity Providers | `/admin/identity-providers` | HIGH | Must add |
| User Management (new) | `/admin/users` | HIGH | Must add |
| User Detail (new) | `/admin/users/:id` | HIGH | Must add |
| License Dashboard (new) | `/admin/licenses` | HIGH | Must add |
| Audit Log Viewer (new) | `/admin/audit` | HIGH | Must add |
| Profile | `/profile` | MEDIUM | Must add |
| Sessions | `/profile/sessions` | MEDIUM | Must add |
| Devices | `/profile/devices` | MEDIUM | Must add |
| Settings | `/admin/settings` | MEDIUM | Must add |
| Error Pages | `/errors/*` | MEDIUM | Must add |

**Expanded axe-core Test Template:**

```typescript
// e2e/accessibility-comprehensive.a11y.ts
import { test, expect, Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const PAGES_TO_SCAN = [
  { name: 'Login', route: '/login', requiresAuth: false },
  { name: 'Products', route: '/products', requiresAuth: true },
  { name: 'Personas', route: '/personas', requiresAuth: true },
  { name: 'Administration', route: '/administration', requiresAuth: true },
  { name: 'Identity Providers', route: '/admin/identity-providers', requiresAuth: true },
  // Add new pages as they are built
];

for (const pageConfig of PAGES_TO_SCAN) {
  test.describe(`Accessibility: ${pageConfig.name}`, () => {
    test(`should have no WCAG 2.1 AA violations`, async ({ page }) => {
      if (pageConfig.requiresAuth) await setupAuth(page);
      await page.goto(pageConfig.route);

      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .exclude('.bpmn-canvas')
        .analyze();

      expect(results.violations).toEqual([]);
    });
  });
}
```

### 5.3 WCAG AAA Specific Checks

The project targets WCAG AAA. These require additional checks beyond the current AA scans.

#### 5.3.1 Contrast Ratio (7:1 for Normal Text, 4.5:1 for Large Text)

| Check ID | Description | Target Ratio | Measurement Method |
|----------|-------------|--------------|-------------------|
| AAA-CONTRAST-001 | Body text against background | 7:1 | axe-core `color-contrast-enhanced` |
| AAA-CONTRAST-002 | Form labels against background | 7:1 | axe-core + manual |
| AAA-CONTRAST-003 | Placeholder text against background | 4.5:1 | Manual calculation |
| AAA-CONTRAST-004 | Error message text | 7:1 | axe-core |
| AAA-CONTRAST-005 | Link text (default and visited) | 7:1 | axe-core |
| AAA-CONTRAST-006 | Button text against button background | 4.5:1 | axe-core |
| AAA-CONTRAST-007 | PrimeNG chip/tag text | 4.5:1 | Manual calculation |
| AAA-CONTRAST-008 | DataTable header text | 7:1 | axe-core |
| AAA-CONTRAST-009 | DataTable cell text | 7:1 | axe-core |
| AAA-CONTRAST-010 | Disabled state text | No requirement (decorative) | Verify not interactive |

**axe-core AAA Contrast Configuration:**

```typescript
test('should meet WCAG AAA contrast requirements', async ({ page }) => {
  await page.goto('/products');

  const results = await new AxeBuilder({ page })
    .withTags(['wcag2aaa'])
    .options({
      rules: {
        'color-contrast-enhanced': { enabled: true },
      },
    })
    .analyze();

  const contrastViolations = results.violations.filter(
    v => v.id === 'color-contrast-enhanced'
  );
  expect(contrastViolations).toEqual([]);
});
```

#### 5.3.2 Focus Management

| Check ID | Description | Test Method |
|----------|-------------|-------------|
| FOCUS-001 | Focus visible on all interactive elements | Tab through page, verify outline |
| FOCUS-002 | Focus trapped in open dialogs | Tab within dialog, verify no escape |
| FOCUS-003 | Focus returns to trigger after dialog close | Close dialog, verify focus target |
| FOCUS-004 | Focus moves to new content on page navigation | Navigate route, verify focus |
| FOCUS-005 | Skip navigation link present | Tab once from page load, verify skip link |
| FOCUS-006 | Focus order matches visual order | Tab sequence matches DOM/visual order |
| FOCUS-007 | No keyboard trap (except dialogs) | Tab through entire page without getting stuck |

```typescript
test.describe('Focus Management', () => {
  test('FOCUS-002: focus trapped in PrimeNG dialog', async ({ page }) => {
    await setupAuthenticatedSession(page);
    await page.goto('/products');

    // Open a dialog
    await page.getByRole('button', { name: /add|create|new/i }).click();
    const dialog = page.locator('.p-dialog');
    await expect(dialog).toBeVisible();

    // Tab through all focusable elements in dialog
    const focusableElements = dialog.locator(
      'button, input, select, textarea, a[href], [tabindex]:not([tabindex="-1"])'
    );
    const count = await focusableElements.count();

    // Tab count + 1 times (should cycle back to first element)
    for (let i = 0; i <= count; i++) {
      await page.keyboard.press('Tab');
    }

    // Active element should still be within the dialog
    const activeInDialog = await page.evaluate(() => {
      const dialog = document.querySelector('.p-dialog');
      return dialog?.contains(document.activeElement);
    });
    expect(activeInDialog).toBeTruthy();
  });

  test('FOCUS-003: focus returns to trigger after dialog close', async ({ page }) => {
    await setupAuthenticatedSession(page);
    await page.goto('/products');

    const triggerButton = page.getByRole('button', { name: /add|create|new/i });
    await triggerButton.click();

    const dialog = page.locator('.p-dialog');
    await expect(dialog).toBeVisible();

    // Close dialog
    await page.keyboard.press('Escape');
    await expect(dialog).not.toBeVisible();

    // Verify focus returned to the trigger button
    const focusedElement = await page.evaluate(() => document.activeElement?.textContent?.trim());
    const triggerText = await triggerButton.textContent();
    expect(focusedElement).toContain(triggerText?.trim());
  });
});
```

### 5.4 Screen Reader Testing

#### 5.4.1 Automated Screen Reader Checks

| Check ID | Description | Tool | Automated |
|----------|-------------|------|-----------|
| SR-001 | All images have alt text or role="presentation" | axe-core | Yes |
| SR-002 | Form inputs have associated labels | axe-core | Yes |
| SR-003 | Headings follow logical hierarchy | axe-core | Yes |
| SR-004 | ARIA landmarks present (main, nav, banner) | axe-core | Yes |
| SR-005 | Live regions for dynamic content updates | Manual | No |
| SR-006 | Table headers associated with cells | axe-core | Yes |
| SR-007 | PrimeNG DataTable has accessible name | Playwright | Yes |
| SR-008 | PrimeNG Dialog announced as dialog | Playwright | Yes |
| SR-009 | Toast notifications announced via aria-live | Playwright | Yes |

#### 5.4.2 Manual Screen Reader Testing Matrix

| Browser/Reader | OS | Pages to Test | Frequency |
|---------------|-----|---------------|-----------|
| VoiceOver + Safari | macOS | Login, Products, User Management | Per phase |
| VoiceOver + Safari | iOS | Login, Products (mobile layout) | Per phase |
| TalkBack + Chrome | Android | Login, Products (mobile layout) | Per phase |
| NVDA + Firefox | Windows | Login, Products, User Management | Phase D only |
| JAWS + Chrome | Windows | Login, Products, User Management | Phase D only |

**Manual Test Script (VoiceOver):**

```
1. Open Safari, navigate to application URL
2. Activate VoiceOver (Cmd+F5)
3. Navigate through page using VO+Right Arrow
4. Verify all interactive elements are announced
5. Verify form labels are read with inputs
6. Open dialog, verify "dialog" role announced
7. Verify DataTable column headers read with cell content
8. Verify toast notifications announced automatically
9. Verify error messages announced when form validation fails
10. Close dialog, verify focus announcement on return
```

### 5.5 Keyboard Navigation Testing Matrix

| Component | Tab | Shift+Tab | Enter | Space | Escape | Arrow Keys | Home/End |
|-----------|-----|-----------|-------|-------|--------|------------|----------|
| p-button | Focus | Reverse focus | Activate | Activate | - | - | - |
| p-inputtext | Focus | Reverse focus | - | - | - | Cursor move | Start/end |
| p-dropdown | Focus | Reverse focus | Open/select | Open | Close | Navigate options | First/last |
| p-table header | Focus | Reverse focus | Sort | Sort | - | Next/prev header | - |
| p-table row | Focus | Reverse focus | Select/expand | Select | - | Next/prev row | First/last row |
| p-dialog | Focus first element | Cycle (trap) | - | - | Close | - | - |
| p-menu | Focus | Reverse focus | Select | Select | Close | Navigate items | First/last |
| p-calendar | Focus | Reverse focus | Open/select | Open | Close | Navigate dates | - |
| p-checkbox | Focus | Reverse focus | Toggle | Toggle | - | - | - |
| p-breadcrumb | Focus item | Reverse focus | Navigate | Navigate | - | Prev/next item | - |
| p-paginator | Focus | Reverse focus | Navigate | Navigate | - | Prev/next page | First/last |
| p-toast | Not focusable (aria-live) | - | - | - | - | - | - |
| p-confirmdialog | Focus first button | Cycle (trap) | Confirm | Confirm | Reject | Between buttons | - |

### 5.6 Arabic RTL Accessibility

| Check ID | Description | Priority |
|----------|-------------|----------|
| RTL-A11Y-001 | Screen reader announces text in correct reading order (right-to-left) | HIGH |
| RTL-A11Y-002 | Keyboard Tab order follows RTL visual flow | HIGH |
| RTL-A11Y-003 | PrimeNG Breadcrumb reads right-to-left | MEDIUM |
| RTL-A11Y-004 | PrimeNG DataTable pagination announced correctly in RTL | MEDIUM |
| RTL-A11Y-005 | Form validation errors associated with correct field in RTL | HIGH |
| RTL-A11Y-006 | Calendar/date picker opens on correct side | MEDIUM |
| RTL-A11Y-007 | Dialog close button announced and reachable | HIGH |

---

## 6. PWA Test Strategy

### 6.1 Service Worker Installation Verification

| TC-ID | Test Case | Priority | Expected Result |
|-------|-----------|----------|-----------------|
| PWA-SW-001 | Service worker registers on first visit | HIGH | `navigator.serviceWorker.controller` is not null after registration |
| PWA-SW-002 | Service worker activates after registration | HIGH | SW state transitions to "activated" |
| PWA-SW-003 | Service worker serves cached shell on reload | HIGH | App shell loads from cache (verified via `performance.getEntriesByType`) |
| PWA-SW-004 | Service worker updates when new version deployed | HIGH | New SW enters "waiting" state, activates after skip-waiting or page refresh |
| PWA-SW-005 | Service worker handles fetch events | HIGH | API requests intercepted, cached responses served when offline |
| PWA-SW-006 | Multiple tabs share same service worker | MEDIUM | `clients.matchAll()` returns all tabs |

**Playwright Service Worker Test Example:**

```typescript
// e2e/pwa/service-worker.e2e.ts
test.describe('PWA: Service Worker', () => {
  test('PWA-SW-001: service worker registers on first visit', async ({ page }) => {
    await page.goto('/login');

    // Wait for service worker registration
    const swRegistered = await page.evaluate(async () => {
      if (!('serviceWorker' in navigator)) return false;
      const registration = await navigator.serviceWorker.ready;
      return !!registration.active;
    });

    expect(swRegistered).toBeTruthy();
  });

  test('PWA-SW-003: app shell served from cache on reload', async ({ page }) => {
    await page.goto('/login');

    // Wait for SW to cache app shell
    await page.waitForTimeout(2000);

    // Reload and check if resources served from SW cache
    await page.reload();

    const swControlled = await page.evaluate(() => {
      return !!navigator.serviceWorker.controller;
    });
    expect(swControlled).toBeTruthy();

    // Verify main bundle served from cache
    const performanceEntries = await page.evaluate(() => {
      return performance.getEntriesByType('resource')
        .filter((e: any) => e.name.includes('main') || e.name.includes('index'))
        .map((e: any) => ({
          name: e.name,
          transferSize: e.transferSize,
          fetchStart: e.fetchStart,
          responseEnd: e.responseEnd,
        }));
    });

    // Cached resources have transferSize of 0
    const cachedEntries = performanceEntries.filter((e: any) => e.transferSize === 0);
    expect(cachedEntries.length).toBeGreaterThan(0);
  });
});
```

### 6.2 Offline Capability Testing

| TC-ID | Test Case | Priority | Expected Result |
|-------|-----------|----------|-----------------|
| PWA-OFF-001 | App shell loads when network is offline | HIGH | Login page renders with offline indicator |
| PWA-OFF-002 | Cached API data displayed when offline | HIGH | Previously loaded data visible |
| PWA-OFF-003 | Offline indicator shown to user | HIGH | Banner/toast indicates offline state |
| PWA-OFF-004 | Form submissions queued when offline | MEDIUM | Submissions stored and replayed when online |
| PWA-OFF-005 | Network recovery triggers data sync | MEDIUM | Queued actions executed on reconnect |
| PWA-OFF-006 | Navigation between cached pages works offline | HIGH | Cached routes accessible |
| PWA-OFF-007 | Uncached route shows appropriate offline message | MEDIUM | Friendly error, not browser default |

**Offline Test Example:**

```typescript
test.describe('PWA: Offline Capability', () => {
  test('PWA-OFF-001: app shell loads when offline', async ({ page, context }) => {
    // First visit while online to cache app shell
    await page.goto('/login');
    await page.waitForTimeout(3000); // Wait for SW caching

    // Go offline
    await context.setOffline(true);

    // Reload - should load from cache
    await page.reload();

    // App shell should render
    await expect(page.locator('app-root')).toBeVisible();
    // Login page content should be visible from cache
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();
  });

  test('PWA-OFF-003: offline indicator displayed', async ({ page, context }) => {
    await page.goto('/login');
    await page.waitForTimeout(3000);

    await context.setOffline(true);
    await page.reload();

    // Look for offline indicator
    const offlineIndicator = page.locator(
      '[data-testid="offline-indicator"], .offline-banner, [aria-label*="offline"]'
    );
    await expect(offlineIndicator).toBeVisible();
  });

  test('PWA-OFF-005: network recovery triggers sync', async ({ page, context }) => {
    await setupAuthenticatedSession(page);
    await page.goto('/products');
    await page.waitForTimeout(3000);

    // Go offline
    await context.setOffline(true);

    // Attempt an action that would normally call API
    // (Action should be queued)

    // Come back online
    await context.setOffline(false);

    // Verify sync occurred (API call made)
    // This depends on implementation specifics
  });
});
```

### 6.3 Cache Invalidation Testing

| TC-ID | Test Case | Priority | Expected Result |
|-------|-----------|----------|-----------------|
| PWA-CACHE-001 | New app version replaces cached assets | HIGH | Updated assets served after SW update |
| PWA-CACHE-002 | Stale API data refreshed when online | HIGH | Background fetch updates stale data |
| PWA-CACHE-003 | Cache storage size within limits | MEDIUM | Total cache under 50MB |
| PWA-CACHE-004 | Old cache versions cleaned up | MEDIUM | Previous versioned caches deleted |
| PWA-CACHE-005 | Cache headers respected for API responses | MEDIUM | Cache-Control directives followed |

### 6.4 Push Notification Testing (Android)

| TC-ID | Test Case | Priority | Expected Result |
|-------|-----------|----------|-----------------|
| PWA-PUSH-001 | Permission prompt shown on first interaction | MEDIUM | Browser notification permission dialog |
| PWA-PUSH-002 | Push subscription created after permission granted | MEDIUM | PushSubscription object stored |
| PWA-PUSH-003 | Push notification displayed when received | MEDIUM | System notification shown |
| PWA-PUSH-004 | Notification click opens correct page | MEDIUM | App navigates to payload URL |
| PWA-PUSH-005 | Permission denied handled gracefully | MEDIUM | Fallback in-app notification used |

**Note:** Push notification testing requires running on actual Android devices or emulators. Playwright cannot fully simulate push notifications. Use the following approach:

```typescript
// For permission testing only (not actual push delivery)
test('PWA-PUSH-001: notification permission prompt', async ({ page, context }) => {
  // Grant notification permission via context
  await context.grantPermissions(['notifications']);

  await page.goto('/products');

  const permissionState = await page.evaluate(async () => {
    return Notification.permission;
  });

  expect(permissionState).toBe('granted');
});
```

### 6.5 Installability (Add to Home Screen) Testing

| TC-ID | Test Case | Priority | Expected Result |
|-------|-----------|----------|-----------------|
| PWA-INSTALL-001 | Web app manifest is valid | HIGH | `manifest.webmanifest` parses without errors |
| PWA-INSTALL-002 | Manifest has required fields | HIGH | name, short_name, icons, start_url, display |
| PWA-INSTALL-003 | Icons at required sizes | HIGH | 192x192 and 512x512 icons present |
| PWA-INSTALL-004 | `beforeinstallprompt` event fires | HIGH | Install prompt available |
| PWA-INSTALL-005 | Custom install banner displayed | MEDIUM | In-app install prompt shown |
| PWA-INSTALL-006 | App launches in standalone mode after install | MEDIUM | `display-mode: standalone` media query matches |

**Manifest Validation Test:**

```typescript
test.describe('PWA: Installability', () => {
  test('PWA-INSTALL-001: manifest is valid', async ({ page }) => {
    const manifestResponse = await page.goto('/manifest.webmanifest');
    expect(manifestResponse?.status()).toBe(200);

    const manifest = await manifestResponse?.json();
    expect(manifest).toBeTruthy();
  });

  test('PWA-INSTALL-002: manifest has required fields', async ({ page }) => {
    const manifestResponse = await page.goto('/manifest.webmanifest');
    const manifest = await manifestResponse?.json();

    expect(manifest.name).toBeTruthy();
    expect(manifest.short_name).toBeTruthy();
    expect(manifest.start_url).toBeTruthy();
    expect(manifest.display).toBe('standalone');
    expect(manifest.icons).toBeDefined();
    expect(manifest.icons.length).toBeGreaterThanOrEqual(2);
  });

  test('PWA-INSTALL-003: icons at required sizes', async ({ page }) => {
    const manifestResponse = await page.goto('/manifest.webmanifest');
    const manifest = await manifestResponse?.json();

    const sizes = manifest.icons.map((icon: any) => icon.sizes);
    expect(sizes).toContain('192x192');
    expect(sizes).toContain('512x512');
  });
});
```

### 6.6 Lighthouse PWA Audit Targets

| Metric | Target | Category |
|--------|--------|----------|
| PWA Score | >= 90 | Lighthouse PWA |
| Installable | Yes | Lighthouse PWA |
| Service Worker | Registered | Lighthouse PWA |
| Offline Capable | Yes | Lighthouse PWA |
| HTTPS | Yes (or localhost) | Lighthouse PWA |
| Manifest Valid | Yes | Lighthouse PWA |
| Splash Screen | Configured | Lighthouse PWA |
| Theme Color | Defined | Lighthouse PWA |
| Viewport Meta | Correct | Lighthouse PWA |
| Apple Touch Icon | Present | Lighthouse PWA |

**Lighthouse CI Configuration:**

```json
{
  "ci": {
    "collect": {
      "url": ["http://localhost:4200/login"],
      "numberOfRuns": 3
    },
    "assert": {
      "assertions": {
        "categories:pwa": ["error", { "minScore": 0.9 }],
        "installable-manifest": "error",
        "service-worker": "error",
        "works-offline": "error"
      }
    }
  }
}
```

---

## 7. Responsive and Foldable Device Test Strategy

### 7.1 Playwright Viewport Emulation

#### 7.1.1 Device Viewport Matrix

| Device Category | Device Name | Width | Height | DPR | Project Name |
|-----------------|-------------|-------|--------|-----|--------------|
| Mobile Small | Galaxy S8 | 360 | 740 | 3 | mobile-small |
| Mobile Standard | iPhone 12 | 390 | 844 | 3 | Already configured |
| Mobile Large | iPhone 14 Pro Max | 430 | 932 | 3 | mobile-large |
| Tablet Portrait | iPad | 768 | 1024 | 2 | tablet-portrait |
| Tablet Landscape | iPad Landscape | 1024 | 768 | 2 | tablet-landscape |
| Desktop Small | Laptop | 1280 | 720 | 1 | Already configured |
| Desktop Standard | Full HD | 1920 | 1080 | 1 | desktop-standard |
| Desktop Large | 2K | 2560 | 1440 | 1 | desktop-large |
| Foldable Folded | Galaxy Fold (outer) | 280 | 653 | 3 | fold-outer |
| Foldable Unfolded | Galaxy Fold (inner) | 717 | 512 | 3 | fold-inner |

**Playwright Config Addition:**

```typescript
// Additional projects for responsive testing
{
  name: 'mobile-small',
  testMatch: '**/*.responsive.ts',
  use: {
    viewport: { width: 360, height: 740 },
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
  },
},
{
  name: 'fold-outer',
  testMatch: '**/*.responsive.ts',
  use: {
    viewport: { width: 280, height: 653 },
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
  },
},
{
  name: 'fold-inner',
  testMatch: '**/*.responsive.ts',
  use: {
    viewport: { width: 717, height: 512 },
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
  },
},
{
  name: 'tablet-landscape',
  testMatch: '**/*.responsive.ts',
  use: {
    viewport: { width: 1024, height: 768 },
    deviceScaleFactor: 2,
    isMobile: false,
    hasTouch: true,
  },
},
```

### 7.2 Foldable Device Testing (Samsung Galaxy Fold)

#### 7.2.1 Viewport Segments API

The Viewport Segments API (`window.visualViewport.segments`) allows detection of foldable display regions. PrimeNG components need to adapt to dual-screen layouts.

| TC-ID | Test Case | Viewport | Priority |
|-------|-----------|----------|----------|
| FOLD-001 | App renders on outer display (280px) | 280x653 | HIGH |
| FOLD-002 | App renders on inner display (717px) | 717x512 | HIGH |
| FOLD-003 | No horizontal overflow on outer display | 280x653 | HIGH |
| FOLD-004 | DataTable switches to stacked mode on outer display | 280x653 | HIGH |
| FOLD-005 | Dialog fits within outer display | 280x653 | HIGH |
| FOLD-006 | Navigation usable on outer display | 280x653 | HIGH |
| FOLD-007 | Content reflows when unfolding (viewport change) | 280->717 | MEDIUM |
| FOLD-008 | Sidebar and content split across fold segments | 717x512 (split) | LOW |
| FOLD-009 | Font sizes readable on outer display | 280x653 | HIGH |
| FOLD-010 | Touch targets at least 44x44 CSS pixels | Both | HIGH |

**Foldable Test Example:**

```typescript
// e2e/foldable.responsive.ts
test.describe('Foldable Device Support', () => {
  test('FOLD-001: renders on Galaxy Fold outer display', async ({ page }) => {
    await page.setViewportSize({ width: 280, height: 653 });
    await mockTenantResolution(page);
    await page.goto('/login');

    // Login should be usable
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();

    // No horizontal overflow
    const hasOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > window.innerWidth + 1;
    });
    expect(hasOverflow).toBeFalsy();
  });

  test('FOLD-004: DataTable stacks on narrow display', async ({ page }) => {
    await page.setViewportSize({ width: 280, height: 653 });
    await setupAuthenticatedSession(page);
    await page.goto('/admin/users');

    // PrimeNG responsive DataTable should use stacked layout
    const table = page.locator('.p-datatable');
    const isStacked = await table.evaluate((el) => {
      return el.classList.contains('p-datatable-stacked') ||
             el.querySelector('.p-datatable-stacked-row') !== null;
    });
    expect(isStacked).toBeTruthy();
  });

  test('FOLD-007: content reflows on viewport change (unfold simulation)', async ({ page }) => {
    // Start folded (outer display)
    await page.setViewportSize({ width: 280, height: 653 });
    await setupAuthenticatedSession(page);
    await page.goto('/products');

    // Verify narrow layout
    const sidebarVisibleNarrow = await page.locator('.docker-container').isVisible()
      .catch(() => false);
    expect(sidebarVisibleNarrow).toBeFalsy(); // Sidebar hidden at 280px

    // Simulate unfolding
    await page.setViewportSize({ width: 717, height: 512 });
    await page.waitForTimeout(500); // Wait for layout reflow

    // Content should adapt - no longer stacked
    const hasOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > window.innerWidth + 1;
    });
    expect(hasOverflow).toBeFalsy();
  });

  test('FOLD-010: touch targets at least 44x44px', async ({ page }) => {
    await page.setViewportSize({ width: 280, height: 653 });
    await mockTenantResolution(page);
    await page.goto('/login');

    const interactiveElements = page.locator(
      'button, a, input, select, [role="button"], [tabindex="0"]'
    );
    const count = await interactiveElements.count();

    for (let i = 0; i < count; i++) {
      const el = interactiveElements.nth(i);
      if (await el.isVisible()) {
        const box = await el.boundingBox();
        if (box) {
          // Minimum touch target 44x44 CSS pixels
          expect(box.width).toBeGreaterThanOrEqual(44);
          expect(box.height).toBeGreaterThanOrEqual(44);
        }
      }
    }
  });
});
```

### 7.3 PrimeNG Responsive DataTable Stacked Mode Validation

PrimeNG `p-table` supports `responsiveLayout="stack"` which converts the table to a card-like layout on small screens.

| TC-ID | Test Case | Breakpoint | Priority |
|-------|-----------|------------|----------|
| STACK-001 | Table renders in tabular mode above 768px | >= 768px | HIGH |
| STACK-002 | Table renders in stacked mode below 768px | < 768px | HIGH |
| STACK-003 | Stacked mode shows column headers as labels | < 768px | HIGH |
| STACK-004 | Sort still works in stacked mode | < 768px | HIGH |
| STACK-005 | Pagination still works in stacked mode | < 768px | HIGH |
| STACK-006 | Row actions accessible in stacked mode | < 768px | HIGH |
| STACK-007 | Stacked cards have adequate spacing | < 768px | MEDIUM |
| STACK-008 | Stacked mode transitions smoothly on resize | Across 768px | MEDIUM |

### 7.4 Orientation Change Handling

| TC-ID | Test Case | Priority |
|-------|-----------|----------|
| ORIENT-001 | Portrait to landscape preserves scroll position | MEDIUM |
| ORIENT-002 | Landscape to portrait reflows content | HIGH |
| ORIENT-003 | Dialog repositions on orientation change | MEDIUM |
| ORIENT-004 | Sidebar state persists on orientation change | MEDIUM |
| ORIENT-005 | No content overlap after orientation change | HIGH |

**Orientation Test Example:**

```typescript
test('ORIENT-002: landscape to portrait reflows content', async ({ page }) => {
  // Start in landscape
  await page.setViewportSize({ width: 1024, height: 768 });
  await setupAuthenticatedSession(page);
  await page.goto('/products');

  // Switch to portrait
  await page.setViewportSize({ width: 768, height: 1024 });
  await page.waitForTimeout(500);

  // Verify no horizontal overflow
  const hasOverflow = await page.evaluate(() => {
    return document.documentElement.scrollWidth > window.innerWidth + 1;
  });
  expect(hasOverflow).toBeFalsy();

  // Verify content still visible
  await expect(page.locator('.main-container')).toBeVisible();
});
```

---

## 8. Performance Test Strategy

### 8.1 Bundle Size Budget

#### 8.1.1 Baseline Measurement (Before Migration)

Measure the current production build output to establish baselines.

```bash
# Generate production build with stats
ng build --configuration production --stats-json

# Analyze with source-map-explorer or webpack-bundle-analyzer
npx source-map-explorer dist/bitx-prodct/browser/*.js --json > bundle-baseline.json
```

#### 8.1.2 Budget Targets

| Metric | Baseline (Bootstrap) | Target (PrimeNG) | Max Allowed | Phase |
|--------|---------------------|-------------------|-------------|-------|
| Total JS (gzip) | Measure | Baseline +/- 10% | Baseline + 15% | D |
| Total CSS (gzip) | Measure | Baseline +/- 10% | Baseline + 15% | D |
| Main bundle (gzip) | Measure | Baseline +/- 5% | Baseline + 10% | D |
| Lazy chunks (gzip) | Measure | Baseline +/- 15% | Baseline + 20% | D |
| Initial load (gzip) | Measure | <= 200KB | 250KB | D |
| Total transfer | Measure | <= 500KB | 600KB | D |

#### 8.1.3 Angular Budget Configuration

```json
{
  "budgets": [
    {
      "type": "initial",
      "maximumWarning": "450kb",
      "maximumError": "550kb"
    },
    {
      "type": "anyComponentStyle",
      "maximumWarning": "6kb",
      "maximumError": "10kb"
    },
    {
      "type": "anyScript",
      "maximumWarning": "100kb",
      "maximumError": "150kb"
    }
  ]
}
```

### 8.2 Lighthouse Performance Scores

| Metric | Target Score | Minimum Acceptable |
|--------|-------------|-------------------|
| Performance | >= 90 | >= 80 |
| Accessibility | >= 95 | >= 90 |
| Best Practices | >= 95 | >= 90 |
| SEO | >= 90 | >= 80 |
| PWA | >= 90 | >= 80 |

### 8.3 Core Web Vitals Targets

| Metric | Target | Maximum | Measurement |
|--------|--------|---------|-------------|
| First Contentful Paint (FCP) | <= 1.0s | <= 1.8s | Lighthouse / Playwright |
| Largest Contentful Paint (LCP) | <= 2.0s | <= 2.5s | Lighthouse |
| First Input Delay (FID) | <= 50ms | <= 100ms | Real User Monitoring |
| Cumulative Layout Shift (CLS) | <= 0.05 | <= 0.1 | Lighthouse |
| Time to Interactive (TTI) | <= 2.5s | <= 3.5s | Lighthouse |
| Total Blocking Time (TBT) | <= 150ms | <= 200ms | Lighthouse |
| Interaction to Next Paint (INP) | <= 100ms | <= 200ms | Real User Monitoring |

### 8.4 Bootstrap vs PrimeNG Performance Comparison

Record these metrics at two points: pre-migration (Bootstrap) and post-migration (PrimeNG Phase D complete).

| Metric | Bootstrap Value | PrimeNG Value | Delta | Pass/Fail |
|--------|----------------|---------------|-------|-----------|
| Total JS (gzip) | Measure | Measure | Calculate | +/- 15% |
| Total CSS (gzip) | Measure | Measure | Calculate | +/- 15% |
| FCP | Measure | Measure | Calculate | No regression |
| LCP | Measure | Measure | Calculate | No regression |
| TTI | Measure | Measure | Calculate | No regression |
| TBT | Measure | Measure | Calculate | No regression |
| CLS | Measure | Measure | Calculate | No regression |
| Lighthouse Performance | Measure | Measure | Calculate | No regression |

**Performance Test Script:**

```typescript
// e2e/performance/lighthouse.e2e.ts
import { test, expect } from '@playwright/test';

test.describe('Performance Metrics', () => {
  test('core web vitals within budget', async ({ page }) => {
    await page.goto('/login');

    const metrics = await page.evaluate(() => {
      return new Promise((resolve) => {
        new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const fcp = entries.find(e => e.name === 'first-contentful-paint');
          resolve({
            fcp: fcp?.startTime,
          });
        }).observe({ entryTypes: ['paint'] });

        // Fallback timeout
        setTimeout(() => resolve({ fcp: null }), 5000);
      });
    });

    if ((metrics as any).fcp) {
      expect((metrics as any).fcp).toBeLessThan(1800); // 1.8s max FCP
    }
  });

  test('no layout shift above threshold', async ({ page }) => {
    await page.goto('/login');

    const cls = await page.evaluate(() => {
      return new Promise((resolve) => {
        let clsValue = 0;
        new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (!(entry as any).hadRecentInput) {
              clsValue += (entry as any).value;
            }
          }
          resolve(clsValue);
        }).observe({ entryTypes: ['layout-shift'] });

        setTimeout(() => resolve(clsValue), 3000);
      });
    });

    expect(cls as number).toBeLessThan(0.1);
  });
});
```

### 8.5 PrimeNG Tree-Shaking Validation

PrimeNG 21 supports tree-shaking. Verify that unused components are not included in the production bundle.

| Check | Method | Pass Criteria |
|-------|--------|---------------|
| Unused PrimeNG modules not bundled | source-map-explorer | Only imported modules in output |
| No full primeng import | Grep codebase | No `import * from 'primeng'` |
| Lazy-loaded route chunks separate | Build stats | Feature modules in separate chunks |
| PrimeNG CSS tree-shaken | CSS output size | Only used component styles |

---

## 9. Test Execution Matrix

### 9.1 Phase A: Coexistence Setup

**Entry Criteria:** PrimeNG 21 installed, theme configured, no components migrated yet.

| Test Suite | Command | Frequency | Pass Criteria |
|------------|---------|-----------|---------------|
| Unit Tests | `npm run test:coverage` | Every PR | All pass, coverage >= 80% |
| E2E Auth | `npm run e2e -- --grep "Authentication"` | Every PR | All 12 tests pass |
| E2E Responsive | `npm run e2e -- --grep "Responsive"` | Every PR | All 3 tests pass |
| Accessibility | `npm run e2e:a11y` | Every PR | All 11 tests pass |
| Visual Regression Baseline | `npx playwright test --project=visual-regression` | Once (capture) | Baselines captured |
| CSS Conflict | `npx playwright test --project=migration-smoke` | Every PR | No conflicts detected |
| Bundle Size | `ng build --configuration production` | Every PR | Within coexistence budget |

### 9.2 Phase B: Shared Components Migration

**Entry Criteria:** Phase A complete, visual baselines captured.

Components: breadcrumb, page-layout, side-menu, tag-input, confidence-badge

| Test Suite | Command | Frequency | Pass Criteria |
|------------|---------|-----------|---------------|
| Unit Tests | `npm run test:coverage` | Every PR | All pass, coverage >= 80% |
| Component Smoke | `npx playwright test --project=migration-smoke` | Per component swap | Zero console errors, component visible |
| Visual Regression | `npx playwright test --project=visual-regression` | Per component swap | Diff within 2% or explicitly accepted |
| E2E Full | `npm run e2e` | Phase gate | All E2E pass across all browser projects |
| Accessibility | `npm run e2e:a11y` | Per component swap | No new violations |
| RTL Validation | `npx playwright test rtl.e2e.ts` | Phase gate | All RTL tests pass |
| Bundle Size | `ng build --configuration production` | Phase gate | Within coexistence budget |

### 9.3 Phase C: Page Components Migration

**Entry Criteria:** Phase B complete, shared components migrated and stable.

Components: product-list, product-modal, persona-form, journey-form, export, preview, bpmn-toolbar, bpmn-canvas, bpmn-properties-panel, bpmn-palette-docker, provider-list, provider-form, provider-embedded

| Test Suite | Command | Frequency | Pass Criteria |
|------------|---------|-----------|---------------|
| Unit Tests | `npm run test:coverage` | Every PR | All pass, coverage >= 82% |
| Component Smoke | `npx playwright test --project=migration-smoke` | Per component swap | Zero console errors |
| Visual Regression | `npx playwright test --project=visual-regression` | Per component swap | Diff within 2% |
| E2E Full | `npm run e2e` | Phase gate | All E2E pass |
| E2E Data Table | `npx playwright test data-table.e2e.ts` | Per table migration | All 14 table tests pass |
| Modal Tests | `npx playwright test modal.e2e.ts` | Per dialog migration | All 10 modal tests pass |
| Form Tests | `npx playwright test forms.e2e.ts` | Per form migration | All 10 form tests pass |
| Accessibility | `npm run e2e:a11y` | Per component swap | No new violations |
| Keyboard Navigation | Subset of a11y | Per component swap | All keyboard tests pass |
| RTL Validation | `npx playwright test rtl.e2e.ts` | Phase gate | All RTL tests pass |
| Bundle Size | `ng build --configuration production` | Phase gate | Within coexistence budget |

### 9.4 Phase D: Cleanup (Full Regression)

**Entry Criteria:** All components migrated, no ng-bootstrap imports remain.

| Test Suite | Command | Frequency | Pass Criteria |
|------------|---------|-----------|---------------|
| Unit Tests | `npm run test:coverage` | Gate | All pass, coverage >= 85% |
| E2E Full Suite | `npm run e2e` | Gate | All tests pass across all 6 browser projects |
| Accessibility Full | `npm run e2e:a11y` | Gate | Zero violations |
| WCAG AAA Checks | `npx playwright test wcag-aaa.a11y.ts` | Gate | All contrast/focus checks pass |
| Visual Regression Final | `npx playwright test --project=visual-regression` | Gate | Final baselines accepted |
| RTL Full | `npx playwright test rtl.e2e.ts` | Gate | All 10 RTL tests pass |
| Responsive Full | `npx playwright test --project=mobile-small,fold-outer,fold-inner,tablet-landscape` | Gate | All responsive tests pass |
| Keyboard Navigation Full | Manual + automated | Gate | All keyboard matrix entries pass |
| Screen Reader | Manual testing | Gate | VoiceOver + TalkBack pass |
| Performance Comparison | Lighthouse + bundle analysis | Gate | No regression vs Bootstrap baseline |
| Bundle Size Final | `ng build --configuration production` | Gate | Within PrimeNG-only budget |
| Bootstrap Removal Verification | Grep codebase | Gate | Zero Bootstrap/ng-bootstrap references |

**Bootstrap Removal Verification:**

```bash
# Must return zero results
grep -r "bootstrap" frontend/src/ --include="*.ts" --include="*.html" --include="*.scss" | grep -v "node_modules"
grep -r "ngb-" frontend/src/ --include="*.html"
grep -r "@ng-bootstrap" frontend/src/ --include="*.ts"
grep -r "NgbModule\|NgbModal\|NgbDropdown" frontend/src/ --include="*.ts"
```

### 9.5 Phase E: PWA + Responsive

**Entry Criteria:** Phase D complete, PrimeNG migration stable.

| Test Suite | Command | Frequency | Pass Criteria |
|------------|---------|-----------|---------------|
| Unit Tests | `npm run test:coverage` | Every PR | All pass, coverage >= 85% |
| E2E Full | `npm run e2e` | Gate | All pass |
| PWA: Service Worker | `npx playwright test pwa/service-worker.e2e.ts` | Every PR | All 6 SW tests pass |
| PWA: Offline | `npx playwright test pwa/offline.e2e.ts` | Every PR | All 7 offline tests pass |
| PWA: Cache | `npx playwright test pwa/cache.e2e.ts` | Every PR | All 5 cache tests pass |
| PWA: Install | `npx playwright test pwa/install.e2e.ts` | Gate | All 6 install tests pass |
| PWA: Lighthouse | Lighthouse CI | Gate | PWA score >= 90 |
| Foldable Devices | `npx playwright test foldable.responsive.ts` | Gate | All 10 foldable tests pass |
| Responsive Full | `npx playwright test --project=mobile-small,fold-outer,fold-inner` | Gate | All pass |
| Orientation | `npx playwright test orientation.responsive.ts` | Gate | All 5 orientation tests pass |
| Performance Final | Lighthouse + bundle analysis | Gate | All Core Web Vitals within target |
| Accessibility | `npm run e2e:a11y` | Gate | Zero violations |

---

## 10. Go/No-Go Criteria

### 10.1 Phase A -> Phase B (Coexistence -> Shared Components)

| Criterion | Required | Measurement |
|-----------|----------|-------------|
| All existing unit tests pass | Yes | `npm run test` exit code 0 |
| All existing E2E tests pass | Yes | `npm run e2e` exit code 0 |
| All existing accessibility tests pass | Yes | `npm run e2e:a11y` exit code 0 |
| Visual regression baselines captured | Yes | All baseline screenshots saved |
| No new console errors in any page | Yes | Migration smoke tests pass |
| Bundle size within coexistence budget | Yes | Build output under limit |
| PrimeNG theme tokens match design system | Yes | QA visual review |
| CSS conflict smoke tests pass | Yes | Zero collisions detected |
| Zero CRITICAL or HIGH defects open | Yes | Defect tracker |

### 10.2 Phase B -> Phase C (Shared -> Page Components)

| Criterion | Required | Measurement |
|-----------|----------|-------------|
| All shared components migrated | Yes | Zero ng-bootstrap imports in shared/ |
| Unit test coverage >= 80% | Yes | `npm run test:coverage` |
| All E2E tests pass | Yes | `npm run e2e` exit code 0 |
| Accessibility tests pass with shared PrimeNG components | Yes | axe-core zero violations |
| RTL layout correct for migrated components | Yes | RTL tests pass |
| Visual regression accepted for shared components | Yes | All diffs reviewed and approved |
| Performance not degraded | Yes | No Lighthouse score drop > 5 points |
| Zero CRITICAL defects open | Yes | Defect tracker |
| Maximum 2 HIGH defects open (with mitigation) | Yes | Defect tracker |

### 10.3 Phase C -> Phase D (Page Components -> Cleanup)

| Criterion | Required | Measurement |
|-----------|----------|-------------|
| All page components migrated | Yes | Zero ng-bootstrap imports in components/ and features/ |
| Unit test coverage >= 82% | Yes | `npm run test:coverage` |
| All E2E tests pass across all browser projects | Yes | `npm run e2e` exit code 0 |
| Data table interactions verified (14 test cases) | Yes | All TABLE-* tests pass |
| Modal/dialog interactions verified (10 test cases) | Yes | All MODAL-* tests pass |
| Form submissions verified (10 test cases) | Yes | All FORM-* tests pass |
| Accessibility zero violations | Yes | `npm run e2e:a11y` |
| Keyboard navigation matrix complete | Yes | All entries verified |
| RTL layout correct for all pages | Yes | All RTL-* tests pass |
| Zero CRITICAL or HIGH defects open | Yes | Defect tracker |

### 10.4 Phase D -> Phase E (Cleanup -> PWA)

| Criterion | Required | Measurement |
|-----------|----------|-------------|
| Zero Bootstrap/ng-bootstrap references in codebase | Yes | Grep verification returns 0 |
| Bootstrap and @popperjs/core removed from package.json | Yes | Package audit |
| Unit test coverage >= 85% | Yes | `npm run test:coverage` |
| All E2E tests pass all 6 browser projects | Yes | Full regression |
| WCAG AAA contrast checks pass | Yes | AAA axe-core scan |
| Screen reader testing complete (VoiceOver, TalkBack) | Yes | Manual test log |
| Performance comparison complete (Bootstrap vs PrimeNG) | Yes | Comparison table filled |
| No performance regression | Yes | All Core Web Vitals within targets |
| Bundle size within PrimeNG-only budget | Yes | Build output under limit |
| Responsive tests pass all viewport sizes | Yes | All responsive projects pass |
| Foldable device tests pass | Yes | All FOLD-* tests pass |
| Visual regression final baselines accepted | Yes | QA sign-off |
| Zero CRITICAL or HIGH defects open | Yes | Defect tracker |
| Maximum 5 MEDIUM defects open | Yes | Defect tracker with mitigation |

### 10.5 Phase E -> Production Release

| Criterion | Required | Measurement |
|-----------|----------|-------------|
| PWA Lighthouse score >= 90 | Yes | Lighthouse CI |
| Service worker tests pass (6 tests) | Yes | All PWA-SW-* pass |
| Offline capability tests pass (7 tests) | Yes | All PWA-OFF-* pass |
| Cache invalidation tests pass (5 tests) | Yes | All PWA-CACHE-* pass |
| Installability tests pass (6 tests) | Yes | All PWA-INSTALL-* pass |
| Unit test coverage >= 85% | Yes | `npm run test:coverage` |
| All E2E suites pass | Yes | Full regression + PWA + responsive |
| All accessibility suites pass | Yes | axe-core + manual screen reader |
| All responsive and foldable tests pass | Yes | All viewport projects pass |
| Orientation change tests pass (5 tests) | Yes | All ORIENT-* pass |
| Performance within budget | Yes | All Core Web Vitals within targets |
| Zero CRITICAL or HIGH defects open | Yes | Defect tracker |
| Maximum 3 MEDIUM defects open (with mitigation) | Yes | Defect tracker |
| QA Lead sign-off | Yes | This document's approval |
| Product Owner acceptance | Yes | UAT complete |

---

## 11. Risk Assessment

| Risk ID | Risk | Probability | Impact | Mitigation |
|---------|------|-------------|--------|------------|
| R-001 | PrimeNG components have different DOM structure than Bootstrap, breaking E2E selectors | HIGH | HIGH | Maintain selector mapping table; update E2E tests per component swap; use role-based selectors over CSS selectors |
| R-002 | CSS conflicts between Bootstrap and PrimeNG during coexistence | MEDIUM | HIGH | CSS conflict smoke tests per PR; namespace PrimeNG styles; prioritize cleanup |
| R-003 | Bundle size exceeds budget during coexistence | MEDIUM | MEDIUM | Monitor per PR; set hard limits in Angular budgets; defer non-critical PrimeNG modules |
| R-004 | PrimeNG accessibility does not meet WCAG AAA without customization | MEDIUM | HIGH | Run axe-core early in Phase A; file PrimeNG issues; build custom ARIA wrappers if needed |
| R-005 | PrimeNG RTL support incomplete for Arabic | LOW | HIGH | Test RTL early in Phase B; consult PrimeNG docs; build CSS overrides if needed |
| R-006 | Service worker caching conflicts with Angular lazy loading | MEDIUM | MEDIUM | Test cache strategies per route; use network-first for API, cache-first for assets |
| R-007 | Foldable viewport segments API has limited browser support | HIGH | LOW | Progressive enhancement; degrade gracefully to standard responsive |
| R-008 | Performance regression from PrimeNG larger component tree | LOW | MEDIUM | Measure per phase; use tree-shaking; lazy-load PrimeNG modules per route |
| R-009 | Visual regression false positives from animation timing | MEDIUM | LOW | Disable animations in visual regression tests; use `animations: 'disabled'` |
| R-010 | Test flakiness from PrimeNG animation/transition delays | MEDIUM | MEDIUM | Use `waitForAnimationEnd` helpers; increase timeouts for PrimeNG transitions |

---

## 12. Appendices

### 12.1 New Test Files to Create

| File Path | Purpose | Phase |
|-----------|---------|-------|
| `frontend/src/testing/primeng-test-helpers.ts` | PrimeNG mock components for unit tests | A |
| `frontend/e2e/visual-regression/baseline.e2e.ts` | Visual regression baseline capture | A |
| `frontend/e2e/migration-smoke/component-smoke.e2e.ts` | Post-migration component smoke tests | B |
| `frontend/e2e/migration-smoke/css-conflict.e2e.ts` | CSS coexistence conflict detection | A |
| `frontend/e2e/data-table.e2e.ts` | PrimeNG DataTable interaction tests | C |
| `frontend/e2e/modal.e2e.ts` | PrimeNG Dialog/ConfirmDialog tests | C |
| `frontend/e2e/forms.e2e.ts` | PrimeNG form component tests | C |
| `frontend/e2e/rtl.e2e.ts` | RTL layout validation tests | B |
| `frontend/e2e/accessibility-comprehensive.a11y.ts` | Expanded accessibility scans all pages | B |
| `frontend/e2e/wcag-aaa.a11y.ts` | WCAG AAA specific checks | D |
| `frontend/e2e/pwa/service-worker.e2e.ts` | Service worker tests | E |
| `frontend/e2e/pwa/offline.e2e.ts` | Offline capability tests | E |
| `frontend/e2e/pwa/cache.e2e.ts` | Cache invalidation tests | E |
| `frontend/e2e/pwa/install.e2e.ts` | Installability tests | E |
| `frontend/e2e/foldable.responsive.ts` | Foldable device tests | E |
| `frontend/e2e/orientation.responsive.ts` | Orientation change tests | E |
| `frontend/e2e/performance/lighthouse.e2e.ts` | Performance metric collection | D |

### 12.2 Playwright Config Additions Summary

New projects to add to `frontend/playwright.config.ts`:

```typescript
// Add to projects array:
{
  name: 'visual-regression',
  testMatch: '**/*.visual.ts',
  use: { ...devices['Desktop Chrome'] },
  expect: {
    toHaveScreenshot: {
      maxDiffPixelRatio: 0.02,
      threshold: 0.2,
      animations: 'disabled',
    },
  },
},
{
  name: 'migration-smoke',
  testMatch: '**/migration-smoke/*.e2e.ts',
  use: { ...devices['Desktop Chrome'] },
},
{
  name: 'mobile-small',
  testMatch: '**/*.responsive.ts',
  use: { viewport: { width: 360, height: 740 }, isMobile: true, hasTouch: true },
},
{
  name: 'fold-outer',
  testMatch: '**/*.responsive.ts',
  use: { viewport: { width: 280, height: 653 }, isMobile: true, hasTouch: true },
},
{
  name: 'fold-inner',
  testMatch: '**/*.responsive.ts',
  use: { viewport: { width: 717, height: 512 }, isMobile: true, hasTouch: true },
},
{
  name: 'tablet-landscape',
  testMatch: '**/*.responsive.ts',
  use: { viewport: { width: 1024, height: 768 }, hasTouch: true },
},
{
  name: 'desktop-large',
  testMatch: '**/*.responsive.ts',
  use: { viewport: { width: 2560, height: 1440 } },
},
```

### 12.3 New npm Scripts to Add

```json
{
  "test:visual": "playwright test --project=visual-regression",
  "test:visual:update": "playwright test --project=visual-regression --update-snapshots",
  "test:smoke": "playwright test --project=migration-smoke",
  "test:responsive": "playwright test --project=mobile-small,fold-outer,fold-inner,tablet-landscape,desktop-large",
  "test:rtl": "playwright test rtl.e2e.ts",
  "test:pwa": "playwright test pwa/",
  "test:perf": "playwright test performance/",
  "test:full-regression": "npm run test:coverage && npm run e2e && npm run e2e:a11y && npm run test:visual && npm run test:responsive && npm run test:pwa"
}
```

### 12.4 Test Execution Summary by Count

| Category | Test Cases | Priority HIGH | Priority MEDIUM | Priority LOW |
|----------|------------|---------------|-----------------|--------------|
| Unit Tests (migration updates) | ~50 | ~30 | ~15 | ~5 |
| E2E Auth | 10 | 8 | 2 | 0 |
| E2E Data Table | 14 | 8 | 4 | 2 |
| E2E Modal/Dialog | 10 | 7 | 2 | 1 |
| E2E Forms | 10 | 5 | 5 | 0 |
| E2E RTL | 10 | 5 | 4 | 1 |
| E2E Responsive | 10 | 5 | 4 | 1 |
| Accessibility (axe-core) | ~15 pages | 10 | 5 | 0 |
| WCAG AAA | 10 | 5 | 5 | 0 |
| Focus/Keyboard | 7 + matrix | 5 | 2 | 0 |
| Screen Reader | 9 auto + manual | 6 | 3 | 0 |
| RTL Accessibility | 7 | 4 | 3 | 0 |
| PWA Service Worker | 6 | 5 | 1 | 0 |
| PWA Offline | 7 | 4 | 3 | 0 |
| PWA Cache | 5 | 2 | 3 | 0 |
| PWA Push | 5 | 0 | 5 | 0 |
| PWA Install | 6 | 4 | 2 | 0 |
| Foldable | 10 | 6 | 2 | 2 |
| Orientation | 5 | 2 | 3 | 0 |
| Visual Regression | ~30 screenshots | 20 | 10 | 0 |
| Performance | ~10 metrics | 6 | 4 | 0 |
| **TOTAL** | **~236** | **~147** | **~87** | **~12** |

### 12.5 Defect Severity Reference

Per QA Principles (docs/governance/agents/QA-PRINCIPLES.md):

| Severity | Definition | Response Time | Examples (Migration Context) |
|----------|------------|---------------|------------------------------|
| CRITICAL | System unusable, data loss | Immediate | Login broken after migration, data table loses data |
| HIGH | Major feature broken, no workaround | 24 hours | Modal dialog does not open, form validation missing |
| MEDIUM | Feature impaired, workaround exists | 72 hours | RTL alignment off, stacked table label missing |
| LOW | Cosmetic, minor inconvenience | Backlog | Spacing differs from design, animation timing |

---

## Document Approval

| Role | Name | Date | Status |
|------|------|------|--------|
| QA Lead | QA Agent | 2026-02-26 | DRAFT |
| Tech Lead | - | - | PENDING |
| PM | - | - | PENDING |

---

## References

- QA Principles: `docs/governance/agents/QA-PRINCIPLES.md`
- UI Development Guidelines: `frontend/docs/UI-DEVELOPMENT-GUIDELINES.md`
- Frontend Implementation Plan: `frontend/docs/FRONTEND-IMPLEMENTATION-PLAN.md`
- Vitest Configuration: `frontend/vitest.config.ts`
- Playwright Configuration: `frontend/playwright.config.ts`
- Current E2E Tests: `frontend/e2e/`
- Current Unit Tests: `frontend/src/**/*.spec.ts`
- PrimeNG 21 Documentation: https://primeng.org/
- Playwright Documentation: https://playwright.dev/
- axe-core Documentation: https://www.deque.com/axe/
- WCAG 2.1 AAA Guidelines: https://www.w3.org/WAI/WCAG21/quickref/
