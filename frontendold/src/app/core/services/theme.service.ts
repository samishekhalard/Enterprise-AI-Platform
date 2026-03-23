import { Injectable, signal, computed, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { TenantBranding, DEFAULT_BRANDING } from '../../models/tenant.model';

/**
 * ThemeService
 *
 * Manages dynamic theming for multi-tenant applications.
 * Applies tenant-specific branding via CSS custom properties.
 *
 * Features:
 * - Dynamic CSS variable injection
 * - Favicon updates
 * - Custom font loading
 * - Custom CSS injection
 * - Dark mode support
 */
@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private platformId = inject(PLATFORM_ID);

  // Theme state
  private _currentBranding = signal<TenantBranding>(DEFAULT_BRANDING);
  private _isDarkMode = signal(false);
  private _isApplied = signal(false);

  // Public readonly signals
  readonly currentBranding = this._currentBranding.asReadonly();
  readonly isDarkMode = this._isDarkMode.asReadonly();
  readonly isApplied = this._isApplied.asReadonly();

  // Computed values
  readonly primaryColor = computed(() => this._currentBranding().primaryColor);
  readonly logoUrl = computed(() => {
    const branding = this._currentBranding();
    return this._isDarkMode() && branding.logoUrlDark
      ? branding.logoUrlDark
      : branding.logoUrl;
  });

  // CSS variable prefix
  private readonly CSS_VAR_PREFIX = '--tenant';

  // Style element reference
  private customStyleElement: HTMLStyleElement | null = null;

  /**
   * Apply tenant branding to the application
   */
  applyTheme(branding: TenantBranding): void {
    if (!isPlatformBrowser(this.platformId)) return;

    this._currentBranding.set(branding);
    this.applyColorVariables(branding);
    this.applyTypography(branding);
    this.updateFavicon(branding.faviconUrl);
    this.injectCustomCss(branding.customCss);
    this._isApplied.set(true);
  }

  /**
   * Reset theme to default branding
   */
  resetTheme(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    this.applyTheme(DEFAULT_BRANDING);
    this.removeCustomCss();
    this._isApplied.set(false);
  }

  /**
   * Toggle dark mode
   */
  toggleDarkMode(): void {
    this._isDarkMode.update(v => !v);
    this.applyDarkModeClass();
  }

  /**
   * Set dark mode explicitly
   */
  setDarkMode(enabled: boolean): void {
    this._isDarkMode.set(enabled);
    this.applyDarkModeClass();
  }

  /**
   * Get CSS variable value
   */
  getCssVariable(name: string): string {
    if (!isPlatformBrowser(this.platformId)) return '';
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  }

  /**
   * Set a single CSS variable
   */
  setCssVariable(name: string, value: string): void {
    if (!isPlatformBrowser(this.platformId)) return;
    document.documentElement.style.setProperty(name, value);
  }

  // =========================================================================
  // Private Methods
  // =========================================================================

  /**
   * Apply color CSS variables
   */
  private applyColorVariables(branding: TenantBranding): void {
    const root = document.documentElement;

    // Primary colors
    root.style.setProperty(`${this.CSS_VAR_PREFIX}-primary`, branding.primaryColor);
    root.style.setProperty(`${this.CSS_VAR_PREFIX}-primary-dark`, branding.primaryColorDark);
    root.style.setProperty(`${this.CSS_VAR_PREFIX}-secondary`, branding.secondaryColor);

    if (branding.accentColor) {
      root.style.setProperty(`${this.CSS_VAR_PREFIX}-accent`, branding.accentColor);
    }

    // Generate color variations
    this.generateColorVariations('primary', branding.primaryColor);
    this.generateColorVariations('secondary', branding.secondaryColor);

    // Logo URLs (for CSS background-image usage)
    root.style.setProperty(`${this.CSS_VAR_PREFIX}-logo-url`, `url('${branding.logoUrl}')`);
    if (branding.logoUrlDark) {
      root.style.setProperty(`${this.CSS_VAR_PREFIX}-logo-url-dark`, `url('${branding.logoUrlDark}')`);
    }
    if (branding.loginBackgroundUrl) {
      root.style.setProperty(`${this.CSS_VAR_PREFIX}-login-bg`, `url('${branding.loginBackgroundUrl}')`);
    }
  }

  /**
   * Apply typography settings
   */
  private applyTypography(branding: TenantBranding): void {
    const root = document.documentElement;

    root.style.setProperty(`${this.CSS_VAR_PREFIX}-font-family`, branding.fontFamily);
    if (branding.headingFontFamily) {
      root.style.setProperty(`${this.CSS_VAR_PREFIX}-heading-font`, branding.headingFontFamily);
    }

    // Load custom fonts if needed
    this.loadCustomFonts(branding.fontFamily);
    if (branding.headingFontFamily) {
      this.loadCustomFonts(branding.headingFontFamily);
    }
  }

  /**
   * Update page favicon
   */
  private updateFavicon(faviconUrl: string): void {
    // Find or create favicon link element
    let link: HTMLLinkElement | null = document.querySelector("link[rel*='icon']");

    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.head.appendChild(link);
    }

    link.href = faviconUrl;
  }

  /**
   * Inject custom CSS from tenant config
   */
  private injectCustomCss(customCss?: string): void {
    // Remove existing custom styles
    this.removeCustomCss();

    if (!customCss) return;

    // Create and inject style element
    this.customStyleElement = document.createElement('style');
    this.customStyleElement.id = 'tenant-custom-styles';
    this.customStyleElement.textContent = this.sanitizeCss(customCss);
    document.head.appendChild(this.customStyleElement);
  }

  /**
   * Remove injected custom CSS
   */
  private removeCustomCss(): void {
    if (this.customStyleElement) {
      this.customStyleElement.remove();
      this.customStyleElement = null;
    }

    // Also try to find by ID in case reference was lost
    const existing = document.getElementById('tenant-custom-styles');
    if (existing) {
      existing.remove();
    }
  }

  /**
   * Generate color variations (lighter/darker)
   */
  private generateColorVariations(name: string, baseColor: string): void {
    const root = document.documentElement;
    const rgb = this.hexToRgb(baseColor);

    if (!rgb) return;

    // Generate variations
    const variations = [
      { suffix: '-50', factor: 0.95 },
      { suffix: '-100', factor: 0.9 },
      { suffix: '-200', factor: 0.8 },
      { suffix: '-300', factor: 0.6 },
      { suffix: '-400', factor: 0.4 },
      { suffix: '-500', factor: 0 },
      { suffix: '-600', factor: -0.1 },
      { suffix: '-700', factor: -0.2 },
      { suffix: '-800', factor: -0.3 },
      { suffix: '-900', factor: -0.4 }
    ];

    variations.forEach(({ suffix, factor }) => {
      const adjusted = this.adjustBrightness(rgb, factor);
      root.style.setProperty(
        `${this.CSS_VAR_PREFIX}-${name}${suffix}`,
        `rgb(${adjusted.r}, ${adjusted.g}, ${adjusted.b})`
      );
    });

    // RGB values for rgba() usage
    root.style.setProperty(`${this.CSS_VAR_PREFIX}-${name}-rgb`, `${rgb.r}, ${rgb.g}, ${rgb.b}`);
  }

  /**
   * Convert hex color to RGB
   */
  private hexToRgb(hex: string): { r: number; g: number; b: number } | null {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16)
        }
      : null;
  }

  /**
   * Adjust color brightness
   */
  private adjustBrightness(
    rgb: { r: number; g: number; b: number },
    factor: number
  ): { r: number; g: number; b: number } {
    if (factor > 0) {
      // Lighten
      return {
        r: Math.round(rgb.r + (255 - rgb.r) * factor),
        g: Math.round(rgb.g + (255 - rgb.g) * factor),
        b: Math.round(rgb.b + (255 - rgb.b) * factor)
      };
    } else {
      // Darken
      const absFactor = Math.abs(factor);
      return {
        r: Math.round(rgb.r * (1 - absFactor)),
        g: Math.round(rgb.g * (1 - absFactor)),
        b: Math.round(rgb.b * (1 - absFactor))
      };
    }
  }

  /**
   * Load custom fonts (if they're Google Fonts)
   */
  private loadCustomFonts(fontFamily: string): void {
    // Extract font name from font-family string
    const fontMatch = fontFamily.match(/'([^']+)'/);
    if (!fontMatch) return;

    const fontName = fontMatch[1];

    // Skip system fonts
    const systemFonts = ['system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Arial', 'sans-serif'];
    if (systemFonts.some(sf => fontName.toLowerCase().includes(sf.toLowerCase()))) {
      return;
    }

    // Check if font is already loaded
    const existingLink = document.querySelector(`link[href*="${encodeURIComponent(fontName)}"]`);
    if (existingLink) return;

    // For Google Fonts, we could add dynamic loading here
    // For now, assume fonts are pre-loaded or bundled
  }

  /**
   * Apply dark mode class to document
   */
  private applyDarkModeClass(): void {
    if (this._isDarkMode()) {
      document.documentElement.classList.add('dark-mode');
    } else {
      document.documentElement.classList.remove('dark-mode');
    }
  }

  /**
   * Sanitize custom CSS to prevent XSS
   */
  private sanitizeCss(css: string): string {
    // Remove potentially dangerous content
    return css
      .replace(/@import/gi, '/* @import blocked */')
      .replace(/javascript:/gi, '')
      .replace(/expression\(/gi, '')
      .replace(/url\s*\(\s*["']?\s*data:/gi, 'url(data:blocked,')
      .replace(/<\/?script/gi, '');
  }
}

// ============================================================================
// CSS Variable Reference
// ============================================================================

/**
 * Available CSS variables after theme is applied:
 *
 * Colors:
 * --tenant-primary: Primary brand color
 * --tenant-primary-dark: Darker primary variant
 * --tenant-secondary: Secondary brand color
 * --tenant-accent: Accent color (optional)
 * --tenant-primary-50 to --tenant-primary-900: Color scale
 * --tenant-primary-rgb: RGB values for rgba() usage
 *
 * Typography:
 * --tenant-font-family: Primary font family
 * --tenant-heading-font: Heading font family (optional)
 *
 * Images:
 * --tenant-logo-url: Logo URL for CSS usage
 * --tenant-logo-url-dark: Dark mode logo (optional)
 * --tenant-login-bg: Login background image (optional)
 *
 * Usage in SCSS:
 * .my-component {
 *   background: var(--tenant-primary);
 *   color: white;
 *   font-family: var(--tenant-font-family);
 * }
 *
 * .overlay {
 *   background: rgba(var(--tenant-primary-rgb), 0.5);
 * }
 */
