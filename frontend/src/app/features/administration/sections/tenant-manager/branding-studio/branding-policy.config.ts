import { TenantBrandingForm } from '../../../../administration/models/administration.models';

export type BrandingPresetId = 'aqua' | 'sand' | 'slate' | 'neumorph';

export type BrandingColorFieldKey =
  | 'primaryColor'
  | 'secondaryColor'
  | 'surfaceColor'
  | 'textColor'
  | 'shadowDarkColor'
  | 'shadowLightColor';

export interface PaletteOption {
  readonly label: string;
  readonly value: string;
}

export interface BrandingColorFieldConfig {
  readonly key: BrandingColorFieldKey;
  readonly label: string;
  readonly testId: string;
  readonly options: readonly PaletteOption[];
}

const TERRA_PALETTE = [
  { label: 'Terra Primary', value: '#428177' },
  { label: 'Terra Secondary', value: '#988561' },
  { label: 'Terra Accent', value: '#054239' },
] as const;

const UAE_CORE_PRIMARY_PALETTE = [
  { label: 'AEGold 600', value: '#92722A' },
  { label: 'AERed 600', value: '#D83731' },
  { label: 'AEGreen 600', value: '#3F8E50' },
  { label: 'AEBlack 600', value: '#4B4F58' },
] as const;

const UAE_SECONDARY_TINTS = [
  { label: 'Terra Secondary', value: '#988561' },
  { label: 'AEGold 400', value: '#CBA344' },
  { label: 'AERed 400', value: '#F47A75' },
  { label: 'AEGreen 400', value: '#6FB97F' },
  { label: 'AEBlack 400', value: '#797E86' },
] as const;

const UAE_NEUTRAL_SURFACE_PALETTE = [
  { label: 'Whitely 50', value: '#FFFFFF' },
  { label: 'Whitely 100', value: '#FCFCFC' },
  { label: 'Slate 50', value: '#F8FAFC' },
  { label: 'Slate 100', value: '#F1F5F9' },
  { label: 'AEBlack 50', value: '#F7F7F7' },
] as const;

const UAE_TEXT_PALETTE = [
  { label: 'AEBlack 800', value: '#232528' },
  { label: 'AEBlack 700', value: '#3E4046' },
  { label: 'AEBlack 600', value: '#4B4F58' },
  { label: 'Whitely 100', value: '#FCFCFC' },
] as const;

const SHADOW_DARK_PALETTE = [
  { label: 'Terra Accent', value: '#054239' },
  { label: 'AEGold 800', value: '#6C4527' },
  { label: 'AERed 800', value: '#95231F' },
  { label: 'AEGreen 800', value: '#2A5133' },
  { label: 'AEBlack 800', value: '#232528' },
] as const;

const SHADOW_LIGHT_PALETTE = [
  { label: 'Terra Warm Lift', value: '#F5E6D0' },
  { label: 'Whitely 50', value: '#FFFFFF' },
  { label: 'Whitely 100', value: '#FCFCFC' },
  { label: 'Slate 50', value: '#F8FAFC' },
] as const;

export const BRANDING_POLICY_PALETTE_GROUPS = [
  { label: 'Terra', options: TERRA_PALETTE },
  { label: 'UAE Core', options: UAE_CORE_PRIMARY_PALETTE },
  { label: 'Neutral Environment', options: UAE_NEUTRAL_SURFACE_PALETTE },
] as const;

export const BRANDING_COLOR_FIELD_CONFIGS: readonly BrandingColorFieldConfig[] = [
  {
    key: 'primaryColor',
    label: 'Primary',
    testId: 'branding-primary-color',
    options: [
      ...TERRA_PALETTE,
      ...UAE_CORE_PRIMARY_PALETTE,
    ],
  },
  {
    key: 'secondaryColor',
    label: 'Secondary',
    testId: 'branding-secondary-color',
    options: UAE_SECONDARY_TINTS,
  },
  {
    key: 'surfaceColor',
    label: 'Surface',
    testId: 'branding-surface-color',
    options: UAE_NEUTRAL_SURFACE_PALETTE,
  },
  {
    key: 'textColor',
    label: 'Text',
    testId: 'branding-text-color',
    options: UAE_TEXT_PALETTE,
  },
  {
    key: 'shadowDarkColor',
    label: 'Shadow Dark',
    testId: 'branding-shadow-dark',
    options: SHADOW_DARK_PALETTE,
  },
  {
    key: 'shadowLightColor',
    label: 'Shadow Light',
    testId: 'branding-shadow-light',
    options: SHADOW_LIGHT_PALETTE,
  },
] as const;

export const BRANDING_PRESET_PATCHES: Readonly<
  Record<BrandingPresetId, Partial<TenantBrandingForm>>
> = {
  neumorph: {
    primaryColor: TERRA_PALETTE[0].value,
    secondaryColor: TERRA_PALETTE[1].value,
    surfaceColor: '#F2EFE9',
    textColor: '#3d3a3b',
    cornerRadius: 16,
    buttonDepth: 12,
    shadowIntensity: 80,
    softShadows: true,
    hoverButton: 'lift',
    hoverCard: 'lift',
    hoverInput: 'press',
    hoverNav: 'slide',
    hoverTableRow: 'highlight',
    shadowDarkColor: TERRA_PALETTE[2].value,
    shadowLightColor: SHADOW_LIGHT_PALETTE[0].value,
  },
  aqua: {
    primaryColor: '#3F8E50',
    secondaryColor: '#6FB97F',
    surfaceColor: '#F3FAF4',
    textColor: '#232528',
    shadowDarkColor: '#2A5133',
    shadowLightColor: '#FCFCFC',
  },
  sand: {
    primaryColor: '#92722A',
    secondaryColor: '#CBA344',
    surfaceColor: '#F9F7ED',
    textColor: '#232528',
    shadowDarkColor: '#6C4527',
    shadowLightColor: '#FCFCFC',
  },
  slate: {
    primaryColor: '#4B4F58',
    secondaryColor: '#797E86',
    surfaceColor: '#F7F7F7',
    textColor: '#232528',
    shadowDarkColor: '#232528',
    shadowLightColor: '#FCFCFC',
  },
} as const;
