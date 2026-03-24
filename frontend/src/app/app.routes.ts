import { Routes } from '@angular/router';
import { authGuard } from './core/auth/auth.guard';
import { environment } from '../environments/environment';

const DEFAULT_LANDING_ROUTE = normalizeRoute(environment.defaultLandingRoute);

export const routes: Routes = [
  { path: 'login', pathMatch: 'full', redirectTo: 'auth/login' },
  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/dashboard/dashboard.page').then((m) => m.DashboardPageComponent),
  },
  {
    path: 'profile',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/profile/profile.page').then((m) => m.ProfilePageComponent),
  },
  {
    path: 'administration',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/administration/administration.page').then(
        (m) => m.AdministrationPageComponent,
      ),
  },
  {
    path: 'tenants',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/tenants/tenants.page').then((m) => m.TenantsPageComponent),
  },
  {
    path: 'notifications',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/notifications/notifications-page.component').then(
        (m) => m.NotificationsPageComponent,
      ),
  },
  {
    path: 'auth/login',
    loadComponent: () => import('./features/auth/login.page').then((m) => m.LoginPageComponent),
  },
  {
    path: 'auth/password-reset',
    loadComponent: () =>
      import('./features/auth/password-reset/password-reset-request.page').then(
        (m) => m.PasswordResetRequestPageComponent,
      ),
  },
  {
    path: 'auth/password-reset/confirm',
    loadComponent: () =>
      import('./features/auth/password-reset/password-reset-confirm.page').then(
        (m) => m.PasswordResetConfirmPageComponent,
      ),
  },
  {
    path: 'error/access-denied',
    loadComponent: () =>
      import('./features/errors/access-denied.page').then((m) => m.AccessDeniedPageComponent),
  },
  {
    path: 'error/session-expired',
    loadComponent: () =>
      import('./features/errors/session-expired.page').then((m) => m.SessionExpiredPageComponent),
  },
  {
    path: 'error/tenant-not-found',
    loadComponent: () =>
      import('./features/errors/tenant-not-found.page').then((m) => m.TenantNotFoundPageComponent),
  },
  { path: '', pathMatch: 'full', redirectTo: DEFAULT_LANDING_ROUTE },
  { path: '**', redirectTo: DEFAULT_LANDING_ROUTE },
];

function normalizeRoute(value: string | undefined): string {
  if (!value) {
    return 'dashboard';
  }

  const normalized = value.replace(/^\/+/, '').trim();
  return normalized.length > 0 ? normalized : 'dashboard';
}
