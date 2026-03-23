import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { SelectButtonModule } from 'primeng/selectbutton';
import { TagModule } from 'primeng/tag';
import { TabsModule } from 'primeng/tabs';
import { ApiGatewayService } from '../../../../core/api/api-gateway.service';
import {
  CreateTenantRequest,
  Tenant,
  TenantBranding,
  TenantTier,
  TenantType,
  UpdateTenantRequest,
} from '../../../../core/api/models';
import { LicenseEmbeddedComponent } from '../../../admin/licenses/license-embedded.component';
import { UserEmbeddedComponent } from '../../../admin/users/user-embedded.component';
import {
  TenantManagerTab,
  TenantSummary,
  toTenantSummary,
} from '../../models/administration.models';
import { BrandingStudioComponent } from './branding-studio/branding-studio.component';
import { MasterAuthSectionComponent } from '../master-auth/master-auth-section.component';

interface CreateTenantForm {
  fullName: string;
  shortName: string;
  description: string;
  tenantType: TenantType;
  tier: TenantTier;
  primaryDomain: string;
  adminEmail: string;
  licenses: {
    powerUsers: number;
    contributors: number;
    viewers: number;
  };
}

interface EditTenantForm {
  fullName: string;
  shortName: string;
  description: string;
  tier: TenantTier;
}

const TENANT_TYPE_OPTIONS: readonly TenantType[] = ['MASTER', 'DOMINANT', 'REGULAR'] as const;
const TENANT_TIER_OPTIONS: readonly TenantTier[] = [
  'FREE',
  'STANDARD',
  'PROFESSIONAL',
  'ENTERPRISE',
] as const;

@Component({
  selector: 'app-tenant-manager-section',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    CardModule,
    InputTextModule,
    MessageModule,
    ProgressSpinnerModule,
    SelectButtonModule,
    TagModule,
    TabsModule,
    LicenseEmbeddedComponent,
    MasterAuthSectionComponent,
    UserEmbeddedComponent,
    BrandingStudioComponent,
  ],
  templateUrl: './tenant-manager-section.component.html',
  styleUrl: './tenant-manager-section.component.scss',
})
export class TenantManagerSectionComponent implements OnInit {
  private readonly api = inject(ApiGatewayService);

  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly actionError = signal<string | null>(null);
  protected readonly actionInfo = signal<string | null>(null);
  protected readonly actionLoading = signal(false);
  protected readonly search = signal('');
  protected readonly tenants = signal<readonly TenantSummary[]>([]);
  protected readonly selectedTenant = signal<TenantSummary | null>(null);
  protected readonly activeTab = signal<TenantManagerTab>('overview');
  protected readonly showCreateModal = signal(false);
  protected readonly showEditModal = signal(false);
  protected readonly createForm = signal<CreateTenantForm>(this.createDefaultCreateForm());
  protected readonly editForm = signal<EditTenantForm>(this.createDefaultEditForm());
  protected readonly typeOptions = TENANT_TYPE_OPTIONS;
  protected readonly tierOptions = TENANT_TIER_OPTIONS;
  protected readonly masterFirstMode = true;

  /** Current branding loaded from the API for the selected tenant */
  protected readonly currentBranding = signal<TenantBranding | null>(null);

  protected readonly masterTenant = computed(
    () => this.tenants().find((tenant) => this.isMasterTenant(tenant)) ?? null,
  );

  protected readonly filteredTenants = computed(() => {
    const base = this.masterFirstMode
      ? this.masterTenant()
        ? [this.masterTenant() as TenantSummary]
        : this.tenants()
      : this.tenants();

    const needle = this.search().trim().toLowerCase();
    if (!needle) {
      return base;
    }

    return base.filter(
      (tenant) =>
        tenant.name.toLowerCase().includes(needle) ||
        (tenant.uuid ?? '').toLowerCase().includes(needle) ||
        tenant.status.toLowerCase().includes(needle),
    );
  });

  ngOnInit(): void {
    this.loadTenants();
  }

  protected loadTenants(): void {
    this.loading.set(true);
    this.error.set(null);

    this.api.listTenants(1, 200).subscribe({
      next: (response) => {
        const mapped = response.tenants.map((tenant: Tenant) => toTenantSummary(tenant));
        this.tenants.set(mapped);
        const master = mapped.find((tenant) => this.isMasterTenant(tenant)) ?? null;

        const selected = this.selectedTenant();
        if (this.masterFirstMode && master && (!selected || selected.id !== master.id)) {
          this.selectedTenant.set(master);
          this.activeTab.set('overview');
        } else if (!selected || !mapped.some((tenant) => tenant.id === selected.id)) {
          this.selectedTenant.set(master ?? mapped[0] ?? null);
          this.activeTab.set('overview');
        }
        this.loadBrandingForSelected();
        if (this.activeTab() === 'licenses' && this.isMasterTenant(this.selectedTenant())) {
          this.activeTab.set('overview');
        }

        this.loading.set(false);
      },
      error: () => {
        this.error.set('Unable to load tenants from backend.');
        this.tenants.set([]);
        this.selectedTenant.set(null);
        this.loading.set(false);
      },
    });
  }

  protected selectTenant(tenant: TenantSummary): void {
    if (this.masterFirstMode && !this.isMasterTenant(tenant)) {
      this.actionInfo.set(
        'Master-tenant-first mode is enabled. Other tenant management is deferred for now.',
      );
      return;
    }
    this.selectedTenant.set(tenant);
    this.loadBrandingForSelected();
    this.clearActionMessage();
    if (this.activeTab() === 'licenses' && this.isMasterTenant(tenant)) {
      this.activeTab.set('overview');
      return;
    }
    this.activeTab.set('overview');
  }

  protected onTabChange(value: unknown): void {
    const nextTab =
      value === 'overview' || value === 'users' || value === 'branding' || value === 'licenses'
        ? value
        : 'overview';

    if (nextTab === 'licenses' && this.isMasterTenant(this.selectedTenant())) {
      this.activeTab.set('overview');
      return;
    }

    this.activeTab.set(nextTab);
  }

  protected clearActionMessage(): void {
    this.actionInfo.set(null);
    this.actionError.set(null);
  }

  protected openCreateTenantModal(): void {
    this.clearActionMessage();
    this.createForm.set(this.createDefaultCreateForm());
    this.showCreateModal.set(true);
  }

  protected closeCreateTenantModal(): void {
    this.showCreateModal.set(false);
  }

  protected updateCreateField<K extends keyof CreateTenantForm>(
    key: K,
    value: CreateTenantForm[K],
  ): void {
    this.createForm.update((current) => ({ ...current, [key]: value }));
  }

  protected updateCreateLicenseField<K extends keyof CreateTenantForm['licenses']>(
    key: K,
    value: number,
  ): void {
    const safeValue = Number.isFinite(value) ? Math.max(0, Math.trunc(value)) : 0;
    this.createForm.update((current) => ({
      ...current,
      licenses: {
        ...current.licenses,
        [key]: safeValue,
      },
    }));
  }

  protected createTenant(): void {
    const form = this.createForm();
    const request: CreateTenantRequest = {
      fullName: form.fullName.trim(),
      shortName: form.shortName.trim(),
      description: form.description.trim() || undefined,
      tenantType: form.tenantType,
      tier: form.tier,
      primaryDomain: form.primaryDomain.trim() || undefined,
      adminEmail: form.adminEmail.trim(),
      licenses: {
        powerUsers: form.licenses.powerUsers,
        contributors: form.licenses.contributors,
        viewers: form.licenses.viewers,
      },
    };
    if (!request.fullName || !request.shortName || !request.adminEmail) {
      this.actionError.set('Full name, short name, and admin email are required.');
      return;
    }

    this.actionLoading.set(true);
    this.clearActionMessage();
    this.api.createTenant(request).subscribe({
      next: (tenant) => {
        const summary = toTenantSummary(tenant);
        this.tenants.update((current) => [summary, ...current]);
        this.selectedTenant.set(summary);
        this.showCreateModal.set(false);
        this.activeTab.set('overview');
        this.actionInfo.set(`Tenant ${summary.name} created.`);
        this.loadBrandingForSelected();
        this.actionLoading.set(false);
      },
      error: (error: unknown) => {
        this.actionError.set(this.formatActionError(error, 'Unable to create tenant.'));
        this.actionLoading.set(false);
      },
    });
  }

  protected openEditTenantModal(): void {
    const tenant = this.selectedTenant();
    if (!tenant) {
      return;
    }
    const tenantPathId = this.requireTenantUuid(tenant);
    if (!tenantPathId) {
      return;
    }
    this.clearActionMessage();
    this.actionLoading.set(true);
    this.api.getTenant(tenantPathId).subscribe({
      next: (payload) => {
        const tier = this.normalizeTier(payload.tier);
        this.editForm.set({
          fullName: payload.fullName ?? tenant.fullName ?? tenant.name,
          shortName: payload.shortName ?? tenant.shortName ?? tenant.name,
          description: payload.description ?? tenant.description ?? '',
          tier,
        });
        this.showEditModal.set(true);
        this.actionLoading.set(false);
      },
      error: (error: unknown) => {
        this.actionError.set(this.formatActionError(error, 'Unable to load tenant details.'));
        this.actionLoading.set(false);
      },
    });
  }

  protected closeEditTenantModal(): void {
    this.showEditModal.set(false);
  }

  protected updateEditField<K extends keyof EditTenantForm>(
    key: K,
    value: EditTenantForm[K],
  ): void {
    this.editForm.update((current) => ({ ...current, [key]: value }));
  }

  protected updateTenant(): void {
    const tenant = this.selectedTenant();
    if (!tenant) {
      return;
    }
    const tenantPathId = this.requireTenantUuid(tenant);
    if (!tenantPathId) {
      return;
    }

    const form = this.editForm();
    const request: UpdateTenantRequest = {
      fullName: form.fullName.trim(),
      shortName: form.shortName.trim(),
      description: form.description.trim() || undefined,
      tier: form.tier,
    };
    if (!request.fullName || !request.shortName) {
      this.actionError.set('Full name and short name are required.');
      return;
    }

    this.actionLoading.set(true);
    this.clearActionMessage();
    this.api.updateTenant(tenantPathId, request).subscribe({
      next: (payload) => {
        const updated = toTenantSummary(payload);
        this.tenants.update((current) =>
          current.map((item) => (item.id === updated.id ? updated : item)),
        );
        this.selectedTenant.set(updated);
        this.showEditModal.set(false);
        this.actionInfo.set(`Tenant ${updated.name} updated.`);
        this.actionLoading.set(false);
      },
      error: (error: unknown) => {
        this.actionError.set(this.formatActionError(error, 'Unable to update tenant.'));
        this.actionLoading.set(false);
      },
    });
  }

  protected toggleTenantLock(tenant: TenantSummary): void {
    const tenantPathId = this.requireTenantUuid(tenant);
    if (!tenantPathId) {
      return;
    }
    this.clearActionMessage();
    this.actionLoading.set(true);
    const isLocked = tenant.status.toLowerCase().includes('locked');
    const request$ = isLocked
      ? this.api.unlockTenant(tenantPathId)
      : this.api.lockTenant(tenantPathId);

    request$.subscribe({
      next: (payload) => {
        const updated = toTenantSummary(payload);
        this.tenants.update((current) =>
          current.map((item) => (item.id === updated.id ? updated : item)),
        );
        if (this.selectedTenant()?.id === updated.id) {
          this.selectedTenant.set(updated);
        }
        this.actionInfo.set(`Tenant ${updated.name} ${isLocked ? 'unlocked' : 'locked'}.`);
        this.actionLoading.set(false);
      },
      error: (error: unknown) => {
        this.actionError.set(this.formatActionError(error, 'Unable to update tenant lock status.'));
        this.actionLoading.set(false);
      },
    });
  }

  protected deleteTenant(tenant: TenantSummary): void {
    if (!this.canDeleteTenant(tenant)) {
      this.actionError.set('Protected or master tenants cannot be deleted.');
      return;
    }
    const tenantPathId = this.requireTenantUuid(tenant);
    if (!tenantPathId) {
      return;
    }
    const confirmed = window.confirm(
      `Delete tenant "${tenant.name}"? This action cannot be undone.`,
    );
    if (!confirmed) {
      return;
    }

    this.clearActionMessage();
    this.actionLoading.set(true);
    this.api.deleteTenant(tenantPathId).subscribe({
      next: () => {
        this.tenants.update((current) => current.filter((item) => item.id !== tenant.id));
        const remaining = this.tenants();
        this.selectedTenant.set(remaining[0] ?? null);
        this.activeTab.set('overview');
        this.loadBrandingForSelected();
        this.actionInfo.set(`Tenant ${tenant.name} deleted.`);
        this.actionLoading.set(false);
      },
      error: (error: unknown) => {
        this.actionError.set(this.formatActionError(error, 'Unable to delete tenant.'));
        this.actionLoading.set(false);
      },
    });
  }

  protected isLockedTenant(tenant: TenantSummary | null): boolean {
    return (tenant?.status ?? '').toLowerCase().includes('locked');
  }

  protected canDeleteTenant(tenant: TenantSummary | null): boolean {
    if (!tenant) {
      return false;
    }
    if (tenant.isProtected) {
      return false;
    }
    return !this.isMasterTenant(tenant);
  }

  protected statusSeverity(status: string): 'success' | 'warn' | 'danger' | 'secondary' {
    const normalized = status.toLowerCase();
    if (normalized.includes('active')) {
      return 'success';
    }
    if (normalized.includes('suspend') || normalized.includes('blocked')) {
      return 'danger';
    }
    if (normalized.includes('pending') || normalized.includes('invited')) {
      return 'warn';
    }
    return 'secondary';
  }

  protected isMasterTenant(tenant: TenantSummary | null): boolean {
    return (tenant?.type ?? '').toLowerCase() === 'master';
  }

  protected tenantScopeId(tenant: TenantSummary | null): string {
    if (!tenant) {
      return '';
    }
    return tenant.uuid ?? '';
  }

  /** Called when BrandingStudio emits a successful save */
  protected onBrandingSaved(branding: TenantBranding): void {
    this.currentBranding.set(branding);
  }

  private loadBrandingForSelected(): void {
    const tenant = this.selectedTenant();
    if (!tenant) {
      this.currentBranding.set(null);
      return;
    }
    const tenantPathId = tenant.uuid?.trim();
    if (tenantPathId) {
      this.api.getTenantBranding(tenantPathId).subscribe({
        next: (branding: TenantBranding) => {
          this.currentBranding.set(branding);
        },
        error: () => {
          this.currentBranding.set(null);
        },
      });
    } else {
      this.currentBranding.set(null);
    }
  }

  private createDefaultCreateForm(): CreateTenantForm {
    return {
      fullName: '',
      shortName: '',
      description: '',
      tenantType: 'REGULAR',
      tier: 'STANDARD',
      primaryDomain: '',
      adminEmail: '',
      licenses: {
        powerUsers: 0,
        contributors: 0,
        viewers: 0,
      },
    };
  }

  private requireTenantUuid(tenant: TenantSummary | null): string | null {
    const tenantUuid = tenant?.uuid?.trim();
    if (!tenantUuid) {
      this.actionError.set('Tenant UUID is missing; operation cannot be completed.');
      return null;
    }
    return tenantUuid;
  }

  private createDefaultEditForm(): EditTenantForm {
    return {
      fullName: '',
      shortName: '',
      description: '',
      tier: 'STANDARD',
    };
  }

  private normalizeTier(value: unknown): TenantTier {
    if (
      value === 'FREE' ||
      value === 'STANDARD' ||
      value === 'PROFESSIONAL' ||
      value === 'ENTERPRISE'
    ) {
      return value;
    }
    return 'STANDARD';
  }

  private formatActionError(error: unknown, fallback: string): string {
    if (typeof error === 'object' && error !== null) {
      const response = error as { status?: number; message?: string; error?: { message?: string } };
      const message = response.error?.message ?? response.message;
      if (typeof message === 'string' && message.trim().length > 0) {
        return message;
      }
      if (typeof response.status === 'number' && response.status > 0) {
        return `${fallback} (${response.status})`;
      }
    }
    return fallback;
  }
}
