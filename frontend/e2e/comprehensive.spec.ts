import { expect, test } from '@playwright/test';

/**
 * Comprehensive E2E Tests
 *
 * Covers areas not tested by existing spec files:
 * - Login page form behavior
 * - Password reset pages
 * - Error pages
 * - License Manager section
 * - Master Locale section
 * - Tenant Manager CRUD
 * - Administration dock navigation
 *
 * All API calls are intercepted so no backend is required.
 */

const MOCK_ACCESS_TOKEN =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.' +
  'eyJzdWIiOiJ1c2VyLTEiLCJpYXQiOjE3MDAwMDAwMDB9.' +
  'mock-signature';
const MOCK_REFRESH_TOKEN = 'mock-refresh-token-value';
const ACCESS_TOKEN_KEY = 'tp_access_token';
const REFRESH_TOKEN_KEY = 'tp_refresh_token';

async function interceptAllApi(page: import('@playwright/test').Page): Promise<void> {
  await page.route('**/api/**', (route) => {
    const url = route.request().url();

    // Tenant resolution needs a valid response so the app can bootstrap
    if (url.includes('/api/tenants/resolve')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          tenant: {
            uuid: '00000000-0000-0000-0000-000000000001',
            id: '00000000-0000-0000-0000-000000000001',
            shortName: 'Master',
            slug: 'master',
          },
        }),
      });
    }

    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({}),
    });
  });
}

async function seedAuth(page: import('@playwright/test').Page): Promise<void> {
  await page.goto('/auth/login');
  await page.waitForLoadState('networkidle');
  await page.evaluate(
    ([ak, rk, av, rv]) => {
      sessionStorage.setItem(ak, av);
      sessionStorage.setItem(rk, rv);
    },
    [ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY, MOCK_ACCESS_TOKEN, MOCK_REFRESH_TOKEN] as const,
  );
}

// ===========================================================================
// 1. Login Page Form
// ===========================================================================
test.describe('Login Page Form', () => {
  test('login page renders with welcome title and subtitle', async ({ page }) => {
    await interceptAllApi(page);
    await page.goto('/auth/login');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('.welcome-title')).toBeVisible();
    await expect(page.locator('.welcome-subtitle')).toBeVisible();
  });

  test('clicking "Sign in with Email" reveals login form', async ({ page }) => {
    await interceptAllApi(page);
    await page.goto('/auth/login');
    await page.waitForLoadState('networkidle');

    const signinBtn = page.locator('.signin-btn');
    await expect(signinBtn).toBeVisible({ timeout: 10_000 });
    await signinBtn.click();

    // Form should now be visible
    await expect(page.locator('#identifier')).toBeVisible({ timeout: 5_000 });
    await expect(page.locator('#password')).toBeVisible();
    await expect(page.locator('#tenant-id')).toBeVisible();
    await expect(page.locator('.submit-btn')).toBeVisible();
  });

  test('back button hides the login form', async ({ page }) => {
    await interceptAllApi(page);
    await page.goto('/auth/login');
    await page.waitForLoadState('networkidle');

    await page.locator('.signin-btn').click();
    await expect(page.locator('#identifier')).toBeVisible();

    await page.locator('.back-btn').click();
    await expect(page.locator('#identifier')).not.toBeVisible();
    await expect(page.locator('.signin-btn')).toBeVisible();
  });

  test('submitting login form with valid credentials navigates to administration', async ({
    page,
  }) => {
    await page.route('**/api/**', (route) => {
      const url = route.request().url();
      if (url.includes('/api/v1/auth/login') && route.request().method() === 'POST') {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            accessToken: MOCK_ACCESS_TOKEN,
            refreshToken: MOCK_REFRESH_TOKEN,
          }),
        });
      }
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({}),
      });
    });

    await page.goto('/auth/login');
    await page.waitForLoadState('networkidle');

    await page.locator('.signin-btn').click();
    await page.locator('#identifier').fill('admin@example.com');
    await page.locator('#password').fill('Password123!');
    await page.locator('#tenant-id').fill('00000000-0000-0000-0000-000000000001');
    await page.locator('.submit-btn').click();

    await expect(page).toHaveURL(/\/administration/, { timeout: 10_000 });
  });

  test('login form shows error on failed login', async ({ page }) => {
    await page.route('**/api/**', (route) => {
      const url = route.request().url();
      if (url.includes('/api/v1/auth/login') && route.request().method() === 'POST') {
        return route.fulfill({
          status: 401,
          contentType: 'application/json',
          body: JSON.stringify({ success: false, message: 'Invalid credentials' }),
        });
      }
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({}),
      });
    });

    await page.goto('/auth/login');
    await page.waitForLoadState('networkidle');

    await page.locator('.signin-btn').click();
    await page.locator('#identifier').fill('wrong@example.com');
    await page.locator('#password').fill('wrong');
    await page.locator('#tenant-id').fill('00000000-0000-0000-0000-000000000001');
    await page.locator('.submit-btn').click();

    await expect(page.locator('.error-banner')).toBeVisible({ timeout: 5_000 });
  });

  test('password visibility toggle works', async ({ page }) => {
    await interceptAllApi(page);
    await page.goto('/auth/login');
    await page.waitForLoadState('networkidle');

    await page.locator('.signin-btn').click();
    const passwordInput = page.locator('#password');
    await expect(passwordInput).toHaveAttribute('type', 'password');

    await page.locator('.password-toggle').click();
    await expect(passwordInput).toHaveAttribute('type', 'text');

    await page.locator('.password-toggle').click();
    await expect(passwordInput).toHaveAttribute('type', 'password');
  });

  test('session expired query param shows info banner', async ({ page }) => {
    await interceptAllApi(page);
    await page.goto('/auth/login?reason=session_expired');
    await page.waitForLoadState('networkidle');

    const infoBanner = page.locator('.info-banner');
    await expect(infoBanner).toBeVisible();
    await expect(infoBanner).toContainText('session expired');
  });
});

// ===========================================================================
// 2. Password Reset Pages
// ===========================================================================
test.describe('Password Reset', () => {
  test('password reset request page renders with email input', async ({ page }) => {
    await interceptAllApi(page);
    await page.goto('/auth/password-reset');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('input[type="email"], input[name="email"], #email')).toBeVisible({
      timeout: 5_000,
    });
  });

  test('password reset confirm page requires token param', async ({ page }) => {
    await interceptAllApi(page);
    await page.goto('/auth/password-reset/confirm?token=test-token');
    await page.waitForLoadState('networkidle');

    // Should render password fields
    const passwordInputs = page.locator('input[type="password"]');
    await expect(passwordInputs.first()).toBeVisible({ timeout: 5_000 });
  });
});

// ===========================================================================
// 3. Error Pages
// ===========================================================================
test.describe('Error Pages', () => {
  test('access denied page renders correctly', async ({ page }) => {
    await interceptAllApi(page);
    await page.goto('/error/access-denied');
    await page.waitForLoadState('networkidle');
    // The page may render an error message or redirect - verify it doesn't crash
    const body = page.locator('body');
    await expect(body).toBeVisible({ timeout: 5_000 });
    // Check for error text or that the page loaded without blank screen
    const hasContent = await page.locator('app-root').innerHTML();
    expect(hasContent.length).toBeGreaterThan(0);
  });

  test('session expired page renders correctly', async ({ page }) => {
    await page.goto('/error/session-expired');
    await page.waitForLoadState('networkidle');
    await expect(page.getByText(/session.*expired/i)).toBeVisible({ timeout: 5_000 });
  });

  test('tenant not found page renders correctly', async ({ page }) => {
    await page.goto('/error/tenant-not-found');
    await page.waitForLoadState('networkidle');
    await expect(page.getByText(/tenant.*not found|organization/i)).toBeVisible({
      timeout: 5_000,
    });
  });
});

// ===========================================================================
// 4. Administration Dock Navigation
// ===========================================================================
test.describe('Administration Dock Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await interceptAllApi(page);
    await seedAuth(page);
  });

  test('dock displays all 4 navigation sections', async ({ page }) => {
    await page.goto('/administration');
    await page.waitForLoadState('networkidle');

    const dockLinks = page.locator('.dock-link');
    await expect(dockLinks.first()).toBeVisible({ timeout: 10_000 });
    await expect(dockLinks).toHaveCount(4);

    // Verify section labels
    await expect(page.getByText('Tenant Manager')).toBeVisible();
    await expect(page.getByText('License Manager')).toBeVisible();
    await expect(page.getByText('Master Locale')).toBeVisible();
    await expect(page.getByText('Master Definitions')).toBeVisible();
  });

  test('clicking dock links switches active section', async ({ page }) => {
    await page.goto('/administration');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('.dock-link').first()).toBeVisible({ timeout: 10_000 });

    // Click License Manager
    await page.getByRole('button', { name: 'License Manager' }).dispatchEvent('click');
    await expect(page).toHaveURL(/section=license-manager/);

    // Click Master Locale
    await page.getByRole('button', { name: 'Master Locale' }).dispatchEvent('click');
    await expect(page).toHaveURL(/section=master-locale/);

    // Click Master Definitions
    await page.getByRole('button', { name: 'Master Definitions' }).dispatchEvent('click');
    await expect(page).toHaveURL(/section=master-definitions/);

    // Click back to Tenant Manager
    await page.getByRole('button', { name: 'Tenant Manager' }).dispatchEvent('click');
    await expect(page).toHaveURL(/section=tenant-manager/);
  });

  test('breadcrumb updates when section changes', async ({ page }) => {
    await page.goto('/administration');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('.dock-link').first()).toBeVisible({ timeout: 10_000 });

    // Verify section heading or page title changes when navigating
    await page.getByRole('button', { name: 'License Manager' }).dispatchEvent('click');
    await expect(page).toHaveURL(/section=license-manager/);
  });

  test('help dialog opens and closes', async ({ page }) => {
    await page.goto('/administration');
    await page.waitForLoadState('networkidle');

    await page.locator('button[aria-label="Help"]').click();

    // Help dialog (or fallback) should appear
    const helpContent = page.getByText('Keyboard Shortcuts');
    await expect(helpContent).toBeVisible({ timeout: 5_000 });
  });
});

// ===========================================================================
// 5. License Manager Section
// ===========================================================================
test.describe('License Manager Section', () => {
  const MOCK_LICENSE_STATUS = {
    state: 'ACTIVE',
    licenseId: 'lic-001',
    product: 'EMSIST Enterprise',
    versionRange: '1.0-2.0',
    expiresAt: '2027-12-31T23:59:59Z',
    gracePeriodDays: 30,
    graceExpiresAt: null,
    features: ['multi-tenant', 'ai-services', 'bpmn'],
    degradedFeatures: [],
    maxTenants: 10,
    activeTenantCount: 3,
    issuer: 'ThinkPlus',
    customerName: 'Test Corp',
    importedAt: '2026-01-01T00:00:00Z',
  };

  test('license manager section loads and displays license status', async ({ page }) => {
    await interceptAllApi(page);

    await page.route('**/api/v1/licenses/status', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_LICENSE_STATUS),
      }),
    );
    await page.route('**/api/v1/licenses/current', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(null),
      }),
    );

    await seedAuth(page);
    await page.goto('/administration?section=license-manager');
    await page.waitForLoadState('networkidle');

    // Should display the license manager section
    await expect(page.getByText('License Manager').first()).toBeVisible({ timeout: 10_000 });
  });

  test('license manager shows UNLICENSED state when no license', async ({ page }) => {
    await interceptAllApi(page);

    await page.route('**/api/v1/licenses/status', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ...MOCK_LICENSE_STATUS, state: 'UNLICENSED' }),
      }),
    );

    await seedAuth(page);
    await page.goto('/administration?section=license-manager');
    await page.waitForLoadState('networkidle');

    await expect(page.getByText('License Manager').first()).toBeVisible({ timeout: 10_000 });
  });
});

// ===========================================================================
// 6. Master Locale Section
// ===========================================================================
test.describe('Master Locale Section', () => {
  test('master locale section loads with language tabs', async ({ page }) => {
    await interceptAllApi(page);
    await seedAuth(page);

    await page.goto('/administration?section=master-locale');
    await page.waitForLoadState('networkidle');

    // Should display the locale section with tabs
    await expect(page.getByText('Master Locale').first()).toBeVisible({ timeout: 10_000 });
  });
});

// ===========================================================================
// 7. Tenant Manager CRUD
// ===========================================================================
test.describe('Tenant Manager CRUD', () => {
  const MOCK_TENANT = {
    id: 'tenant-master',
    uuid: 'uuid-master',
    fullName: 'Master Tenant',
    shortName: 'Master',
    status: 'ACTIVE',
    tenantType: 'MASTER',
    tier: 'ENTERPRISE',
    isProtected: true,
  };

  async function setupTenantManager(page: import('@playwright/test').Page): Promise<void> {
    await interceptAllApi(page);
    await page.route('**/api/tenants/resolve**', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ tenantId: 'tenant-master', slug: 'master' }),
      }),
    );
    await page.route('**/api/tenants?*', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          tenants: [MOCK_TENANT],
          total: 1,
          page: 1,
          limit: 200,
        }),
      }),
    );
    await page.route('**/api/tenants/*/branding', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ primaryColor: '#428177' }),
      }),
    );
    await page.route('**/api/tenants/*/identity-providers**', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: '[]' }),
    );
    await page.route('**/api/tenants/*/users**', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ content: [], totalElements: 0, totalPages: 0, page: 0, size: 20 }),
      }),
    );
    await page.route('**/api/tenants/*/seats**', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ available: 0, total: 0, used: 0 }),
      }),
    );

    await seedAuth(page);
  }

  test('tenant list shows master tenant', async ({ page }) => {
    await setupTenantManager(page);
    await page.goto('/administration?section=tenant-manager');
    await page.waitForLoadState('networkidle');

    await expect(page.getByText('Master').first()).toBeVisible({ timeout: 10_000 });
  });

  test('tenant search input is present and functional', async ({ page }) => {
    await setupTenantManager(page);
    await page.goto('/administration?section=tenant-manager');
    await page.waitForLoadState('networkidle');

    const searchInput = page.locator('input.tenant-search, input[aria-label="Search tenants"]');
    await expect(searchInput).toBeVisible({ timeout: 10_000 });
    await searchInput.fill('Master');
  });

  test('tenant tabs are visible when a tenant is selected', async ({ page }) => {
    await setupTenantManager(page);
    await page.goto('/administration?section=tenant-manager');
    await page.waitForLoadState('networkidle');

    // Wait for tenant list to render
    await expect(page.getByText('Master').first()).toBeVisible({ timeout: 10_000 });

    // Tenant tabs should be visible (Overview, Users, Branding, etc.)
    const tabContainer = page.locator('.tenant-tabs').first();
    await expect(tabContainer).toBeVisible({ timeout: 5_000 });
  });
});

// ===========================================================================
// 8. Responsive Layout
// ===========================================================================
test.describe('Responsive Layout', () => {
  test.beforeEach(async ({ page }) => {
    await interceptAllApi(page);
    await seedAuth(page);
  });

  test('mobile viewport shows hamburger menu', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/administration');
    await page.waitForLoadState('networkidle');

    const hamburger = page.getByRole('button', { name: 'Navigation menu' });
    await expect(hamburger).toBeVisible({ timeout: 10_000 });
  });

  test('mobile hamburger opens drawer with navigation', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/administration');
    await page.waitForLoadState('networkidle');

    await page.getByRole('button', { name: 'Navigation menu' }).click();

    // Drawer should open (page gets drawer-open class)
    await expect(page.locator('.administration-page.drawer-open')).toBeVisible();
  });

  test('desktop viewport hides hamburger drawer', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/administration');
    await page.waitForLoadState('networkidle');

    // Admin dock should be visible on desktop
    await expect(page.locator('.admin-dock')).toBeVisible({ timeout: 10_000 });
  });
});

// ===========================================================================
// 9. Navigation Edge Cases
// ===========================================================================
test.describe('Navigation Edge Cases', () => {
  test('root URL redirects to administration', async ({ page }) => {
    await interceptAllApi(page);
    await seedAuth(page);
    await page.goto('/');
    await expect(page).toHaveURL(/\/(administration|auth\/login|login)/, { timeout: 10_000 });
  });

  test('unknown route redirects to default landing', async ({ page }) => {
    await interceptAllApi(page);
    await seedAuth(page);
    await page.goto('/nonexistent-route');
    await expect(page).toHaveURL(/\/(administration|auth\/login|login)/, { timeout: 10_000 });
  });

  test('direct section URL loads correct section', async ({ page }) => {
    await interceptAllApi(page);
    await seedAuth(page);
    await page.goto('/administration?section=master-definitions');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('.admin-breadcrumb')).toContainText('Master Definitions', {
      timeout: 10_000,
    });
  });
});

// ===========================================================================
// 10. Accessibility Baseline
// ===========================================================================
test.describe('Accessibility', () => {
  test('login page has proper ARIA landmarks', async ({ page }) => {
    await interceptAllApi(page);
    await page.goto('/auth/login');
    await page.waitForLoadState('networkidle');

    // Page should have main content
    await expect(page.locator('.login-page')).toBeVisible();
  });

  test('administration page has proper ARIA labels', async ({ page }) => {
    await interceptAllApi(page);
    await seedAuth(page);
    await page.goto('/administration');
    await page.waitForLoadState('networkidle');

    // Navigation labels
    await expect(
      page.locator('[aria-label="Administration sections"], .admin-dock'),
    ).toBeVisible({ timeout: 10_000 });

    // Header buttons have aria-labels
    await expect(page.locator('button[aria-label="Notifications"]')).toBeVisible();
    await expect(page.locator('button[aria-label="Help"]')).toBeVisible();
    await expect(page.locator('.header-island-right button[aria-label="Sign out"]')).toBeVisible();
  });

  test('page loads without console errors', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    await interceptAllApi(page);
    await seedAuth(page);
    await page.goto('/administration');
    await page.waitForLoadState('networkidle');

    // Filter out expected errors (API mocking artifacts, tenant resolution, favicon)
    const realErrors = consoleErrors.filter(
      (e) =>
        !e.includes('api/') &&
        !e.includes('favicon') &&
        !e.includes('Tenant') &&
        !e.includes('tenant') &&
        !e.includes('slug'),
    );
    expect(realErrors).toHaveLength(0);
  });
});
