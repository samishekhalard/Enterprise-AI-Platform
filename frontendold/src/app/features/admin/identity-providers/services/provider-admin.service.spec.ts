import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { HttpClient } from '@angular/common/http';
import { of, throwError } from 'rxjs';
import { ProviderAdminService } from './provider-admin.service';
import { ProviderConfig } from '../models/provider-config.model';
import { environment } from '../../../../../environments/environment';

describe('ProviderAdminService', () => {
  let service: ProviderAdminService;
  let httpMock: {
    get: ReturnType<typeof vi.fn>;
    post: ReturnType<typeof vi.fn>;
    put: ReturnType<typeof vi.fn>;
    patch: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
  };
  const apiUrl = `${environment.apiUrl}/api/v1/admin/tenants`;
  const tenantId = 'tenant-123';

  // ===========================================================================
  // Test Data
  // ===========================================================================
  const mockBackendProvider = {
    id: 'provider-1',
    providerName: 'keycloak-sso',
    providerType: 'KEYCLOAK',
    protocol: 'OIDC',
    displayName: 'Keycloak SSO',
    enabled: true,
    clientId: 'client-id-123',
    clientSecret: 'secret',
    discoveryUrl: 'https://keycloak.example.com/.well-known/openid-configuration',
    scopes: ['openid', 'profile', 'email'],
    pkceEnabled: true,
    priority: 1,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-02T00:00:00Z'
  };

  const mockProviderConfig: ProviderConfig = {
    providerName: 'new-provider',
    providerType: 'OKTA',
    protocol: 'OIDC',
    displayName: 'New Okta Provider',
    enabled: false,
    clientId: 'okta-client-id',
    clientSecret: 'okta-secret',
    discoveryUrl: 'https://okta.example.com/.well-known/openid-configuration',
    scopes: ['openid', 'profile', 'email'],
    pkceEnabled: true,
    sortOrder: 2
  };

  // ===========================================================================
  // Setup and Teardown
  // ===========================================================================
  beforeEach(() => {
    httpMock = {
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      patch: vi.fn(),
      delete: vi.fn()
    };

    TestBed.configureTestingModule({
      providers: [
        ProviderAdminService,
        { provide: HttpClient, useValue: httpMock }
      ]
    });

    service = TestBed.inject(ProviderAdminService);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // ===========================================================================
  // Creation Tests
  // ===========================================================================
  describe('Creation', () => {
    it('should be created', () => {
      expect(service).toBeTruthy();
    });

    it('should start with empty providers list', () => {
      expect(service.providers()).toEqual([]);
    });

    it('should start with no selected provider', () => {
      expect(service.selectedProvider()).toBeNull();
    });

    it('should start with isLoading false', () => {
      expect(service.isLoading()).toBe(false);
    });

    it('should start with no error', () => {
      expect(service.error()).toBeNull();
    });

    it('should have computed hasProviders as false initially', () => {
      expect(service.hasProviders()).toBe(false);
    });

    it('should have computed providerCount as 0 initially', () => {
      expect(service.providerCount()).toBe(0);
    });
  });

  // ===========================================================================
  // getProviders Tests
  // ===========================================================================
  describe('getProviders', () => {
    it('should get providers and map backend response', () => {
      // Arrange
      httpMock.get.mockReturnValue(of([mockBackendProvider]));

      // Act & Assert
      service.getProviders(tenantId).subscribe(providers => {
        expect(providers.length).toBe(1);
        expect(providers[0].id).toBe('provider-1');
        expect(providers[0].displayName).toBe('Keycloak SSO');
        expect(providers[0].providerType).toBe('KEYCLOAK');
        expect(providers[0].sortOrder).toBe(1);
      });

      expect(httpMock.get).toHaveBeenCalledWith(`${apiUrl}/${tenantId}/providers`);
    });

    it('should handle array response format', () => {
      // Arrange
      httpMock.get.mockReturnValue(of([mockBackendProvider, { ...mockBackendProvider, id: 'provider-2' }]));

      // Act & Assert
      service.getProviders(tenantId).subscribe(providers => {
        expect(providers.length).toBe(2);
      });
    });

    it('should handle wrapped response format', () => {
      // Arrange
      httpMock.get.mockReturnValue(of({ providers: [mockBackendProvider], total: 1, page: 1, pageSize: 10 }));

      // Act & Assert
      service.getProviders(tenantId).subscribe(providers => {
        expect(providers.length).toBe(1);
        expect(providers[0].id).toBe('provider-1');
      });
    });

    it('should update providers signal after fetching', () => {
      // Arrange
      httpMock.get.mockReturnValue(of([mockBackendProvider]));

      // Act
      service.getProviders(tenantId).subscribe();

      // Assert
      expect(service.providers().length).toBe(1);
      expect(service.hasProviders()).toBe(true);
      expect(service.providerCount()).toBe(1);
    });

    it('should handle errors appropriately', () => {
      // Arrange
      httpMock.get.mockReturnValue(throwError(() => ({ status: 500, message: 'Server error' })));

      // Act & Assert
      service.getProviders(tenantId).subscribe({
        error: err => {
          expect(err.message).toContain('Failed to load providers');
        }
      });

      expect(service.error()).toBeTruthy();
      expect(service.isLoading()).toBe(false);
    });

    it('should set connection error message when status is 0', () => {
      // Arrange
      httpMock.get.mockReturnValue(throwError(() => ({ status: 0 })));

      // Act
      service.getProviders(tenantId).subscribe({
        error: () => {}
      });

      // Assert
      expect(service.error()).toContain('Unable to connect to server');
    });

    it('should set permission error message when status is 403', () => {
      // Arrange
      httpMock.get.mockReturnValue(throwError(() => ({ status: 403 })));

      // Act
      service.getProviders(tenantId).subscribe({
        error: () => {}
      });

      // Assert
      expect(service.error()).toContain('permission');
    });

    it('should compute enabledProviders correctly', () => {
      // Arrange
      httpMock.get.mockReturnValue(of([
        { ...mockBackendProvider, enabled: true },
        { ...mockBackendProvider, id: 'provider-2', enabled: false }
      ]));

      // Act
      service.getProviders(tenantId).subscribe();

      // Assert
      expect(service.enabledProviders().length).toBe(1);
      expect(service.disabledProviders().length).toBe(1);
    });
  });

  // ===========================================================================
  // createProvider Tests
  // ===========================================================================
  describe('createProvider', () => {
    it('should create provider with mapped request', () => {
      // Arrange
      httpMock.post.mockReturnValue(of({ ...mockBackendProvider, id: 'new-provider-id', displayName: 'New Okta Provider' }));

      // Act & Assert
      service.createProvider(tenantId, mockProviderConfig).subscribe(provider => {
        expect(provider.id).toBe('new-provider-id');
        expect(provider.displayName).toBe('New Okta Provider');
      });

      expect(httpMock.post).toHaveBeenCalled();
      const callArgs = httpMock.post.mock.calls[0];
      expect(callArgs[0]).toBe(`${apiUrl}/${tenantId}/providers`);
      expect(callArgs[1].providerName).toBe('new-provider');
      expect(callArgs[1].displayName).toBe('New Okta Provider');
      expect(callArgs[1].clientId).toBe('okta-client-id');
      expect(callArgs[1].priority).toBe(2);
    });

    it('should add created provider to providers list', () => {
      // Arrange
      httpMock.post.mockReturnValue(of({ ...mockBackendProvider, id: 'new-provider-id' }));

      // Act
      service.createProvider(tenantId, mockProviderConfig).subscribe();

      // Assert
      expect(service.providers().length).toBe(1);
      expect(service.providers()[0].id).toBe('new-provider-id');
    });

    it('should handle creation errors', () => {
      // Arrange
      httpMock.post.mockReturnValue(throwError(() => ({ status: 400, message: 'Validation error' })));

      // Act & Assert
      service.createProvider(tenantId, mockProviderConfig).subscribe({
        error: err => {
          expect(err.message).toContain('Failed to create provider');
        }
      });

      expect(service.error()).toBeTruthy();
      expect(service.isSaving()).toBe(false);
    });
  });

  // ===========================================================================
  // updateProvider Tests
  // ===========================================================================
  describe('updateProvider', () => {
    it('should update provider', () => {
      // Arrange - first add a provider
      httpMock.get.mockReturnValue(of([mockBackendProvider]));
      service.getProviders(tenantId).subscribe();

      httpMock.put.mockReturnValue(of({ ...mockBackendProvider, displayName: 'Updated Display Name' }));

      // Act
      const updatedConfig: ProviderConfig = {
        ...mockProviderConfig,
        displayName: 'Updated Display Name'
      };
      service.updateProvider(tenantId, 'provider-1', updatedConfig).subscribe(provider => {
        // Assert
        expect(provider.displayName).toBe('Updated Display Name');
      });

      expect(httpMock.put).toHaveBeenCalledWith(
        `${apiUrl}/${tenantId}/providers/provider-1`,
        expect.any(Object)
      );
    });

    it('should update provider in providers list', () => {
      // Arrange
      httpMock.get.mockReturnValue(of([mockBackendProvider]));
      service.getProviders(tenantId).subscribe();

      httpMock.put.mockReturnValue(of({ ...mockBackendProvider, displayName: 'New Name' }));

      // Act
      service.updateProvider(tenantId, 'provider-1', { ...mockProviderConfig, displayName: 'New Name' }).subscribe();

      // Assert
      expect(service.providers()[0].displayName).toBe('New Name');
    });

    it('should update selectedProvider if it matches', () => {
      // Arrange
      httpMock.get.mockReturnValue(of([mockBackendProvider]));
      service.getProviders(tenantId).subscribe();
      service.selectProvider(service.providers()[0]);

      httpMock.put.mockReturnValue(of({ ...mockBackendProvider, displayName: 'New Name' }));

      // Act
      service.updateProvider(tenantId, 'provider-1', { ...mockProviderConfig, displayName: 'New Name' }).subscribe();

      // Assert
      expect(service.selectedProvider()?.displayName).toBe('New Name');
    });
  });

  // ===========================================================================
  // deleteProvider Tests
  // ===========================================================================
  describe('deleteProvider', () => {
    it('should delete provider and update state', () => {
      // Arrange
      httpMock.get.mockReturnValue(of([mockBackendProvider, { ...mockBackendProvider, id: 'provider-2' }]));
      service.getProviders(tenantId).subscribe();
      expect(service.providers().length).toBe(2);

      httpMock.delete.mockReturnValue(of(null));

      // Act
      service.deleteProvider(tenantId, 'provider-1').subscribe();

      // Assert
      expect(httpMock.delete).toHaveBeenCalledWith(`${apiUrl}/${tenantId}/providers/provider-1`);
      expect(service.providers().length).toBe(1);
      expect(service.providers()[0].id).toBe('provider-2');
    });

    it('should clear selectedProvider if deleted provider was selected', () => {
      // Arrange
      httpMock.get.mockReturnValue(of([mockBackendProvider]));
      service.getProviders(tenantId).subscribe();
      service.selectProvider(service.providers()[0]);
      expect(service.selectedProvider()).not.toBeNull();

      httpMock.delete.mockReturnValue(of(null));

      // Act
      service.deleteProvider(tenantId, 'provider-1').subscribe();

      // Assert
      expect(service.selectedProvider()).toBeNull();
    });

    it('should handle delete errors', () => {
      // Arrange
      httpMock.delete.mockReturnValue(throwError(() => ({ status: 404 })));

      // Act & Assert
      service.deleteProvider(tenantId, 'provider-1').subscribe({
        error: err => {
          expect(err.message).toContain('Failed to delete provider');
        }
      });

      expect(service.error()).toBeTruthy();
    });
  });

  // ===========================================================================
  // toggleProviderEnabled Tests
  // ===========================================================================
  describe('toggleProviderEnabled', () => {
    it('should toggle provider enabled status', () => {
      // Arrange
      httpMock.get.mockReturnValue(of([mockBackendProvider]));
      service.getProviders(tenantId).subscribe();

      httpMock.patch.mockReturnValue(of({ ...mockBackendProvider, enabled: false }));

      // Act
      service.toggleProviderEnabled(tenantId, 'provider-1', false).subscribe(provider => {
        // Assert
        expect(provider.enabled).toBe(false);
      });

      expect(httpMock.patch).toHaveBeenCalledWith(
        `${apiUrl}/${tenantId}/providers/provider-1`,
        { enabled: false }
      );
    });

    it('should update provider in list after toggle', () => {
      // Arrange
      httpMock.get.mockReturnValue(of([mockBackendProvider]));
      service.getProviders(tenantId).subscribe();
      expect(service.providers()[0].enabled).toBe(true);

      httpMock.patch.mockReturnValue(of({ ...mockBackendProvider, enabled: false }));

      // Act
      service.toggleProviderEnabled(tenantId, 'provider-1', false).subscribe();

      // Assert
      expect(service.providers()[0].enabled).toBe(false);
    });
  });

  // ===========================================================================
  // testConnection Tests
  // ===========================================================================
  describe('testConnection', () => {
    it('should test connection', () => {
      // Arrange
      httpMock.get.mockReturnValue(of([mockBackendProvider]));
      service.getProviders(tenantId).subscribe();

      httpMock.post.mockReturnValue(of({ success: true, message: 'Connection successful' }));

      // Act
      service.testConnection(tenantId, 'provider-1').subscribe(result => {
        // Assert
        expect(result.success).toBe(true);
        expect(result.message).toBe('Connection successful');
      });

      expect(httpMock.post).toHaveBeenCalledWith(
        `${apiUrl}/${tenantId}/providers/provider-1/test`,
        {}
      );
    });

    it('should update provider with test result', () => {
      // Arrange
      httpMock.get.mockReturnValue(of([mockBackendProvider]));
      service.getProviders(tenantId).subscribe();

      httpMock.post.mockReturnValue(of({ success: true, message: 'Connection successful' }));

      // Act
      service.testConnection(tenantId, 'provider-1').subscribe();

      // Assert
      const provider = service.providers()[0];
      expect(provider.lastTestedAt).toBeTruthy();
      expect(provider.testResult).toBe('success');
    });

    it('should set testResult to failure on error response', () => {
      // Arrange
      httpMock.get.mockReturnValue(of([mockBackendProvider]));
      service.getProviders(tenantId).subscribe();

      httpMock.post.mockReturnValue(of({ success: false, message: 'Connection failed' }));

      // Act
      service.testConnection(tenantId, 'provider-1').subscribe();

      // Assert
      expect(service.providers()[0].testResult).toBe('failure');
    });

    it('should handle connection test errors gracefully', () => {
      // Arrange
      httpMock.post.mockReturnValue(throwError(() => new Error('Network error')));

      // Act & Assert
      service.testConnection(tenantId, 'provider-1').subscribe(result => {
        expect(result.success).toBe(false);
        expect(result.message).toBe('Connection test failed');
      });
    });
  });

  // ===========================================================================
  // discoverOidcConfig Tests
  // ===========================================================================
  describe('discoverOidcConfig', () => {
    it('should discover OIDC configuration', () => {
      const discoveryUrl = 'https://idp.example.com/.well-known/openid-configuration';

      // Arrange
      httpMock.get.mockReturnValue(of({
        issuer: 'https://idp.example.com',
        authorization_endpoint: 'https://idp.example.com/authorize',
        token_endpoint: 'https://idp.example.com/token',
        userinfo_endpoint: 'https://idp.example.com/userinfo',
        jwks_uri: 'https://idp.example.com/jwks',
        scopes_supported: ['openid', 'profile', 'email', 'address']
      }));

      // Act
      service.discoverOidcConfig(discoveryUrl).subscribe(config => {
        // Assert
        expect(config.discoveryUrl).toBe(discoveryUrl);
        expect(config.authorizationUrl).toBe('https://idp.example.com/authorize');
        expect(config.tokenUrl).toBe('https://idp.example.com/token');
        expect(config.userInfoUrl).toBe('https://idp.example.com/userinfo');
        expect(config.jwksUrl).toBe('https://idp.example.com/jwks');
        expect(config.scopes).toContain('openid');
      });

      expect(httpMock.get).toHaveBeenCalledWith(discoveryUrl);
    });

    it('should filter scopes to common ones', () => {
      const discoveryUrl = 'https://idp.example.com/.well-known/openid-configuration';

      // Arrange
      httpMock.get.mockReturnValue(of({
        issuer: 'https://idp.example.com',
        authorization_endpoint: 'https://idp.example.com/authorize',
        token_endpoint: 'https://idp.example.com/token',
        userinfo_endpoint: 'https://idp.example.com/userinfo',
        jwks_uri: 'https://idp.example.com/jwks',
        scopes_supported: ['openid', 'profile', 'email', 'custom_scope']
      }));

      // Act
      service.discoverOidcConfig(discoveryUrl).subscribe(config => {
        // Assert - should only include common scopes
        expect(config.scopes).toEqual(['openid', 'profile', 'email']);
      });
    });

    it('should return default scopes on discovery error', () => {
      const discoveryUrl = 'https://invalid.example.com/.well-known/openid-configuration';

      // Arrange
      httpMock.get.mockReturnValue(throwError(() => new Error('Network error')));

      // Act
      service.discoverOidcConfig(discoveryUrl).subscribe(config => {
        // Assert
        expect(config.discoveryUrl).toBe(discoveryUrl);
        expect(config.scopes).toEqual(['openid', 'profile', 'email']);
      });
    });
  });

  // ===========================================================================
  // State Management Tests
  // ===========================================================================
  describe('State Management', () => {
    it('should select provider', () => {
      // Arrange
      const provider: ProviderConfig = { ...mockProviderConfig, id: 'test-id' };

      // Act
      service.selectProvider(provider);

      // Assert
      expect(service.selectedProvider()).toBe(provider);
    });

    it('should clear selection', () => {
      // Arrange
      service.selectProvider({ ...mockProviderConfig, id: 'test-id' });

      // Act
      service.clearSelection();

      // Assert
      expect(service.selectedProvider()).toBeNull();
    });

    it('should clear error', () => {
      // Arrange - trigger an error
      httpMock.get.mockReturnValue(throwError(() => ({ status: 500 })));
      service.getProviders(tenantId).subscribe({ error: () => {} });
      expect(service.error()).toBeTruthy();

      // Act
      service.clearError();

      // Assert
      expect(service.error()).toBeNull();
    });

    it('should reset all state', () => {
      // Arrange - set up some state
      httpMock.get.mockReturnValue(of([mockBackendProvider]));
      service.getProviders(tenantId).subscribe();
      service.selectProvider(service.providers()[0]);

      // Act
      service.reset();

      // Assert
      expect(service.providers()).toEqual([]);
      expect(service.selectedProvider()).toBeNull();
      expect(service.isLoading()).toBe(false);
      expect(service.error()).toBeNull();
      expect(service.isSaving()).toBe(false);
      expect(service.isTestingConnection()).toBe(false);
    });
  });

  // ===========================================================================
  // getProvider Tests
  // ===========================================================================
  describe('getProvider', () => {
    it('should get a single provider by ID', () => {
      // Arrange
      httpMock.get.mockReturnValue(of(mockBackendProvider));

      // Act
      service.getProvider(tenantId, 'provider-1').subscribe(provider => {
        // Assert
        expect(provider.id).toBe('provider-1');
        expect(provider.displayName).toBe('Keycloak SSO');
      });

      expect(httpMock.get).toHaveBeenCalledWith(`${apiUrl}/${tenantId}/providers/provider-1`);
    });

    it('should update selectedProvider after getting', () => {
      // Arrange
      httpMock.get.mockReturnValue(of(mockBackendProvider));

      // Act
      service.getProvider(tenantId, 'provider-1').subscribe();

      // Assert
      expect(service.selectedProvider()?.id).toBe('provider-1');
    });
  });

  // ===========================================================================
  // validateConfig Tests
  // ===========================================================================
  describe('validateConfig', () => {
    it('should validate provider configuration', () => {
      // Arrange
      httpMock.post.mockReturnValue(of({ success: true, message: 'Configuration is valid' }));

      // Act
      service.validateConfig(tenantId, mockProviderConfig).subscribe(result => {
        // Assert
        expect(result.success).toBe(true);
      });

      expect(httpMock.post).toHaveBeenCalledWith(
        `${apiUrl}/${tenantId}/providers/validate`,
        expect.any(Object)
      );
    });

    it('should return failure on validation error', () => {
      // Arrange
      httpMock.post.mockReturnValue(throwError(() => new Error('Validation error')));

      // Act
      service.validateConfig(tenantId, mockProviderConfig).subscribe(result => {
        // Assert
        expect(result.success).toBe(false);
        expect(result.message).toBe('Validation failed');
      });
    });
  });

  // ===========================================================================
  // getProviderTemplates Tests
  // ===========================================================================
  describe('getProviderTemplates', () => {
    it('should return provider templates', () => {
      // Act
      service.getProviderTemplates().subscribe(templates => {
        // Assert
        expect(templates.length).toBeGreaterThan(0);
        expect(templates.some(t => t.type === 'KEYCLOAK')).toBe(true);
        expect(templates.some(t => t.type === 'AUTH0')).toBe(true);
        expect(templates.some(t => t.type === 'OKTA')).toBe(true);
      });
    });
  });
});
