import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, of, catchError, tap, map, throwError } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import {
  ProviderConfig,
  ProviderTemplate,
  ProviderListResponse,
  TestConnectionResponse
} from '../models/provider-config.model';
import { PROVIDER_TEMPLATES } from '../data/provider-templates';

/**
 * Provider Admin Service
 *
 * Manages identity provider configurations through the auth-facade Admin API.
 * Supports CRUD operations, connection testing, and template management.
 */
@Injectable({
  providedIn: 'root'
})
export class ProviderAdminService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/api/v1/admin/tenants`;

  // State signals
  private readonly _providers = signal<ProviderConfig[]>([]);
  private readonly _selectedProvider = signal<ProviderConfig | null>(null);
  private readonly _isLoading = signal(false);
  private readonly _error = signal<string | null>(null);
  private readonly _isSaving = signal(false);
  private readonly _isTestingConnection = signal(false);

  // Public readonly signals
  readonly providers = this._providers.asReadonly();
  readonly selectedProvider = this._selectedProvider.asReadonly();
  readonly isLoading = this._isLoading.asReadonly();
  readonly error = this._error.asReadonly();
  readonly isSaving = this._isSaving.asReadonly();
  readonly isTestingConnection = this._isTestingConnection.asReadonly();

  // Computed values
  readonly providerCount = computed(() => this._providers().length);
  readonly enabledProviders = computed(() => this._providers().filter(p => p.enabled));
  readonly disabledProviders = computed(() => this._providers().filter(p => !p.enabled));
  readonly hasProviders = computed(() => this._providers().length > 0);

  // =========================================================================
  // CRUD Operations
  // =========================================================================

  /**
   * Get all providers for a tenant
   */
  getProviders(tenantId: string): Observable<ProviderConfig[]> {
    this._isLoading.set(true);
    this._error.set(null);

    return this.http.get<ProviderConfig[] | ProviderListResponse>(`${this.apiUrl}/${tenantId}/providers`).pipe(
      map(response => {
        // Handle both array response (backend) and wrapped response
        if (Array.isArray(response)) {
          return this.mapBackendProviders(response);
        }
        return this.mapBackendProviders((response as ProviderListResponse).providers);
      }),
      tap(providers => {
        this._providers.set(providers);
        this._isLoading.set(false);
      }),
      catchError(error => this.handleError<ProviderConfig[]>(error, 'Failed to load providers'))
    );
  }

  /**
   * Map backend provider response to frontend model.
   * Handles field name differences between backend and frontend.
   */
  private mapBackendProviders(providers: any[]): ProviderConfig[] {
    return providers.map(p => this.mapBackendProvider(p));
  }

  /**
   * Map a single backend provider to frontend model.
   */
  private mapBackendProvider(p: any): ProviderConfig {
    return {
      id: p.id,
      // Backend uses providerName, frontend uses both providerName and providerType
      providerName: p.providerName,
      providerType: (p.providerType || p.providerName) as any,
      protocol: p.protocol,
      displayName: p.displayName || p.providerName,
      enabled: p.enabled,
      status: p.enabled ? 'active' : 'inactive',
      clientId: p.clientId,
      clientSecret: p.clientSecret,
      discoveryUrl: p.discoveryUrl,
      authorizationUrl: p.authorizationUrl,
      tokenUrl: p.tokenUrl,
      userInfoUrl: p.userInfoUrl,
      jwksUrl: p.jwksUrl,
      scopes: p.scopes,
      pkceEnabled: p.pkceEnabled,
      metadataUrl: p.metadataUrl,
      serverUrl: p.serverUrl,
      port: p.port,
      bindDn: p.bindDn,
      userSearchBase: p.userSearchBase,
      idpHint: p.idpHint,
      sortOrder: p.priority,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
      lastTestedAt: p.lastTestedAt,
      testResult: p.testResult
    };
  }

  /**
   * Map frontend provider model to backend request format.
   */
  private mapToBackendRequest(config: ProviderConfig): any {
    return {
      providerName: config.providerName || config.providerType,
      displayName: config.displayName,
      protocol: config.protocol,
      clientId: config.clientId,
      clientSecret: config.clientSecret,
      discoveryUrl: config.discoveryUrl,
      authorizationUrl: config.authorizationUrl,
      tokenUrl: config.tokenUrl,
      userInfoUrl: config.userInfoUrl,
      jwksUrl: config.jwksUrl,
      scopes: config.scopes,
      metadataUrl: config.metadataUrl,
      serverUrl: config.serverUrl,
      port: config.port,
      bindDn: config.bindDn,
      bindPassword: config.bindPassword,
      userSearchBase: config.userSearchBase,
      userSearchFilter: config.userSearchFilter,
      idpHint: config.idpHint,
      enabled: config.enabled,
      priority: config.sortOrder
    };
  }

  /**
   * Get a single provider by ID
   */
  getProvider(tenantId: string, providerId: string): Observable<ProviderConfig> {
    this._isLoading.set(true);
    this._error.set(null);

    return this.http.get<any>(`${this.apiUrl}/${tenantId}/providers/${providerId}`).pipe(
      map(response => this.mapBackendProvider(response)),
      tap(provider => {
        this._selectedProvider.set(provider);
        this._isLoading.set(false);
      }),
      catchError(error => this.handleError<ProviderConfig>(error, 'Failed to load provider'))
    );
  }

  /**
   * Create a new provider
   */
  createProvider(tenantId: string, config: ProviderConfig): Observable<ProviderConfig> {
    this._isSaving.set(true);
    this._error.set(null);

    const request = this.mapToBackendRequest(config);
    return this.http.post<any>(`${this.apiUrl}/${tenantId}/providers`, request).pipe(
      map(response => this.mapBackendProvider(response)),
      tap(provider => {
        this._providers.update(list => [...list, provider]);
        this._isSaving.set(false);
      }),
      catchError(error => this.handleError<ProviderConfig>(error, 'Failed to create provider'))
    );
  }

  /**
   * Update an existing provider
   */
  updateProvider(
    tenantId: string,
    providerId: string,
    config: ProviderConfig
  ): Observable<ProviderConfig> {
    this._isSaving.set(true);
    this._error.set(null);

    const request = this.mapToBackendRequest(config);
    return this.http
      .put<any>(`${this.apiUrl}/${tenantId}/providers/${providerId}`, request)
      .pipe(
        map(response => this.mapBackendProvider(response)),
        tap(provider => {
          this._providers.update(list =>
            list.map(p => (p.id === providerId ? provider : p))
          );
          this._selectedProvider.set(provider);
          this._isSaving.set(false);
        }),
        catchError(error => this.handleError<ProviderConfig>(error, 'Failed to update provider'))
      );
  }

  /**
   * Delete a provider
   */
  deleteProvider(tenantId: string, providerId: string): Observable<void> {
    this._isSaving.set(true);
    this._error.set(null);

    return this.http.delete<void>(`${this.apiUrl}/${tenantId}/providers/${providerId}`).pipe(
      tap(() => {
        this._providers.update(list => list.filter(p => p.id !== providerId));
        if (this._selectedProvider()?.id === providerId) {
          this._selectedProvider.set(null);
        }
        this._isSaving.set(false);
      }),
      catchError(error => this.handleError<void>(error, 'Failed to delete provider'))
    );
  }

  /**
   * Toggle provider enabled status
   */
  toggleProviderEnabled(
    tenantId: string,
    providerId: string,
    enabled: boolean
  ): Observable<ProviderConfig> {
    return this.http
      .patch<any>(`${this.apiUrl}/${tenantId}/providers/${providerId}`, { enabled })
      .pipe(
        map(response => this.mapBackendProvider(response)),
        tap(provider => {
          this._providers.update(list =>
            list.map(p => (p.id === providerId ? provider : p))
          );
        }),
        catchError(error => this.handleError<ProviderConfig>(error, 'Failed to toggle provider'))
      );
  }

  // =========================================================================
  // Connection Testing
  // =========================================================================

  /**
   * Test connection to a provider
   */
  testConnection(tenantId: string, providerId: string): Observable<TestConnectionResponse> {
    this._isTestingConnection.set(true);

    return this.http
      .post<TestConnectionResponse>(
        `${this.apiUrl}/${tenantId}/providers/${providerId}/test`,
        {}
      )
      .pipe(
        tap(result => {
          // Update provider with test result
          this._providers.update(list =>
            list.map(p =>
              p.id === providerId
                ? {
                    ...p,
                    lastTestedAt: new Date().toISOString(),
                    testResult: result.success ? 'success' : 'failure'
                  }
                : p
            )
          );
          this._isTestingConnection.set(false);
        }),
        catchError(error => {
          this._isTestingConnection.set(false);
          return of({
            success: false,
            message: 'Connection test failed',
            error: error.message
          });
        })
      );
  }

  /**
   * Validate provider configuration without saving
   */
  validateConfig(tenantId: string, config: ProviderConfig): Observable<TestConnectionResponse> {
    return this.http
      .post<TestConnectionResponse>(`${this.apiUrl}/${tenantId}/providers/validate`, config)
      .pipe(
        catchError(error => {
          return of({
            success: false,
            message: 'Validation failed',
            error: error.message
          });
        })
      );
  }

  // =========================================================================
  // Template Management
  // =========================================================================

  /**
   * Get available provider templates
   */
  getProviderTemplates(): Observable<ProviderTemplate[]> {
    // Templates are static data, return from local constant
    // In a real implementation, this could fetch from the server
    return of(PROVIDER_TEMPLATES);
  }

  /**
   * Discover OIDC configuration from discovery URL
   */
  discoverOidcConfig(discoveryUrl: string): Observable<Partial<ProviderConfig>> {
    return this.http
      .get<{
        issuer: string;
        authorization_endpoint: string;
        token_endpoint: string;
        userinfo_endpoint: string;
        jwks_uri: string;
        scopes_supported?: string[];
      }>(discoveryUrl)
      .pipe(
        map(discovery => ({
          discoveryUrl,
          authorizationUrl: discovery.authorization_endpoint,
          tokenUrl: discovery.token_endpoint,
          userInfoUrl: discovery.userinfo_endpoint,
          jwksUrl: discovery.jwks_uri,
          scopes: discovery.scopes_supported?.filter(s =>
            ['openid', 'profile', 'email'].includes(s)
          ) || ['openid', 'profile', 'email']
        })),
        catchError(() =>
          of({
            discoveryUrl,
            scopes: ['openid', 'profile', 'email']
          })
        )
      );
  }

  // =========================================================================
  // State Management
  // =========================================================================

  /**
   * Select a provider for editing
   */
  selectProvider(provider: ProviderConfig | null): void {
    this._selectedProvider.set(provider);
  }

  /**
   * Clear selected provider
   */
  clearSelection(): void {
    this._selectedProvider.set(null);
  }

  /**
   * Clear error state
   */
  clearError(): void {
    this._error.set(null);
  }

  /**
   * Reset all state
   */
  reset(): void {
    this._providers.set([]);
    this._selectedProvider.set(null);
    this._isLoading.set(false);
    this._error.set(null);
    this._isSaving.set(false);
    this._isTestingConnection.set(false);
  }

  // =========================================================================
  // Private Helpers
  // =========================================================================

  private handleError<T>(error: HttpErrorResponse, message: string): Observable<T> {
    this._isLoading.set(false);
    this._isSaving.set(false);

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
