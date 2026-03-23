import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { By } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { vi } from 'vitest';
import { of, throwError } from 'rxjs';

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
import { TenantBranding } from '../../../../core/api/models';
import { BrandingStudioComponent } from './branding-studio/branding-studio.component';

/**
 * Unit tests for TenantManagerSectionComponent -- Branding integration.
 *
 * Angular 21's @angular/build:unit-test does NOT support vi.mock().
 * Tests use TestBed with service stubs (useValue) and vi.fn for verification.
 *
 * Covers:
 * 1. Initial load selects master tenant and fetches branding.
 * 2. Master-first mode blocks selecting non-master tenants.
 * 3. Branding saved event updates in-memory branding state.
 * 4. Branding tab passes tenant scope + initial branding to BrandingStudio.
 * 5. Branding load errors clear current branding.
 */
describe('TenantManagerSectionComponent -- Branding Integration', () => {
  let fixture: ComponentFixture<TenantManagerSectionComponent>;
  let component: TenantManagerSectionComponent;

  const defaultBranding: TenantBranding = {
    primaryColor: '#428177',
    primaryColorDark: '#054239',
    secondaryColor: '#b9a779',
    surfaceColor: '#edebe0',
    textColor: '#3d3a3b',
    shadowDarkColor: '#988561',
    shadowLightColor: '#ffffff',
    logoUrl: '',
    logoUrlDark: '',
    faviconUrl: '',
    loginBackgroundUrl: '',
    fontFamily: "'Gotham Rounded', 'Nunito', sans-serif",
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

  // Stub ApiGatewayService -- all methods used by component + child components
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
    // Child component stubs (ProviderEmbeddedComponent)
    listTenantIdentityProviders: vi.fn(() => of([])),
    createTenantIdentityProvider: vi.fn(() => of({})),
    patchTenantIdentityProvider: vi.fn(() => of({})),
    testTenantIdentityProvider: vi.fn(() => of({})),
    deleteTenantIdentityProvider: vi.fn(() => of({})),
    getTenantIdentityProvider: vi.fn(() => of({})),
    // Child component stubs (LicenseEmbeddedComponent)
    getTenantSeatAvailability: vi.fn(() => of({ available: 0, total: 0, used: 0 })),
    listTenantSeatAssignments: vi.fn(() => of([])),
    revokeTenantSeat: vi.fn(() => of({})),
    // Child component stubs (UserEmbeddedComponent)
    listTenantUsers: vi.fn(() =>
      of({ content: [], totalElements: 0, totalPages: 0, page: 0, size: 20 }),
    ),
  };

  // Stub SessionService -- component reads session to determine master tenant
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

    await TestBed.configureTestingModule({
      imports: [TenantManagerSectionComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
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

  it('loads master tenant and its branding on init', () => {
    expect(apiStub.listTenants).toHaveBeenCalledWith(1, 200);
    expect(apiStub.getTenantBranding).toHaveBeenCalledWith('uuid-master');

    const selected = (
      component as unknown as { selectedTenant: () => { uuid?: string } | null }
    ).selectedTenant();
    expect(selected?.uuid).toBe('uuid-master');

    const currentBranding = (
      component as unknown as { currentBranding: () => TenantBranding | null }
    ).currentBranding();
    expect(currentBranding?.surfaceColor).toBe('#edebe0');
  });

  it('blocks non-master selection when master-first mode is enabled', () => {
    const regularTenant = (
      component as unknown as {
        tenants: () => readonly { type: string }[];
      }
    )
      .tenants()
      .find((tenant) => tenant.type.toLowerCase() === 'regular');

    expect(regularTenant).toBeDefined();
    (component as unknown as { selectTenant: (tenant: unknown) => void }).selectTenant(
      regularTenant,
    );

    const selectedAfter = (
      component as unknown as { selectedTenant: () => { uuid?: string } | null }
    ).selectedTenant();
    expect(selectedAfter?.uuid).toBe('uuid-master');

    const info = (component as unknown as { actionInfo: () => string | null }).actionInfo();
    expect(info).toContain('Master-tenant-first mode is enabled');
  });

  it('updates currentBranding when branding studio emits brandingSaved', () => {
    const updatedBranding: TenantBranding = {
      ...defaultBranding,
      primaryColor: '#054239',
      updatedAt: '2026-03-04T01:00:00Z',
    };

    (
      component as unknown as { onBrandingSaved: (branding: TenantBranding) => void }
    ).onBrandingSaved(updatedBranding);

    const currentBranding = (
      component as unknown as { currentBranding: () => TenantBranding | null }
    ).currentBranding();
    expect(currentBranding?.primaryColor).toBe('#054239');
  });

  it('passes tenant scope and branding to BrandingStudio on branding tab', () => {
    (component as unknown as { onTabChange: (value: unknown) => void }).onTabChange('branding');
    fixture.detectChanges();

    const studioDebugEl = fixture.debugElement.query(By.directive(BrandingStudioComponent));
    expect(studioDebugEl).toBeTruthy();

    const studio = studioDebugEl.componentInstance as BrandingStudioComponent;
    expect(studio.tenantId()).toBe('uuid-master');
    expect(studio.initialBranding()?.primaryColor).toBe('#428177');
  });

  it('clears currentBranding when branding request fails', () => {
    apiStub.getTenantBranding.mockReturnValueOnce(throwError(() => new Error('boom')));
    (component as unknown as { loadTenants: () => void }).loadTenants();
    fixture.detectChanges();

    const currentBranding = (
      component as unknown as { currentBranding: () => TenantBranding | null }
    ).currentBranding();
    expect(currentBranding).toBeNull();
  });
});
