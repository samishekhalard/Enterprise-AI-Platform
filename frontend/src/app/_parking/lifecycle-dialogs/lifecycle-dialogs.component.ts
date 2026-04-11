import {
  Component,
  computed,
  input,
  model,
  output,
  ChangeDetectionStrategy,
} from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { MessageModule } from 'primeng/message';

// ─── Types ────────────────────────────────────────────────────────────────────

export type LifecycleAction = 'suspend' | 'reactivate';

export interface LifecycleDialogConfig {
  title: string;
  icon: string;
  iconClass: string;
  message: string;
  impactText: string;
  warningBanner: string | null;
  warningSeverity: 'warn' | 'error' | 'info';
  confirmLabel: string;
  confirmSeverity: 'danger' | 'primary';
}

// ─── Component ────────────────────────────────────────────────────────────────

@Component({
  selector: 'app-lifecycle-dialogs',
  standalone: true,
  imports: [
    ButtonModule,
    DialogModule,
    MessageModule,
  ],
  templateUrl: './lifecycle-dialogs.component.html',
  styleUrl: './lifecycle-dialogs.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LifecycleDialogsComponent {
  // ─── Inputs ───────────────────────────────────────────────────────────────

  /** Which lifecycle action this dialog represents. */
  readonly action = input.required<LifecycleAction>();

  /** Two-way binding for dialog visibility. */
  readonly visible = model<boolean>(false);

  /** Display name of the tenant. */
  readonly tenantName = input<string>('');

  /** Number of active user sessions (shown in suspend dialog). */
  readonly sessionCount = input<number>(0);

  // ─── Outputs ──────────────────────────────────────────────────────────────

  /** Emits the action type when the user confirms. */
  readonly confirmed = output<LifecycleAction>();

  /** Emits when the user cancels. */
  readonly cancelled = output<void>();

  /** Resolved dialog configuration based on the current action. */
  readonly config = computed<LifecycleDialogConfig>(() => {
    const action = this.action();
    const name = this.tenantName();
    const sessions = this.sessionCount();

    switch (action) {
      case 'suspend':
        return {
          title: 'Suspend Tenant',
          icon: 'pi pi-pause-circle',
          iconClass: 'icon-warning',
          message: `Are you sure you want to suspend ${name}?`,
          impactText: `This will terminate ${sessions} active user session${sessions !== 1 ? 's' : ''}. Users visiting the tenant link will see a "tenant not accessible" message until reactivated.`,
          warningBanner: 'TEN-W-003: Suspending a tenant will immediately revoke access for all users. Active sessions will be terminated.',
          warningSeverity: 'warn',
          confirmLabel: 'Suspend',
          confirmSeverity: 'danger',
        };

      case 'reactivate':
        return {
          title: 'Reactivate Tenant',
          icon: 'pi pi-play',
          iconClass: 'icon-info',
          message: `Reactivate ${name}?`,
          impactText: 'The tenant will become accessible again. Users will be able to log in via the tenant link.',
          warningBanner: null,
          warningSeverity: 'info',
          confirmLabel: 'Reactivate',
          confirmSeverity: 'primary',
        };
    }
  });

  /** Whether the confirm button should be disabled (always enabled for current actions). */
  readonly confirmDisabled = computed(() => false);

  // ─── Dialog Passthrough Styles ────────────────────────────────────────────

  readonly dialogStyle = { width: 'min(30rem, 92vw)' } as const;

  readonly dialogBreakpoints = { '768px': '92vw' } as const;

  readonly dialogPt = {
    root: {
      style: {
        'border-radius': 'var(--nm-radius-lg)',
        overflow: 'hidden',
      },
    },
    header: {
      style: {
        background: 'var(--tp-surface-raised)',
        padding: 'var(--tp-space-4) var(--tp-space-5)',
        color: 'var(--tp-text-dark)',
        'border-block-end': '1px solid var(--tp-border)',
        'align-items': 'flex-start',
      },
    },
    content: {
      style: {
        background: 'var(--tp-surface-raised)',
        padding: 'var(--tp-space-4) var(--tp-space-5)',
      },
    },
    footer: {
      style: {
        background: 'var(--tp-surface-raised)',
        padding: 'var(--tp-space-3) var(--tp-space-5)',
        'border-block-start': '1px solid var(--tp-border)',
        display: 'flex',
        'justify-content': 'flex-end',
        gap: 'var(--tp-space-2)',
        'flex-wrap': 'wrap',
      },
    },
    mask: {
      style: {
        background: 'color-mix(in srgb, var(--tp-text-dark) 35%, transparent)',
        'backdrop-filter': 'blur(2px)',
      },
    },
  } as const;

  // ─── Actions ──────────────────────────────────────────────────────────────

  onVisibleChange(value: boolean): void {
    if (!value) {
      this.cancel();
    }
  }

  confirm(): void {
    if (this.confirmDisabled()) return;
    this.confirmed.emit(this.action());
    this.visible.set(false);
  }

  cancel(): void {
    this.cancelled.emit();
    this.visible.set(false);
  }
}
