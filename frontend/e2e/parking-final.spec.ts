import { test, expect } from '@playwright/test';

const PARKING_URL = 'http://localhost:24200/dev/parking';

test('parking page loads directly without redirect', async ({ page }) => {
  // Go directly to parking (no home page visit first)
  await page.goto(PARKING_URL, { waitUntil: 'domcontentloaded', timeout: 15000 });
  await page.waitForTimeout(5000);

  const url = page.url();
  console.log('Final URL:', url);
  await page.screenshot({ path: 'e2e/screenshots/parking-direct.png', fullPage: true });

  expect(url).toContain('/dev/parking');
  await expect(page.locator('app-parking-preview')).toBeVisible();
});

test('parking page loads with stale token (simulating user browser)', async ({ page }) => {
  // Set stale tokens BEFORE navigating (simulates user's browser state)
  await page.addInitScript(() => {
    localStorage.setItem(
      'tp_access_token',
      'eyJhbGciOiJSUzI1NiJ9.eyJzdWIiOiJmYWtlIiwiZXhwIjoxNjAwMDAwMDAwfQ.fake',
    );
    localStorage.setItem('tp_refresh_token', 'expired-refresh-token');
  });

  await page.goto(PARKING_URL, { waitUntil: 'domcontentloaded', timeout: 15000 });
  await page.waitForTimeout(5000);

  const url = page.url();
  console.log('Final URL with stale token:', url);
  await page.screenshot({ path: 'e2e/screenshots/parking-stale-token.png', fullPage: true });

  // Check what happened
  if (url.includes('/auth/login')) {
    console.log('REDIRECTED TO LOGIN — stale token causes forceLogout');

    // Get console errors to understand which API call triggered 401
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });

    // Check network requests
    const requests: string[] = [];
    page.on('request', (req) => requests.push(`${req.method()} ${req.url()}`));
    page.on('response', (res) => {
      if (res.status() === 401) {
        console.log('401 response from:', res.url());
      }
    });
  }

  console.log('URL contains /dev/parking:', url.includes('/dev/parking'));
});

test('parking page with stale token — capture 401 source', async ({ page }) => {
  const responses401: string[] = [];

  page.on('response', (res) => {
    if (res.status() === 401) {
      responses401.push(res.url());
    }
  });

  // Set stale tokens before page load
  await page.addInitScript(() => {
    localStorage.setItem(
      'tp_access_token',
      'eyJhbGciOiJSUzI1NiJ9.eyJzdWIiOiJmYWtlIiwiZXhwIjoxNjAwMDAwMDAwfQ.fake',
    );
    localStorage.setItem('tp_refresh_token', 'expired-refresh-token');
  });

  await page.goto(PARKING_URL, { waitUntil: 'domcontentloaded', timeout: 15000 });
  await page.waitForTimeout(8000);

  console.log('401 responses:', responses401);
  console.log('Final URL:', page.url());

  await page.screenshot({ path: 'e2e/screenshots/parking-401-debug.png', fullPage: true });
});
