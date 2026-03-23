import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-uaepass-callback-page',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="callback-page">
      <div class="callback-content">
        @if (error) {
          <div class="error-state">
            <img src="assets/images/uaepass-logo.svg" alt="UAE Pass" class="uaepass-logo" onerror="this.style.display='none'">
            <h2>UAE Pass Authentication Failed</h2>
            <p>{{ error }}</p>
            <button (click)="goToLogin()">Back to Login</button>
          </div>
        } @else {
          <div class="loading-state">
            <img src="assets/images/uaepass-logo.svg" alt="UAE Pass" class="uaepass-logo" onerror="this.style.display='none'">
            <div class="spinner"></div>
            <h2>Verifying UAE Pass</h2>
            <p>Please wait while we complete your authentication...</p>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .callback-page {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #0a2540 0%, #0d3a4d 50%, #047481 100%);
    }
    .callback-content {
      text-align: center;
      color: white;
      padding: 2rem;
    }
    .uaepass-logo {
      height: 60px;
      margin-bottom: 1.5rem;
    }
    .spinner {
      width: 48px;
      height: 48px;
      border: 3px solid rgba(255,255,255,0.3);
      border-top-color: white;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 0 auto 1.5rem;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    h2 { margin: 0 0 0.5rem; font-size: 1.5rem; }
    p { margin: 0; opacity: 0.8; }
    button {
      margin-top: 1.5rem;
      padding: 0.75rem 2rem;
      background: white;
      color: #0a2540;
      border: none;
      border-radius: 0.5rem;
      font-size: 1rem;
      cursor: pointer;
    }
  `]
})
export class UaepassCallbackPage implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private authService = inject(AuthService);

  error: string | null = null;

  ngOnInit(): void {
    const code = this.route.snapshot.queryParamMap.get('code');
    const state = this.route.snapshot.queryParamMap.get('state');
    const errorParam = this.route.snapshot.queryParamMap.get('error');

    if (errorParam) {
      this.error = this.route.snapshot.queryParamMap.get('error_description') || errorParam;
      return;
    }

    if (!code || !state) {
      this.error = 'Invalid UAE Pass callback';
      return;
    }

    this.authService.handleOAuthCallback(code, state).subscribe({
      error: (err) => {
        this.error = err.message || 'UAE Pass authentication failed';
      }
    });
  }

  goToLogin(): void {
    this.router.navigate(['/login']);
  }
}
