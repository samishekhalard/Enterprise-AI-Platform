import { definePreset } from '@primeuix/themes';
import Aura from '@primeuix/themes/aura';

export const ThinkPlusPrimePreset = definePreset(Aura, {
  semantic: {
    primary: {
      50: '#edebe0',
      100: '#edebe0',
      200: '#edebe0',
      300: '#b9a779',
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
        primary: {
          color: '{primary.500}',
          inverseColor: '#ffffff',
          hoverColor: '{primary.600}',
          activeColor: '{primary.700}',
        },
      },
    },
  },
});
