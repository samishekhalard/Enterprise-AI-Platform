# Message Component

**Status:** [DOCUMENTED]
**PrimeNG Component:** `p-message`
**Module Import:** `MessageModule`
**PrimeNG Docs:** [Message](https://primeng.org/message)

## Overview

Message displays inline validation feedback and contextual alerts within a page section. In EMSIST, messages are used for form validation errors, success confirmations, and warning notices. Styled globally via PrimeNG CSS variables in `styles.scss` with Grey Neutral tokens. For transient notifications, use `p-toast` instead.

## When to Use

- Form validation errors (inline, next to the field or at section level)
- Success confirmation after an action completes
- Warning notices about data constraints
- Informational messages about section state

## When NOT to Use

- Transient notifications -- use `p-toast`
- Confirmation before destructive actions -- use `p-confirmDialog`
- Page-level banners -- use `.tp-banner` utility class

## Variants

| Variant | Severity | Use Case |
|---------|----------|----------|
| Error | `severity="error"` | Validation failures, operation errors |
| Success | `severity="success"` | Operation completed successfully |
| Warning | `severity="warn"` | Constraints, deprecation notices |
| Info | `severity="info"` | Contextual information |
| Secondary | `severity="secondary"` | Low-emphasis supplementary info |

## Key Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `severity` | `'success'\|'info'\|'warn'\|'error'\|'secondary'\|'contrast'` | -- | Message severity |
| `text` | `string` | -- | Message text |
| `icon` | `string` | -- | Custom icon (auto-set per severity) |
| `closable` | `boolean` | `false` | Show dismiss button |
| `size` | `'small'\|'large'` | -- | Size variant |

## Grey Neutral Token Mapping

Message severity colors reuse the toast severity tokens from `styles.scss`:

| Severity | Background | Border | Text |
|----------|-----------|--------|------|
| info | `var(--tp-toast-info-bg)` | `var(--tp-toast-info-border)` | `var(--tp-toast-info-text)` |
| success | `var(--tp-toast-success-bg)` | `var(--tp-toast-success-border)` | `var(--tp-toast-success-text)` |
| warn | `var(--tp-toast-warn-bg)` | `var(--tp-toast-warn-border)` | `var(--tp-toast-warn-text)` |
| error | `var(--tp-toast-error-bg)` | `var(--tp-toast-error-border)` | `var(--tp-toast-error-text)` |
| secondary | `color-mix(surface 80%, raised)` | `var(--tp-border)` | `var(--tp-text)` |

All severity backgrounds use `color-mix` with low opacity (6-10%) over transparent — no white backgrounds.

## Code Examples

### Validation Error

```html
@if (form.invalid && form.submitted) {
  <p-message severity="error" text="Please fix the errors below before saving." />
}
```

### Success Confirmation

```html
@if (saveSuccess) {
  <p-message severity="success" text="Tenant settings saved successfully." [closable]="true" />
}
```

### Warning Notice

```html
<p-message severity="warn" text="This auth source has no assigned providers." />
```

### Info Message

```html
<p-message severity="info" text="License will expire in 30 days." />
```

## Accessibility

| Requirement | Implementation |
|-------------|---------------|
| ARIA role | `role="alert"` for error/warning messages |
| Screen reader | Message text announced on appearance |
| Close button | `aria-label="Close"` on dismiss button |
| Color + icon | Severity conveyed by both color and icon (not color alone) |

## Do / Don't

### Do

- Use `severity="error"` for validation messages
- Place messages near the relevant content (above the form or inline)
- Use `[closable]="true"` for dismissible success messages
- Provide clear, actionable message text

### Don't

- Never use messages for transient notifications -- use `p-toast`
- Never stack more than 3 messages in one location
- Never use `severity="error"` for warnings -- use `severity="warn"`
- Never show messages that require user action without a clear path to fix
