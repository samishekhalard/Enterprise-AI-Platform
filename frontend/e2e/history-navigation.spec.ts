import { expect, test } from '@playwright/test';

const ACCESS_TOKEN =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.' +
  'eyJzdWIiOiJ1c2VyLTEiLCJpYXQiOjE3MDAwMDAwMDB9.' +
  'mock-signature';
const REFRESH_TOKEN = 'mock-refresh-token-value';
const TENANT_ID = '00000000-0000-0000-0000-000000000001';

async function mockApi(page: import('@playwright/test').Page): Promise<void> {
  await page.route('**/api/**', (route) => {
    const url = route.request().url();
    const method = route.request().method();

    if (url.includes('/api/v1/auth/login') && method === 'POST') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          accessToken: ACCESS_TOKEN,
          refreshToken: REFRESH_TOKEN,
        }),
      });
    }

    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({}),
    });
  });
}

async function login(page: import('@playwright/test').Page): Promise<void> {
  await page.goto('/auth/login');
  await page.getByRole('button', { name: 'Sign in with Email' }).click();

  await page.locator('#identifier').fill('master-admin@example.com');
  await page.locator('#password').fill('Password123!');
  await page.locator('#tenant-id').fill(TENANT_ID);
  await page.getByRole('button', { name: 'Sign In' }).click();

  await expect(page).toHaveURL(/\/administration/);
}

test.describe('Authenticated History Navigation', () => {
  test('back from administration does not surface login route', async ({ page }) => {
    await mockApi(page);
    await login(page);

    await page.goBack();
    await page.waitForLoadState('domcontentloaded');

    const currentUrl = page.url();
    expect(currentUrl).not.toContain('/auth/login');
  });

  test('license manager back/back path does not fall into login loop', async ({ page }) => {
    await mockApi(page);
    await login(page);

    // Button is in the dock and may be outside the viewport — use dispatchEvent to fire the click
    // without Playwright's viewport coordinate check
    await page.getByRole('button', { name: 'License Manager' }).dispatchEvent('click');
    await expect(page).toHaveURL(/section=license-manager/);

    await page.goBack();
    await page.waitForLoadState('domcontentloaded');
    expect(page.url()).not.toContain('/auth/login');

    await page.goBack();
    await page.waitForLoadState('domcontentloaded');
    expect(page.url()).not.toContain('/auth/login');

    await page.goForward();
    await page.waitForLoadState('domcontentloaded');
    expect(page.url()).not.toContain('/auth/login');
  });
});
