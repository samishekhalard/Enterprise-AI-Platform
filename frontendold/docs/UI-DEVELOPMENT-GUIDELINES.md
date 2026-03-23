# UI Development Guidelines

**Document Version:** 1.0.0
**Status:** DRAFT
**Last Updated:** 2026-02-22

---

## Overview

This document defines the UI development standards and patterns for the EMS frontend application. All new pages and components must follow these guidelines to ensure consistency, maintainability, and accessibility.

---

## Containerized Layout Structure

Every page in the application must follow this standardized container layout:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        HEADER CONTAINER                                 │
│   (Fixed position, floating islands - Miro-style)                      │
├────────────────────────────────────────────────────────────────────────┤
│                      BREADCRUMB CONTAINER                               │
│   (Page navigation path, actions)                                       │
├──────────────┬─────────────────────────────────────────────────────────┤
│              │                                                          │
│    DOCKER    │                                                          │
│   CONTAINER  │               MAIN CONTAINER                             │
│   (Sidebar)  │                                                          │
│              │   (Primary content area - scrollable)                    │
│   - Nav      │                                                          │
│   - Filters  │                                                          │
│   - Context  │                                                          │
│              │                                                          │
├──────────────┴─────────────────────────────────────────────────────────┤
│                        FOOTER CONTAINER                                 │
│   (Copyright, version, links)                                          │
└────────────────────────────────────────────────────────────────────────┘
```

---

## Container Specifications

### 1. Header Container

**Purpose:** Global navigation, branding, user controls

**Implementation:** Already implemented in `app.html` and `app.scss`

| Property | Value |
|----------|-------|
| Position | Fixed, top |
| Height | Auto (floating islands) |
| Background | Transparent (islands are white) |
| Z-index | 1000 |
| Padding | 20px 48px (desktop: 24px 56px) |

**Contents:**
- Left Island: Hamburger menu, Logo, Page indicator, Options
- Right Island: Notifications, Help, User dropdown

---

### 2. Breadcrumb Container

**Purpose:** Page navigation path only - NO customization allowed

**IMPORTANT:** The breadcrumb container is a standard component with consistent styling across ALL pages. Do not add custom elements (titles, actions, buttons) to this container. All page-specific UI goes in the Main Container.

| Property | Value |
|----------|-------|
| Position | Below header, above main content |
| Height | 48px |
| Background | White (#ffffff) |
| Border | Bottom border (1px #e2e8f0) |
| Padding | 12px 24px (desktop: 12px 32px) |

**Contents (ONLY):**
- Navigation trail: `Home / Section / Current Page`

**Example Structure:**
```html
<!-- Breadcrumb Container (Standard - No Customization) -->
<div class="breadcrumb-container">
  <nav class="breadcrumb-nav" aria-label="Breadcrumb">
    <a routerLink="/" class="breadcrumb-link">Home</a>
    <span class="breadcrumb-separator">/</span>
    <a routerLink="/admin" class="breadcrumb-link">Administration</a>
    <span class="breadcrumb-separator">/</span>
    <span class="breadcrumb-current">Users</span>
  </nav>
</div>

<!-- Main Container (Page-specific content goes here) -->
<div class="main-container">
  <!-- Page title, actions, content -->
</div>
```

**Shared Styles:** Import from `src/styles/_breadcrumb.scss`
```scss
@import '../../../styles/breadcrumb';
```

**Standard Styles (DO NOT MODIFY):**
```scss
.breadcrumb-container {
  display: flex;
  align-items: center;
  padding: 12px 24px;
  background: #ffffff;
  border-bottom: 1px solid #e2e8f0;
  flex-shrink: 0;
  min-height: 48px;
}

.breadcrumb-nav {
  display: flex;
  align-items: center;
  gap: 8px;
  font-family: 'Gotham Rounded', 'Nunito', sans-serif;
  font-size: 14px;
}

.breadcrumb-link {
  color: #545e6e;
  text-decoration: none;
  &:hover { color: #047481; }
}

.breadcrumb-separator {
  color: #cbd5e0;
}

.breadcrumb-current {
  color: #1a202c;
  font-weight: 600;
}
```

---

### 3. Docker Container (Sidebar)

**Purpose:** Contextual navigation, filters, secondary actions

**IMPORTANT:** The Docker container has standardized styling, sizing, and positioning. Do not customize dimensions or core styling. Only the content (nav items, filters) varies per page.

| Property | Value |
|----------|-------|
| Width | 240px (fixed) |
| Width (collapsed) | 64px |
| Background | White (#ffffff) |
| Border | Right border (1px #e2e8f0) |
| Header Height | 56px |
| Position | Static (mobile: fixed slide-in) |

**When to Use:**
- Pages with sub-navigation (Settings tabs)
- Pages with persistent filters (User list)
- Pages with tree navigation (File browser)

**When NOT to Use:**
- Simple CRUD pages
- Modal-heavy workflows
- Full-width content (Process modeler, BPMN editor)

**Shared Styles:** Import from `src/styles/_docker.scss`
```scss
@import '../../../styles/docker';
```

**Example Structure:**
```html
<!-- Docker Container (Standard - No dimension customization) -->
<aside class="docker-container" [class.collapsed]="sidebarCollapsed()">
  <div class="docker-header">
    <h3 class="docker-title">Settings</h3>
    <button class="docker-toggle" (click)="toggleSidebar()">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <polyline points="15 18 9 12 15 6"/>
      </svg>
    </button>
  </div>
  <nav class="docker-nav">
    <a class="docker-nav-item" routerLink="profile" routerLinkActive="active">
      <span class="docker-nav-icon"><img src="icon.svg" alt=""></span>
      <span class="docker-nav-label">Profile</span>
    </a>
    <a class="docker-nav-item" routerLink="security" routerLinkActive="active">
      <span class="docker-nav-icon"><img src="icon.svg" alt=""></span>
      <span class="docker-nav-label">Security</span>
      <span class="docker-nav-badge">3</span>
    </a>
  </nav>
</aside>

<!-- Main Container -->
<div class="main-container">
  <!-- Page content -->
</div>
```

**Standard Dimensions (DO NOT MODIFY):**
```scss
$docker-width: 240px;
$docker-width-collapsed: 64px;
$docker-header-height: 56px;
```

**Mobile Behavior:**
- Slides in from left as overlay
- Backdrop covers content when open
- Width remains 240px

---

### 4. Main Container

**Purpose:** Primary content area for the page

| Property | Value |
|----------|-------|
| Position | Relative |
| Flex | 1 (fills remaining space) |
| Background | $gray-50 (#faf9f5) or white |
| Padding | 24px (desktop: 32px) |
| Overflow | Auto (scrollable) |
| Min-height | Fill viewport |

**Example Structure:**
```html
<main class="main-container">
  <!-- Page content goes here -->
  <div class="content-section">
    <h2 class="section-title">Section Title</h2>
    <!-- Content -->
  </div>
</main>
```

**Styles:**
```scss
.main-container {
  flex: 1;
  padding: 24px;
  overflow-y: auto;
  background: #faf9f5;

  @media (min-width: $breakpoint-lg) {
    padding: 32px;
  }

  @media (min-width: $breakpoint-2k) {
    padding: 40px;
  }
}

.content-section {
  background: $white;
  border-radius: $radius-md;
  padding: 24px;
  margin-bottom: 24px;
  box-shadow: $shadow-sm;
}

.section-title {
  font-size: 18px;
  font-weight: 600;
  color: $gray-700;
  margin: 0 0 16px 0;
}
```

---

### 5. Footer Container (Floating Island)

**Purpose:** Copyright, version info, legal links

**Implementation:** Floating island style matching the header

| Property | Value |
|----------|-------|
| Position | Absolute, bottom, centered |
| Background | White (island) |
| Border-radius | 16px ($radius-lg) |
| Box-shadow | $shadow-lg |
| Padding | 10px 16px |
| Z-index | 100 |
| Pointer-events | none (container), auto (island) |

**Structure:**
```html
<footer class="app-footer">
  <div class="footer-island">
    <div class="footer-section footer-left">
      <span class="footer-copyright">© 2024 ThinkPLUS</span>
    </div>
    <div class="footer-divider"></div>
    <div class="footer-section footer-center">
      <span class="footer-version">v1.0.0</span>
    </div>
    <div class="footer-divider"></div>
    <div class="footer-section footer-right">
      <a href="#" class="footer-link">Privacy</a>
      <a href="#" class="footer-link">Terms</a>
      <a href="#" class="footer-link">Support</a>
    </div>
  </div>
</footer>
```

**Contents:**
- Left section: Copyright notice
- Center section: Version info
- Right section: Privacy, Terms, Support links
- Dividers between sections (matching header island style)

---

## Page Layout Templates

### Template 1: List Page (with sidebar filters)

```
┌────────────────────────────────────────────────────────────┐
│ Header                                                      │
├────────────────────────────────────────────────────────────┤
│ Breadcrumb: Home > Admin > Users          [Create User]    │
├──────────────┬─────────────────────────────────────────────┤
│ Filters      │ Search: [_______________] [Search]          │
│              │                                              │
│ Status       │ ┌─────────────────────────────────────────┐ │
│ ○ All        │ │ Name           Email          Status    │ │
│ ○ Active     │ ├─────────────────────────────────────────┤ │
│ ○ Inactive   │ │ John Doe       john@...       Active    │ │
│              │ │ Jane Smith     jane@...       Active    │ │
│ Role         │ │ Bob Wilson     bob@...        Inactive  │ │
│ ○ Admin      │ └─────────────────────────────────────────┘ │
│ ○ User       │                                              │
│ ○ Viewer     │ Showing 1-10 of 45         [< 1 2 3 4 5 >] │
├──────────────┴─────────────────────────────────────────────┤
│ Footer                                                      │
└────────────────────────────────────────────────────────────┘
```

### Template 2: Detail Page (with tabs)

```
┌────────────────────────────────────────────────────────────┐
│ Header                                                      │
├────────────────────────────────────────────────────────────┤
│ Breadcrumb: Home > Admin > Users > John Doe    [Edit]      │
├────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ [Avatar]  John Doe                                    │  │
│  │           john.doe@company.com                        │  │
│  │           Software Engineer • Engineering             │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
│  [Profile] [Sessions] [Devices] [Licenses] [Activity]      │
│  ─────────────────────────────────────────────────────     │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Tab Content                                           │  │
│  │                                                       │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
├────────────────────────────────────────────────────────────┤
│ Footer                                                      │
└────────────────────────────────────────────────────────────┘
```

### Template 3: Dashboard Page (cards layout)

```
┌────────────────────────────────────────────────────────────┐
│ Header                                                      │
├────────────────────────────────────────────────────────────┤
│ Breadcrumb: Home > Admin > Licenses                        │
├────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐             │
│  │ Total      │ │ Assigned   │ │ Available  │             │
│  │ 100 seats  │ │ 75 seats   │ │ 25 seats   │             │
│  └────────────┘ └────────────┘ └────────────┘             │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ License Breakdown                                     │  │
│  │                                                       │  │
│  │ [Chart: Pie or Bar visualization]                    │  │
│  │                                                       │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Recent Assignments                                    │  │
│  │ - John Doe assigned Pro license (2 hours ago)        │  │
│  │ - Jane Smith assigned Pro license (1 day ago)        │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
├────────────────────────────────────────────────────────────┤
│ Footer                                                      │
└────────────────────────────────────────────────────────────┘
```

### Template 4: Full-width Page (no sidebar)

```
┌────────────────────────────────────────────────────────────┐
│ Header                                                      │
├────────────────────────────────────────────────────────────┤
│ Breadcrumb: Home > Processes > Process Editor              │
├────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │                                                       │  │
│  │                                                       │  │
│  │              Full-width content area                  │  │
│  │              (Canvas, editor, etc.)                   │  │
│  │                                                       │  │
│  │                                                       │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
├────────────────────────────────────────────────────────────┤
│ Footer                                                      │
└────────────────────────────────────────────────────────────┘
```

---

## Component Guidelines

### Page Component Structure

Every page component should follow this structure:

```typescript
@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './user-list.page.html',
  styleUrl: './user-list.page.scss'
})
export class UserListPage {
  // Signals for reactive state
  users = signal<User[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);

  // Pagination
  currentPage = signal(1);
  pageSize = signal(10);
  totalItems = signal(0);

  // Filters
  searchQuery = signal('');
  statusFilter = signal<string | null>(null);

  // Injected services
  private userService = inject(UserManagementService);

  constructor() {
    // Load data on init
    this.loadUsers();
  }

  loadUsers() {
    this.loading.set(true);
    this.userService.getUsers({
      page: this.currentPage(),
      size: this.pageSize(),
      search: this.searchQuery(),
      status: this.statusFilter()
    }).subscribe({
      next: (result) => {
        this.users.set(result.content);
        this.totalItems.set(result.totalElements);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err.message);
        this.loading.set(false);
      }
    });
  }
}
```

### Template Structure

```html
<!-- user-list.page.html -->
<div class="page-layout">
  <!-- Breadcrumb -->
  <div class="breadcrumb-container">
    <nav class="breadcrumb-nav" aria-label="Breadcrumb">
      <ol class="breadcrumb">
        <li class="breadcrumb-item"><a routerLink="/">Home</a></li>
        <li class="breadcrumb-item"><a routerLink="/admin">Administration</a></li>
        <li class="breadcrumb-item active" aria-current="page">Users</li>
      </ol>
    </nav>
    <div class="breadcrumb-actions">
      <button class="btn btn-primary" (click)="openCreateModal()">
        <svg><!-- plus icon --></svg>
        Create User
      </button>
    </div>
  </div>

  <!-- Content Area -->
  <div class="page-content">
    <!-- Optional: Sidebar -->
    @if (showSidebar()) {
      <aside class="docker-container">
        <!-- Filters -->
      </aside>
    }

    <!-- Main Content -->
    <main class="main-container">
      <!-- Loading State -->
      @if (loading()) {
        <div class="loading-state">
          <div class="spinner"></div>
          <span>Loading users...</span>
        </div>
      }

      <!-- Error State -->
      @if (error()) {
        <div class="error-state">
          <span class="error-message">{{ error() }}</span>
          <button class="btn btn-outline-primary" (click)="loadUsers()">Retry</button>
        </div>
      }

      <!-- Empty State -->
      @if (!loading() && !error() && users().length === 0) {
        <div class="empty-state">
          <svg><!-- empty icon --></svg>
          <h3>No users found</h3>
          <p>Create your first user to get started.</p>
          <button class="btn btn-primary" (click)="openCreateModal()">Create User</button>
        </div>
      }

      <!-- Content -->
      @if (!loading() && !error() && users().length > 0) {
        <div class="content-section">
          <!-- Table or cards -->
        </div>
      }
    </main>
  </div>
</div>
```

---

## Design Tokens

### Colors

```scss
// Brand Colors
$teal-dark: #035a66;
$teal: #047481;
$teal-light: #5ee7f7;

$blue-dark: #1a365d;
$blue: #2c5282;
$blue-light: #4299e1;

// Accent Colors
$gold: #b7791f;
$orange: #c05621;
$purple: #6b46c1;
$green: #276749;
$red: #c53030;

// Neutral Colors
$gray-50: #f7fafc;
$gray-100: #edf2f7;
$gray-200: #e2e8f0;
$gray-300: #cbd5e0;
$gray-400: #545e6e;
$gray-500: #454e5c;
$gray-600: #2d3748;
$gray-700: #1a202c;

$white: #ffffff;
$background: #faf9f5;
```

### Typography

```scss
// Font Family
$font-primary: 'Gotham Rounded', 'Nunito', -apple-system, BlinkMacSystemFont, sans-serif;

// Font Sizes
$font-xs: 0.75rem;    // 12px
$font-sm: 0.875rem;   // 14px
$font-base: 1rem;     // 16px
$font-lg: 1.125rem;   // 18px
$font-xl: 1.25rem;    // 20px
$font-2xl: 1.5rem;    // 24px
$font-3xl: 1.875rem;  // 30px

// Font Weights
$font-normal: 400;
$font-medium: 500;
$font-semibold: 600;
$font-bold: 700;
```

### Spacing

```scss
// Spacing Scale
$space-1: 4px;
$space-2: 8px;
$space-3: 12px;
$space-4: 16px;
$space-5: 20px;
$space-6: 24px;
$space-8: 32px;
$space-10: 40px;
$space-12: 48px;
$space-16: 64px;
```

### Shadows

```scss
$shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
$shadow-md: 0 2px 8px rgba(0, 0, 0, 0.08), 0 1px 2px rgba(0, 0, 0, 0.04);
$shadow-lg: 0 4px 16px rgba(0, 0, 0, 0.12), 0 2px 4px rgba(0, 0, 0, 0.06);
$shadow-xl: 0 8px 32px rgba(0, 0, 0, 0.16), 0 4px 8px rgba(0, 0, 0, 0.08);
```

### Border Radius

```scss
$radius-sm: 8px;
$radius-md: 12px;
$radius-lg: 16px;
$radius-xl: 20px;
$radius-full: 9999px;
```

---

## Accessibility Requirements

### WCAG 2.1 AA Compliance

1. **Color Contrast**
   - Text: Minimum 4.5:1 ratio
   - Large text (18px+): Minimum 3:1 ratio
   - Interactive elements: Minimum 3:1 ratio

2. **Keyboard Navigation**
   - All interactive elements must be keyboard accessible
   - Visible focus indicators required
   - Logical tab order

3. **Screen Readers**
   - Use semantic HTML elements
   - Add ARIA labels where needed
   - Use live regions for dynamic content

4. **Focus Management**
   - Skip links for main content
   - Focus trapping in modals
   - Return focus after modal close

### Required Attributes

```html
<!-- Images -->
<img src="..." alt="Descriptive text">

<!-- Buttons -->
<button aria-label="Close dialog" aria-describedby="help-text">

<!-- Forms -->
<label for="email">Email</label>
<input id="email" type="email" aria-required="true">

<!-- Navigation -->
<nav aria-label="Main navigation">

<!-- Tables -->
<table aria-label="User list">
  <caption class="sr-only">List of users with their status</caption>
```

---

## Responsive Breakpoints

```scss
// Mobile first approach
$breakpoint-sm: 640px;   // Small tablets
$breakpoint-md: 768px;   // Tablets
$breakpoint-lg: 992px;   // Laptops
$breakpoint-xl: 1200px;  // Desktops
$breakpoint-2k: 1920px;  // Large monitors
$breakpoint-4k: 3840px;  // 4K displays
```

### Sidebar Behavior

| Breakpoint | Sidebar Behavior |
|------------|------------------|
| < 768px | Hidden, hamburger menu |
| 768px - 992px | Collapsed (icons only) |
| > 992px | Expanded |

---

## File Naming Conventions

```
src/app/
├── pages/
│   ├── admin/
│   │   ├── users/
│   │   │   ├── user-list/
│   │   │   │   ├── user-list.page.ts
│   │   │   │   ├── user-list.page.html
│   │   │   │   └── user-list.page.scss
│   │   │   └── user-detail/
│   │   │       ├── user-detail.page.ts
│   │   │       ├── user-detail.page.html
│   │   │       └── user-detail.page.scss
│   │   ├── licenses/
│   │   └── audit/
├── components/
│   ├── shared/
│   │   ├── breadcrumb/
│   │   ├── data-table/
│   │   ├── pagination/
│   │   └── empty-state/
├── core/
│   ├── services/
│   │   ├── user-management.service.ts
│   │   ├── license-management.service.ts
│   │   └── audit-log.service.ts
│   └── models/
│       ├── user.model.ts
│       ├── license.model.ts
│       └── audit.model.ts
```

---

## Related Documents

- [Frontend Implementation Plan](./FRONTEND-IMPLEMENTATION-PLAN.md)
- [IAM Architecture](./architecture-and-principles/IAM-ARCHITECTURE.md)
