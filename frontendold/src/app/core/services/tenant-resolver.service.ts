import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, of, catchError, tap, map } from 'rxjs';
import { EnhancedTenant, DEFAULT_BRANDING, AuthProviderConfig } from '../../models/tenant.model';
import { environment } from '../../../environments/environment';

/**
 * TenantResolverService
 *
 * Resolves tenant configuration from the current hostname by calling
 * the backend API. The Master Tenant database contains the registry
 * of all tenants and their configurations.
 *
 * Flow:
 * 1. Extract hostname from window.location
 * 2. Call backend API: GET /api/tenants/resolve
 * 3. Backend looks up tenant by domain in Master Tenant database
 * 4. Returns tenant configuration (branding, auth providers, etc.)
 * 5. Cache tenant configuration for the session
 *
 * Required Backend API:
 * - GET /api/tenants/resolve
 *   Headers: X-Forwarded-Host: {hostname}
 *   Response: { tenant: EnhancedTenant, resolved: boolean, hostname: string }
 */
@Injectable({
  providedIn: 'root'
})
export class TenantResolverService {
  private http = inject(HttpClient);

  // Tenant state
  private _tenant = signal<EnhancedTenant | null>(null);
  private _isResolved = signal(false);
  private _error = signal<string | null>(null);
  private _isLoading = signal(false);

  // Public readonly signals
  readonly tenant = this._tenant.asReadonly();
  readonly isResolved = this._isResolved.asReadonly();
  readonly error = this._error.asReadonly();
  readonly isLoading = this._isLoading.asReadonly();

  // Computed values
  readonly currentTenant = computed(() => this._tenant());
  // UUID-only contract for request headers and auth calls.
  readonly tenantId = computed(() => {
    const tenant = this._tenant();
    const candidate = tenant?.uuid ?? tenant?.id ?? null;
    return candidate && this.isUuid(candidate) ? candidate : null;
  });
  readonly tenantUuid = computed(() => this._tenant()?.uuid ?? null);
  readonly tenantName = computed(() => this._tenant()?.fullName ?? 'Unknown');
  readonly tenantShortName = computed(() => this._tenant()?.shortName ?? '');
  readonly tenantBranding = computed(() => this._tenant()?.branding ?? DEFAULT_BRANDING);
  readonly authProviders = computed(() => this._tenant()?.authProviders ?? []);
  readonly isMultiTenant = computed(() => this._tenant()?.tenantType !== 'master');
  readonly isMasterTenant = computed(() => this._tenant()?.tenantType === 'master');

  /**
   * Resolve tenant from current hostname
   * Called by APP_INITIALIZER at startup
   */
  resolveTenant(): Observable<EnhancedTenant | null> {
    // Check for cached tenant first (for session persistence)
    const cached = this.getCachedTenant();
    if (cached && this.isValidCachedTenant(cached)) {
      this._tenant.set(cached);
      this._isResolved.set(true);
      console.log(`Tenant restored from cache: ${cached.fullName} (${cached.slug})`);
      return of(cached);
    }

    // Clear invalid cache
    if (cached) {
      console.warn('Cached tenant is invalid or missing authProviders, re-fetching...');
      sessionStorage.removeItem('tenant');
    }

    const hostname = this.extractHostname();
    this._isLoading.set(true);
    this._error.set(null);

    return this.http.get<TenantResolutionResponse>(
      `${environment.apiUrl}/api/tenants/resolve`
    ).pipe(
      map(response => {
        // Merge authProviders into tenant if provided separately
        const tenant = response.tenant;
        if (response.authProviders && response.authProviders.length > 0) {
          (tenant as any).authProviders = response.authProviders;
        }
        // Merge branding into tenant if provided separately
        if (response.branding) {
          (tenant as any).branding = response.branding;
        }
        return tenant;
      }),
      tap(tenant => {
        this._tenant.set(tenant);
        this._isResolved.set(true);
        this._isLoading.set(false);
        this.cacheTenant(tenant);
        console.log(`Tenant resolved: ${tenant.fullName} (${tenant.slug})`);
      }),
      catchError((error: HttpErrorResponse) => this.handleResolutionError(error, hostname))
    );
  }

  /**
   * Get tenant by ID
   * Used by Master Tenant admin to view tenant details
   */
  getTenantById(tenantId: string): Observable<EnhancedTenant> {
    return this.http.get<EnhancedTenant>(
      `${environment.apiUrl}/api/tenants/${tenantId}`
    );
  }

  /**
   * Get tenant configuration (full details including auth providers)
   */
  getTenantConfig(tenantId: string): Observable<EnhancedTenant> {
    return this.http.get<EnhancedTenant>(
      `${environment.apiUrl}/api/tenants/${tenantId}/config`
    );
  }

  /**
   * Switch to a different tenant (updates local state)
   * Used after tenant is fetched from API
   */
  switchTenant(tenant: EnhancedTenant): void {
    this._tenant.set(tenant);
    this.cacheTenant(tenant);
    console.log(`Switched to tenant: ${tenant.fullName} (${tenant.slug})`);
  }

  /**
   * Get Keycloak realm name for the current tenant
   * Master Tenant uses 'master' realm
   * Other tenants use 'realm-{slug}'
   */
  getRealmName(): string {
    const tenant = this._tenant();
    if (!tenant) return 'master';

    switch (tenant.tenantType) {
      case 'master':
        return 'master';
      case 'dominant':
        return `realm-dominant-${tenant.slug}`;
      case 'regular':
        return `realm-${tenant.slug}`;
      default:
        return `realm-${tenant.slug}`;
    }
  }

  /**
   * Get enabled auth providers for login page
   */
  getEnabledAuthProviders() {
    return this.authProviders().filter(p => p.isEnabled);
  }

  /**
   * Get primary auth provider
   */
  getPrimaryAuthProvider() {
    return this.authProviders().find(p => p.isPrimary && p.isEnabled);
  }

  /**
   * Check if a specific auth provider is enabled
   */
  isAuthProviderEnabled(type: string): boolean {
    return this.authProviders().some(p => p.type === type && p.isEnabled);
  }

  /**
   * Clear tenant state (for logout)
   */
  clearTenant(): void {
    this._tenant.set(null);
    this._isResolved.set(false);
    this._error.set(null);
    sessionStorage.removeItem('tenant');
  }

  // =========================================================================
  // Private Methods
  // =========================================================================

  private extractHostname(): string {
    return window.location.hostname;
  }

  private isUuid(value: string | null | undefined): value is string {
    if (!value) return false;
    // Match backend UUID parsing contract (java.util.UUID#fromString),
    // including non-RFC variant/version UUIDs used by legacy seed data.
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
  }

  private handleResolutionError(error: HttpErrorResponse, hostname: string): Observable<EnhancedTenant | null> {
    this._isLoading.set(false);

    if (error.status === 0 && !environment.production) {
      // Network error in development — backend not reachable, use fallback tenant.
      // This ensures the app is always usable during local development even
      // if the backend is slow to start or temporarily unavailable.
      console.warn('Backend not reachable, using development fallback tenant');
      const devTenant = this.getDevTenant(hostname);
      this._tenant.set(devTenant);
      this._isResolved.set(true);
      this.cacheTenant(devTenant);
      return of(devTenant);
    }

    this._isResolved.set(true);

    if (error.status === 0) {
      // Network error - backend not reachable (production)
      console.error('Tenant resolution failed: Backend not reachable');
      this._error.set('Unable to connect to server. Please check your connection.');
    } else if (error.status === 404) {
      // Tenant not found for this domain
      console.error(`Tenant not found for domain: ${hostname}`);
      this._error.set(`No organization found for domain: ${hostname}`);
    } else if (error.status === 403) {
      // Tenant is locked or suspended
      console.error(`Tenant access denied for domain: ${hostname}`);
      this._error.set('This organization is currently unavailable.');
    } else {
      console.error('Tenant resolution failed:', error);
      this._error.set(this.getErrorMessage(error));
    }

    return of(null);
  }

  /**
   * Development fallback tenant with auth providers configured
   * Used when backend is not available in development mode
   */
  private getDevTenant(hostname: string): EnhancedTenant {
    return {
      id: '68cd2a56-98c9-4ed4-8534-c299566d5b27',
      uuid: '68cd2a56-98c9-4ed4-8534-c299566d5b27',
      fullName: 'Master Tenant',
      shortName: 'master',
      slug: 'master',
      tenantType: 'master',
      tier: 'enterprise',
      status: 'active',
      domains: [
        {
          id: 'domain-dev-1',
          domain: hostname,
          isPrimary: true,
          isVerified: true,
          verificationMethod: 'dns-txt',
          sslStatus: 'active',
          createdAt: new Date().toISOString()
        }
      ],
      primaryDomain: hostname,
      authProviders: [
        {
          id: 'auth-local-1',
          type: 'local',
          name: 'local',
          displayName: 'Email & Password',
          icon: 'email',
          isEnabled: true,
          isPrimary: true,
          sortOrder: 1,
          config: {
            type: 'local',
            allowRegistration: false,
            requireEmailVerification: true,
            passwordPolicy: {
              minLength: 8,
              requireUppercase: true,
              requireLowercase: true,
              requireNumbers: true,
              requireSpecialChars: false,
              preventReuse: 5,
              expirationDays: 90
            }
          }
        }
      ],
      defaultAuthProvider: 'local',
      branding: {
        primaryColor: '#1e3a5f',
        primaryColorDark: '#152a45',
        secondaryColor: '#10b981',
        logoUrl: 'assets/images/logo.svg',
        faviconUrl: 'favicon.ico',
        fontFamily: "'Inter', sans-serif"
      },
      sessionConfig: {
        accessTokenLifetime: 5,
        refreshTokenLifetime: 30,
        idleTimeout: 15,
        absoluteTimeout: 480,
        maxConcurrentSessions: 5,
        allowMultipleDevices: true,
        requireDeviceApproval: false,
        enforceIpBinding: false,
        allowRememberMe: true,
        rememberMeDuration: 30
      },
      mfaConfig: {
        enabled: false,
        required: false,
        allowedMethods: ['totp', 'email'],
        defaultMethod: 'totp',
        gracePeriodDays: 7,
        rememberDeviceDays: 30
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }

  private cacheTenant(tenant: EnhancedTenant): void {
    try {
      sessionStorage.setItem('tenant', JSON.stringify(tenant));
    } catch (e) {
      console.warn('Failed to cache tenant:', e);
    }
  }

  private getCachedTenant(): EnhancedTenant | null {
    try {
      const cached = sessionStorage.getItem('tenant');
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  }

  /**
   * Validate cached tenant has required data
   * Re-fetches if authProviders are missing (indicates stale cache from before fix)
   */
  private isValidCachedTenant(tenant: EnhancedTenant): boolean {
    // Invalidate legacy dev fallback branding to avoid stale "EMSIST Dev" UI state.
    if (tenant.slug === 'emsist-dev' || tenant.shortName === 'EMSIST Dev') {
      return false;
    }

    // Invalidate older dev fallback cache that used a placeholder UUID not
    // recognized by current backend tenant records.
    if (tenant.uuid === '00000000-0000-0000-0000-000000000001') {
      return false;
    }

    // Tenant header contract requires UUID; invalidate stale legacy cache entries.
    const candidateTenantId = tenant.uuid ?? tenant.id;
    if (!this.isUuid(candidateTenantId)) {
      return false;
    }

    // Must have authProviders array with at least one enabled provider
    if (!tenant.authProviders || !Array.isArray(tenant.authProviders)) {
      return false;
    }
    if (tenant.authProviders.length === 0) {
      return false;
    }
    // Check at least one provider has required fields
    const hasValidProvider = tenant.authProviders.some(p =>
      p.type && typeof p.isEnabled === 'boolean'
    );
    return hasValidProvider;
  }

  private getErrorMessage(error: HttpErrorResponse): string {
    if (error.error?.message) {
      return error.error.message;
    }
    if (error.message) {
      return error.message;
    }
    return 'Failed to resolve organization';
  }
}

// ============================================================================
// API Response Types
// ============================================================================

interface TenantResolutionResponse {
  tenant: EnhancedTenant;
  authProviders?: AuthProviderConfig[];
  branding?: {
    primaryColor: string;
    primaryColorDark: string;
    secondaryColor: string;
    logoUrl: string;
    faviconUrl: string;
    fontFamily: string;
  };
  resolved: boolean;
  hostname: string;
}
