import { expect, test } from '@playwright/test';

/**
 * Logout Flow E2E Tests
 *
 * These tests verify the sign-out behavior from the /administration page.
 * All API calls are intercepted via page.route() so no backend is required.
 *
 * Architecture under test:
 *   AdministrationPageComponent.onLogout()
 *     -> GatewayAuthFacadeService.logout()
 *       -> POST /api/v1/auth/logout (with refreshToken)
 *       -> SessionService.clearTokens() (removes tp_access_token, tp_refresh_token)
 *       -> Router.navigate(['/auth/login'], { queryParams: { reason: 'logged_out', loggedOut: '1' } })
 *
 * Key files:
 *   - frontend/src/app/features/administration/administration.page.ts (lines 142-144)
 *   - frontend/src/app/core/auth/gateway-auth-facade.service.ts (lines 56-86)
 *   - frontend/src/app/core/services/session.service.ts (lines 24-31)
 *   - frontend/src/app/core/auth/auth.guard.ts (lines 5-16)
 */

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** A minimal valid-looking JWT (three dot-separated base64 segments). */
const MOCK_ACCESS_TOKEN =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.' +
  'eyJzdWIiOiJ1c2VyLTEiLCJpYXQiOjE3MDAwMDAwMDB9.' +
  'mock-signature';

const MOCK_REFRESH_TOKEN = 'mock-refresh-token-value';

const ACCESS_TOKEN_KEY = 'tp_access_token';
const REFRESH_TOKEN_KEY = 'tp_refresh_token';

/**
 * Intercept every /api/** request so Angular's HTTP client never blocks on
 * a real backend.  Individual tests can add more specific routes before
 * calling this helper.
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
 * Seed an authenticated session by visiting a page that establishes the
 * browser origin, then injecting tokens into sessionStorage.
 */
async function seedAuthenticatedSession(page: import('@playwright/test').Page): Promise<void> {
  // Navigate to the login page first (lightweight, no guard) to establish origin.
  await page.goto('/auth/login');
  await page.waitForLoadState('domcontentloaded');

  // Inject tokens into sessionStorage so the auth guard considers us authenticated.
  await page.evaluate(
    ([accessKey, refreshKey, accessVal, refreshVal]) => {
      sessionStorage.setItem(accessKey, accessVal);
      sessionStorage.setItem(refreshKey, refreshVal);
    },
    [ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY, MOCK_ACCESS_TOKEN, MOCK_REFRESH_TOKEN] as const,
  );
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

test.describe('Logout Flow', () => {
  // Override baseURL: the playwright.config.ts targets HTTPS but the local dev
  // server uses plain HTTP.  When running against Docker/staging (HTTPS), remove
  // this override or set the PLAYWRIGHT_BASE_URL env var.
  test.use({ baseURL: process.env['PLAYWRIGHT_BASE_URL'] ?? 'http://localhost:4200' });

  test.describe('Desktop viewport', () => {
    test('clicking the header sign-out button redirects to login with reason query param', async ({
      page,
    }) => {
      // Arrange
      await interceptAllApi(page);
      await seedAuthenticatedSession(page);
      await page.goto('/administration');
      await page.waitForLoadState('networkidle');

      // Verify we are on the administration page before acting.
      await expect(page).toHaveURL(/\/administration/);

      // Act -- click the desktop header sign-out button (first .sign-out-btn in the header).
      const signOutBtn = page.locator('.header-island-right .sign-out-btn');
      await expect(signOutBtn).toBeVisible();
      await signOutBtn.click();

      // Assert -- redirected to login with logout reason.
      await expect(page).toHaveURL(/\/auth\/login/);
      await expect(page).toHaveURL(/reason=logged_out/);
      await expect(page).toHaveURL(/loggedOut=1/);
    });

    test('sign-out clears both access and refresh tokens from sessionStorage', async ({
      page,
    }) => {
      // Arrange
      await interceptAllApi(page);
      await seedAuthenticatedSession(page);
      await page.goto('/administration');
      await page.waitForLoadState('networkidle');

      // Sanity-check: tokens are present before logout.
      const tokensBefore = await page.evaluate(
        ([accessKey, refreshKey]) => ({
          access: sessionStorage.getItem(accessKey),
          refresh: sessionStorage.getItem(refreshKey),
        }),
        [ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY] as const,
      );
      expect(tokensBefore.access).toBe(MOCK_ACCESS_TOKEN);
      expect(tokensBefore.refresh).toBe(MOCK_REFRESH_TOKEN);

      // Act
      await page.locator('.header-island-right .sign-out-btn').click();
      await expect(page).toHaveURL(/\/auth\/login/);

      // Assert -- tokens removed.
      const tokensAfter = await page.evaluate(
        ([accessKey, refreshKey]) => ({
          access: sessionStorage.getItem(accessKey),
          refresh: sessionStorage.getItem(refreshKey),
        }),
        [ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY] as const,
      );
      expect(tokensAfter.access).toBeNull();
      expect(tokensAfter.refresh).toBeNull();
    });

    test('login page shows signed-out info banner after logout redirect', async ({ page }) => {
      // Arrange
      await interceptAllApi(page);
      await seedAuthenticatedSession(page);
      await page.goto('/administration');
      await page.waitForLoadState('networkidle');

      // Act
      await page.locator('.header-island-right .sign-out-btn').click();
      await expect(page).toHaveURL(/\/auth\/login/);

      // Assert -- the login page reads the loggedOut=1 query param and shows an info banner.
      const infoBanner = page.locator('.info-banner');
      await expect(infoBanner).toBeVisible();
      await expect(infoBanner).toContainText('signed out successfully');
    });
  });

  test.describe('Mobile viewport (375x812)', () => {
    test.use({ viewport: { width: 375, height: 812 } });

    test('opening the drawer and clicking sign-out in the dock footer redirects to login', async ({
      page,
    }) => {
      // Arrange
      await interceptAllApi(page);
      await seedAuthenticatedSession(page);
      await page.goto('/administration');
      await page.waitForLoadState('networkidle');
      await expect(page).toHaveURL(/\/administration/);

      // The desktop header sign-out is hidden at this viewport (CSS display:none).
      // Open the mobile drawer by clicking the hamburger button.
      const hamburger = page.getByRole('button', { name: 'Navigation menu' });
      await expect(hamburger).toBeVisible();
      await hamburger.click();

      // The drawer should now be open -- the dock footer sign-out becomes visible.
      const dockFooterSignOut = page.locator('.dock-footer .sign-out-btn');
      await expect(dockFooterSignOut).toBeVisible();

      // Act
      await dockFooterSignOut.click();

      // Assert
      await expect(page).toHaveURL(/\/auth\/login/);
      await expect(page).toHaveURL(/reason=logged_out/);
    });

    test('mobile sign-out clears tokens from sessionStorage', async ({ page }) => {
      // Arrange
      await interceptAllApi(page);
      await seedAuthenticatedSession(page);
      await page.goto('/administration');
      await page.waitForLoadState('networkidle');

      // Open drawer and click sign-out.
      await page.getByRole('button', { name: 'Navigation menu' }).click();
      const dockFooterSignOut = page.locator('.dock-footer .sign-out-btn');
      await expect(dockFooterSignOut).toBeVisible();
      await dockFooterSignOut.click();

      await expect(page).toHaveURL(/\/auth\/login/);

      // Assert -- tokens cleared.
      const tokens = await page.evaluate(
        ([accessKey, refreshKey]) => ({
          access: sessionStorage.getItem(accessKey),
          refresh: sessionStorage.getItem(refreshKey),
        }),
        [ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY] as const,
      );
      expect(tokens.access).toBeNull();
      expect(tokens.refresh).toBeNull();
    });
  });

  test.describe('Auth guard redirect (unauthenticated)', () => {
    test('navigating to /administration without a token redirects to /auth/login', async ({
      page,
    }) => {
      // Arrange -- intercept API but do NOT set a token.
      await interceptAllApi(page);

      // Act
      await page.goto('/administration');

      // Assert
      await expect(page).toHaveURL(/\/auth\/login/);
      await expect(page.locator('.welcome-title')).toContainText('Welcome to');
    });
  });

  test.describe('Logout API failure (graceful degradation)', () => {
    test('when the logout API returns 500, the user is still redirected to login', async ({
      page,
    }) => {
      // Arrange -- make the logout endpoint fail with 500.
      await page.route('**/api/v1/auth/logout', (route) =>
        route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Internal Server Error' }),
        }),
      );
      // All other API calls succeed.
      await interceptAllApi(page);

      await seedAuthenticatedSession(page);
      await page.goto('/administration');
      await page.waitForLoadState('networkidle');

      // Act
      await page.locator('.header-island-right .sign-out-btn').click();

      // Assert -- despite the 500, catchError in GatewayAuthFacadeService.logout()
      // ensures logoutLocal() is still called.
      await expect(page).toHaveURL(/\/auth\/login/);

      // Tokens should still be cleared.
      const tokens = await page.evaluate(
        ([accessKey, refreshKey]) => ({
          access: sessionStorage.getItem(accessKey),
          refresh: sessionStorage.getItem(refreshKey),
        }),
        [ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY] as const,
      );
      expect(tokens.access).toBeNull();
      expect(tokens.refresh).toBeNull();
    });
  });

  test.describe('Sign-out button accessibility', () => {
    test('the desktop sign-out button has the correct aria-label', async ({ page }) => {
      await interceptAllApi(page);
      await seedAuthenticatedSession(page);
      await page.goto('/administration');
      await page.waitForLoadState('networkidle');

      const signOutBtn = page.locator('.header-island-right .sign-out-btn');
      await expect(signOutBtn).toHaveAttribute('aria-label', 'Sign out');
    });

    test('the desktop sign-out button is keyboard-focusable', async ({ page }) => {
      await interceptAllApi(page);
      await seedAuthenticatedSession(page);
      await page.goto('/administration');
      await page.waitForLoadState('networkidle');

      // Tab through until we reach the sign-out button and verify it receives focus.
      const signOutBtn = page.locator('.header-island-right .sign-out-btn');
      await signOutBtn.focus();
      await expect(signOutBtn).toBeFocused();
    });
  });
});
