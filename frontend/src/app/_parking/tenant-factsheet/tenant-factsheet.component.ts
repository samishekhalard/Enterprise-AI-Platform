import { Component, computed, input, output, signal, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TagModule } from 'primeng/tag';
import { TableModule } from 'primeng/table';
import { TabsModule } from 'primeng/tabs';
import { PaginatorModule } from 'primeng/paginator';
import { ToggleButtonModule } from 'primeng/togglebutton';
import { BreadcrumbModule } from 'primeng/breadcrumb';

import {
  TenantFactsheet,
  FactsheetTab,
  LifecycleAction,
  LifecycleActionDef,
  LIFECYCLE_ACTIONS,
  FACTSHEET_TABS,
  SAMPLE_USERS,
  SAMPLE_INTEGRATIONS,
  SAMPLE_DICTIONARY,
  SAMPLE_AGENTS,
  SAMPLE_AUDIT,
  SAMPLE_HEALTH_CHECKS,
  SAMPLE_LICENSE,
  SAMPLE_TENANT,
  TenantType,
  TenantStatus,
  HealthStatus,
} from './tenant-factsheet.models';

@Component({
  selector: 'app-tenant-factsheet',
  standalone: true,
  imports: [
    FormsModule,
    ButtonModule,
    InputTextModule,
    TagModule,
    TableModule,
    TabsModule,
    PaginatorModule,
    ToggleButtonModule,
    BreadcrumbModule,
  ],
  templateUrl: './tenant-factsheet.component.html',
  styleUrl: './tenant-factsheet.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TenantFactsheetComponent {
  // ─── Inputs / Outputs ──────────────────────────────────────────────────────

  /** Tenant data to display. Defaults to sample Acme Corp. */
  readonly tenant = input<TenantFactsheet>(SAMPLE_TENANT);

  /** Emits when user clicks "Back" to return to tenant list. */
  readonly back = output<void>();

  /** Emits lifecycle actions (suspend, reactivate). */
  readonly lifecycleAction = output<LifecycleAction>();

  // ─── Signals ───────────────────────────────────────────────────────────────

  /** Currently active tab. */
  readonly activeTab = signal<FactsheetTab>('users');

  /** Users tab — search + filter toggle. */
  /** Per-tab search + filter + view mode signals. */
  readonly usersSearch = signal('');
  readonly usersFiltersVisible = signal(false);

  readonly integrationsSearch = signal('');
  readonly integrationsFiltersVisible = signal(false);
  readonly integrationsViewMode = signal<'table' | 'grid'>('grid');

  readonly dictionarySearch = signal('');
  readonly dictionaryFiltersVisible = signal(false);
  readonly dictionaryViewMode = signal<'table' | 'grid'>('table');

  readonly auditSearch = signal('');
  readonly auditFiltersVisible = signal(false);
  readonly auditViewMode = signal<'table' | 'grid'>('table');

  readonly healthSearch = signal('');
  readonly healthFiltersVisible = signal(false);
  readonly healthViewMode = signal<'table' | 'grid'>('grid');

  // ─── Tab Definitions ───────────────────────────────────────────────────────

  readonly tabs = FACTSHEET_TABS;

  // ─── Sample Data ───────────────────────────────────────────────────────────

  readonly users = SAMPLE_USERS;
  readonly integrations = SAMPLE_INTEGRATIONS;
  readonly dictionary = SAMPLE_DICTIONARY;
  readonly agents = SAMPLE_AGENTS;
  readonly auditLog = SAMPLE_AUDIT;
  readonly healthChecks = SAMPLE_HEALTH_CHECKS;
  readonly license = SAMPLE_LICENSE;

  // ─── Computed ──────────────────────────────────────────────────────────────

  /** Initials for the logo placeholder. */
  readonly initials = computed(() => {
    const name = this.tenant().name;
    const parts = name.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  });

  /** Contextual lifecycle action button config. */
  readonly lifecycleActionDef = computed<LifecycleActionDef | null>(() => {
    return LIFECYCLE_ACTIONS[this.tenant().status];
  });

  /** Breadcrumb items. */
  readonly breadcrumbItems = computed(() => [
    { label: 'Administration' },
    { label: 'Tenant Manager' },
    { label: this.tenant().name },
  ]);

  readonly allocatedSeats = computed(() =>
    this.license.allocations.reduce((total, allocation) => total + allocation.allocated, 0),
  );

  readonly assignedSeats = computed(() =>
    this.license.allocations.reduce((total, allocation) => total + allocation.assigned, 0),
  );

  readonly availableSeats = computed(() =>
    this.license.allocations.reduce((total, allocation) => total + allocation.available, 0),
  );

  readonly breadcrumbHome = { icon: 'pi pi-home' };

  // ─── Template Helpers ──────────────────────────────────────────────────────

  typeSeverity(type: TenantType): 'success' | 'info' | 'warn' | 'danger' | 'secondary' {
    switch (type) {
      case 'MASTER':
        return 'info';
      case 'DOMINANT':
        return 'warn';
      case 'REGULAR':
        return 'secondary';
    }
  }

  statusColor(status: TenantStatus): string {
    switch (status) {
      case 'ACTIVE':
        return 'var(--tp-success)';
      case 'SUSPENDED':
        return 'var(--tp-warning)';
      case 'PROVISIONING':
        return 'var(--tp-primary)';
      case 'PROVISIONING_FAILED':
        return 'var(--tp-danger)';
    }
  }

  healthColor(health: HealthStatus): string {
    switch (health) {
      case 'HEALTHY':
        return 'var(--tp-success)';
      case 'DEGRADED':
        return 'var(--tp-warning)';
      case 'UNHEALTHY':
        return 'var(--tp-danger)';
    }
  }

  healthSeverity(health: HealthStatus): 'success' | 'warn' | 'danger' {
    switch (health) {
      case 'HEALTHY':
        return 'success';
      case 'DEGRADED':
        return 'warn';
      case 'UNHEALTHY':
        return 'danger';
    }
  }

  userStatusSeverity(
    status: 'Active' | 'Invited' | 'Disabled',
  ): 'success' | 'info' | 'warn' | 'danger' | 'secondary' {
    switch (status) {
      case 'Active':
        return 'success';
      case 'Invited':
        return 'info';
      case 'Disabled':
        return 'danger';
    }
  }

  // ─── Actions ───────────────────────────────────────────────────────────────

  onTabChange(tab: string): void {
    this.activeTab.set(tab as FactsheetTab);
  }

  onBack(): void {
    this.back.emit();
  }

  onLifecycleAction(): void {
    const def = this.lifecycleActionDef();
    if (def) {
      this.lifecycleAction.emit(def.action);
    }
  }
}
