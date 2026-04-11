import { CommonModule } from '@angular/common';
import {
  Component,
  computed,
  DestroyRef,
  HostListener,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgIcon } from '@ng-icons/core';
import { ButtonModule } from 'primeng/button';
import { DatePickerModule } from 'primeng/datepicker';
import { DialogModule } from 'primeng/dialog';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { PaginatorModule } from 'primeng/paginator';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { SelectModule } from 'primeng/select';
import { SkeletonModule } from 'primeng/skeleton';
import { StepperModule } from 'primeng/stepper';
import { TableModule } from 'primeng/table';
import { TabsModule } from 'primeng/tabs';
import { TagModule } from 'primeng/tag';
import { TextareaModule } from 'primeng/textarea';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { ApiGatewayService } from '../../../../core/api/api-gateway.service';
import {
  CreateTenantRequest,
  DecommissionTenantRequest,
  SuspendTenantRequest,
  SuspensionReason,
  Tenant,
  TenantBranding,
  TenantStatsResponse,
  TenantTier,
} from '../../../../core/api/models';
import {
  COMPACT_DIALOG_STYLE,
  DRAWER_DIALOG_BREAKPOINTS,
  DRAWER_DIALOG_STYLE,
  FORM_DIALOG_STYLE,
  MEDIUM_DIALOG_STYLE,
  MOBILE_DIALOG_BREAKPOINTS,
  WIZARD_DIALOG_STYLE,
  drawerDialogPt as sharedDrawerDialogPt,
  standardDialogPt as sharedStandardDialogPt,
  wizardDialogPt as sharedWizardDialogPt,
} from '../../../../core/theme/overlay-presets';
import { APP_BRAND_FONT_LABEL } from '../../../../core/theme/typography.constants';
import { ProviderEmbeddedComponent } from '../../../admin/identity-providers/provider-embedded.component';
import { TenantSummary, toTenantSummary } from '../../models/administration.models';
import { BrandingStudioComponent } from './branding-studio/branding-studio.component';

interface WizardStep1 {
  fullName: string;
  shortCode: string;
  description: string;
}

interface WizardStep2 {
  tier: TenantTier;
  userSeats: number | null;
  storageQuotaGb: number | null;
  apiRateLimit: number | null;
  startDate: Date | null;
  expiryDate: Date | null;
}

interface EditFormState {
  fullName: string;
  shortName: string;
  description: string;
  tier: TenantTier;
}

interface SelectOption<T> {
  label: string;
  value: T;
}

type WizardStep = 1 | 2 | 3;
type SortColumn = 'name' | 'status' | 'tier' | 'createdAt';
type SortDirection = 'asc' | 'desc';
type ViewMode = 'table' | 'card';
type TenantStatusFilter = 'all' | 'active' | 'pending' | 'suspended' | 'decommissioned';
type FactSheetTab = 'overview' | 'license' | 'auth' | 'users' | 'branding';

const SUSPENSION_REASONS: readonly SuspensionReason[] = [
  'License Expired',
  'Non-Compliance',
  'Security Concern',
  'Payment Overdue',
  'Administrative Hold',
  'Other',
] as const;

const STATUS_FILTER_OPTIONS: readonly SelectOption<TenantStatusFilter>[] = [
  { label: 'All Statuses', value: 'all' },
  { label: 'Active', value: 'active' },
  { label: 'Pending', value: 'pending' },
  { label: 'Suspended', value: 'suspended' },
  { label: 'Decommissioned', value: 'decommissioned' },
] as const;

const TENANT_TIER_SELECT_OPTIONS: readonly SelectOption<TenantTier>[] = [
  { label: 'Free', value: 'FREE' },
  { label: 'Standard', value: 'STANDARD' },
  { label: 'Professional', value: 'PROFESSIONAL' },
  { label: 'Enterprise', value: 'ENTERPRISE' },
] as const;

const SUSPENSION_REASON_OPTIONS: readonly SelectOption<SuspensionReason>[] = SUSPENSION_REASONS.map(
  (reason) => ({
    label: reason,
    value: reason,
  }),
);

@Component({
  selector: 'app-tenant-manager-section',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NgIcon,
    ButtonModule,
    DatePickerModule,
    DialogModule,
    InputNumberModule,
    InputTextModule,
    MessageModule,
    PaginatorModule,
    ProgressSpinnerModule,
    SelectModule,
    SkeletonModule,
    StepperModule,
    TableModule,
    TabsModule,
    TagModule,
    TextareaModule,
    ToggleSwitchModule,
    ProviderEmbeddedComponent,
    BrandingStudioComponent,
  ],
  templateUrl: './tenant-manager-section.component.html',
  styleUrl: './tenant-manager-section.component.scss',
})
export class TenantManagerSectionComponent implements OnInit {
  private readonly api = inject(ApiGatewayService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly brandFontLabel = APP_BRAND_FONT_LABEL;

  private searchDebounceHandle: ReturnType<typeof setTimeout> | null = null;

  protected readonly tenantTablePt = {
    root: {
      style: {
        border: '1px solid var(--tp-border)',
        'border-radius': 'var(--nm-radius-lg)',
        overflow: 'hidden',
        background: 'var(--tp-surface-raised)',
      },
    },
    table: {
      style: {
        'min-width': '100%',
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
        'border-block-end': '1px solid var(--tp-border)',
        background: 'var(--tp-surface-muted)',
        'white-space': 'nowrap',
      },
    },
    bodyCell: {
      style: {
        padding: 'var(--tp-space-3)',
        color: 'var(--tp-text)',
        'vertical-align': 'middle',
        'border-block-end': '1px solid color-mix(in srgb, var(--tp-border) 35%, transparent)',
      },
    },
    bodyRow: {
      style: {
        transition: 'background 0.15s ease',
      },
    },
  } as const;

  protected readonly tenantPaginatorPt = {
    root: {
      style: {
        background: 'var(--tp-surface-raised)',
        border: '1px solid var(--tp-border)',
        'border-radius': 'var(--nm-radius-md)',
        padding: 'var(--tp-space-3) var(--tp-space-4)',
        display: 'flex',
        'align-items': 'center',
        'justify-content': 'space-between',
        'flex-wrap': 'wrap',
        gap: 'var(--tp-space-3)',
        'margin-block-start': 'var(--tp-space-3)',
      },
    },
    page: {
      style: {
        'min-inline-size': 'var(--tp-touch-target-min-size)',
        'min-block-size': 'var(--tp-touch-target-min-size)',
        'border-radius': 'var(--nm-radius-sm)',
        display: 'inline-flex',
        'align-items': 'center',
        'justify-content': 'center',
        'font-weight': '600',
      },
    },
    first: {
      style: {
        'min-inline-size': 'var(--tp-touch-target-min-size)',
        'min-block-size': 'var(--tp-touch-target-min-size)',
      },
    },
    prev: {
      style: {
        'min-inline-size': 'var(--tp-touch-target-min-size)',
        'min-block-size': 'var(--tp-touch-target-min-size)',
      },
    },
    next: {
      style: {
        'min-inline-size': 'var(--tp-touch-target-min-size)',
        'min-block-size': 'var(--tp-touch-target-min-size)',
      },
    },
    last: {
      style: {
        'min-inline-size': 'var(--tp-touch-target-min-size)',
        'min-block-size': 'var(--tp-touch-target-min-size)',
      },
    },
    current: {
      style: {
        color: 'var(--tp-text-muted)',
        'font-size': 'var(--tp-font-sm)',
      },
    },
  } as const;

  protected readonly standardDialogPt = sharedStandardDialogPt;
  protected readonly factSheetDialogPt = sharedDrawerDialogPt;
  protected readonly tenantWizardDialogPt = sharedWizardDialogPt;
  protected readonly factSheetDialogStyle = DRAWER_DIALOG_STYLE;
  protected readonly factSheetDialogBreakpoints = DRAWER_DIALOG_BREAKPOINTS;
  protected readonly wizardDialogStyle = WIZARD_DIALOG_STYLE;
  protected readonly compactDialogStyle = COMPACT_DIALOG_STYLE;
  protected readonly mediumDialogStyle = MEDIUM_DIALOG_STYLE;
  protected readonly formDialogStyle = FORM_DIALOG_STYLE;
  protected readonly mobileDialogBreakpoints = MOBILE_DIALOG_BREAKPOINTS;

  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly actionError = signal<string | null>(null);
  protected readonly actionInfo = signal<string | null>(null);
  protected readonly actionLoading = signal(false);

  protected readonly tenants = signal<readonly TenantSummary[]>([]);
  protected readonly stats = signal<TenantStatsResponse | null>(null);

  protected readonly searchInput = signal('');
  protected readonly search = signal('');
  protected readonly statusFilter = signal<TenantStatusFilter>('all');
  protected readonly isMobileViewport = signal(isMobileTenantManagerViewport());
  protected readonly viewMode = signal<ViewMode>('table');
  protected readonly effectiveViewMode = computed<ViewMode>(() =>
    this.isMobileViewport() ? 'card' : this.viewMode(),
  );
  protected readonly sortColumn = signal<SortColumn>('name');
  protected readonly sortDirection = signal<SortDirection>('asc');
  protected readonly page = signal(1);
  protected readonly pageSize = signal(10);
  protected readonly pageSizeOptions = [10, 20, 50] as const;
  protected readonly paginatorRowsPerPageOptions = computed<number[]>(() =>
    this.isMobileViewport() ? [] : [...this.pageSizeOptions],
  );
  protected readonly statusFilterOptions = [...STATUS_FILTER_OPTIONS];

  protected readonly selectedTenant = signal<TenantSummary | null>(null);
  protected readonly showFactSheet = signal(false);
  protected readonly factSheetTab = signal<FactSheetTab>('overview');

  protected readonly factSheetBranding = signal<TenantBranding | null>(null);
  protected readonly factSheetBrandingLoading = signal(false);
  protected readonly factSheetUsers = signal<
    readonly { name: string; email: string; status: string }[]
  >([]);
  protected readonly factSheetUsersLoading = signal(false);

  protected readonly showWizard = signal(false);
  protected readonly showWizardDiscardPrompt = signal(false);
  protected readonly wizardIndex = signal<WizardStep>(1);
  protected readonly wizardStep1 = signal<WizardStep1>({
    fullName: '',
    shortCode: '',
    description: '',
  });
  protected readonly wizardStep2 = signal<WizardStep2>({
    tier: 'STANDARD',
    userSeats: 10,
    storageQuotaGb: 50,
    apiRateLimit: 1000,
    startDate: new Date(),
    expiryDate: null,
  });
  protected readonly shortCodeAvailable = signal<boolean | null>(null);
  protected readonly shortCodeChecking = signal(false);
  protected readonly tierSelectOptions = [...TENANT_TIER_SELECT_OPTIONS];

  protected readonly showActivateDialog = signal(false);
  protected readonly showSuspendDialog = signal(false);
  protected readonly showReactivateDialog = signal(false);
  protected readonly showDecommissionDialog = signal(false);
  protected readonly activateSendWelcome = signal(true);
  protected readonly suspendReason = signal<SuspensionReason>('License Expired');
  protected readonly suspendNotes = signal('');
  protected readonly suspendReactivationDate = signal<Date | null>(null);
  protected readonly decommissionReason = signal('');
  protected readonly decommissionNotes = signal('');
  protected readonly decommissionConfirm = signal(false);
  protected readonly suspensionReasonOptions = [...SUSPENSION_REASON_OPTIONS];

  protected readonly showEditModal = signal(false);
  protected readonly deleteDialogTarget = signal<TenantSummary | null>(null);
  protected readonly editForm = signal<EditFormState>({
    fullName: '',
    shortName: '',
    description: '',
    tier: 'STANDARD',
  });

  protected readonly searchNeedsMoreChars = computed(() => {
    const term = this.searchInput().trim();
    return term.length > 0 && term.length < 3;
  });

  protected readonly filteredTenants = computed(() => {
    let list = [...this.tenants()];
    const statusFilter = this.statusFilter();

    if (statusFilter !== 'all') {
      list = list.filter((tenant) => tenant.status.toLowerCase() === statusFilter);
    }

    const needle = this.search().trim().toLowerCase();
    if (needle.length >= 3) {
      list = list.filter(
        (tenant) =>
          tenant.name.toLowerCase().includes(needle) ||
          (tenant.fullName ?? '').toLowerCase().includes(needle) ||
          (tenant.shortName ?? '').toLowerCase().includes(needle) ||
          (tenant.uuid ?? '').toLowerCase().includes(needle),
      );
    }

    const sortColumn = this.sortColumn();
    const sortDirection = this.sortDirection();

    list.sort((left, right) => {
      let compareValue = 0;

      if (sortColumn === 'name') {
        compareValue = (left.name ?? '').localeCompare(right.name ?? '');
      } else if (sortColumn === 'status') {
        compareValue = (left.status ?? '').localeCompare(right.status ?? '');
      } else if (sortColumn === 'tier') {
        compareValue = (left.tier ?? '').localeCompare(right.tier ?? '');
      } else if (sortColumn === 'createdAt') {
        compareValue = (left.createdAt ?? '').localeCompare(right.createdAt ?? '');
      }

      return sortDirection === 'asc' ? compareValue : -compareValue;
    });

    return list;
  });

  protected readonly totalFiltered = computed(() => this.filteredTenants().length);

  protected readonly pagedTenants = computed(() => {
    const startIndex = (this.page() - 1) * this.pageSize();
    return this.filteredTenants().slice(startIndex, startIndex + this.pageSize());
  });

  constructor() {
    this.destroyRef.onDestroy(() => {
      if (this.searchDebounceHandle !== null) {
        window.clearTimeout(this.searchDebounceHandle);
      }
    });
  }

  ngOnInit(): void {
    this.isMobileViewport.set(isMobileTenantManagerViewport());
    this.loadTenants();
    this.loadStats();
  }

  @HostListener('window:resize')
  protected onWindowResize(): void {
    this.isMobileViewport.set(isMobileTenantManagerViewport());
  }

  protected loadTenants(): void {
    this.loading.set(true);
    this.error.set(null);

    this.api.listTenants(1, 500).subscribe({
      next: (response) => {
        this.tenants.set(response.tenants.map((tenant: Tenant) => toTenantSummary(tenant)));
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Unable to load tenants from backend.');
        this.tenants.set([]);
        this.loading.set(false);
      },
    });
  }

  protected loadStats(): void {
    this.api.getTenantStats().subscribe({
      next: (stats) => this.stats.set(stats),
      error: () => this.stats.set(null),
    });
  }

  protected toggleSort(column: SortColumn): void {
    if (this.sortColumn() === column) {
      this.sortDirection.set(this.sortDirection() === 'asc' ? 'desc' : 'asc');
      return;
    }

    this.sortColumn.set(column);
    this.sortDirection.set('asc');
  }

  protected sortIcon(column: SortColumn): string {
    if (this.sortColumn() !== column) {
      return 'phosphorArrowsDownUpThin';
    }

    return this.sortDirection() === 'asc'
      ? 'phosphorSortAscendingThin'
      : 'phosphorSortDescendingThin';
  }

  protected onSearchChange(value: string): void {
    this.searchInput.set(value);

    if (this.searchDebounceHandle !== null) {
      window.clearTimeout(this.searchDebounceHandle);
    }

    this.searchDebounceHandle = window.setTimeout(() => {
      this.search.set(value);
      this.page.set(1);
    }, 300);
  }

  protected resetFilters(): void {
    if (this.searchDebounceHandle !== null) {
      window.clearTimeout(this.searchDebounceHandle);
      this.searchDebounceHandle = null;
    }

    this.searchInput.set('');
    this.search.set('');
    this.statusFilter.set('all');
    this.page.set(1);
  }

  protected onPageChange(event: {
    first: number;
    rows: number;
    page: number;
    pageCount: number;
  }): void {
    this.pageSize.set(event.rows);
    this.page.set(event.page + 1);
  }

  protected onTableSort(event: { field?: string; order?: 1 | -1 | 0 | null }): void {
    if (
      event.field === 'name' ||
      event.field === 'status' ||
      event.field === 'tier' ||
      event.field === 'createdAt'
    ) {
      this.sortColumn.set(event.field);
    }

    this.sortDirection.set(event.order === -1 ? 'desc' : 'asc');
    this.page.set(1);
  }

  protected setViewMode(mode: ViewMode): void {
    if (this.isMobileViewport()) {
      return;
    }

    this.viewMode.set(mode);
  }

  protected setStatusFilter(status: TenantStatusFilter | null): void {
    this.statusFilter.set(status ?? 'all');
    this.page.set(1);
  }

  protected onFactSheetVisibleChange(visible: boolean): void {
    this.showFactSheet.set(visible);
  }

  protected onFactSheetTabChange(value: unknown): void {
    if (
      value === 'overview' ||
      value === 'license' ||
      value === 'auth' ||
      value === 'users' ||
      value === 'branding'
    ) {
      this.factSheetTab.set(value);
    }
  }

  protected openFactSheet(tenant: TenantSummary): void {
    this.selectedTenant.set(tenant);
    this.factSheetTab.set('overview');
    this.factSheetBranding.set(null);
    this.factSheetUsers.set([]);
    this.showFactSheet.set(true);
    this.loadFactSheetData(tenant);
  }

  protected closeFactSheet(): void {
    this.showFactSheet.set(false);
  }

  private loadFactSheetData(tenant: TenantSummary): void {
    const tenantId = tenant.uuid ?? tenant.id;

    this.factSheetBrandingLoading.set(true);
    this.api.getTenantBranding(tenantId).subscribe({
      next: (branding) => {
        this.factSheetBranding.set(branding);
        this.factSheetBrandingLoading.set(false);
      },
      error: () => {
        this.factSheetBranding.set(null);
        this.factSheetBrandingLoading.set(false);
      },
    });
  }

  protected handleBrandingSaved(branding: TenantBranding): void {
    this.factSheetBranding.set(branding);
    this.actionInfo.set('Branding changes published for this tenant.');
  }

  protected openWizard(): void {
    this.clearActionMessage();
    this.wizardIndex.set(1);
    this.showWizardDiscardPrompt.set(false);
    this.wizardStep1.set({ fullName: '', shortCode: '', description: '' });
    this.wizardStep2.set({
      tier: 'STANDARD',
      userSeats: 10,
      storageQuotaGb: 50,
      apiRateLimit: 1000,
      startDate: new Date(),
      expiryDate: null,
    });
    this.shortCodeAvailable.set(null);
    this.showWizard.set(true);
  }

  protected onWizardVisibleChange(visible: boolean): void {
    if (visible) {
      this.showWizard.set(true);
      return;
    }

    this.requestWizardClose();
  }

  protected wizardNext(): void {
    if (this.wizardIndex() < 3) {
      this.wizardIndex.set((this.wizardIndex() + 1) as WizardStep);
    }
  }

  protected wizardPrev(): void {
    if (this.wizardIndex() > 1) {
      this.wizardIndex.set((this.wizardIndex() - 1) as WizardStep);
    }
  }

  protected requestWizardClose(): void {
    if (this.hasWizardData()) {
      this.showWizardDiscardPrompt.set(true);
      return;
    }

    this.closeWizard();
  }

  protected dismissWizardDiscardPrompt(): void {
    this.showWizardDiscardPrompt.set(false);
  }

  protected confirmWizardClose(): void {
    this.closeWizard();
  }

  protected closeWizard(): void {
    this.showWizardDiscardPrompt.set(false);
    this.showWizard.set(false);
  }

  protected onWizardStepChange(value: number | undefined): void {
    if (value === 1 || value === 2 || value === 3) {
      this.wizardIndex.set(value);
    }
  }

  protected onTenantNameChange(name: string): void {
    this.wizardStep1.update((state) => ({ ...state, fullName: name }));

    const shortCode = name
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '')
      .substring(0, 6);

    this.wizardStep1.update((state) => ({ ...state, shortCode }));

    if (shortCode.length >= 2) {
      this.shortCodeChecking.set(true);
      this.api.validateShortCode(shortCode).subscribe({
        next: (response) => {
          this.shortCodeAvailable.set(response.available);
          this.shortCodeChecking.set(false);
        },
        error: () => {
          this.shortCodeAvailable.set(null);
          this.shortCodeChecking.set(false);
        },
      });
      return;
    }

    this.shortCodeAvailable.set(null);
  }

  protected updateDescription(value: string): void {
    this.wizardStep1.update((state) => ({ ...state, description: value }));
  }

  protected updateTier(value: TenantTier): void {
    this.wizardStep2.update((state) => ({ ...state, tier: value }));
  }

  protected updateUserSeats(value: number | null): void {
    this.wizardStep2.update((state) => ({ ...state, userSeats: value }));
  }

  protected updateStorageQuota(value: number | null): void {
    this.wizardStep2.update((state) => ({ ...state, storageQuotaGb: value }));
  }

  protected updateApiRateLimit(value: number | null): void {
    this.wizardStep2.update((state) => ({ ...state, apiRateLimit: value }));
  }

  protected updateStartDate(value: Date | null): void {
    this.wizardStep2.update((state) => ({ ...state, startDate: value }));
  }

  protected updateExpiryDate(value: Date | null): void {
    this.wizardStep2.update((state) => ({ ...state, expiryDate: value }));
  }

  protected canAdvanceStep1(): boolean {
    const step = this.wizardStep1();
    return (
      step.fullName.trim().length >= 2 &&
      step.shortCode.length >= 2 &&
      this.shortCodeAvailable() === true
    );
  }

  protected canAdvanceStep2(): boolean {
    const step = this.wizardStep2();
    return (
      (step.userSeats ?? 0) > 0 && (step.storageQuotaGb ?? 0) > 0 && step.startDate instanceof Date
    );
  }

  protected provisionTenant(): void {
    const basicInfo = this.wizardStep1();
    const licenseInfo = this.wizardStep2();

    const request: CreateTenantRequest = {
      fullName: basicInfo.fullName.trim(),
      shortName: basicInfo.shortCode.trim(),
      description: basicInfo.description.trim() || undefined,
      tenantType: 'REGULAR',
      tier: licenseInfo.tier,
      adminEmail: 'admin@placeholder.com',
      licenses: {
        powerUsers: Math.max(1, licenseInfo.userSeats ?? 0),
        contributors: 0,
        viewers: 0,
      },
    };

    this.actionLoading.set(true);
    this.clearActionMessage();

    this.api.createTenant(request).subscribe({
      next: (tenant) => {
        const summary = toTenantSummary(tenant);
        this.tenants.update((current) => [summary, ...current]);
        this.showWizard.set(false);
        this.actionInfo.set(`Tenant "${summary.name}" provisioned successfully.`);
        this.actionLoading.set(false);
        this.loadStats();
      },
      error: (error: unknown) => {
        this.actionError.set(this.formatActionError(error, 'Failed to provision tenant.'));
        this.actionLoading.set(false);
      },
    });
  }

  protected openActivateDialog(tenant: TenantSummary): void {
    this.selectedTenant.set(tenant);
    this.activateSendWelcome.set(true);
    this.showActivateDialog.set(true);
  }

  protected confirmActivate(): void {
    const tenantId = this.selectedTenant()?.uuid?.trim();
    if (!tenantId) return;

    this.actionLoading.set(true);

    this.api
      .activateTenant(tenantId, { sendWelcomeNotification: this.activateSendWelcome() })
      .subscribe({
        next: (payload) => {
          this.handleTenantUpdate(payload, 'activated');
          this.showActivateDialog.set(false);
        },
        error: (error: unknown) => {
          this.actionError.set(this.formatActionError(error, 'Failed to activate.'));
          this.actionLoading.set(false);
        },
      });
  }

  protected openSuspendDialog(tenant: TenantSummary): void {
    this.selectedTenant.set(tenant);
    this.suspendReason.set('License Expired');
    this.suspendNotes.set('');
    this.suspendReactivationDate.set(null);
    this.showSuspendDialog.set(true);
  }

  protected confirmSuspend(): void {
    const tenantId = this.selectedTenant()?.uuid?.trim();
    if (!tenantId) return;

    const request: SuspendTenantRequest = {
      reason: this.suspendReason(),
      notes: this.suspendNotes().trim() || undefined,
      estimatedReactivationDate: this.toDateOnlyString(this.suspendReactivationDate()),
    };

    this.actionLoading.set(true);

    this.api.suspendTenant(tenantId, request).subscribe({
      next: (payload) => {
        this.handleTenantUpdate(payload, 'suspended');
        this.showSuspendDialog.set(false);
      },
      error: (error: unknown) => {
        this.actionError.set(this.formatActionError(error, 'Failed to suspend.'));
        this.actionLoading.set(false);
      },
    });
  }

  protected openReactivateDialog(tenant: TenantSummary): void {
    this.selectedTenant.set(tenant);
    this.showReactivateDialog.set(true);
  }

  protected confirmReactivate(): void {
    const tenantId = this.selectedTenant()?.uuid?.trim();
    if (!tenantId) return;

    this.actionLoading.set(true);

    this.api.reactivateTenant(tenantId).subscribe({
      next: (payload) => {
        this.handleTenantUpdate(payload, 'reactivated');
        this.showReactivateDialog.set(false);
      },
      error: (error: unknown) => {
        this.actionError.set(this.formatActionError(error, 'Failed to reactivate.'));
        this.actionLoading.set(false);
      },
    });
  }

  protected openDecommissionDialog(tenant: TenantSummary): void {
    this.selectedTenant.set(tenant);
    this.decommissionReason.set('');
    this.decommissionNotes.set('');
    this.decommissionConfirm.set(false);
    this.showDecommissionDialog.set(true);
  }

  protected confirmDecommission(): void {
    const tenantId = this.selectedTenant()?.uuid?.trim();
    if (!tenantId) return;

    const request: DecommissionTenantRequest = {
      reason: this.decommissionReason().trim(),
      notes: this.decommissionNotes().trim() || undefined,
      confirmDataDeletion: this.decommissionConfirm(),
    };

    this.actionLoading.set(true);

    this.api.decommissionTenant(tenantId, request).subscribe({
      next: (payload) => {
        this.handleTenantUpdate(payload, 'decommissioned');
        this.showDecommissionDialog.set(false);
      },
      error: (error: unknown) => {
        this.actionError.set(this.formatActionError(error, 'Failed to decommission.'));
        this.actionLoading.set(false);
      },
    });
  }

  protected openEditModal(tenant: TenantSummary): void {
    this.selectedTenant.set(tenant);
    this.editForm.set({
      fullName: tenant.fullName ?? tenant.name,
      shortName: tenant.shortName ?? tenant.name,
      description: tenant.description ?? '',
      tier: (tenant.tier as TenantTier) ?? 'STANDARD',
    });
    this.showEditModal.set(true);
  }

  protected closeEditModal(): void {
    this.showEditModal.set(false);
  }

  protected updateEditField<K extends keyof EditFormState>(key: K, value: EditFormState[K]): void {
    this.editForm.update((form) => ({ ...form, [key]: value }));
  }

  protected saveEdit(): void {
    const tenantId = this.selectedTenant()?.uuid?.trim();
    if (!tenantId) return;

    const form = this.editForm();

    this.actionLoading.set(true);
    this.clearActionMessage();

    this.api
      .updateTenant(tenantId, {
        fullName: form.fullName.trim(),
        shortName: form.shortName.trim(),
        description: form.description.trim() || undefined,
        tier: form.tier,
      })
      .subscribe({
        next: (payload) => {
          this.handleTenantUpdate(payload, 'updated');
          this.showEditModal.set(false);
        },
        error: (error: unknown) => {
          this.actionError.set(this.formatActionError(error, 'Failed to update.'));
          this.actionLoading.set(false);
        },
      });
  }

  protected openDeleteDialog(tenant: TenantSummary): void {
    if (tenant.isProtected) {
      this.actionError.set('Protected tenants cannot be deleted.');
      return;
    }

    this.deleteDialogTarget.set(tenant);
  }

  protected closeDeleteDialog(): void {
    this.deleteDialogTarget.set(null);
  }

  protected confirmDeleteTenant(): void {
    const tenant = this.deleteDialogTarget();
    if (!tenant) {
      return;
    }

    this.deleteTenant(tenant);
  }

  protected deleteTenant(tenant: TenantSummary): void {
    if (tenant.isProtected) {
      this.actionError.set('Protected tenants cannot be deleted.');
      return;
    }

    const tenantId = tenant.uuid?.trim();
    if (!tenantId) return;

    this.actionLoading.set(true);
    this.clearActionMessage();

    this.api.deleteTenant(tenantId).subscribe({
      next: () => {
        this.tenants.update((current) => current.filter((item) => item.id !== tenant.id));
        this.actionInfo.set(`Tenant "${tenant.name}" deleted.`);
        this.actionLoading.set(false);
        this.deleteDialogTarget.set(null);
        this.loadStats();
      },
      error: (error: unknown) => {
        this.actionError.set(this.formatActionError(error, 'Unable to delete.'));
        this.actionLoading.set(false);
      },
    });
  }

  protected statusSeverity(status: string): 'success' | 'warn' | 'danger' | 'secondary' | 'info' {
    const normalized = status.toLowerCase();

    if (normalized === 'active') return 'success';
    if (normalized === 'pending') return 'warn';
    if (normalized === 'suspended' || normalized === 'locked') return 'danger';
    if (normalized === 'decommissioned') return 'secondary';

    return 'info';
  }

  protected clearActionMessage(): void {
    this.actionInfo.set(null);
    this.actionError.set(null);
  }

  protected canActivate(tenant: TenantSummary): boolean {
    return tenant.status.toLowerCase() === 'pending';
  }

  protected canSuspend(tenant: TenantSummary): boolean {
    return tenant.status.toLowerCase() === 'active' && !tenant.isProtected;
  }

  protected canReactivate(tenant: TenantSummary): boolean {
    return tenant.status.toLowerCase() === 'suspended';
  }

  protected canDecommission(tenant: TenantSummary): boolean {
    return tenant.status.toLowerCase() === 'suspended' && !tenant.isProtected;
  }

  protected canEdit(tenant: TenantSummary): boolean {
    return tenant.status.toLowerCase() !== 'decommissioned';
  }

  protected canDelete(tenant: TenantSummary): boolean {
    return !tenant.isProtected && tenant.status.toLowerCase() !== 'decommissioned';
  }

  private handleTenantUpdate(payload: Tenant, action: string): void {
    const updatedTenant = toTenantSummary(payload);

    this.tenants.update((current) =>
      current.map((tenant) => (tenant.id === updatedTenant.id ? updatedTenant : tenant)),
    );

    if (this.selectedTenant()?.id === updatedTenant.id) {
      this.selectedTenant.set(updatedTenant);
    }

    this.actionInfo.set(`Tenant "${updatedTenant.name}" ${action}.`);
    this.actionLoading.set(false);
    this.loadStats();
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

  private hasWizardData(): boolean {
    return (
      this.wizardStep1().fullName.trim().length > 0 ||
      this.wizardStep1().description.trim().length > 0
    );
  }

  private toDateOnlyString(value: Date | null): string | undefined {
    if (!(value instanceof Date) || Number.isNaN(value.getTime())) {
      return undefined;
    }

    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, '0');
    const day = String(value.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }
}

function isMobileTenantManagerViewport(): boolean {
  return typeof window !== 'undefined' ? window.innerWidth < 768 : false;
}
