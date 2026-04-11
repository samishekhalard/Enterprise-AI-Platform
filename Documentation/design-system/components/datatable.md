# DataTable Component

**Status:** [DOCUMENTED]
**PrimeNG Component:** `p-table`
**Module Import:** `TableModule`
**PrimeNG Docs:** [Table](https://primeng.org/table)

## Overview

The DataTable is the most complex PrimeNG component (87+ props, 22 `pt` slots). In EMSIST, it is the primary way to display entity lists (object types, users, tenants, licenses). It supports lazy loading, sorting, selection, column templates, responsive breakpoints, and row expansion.

## When to Use

- Entity listing pages (object types, users, tenants)
- Data with 3+ columns that benefits from tabular layout
- Data requiring sorting, filtering, or selection
- Desktop and tablet viewports

## When NOT to Use

- Mobile viewports (< 768px) -- switch to card view
- Simple key-value display -- use a definition list or card
- Fewer than 3 items -- use a simple list

## Variants

| Variant | Props | Use Case |
|---------|-------|----------|
| Basic | `[value]="data"` | Static data display |
| Lazy | `[lazy]="true" (onLazyLoad)="load($event)"` | Server-side pagination/sorting |
| Selectable | `selectionMode="single"` or `"multiple"` | Row selection for bulk actions |
| Expandable | `[expandedRows]` with row expansion template | Master-detail view |
| Scrollable | `[scrollable]="true" scrollHeight="400px"` | Fixed-height with scroll |

## Key Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `value` | `any[]` | -- | Data array |
| `columns` | `Column[]` | -- | Column definitions (when dynamic) |
| `lazy` | `boolean` | `false` | Enable server-side loading |
| `paginator` | `boolean` | `false` | Show built-in paginator |
| `rows` | `number` | -- | Rows per page |
| `totalRecords` | `number` | -- | Total records (for lazy) |
| `sortField` | `string` | -- | Default sort field |
| `sortOrder` | `1\|-1` | `1` | Default sort direction |
| `selectionMode` | `'single'\|'multiple'` | -- | Row selection mode |
| `selection` | `any` | -- | Selected row(s) |
| `loading` | `boolean` | `false` | Show loading overlay |
| `scrollable` | `boolean` | `false` | Enable horizontal/vertical scroll |
| `responsiveLayout` | `'scroll'\|'stack'` | `'scroll'` | Responsive behavior |
| `rowHover` | `boolean` | `false` | Highlight row on hover |
| `showCurrentPageReport` | `boolean` | `false` | Show "Showing X to Y of Z" |
| `currentPageReportTemplate` | `string` | -- | Template string for page report |

## Key `pt` Slots

The table has 22 passthrough slots. The most commonly styled are:

| Slot | Targets | Typical Styling |
|------|---------|----------------|
| `root` | `<div>` wrapper | Border, border-radius, overflow |
| `table` | `<table>` element | Width, layout |
| `thead` | `<thead>` | Background color |
| `headerRow` | `<tr>` in header | -- |
| `headerCell` | `<th>` | Font-weight, color, padding, border |
| `tbody` | `<tbody>` | -- |
| `bodyRow` | `<tr>` in body | Hover background, border |
| `bodyCell` | `<td>` | Padding, color, font-size |
| `footer` | `<tfoot>` | Background, border |
| `paginator` | Paginator wrapper | -- |
| `loadingOverlay` | Loading spinner overlay | Background opacity |
| `emptyMessage` | No-data message row | Padding, text-align |

## ThinkPLUS Token Integration

```html
<p-table
  [value]="items"
  [pt]="{
    root: {
      style: {
        'border': '1px solid var(--tp-border)',
        'border-radius': 'var(--nm-radius)',
        'overflow': 'hidden'
      }
    },
    headerCell: {
      style: {
        'background': 'var(--tp-surface)',
        'color': 'var(--tp-text-dark)',
        'font-weight': '600',
        'padding': 'var(--tp-space-3) var(--tp-space-4)',
        'border-block-end': '2px solid var(--tp-border)'
      }
    },
    bodyCell: {
      style: {
        'padding': 'var(--tp-space-3) var(--tp-space-4)',
        'color': 'var(--tp-text)',
        'border-block-end': '1px solid color-mix(in srgb, var(--tp-border) 30%, transparent)'
      }
    },
    bodyRow: {
      style: {
        'transition': 'background 0.15s ease'
      }
    }
  }"
>
```

## Code Examples

### Lazy-Loaded Table with Sorting

```html
<p-table
  [value]="objectTypes"
  [lazy]="true"
  [paginator]="true"
  [rows]="20"
  [totalRecords]="totalRecords"
  [loading]="loading"
  [sortField]="'name'"
  [sortOrder]="1"
  [rowHover]="true"
  [showCurrentPageReport]="true"
  currentPageReportTemplate="Showing {first} to {last} of {totalRecords}"
  (onLazyLoad)="loadData($event)"
  [pt]="tablePt"
>
  <ng-template pTemplate="header">
    <tr>
      <th pSortableColumn="name">
        Name <p-sortIcon field="name" />
      </th>
      <th pSortableColumn="category">Category</th>
      <th>Status</th>
      <th style="inline-size: 8rem;">Actions</th>
    </tr>
  </ng-template>

  <ng-template pTemplate="body" let-item>
    <tr>
      <td>{{ item.name }}</td>
      <td>{{ item.category }}</td>
      <td>
        <p-tag [value]="item.status" [severity]="getStatusSeverity(item.status)" />
      </td>
      <td>
        <p-button icon="pi pi-eye" text rounded aria-label="View" />
        <p-button icon="pi pi-pencil" text rounded aria-label="Edit" />
      </td>
    </tr>
  </ng-template>

  <ng-template pTemplate="emptymessage">
    <tr>
      <td colspan="4">
        <!-- Use Empty State block pattern -->
        <app-empty-state
          icon="pi pi-inbox"
          title="No object types found"
          message="Create your first object type to get started."
        />
      </td>
    </tr>
  </ng-template>
</p-table>
```

### Responsive Column Hiding

```html
<ng-template pTemplate="header">
  <tr>
    <th>Name</th>
    <th class="hide-on-tablet">Description</th>
    <th class="hide-on-mobile">Created</th>
    <th>Actions</th>
  </tr>
</ng-template>
```

```scss
@media (max-width: 1024px) {
  .hide-on-tablet { display: none; }
}
@media (max-width: 767px) {
  .hide-on-mobile { display: none; }
}
```

## Accessibility

| Requirement | Implementation |
|-------------|---------------|
| Table semantics | `p-table` renders a proper `<table>` element |
| Sort announcement | `pSortableColumn` adds `aria-sort` attribute |
| Row selection | `aria-selected` set on selected rows |
| Loading state | Add `aria-busy="true"` on table wrapper when loading |
| Keyboard navigation | Arrow keys navigate rows; Enter activates row actions |
| Screen reader | Use `caption` template or `aria-label` on the table wrapper |
| Column headers | `<th>` elements provide column context |

## Do / Don't

### Do

- Always provide an `emptymessage` template using the Empty State block
- Use `lazy` loading for datasets > 50 rows
- Hide low-priority columns on tablet/mobile breakpoints
- Use `p-sortIcon` for sortable columns
- Show loading overlay during data fetch

### Don't

- Never render a table on mobile (< 768px) -- switch to card view
- Never use more than 6-7 visible columns on desktop
- Never hardcode cell padding -- use `var(--tp-space-*)` tokens
- Never skip the `emptymessage` template
- Never use `responsiveLayout="stack"` -- prefer explicit column hiding or card view toggle
