import {
  Component,
  Input,
  Output,
  EventEmitter,
  inject,
  signal,
  Signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProviderConfig, ProviderType } from '../../models/provider-config.model';
import { ProviderAdminService } from '../../services/provider-admin.service';
import { PROVIDER_TEMPLATES } from '../../data/provider-templates';

@Component({
  selector: 'app-provider-list',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="provider-list">
      <!-- Empty State -->
      @if (providers().length === 0 && !isLoading()) {
        <div class="empty-state" data-testid="empty-state">
          <div class="empty-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h3 class="empty-title">No Identity Providers</h3>
          <p class="empty-description">
            Configure identity providers to enable single sign-on for your users.
          </p>
          <button class="btn btn-primary" (click)="addClicked.emit()" data-testid="btn-add-first-provider">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            Add Identity Provider
          </button>
        </div>
      }

      <!-- Loading State -->
      @if (isLoading()) {
        <div class="loading-state" data-testid="loading-state">
          <div class="spinner"></div>
          <span>Loading providers...</span>
        </div>
      }

      <!-- Provider Cards -->
      @if (providers().length > 0 && !isLoading()) {
        <div class="provider-grid">
          @for (provider of providers(); track provider.id) {
            <div
              class="provider-card"
              [class.enabled]="provider.enabled"
              [class.disabled]="!provider.enabled"
              data-testid="provider-card">
              <!-- Card Header -->
              <div class="card-header">
                <div class="provider-icon">
                  <img
                    [src]="getProviderIcon(provider)"
                    [alt]="provider.displayName"
                    onerror="this.src='assets/icons/shield.svg'" />
                </div>
                <div class="provider-info">
                  <h4 class="provider-name" data-testid="provider-name">{{ provider.displayName }}</h4>
                  <span class="provider-type" data-testid="provider-type">{{ getProviderTypeName(provider.providerType) }}</span>
                </div>
                <div class="provider-status">
                  <span class="status-badge" [class]="provider.enabled ? 'enabled' : 'disabled'" data-testid="provider-status">
                    {{ provider.enabled ? 'Enabled' : 'Disabled' }}
                  </span>
                </div>
              </div>

              <!-- Card Body -->
              <div class="card-body">
                <div class="provider-details">
                  <div class="detail-row">
                    <span class="detail-label">Protocol</span>
                    <span class="detail-value protocol-badge" [class]="provider.protocol.toLowerCase()">
                      {{ provider.protocol }}
                    </span>
                  </div>
                  <div class="detail-row">
                    <span class="detail-label">Internal Name</span>
                    <span class="detail-value code">{{ provider.providerName }}</span>
                  </div>
                  @if (provider.lastTestedAt) {
                    <div class="detail-row">
                      <span class="detail-label">Last Tested</span>
                      <span class="detail-value">
                        <span class="test-indicator" [class]="provider.testResult || 'pending'"></span>
                        {{ formatDate(provider.lastTestedAt) }}
                      </span>
                    </div>
                  }
                </div>
              </div>

              <!-- Card Footer -->
              <div class="card-footer">
                <div class="footer-actions">
                  <button
                    class="btn-icon"
                    title="Test Connection"
                    (click)="onTestConnection(provider)"
                    [disabled]="isTestingProvider() === provider.id"
                    data-testid="btn-test-connection">
                    @if (isTestingProvider() === provider.id) {
                      <span class="spinner-sm"></span>
                    } @else {
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                        <polyline points="22 4 12 14.01 9 11.01"></polyline>
                      </svg>
                    }
                  </button>
                  <button
                    class="btn-icon"
                    title="Edit Provider"
                    (click)="editClicked.emit(provider)"
                    data-testid="btn-edit-provider">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                    </svg>
                  </button>
                  <button
                    class="btn-icon btn-danger"
                    title="Delete Provider"
                    (click)="onDeleteClick(provider)"
                    data-testid="btn-delete-provider">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <polyline points="3 6 5 6 21 6"></polyline>
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    </svg>
                  </button>
                </div>
                <div class="toggle-enabled">
                  <label class="toggle" title="{{ provider.enabled ? 'Disable' : 'Enable' }} provider">
                    <input
                      type="checkbox"
                      [checked]="provider.enabled"
                      (change)="onToggleEnabled(provider)"
                      data-testid="toggle-provider-enabled" />
                    <span class="toggle-slider"></span>
                  </label>
                </div>
              </div>
            </div>
          }
        </div>
      }

      <!-- Error State -->
      @if (error()) {
        <div class="error-state" data-testid="error-state">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
          <span>{{ error() }}</span>
          <button class="btn btn-sm btn-outline" (click)="retryClicked.emit()">Retry</button>
        </div>
      }

      <!-- Delete Confirmation Modal -->
      @if (providerToDelete()) {
        <div class="modal-overlay" (click)="cancelDelete()">
          <div class="modal-container" (click)="$event.stopPropagation()" role="dialog" aria-modal="true">
            <div class="modal-header">
              <h3>Delete Provider</h3>
              <button class="btn-close" (click)="cancelDelete()" aria-label="Close" data-testid="btn-close-modal">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            <div class="modal-body">
              <p>Are you sure you want to delete <strong>{{ providerToDelete()?.displayName }}</strong>?</p>
              <p class="warning-text">
                This will remove the identity provider configuration. Users who sign in with this provider will no longer be able to authenticate.
              </p>
            </div>
            <div class="modal-footer">
              <button class="btn btn-outline" (click)="cancelDelete()" data-testid="btn-cancel-delete">Cancel</button>
              <button
                class="btn btn-danger"
                (click)="confirmDelete()"
                [disabled]="isDeleting()"
                data-testid="btn-confirm-delete">
                @if (isDeleting()) {
                  <span class="spinner-sm"></span>
                }
                Delete Provider
              </button>
            </div>
          </div>
        </div>
      }

      <!-- Test Result Toast -->
      @if (testResult()) {
        <div class="toast" [class]="testResult()?.success ? 'success' : 'error'" data-testid="test-result-toast">
          @if (testResult()?.success) {
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
              <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
          } @else {
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="15" y1="9" x2="9" y2="15"></line>
              <line x1="9" y1="9" x2="15" y2="15"></line>
            </svg>
          }
          <span>{{ testResult()?.message }}</span>
          <button class="btn-toast-close" (click)="testResult.set(null)">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
      }
    </div>
  `,
  styleUrl: './provider-list.component.scss'
})
export class ProviderListComponent {
  private readonly providerService = inject(ProviderAdminService);

  @Input() tenantId!: string;
  @Input({ required: true }) providers!: Signal<ProviderConfig[]>;
  @Input() isLoading: Signal<boolean> = signal(false);
  @Input() error: Signal<string | null> = signal<string | null>(null);

  @Output() addClicked = new EventEmitter<void>();
  @Output() editClicked = new EventEmitter<ProviderConfig>();
  @Output() deleteConfirmed = new EventEmitter<ProviderConfig>();
  @Output() toggleEnabled = new EventEmitter<{ provider: ProviderConfig; enabled: boolean }>();
  @Output() retryClicked = new EventEmitter<void>();

  // Local state
  readonly providerToDelete = signal<ProviderConfig | null>(null);
  readonly isDeleting = signal(false);
  readonly isTestingProvider = signal<string | null>(null);
  readonly testResult = signal<{ success: boolean; message: string } | null>(null);

  // =========================================================================
  // Provider Type Helpers
  // =========================================================================

  getProviderIcon(provider: ProviderConfig): string {
    if (provider.iconUrl) {
      return provider.iconUrl;
    }

    const template = PROVIDER_TEMPLATES.find(t => t.type === provider.providerType);
    return template?.icon || 'assets/icons/shield.svg';
  }

  getProviderTypeName(type: ProviderType): string {
    const names: Record<ProviderType, string> = {
      KEYCLOAK: 'Keycloak',
      AUTH0: 'Auth0',
      OKTA: 'Okta',
      AZURE_AD: 'Azure AD',
      UAE_PASS: 'UAE Pass',
      IBM_IAM: 'IBM IAM',
      LDAP_SERVER: 'LDAP',
      CUSTOM: 'Custom'
    };
    return names[type] || type;
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  }

  // =========================================================================
  // Actions
  // =========================================================================

  onToggleEnabled(provider: ProviderConfig): void {
    this.toggleEnabled.emit({
      provider,
      enabled: !provider.enabled
    });
  }

  onTestConnection(provider: ProviderConfig): void {
    if (!provider.id) return;

    this.isTestingProvider.set(provider.id);
    this.testResult.set(null);

    this.providerService.testConnection(this.tenantId, provider.id).subscribe({
      next: result => {
        this.isTestingProvider.set(null);
        this.testResult.set({
          success: result.success,
          message: result.success
            ? `Connection to ${provider.displayName} successful`
            : result.message || 'Connection failed'
        });

        // Auto-hide toast after 5 seconds
        setTimeout(() => {
          if (this.testResult()?.message.includes(provider.displayName)) {
            this.testResult.set(null);
          }
        }, 5000);
      },
      error: err => {
        this.isTestingProvider.set(null);
        this.testResult.set({
          success: false,
          message: err.message || 'Connection test failed'
        });
      }
    });
  }

  onDeleteClick(provider: ProviderConfig): void {
    this.providerToDelete.set(provider);
  }

  cancelDelete(): void {
    this.providerToDelete.set(null);
  }

  confirmDelete(): void {
    const provider = this.providerToDelete();
    if (!provider) return;

    this.isDeleting.set(true);

    // Emit event - parent handles actual deletion
    this.deleteConfirmed.emit(provider);

    // Reset state after a brief delay
    setTimeout(() => {
      this.providerToDelete.set(null);
      this.isDeleting.set(false);
    }, 300);
  }
}
