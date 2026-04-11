import { expect, test, type Page } from '@playwright/test';

type TokenSnapshot = {
  tpSurface: string;
  tpSurfaceRaised: string;
  tpSurfaceLight: string;
  tpBorder: string;
  tpText: string;
  tpTextSecondary: string;
  tpPrimary: string;
  pInputBorder: string;
  pSelectBorder: string;
  pDialogBackground: string;
};

test.describe('brand studio preview style contract', () => {
  test('uses sanctioned surfaces, borders, shadows, and form tokens', async ({ page }) => {
    await page.goto('/brand-studio-preview');

    const tokens = await getTokens(page);

    const sidebar = page.locator('.studio-sidebar');
    await expect(sidebar).toHaveCSS('background-color', hexToRgb(tokens.tpSurfaceRaised));
    await expect(sidebar).toHaveCSS('border-color', hexToRgb(tokens.tpBorder));
    await expect(sidebar).toHaveCSS('box-shadow', 'none');

    const content = page.locator('.studio-content');
    await expect(content).toHaveCSS('background-color', hexToRgb(tokens.tpSurfaceRaised));
    await expect(content).toHaveCSS('border-color', hexToRgb(tokens.tpBorder));
    await expect(content).toHaveCSS('box-shadow', 'none');

    const firstSelect = page.locator('.typography-col-font .p-select').first();
    await expect(firstSelect).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
    await expect(firstSelect).toHaveCSS('border-color', rgbaCss(tokens.pSelectBorder));
    await expect(firstSelect).toHaveCSS('border-radius', '999px');
    await expect(firstSelect).toHaveCSS('box-shadow', 'none');

    await page.getByRole('button', { name: 'Color System' }).click();

    const selectedPalettePanel = page.locator('.palette-selection-panel').first();
    await expect(selectedPalettePanel).toHaveCSS('box-shadow', 'none');

    const selectedPaletteHeader = selectedPalettePanel.locator('.p-panel-header');
    await expect(selectedPaletteHeader).toHaveCSS('background-color', hexToRgb(tokens.tpSurface));
    await expect(selectedPaletteHeader).toHaveCSS('border-color', hexToRgb(tokens.tpBorder));

    const paletteToken = page.locator('.palette-summary-token').first();
    await expect(paletteToken).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');

    await page.getByRole('button', { name: 'Iconography' }).click();

    const addLibraryButton = page.getByRole('button', { name: 'Add Library' });
    await expect(addLibraryButton).toHaveCSS('background-color', hexToRgb(tokens.tpPrimary));
    await expect(addLibraryButton).toHaveCSS('border-color', hexToRgb(tokens.tpPrimary));
    await expect(addLibraryButton).toHaveCSS('color', hexToRgb(tokens.tpSurfaceLight));

    await addLibraryButton.click();

    const dialog = page.locator('.p-dialog');
    await expect(dialog).toHaveCSS('background-color', hexToRgb(tokens.pDialogBackground));
    await expect(dialog).not.toHaveCSS('box-shadow', 'none');

    const nameInput = page.locator('#icon-library-name');
    await expect(nameInput).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
    await expect(nameInput).toHaveCSS('border-color', rgbaCss(tokens.pInputBorder));
    await expect(nameInput).toHaveCSS('border-radius', '999px');
    await expect(nameInput).toHaveValue('Icon Library #2');

    const uploadButton = page.locator('.iconography-upload-button');
    await expect(uploadButton).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
    await expect(uploadButton).toHaveCSS('border-color', hexToRgb(tokens.tpBorder));
    await expect(uploadButton).toHaveCSS('color', hexToRgb(tokens.tpText));

    const uploadDropbox = page.locator('.iconography-dropbox');
    await expect(uploadDropbox).toHaveCSS('background-color', hexToRgb(tokens.tpSurface));
    await expect(uploadDropbox).toHaveCSS('border-color', hexToRgb(tokens.tpBorder));
  });
});

async function getTokens(page: Page): Promise<TokenSnapshot> {
  return page.evaluate(() => {
    const root = getComputedStyle(document.documentElement);
    return {
      tpSurface: root.getPropertyValue('--tp-surface').trim(),
      tpSurfaceRaised: root.getPropertyValue('--tp-surface-raised').trim(),
      tpSurfaceLight: root.getPropertyValue('--tp-surface-light').trim(),
      tpBorder: root.getPropertyValue('--tp-border').trim(),
      tpText: root.getPropertyValue('--tp-text').trim(),
      tpTextSecondary: root.getPropertyValue('--tp-text-secondary').trim(),
      tpPrimary: root.getPropertyValue('--tp-primary').trim(),
      pInputBorder: root.getPropertyValue('--p-inputtext-border-color').trim(),
      pSelectBorder: root.getPropertyValue('--p-select-border-color').trim(),
      pDialogBackground: root.getPropertyValue('--p-dialog-background').trim(),
    };
  });
}

function hexToRgb(hex: string): string {
  const normalized = hex.replace('#', '');
  const value = normalized.length === 3
    ? normalized
        .split('')
        .map((char) => char + char)
        .join('')
    : normalized;

  const r = Number.parseInt(value.slice(0, 2), 16);
  const g = Number.parseInt(value.slice(2, 4), 16);
  const b = Number.parseInt(value.slice(4, 6), 16);
  return `rgb(${r}, ${g}, ${b})`;
}

function rgbaCss(value: string): string {
  return value
    .replace(/\s+/g, ' ')
    .replace(/,\s+/g, ', ')
    .trim();
}
