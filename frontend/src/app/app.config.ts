import {
  ApplicationConfig,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { MessageService } from 'primeng/api';
import { providePrimeNG } from 'primeng/config';
import { AuthFacade } from './core/auth/auth-facade';
import { GatewayAuthFacadeService } from './core/auth/gateway-auth-facade.service';
import { initializeTenant } from './core/initializers/tenant.initializer';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { localeHeaderInterceptor } from './core/interceptors/locale-header.interceptor';
import { tenantHeaderInterceptor } from './core/interceptors/tenant-header.interceptor';
import { DefaultPrimePreset } from './core/theme/default-preset';
import { provideAppIcons } from './core/icons/provide-icons';

import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideAppIcons(),
    provideAppInitializer(initializeTenant),
    provideAnimationsAsync(),
    providePrimeNG({
      theme: {
        preset: DefaultPrimePreset,
        options: {
          prefix: 'p',
          darkModeSelector: '.app-dark-mode',
          cssLayer: {
            name: 'primeng',
            order: 'primeng',
          },
        },
      },
      ripple: false,
    }),
    provideRouter(routes),
    provideHttpClient(
      withInterceptors([localeHeaderInterceptor, tenantHeaderInterceptor, authInterceptor]),
    ),
    MessageService,
    {
      provide: AuthFacade,
      useExisting: GatewayAuthFacadeService,
    },
  ],
};
