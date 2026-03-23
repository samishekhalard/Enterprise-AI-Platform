import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, Input, OnChanges, OnInit, signal, SimpleChanges } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { TagModule } from 'primeng/tag';
import { Observable } from 'rxjs';
import { ApiGatewayService } from '../../../core/api/api-gateway.service';
import {
  ProviderTestConnectionResponse,
  TenantIdentityProvider,
  TenantIdentityProviderRequest,
} from '../../../core/api/models';

type ProviderProtocol = 'OIDC' | 'SAML' | 'LDAP' | 'OAUTH2';
type ProviderFormMode = 'list' | 'create' | 'edit';

interface ProviderFormState {
  providerName: string;
  displayName: string;
  protocol: ProviderProtocol;
  enabled: boolean;
  priority: number;
  clientId: string;
  clientSecret: string;
  discoveryUrl: string;
  metadataUrl: string;
  serverUrl: string;
  port: string;
  bindDn: string;
  bindPassword: string;
  userSearchBase: string;
  userSearchFilter: string;
  scopesCsv: string;
  idpHint: string;
  authorizationUrl: string;
  tokenUrl: string;
  userInfoUrl: string;
  jwksUrl: string;
  issuerUrl: string;
}

const DEFAULT_FORM: ProviderFormState = {
  providerName: '',
  displayName: '',
  protocol: 'OIDC',
  enabled: true,
  priority: 100,
  clientId: '',
  clientSecret: '',
  discoveryUrl: '',
  metadataUrl: '',
  serverUrl: '',
  port: '',
  bindDn: '',
  bindPassword: '',
  userSearchBase: '',
  userSearchFilter: '',
  scopesCsv: 'openid,profile,email',
  idpHint: '',
  authorizationUrl: '',
  tokenUrl: '',
  userInfoUrl: '',
  jwksUrl: '',
  issuerUrl: '',
};

@Component({
  selector: 'app-provider-embedded',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    CardModule,
    InputTextModule,
    MessageModule,
    ProgressSpinnerModule,
    TagModule,
  ],
  templateUrl: './provider-embedded.component.html',
  styleUrl: './provider-embedded.component.scss',
})
export class ProviderEmbeddedComponent implements OnInit, OnChanges {
  private readonly api = inject(ApiGatewayService);

  @Input({ required: true }) tenantId = '';
  @Input() tenantName = 'Tenant';

  protected readonly mode = signal<ProviderFormMode>('list');
  protected readonly loading = signal(false);
  protected readonly loadingDetails = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly formError = signal<string | null>(null);
  protected readonly formSubmitting = signal(false);
  protected readonly providers = signal<readonly TenantIdentityProvider[]>([]);
  protected readonly editingProvider = signal<TenantIdentityProvider | null>(null);
  protected readonly activeProviderActionId = signal<string | null>(null);
  protected readonly activeProviderAction = signal<string | null>(null);
  protected readonly testResult = signal<ProviderTestConnectionResponse | null>(null);
  protected readonly form = signal<ProviderFormState>({ ...DEFAULT_FORM });

  ngOnInit(): void {
    this.loadProviders();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['tenantId'] && !changes['tenantId'].firstChange) {
      this.resetFormState();
      this.loadProviders();
    }
  }

  protected loadProviders(): void {
    if (!this.tenantId.trim()) {
      this.providers.set([]);
      this.error.set('Tenant identifier is missing.');
      return;
    }

    this.loading.set(true);
    this.error.set(null);
    this.testResult.set(null);

    this.api.listTenantIdentityProviders(this.tenantId).subscribe({
      next: (providers) => {
        this.providers.set(providers);
        this.loading.set(false);
      },
      error: (error: unknown) => {
        this.providers.set([]);
        this.error.set(
          this.resolveErrorMessage(error, 'Unable to load identity providers from backend.'),
        );
        this.loading.set(false);
      },
    });
  }

  protected openCreate(): void {
    this.mode.set('create');
    this.editingProvider.set(null);
    this.formError.set(null);
    this.testResult.set(null);
    this.form.set({ ...DEFAULT_FORM });
  }

  protected openEdit(provider: TenantIdentityProvider): void {
    this.mode.set('edit');
    this.editingProvider.set(provider);
    this.formError.set(null);
    this.testResult.set(null);
    this.form.set(this.providerToForm(provider));
    this.hydrateProviderDetails(provider.id);
  }

  protected cancelForm(): void {
    this.resetFormState();
  }

  protected updateForm<K extends keyof ProviderFormState>(
    field: K,
    value: ProviderFormState[K],
  ): void {
    this.form.update((state) => ({ ...state, [field]: value }));
  }

  protected submitForm(): void {
    const state = this.form();
    this.formError.set(null);
    this.testResult.set(null);

    const validationError = this.validateForm(state);
    if (validationError) {
      this.formError.set(validationError);
      return;
    }

    const request = this.toProviderRequest(state);
    this.formSubmitting.set(true);

    if (this.mode() === 'create') {
      this.api.createTenantIdentityProvider(this.tenantId, request).subscribe({
        next: () => {
          this.formSubmitting.set(false);
          this.resetFormState();
          this.loadProviders();
        },
        error: (error: unknown) => {
          this.formSubmitting.set(false);
          this.formError.set(
            this.resolveErrorMessage(error, 'Unable to create identity provider.'),
          );
        },
      });
      return;
    }

    const target = this.editingProvider();
    if (!target) {
      this.formSubmitting.set(false);
      this.formError.set('No provider selected for editing.');
      return;
    }

    this.api.updateTenantIdentityProvider(this.tenantId, target.id, request).subscribe({
      next: () => {
        this.formSubmitting.set(false);
        this.resetFormState();
        this.loadProviders();
      },
      error: (error: unknown) => {
        this.formSubmitting.set(false);
        this.formError.set(this.resolveErrorMessage(error, 'Unable to update identity provider.'));
      },
    });
  }

  protected toggleEnabled(provider: TenantIdentityProvider): void {
    const nextEnabled = !provider.enabled;
    this.runProviderAction(provider, 'toggle', () =>
      this.api.patchTenantIdentityProvider(this.tenantId, provider.id, { enabled: nextEnabled }),
    );
  }

  protected testProvider(provider: TenantIdentityProvider): void {
    this.activeProviderActionId.set(provider.id);
    this.activeProviderAction.set('test');
    this.testResult.set(null);
    this.formError.set(null);

    this.api.testTenantIdentityProvider(this.tenantId, provider.id).subscribe({
      next: (result) => {
        this.activeProviderActionId.set(null);
        this.activeProviderAction.set(null);
        this.testResult.set(result);
        this.loadProviders();
      },
      error: (error: unknown) => {
        this.activeProviderActionId.set(null);
        this.activeProviderAction.set(null);
        this.formError.set(this.resolveErrorMessage(error, 'Provider test failed.'));
      },
    });
  }

  protected deleteProvider(provider: TenantIdentityProvider): void {
    const confirmed = confirm(
      `Delete provider "${provider.displayName}"? This action cannot be undone.`,
    );
    if (!confirmed) {
      return;
    }

    this.runProviderAction(provider, 'delete', () =>
      this.api.deleteTenantIdentityProvider(this.tenantId, provider.id),
    );
  }

  protected isActionBusy(providerId: string, action: string): boolean {
    return this.activeProviderActionId() === providerId && this.activeProviderAction() === action;
  }

  protected isEditMode(): boolean {
    return this.mode() === 'edit';
  }

  protected statusSeverity(status: 'active' | 'inactive'): 'success' | 'secondary' {
    return status === 'active' ? 'success' : 'secondary';
  }

  protected providerDescription(provider: TenantIdentityProvider): string {
    const protocol = provider.protocol.toUpperCase();
    if (protocol === 'OIDC') {
      return 'OpenID Connect identity provider.';
    }
    if (protocol === 'SAML') {
      return 'SAML federation identity provider.';
    }
    if (protocol === 'LDAP') {
      return 'LDAP/Active Directory identity provider.';
    }
    if (protocol === 'OAUTH2') {
      return 'OAuth 2.0 identity provider.';
    }
    return 'Identity provider configuration.';
  }

  protected protocolFieldsVisible(protocol: ProviderProtocol): {
    oidc: boolean;
    saml: boolean;
    ldap: boolean;
    oauth2: boolean;
  } {
    return {
      oidc: protocol === 'OIDC',
      saml: protocol === 'SAML',
      ldap: protocol === 'LDAP',
      oauth2: protocol === 'OAUTH2',
    };
  }

  private hydrateProviderDetails(providerId: string): void {
    if (!this.tenantId.trim()) {
      return;
    }

    this.loadingDetails.set(true);
    this.api.getTenantIdentityProvider(this.tenantId, providerId).subscribe({
      next: (provider) => {
        this.editingProvider.set(provider);
        this.form.set(this.providerToForm(provider));
        this.loadingDetails.set(false);
      },
      error: () => {
        // Keep basic values already populated from list response.
        this.loadingDetails.set(false);
      },
    });
  }

  private runProviderAction(
    provider: TenantIdentityProvider,
    action: string,
    operation: () => Observable<unknown>,
  ): void {
    this.activeProviderActionId.set(provider.id);
    this.activeProviderAction.set(action);
    this.formError.set(null);
    this.testResult.set(null);

    operation().subscribe({
      next: () => {
        this.activeProviderActionId.set(null);
        this.activeProviderAction.set(null);
        this.loadProviders();
      },
      error: (error: unknown) => {
        this.activeProviderActionId.set(null);
        this.activeProviderAction.set(null);
        this.formError.set(this.resolveErrorMessage(error, 'Provider action failed.'));
      },
    });
  }

  private toProviderRequest(state: ProviderFormState): TenantIdentityProviderRequest {
    const scopes = state.scopesCsv
      .split(',')
      .map((scope) => scope.trim())
      .filter((scope) => scope.length > 0);

    return {
      providerName: state.providerName.trim().toUpperCase(),
      displayName: state.displayName.trim(),
      protocol: state.protocol,
      enabled: state.enabled,
      priority: state.priority,
      clientId: this.cleanOptional(state.clientId),
      clientSecret: this.cleanOptional(state.clientSecret),
      discoveryUrl: this.cleanOptional(state.discoveryUrl),
      metadataUrl: this.cleanOptional(state.metadataUrl),
      serverUrl: this.cleanOptional(state.serverUrl),
      port: this.asOptionalNumber(state.port),
      bindDn: this.cleanOptional(state.bindDn),
      bindPassword: this.cleanOptional(state.bindPassword),
      userSearchBase: this.cleanOptional(state.userSearchBase),
      userSearchFilter: this.cleanOptional(state.userSearchFilter),
      scopes: scopes.length > 0 ? scopes : undefined,
      idpHint: this.cleanOptional(state.idpHint),
      authorizationUrl: this.cleanOptional(state.authorizationUrl),
      tokenUrl: this.cleanOptional(state.tokenUrl),
      userInfoUrl: this.cleanOptional(state.userInfoUrl),
      jwksUrl: this.cleanOptional(state.jwksUrl),
      issuerUrl: this.cleanOptional(state.issuerUrl),
      trustEmail: true,
      storeToken: false,
      linkExistingAccounts: true,
    };
  }

  private providerToForm(provider: TenantIdentityProvider): ProviderFormState {
    return {
      ...DEFAULT_FORM,
      providerName: provider.providerName,
      displayName: provider.displayName,
      protocol: this.asProtocol(provider.protocol),
      enabled: provider.enabled,
      priority: provider.priority ?? 100,
      clientId: provider.clientId ?? '',
      discoveryUrl: provider.discoveryUrl ?? '',
      metadataUrl: provider.metadataUrl ?? '',
      serverUrl: provider.serverUrl ?? '',
      port: provider.port != null ? String(provider.port) : '',
      bindDn: provider.bindDn ?? '',
      userSearchBase: provider.userSearchBase ?? '',
      userSearchFilter: provider.userSearchFilter ?? '',
      scopesCsv: provider.scopes?.join(',') ?? DEFAULT_FORM.scopesCsv,
      idpHint: provider.idpHint ?? '',
      authorizationUrl: provider.authorizationUrl ?? '',
      tokenUrl: provider.tokenUrl ?? '',
      userInfoUrl: provider.userInfoUrl ?? '',
      jwksUrl: provider.jwksUrl ?? '',
      issuerUrl: provider.issuerUrl ?? '',
    };
  }

  private validateForm(state: ProviderFormState): string | null {
    if (!state.providerName.trim()) {
      return 'Provider name is required.';
    }
    if (!state.displayName.trim()) {
      return 'Display name is required.';
    }

    const protocol = state.protocol;
    if (protocol === 'OIDC') {
      if (!state.discoveryUrl.trim()) {
        return 'OIDC requires a discovery URL.';
      }
      if (!state.clientId.trim()) {
        return 'OIDC requires a client ID.';
      }
    }

    if (protocol === 'SAML' && !state.metadataUrl.trim()) {
      return 'SAML requires a metadata URL.';
    }

    if (protocol === 'LDAP') {
      if (!state.serverUrl.trim()) {
        return 'LDAP requires a server URL.';
      }
      if (!state.port.trim()) {
        return 'LDAP requires a port.';
      }
      if (!state.bindDn.trim()) {
        return 'LDAP requires a bind DN.';
      }
      if (!state.userSearchBase.trim()) {
        return 'LDAP requires a user search base.';
      }
      if (!state.userSearchFilter.trim()) {
        return 'LDAP requires a user search filter.';
      }
    }

    if (protocol === 'OAUTH2') {
      if (!state.clientId.trim()) {
        return 'OAUTH2 requires a client ID.';
      }
      if (!state.authorizationUrl.trim() && !state.tokenUrl.trim()) {
        return 'OAUTH2 requires at least authorization URL or token URL.';
      }
    }

    return null;
  }

  private cleanOptional(value: string): string | undefined {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  }

  private asOptionalNumber(value: string): number | undefined {
    const trimmed = value.trim();
    if (!trimmed) {
      return undefined;
    }
    const parsed = Number(trimmed);
    return Number.isFinite(parsed) ? parsed : undefined;
  }

  private asProtocol(value: string): ProviderProtocol {
    if (value === 'SAML' || value === 'LDAP' || value === 'OAUTH2') {
      return value;
    }
    return 'OIDC';
  }

  private resetFormState(): void {
    this.mode.set('list');
    this.editingProvider.set(null);
    this.formError.set(null);
    this.formSubmitting.set(false);
    this.loadingDetails.set(false);
    this.form.set({ ...DEFAULT_FORM });
  }

  private resolveErrorMessage(error: unknown, fallback: string): string {
    if (error instanceof HttpErrorResponse) {
      if (error.status === 403) {
        return 'Access denied for tenant providers. Verify ADMIN scope and tenant context.';
      }
      if (error.status === 404) {
        return 'Provider endpoint returned not found for this tenant.';
      }
      if (typeof error.error === 'string' && error.error.trim().length > 0) {
        return error.error;
      }
      if (typeof error.error === 'object' && error.error !== null) {
        const message = (error.error as Record<string, unknown>)['message'];
        if (typeof message === 'string' && message.trim().length > 0) {
          return message;
        }
      }
    }
    return fallback;
  }
}
