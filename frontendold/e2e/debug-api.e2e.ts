import { test, expect } from '@playwright/test';

test('debug tenant resolution', async ({ page }) => {
  page.on('request', request => {
    if (request.url().includes('/api/tenants')) {
      console.log('REQUEST:', request.method(), request.url());
      console.log('HEADERS:', JSON.stringify(request.headers(), null, 2));
    }
  });

  page.on('response', response => {
    if (response.url().includes('/api/tenants')) {
      console.log('RESPONSE:', response.status(), response.url());
      response.text().then(body => console.log('BODY:', body.substring(0, 500)));
    }
  });

  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('Tenant') || text.includes('tenant') || text.includes('HTTP') || text.includes('error')) {
      console.log('CONSOLE:', text);
    }
  });

  await page.goto('/');
  await page.waitForTimeout(5000);
});
