/**
 * Unified UI catalog for the Branding Studio.
 * Includes PrimeNG components and custom EMSIST layout controls.
 *
 * Each "used" component offers style variants where applicable.
 * PrimeNG variants use token overrides; custom layout variants can use CSS variables.
 */

export type CatalogCategory =
  | 'Global'
  | 'Form'
  | 'Data'
  | 'Panel'
  | 'Layout'
  | 'Overlay'
  | 'Messages'
  | 'Navigation'
  | 'Media'
  | 'Misc';

export type CatalogSource = 'PrimeNG' | 'CustomLayout';

export interface CatalogGovernance {
  /** Owning module/team responsible for component decisions */
  readonly owner: string;
  /** Primary runtime control mechanism */
  readonly controlMode: 'PrimeNG Tokens' | 'CSS Variables';
  /** Policy identifier enforced for this component */
  readonly enforcementPolicy: string;
  /** Source location for the implementation */
  readonly implementationPath?: string;
}

export interface StyleVariant {
  /** Unique variant ID, e.g. 'raised', 'flat', 'inset', 'ghost' */
  id: string;
  /** Display name, e.g. 'Raised', 'Flat', 'Inset', 'Ghost' */
  name: string;
  /** Short description of the visual treatment */
  description: string;
  /**
   * PrimeNG updatePreset component token overrides.
   * Structure matches: updatePreset({ components: { [componentId]: tokens } })
   */
  tokens: Record<string, unknown>;
  /** CSS custom property overrides applied directly to :root (for neumorphic shadows) */
  cssVars?: Record<string, string>;
}

export interface CatalogEntry {
  readonly id: string;
  readonly name: string;
  readonly category: CatalogCategory;
  /** Defaults to PrimeNG when omitted */
  readonly source?: CatalogSource;
  /** Governance metadata, with defaults resolved in UI when omitted */
  readonly governance?: CatalogGovernance;
  readonly icon: string;
  readonly description: string;
  /** true = actively used in EMSIST, false = disabled in sidebar */
  readonly usedInEmsist: boolean;
  readonly styleVariants: StyleVariant[];
}

export interface CatalogGroup {
  readonly category: CatalogCategory;
  readonly entries: CatalogEntry[];
}

// ============================================================================
// USED COMPONENTS (usedInEmsist: true) — 23 components with 3-4 variants each
// ============================================================================

export const COMPONENT_CATALOG: CatalogEntry[] = [
  // ======== FORM ========

  {
    id: 'button',
    name: 'Button',
    category: 'Form',
    icon: 'phosphorPaperPlaneTiltThin',
    description: 'Clickable action trigger.',
    usedInEmsist: true,
    styleVariants: [
      {
        id: 'default',
        name: 'Default',
        description: 'Standard PrimeNG Aura button style.',
        tokens: {},
        cssVars: {},
      },
      {
        id: 'raised',
        name: 'Raised',
        description: 'Outset neumorphic shadow — button floats above the surface.',
        tokens: {
          root: {
            borderRadius: '12px',
            shadow: '4px 4px 8px var(--nm-shadow-dark), -4px -4px 8px var(--nm-shadow-light)',
          },
        },
        cssVars: {},
      },
      {
        id: 'inset',
        name: 'Inset',
        description: 'Pressed neumorphic style — button sits recessed into the surface.',
        tokens: {
          root: {
            borderRadius: '12px',
            shadow:
              'inset 3px 3px 6px var(--nm-shadow-dark), inset -3px -3px 6px var(--nm-shadow-light)',
            background: 'var(--nm-bg)',
          },
        },
        cssVars: {},
      },
      {
        id: 'flat',
        name: 'Flat',
        description: 'No shadow, clean solid fill.',
        tokens: {
          root: {
            borderRadius: '8px',
            shadow: 'none',
          },
        },
        cssVars: {},
      },
    ],
  },

  {
    id: 'inputtext',
    name: 'InputText',
    category: 'Form',
    icon: 'phosphorPencilSimpleThin',
    description: 'Single-line text input field.',
    usedInEmsist: true,
    styleVariants: [
      {
        id: 'default',
        name: 'Default',
        description: 'Standard PrimeNG input style.',
        tokens: {},
        cssVars: {},
      },
      {
        id: 'raised',
        name: 'Raised',
        description: 'Outset shadow — input floats above the surface.',
        tokens: {
          root: {
            borderRadius: '12px',
            shadow: '3px 3px 6px var(--nm-shadow-dark), -3px -3px 6px var(--nm-shadow-light)',
          },
        },
        cssVars: {},
      },
      {
        id: 'flat',
        name: 'Flat',
        description: 'No shadow, clean bordered input.',
        tokens: {
          root: {
            borderRadius: '8px',
            shadow: 'none',
          },
        },
        cssVars: {},
      },
      {
        id: 'outlined',
        name: 'Outlined',
        description: 'Prominent border, no shadow, transparent background.',
        tokens: {
          root: {
            borderRadius: '8px',
            shadow: 'none',
            borderColor: '{primary.color}',
          },
        },
        cssVars: {},
      },
    ],
  },

  {
    id: 'inputnumber',
    name: 'InputNumber',
    category: 'Form',
    icon: 'phosphorSortAscendingThin',
    description: 'Numeric input with increment/decrement controls.',
    usedInEmsist: true,
    styleVariants: [
      {
        id: 'default',
        name: 'Default',
        description: 'Standard PrimeNG numeric input.',
        tokens: {},
        cssVars: {},
      },
      {
        id: 'raised',
        name: 'Raised',
        description: 'Outset shadow for floating appearance.',
        tokens: {
          root: {
            borderRadius: '12px',
            shadow: '3px 3px 6px var(--nm-shadow-dark), -3px -3px 6px var(--nm-shadow-light)',
          },
        },
        cssVars: {},
      },
      {
        id: 'flat',
        name: 'Flat',
        description: 'No shadow, clean solid input.',
        tokens: {
          root: {
            borderRadius: '8px',
            shadow: 'none',
          },
        },
        cssVars: {},
      },
      {
        id: 'outlined',
        name: 'Outlined',
        description: 'Accented border, no fill or shadow.',
        tokens: {
          root: {
            borderRadius: '8px',
            shadow: 'none',
            borderColor: '{primary.color}',
          },
        },
        cssVars: {},
      },
    ],
  },

  {
    id: 'select',
    name: 'Select',
    category: 'Form',
    icon: 'phosphorCaretDownThin',
    description: 'Dropdown menu for single-value selection.',
    usedInEmsist: true,
    styleVariants: [
      {
        id: 'default',
        name: 'Default',
        description: 'Standard PrimeNG select dropdown.',
        tokens: {},
        cssVars: {},
      },
      {
        id: 'raised',
        name: 'Raised',
        description: 'Outset shadow — dropdown floats above.',
        tokens: {
          root: {
            borderRadius: '12px',
            shadow: '3px 3px 6px var(--nm-shadow-dark), -3px -3px 6px var(--nm-shadow-light)',
          },
        },
        cssVars: {},
      },
      {
        id: 'flat',
        name: 'Flat',
        description: 'No shadow, clean bordered dropdown.',
        tokens: {
          root: {
            borderRadius: '8px',
            shadow: 'none',
          },
        },
        cssVars: {},
      },
      {
        id: 'outlined',
        name: 'Outlined',
        description: 'Accented border, transparent background.',
        tokens: {
          root: {
            borderRadius: '8px',
            shadow: 'none',
            borderColor: '{primary.color}',
          },
        },
        cssVars: {},
      },
    ],
  },

  {
    id: 'selectbutton',
    name: 'SelectButton',
    category: 'Form',
    icon: 'phosphorSquaresFourThin',
    description: 'Toggle button group for mutually exclusive options.',
    usedInEmsist: true,
    styleVariants: [
      {
        id: 'default',
        name: 'Default',
        description: 'Standard PrimeNG select button.',
        tokens: {},
        cssVars: {},
      },
      {
        id: 'raised',
        name: 'Raised',
        description: 'Outset shadow on the button group.',
        tokens: {
          root: {
            borderRadius: '12px',
            shadow: '3px 3px 6px var(--nm-shadow-dark), -3px -3px 6px var(--nm-shadow-light)',
          },
        },
        cssVars: {},
      },
      {
        id: 'pills',
        name: 'Pills',
        description: 'Fully rounded pill-shaped buttons.',
        tokens: {
          root: {
            borderRadius: '24px',
            shadow: '3px 3px 6px var(--nm-shadow-dark), -3px -3px 6px var(--nm-shadow-light)',
          },
        },
        cssVars: {},
      },
      {
        id: 'flat',
        name: 'Flat',
        description: 'No shadow, solid background.',
        tokens: {
          root: {
            borderRadius: '8px',
            shadow: 'none',
          },
        },
        cssVars: {},
      },
    ],
  },

  {
    id: 'checkbox',
    name: 'Checkbox',
    category: 'Form',
    icon: 'phosphorCheckSquareThin',
    description: 'Binary toggle input with label.',
    usedInEmsist: true,
    styleVariants: [
      {
        id: 'default',
        name: 'Default',
        description: 'Standard PrimeNG checkbox.',
        tokens: {},
        cssVars: {},
      },
      {
        id: 'raised',
        name: 'Raised',
        description: 'Outset shadow on the checkbox box.',
        tokens: {
          root: {
            borderRadius: '6px',
            shadow: '2px 2px 4px var(--nm-shadow-dark), -2px -2px 4px var(--nm-shadow-light)',
          },
        },
        cssVars: {},
      },
      {
        id: 'flat',
        name: 'Flat',
        description: 'No shadow, clean bordered checkbox.',
        tokens: {
          root: {
            borderRadius: '4px',
            shadow: 'none',
          },
        },
        cssVars: {},
      },
      {
        id: 'outlined',
        name: 'Outlined',
        description: 'Accented border highlight on checkbox.',
        tokens: {
          root: {
            borderRadius: '4px',
            shadow: 'none',
            borderColor: '{primary.color}',
          },
        },
        cssVars: {},
      },
    ],
  },

  {
    id: 'toggleswitch',
    name: 'ToggleSwitch',
    category: 'Form',
    icon: 'phosphorArrowsClockwiseThin',
    description: 'Toggle switch for boolean on/off settings.',
    usedInEmsist: true,
    styleVariants: [
      {
        id: 'default',
        name: 'Default',
        description: 'Standard PrimeNG toggle switch.',
        tokens: {},
        cssVars: {},
      },
      {
        id: 'raised',
        name: 'Raised',
        description: 'Outset shadow on the switch track.',
        tokens: {
          root: {
            borderRadius: '16px',
            shadow: '2px 2px 4px var(--nm-shadow-dark), -2px -2px 4px var(--nm-shadow-light)',
          },
        },
        cssVars: {},
      },
      {
        id: 'flat',
        name: 'Flat',
        description: 'No shadow, clean switch.',
        tokens: {
          root: {
            borderRadius: '16px',
            shadow: 'none',
          },
        },
        cssVars: {},
      },
      {
        id: 'minimal',
        name: 'Minimal',
        description: 'Thin track, subtle appearance.',
        tokens: {
          root: {
            borderRadius: '12px',
            shadow: 'none',
          },
        },
        cssVars: {},
      },
    ],
  },

  // Unused Form components
  {
    id: 'splitbutton',
    name: 'SplitButton',
    category: 'Form',
    icon: 'phosphorCaretDownThin',
    description: 'Button with dropdown.',
    usedInEmsist: false,
    styleVariants: [],
  },
  {
    id: 'textarea',
    name: 'Textarea',
    category: 'Form',
    icon: 'phosphorTextAlignLeftThin',
    description: 'Multi-line text input.',
    usedInEmsist: false,
    styleVariants: [],
  },
  {
    id: 'multiselect',
    name: 'MultiSelect',
    category: 'Form',
    icon: 'phosphorListThin',
    description: 'Multi-value dropdown selection.',
    usedInEmsist: false,
    styleVariants: [],
  },
  {
    id: 'radiobutton',
    name: 'RadioButton',
    category: 'Form',
    icon: 'phosphorCircleThin',
    description: 'Mutually exclusive radio options.',
    usedInEmsist: false,
    styleVariants: [],
  },
  {
    id: 'rating',
    name: 'Rating',
    category: 'Form',
    icon: 'phosphorStarThin',
    description: 'Star rating input.',
    usedInEmsist: false,
    styleVariants: [],
  },
  {
    id: 'colorpicker',
    name: 'ColorPicker',
    category: 'Form',
    icon: 'phosphorPaletteThin',
    description: 'Color selection control.',
    usedInEmsist: false,
    styleVariants: [],
  },
  {
    id: 'inputmask',
    name: 'InputMask',
    category: 'Form',
    icon: 'phosphorHashThin',
    description: 'Masked text input.',
    usedInEmsist: false,
    styleVariants: [],
  },
  {
    id: 'inputotp',
    name: 'InputOTP',
    category: 'Form',
    icon: 'phosphorKeyThin',
    description: 'One-time password input.',
    usedInEmsist: false,
    styleVariants: [],
  },
  {
    id: 'password',
    name: 'Password',
    category: 'Form',
    icon: 'phosphorLockThin',
    description: 'Password input with strength indicator.',
    usedInEmsist: false,
    styleVariants: [],
  },
  {
    id: 'autocomplete',
    name: 'AutoComplete',
    category: 'Form',
    icon: 'phosphorMagnifyingGlassThin',
    description: 'Typeahead input with suggestions.',
    usedInEmsist: false,
    styleVariants: [],
  },
  {
    id: 'cascadeselect',
    name: 'CascadeSelect',
    category: 'Form',
    icon: 'phosphorTreeStructureThin',
    description: 'Hierarchical dropdown.',
    usedInEmsist: false,
    styleVariants: [],
  },
  {
    id: 'treeselect',
    name: 'TreeSelect',
    category: 'Form',
    icon: 'phosphorShareNetworkThin',
    description: 'Tree-structured dropdown.',
    usedInEmsist: false,
    styleVariants: [],
  },
  {
    id: 'knob',
    name: 'Knob',
    category: 'Form',
    icon: 'phosphorCircleThin',
    description: 'Rotary dial input.',
    usedInEmsist: false,
    styleVariants: [],
  },
  {
    id: 'floatlabel',
    name: 'FloatLabel',
    category: 'Form',
    icon: 'phosphorTagThin',
    description: 'Animated floating label wrapper.',
    usedInEmsist: false,
    styleVariants: [],
  },
  {
    id: 'slider',
    name: 'Slider',
    category: 'Form',
    icon: 'phosphorSlidersThin',
    description: 'Range slider input.',
    usedInEmsist: false,
    styleVariants: [],
  },

  // ======== DATA ========

  {
    id: 'datatable',
    name: 'DataTable',
    category: 'Data',
    icon: 'phosphorTableThin',
    description: 'Feature-rich data table with sorting, filtering, and pagination.',
    usedInEmsist: true,
    styleVariants: [
      {
        id: 'default',
        name: 'Default',
        description: 'Standard PrimeNG data table.',
        tokens: {},
        cssVars: {},
      },
      {
        id: 'striped',
        name: 'Striped',
        description: 'Alternating row backgrounds for readability.',
        tokens: {
          root: {
            borderRadius: '8px',
          },
          bodyRow: {
            stripedBackground: 'rgba(22,22,22,0.03)',
          },
        },
        cssVars: {},
      },
      {
        id: 'raised',
        name: 'Raised',
        description: 'Outset shadow — table card floats above surface.',
        tokens: {
          root: {
            borderRadius: '12px',
            shadow: '4px 4px 10px var(--nm-shadow-dark), -4px -4px 10px var(--nm-shadow-light)',
          },
        },
        cssVars: {},
      },
      {
        id: 'minimal',
        name: 'Minimal',
        description: 'No borders, no shadow, clean rows.',
        tokens: {
          root: {
            borderRadius: '0',
            shadow: 'none',
          },
        },
        cssVars: {},
      },
    ],
  },

  {
    id: 'paginator',
    name: 'Paginator',
    category: 'Data',
    icon: 'phosphorDotsThreeThin',
    description: 'Pagination controls for data sets.',
    usedInEmsist: true,
    styleVariants: [
      {
        id: 'default',
        name: 'Default',
        description: 'Standard PrimeNG paginator.',
        tokens: {},
        cssVars: {},
      },
      {
        id: 'raised',
        name: 'Raised',
        description: 'Outset shadow on page buttons.',
        tokens: {
          root: {
            borderRadius: '8px',
            shadow: '2px 2px 4px var(--nm-shadow-dark), -2px -2px 4px var(--nm-shadow-light)',
          },
        },
        cssVars: {},
      },
      {
        id: 'flat',
        name: 'Flat',
        description: 'No shadow, simple page numbers.',
        tokens: {
          root: {
            borderRadius: '4px',
            shadow: 'none',
          },
        },
        cssVars: {},
      },
      {
        id: 'minimal',
        name: 'Minimal',
        description: 'Borderless, text-only page controls.',
        tokens: {
          root: {
            borderRadius: '0',
            shadow: 'none',
          },
        },
        cssVars: {},
      },
    ],
  },

  // Unused Data components
  {
    id: 'dataview',
    name: 'DataView',
    category: 'Data',
    icon: 'phosphorIdentificationCardThin',
    description: 'List and grid layout for data display.',
    usedInEmsist: false,
    styleVariants: [],
  },
  {
    id: 'tree',
    name: 'Tree',
    category: 'Data',
    icon: 'phosphorShareNetworkThin',
    description: 'Hierarchical tree display.',
    usedInEmsist: false,
    styleVariants: [],
  },
  {
    id: 'timeline',
    name: 'Timeline',
    category: 'Data',
    icon: 'phosphorCalendarThin',
    description: 'Vertical event timeline.',
    usedInEmsist: false,
    styleVariants: [],
  },
  {
    id: 'orderlist',
    name: 'OrderList',
    category: 'Data',
    icon: 'phosphorArrowsDownUpThin',
    description: 'Reorderable list.',
    usedInEmsist: false,
    styleVariants: [],
  },
  {
    id: 'picklist',
    name: 'PickList',
    category: 'Data',
    icon: 'phosphorArrowsLeftRightThin',
    description: 'Dual-list transfer control.',
    usedInEmsist: false,
    styleVariants: [],
  },
  {
    id: 'orgchart',
    name: 'OrgChart',
    category: 'Data',
    icon: 'phosphorTreeStructureThin',
    description: 'Organizational hierarchy chart.',
    usedInEmsist: false,
    styleVariants: [],
  },
  {
    id: 'virtualscroller',
    name: 'VirtualScroller',
    category: 'Data',
    icon: 'phosphorListThin',
    description: 'Virtualized scrolling list.',
    usedInEmsist: false,
    styleVariants: [],
  },

  // ======== PANEL ========

  {
    id: 'card',
    name: 'Card',
    category: 'Panel',
    icon: 'phosphorIdentificationCardThin',
    description: 'Container for grouped information with header and footer.',
    usedInEmsist: true,
    styleVariants: [
      {
        id: 'default',
        name: 'Default',
        description: 'Standard PrimeNG Aura card.',
        tokens: {},
        cssVars: {},
      },
      {
        id: 'raised',
        name: 'Raised',
        description: 'Outset neumorphic shadow — card floats above surface.',
        tokens: {
          root: {
            borderRadius: '16px',
            shadow: '6px 6px 14px var(--nm-shadow-dark), -6px -6px 14px var(--nm-shadow-light)',
          },
        },
        cssVars: {},
      },
      {
        id: 'inset',
        name: 'Inset',
        description: 'Recessed neumorphic look — card sits inside the surface.',
        tokens: {
          root: {
            borderRadius: '16px',
            shadow:
              'inset 4px 4px 10px var(--nm-shadow-dark), inset -4px -4px 10px var(--nm-shadow-light)',
            background: 'var(--nm-bg)',
          },
        },
        cssVars: {},
      },
      {
        id: 'flat',
        name: 'Flat',
        description: 'No shadow, subtle border only.',
        tokens: {
          root: {
            borderRadius: '8px',
            shadow: 'none',
          },
        },
        cssVars: {},
      },
    ],
  },

  {
    id: 'accordion',
    name: 'Accordion',
    category: 'Panel',
    icon: 'phosphorListThin',
    description: 'Collapsible content panels with stacked sections.',
    usedInEmsist: true,
    styleVariants: [
      {
        id: 'default',
        name: 'Default',
        description: 'Standard PrimeNG accordion.',
        tokens: {},
        cssVars: {},
      },
      {
        id: 'raised-panels',
        name: 'Raised Panels',
        description: 'Each panel floats with neumorphic shadow.',
        tokens: {
          panel: {
            borderRadius: '12px',
            shadow: '4px 4px 8px var(--nm-shadow-dark), -4px -4px 8px var(--nm-shadow-light)',
          },
        },
        cssVars: {},
      },
      {
        id: 'flush',
        name: 'Flush',
        description: 'No gaps, no borders between panels — seamless stacking.',
        tokens: {
          panel: {
            borderRadius: '0',
            shadow: 'none',
          },
        },
        cssVars: {},
      },
      {
        id: 'bordered',
        name: 'Bordered',
        description: 'Prominent border around each panel, no shadow.',
        tokens: {
          panel: {
            borderRadius: '8px',
            shadow: 'none',
            borderColor: '{primary.color}',
          },
        },
        cssVars: {},
      },
    ],
  },

  {
    id: 'tabs',
    name: 'Tabs',
    category: 'Panel',
    icon: 'phosphorFolderThin',
    description: 'Tabbed content panels for switching between views.',
    usedInEmsist: true,
    styleVariants: [
      {
        id: 'default',
        name: 'Default',
        description: 'Standard PrimeNG tabs.',
        tokens: {},
        cssVars: {},
      },
      {
        id: 'pills',
        name: 'Pills',
        description: 'Rounded pill-shaped tab buttons.',
        tokens: {
          tablist: {
            borderRadius: '24px',
          },
          tab: {
            borderRadius: '24px',
            shadow: '3px 3px 6px var(--nm-shadow-dark), -3px -3px 6px var(--nm-shadow-light)',
          },
        },
        cssVars: {},
      },
      {
        id: 'cards',
        name: 'Cards',
        description: 'Each tab styled as a raised card.',
        tokens: {
          tab: {
            borderRadius: '12px',
            shadow: '4px 4px 8px var(--nm-shadow-dark), -4px -4px 8px var(--nm-shadow-light)',
          },
        },
        cssVars: {},
      },
      {
        id: 'underline',
        name: 'Underline',
        description: 'Simple underline indicator, no box shadow.',
        tokens: {
          tab: {
            borderRadius: '0',
            shadow: 'none',
          },
        },
        cssVars: {},
      },
    ],
  },

  {
    id: 'dialog',
    name: 'Dialog',
    category: 'Panel',
    icon: 'phosphorCopyThin',
    description: 'Modal overlay dialog for focused interactions.',
    usedInEmsist: true,
    styleVariants: [
      {
        id: 'default',
        name: 'Default',
        description: 'Standard PrimeNG dialog.',
        tokens: {},
        cssVars: {},
      },
      {
        id: 'raised',
        name: 'Raised',
        description: 'Strong neumorphic shadow on dialog panel.',
        tokens: {
          root: {
            borderRadius: '16px',
            shadow: '8px 8px 20px var(--nm-shadow-dark), -8px -8px 20px var(--nm-shadow-light)',
          },
        },
        cssVars: {},
      },
      {
        id: 'flat',
        name: 'Flat',
        description: 'No shadow, clean bordered dialog.',
        tokens: {
          root: {
            borderRadius: '8px',
            shadow: 'none',
          },
        },
        cssVars: {},
      },
      {
        id: 'minimal',
        name: 'Minimal',
        description: 'Borderless, minimal dialog with subtle overlay.',
        tokens: {
          root: {
            borderRadius: '12px',
            shadow: '0 4px 16px rgba(22,22,22,0.12)',
          },
        },
        cssVars: {},
      },
    ],
  },

  // Unused Panel components
  {
    id: 'fieldset',
    name: 'Fieldset',
    category: 'Panel',
    icon: 'phosphorCubeThin',
    description: 'Grouping container with legend.',
    usedInEmsist: false,
    styleVariants: [],
  },
  {
    id: 'panel',
    name: 'Panel',
    category: 'Panel',
    icon: 'phosphorFrameCornersThin',
    description: 'Collapsible panel with header.',
    usedInEmsist: false,
    styleVariants: [],
  },
  {
    id: 'divider',
    name: 'Divider',
    category: 'Panel',
    icon: 'phosphorMinusThin',
    description: 'Content separator line.',
    usedInEmsist: false,
    styleVariants: [],
  },
  {
    id: 'toolbar',
    name: 'Toolbar',
    category: 'Panel',
    icon: 'phosphorSquaresFourThin',
    description: 'Action toolbar container.',
    usedInEmsist: false,
    styleVariants: [],
  },
  {
    id: 'splitter',
    name: 'Splitter',
    category: 'Panel',
    icon: 'phosphorArrowsOutThin',
    description: 'Resizable split panels.',
    usedInEmsist: false,
    styleVariants: [],
  },
  {
    id: 'scrollpanel',
    name: 'ScrollPanel',
    category: 'Panel',
    icon: 'phosphorArrowDownThin',
    description: 'Custom scrollbar panel.',
    usedInEmsist: false,
    styleVariants: [],
  },
  {
    id: 'stepper',
    name: 'Stepper',
    category: 'Panel',
    icon: 'phosphorCaretRightThin',
    description: 'Multi-step wizard.',
    usedInEmsist: false,
    styleVariants: [],
  },

  // ======== LAYOUT ========

  {
    id: 'layout-header-action-button',
    name: 'Header Action Button',
    category: 'Layout',
    source: 'CustomLayout',
    governance: {
      owner: 'Administration Shell',
      controlMode: 'CSS Variables',
      enforcementPolicy: 'Brand Enforcement Policy v1',
      implementationPath: 'frontend/src/app/features/administration/administration.page.scss',
    },
    icon: 'phosphorCircleThin',
    description: 'Circular action button used in header islands (menu, notifications, help).',
    usedInEmsist: true,
    styleVariants: [
      {
        id: 'default',
        name: 'Default',
        description: 'Brand bezel with two-layer neumorphic face.',
        tokens: {},
        cssVars: {},
      },
    ],
  },
  {
    id: 'layout-header-signout-button',
    name: 'Header Sign Out Button',
    category: 'Layout',
    source: 'CustomLayout',
    governance: {
      owner: 'Administration Shell',
      controlMode: 'CSS Variables',
      enforcementPolicy: 'Brand Enforcement Policy v1',
      implementationPath: 'frontend/src/app/features/administration/administration.page.scss',
    },
    icon: 'phosphorPowerThin',
    description: 'Destructive circular sign-out action in header and drawer footer.',
    usedInEmsist: true,
    styleVariants: [
      {
        id: 'default',
        name: 'Default',
        description: 'Deep umber danger bezel with neutral face.',
        tokens: {},
        cssVars: {},
      },
    ],
  },
  {
    id: 'layout-admin-dock-card',
    name: 'Admin Dock Container',
    category: 'Layout',
    source: 'CustomLayout',
    governance: {
      owner: 'Administration Shell',
      controlMode: 'CSS Variables',
      enforcementPolicy: 'Brand Enforcement Policy v1',
      implementationPath: 'frontend/src/app/features/administration/administration.page.scss',
    },
    icon: 'phosphorFrameCornersThin',
    description: 'Glass-like vertical dock container for administration navigation.',
    usedInEmsist: true,
    styleVariants: [
      {
        id: 'default',
        name: 'Default',
        description: 'Translucent surface with border and blur.',
        tokens: {},
        cssVars: {},
      },
    ],
  },
  {
    id: 'layout-admin-dock-item',
    name: 'Admin Dock Item',
    category: 'Layout',
    source: 'CustomLayout',
    governance: {
      owner: 'Administration Shell',
      controlMode: 'CSS Variables',
      enforcementPolicy: 'Brand Enforcement Policy v1',
      implementationPath: 'frontend/src/app/features/administration/administration.page.scss',
    },
    icon: 'phosphorCompassThin',
    description: 'Circular icon button used for each administration section in the dock.',
    usedInEmsist: true,
    styleVariants: [
      {
        id: 'default',
        name: 'Default',
        description: 'Circular icon with neutral fill and active state in primary.',
        tokens: {},
        cssVars: {},
      },
    ],
  },

  // ======== OVERLAY ========

  {
    id: 'tooltip',
    name: 'Tooltip',
    category: 'Overlay',
    icon: 'phosphorInfoThin',
    description: 'Contextual tooltip popup on hover or focus.',
    usedInEmsist: true,
    styleVariants: [
      {
        id: 'default',
        name: 'Default',
        description: 'Standard PrimeNG tooltip.',
        tokens: {},
        cssVars: {},
      },
      {
        id: 'dark',
        name: 'Dark',
        description: 'Dark background with light text.',
        tokens: {
          root: {
            borderRadius: '8px',
            background: '#161616',
            color: '#FAF8F5',
          },
        },
        cssVars: {},
      },
      {
        id: 'light',
        name: 'Light',
        description: 'Light background with shadow.',
        tokens: {
          root: {
            borderRadius: '8px',
            background: '#FAF8F5',
            color: '#3d3a3b',
            shadow: '0 4px 12px rgba(22,22,22,0.12)',
          },
        },
        cssVars: {},
      },
      {
        id: 'minimal',
        name: 'Minimal',
        description: 'Borderless, small text tooltip.',
        tokens: {
          root: {
            borderRadius: '4px',
            shadow: 'none',
          },
        },
        cssVars: {},
      },
    ],
  },

  // Unused Overlay components
  {
    id: 'drawer',
    name: 'Drawer',
    category: 'Overlay',
    icon: 'phosphorArrowRightThin',
    description: 'Slide-out side panel.',
    usedInEmsist: false,
    styleVariants: [],
  },
  {
    id: 'popover',
    name: 'Popover',
    category: 'Overlay',
    icon: 'phosphorChatThin',
    description: 'Floating overlay content panel.',
    usedInEmsist: false,
    styleVariants: [],
  },
  {
    id: 'confirmdialog',
    name: 'ConfirmDialog',
    category: 'Overlay',
    icon: 'phosphorQuestionThin',
    description: 'Confirmation dialog.',
    usedInEmsist: false,
    styleVariants: [],
  },
  {
    id: 'confirmpopup',
    name: 'ConfirmPopup',
    category: 'Overlay',
    icon: 'phosphorQuestionThin',
    description: 'Inline confirmation popup.',
    usedInEmsist: false,
    styleVariants: [],
  },
  {
    id: 'toast',
    name: 'Toast',
    category: 'Overlay',
    icon: 'phosphorBellThin',
    description: 'Toast notification messages.',
    usedInEmsist: false,
    styleVariants: [],
  },

  // ======== MESSAGES ========

  {
    id: 'message',
    name: 'Message',
    category: 'Messages',
    icon: 'phosphorInfoThin',
    description: 'Inline status message with severity levels.',
    usedInEmsist: true,
    styleVariants: [
      {
        id: 'default',
        name: 'Default',
        description: 'Standard PrimeNG message.',
        tokens: {},
        cssVars: {},
      },
      {
        id: 'raised',
        name: 'Raised',
        description: 'Outset shadow on message banner.',
        tokens: {
          root: {
            borderRadius: '12px',
            shadow: '3px 3px 6px var(--nm-shadow-dark), -3px -3px 6px var(--nm-shadow-light)',
          },
        },
        cssVars: {},
      },
      {
        id: 'flat',
        name: 'Flat',
        description: 'No shadow, clean fill with subtle background.',
        tokens: {
          root: {
            borderRadius: '8px',
            shadow: 'none',
          },
        },
        cssVars: {},
      },
      {
        id: 'bordered',
        name: 'Bordered',
        description: 'Left border accent, no shadow.',
        tokens: {
          root: {
            borderRadius: '0',
            shadow: 'none',
          },
        },
        cssVars: {},
      },
    ],
  },

  {
    id: 'tag',
    name: 'Tag',
    category: 'Messages',
    icon: 'phosphorTagThin',
    description: 'Small label badge for categorization and status.',
    usedInEmsist: true,
    styleVariants: [
      {
        id: 'default',
        name: 'Default',
        description: 'Standard PrimeNG tag.',
        tokens: {},
        cssVars: {},
      },
      {
        id: 'raised',
        name: 'Raised',
        description: 'Outset shadow on tag.',
        tokens: {
          root: {
            borderRadius: '16px',
            shadow: '2px 2px 4px var(--nm-shadow-dark), -2px -2px 4px var(--nm-shadow-light)',
          },
        },
        cssVars: {},
      },
      {
        id: 'flat',
        name: 'Flat',
        description: 'No shadow, solid fill.',
        tokens: {
          root: {
            borderRadius: '16px',
            shadow: 'none',
          },
        },
        cssVars: {},
      },
      {
        id: 'outlined',
        name: 'Outlined',
        description: 'Transparent background, colored border.',
        tokens: {
          root: {
            borderRadius: '16px',
            shadow: 'none',
            background: 'transparent',
            borderColor: '{primary.color}',
          },
        },
        cssVars: {},
      },
    ],
  },

  {
    id: 'badge',
    name: 'Badge',
    category: 'Messages',
    icon: 'phosphorCircleThin',
    description: 'Small numeric or dot indicator.',
    usedInEmsist: true,
    styleVariants: [
      {
        id: 'default',
        name: 'Default',
        description: 'Standard PrimeNG badge.',
        tokens: {},
        cssVars: {},
      },
      {
        id: 'raised',
        name: 'Raised',
        description: 'Outset shadow on badge.',
        tokens: {
          root: {
            borderRadius: '50%',
            shadow: '2px 2px 4px var(--nm-shadow-dark), -2px -2px 4px var(--nm-shadow-light)',
          },
        },
        cssVars: {},
      },
      {
        id: 'flat',
        name: 'Flat',
        description: 'No shadow, solid fill.',
        tokens: {
          root: {
            shadow: 'none',
          },
        },
        cssVars: {},
      },
      {
        id: 'outlined',
        name: 'Outlined',
        description: 'Transparent background with colored ring.',
        tokens: {
          root: {
            shadow: 'none',
            background: 'transparent',
            borderColor: '{primary.color}',
          },
        },
        cssVars: {},
      },
    ],
  },

  {
    id: 'chip',
    name: 'Chip',
    category: 'Messages',
    icon: 'phosphorTagThin',
    description: 'Compact element for tags, filters, and inputs.',
    usedInEmsist: true,
    styleVariants: [
      {
        id: 'default',
        name: 'Default',
        description: 'Standard PrimeNG chip.',
        tokens: {},
        cssVars: {},
      },
      {
        id: 'raised',
        name: 'Raised',
        description: 'Outset shadow on chip.',
        tokens: {
          root: {
            borderRadius: '16px',
            shadow: '2px 2px 4px var(--nm-shadow-dark), -2px -2px 4px var(--nm-shadow-light)',
          },
        },
        cssVars: {},
      },
      {
        id: 'flat',
        name: 'Flat',
        description: 'No shadow, clean chip.',
        tokens: {
          root: {
            borderRadius: '16px',
            shadow: 'none',
          },
        },
        cssVars: {},
      },
      {
        id: 'outlined',
        name: 'Outlined',
        description: 'Transparent background, colored border.',
        tokens: {
          root: {
            borderRadius: '16px',
            shadow: 'none',
            background: 'transparent',
          },
        },
        cssVars: {},
      },
    ],
  },

  // ======== NAVIGATION ========

  {
    id: 'menu',
    name: 'Menu',
    category: 'Navigation',
    icon: 'phosphorListThin',
    description: 'Basic navigation menu.',
    usedInEmsist: true,
    styleVariants: [
      {
        id: 'default',
        name: 'Default',
        description: 'Standard PrimeNG menu.',
        tokens: {},
        cssVars: {},
      },
      {
        id: 'raised',
        name: 'Raised',
        description: 'Outset shadow on menu container.',
        tokens: {
          root: {
            borderRadius: '12px',
            shadow: '4px 4px 10px var(--nm-shadow-dark), -4px -4px 10px var(--nm-shadow-light)',
          },
        },
        cssVars: {},
      },
      {
        id: 'flat',
        name: 'Flat',
        description: 'No shadow, clean bordered menu.',
        tokens: {
          root: {
            borderRadius: '8px',
            shadow: 'none',
          },
        },
        cssVars: {},
      },
      {
        id: 'minimal',
        name: 'Minimal',
        description: 'Borderless, transparent menu.',
        tokens: {
          root: {
            borderRadius: '0',
            shadow: 'none',
          },
        },
        cssVars: {},
      },
    ],
  },

  {
    id: 'breadcrumb',
    name: 'Breadcrumb',
    category: 'Navigation',
    icon: 'phosphorCaretRightThin',
    description: 'Breadcrumb trail for hierarchical navigation.',
    usedInEmsist: true,
    styleVariants: [
      {
        id: 'default',
        name: 'Default',
        description: 'Standard PrimeNG breadcrumb.',
        tokens: {},
        cssVars: {},
      },
      {
        id: 'raised',
        name: 'Raised',
        description: 'Outset shadow on breadcrumb bar.',
        tokens: {
          root: {
            borderRadius: '12px',
            shadow: '3px 3px 6px var(--nm-shadow-dark), -3px -3px 6px var(--nm-shadow-light)',
          },
        },
        cssVars: {},
      },
      {
        id: 'flat',
        name: 'Flat',
        description: 'No shadow, clean breadcrumb.',
        tokens: {
          root: {
            borderRadius: '8px',
            shadow: 'none',
          },
        },
        cssVars: {},
      },
      {
        id: 'minimal',
        name: 'Minimal',
        description: 'Text-only, no background or border.',
        tokens: {
          root: {
            borderRadius: '0',
            shadow: 'none',
            background: 'transparent',
          },
        },
        cssVars: {},
      },
    ],
  },

  // Unused Navigation components
  {
    id: 'menubar',
    name: 'Menubar',
    category: 'Navigation',
    icon: 'phosphorTextAlignJustifyThin',
    description: 'Horizontal menu bar.',
    usedInEmsist: false,
    styleVariants: [],
  },
  {
    id: 'steps',
    name: 'Steps',
    category: 'Navigation',
    icon: 'phosphorListThin',
    description: 'Step indicator for wizards.',
    usedInEmsist: false,
    styleVariants: [],
  },
  {
    id: 'tabmenu',
    name: 'TabMenu',
    category: 'Navigation',
    icon: 'phosphorFolderThin',
    description: 'Tab-based menu navigation.',
    usedInEmsist: false,
    styleVariants: [],
  },
  {
    id: 'panelmenu',
    name: 'PanelMenu',
    category: 'Navigation',
    icon: 'phosphorTextAlignLeftThin',
    description: 'Accordion-style menu.',
    usedInEmsist: false,
    styleVariants: [],
  },
  {
    id: 'megamenu',
    name: 'MegaMenu',
    category: 'Navigation',
    icon: 'phosphorSquaresFourThin',
    description: 'Multi-column mega menu.',
    usedInEmsist: false,
    styleVariants: [],
  },
  {
    id: 'contextmenu',
    name: 'ContextMenu',
    category: 'Navigation',
    icon: 'phosphorDotsThreeVerticalThin',
    description: 'Right-click context menu.',
    usedInEmsist: false,
    styleVariants: [],
  },
  {
    id: 'tieredmenu',
    name: 'TieredMenu',
    category: 'Navigation',
    icon: 'phosphorCaretRightThin',
    description: 'Multi-level cascading menu.',
    usedInEmsist: false,
    styleVariants: [],
  },
  {
    id: 'dock',
    name: 'Dock',
    category: 'Navigation',
    icon: 'phosphorDesktopTowerThin',
    description: 'macOS-style application dock.',
    usedInEmsist: false,
    styleVariants: [],
  },

  // ======== MEDIA ========

  {
    id: 'avatar',
    name: 'Avatar',
    category: 'Media',
    icon: 'phosphorUserThin',
    description: 'User avatar with initials, icon, or image.',
    usedInEmsist: true,
    styleVariants: [
      {
        id: 'default',
        name: 'Default',
        description: 'Standard PrimeNG avatar.',
        tokens: {},
        cssVars: {},
      },
      {
        id: 'raised',
        name: 'Raised',
        description: 'Outset shadow on avatar.',
        tokens: {
          root: {
            borderRadius: '50%',
            shadow: '3px 3px 6px var(--nm-shadow-dark), -3px -3px 6px var(--nm-shadow-light)',
          },
        },
        cssVars: {},
      },
      {
        id: 'inset',
        name: 'Inset',
        description: 'Recessed avatar that sits into the surface.',
        tokens: {
          root: {
            borderRadius: '50%',
            shadow:
              'inset 2px 2px 4px var(--nm-shadow-dark), inset -2px -2px 4px var(--nm-shadow-light)',
          },
        },
        cssVars: {},
      },
      {
        id: 'flat',
        name: 'Flat',
        description: 'No shadow, clean circle.',
        tokens: {
          root: {
            borderRadius: '50%',
            shadow: 'none',
          },
        },
        cssVars: {},
      },
    ],
  },

  // Unused Media components
  {
    id: 'image',
    name: 'Image',
    category: 'Media',
    icon: 'phosphorImageThin',
    description: 'Image display with preview.',
    usedInEmsist: false,
    styleVariants: [],
  },
  {
    id: 'carousel',
    name: 'Carousel',
    category: 'Media',
    icon: 'phosphorImagesThin',
    description: 'Rotating content carousel.',
    usedInEmsist: false,
    styleVariants: [],
  },
  {
    id: 'galleria',
    name: 'Galleria',
    category: 'Media',
    icon: 'phosphorSquaresFourThin',
    description: 'Advanced image gallery.',
    usedInEmsist: false,
    styleVariants: [],
  },

  // ======== MISC ========

  {
    id: 'progressspinner',
    name: 'ProgressSpinner',
    category: 'Misc',
    icon: 'phosphorSpinnerThin',
    description: 'Spinning loading indicator.',
    usedInEmsist: true,
    styleVariants: [
      {
        id: 'default',
        name: 'Default',
        description: 'Standard PrimeNG spinner.',
        tokens: {},
        cssVars: {},
      },
      {
        id: 'large',
        name: 'Large',
        description: 'Larger spinner for full-page loaders.',
        tokens: {
          root: {
            width: '64px',
            height: '64px',
          },
        },
        cssVars: {},
      },
      {
        id: 'colored',
        name: 'Colored',
        description: 'Primary-colored spinner stroke.',
        tokens: {
          root: {
            'color.1': '{primary.color}',
            'color.2': '{primary.color}',
            'color.3': '{primary.color}',
            'color.4': '{primary.color}',
          },
        },
        cssVars: {},
      },
      {
        id: 'minimal',
        name: 'Minimal',
        description: 'Small, subtle spinner.',
        tokens: {
          root: {
            width: '24px',
            height: '24px',
          },
        },
        cssVars: {},
      },
    ],
  },

  {
    id: 'progressbar',
    name: 'ProgressBar',
    category: 'Misc',
    icon: 'phosphorPercentThin',
    description: 'Horizontal progress indicator.',
    usedInEmsist: true,
    styleVariants: [
      {
        id: 'default',
        name: 'Default',
        description: 'Standard PrimeNG progress bar.',
        tokens: {},
        cssVars: {},
      },
      {
        id: 'raised',
        name: 'Raised',
        description: 'Outset shadow on the track.',
        tokens: {
          root: {
            borderRadius: '12px',
            shadow: '2px 2px 4px var(--nm-shadow-dark), -2px -2px 4px var(--nm-shadow-light)',
          },
        },
        cssVars: {},
      },
      {
        id: 'flat',
        name: 'Flat',
        description: 'No shadow, clean bar.',
        tokens: {
          root: {
            borderRadius: '4px',
            shadow: 'none',
          },
        },
        cssVars: {},
      },
      {
        id: 'striped',
        name: 'Striped',
        description: 'Animated stripe pattern on the fill.',
        tokens: {
          root: {
            borderRadius: '8px',
          },
        },
        cssVars: {},
      },
    ],
  },

  // Unused Misc components
  {
    id: 'skeleton',
    name: 'Skeleton',
    category: 'Misc',
    icon: 'phosphorCubeThin',
    description: 'Content placeholder during loading.',
    usedInEmsist: false,
    styleVariants: [],
  },
  {
    id: 'scrolltop',
    name: 'ScrollTop',
    category: 'Misc',
    icon: 'phosphorArrowUpThin',
    description: 'Scroll-to-top button.',
    usedInEmsist: false,
    styleVariants: [],
  },
  {
    id: 'blockui',
    name: 'BlockUI',
    category: 'Misc',
    icon: 'phosphorProhibitThin',
    description: 'Block content interaction overlay.',
    usedInEmsist: false,
    styleVariants: [],
  },
  {
    id: 'inplace',
    name: 'Inplace',
    category: 'Misc',
    icon: 'phosphorPencilSimpleThin',
    description: 'In-place content editing.',
    usedInEmsist: false,
    styleVariants: [],
  },
  {
    id: 'metergroup',
    name: 'MeterGroup',
    category: 'Misc',
    icon: 'phosphorChartBarThin',
    description: 'Grouped meter visualization.',
    usedInEmsist: false,
    styleVariants: [],
  },
];

/**
 * Group catalog entries by category for sidebar display.
 * Within each group: used components first, then disabled ones.
 */
export function groupCatalogByCategory(entries?: readonly CatalogEntry[]): readonly CatalogGroup[] {
  const source = entries ?? COMPONENT_CATALOG;
  const categoryOrder: readonly CatalogCategory[] = [
    'Global',
    'Form',
    'Data',
    'Panel',
    'Layout',
    'Overlay',
    'Messages',
    'Navigation',
    'Media',
    'Misc',
  ];
  const grouped = new Map<CatalogCategory, CatalogEntry[]>();

  for (const entry of source) {
    const list = grouped.get(entry.category) ?? [];
    list.push(entry);
    grouped.set(entry.category, list);
  }

  return categoryOrder
    .filter((cat) => grouped.has(cat))
    .map((cat) => {
      const entries = grouped.get(cat)!;
      // Sort: used components first, then unused
      entries.sort((a, b) => {
        if (a.usedInEmsist === b.usedInEmsist) return 0;
        return a.usedInEmsist ? -1 : 1;
      });
      return { category: cat, entries };
    });
}
