import { Injectable } from '@angular/core';
import { updatePreset } from '@primeuix/themes';
import { ComponentTokenMap, TenantBranding } from '../api/models';

@Injectable({ providedIn: 'root' })
export class TenantThemeService {
  applyBranding(branding: TenantBranding): void {
    this._applyRootCssVars(branding);
    this._applyPrimeNgPreset(branding);
    this._injectCustomCss(branding.customCss);
    if (branding.componentTokens && Object.keys(branding.componentTokens).length > 0) {
      this.applyComponentTokens(branding.componentTokens);
    }
  }

  applyComponentTokens(tokens: ComponentTokenMap): void {
    updatePreset({ components: tokens });
  }

  previewBranding(branding: Partial<TenantBranding>): void {
    this._applyRootCssVars(branding);
  }

  private _applyRootCssVars(b: Partial<TenantBranding>): void {
    const root = document.documentElement;
    if (b.primaryColor) {
      root.style.setProperty('--tp-primary', b.primaryColor);
      const rgb = this._hexToRgb(b.primaryColor);
      root.style.setProperty('--nm-accent-rgb', `${rgb.r}, ${rgb.g}, ${rgb.b}`);
      root.style.setProperty('--nm-accent', b.primaryColor);
    }
    if (b.primaryColorDark) root.style.setProperty('--tp-primary-dark', b.primaryColorDark);
    if (b.secondaryColor) {
      root.style.setProperty('--tp-primary-light', b.secondaryColor);
      root.style.setProperty('--tp-border', b.secondaryColor);
    }
    if (b.surfaceColor) {
      root.style.setProperty('--tp-bg', b.surfaceColor);
      root.style.setProperty('--tp-surface', b.surfaceColor);
      root.style.setProperty('--nm-bg', b.surfaceColor);
    }
    if (b.textColor) root.style.setProperty('--tp-text', b.textColor);
    if (b.shadowDarkColor) root.style.setProperty('--nm-shadow-dark', b.shadowDarkColor);
    if (b.shadowLightColor) root.style.setProperty('--nm-shadow-light', b.shadowLightColor);
    if (b.cornerRadius != null) root.style.setProperty('--nm-radius', b.cornerRadius + 'px');
    if (b.buttonDepth != null) root.style.setProperty('--nm-depth', b.buttonDepth + 'px');
    if (b.fontFamily) document.body.style.fontFamily = b.fontFamily;
  }

  private _applyPrimeNgPreset(b: TenantBranding): void {
    const palette = this._generatePalette(b.primaryColor);
    updatePreset({
      semantic: {
        primary: palette,
      },
    });
  }

  private _generatePalette(hex: string): Record<string, string> {
    const rgb = this._hexToRgb(hex);
    const hsl = this._rgbToHsl(rgb.r, rgb.g, rgb.b);

    const lightnesses = [97, 92, 82, 68, 52, 44, 37, 30, 22, 15, 9];
    const keys = ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900', '950'];
    const palette: Record<string, string> = {};

    for (let i = 0; i < keys.length; i++) {
      const sat = Math.min(100, hsl.s + (i < 4 ? (4 - i) * 2 : 0));
      palette[keys[i]] = this._hslToHex(hsl.h, sat, lightnesses[i]);
    }

    return palette;
  }

  private _hexToRgb(hex: string): { r: number; g: number; b: number } {
    const clean = hex.replace('#', '');
    return {
      r: parseInt(clean.substring(0, 2), 16),
      g: parseInt(clean.substring(2, 4), 16),
      b: parseInt(clean.substring(4, 6), 16),
    };
  }

  private _rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
    r /= 255;
    g /= 255;
    b /= 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const l = (max + min) / 2;
    let h = 0;
    let s = 0;

    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r:
          h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
          break;
        case g:
          h = ((b - r) / d + 2) / 6;
          break;
        case b:
          h = ((r - g) / d + 4) / 6;
          break;
      }
    }

    return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
  }

  private _hslToHex(h: number, s: number, l: number): string {
    s /= 100;
    l /= 100;
    const a = s * Math.min(l, 1 - l);
    const f = (n: number) => {
      const k = (n + h / 30) % 12;
      const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
      return Math.round(255 * color)
        .toString(16)
        .padStart(2, '0');
    };
    return `#${f(0)}${f(8)}${f(4)}`;
  }

  private _injectCustomCss(css?: string): void {
    let el = document.getElementById('tenant-custom-css') as HTMLStyleElement;
    if (!el) {
      el = document.createElement('style');
      el.id = 'tenant-custom-css';
      document.head.appendChild(el);
    }
    el.textContent = css ?? '';
  }
}
