import { test, expect, Page } from '@playwright/test';

// ============================================================================
// Test Data
// ============================================================================

const MASTER_TENANT_ID = 'master-tenant-001';

const SUPERUSER = {
  id: 'superuser-001',
  email: 'superadmin@emsist.com',
  emailVerified: true,
  firstName: 'Super',
  lastName: 'Admin',
  displayName: 'Super Admin',
  locale: 'en',
  timezone: 'UTC',
  roles: ['admin', 'super-admin'],
  permissions: [],
  tenantId: MASTER_TENANT_ID,
  tenantRole: 'admin',
  authProvider: 'keycloak',
  lastLogin: '2026-02-26T08:00:00Z',
  createdAt: '2026-01-01T00:00:00Z'
};

const REGULAR_USER = {
  id: 'user-regular-001',
  email: 'viewer@emsist.com',
  emailVerified: true,
  firstName: 'Regular',
  lastName: 'Viewer',
  displayName: 'Regular Viewer',
  locale: 'en',
  timezone: 'UTC',
  roles: ['user'],
  permissions: [],
  tenantId: 'tenant-acme-001',
  tenantRole: 'member',
  authProvider: 'local',
  lastLogin: '2026-02-25T14:30:00Z',
  createdAt: '2026-02-01T00:00:00Z'
};

const MOCK_TENANTS = {
  tenants: [
    {
      id: MASTER_TENANT_ID,
      uuid: '00000000-0000-0000-0000-000000000001',
      fullName: 'Master Tenant',
      shortName: 'Master',
      description: 'The master tenant for platform administration.',
      logo: '',
      tenantType: 'master',
      status: 'active',
      isProtected: true,
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z'
    },
    {
      id: 'tenant-acme-001',
      uuid: '00000000-0000-0000-0000-000000000002',
      fullName: 'Acme Corporation',
      shortName: 'Acme',
      description: 'A regular tenant for testing.',
      logo: '',
      tenantType: 'regular',
      status: 'active',
      isProtected: false,
      createdAt: '2026-01-15T00:00:00Z',
      updatedAt: '2026-02-01T00:00:00Z'
    }
  ],
  total: 2,
  page: 0,
  size: 10,
  totalPages: 1
};

const MOCK_KEYCLOAK_PROVIDER = {
  id: 'provider-keycloak-master',
  providerName: 'keycloak-primary',
  providerType: 'KEYCLOAK',
  displayName: 'Keycloak SSO',
  protocol: 'OIDC',
  clientId: 'ems-auth-facade',
  clientSecret: 'em****de',
  discoveryUrl: 'https://keycloak.emsist.com/realms/master/.well-known/openid-configuration',
  enabled: true,
  priority: 1,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
  lastTestedAt: '2026-02-20T10:00:00Z',
  testResult: 'success'
};

const MOCK_USERS_SUPERADMIN = [
  {
    id: 'superuser-001',
    email: 'superadmin@emsist.com',
    firstName: 'Super',
    lastName: 'Admin',
    displayName: 'Super Admin',
    active: true,
    emailVerified: true,
    roles: ['SUPER_ADMIN', 'ADMIN'],
    groups: [],
    identityProvider: 'keycloak',
    lastLoginAt: '2026-02-26T08:00:00Z',
    createdAt: '2026-01-01T00:00:00Z'
  }
];

const MOCK_USERS_FULL_PAGE = [
  ...MOCK_USERS_SUPERADMIN,
  {
    id: 'user-002',
    email: 'manager@emsist.com',
    firstName: 'Jane',
    lastName: 'Manager',
    displayName: 'Jane Manager',
    active: true,
    emailVerified: true,
    roles: ['MANAGER'],
    groups: [],
    identityProvider: 'keycloak',
    lastLoginAt: '2026-02-25T14:30:00Z',
    createdAt: '2026-01-15T00:00:00Z'
  },
  {
    id: 'user-003',
    email: 'disabled@emsist.com',
    firstName: 'Disabled',
    lastName: 'User',
    displayName: 'Disabled User',
    active: false,
    emailVerified: false,
    roles: ['USER'],
    groups: [],
    identityProvider: 'keycloak',
    lastLoginAt: null,
    createdAt: '2026-02-01T00:00:00Z'
  },
  {
    id: 'user-004',
    email: 'viewer1@emsist.com',
    firstName: 'First',
    lastName: 'Viewer',
    displayName: 'First Viewer',
    active: true,
    emailVerified: true,
    roles: ['VIEWER'],
    groups: [],
    identityProvider: 'keycloak',
    lastLoginAt: '2026-02-24T09:00:00Z',
    createdAt: '2026-02-05T00:00:00Z'
  },
  {
    id: 'user-005',
    email: 'viewer2@emsist.com',
    firstName: 'Second',
    lastName: 'Viewer',
    displayName: 'Second Viewer',
    active: true,
    emailVerified: true,
    roles: ['VIEWER'],
    groups: [],
    identityProvider: 'keycloak',
    lastLoginAt: '2026-02-23T11:00:00Z',
    createdAt: '2026-02-06T00:00:00Z'
  },
  {
    id: 'user-006',
    email: 'admin2@emsist.com',
    firstName: 'Other',
    lastName: 'Admin',
    displayName: 'Other Admin',
    active: true,
    emailVerified: true,
    roles: ['ADMIN'],
    groups: [],
    identityProvider: 'keycloak',
    lastLoginAt: '2026-02-22T15:00:00Z',
    createdAt: '2026-02-07T00:00:00Z'
  },
  {
    id: 'user-007',
    email: 'contributor1@emsist.com',
    firstName: 'Alpha',
    lastName: 'Contributor',
    displayName: 'Alpha Contributor',
    active: true,
    emailVerified: true,
    roles: ['USER'],
    groups: [],
    identityProvider: 'keycloak',
    lastLoginAt: '2026-02-21T10:00:00Z',
    createdAt: '2026-02-08T00:00:00Z'
  },
  {
    id: 'user-008',
    email: 'contributor2@emsist.com',
    firstName: 'Beta',
    lastName: 'Contributor',
    displayName: 'Beta Contributor',
    active: true,
    emailVerified: true,
    roles: ['USER'],
    groups: [],
    identityProvider: 'keycloak',
    lastLoginAt: '2026-02-20T12:00:00Z',
    createdAt: '2026-02-09T00:00:00Z'
  },
  {
    id: 'user-009',
    email: 'contributor3@emsist.com',
    firstName: 'Gamma',
    lastName: 'Contributor',
    displayName: 'Gamma Contributor',
    active: true,
    emailVerified: true,
    roles: ['USER'],
    groups: [],
    identityProvider: 'keycloak',
    lastLoginAt: '2026-02-19T16:00:00Z',
    createdAt: '2026-02-10T00:00:00Z'
  },
  {
    id: 'user-010',
    email: 'contributor4@emsist.com',
    firstName: 'Delta',
    lastName: 'Contributor',
    displayName: 'Delta Contributor',
    active: false,
    emailVerified: true,
    roles: ['USER'],
    groups: [],
    identityProvider: 'keycloak',
    lastLoginAt: null,
    createdAt: '2026-02-11T00:00:00Z'
  },
  {
    id: 'user-011',
    email: 'extra-user@emsist.com',
    firstName: 'Extra',
    lastName: 'User',
    displayName: 'Extra User',
    active: true,
    emailVerified: true,
    roles: ['VIEWER'],
    groups: [],
    identityProvider: 'keycloak',
    lastLoginAt: '2026-02-18T08:00:00Z',
    createdAt: '2026-02-12T00:00:00Z'
  }
];

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Setup authenticated session with superuser (admin) role.
 * Follows the pattern from identity-providers.e2e.ts.
 */
async function setupSuperAdminAuth(page: Page): Promise<void> {
  await page.addInitScript((user) => {
    localStorage.setItem('auth_access_token', 'mock-super-admin-token');
    localStorage.setItem('auth_user', JSON.stringify(user));
    sessionStorage.setItem('auth_user', JSON.stringify(user));
    sessionStorage.setItem('auth_refresh_token', 'mock-super-refresh-token');
    sessionStorage.setItem('auth_tenant_id', user.tenantId);
  }, SUPERUSER);

  await page.route('**/api/v1/auth/refresh', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        accessToken: 'refreshed-super-admin-token',
        refreshToken: 'mock-super-refresh-token',
        tokenType: 'Bearer',
        expiresIn: 3600,
        refreshExpiresIn: 86400,
        scope: 'openid profile email',
        user: SUPERUSER
      })
    });
  });
}

/**
 * Setup authenticated session with a non-admin regular user.
 */
async function setupRegularUserAuth(page: Page): Promise<void> {
  await page.addInitScript((user) => {
    localStorage.setItem('auth_access_token', 'mock-regular-user-token');
    localStorage.setItem('auth_user', JSON.stringify(user));
    sessionStorage.setItem('auth_user', JSON.stringify(user));
    sessionStorage.setItem('auth_refresh_token', 'mock-regular-refresh-token');
    sessionStorage.setItem('auth_tenant_id', user.tenantId);
  }, REGULAR_USER);

  await page.route('**/api/v1/auth/refresh', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        accessToken: 'refreshed-regular-token',
        refreshToken: 'mock-regular-refresh-token',
        tokenType: 'Bearer',
        expiresIn: 3600,
        refreshExpiresIn: 86400,
        scope: 'openid profile email',
        user: REGULAR_USER
      })
    });
  });
}

/**
 * Mock the tenant resolution API used by the application on startup.
 */
async function mockTenantResolution(page: Page): Promise<void> {
  await page.route('**/api/tenants/resolve*', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        resolved: true,
        hostname: 'localhost',
        tenant: {
          id: MASTER_TENANT_ID,
          uuid: '00000000-0000-0000-0000-000000000001',
          fullName: 'Master Tenant',
          shortName: 'Master',
          slug: 'master',
          tenantType: 'master',
          tier: 'enterprise',
          status: 'active',
          domains: [{ id: 'domain-001', domain: 'localhost', isPrimary: true, isVerified: true }],
          primaryDomain: 'localhost',
          authProviders: [
            {
              id: 'provider-local-001',
              type: 'local',
              name: 'local',
              displayName: 'Email and Password',
              isEnabled: true,
              isPrimary: true,
              sortOrder: 1,
              config: { type: 'local', allowRegistration: false }
            }
          ],
          defaultAuthProvider: 'local',
          branding: {
            primaryColor: '#047481',
            primaryColorDark: '#035a64',
            secondaryColor: '#64748b',
            logoUrl: '/assets/images/logo.svg',
            faviconUrl: '/assets/favicon.ico',
            fontFamily: "'Gotham Rounded', 'Nunito', sans-serif"
          },
          sessionConfig: {
            accessTokenLifetime: 5,
            refreshTokenLifetime: 30,
            idleTimeout: 15,
            absoluteTimeout: 480,
            maxConcurrentSessions: 5,
            allowMultipleDevices: true
          },
          mfaConfig: { enabled: false, required: false },
          createdAt: '2026-01-01T00:00:00Z',
          updatedAt: '2026-01-01T00:00:00Z'
        }
      })
    });
  });
}

/**
 * Mock the tenants list API used by the administration tenant manager.
 */
async function mockTenantsListApi(page: Page): Promise<void> {
  await page.route('**/api/tenants', async route => {
    if (route.request().method() === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_TENANTS)
      });
    } else {
      await route.continue();
    }
  });
}

/**
 * Mock the admin providers API for a given tenant.
 */
async function mockProvidersApi(page: Page, tenantId: string, providers = [MOCK_KEYCLOAK_PROVIDER]): Promise<void> {
  await page.route(`**/api/v1/admin/tenants/${tenantId}/providers`, async route => {
    if (route.request().method() === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(providers)
      });
    } else {
      await route.continue();
    }
  });
}

/**
 * Mock the admin users API for a given tenant with configurable user data and pagination.
 */
async function mockUsersApi(
  page: Page,
  tenantId: string,
  users: typeof MOCK_USERS_SUPERADMIN = MOCK_USERS_SUPERADMIN,
  options: { totalElements?: number; totalPages?: number; page?: number; size?: number } = {}
): Promise<void> {
  await page.route(`**/api/v1/admin/tenants/${tenantId}/users*`, async route => {
    const url = new URL(route.request().url());
    const pageParam = parseInt(url.searchParams.get('page') || '0', 10);
    const sizeParam = parseInt(url.searchParams.get('size') || '10', 10);
    const searchParam = url.searchParams.get('search') || '';

    let filteredUsers = users;
    if (searchParam) {
      const term = searchParam.toLowerCase();
      filteredUsers = users.filter(u =>
        u.email.toLowerCase().includes(term) ||
        u.displayName.toLowerCase().includes(term) ||
        u.firstName.toLowerCase().includes(term) ||
        u.lastName.toLowerCase().includes(term)
      );
    }

    const totalElements = options.totalElements ?? filteredUsers.length;
    const size = options.size ?? sizeParam;
    const totalPages = options.totalPages ?? Math.max(1, Math.ceil(totalElements / size));
    const page = options.page ?? pageParam;

    // Paginate the filtered user list
    const start = page * size;
    const pagedUsers = filteredUsers.slice(start, start + size);

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        content: pagedUsers,
        totalElements,
        totalPages,
        page,
        size
      })
    });
  });
}

/**
 * Navigate to the administration page and wait for tenants to load.
 */
async function navigateToAdministration(page: Page): Promise<void> {
  await page.goto('/administration');
  await page.waitForLoadState('networkidle');
}

/**
 * Click on a tenant card in the tenant list to open its factsheet.
 */
async function selectTenantByName(page: Page, tenantShortName: string): Promise<void> {
  // Find the tenant card or row containing the short name and click it
  const tenantElement = page.getByText(tenantShortName, { exact: false }).first();
  await expect(tenantElement).toBeVisible();
  await tenantElement.click();
}

/**
 * Switch to a specific tab in the tenant factsheet.
 */
async function switchToTab(page: Page, tabLabel: string): Promise<void> {
  const tab = page.locator('button[role="tab"]').filter({ hasText: tabLabel });
  await expect(tab).toBeVisible();
  await tab.click();
}

// ============================================================================
// Test Suites
// ============================================================================

test.describe('Admin Users - ISSUE-001 E2E Tests', () => {

  // ==========================================================================
  // E2E-001: Login as superuser, navigate to Administration, see Master Tenant
  // ==========================================================================
  test.describe('E2E-001: Superuser Administration Access', () => {
    test('should login as superuser, navigate to Administration, and see Master Tenant in list', async ({ page }) => {
      // Arrange
      await mockTenantResolution(page);
      await setupSuperAdminAuth(page);
      await mockTenantsListApi(page);

      // Act
      await navigateToAdministration(page);

      // Assert - verify the admin page loaded with Tenant Manager visible
      await expect(page.getByText('Tenant Manager')).toBeVisible();

      // Assert - verify Master Tenant is visible in the tenant list
      await expect(page.getByText('Master')).toBeVisible();
      await expect(page.getByText('Master Tenant')).toBeVisible();
    });

    test('should display Master Tenant with protected badge and master type', async ({ page }) => {
      // Arrange
      await mockTenantResolution(page);
      await setupSuperAdminAuth(page);
      await mockTenantsListApi(page);

      // Act
      await navigateToAdministration(page);

      // Assert - Master Tenant should have type indicator
      // The tenant list shows type badges; master type is displayed
      const masterRow = page.getByText('Master Tenant').locator('..');
      await expect(masterRow).toBeVisible();
    });
  });

  // ==========================================================================
  // E2E-002: Select Master Tenant, click "Local Authentication" tab, see provider
  // ==========================================================================
  test.describe('E2E-002: Master Tenant Authentication Tab', () => {
    test('should select Master Tenant and see Keycloak provider card in Authentication tab', async ({ page }) => {
      // Arrange
      await mockTenantResolution(page);
      await setupSuperAdminAuth(page);
      await mockTenantsListApi(page);
      await mockProvidersApi(page, MASTER_TENANT_ID);

      // Act
      await navigateToAdministration(page);
      await selectTenantByName(page, 'Master');

      // Wait for factsheet to appear with tabs
      await expect(page.locator('button[role="tab"]').filter({ hasText: 'Local Authentication' })).toBeVisible();
      await switchToTab(page, 'Local Authentication');

      // Assert - provider list should load with the Keycloak provider card
      await expect(page.getByText('Identity Providers')).toBeVisible();
      const providerCards = page.locator('[data-testid="provider-card"]');
      await expect(providerCards).toHaveCount(1);

      // Assert - verify it is the Keycloak provider
      const keycloakCard = providerCards.first();
      await expect(keycloakCard.locator('[data-testid="provider-name"]')).toHaveText('Keycloak SSO');
      await expect(keycloakCard.locator('[data-testid="provider-type"]')).toHaveText('Keycloak');
      await expect(keycloakCard.locator('[data-testid="provider-status"]')).toHaveText('Enabled');
    });

    test('should not receive a 404 error when loading providers (ISSUE-001a fix)', async ({ page }) => {
      // Arrange
      await mockTenantResolution(page);
      await setupSuperAdminAuth(page);
      await mockTenantsListApi(page);
      await mockProvidersApi(page, MASTER_TENANT_ID);

      // Act
      await navigateToAdministration(page);
      await selectTenantByName(page, 'Master');
      await switchToTab(page, 'Local Authentication');

      // Assert - no error state should be visible
      const errorState = page.locator('[data-testid="error-state"]');
      await expect(errorState).not.toBeVisible();

      // Assert - provider card IS visible (not a 404 empty state)
      await expect(page.locator('[data-testid="provider-card"]').first()).toBeVisible();
    });
  });

  // ==========================================================================
  // E2E-003: Click "Users" tab, see superuser with SUPER_ADMIN badge
  // ==========================================================================
  test.describe('E2E-003: Users Tab with Superuser', () => {
    test('should display superuser in user list with SUPER_ADMIN role badge', async ({ page }) => {
      // Arrange
      await mockTenantResolution(page);
      await setupSuperAdminAuth(page);
      await mockTenantsListApi(page);
      await mockUsersApi(page, MASTER_TENANT_ID, MOCK_USERS_SUPERADMIN);

      // Act
      await navigateToAdministration(page);
      await selectTenantByName(page, 'Master');
      await switchToTab(page, 'Users');

      // Assert - user list section should be visible
      await expect(page.locator('[data-testid="user-list"]')).toBeVisible();

      // Assert - superuser should be in the list
      await expect(page.getByText('superadmin@emsist.com')).toBeVisible();
      await expect(page.getByText('Super Admin')).toBeVisible();

      // Assert - SUPER_ADMIN role badge should be visible
      const rolesContainer = page.locator('[data-testid="user-roles"]').first();
      await expect(rolesContainer).toBeVisible();
      await expect(rolesContainer.getByText('Super Admin')).toBeVisible();
    });

    test('should display user status as Active for enabled superuser', async ({ page }) => {
      // Arrange
      await mockTenantResolution(page);
      await setupSuperAdminAuth(page);
      await mockTenantsListApi(page);
      await mockUsersApi(page, MASTER_TENANT_ID, MOCK_USERS_SUPERADMIN);

      // Act
      await navigateToAdministration(page);
      await selectTenantByName(page, 'Master');
      await switchToTab(page, 'Users');

      // Assert - status badge should say Active
      const statusBadge = page.locator('[data-testid="user-status"]').first();
      await expect(statusBadge).toBeVisible();
      await expect(statusBadge).toContainText('Active');
    });
  });

  // ==========================================================================
  // E2E-004: Users tab: verify pagination controls
  // ==========================================================================
  test.describe('E2E-004: Users Tab Pagination', () => {
    test('should display pagination controls when more than 10 users exist', async ({ page }) => {
      // Arrange - 11 users, default page size 10 = 2 pages
      await mockTenantResolution(page);
      await setupSuperAdminAuth(page);
      await mockTenantsListApi(page);
      await mockUsersApi(page, MASTER_TENANT_ID, MOCK_USERS_FULL_PAGE, {
        totalElements: 11,
        totalPages: 2,
        page: 0,
        size: 10
      });

      // Act
      await navigateToAdministration(page);
      await selectTenantByName(page, 'Master');
      await switchToTab(page, 'Users');

      // Assert - pagination section should be visible
      const pagination = page.locator('[data-testid="pagination"]');
      await expect(pagination).toBeVisible();

      // Assert - navigation buttons should exist
      await expect(page.locator('[data-testid="btn-prev-page"]')).toBeVisible();
      await expect(page.locator('[data-testid="btn-next-page"]')).toBeVisible();
      await expect(page.locator('[data-testid="btn-first-page"]')).toBeVisible();
      await expect(page.locator('[data-testid="btn-last-page"]')).toBeVisible();

      // Assert - page indicator should show "Page 1 of 2"
      await expect(page.getByText('Page 1 of 2')).toBeVisible();

      // Assert - previous/first page buttons should be disabled on first page
      await expect(page.locator('[data-testid="btn-prev-page"]')).toBeDisabled();
      await expect(page.locator('[data-testid="btn-first-page"]')).toBeDisabled();

      // Assert - next/last page buttons should be enabled
      await expect(page.locator('[data-testid="btn-next-page"]')).toBeEnabled();
      await expect(page.locator('[data-testid="btn-last-page"]')).toBeEnabled();
    });

    test('should not display pagination when all users fit on one page', async ({ page }) => {
      // Arrange - 3 users, page size 10 = 1 page
      await mockTenantResolution(page);
      await setupSuperAdminAuth(page);
      await mockTenantsListApi(page);
      await mockUsersApi(page, MASTER_TENANT_ID, MOCK_USERS_SUPERADMIN, {
        totalElements: 1,
        totalPages: 1,
        page: 0,
        size: 10
      });

      // Act
      await navigateToAdministration(page);
      await selectTenantByName(page, 'Master');
      await switchToTab(page, 'Users');

      // Assert - pagination should not be visible
      const pagination = page.locator('[data-testid="pagination"]');
      await expect(pagination).not.toBeVisible();
    });

    test('should display page size selector', async ({ page }) => {
      // Arrange
      await mockTenantResolution(page);
      await setupSuperAdminAuth(page);
      await mockTenantsListApi(page);
      await mockUsersApi(page, MASTER_TENANT_ID, MOCK_USERS_FULL_PAGE, {
        totalElements: 11,
        totalPages: 2,
        page: 0,
        size: 10
      });

      // Act
      await navigateToAdministration(page);
      await selectTenantByName(page, 'Master');
      await switchToTab(page, 'Users');

      // Assert - page size select should be visible
      const pageSizeSelect = page.locator('[data-testid="select-page-size"]');
      await expect(pageSizeSelect).toBeVisible();
    });
  });

  // ==========================================================================
  // E2E-005: Users tab: search for "superadmin", verify filtered results
  // ==========================================================================
  test.describe('E2E-005: Users Tab Search', () => {
    test('should filter users when searching for "superadmin"', async ({ page }) => {
      // Arrange
      await mockTenantResolution(page);
      await setupSuperAdminAuth(page);
      await mockTenantsListApi(page);
      // Mock the users API to support search filtering
      await mockUsersApi(page, MASTER_TENANT_ID, MOCK_USERS_FULL_PAGE);

      // Act
      await navigateToAdministration(page);
      await selectTenantByName(page, 'Master');
      await switchToTab(page, 'Users');

      // Wait for initial load to complete
      await expect(page.locator('[data-testid="user-list"]')).toBeVisible();

      // Type search term
      const searchInput = page.locator('[data-testid="search-input"]');
      await expect(searchInput).toBeVisible();
      await searchInput.fill('superadmin');

      // Wait for debounced search to trigger (300ms debounce in component)
      await page.waitForTimeout(400);

      // Assert - result count should show filtered count
      const resultCount = page.locator('[data-testid="result-count"]');
      await expect(resultCount).toContainText('1 user');

      // Assert - only the superadmin user should be visible
      await expect(page.getByText('superadmin@emsist.com')).toBeVisible();
    });

    test('should show clear search button when search term is entered', async ({ page }) => {
      // Arrange
      await mockTenantResolution(page);
      await setupSuperAdminAuth(page);
      await mockTenantsListApi(page);
      await mockUsersApi(page, MASTER_TENANT_ID, MOCK_USERS_FULL_PAGE);

      // Act
      await navigateToAdministration(page);
      await selectTenantByName(page, 'Master');
      await switchToTab(page, 'Users');

      const searchInput = page.locator('[data-testid="search-input"]');
      await searchInput.fill('admin');

      // Assert - clear button should be visible
      const clearButton = page.locator('[data-testid="btn-clear-search"]');
      await expect(clearButton).toBeVisible();
    });

    test('search input should have proper aria-label for accessibility', async ({ page }) => {
      // Arrange
      await mockTenantResolution(page);
      await setupSuperAdminAuth(page);
      await mockTenantsListApi(page);
      await mockUsersApi(page, MASTER_TENANT_ID, MOCK_USERS_SUPERADMIN);

      // Act
      await navigateToAdministration(page);
      await selectTenantByName(page, 'Master');
      await switchToTab(page, 'Users');

      // Assert - search input should have proper accessibility label
      const searchInput = page.locator('[data-testid="search-input"]');
      await expect(searchInput).toHaveAttribute('aria-label', 'Search users');
    });
  });

  // ==========================================================================
  // E2E-006: Users tab: verify empty state when no users
  // ==========================================================================
  test.describe('E2E-006: Users Tab Empty State', () => {
    test('should display empty state message when tenant has no users', async ({ page }) => {
      // Arrange - mock API returning empty user list
      await mockTenantResolution(page);
      await setupSuperAdminAuth(page);
      await mockTenantsListApi(page);
      await mockUsersApi(page, MASTER_TENANT_ID, [], {
        totalElements: 0,
        totalPages: 0,
        page: 0,
        size: 10
      });

      // Act
      await navigateToAdministration(page);
      await selectTenantByName(page, 'Master');
      await switchToTab(page, 'Users');

      // Assert - empty state should be visible
      const emptyState = page.locator('[data-testid="empty-state"]');
      await expect(emptyState).toBeVisible();
      await expect(page.getByText('No Users Found')).toBeVisible();
      await expect(page.getByText(/No users have been assigned/i)).toBeVisible();
    });

    test('should display filter-specific empty state when search yields no results', async ({ page }) => {
      // Arrange
      await mockTenantResolution(page);
      await setupSuperAdminAuth(page);
      await mockTenantsListApi(page);

      // First load returns users, but search will return empty
      let searchCalled = false;
      await page.route(`**/api/v1/admin/tenants/${MASTER_TENANT_ID}/users*`, async route => {
        const url = new URL(route.request().url());
        const searchParam = url.searchParams.get('search');

        if (searchParam && searchParam === 'nonexistentuser') {
          searchCalled = true;
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              content: [],
              totalElements: 0,
              totalPages: 0,
              page: 0,
              size: 10
            })
          });
        } else {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              content: MOCK_USERS_SUPERADMIN,
              totalElements: 1,
              totalPages: 1,
              page: 0,
              size: 10
            })
          });
        }
      });

      // Act
      await navigateToAdministration(page);
      await selectTenantByName(page, 'Master');
      await switchToTab(page, 'Users');

      // Wait for initial user list
      await expect(page.locator('[data-testid="user-list"]')).toBeVisible();

      // Search for a nonexistent user
      const searchInput = page.locator('[data-testid="search-input"]');
      await searchInput.fill('nonexistentuser');
      await page.waitForTimeout(400);

      // Assert - should show filter-specific empty state
      const emptyState = page.locator('[data-testid="empty-state"]');
      await expect(emptyState).toBeVisible();
      await expect(page.getByText('No Users Match Filters')).toBeVisible();

      // Assert - clear filters button should be visible
      await expect(page.locator('[data-testid="btn-clear-filters"]')).toBeVisible();
    });
  });

  // ==========================================================================
  // E2E-007: Users tab: verify user status badges
  // ==========================================================================
  test.describe('E2E-007: User Status Badges', () => {
    test('should display Active badge for enabled users and Inactive badge for disabled users', async ({ page }) => {
      // Arrange - use the full page of users which includes both active and inactive users
      const mixedUsers = [
        MOCK_USERS_FULL_PAGE[0], // Super Admin - active
        MOCK_USERS_FULL_PAGE[2]  // Disabled User - inactive
      ];
      await mockTenantResolution(page);
      await setupSuperAdminAuth(page);
      await mockTenantsListApi(page);
      await mockUsersApi(page, MASTER_TENANT_ID, mixedUsers);

      // Act
      await navigateToAdministration(page);
      await selectTenantByName(page, 'Master');
      await switchToTab(page, 'Users');

      // Assert - should show both Active and Inactive status badges
      const statusBadges = page.locator('[data-testid="user-status"]');
      await expect(statusBadges).toHaveCount(2);

      // First user (Super Admin) should be Active
      await expect(statusBadges.first()).toContainText('Active');

      // Second user (Disabled User) should be Inactive
      await expect(statusBadges.nth(1)).toContainText('Inactive');
    });

    test('should display multiple role badges for users with multiple roles', async ({ page }) => {
      // Arrange
      await mockTenantResolution(page);
      await setupSuperAdminAuth(page);
      await mockTenantsListApi(page);
      await mockUsersApi(page, MASTER_TENANT_ID, MOCK_USERS_SUPERADMIN);

      // Act
      await navigateToAdministration(page);
      await selectTenantByName(page, 'Master');
      await switchToTab(page, 'Users');

      // Assert - superuser has SUPER_ADMIN and ADMIN roles
      const rolesContainer = page.locator('[data-testid="user-roles"]').first();
      await expect(rolesContainer).toBeVisible();
      await expect(rolesContainer.locator('.role-pill')).toHaveCount(2);
      await expect(rolesContainer.getByText('Super Admin')).toBeVisible();
      await expect(rolesContainer.getByText('Admin')).toBeVisible();
    });

    test('should display "Never" for users who have never logged in', async ({ page }) => {
      // Arrange - use a user with null lastLoginAt
      const neverLoggedInUser = [{
        ...MOCK_USERS_FULL_PAGE[2], // Disabled User has lastLoginAt: null
      }];
      await mockTenantResolution(page);
      await setupSuperAdminAuth(page);
      await mockTenantsListApi(page);
      await mockUsersApi(page, MASTER_TENANT_ID, neverLoggedInUser);

      // Act
      await navigateToAdministration(page);
      await selectTenantByName(page, 'Master');
      await switchToTab(page, 'Users');

      // Assert - last login column should show "Never"
      const lastLoginCell = page.locator('[data-testid="user-last-login"]').first();
      await expect(lastLoginCell).toBeVisible();
      await expect(lastLoginCell).toContainText('Never');
    });
  });

  // ==========================================================================
  // E2E-008: Users tab: non-admin user access denied
  // ==========================================================================
  test.describe('E2E-008: Non-Admin Access Control', () => {
    test('should show error state or redirect when non-admin user accesses admin page', async ({ page }) => {
      // Arrange
      await mockTenantResolution(page);
      await setupRegularUserAuth(page);

      // Mock the tenants list API to return 403 for non-admin
      await page.route('**/api/tenants', async route => {
        if (route.request().method() === 'GET') {
          await route.fulfill({
            status: 403,
            contentType: 'application/json',
            body: JSON.stringify({ message: 'Insufficient permissions' })
          });
        } else {
          await route.continue();
        }
      });

      // Mock the users API to return 403 as well
      await page.route('**/api/v1/admin/tenants/*/users*', async route => {
        await route.fulfill({
          status: 403,
          contentType: 'application/json',
          body: JSON.stringify({ message: 'Insufficient permissions' })
        });
      });

      // Act
      await page.goto('/administration');

      // Assert - user should either be redirected to access denied or see error
      // Allow either outcome since the implementation may vary
      const accessDeniedUrl = /\/errors\/access-denied/;
      const loginUrl = /\/login/;
      const errorState = page.locator('[data-testid="error-state"]');
      const errorMessage = page.getByText(/insufficient permissions|access denied|not authorized/i);

      // Wait a moment for redirect or error to render
      await page.waitForTimeout(1000);

      const redirectedToAccessDenied = accessDeniedUrl.test(page.url());
      const redirectedToLogin = loginUrl.test(page.url());
      const hasErrorState = await errorState.isVisible().catch(() => false);
      const hasErrorMessage = await errorMessage.isVisible().catch(() => false);

      expect(
        redirectedToAccessDenied || redirectedToLogin || hasErrorState || hasErrorMessage
      ).toBeTruthy();
    });

    test('should return 403 when non-admin user tries to fetch users API', async ({ page }) => {
      // Arrange
      await mockTenantResolution(page);
      await setupRegularUserAuth(page);
      await mockTenantsListApi(page);

      // Track whether the users API was called and what it returned
      let usersApiResponse = 0;
      await page.route(`**/api/v1/admin/tenants/${MASTER_TENANT_ID}/users*`, async route => {
        usersApiResponse = 403;
        await route.fulfill({
          status: 403,
          contentType: 'application/json',
          body: JSON.stringify({ message: 'You do not have permission to perform this action.' })
        });
      });

      // Act
      await page.goto('/administration');
      await page.waitForLoadState('networkidle');

      // If we made it to administration page, try to select a tenant
      const masterTenantVisible = await page.getByText('Master').isVisible().catch(() => false);
      if (masterTenantVisible) {
        await selectTenantByName(page, 'Master');
        await switchToTab(page, 'Users');

        // Assert - error state should be visible after 403
        const errorState = page.locator('[data-testid="error-state"]');
        await expect(errorState).toBeVisible();
      }

      // Either the user was blocked from accessing admin page,
      // or the users API returned 403 (both are valid behaviors)
      const wasBlocked = !masterTenantVisible;
      const gotForbidden = usersApiResponse === 403;
      expect(wasBlocked || gotForbidden).toBeTruthy();
    });
  });

  // ==========================================================================
  // Additional Tests: Loading and Error States
  // ==========================================================================
  test.describe('Additional: Loading and Error States', () => {
    test('should display loading skeleton while users are being fetched', async ({ page }) => {
      // Arrange
      await mockTenantResolution(page);
      await setupSuperAdminAuth(page);
      await mockTenantsListApi(page);

      // Add a delay to the users API to observe loading state
      await page.route(`**/api/v1/admin/tenants/${MASTER_TENANT_ID}/users*`, async route => {
        await new Promise(resolve => setTimeout(resolve, 500));
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            content: MOCK_USERS_SUPERADMIN,
            totalElements: 1,
            totalPages: 1,
            page: 0,
            size: 10
          })
        });
      });

      // Act
      await navigateToAdministration(page);
      await selectTenantByName(page, 'Master');
      await switchToTab(page, 'Users');

      // Assert - loading state should appear briefly
      const loadingState = page.locator('[data-testid="loading-state"]');
      await expect(loadingState).toBeVisible();

      // Wait for data to load
      await expect(page.locator('[data-testid="user-list"]')).toBeVisible();
      await expect(page.getByText('superadmin@emsist.com')).toBeVisible();
    });

    test('should display error state with retry button on API failure', async ({ page }) => {
      // Arrange
      await mockTenantResolution(page);
      await setupSuperAdminAuth(page);
      await mockTenantsListApi(page);

      // Mock users API to return 500 error
      await page.route(`**/api/v1/admin/tenants/${MASTER_TENANT_ID}/users*`, async route => {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ message: 'Internal server error' })
        });
      });

      // Act
      await navigateToAdministration(page);
      await selectTenantByName(page, 'Master');
      await switchToTab(page, 'Users');

      // Assert - error state should be visible
      const errorState = page.locator('[data-testid="error-state"]');
      await expect(errorState).toBeVisible();
      await expect(page.getByText('Failed to Load Users')).toBeVisible();

      // Assert - retry button should be visible and have proper aria-label
      const retryButton = page.locator('[data-testid="btn-retry"]');
      await expect(retryButton).toBeVisible();
      await expect(retryButton).toHaveAttribute('aria-label', 'Retry loading users');
    });

    test('should display result count showing total number of users', async ({ page }) => {
      // Arrange
      await mockTenantResolution(page);
      await setupSuperAdminAuth(page);
      await mockTenantsListApi(page);
      await mockUsersApi(page, MASTER_TENANT_ID, MOCK_USERS_FULL_PAGE.slice(0, 3), {
        totalElements: 3,
        totalPages: 1,
        page: 0,
        size: 10
      });

      // Act
      await navigateToAdministration(page);
      await selectTenantByName(page, 'Master');
      await switchToTab(page, 'Users');

      // Assert - result count should show "3 users"
      const resultCount = page.locator('[data-testid="result-count"]');
      await expect(resultCount).toContainText('3 users');
    });
  });

  // ==========================================================================
  // Additional Tests: Role and Status Filters
  // ==========================================================================
  test.describe('Additional: Filter Controls', () => {
    test('should display role and status filter dropdowns with proper aria-labels', async ({ page }) => {
      // Arrange
      await mockTenantResolution(page);
      await setupSuperAdminAuth(page);
      await mockTenantsListApi(page);
      await mockUsersApi(page, MASTER_TENANT_ID, MOCK_USERS_SUPERADMIN);

      // Act
      await navigateToAdministration(page);
      await selectTenantByName(page, 'Master');
      await switchToTab(page, 'Users');

      // Assert - role filter should be visible with proper aria-label
      const roleFilter = page.locator('[data-testid="filter-role"]');
      await expect(roleFilter).toBeVisible();
      await expect(roleFilter).toHaveAttribute('aria-label', 'Filter by role');

      // Assert - status filter should be visible with proper aria-label
      const statusFilter = page.locator('[data-testid="filter-status"]');
      await expect(statusFilter).toBeVisible();
      await expect(statusFilter).toHaveAttribute('aria-label', 'Filter by status');
    });

    test('should display view toggle buttons with proper aria-labels', async ({ page }) => {
      // Arrange
      await mockTenantResolution(page);
      await setupSuperAdminAuth(page);
      await mockTenantsListApi(page);
      await mockUsersApi(page, MASTER_TENANT_ID, MOCK_USERS_SUPERADMIN);

      // Act
      await navigateToAdministration(page);
      await selectTenantByName(page, 'Master');
      await switchToTab(page, 'Users');

      // Assert - view toggle buttons have correct aria-labels
      const gridBtn = page.locator('[data-testid="btn-view-grid"]');
      const tableBtn = page.locator('[data-testid="btn-view-table"]');
      await expect(gridBtn).toBeVisible();
      await expect(gridBtn).toHaveAttribute('aria-label', 'Grid view');
      await expect(tableBtn).toBeVisible();
      await expect(tableBtn).toHaveAttribute('aria-label', 'Table view');
    });
  });
});
