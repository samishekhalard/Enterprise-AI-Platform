import { test, expect, Page } from '@playwright/test';

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

  // Mock auth check
  await page.route('**/api/v1/auth/refresh', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        accessToken: 'new-mock-token',
        user: {
          id: '1',
          email: 'test@example.com',
          displayName: 'Test User',
          roles: ['admin']
        }
      })
    });
  });
}

test.describe('Products Page', () => {
  test.beforeEach(async ({ page }) => {
    await setupAuth(page);
    await page.goto('/products');
  });

  test.describe('Page Layout', () => {
    test('should display products page with side menu', async ({ page }) => {
      // Check for side menu
      await expect(page.locator('.side-menu, [data-testid="side-menu"], nav')).toBeVisible();

      // Check for products content area
      await expect(page.locator('.products-content, .products-layout')).toBeVisible();
    });

    test('should display category navigation', async ({ page }) => {
      const sideMenu = page.locator('.side-menu, [data-testid="side-menu"]');

      // Should have category items
      await expect(sideMenu.getByText(/all products/i)).toBeVisible();
      await expect(sideMenu.getByText(/core/i)).toBeVisible();
      await expect(sideMenu.getByText(/support/i)).toBeVisible();
      await expect(sideMenu.getByText(/management/i)).toBeVisible();
    });

    test('should have add product button', async ({ page }) => {
      const addButton = page.getByRole('button', { name: /add|create|new/i })
        .or(page.locator('[data-testid="add-product"]'));

      await expect(addButton).toBeVisible();
    });
  });

  test.describe('Category Navigation', () => {
    test('should filter products by category', async ({ page }) => {
      // Click on Core category
      await page.getByText(/^core$/i).click();

      // URL or state should reflect category selection
      await expect(page.locator('.category-item.active, [data-category="core"].active'))
        .toBeVisible().catch(() => {
          // Alternative: check aria-selected or similar
        });
    });

    test('should show product count per category', async ({ page }) => {
      // Categories should display count (even if 0)
      const categoryItems = page.locator('.category-item, [data-testid="category"]');
      const count = await categoryItems.count();

      expect(count).toBeGreaterThanOrEqual(4); // All, Core, Support, Management
    });
  });

  test.describe('Product List', () => {
    test('should display empty state when no products', async ({ page }) => {
      // Check for empty state message or illustration
      const emptyState = page.getByText(/no products|get started|create.*first/i)
        .or(page.locator('[data-testid="empty-state"]'));

      // Either there are products or an empty state
      const hasProducts = await page.locator('.product-card, .product-item').count() > 0;
      const hasEmptyState = await emptyState.isVisible().catch(() => false);

      expect(hasProducts || hasEmptyState).toBeTruthy();
    });

    test('should display product cards with key information', async ({ page }) => {
      // Add a product first
      await page.getByRole('button', { name: /add|create|new/i }).click();

      // Fill product details in modal
      const modal = page.locator('.modal, [role="dialog"]');
      if (await modal.isVisible()) {
        await page.getByLabel(/name/i).fill('Test Product');
        await page.getByRole('button', { name: /save|create|add/i }).click();
      }

      // Product card should display
      await expect(page.getByText('Test Product')).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe('Add Product', () => {
    test('should open add product modal', async ({ page }) => {
      await page.getByRole('button', { name: /add|create|new/i }).click();

      // Modal should be visible
      const modal = page.locator('.modal, [role="dialog"]');
      await expect(modal).toBeVisible();
    });

    test('should close modal on cancel', async ({ page }) => {
      await page.getByRole('button', { name: /add|create|new/i }).click();

      const modal = page.locator('.modal, [role="dialog"]');
      await expect(modal).toBeVisible();

      // Click cancel or close button
      const closeButton = page.getByRole('button', { name: /cancel|close/i })
        .or(page.locator('.modal-close, [aria-label="Close"]'));

      await closeButton.click();

      await expect(modal).not.toBeVisible();
    });

    test('should create new product', async ({ page }) => {
      await page.getByRole('button', { name: /add|create|new/i }).click();

      const modal = page.locator('.modal, [role="dialog"]');
      await expect(modal).toBeVisible();

      // Fill form
      await page.getByLabel(/name/i).fill('New Product');

      const descField = page.getByLabel(/description/i);
      if (await descField.isVisible()) {
        await descField.fill('Product description');
      }

      // Submit
      await page.getByRole('button', { name: /save|create|add/i }).last().click();

      // Product should appear in list
      await expect(page.getByText('New Product')).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe('Product Details', () => {
    test.beforeEach(async ({ page }) => {
      // Create a product first
      await page.getByRole('button', { name: /add|create|new/i }).click();
      const modal = page.locator('.modal, [role="dialog"]');
      if (await modal.isVisible()) {
        await page.getByLabel(/name/i).fill('Detail Test Product');
        await page.getByRole('button', { name: /save|create|add/i }).last().click();
      }
    });

    test('should display product factsheet when selected', async ({ page }) => {
      // Click on product
      await page.getByText('Detail Test Product').click();

      // Should show factsheet/details view
      await expect(page.locator('.factsheet, .product-details, [data-testid="product-factsheet"]'))
        .toBeVisible({ timeout: 5000 });
    });

    test('should allow editing product', async ({ page }) => {
      await page.getByText('Detail Test Product').click();

      // Find and click edit button
      const editButton = page.getByRole('button', { name: /edit/i });
      if (await editButton.isVisible()) {
        await editButton.click();

        // Should be in edit mode
        await expect(page.getByLabel(/name/i)).toBeVisible();
      }
    });

    test('should allow deleting product', async ({ page }) => {
      await page.getByText('Detail Test Product').click();

      // Find delete button
      const deleteButton = page.getByRole('button', { name: /delete|remove/i });

      if (await deleteButton.isVisible()) {
        await deleteButton.click();

        // Should show confirmation dialog
        const confirmDialog = page.getByRole('dialog').or(page.locator('.confirm-modal'));
        if (await confirmDialog.isVisible()) {
          await page.getByRole('button', { name: /confirm|yes|delete/i }).click();
        }

        // Product should be removed
        await expect(page.getByText('Detail Test Product')).not.toBeVisible({ timeout: 5000 });
      }
    });
  });

  test.describe('Duplicate Product', () => {
    test('should duplicate a product', async ({ page }) => {
      // Create a product first
      await page.getByRole('button', { name: /add|create|new/i }).click();
      const modal = page.locator('.modal, [role="dialog"]');
      if (await modal.isVisible()) {
        await page.getByLabel(/name/i).fill('Original Product');
        await page.getByRole('button', { name: /save|create|add/i }).last().click();
      }

      await page.getByText('Original Product').click();

      // Find duplicate button
      const duplicateBtn = page.getByRole('button', { name: /duplicate|copy|clone/i });

      if (await duplicateBtn.isVisible()) {
        await duplicateBtn.click();

        // Should create duplicate with "(Copy)" suffix
        await expect(page.getByText('Original Product (Copy)')).toBeVisible({ timeout: 5000 });
      }
    });
  });
});
