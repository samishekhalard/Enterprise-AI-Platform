import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { PanelModule } from 'primeng/panel';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { TooltipModule } from 'primeng/tooltip';
import { IconSelectedEvent } from '../../core/icons/icon.model';
import {
  BrandAssetSummary,
  IconLibrarySummary,
  PalettePackSummary,
  TypographyPackSummary,
} from '../../core/api/models';
import { BrandRuntimeService } from '../../core/theme/brand-runtime.service';
import { PageFrameComponent } from '../../layout/page-frame/page-frame.component';
import { IconPickerComponent } from '../../shared/icon-picker/icon-picker.component';
import { BRAND_STUDIO_PREVIEW_WORKSPACE } from './brand-studio-preview.fixtures';

type FontId = 'roboto' | 'inter' | 'gotham-rounded';
type TypographyRoleId = 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'body';
type StudioSectionId =
  | 'typography'
  | 'color-system'
  | 'imagery'
  | 'iconography'
  | 'login-screen';
type LoginBackgroundMode = 'pattern' | 'photo' | 'none';
type LoginLogoVariant = 'light' | 'dark';
type LoginPreviewDevice = 'web' | 'tablet' | 'mobile';

interface TypographyFontOption {
  readonly id: FontId;
  readonly label: string;
  readonly family: string;
}

interface TypographyColorOption {
  readonly label: string;
  readonly cssValue: string;
}

interface TypographyRoleDefinition {
  readonly id: TypographyRoleId;
  readonly label: string;
  readonly previewFontSize: string;
  readonly previewWeight: number;
}

interface TypographyMatrixRow extends TypographyRoleDefinition {
  readonly fontId: FontId;
  readonly colorCssValue: string;
}

interface StudioSection {
  readonly id: StudioSectionId;
  readonly label: string;
}

interface PreviewAssetPanel {
  readonly id: string;
  readonly label: string;
  readonly kind: string;
  readonly asset: BrandAssetSummary | null;
  readonly previewUrl: string;
}

interface LoginEditorOption {
  readonly label: string;
  readonly value: string;
}

interface LoginPatternOption extends LoginEditorOption {
  readonly cssValue: string;
  readonly previewSize: string;
}

interface LoginPreviewDeviceOption {
  readonly id: LoginPreviewDevice;
  readonly label: string;
}

const APPROVED_FONT_OPTIONS: readonly TypographyFontOption[] = [
  {
    id: 'roboto',
    label: 'Roboto',
    family: "'Roboto', 'Segoe UI', sans-serif",
  },
  {
    id: 'inter',
    label: 'Inter',
    family: "'Inter', 'Segoe UI', sans-serif",
  },
  {
    id: 'gotham-rounded',
    label: 'Gotham Rounded',
    family: "'Gotham Rounded', 'Nunito', 'Segoe UI', sans-serif",
  },
] as const;

const SEMANTIC_TEXT_COLOR_OPTIONS: readonly TypographyColorOption[] = [
  {
    label: 'Primary Text',
    cssValue: 'var(--tp-text-dark)',
  },
  {
    label: 'Secondary Text',
    cssValue: 'var(--tp-text)',
  },
  {
    label: 'Muted Text',
    cssValue: 'var(--tp-text-muted)',
  },
] as const;

const TYPOGRAPHY_ROLES: readonly TypographyRoleDefinition[] = [
  {
    id: 'h1',
    label: 'H1',
    previewFontSize: '1.953rem',
    previewWeight: 700,
  },
  {
    id: 'h2',
    label: 'H2',
    previewFontSize: '1.563rem',
    previewWeight: 700,
  },
  {
    id: 'h3',
    label: 'H3',
    previewFontSize: '1.25rem',
    previewWeight: 600,
  },
  {
    id: 'h4',
    label: 'H4',
    previewFontSize: '1rem',
    previewWeight: 600,
  },
  {
    id: 'h5',
    label: 'H5',
    previewFontSize: 'var(--tp-font-md)',
    previewWeight: 600,
  },
  {
    id: 'h6',
    label: 'H6',
    previewFontSize: 'var(--tp-font-sm)',
    previewWeight: 600,
  },
  {
    id: 'body',
    label: 'Body Text',
    previewFontSize: 'var(--tp-font-md)',
    previewWeight: 400,
  },
] as const;

const STUDIO_SECTIONS: readonly StudioSection[] = [
  { id: 'typography', label: 'Typography' },
  { id: 'color-system', label: 'Color System' },
  { id: 'imagery', label: 'Logos & Imagery' },
  { id: 'iconography', label: 'Iconography' },
  { id: 'login-screen', label: 'Login Screen' },
] as const;

const LOGIN_BACKGROUND_MODE_OPTIONS: readonly LoginEditorOption[] = [
  { label: 'Pattern', value: 'pattern' },
  { label: 'Photo', value: 'photo' },
  { label: 'None', value: 'none' },
] as const;

const LOGIN_PATTERN_OPTIONS: readonly LoginPatternOption[] = [
  {
    label: 'Heritage Geometry',
    value: 'heritage-geometry',
    previewSize: '132px 132px',
    cssValue:
      "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120' viewBox='0 0 120 120'%3E%3Cg fill='none' stroke='%23FAF8F5' stroke-width='1.2'%3E%3Cpath d='M60 8L70 30L92 20L82 42L112 60L82 78L92 100L70 90L60 112L50 90L28 100L38 78L8 60L38 42L28 20L50 30Z'/%3E%3Cpath d='M50 30L70 30L82 42L82 78L70 90L50 90L38 78L38 42Z'/%3E%3Cpath d='M60 38L74 60L60 82L46 60Z'/%3E%3Crect x='50' y='50' width='20' height='20' transform='rotate(45 60 60)'/%3E%3Cpath d='M0 0L10 22L22 10Z M120 0L110 22L98 10Z M0 120L10 98L22 110Z M120 120L110 98L98 110Z'/%3E%3Cpath d='M60 0L70 10L60 20L50 10Z M60 100L70 110L60 120L50 110Z M0 60L10 50L20 60L10 70Z M100 60L110 50L120 60L110 70Z'/%3E%3Cpath d='M22 10L38 42 M98 10L82 42 M22 110L38 78 M98 110L82 78'/%3E%3Cpath d='M10 22L42 38 M10 98L42 78 M110 22L78 38 M110 98L78 78'/%3E%3C/g%3E%3C/svg%3E\")",
  },
  {
    label: 'Linked Diamond',
    value: 'linked-diamond',
    previewSize: '104px 104px',
    cssValue:
      "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='96' height='96' viewBox='0 0 96 96'%3E%3Cg fill='none' stroke='%23FAF8F5' stroke-width='1.1'%3E%3Cpath d='M48 8L68 28L48 48L28 28Z'/%3E%3Cpath d='M48 48L68 68L48 88L28 68Z'/%3E%3Cpath d='M8 48L28 28L48 48L28 68Z'/%3E%3Cpath d='M48 48L68 28L88 48L68 68Z'/%3E%3Cpath d='M0 16h16v16H0zM80 16h16v16H80zM0 64h16v16H0zM80 64h16v16H80z'/%3E%3C/g%3E%3C/svg%3E\")",
  },
  {
    label: 'Orbit Grid',
    value: 'orbit-grid',
    previewSize: '148px 148px',
    cssValue:
      "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='112' height='112' viewBox='0 0 112 112'%3E%3Cg fill='none' stroke='%23FAF8F5' stroke-width='1'%3E%3Ccircle cx='28' cy='28' r='12'/%3E%3Ccircle cx='84' cy='28' r='12'/%3E%3Ccircle cx='28' cy='84' r='12'/%3E%3Ccircle cx='84' cy='84' r='12'/%3E%3Cpath d='M28 16h56M28 96h56M16 28v56M96 28v56'/%3E%3Cpath d='M28 40l28 16 28-16M28 72l28-16 28 16'/%3E%3C/g%3E%3C/svg%3E\")",
  },
] as const;

const LOGIN_LOGO_VARIANT_OPTIONS: readonly LoginEditorOption[] = [
  { label: 'White Logo', value: 'light' },
  { label: 'Dark Logo', value: 'dark' },
] as const;

const LOGIN_PREVIEW_DEVICE_OPTIONS: readonly LoginPreviewDeviceOption[] = [
  { id: 'web', label: 'Web' },
  { id: 'tablet', label: 'Tablet' },
  { id: 'mobile', label: 'Mobile' },
] as const;

@Component({
  selector: 'app-brand-studio-preview-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    CheckboxModule,
    DialogModule,
    InputTextModule,
    PanelModule,
    SelectModule,
    TableModule,
    TooltipModule,
    PageFrameComponent,
    IconPickerComponent,
  ],
  templateUrl: './brand-studio-preview.page.html',
  styleUrl: './brand-studio-preview.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BrandStudioPreviewPageComponent {
  protected readonly brandRuntime = inject(BrandRuntimeService);
  protected readonly messageService = inject(MessageService);
  protected readonly previewWorkspace = BRAND_STUDIO_PREVIEW_WORKSPACE;
  protected readonly approvedFonts = [...APPROVED_FONT_OPTIONS];
  protected readonly studioSections = [...STUDIO_SECTIONS];
  protected readonly activeSection = signal<StudioSectionId>('typography');
  protected readonly activeTypographyPack =
    resolveActiveTypographyPack(this.previewWorkspace) ?? null;
  protected readonly palettePacks = [...this.previewWorkspace.palettePacks];
  protected readonly iconLibraries = signal<readonly IconLibrarySummary[]>(
    this.previewWorkspace.iconLibraries,
  );
  protected readonly assets = signal<readonly BrandAssetSummary[]>(this.previewWorkspace.assets);
  protected readonly selectedPalettePackId = signal<string | null>(
    this.previewWorkspace.draft.selectedPalettePackId
      ?? this.previewWorkspace.palettePacks.find((pack) => pack.isDefault)?.palettePackId
      ?? null,
  );
  protected readonly selectedIconLibraryId = signal<string | null>(
    this.previewWorkspace.draft.selectedIconLibraryId
      ?? this.previewWorkspace.iconLibraries[0]?.iconLibraryId
      ?? null,
  );
  protected readonly collapsedIconLibraryIds = signal<Record<string, boolean>>(
    Object.fromEntries(
      this.previewWorkspace.iconLibraries.map((library) => [library.iconLibraryId, true]),
    ) as Record<string, boolean>,
  );
  protected readonly selectedImportedIconLibraryFile = signal<string | null>(null);
  protected readonly isAddLibraryDialogOpen = signal(false);
  protected readonly isAddAssetDialogOpen = signal(false);
  protected readonly isImportDropActive = signal(false);
  protected readonly isAssetDropActive = signal(false);
  protected readonly draftIconLibraryName = signal('');
  protected readonly draftAssetKind = signal<string>('LOGO');
  protected readonly draftAssetLabel = signal('Logo in Light');
  protected readonly selectedImportedAsset = signal<File | null>(null);
  protected readonly collapsedPaletteIds = signal<Record<string, boolean>>(
    Object.fromEntries(
      this.previewWorkspace.palettePacks.map((pack) => [pack.palettePackId, true]),
    ) as Record<string, boolean>,
  );
  protected readonly selectedPreviewIcon = signal('phosphorCubeThin');
  protected readonly loginBackgroundMode = signal<LoginBackgroundMode>('pattern');
  protected readonly loginSelectedPattern = signal<string>('heritage-geometry');
  protected readonly loginLogoVariant = signal<LoginLogoVariant>('light');
  protected readonly loginBackgroundColor = signal<string>(
    this.palettePacks.find((pack) => pack.isDefault)?.primary ?? '#428177',
  );
  protected readonly loginCardColor = signal<string>(
    this.palettePacks.find((pack) => pack.isDefault)?.surface ?? '#f2efe9',
  );
  protected readonly loginTextOnBackgroundColor = signal<string>('#faf8f5');
  protected readonly loginTextOnCardColor = signal<string>(
    this.palettePacks.find((pack) => pack.isDefault)?.text ?? '#3d3a3b',
  );
  protected readonly isLoginBackgroundDialogOpen = signal(false);
  protected readonly selectedLoginBackgroundFile = signal<File | null>(null);
  protected readonly selectedLoginBackgroundFileName = signal<string | null>(null);
  protected readonly isLoginBackgroundDropActive = signal(false);

  protected readonly colorOptions = [...SEMANTIC_TEXT_COLOR_OPTIONS];
  protected readonly loginBackgroundModeOptions = [...LOGIN_BACKGROUND_MODE_OPTIONS];
  protected readonly loginPatternOptions = [...LOGIN_PATTERN_OPTIONS];
  protected readonly loginLogoVariantOptions = [...LOGIN_LOGO_VARIANT_OPTIONS];
  protected readonly loginPreviewDeviceOptions = [...LOGIN_PREVIEW_DEVICE_OPTIONS];
  protected readonly selectedLoginPreviewDevice = signal<LoginPreviewDevice>('web');

  protected readonly typographyRows = signal<TypographyMatrixRow[]>(
    createTypographyRows(this.activeTypographyPack, this.colorOptions),
  );
  protected readonly hoveredRoleId = signal<TypographyRoleId | null>(null);

  protected readonly defaultFontFace = computed(() => {
    const bodyRow = this.typographyRows().find((row) => row.id === 'body');
    return this.resolveFontLabel(bodyRow?.fontId ?? 'gotham-rounded');
  });

  protected readonly selectedPalettePack = computed(
    () =>
      this.palettePacks.find((pack) => pack.palettePackId === this.selectedPalettePackId()) ?? null,
  );
  protected readonly activeIconLibrary = computed(
    () =>
      this.iconLibraries().find(
        (library) => library.iconLibraryId === this.selectedIconLibraryId(),
      ) ?? null,
  );
  protected readonly nextIconLibraryDefaultName = computed(
    () => `Icon Library #${this.iconLibraries().length + 1}`,
  );
  protected readonly currentLogoLightAsset = computed(
    () => this.assets().find((asset) => asset.kind === 'LOGO') ?? null,
  );
  protected readonly currentLogoDarkAsset = computed(
    () => this.assets().find((asset) => asset.kind === 'LOGO_DARK') ?? null,
  );
  protected readonly currentLoginBackgroundAsset = computed(
    () => this.assets().find((asset) => asset.kind === 'LOGIN_BACKGROUND') ?? null,
  );
  protected readonly currentLogoLightUrl = computed(
    () =>
      this.currentLogoLightAsset()?.deliveryUrl ?? this.previewWorkspace.initialBranding.logoUrl,
  );
  protected readonly currentLogoDarkUrl = computed(
    () =>
      this.currentLogoDarkAsset()?.deliveryUrl
      ?? this.previewWorkspace.initialBranding.logoUrlDark
      ?? this.currentLogoLightUrl(),
  );
  protected readonly currentLoginBackgroundUrl = computed(
    () =>
      this.currentLoginBackgroundAsset()?.deliveryUrl
      ?? this.previewWorkspace.initialBranding.loginBackgroundUrl
      ?? '',
  );
  protected readonly assetPanels = computed<readonly PreviewAssetPanel[]>(() => [
    {
      id: 'logo',
      label: 'Logo in Light',
      kind: 'LOGO',
      asset: this.currentLogoLightAsset(),
      previewUrl: this.currentLogoLightUrl(),
    },
    {
      id: 'logo-dark',
      label: 'Logo in Dark',
      kind: 'LOGO_DARK',
      asset: this.currentLogoDarkAsset(),
      previewUrl: this.currentLogoDarkUrl(),
    },
  ]);

  protected readonly defaultPaletteName = computed(
    () =>
      this.palettePacks.find((pack) => pack.isDefault)?.name
      ?? this.selectedPalettePack()?.name
      ?? 'No default palette',
  );
  protected readonly activeLoginLogoUrl = computed(() =>
    this.loginLogoVariant() === 'dark' ? this.currentLogoDarkUrl() : this.currentLogoLightUrl(),
  );
  protected readonly activeLoginPatternCss = computed(
    () =>
      this.loginPatternOptions.find((option) => option.value === this.loginSelectedPattern())
        ?.cssValue
      ?? this.loginPatternOptions[0]?.cssValue
      ?? 'none',
  );
  protected readonly activeLoginPatternSize = computed(
    () =>
      this.loginPatternOptions.find((option) => option.value === this.loginSelectedPattern())
        ?.previewSize
      ?? this.loginPatternOptions[0]?.previewSize
      ?? '120px 120px',
  );
  protected readonly loginBackgroundAssetName = computed(
    () => this.currentLoginBackgroundAsset()?.displayName || 'No uploaded photo',
  );
  protected readonly assetUploadDialogTitle = computed(() => 'Update Logo');

  protected readonly assetUploadButtonLabel = computed(() => 'Upload logo');

  protected readonly assetUploadAccept = computed(() =>
    '.svg,.png',
  );

  protected readonly assetUploadHint = computed(() => 'SVG, PNG up to 2MB');

  protected readonly palettePanelPt = (pack: PalettePackSummary) => ({
    root: {
      style: {
        border: this.isPalettePackSelected(pack.palettePackId)
          ? '1px solid var(--tp-primary)'
          : '1px solid var(--tp-border)',
        borderRadius: 'var(--nm-radius)',
        background: this.isPalettePackSelected(pack.palettePackId)
          ? 'var(--tp-primary-bg)'
          : 'var(--tp-surface-raised)',
        boxShadow: 'none',
        overflow: 'hidden',
      },
    },
    header: {
      style: {
        padding: 'var(--tp-space-3) var(--tp-space-4)',
        background: 'var(--tp-surface)',
        borderBlockEnd: '1px solid var(--tp-border)',
        alignItems: 'start',
      },
    },
    headerActions: {
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--tp-space-2)',
      },
    },
    title: {
      style: {
        flex: '1 1 auto',
        minWidth: '0',
      },
    },
    content: {
      style: {
        padding: 'var(--tp-space-4)',
        background: 'transparent',
      },
    },
    toggleButton: {
      style: {
        width: 'var(--tp-space-8)',
        height: 'var(--tp-space-8)',
      },
    },
  });

  protected readonly iconLibraryPanelPt = (library: IconLibrarySummary) => ({
    root: {
      style: {
        border: this.isIconLibrarySelected(library.iconLibraryId)
          ? '1px solid var(--tp-primary)'
          : '1px solid var(--tp-border)',
        borderRadius: 'var(--nm-radius)',
        background: this.isIconLibrarySelected(library.iconLibraryId)
          ? 'var(--tp-primary-bg)'
          : 'var(--tp-surface-raised)',
        boxShadow: 'none',
        overflow: 'hidden',
      },
    },
    header: {
      style: {
        padding: 'var(--tp-space-3) var(--tp-space-4)',
        background: 'var(--tp-surface)',
        borderBlockEnd: '1px solid var(--tp-border)',
        alignItems: 'start',
      },
    },
    headerActions: {
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--tp-space-2)',
      },
    },
    title: {
      style: {
        flex: '1 1 auto',
        minWidth: '0',
      },
    },
    content: {
      style: {
        padding: 'var(--tp-space-4)',
        background: 'transparent',
      },
    },
    toggleButton: {
      style: {
        width: 'var(--tp-space-8)',
        height: 'var(--tp-space-8)',
      },
    },
  });

  protected readonly assetPanelPt = {
    root: {
      style: {
        border: '1px solid var(--tp-border)',
        borderRadius: 'var(--nm-radius)',
        background: 'var(--tp-surface-raised)',
        boxShadow: 'none',
        overflow: 'hidden',
      },
    },
    header: {
      style: {
        padding: 'var(--tp-space-3) var(--tp-space-4)',
        background: 'var(--tp-surface)',
        borderBlockEnd: '1px solid var(--tp-border)',
        alignItems: 'start',
      },
    },
    title: {
      style: {
        flex: '1 1 auto',
        minWidth: '0',
      },
    },
    content: {
      style: {
        padding: 'var(--tp-space-4)',
        background: 'transparent',
      },
    },
    toggleButton: {
      style: {
        width: 'var(--tp-space-8)',
        height: 'var(--tp-space-8)',
      },
    },
  } as const;

  protected readonly typographyTablePt = {
    root: {
      style: {
        border: '1px solid var(--tp-border)',
        'border-radius': 'var(--nm-radius)',
        overflow: 'hidden',
      },
    },
    table: {
      style: {
        'min-width': '100%',
      },
    },
    headerCell: {
      style: {
        padding: 'var(--tp-space-3) var(--tp-space-4)',
        background: 'var(--tp-surface)',
        color: 'var(--tp-text-dark)',
        'font-size': 'var(--tp-font-sm)',
        'font-weight': '600',
        'border-block-end': '1px solid var(--p-datatable-header-cell-border-color)',
      },
    },
    bodyCell: {
      style: {
        padding: 'var(--tp-space-3) var(--tp-space-4)',
        'vertical-align': 'top',
        'border-block-end': '1px solid var(--p-datatable-body-cell-border-color)',
        color: 'var(--tp-text)',
      },
    },
    bodyRow: {
      style: {
        transition: 'background 0.15s ease',
      },
    },
  } as const;

  protected readonly selectPt = {
    root: {
      style: {
        width: '100%',
        'font-size': 'var(--tp-font-md)',
      },
    },
    label: {
      style: {
        flex: '1 1 auto',
        width: '100%',
        'min-width': '0',
        overflow: 'hidden',
        'font-size': 'var(--tp-font-md)',
      },
    },
    dropdown: {
      style: {
        flex: '0 0 auto',
      },
    },
    option: {
      style: {
        'font-size': 'var(--tp-font-md)',
      },
    },
    optionLabel: {
      style: {
        'font-size': 'var(--tp-font-md)',
      },
    },
  } as const;

  constructor() {
    this.brandRuntime.applyPublishedBrand(
      this.previewWorkspace.activeBrand,
      this.previewWorkspace.initialBranding,
    );
  }

  protected setActiveSection(sectionId: StudioSectionId): void {
    this.activeSection.set(sectionId);
  }

  protected setLoginPreviewDevice(device: LoginPreviewDevice): void {
    this.selectedLoginPreviewDevice.set(device);
  }

  protected setLoginBackgroundMode(mode: string): void {
    if (mode === 'pattern' || mode === 'photo' || mode === 'none') {
      this.loginBackgroundMode.set(mode);
    }
  }

  protected setLoginLogoVariant(variant: string): void {
    if (variant === 'light' || variant === 'dark') {
      this.loginLogoVariant.set(variant);
    }
  }

  protected getAssetsByKind(kind: string): readonly BrandAssetSummary[] {
    return this.assets().filter((asset) => asset.kind === kind);
  }

  protected loginPreviewBackground(): string {
    const backgroundUrl = this.currentLoginBackgroundUrl();
    return backgroundUrl
      ? `linear-gradient(rgba(255,255,255,0.42), rgba(255,255,255,0.16)), url(${backgroundUrl})`
      : 'radial-gradient(circle at top right, color-mix(in srgb, var(--tp-primary) 20%, transparent), transparent 42%), linear-gradient(135deg, var(--tp-surface-raised), var(--tp-surface))';
  }

  protected loginPreviewStyles(): Record<string, string> {
    const background = this.loginBackgroundColor();
    const cardBg = this.loginCardColor();
    const textOnBackground = this.loginTextOnBackgroundColor();
    const textOnCard = this.loginTextOnCardColor();
    const textSecondary = `color-mix(in srgb, ${textOnBackground} 82%, transparent)`;
    const textMuted = `color-mix(in srgb, ${textOnBackground} 64%, transparent)`;
    const cardTextSecondary = `color-mix(in srgb, ${textOnCard} 72%, transparent)`;
    const patternOpacity = '0.15';
    const photoOpacity = '0.14';
    const cardBorder = `1px solid color-mix(in srgb, ${textOnCard} 14%, transparent)`;
    const shadow = '12px 12px 22px color-mix(in srgb, var(--tp-primary-dark) 32%, transparent)';

    return {
      '--login-preview-bg': background,
      '--login-preview-panel-bg': cardBg,
      '--login-preview-text-primary': textOnBackground,
      '--login-preview-text-secondary': textSecondary,
      '--login-preview-text-muted': textMuted,
      '--login-preview-card-text-primary': textOnCard,
      '--login-preview-card-text-secondary': cardTextSecondary,
      '--login-preview-pattern-opacity':
        this.loginBackgroundMode() === 'pattern' ? patternOpacity : '0',
      '--login-preview-photo-opacity':
        this.loginBackgroundMode() === 'photo' ? photoOpacity : '0',
      '--login-preview-card-border': cardBorder,
      '--login-preview-card-shadow': shadow,
      '--login-preview-form-shadow': shadow,
      '--login-preview-button-bg': background,
    };
  }

  protected openLoginBackgroundDialog(): void {
    this.selectedLoginBackgroundFile.set(null);
    this.selectedLoginBackgroundFileName.set(null);
    this.isLoginBackgroundDropActive.set(false);
    this.isLoginBackgroundDialogOpen.set(true);
  }

  protected closeLoginBackgroundDialog(): void {
    this.isLoginBackgroundDialogOpen.set(false);
    this.isLoginBackgroundDropActive.set(false);
    this.selectedLoginBackgroundFile.set(null);
  }

  protected onLoginBackgroundSelected(event: Event): void {
    const input = event.target as HTMLInputElement | null;
    const file = input?.files?.item(0) ?? null;
    this.selectedLoginBackgroundFile.set(file);
    this.selectedLoginBackgroundFileName.set(file?.name ?? null);
  }

  protected onLoginBackgroundDragOver(event: DragEvent): void {
    event.preventDefault();
    this.isLoginBackgroundDropActive.set(true);
  }

  protected onLoginBackgroundDragLeave(event: DragEvent): void {
    event.preventDefault();
    this.isLoginBackgroundDropActive.set(false);
  }

  protected onLoginBackgroundDrop(event: DragEvent): void {
    event.preventDefault();
    this.isLoginBackgroundDropActive.set(false);
    const file = event.dataTransfer?.files?.item(0) ?? null;
    if (!file) {
      return;
    }
    this.selectedLoginBackgroundFile.set(file);
    this.selectedLoginBackgroundFileName.set(file.name);
  }

  protected submitLoginBackground(): void {
    const file = this.selectedLoginBackgroundFile();
    if (!file) {
      this.messageService.add({
        severity: 'warn',
        summary: 'No photo selected',
        detail: 'Choose or drop a background photo before submitting.',
      });
      return;
    }

    const extension = file.name.split('.').pop()?.toLowerCase() ?? '';
    const isAllowed = ['png', 'jpg', 'jpeg', 'gif'].includes(extension);
    if (!isAllowed) {
      this.messageService.add({
        severity: 'error',
        summary: 'Unsupported file type',
        detail: 'Background photo must be PNG, JPG, JPEG, or GIF.',
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      this.messageService.add({
        severity: 'error',
        summary: 'File too large',
        detail: 'Background photo must be 5MB or smaller.',
      });
      return;
    }

    this.assets.update((assets) => [
      {
        assetId: `brand-asset-preview-bg-${this.assets().length + 1}`,
        tenantId: this.previewWorkspace.tenantId,
        kind: 'LOGIN_BACKGROUND',
        displayName: file.name,
        deliveryUrl: URL.createObjectURL(file),
        mimeType: file.type || 'application/octet-stream',
        fileSize: file.size,
        width: 0,
        height: 0,
        createdAt: new Date().toISOString(),
        createdBy: 'preview-user',
      },
      ...assets.filter((asset) => asset.kind !== 'LOGIN_BACKGROUND'),
    ]);

    this.loginBackgroundMode.set('photo');
    this.messageService.add({
      severity: 'success',
      summary: 'Background photo staged',
      detail: `${file.name} is now used in the login preview.`,
    });
    this.closeLoginBackgroundDialog();
  }

  protected resetLoginBackground(): void {
    this.assets.update((assets) => assets.filter((asset) => asset.kind !== 'LOGIN_BACKGROUND'));
    this.loginBackgroundMode.set('pattern');
    this.messageService.add({
      severity: 'success',
      summary: 'Background reset',
      detail: 'Login background returned to the system pattern.',
    });
  }

  protected selectPalettePack(palettePackId: string): void {
    this.selectedPalettePackId.set(palettePackId);
  }

  protected selectIconLibrary(iconLibraryId: string): void {
    this.selectedIconLibraryId.set(iconLibraryId);
  }

  protected isIconLibraryCollapsed(iconLibraryId: string): boolean {
    return this.collapsedIconLibraryIds()[iconLibraryId] ?? true;
  }

  protected setIconLibraryCollapsed(iconLibraryId: string, collapsed: boolean | undefined): void {
    this.collapsedIconLibraryIds.update((state) => ({
      ...state,
      [iconLibraryId]: collapsed ?? true,
    }));
  }

  protected isPalettePackCollapsed(palettePackId: string): boolean {
    return this.collapsedPaletteIds()[palettePackId] ?? true;
  }

  protected setPalettePackCollapsed(palettePackId: string, collapsed: boolean | undefined): void {
    this.collapsedPaletteIds.update((state) => ({
      ...state,
      [palettePackId]: collapsed ?? true,
    }));
  }

  protected updateTypographyRow(
    rowId: TypographyRoleId,
    field: 'fontId' | 'color',
    value: string | null,
  ): void {
    this.typographyRows.update((rows) =>
      rows.map((row) => {
        if (row.id !== rowId) {
          return row;
        }

        return field === 'fontId'
          ? {
              ...row,
              fontId:
                (value as FontId | null)
                ?? resolveDefaultFontId(rowId, this.activeTypographyPack),
            }
          : {
              ...row,
              colorCssValue: value ?? resolveDefaultTextColor(rowId, this.colorOptions),
            };
      }),
    );
  }

  protected resolveFontFamily(fontId: FontId): string {
    return APPROVED_FONT_OPTIONS.find((font) => font.id === fontId)?.family
      ?? APPROVED_FONT_OPTIONS[0].family;
  }

  protected resolveFontLabel(fontId: FontId): string {
    return APPROVED_FONT_OPTIONS.find((font) => font.id === fontId)?.label
      ?? APPROVED_FONT_OPTIONS[0].label;
  }

  protected showPreview(roleId: TypographyRoleId): void {
    this.hoveredRoleId.set(roleId);
  }

  protected hidePreview(roleId: TypographyRoleId): void {
    if (this.hoveredRoleId() === roleId) {
      this.hoveredRoleId.set(null);
    }
  }

  protected isSectionActive(sectionId: StudioSectionId): boolean {
    return this.activeSection() === sectionId;
  }

  protected isPalettePackSelected(palettePackId: string): boolean {
    return this.selectedPalettePackId() === palettePackId;
  }

  protected isIconLibrarySelected(iconLibraryId: string): boolean {
    return this.selectedIconLibraryId() === iconLibraryId;
  }

  protected onPreviewIconSelected(event: IconSelectedEvent): void {
    this.selectedPreviewIcon.set(event.name);
  }

  protected openAddLibraryDialog(): void {
    this.draftIconLibraryName.set(this.nextIconLibraryDefaultName());
    this.selectedImportedIconLibraryFile.set(null);
    this.isImportDropActive.set(false);
    this.isAddLibraryDialogOpen.set(true);
  }

  protected closeAddLibraryDialog(): void {
    this.isAddLibraryDialogOpen.set(false);
    this.isImportDropActive.set(false);
  }

  protected onIconLibraryImportSelected(event: Event): void {
    const input = event.target as HTMLInputElement | null;
    const file = input?.files?.item(0) ?? null;

    this.selectedImportedIconLibraryFile.set(file?.name ?? null);

    if (file) {
      this.messageService.add({
        severity: 'success',
        summary: 'Icon library staged',
        detail: `${file.name} added to the draft import queue.`,
      });
    }
  }

  protected onImportDragOver(event: DragEvent): void {
    event.preventDefault();
    this.isImportDropActive.set(true);
  }

  protected onImportDragLeave(event: DragEvent): void {
    event.preventDefault();
    this.isImportDropActive.set(false);
  }

  protected onImportDrop(event: DragEvent): void {
    event.preventDefault();
    this.isImportDropActive.set(false);

    const file = event.dataTransfer?.files?.item(0) ?? null;
    if (!file) {
      return;
    }

    this.selectedImportedIconLibraryFile.set(file.name);
    this.messageService.add({
      severity: 'success',
      summary: 'Icon library staged',
      detail: `${file.name} added to the draft import queue.`,
    });
  }

  protected submitImportedIconLibrary(): void {
    const stagedFile = this.selectedImportedIconLibraryFile();
    if (!stagedFile) {
      this.messageService.add({
        severity: 'warn',
        summary: 'No file selected',
        detail: 'Choose an icon library package before submitting.',
      });
      return;
    }

    const name = this.draftIconLibraryName().trim() || this.nextIconLibraryDefaultName();
    const nextLibrary: IconLibrarySummary = {
      iconLibraryId: `icon-library-${Date.now()}`,
      tenantId: this.previewWorkspace.tenantId,
      name,
      description: '',
      sourceType: 'TENANT_IMPORTED',
      version: 1,
      manifest: {
        family: 'Imported',
        iconCount: 0,
        categories: ['Draft import'],
        fileName: stagedFile,
      },
      createdAt: new Date().toISOString(),
      createdBy: 'preview-user',
    };

    this.iconLibraries.update((libraries) => [...libraries, nextLibrary]);
    this.selectedIconLibraryId.set(nextLibrary.iconLibraryId);
    this.collapsedIconLibraryIds.update((state) => ({
      ...state,
      [nextLibrary.iconLibraryId]: false,
    }));
    this.isAddLibraryDialogOpen.set(false);
    this.selectedImportedIconLibraryFile.set(null);
    this.draftIconLibraryName.set('');

    this.messageService.add({
      severity: 'success',
      summary: 'Library added',
      detail: `${name} is now listed in the draft icon libraries.`,
    });
  }

  protected openAddAssetDialog(kind: string, label: string): void {
    this.draftAssetKind.set(kind);
    this.draftAssetLabel.set(label);
    this.selectedImportedAsset.set(null);
    this.isAssetDropActive.set(false);
    this.isAddAssetDialogOpen.set(true);
  }

  protected closeAddAssetDialog(): void {
    this.isAddAssetDialogOpen.set(false);
    this.isAssetDropActive.set(false);
    this.selectedImportedAsset.set(null);
  }

  protected onAssetImportSelected(event: Event): void {
    const input = event.target as HTMLInputElement | null;
    const file = input?.files?.item(0) ?? null;
    this.selectedImportedAsset.set(file);

    if (file) {
      this.messageService.add({
        severity: 'success',
        summary: 'Asset staged',
        detail: `${file.name} added to the draft asset queue.`,
      });
    }
  }

  protected onAssetDragOver(event: DragEvent): void {
    event.preventDefault();
    this.isAssetDropActive.set(true);
  }

  protected onAssetDragLeave(event: DragEvent): void {
    event.preventDefault();
    this.isAssetDropActive.set(false);
  }

  protected onAssetDrop(event: DragEvent): void {
    event.preventDefault();
    this.isAssetDropActive.set(false);

    const file = event.dataTransfer?.files?.item(0) ?? null;
    if (!file) {
      return;
    }

    this.selectedImportedAsset.set(file);
    this.messageService.add({
      severity: 'success',
      summary: 'Asset staged',
      detail: `${file.name} added to the draft asset queue.`,
    });
  }

  protected submitImportedAsset(): void {
    const selectedFile = this.selectedImportedAsset();
    if (!selectedFile) {
      this.messageService.add({
        severity: 'warn',
        summary: 'No file selected',
        detail: 'Choose or drop an asset file before submitting.',
      });
      return;
    }

    const kind = this.draftAssetKind();
    const displayName = selectedFile.name;
    const assetId = `brand-asset-preview-${this.assets().length + 1}`;
    const extension = selectedFile.name.split('.').pop()?.toLowerCase() ?? '';
    const isPng = extension === 'png' || selectedFile.type === 'image/png';
    const isSvg = extension === 'svg' || selectedFile.type === 'image/svg+xml';
    const isIco = extension === 'ico' || selectedFile.type === 'image/x-icon';
    const isLogoUpload = kind === 'LOGO' || kind === 'LOGO_DARK';
    const isAllowed = isLogoUpload ? isPng || isSvg : isPng || isSvg || isIco;
    const maxSize = 2 * 1024 * 1024;

    if (!isAllowed) {
      this.messageService.add({
        severity: 'error',
        summary: 'Unsupported file type',
        detail: 'Logo must be SVG or PNG.',
      });
      return;
    }

    if (selectedFile.size > maxSize) {
      this.messageService.add({
        severity: 'error',
        summary: 'File too large',
        detail: 'Logo must be 2MB or smaller.',
      });
      return;
    }

    const deliveryUrl = URL.createObjectURL(selectedFile);

    this.assets.update((assets) => [
      {
        assetId,
        tenantId: this.previewWorkspace.tenantId,
        kind,
        displayName,
        deliveryUrl,
        mimeType: selectedFile.type || 'application/octet-stream',
        fileSize: selectedFile.size,
        width: 0,
        height: 0,
        createdAt: new Date().toISOString(),
        createdBy: 'preview-user',
      },
      ...assets.filter((asset) => asset.kind !== kind),
    ]);

    this.messageService.add({
      severity: 'success',
      summary: 'Asset added',
      detail: `${displayName} is now staged for ${this.draftAssetLabel().toLowerCase()}.`,
    });

    this.closeAddAssetDialog();
  }

  protected resetAsset(kind: string): void {
    this.assets.update((assets) => assets.filter((asset) => asset.kind !== kind));

    this.messageService.add({
      severity: 'success',
      summary: 'Asset reset',
      detail: 'Logo returned to the system default.',
    });
  }

  protected openIconLibraryFileDialog(input: HTMLInputElement): void {
    input.click();
  }

  protected paletteSwatches(pack: PalettePackSummary): readonly string[] {
    return [
      pack.primary,
      pack.secondary,
      pack.accent,
      pack.surfaceRaised,
      pack.text,
    ];
  }

  protected textOnLight(pack: PalettePackSummary): string {
    return pack.text;
  }

  protected readonly textOnDark = '#FAF8F5';

  protected paletteColorSummary(pack: PalettePackSummary): string {
    return `Primary ${pack.primary} · Secondary ${pack.secondary} · Accent ${pack.accent}`;
  }

  protected colorSummaryTokens(pack: PalettePackSummary): readonly {
    readonly label: string;
    readonly hex: string;
  }[] {
    return [
      { label: 'Primary', hex: pack.primary },
      { label: 'Surface', hex: pack.surface },
      { label: 'Text on Light', hex: this.textOnLight(pack) },
      { label: 'Text on Dark', hex: this.textOnDark },
    ];
  }

  protected colorTooltip(label: string, hex: string): string {
    return `${label} | HEX ${hex.toUpperCase()} | RGB ${this.hexToRgb(hex)}`;
  }

  protected async copyColorHex(event: Event, label: string, hex: string): Promise<void> {
    event.stopPropagation();
    event.preventDefault();

    const normalized = hex.toUpperCase();

    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(normalized);
      } else {
        this.copyTextFallback(normalized);
      }

      this.messageService.add({
        severity: 'success',
        summary: 'Color copied',
        detail: `${label} ${normalized} copied to clipboard.`,
      });
    } catch {
      this.messageService.add({
        severity: 'error',
        summary: 'Copy failed',
        detail: `Unable to copy ${normalized}.`,
      });
    }
  }

  private hexToRgb(hex: string): string {
    const normalized = hex.replace('#', '');
    const value =
      normalized.length === 3
        ? normalized
            .split('')
            .map((char) => `${char}${char}`)
            .join('')
        : normalized;

    const parsed = Number.parseInt(value, 16);
    if (Number.isNaN(parsed)) {
      return 'invalid';
    }

    const r = (parsed >> 16) & 255;
    const g = (parsed >> 8) & 255;
    const b = parsed & 255;
    return `${r}, ${g}, ${b}`;
  }

  private copyTextFallback(value: string): void {
    const textarea = document.createElement('textarea');
    textarea.value = value;
    textarea.setAttribute('readonly', 'true');
    textarea.style.position = 'absolute';
    textarea.style.left = '-9999px';
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
  }

}

function resolveActiveTypographyPack(
  workspace: typeof BRAND_STUDIO_PREVIEW_WORKSPACE,
): TypographyPackSummary | undefined {
  return (
    workspace.typographyPacks.find(
      (pack) => pack.typographyPackId === workspace.draft.selectedTypographyPackId,
    ) ?? workspace.typographyPacks.find((pack) => pack.isDefault)
  );
}

function createTypographyRows(
  activeTypographyPack: TypographyPackSummary | null,
  colorOptions: readonly TypographyColorOption[],
): TypographyMatrixRow[] {
  return TYPOGRAPHY_ROLES.map((role) => ({
    ...role,
    fontId: resolveDefaultFontId(role.id, activeTypographyPack),
    colorCssValue: resolveDefaultTextColor(role.id, colorOptions),
  }));
}

function resolveDefaultFontId(
  roleId: TypographyRoleId,
  activeTypographyPack: TypographyPackSummary | null,
): FontId {
  const headingFontId = resolveFontIdFromFamily(activeTypographyPack?.headingFontFamily);
  const bodyFontId = resolveFontIdFromFamily(activeTypographyPack?.bodyFontFamily);

  return roleId === 'body' ? bodyFontId : headingFontId;
}

function resolveDefaultTextColor(
  roleId: TypographyRoleId,
  colorOptions: readonly TypographyColorOption[],
): string {
  const primaryText = colorOptions[0]?.cssValue ?? 'var(--tp-text-dark)';
  const secondaryText = colorOptions[1]?.cssValue ?? 'var(--tp-text)';
  const mutedText = colorOptions[2]?.cssValue ?? 'var(--tp-text-muted)';

  if (roleId === 'body') {
    return secondaryText;
  }

  if (roleId === 'h6') {
    return mutedText;
  }

  return primaryText;
}

function resolveFontIdFromFamily(fontFamily: string | undefined): FontId {
  const family = (fontFamily ?? '').toLowerCase();

  if (family.includes('gotham')) {
    return 'gotham-rounded';
  }
  if (family.includes('roboto')) {
    return 'roboto';
  }
  return 'gotham-rounded';
}
