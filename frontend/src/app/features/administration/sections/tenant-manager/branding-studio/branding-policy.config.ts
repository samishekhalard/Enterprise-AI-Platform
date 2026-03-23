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

const FOREST_PALETTE = [
  { label: 'Forest', value: '#428177' },
  { label: 'Forest Deep', value: '#054239' },
  { label: 'Forest Night', value: '#002623' },
] as const;

const WHEAT_PALETTE = [
  { label: 'Wheat Light', value: '#edebe0' },
  { label: 'Golden Wheat', value: '#b9a779' },
  { label: 'Wheat Deep', value: '#988561' },
] as const;

const CHARCOAL_PALETTE = [
  { label: 'White', value: '#ffffff' },
  { label: 'Charcoal', value: '#3d3a3b' },
  { label: 'Carbon', value: '#161616' },
] as const;

const UMBER_PALETTE = [
  { label: 'Deep Umber', value: '#6b1f2a' },
  { label: 'Umber Dark', value: '#4a151e' },
  { label: 'Umber Night', value: '#260f14' },
] as const;

export const BRANDING_POLICY_PALETTE_GROUPS = [
  { label: 'Forest', options: FOREST_PALETTE },
  { label: 'Golden Wheat', options: WHEAT_PALETTE },
  { label: 'Charcoal', options: CHARCOAL_PALETTE },
  { label: 'Deep Umber', options: UMBER_PALETTE },
] as const;

export const BRANDING_COLOR_FIELD_CONFIGS: readonly BrandingColorFieldConfig[] = [
  {
    key: 'primaryColor',
    label: 'Primary',
    testId: 'branding-primary-color',
    options: FOREST_PALETTE,
  },
  {
    key: 'secondaryColor',
    label: 'Secondary',
    testId: 'branding-secondary-color',
    options: [WHEAT_PALETTE[1], WHEAT_PALETTE[2]],
  },
  {
    key: 'surfaceColor',
    label: 'Surface',
    testId: 'branding-surface-color',
    options: [WHEAT_PALETTE[0]],
  },
  {
    key: 'textColor',
    label: 'Text',
    testId: 'branding-text-color',
    options: CHARCOAL_PALETTE,
  },
  {
    key: 'shadowDarkColor',
    label: 'Shadow Dark',
    testId: 'branding-shadow-dark',
    options: [WHEAT_PALETTE[2], WHEAT_PALETTE[1], CHARCOAL_PALETTE[1], FOREST_PALETTE[1]],
  },
  {
    key: 'shadowLightColor',
    label: 'Shadow Light',
    testId: 'branding-shadow-light',
    options: [CHARCOAL_PALETTE[0], WHEAT_PALETTE[0]],
  },
] as const;

export const BRANDING_PRESET_PATCHES: Readonly<
  Record<BrandingPresetId, Partial<TenantBrandingForm>>
> = {
  neumorph: {
    primaryColor: FOREST_PALETTE[0].value,
    secondaryColor: WHEAT_PALETTE[1].value,
    surfaceColor: WHEAT_PALETTE[0].value,
    textColor: CHARCOAL_PALETTE[1].value,
    cornerRadius: 16,
    buttonDepth: 12,
    shadowIntensity: 80,
    softShadows: true,
    hoverButton: 'lift',
    hoverCard: 'lift',
    hoverInput: 'press',
    hoverNav: 'slide',
    hoverTableRow: 'highlight',
    shadowDarkColor: WHEAT_PALETTE[2].value,
    shadowLightColor: CHARCOAL_PALETTE[0].value,
  },
  aqua: {
    primaryColor: FOREST_PALETTE[1].value,
    secondaryColor: WHEAT_PALETTE[1].value,
    surfaceColor: WHEAT_PALETTE[0].value,
    textColor: CHARCOAL_PALETTE[2].value,
    shadowDarkColor: WHEAT_PALETTE[2].value,
    shadowLightColor: CHARCOAL_PALETTE[0].value,
  },
  sand: {
    primaryColor: WHEAT_PALETTE[1].value,
    secondaryColor: WHEAT_PALETTE[2].value,
    surfaceColor: WHEAT_PALETTE[0].value,
    textColor: CHARCOAL_PALETTE[1].value,
    shadowDarkColor: WHEAT_PALETTE[2].value,
    shadowLightColor: CHARCOAL_PALETTE[0].value,
  },
  slate: {
    primaryColor: CHARCOAL_PALETTE[1].value,
    secondaryColor: FOREST_PALETTE[0].value,
    surfaceColor: WHEAT_PALETTE[0].value,
    textColor: CHARCOAL_PALETTE[2].value,
    shadowDarkColor: WHEAT_PALETTE[2].value,
    shadowLightColor: CHARCOAL_PALETTE[0].value,
  },
} as const;
