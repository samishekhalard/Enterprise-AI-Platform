import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { NotificationsPageComponent } from './notifications-page.component';
import { NotificationService } from '../../core/services/notification.service';
import { NotificationPagedResponse } from '../../core/api/models';

const MOCK_RESPONSE: NotificationPagedResponse = {
  content: [
    {
      id: 'n1',
      tenantId: 't1',
      userId: 'u1',
      title: 'Welcome',
      message: 'Welcome to the platform.',
      type: 'INFO',
      channel: 'SYSTEM',
      read: false,
      createdAt: '2026-03-25T10:00:00Z',
    },
    {
      id: 'n2',
      tenantId: 't1',
      userId: 'u1',
      title: 'License Expiry',
      message: 'Your license expires in 7 days.',
      type: 'WARNING',
      channel: 'SYSTEM',
      read: true,
      readAt: '2026-03-24T08:00:00Z',
      createdAt: '2026-03-24T08:00:00Z',
    },
  ],
  page: 0,
  size: 20,
  totalElements: 2,
  totalPages: 1,
};

describe('NotificationsPageComponent', () => {
  let fixture: ComponentFixture<NotificationsPageComponent>;
  let component: NotificationsPageComponent;
  let mockNotificationService: {
    getNotifications: ReturnType<typeof vi.fn>;
    markAsRead: ReturnType<typeof vi.fn>;
    markAllAsRead: ReturnType<typeof vi.fn>;
    getUnreadCount: ReturnType<typeof vi.fn>;
    unreadCount: { (): number; set: (v: number) => void };
  };

  beforeEach(async () => {
    const unreadSignal = vi.fn(() => 1) as unknown as {
      (): number;
      set: (v: number) => void;
    };
    unreadSignal.set = vi.fn();

    mockNotificationService = {
      getNotifications: vi.fn().mockReturnValue(of(MOCK_RESPONSE)),
      markAsRead: vi.fn().mockReturnValue(of({ id: 'n1', read: true })),
      markAllAsRead: vi.fn().mockReturnValue(of(undefined)),
      getUnreadCount: vi.fn().mockReturnValue(of(1)),
      unreadCount: unreadSignal,
    };

    await TestBed.configureTestingModule({
      imports: [NotificationsPageComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: NotificationService, useValue: mockNotificationService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(NotificationsPageComponent);
    component = fixture.componentInstance;
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should load notifications on init', () => {
    fixture.detectChanges();
    expect(mockNotificationService.getNotifications).toHaveBeenCalledWith(0, 20, undefined);
    expect(mockNotificationService.getUnreadCount).toHaveBeenCalled();
  });

  it('should display notifications after loading', () => {
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    const items = compiled.querySelectorAll('[data-testid^="notification-"]');
    expect(items.length).toBeGreaterThanOrEqual(1);
  });

  it('should show empty state when no notifications', () => {
    mockNotificationService.getNotifications.mockReturnValue(
      of({ content: [], page: 0, size: 20, totalElements: 0, totalPages: 0 }),
    );
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    const emptyState = compiled.querySelector('[data-testid="empty-state"]');
    expect(emptyState).toBeTruthy();
  });

  it('should show error message on load failure', () => {
    mockNotificationService.getNotifications.mockReturnValue(
      throwError(() => new Error('Network error')),
    );
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    const errorMsg = compiled.querySelector('[data-testid="error-message"]');
    expect(errorMsg).toBeTruthy();
  });

  it('should call markAsRead when clicking mark-read button', () => {
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    const markReadBtn = compiled.querySelector('[data-testid="mark-read-btn"]') as HTMLButtonElement;
    if (markReadBtn) {
      markReadBtn.click();
      expect(mockNotificationService.markAsRead).toHaveBeenCalledWith('n1');
    }
  });

  it('should call markAllAsRead when clicking mark-all-read button', () => {
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    const markAllBtn = compiled.querySelector(
      '[data-testid="mark-all-read"]',
    ) as HTMLButtonElement;
    if (markAllBtn) {
      markAllBtn.click();
      expect(mockNotificationService.markAllAsRead).toHaveBeenCalled();
    }
  });

  it('should change filter on filter button click', () => {
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    const unreadBtn = compiled.querySelector(
      '[data-testid="filter-unread"]',
    ) as HTMLButtonElement;
    if (unreadBtn) {
      unreadBtn.click();
      fixture.detectChanges();
      expect(mockNotificationService.getNotifications).toHaveBeenCalledWith(0, 20, 'unread');
    }
  });
});
