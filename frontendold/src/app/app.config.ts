import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
  APP_INITIALIZER
} from '@angular/core';
import { provideRouter, withComponentInputBinding, withViewTransitions } from '@angular/router';
import { provideHttpClient, withInterceptors, withFetch } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { providePrimeNG } from 'primeng/config';
import { routes } from './app.routes';
import { initializeTenant } from './core/initializers/tenant.initializer';
import { authInterceptor, loggingInterceptor } from './core/interceptors/auth.interceptor';
import { EmisiPrimePreset } from 'emisi-ui';

// Auth Facade - Abstract DI Token and Implementation
import { AuthFacade, KeycloakAuthFacade } from './core/auth';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),

    // =========================================================================
    // PrimeNG Configuration (EMISI Design System)
    // =========================================================================
    provideAnimationsAsync(),
    providePrimeNG({
      theme: {
        preset: EmisiPrimePreset,
        options: {
          prefix: 'p',
          darkModeSelector: '.dark-mode',
          cssLayer: {
            name: 'primeng',
            order: 'primeng, emisi'
          }
        }
      },
      ripple: false
    }),

    // =========================================================================
    // Auth Facade (Provider-Agnostic Authentication)
    // =========================================================================
    // To switch providers, change the useClass:
    // - KeycloakAuthFacade: Keycloak via BFF pattern
    // - Auth0AuthFacade: Auth0 (create implementation)
    { provide: AuthFacade, useClass: KeycloakAuthFacade },

    // Router with enhanced features
    provideRouter(
      routes,
      withComponentInputBinding(),
      withViewTransitions()
    ),

    // HTTP Client with fetch API and interceptors
    provideHttpClient(
      withFetch(),
      withInterceptors([
        loggingInterceptor,  // Log requests in development
        authInterceptor      // Add auth headers, handle 401/403
      ])
    ),

    // Tenant initialization - resolves tenant from hostname before app renders
    {
      provide: APP_INITIALIZER,
      useFactory: initializeTenant,
      multi: true
    }
  ]
};
