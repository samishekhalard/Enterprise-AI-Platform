import { CommonModule, DatePipe } from '@angular/common';
import {
  Component,
  computed,
  EventEmitter,
  inject,
  Input,
  OnChanges,
  Output,
  signal,
  SimpleChanges,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { ProgressBarModule } from 'primeng/progressbar';
import { TableModule } from 'primeng/table';
import { TabsModule } from 'primeng/tabs';
import { TagModule } from 'primeng/tag';
import { NgIcon } from '@ng-icons/core';
import { ApiGatewayService } from '../../../../core/api/api-gateway.service';
import { TenantIdentityProvider } from '../../../../core/api/models';
import {
  DETAIL_DRAWER_DIALOG_STYLE,
  DRAWER_DIALOG_BREAKPOINTS,
  drawerDialogPt,
} from '../../../../core/theme/overlay-presets';

export type DetailTab = 'config' | 'mapping' | 'sync' | 'tenants';

export interface SyncLogEntry {
  readonly id: string;
  readonly timestamp: string;
  readonly duration: string;
  readonly created: number;
  readonly updated: number;
  readonly deactivated: number;
  readonly errors: number;
  readonly status: 'success' | 'warning' | 'error';
  readonly errorDetails?: string;
}

export interface SyncSummary {
  readonly syncs: number;
  readonly created: number;
  readonly updated: number;
  readonly deactivated: number;
}

export interface AttributeMappingRow {
  readonly idpAttribute: string;
  readonly platformField: string;
  readonly mapped: boolean;
}

const MOCK_SYNC_LOG: SyncLogEntry[] = [
  {
    id: 's1',
    timestamp: '2026-03-06T08:00:00Z',
    duration: '4.2s',
    created: 3,
    updated: 12,
    deactivated: 0,
    errors: 0,
    status: 'success',
  },
  {
    id: 's2',
    timestamp: '2026-03-06T04:00:00Z',
    duration: '3.8s',
    created: 0,
    updated: 8,
    deactivated: 1,
    errors: 0,
    status: 'success',
  },
  {
    id: 's3',
    timestamp: '2026-03-05T20:00:00Z',
    duration: '5.1s',
    created: 2,
    updated: 15,
    deactivated: 0,
    errors: 2,
    status: 'warning',
  },
  {
    id: 's4',
    timestamp: '2026-03-05T16:00:00Z',
    duration: '3.2s',
    created: 0,
    updated: 5,
    deactivated: 0,
    errors: 0,
    status: 'success',
  },
  {
    id: 's5',
    timestamp: '2026-03-05T12:00:00Z',
    duration: '4.5s',
    created: 1,
    updated: 10,
    deactivated: 2,
    errors: 0,
    status: 'success',
  },
  {
    id: 's6',
    timestamp: '2026-03-05T08:00:00Z',
    duration: '6.3s',
    created: 0,
    updated: 0,
    deactivated: 0,
    errors: 5,
    status: 'error',
    errorDetails: 'LDAP bind failed: connection timeout after 30s',
  },
];

const DEFAULT_MAPPINGS: AttributeMappingRow[] = [
  { idpAttribute: 'email', platformField: 'Email', mapped: true },
  { idpAttribute: 'given_name', platformField: 'First Name', mapped: true },
  { idpAttribute: 'family_name', platformField: 'Last Name', mapped: true },
  { idpAttribute: 'sub', platformField: 'User ID', mapped: true },
  { idpAttribute: 'preferred_username', platformField: 'Username', mapped: true },
  { idpAttribute: 'phone_number', platformField: 'Phone', mapped: false },
  { idpAttribute: 'groups', platformField: 'Groups', mapped: true },
];

@Component({
  selector: 'app-auth-source-detail',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    DialogModule,
    ProgressBarModule,
    TableModule,
    TabsModule,
    TagModule,
    DatePipe,
    NgIcon,
  ],
  templateUrl: './auth-source-detail.component.html',
  styleUrl: './auth-source-detail.component.scss',
})
export class AuthSourceDetailComponent implements OnChanges {
  private readonly api = inject(ApiGatewayService);

  @Input() visible = false;
  @Input() provider: TenantIdentityProvider | null = null;
  @Input() tenantId = '';

  @Output() closed = new EventEmitter<void>();
  @Output() testConnection = new EventEmitter<TenantIdentityProvider>();
  @Output() syncNow = new EventEmitter<TenantIdentityProvider>();
  @Output() editConfig = new EventEmitter<TenantIdentityProvider>();
  @Output() toggleActive = new EventEmitter<TenantIdentityProvider>();
  @Output() removeSource = new EventEmitter<TenantIdentityProvider>();

  protected readonly activeTab = signal<DetailTab>('config');
  protected readonly testing = signal(false);
  protected readonly syncing = signal(false);
  protected readonly syncLog = signal<readonly SyncLogEntry[]>(MOCK_SYNC_LOG);
  protected readonly mappings = signal<readonly AttributeMappingRow[]>(DEFAULT_MAPPINGS);
  protected readonly showFullLog = signal(false);

  protected readonly syncSummary = signal<SyncSummary>({
    syncs: MOCK_SYNC_LOG.length,
    created: MOCK_SYNC_LOG.reduce((s, e) => s + e.created, 0),
    updated: MOCK_SYNC_LOG.reduce((s, e) => s + e.updated, 0),
    deactivated: MOCK_SYNC_LOG.reduce((s, e) => s + e.deactivated, 0),
  });
  protected readonly mappingRows = computed(() => [...this.mappings()]);
  protected readonly syncLogRows = computed(() => [...this.lastSyncEntries()]);
  protected readonly detailDialogPt = drawerDialogPt;
  protected readonly detailDialogStyle = DETAIL_DRAWER_DIALOG_STYLE;
  protected readonly detailDialogBreakpoints = DRAWER_DIALOG_BREAKPOINTS;
  protected readonly detailTablePt = {
    root: {
      style: {
        border: '1px solid var(--tp-border)',
        'border-radius': 'var(--nm-radius-lg)',
        overflow: 'hidden',
        background: 'var(--tp-surface-raised)',
      },
    },
    headerCell: {
      style: {
        padding: 'var(--tp-space-3)',
        color: 'var(--tp-text-muted)',
        'font-size': 'var(--tp-font-sm)',
        'font-weight': '600',
        'text-transform': 'uppercase',
        'letter-spacing': '0.03em',
        background: 'var(--tp-surface-muted)',
        'border-block-end': '1px solid var(--tp-border)',
      },
    },
    bodyCell: {
      style: {
        padding: 'var(--tp-space-3)',
        'vertical-align': 'top',
        'border-block-end': '1px solid color-mix(in srgb, var(--tp-border) 30%, transparent)',
      },
    },
  } as const;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['visible'] && this.visible) {
      this.activeTab.set('config');
      this.showFullLog.set(false);
    }
  }

  protected onTabChange(value: unknown): void {
    if (value === 'config' || value === 'mapping' || value === 'sync' || value === 'tenants') {
      this.activeTab.set(value);
    }
  }

  protected onClose(): void {
    this.closed.emit();
  }

  protected onDialogVisibleChange(visible: boolean): void {
    if (!visible) {
      this.onClose();
    }
  }

  protected onTestConnection(): void {
    if (this.provider) {
      this.testConnection.emit(this.provider);
    }
  }

  protected onSyncNow(): void {
    if (this.provider) {
      this.syncNow.emit(this.provider);
    }
  }

  protected onEditConfig(): void {
    if (this.provider) {
      this.editConfig.emit(this.provider);
    }
  }

  protected onToggleActive(): void {
    if (this.provider) {
      this.toggleActive.emit(this.provider);
    }
  }

  protected onRemoveSource(): void {
    if (this.provider) {
      this.removeSource.emit(this.provider);
    }
  }

  protected formatMetric(value: number): string {
    return value === 0 ? '\u2014' : String(value);
  }

  protected uptimeValue(): number {
    return 97.5; // Mock uptime
  }

  protected uptimeColor(): string {
    const val = this.uptimeValue();
    if (val > 95) return 'var(--tp-success, #428177)';
    if (val >= 80) return 'var(--tp-warning, #988561)';
    return 'var(--tp-danger, #6b1f2a)';
  }

  protected certExpiryDays(): number {
    return 142; // Mock
  }

  protected certExpiryColor(): 'danger' | 'warn' | 'secondary' {
    const days = this.certExpiryDays();
    if (days < 60) return 'danger';
    if (days < 180) return 'warn';
    return 'secondary';
  }

  protected statusSeverity(): 'success' | 'danger' {
    return this.provider?.status === 'active' ? 'success' : 'danger';
  }

  protected toggleFullLog(): void {
    this.showFullLog.update((v) => !v);
  }

  protected lastSyncEntries(): readonly SyncLogEntry[] {
    return this.showFullLog() ? this.syncLog() : this.syncLog().slice(0, 6);
  }
}
