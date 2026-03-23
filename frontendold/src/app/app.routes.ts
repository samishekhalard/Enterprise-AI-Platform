import { Routes } from '@angular/router';
import { authGuard, guestGuard, mfaGuard, landingRedirectGuard } from './core/guards/auth.guard';
import { environment } from '../environments/environment';

const aiAssistantRoutes: Routes = environment.enableAiAssistant
  ? [
      {
        path: 'ai-assistant',
        loadComponent: () => import('./pages/ai-assistant/ai-assistant.page').then(m => m.AiAssistantPage),
        canActivate: [authGuard]
      }
    ]
  : [];

export const routes: Routes = [
  // =========================================================================
  // Landing Page - Redirects based on tenant type
  // =========================================================================
  {
    path: '',
    pathMatch: 'full',
    canActivate: [landingRedirectGuard],
    // Empty component - guard will redirect
    loadComponent: () => import('./pages/landing/landing.page').then(m => m.LandingPage)
  },
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login.page').then(m => m.LoginPage),
    canActivate: [guestGuard]
  },

  // =========================================================================
  // Auth Callback Routes
  // =========================================================================
  {
    path: 'auth/callback',
    loadComponent: () => import('./pages/auth/callback/callback.page').then(m => m.CallbackPage)
  },
  {
    path: 'auth/uaepass/callback',
    loadComponent: () => import('./pages/auth/uaepass/uaepass-callback.page').then(m => m.UaepassCallbackPage)
  },
  {
    path: 'auth/saml/acs',
    loadComponent: () => import('./pages/auth/saml/saml-acs.page').then(m => m.SamlAcsPage)
  },
  {
    path: 'auth/mfa/verify',
    loadComponent: () => import('./pages/auth/mfa/mfa-verify.page').then(m => m.MfaVerifyPage),
    canActivate: [mfaGuard]
  },
  {
    path: 'auth/mfa/setup',
    loadComponent: () => import('./pages/auth/mfa/mfa-setup.page').then(m => m.MfaSetupPage),
    canActivate: [authGuard]
  },
  {
    path: 'auth/password-reset',
    loadComponent: () => import('./pages/auth/password-reset/password-reset.page').then(m => m.PasswordResetPage)
  },
  {
    path: 'auth/password-reset/confirm',
    loadComponent: () => import('./pages/auth/password-reset/password-reset-confirm.page').then(m => m.PasswordResetConfirmPage)
  },
  {
    path: 'auth/logout',
    loadComponent: () => import('./pages/auth/logout/logout.page').then(m => m.LogoutPage)
  },

  // =========================================================================
  // Protected Routes
  // =========================================================================
  {
    path: 'products',
    loadComponent: () => import('./pages/products/products.page').then(m => m.ProductsPage),
    canActivate: [authGuard]
  },
  {
    path: 'personas',
    loadComponent: () => import('./pages/personas/personas.page').then(m => m.PersonasPage),
    canActivate: [authGuard]
  },
  {
    path: 'process-modeler',
    loadComponent: () => import('./pages/process-modeler/process-modeler.page').then(m => m.ProcessModelerPage),
    canActivate: [authGuard]
  },
  {
    path: 'administration',
    loadComponent: () => import('./pages/administration/administration.page').then(m => m.AdministrationPage),
    canActivate: [authGuard]
  },
  {
    path: 'admin/identity-providers',
    loadChildren: () =>
      import('./features/admin/identity-providers/identity-providers.routes')
        .then(m => m.IDENTITY_PROVIDER_ROUTES),
    canActivate: [authGuard],
    data: { roles: ['ADMIN', 'SUPER_ADMIN'] }
  },
  {
    path: 'profile',
    loadComponent: () => import('./pages/profile/profile.page').then(m => m.ProfilePage),
    canActivate: [authGuard]
  },
  ...aiAssistantRoutes,

  // =========================================================================
  // Error Routes
  // =========================================================================
  {
    path: 'errors/tenant-not-found',
    loadComponent: () => import('./pages/errors/tenant-not-found.page').then(m => m.TenantNotFoundPage)
  },
  {
    path: 'errors/access-denied',
    loadComponent: () => import('./pages/errors/access-denied.page').then(m => m.AccessDeniedPage)
  },
  {
    path: 'errors/session-expired',
    loadComponent: () => import('./pages/errors/session-expired.page').then(m => m.SessionExpiredPage)
  },

  // =========================================================================
  // Wildcard - Redirect to landing page (which determines correct destination)
  // =========================================================================
  {
    path: '**',
    redirectTo: ''
  }
];
