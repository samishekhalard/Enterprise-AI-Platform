import { Component, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { BadgeModule } from 'primeng/badge';
import { ButtonModule } from 'primeng/button';
import { NotificationService } from '../core/services/notification.service';

/**
 * Compact bell icon with unread count badge for the shell header.
 * Clicking navigates to the full notifications page.
 */
@Component({
  selector: 'app-notification-bell',
  standalone: true,
  imports: [BadgeModule, ButtonModule],
  template: `
    <button
      pButton
      type="button"
      data-testid="notification-bell"
      [text]="true"
      [rounded]="true"
      aria-label="Notifications"
      (click)="navigateToNotifications()"
      class="bell-button"
    >
      <i class="pi pi-bell bell-icon"></i>
      @if (showBadge()) {
        <p-badge
          [value]="badgeLabel()"
          severity="danger"
          data-testid="notification-badge"
        />
      }
    </button>
  `,
  styles: `
    :host {
      display: inline-flex;
      align-items: center;
    }

    .bell-button {
      position: relative;
      min-width: 44px;
      min-height: 44px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }

    .bell-icon {
      font-size: 1.15rem;
    }

    :host ::ng-deep p-badge .p-badge {
      position: absolute;
      top: 2px;
      right: 2px;
      font-size: 0.65rem;
      min-width: 1.1rem;
      height: 1.1rem;
      line-height: 1.1rem;
    }
  `,
})
export class NotificationBellComponent {
  private readonly router = inject(Router);
  private readonly notificationService = inject(NotificationService);

  protected readonly unreadCount = this.notificationService.unreadCount;
  protected readonly showBadge = computed(() => this.unreadCount() > 0);
  protected readonly badgeLabel = computed(() => {
    const count = this.unreadCount();
    return count > 99 ? '99+' : count.toString();
  });

  /** Navigate to the full notifications page. */
  protected navigateToNotifications(): void {
    this.router.navigate(['/notifications']);
  }
}
