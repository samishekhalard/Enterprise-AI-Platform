import { Injectable } from '@angular/core';
import { ICON_NAME_MAP, DEFAULT_ICON } from './icon-mapping.config';
import { ICON_CATEGORIES, buildIconEntries } from './icon-categories.config';
import { IconCategory, IconEntry } from './icon.model';

/**
 * Central icon service managing name resolution, categorization, and search.
 *
 * Handles backward-compatible resolution of legacy PrimeIcon names to Phosphor
 * Thin equivalents, and provides the icon catalog for the IconPickerComponent.
 */
@Injectable({ providedIn: 'root' })
export class IconService {
  private readonly allIcons: IconEntry[] = buildIconEntries();

  /**
   * Resolve a legacy PrimeIcon name (e.g., 'box') or pass-through a Phosphor/BPMN name.
   *
   * Resolution logic:
   * 1. If name starts with 'phosphor' or 'bpmn' -- already resolved, pass through.
   * 2. If name exists in the legacy mapping -- return mapped Phosphor name.
   * 3. Otherwise -- return DEFAULT_ICON and log a warning.
   *
   * @param legacyName - The icon name to resolve.
   * @returns The canonical Phosphor Thin icon name.
   */
  resolve(legacyName: string): string {
    if (!legacyName) {
      return DEFAULT_ICON;
    }

    // Already a Phosphor or BPMN icon name
    if (legacyName.startsWith('phosphor') || legacyName.startsWith('bpmn')) {
      return legacyName;
    }

    // Strip 'pi pi-' prefix if present
    const cleaned = legacyName.replace(/^pi\s+pi-/, '');

    const mapped = ICON_NAME_MAP[cleaned];
    if (mapped) {
      return mapped;
    }

    console.warn(`[IconService] Unknown icon name: "${legacyName}". Falling back to default.`);
    return DEFAULT_ICON;
  }

  /**
   * Check whether an icon name refers to a BPMN icon.
   */
  isBpmn(name: string): boolean {
    return name.startsWith('bpmn');
  }

  /**
   * Get all icon categories with their counts.
   */
  getCategories(): IconCategory[] {
    return ICON_CATEGORIES.map((cat) => ({
      id: cat.id,
      label: cat.label,
      iconCount: cat.icons.length,
    }));
  }

  /**
   * Get icons filtered by category.
   * Pass 'all' to retrieve every icon.
   */
  getIconsByCategory(categoryId: string): IconEntry[] {
    if (categoryId === 'all') {
      return this.allIcons;
    }
    return this.allIcons.filter((icon) => icon.category === categoryId);
  }

  /**
   * Search icons by query string against name, displayName, and keywords.
   * Results are sorted by relevance: exact name match first, then keyword match.
   */
  searchIcons(query: string): IconEntry[] {
    if (!query || query.trim().length === 0) {
      return this.allIcons;
    }

    const q = query.trim().toLowerCase();

    return this.allIcons
      .filter((icon) => {
        const nameMatch = icon.name.toLowerCase().includes(q);
        const displayMatch = icon.displayName.toLowerCase().includes(q);
        const keywordMatch = icon.keywords.some((kw) => kw.includes(q));
        return nameMatch || displayMatch || keywordMatch;
      })
      .sort((a, b) => {
        // Exact display name match first
        const aExact = a.displayName.toLowerCase() === q ? 0 : 1;
        const bExact = b.displayName.toLowerCase() === q ? 0 : 1;
        if (aExact !== bExact) return aExact - bExact;

        // Then display name starts-with
        const aStarts = a.displayName.toLowerCase().startsWith(q) ? 0 : 1;
        const bStarts = b.displayName.toLowerCase().startsWith(q) ? 0 : 1;
        return aStarts - bStarts;
      });
  }

  /**
   * Get all icons in the catalog.
   */
  getAllIcons(): IconEntry[] {
    return this.allIcons;
  }
}
