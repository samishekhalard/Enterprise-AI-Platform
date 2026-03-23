import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { signal, WritableSignal } from '@angular/core';
import { of, throwError } from 'rxjs';
import { ProviderEmbeddedComponent } from './provider-embedded.component';
import { ProviderAdminService } from '../../services/provider-admin.service';
import { ProviderConfig } from '../../models/provider-config.model';

describe('ProviderEmbeddedComponent', () => {
  let component: ProviderEmbeddedComponent;
  let fixture: ComponentFixture<ProviderEmbeddedComponent>;
  let providerServiceMock: {
    getProviders: ReturnType<typeof vi.fn>;
    deleteProvider: ReturnType<typeof vi.fn>;
    toggleProviderEnabled: ReturnType<typeof vi.fn>;
    reset: ReturnType<typeof vi.fn>;
    providers: ReturnType<typeof signal<ProviderConfig[]>>;
    isLoading: ReturnType<typeof signal<boolean>>;
    error: ReturnType<typeof signal<string | null>>;
  };

  // Mock signals for the service
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
    scopes: ['openid', 'profile', 'email']
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
      getProviders: vi.fn().mockReturnValue(of([mockProvider])),
      deleteProvider: vi.fn().mockReturnValue(of(void 0)),
      toggleProviderEnabled: vi.fn().mockReturnValue(of(mockProvider)),
      reset: vi.fn(),
      providers: mockProviders,
      isLoading: mockIsLoading,
      error: mockError
    };

    await TestBed.configureTestingModule({
      imports: [ProviderEmbeddedComponent],
      providers: [
        { provide: ProviderAdminService, useValue: providerServiceMock }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ProviderEmbeddedComponent);
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

    it('should start in list view mode', () => {
      fixture.detectChanges();
      expect(component.viewMode()).toBe('list');
    });

    it('should start with no selected provider', () => {
      fixture.detectChanges();
      expect(component.selectedProvider()).toBeNull();
    });

    it('should start with no success message', () => {
      fixture.detectChanges();
      expect(component.successMessage()).toBeNull();
    });
  });

  // ===========================================================================
  // OnInit Tests
  // ===========================================================================
  describe('ngOnInit', () => {
    it('should load providers on init when tenantId is set', () => {
      // Arrange
      component.tenantId = 'tenant-123';

      // Act
      fixture.detectChanges();

      // Assert
      expect(providerServiceMock.getProviders).toHaveBeenCalledWith('tenant-123');
    });

    it('should not load providers when tenantId is not set', () => {
      // Arrange
      component.tenantId = '';

      // Act
      fixture.detectChanges();

      // Assert
      expect(providerServiceMock.getProviders).not.toHaveBeenCalled();
    });
  });

  // ===========================================================================
  // OnChanges Tests
  // ===========================================================================
  describe('ngOnChanges', () => {
    it('should reset and reload when tenantId changes', () => {
      // Arrange
      fixture.detectChanges();
      providerServiceMock.getProviders.mockClear();

      // Act - simulate tenantId change
      component.ngOnChanges({
        tenantId: {
          previousValue: 'tenant-123',
          currentValue: 'tenant-456',
          firstChange: false,
          isFirstChange: () => false
        }
      });
      component.tenantId = 'tenant-456';
      component.ngOnChanges({
        tenantId: {
          previousValue: 'tenant-123',
          currentValue: 'tenant-456',
          firstChange: false,
          isFirstChange: () => false
        }
      });

      // Assert
      expect(providerServiceMock.reset).toHaveBeenCalled();
      expect(component.viewMode()).toBe('list');
      expect(component.selectedProvider()).toBeNull();
    });

    it('should not reset on first change', () => {
      // Act
      component.ngOnChanges({
        tenantId: {
          previousValue: undefined,
          currentValue: 'tenant-123',
          firstChange: true,
          isFirstChange: () => true
        }
      });

      // Assert
      expect(providerServiceMock.reset).not.toHaveBeenCalled();
    });
  });

  // ===========================================================================
  // View Mode Tests
  // ===========================================================================
  describe('View Mode Transitions', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should switch to create view when openCreateForm() called', () => {
      // Act
      component.openCreateForm();

      // Assert
      expect(component.viewMode()).toBe('create');
      expect(component.selectedProvider()).toBeNull();
    });

    it('should switch to edit view with selected provider when openEditForm() called', () => {
      // Act
      component.openEditForm(mockProvider);

      // Assert
      expect(component.viewMode()).toBe('edit');
      expect(component.selectedProvider()).toBe(mockProvider);
    });

    it('should return to list view when closeForm() called', () => {
      // Arrange
      component.openEditForm(mockProvider);
      expect(component.viewMode()).toBe('edit');

      // Act
      component.closeForm();

      // Assert
      expect(component.viewMode()).toBe('list');
      expect(component.selectedProvider()).toBeNull();
    });

    it('should clear selected provider when closeForm() called', () => {
      // Arrange
      component.openEditForm(mockProvider);

      // Act
      component.closeForm();

      // Assert
      expect(component.selectedProvider()).toBeNull();
    });
  });

  // ===========================================================================
  // Provider Saved Tests
  // ===========================================================================
  describe('handleProviderSaved', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should show success toast after provider saved in create mode', fakeAsync(() => {
      // Arrange
      component.openCreateForm();

      // Act
      component.handleProviderSaved(mockProvider);

      // Assert
      expect(component.successMessage()).toContain('created successfully');
      expect(component.successMessage()).toContain(mockProvider.displayName);
    }));

    it('should show success toast after provider saved in edit mode', fakeAsync(() => {
      // Arrange
      component.openEditForm(mockProvider);

      // Act
      component.handleProviderSaved(mockProvider);

      // Assert
      expect(component.successMessage()).toContain('updated successfully');
      expect(component.successMessage()).toContain(mockProvider.displayName);
    }));

    it('should return to list view after provider saved', () => {
      // Arrange
      component.openCreateForm();

      // Act
      component.handleProviderSaved(mockProvider);

      // Assert
      expect(component.viewMode()).toBe('list');
    });

    it('should reload providers after save', () => {
      // Arrange
      component.openCreateForm();
      providerServiceMock.getProviders.mockClear();

      // Act
      component.handleProviderSaved(mockProvider);

      // Assert
      expect(providerServiceMock.getProviders).toHaveBeenCalledWith('tenant-123');
    });

    it('should auto-dismiss success toast after 5 seconds', fakeAsync(() => {
      // Arrange
      component.openCreateForm();

      // Act
      component.handleProviderSaved(mockProvider);
      expect(component.successMessage()).toBeTruthy();

      tick(5000);

      // Assert
      expect(component.successMessage()).toBeNull();
    }));
  });

  // ===========================================================================
  // Delete Tests
  // ===========================================================================
  describe('handleDelete', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should call delete service when handleDelete() called', () => {
      // Act
      component.handleDelete(mockProvider);

      // Assert
      expect(providerServiceMock.deleteProvider).toHaveBeenCalledWith('tenant-123', 'provider-1');
    });

    it('should show success toast after successful delete', fakeAsync(() => {
      // Act
      component.handleDelete(mockProvider);

      // Assert
      expect(component.successMessage()).toContain('deleted successfully');
      expect(component.successMessage()).toContain(mockProvider.displayName);
    }));

    it('should not call delete service if tenantId is missing', () => {
      // Arrange
      component.tenantId = '';

      // Act
      component.handleDelete(mockProvider);

      // Assert
      expect(providerServiceMock.deleteProvider).not.toHaveBeenCalled();
    });

    it('should not call delete service if provider id is missing', () => {
      // Arrange
      const providerWithoutId = { ...mockProvider, id: undefined };

      // Act
      component.handleDelete(providerWithoutId);

      // Assert
      expect(providerServiceMock.deleteProvider).not.toHaveBeenCalled();
    });

    it('should handle delete error', () => {
      // Arrange
      providerServiceMock.deleteProvider.mockReturnValue(throwError(() => new Error('Delete failed')));
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      // Act
      component.handleDelete(mockProvider);

      // Assert
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  // ===========================================================================
  // Toggle Enabled Tests
  // ===========================================================================
  describe('handleToggleEnabled', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should call toggle service when handleToggleEnabled() called', () => {
      // Act
      component.handleToggleEnabled({ provider: mockProvider, enabled: false });

      // Assert
      expect(providerServiceMock.toggleProviderEnabled).toHaveBeenCalledWith(
        'tenant-123',
        'provider-1',
        false
      );
    });

    it('should show success toast after successful toggle to disabled', fakeAsync(() => {
      // Act
      component.handleToggleEnabled({ provider: mockProvider, enabled: false });

      // Assert
      expect(component.successMessage()).toContain('disabled');
      expect(component.successMessage()).toContain(mockProvider.displayName);
    }));

    it('should show success toast after successful toggle to enabled', fakeAsync(() => {
      // Act
      component.handleToggleEnabled({ provider: mockProvider, enabled: true });

      // Assert
      expect(component.successMessage()).toContain('enabled');
      expect(component.successMessage()).toContain(mockProvider.displayName);
    }));

    it('should not call toggle service if tenantId is missing', () => {
      // Arrange
      component.tenantId = '';

      // Act
      component.handleToggleEnabled({ provider: mockProvider, enabled: false });

      // Assert
      expect(providerServiceMock.toggleProviderEnabled).not.toHaveBeenCalled();
    });

    it('should not call toggle service if provider id is missing', () => {
      // Arrange
      const providerWithoutId = { ...mockProvider, id: undefined };

      // Act
      component.handleToggleEnabled({ provider: providerWithoutId, enabled: false });

      // Assert
      expect(providerServiceMock.toggleProviderEnabled).not.toHaveBeenCalled();
    });

    it('should handle toggle error', () => {
      // Arrange
      providerServiceMock.toggleProviderEnabled.mockReturnValue(throwError(() => new Error('Toggle failed')));
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      // Act
      component.handleToggleEnabled({ provider: mockProvider, enabled: false });

      // Assert
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  // ===========================================================================
  // loadProviders Tests
  // ===========================================================================
  describe('loadProviders', () => {
    it('should not load if tenantId is empty', () => {
      // Arrange
      component.tenantId = '';
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      // Act
      component.loadProviders();

      // Assert
      expect(providerServiceMock.getProviders).not.toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('should call getProviders with correct tenantId', () => {
      // Arrange
      fixture.detectChanges();
      providerServiceMock.getProviders.mockClear();

      // Act
      component.loadProviders();

      // Assert
      expect(providerServiceMock.getProviders).toHaveBeenCalledWith('tenant-123');
    });

    it('should handle load error', () => {
      // Arrange
      providerServiceMock.getProviders.mockReturnValue(throwError(() => new Error('Load failed')));
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      fixture.detectChanges();
      providerServiceMock.getProviders.mockClear();
      providerServiceMock.getProviders.mockReturnValue(throwError(() => new Error('Load failed')));

      // Act
      component.loadProviders();

      // Assert
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  // ===========================================================================
  // Service Signal Binding Tests
  // ===========================================================================
  describe('Service Signal Binding', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should expose providers from service', () => {
      // Arrange
      mockProviders.set([mockProvider, mockProvider2]);

      // Assert
      expect(component.providers()).toEqual([mockProvider, mockProvider2]);
    });

    it('should expose isLoading from service', () => {
      // Arrange
      mockIsLoading.set(true);

      // Assert
      expect(component.isLoading()).toBe(true);
    });

    it('should expose error from service', () => {
      // Arrange
      mockError.set('An error occurred');

      // Assert
      expect(component.error()).toBe('An error occurred');
    });
  });
});
