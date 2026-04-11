import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { map, Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  Notification,
  NotificationPagedResponse,
  UnreadCountResponse,
} from '../api/models';

/**
 * Service for managing user notifications.
 * Communicates with the notification-service via the API gateway.
 */
@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = environment.apiBaseUrl.replace(/\/$/, '');
  private readonly basePath = '/api/v1/notifications';

  /** Reactive signal holding the current unread notification count. */
  readonly unreadCount = signal(0);

  /**
   * Fetches a paginated list of notifications.
   * @param page Zero-based page index
   * @param size Number of items per page
   * @param readFilter Optional filter: 'read', 'unread', or undefined for all
   */
  getNotifications(
    page = 0,
    size = 20,
    readFilter?: 'read' | 'unread',
  ): Observable<NotificationPagedResponse> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    if (readFilter === 'read') {
      params = params.set('read', 'true');
    } else if (readFilter === 'unread') {
      params = params.set('read', 'false');
    }

    return this.http
      .get<unknown>(this.buildUrl(this.basePath), { params })
      .pipe(map((payload) => this.normalizePagedResponse(payload, page, size)));
  }

  /**
   * Marks a single notification as read.
   * @param id The notification identifier
   */
  markAsRead(id: string): Observable<Notification> {
    return this.http
      .patch<Notification>(this.buildUrl(`${this.basePath}/${encodeURIComponent(id)}/read`), {})
      .pipe(tap(() => this.unreadCount.update((count) => Math.max(0, count - 1))));
  }

  /**
   * Marks all notifications as read for the current user.
   */
  markAllAsRead(): Observable<void> {
    return this.http
      .post<void>(this.buildUrl(`${this.basePath}/read-all`), {})
      .pipe(tap(() => this.unreadCount.set(0)));
  }

  /**
   * Fetches the number of unread notifications for the current user
   * and updates the unreadCount signal.
   */
  getUnreadCount(): Observable<number> {
    return this.http
      .get<unknown>(this.buildUrl(`${this.basePath}/unread-count`))
      .pipe(
        map((payload) => this.extractCount(payload)),
        tap((count) => this.unreadCount.set(count)),
      );
  }

  private buildUrl(path: string): string {
    return `${this.apiBaseUrl}${path}`;
  }

  private normalizePagedResponse(
    payload: unknown,
    page: number,
    size: number,
  ): NotificationPagedResponse {
    if (!this.isRecord(payload)) {
      return { content: [], page, size, totalElements: 0, totalPages: 0 };
    }

    const content = Array.isArray(payload['content'])
      ? (payload['content'] as Notification[])
      : [];

    return {
      content,
      page: this.asNumber(payload['page']) ?? this.asNumber(payload['number']) ?? page,
      size: this.asNumber(payload['size']) ?? size,
      totalElements: this.asNumber(payload['totalElements']) ?? content.length,
      totalPages: this.asNumber(payload['totalPages']) ?? 1,
    };
  }

  private extractCount(payload: unknown): number {
    if (typeof payload === 'number') {
      return payload;
    }
    if (this.isRecord(payload)) {
      return this.asNumber(payload['count']) ?? 0;
    }
    return 0;
  }

  private isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null;
  }

  private asNumber(value: unknown): number | undefined {
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }
    return undefined;
  }
}
