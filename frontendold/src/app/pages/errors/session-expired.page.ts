import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { EmisiSectionHeaderComponent, EmisiSurfaceCardComponent } from 'emisi-ui';

@Component({
  selector: 'app-session-expired-page',
  standalone: true,
  imports: [CommonModule, RouterLink, EmisiSurfaceCardComponent, EmisiSectionHeaderComponent],
  template: `
    <main class="error-page emisi-theme" aria-label="Session expired page">
      <emisi-surface-card class="error-card" variant="raised" padding="lg">
        <svg class="error-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
          <circle cx="12" cy="12" r="10"/>
          <polyline points="12 6 12 12 16 14"/>
        </svg>

        <emisi-section-header
          [compact]="true"
          overline="Authentication"
          title="Session Expired"
          description="Your session has expired due to inactivity. Please sign in again to continue." />

        <a routerLink="/login" class="login-btn">Sign In</a>
      </emisi-surface-card>
    </main>
  `,
  styles: [`
    .error-page {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1rem;
      background:
        radial-gradient(1000px 360px at 100% 0%, rgba(44, 82, 130, 0.2), transparent 58%),
        linear-gradient(180deg, color-mix(in srgb, var(--emisi-bg), #ffffff 15%), var(--emisi-bg));
    }

    .error-card {
      width: min(100%, 32rem);
      text-align: center;
    }

    .error-icon {
      width: 4.5rem;
      height: 4.5rem;
      color: var(--emisi-warning);
      margin: 0 auto 1rem;
    }

    .login-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-height: var(--emisi-touch-target-min);
      margin-top: 1.5rem;
      padding: 0.65rem 1.25rem;
      border-radius: var(--emisi-radius-md);
      border: 1px solid color-mix(in srgb, var(--emisi-primary), #ffffff 65%);
      color: #ffffff;
      background: linear-gradient(135deg, var(--emisi-primary), var(--emisi-primary-dark));
      text-decoration: none;
      font: 600 0.9rem/1 var(--emisi-font-sans);
    }
  `]
})
export class SessionExpiredPage {}
