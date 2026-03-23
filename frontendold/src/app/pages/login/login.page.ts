import { Component, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { TenantResolverService } from '../../core/services/tenant-resolver.service';
import { AuthService } from '../../core/services/auth.service';
import { AuthProviderConfig } from '../../models/tenant.model';
import { EmisiKeyboardHint, EmisiKeyboardHintsComponent, EmisiSurfaceCardComponent } from 'emisi-ui';
import { Dialog } from 'primeng/dialog';

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, EmisiSurfaceCardComponent, EmisiKeyboardHintsComponent, Dialog],
  template: `
    <div class="login-page">
      <!-- Background -->
      <div class="background-pattern"></div>
      <div class="background-gradient"></div>

      <!-- Header -->
      <header class="login-header">
        <a routerLink="/" class="logo-link">
          <img [src]="tenantLogo()" [alt]="tenantName()" class="header-logo" />
          @if (tenantTagline()) {
            <span class="tagline">{{ tenantTagline() }}</span>
          }
        </a>
        <button class="lang-selector"
                type="button"
                (click)="toggleLangMenu()"
                aria-label="Change language"
                aria-haspopup="menu"
                [attr.aria-expanded]="showLangMenu()">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="2" y1="12" x2="22" y2="12"/>
            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
          </svg>
          English
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </button>
        @if (showLangMenu()) {
          <div class="lang-menu-backdrop" (click)="showLangMenu.set(false)"></div>
          <div class="lang-menu" role="menu" aria-label="Language selector">
            <button type="button" role="menuitem" (click)="showLangMenu.set(false)">English</button>
            <button type="button" role="menuitem" (click)="showLangMenu.set(false)">العربية</button>
          </div>
        }
      </header>

      <!-- Main Content -->
      <main class="login-content">
        <!-- Logo + Welcome — always visible above the glass card -->
        <div class="welcome-section">
          <a routerLink="/" class="welcome-logo-link">
            <img [src]="tenantLogo()" [alt]="tenantName()" class="welcome-logo" />
          </a>
          <h1 class="welcome-title">Welcome to {{ tenantName() }}</h1>
          <p class="welcome-subtitle">Empower. Transform. Succeed.</p>
        </div>

        <!-- Sign In Section - Dynamic Auth Providers -->
        @if (!showLoginForm()) {
          <div class="signin-section" [attr.aria-busy]="loading()">
            <!-- SSO Providers (Primary first, then others) -->
            @for (provider of ssoProviders(); track provider.id) {
              <button
                type="button"
                class="sso-btn"
                [class]="'sso-btn--' + provider.type"
                [class.primary]="provider.isPrimary"
                (click)="signInWithSSO(provider)"
                [disabled]="loading()"
                [attr.aria-label]="'Sign in with ' + provider.displayName">
                @switch (provider.type) {
                  @case ('azure-ad') {
                    <svg class="provider-logo" viewBox="0 0 21 21" xmlns="http://www.w3.org/2000/svg">
                      <rect x="1" y="1" width="9" height="9" fill="#f25022"/>
                      <rect x="11" y="1" width="9" height="9" fill="#7fba00"/>
                      <rect x="1" y="11" width="9" height="9" fill="#00a4ef"/>
                      <rect x="11" y="11" width="9" height="9" fill="#ffb900"/>
                    </svg>
                  }
                  @case ('uaepass') {
                    <svg class="provider-logo uaepass-logo" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
                    </svg>
                  }
                  @case ('google') {
                    <svg class="provider-logo" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                  }
                  @case ('oidc') {
                    <svg class="provider-logo" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 6c1.4 0 2.8 1.1 2.8 2.5V11c.6.3 1 .9 1 1.5v3c0 1-.8 1.8-1.8 1.8h-4c-1 0-1.8-.8-1.8-1.8v-3c0-.7.4-1.3 1-1.5V9.5C9.2 8.1 10.6 7 12 7zm0 1.2c-.8 0-1.5.7-1.5 1.5v1.6h3V9.7c0-.8-.7-1.5-1.5-1.5z"/>
                    </svg>
                  }
                  @case ('saml') {
                    <svg class="provider-logo" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zM9 6c0-1.66 1.34-3 3-3s3 1.34 3 3v2H9V6zm9 14H6V10h12v10zm-6-3c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2z"/>
                    </svg>
                  }
                }
                Sign in with {{ provider.displayName }}
              </button>
            }

            <!-- Show divider if we have both SSO and local auth -->
            @if (ssoProviders().length > 0 && hasLocalAuth()) {
              <div class="divider-text">
                <span>or</span>
              </div>
            }

            <!-- Local Email/Password Auth -->
            @if (hasLocalAuth()) {
              <button type="button" class="signin-btn" (click)="showLoginForm.set(true)">
                <svg class="email-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                  <polyline points="22,6 12,13 2,6"/>
                </svg>
                Sign in with Email
              </button>
            }

            <!-- No auth providers configured -->
            @if (enabledProviders().length === 0) {
              <div class="no-providers-message">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" y1="8" x2="12" y2="12"/>
                  <line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                <p>No authentication methods configured for this organization.</p>
                <p class="contact-admin">Please contact your administrator.</p>
              </div>
            }

            <p class="help-text">
              Having trouble signing in?
              <a [href]="'mailto:' + supportEmail()">Contact support</a>
              @if (supportPhone()) {
                or call <a [href]="'tel:' + supportPhone()">{{ supportPhone() }}</a>
              }
            </p>

            <button type="button" class="kbd-modal-btn"
                    (click)="showKeyboardModal.set(true)"
                    aria-label="Show keyboard shortcuts">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="2" y="4" width="20" height="16" rx="2"/>
                <path d="M6 8h.01M10 8h.01M14 8h.01M18 8h.01M6 12h.01M10 12h.01M14 12h.01M18 12h.01M8 16h8"/>
              </svg>
              Keyboard Shortcuts
            </button>
          </div>
        } @else {
          <!-- Login Form -->
          <emisi-surface-card class="login-form-container" variant="raised" padding="lg">
            <div class="form-header">
              <h2 class="form-title">Sign in</h2>
            </div>
            <form (ngSubmit)="onSubmit()" novalidate>
              <div class="form-group">
                <label for="email">Email</label>
                <div class="input-wrapper" [class.focused]="emailFocused()" [class.error]="emailError()">
                  <svg class="input-icon" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
                    <path fill="currentColor" d="M256 0c-74.439 0-135 60.561-135 135s60.561 135 135 135 135-60.561 135-135S330.439 0 256 0zM423.966 358.195C387.006 320.667 338.009 300 286 300h-60c-52.008 0-101.006 20.667-137.966 58.195C51.255 395.539 31 444.833 31 497c0 8.284 6.716 15 15 15h420c8.284 0 15-6.716 15-15 0-52.167-20.255-101.461-57.034-138.805z"/>
                  </svg>
                  <input
                    type="email"
                    id="email"
                    [(ngModel)]="email"
                    name="email"
                    placeholder="Enter your email"
                    (focus)="emailFocused.set(true)"
                    (blur)="emailFocused.set(false)"
                    autocomplete="email"
                    inputmode="email"
                    enterkeyhint="next"
                    [attr.aria-invalid]="emailError() ? 'true' : 'false'"
                    [attr.aria-describedby]="emailError() ? 'email-error' : null"
                    required>
                </div>
                @if (emailError()) {
                  <span id="email-error" class="field-error">{{ emailError() }}</span>
                }
              </div>

              <div class="form-group">
                <label for="password">Password</label>
                <div class="input-wrapper" [class.focused]="passwordFocused()" [class.error]="passwordError()">
                  <svg class="input-icon" viewBox="0 0 384 512" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
                    <path fill="currentColor" d="M336 192h-16v-64C320 57.406 262.594 0 192 0S64 57.406 64 128v64H48c-26.453 0-48 21.523-48 48v224c0 26.477 21.547 48 48 48h288c26.453 0 48-21.523 48-48V240c0-26.477-21.547-48-48-48zm-229.332-64c0-47.063 38.27-85.332 85.332-85.332s85.332 38.27 85.332 85.332v64H106.668zm0 0"/>
                  </svg>
                  <input
                    [type]="hidePassword() ? 'password' : 'text'"
                    id="password"
                    [(ngModel)]="password"
                    name="password"
                    placeholder="Enter your password"
                    (focus)="passwordFocused.set(true)"
                    (blur)="passwordFocused.set(false)"
                    autocomplete="current-password"
                    enterkeyhint="done"
                    [attr.aria-invalid]="passwordError() ? 'true' : 'false'"
                    [attr.aria-describedby]="passwordError() ? 'password-error' : null"
                    required>
                  <button type="button"
                          class="toggle-password"
                          (click)="hidePassword.set(!hidePassword())"
                          [attr.aria-label]="hidePassword() ? 'Show password' : 'Hide password'"
                          [attr.aria-pressed]="!hidePassword()">
                    @if (hidePassword()) {
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                        <line x1="1" y1="1" x2="23" y2="23"/>
                      </svg>
                    } @else {
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                        <circle cx="12" cy="12" r="3"/>
                      </svg>
                    }
                  </button>
                </div>
                @if (passwordError()) {
                  <span id="password-error" class="field-error">{{ passwordError() }}</span>
                }
              </div>

              <div class="form-actions-row">
                <a routerLink="/auth/password-reset" class="forgot-password-link">Forgot password?</a>
              </div>

              @if (errorMessage()) {
                <div class="error-message" role="alert" aria-live="assertive">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="12" y1="8" x2="12" y2="12"/>
                    <line x1="12" y1="16" x2="12.01" y2="16"/>
                  </svg>
                  {{ errorMessage() }}
                </div>
              }

              <button class="submit-btn" type="submit" [disabled]="loading()" [attr.aria-busy]="loading()">
                @if (loading()) {
                  <span class="spinner"></span>
                } @else {
                  Sign In
                }
              </button>

              <button type="button" class="back-btn" (click)="showLoginForm.set(false)">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="19" y1="12" x2="5" y2="12"/>
                  <polyline points="12 19 5 12 12 5"/>
                </svg>
                Back to sign in options
              </button>
            </form>
            <button type="button" class="kbd-modal-btn"
                    (click)="showKeyboardModal.set(true)"
                    aria-label="Show keyboard shortcuts">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="2" y="4" width="20" height="16" rx="2"/>
                <path d="M6 8h.01M10 8h.01M14 8h.01M18 8h.01M6 12h.01M10 12h.01M14 12h.01M18 12h.01M8 16h8"/>
              </svg>
              Keyboard Shortcuts
            </button>
          </emisi-surface-card>
        }
      </main>

      <p-dialog header="Keyboard Shortcuts"
                [(visible)]="showKeyboardModal"
                [modal]="true"
                [dismissableMask]="true"
                [draggable]="false"
                [resizable]="false"
                styleClass="kbd-shortcuts-dialog"
                [style]="{ width: '400px' }">
        <emisi-keyboard-hints title="" [compact]="false" [hints]="loginKeyboardHints" />
      </p-dialog>

      <!-- Footer -->
      <footer class="login-footer">
        <p>&copy; {{ currentYear }} {{ tenantName() }}. All rights reserved.</p>
      </footer>
    </div>
  `,
  styleUrl: './login.page.scss'
})
export class LoginPage {
  private tenantResolver = inject(TenantResolverService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  currentYear = new Date().getFullYear();

  email = '';
  password = '';

  emailFocused = signal(false);
  passwordFocused = signal(false);
  hidePassword = signal(true);
  loading = signal(false);
  emailError = signal<string | null>(null);
  passwordError = signal<string | null>(null);
  errorMessage = signal('');
  showLoginForm = signal(false);
  showLangMenu = signal(false);
  showKeyboardModal = signal(false);

  // Tenant-derived computed properties
  tenant = this.tenantResolver.tenant;

  tenantName = computed(() => this.tenant()?.shortName || this.tenant()?.fullName || 'Organization');

  tenantLogo = computed(() => this.tenant()?.branding?.logoUrl || 'assets/images/logo.svg');

  tenantTagline = computed(() => {
    // Could be stored in tenant config, for now use a default
    return 'Empower. Transform. Succeed.';
  });

  supportEmail = computed(() => 'support@thinkplus.ae');

  supportPhone = computed(() => '');
  readonly loginKeyboardHints: EmisiKeyboardHint[] = [
    { keys: ['Tab'], description: 'Move to next field' },
    { keys: ['Shift', 'Tab'], description: 'Move to previous field' },
    { keys: ['Enter'], description: 'Submit sign-in form' },
    { keys: ['Esc'], description: 'Close open menus' }
  ];

  // Get enabled auth providers from tenant config
  enabledProviders = computed(() => {
    const providers = this.tenant()?.authProviders || [];
    return providers.filter(p => p.isEnabled);
  });

  // SSO providers (everything except 'local')
  ssoProviders = computed(() => {
    const providers = this.enabledProviders();
    // Sort: primary first, then by display name
    return providers
      .filter(p => p.type !== 'local')
      .sort((a, b) => {
        if (a.isPrimary && !b.isPrimary) return -1;
        if (!a.isPrimary && b.isPrimary) return 1;
        return a.displayName.localeCompare(b.displayName);
      });
  });

  // Check if local (email/password) auth is enabled
  hasLocalAuth = computed(() => {
    return this.enabledProviders().some(p => p.type === 'local');
  });

  toggleLangMenu(): void {
    this.showLangMenu.update(v => !v);
  }

  onSubmit(): void {
    this.emailError.set(null);
    this.passwordError.set(null);
    this.errorMessage.set('');

    if (!this.email) {
      this.emailError.set('Email is required');
      return;
    }

    if (!this.password) {
      this.passwordError.set('Password is required');
      return;
    }

    this.loading.set(true);

    const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/administration';

    this.authService.login(this.email, this.password).subscribe({
      next: (response) => {
        this.loading.set(false);
        if (response.mfaRequired) {
          this.router.navigate(['/auth/mfa/verify']);
        } else {
          this.router.navigateByUrl(returnUrl);
        }
      },
      error: (error) => {
        this.loading.set(false);
        this.errorMessage.set(error.message || 'Invalid email or password');
      }
    });
  }

  signInWithSSO(provider: AuthProviderConfig): void {
    const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/administration';

    // Map provider type to AuthService social provider type
    const providerType = provider.type as 'azure-ad' | 'google' | 'uaepass';

    this.authService.initiateSocialLogin(providerType, returnUrl);
  }
}
