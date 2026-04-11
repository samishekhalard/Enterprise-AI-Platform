import {
  ActiveBrandResolvePayload,
  BrandAssetSummary,
  BrandDraft,
  BrandHistoryItem,
  BrandStarterKitSummary,
  ComponentTokenMap,
  HoverButton,
  HoverCard,
  HoverInput,
  HoverNav,
  HoverTableRow,
  IconLibrarySummary,
  PalettePackSummary,
  TenantBranding,
  TypographyPackSummary,
} from '../../core/api/models';
import {
  BrandStudioPreviewHistorySnapshot,
  BrandStudioPreviewWorkspace,
} from '../administration/sections/tenant-manager/branding-studio/brand-studio-preview.models';

const TENANT_ID = '8f0d43a0-8ccf-4bd1-a92b-2d16c3a71042';
const TENANT_LABEL = 'North Star';
const DEFAULT_LOGO = '/assets/images/logo.svg';
const DEFAULT_FAVICON = '/favicon.ico';

const STARTER_KITS: readonly BrandStarterKitSummary[] = [
  {
    starterKitId: 'starter-kit-aurora',
    name: 'Aurora Canvas',
    description: 'Warm editorial baseline aligned with the current default tenant brand.',
    previewThumbnailAssetId: 'asset-thumb-aurora',
    basePalettePackId: 'palette-aurora',
    baseTypographyPackId: 'typography-gotham-brand',
    isDefault: true,
    status: 'ACTIVE',
  },
  {
    starterKitId: 'starter-kit-federal-black',
    name: 'Federal Black',
    description: 'Operational variant derived from the official UAE core Black palette.',
    previewThumbnailAssetId: 'asset-thumb-black',
    basePalettePackId: 'palette-uae-black',
    baseTypographyPackId: 'typography-editorial',
    isDefault: false,
    status: 'ACTIVE',
  },
];

const PALETTE_PACKS: readonly PalettePackSummary[] = [
  {
    palettePackId: 'palette-aurora',
    name: 'Terra',
    description: 'Current live Terra house palette and default tenant baseline.',
    primary: '#428177',
    secondary: '#988561',
    accent: '#054239',
    surface: '#F2EFE9',
    surfaceRaised: '#F5E6D0',
    text: '#3d3a3b',
    textMuted: '#7a7672',
    border: '#E0DDDA',
    success: '#428177',
    warning: '#988561',
    error: '#ef4444',
    info: '#054239',
    isDefault: true,
    status: 'ACTIVE',
  },
  {
    palettePackId: 'palette-uae-gold',
    name: 'Gold',
    description: 'Official UAE core palette adapted into the semantic brand pack using AEGold 600.',
    primary: '#92722A',
    secondary: '#CBA344',
    accent: '#6C4527',
    surface: '#F2EFE9',
    surfaceRaised: '#FAF8F4',
    text: '#3d3a3b',
    textMuted: '#7A7672',
    border: '#E0DDDA',
    success: '#428177',
    warning: '#988561',
    error: '#ef4444',
    info: '#054239',
    isDefault: false,
    status: 'ACTIVE',
  },
  {
    palettePackId: 'palette-uae-red',
    name: 'Red',
    description: 'Official UAE core palette adapted into the semantic brand pack using AERed 600.',
    primary: '#D83731',
    secondary: '#F47A75',
    accent: '#95231F',
    surface: '#F2EFE9',
    surfaceRaised: '#FAF8F4',
    text: '#3d3a3b',
    textMuted: '#7A7672',
    border: '#E0DDDA',
    success: '#428177',
    warning: '#988561',
    error: '#ef4444',
    info: '#054239',
    isDefault: false,
    status: 'ACTIVE',
  },
  {
    palettePackId: 'palette-uae-green',
    name: 'Green',
    description: 'Official UAE core palette adapted into the semantic brand pack using AEGreen 600.',
    primary: '#3F8E50',
    secondary: '#6FB97F',
    accent: '#2A5133',
    surface: '#F2EFE9',
    surfaceRaised: '#FAF8F4',
    text: '#3d3a3b',
    textMuted: '#7A7672',
    border: '#E0DDDA',
    success: '#428177',
    warning: '#988561',
    error: '#ef4444',
    info: '#054239',
    isDefault: false,
    status: 'ACTIVE',
  },
  {
    palettePackId: 'palette-uae-black',
    name: 'Black',
    description: 'Official UAE core palette adapted into the semantic brand pack using AEBlack 600.',
    primary: '#4B4F58',
    secondary: '#797E86',
    accent: '#232528',
    surface: '#F2EFE9',
    surfaceRaised: '#FAF8F4',
    text: '#3d3a3b',
    textMuted: '#7A7672',
    border: '#E0DDDA',
    success: '#428177',
    warning: '#988561',
    error: '#ef4444',
    info: '#054239',
    isDefault: false,
    status: 'ACTIVE',
  },
];

const TYPOGRAPHY_PACKS: readonly TypographyPackSummary[] = [
  {
    typographyPackId: 'typography-roboto-foundation',
    name: 'Roboto Foundation',
    description: 'Primary English website content font.',
    headingFontFamily: '"Inter", "Segoe UI", sans-serif',
    bodyFontFamily: '"Roboto", "Segoe UI", sans-serif',
    monoFontFamily: '"IBM Plex Mono", monospace',
    fontSourceType: 'APPROVED_LIST',
    isDefault: false,
    status: 'ACTIVE',
  },
  {
    typographyPackId: 'typography-inter-display',
    name: 'Inter Display',
    description: 'Display-led UI pack with Inter emphasis.',
    headingFontFamily: '"Inter", "Segoe UI", sans-serif',
    bodyFontFamily: '"Roboto", "Segoe UI", sans-serif',
    monoFontFamily: '"IBM Plex Mono", monospace',
    fontSourceType: 'APPROVED_LIST',
    isDefault: false,
    status: 'ACTIVE',
  },
  {
    typographyPackId: 'typography-gotham-brand',
    name: 'Gotham Brand',
    description: 'Rounded branded tone using the current in-app Gotham family.',
    headingFontFamily: '"Gotham Rounded", "Segoe UI", sans-serif',
    bodyFontFamily: '"Gotham Rounded", "Segoe UI", sans-serif',
    monoFontFamily: '"IBM Plex Mono", monospace',
    fontSourceType: 'INTERNAL',
    isDefault: true,
    status: 'ACTIVE',
  },
  {
    typographyPackId: 'typography-editorial',
    name: 'Editorial Sans',
    description: 'Sharper sans-serif for denser shell layouts.',
    headingFontFamily: '"Avenir Next", "Segoe UI", sans-serif',
    bodyFontFamily: '"Avenir Next", "Segoe UI", sans-serif',
    monoFontFamily: '"IBM Plex Mono", monospace',
    fontSourceType: 'APPROVED_LIST',
    isDefault: false,
    status: 'ACTIVE',
  },
  {
    typographyPackId: 'typography-nunito-soft',
    name: 'Nunito Soft',
    description: 'Friendly rounded alternative retained from current system adjacency.',
    headingFontFamily: '"Nunito", "Segoe UI", sans-serif',
    bodyFontFamily: '"Nunito", "Segoe UI", sans-serif',
    monoFontFamily: '"IBM Plex Mono", monospace',
    fontSourceType: 'APPROVED_LIST',
    isDefault: false,
    status: 'ACTIVE',
  },
];

const ICON_LIBRARIES: readonly IconLibrarySummary[] = [
  {
    iconLibraryId: 'icon-library-platform-seeded',
    tenantId: TENANT_ID,
    name: 'Seeded Phosphor Object Set',
    description: 'Platform-seeded object-definition icon library for preview review.',
    sourceType: 'PLATFORM_SEEDED',
    version: 1,
    manifest: {
      family: 'Phosphor',
      iconCount: 64,
      categories: ['Organization', 'People', 'Workflow', 'Compliance'],
    },
    createdAt: '2026-03-24T08:15:00.000Z',
    createdBy: 'platform-seed',
  },
];

const ASSETS: readonly BrandAssetSummary[] = [
  {
    assetId: 'brand-asset-logo',
    tenantId: TENANT_ID,
    kind: 'LOGO',
    displayName: 'North Star Primary Logo',
    deliveryUrl: DEFAULT_LOGO,
    mimeType: 'image/svg+xml',
    fileSize: 4200,
    width: 240,
    height: 72,
    createdAt: '2026-03-24T08:15:00.000Z',
    createdBy: 'platform-seed',
  },
  {
    assetId: 'brand-asset-favicon',
    tenantId: TENANT_ID,
    kind: 'FAVICON',
    displayName: 'North Star Favicon',
    deliveryUrl: DEFAULT_FAVICON,
    mimeType: 'image/x-icon',
    fileSize: 1150,
    width: 32,
    height: 32,
    createdAt: '2026-03-24T08:16:00.000Z',
    createdBy: 'platform-seed',
  },
];

const BASE_COMPONENT_TOKENS: ComponentTokenMap = {
  button: {
    root: {
      borderRadius: 'var(--nm-radius)',
    },
  },
  card: {
    root: {
      borderRadius: 'calc(var(--nm-radius) + 6px)',
    },
  },
};

function createBranding(
  overrides: Partial<TenantBranding> & { primaryColor: string; secondaryColor: string },
): TenantBranding {
  return {
    primaryColor: overrides.primaryColor,
    primaryColorDark: overrides.primaryColorDark ?? '#054239',
    secondaryColor: overrides.secondaryColor,
    surfaceColor: overrides.surfaceColor ?? '#F2EFE9',
    textColor: overrides.textColor ?? '#3d3a3b',
    shadowDarkColor: overrides.shadowDarkColor ?? overrides.primaryColor,
    shadowLightColor: overrides.shadowLightColor ?? '#F5E6D0',
    logoUrl: overrides.logoUrl ?? DEFAULT_LOGO,
    logoUrlDark: overrides.logoUrlDark ?? overrides.logoUrl ?? DEFAULT_LOGO,
    faviconUrl: overrides.faviconUrl ?? DEFAULT_FAVICON,
    loginBackgroundUrl: overrides.loginBackgroundUrl ?? '',
    customCss: overrides.customCss ?? '',
    cornerRadius: overrides.cornerRadius ?? 16,
    buttonDepth: overrides.buttonDepth ?? 12,
    shadowIntensity: overrides.shadowIntensity ?? 50,
    softShadows: overrides.softShadows ?? true,
    compactNav: overrides.compactNav ?? false,
    hoverButton: (overrides.hoverButton as HoverButton | undefined) ?? 'lift',
    hoverCard: (overrides.hoverCard as HoverCard | undefined) ?? 'lift',
    hoverInput: (overrides.hoverInput as HoverInput | undefined) ?? 'press',
    hoverNav: (overrides.hoverNav as HoverNav | undefined) ?? 'slide',
    hoverTableRow: (overrides.hoverTableRow as HoverTableRow | undefined) ?? 'highlight',
    componentTokens: overrides.componentTokens ?? BASE_COMPONENT_TOKENS,
    updatedAt: overrides.updatedAt ?? '2026-03-24T08:20:00.000Z',
  };
}

function createManifest(
  branding: TenantBranding,
  title: string,
  tenantLabel: string,
): Readonly<Record<string, unknown>> {
  return {
    metadata: {
      appTitle: title,
      themeColor: branding.primaryColor,
      faviconUrl: branding.faviconUrl,
      tenantLabel,
    },
    surfaces: {
      login: {
        logoUrl: branding.logoUrl,
        logoDarkUrl: branding.logoUrlDark,
        backgroundUrl: branding.loginBackgroundUrl,
      },
      shell: {
        logoUrl: branding.logoUrl,
      },
      splash: {
        logoUrl: branding.logoUrl,
      },
    },
    foundation: {
      palette: {
        primary: branding.primaryColor,
        secondary: branding.secondaryColor,
        surface: branding.surfaceColor,
        text: branding.textColor,
      },
    },
    legacy: branding,
  };
}

function createActiveBrand(
  brandProfileId: string,
  profileVersion: number,
  publishedAt: string,
  publishedBy: string,
  branding: TenantBranding,
  title: string,
): ActiveBrandResolvePayload {
  return {
    brandProfileId,
    manifestVersion: 1,
    profileVersion,
    manifest: createManifest(branding, title, TENANT_LABEL),
    publishedAt,
    publishedBy,
  };
}

function createDraft(
  branding: TenantBranding,
  selectedStarterKitId: string | null,
  selectedPalettePackId: string | null,
  selectedTypographyPackId: string | null,
  selectedIconLibraryId: string | null,
  updatedAt: string,
  lastValidatedAt: string,
): BrandDraft {
  return {
    tenantId: TENANT_ID,
    selectedStarterKitId,
    selectedPalettePackId,
    selectedTypographyPackId,
    selectedIconLibraryId,
    manifestOverrides: {
      branding,
      components: branding.componentTokens ?? {},
    },
    updatedAt,
    updatedBy: 'preview-user',
    lastValidatedAt,
    previewManifest: createManifest(branding, `${TENANT_LABEL} EMSIST`, TENANT_LABEL),
  };
}

function createHistoryItem(
  brandProfileId: string,
  profileVersion: number,
  publishedAt: string,
  publishedBy: string,
  appTitle: string,
  themeColor: string,
  starterKitId: string,
  palettePackId: string,
  typographyPackId: string,
  rolledBackFromProfileId = '',
): BrandHistoryItem {
  return {
    brandProfileId,
    profileVersion,
    publishedAt,
    publishedBy,
    rolledBackFromProfileId,
    appTitle,
    themeColor,
    starterKitId,
    palettePackId,
    typographyPackId,
  };
}

const CURRENT_BRANDING = createBranding({
  primaryColor: '#428177',
  secondaryColor: '#988561',
  surfaceColor: '#F2EFE9',
  textColor: '#3d3a3b',
  shadowDarkColor: '#988561',
  shadowLightColor: '#F5E6D0',
  logoUrl: DEFAULT_LOGO,
  logoUrlDark: '/assets/images/logo.png',
  updatedAt: '2026-03-24T09:10:00.000Z',
});

const PREVIOUS_BRANDING = createBranding({
  primaryColor: '#4B4F58',
  secondaryColor: '#797E86',
  surfaceColor: '#F2EFE9',
  textColor: '#3d3a3b',
  shadowDarkColor: '#232528',
  shadowLightColor: '#FAF8F4',
  logoUrl: DEFAULT_LOGO,
  logoUrlDark: '/assets/images/logo.png',
  cornerRadius: 14,
  buttonDepth: 10,
  compactNav: true,
  updatedAt: '2026-02-28T14:00:00.000Z',
});

const CURRENT_ACTIVE_BRAND = createActiveBrand(
  'brand-profile-0003',
  3,
  '2026-03-24T09:15:00.000Z',
  'brand.owner@northstar.test',
  CURRENT_BRANDING,
  `${TENANT_LABEL} EMSIST`,
);

const PREVIOUS_ACTIVE_BRAND = createActiveBrand(
  'brand-profile-0002',
  2,
  '2026-02-28T14:05:00.000Z',
  'brand.owner@northstar.test',
  PREVIOUS_BRANDING,
  `${TENANT_LABEL} Operations`,
);

const CURRENT_HISTORY_ITEM = createHistoryItem(
  'brand-profile-0003',
  3,
  '2026-03-24T09:15:00.000Z',
  'brand.owner@northstar.test',
  `${TENANT_LABEL} EMSIST`,
  CURRENT_BRANDING.primaryColor,
  'starter-kit-aurora',
  'palette-aurora',
  'typography-gotham-brand',
);

const PREVIOUS_HISTORY_ITEM = createHistoryItem(
  'brand-profile-0002',
  2,
  '2026-02-28T14:05:00.000Z',
  'brand.owner@northstar.test',
  `${TENANT_LABEL} Operations`,
  PREVIOUS_BRANDING.primaryColor,
  'starter-kit-federal-black',
  'palette-uae-black',
  'typography-editorial',
);

export const BRAND_STUDIO_PREVIEW_WORKSPACE: BrandStudioPreviewWorkspace = {
  tenantId: TENANT_ID,
  tenantLabel: TENANT_LABEL,
  initialBranding: CURRENT_BRANDING,
  activeBrand: CURRENT_ACTIVE_BRAND,
  draft: createDraft(
    CURRENT_BRANDING,
    'starter-kit-aurora',
    'palette-aurora',
    'typography-gotham-brand',
    'icon-library-platform-seeded',
    '2026-03-24T09:18:00.000Z',
    '2026-03-24T09:18:00.000Z',
  ),
  starterKits: STARTER_KITS,
  palettePacks: PALETTE_PACKS,
  typographyPacks: TYPOGRAPHY_PACKS,
  assets: ASSETS,
  iconLibraries: ICON_LIBRARIES,
  historySnapshots: [
    {
      brandProfileId: CURRENT_HISTORY_ITEM.brandProfileId,
      branding: CURRENT_BRANDING,
      activeBrand: CURRENT_ACTIVE_BRAND,
      selectedStarterKitId: CURRENT_HISTORY_ITEM.starterKitId,
      selectedPalettePackId: CURRENT_HISTORY_ITEM.palettePackId,
      selectedTypographyPackId: CURRENT_HISTORY_ITEM.typographyPackId,
      selectedIconLibraryId: 'icon-library-platform-seeded',
      historyItem: CURRENT_HISTORY_ITEM,
    },
    {
      brandProfileId: PREVIOUS_HISTORY_ITEM.brandProfileId,
      branding: PREVIOUS_BRANDING,
      activeBrand: PREVIOUS_ACTIVE_BRAND,
      selectedStarterKitId: PREVIOUS_HISTORY_ITEM.starterKitId,
      selectedPalettePackId: PREVIOUS_HISTORY_ITEM.palettePackId,
      selectedTypographyPackId: PREVIOUS_HISTORY_ITEM.typographyPackId,
      selectedIconLibraryId: 'icon-library-platform-seeded',
      historyItem: PREVIOUS_HISTORY_ITEM,
    },
  ],
};
