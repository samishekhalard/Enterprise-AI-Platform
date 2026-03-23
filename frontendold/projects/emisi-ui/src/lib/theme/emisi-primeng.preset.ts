import { definePreset } from '@primeuix/styled';
import Aura from '@primeuix/themes/aura';

export const EmisiPrimePreset = definePreset(Aura, {
  primitive: {
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
    focusRing: {
      width: '2px',
      style: 'solid',
      color: '{primary.500}',
      offset: '2px',
      shadow: '0 0 0 3px rgba(4, 116, 129, 0.4)'
    },
    formField: {
      borderRadius: '{border.radius.md}'
    },
    colorScheme: {
      light: {
        primary: {
          color: '{teal.600}',
          contrastColor: '#ffffff',
          hoverColor: '{teal.700}',
          activeColor: '{teal.800}'
        }
      }
    }
  }
});
