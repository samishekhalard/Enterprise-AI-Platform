import { expect, test } from '@playwright/test';

/**
 * User Sessions Dialog E2E Tests
 *
 * These tests verify the session-management dialog accessible from the Users tab
 * inside Admin > Tenant Manager > (select tenant) > Users tab.
 *
 * All API calls are intercepted via page.route() so no backend is required.
 *
 * Architecture under test:
 *   UserEmbeddedComponent
 *     -> openSessions(user: TenantUser)
 *       -> ApiGatewayService.getUserSessions(userId)   -> GET  /api/v1/users/{userId}/sessions
 *     -> revokeAll()
 *       -> ApiGatewayService.revokeAllUserSessions(userId) -> DELETE /api/v1/users/{userId}/sessions
 *     -> closeSessions()
 *
 * Key files:
 *   - frontend/src/app/features/admin/users/user-embedded.component.ts (lines 280-332)
 *   - frontend/src/app/features/admin/users/user-embedded.component.html (lines 238-345)
 *   - frontend/src/app/core/api/api-gateway.service.ts (lines 224-234)
 *   - frontend/src/app/core/api/models.ts (lines 407-419)
 */

// ---------------------------------------------------------------------------
// Test data
// ---------------------------------------------------------------------------

const MOCK_ACCESS_TOKEN =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.' +
  'eyJzdWIiOiJ1c2VyLTEiLCJpYXQiOjE3MDAwMDAwMDB9.' +
  'mock-signature';
const MOCK_REFRESH_TOKEN = 'mock-refresh-token-value';
const ACCESS_TOKEN_KEY = 'tp_access_token';
const REFRESH_TOKEN_KEY = 'tp_refresh_token';

const MOCK_TENANT = {
  id: 'master',
  uuid: '00000000-0000-0000-0000-000000000000',
  name: 'Master Tenant',
  fullName: 'Master Tenant',
  shortName: 'Master',
  status: 'active',
  tenantType: 'MASTER',
  tier: 'ENTERPRISE',
  usersCount: 2,
  domainsCount: 0,
  primaryDomain: 'master.example.com',
  isProtected: true,
};

const MOCK_USERS = [
  {
    id: 'user-1',
    email: 'alice@acme.example.com',
    firstName: 'Alice',
    lastName: 'Admin',
    displayName: 'Alice Admin',
    active: true,
    emailVerified: true,
    roles: ['ADMIN'],
    groups: [],
    identityProvider: 'keycloak',
    lastLoginAt: '2026-03-03T10:00:00Z',
    createdAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'user-2',
    email: 'bob@acme.example.com',
    firstName: 'Bob',
    lastName: 'User',
    displayName: 'Bob User',
    active: false,
    emailVerified: true,
    roles: ['USER'],
    groups: [],
    identityProvider: 'keycloak',
    lastLoginAt: null,
    createdAt: '2026-02-01T00:00:00Z',
  },
];

const MOCK_USERS_PAGED = {
  content: MOCK_USERS,
  page: 0,
  size: 20,
  totalElements: 2,
  totalPages: 1,
};

const MOCK_SESSIONS = [
  {
    id: 'sess-1',
    deviceName: 'Chrome on macOS',
    ipAddress: '192.168.1.42',
    location: null,
    createdAt: '2026-03-03T08:00:00Z',
    lastActivity: '2026-03-03T10:30:00Z',
    expiresAt: '2026-03-04T08:00:00Z',
    isRemembered: true,
    mfaVerified: true,
    status: 'ACTIVE' as const,
    isCurrent: true,
  },
  {
    id: 'sess-2',
    deviceName: 'Firefox on Windows',
    ipAddress: '10.0.0.5',
    location: null,
    createdAt: '2026-03-01T14:00:00Z',
    lastActivity: '2026-03-01T16:00:00Z',
    expiresAt: '2026-03-02T14:00:00Z',
    isRemembered: false,
    mfaVerified: false,
    status: 'EXPIRED' as const,
    isCurrent: false,
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Catch-all API interceptor returning empty 200 for any /api/** request.
 * Specific routes registered AFTER this take priority (Playwright LIFO ordering).
 */
async function interceptAllApi(page: import('@playwright/test').Page): Promise<void> {
  await page.route('**/api/**', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({}),
    }),
  );
}

/**
 * Seed an authenticated session by injecting tokens into sessionStorage.
 */
async function seedAuthenticatedSession(page: import('@playwright/test').Page): Promise<void> {
  await page.goto('/auth/login');
  await page.waitForLoadState('domcontentloaded');

  await page.evaluate(
    ({ accessKey, refreshKey, accessToken, refreshToken }) => {
      sessionStorage.setItem(accessKey, accessToken);
      sessionStorage.setItem(refreshKey, refreshToken);
    },
    {
      accessKey: ACCESS_TOKEN_KEY,
      refreshKey: REFRESH_TOKEN_KEY,
      accessToken: MOCK_ACCESS_TOKEN,
      refreshToken: MOCK_REFRESH_TOKEN,
    },
  );
}

/**
 * Set up all prerequisite API mocks and navigate to the Users tab for the
 * first tenant in the tenant list. Accepts an optional sessions mock.
 */
async function navigateToUsersTab(
  page: import('@playwright/test').Page,
  options: {
    sessions?: unknown[];
    sessionsStatus?: number;
    usersPaged?: object;
  } = {},
): Promise<void> {
  const { sessions = MOCK_SESSIONS, sessionsStatus = 200, usersPaged = MOCK_USERS_PAGED } = options;

  // Catch-all (lowest priority)
  await interceptAllApi(page);

  // Tenant resolve mock
  await page.route('**/api/tenants/resolve**', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ id: MOCK_TENANT.id, name: MOCK_TENANT.shortName, status: 'active' }),
    }),
  );

  // Tenant list mock — listTenants() calls GET /api/tenants (NOT /api/v1/tenants)
  // Use a URL predicate to match /api/tenants with query params but not /api/tenants/resolve
  await page.route(
    (url) => url.pathname.endsWith('/api/tenants') && url.search.includes('page='),
    (route) => {
      if (route.request().method() === 'GET') {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ tenants: [MOCK_TENANT], total: 1, page: 0, limit: 100 }),
        });
      }
      return route.continue();
    },
  );

  // Users list mock — listTenantUsers() calls GET /api/v1/admin/tenants/{uuid}/users
  await page.route('**/api/v1/admin/tenants/*/users**', (route) => {
    if (route.request().method() === 'GET') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(usersPaged),
      });
    }
    return route.continue();
  });

  // Sessions mock
  await page.route('**/api/v1/users/*/sessions', (route) => {
    if (route.request().method() === 'GET') {
      return route.fulfill({
        status: sessionsStatus,
        contentType: 'application/json',
        body: sessionsStatus >= 400
          ? JSON.stringify({ error: 'Internal Server Error' })
          : JSON.stringify(sessions),
      });
    }
    return route.continue();
  });

  // Seed auth and navigate
  await seedAuthenticatedSession(page);
  await page.goto('/administration?section=tenant-manager');
  await page.waitForLoadState('domcontentloaded');

  // The master tenant is auto-selected via masterFirstMode, but we still click to
  // ensure the detail panel is rendered. The tenant button text derives from shortName.
  const tenantBtn = page.locator('.tenant-item').first();
  await expect(tenantBtn).toBeVisible({ timeout: 10_000 });
  await tenantBtn.click();

  // Click the "Users" tab
  const usersTab = page.locator('p-tab[value="users"]');
  await expect(usersTab).toBeVisible({ timeout: 5_000 });
  await usersTab.click();

  // Wait for user table to render
  await expect(page.getByText('Alice Admin')).toBeVisible({ timeout: 10_000 });
}

/**
 * Click the "Sessions" button for the first user in the table.
 */
async function openFirstUserSessions(page: import('@playwright/test').Page): Promise<void> {
  const sessionsBtn = page.locator('[data-testid="user-sessions-btn"]').first();
  await expect(sessionsBtn).toBeVisible({ timeout: 5_000 });
  await sessionsBtn.click();
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

test.describe('User Sessions Dialog', () => {
  test.use({
    baseURL: process.env['PLAYWRIGHT_BASE_URL'] ?? 'http://localhost:4200',
  });

  test.describe('Happy path — dialog opens with 2 sessions (1 ACTIVE + 1 EXPIRED)', () => {
    test('should open dialog and display session rows', async ({ page }) => {
      await navigateToUsersTab(page);
      await openFirstUserSessions(page);

      // PrimeNG Dialog renders the visible overlay with role="dialog"
      const dialog = page.getByRole('dialog');
      await expect(dialog).toBeVisible({ timeout: 5_000 });

      // Header should show the user name
      await expect(page.locator('.sessions-dialog-title')).toContainText('Alice Admin');
      await expect(page.locator('.sessions-dialog-subtitle')).toContainText('alice@acme.example.com');

      // Two session rows rendered (two rows in the tbody)
      const rows = page.locator('.sessions-table tbody tr');
      await expect(rows).toHaveCount(2);
    });

    test('should show teal left border and "This session" badge on isCurrent row', async ({ page }) => {
      await navigateToUsersTab(page);
      await openFirstUserSessions(page);

      // The ACTIVE + isCurrent row should have the session-current class
      const currentRow = page.locator('.sessions-table tbody tr.session-current');
      await expect(currentRow).toBeVisible();
      await expect(currentRow).toHaveCount(1);

      // "This session" badge
      const badge = currentRow.locator('.current-badge');
      await expect(badge).toBeVisible();
      await expect(badge).toHaveText('This session');
    });

    test('should display "Remember Me" and "MFA" tags on the first session', async ({ page }) => {
      await navigateToUsersTab(page);
      await openFirstUserSessions(page);

      // The first session has isRemembered=true, mfaVerified=true
      const firstRow = page.locator('.sessions-table tbody tr').first();
      await expect(firstRow.locator('p-tag:has-text("Remember Me")')).toBeVisible();
      await expect(firstRow.locator('p-tag:has-text("MFA")')).toBeVisible();

      // The second session has both false -- no such tags
      const secondRow = page.locator('.sessions-table tbody tr').nth(1);
      await expect(secondRow.locator('p-tag:has-text("Remember Me")')).not.toBeVisible();
      await expect(secondRow.locator('p-tag:has-text("MFA")')).not.toBeVisible();
    });

    test('should show "Revoke All Sessions" button as enabled when ACTIVE sessions exist', async ({ page }) => {
      await navigateToUsersTab(page);
      await openFirstUserSessions(page);

      const revokeBtn = page.locator('[data-testid="revoke-all-btn"]');
      await expect(revokeBtn).toBeVisible();
      await expect(revokeBtn).toBeEnabled();
    });

    test('should display correct sessions count text', async ({ page }) => {
      await navigateToUsersTab(page);
      await openFirstUserSessions(page);

      const countText = page.locator('.sessions-count');
      await expect(countText).toContainText('2 session(s)');
      await expect(countText).toContainText('1 active');
    });
  });

  test.describe('Revoke all flow', () => {
    test('clicking "Revoke All Sessions" should mark ACTIVE sessions as REVOKED and disable button', async ({ page }) => {
      await navigateToUsersTab(page);

      // Intercept DELETE for revoke-all; use fallback() for non-DELETE to defer
      // to the GET sessions handler registered in navigateToUsersTab.
      await page.route('**/api/v1/users/*/sessions', (route) => {
        if (route.request().method() === 'DELETE') {
          return route.fulfill({ status: 204, body: '' });
        }
        return route.fallback();
      });

      await openFirstUserSessions(page);

      // Wait for dialog to fully render
      await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5_000 });

      // Verify ACTIVE tag text exists before revocation
      const firstRow = page.locator('.sessions-table tbody tr').first();
      await expect(firstRow.getByText('ACTIVE', { exact: true })).toBeVisible();

      // Click "Revoke All Sessions"
      const revokeBtn = page.locator('[data-testid="revoke-all-btn"]');
      await revokeBtn.click();

      // After revocation, the ACTIVE row should now show REVOKED
      await expect(firstRow.getByText('REVOKED', { exact: true })).toBeVisible({ timeout: 5_000 });
      await expect(firstRow.getByText('ACTIVE', { exact: true })).not.toBeVisible();

      // Button should now be disabled (no more ACTIVE sessions)
      await expect(revokeBtn).toBeDisabled();

      // Count text should show 0 active
      const countText = page.locator('.sessions-count');
      await expect(countText).toContainText('0 active');
    });
  });

  test.describe('Empty state', () => {
    test('should display empty state when user has no sessions', async ({ page }) => {
      await navigateToUsersTab(page, { sessions: [] });
      await openFirstUserSessions(page);

      // Empty state element should be visible
      const emptyState = page.locator('[data-testid="sessions-empty"]');
      await expect(emptyState).toBeVisible({ timeout: 5_000 });
      await expect(page.getByText('No sessions found for this user.')).toBeVisible();

      // Table should not be present
      await expect(page.locator('.sessions-table')).not.toBeVisible();
    });
  });

  test.describe('Error state', () => {
    test('should display error banner when sessions API returns 500', async ({ page }) => {
      await navigateToUsersTab(page, { sessionsStatus: 500 });
      await openFirstUserSessions(page);

      // Error banner with role="alert" should be visible
      const errorBanner = page.locator('.error-banner[role="alert"]');
      await expect(errorBanner).toBeVisible({ timeout: 5_000 });
      await expect(errorBanner).toContainText('Failed to load sessions');

      // Session table and empty state should not be visible
      await expect(page.locator('.sessions-table')).not.toBeVisible();
      await expect(page.locator('[data-testid="sessions-empty"]')).not.toBeVisible();
    });
  });

  test.describe('Close dialog', () => {
    test('clicking Close button should dismiss the dialog', async ({ page }) => {
      await navigateToUsersTab(page);
      await openFirstUserSessions(page);

      // Verify dialog is open (PrimeNG renders overlay with role="dialog")
      const dialog = page.getByRole('dialog');
      await expect(dialog).toBeVisible({ timeout: 5_000 });

      // Click Close
      const closeBtn = page.locator('[data-testid="sessions-close-btn"]');
      await expect(closeBtn).toBeVisible();
      await closeBtn.click();

      // Dialog should be gone
      await expect(dialog).not.toBeVisible({ timeout: 5_000 });
    });
  });

  test.describe('Accessibility', () => {
    test('dialog should have role="dialog" (provided by PrimeNG Dialog)', async ({ page }) => {
      await navigateToUsersTab(page);
      await openFirstUserSessions(page);

      // PrimeNG Dialog renders with role="dialog" on the overlay panel
      const dialogRole = page.getByRole('dialog');
      await expect(dialogRole).toBeVisible({ timeout: 5_000 });
    });

    test('sessions button should have descriptive aria-label', async ({ page }) => {
      await navigateToUsersTab(page);

      const firstBtn = page.locator('[data-testid="user-sessions-btn"]').first();
      await expect(firstBtn).toHaveAttribute('aria-label', 'View sessions for Alice Admin');
    });

    test('sessions table region should have aria-label', async ({ page }) => {
      await navigateToUsersTab(page);
      await openFirstUserSessions(page);

      const region = page.locator('[role="region"][aria-label="User sessions"]');
      await expect(region).toBeVisible();
    });

    test('error banner should have role="alert"', async ({ page }) => {
      await navigateToUsersTab(page, { sessionsStatus: 500 });
      await openFirstUserSessions(page);

      const alert = page.locator('.error-banner[role="alert"]');
      await expect(alert).toBeVisible({ timeout: 5_000 });
    });

    test('revoke button should have aria-label', async ({ page }) => {
      await navigateToUsersTab(page);
      await openFirstUserSessions(page);

      const revokeBtn = page.locator('[data-testid="revoke-all-btn"]');
      await expect(revokeBtn).toHaveAttribute('aria-label', 'Revoke all active sessions for this user');
    });

    test('close button should have aria-label', async ({ page }) => {
      await navigateToUsersTab(page);
      await openFirstUserSessions(page);

      const closeBtn = page.locator('[data-testid="sessions-close-btn"]');
      await expect(closeBtn).toHaveAttribute('aria-label', 'Close sessions dialog');
    });
  });

  test.describe('Responsive — 3 viewports', () => {
    const viewports = [
      { name: 'Desktop', width: 1280, height: 800 },
      { name: 'Tablet', width: 768, height: 1024 },
      { name: 'Mobile', width: 375, height: 667 },
    ] as const;

    for (const viewport of viewports) {
      test(`should display sessions dialog at ${viewport.name} (${viewport.width}x${viewport.height})`, async ({
        page,
      }) => {
        await page.setViewportSize({ width: viewport.width, height: viewport.height });
        await navigateToUsersTab(page);
        await openFirstUserSessions(page);

        // Dialog should be visible at this viewport (PrimeNG overlay with role="dialog")
        const dialog = page.getByRole('dialog');
        await expect(dialog).toBeVisible({ timeout: 5_000 });

        // Session rows should be rendered
        const rows = page.locator('.sessions-table tbody tr');
        await expect(rows).toHaveCount(2);

        // Close button should be reachable
        const closeBtn = page.locator('[data-testid="sessions-close-btn"]');
        await expect(closeBtn).toBeVisible();

        // Clean up
        await closeBtn.click();
        await expect(dialog).not.toBeVisible({ timeout: 5_000 });
      });
    }
  });
});
