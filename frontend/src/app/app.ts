import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { AuthFacade } from './core/auth/auth-facade';
import { ShellLayoutComponent, ShellNavItem } from './layout/shell-layout/shell-layout.component';

@Component({
  selector: 'app-root',
  imports: [ShellLayoutComponent, RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly auth = inject(AuthFacade);
  private readonly currentUrl = signal(resolveInitialUrl(this.router));
  private readonly appReadyState = signal(this.router.navigated);

  protected readonly useShellLayout = computed(() => !isChromelessRoute(this.currentUrl()));
  protected readonly appReady = this.appReadyState.asReadonly();
  protected readonly isAuthenticated = this.auth.isAuthenticated;

  protected readonly navItems: readonly ShellNavItem[] = [
    { label: 'Administration', route: '/administration' },
    { label: 'Tenants', route: '/tenants' },
  ];

  constructor() {
    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((event) => {
        this.currentUrl.set(event.urlAfterRedirects);
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
