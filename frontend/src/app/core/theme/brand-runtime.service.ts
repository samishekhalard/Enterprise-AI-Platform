import { DOCUMENT } from '@angular/common';
import { computed, inject, Injectable, signal } from '@angular/core';
import { ActiveBrandResolvePayload, TenantBranding, TenantResolveResponse } from '../api/models';
import { TenantThemeService } from './tenant-theme.service';

const DEFAULT_LOGO = '/assets/images/logo.svg';
const DEFAULT_FAVICON = '/favicon.ico';
const DEFAULT_APP_TITLE = 'EMSIST';

const DEFAULT_BRANDING: TenantBranding = {
  primaryColor: '#428177',
  primaryColorDark: '#054239',
  secondaryColor: '#988561',
  surfaceColor: '#F2EFE9',
  textColor: '#3d3a3b',
  shadowDarkColor: '#988561',
  shadowLightColor: '#F5E6D0',
  logoUrl: DEFAULT_LOGO,
  logoUrlDark: DEFAULT_LOGO,
  faviconUrl: DEFAULT_FAVICON,
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
  updatedAt: '',
};

@Injectable({
  providedIn: 'root',
})
export class BrandRuntimeService {
  private readonly document = inject(DOCUMENT);
  private readonly themeService = inject(TenantThemeService);

  private readonly activeBrandState = signal<ActiveBrandResolvePayload | null>(null);
  private readonly legacyBrandingState = signal<TenantBranding>(DEFAULT_BRANDING);
  private readonly tenantLabelState = signal(DEFAULT_APP_TITLE);

  readonly activeBrand = this.activeBrandState.asReadonly();
  readonly legacyBranding = this.legacyBrandingState.asReadonly();
  readonly tenantLabel = this.tenantLabelState.asReadonly();

  readonly manifest = computed<Record<string, unknown>>(() =>
    asRecord(this.activeBrandState()?.manifest),
  );
  readonly metadata = computed<Record<string, unknown>>(() =>
    asRecord(this.manifest()['metadata']),
  );
  readonly surfaces = computed<Record<string, unknown>>(() =>
    asRecord(this.manifest()['surfaces']),
  );
  readonly loginSurface = computed<Record<string, unknown>>(() =>
    asRecord(this.surfaces()['login']),
  );
  readonly shellSurface = computed<Record<string, unknown>>(() =>
    asRecord(this.surfaces()['shell']),
  );
  readonly splashSurface = computed<Record<string, unknown>>(() =>
    asRecord(this.surfaces()['splash']),
  );

  readonly appTitle = computed(
    () =>
      asString(this.metadata()['appTitle']) ||
      fallbackAppTitle(this.tenantLabelState()) ||
      DEFAULT_APP_TITLE,
  );
  readonly themeColor = computed(
    () => asString(this.metadata()['themeColor']) || this.legacyBrandingState().primaryColor,
  );
  readonly faviconUrl = computed(
    () =>
      asString(this.metadata()['faviconUrl']) ||
      this.legacyBrandingState().faviconUrl ||
      DEFAULT_FAVICON,
  );
  readonly loginLogoUrl = computed(
    () =>
      asString(this.loginSurface()['logoDarkUrl']) ||
      asString(this.loginSurface()['logoUrl']) ||
      this.legacyBrandingState().logoUrlDark ||
      this.legacyBrandingState().logoUrl ||
      DEFAULT_LOGO,
  );
  readonly shellLogoUrl = computed(
    () =>
      asString(this.shellSurface()['logoUrl']) ||
      this.legacyBrandingState().logoUrl ||
      DEFAULT_LOGO,
  );
  readonly splashLogoUrl = computed(
    () =>
      asString(this.splashSurface()['logoUrl']) ||
      this.legacyBrandingState().logoUrl ||
      DEFAULT_LOGO,
  );
  readonly loginBackgroundUrl = computed(
    () =>
      asString(this.loginSurface()['backgroundUrl']) ||
      this.legacyBrandingState().loginBackgroundUrl ||
      '',
  );

  applyResolvedTenant(response: TenantResolveResponse): void {
    const activeBrand = response.activeBrand ?? null;
    const manifestLegacy = asRecord(asRecord(activeBrand?.manifest)['legacy']);
    const legacyBranding = coerceTenantBranding(
      Object.keys(manifestLegacy).length > 0 ? manifestLegacy : response.branding,
    );
    const tenantLabel =
      response.tenant?.shortName?.trim() || response.tenant?.fullName?.trim() || DEFAULT_APP_TITLE;

    this.activeBrandState.set(activeBrand);
    this.legacyBrandingState.set(legacyBranding);
    this.tenantLabelState.set(tenantLabel);

    this.themeService.applyBranding(legacyBranding);
    this.syncDocumentChrome();
  }

  applyPublishedBrand(
    activeBrand: ActiveBrandResolvePayload,
    legacyBranding: TenantBranding,
  ): void {
    const manifestLegacy = asRecord(asRecord(activeBrand.manifest)['legacy']);

    this.activeBrandState.set(activeBrand);
    this.legacyBrandingState.set(
      Object.keys(manifestLegacy).length > 0
        ? coerceTenantBranding(manifestLegacy)
        : coerceTenantBranding(legacyBranding),
    );

    this.themeService.applyBranding(this.legacyBrandingState());
    this.syncDocumentChrome();
  }

  syncDocumentChrome(): void {
    this.document.title = this.appTitle();
    this._setFavicon(this.faviconUrl());
    this._setThemeColorMeta(this.themeColor());
  }

  private _setFavicon(href: string): void {
    const resolvedHref = href.trim() || DEFAULT_FAVICON;
    const head = this.document.head;
    let iconEl = head.querySelector<HTMLLinkElement>('link[rel="icon"]');
    if (!iconEl) {
      iconEl = this.document.createElement('link');
      iconEl.rel = 'icon';
      head.appendChild(iconEl);
    }
    iconEl.href = resolvedHref;
  }

  private _setThemeColorMeta(color: string): void {
    const head = this.document.head;
    let metaEl = head.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
    if (!metaEl) {
      metaEl = this.document.createElement('meta');
      metaEl.name = 'theme-color';
      head.appendChild(metaEl);
    }
    metaEl.content = color;
  }
}

function coerceTenantBranding(value: unknown): TenantBranding {
  const source = asRecord(value);

  return {
    primaryColor: asString(source['primaryColor']) || DEFAULT_BRANDING.primaryColor,
    primaryColorDark: asString(source['primaryColorDark']) || DEFAULT_BRANDING.primaryColorDark,
    secondaryColor: asString(source['secondaryColor']) || DEFAULT_BRANDING.secondaryColor,
    surfaceColor: asString(source['surfaceColor']) || DEFAULT_BRANDING.surfaceColor,
    textColor: asString(source['textColor']) || DEFAULT_BRANDING.textColor,
    shadowDarkColor: asString(source['shadowDarkColor']) || DEFAULT_BRANDING.shadowDarkColor,
    shadowLightColor: asString(source['shadowLightColor']) || DEFAULT_BRANDING.shadowLightColor,
    logoUrl: asString(source['logoUrl']) || DEFAULT_BRANDING.logoUrl,
    logoUrlDark: asString(source['logoUrlDark']) || asString(source['logoUrl']) || DEFAULT_LOGO,
    faviconUrl: asString(source['faviconUrl']) || DEFAULT_BRANDING.faviconUrl,
    loginBackgroundUrl:
      asString(source['loginBackgroundUrl']) || DEFAULT_BRANDING.loginBackgroundUrl,
    customCss: asString(source['customCss']) || DEFAULT_BRANDING.customCss,
    cornerRadius: asNumber(source['cornerRadius']) ?? DEFAULT_BRANDING.cornerRadius,
    buttonDepth: asNumber(source['buttonDepth']) ?? DEFAULT_BRANDING.buttonDepth,
    shadowIntensity: asNumber(source['shadowIntensity']) ?? DEFAULT_BRANDING.shadowIntensity,
    softShadows: asBoolean(source['softShadows']) ?? DEFAULT_BRANDING.softShadows,
    compactNav: asBoolean(source['compactNav']) ?? DEFAULT_BRANDING.compactNav,
    hoverButton:
      (asString(source['hoverButton']) as TenantBranding['hoverButton']) ||
      DEFAULT_BRANDING.hoverButton,
    hoverCard:
      (asString(source['hoverCard']) as TenantBranding['hoverCard']) || DEFAULT_BRANDING.hoverCard,
    hoverInput:
      (asString(source['hoverInput']) as TenantBranding['hoverInput']) ||
      DEFAULT_BRANDING.hoverInput,
    hoverNav:
      (asString(source['hoverNav']) as TenantBranding['hoverNav']) || DEFAULT_BRANDING.hoverNav,
    hoverTableRow:
      (asString(source['hoverTableRow']) as TenantBranding['hoverTableRow']) ||
      DEFAULT_BRANDING.hoverTableRow,
    componentTokens: asRecord(source['componentTokens']) as TenantBranding['componentTokens'],
    updatedAt: asString(source['updatedAt']) || '',
  };
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function asString(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function asNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function asBoolean(value: unknown): boolean | null {
  return typeof value === 'boolean' ? value : null;
}

function fallbackAppTitle(tenantLabel: string): string {
  const trimmed = tenantLabel.trim();
  return trimmed ? `${trimmed} EMSIST` : DEFAULT_APP_TITLE;
}
