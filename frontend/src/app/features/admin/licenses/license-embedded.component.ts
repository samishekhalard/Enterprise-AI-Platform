import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, Input, OnChanges, OnInit, signal, SimpleChanges } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ApiGatewayService } from '../../../core/api/api-gateway.service';
import { SeatAssignment, SeatAvailabilityInfo, UserTier } from '../../../core/api/models';

interface TierAvailabilityView {
  tier: UserTier;
  label: string;
  maxSeats: number;
  maxSeatsLabel: string;
  assigned: number;
  available: number;
  availableLabel: string;
  unlimited: boolean;
  utilizationPercent: number;
}

const TIER_ORDER: readonly UserTier[] = ['TENANT_ADMIN', 'POWER_USER', 'CONTRIBUTOR', 'VIEWER'];

@Component({
  selector: 'app-license-embedded',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    CardModule,
    InputTextModule,
    MessageModule,
    ProgressSpinnerModule,
    TableModule,
    TagModule,
  ],
  templateUrl: './license-embedded.component.html',
  styleUrl: './license-embedded.component.scss',
})
export class LicenseEmbeddedComponent implements OnInit, OnChanges {
  private readonly api = inject(ApiGatewayService);

  @Input({ required: true }) tenantId = '';
  @Input() tenantName = 'Tenant';

  protected readonly loading = signal(false);
  protected readonly assigning = signal(false);
  protected readonly revokingUserId = signal<string | null>(null);
  protected readonly error = signal<string | null>(null);
  protected readonly info = signal<string | null>(null);
  protected readonly assignments = signal<SeatAssignment[]>([]);
  protected readonly availability = signal<Record<string, SeatAvailabilityInfo>>({});
  protected readonly assignUserId = signal('');
  protected readonly assignTier = signal<UserTier>('VIEWER');

  ngOnInit(): void {
    this.loadData();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['tenantId'] && !changes['tenantId'].firstChange) {
      this.assignUserId.set('');
      this.assignTier.set('VIEWER');
      this.loadData();
    }
  }

  protected loadData(): void {
    if (!this.tenantId.trim()) {
      this.error.set('Tenant identifier is missing.');
      this.availability.set({});
      this.assignments.set([]);
      return;
    }

    this.loading.set(true);
    this.error.set(null);
    this.info.set(null);

    this.api.getTenantSeatAvailability(this.tenantId).subscribe({
      next: (availability) => {
        this.availability.set(availability);
      },
      error: (error: unknown) => {
        if (error instanceof HttpErrorResponse && error.status === 404) {
          this.availability.set({});
          this.info.set('No tenant license allocation found for this tenant.');
          return;
        }
        this.error.set(this.resolveErrorMessage(error, 'Unable to load seat availability.'));
      },
    });

    this.api.listTenantSeatAssignments(this.tenantId).subscribe({
      next: (assignments) => {
        this.assignments.set(assignments);
        this.loading.set(false);
      },
      error: (error: unknown) => {
        this.assignments.set([]);
        this.loading.set(false);
        if (!this.error()) {
          this.error.set(this.resolveErrorMessage(error, 'Unable to load seat assignments.'));
        }
      },
    });
  }

  protected availabilityRows(): readonly TierAvailabilityView[] {
    const map = this.availability();
    return TIER_ORDER.map((tier) => {
      const item = map[tier];
      const maxSeats = item?.maxSeats ?? 0;
      const assigned = item?.assigned ?? 0;
      const available = item?.available ?? 0;
      const unlimited = item?.unlimited ?? false;
      return {
        tier,
        label: this.tierLabel(tier),
        maxSeats,
        maxSeatsLabel: item ? this.formatSeatNumber(maxSeats, unlimited) : '0',
        assigned,
        available,
        availableLabel: item ? this.formatSeatNumber(available, unlimited) : '0',
        unlimited,
        utilizationPercent: this.utilizationPercent(assigned, maxSeats, unlimited),
      };
    });
  }

  protected tierIconClass(tier: UserTier): string {
    if (tier === 'TENANT_ADMIN') {
      return 'pi-shield';
    }
    if (tier === 'POWER_USER') {
      return 'pi-bolt';
    }
    if (tier === 'CONTRIBUTOR') {
      return 'pi-pencil';
    }
    return 'pi-eye';
  }

  protected assignSeat(): void {
    const userId = this.assignUserId().trim();
    if (!isUuid(userId)) {
      this.error.set('User ID must be a valid UUID.');
      return;
    }

    this.assigning.set(true);
    this.error.set(null);

    this.api
      .assignTenantSeat(this.tenantId, {
        userId,
        tenantId: this.tenantId,
        tier: this.assignTier(),
      })
      .subscribe({
        next: () => {
          this.assigning.set(false);
          this.assignUserId.set('');
          this.loadData();
        },
        error: (error: unknown) => {
          this.assigning.set(false);
          this.error.set(this.resolveErrorMessage(error, 'Unable to assign seat.'));
        },
      });
  }

  protected revokeSeat(assignment: SeatAssignment): void {
    const confirmed = confirm(
      `Revoke ${this.tierLabel(assignment.tier)} seat for user ${assignment.userId}?`,
    );
    if (!confirmed) {
      return;
    }

    this.revokingUserId.set(assignment.userId);
    this.error.set(null);

    this.api.revokeTenantSeat(this.tenantId, assignment.userId).subscribe({
      next: () => {
        this.revokingUserId.set(null);
        this.loadData();
      },
      error: (error: unknown) => {
        this.revokingUserId.set(null);
        this.error.set(this.resolveErrorMessage(error, 'Unable to revoke seat.'));
      },
    });
  }

  protected isRevoking(userId: string): boolean {
    return this.revokingUserId() === userId;
  }

  protected prepareAssignTier(tier: UserTier): void {
    this.assignTier.set(tier);
    this.info.set(`${this.tierLabel(tier)} selected. Enter user UUID to assign.`);
    this.error.set(null);
  }

  protected tierLabel(tier: UserTier): string {
    if (tier === 'TENANT_ADMIN') {
      return 'Tenant Admin';
    }
    if (tier === 'POWER_USER') {
      return 'Power User';
    }
    if (tier === 'CONTRIBUTOR') {
      return 'Contributor';
    }
    return 'Viewer';
  }

  protected formatTimestamp(value?: string): string {
    if (!value) {
      return 'n/a';
    }
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      return value;
    }
    return parsed.toLocaleString();
  }

  private formatSeatNumber(value: number, unlimited: boolean): string {
    if (unlimited || value < 0) {
      return 'Unlimited';
    }
    return value.toString();
  }

  private utilizationPercent(assigned: number, maxSeats: number, unlimited: boolean): number {
    if (unlimited) {
      return assigned > 0 ? 100 : 0;
    }
    if (maxSeats <= 0) {
      return 0;
    }
    const percent = (assigned / maxSeats) * 100;
    return Math.max(0, Math.min(100, percent));
  }

  private resolveErrorMessage(error: unknown, fallback: string): string {
    if (error instanceof HttpErrorResponse) {
      if (error.status === 403) {
        return 'Access denied for tenant license management.';
      }
      if (error.status === 409) {
        return 'Seat assignment conflict: user may already have a seat.';
      }
      if (typeof error.error === 'string' && error.error.trim().length > 0) {
        return error.error;
      }
      if (typeof error.error === 'object' && error.error !== null) {
        const message = (error.error as Record<string, unknown>)['message'];
        if (typeof message === 'string' && message.trim().length > 0) {
          return message;
        }
      }
    }
    return fallback;
  }
}

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}
