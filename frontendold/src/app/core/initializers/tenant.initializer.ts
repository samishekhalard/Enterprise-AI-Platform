import { inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { TenantResolverService } from '../services/tenant-resolver.service';
import { ThemeService } from '../services/theme.service';
// Force recompile - fixes applied 2026-02-26

/**
 * Tenant Initializer
 *
 * This factory function is used with APP_INITIALIZER to resolve
 * the tenant and apply branding before the application renders.
 *
 * Flow:
 * 1. Resolve tenant from current hostname (cache first, then HTTP)
 * 2. Apply tenant branding via ThemeService
 * 3. If tenant not found, set error state — do NOT redirect
 *
 * IMPORTANT: The initializer must NEVER forcefully redirect the user.
 * On page refresh, the user stays on their current route. Route guards
 * and individual pages handle the "no tenant" case gracefully.
 *
 * Usage in app.config.ts:
 * providers: [
 *   {
 *     provide: APP_INITIALIZER,
 *     useFactory: initializeTenant,
 *     deps: [TenantResolverService, ThemeService],
 *     multi: true
 *   }
 * ]
 */
export function initializeTenant(): () => Promise<boolean> {
  const tenantResolver = inject(TenantResolverService);
  const themeService = inject(ThemeService);

  return async (): Promise<boolean> => {
    try {
      // Resolve tenant from hostname (uses sessionStorage cache if valid)
      const tenant = await firstValueFrom(tenantResolver.resolveTenant());

      if (!tenant) {
        // Tenant not found — apply default branding and continue.
        // The login page and route guards handle the no-tenant state.
        console.warn('Tenant not found for current hostname — continuing with defaults');
        themeService.resetTheme();
        return true;
      }

      // Check tenant status
      if (tenant.status !== 'active') {
        console.warn('Tenant is not active:', tenant.status);
        themeService.resetTheme();
        return true;
      }

      // Apply tenant branding
      themeService.applyTheme(tenant.branding);

      // Update document title
      updateDocumentTitle(tenant.shortName);

      console.log(`Tenant resolved: ${tenant.fullName} (${tenant.slug})`);
      return true;
    } catch (error) {
      console.error('Failed to initialize tenant:', error);

      // On error, apply default branding and continue
      // The app will work with limited functionality
      themeService.resetTheme();

      return true; // Don't block app initialization
    }
  };
}

/**
 * Update document title with tenant name
 */
function updateDocumentTitle(tenantName: string): void {
  const baseTitle = document.title || 'Persona Studio';

  // Only update if not already containing tenant name
  if (!document.title.includes(tenantName)) {
    document.title = `${tenantName} | ${baseTitle}`;
  }
}
