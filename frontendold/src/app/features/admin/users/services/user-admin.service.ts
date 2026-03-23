import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, catchError, tap, map, throwError } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import {
  TenantUser,
  UserListParams,
  PagedResponse
} from '../models/user.model';

/**
 * User Admin Service
 *
 * Manages tenant user data through the admin API.
 * Supports paginated listing with search, role, and status filters.
 */
@Injectable({
  providedIn: 'root'
})
export class UserAdminService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/api/v1/admin/tenants`;

  // State signals
  private readonly _users = signal<TenantUser[]>([]);
  private readonly _totalElements = signal(0);
  private readonly _totalPages = signal(0);
  private readonly _currentPage = signal(0);
  private readonly _pageSize = signal(10);
  private readonly _isLoading = signal(false);
  private readonly _error = signal<string | null>(null);

  // Public readonly signals
  readonly users = this._users.asReadonly();
  readonly totalElements = this._totalElements.asReadonly();
  readonly totalPages = this._totalPages.asReadonly();
  readonly currentPage = this._currentPage.asReadonly();
  readonly pageSize = this._pageSize.asReadonly();
  readonly isLoading = this._isLoading.asReadonly();
  readonly error = this._error.asReadonly();

  // Computed values
  readonly userCount = computed(() => this._users().length);
  readonly hasUsers = computed(() => this._users().length > 0);
  readonly isEmpty = computed(() => !this._isLoading() && this._users().length === 0);

  // =========================================================================
  // CRUD Operations
  // =========================================================================

  /**
   * Get paginated list of users for a tenant.
   *
   * @param tenantId - The tenant identifier
   * @param params - Pagination and filter parameters
   * @returns Observable of paged user response
   */
  getUsers(tenantId: string, params: UserListParams = {}): Observable<PagedResponse<TenantUser>> {
    this._isLoading.set(true);
    this._error.set(null);

    let httpParams = new HttpParams();
    if (params.page != null) {
      httpParams = httpParams.set('page', params.page.toString());
    }
    if (params.size != null) {
      httpParams = httpParams.set('size', params.size.toString());
    }
    if (params.search) {
      httpParams = httpParams.set('search', params.search);
    }
    if (params.role) {
      httpParams = httpParams.set('role', params.role);
    }
    if (params.status) {
      httpParams = httpParams.set('status', params.status);
    }

    return this.http
      .get<PagedResponse<TenantUser>>(`${this.apiUrl}/${tenantId}/users`, { params: httpParams })
      .pipe(
        map(response => this.mapPagedResponse(response)),
        tap(response => {
          this._users.set(response.content);
          this._totalElements.set(response.totalElements);
          this._totalPages.set(response.totalPages);
          this._currentPage.set(response.page);
          this._pageSize.set(response.size);
          this._isLoading.set(false);
        }),
        catchError(error => this.handleError<PagedResponse<TenantUser>>(error, 'Failed to load users'))
      );
  }

  /**
   * Get a single user by ID within a tenant.
   *
   * @param tenantId - The tenant identifier
   * @param userId - The user identifier
   * @returns Observable of the user
   */
  getUser(tenantId: string, userId: string): Observable<TenantUser> {
    this._isLoading.set(true);
    this._error.set(null);

    return this.http
      .get<TenantUser>(`${this.apiUrl}/${tenantId}/users/${userId}`)
      .pipe(
        map(user => this.mapUser(user)),
        tap(() => {
          this._isLoading.set(false);
        }),
        catchError(error => this.handleError<TenantUser>(error, 'Failed to load user'))
      );
  }

  // =========================================================================
  // State Management
  // =========================================================================

  /**
   * Clear error state.
   */
  clearError(): void {
    this._error.set(null);
  }

  /**
   * Reset all state to initial values.
   */
  reset(): void {
    this._users.set([]);
    this._totalElements.set(0);
    this._totalPages.set(0);
    this._currentPage.set(0);
    this._pageSize.set(10);
    this._isLoading.set(false);
    this._error.set(null);
  }

  // =========================================================================
  // Private Helpers
  // =========================================================================

  /**
   * Map the paged response, normalizing field names from the backend.
   */
  private mapPagedResponse(response: any): PagedResponse<TenantUser> {
    return {
      content: (response.content || []).map((u: any) => this.mapUser(u)),
      page: response.page ?? response.number ?? 0,
      size: response.size ?? 10,
      totalElements: response.totalElements ?? 0,
      totalPages: response.totalPages ?? 0
    };
  }

  /**
   * Map a single user from the backend response to the frontend model.
   */
  private mapUser(u: any): TenantUser {
    return {
      id: u.id,
      email: u.email ?? '',
      firstName: u.firstName ?? '',
      lastName: u.lastName ?? '',
      displayName: u.displayName || `${u.firstName ?? ''} ${u.lastName ?? ''}`.trim() || u.email,
      active: u.active ?? u.enabled ?? false,
      emailVerified: u.emailVerified ?? false,
      roles: u.roles ?? [],
      groups: u.groups ?? [],
      identityProvider: u.identityProvider ?? 'local',
      lastLoginAt: u.lastLoginAt ?? null,
      createdAt: u.createdAt ?? ''
    };
  }

  /**
   * Handle HTTP errors with user-friendly messages.
   */
  private handleError<T>(error: HttpErrorResponse, message: string): Observable<T> {
    this._isLoading.set(false);

    let errorMessage = message;
    if (error.error?.message) {
      errorMessage = error.error.message;
    } else if (error.status === 0) {
      errorMessage = 'Unable to connect to server. Please check your connection.';
    } else if (error.status === 401) {
      errorMessage = 'Session expired. Please log in again.';
    } else if (error.status === 403) {
      errorMessage = 'You do not have permission to perform this action.';
    } else if (error.status === 404) {
      errorMessage = 'The requested resource was not found.';
    }

    this._error.set(errorMessage);
    return throwError(() => new Error(errorMessage));
  }
}
