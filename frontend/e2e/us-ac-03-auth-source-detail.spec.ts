import { expect, test } from '@playwright/test';

/**
 * US-AC-03: Authentication Source Detail & Configuration E2E Tests
 * US-AC-04: Sync Monitoring & Log E2E Tests
 *
 * Tests verify the right-side slide-out detail panel with 4 tabs:
 * Config, Mapping, Sync, Tenants
 */

const MOCK_ACCESS_TOKEN =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.' +
  'eyJzdWIiOiJ1c2VyLTEiLCJpYXQiOjE3MDAwMDAwMDB9.' +
  'mock-signature';
const MOCK_REFRESH_TOKEN = 'mock-refresh-token-value';

const MOCK_PROVIDERS = [
  {
    id: 'prov-1',
    providerName: 'KEYCLOAK',
    providerType: 'KEYCLOAK',
    displayName: 'Keycloak SSO',
    protocol: 'OIDC',
    enabled: true,
    status: 'active',
    clientId: 'emsist-client',
    discoveryUrl: 'https://kc.example.com/realms/master/.well-known/openid-configuration',
    testResult: 'success',
  },
];

async function setupAndNavigate(page: import('@playwright/test').Page): Promise<void> {
  await page.route('**/api/**', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: '{}' }),
  );
  await page.route('**/api/tenants/resolve**', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ id: 'master', name: 'Master Tenant', status: 'active' }) }),
  );
  await page.route('**/api/tenants**', (route) => {
    if (route.request().url().includes('/resolve') || route.request().url().includes('/branding')) return route.continue();
    return route.fulfill({
      status: 200, contentType: 'application/json',
      body: JSON.stringify({ tenants: [{ id: 'master', uuid: 'master-uuid', shortName: 'master', fullName: 'Master Tenant', name: 'Master Tenant', tenantType: 'MASTER', tier: 'ENTERPRISE', status: 'active', isProtected: true }], total: 1, page: 1, limit: 20 }),
    });
  });
  await page.route('**/api/v1/admin/tenants/*/providers**', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ providers: MOCK_PROVIDERS }) }),
  );
  await page.route('**/api/v1/admin/tenants/*/users**', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ content: [], page: 0, size: 100, totalElements: 0, totalPages: 0 }) }),
  );

  await page.goto('/auth/login');
  await page.waitForLoadState('domcontentloaded');
  await page.evaluate(({ a, r }) => { sessionStorage.setItem('tp_access_token', a); sessionStorage.setItem('tp_refresh_token', r); },
    { a: MOCK_ACCESS_TOKEN, r: MOCK_REFRESH_TOKEN });

  await page.goto('/administration?section=tenant-manager');
  await page.waitForLoadState('domcontentloaded');

  const tenantBtn = page.locator('button.tenant-item').first();
  await expect(tenantBtn).toBeVisible({ timeout: 15_000 });
  await tenantBtn.click();

  const authTab = page.getByRole('tab', { name: 'Authentication' });
  await expect(authTab).toBeVisible({ timeout: 10_000 });
  await authTab.click();
  await expect(page.locator('[data-testid="btn-add-source"]').first()).toBeVisible({ timeout: 10_000 });
}

async function openDetailPanel(page: import('@playwright/test').Page): Promise<void> {
  await expect(page.locator('[data-testid="source-row-prov-1"]')).toBeVisible({ timeout: 10_000 });
  await page.locator('[data-testid="source-row-prov-1"]').click();
  await expect(page.locator('[data-testid="auth-source-detail-panel"]')).toBeVisible({ timeout: 5_000 });
}

test.describe('US-AC-03: Auth Source Detail & Configuration', () => {
  test.beforeEach(async ({ page }) => {
    await setupAndNavigate(page);
  });

  // AC-1: Detail panel opens on row click
  test('AC-1: Detail panel opens as right-side slide-out', async ({ page }) => {
    await openDetailPanel(page);
    await expect(page.locator('[data-testid="detail-panel-content"]')).toBeVisible();
  });

  // AC-2: Panel header shows protocol icon, name, badges
  test('AC-2: Panel header shows source name and badges', async ({ page }) => {
    await openDetailPanel(page);
    await expect(page.locator('[data-testid="detail-source-name"]')).toContainText('Keycloak SSO');
    await expect(page.locator('[data-testid="detail-protocol-badge"]')).toContainText('OIDC');
    await expect(page.locator('[data-testid="detail-status-badge"]')).toBeVisible();
    await expect(page.locator('[data-testid="detail-protocol-icon"]')).toBeVisible();
  });

  // AC-4: Four tabs available
  test('AC-4: Four tabs are available: Config, Mapping, Sync, Tenants', async ({ page }) => {
    await openDetailPanel(page);
    await expect(page.locator('[data-testid="detail-tab-config"]')).toBeVisible();
    await expect(page.locator('[data-testid="detail-tab-mapping"]')).toBeVisible();
    await expect(page.locator('[data-testid="detail-tab-sync"]')).toBeVisible();
    await expect(page.locator('[data-testid="detail-tab-tenants"]')).toBeVisible();
  });

  // AC-5: Config tab details
  test('AC-5: Config tab shows key-value details', async ({ page }) => {
    await openDetailPanel(page);
    await expect(page.locator('[data-testid="detail-config-tab"]')).toBeVisible();
    await expect(page.locator('[data-testid="detail-config-details"]')).toBeVisible();
    await expect(page.locator('[data-testid="detail-url"]')).toBeVisible();
    await expect(page.locator('[data-testid="detail-user-count"]')).toContainText('142');
  });

  // AC-6: Stored credentials
  test('AC-6: Config tab shows stored credentials section', async ({ page }) => {
    await openDetailPanel(page);
    await expect(page.locator('[data-testid="detail-credentials"]')).toBeVisible();
  });

  // AC-7: Config tab action buttons
  test('AC-7: Config tab shows action buttons', async ({ page }) => {
    await openDetailPanel(page);
    await expect(page.locator('[data-testid="detail-config-actions"]')).toBeVisible();
    await expect(page.locator('[data-testid="detail-btn-test"]')).toBeVisible();
    await expect(page.locator('[data-testid="detail-btn-sync"]')).toBeVisible();
    await expect(page.locator('[data-testid="detail-btn-edit"]')).toBeVisible();
    await expect(page.locator('[data-testid="detail-btn-toggle"]')).toBeVisible();
    await expect(page.locator('[data-testid="detail-btn-remove"]')).toBeVisible();
  });

  // AC-7 info banner
  test('AC-7b: Deactivate info banner is shown', async ({ page }) => {
    await openDetailPanel(page);
    await expect(page.locator('[data-testid="detail-deactivate-info"]')).toBeVisible();
    await expect(page.locator('[data-testid="detail-deactivate-info"]')).toContainText('Deactivating retains all users');
  });

  // AC-8: Mapping tab
  test('AC-8: Mapping tab shows attribute mapping table', async ({ page }) => {
    await openDetailPanel(page);
    await page.locator('[data-testid="detail-tab-mapping"]').click();
    await expect(page.locator('[data-testid="detail-mapping-tab"]')).toBeVisible();
    await expect(page.locator('[data-testid="detail-mapping-table"]')).toBeVisible();
    // Check at least first mapping row
    await expect(page.locator('[data-testid="mapping-row-0"]')).toBeVisible();
  });

  // Close button
  test('Close button closes the panel', async ({ page }) => {
    await openDetailPanel(page);
    // Close button may be outside viewport due to fixed header; use dispatchEvent
    await page.locator('[data-testid="detail-close-btn"]').dispatchEvent('click');
    await expect(page.locator('[data-testid="auth-source-detail-panel"]')).not.toBeVisible({ timeout: 3_000 });
  });
});

test.describe('US-AC-04: Sync Monitoring & Log', () => {
  test.beforeEach(async ({ page }) => {
    await setupAndNavigate(page);
  });

  // AC-1: Sync log table
  test('AC-1: Sync tab shows sync log table', async ({ page }) => {
    await openDetailPanel(page);
    await page.locator('[data-testid="detail-tab-sync"]').click();
    await expect(page.locator('[data-testid="detail-sync-tab"]')).toBeVisible();
    await expect(page.locator('[data-testid="sync-log-table"]')).toBeVisible();
  });

  // AC-2: Last 6 operations
  test('AC-2: Shows last 6 sync operations', async ({ page }) => {
    await openDetailPanel(page);
    await page.locator('[data-testid="detail-tab-sync"]').click();
    await expect(page.locator('[data-testid="sync-log-row-0"]')).toBeVisible();
    await expect(page.locator('[data-testid="sync-log-row-5"]')).toBeVisible();
  });

  // AC-5: Pagination label
  test('AC-5: Shows pagination label and View Full Log button', async ({ page }) => {
    await openDetailPanel(page);
    await page.locator('[data-testid="detail-tab-sync"]').click();
    await expect(page.locator('[data-testid="sync-log-label"]')).toContainText('Showing last');
    await expect(page.locator('[data-testid="sync-view-full-log"]')).toBeVisible();
  });

  // AC-6: 24h summary cards
  test('AC-6: Shows 4 aggregate metric cards', async ({ page }) => {
    await openDetailPanel(page);
    await page.locator('[data-testid="detail-tab-sync"]').click();
    await expect(page.locator('[data-testid="sync-summary-cards"]')).toBeVisible();
    await expect(page.locator('[data-testid="sync-summary-syncs"]')).toBeVisible();
    await expect(page.locator('[data-testid="sync-summary-created"]')).toBeVisible();
    await expect(page.locator('[data-testid="sync-summary-updated"]')).toBeVisible();
    await expect(page.locator('[data-testid="sync-summary-deactivated"]')).toBeVisible();
  });

  // AC-8: Error detail expansion
  test('AC-8: Error sync entries show expandable details', async ({ page }) => {
    await openDetailPanel(page);
    await page.locator('[data-testid="detail-tab-sync"]').click();
    // Row 5 (index 5) has errors
    await expect(page.locator('[data-testid="sync-error-detail-5"]')).toBeVisible();
  });
});
