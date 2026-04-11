import { readFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';
import { describe, expect, it } from 'vitest';

/**
 * Design System Contract Tests
 *
 * These tests verify that the design system token definitions in styles.scss
 * are complete, correct, and that component SCSS files do not violate design
 * system conventions.
 *
 * This acts as a compile-time contract: if a token is removed, renamed, or a
 * component introduces a hardcoded value, these tests will fail.
 */

const FRONTEND_ROOT = join(__dirname, '..');
const STYLES_PATH = join(FRONTEND_ROOT, 'src/styles.scss');
const APP_PATH = join(FRONTEND_ROOT, 'src/app');
const REPO_ROOT = join(FRONTEND_ROOT, '..');
const SHOWCASE_PATH = join(REPO_ROOT, 'Documentation/design-system/component-showcase.html');
const TOKENS_DOC_PATH = join(REPO_ROOT, 'Documentation/design-system/tokens.css');
const DEFAULT_PRESET_SCSS_PATH = join(FRONTEND_ROOT, 'src/app/core/theme/default-preset.scss');
const GOVERNANCE_SCSS_PATH = join(
  FRONTEND_ROOT,
  'src/app/core/theme/advanced-css-governance.scss',
);

function readStylesScss(): string {
  return readFileSync(STYLES_PATH, 'utf-8');
}

function readShowcaseHtml(): string {
  return readFileSync(SHOWCASE_PATH, 'utf-8');
}

function readTokenSnapshot(): string {
  return readFileSync(TOKENS_DOC_PATH, 'utf-8');
}

function readDefaultPresetScss(): string {
  return readFileSync(DEFAULT_PRESET_SCSS_PATH, 'utf-8');
}

function readGovernanceScss(): string {
  return readFileSync(GOVERNANCE_SCSS_PATH, 'utf-8');
}

function parseTokenDeclarations(content: string): Map<string, string> {
  const tokens = new Map<string, string>();
  const matches = content.matchAll(/--([\w-]+)\s*:\s*([^;]+);/g);
  for (const match of matches) {
    tokens.set(`--${match[1]}`, match[2].trim());
  }
  return tokens;
}

function normalizeTokenValue(value: string | undefined): string | undefined {
  if (value === undefined) {
    return value;
  }

  return value
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/\(\s+/g, '(')
    .replace(/\s+\)/g, ')')
    .replace(/\s*,\s*/g, ',');
}

function collectScssFiles(dir: string): string[] {
  const files: string[] = [];
  try {
    const entries = readdirSync(dir);
    for (const entry of entries) {
      const fullPath = join(dir, entry);
      const stat = statSync(fullPath);
      if (stat.isDirectory()) {
        files.push(...collectScssFiles(fullPath));
      } else if (entry.endsWith('.scss') && !entry.includes('.spec.')) {
        files.push(fullPath);
      }
    }
  } catch {
    // Directory may not exist in test environment
  }
  return files;
}

function readScssFiles(): { path: string; content: string }[] {
  return collectScssFiles(APP_PATH).map((filePath) => ({
    path: filePath,
    content: readFileSync(filePath, 'utf-8'),
  }));
}

describe('Design System Tokens', () => {
  const styles = readStylesScss();

  // =========================================================================
  // Surface hierarchy tokens
  // =========================================================================
  describe('surface tokens', () => {
    const requiredSurfaceTokens = [
      '--tp-surface',
      '--tp-surface-raised',
      '--tp-surface-light',
      '--tp-surface-muted',
      '--nm-surface',
      '--tp-bg',
      '--nm-bg',
    ];

    it.each(requiredSurfaceTokens)('should define %s', (token) => {
      expect(styles).toContain(`${token}:`);
    });

    it('should maintain surface hierarchy (raised lighter than surface)', () => {
      // Extract hex values for surface tokens
      const surfaceMatch = styles.match(/--tp-surface:\s*(#[0-9a-fA-F]+)/);
      const raisedMatch = styles.match(/--tp-surface-raised:\s*(#[0-9a-fA-F]+)/);
      const nmSurfaceMatch = styles.match(/--nm-surface:\s*(#[0-9a-fA-F]+)/);

      expect(surfaceMatch).not.toBeNull();
      expect(raisedMatch).not.toBeNull();
      expect(nmSurfaceMatch).not.toBeNull();

      // Parse hex to numeric for comparison (higher = lighter)
      const parseHex = (hex: string): number => parseInt(hex.replace('#', ''), 16);

      const surfaceVal = parseHex(surfaceMatch![1]);
      const raisedVal = parseHex(raisedMatch![1]);
      const nmVal = parseHex(nmSurfaceMatch![1]);

      // raised > surface > nm-surface (lighter to darker)
      expect(raisedVal).toBeGreaterThan(surfaceVal);
      expect(surfaceVal).toBeGreaterThan(nmVal);
    });
  });

  // =========================================================================
  // Border tokens
  // =========================================================================
  describe('border tokens', () => {
    const requiredBorderTokens = ['--tp-border', '--nm-border-soft', '--tp-border-light'];

    it.each(requiredBorderTokens)('should define %s', (token) => {
      expect(styles).toContain(`${token}:`);
    });
  });

  // =========================================================================
  // Radius scale
  // =========================================================================
  describe('radius scale', () => {
    const requiredRadiusTokens = [
      '--nm-radius-xs',
      '--nm-radius-sm',
      '--nm-radius-md',
      '--nm-radius-lg',
      '--nm-radius-xl',
      '--nm-radius-pill',
    ];

    it.each(requiredRadiusTokens)('should define %s', (token) => {
      expect(styles).toContain(`${token}:`);
    });

    it('should have ascending radius values (xs < sm < md < lg < xl)', () => {
      const extractPx = (token: string): number => {
        const match = styles.match(new RegExp(`${token}:\\s*(\\d+)px`));
        expect(match).not.toBeNull();
        return parseInt(match![1], 10);
      };

      const xs = extractPx('--nm-radius-xs');
      const sm = extractPx('--nm-radius-sm');
      const md = extractPx('--nm-radius-md');
      const lg = extractPx('--nm-radius-lg');
      const xl = extractPx('--nm-radius-xl');

      expect(xs).toBeLessThan(sm);
      expect(sm).toBeLessThan(md);
      expect(md).toBeLessThan(lg);
      expect(lg).toBeLessThan(xl);
    });

    it('should define --nm-radius-pill as 999px', () => {
      expect(styles).toMatch(/--nm-radius-pill:\s*999px/);
    });
  });

  // =========================================================================
  // Type scale
  // =========================================================================
  describe('type scale', () => {
    const requiredFontTokens = [
      '--tp-font-xs',
      '--tp-font-sm',
      '--tp-font-md',
      '--tp-font-lg',
      '--tp-font-xl',
    ];

    it.each(requiredFontTokens)('should define %s', (token) => {
      expect(styles).toContain(`${token}:`);
    });

    it('should use rem units for all font tokens', () => {
      for (const token of requiredFontTokens) {
        const match = styles.match(new RegExp(`${token}:\\s*[\\d.]+rem`));
        expect(match).not.toBeNull();
      }
    });

    it('should have ascending font sizes (xs < sm < md < lg < xl)', () => {
      const extractRem = (token: string): number => {
        const match = styles.match(new RegExp(`${token}:\\s*([\\d.]+)rem`));
        expect(match).not.toBeNull();
        return parseFloat(match![1]);
      };

      const xs = extractRem('--tp-font-xs');
      const sm = extractRem('--tp-font-sm');
      const md = extractRem('--tp-font-md');
      const lg = extractRem('--tp-font-lg');
      const xl = extractRem('--tp-font-xl');

      expect(xs).toBeLessThan(sm);
      expect(sm).toBeLessThan(md);
      expect(md).toBeLessThan(lg);
      expect(lg).toBeLessThan(xl);
    });
  });

  // =========================================================================
  // Z-index scale
  // =========================================================================
  describe('z-index scale', () => {
    const requiredZTokens = [
      '--tp-z-base',
      '--tp-z-content',
      '--tp-z-sidebar',
      '--tp-z-header',
      '--tp-z-overlay',
      '--tp-z-modal',
      '--tp-z-toast',
    ];

    it.each(requiredZTokens)('should define %s', (token) => {
      expect(styles).toContain(`${token}:`);
    });

    it('should have ascending z-index values', () => {
      const extractZ = (token: string): number => {
        const match = styles.match(new RegExp(`${token}:\\s*(\\d+)`));
        expect(match).not.toBeNull();
        return parseInt(match![1], 10);
      };

      const base = extractZ('--tp-z-base');
      const content = extractZ('--tp-z-content');
      const sidebar = extractZ('--tp-z-sidebar');
      const header = extractZ('--tp-z-header');
      const overlay = extractZ('--tp-z-overlay');
      const modal = extractZ('--tp-z-modal');
      const toast = extractZ('--tp-z-toast');

      expect(base).toBeLessThan(content);
      expect(content).toBeLessThan(sidebar);
      expect(sidebar).toBeLessThan(header);
      expect(header).toBeLessThan(overlay);
      expect(overlay).toBeLessThan(modal);
      expect(modal).toBeLessThan(toast);
    });
  });

  // =========================================================================
  // Transition tokens
  // =========================================================================
  describe('transition tokens', () => {
    const requiredTransitionTokens = [
      '--tp-transition-fast',
      '--tp-transition-normal',
      '--tp-transition-slow',
    ];

    it.each(requiredTransitionTokens)('should define %s', (token) => {
      expect(styles).toContain(`${token}:`);
    });

    it('should have ascending transition durations (fast < normal < slow)', () => {
      const extractSeconds = (token: string): number => {
        const match = styles.match(new RegExp(`${token}:\\s*([\\d.]+)s`));
        expect(match).not.toBeNull();
        return parseFloat(match![1]);
      };

      const fast = extractSeconds('--tp-transition-fast');
      const normal = extractSeconds('--tp-transition-normal');
      const slow = extractSeconds('--tp-transition-slow');

      expect(fast).toBeLessThan(normal);
      expect(normal).toBeLessThan(slow);
    });
  });

  // =========================================================================
  // Spacing scale
  // =========================================================================
  describe('spacing scale', () => {
    const requiredSpacingTokens = [
      '--tp-space-0',
      '--tp-space-1',
      '--tp-space-2',
      '--tp-space-3',
      '--tp-space-4',
      '--tp-space-6',
      '--tp-space-8',
    ];

    it.each(requiredSpacingTokens)('should define %s', (token) => {
      expect(styles).toContain(`${token}:`);
    });
  });

  // =========================================================================
  // Easing tokens
  // =========================================================================
  describe('easing tokens', () => {
    const requiredEasingTokens = ['--tp-ease-default', '--tp-ease-in-out', '--tp-ease-spring'];

    it.each(requiredEasingTokens)('should define %s', (token) => {
      expect(styles).toContain(`${token}:`);
    });
  });

  // =========================================================================
  // Namespace aliases (--nm-* → --tp-*)
  // =========================================================================
  describe('namespace consolidation', () => {
    it('--nm-bg should alias --tp-bg', () => {
      expect(styles).toMatch(/--nm-bg:\s*var\(--tp-bg\)/);
    });

    it('--nm-accent should alias --tp-primary', () => {
      expect(styles).toMatch(/--nm-accent:\s*var\(--tp-primary\)/);
    });

    it('--nm-border-soft should alias --tp-border', () => {
      expect(styles).toMatch(/--nm-border-soft:\s*var\(--tp-border\)/);
    });
  });

  // =========================================================================
  // Color tokens
  // =========================================================================
  describe('color tokens', () => {
    const requiredColorTokens = [
      '--tp-primary',
      '--tp-primary-dark',
      '--tp-info',
      '--tp-success',
      '--tp-warning',
      '--tp-danger',
      '--tp-text',
      '--tp-text-secondary',
      '--tp-text-muted',
      '--tp-link',
      '--tp-grey',
      '--tp-grey-light',
    ];

    it.each(requiredColorTokens)('should define %s', (token) => {
      expect(styles).toContain(`${token}:`);
    });

    it('should keep secondary and muted text values aligned with the showcase contract', () => {
      const showcaseTokens = parseTokenDeclarations(readShowcaseHtml());
      expect(styles).toContain(`--tp-text-secondary: ${showcaseTokens.get('--tp-text-secondary')}`);
      expect(styles).toContain(`--tp-text-muted: ${showcaseTokens.get('--tp-text-muted')}`);
    });
  });

  describe('showcase alignment', () => {
    const showcase = readShowcaseHtml();
    const showcaseTokens = parseTokenDeclarations(showcase);
    const combinedTokenSource = [readDefaultPresetScss(), readGovernanceScss(), styles].join('\n');
    const sourceTokens = parseTokenDeclarations(combinedTokenSource);
    const tokenSnapshot = readTokenSnapshot();
    const snapshotTokens = parseTokenDeclarations(tokenSnapshot);

    it('component showcase should retain its inline token contract', () => {
      expect(showcase).toMatch(/@font-face/);
      expect(showcase).toMatch(/:root\s*\{/);
    });

    it('frontend token sources and token snapshot should match the showcase contract', () => {
      for (const [token, showcaseValue] of showcaseTokens.entries()) {
        expect(normalizeTokenValue(sourceTokens.get(token))).toBe(
          normalizeTokenValue(showcaseValue),
        );
        expect(normalizeTokenValue(snapshotTokens.get(token))).toBe(
          normalizeTokenValue(showcaseValue),
        );
      }
    });
  });

  // =========================================================================
  // No duplicate token definitions
  // =========================================================================
  describe('token uniqueness', () => {
    it('should not have duplicate token definitions in :root', () => {
      // Extract all token declarations from :root block
      const rootMatch = styles.match(/:root\s*\{([\s\S]*?)\n\}/);
      expect(rootMatch).not.toBeNull();

      const rootBlock = rootMatch![1];
      const tokenDeclarations = rootBlock.match(/--[\w-]+(?=\s*:)/g) || [];

      const seen = new Map<string, number>();
      const duplicates: string[] = [];

      for (const token of tokenDeclarations) {
        const count = (seen.get(token) || 0) + 1;
        seen.set(token, count);
        if (count === 2) {
          duplicates.push(token);
        }
      }

      expect(duplicates).toEqual([]);
    });
  });

  // =========================================================================
  // SCSS file convention checks
  // =========================================================================
  describe('SCSS file conventions', () => {
    const scssFiles = readScssFiles();
    const componentScss = scssFiles.filter(
      (f) =>
        !f.path.includes('login.page') &&
        !f.path.includes('default-preset') &&
        !f.path.includes('advanced-css-governance') &&
        !f.path.includes('styles.scss') &&
        !f.path.includes('previews/'),
    );

    it('should not use var(--tp-white) as background in any component SCSS', () => {
      const violations: string[] = [];

      for (const file of componentScss) {
        const lines = file.content.split('\n');
        lines.forEach((line, idx) => {
          const trimmed = line.trim();
          if (trimmed.startsWith('//')) return;
          if (/background.*var\(--tp-white\)/.test(line)) {
            const relPath = file.path.replace(APP_PATH, 'src/app');
            violations.push(`${relPath}:${idx + 1}: ${trimmed}`);
          }
        });
      }

      expect(violations).toEqual([]);
    });

    it('should not have hardcoded rgba(0,0,0) in any component SCSS', () => {
      const violations: string[] = [];

      for (const file of componentScss) {
        const lines = file.content.split('\n');
        lines.forEach((line, idx) => {
          const trimmed = line.trim();
          if (trimmed.startsWith('//')) return;
          if (/rgba\(0/.test(line)) {
            const relPath = file.path.replace(APP_PATH, 'src/app');
            violations.push(`${relPath}:${idx + 1}: ${trimmed}`);
          }
        });
      }

      expect(violations).toEqual([]);
    });

    it('should not use transition: all in any component SCSS', () => {
      const violations: string[] = [];

      for (const file of componentScss) {
        const lines = file.content.split('\n');
        lines.forEach((line, idx) => {
          const trimmed = line.trim();
          if (trimmed.startsWith('//')) return;
          if (/transition:.*all/.test(line)) {
            const relPath = file.path.replace(APP_PATH, 'src/app');
            violations.push(`${relPath}:${idx + 1}: ${trimmed}`);
          }
        });
      }

      expect(violations).toEqual([]);
    });

    it('should not use Bootstrap or Tailwind framework colors', () => {
      const frameworkColors = ['#2563eb', '#0d6efd', '#e5e7eb', '#f3f4f6', '#6b7280', '#f9fafb'];
      const violations: string[] = [];

      for (const file of componentScss) {
        const lines = file.content.split('\n');
        lines.forEach((line, idx) => {
          const trimmed = line.trim();
          if (trimmed.startsWith('//')) return;
          const lower = line.toLowerCase();
          for (const color of frameworkColors) {
            if (lower.includes(color)) {
              const relPath = file.path.replace(APP_PATH, 'src/app');
              violations.push(`${relPath}:${idx + 1}: found ${color} in "${trimmed}"`);
            }
          }
        });
      }

      expect(violations).toEqual([]);
    });

    it('should not use PrimeNG semantic tokens directly (use --tp-* wrappers)', () => {
      const primengPatterns = [
        /var\(--p-green/,
        /var\(--p-red/,
        /var\(--p-orange/,
        /var\(--p-surface/,
        /var\(--p-text/,
      ];
      const violations: string[] = [];

      for (const file of componentScss) {
        // Skip preset files that legitimately bridge PrimeNG
        if (file.path.includes('default-preset')) continue;

        const lines = file.content.split('\n');
        lines.forEach((line, idx) => {
          const trimmed = line.trim();
          if (trimmed.startsWith('//')) return;
          for (const pattern of primengPatterns) {
            if (pattern.test(line)) {
              const relPath = file.path.replace(APP_PATH, 'src/app');
              violations.push(`${relPath}:${idx + 1}: ${trimmed}`);
            }
          }
        });
      }

      expect(violations).toEqual([]);
    });
  });
});
