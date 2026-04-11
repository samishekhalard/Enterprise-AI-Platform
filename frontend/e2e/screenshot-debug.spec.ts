import { expect, test } from '@playwright/test';

const BASE_URL = process.env.TUNNEL_URL?.replace(/\/$/, '') || 'http://localhost:24200';

test('screenshot master definitions', async ({ page }) => {
  test.setTimeout(60_000);

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

  // Screenshot 1: Full page
  await page.screenshot({ path: 'e2e/screenshots/01-full-page.png', fullPage: true });

  // Wait for items
  const items = page.locator('[data-testid="definitions-type-item"]');
  await expect(items.first()).toBeVisible({ timeout: 15_000 });

  // Screenshot 2: List loaded
  await page.screenshot({ path: 'e2e/screenshots/02-list-loaded.png', fullPage: true });

  // Click on Server
  await page.getByText('Server', { exact: true }).first().click();
  await page.waitForTimeout(2000);

  // Screenshot 3: Detail panel
  await page.screenshot({ path: 'e2e/screenshots/03-detail-panel.png', fullPage: true });

  // Click New Type to check wizard
  await page.locator('[data-testid="definitions-new-type-btn"]').click();
  await page.waitForTimeout(1000);

  // Screenshot 4: Wizard step 1
  await page.screenshot({ path: 'e2e/screenshots/04-wizard-step1.png', fullPage: true });

  // Go to connections step
  await page.locator('[data-testid="wizard-name-input"]').fill('Test Type');
  await page.locator('[data-testid="wizard-next-btn"]').click();
  await page.waitForTimeout(500);

  // Screenshot 5: Wizard connections step
  await page.screenshot({ path: 'e2e/screenshots/05-wizard-connections.png', fullPage: true });

  // Go to attributes step
  await page.locator('[data-testid="wizard-next-btn"]').click();
  await page.waitForTimeout(500);

  // Screenshot 6: Wizard attributes step
  await page.screenshot({ path: 'e2e/screenshots/06-wizard-attributes.png', fullPage: true });

  // Cancel wizard
  await page.locator('[data-testid="wizard-cancel-btn"]').click();
  await page.waitForTimeout(500);
});
