import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { finalize } from 'rxjs';
import { ApiGatewayService } from '../../../core/api/api-gateway.service';
import { PageFrameComponent } from '../../../layout/page-frame/page-frame.component';

@Component({
  selector: 'app-password-reset-confirm-page',
  standalone: true,
  imports: [
    ButtonModule,
    CommonModule,
    FormsModule,
    InputTextModule,
    RouterLink,
    PageFrameComponent,
  ],
  templateUrl: './password-reset-confirm.page.html',
  styleUrl: './password-reset-confirm.page.scss',
})
export class PasswordResetConfirmPageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly api = inject(ApiGatewayService);

  protected password = '';
  protected confirmPassword = '';
  protected token = '';

  protected readonly loading = signal(false);
  protected readonly success = signal(false);
  protected readonly error = signal<string | null>(null);

  ngOnInit(): void {
    this.token = this.route.snapshot.queryParamMap.get('token') ?? '';

    if (!this.token) {
      this.error.set('Missing reset token. Open the reset link from your email.');
    }
  }

  protected get canSubmit(): boolean {
    return !!this.token && this.password.length >= 8 && this.password === this.confirmPassword;
  }

  protected submit(): void {
    if (!this.canSubmit) {
      if (this.password !== this.confirmPassword) {
        this.error.set('Passwords do not match.');
      } else {
        this.error.set('Password must be at least 8 characters.');
      }
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    this.api
      .confirmPasswordReset({
        token: this.token,
        newPassword: this.password,
        confirmPassword: this.confirmPassword,
      })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: () => {
          this.success.set(true);
        },
        error: (error: unknown) => {
          this.error.set(formatHttpError(error));
        },
      });
  }
}

function formatHttpError(error: unknown): string {
  if (error instanceof HttpErrorResponse) {
    return `${error.status} ${error.statusText || 'Request failed'}: ${error.message}`;
  }

  return 'Unable to reset password.';
}
