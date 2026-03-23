import { chromium } from '@playwright/test';

const browser = await chromium.connectOverCDP('http://localhost:9222');
const contexts = browser.contexts();

for (const context of contexts) {
  for (const page of context.pages()) {
    if (page.url().includes('localhost:4200')) {
      console.log('=== Connected to:', page.url(), '===\n');
      
      // Get recent console messages
      page.on('console', msg => {
        console.log('[CONSOLE]', msg.type().toUpperCase(), '-', msg.text());
      });
      
      page.on('response', res => {
        if (res.url().includes('/api/')) {
          res.text().then(body => {
            console.log('[RESPONSE]', res.status(), res.url());
            if (res.status() >= 400) {
              console.log('[ERROR BODY]', body.substring(0, 500));
            }
          }).catch(() => {});
        }
      });
      
      // Try login
      console.log('Attempting login...\n');
      
      try {
        const emailBtn = page.getByRole('button', { name: /Sign in with Email/i });
        if (await emailBtn.isVisible({ timeout: 1000 })) {
          await emailBtn.click();
          await page.waitForTimeout(500);
        }
      } catch (e) {}
      
      await page.getByLabel(/email/i).fill('admin@think.ae');
      await page.getByLabel(/password/i).fill('admin123');
      await page.getByRole('button', { name: 'Sign In', exact: true }).click();
      
      await page.waitForTimeout(3000);
      console.log('\nFinal URL:', page.url());
    }
  }
}

await browser.close();
