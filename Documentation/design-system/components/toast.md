# Toast Component

**Status:** [IMPLEMENTED]
**PrimeNG Component:** `Toast` (standalone)
**Import:** `import { Toast } from 'primeng/toast';`
**PrimeNG Docs:** [Toast](https://primeng.org/toast)
**Source:** [app.html](frontend/src/app/app.html) | [styles.scss](frontend/src/styles.scss)

## Overview

Toasts are non-blocking notification messages that appear temporarily to provide feedback on user actions. In EMSIST, toasts confirm successful operations, report errors, and display warnings. They use PrimeNG's `MessageService` and are styled via **CSS design token overrides** (`--p-toast-*` mapped to `--tp-toast-*`) in `styles.scss`.

The visual style is a **soft tinted background** per severity with a subtle border — not the default PrimeNG white-card-with-left-accent style.

## When to Use

- Confirming a successful save, create, or delete operation
- Reporting server errors or validation failures
- Displaying warnings about potential issues
- Informational notifications

## When NOT to Use

- Critical errors requiring acknowledgment -- use `p-dialog`
- Inline form validation -- use error messages next to the field
- Content that needs to persist -- use `.tp-banner` inline component
- Complex content with actions -- use a dialog or inline alert

## Variants (Severity Levels)

| Severity | Base Color | Background Token | Border Token | Text Token |
|----------|-----------|-----------------|-------------|-----------|
| `success` | `#428177` | `--tp-toast-success-bg` (8% mix) | `--tp-toast-success-border` (12% mix) | `--tp-toast-success-text` (#054239) |
| `error` | `#ef4444` | `--tp-toast-error-bg` (8% mix) | `--tp-toast-error-border` (12% mix) | `--tp-toast-error-text` (#b91c1c) |
| `warn` | `#988561` | `--tp-toast-warn-bg` (8% mix) | `--tp-toast-warn-border` (12% mix) | `--tp-toast-warn-text` (#5a4a2a) |
| `info` | `#054239` | `--tp-toast-info-bg` (8% mix) | `--tp-toast-info-border` (12% mix) | `--tp-toast-info-text` (#054239) |

All backgrounds use `color-mix(in srgb, <base> 8%, transparent)` for the soft tinted effect.

## Key Props (p-toast)

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `position` | `'top-right'\|'top-left'\|'top-center'\|'bottom-right'\|...` | `'top-right'` | Screen position |
| `life` | `number` | `3000` | Auto-dismiss time in ms |
| `key` | `string` | -- | Message group key |
| `preventOpenDuplicates` | `boolean` | `false` | Block duplicate messages |
| `preventDuplicates` | `boolean` | `false` | Block same message content |

### MessageService Options

| Property | Type | Description |
|----------|------|-------------|
| `severity` | `'success'\|'info'\|'warn'\|'error'` | Message type |
| `summary` | `string` | Title text |
| `detail` | `string` | Body text |
| `life` | `number` | Override auto-dismiss time |
| `sticky` | `boolean` | Prevent auto-dismiss |
| `closable` | `boolean` | Show close button |
| `key` | `string` | Target specific toast instance |

## Design Token Architecture

Toast appearance is controlled entirely via CSS custom properties in `styles.scss` `:root`. No `[pt]` passthrough objects are needed.

### Severity Tokens (ThinkPLUS namespace)

```css
--tp-toast-success-bg: color-mix(in srgb, #428177 8%, transparent);
--tp-toast-success-border: color-mix(in srgb, #428177 12%, transparent);
--tp-toast-success-text: #054239;
/* Same pattern for error, warn, info */
```

### PrimeNG Overrides (mapped to ThinkPLUS tokens)

```css
--p-toast-border-radius: 8px;
--p-toast-content-padding: 10px 14px;
--p-toast-content-gap: 10px;
--p-toast-summary-font-weight: 700;
--p-toast-summary-font-size: 1rem;
--p-toast-detail-font-size: 0.8rem;
--p-toast-icon-size: 1.25rem;
--p-toast-close-icon-size: 20px;
--p-toast-close-button-width: 28px;
--p-toast-close-button-height: 28px;

--p-toast-success-background: var(--tp-toast-success-bg);
--p-toast-success-border-color: var(--tp-toast-success-border);
--p-toast-success-color: var(--tp-toast-success-text);
--p-toast-success-detail-color: var(--tp-toast-success-text);
--p-toast-success-shadow: 0 16px 32px rgba(0,0,0,0.04);
/* Same pattern for error, warn, info */
```

## Code Examples

### Setup (App Component) [IMPLEMENTED]

```typescript
// app.ts
import { Toast } from 'primeng/toast';

@Component({
  imports: [ShellLayoutComponent, RouterOutlet, Toast],
  // ...
})
export class App { }
```

```typescript
// app.config.ts
import { MessageService } from 'primeng/api';

export const appConfig: ApplicationConfig = {
  providers: [
    // ...
    MessageService,
  ],
};
```

```html
<!-- app.html (line 1) -->
<p-toast position="top-right" />
```

### Success Toast

```typescript
this.messageService.add({
  severity: 'success',
  summary: 'Created',
  detail: 'Object type "Quality Check" has been created.',
  life: 4000
});
```

### Error Toast

```typescript
this.messageService.add({
  severity: 'error',
  summary: 'Error',
  detail: 'Failed to save changes. Please try again.',
  life: 6000
});
```

### Warning Toast

```typescript
this.messageService.add({
  severity: 'warn',
  summary: 'Warning',
  detail: 'This object type has active references and cannot be deleted.',
  life: 5000
});
```

### Sticky Toast (No Auto-Dismiss)

```typescript
this.messageService.add({
  severity: 'error',
  summary: 'Connection Lost',
  detail: 'Unable to reach the server. Changes will not be saved.',
  sticky: true,
  closable: true
});
```

## Inline Banners (`.tp-banner`)

For persistent inline messages (not toast notifications), use the shared `.tp-banner` classes defined in `styles.scss`:

```html
<div class="tp-banner tp-banner-info">
  <ng-icon name="phosphorInfo" />
  <span>SAML metadata will be fetched automatically.</span>
</div>

<div class="tp-banner tp-banner-error">
  <ng-icon name="phosphorWarningCircle" />
  <span>Failed to load identity provider details.</span>
</div>
```

### Available Banner Classes

| Class | Appearance |
|-------|-----------|
| `.tp-banner .tp-banner-success` | Soft green tinted background |
| `.tp-banner .tp-banner-error` | Soft red tinted background |
| `.tp-banner .tp-banner-warning` | Soft amber tinted background |
| `.tp-banner .tp-banner-info` | Soft dark-teal tinted background |

### Banner with Dismiss Button

```html
<div class="tp-banner tp-banner-warning">
  <ng-icon name="phosphorWarning" />
  <span>License expires in 14 days.</span>
  <button class="tp-banner-dismiss" aria-label="Dismiss">
    <ng-icon name="phosphorX" size="14" />
  </button>
</div>
```

## Accessibility

| Requirement | Implementation |
|-------------|---------------|
| Live region | Toast container uses `role="alert"` and `aria-live="assertive"` |
| Auto-dismiss timing | Minimum 4000ms for success, 6000ms for errors (enough time to read) |
| Close button | Touch target 28px, `aria-label="Close"` |
| Focus management | Toast does NOT steal focus from current task |
| Screen reader | Summary and detail are announced immediately on appearance |
| Sticky for critical | Error toasts about lost connectivity should use `sticky: true` |

## Do / Don't

### Do

- Place the `<p-toast>` element in the root app component (one instance)
- Use `success` for completed actions, `error` for failures
- Keep messages concise: summary (2-4 words) + detail (1 sentence)
- Use longer `life` values for error messages (6000ms+)
- Use `sticky: true` for critical errors requiring user attention
- Use `.tp-banner` classes for inline persistent banners
- Override appearance via `--p-toast-*` / `--tp-toast-*` tokens only

### Don't

- Never use toast for form validation errors -- show them inline
- Never display more than 3 toasts simultaneously
- Never use `life` less than 3000ms -- users need time to read
- Never use toast for information that the user must act on -- use dialog
- Never hardcode colors in component SCSS -- use the shared `.tp-banner-*` classes
- Never use `[pt]` passthrough for toast styling -- use CSS design tokens
