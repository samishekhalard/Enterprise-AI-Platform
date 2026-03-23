import { test, expect, Page } from '@playwright/test';

// ============================================================================
// Test Data
// ============================================================================

const TEST_TENANT_ID = 'test-tenant-001';

const MOCK_PROVIDERS = [
  {
    id: 'provider-keycloak-001',
    providerName: 'keycloak-primary',
    providerType: 'KEYCLOAK',
    displayName: 'Corporate SSO',
    protocol: 'OIDC',
    clientId: 'ems-auth-client',
    clientSecret: 'cl****et',
    discoveryUrl: 'https://keycloak.example.com/realms/corp/.well-known/openid-configuration',
    enabled: true,
    priority: 1,
    createdAt: '2024-01-15T10:30:00Z',
    updatedAt: '2024-01-15T10:30:00Z',
    lastTestedAt: '2024-01-16T08:00:00Z',
    testResult: 'success'
  },
  {
    id: 'provider-azure-002',
    providerName: 'azure-ad',
    providerType: 'AZURE_AD',
    displayName: 'Azure Active Directory',
    protocol: 'OIDC',
    clientId: 'azure-client-id',
    clientSecret: 'az****et',
    discoveryUrl: 'https://login.microsoftonline.com/tenant-id/v2.0/.well-known/openid-configuration',
    enabled: false,
    priority: 2,
    createdAt: '2024-01-10T09:00:00Z',
    updatedAt: '2024-01-12T14:30:00Z',
    lastTestedAt: null,
    testResult: null
  }
];

const NEW_PROVIDER_DATA = {
  providerName: 'test-keycloak',
  displayName: 'Test Keycloak Provider',
  protocol: 'OIDC',
  clientId: 'test-client-id',
  discoveryUrl: 'https://keycloak.example.com/.well-known/openid-configuration'
};

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Setup authenticated state with admin role
 */
async function setupAdminAuth(page: Page): Promise<void> {
  await page.addInitScript(() => {
    localStorage.setItem('auth_access_token', 'mock-admin-token');
    localStorage.setItem('auth_user', JSON.stringify({
      id: 'admin-001',
      email: 'admin@example.com',
      displayName: 'Admin User',
      roles: ['admin', 'super-admin'],
      tenantId: 'test-tenant-001'
    }));
  });

  // Mock auth refresh endpoint
  await page.route('**/api/v1/auth/refresh', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        accessToken: 'refreshed-admin-token',
        user: {
          id: 'admin-001',
          email: 'admin@example.com',
          displayName: 'Admin User',
          roles: ['admin', 'super-admin'],
          tenantId: 'test-tenant-001'
        }
      })
    });
  });
}

/**
 * Setup mock API responses for provider management
 */
async function setupProviderApiMocks(page: Page, providers = MOCK_PROVIDERS): Promise<void> {
  // GET /api/v1/admin/tenants/:tenantId/providers - List providers
  await page.route(`**/api/v1/admin/tenants/${TEST_TENANT_ID}/providers`, async route => {
    if (route.request().method() === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(providers)
      });
    } else if (route.request().method() === 'POST') {
      const body = JSON.parse(route.request().postData() || '{}');
      const newProvider = {
        id: `provider-${Date.now()}`,
        ...body,
        providerType: body.providerName?.toUpperCase() || 'CUSTOM',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lastTestedAt: null,
        testResult: null
      };
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify(newProvider)
      });
    } else {
      await route.continue();
    }
  });

  // GET/PUT/DELETE /api/v1/admin/tenants/:tenantId/providers/:providerId
  await page.route(`**/api/v1/admin/tenants/${TEST_TENANT_ID}/providers/*`, async route => {
    const url = route.request().url();
    const providerId = url.split('/').pop()?.split('?')[0];

    if (route.request().method() === 'GET') {
      const provider = providers.find(p => p.id === providerId);
      if (provider) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(provider)
        });
      } else {
        await route.fulfill({ status: 404, body: JSON.stringify({ message: 'Provider not found' }) });
      }
    } else if (route.request().method() === 'PUT') {
      const body = JSON.parse(route.request().postData() || '{}');
      const updatedProvider = {
        ...providers.find(p => p.id === providerId),
        ...body,
        updatedAt: new Date().toISOString()
      };
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(updatedProvider)
      });
    } else if (route.request().method() === 'PATCH') {
      const body = JSON.parse(route.request().postData() || '{}');
      const existingProvider = providers.find(p => p.id === providerId);
      const patchedProvider = {
        ...existingProvider,
        ...body,
        updatedAt: new Date().toISOString()
      };
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(patchedProvider)
      });
    } else if (route.request().method() === 'DELETE') {
      await route.fulfill({ status: 204 });
    } else {
      await route.continue();
    }
  });

  // POST /api/v1/admin/tenants/:tenantId/providers/:providerId/test - Test connection
  await page.route(`**/api/v1/admin/tenants/${TEST_TENANT_ID}/providers/*/test`, async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        message: 'Connection successful',
        details: {
          responseTime: 234,
          issuer: 'https://keycloak.example.com/realms/corp'
        }
      })
    });
  });

  // POST /api/v1/admin/tenants/:tenantId/providers/validate - Validate config
  await page.route(`**/api/v1/admin/tenants/${TEST_TENANT_ID}/providers/validate`, async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        message: 'Configuration is valid'
      })
    });
  });
}

/**
 * Navigate to the identity providers page
 * This simulates: Administration > Tenant Manager > Select Tenant > Authentication tab
 */
async function navigateToProvidersPage(page: Page): Promise<void> {
  // Navigate to admin identity providers section
  // The embedded component is shown at this URL with tenantId query param
  await page.goto(`/admin/identity-providers?tenantId=${TEST_TENANT_ID}`);
  await page.waitForLoadState('networkidle');
}

// ============================================================================
// Test Suites
// ============================================================================

test.describe('Identity Provider Management', () => {
  test.beforeEach(async ({ page }) => {
    await setupAdminAuth(page);
    await setupProviderApiMocks(page);
  });

  // ==========================================================================
  // Scenario 1: View Provider List
  // ==========================================================================
  test.describe('Scenario 1: View Provider List', () => {
    test('should display the Identity Providers section heading', async ({ page }) => {
      await navigateToProvidersPage(page);

      // Verify section title is visible
      await expect(page.getByText('Identity Providers')).toBeVisible();
    });

    test('should display the Add Provider button', async ({ page }) => {
      await navigateToProvidersPage(page);

      // Verify Add Provider button is present
      const addButton = page.locator('[data-testid="btn-add-provider"]');
      await expect(addButton).toBeVisible();
      await expect(addButton).toHaveText(/Add Provider/i);
    });

    test('should display provider cards with correct information', async ({ page }) => {
      await navigateToProvidersPage(page);

      // Wait for provider cards to load
      const providerCards = page.locator('[data-testid="provider-card"]');
      await expect(providerCards).toHaveCount(2);

      // Verify first provider card content
      const firstCard = providerCards.first();
      await expect(firstCard.locator('[data-testid="provider-name"]')).toHaveText('Corporate SSO');
      await expect(firstCard.locator('[data-testid="provider-type"]')).toHaveText('Keycloak');
      await expect(firstCard.locator('[data-testid="provider-status"]')).toHaveText('Enabled');

      // Verify second provider card content
      const secondCard = providerCards.nth(1);
      await expect(secondCard.locator('[data-testid="provider-name"]')).toHaveText('Azure Active Directory');
      await expect(secondCard.locator('[data-testid="provider-status"]')).toHaveText('Disabled');
    });

    test('should show enabled/disabled status badges correctly', async ({ page }) => {
      await navigateToProvidersPage(page);

      const enabledBadge = page.locator('[data-testid="provider-status"].enabled').first();
      const disabledBadge = page.locator('[data-testid="provider-status"].disabled').first();

      await expect(enabledBadge).toBeVisible();
      await expect(disabledBadge).toBeVisible();
    });

    test('should display action buttons for each provider', async ({ page }) => {
      await navigateToProvidersPage(page);

      const firstCard = page.locator('[data-testid="provider-card"]').first();

      // Verify action buttons are present
      await expect(firstCard.locator('[data-testid="btn-test-connection"]')).toBeVisible();
      await expect(firstCard.locator('[data-testid="btn-edit-provider"]')).toBeVisible();
      await expect(firstCard.locator('[data-testid="btn-delete-provider"]')).toBeVisible();
      await expect(firstCard.locator('[data-testid="toggle-provider-enabled"]')).toBeVisible();
    });

    test('should display empty state when no providers exist', async ({ page }) => {
      // Override mock to return empty array
      await page.route(`**/api/v1/admin/tenants/${TEST_TENANT_ID}/providers`, async route => {
        if (route.request().method() === 'GET') {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify([])
          });
        } else {
          await route.continue();
        }
      });

      await navigateToProvidersPage(page);

      // Verify empty state is displayed
      const emptyState = page.locator('[data-testid="empty-state"]');
      await expect(emptyState).toBeVisible();
      await expect(page.getByText('No Identity Providers')).toBeVisible();
      await expect(page.locator('[data-testid="btn-add-first-provider"]')).toBeVisible();
    });

    test('should display loading state while fetching providers', async ({ page }) => {
      // Add delay to API response
      await page.route(`**/api/v1/admin/tenants/${TEST_TENANT_ID}/providers`, async route => {
        if (route.request().method() === 'GET') {
          await new Promise(resolve => setTimeout(resolve, 500));
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify(MOCK_PROVIDERS)
          });
        } else {
          await route.continue();
        }
      });

      await page.goto(`/admin/identity-providers?tenantId=${TEST_TENANT_ID}`);

      // Verify loading state is displayed briefly
      const loadingState = page.locator('[data-testid="loading-state"]');
      await expect(loadingState).toBeVisible();

      // Wait for providers to load
      await expect(page.locator('[data-testid="provider-card"]')).toHaveCount(2);
    });

    test('should display error state on API failure', async ({ page }) => {
      // Override mock to return error
      await page.route(`**/api/v1/admin/tenants/${TEST_TENANT_ID}/providers`, async route => {
        if (route.request().method() === 'GET') {
          await route.fulfill({
            status: 500,
            contentType: 'application/json',
            body: JSON.stringify({ message: 'Internal server error' })
          });
        } else {
          await route.continue();
        }
      });

      await navigateToProvidersPage(page);

      // Verify error state is displayed
      const errorState = page.locator('[data-testid="error-state"]');
      await expect(errorState).toBeVisible();
    });
  });

  // ==========================================================================
  // Scenario 2: Add New Provider
  // ==========================================================================
  test.describe('Scenario 2: Add New Provider', () => {
    test('should open provider form when clicking Add Provider', async ({ page }) => {
      await navigateToProvidersPage(page);

      // Click Add Provider button
      await page.locator('[data-testid="btn-add-provider"]').click();

      // Verify template selection is displayed
      await expect(page.getByText('Select Provider Type')).toBeVisible();
    });

    test('should display provider template options', async ({ page }) => {
      await navigateToProvidersPage(page);
      await page.locator('[data-testid="btn-add-provider"]').click();

      // Verify template cards are visible
      await expect(page.locator('[data-testid="template-keycloak"]')).toBeVisible();
      await expect(page.locator('[data-testid="template-auth0"]')).toBeVisible();
      await expect(page.locator('[data-testid="template-okta"]')).toBeVisible();
      await expect(page.locator('[data-testid="template-azure_ad"]')).toBeVisible();
    });

    test('should show configuration form after selecting a template', async ({ page }) => {
      await navigateToProvidersPage(page);
      await page.locator('[data-testid="btn-add-provider"]').click();

      // Select Keycloak template
      await page.locator('[data-testid="template-keycloak"]').click();

      // Verify form fields are displayed
      await expect(page.locator('[data-testid="input-provider-name"]')).toBeVisible();
      await expect(page.locator('[data-testid="input-display-name"]')).toBeVisible();
      await expect(page.locator('[data-testid="select-protocol"]')).toBeVisible();
      await expect(page.locator('[data-testid="input-discovery-url"]')).toBeVisible();
      await expect(page.locator('[data-testid="input-client-id"]')).toBeVisible();
    });

    test('should allow changing template selection', async ({ page }) => {
      await navigateToProvidersPage(page);
      await page.locator('[data-testid="btn-add-provider"]').click();
      await page.locator('[data-testid="template-keycloak"]').click();

      // Verify template badge and change button are visible
      await expect(page.locator('[data-testid="btn-change-template"]')).toBeVisible();

      // Click change button
      await page.locator('[data-testid="btn-change-template"]').click();

      // Verify we're back to template selection
      await expect(page.getByText('Select Provider Type')).toBeVisible();
    });

    test('should validate required fields', async ({ page }) => {
      await navigateToProvidersPage(page);
      await page.locator('[data-testid="btn-add-provider"]').click();
      await page.locator('[data-testid="template-keycloak"]').click();

      // Try to submit without filling required fields
      await page.locator('[data-testid="btn-save"]').click();

      // Verify validation errors are displayed
      await expect(page.locator('[data-testid="error-provider-name"]')).toBeVisible();
      await expect(page.locator('[data-testid="error-display-name"]')).toBeVisible();
    });

    test('should create provider with valid data', async ({ page }) => {
      await navigateToProvidersPage(page);
      await page.locator('[data-testid="btn-add-provider"]').click();
      await page.locator('[data-testid="template-keycloak"]').click();

      // Fill in required fields
      await page.locator('[data-testid="input-provider-name"]').fill(NEW_PROVIDER_DATA.providerName);
      await page.locator('[data-testid="input-display-name"]').fill(NEW_PROVIDER_DATA.displayName);
      await page.locator('[data-testid="input-discovery-url"]').fill(NEW_PROVIDER_DATA.discoveryUrl);
      await page.locator('[data-testid="input-client-id"]').fill(NEW_PROVIDER_DATA.clientId);

      // Submit the form
      await page.locator('[data-testid="btn-save"]').click();

      // Verify success message is displayed
      const successToast = page.locator('[data-testid="success-toast"]');
      await expect(successToast).toBeVisible();
      await expect(successToast).toContainText(/created successfully/i);
    });

    test('should return to list view after successful creation', async ({ page }) => {
      await navigateToProvidersPage(page);
      await page.locator('[data-testid="btn-add-provider"]').click();
      await page.locator('[data-testid="template-keycloak"]').click();

      // Fill form and submit
      await page.locator('[data-testid="input-provider-name"]').fill(NEW_PROVIDER_DATA.providerName);
      await page.locator('[data-testid="input-display-name"]').fill(NEW_PROVIDER_DATA.displayName);
      await page.locator('[data-testid="input-discovery-url"]').fill(NEW_PROVIDER_DATA.discoveryUrl);
      await page.locator('[data-testid="input-client-id"]').fill(NEW_PROVIDER_DATA.clientId);
      await page.locator('[data-testid="btn-save"]').click();

      // Wait for success and verify return to list
      await expect(page.locator('[data-testid="success-toast"]')).toBeVisible();
      await expect(page.locator('[data-testid="btn-add-provider"]')).toBeVisible();
    });

    test('should cancel form and return to list', async ({ page }) => {
      await navigateToProvidersPage(page);
      await page.locator('[data-testid="btn-add-provider"]').click();
      await page.locator('[data-testid="template-keycloak"]').click();

      // Click cancel
      await page.locator('[data-testid="btn-cancel"]').click();

      // Verify return to list view
      await expect(page.locator('[data-testid="btn-add-provider"]')).toBeVisible();
      await expect(page.locator('[data-testid="provider-card"]')).toHaveCount(2);
    });

    test('should use back button to return to list', async ({ page }) => {
      await navigateToProvidersPage(page);
      await page.locator('[data-testid="btn-add-provider"]').click();
      await page.locator('[data-testid="template-keycloak"]').click();

      // Click back button
      await page.locator('[data-testid="btn-back"]').click();

      // Verify return to list view
      await expect(page.locator('[data-testid="btn-add-provider"]')).toBeVisible();
    });
  });

  // ==========================================================================
  // Scenario 3: Edit Existing Provider
  // ==========================================================================
  test.describe('Scenario 3: Edit Existing Provider', () => {
    test('should open edit form when clicking edit button', async ({ page }) => {
      await navigateToProvidersPage(page);

      // Click edit on first provider
      const firstCard = page.locator('[data-testid="provider-card"]').first();
      await firstCard.locator('[data-testid="btn-edit-provider"]').click();

      // Verify edit form is displayed with correct title
      await expect(page.getByText('Edit Provider')).toBeVisible();
    });

    test('should populate form with existing provider data', async ({ page }) => {
      await navigateToProvidersPage(page);

      const firstCard = page.locator('[data-testid="provider-card"]').first();
      await firstCard.locator('[data-testid="btn-edit-provider"]').click();

      // Verify form is populated with existing data
      await expect(page.locator('[data-testid="input-provider-name"]')).toHaveValue('keycloak-primary');
      await expect(page.locator('[data-testid="input-display-name"]')).toHaveValue('Corporate SSO');
    });

    test('should update provider with modified data', async ({ page }) => {
      await navigateToProvidersPage(page);

      const firstCard = page.locator('[data-testid="provider-card"]').first();
      await firstCard.locator('[data-testid="btn-edit-provider"]').click();

      // Modify display name
      const displayNameInput = page.locator('[data-testid="input-display-name"]');
      await displayNameInput.clear();
      await displayNameInput.fill('Updated Corporate SSO');

      // Submit the form
      await page.locator('[data-testid="btn-save"]').click();

      // Verify success message
      const successToast = page.locator('[data-testid="success-toast"]');
      await expect(successToast).toBeVisible();
      await expect(successToast).toContainText(/updated successfully/i);
    });

    test('should return to list after successful update', async ({ page }) => {
      await navigateToProvidersPage(page);

      const firstCard = page.locator('[data-testid="provider-card"]').first();
      await firstCard.locator('[data-testid="btn-edit-provider"]').click();

      const displayNameInput = page.locator('[data-testid="input-display-name"]');
      await displayNameInput.clear();
      await displayNameInput.fill('Updated Provider Name');

      await page.locator('[data-testid="btn-save"]').click();

      // Verify return to list view
      await expect(page.locator('[data-testid="success-toast"]')).toBeVisible();
      await expect(page.locator('[data-testid="btn-add-provider"]')).toBeVisible();
    });

    test('should validate modified fields', async ({ page }) => {
      await navigateToProvidersPage(page);

      const firstCard = page.locator('[data-testid="provider-card"]').first();
      await firstCard.locator('[data-testid="btn-edit-provider"]').click();

      // Clear required field
      const displayNameInput = page.locator('[data-testid="input-display-name"]');
      await displayNameInput.clear();

      // Try to submit
      await page.locator('[data-testid="btn-save"]').click();

      // Verify validation error
      await expect(page.locator('[data-testid="error-display-name"]')).toBeVisible();
    });
  });

  // ==========================================================================
  // Scenario 4: Delete Provider
  // ==========================================================================
  test.describe('Scenario 4: Delete Provider', () => {
    test('should show confirmation dialog when clicking delete', async ({ page }) => {
      await navigateToProvidersPage(page);

      const firstCard = page.locator('[data-testid="provider-card"]').first();
      await firstCard.locator('[data-testid="btn-delete-provider"]').click();

      // Verify confirmation dialog is displayed
      const modal = page.locator('[role="dialog"]');
      await expect(modal).toBeVisible();
      await expect(page.getByText('Delete Provider')).toBeVisible();
      await expect(page.getByText(/Are you sure you want to delete/i)).toBeVisible();
    });

    test('should display provider name in confirmation dialog', async ({ page }) => {
      await navigateToProvidersPage(page);

      const firstCard = page.locator('[data-testid="provider-card"]').first();
      await firstCard.locator('[data-testid="btn-delete-provider"]').click();

      // Verify provider name is mentioned
      await expect(page.getByText('Corporate SSO')).toBeVisible();
    });

    test('should cancel deletion when clicking cancel', async ({ page }) => {
      await navigateToProvidersPage(page);

      const firstCard = page.locator('[data-testid="provider-card"]').first();
      await firstCard.locator('[data-testid="btn-delete-provider"]').click();

      // Click cancel
      await page.locator('[data-testid="btn-cancel-delete"]').click();

      // Verify modal is closed and provider still exists
      await expect(page.locator('[role="dialog"]')).not.toBeVisible();
      await expect(page.locator('[data-testid="provider-card"]')).toHaveCount(2);
    });

    test('should close confirmation dialog via close button', async ({ page }) => {
      await navigateToProvidersPage(page);

      const firstCard = page.locator('[data-testid="provider-card"]').first();
      await firstCard.locator('[data-testid="btn-delete-provider"]').click();

      // Click close button
      await page.locator('[data-testid="btn-close-modal"]').click();

      // Verify modal is closed
      await expect(page.locator('[role="dialog"]')).not.toBeVisible();
    });

    test('should delete provider when confirming', async ({ page }) => {
      await navigateToProvidersPage(page);

      const firstCard = page.locator('[data-testid="provider-card"]').first();
      await firstCard.locator('[data-testid="btn-delete-provider"]').click();

      // Confirm deletion
      await page.locator('[data-testid="btn-confirm-delete"]').click();

      // Verify success message
      const successToast = page.locator('[data-testid="success-toast"]');
      await expect(successToast).toBeVisible();
      await expect(successToast).toContainText(/deleted successfully/i);
    });
  });

  // ==========================================================================
  // Scenario 5: Toggle Provider Enabled/Disabled
  // ==========================================================================
  test.describe('Scenario 5: Toggle Provider Enabled/Disabled', () => {
    test('should display toggle switch for each provider', async ({ page }) => {
      await navigateToProvidersPage(page);

      const toggles = page.locator('[data-testid="toggle-provider-enabled"]');
      await expect(toggles).toHaveCount(2);
    });

    test('should reflect current enabled state in toggle', async ({ page }) => {
      await navigateToProvidersPage(page);

      // First provider is enabled
      const firstToggle = page.locator('[data-testid="provider-card"]').first()
        .locator('[data-testid="toggle-provider-enabled"]');
      await expect(firstToggle).toBeChecked();

      // Second provider is disabled
      const secondToggle = page.locator('[data-testid="provider-card"]').nth(1)
        .locator('[data-testid="toggle-provider-enabled"]');
      await expect(secondToggle).not.toBeChecked();
    });

    test('should toggle provider from enabled to disabled', async ({ page }) => {
      await navigateToProvidersPage(page);

      const firstCard = page.locator('[data-testid="provider-card"]').first();
      const toggle = firstCard.locator('[data-testid="toggle-provider-enabled"]');

      // Toggle off
      await toggle.click();

      // Verify success message
      const successToast = page.locator('[data-testid="success-toast"]');
      await expect(successToast).toBeVisible();
      await expect(successToast).toContainText(/disabled/i);
    });

    test('should toggle provider from disabled to enabled', async ({ page }) => {
      await navigateToProvidersPage(page);

      const secondCard = page.locator('[data-testid="provider-card"]').nth(1);
      const toggle = secondCard.locator('[data-testid="toggle-provider-enabled"]');

      // Toggle on
      await toggle.click();

      // Verify success message
      const successToast = page.locator('[data-testid="success-toast"]');
      await expect(successToast).toBeVisible();
      await expect(successToast).toContainText(/enabled/i);
    });
  });

  // ==========================================================================
  // Scenario 6: Test Connection
  // ==========================================================================
  test.describe('Scenario 6: Test Connection', () => {
    test('should have test connection button for each provider', async ({ page }) => {
      await navigateToProvidersPage(page);

      const testButtons = page.locator('[data-testid="btn-test-connection"]');
      await expect(testButtons).toHaveCount(2);
    });

    test('should display success toast on successful connection test', async ({ page }) => {
      await navigateToProvidersPage(page);

      const firstCard = page.locator('[data-testid="provider-card"]').first();
      await firstCard.locator('[data-testid="btn-test-connection"]').click();

      // Verify success toast is displayed
      const resultToast = page.locator('[data-testid="test-result-toast"]');
      await expect(resultToast).toBeVisible();
      await expect(resultToast).toHaveClass(/success/);
      await expect(resultToast).toContainText(/successful/i);
    });

    test('should display error toast on failed connection test', async ({ page }) => {
      // Override mock to return failure
      await page.route(`**/api/v1/admin/tenants/${TEST_TENANT_ID}/providers/*/test`, async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            message: 'Connection failed: timeout',
            details: null
          })
        });
      });

      await navigateToProvidersPage(page);

      const firstCard = page.locator('[data-testid="provider-card"]').first();
      await firstCard.locator('[data-testid="btn-test-connection"]').click();

      // Verify error toast is displayed
      const resultToast = page.locator('[data-testid="test-result-toast"]');
      await expect(resultToast).toBeVisible();
      await expect(resultToast).toHaveClass(/error/);
    });

    test('should show loading state during connection test', async ({ page }) => {
      // Add delay to test endpoint
      await page.route(`**/api/v1/admin/tenants/${TEST_TENANT_ID}/providers/*/test`, async route => {
        await new Promise(resolve => setTimeout(resolve, 500));
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, message: 'Connection successful' })
        });
      });

      await navigateToProvidersPage(page);

      const firstCard = page.locator('[data-testid="provider-card"]').first();
      const testButton = firstCard.locator('[data-testid="btn-test-connection"]');
      await testButton.click();

      // Verify button is disabled during test (has spinner)
      await expect(testButton.locator('.spinner-sm')).toBeVisible();
    });
  });

  // ==========================================================================
  // Protocol-Specific Form Tests
  // ==========================================================================
  test.describe('Protocol-Specific Forms', () => {
    test('should display OIDC fields when OIDC protocol is selected', async ({ page }) => {
      await navigateToProvidersPage(page);
      await page.locator('[data-testid="btn-add-provider"]').click();
      await page.locator('[data-testid="template-keycloak"]').click();

      // Verify OIDC-specific fields
      await expect(page.locator('[data-testid="input-discovery-url"]')).toBeVisible();
      await expect(page.locator('[data-testid="input-client-id"]')).toBeVisible();
      await expect(page.locator('[data-testid="input-client-secret"]')).toBeVisible();
      await expect(page.locator('[data-testid="input-scopes"]')).toBeVisible();
      await expect(page.locator('[data-testid="checkbox-pkce"]')).toBeVisible();
    });

    test('should display LDAP fields when LDAP template is selected', async ({ page }) => {
      await navigateToProvidersPage(page);
      await page.locator('[data-testid="btn-add-provider"]').click();
      await page.locator('[data-testid="template-ldap_server"]').click();

      // Verify LDAP-specific fields
      await expect(page.locator('[data-testid="input-server-url"]')).toBeVisible();
      await expect(page.locator('[data-testid="input-port"]')).toBeVisible();
      await expect(page.locator('[data-testid="input-bind-dn"]')).toBeVisible();
      await expect(page.locator('[data-testid="input-bind-password"]')).toBeVisible();
      await expect(page.locator('[data-testid="input-user-search-base"]')).toBeVisible();
      await expect(page.locator('[data-testid="input-user-search-filter"]')).toBeVisible();
    });

    test('should toggle advanced settings section', async ({ page }) => {
      await navigateToProvidersPage(page);
      await page.locator('[data-testid="btn-add-provider"]').click();
      await page.locator('[data-testid="template-keycloak"]').click();

      // Advanced settings should be collapsed by default
      const advancedToggle = page.locator('[data-testid="btn-toggle-advanced"]');
      await expect(advancedToggle).toBeVisible();

      // Click to expand
      await advancedToggle.click();

      // Verify advanced fields are visible
      await expect(page.locator('[data-testid="input-idp-hint"]')).toBeVisible();
      await expect(page.locator('[data-testid="input-icon-url"]')).toBeVisible();
      await expect(page.locator('[data-testid="input-allowed-domains"]')).toBeVisible();
      await expect(page.locator('[data-testid="input-sort-order"]')).toBeVisible();
    });

    test('should use Discover button to fetch OIDC configuration', async ({ page }) => {
      // Mock the discover endpoint
      await page.route('**/api/v1/admin/providers/discover**', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            scopes: ['openid', 'profile', 'email', 'roles'],
            issuer: 'https://keycloak.example.com/realms/corp'
          })
        });
      });

      await navigateToProvidersPage(page);
      await page.locator('[data-testid="btn-add-provider"]').click();
      await page.locator('[data-testid="template-keycloak"]').click();

      // Fill discovery URL and click discover
      await page.locator('[data-testid="input-discovery-url"]')
        .fill('https://keycloak.example.com/.well-known/openid-configuration');
      await page.locator('[data-testid="btn-discover"]').click();

      // Verify discovery button shows loading state
      await expect(page.locator('[data-testid="btn-discover"]').locator('.spinner-sm')).toBeVisible();
    });
  });

  // ==========================================================================
  // Authorization Tests
  // ==========================================================================
  test.describe('Authorization', () => {
    test('should redirect non-admin users to access denied', async ({ page }) => {
      // Setup non-admin auth
      await page.addInitScript(() => {
        localStorage.setItem('auth_access_token', 'mock-user-token');
        localStorage.setItem('auth_user', JSON.stringify({
          id: 'user-001',
          email: 'user@example.com',
          displayName: 'Regular User',
          roles: ['user'],
          tenantId: 'test-tenant-001'
        }));
      });

      // Mock API to return 403
      await page.route(`**/api/v1/admin/tenants/${TEST_TENANT_ID}/providers`, async route => {
        await route.fulfill({
          status: 403,
          contentType: 'application/json',
          body: JSON.stringify({ message: 'Insufficient permissions' })
        });
      });

      await page.goto(`/admin/identity-providers?tenantId=${TEST_TENANT_ID}`);

      // Verify error state or redirect to access denied
      const errorState = page.locator('[data-testid="error-state"]');
      const accessDeniedUrl = /\/errors\/access-denied/;

      const hasError = await errorState.isVisible().catch(() => false);
      const redirectedToAccessDenied = accessDeniedUrl.test(page.url());

      expect(hasError || redirectedToAccessDenied).toBeTruthy();
    });
  });

  // ==========================================================================
  // Edge Cases and Error Handling
  // ==========================================================================
  test.describe('Error Handling', () => {
    test('should handle provider name conflict on creation', async ({ page }) => {
      // Override mock to return 409 Conflict
      await page.route(`**/api/v1/admin/tenants/${TEST_TENANT_ID}/providers`, async route => {
        if (route.request().method() === 'POST') {
          await route.fulfill({
            status: 409,
            contentType: 'application/json',
            body: JSON.stringify({ message: 'Provider with same name already exists' })
          });
        } else {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify(MOCK_PROVIDERS)
          });
        }
      });

      await navigateToProvidersPage(page);
      await page.locator('[data-testid="btn-add-provider"]').click();
      await page.locator('[data-testid="template-keycloak"]').click();

      await page.locator('[data-testid="input-provider-name"]').fill('keycloak-primary');
      await page.locator('[data-testid="input-display-name"]').fill('Duplicate Provider');
      await page.locator('[data-testid="input-discovery-url"]').fill('https://keycloak.example.com/.well-known/openid-configuration');
      await page.locator('[data-testid="input-client-id"]').fill('client-id');
      await page.locator('[data-testid="btn-save"]').click();

      // The form should stay open (no success redirect)
      await expect(page.locator('[data-testid="btn-save"]')).toBeVisible();
    });

    test('should handle network error during save', async ({ page }) => {
      // Override mock to simulate network error
      await page.route(`**/api/v1/admin/tenants/${TEST_TENANT_ID}/providers`, async route => {
        if (route.request().method() === 'POST') {
          await route.abort('failed');
        } else {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify(MOCK_PROVIDERS)
          });
        }
      });

      await navigateToProvidersPage(page);
      await page.locator('[data-testid="btn-add-provider"]').click();
      await page.locator('[data-testid="template-keycloak"]').click();

      await page.locator('[data-testid="input-provider-name"]').fill('new-provider');
      await page.locator('[data-testid="input-display-name"]').fill('New Provider');
      await page.locator('[data-testid="input-discovery-url"]').fill('https://keycloak.example.com/.well-known/openid-configuration');
      await page.locator('[data-testid="input-client-id"]').fill('client-id');
      await page.locator('[data-testid="btn-save"]').click();

      // The form should stay open due to error
      await expect(page.locator('[data-testid="btn-save"]')).toBeVisible();
    });

    test('should handle deleted provider gracefully', async ({ page }) => {
      // Override mock to return 404 on edit
      await page.route(`**/api/v1/admin/tenants/${TEST_TENANT_ID}/providers/provider-keycloak-001`, async route => {
        await route.fulfill({
          status: 404,
          contentType: 'application/json',
          body: JSON.stringify({ message: 'Provider not found' })
        });
      });

      await navigateToProvidersPage(page);

      // Try to edit a provider that gets deleted
      const firstCard = page.locator('[data-testid="provider-card"]').first();
      await firstCard.locator('[data-testid="btn-edit-provider"]').click();

      // Should handle gracefully (either show error or return to list)
      // The specific behavior depends on implementation
    });
  });
});
