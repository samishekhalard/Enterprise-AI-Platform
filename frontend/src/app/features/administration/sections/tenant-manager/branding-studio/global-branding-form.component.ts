import { Component, ChangeDetectionStrategy, model, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectButtonModule } from 'primeng/selectbutton';
import {
  HoverButton,
  HoverCard,
  HoverInput,
  HoverNav,
  HoverTableRow,
} from '../../../../../core/api/models';
import {
  TenantBrandingForm,
  createDefaultBrandingForm,
} from '../../../../administration/models/administration.models';
import {
  BRANDING_COLOR_FIELD_CONFIGS,
  BRANDING_POLICY_PALETTE_GROUPS,
  BRANDING_PRESET_PATCHES,
  BrandingColorFieldKey,
  BrandingPresetId,
} from './branding-policy.config';

@Component({
  selector: 'app-global-branding-form',
  standalone: true,
  imports: [FormsModule, ButtonModule, InputTextModule, SelectButtonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './global-branding-form.component.html',
  styleUrl: './global-branding-form.component.scss',
})
export class GlobalBrandingFormComponent {
  readonly brandingForm = model<TenantBrandingForm>(createDefaultBrandingForm());
  readonly previewChange = output<void>();

  protected readonly colorFieldConfigs = BRANDING_COLOR_FIELD_CONFIGS;
  protected readonly policyPaletteGroups = BRANDING_POLICY_PALETTE_GROUPS;

  protected readonly buttonHoverOptions = [
    { label: 'Lift', value: 'lift' as HoverButton },
    { label: 'Press', value: 'press' as HoverButton },
    { label: 'Glow', value: 'glow' as HoverButton },
    { label: 'None', value: 'none' as HoverButton },
  ];
  protected readonly cardHoverOptions = [
    { label: 'Lift', value: 'lift' as HoverCard },
    { label: 'Glow', value: 'glow' as HoverCard },
    { label: 'None', value: 'none' as HoverCard },
  ];
  protected readonly inputHoverOptions = [
    { label: 'Press', value: 'press' as HoverInput },
    { label: 'Highlight', value: 'highlight' as HoverInput },
    { label: 'None', value: 'none' as HoverInput },
  ];
  protected readonly navHoverOptions = [
    { label: 'Slide', value: 'slide' as HoverNav },
    { label: 'Lift', value: 'lift' as HoverNav },
    { label: 'Highlight', value: 'highlight' as HoverNav },
    { label: 'None', value: 'none' as HoverNav },
  ];
  protected readonly tableRowHoverOptions = [
    { label: 'Highlight', value: 'highlight' as HoverTableRow },
    { label: 'Lift', value: 'lift' as HoverTableRow },
    { label: 'None', value: 'none' as HoverTableRow },
  ];

  protected updateField<K extends keyof TenantBrandingForm>(
    key: K,
    value: TenantBrandingForm[K],
  ): void {
    this.brandingForm.update((current) => ({ ...current, [key]: value }));
    this.previewChange.emit();
  }

  protected selectPaletteColor(field: BrandingColorFieldKey, value: string): void {
    this.updateField(field, value as TenantBrandingForm[BrandingColorFieldKey]);
  }

  protected isPaletteColorSelected(field: BrandingColorFieldKey, value: string): boolean {
    return this.brandingForm()[field] === value;
  }

  protected applyBrandPreset(preset: BrandingPresetId): void {
    const current = this.brandingForm();
    this.brandingForm.set({
      ...current,
      ...BRANDING_PRESET_PATCHES[preset],
    });
    this.previewChange.emit();
  }
}
