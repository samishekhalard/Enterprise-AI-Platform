import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * LandingPage
 *
 * This page acts as a redirect placeholder.
 * The landingRedirectGuard handles the actual redirect logic
 * based on tenant type (master -> administration, others -> products).
 *
 * This component should never be visible - it's only loaded
 * briefly while the redirect is processed.
 */
@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="landing-loader">
      <div class="spinner"></div>
      <p>Loading...</p>
    </div>
  `,
  styles: [`
    .landing-loader {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100vh;
      gap: 1rem;
    }

    .spinner {
      width: 40px;
      height: 40px;
      border: 3px solid #e2e8f0;
      border-top-color: #047481;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    p {
      color: #545e6e;
      font-size: 14px;
    }
  `]
})
export class LandingPage {}
