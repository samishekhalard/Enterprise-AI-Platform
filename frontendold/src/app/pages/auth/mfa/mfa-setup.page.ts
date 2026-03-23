import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-mfa-setup-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="mfa-setup-page">
      <div class="mfa-setup-card">
        <h1>Set Up Two-Factor Authentication</h1>
        <p>Enhance your account security with 2FA</p>

        @if (step() === 'choose') {
          <div class="method-options">
            <button class="method-option" (click)="selectMethod('totp')">
              <span class="method-icon">📱</span>
              <span class="method-info">
                <strong>Authenticator App</strong>
                <span>Use Google Authenticator, Authy, or similar</span>
              </span>
            </button>
            <button class="method-option" (click)="selectMethod('sms')">
              <span class="method-icon">💬</span>
              <span class="method-info">
                <strong>SMS</strong>
                <span>Receive codes via text message</span>
              </span>
            </button>
            <button class="method-option" (click)="selectMethod('email')">
              <span class="method-icon">📧</span>
              <span class="method-info">
                <strong>Email</strong>
                <span>Receive codes via email</span>
              </span>
            </button>
          </div>
        }

        @if (step() === 'setup-totp' && setupData()) {
          <div class="totp-setup">
            <p>Scan this QR code with your authenticator app:</p>
            <div class="qr-placeholder">
              <img [src]="setupData()!.qrCodeUri" alt="QR Code" *ngIf="setupData()!.qrCodeUri">
            </div>
            <p class="manual-code">
              Or enter this code manually:<br>
              <code>{{ setupData()!.secret }}</code>
            </p>
            <div class="verify-code">
              <input
                type="text"
                [(ngModel)]="verifyCode"
                placeholder="Enter code to verify"
                maxlength="6">
              <button (click)="verifySetup()">Verify</button>
            </div>
          </div>
        }

        <button class="back-btn" (click)="goBack()">Back</button>
      </div>
    </div>
  `,
  styles: [`
    .mfa-setup-page {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #f8fafc;
      padding: 1rem;
    }
    .mfa-setup-card {
      background: white;
      padding: 2.5rem;
      border-radius: 1rem;
      max-width: 500px;
      width: 100%;
      box-shadow: 0 4px 20px rgba(0,0,0,0.1);
    }
    h1 { margin: 0 0 0.5rem; font-size: 1.5rem; color: #1a202c; }
    p { color: #64748b; }
    .method-options {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      margin: 2rem 0;
    }
    .method-option {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem;
      background: #f8fafc;
      border: 2px solid #e2e8f0;
      border-radius: 0.5rem;
      cursor: pointer;
      text-align: left;
    }
    .method-option:hover {
      border-color: #047481;
      background: #f0fdfa;
    }
    .method-icon { font-size: 2rem; }
    .method-info {
      display: flex;
      flex-direction: column;
    }
    .method-info strong { color: #1a202c; }
    .method-info span { font-size: 0.875rem; color: #64748b; }
    .back-btn {
      margin-top: 1rem;
      padding: 0.75rem 1.5rem;
      background: #e2e8f0;
      border: none;
      border-radius: 0.5rem;
      cursor: pointer;
    }
  `]
})
export class MfaSetupPage {
  private router = inject(Router);
  private authService = inject(AuthService);

  step = signal<'choose' | 'setup-totp' | 'setup-sms' | 'setup-email'>('choose');
  setupData = signal<{ qrCodeUri?: string; secret?: string } | null>(null);
  verifyCode = '';

  selectMethod(method: string): void {
    this.authService.setupMfa(method).subscribe({
      next: (response) => {
        this.setupData.set(response);
        this.step.set(`setup-${method}` as typeof this.step extends () => infer R ? R : never);
      },
      error: (err) => console.error('MFA setup failed:', err)
    });
  }

  verifySetup(): void {
    // Verify the TOTP code to complete setup
    this.authService.verifyMfa(this.verifyCode, 'totp').subscribe({
      next: () => this.router.navigate(['/profile']),
      error: (err) => console.error('Verification failed:', err)
    });
  }

  goBack(): void {
    if (this.step() === 'choose') {
      this.router.navigate(['/profile']);
    } else {
      this.step.set('choose');
    }
  }
}
