import { test, expect } from '@playwright/test';

/**
 * Grey Neutral Runtime Acceptance Sweep
 *
 * Inspects computed background-color of key surfaces on every admin screen.
 *
 * Expected surface hierarchy:
 *   Page background: #F2EFE9 / rgb(242, 239, 233)
 *   Raised cards/panels: #FAF8F4 / rgb(250, 248, 244)
 *   Recessed wells: #E0DDDA / rgb(224, 221, 218)
 *
 * Forbidden: pure white (#ffffff / rgb(255, 255, 255)) as any surface background
 */

const BASE = 'http://localhost:24200';
const CREDS = { identifier: 'admin.user', password: 'AdminPass1!' };
const TENANT = '68cd2a56-98c9-4ed4-8534-c299566d5b27';

function isAcceptableBackground(color: string): boolean {
  if (color === 'rgba(0, 0, 0, 0)' || color === 'transparent') return true;
  // rgba with very low alpha
  const rgbaMatch = color.match(/rgba\((\d+),\s*(\d+),\s*(\d+),\s*([\d.]+)\)/);
  if (rgbaMatch) {
    const alpha = parseFloat(rgbaMatch[4]);
    if (alpha < 0.05) return true;
    const [, r, g, b] = rgbaMatch.map(Number);
    if (r === 255 && g === 255 && b === 255 && alpha > 0.5) return false;
    return true;
  }
  const match = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
  if (match) {
    const [, r, g, b] = match.map(Number);
    if (r === 255 && g === 255 && b === 255) return false;
    if (r > 252 && g > 252 && b > 252) return false;
    if (r >= 200 && g >= 200 && b >= 200 && r >= b) return true;
  }
  return true;
}

async function login(page: import('@playwright/test').Page) {
  await page.goto(`${BASE}/auth/login`);
  await page.click('.signin-btn');
  await page.waitForSelector('#identifier', { timeout: 5000 });
  await page.fill('#identifier', CREDS.identifier);
  await page.fill('#password', CREDS.password);
  await page.fill('#tenant-id', TENANT);
  await page.click('button[type="submit"]');
  await page.waitForURL('**/administration**', { timeout: 15000 });
}

interface SurfaceResult {
  selector: string;
  background: string;
  passed: boolean;
}

async function inspectSurfaces(
  page: import('@playwright/test').Page,
  selectors: string[],
): Promise<SurfaceResult[]> {
  const results: SurfaceResult[] = [];
  for (const selector of selectors) {
    try {
      const el = page.locator(selector).first();
      if ((await el.count()) === 0) continue;
      const bg = await el.evaluate(
        (node) => getComputedStyle(node).backgroundColor,
      );
      results.push({
        selector,
        background: bg,
        passed: isAcceptableBackground(bg),
      });
    } catch {
      // element not interactable or gone
    }
  }
  return results;
}

const SURFACE_SELECTORS = [
  'body',
  '.admin-layout',
  '.admin-content',
  'p-card',
  '.p-card',
  '.p-card-body',
  '.p-card-content',
  '.p-tabpanels',
  '.p-tabpanel',
  '.p-select',
  '.p-inputtext',
  '.p-datatable',
  '.p-datatable-table',
  '.p-datatable-thead',
  '.p-datatable-tbody',
  '.p-paginator',
  '.p-dialog',
  '.p-dialog-content',
  '.p-dialog-header',
  '.p-menu',
  '.p-menuitem',
];

const ADMIN_SECTIONS = [
  'tenant-manager',
  'license-manager',
  'master-locale',
  'master-definitions',
] as const;

test.describe('Grey Neutral Runtime Acceptance', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('Administration shell (default section)', async ({ page }) => {
    await page.waitForTimeout(1500);
    const results = await inspectSurfaces(page, SURFACE_SELECTORS);
    console.log('ADMIN SHELL:', JSON.stringify(results, null, 2));
    const failures = results.filter((r) => !r.passed);
    expect(failures).toEqual([]);
  });

  for (const section of ADMIN_SECTIONS) {
    test(`${section} surfaces`, async ({ page }) => {
      await page.goto(`${BASE}/administration?section=${section}`);
      await page.waitForTimeout(2000);
      const results = await inspectSurfaces(page, SURFACE_SELECTORS);
      console.log(`${section}:`, JSON.stringify(results, null, 2));
      const failures = results.filter((r) => !r.passed);
      expect(failures).toEqual([]);
    });
  }

  test('Branding Studio (tenant fact sheet)', async ({ page }) => {
    await page.goto(`${BASE}/administration?section=tenant-manager`);
    await page.waitForTimeout(2000);
    // Try to open a tenant fact sheet
    const clickTarget = page.locator('[data-testid="tenant-row"], tr.p-datatable-row, .tenant-card').first();
    if ((await clickTarget.count()) > 0) {
      await clickTarget.click();
      await page.waitForTimeout(1500);
    }
    const results = await inspectSurfaces(page, [
      ...SURFACE_SELECTORS,
      '.branding-studio',
      '.fact-sheet',
      '.color-swatch',
    ]);
    console.log('BRANDING STUDIO:', JSON.stringify(results, null, 2));
    const failures = results.filter((r) => !r.passed);
    expect(failures).toEqual([]);
  });
});
