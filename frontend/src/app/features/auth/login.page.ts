import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, ParamMap, Router, RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { finalize } from 'rxjs';
import { AuthFacade } from '../../core/auth/auth-facade';
import { LoginResponse } from '../../core/api/models';
import { AuthUiTextService } from '../../core/i18n/auth-ui-text.service';
import { formatProblemHttpError } from '../../core/http/problem-detail';
import { PageFrameComponent } from '../../layout/page-frame/page-frame.component';
import { SessionService } from '../../core/services/session.service';
import { TenantContextService } from '../../core/services/tenant-context.service';
import { BrandRuntimeService } from '../../core/theme/brand-runtime.service';

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [
    ButtonModule,
    CommonModule,
    FormsModule,
    InputTextModule,
    RouterLink,
    PageFrameComponent,
  ],
  templateUrl: './login.page.html',
  styleUrl: './login.page.scss',
})
export class LoginPageComponent {
  private readonly auth = inject(AuthFacade);
  protected readonly authUiText = inject(AuthUiTextService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly session = inject(SessionService);
  private readonly tenantContext = inject(TenantContextService);
  protected readonly brandRuntime = inject(BrandRuntimeService);
  private readonly destroyRef = inject(DestroyRef);

  protected identifier = '';
  protected password = '';
  protected tenantId = this.tenantContext.tenantId() ?? '';

  protected readonly tenantName = computed(() => toTenantName(this.tenantContext.tenantName()));
  protected readonly brandHomeLabel = computed(() => `${this.brandRuntime.appTitle()} Home`);
  protected readonly loginLogoUrl = this.brandRuntime.loginLogoUrl;
  protected readonly brandFallbackLabel = computed(() => this.tenantName() || 'emsist');
  protected readonly loginBackgroundImage = computed(() => {
    const backgroundUrl = this.brandRuntime.loginBackgroundUrl();
    return backgroundUrl ? `url("${backgroundUrl}")` : 'none';
  });
  protected readonly showLoginForm = signal(false);
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly info = signal<string | null>(null);
  protected readonly showPassword = signal(false);
  protected readonly logoLoadFailed = signal(false);

  constructor() {
    this.route.queryParamMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      if (this.redirectIfAuthenticated(params)) {
        return;
      }

      const loggedOut = params.get('loggedOut');
      const reason = params.get('reason');

      if (loggedOut === '1') {
        this.info.set(this.authUiText.text('AUTH-I-031'));
        return;
      }

      if (reason === 'session_expired') {
        this.info.set(this.authUiText.text('AUTH-I-032'));
        return;
      }

      this.info.set(null);
    });
  }

  protected welcomeTitle(): string {
    return this.authUiText.text('AUTH-L-001').replace('{tenantName}', this.tenantName());
  }

  protected openEmailSignIn(): void {
    this.showLoginForm.set(true);
    this.error.set(null);
  }

  protected closeEmailSignIn(): void {
    this.showLoginForm.set(false);
    this.password = '';
    this.showPassword.set(false);
    this.error.set(null);
  }

  protected togglePasswordVisibility(): void {
    this.showPassword.update((visible) => !visible);
  }

  protected onLogoLoadError(): void {
    this.logoLoadFailed.set(true);
  }

  protected onSubmit(): void {
    const identifier = this.identifier.trim();
    const tenantId = this.tenantId.trim();

    if (!identifier || !this.password) {
      this.error.set(this.authUiText.text('AUTH-C-004'));
      return;
    }

    if (!tenantId) {
      this.error.set(this.authUiText.text('AUTH-C-005'));
      return;
    }

    if (!this.tenantContext.setTenantFromInput(tenantId)) {
      this.error.set(this.authUiText.text('AUTH-C-006'));
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    this.auth
      .login({
        identifier,
        password: this.password,
        tenantId,
        rememberMe: false,
      })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (payload) => this.handleSuccessfulLogin(payload),
        error: (error: unknown) => {
          this.error.set(formatHttpError(error, this.authUiText));
        },
      });
  }

  private handleSuccessfulLogin(payload: LoginResponse): void {
    if (payload.success === false || !payload.accessToken) {
      this.error.set(payload.message ?? this.authUiText.text('AUTH-E-031'));
      return;
    }

    const returnUrl = normalizeReturnUrl(this.route.snapshot.queryParamMap.get('returnUrl'));
    void this.router.navigateByUrl(returnUrl, { replaceUrl: true });
  }

  private redirectIfAuthenticated(params: ParamMap): boolean {
    if (!this.session.isAuthenticated()) {
      return false;
    }

    const returnUrl = normalizeReturnUrl(params.get('returnUrl'));
    void this.router.navigateByUrl(returnUrl, { replaceUrl: true });
    return true;
  }
}

function formatHttpError(error: unknown, authUiText: AuthUiTextService): string {
  return formatProblemHttpError(error, {
    fallbackMessage: authUiText.text('AUTH-E-033'),
    networkFallbackMessage: authUiText.text('AUTH-E-032'),
    codeLabel: authUiText.text('AUTH-I-033'),
  });
}

function toTenantName(tenantId: string): string {
  const normalized = tenantId.trim().replace(/[_-]+/g, ' ');
  if (!normalized) {
    return 'master';
  }

  return normalized.toLowerCase();
}

function normalizeReturnUrl(value: string | null): string {
  if (!value) {
    return '/administration';
  }

  const trimmed = value.trim();
  if (!trimmed.startsWith('/')) {
    return '/administration';
  }

  if (trimmed === '/auth/login' || trimmed.startsWith('/auth/login?')) {
    return '/administration';
  }

  return trimmed;
}
