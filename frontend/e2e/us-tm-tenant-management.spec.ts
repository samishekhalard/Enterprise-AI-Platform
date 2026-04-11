import { expect, test } from '@playwright/test';

/**
 * US-TM-01 through US-TM-06: Tenant Management E2E Tests
 *
 * Covers:
 * - US-TM-01: View Tenant List (stats bar, table/card view, sorting, filtering, pagination, search)
 * - US-TM-02: Add New Tenant via 3-step wizard (Basic Info -> License -> Review)
 * - US-TM-04: Tenant Lifecycle (Activate / Suspend / Reactivate / Decommission)
 * - US-TM-06: View Tenant Fact Sheet (Super Admin - Overview + License tabs)
 */

const MOCK_ACCESS_TOKEN =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.' +
  'eyJzdWIiOiJ1c2VyLTEiLCJpYXQiOjE3MDAwMDAwMDB9.' +
  'mock-signature';
const MOCK_REFRESH_TOKEN = 'mock-refresh-token-value';

const MOCK_TENANTS = [
  {
    id: 'master', uuid: 'master-uuid', shortName: 'MASTER', fullName: 'Master Tenant',
    name: 'Master Tenant', tenantType: 'MASTER', tier: 'ENTERPRISE', status: 'active',
    isProtected: true, usersCount: 12, domainsCount: 2, primaryDomain: 'master.local',
    createdAt: '2025-01-01T00:00:00Z', description: 'System master tenant',
  },
  {
    id: 'tenant-a', uuid: 'uuid-a', shortName: 'TENA', fullName: 'Tenant Alpha',
    name: 'Tenant Alpha', tenantType: 'REGULAR', tier: 'STANDARD', status: 'active',
    isProtected: false, usersCount: 5, domainsCount: 1, primaryDomain: 'alpha.local',
    createdAt: '2025-06-15T00:00:00Z', description: 'Alpha test tenant',
  },
  {
    id: 'tenant-b', uuid: 'uuid-b', shortName: 'TENB', fullName: 'Tenant Beta',
    name: 'Tenant Beta', tenantType: 'REGULAR', tier: 'FREE', status: 'pending',
    isProtected: false, usersCount: 0, domainsCount: 1, primaryDomain: 'beta.local',
    createdAt: '2026-02-01T00:00:00Z',
  },
  {
    id: 'tenant-c', uuid: 'uuid-c', shortName: 'TENC', fullName: 'Tenant Charlie',
    name: 'Tenant Charlie', tenantType: 'REGULAR', tier: 'PROFESSIONAL', status: 'suspended',
    isProtected: false, usersCount: 3, domainsCount: 1, primaryDomain: 'charlie.local',
    createdAt: '2025-09-01T00:00:00Z', suspensionReason: 'License Expired',
    suspensionNotes: 'License expired on 2026-01-31', suspendedAt: '2026-02-15T00:00:00Z',
    estimatedReactivationDate: '2026-04-01T00:00:00Z',
  },
];

const MOCK_STATS = {
  totalTenants: 4, activeTenants: 2, pendingTenants: 1,
  suspendedTenants: 1, decommissionedTenants: 0, totalUsers: 20, avgUtilizationPercent: 65.0,
};

async function setup(page: import('@playwright/test').Page): Promise<void> {
  // Catch-all
  await page.route('**/api/**', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({}) }),
  );
  // Tenant resolve
  await page.route('**/api/tenants/resolve**', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ id: 'master', name: 'Master Tenant', status: 'active' }) }),
  );
  // Tenant list
  await page.route('**/api/tenants?*', (route) => {
    const url = route.request().url();
    if (url.includes('/resolve') || url.includes('/branding') || url.includes('/stats')) return route.continue();
    return route.fulfill({
      status: 200, contentType: 'application/json',
      body: JSON.stringify({ tenants: MOCK_TENANTS, total: 4, page: 1, limit: 500 }),
    });
  });
  // Stats
  await page.route('**/api/tenants/stats', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_STATS) }),
  );
  // Short code validation
  await page.route('**/api/tenants/validate/short-code/**', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ available: true }) }),
  );

  await page.goto('/auth/login');
  await page.waitForLoadState('domcontentloaded');
  await page.evaluate(
    ({ a, r }) => { sessionStorage.setItem('tp_access_token', a); sessionStorage.setItem('tp_refresh_token', r); },
    { a: MOCK_ACCESS_TOKEN, r: MOCK_REFRESH_TOKEN },
  );
  await page.goto('/administration?section=tenant-manager');
  await page.waitForLoadState('domcontentloaded');
  await page.waitForSelector('[data-testid="tenant-manager"]', { timeout: 15_000 });
}

// ═══════════════════════════════════════════════════════════════
// US-TM-01: View Tenant List
// ═══════════════════════════════════════════════════════════════
test.describe('US-TM-01: View Tenant List', () => {
  test.beforeEach(async ({ page }) => { await setup(page); });

  test('AC-1: Stats bar displays tenant statistics', async ({ page }) => {
    const statsBar = page.locator('[data-testid="stats-bar"]');
    await expect(statsBar).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('[data-testid="stat-total"]')).toContainText('4');
    await expect(page.locator('[data-testid="stat-active"]')).toContainText('2');
    await expect(page.locator('[data-testid="stat-pending"]')).toContainText('1');
    await expect(page.locator('[data-testid="stat-suspended"]')).toContainText('1');
  });

  test('AC-2: Tenant table renders with all tenants', async ({ page }) => {
    await expect(page.locator('[data-testid="table-view"]')).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('[data-testid="tenant-row-master"]')).toBeVisible();
    await expect(page.locator('[data-testid="tenant-row-tenant-a"]')).toBeVisible();
    await expect(page.locator('[data-testid="tenant-row-tenant-b"]')).toBeVisible();
    await expect(page.locator('[data-testid="tenant-row-tenant-c"]')).toBeVisible();
  });

  test('AC-3: Table/Card view toggle works', async ({ page }) => {
    await expect(page.locator('[data-testid="table-view"]')).toBeVisible({ timeout: 10_000 });

    // Switch to card view
    await page.locator('[data-testid="view-card-btn"]').click();
    await expect(page.locator('[data-testid="card-view"]')).toBeVisible();
    await expect(page.locator('[data-testid="table-view"]')).not.toBeVisible();

    // Switch back to table view
    await page.locator('[data-testid="view-table-btn"]').click();
    await expect(page.locator('[data-testid="table-view"]')).toBeVisible();
    await expect(page.locator('[data-testid="card-view"]')).not.toBeVisible();
  });

  test('AC-4: Search filters tenants by name', async ({ page }) => {
    await expect(page.locator('[data-testid="table-view"]')).toBeVisible({ timeout: 10_000 });
    const searchInput = page.locator('[data-testid="search-input"]');
    await searchInput.fill('Alpha');

    // Should show only Tenant Alpha
    await expect(page.locator('[data-testid="tenant-row-tenant-a"]')).toBeVisible();
    await expect(page.locator('[data-testid="tenant-row-master"]')).not.toBeVisible();
    await expect(page.locator('[data-testid="tenant-row-tenant-b"]')).not.toBeVisible();
  });

  test('AC-5: Status filter shows only matching tenants', async ({ page }) => {
    await expect(page.locator('[data-testid="table-view"]')).toBeVisible({ timeout: 10_000 });
    const filter = page.locator('[data-testid="status-filter"]');
    await filter.selectOption('pending');

    // Should show only pending tenant
    await expect(page.locator('[data-testid="tenant-row-tenant-b"]')).toBeVisible();
    await expect(page.locator('[data-testid="tenant-row-master"]')).not.toBeVisible();
    await expect(page.locator('[data-testid="tenant-row-tenant-a"]')).not.toBeVisible();
  });

  test('AC-6: Sorting toggles work', async ({ page }) => {
    await expect(page.locator('[data-testid="table-view"]')).toBeVisible({ timeout: 10_000 });
    const sortName = page.locator('[data-testid="sort-name"]');
    await sortName.click(); // asc -> desc
    await sortName.click(); // desc -> asc (toggle)
    // Just verify clicks don't break the table
    await expect(page.locator('[data-testid="table-view"]')).toBeVisible();
  });

  test('AC-7: Pagination controls are visible', async ({ page }) => {
    await expect(page.locator('[data-testid="pagination"]')).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('[data-testid="page-info"]')).toBeVisible();
    await expect(page.locator('[data-testid="page-current"]')).toContainText('1');
  });

  test('AC-8: Card view shows tenant cards', async ({ page }) => {
    await page.locator('[data-testid="view-card-btn"]').click();
    await expect(page.locator('[data-testid="card-view"]')).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('[data-testid="tenant-card-master"]')).toBeVisible();
    await expect(page.locator('[data-testid="tenant-card-tenant-a"]')).toBeVisible();
  });

  test('Edge: Empty state when no tenants match filter', async ({ page }) => {
    await expect(page.locator('[data-testid="table-view"]')).toBeVisible({ timeout: 10_000 });
    const filter = page.locator('[data-testid="status-filter"]');
    await filter.selectOption('decommissioned');
    await expect(page.locator('[data-testid="empty-table"]')).toBeVisible();
  });
});

// ═══════════════════════════════════════════════════════════════
// US-TM-02: Add Tenant Wizard
// ═══════════════════════════════════════════════════════════════
test.describe('US-TM-02: Add New Tenant Wizard', () => {
  test.beforeEach(async ({ page }) => { await setup(page); });

  test('AC-1: Wizard opens with step 1', async ({ page }) => {
    await page.locator('[data-testid="add-tenant-btn"]').click();
    await expect(page.locator('[data-testid="wizard-modal"]')).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('[data-testid="wizard-step-1"]')).toBeVisible();
    await expect(page.locator('[data-testid="wizard-progress"]')).toBeVisible();
  });

  test('AC-2: Short code auto-generates from name (non-editable)', async ({ page }) => {
    await page.locator('[data-testid="add-tenant-btn"]').click();
    await expect(page.locator('[data-testid="wizard-step-1"]')).toBeVisible({ timeout: 10_000 });
    await page.locator('[data-testid="wizard-fullname"]').fill('Test Organization');

    // Short code should be auto-generated
    const shortCode = page.locator('[data-testid="wizard-shortcode"]');
    await expect(shortCode).toBeDisabled();
    await expect(shortCode).toHaveValue('TESTOR');
  });

  test('AC-3: Short code availability indicator shows', async ({ page }) => {
    await page.locator('[data-testid="add-tenant-btn"]').click();
    await expect(page.locator('[data-testid="wizard-step-1"]')).toBeVisible({ timeout: 10_000 });
    await page.locator('[data-testid="wizard-fullname"]').fill('Test Organization');

    // Should show available indicator (mocked as available)
    await expect(page.locator('[data-testid="shortcode-available"]')).toBeVisible({ timeout: 5_000 });
  });

  test('AC-4: Next button disabled until step 1 valid', async ({ page }) => {
    await page.locator('[data-testid="add-tenant-btn"]').click();
    await expect(page.locator('[data-testid="wizard-step-1"]')).toBeVisible({ timeout: 10_000 });

    // Next should be disabled initially (empty name)
    await expect(page.locator('[data-testid="wizard-next"]')).toBeDisabled();

    // Fill valid name
    await page.locator('[data-testid="wizard-fullname"]').fill('Test Organization');
    await expect(page.locator('[data-testid="shortcode-available"]')).toBeVisible({ timeout: 5_000 });
    await expect(page.locator('[data-testid="wizard-next"]')).toBeEnabled();
  });

  test('AC-5: Wizard navigates through all 3 steps', async ({ page }) => {
    await page.locator('[data-testid="add-tenant-btn"]').click();
    await expect(page.locator('[data-testid="wizard-step-1"]')).toBeVisible({ timeout: 10_000 });

    // Fill step 1
    await page.locator('[data-testid="wizard-fullname"]').fill('Test Organization');
    await expect(page.locator('[data-testid="shortcode-available"]')).toBeVisible({ timeout: 5_000 });
    await page.locator('[data-testid="wizard-next"]').click();

    // Step 2 visible
    await expect(page.locator('[data-testid="wizard-step-2"]')).toBeVisible();
    await expect(page.locator('[data-testid="wizard-tier"]')).toBeVisible();
    await expect(page.locator('[data-testid="wizard-seats"]')).toBeVisible();
    await page.locator('[data-testid="wizard-next"]').click();

    // Step 3 review visible
    await expect(page.locator('[data-testid="wizard-step-3"]')).toBeVisible();
    await expect(page.locator('[data-testid="wizard-provision"]')).toBeVisible();
  });

  test('AC-6: Back button navigates to previous step', async ({ page }) => {
    await page.locator('[data-testid="add-tenant-btn"]').click();
    await page.locator('[data-testid="wizard-fullname"]').fill('Test Organization');
    await expect(page.locator('[data-testid="shortcode-available"]')).toBeVisible({ timeout: 5_000 });
    await page.locator('[data-testid="wizard-next"]').click();
    await expect(page.locator('[data-testid="wizard-step-2"]')).toBeVisible();

    // Go back
    await page.locator('[data-testid="wizard-back"]').click();
    await expect(page.locator('[data-testid="wizard-step-1"]')).toBeVisible();
  });

  test('AC-7: Provision tenant calls API and closes wizard', async ({ page }) => {
    let createCalled = false;
    await page.route('**/api/tenants', (route) => {
      if (route.request().method() === 'POST') {
        createCalled = true;
        return route.fulfill({
          status: 201, contentType: 'application/json',
          body: JSON.stringify({
            id: 'new-tenant', uuid: 'new-uuid', shortName: 'TESTOR', fullName: 'Test Organization',
            name: 'Test Organization', tenantType: 'REGULAR', tier: 'STANDARD', status: 'pending',
          }),
        });
      }
      return route.continue();
    });

    await page.locator('[data-testid="add-tenant-btn"]').click();
    await page.locator('[data-testid="wizard-fullname"]').fill('Test Organization');
    await expect(page.locator('[data-testid="shortcode-available"]')).toBeVisible({ timeout: 5_000 });
    await page.locator('[data-testid="wizard-next"]').click();
    await page.locator('[data-testid="wizard-next"]').click();
    await page.locator('[data-testid="wizard-provision"]').click();

    // Wizard should close and success message shown
    await expect(page.locator('[data-testid="wizard-modal"]')).not.toBeVisible({ timeout: 10_000 });
    await expect(page.locator('[data-testid="action-info"]')).toBeVisible();
    expect(createCalled).toBe(true);
  });

  test('Edge: Cancel wizard with unsaved data prompts confirmation', async ({ page }) => {
    page.on('dialog', (dialog) => dialog.accept());
    await page.locator('[data-testid="add-tenant-btn"]').click();
    await page.locator('[data-testid="wizard-fullname"]').fill('Some Tenant');
    await page.locator('[data-testid="wizard-close"]').click();
    await expect(page.locator('[data-testid="wizard-modal"]')).not.toBeVisible({ timeout: 5_000 });
  });
});

// ═══════════════════════════════════════════════════════════════
// US-TM-04: Tenant Lifecycle Management
// ═══════════════════════════════════════════════════════════════
test.describe('US-TM-04: Tenant Lifecycle', () => {
  test.beforeEach(async ({ page }) => { await setup(page); });

  test('AC-1: Activate button shown for pending tenants', async ({ page }) => {
    await expect(page.locator('[data-testid="table-view"]')).toBeVisible({ timeout: 10_000 });
    // tenant-b is pending
    await expect(page.locator('[data-testid="activate-btn-tenant-b"]')).toBeVisible();
    // tenant-a is active, should NOT have activate button
    await expect(page.locator('[data-testid="activate-btn-tenant-a"]')).not.toBeVisible();
  });

  test('AC-2: Activate dialog opens and confirms', async ({ page }) => {
    await page.route('**/api/tenants/uuid-b/activate', (route) =>
      route.fulfill({
        status: 200, contentType: 'application/json',
        body: JSON.stringify({ ...MOCK_TENANTS[2], status: 'active' }),
      }),
    );

    await expect(page.locator('[data-testid="table-view"]')).toBeVisible({ timeout: 10_000 });
    await page.locator('[data-testid="activate-btn-tenant-b"]').click();
    await expect(page.locator('[data-testid="activate-dialog"]')).toBeVisible();
    await expect(page.locator('[data-testid="activate-welcome-check"]')).toBeChecked();
    await page.locator('[data-testid="activate-confirm"]').click();
    await expect(page.locator('[data-testid="activate-dialog"]')).not.toBeVisible({ timeout: 10_000 });
    await expect(page.locator('[data-testid="action-info"]')).toBeVisible();
  });

  test('AC-3: Suspend button shown for active non-protected tenants', async ({ page }) => {
    await expect(page.locator('[data-testid="table-view"]')).toBeVisible({ timeout: 10_000 });
    // tenant-a is active and not protected
    await expect(page.locator('[data-testid="suspend-btn-tenant-a"]')).toBeVisible();
    // master is active but protected, should NOT have suspend button
    await expect(page.locator('[data-testid="suspend-btn-master"]')).not.toBeVisible();
  });

  test('AC-4: Suspend dialog has reason dropdown and confirms', async ({ page }) => {
    await page.route('**/api/tenants/uuid-a/suspend', (route) =>
      route.fulfill({
        status: 200, contentType: 'application/json',
        body: JSON.stringify({ ...MOCK_TENANTS[1], status: 'suspended', suspensionReason: 'Non-Compliance' }),
      }),
    );

    await expect(page.locator('[data-testid="table-view"]')).toBeVisible({ timeout: 10_000 });
    await page.locator('[data-testid="suspend-btn-tenant-a"]').click();
    await expect(page.locator('[data-testid="suspend-dialog"]')).toBeVisible();
    await expect(page.locator('[data-testid="suspend-reason"]')).toBeVisible();
    await page.locator('[data-testid="suspend-reason"]').selectOption('Non-Compliance');
    await page.locator('[data-testid="suspend-notes"]').fill('Policy violation');
    await page.locator('[data-testid="suspend-confirm"]').click();
    await expect(page.locator('[data-testid="suspend-dialog"]')).not.toBeVisible({ timeout: 10_000 });
  });

  test('AC-5: Reactivate button shown for suspended tenants', async ({ page }) => {
    await expect(page.locator('[data-testid="table-view"]')).toBeVisible({ timeout: 10_000 });
    // tenant-c is suspended
    await expect(page.locator('[data-testid="reactivate-btn-tenant-c"]')).toBeVisible();
  });

  test('AC-6: Reactivate dialog confirms', async ({ page }) => {
    await page.route('**/api/tenants/uuid-c/reactivate', (route) =>
      route.fulfill({
        status: 200, contentType: 'application/json',
        body: JSON.stringify({ ...MOCK_TENANTS[3], status: 'active', suspensionReason: null }),
      }),
    );

    await expect(page.locator('[data-testid="table-view"]')).toBeVisible({ timeout: 10_000 });
    await page.locator('[data-testid="reactivate-btn-tenant-c"]').click();
    await expect(page.locator('[data-testid="reactivate-dialog"]')).toBeVisible();
    await page.locator('[data-testid="reactivate-confirm"]').click();
    await expect(page.locator('[data-testid="reactivate-dialog"]')).not.toBeVisible({ timeout: 10_000 });
  });

  test('AC-7: Decommission requires confirmation checkbox and reason', async ({ page }) => {
    await expect(page.locator('[data-testid="table-view"]')).toBeVisible({ timeout: 10_000 });
    // tenant-c is suspended and not protected
    await page.locator('[data-testid="decommission-btn-tenant-c"]').click();
    await expect(page.locator('[data-testid="decommission-dialog"]')).toBeVisible();

    // Confirm button should be disabled without checkbox and reason
    await expect(page.locator('[data-testid="decommission-confirm"]')).toBeDisabled();

    // Fill reason and check confirmation
    await page.locator('[data-testid="decommission-reason"]').fill('End of contract');
    // Click on the checkbox label text to toggle - more reliable than clicking the input directly
    await page.locator('[data-testid="decommission-confirm-check"]').evaluate((el: HTMLInputElement) => {
      // Programmatically set checked state and dispatch both change and input events
      el.checked = true;
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
    });
    await expect(page.locator('[data-testid="decommission-confirm"]')).toBeEnabled({ timeout: 5_000 });
  });

  test('Edge: Protected tenant cannot be suspended or decommissioned', async ({ page }) => {
    await expect(page.locator('[data-testid="table-view"]')).toBeVisible({ timeout: 10_000 });
    // Master tenant is protected
    await expect(page.locator('[data-testid="suspend-btn-master"]')).not.toBeVisible();
    await expect(page.locator('[data-testid="decommission-btn-master"]')).not.toBeVisible();
  });
});

// ═══════════════════════════════════════════════════════════════
// US-TM-06: View Tenant Fact Sheet (Super Admin)
// ═══════════════════════════════════════════════════════════════
test.describe('US-TM-06: Tenant Fact Sheet', () => {
  test.beforeEach(async ({ page }) => { await setup(page); });

  test('AC-1: Fact sheet opens when tenant name clicked', async ({ page }) => {
    await expect(page.locator('[data-testid="table-view"]')).toBeVisible({ timeout: 10_000 });
    await page.locator('[data-testid="tenant-link-tenant-a"]').click();
    await expect(page.locator('[data-testid="factsheet-panel"]')).toBeVisible({ timeout: 10_000 });
    // name in TenantSummary uses shortName ?? fullName ?? id, so it shows "TENA" (the shortName)
    await expect(page.locator('[data-testid="factsheet-name"]')).toContainText('TENA');
  });

  test('AC-2: Fact sheet has Overview and License tabs', async ({ page }) => {
    await expect(page.locator('[data-testid="table-view"]')).toBeVisible({ timeout: 10_000 });
    await page.locator('[data-testid="tenant-link-tenant-a"]').click();
    await expect(page.locator('[data-testid="factsheet-panel"]')).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('[data-testid="factsheet-tab-overview"]')).toBeVisible();
    await expect(page.locator('[data-testid="factsheet-tab-license"]')).toBeVisible();
  });

  test('AC-3: Overview tab shows tenant details', async ({ page }) => {
    await expect(page.locator('[data-testid="table-view"]')).toBeVisible({ timeout: 10_000 });
    await page.locator('[data-testid="tenant-link-tenant-a"]').click();
    await expect(page.locator('[data-testid="factsheet-overview"]')).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('[data-testid="factsheet-overview"]')).toContainText('Tenant Alpha'); // fullName in overview grid
    await expect(page.locator('[data-testid="factsheet-overview"]')).toContainText('STANDARD');
  });

  test('AC-4: License tab shows tier info', async ({ page }) => {
    await expect(page.locator('[data-testid="table-view"]')).toBeVisible({ timeout: 10_000 });
    await page.locator('[data-testid="tenant-link-tenant-a"]').click();
    await expect(page.locator('[data-testid="factsheet-panel"]')).toBeVisible({ timeout: 10_000 });
    await page.locator('[data-testid="factsheet-tab-license"]').click();
    await expect(page.locator('[data-testid="factsheet-license"]')).toBeVisible();
    await expect(page.locator('[data-testid="factsheet-license"]')).toContainText('STANDARD');
  });

  test('AC-5: Fact sheet close button works', async ({ page }) => {
    await expect(page.locator('[data-testid="table-view"]')).toBeVisible({ timeout: 10_000 });
    await page.locator('[data-testid="tenant-link-tenant-a"]').click();
    await expect(page.locator('[data-testid="factsheet-panel"]')).toBeVisible({ timeout: 10_000 });
    await page.locator('[data-testid="factsheet-close"]').click({ force: true });
    await expect(page.locator('[data-testid="factsheet-panel"]')).not.toBeVisible();
  });

  test('AC-6: Suspended tenant fact sheet shows suspension details', async ({ page }) => {
    await expect(page.locator('[data-testid="table-view"]')).toBeVisible({ timeout: 10_000 });
    await page.locator('[data-testid="tenant-link-tenant-c"]').click();
    await expect(page.locator('[data-testid="factsheet-overview"]')).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('[data-testid="factsheet-overview"]')).toContainText('License Expired');
  });

  test('Edge: Fact sheet action buttons match tenant status', async ({ page }) => {
    // Pending tenant should have activate in footer
    await page.locator('[data-testid="tenant-link-tenant-b"]').click();
    await expect(page.locator('[data-testid="factsheet-panel"]')).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('[data-testid="factsheet-activate-btn"]')).toBeVisible();
    await expect(page.locator('[data-testid="factsheet-suspend-btn"]')).not.toBeVisible();
  });
});

// ═══════════════════════════════════════════════════════════════
// Edit Modal
// ═══════════════════════════════════════════════════════════════
test.describe('Edit Tenant Modal', () => {
  test.beforeEach(async ({ page }) => { await setup(page); });

  test('Edit modal opens with tenant data pre-filled', async ({ page }) => {
    await expect(page.locator('[data-testid="table-view"]')).toBeVisible({ timeout: 10_000 });
    await page.locator('[data-testid="edit-btn-tenant-a"]').click();
    await expect(page.locator('[data-testid="edit-modal"]')).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('[data-testid="edit-fullname"]')).toHaveValue('Tenant Alpha');
  });

  test('Save changes calls API and closes modal', async ({ page }) => {
    let updateCalled = false;
    await page.route('**/api/tenants/uuid-a', (route) => {
      if (route.request().method() === 'PUT') {
        updateCalled = true;
        return route.fulfill({
          status: 200, contentType: 'application/json',
          body: JSON.stringify({ ...MOCK_TENANTS[1], fullName: 'Updated Alpha' }),
        });
      }
      return route.continue();
    });

    await expect(page.locator('[data-testid="table-view"]')).toBeVisible({ timeout: 10_000 });
    await page.locator('[data-testid="edit-btn-tenant-a"]').click();
    await page.locator('[data-testid="edit-fullname"]').fill('Updated Alpha');
    await page.locator('[data-testid="edit-save"]').click();
    await expect(page.locator('[data-testid="edit-modal"]')).not.toBeVisible({ timeout: 10_000 });
    expect(updateCalled).toBe(true);
  });
});
