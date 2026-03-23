import { Routes } from '@angular/router';

/**
 * Identity Providers Feature Routes
 *
 * These routes are designed to be lazy-loaded from the main app routes
 * or from an admin feature module.
 *
 * Usage in app.routes.ts:
 * ```typescript
 * {
 *   path: 'admin/identity-providers',
 *   loadChildren: () =>
 *     import('./features/admin/identity-providers/identity-providers.routes')
 *       .then(m => m.IDENTITY_PROVIDER_ROUTES),
 *   canActivate: [authGuard],
 *   data: { roles: ['ADMIN', 'SUPER_ADMIN'] }
 * }
 * ```
 */
export const IDENTITY_PROVIDER_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/provider-management.page').then(m => m.ProviderManagementPage),
    title: 'Identity Providers'
  },
  {
    path: 'new',
    loadComponent: () =>
      import('./pages/provider-management.page').then(m => m.ProviderManagementPage),
    title: 'Add Identity Provider'
  },
  {
    path: ':providerId/edit',
    loadComponent: () =>
      import('./pages/provider-management.page').then(m => m.ProviderManagementPage),
    title: 'Edit Identity Provider'
  }
];

export default IDENTITY_PROVIDER_ROUTES;
