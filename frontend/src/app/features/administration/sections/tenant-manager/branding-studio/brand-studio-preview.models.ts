import {
  ActiveBrandResolvePayload,
  BrandAssetSummary,
  BrandDraft,
  BrandHistoryItem,
  BrandStarterKitSummary,
  IconLibrarySummary,
  PalettePackSummary,
  TenantBranding,
  TypographyPackSummary,
} from '../../../../../core/api/models';

export interface BrandStudioPreviewHistorySnapshot {
  readonly brandProfileId: string;
  readonly branding: TenantBranding;
  readonly activeBrand: ActiveBrandResolvePayload;
  readonly selectedStarterKitId: string | null;
  readonly selectedPalettePackId: string | null;
  readonly selectedTypographyPackId: string | null;
  readonly selectedIconLibraryId: string | null;
  readonly historyItem: BrandHistoryItem;
}

export interface BrandStudioPreviewWorkspace {
  readonly tenantId: string;
  readonly tenantLabel: string;
  readonly initialBranding: TenantBranding;
  readonly activeBrand: ActiveBrandResolvePayload;
  readonly draft: BrandDraft;
  readonly starterKits: readonly BrandStarterKitSummary[];
  readonly palettePacks: readonly PalettePackSummary[];
  readonly typographyPacks: readonly TypographyPackSummary[];
  readonly assets: readonly BrandAssetSummary[];
  readonly iconLibraries: readonly IconLibrarySummary[];
  readonly historySnapshots: readonly BrandStudioPreviewHistorySnapshot[];
}
