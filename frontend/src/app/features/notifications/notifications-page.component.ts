import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { MessageModule } from 'primeng/message';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { TagModule } from 'primeng/tag';
import { finalize } from 'rxjs';
import { Notification } from '../../core/api/models';
import { NotificationService } from '../../core/services/notification.service';
import { PageFrameComponent } from '../../layout/page-frame/page-frame.component';

type ReadFilter = 'all' | 'read' | 'unread';

@Component({
  selector: 'app-notifications-page',
  standalone: true,
  imports: [
    CommonModule,
    ButtonModule,
    MessageModule,
    ProgressSpinnerModule,
    TagModule,
    PageFrameComponent,
  ],
  templateUrl: './notifications-page.component.html',
  styleUrl: './notifications-page.component.scss',
})
export class NotificationsPageComponent implements OnInit {
  private readonly notificationService = inject(NotificationService);

  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly notifications = signal<readonly Notification[]>([]);
  protected readonly page = signal(0);
  protected readonly pageSize = signal(20);
  protected readonly totalElements = signal(0);
  protected readonly totalPages = signal(0);
  protected readonly readFilter = signal<ReadFilter>('all');
  protected readonly markingAllRead = signal(false);

  protected readonly hasNotifications = computed(() => this.notifications().length > 0);
  protected readonly hasPreviousPage = computed(() => this.page() > 0);
  protected readonly hasNextPage = computed(() => this.page() + 1 < Math.max(this.totalPages(), 1));
  protected readonly hasUnread = computed(
    () => this.notifications().some((n) => !n.read),
  );

  ngOnInit(): void {
    this.loadNotifications();
    this.notificationService.getUnreadCount().subscribe();
  }

  protected loadNotifications(): void {
    this.loading.set(true);
    this.error.set(null);

    const filterValue = this.readFilter();
    const apiFilter = filterValue === 'all' ? undefined : filterValue;

    this.notificationService
      .getNotifications(this.page(), this.pageSize(), apiFilter as 'read' | 'unread' | undefined)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (response) => {
          this.notifications.set([...response.content]);
          this.totalElements.set(response.totalElements);
          this.totalPages.set(response.totalPages);
        },
        error: (err: unknown) => {
          this.notifications.set([]);
          this.error.set(resolveErrorMessage(err));
        },
      });
  }

  protected onFilterChange(filter: ReadFilter): void {
    this.readFilter.set(filter);
    this.page.set(0);
    this.loadNotifications();
  }

  protected onMarkAsRead(notification: Notification): void {
    if (notification.read) {
      return;
    }

    this.notificationService.markAsRead(notification.id).subscribe({
      next: () => {
        this.notifications.update((list) =>
          list.map((n) => (n.id === notification.id ? { ...n, read: true } : n)),
        );
      },
      error: () => {
        // Silently fail -- user can retry
      },
    });
  }

  protected onMarkAllAsRead(): void {
    this.markingAllRead.set(true);

    this.notificationService
      .markAllAsRead()
      .pipe(finalize(() => this.markingAllRead.set(false)))
      .subscribe({
        next: () => {
          this.notifications.update((list) =>
            list.map((n) => ({ ...n, read: true })),
          );
        },
        error: () => {
          this.error.set('Failed to mark all notifications as read.');
        },
      });
  }

  protected previousPage(): void {
    if (!this.hasPreviousPage()) {
      return;
    }
    this.page.update((p) => p - 1);
    this.loadNotifications();
  }

  protected nextPage(): void {
    if (!this.hasNextPage()) {
      return;
    }
    this.page.update((p) => p + 1);
    this.loadNotifications();
  }

  protected notificationIcon(type: string): string {
    const icons: Record<string, string> = {
      INFO: 'pi pi-info-circle',
      WARNING: 'pi pi-exclamation-triangle',
      ERROR: 'pi pi-times-circle',
      SUCCESS: 'pi pi-check-circle',
    };
    return icons[type] ?? 'pi pi-bell';
  }

  protected typeSeverity(type: string): 'info' | 'warn' | 'danger' | 'success' | 'secondary' {
    const map: Record<string, 'info' | 'warn' | 'danger' | 'success'> = {
      INFO: 'info',
      WARNING: 'warn',
      ERROR: 'danger',
      SUCCESS: 'success',
    };
    return map[type] ?? 'secondary';
  }

  protected formatTimestamp(iso: string): string {
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) {
      return iso;
    }
    return date.toLocaleString();
  }

  protected trackById(_index: number, notification: Notification): string {
    return notification.id;
  }
}

function resolveErrorMessage(error: unknown): string {
  if (error instanceof HttpErrorResponse) {
    if (error.status === 403) {
      return 'Access denied. You do not have permission to view notifications.';
    }
    if (error.status === 404) {
      return 'Notifications endpoint not found.';
    }
    if (typeof error.error === 'string' && error.error.trim().length > 0) {
      return error.error;
    }
    if (typeof error.error === 'object' && error.error !== null) {
      const message = (error.error as Record<string, unknown>)['message'];
      if (typeof message === 'string' && message.trim().length > 0) {
        return message;
      }
    }
  }
  return 'Unable to load notifications.';
}
