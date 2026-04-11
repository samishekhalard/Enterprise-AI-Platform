# ToggleSwitch Component

**Status:** [DOCUMENTED]
**PrimeNG Component:** `p-toggleSwitch`
**Module Import:** `ToggleSwitchModule`
**PrimeNG Docs:** [ToggleSwitch](https://primeng.org/toggleswitch)

## Overview

ToggleSwitch provides a binary on/off toggle control. In EMSIST, it is used for enabling/disabling features, boolean settings, and active/inactive states. Styled globally via PrimeNG CSS variables in `styles.scss` with Grey Neutral tokens.

## When to Use

- Feature toggles (enable/disable a setting)
- Active/inactive status control
- Boolean form fields with immediate visual feedback

## When NOT to Use

- Choosing between two named options -- use radio buttons
- Selecting from a list -- use `p-select`
- Multi-option toggle -- use `p-selectButton`

## Key Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `disabled` | `boolean` | `false` | Disable interaction |
| `trueValue` | `any` | `true` | Value when checked |
| `falseValue` | `any` | `false` | Value when unchecked |

## Grey Neutral Token Mapping

| Token | Value | Purpose |
|-------|-------|---------|
| `--p-toggleswitch-background` | `var(--nm-surface)` | Unchecked track (#E0DDDA) |
| `--p-toggleswitch-hover-background` | `var(--tp-grey-light)` | Hover track |
| `--p-toggleswitch-checked-background` | `var(--tp-primary)` | Checked track (teal) |
| `--p-toggleswitch-checked-hover-background` | `var(--tp-primary-dark)` | Checked hover |
| `--p-toggleswitch-border-color` | `var(--tp-border)` | Border (#E0DDDA) |
| `--p-toggleswitch-checked-border-color` | `var(--tp-primary)` | Checked border |
| `--p-toggleswitch-handle-background` | `var(--tp-surface-raised)` | Handle (#FAF8F4) |
| `--p-toggleswitch-handle-checked-background` | `var(--tp-surface-light)` | Checked handle |
| `--p-toggleswitch-border-radius` | `var(--nm-radius-pill)` | Pill shape |

## Code Examples

### Basic Toggle

```html
<div style="display: flex; align-items: center; gap: var(--tp-space-3);">
  <label for="active">Active</label>
  <p-toggleSwitch inputId="active" formControlName="isActive" />
</div>
```

### Toggle with Description

```html
<div style="display: flex; justify-content: space-between; align-items: center;">
  <div>
    <label for="notifications" style="font-weight: 600;">Email Notifications</label>
    <div style="color: var(--tp-text-muted); font-size: var(--tp-font-sm);">
      Receive email alerts for important events
    </div>
  </div>
  <p-toggleSwitch inputId="notifications" formControlName="emailNotifications" />
</div>
```

## Accessibility

| Requirement | Implementation |
|-------------|---------------|
| Label association | Use `inputId` prop and matching `<label for>` |
| Keyboard activation | Space toggles the switch (built-in) |
| ARIA attributes | `role="switch"`, `aria-checked` set automatically |
| Focus indicator | Focus ring on `:focus-visible` |
| Touch target | Minimum 44px touch area |

## Do / Don't

### Do

- Always pair with a visible label
- Place toggle to the right of the label text
- Use for settings that take effect immediately

### Don't

- Never use toggle for form submissions that require a save button
- Never use toggle without a label
- Never use toggle for selecting between two named options (use radio)
