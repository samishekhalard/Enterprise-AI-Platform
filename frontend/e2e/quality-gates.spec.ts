import { expect, test, type Page } from '@playwright/test';

const MOCK_TENANT_ID = '68cd2a56-98c9-4ed4-8534-c299566d5b27';
const MOCK_ACCESS_TOKEN =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2OGNkMmE1Ni05OGM5LTRlZDQtODUzNC1jMjk5NTY2ZDViMjciLCJyb2xlcyI6WyJTVVBFUl9BRE1JTiJdLCJ0ZW5hbnRJZCI6IjY4Y2QyYTU2LTk4YzktNGVkNC04NTM0LWMyOTk1NjZkNWIyNyJ9.signature';
const MOCK_REFRESH_TOKEN =
  'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiI2OGNkMmE1Ni05OGM5LTRlZDQtODUzNC1jMjk5NTY2ZDViMjciLCJ0eXBlIjoicmVmcmVzaCJ9.signature';

const TENANT_LIST_RESPONSE = {
  tenants: [
    {
      id: MOCK_TENANT_ID,
      uuid: MOCK_TENANT_ID,
      fullName: 'Master Tenant',
      shortName: 'master',
      status: 'ACTIVE',
      tenantType: 'MASTER',
      tier: 'ENTERPRISE',
      usersCount: 0,
      domainsCount: 1,
      primaryDomain: 'localhost',
      isProtected: true,
    },
  ],
  page: 1,
  limit: 200,
  total: 1,
};

const BRANDING_RESPONSE = {
  primaryColor: '#428177',
  secondaryColor: '#b9a779',
  surfaceColor: '#edebe0',
  textColor: '#3d3a3b',
  shadowDarkColor: '#988561',
  shadowLightColor: '#ffffff',
  logoUrl: null,
  faviconUrl: null,
  loginBackgroundUrl: null,
  fontFamily: 'Gotham Rounded, Nunito, sans-serif',
  customCss: null,
  cornerRadius: 18,
  buttonDepth: 10,
  shadowIntensity: 0.5,
  softShadows: true,
  compactNav: false,
  hoverButton: 'raise',
  hoverCard: 'lift',
  hoverInput: 'glow',
  hoverNav: 'slide',
  hoverTableRow: 'highlight',
  componentTokens: {},
};

async function mockTenantManagerApis(page: Page): Promise<void> {
  await page.route(/\/api\/tenants(?:\?.*)?$/, async (route) => {
    if (route.request().method() !== 'GET') {
      await route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
      return;
    }

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(TENANT_LIST_RESPONSE),
    });
  });

  await page.route(/\/api\/tenants\/[^/]+\/branding(?:\?.*)?$/, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(BRANDING_RESPONSE),
    });
  });

  await page.route(/\/api\/v1\/admin\/tenants\/[^/]+\/users(?:\?.*)?$/, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        content: [],
        page: 0,
        size: 20,
        totalElements: 0,
        totalPages: 0,
      }),
    });
  });
}

async function seedAuthSession(page: Page): Promise<void> {
  await page.addInitScript(
    ({ accessToken, refreshToken }) => {
      window.sessionStorage.setItem('tp_access_token', accessToken);
      window.sessionStorage.setItem('tp_refresh_token', refreshToken);
    },
    { accessToken: MOCK_ACCESS_TOKEN, refreshToken: MOCK_REFRESH_TOKEN },
  );
}

test.describe('Quality Gates', () => {
  test.beforeEach(async ({ page }) => {
    await page.route(/\/api\/tenants\/resolve(?:\?.*)?$/, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          resolved: true,
          tenant: {
            id: MOCK_TENANT_ID,
            uuid: MOCK_TENANT_ID,
            shortName: 'master',
            fullName: 'Master Tenant',
          },
        }),
      });
    });
  });

  test('compatibility smoke for tenant manager tabs', async ({ page }) => {
    await mockTenantManagerApis(page);
    await seedAuthSession(page);

    await page.goto('/administration?section=tenant-manager');

    await expect(page.getByRole('heading', { name: 'Tenants' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Overview' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Users' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Branding' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Licenses' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Authentication' })).toBeVisible();
  });

  test('visual regression baseline for login shell', async ({ page }) => {
    await page.goto('/auth/login');
    await expect(page.locator('.login-content')).toBeVisible();
    await expect(page.locator('.login-content')).toHaveScreenshot('quality-login-content.png', {
      animations: 'disabled',
      caret: 'hide',
    });
  });

  test('visual regression baseline for tenant-manager tabs', async ({ page }) => {
    await mockTenantManagerApis(page);
    await seedAuthSession(page);

    await page.goto('/administration?section=tenant-manager');
    const tablist = page.locator('.tenant-tabs .p-tablist').first();
    await expect(tablist).toBeVisible();
    await expect(tablist).toHaveScreenshot('quality-tenant-tabs.png', {
      animations: 'disabled',
      caret: 'hide',
    });
  });

  test('seo baseline metadata and semantics for login route', async ({ page }) => {
    await page.goto('/auth/login');

    await expect(page).toHaveTitle(/ThinkPLUS EMS/i);
    await expect(page.locator('meta[name="description"]')).toHaveCount(1);
    await expect(page.locator('meta[name="viewport"]')).toHaveCount(1);

    const htmlLang = await page.locator('html').getAttribute('lang');
    expect(htmlLang).toBe('en');

    const descriptionContent =
      (await page.locator('meta[name="description"]').getAttribute('content'))?.trim() ?? '';
    expect(descriptionContent.length).toBeGreaterThanOrEqual(40);

    await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
  });
});
