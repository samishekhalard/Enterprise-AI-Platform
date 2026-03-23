import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  OnChanges,
  SimpleChanges,
  inject,
  signal,
  effect
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators
} from '@angular/forms';
import {
  ProviderConfig,
  ProviderType,
  Protocol,
  ProviderTemplate,
  createProviderFromTemplate
} from '../../models/provider-config.model';
import {
  PROVIDER_TEMPLATES,
  PROTOCOL_OPTIONS,
  SAML_NAME_ID_FORMATS
} from '../../data/provider-templates';
import { ProviderAdminService } from '../../services/provider-admin.service';

@Component({
  selector: 'app-provider-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="provider-form">
      <!-- Template Selection (only for new providers) -->
      @if (!provider && !selectedTemplate()) {
        <section class="form-section template-selection">
          <h3 class="section-title">Select Provider Type</h3>
          <p class="section-description">Choose a pre-configured template or create a custom provider.</p>

          <div class="template-grid">
            @for (template of templates; track template.type) {
              <button
                type="button"
                class="template-card"
                [class.selected]="selectedTemplate()?.type === template.type"
                (click)="selectTemplate(template)"
                [attr.data-testid]="'template-' + template.type.toLowerCase()">
                <div class="template-icon">
                  <img [src]="template.icon" [alt]="template.name" onerror="this.src='assets/icons/shield.svg'" />
                </div>
                <div class="template-info">
                  <span class="template-name">{{ template.name }}</span>
                  <span class="template-protocols">
                    @for (protocol of template.supportedProtocols; track protocol; let last = $last) {
                      {{ protocol }}{{ !last ? ' / ' : '' }}
                    }
                  </span>
                </div>
              </button>
            }
          </div>
        </section>
      }

      <!-- Configuration Form -->
      @if (selectedTemplate() || provider) {
        <form [formGroup]="form" (ngSubmit)="onSubmit()" class="config-form">
          <!-- Selected Template Header -->
          @if (selectedTemplate() && !provider) {
            <div class="selected-template-header">
              <div class="template-badge">
                <img [src]="selectedTemplate()!.icon" [alt]="selectedTemplate()!.name" onerror="this.src='assets/icons/shield.svg'" />
                <span>{{ selectedTemplate()!.name }}</span>
              </div>
              <button type="button" class="btn-change" (click)="clearTemplate()" data-testid="btn-change-template">
                Change
              </button>
            </div>
          }

          <!-- Basic Information -->
          <section class="form-section">
            <h3 class="section-title">Basic Information</h3>

            <div class="form-row">
              <div class="form-group">
                <label for="providerName" class="form-label required">Provider Name</label>
                <input
                  type="text"
                  id="providerName"
                  formControlName="providerName"
                  class="form-control"
                  [class.is-invalid]="isFieldInvalid('providerName')"
                  placeholder="e.g., corporate-sso"
                  data-testid="input-provider-name" />
                @if (isFieldInvalid('providerName')) {
                  <span class="field-error" data-testid="error-provider-name">
                    {{ getFieldError('providerName') }}
                  </span>
                }
                <span class="field-hint">Internal identifier (no spaces, lowercase)</span>
              </div>

              <div class="form-group">
                <label for="displayName" class="form-label required">Display Name</label>
                <input
                  type="text"
                  id="displayName"
                  formControlName="displayName"
                  class="form-control"
                  [class.is-invalid]="isFieldInvalid('displayName')"
                  placeholder="e.g., Corporate SSO"
                  data-testid="input-display-name" />
                @if (isFieldInvalid('displayName')) {
                  <span class="field-error" data-testid="error-display-name">
                    {{ getFieldError('displayName') }}
                  </span>
                }
                <span class="field-hint">Shown to users on the login page</span>
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label for="protocol" class="form-label required">Protocol</label>
                <select
                  id="protocol"
                  formControlName="protocol"
                  class="form-control"
                  [class.is-invalid]="isFieldInvalid('protocol')"
                  data-testid="select-protocol">
                  @for (option of protocolOptions; track option.value) {
                    <option [value]="option.value">{{ option.label }}</option>
                  }
                </select>
                @if (isFieldInvalid('protocol')) {
                  <span class="field-error">{{ getFieldError('protocol') }}</span>
                }
              </div>

              <div class="form-group">
                <label class="form-label">Status</label>
                <div class="toggle-group">
                  <label class="toggle">
                    <input
                      type="checkbox"
                      formControlName="enabled"
                      data-testid="toggle-enabled" />
                    <span class="toggle-slider"></span>
                    <span class="toggle-label">{{ form.get('enabled')?.value ? 'Enabled' : 'Disabled' }}</span>
                  </label>
                </div>
              </div>
            </div>
          </section>

          <!-- Protocol-Specific Configuration -->
          <section class="form-section">
            <h3 class="section-title">
              @switch (selectedProtocol()) {
                @case ('OIDC') { OpenID Connect Configuration }
                @case ('OAUTH2') { OAuth 2.0 Configuration }
                @case ('SAML') { SAML Configuration }
                @case ('LDAP') { LDAP Configuration }
              }
            </h3>

            @switch (selectedProtocol()) {
              @case ('OIDC') {
                @if (oidcGroup) {
                  <div formGroupName="oidc">
                    <div class="form-group">
                      <label for="discoveryUrl" class="form-label required">Discovery URL</label>
                      <div class="input-with-action">
                        <input
                          type="url"
                          id="discoveryUrl"
                          formControlName="discoveryUrl"
                          class="form-control"
                          [class.is-invalid]="isOidcFieldInvalid('discoveryUrl')"
                          placeholder="https://idp.example.com/.well-known/openid-configuration"
                          data-testid="input-discovery-url" />
                        <button
                          type="button"
                          class="btn-discover"
                          (click)="discoverConfig()"
                          [disabled]="isDiscovering()"
                          data-testid="btn-discover">
                          @if (isDiscovering()) {
                            <span class="spinner-sm"></span>
                          } @else {
                            Discover
                          }
                        </button>
                      </div>
                      @if (isOidcFieldInvalid('discoveryUrl')) {
                        <span class="field-error">{{ getOidcFieldError('discoveryUrl') }}</span>
                      }
                    </div>

                    <div class="form-row">
                      <div class="form-group">
                        <label for="clientId" class="form-label required">Client ID</label>
                        <input
                          type="text"
                          id="clientId"
                          formControlName="clientId"
                          class="form-control"
                          [class.is-invalid]="isOidcFieldInvalid('clientId')"
                          placeholder="your-client-id"
                          data-testid="input-client-id" />
                        @if (isOidcFieldInvalid('clientId')) {
                          <span class="field-error">{{ getOidcFieldError('clientId') }}</span>
                        }
                      </div>

                      <div class="form-group">
                        <label for="clientSecret" class="form-label">Client Secret</label>
                        <input
                          type="password"
                          id="clientSecret"
                          formControlName="clientSecret"
                          class="form-control"
                          placeholder="your-client-secret"
                          data-testid="input-client-secret" />
                        <span class="field-hint">Leave empty for public clients</span>
                      </div>
                    </div>

                    <div class="form-group">
                      <label for="scopes" class="form-label">Scopes</label>
                      <input
                        type="text"
                        id="scopes"
                        formControlName="scopes"
                        class="form-control"
                        placeholder="openid profile email"
                        data-testid="input-scopes" />
                      <span class="field-hint">Space-separated list of scopes</span>
                    </div>

                    <div class="form-group">
                      <label class="form-label">Options</label>
                      <div class="checkbox-group">
                        <label class="checkbox">
                          <input type="checkbox" formControlName="pkceEnabled" data-testid="checkbox-pkce" />
                          <span class="checkbox-mark"></span>
                          Enable PKCE (Proof Key for Code Exchange)
                        </label>
                      </div>
                    </div>
                  </div>
                }
              }

              @case ('OAUTH2') {
                @if (oauth2Group) {
                  <div formGroupName="oauth2">
                    <div class="form-row">
                      <div class="form-group">
                        <label for="oauth2-authorizationUrl" class="form-label required">Authorization URL</label>
                        <input
                          type="url"
                          id="oauth2-authorizationUrl"
                          formControlName="authorizationUrl"
                          class="form-control"
                          [class.is-invalid]="isOauth2FieldInvalid('authorizationUrl')"
                          placeholder="https://idp.example.com/authorize"
                          data-testid="input-authorization-url" />
                        @if (isOauth2FieldInvalid('authorizationUrl')) {
                          <span class="field-error">{{ getOauth2FieldError('authorizationUrl') }}</span>
                        }
                      </div>

                      <div class="form-group">
                        <label for="oauth2-tokenUrl" class="form-label required">Token URL</label>
                        <input
                          type="url"
                          id="oauth2-tokenUrl"
                          formControlName="tokenUrl"
                          class="form-control"
                          [class.is-invalid]="isOauth2FieldInvalid('tokenUrl')"
                          placeholder="https://idp.example.com/token"
                          data-testid="input-token-url" />
                        @if (isOauth2FieldInvalid('tokenUrl')) {
                          <span class="field-error">{{ getOauth2FieldError('tokenUrl') }}</span>
                        }
                      </div>
                    </div>

                    <div class="form-row">
                      <div class="form-group">
                        <label for="oauth2-clientId" class="form-label required">Client ID</label>
                        <input
                          type="text"
                          id="oauth2-clientId"
                          formControlName="clientId"
                          class="form-control"
                          [class.is-invalid]="isOauth2FieldInvalid('clientId')"
                          placeholder="your-client-id"
                          data-testid="input-oauth2-client-id" />
                        @if (isOauth2FieldInvalid('clientId')) {
                          <span class="field-error">{{ getOauth2FieldError('clientId') }}</span>
                        }
                      </div>

                      <div class="form-group">
                        <label for="oauth2-clientSecret" class="form-label">Client Secret</label>
                        <input
                          type="password"
                          id="oauth2-clientSecret"
                          formControlName="clientSecret"
                          class="form-control"
                          placeholder="your-client-secret"
                          data-testid="input-oauth2-client-secret" />
                      </div>
                    </div>

                    <div class="form-group">
                      <label for="oauth2-scopes" class="form-label">Scopes</label>
                      <input
                        type="text"
                        id="oauth2-scopes"
                        formControlName="scopes"
                        class="form-control"
                        placeholder="read write"
                        data-testid="input-oauth2-scopes" />
                    </div>
                  </div>
                }
              }

              @case ('SAML') {
                @if (samlGroup) {
                  <div formGroupName="saml">
                    <div class="form-group">
                      <label for="metadataUrl" class="form-label required">Metadata URL</label>
                      <div class="input-with-action">
                        <input
                          type="url"
                          id="metadataUrl"
                          formControlName="metadataUrl"
                          class="form-control"
                          [class.is-invalid]="isSamlFieldInvalid('metadataUrl')"
                          placeholder="https://idp.example.com/metadata"
                          data-testid="input-metadata-url" />
                        <button type="button" class="btn-discover" data-testid="btn-fetch-metadata">
                          Fetch
                        </button>
                      </div>
                      @if (isSamlFieldInvalid('metadataUrl')) {
                        <span class="field-error">{{ getSamlFieldError('metadataUrl') }}</span>
                      }
                    </div>

                    <div class="form-row">
                      <div class="form-group">
                        <label for="entityId" class="form-label required">Entity ID</label>
                        <input
                          type="text"
                          id="entityId"
                          formControlName="entityId"
                          class="form-control"
                          [class.is-invalid]="isSamlFieldInvalid('entityId')"
                          placeholder="https://your-app.example.com"
                          data-testid="input-entity-id" />
                        @if (isSamlFieldInvalid('entityId')) {
                          <span class="field-error">{{ getSamlFieldError('entityId') }}</span>
                        }
                      </div>

                      <div class="form-group">
                        <label for="nameIdFormat" class="form-label">Name ID Format</label>
                        <select
                          id="nameIdFormat"
                          formControlName="nameIdFormat"
                          class="form-control"
                          data-testid="select-nameid-format">
                          @for (format of nameIdFormats; track format.value) {
                            <option [value]="format.value">{{ format.label }}</option>
                          }
                        </select>
                      </div>
                    </div>

                    <div class="form-group">
                      <label for="certificate" class="form-label">IdP Certificate (PEM)</label>
                      <textarea
                        id="certificate"
                        formControlName="certificate"
                        class="form-control code-input"
                        rows="4"
                        placeholder="-----BEGIN CERTIFICATE-----&#10;...&#10;-----END CERTIFICATE-----"
                        data-testid="input-certificate"></textarea>
                    </div>

                    <div class="form-group">
                      <label class="form-label">Options</label>
                      <div class="checkbox-group">
                        <label class="checkbox">
                          <input type="checkbox" formControlName="signRequests" data-testid="checkbox-sign-requests" />
                          <span class="checkbox-mark"></span>
                          Sign authentication requests
                        </label>
                        <label class="checkbox">
                          <input type="checkbox" formControlName="wantAssertionsSigned" data-testid="checkbox-assertions-signed" />
                          <span class="checkbox-mark"></span>
                          Require signed assertions
                        </label>
                      </div>
                    </div>
                  </div>
                }
              }

              @case ('LDAP') {
                @if (ldapGroup) {
                  <div formGroupName="ldap">
                    <div class="form-row">
                      <div class="form-group flex-2">
                        <label for="serverUrl" class="form-label required">Server URL</label>
                        <input
                          type="text"
                          id="serverUrl"
                          formControlName="serverUrl"
                          class="form-control"
                          [class.is-invalid]="isLdapFieldInvalid('serverUrl')"
                          placeholder="ldap://ldap.example.com"
                          data-testid="input-server-url" />
                        @if (isLdapFieldInvalid('serverUrl')) {
                          <span class="field-error">{{ getLdapFieldError('serverUrl') }}</span>
                        }
                      </div>

                      <div class="form-group flex-1">
                        <label for="port" class="form-label">Port</label>
                        <input
                          type="number"
                          id="port"
                          formControlName="port"
                          class="form-control"
                          placeholder="389"
                          data-testid="input-port" />
                      </div>
                    </div>

                    <div class="form-row">
                      <div class="form-group">
                        <label for="bindDn" class="form-label required">Bind DN</label>
                        <input
                          type="text"
                          id="bindDn"
                          formControlName="bindDn"
                          class="form-control"
                          [class.is-invalid]="isLdapFieldInvalid('bindDn')"
                          placeholder="cn=admin,dc=example,dc=com"
                          data-testid="input-bind-dn" />
                        @if (isLdapFieldInvalid('bindDn')) {
                          <span class="field-error">{{ getLdapFieldError('bindDn') }}</span>
                        }
                      </div>

                      <div class="form-group">
                        <label for="bindPassword" class="form-label">Bind Password</label>
                        <input
                          type="password"
                          id="bindPassword"
                          formControlName="bindPassword"
                          class="form-control"
                          placeholder="password"
                          data-testid="input-bind-password" />
                      </div>
                    </div>

                    <div class="form-group">
                      <label for="userSearchBase" class="form-label required">User Search Base</label>
                      <input
                        type="text"
                        id="userSearchBase"
                        formControlName="userSearchBase"
                        class="form-control"
                        [class.is-invalid]="isLdapFieldInvalid('userSearchBase')"
                        placeholder="ou=users,dc=example,dc=com"
                        data-testid="input-user-search-base" />
                      @if (isLdapFieldInvalid('userSearchBase')) {
                        <span class="field-error">{{ getLdapFieldError('userSearchBase') }}</span>
                      }
                    </div>

                    <div class="form-group">
                      <label for="userSearchFilter" class="form-label required">User Search Filter</label>
                      <input
                        type="text"
                        id="userSearchFilter"
                        formControlName="userSearchFilter"
                        class="form-control"
                        [class.is-invalid]="isLdapFieldInvalid('userSearchFilter')"
                        placeholder="(&(objectClass=person)(uid={0}))"
                        data-testid="input-user-search-filter" />
                      @if (isLdapFieldInvalid('userSearchFilter')) {
                        <span class="field-error">{{ getLdapFieldError('userSearchFilter') }}</span>
                      }
                      <span class="field-hint">Use &#123;0&#125; as placeholder for username</span>
                    </div>

                    <div class="form-group">
                      <label class="form-label">Security</label>
                      <div class="checkbox-group">
                        <label class="checkbox">
                          <input type="checkbox" formControlName="useSsl" data-testid="checkbox-use-ssl" />
                          <span class="checkbox-mark"></span>
                          Use SSL (LDAPS)
                        </label>
                        <label class="checkbox">
                          <input type="checkbox" formControlName="useTls" data-testid="checkbox-use-tls" />
                          <span class="checkbox-mark"></span>
                          Use StartTLS
                        </label>
                      </div>
                    </div>
                  </div>
                }
              }
            }
          </section>

          <!-- Advanced Settings -->
          <section class="form-section collapsible" [class.collapsed]="!showAdvanced()">
            <button type="button" class="section-toggle" (click)="showAdvanced.set(!showAdvanced())" data-testid="btn-toggle-advanced">
              <span class="section-title">Advanced Settings</span>
              <svg class="toggle-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </button>

            @if (showAdvanced()) {
              <div class="section-content">
                <div class="form-row">
                  <div class="form-group">
                    <label for="idpHint" class="form-label">IDP Hint</label>
                    <input
                      type="text"
                      id="idpHint"
                      formControlName="idpHint"
                      class="form-control"
                      placeholder="Optional identifier"
                      data-testid="input-idp-hint" />
                    <span class="field-hint">Used to pre-select this provider</span>
                  </div>

                  <div class="form-group">
                    <label for="iconUrl" class="form-label">Custom Icon URL</label>
                    <input
                      type="url"
                      id="iconUrl"
                      formControlName="iconUrl"
                      class="form-control"
                      placeholder="https://example.com/icon.svg"
                      data-testid="input-icon-url" />
                  </div>
                </div>

                <div class="form-group">
                  <label for="allowedDomains" class="form-label">Allowed Email Domains</label>
                  <input
                    type="text"
                    id="allowedDomains"
                    formControlName="allowedDomains"
                    class="form-control"
                    placeholder="example.com, company.org"
                    data-testid="input-allowed-domains" />
                  <span class="field-hint">Comma-separated list. Leave empty to allow all domains.</span>
                </div>

                <div class="form-group">
                  <label for="sortOrder" class="form-label">Sort Order</label>
                  <input
                    type="number"
                    id="sortOrder"
                    formControlName="sortOrder"
                    class="form-control"
                    placeholder="0"
                    min="0"
                    data-testid="input-sort-order" />
                  <span class="field-hint">Lower numbers appear first on the login page</span>
                </div>
              </div>
            }
          </section>

          <!-- Form Actions -->
          <div class="form-actions">
            <button
              type="button"
              class="btn btn-outline"
              (click)="onCancel()"
              data-testid="btn-cancel">
              Cancel
            </button>
            <button
              type="submit"
              class="btn btn-primary"
              [disabled]="form.invalid || isSaving()"
              data-testid="btn-save">
              @if (isSaving()) {
                <span class="spinner-sm"></span>
                Saving...
              } @else {
                {{ provider ? 'Update Provider' : 'Create Provider' }}
              }
            </button>
          </div>
        </form>
      }
    </div>
  `,
  styleUrl: './provider-form.component.scss'
})
export class ProviderFormComponent implements OnInit, OnChanges {
  private readonly fb = inject(FormBuilder);
  private readonly providerService = inject(ProviderAdminService);

  @Input() tenantId!: string;
  @Input() provider?: ProviderConfig;
  @Output() saved = new EventEmitter<ProviderConfig>();
  @Output() cancelled = new EventEmitter<void>();

  // State signals
  readonly selectedTemplate = signal<ProviderTemplate | null>(null);
  readonly selectedProtocol = signal<Protocol>('OIDC');
  readonly showAdvanced = signal(false);
  readonly isDiscovering = signal(false);
  readonly isSaving = signal(false);

  // Static data
  readonly templates = PROVIDER_TEMPLATES;
  readonly protocolOptions = PROTOCOL_OPTIONS;
  readonly nameIdFormats = SAML_NAME_ID_FORMATS;

  // Main form group
  form!: FormGroup;

  // Protocol-specific form groups (getters for template access)
  get oidcGroup(): FormGroup | null {
    return this.form.get('oidc') as FormGroup;
  }

  get oauth2Group(): FormGroup | null {
    return this.form.get('oauth2') as FormGroup;
  }

  get samlGroup(): FormGroup | null {
    return this.form.get('saml') as FormGroup;
  }

  get ldapGroup(): FormGroup | null {
    return this.form.get('ldap') as FormGroup;
  }

  constructor() {
    // React to protocol changes
    effect(() => {
      const protocol = this.selectedProtocol();
      this.updateProtocolValidators(protocol);
    });
  }

  ngOnInit(): void {
    this.initForm();

    // If editing, populate form with existing data
    if (this.provider) {
      this.populateForm(this.provider);
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['provider'] && !changes['provider'].firstChange) {
      if (this.provider) {
        this.populateForm(this.provider);
      } else {
        this.resetForm();
      }
    }
  }

  // =========================================================================
  // Template Selection
  // =========================================================================

  selectTemplate(template: ProviderTemplate): void {
    this.selectedTemplate.set(template);

    createProviderFromTemplate(template);
    this.form.patchValue({
      providerType: template.type,
      protocol: template.supportedProtocols[0]
    });
    this.selectedProtocol.set(template.supportedProtocols[0]);

    // Apply template defaults to protocol-specific groups
    if (template.defaultConfig.scopes) {
      const scopesString = template.defaultConfig.scopes.join(' ');
      if (this.oidcGroup) {
        this.oidcGroup.patchValue({ scopes: scopesString });
      }
      if (this.oauth2Group) {
        this.oauth2Group.patchValue({ scopes: scopesString });
      }
    }
  }

  clearTemplate(): void {
    this.selectedTemplate.set(null);
    this.resetForm();
  }

  // =========================================================================
  // Form Initialization
  // =========================================================================

  private initForm(): void {
    this.form = this.fb.group({
      // Basic fields
      providerName: ['', [Validators.required, Validators.pattern(/^[a-z0-9-]+$/)]],
      displayName: ['', [Validators.required, Validators.minLength(2)]],
      providerType: ['CUSTOM' as ProviderType, Validators.required],
      protocol: ['OIDC' as Protocol, Validators.required],
      enabled: [false],

      // OIDC config
      oidc: this.fb.group({
        discoveryUrl: ['', [Validators.pattern(/^https?:\/\/.+/)]],
        clientId: [''],
        clientSecret: [''],
        scopes: ['openid profile email'],
        pkceEnabled: [true]
      }),

      // OAuth2 config
      oauth2: this.fb.group({
        authorizationUrl: ['', [Validators.pattern(/^https?:\/\/.+/)]],
        tokenUrl: ['', [Validators.pattern(/^https?:\/\/.+/)]],
        clientId: [''],
        clientSecret: [''],
        scopes: ['']
      }),

      // SAML config
      saml: this.fb.group({
        metadataUrl: ['', [Validators.pattern(/^https?:\/\/.+/)]],
        entityId: [''],
        nameIdFormat: ['urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress'],
        certificate: [''],
        signRequests: [true],
        wantAssertionsSigned: [true]
      }),

      // LDAP config
      ldap: this.fb.group({
        serverUrl: [''],
        port: [389],
        bindDn: [''],
        bindPassword: [''],
        userSearchBase: [''],
        userSearchFilter: ['(&(objectClass=person)(uid={0}))'],
        useSsl: [false],
        useTls: [true]
      }),

      // Advanced settings
      idpHint: [''],
      iconUrl: [''],
      allowedDomains: [''],
      sortOrder: [0]
    });

    // Listen for protocol changes
    this.form.get('protocol')?.valueChanges.subscribe((protocol: Protocol) => {
      this.selectedProtocol.set(protocol);
    });
  }

  private populateForm(provider: ProviderConfig): void {
    // Set the template if we can identify it
    const template = PROVIDER_TEMPLATES.find(t => t.type === provider.providerType);
    if (template) {
      this.selectedTemplate.set(template);
    }

    this.selectedProtocol.set(provider.protocol);

    // Populate basic fields
    this.form.patchValue({
      providerName: provider.providerName,
      displayName: provider.displayName,
      providerType: provider.providerType,
      protocol: provider.protocol,
      enabled: provider.enabled,
      idpHint: provider.idpHint || '',
      iconUrl: provider.iconUrl || '',
      allowedDomains: provider.allowedDomains?.join(', ') || '',
      sortOrder: provider.sortOrder || 0
    });

    // Populate protocol-specific fields
    switch (provider.protocol) {
      case 'OIDC':
        this.oidcGroup?.patchValue({
          discoveryUrl: provider.discoveryUrl || '',
          clientId: provider.clientId || '',
          clientSecret: provider.clientSecret || '',
          scopes: provider.scopes?.join(' ') || 'openid profile email',
          pkceEnabled: provider.pkceEnabled ?? true
        });
        break;

      case 'OAUTH2':
        this.oauth2Group?.patchValue({
          authorizationUrl: provider.authorizationUrl || '',
          tokenUrl: provider.tokenUrl || '',
          clientId: provider.clientId || '',
          clientSecret: provider.clientSecret || '',
          scopes: provider.scopes?.join(' ') || ''
        });
        break;

      case 'SAML':
        this.samlGroup?.patchValue({
          metadataUrl: provider.metadataUrl || '',
          entityId: provider.entityId || '',
          nameIdFormat: provider.nameIdFormat || 'urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress',
          certificate: provider.certificate || '',
          signRequests: provider.signRequests ?? true,
          wantAssertionsSigned: provider.wantAssertionsSigned ?? true
        });
        break;

      case 'LDAP':
        this.ldapGroup?.patchValue({
          serverUrl: provider.serverUrl || '',
          port: provider.port || 389,
          bindDn: provider.bindDn || '',
          bindPassword: provider.bindPassword || '',
          userSearchBase: provider.userSearchBase || '',
          userSearchFilter: provider.userSearchFilter || '(&(objectClass=person)(uid={0}))',
          useSsl: provider.useSsl ?? false,
          useTls: provider.useTls ?? true
        });
        break;
    }
  }

  private resetForm(): void {
    this.form.reset({
      providerType: 'CUSTOM',
      protocol: 'OIDC',
      enabled: false,
      oidc: {
        scopes: 'openid profile email',
        pkceEnabled: true
      },
      oauth2: {
        scopes: ''
      },
      saml: {
        nameIdFormat: 'urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress',
        signRequests: true,
        wantAssertionsSigned: true
      },
      ldap: {
        port: 389,
        userSearchFilter: '(&(objectClass=person)(uid={0}))',
        useSsl: false,
        useTls: true
      },
      sortOrder: 0
    });
    this.selectedProtocol.set('OIDC');
  }

  // =========================================================================
  // Validators
  // =========================================================================

  private updateProtocolValidators(protocol: Protocol): void {
    // Clear all protocol validators first
    this.clearProtocolValidators();

    // Add validators for the selected protocol
    switch (protocol) {
      case 'OIDC':
        this.oidcGroup?.get('discoveryUrl')?.setValidators([Validators.required, Validators.pattern(/^https?:\/\/.+/)]);
        this.oidcGroup?.get('clientId')?.setValidators([Validators.required]);
        break;

      case 'OAUTH2':
        this.oauth2Group?.get('authorizationUrl')?.setValidators([Validators.required, Validators.pattern(/^https?:\/\/.+/)]);
        this.oauth2Group?.get('tokenUrl')?.setValidators([Validators.required, Validators.pattern(/^https?:\/\/.+/)]);
        this.oauth2Group?.get('clientId')?.setValidators([Validators.required]);
        break;

      case 'SAML':
        this.samlGroup?.get('metadataUrl')?.setValidators([Validators.required, Validators.pattern(/^https?:\/\/.+/)]);
        this.samlGroup?.get('entityId')?.setValidators([Validators.required]);
        break;

      case 'LDAP':
        this.ldapGroup?.get('serverUrl')?.setValidators([Validators.required]);
        this.ldapGroup?.get('bindDn')?.setValidators([Validators.required]);
        this.ldapGroup?.get('userSearchBase')?.setValidators([Validators.required]);
        this.ldapGroup?.get('userSearchFilter')?.setValidators([Validators.required]);
        break;
    }

    // Update validity
    this.form.updateValueAndValidity();
  }

  private clearProtocolValidators(): void {
    // OIDC
    this.oidcGroup?.get('discoveryUrl')?.clearValidators();
    this.oidcGroup?.get('clientId')?.clearValidators();

    // OAuth2
    this.oauth2Group?.get('authorizationUrl')?.clearValidators();
    this.oauth2Group?.get('tokenUrl')?.clearValidators();
    this.oauth2Group?.get('clientId')?.clearValidators();

    // SAML
    this.samlGroup?.get('metadataUrl')?.clearValidators();
    this.samlGroup?.get('entityId')?.clearValidators();

    // LDAP
    this.ldapGroup?.get('serverUrl')?.clearValidators();
    this.ldapGroup?.get('bindDn')?.clearValidators();
    this.ldapGroup?.get('userSearchBase')?.clearValidators();
    this.ldapGroup?.get('userSearchFilter')?.clearValidators();
  }

  // =========================================================================
  // Field Validation Helpers
  // =========================================================================

  isFieldInvalid(fieldName: string): boolean {
    const control = this.form.get(fieldName);
    return control ? control.invalid && (control.dirty || control.touched) : false;
  }

  getFieldError(fieldName: string): string {
    const control = this.form.get(fieldName);
    if (!control?.errors) return '';

    if (control.errors['required']) return 'This field is required';
    if (control.errors['pattern']) {
      if (fieldName === 'providerName') return 'Only lowercase letters, numbers, and hyphens allowed';
      return 'Invalid format';
    }
    if (control.errors['minlength']) return `Minimum ${control.errors['minlength'].requiredLength} characters`;
    return 'Invalid value';
  }

  // OIDC field helpers
  isOidcFieldInvalid(fieldName: string): boolean {
    const control = this.oidcGroup?.get(fieldName);
    return control ? control.invalid && (control.dirty || control.touched) : false;
  }

  getOidcFieldError(fieldName: string): string {
    const control = this.oidcGroup?.get(fieldName);
    if (!control?.errors) return '';
    if (control.errors['required']) return 'This field is required';
    if (control.errors['pattern']) return 'Must be a valid URL';
    return 'Invalid value';
  }

  // OAuth2 field helpers
  isOauth2FieldInvalid(fieldName: string): boolean {
    const control = this.oauth2Group?.get(fieldName);
    return control ? control.invalid && (control.dirty || control.touched) : false;
  }

  getOauth2FieldError(fieldName: string): string {
    const control = this.oauth2Group?.get(fieldName);
    if (!control?.errors) return '';
    if (control.errors['required']) return 'This field is required';
    if (control.errors['pattern']) return 'Must be a valid URL';
    return 'Invalid value';
  }

  // SAML field helpers
  isSamlFieldInvalid(fieldName: string): boolean {
    const control = this.samlGroup?.get(fieldName);
    return control ? control.invalid && (control.dirty || control.touched) : false;
  }

  getSamlFieldError(fieldName: string): string {
    const control = this.samlGroup?.get(fieldName);
    if (!control?.errors) return '';
    if (control.errors['required']) return 'This field is required';
    if (control.errors['pattern']) return 'Must be a valid URL';
    return 'Invalid value';
  }

  // LDAP field helpers
  isLdapFieldInvalid(fieldName: string): boolean {
    const control = this.ldapGroup?.get(fieldName);
    return control ? control.invalid && (control.dirty || control.touched) : false;
  }

  getLdapFieldError(fieldName: string): string {
    const control = this.ldapGroup?.get(fieldName);
    if (!control?.errors) return '';
    if (control.errors['required']) return 'This field is required';
    return 'Invalid value';
  }

  // =========================================================================
  // Actions
  // =========================================================================

  discoverConfig(): void {
    const discoveryUrl = this.oidcGroup?.get('discoveryUrl')?.value;
    if (!discoveryUrl) return;

    this.isDiscovering.set(true);

    this.providerService.discoverOidcConfig(discoveryUrl).subscribe({
      next: config => {
        if (config.scopes) {
          this.oidcGroup?.patchValue({ scopes: config.scopes.join(' ') });
        }
        this.isDiscovering.set(false);
      },
      error: () => {
        this.isDiscovering.set(false);
      }
    });
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.markAllAsTouched();
      return;
    }

    this.isSaving.set(true);
    const config = this.buildProviderConfig();

    if (this.provider?.id) {
      // Update existing
      this.providerService.updateProvider(this.tenantId, this.provider.id, config).subscribe({
        next: updated => {
          this.isSaving.set(false);
          this.saved.emit(updated);
        },
        error: () => {
          this.isSaving.set(false);
        }
      });
    } else {
      // Create new
      this.providerService.createProvider(this.tenantId, config).subscribe({
        next: created => {
          this.isSaving.set(false);
          this.saved.emit(created);
        },
        error: () => {
          this.isSaving.set(false);
        }
      });
    }
  }

  onCancel(): void {
    this.cancelled.emit();
  }

  private buildProviderConfig(): ProviderConfig {
    const formValue = this.form.value;
    const protocol = formValue.protocol as Protocol;

    const config: ProviderConfig = {
      providerName: formValue.providerName,
      displayName: formValue.displayName,
      providerType: formValue.providerType,
      protocol: protocol,
      enabled: formValue.enabled,
      idpHint: formValue.idpHint || undefined,
      iconUrl: formValue.iconUrl || undefined,
      sortOrder: formValue.sortOrder || 0,
      allowedDomains: formValue.allowedDomains
        ? formValue.allowedDomains.split(',').map((d: string) => d.trim()).filter(Boolean)
        : undefined
    };

    // Add protocol-specific fields
    switch (protocol) {
      case 'OIDC': {
        const oidc = formValue.oidc;
        config.discoveryUrl = oidc.discoveryUrl;
        config.clientId = oidc.clientId;
        config.clientSecret = oidc.clientSecret || undefined;
        config.scopes = oidc.scopes?.split(' ').filter(Boolean);
        config.pkceEnabled = oidc.pkceEnabled;
        break;
      }

      case 'OAUTH2': {
        const oauth2 = formValue.oauth2;
        config.authorizationUrl = oauth2.authorizationUrl;
        config.tokenUrl = oauth2.tokenUrl;
        config.clientId = oauth2.clientId;
        config.clientSecret = oauth2.clientSecret || undefined;
        config.scopes = oauth2.scopes?.split(' ').filter(Boolean);
        break;
      }

      case 'SAML': {
        const saml = formValue.saml;
        config.metadataUrl = saml.metadataUrl;
        config.entityId = saml.entityId;
        config.nameIdFormat = saml.nameIdFormat;
        config.certificate = saml.certificate || undefined;
        config.signRequests = saml.signRequests;
        config.wantAssertionsSigned = saml.wantAssertionsSigned;
        break;
      }

      case 'LDAP': {
        const ldap = formValue.ldap;
        config.serverUrl = ldap.serverUrl;
        config.port = ldap.port;
        config.bindDn = ldap.bindDn;
        config.bindPassword = ldap.bindPassword || undefined;
        config.userSearchBase = ldap.userSearchBase;
        config.userSearchFilter = ldap.userSearchFilter;
        config.useSsl = ldap.useSsl;
        config.useTls = ldap.useTls;
        break;
      }
    }

    return config;
  }

  private markAllAsTouched(): void {
    Object.keys(this.form.controls).forEach(key => {
      const control = this.form.get(key);
      if (control instanceof FormGroup) {
        Object.keys(control.controls).forEach(nestedKey => {
          control.get(nestedKey)?.markAsTouched();
        });
      } else {
        control?.markAsTouched();
      }
    });
  }
}
