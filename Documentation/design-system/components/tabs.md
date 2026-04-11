# Tabs Component

**Status:** [DOCUMENTED]
**PrimeNG Components:** `p-tabs`, `p-tabList`, `p-tab`, `p-tabPanels`, `p-tabPanel`
**Module Import:** `TabsModule`
**PrimeNG Docs:** [Tabs](https://primeng.org/tabs)

## Overview

Tabs organize content into separate views where only one tab panel is visible at a time. In EMSIST, tabs are used in detail pages (separating General, Fields, Relationships, History) and settings pages. PrimeNG 21 uses the new structured `p-tabs` API (not the deprecated `p-tabView`).

## When to Use

- Detail pages with 3-7 distinct content sections
- Settings pages with grouped configuration
- Content that shares context but differs in type

## When NOT to Use

- Sequential steps -- use a stepper or wizard
- Navigation between pages -- use `p-menu` or sidebar
- Only 2 sections -- use a simple stacked layout
- More than 7 tabs -- reconsider information architecture

## Variants

| Variant | Props | Use Case |
|---------|-------|----------|
| Basic | `[value]="activeIndex"` | Default tab navigation |
| Scrollable | `[scrollable]="true"` on `p-tabList` | Many tabs that overflow |
| Lazy | Content loads only when tab is selected | Heavy content per tab |

## Key Props

### p-tabs

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `value` | `string\|number` | -- | Active tab identifier |

### p-tab

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `value` | `string\|number` | -- | Tab identifier (matches panel) |
| `disabled` | `boolean` | `false` | Disable this tab |

### p-tabPanel

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `value` | `string\|number` | -- | Panel identifier (matches tab) |

## ThinkPLUS Token Integration

```html
<p-tabs
  [value]="activeTab"
  [pt]="{
    root: {
      style: {
        'background': 'var(--tp-surface-raised)'
      }
    }
  }"
>
  <p-tabList
    [pt]="{
      root: {
        style: {
          'border-block-end': '2px solid var(--tp-border)',
          'padding-inline': 'var(--tp-space-4)'
        }
      },
      tabList: {
        style: {
          'gap': 'var(--tp-space-1)'
        }
      },
      activeBar: {
        style: {
          'background': 'var(--tp-primary)'
        }
      }
    }"
  >
    <p-tab
      [value]="0"
      [pt]="{
        root: {
          style: {
            'padding': 'var(--tp-space-3) var(--tp-space-4)',
            'font-weight': '600',
            'color': 'var(--tp-text)',
            'min-height': 'var(--tp-touch-target-min-size)',
            'cursor': 'pointer'
          }
        }
      }"
    >
      General
    </p-tab>
  </p-tabList>

  <p-tabPanels
    [pt]="{
      root: {
        style: {
          'padding': 'var(--tp-space-6)'
        }
      }
    }"
  >
    <p-tabPanel [value]="0">
      <!-- Tab content -->
    </p-tabPanel>
  </p-tabPanels>
</p-tabs>
```

## Code Examples

### Detail Page Tabs

```html
<p-tabs [(value)]="activeTab">
  <p-tabList [pt]="tabListPt">
    <p-tab [value]="0" [pt]="tabPt">General</p-tab>
    <p-tab [value]="1" [pt]="tabPt">Fields</p-tab>
    <p-tab [value]="2" [pt]="tabPt">Relationships</p-tab>
    <p-tab [value]="3" [pt]="tabPt">History</p-tab>
  </p-tabList>

  <p-tabPanels [pt]="tabPanelsPt">
    <p-tabPanel [value]="0">
      <app-general-info [objectType]="objectType" />
    </p-tabPanel>
    <p-tabPanel [value]="1">
      <app-field-list [objectTypeId]="objectType.id" />
    </p-tabPanel>
    <p-tabPanel [value]="2">
      <app-relationship-list [objectTypeId]="objectType.id" />
    </p-tabPanel>
    <p-tabPanel [value]="3">
      <app-audit-history [entityId]="objectType.id" />
    </p-tabPanel>
  </p-tabPanels>
</p-tabs>
```

### Scrollable Tabs (Mobile)

```html
<p-tabList [scrollable]="true" [pt]="tabListPt">
  @for (tab of tabs; track tab.value) {
    <p-tab [value]="tab.value" [pt]="tabPt">{{ tab.label }}</p-tab>
  }
</p-tabList>
```

## Accessibility

| Requirement | Implementation |
|-------------|---------------|
| ARIA roles | `role="tablist"` on tab list, `role="tab"` on each tab, `role="tabpanel"` on panels |
| `aria-selected` | Automatically set on active tab |
| `aria-controls` | Tab references its panel by ID |
| Keyboard navigation | Arrow keys move between tabs; Enter/Space activates |
| Focus management | Focus moves to tab content when activated (if applicable) |
| Touch target | Tabs meet 44px minimum height |

## Do / Don't

### Do

- Use `p-tabs` / `p-tabList` / `p-tab` (PrimeNG 21 API) -- not the deprecated `p-tabView`
- Use meaningful tab labels (1-2 words)
- Show a count badge on tabs with quantifiable content (e.g., "Fields (12)")
- Use `[scrollable]="true"` when tabs might overflow on tablet/mobile
- Keep tab order consistent across similar pages

### Don't

- Never use `p-tabView` -- it is deprecated in PrimeNG 21
- Never use more than 7 tabs on a single page
- Never hide critical information in a tab that users might miss
- Never change tab order dynamically
- Never use tabs for wizard/stepper flows -- use `p-stepper`
