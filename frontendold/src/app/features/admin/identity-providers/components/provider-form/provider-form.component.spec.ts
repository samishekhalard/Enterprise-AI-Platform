import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { of, throwError } from 'rxjs';
import { ProviderFormComponent } from './provider-form.component';
import { ProviderAdminService } from '../../services/provider-admin.service';
import { ProviderConfig } from '../../models/provider-config.model';
import { PROVIDER_TEMPLATES } from '../../data/provider-templates';

describe('ProviderFormComponent', () => {
  let component: ProviderFormComponent;
  let fixture: ComponentFixture<ProviderFormComponent>;
  let providerServiceMock: {
    createProvider: ReturnType<typeof vi.fn>;
    updateProvider: ReturnType<typeof vi.fn>;
    discoverOidcConfig: ReturnType<typeof vi.fn>;
  };

  // ===========================================================================
  // Test Data
  // ===========================================================================
  const mockProvider: ProviderConfig = {
    id: 'provider-1',
    providerName: 'keycloak-sso',
    providerType: 'KEYCLOAK',
    protocol: 'OIDC',
    displayName: 'Keycloak SSO',
    enabled: true,
    clientId: 'client-id-123',
    clientSecret: 'secret-123',
    discoveryUrl: 'https://keycloak.example.com/.well-known/openid-configuration',
    scopes: ['openid', 'profile', 'email'],
    pkceEnabled: true,
    sortOrder: 1,
    allowedDomains: ['example.com', 'test.org']
  };

  const mockKeycloakTemplate = PROVIDER_TEMPLATES.find(t => t.type === 'KEYCLOAK');

  // ===========================================================================
  // Setup and Teardown
  // ===========================================================================
  beforeEach(async () => {
    providerServiceMock = {
      createProvider: vi.fn().mockReturnValue(of(mockProvider)),
      updateProvider: vi.fn().mockReturnValue(of(mockProvider)),
      discoverOidcConfig: vi.fn().mockReturnValue(of({
        discoveryUrl: 'https://example.com/.well-known/openid-configuration',
        authorizationUrl: 'https://example.com/authorize',
        tokenUrl: 'https://example.com/token',
        scopes: ['openid', 'profile', 'email']
      }))
    };

    await TestBed.configureTestingModule({
      imports: [ProviderFormComponent, ReactiveFormsModule],
      providers: [
        { provide: ProviderAdminService, useValue: providerServiceMock }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ProviderFormComponent);
    component = fixture.componentInstance;
    component.tenantId = 'tenant-123';
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // ===========================================================================
  // Creation Tests
  // ===========================================================================
  describe('Creation', () => {
    it('should create component', () => {
      fixture.detectChanges();
      expect(component).toBeTruthy();
    });

    it('should have templates available', () => {
      fixture.detectChanges();
      expect(component.templates.length).toBeGreaterThan(0);
    });

    it('should have protocol options available', () => {
      fixture.detectChanges();
      expect(component.protocolOptions.length).toBe(4);
    });
  });

  // ===========================================================================
  // Create Mode Tests
  // ===========================================================================
  describe('Create Mode', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should initialize empty form in create mode', () => {
      // Assert
      expect(component.form.get('providerName')?.value).toBe('');
      expect(component.form.get('displayName')?.value).toBe('');
      expect(component.form.get('protocol')?.value).toBe('OIDC');
      expect(component.form.get('enabled')?.value).toBe(false);
    });

    it('should start with no selected template', () => {
      expect(component.selectedTemplate()).toBeNull();
    });

    it('should start with OIDC as default protocol', () => {
      expect(component.selectedProtocol()).toBe('OIDC');
    });

    it('should start with showAdvanced as false', () => {
      expect(component.showAdvanced()).toBe(false);
    });

    it('should start with isSaving as false', () => {
      expect(component.isSaving()).toBe(false);
    });

    it('should start with isDiscovering as false', () => {
      expect(component.isDiscovering()).toBe(false);
    });
  });

  // ===========================================================================
  // Edit Mode Tests
  // ===========================================================================
  describe('Edit Mode', () => {
    beforeEach(() => {
      component.provider = mockProvider;
      fixture.detectChanges();
    });

    it('should populate form in edit mode with existing provider', () => {
      // Assert
      expect(component.form.get('providerName')?.value).toBe('keycloak-sso');
      expect(component.form.get('displayName')?.value).toBe('Keycloak SSO');
      expect(component.form.get('protocol')?.value).toBe('OIDC');
      expect(component.form.get('enabled')?.value).toBe(true);
    });

    it('should populate OIDC fields in edit mode', () => {
      // Assert
      expect(component.oidcGroup?.get('discoveryUrl')?.value).toBe('https://keycloak.example.com/.well-known/openid-configuration');
      expect(component.oidcGroup?.get('clientId')?.value).toBe('client-id-123');
      expect(component.oidcGroup?.get('clientSecret')?.value).toBe('secret-123');
      expect(component.oidcGroup?.get('scopes')?.value).toBe('openid profile email');
      expect(component.oidcGroup?.get('pkceEnabled')?.value).toBe(true);
    });

    it('should set selectedTemplate if provider type matches template', () => {
      // Assert
      expect(component.selectedTemplate()?.type).toBe('KEYCLOAK');
    });

    it('should set selectedProtocol from provider', () => {
      // Assert
      expect(component.selectedProtocol()).toBe('OIDC');
    });

    it('should populate advanced settings', () => {
      // Assert
      expect(component.form.get('sortOrder')?.value).toBe(1);
      expect(component.form.get('allowedDomains')?.value).toBe('example.com, test.org');
    });
  });

  // ===========================================================================
  // Validation Tests
  // ===========================================================================
  describe('Validation', () => {
    beforeEach(() => {
      fixture.detectChanges();
      component.selectTemplate(mockKeycloakTemplate!);
    });

    it('should validate required fields', () => {
      // Assert - form should be invalid when required fields are empty
      expect(component.form.valid).toBe(false);
    });

    it('should validate providerName pattern (lowercase, numbers, hyphens)', () => {
      // Arrange
      component.form.get('providerName')?.setValue('Invalid Name');
      component.form.get('providerName')?.markAsTouched();

      // Assert
      expect(component.isFieldInvalid('providerName')).toBe(true);
      expect(component.getFieldError('providerName')).toContain('lowercase');
    });

    it('should accept valid providerName', () => {
      // Arrange
      component.form.get('providerName')?.setValue('valid-name-123');
      component.form.get('providerName')?.markAsTouched();

      // Assert
      expect(component.form.get('providerName')?.valid).toBe(true);
    });

    it('should validate displayName minimum length', () => {
      // Arrange
      component.form.get('displayName')?.setValue('A');
      component.form.get('displayName')?.markAsTouched();

      // Assert
      expect(component.isFieldInvalid('displayName')).toBe(true);
      expect(component.getFieldError('displayName')).toContain('Minimum');
    });

    it('should require OIDC discoveryUrl when OIDC protocol selected', () => {
      // Arrange
      component.selectedProtocol.set('OIDC');

      // Act - trigger validators update
      fixture.detectChanges();

      // Assert
      expect(component.oidcGroup?.get('discoveryUrl')?.hasError('required')).toBe(true);
    });

    it('should require OIDC clientId when OIDC protocol selected', () => {
      // Arrange
      component.selectedProtocol.set('OIDC');
      fixture.detectChanges();

      // Assert
      expect(component.oidcGroup?.get('clientId')?.hasError('required')).toBe(true);
    });

    it('should validate form is valid with all required fields filled', () => {
      // Arrange
      component.form.patchValue({
        providerName: 'test-provider',
        displayName: 'Test Provider',
        protocol: 'OIDC',
        oidc: {
          discoveryUrl: 'https://example.com/.well-known/openid-configuration',
          clientId: 'client-123'
        }
      });

      // Assert
      expect(component.form.valid).toBe(true);
    });
  });

  // ===========================================================================
  // Template Selection Tests
  // ===========================================================================
  describe('Template Selection', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should handle template selection', () => {
      // Act
      component.selectTemplate(mockKeycloakTemplate!);

      // Assert
      expect(component.selectedTemplate()).toBe(mockKeycloakTemplate);
      expect(component.form.get('providerType')?.value).toBe('KEYCLOAK');
      expect(component.form.get('protocol')?.value).toBe('OIDC');
    });

    it('should set protocol from template', () => {
      // Act
      component.selectTemplate(mockKeycloakTemplate!);

      // Assert
      expect(component.selectedProtocol()).toBe('OIDC');
    });

    it('should apply template default scopes', () => {
      // Act
      component.selectTemplate(mockKeycloakTemplate!);

      // Assert
      const scopes = component.oidcGroup?.get('scopes')?.value;
      expect(scopes).toContain('openid');
    });

    it('should clear template when clearTemplate() called', () => {
      // Arrange
      component.selectTemplate(mockKeycloakTemplate!);

      // Act
      component.clearTemplate();

      // Assert
      expect(component.selectedTemplate()).toBeNull();
    });

    it('should reset form when clearTemplate() called', () => {
      // Arrange
      component.selectTemplate(mockKeycloakTemplate!);
      component.form.patchValue({
        providerName: 'test',
        displayName: 'Test'
      });

      // Act
      component.clearTemplate();

      // Assert
      expect(component.form.get('providerName')?.value).toBeFalsy();
      expect(component.form.get('displayName')?.value).toBeFalsy();
    });
  });

  // ===========================================================================
  // OIDC Discovery Tests
  // ===========================================================================
  describe('OIDC Discovery', () => {
    beforeEach(() => {
      fixture.detectChanges();
      component.selectTemplate(mockKeycloakTemplate!);
    });

    it('should auto-discover OIDC config when discovery URL provided', () => {
      // Arrange
      component.oidcGroup?.patchValue({
        discoveryUrl: 'https://example.com/.well-known/openid-configuration'
      });

      // Act
      component.discoverConfig();

      // Assert
      expect(providerServiceMock.discoverOidcConfig).toHaveBeenCalledWith(
        'https://example.com/.well-known/openid-configuration'
      );
    });

    it('should set isDiscovering during discovery', fakeAsync(() => {
      // Arrange
      component.oidcGroup?.patchValue({
        discoveryUrl: 'https://example.com/.well-known/openid-configuration'
      });

      // Act
      component.discoverConfig();

      // Assert
      expect(component.isDiscovering()).toBe(true);

      tick();

      expect(component.isDiscovering()).toBe(false);
    }));

    it('should update scopes after successful discovery', fakeAsync(() => {
      // Arrange
      component.oidcGroup?.patchValue({
        discoveryUrl: 'https://example.com/.well-known/openid-configuration'
      });

      // Act
      component.discoverConfig();
      tick();

      // Assert
      const scopes = component.oidcGroup?.get('scopes')?.value;
      expect(scopes).toBe('openid profile email');
    }));

    it('should not discover if discoveryUrl is empty', () => {
      // Arrange
      component.oidcGroup?.patchValue({ discoveryUrl: '' });

      // Act
      component.discoverConfig();

      // Assert
      expect(providerServiceMock.discoverOidcConfig).not.toHaveBeenCalled();
    });

    it('should handle discovery error', fakeAsync(() => {
      // Arrange
      providerServiceMock.discoverOidcConfig.mockReturnValue(throwError(() => new Error('Discovery failed')));
      component.oidcGroup?.patchValue({
        discoveryUrl: 'https://invalid.example.com/.well-known/openid-configuration'
      });

      // Act
      component.discoverConfig();
      tick();

      // Assert
      expect(component.isDiscovering()).toBe(false);
    }));
  });

  // ===========================================================================
  // Form Submission Tests
  // ===========================================================================
  describe('Form Submission', () => {
    beforeEach(() => {
      fixture.detectChanges();
      component.selectTemplate(mockKeycloakTemplate!);
    });

    it('should emit saved event on successful save', fakeAsync(() => {
      // Arrange
      const savedSpy = vi.spyOn(component.saved, 'emit');
      component.form.patchValue({
        providerName: 'test-provider',
        displayName: 'Test Provider',
        protocol: 'OIDC',
        oidc: {
          discoveryUrl: 'https://example.com/.well-known/openid-configuration',
          clientId: 'client-123'
        }
      });

      // Act
      component.onSubmit();
      tick();

      // Assert
      expect(savedSpy).toHaveBeenCalled();
    }));

    it('should call createProvider when in create mode', fakeAsync(() => {
      // Arrange
      component.form.patchValue({
        providerName: 'new-provider',
        displayName: 'New Provider',
        protocol: 'OIDC',
        oidc: {
          discoveryUrl: 'https://example.com/.well-known/openid-configuration',
          clientId: 'client-123'
        }
      });

      // Act
      component.onSubmit();
      tick();

      // Assert
      expect(providerServiceMock.createProvider).toHaveBeenCalledWith(
        'tenant-123',
        expect.objectContaining({
          providerName: 'new-provider',
          displayName: 'New Provider'
        })
      );
    }));

    it('should call updateProvider when in edit mode', fakeAsync(() => {
      // Arrange
      component.provider = mockProvider;
      fixture.detectChanges();

      component.form.patchValue({
        providerName: 'updated-provider',
        displayName: 'Updated Provider'
      });

      // Act
      component.onSubmit();
      tick();

      // Assert
      expect(providerServiceMock.updateProvider).toHaveBeenCalledWith(
        'tenant-123',
        'provider-1',
        expect.objectContaining({
          providerName: 'updated-provider',
          displayName: 'Updated Provider'
        })
      );
    }));

    it('should not submit if form is invalid', () => {
      // Arrange - form is invalid by default
      expect(component.form.invalid).toBe(true);

      // Act
      component.onSubmit();

      // Assert
      expect(providerServiceMock.createProvider).not.toHaveBeenCalled();
      expect(providerServiceMock.updateProvider).not.toHaveBeenCalled();
    });

    it('should mark all fields as touched on invalid submit', () => {
      // Act
      component.onSubmit();

      // Assert
      expect(component.form.get('providerName')?.touched).toBe(true);
      expect(component.form.get('displayName')?.touched).toBe(true);
    });

    it('should set isSaving during save', fakeAsync(() => {
      // Arrange
      component.form.patchValue({
        providerName: 'test-provider',
        displayName: 'Test Provider',
        protocol: 'OIDC',
        oidc: {
          discoveryUrl: 'https://example.com/.well-known/openid-configuration',
          clientId: 'client-123'
        }
      });

      // Act
      component.onSubmit();

      // Assert
      expect(component.isSaving()).toBe(true);

      tick();

      expect(component.isSaving()).toBe(false);
    }));

    it('should handle save error', fakeAsync(() => {
      // Arrange
      providerServiceMock.createProvider.mockReturnValue(throwError(() => new Error('Save failed')));
      component.form.patchValue({
        providerName: 'test-provider',
        displayName: 'Test Provider',
        protocol: 'OIDC',
        oidc: {
          discoveryUrl: 'https://example.com/.well-known/openid-configuration',
          clientId: 'client-123'
        }
      });

      // Act
      component.onSubmit();
      tick();

      // Assert
      expect(component.isSaving()).toBe(false);
    }));
  });

  // ===========================================================================
  // Cancel Tests
  // ===========================================================================
  describe('Cancel', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should emit cancelled event on cancel', () => {
      // Arrange
      const cancelledSpy = vi.spyOn(component.cancelled, 'emit');

      // Act
      component.onCancel();

      // Assert
      expect(cancelledSpy).toHaveBeenCalled();
    });
  });

  // ===========================================================================
  // Protocol Change Tests
  // ===========================================================================
  describe('Protocol Change', () => {
    beforeEach(() => {
      fixture.detectChanges();
      component.selectTemplate(PROVIDER_TEMPLATES.find(t => t.type === 'CUSTOM')!);
    });

    it('should update selectedProtocol when protocol form control changes', () => {
      // Act
      component.form.get('protocol')?.setValue('SAML');

      // Assert
      expect(component.selectedProtocol()).toBe('SAML');
    });

    it('should update validators when protocol changes to SAML', () => {
      // Act
      component.form.get('protocol')?.setValue('SAML');
      fixture.detectChanges();

      // Assert
      expect(component.samlGroup?.get('metadataUrl')?.hasError('required')).toBe(true);
      expect(component.samlGroup?.get('entityId')?.hasError('required')).toBe(true);
    });

    it('should update validators when protocol changes to LDAP', () => {
      // Act
      component.form.get('protocol')?.setValue('LDAP');
      fixture.detectChanges();

      // Assert
      expect(component.ldapGroup?.get('serverUrl')?.hasError('required')).toBe(true);
      expect(component.ldapGroup?.get('bindDn')?.hasError('required')).toBe(true);
      expect(component.ldapGroup?.get('userSearchBase')?.hasError('required')).toBe(true);
      expect(component.ldapGroup?.get('userSearchFilter')?.hasError('required')).toBe(true);
    });

    it('should update validators when protocol changes to OAUTH2', () => {
      // Act
      component.form.get('protocol')?.setValue('OAUTH2');
      fixture.detectChanges();

      // Assert
      expect(component.oauth2Group?.get('authorizationUrl')?.hasError('required')).toBe(true);
      expect(component.oauth2Group?.get('tokenUrl')?.hasError('required')).toBe(true);
      expect(component.oauth2Group?.get('clientId')?.hasError('required')).toBe(true);
    });
  });

  // ===========================================================================
  // Field Validation Helper Tests
  // ===========================================================================
  describe('Field Validation Helpers', () => {
    beforeEach(() => {
      fixture.detectChanges();
      component.selectTemplate(mockKeycloakTemplate!);
    });

    it('should return false for isFieldInvalid when field is pristine', () => {
      // Assert
      expect(component.isFieldInvalid('providerName')).toBe(false);
    });

    it('should return true for isFieldInvalid when field is touched and invalid', () => {
      // Arrange
      component.form.get('providerName')?.markAsTouched();

      // Assert
      expect(component.isFieldInvalid('providerName')).toBe(true);
    });

    it('should return appropriate error message for required field', () => {
      // Arrange
      component.form.get('providerName')?.markAsTouched();

      // Assert
      expect(component.getFieldError('providerName')).toBe('This field is required');
    });

    it('should handle OIDC field validation', () => {
      // Arrange
      component.oidcGroup?.get('discoveryUrl')?.markAsTouched();

      // Assert
      expect(component.isOidcFieldInvalid('discoveryUrl')).toBe(true);
      expect(component.getOidcFieldError('discoveryUrl')).toBe('This field is required');
    });

    it('should handle OAuth2 field validation', () => {
      // Arrange
      component.form.get('protocol')?.setValue('OAUTH2');
      fixture.detectChanges();
      component.oauth2Group?.get('authorizationUrl')?.markAsTouched();

      // Assert
      expect(component.isOauth2FieldInvalid('authorizationUrl')).toBe(true);
    });

    it('should handle SAML field validation', () => {
      // Arrange
      component.form.get('protocol')?.setValue('SAML');
      fixture.detectChanges();
      component.samlGroup?.get('metadataUrl')?.markAsTouched();

      // Assert
      expect(component.isSamlFieldInvalid('metadataUrl')).toBe(true);
    });

    it('should handle LDAP field validation', () => {
      // Arrange
      component.form.get('protocol')?.setValue('LDAP');
      fixture.detectChanges();
      component.ldapGroup?.get('serverUrl')?.markAsTouched();

      // Assert
      expect(component.isLdapFieldInvalid('serverUrl')).toBe(true);
    });
  });

  // ===========================================================================
  // Advanced Settings Tests
  // ===========================================================================
  describe('Advanced Settings', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should toggle showAdvanced', () => {
      // Assert initial state
      expect(component.showAdvanced()).toBe(false);

      // Act
      component.showAdvanced.set(true);

      // Assert
      expect(component.showAdvanced()).toBe(true);
    });
  });

  // ===========================================================================
  // Provider Config Building Tests
  // ===========================================================================
  describe('Provider Config Building', () => {
    beforeEach(() => {
      fixture.detectChanges();
      component.selectTemplate(mockKeycloakTemplate!);
    });

    it('should build OIDC provider config correctly', fakeAsync(() => {
      // Arrange
      component.form.patchValue({
        providerName: 'oidc-provider',
        displayName: 'OIDC Provider',
        protocol: 'OIDC',
        enabled: true,
        sortOrder: 5,
        allowedDomains: 'example.com, test.org',
        oidc: {
          discoveryUrl: 'https://example.com/.well-known/openid-configuration',
          clientId: 'client-123',
          clientSecret: 'secret-456',
          scopes: 'openid profile email',
          pkceEnabled: true
        }
      });

      // Act
      component.onSubmit();
      tick();

      // Assert
      expect(providerServiceMock.createProvider).toHaveBeenCalledWith(
        'tenant-123',
        expect.objectContaining({
          providerName: 'oidc-provider',
          displayName: 'OIDC Provider',
          protocol: 'OIDC',
          enabled: true,
          sortOrder: 5,
          allowedDomains: ['example.com', 'test.org'],
          discoveryUrl: 'https://example.com/.well-known/openid-configuration',
          clientId: 'client-123',
          clientSecret: 'secret-456',
          scopes: ['openid', 'profile', 'email'],
          pkceEnabled: true
        })
      );
    }));

    it('should build SAML provider config correctly', fakeAsync(() => {
      // Arrange
      component.form.patchValue({
        providerName: 'saml-provider',
        displayName: 'SAML Provider',
        protocol: 'SAML',
        enabled: true,
        saml: {
          metadataUrl: 'https://example.com/metadata',
          entityId: 'https://my-app.example.com',
          nameIdFormat: 'urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress',
          certificate: 'cert-content',
          signRequests: true,
          wantAssertionsSigned: true
        }
      });

      // Act
      component.onSubmit();
      tick();

      // Assert
      expect(providerServiceMock.createProvider).toHaveBeenCalledWith(
        'tenant-123',
        expect.objectContaining({
          protocol: 'SAML',
          metadataUrl: 'https://example.com/metadata',
          entityId: 'https://my-app.example.com',
          signRequests: true,
          wantAssertionsSigned: true
        })
      );
    }));

    it('should build LDAP provider config correctly', fakeAsync(() => {
      // Arrange
      component.form.patchValue({
        providerName: 'ldap-provider',
        displayName: 'LDAP Provider',
        protocol: 'LDAP',
        enabled: true,
        ldap: {
          serverUrl: 'ldap://ldap.example.com',
          port: 389,
          bindDn: 'cn=admin,dc=example,dc=com',
          bindPassword: 'password',
          userSearchBase: 'ou=users,dc=example,dc=com',
          userSearchFilter: '(&(objectClass=person)(uid={0}))',
          useSsl: false,
          useTls: true
        }
      });

      // Act
      component.onSubmit();
      tick();

      // Assert
      expect(providerServiceMock.createProvider).toHaveBeenCalledWith(
        'tenant-123',
        expect.objectContaining({
          protocol: 'LDAP',
          serverUrl: 'ldap://ldap.example.com',
          port: 389,
          bindDn: 'cn=admin,dc=example,dc=com',
          userSearchBase: 'ou=users,dc=example,dc=com',
          userSearchFilter: '(&(objectClass=person)(uid={0}))',
          useSsl: false,
          useTls: true
        })
      );
    }));
  });

  // ===========================================================================
  // ngOnChanges Tests
  // ===========================================================================
  describe('ngOnChanges', () => {
    it('should repopulate form when provider input changes', () => {
      // Arrange
      fixture.detectChanges();
      const newProvider: ProviderConfig = {
        ...mockProvider,
        displayName: 'New Display Name'
      };

      // Act
      component.ngOnChanges({
        provider: {
          previousValue: mockProvider,
          currentValue: newProvider,
          firstChange: false,
          isFirstChange: () => false
        }
      });
      component.provider = newProvider;
      component.ngOnChanges({
        provider: {
          previousValue: mockProvider,
          currentValue: newProvider,
          firstChange: false,
          isFirstChange: () => false
        }
      });

      // Assert
      expect(component.form.get('displayName')?.value).toBe('New Display Name');
    });

    it('should reset form when provider becomes undefined', () => {
      // Arrange
      component.provider = mockProvider;
      fixture.detectChanges();

      // Act
      component.provider = undefined;
      component.ngOnChanges({
        provider: {
          previousValue: mockProvider,
          currentValue: undefined,
          firstChange: false,
          isFirstChange: () => false
        }
      });

      // Assert
      expect(component.form.get('providerName')?.value).toBeFalsy();
    });
  });
});
