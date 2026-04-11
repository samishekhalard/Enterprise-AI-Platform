import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { NotificationService } from './notification.service';

describe('NotificationService', () => {
  let service: NotificationService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), NotificationService],
    });

    service = TestBed.inject(NotificationService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getNotifications', () => {
    it('should fetch paginated notifications with default params', () => {
      const mockResponse = {
        content: [
          {
            id: '1',
            tenantId: 't1',
            userId: 'u1',
            title: 'Test',
            message: 'Hello',
            type: 'INFO',
            channel: 'SYSTEM',
            read: false,
            createdAt: '2026-03-25T10:00:00Z',
          },
        ],
        page: 0,
        size: 20,
        totalElements: 1,
        totalPages: 1,
      };

      service.getNotifications().subscribe((result) => {
        expect(result.content).toHaveLength(1);
        expect(result.content[0].title).toBe('Test');
        expect(result.totalElements).toBe(1);
      });

      const req = httpMock.expectOne((r) =>
        r.url.includes('/api/v1/notifications') && r.method === 'GET',
      );
      expect(req.request.params.get('page')).toBe('0');
      expect(req.request.params.get('size')).toBe('20');
      req.flush(mockResponse);
    });

    it('should pass read filter when filtering unread', () => {
      service.getNotifications(0, 20, 'unread').subscribe();

      const req = httpMock.expectOne((r) =>
        r.url.includes('/api/v1/notifications') && r.method === 'GET',
      );
      expect(req.request.params.get('read')).toBe('false');
      req.flush({ content: [], page: 0, size: 20, totalElements: 0, totalPages: 0 });
    });

    it('should pass read filter when filtering read', () => {
      service.getNotifications(0, 20, 'read').subscribe();

      const req = httpMock.expectOne((r) =>
        r.url.includes('/api/v1/notifications') && r.method === 'GET',
      );
      expect(req.request.params.get('read')).toBe('true');
      req.flush({ content: [], page: 0, size: 20, totalElements: 0, totalPages: 0 });
    });

    it('should return empty content when payload is not an object', () => {
      service.getNotifications().subscribe((result) => {
        expect(result.content).toHaveLength(0);
        expect(result.totalElements).toBe(0);
      });

      const req = httpMock.expectOne((r) => r.url.includes('/api/v1/notifications'));
      req.flush(null);
    });
  });

  describe('markAsRead', () => {
    it('should PATCH the notification and decrement unreadCount', () => {
      service.unreadCount.set(5);

      service.markAsRead('abc-123').subscribe();

      const req = httpMock.expectOne((r) =>
        r.url.includes('/api/v1/notifications/abc-123/read') && r.method === 'PATCH',
      );
      req.flush({ id: 'abc-123', read: true });

      expect(service.unreadCount()).toBe(4);
    });

    it('should not go below zero on unreadCount', () => {
      service.unreadCount.set(0);

      service.markAsRead('abc-123').subscribe();

      const req = httpMock.expectOne((r) => r.url.includes('/api/v1/notifications/abc-123/read'));
      req.flush({ id: 'abc-123', read: true });

      expect(service.unreadCount()).toBe(0);
    });
  });

  describe('markAllAsRead', () => {
    it('should POST and reset unreadCount to 0', () => {
      service.unreadCount.set(12);

      service.markAllAsRead().subscribe();

      const req = httpMock.expectOne((r) =>
        r.url.includes('/api/v1/notifications/read-all') && r.method === 'POST',
      );
      req.flush(null);

      expect(service.unreadCount()).toBe(0);
    });
  });

  describe('getUnreadCount', () => {
    it('should fetch count and update signal', () => {
      service.getUnreadCount().subscribe((count) => {
        expect(count).toBe(7);
      });

      const req = httpMock.expectOne((r) =>
        r.url.includes('/api/v1/notifications/unread-count') && r.method === 'GET',
      );
      req.flush({ count: 7 });

      expect(service.unreadCount()).toBe(7);
    });

    it('should handle raw number response', () => {
      service.getUnreadCount().subscribe((count) => {
        expect(count).toBe(3);
      });

      const req = httpMock.expectOne((r) => r.url.includes('/api/v1/notifications/unread-count'));
      req.flush(3);

      expect(service.unreadCount()).toBe(3);
    });

    it('should default to 0 for unexpected payload', () => {
      service.getUnreadCount().subscribe((count) => {
        expect(count).toBe(0);
      });

      const req = httpMock.expectOne((r) => r.url.includes('/api/v1/notifications/unread-count'));
      req.flush('unexpected');

      expect(service.unreadCount()).toBe(0);
    });
  });
});
