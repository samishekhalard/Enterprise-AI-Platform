const MODAL_MASK_STYLE = {
  background: 'color-mix(in srgb, var(--tp-text-dark) 35%, transparent)',
  'backdrop-filter': 'blur(2px)',
} as const;

const BASE_DIALOG_ROOT_STYLE = {
  'border-radius': 'var(--nm-radius-xl)',
  overflow: 'hidden',
} as const;

const BASE_DIALOG_HEADER_STYLE = {
  background: 'var(--tp-surface-raised)',
  padding: 'var(--tp-space-4) var(--tp-space-5)',
  color: 'var(--tp-text-dark)',
  'border-block-end': '1px solid var(--tp-border)',
  'align-items': 'flex-start',
} as const;

const BASE_DIALOG_CONTENT_STYLE = {
  background: 'var(--tp-surface-raised)',
  padding: 'var(--tp-space-4) var(--tp-space-5)',
} as const;

const BASE_DIALOG_FOOTER_STYLE = {
  background: 'var(--tp-surface-raised)',
  padding: 'var(--tp-space-3) var(--tp-space-5)',
  'border-block-start': '1px solid var(--tp-border)',
  display: 'flex',
  'justify-content': 'flex-end',
  gap: 'var(--tp-space-2)',
  'flex-wrap': 'wrap',
} as const;

export const MOBILE_DIALOG_BREAKPOINTS = { '768px': '92vw' } as const;
export const DRAWER_DIALOG_BREAKPOINTS = { '1024px': '100vw' } as const;
export const SOURCE_WIZARD_DIALOG_BREAKPOINTS = {
  '960px': '95vw',
  '640px': '100vw',
} as const;

export const HELP_DIALOG_STYLE = {
  width: 'min(420px, calc(100vw - 2rem))',
} as const;

export const COMPACT_DIALOG_STYLE = {
  width: 'min(32rem, 92vw)',
} as const;

export const MEDIUM_DIALOG_STYLE = {
  width: 'min(36rem, 92vw)',
} as const;

export const FORM_DIALOG_STYLE = {
  width: 'min(40rem, 92vw)',
} as const;

export const WIZARD_DIALOG_STYLE = {
  width: 'min(40rem, 96vw)',
  maxHeight: '90vh',
} as const;

export const SOURCE_WIZARD_DIALOG_STYLE = {
  width: 'min(72rem, 95vw)',
} as const;

export const DRAWER_DIALOG_STYLE = {
  width: 'min(42rem, 100vw)',
  maxWidth: '100vw',
  height: '100vh',
  margin: '0',
} as const;

export const DETAIL_DRAWER_DIALOG_STYLE = {
  width: 'min(38rem, 100vw)',
  maxWidth: '100vw',
  height: '100vh',
  margin: '0',
} as const;

export const REMOVE_DIALOG_STYLE = {
  width: 'min(30rem, 92vw)',
} as const;

export const SESSIONS_DIALOG_STYLE = {
  width: 'min(51.25rem, 96vw)',
  maxHeight: '90vh',
} as const;

export const standardDialogPt = {
  root: {
    style: BASE_DIALOG_ROOT_STYLE,
  },
  header: {
    style: BASE_DIALOG_HEADER_STYLE,
  },
  content: {
    style: BASE_DIALOG_CONTENT_STYLE,
  },
  footer: {
    style: BASE_DIALOG_FOOTER_STYLE,
  },
  mask: {
    style: MODAL_MASK_STYLE,
  },
} as const;

export const wizardDialogPt = {
  root: {
    style: BASE_DIALOG_ROOT_STYLE,
  },
  header: {
    style: {
      ...BASE_DIALOG_HEADER_STYLE,
      padding: 'var(--tp-space-4) var(--tp-space-5) var(--tp-space-3)',
    },
  },
  content: {
    style: {
      background: 'var(--tp-surface-raised)',
      padding: '0',
    },
  },
  footer: {
    style: BASE_DIALOG_FOOTER_STYLE,
  },
  mask: {
    style: MODAL_MASK_STYLE,
  },
} as const;

export const drawerDialogPt = {
  root: {
    style: {
      overflow: 'hidden',
      'border-radius': '0',
    },
  },
  header: {
    style: BASE_DIALOG_HEADER_STYLE,
  },
  content: {
    style: {
      background: 'var(--tp-bg)',
      padding: '0',
    },
  },
  footer: {
    style: {
      ...BASE_DIALOG_FOOTER_STYLE,
      background: 'var(--tp-surface)',
    },
  },
  mask: {
    style: {
      background: 'color-mix(in srgb, var(--tp-text-dark) 32%, transparent)',
      'backdrop-filter': 'blur(2px)',
    },
  },
} as const;

export const helpDialogPt = {
  root: {
    style: BASE_DIALOG_ROOT_STYLE,
  },
  header: {
    style: BASE_DIALOG_HEADER_STYLE,
  },
  content: {
    style: {
      background: 'var(--tp-surface-raised)',
      padding: 'var(--tp-space-5) var(--tp-space-6)',
    },
  },
  mask: {
    style: MODAL_MASK_STYLE,
  },
} as const;

export const dangerDialogPt = {
  root: {
    style: BASE_DIALOG_ROOT_STYLE,
  },
  header: {
    style: {
      ...BASE_DIALOG_HEADER_STYLE,
      'border-block-end': '1px solid color-mix(in srgb, var(--tp-danger) 18%, transparent)',
    },
  },
  content: {
    style: {
      background: 'var(--tp-surface-raised)',
      padding: '0',
    },
  },
  footer: {
    style: BASE_DIALOG_FOOTER_STYLE,
  },
  mask: {
    style: MODAL_MASK_STYLE,
  },
} as const;
