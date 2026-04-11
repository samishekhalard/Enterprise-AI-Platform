# Paginator Component

**Status:** [DOCUMENTED]
**PrimeNG Component:** `p-paginator`
**Module Import:** `PaginatorModule`
**PrimeNG Docs:** [Paginator](https://primeng.org/paginator)

## Overview

The Paginator provides page navigation for datasets. In EMSIST, the paginator is the standard pagination mechanism for all list pages. It can be used standalone or embedded within `p-table`. All list pages must use `p-paginator` -- custom pagination implementations are not allowed.

## When to Use

- Any list with more than 20 items
- Standalone pagination below a card grid or custom list
- When `p-table` built-in paginator is insufficient (custom layout)

## When NOT to Use

- Infinite scroll patterns (not used in EMSIST)
- Lists with fewer than 20 items -- show all items
- Inside a `p-table` that already has `[paginator]="true"` (use the built-in one)

## Variants

| Variant | Description |
|---------|-------------|
| Basic | Page numbers with prev/next |
| With rows-per-page | Dropdown to change page size |
| With current page report | Shows "Showing X to Y of Z entries" |
| Compact | First/prev/next/last buttons only (for mobile) |

## Key Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `rows` | `number` | -- | Items per page |
| `totalRecords` | `number` | -- | Total number of records |
| `first` | `number` | `0` | Index of the first item on the current page |
| `rowsPerPageOptions` | `number[]` | -- | Options for page size dropdown |
| `showCurrentPageReport` | `boolean` | `false` | Show "Showing X to Y of Z" text |
| `currentPageReportTemplate` | `string` | -- | Template: `{first}`, `{last}`, `{rows}`, `{totalRecords}` |
| `showFirstLastIcon` | `boolean` | `true` | Show jump-to-first/last buttons |
| `showPageLinks` | `boolean` | `true` | Show page number links |
| `pageLinkSize` | `number` | `5` | Number of page links to display |
| `alwaysShow` | `boolean` | `true` | Show even when only 1 page |

## ThinkPLUS Token Integration

```html
<p-paginator
  [rows]="20"
  [totalRecords]="totalRecords"
  [rowsPerPageOptions]="[10, 20, 50]"
  [showCurrentPageReport]="true"
  currentPageReportTemplate="Showing {first} to {last} of {totalRecords} entries"
  (onPageChange)="onPageChange($event)"
  [pt]="{
    root: {
      style: {
        'background': 'var(--tp-surface-raised)',
        'border': '1px solid var(--tp-border)',
        'border-radius': '0.5rem',
        'padding': 'var(--tp-space-3) var(--tp-space-4)',
        'display': 'flex',
        'align-items': 'center',
        'justify-content': 'space-between',
        'flex-wrap': 'wrap',
        'gap': 'var(--tp-space-3)'
      }
    },
    page: {
      style: {
        'min-inline-size': 'var(--tp-touch-target-min-size)',
        'min-block-size': 'var(--tp-touch-target-min-size)',
        'border-radius': '0.375rem',
        'display': 'inline-flex',
        'align-items': 'center',
        'justify-content': 'center',
        'color': 'var(--tp-text)',
        'font-weight': '600'
      }
    },
    first: {
      style: {
        'min-inline-size': 'var(--tp-touch-target-min-size)',
        'min-block-size': 'var(--tp-touch-target-min-size)'
      }
    },
    prev: {
      style: {
        'min-inline-size': 'var(--tp-touch-target-min-size)',
        'min-block-size': 'var(--tp-touch-target-min-size)'
      }
    },
    next: {
      style: {
        'min-inline-size': 'var(--tp-touch-target-min-size)',
        'min-block-size': 'var(--tp-touch-target-min-size)'
      }
    },
    last: {
      style: {
        'min-inline-size': 'var(--tp-touch-target-min-size)',
        'min-block-size': 'var(--tp-touch-target-min-size)'
      }
    },
    current: {
      style: {
        'color': 'var(--tp-text-muted)',
        'font-size': '0.875rem'
      }
    }
  }"
/>
```

## Code Examples

### Standard List Page Paginator

```html
<p-paginator
  [rows]="pageSize"
  [totalRecords]="totalRecords"
  [first]="first"
  [rowsPerPageOptions]="[10, 20, 50]"
  [showCurrentPageReport]="true"
  currentPageReportTemplate="Showing {first} to {last} of {totalRecords} entries"
  (onPageChange)="onPageChange($event)"
  [pt]="paginatorPt"
/>
```

```typescript
onPageChange(event: { first: number; rows: number; page: number }) {
  this.first = event.first;
  this.pageSize = event.rows;
  this.loadData();
}
```

### Compact Paginator (Mobile)

```html
<p-paginator
  [rows]="pageSize"
  [totalRecords]="totalRecords"
  [first]="first"
  [showPageLinks]="false"
  [showCurrentPageReport]="true"
  currentPageReportTemplate="Page {currentPage} of {totalPages}"
  (onPageChange)="onPageChange($event)"
  [pt]="compactPaginatorPt"
/>
```

### Inside p-table (Built-In)

When using `p-table`'s built-in paginator, configure it on the table directly:

```html
<p-table
  [value]="items"
  [paginator]="true"
  [rows]="20"
  [totalRecords]="totalRecords"
  [lazy]="true"
  [rowsPerPageOptions]="[10, 20, 50]"
  [showCurrentPageReport]="true"
  currentPageReportTemplate="Showing {first} to {last} of {totalRecords} entries"
  (onLazyLoad)="loadData($event)"
>
```

## Accessibility

| Requirement | Implementation |
|-------------|---------------|
| ARIA navigation | `role="navigation"` on paginator wrapper |
| Page buttons | `aria-label="Page N"` on each page button |
| Current page | `aria-current="page"` on active page button |
| Prev/Next | `aria-label="Previous Page"` / `aria-label="Next Page"` |
| First/Last | `aria-label="First Page"` / `aria-label="Last Page"` |
| Keyboard | Tab to paginator; Arrow keys between page buttons; Enter activates |
| Touch target | All buttons minimum 44x44px |
| Disabled state | First/Prev disabled on page 1; Next/Last disabled on last page |

## Do / Don't

### Do

- Always show `currentPageReportTemplate` so users know their position
- Offer `rowsPerPageOptions` of `[10, 20, 50]` as standard options
- Use compact mode (hide page links) on mobile viewports
- Default to 20 rows per page for standard lists
- Use `p-table`'s built-in paginator when using a table

### Don't

- Never build a custom paginator component -- always use `p-paginator`
- Never hide the paginator when there is only 1 page (use `[alwaysShow]="true"` for consistency)
- Never use `offset`-based pagination display without showing the total count
- Never make page buttons smaller than 44x44px touch target
- Never use "Load More" patterns -- use paginator for consistent navigation
