import { definePreset } from '@primeuix/styled';
import Aura from '@primeuix/themes/aura';

/**
 * ThinkPLUS Custom PrimeNG Preset
 *
 * Maps the ThinkPLUS design system tokens (--tp-*) to PrimeNG's
 * 3-tier design token architecture (primitive → semantic → component).
 *
 * Based on Aura preset with ThinkPLUS brand overrides.
 */
export const ThinkPlusPreset = definePreset(Aura, {
  primitive: {
    // ThinkPLUS Teal (Primary Brand)
    // Core brand: #047481 (teal.600), dark hover: #035a66 (teal.700)
    teal: {
      50: '#f0fdfa',
      100: '#ccfbf1',
      200: '#99f6e4',
      300: '#5ee7f7',
      400: '#2dd4bf',
      500: '#058a99',
      600: '#047481',
      700: '#035a66',
      800: '#024e5a',
      900: '#013d47',
      950: '#012a32'
    },
    // Neutral Gray Scale (WCAG AAA compliant)
    slate: {
      50: '#f7fafc',
      100: '#edf2f7',
      200: '#e2e8f0',
      300: '#cbd5e0',
      400: '#545e6e',
      500: '#454e5c',
      600: '#2d3748',
      700: '#1a202c',
      800: '#171923',
      900: '#0d0f12',
      950: '#080a0d'
    },
    // Border radius matching ThinkPLUS design system
    borderRadius: {
      none: '0',
      xs: '2px',
      sm: '0.375rem',
      md: '0.5rem',
      lg: '0.75rem',
      xl: '1rem'
    }
  },
  semantic: {
    // Primary color mapped to ThinkPLUS Teal
    primary: {
      50: '{teal.50}',
      100: '{teal.100}',
      200: '{teal.200}',
      300: '{teal.300}',
      400: '{teal.400}',
      500: '{teal.500}',
      600: '{teal.600}',
      700: '{teal.700}',
      800: '{teal.800}',
      900: '{teal.900}',
      950: '{teal.950}'
    },
    // Semantic tokens
    focusRing: {
      width: '2px',
      style: 'solid',
      color: '{primary.500}',
      offset: '2px',
      shadow: '0 0 0 3px rgba(4, 116, 129, 0.4)'
    },
    // Content
    content: {
      borderRadius: '{border.radius.md}'
    },
    // Form fields
    formField: {
      borderRadius: '{border.radius.md}',
      focusRing: {
        width: '2px',
        style: 'solid',
        color: '{primary.500}',
        offset: '2px',
        shadow: '0 0 0 3px rgba(4, 116, 129, 0.25)'
      }
    },
    // Color schemes
    colorScheme: {
      light: {
        primary: {
          color: '{teal.600}',
          contrastColor: '#ffffff',
          hoverColor: '{teal.700}',
          activeColor: '{teal.800}'
        },
        surface: {
          0: '#ffffff',
          50: '#f7fafc',
          100: '#edf2f7',
          200: '#e2e8f0',
          300: '#cbd5e0',
          400: '#545e6e',
          500: '#454e5c',
          600: '#2d3748',
          700: '#1a202c',
          800: '#171923',
          900: '#0d0f12',
          950: '#080a0d'
        },
        text: {
          color: '{surface.700}',
          hoverColor: '{surface.800}',
          mutedColor: '{surface.400}',
          hoverMutedColor: '{surface.500}'
        },
        highlight: {
          background: 'color-mix(in srgb, {primary.color}, transparent 90%)',
          focusBackground: 'color-mix(in srgb, {primary.color}, transparent 76%)',
          color: '{primary.700}',
          focusColor: '{primary.800}'
        }
      },
      dark: {
        primary: {
          color: '{teal.300}',
          contrastColor: '{surface.900}',
          hoverColor: '{teal.200}',
          activeColor: '{teal.100}'
        },
        surface: {
          0: '#080a0d',
          50: '#0d0f12',
          100: '#171923',
          200: '#1a202c',
          300: '#2d3748',
          400: '#454e5c',
          500: '#545e6e',
          600: '#cbd5e0',
          700: '#e2e8f0',
          800: '#edf2f7',
          900: '#f7fafc',
          950: '#ffffff'
        },
        highlight: {
          background: 'color-mix(in srgb, {primary.color}, transparent 84%)',
          focusBackground: 'color-mix(in srgb, {primary.color}, transparent 76%)',
          color: 'rgba(255,255,255,.87)',
          focusColor: 'rgba(255,255,255,.87)'
        }
      }
    }
  }
});
