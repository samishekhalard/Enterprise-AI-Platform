import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { of, throwError } from 'rxjs';
import { UserAdminService } from './user-admin.service';
import { TenantUser, PagedResponse } from '../models/user.model';
import { environment } from '../../../../../environments/environment';

describe('UserAdminService', () => {
  let service: UserAdminService;
  let httpMock: {
    get: ReturnType<typeof vi.fn>;
    post: ReturnType<typeof vi.fn>;
    put: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
  };
  const apiUrl = `${environment.apiUrl}/api/v1/admin/tenants`;
  const tenantId = 'tenant-master';

  // ===========================================================================
  // Test Data
  // ===========================================================================
  const mockSuperAdmin: TenantUser = {
    id: 'user-001',
    email: 'superadmin@emsist.com',
    firstName: 'Super',
    lastName: 'Admin',
    displayName: 'Super Admin',
    active: true,
    emailVerified: true,
    roles: ['SUPER_ADMIN', 'ADMIN'],
    groups: [],
    identityProvider: 'keycloak',
    lastLoginAt: '2026-02-26T08:00:00Z',
    createdAt: '2026-01-01T00:00:00Z'
  };

  const mockManager: TenantUser = {
    id: 'user-002',
    email: 'manager@emsist.com',
    firstName: 'Jane',
    lastName: 'Manager',
    displayName: 'Jane Manager',
    active: true,
    emailVerified: true,
    roles: ['MANAGER'],
    groups: ['operations'],
    identityProvider: 'keycloak',
    lastLoginAt: '2026-02-25T14:30:00Z',
    createdAt: '2026-01-15T00:00:00Z'
  };

  const mockDisabledUser: TenantUser = {
    id: 'user-003',
    email: 'disabled@emsist.com',
    firstName: 'Disabled',
    lastName: 'User',
    displayName: 'Disabled User',
    active: false,
    emailVerified: false,
    roles: ['USER'],
    groups: [],
    identityProvider: 'keycloak',
    lastLoginAt: null,
    createdAt: '2026-02-01T00:00:00Z'
  };

  const mockPagedResponse: PagedResponse<TenantUser> = {
    content: [mockSuperAdmin, mockManager, mockDisabledUser],
    page: 0,
    size: 10,
    totalElements: 3,
    totalPages: 1
  };

  const mockEmptyPagedResponse: PagedResponse<TenantUser> = {
    content: [],
    page: 0,
    size: 10,
    totalElements: 0,
    totalPages: 0
  };

  // ===========================================================================
  // Setup and Teardown
  // ===========================================================================
  beforeEach(() => {
    httpMock = {
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      delete: vi.fn()
    };

    TestBed.configureTestingModule({
      providers: [
        UserAdminService,
        { provide: HttpClient, useValue: httpMock }
      ]
    });

    service = TestBed.inject(UserAdminService);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // ===========================================================================
  // Creation Tests
  // ===========================================================================
  describe('Creation', () => {
    it('UT-FE-013: should be created', () => {
      // Arrange - (no arrangement needed)

      // Act - (service injected in beforeEach)

      // Assert
      expect(service).toBeTruthy();
    });

    it('UT-FE-014: should start with empty users list', () => {
      // Arrange - (no arrangement needed)

      // Act - (initial state)

      // Assert
      expect(service.users()).toEqual([]);
      expect(service.totalElements()).toBe(0);
      expect(service.totalPages()).toBe(0);
      expect(service.currentPage()).toBe(0);
      expect(service.isLoading()).toBe(false);
      expect(service.error()).toBeNull();
    });
  });

  // ===========================================================================
  // getUsers Tests
  // ===========================================================================
  describe('getUsers', () => {
    it('UT-FE-015: should call correct API URL with tenant ID', () => {
      // Arrange
      httpMock.get.mockReturnValue(of(mockPagedResponse));

      // Act
      service.getUsers(tenantId).subscribe();

      // Assert
      expect(httpMock.get).toHaveBeenCalledWith(
        `${apiUrl}/${tenantId}/users`,
        expect.objectContaining({ params: expect.anything() })
      );
    });

    it('UT-FE-016: should pass pagination params to HTTP call', () => {
      // Arrange
      httpMock.get.mockReturnValue(of(mockPagedResponse));

      // Act
      service.getUsers(tenantId, { page: 1, size: 20 }).subscribe();

      // Assert
      const callArgs = httpMock.get.mock.calls[0];
      const params = callArgs[1].params;
      expect(params.get('page')).toBe('1');
      expect(params.get('size')).toBe('20');
    });

    it('UT-FE-017: should pass search filter as query param', () => {
      // Arrange
      httpMock.get.mockReturnValue(of(mockPagedResponse));

      // Act
      service.getUsers(tenantId, { search: 'admin' }).subscribe();

      // Assert
      const callArgs = httpMock.get.mock.calls[0];
      const params = callArgs[1].params;
      expect(params.get('search')).toBe('admin');
    });

    it('UT-FE-018: should map backend response to TenantUser model', () => {
      // Arrange
      const backendResponse = {
        content: [{
          id: 'user-001',
          email: 'superadmin@emsist.com',
          firstName: 'Super',
          lastName: 'Admin',
          enabled: true,
          emailVerified: true,
          roles: ['SUPER_ADMIN', 'ADMIN'],
          groups: [],
          identityProvider: 'keycloak',
          lastLoginAt: '2026-02-26T08:00:00Z',
          createdAt: '2026-01-01T00:00:00Z'
        }],
        page: 0,
        size: 10,
        totalElements: 1,
        totalPages: 1
      };
      httpMock.get.mockReturnValue(of(backendResponse));

      // Act & Assert
      service.getUsers(tenantId).subscribe(result => {
        expect(result.content).toHaveLength(1);
        const user = result.content[0];
        expect(user.id).toBe('user-001');
        expect(user.email).toBe('superadmin@emsist.com');
        expect(user.firstName).toBe('Super');
        expect(user.lastName).toBe('Admin');
        expect(user.active).toBe(true); // mapped from 'enabled'
        expect(user.roles).toEqual(['SUPER_ADMIN', 'ADMIN']);
      });
    });

    it('UT-FE-019: should update users signal after successful fetch', () => {
      // Arrange
      httpMock.get.mockReturnValue(of(mockPagedResponse));

      // Act
      service.getUsers(tenantId).subscribe();

      // Assert
      expect(service.users().length).toBe(3);
      expect(service.totalElements()).toBe(3);
      expect(service.totalPages()).toBe(1);
      expect(service.currentPage()).toBe(0);
      expect(service.isLoading()).toBe(false);
      expect(service.hasUsers()).toBe(true);
    });

    it('UT-FE-020: should handle server error (500)', () => {
      // Arrange
      const errorResponse = new HttpErrorResponse({
        error: { message: 'Internal Server Error' },
        status: 500,
        statusText: 'Internal Server Error'
      });
      httpMock.get.mockReturnValue(throwError(() => errorResponse));

      // Act
      service.getUsers(tenantId).subscribe({
        error: () => { /* expected */ }
      });

      // Assert
      expect(service.error()).toBeTruthy();
      expect(service.isLoading()).toBe(false);
    });

    it('UT-FE-021: should handle network error (status 0)', () => {
      // Arrange
      const errorResponse = new HttpErrorResponse({
        error: null,
        status: 0,
        statusText: 'Unknown Error'
      });
      httpMock.get.mockReturnValue(throwError(() => errorResponse));

      // Act
      service.getUsers(tenantId).subscribe({
        error: () => { /* expected */ }
      });

      // Assert
      expect(service.error()).toContain('Unable to connect');
    });

    it('UT-FE-022: should handle permission error (403)', () => {
      // Arrange
      const errorResponse = new HttpErrorResponse({
        error: null,
        status: 403,
        statusText: 'Forbidden'
      });
      httpMock.get.mockReturnValue(throwError(() => errorResponse));

      // Act
      service.getUsers(tenantId).subscribe({
        error: () => { /* expected */ }
      });

      // Assert
      expect(service.error()).toContain('permission');
    });

    it('UT-FE-023: should set isLoading to true during fetch', () => {
      // Arrange
      // Use a subject-like approach: the mock returns an observable
      // that we control completion of
      let isLoadingDuringFetch = false;

      httpMock.get.mockImplementation(() => {
        // Capture loading state before the observable emits
        isLoadingDuringFetch = service.isLoading();
        return of(mockPagedResponse);
      });

      // Act
      service.getUsers(tenantId).subscribe();

      // Assert
      // isLoading was true when the HTTP call was initiated
      // (service sets _isLoading(true) before calling http.get)
      expect(isLoadingDuringFetch).toBe(true);
      // After completion, isLoading should be false
      expect(service.isLoading()).toBe(false);
    });
  });

  // ===========================================================================
  // State Management Tests
  // ===========================================================================
  describe('State Management', () => {
    it('UT-FE-024: reset should clear all state to initial values', () => {
      // Arrange - populate state first
      httpMock.get.mockReturnValue(of(mockPagedResponse));
      service.getUsers(tenantId).subscribe();
      expect(service.users().length).toBe(3); // confirm populated

      // Act
      service.reset();

      // Assert
      expect(service.users()).toEqual([]);
      expect(service.totalElements()).toBe(0);
      expect(service.totalPages()).toBe(0);
      expect(service.currentPage()).toBe(0);
      expect(service.pageSize()).toBe(10);
      expect(service.isLoading()).toBe(false);
      expect(service.error()).toBeNull();
      expect(service.isEmpty()).toBe(true);
      expect(service.hasUsers()).toBe(false);
    });

    it('should clear error when clearError is called', () => {
      // Arrange - set an error state
      const errorResponse = new HttpErrorResponse({
        error: null,
        status: 500,
        statusText: 'Server Error'
      });
      httpMock.get.mockReturnValue(throwError(() => errorResponse));
      service.getUsers(tenantId).subscribe({ error: () => {} });
      expect(service.error()).toBeTruthy(); // confirm error set

      // Act
      service.clearError();

      // Assert
      expect(service.error()).toBeNull();
    });

    it('should handle empty page response correctly', () => {
      // Arrange
      httpMock.get.mockReturnValue(of(mockEmptyPagedResponse));

      // Act
      service.getUsers(tenantId).subscribe();

      // Assert
      expect(service.users()).toEqual([]);
      expect(service.totalElements()).toBe(0);
      expect(service.isEmpty()).toBe(true);
      expect(service.hasUsers()).toBe(false);
    });
  });

  // ===========================================================================
  // getUser (single user) Tests
  // ===========================================================================
  describe('getUser', () => {
    it('should fetch a single user by ID', () => {
      // Arrange
      const backendUser = {
        id: 'user-001',
        email: 'superadmin@emsist.com',
        firstName: 'Super',
        lastName: 'Admin',
        enabled: true,
        emailVerified: true,
        roles: ['SUPER_ADMIN'],
        groups: [],
        identityProvider: 'keycloak',
        lastLoginAt: '2026-02-26T08:00:00Z',
        createdAt: '2026-01-01T00:00:00Z'
      };
      httpMock.get.mockReturnValue(of(backendUser));

      // Act & Assert
      service.getUser(tenantId, 'user-001').subscribe(user => {
        expect(user.id).toBe('user-001');
        expect(user.email).toBe('superadmin@emsist.com');
        expect(user.active).toBe(true);
      });

      expect(httpMock.get).toHaveBeenCalledWith(`${apiUrl}/${tenantId}/users/user-001`);
    });

    it('should handle 404 for non-existent user', () => {
      // Arrange
      const errorResponse = new HttpErrorResponse({
        error: null,
        status: 404,
        statusText: 'Not Found'
      });
      httpMock.get.mockReturnValue(throwError(() => errorResponse));

      // Act
      service.getUser(tenantId, 'nonexistent').subscribe({
        error: () => { /* expected */ }
      });

      // Assert
      expect(service.error()).toContain('not found');
    });
  });

  // ===========================================================================
  // Computed Values Tests
  // ===========================================================================
  describe('Computed values', () => {
    it('should compute userCount correctly', () => {
      // Arrange
      httpMock.get.mockReturnValue(of(mockPagedResponse));
      service.getUsers(tenantId).subscribe();

      // Act & Assert
      expect(service.userCount()).toBe(3);
    });

    it('should compute hasUsers correctly for empty state', () => {
      // Arrange - (initial state)

      // Act & Assert
      expect(service.hasUsers()).toBe(false);
    });

    it('should compute isEmpty correctly after loading with data', () => {
      // Arrange
      httpMock.get.mockReturnValue(of(mockPagedResponse));
      service.getUsers(tenantId).subscribe();

      // Act & Assert
      expect(service.isEmpty()).toBe(false);
    });
  });
});
