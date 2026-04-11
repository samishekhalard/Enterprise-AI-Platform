import { expect, test } from '@playwright/test';

/**
 * US-AC-01: View Authentication Sources List E2E Tests
 */

const MOCK_ACCESS_TOKEN =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.' +
  'eyJzdWIiOiJ1c2VyLTEiLCJpYXQiOjE3MDAwMDAwMDB9.' +
  'mock-signature';
const MOCK_REFRESH_TOKEN = 'mock-refresh-token-value';

const MOCK_PROVIDERS = [
  {
    id: 'prov-1', providerName: 'KEYCLOAK', providerType: 'KEYCLOAK', displayName: 'Keycloak SSO',
    protocol: 'OIDC', enabled: true, status: 'active', clientId: 'emsist-client',
    discoveryUrl: 'https://kc.example.com/realms/master/.well-known/openid-configuration', testResult: 'success',
  },
  {
    id: 'prov-2', providerName: 'CORP_LDAP', providerType: 'LDAP', displayName: 'Corporate LDAP',
    protocol: 'LDAP', enabled: true, status: 'active', serverUrl: 'ldap://dc01.corp.local:389',
    testResult: 'failure', lastTestedAt: '2026-03-06T10:00:00Z',
  },
];

async function setup(page: import('@playwright/test').Page, providers = MOCK_PROVIDERS): Promise<void> {
  // Catch-all FIRST (lowest priority in Playwright)
  await page.route('**/api/**', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({}) }),
  );
  // Specific overrides AFTER (higher priority)
  await page.route('**/api/tenants/resolve**', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ id: 'master', name: 'Master Tenant', status: 'active' }) }),
  );
  await page.route('**/api/tenants**', (route) => {
    const url = route.request().url();
    if (url.includes('/resolve') || url.includes('/branding')) return route.continue();
    return route.fulfill({
      status: 200, contentType: 'application/json',
      body: JSON.stringify({ tenants: [{ id: 'master', uuid: 'master-uuid', shortName: 'master', fullName: 'Master Tenant', name: 'Master Tenant', tenantType: 'MASTER', tier: 'ENTERPRISE', status: 'active', isProtected: true }], total: 1, page: 1, limit: 20 }),
    });
  });
  await page.route('**/api/v1/admin/tenants/*/providers**', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ providers }) }),
  );
  await page.route('**/api/v1/admin/tenants/*/users**', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ content: [], page: 0, size: 100, totalElements: 0, totalPages: 0 }) }),
  );

  await page.goto('/auth/login');
  await page.waitForLoadState('domcontentloaded');
  await page.evaluate(
    ({ a, r }) => { sessionStorage.setItem('tp_access_token', a); sessionStorage.setItem('tp_refresh_token', r); },
    { a: MOCK_ACCESS_TOKEN, r: MOCK_REFRESH_TOKEN },
  );
  await page.goto('/administration?section=tenant-manager');
  await page.waitForLoadState('domcontentloaded');
}

async function navToAuth(page: import('@playwright/test').Page): Promise<void> {
  const tenantBtn = page.locator('button.tenant-item').first();
  await expect(tenantBtn).toBeVisible({ timeout: 15_000 });
  await tenantBtn.click();
  const authTab = page.getByRole('tab', { name: 'Authentication' });
  await expect(authTab).toBeVisible({ timeout: 10_000 });
  await authTab.click();
  await expect(page.locator('[data-testid="btn-add-source"]').first()).toBeVisible({ timeout: 10_000 });
}

test.describe('US-AC-01: View Authentication Sources List', () => {
  test.beforeEach(async ({ page }) => {
    await setup(page);
    await navToAuth(page);
  });

  test('AC-1: Four summary metric cards are displayed', async ({ page }) => {
    await expect(page.locator('[data-testid="source-metric-cards"]')).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('[data-testid="metric-total-sources"]')).toBeVisible();
    await expect(page.locator('[data-testid="metric-total-users"]')).toBeVisible();
    await expect(page.locator('[data-testid="metric-last-sync"]')).toBeVisible();
    await expect(page.locator('[data-testid="metric-error-count"]')).toBeVisible();
    await expect(page.locator('[data-testid="metric-total-sources"]')).toContainText('2');
  });

  test('AC-2: Source table lists all providers', async ({ page }) => {
    await expect(page.locator('[data-testid="source-table"]')).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('[data-testid="source-row-prov-1"]')).toBeVisible();
    await expect(page.locator('[data-testid="source-row-prov-2"]')).toBeVisible();
    await expect(page.locator('[data-testid="protocol-badge-prov-1"]')).toContainText('OIDC');
    await expect(page.locator('[data-testid="uptime-bar-prov-1"]')).toBeVisible();
  });

  test('AC-3: Error source has red border and error sub-row', async ({ page }) => {
    const errorRow = page.locator('[data-testid="source-row-prov-2"]');
    await expect(errorRow).toBeVisible({ timeout: 10_000 });
    await expect(errorRow).toHaveClass(/error-source/);
    await expect(page.locator('[data-testid="error-row-prov-2"]')).toBeVisible();
  });

  test('AC-5: Certificate expiry section is displayed', async ({ page }) => {
    await expect(page.locator('[data-testid="cert-expiry-section"]')).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('[data-testid="cert-expiry-prov-1"]')).toBeVisible();
  });

  test('AC-6: Clicking source row opens detail panel', async ({ page }) => {
    await expect(page.locator('[data-testid="source-row-prov-1"]')).toBeVisible({ timeout: 10_000 });
    await page.locator('[data-testid="source-row-prov-1"]').click();
    await expect(page.locator('[data-testid="auth-source-detail-panel"]')).toBeVisible({ timeout: 5_000 });
    await expect(page.locator('[data-testid="detail-source-name"]')).toContainText('Keycloak SSO');
  });

  test('Edge: Empty state shown when no providers', async ({ page }) => {
    await page.unrouteAll();
    await setup(page, []);
    await navToAuth(page);
    await expect(page.locator('[data-testid="source-empty-state"]')).toBeVisible({ timeout: 10_000 });
  });
});
