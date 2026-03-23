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
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { ApiGatewayService } from '../../../../../core/api/api-gateway.service';
import {
  ComponentTokenMap,
  TenantBranding,
  UpdateTenantBrandingRequest,
} from '../../../../../core/api/models';
import { TenantThemeService } from '../../../../../core/theme/tenant-theme.service';
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

@Component({
  selector: 'app-branding-studio',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    InputTextModule,
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

  /** Tenant ID to save branding against */
  readonly tenantId = input.required<string>();

  /** Initial branding loaded from API */
  readonly initialBranding = input<TenantBranding | null>(null);

  /** Emits when branding is saved successfully */
  readonly brandingSaved = output<TenantBranding>();

  /** Currently selected catalog entry, or 'global' for the global branding form */
  protected readonly selectedEntry = signal<CatalogEntry | 'global'>('global');

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
    { state: 'Default', token: '--adm-action-shadow-default' },
    { state: 'Hover', token: '--adm-action-shadow-hover' },
    { state: 'Pressed', token: '--adm-action-shadow-pressed' },
    { state: 'Radius', token: '--adm-radius-control' },
    { state: 'Focus', token: '--adm-primary / --adm-danger' },
  ];

  /** Apply live preview whenever the form changes */
  private readonly _previewEffect = effect(() => {
    const form = this.globalBrandingForm();
    this.themeService.previewBranding(form);
  });

  /** Initialize from initialBranding input when it changes */
  private readonly _initEffect = effect(() => {
    const branding = this.initialBranding();
    if (branding) {
      this.globalBrandingForm.set({
        primaryColor: branding.primaryColor ?? '#428177',
        secondaryColor: branding.secondaryColor ?? '#b9a779',
        surfaceColor: branding.surfaceColor ?? '#edebe0',
        textColor: branding.textColor ?? '#3d3a3b',
        shadowDarkColor: branding.shadowDarkColor ?? '#988561',
        shadowLightColor: branding.shadowLightColor ?? '#ffffff',
        logoUrl: branding.logoUrl ?? '',
        faviconUrl: branding.faviconUrl ?? '',
        loginBackgroundUrl: branding.loginBackgroundUrl ?? '',
        fontFamily: branding.fontFamily ?? "'Gotham Rounded', 'Nunito', sans-serif",
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
      // Reconstruct selectedVariants from saved componentTokens by matching token objects
      if (branding.componentTokens && Object.keys(branding.componentTokens).length > 0) {
        const restored: Record<string, string> = {};
        for (const [componentId, savedTokens] of Object.entries(branding.componentTokens)) {
          const entry = COMPONENT_CATALOG.find((e) => e.id === componentId);
          if (entry) {
            const matchingVariant = entry.styleVariants.find(
              (v) => JSON.stringify(v.tokens) === JSON.stringify(savedTokens),
            );
            restored[componentId] = matchingVariant?.id ?? 'default';
          }
        }
        this.selectedVariants.set(restored);
      }
    }
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

  /** Master save: sends both global branding + component token overrides to API */
  protected saveBranding(): void {
    this.isSaving.set(true);
    this.savedMessage.set('');
    this._clearValidationFeedback();

    const payload = this._buildSavePayload();
    this.api.validateTenantBranding(this.tenantId(), payload).subscribe({
      next: (validation) => {
        this.validationErrors.set(validation.violations ?? []);
        this.validationWarnings.set(validation.warnings ?? []);

        if (!validation.valid) {
          this.savedMessage.set('Branding validation failed. Resolve the listed violations.');
          this.isSaving.set(false);
          return;
        }

        this.api
          .updateTenantBranding(
            this.tenantId(),
            validation.normalized as UpdateTenantBrandingRequest,
          )
          .subscribe({
            next: (branding) => {
              this.savedMessage.set('Branding saved successfully.');
              this.isSaving.set(false);
              this.brandingSaved.emit(branding);
            },
            error: () => {
              this.savedMessage.set('Save failed. Please try again.');
              this.isSaving.set(false);
            },
          });
      },
      error: () => {
        this.savedMessage.set('Validation request failed. Please try again.');
        this.isSaving.set(false);
      },
    });
  }

  /** Reset all branding to factory defaults */
  protected resetToDefault(): void {
    this.globalBrandingForm.set(createDefaultBrandingForm());
    this.selectedVariants.set({});
    this.savedMessage.set('');
    this._clearValidationFeedback();
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

  private _buildSavePayload(): UpdateTenantBrandingRequest {
    const form = this.globalBrandingForm();
    return {
      primaryColor: form.primaryColor,
      secondaryColor: form.secondaryColor,
      surfaceColor: form.surfaceColor,
      textColor: form.textColor,
      shadowDarkColor: form.shadowDarkColor,
      shadowLightColor: form.shadowLightColor,
      logoUrl: form.logoUrl,
      faviconUrl: form.faviconUrl,
      loginBackgroundUrl: form.loginBackgroundUrl,
      fontFamily: form.fontFamily,
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
    };
  }

  private _clearValidationFeedback(): void {
    this.validationErrors.set([]);
    this.validationWarnings.set([]);
  }
}
