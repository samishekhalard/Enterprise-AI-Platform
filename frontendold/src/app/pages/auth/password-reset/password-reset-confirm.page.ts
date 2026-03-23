import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-password-reset-confirm-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="reset-page">
      <div class="reset-card">
        @if (!success()) {
          <h1>Set New Password</h1>
          <p>Enter your new password below.</p>

          <form (ngSubmit)="submit()">
            <div class="form-group">
              <label for="password">New Password</label>
              <input
                type="password"
                id="password"
                [(ngModel)]="password"
                name="password"
                placeholder="Enter new password"
                [disabled]="loading()"
                required>
            </div>

            <div class="form-group">
              <label for="confirmPassword">Confirm Password</label>
              <input
                type="password"
                id="confirmPassword"
                [(ngModel)]="confirmPassword"
                name="confirmPassword"
                placeholder="Confirm new password"
                [disabled]="loading()"
                required>
            </div>

            @if (error()) {
              <div class="error-message">{{ error() }}</div>
            }

            <button type="submit" [disabled]="loading() || !isValid()">
              @if (loading()) {
                <span class="spinner"></span>
              } @else {
                Reset Password
              }
            </button>
          </form>
        } @else {
          <div class="success-state">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <path d="M9 12l2 2 4-4"/>
            </svg>
            <h1>Password Reset Successfully</h1>
            <p>You can now sign in with your new password.</p>
            <a routerLink="/login" class="login-btn">Sign In</a>
          </div>
        }
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
      margin-bottom: 1rem;
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
    button[type="submit"], .login-btn {
      display: flex;
      width: 100%;
      padding: 1rem;
      background: #047481;
      color: white;
      border: none;
      border-radius: 0.5rem;
      font-size: 1rem;
      font-weight: 500;
      cursor: pointer;
      align-items: center;
      justify-content: center;
      text-decoration: none;
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
  `]
})
export class PasswordResetConfirmPage implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private authService = inject(AuthService);

  password = '';
  confirmPassword = '';
  token = '';
  loading = signal(false);
  error = signal<string | null>(null);
  success = signal(false);

  ngOnInit(): void {
    this.token = this.route.snapshot.queryParamMap.get('token') || '';
    if (!this.token) {
      this.router.navigate(['/login']);
    }
  }

  isValid(): boolean {
    return this.password.length >= 8 && this.password === this.confirmPassword;
  }

  submit(): void {
    if (!this.isValid()) {
      if (this.password !== this.confirmPassword) {
        this.error.set('Passwords do not match');
      }
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    this.authService.resetPassword(this.token, this.password).subscribe({
      next: () => {
        this.loading.set(false);
        this.success.set(true);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err.message || 'Failed to reset password');
      }
    });
  }
}
