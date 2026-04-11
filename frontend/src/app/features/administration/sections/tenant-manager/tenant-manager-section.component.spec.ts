import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { providePrimeNG } from 'primeng/config';
import { vi } from 'vitest';
import { of, throwError } from 'rxjs';
import { DefaultPrimePreset } from '../../../../core/theme/default-preset';
import { provideAppIcons } from '../../../../core/icons/provide-icons';

// PrimeNG TabList requires ResizeObserver which is missing in JSDOM
if (typeof globalThis.ResizeObserver === 'undefined') {
  globalThis.ResizeObserver = class ResizeObserver {
    observe(): void {
      return;
    }
    unobserve(): void {
      return;
    }
    disconnect(): void {
      return;
    }
  } as unknown as typeof ResizeObserver;
}

import { TenantManagerSectionComponent } from './tenant-manager-section.component';
import { ApiGatewayService } from '../../../../core/api/api-gateway.service';
import { SessionService } from '../../../../core/services/session.service';
import {
  BrandDraft,
  BrandHistoryItem,
  BrandStarterKitSummary,
  IconLibrarySummary,
  PalettePackSummary,
  TenantBranding,
  TypographyPackSummary,
} from '../../../../core/api/models';

const defaultBranding: TenantBranding = {
  primaryColor: '#428177',
  primaryColorDark: '#054239',
  secondaryColor: '#988561',
  surfaceColor: '#F2EFE9',
  textColor: '#3d3a3b',
  shadowDarkColor: '#988561',
  shadowLightColor: '#F5E6D0',
  logoUrl: '',
  logoUrlDark: '',
  faviconUrl: '',
  loginBackgroundUrl: '',
  customCss: '',
  cornerRadius: 16,
  buttonDepth: 12,
  shadowIntensity: 50,
  softShadows: true,
  compactNav: false,
  hoverButton: 'lift',
  hoverCard: 'lift',
  hoverInput: 'press',
  hoverNav: 'slide',
  hoverTableRow: 'highlight',
  componentTokens: {},
  updatedAt: '2026-03-04T00:00:00Z',
};

const defaultDraft: BrandDraft = {
  tenantId: 'uuid-master',
  selectedStarterKitId: 'starter-default',
  selectedPalettePackId: 'palette-default',
  selectedTypographyPackId: 'typography-default',
  selectedIconLibraryId: null,
  manifestOverrides: {
    branding: defaultBranding,
    components: {},
  },
  updatedAt: '2026-03-23T00:00:00Z',
  updatedBy: 'tester',
  lastValidatedAt: '2026-03-23T00:00:00Z',
  previewManifest: {},
};

const starterKits: readonly BrandStarterKitSummary[] = [
  {
    starterKitId: 'starter-default',
    name: 'Current Platform Brand',
    description: 'Default tenant starter kit',
    previewThumbnailAssetId: '',
    basePalettePackId: 'palette-default',
    baseTypographyPackId: 'typography-default',
    isDefault: true,
    status: 'ACTIVE',
  },
];

const palettePacks: readonly PalettePackSummary[] = [
  {
    palettePackId: 'palette-default',
    name: 'Emsist Default',
    description: 'Current production palette',
    primary: '#428177',
    secondary: '#988561',
    accent: '#054239',
    surface: '#F2EFE9',
    surfaceRaised: '#faf8f5',
    text: '#3d3a3b',
    textMuted: '#7a7672',
    border: '#e0ddda',
    success: '#428177',
    warning: '#988561',
    error: '#ef4444',
    info: '#054239',
    isDefault: true,
    status: 'ACTIVE',
  },
];

const typographyPacks: readonly TypographyPackSummary[] = [
  {
    typographyPackId: 'typography-default',
    name: 'Platform Sans',
    description: 'Default approved font stack',
    headingFontFamily: 'var(--tp-font-family-brand)',
    bodyFontFamily: 'var(--tp-font-family-brand)',
    monoFontFamily: 'var(--tp-font-family-mono)',
    fontSourceType: 'SYSTEM',
    isDefault: true,
    status: 'ACTIVE',
  },
];

const iconLibraries: readonly IconLibrarySummary[] = [];
const brandHistory: readonly BrandHistoryItem[] = [];

describe('TenantManagerSectionComponent', () => {
  let fixture: ComponentFixture<TenantManagerSectionComponent>;
  let component: TenantManagerSectionComponent;

  const apiStub = {
    listTenants: vi.fn(() =>
      of({
        tenants: [
          {
            id: 'tenant-master',
            uuid: 'uuid-master',
            fullName: 'Master Tenant',
            shortName: 'Master',
            status: 'ACTIVE',
            tenantType: 'MASTER',
            tier: 'ENTERPRISE',
          },
          {
            id: 'tenant-regular',
            uuid: 'uuid-regular',
            fullName: 'Regular Tenant',
            shortName: 'Regular',
            status: 'ACTIVE',
            tenantType: 'REGULAR',
            tier: 'STANDARD',
          },
        ],
        total: 2,
        page: 1,
        limit: 200,
      }),
    ),
    getTenantBranding: vi.fn(() => of(defaultBranding)),
    updateTenantBranding: vi.fn(() => of(defaultBranding)),
    getTenantBrandDraft: vi.fn(() => of(defaultDraft)),
    updateTenantBrandDraft: vi.fn(() => of(defaultDraft)),
    validateTenantBrandDraft: vi.fn(() =>
      of({ valid: true, violations: [], warnings: [], normalized: {} }),
    ),
    publishTenantBrandDraft: vi.fn(() =>
      of({
        brandProfileId: 'profile-1',
        manifestVersion: 1,
        profileVersion: 1,
        manifest: {},
        publishedAt: '2026-03-23T00:00:00Z',
        publishedBy: 'tester',
      }),
    ),
    rollbackTenantBrandProfile: vi.fn(() =>
      of({
        brandProfileId: 'profile-1',
        manifestVersion: 1,
        profileVersion: 1,
        manifest: {},
        publishedAt: '2026-03-23T00:00:00Z',
        publishedBy: 'tester',
      }),
    ),
    getTenantBrandHistory: vi.fn(() => of(brandHistory)),
    listBrandStarterKits: vi.fn(() => of(starterKits)),
    listBrandPalettePacks: vi.fn(() => of(palettePacks)),
    listBrandTypographyPacks: vi.fn(() => of(typographyPacks)),
    listTenantBrandAssets: vi.fn(() => of([])),
    listTenantIconLibraries: vi.fn(() => of(iconLibraries)),
    getTenantStats: vi.fn(() =>
      of({ totalTenants: 2, activeTenants: 2, suspendedTenants: 0, trialTenants: 0 }),
    ),
    listTenantIdentityProviders: vi.fn(() => of([])),
    createTenantIdentityProvider: vi.fn(() => of({})),
    patchTenantIdentityProvider: vi.fn(() => of({})),
    testTenantIdentityProvider: vi.fn(() => of({})),
    deleteTenantIdentityProvider: vi.fn(() => of({})),
    getTenantIdentityProvider: vi.fn(() => of({})),
    getTenantSeatAvailability: vi.fn(() => of({ available: 0, total: 0, used: 0 })),
    listTenantSeatAssignments: vi.fn(() => of([])),
    revokeTenantSeat: vi.fn(() => of({})),
    listTenantUsers: vi.fn(() =>
      of({ content: [], totalElements: 0, totalPages: 0, page: 0, size: 20 }),
    ),
  };

  const sessionStub = {
    accessToken: signal('mock-token'),
    refreshToken: signal('mock-refresh'),
    isAuthenticated: signal(true),
    currentTenantId: signal('tenant-master'),
    isSuperAdmin: signal(true),
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    apiStub.listTenants.mockReturnValue(
      of({
        tenants: [
          {
            id: 'tenant-master',
            uuid: 'uuid-master',
            fullName: 'Master Tenant',
            shortName: 'Master',
            status: 'ACTIVE',
            tenantType: 'MASTER',
            tier: 'ENTERPRISE',
          },
          {
            id: 'tenant-regular',
            uuid: 'uuid-regular',
            fullName: 'Regular Tenant',
            shortName: 'Regular',
            status: 'ACTIVE',
            tenantType: 'REGULAR',
            tier: 'STANDARD',
          },
        ],
        total: 2,
        page: 1,
        limit: 200,
      }),
    );
    apiStub.getTenantBranding.mockReturnValue(of(defaultBranding));
    apiStub.getTenantBrandDraft.mockReturnValue(of(defaultDraft));
    apiStub.getTenantStats.mockReturnValue(
      of({ totalTenants: 2, activeTenants: 2, suspendedTenants: 0, trialTenants: 0 }),
    );

    await TestBed.configureTestingModule({
      imports: [TenantManagerSectionComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideAnimations(),
        provideRouter([]),
        providePrimeNG({ theme: { preset: DefaultPrimePreset } }),
        provideAppIcons(),
        { provide: ApiGatewayService, useValue: apiStub },
        { provide: SessionService, useValue: sessionStub },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TenantManagerSectionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('loads tenants on init', () => {
    expect(apiStub.listTenants).toHaveBeenCalled();

    const tenants = (
      component as unknown as { tenants: () => readonly { id: string }[] }
    ).tenants();
    expect(tenants.length).toBeGreaterThan(0);
  });

  it('loads tenant stats on init', () => {
    expect(apiStub.getTenantStats).toHaveBeenCalled();

    const stats = (component as unknown as { stats: () => unknown }).stats();
    expect(stats).toBeTruthy();
  });

  it('sets loading to false after tenants load', () => {
    const loading = (component as unknown as { loading: () => boolean }).loading();
    expect(loading).toBe(false);
  });

  it('sets error when tenant load fails', () => {
    apiStub.listTenants.mockReturnValueOnce(throwError(() => new Error('boom')));
    (component as unknown as { loadTenants: () => void }).loadTenants();
    fixture.detectChanges();

    const error = (component as unknown as { error: () => string | null }).error();
    expect(error).toContain('Unable to load tenants');
  });

  it('fetches branding when fact sheet is opened', () => {
    const tenants = (
      component as unknown as { tenants: () => readonly { uuid: string }[] }
    ).tenants();
    const masterTenant = tenants[0];

    (component as unknown as { openFactSheet: (t: unknown) => void }).openFactSheet(masterTenant);
    fixture.detectChanges();

    expect(apiStub.getTenantBranding).toHaveBeenCalled();
  });
});
