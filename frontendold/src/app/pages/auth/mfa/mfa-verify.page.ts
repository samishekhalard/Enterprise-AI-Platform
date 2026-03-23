import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-mfa-verify-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="mfa-page">
      <div class="mfa-content">
        <div class="mfa-card">
          <h1>Two-Factor Authentication</h1>
          <p>Enter the verification code from your authenticator app</p>

          <form (ngSubmit)="verify()">
            <div class="code-input">
              <input
                type="text"
                [(ngModel)]="code"
                name="code"
                maxlength="6"
                placeholder="000000"
                [disabled]="loading()"
                autocomplete="one-time-code"
                inputmode="numeric"
                pattern="[0-9]*">
            </div>

            @if (error()) {
              <div class="error-message">{{ error() }}</div>
            }

            <div class="checkbox-group">
              <label>
                <input type="checkbox" [(ngModel)]="trustDevice" name="trustDevice">
                Trust this device for 30 days
              </label>
            </div>

            <button type="submit" [disabled]="loading() || code.length !== 6">
              @if (loading()) {
                <span class="spinner"></span>
              } @else {
                Verify
              }
            </button>
          </form>

          <div class="help-links">
            <button type="button" class="link-btn" (click)="useDifferentMethod()">
              Use a different method
            </button>
            <button type="button" class="link-btn" (click)="cancel()">
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .mfa-page {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #0a2540 0%, #0d3a4d 50%, #047481 100%);
      padding: 1rem;
    }
    .mfa-card {
      background: rgba(255,255,255,0.95);
      padding: 2.5rem;
      border-radius: 1rem;
      max-width: 400px;
      width: 100%;
      text-align: center;
    }
    h1 { margin: 0 0 0.5rem; font-size: 1.5rem; color: #1a202c; }
    p { margin: 0 0 2rem; color: #64748b; }
    .code-input input {
      width: 100%;
      padding: 1rem;
      font-size: 2rem;
      text-align: center;
      letter-spacing: 0.5rem;
      border: 2px solid #e2e8f0;
      border-radius: 0.5rem;
      font-family: monospace;
    }
    .code-input input:focus {
      outline: none;
      border-color: #047481;
    }
    .error-message {
      color: #dc2626;
      margin-top: 1rem;
      font-size: 0.875rem;
    }
    .checkbox-group {
      margin: 1.5rem 0;
      text-align: left;
    }
    .checkbox-group label {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      color: #64748b;
      font-size: 0.875rem;
      cursor: pointer;
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
    button[type="submit"]:disabled {
      background: #94a3b8;
      cursor: not-allowed;
    }
    .spinner {
      width: 20px;
      height: 20px;
      border: 2px solid rgba(255,255,255,0.3);
      border-top-color: white;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    .help-links {
      margin-top: 1.5rem;
      display: flex;
      justify-content: center;
      gap: 1rem;
    }
    .link-btn {
      background: none;
      border: none;
      color: #047481;
      cursor: pointer;
      font-size: 0.875rem;
    }
    .link-btn:hover { text-decoration: underline; }
  `]
})
export class MfaVerifyPage {
  private router = inject(Router);
  private authService = inject(AuthService);

  code = '';
  trustDevice = false;
  loading = signal(false);
  error = signal<string | null>(null);

  verify(): void {
    if (this.code.length !== 6) return;

    this.loading.set(true);
    this.error.set(null);

    this.authService.verifyMfa(this.code, 'totp', this.trustDevice).subscribe({
      next: () => {
        this.router.navigate(['/administration']);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err.message || 'Invalid verification code');
        this.code = '';
      }
    });
  }

  useDifferentMethod(): void {
    // TODO: Show method selection dialog
  }

  cancel(): void {
    this.authService.logoutLocal();
    this.router.navigate(['/login']);
  }
}
