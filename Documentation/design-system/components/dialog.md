# Dialog Component

**Status:** [DOCUMENTED]
**PrimeNG Component:** `p-dialog`
**Module Import:** `DialogModule`
**PrimeNG Docs:** [Dialog](https://primeng.org/dialog)

## Overview

Dialogs are modal overlays that require user attention before returning to the main content. In EMSIST, dialogs are used for confirmation prompts, create/edit forms, and detail previews. All dialogs use `p-dialog` styled via `pt` passthrough with ThinkPLUS tokens.

## When to Use

- Confirming destructive actions (delete, revoke, discard)
- Short forms that don't warrant a full page (quick edit, rename)
- Detail previews without navigating away
- Displaying important information requiring acknowledgment

## When NOT to Use

- Multi-step wizards with 3+ steps -- use a full page
- Content that users need to reference alongside other content
- Notifications or success messages -- use `p-toast`
- Simple yes/no questions -- use `p-confirmDialog`

## Variants

| Variant | Props | Use Case |
|---------|-------|----------|
| Basic | `[visible]` + `header` | Information display |
| Form dialog | With form inside | Quick create/edit |
| Confirmation | Use `p-confirmDialog` instead | Delete confirmation |
| Maximizable | `[maximizable]="true"` | Large content preview |
| Draggable | `[draggable]="true"` | Reference while working |

## Key Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `visible` | `boolean` | `false` | Show/hide the dialog |
| `header` | `string` | -- | Dialog title |
| `modal` | `boolean` | `false` | Show backdrop overlay |
| `closable` | `boolean` | `true` | Show close button |
| `closeOnEscape` | `boolean` | `true` | Close on Escape key |
| `dismissableMask` | `boolean` | `false` | Close on backdrop click |
| `draggable` | `boolean` | `true` | Allow dragging |
| `resizable` | `boolean` | `true` | Allow resizing |
| `maximizable` | `boolean` | `false` | Show maximize button |
| `position` | `'center'\|'top'\|'bottom'\|'left'\|'right'\|...` | `'center'` | Dialog position |
| `style` | `object` | -- | Inline styles |
| `contentStyle` | `object` | -- | Content area styles |
| `breakpoints` | `object` | -- | Responsive width breakpoints |

## ThinkPLUS Token Integration

```html
<p-dialog
  header="Create Object Type"
  [(visible)]="showDialog"
  [modal]="true"
  [style]="{ 'inline-size': '500px' }"
  [breakpoints]="{ '768px': '90vw' }"
  [pt]="{
    root: {
      style: {
        'border-radius': 'var(--nm-radius)',
        'overflow': 'hidden'
      }
    },
    header: {
      style: {
        'background': 'var(--tp-surface-raised)',
        'padding': 'var(--tp-space-4)',
        'color': 'var(--tp-text-dark)',
        'font-weight': '700',
        'border-block-end': '1px solid var(--tp-border)'
      }
    },
    content: {
      style: {
        'background': 'var(--tp-surface-raised)',
        'padding': 'var(--tp-space-6)'
      }
    },
    footer: {
      style: {
        'background': 'var(--tp-surface-raised)',
        'padding': 'var(--tp-space-3) var(--tp-space-4)',
        'border-block-start': '1px solid var(--tp-border)',
        'display': 'flex',
        'justify-content': 'flex-end',
        'gap': 'var(--tp-space-3)'
      }
    },
    mask: {
      style: {
        'background': 'rgba(22, 22, 22, 0.5)'
      }
    }
  }"
>
```

## Code Examples

### Form Dialog

```html
<p-dialog
  header="Create Object Type"
  [(visible)]="showCreateDialog"
  [modal]="true"
  [style]="{ 'inline-size': '500px' }"
  [breakpoints]="{ '768px': '90vw' }"
  [pt]="dialogPt"
>
  <ng-template pTemplate="content">
    <form [formGroup]="form" style="display: grid; gap: var(--tp-space-4);">
      <div style="display: grid; gap: var(--tp-space-2);">
        <label for="typeName">Name</label>
        <input pInputText id="typeName" formControlName="name" />
      </div>
      <div style="display: grid; gap: var(--tp-space-2);">
        <label for="typeDesc">Description</label>
        <textarea pTextarea id="typeDesc" formControlName="description" [rows]="3"></textarea>
      </div>
    </form>
  </ng-template>

  <ng-template pTemplate="footer">
    <p-button label="Cancel" severity="secondary" text (onClick)="showCreateDialog = false" />
    <p-button label="Create" severity="primary" icon="pi pi-check" (onClick)="save()" [loading]="saving" />
  </ng-template>
</p-dialog>
```

### Confirmation Dialog

```html
<p-dialog
  header="Confirm Delete"
  [(visible)]="showDeleteConfirm"
  [modal]="true"
  [style]="{ 'inline-size': '400px' }"
  [pt]="dialogPt"
>
  <ng-template pTemplate="content">
    <div style="display: flex; gap: var(--tp-space-3); align-items: flex-start;">
      <i class="pi pi-exclamation-triangle" style="color: var(--tp-danger); font-size: 1.5rem;"></i>
      <p>Are you sure you want to delete <strong>{{ itemName }}</strong>? This action cannot be undone.</p>
    </div>
  </ng-template>

  <ng-template pTemplate="footer">
    <p-button label="Cancel" severity="secondary" text (onClick)="showDeleteConfirm = false" />
    <p-button label="Delete" severity="danger" icon="pi pi-trash" (onClick)="confirmDelete()" />
  </ng-template>
</p-dialog>
```

## Accessibility

| Requirement | Implementation |
|-------------|---------------|
| Focus trap | `p-dialog` with `modal` traps focus within the dialog |
| Initial focus | First focusable element receives focus on open |
| Escape key | Closes dialog (via `closeOnEscape`) |
| `role="dialog"` | Set automatically by PrimeNG |
| `aria-modal` | Set to `true` when `modal` is enabled |
| `aria-labelledby` | References the header text automatically |
| Return focus | Focus returns to trigger element on close |
| Backdrop | Inert content behind modal (pointer events blocked) |

## Do / Don't

### Do

- Always set `[modal]="true"` for dialogs requiring attention
- Use `[breakpoints]` to make dialogs responsive (90vw on mobile)
- Put the primary action (save/confirm) on the right end of the footer
- Use `severity="danger"` for destructive action buttons
- Keep dialog content focused -- one task per dialog

### Don't

- Never nest dialogs inside other dialogs
- Never use dialogs for simple notifications -- use `p-toast`
- Never make dialogs wider than `600px` on desktop
- Never disable the Escape key close behavior
- Never put scrollable tables inside dialogs -- link to a full page instead
