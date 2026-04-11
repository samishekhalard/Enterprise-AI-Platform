import {
  Component,
  computed,
  output,
  signal,
  ChangeDetectionStrategy,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TagModule } from 'primeng/tag';
import { TableModule } from 'primeng/table';
import { PaginatorModule } from 'primeng/paginator';
import { SelectModule } from 'primeng/select';
import { ToggleButtonModule } from 'primeng/togglebutton';

import {
  TenantSummary,
  TenantType,
  TenantStatus,
  HealthStatus,
  SAMPLE_TENANTS,
} from './tenant-list.models';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('');
}

@Component({
  selector: 'app-tenant-list',
  standalone: true,
  imports: [
    FormsModule,
    ButtonModule,
    InputTextModule,
    TagModule,
    TableModule,
    PaginatorModule,
    SelectModule,
    ToggleButtonModule,
  ],
  templateUrl: './tenant-list.component.html',
  styleUrl: './tenant-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TenantListComponent {
  // ─── Outputs ──────────────────────────────────────────────────────────────

  /** Emits the tenant slug when a card is clicked. */
  readonly tenantSelected = output<string>();

  /** Emits when "New Tenant" button is clicked. */
  readonly createTenant = output<void>();

  // ─── State ────────────────────────────────────────────────────────────────

  readonly searchText = signal('');
  readonly activeTypeFilter = signal<TenantType | null>(null);
  readonly activeStatusFilter = signal<TenantStatus | null>(null);
  readonly tenants = signal<readonly TenantSummary[]>(SAMPLE_TENANTS);
  readonly viewMode = signal<'grid' | 'table'>('grid');
  readonly filtersVisible = signal(false);
  readonly currentPage = signal(0);
  readonly pageSize = signal(10);

  // ─── Dropdown option arrays ───────────────────────────────────────────────

  readonly typeOptions = [
    { label: 'All Types', value: null },
    { label: 'Master', value: 'MASTER' as TenantType },
    { label: 'Regular', value: 'REGULAR' as TenantType },
    { label: 'Dominant', value: 'DOMINANT' as TenantType },
  ];

  readonly statusOptions = [
    { label: 'All Statuses', value: null },
    { label: 'Active', value: 'ACTIVE' as TenantStatus },
    { label: 'Suspended', value: 'SUSPENDED' as TenantStatus },
    { label: 'Provisioning', value: 'PROVISIONING' as TenantStatus },
    { label: 'Failed', value: 'PROVISIONING_FAILED' as TenantStatus },
  ];

  // ─── Computed ─────────────────────────────────────────────────────────────

  readonly filteredTenants = computed(() => {
    const search = this.searchText().trim().toLowerCase();
    const type = this.activeTypeFilter();
    const status = this.activeStatusFilter();

    return this.tenants().filter((t) => {
      // Search filter
      if (search) {
        const matchesSearch =
          t.name.toLowerCase().includes(search) || t.shortName.toLowerCase().includes(search);
        if (!matchesSearch) return false;
      }

      // Type filter
      if (type !== null && t.type !== type) return false;

      // Status filter
      if (status !== null && t.status !== status) return false;

      return true;
    });
  });

  readonly hasActiveFilters = computed(
    () => this.activeTypeFilter() !== null || this.activeStatusFilter() !== null,
  );

  readonly resultCount = computed(() => this.filteredTenants().length);

  readonly isEmpty = computed(() => this.filteredTenants().length === 0);

  readonly totalRecords = computed(() => this.filteredTenants().length);

  readonly paginatedTenants = computed(() => {
    const filtered = this.filteredTenants();
    const start = this.currentPage() * this.pageSize();
    return filtered.slice(start, start + this.pageSize());
  });

  // ─── Actions ──────────────────────────────────────────────────────────────

  onSearchChange(value: string): void {
    this.searchText.set(value);
    this.currentPage.set(0);
  }

  onTypeFilterChange(value: TenantType | null): void {
    this.activeTypeFilter.set(value);
    this.currentPage.set(0);
  }

  onStatusFilterChange(value: TenantStatus | null): void {
    this.activeStatusFilter.set(value);
    this.currentPage.set(0);
  }

  toggleFilters(): void {
    this.filtersVisible.update((v) => !v);
  }

  clearFilters(): void {
    this.activeTypeFilter.set(null);
    this.activeStatusFilter.set(null);
    this.searchText.set('');
    this.currentPage.set(0);
  }

  onCardClick(tenant: TenantSummary): void {
    this.tenantSelected.emit(tenant.shortName);
  }

  onCreateTenant(): void {
    this.createTenant.emit();
  }

  onPageChange(event: { first?: number; rows?: number }): void {
    const first = event.first ?? 0;
    const rows = event.rows ?? this.pageSize();
    this.currentPage.set(Math.floor(first / rows));
    this.pageSize.set(rows);
  }

  // ─── Template Helpers ─────────────────────────────────────────────────────

  getInitials(name: string): string {
    return getInitials(name);
  }

  getAvatarClass(type: TenantType): string {
    switch (type) {
      case 'MASTER':
        return 'avatar-master';
      case 'REGULAR':
        return 'avatar-regular';
      case 'DOMINANT':
        return 'avatar-dominant';
    }
  }

  getTypeSeverity(type: TenantType): 'success' | 'warn' | 'danger' | 'info' | 'secondary' {
    switch (type) {
      case 'MASTER':
        return 'success';
      case 'REGULAR':
        return 'warn';
      case 'DOMINANT':
        return 'danger';
    }
  }

  getStatusDotClass(status: TenantStatus): string {
    switch (status) {
      case 'ACTIVE':
        return 'dot-active';
      case 'SUSPENDED':
        return 'dot-suspended';
      case 'PROVISIONING':
        return 'dot-provisioning';
      case 'PROVISIONING_FAILED':
        return 'dot-failed';
    }
  }

  getStatusLabel(status: TenantStatus): string {
    switch (status) {
      case 'ACTIVE':
        return 'Active';
      case 'SUSPENDED':
        return 'Suspended';
      case 'PROVISIONING':
        return 'Provisioning';
      case 'PROVISIONING_FAILED':
        return 'Failed';
    }
  }

  getHealthIcon(health: HealthStatus | null): string {
    switch (health) {
      case 'HEALTHY':
        return 'pi pi-check-circle';
      case 'DEGRADED':
        return 'pi pi-exclamation-triangle';
      case 'UNHEALTHY':
        return 'pi pi-times-circle';
      default:
        return '';
    }
  }

  getHealthClass(health: HealthStatus | null): string {
    switch (health) {
      case 'HEALTHY':
        return 'health-healthy';
      case 'DEGRADED':
        return 'health-degraded';
      case 'UNHEALTHY':
        return 'health-unhealthy';
      default:
        return '';
    }
  }

  getHealthLabel(health: HealthStatus | null): string {
    switch (health) {
      case 'HEALTHY':
        return 'Healthy';
      case 'DEGRADED':
        return 'Degraded';
      case 'UNHEALTHY':
        return 'Unhealthy';
      default:
        return '';
    }
  }

  trackByShortName(_index: number, tenant: TenantSummary): string {
    return tenant.shortName;
  }
}
