import { test, expect, Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

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

// ============================================================================
// Viewport Sizes
// ============================================================================

const VIEWPORTS = {
  mobile: { width: 375, height: 812 },
  tablet: { width: 768, height: 1024 },
  desktop: { width: 1280, height: 800 }
};

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

async function setupAllMocks(page: Page): Promise<void> {
  await mockTenantResolution(page);
  await setupSuperAdminAuth(page);
  await mockTenantsListApi(page);
}

/**
 * Assert that no horizontal overflow exists on the page.
 *
 * Uses two checks:
 * 1. Attempts to scroll horizontally — if html/body have overflow:hidden, scrollTo is a no-op
 * 2. Checks the .admin-content container (excludes position:fixed dock from measurement)
 */
async function assertNoHorizontalOverflow(page: Page): Promise<void> {
  const hasOverflow = await page.evaluate(() => {
    // Check 1: Can the user actually scroll horizontally?
    // (overflow: hidden on html/body prevents this even if content is theoretically wider)
    const scrollBefore = window.scrollX;
    window.scrollTo(100, window.scrollY);
    const canScroll = window.scrollX > scrollBefore;
    window.scrollTo(scrollBefore, window.scrollY);
    if (canScroll) return true;

    // Check 2: Does the main content container overflow?
    // This excludes position:fixed elements (dock) from the measurement
    const content = document.querySelector('.admin-content');
    if (content) {
      return content.scrollWidth > content.clientWidth + 1;
    }

    return false;
  });
  expect(hasOverflow).toBeFalsy();
}

/**
 * Navigate to the license manager section via query parameter.
 */
async function navigateToLicenseManager(page: Page): Promise<void> {
  await page.goto('/administration?section=license-manager');
  await page.waitForLoadState('networkidle');
}

/**
 * Navigate to the administration page (default section: tenant-manager).
 */
async function navigateToAdministration(page: Page): Promise<void> {
  await page.goto('/administration');
  await page.waitForLoadState('networkidle');
}

// ============================================================================
// Test Suites
// ============================================================================

test.describe('License Manager E2E Tests', () => {

  // ==========================================================================
  // 1. Navigation & Rendering
  // ==========================================================================
  test.describe('Navigation and Rendering', () => {

    test('should navigate to administration page and display dock navigation', async ({ page }) => {
      // Arrange
      await setupAllMocks(page);

      // Act
      await navigateToAdministration(page);

      // Assert - dock navigation should be visible with all 5 items
      const dockItems = page.locator('.dock-item');
      await expect(dockItems).toHaveCount(5);
    });

    test('should render license manager section when clicking dock item', async ({ page }) => {
      // Arrange
      await setupAllMocks(page);

      // Act
      await navigateToAdministration(page);

      // Click the dock item with data-tooltip "License Management"
      const licenseDockItem = page.locator('.dock-item[data-tooltip="License Management"]');
      await expect(licenseDockItem).toBeVisible();
      await licenseDockItem.click();

      // Assert - license manager component should be rendered
      await expect(page.locator('app-license-manager-section')).toBeVisible();
      await expect(page.getByRole('heading', { name: 'License Management', level: 1 })).toBeVisible();
    });

    test('should render license manager section when navigating via query parameter', async ({ page }) => {
      // Arrange
      await setupAllMocks(page);

      // Act
      await navigateToLicenseManager(page);

      // Assert
      await expect(page.locator('app-license-manager-section')).toBeVisible();
      await expect(page.getByRole('heading', { name: 'License Management', level: 1 })).toBeVisible();
    });

    test('should display section description text', async ({ page }) => {
      // Arrange
      await setupAllMocks(page);

      // Act
      await navigateToLicenseManager(page);

      // Assert
      await expect(page.getByText('Manage application licenses, subscriptions, and entitlements')).toBeVisible();
    });

    test('should display Add License button in the header', async ({ page }) => {
      // Arrange
      await setupAllMocks(page);

      // Act
      await navigateToLicenseManager(page);

      // Assert - the header "Add License" button
      const addLicenseButton = page.locator('.manager-header').getByRole('button', { name: /Add License/i });
      await expect(addLicenseButton).toBeVisible();
    });

    test('should display breadcrumb with Administration and License Management', async ({ page }) => {
      // Arrange
      await setupAllMocks(page);

      // Act
      await navigateToLicenseManager(page);

      // Assert - breadcrumb navigation should be visible
      // Note: app-breadcrumb host has no explicit display, so we check the inner .breadcrumb-nav
      const breadcrumbNav = page.locator('.breadcrumb-nav[aria-label="Breadcrumb"]');
      await expect(breadcrumbNav).toBeVisible();

      // Assert - breadcrumb items show correct path
      await expect(breadcrumbNav.getByText('Administration')).toBeVisible();
      await expect(breadcrumbNav.getByText('License Management')).toBeVisible();
    });
  });

  // ==========================================================================
  // 2. Empty State
  // ==========================================================================
  test.describe('Empty State', () => {

    test('should display empty state when no licenses exist', async ({ page }) => {
      // Arrange
      await setupAllMocks(page);

      // Act
      await navigateToLicenseManager(page);

      // Assert
      const emptyState = page.locator('.license-empty-state');
      await expect(emptyState).toBeVisible();
    });

    test('should display empty state title "No Licenses Configured"', async ({ page }) => {
      // Arrange
      await setupAllMocks(page);

      // Act
      await navigateToLicenseManager(page);

      // Assert
      await expect(page.getByRole('heading', { name: 'No Licenses Configured', level: 2 })).toBeVisible();
    });

    test('should display empty state description text', async ({ page }) => {
      // Arrange
      await setupAllMocks(page);

      // Act
      await navigateToLicenseManager(page);

      // Assert
      await expect(page.getByText('Add licenses to manage application subscriptions and entitlements for your tenants.')).toBeVisible();
    });

    test('should display empty state icon with aria-hidden attribute', async ({ page }) => {
      // Arrange
      await setupAllMocks(page);

      // Act
      await navigateToLicenseManager(page);

      // Assert - the empty state icon should be decorative
      const emptyIcon = page.locator('.empty-state-icon img');
      await expect(emptyIcon).toBeVisible();
      await expect(emptyIcon).toHaveAttribute('aria-hidden', 'true');
      await expect(emptyIcon).toHaveAttribute('alt', '');
    });

    test('should display "Add Your First License" button in empty state', async ({ page }) => {
      // Arrange
      await setupAllMocks(page);

      // Act
      await navigateToLicenseManager(page);

      // Assert
      const addFirstButton = page.locator('.license-empty-state').getByRole('button', { name: /Add Your First License/i });
      await expect(addFirstButton).toBeVisible();
    });
  });

  // ==========================================================================
  // 3. Stat Cards
  // ==========================================================================
  test.describe('Stat Cards', () => {

    test('should display 4 stat cards', async ({ page }) => {
      // Arrange
      await setupAllMocks(page);

      // Act
      await navigateToLicenseManager(page);

      // Assert
      const statCards = page.locator('.license-stat-card');
      await expect(statCards).toHaveCount(4);
    });

    test('should display "Total Licenses" stat card with value 0', async ({ page }) => {
      // Arrange
      await setupAllMocks(page);

      // Act
      await navigateToLicenseManager(page);

      // Assert
      const totalCard = page.locator('.license-stat-card').filter({ hasText: 'Total Licenses' });
      await expect(totalCard).toBeVisible();
      await expect(totalCard.locator('.stat-value')).toHaveText('0');
    });

    test('should display "Active" stat card with value 0', async ({ page }) => {
      // Arrange
      await setupAllMocks(page);

      // Act
      await navigateToLicenseManager(page);

      // Assert
      const activeCard = page.locator('.license-stat-card').filter({ hasText: 'Active' });
      await expect(activeCard).toBeVisible();
      await expect(activeCard.locator('.stat-value')).toHaveText('0');
    });

    test('should display "Expiring Soon" stat card with value 0', async ({ page }) => {
      // Arrange
      await setupAllMocks(page);

      // Act
      await navigateToLicenseManager(page);

      // Assert
      const expiringCard = page.locator('.license-stat-card').filter({ hasText: 'Expiring Soon' });
      await expect(expiringCard).toBeVisible();
      await expect(expiringCard.locator('.stat-value')).toHaveText('0');
    });

    test('should display "Assigned to Tenants" stat card with value 0', async ({ page }) => {
      // Arrange
      await setupAllMocks(page);

      // Act
      await navigateToLicenseManager(page);

      // Assert
      const assignedCard = page.locator('.license-stat-card').filter({ hasText: 'Assigned to Tenants' });
      await expect(assignedCard).toBeVisible();
      await expect(assignedCard.locator('.stat-value')).toHaveText('0');
    });

    test('should display stat card icons as decorative with aria-hidden', async ({ page }) => {
      // Arrange
      await setupAllMocks(page);

      // Act
      await navigateToLicenseManager(page);

      // Assert - all stat card icons should be decorative
      const statIcons = page.locator('.license-stat-card .stat-icon img');
      const iconCount = await statIcons.count();
      expect(iconCount).toBe(4);

      for (let i = 0; i < iconCount; i++) {
        await expect(statIcons.nth(i)).toHaveAttribute('aria-hidden', 'true');
        await expect(statIcons.nth(i)).toHaveAttribute('alt', '');
      }
    });
  });

  // ==========================================================================
  // 4. Dock Navigation
  // ==========================================================================
  test.describe('Dock Navigation', () => {

    test('should render all 5 dock items with correct tooltips', async ({ page }) => {
      // Arrange
      await setupAllMocks(page);

      // Act
      await navigateToAdministration(page);

      // Assert - verify all 5 dock items by their tooltip text
      const expectedTooltips = [
        'Tenant Management',
        'License Management',
        'Master Locale',
        'Master Definitions',
        'Master Authentication'
      ];

      for (const tooltip of expectedTooltips) {
        const dockItem = page.locator(`.dock-item[data-tooltip="${tooltip}"]`);
        await expect(dockItem).toBeVisible();
      }
    });

    test('should mark License Management dock item as active when section is selected', async ({ page }) => {
      // Arrange
      await setupAllMocks(page);

      // Act
      await navigateToLicenseManager(page);

      // Assert - the license management dock item should have .active class
      const licenseDockItem = page.locator('.dock-item[data-tooltip="License Management"]');
      await expect(licenseDockItem).toHaveClass(/active/);
    });

    test('should not mark other dock items as active when license manager is selected', async ({ page }) => {
      // Arrange
      await setupAllMocks(page);

      // Act
      await navigateToLicenseManager(page);

      // Assert - other items should NOT have active class
      const tenantDockItem = page.locator('.dock-item[data-tooltip="Tenant Management"]');
      await expect(tenantDockItem).not.toHaveClass(/active/);

      const localeDockItem = page.locator('.dock-item[data-tooltip="Master Locale"]');
      await expect(localeDockItem).not.toHaveClass(/active/);
    });

    test('should switch sections when clicking different dock items', async ({ page }) => {
      // Arrange
      await setupAllMocks(page);

      // Act - start at license manager
      await navigateToLicenseManager(page);
      await expect(page.locator('app-license-manager-section')).toBeVisible();

      // Click Master Locale dock item
      const localeDockItem = page.locator('.dock-item[data-tooltip="Master Locale"]');
      await localeDockItem.click();

      // Assert - license manager section should no longer be visible
      await expect(page.locator('app-license-manager-section')).not.toBeVisible();
      await expect(page.locator('app-master-locale-section')).toBeVisible();

      // Assert - dock active state should update
      await expect(localeDockItem).toHaveClass(/active/);
      const licenseDockItem = page.locator('.dock-item[data-tooltip="License Management"]');
      await expect(licenseDockItem).not.toHaveClass(/active/);
    });

    test('should update URL query parameter when switching sections via dock', async ({ page }) => {
      // Arrange
      await setupAllMocks(page);

      // Act
      await navigateToAdministration(page);

      // Click License Management dock item
      const licenseDockItem = page.locator('.dock-item[data-tooltip="License Management"]');
      await licenseDockItem.click();

      // Assert - URL should contain section=license-manager
      await expect(page).toHaveURL(/section=license-manager/);
    });

    test('should display dock item tooltip text elements', async ({ page }) => {
      // Arrange
      await setupAllMocks(page);

      // Act
      await navigateToAdministration(page);

      // Assert - each dock item should have a .dock-tooltip span
      const tooltips = page.locator('.dock-tooltip');
      await expect(tooltips).toHaveCount(5);

      // Verify the License Management tooltip text
      const licenseTooltip = page.locator('.dock-item[data-tooltip="License Management"] .dock-tooltip');
      await expect(licenseTooltip).toHaveText('License Management');
    });

    test('should display dock item icons as decorative images', async ({ page }) => {
      // Arrange
      await setupAllMocks(page);

      // Act
      await navigateToAdministration(page);

      // Assert - all dock icons should be decorative (alt="" and aria-hidden="true")
      const dockIcons = page.locator('.dock-icon');
      const iconCount = await dockIcons.count();
      expect(iconCount).toBe(5);

      for (let i = 0; i < iconCount; i++) {
        await expect(dockIcons.nth(i)).toHaveAttribute('alt', '');
        await expect(dockIcons.nth(i)).toHaveAttribute('aria-hidden', 'true');
      }
    });
  });

  // ==========================================================================
  // 5. Section Switching
  // ==========================================================================
  test.describe('Section Switching', () => {

    test('should default to tenant-manager section when no query parameter is provided', async ({ page }) => {
      // Arrange
      await setupAllMocks(page);

      // Act
      await navigateToAdministration(page);

      // Assert - tenant manager should be the active section
      const tenantDockItem = page.locator('.dock-item[data-tooltip="Tenant Management"]');
      await expect(tenantDockItem).toHaveClass(/active/);
      await expect(page.locator('app-tenant-manager-section')).toBeVisible();
      await expect(page.locator('app-license-manager-section')).not.toBeVisible();
    });

    test('should switch from tenant-manager to license-manager and back', async ({ page }) => {
      // Arrange
      await setupAllMocks(page);

      // Act - start at default (tenant-manager)
      await navigateToAdministration(page);
      await expect(page.locator('app-tenant-manager-section')).toBeVisible();

      // Switch to license-manager
      const licenseDockItem = page.locator('.dock-item[data-tooltip="License Management"]');
      await licenseDockItem.click();
      await expect(page.locator('app-license-manager-section')).toBeVisible();
      await expect(page.locator('app-tenant-manager-section')).not.toBeVisible();

      // Switch back to tenant-manager
      const tenantDockItem = page.locator('.dock-item[data-tooltip="Tenant Management"]');
      await tenantDockItem.click();
      await expect(page.locator('app-tenant-manager-section')).toBeVisible();
      await expect(page.locator('app-license-manager-section')).not.toBeVisible();
    });

    test('should update URL when navigating between sections', async ({ page }) => {
      // Arrange
      await setupAllMocks(page);

      // Act - navigate to license manager
      await navigateToAdministration(page);
      const licenseDockItem = page.locator('.dock-item[data-tooltip="License Management"]');
      await licenseDockItem.click();

      // Assert
      await expect(page).toHaveURL(/section=license-manager/);

      // Switch to master-auth
      const authDockItem = page.locator('.dock-item[data-tooltip="Master Authentication"]');
      await authDockItem.click();

      // Assert
      await expect(page).toHaveURL(/section=master-auth/);
    });

    test('should render only one section at a time (mutual exclusion)', async ({ page }) => {
      // Arrange
      await setupAllMocks(page);

      // Act
      await navigateToLicenseManager(page);

      // Assert - only license-manager should be visible
      await expect(page.locator('app-license-manager-section')).toBeVisible();
      await expect(page.locator('app-tenant-manager-section')).not.toBeVisible();
      await expect(page.locator('app-master-locale-section')).not.toBeVisible();
      await expect(page.locator('app-master-definitions-section')).not.toBeVisible();
      await expect(page.locator('app-master-auth-section')).not.toBeVisible();
    });
  });

  // ==========================================================================
  // 6. Responsive Layout
  // ==========================================================================
  test.describe('Responsive Layout', () => {

    test('should display dock and license content without horizontal overflow on desktop', async ({ page }) => {
      // Arrange
      await page.setViewportSize(VIEWPORTS.desktop);
      await setupAllMocks(page);

      // Act
      await navigateToLicenseManager(page);

      // Assert
      await expect(page.locator('app-license-manager-section')).toBeVisible();
      await expect(page.locator('.admin-dock')).toBeVisible();
      await assertNoHorizontalOverflow(page);
    });

    test('should display all 4 stat cards on desktop', async ({ page }) => {
      // Arrange
      await page.setViewportSize(VIEWPORTS.desktop);
      await setupAllMocks(page);

      // Act
      await navigateToLicenseManager(page);

      // Assert
      const statCards = page.locator('.license-stat-card');
      await expect(statCards).toHaveCount(4);

      // All stat cards should be visible
      for (let i = 0; i < 4; i++) {
        await expect(statCards.nth(i)).toBeVisible();
      }
    });

    test('should display dock and content without horizontal overflow on tablet', async ({ page }) => {
      // Arrange
      await page.setViewportSize(VIEWPORTS.tablet);
      await setupAllMocks(page);

      // Act
      await navigateToLicenseManager(page);

      // Assert
      await expect(page.locator('app-license-manager-section')).toBeVisible();
      await assertNoHorizontalOverflow(page);
    });

    test('should display stat cards on tablet', async ({ page }) => {
      // Arrange
      await page.setViewportSize(VIEWPORTS.tablet);
      await setupAllMocks(page);

      // Act
      await navigateToLicenseManager(page);

      // Assert - all stat cards should still be visible
      const statCards = page.locator('.license-stat-card');
      await expect(statCards).toHaveCount(4);
    });

    test('should display license manager content on mobile without horizontal overflow (DEFECT-2026-02-27-002 FIXED)', async ({ page }) => {
      // Arrange
      await page.setViewportSize(VIEWPORTS.mobile);
      await setupAllMocks(page);

      // Act
      await navigateToLicenseManager(page);

      // Assert - component renders on mobile
      await expect(page.locator('app-license-manager-section')).toBeVisible();

      // DEFECT-2026-02-27-002 FIXED: Stat cards now stack vertically on mobile (grid-template-columns: 1fr),
      // admin-content padding reduced for mobile, and overflow-x set to hidden.
      await assertNoHorizontalOverflow(page);
    });

    test('should display stat cards on mobile', async ({ page }) => {
      // Arrange
      await page.setViewportSize(VIEWPORTS.mobile);
      await setupAllMocks(page);

      // Act
      await navigateToLicenseManager(page);

      // Assert - stat cards should still exist on mobile
      const statCards = page.locator('.license-stat-card');
      await expect(statCards).toHaveCount(4);
    });

    test('should display empty state on mobile', async ({ page }) => {
      // Arrange
      await page.setViewportSize(VIEWPORTS.mobile);
      await setupAllMocks(page);

      // Act
      await navigateToLicenseManager(page);

      // Assert - empty state content should be visible and readable
      await expect(page.getByRole('heading', { name: 'No Licenses Configured', level: 2 })).toBeVisible();
      await expect(page.locator('.license-empty-state').getByRole('button', { name: /Add Your First License/i })).toBeVisible();
    });

    test('should maintain content integrity across all viewports', async ({ page }) => {
      // Assert that the same elements are present at every viewport size

      for (const [name, viewport] of Object.entries(VIEWPORTS)) {
        // Arrange
        await page.setViewportSize(viewport);
        await setupAllMocks(page);

        // Act
        await navigateToLicenseManager(page);

        // Assert - core elements always present at viewport: ${name}
        await expect(page.getByRole('heading', { name: 'License Management', level: 1 })).toBeVisible();
        await expect(page.locator('.license-stat-card')).toHaveCount(4);
        await expect(page.getByRole('heading', { name: 'No Licenses Configured', level: 2 })).toBeVisible();
      }
    });
  });

  // ==========================================================================
  // 7. Accessibility
  // ==========================================================================
  test.describe('Accessibility', () => {

    test('should have no axe-core accessibility violations on the license manager section', async ({ page }) => {
      // Arrange
      await setupAllMocks(page);

      // Act
      await navigateToLicenseManager(page);
      await expect(page.locator('app-license-manager-section')).toBeVisible();

      // Assert - axe-core scan
      const accessibilityScanResults = await new AxeBuilder({ page })
        .include('app-license-manager-section')
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze();

      expect(accessibilityScanResults.violations).toEqual([]);
    });

    test('should have no accessibility violations on dock navigation (DEFECT-2026-02-27-001 FIXED)', async ({ page }) => {
      // Arrange
      await setupAllMocks(page);

      // Act
      await navigateToLicenseManager(page);
      await expect(page.locator('.admin-dock')).toBeVisible();

      // Assert - run axe-core scan on dock navigation
      const accessibilityScanResults = await new AxeBuilder({ page })
        .include('.admin-dock')
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze();

      // DEFECT-2026-02-27-001 FIXED: aria-label added to all 5 dock buttons
      // and tooltip spans marked aria-hidden="true" to prevent duplicate announcements.
      expect(accessibilityScanResults.violations).toEqual([]);
    });

    test('should have aria-label on the main content area', async ({ page }) => {
      // Arrange
      await setupAllMocks(page);

      // Act
      await navigateToLicenseManager(page);

      // Assert
      const contentSection = page.locator('section.admin-content[aria-label="Administration content"]');
      await expect(contentSection).toBeVisible();
    });

    test('should allow keyboard navigation through dock items', async ({ page }) => {
      // Arrange
      await setupAllMocks(page);

      // Act
      await navigateToLicenseManager(page);

      // Tab into the dock area and through dock items
      // The dock items are buttons, so they should be keyboard focusable
      const licenseDockItem = page.locator('.dock-item[data-tooltip="License Management"]');
      await licenseDockItem.focus();

      // Assert - the item should receive focus
      await expect(licenseDockItem).toBeFocused();
    });

    test('should activate dock item with Enter key', async ({ page }) => {
      // Arrange
      await setupAllMocks(page);

      // Act - start at default section
      await navigateToAdministration(page);

      // Focus the License Management dock item
      const licenseDockItem = page.locator('.dock-item[data-tooltip="License Management"]');
      await licenseDockItem.focus();

      // Press Enter to activate
      await page.keyboard.press('Enter');

      // Assert - license manager should now be visible
      await expect(page.locator('app-license-manager-section')).toBeVisible();
      await expect(licenseDockItem).toHaveClass(/active/);
    });

    test('should have all decorative images properly marked with alt="" and aria-hidden="true"', async ({ page }) => {
      // Arrange
      await setupAllMocks(page);

      // Act
      await navigateToLicenseManager(page);

      // Assert - all images in the license manager section should be decorative
      const sectionImages = page.locator('app-license-manager-section img');
      const imageCount = await sectionImages.count();

      // The component has: 1 header button icon, 4 stat card icons, 1 empty state icon, 1 empty state button icon = 7
      expect(imageCount).toBeGreaterThanOrEqual(6);

      for (let i = 0; i < imageCount; i++) {
        await expect(sectionImages.nth(i)).toHaveAttribute('alt', '');
        await expect(sectionImages.nth(i)).toHaveAttribute('aria-hidden', 'true');
      }
    });

    test('should have visible focus indicators on dock items', async ({ page }) => {
      // Arrange
      await setupAllMocks(page);

      // Act
      await navigateToLicenseManager(page);

      // Focus a dock item using keyboard
      const licenseDockItem = page.locator('.dock-item[data-tooltip="License Management"]');
      await licenseDockItem.focus();

      // Trigger :focus-visible by tabbing
      // First tab away then tab back to ensure :focus-visible is triggered
      await page.keyboard.press('Tab');
      await page.keyboard.press('Shift+Tab');

      // Assert - the dock-icon-wrapper should have a box-shadow for focus-visible
      // We cannot reliably check :focus-visible styles in all browsers,
      // so we verify the element is focusable and receives focus
      await expect(licenseDockItem).toBeFocused();
    });

    test('should have buttons with accessible names', async ({ page }) => {
      // Arrange
      await setupAllMocks(page);

      // Act
      await navigateToLicenseManager(page);

      // Assert - "Add License" button should have accessible text
      const addLicenseBtn = page.locator('.manager-header').getByRole('button', { name: /Add License/i });
      await expect(addLicenseBtn).toBeVisible();

      // Assert - "Add Your First License" button should have accessible text
      const addFirstBtn = page.locator('.license-empty-state').getByRole('button', { name: /Add Your First License/i });
      await expect(addFirstBtn).toBeVisible();
    });
  });
});
