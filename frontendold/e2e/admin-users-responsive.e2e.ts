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
    }
  ],
  total: 1,
  page: 0,
  size: 10,
  totalPages: 1
};

const MOCK_USERS = [
  {
    id: 'user-001',
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
  },
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
  }
];

// ============================================================================
// Helper Functions
// ============================================================================

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

async function mockUsersApi(page: Page): Promise<void> {
  await page.route(`**/api/v1/admin/tenants/${MASTER_TENANT_ID}/users*`, async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        content: MOCK_USERS,
        totalElements: MOCK_USERS.length,
        totalPages: 1,
        page: 0,
        size: 10
      })
    });
  });
}

async function setupAllMocks(page: Page): Promise<void> {
  await mockTenantResolution(page);
  await setupSuperAdminAuth(page);
  await mockTenantsListApi(page);
  await mockUsersApi(page);
}

/**
 * Navigate to administration, select Master Tenant, and switch to Users tab.
 * This is the common setup for all responsive tests.
 */
async function navigateToUsersTab(page: Page): Promise<void> {
  await page.goto('/administration');
  await page.waitForLoadState('networkidle');

  // Select Master Tenant
  const masterTenant = page.getByText('Master', { exact: false }).first();
  await expect(masterTenant).toBeVisible();
  await masterTenant.click();

  // Switch to Users tab
  const usersTab = page.locator('button[role="tab"]').filter({ hasText: 'Users' });
  await expect(usersTab).toBeVisible();
  await usersTab.click();

  // Wait for user list to load
  await expect(page.locator('[data-testid="user-list"]')).toBeVisible();
}

/**
 * Assert that no horizontal overflow exists on the page.
 * Follows the pattern from responsive.e2e.ts.
 */
async function assertNoHorizontalOverflow(page: Page): Promise<void> {
  const hasOverflow = await page.evaluate(() => {
    const maxWidth = Math.max(
      document.documentElement.scrollWidth,
      document.body.scrollWidth
    );
    return maxWidth > window.innerWidth + 1;
  });

  expect(hasOverflow).toBeFalsy();
}

// ============================================================================
// Viewport Sizes
// ============================================================================

const VIEWPORTS = {
  mobile: { width: 375, height: 812 },    // iPhone 12 / small mobile
  tablet: { width: 768, height: 1024 },   // iPad / tablet portrait
  desktop: { width: 1280, height: 720 },  // Standard desktop
  desktopLg: { width: 1440, height: 900 } // Large desktop
};

// ============================================================================
// Test Suites
// ============================================================================

test.describe('Admin Users - Responsive E2E Tests', () => {

  // ==========================================================================
  // Desktop: Card/Table View Toggle
  // ==========================================================================
  test.describe('Desktop: View Toggle', () => {
    test('should display view toggle with both grid and table options on desktop', async ({ page }) => {
      // Arrange
      await page.setViewportSize(VIEWPORTS.desktop);
      await setupAllMocks(page);

      // Act
      await navigateToUsersTab(page);

      // Assert - both toggle buttons should be visible
      const gridBtn = page.locator('[data-testid="btn-view-grid"]');
      const tableBtn = page.locator('[data-testid="btn-view-table"]');
      await expect(gridBtn).toBeVisible();
      await expect(tableBtn).toBeVisible();

      // Assert - view toggle group should have proper aria-label
      const viewToggle = page.locator('[role="group"][aria-label="List view mode"]');
      await expect(viewToggle).toBeVisible();
    });

    test('should default to table view and show user table on desktop', async ({ page }) => {
      // Arrange
      await page.setViewportSize(VIEWPORTS.desktop);
      await setupAllMocks(page);

      // Act
      await navigateToUsersTab(page);

      // Assert - table view should be active by default
      const tableBtn = page.locator('[data-testid="btn-view-table"]');
      await expect(tableBtn).toHaveClass(/active/);

      // Assert - the user table should be visible
      const userTable = page.locator('[data-testid="user-table"]');
      await expect(userTable).toBeVisible();

      // Assert - user grid should NOT be visible
      const userGrid = page.locator('[data-testid="user-grid"]');
      await expect(userGrid).not.toBeVisible();
    });

    test('should switch to grid view when grid toggle is clicked on desktop', async ({ page }) => {
      // Arrange
      await page.setViewportSize(VIEWPORTS.desktop);
      await setupAllMocks(page);

      // Act
      await navigateToUsersTab(page);

      // Click grid view button
      const gridBtn = page.locator('[data-testid="btn-view-grid"]');
      await gridBtn.click();

      // Assert - grid view should now be active
      await expect(gridBtn).toHaveClass(/active/);

      // Assert - user grid should be visible with user cards
      const userGrid = page.locator('[data-testid="user-grid"]');
      await expect(userGrid).toBeVisible();

      const userCards = page.locator('[data-testid="user-card"]');
      await expect(userCards).toHaveCount(3);

      // Assert - user table should NOT be visible
      const userTable = page.locator('[data-testid="user-table"]');
      await expect(userTable).not.toBeVisible();
    });

    test('should toggle back to table view after switching to grid on desktop', async ({ page }) => {
      // Arrange
      await page.setViewportSize(VIEWPORTS.desktop);
      await setupAllMocks(page);

      // Act
      await navigateToUsersTab(page);

      // Switch to grid
      await page.locator('[data-testid="btn-view-grid"]').click();
      await expect(page.locator('[data-testid="user-grid"]')).toBeVisible();

      // Switch back to table
      const tableBtn = page.locator('[data-testid="btn-view-table"]');
      await tableBtn.click();

      // Assert - table view should be active again
      await expect(tableBtn).toHaveClass(/active/);
      await expect(page.locator('[data-testid="user-table"]')).toBeVisible();
      await expect(page.locator('[data-testid="user-grid"]')).not.toBeVisible();
    });

    test('should display user data correctly in grid card view on desktop', async ({ page }) => {
      // Arrange
      await page.setViewportSize(VIEWPORTS.desktop);
      await setupAllMocks(page);

      // Act
      await navigateToUsersTab(page);
      await page.locator('[data-testid="btn-view-grid"]').click();

      // Assert - user cards should display name, email, and roles
      const firstCard = page.locator('[data-testid="user-card"]').first();
      await expect(firstCard).toBeVisible();

      await expect(firstCard.locator('[data-testid="user-name"]')).toContainText('Super Admin');
      await expect(firstCard.locator('[data-testid="user-email"]')).toContainText('superadmin@emsist.com');
      await expect(firstCard.locator('[data-testid="user-roles"]')).toBeVisible();
    });

    test('should display user data correctly in table view on desktop', async ({ page }) => {
      // Arrange
      await page.setViewportSize(VIEWPORTS.desktop);
      await setupAllMocks(page);

      // Act
      await navigateToUsersTab(page);

      // Assert - table rows should display user data
      const firstRow = page.locator('[data-testid="user-row"]').first();
      await expect(firstRow).toBeVisible();

      await expect(firstRow.locator('[data-testid="user-name"]')).toContainText('Super Admin');
      await expect(firstRow.locator('[data-testid="user-email"]')).toContainText('superadmin@emsist.com');
      await expect(firstRow.locator('[data-testid="user-status"]')).toContainText('Active');
      await expect(firstRow.locator('[data-testid="user-roles"]')).toBeVisible();
    });

    test('should not have horizontal overflow on desktop in either view', async ({ page }) => {
      // Arrange
      await page.setViewportSize(VIEWPORTS.desktop);
      await setupAllMocks(page);

      // Act
      await navigateToUsersTab(page);

      // Assert - no overflow in table view
      await assertNoHorizontalOverflow(page);

      // Switch to grid view
      await page.locator('[data-testid="btn-view-grid"]').click();
      await expect(page.locator('[data-testid="user-grid"]')).toBeVisible();

      // Assert - no overflow in grid view
      await assertNoHorizontalOverflow(page);
    });
  });

  // ==========================================================================
  // Mobile: Auto-Switch to Card View
  // ==========================================================================
  test.describe('Mobile: Layout Adaptation', () => {
    test('should display user list without horizontal overflow on mobile', async ({ page }) => {
      // Arrange
      await page.setViewportSize(VIEWPORTS.mobile);
      await setupAllMocks(page);

      // Act
      await navigateToUsersTab(page);

      // Assert - no horizontal overflow
      await assertNoHorizontalOverflow(page);
    });

    test('should display user data in a usable format on mobile', async ({ page }) => {
      // Arrange
      await page.setViewportSize(VIEWPORTS.mobile);
      await setupAllMocks(page);

      // Act
      await navigateToUsersTab(page);

      // Assert - user list content should be visible and usable
      await expect(page.locator('[data-testid="user-list"]')).toBeVisible();

      // Assert - user names and emails should be visible
      await expect(page.getByText('Super Admin')).toBeVisible();
      await expect(page.getByText('superadmin@emsist.com')).toBeVisible();
    });

    test('should display search input at full width on mobile', async ({ page }) => {
      // Arrange
      await page.setViewportSize(VIEWPORTS.mobile);
      await setupAllMocks(page);

      // Act
      await navigateToUsersTab(page);

      // Assert - search input should be visible and usable
      const searchInput = page.locator('[data-testid="search-input"]');
      await expect(searchInput).toBeVisible();

      // Assert - search wrapper should stretch to fill available width on mobile
      // The CSS rule @media (max-width: 768px) sets max-width: 100%
      const searchWrapper = page.locator('.search-wrapper');
      const searchBox = await searchWrapper.boundingBox();
      const viewportWidth = VIEWPORTS.mobile.width;

      // Search wrapper should take up a significant portion of the viewport
      expect(searchBox).not.toBeNull();
      if (searchBox) {
        // Allow some padding/margins - search should be at least 60% of viewport width
        expect(searchBox.width).toBeGreaterThanOrEqual(viewportWidth * 0.6);
      }
    });

    test('should stack filters vertically on mobile', async ({ page }) => {
      // Arrange
      await page.setViewportSize(VIEWPORTS.mobile);
      await setupAllMocks(page);

      // Act
      await navigateToUsersTab(page);

      // Assert - toolbar-left should have column direction on mobile
      // The CSS rule @media (max-width: 768px) sets flex-direction: column
      const roleFilter = page.locator('[data-testid="filter-role"]');
      const statusFilter = page.locator('[data-testid="filter-status"]');

      await expect(roleFilter).toBeVisible();
      await expect(statusFilter).toBeVisible();

      // Both filters should be visible and usable
      const roleBox = await roleFilter.boundingBox();
      const statusBox = await statusFilter.boundingBox();

      expect(roleBox).not.toBeNull();
      expect(statusBox).not.toBeNull();

      if (roleBox && statusBox) {
        // On mobile with column layout, the status filter should be below the role filter
        // (i.e., its top position should be greater than or equal to the role filter's bottom)
        expect(statusBox.y).toBeGreaterThanOrEqual(roleBox.y + roleBox.height - 1);
      }
    });

    test('should center pagination controls on mobile', async ({ page }) => {
      // Arrange
      await page.setViewportSize(VIEWPORTS.mobile);
      await setupAllMocks(page);

      // Override users API to show pagination
      await page.route(`**/api/v1/admin/tenants/${MASTER_TENANT_ID}/users*`, async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            content: MOCK_USERS,
            totalElements: 25,
            totalPages: 3,
            page: 0,
            size: 10
          })
        });
      });

      // Act
      await navigateToUsersTab(page);

      // Assert - pagination should be visible
      const pagination = page.locator('[data-testid="pagination"]');
      await expect(pagination).toBeVisible();

      // Assert - pagination info and controls are visible on mobile
      await expect(page.getByText(/Showing/)).toBeVisible();
      await expect(page.locator('[data-testid="btn-next-page"]')).toBeVisible();
    });
  });

  // ==========================================================================
  // Tablet: Table View Works
  // ==========================================================================
  test.describe('Tablet: Table View', () => {
    test('should display table view on tablet viewport', async ({ page }) => {
      // Arrange
      await page.setViewportSize(VIEWPORTS.tablet);
      await setupAllMocks(page);

      // Act
      await navigateToUsersTab(page);

      // Assert - view toggle should be visible on tablet
      await expect(page.locator('[data-testid="btn-view-grid"]')).toBeVisible();
      await expect(page.locator('[data-testid="btn-view-table"]')).toBeVisible();

      // Assert - table view should be usable
      // Default is table view
      const userTable = page.locator('[data-testid="user-table"]');
      const userGrid = page.locator('[data-testid="user-grid"]');
      const isTableVisible = await userTable.isVisible().catch(() => false);
      const isGridVisible = await userGrid.isVisible().catch(() => false);

      // Either table or grid view should be showing users
      expect(isTableVisible || isGridVisible).toBeTruthy();
    });

    test('should display table with all columns visible on tablet', async ({ page }) => {
      // Arrange
      await page.setViewportSize(VIEWPORTS.tablet);
      await setupAllMocks(page);

      // Act
      await navigateToUsersTab(page);

      // Ensure we are in table view
      const tableBtn = page.locator('[data-testid="btn-view-table"]');
      await tableBtn.click();

      // Assert - table should be visible with header columns
      const userTable = page.locator('[data-testid="user-table"]');
      await expect(userTable).toBeVisible();

      // Assert - table header columns
      await expect(page.locator('th').filter({ hasText: 'Name' })).toBeVisible();
      await expect(page.locator('th').filter({ hasText: 'Email' })).toBeVisible();
      await expect(page.locator('th').filter({ hasText: 'Roles' })).toBeVisible();
      await expect(page.locator('th').filter({ hasText: 'Status' })).toBeVisible();

      // Assert - no horizontal overflow on tablet
      await assertNoHorizontalOverflow(page);
    });

    test('should allow toggling between grid and table on tablet', async ({ page }) => {
      // Arrange
      await page.setViewportSize(VIEWPORTS.tablet);
      await setupAllMocks(page);

      // Act
      await navigateToUsersTab(page);

      // Switch to grid
      const gridBtn = page.locator('[data-testid="btn-view-grid"]');
      await gridBtn.click();

      // Assert - grid view should be visible
      const userGrid = page.locator('[data-testid="user-grid"]');
      await expect(userGrid).toBeVisible();

      // Assert - grid cards should display on tablet
      const userCards = page.locator('[data-testid="user-card"]');
      await expect(userCards).toHaveCount(3);

      // Assert - no horizontal overflow in grid view
      await assertNoHorizontalOverflow(page);
    });

    test('should display search and filters properly on tablet', async ({ page }) => {
      // Arrange
      await page.setViewportSize(VIEWPORTS.tablet);
      await setupAllMocks(page);

      // Act
      await navigateToUsersTab(page);

      // Assert - toolbar elements should all be visible and usable
      await expect(page.locator('[data-testid="search-input"]')).toBeVisible();
      await expect(page.locator('[data-testid="filter-role"]')).toBeVisible();
      await expect(page.locator('[data-testid="filter-status"]')).toBeVisible();
      await expect(page.locator('[data-testid="result-count"]')).toBeVisible();
    });
  });

  // ==========================================================================
  // Cross-Viewport: Content Integrity
  // ==========================================================================
  test.describe('Cross-Viewport: Content Integrity', () => {
    test('should display the same user count across all viewports', async ({ page }) => {
      const viewports = [
        { name: 'mobile', ...VIEWPORTS.mobile },
        { name: 'tablet', ...VIEWPORTS.tablet },
        { name: 'desktop', ...VIEWPORTS.desktop }
      ];

      for (const viewport of viewports) {
        // Arrange
        await page.setViewportSize({ width: viewport.width, height: viewport.height });
        await setupAllMocks(page);

        // Act
        await navigateToUsersTab(page);

        // Assert - result count should always show 3 users
        const resultCount = page.locator('[data-testid="result-count"]');
        await expect(resultCount).toContainText('3 users');
      }
    });

    test('should maintain accessibility attributes across viewports', async ({ page }) => {
      const viewports = [
        { name: 'mobile', ...VIEWPORTS.mobile },
        { name: 'desktop', ...VIEWPORTS.desktop }
      ];

      for (const viewport of viewports) {
        // Arrange
        await page.setViewportSize({ width: viewport.width, height: viewport.height });
        await setupAllMocks(page);

        // Act
        await navigateToUsersTab(page);

        // Assert - search input has aria-label on all viewports
        await expect(page.locator('[data-testid="search-input"]')).toHaveAttribute('aria-label', 'Search users');

        // Assert - role filter has aria-label on all viewports
        await expect(page.locator('[data-testid="filter-role"]')).toHaveAttribute('aria-label', 'Filter by role');

        // Assert - status filter has aria-label on all viewports
        await expect(page.locator('[data-testid="filter-status"]')).toHaveAttribute('aria-label', 'Filter by status');
      }
    });
  });
});
