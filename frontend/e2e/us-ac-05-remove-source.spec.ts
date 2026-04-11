import { expect, test } from '@playwright/test';

/**
 * US-AC-05: Remove Authentication Source E2E Tests
 *
 * Tests verify the custom remove confirmation dialog with:
 * - Warning banner with impact stats
 * - User disposition options (retain/deactivate)
 * - Type-to-confirm source name
 * - Last source protection
 */

const MOCK_ACCESS_TOKEN =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.' +
  'eyJzdWIiOiJ1c2VyLTEiLCJpYXQiOjE3MDAwMDAwMDB9.' +
  'mock-signature';
const MOCK_REFRESH_TOKEN = 'mock-refresh-token-value';

const SINGLE_PROVIDER = [
  {
    id: 'prov-1', providerName: 'KEYCLOAK', providerType: 'KEYCLOAK', displayName: 'Keycloak SSO',
    protocol: 'OIDC', enabled: true, status: 'active', clientId: 'emsist-client',
    discoveryUrl: 'https://kc.example.com/realms/master/.well-known/openid-configuration',
  },
];

const TWO_PROVIDERS = [
  ...SINGLE_PROVIDER,
  {
    id: 'prov-2', providerName: 'CORP_LDAP', providerType: 'LDAP', displayName: 'Corporate LDAP',
    protocol: 'LDAP', enabled: true, status: 'active', serverUrl: 'ldap://dc01.corp.local:389',
  },
];

async function setup(page: import('@playwright/test').Page, providers = SINGLE_PROVIDER): Promise<void> {
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
  await page.route('**/api/v1/admin/tenants/*/providers**', (route) => {
    if (route.request().method() === 'DELETE') {
      return route.fulfill({ status: 204, body: '' });
    }
    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ providers }) });
  });
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

async function openRemoveDialog(page: import('@playwright/test').Page): Promise<void> {
  await expect(page.locator('[data-testid="source-row-prov-1"]')).toBeVisible({ timeout: 10_000 });
  await page.locator('[data-testid="source-row-prov-1"]').click();
  await expect(page.locator('[data-testid="auth-source-detail-panel"]')).toBeVisible({ timeout: 5_000 });
  await page.locator('[data-testid="detail-btn-remove"]').click();
  await expect(page.locator('[data-testid="remove-source-dialog"]')).toBeVisible({ timeout: 5_000 });
}

test.describe('US-AC-05: Remove Authentication Source (single provider)', () => {
  test.beforeEach(async ({ page }) => {
    await setup(page, SINGLE_PROVIDER);
    await navToAuth(page);
  });

  test('AC-1: Remove Source button is available in detail panel', async ({ page }) => {
    await expect(page.locator('[data-testid="source-row-prov-1"]')).toBeVisible({ timeout: 10_000 });
    await page.locator('[data-testid="source-row-prov-1"]').click();
    await expect(page.locator('[data-testid="detail-btn-remove"]')).toBeVisible({ timeout: 5_000 });
  });

  test('AC-2: Confirmation dialog opens with red header', async ({ page }) => {
    await openRemoveDialog(page);
    await expect(page.locator('[data-testid="remove-source-dialog-content"]')).toBeVisible();
    await expect(page.locator('[data-testid="remove-dialog-header"]')).toBeVisible();
    await expect(page.locator('[data-testid="remove-dialog-title"]')).toContainText('Keycloak SSO');
    await expect(page.locator('[data-testid="remove-dialog-protocol"]')).toContainText('OIDC');
  });

  test('AC-3: Warning banner shows impact stats', async ({ page }) => {
    await openRemoveDialog(page);
    await expect(page.locator('[data-testid="remove-warning-banner"]')).toBeVisible();
    await expect(page.locator('[data-testid="remove-warning-banner"]')).toContainText('permanently remove');
    await expect(page.locator('[data-testid="remove-impact-stats"]')).toBeVisible();
  });

  test('AC-8: Last active source shows protection error', async ({ page }) => {
    await openRemoveDialog(page);
    await expect(page.locator('[data-testid="remove-last-source-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="remove-last-source-error"]')).toContainText('Cannot remove the last active');
  });
});

test.describe('US-AC-05: Remove Authentication Source (multiple providers)', () => {
  test.beforeEach(async ({ page }) => {
    await setup(page, TWO_PROVIDERS);
    await navToAuth(page);
  });

  test('AC-4: Two radio options for user disposition', async ({ page }) => {
    await openRemoveDialog(page);
    await expect(page.locator('[data-testid="remove-user-disposition"]')).toBeVisible();
    await expect(page.locator('[data-testid="disposition-retain"]')).toBeVisible();
    await expect(page.locator('[data-testid="disposition-deactivate"]')).toBeVisible();
  });

  test('AC-5: Remove button disabled until source name typed', async ({ page }) => {
    await openRemoveDialog(page);
    const removeBtn = page.locator('[data-testid="remove-confirm-btn"]');
    await expect(removeBtn).toBeDisabled();

    // Type wrong name
    await page.locator('[data-testid="remove-confirm-input"]').fill('Wrong Name');
    await expect(removeBtn).toBeDisabled();

    // Type correct name (case-insensitive match)
    await page.locator('[data-testid="remove-confirm-input"]').fill('Keycloak SSO');
    await expect(removeBtn).toBeEnabled();
  });

  test('AC-6: Cancel button closes dialog', async ({ page }) => {
    await openRemoveDialog(page);
    await page.locator('[data-testid="remove-cancel-btn"]').click();
    await expect(page.locator('[data-testid="remove-source-dialog"]')).not.toBeVisible({ timeout: 3_000 });
  });
});
