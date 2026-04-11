# Card Component

**Status:** [DOCUMENTED]
**PrimeNG Component:** `p-card`
**Module Import:** `CardModule`
**PrimeNG Docs:** [Card](https://primeng.org/card)

## Overview

Cards are flat surface containers that group related content and actions. In EMSIST, cards are used for dashboard widgets, detail views, and list-to-card view toggles on mobile. PrimeNG's `p-card` is styled via `pt` passthrough with ThinkPLUS tokens. Cards use a subtle background difference (`--tp-surface-raised`) and soft border (`--tp-border`) — no drop shadow or elevation.

## When to Use

- Dashboard summary widgets (KPI cards, status cards)
- Detail view content sections
- Mobile alternative to table rows (card view toggle)
- Settings panels and configuration groups
- Empty state containers

## When NOT to Use

- Full-page layouts -- use the page shell structure
- Inline content grouping -- use `<div class="app-panel">` for lightweight grouping
- Navigation items -- use `p-menu` or `p-tabs`

## Variants

| Variant | Description | Use Case |
|---------|-------------|----------|
| Basic | Title + content | Standard content grouping |
| With subtitle | Title + subtitle + content | Detail view sections |
| With header/footer | Custom header/footer templates | Dashboard widgets with actions |

## Key Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `header` | `string` | -- | Card header text |
| `subheader` | `string` | -- | Card subheader text |

### Template Slots

| Slot | Description |
|------|-------------|
| `header` | Custom header template |
| `subtitle` | Custom subtitle template |
| `content` | Main body content |
| `footer` | Footer with actions |

## ThinkPLUS Token Integration

```html
<p-card
  header="Object Types"
  [pt]="{
    root: {
      style: {
        'background': 'var(--tp-surface-raised)',
        'border': '1px solid var(--tp-border)',
        'border-radius': 'var(--nm-radius)',
        'overflow': 'hidden'
      }
    },
    header: {
      style: {
        'padding': 'var(--tp-space-4)',
        'font-weight': '700',
        'color': 'var(--tp-text-dark)',
        'border-block-end': '1px solid var(--tp-border)'
      }
    },
    body: {
      style: {
        'padding': 'var(--tp-space-4)'
      }
    },
    footer: {
      style: {
        'padding': 'var(--tp-space-3) var(--tp-space-4)',
        'border-block-start': '1px solid var(--tp-border)'
      }
    }
  }"
>
  <ng-template pTemplate="content">
    <!-- Card body content -->
  </ng-template>
</p-card>
```

## Code Examples

### Dashboard KPI Card

```html
<p-card
  header="Active Definitions"
  subheader="Last 30 days"
  [pt]="cardPt"
>
  <ng-template pTemplate="content">
    <span class="kpi-value">142</span>
  </ng-template>
</p-card>
```

### Detail View Section

```html
<p-card header="General Information" [pt]="cardPt">
  <ng-template pTemplate="content">
    <div style="display: grid; gap: var(--tp-space-3);">
      <div><strong>Name:</strong> Quality Check</div>
      <div><strong>Status:</strong> Active</div>
    </div>
  </ng-template>
  <ng-template pTemplate="footer">
    <p-button label="Edit" icon="pi pi-pencil" severity="primary" />
  </ng-template>
</p-card>
```

### Mobile List Card (Table Alternative)

```html
@for (item of items; track item.id) {
  <p-card [pt]="compactCardPt">
    <ng-template pTemplate="content">
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <div>
          <strong>{{ item.name }}</strong>
          <div style="color: var(--tp-text-muted); font-size: 0.875rem;">
            {{ item.category }}
          </div>
        </div>
        <p-button icon="pi pi-chevron-right" text rounded aria-label="View details" />
      </div>
    </ng-template>
  </p-card>
}
```

## Accessibility

| Requirement | Implementation |
|-------------|---------------|
| Semantic structure | Card header renders as heading -- verify heading level |
| Keyboard navigation | Interactive elements inside card are focusable |
| Focus management | Cards containing links/buttons have logical tab order |
| Screen reader | Card title announced as region label when using `role="region"` with `aria-labelledby` |

## Do / Don't

### Do

- Use `var(--tp-surface-raised)` for card background
- Use `var(--tp-border)` for card borders
- Use `var(--nm-radius)` (16px) for border-radius
- Provide a meaningful `header` for screen readers
- Use footer template for action buttons

### Don't

- Never add box-shadow or elevation to cards -- cards are flat surfaces
- Never nest cards more than one level deep
- Never use cards as the only interactive element (they are containers, not buttons)
- Never omit padding -- always use `var(--tp-space-4)` minimum for body
- Never use `var(--tp-elevation-*)` on cards -- those tokens resolve to `none`
