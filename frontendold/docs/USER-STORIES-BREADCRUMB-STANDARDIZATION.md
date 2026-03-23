# User Stories: Breadcrumb Standardization

**Epic:** UI Consistency - Breadcrumb Navigation
**Priority:** High
**Created:** 2026-02-22

---

## Problem Statement

The breadcrumb navigation styling is inconsistent across pages:

| Page | Current State |
|------|---------------|
| **Administration** | Floating text, transparent background, dot separator (•), fixed position below header |
| **Process Modeler** | White container bar, slash separator (/), static position |

The Administration page represents the **correct reference design** that should be applied system-wide.

---

## Reference Design (Administration Page)

```
┌──────────────────────────────────────────────────────────────┐
│              ┌─────────────────────────────────────────┐     │
│              │      HEADER (Floating Island)           │     │
│              └─────────────────────────────────────────┘     │
│                                                              │
│   Administration • Tenant Management                         │  ← Floating breadcrumb
│                                                              │
│   ┌────┐                                                     │
│   │Dock│     Main Content Area                              │
│   │    │                                                     │
│   └────┘                                                     │
│                                                              │
│              ┌─────────────────────────────────────────┐     │
│              │      FOOTER (Floating Island)           │     │
│              └─────────────────────────────────────────┘     │
└──────────────────────────────────────────────────────────────┘
```

### Design Specifications

| Property | Value |
|----------|-------|
| Position | Fixed |
| Top | 109px (below header island) |
| Left | 56px (aligned with hamburger menu) |
| Background | Transparent |
| Z-index | 100 |
| Font Size | 14px (0.875rem) |
| Separator | Dot (•) with 12px margin |

---

## User Stories

### US-001: Create Shared Breadcrumb Component

**As a** developer
**I want** a reusable breadcrumb component with standardized styling
**So that** all pages have consistent navigation appearance

**Acceptance Criteria:**
- [ ] Create `BreadcrumbComponent` in `src/app/components/shared/breadcrumb/`
- [ ] Component accepts array of breadcrumb items `{ label: string, route?: string }`
- [ ] Breadcrumb is fixed positioned (top: 109px, left: 56px)
- [ ] Background is transparent
- [ ] Uses dot (•) as separator
- [ ] Font size is 14px
- [ ] Responsive adjustments for mobile (top: 99px, left: 40px)
- [ ] Links are teal color (#047481) with underline on hover
- [ ] Current/active item is gray (#545e6e)

**Story Points:** 3

---

### US-002: Update Process Modeler Page

**As a** user
**I want** the Process Modeler breadcrumb to match the system design
**So that** navigation looks consistent across all pages

**Acceptance Criteria:**
- [ ] Remove white container breadcrumb bar
- [ ] Implement shared `BreadcrumbComponent`
- [ ] Breadcrumb shows: `Processes` (single item, no Home link)
- [ ] Position matches Administration page
- [ ] Main content area expands to fill space

**Story Points:** 2

---

### US-003: Update Products Page

**As a** user
**I want** the Products page to use the standard breadcrumb
**So that** navigation is consistent

**Acceptance Criteria:**
- [ ] Implement shared `BreadcrumbComponent`
- [ ] Breadcrumb shows: `Products`
- [ ] Position and styling match reference

**Story Points:** 1

---

### US-004: Update Personas Page

**As a** user
**I want** the Personas page to use the standard breadcrumb
**So that** navigation is consistent

**Acceptance Criteria:**
- [ ] Implement shared `BreadcrumbComponent`
- [ ] Breadcrumb shows: `Personas`
- [ ] Position and styling match reference

**Story Points:** 1

---

### US-005: Update Profile Page

**As a** user
**I want** the Profile page to use the standard breadcrumb
**So that** navigation is consistent

**Acceptance Criteria:**
- [ ] Implement shared `BreadcrumbComponent`
- [ ] Breadcrumb shows: `Profile`
- [ ] Position and styling match reference

**Story Points:** 1

---

### US-006: Refactor Administration Page

**As a** developer
**I want** the Administration page to use the shared breadcrumb component
**So that** code is maintainable and DRY

**Acceptance Criteria:**
- [ ] Replace inline breadcrumb with shared `BreadcrumbComponent`
- [ ] Maintain current visual appearance (reference design)
- [ ] Remove duplicate breadcrumb styles from page SCSS

**Story Points:** 2

---

### US-007: Update Shared Styles

**As a** developer
**I want** the shared `_breadcrumb.scss` to reflect the correct design
**So that** styles are centralized and consistent

**Acceptance Criteria:**
- [ ] Update `src/styles/_breadcrumb.scss` with reference design styles
- [ ] Position: fixed (not static)
- [ ] Background: transparent (not white)
- [ ] Separator: dot (•) not slash (/)
- [ ] Remove container box styling
- [ ] Add responsive breakpoints

**Story Points:** 1

---

### US-008: Update UI Development Guidelines

**As a** developer
**I want** documentation to reflect the correct breadcrumb design
**So that** future development follows the standard

**Acceptance Criteria:**
- [ ] Update `docs/UI-DEVELOPMENT-GUIDELINES.md`
- [ ] Document fixed positioning requirements
- [ ] Document transparent background
- [ ] Document dot separator
- [ ] Include code examples
- [ ] Add visual diagram

**Story Points:** 1

---

## Technical Notes

### Shared Component Structure

```typescript
// src/app/components/shared/breadcrumb/breadcrumb.component.ts
@Component({
  selector: 'app-breadcrumb',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <nav class="breadcrumb-nav" aria-label="Breadcrumb">
      <ol class="breadcrumb">
        @for (item of items; track item.label; let last = $last) {
          <li class="breadcrumb-item" [class.active]="last">
            @if (!last && item.route) {
              <a [routerLink]="item.route" class="breadcrumb-link">{{ item.label }}</a>
            } @else {
              <span>{{ item.label }}</span>
            }
          </li>
        }
      </ol>
    </nav>
  `
})
export class BreadcrumbComponent {
  @Input() items: BreadcrumbItem[] = [];
}
```

### Required SCSS (Reference Design)

```scss
.breadcrumb-nav {
  position: fixed;
  top: 109px;
  left: 56px;
  z-index: 100;
  background: transparent;

  @media (min-width: 992px) {
    left: 64px;
  }

  @media (min-width: 1920px) {
    left: 72px;
  }

  @media (max-width: 767px) {
    top: 99px;
    left: 40px;
  }
}

.breadcrumb {
  display: flex;
  align-items: center;
  gap: 0;
  list-style: none;
  margin: 0;
  padding: 0;
  font-size: 0.875rem;
}

.breadcrumb-item {
  display: flex;
  align-items: center;

  &::before {
    content: '•';
    margin: 0 0.75rem;
    color: #545e6e;
    font-size: 1rem;
  }

  &:first-child::before {
    display: none;
  }

  &.active {
    color: #545e6e;
  }
}

.breadcrumb-link {
  color: #047481;
  text-decoration: none;

  &:hover {
    text-decoration: underline;
  }
}
```

---

## Definition of Done

- [ ] All pages use the shared `BreadcrumbComponent`
- [ ] Breadcrumb styling matches Administration page reference
- [ ] No duplicate breadcrumb styles in individual page SCSS files
- [ ] UI Development Guidelines updated
- [ ] Visual regression tests pass
- [ ] Accessibility: breadcrumb has proper ARIA labels

---

## Sprint Allocation

| Sprint | Stories | Points |
|--------|---------|--------|
| Sprint 1 | US-001, US-007, US-008 | 5 |
| Sprint 2 | US-002, US-003, US-004, US-005, US-006 | 7 |

**Total Points:** 12
