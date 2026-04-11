import { expect, test } from '@playwright/test';

/**
 * LIVE Object Types E2E Tests
 *
 * These tests run against the real backend through Cloudflare tunnel.
 * They verify the complete Object Types user journey with real API calls.
 */

/**
 * Tunnel URL is read from the TUNNEL_URL environment variable.
 * Falls back to auto-detection from the latest cloudflared log,
 * then to localhost:24200 (Docker frontend port).
 *
 * Usage: TUNNEL_URL=https://xxx.trycloudflare.com npx playwright test e2e/object-types-live.spec.ts
 */
const TUNNEL_URL = process.env.TUNNEL_URL?.replace(/\/$/, '') || 'http://localhost:24200';

async function loginAndNavigate(page: import('@playwright/test').Page): Promise<void> {
  await page.goto(`${TUNNEL_URL}/auth/login`, { waitUntil: 'networkidle' });

  // Click sign-in button to show login form
  const signinBtn = page.locator('.signin-btn');
  if (await signinBtn.isVisible().catch(() => false)) {
    await signinBtn.click();
    await page.waitForTimeout(500);
  }

  // Fill and submit login form
  const identifierField = page.locator('#identifier');
  if (await identifierField.isVisible({ timeout: 5_000 }).catch(() => false)) {
    await identifierField.fill('superadmin');
    await page.locator('#password').fill('dev_superadmin');
    await page.locator('.submit-btn').click();

    // Wait for redirect after login — use positive match
    await page.waitForURL('**/administration**', { timeout: 15_000 });
    await page.waitForLoadState('networkidle');
  }

  // Navigate to master definitions
  await page.goto(`${TUNNEL_URL}/administration?section=master-definitions`, { waitUntil: 'networkidle' });
  // Give Angular time to render the section
  await page.waitForTimeout(2000);
}

test.describe('Object Types — Live Backend', () => {
  test.setTimeout(60_000);
  test.describe.configure({ mode: 'serial' });

  test('should load Object Types list from real backend', async ({ page }) => {
    await loginAndNavigate(page);

    await expect(page.getByRole('heading', { name: 'Object Types' })).toBeVisible({ timeout: 15_000 });

    const items = page.locator('[data-testid="definitions-type-item"]');
    await expect(items.first()).toBeVisible({ timeout: 15_000 });

    const count = await items.count();
    expect(count).toBeGreaterThanOrEqual(6);
  });

  test('should create a new Object Type via wizard with real backend', async ({ page }) => {
    await loginAndNavigate(page);
    await expect(page.locator('[data-testid="definitions-type-item"]').first()).toBeVisible({ timeout: 15_000 });

    // Open wizard
    await page.locator('[data-testid="definitions-new-type-btn"]').click();
    const nameInput = page.locator('[data-testid="wizard-name-input"]');
    await expect(nameInput).toBeVisible({ timeout: 5_000 });

    // Step 0: Basic Info
    const typeName = `LiveTest ${Date.now()}`;
    await nameInput.fill(typeName);

    // Step 1: Connections (skip)
    await page.locator('[data-testid="wizard-next-btn"]').click();
    await expect(page.locator('[data-testid="wizard-step-connections"]')).toBeVisible();

    // Step 2: Attributes (skip)
    await page.locator('[data-testid="wizard-next-btn"]').click();
    await expect(page.locator('[data-testid="wizard-step-attributes"]')).toBeVisible({ timeout: 5_000 });

    // Step 3: Status/Review
    await page.locator('[data-testid="wizard-next-btn"]').click();
    await expect(page.locator('[data-testid="wizard-step-status"]')).toBeVisible();

    // Create
    await page.locator('[data-testid="wizard-create-btn"]').click();

    // Wizard closes and new type appears
    await expect(nameInput).not.toBeVisible({ timeout: 10_000 });
    await expect(page.getByText(typeName)).toBeVisible({ timeout: 10_000 });
  });

  test('should select object type and see detail panel', async ({ page }) => {
    await loginAndNavigate(page);

    const items = page.locator('[data-testid="definitions-type-item"]');
    await expect(items.first()).toBeVisible({ timeout: 15_000 });

    await items.first().click();
    const detailPanel = page.locator('[data-testid="definitions-detail-panel"]');
    await expect(detailPanel).toBeVisible({ timeout: 5_000 });
    await expect(detailPanel.locator('h3').first()).toBeVisible();
  });

  test('should edit an object type via real PUT request', async ({ page }) => {
    await loginAndNavigate(page);

    const items = page.locator('[data-testid="definitions-type-item"]');
    await expect(items.first()).toBeVisible({ timeout: 15_000 });

    await items.first().click();
    const detailPanel = page.locator('[data-testid="definitions-detail-panel"]');
    await expect(detailPanel).toBeVisible({ timeout: 5_000 });

    // Enter edit mode
    await detailPanel.locator('[data-testid="definitions-edit-btn"]').click();
    await expect(page.locator('[data-testid="definitions-edit-form"]')).toBeVisible({ timeout: 5_000 });

    // Change name
    const editName = page.locator('[data-testid="edit-name-input"]');
    const originalName = await editName.inputValue();
    await editName.clear();
    await editName.fill(originalName + ' Edited');

    // Save — wait for the PUT response
    const putResponse = page.waitForResponse(resp =>
      resp.url().includes('/api/v1/definitions/object-types/') && resp.request().method() === 'PUT',
    );
    await page.locator('[data-testid="edit-save-btn"]').click();
    const resp = await putResponse;
    expect(resp.status()).toBe(200);

    await expect(page.locator('[data-testid="definitions-edit-form"]')).not.toBeVisible({ timeout: 10_000 });
    await expect(page.getByText(originalName + ' Edited').first()).toBeVisible({ timeout: 5_000 });

    // Revert name
    await detailPanel.locator('[data-testid="definitions-edit-btn"]').click();
    await expect(page.locator('[data-testid="definitions-edit-form"]')).toBeVisible({ timeout: 5_000 });
    await page.locator('[data-testid="edit-name-input"]').clear();
    await page.locator('[data-testid="edit-name-input"]').fill(originalName);

    const putResponse2 = page.waitForResponse(resp =>
      resp.url().includes('/api/v1/definitions/object-types/') && resp.request().method() === 'PUT',
    );
    await page.locator('[data-testid="edit-save-btn"]').click();
    const resp2 = await putResponse2;
    expect(resp2.status()).toBe(200);
    await expect(page.locator('[data-testid="definitions-edit-form"]')).not.toBeVisible({ timeout: 10_000 });
  });

  test('should toggle between list and card views', async ({ page }) => {
    await loginAndNavigate(page);

    const items = page.locator('[data-testid="definitions-type-item"]');
    await expect(items.first()).toBeVisible({ timeout: 15_000 });

    await page.locator('[data-testid="definitions-view-card-btn"]').click();
    await expect(page.locator('[data-testid="definitions-card-grid"]')).toBeVisible({ timeout: 5_000 });

    const cards = page.locator('[data-testid="definitions-type-card"]');
    expect(await cards.count()).toBeGreaterThanOrEqual(3);

    await page.locator('[data-testid="definitions-view-list-btn"]').click();
    await expect(items.first()).toBeVisible({ timeout: 5_000 });
  });

  test('should filter by search text', async ({ page }) => {
    await loginAndNavigate(page);

    const items = page.locator('[data-testid="definitions-type-item"]');
    await expect(items.first()).toBeVisible({ timeout: 15_000 });
    const initialCount = await items.count();

    await page.locator('[data-testid="definitions-search-input"]').fill('Server');
    await page.waitForTimeout(500);
    const filteredCount = await items.count();
    expect(filteredCount).toBeLessThan(initialCount);
    expect(filteredCount).toBeGreaterThanOrEqual(1);

    await page.locator('[data-testid="definitions-search-input"]').clear();
    await page.waitForTimeout(500);
    await expect(items).toHaveCount(initialCount, { timeout: 5_000 });
  });

  test('should filter by status dropdown', async ({ page }) => {
    await loginAndNavigate(page);

    const items = page.locator('[data-testid="definitions-type-item"]');
    await expect(items.first()).toBeVisible({ timeout: 15_000 });

    await page.locator('[data-testid="definitions-status-filter"]').click();
    await page.locator('.p-select-option', { hasText: 'Planned' }).click();

    await page.waitForTimeout(500);
    const filteredCount = await items.count();
    expect(filteredCount).toBeGreaterThanOrEqual(1);
    await expect(page.getByText('Contract').first()).toBeVisible();
  });

  test('should show attributes and connections in detail panel', async ({ page }) => {
    await loginAndNavigate(page);

    const items = page.locator('[data-testid="definitions-type-item"]');
    await expect(items.first()).toBeVisible({ timeout: 15_000 });

    // Click on Server (should have attributes and connections)
    await page.getByText('Server', { exact: true }).first().click();
    const detailPanel = page.locator('[data-testid="definitions-detail-panel"]');
    await expect(detailPanel).toBeVisible({ timeout: 5_000 });

    // Verify attributes section shows real data (Attributes tab is default)
    const attrSection = page.locator('[data-testid="detail-attributes-section"]');
    await expect(attrSection).toBeVisible();
    await expect(attrSection.getByText('Hostname')).toBeVisible({ timeout: 5_000 });
    await expect(attrSection.getByText('IP Address')).toBeVisible();

    // Switch to Connections tab and verify real data
    await detailPanel.locator('p-tab', { hasText: 'Connections' }).click();
    const connSection = page.locator('[data-testid="detail-connections-section"]');
    await expect(connSection).toBeVisible({ timeout: 5_000 });
    await expect(connSection.getByText('hosts')).toBeVisible({ timeout: 5_000 });
    await expect(connSection.getByText('Application')).toBeVisible();
  });

  test('should duplicate an object type', async ({ page }) => {
    await loginAndNavigate(page);

    const items = page.locator('[data-testid="definitions-type-item"]');
    await expect(items.first()).toBeVisible({ timeout: 15_000 });
    const initialCount = await items.count();

    // Wait for the duplicate POST response
    const dupResponse = page.waitForResponse(resp =>
      resp.url().includes('/duplicate') && resp.request().method() === 'POST',
    );
    await items.first().locator('[data-testid="definitions-duplicate-btn"]').click();
    const resp = await dupResponse;
    expect(resp.status()).toBe(201);

    // Wait for the new item to appear in the list
    await expect(items).toHaveCount(initialCount + 1, { timeout: 10_000 });
  });
});
