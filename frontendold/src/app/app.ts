import { Component, signal, computed, HostListener, HostBinding, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, NavigationEnd, RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { filter } from 'rxjs/operators';
import { AuthService } from './core/services/auth.service';
import { TokenService } from './core/services/token.service';
import { TenantResolverService } from './core/services/tenant-resolver.service';
import { environment } from '../environments/environment';
import { EmisiSkipLinkComponent } from 'emisi-ui';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive, EmisiSkipLinkComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  private router = inject(Router);
  private authService = inject(AuthService);
  private tokenService = inject(TokenService);
  private tenantResolver = inject(TenantResolverService);

  showUserDropdown = signal(false);
  showNavMenu = signal(false);
  currentRoute = signal('/');
  currentYear = new Date().getFullYear();
  readonly enableAiAssistant = environment.enableAiAssistant;

  // Check if we're on a chromeless page (no app shell header/footer)
  // Covers: login, error pages, auth callbacks, password reset
  isLoginPage = computed(() => {
    const route = this.currentRoute();
    return route.includes('/login')
      || route.includes('/errors/')
      || route.startsWith('/auth/');
  });

  // Get current user from token service
  currentUser = this.tokenService.user;

  // Get current tenant from resolver
  currentTenant = this.tenantResolver.tenant;

  // Check if user has admin role
  isAdmin = computed(() => {
    return this.tokenService.hasAnyRole(['ADMIN', 'SUPER_ADMIN']);
  });

  // Add class to host when on login page
  @HostBinding('class.login-active') get loginActive() {
    return this.isLoginPage();
  }

  @HostBinding('class.emisi-theme') readonly emisiThemeClass = true;

  constructor() {
    // Track current route
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: NavigationEnd) => {
      this.currentRoute.set(event.urlAfterRedirects);
    });

    // Set initial route
    this.currentRoute.set(this.router.url);
  }

  getPageName(): string {
    const route = this.currentRoute();
    if (route.includes('/products')) return 'Products';
    if (route.includes('/personas')) return 'Personas';
    if (route.includes('/process-modeler')) return 'Processes';
    if (route.includes('/administration')) return 'Administration';
    if (route.includes('/profile')) return 'Profile';
    return 'Home';
  }

  toggleNavMenu(): void {
    this.showNavMenu.update(v => !v);
    this.showUserDropdown.set(false);
  }

  toggleUserDropdown(): void {
    this.showUserDropdown.update(v => !v);
    this.showNavMenu.set(false);
  }

  getUserInitials(): string {
    const user = this.currentUser();
    if (!user) return 'U';

    const firstName = user.firstName || '';
    const lastName = user.lastName || '';

    if (firstName && lastName) {
      return (firstName[0] + lastName[0]).toUpperCase();
    }
    if (user.email) {
      return user.email.substring(0, 2).toUpperCase();
    }
    return 'U';
  }

  getUserDisplayName(): string {
    const user = this.currentUser();
    if (!user) return 'User';

    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    return user.email || 'User';
  }

  getTenantDisplayName(): string {
    const tenant = this.currentTenant();
    return tenant?.shortName || tenant?.fullName || 'Unknown Tenant';
  }

  logout(): void {
    this.showUserDropdown.set(false);
    this.authService.logout().subscribe();
  }

  navigateToProfile(): void {
    this.showUserDropdown.set(false);
    this.router.navigate(['/profile']);
  }

  openAiAssistant(): void {
    if (!this.enableAiAssistant) return;
    this.router.navigate(['/ai-assistant']);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.user-selector') && !target.closest('.user-btn')) {
      this.showUserDropdown.set(false);
    }
    if (!target.closest('.header-island-left') && !target.closest('.hamburger-btn')) {
      this.showNavMenu.set(false);
    }
  }

  @HostListener('document:keydown.escape')
  onEscapeKey(): void {
    this.showUserDropdown.set(false);
    this.showNavMenu.set(false);
  }
}
