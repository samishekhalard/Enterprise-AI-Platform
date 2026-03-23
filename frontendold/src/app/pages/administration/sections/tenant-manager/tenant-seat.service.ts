import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';
import { TokenService } from '../../../../core/services/token.service';
import {
  UserTier,
  SeatAvailabilityInfo,
  SeatAssignmentRequest,
  SeatAssignmentResponse
} from '../../models/administration.models';

/**
 * Maps backend UserTier enum values to frontend allocation property names.
 */
const TIER_KEYS = {
  TENANT_ADMIN: 'tenantAdmins',
  POWER_USER: 'powerUsers',
  CONTRIBUTOR: 'contributors',
  VIEWER: 'viewers'
} as const;

export type TierKey = typeof TIER_KEYS[keyof typeof TIER_KEYS];

export interface TenantSeatAllocation {
  tenantAdmins: number;
  powerUsers: number;
  contributors: number;
  viewers: number;
  usedTenantAdmins: number;
  usedPowerUsers: number;
  usedContributors: number;
  usedViewers: number;
}

export interface TierAvailability {
  tier: UserTier;
  tierKey: TierKey;
  label: string;
  maxSeats: number;
  assigned: number;
  available: number;
  unlimited: boolean;
}

const EMPTY_ALLOCATION: TenantSeatAllocation = {
  tenantAdmins: 0, powerUsers: 0, contributors: 0, viewers: 0,
  usedTenantAdmins: 0, usedPowerUsers: 0, usedContributors: 0, usedViewers: 0
};

/**
 * TenantSeatService
 *
 * Manages per-tenant seat availability and assignment through the
 * SeatManagementController API (via API Gateway → license-service:8085).
 *
 * Endpoints:
 *   GET    /api/v1/tenants/{tenantId}/seats/availability → Map<UserTier, SeatAvailabilityInfo>
 *   GET    /api/v1/tenants/{tenantId}/seats              → List<SeatAssignmentResponse>
 *   POST   /api/v1/tenants/{tenantId}/seats              → SeatAssignmentResponse
 *   DELETE /api/v1/tenants/{tenantId}/seats/{userId}      → 204
 */
@Injectable({
  providedIn: 'root'
})
export class TenantSeatService {
  private readonly http = inject(HttpClient);
  private readonly tokenService = inject(TokenService);
  private readonly baseUrl = `${environment.apiUrl}/api/v1/tenants`;

  // ---------------------------------------------------------------------------
  // State signals
  // ---------------------------------------------------------------------------
  private readonly _availability = signal<Map<string, TierAvailability[]>>(new Map());
  private readonly _assignments = signal<SeatAssignmentResponse[]>([]);
  private readonly _isLoading = signal(false);
  private readonly _error = signal<string | null>(null);

  readonly availability = this._availability.asReadonly();
  readonly assignments = this._assignments.asReadonly();
  readonly isLoading = this._isLoading.asReadonly();
  readonly error = this._error.asReadonly();

  // ---------------------------------------------------------------------------
  // API Methods
  // ---------------------------------------------------------------------------

  /**
   * Load seat availability for a tenant.
   * Returns per-tier allocation (maxSeats, assigned, available).
   */
  loadSeatAvailability(tenantId: string): void {
    this._isLoading.set(true);
    this._error.set(null);

    this.http.get<Record<string, SeatAvailabilityInfo>>(
      `${this.baseUrl}/${tenantId}/seats/availability`
    ).subscribe({
      next: (response) => {
        const tiers: TierAvailability[] = Object.entries(response).map(([tier, info]) => ({
          tier: tier as UserTier,
          tierKey: TIER_KEYS[tier as UserTier] ?? 'viewers',
          label: this.tierLabel(tier as UserTier),
          maxSeats: info.maxSeats,
          assigned: info.assigned,
          available: info.available,
          unlimited: info.unlimited
        }));

        this._availability.update(map => {
          const updated = new Map(map);
          updated.set(tenantId, tiers);
          return updated;
        });
        this._isLoading.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this._isLoading.set(false);
        if (err.status === 404) {
          // No tenant license — show empty allocations
          this._availability.update(map => {
            const updated = new Map(map);
            updated.set(tenantId, []);
            return updated;
          });
        } else if (err.status !== 0) {
          this._error.set(this.mapError(err));
        }
      }
    });
  }

  /**
   * Load current seat assignments for a tenant.
   */
  loadAssignments(tenantId: string): void {
    this.http.get<SeatAssignmentResponse[]>(
      `${this.baseUrl}/${tenantId}/seats`
    ).subscribe({
      next: (assignments) => this._assignments.set(assignments),
      error: () => this._assignments.set([])
    });
  }

  /**
   * Assign a seat to a user.
   */
  assignSeat(tenantId: string, userId: string, tier: UserTier): void {
    this._isLoading.set(true);
    this._error.set(null);

    const adminId = this.tokenService.getTokenClaims()?.sub ?? '';
    const request: SeatAssignmentRequest = { userId, tenantId, tier };

    this.http.post<SeatAssignmentResponse>(
      `${this.baseUrl}/${tenantId}/seats`,
      request,
      { headers: { 'X-User-ID': adminId } }
    ).subscribe({
      next: (response) => {
        this._assignments.update(list => [...list, response]);
        this._isLoading.set(false);
        // Refresh availability to reflect the new assignment
        this.loadSeatAvailability(tenantId);
      },
      error: (err: HttpErrorResponse) => {
        this._isLoading.set(false);
        this._error.set(this.mapError(err));
      }
    });
  }

  /**
   * Revoke a user's seat.
   */
  revokeSeat(tenantId: string, userId: string): void {
    this._isLoading.set(true);
    this._error.set(null);

    this.http.delete<void>(
      `${this.baseUrl}/${tenantId}/seats/${userId}`
    ).subscribe({
      next: () => {
        this._assignments.update(list => list.filter(a => a.userId !== userId));
        this._isLoading.set(false);
        this.loadSeatAvailability(tenantId);
      },
      error: (err: HttpErrorResponse) => {
        this._isLoading.set(false);
        this._error.set(this.mapError(err));
      }
    });
  }

  // ---------------------------------------------------------------------------
  // Helpers for tenant-manager component compatibility
  // ---------------------------------------------------------------------------

  /**
   * Get seat allocation in the format the tenant-manager component expects.
   */
  getAllocationForTenant(tenantId: string): TenantSeatAllocation {
    const tiers = this._availability().get(tenantId);
    if (!tiers || tiers.length === 0) return { ...EMPTY_ALLOCATION };

    const alloc = { ...EMPTY_ALLOCATION };
    for (const t of tiers) {
      switch (t.tier) {
        case 'TENANT_ADMIN':
          alloc.tenantAdmins = t.maxSeats;
          alloc.usedTenantAdmins = t.assigned;
          break;
        case 'POWER_USER':
          alloc.powerUsers = t.maxSeats;
          alloc.usedPowerUsers = t.assigned;
          break;
        case 'CONTRIBUTOR':
          alloc.contributors = t.maxSeats;
          alloc.usedContributors = t.assigned;
          break;
        case 'VIEWER':
          alloc.viewers = t.maxSeats;
          alloc.usedViewers = t.assigned;
          break;
      }
    }
    return alloc;
  }

  clearError(): void {
    this._error.set(null);
  }

  // ---------------------------------------------------------------------------
  // Private
  // ---------------------------------------------------------------------------

  private tierLabel(tier: UserTier): string {
    switch (tier) {
      case 'TENANT_ADMIN': return 'Tenant Admin';
      case 'POWER_USER': return 'Power Users';
      case 'CONTRIBUTOR': return 'Contributors';
      case 'VIEWER': return 'Viewers';
      default: return tier;
    }
  }

  private mapError(err: HttpErrorResponse): string {
    if (err.error?.message) return err.error.message;
    switch (err.status) {
      case 0: return 'Unable to connect to server.';
      case 400: return 'Invalid request. Please check the input.';
      case 401: return 'Session expired. Please log in again.';
      case 403: return 'You do not have permission to perform this action.';
      case 404: return 'Tenant license not found.';
      case 409: return 'User already has a seat assignment.';
      default: return `Unexpected error (${err.status}).`;
    }
  }
}
