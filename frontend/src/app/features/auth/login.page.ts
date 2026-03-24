import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, ParamMap, Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthFacade } from '../../core/auth/auth-facade';
import { LoginResponse } from '../../core/api/models';
import { SessionService } from '../../core/services/session.service';
import { TenantContextService } from '../../core/services/tenant-context.service';

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './login.page.html',
  styleUrl: './login.page.scss',
})
export class LoginPageComponent {
  private readonly auth = inject(AuthFacade);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly session = inject(SessionService);
  private readonly tenantContext = inject(TenantContextService);
  private readonly destroyRef = inject(DestroyRef);

  protected identifier = '';
  protected password = '';
  protected tenantId = this.tenantContext.tenantId() ?? '';

  protected readonly tenantName = toTenantName(this.tenantContext.tenantName());
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
        this.info.set('You have been signed out successfully.');
        return;
      }

      if (reason === 'session_expired') {
        this.info.set('Your session expired. Please sign in again.');
        return;
      }

      this.info.set(null);
    });
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
      this.error.set('Email or username and password are required.');
      return;
    }

    if (!tenantId) {
      this.error.set('Tenant ID is required.');
      return;
    }

    if (!this.tenantContext.setTenantFromInput(tenantId)) {
      this.error.set('Tenant ID must be a UUID or a recognized tenant alias.');
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
          this.error.set(formatHttpError(error));
        },
      });
  }

  private handleSuccessfulLogin(payload: LoginResponse): void {
    if (payload.success === false || !payload.accessToken) {
      this.error.set(payload.message ?? 'Login failed. Please verify your credentials.');
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

function formatHttpError(error: unknown): string {
  if (error instanceof HttpErrorResponse) {
    return `${error.status} ${error.statusText || 'Request failed'}: ${error.message}`;
  }

  return 'Login request failed.';
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
    return '/dashboard';
  }

  const trimmed = value.trim();
  if (!trimmed.startsWith('/')) {
    return '/dashboard';
  }

  if (trimmed === '/auth/login' || trimmed.startsWith('/auth/login?')) {
    return '/dashboard';
  }

  return trimmed;
}
