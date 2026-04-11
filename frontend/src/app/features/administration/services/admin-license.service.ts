import { HttpErrorResponse } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { ApiGatewayService } from '../../../core/api/api-gateway.service';
import {
  LicenseImportResponse,
  LicenseState,
  LicenseStatusResponse,
} from '../../../core/api/models';

@Injectable({
  providedIn: 'root',
})
export class AdminLicenseService {
  private readonly api = inject(ApiGatewayService);

  private readonly _status = signal<LicenseStatusResponse | null>(null);
  private readonly _currentLicense = signal<LicenseImportResponse | null>(null);
  private readonly _isLoading = signal(false);
  private readonly _isImporting = signal(false);
  private readonly _error = signal<string | null>(null);

  readonly status = this._status.asReadonly();
  readonly currentLicense = this._currentLicense.asReadonly();
  readonly isLoading = this._isLoading.asReadonly();
  readonly isImporting = this._isImporting.asReadonly();
  readonly error = this._error.asReadonly();

  readonly state = computed<LicenseState>(() => this._status()?.state ?? 'UNLICENSED');
  readonly features = computed(() => this._status()?.features ?? []);

  readonly daysUntilExpiry = computed<number | null>(() => {
    const expiresAt = this._status()?.expiresAt;
    if (!expiresAt) {
      return null;
    }

    const diffMs = new Date(expiresAt).getTime() - Date.now();
    return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  });

  load(): void {
    this._isLoading.set(true);
    this._error.set(null);

    this.api.getLicenseStatus().subscribe({
      next: (status) => {
        this._status.set(status);
        this._isLoading.set(false);
      },
      error: (error: unknown) => {
        this._status.set({ state: 'UNLICENSED' });
        this._error.set(mapHttpError(error));
        this._isLoading.set(false);
      },
    });

    this.api.getCurrentLicense().subscribe({
      next: (license) => {
        this._currentLicense.set(license);
      },
      error: () => {
        this._currentLicense.set(null);
      },
    });
  }

  importLicense(file: File): void {
    this._isImporting.set(true);
    this._error.set(null);

    this.api.importLicense(file).subscribe({
      next: (license) => {
        this._currentLicense.set(license);
        this._isImporting.set(false);
        this.load();
      },
      error: (error: unknown) => {
        this._error.set(mapHttpError(error));
        this._isImporting.set(false);
      },
    });
  }

  clearError(): void {
    this._error.set(null);
  }
}

function mapHttpError(error: unknown): string {
  if (error instanceof HttpErrorResponse) {
    if (error.error?.message && typeof error.error.message === 'string') {
      return error.error.message;
    }

    switch (error.status) {
      case 0:
        return 'Unable to connect to backend service.';
      case 400:
        return 'Invalid request payload.';
      case 401:
        return 'Session expired. Sign in again.';
      case 403:
        return 'Insufficient permissions for license management.';
      case 409:
        return 'This license appears to already be imported.';
      default:
        return `License operation failed (${error.status}).`;
    }
  }

  return 'License operation failed.';
}
