import { Component } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { RouterLink } from '@angular/router';
import { EmisiSectionHeaderComponent, EmisiSurfaceCardComponent } from 'emisi-ui';

@Component({
  selector: 'app-access-denied-page',
  standalone: true,
  imports: [CommonModule, RouterLink, EmisiSurfaceCardComponent, EmisiSectionHeaderComponent],
  template: `
    <main class="error-page emisi-theme" aria-label="Access denied page">
      <emisi-surface-card class="error-card" variant="raised" padding="lg">
        <svg class="error-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
          <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
        </svg>

        <emisi-section-header
          [compact]="true"
          overline="Authorization"
          title="Access Denied"
          description="You do not have permission to access this page." />

        <p class="details">If you need access, please contact your administrator.</p>

        <div class="actions">
          <button type="button" (click)="goBack()" class="back-btn">Go Back</button>
          <a routerLink="/products" class="home-btn">Go to Home</a>
        </div>
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
        radial-gradient(1100px 380px at 0% -10%, rgba(4, 116, 129, 0.14), transparent 60%),
        var(--emisi-bg);
    }

    .error-card {
      width: min(100%, 32rem);
      text-align: center;
    }

    .error-icon {
      width: 4.5rem;
      height: 4.5rem;
      color: var(--emisi-danger);
      margin: 0 auto 1rem;
    }

    .details {
      margin: 0.75rem 0 0;
      color: var(--emisi-text-secondary);
    }

    .actions {
      margin-top: 1.5rem;
      display: flex;
      gap: 0.75rem;
      justify-content: center;
      flex-wrap: wrap;
    }

    .back-btn,
    .home-btn {
      min-height: var(--emisi-touch-target-min);
      padding: 0.65rem 1rem;
      border-radius: var(--emisi-radius-md);
      font: 600 0.9rem/1 var(--emisi-font-sans);
      text-decoration: none;
      cursor: pointer;
    }

    .back-btn {
      color: var(--emisi-text);
      border: 1px solid var(--emisi-border);
      background: color-mix(in srgb, var(--emisi-bg), #ffffff 35%);
    }

    .home-btn {
      color: #ffffff;
      border: 1px solid color-mix(in srgb, var(--emisi-primary), #ffffff 65%);
      background: linear-gradient(135deg, var(--emisi-primary), var(--emisi-primary-dark));
    }
  `]
})
export class AccessDeniedPage {
  constructor(private readonly location: Location) {}

  goBack(): void {
    this.location.back();
  }
}
