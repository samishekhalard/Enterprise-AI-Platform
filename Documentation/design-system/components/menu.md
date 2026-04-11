# Menu Component

**Status:** [DOCUMENTED]
**PrimeNG Components:** `p-menu`, `p-menubar`, `p-tieredMenu`
**Module Imports:** `MenuModule`, `MenubarModule`, `TieredMenuModule`
**PrimeNG Docs:** [Menu](https://primeng.org/menu) | [Menubar](https://primeng.org/menubar) | [TieredMenu](https://primeng.org/tieredmenu)

## Overview

Menu components provide navigation and action lists. EMSIST uses three menu variants: `p-menu` for popup action menus, `p-menubar` for horizontal navigation bars, and `p-tieredMenu` for hierarchical menus. All are styled via `pt` passthrough with ThinkPLUS tokens.

## When to Use

| Component | Use Case |
|-----------|----------|
| `p-menu` | Action menus on table rows (edit, delete, duplicate), context menus |
| `p-menubar` | Top-level horizontal navigation |
| `p-tieredMenu` | Hierarchical navigation with nested submenus |

## When NOT to Use

- Tab-based content switching -- use `p-tabs`
- Sidebar navigation -- use a custom sidebar with `routerLink`
- Single action -- use a button directly
- Breadcrumb navigation -- use `p-breadcrumb`

## Variants

| Variant | Component | Trigger |
|---------|-----------|---------|
| Popup menu | `p-menu` with `[popup]="true"` | Button click |
| Inline menu | `p-menu` (no popup) | Always visible |
| Horizontal bar | `p-menubar` | Always visible |
| Tiered | `p-tieredMenu` | Click with submenus |

## Key Props

### p-menu

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `model` | `MenuItem[]` | -- | Menu items array |
| `popup` | `boolean` | `false` | Popup mode |
| `appendTo` | `string` | -- | Append overlay to (`'body'`) |

### MenuItem Interface

| Property | Type | Description |
|----------|------|-------------|
| `label` | `string` | Display text |
| `icon` | `string` | PrimeIcons class |
| `command` | `function` | Click handler |
| `routerLink` | `string` | Angular route |
| `separator` | `boolean` | Divider line |
| `disabled` | `boolean` | Disable item |
| `items` | `MenuItem[]` | Submenu items |
| `visible` | `boolean` | Show/hide item |

## ThinkPLUS Token Integration

```html
<p-menu
  [model]="items"
  [popup]="true"
  appendTo="body"
  [pt]="{
    root: {
      style: {
        'background': 'var(--tp-surface-raised)',
        'border': '1px solid var(--tp-border)',
        'border-radius': 'var(--nm-radius-sm)',
        'box-shadow': 'var(--nm-shadow-dialog)',
        'min-inline-size': '200px'
      }
    },
    item: {
      style: {
        'padding': '0'
      }
    },
    itemContent: {
      style: {
        'padding': 'var(--tp-space-2) var(--tp-space-4)',
        'color': 'var(--tp-text)',
        'display': 'flex',
        'align-items': 'center',
        'gap': 'var(--tp-space-2)',
        'min-height': 'var(--tp-touch-target-min-size)',
        'cursor': 'pointer'
      }
    },
    separator: {
      style: {
        'border-color': 'var(--tp-border)',
        'margin': 'var(--tp-space-1) 0'
      }
    }
  }"
/>
```

## Code Examples

### Row Action Menu

```typescript
// Component
@ViewChild('menu') menu!: Menu;

menuItems: MenuItem[] = [
  { label: 'View', icon: 'pi pi-eye', command: () => this.view() },
  { label: 'Edit', icon: 'pi pi-pencil', command: () => this.edit() },
  { label: 'Duplicate', icon: 'pi pi-copy', command: () => this.duplicate() },
  { separator: true },
  { label: 'Delete', icon: 'pi pi-trash', command: () => this.delete() }
];
```

```html
<p-button
  icon="pi pi-ellipsis-v"
  text
  rounded
  (onClick)="menu.toggle($event)"
  aria-label="Actions"
  aria-haspopup="true"
/>
<p-menu #menu [model]="menuItems" [popup]="true" appendTo="body" [pt]="menuPt" />
```

### Navigation Menubar

```html
<p-menubar
  [model]="navItems"
  [pt]="{
    root: {
      style: {
        'background': 'var(--tp-primary-dark)',
        'border': 'none',
        'border-radius': '0',
        'padding': '0 var(--tp-space-4)'
      }
    },
    item: {
      style: {
        'color': 'var(--tp-surface-light)'
      }
    }
  }"
/>
```

## Accessibility

| Requirement | Implementation |
|-------------|---------------|
| ARIA roles | `role="menu"` on container, `role="menuitem"` on items |
| Keyboard navigation | Arrow keys navigate items; Enter activates; Escape closes popup |
| `aria-haspopup` | Required on the trigger button for popup menus |
| `aria-expanded` | Set on trigger button based on menu open state |
| Focus management | First item receives focus on open; focus returns to trigger on close |
| Touch target | Menu items minimum 44px height |
| Disabled items | `aria-disabled="true"` set automatically |

## Do / Don't

### Do

- Use `appendTo="body"` for popup menus to prevent clipping
- Group related actions with `separator: true`
- Place destructive actions (delete) last, separated by a divider
- Use consistent icon + label pairs across all menus
- Use `[popup]="true"` for contextual row actions
- Use `var(--nm-shadow-dialog)` for floating menu shadow

### Don't

- Never use menu for content navigation within a page -- use tabs
- Never nest more than 2 levels of submenus
- Never place more than 8 items in a single menu level
- Never use menu without icons -- icon + label improves scannability
- Never use custom click handlers for navigation -- use `routerLink`
- Never use `var(--tp-elevation-hover)` for menu shadow -- it resolves to `none`
