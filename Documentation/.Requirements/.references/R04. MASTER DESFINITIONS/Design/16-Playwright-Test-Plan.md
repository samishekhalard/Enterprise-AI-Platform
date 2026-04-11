# Playwright E2E Test Plan: Definition Management

**Document ID:** PW-DM-001
**Version:** 1.1.0
**Date:** 2026-03-10
**Status:** Draft
**Author:** QA Agent (QA-PRINCIPLES.md v2.0.0)
**SRS Reference:** SRS-DM-001 v1.0.0
**Test Strategy Reference:** TS-DM-001 v1.0.0

---

## Table of Contents

1. [Test Infrastructure](#1-test-infrastructure)
2. [SCR-01: Object Type List/Grid View](#2-scr-01-object-type-listgrid-view)
3. [SCR-02-T1: General Tab](#3-scr-02-t1-general-tab)
4. [SCR-02-T2: Attributes Tab](#4-scr-02-t2-attributes-tab)
5. [SCR-02-T3: Connections Tab](#5-scr-02-t3-connections-tab)
6. [SCR-02-T4: Governance Tab](#6-scr-02-t4-governance-tab-planned)
7. [SCR-02-T5: Maturity Tab](#7-scr-02-t5-maturity-tab-planned)
8. [SCR-02-T6: Locale Tab](#8-scr-02-t6-locale-tab-planned)
9. [SCR-03: Create Object Type Wizard](#9-scr-03-create-object-type-wizard)
10. [SCR-04: Release Management Dashboard](#10-scr-04-release-management-dashboard-planned)
11. [Cross-Screen Journeys](#11-cross-screen-journeys)
12. [Role-Based Access Tests](#12-role-based-access-tests)
13. [Security Tests](#13-security-tests)
14. [Responsive Test Matrix](#14-responsive-test-matrix)
15. [Accessibility Test Matrix](#15-accessibility-test-matrix)

---

## 1. Test Infrastructure

### 1.1 Test Configuration

```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e/definition-management',
  fullyParallel: true,
  retries: 1,
  workers: 4,
  reporter: [['html'], ['json', { outputFile: 'test-results.json' }]],
  use: {
    baseURL: 'http://localhost:4200',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'Desktop Chrome', use: { ...devices['Desktop Chrome'] } },
    { name: 'Desktop Firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'Desktop Safari', use: { ...devices['Desktop Safari'] } },
    { name: 'Tablet', use: { viewport: { width: 768, height: 1024 } } },
    { name: 'Mobile', use: { viewport: { width: 375, height: 667 } } },
  ],
});
```

### 1.2 API Route Interception Pattern

All E2E tests use `page.route()` to intercept API calls for deterministic behavior. No real backend dependency.

```typescript
// e2e/fixtures/api-mocks.ts
import { Page } from '@playwright/test';

export async function mockObjectTypeListAPI(page: Page, data?: any[]) {
  await page.route('**/api/v1/definitions/object-types**', route => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        content: data || SEED_OBJECT_TYPES,
        totalElements: (data || SEED_OBJECT_TYPES).length,
        totalPages: 1,
        page: 0,
        size: 25,
      }),
    });
  });
}

export async function mockObjectTypeDetailAPI(page: Page, ot?: any) {
  await page.route('**/api/v1/definitions/object-types/*', route => {
    if (route.request().method() === 'GET') {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(ot || SEED_OBJECT_TYPES[0]),
      });
    }
  });
}

export async function mockAPIError(page: Page, endpoint: string, status: number, errorCode: string) {
  await page.route(`**${endpoint}**`, route => {
    route.fulfill({
      status,
      contentType: 'application/json',
      body: JSON.stringify({
        type: 'about:blank',
        title: 'Error',
        status,
        detail: `Error ${errorCode}`,
        instance: route.request().url(),
        messageCode: errorCode,
      }),
    });
  });
}

export const SEED_OBJECT_TYPES = [
  {
    id: 'ot-1', name: 'Server', typeKey: 'server', code: 'SRV',
    description: 'Physical or virtual server', iconName: 'pi-server',
    iconColor: '#428177', status: 'active', state: 'default',
    attributeCount: 12, connectionCount: 4,
    createdAt: '2026-03-01T10:00:00', updatedAt: '2026-03-09T14:30:00',
  },
  // ... 9 more seed object types
];
```

### 1.3 Auth Fixture

```typescript
// e2e/fixtures/auth.ts
export async function loginAs(page: Page, role: 'SUPER_ADMIN' | 'ARCHITECT' | 'TENANT_ADMIN' | 'VIEWER') {
  // Mock Keycloak token exchange
  await page.route('**/realms/emsist/protocol/openid-connect/token', route => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        access_token: generateMockJWT(role),
        token_type: 'Bearer',
        expires_in: 3600,
      }),
    });
  });
  // Set token in localStorage
  await page.evaluate((token) => {
    localStorage.setItem('access_token', token);
  }, generateMockJWT(role));
}
```

---

## 2. SCR-01: Object Type List/Grid View

### 2.A Happy Path Tests

| Test ID | Test Name | Steps | Expected Result | Data Prerequisites |
|---------|-----------|-------|-----------------|-------------------|
| E2E-01-001 | List renders with seed data | 1. Navigate to /admin/definitions 2. Wait for list to load | Table displays 10 object types with name, status badge, attribute count, connection count | 10 seed OTs via route intercept |
| E2E-01-002 | Search filters by name | 1. Type "Server" in search input 2. Wait 300ms debounce | Only "Server" row visible; other rows hidden | 10 seed OTs |
| E2E-01-003 | Search filters by typeKey | 1. Type "srv" in search input | Rows matching typeKey "srv" shown | 10 seed OTs |
| E2E-01-004 | Status filter shows active only | 1. Select "Active" from status dropdown | Only active OTs shown; planned/hold/retired hidden | Mix of statuses |
| E2E-01-005 | View toggle switches to card | 1. Click "Card" view toggle button | Card grid visible; table hidden; cards show name, status, counts | 10 seed OTs |
| E2E-01-006 | View toggle switches back to table | 1. From card view, click "Table" toggle | Table visible; cards hidden | -- |
| E2E-01-007 | Sort by name ascending | 1. Click "Name" column header (or sort dropdown) | OTs sorted A-Z | 10 seed OTs |
| E2E-01-008 | Sort by name descending | 1. Click "Name" header again | OTs sorted Z-A | -- |
| E2E-01-009 | Sort by last modified | 1. Select "Last Modified" from sort dropdown | Most recently modified first | -- |
| E2E-01-010 | Select row opens detail panel | 1. Click on "Server" row | Right panel appears with "Server" detail; General tab active | -- |
| E2E-01-011 | Click New Type opens wizard | 1. Click "New Type" button | Create Object Type wizard dialog opens on Step 1 | -- |
| E2E-01-012 | Pagination controls | 1. Mock 30 OTs 2. Verify paginator shows page 1 of 2 3. Click page 2 | Page 2 loads remaining items | 30 seed OTs, page size 25 |

### 2.B Edge Case Tests

| Test ID | Test Name | Steps | Expected Result |
|---------|-----------|-------|-----------------|
| E2E-01-020 | Empty state - no records | 1. Mock empty list response 2. Navigate to page | Empty state icon (pi-box), heading "No object types match your criteria.", subtext, "New Type" button visible and enabled |
| E2E-01-021 | Single record | 1. Mock 1 OT 2. Navigate | Table shows 1 row; paginator hidden or shows "1 of 1" |
| E2E-01-022 | Pagination boundary (exactly 25) | 1. Mock exactly 25 OTs | All 25 shown; paginator shows 1 page only |
| E2E-01-023 | Pagination boundary (26 records) | 1. Mock 26 OTs | First page shows 25; paginator shows 2 pages; page 2 shows 1 |
| E2E-01-024 | Long object type name (255 chars) | 1. Mock OT with 255-char name | Name truncated with ellipsis in table; full name in detail panel |
| E2E-01-025 | Special characters in name | 1. Mock OT with name containing `<script>alert(1)</script>` | Name displayed as text, not executed; HTML entities escaped |
| E2E-01-026 | Search with no results | 1. Type "zzzznonexistent" | Empty state message shown within list area |
| E2E-01-027 | Search clear | 1. Type search term 2. Clear input | Full list restored |
| E2E-01-028 | Rapid filter switching | 1. Click Active, then Planned, then Active quickly | Final filter state applied correctly; no race conditions |

### 2.C Error Handling Tests

| Test ID | Test Name | Steps | Expected Result |
|---------|-----------|-------|-----------------|
| E2E-01-030 | Network failure during load | 1. Mock API to return network error | Error banner: "Failed to load object types. Please try again." with Retry button (DEF-E-050) |
| E2E-01-031 | 401 Unauthorized (expired token) | 1. Mock API 401 response | Redirect to Keycloak login page |
| E2E-01-032 | 500 Server error | 1. Mock API 500 response | Error toast with message from DEF-E-050; list shows error state |
| E2E-01-033 | Retry after error | 1. Mock error first, then success on retry 2. Click Retry | List loads successfully after retry |
| E2E-01-034 | HTTP 503 Service Unavailable | 1. Mock API 503 response | Error banner: "Service temporarily unavailable. Please try again later." with Retry button; no data loss in form fields (TC-MISS-010) |
| E2E-01-035 | HTTP 504 Gateway Timeout | 1. Mock API 504 response | Error banner: "Request timed out. Please try again." with Retry button (TC-MISS-011) |

### 2.D Confirmation Dialog Tests

| Test ID | Test Name | Steps | Expected Result |
|---------|-----------|-------|-----------------|
| E2E-01-040 | Delete confirmation appears | 1. Select OT 2. Click Delete | Dialog: "Delete {name}? Cannot be undone." with Delete/Cancel buttons (DEF-C-008) |
| E2E-01-041 | Delete confirmed | 1. In delete dialog, click "Delete" | OT removed from list; success toast DEF-S-003; detail panel closes |
| E2E-01-042 | Delete cancelled | 1. In delete dialog, click "Cancel" | Dialog closes; OT still in list; no API call |
| E2E-01-043 | Duplicate confirmation | 1. Select OT 2. Click Duplicate | Confirmation dialog DEF-C-009; confirm creates copy with "(Copy)" suffix |
| E2E-01-044 | Restore confirmation | 1. Select customized OT 2. Click Restore | Dialog DEF-C-007: "Restore to default? Customizations lost."; confirm resets state |
| E2E-01-045 | Reactivate OT confirmation | 1. Select retired OT 2. Click Reactivate | Dialog DEF-C-005: "Reactivate {name}?" with Reactivate/Cancel buttons; confirm transitions state to active; success toast (TC-MISS-012) |
| E2E-01-046 | Customize Default confirmation | 1. Select default OT 2. Click Edit on a field | Dialog DEF-C-006: "Editing will change state from default to customized. Continue?" with Edit/Cancel; confirm sets state=customized (TC-MISS-013) |

### 2.E Toast/Notification Tests

| Test ID | Test Name | Steps | Expected Result |
|---------|-----------|-------|-----------------|
| E2E-01-050 | Create success toast | 1. Complete wizard 2. Submit | Toast: DEF-S-001 message, severity=success, auto-dismiss 3s |
| E2E-01-051 | Update success toast | 1. Edit OT 2. Save | Toast: DEF-S-002, success, 3s |
| E2E-01-052 | Delete success toast | 1. Delete OT (confirmed) | Toast: DEF-S-003, success, 3s |
| E2E-01-053 | Error toast | 1. Mock API error | Toast: DEF-E-050, severity=error, auto-dismiss 5s |
| E2E-01-054 | Toast has role="alert" | 1. Trigger any toast | DOM element has role="alert" or role="status" with aria-live |
| E2E-01-055 | Multiple sequential toasts | 1. Trigger 3 rapid actions | All 3 toasts displayed (stacked), each auto-dismisses independently |

### 2.F Form Validation Tests

(See SCR-03 Wizard section for form validation -- SCR-01 has no forms)

### 2.G Responsive Tests

| Test ID | Viewport | Aspect | Expected Result |
|---------|----------|--------|-----------------|
| E2E-01-060 | Desktop (1280x720) | Layout | Split-panel: left list 280-400px, right detail flex |
| E2E-01-061 | Desktop | Loading | 5 skeleton rows with circle + 2 text lines |
| E2E-01-062 | Desktop | View toggle | Table/Card toggle visible |
| E2E-01-063 | Desktop | Actions | Buttons with text labels |
| E2E-01-064 | Tablet (768x1024) | Layout | Single column: list above detail |
| E2E-01-065 | Tablet | View toggle | Same as desktop |
| E2E-01-066 | Tablet | Actions | Icon buttons with tooltips |
| E2E-01-067 | Mobile (375x667) | Layout | Single column: list full-width, detail as bottom sheet |
| E2E-01-068 | Mobile | View toggle | Default to card view |
| E2E-01-069 | Mobile | Search | Expandable search icon |
| E2E-01-070 | Mobile | Actions | Icon buttons, overflow menu |

### 2.H Accessibility Tests

| Test ID | Aspect | Assertion |
|---------|--------|-----------|
| E2E-01-080 | axe-core scan | Zero WCAG AAA violations on SCR-01 |
| E2E-01-081 | Keyboard navigation | Tab through search -> filter -> sort -> view toggle -> table rows |
| E2E-01-082 | Table role | `<table>` has `aria-label="Object types list"` |
| E2E-01-083 | Sort column | Sortable headers have `aria-sort` attribute |
| E2E-01-084 | Row selection | Selected row has `aria-selected="true"` |
| E2E-01-085 | Empty state | Empty state heading has appropriate heading level |
| E2E-01-086 | Loading state | Skeleton has `aria-busy="true"` |
| E2E-01-087 | Color contrast | Status badges meet 4.5:1 contrast ratio |
| E2E-01-088 | Focus visible | All interactive elements show visible focus ring |

---

## 3. SCR-02-T1: General Tab

### 3.A Happy Path Tests

| Test ID | Test Name | Steps | Expected Result |
|---------|-----------|-------|-----------------|
| E2E-T1-001 | Display all fields in view mode | 1. Select OT 2. Verify General tab | Name, TypeKey (readonly), Code (readonly), Description, Status badge, State badge, Icon, Icon Color, Attr count, Conn count, Created At, Updated At all visible |
| E2E-T1-002 | Enter edit mode | 1. Click "Edit" button | Name and Description become editable inputs; Icon and Icon Color show selectors; Save/Cancel buttons appear |
| E2E-T1-003 | Save changes | 1. Edit name 2. Click Save | API PUT called; success toast DEF-S-002; view mode restored with new name |
| E2E-T1-004 | Cancel edit | 1. Edit name 2. Click Cancel | Original values restored; view mode restored; no API call |
| E2E-T1-005 | TypeKey is readonly | 1. In edit mode, attempt to edit TypeKey | TypeKey field is disabled/readonly |

### 3.B Edge Case Tests

| Test ID | Test Name | Expected Result |
|---------|-----------|-----------------|
| E2E-T1-010 | Empty description | Description field shows placeholder or "--" |
| E2E-T1-011 | Max length name (255 chars) | Full name displayed; edit input allows up to 255 chars |
| E2E-T1-012 | Special chars in description | Rendered as text, not HTML |

### 3.C Error Handling Tests

| Test ID | Test Name | Expected Result |
|---------|-----------|-----------------|
| E2E-T1-020 | Save fails (500) | Error toast; edit mode remains; data not lost |
| E2E-T1-021 | Save fails (409 conflict) | Error toast DEF-E-002; edit mode remains |
| E2E-T1-022 | Save fails (422 validation) | Inline validation errors shown on fields |
| E2E-T1-023 | 404 after deletion by another user | Error toast; detail panel closes; list refreshes |

### 3.G Responsive Tests

| Test ID | Viewport | Expected Result |
|---------|----------|-----------------|
| E2E-T1-030 | Desktop | Fields in 2-column layout |
| E2E-T1-031 | Tablet | Fields in 1-column layout below list |
| E2E-T1-032 | Mobile | Fields in 1-column in bottom sheet |

### 3.H Accessibility Tests

| Test ID | Aspect | Assertion |
|---------|--------|-----------|
| E2E-T1-040 | axe-core | Zero violations |
| E2E-T1-041 | Tab panel | `role="tabpanel"` on content area |
| E2E-T1-042 | Edit focus | Focus moves to first editable field on Edit |
| E2E-T1-043 | Labels | All form fields have associated labels |

---

## 4. SCR-02-T2: Attributes Tab

### 4.A Happy Path Tests

| Test ID | Test Name | Steps | Expected Result |
|---------|-----------|-------|-----------------|
| E2E-T2-001 | Display attribute list | 1. Select OT 2. Click Attributes tab | Table with columns: Name, Type, Required, Lifecycle, Default, Actions |
| E2E-T2-002 | Lifecycle chips color coding | 1. View attributes with mixed lifecycle | Blue chip for planned, green for active, grey for retired |
| E2E-T2-003 | System default shield icon | 1. View attributes | System defaults show shield icon (pi-shield); Remove button disabled |
| E2E-T2-004 | Add attribute from pick-list | 1. Click "Add Attribute" 2. Select from pick-list 3. Confirm | Attribute added to table; success toast |
| E2E-T2-005 | Remove non-default attribute | 1. Click Remove on custom attribute 2. Confirm | Attribute unlinked; success toast |
| E2E-T2-006 | Lifecycle transition: activate | 1. Click lifecycle action on planned attribute 2. Select "Activate" | Confirmation dialog DEF-C-010; chip changes to green "active" |
| E2E-T2-007 | Lifecycle transition: retire | 1. Click lifecycle action on active attribute 2. Select "Retire" | Confirmation dialog DEF-C-011; chip changes to grey "retired"; row opacity 0.6 |
| E2E-T2-008 | Lifecycle transition: reactivate | 1. Click lifecycle action on retired attribute 2. Select "Reactivate" | Confirmation dialog DEF-C-012; chip changes to green "active" |

### 4.B Edge Case Tests

| Test ID | Test Name | Expected Result |
|---------|-----------|-----------------|
| E2E-T2-010 | No attributes (empty) | Empty state: "No attributes linked. Add attributes using the button above." |
| E2E-T2-011 | Only system defaults (10) | 10 rows, all with shield icon, all Remove disabled |
| E2E-T2-012 | Retired row styling | Row has opacity: 0.6 CSS class applied |
| E2E-T2-013 | All attributes same lifecycle | Bulk toolbar relevant for all |

### 4.C Error Handling Tests

| Test ID | Test Name | Expected Result |
|---------|-----------|-----------------|
| E2E-T2-020 | Unlink system default attempt | Remove button disabled; if API called directly, 403 DEF-E-026 |
| E2E-T2-021 | Add duplicate attribute | Error toast: attribute already linked |
| E2E-T2-022 | Network failure during lifecycle transition | Error toast; lifecycle state unchanged; dialog closes |

### 4.D Confirmation Dialog Tests

| Test ID | Dialog | Steps | Expected Result |
|---------|--------|-------|-----------------|
| E2E-T2-030 | Retire (DEF-C-011) | 1. Click Retire on active attr 2. Verify dialog title: "Confirm Retire" 3. Body: "Retire {name}? {instanceCount} instances preserved." | Dialog text matches registry; "Retire" button primary danger, "Cancel" secondary |
| E2E-T2-031 | Retire cancel | 1. Click Cancel in retire dialog | Dialog closes; attribute still active |
| E2E-T2-032 | Activate (DEF-C-010) | 1. Click Activate on planned attr | Dialog with "Activate" primary button |
| E2E-T2-033 | Reactivate (DEF-C-012) | 1. Click Reactivate on retired attr | Dialog with "Reactivate" primary button |
| E2E-T2-034 | Unlink (DEF-C-013) | 1. Click Remove on custom attr | "Remove {name} from {objectTypeName}?" with Remove/Cancel |

### 4.E Bulk Operations Tests

| Test ID | Test Name | Steps | Expected Result |
|---------|-----------|-------|-----------------|
| E2E-T2-040 | Select multiple attributes | 1. Check 3 non-default attribute checkboxes | Bulk toolbar appears: "{3} selected" with Activate/Retire buttons |
| E2E-T2-041 | Select all checkbox | 1. Click "select all" header checkbox | All non-default attributes checked; system defaults remain unchecked (disabled) |
| E2E-T2-042 | Bulk retire | 1. Select 3 attributes 2. Click "Retire" in bulk toolbar 3. Confirm | All 3 transition to retired; chips grey; success toast |
| E2E-T2-043 | Bulk activate | 1. Select 2 planned attributes 2. Click "Activate" | Both transition to active; chips green |
| E2E-T2-044 | Deselect clears toolbar | 1. With 3 selected, uncheck all | Bulk toolbar hidden |

### 4.G Responsive Tests

| Test ID | Viewport | Expected Result |
|---------|----------|-----------------|
| E2E-T2-050 | Desktop | Full table with all columns |
| E2E-T2-051 | Tablet | Table fits with horizontal scroll if needed |
| E2E-T2-052 | Mobile | Card-based attribute display or horizontally scrollable table |

### 4.H Accessibility Tests

| Test ID | Aspect | Assertion |
|---------|--------|-----------|
| E2E-T2-060 | axe-core | Zero WCAG AAA violations |
| E2E-T2-061 | Checkbox a11y | Each checkbox has aria-label="Select {attributeName}" |
| E2E-T2-062 | Shield icon | Shield has aria-label="System default attribute" |
| E2E-T2-063 | Disabled remove | Disabled button has aria-disabled="true" and tooltip |
| E2E-T2-064 | Color contrast on chips | Blue/green/grey chips meet 4.5:1 contrast |
| E2E-T2-065 | Bulk toolbar | Announced to screen reader when appearing |

---

## 5. SCR-02-T3: Connections Tab

### 5.A Happy Path Tests

| Test ID | Test Name | Steps | Expected Result |
|---------|-----------|-------|-----------------|
| E2E-T3-001 | Display connections | 1. Click Connections tab | Table with: Relationship, Target Type, Cardinality badge, Lifecycle chip, Actions |
| E2E-T3-002 | Bidirectional display | 1. View connections | "Outgoing" section and "Incoming" section headers visible |
| E2E-T3-003 | Add connection | 1. Click "Add Connection" 2. Fill form (target, relationship, cardinality) 3. Submit | Connection added; success toast |
| E2E-T3-004 | Remove connection | 1. Click Remove 2. Confirm dialog | Connection removed; success toast |
| E2E-T3-005 | Lifecycle transition | 1. Click lifecycle action 2. Transition active->retired | Confirmation dialog; chip changes |
| E2E-T3-006 | Importance badge display | 1. View connection with importance=critical | Red severity badge displayed |

### 5.B Edge Case Tests

| Test ID | Test Name | Expected Result |
|---------|-----------|-----------------|
| E2E-T3-010 | No connections | Empty state: "No connections defined. Add connections using the button above." |
| E2E-T3-011 | Self-connection | OT connected to itself displays correctly |
| E2E-T3-012 | Multiple connections to same target | All displayed as separate rows |

### 5.C Error Handling Tests

| Test ID | Test Name | Expected Result |
|---------|-----------|-----------------|
| E2E-T3-020 | Invalid cardinality | Form validation prevents submission |
| E2E-T3-021 | Cross-tenant target | Error DEF-E-033: "Source and target must be in the same tenant" |
| E2E-T3-022 | Remove mandated connection (child tenant) | 403 DEF-E-030 |
| E2E-T3-023 | Mandate lock icon visible on mandated connection | Lock icon (pi-lock) visible on mandated connection row in child tenant; Remove button disabled with aria-disabled="true" (TC-MISS-001) |
| E2E-T3-024 | Reactivate retired connection confirmation | Click Reactivate on retired connection -> Dialog DEF-C-022: "Reactivate connection?" with Reactivate/Cancel; confirm transitions to active (TC-MISS-014) |

### 5.G Responsive Tests

| Test ID | Viewport | Expected Result |
|---------|----------|-----------------|
| E2E-T3-030 | Desktop | Full table |
| E2E-T3-031 | Tablet | Table with scrollable overflow |
| E2E-T3-032 | Mobile | Stacked card layout or scrollable table |

### 5.H Accessibility Tests

| Test ID | Aspect | Assertion |
|---------|--------|-----------|
| E2E-T3-040 | axe-core | Zero violations |
| E2E-T3-041 | Table | aria-label="Connections list" |
| E2E-T3-042 | Add dialog | Focus trapped when open |
| E2E-T3-043 | Cardinality badge | Has title/aria-label explaining the cardinality |

---

## 6. SCR-02-T4: Governance Tab [PLANNED]

### 6.A Happy Path Tests

| Test ID | Test Name | Expected Result |
|---------|-----------|-----------------|
| E2E-T4-001 | Display workflow list | Left panel shows workflow list table |
| E2E-T4-002 | Display direct operation settings | Right panel shows operation settings (allowDirectCreate, etc.) |
| E2E-T4-003 | Open workflow settings dialog | Click "Add Workflow" -> dialog with workflow selector, behaviour radio, permission table |
| E2E-T4-004 | Toggle operation setting | Toggle "allowDirectCreate" switch -> API PUT called |

### 6.B Edge Case Tests

| Test ID | Test Name | Expected Result |
|---------|-----------|-----------------|
| E2E-T4-010 | No workflows attached | Empty state in workflow list |
| E2E-T4-011 | TENANT_ADMIN view | Operations toggles are readonly/disabled for mandated settings |

### 6.C Error Handling Tests

| Test ID | Test Name | Expected Result |
|---------|-----------|-----------------|
| E2E-T4-015 | Governance config API failure | Mock 500 on governance config endpoint -> Error message displayed: "Unable to load governance settings." with Retry button (TC-MISS-020) |

### 6.I Role-Based Access Tests

| Test ID | Role | Expected Result |
|---------|------|-----------------|
| E2E-T4-020 | SUPER_ADMIN | All toggles editable; "Add Workflow" visible |
| E2E-T4-021 | ARCHITECT | All toggles editable; "Add Workflow" visible |
| E2E-T4-022 | TENANT_ADMIN | Mandated toggles locked (pi-lock); local toggles editable |
| E2E-T4-023 | VIEWER | All toggles disabled; "Add Workflow" hidden |

---

## 7. SCR-02-T5: Maturity Tab [PLANNED]

### 7.A Happy Path Tests

| Test ID | Test Name | Expected Result |
|---------|-----------|-----------------|
| E2E-T5-001 | Display 4-axis weights | p-knob components showing Completeness (40%), Compliance (25%), Relationship (20%), Freshness (15%) |
| E2E-T5-002 | Update weight | 1. Change Completeness to 50% 2. Other weights auto-adjust | Sum = 100 enforced (BR-068); error DEF-E-071 if sum != 100 |
| E2E-T5-003 | Preview maturity score | Click "Preview" -> calculated score displayed | Score computed against sample data |
| E2E-T5-004 | Freshness threshold | Set freshnessThresholdDays = 30 -> saved | Value persists on reload |

### 7.B Edge Case Tests

| Test ID | Test Name | Expected Result |
|---------|-----------|-----------------|
| E2E-T5-010 | Weights sum > 100 | Error message DEF-E-071; Save disabled |
| E2E-T5-011 | Weights sum < 100 | Error message DEF-E-071 |
| E2E-T5-012 | All weights zero | Error; at least one must be > 0 |

### 7.G Responsive Tests

| Test ID | Viewport | Expected Result |
|---------|----------|-----------------|
| E2E-T5-020 | Desktop (1280x720) | p-knob components display side-by-side in a 2x2 grid; all labels readable (TC-MISS-016) |
| E2E-T5-021 | Tablet (768x1024) | Knob components reflow to 2-column layout; touch-friendly spacing |
| E2E-T5-022 | Mobile (375x667) | Knob components stack vertically in single column; scroll to see all 4 |

### 7.H Accessibility Tests

| Test ID | Aspect | Assertion |
|---------|--------|-----------|
| E2E-T5-030 | axe-core scan | Zero WCAG AAA violations on Maturity tab (TC-MISS-017) |
| E2E-T5-031 | Knob aria-label | Each p-knob has aria-label with dimension name and value (e.g., "Completeness: 40%") |
| E2E-T5-032 | Keyboard navigation | Tab through knob components; Enter/Space activates edit mode |
| E2E-T5-033 | Screen reader | Knob value changes announced via aria-live region |

---

## 8. SCR-02-T6: Locale Tab [PLANNED]

### 8.A Happy Path Tests

| Test ID | Test Name | Expected Result |
|---------|-----------|-----------------|
| E2E-T6-001 | Display locale list | Table with locale code, display name, active toggle |
| E2E-T6-002 | Add locale | 1. Click "Add Locale" 2. Select "French (fr)" 3. Confirm | Locale added to list with active toggle |
| E2E-T6-003 | Toggle locale active/inactive | Click toggle -> API updated |
| E2E-T6-004 | Delete locale | Click delete -> confirmation -> removed |

### 8.B RTL Tests

| Test ID | Test Name | Expected Result |
|---------|-----------|-----------------|
| E2E-T6-010 | Arabic locale activates RTL | When Arabic is active, `dir="rtl"` on layout container |
| E2E-T6-011 | RTL layout mirroring | Sidebar moves to right; text right-aligned; icons mirrored |
| E2E-T6-012 | RTL with LTR fallback | Mixed content (Arabic text + English labels) displays correctly |

### 8.G Responsive Tests

| Test ID | Viewport | Expected Result |
|---------|----------|-----------------|
| E2E-T6-020 | Desktop (1280x720) | Locale table displays full width with all columns visible (TC-MISS-018) |
| E2E-T6-021 | Tablet (768x1024) | Table columns remain visible; action buttons may stack |
| E2E-T6-022 | Mobile (375x667) | Locale table scrolls horizontally or reflows to card layout |

### 8.H Accessibility Tests

| Test ID | Aspect | Assertion |
|---------|--------|-----------|
| E2E-T6-030 | axe-core scan | Zero WCAG AAA violations on Locale tab (TC-MISS-019) |
| E2E-T6-031 | Toggle switch | Active toggle has role="switch" with aria-checked="true/false" and visible label |
| E2E-T6-032 | Keyboard navigation | Tab through locale rows; toggle operable via Enter/Space |
| E2E-T6-033 | RTL announcement | Screen reader announces layout direction change when RTL activated |

---

## 9. SCR-03: Create Object Type Wizard

### 9.A Happy Path Tests

| Test ID | Test Name | Steps | Expected Result |
|---------|-----------|-------|-----------------|
| E2E-WIZ-001 | Open wizard | 1. Click "New Type" button | Wizard dialog opens; Step 1 active; step indicator shows 4 steps |
| E2E-WIZ-002 | Step 1: Fill basic info | 1. Enter name "Equipment" 2. Description "Hardware" 3. Select icon 4. Pick color | All fields populated; Next button enabled |
| E2E-WIZ-003 | Step 2: Navigate to connections | 1. Complete Step 1 2. Click Next | Step 2 active; connection selection UI shown |
| E2E-WIZ-004 | Step 3: Navigate to attributes | 1. Complete Step 2 2. Click Next | Step 3 active; attribute pick-list with checkboxes; system defaults pre-selected |
| E2E-WIZ-005 | Step 4: Review summary | 1. Complete Step 3 2. Click Next | Review panel shows: name, typeKey (auto-generated), selected attributes count, connection count |
| E2E-WIZ-006 | Create success | 1. On Step 4 click "Create" | Wizard closes; OT added to list; success toast DEF-S-001 |
| E2E-WIZ-007 | Back navigation | 1. On Step 3 click "Back" | Returns to Step 2; data preserved |
| E2E-WIZ-008 | Step indicator click | 1. On Step 3 click Step 1 indicator | Returns to Step 1; data preserved |

### 9.B Edge Case Tests

| Test ID | Test Name | Expected Result |
|---------|-----------|-----------------|
| E2E-WIZ-010 | Empty name submission | Step 1: error "Name is required" on name field; Next button does not advance |
| E2E-WIZ-011 | Name at max length (255) | 255 chars accepted; 256th char rejected by input maxlength |
| E2E-WIZ-012 | TypeKey special characters | Only alphanumeric + underscore allowed; invalid chars rejected |
| E2E-WIZ-013 | No connections selected | Step 2: empty connections allowed; Step 4 shows "0 connections" |
| E2E-WIZ-014 | No additional attributes | Step 3: only system defaults; Step 4 shows "10 system defaults, 0 custom" |
| E2E-WIZ-015 | Cancel wizard on Step 3 | Dialog closes; no API call; list unchanged |
| E2E-WIZ-016 | Escape key closes wizard | Press Escape on any step; wizard closes |
| E2E-WIZ-017 | Double-click Create | 1. Click Create rapidly twice | Only one API call; button disabled after first click |

### 9.C Error Handling Tests

| Test ID | Test Name | Expected Result |
|---------|-----------|-----------------|
| E2E-WIZ-020 | Duplicate typeKey | On Step 4 Create -> API returns DEF-E-002 -> error shown; wizard stays open on Step 1 (name/typeKey) |
| E2E-WIZ-021 | Server error on create | API returns 500 -> error toast DEF-E-050; wizard stays open |
| E2E-WIZ-022 | Network timeout | API times out -> error toast; wizard stays open; Create button re-enabled |

### 9.F Form Validation Tests

| Test ID | Field | Validation | Expected Result |
|---------|-------|-----------|-----------------|
| E2E-WIZ-030 | name | Required | Red border + "Name is required" |
| E2E-WIZ-031 | name | Max 255 chars | Input maxlength attribute prevents entry |
| E2E-WIZ-032 | typeKey | Required | Red border + "Type key is required" |
| E2E-WIZ-033 | typeKey | Max 100 chars | Input maxlength prevents entry |
| E2E-WIZ-034 | iconColor | Pattern `#[0-9A-Fa-f]{6}` | Invalid color rejected with DEF-E-019 |
| E2E-WIZ-035 | status | Enum validation | Only planned/active/hold/retired selectable |
| E2E-WIZ-036 | Real-time validation | Name field on blur | Error shown immediately on blur, not only on submit |

### 9.G Responsive Tests

| Test ID | Viewport | Expected Result |
|---------|----------|-----------------|
| E2E-WIZ-040 | Desktop | Dialog centered, ~600px wide, step indicator horizontal |
| E2E-WIZ-041 | Tablet | Dialog ~90% width, step indicator horizontal |
| E2E-WIZ-042 | Mobile | Full-screen dialog, step indicator compact, fields stacked |

### 9.H Accessibility Tests

| Test ID | Aspect | Assertion |
|---------|--------|-----------|
| E2E-WIZ-050 | Dialog role | `role="dialog"` with `aria-modal="true"` and `aria-label="Create Object Type"` |
| E2E-WIZ-051 | Focus trap | Tab key cycles within dialog; does not escape to background |
| E2E-WIZ-052 | Focus on open | Focus moves to first input field (Name) on dialog open |
| E2E-WIZ-053 | Focus on close | Focus returns to "New Type" button after dialog closes |
| E2E-WIZ-054 | Step indicator | Steps have `aria-current="step"` for active step |
| E2E-WIZ-055 | Error announcements | Validation errors have `role="alert"` |
| E2E-WIZ-056 | Required fields | `aria-required="true"` on Name and TypeKey inputs |
| E2E-WIZ-057 | axe-core | Zero violations on all 4 wizard steps |

---

## 10. SCR-04: Release Management Dashboard [PLANNED]

### 10.A Happy Path Tests

| Test ID | Test Name | Expected Result |
|---------|-----------|-----------------|
| E2E-REL-001 | Display release list | Left panel: filterable list of releases with status badges (Draft/Published/Adopted/Deferred/Rejected) |
| E2E-REL-002 | Select release shows detail | Center panel: release notes, diff viewer, change summary |
| E2E-REL-003 | Adoption tracker | Right panel: per-tenant adoption status |
| E2E-REL-004 | Create release | Click "Create Release" -> form with version, notes; submit -> release created |
| E2E-REL-005 | Publish release | Click "Publish" -> confirmation DEF-C-030 -> status changes to Published |
| E2E-REL-006 | View release diff | Click "View Diff" -> diff viewer shows additions (green), removals (red), modifications (amber) |
| E2E-REL-007 | Rollback release | Click "Rollback" -> confirmation DEF-C-031 -> status reverted |

### 10.B Edge Case Tests

| Test ID | Test Name | Expected Result |
|---------|-----------|-----------------|
| E2E-REL-010 | No releases | Empty state: "No releases created yet" |
| E2E-REL-011 | Release with 0 changes | Diff viewer shows "No changes in this release" |

### 10.C Error Handling Tests

| Test ID | Test Name | Expected Result |
|---------|-----------|-----------------|
| E2E-REL-020 | Publish conflict | Another user published first -> 409 conflict -> error toast |
| E2E-REL-021 | Rollback failure | Already adopted by tenants -> 400 -> error toast |

### 10.I Role-Based Access Tests

| Test ID | Role | Expected Result |
|---------|------|-----------------|
| E2E-REL-030 | SUPER_ADMIN | Create, Publish, Rollback all visible |
| E2E-REL-031 | ARCHITECT | Create, Publish visible; Rollback visible |
| E2E-REL-032 | TENANT_ADMIN | Only "Adopt" (DEF-C-032), "Defer", "Reject" visible |
| E2E-REL-033 | VIEWER | Read-only; no action buttons |

### 10.D Import/Export Tests [PLANNED]

| Test ID | Test Name | Steps | Expected Result |
|---------|-----------|-------|-----------------|
| E2E-REL-040 | Import conflict -- duplicate typeKey | 1. Import JSON file with OT "Server" into tenant that already has "Server" | Conflict detection dialog showing duplicates; user chooses Skip/Overwrite/Rename (TC-MISS-002) |
| E2E-REL-041 | Version history export | 1. Navigate to OT with 5+ releases 2. Click Export Version History | JSON/CSV file downloaded containing all release snapshots and diffs (TC-MISS-004) |

### 10.E Impact Analysis Modal Tests [PLANNED]

| Test ID | Test Name | Steps | Expected Result |
|---------|-----------|-------|-----------------|
| E2E-REL-050 | Impact modal responsive -- desktop | 1. Open Impact Analysis modal at 1280x720 | Modal occupies 80% viewport width; dependency graph visible (TC-MISS-021) |
| E2E-REL-051 | Impact modal responsive -- tablet | 1. Open Impact Analysis modal at 768x1024 | Modal occupies 90% viewport width; graph scrollable |
| E2E-REL-052 | Impact modal responsive -- mobile | 1. Open Impact Analysis modal at 375x667 | Modal full-width; dependency list replaces graph |
| E2E-REL-053 | Impact modal accessibility | 1. Open Impact Analysis modal 2. Run axe-core | Zero WCAG AAA violations; focus trapped in modal; Escape closes |

---

## 11. Cross-Screen Journeys

### 11.1 JRN-DEFMGMT-003: Create New Object Type from Scratch (Nicole - Architect)

**Status:** [IMPLEMENTED] screens used

| Step | Action | Screen | Assertion |
|------|--------|--------|-----------|
| 1 | Login as ARCHITECT | SCR-AUTH | JWT obtained with ARCHITECT role |
| 2 | Navigate to Master Definitions | SCR-01 | Object type list loads |
| 3 | Click "New Type" | SCR-03 | Wizard opens on Step 1 |
| 4 | Fill Basic Info (name, typeKey, desc, icon, color) | SCR-03 Step 1 | All fields populated |
| 5 | Click Next | SCR-03 Step 2 | Connection step shown |
| 6 | Add connection to "Server" | SCR-03 Step 2 | Connection row added |
| 7 | Click Next | SCR-03 Step 3 | Attribute pick-list shown |
| 8 | Select 3 additional attributes | SCR-03 Step 3 | 3 checked + 10 system defaults |
| 9 | Click Next | SCR-03 Step 4 | Review shows summary |
| 10 | Click Create | SCR-01 | Wizard closes; new OT in list; success toast |
| 11 | Click new OT in list | SCR-02-T1 | Detail panel opens with General tab |
| 12 | Click Attributes tab | SCR-02-T2 | 13 attributes shown (10 default + 3 custom) |
| 13 | Click Connections tab | SCR-02-T3 | 1 connection to Server shown |

### 11.2 JRN-DEFMGMT-005: Manage Attributes (Nicole - Architect)

| Step | Action | Screen | Assertion |
|------|--------|--------|-----------|
| 1 | Login as ARCHITECT | SCR-AUTH | JWT obtained |
| 2 | Navigate to Master Definitions | SCR-01 | List loads |
| 3 | Select "Server" | SCR-02-T1 | Detail opens |
| 4 | Click Attributes tab | SCR-02-T2 | Attribute list shown |
| 5 | Click "Add Attribute" | Pick-list dialog | Attribute pick-list opens |
| 6 | Select "Memory Size" | Dialog | Attribute checked |
| 7 | Confirm | SCR-02-T2 | Attribute added to table |
| 8 | Click lifecycle action on "Legacy ID" | Confirmation | Retire dialog DEF-C-011 |
| 9 | Confirm retire | SCR-02-T2 | Chip changes to grey; row opacity 0.6 |
| 10 | Select 2 planned attributes | Bulk toolbar | "{2} selected" toolbar appears |
| 11 | Click "Activate" | Confirmation | Both activated; chips green |

### 11.3 JRN-DEFMGMT-006: Process Master Tenant Release (Fiona - Tenant Admin) [PLANNED]

| Step | Action | Screen | Assertion |
|------|--------|--------|-----------|
| 1 | Login as TENANT_ADMIN | SCR-AUTH | JWT obtained |
| 2 | Notification bell shows badge | SCR-NOTIF | "1 new release available" |
| 3 | Click notification | SCR-04 | Release dashboard opens with pending release |
| 4 | Click "View Impact" | SCR-04-M1 | Impact analysis modal shows affected OTs |
| 5 | Click "Adopt" | Confirmation DEF-C-032 | Release adopted; local customizations preserved |

---

## 12. Role-Based Access Tests

### 12.1 Full RBAC Matrix

| Test ID | Screen / Action | SUPER_ADMIN | ARCHITECT | TENANT_ADMIN | VIEWER |
|---------|----------------|:-----------:|:---------:|:------------:|:------:|
| RBAC-001 | Navigate to /admin/definitions | Allowed | Allowed | Allowed | Allowed |
| RBAC-002 | "New Type" button visible | YES | YES | YES (local only) | NO (hidden) |
| RBAC-003 | Edit button on General tab | YES | YES | YES (non-mandated) | NO (hidden) |
| RBAC-004 | Delete button | YES | YES | YES (local only) | NO |
| RBAC-005 | Duplicate button | YES | YES | NO | NO |
| RBAC-006 | Restore button | YES | YES | NO | NO |
| RBAC-007 | Attribute add/remove | YES | YES | NO (mandated) | NO |
| RBAC-008 | Connection add/remove | YES | YES | NO (mandated) | NO |
| RBAC-009 | Cross-tenant toggle | YES | NO | NO | NO |
| RBAC-010 | Mandate flag toggle | YES | YES | NO (readonly) | NO |
| RBAC-011 | Release Publish | YES | YES | NO | NO |
| RBAC-012 | Release Adopt | NO | NO | YES | NO |
| RBAC-013 | Locale management | YES | NO | NO | NO |
| RBAC-014 | Maturity config edit | YES | YES | NO (readonly) | NO (readonly) |
| RBAC-015 | AI insights | YES | YES | NO | NO |

### 12.2 Role Transition Tests

| Test ID | Test Name | Steps | Expected Result |
|---------|-----------|-------|-----------------|
| RBAC-020 | Token expires during session | 1. Working session 2. Token expires 3. Next API call | Redirect to Keycloak login; session state preserved on return |
| RBAC-021 | Role downgrade | 1. Login as ARCHITECT 2. Admin removes ARCHITECT role 3. Next API call | 403 on write operations; UI refreshes to VIEWER mode |

---

## 13. Security Tests

### 13.1 Tenant Isolation

| Test ID | Test Name | Steps | Expected Result |
|---------|-----------|-------|-----------------|
| SEC-001 | Cross-tenant data isolation | 1. Login as tenant-1 ARCHITECT 2. Try to access tenant-2 OT by ID | 404 Not Found (not 403 -- no information leakage) |
| SEC-002 | Cross-tenant list isolation | 1. Login as tenant-1 2. List OTs | Only tenant-1 OTs returned; tenant-2 OTs invisible |
| SEC-003 | IDOR on object type | 1. Discover tenant-2 OT ID 2. Try PUT /object-types/{tenant-2-id} as tenant-1 user | 404 Not Found |
| SEC-004 | IDOR on attribute | 1. Try DELETE /object-types/{tenant-2-ot}/attributes/{attr-id} as tenant-1 | 404 Not Found |
| SEC-005 | Cross-tenant connection | 1. Try POST connection with target in tenant-2 as tenant-1 | 400 DEF-E-033 |

### 13.2 JWT Validation

| Test ID | Test Name | Expected Result |
|---------|-----------|-----------------|
| SEC-010 | No Authorization header | 401 Unauthorized |
| SEC-011 | Malformed JWT | 401 Unauthorized |
| SEC-012 | Expired JWT | 401 Unauthorized |
| SEC-013 | JWT with wrong issuer | 401 Unauthorized |
| SEC-014 | JWT with missing tenant_id claim | 400 DEF-E-015 |

### 13.3 XSS Prevention

| Test ID | Test Name | Input | Expected Result |
|---------|-----------|-------|-----------------|
| SEC-020 | Script in OT name | `<script>alert(1)</script>` | Stored as text; rendered as escaped HTML; no script execution |
| SEC-021 | Script in description | `<img src=x onerror=alert(1)>` | Stored as text; rendered safely |
| SEC-022 | Script in attribute name | `"><script>alert(1)</script>` | Stored as text; no execution |

### 13.4 CSRF Protection

| Test ID | Test Name | Expected Result |
|---------|-----------|-----------------|
| SEC-030 | POST without CSRF token | Request rejected (if CSRF enabled) or JWT-only auth sufficient |

---

## 14. Responsive Test Matrix

### 14.1 Viewport Configurations

```typescript
const viewports = [
  { name: 'Desktop', width: 1280, height: 720 },
  { name: 'Tablet', width: 768, height: 1024 },
  { name: 'Mobile', width: 375, height: 667 },
];
```

### 14.2 Per-Screen Responsive Assertions

| Screen | Desktop | Tablet | Mobile |
|--------|---------|--------|--------|
| SCR-01 | Split-panel (list left, detail right) | Single column (list above detail) | Single column (detail as bottom sheet) |
| SCR-02-T1 | 2-column field layout | 1-column below list | 1-column in bottom sheet |
| SCR-02-T2 | Full table, all columns | Table fits or scrolls | Card layout or scrollable |
| SCR-02-T3 | Full table | Scrollable table | Card layout or scrollable |
| SCR-02-T4 | Split panel within tab | Single column | Single column |
| SCR-03 | Dialog centered ~600px | Dialog ~90% width | Full-screen dialog |
| SCR-04 | Three-panel dashboard | Two-panel (list + detail) | Single panel with tabs |
| SCR-05 | Dashboard with charts | Single column charts | Stacked charts |
| SCR-GV | Full canvas with toolbar | Canvas fills width | Simplified controls |

### 14.3 Responsive Test Implementation Pattern

```typescript
import { test, expect } from '@playwright/test';

const viewports = [
  { name: 'Desktop', width: 1280, height: 720 },
  { name: 'Tablet', width: 768, height: 1024 },
  { name: 'Mobile', width: 375, height: 667 },
];

for (const vp of viewports) {
  test.describe(`SCR-01 at ${vp.name} (${vp.width}x${vp.height})`, () => {
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await mockObjectTypeListAPI(page);
      await loginAs(page, 'ARCHITECT');
      await page.goto('/admin/definitions');
    });

    test('layout is correct', async ({ page }) => {
      if (vp.width > 1024) {
        // Desktop: split panel
        await expect(page.locator('.split-panel-left')).toBeVisible();
        await expect(page.locator('.split-panel-right')).toBeVisible();
      } else if (vp.width >= 768) {
        // Tablet: single column
        await expect(page.locator('.split-panel-left')).toBeVisible();
        // Detail below, not beside
      } else {
        // Mobile: bottom sheet for detail
        await expect(page.locator('.bottom-sheet')).not.toBeVisible(); // until OT selected
      }
    });
  });
}
```

---

## 15. Accessibility Test Matrix

### 15.1 WCAG AAA Requirements

| Screen | axe-core Tags | Additional Manual Checks |
|--------|---------------|--------------------------|
| SCR-01 | wcag2a, wcag2aa, wcag2aaa | Tab order through toolbar, table navigation |
| SCR-02-T1 | wcag2a, wcag2aa, wcag2aaa | Edit mode focus management |
| SCR-02-T2 | wcag2a, wcag2aa, wcag2aaa | Checkbox a11y, bulk toolbar announcement |
| SCR-02-T3 | wcag2a, wcag2aa, wcag2aaa | Add dialog focus trap |
| SCR-02-T4 | wcag2a, wcag2aa, wcag2aaa | Toggle switch a11y, focus trap |
| SCR-02-T5 | wcag2a, wcag2aa, wcag2aaa | Knob component screen reader |
| SCR-02-T6 | wcag2a, wcag2aa, wcag2aaa | RTL navigation |
| SCR-03 | wcag2a, wcag2aa, wcag2aaa | Dialog focus trap, step indicator, error announcements |
| SCR-04 | wcag2a, wcag2aa, wcag2aaa | Dashboard navigation, diff viewer |

### 15.2 Accessibility Test Implementation Pattern

```typescript
import AxeBuilder from '@axe-core/playwright';
import { test, expect } from '@playwright/test';

test.describe('Accessibility: SCR-01', () => {
  test.beforeEach(async ({ page }) => {
    await mockObjectTypeListAPI(page);
    await loginAs(page, 'ARCHITECT');
    await page.goto('/admin/definitions');
  });

  test('passes WCAG AAA audit', async ({ page }) => {
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag2aaa'])
      .analyze();
    expect(results.violations).toEqual([]);
  });

  test('keyboard navigation through list', async ({ page }) => {
    // Tab to search input
    await page.keyboard.press('Tab');
    await expect(page.locator('#search-input')).toBeFocused();

    // Tab to first table row
    await page.keyboard.press('Tab'); // filter
    await page.keyboard.press('Tab'); // sort
    await page.keyboard.press('Tab'); // view toggle
    await page.keyboard.press('Tab'); // first row
    const firstRow = page.locator('table tbody tr').first();
    await expect(firstRow).toBeFocused();

    // Enter selects row
    await page.keyboard.press('Enter');
    await expect(page.locator('#ot-detail-panel')).toBeVisible();
  });

  test('focus management: detail panel open', async ({ page }) => {
    await page.locator('table tbody tr').first().click();
    // Focus should move to detail panel heading
    await expect(page.locator('#detail-title')).toBeFocused();
  });

  test('focus management: detail panel close', async ({ page }) => {
    await page.locator('table tbody tr').first().click();
    await page.locator('#detail-close-btn').click();
    // Focus should return to the row that was clicked
    await expect(page.locator('table tbody tr').first()).toBeFocused();
  });
});
```

### 15.3 ARIA Requirements Checklist

| Element | Required ARIA | Screen(s) |
|---------|--------------|-----------|
| Object type table | `aria-label="Object types list"` | SCR-01 |
| Sortable column header | `aria-sort="ascending"` or `"descending"` or `"none"` | SCR-01 |
| Selected row | `aria-selected="true"` | SCR-01 |
| View toggle group | `role="group"`, `aria-label="View mode"` | SCR-01 |
| Tab list | `role="tablist"`, `aria-label="Object type configuration tabs"` | SCR-02 |
| Active tab | `role="tab"`, `aria-selected="true"` | SCR-02 |
| Tab panel | `role="tabpanel"` | SCR-02 |
| Wizard dialog | `role="dialog"`, `aria-modal="true"`, `aria-label="Create Object Type"` | SCR-03 |
| Required field | `aria-required="true"` | SCR-03 |
| Validation error | `role="alert"` | SCR-03 |
| Confirmation dialog | `role="dialog"`, `aria-modal="true"` | All confirm dialogs |
| Toast notification | `role="status"` or `role="alert"`, `aria-live="polite"` | All screens |
| Loading skeleton | `aria-busy="true"` | SCR-01 |
| Disabled button | `aria-disabled="true"` | SCR-02-T2 (system default remove) |
| Shield icon | `aria-label="System default attribute"` | SCR-02-T2 |
| Lock icon | `aria-label="Mandated by master tenant"` | SCR-02-T2, SCR-02-T3 |
| Toggle switch | `role="switch"`, `aria-checked="true/false"` | SCR-02-T4 |
| Accordion | `role="button"`, `aria-expanded="true/false"` | Measures tab |
| Maturity knob | `aria-label="{dimension}: {value}%"`, `aria-valuemin="0"`, `aria-valuemax="100"` | SCR-02-T5 |
| Impact analysis modal | `role="dialog"`, `aria-modal="true"`, `aria-label="Impact Analysis"` | SCR-04-M1 |

---

## Appendix A: Test File Organization

```
frontend/e2e/definition-management/
  fixtures/
    api-mocks.ts              # Route interception helpers
    auth.ts                   # Login helpers
    seed-data.ts              # Test data constants
  screens/
    scr-01-object-type-list.spec.ts
    scr-02-t1-general-tab.spec.ts
    scr-02-t2-attributes-tab.spec.ts
    scr-02-t3-connections-tab.spec.ts
    scr-02-t4-governance-tab.spec.ts
    scr-02-t5-maturity-tab.spec.ts
    scr-02-t6-locale-tab.spec.ts
    scr-03-create-wizard.spec.ts
    scr-04-release-dashboard.spec.ts
  journeys/
    jrn-003-create-object-type.spec.ts
    jrn-005-manage-attributes.spec.ts
    jrn-006-process-release.spec.ts
  rbac/
    role-based-access.spec.ts
  security/
    tenant-isolation.spec.ts
    jwt-validation.spec.ts
    xss-prevention.spec.ts
  responsive/
    responsive-all-screens.spec.ts
  accessibility/
    a11y-all-screens.spec.ts
```

## Appendix B: BVT (Build Verification Tests) -- Critical Path

These ~20 tests run on every push in CI to verify the critical path is not broken.

| BVT ID | Test | Priority | Screen |
|--------|------|----------|--------|
| BVT-001 | List loads with seed data | P0 | SCR-01 |
| BVT-002 | Search filters results | P0 | SCR-01 |
| BVT-003 | View toggle works | P0 | SCR-01 |
| BVT-004 | Select row opens detail | P0 | SCR-01, SCR-02-T1 |
| BVT-005 | Tab switching works | P0 | SCR-02 |
| BVT-006 | Wizard opens and navigates | P0 | SCR-03 |
| BVT-007 | Wizard validates required fields | P0 | SCR-03 |
| BVT-008 | Wizard creates OT successfully | P0 | SCR-03 |
| BVT-009 | Delete with confirmation | P0 | SCR-01 |
| BVT-010 | Duplicate creates copy | P0 | SCR-01 |
| BVT-011 | Attributes tab shows attributes | P0 | SCR-02-T2 |
| BVT-012 | Connections tab shows connections | P0 | SCR-02-T3 |
| BVT-013 | Error state on API failure | P0 | SCR-01 |
| BVT-014 | Toast notification appears | P0 | All |
| BVT-015 | Responsive: desktop layout | P0 | SCR-01 |
| BVT-016 | Responsive: mobile layout | P0 | SCR-01 |
| BVT-017 | Accessibility: zero violations on list | P0 | SCR-01 |
| BVT-018 | Accessibility: zero violations on wizard | P0 | SCR-03 |
| BVT-019 | RBAC: VIEWER cannot see Create button | P0 | SCR-01 |
| BVT-020 | Tenant isolation: cross-tenant blocked | P0 | API |

## Appendix C: Test Naming Convention

All Playwright tests follow this pattern:

```
{screenId}_{scenario}_{expectedBehavior}
```

Examples:
- `scr01_searchByName_shouldFilterResults`
- `scr03_wizardStep1_emptyName_shouldShowValidationError`
- `scr02t2_retireAttribute_shouldShowConfirmationDialog`
- `responsive_scr01_mobile_shouldShowCardViewDefault`
- `a11y_scr01_shouldPassWcagAAAaudit`
- `rbac_viewer_shouldNotSeeCreateButton`
- `security_tenantIsolation_shouldReturn404ForOtherTenantData`
