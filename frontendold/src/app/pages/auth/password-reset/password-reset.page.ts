import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-password-reset-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="reset-page">
      <div class="reset-card">
        @if (!submitted()) {
          <h1>Reset Password</h1>
          <p>Enter your email address and we'll send you a link to reset your password.</p>

          <form (ngSubmit)="submit()">
            <div class="form-group">
              <label for="email">Email Address</label>
              <input
                type="email"
                id="email"
                [(ngModel)]="email"
                name="email"
                placeholder="Enter your email"
                [disabled]="loading()"
                required>
            </div>

            @if (error()) {
              <div class="error-message">{{ error() }}</div>
            }

            <button type="submit" [disabled]="loading() || !email">
              @if (loading()) {
                <span class="spinner"></span>
              } @else {
                Send Reset Link
              }
            </button>
          </form>
        } @else {
          <div class="success-state">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <path d="M9 12l2 2 4-4"/>
            </svg>
            <h1>Check Your Email</h1>
            <p>We've sent a password reset link to <strong>{{ email }}</strong></p>
            <p class="hint">Didn't receive the email? Check your spam folder or try again.</p>
          </div>
        }

        <a routerLink="/login" class="back-link">← Back to Login</a>
      </div>
    </div>
  `,
  styles: [`
    .reset-page {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #0a2540 0%, #0d3a4d 50%, #047481 100%);
      padding: 1rem;
    }
    .reset-card {
      background: white;
      padding: 2.5rem;
      border-radius: 1rem;
      max-width: 420px;
      width: 100%;
      text-align: center;
    }
    h1 { margin: 0 0 0.5rem; font-size: 1.5rem; color: #1a202c; }
    p { color: #64748b; margin: 0 0 1.5rem; }
    .form-group {
      text-align: left;
      margin-bottom: 1.5rem;
    }
    .form-group label {
      display: block;
      margin-bottom: 0.5rem;
      font-weight: 500;
      color: #374151;
    }
    .form-group input {
      width: 100%;
      padding: 0.875rem;
      border: 2px solid #e2e8f0;
      border-radius: 0.5rem;
      font-size: 1rem;
    }
    .form-group input:focus {
      outline: none;
      border-color: #047481;
    }
    .error-message {
      color: #dc2626;
      margin-bottom: 1rem;
      font-size: 0.875rem;
    }
    button[type="submit"] {
      width: 100%;
      padding: 1rem;
      background: #047481;
      color: white;
      border: none;
      border-radius: 0.5rem;
      font-size: 1rem;
      font-weight: 500;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 52px;
    }
    button:disabled { background: #94a3b8; cursor: not-allowed; }
    .spinner {
      width: 20px;
      height: 20px;
      border: 2px solid rgba(255,255,255,0.3);
      border-top-color: white;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    .success-state svg {
      width: 64px;
      height: 64px;
      stroke: #10b981;
      margin-bottom: 1rem;
    }
    .hint { font-size: 0.875rem; color: #94a3b8; }
    .back-link {
      display: inline-block;
      margin-top: 1.5rem;
      color: #047481;
      text-decoration: none;
    }
  `]
})
export class PasswordResetPage {
  private router = inject(Router);
  private authService = inject(AuthService);

  email = '';
  loading = signal(false);
  error = signal<string | null>(null);
  submitted = signal(false);

  submit(): void {
    if (!this.email) return;

    this.loading.set(true);
    this.error.set(null);

    this.authService.requestPasswordReset(this.email).subscribe({
      next: () => {
        this.loading.set(false);
        this.submitted.set(true);
      },
      error: () => {
        this.loading.set(false);
        // Don't reveal if email exists
        this.submitted.set(true);
      }
    });
  }
}
