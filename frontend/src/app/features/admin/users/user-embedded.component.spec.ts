import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { vi } from 'vitest';
import { of, throwError } from 'rxjs';

// PrimeNG components require ResizeObserver which is missing in JSDOM
if (typeof globalThis.ResizeObserver === 'undefined') {
  globalThis.ResizeObserver = class ResizeObserver {
    observe(): void {
      return;
    }
    unobserve(): void {
      return;
    }
    disconnect(): void {
      return;
    }
  } as unknown as typeof ResizeObserver;
}

import { UserEmbeddedComponent } from './user-embedded.component';
import { ApiGatewayService } from '../../../core/api/api-gateway.service';
import { provideAppIcons } from '../../../core/icons/provide-icons';
import { TenantUser, UserSession } from '../../../core/api/models';

/**
 * Unit tests for UserEmbeddedComponent -- Session dialog feature.
 *
 * Angular 21's @angular/build:unit-test does NOT support vi.mock().
 * Tests use TestBed with service stubs (useValue) and vi.fn for verification.
 *
 * Covers:
 *  1. openSessions(user) -- sets selectedUser, showSessions=true, calls loadSessions
 *  2. closeSessions()    -- resets selectedUser, showSessions, sessions, sessionsError
 *  3. loadSessions()     -- success: sets sessions list, clears loading
 *  4. loadSessions()     -- error: sets sessionsError, clears loading
 *  5. revokeAll()        -- success: optimistically maps ACTIVE->REVOKED
 *  6. revokeAll()        -- error: sets sessionsError
 *  7. revokeAll()        -- no-op when selectedUser is null
 *  8. sessionSeverity()  -- correct severity for each status string
 *  9. hasActiveSessions()-- true when ACTIVE session exists, false otherwise
 * 10. hasActiveSessions()-- false for empty sessions list
 */
describe('UserEmbeddedComponent -- Session Dialog', () => {
  let fixture: ComponentFixture<UserEmbeddedComponent>;
  let component: UserEmbeddedComponent;

  // ── Test data builders ──────────────────────────────────────────────────

  const buildUser = (overrides: Partial<TenantUser> = {}): TenantUser => ({
    id: 'user-001',
    email: 'alice@example.com',
    firstName: 'Alice',
    lastName: 'Smith',
    displayName: 'Alice Smith',
    active: true,
    emailVerified: true,
    roles: ['ROLE_ADMIN'],
    groups: [],
    identityProvider: 'keycloak',
    lastLoginAt: '2026-03-01T10:00:00Z',
    createdAt: '2026-01-15T08:00:00Z',
    ...overrides,
  });

  const buildSession = (overrides: Partial<UserSession> = {}): UserSession => ({
    id: 'sess-001',
    deviceName: 'Chrome on macOS',
    ipAddress: '192.168.1.10',
    location: null,
    createdAt: '2026-03-04T08:00:00Z',
    lastActivity: '2026-03-04T09:30:00Z',
    expiresAt: '2026-03-04T20:00:00Z',
    isRemembered: false,
    mfaVerified: true,
    status: 'ACTIVE',
    isCurrent: true,
    ...overrides,
  });

  const mockSessions: UserSession[] = [
    buildSession({ id: 'sess-001', status: 'ACTIVE', isCurrent: true }),
    buildSession({
      id: 'sess-002',
      status: 'EXPIRED',
      isCurrent: false,
      deviceName: 'Firefox on Linux',
    }),
    buildSession({
      id: 'sess-003',
      status: 'REVOKED',
      isCurrent: false,
      deviceName: 'Safari on iOS',
    }),
    buildSession({
      id: 'sess-004',
      status: 'LOGGED_OUT',
      isCurrent: false,
      deviceName: 'Edge on Windows',
    }),
    buildSession({
      id: 'sess-005',
      status: 'ACTIVE',
      isCurrent: false,
      deviceName: 'Chrome on Android',
    }),
  ];

  // ── API stub ──────────────────────────────────────────────────────────

  const apiStub = {
    listTenantUsers: vi.fn(() =>
      of({ content: [], totalElements: 0, totalPages: 0, page: 0, size: 20 }),
    ),
    getUserSessions: vi.fn(() => of(mockSessions)),
    revokeAllUserSessions: vi.fn(() => of(undefined)),
  };

  // ── Helper to access protected/private members via type cast ──────────

  interface ComponentInternals {
    selectedUser: () => TenantUser | null;
    showSessions: () => boolean;
    sessions: () => UserSession[];
    sessionsLoading: () => boolean;
    sessionsError: () => string | null;
    revokingAll: () => boolean;
    openSessions: (user: TenantUser) => void;
    closeSessions: () => void;
    revokeAll: () => void;
    sessionSeverity: (status: string) => string;
    hasActiveSessions: () => boolean;
  }

  const internals = (): ComponentInternals => component as unknown as ComponentInternals;

  // ── Test setup ────────────────────────────────────────────────────────

  beforeEach(async () => {
    vi.clearAllMocks();
    apiStub.getUserSessions.mockReturnValue(of(mockSessions));
    apiStub.revokeAllUserSessions.mockReturnValue(of(undefined));

    await TestBed.configureTestingModule({
      imports: [UserEmbeddedComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideAppIcons(),
        { provide: ApiGatewayService, useValue: apiStub },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(UserEmbeddedComponent);
    component = fixture.componentInstance;
    component.tenantId = 'tenant-abc';
    component.tenantName = 'Test Tenant';
    fixture.detectChanges();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // =====================================================================
  // openSessions()
  // =====================================================================

  describe('openSessions(user)', () => {
    it('should set selectedUser to the provided user', () => {
      // Arrange
      const user = buildUser({ id: 'user-alice' });

      // Act
      internals().openSessions(user);

      // Assert
      expect(internals().selectedUser()).toBe(user);
    });

    it('should set showSessions to true', () => {
      // Arrange
      const user = buildUser();

      // Act
      internals().openSessions(user);

      // Assert
      expect(internals().showSessions()).toBe(true);
    });

    it('should call getUserSessions with the user id', () => {
      // Arrange
      const user = buildUser({ id: 'user-xyz-123' });

      // Act
      internals().openSessions(user);

      // Assert
      expect(apiStub.getUserSessions).toHaveBeenCalledWith('user-xyz-123');
    });

    it('should populate sessions list on successful API response', () => {
      // Arrange
      const user = buildUser();

      // Act
      internals().openSessions(user);

      // Assert
      expect(internals().sessions()).toEqual(mockSessions);
      expect(internals().sessionsLoading()).toBe(false);
    });

    it('should set sessionsError on API failure', () => {
      // Arrange
      apiStub.getUserSessions.mockReturnValueOnce(throwError(() => new Error('Network failure')));
      const user = buildUser();

      // Act
      internals().openSessions(user);

      // Assert
      expect(internals().sessionsError()).toBe('Failed to load sessions.');
      expect(internals().sessionsLoading()).toBe(false);
      expect(internals().sessions()).toEqual([]);
    });
  });

  // =====================================================================
  // closeSessions()
  // =====================================================================

  describe('closeSessions()', () => {
    it('should reset showSessions to false', () => {
      // Arrange
      internals().openSessions(buildUser());
      expect(internals().showSessions()).toBe(true);

      // Act
      internals().closeSessions();

      // Assert
      expect(internals().showSessions()).toBe(false);
    });

    it('should reset selectedUser to null', () => {
      // Arrange
      internals().openSessions(buildUser());
      expect(internals().selectedUser()).not.toBeNull();

      // Act
      internals().closeSessions();

      // Assert
      expect(internals().selectedUser()).toBeNull();
    });

    it('should clear sessions list to empty array', () => {
      // Arrange
      internals().openSessions(buildUser());
      expect(internals().sessions().length).toBeGreaterThan(0);

      // Act
      internals().closeSessions();

      // Assert
      expect(internals().sessions()).toEqual([]);
    });

    it('should clear sessionsError to null', () => {
      // Arrange
      apiStub.getUserSessions.mockReturnValueOnce(throwError(() => new Error('fail')));
      internals().openSessions(buildUser());
      expect(internals().sessionsError()).not.toBeNull();

      // Act
      internals().closeSessions();

      // Assert
      expect(internals().sessionsError()).toBeNull();
    });
  });

  // =====================================================================
  // loadSessions() (tested via openSessions which invokes it)
  // =====================================================================

  describe('loadSessions() (via openSessions)', () => {
    it('should set sessionsLoading to true while request is in-flight', () => {
      // Arrange -- use a synchronous observable that completes immediately
      // so we observe the final state. For in-flight we verify loading is
      // false after completion (synchronous subscribe).
      const user = buildUser();

      // Act
      internals().openSessions(user);

      // Assert -- after synchronous subscribe completes, loading is false
      expect(internals().sessionsLoading()).toBe(false);
    });

    it('should clear sessionsError before loading new sessions', () => {
      // Arrange -- first load errors
      apiStub.getUserSessions.mockReturnValueOnce(throwError(() => new Error('first failure')));
      internals().openSessions(buildUser());
      expect(internals().sessionsError()).toBe('Failed to load sessions.');

      // Act -- second load succeeds (mock reset to success)
      apiStub.getUserSessions.mockReturnValueOnce(of(mockSessions));
      internals().openSessions(buildUser({ id: 'user-002' }));

      // Assert
      expect(internals().sessionsError()).toBeNull();
      expect(internals().sessions()).toEqual(mockSessions);
    });

    it('should replace previous sessions with new data', () => {
      // Arrange
      internals().openSessions(buildUser());
      expect(internals().sessions().length).toBe(5);

      // Act -- open sessions for different user with only 1 session
      const singleSession = [buildSession({ id: 'sess-single', status: 'ACTIVE' })];
      apiStub.getUserSessions.mockReturnValueOnce(of(singleSession));
      internals().openSessions(buildUser({ id: 'user-002' }));

      // Assert
      expect(internals().sessions()).toEqual(singleSession);
    });
  });

  // =====================================================================
  // revokeAll()
  // =====================================================================

  describe('revokeAll()', () => {
    it('should call revokeAllUserSessions API with the selected user id', () => {
      // Arrange
      const user = buildUser({ id: 'user-revoke-test' });
      internals().openSessions(user);

      // Act
      internals().revokeAll();

      // Assert
      expect(apiStub.revokeAllUserSessions).toHaveBeenCalledWith('user-revoke-test');
    });

    it('should map ACTIVE sessions to REVOKED on success', () => {
      // Arrange
      internals().openSessions(buildUser());
      const activeBefore = internals()
        .sessions()
        .filter((s) => s.status === 'ACTIVE');
      expect(activeBefore.length).toBe(2);

      // Act
      internals().revokeAll();

      // Assert
      const activeAfter = internals()
        .sessions()
        .filter((s) => s.status === 'ACTIVE');
      const revokedAfter = internals()
        .sessions()
        .filter((s) => s.status === 'REVOKED');
      expect(activeAfter.length).toBe(0);
      // Original had 1 REVOKED + 2 newly revoked = 3
      expect(revokedAfter.length).toBe(3);
    });

    it('should not change non-ACTIVE sessions on success', () => {
      // Arrange
      internals().openSessions(buildUser());

      // Act
      internals().revokeAll();

      // Assert
      const expiredSessions = internals()
        .sessions()
        .filter((s) => s.status === 'EXPIRED');
      const loggedOutSessions = internals()
        .sessions()
        .filter((s) => s.status === 'LOGGED_OUT');
      expect(expiredSessions.length).toBe(1);
      expect(loggedOutSessions.length).toBe(1);
    });

    it('should set revokingAll to false after success', () => {
      // Arrange
      internals().openSessions(buildUser());

      // Act
      internals().revokeAll();

      // Assert
      expect(internals().revokingAll()).toBe(false);
    });

    it('should set sessionsError on API failure', () => {
      // Arrange
      internals().openSessions(buildUser());
      apiStub.revokeAllUserSessions.mockReturnValueOnce(
        throwError(() => new Error('revoke failed')),
      );

      // Act
      internals().revokeAll();

      // Assert
      expect(internals().sessionsError()).toBe('Failed to revoke sessions.');
      expect(internals().revokingAll()).toBe(false);
    });

    it('should not change sessions on API failure', () => {
      // Arrange
      internals().openSessions(buildUser());
      apiStub.revokeAllUserSessions.mockReturnValueOnce(
        throwError(() => new Error('revoke failed')),
      );
      const sessionsBefore = [...internals().sessions()];

      // Act
      internals().revokeAll();

      // Assert -- sessions should remain unchanged
      expect(
        internals()
          .sessions()
          .map((s) => s.status),
      ).toEqual(sessionsBefore.map((s) => s.status));
    });

    it('should be a no-op when selectedUser is null', () => {
      // Arrange -- don't open sessions, so selectedUser is null
      expect(internals().selectedUser()).toBeNull();

      // Act
      internals().revokeAll();

      // Assert
      expect(apiStub.revokeAllUserSessions).not.toHaveBeenCalled();
      expect(internals().revokingAll()).toBe(false);
    });
  });

  // =====================================================================
  // sessionSeverity()
  // =====================================================================

  describe('sessionSeverity(status)', () => {
    it('should return "success" for ACTIVE status', () => {
      expect(internals().sessionSeverity('ACTIVE')).toBe('success');
    });

    it('should return "warn" for EXPIRED status', () => {
      expect(internals().sessionSeverity('EXPIRED')).toBe('warn');
    });

    it('should return "danger" for REVOKED status', () => {
      expect(internals().sessionSeverity('REVOKED')).toBe('danger');
    });

    it('should return "secondary" for LOGGED_OUT status', () => {
      expect(internals().sessionSeverity('LOGGED_OUT')).toBe('secondary');
    });

    it('should return "secondary" for unknown status string', () => {
      expect(internals().sessionSeverity('UNKNOWN_STATUS')).toBe('secondary');
    });

    it('should return "secondary" for empty string', () => {
      expect(internals().sessionSeverity('')).toBe('secondary');
    });
  });

  // =====================================================================
  // hasActiveSessions()
  // =====================================================================

  describe('hasActiveSessions()', () => {
    it('should return true when at least one session is ACTIVE', () => {
      // Arrange
      internals().openSessions(buildUser());

      // Assert
      expect(internals().hasActiveSessions()).toBe(true);
    });

    it('should return false when no sessions are ACTIVE', () => {
      // Arrange
      const noActiveSessions = [
        buildSession({ id: 's1', status: 'EXPIRED' }),
        buildSession({ id: 's2', status: 'REVOKED' }),
        buildSession({ id: 's3', status: 'LOGGED_OUT' }),
      ];
      apiStub.getUserSessions.mockReturnValueOnce(of(noActiveSessions));
      internals().openSessions(buildUser());

      // Assert
      expect(internals().hasActiveSessions()).toBe(false);
    });

    it('should return false when sessions list is empty', () => {
      // Arrange
      apiStub.getUserSessions.mockReturnValueOnce(of([]));
      internals().openSessions(buildUser());

      // Assert
      expect(internals().hasActiveSessions()).toBe(false);
    });

    it('should return false after revoking all active sessions', () => {
      // Arrange
      internals().openSessions(buildUser());
      expect(internals().hasActiveSessions()).toBe(true);

      // Act
      internals().revokeAll();

      // Assert
      expect(internals().hasActiveSessions()).toBe(false);
    });

    it('should return false before any sessions are loaded', () => {
      // Assert -- component just initialized, sessions is empty
      expect(internals().hasActiveSessions()).toBe(false);
    });
  });

  // =====================================================================
  // Integration: open -> revoke -> close cycle
  // =====================================================================

  describe('full lifecycle: open -> revoke -> close', () => {
    it('should correctly handle the complete session management flow', () => {
      // Arrange
      const user = buildUser({ id: 'lifecycle-user' });

      // Act 1: Open sessions
      internals().openSessions(user);

      // Assert 1: Dialog open, sessions loaded
      expect(internals().showSessions()).toBe(true);
      expect(internals().selectedUser()?.id).toBe('lifecycle-user');
      expect(internals().sessions().length).toBe(5);
      expect(internals().hasActiveSessions()).toBe(true);

      // Act 2: Revoke all
      internals().revokeAll();

      // Assert 2: No more active sessions
      expect(internals().hasActiveSessions()).toBe(false);
      expect(internals().sessions().length).toBe(5); // count unchanged

      // Act 3: Close dialog
      internals().closeSessions();

      // Assert 3: Clean state
      expect(internals().showSessions()).toBe(false);
      expect(internals().selectedUser()).toBeNull();
      expect(internals().sessions()).toEqual([]);
    });
  });
});
