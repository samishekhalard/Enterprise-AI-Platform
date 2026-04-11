# DatePicker Component

**Status:** [DOCUMENTED]
**PrimeNG Component:** `p-datePicker`
**Module Import:** `DatePickerModule`
**PrimeNG Docs:** [DatePicker](https://primeng.org/datepicker)

## Overview

DatePicker provides date and time selection with a calendar overlay. In EMSIST, it is used for scheduling, filtering by date range, and form date fields. Styled globally via PrimeNG CSS variables in `styles.scss` with Grey Neutral tokens.

## When to Use

- Date input fields (start date, end date, due date)
- Date range filters
- Date + time selection (scheduling)

## When NOT to Use

- Time-only input -- use a dedicated time picker
- Relative date selection ("last 7 days") -- use a custom select

## Variants

| Variant | Props | Use Case |
|---------|-------|----------|
| Basic | Default | Single date selection |
| With time | `[showTime]="true"` | Date + time |
| Range | `selectionMode="range"` | Start-to-end date range |
| Inline | `[inline]="true"` | Always-visible calendar |
| Button trigger | `[showIcon]="true"` | Calendar icon trigger |

## Key Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `selectionMode` | `'single'\|'range'\|'multiple'` | `'single'` | Selection mode |
| `showTime` | `boolean` | `false` | Show time picker |
| `showIcon` | `boolean` | `false` | Show calendar icon button |
| `inline` | `boolean` | `false` | Inline (always visible) mode |
| `dateFormat` | `string` | `'mm/dd/yy'` | Date format string |
| `minDate` | `Date` | -- | Minimum selectable date |
| `maxDate` | `Date` | -- | Maximum selectable date |
| `disabled` | `boolean` | `false` | Disable interaction |
| `placeholder` | `string` | -- | Placeholder text |
| `appendTo` | `string` | -- | Append overlay to (`'body'`) |
| `showButtonBar` | `boolean` | `false` | Show Today/Clear buttons |

## Grey Neutral Token Mapping

| Token | Value | Purpose |
|-------|-------|---------|
| `--p-datepicker-panel-background` | `var(--tp-surface-raised)` | Calendar panel (#FAF8F4) |
| `--p-datepicker-panel-border-color` | `var(--tp-border)` | Panel border (#E0DDDA) |
| `--p-datepicker-panel-border-radius` | `var(--nm-radius-md)` | 12px radius |
| `--p-datepicker-panel-shadow` | `var(--nm-shadow-dialog)` | Panel shadow |
| `--p-datepicker-date-selected-background` | `var(--tp-primary)` | Selected date (teal) |
| `--p-datepicker-date-selected-color` | `var(--tp-surface-light)` | Selected date text |
| `--p-datepicker-date-hover-background` | `color-mix(…primary 8%…)` | Hover highlight |
| `--p-datepicker-today-background` | `color-mix(…primary 12%…)` | Today highlight |
| `--p-datepicker-today-color` | `var(--tp-primary-dark)` | Today text |

## Code Examples

### Basic Date Input

```html
<div style="display: grid; gap: var(--tp-space-2);">
  <label for="startDate">Start Date</label>
  <p-datePicker
    inputId="startDate"
    formControlName="startDate"
    dateFormat="dd/mm/yy"
    [showIcon]="true"
    placeholder="Select date"
    appendTo="body"
  />
</div>
```

### Date Range Filter

```html
<p-datePicker
  selectionMode="range"
  formControlName="dateRange"
  dateFormat="dd/mm/yy"
  placeholder="Select date range"
  [showButtonBar]="true"
  appendTo="body"
/>
```

### Date + Time

```html
<p-datePicker
  formControlName="scheduledAt"
  [showTime]="true"
  dateFormat="dd/mm/yy"
  placeholder="Select date and time"
  appendTo="body"
/>
```

## Accessibility

| Requirement | Implementation |
|-------------|---------------|
| Label association | Use `inputId` prop and matching `<label for>` |
| Keyboard navigation | Arrow keys navigate calendar; Enter selects date; Escape closes |
| Screen reader | Dates announced with day/month context |
| Focus indicator | `box-shadow: var(--tp-focus-ring)` on focus |
| Touch target | Calendar cells minimum 44x44px |

## Do / Don't

### Do

- Use `appendTo="body"` to prevent overlay clipping
- Set `[minDate]` and `[maxDate]` to constrain valid ranges
- Use `dateFormat` matching the application locale
- Use `[showButtonBar]="true"` for quick Today/Clear access

### Don't

- Never use a text input for date entry -- always use `p-datePicker`
- Never omit the label
- Never leave date format ambiguous (always document mm/dd vs dd/mm)
