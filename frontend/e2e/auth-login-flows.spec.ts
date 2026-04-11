import { expect, test } from '@playwright/test';

/**
 * Auth Login Flows E2E Tests
 *
 * These tests exercise the full login lifecycle against the running auth
 * infrastructure (Angular frontend + API Gateway + auth-facade + Keycloak + LDAP).
 *
 * LDAP test users are provisioned via the auth-testing Docker Compose stack:
 *   - viewer@ems.test / ViewerPass1!  (VIEWER role)
 *   - user@ems.test   / UserPass1!    (USER role)
 *   - manager@ems.test / ManagerPass1! (MANAGER role)
 *   - admin@ems.test  / AdminPass1!   (ADMIN role)
 *
 * The tenant alias "master" maps to UUID 68cd2a56-98c9-4ed4-8534-c299566d5b27
 * which is configured in the environment files.
 *
 * Key source files:
 *   - frontend/src/app/features/auth/login.page.ts
 *   - frontend/src/app/features/auth/login.page.html
 *   - frontend/src/app/core/auth/auth.guard.ts
 *   - frontend/src/app/core/auth/gateway-auth-facade.service.ts
 *   - frontend/src/app/core/services/tenant-context.service.ts
 */

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const TENANT_ID = '68cd2a56-98c9-4ed4-8534-c299566d5b27';

const LDAP_USERS = {
  admin: { identifier: 'admin@ems.test', password: 'AdminPass1!' },
  manager: { identifier: 'manager@ems.test', password: 'ManagerPass1!' },
  user: { identifier: 'user@ems.test', password: 'UserPass1!' },
  viewer: { identifier: 'viewer@ems.test', password: 'ViewerPass1!' },
} as const;

const ACCESS_TOKEN_KEY = 'tp_access_token';
const REFRESH_TOKEN_KEY = 'tp_refresh_token';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Check whether the backend is reachable. Returns true if the API gateway
 * responds, false otherwise. Tests that require the full stack skip
 * gracefully when the backend is unavailable.
 */
async function isBackendAvailable(
  page: import('@playwright/test').Page,
  baseURL: string,
): Promise<boolean> {
  try {
    const response = await page.request.get(`${baseURL}/api/v1/auth/ui-messages`, {
      timeout: 5_000,
    });
    // Any HTTP response (even 4xx) means the gateway is up.
    return response.status() < 500 || response.status() === 501;
  } catch {
    return false;
  }
}

/**
 * Navigate to the login page and open the email sign-in form.
 * The login page initially shows a "Sign in with Email" button;
 * clicking it reveals the identifier/password/tenant form.
 */
async function navigateToLoginForm(page: import('@playwright/test').Page): Promise<void> {
  await page.goto('/auth/login');
  await page.waitForLoadState('domcontentloaded');

  // The "Sign in with Email" button opens the credential form.
  const signInWithEmailBtn = page.locator('.signin-btn');
  await expect(signInWithEmailBtn).toBeVisible({ timeout: 10_000 });
  await signInWithEmailBtn.click();

  // Wait for the form to appear.
  await expect(page.locator('.login-form')).toBeVisible();
}

/**
 * Fill in the login form fields and submit.
 */
async function fillAndSubmitLogin(
  page: import('@playwright/test').Page,
  credentials: { identifier: string; password: string; tenantId?: string },
): Promise<void> {
  await page.locator('#identifier').fill(credentials.identifier);
  await page.locator('#password').fill(credentials.password);

  // The tenant ID field may already be pre-filled from the environment default.
  // Clear and re-fill to ensure a deterministic value.
  const tenantInput = page.locator('#tenant-id');
  await tenantInput.clear();
  await tenantInput.fill(credentials.tenantId ?? TENANT_ID);

  await page.locator('.submit-btn').click();
}

/**
 * Perform a full login flow and wait until the user lands on the
 * post-login page (typically /administration).
 */
async function loginAs(
  page: import('@playwright/test').Page,
  role: keyof typeof LDAP_USERS,
): Promise<void> {
  await navigateToLoginForm(page);
  await fillAndSubmitLogin(page, LDAP_USERS[role]);
  await expect(page).toHaveURL(/\/administration/, { timeout: 15_000 });
}

/**
 * Provide the minimum API surface the app initializer needs so the login page
 * can render in validation-only tests without a live backend.
 */
async function stubLoginPageBootstrapApis(
  page: import('@playwright/test').Page,
): Promise<void> {
  await page.route('**/api/tenants/resolve', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        tenant: {
          id: TENANT_ID,
          uuid: TENANT_ID,
          shortName: 'master',
        },
      }),
    }),
  );

  await page.route('**/api/v1/auth/messages**', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([]),
    }),
  );
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

test.describe('Auth Login Flows (Full Stack)', () => {
  test.use({ baseURL: process.env['PLAYWRIGHT_BASE_URL'] ?? 'http://localhost:4200' });

  // Skip all tests in this suite if the backend is unreachable.
  test.beforeEach(async ({ page, baseURL }) => {
    const available = await isBackendAvailable(page, baseURL ?? 'http://localhost:4200');
    test.skip(!available, 'Backend is not available -- skipping full-stack login tests');
  });

  // -------------------------------------------------------------------------
  // 1. Login page renders
  // -------------------------------------------------------------------------
  test('login page renders with welcome title and sign-in button', async ({ page }) => {
    await page.goto('/auth/login');
    await page.waitForLoadState('domcontentloaded');

    // The welcome title contains the tenant name.
    await expect(page.locator('.welcome-title')).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('.welcome-title')).toContainText('Welcome to');

    // The subtitle is the tagline.
    await expect(page.locator('.welcome-subtitle')).toBeVisible();

    // The "Sign in with Email" button is present.
    await expect(page.locator('.signin-btn')).toBeVisible();
  });

  test('login form fields are present after clicking sign-in button', async ({ page }) => {
    await navigateToLoginForm(page);

    // Verify all three input fields exist.
    await expect(page.locator('#identifier')).toBeVisible();
    await expect(page.locator('#password')).toBeVisible();
    await expect(page.locator('#tenant-id')).toBeVisible();

    // Verify the submit button.
    await expect(page.locator('.submit-btn')).toBeVisible();

    // Verify the back button.
    await expect(page.locator('.back-btn')).toBeVisible();
  });

  // -------------------------------------------------------------------------
  // 2. Successful login with LDAP user
  // -------------------------------------------------------------------------
  test('successful login with LDAP admin user redirects to administration', async ({ page }) => {
    await navigateToLoginForm(page);
    await fillAndSubmitLogin(page, LDAP_USERS.admin);

    // After successful login the app redirects to /administration.
    await expect(page).toHaveURL(/\/administration/, { timeout: 15_000 });

    // Verify tokens are stored in sessionStorage.
    const tokens = await page.evaluate(
      ([accessKey, refreshKey]) => ({
        access: sessionStorage.getItem(accessKey),
        refresh: sessionStorage.getItem(refreshKey),
      }),
      [ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY] as const,
    );
    expect(tokens.access).toBeTruthy();
  });

  test('successful login with LDAP viewer user redirects to administration', async ({ page }) => {
    await navigateToLoginForm(page);
    await fillAndSubmitLogin(page, LDAP_USERS.viewer);

    await expect(page).toHaveURL(/\/administration/, { timeout: 15_000 });
  });

  // -------------------------------------------------------------------------
  // 3. Failed login with wrong password
  // -------------------------------------------------------------------------
  test('failed login with wrong password shows error message', async ({ page }) => {
    await navigateToLoginForm(page);
    await fillAndSubmitLogin(page, {
      identifier: LDAP_USERS.admin.identifier,
      password: 'WrongPassword123!',
    });

    // An error banner should appear.
    const errorBanner = page.locator('.tp-banner-error');
    await expect(errorBanner).toBeVisible({ timeout: 10_000 });

    // The URL should still be the login page.
    await expect(page).toHaveURL(/\/auth\/login/);
  });

  // -------------------------------------------------------------------------
  // 4. Failed login with non-existent user
  // -------------------------------------------------------------------------
  test('failed login with non-existent user shows error message', async ({ page }) => {
    await navigateToLoginForm(page);
    await fillAndSubmitLogin(page, {
      identifier: 'nonexistent@ems.test',
      password: 'SomePassword1!',
    });

    const errorBanner = page.locator('.tp-banner-error');
    await expect(errorBanner).toBeVisible({ timeout: 10_000 });

    // Remain on login page.
    await expect(page).toHaveURL(/\/auth\/login/);
  });

  // -------------------------------------------------------------------------
  // 5. Login preserves return URL
  // -------------------------------------------------------------------------
  test('login preserves returnUrl and redirects back after authentication', async ({ page }) => {
    // Navigate to a protected page (e.g., /tenants) without being authenticated.
    // The auth guard should redirect to /auth/login?returnUrl=%2Ftenants.
    await page.goto('/tenants');
    await expect(page).toHaveURL(/\/auth\/login/, { timeout: 10_000 });
    await expect(page).toHaveURL(/returnUrl/);

    // Now log in.
    const signInWithEmailBtn = page.locator('.signin-btn');
    await expect(signInWithEmailBtn).toBeVisible({ timeout: 10_000 });
    await signInWithEmailBtn.click();
    await expect(page.locator('.login-form')).toBeVisible();

    await fillAndSubmitLogin(page, LDAP_USERS.admin);

    // After login, the app should redirect to the originally requested URL.
    await expect(page).toHaveURL(/\/tenants/, { timeout: 15_000 });
  });

  // -------------------------------------------------------------------------
  // 6. Logout clears session
  // -------------------------------------------------------------------------
  test('logout clears session and redirects to login page', async ({ page }) => {
    // Log in first.
    await loginAs(page, 'admin');

    // Verify we are on the administration page.
    await expect(page).toHaveURL(/\/administration/);

    // Click the sign-out button in the header.
    const signOutBtn = page.locator('.header-island-right .sign-out-btn');
    await expect(signOutBtn).toBeVisible();
    await signOutBtn.click();

    // Should redirect to login with logout query params.
    await expect(page).toHaveURL(/\/(auth\/)?login/, { timeout: 10_000 });
    await expect(page).toHaveURL(/loggedOut=1/);

    // Tokens should be cleared.
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

  // -------------------------------------------------------------------------
  // 7. Auth guard blocks unauthenticated access
  // -------------------------------------------------------------------------
  test('auth guard redirects unauthenticated user from /administration to /auth/login', async ({
    page,
  }) => {
    // Do not log in. Navigate directly to a protected route.
    await page.goto('/administration');

    await expect(page).toHaveURL(/\/(auth\/)?login/, { timeout: 10_000 });
    await expect(page.locator('.welcome-title')).toBeVisible();
  });

  test('auth guard redirects unauthenticated user from /tenants to /auth/login with returnUrl', async ({
    page,
  }) => {
    await page.goto('/tenants');

    await expect(page).toHaveURL(/\/(auth\/)?login/, { timeout: 10_000 });
    await expect(page).toHaveURL(/returnUrl=%2Ftenants/);
  });

  // -------------------------------------------------------------------------
  // 8. Password visibility toggle
  // -------------------------------------------------------------------------
  test('password visibility toggle changes input type between password and text', async ({
    page,
  }) => {
    await navigateToLoginForm(page);

    const passwordInput = page.locator('#password');
    const toggleBtn = page.locator('.password-toggle');

    // Initially the password field should be of type "password".
    await expect(passwordInput).toHaveAttribute('type', 'password');

    // Click the toggle to show the password.
    await toggleBtn.click();
    await expect(passwordInput).toHaveAttribute('type', 'text');

    // The toggle button aria-label should indicate "Hide password".
    await expect(toggleBtn).toHaveAttribute('aria-label', 'Hide password');

    // Click again to hide.
    await toggleBtn.click();
    await expect(passwordInput).toHaveAttribute('type', 'password');

    // The toggle button aria-label should indicate "Show password".
    await expect(toggleBtn).toHaveAttribute('aria-label', 'Show password');
  });
});

// ---------------------------------------------------------------------------
// Client-side validation tests (no backend required)
// ---------------------------------------------------------------------------

test.describe('Auth Login Flows (Client-Side Validation)', () => {
  test.use({ baseURL: process.env['PLAYWRIGHT_BASE_URL'] ?? 'http://localhost:4200' });

  // Mock only the initializer dependencies; blanket API stubs break app boot.
  test.beforeEach(async ({ page }) => {
    await stubLoginPageBootstrapApis(page);
  });

  test('submitting empty identifier and password shows client-side validation error', async ({
    page,
  }) => {
    await navigateToLoginForm(page);

    // Submit with empty fields.
    await page.locator('.submit-btn').click();

    // The component sets error to AUTH-C-004: "Email or username and password are required."
    const errorBanner = page.locator('.tp-banner-error');
    await expect(errorBanner).toBeVisible();
    await expect(errorBanner).toContainText('required');
  });

  test('submitting empty tenant ID shows client-side validation error', async ({ page }) => {
    await navigateToLoginForm(page);

    // Fill identifier and password but clear tenant ID.
    await page.locator('#identifier').fill('admin@ems.test');
    await page.locator('#password').fill('AdminPass1!');
    await page.locator('#tenant-id').clear();

    await page.locator('.submit-btn').click();

    // AUTH-C-005: "Tenant ID is required."
    const errorBanner = page.locator('.tp-banner-error');
    await expect(errorBanner).toBeVisible();
    await expect(errorBanner).toContainText('Tenant');
  });

  test('submitting invalid tenant ID format shows client-side validation error', async ({
    page,
  }) => {
    await navigateToLoginForm(page);

    await page.locator('#identifier').fill('admin@ems.test');
    await page.locator('#password').fill('AdminPass1!');
    await page.locator('#tenant-id').clear();
    await page.locator('#tenant-id').fill('not-a-uuid-or-alias');

    await page.locator('.submit-btn').click();

    // AUTH-C-006: "Tenant ID must be a UUID or a recognized tenant alias."
    const errorBanner = page.locator('.tp-banner-error');
    await expect(errorBanner).toBeVisible();
    await expect(errorBanner).toContainText('UUID');
  });

  test('back button closes the email sign-in form', async ({ page }) => {
    await navigateToLoginForm(page);

    // The form is visible.
    await expect(page.locator('.login-form')).toBeVisible();

    // Click back.
    await page.locator('.back-btn').click();

    // The form should be hidden and the "Sign in with Email" button visible again.
    await expect(page.locator('.login-form')).not.toBeVisible();
    await expect(page.locator('.signin-btn')).toBeVisible();
  });
});
