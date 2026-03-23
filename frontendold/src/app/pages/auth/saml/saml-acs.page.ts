import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-saml-acs-page',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="callback-page">
      <div class="callback-content">
        <div class="spinner"></div>
        <h2>Processing SSO Response</h2>
        <p>Please wait...</p>
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
  `]
})
export class SamlAcsPage implements OnInit {
  private router = inject(Router);

  ngOnInit(): void {
    // SAML responses are typically POST-ed to the ACS
    // The Auth Facade handles the SAML processing and redirects here
    // This page just shows a loading state while the redirect happens
    console.log('SAML ACS page loaded - waiting for redirect');
  }
}
