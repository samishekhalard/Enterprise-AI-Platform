import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Component, computed, DestroyRef, inject, signal } from '@angular/core';
import {
  NavigationCancel,
  NavigationEnd,
  NavigationError,
  NavigationSkipped,
  Router,
  RouterOutlet,
} from '@angular/router';
import { filter } from 'rxjs';
import { Toast } from 'primeng/toast';
import { AuthFacade } from './core/auth/auth-facade';
import { BrandRuntimeService } from './core/theme/brand-runtime.service';
import { ShellLayoutComponent, ShellNavItem } from './layout/shell-layout/shell-layout.component';

@Component({
  selector: 'app-root',
  imports: [ShellLayoutComponent, RouterOutlet, Toast],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly auth = inject(AuthFacade);
  protected readonly brandRuntime = inject(BrandRuntimeService);
  private readonly currentUrl = signal(resolveInitialUrl(this.router));
  private readonly appReadyState = signal(this.router.navigated);

  protected readonly useShellLayout = computed(() => !isChromelessRoute(this.currentUrl()));
  protected readonly appReady = this.appReadyState.asReadonly();
  protected readonly isAuthenticated = this.auth.isAuthenticated;
  protected readonly shellTitle = computed(() => this.brandRuntime.appTitle());
  protected readonly shellSubtitle = computed(() => 'Tenant-aware branded shell');
  protected readonly splashText = computed(() => `Loading ${this.brandRuntime.appTitle()}...`);

  protected readonly navItems: readonly ShellNavItem[] = [
    { label: 'Administration', route: '/administration' },
    { label: 'Tenants', route: '/tenants' },
  ];

  constructor() {
    this.router.events
      .pipe(filter(isTerminalNavigationEvent), takeUntilDestroyed(this.destroyRef))
      .subscribe((event) => {
        this.currentUrl.set(event instanceof NavigationEnd ? event.urlAfterRedirects : event.url);
        this.appReadyState.set(true);
      });
  }

  protected onLogout(): void {
    this.auth.logout().subscribe();
  }
}

function isChromelessRoute(url: string): boolean {
  const path = url.split('?')[0];
  return (
    path === '/login' ||
    path === '/administration' ||
    path.startsWith('/administration/') ||
    path === '/auth' ||
    path.startsWith('/auth/')
  );
}

function resolveInitialUrl(router: Router): string {
  const routerUrl = router.url?.trim();
  if (routerUrl) {
    return routerUrl;
  }

  if (typeof window !== 'undefined') {
    return `${window.location.pathname}${window.location.search}`;
  }

  return '/';
}

function isTerminalNavigationEvent(
  event: unknown,
): event is NavigationEnd | NavigationCancel | NavigationError | NavigationSkipped {
  return (
    event instanceof NavigationEnd ||
    event instanceof NavigationCancel ||
    event instanceof NavigationError ||
    event instanceof NavigationSkipped
  );
}
