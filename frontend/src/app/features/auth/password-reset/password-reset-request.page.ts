import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ApiGatewayService } from '../../../core/api/api-gateway.service';
import { PageFrameComponent } from '../../../layout/page-frame/page-frame.component';

@Component({
  selector: 'app-password-reset-request-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, PageFrameComponent],
  templateUrl: './password-reset-request.page.html',
  styleUrl: './password-reset-request.page.scss',
})
export class PasswordResetRequestPageComponent {
  private readonly api = inject(ApiGatewayService);

  protected email = '';
  protected readonly loading = signal(false);
  protected readonly submitted = signal(false);
  protected readonly error = signal<string | null>(null);

  protected submit(): void {
    if (!this.email.trim()) {
      this.error.set('Email is required.');
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    this.api
      .requestPasswordReset({
        email: this.email.trim(),
        tenantId: environment.defaultTenantId,
      })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: () => {
          this.submitted.set(true);
        },
        error: () => {
          // Security behavior: never disclose if email exists.
          this.submitted.set(true);
        },
      });
  }

  protected retry(): void {
    this.submitted.set(false);
    this.error.set(null);
  }
}
