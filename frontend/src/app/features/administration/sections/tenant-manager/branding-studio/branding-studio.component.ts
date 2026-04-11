import {
  Component,
  ChangeDetectionStrategy,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
  Type,
} from '@angular/core';
import { CommonModule, NgComponentOutlet } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgIcon } from '@ng-icons/core';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { forkJoin } from 'rxjs';
import { ApiGatewayService } from '../../../../../core/api/api-gateway.service';
import {
  ActiveBrandResolvePayload,
  BrandAssetSummary,
  BrandDraft,
  BrandHistoryItem,
  BrandStarterKitSummary,
  ComponentTokenMap,
  IconLibrarySummary,
  PalettePackSummary,
  TenantBranding,
  TypographyPackSummary,
  UpdateBrandDraftRequest,
} from '../../../../../core/api/models';
import { TenantThemeService } from '../../../../../core/theme/tenant-theme.service';
import { BrandRuntimeService } from '../../../../../core/theme/brand-runtime.service';
import {
  TenantBrandingForm,
  createDefaultBrandingForm,
} from '../../../../administration/models/administration.models';
import {
  CatalogEntry,
  CatalogGroup,
  COMPONENT_CATALOG,
  groupCatalogByCategory,
} from './component-catalog';
import { StyleVariantPickerComponent } from './style-variant-picker.component';
import { GlobalBrandingFormComponent } from './global-branding-form.component';
import {
  BrandStudioPreviewHistorySnapshot,
  BrandStudioPreviewWorkspace,
} from './brand-studio-preview.models';

// Preview component imports
import { ButtonPreviewComponent } from './previews/button-preview.component';
import { CardPreviewComponent } from './previews/card-preview.component';
import { InputTextPreviewComponent } from './previews/inputtext-preview.component';
import { DataTablePreviewComponent } from './previews/datatable-preview.component';
import { TabsPreviewComponent } from './previews/tabs-preview.component';
import { SelectPreviewComponent } from './previews/select-preview.component';
import { SelectButtonPreviewComponent } from './previews/selectbutton-preview.component';
import { TagPreviewComponent } from './previews/tag-preview.component';
import { MessagePreviewComponent } from './previews/message-preview.component';
import { AccordionPreviewComponent } from './previews/accordion-preview.component';
import { CheckboxPreviewComponent } from './previews/checkbox-preview.component';
import { BadgePreviewComponent } from './previews/badge-preview.component';
import { AvatarPreviewComponent } from './previews/avatar-preview.component';
import { PaginatorPreviewComponent } from './previews/paginator-preview.component';
import { ProgressBarPreviewComponent } from './previews/progressbar-preview.component';
import { BreadcrumbPreviewComponent } from './previews/breadcrumb-preview.component';
import { MenuPreviewComponent } from './previews/menu-preview.component';
import { TooltipPreviewComponent } from './previews/tooltip-preview.component';
import { ChipPreviewComponent } from './previews/chip-preview.component';
import { InputNumberPreviewComponent } from './previews/inputnumber-preview.component';
import { LayoutHeaderActionButtonPreviewComponent } from './previews/layout-header-action-button-preview.component';
import { LayoutHeaderSignOutButtonPreviewComponent } from './previews/layout-header-signout-button-preview.component';
import { LayoutAdminDockCardPreviewComponent } from './previews/layout-admin-dock-card-preview.component';
import { LayoutAdminDockItemPreviewComponent } from './previews/layout-admin-dock-item-preview.component';

interface GovernedComponentStateRow {
  readonly state: string;
  readonly primary: string;
  readonly secondary: string;
  readonly destructive: string;
}

interface GovernedStateToken {
  readonly state: string;
  readonly token: string;
}

interface CatalogSelectionCard {
  readonly id: string;
  readonly title: string;
  readonly subtitle: string;
  readonly badge?: string;
}

type WorkspaceSectionId =
  | 'typography'
  | 'colour-system'
  | 'imagery'
  | 'iconography'
  | 'login-page'
  | 'components'
  | 'history';

interface WorkspaceSection {
  readonly id: WorkspaceSectionId;
  readonly label: string;
  readonly description: string;
}

interface TypographyFontOption {
  readonly id: string;
  readonly label: string;
  readonly family: string;
  readonly weights: readonly number[];
  readonly sizeCount: number;
  readonly note: string;
}

interface TypeScalePreset {
  readonly label: string;
  readonly value: number;
}

interface TypeScaleRow {
  readonly label: string;
  readonly sizePx: number;
  readonly sizeRem: string;
}

interface TypographyStyleRow {
  readonly id: string;
  readonly label: string;
  readonly fontId: string;
  readonly color: string;
  readonly sizePx: number;
}

/** Maps catalog entry id to its preview component */
const PREVIEW_MAP: Record<string, Type<unknown>> = {
  button: ButtonPreviewComponent,
  card: CardPreviewComponent,
  inputtext: InputTextPreviewComponent,
  datatable: DataTablePreviewComponent,
  tabs: TabsPreviewComponent,
  select: SelectPreviewComponent,
  selectbutton: SelectButtonPreviewComponent,
  tag: TagPreviewComponent,
  message: MessagePreviewComponent,
  accordion: AccordionPreviewComponent,
  checkbox: CheckboxPreviewComponent,
  badge: BadgePreviewComponent,
  avatar: AvatarPreviewComponent,
  paginator: PaginatorPreviewComponent,
  progressbar: ProgressBarPreviewComponent,
  breadcrumb: BreadcrumbPreviewComponent,
  menu: MenuPreviewComponent,
  tooltip: TooltipPreviewComponent,
  chip: ChipPreviewComponent,
  inputnumber: InputNumberPreviewComponent,
  'layout-header-action-button': LayoutHeaderActionButtonPreviewComponent,
  'layout-header-signout-button': LayoutHeaderSignOutButtonPreviewComponent,
  'layout-admin-dock-card': LayoutAdminDockCardPreviewComponent,
  'layout-admin-dock-item': LayoutAdminDockItemPreviewComponent,
};

const WORKSPACE_SECTIONS: readonly WorkspaceSection[] = [
  {
    id: 'typography',
    label: 'Typography',
    description: 'Choose the approved font system and inspect the reading hierarchy.',
  },
  {
    id: 'colour-system',
    label: 'Color System',
    description: 'Select the starter kit, palette pack, and governed foundation overrides.',
  },
  {
    id: 'imagery',
    label: 'Logos & Imagery',
    description: 'Review logos, favicons, and login background assets.',
  },
  {
    id: 'iconography',
    label: 'Iconography',
    description: 'Control the object-definition icon library for this tenant.',
  },
  {
    id: 'login-page',
    label: 'Login page',
    description: 'Preview how the published brand sweeps into the authentication surface.',
  },
  {
    id: 'components',
    label: 'Components',
    description: 'Test the governed component catalog and preview variants.',
  },
  {
    id: 'history',
    label: 'Publish history',
    description: 'Review published versions and rollback targets.',
  },
] as const;

const APPROVED_TYPOGRAPHY_FONTS: readonly TypographyFontOption[] = [
  {
    id: 'roboto',
    label: 'Roboto',
    family: "'Roboto', 'Segoe UI', sans-serif",
    weights: [300, 400, 500, 700, 900],
    sizeCount: 7,
    note: 'Primary English base font for website content.',
  },
  {
    id: 'inter',
    label: 'Inter',
    family: "'Inter', 'Segoe UI', sans-serif",
    weights: [400, 500, 700, 800],
    sizeCount: 7,
    note: 'Preferred display and interface headline font.',
  },
  {
    id: 'gotham-rounded',
    label: 'Gotham Rounded',
    family: "'Gotham Rounded', 'Nunito', 'Segoe UI', sans-serif",
    weights: [300, 400, 500, 700],
    sizeCount: 7,
    note: 'Current branded rounded tone already available in the platform.',
  },
  {
    id: 'nunito',
    label: 'Nunito',
    family: "'Nunito', 'Segoe UI', sans-serif",
    weights: [400, 600, 700, 800],
    sizeCount: 7,
    note: 'Existing system-adjacent warm sans option.',
  },
  {
    id: 'avenir-next',
    label: 'Avenir Next',
    family: "'Avenir Next', 'Segoe UI', sans-serif",
    weights: [400, 500, 700, 800],
    sizeCount: 7,
    note: 'Sharper editorial alternative for enterprise shells.',
  },
] as const;

const TYPE_SCALE_PRESETS: readonly TypeScalePreset[] = [
  { label: '1.200 - Minor Third', value: 1.2 },
  { label: '1.250 - Major Third', value: 1.25 },
  { label: '1.333 - Perfect Fourth', value: 1.333 },
  { label: '1.414 - Augmented Fourth', value: 1.414 },
] as const;

const BASE_FONT_SIZE_OPTIONS = [14, 16, 18, 20] as const;

@Component({
  selector: 'app-branding-studio',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NgIcon,
    ButtonModule,
    InputTextModule,
    SelectModule,
    TableModule,
    NgComponentOutlet,
    StyleVariantPickerComponent,
    GlobalBrandingFormComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './branding-studio.component.html',
  styleUrl: './branding-studio.component.scss',
})
export class BrandingStudioComponent {
  private readonly api = inject(ApiGatewayService);
  private readonly themeService = inject(TenantThemeService);
  protected readonly brandRuntime = inject(BrandRuntimeService);

  /** Tenant ID to save branding against */
  readonly tenantId = input.required<string>();

  /** Initial branding loaded from API */
  readonly initialBranding = input<TenantBranding | null>(null);

  /** Local fixture mode for direct visual review without auth/bootstrap */
  readonly previewMode = input(false);
  readonly previewWorkspace = input<BrandStudioPreviewWorkspace | null>(null);

  /** Emits when branding is saved successfully */
  readonly brandingSaved = output<TenantBranding>();

  /** Currently selected catalog entry, or 'global' for the global branding form */
  protected readonly selectedEntry = signal<CatalogEntry | 'global'>('global');
  protected readonly activeSection = signal<WorkspaceSectionId>('typography');
  protected readonly approvedTypographyFonts = [...APPROVED_TYPOGRAPHY_FONTS];
  protected readonly typeScalePresets = [...TYPE_SCALE_PRESETS];
  protected readonly baseFontSizeOptions = BASE_FONT_SIZE_OPTIONS.map((size) => ({
    label: `${size} px`,
    value: size,
  }));
  protected readonly typographyRows = signal<TypographyStyleRow[]>([
    { id: 'h1', label: 'H1', fontId: 'inter', color: 'var(--tp-text-dark)', sizePx: 52 },
    { id: 'h2', label: 'H2', fontId: 'inter', color: 'var(--tp-text-dark)', sizePx: 40 },
    { id: 'h3', label: 'H3', fontId: 'inter', color: 'var(--tp-text-dark)', sizePx: 32 },
    { id: 'h4', label: 'H4', fontId: 'inter', color: 'var(--tp-text-dark)', sizePx: 26 },
    { id: 'h5', label: 'H5', fontId: 'roboto', color: 'var(--tp-text-dark)', sizePx: 22 },
    { id: 'h6', label: 'H6', fontId: 'roboto', color: 'var(--tp-text-dark)', sizePx: 18 },
    { id: 'body', label: 'Body text', fontId: 'roboto', color: 'var(--tp-text-dark)', sizePx: 16 },
  ]);
  protected readonly hoveredTypographyRoleId = signal<string | null>(null);
  protected readonly bodyFontId = signal('roboto');
  protected readonly headingFontId = signal('inter');
  protected readonly bodyWeight = signal(400);
  protected readonly headingWeight = signal(800);
  protected readonly baseFontSize = signal(16);
  protected readonly typeScale = signal(1.333);
  protected readonly responsiveMinWidth = signal(767);

  /** Per-component selected variant ID: { button: 'raised', card: 'flat' } */
  protected readonly selectedVariants = signal<Record<string, string>>({});

  /** Search filter for catalog sidebar */
  protected readonly searchQuery = signal('');

  /** User feedback message */
  protected readonly savedMessage = signal('');

  /** Validation violations returned by backend policy */
  protected readonly validationErrors = signal<readonly string[]>([]);

  /** Non-blocking warnings returned by backend policy */
  protected readonly validationWarnings = signal<readonly string[]>([]);

  /** Loading state for save operation */
  protected readonly isSaving = signal(false);
  protected readonly isLoadingStudio = signal(false);
  protected readonly isPublishing = signal(false);

  /** Brand Studio data sources */
  protected readonly draft = signal<BrandDraft | null>(null);
  protected readonly starterKits = signal<readonly BrandStarterKitSummary[]>([]);
  protected readonly palettePacks = signal<readonly PalettePackSummary[]>([]);
  protected readonly typographyPacks = signal<readonly TypographyPackSummary[]>([]);
  protected readonly assets = signal<readonly BrandAssetSummary[]>([]);
  protected readonly iconLibraries = signal<readonly IconLibrarySummary[]>([]);
  protected readonly history = signal<readonly BrandHistoryItem[]>([]);
  private readonly previewSnapshots = signal<Record<string, BrandStudioPreviewHistorySnapshot>>({});
  private readonly loadedPreviewTenantId = signal<string | null>(null);

  /** Current catalog selections */
  protected readonly selectedStarterKitId = signal<string | null>(null);
  protected readonly selectedPalettePackId = signal<string | null>(null);
  protected readonly selectedTypographyPackId = signal<string | null>(null);
  protected readonly selectedIconLibraryId = signal<string | null>(null);
  protected readonly workspaceSections = WORKSPACE_SECTIONS;

  /** Global branding form state */
  protected readonly globalBrandingForm = signal<TenantBrandingForm>(createDefaultBrandingForm());

  /** Computed component token overrides from selected variants */
  protected readonly componentOverrides = computed<ComponentTokenMap>(() => {
    const result: ComponentTokenMap = {};
    const variants = this.selectedVariants();
    for (const [componentId, variantId] of Object.entries(variants)) {
      const entry = COMPONENT_CATALOG.find((e) => e.id === componentId);
      const variant = entry?.styleVariants.find((v) => v.id === variantId);
      if (variant && Object.keys(variant.tokens).length > 0) {
        result[componentId] = variant.tokens as Record<string, unknown>;
      }
    }
    return result;
  });

  /** Catalog entries grouped by category, filtered by search */
  protected readonly catalogByCategory = computed<readonly CatalogGroup[]>(() => {
    const query = this.searchQuery().trim().toLowerCase();
    if (!query) {
      return groupCatalogByCategory();
    }
    const filtered = COMPONENT_CATALOG.filter(
      (entry) =>
        entry.name.toLowerCase().includes(query) ||
        entry.category.toLowerCase().includes(query) ||
        entry.description.toLowerCase().includes(query) ||
        (entry.source ?? 'PrimeNG').toLowerCase().includes(query) ||
        (entry.governance?.owner ?? '').toLowerCase().includes(query) ||
        (entry.governance?.implementationPath ?? '').toLowerCase().includes(query),
    );
    return groupCatalogByCategory(filtered);
  });

  /** Resolve preview component for the selected entry */
  protected readonly previewComponent = computed<Type<unknown> | null>(() => {
    const entry = this.selectedEntry();
    if (entry === 'global') {
      return null;
    }
    return PREVIEW_MAP[entry.id] ?? null;
  });

  /** Check if selected entry is global */
  protected readonly isGlobal = computed(() => this.selectedEntry() === 'global');

  /** The selected CatalogEntry (only valid when not global) */
  protected readonly selectedCatalogEntry = computed<CatalogEntry | null>(() => {
    const entry = this.selectedEntry();
    return entry === 'global' ? null : entry;
  });

  /** Unified library summary for governance visibility */
  protected readonly libraryStats = computed(() => {
    const entries = COMPONENT_CATALOG;
    const used = entries.filter((entry) => entry.usedInEmsist).length;
    const custom = entries.filter((entry) => entry.source === 'CustomLayout').length;
    const primeng = entries.length - custom;
    return {
      total: entries.length,
      used,
      primeng,
      custom,
    };
  });

  /** Canonical UI-state matrix used by design and implementation governance */
  protected readonly governedComponentStates: readonly GovernedComponentStateRow[] = [
    {
      state: 'Default',
      primary: 'Filled action with base elevation.',
      secondary: 'Soft outlined action with neutral text.',
      destructive: 'Soft action with critical border and text.',
    },
    {
      state: 'Hover',
      primary: 'One-level elevated lift and stronger fill.',
      secondary: 'One-level elevated lift without fill swap.',
      destructive: 'One-level elevated lift with stronger critical contrast.',
    },
    {
      state: 'Pressed',
      primary: 'Inset press depth, no vertical translation.',
      secondary: 'Inset press depth, no color jump.',
      destructive: 'Inset press depth, critical contrast maintained.',
    },
    {
      state: 'Disabled',
      primary: 'Reduced opacity, no elevation change.',
      secondary: 'Reduced opacity, no elevation change.',
      destructive: 'Reduced opacity, no emphasis animation.',
    },
    {
      state: 'Focus',
      primary: 'Visible focus ring from semantic token.',
      secondary: 'Visible focus ring from semantic token.',
      destructive: 'Visible focus ring from semantic token.',
    },
  ];

  /** Token references that define state behavior across admin actions */
  protected readonly governedStateTokens: readonly GovernedStateToken[] = [
    { state: 'Default', token: '--nm-elevation-default' },
    { state: 'Hover', token: '--nm-elevation-hover' },
    { state: 'Pressed', token: '--nm-elevation-pressed' },
    { state: 'Radius', token: '--radius-control' },
    { state: 'Focus', token: '--tp-primary / --tp-danger' },
  ];

  protected readonly activeStarterKit = computed(
    () =>
      this.starterKits().find((kit) => kit.starterKitId === this.selectedStarterKitId()) ?? null,
  );

  protected readonly activePalettePack = computed(
    () =>
      this.palettePacks().find((pack) => pack.palettePackId === this.selectedPalettePackId()) ??
      null,
  );

  protected readonly activeTypographyPack = computed(
    () =>
      this.typographyPacks().find(
        (pack) => pack.typographyPackId === this.selectedTypographyPackId(),
      ) ?? null,
  );

  protected readonly activeIconLibrary = computed(
    () =>
      this.iconLibraries().find(
        (library) => library.iconLibraryId === this.selectedIconLibraryId(),
      ) ?? null,
  );

  protected readonly starterKitCards = computed<readonly CatalogSelectionCard[]>(() =>
    this.starterKits().map((kit) => ({
      id: kit.starterKitId,
      title: kit.name,
      subtitle: kit.description || 'Starter kit baseline',
      badge: kit.isDefault ? 'Default' : undefined,
    })),
  );

  protected readonly paletteCards = computed<readonly CatalogSelectionCard[]>(() =>
    this.palettePacks().map((pack) => ({
      id: pack.palettePackId,
      title: pack.name,
      subtitle: `${pack.primary} / ${pack.secondary} / ${pack.surface}`,
      badge: pack.isDefault ? 'Default' : undefined,
    })),
  );

  protected readonly typographyCards = computed<readonly CatalogSelectionCard[]>(() =>
    this.typographyPacks().map((pack) => ({
      id: pack.typographyPackId,
      title: pack.name,
      subtitle: pack.bodyFontFamily,
      badge: pack.isDefault ? 'Default' : undefined,
    })),
  );

  protected readonly activeSectionMeta = computed(
    () => this.workspaceSections.find((section) => section.id === this.activeSection())!,
  );

  protected readonly selectedBodyFont = computed(
    () => this.approvedTypographyFonts.find((font) => font.id === this.bodyFontId())!,
  );

  protected readonly selectedHeadingFont = computed(
    () => this.approvedTypographyFonts.find((font) => font.id === this.headingFontId())!,
  );

  protected readonly bodyWeightOptions = computed(() =>
    this.selectedBodyFont().weights.map((weight) => ({
      label: String(weight),
      value: weight,
    })),
  );

  protected readonly headingWeightOptions = computed(() =>
    this.selectedHeadingFont().weights.map((weight) => ({
      label: String(weight),
      value: weight,
    })),
  );

  protected readonly typeScaleRows = computed<readonly TypeScaleRow[]>(() => {
    const base = this.baseFontSize();
    const scale = this.typeScale();
    const sizes = [
      { label: 'h1', sizePx: base * scale ** 4 },
      { label: 'h2', sizePx: base * scale ** 3 },
      { label: 'h3', sizePx: base * scale ** 2 },
      { label: 'h4', sizePx: base * scale },
      { label: 'h5', sizePx: base },
      { label: 'body', sizePx: base },
      { label: 'small', sizePx: base / scale },
    ];

    return sizes.map((row) => ({
      label: row.label,
      sizePx: Number(row.sizePx.toFixed(1)),
      sizeRem: `${(row.sizePx / 16).toFixed(3)}rem`,
    }));
  });

  protected readonly typographyColorOptions = computed(() => [
    { label: 'Primary Text', value: 'var(--tp-text-dark)' },
    { label: 'Secondary Text', value: 'var(--tp-text)' },
    { label: 'Muted Text', value: 'var(--tp-text-muted)' },
  ]);

  protected readonly typographyTablePt = {
    root: {
      style: {
        border: '1px solid var(--tp-border)',
        borderRadius: 'var(--nm-radius-lg)',
        overflow: 'hidden',
        background: 'var(--tp-surface)',
      },
    },
    table: { style: { width: '100%', tableLayout: 'fixed' } },
    headerCell: {
      style: {
        background: 'color-mix(in srgb, var(--tp-primary) 5%, var(--tp-surface-raised))',
        color: 'var(--tp-text-dark)',
        fontWeight: '600',
        padding: 'var(--tp-space-3) var(--tp-space-3)',
        borderBlockEnd: '2px solid var(--tp-border)',
        fontSize: 'var(--tp-font-xs)',
        textTransform: 'uppercase',
        letterSpacing: '0.04em',
      },
    },
    bodyCell: {
      style: {
        padding: 'var(--tp-space-3) var(--tp-space-3)',
        color: 'var(--tp-text)',
        borderBlockEnd: '1px solid color-mix(in srgb, var(--tp-border) 30%, transparent)',
        verticalAlign: 'top',
      },
    },
    bodyRow: {
      style: {
        transition: 'background 0.15s ease',
      },
    },
  };

  protected readonly currentLogoUrl = computed(
    () =>
      this.globalBrandingForm().logoUrl ||
      this.assets().find((asset) => asset.kind === 'LOGO')?.deliveryUrl ||
      '/assets/images/logo.svg',
  );

  protected readonly currentFaviconUrl = computed(
    () =>
      this.globalBrandingForm().faviconUrl ||
      this.assets().find((asset) => asset.kind === 'FAVICON')?.deliveryUrl ||
      '/favicon.ico',
  );

  protected readonly currentLoginBackgroundUrl = computed(
    () => this.globalBrandingForm().loginBackgroundUrl,
  );

  /** Apply live preview whenever the form changes */
  private readonly _previewEffect = effect(() => {
    const form = this.globalBrandingForm();
    this.themeService.previewBranding(form);
  });

  /** Initialize from initialBranding input when it changes */
  private readonly _initEffect = effect(() => {
    const branding = this.initialBranding();
    if (branding) {
      this._applyBrandingToForm(branding);
      if (!this.draft()) {
        this._restoreVariants(branding.componentTokens ?? {});
      }
    }
  });

  /** Load Brand Studio state when tenant input changes */
  private readonly _tenantEffect = effect(() => {
    const tenantId = this.tenantId();
    if (!tenantId) {
      return;
    }

    if (this.previewMode()) {
      const workspace = this.previewWorkspace();
      if (!workspace || this.loadedPreviewTenantId() === tenantId) {
        return;
      }
      this._loadPreviewWorkspace(workspace);
      this.loadedPreviewTenantId.set(tenantId);
      return;
    }

    this._loadStudioState(tenantId);
  });

  /** Called when the global branding form emits a preview change */
  protected onPreviewChange(): void {
    this.themeService.previewBranding(this.globalBrandingForm());
    this._applyComponentOverrides();
    this._clearValidationFeedback();
  }

  /** Select a style variant for a component */
  protected selectVariant(componentId: string, variantId: string): void {
    this.selectedVariants.update((prev) => ({ ...prev, [componentId]: variantId }));
    this.savedMessage.set('');
    this._clearValidationFeedback();
    // Apply live preview immediately
    // Use setTimeout to let the signal update propagate to the computed
    setTimeout(() => {
      const tokens = this.componentOverrides();
      if (Object.keys(tokens).length > 0) {
        this.themeService.applyComponentTokens(tokens);
      }
    });
  }

  /** Get the currently selected variant ID for a component */
  protected getSelectedVariant(componentId: string): string {
    return this.selectedVariants()[componentId] ?? 'default';
  }

  protected selectStarterKit(starterKitId: string): void {
    this.selectedStarterKitId.set(starterKitId);
    const starterKit = this.starterKits().find((kit) => kit.starterKitId === starterKitId);
    if (starterKit) {
      this.selectPalettePack(starterKit.basePalettePackId);
      this.selectTypographyPack(starterKit.baseTypographyPackId);
    }
    this.savedMessage.set('');
    this._clearValidationFeedback();
  }

  protected selectPalettePack(palettePackId: string): void {
    this.selectedPalettePackId.set(palettePackId);
    this.savedMessage.set('');
    this._clearValidationFeedback();
    this._applyPalettePackToForm(palettePackId);
    this.onPreviewChange();
  }

  protected selectTypographyPack(typographyPackId: string): void {
    this.selectedTypographyPackId.set(typographyPackId);
    this.savedMessage.set('');
    this._clearValidationFeedback();
  }

  protected selectSection(sectionId: WorkspaceSectionId): void {
    this.activeSection.set(sectionId);
  }

  protected isSectionActive(sectionId: WorkspaceSectionId): boolean {
    return this.activeSection() === sectionId;
  }

  protected selectIconLibrary(iconLibraryId: string): void {
    this.selectedIconLibraryId.set(iconLibraryId);
    this.savedMessage.set('');
    this._clearValidationFeedback();
  }

  protected isStarterKitSelected(starterKitId: string): boolean {
    return this.selectedStarterKitId() === starterKitId;
  }

  protected isPalettePackSelected(palettePackId: string): boolean {
    return this.selectedPalettePackId() === palettePackId;
  }

  protected isTypographyPackSelected(typographyPackId: string): boolean {
    return this.selectedTypographyPackId() === typographyPackId;
  }

  protected selectBodyFont(fontId: string): void {
    this.bodyFontId.set(fontId);
    const font = this.approvedTypographyFonts.find((entry) => entry.id === fontId);
    if (font && !font.weights.includes(this.bodyWeight())) {
      this.bodyWeight.set(font.weights[0] ?? 400);
    }
  }

  protected selectHeadingFont(fontId: string): void {
    this.headingFontId.set(fontId);
    const font = this.approvedTypographyFonts.find((entry) => entry.id === fontId);
    if (font && !font.weights.includes(this.headingWeight())) {
      this.headingWeight.set(font.weights[font.weights.length - 1] ?? 700);
    }
  }

  protected updateTypographyRow<K extends keyof TypographyStyleRow>(
    rowId: string,
    key: K,
    value: TypographyStyleRow[K],
  ): void {
    this.typographyRows.update((rows) =>
      rows.map((row) => (row.id === rowId ? { ...row, [key]: value } : row)),
    );
  }

  protected resolveTypographyFontFamily(fontId: string): string {
    return this.approvedTypographyFonts.find((font) => font.id === fontId)?.family ?? "'Roboto', 'Segoe UI', sans-serif";
  }

  protected resolveTypographyFontLabel(fontId: string): string {
    return this.approvedTypographyFonts.find((font) => font.id === fontId)?.label ?? 'Roboto';
  }

  protected showTypographyRolePreview(roleId: string): void {
    this.hoveredTypographyRoleId.set(roleId);
  }

  protected hideTypographyRolePreview(roleId: string): void {
    if (this.hoveredTypographyRoleId() === roleId) {
      this.hoveredTypographyRoleId.set(null);
    }
  }

  protected resolveTypographyPreviewSize(roleId: string): string {
    switch (roleId) {
      case 'h1':
        return '1.953rem';
      case 'h2':
        return '1.563rem';
      case 'h3':
        return '1.25rem';
      case 'h4':
        return '1rem';
      case 'h5':
        return 'var(--tp-font-md)';
      case 'h6':
        return 'var(--tp-font-sm)';
      case 'body':
      default:
        return 'var(--tp-font-md)';
    }
  }

  protected resolveTypographyPreviewWeight(roleId: string): number {
    return roleId === 'body' ? 400 : 700;
  }

  protected isIconLibrarySelected(iconLibraryId: string): boolean {
    return this.selectedIconLibraryId() === iconLibraryId;
  }

  protected saveDraft(): void {
    if (this.previewMode()) {
      this._savePreviewDraft();
      return;
    }

    this.isSaving.set(true);
    this.savedMessage.set('');
    this._clearValidationFeedback();

    this.api.updateTenantBrandDraft(this.tenantId(), this._buildDraftPayload()).subscribe({
      next: (draft) => {
        this.draft.set(draft);
        this.savedMessage.set('Draft saved.');
        this.isSaving.set(false);
      },
      error: () => {
        this.savedMessage.set('Draft save failed. Please try again.');
        this.isSaving.set(false);
      },
    });
  }

  protected validateDraft(): void {
    if (this.previewMode()) {
      this._validatePreviewDraft();
      return;
    }

    this.isSaving.set(true);
    this.savedMessage.set('');
    this._clearValidationFeedback();

    this.api.updateTenantBrandDraft(this.tenantId(), this._buildDraftPayload()).subscribe({
      next: () => {
        this.api.validateTenantBrandDraft(this.tenantId()).subscribe({
          next: (validation) => {
            this.validationErrors.set(validation.violations ?? []);
            this.validationWarnings.set(validation.warnings ?? []);
            this.savedMessage.set(
              validation.valid
                ? 'Draft validated successfully.'
                : 'Draft validation failed. Resolve the listed violations.',
            );
            this.isSaving.set(false);
          },
          error: () => {
            this.savedMessage.set('Draft validation failed. Please try again.');
            this.isSaving.set(false);
          },
        });
      },
      error: () => {
        this.savedMessage.set('Draft save failed before validation.');
        this.isSaving.set(false);
      },
    });
  }

  protected publishBranding(): void {
    if (this.previewMode()) {
      this._publishPreviewBrand();
      return;
    }

    this.isPublishing.set(true);
    this.savedMessage.set('');
    this._clearValidationFeedback();

    this.api.updateTenantBrandDraft(this.tenantId(), this._buildDraftPayload()).subscribe({
      next: () => {
        this.api.validateTenantBrandDraft(this.tenantId()).subscribe({
          next: (validation) => {
            this.validationErrors.set(validation.violations ?? []);
            this.validationWarnings.set(validation.warnings ?? []);

            if (!validation.valid) {
              this.savedMessage.set('Draft validation failed. Resolve the listed violations.');
              this.isPublishing.set(false);
              return;
            }

            this.api.publishTenantBrandDraft(this.tenantId()).subscribe({
              next: (activeBrand) => {
                this.api.getTenantBranding(this.tenantId()).subscribe({
                  next: (branding) => {
                    this._applyBrandingToForm(branding);
                    this.brandRuntime.applyPublishedBrand(activeBrand, branding);
                    this.savedMessage.set('Brand published successfully.');
                    this.isPublishing.set(false);
                    this.brandingSaved.emit(branding);
                    this._loadStudioState(this.tenantId());
                  },
                  error: () => {
                    this.savedMessage.set('Brand published, but refresh failed.');
                    this.isPublishing.set(false);
                  },
                });
              },
              error: () => {
                this.savedMessage.set('Publish failed. Please try again.');
                this.isPublishing.set(false);
              },
            });
          },
          error: () => {
            this.savedMessage.set('Draft validation failed. Please try again.');
            this.isPublishing.set(false);
          },
        });
      },
      error: () => {
        this.savedMessage.set('Draft save failed before publish.');
        this.isPublishing.set(false);
      },
    });
  }

  protected rollbackBrand(profileId: string): void {
    if (this.previewMode()) {
      this._rollbackPreviewBrand(profileId);
      return;
    }

    this.isPublishing.set(true);
    this.savedMessage.set('');

    this.api
      .rollbackTenantBrandProfile(this.tenantId(), { targetBrandProfileId: profileId })
      .subscribe({
        next: (activeBrand) => {
          this.api.getTenantBranding(this.tenantId()).subscribe({
            next: (branding) => {
              this._applyBrandingToForm(branding);
              this.brandRuntime.applyPublishedBrand(activeBrand, branding);
              this.savedMessage.set('Brand rolled back successfully.');
              this.isPublishing.set(false);
              this.brandingSaved.emit(branding);
              this._loadStudioState(this.tenantId());
            },
            error: () => {
              this.savedMessage.set('Rollback completed, but refresh failed.');
              this.isPublishing.set(false);
            },
          });
        },
        error: () => {
          this.savedMessage.set('Rollback failed. Please try again.');
          this.isPublishing.set(false);
        },
      });
  }

  /** Reset all branding to factory defaults */
  protected resetToDefault(): void {
    const defaultStarterKitId =
      this.starterKits().find((kit) => kit.isDefault)?.starterKitId ?? this.selectedStarterKitId();
    const defaultPalettePackId =
      this.palettePacks().find((pack) => pack.isDefault)?.palettePackId ??
      this.selectedPalettePackId();
    const defaultTypographyPackId =
      this.typographyPacks().find((pack) => pack.isDefault)?.typographyPackId ??
      this.selectedTypographyPackId();

    this.globalBrandingForm.set(createDefaultBrandingForm());
    this.selectedVariants.set({});
    this.selectedStarterKitId.set(defaultStarterKitId);
    this.selectedPalettePackId.set(defaultPalettePackId);
    this.selectedTypographyPackId.set(defaultTypographyPackId);
    this.selectedIconLibraryId.set(null);
    this.savedMessage.set('');
    this._clearValidationFeedback();
    if (defaultPalettePackId) {
      this._applyPalettePackToForm(defaultPalettePackId);
    }
    this.onPreviewChange();
  }

  /** Select an entry from the catalog */
  protected selectEntry(entry: CatalogEntry | 'global'): void {
    this.selectedEntry.set(entry);
    this.savedMessage.set('');
    this._clearValidationFeedback();
  }

  /** Check if an entry is currently selected */
  protected isEntrySelected(entry: CatalogEntry): boolean {
    const selected = this.selectedEntry();
    return selected !== 'global' && selected.id === entry.id;
  }

  /** Check if a component has any non-default variant selected */
  protected hasOverrides(componentId: string): boolean {
    const variantId = this.selectedVariants()[componentId];
    return !!variantId && variantId !== 'default';
  }

  protected getEntrySource(entry: CatalogEntry): string {
    return entry.source ?? 'PrimeNG';
  }

  protected getEntryOwner(entry: CatalogEntry): string {
    return entry.governance?.owner ?? 'Design System';
  }

  protected getEntryControlMode(entry: CatalogEntry): string {
    return entry.governance?.controlMode ?? 'PrimeNG Tokens';
  }

  protected getEntryPolicy(entry: CatalogEntry): string {
    return entry.governance?.enforcementPolicy ?? 'Brand Enforcement Policy v1';
  }

  protected getEntryImplementationPath(entry: CatalogEntry): string {
    return entry.governance?.implementationPath ?? 'PrimeNG Theme Preset';
  }

  private _applyComponentOverrides(): void {
    const overrides = this.componentOverrides();
    if (Object.keys(overrides).length > 0) {
      this.themeService.applyComponentTokens(overrides);
    }
  }

  private _buildDraftPayload(): UpdateBrandDraftRequest {
    const form = this.globalBrandingForm();
    return {
      selectedStarterKitId: this.selectedStarterKitId(),
      selectedPalettePackId: this.selectedPalettePackId(),
      selectedTypographyPackId: this.selectedTypographyPackId(),
      selectedIconLibraryId: this.selectedIconLibraryId(),
      manifestOverrides: {
        branding: {
          primaryColor: form.primaryColor,
          secondaryColor: form.secondaryColor,
          surfaceColor: form.surfaceColor,
          textColor: form.textColor,
          shadowDarkColor: form.shadowDarkColor,
          shadowLightColor: form.shadowLightColor,
          logoUrl: form.logoUrl,
          faviconUrl: form.faviconUrl,
          loginBackgroundUrl: form.loginBackgroundUrl,
          cornerRadius: form.cornerRadius,
          buttonDepth: form.buttonDepth,
          shadowIntensity: form.shadowIntensity,
          softShadows: form.softShadows,
          compactNav: form.compactNav,
          hoverButton: form.hoverButton,
          hoverCard: form.hoverCard,
          hoverInput: form.hoverInput,
          hoverNav: form.hoverNav,
          hoverTableRow: form.hoverTableRow,
          componentTokens: this.componentOverrides(),
        },
        components: this.componentOverrides(),
      },
    };
  }

  private _clearValidationFeedback(): void {
    this.validationErrors.set([]);
    this.validationWarnings.set([]);
  }

  private _loadPreviewWorkspace(workspace: BrandStudioPreviewWorkspace): void {
    this.isLoadingStudio.set(false);
    this.savedMessage.set('');
    this._clearValidationFeedback();
    this.draft.set(workspace.draft);
    this.starterKits.set(workspace.starterKits);
    this.palettePacks.set(workspace.palettePacks);
    this.typographyPacks.set(workspace.typographyPacks);
    this.assets.set(workspace.assets);
    this.iconLibraries.set(workspace.iconLibraries);
    this.history.set(workspace.historySnapshots.map((snapshot) => snapshot.historyItem));
    this.previewSnapshots.set(
      Object.fromEntries(
        workspace.historySnapshots.map((snapshot) => [snapshot.brandProfileId, snapshot]),
      ),
    );
    this.selectedStarterKitId.set(
      workspace.draft.selectedStarterKitId ??
        workspace.starterKits.find((kit) => kit.isDefault)?.starterKitId ??
        null,
    );
    this.selectedPalettePackId.set(
      workspace.draft.selectedPalettePackId ??
        workspace.palettePacks.find((pack) => pack.isDefault)?.palettePackId ??
        null,
    );
    this.selectedTypographyPackId.set(
      workspace.draft.selectedTypographyPackId ??
        workspace.typographyPacks.find((pack) => pack.isDefault)?.typographyPackId ??
        null,
    );
    this.selectedIconLibraryId.set(workspace.draft.selectedIconLibraryId);
    this._hydrateFromDraft(workspace.draft);
  }

  private _loadStudioState(tenantId: string): void {
    this.isLoadingStudio.set(true);
    forkJoin({
      draft: this.api.getTenantBrandDraft(tenantId),
      starterKits: this.api.listBrandStarterKits(tenantId),
      palettePacks: this.api.listBrandPalettePacks(tenantId),
      typographyPacks: this.api.listBrandTypographyPacks(tenantId),
      assets: this.api.listTenantBrandAssets(tenantId),
      iconLibraries: this.api.listTenantIconLibraries(tenantId),
      history: this.api.getTenantBrandHistory(tenantId),
    }).subscribe({
      next: ({
        draft,
        starterKits,
        palettePacks,
        typographyPacks,
        assets,
        iconLibraries,
        history,
      }) => {
        this.draft.set(draft);
        this.starterKits.set(starterKits);
        this.palettePacks.set(palettePacks);
        this.typographyPacks.set(typographyPacks);
        this.assets.set(assets);
        this.iconLibraries.set(iconLibraries);
        this.history.set(history);
        this.selectedStarterKitId.set(
          draft.selectedStarterKitId ??
            starterKits.find((kit) => kit.isDefault)?.starterKitId ??
            null,
        );
        this.selectedPalettePackId.set(
          draft.selectedPalettePackId ??
            palettePacks.find((pack) => pack.isDefault)?.palettePackId ??
            null,
        );
        this.selectedTypographyPackId.set(
          draft.selectedTypographyPackId ??
            typographyPacks.find((pack) => pack.isDefault)?.typographyPackId ??
            null,
        );
        this.selectedIconLibraryId.set(draft.selectedIconLibraryId);
        this._hydrateFromDraft(draft);
        this.isLoadingStudio.set(false);
      },
      error: () => {
        this.savedMessage.set('Unable to load Brand Studio workspace.');
        this.isLoadingStudio.set(false);
      },
    });
  }

  private _hydrateFromDraft(draft: BrandDraft): void {
    const overrides = draft.manifestOverrides as Record<string, unknown>;
    const branding = (overrides['branding'] as Partial<TenantBranding> | undefined) ?? {};
    this._applyBrandingToForm(branding);

    const componentTokens =
      (overrides['components'] as ComponentTokenMap | undefined) ?? branding.componentTokens ?? {};
    this._restoreVariants(componentTokens);

    if (!branding.primaryColor && this.selectedPalettePackId()) {
      this._applyPalettePackToForm(this.selectedPalettePackId());
    }
  }

  private _applyBrandingToForm(branding: Partial<TenantBranding>): void {
    this.globalBrandingForm.set({
      primaryColor: branding.primaryColor ?? '#428177',
      secondaryColor: branding.secondaryColor ?? '#988561',
      surfaceColor: branding.surfaceColor ?? '#F2EFE9',
      textColor: branding.textColor ?? '#3d3a3b',
      shadowDarkColor: branding.shadowDarkColor ?? '#988561',
      shadowLightColor: branding.shadowLightColor ?? '#F5E6D0',
      logoUrl: branding.logoUrl ?? '',
      faviconUrl: branding.faviconUrl ?? '',
      loginBackgroundUrl: branding.loginBackgroundUrl ?? '',
      customCss: branding.customCss ?? '',
      cornerRadius: branding.cornerRadius ?? 16,
      buttonDepth: branding.buttonDepth ?? 12,
      shadowIntensity: branding.shadowIntensity ?? 50,
      softShadows: branding.softShadows ?? true,
      compactNav: branding.compactNav ?? false,
      hoverButton: branding.hoverButton ?? 'lift',
      hoverCard: branding.hoverCard ?? 'lift',
      hoverInput: branding.hoverInput ?? 'press',
      hoverNav: branding.hoverNav ?? 'slide',
      hoverTableRow: branding.hoverTableRow ?? 'highlight',
    });
  }

  private _restoreVariants(componentTokens: ComponentTokenMap): void {
    if (!componentTokens || Object.keys(componentTokens).length === 0) {
      this.selectedVariants.set({});
      return;
    }

    const restored: Record<string, string> = {};
    for (const [componentId, savedTokens] of Object.entries(componentTokens)) {
      const entry = COMPONENT_CATALOG.find((catalogEntry) => catalogEntry.id === componentId);
      if (entry) {
        const matchingVariant = entry.styleVariants.find(
          (variant) => JSON.stringify(variant.tokens) === JSON.stringify(savedTokens),
        );
        restored[componentId] = matchingVariant?.id ?? 'default';
      }
    }
    this.selectedVariants.set(restored);
  }

  private _applyPalettePackToForm(palettePackId: string | null): void {
    if (!palettePackId) {
      return;
    }

    const palettePack = this.palettePacks().find((pack) => pack.palettePackId === palettePackId);
    if (!palettePack) {
      return;
    }

    this.globalBrandingForm.update((current) => ({
      ...current,
      primaryColor: palettePack.primary,
      secondaryColor: palettePack.secondary,
      surfaceColor: palettePack.surface,
      textColor: palettePack.text,
      shadowDarkColor: palettePack.primary,
      shadowLightColor: palettePack.surfaceRaised,
    }));
  }

  private _savePreviewDraft(): void {
    this.isSaving.set(true);
    this.savedMessage.set('');
    this._clearValidationFeedback();

    const now = new Date().toISOString();
    const currentDraft = this.draft();
    const nextDraft: BrandDraft = {
      tenantId: this.tenantId(),
      selectedStarterKitId: this.selectedStarterKitId(),
      selectedPalettePackId: this.selectedPalettePackId(),
      selectedTypographyPackId: this.selectedTypographyPackId(),
      selectedIconLibraryId: this.selectedIconLibraryId(),
      manifestOverrides: this._buildDraftPayload().manifestOverrides ?? {},
      updatedAt: now,
      updatedBy: 'preview-user',
      lastValidatedAt: currentDraft?.lastValidatedAt ?? '',
      previewManifest: this._buildPreviewManifest(),
    };

    this.draft.set(nextDraft);
    this.savedMessage.set('Preview draft saved locally.');
    this.isSaving.set(false);
  }

  private _validatePreviewDraft(): void {
    this.isSaving.set(true);
    this.savedMessage.set('');
    this._clearValidationFeedback();

    const violations: string[] = [];
    const warnings: string[] = [];

    if (!this.selectedStarterKitId()) {
      violations.push('Select a starter kit before validation.');
    }
    if (!this.selectedPalettePackId()) {
      violations.push('Select a palette pack before validation.');
    }
    if (!this.selectedTypographyPackId()) {
      violations.push('Select a typography pack before validation.');
    }
    if (!this.selectedIconLibraryId()) {
      warnings.push('No tenant icon library selected. Platform-seeded icons remain active.');
    }
    if (!this.globalBrandingForm().logoUrl.trim()) {
      warnings.push('Logo is using the platform default asset in preview mode.');
    }

    const now = new Date().toISOString();
    this.validationErrors.set(violations);
    this.validationWarnings.set(warnings);
    this.draft.update((current) =>
      current
        ? {
            ...current,
            updatedAt: now,
            lastValidatedAt: now,
            manifestOverrides: this._buildDraftPayload().manifestOverrides ?? {},
            previewManifest: this._buildPreviewManifest(),
          }
        : current,
    );
    this.savedMessage.set(
      violations.length === 0
        ? 'Preview validation passed.'
        : 'Preview validation failed. Resolve the listed violations.',
    );
    this.isSaving.set(false);
  }

  private _publishPreviewBrand(): void {
    this.isPublishing.set(true);
    this.savedMessage.set('');
    this._clearValidationFeedback();

    const now = new Date().toISOString();
    const currentBranding = this._composeCurrentBranding(now);
    const versions = this.history().map((item) => item.profileVersion);
    const nextVersion = (versions.length > 0 ? Math.max(...versions) : 0) + 1;
    const brandProfileId = `brand-profile-preview-${String(nextVersion).padStart(4, '0')}`;
    const activeBrand = this._buildPreviewActiveBrand(brandProfileId, nextVersion, now);
    const historyItem: BrandHistoryItem = {
      brandProfileId,
      profileVersion: nextVersion,
      publishedAt: now,
      publishedBy: 'preview-user',
      rolledBackFromProfileId: '',
      appTitle: this.brandRuntime.appTitle(),
      themeColor: currentBranding.primaryColor,
      starterKitId: this.selectedStarterKitId() ?? '',
      palettePackId: this.selectedPalettePackId() ?? '',
      typographyPackId: this.selectedTypographyPackId() ?? '',
    };

    this.history.update((current) => [historyItem, ...current]);
    this.previewSnapshots.update((current) => ({
      ...current,
      [brandProfileId]: {
        brandProfileId,
        branding: currentBranding,
        activeBrand,
        selectedStarterKitId: this.selectedStarterKitId(),
        selectedPalettePackId: this.selectedPalettePackId(),
        selectedTypographyPackId: this.selectedTypographyPackId(),
        selectedIconLibraryId: this.selectedIconLibraryId(),
        historyItem,
      },
    }));
    this.draft.set({
      tenantId: this.tenantId(),
      selectedStarterKitId: this.selectedStarterKitId(),
      selectedPalettePackId: this.selectedPalettePackId(),
      selectedTypographyPackId: this.selectedTypographyPackId(),
      selectedIconLibraryId: this.selectedIconLibraryId(),
      manifestOverrides: this._buildDraftPayload().manifestOverrides ?? {},
      updatedAt: now,
      updatedBy: 'preview-user',
      lastValidatedAt: now,
      previewManifest: activeBrand.manifest,
    });

    this.brandRuntime.applyPublishedBrand(activeBrand, currentBranding);
    this.brandingSaved.emit(currentBranding);
    this.savedMessage.set('Preview brand published locally.');
    this.isPublishing.set(false);
  }

  private _rollbackPreviewBrand(profileId: string): void {
    this.isPublishing.set(true);
    this.savedMessage.set('');

    const snapshot = this.previewSnapshots()[profileId];
    if (!snapshot) {
      this.savedMessage.set('Rollback target is unavailable in preview mode.');
      this.isPublishing.set(false);
      return;
    }

    this.selectedStarterKitId.set(snapshot.selectedStarterKitId);
    this.selectedPalettePackId.set(snapshot.selectedPalettePackId);
    this.selectedTypographyPackId.set(snapshot.selectedTypographyPackId);
    this.selectedIconLibraryId.set(snapshot.selectedIconLibraryId);
    this._applyBrandingToForm(snapshot.branding);
    this._restoreVariants(snapshot.branding.componentTokens ?? {});
    this.brandRuntime.applyPublishedBrand(snapshot.activeBrand, snapshot.branding);
    this.draft.set({
      tenantId: this.tenantId(),
      selectedStarterKitId: snapshot.selectedStarterKitId,
      selectedPalettePackId: snapshot.selectedPalettePackId,
      selectedTypographyPackId: snapshot.selectedTypographyPackId,
      selectedIconLibraryId: snapshot.selectedIconLibraryId,
      manifestOverrides: {
        branding: snapshot.branding,
        components: snapshot.branding.componentTokens ?? {},
      },
      updatedAt: new Date().toISOString(),
      updatedBy: 'preview-user',
      lastValidatedAt: snapshot.activeBrand.publishedAt,
      previewManifest: snapshot.activeBrand.manifest,
    });
    this.savedMessage.set(`Rolled back to preview version ${snapshot.historyItem.profileVersion}.`);
    this.isPublishing.set(false);
  }

  private _composeCurrentBranding(updatedAt: string): TenantBranding {
    const form = this.globalBrandingForm();
    return {
      primaryColor: form.primaryColor,
      primaryColorDark: form.primaryColor,
      secondaryColor: form.secondaryColor,
      surfaceColor: form.surfaceColor,
      textColor: form.textColor,
      shadowDarkColor: form.shadowDarkColor,
      shadowLightColor: form.shadowLightColor,
      logoUrl: form.logoUrl || '/assets/images/logo.svg',
      logoUrlDark: form.logoUrl || '/assets/images/logo.svg',
      faviconUrl: form.faviconUrl || '/favicon.ico',
      loginBackgroundUrl: form.loginBackgroundUrl,
      customCss: form.customCss,
      cornerRadius: form.cornerRadius,
      buttonDepth: form.buttonDepth,
      shadowIntensity: form.shadowIntensity,
      softShadows: form.softShadows,
      compactNav: form.compactNav,
      hoverButton: form.hoverButton,
      hoverCard: form.hoverCard,
      hoverInput: form.hoverInput,
      hoverNav: form.hoverNav,
      hoverTableRow: form.hoverTableRow,
      componentTokens: this.componentOverrides(),
      updatedAt,
    };
  }

  private _buildPreviewActiveBrand(
    brandProfileId: string,
    profileVersion: number,
    publishedAt: string,
  ): ActiveBrandResolvePayload {
    const branding = this._composeCurrentBranding(publishedAt);
    return {
      brandProfileId,
      manifestVersion: 1,
      profileVersion,
      manifest: {
        metadata: {
          appTitle: `${this.selectedStarterKitId() ? this.activeStarterKit()?.name ?? 'Preview' : 'Preview'} ${this.tenantId()}`,
          themeColor: branding.primaryColor,
          faviconUrl: branding.faviconUrl,
          tenantLabel: this.tenantId(),
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
      },
      publishedAt,
      publishedBy: 'preview-user',
    };
  }

  private _buildPreviewManifest(): Readonly<Record<string, unknown>> {
    return this._buildPreviewActiveBrand(
      this.draft()?.tenantId ?? 'preview-profile',
      this.history().length + 1,
      new Date().toISOString(),
    ).manifest;
  }
}
