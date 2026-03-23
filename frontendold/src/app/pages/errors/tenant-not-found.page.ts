import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EmisiSectionHeaderComponent, EmisiSurfaceCardComponent } from 'emisi-ui';

@Component({
  selector: 'app-tenant-not-found-page',
  standalone: true,
  imports: [CommonModule, EmisiSurfaceCardComponent, EmisiSectionHeaderComponent],
  template: `
    <main class="error-page emisi-theme" aria-label="Organization not found page">
      <emisi-surface-card class="error-card" variant="raised" padding="lg">
        <svg class="error-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
          <circle cx="12" cy="12" r="10"/>
          <path d="M16 16s-1.5-2-4-2-4 2-4 2"/>
          <line x1="9" y1="9" x2="9.01" y2="9"/>
          <line x1="15" y1="9" x2="15.01" y2="9"/>
        </svg>

        <emisi-section-header
          [compact]="true"
          overline="Tenant Context"
          title="Organization Not Found"
          description="We could not find an organization associated with this domain." />

        <p class="details">
          If this is unexpected, contact your administrator or reach out to support.
        </p>

        <a href="mailto:support@thinkplus.ae" class="support-btn">Contact Support</a>
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
        radial-gradient(900px 340px at 12% 0%, rgba(4, 116, 129, 0.16), transparent 55%),
        radial-gradient(900px 320px at 100% 100%, rgba(44, 82, 130, 0.14), transparent 55%),
        var(--emisi-bg);
    }

    .error-card {
      width: min(100%, 34rem);
      text-align: center;
    }

    .error-icon {
      width: 4.5rem;
      height: 4.5rem;
      color: var(--emisi-info);
      margin: 0 auto 1rem;
    }

    .details {
      margin: 0.75rem 0 0;
      color: var(--emisi-text-secondary);
    }

    .support-btn {
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
export class TenantNotFoundPage {}
