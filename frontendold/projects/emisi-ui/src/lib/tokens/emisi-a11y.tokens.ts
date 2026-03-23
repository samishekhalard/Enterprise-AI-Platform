export const EMISI_TOUCH_TARGET_MIN = 44;

export const EMISI_BREAKPOINTS = {
  mobileMax: 599,
  tabletMin: 600,
  tabletMax: 1023,
  desktopMin: 1024,
  wideMin: 1440
} as const;

export const EMISI_WCAG_TARGETS = {
  A: {
    minContrastText: 3,
    minContrastUi: 3
  },
  AA: {
    minContrastText: 4.5,
    minContrastLargeText: 3,
    minContrastUi: 3
  },
  AAA: {
    minContrastText: 7,
    minContrastLargeText: 4.5,
    minContrastUi: 3
  }
} as const;

export type EmisiWcagLevel = keyof typeof EMISI_WCAG_TARGETS;

export interface EmisiKeyboardHint {
  keys: string[];
  description: string;
  ariaLabel?: string;
}
