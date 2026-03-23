import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, catchError, tap, throwError, finalize } from 'rxjs';
import { environment } from '../../../environments/environment';

/**
 * TenantManagementService
 *
 * Manages tenant CRUD operations for Master Tenant superusers.
 * All operations are performed via the backend API.
 *
 * Required Backend APIs:
 * - GET /api/tenants - List all tenants (paginated)
 * - GET /api/tenants/:id - Get tenant by ID
 * - POST /api/tenants - Create new tenant
 * - PUT /api/tenants/:id - Update tenant
 * - DELETE /api/tenants/:id - Delete/deactivate tenant
 * - POST /api/tenants/:id/lock - Lock tenant
 * - POST /api/tenants/:id/unlock - Unlock tenant
 * - POST /api/tenants/:id/domains - Add domain
 * - POST /api/tenants/:id/domains/:domainId/verify - Verify domain
 * - PUT /api/tenants/:id/auth-providers - Configure auth providers
 * - PUT /api/tenants/:id/branding - Update branding
 */

// ============================================================================
// Types
// ============================================================================

export type TenantType = 'master' | 'dominant' | 'regular';
export type TenantStatus = 'active' | 'locked' | 'suspended' | 'pending';
export type TenantTier = 'free' | 'standard' | 'professional' | 'enterprise';

export interface ManagedTenant {
  id: string;
  uuid: string;
  fullName: string;
  shortName: string;
  slug: string;
  description?: string;
  logo?: string;
  tenantType: TenantType;
  tier: TenantTier;
  status: TenantStatus;
  isProtected: boolean;
  primaryDomain?: string;
  domainsCount: number;
  usersCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface TenantListResponse {
  tenants: ManagedTenant[];
  total: number;
  page: number;
  limit: number;
}

export interface TenantListParams {
  page?: number;
  limit?: number;
  status?: TenantStatus;
  type?: TenantType;
  search?: string;
}

export interface CreateTenantRequest {
  fullName: string;
  shortName: string;
  slug?: string;
  description?: string;
  tenantType: TenantType;
  tier: TenantTier;
  primaryDomain?: string;
  adminEmail: string;
  licenses?: {
    powerUsers: number;
    contributors: number;
    viewers: number;
  };
}

export interface UpdateTenantRequest {
  fullName?: string;
  shortName?: string;
  description?: string;
  logo?: string;
  tier?: TenantTier;
}

export interface TenantDomain {
  id: string;
  domain: string;
  isPrimary: boolean;
  isVerified: boolean;
  verificationToken?: string;
  verificationMethod: 'dns-txt' | 'dns-cname' | 'file';
  sslStatus: 'pending' | 'provisioning' | 'active' | 'failed';
  verifiedAt?: string;
  createdAt: string;
}

export interface AddDomainRequest {
  domain: string;
  isPrimary?: boolean;
}

export interface AddDomainResponse {
  id: string;
  domain: string;
  isPrimary: boolean;
  isVerified: boolean;
  verificationToken: string;
  verificationMethod: 'dns-txt' | 'dns-cname' | 'file';
}

export interface TenantLicense {
  id: string;
  tenantId: string;
  name: string;
  seats: number;
  usedSeats: number;
  expiresAt: string;
  status: 'active' | 'expired' | 'suspended';
}

// ============================================================================
// API Endpoints
// ============================================================================

const TENANT_ENDPOINTS = {
  LIST: '/api/tenants',
  GET: (id: string) => `/api/tenants/${id}`,
  CREATE: '/api/tenants',
  UPDATE: (id: string) => `/api/tenants/${id}`,
  DELETE: (id: string) => `/api/tenants/${id}`,
  LOCK: (id: string) => `/api/tenants/${id}/lock`,
  UNLOCK: (id: string) => `/api/tenants/${id}/unlock`,
  DOMAINS: (id: string) => `/api/tenants/${id}/domains`,
  VERIFY_DOMAIN: (id: string, domainId: string) => `/api/tenants/${id}/domains/${domainId}/verify`,
  AUTH_PROVIDERS: (id: string) => `/api/tenants/${id}/auth-providers`,
  BRANDING: (id: string) => `/api/tenants/${id}/branding`,
  LICENSES: (id: string) => `/api/tenants/${id}/licenses`,
} as const;

// ============================================================================
// Service
// ============================================================================

@Injectable({
  providedIn: 'root'
})
export class TenantManagementService {
  private http = inject(HttpClient);

  // State
  private _tenants = signal<ManagedTenant[]>([]);
  private _isLoading = signal(false);
  private _error = signal<string | null>(null);
  private _totalCount = signal(0);
  private _currentPage = signal(1);
  private _pageSize = signal(20);

  // Public readonly signals
  readonly tenants = this._tenants.asReadonly();
  readonly isLoading = this._isLoading.asReadonly();
  readonly error = this._error.asReadonly();
  readonly totalCount = this._totalCount.asReadonly();
  readonly currentPage = this._currentPage.asReadonly();
  readonly pageSize = this._pageSize.asReadonly();

  // Computed values
  readonly totalPages = computed(() => Math.ceil(this._totalCount() / this._pageSize()));
  readonly activeTenants = computed(() => this._tenants().filter(t => t.status === 'active'));
  readonly lockedTenants = computed(() => this._tenants().filter(t => t.status === 'locked'));
  readonly regularTenants = computed(() => this._tenants().filter(t => t.tenantType === 'regular'));

  // =========================================================================
  // List Tenants
  // =========================================================================

  loadTenants(params: TenantListParams = {}): Observable<TenantListResponse> {
    this._isLoading.set(true);
    this._error.set(null);

    let httpParams = new HttpParams();
    if (params.page) httpParams = httpParams.set('page', params.page.toString());
    if (params.limit) httpParams = httpParams.set('limit', params.limit.toString());
    if (params.status) httpParams = httpParams.set('status', params.status);
    if (params.type) httpParams = httpParams.set('type', params.type);
    if (params.search) httpParams = httpParams.set('search', params.search);

    return this.http.get<TenantListResponse>(
      `${environment.apiUrl}${TENANT_ENDPOINTS.LIST}`,
      { params: httpParams }
    ).pipe(
      tap(response => {
        this._tenants.set(response.tenants);
        this._totalCount.set(response.total);
        this._currentPage.set(response.page);
        this._pageSize.set(response.limit);
      }),
      catchError(error => this.handleError(error, 'Failed to load tenants')),
      finalize(() => this._isLoading.set(false))
    );
  }

  // =========================================================================
  // Get Single Tenant
  // =========================================================================

  getTenant(tenantId: string): Observable<ManagedTenant> {
    return this.http.get<ManagedTenant>(
      `${environment.apiUrl}${TENANT_ENDPOINTS.GET(tenantId)}`
    ).pipe(
      catchError(error => this.handleError(error, 'Failed to load tenant'))
    );
  }

  // =========================================================================
  // Create Tenant
  // =========================================================================

  createTenant(request: CreateTenantRequest): Observable<ManagedTenant> {
    this._isLoading.set(true);
    this._error.set(null);

    return this.http.post<ManagedTenant>(
      `${environment.apiUrl}${TENANT_ENDPOINTS.CREATE}`,
      request
    ).pipe(
      tap(newTenant => {
        this._tenants.update(tenants => [...tenants, newTenant]);
        this._totalCount.update(count => count + 1);
      }),
      catchError(error => this.handleError(error, 'Failed to create tenant')),
      finalize(() => this._isLoading.set(false))
    );
  }

  // =========================================================================
  // Update Tenant
  // =========================================================================

  updateTenant(tenantId: string, request: UpdateTenantRequest): Observable<ManagedTenant> {
    this._isLoading.set(true);
    this._error.set(null);

    return this.http.put<ManagedTenant>(
      `${environment.apiUrl}${TENANT_ENDPOINTS.UPDATE(tenantId)}`,
      request
    ).pipe(
      tap(updatedTenant => {
        this._tenants.update(tenants =>
          tenants.map(t => t.id === tenantId ? updatedTenant : t)
        );
      }),
      catchError(error => this.handleError(error, 'Failed to update tenant')),
      finalize(() => this._isLoading.set(false))
    );
  }

  // =========================================================================
  // Delete Tenant
  // =========================================================================

  deleteTenant(tenantId: string): Observable<void> {
    this._isLoading.set(true);
    this._error.set(null);

    return this.http.delete<void>(
      `${environment.apiUrl}${TENANT_ENDPOINTS.DELETE(tenantId)}`
    ).pipe(
      tap(() => {
        this._tenants.update(tenants => tenants.filter(t => t.id !== tenantId));
        this._totalCount.update(count => count - 1);
      }),
      catchError(error => this.handleError(error, 'Failed to delete tenant')),
      finalize(() => this._isLoading.set(false))
    );
  }

  // =========================================================================
  // Lock/Unlock Tenant
  // =========================================================================

  lockTenant(tenantId: string): Observable<ManagedTenant> {
    return this.http.post<ManagedTenant>(
      `${environment.apiUrl}${TENANT_ENDPOINTS.LOCK(tenantId)}`,
      {}
    ).pipe(
      tap(updatedTenant => {
        this._tenants.update(tenants =>
          tenants.map(t => t.id === tenantId ? updatedTenant : t)
        );
      }),
      catchError(error => this.handleError(error, 'Failed to lock tenant'))
    );
  }

  unlockTenant(tenantId: string): Observable<ManagedTenant> {
    return this.http.post<ManagedTenant>(
      `${environment.apiUrl}${TENANT_ENDPOINTS.UNLOCK(tenantId)}`,
      {}
    ).pipe(
      tap(updatedTenant => {
        this._tenants.update(tenants =>
          tenants.map(t => t.id === tenantId ? updatedTenant : t)
        );
      }),
      catchError(error => this.handleError(error, 'Failed to unlock tenant'))
    );
  }

  // =========================================================================
  // Domain Management
  // =========================================================================

  getTenantDomains(tenantId: string): Observable<TenantDomain[]> {
    return this.http.get<TenantDomain[]>(
      `${environment.apiUrl}${TENANT_ENDPOINTS.DOMAINS(tenantId)}`
    ).pipe(
      catchError(error => this.handleError(error, 'Failed to load domains'))
    );
  }

  addDomain(tenantId: string, request: AddDomainRequest): Observable<AddDomainResponse> {
    return this.http.post<AddDomainResponse>(
      `${environment.apiUrl}${TENANT_ENDPOINTS.DOMAINS(tenantId)}`,
      request
    ).pipe(
      catchError(error => this.handleError(error, 'Failed to add domain'))
    );
  }

  verifyDomain(tenantId: string, domainId: string): Observable<TenantDomain> {
    return this.http.post<TenantDomain>(
      `${environment.apiUrl}${TENANT_ENDPOINTS.VERIFY_DOMAIN(tenantId, domainId)}`,
      {}
    ).pipe(
      catchError(error => this.handleError(error, 'Failed to verify domain'))
    );
  }

  // =========================================================================
  // License Management
  // =========================================================================

  getTenantLicenses(tenantId: string): Observable<TenantLicense[]> {
    return this.http.get<TenantLicense[]>(
      `${environment.apiUrl}${TENANT_ENDPOINTS.LICENSES(tenantId)}`
    ).pipe(
      catchError(error => this.handleError(error, 'Failed to load licenses'))
    );
  }

  // =========================================================================
  // Helper Methods
  // =========================================================================

  clearError(): void {
    this._error.set(null);
  }

  private handleError(error: HttpErrorResponse, defaultMessage: string): Observable<never> {
    let message = defaultMessage;

    if (error.status === 0) {
      message = 'Unable to connect to server. Please check your connection.';
    } else if (error.error?.message) {
      message = error.error.message;
    } else if (error.status === 401) {
      message = 'Session expired. Please log in again.';
    } else if (error.status === 403) {
      message = 'You do not have permission to perform this action.';
    } else if (error.status === 404) {
      message = 'The requested resource was not found.';
    } else if (error.status === 409) {
      message = 'A tenant with this name or domain already exists.';
    }

    this._error.set(message);
    console.error('TenantManagementService error:', error);
    return throwError(() => new Error(message));
  }
}
