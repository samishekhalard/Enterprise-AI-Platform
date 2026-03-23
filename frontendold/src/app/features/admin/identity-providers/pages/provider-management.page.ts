import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ProviderConfig } from '../models/provider-config.model';
import { ProviderAdminService } from '../services/provider-admin.service';
import { ProviderListComponent } from '../components/provider-list/provider-list.component';
import { ProviderFormComponent } from '../components/provider-form/provider-form.component';
import { TenantResolverService } from '../../../../core/services/tenant-resolver.service';

type ViewMode = 'list' | 'create' | 'edit';

@Component({
  selector: 'app-provider-management-page',
  standalone: true,
  imports: [CommonModule, ProviderListComponent, ProviderFormComponent],
  template: `
    <div class="provider-management">
      <!-- Header -->
      <header class="page-header">
        <div class="header-content">
          @if (viewMode() === 'list') {
            <div class="header-title-section">
              <h1 class="page-title">Identity Providers</h1>
              <p class="page-description">
                Configure single sign-on and authentication providers for your organization.
              </p>
            </div>
            <div class="header-actions">
              <button
                class="btn btn-primary"
                (click)="openCreateForm()"
                data-testid="btn-add-provider">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="12" y1="5" x2="12" y2="19"></line>
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
                Add Provider
              </button>
            </div>
          } @else {
            <div class="header-title-section">
              <button class="btn-back" (click)="closeForm()" data-testid="btn-back">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="19" y1="12" x2="5" y2="12"></line>
                  <polyline points="12 19 5 12 12 5"></polyline>
                </svg>
                Back to Providers
              </button>
              <h1 class="page-title">
                {{ viewMode() === 'create' ? 'Add Identity Provider' : 'Edit Provider' }}
              </h1>
            </div>
          }
        </div>
      </header>

      <!-- Content -->
      <main class="page-content">
        @switch (viewMode()) {
          @case ('list') {
            <app-provider-list
              [tenantId]="tenantId()"
              [providers]="providers"
              [isLoading]="isLoading"
              [error]="error"
              (addClicked)="openCreateForm()"
              (editClicked)="openEditForm($event)"
              (deleteConfirmed)="handleDelete($event)"
              (toggleEnabled)="handleToggleEnabled($event)"
              (retryClicked)="loadProviders()" />
          }

          @case ('create') {
            <app-provider-form
              [tenantId]="tenantId()"
              (saved)="handleProviderSaved($event)"
              (cancelled)="closeForm()" />
          }

          @case ('edit') {
            @if (selectedProvider()) {
              <app-provider-form
                [tenantId]="tenantId()"
                [provider]="selectedProvider()!"
                (saved)="handleProviderSaved($event)"
                (cancelled)="closeForm()" />
            }
          }
        }
      </main>

      <!-- Success Toast -->
      @if (successMessage()) {
        <div class="toast success" data-testid="success-toast">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
            <polyline points="22 4 12 14.01 9 11.01"></polyline>
          </svg>
          <span>{{ successMessage() }}</span>
          <button class="btn-toast-close" (click)="successMessage.set(null)">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
      }
    </div>
  `,
  styles: [`
    // Design System Variables
    $teal-primary: #047481;
    $teal-dark: #035a66;

    $gray-50: #f8fafc;
    $gray-100: #f1f5f9;
    $gray-200: #e2e8f0;
    $gray-300: #cbd5e1;
    $gray-400: #94a3b8;
    $gray-500: #64748b;
    $gray-600: #475569;
    $gray-700: #334155;
    $gray-800: #1e293b;

    $white: #ffffff;
    $success: #10b981;

    $font-family: 'Gotham Rounded', 'Nunito', -apple-system, BlinkMacSystemFont, sans-serif;
    $shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
    $border-radius: 0.375rem;
    $border-radius-lg: 0.5rem;
    $transition: all 0.15s ease;

    .provider-management {
      font-family: $font-family;
      min-height: 100%;
      background: $gray-50;
    }

    // ============================================================================
    // Page Header
    // ============================================================================

    .page-header {
      background: $white;
      border-bottom: 1px solid $gray-200;
      padding: 1.5rem 2rem;
    }

    .header-content {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 1.5rem;
      max-width: 1200px;
      margin: 0 auto;

      @media (max-width: 768px) {
        flex-direction: column;
      }
    }

    .header-title-section {
      flex: 1;
    }

    .page-title {
      font-size: 1.5rem;
      font-weight: 600;
      color: $gray-800;
      margin: 0 0 0.25rem;
    }

    .page-description {
      font-size: 0.9375rem;
      color: $gray-500;
      margin: 0;
    }

    .header-actions {
      flex-shrink: 0;
    }

    .btn-back {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0;
      background: transparent;
      border: none;
      color: $teal-primary;
      font-size: 0.875rem;
      font-weight: 500;
      font-family: inherit;
      cursor: pointer;
      margin-bottom: 0.5rem;
      transition: $transition;

      svg {
        width: 18px;
        height: 18px;
      }

      &:hover {
        color: $teal-dark;
      }
    }

    // ============================================================================
    // Page Content
    // ============================================================================

    .page-content {
      padding: 2rem;
      max-width: 1200px;
      margin: 0 auto;
    }

    // ============================================================================
    // Buttons
    // ============================================================================

    .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      padding: 0.625rem 1.25rem;
      border-radius: $border-radius;
      font-size: 0.875rem;
      font-weight: 500;
      font-family: inherit;
      cursor: pointer;
      transition: $transition;
      border: 1px solid transparent;

      svg {
        width: 18px;
        height: 18px;
      }

      &:focus-visible {
        outline: 2px solid $teal-primary;
        outline-offset: 2px;
      }

      &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
    }

    .btn-primary {
      background: $teal-primary;
      border-color: $teal-primary;
      color: $white;

      &:hover:not(:disabled) {
        background: $teal-dark;
        border-color: $teal-dark;
      }
    }

    // ============================================================================
    // Toast
    // ============================================================================

    .toast {
      position: fixed;
      bottom: 1.5rem;
      right: 1.5rem;
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.875rem 1rem;
      background: $white;
      border-radius: $border-radius-lg;
      box-shadow: $shadow-lg;
      z-index: 1200;
      animation: toastSlideIn 0.3s ease-out;

      svg {
        width: 20px;
        height: 20px;
        flex-shrink: 0;
      }

      span {
        font-size: 0.875rem;
        color: $gray-700;
      }

      &.success {
        border-left: 4px solid $success;

        svg {
          color: $success;
        }
      }

      .btn-toast-close {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 24px;
        height: 24px;
        padding: 0;
        background: transparent;
        border: none;
        border-radius: $border-radius;
        color: $gray-400;
        cursor: pointer;
        margin-left: 0.5rem;

        svg {
          width: 16px;
          height: 16px;
        }

        &:hover {
          background: $gray-100;
          color: $gray-600;
        }
      }
    }

    @keyframes toastSlideIn {
      from {
        opacity: 0;
        transform: translateX(20px);
      }
      to {
        opacity: 1;
        transform: translateX(0);
      }
    }
  `]
})
export class ProviderManagementPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly providerService = inject(ProviderAdminService);
  private readonly tenantResolver = inject(TenantResolverService);

  // State signals
  readonly viewMode = signal<ViewMode>('list');
  readonly selectedProvider = signal<ProviderConfig | null>(null);
  readonly successMessage = signal<string | null>(null);

  // Service signals (exposed as signals for child components)
  readonly providers = this.providerService.providers;
  readonly isLoading = this.providerService.isLoading;
  readonly error = this.providerService.error;

  // Computed
  readonly tenantId = computed(() => {
    // First check route params, then fall back to tenant resolver
    const routeTenantId = this.route.snapshot.paramMap.get('tenantId');
    return routeTenantId || this.tenantResolver.tenant()?.uuid || this.tenantResolver.tenantId() || '';
  });

  ngOnInit(): void {
    this.loadProviders();

    // Check if we should open create/edit form based on route
    const providerId = this.route.snapshot.paramMap.get('providerId');
    if (this.route.snapshot.url.some(segment => segment.path === 'new')) {
      this.viewMode.set('create');
    } else if (providerId) {
      this.loadProviderForEdit(providerId);
    }
  }

  // =========================================================================
  // Data Loading
  // =========================================================================

  loadProviders(): void {
    const tenantId = this.tenantId();
    if (!tenantId) {
      console.error('No tenant ID available');
      return;
    }

    this.providerService.getProviders(tenantId).subscribe({
      error: err => console.error('Failed to load providers:', err)
    });
  }

  loadProviderForEdit(providerId: string): void {
    const tenantId = this.tenantId();
    if (!tenantId) return;

    this.providerService.getProvider(tenantId, providerId).subscribe({
      next: provider => {
        this.selectedProvider.set(provider);
        this.viewMode.set('edit');
      },
      error: err => {
        console.error('Failed to load provider:', err);
        this.viewMode.set('list');
      }
    });
  }

  // =========================================================================
  // Navigation
  // =========================================================================

  openCreateForm(): void {
    this.selectedProvider.set(null);
    this.viewMode.set('create');
  }

  openEditForm(provider: ProviderConfig): void {
    this.selectedProvider.set(provider);
    this.viewMode.set('edit');
  }

  closeForm(): void {
    this.selectedProvider.set(null);
    this.viewMode.set('list');
  }

  // =========================================================================
  // Event Handlers
  // =========================================================================

  handleProviderSaved(provider: ProviderConfig): void {
    const isNew = this.viewMode() === 'create';

    this.showSuccess(
      isNew
        ? `Provider "${provider.displayName}" created successfully`
        : `Provider "${provider.displayName}" updated successfully`
    );

    this.closeForm();
    this.loadProviders();
  }

  handleDelete(provider: ProviderConfig): void {
    const tenantId = this.tenantId();
    if (!tenantId || !provider.id) return;

    this.providerService.deleteProvider(tenantId, provider.id).subscribe({
      next: () => {
        this.showSuccess(`Provider "${provider.displayName}" deleted successfully`);
      },
      error: err => {
        console.error('Failed to delete provider:', err);
      }
    });
  }

  handleToggleEnabled(event: { provider: ProviderConfig; enabled: boolean }): void {
    const tenantId = this.tenantId();
    if (!tenantId || !event.provider.id) return;

    this.providerService
      .toggleProviderEnabled(tenantId, event.provider.id, event.enabled)
      .subscribe({
        next: () => {
          this.showSuccess(
            `Provider "${event.provider.displayName}" ${event.enabled ? 'enabled' : 'disabled'}`
          );
        },
        error: err => {
          console.error('Failed to toggle provider:', err);
        }
      });
  }

  // =========================================================================
  // Helpers
  // =========================================================================

  private showSuccess(message: string): void {
    this.successMessage.set(message);

    // Auto-hide after 5 seconds
    setTimeout(() => {
      if (this.successMessage() === message) {
        this.successMessage.set(null);
      }
    }, 5000);
  }
}
