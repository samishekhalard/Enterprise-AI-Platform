import { expect, test } from '@playwright/test';

/**
 * US-AB-01: Platform About Page E2E Tests
 *
 * Tests verify the About page renders correctly with all 4 sections:
 * Hero, Features, Mission, Technology Stack, and Footer.
 * The About page is a standalone lazy-loaded route at /about.
 */

test.describe('US-AB-01: Platform About Page', () => {
  test.beforeEach(async ({ page }) => {
    // About page has no auth guard, so we can navigate directly
    await page.goto('/about');
    await page.waitForSelector('[data-testid="about-page"]', { timeout: 15_000 });
  });

  // AC-1: Display About Page
  test('AC-1: About page renders with all 4 sections + footer', async ({ page }) => {
    await expect(page.locator('[data-testid="about-page"]')).toBeVisible();
    await expect(page.locator('[data-testid="about-hero"]')).toBeVisible();
    await expect(page.locator('[data-testid="about-features"]')).toBeVisible();
    await expect(page.locator('[data-testid="about-mission"]')).toBeVisible();
    await expect(page.locator('[data-testid="about-tech-stack"]')).toBeVisible();
    await expect(page.locator('[data-testid="about-footer"]')).toBeVisible();
  });

  // AC-2: Hero Section
  test('AC-2: Hero section shows platform name and tagline', async ({ page }) => {
    await expect(page.locator('[data-testid="about-platform-name"]')).toContainText(
      'BitX Government Platform',
    );
    await expect(page.locator('[data-testid="about-tagline"]')).toContainText(
      'Intelligent Product Management Powered by AI Agents',
    );
  });

  // AC-3: Features Section - 4 capability cards
  test('AC-3: Features section shows 4 capability cards', async ({ page }) => {
    await expect(page.locator('[data-testid="about-feature-clipboard"]')).toBeVisible();
    await expect(page.locator('[data-testid="about-feature-brain"]')).toBeVisible();
    await expect(page.locator('[data-testid="about-feature-shield"]')).toBeVisible();
    await expect(page.locator('[data-testid="about-feature-archive"]')).toBeVisible();

    // Each card has title and description
    await expect(page.locator('[data-testid="about-feature-clipboard"]')).toContainText('Backlog Management');
    await expect(page.locator('[data-testid="about-feature-brain"]')).toContainText('AI Agent Orchestration');
    await expect(page.locator('[data-testid="about-feature-shield"]')).toContainText('SDLC Phase Gates');
    await expect(page.locator('[data-testid="about-feature-archive"]')).toContainText('Artifact Tracking');
  });

  // AC-4: Mission Statement
  test('AC-4: Mission section shows centered paragraph', async ({ page }) => {
    const missionText = page.locator('[data-testid="about-mission-text"]');
    await expect(missionText).toBeVisible();
    await expect(missionText).toContainText('BitX Government Platform');
  });

  // AC-5: Technology Stack
  test('AC-5: Technology stack shows 4 badges', async ({ page }) => {
    await expect(page.locator('[data-testid="about-tech-spring-boot"]')).toBeVisible();
    await expect(page.locator('[data-testid="about-tech-angular"]')).toBeVisible();
    await expect(page.locator('[data-testid="about-tech-postgresql"]')).toBeVisible();
    await expect(page.locator('[data-testid="about-tech-neo4j"]')).toBeVisible();
  });

  // AC-6: Footer with version and copyright
  test('AC-6: Footer shows version and copyright', async ({ page }) => {
    await expect(page.locator('[data-testid="about-version"]')).toContainText('Version');
    await expect(page.locator('[data-testid="about-copyright"]')).toContainText('BitX Government Platform');
    await expect(page.locator('[data-testid="about-back-link"]')).toBeVisible();
    await expect(page.locator('[data-testid="about-back-link"]')).toContainText('Back to Administration');
  });

  // Edge case: Navigation link works
  test('Edge: Back to Administration link navigates correctly', async ({ page }) => {
    // Intercept all API calls for the admin page
    await page.route('**/api/**', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: '{}' }),
    );

    const link = page.locator('[data-testid="about-back-link"]');
    await expect(link).toHaveAttribute('href', '/administration');
  });
});
