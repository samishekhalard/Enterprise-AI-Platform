import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';
import { TokenService } from '../../../../core/services/token.service';
import {
  LicenseState,
  LicenseStatusResponse,
  LicenseImportResponse
} from '../../models/administration.models';

/**
 * LicenseAdminService
 *
 * Manages application license state through the license-service Admin API.
 * Supports license status inspection, file import, and current license retrieval.
 *
 * Endpoints (via API Gateway → license-service:8085):
 *   GET  /api/v1/admin/licenses/status  → LicenseStatusResponse
 *   GET  /api/v1/admin/licenses/current → LicenseImportResponse (404 if none)
 *   POST /api/v1/admin/licenses/import  → LicenseImportResponse (multipart)
 */
@Injectable({
  providedIn: 'root'
})
export class LicenseAdminService {
  private readonly http = inject(HttpClient);
  private readonly tokenService = inject(TokenService);
  private readonly baseUrl = `${environment.apiUrl}/api/v1/admin/licenses`;

  // ---------------------------------------------------------------------------
  // Private writable signals
  // ---------------------------------------------------------------------------
  private readonly _licenseStatus = signal<LicenseStatusResponse | null>(null);
  private readonly _currentLicense = signal<LicenseImportResponse | null>(null);
  private readonly _isLoading = signal(false);
  private readonly _isImporting = signal(false);
  private readonly _error = signal<string | null>(null);

  // ---------------------------------------------------------------------------
  // Public readonly signals
  // ---------------------------------------------------------------------------
  readonly licenseStatus = this._licenseStatus.asReadonly();
  readonly currentLicense = this._currentLicense.asReadonly();
  readonly isLoading = this._isLoading.asReadonly();
  readonly isImporting = this._isImporting.asReadonly();
  readonly error = this._error.asReadonly();

  // ---------------------------------------------------------------------------
  // Computed signals
  // ---------------------------------------------------------------------------

  /** Current license state, defaults to UNLICENSED when no data loaded. */
  readonly licenseState = computed<LicenseState>(() =>
    this._licenseStatus()?.state ?? 'UNLICENSED'
  );

  /** True when the license is in a usable state (ACTIVE or GRACE). */
  readonly isLicensed = computed(() => {
    const state = this.licenseState();
    return state === 'ACTIVE' || state === 'GRACE';
  });

  /** True when a license has been imported (any state except UNLICENSED). */
  readonly hasLicense = computed(() =>
    this.licenseState() !== 'UNLICENSED'
  );

  /** Available features from the current license. */
  readonly features = computed(() =>
    this._licenseStatus()?.features ?? []
  );

  /** Days until license expiry. Negative means expired. Null if no expiry. */
  readonly daysUntilExpiry = computed<number | null>(() => {
    const expiresAt = this._licenseStatus()?.expiresAt;
    if (!expiresAt) return null;
    const diff = new Date(expiresAt).getTime() - Date.now();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  });

  // ---------------------------------------------------------------------------
  // API Methods
  // ---------------------------------------------------------------------------

  /**
   * Load the current license status from the backend.
   * Falls back to UNLICENSED state on network/server errors.
   */
  loadLicenseStatus(): void {
    this._isLoading.set(true);
    this._error.set(null);

    this.http.get<LicenseStatusResponse>(`${this.baseUrl}/status`).subscribe({
      next: (response) => {
        this._licenseStatus.set(response);
        this._isLoading.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this._isLoading.set(false);
        // On error, fall back to UNLICENSED so the UI shows the empty state
        // rather than a broken error page. This ensures backward compatibility
        // with E2E tests that don't mock the license API.
        this._licenseStatus.set({ state: 'UNLICENSED' });
        if (err.status !== 0) {
          // Only set error for server-side errors, not connection failures
          this._error.set(this.mapError(err));
        }
      }
    });
  }

  /**
   * Load the current active license details.
   * Handles 404 gracefully (no active license).
   */
  loadCurrentLicense(): void {
    this.http.get<LicenseImportResponse>(`${this.baseUrl}/current`).subscribe({
      next: (response) => {
        this._currentLicense.set(response);
      },
      error: (err: HttpErrorResponse) => {
        if (err.status === 404) {
          // No active license — not an error
          this._currentLicense.set(null);
        }
        // Silently ignore other errors for current license detail
      }
    });
  }

  /**
   * Import a .lic license file.
   * Sends as multipart/form-data with X-User-ID header.
   */
  importLicense(file: File): void {
    this._isImporting.set(true);
    this._error.set(null);

    const formData = new FormData();
    formData.append('file', file);

    const userId = this.tokenService.getTokenClaims()?.sub ?? '';

    this.http.post<LicenseImportResponse>(`${this.baseUrl}/import`, formData, {
      headers: { 'X-User-ID': userId }
    }).subscribe({
      next: (response) => {
        this._currentLicense.set(response);
        this._isImporting.set(false);
        // Refresh license status to pick up the new state
        this.loadLicenseStatus();
      },
      error: (err: HttpErrorResponse) => {
        this._isImporting.set(false);
        this._error.set(this.mapError(err));
      }
    });
  }

  /** Clear the error signal. */
  clearError(): void {
    this._error.set(null);
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  private mapError(err: HttpErrorResponse): string {
    if (err.error?.message) {
      return err.error.message;
    }
    switch (err.status) {
      case 0: return 'Unable to connect to server. Please check your connection.';
      case 400: return 'Invalid license file. Please check the file and try again.';
      case 401: return 'Session expired. Please log in again.';
      case 403: return 'You do not have permission to perform this action.';
      case 404: return 'The requested resource was not found.';
      case 409: return 'This license has already been imported.';
      default: return `Unexpected error (${err.status}). Please try again.`;
    }
  }
}
