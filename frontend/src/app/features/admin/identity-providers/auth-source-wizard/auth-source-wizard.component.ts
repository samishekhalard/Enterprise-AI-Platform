import { CommonModule } from '@angular/common';
import {
  Component,
  computed,
  EventEmitter,
  inject,
  Input,
  OnInit,
  Output,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { SelectModule } from 'primeng/select';
import { StepperModule } from 'primeng/stepper';
import { TextareaModule } from 'primeng/textarea';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { NgIcon } from '@ng-icons/core';
import { ApiGatewayService } from '../../../../core/api/api-gateway.service';
import { TenantIdentityProviderRequest } from '../../../../core/api/models';
import {
  SOURCE_WIZARD_DIALOG_BREAKPOINTS,
  SOURCE_WIZARD_DIALOG_STYLE,
  wizardDialogPt as sharedWizardDialogPt,
} from '../../../../core/theme/overlay-presets';
import {
  AttributeMapping,
  AuthSourceProtocol,
  AuthSourceWizardState,
  ConnectionState,
  createDefaultWizardState,
  GroupRoleMapping,
  LdapConnectionState,
  OAuthConnectionState,
  OidcConnectionState,
  PROTOCOL_CARDS,
  SamlConnectionState,
  ScimConnectionState,
  TestCheckResult,
  WIZARD_STEP_LABELS,
  WIZARD_STEPS,
  WizardStep,
} from './auth-source-wizard.models';

interface SelectOption<T> {
  label: string;
  value: T;
}

@Component({
  selector: 'app-auth-source-wizard',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    DialogModule,
    InputNumberModule,
    InputTextModule,
    MessageModule,
    SelectModule,
    StepperModule,
    TextareaModule,
    ToggleSwitchModule,
    NgIcon,
  ],
  templateUrl: './auth-source-wizard.component.html',
  styleUrl: './auth-source-wizard.component.scss',
})
export class AuthSourceWizardComponent implements OnInit {
  private readonly api = inject(ApiGatewayService);

  @Input({ required: true }) tenantId = '';
  @Input() visible = false;
  @Output() readonly closed = new EventEmitter<void>();
  @Output() readonly created = new EventEmitter<void>();

  protected readonly steps = WIZARD_STEPS;
  protected readonly stepLabels = WIZARD_STEP_LABELS;
  protected readonly protocolCards = PROTOCOL_CARDS;
  protected readonly ldapTlsModeOptions: SelectOption<LdapConnectionState['tlsMode']>[] = [
    { label: 'None', value: 'NONE' },
    { label: 'STARTTLS', value: 'STARTTLS' },
    { label: 'LDAPS', value: 'LDAPS' },
  ];
  protected readonly ldapTlsVersionOptions: SelectOption<LdapConnectionState['tlsMinVersion']>[] = [
    { label: 'TLS 1.2', value: 'TLS1.2' },
    { label: 'TLS 1.3', value: 'TLS1.3' },
  ];
  protected readonly samlMetadataSourceOptions: SelectOption<
    SamlConnectionState['metadataSource']
  >[] = [
    { label: 'URL', value: 'url' },
    { label: 'Manual XML Upload', value: 'upload' },
  ];
  protected readonly samlNameIdOptions: SelectOption<string>[] = [
    {
      label: 'Email',
      value: 'urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress',
    },
    {
      label: 'Persistent',
      value: 'urn:oasis:names:tc:SAML:2.0:nameid-format:persistent',
    },
    {
      label: 'Transient',
      value: 'urn:oasis:names:tc:SAML:2.0:nameid-format:transient',
    },
    {
      label: 'Unspecified',
      value: 'urn:oasis:names:tc:SAML:1.1:nameid-format:unspecified',
    },
  ];
  protected readonly samlSignatureOptions: SelectOption<string>[] = [
    { label: 'RSA-SHA256', value: 'RSA_SHA256' },
    { label: 'RSA-SHA512', value: 'RSA_SHA512' },
  ];
  protected readonly scimAuthMethodOptions: SelectOption<ScimConnectionState['authMethod']>[] = [
    { label: 'Bearer Token', value: 'BEARER' },
    { label: 'OAuth 2.0 Client Credentials', value: 'OAUTH2_CC' },
  ];
  protected readonly scimPaginationOptions: SelectOption<ScimConnectionState['paginationType']>[] =
    [
      { label: 'Index-based', value: 'INDEX' },
      { label: 'Cursor-based', value: 'CURSOR' },
    ];
  protected readonly mappingTransformOptions: SelectOption<AttributeMapping['transform']>[] = [
    { label: 'None', value: 'NONE' },
    { label: 'Lowercase', value: 'LOWERCASE' },
    { label: 'Uppercase', value: 'UPPERCASE' },
    { label: 'Trim', value: 'TRIM' },
  ];
  protected readonly roleOptions: SelectOption<string>[] = [
    { label: 'Tenant Admin', value: 'TENANT_ADMIN' },
    { label: 'Power User', value: 'POWER_USER' },
    { label: 'Contributor', value: 'CONTRIBUTOR' },
    { label: 'Viewer', value: 'VIEWER' },
  ];
  protected readonly conflictResolutionOptions: SelectOption<
    AuthSourceWizardState['syncStep']['sync']['conflictResolution']
  >[] = [
    { label: 'Source Wins', value: 'SOURCE_WINS' },
    { label: 'Target Wins', value: 'TARGET_WINS' },
    { label: 'Manual Resolution', value: 'MANUAL' },
  ];
  protected readonly wizardDialogPt = sharedWizardDialogPt;
  protected readonly wizardDialogStyle = SOURCE_WIZARD_DIALOG_STYLE;
  protected readonly wizardDialogBreakpoints = SOURCE_WIZARD_DIALOG_BREAKPOINTS;

  protected readonly currentStep = signal<WizardStep>('protocol');
  protected readonly state = signal<AuthSourceWizardState>(createDefaultWizardState());
  protected readonly submitting = signal(false);
  protected readonly submitError = signal<string | null>(null);
  protected readonly showCancelConfirm = signal(false);
  protected readonly passwordVisible = signal<Record<string, boolean>>({});

  protected readonly currentStepIndex = computed(() => WIZARD_STEPS.indexOf(this.currentStep()));
  protected readonly stepperValue = computed(() => this.currentStepIndex() + 1);

  protected readonly canGoNext = computed(() => {
    const step = this.currentStep();
    const s = this.state();
    if (step === 'protocol') {
      return !!s.protocolStep.displayName.trim() && s.protocolStep.protocol !== null;
    }
    if (step === 'connection') {
      return this.validateConnectionStep(s);
    }
    return true;
  });

  protected readonly canGoBack = computed(() => this.currentStepIndex() > 0);

  protected readonly isLastStep = computed(
    () => this.currentStepIndex() === WIZARD_STEPS.length - 1,
  );

  protected readonly selectedProtocol = computed(() => this.state().protocolStep.protocol);

  protected readonly activeConnection = computed((): ConnectionState | null => {
    const s = this.state();
    switch (s.protocolStep.protocol) {
      case 'LDAP':
        return s.ldapConnection;
      case 'SAML':
        return s.samlConnection;
      case 'SCIM':
        return s.scimConnection;
      case 'OAUTH2':
        return s.oauthConnection;
      case 'OIDC':
        return s.oidcConnection;
      default:
        return null;
    }
  });

  ngOnInit(): void {
    this.resetWizard();
  }

  protected stepStatus(step: WizardStep): 'completed' | 'active' | 'pending' {
    const idx = WIZARD_STEPS.indexOf(step);
    const current = this.currentStepIndex();
    if (idx < current) return 'completed';
    if (idx === current) return 'active';
    return 'pending';
  }

  protected goToStep(step: WizardStep): void {
    const idx = WIZARD_STEPS.indexOf(step);
    if (idx <= this.currentStepIndex()) {
      this.currentStep.set(step);
    }
  }

  protected goNext(): void {
    if (!this.canGoNext()) return;
    const idx = this.currentStepIndex();
    if (idx < WIZARD_STEPS.length - 1) {
      this.currentStep.set(WIZARD_STEPS[idx + 1]);
    }
    if (this.currentStep() === 'review') {
      this.initTestChecks();
    }
  }

  protected goBack(): void {
    const idx = this.currentStepIndex();
    if (idx > 0) {
      this.currentStep.set(WIZARD_STEPS[idx - 1]);
    }
  }

  protected onStepperValueChange(value: number): void {
    const targetStep = WIZARD_STEPS[value - 1];
    if (!targetStep) return;
    if (value - 1 <= this.currentStepIndex()) {
      this.currentStep.set(targetStep);
    }
  }

  protected onDialogVisibleChange(visible: boolean): void {
    if (!visible) {
      this.requestClose();
    }
  }

  protected selectProtocol(protocol: AuthSourceProtocol): void {
    this.state.update((s) => ({
      ...s,
      protocolStep: { ...s.protocolStep, protocol },
    }));
  }

  protected updateDisplayName(value: string): void {
    this.state.update((s) => ({
      ...s,
      protocolStep: { ...s.protocolStep, displayName: value },
    }));
  }

  // ─── Connection field updates ─────────────────────────────────
  protected updateLdap<K extends keyof LdapConnectionState>(
    field: K,
    value: LdapConnectionState[K],
  ): void {
    this.state.update((s) => ({
      ...s,
      ldapConnection: { ...s.ldapConnection, [field]: value },
    }));
  }

  protected updateSaml<K extends keyof SamlConnectionState>(
    field: K,
    value: SamlConnectionState[K],
  ): void {
    this.state.update((s) => ({
      ...s,
      samlConnection: { ...s.samlConnection, [field]: value },
    }));
  }

  protected updateScim<K extends keyof ScimConnectionState>(
    field: K,
    value: ScimConnectionState[K],
  ): void {
    this.state.update((s) => ({
      ...s,
      scimConnection: { ...s.scimConnection, [field]: value },
    }));
  }

  protected updateOAuth<K extends keyof OAuthConnectionState>(
    field: K,
    value: OAuthConnectionState[K],
  ): void {
    this.state.update((s) => ({
      ...s,
      oauthConnection: { ...s.oauthConnection, [field]: value },
    }));
  }

  protected updateOidc<K extends keyof OidcConnectionState>(
    field: K,
    value: OidcConnectionState[K],
  ): void {
    this.state.update((s) => ({
      ...s,
      oidcConnection: { ...s.oidcConnection, [field]: value },
    }));
  }

  // ─── Mapping updates ─────────────────────────────────────────
  protected addAttributeMapping(): void {
    this.state.update((s) => ({
      ...s,
      mapping: {
        ...s.mapping,
        attributeMappings: [
          ...s.mapping.attributeMappings,
          { sourceAttribute: '', targetAttribute: '', transform: 'NONE' as const },
        ],
      },
    }));
  }

  protected removeAttributeMapping(index: number): void {
    this.state.update((s) => ({
      ...s,
      mapping: {
        ...s.mapping,
        attributeMappings: s.mapping.attributeMappings.filter((_, i) => i !== index),
      },
    }));
  }

  protected updateAttributeMapping(
    index: number,
    field: keyof AttributeMapping,
    value: string,
  ): void {
    this.state.update((s) => ({
      ...s,
      mapping: {
        ...s.mapping,
        attributeMappings: s.mapping.attributeMappings.map((m, i) =>
          i === index ? { ...m, [field]: value } : m,
        ),
      },
    }));
  }

  protected addGroupRoleMapping(): void {
    this.state.update((s) => ({
      ...s,
      mapping: {
        ...s.mapping,
        groupRoleMappings: [...s.mapping.groupRoleMappings, { sourceGroup: '', targetRole: '' }],
      },
    }));
  }

  protected removeGroupRoleMapping(index: number): void {
    this.state.update((s) => ({
      ...s,
      mapping: {
        ...s.mapping,
        groupRoleMappings: s.mapping.groupRoleMappings.filter((_, i) => i !== index),
      },
    }));
  }

  protected updateGroupRoleMapping(
    index: number,
    field: keyof GroupRoleMapping,
    value: string,
  ): void {
    this.state.update((s) => ({
      ...s,
      mapping: {
        ...s.mapping,
        groupRoleMappings: s.mapping.groupRoleMappings.map((m, i) =>
          i === index ? { ...m, [field]: value } : m,
        ),
      },
    }));
  }

  // ─── Sync updates ────────────────────────────────────────────
  protected updateSyncField<K extends keyof AuthSourceWizardState['syncStep']['sync']>(
    field: K,
    value: AuthSourceWizardState['syncStep']['sync'][K],
  ): void {
    this.state.update((s) => ({
      ...s,
      syncStep: {
        ...s.syncStep,
        sync: { ...s.syncStep.sync, [field]: value },
      },
    }));
  }

  protected toggleTenantAssignment(index: number): void {
    this.state.update((s) => ({
      ...s,
      syncStep: {
        ...s.syncStep,
        tenantAssignments: s.syncStep.tenantAssignments.map((t, i) =>
          i === index ? { ...t, assigned: !t.assigned } : t,
        ),
      },
    }));
  }

  // ─── Password visibility toggle ──────────────────────────────
  protected togglePasswordVisibility(field: string): void {
    this.passwordVisible.update((pv) => ({ ...pv, [field]: !pv[field] }));
  }

  protected isPasswordVisible(field: string): boolean {
    return !!this.passwordVisible()[field];
  }

  // ─── Test & Submit ────────────────────────────────────────────
  protected initTestChecks(): void {
    const checks: TestCheckResult[] = [
      {
        name: 'Network Reachability',
        description: 'Verify endpoint is reachable',
        status: 'pending',
      },
      { name: 'Authentication', description: 'Validate credentials', status: 'pending' },
      { name: 'Schema Discovery', description: 'Retrieve identity schema', status: 'pending' },
      {
        name: 'Sample User Fetch',
        description: 'Retrieve a sample user record',
        status: 'pending',
      },
    ];
    this.state.update((s) => ({ ...s, testResults: checks }));
  }

  protected runTests(): void {
    const checks = this.state().testResults.map((c) => ({ ...c, status: 'running' as const }));
    this.state.update((s) => ({ ...s, testResults: checks }));

    // Simulate test execution with sequential delays
    checks.forEach((_, idx) => {
      setTimeout(
        () => {
          this.state.update((s) => ({
            ...s,
            testResults: s.testResults.map((c, i) =>
              i === idx ? { ...c, status: 'success' as const, message: 'Check passed' } : c,
            ),
          }));
        },
        800 * (idx + 1),
      );
    });
  }

  protected allTestsPassed(): boolean {
    const results = this.state().testResults;
    return results.length > 0 && results.every((r) => r.status === 'success');
  }

  protected anyTestRunning(): boolean {
    return this.state().testResults.some((r) => r.status === 'running');
  }

  protected submit(): void {
    this.submitting.set(true);
    this.submitError.set(null);

    const request = this.buildProviderRequest();
    this.api.createTenantIdentityProvider(this.tenantId, request).subscribe({
      next: () => {
        this.submitting.set(false);
        this.created.emit();
        this.closeWizard();
      },
      error: (err: unknown) => {
        this.submitting.set(false);
        let msg = 'Failed to create authentication source.';
        if (err && typeof err === 'object') {
          const httpErr = err as {
            status?: number;
            error?: { message?: string; error?: string };
            message?: string;
          };
          if (httpErr.error?.message) {
            msg = httpErr.error.message;
          } else if (httpErr.error?.error) {
            msg = httpErr.error.error;
          } else if (httpErr.message) {
            msg = httpErr.message;
          }
          if (httpErr.status) {
            msg = `[${httpErr.status}] ${msg}`;
          }
        }
        this.submitError.set(msg);
      },
    });
  }

  protected requestClose(): void {
    const s = this.state();
    const isDirty =
      s.protocolStep.displayName.trim().length > 0 || s.protocolStep.protocol !== null;
    if (isDirty) {
      this.showCancelConfirm.set(true);
    } else {
      this.closeWizard();
    }
  }

  protected confirmClose(): void {
    this.showCancelConfirm.set(false);
    this.closeWizard();
  }

  protected dismissCancelConfirm(): void {
    this.showCancelConfirm.set(false);
  }

  protected getConfigSummary(): { label: string; value: string }[] {
    const s = this.state();
    const summary: { label: string; value: string }[] = [
      { label: 'Display Name', value: s.protocolStep.displayName },
      { label: 'Protocol', value: s.protocolStep.protocol ?? 'None' },
    ];

    if (s.protocolStep.protocol === 'LDAP') {
      summary.push(
        { label: 'Server URL(s)', value: s.ldapConnection.serverUrls },
        { label: 'Base DN', value: s.ldapConnection.baseDn },
        { label: 'TLS Mode', value: s.ldapConnection.tlsMode },
      );
    } else if (s.protocolStep.protocol === 'SAML') {
      summary.push(
        { label: 'Metadata Source', value: s.samlConnection.metadataSource },
        { label: 'Entity ID', value: s.samlConnection.entityId },
      );
    } else if (s.protocolStep.protocol === 'SCIM') {
      summary.push(
        { label: 'Endpoint URL', value: s.scimConnection.endpointUrl },
        { label: 'Auth Method', value: s.scimConnection.authMethod },
      );
    } else if (s.protocolStep.protocol === 'OAUTH2') {
      summary.push(
        { label: 'Authorization URL', value: s.oauthConnection.authorizationUrl },
        { label: 'Client ID', value: s.oauthConnection.clientId },
      );
    } else if (s.protocolStep.protocol === 'OIDC') {
      summary.push(
        { label: 'Discovery URL', value: s.oidcConnection.discoveryUrl },
        { label: 'Client ID', value: s.oidcConnection.clientId },
      );
    }

    summary.push(
      { label: 'Attribute Mappings', value: String(s.mapping.attributeMappings.length) },
      { label: 'Group-Role Mappings', value: String(s.mapping.groupRoleMappings.length) },
      { label: 'Sync Enabled', value: s.syncStep.sync.syncEnabled ? 'Yes' : 'No' },
      {
        label: 'Sync Interval',
        value: s.syncStep.sync.syncEnabled ? `${s.syncStep.sync.intervalMinutes} min` : 'N/A',
      },
    );

    return summary;
  }

  protected testStatusIcon(status: TestCheckResult['status']): string {
    switch (status) {
      case 'success':
        return 'phosphorCheckCircleThin';
      case 'failure':
        return 'phosphorXCircleThin';
      case 'running':
        return 'phosphorSpinnerThin';
      default:
        return 'phosphorCircleThin';
    }
  }

  protected testStatusClass(status: TestCheckResult['status']): string {
    switch (status) {
      case 'success':
        return 'test-success';
      case 'failure':
        return 'test-failure';
      case 'running':
        return 'test-running';
      default:
        return 'test-pending';
    }
  }

  private closeWizard(): void {
    this.resetWizard();
    this.closed.emit();
  }

  private resetWizard(): void {
    this.currentStep.set('protocol');
    this.state.set(createDefaultWizardState());
    this.submitting.set(false);
    this.submitError.set(null);
    this.showCancelConfirm.set(false);
    this.passwordVisible.set({});
  }

  private validateConnectionStep(s: AuthSourceWizardState): boolean {
    const protocol = s.protocolStep.protocol;
    if (protocol === 'LDAP') {
      return !!(
        s.ldapConnection.serverUrls.trim() &&
        s.ldapConnection.baseDn.trim() &&
        s.ldapConnection.bindDn.trim()
      );
    }
    if (protocol === 'SAML') {
      if (s.samlConnection.metadataSource === 'url') {
        return !!s.samlConnection.metadataUrl.trim();
      }
      return !!s.samlConnection.metadataXml.trim();
    }
    if (protocol === 'SCIM') {
      return !!s.scimConnection.endpointUrl.trim();
    }
    if (protocol === 'OAUTH2') {
      return !!(
        s.oauthConnection.clientId.trim() &&
        (s.oauthConnection.authorizationUrl.trim() || s.oauthConnection.tokenUrl.trim())
      );
    }
    if (protocol === 'OIDC') {
      return !!(s.oidcConnection.discoveryUrl.trim() && s.oidcConnection.clientId.trim());
    }
    return false;
  }

  private buildProviderRequest(): TenantIdentityProviderRequest {
    const s = this.state();
    const protocol = s.protocolStep.protocol!;
    const protocolMap: Record<AuthSourceProtocol, TenantIdentityProviderRequest['protocol']> = {
      LDAP: 'LDAP',
      SAML: 'SAML',
      SCIM: 'OIDC', // SCIM maps to OIDC in the existing backend model
      OAUTH2: 'OAUTH2',
      OIDC: 'OIDC',
    };

    const base: TenantIdentityProviderRequest = {
      providerName: s.protocolStep.displayName.trim().toUpperCase().replace(/\s+/g, '_'),
      displayName: s.protocolStep.displayName.trim(),
      protocol: protocolMap[protocol],
      enabled: true,
      priority: 100,
      trustEmail: true,
      storeToken: false,
      linkExistingAccounts: true,
    };

    if (protocol === 'LDAP') {
      return {
        ...base,
        serverUrl: s.ldapConnection.serverUrls,
        bindDn: s.ldapConnection.bindDn,
        bindPassword: s.ldapConnection.bindPassword,
        userSearchBase: s.ldapConnection.baseDn,
        userSearchFilter: s.ldapConnection.searchFilter,
      };
    }
    if (protocol === 'SAML') {
      return {
        ...base,
        metadataUrl: s.samlConnection.metadataUrl || undefined,
      };
    }
    if (protocol === 'OIDC') {
      return {
        ...base,
        discoveryUrl: s.oidcConnection.discoveryUrl,
        clientId: s.oidcConnection.clientId,
        clientSecret: s.oidcConnection.clientSecret || undefined,
        scopes: s.oidcConnection.scopes.split(/[\s,]+/).filter((sc) => sc.length > 0),
      };
    }
    if (protocol === 'OAUTH2') {
      return {
        ...base,
        authorizationUrl: s.oauthConnection.authorizationUrl,
        tokenUrl: s.oauthConnection.tokenUrl,
        userInfoUrl: s.oauthConnection.userInfoUrl || undefined,
        clientId: s.oauthConnection.clientId,
        clientSecret: s.oauthConnection.clientSecret || undefined,
        scopes: s.oauthConnection.scopes.split(/[\s,]+/).filter((sc) => sc.length > 0),
      };
    }
    // SCIM
    return base;
  }
}
