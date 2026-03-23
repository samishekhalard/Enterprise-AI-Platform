import { Component, signal, computed, inject, OnInit, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NgApexchartsModule } from 'ng-apexcharts';
import { LineChart } from 'echarts/charts';
import { GridComponent, TooltipComponent } from 'echarts/components';
import * as echarts from 'echarts/core';
import { CanvasRenderer } from 'echarts/renderers';
import type { EChartsOption } from 'echarts';
import { NgxEchartsDirective, provideEchartsCore } from 'ngx-echarts';
import { ButtonModule } from 'primeng/button';
import { TabsModule } from 'primeng/tabs';
import { TenantManagementService } from '../../../../core/services/tenant-management.service';
import { TenantSeatService } from './tenant-seat.service';
import { BreadcrumbComponent, BreadcrumbItem } from '../../../../components/shared/breadcrumb';
import { ProviderEmbeddedComponent } from '../../../../features/admin/identity-providers';
import { UserEmbeddedComponent } from '../../../../features/admin/users';
import {
  SparklineOptions,
  TenantView,
  TenantTab,
  BrandView,
  BrandSection,
  Brand,
  BrandColour,
  Tenant,
  TenantForm,
  TenantType,
  TenantLicense,
  generateUUID
} from '../../models/administration.models';

echarts.use([LineChart, GridComponent, TooltipComponent, CanvasRenderer]);

@Component({
  selector: 'app-tenant-manager-section',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    TabsModule,
    NgApexchartsModule,
    NgxEchartsDirective,
    BreadcrumbComponent,
    ProviderEmbeddedComponent,
    UserEmbeddedComponent
  ],
  providers: [provideEchartsCore({ echarts })],
  templateUrl: './tenant-manager-section.component.html',
  styleUrl: './tenant-manager-section.component.scss'
})
export class TenantManagerSectionComponent implements OnInit {
  private tenantService = inject(TenantManagementService);
  readonly seatService = inject(TenantSeatService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private destroyRef = inject(DestroyRef);

  // URL-synced pending navigation (for when tenants haven't loaded yet)
  private pendingTenantId = signal<string | null>(null);

  // Tenant view state
  tenantView = signal<TenantView>('list');
  tenantListView = signal<'grid' | 'table'>('table');
  createStep = signal(1);

  // Tenant search and pagination
  tenantSearch = signal('');
  tenantPage = signal(1);
  tenantsPerPage = signal(10);

  // Tenants loaded from backend API
  tenants = signal<Tenant[]>([]);
  tenantsLoading = signal(false);
  tenantsError = signal<string | null>(null);

  selectedTenant = signal<Tenant | null>(null);
  editingTenant = signal<Tenant | null>(null);
  activeTenantTab = signal<TenantTab>('overview');

  // Create Tenant Modal
  showCreateTenantModal = signal(false);
  showAllocateLicenseModal = signal(false);

  // Tenant form (for edit)
  tenantForm: TenantForm = {
    fullName: '',
    shortName: '',
    description: '',
    logo: '',
    tenantType: 'regular'
  };

  // Create Tenant form (for modal)
  createTenantForm = {
    fullName: '',
    shortName: '',
    logo: '',
    licenses: {
      powerUsers: 0,
      contributors: 0,
      viewers: 0
    }
  };

  // Tenant types
  tenantTypes = [
    { value: 'master' as TenantType, label: 'Master Tenant', description: 'Top-level tenant with full administrative control' },
    { value: 'dominant' as TenantType, label: 'Dominant Tenant', description: 'Primary tenant with extended privileges' },
    { value: 'regular' as TenantType, label: 'Regular Tenant', description: 'Standard tenant with basic access' }
  ];

  // License Pool (available licenses)
  licensePool = signal({
    powerUsers: { total: 0, allocated: 0, available: 0 },
    contributors: { total: 0, allocated: 0, available: 0 },
    viewers: { total: 0, allocated: 0, available: 0 }
  });

  // Tenant License Allocations (per tenant)
  tenantLicenseAllocations = signal<Record<string, { powerUsers: number; contributors: number; viewers: number; usedPowerUsers: number; usedContributors: number; usedViewers: number }>>({});

  // Tenant Licenses
  tenantLicenses = signal<TenantLicense[]>([]);

  // Brand Management state
  brandView = signal<BrandView>('list');
  brandSection = signal<BrandSection>('typography');
  brands = signal<Brand[]>([
    {
      id: 'default',
      name: 'ThinkPLUS Default',
      description: 'Default brand theme based on ThinkPLUS design system',
      isDefault: true,
      isActive: true,
      typography: {
        primaryFont: 'Gotham Rounded',
        secondaryFont: 'Nunito',
        headingWeight: 600,
        bodyWeight: 400,
        baseSize: 16,
        scaleRatio: 1.333,
        lineHeight: 1.5
      },
      colours: {
        primary: [
          { name: 'Teal Dark', variable: '--tp-teal-dark', value: '#035a66' },
          { name: 'Teal', variable: '--tp-teal', value: '#047481' },
          { name: 'Teal Light', variable: '--tp-teal-light', value: '#5ee7f7' }
        ],
        secondary: [
          { name: 'Blue Dark', variable: '--tp-blue-dark', value: '#1a365d' },
          { name: 'Blue', variable: '--tp-blue', value: '#2c5282' },
          { name: 'Blue Light', variable: '--tp-blue-light', value: '#4299e1' }
        ],
        neutral: [
          { name: 'Gray 50', variable: '--tp-gray-50', value: '#f8fafc' },
          { name: 'Gray 100', variable: '--tp-gray-100', value: '#f1f5f9' },
          { name: 'Gray 200', variable: '--tp-gray-200', value: '#e2e8f0' },
          { name: 'Gray 500', variable: '--tp-gray-500', value: '#495567' },
          { name: 'Gray 700', variable: '--tp-gray-700', value: '#334155' },
          { name: 'Gray 800', variable: '--tp-gray-800', value: '#1e293b' }
        ],
        semantic: [
          { name: 'Success', variable: '--tp-success', value: '#276749' },
          { name: 'Warning', variable: '--tp-warning', value: '#c05621' },
          { name: 'Error', variable: '--tp-error', value: '#c53030' },
          { name: 'Info', variable: '--tp-info', value: '#2b6cb0' }
        ]
      },
      spacing: { baseUnit: 4, scale: [0, 4, 8, 12, 16, 20, 24, 32, 40, 48] },
      borderRadius: { small: '0.375rem', medium: '0.5rem', large: '0.75rem', xlarge: '1rem' },
      logoUrl: 'assets/logo.svg',
      faviconUrl: 'assets/favicon.ico',
      header: {
        showLogo: true,
        showTitle: true,
        title: 'Persona & Journey Studio',
        subtitle: 'DSG',
        backgroundColor: '#ffffff',
        textColor: '#1a202c',
        height: '64px',
        sticky: true
      },
      footer: {
        show: true,
        content: '',
        copyrightText: '\u00A9 2026 ThinkPLUS. All rights reserved.',
        backgroundColor: '#1a202c',
        textColor: '#ffffff',
        links: [
          { label: 'Privacy Policy', url: '/privacy' },
          { label: 'Terms of Service', url: '/terms' },
          { label: 'Contact', url: '/contact' }
        ]
      },
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ]);
  selectedBrand = signal<Brand | null>(null);
  editingBrand = signal<Brand | null>(null);

  brandSections = [
    { id: 'typography' as BrandSection, name: 'Typography', icon: 'type' },
    { id: 'colours' as BrandSection, name: 'Colour System', icon: 'image' },
    { id: 'imagery' as BrandSection, name: 'Imagery', icon: 'image' },
    { id: 'iconography' as BrandSection, name: 'Iconography', icon: 'grid' },
    { id: 'content' as BrandSection, name: 'Content', icon: 'edit' },
    { id: 'layout' as BrandSection, name: 'Layout & Spacing', icon: 'layers' },
    { id: 'actions' as BrandSection, name: 'Actions & Input', icon: 'check' },
    { id: 'mobile' as BrandSection, name: 'Mobile Applications', icon: 'smartphone' },
    { id: 'accessibility' as BrandSection, name: 'Accessibility', icon: 'check' }
  ];

  fontOptions = [
    'Gotham Rounded', 'Nunito', 'Inter', 'Roboto', 'Open Sans', 'Lato',
    'Poppins', 'Montserrat', 'Source Sans Pro', 'System Default'
  ];

  fontWeights = [
    { value: 300, label: 'Light (300)' },
    { value: 400, label: 'Regular (400)' },
    { value: 500, label: 'Medium (500)' },
    { value: 600, label: 'Semibold (600)' },
    { value: 700, label: 'Bold (700)' }
  ];

  // Computed signals
  filteredTenants = computed(() => {
    const search = this.tenantSearch().toLowerCase().trim();
    const allTenants = this.tenants();
    if (!search) return allTenants;
    return allTenants.filter(t =>
      t.fullName.toLowerCase().includes(search) ||
      t.shortName.toLowerCase().includes(search) ||
      t.description?.toLowerCase().includes(search)
    );
  });

  paginatedTenants = computed(() => {
    const filtered = this.filteredTenants();
    const page = this.tenantPage();
    const perPage = this.tenantsPerPage();
    const start = (page - 1) * perPage;
    return filtered.slice(start, start + perPage);
  });

  totalTenantPages = computed(() => {
    return Math.ceil(this.filteredTenants().length / this.tenantsPerPage());
  });

  // Stats computed signals
  activeTenantCount = computed(() => {
    return this.tenants().filter(t => t.status === 'active').length;
  });

  lockedTenantCount = computed(() => {
    return this.tenants().filter(t => t.status === 'locked').length;
  });

  licenseUsed = computed(() => {
    return this.tenantLicenses().reduce((total, license) => total + license.usedSeats, 0);
  });

  licenseTotal = computed(() => {
    return this.tenantLicenses().reduce((total, license) => total + license.seats, 0);
  });

  licensePercentage = computed(() => {
    const total = this.licenseTotal();
    if (total === 0) return 0;
    return Math.round((this.licenseUsed() / total) * 100);
  });

  expiringLicenses = computed(() => {
    const now = new Date();
    const threshold = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    return this.tenantLicenses().filter(license =>
      license.status === 'active' &&
      license.expiresAt > now &&
      license.expiresAt <= threshold
    ).length;
  });

  warningCount = computed(() => {
    return this.tenants().filter(t => t.status === 'locked' || t.status === 'impersonating').length;
  });

  // Breadcrumb items
  breadcrumbItems = computed((): BreadcrumbItem[] => {
    const items: BreadcrumbItem[] = [{ label: 'Administration' }];

    const tenantView = this.tenantView();
    const isInSubView = tenantView !== 'list';

    if (isInSubView) {
      items.push({
        label: 'Tenant Management',
        action: () => this.navigateToView('list')
      });

      if (tenantView === 'edit') {
        items.push({ label: 'Edit Tenant' });
      } else if (tenantView === 'factsheet') {
        items.push({ label: 'Tenant Details' });
      } else if (tenantView === 'create') {
        items.push({ label: 'Create Tenant' });
      }
    } else {
      items.push({ label: 'Tenant Management' });
    }

    return items;
  });

  // Sparkline chart configurations
  createSparklineOptions(color: string, data: number[]): SparklineOptions {
    return {
      series: [{ data }],
      chart: {
        type: 'line',
        height: 40,
        sparkline: { enabled: true },
        animations: {
          enabled: true,
          speed: 800,
          dynamicAnimation: { enabled: true, speed: 350 }
        }
      },
      stroke: {
        curve: 'smooth',
        width: 2
      },
      markers: {
        size: 0,
        hover: { size: 4 }
      },
      tooltip: {
        fixed: { enabled: false },
        x: { show: false },
        marker: { show: false }
      },
      grid: { padding: { top: 5, bottom: 5 } },
      colors: [color]
    };
  }

  // Chart data for each stat
  totalTenantsChart = this.createSparklineOptions('#047481', [10, 15, 12, 18, 14, 22, 19, 25]);
  activeTenantsChart = this.createSparklineOptions('#22c55e', [8, 10, 12, 14, 16, 18, 20, 22]);
  lockedTenantsChart = this.createSparklineOptions('#f59e0b', [5, 4, 6, 5, 4, 3, 4, 3]);
  licensesChart = this.createSparklineOptions('#3b82f6', [80, 95, 100, 110, 115, 120, 125, 125]);
  expiringChart = this.createSparklineOptions('#eab308', [2, 3, 2, 4, 3, 3, 4, 3]);
  warningsChart = this.createSparklineOptions('#ef4444', [8, 6, 7, 5, 6, 4, 5, 3]);
  warningsEchartsOptions: EChartsOption = {
    animation: true,
    grid: {
      left: 0,
      right: 0,
      top: 6,
      bottom: 2
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'line' },
      backgroundColor: 'rgba(17, 24, 39, 0.92)',
      borderColor: 'rgba(239, 68, 68, 0.35)',
      textStyle: { color: '#fff' }
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      show: false,
      data: ['W1', 'W2', 'W3', 'W4', 'W5', 'W6', 'W7', 'W8']
    },
    yAxis: {
      type: 'value',
      show: false
    },
    series: [
      {
        type: 'line',
        smooth: true,
        symbol: 'none',
        lineStyle: {
          width: 2,
          color: '#ef4444'
        },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(239, 68, 68, 0.35)' },
              { offset: 1, color: 'rgba(239, 68, 68, 0.03)' }
            ]
          }
        },
        data: [8, 6, 7, 5, 6, 4, 5, 3]
      }
    ]
  };

  // Expose Math for template
  Math = Math;

  // ========================================
  // Lifecycle
  // ========================================

  ngOnInit(): void {
    // Sync view state from URL query params (enables refresh + browser back/forward)
    this.route.queryParams.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(params => {
      const view = (params['view'] as TenantView) || 'list';
      this.tenantView.set(view);

      const tab = (params['tab'] as TenantTab) || 'overview';
      this.activeTenantTab.set(tab);

      const tenantId = params['tenantId'];
      if (tenantId && view !== 'list') {
        this.resolveTenant(tenantId);
        // Load seat availability when navigating to the Licenses tab
        if (tab === 'licenses') {
          this.loadSeatDataForTenant(tenantId);
        }
      } else if (view === 'list') {
        this.selectedTenant.set(null);
        this.editingTenant.set(null);
      }
    });

    this.loadTenants();
  }

  // ========================================
  // Data Loading
  // ========================================

  loadTenants(): void {
    this.tenantsLoading.set(true);
    this.tenantsError.set(null);

    this.tenantService.loadTenants().subscribe({
      next: (response) => {
        const tenants: Tenant[] = response.tenants.map(t => ({
          id: t.id,
          uuid: t.uuid,
          fullName: t.fullName,
          shortName: t.shortName,
          description: t.description || '',
          logo: t.logo || '',
          tenantType: t.tenantType,
          status: t.status === 'suspended' ? 'locked' : t.status === 'pending' ? 'impersonating' : t.status,
          isProtected: t.isProtected ?? false,
          createdAt: new Date(t.createdAt),
          updatedAt: new Date(t.updatedAt)
        }));
        this.tenants.set(tenants);
        this.tenantsLoading.set(false);

        // Resolve pending navigation from URL params (refresh case)
        const pendingId = this.pendingTenantId();
        if (pendingId) {
          this.resolveTenant(pendingId);
        }
      },
      error: (err) => {
        this.tenantsError.set(err.message || 'Failed to load tenants');
        this.tenantsLoading.set(false);
        console.error('Failed to load tenants:', err);
      }
    });
  }

  // ========================================
  // Tenant Search & Pagination
  // ========================================

  onTenantSearch(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.tenantSearch.set(value);
    this.tenantPage.set(1);
  }

  onPerPageChange(event: Event): void {
    const value = parseInt((event.target as HTMLSelectElement).value, 10);
    this.tenantsPerPage.set(value);
    this.tenantPage.set(1);
  }

  // ========================================
  // Tenant CRUD
  // ========================================

  createTenant(): void {
    if (!this.tenantForm.fullName || !this.tenantForm.shortName) return;

    const request = {
      fullName: this.tenantForm.fullName,
      shortName: this.tenantForm.shortName,
      slug: this.tenantForm.shortName.toLowerCase().replace(/\s+/g, '-'),
      description: this.tenantForm.description,
      tenantType: 'regular' as const,
      tier: 'professional' as const,
      adminEmail: ''
    };

    this.tenantsLoading.set(true);
    this.tenantService.createTenant(request).subscribe({
      next: (created) => {
        const newTenant: Tenant = {
          id: created.id,
          uuid: created.uuid,
          fullName: created.fullName,
          shortName: created.shortName,
          description: created.description || '',
          logo: created.logo || this.tenantForm.logo,
          tenantType: created.tenantType,
          status: created.status === 'pending' ? 'impersonating' : created.status === 'suspended' ? 'locked' : created.status,
          isProtected: created.isProtected ?? false,
          createdAt: new Date(created.createdAt),
          updatedAt: new Date(created.updatedAt)
        };
        this.tenants.update(tenants => [...tenants, newTenant]);
        this.tenantsLoading.set(false);
        this.resetTenantForm();
        this.navigateToView('list');
      },
      error: (err) => {
        console.error('Failed to create tenant:', err);
        this.tenantsError.set(err.message || 'Failed to create tenant');
        this.tenantsLoading.set(false);
        alert('Failed to create tenant: ' + (err.message || 'Unknown error'));
      }
    });
  }

  updateTenant(): void {
    const editing = this.editingTenant();
    if (!editing || !this.tenantForm.fullName || !this.tenantForm.shortName) return;

    const request = {
      fullName: this.tenantForm.fullName,
      shortName: this.tenantForm.shortName,
      description: this.tenantForm.description,
      logo: this.tenantForm.logo
    };

    this.tenantsLoading.set(true);
    this.tenantService.updateTenant(editing.uuid, request).subscribe({
      next: (updated) => {
        this.tenants.update(tenants =>
          tenants.map(t => t.id === editing.id ? {
            ...t,
            fullName: updated.fullName,
            shortName: updated.shortName,
            description: updated.description || '',
            logo: updated.logo || '',
            updatedAt: new Date(updated.updatedAt)
          } : t)
        );

        if (this.selectedTenant()?.id === editing.id) {
          const updatedLocal = this.tenants().find(t => t.id === editing.id);
          if (updatedLocal) this.selectedTenant.set(updatedLocal);
        }

        this.tenantsLoading.set(false);
        this.resetTenantForm();
        this.editingTenant.set(null);
        this.navigateToView('factsheet', editing.uuid);
      },
      error: (err) => {
        console.error('Failed to update tenant:', err);
        this.tenantsError.set(err.message || 'Failed to update tenant');
        this.tenantsLoading.set(false);
        alert('Failed to update tenant: ' + (err.message || 'Unknown error'));
      }
    });
  }

  startEditTenant(tenant: Tenant): void {
    if (tenant.isProtected) {
      alert('Protected tenants cannot be edited.');
      return;
    }
    this.editingTenant.set(tenant);
    this.tenantForm = {
      fullName: tenant.fullName,
      shortName: tenant.shortName,
      description: tenant.description,
      logo: tenant.logo,
      tenantType: tenant.tenantType || 'regular'
    };
    this.navigateToView('edit', tenant.uuid);
  }

  viewTenantFactsheet(tenant: Tenant): void {
    this.navigateToView('factsheet', tenant.uuid);
  }

  viewTenant(tenant: Tenant): void {
    this.navigateToView('factsheet', tenant.uuid);
  }

  deleteTenant(tenant: Tenant): void {
    if (tenant.isProtected) {
      alert('Protected tenants cannot be deleted.');
      return;
    }
    if (confirm(`Are you sure you want to delete "${tenant.fullName}"? This action cannot be undone.`)) {
      this.tenantService.deleteTenant(tenant.uuid).subscribe({
        next: () => {
          this.tenants.update(tenants => tenants.filter(t => t.id !== tenant.id));
          if (this.selectedTenant()?.id === tenant.id) {
            this.navigateToView('list');
          }
        },
        error: (err) => {
          console.error('Failed to delete tenant:', err);
          alert('Failed to delete tenant: ' + (err.message || 'Unknown error'));
        }
      });
    }
  }

  lockTenant(tenant: Tenant): void {
    if (tenant.isProtected) {
      alert('Protected tenants cannot be locked.');
      return;
    }
    this.tenantService.lockTenant(tenant.uuid).subscribe({
      next: (updated) => {
        this.tenants.update(tenants =>
          tenants.map(t => t.id === tenant.id ? { ...t, status: 'locked' as const, updatedAt: new Date(updated.updatedAt) } : t)
        );
        if (this.selectedTenant()?.id === tenant.id) {
          const updatedLocal = this.tenants().find(t => t.id === tenant.id);
          if (updatedLocal) this.selectedTenant.set(updatedLocal);
        }
      },
      error: (err) => {
        console.error('Failed to lock tenant:', err);
      }
    });
  }

  unlockTenant(tenant: Tenant): void {
    this.tenantService.unlockTenant(tenant.uuid).subscribe({
      next: (updated) => {
        this.tenants.update(tenants =>
          tenants.map(t => t.id === tenant.id ? { ...t, status: 'active' as const, updatedAt: new Date(updated.updatedAt) } : t)
        );
        if (this.selectedTenant()?.id === tenant.id) {
          const updatedLocal = this.tenants().find(t => t.id === tenant.id);
          if (updatedLocal) this.selectedTenant.set(updatedLocal);
        }
      },
      error: (err) => {
        console.error('Failed to unlock tenant:', err);
      }
    });
  }

  activateTenant(tenant: Tenant): void {
    this.tenants.update(tenants =>
      tenants.map(t => t.id === tenant.id ? { ...t, status: 'active' as const, updatedAt: new Date() } : t)
    );
  }

  cancelTenantForm(): void {
    this.resetTenantForm();
    const selected = this.selectedTenant();
    this.editingTenant.set(null);
    if (selected) {
      this.navigateToView('factsheet', selected.uuid);
    } else {
      this.navigateToView('list');
    }
  }

  canSaveTenant(): boolean {
    return !!(this.tenantForm.fullName && this.tenantForm.shortName);
  }

  canProceed(): boolean {
    return !!(this.tenantForm.fullName?.trim() && this.tenantForm.shortName?.trim());
  }

  nextStep(): void {
    if (this.createStep() < 3) {
      this.createStep.update(s => s + 1);
    }
  }

  prevStep(): void {
    if (this.createStep() > 1) {
      this.createStep.update(s => s - 1);
    }
  }

  cancelCreate(): void {
    this.createStep.set(1);
    this.resetTenantForm();
    this.navigateToView('list');
  }

  // ========================================
  // Create Tenant Modal Methods
  // ========================================

  openCreateTenantModal(): void {
    this.resetCreateTenantForm();
    this.showCreateTenantModal.set(true);
  }

  closeCreateTenantModal(): void {
    this.showCreateTenantModal.set(false);
    this.resetCreateTenantForm();
  }

  resetCreateTenantForm(): void {
    this.createTenantForm = {
      fullName: '',
      shortName: '',
      logo: '',
      licenses: {
        powerUsers: 0,
        contributors: 0,
        viewers: 0
      }
    };
  }

  onModalLogoSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      if (file.size > 2 * 1024 * 1024) {
        alert('File size must be less than 2MB');
        return;
      }
      const reader = new FileReader();
      reader.onload = (e) => {
        this.createTenantForm.logo = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  canCreateTenant(): boolean {
    return !!(this.createTenantForm.fullName && this.createTenantForm.shortName);
  }

  createTenantFromModal(): void {
    if (!this.canCreateTenant()) return;

    const licenses = this.createTenantForm.licenses;
    const request = {
      fullName: this.createTenantForm.fullName,
      shortName: this.createTenantForm.shortName,
      slug: this.createTenantForm.shortName.toLowerCase().replace(/\s+/g, '-'),
      tenantType: 'regular' as const,
      tier: 'professional' as const,
      adminEmail: '',
      licenses: {
        powerUsers: licenses.powerUsers,
        contributors: licenses.contributors,
        viewers: licenses.viewers
      }
    };

    this.tenantsLoading.set(true);
    this.tenantService.createTenant(request).subscribe({
      next: (created) => {
        const newTenant: Tenant = {
          id: created.id,
          uuid: created.uuid,
          fullName: created.fullName,
          shortName: created.shortName,
          description: created.description || '',
          logo: created.logo || this.createTenantForm.logo,
          tenantType: created.tenantType,
          status: created.status === 'pending' ? 'impersonating' : created.status === 'suspended' ? 'locked' : created.status,
          isProtected: created.isProtected ?? false,
          createdAt: new Date(created.createdAt),
          updatedAt: new Date(created.updatedAt)
        };
        this.tenants.update(tenants => [...tenants, newTenant]);

        this.tenantsLoading.set(false);
        this.closeCreateTenantModal();
      },
      error: (err) => {
        console.error('Failed to create tenant:', err);
        this.tenantsError.set(err.message || 'Failed to create tenant');
        this.tenantsLoading.set(false);
        alert('Failed to create tenant: ' + (err.message || 'Unknown error'));
      }
    });
  }

  // ========================================
  // Logo Upload
  // ========================================

  onLogoSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      if (file.size > 2 * 1024 * 1024) {
        alert('File size must be less than 2MB');
        return;
      }
      const reader = new FileReader();
      reader.onload = (e) => {
        this.tenantForm.logo = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  // ========================================
  // Utility / Display Methods
  // ========================================

  copyToClipboard(text: string): void {
    navigator.clipboard.writeText(text);
  }

  getTenantTypeLabel(type: TenantType): string {
    const found = this.tenantTypes.find(t => t.value === type);
    return found ? found.label : type;
  }

  getStatusLabel(status: 'active' | 'locked' | 'impersonating'): string {
    switch (status) {
      case 'active': return 'Active';
      case 'locked': return 'Locked';
      case 'impersonating': return 'Impersonating';
      default: return status;
    }
  }

  getTenantColor(type: TenantType): string {
    switch (type) {
      case 'master': return '#7c3aed';
      case 'dominant': return '#047481';
      case 'regular': return '#64748b';
      default: return '#64748b';
    }
  }

  exportTenants(): void {
    console.log('Exporting tenants...');
  }

  // ========================================
  // Tenant License Allocation Methods
  // ========================================

  /**
   * Load seat availability data for a tenant from the backend.
   */
  loadSeatDataForTenant(tenantId: string): void {
    this.seatService.loadSeatAvailability(tenantId);
    this.seatService.loadAssignments(tenantId);
  }

  getTenantAllocation(type: 'tenantAdmins' | 'powerUsers' | 'contributors' | 'viewers'): number {
    const tenant = this.selectedTenant();
    if (!tenant) return 0;
    const allocation = this.seatService.getAllocationForTenant(tenant.uuid);
    return allocation[type];
  }

  getTenantUsage(type: 'tenantAdmins' | 'powerUsers' | 'contributors' | 'viewers'): number {
    const tenant = this.selectedTenant();
    if (!tenant) return 0;
    const allocation = this.seatService.getAllocationForTenant(tenant.uuid);
    const usageKey = `used${type.charAt(0).toUpperCase() + type.slice(1)}` as keyof typeof allocation;
    return allocation[usageKey] as number || 0;
  }

  getUtilizationPercent(type: 'tenantAdmins' | 'powerUsers' | 'contributors' | 'viewers'): number {
    const allocated = this.getTenantAllocation(type);
    const used = this.getTenantUsage(type);
    if (allocated === 0) return 0;
    return Math.round((used / allocated) * 100);
  }

  getLicenseExpiringCount(): number {
    const tenant = this.selectedTenant();
    if (!tenant) return 0;

    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    return this.tenantLicenses().filter(license =>
      license.tenantId === tenant.id &&
      license.status === 'active' &&
      license.expiresAt > now &&
      license.expiresAt <= thirtyDaysFromNow
    ).length;
  }

  getDaysUntilExpiration(): number {
    const tenant = this.selectedTenant();
    if (!tenant) return 0;

    const now = new Date();
    const activeLicenses = this.tenantLicenses()
      .filter(license => license.tenantId === tenant.id && license.status === 'active')
      .sort((a, b) => a.expiresAt.getTime() - b.expiresAt.getTime());

    const nearest = activeLicenses[0];
    if (!nearest) return 0;

    const diffTime = nearest.expiresAt.getTime() - now.getTime();
    return Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
  }

  getTenantLicenseExpiry(): Date | null {
    const tenant = this.selectedTenant();
    if (!tenant) return null;

    const activeLicenses = this.tenantLicenses()
      .filter(license => license.tenantId === tenant.id && license.status === 'active')
      .sort((a, b) => a.expiresAt.getTime() - b.expiresAt.getTime());

    return activeLicenses[0]?.expiresAt ?? null;
  }

  editLicenseAllocation(_type: 'tenantAdmins' | 'powerUsers' | 'contributors' | 'viewers'): void {
    this.showAllocateLicenseModal.set(true);
  }

  closeAllocateLicenseModal(): void {
    this.showAllocateLicenseModal.set(false);
  }

  getTenantLicenseCount(type: 'active' | 'users' | 'expiring'): number {
    const tenant = this.selectedTenant();
    if (!tenant) return 0;

    const licenses = this.tenantLicenses().filter(l => l.tenantId === tenant.id);

    switch (type) {
      case 'active':
        return licenses.filter(l => l.status === 'active').length;
      case 'users':
        return licenses.reduce((sum, l) => sum + l.seats, 0);
      case 'expiring': {
        const threeMonths = new Date();
        threeMonths.setMonth(threeMonths.getMonth() + 3);
        return licenses.filter(l => l.expiresAt <= threeMonths && l.status === 'active').length;
      }
      default:
        return 0;
    }
  }

  getTenantLicenses(): TenantLicense[] {
    const tenant = this.selectedTenant();
    if (!tenant) return [];
    return this.tenantLicenses().filter(l => l.tenantId === tenant.id);
  }

  openAllocateLicenseModal(): void {
    this.showAllocateLicenseModal.set(true);
  }

  editTenantLicense(license: TenantLicense): void {
    console.log('Editing license:', license);
  }

  revokeTenantLicense(license: TenantLicense): void {
    if (confirm(`Are you sure you want to revoke the "${license.name}" license from this tenant?`)) {
      this.tenantLicenses.update(licenses => licenses.filter(l => l.id !== license.id));
    }
  }

  // ========================================
  // Brand Management Methods
  // ========================================

  selectBrand(brand: Brand): void {
    const brandCopy = JSON.parse(JSON.stringify(brand));
    this.selectedBrand.set(brandCopy);
    this.brandSection.set('typography');
  }

  editBrand(brand: Brand): void {
    if (brand.isDefault) {
      alert('The default brand is read-only and cannot be edited. Create an alternative brand to customize.');
      return;
    }
    this.selectBrand(brand);
  }

  createAlternativeBrand(): void {
    const defaultBrand = this.brands().find(b => b.isDefault);
    if (!defaultBrand) return;

    const newBrand: Brand = {
      ...JSON.parse(JSON.stringify(defaultBrand)),
      id: generateUUID(),
      name: 'Alternative Brand',
      description: 'Custom brand theme',
      isDefault: false,
      isActive: false,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.brands.update(brands => [...brands, newBrand]);
    this.selectBrand(newBrand);
  }

  activateBrand(brand: Brand): void {
    this.brands.update(brands =>
      brands.map(b => ({
        ...b,
        isActive: b.id === brand.id
      }))
    );
  }

  deleteBrand(brand: Brand): void {
    if (brand.isDefault) {
      alert('The default brand cannot be deleted.');
      return;
    }
    if (brand.isActive) {
      alert('Cannot delete the active brand. Please activate another brand first.');
      return;
    }
    if (confirm(`Are you sure you want to delete "${brand.name}"?`)) {
      this.brands.update(brands => brands.filter(b => b.id !== brand.id));
      if (this.selectedBrand()?.id === brand.id) {
        this.selectedBrand.set(null);
      }
    }
  }

  saveBrand(): void {
    const editedBrand = this.selectedBrand();
    if (!editedBrand) return;

    if (editedBrand.isDefault) {
      alert('The default brand is read-only and cannot be modified.');
      return;
    }

    editedBrand.updatedAt = new Date();
    this.brands.update(brands =>
      brands.map(b => b.id === editedBrand.id ? editedBrand : b)
    );
    this.selectedBrand.set(null);
  }

  cancelBrandEdit(): void {
    this.selectedBrand.set(null);
  }

  updateColour(type: 'primary' | 'secondary', variable: string, event: Event): void {
    const input = event.target as HTMLInputElement;
    const brand = this.selectedBrand();
    if (!brand) return;

    const colours = type === 'primary' ? brand.colours.primary : brand.colours.secondary;
    const color = colours.find(c => c.variable === variable);
    if (color) {
      color.value = input.value;
    }
  }

  addColour(type: 'primary' | 'secondary'): void {
    const brand = this.selectedBrand();
    if (!brand || brand.isDefault) return;

    const newColour: BrandColour = {
      name: 'New Colour',
      variable: `--custom-${type}-${Date.now()}`,
      value: '#cccccc'
    };

    if (type === 'primary') {
      brand.colours.primary = [...brand.colours.primary, newColour];
    } else {
      brand.colours.secondary = [...brand.colours.secondary, newColour];
    }
  }

  getBrandSectionName(section: BrandSection): string {
    const found = this.brandSections.find(s => s.id === section);
    return found ? found.name : section;
  }

  isDefaultBrand(): boolean {
    return this.selectedBrand()?.isDefault ?? false;
  }

  updateHeaderColor(property: 'backgroundColor' | 'textColor', event: Event): void {
    const brand = this.selectedBrand();
    if (!brand || brand.isDefault) return;
    const input = event.target as HTMLInputElement;
    brand.header[property] = input.value;
  }

  updateFooterColor(property: 'backgroundColor' | 'textColor', event: Event): void {
    const brand = this.selectedBrand();
    if (!brand || brand.isDefault) return;
    const input = event.target as HTMLInputElement;
    brand.footer[property] = input.value;
  }

  addFooterLink(): void {
    const brand = this.selectedBrand();
    if (!brand || brand.isDefault) return;
    brand.footer.links = [...brand.footer.links, { label: 'New Link', url: '/' }];
  }

  removeFooterLink(index: number): void {
    const brand = this.selectedBrand();
    if (!brand || brand.isDefault) return;
    brand.footer.links = brand.footer.links.filter((_, i) => i !== index);
  }

  // ========================================
  // URL Navigation Helpers
  // ========================================

  /**
   * Navigate to a view by updating URL query params.
   * The queryParams subscription in ngOnInit handles syncing signals.
   */
  navigateToView(view: TenantView, tenantId?: string, tab?: TenantTab): void {
    const params: Record<string, string> = { section: 'tenant-manager' };
    if (view !== 'list') {
      params['view'] = view;
      if (tenantId) params['tenantId'] = tenantId;
      if (tab) params['tab'] = tab;
    }
    this.router.navigate([], { relativeTo: this.route, queryParams: params });
  }

  /**
   * Navigate to a tab within the current factsheet view.
   */
  navigateToTab(tab: TenantTab): void {
    const tenant = this.selectedTenant();
    if (tenant) {
      this.navigateToView('factsheet', tenant.uuid, tab);
    }
  }

  /**
   * PrimeNG tabs emit string values. Route to URL-synced tab state only for known tab keys.
   */
  onTenantTabsValueChange(value: string | number | undefined): void {
    if (typeof value !== 'string') {
      return;
    }
    if (!this.getAvailableTenantTabs().includes(value as TenantTab)) {
      return;
    }
    this.navigateToTab(value as TenantTab);
  }

  /**
   * Resolve a tenant by identifier (UUID preferred, legacy ID supported)
   * from the loaded tenants list. If tenants aren't loaded yet, stores
   * the identifier for later resolution.
   */
  private resolveTenant(tenantId: string): void {
    const tenant = this.tenants().find(t => t.uuid === tenantId || t.id === tenantId);
    if (tenant) {
      this.selectedTenant.set(tenant);
      if (this.tenantView() === 'edit') {
        this.editingTenant.set(tenant);
        this.tenantForm = {
          fullName: tenant.fullName,
          shortName: tenant.shortName,
          description: tenant.description,
          logo: tenant.logo,
          tenantType: tenant.tenantType || 'regular'
        };
      }
      this.pendingTenantId.set(null);
    } else {
      // Tenants not loaded yet — will resolve after loadTenants completes
      this.pendingTenantId.set(tenantId);
    }
  }

  // ========================================
  // Private helpers
  // ========================================

  private resetTenantForm(): void {
    this.tenantForm = {
      fullName: '',
      shortName: '',
      description: '',
      logo: '',
      tenantType: 'regular'
    };
  }

  private getAvailableTenantTabs(): TenantTab[] {
    const baseTabs: TenantTab[] = ['overview', 'locale', 'authentication', 'users', 'branding'];
    if (this.selectedTenant()?.tenantType !== 'master') {
      baseTabs.push('licenses');
    }
    return baseTabs;
  }
}
