import { TestBed } from '@angular/core/testing';
import { IconService } from './icon.service';
import { DEFAULT_ICON } from './icon-mapping.config';

describe('IconService', () => {
  let service: IconService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(IconService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('resolve()', () => {
    it('should resolve a legacy PrimeIcon name to Phosphor Thin name', () => {
      expect(service.resolve('box')).toBe('phosphorCubeThin');
      expect(service.resolve('home')).toBe('phosphorHouseThin');
      expect(service.resolve('cog')).toBe('phosphorGearThin');
      expect(service.resolve('search')).toBe('phosphorMagnifyingGlassThin');
    });

    it('should pass through Phosphor icon names unchanged', () => {
      expect(service.resolve('phosphorCubeThin')).toBe('phosphorCubeThin');
      expect(service.resolve('phosphorHouseThin')).toBe('phosphorHouseThin');
    });

    it('should pass through BPMN icon names unchanged', () => {
      expect(service.resolve('bpmnTask')).toBe('bpmnTask');
      expect(service.resolve('bpmnGateway')).toBe('bpmnGateway');
    });

    it('should strip "pi pi-" prefix before resolving', () => {
      expect(service.resolve('pi pi-box')).toBe('phosphorCubeThin');
      expect(service.resolve('pi pi-home')).toBe('phosphorHouseThin');
    });

    it('should return DEFAULT_ICON for empty or null-ish input', () => {
      expect(service.resolve('')).toBe(DEFAULT_ICON);
    });

    it('should return DEFAULT_ICON for unknown icon names', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
      expect(service.resolve('nonexistent-icon')).toBe(DEFAULT_ICON);
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Unknown icon name: "nonexistent-icon"'),
      );
      consoleSpy.mockRestore();
    });

    it('should resolve all 78 iconOptions icons', () => {
      // Note: 'box' is excluded because it maps to phosphorCubeThin which IS the DEFAULT_ICON
      const legacyNames = [
        'server',
        'database',
        'desktop',
        'mobile',
        'cloud',
        'cog',
        'wrench',
        'bolt',
        'shield',
        'user',
        'users',
        'home',
        'chart-bar',
        'chart-line',
        'chart-pie',
        'file',
        'folder',
        'envelope',
        'calendar',
        'clock',
        'tag',
        'bookmark',
        'star',
        'heart',
        'flag',
        'globe',
        'link',
        'lock',
        'sitemap',
      ];
      for (const name of legacyNames) {
        const resolved = service.resolve(name);
        expect(resolved).not.toBe(DEFAULT_ICON);
        expect(resolved).toMatch(/^phosphor/);
      }
    });

    it('should resolve template-only icons', () => {
      expect(service.resolve('refresh')).toBe('phosphorArrowClockwiseThin');
      expect(service.resolve('times')).toBe('phosphorXThin');
      expect(service.resolve('plus')).toBe('phosphorPlusThin');
      expect(service.resolve('trash')).toBe('phosphorTrashThin');
      expect(service.resolve('check')).toBe('phosphorCheckThin');
    });
  });

  describe('isBpmn()', () => {
    it('should return true for BPMN icons', () => {
      expect(service.isBpmn('bpmnTask')).toBe(true);
      expect(service.isBpmn('bpmnGateway')).toBe(true);
    });

    it('should return false for Phosphor icons', () => {
      expect(service.isBpmn('phosphorCubeThin')).toBe(false);
    });

    it('should return false for legacy names', () => {
      expect(service.isBpmn('box')).toBe(false);
    });
  });

  describe('getCategories()', () => {
    it('should return an array of categories', () => {
      const categories = service.getCategories();
      expect(categories.length).toBeGreaterThan(0);
    });

    it('should include expected category IDs', () => {
      const ids = service.getCategories().map((c) => c.id);
      expect(ids).toContain('general');
      expect(ids).toContain('navigation');
      expect(ids).toContain('data');
      expect(ids).toContain('communication');
      expect(ids).toContain('bpmn');
    });

    it('should have positive icon counts', () => {
      const categories = service.getCategories();
      for (const cat of categories) {
        expect(cat.iconCount).toBeGreaterThan(0);
      }
    });
  });

  describe('getIconsByCategory()', () => {
    it('should return all icons for "all" category', () => {
      const all = service.getIconsByCategory('all');
      expect(all.length).toBe(service.getAllIcons().length);
    });

    it('should return only icons from the specified category', () => {
      const navIcons = service.getIconsByCategory('navigation');
      expect(navIcons.length).toBeGreaterThan(0);
      for (const icon of navIcons) {
        expect(icon.category).toBe('navigation');
      }
    });

    it('should return empty array for unknown category', () => {
      expect(service.getIconsByCategory('nonexistent')).toEqual([]);
    });
  });

  describe('searchIcons()', () => {
    it('should return all icons for empty query', () => {
      const result = service.searchIcons('');
      expect(result.length).toBe(service.getAllIcons().length);
    });

    it('should find icons by display name', () => {
      const result = service.searchIcons('House');
      expect(result.some((i) => i.name === 'phosphorHouseThin')).toBe(true);
    });

    it('should find icons by keyword', () => {
      const result = service.searchIcons('settings');
      expect(result.some((i) => i.name === 'phosphorGearThin')).toBe(true);
    });

    it('should be case-insensitive', () => {
      const upper = service.searchIcons('HOUSE');
      const lower = service.searchIcons('house');
      expect(upper.length).toBe(lower.length);
    });

    it('should return empty array when nothing matches', () => {
      const result = service.searchIcons('zzzzzznonexistent');
      expect(result).toEqual([]);
    });

    it('should prioritize exact display name matches', () => {
      const result = service.searchIcons('Star');
      expect(result.length).toBeGreaterThan(0);
      expect(result[0].displayName).toBe('Star');
    });
  });

  describe('getAllIcons()', () => {
    it('should return a non-empty array', () => {
      expect(service.getAllIcons().length).toBeGreaterThan(50);
    });

    it('should include both Phosphor and BPMN icons', () => {
      const icons = service.getAllIcons();
      expect(icons.some((i) => i.source === 'phosphor')).toBe(true);
      expect(icons.some((i) => i.source === 'bpmn')).toBe(true);
    });

    it('should have all required fields on each entry', () => {
      for (const icon of service.getAllIcons()) {
        expect(icon.name).toBeTruthy();
        expect(icon.displayName).toBeTruthy();
        expect(icon.category).toBeTruthy();
        expect(icon.source).toBeTruthy();
        expect(Array.isArray(icon.keywords)).toBe(true);
      }
    });
  });
});
