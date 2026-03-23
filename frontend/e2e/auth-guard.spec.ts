import { expect, test } from '@playwright/test';

test('unauthenticated access to administration redirects to login', async ({ page }) => {
  await page.goto('/administration');
  await expect(page).toHaveURL(/\/auth\/login/);
  await expect(page.getByText('Welcome to')).toBeVisible();
});
