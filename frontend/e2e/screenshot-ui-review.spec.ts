import { expect, test } from '@playwright/test';

const BASE_URL = process.env.TUNNEL_URL?.replace(/\/$/, '') || 'http://localhost:24200';

test('screenshot UI review after changes', async ({ page }) => {
  test.setTimeout(90_000);

  await page.goto(`${BASE_URL}/auth/login`, { waitUntil: 'networkidle' });

  const signinBtn = page.locator('.signin-btn');
  if (await signinBtn.isVisible().catch(() => false)) {
    await signinBtn.click();
    await page.waitForTimeout(500);
  }

  const identifierField = page.locator('#identifier');
  if (await identifierField.isVisible({ timeout: 5_000 }).catch(() => false)) {
    await identifierField.fill('superadmin');
    await page.locator('#password').fill('dev_superadmin');
    await page.locator('.submit-btn').click();
    await page.waitForURL('**/administration**', { timeout: 15_000 });
    await page.waitForLoadState('networkidle');
  }

  // Navigate to master definitions
  await page.goto(`${BASE_URL}/administration?section=master-definitions`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(3000);

  // Screenshot 1: Full page overview
  await page.screenshot({ path: 'e2e/screenshots/review-01-full-page.png', fullPage: true });

  // Wait for items
  const items = page.locator('[data-testid="definitions-type-item"]');
  await expect(items.first()).toBeVisible({ timeout: 15_000 });

  // Screenshot 2: List loaded
  await page.screenshot({ path: 'e2e/screenshots/review-02-list-loaded.png', fullPage: true });

  // Click on Server to see fact sheet
  await page.getByText('Server', { exact: true }).first().click();
  await page.waitForTimeout(2000);

  // Screenshot 3: Detail panel with Attributes tab (default)
  await page.screenshot({ path: 'e2e/screenshots/review-03-detail-attributes-tab.png', fullPage: true });

  // Click on Connections tab
  const connectionsTab = page.locator('p-tab', { hasText: 'Connections' });
  if (await connectionsTab.isVisible().catch(() => false)) {
    await connectionsTab.click();
    await page.waitForTimeout(500);
  }

  // Screenshot 4: Connections tab
  await page.screenshot({ path: 'e2e/screenshots/review-04-detail-connections-tab.png', fullPage: true });

  // Click on Instances tab
  const instancesTab = page.locator('p-tab', { hasText: 'Instances' });
  if (await instancesTab.isVisible().catch(() => false)) {
    await instancesTab.click();
    await page.waitForTimeout(500);
  }

  // Screenshot 5: Instances tab
  await page.screenshot({ path: 'e2e/screenshots/review-05-detail-instances-tab.png', fullPage: true });

  // Open wizard
  await page.locator('[data-testid="definitions-new-type-btn"]').click();
  await page.waitForTimeout(1000);

  // Screenshot 6: Wizard step 1 (icons)
  await page.screenshot({ path: 'e2e/screenshots/review-06-wizard-icons.png', fullPage: true });

  // Go to connections step
  await page.locator('[data-testid="wizard-name-input"]').fill('Test Type');
  await page.locator('[data-testid="wizard-next-btn"]').click();
  await page.waitForTimeout(500);

  // Screenshot 7: Wizard connections step (cardinality dropdown)
  await page.screenshot({ path: 'e2e/screenshots/review-07-wizard-connections.png', fullPage: true });

  // Go to attributes step
  await page.locator('[data-testid="wizard-next-btn"]').click();
  await page.waitForTimeout(500);

  // Screenshot 8: Wizard attributes step (with create button)
  await page.screenshot({ path: 'e2e/screenshots/review-08-wizard-attributes.png', fullPage: true });

  // Cancel wizard
  await page.locator('[data-testid="wizard-cancel-btn"]').click();
  await page.waitForTimeout(500);

  // Test edit mode
  const detailPanel = page.locator('[data-testid="definitions-detail-panel"]');
  if (await detailPanel.isVisible().catch(() => false)) {
    const editBtn = page.locator('[data-testid="definitions-edit-btn"]');
    if (await editBtn.isVisible().catch(() => false)) {
      await editBtn.click();
      await page.waitForTimeout(500);

      // Screenshot 9: Edit mode
      await page.screenshot({ path: 'e2e/screenshots/review-09-edit-mode.png', fullPage: true });

      // Cancel edit
      await page.locator('[data-testid="edit-cancel-btn"]').click();
      await page.waitForTimeout(500);
    }
  }

  // Test card view
  await page.locator('[data-testid="definitions-view-card-btn"]').click();
  await page.waitForTimeout(500);

  // Screenshot 10: Card view
  await page.screenshot({ path: 'e2e/screenshots/review-10-card-view.png', fullPage: true });
});
