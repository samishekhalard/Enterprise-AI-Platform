# ISSUE-001: UX Specification -- Users Tab & Identity Provider States

**Document:** UX Specification
**Version:** 1.0.0
**Date:** 2026-02-26
**Status:** Draft
**Author:** UX Agent

---

## Table of Contents

1. [Overview](#1-overview)
2. [Design System Reference](#2-design-system-reference)
3. [Tab Navigation Update](#3-tab-navigation-update)
4. [Users Tab -- User List View](#4-users-tab----user-list-view)
5. [Users Tab -- User Row Actions](#5-users-tab----user-row-actions)
6. [Users Tab -- Empty State](#6-users-tab----empty-state)
7. [Users Tab -- Loading Skeleton State](#7-users-tab----loading-skeleton-state)
8. [Identity Provider List -- Populated State](#8-identity-provider-list----populated-state)
9. [Accessibility Requirements](#9-accessibility-requirements)
10. [Responsive Behavior](#10-responsive-behavior)
11. [PrimeNG 21 Component Mapping](#11-primeng-21-component-mapping)
12. [Interaction State Matrix](#12-interaction-state-matrix)
13. [RTL / Arabic Layout Considerations](#13-rtl--arabic-layout-considerations)

---

## 1. Overview

This specification defines the UX design for two areas of the Tenant Factsheet page in the EMSIST Administration module:

1. **A new "Users" tab** inserted between "Local Authentication" and "Branding" in the tenant factsheet tab bar.
2. **The Identity Provider list populated state**, describing how provider cards render when data is loaded.

All designs adhere to:
- The existing ThinkPlus design system (teal primary `#047481`, Gotham Rounded / Nunito font stack)
- The existing factsheet tab pattern (`factsheet-tabs` / `factsheet-tab` CSS classes)
- WCAG 2.1 AAA compliance (color contrast 7:1+ verified in ThinkPlus preset)
- 8px spacing grid

### Current Tab Order (Before)

```
[Overview] [Locale Definition] [Local Authentication] [Branding] [Licenses*]
```

*Licenses is conditionally shown for non-master tenants.

### Proposed Tab Order (After)

```
[Overview] [Locale Definition] [Local Authentication] [Users] [Branding] [Licenses*]
```

---

## 2. Design System Reference

Extracted from the live codebase (`thinkplus-preset.ts` and `administration.styles.scss`).

### Colors

| Token | Value | Usage |
|-------|-------|-------|
| `$teal` / primary.600 | `#047481` | Interactive elements, active tabs, primary buttons |
| `$teal-dark` / primary.700 | `#035a66` | Hover states on primary elements |
| `$gray-50` | `#f7fafc` | Page/section background |
| `$gray-100` | `#edf2f7` | Card hover background, subtle borders |
| `$gray-200` | `#e2e8f0` | Borders, dividers |
| `$gray-400` | `#545e6e` | Muted text (WCAG AAA: 7.01:1) |
| `$gray-500` | `#495567` | Secondary text (WCAG AAA: 7.01:1) |
| `$gray-700` | `#334155` | Body text |
| `$gray-800` | `#1e293b` | Headings, emphasis text |
| `$danger` | `#ef4444` | Error states, destructive actions |
| `$success` / `#22c55e` | `#22c55e` | Success states, active badges |
| `$warning` | `#f59e0b` | Warning states |
| `$purple` | `#7c3aed` | Accent badge color (WCAG AA: 4.68:1) |

### Typography

| Element | Size | Weight | Family |
|---------|------|--------|--------|
| Section title | 1.125rem (18px) | 600 | Gotham Rounded, Nunito, system |
| Tab label | 0.875rem (14px) | 500 | Gotham Rounded, Nunito, system |
| Table header | 0.75rem (12px) | 600 | Gotham Rounded, Nunito, system |
| Table body | 0.875rem (14px) | 400 | Gotham Rounded, Nunito, system |
| Badge text | 0.6875rem (11px) | 500 | Gotham Rounded, Nunito, system |
| Muted / description | 0.875rem (14px) | 400 | Gotham Rounded, Nunito, system |

### Spacing (8px grid)

| Token | Value |
|-------|-------|
| xs | 4px |
| sm | 8px |
| md | 12px |
| base | 16px |
| lg | 24px |
| xl | 32px |
| 2xl | 48px |
| 3xl | 64px |

### Border Radius

| Element | Value |
|---------|-------|
| Buttons, inputs | 0.375rem (6px) |
| Cards, panels | 0.5rem (8px) |
| Info cards | 0.75rem (12px) |
| Badges (pill) | 9999px |

---

## 3. Tab Navigation Update

### TypeScript Type Change

```typescript
// BEFORE
type TenantTab = 'overview' | 'locale' | 'authentication' | 'branding' | 'licenses';

// AFTER
type TenantTab = 'overview' | 'locale' | 'authentication' | 'users' | 'branding' | 'licenses';
```

### Tab Template (Insert After "Local Authentication")

```html
<button class="factsheet-tab"
        [class.active]="activeTenantTab() === 'users'"
        (click)="activeTenantTab.set('users')"
        role="tab"
        [attr.aria-selected]="activeTenantTab() === 'users'"
        aria-controls="panel-users"
        id="tab-users">
  <img src="assets/icons/users.svg" alt="" class="tab-icon" aria-hidden="true">
  <span>Users</span>
</button>
```

### Tab Bar Wireframe (Desktop)

```
+----------------------------------------------------------------------------+
| [grid] Overview | [globe] Locale Definition | [shield] Local Auth          |
| [users] Users   | [image] Branding          | [briefcase] Licenses*       |
+============================================================================+
      ^^^^^^^^^^^^
      NEW TAB (underlined teal when active)
```

---

## 4. Users Tab -- User List View

### 4.1 Header Section

```
+============================================================================+
| Identity Providers     Configure SSO for this tenant         [+ Add Prov.] |
+============================================================================+

Becomes (when Users tab is active):

+============================================================================+
| Tenant Users                                                               |
| Manage user accounts, roles, and access for this tenant.                   |
|                                        [grid][table]       [+ Add User]    |
+============================================================================+
```

The header follows the same `embedded-header` pattern as `ProviderEmbeddedComponent`:
- Left: section title (h3, 18px, weight 600, `$gray-800`) + description (14px, `$gray-500`)
- Center-right: view toggle (card/table)
- Right: primary action button

#### Card/Table View Toggle (MANDATORY)

**Pattern:** Follows existing `tenantListView` signal pattern from `administration.page.ts:3046`.

```typescript
userListView = signal<'grid' | 'table'>('table');  // Default: table
```

| Property | Value |
|----------|-------|
| Container | `<div class="view-toggle" role="group" aria-label="View mode">` |
| Grid button | `<button class="view-toggle-btn" [class.active]="userListView() === 'grid'" aria-label="Grid view">` |
| Table button | `<button class="view-toggle-btn" [class.active]="userListView() === 'table'" aria-label="Table view">` |
| Grid icon | `assets/icons/grid.svg` with `aria-hidden="true"` |
| Table icon | `assets/icons/bars.svg` with `aria-hidden="true"` |
| Active state | Background: `#e8f5f6` (`$teal-50`), border: 1px solid `#047481` |
| Inactive state | Background: `#ffffff`, border: 1px solid `#d1d5db` |
| Border radius | 6px (left button: top-left/bottom-left, right button: top-right/bottom-right) |
| Size | 36px x 36px per button |

**Grid View (Card Layout):**
```
+============================================================================+
| +---------------------------+  +---------------------------+               |
| |  [Avatar]                 |  |  [Avatar]                 |               |
| |  Mohamed Al-Rashidi       |  |  Sarah Chen               |               |
| |  mohamed@emsist.com       |  |  sarah@emsist.com         |               |
| |  [SUPER_ADMIN] [ADMIN]    |  |  [ADMIN] [MANAGER]        |               |
| |  ● Active  Last: 2h ago   |  |  ● Active  Last: 1d ago   |               |
| |  [...] kebab menu         |  |  [...] kebab menu         |               |
| +---------------------------+  +---------------------------+               |
+============================================================================+
```

Card specifications:
- Width: min 280px, max 360px, CSS grid `repeat(auto-fill, minmax(280px, 1fr))`
- Gap: 16px
- Border: 1px solid `#e5e7eb` (`$gray-200`)
- Border radius: 8px
- Padding: 16px
- Hover: `box-shadow: 0 2px 8px rgba(0,0,0,0.08)`
- Avatar: 48px circle, top-center of card
- Name: 16px, weight 600, `$gray-800`
- Email: 14px, `$gray-500`
- Role badges: same pill style as table view
- Status dot + "Last login" on same line, 12px, `$gray-400`

**Table View:** (default, as specified in Section 4.3 below)

#### "+ Add User" Button Specification

| Property | Value |
|----------|-------|
| Element | `<button>` |
| CSS Class | `btn btn-primary btn-sm` |
| Icon | Plus SVG (inline, 16x16), left of label |
| Label | "Add User" |
| Background | `#047481` (`$teal`) |
| Hover background | `#035a66` (`$teal-dark`) |
| Text color | `#ffffff` |
| Padding | 6px 12px (0.375rem 0.75rem) |
| Font size | 13px (0.8125rem) |
| Border radius | 6px (0.375rem) |
| `aria-label` | "Add a new user to this tenant" |

### 4.2 Search and Filter Bar

```
+============================================================================+
|  [Q] Search users by name or email...    [Role: All v]  [Status: All v]   |
+============================================================================+
```

#### Layout

Horizontal flex container with `gap: 12px`, wrapping on narrow viewports.

| Element | PrimeNG Component | Width | Notes |
|---------|-------------------|-------|-------|
| Search input | `p-inputtext` with left icon | flex: 1, min-width 240px | Magnifying glass icon, placeholder text |
| Role filter | `p-select` (v21) | 180px | Options listed below |
| Status filter | `p-select` (v21) | 160px | Options listed below |

#### Role Filter Options

| Value | Label |
|-------|-------|
| `null` | All Roles |
| `SUPER_ADMIN` | Super Admin |
| `ADMIN` | Admin |
| `MANAGER` | Manager |
| `USER` | User |
| `VIEWER` | Viewer |

#### Status Filter Options

| Value | Label |
|-------|-------|
| `null` | All Statuses |
| `active` | Active |
| `inactive` | Inactive |
| `locked` | Locked |

#### Search Behavior

- Debounce: 300ms after last keystroke
- Searches against: `firstName`, `lastName`, `email`
- Minimum characters: 0 (empty clears filter)
- Announce result count to screen readers via `aria-live="polite"` region

### 4.3 User Table

#### Desktop Wireframe (>1024px)

```
+----+-------------------+------------------------+-------------------+-----------+------------------+---------+
|    | Full Name         | Email                  | Roles             | Status    | Last Login       | Actions |
+----+-------------------+------------------------+-------------------+-----------+------------------+---------+
| MA | Mohamed Al-Rashid | m.rashid@tenant.com    | [Admin] [Manager] | * Active  | 2026-02-25 14:32 | [...] . |
+----+-------------------+------------------------+-------------------+-----------+------------------+---------+
| SK | Sarah Kim         | s.kim@tenant.com       | [User]            | * Active  | 2026-02-24 09:15 | [...] . |
+----+-------------------+------------------------+-------------------+-----------+------------------+---------+
| JD | John Doe          | j.doe@tenant.com       | [Viewer]          | o Inactive| Never            | [...] . |
+----+-------------------+------------------------+-------------------+-----------+------------------+---------+
| FL | Fatima Lahcen     | f.lahcen@tenant.com    | [Super Admin]     | x Locked  | 2026-02-20 11:00 | [...] . |
+----+-------------------+------------------------+-------------------+-----------+------------------+---------+

Legend: MA/SK/JD/FL = Avatar initials circle
        [Admin] = role badge (p-tag)
        * Active / o Inactive / x Locked = status indicator
        [...] = action menu button    . = kebab or row actions
```

#### Column Specifications

| # | Column | Width | Sortable | Content |
|---|--------|-------|----------|---------|
| 1 | Avatar | 48px fixed | No | `p-avatar` -- circular, 36px diameter. Uses user initials (first letter of first + last name). Background: deterministic color from name hash using teal, purple, or gray palette. |
| 2 | Full Name | flex: 2 | Yes (default asc) | Two-line cell: line 1 = full name (14px, weight 500, `$gray-800`); line 2 = username/login (12px, monospace, `$gray-400`) |
| 3 | Email | flex: 2 | Yes | Single line, 14px, `$gray-700`. Truncate with ellipsis if overflows. `title` attribute shows full email. |
| 4 | Roles | flex: 2 | No | Horizontal list of `p-tag` badges. See Role Badge Colors below. Wraps if needed. |
| 5 | Status | 100px | Yes | Status dot + label. See Status Indicator below. |
| 6 | Last Login | 160px | Yes | Relative time (e.g., "2h ago", "3d ago") with `title` showing full ISO timestamp. "Never" if null. |
| 7 | Actions | 80px fixed | No | Icon buttons or `p-menu` overflow. See Section 5. |

#### Role Badge Colors

| Role | Background | Text | Contrast Ratio |
|------|------------|------|----------------|
| Super Admin | `rgba(124, 58, 237, 0.1)` | `#7c3aed` | 4.68:1 (AA) |
| Admin | `rgba(4, 116, 129, 0.1)` | `#035a66` | 7.2:1 (AAA) |
| Manager | `rgba(245, 158, 11, 0.12)` | `#92400e` | 7.1:1 (AAA) |
| User | `rgba(69, 78, 92, 0.1)` | `#454e5c` | 7.0:1 (AAA) |
| Viewer | `rgba(203, 213, 224, 0.3)` | `#545e6e` | 7.0:1 (AAA) |

Badge style: pill shape (`border-radius: 9999px`), padding `2px 10px`, font size 11px, weight 500, uppercase.

#### Status Indicator

| Status | Dot Color | Label Color | Dot Size |
|--------|-----------|-------------|----------|
| Active | `#22c55e` (success) | `$gray-700` | 8px circle |
| Inactive | `$gray-300` | `$gray-500` | 8px circle |
| Locked | `#ef4444` (danger) | `$danger` | 8px circle |

Format: `<span class="status-dot [status]"></span> <span class="status-label">Active</span>`

Additional: Active status also uses `aria-label="Status: Active"` on the container for screen readers.

### 4.4 Pagination

```
+============================================================================+
| Showing 1-10 of 47 users             [10 v]  [< 1 2 3 4 5 >]             |
+============================================================================+
```

| Element | PrimeNG Component | Notes |
|---------|-------------------|-------|
| Summary | Custom text | "Showing {first}-{last} of {totalRecords} users" |
| Rows per page | `p-select` in paginator | Options: `[10, 25, 50]` |
| Page navigation | `p-paginator` | First/prev/pages/next/last buttons |

Paginator placement: below the table, right-aligned page controls, left-aligned summary.

---

## 5. Users Tab -- User Row Actions

### 5.1 Action Menu

Each row displays an icon button (three vertical dots / kebab menu) that opens a `p-menu` overlay.

```
+------------------------------+
|  [eye]   View Details        |
|  [shield] Edit Roles         |
|  -------------------------   |
|  [toggle] Disable User       |  <-- or "Enable User" if currently disabled
|  [key]   Reset Password      |
+------------------------------+
```

#### Menu Item Specifications

| Action | Icon | Label (Active User) | Label (Inactive User) | Destructive |
|--------|------|---------------------|-----------------------|-------------|
| View Details | `pi pi-eye` | View Details | View Details | No |
| Edit Roles | `pi pi-shield` | Edit Roles | Edit Roles | No |
| Separator | -- | -- | -- | -- |
| Toggle Status | `pi pi-ban` / `pi pi-check-circle` | Disable User | Enable User | Conditional |
| Reset Password | `pi pi-key` | Reset Password | Reset Password | No |

#### Destructive Action: Disable User

When "Disable User" is selected, show a `p-confirmdialog`:

```
+------------------------------------------+
|  Disable User                     [X]    |
|------------------------------------------|
|                                          |
|  Are you sure you want to disable        |
|  **Mohamed Al-Rashid**?                  |
|                                          |
|  The user will no longer be able to      |
|  sign in until re-enabled.               |
|                                          |
|------------------------------------------|
|                    [Cancel]  [Disable]    |
+------------------------------------------+
```

| Button | Style | Color |
|--------|-------|-------|
| Cancel | `btn-outline` | `$gray-700` on `$white` bg |
| Disable | `btn-danger` | `$white` on `$danger` bg |

#### Reset Password Action

When "Reset Password" is selected, show a confirmation dialog:

```
+------------------------------------------+
|  Reset Password                   [X]    |
|------------------------------------------|
|                                          |
|  A password reset email will be sent     |
|  to **m.rashid@tenant.com** via          |
|  Keycloak.                               |
|                                          |
|  The user will need to set a new         |
|  password on next login.                 |
|                                          |
|------------------------------------------|
|                    [Cancel]  [Send Reset] |
+------------------------------------------+
```

| Button | Style | Color |
|--------|-------|-------|
| Cancel | `btn-outline` | `$gray-700` on `$white` bg |
| Send Reset | `btn-primary` | `$white` on `$teal` bg |

### 5.2 Edit Roles Side Panel

When "Edit Roles" is selected, a right-side drawer or modal opens (using `p-dialog` or `p-drawer`).

```
+------------------------------------------+
|  Edit Roles                       [X]    |
|  Mohamed Al-Rashid                       |
|  m.rashid@tenant.com                     |
|------------------------------------------|
|                                          |
|  Assigned Roles:                         |
|                                          |
|  [x] Super Admin                         |
|  [x] Admin                               |
|  [ ] Manager                             |
|  [ ] User                                |
|  [ ] Viewer                              |
|                                          |
|------------------------------------------|
|                    [Cancel]  [Save Roles] |
+------------------------------------------+
```

- Roles presented as `p-checkbox` list
- At least one role must remain selected (validation)
- "Save Roles" calls the user-service API to update role assignments

---

## 6. Users Tab -- Empty State

Follows the identical visual pattern from `provider-list.component.ts` empty state.

### Wireframe

```
+============================================================================+
|                                                                            |
|                                                                            |
|                         +--------+                                         |
|                         |  [svg] |   <- 80x80 users icon, color: $gray-300|
|                         +--------+                                         |
|                                                                            |
|                       No Users Found                                       |
|                                                                            |
|             Add users to this tenant to manage their                       |
|               access, roles, and authentication.                           |
|                                                                            |
|                      [+ Add First User]                                    |
|                                                                            |
|                                                                            |
+============================================================================+
```

### Specifications

| Element | Style |
|---------|-------|
| Container | `display: flex; flex-direction: column; align-items: center; padding: 4rem 2rem; text-align: center;` |
| Icon | 80x80px SVG (users/people outline), stroke color `$gray-300`, stroke-width 1.5 |
| Title | 20px (1.25rem), weight 600, color `$gray-800`, margin-bottom 8px |
| Description | 15px (0.9375rem), color `$gray-500`, max-width 400px, margin-bottom 24px |
| Button | Same spec as "+ Add User" button from Section 4.1 |

### SVG Icon (Users)

```svg
<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
  <circle cx="9" cy="7" r="4" />
  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
</svg>
```

---

## 7. Users Tab -- Loading Skeleton State

Displayed while the user list API call is in-flight.

### Wireframe

```
+============================================================================+
|  [=====  search placeholder  =====]      [== Role ==]  [== Status ==]     |
+============================================================================+
|    | =========   Full Name   ======= | ========= email ========= | ====  |
+----+----+------------------------------------------------------------+----+
| [O]| ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ | ~~~~~~~~~~~~~~~~~~~~~~~~~ | ~~~~  |
+----+----+------------------------------------------------------------+----+
| [O]| ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ | ~~~~~~~~~~~~~~~~~~~~~~~~~ | ~~~~  |
+----+----+------------------------------------------------------------+----+
| [O]| ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ | ~~~~~~~~~~~~~~~~~~~~~~~~~ | ~~~~  |
+----+----+------------------------------------------------------------+----+
| [O]| ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ | ~~~~~~~~~~~~~~~~~~~~~~~~~ | ~~~~  |
+----+----+------------------------------------------------------------+----+
| [O]| ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ | ~~~~~~~~~~~~~~~~~~~~~~~~~ | ~~~~  |
+----+----+------------------------------------------------------------+----+

Legend: [O] = circular skeleton (avatar)
        ~~~ = animated rectangular skeleton placeholder
```

### Skeleton Specifications

| Element | Shape | Size | Color | Animation |
|---------|-------|------|-------|-----------|
| Avatar | Circle | 36px diameter | `$gray-200` | Shimmer pulse (1.5s ease-in-out infinite) |
| Name line | Rectangle | 60% width x 14px | `$gray-200` | Shimmer pulse |
| Email line | Rectangle | 80% width x 14px | `$gray-200` | Shimmer pulse |
| Badge placeholders | Pill | 60px x 20px | `$gray-200` | Shimmer pulse |
| Status dot + label | Circle 8px + rect 50px x 12px | -- | `$gray-200` | Shimmer pulse |
| Row count | 5 skeleton rows | -- | -- | -- |

### Implementation Note

Use PrimeNG `p-skeleton` component:
- `<p-skeleton shape="circle" [size]="'36px'" />`
- `<p-skeleton width="60%" height="14px" />`
- `<p-skeleton borderRadius="9999px" width="60px" height="20px" />`

---

## 8. Identity Provider List -- Populated State

This section documents how the identity provider cards appear when data is loaded (the "happy path" after the current empty state).

### 8.1 Provider Card Layout

Uses the existing `provider-grid` layout from `provider-list.component.scss`:
`display: grid; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); gap: 1.25rem;`

### 8.2 Individual Provider Card Wireframe

```
+------------------------------------------+
|  [KC icon]  Keycloak Corporate      [Enabled] |
|             Keycloak                       |
|------------------------------------------|
|  Protocol       [OIDC]                    |
|  Internal Name  keycloak-corp             |
|  Last Tested    * 3h ago                  |
|------------------------------------------|
|  [check] [edit] [trash]     [=== toggle] |
+------------------------------------------+
```

### 8.3 Card Element Specifications

#### Card Header

| Element | Specification |
|---------|---------------|
| Provider icon | 40x40px, `object-fit: contain`. Falls back to `shield.svg`. |
| Display name | 15px (0.9375rem), weight 600, `$gray-800`. Truncate with ellipsis. |
| Provider type | 12px (0.75rem), `$gray-500`. Maps type enum to display name. |
| Status badge | Pill badge: `Enabled` = green bg (`$success-light`) + green text (`$success`); `Disabled` = gray bg (`$gray-100`) + gray text (`$gray-500`). Font: 11px, weight 500, uppercase. |

#### Card Body

| Row | Label | Value Format |
|-----|-------|-------------|
| Protocol | "Protocol" (13px, `$gray-500`) | Protocol badge (OIDC = teal bg; SAML = amber bg; LDAP = gray bg; OAuth2 = purple bg). 11px, weight 600, uppercase. |
| Internal Name | "Internal Name" (13px, `$gray-500`) | Monospace text (JetBrains Mono / Fira Code), 12px, gray-100 bg, 2px 6px padding, 4px radius. |
| Last Tested | "Last Tested" (13px, `$gray-500`) | Dot indicator (8px circle: green = success, red = failure, amber = pending) + relative time string. |

#### Card Footer

| Element | Specification |
|---------|---------------|
| Test connection button | 32x32 icon button, checkmark SVG. Tooltip: "Test Connection". Shows spinner when testing. |
| Edit button | 32x32 icon button, pencil SVG. Tooltip: "Edit Provider". |
| Delete button | 32x32 icon button, trash SVG. `btn-danger` class -- hover shows red bg. Tooltip: "Delete Provider". |
| Enable/disable toggle | Custom toggle switch: 40x22px, `$gray-300` off / `$teal` on. Thumb: 18px white circle with shadow. |

### 8.4 Provider Card States

| State | Visual Change |
|-------|---------------|
| Default (enabled) | Full opacity, normal border |
| Default (disabled) | `opacity: 0.7`, provider icon has `grayscale(0.5)` filter |
| Hover | `box-shadow: $shadow-md` elevation increase |
| Focus-visible | 2px solid `$teal` outline, 2px offset |
| Testing connection | Test button shows `spinner-sm`, button disabled |
| Delete confirmation | Modal overlay with confirmation dialog |

---

## 9. Accessibility Requirements

### 9.1 ARIA Attributes for Tab Navigation

```html
<nav class="factsheet-tabs" role="tablist" aria-label="Tenant detail sections">
  <button role="tab"
          id="tab-overview"
          aria-selected="true|false"
          aria-controls="panel-overview"
          tabindex="0|-1">
    Overview
  </button>
  <!-- ... repeat for each tab ... -->
  <button role="tab"
          id="tab-users"
          aria-selected="true|false"
          aria-controls="panel-users"
          tabindex="0|-1">
    Users
  </button>
</nav>

<div role="tabpanel"
     id="panel-users"
     aria-labelledby="tab-users"
     tabindex="0">
  <!-- Users tab content -->
</div>
```

**Keyboard behavior for tabs:**
- Left/Right arrow keys move focus between tabs
- Home key moves to first tab
- End key moves to last tab
- Enter/Space activates the focused tab
- Only the active tab has `tabindex="0"`; others have `tabindex="-1"`

### 9.2 ARIA for User Table

```html
<p-table aria-label="Tenant user list"
         role="grid"
         [ariaLabel]="'User list showing ' + totalRecords + ' users'">
```

| Element | ARIA Attribute | Value |
|---------|---------------|-------|
| Table | `aria-label` | "Tenant user list" |
| Sort header | `aria-sort` | "ascending" / "descending" / "none" |
| Avatar | `aria-hidden` | "true" (decorative) |
| Full Name cell | -- | Serves as row label |
| Role badges | `aria-label` | "Roles: Admin, Manager" (combined) |
| Status indicator | `aria-label` | "Status: Active" |
| Action menu button | `aria-label` | "Actions for [user name]" |
| Action menu button | `aria-haspopup` | "menu" |
| Action menu button | `aria-expanded` | "true" / "false" |

### 9.3 Keyboard Navigation for Table Rows

| Key | Behavior |
|-----|----------|
| Tab | Moves focus to next interactive element (search, filter, table, pagination) |
| Up/Down Arrow | Moves focus between table rows when table is focused |
| Enter | On a row: opens View Details; On action button: opens menu |
| Escape | Closes any open action menu or dialog |
| Space | On toggle: toggles state; On checkbox: toggles selection |

### 9.4 Screen Reader Announcements

| Event | Announcement | Implementation |
|-------|-------------|----------------|
| Filter applied | "{N} users found" | `aria-live="polite"` on results count region |
| User disabled | "User [name] has been disabled" | Toast announcement via `aria-live="assertive"` |
| User enabled | "User [name] has been enabled" | Toast announcement via `aria-live="assertive"` |
| Password reset sent | "Password reset email sent to [email]" | Toast announcement via `aria-live="polite"` |
| Role updated | "Roles updated for [name]" | Toast announcement via `aria-live="polite"` |
| Tab changed | Tab panel content announced automatically by role="tabpanel" | Built-in |
| Page changed | "Showing users {first} to {last} of {total}" | `aria-live="polite"` on paginator summary |

### 9.5 Color Contrast Compliance

All color pairings meet WCAG 2.1 AA minimums (4.5:1 for normal text, 3:1 for large text):

| Element | Foreground | Background | Ratio | Pass |
|---------|------------|------------|-------|------|
| Body text | `#334155` | `#ffffff` | 10.1:1 | AAA |
| Muted text | `#545e6e` | `#ffffff` | 7.01:1 | AAA |
| Tab active | `#047481` | `#ffffff` | 5.42:1 | AA |
| Teal button text | `#ffffff` | `#047481` | 5.42:1 | AA |
| Active badge (green) | `#22c55e` | `#ecfdf5` | 3.03:1 | AA-Large* |
| Inactive badge | `#495567` | `#edf2f7` | 5.98:1 | AAA |
| Locked badge | `#ef4444` | `#fef2f2` | 4.53:1 | AA |
| Super Admin badge | `#7c3aed` | tinted bg | 4.68:1 | AA |

*Active status also uses a green dot indicator (non-text, 3:1 sufficient) combined with the text label "Active", so color is never the sole indicator.

### 9.6 Focus Management

| Scenario | Focus Target |
|----------|-------------|
| Tab changed to "Users" | First interactive element in Users panel (search input) |
| Modal opened (disable/reset) | First focusable element in modal (close button or cancel) |
| Modal closed | Return focus to the triggering action menu button |
| Dialog confirmed (user disabled) | Return focus to the same row's action button |
| User added | First row in the refreshed table |
| Filter applied | Remain on filter control |

---

## 10. Responsive Behavior

### 10.1 Breakpoint Definitions

| Breakpoint | Range | Layout | View Toggle |
|------------|-------|--------|-------------|
| Desktop | > 1024px | Card or Table (user choice via toggle) | Visible, both options available |
| Tablet | 768px -- 1024px | Card or Table (6 columns, hide Last Login) | Visible, both options available |
| Mobile | < 768px | Card-only (forced grid view) | Hidden (auto-switches to grid) |

**Mobile auto-switch:** On viewports < 768px, force `userListView.set('grid')` and hide the toggle buttons. Restore previous selection when viewport expands.

### 10.2 Desktop Layout (>1024px)

```
+============================================================================+
| [Header: Title + Description]          [grid][table]    [+ Add User]       |
+============================================================================+
| [Q Search users...                    ]  [Role: All v]  [Status: All v]   |
+============================================================================+
| [AV] Full Name         | Email              | Roles      | Status | Last  |
|      Username           |                    |            |        | Login |
+----+--------------------+--------------------+------------+--------+-------+
| MA  Mohamed Al-Rashid   | m.rashid@t.com     | [Admin]    | * Act  | 2h    |
|     m.rashid             |                    | [Manager]  |        | ago   |
+----+--------------------+--------------------+------------+--------+-------+
| SK  Sarah Kim           | s.kim@t.com        | [User]     | * Act  | 1d    |
|     s.kim                |                    |            |        | ago   |
+----+--------------------+--------------------+------------+--------+-------+
|                  Showing 1-10 of 47 users     [10 v] [< 1 2 3 4 5 >]     |
+============================================================================+
```

All columns visible. Filters in single horizontal row.

### 10.3 Tablet Layout (768px -- 1024px)

```
+====================================================+
| [Header: Title + Description]       [+ Add User]   |
+====================================================+
| [Q Search users...           ]                     |
| [Role: All v]  [Status: All v]                     |
+====================================================+
| [AV] Name          | Email        | Roles   | St  |
+-----+---------------+--------------+---------+-----+
| MA   M. Al-Rashid   | m.rash...   | [Admin] | *   |
+-----+---------------+--------------+---------+-----+
| SK   Sarah Kim      | s.kim@...   | [User]  | *   |
+-----+---------------+--------------+---------+-----+
|         Showing 1-10 of 47    [10 v] [< 1 2 >]    |
+====================================================+
```

Changes from desktop:
- **Last Login column hidden** (`display: none` via media query)
- **Actions column** compressed to icon-only kebab menu (no inline buttons)
- **Search bar** takes full width on its own row; filters wrap to second row
- **Email** truncated more aggressively (max-width: 160px)
- **Full Name** shows shortened format if needed

### 10.4 Mobile Layout (<768px)

On mobile, the table is replaced with a **card-based layout** for each user.

```
+========================================+
| Tenant Users                           |
| Manage user accounts...                |
|                         [+ Add User]   |
+========================================+
| [Q Search users...                   ] |
| [Role: All v]  [Status: All v]        |
+========================================+
|                                        |
|  +----------------------------------+  |
|  | [MA]  Mohamed Al-Rashid  * Active|  |
|  |       m.rashid@tenant.com        |  |
|  |       [Admin] [Manager]          |  |
|  |       Last login: 2h ago    [...] |  |
|  +----------------------------------+  |
|                                        |
|  +----------------------------------+  |
|  | [SK]  Sarah Kim          * Active|  |
|  |       s.kim@tenant.com           |  |
|  |       [User]                     |  |
|  |       Last login: 1d ago    [...] |  |
|  +----------------------------------+  |
|                                        |
|  +----------------------------------+  |
|  | [JD]  John Doe         o Inactive|  |
|  |       j.doe@tenant.com           |  |
|  |       [Viewer]                   |  |
|  |       Last login: Never     [...] |  |
|  +----------------------------------+  |
|                                        |
|  Showing 1-10 of 47   [< 1 2 3 4 >]  |
+========================================+
```

#### Mobile User Card Specifications

| Element | Position | Style |
|---------|----------|-------|
| Avatar | Top-left | 36px circle, inline with name |
| Name + Status | Top row | Name (14px, weight 500), status badge floated right |
| Email | Second row | 13px, `$gray-500`, full width |
| Roles | Third row | Horizontal badge list, wrapping |
| Last Login + Actions | Fourth row | Left: last login text (13px, `$gray-400`); Right: kebab menu button |
| Card | Container | White bg, 1px `$gray-200` border, 8px radius, 16px padding, 12px gap between cards |

#### Mobile Card Interaction

- Tap card to expand (optional: accordion-style detail view)
- Tap kebab menu to show action sheet (bottom sheet on mobile instead of dropdown)
- Swipe actions not implemented (avoids accessibility issues with gesture-only interactions)

---

## 11. PrimeNG 21 Component Mapping

### 11.1 Complete Component Map

| UI Element | PrimeNG 21 Component | Module Import | Key Properties |
|------------|---------------------|---------------|----------------|
| User table | `p-table` | `TableModule` | `[value]`, `[paginator]="true"`, `[rows]="10"`, `[rowsPerPageOptions]="[10,25,50]"`, `[lazy]="true"`, `sortMode="single"`, `[showCurrentPageReport]="true"` |
| Search input | `p-inputtext` + `p-iconfield` | `InputTextModule`, `IconFieldModule` | `pInputText`, left icon (magnifying glass) |
| Role filter | `p-select` | `SelectModule` | `[options]="roleOptions"`, `placeholder="All Roles"`, `[showClear]="true"` |
| Status filter | `p-select` | `SelectModule` | `[options]="statusOptions"`, `placeholder="All Statuses"`, `[showClear]="true"` |
| User avatar | `p-avatar` | `AvatarModule` | `[label]="initials"`, `shape="circle"`, `[size]="'normal'"`, `[style]="avatarStyle"` |
| Role badges | `p-tag` | `TagModule` | `[value]="role"`, `[severity]` or custom `[style]` |
| Pagination | `p-paginator` (built into p-table) | `TableModule` | `currentPageReportTemplate="Showing {first} to {last} of {totalRecords} users"` |
| Action menu | `p-menu` | `MenuModule` | `[popup]="true"`, `[model]="menuItems"`, `appendTo="body"` |
| Confirm disable | `p-confirmdialog` | `ConfirmDialogModule` | `[header]`, `[message]`, `acceptButtonStyleClass="p-button-danger"` |
| Confirm reset | `p-confirmdialog` | `ConfirmDialogModule` | `[header]`, `[message]` |
| Edit roles dialog | `p-dialog` | `DialogModule` | `[modal]="true"`, `[draggable]="false"`, `[closable]="true"` |
| Role checkboxes | `p-checkbox` | `CheckboxModule` | `[binary]="false"`, `[value]="role"` |
| Loading skeletons | `p-skeleton` | `SkeletonModule` | `shape="circle"` / `shape="rectangle"`, `[width]`, `[height]` |
| Toast notifications | `p-toast` | `ToastModule` | `position="bottom-right"`, `life="5000"` |
| Empty state button | `p-button` | `ButtonModule` | `label="Add First User"`, `icon="pi pi-plus"`, `severity="primary"` |

### 11.2 Module Import Summary

```typescript
import { TableModule } from 'primeng/table';
import { InputTextModule } from 'primeng/inputtext';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { SelectModule } from 'primeng/select';
import { AvatarModule } from 'primeng/avatar';
import { TagModule } from 'primeng/tag';
import { MenuModule } from 'primeng/menu';
import { ButtonModule } from 'primeng/button';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogModule } from 'primeng/dialog';
import { CheckboxModule } from 'primeng/checkbox';
import { SkeletonModule } from 'primeng/skeleton';
import { ToastModule } from 'primeng/toast';
```

### 11.3 ThinkPlus Theme Token Mapping

PrimeNG 21 uses a 3-tier design token architecture (primitive, semantic, component). The ThinkPlus preset already maps `primary` to the teal palette. The following component tokens will automatically inherit correct colors:

| PrimeNG Token | ThinkPlus Value | Applies To |
|---------------|-----------------|------------|
| `--p-primary-color` | `#047481` | Buttons, toggles, focus rings |
| `--p-primary-contrast-color` | `#ffffff` | Button text |
| `--p-primary-hover-color` | `#035a66` | Button hover |
| `--p-surface-0` | `#ffffff` | Card backgrounds |
| `--p-surface-50` | `#f7fafc` | Section backgrounds |
| `--p-surface-200` | `#e2e8f0` | Borders |
| `--p-text-color` | `#1a202c` | Body text |
| `--p-text-muted-color` | `#545e6e` | Secondary text |
| `--p-content-border-radius` | `0.5rem` | Card radius |
| `--p-focus-ring-color` | `#058a99` | Focus outlines |
| `--p-focus-ring-shadow` | `0 0 0 3px rgba(4,116,129,0.4)` | Focus glow |

---

## 12. Interaction State Matrix

Every interactive element must have defined visual states.

### 12.1 "+ Add User" Button

| State | Background | Border | Text | Shadow | Cursor |
|-------|------------|--------|------|--------|--------|
| Default | `#047481` | `#047481` | `#ffffff` | none | pointer |
| Hover | `#035a66` | `#035a66` | `#ffffff` | none | pointer |
| Focus-visible | `#047481` | `#047481` | `#ffffff` | `0 0 0 3px rgba(4,116,129,0.4)` | -- |
| Active (pressed) | `#024e5a` | `#024e5a` | `#ffffff` | none | pointer |
| Disabled | `#047481` | `#047481` | `#ffffff` | none | not-allowed |
| Disabled opacity | 0.5 | -- | -- | -- | -- |

### 12.2 Search Input

| State | Border | Background | Shadow |
|-------|--------|------------|--------|
| Default | 1px `$gray-300` | `#ffffff` | none |
| Hover | 1px `$gray-400` | `#ffffff` | none |
| Focus | 1px `#047481` | `#ffffff` | `0 0 0 3px rgba(4,116,129,0.25)` |
| Filled | 1px `$gray-300` | `#ffffff` | none |
| Error | 1px `$danger` | `#ffffff` | `0 0 0 3px rgba(239,68,68,0.2)` |
| Disabled | 1px `$gray-200` | `$gray-50` | none |

### 12.3 Table Row

| State | Background | Border-bottom |
|-------|------------|---------------|
| Default (even) | `#ffffff` | 1px `$gray-100` |
| Default (odd) | `$gray-50` | 1px `$gray-100` |
| Hover | `rgba(4,116,129,0.04)` | 1px `$gray-200` |
| Focus-within | `rgba(4,116,129,0.06)` | 1px `#047481` |
| Selected | `rgba(4,116,129,0.08)` | 1px `#047481` |

### 12.4 Action Menu Button (Kebab)

| State | Background | Color |
|-------|------------|-------|
| Default | transparent | `$gray-400` |
| Hover | `$gray-100` | `$gray-700` |
| Focus-visible | transparent | `$gray-700` + 2px teal outline |
| Active | `$gray-200` | `$gray-800` |

### 12.5 Toggle Switch (Provider Enable/Disable)

| State | Track Color | Thumb Position |
|-------|------------|----------------|
| Off | `$gray-300` | Left (2px from left edge) |
| Off + Hover | `$gray-400` | Left |
| On | `#047481` | Right (translateX 18px) |
| On + Hover | `#035a66` | Right |
| Focus-visible | Either + 3px teal outline | Current |
| Disabled | Either at 50% opacity | Current, cursor: not-allowed |

---

## 13. RTL / Arabic Layout Considerations

### 13.1 General Rules

| Property | LTR | RTL |
|----------|-----|-----|
| Text alignment | left | right |
| Flex direction | row | row-reverse (where applicable) |
| Table column order | Left-to-right | Right-to-left |
| Padding/margin shortcuts | `padding-left` | `padding-inline-start` (use logical properties) |
| Icons that imply direction | Arrow right for "next" | Arrow left for "next" |
| Avatar position | Left of name | Right of name |
| Action menu | Right of row | Left of row |
| Search icon | Left inside input | Right inside input |

### 13.2 CSS Logical Properties

Use CSS logical properties throughout to ensure automatic RTL support:

```css
/* AVOID */
padding-left: 16px;
margin-right: 8px;
text-align: left;
border-left: 4px solid $success;

/* USE INSTEAD */
padding-inline-start: 16px;
margin-inline-end: 8px;
text-align: start;
border-inline-start: 4px solid $success;
```

### 13.3 Arabic-Specific Typography

| Property | Value |
|----------|-------|
| Font family fallback | `'Gotham Rounded', 'Nunito', 'Noto Sans Arabic', 'Segoe UI', sans-serif` |
| Line height | Increase from 1.5 to 1.6 for Arabic script |
| Letter spacing | Reset to 0 (Arabic does not use letter-spacing) |
| Word spacing | Slightly increased for readability |

### 13.4 Bidirectional Badge Text

Role badges may contain Arabic text. Apply `dir="auto"` on badge content:

```html
<p-tag [value]="role.displayName" dir="auto" />
```

### 13.5 Table Sort Indicator Direction

Sort arrows (ascending/descending) remain the same in RTL (up = ascending, down = descending). Column header layout mirrors.

---

## Appendix A: Data Model Reference (User Entity)

For DEV agent reference, the Users tab expects the following data shape from the API:

```typescript
interface TenantUser {
  id: string;                    // UUID
  tenantId: string;              // UUID
  firstName: string;
  lastName: string;
  email: string;
  username: string;              // Keycloak login name
  roles: UserRole[];             // Array of assigned roles
  status: 'active' | 'inactive' | 'locked';
  avatarUrl?: string;            // Optional avatar image URL
  lastLoginAt?: string;          // ISO 8601 datetime or null
  createdAt: string;             // ISO 8601 datetime
  updatedAt: string;             // ISO 8601 datetime
}

type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'MANAGER' | 'USER' | 'VIEWER';

interface UserListResponse {
  users: TenantUser[];
  totalRecords: number;
  page: number;
  pageSize: number;
}

interface UserListRequest {
  tenantId: string;
  search?: string;               // Free-text search
  role?: UserRole;               // Filter by role
  status?: 'active' | 'inactive' | 'locked';
  page: number;                  // 0-indexed
  pageSize: number;              // 10, 25, or 50
  sortField?: 'fullName' | 'email' | 'status' | 'lastLoginAt';
  sortOrder?: 'asc' | 'desc';
}
```

---

## Appendix B: File Structure (Proposed)

```
frontend/src/app/features/admin/users/
  index.ts                              # Public API barrel export
  models/
    user.model.ts                       # TenantUser, UserRole, request/response interfaces
  services/
    user-admin.service.ts               # HTTP service for user CRUD
    user-admin.service.spec.ts          # Unit tests
  components/
    user-list/
      user-list.component.ts            # Table/card list (reusable)
      user-list.component.scss
      user-list.component.spec.ts
    user-embedded/
      user-embedded.component.ts        # Embedded wrapper (like ProviderEmbeddedComponent)
      user-embedded.component.scss
      user-embedded.component.spec.ts
    user-role-editor/
      user-role-editor.component.ts     # Role editing dialog
      user-role-editor.component.spec.ts
```

This mirrors the existing `features/admin/identity-providers/` structure for consistency.

---

## Appendix C: Test Scenarios for QA-INT Agent

| Scenario | Steps | Expected Result |
|----------|-------|-----------------|
| Empty state renders | Navigate to Users tab for tenant with no users | Empty state icon, title, description, and "Add First User" button visible |
| Loading skeleton shows | Navigate to Users tab (API delayed) | 5 skeleton rows with animated shimmer |
| User list renders | Navigate to Users tab with users | Table shows avatar, name, email, roles, status, last login, actions |
| Search filters users | Type "Mohamed" in search | Table filters to matching rows; result count announced |
| Role filter works | Select "Admin" from role dropdown | Only users with Admin role shown |
| Status filter works | Select "Locked" from status dropdown | Only locked users shown |
| Pagination works | Click page 2 | Table shows users 11-20; paginator summary updates |
| Rows per page changes | Select 25 from rows selector | Table shows 25 rows |
| Sort by name | Click "Full Name" header | Rows sorted alphabetically; aria-sort updated |
| Disable user | Kebab > Disable > Confirm | User status changes to inactive; toast shown; screen reader announcement |
| Enable user | Kebab > Enable on inactive user | User status changes to active; toast shown |
| Reset password | Kebab > Reset Password > Confirm | Toast: "Password reset email sent"; screen reader announcement |
| Edit roles | Kebab > Edit Roles > Toggle roles > Save | Roles updated; dialog closes; badges refreshed |
| Tab keyboard nav | Arrow keys on tab bar | Focus moves between tabs; Enter activates |
| Table keyboard nav | Tab into table, arrow keys | Focus moves between rows |
| Mobile card layout | Viewport < 768px | Cards shown instead of table |
| Tablet hides column | Viewport 768-1024px | Last Login column hidden |
| RTL layout | Set `dir="rtl"` on document | All elements mirror correctly |
| Focus returns after modal | Close disable confirmation | Focus returns to triggering action button |
