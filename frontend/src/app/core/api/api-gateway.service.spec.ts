import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { vi } from 'vitest';

import { ApiGatewayService } from './api-gateway.service';
import { UserSession } from './models';

/**
 * Unit tests for ApiGatewayService -- Session management methods.
 *
 * Angular 21's @angular/build:unit-test does NOT support vi.mock().
 * Tests use TestBed + HttpTestingController for HTTP verification.
 *
 * Covers:
 *  1. getUserSessions(userId) -- calls correct GET URL
 *  2. getUserSessions(userId) -- returns UserSession[] from response
 *  3. getUserSessions(userId) -- encodes userId in URL
 *  4. revokeAllUserSessions(userId) -- calls correct DELETE URL
 *  5. revokeAllUserSessions(userId) -- encodes userId in URL
 *  6. revokeAllUserSessions(userId) -- returns void on success
 */
describe('ApiGatewayService -- Session Methods', () => {
  let service: ApiGatewayService;
  let httpTesting: HttpTestingController;

  const mockSessions: UserSession[] = [
    {
      id: 'sess-1',
      deviceName: 'Chrome on macOS',
      ipAddress: '10.0.0.1',
      location: null,
      createdAt: '2026-03-04T08:00:00Z',
      lastActivity: '2026-03-04T09:00:00Z',
      expiresAt: '2026-03-04T20:00:00Z',
      isRemembered: false,
      mfaVerified: true,
      status: 'ACTIVE',
      isCurrent: true,
    },
    {
      id: 'sess-2',
      deviceName: 'Firefox on Linux',
      ipAddress: '10.0.0.2',
      location: null,
      createdAt: '2026-03-03T12:00:00Z',
      lastActivity: '2026-03-03T14:00:00Z',
      expiresAt: '2026-03-03T23:59:00Z',
      isRemembered: true,
      mfaVerified: false,
      status: 'EXPIRED',
      isCurrent: false,
    },
  ];

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(ApiGatewayService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  // =====================================================================
  // getUserSessions()
  // =====================================================================

  describe('getUserSessions(userId)', () => {
    it('should send GET request to /api/v1/users/{userId}/sessions', () => {
      // Arrange & Act
      service.getUserSessions('user-abc-123').subscribe();

      // Assert
      const req = httpTesting.expectOne(
        (r) => r.method === 'GET' && r.url.includes('/api/v1/users/user-abc-123/sessions'),
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockSessions);
    });

    it('should return UserSession[] from the response', () => {
      // Arrange
      let result: UserSession[] = [];

      // Act
      service.getUserSessions('user-abc-123').subscribe((sessions) => {
        result = sessions;
      });

      // Assert
      const req = httpTesting.expectOne(
        (r) => r.method === 'GET' && r.url.includes('/api/v1/users/user-abc-123/sessions'),
      );
      req.flush(mockSessions);
      expect(result).toEqual(mockSessions);
      expect(result.length).toBe(2);
    });

    it('should URL-encode the userId parameter', () => {
      // Arrange -- userId with special characters
      service.getUserSessions('user/with spaces&special').subscribe();

      // Assert
      const req = httpTesting.expectOne(
        (r) =>
          r.method === 'GET' &&
          r.url.includes('/api/v1/users/user%2Fwith%20spaces%26special/sessions'),
      );
      req.flush([]);
    });

    it('should return empty array when API returns empty list', () => {
      // Arrange
      let result: UserSession[] = [];

      // Act
      service.getUserSessions('user-no-sessions').subscribe((sessions) => {
        result = sessions;
      });

      // Assert
      const req = httpTesting.expectOne(
        (r) => r.method === 'GET' && r.url.includes('/api/v1/users/user-no-sessions/sessions'),
      );
      req.flush([]);
      expect(result).toEqual([]);
    });

    it('should propagate HTTP errors to subscriber', () => {
      // Arrange
      let errorResponse: unknown = null;

      // Act
      service.getUserSessions('user-err').subscribe({
        error: (err) => {
          errorResponse = err;
        },
      });

      // Assert
      const req = httpTesting.expectOne(
        (r) => r.method === 'GET' && r.url.includes('/api/v1/users/user-err/sessions'),
      );
      req.flush('Server Error', { status: 500, statusText: 'Internal Server Error' });
      expect(errorResponse).not.toBeNull();
    });
  });

  // =====================================================================
  // revokeAllUserSessions()
  // =====================================================================

  describe('revokeAllUserSessions(userId)', () => {
    it('should send DELETE request to /api/v1/users/{userId}/sessions', () => {
      // Arrange & Act
      service.revokeAllUserSessions('user-abc-123').subscribe();

      // Assert
      const req = httpTesting.expectOne(
        (r) => r.method === 'DELETE' && r.url.includes('/api/v1/users/user-abc-123/sessions'),
      );
      expect(req.request.method).toBe('DELETE');
      req.flush(null);
    });

    it('should URL-encode the userId parameter', () => {
      // Arrange -- userId with special characters
      service.revokeAllUserSessions('user/special chars').subscribe();

      // Assert
      const req = httpTesting.expectOne(
        (r) =>
          r.method === 'DELETE' && r.url.includes('/api/v1/users/user%2Fspecial%20chars/sessions'),
      );
      req.flush(null);
    });

    it('should complete successfully on 200 response', () => {
      // Arrange
      const completeSpy = vi.fn();

      // Act
      service.revokeAllUserSessions('user-revoke').subscribe({
        complete: completeSpy,
      });

      // Assert
      const req = httpTesting.expectOne(
        (r) => r.method === 'DELETE' && r.url.includes('/api/v1/users/user-revoke/sessions'),
      );
      req.flush(null);
      expect(completeSpy).toHaveBeenCalled();
    });

    it('should propagate HTTP errors to subscriber', () => {
      // Arrange
      let errorResponse: unknown = null;

      // Act
      service.revokeAllUserSessions('user-err').subscribe({
        error: (err) => {
          errorResponse = err;
        },
      });

      // Assert
      const req = httpTesting.expectOne(
        (r) => r.method === 'DELETE' && r.url.includes('/api/v1/users/user-err/sessions'),
      );
      req.flush('Forbidden', { status: 403, statusText: 'Forbidden' });
      expect(errorResponse).not.toBeNull();
    });
  });
});
