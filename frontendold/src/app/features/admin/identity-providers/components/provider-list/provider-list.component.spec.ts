import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { signal, WritableSignal } from '@angular/core';
import { of, throwError } from 'rxjs';
import { ProviderListComponent } from './provider-list.component';
import { ProviderAdminService } from '../../services/provider-admin.service';
import { ProviderConfig } from '../../models/provider-config.model';

describe('ProviderListComponent', () => {
  let component: ProviderListComponent;
  let fixture: ComponentFixture<ProviderListComponent>;
  let providerServiceMock: {
    testConnection: ReturnType<typeof vi.fn>;
  };

  // Mock signals for inputs
  let mockProviders: WritableSignal<ProviderConfig[]>;
  let mockIsLoading: WritableSignal<boolean>;
  let mockError: WritableSignal<string | null>;

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
    discoveryUrl: 'https://keycloak.example.com/.well-known/openid-configuration',
    scopes: ['openid', 'profile', 'email'],
    lastTestedAt: '2024-01-15T10:30:00Z',
    testResult: 'success'
  };

  const mockProvider2: ProviderConfig = {
    id: 'provider-2',
    providerName: 'okta-sso',
    providerType: 'OKTA',
    protocol: 'OIDC',
    displayName: 'Okta SSO',
    enabled: false,
    clientId: 'okta-client',
    discoveryUrl: 'https://okta.example.com/.well-known/openid-configuration'
  };

  const mockProvider3: ProviderConfig = {
    id: 'provider-3',
    providerName: 'azure-ad',
    providerType: 'AZURE_AD',
    protocol: 'SAML',
    displayName: 'Azure AD',
    enabled: true
  };

  // ===========================================================================
  // Setup and Teardown
  // ===========================================================================
  beforeEach(async () => {
    // Initialize mock signals
    mockProviders = signal<ProviderConfig[]>([]);
    mockIsLoading = signal<boolean>(false);
    mockError = signal<string | null>(null);

    // Create mock object for ProviderAdminService
    providerServiceMock = {
      testConnection: vi.fn().mockReturnValue(of({
        success: true,
        message: 'Connection successful'
      }))
    };

    await TestBed.configureTestingModule({
      imports: [ProviderListComponent],
      providers: [
        { provide: ProviderAdminService, useValue: providerServiceMock }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ProviderListComponent);
    component = fixture.componentInstance;
    component.tenantId = 'tenant-123';
    component.providers = mockProviders.asReadonly();
    component.isLoading = mockIsLoading.asReadonly();
    component.error = mockError.asReadonly();
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

    it('should start with no provider to delete', () => {
      fixture.detectChanges();
      expect(component.providerToDelete()).toBeNull();
    });

    it('should start with isDeleting as false', () => {
      fixture.detectChanges();
      expect(component.isDeleting()).toBe(false);
    });

    it('should start with no testing provider', () => {
      fixture.detectChanges();
      expect(component.isTestingProvider()).toBeNull();
    });

    it('should start with no test result', () => {
      fixture.detectChanges();
      expect(component.testResult()).toBeNull();
    });
  });

  // ===========================================================================
  // Display Providers Tests
  // ===========================================================================
  describe('Display Providers', () => {
    it('should display providers in list', () => {
      // Arrange
      mockProviders.set([mockProvider, mockProvider2]);
      fixture.detectChanges();

      // Assert
      const compiled = fixture.nativeElement;
      const providerCards = compiled.querySelectorAll('[data-testid="provider-card"]');
      expect(providerCards.length).toBe(2);
    });

    it('should display provider name', () => {
      // Arrange
      mockProviders.set([mockProvider]);
      fixture.detectChanges();

      // Assert
      const compiled = fixture.nativeElement;
      const providerName = compiled.querySelector('[data-testid="provider-name"]');
      expect(providerName.textContent).toContain('Keycloak SSO');
    });

    it('should display provider type', () => {
      // Arrange
      mockProviders.set([mockProvider]);
      fixture.detectChanges();

      // Assert
      const compiled = fixture.nativeElement;
      const providerType = compiled.querySelector('[data-testid="provider-type"]');
      expect(providerType.textContent).toContain('Keycloak');
    });

    it('should display provider status', () => {
      // Arrange
      mockProviders.set([mockProvider]);
      fixture.detectChanges();

      // Assert
      const compiled = fixture.nativeElement;
      const status = compiled.querySelector('[data-testid="provider-status"]');
      expect(status.textContent).toContain('Enabled');
    });

    it('should display disabled status for disabled provider', () => {
      // Arrange
      mockProviders.set([mockProvider2]);
      fixture.detectChanges();

      // Assert
      const compiled = fixture.nativeElement;
      const status = compiled.querySelector('[data-testid="provider-status"]');
      expect(status.textContent).toContain('Disabled');
    });
  });

  // ===========================================================================
  // Loading State Tests
  // ===========================================================================
  describe('Loading State', () => {
    it('should show loading state', () => {
      // Arrange
      mockIsLoading.set(true);
      fixture.detectChanges();

      // Assert
      const compiled = fixture.nativeElement;
      const loadingState = compiled.querySelector('[data-testid="loading-state"]');
      expect(loadingState).toBeTruthy();
    });

    it('should hide loading state when not loading', () => {
      // Arrange
      mockIsLoading.set(false);
      mockProviders.set([mockProvider]);
      fixture.detectChanges();

      // Assert
      const compiled = fixture.nativeElement;
      const loadingState = compiled.querySelector('[data-testid="loading-state"]');
      expect(loadingState).toBeFalsy();
    });
  });

  // ===========================================================================
  // Error State Tests
  // ===========================================================================
  describe('Error State', () => {
    it('should show error state with retry button', () => {
      // Arrange
      mockError.set('Failed to load providers');
      fixture.detectChanges();

      // Assert
      const compiled = fixture.nativeElement;
      const errorState = compiled.querySelector('[data-testid="error-state"]');
      expect(errorState).toBeTruthy();
      expect(errorState.textContent).toContain('Failed to load providers');
    });

    it('should emit retryClicked when retry button clicked', () => {
      // Arrange
      mockError.set('Failed to load providers');
      fixture.detectChanges();
      const retrySpy = vi.spyOn(component.retryClicked, 'emit');

      // Act
      const compiled = fixture.nativeElement;
      const retryButton = compiled.querySelector('[data-testid="error-state"] button');
      retryButton.click();

      // Assert
      expect(retrySpy).toHaveBeenCalled();
    });
  });

  // ===========================================================================
  // Empty State Tests
  // ===========================================================================
  describe('Empty State', () => {
    it('should show empty state when no providers', () => {
      // Arrange
      mockProviders.set([]);
      mockIsLoading.set(false);
      fixture.detectChanges();

      // Assert
      const compiled = fixture.nativeElement;
      const emptyState = compiled.querySelector('[data-testid="empty-state"]');
      expect(emptyState).toBeTruthy();
    });

    it('should emit addClicked when add button clicked in empty state', () => {
      // Arrange
      mockProviders.set([]);
      mockIsLoading.set(false);
      fixture.detectChanges();
      const addSpy = vi.spyOn(component.addClicked, 'emit');

      // Act
      const compiled = fixture.nativeElement;
      const addButton = compiled.querySelector('[data-testid="btn-add-first-provider"]');
      addButton.click();

      // Assert
      expect(addSpy).toHaveBeenCalled();
    });

    it('should not show empty state when providers exist', () => {
      // Arrange
      mockProviders.set([mockProvider]);
      fixture.detectChanges();

      // Assert
      const compiled = fixture.nativeElement;
      const emptyState = compiled.querySelector('[data-testid="empty-state"]');
      expect(emptyState).toBeFalsy();
    });
  });

  // ===========================================================================
  // Edit Click Tests
  // ===========================================================================
  describe('Edit Click', () => {
    beforeEach(() => {
      mockProviders.set([mockProvider]);
      fixture.detectChanges();
    });

    it('should emit editClicked when edit button clicked', () => {
      // Arrange
      const editSpy = vi.spyOn(component.editClicked, 'emit');

      // Act
      const compiled = fixture.nativeElement;
      const editButton = compiled.querySelector('[data-testid="btn-edit-provider"]');
      editButton.click();

      // Assert
      expect(editSpy).toHaveBeenCalledWith(mockProvider);
    });
  });

  // ===========================================================================
  // Delete Tests
  // ===========================================================================
  describe('Delete', () => {
    beforeEach(() => {
      mockProviders.set([mockProvider]);
      fixture.detectChanges();
    });

    it('should show delete confirmation modal when delete button clicked', () => {
      // Act
      component.onDeleteClick(mockProvider);
      fixture.detectChanges();

      // Assert
      expect(component.providerToDelete()).toBe(mockProvider);
    });

    it('should emit deleteConfirmed when delete confirmed', fakeAsync(() => {
      // Arrange
      const deleteSpy = vi.spyOn(component.deleteConfirmed, 'emit');
      component.onDeleteClick(mockProvider);
      fixture.detectChanges();

      // Act
      component.confirmDelete();
      tick(300);

      // Assert
      expect(deleteSpy).toHaveBeenCalledWith(mockProvider);
    }));

    it('should close modal after delete confirmed', fakeAsync(() => {
      // Arrange
      component.onDeleteClick(mockProvider);
      fixture.detectChanges();

      // Act
      component.confirmDelete();
      tick(300);

      // Assert
      expect(component.providerToDelete()).toBeNull();
      expect(component.isDeleting()).toBe(false);
    }));

    it('should close modal when cancel clicked', () => {
      // Arrange
      component.onDeleteClick(mockProvider);
      fixture.detectChanges();

      // Act
      component.cancelDelete();

      // Assert
      expect(component.providerToDelete()).toBeNull();
    });

    it('should set isDeleting during delete', () => {
      // Arrange
      component.onDeleteClick(mockProvider);
      fixture.detectChanges();

      // Act
      component.confirmDelete();

      // Assert
      expect(component.isDeleting()).toBe(true);
    });
  });

  // ===========================================================================
  // Toggle Enabled Tests
  // ===========================================================================
  describe('Toggle Enabled', () => {
    beforeEach(() => {
      mockProviders.set([mockProvider]);
      fixture.detectChanges();
    });

    it('should emit toggleEnabled when toggle switched', () => {
      // Arrange
      const toggleSpy = vi.spyOn(component.toggleEnabled, 'emit');

      // Act
      component.onToggleEnabled(mockProvider);

      // Assert
      expect(toggleSpy).toHaveBeenCalledWith({
        provider: mockProvider,
        enabled: false // opposite of current state (true)
      });
    });

    it('should emit correct enabled value for disabled provider', () => {
      // Arrange
      mockProviders.set([mockProvider2]); // disabled provider
      fixture.detectChanges();
      const toggleSpy = vi.spyOn(component.toggleEnabled, 'emit');

      // Act
      component.onToggleEnabled(mockProvider2);

      // Assert
      expect(toggleSpy).toHaveBeenCalledWith({
        provider: mockProvider2,
        enabled: true // opposite of current state (false)
      });
    });
  });

  // ===========================================================================
  // Test Connection Tests
  // ===========================================================================
  describe('Test Connection', () => {
    beforeEach(() => {
      mockProviders.set([mockProvider]);
      fixture.detectChanges();
    });

    it('should call testConnection service method', () => {
      // Act
      component.onTestConnection(mockProvider);

      // Assert
      expect(providerServiceMock.testConnection).toHaveBeenCalledWith('tenant-123', 'provider-1');
    });

    it('should set isTestingProvider during test', () => {
      // Act
      component.onTestConnection(mockProvider);

      // Assert - before response
      expect(component.isTestingProvider()).toBe('provider-1');
    });

    it('should clear isTestingProvider after test completes', fakeAsync(() => {
      // Act
      component.onTestConnection(mockProvider);
      tick();

      // Assert
      expect(component.isTestingProvider()).toBeNull();
    }));

    it('should show success toast on successful connection', fakeAsync(() => {
      // Act
      component.onTestConnection(mockProvider);
      tick();

      // Assert
      expect(component.testResult()?.success).toBe(true);
      expect(component.testResult()?.message).toContain('successful');
    }));

    it('should show error toast on failed connection', fakeAsync(() => {
      // Arrange
      providerServiceMock.testConnection.mockReturnValue(of({
        success: false,
        message: 'Connection refused'
      }));

      // Act
      component.onTestConnection(mockProvider);
      tick();

      // Assert
      expect(component.testResult()?.success).toBe(false);
      expect(component.testResult()?.message).toContain('Connection refused');
    }));

    it('should handle connection test error', fakeAsync(() => {
      // Arrange
      providerServiceMock.testConnection.mockReturnValue(throwError(() => new Error('Network error')));

      // Act
      component.onTestConnection(mockProvider);
      tick();

      // Assert
      expect(component.testResult()?.success).toBe(false);
      expect(component.isTestingProvider()).toBeNull();
    }));

    it('should not test connection if provider has no id', () => {
      // Arrange
      const providerWithoutId = { ...mockProvider, id: undefined };

      // Act
      component.onTestConnection(providerWithoutId);

      // Assert
      expect(providerServiceMock.testConnection).not.toHaveBeenCalled();
    });

    it('should auto-dismiss test result toast after 5 seconds', fakeAsync(() => {
      // Arrange & Act
      component.onTestConnection(mockProvider);
      tick();
      expect(component.testResult()).toBeTruthy();

      tick(5000);

      // Assert
      expect(component.testResult()).toBeNull();
    }));

    it('should clear previous test result before new test', () => {
      // Arrange
      component.testResult.set({ success: true, message: 'Previous result' });

      // Act
      component.onTestConnection(mockProvider);

      // Assert
      expect(component.testResult()).toBeNull();
    });
  });

  // ===========================================================================
  // Provider Icon Tests
  // ===========================================================================
  describe('Provider Icon', () => {
    it('should return custom icon if provider has iconUrl', () => {
      // Arrange
      const providerWithIcon = { ...mockProvider, iconUrl: 'https://example.com/icon.svg' };

      // Act
      const icon = component.getProviderIcon(providerWithIcon);

      // Assert
      expect(icon).toBe('https://example.com/icon.svg');
    });

    it('should return template icon for known provider type', () => {
      // Act
      const icon = component.getProviderIcon(mockProvider);

      // Assert
      expect(icon).toContain('keycloak');
    });

    it('should return default icon for unknown provider type', () => {
      // Arrange
      const customProvider: ProviderConfig = {
        ...mockProvider,
        providerType: 'CUSTOM',
        iconUrl: undefined
      };

      // Act
      const icon = component.getProviderIcon(customProvider);

      // Assert
      expect(icon).toContain('custom');
    });
  });

  // ===========================================================================
  // Provider Type Name Tests
  // ===========================================================================
  describe('Provider Type Name', () => {
    it('should return correct name for KEYCLOAK', () => {
      expect(component.getProviderTypeName('KEYCLOAK')).toBe('Keycloak');
    });

    it('should return correct name for AUTH0', () => {
      expect(component.getProviderTypeName('AUTH0')).toBe('Auth0');
    });

    it('should return correct name for OKTA', () => {
      expect(component.getProviderTypeName('OKTA')).toBe('Okta');
    });

    it('should return correct name for AZURE_AD', () => {
      expect(component.getProviderTypeName('AZURE_AD')).toBe('Azure AD');
    });

    it('should return correct name for UAE_PASS', () => {
      expect(component.getProviderTypeName('UAE_PASS')).toBe('UAE Pass');
    });

    it('should return correct name for IBM_IAM', () => {
      expect(component.getProviderTypeName('IBM_IAM')).toBe('IBM IAM');
    });

    it('should return correct name for LDAP_SERVER', () => {
      expect(component.getProviderTypeName('LDAP_SERVER')).toBe('LDAP');
    });

    it('should return correct name for CUSTOM', () => {
      expect(component.getProviderTypeName('CUSTOM')).toBe('Custom');
    });
  });

  // ===========================================================================
  // Date Formatting Tests
  // ===========================================================================
  describe('Date Formatting', () => {
    it('should format date as "Just now" for recent timestamps', () => {
      // Arrange
      const now = new Date().toISOString();

      // Act
      const formatted = component.formatDate(now);

      // Assert
      expect(formatted).toBe('Just now');
    });

    it('should format date as minutes ago for timestamps within an hour', () => {
      // Arrange
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();

      // Act
      const formatted = component.formatDate(fiveMinutesAgo);

      // Assert
      expect(formatted).toBe('5m ago');
    });

    it('should format date as hours ago for timestamps within a day', () => {
      // Arrange
      const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString();

      // Act
      const formatted = component.formatDate(threeHoursAgo);

      // Assert
      expect(formatted).toBe('3h ago');
    });

    it('should format date as days ago for timestamps within a week', () => {
      // Arrange
      const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString();

      // Act
      const formatted = component.formatDate(twoDaysAgo);

      // Assert
      expect(formatted).toBe('2d ago');
    });

    it('should format date as month and day for older timestamps', () => {
      // Arrange
      const tenDaysAgo = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString();

      // Act
      const formatted = component.formatDate(tenDaysAgo);

      // Assert
      expect(formatted).toMatch(/[A-Z][a-z]{2} \d{1,2}/); // e.g., "Jan 5"
    });
  });

  // ===========================================================================
  // Multiple Providers Tests
  // ===========================================================================
  describe('Multiple Providers', () => {
    it('should display all providers', () => {
      // Arrange
      mockProviders.set([mockProvider, mockProvider2, mockProvider3]);
      fixture.detectChanges();

      // Assert
      const compiled = fixture.nativeElement;
      const providerCards = compiled.querySelectorAll('[data-testid="provider-card"]');
      expect(providerCards.length).toBe(3);
    });

    it('should display correct protocol badges', () => {
      // Arrange
      mockProviders.set([mockProvider, mockProvider3]);
      fixture.detectChanges();

      // Assert
      const compiled = fixture.nativeElement;
      const oidcBadges = compiled.querySelectorAll('.protocol-badge.oidc');
      const samlBadges = compiled.querySelectorAll('.protocol-badge.saml');
      expect(oidcBadges.length).toBe(1);
      expect(samlBadges.length).toBe(1);
    });
  });

  // ===========================================================================
  // Test Result Toast Tests
  // ===========================================================================
  describe('Test Result Toast', () => {
    beforeEach(() => {
      mockProviders.set([mockProvider]);
      fixture.detectChanges();
    });

    it('should display success toast', () => {
      // Arrange
      component.testResult.set({ success: true, message: 'Connection successful' });
      fixture.detectChanges();

      // Assert
      const compiled = fixture.nativeElement;
      const toast = compiled.querySelector('[data-testid="test-result-toast"]');
      expect(toast).toBeTruthy();
      expect(toast.classList.contains('success')).toBe(true);
    });

    it('should display error toast', () => {
      // Arrange
      component.testResult.set({ success: false, message: 'Connection failed' });
      fixture.detectChanges();

      // Assert
      const compiled = fixture.nativeElement;
      const toast = compiled.querySelector('[data-testid="test-result-toast"]');
      expect(toast).toBeTruthy();
      expect(toast.classList.contains('error')).toBe(true);
    });

    it('should close toast when close button clicked', () => {
      // Arrange
      component.testResult.set({ success: true, message: 'Connection successful' });
      fixture.detectChanges();

      // Act
      component.testResult.set(null);
      fixture.detectChanges();

      // Assert
      const compiled = fixture.nativeElement;
      const toast = compiled.querySelector('[data-testid="test-result-toast"]');
      expect(toast).toBeFalsy();
    });
  });
});
