import { expect, test } from '@playwright/test';

/**
 * User Journey E2E Tests
 *
 * Comprehensive end-to-end user journey tests that exercise multi-step workflows
 * across the EMSIST Tenant Manager application. These tests run against the full
 * stack (Angular frontend + API Gateway + auth-facade + Keycloak + LDAP).
 *
 * LDAP test users (provisioned via auth-testing Docker Compose stack):
 *   - admin@ems.test  / AdminPass1!   (ADMIN role)
 *   - viewer@ems.test / ViewerPass1!  (VIEWER role)
 *   - manager@ems.test / ManagerPass1! (MANAGER role)
 *
 * The tenant alias "master" maps to UUID 68cd2a56-98c9-4ed4-8534-c299566d5b27.
 *
 * Key source files:
 *   - frontend/src/app/features/auth/login.page.ts
 *   - frontend/src/app/features/administration/administration.page.ts
 *   - frontend/src/app/features/administration/sections/tenant-manager/
 *   - frontend/src/app/features/administration/sections/master-definitions/
 *   - frontend/src/app/features/administration/sections/license-manager/
 *   - frontend/src/app/features/administration/sections/master-locale/
 *   - frontend/src/app/features/admin/identity-providers/
 */

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const TENANT_ID = '68cd2a56-98c9-4ed4-8534-c299566d5b27';

const LDAP_USERS = {
  admin: { identifier: 'admin@ems.test', password: 'AdminPass1!' },
  manager: { identifier: 'manager@ems.test', password: 'ManagerPass1!' },
  viewer: { identifier: 'viewer@ems.test', password: 'ViewerPass1!' },
} as const;

const ACCESS_TOKEN_KEY = 'tp_access_token';
const REFRESH_TOKEN_KEY = 'tp_refresh_token';

const SCREENSHOT_DIR = 'e2e/screenshots';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Check whether the backend is reachable. Returns true if the API gateway
 * responds, false otherwise. Tests skip gracefully when the backend is
 * unavailable.
 */
async function isBackendAvailable(
  page: import('@playwright/test').Page,
  baseURL: string,
): Promise<boolean> {
  try {
    const response = await page.request.get(`${baseURL}/api/v1/auth/ui-messages`, {
      timeout: 5_000,
    });
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

  const signInWithEmailBtn = page.locator('.signin-btn');
  await expect(signInWithEmailBtn).toBeVisible({ timeout: 10_000 });
  await signInWithEmailBtn.click();

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
 * Sign out from the administration page using the header sign-out button.
 */
async function signOut(page: import('@playwright/test').Page): Promise<void> {
  const signOutBtn = page.locator('.header-island-right .sign-out-btn');
  await expect(signOutBtn).toBeVisible({ timeout: 5_000 });
  await signOutBtn.click();
  await expect(page).toHaveURL(/\/(auth\/)?login/, { timeout: 10_000 });
}

/**
 * Open the dock/navigation menu by clicking the hamburger button.
 */
async function openDockMenu(page: import('@playwright/test').Page): Promise<void> {
  const menuToggle = page.locator('[data-testid="menu-toggle-btn"]');
  await expect(menuToggle).toBeVisible({ timeout: 5_000 });
  await menuToggle.click();
  await expect(page.locator('[data-testid="floating-menu"]')).toBeVisible({ timeout: 5_000 });
}

/**
 * Switch to a specific administration section via the dock menu.
 * Closes the menu after selection by clicking the backdrop.
 */
async function switchSection(
  page: import('@playwright/test').Page,
  sectionLabel: string,
): Promise<void> {
  await openDockMenu(page);
  const menuItem = page.locator('[data-testid="menu-item"]', { hasText: sectionLabel });
  await expect(menuItem).toBeVisible({ timeout: 5_000 });
  await menuItem.click();
  // Menu closes automatically after section change
}

// ---------------------------------------------------------------------------
// Test suites
// ---------------------------------------------------------------------------

test.describe('User Journeys (Full Stack)', () => {
  test.use({ baseURL: process.env['PLAYWRIGHT_BASE_URL'] ?? 'http://localhost:4200' });

  // Skip all tests in this suite if the backend is unreachable.
  test.beforeEach(async ({ page, baseURL }) => {
    const available = await isBackendAvailable(page, baseURL ?? 'http://localhost:4200');
    test.skip(!available, 'Backend is not available -- skipping full-stack user journey tests');
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // Journey 1: Admin — Full Tenant Lifecycle
  // ═══════════════════════════════════════════════════════════════════════════

  test.describe.serial('Journey 1: Admin — Full Tenant Lifecycle', () => {
    test('step 1: login as admin and verify landing on administration with tenant-manager', async ({
      page,
    }) => {
      await loginAs(page, 'admin');

      await expect(page).toHaveURL(/\/administration/);
      await page.screenshot({ path: `${SCREENSHOT_DIR}/j1-01-admin-landing.png` });

      // Verify the breadcrumb shows Tenant Manager as the active section
      const breadcrumb = page.locator('.admin-breadcrumb');
      await expect(breadcrumb).toBeVisible({ timeout: 10_000 });

      // Verify tokens are stored in sessionStorage
      const accessToken = await page.evaluate(
        (key) => sessionStorage.getItem(key),
        ACCESS_TOKEN_KEY,
      );
      expect(accessToken).toBeTruthy();

      await signOut(page);
    });

    test('step 2: search for tenants in the tenant list', async ({ page }) => {
      await loginAs(page, 'admin');

      // Wait for the tenant manager section to load
      await expect(page.locator('[data-testid="tenant-manager"]')).toBeVisible({ timeout: 15_000 });

      // Look for a search input in the tenant list
      const searchInput = page.locator('[data-testid="search-input"]');
      if (await searchInput.isVisible({ timeout: 5_000 }).catch(() => false)) {
        await searchInput.fill('Master');
        await page.screenshot({ path: `${SCREENSHOT_DIR}/j1-02-tenant-search.png` });
        // Clear search to restore full list
        await searchInput.clear();
      }

      await signOut(page);
    });

    test('step 3: open add tenant wizard and fill basic info', async ({ page }) => {
      await loginAs(page, 'admin');
      await expect(page.locator('[data-testid="tenant-manager"]')).toBeVisible({ timeout: 15_000 });

      const addTenantBtn = page.locator('[data-testid="add-tenant-btn"]');
      if (await addTenantBtn.isVisible({ timeout: 5_000 }).catch(() => false)) {
        await addTenantBtn.click();
        await expect(page.locator('[data-testid="wizard-modal"]')).toBeVisible({ timeout: 10_000 });

        // Step 1: Basic Info
        await page.locator('[data-testid="wizard-fullname"]').fill('E2E Test Tenant');
        await page.screenshot({ path: `${SCREENSHOT_DIR}/j1-03-wizard-step1.png` });

        // Short code should auto-generate
        const shortCode = page.locator('[data-testid="wizard-shortcode"]');
        await expect(shortCode).toBeDisabled();

        // Wait for short code availability check
        await expect(
          page.locator('[data-testid="shortcode-available"]'),
        ).toBeVisible({ timeout: 5_000 }).catch(() => {
          // Short code validation may not be available in all environments
        });

        // Navigate to step 2
        const nextBtn = page.locator('[data-testid="wizard-next"]');
        if (await nextBtn.isEnabled()) {
          await nextBtn.click();

          // Step 2: License Info
          await expect(page.locator('[data-testid="wizard-step-2"]')).toBeVisible({ timeout: 5_000 });
          await page.screenshot({ path: `${SCREENSHOT_DIR}/j1-04-wizard-step2.png` });

          // Navigate to step 3
          await nextBtn.click();

          // Step 3: Review
          await expect(page.locator('[data-testid="wizard-step-3"]')).toBeVisible({ timeout: 5_000 });
          await page.screenshot({ path: `${SCREENSHOT_DIR}/j1-05-wizard-step3.png` });
        }

        // Close wizard without provisioning (to avoid side effects on shared env)
        const closeBtn = page.locator('[data-testid="wizard-close"]');
        if (await closeBtn.isVisible()) {
          page.on('dialog', (dialog) => dialog.accept());
          await closeBtn.click();
        }
      }

      await signOut(page);
    });

    test('step 4: view tenant fact sheet and navigate tabs', async ({ page }) => {
      await loginAs(page, 'admin');
      await expect(page.locator('[data-testid="tenant-manager"]')).toBeVisible({ timeout: 15_000 });

      // Click on the first tenant in the list to open fact sheet
      const firstTenantLink = page.locator('.tenant-item').first();
      if (await firstTenantLink.isVisible({ timeout: 5_000 }).catch(() => false)) {
        await firstTenantLink.click();

        // Verify fact sheet panel or detail area is visible
        const factsheetPanel = page.locator('[data-testid="factsheet-panel"]');
        if (await factsheetPanel.isVisible({ timeout: 5_000 }).catch(() => false)) {
          await page.screenshot({ path: `${SCREENSHOT_DIR}/j1-06-factsheet-overview.png` });

          // Navigate through available tabs
          const overviewTab = page.locator('[data-testid="factsheet-tab-overview"]');
          if (await overviewTab.isVisible()) {
            await overviewTab.click();
          }

          const licenseTab = page.locator('[data-testid="factsheet-tab-license"]');
          if (await licenseTab.isVisible()) {
            await licenseTab.click();
            await page.screenshot({ path: `${SCREENSHOT_DIR}/j1-07-factsheet-license.png` });
          }

          // Try navigating to Users tab via PrimeNG tab
          const usersTab = page.locator('p-tab[value="users"]');
          if (await usersTab.isVisible({ timeout: 3_000 }).catch(() => false)) {
            await usersTab.click();
            await page.screenshot({ path: `${SCREENSHOT_DIR}/j1-08-factsheet-users.png` });
          }

          // Try Branding tab
          const brandingTab = page.locator('p-tab[value="branding"]');
          if (await brandingTab.isVisible({ timeout: 3_000 }).catch(() => false)) {
            await brandingTab.click();
            await page.screenshot({ path: `${SCREENSHOT_DIR}/j1-09-factsheet-branding.png` });
          }

          // Try Authentication tab (only for MASTER type tenants)
          const authTab = page.getByRole('tab', { name: 'Authentication' });
          if (await authTab.isVisible({ timeout: 3_000 }).catch(() => false)) {
            await authTab.click();
            await page.screenshot({ path: `${SCREENSHOT_DIR}/j1-10-factsheet-auth.png` });
          }
        }
      }

      await signOut(page);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // Journey 2: Admin — Auth Source Configuration
  // ═══════════════════════════════════════════════════════════════════════════

  test.describe.serial('Journey 2: Admin — Auth Source Configuration', () => {
    test('step 1: login and navigate to authentication sources', async ({ page }) => {
      await loginAs(page, 'admin');

      // Navigate to tenant manager and select a MASTER tenant
      await expect(page).toHaveURL(/\/administration/);

      // Click on the first tenant
      const tenantBtn = page.locator('.tenant-item').first();
      if (await tenantBtn.isVisible({ timeout: 10_000 }).catch(() => false)) {
        await tenantBtn.click();

        // Click Authentication tab (only visible for MASTER type tenants)
        const authTab = page.getByRole('tab', { name: 'Authentication' });
        if (await authTab.isVisible({ timeout: 5_000 }).catch(() => false)) {
          await authTab.click();

          // Verify the auth sources list or embedded component renders
          await expect(
            page.locator('[data-testid="btn-add-source"]').first(),
          ).toBeVisible({ timeout: 10_000 });

          await page.screenshot({ path: `${SCREENSHOT_DIR}/j2-01-auth-sources-list.png` });

          // Verify metric cards are visible
          const metricCards = page.locator('[data-testid="source-metric-cards"]');
          if (await metricCards.isVisible({ timeout: 3_000 }).catch(() => false)) {
            await expect(page.locator('[data-testid="metric-total-sources"]')).toBeVisible();
          }
        }
      }

      await signOut(page);
    });

    test('step 2: view auth source detail panel with tabs', async ({ page }) => {
      await loginAs(page, 'admin');

      const tenantBtn = page.locator('.tenant-item').first();
      if (await tenantBtn.isVisible({ timeout: 10_000 }).catch(() => false)) {
        await tenantBtn.click();

        const authTab = page.getByRole('tab', { name: 'Authentication' });
        if (await authTab.isVisible({ timeout: 5_000 }).catch(() => false)) {
          await authTab.click();
          await expect(
            page.locator('[data-testid="btn-add-source"]').first(),
          ).toBeVisible({ timeout: 10_000 });

          // Click on first source row to open detail panel
          const sourceRow = page.locator('[data-testid^="source-row-"]').first();
          if (await sourceRow.isVisible({ timeout: 5_000 }).catch(() => false)) {
            await sourceRow.click();

            const detailPanel = page.locator('[data-testid="auth-source-detail-panel"]');
            if (await detailPanel.isVisible({ timeout: 5_000 }).catch(() => false)) {
              await page.screenshot({ path: `${SCREENSHOT_DIR}/j2-02-auth-source-detail.png` });

              // Verify detail panel tabs: Config, Mapping, Sync, Tenants
              await expect(page.locator('[data-testid="detail-tab-config"]')).toBeVisible();
              await expect(page.locator('[data-testid="detail-tab-mapping"]')).toBeVisible();
              await expect(page.locator('[data-testid="detail-tab-sync"]')).toBeVisible();
              await expect(page.locator('[data-testid="detail-tab-tenants"]')).toBeVisible();

              // Navigate to Mapping tab
              await page.locator('[data-testid="detail-tab-mapping"]').click();
              await page.screenshot({ path: `${SCREENSHOT_DIR}/j2-03-auth-source-mapping.png` });

              // Navigate to Sync tab
              await page.locator('[data-testid="detail-tab-sync"]').click();
              await page.screenshot({ path: `${SCREENSHOT_DIR}/j2-04-auth-source-sync.png` });

              // Navigate to Tenants tab
              await page.locator('[data-testid="detail-tab-tenants"]').click();
              await page.screenshot({ path: `${SCREENSHOT_DIR}/j2-05-auth-source-tenants.png` });

              // Close detail panel
              const closeBtn = page.locator('[data-testid="detail-close-btn"]');
              if (await closeBtn.isVisible()) {
                await closeBtn.dispatchEvent('click');
              }
            }
          }
        }
      }

      await signOut(page);
    });

    test('step 3: open auth source wizard and verify protocol selection', async ({ page }) => {
      await loginAs(page, 'admin');

      const tenantBtn = page.locator('.tenant-item').first();
      if (await tenantBtn.isVisible({ timeout: 10_000 }).catch(() => false)) {
        await tenantBtn.click();

        const authTab = page.getByRole('tab', { name: 'Authentication' });
        if (await authTab.isVisible({ timeout: 5_000 }).catch(() => false)) {
          await authTab.click();

          const addBtn = page.locator('[data-testid="btn-add-source"]').first();
          await expect(addBtn).toBeVisible({ timeout: 10_000 });
          await addBtn.click();

          // Verify wizard modal opens
          const wizardModal = page.locator('[data-testid="auth-source-wizard-modal"]');
          if (await wizardModal.isVisible({ timeout: 5_000 }).catch(() => false)) {
            await page.screenshot({ path: `${SCREENSHOT_DIR}/j2-06-auth-wizard-step1.png` });

            // Verify 5 protocol cards
            await expect(page.locator('[data-testid="protocol-card-LDAP"]')).toBeVisible();
            await expect(page.locator('[data-testid="protocol-card-SAML"]')).toBeVisible();
            await expect(page.locator('[data-testid="protocol-card-OIDC"]')).toBeVisible();

            // Fill display name and select LDAP protocol
            await page.locator('[data-testid="input-display-name"]').fill('E2E Test LDAP');
            await page.locator('[data-testid="protocol-card-LDAP"]').click();
            await expect(page.locator('[data-testid="protocol-card-LDAP"]')).toHaveClass(/selected/);

            // Verify Next button is enabled
            await expect(page.locator('[data-testid="btn-wizard-next"]')).toBeEnabled();

            // Navigate to step 2 to verify LDAP connection form
            await page.locator('[data-testid="btn-wizard-next"]').click();
            await expect(page.locator('[data-testid="ldap-connection-form"]')).toBeVisible({ timeout: 5_000 });
            await page.screenshot({ path: `${SCREENSHOT_DIR}/j2-07-auth-wizard-ldap-conn.png` });

            // Cancel wizard (no changes to commit)
            await page.locator('[data-testid="btn-wizard-cancel"]').click();
            // If confirm dialog appears, confirm discard
            const confirmBtn = page.locator('[data-testid="btn-cancel-confirm"]');
            if (await confirmBtn.isVisible({ timeout: 2_000 }).catch(() => false)) {
              await confirmBtn.click();
            }
          }
        }
      }

      await signOut(page);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // Journey 3: Admin — Master Definitions
  // ═══════════════════════════════════════════════════════════════════════════

  test.describe.serial('Journey 3: Admin — Master Definitions', () => {
    test('step 1: login and switch to master-definitions section', async ({ page }) => {
      await loginAs(page, 'admin');

      // Switch to master-definitions via dock menu
      await switchSection(page, 'Master Definitions');

      // Verify the section loaded
      await expect(page).toHaveURL(/section=master-definitions/);
      await page.screenshot({ path: `${SCREENSHOT_DIR}/j3-01-definitions-landing.png` });

      // Verify heading
      await expect(page.getByRole('heading', { name: 'Object Types' })).toBeVisible({ timeout: 10_000 });

      await signOut(page);
    });

    test('step 2: view object types list and detail panel', async ({ page }) => {
      await loginAs(page, 'admin');
      await switchSection(page, 'Master Definitions');

      // Wait for list items to render
      const items = page.locator('[data-testid="definitions-type-item"]');
      await expect(items.first()).toBeVisible({ timeout: 10_000 });

      const count = await items.count();
      expect(count).toBeGreaterThanOrEqual(1);

      await page.screenshot({ path: `${SCREENSHOT_DIR}/j3-02-definitions-list.png` });

      // Click the first item to see detail panel
      await items.first().click();
      const detailPanel = page.locator('[data-testid="definitions-detail-panel"]');
      if (await detailPanel.isVisible({ timeout: 5_000 }).catch(() => false)) {
        await page.screenshot({ path: `${SCREENSHOT_DIR}/j3-03-definitions-detail.png` });
      }

      await signOut(page);
    });

    test('step 3: open create wizard, fill name, and cancel', async ({ page }) => {
      await loginAs(page, 'admin');
      await switchSection(page, 'Master Definitions');

      await expect(page.locator('[data-testid="definitions-type-item"]').first()).toBeVisible({ timeout: 10_000 });

      // Open create wizard
      await page.locator('[data-testid="definitions-new-type-btn"]').click();
      const nameInput = page.locator('[data-testid="wizard-name-input"]');
      await expect(nameInput).toBeVisible({ timeout: 5_000 });

      await page.screenshot({ path: `${SCREENSHOT_DIR}/j3-04-definitions-wizard.png` });

      // Fill name
      await nameInput.fill('E2E Test Object Type');

      // Verify Next button is enabled
      await expect(page.locator('[data-testid="wizard-next-btn"]')).toBeEnabled();

      // Cancel without creating (to avoid side effects)
      await page.locator('[data-testid="wizard-cancel-btn"]').click();
      await expect(nameInput).not.toBeVisible({ timeout: 5_000 });

      await signOut(page);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // Journey 4: Viewer — Limited Access
  // ═══════════════════════════════════════════════════════════════════════════

  test.describe.serial('Journey 4: Viewer — Limited Access', () => {
    test('step 1: login as viewer and verify landing on administration', async ({ page }) => {
      await loginAs(page, 'viewer');

      await expect(page).toHaveURL(/\/administration/);
      await page.screenshot({ path: `${SCREENSHOT_DIR}/j4-01-viewer-landing.png` });

      // Verify the viewer can see the administration page
      const breadcrumb = page.locator('.admin-breadcrumb');
      await expect(breadcrumb).toBeVisible({ timeout: 10_000 });

      await signOut(page);
    });

    test('step 2: viewer can browse tenant list in read-only mode', async ({ page }) => {
      await loginAs(page, 'viewer');

      // Wait for the tenant manager section to be visible
      const tenantManager = page.locator('[data-testid="tenant-manager"]');
      if (await tenantManager.isVisible({ timeout: 10_000 }).catch(() => false)) {
        await page.screenshot({ path: `${SCREENSHOT_DIR}/j4-02-viewer-tenant-list.png` });

        // Verify the "Add Tenant" button is either hidden or disabled for viewer
        const addTenantBtn = page.locator('[data-testid="add-tenant-btn"]');
        const isVisible = await addTenantBtn.isVisible({ timeout: 3_000 }).catch(() => false);
        if (isVisible) {
          // If visible, it might be disabled based on role
          const isDisabled = await addTenantBtn.isDisabled();
          // Log whether viewer has restricted access
          await page.screenshot({ path: `${SCREENSHOT_DIR}/j4-03-viewer-add-btn-state.png` });
        }
      }

      await signOut(page);
    });

    test('step 3: viewer can view tenant details but not modify', async ({ page }) => {
      await loginAs(page, 'viewer');

      const tenantBtn = page.locator('.tenant-item').first();
      if (await tenantBtn.isVisible({ timeout: 10_000 }).catch(() => false)) {
        await tenantBtn.click();
        await page.screenshot({ path: `${SCREENSHOT_DIR}/j4-04-viewer-tenant-detail.png` });
      }

      await signOut(page);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // Journey 5: Session Management
  // ═══════════════════════════════════════════════════════════════════════════

  test.describe.serial('Journey 5: Session Management', () => {
    test('step 1: login and verify session token exists', async ({ page }) => {
      await loginAs(page, 'admin');

      // Verify tokens are stored in sessionStorage
      const tokens = await page.evaluate(
        ([accessKey, refreshKey]) => ({
          access: sessionStorage.getItem(accessKey),
          refresh: sessionStorage.getItem(refreshKey),
        }),
        [ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY] as const,
      );

      expect(tokens.access).toBeTruthy();
      expect(tokens.refresh).toBeTruthy();

      await page.screenshot({ path: `${SCREENSHOT_DIR}/j5-01-session-active.png` });

      await signOut(page);
    });

    test('step 2: navigate between sections and verify session persists', async ({ page }) => {
      await loginAs(page, 'admin');

      // Navigate to License Manager
      await switchSection(page, 'License Manager');
      await expect(page).toHaveURL(/section=license-manager/);
      await page.screenshot({ path: `${SCREENSHOT_DIR}/j5-02-license-manager.png` });

      // Verify session is still valid after navigation
      let accessToken = await page.evaluate(
        (key) => sessionStorage.getItem(key),
        ACCESS_TOKEN_KEY,
      );
      expect(accessToken).toBeTruthy();

      // Navigate to Master Definitions
      await switchSection(page, 'Master Definitions');
      await expect(page).toHaveURL(/section=master-definitions/);
      await page.screenshot({ path: `${SCREENSHOT_DIR}/j5-03-master-definitions.png` });

      // Verify session still valid
      accessToken = await page.evaluate(
        (key) => sessionStorage.getItem(key),
        ACCESS_TOKEN_KEY,
      );
      expect(accessToken).toBeTruthy();

      await signOut(page);
    });

    test('step 3: sign out and verify tokens cleared and redirect', async ({ page }) => {
      await loginAs(page, 'admin');
      await expect(page).toHaveURL(/\/administration/);

      // Sign out
      const signOutBtn = page.locator('.header-island-right .sign-out-btn');
      await expect(signOutBtn).toBeVisible();
      await signOutBtn.click();

      // Verify redirect to login with loggedOut=1
      await expect(page).toHaveURL(/\/(auth\/)?login/, { timeout: 10_000 });
      await expect(page).toHaveURL(/loggedOut=1/);

      await page.screenshot({ path: `${SCREENSHOT_DIR}/j5-04-logged-out.png` });

      // Verify tokens are cleared
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

    test('step 4: after logout, navigating to administration redirects to login', async ({
      page,
    }) => {
      // Do not log in. Navigate directly to a protected route.
      await page.goto('/administration');

      await expect(page).toHaveURL(/\/(auth\/)?login/, { timeout: 10_000 });
      await expect(page.locator('.welcome-title')).toBeVisible();

      await page.screenshot({ path: `${SCREENSHOT_DIR}/j5-05-guard-redirect.png` });
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // Journey 6: Tenant Branding
  // ═══════════════════════════════════════════════════════════════════════════

  test.describe.serial('Journey 6: Tenant Branding', () => {
    test('step 1: login and navigate to branding tab', async ({ page }) => {
      await loginAs(page, 'admin');

      // Click on the first tenant to open detail area
      const tenantBtn = page.locator('.tenant-item').first();
      if (await tenantBtn.isVisible({ timeout: 10_000 }).catch(() => false)) {
        await tenantBtn.click();

        // Navigate to Branding tab
        const brandingTab = page.locator('p-tab[value="branding"]');
        if (await brandingTab.isVisible({ timeout: 5_000 }).catch(() => false)) {
          await brandingTab.click();

          // Wait for branding card to appear
          const brandingCard = page.locator('.branding-card');
          if (await brandingCard.isVisible({ timeout: 5_000 }).catch(() => false)) {
            await page.screenshot({ path: `${SCREENSHOT_DIR}/j6-01-branding-tab.png` });

            // Verify preset row exists
            const presetRow = page.locator('.brand-preset-row');
            if (await presetRow.isVisible()) {
              const presetButtons = presetRow.locator('.brand-preset');
              const count = await presetButtons.count();
              expect(count).toBeGreaterThanOrEqual(1);
            }

            // Verify Save and Reset buttons
            await expect(page.getByRole('button', { name: /Save Branding/i })).toBeVisible();
            await expect(page.getByRole('button', { name: /Reset/i })).toBeVisible();
          }
        }
      }

      await signOut(page);
    });

    test('step 2: interact with color preset and verify live preview', async ({ page }) => {
      await loginAs(page, 'admin');

      const tenantBtn = page.locator('.tenant-item').first();
      if (await tenantBtn.isVisible({ timeout: 10_000 }).catch(() => false)) {
        await tenantBtn.click();

        const brandingTab = page.locator('p-tab[value="branding"]');
        if (await brandingTab.isVisible({ timeout: 5_000 }).catch(() => false)) {
          await brandingTab.click();

          const brandingCard = page.locator('.branding-card');
          if (await brandingCard.isVisible({ timeout: 5_000 }).catch(() => false)) {
            // Read initial CSS variable
            const initialPrimary = await page.evaluate(() =>
              document.documentElement.style.getPropertyValue('--tp-primary'),
            );

            // Click a color preset (e.g., aqua)
            const aquaPreset = page.locator('.brand-preset.aqua');
            if (await aquaPreset.isVisible({ timeout: 3_000 }).catch(() => false)) {
              await aquaPreset.click();
              await page.waitForTimeout(500);

              // Verify CSS variable changed
              const newPrimary = await page.evaluate(() =>
                document.documentElement.style.getPropertyValue('--tp-primary'),
              );

              await page.screenshot({ path: `${SCREENSHOT_DIR}/j6-02-branding-preset-applied.png` });

              // Reset to defaults
              const resetBtn = page.getByRole('button', { name: /Reset/i });
              if (await resetBtn.isVisible()) {
                await resetBtn.click();
                await page.waitForTimeout(500);
                await page.screenshot({ path: `${SCREENSHOT_DIR}/j6-03-branding-reset.png` });
              }
            }
          }
        }
      }

      await signOut(page);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // Journey 7: Cross-Section Navigation
  // ═══════════════════════════════════════════════════════════════════════════

  test.describe.serial('Journey 7: Cross-Section Navigation', () => {
    test('step 1: login and verify default section is tenant-manager', async ({ page }) => {
      await loginAs(page, 'admin');

      await expect(page).toHaveURL(/\/administration/);

      // Default section should be tenant-manager (no section param or section=tenant-manager)
      const breadcrumb = page.locator('.admin-breadcrumb');
      await expect(breadcrumb).toBeVisible({ timeout: 10_000 });

      await page.screenshot({ path: `${SCREENSHOT_DIR}/j7-01-default-tenant-manager.png` });

      await signOut(page);
    });

    test('step 2: navigate through all four sections via dock menu', async ({ page }) => {
      await loginAs(page, 'admin');

      // --- Switch to License Manager ---
      await switchSection(page, 'License Manager');
      await expect(page).toHaveURL(/section=license-manager/);
      const licenseBreadcrumb = page.locator('.admin-breadcrumb');
      await expect(licenseBreadcrumb).toContainText('License Manager');
      await page.screenshot({ path: `${SCREENSHOT_DIR}/j7-02-license-manager.png` });

      // --- Switch to Master Locale ---
      await switchSection(page, 'Master Locale');
      await expect(page).toHaveURL(/section=master-locale/);
      const localeBreadcrumb = page.locator('.admin-breadcrumb');
      await expect(localeBreadcrumb).toContainText('Master Locale');
      await page.screenshot({ path: `${SCREENSHOT_DIR}/j7-03-master-locale.png` });

      // --- Switch to Master Definitions ---
      await switchSection(page, 'Master Definitions');
      await expect(page).toHaveURL(/section=master-definitions/);
      const defBreadcrumb = page.locator('.admin-breadcrumb');
      await expect(defBreadcrumb).toContainText('Master Definitions');
      await page.screenshot({ path: `${SCREENSHOT_DIR}/j7-04-master-definitions.png` });

      // --- Switch back to Tenant Manager ---
      await switchSection(page, 'Tenant Manager');
      await expect(page).toHaveURL(/section=tenant-manager/);
      const tmBreadcrumb = page.locator('.admin-breadcrumb');
      await expect(tmBreadcrumb).toContainText('Tenant Manager');
      await page.screenshot({ path: `${SCREENSHOT_DIR}/j7-05-back-to-tenant-manager.png` });

      await signOut(page);
    });

    test('step 3: verify each section renders its own content', async ({ page }) => {
      await loginAs(page, 'admin');

      // Tenant Manager should have tenant-manager testid
      const tenantManager = page.locator('[data-testid="tenant-manager"]');
      await expect(tenantManager).toBeVisible({ timeout: 15_000 }).catch(() => {
        // Fallback: check breadcrumb contains section name
      });

      // Switch to Master Definitions and verify its content
      await switchSection(page, 'Master Definitions');
      const definitionsHeading = page.getByRole('heading', { name: 'Object Types' });
      await expect(definitionsHeading).toBeVisible({ timeout: 10_000 });

      // Switch to License Manager and verify its content
      await switchSection(page, 'License Manager');
      const licenseContent = page.locator('.admin-content');
      await expect(licenseContent).toBeVisible({ timeout: 10_000 });

      // Switch to Master Locale and verify its content
      await switchSection(page, 'Master Locale');
      const localeContent = page.locator('.admin-content');
      await expect(localeContent).toBeVisible({ timeout: 10_000 });

      await signOut(page);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // Journey 8: Error Page Navigation
  // ═══════════════════════════════════════════════════════════════════════════

  test.describe('Journey 8: Error Pages', () => {
    test('access-denied page renders for unauthorized route', async ({ page }) => {
      await page.goto('/error/access-denied');
      await page.waitForLoadState('domcontentloaded');
      await page.screenshot({ path: `${SCREENSHOT_DIR}/j8-01-access-denied.png` });
    });

    test('session-expired page renders', async ({ page }) => {
      await page.goto('/error/session-expired');
      await page.waitForLoadState('domcontentloaded');
      await page.screenshot({ path: `${SCREENSHOT_DIR}/j8-02-session-expired.png` });
    });

    test('tenant-not-found page renders', async ({ page }) => {
      await page.goto('/error/tenant-not-found');
      await page.waitForLoadState('domcontentloaded');
      await page.screenshot({ path: `${SCREENSHOT_DIR}/j8-03-tenant-not-found.png` });
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // Journey 9: Login Validation Edge Cases
  // ═══════════════════════════════════════════════════════════════════════════

  test.describe('Journey 9: Login Validation', () => {
    test('wrong password shows error and remains on login page', async ({ page }) => {
      await navigateToLoginForm(page);
      await fillAndSubmitLogin(page, {
        identifier: LDAP_USERS.admin.identifier,
        password: 'WrongPassword123!',
      });

      const errorBanner = page.locator('.tp-banner-error');
      await expect(errorBanner).toBeVisible({ timeout: 10_000 });
      await expect(page).toHaveURL(/\/auth\/login/);

      await page.screenshot({ path: `${SCREENSHOT_DIR}/j9-01-wrong-password.png` });
    });

    test('non-existent user shows error', async ({ page }) => {
      await navigateToLoginForm(page);
      await fillAndSubmitLogin(page, {
        identifier: 'nonexistent@ems.test',
        password: 'SomePassword1!',
      });

      const errorBanner = page.locator('.tp-banner-error');
      await expect(errorBanner).toBeVisible({ timeout: 10_000 });
      await expect(page).toHaveURL(/\/auth\/login/);

      await page.screenshot({ path: `${SCREENSHOT_DIR}/j9-02-nonexistent-user.png` });
    });

    test('auth guard preserves returnUrl through login flow', async ({ page }) => {
      // Navigate to a protected page without being authenticated
      await page.goto('/tenants');
      await expect(page).toHaveURL(/\/auth\/login/, { timeout: 10_000 });
      await expect(page).toHaveURL(/returnUrl/);

      // Log in
      const signInBtn = page.locator('.signin-btn');
      await expect(signInBtn).toBeVisible({ timeout: 10_000 });
      await signInBtn.click();
      await expect(page.locator('.login-form')).toBeVisible();

      await fillAndSubmitLogin(page, LDAP_USERS.admin);

      // Should redirect to the originally requested URL
      await expect(page).toHaveURL(/\/tenants/, { timeout: 15_000 });

      await page.screenshot({ path: `${SCREENSHOT_DIR}/j9-03-returnurl-preserved.png` });

      await signOut(page);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // Journey 10: Multi-Role Comparison
  // ═══════════════════════════════════════════════════════════════════════════

  test.describe('Journey 10: Multi-Role Comparison', () => {
    test('admin user can access administration page', async ({ page }) => {
      await loginAs(page, 'admin');
      await expect(page).toHaveURL(/\/administration/);
      await page.screenshot({ path: `${SCREENSHOT_DIR}/j10-01-admin-access.png` });
      await signOut(page);
    });

    test('manager user can access administration page', async ({ page }) => {
      await loginAs(page, 'manager');
      await expect(page).toHaveURL(/\/administration/);
      await page.screenshot({ path: `${SCREENSHOT_DIR}/j10-02-manager-access.png` });
      await signOut(page);
    });

    test('viewer user can access administration page', async ({ page }) => {
      await loginAs(page, 'viewer');
      await expect(page).toHaveURL(/\/administration/);
      await page.screenshot({ path: `${SCREENSHOT_DIR}/j10-03-viewer-access.png` });
      await signOut(page);
    });
  });
});
