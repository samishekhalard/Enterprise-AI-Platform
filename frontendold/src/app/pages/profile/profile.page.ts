import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { MFAStatus } from '../../models/auth.model';
import { BreadcrumbComponent } from '../../components/shared/breadcrumb';
import {
  EmisiKeyboardHint,
  EmisiKeyboardHintsComponent,
  EmisiPageShellComponent,
  EmisiSectionHeaderComponent,
  EmisiSurfaceCardComponent
} from 'emisi-ui';

@Component({
  selector: 'app-profile-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    BreadcrumbComponent,
    EmisiPageShellComponent,
    EmisiSectionHeaderComponent,
    EmisiSurfaceCardComponent,
    EmisiKeyboardHintsComponent
  ],
  template: `
    <app-breadcrumb [items]="[{ label: 'Profile' }]" />

    <div class="profile-page emisi-container">
      <emisi-page-shell
        title="Profile Settings"
        subtitle="Manage your account details, security controls, and active sessions.">
        @if (user(); as user) {
          <emisi-surface-card class="profile-section" variant="raised" padding="lg">
            <emisi-section-header
              [compact]="true"
              overline="Account"
              title="Personal Information"
              description="Core account details from your tenant profile." />

            <div class="info-grid" role="list" aria-label="Personal information">
              <div class="info-item" role="listitem">
                <label>Name</label>
                <span>{{ user.displayName }}</span>
              </div>
              <div class="info-item" role="listitem">
                <label>Email</label>
                <span>{{ user.email }}</span>
              </div>
              <div class="info-item" role="listitem">
                <label>Role</label>
                <span class="role-badge">{{ user.tenantRole | titlecase }}</span>
              </div>
              <div class="info-item" role="listitem">
                <label>Member Since</label>
                <span>{{ user.createdAt | date:'mediumDate' }}</span>
              </div>
            </div>
          </emisi-surface-card>

          <emisi-surface-card class="profile-section" variant="raised" padding="lg">
            <emisi-section-header
              [compact]="true"
              overline="Protection"
              title="Security"
              description="Control password, MFA, and sign-in hardening." />

            <div class="security-item">
              <div class="security-info">
                <strong>Password</strong>
                <span>Last changed: Unknown</span>
              </div>
              <button class="btn-secondary" type="button" (click)="changePassword()">Change Password</button>
            </div>

            <div class="security-item">
              <div class="security-info">
                <strong>Two-Factor Authentication</strong>
                <span>{{ mfaStatus()?.enabled ? 'Enabled' : 'Not configured' }}</span>
              </div>
              <button class="btn-secondary" type="button" (click)="setupMfa()">
                {{ mfaStatus()?.enabled ? 'Manage' : 'Enable' }}
              </button>
            </div>
          </emisi-surface-card>

          <emisi-surface-card class="profile-section" variant="raised" padding="lg">
            <emisi-section-header
              [compact]="true"
              overline="Sessions"
              title="Active Sessions"
              description="Review and manage your current sign-ins." />
            <button class="btn-secondary" type="button" (click)="manageSessions()">View Sessions</button>
          </emisi-surface-card>

          <emisi-keyboard-hints
            class="profile-kbd-hints"
            [compact]="true"
            title="Keyboard"
            [hints]="profileKeyboardHints" />
        } @else {
          <emisi-surface-card class="loading" variant="inset" padding="lg">Loading profile...</emisi-surface-card>
        }
      </emisi-page-shell>
    </div>
  `,
  styles: [`
    .profile-page {
      padding: 1rem 0 2rem;
    }

    .profile-section {
      margin-bottom: 1rem;
    }

    .info-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
      gap: 1rem;
    }

    .info-item {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
      padding: 0.75rem;
      border-radius: var(--emisi-radius-md);
      border: 1px solid var(--emisi-border);
      background: color-mix(in srgb, var(--emisi-bg), #ffffff 40%);
    }

    .info-item label {
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--emisi-text-muted);
      font-weight: 600;
    }

    .info-item span {
      color: var(--emisi-text);
    }

    .role-badge {
      display: inline-block;
      width: fit-content;
      padding: 0.25rem 0.75rem;
      border-radius: 9999px;
      background: color-mix(in srgb, var(--emisi-primary), #ffffff 82%);
      color: var(--emisi-primary-dark);
      border: 1px solid color-mix(in srgb, var(--emisi-primary), #ffffff 70%);
      font-size: 0.875rem;
      font-weight: 600;
    }

    .security-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      padding: 1rem 0;
      border-bottom: 1px solid var(--emisi-border);
    }

    .security-item:last-child {
      border-bottom: none;
    }

    .security-info {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .security-info strong {
      color: var(--emisi-text);
    }

    .security-info span {
      font-size: 0.875rem;
      color: var(--emisi-text-secondary);
    }

    .btn-secondary {
      min-height: var(--emisi-touch-target-min);
      padding: 0.5rem 1rem;
      border: 1px solid var(--emisi-border);
      border-radius: var(--emisi-radius-md);
      color: var(--emisi-text);
      background: color-mix(in srgb, var(--emisi-bg), #ffffff 38%);
      font: 600 0.875rem/1 var(--emisi-font-sans);
      cursor: pointer;
    }

    .btn-secondary:hover {
      border-color: color-mix(in srgb, var(--emisi-primary), #ffffff 65%);
      background: color-mix(in srgb, var(--emisi-primary), #ffffff 88%);
    }

    .profile-kbd-hints {
      margin-top: 0.5rem;
    }

    .loading {
      text-align: center;
      color: var(--emisi-text-secondary);
    }

    @media (max-width: 767px) {
      .security-item {
        flex-direction: column;
        align-items: stretch;
      }
    }
  `]
})
export class ProfilePage implements OnInit {
  private authService = inject(AuthService);

  user = this.authService.user;
  mfaStatus = signal<MFAStatus | null>(null);
  readonly profileKeyboardHints: EmisiKeyboardHint[] = [
    { keys: ['Tab'], description: 'Move between controls' },
    { keys: ['Shift', 'Tab'], description: 'Move to previous control' },
    { keys: ['Enter'], description: 'Activate focused button' }
  ];

  ngOnInit(): void {
    this.loadMfaStatus();
  }

  loadMfaStatus(): void {
    this.authService.getMfaStatus().subscribe({
      next: (status) => this.mfaStatus.set(status),
      error: () => {}
    });
  }

  changePassword(): void {
    // TODO: Open change password modal
  }

  setupMfa(): void {
    // TODO: Navigate to MFA setup
  }

  manageSessions(): void {
    // TODO: Show sessions dialog
  }
}
