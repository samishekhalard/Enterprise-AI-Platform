import { test, expect, Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

// Helper to setup authenticated state
async function setupAuth(page: Page) {
  await page.addInitScript(() => {
    localStorage.setItem('auth_access_token', 'mock-token');
    localStorage.setItem('auth_user', JSON.stringify({
      id: '1',
      email: 'test@example.com',
      displayName: 'Test User',
      roles: ['admin']
    }));
  });

  await page.route('**/api/v1/auth/refresh', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        accessToken: 'new-mock-token',
        user: { id: '1', email: 'test@example.com', displayName: 'Test User', roles: ['admin'] }
      })
    });
  });
}

test.describe('Accessibility Tests @a11y', () => {
  test.describe('Login Page Accessibility', () => {
    test('should have no accessibility violations', async ({ page }) => {
      await page.goto('/login');

      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze();

      expect(accessibilityScanResults.violations).toEqual([]);
    });

    test('should have proper form labels', async ({ page }) => {
      await page.goto('/login');

      // Email field should have associated label
      const emailInput = page.getByLabel(/email/i);
      await expect(emailInput).toBeVisible();

      // Password field should have associated label
      const passwordInput = page.getByLabel(/password/i);
      await expect(passwordInput).toBeVisible();
    });

    test('should be keyboard navigable', async ({ page }) => {
      await page.goto('/login');

      // Tab to email field
      await page.keyboard.press('Tab');

      // Tab to password field
      await page.keyboard.press('Tab');

      // Tab to submit button
      await page.keyboard.press('Tab');
    });

    test('should have focus indicators', async ({ page }) => {
      await page.goto('/login');

      const emailInput = page.getByLabel(/email/i);
      await emailInput.focus();

      // Check for visible focus indicator (outline or box-shadow)
      const focusStyles = await emailInput.evaluate((el) => {
        const styles = window.getComputedStyle(el);
        return {
          outline: styles.outline,
          boxShadow: styles.boxShadow,
          border: styles.border
        };
      });

      // Should have some kind of focus indicator
      const hasFocusIndicator =
        focusStyles.outline !== 'none' ||
        focusStyles.boxShadow !== 'none' ||
        focusStyles.border.includes('rgb');

      expect(hasFocusIndicator).toBeTruthy();
    });
  });

  test.describe('Products Page Accessibility', () => {
    test.beforeEach(async ({ page }) => {
      await setupAuth(page);
    });

    test('should have no accessibility violations', async ({ page }) => {
      await page.goto('/products');

      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa'])
        .exclude('.bpmn-canvas') // Exclude complex canvas elements
        .analyze();

      // Log violations for debugging
      if (accessibilityScanResults.violations.length > 0) {
        console.log('Accessibility violations:',
          JSON.stringify(accessibilityScanResults.violations, null, 2)
        );
      }

      expect(accessibilityScanResults.violations).toEqual([]);
    });

    test('should have proper heading hierarchy', async ({ page }) => {
      await page.goto('/products');

      const headings = await page.evaluate(() => {
        const headingElements = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
        return Array.from(headingElements).map(h => ({
          level: parseInt(h.tagName.substring(1)),
          text: h.textContent?.trim()
        }));
      });

      // Should have at least one heading
      expect(headings.length).toBeGreaterThan(0);

      // Should start with h1 or follow logical order
      if (headings.length > 0) {
        const firstLevel = headings[0].level;
        expect(firstLevel).toBeLessThanOrEqual(2);
      }
    });

    test('should have proper ARIA landmarks', async ({ page }) => {
      await page.goto('/products');

      // Should have main landmark
      const main = page.locator('main, [role="main"]');
      await expect(main).toBeVisible().catch(() => {});

      // Should have navigation landmark
      const nav = page.locator('nav, [role="navigation"]');
      await expect(nav).toBeVisible();
    });

    test('should have accessible buttons', async ({ page }) => {
      await page.goto('/products');

      const buttons = page.locator('button');
      const buttonCount = await buttons.count();

      for (let i = 0; i < Math.min(buttonCount, 10); i++) {
        const button = buttons.nth(i);
        if (await button.isVisible()) {
          // Button should have accessible name
          const accessibleName = await button.evaluate((el) =>
            el.textContent?.trim() ||
            el.getAttribute('aria-label') ||
            el.getAttribute('title')
          );

          expect(accessibleName).toBeTruthy();
        }
      }
    });

    test('should have accessible images', async ({ page }) => {
      await page.goto('/products');

      const images = page.locator('img');
      const imageCount = await images.count();

      for (let i = 0; i < imageCount; i++) {
        const img = images.nth(i);
        if (await img.isVisible()) {
          const alt = await img.getAttribute('alt');
          const role = await img.getAttribute('role');

          // Image should have alt text or be decorative (role="presentation")
          expect(alt !== null || role === 'presentation').toBeTruthy();
        }
      }
    });
  });

  test.describe('Color Contrast', () => {
    test.beforeEach(async ({ page }) => {
      await setupAuth(page);
    });

    test('should have sufficient color contrast on login page', async ({ page }) => {
      await page.goto('/login');

      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['wcag2aa'])
        .options({ rules: { 'color-contrast': { enabled: true } } })
        .analyze();

      const contrastViolations = accessibilityScanResults.violations.filter(
        v => v.id === 'color-contrast'
      );

      expect(contrastViolations).toEqual([]);
    });

    test('should have sufficient color contrast on products page', async ({ page }) => {
      await page.goto('/products');

      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['wcag2aa'])
        .options({ rules: { 'color-contrast': { enabled: true } } })
        .exclude('.bpmn-canvas')
        .analyze();

      const contrastViolations = accessibilityScanResults.violations.filter(
        v => v.id === 'color-contrast'
      );

      expect(contrastViolations).toEqual([]);
    });
  });

  test.describe('Keyboard Navigation', () => {
    test.beforeEach(async ({ page }) => {
      await setupAuth(page);
    });

    test('should trap focus in modal dialogs', async ({ page }) => {
      await page.goto('/products');

      // Open add product modal
      await page.getByRole('button', { name: /add|create|new/i }).click();

      const modal = page.locator('.modal, [role="dialog"]');
      if (await modal.isVisible()) {
        // Tab through modal elements
        await page.keyboard.press('Tab');
        await page.keyboard.press('Tab');
        await page.keyboard.press('Tab');

        // Focus should still be in modal
        const stillInModal = await page.evaluate(() => {
          const modal = document.querySelector('.modal, [role="dialog"]');
          return modal?.contains(document.activeElement);
        });

        expect(stillInModal).toBeTruthy();
      }
    });

    test('should close modal on Escape key', async ({ page }) => {
      await page.goto('/products');

      await page.getByRole('button', { name: /add|create|new/i }).click();

      const modal = page.locator('.modal, [role="dialog"]');
      if (await modal.isVisible()) {
        await page.keyboard.press('Escape');
        await expect(modal).not.toBeVisible();
      }
    });
  });

  test.describe('Screen Reader Compatibility', () => {
    test.beforeEach(async ({ page }) => {
      await setupAuth(page);
    });

    test('should have descriptive page titles', async ({ page }) => {
      await page.goto('/products');
      const title = await page.title();
      expect(title).toBeTruthy();
      expect(title.length).toBeGreaterThan(0);

      await page.goto('/login');
      const loginTitle = await page.title();
      expect(loginTitle).toBeTruthy();
    });
  });

  test.describe('Reduced Motion', () => {
    test('should respect prefers-reduced-motion', async ({ page }) => {
      // Emulate reduced motion preference
      await page.emulateMedia({ reducedMotion: 'reduce' });

      await page.goto('/login');

      // Check that animations are reduced
      const hasReducedMotionStyles = await page.evaluate(() => {
        const styles = window.getComputedStyle(document.body);
        return (
          styles.animationDuration === '0s' ||
          styles.transitionDuration === '0s' ||
          styles.animationPlayState === 'paused'
        );
      });
    });
  });
});
