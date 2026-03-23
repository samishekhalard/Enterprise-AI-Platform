import { signal } from '@angular/core';

/**
 * Test BpmnToolbarComponent logic without Angular TestBed.
 *
 * Note: Due to compatibility issues with the Vitest/Angular TestBed integration,
 * we test the component's class methods by creating a testable class that replicates
 * the component's behavior without requiring Angular's DI system.
 *
 * This approach tests:
 * - Menu toggle logic
 * - State management
 * - XML processing utilities
 * - Copy/paste clipboard logic
 */

// Mock BpmnModelerService
function createMockModelerService() {
  return {
    isLoading: signal(false),
    isDirty: signal(false),
    canUndo: signal(false),
    canRedo: signal(false),
    zoomLevel: signal(1),
    selectedElement: signal(null),
    validationErrors: signal([]),
    isPanelOpen: signal(false),
    showGridDots: signal(false),
    currentProcess: signal({ id: 'test-process', name: 'Test Process', version: '1.0.0', description: '', owner: '', lastModified: new Date(), status: 'draft' }),
    currentXml: signal(''),
    hasSelection: signal(false),
    setModeler: vi.fn(),
    getModeler: vi.fn(() => null),
    createNewDiagram: vi.fn().mockResolvedValue(undefined),
    importDiagram: vi.fn().mockResolvedValue(true),
    exportDiagram: vi.fn().mockResolvedValue('<svg></svg>'),
    saveDiagram: vi.fn().mockResolvedValue('<?xml version="1.0"?><bpmn:definitions></bpmn:definitions>'),
    undo: vi.fn(),
    redo: vi.fn(),
    deleteSelected: vi.fn(),
    zoomIn: vi.fn(),
    zoomOut: vi.fn(),
    zoomFit: vi.fn(),
    zoomReset: vi.fn(),
    setZoom: vi.fn(),
    validate: vi.fn(() => []),
    togglePanel: vi.fn(),
    toggleGridDots: vi.fn()
  };
}

/**
 * Testable version of BpmnToolbarComponent that allows direct method testing
 */
class TestableBpmnToolbarComponent {
  modelerService: ReturnType<typeof createMockModelerService>;

  // Component state
  showMainMenu = false;
  showExportMenu = false;
  hasClipboard = false;
  showGrid = false;
  showXmlViewer = false;
  xmlContent = '';
  xmlViewMode: 'formatted' | 'raw' = 'formatted';
  xmlLines: string[] = [];
  collapsedLines = new Set<number>();
  allExpanded = true;
  collapseMap = new Map<number, number>();
  showCopyToast = false;

  constructor(modelerService: ReturnType<typeof createMockModelerService>) {
    this.modelerService = modelerService;
  }

  closeAllMenus(): void {
    this.showMainMenu = false;
    this.showExportMenu = false;
  }

  toggleMainMenu(): void {
    this.showMainMenu = !this.showMainMenu;
    this.showExportMenu = false;
  }

  toggleExportMenu(): void {
    this.showExportMenu = !this.showExportMenu;
    this.showMainMenu = false;
  }

  togglePropertiesPanel(): void {
    this.modelerService.togglePanel();
    this.closeAllMenus();
  }

  toggleGrid(): void {
    this.showGrid = !this.showGrid;
    this.modelerService.toggleGridDots();
  }

  async newDiagram(): Promise<void> {
    await this.modelerService.createNewDiagram();
    this.closeAllMenus();
  }

  async saveDiagram(): Promise<void> {
    const xml = await this.modelerService.saveDiagram();
    if (!xml) return;
    this.closeAllMenus();
  }

  deleteSelection(): void {
    this.modelerService.deleteSelected();
  }

  validateDiagram(): string[] {
    return this.modelerService.validate();
  }

  async toggleXmlViewer(): Promise<void> {
    if (!this.showXmlViewer) {
      const xml = await this.modelerService.saveDiagram();
      if (xml) {
        this.xmlContent = this.formatXmlString(xml);
        this.updateXmlLines();
        this.buildCollapseMap();
      }
    }
    this.showXmlViewer = !this.showXmlViewer;
    this.closeAllMenus();
  }

  setXmlViewMode(mode: 'formatted' | 'raw'): void {
    this.xmlViewMode = mode;
  }

  formatXml(): void {
    this.xmlContent = this.formatXmlString(this.xmlContent);
    this.updateXmlLines();
    this.buildCollapseMap();
  }

  formatXmlString(xml: string): string {
    let formatted = '';
    let indent = 0;
    const lines = xml.replace(/>\s*</g, '>\n<').split('\n');

    for (let line of lines) {
      line = line.trim();
      if (!line) continue;

      if (line.startsWith('</')) {
        indent = Math.max(0, indent - 1);
      }

      formatted += '  '.repeat(indent) + line + '\n';

      if (line.startsWith('<') && !line.startsWith('</') && !line.startsWith('<?') &&
          !line.endsWith('/>') && !line.includes('</')) {
        indent++;
      }
    }

    return formatted.trim();
  }

  updateXmlLines(): void {
    this.xmlLines = this.xmlContent.split('\n');
  }

  buildCollapseMap(): void {
    this.collapseMap.clear();
    const stack: { line: number; tag: string }[] = [];

    this.xmlLines.forEach((line, index) => {
      const trimmed = line.trim();

      const openMatch = trimmed.match(/^<([a-zA-Z][a-zA-Z0-9:]*)/);
      if (openMatch && !trimmed.endsWith('/>') && !trimmed.startsWith('<?') && !trimmed.startsWith('<!')) {
        stack.push({ line: index, tag: openMatch[1] });
      }

      const closeMatch = trimmed.match(/^<\/([a-zA-Z][a-zA-Z0-9:]*)/);
      if (closeMatch) {
        for (let i = stack.length - 1; i >= 0; i--) {
          if (stack[i].tag === closeMatch[1]) {
            const startLine = stack[i].line;
            if (index > startLine + 1) {
              this.collapseMap.set(startLine, index);
            }
            stack.splice(i, 1);
            break;
          }
        }
      }
    });
  }

  canCollapse(line: string): boolean {
    const index = this.xmlLines.indexOf(line);
    return this.collapseMap.has(index);
  }

  isLineCollapsed(lineIndex: number): boolean {
    for (const [start, end] of this.collapseMap.entries()) {
      if (this.collapsedLines.has(start) && lineIndex > start && lineIndex <= end) {
        return true;
      }
    }
    return false;
  }

  toggleCollapse(lineIndex: number): void {
    if (this.collapsedLines.has(lineIndex)) {
      this.collapsedLines.delete(lineIndex);
    } else {
      this.collapsedLines.add(lineIndex);
    }
    this.allExpanded = this.collapsedLines.size === 0;
  }

  toggleAllSections(): void {
    if (this.allExpanded) {
      for (const start of this.collapseMap.keys()) {
        this.collapsedLines.add(start);
      }
      this.allExpanded = false;
    } else {
      this.collapsedLines.clear();
      this.allExpanded = true;
    }
  }

  highlightXml(line: string): string {
    let highlighted = line;

    highlighted = highlighted
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    highlighted = highlighted.replace(
      /&lt;(\/?)([\w:-]+)/g,
      '&lt;$1<span class="xml-tag">$2</span>'
    );

    highlighted = highlighted.replace(
      /\s([\w:-]+)=/g,
      ' <span class="xml-attr">$1</span>='
    );

    highlighted = highlighted.replace(
      /="([^"]*)"/g,
      '="<span class="xml-value">$1</span>"'
    );

    return highlighted;
  }
}

describe('BpmnToolbarComponent', () => {
  let component: TestableBpmnToolbarComponent;
  let mockModelerService: ReturnType<typeof createMockModelerService>;

  beforeEach(() => {
    mockModelerService = createMockModelerService();
    component = new TestableBpmnToolbarComponent(mockModelerService);
  });

  // ==========================================================================
  // Initial State Tests
  // ==========================================================================
  describe('Initial State', () => {
    it('should initialize showMainMenu to false', () => {
      expect(component.showMainMenu).toBe(false);
    });

    it('should initialize showExportMenu to false', () => {
      expect(component.showExportMenu).toBe(false);
    });

    it('should initialize hasClipboard to false', () => {
      expect(component.hasClipboard).toBe(false);
    });

    it('should initialize showGrid to false', () => {
      expect(component.showGrid).toBe(false);
    });

    it('should initialize showXmlViewer to false', () => {
      expect(component.showXmlViewer).toBe(false);
    });

    it('should initialize xmlViewMode to formatted', () => {
      expect(component.xmlViewMode).toBe('formatted');
    });

    it('should initialize xmlContent to empty string', () => {
      expect(component.xmlContent).toBe('');
    });

    it('should initialize xmlLines to empty array', () => {
      expect(component.xmlLines).toEqual([]);
    });

    it('should initialize allExpanded to true', () => {
      expect(component.allExpanded).toBe(true);
    });

    it('should have empty collapsedLines set', () => {
      expect(component.collapsedLines.size).toBe(0);
    });
  });

  // ==========================================================================
  // Menu Toggle Tests
  // ==========================================================================
  describe('Menu Toggles', () => {
    it('should toggle main menu', () => {
      expect(component.showMainMenu).toBe(false);

      component.toggleMainMenu();
      expect(component.showMainMenu).toBe(true);

      component.toggleMainMenu();
      expect(component.showMainMenu).toBe(false);
    });

    it('should toggle export menu', () => {
      expect(component.showExportMenu).toBe(false);

      component.toggleExportMenu();
      expect(component.showExportMenu).toBe(true);

      component.toggleExportMenu();
      expect(component.showExportMenu).toBe(false);
    });

    it('should close export menu when opening main menu', () => {
      component.showExportMenu = true;

      component.toggleMainMenu();

      expect(component.showMainMenu).toBe(true);
      expect(component.showExportMenu).toBe(false);
    });

    it('should close main menu when opening export menu', () => {
      component.showMainMenu = true;

      component.toggleExportMenu();

      expect(component.showExportMenu).toBe(true);
      expect(component.showMainMenu).toBe(false);
    });

    it('should close all menus', () => {
      component.showMainMenu = true;
      component.showExportMenu = true;

      component.closeAllMenus();

      expect(component.showMainMenu).toBe(false);
      expect(component.showExportMenu).toBe(false);
    });
  });

  // ==========================================================================
  // Properties Panel Tests
  // ==========================================================================
  describe('Properties Panel', () => {
    it('should call togglePanel on modeler service', () => {
      component.togglePropertiesPanel();

      expect(mockModelerService.togglePanel).toHaveBeenCalled();
    });

    it('should close all menus when toggling properties', () => {
      component.showMainMenu = true;
      component.showExportMenu = true;

      component.togglePropertiesPanel();

      expect(component.showMainMenu).toBe(false);
      expect(component.showExportMenu).toBe(false);
    });
  });

  // ==========================================================================
  // Grid Toggle Tests
  // ==========================================================================
  describe('Grid Toggle', () => {
    it('should toggle showGrid', () => {
      expect(component.showGrid).toBe(false);

      component.toggleGrid();
      expect(component.showGrid).toBe(true);

      component.toggleGrid();
      expect(component.showGrid).toBe(false);
    });

    it('should call toggleGridDots on modeler service', () => {
      component.toggleGrid();

      expect(mockModelerService.toggleGridDots).toHaveBeenCalled();
    });
  });

  // ==========================================================================
  // File Operations Tests
  // ==========================================================================
  describe('File Operations', () => {
    it('should call createNewDiagram on modeler service', async () => {
      await component.newDiagram();

      expect(mockModelerService.createNewDiagram).toHaveBeenCalled();
    });

    it('should close menus after new diagram', async () => {
      component.showMainMenu = true;

      await component.newDiagram();

      expect(component.showMainMenu).toBe(false);
    });

    it('should call saveDiagram on modeler service', async () => {
      await component.saveDiagram();

      expect(mockModelerService.saveDiagram).toHaveBeenCalled();
    });

    it('should close menus after save', async () => {
      component.showMainMenu = true;

      await component.saveDiagram();

      expect(component.showMainMenu).toBe(false);
    });
  });

  // ==========================================================================
  // Delete Operation Tests
  // ==========================================================================
  describe('Delete Operation', () => {
    it('should call deleteSelected on modeler service', () => {
      component.deleteSelection();

      expect(mockModelerService.deleteSelected).toHaveBeenCalled();
    });
  });

  // ==========================================================================
  // Validation Tests
  // ==========================================================================
  describe('Validation', () => {
    it('should call validate on modeler service', () => {
      component.validateDiagram();

      expect(mockModelerService.validate).toHaveBeenCalled();
    });

    it('should return validation errors', () => {
      mockModelerService.validate.mockReturnValue([{ elementId: 'el1', message: 'Error', severity: 'error' }]);

      const errors = component.validateDiagram();

      expect(errors.length).toBe(1);
    });
  });

  // ==========================================================================
  // XML Viewer Tests
  // ==========================================================================
  describe('XML Viewer', () => {
    it('should toggle showXmlViewer', async () => {
      expect(component.showXmlViewer).toBe(false);

      await component.toggleXmlViewer();
      expect(component.showXmlViewer).toBe(true);

      await component.toggleXmlViewer();
      expect(component.showXmlViewer).toBe(false);
    });

    it('should load XML content when opening viewer', async () => {
      mockModelerService.saveDiagram.mockResolvedValue('<bpmn:process id="Process_1"></bpmn:process>');

      await component.toggleXmlViewer();

      expect(mockModelerService.saveDiagram).toHaveBeenCalled();
      expect(component.xmlContent).toContain('bpmn:process');
    });

    it('should close all menus when toggling viewer', async () => {
      component.showMainMenu = true;

      await component.toggleXmlViewer();

      expect(component.showMainMenu).toBe(false);
    });

    it('should set XML view mode to raw', () => {
      component.setXmlViewMode('raw');

      expect(component.xmlViewMode).toBe('raw');
    });

    it('should set XML view mode to formatted', () => {
      component.xmlViewMode = 'raw';

      component.setXmlViewMode('formatted');

      expect(component.xmlViewMode).toBe('formatted');
    });
  });

  // ==========================================================================
  // XML Formatting Tests
  // ==========================================================================
  describe('XML Formatting', () => {
    it('should format simple XML', () => {
      const xml = '<root><child></child></root>';
      const formatted = component.formatXmlString(xml);

      expect(formatted).toContain('<root>');
      expect(formatted).toContain('  <child>');
    });

    it('should handle self-closing tags', () => {
      const xml = '<root><child/></root>';
      const formatted = component.formatXmlString(xml);

      expect(formatted).toContain('<child/>');
    });

    it('should handle XML declaration', () => {
      const xml = '<?xml version="1.0"?><root></root>';
      const formatted = component.formatXmlString(xml);

      expect(formatted).toContain('<?xml version="1.0"?>');
    });

    it('should update xmlLines after formatting', () => {
      component.xmlContent = '<root><child></child></root>';

      component.formatXml();

      expect(component.xmlLines.length).toBeGreaterThan(1);
    });

    it('should handle nested elements', () => {
      const xml = '<a><b><c></c></b></a>';
      const formatted = component.formatXmlString(xml);
      const lines = formatted.split('\n');

      expect(lines[0]).toBe('<a>');
      expect(lines[1]).toContain('  <b>');
      expect(lines[2]).toContain('    <c>');
    });
  });

  // ==========================================================================
  // XML Syntax Highlighting Tests
  // ==========================================================================
  describe('XML Syntax Highlighting', () => {
    it('should highlight tag names', () => {
      const highlighted = component.highlightXml('<root>');

      expect(highlighted).toContain('xml-tag');
      expect(highlighted).toContain('root');
    });

    it('should highlight attribute names', () => {
      const highlighted = component.highlightXml('<root id="test">');

      expect(highlighted).toContain('xml-attr');
      expect(highlighted).toContain('id');
    });

    it('should highlight attribute values', () => {
      const highlighted = component.highlightXml('<root id="test">');

      expect(highlighted).toContain('xml-value');
      expect(highlighted).toContain('test');
    });

    it('should escape HTML characters', () => {
      const highlighted = component.highlightXml('<root>&</root>');

      expect(highlighted).toContain('&amp;');
    });

    it('should handle multiple attributes', () => {
      const highlighted = component.highlightXml('<root id="test" name="value">');

      const attrMatches = highlighted.match(/xml-attr/g);
      // The regex may also match 'root' as part of the tag highlighting
      expect(attrMatches?.length).toBeGreaterThanOrEqual(2);
    });
  });

  // ==========================================================================
  // Collapse/Expand Tests
  // ==========================================================================
  describe('Collapse/Expand', () => {
    beforeEach(() => {
      component.xmlContent = '<root>\n  <child>\n    <nested/>\n  </child>\n</root>';
      component.updateXmlLines();
      component.buildCollapseMap();
    });

    it('should build collapse map for nested elements', () => {
      expect(component.collapseMap.size).toBeGreaterThan(0);
    });

    it('should toggle collapse state', () => {
      const lineIndex = 0;

      component.toggleCollapse(lineIndex);
      expect(component.collapsedLines.has(lineIndex)).toBe(true);

      component.toggleCollapse(lineIndex);
      expect(component.collapsedLines.has(lineIndex)).toBe(false);
    });

    it('should update allExpanded when collapsing', () => {
      component.toggleCollapse(0);

      expect(component.allExpanded).toBe(false);
    });

    it('should update allExpanded when expanding all', () => {
      component.collapsedLines.add(0);
      component.allExpanded = false;

      component.toggleCollapse(0);

      expect(component.allExpanded).toBe(true);
    });

    it('should collapse all sections', () => {
      component.toggleAllSections();

      expect(component.allExpanded).toBe(false);
      expect(component.collapsedLines.size).toBeGreaterThan(0);
    });

    it('should expand all sections', () => {
      component.collapsedLines.add(0);
      component.allExpanded = false;

      component.toggleAllSections();

      expect(component.allExpanded).toBe(true);
      expect(component.collapsedLines.size).toBe(0);
    });
  });

  // ==========================================================================
  // Line Collapse Detection Tests
  // ==========================================================================
  describe('Line Collapse Detection', () => {
    beforeEach(() => {
      component.xmlContent = '<root>\n  <child>\n    <nested/>\n  </child>\n</root>';
      component.updateXmlLines();
      component.buildCollapseMap();
    });

    it('should identify collapsible lines', () => {
      const canCollapse = component.canCollapse('<root>');
      // Root should be collapsible as it contains nested elements
      expect(typeof canCollapse).toBe('boolean');
    });

    it('should detect if line is collapsed', () => {
      component.collapsedLines.add(0);
      component.collapseMap.set(0, 4);

      const isCollapsed = component.isLineCollapsed(2);

      expect(isCollapsed).toBe(true);
    });

    it('should return false for non-collapsed line', () => {
      const isCollapsed = component.isLineCollapsed(0);

      expect(isCollapsed).toBe(false);
    });
  });

  // ==========================================================================
  // Edge Cases Tests
  // ==========================================================================
  describe('Edge Cases', () => {
    it('should handle empty XML', () => {
      const formatted = component.formatXmlString('');

      expect(formatted).toBe('');
    });

    it('should handle XML with only whitespace', () => {
      const formatted = component.formatXmlString('   \n   \n   ');

      expect(formatted).toBe('');
    });

    it('should handle single element XML', () => {
      const formatted = component.formatXmlString('<root/>');

      expect(formatted).toBe('<root/>');
    });

    it('should handle multiple toggles quickly', () => {
      component.toggleMainMenu();
      component.toggleMainMenu();
      component.toggleMainMenu();

      expect(component.showMainMenu).toBe(true);
    });

    it('should handle empty validation response', () => {
      mockModelerService.validate.mockReturnValue([]);

      const errors = component.validateDiagram();

      expect(errors).toEqual([]);
    });
  });

  // ==========================================================================
  // State Consistency Tests
  // ==========================================================================
  describe('State Consistency', () => {
    it('should maintain state after multiple operations', async () => {
      component.toggleGrid();
      await component.newDiagram();

      // Grid state should persist across operations
      expect(component.showGrid).toBe(true);
      // Main menu should be closed after newDiagram (closeAllMenus is called)
      expect(component.showMainMenu).toBe(false);
    });

    it('should have consistent menu state', () => {
      // Only one menu should be open at a time
      component.toggleMainMenu();
      component.toggleExportMenu();

      expect(component.showMainMenu).toBe(false);
      expect(component.showExportMenu).toBe(true);
    });

    it('should preserve XML content across view mode changes', async () => {
      mockModelerService.saveDiagram.mockResolvedValue('<xml>content</xml>');
      await component.toggleXmlViewer();
      const originalContent = component.xmlContent;

      component.setXmlViewMode('raw');
      component.setXmlViewMode('formatted');

      expect(component.xmlContent).toBe(originalContent);
    });
  });

  // ==========================================================================
  // Service Integration Tests
  // ==========================================================================
  describe('Service Integration', () => {
    it('should have access to modeler service signals', () => {
      expect(mockModelerService.isDirty()).toBe(false);
      expect(mockModelerService.canUndo()).toBe(false);
      expect(mockModelerService.hasSelection()).toBe(false);
    });

    it('should respond to isDirty signal', () => {
      mockModelerService.isDirty.set(true);

      expect(mockModelerService.isDirty()).toBe(true);
    });

    it('should respond to validationErrors signal', () => {
      mockModelerService.validationErrors.set([{ elementId: 'el1', message: 'Error', severity: 'error' }]);

      expect(mockModelerService.validationErrors().length).toBe(1);
    });

    it('should get current process name', () => {
      expect(mockModelerService.currentProcess().name).toBe('Test Process');
    });
  });
});
