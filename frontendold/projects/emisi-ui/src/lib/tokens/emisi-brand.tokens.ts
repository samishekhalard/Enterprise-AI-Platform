export type EmisiRadiusScale = 'sm' | 'md' | 'lg' | 'xl' | '2xl';

export interface EmisiBrandTokens {
  color: {
    primary: string;
    primaryDark: string;
    primaryLight: string;
    secondary: string;
    background: string;
    surface: string;
    text: string;
    textSecondary: string;
    textMuted: string;
    border: string;
    success: string;
    warning: string;
    danger: string;
    info: string;
  };
  font: {
    sans: string;
    mono: string;
  };
  radius: Record<EmisiRadiusScale, string>;
  shadow: {
    sm: string;
    md: string;
    lg: string;
    glowPrimary: string;
    neuRaised: string;
    neuInset: string;
  };
}

export const EMISI_BRAND_TOKENS: EmisiBrandTokens = {
  color: {
    primary: '#047481',
    primaryDark: '#035a66',
    primaryLight: '#5ee7f7',
    secondary: '#2c5282',
    background: '#faf9f5',
    surface: '#ffffff',
    text: '#1a202c',
    textSecondary: '#454e5c',
    textMuted: '#545e6e',
    border: '#e2e8f0',
    success: '#276749',
    warning: '#c05621',
    danger: '#c53030',
    info: '#2b6cb0'
  },
  font: {
    sans: "'Gotham Rounded', 'Nunito', -apple-system, BlinkMacSystemFont, sans-serif",
    mono: "'SF Mono', Monaco, 'Cascadia Code', monospace"
  },
  radius: {
    sm: '0.375rem',
    md: '0.5rem',
    lg: '0.75rem',
    xl: '1rem',
    '2xl': '1.25rem'
  },
  shadow: {
    sm: '0 1px 2px rgba(0, 0, 0, 0.04), 0 1px 3px rgba(0, 0, 0, 0.06)',
    md: '0 2px 4px rgba(0, 0, 0, 0.04), 0 4px 8px rgba(0, 0, 0, 0.06)',
    lg: '0 4px 8px rgba(0, 0, 0, 0.04), 0 8px 16px rgba(0, 0, 0, 0.06), 0 16px 32px rgba(0, 0, 0, 0.04)',
    glowPrimary: '0 4px 14px rgba(4, 116, 129, 0.25)',
    neuRaised: '6px 6px 14px rgba(160, 152, 132, 0.5), -6px -6px 14px rgba(255, 255, 255, 0.9)',
    neuInset: 'inset 4px 4px 8px rgba(160, 152, 132, 0.35), inset -4px -4px 8px rgba(255, 255, 255, 0.7)'
  }
};
