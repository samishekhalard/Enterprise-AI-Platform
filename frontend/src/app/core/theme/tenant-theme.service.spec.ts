import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { TenantThemeService } from './tenant-theme.service';
import { TenantBranding } from '../api/models';

/**
 * Unit tests for TenantThemeService.
 *
 * Angular 21's @angular/build:unit-test does NOT support vi.mock().
 * Tests use Angular TestBed and vi.spyOn for DOM side-effect observation.
 *
 * Covers:
 * 1. applyBranding() -- sets --tp-primary CSS var
 * 2. applyBranding() -- sets --tp-bg CSS var with surfaceColor
 * 3. applyBranding() -- sets --nm-shadow-dark and --nm-shadow-light
 * 4. applyBranding() -- injects <style id="tenant-custom-css">
 * 5. applyBranding() -- calls updatePreset (verified: no throw)
 * 6. previewBranding() -- sets CSS vars only
 * 7. _injectCustomCss() -- reuses existing <style> element
 * 8. CSS var integration -- actual DOM values verified
 */
describe('TenantThemeService', () => {
  let service: TenantThemeService;
  let setPropertySpy: ReturnType<typeof vi.spyOn>;

  const mockBranding: TenantBranding = {
    primaryColor: '#428177',
    primaryColorDark: '#054239',
    secondaryColor: '#988561',
    surfaceColor: '#F2EFE9',
    textColor: '#3d3a3b',
    shadowDarkColor: '#988561',
    shadowLightColor: '#F5E6D0',
    logoUrl: '',
    logoUrlDark: '',
    faviconUrl: '',
    loginBackgroundUrl: '',
    customCss: '.test { color: red; }',
    cornerRadius: 16,
    buttonDepth: 12,
    shadowIntensity: 50,
    softShadows: true,
    compactNav: false,
    hoverButton: 'lift',
    hoverCard: 'lift',
    hoverInput: 'press',
    hoverNav: 'slide',
    hoverTableRow: 'highlight',
    updatedAt: '2026-03-02T10:30:00Z',
  };

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TenantThemeService);
    setPropertySpy = vi.spyOn(document.documentElement.style, 'setProperty');

    // Clean up any injected style elements from previous tests
    const existingStyle = document.getElementById('tenant-custom-css');
    if (existingStyle) {
      existingStyle.remove();
    }
  });

  afterEach(() => {
    setPropertySpy.mockRestore();
    const existingStyle = document.getElementById('tenant-custom-css');
    if (existingStyle) {
      existingStyle.remove();
    }
    // Clean up CSS vars set by tests
    const root = document.documentElement;
    [
      '--tp-primary',
      '--tp-warning',
      '--tp-primary-dark',
      '--tp-bg',
      '--tp-surface',
      '--tp-text',
      '--nm-shadow-dark',
      '--nm-shadow-light',
      '--nm-accent-rgb',
      '--nm-radius',
      '--nm-depth',
    ].forEach((v) => root.style.removeProperty(v));
    document.body.style.removeProperty('font-family');
  });

  // =========================================================================
  // applyBranding()
  // =========================================================================

  describe('applyBranding()', () => {
    it('should set --tp-primary CSS var on document.documentElement', () => {
      service.applyBranding(mockBranding);

      expect(setPropertySpy).toHaveBeenCalledWith('--tp-primary', '#428177');
    });

    it('should set --tp-bg CSS var with surfaceColor value', () => {
      service.applyBranding(mockBranding);

      expect(setPropertySpy).toHaveBeenCalledWith('--tp-bg', '#F2EFE9');
    });

    it('should set --tp-surface CSS var with surfaceColor value (--nm-bg cascades via alias)', () => {
      service.applyBranding(mockBranding);

      expect(setPropertySpy).toHaveBeenCalledWith('--tp-surface', '#F2EFE9');
      expect(setPropertySpy).not.toHaveBeenCalledWith('--nm-bg', expect.any(String));
    });

    it('should set --nm-shadow-dark and --nm-shadow-light CSS vars', () => {
      service.applyBranding(mockBranding);

      expect(setPropertySpy).toHaveBeenCalledWith('--nm-shadow-dark', '#988561');
      expect(setPropertySpy).toHaveBeenCalledWith('--nm-shadow-light', '#F5E6D0');
    });

    it('should set --tp-text CSS var with textColor value', () => {
      service.applyBranding(mockBranding);

      expect(setPropertySpy).toHaveBeenCalledWith('--tp-text', '#3d3a3b');
    });

    it('should set --nm-radius and --nm-depth CSS vars from cornerRadius and buttonDepth', () => {
      service.applyBranding(mockBranding);

      expect(setPropertySpy).toHaveBeenCalledWith('--nm-radius', '16px');
      expect(setPropertySpy).toHaveBeenCalledWith('--nm-depth', '12px');
    });

    it('should set --tp-warning CSS var with secondaryColor value', () => {
      service.applyBranding(mockBranding);

      expect(setPropertySpy).toHaveBeenCalledWith('--tp-warning', '#988561');
    });

    it('should set --tp-primary-dark CSS var when primaryColorDark exists', () => {
      service.applyBranding(mockBranding);

      expect(setPropertySpy).toHaveBeenCalledWith('--tp-primary-dark', '#054239');
    });

    it('should set neumorphic accent RGB channels from primary color (--nm-accent cascades via alias)', () => {
      service.applyBranding(mockBranding);

      expect(setPropertySpy).not.toHaveBeenCalledWith('--nm-accent', expect.any(String));
      expect(setPropertySpy).toHaveBeenCalledWith('--nm-accent-rgb', '66, 129, 119');
    });

    it('should inject <style id="tenant-custom-css"> with customCss content', () => {
      service.applyBranding(mockBranding);

      const styleEl = document.getElementById('tenant-custom-css') as HTMLStyleElement;
      expect(styleEl).not.toBeNull();
      expect(styleEl.tagName).toBe('STYLE');
      expect(styleEl.textContent).toBe('.test { color: red; }');
    });

    it('should call updatePreset without throwing (palette generation works)', () => {
      expect(() => service.applyBranding(mockBranding)).not.toThrow();
    });

    it('should clear legacy inline font-family overrides on document.body', () => {
      document.body.style.fontFamily = 'Arial, sans-serif';
      service.applyBranding(mockBranding);

      expect(document.body.style.fontFamily).toBe('');
    });
  });

  // =========================================================================
  // previewBranding()
  // =========================================================================

  describe('previewBranding()', () => {
    it('should set CSS vars from partial branding', () => {
      service.previewBranding({ primaryColor: '#ff0000', surfaceColor: '#000000' });

      expect(setPropertySpy).toHaveBeenCalledWith('--tp-primary', '#ff0000');
      expect(setPropertySpy).toHaveBeenCalledWith('--tp-bg', '#000000');
    });

    it('should not inject custom CSS (preview only applies CSS vars)', () => {
      service.previewBranding({
        customCss: '.preview { color: blue; }',
      } as Partial<TenantBranding>);

      const styleEl = document.getElementById('tenant-custom-css');
      expect(styleEl).toBeNull();
    });

    it('should only set CSS vars for provided fields (sparse partial)', () => {
      service.previewBranding({ textColor: '#111111' });

      expect(setPropertySpy).toHaveBeenCalledWith('--tp-text', '#111111');
      // primaryColor is undefined so --tp-primary should NOT be set
      expect(setPropertySpy).not.toHaveBeenCalledWith('--tp-primary', expect.any(String));
      expect(setPropertySpy).not.toHaveBeenCalledWith('--tp-bg', expect.any(String));
    });
  });

  // =========================================================================
  // _injectCustomCss() -- reuse behavior (tested via applyBranding)
  // =========================================================================

  describe('custom CSS injection (via applyBranding)', () => {
    it('should reuse existing <style> element on second call (no duplicates)', () => {
      service.applyBranding(mockBranding);
      service.applyBranding({ ...mockBranding, customCss: '.second { color: blue; }' });

      const styleElements = document.querySelectorAll('#tenant-custom-css');
      expect(styleElements.length).toBe(1);
      expect(styleElements[0].textContent).toBe('.second { color: blue; }');
    });

    it('should clear custom CSS when customCss is undefined', () => {
      service.applyBranding(mockBranding);
      expect(document.getElementById('tenant-custom-css')?.textContent).toBe(
        '.test { color: red; }',
      );

      service.applyBranding({ ...mockBranding, customCss: undefined as unknown as string });

      const styleEl = document.getElementById('tenant-custom-css');
      expect(styleEl).not.toBeNull();
      expect(styleEl?.textContent).toBe('');
    });
  });

  // =========================================================================
  // Computed CSS var values (verify actual DOM state)
  // =========================================================================

  describe('CSS var integration (actual DOM)', () => {
    it('should have correct computed CSS var values after applyBranding', () => {
      service.applyBranding(mockBranding);

      const root = document.documentElement;
      expect(root.style.getPropertyValue('--tp-primary')).toBe('#428177');
      expect(root.style.getPropertyValue('--tp-bg')).toBe('#F2EFE9');
      expect(root.style.getPropertyValue('--nm-shadow-dark')).toBe('#988561');
      expect(root.style.getPropertyValue('--nm-shadow-light')).toBe('#F5E6D0');
      expect(root.style.getPropertyValue('--nm-radius')).toBe('16px');
      expect(root.style.getPropertyValue('--nm-depth')).toBe('12px');
    });

    it('should update CSS vars when branding changes', () => {
      service.applyBranding(mockBranding);
      expect(document.documentElement.style.getPropertyValue('--tp-primary')).toBe('#428177');

      service.applyBranding({ ...mockBranding, primaryColor: '#ff0000' });
      expect(document.documentElement.style.getPropertyValue('--tp-primary')).toBe('#ff0000');
    });
  });
});
