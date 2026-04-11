import { Component, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { TenantListComponent } from './tenant-list/tenant-list.component';
import { TenantFactsheetComponent } from './tenant-factsheet/tenant-factsheet.component';
import { CreateTenantFormComponent } from './create-tenant-form/create-tenant-form.component';
import {
  LifecycleDialogsComponent,
  LifecycleAction,
} from './lifecycle-dialogs/lifecycle-dialogs.component';
import { SAMPLE_TENANTS } from './tenant-list/tenant-list.models';
import { SAMPLE_TENANT, TenantFactsheet } from './tenant-factsheet/tenant-factsheet.models';

type Screen = 'list' | 'factsheet';

@Component({
  selector: 'app-parking-preview',
  standalone: true,
  imports: [
    TenantListComponent,
    TenantFactsheetComponent,
    CreateTenantFormComponent,
    LifecycleDialogsComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    :host {
      display: block;
      min-block-size: 100vh;
      background: var(--tp-surface);
    }

    .parking-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: var(--tp-space-3) var(--tp-space-5);
      background: var(--tp-surface-raised);
      border-block-end: 1px solid var(--tp-border);
    }

    .parking-title {
      font-family: var(--tp-font-family);
      font-size: var(--tp-font-sm);
      font-weight: 600;
      color: var(--tp-text-muted);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .parking-badge {
      display: inline-flex;
      align-items: center;
      gap: var(--tp-space-1);
      padding: var(--tp-space-1) var(--tp-space-3);
      border-radius: var(--nm-radius-pill);
      background: color-mix(in srgb, var(--tp-primary) 10%, transparent);
      color: var(--tp-primary);
      font-size: var(--tp-font-sm);
      font-weight: 600;
    }

    .parking-content {
      padding: var(--tp-space-4);
    }
  `,
  template: `
    <header class="parking-header">
      <span class="parking-title">R02 Tenant Management — Parking Preview</span>
      <span class="parking-badge">
        <i class="pi pi-eye"></i>
        Dev Only
      </span>
    </header>

    <div class="parking-content">
      @if (activeScreen() === 'list') {
        <app-tenant-list
          (tenantSelected)="onTenantSelected($event)"
          (createTenant)="onCreateTenant()"
        />
      }

      @if (activeScreen() === 'factsheet') {
        <app-tenant-factsheet
          [tenant]="selectedTenant()"
          (back)="onBackToList()"
          (lifecycleAction)="onLifecycleAction($event)"
        />
      }
    </div>

    <app-create-tenant-form
      [visible]="createDialogVisible()"
      (visibleChange)="createDialogVisible.set($event)"
      (tenantCreated)="onTenantCreated($event)"
    />

    @if (lifecycleAction()) {
      <app-lifecycle-dialogs
        [action]="lifecycleAction()!"
        [(visible)]="lifecycleDialogVisible"
        [tenantName]="selectedTenant().name"
        [sessionCount]="12"
        (confirmed)="onLifecycleConfirmed($event)"
        (cancelled)="onLifecycleCancelled()"
      />
    }
  `,
})
export class ParkingPreviewComponent {
  // ─── Navigation State ──────────────────────────────────────────────────────

  readonly activeScreen = signal<Screen>('list');
  readonly selectedShortName = signal<string>('');

  // ─── Dialog State ──────────────────────────────────────────────────────────

  readonly createDialogVisible = signal(false);
  readonly lifecycleDialogVisible = signal(false);
  readonly lifecycleAction = signal<LifecycleAction | null>(null);

  // ─── Computed ──────────────────────────────────────────────────────────────

  /** Resolve the selected tenant for the fact sheet. Falls back to SAMPLE_TENANT. */
  readonly selectedTenant = computed<TenantFactsheet>(() => {
    const shortName = this.selectedShortName();
    const summary = SAMPLE_TENANTS.find((t) => t.shortName === shortName);

    if (!summary) return SAMPLE_TENANT;

    // Map TenantSummary → TenantFactsheet shape for preview
    return {
      id: summary.id,
      name: summary.name,
      shortName: summary.shortName,
      type: summary.type,
      status: summary.status,
      health: summary.health ?? 'HEALTHY',
      logoUrl: summary.logoUrl,
      kpis: [
        { label: 'Users', value: String(summary.stats.users), icon: 'pi pi-users' },
        { label: 'Agents', value: String(summary.stats.agents), icon: 'pi pi-android' },
        { label: 'Object Types', value: String(summary.stats.types), icon: 'pi pi-book' },
        { label: 'License', value: '—', icon: 'pi pi-chart-pie' },
      ],
    };
  });

  // ─── Navigation ────────────────────────────────────────────────────────────

  onTenantSelected(shortName: string): void {
    this.selectedShortName.set(shortName);
    this.activeScreen.set('factsheet');
  }

  onBackToList(): void {
    this.activeScreen.set('list');
    this.selectedShortName.set('');
  }

  // ─── Create Tenant ─────────────────────────────────────────────────────────

  onCreateTenant(): void {
    this.createDialogVisible.set(true);
  }

  onTenantCreated(tenantId: string): void {
    console.log('[ParkingPreview] Tenant created:', tenantId);
    this.createDialogVisible.set(false);
  }

  // ─── Lifecycle Dialogs ─────────────────────────────────────────────────────

  onLifecycleAction(action: string): void {
    // Map factsheet lifecycle actions to dialog actions
    const actionMap: Record<string, LifecycleAction> = {
      suspend: 'suspend',
      reactivate: 'reactivate',
    };
    const mapped = actionMap[action] ?? 'suspend';
    this.lifecycleAction.set(mapped);
    this.lifecycleDialogVisible.set(true);
  }

  onLifecycleConfirmed(action: LifecycleAction): void {
    console.log('[ParkingPreview] Lifecycle confirmed:', action);
    this.lifecycleAction.set(null);
    this.lifecycleDialogVisible.set(false);
  }

  onLifecycleCancelled(): void {
    this.lifecycleAction.set(null);
    this.lifecycleDialogVisible.set(false);
  }
}

export default ParkingPreviewComponent;
