import { definePreset } from '@primeuix/themes';
import Aura from '@primeuix/themes/aura';

export const DefaultPrimePreset = definePreset(Aura, {
  semantic: {
    primary: {
      50: '#F2EFE9',
      100: '#F2EFE9',
      200: '#F2EFE9',
      300: '#8FB8AE',
      400: '#428177',
      500: '#428177',
      600: '#428177',
      700: '#054239',
      800: '#054239',
      900: '#002623',
      950: '#002623',
    },
    colorScheme: {
      light: {
        surface: {
          0: '#FAF8F4',
          50: '#FAF8F4',
          100: '#F2EFE9',
          200: '#E0DDDA',
          300: '#D4D1CC',
          400: '#999590',
          500: '#3d3a3b',
          600: '#2A241C',
          700: '#002623',
          800: '#002623',
          900: '#002623',
          950: '#002623',
        },
        primary: {
          color: '{primary.500}',
          contrastColor: '#FAF8F5',
          hoverColor: '{primary.600}',
          activeColor: '{primary.700}',
        },
      },
    },
  },
});
