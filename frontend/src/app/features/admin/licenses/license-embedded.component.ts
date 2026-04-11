import { CommonModule, formatDate } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, Input, OnChanges, OnInit, signal, SimpleChanges } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { NgIcon } from '@ng-icons/core';
import { ApiGatewayService } from '../../../core/api/api-gateway.service';
import { SeatAssignment, SeatAvailabilityInfo, UserTier } from '../../../core/api/models';
import {
  COMPACT_DIALOG_STYLE,
  MOBILE_DIALOG_BREAKPOINTS,
  standardDialogPt,
} from '../../../core/theme/overlay-presets';

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

interface SelectOption<T> {
  label: string;
  value: T;
}

const TIER_ORDER: readonly UserTier[] = ['TENANT_ADMIN', 'POWER_USER', 'CONTRIBUTOR', 'VIEWER'];

@Component({
  selector: 'app-license-embedded',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    DialogModule,
    InputTextModule,
    MessageModule,
    ProgressSpinnerModule,
    SelectModule,
    TableModule,
    TagModule,
    NgIcon,
  ],
  templateUrl: './license-embedded.component.html',
  styleUrl: './license-embedded.component.scss',
})
export class LicenseEmbeddedComponent implements OnInit, OnChanges {
  private readonly api = inject(ApiGatewayService);
  protected readonly tierOptions: SelectOption<UserTier>[] = [
    { label: 'Tenant Admin', value: 'TENANT_ADMIN' },
    { label: 'Power User', value: 'POWER_USER' },
    { label: 'Contributor', value: 'CONTRIBUTOR' },
    { label: 'Viewer', value: 'VIEWER' },
  ];
  protected readonly tierTablePt = {
    root: {
      style: {
        border: '1px solid var(--tp-surface)',
        'border-radius': 'var(--nm-radius-lg)',
        overflow: 'hidden',
      },
    },
    headerCell: {
      style: {
        padding: 'var(--tp-space-2)',
        background: 'var(--tp-surface)',
        'border-block-end': '1px solid var(--tp-surface)',
        color: 'var(--tp-text)',
      },
    },
    bodyCell: {
      style: {
        padding: 'var(--tp-space-2)',
        'border-block-end': '1px solid var(--tp-surface)',
      },
    },
  } as const;
  protected readonly assignmentTablePt = {
    root: {
      style: {
        border: '1px solid var(--tp-surface)',
        'border-radius': 'var(--nm-radius-md)',
        overflow: 'hidden',
      },
    },
    headerCell: {
      style: {
        padding: 'var(--tp-space-3)',
        background: 'var(--tp-surface)',
        'border-block-end': '1px solid var(--tp-surface)',
        color: 'var(--tp-text)',
      },
    },
    bodyCell: {
      style: {
        padding: 'var(--tp-space-3)',
        background: 'var(--tp-surface)',
        'border-block-end': '1px solid var(--tp-surface)',
      },
    },
  } as const;

  @Input({ required: true }) tenantId = '';
  @Input() tenantName = 'Tenant';

  protected readonly loading = signal(false);
  protected readonly assigning = signal(false);
  protected readonly revokingUserId = signal<string | null>(null);
  protected readonly revokeAssignment = signal<SeatAssignment | null>(null);
  protected readonly error = signal<string | null>(null);
  protected readonly info = signal<string | null>(null);
  protected readonly assignments = signal<SeatAssignment[]>([]);
  protected readonly availability = signal<Record<string, SeatAvailabilityInfo>>({});
  protected readonly assignUserId = signal('');
  protected readonly assignTier = signal<UserTier>('VIEWER');
  protected readonly assignmentRows = signal<SeatAssignment[]>([]);
  protected readonly dialogPt = standardDialogPt;
  protected readonly dialogStyle = COMPACT_DIALOG_STYLE;
  protected readonly dialogBreakpoints = MOBILE_DIALOG_BREAKPOINTS;

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
        this.assignmentRows.set([...assignments]);
        this.loading.set(false);
      },
      error: (error: unknown) => {
        this.assignments.set([]);
        this.assignmentRows.set([]);
        this.loading.set(false);
        if (!this.error()) {
          this.error.set(this.resolveErrorMessage(error, 'Unable to load seat assignments.'));
        }
      },
    });
  }

  protected availabilityRows(): TierAvailabilityView[] {
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

  protected tierIconName(tier: UserTier): string {
    if (tier === 'TENANT_ADMIN') {
      return 'phosphorShieldThin';
    }
    if (tier === 'POWER_USER') {
      return 'phosphorLightningThin';
    }
    if (tier === 'CONTRIBUTOR') {
      return 'phosphorPencilSimpleThin';
    }
    return 'phosphorEyeThin';
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

  protected requestRevokeSeat(assignment: SeatAssignment): void {
    this.revokeAssignment.set(assignment);
  }

  protected closeRevokeDialog(): void {
    this.revokeAssignment.set(null);
  }

  protected confirmRevokeSeat(): void {
    const assignment = this.revokeAssignment();
    if (!assignment) {
      return;
    }

    this.revokingUserId.set(assignment.userId);
    this.error.set(null);

    this.api.revokeTenantSeat(this.tenantId, assignment.userId).subscribe({
      next: () => {
        this.revokingUserId.set(null);
        this.revokeAssignment.set(null);
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
    return formatDate(parsed, 'dd MMM y, HH:mm', 'en-US');
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
