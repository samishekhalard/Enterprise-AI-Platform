import { cleanupStalePrimeDialogMasks } from './administration-overlay.util';

describe('cleanupStalePrimeDialogMasks', () => {
  afterEach(() => {
    document.body.innerHTML = '';
    document.body.className = '';
    document.body.style.cssText = '';
    document.documentElement.className = '';
    document.documentElement.style.cssText = '';
  });

  it('removes stale dialog masks outside master definitions', () => {
    document.body.innerHTML = '<div class="p-dialog-mask"></div>';
    document.body.classList.add('p-overflow-hidden');
    document.documentElement.classList.add('p-overflow-hidden');
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';

    cleanupStalePrimeDialogMasks(document, 'tenant-manager');

    expect(document.body.querySelector('.p-dialog-mask')).toBeNull();
    expect(document.body.classList.contains('p-overflow-hidden')).toBe(false);
    expect(document.documentElement.classList.contains('p-overflow-hidden')).toBe(false);
    expect(document.body.style.overflow).toBe('');
    expect(document.documentElement.style.overflow).toBe('');
  });

  it('keeps masks in master definitions', () => {
    document.body.innerHTML = '<div class="p-dialog-mask"></div>';

    cleanupStalePrimeDialogMasks(document, 'master-definitions');

    expect(document.body.querySelector('.p-dialog-mask')).not.toBeNull();
  });

  it('keeps mask when a dialog is still visible', () => {
    document.body.innerHTML = `
      <div class="p-dialog-mask"></div>
      <div class="p-dialog" style="display: block; visibility: visible"></div>
    `;

    cleanupStalePrimeDialogMasks(document, 'tenant-manager');

    expect(document.body.querySelector('.p-dialog-mask')).not.toBeNull();
  });
});
