import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs/operators';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { TagModule } from 'primeng/tag';
import { MessageModule } from 'primeng/message';
import { ApiGatewayService } from '../../core/api/api-gateway.service';
import { UserSession } from '../../core/api/models';
import { SessionService } from '../../core/services/session.service';
import { TenantContextService } from '../../core/services/tenant-context.service';
import { PageFrameComponent } from '../../layout/page-frame/page-frame.component';

interface UserProfile {
  readonly name: string;
  readonly email: string;
  readonly role: string;
  readonly tenant: string;
  readonly userId: string;
}

@Component({
  selector: 'app-profile-page',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    CardModule,
    ButtonModule,
    InputTextModule,
    PasswordModule,
    ProgressSpinnerModule,
    TagModule,
    MessageModule,
    PageFrameComponent,
  ],
  templateUrl: './profile.page.html',
  styleUrl: './profile.page.scss',
})
export class ProfilePageComponent implements OnInit {
  private readonly session = inject(SessionService);
  private readonly api = inject(ApiGatewayService);
  private readonly tenantContext = inject(TenantContextService);
  private readonly fb = inject(FormBuilder);

  // Profile info
  protected readonly profile = computed<UserProfile>(() => {
    const claims = this.session.getAccessTokenClaims();
    if (!claims) {
      return { name: 'Unknown', email: 'Unknown', role: 'Unknown', tenant: 'Unknown', userId: '' };
    }

    const name =
      asString(claims['name']) ??
      asString(claims['preferred_username']) ??
      'Unknown';

    const email = asString(claims['email']) ?? 'Unknown';

    const roles = claims['realm_access'] as Record<string, unknown> | undefined;
    let role = 'User';
    if (roles && Array.isArray(roles['roles'])) {
      const roleList = roles['roles'] as string[];
      role = roleList.length > 0 ? roleList[0] : 'User';
    } else {
      role = asString(claims['role']) ?? 'User';
    }

    const tenant = this.tenantContext.tenantName() || this.tenantContext.tenantId() || 'Unknown';
    const userId = this.session.getUserId() ?? '';

    return { name, email, role, tenant, userId };
  });

  // Change password form
  protected readonly passwordForm = this.fb.group({
    currentPassword: ['', [Validators.required, Validators.minLength(1)]],
    newPassword: ['', [Validators.required, Validators.minLength(8)]],
    confirmPassword: ['', [Validators.required, Validators.minLength(8)]],
  });

  protected readonly passwordLoading = signal(false);
  protected readonly passwordError = signal<string | null>(null);
  protected readonly passwordSuccess = signal<string | null>(null);

  // Sessions
  protected readonly sessions = signal<readonly UserSession[]>([]);
  protected readonly sessionsLoading = signal(false);
  protected readonly sessionsError = signal<string | null>(null);

  // Theme
  protected readonly darkMode = signal(this.loadDarkModePreference());

  ngOnInit(): void {
    this.loadSessions();
  }

  protected onChangePassword(): void {
    this.passwordError.set(null);
    this.passwordSuccess.set(null);

    if (this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();
      return;
    }

    const newPassword = this.passwordForm.value.newPassword ?? '';
    const confirmPassword = this.passwordForm.value.confirmPassword ?? '';

    if (newPassword !== confirmPassword) {
      this.passwordError.set('New password and confirmation do not match.');
      return;
    }

    // Password change would call API here.
    // For now, show a success message since the backend endpoint is not yet wired.
    this.passwordLoading.set(true);

    // Simulate API call
    setTimeout(() => {
      this.passwordLoading.set(false);
      this.passwordSuccess.set('Password change request submitted. This feature is pending backend integration.');
      this.passwordForm.reset();
    }, 800);
  }

  protected loadSessions(): void {
    const userId = this.profile().userId;
    if (!userId) {
      this.sessionsError.set('Unable to determine user ID from session.');
      return;
    }

    this.sessionsLoading.set(true);
    this.sessionsError.set(null);

    this.api
      .getUserSessions(userId)
      .pipe(finalize(() => this.sessionsLoading.set(false)))
      .subscribe({
        next: (data) => this.sessions.set(data),
        error: (err: unknown) => {
          this.sessionsError.set(formatHttpError(err));
        },
      });
  }

  protected revokeAllSessions(): void {
    const userId = this.profile().userId;
    if (!userId) {
      return;
    }

    this.sessionsLoading.set(true);
    this.api
      .revokeAllUserSessions(userId)
      .pipe(finalize(() => this.sessionsLoading.set(false)))
      .subscribe({
        next: () => {
          this.sessions.set([]);
        },
        error: (err: unknown) => {
          this.sessionsError.set(formatHttpError(err));
        },
      });
  }

  protected toggleDarkMode(): void {
    const newValue = !this.darkMode();
    this.darkMode.set(newValue);
    this.saveDarkModePreference(newValue);
    this.applyDarkMode(newValue);
  }

  protected isFieldInvalid(fieldName: string): boolean {
    const control = this.passwordForm.get(fieldName);
    return control !== null && control.invalid && control.touched;
  }

  private loadDarkModePreference(): boolean {
    try {
      return localStorage.getItem('tp_dark_mode') === 'true';
    } catch {
      return false;
    }
  }

  private saveDarkModePreference(value: boolean): void {
    try {
      localStorage.setItem('tp_dark_mode', String(value));
    } catch {
      // Storage not available
    }
  }

  private applyDarkMode(enabled: boolean): void {
    if (typeof document !== 'undefined') {
      document.documentElement.classList.toggle('dark-theme', enabled);
    }
  }
}

function asString(value: unknown): string | null {
  return typeof value === 'string' && value.trim().length > 0 ? value : null;
}

function formatHttpError(error: unknown): string {
  if (error instanceof HttpErrorResponse) {
    return `${error.status} ${error.statusText || 'Request failed'}: ${error.message}`;
  }

  return 'Request failed.';
}
