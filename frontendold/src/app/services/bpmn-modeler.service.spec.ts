import { BpmnModelerService } from './bpmn-modeler.service';
import {
  DEFAULT_ZOOM_CONFIG
} from '../models/bpmn.model';

/**
 * Mock bpmn-js modeler with full API simulation
 */
function createMockBpmnModeler() {
  const mockEventBus = {
    on: vi.fn(),
    off: vi.fn(),
    fire: vi.fn()
  };

  const mockCommandStack = {
    canUndo: vi.fn(() => false),
    canRedo: vi.fn(() => false),
    undo: vi.fn(),
    redo: vi.fn()
  };

  const mockCanvas = {
    viewbox: vi.fn(() => ({ x: 0, y: 0, width: 1000, height: 800, scale: 1 })),
    zoom: vi.fn(),
    getRootElement: vi.fn(() => ({ id: 'Process_1', type: 'bpmn:Process' })),
    getContainer: vi.fn(() => document.createElement('div')),
    resized: vi.fn(),
    scrollToElement: vi.fn()
  };

  const mockSelection = {
    get: vi.fn(() => []),
    select: vi.fn()
  };

  const mockElementRegistry = {
    get: vi.fn((id: string) => ({
      id,
      type: 'bpmn:Task',
      x: 100,
      y: 100,
      width: 100,
      height: 80,
      businessObject: { name: 'Test Task' },
      incoming: [],
      outgoing: []
    })),
    getAll: vi.fn(() => [
      { id: 'el1', type: 'bpmn:StartEvent', businessObject: {} },
      { id: 'el2', type: 'bpmn:Task', businessObject: { name: 'Task 1' } },
      { id: 'el3', type: 'bpmn:EndEvent', businessObject: {} }
    ]),
    filter: vi.fn((_fn) => [])
  };

  const mockModeling = {
    createShape: vi.fn((shape, _position, _parent) => ({ ...shape, id: 'new_element_1' })),
    removeElements: vi.fn(),
    connect: vi.fn(() => ({ id: 'flow_1', type: 'bpmn:SequenceFlow' })),
    updateLabel: vi.fn(),
    updateProperties: vi.fn(),
    addLane: vi.fn(),
    resizeShape: vi.fn(),
    moveElements: vi.fn(),
    updateWaypoints: vi.fn(),
    removeConnection: vi.fn()
  };

  const mockElementFactory = {
    createShape: vi.fn((props) => ({
      id: 'shape_' + Date.now(),
      type: props.type,
      ...props
    }))
  };

  const mockModdle = {
    create: vi.fn((type, props) => ({
      $type: type,
      ...props
    }))
  };

  const mockRules = {
    allowed: vi.fn(() => true)
  };

  return {
    get: vi.fn((service: string) => {
      const services: Record<string, any> = {
        eventBus: mockEventBus,
        commandStack: mockCommandStack,
        canvas: mockCanvas,
        selection: mockSelection,
        elementRegistry: mockElementRegistry,
        modeling: mockModeling,
        elementFactory: mockElementFactory,
        moddle: mockModdle,
        rules: mockRules
      };
      return services[service];
    }),
    importXML: vi.fn().mockResolvedValue({
      definitions: {
        rootElements: [
          { $type: 'bpmn:Process', id: 'Process_1', name: 'Test Process' }
        ]
      }
    }),
    saveXML: vi.fn().mockResolvedValue({ xml: '<?xml version="1.0"?><bpmn:definitions></bpmn:definitions>' }),
    saveSVG: vi.fn().mockResolvedValue({ svg: '<svg></svg>' }),
    destroy: vi.fn(),
    attachTo: vi.fn()
  };
}

describe('BpmnModelerService', () => {
  let service: BpmnModelerService;
  let mockModeler: ReturnType<typeof createMockBpmnModeler>;

  beforeEach(() => {
    // Direct instantiation - BpmnModelerService has no constructor dependencies
    service = new BpmnModelerService();
    mockModeler = createMockBpmnModeler();
  });

  // ==========================================================================
  // Service Creation Tests
  // ==========================================================================
  describe('Service Creation', () => {
    it('should be created', () => {
      expect(service).toBeTruthy();
    });

    it('should initialize with loading false', () => {
      expect(service.isLoading()).toBe(false);
    });

    it('should initialize with isDirty false', () => {
      expect(service.isDirty()).toBe(false);
    });

    it('should initialize with canUndo false', () => {
      expect(service.canUndo()).toBe(false);
    });

    it('should initialize with canRedo false', () => {
      expect(service.canRedo()).toBe(false);
    });

    it('should initialize with zoomLevel 1', () => {
      expect(service.zoomLevel()).toBe(1);
    });

    it('should initialize with selectedElement null', () => {
      expect(service.selectedElement()).toBeNull();
    });

    it('should initialize with empty validationErrors', () => {
      expect(service.validationErrors()).toEqual([]);
    });

    it('should initialize with isPanelOpen false', () => {
      expect(service.isPanelOpen()).toBe(false);
    });

    it('should initialize with showGridDots false', () => {
      expect(service.showGridDots()).toBe(false);
    });
  });

  // ==========================================================================
  // Computed Values Tests
  // ==========================================================================
  describe('Computed Values', () => {
    it('should compute hasSelection based on selectedElement', () => {
      expect(service.hasSelection()).toBe(false);

      service.selectedElement.set({
        id: 'el1',
        type: 'bpmn:Task',
        businessObject: {}
      });

      expect(service.hasSelection()).toBe(true);
    });

    it('should compute zoomPercentage from zoomLevel', () => {
      service.zoomLevel.set(1.5);

      expect(service.zoomPercentage()).toBe(150);
    });

    it('should compute qualityScoreColor based on score', () => {
      // Default score is 0, should be red
      expect(service.qualityScoreColor()).toBe('#c53030');
    });

    it('should return green for high quality score', () => {
      service.processDocumentation.update(doc => ({
        ...doc,
        qualityScore: { ...doc.qualityScore, overall: 85 }
      }));

      expect(service.qualityScoreColor()).toBe('#276749');
    });

    it('should return gold for medium quality score', () => {
      service.processDocumentation.update(doc => ({
        ...doc,
        qualityScore: { ...doc.qualityScore, overall: 65 }
      }));

      expect(service.qualityScoreColor()).toBe('#b9a779');
    });

    it('should return orange for low-medium quality score', () => {
      service.processDocumentation.update(doc => ({
        ...doc,
        qualityScore: { ...doc.qualityScore, overall: 45 }
      }));

      expect(service.qualityScoreColor()).toBe('#c05621');
    });
  });

  // ==========================================================================
  // Modeler Initialization Tests
  // ==========================================================================
  describe('Modeler Initialization', () => {
    it('should set modeler instance', () => {
      service.setModeler(mockModeler);

      expect(service.getModeler()).toBe(mockModeler);
    });

    it('should setup event listeners when modeler is set', () => {
      service.setModeler(mockModeler);

      const eventBus = mockModeler.get('eventBus');
      expect(eventBus.on).toHaveBeenCalled();
    });

    it('should return null when no modeler is set', () => {
      expect(service.getModeler()).toBeNull();
    });
  });

  // ==========================================================================
  // Diagram Operations Tests
  // ==========================================================================
  describe('Diagram Operations', () => {
    beforeEach(() => {
      service.setModeler(mockModeler);
    });

    describe('createNewDiagram()', () => {
      it('should create new diagram', async () => {
        await service.createNewDiagram();

        expect(mockModeler.importXML).toHaveBeenCalled();
      });

      it('should set loading state', async () => {
        const promise = service.createNewDiagram();
        expect(service.isLoading()).toBe(true);

        await promise;
        expect(service.isLoading()).toBe(false);
      });

      it('should reset dirty state after creating', async () => {
        service.isDirty.set(true);

        await service.createNewDiagram();

        expect(service.isDirty()).toBe(false);
      });

      it('should reset undo/redo state', async () => {
        service.canUndo.set(true);
        service.canRedo.set(true);

        await service.createNewDiagram();

        expect(service.canUndo()).toBe(false);
        expect(service.canRedo()).toBe(false);
      });

      it('should clear validation errors', async () => {
        service.validationErrors.set([{ elementId: 'el1', message: 'Error', severity: 'error' }]);

        await service.createNewDiagram();

        expect(service.validationErrors()).toEqual([]);
      });
    });

    describe('importDiagram()', () => {
      it('should import diagram XML', async () => {
        await service.importDiagram('<xml>test</xml>');

        expect(mockModeler.importXML).toHaveBeenCalledWith('<xml>test</xml>');
      });

      it('should return false on import error', async () => {
        mockModeler.importXML.mockRejectedValue(new Error('Invalid XML'));

        const result = await service.importDiagram('<invalid>');

        expect(result).toBe(false);
      });

      it('should update currentXml after import', async () => {
        await service.importDiagram('<xml>content</xml>');

        expect(service.currentXml()).toBe('<xml>content</xml>');
      });
    });

    describe('exportDiagram()', () => {
      it('should export as BPMN XML', async () => {
        await service.exportDiagram('bpmn');

        expect(mockModeler.saveXML).toHaveBeenCalled();
      });

      it('should export as SVG', async () => {
        await service.exportDiagram('svg');

        expect(mockModeler.saveSVG).toHaveBeenCalled();
      });

      it('should export as PNG (returns SVG)', async () => {
        await service.exportDiagram('png');

        expect(mockModeler.saveSVG).toHaveBeenCalled();
      });

      it('should return empty string on error', async () => {
        mockModeler.saveXML.mockRejectedValue(new Error('Export failed'));

        const result = await service.exportDiagram('bpmn');

        expect(result).toBe('');
      });
    });

    describe('saveDiagram()', () => {
      it('should save diagram', async () => {
        const xml = await service.saveDiagram();

        expect(mockModeler.saveXML).toHaveBeenCalled();
        expect(typeof xml).toBe('string');
      });

      it('should reset dirty state after save', async () => {
        service.isDirty.set(true);

        await service.saveDiagram();

        expect(service.isDirty()).toBe(false);
      });

      it('should update lastModified', async () => {
        const beforeDate = new Date();

        await service.saveDiagram();

        expect(service.currentProcess().lastModified.getTime()).toBeGreaterThanOrEqual(beforeDate.getTime());
      });
    });
  });

  // ==========================================================================
  // Edit Operations Tests
  // ==========================================================================
  describe('Edit Operations', () => {
    beforeEach(() => {
      service.setModeler(mockModeler);
    });

    it('should undo when canUndo is true', () => {
      service.canUndo.set(true);
      const commandStack = mockModeler.get('commandStack');

      service.undo();

      expect(commandStack.undo).toHaveBeenCalled();
    });

    it('should not undo when canUndo is false', () => {
      service.canUndo.set(false);
      const commandStack = mockModeler.get('commandStack');

      service.undo();

      expect(commandStack.undo).not.toHaveBeenCalled();
    });

    it('should redo when canRedo is true', () => {
      service.canRedo.set(true);
      const commandStack = mockModeler.get('commandStack');

      service.redo();

      expect(commandStack.redo).toHaveBeenCalled();
    });

    it('should not redo when canRedo is false', () => {
      service.canRedo.set(false);
      const commandStack = mockModeler.get('commandStack');

      service.redo();

      expect(commandStack.redo).not.toHaveBeenCalled();
    });

    it('should delete selected element', () => {
      service.selectedElement.set({ id: 'el1', type: 'bpmn:Task', businessObject: {} });
      const modeling = mockModeler.get('modeling');

      service.deleteSelected();

      expect(modeling.removeElements).toHaveBeenCalled();
    });
  });

  // ==========================================================================
  // Zoom Operations Tests
  // ==========================================================================
  describe('Zoom Operations', () => {
    beforeEach(() => {
      service.setModeler(mockModeler);
    });

    it('should zoom in', () => {
      service.zoomLevel.set(1);
      const canvas = mockModeler.get('canvas');

      service.zoomIn();

      expect(canvas.zoom).toHaveBeenCalled();
    });

    it('should not zoom in beyond max', () => {
      service.zoomLevel.set(DEFAULT_ZOOM_CONFIG.max);
      const canvas = mockModeler.get('canvas');

      service.zoomIn();

      expect(canvas.zoom).toHaveBeenCalledWith(DEFAULT_ZOOM_CONFIG.max);
    });

    it('should zoom out', () => {
      service.zoomLevel.set(1);
      const canvas = mockModeler.get('canvas');

      service.zoomOut();

      expect(canvas.zoom).toHaveBeenCalled();
    });

    it('should not zoom out below min', () => {
      service.zoomLevel.set(DEFAULT_ZOOM_CONFIG.min);
      const canvas = mockModeler.get('canvas');

      service.zoomOut();

      expect(canvas.zoom).toHaveBeenCalledWith(DEFAULT_ZOOM_CONFIG.min);
    });

    it('should fit to viewport', () => {
      const canvas = mockModeler.get('canvas');

      service.zoomFit();

      expect(canvas.zoom).toHaveBeenCalledWith('fit-viewport');
    });

    it('should reset zoom to default', () => {
      const canvas = mockModeler.get('canvas');

      service.zoomReset();

      expect(canvas.zoom).toHaveBeenCalledWith(DEFAULT_ZOOM_CONFIG.default);
    });

    it('should set specific zoom level', () => {
      const canvas = mockModeler.get('canvas');

      service.setZoom(1.5);

      expect(canvas.zoom).toHaveBeenCalledWith(1.5);
    });

    it('should clamp zoom level to min/max', () => {
      const canvas = mockModeler.get('canvas');

      service.setZoom(10); // Above max

      expect(canvas.zoom).toHaveBeenCalledWith(DEFAULT_ZOOM_CONFIG.max);
    });
  });

  // ==========================================================================
  // Element Operations Tests
  // ==========================================================================
  describe('Element Operations', () => {
    beforeEach(() => {
      service.setModeler(mockModeler);
    });

    it('should update element name', () => {
      const modeling = mockModeler.get('modeling');

      service.updateElementName('el1', 'New Name');

      expect(modeling.updateLabel).toHaveBeenCalled();
    });

    it('should update element property', () => {
      const modeling = mockModeler.get('modeling');

      service.updateElementProperty('el1', 'isExecutable', true);

      expect(modeling.updateProperties).toHaveBeenCalled();
    });

    it('should update element documentation', () => {
      const modeling = mockModeler.get('modeling');
      const moddle = mockModeler.get('moddle');

      service.updateElementDocumentation('el1', 'Documentation text');

      expect(moddle.create).toHaveBeenCalledWith('bpmn:Documentation', { text: 'Documentation text' });
      expect(modeling.updateProperties).toHaveBeenCalled();
    });

    it('should get element documentation', () => {
      const element = {
        id: 'el1',
        type: 'bpmn:Task',
        businessObject: {
          documentation: [{ text: 'Test documentation' }]
        }
      };

      const doc = service.getElementDocumentation(element);

      expect(doc).toBe('Test documentation');
    });

    it('should return empty string for element without documentation', () => {
      const element = {
        id: 'el1',
        type: 'bpmn:Task',
        businessObject: {}
      };

      const doc = service.getElementDocumentation(element);

      expect(doc).toBe('');
    });
  });

  // ==========================================================================
  // Element Creation Tests
  // ==========================================================================
  describe('Element Creation', () => {
    beforeEach(() => {
      service.setModeler(mockModeler);
    });

    it('should create element at position', () => {
      const element = service.createElement('bpmn:Task', { x: 200, y: 200 });

      expect(element).toBeDefined();
      const elementFactory = mockModeler.get('elementFactory');
      expect(elementFactory.createShape).toHaveBeenCalled();
    });

    it('should create start event', () => {
      const element = service.createStartEvent({ x: 100, y: 100 });

      expect(element).toBeDefined();
    });

    it('should create end event', () => {
      const element = service.createEndEvent({ x: 300, y: 100 });

      expect(element).toBeDefined();
    });

    it('should create task', () => {
      const element = service.createTask({ x: 200, y: 100 }, 'My Task');

      expect(element).toBeDefined();
    });

    it('should create user task', () => {
      const element = service.createUserTask({ x: 200, y: 100 });

      expect(element).toBeDefined();
    });

    it('should create service task', () => {
      const element = service.createServiceTask({ x: 200, y: 100 });

      expect(element).toBeDefined();
    });

    it('should create exclusive gateway', () => {
      const element = service.createExclusiveGateway({ x: 200, y: 100 });

      expect(element).toBeDefined();
    });

    it('should create parallel gateway', () => {
      const element = service.createParallelGateway({ x: 200, y: 100 });

      expect(element).toBeDefined();
    });

    it('should create inclusive gateway', () => {
      const element = service.createInclusiveGateway({ x: 200, y: 100 });

      expect(element).toBeDefined();
    });

    it('should return null when modeler is not available', () => {
      service.setModeler(null as any);

      const element = service.createElement('bpmn:Task', { x: 100, y: 100 });

      expect(element).toBeNull();
    });
  });

  // ==========================================================================
  // Connection Tests
  // ==========================================================================
  describe('Connection Operations', () => {
    beforeEach(() => {
      service.setModeler(mockModeler);
    });

    it('should connect two elements', () => {
      service.connectElements('el1', 'el2');

      const modeling = mockModeler.get('modeling');
      expect(modeling.connect).toHaveBeenCalled();
    });

    it('should connect elements with name', () => {
      service.connectElements('el1', 'el2', 'Flow Label');
      const modeling = mockModeler.get('modeling');

      expect(modeling.updateLabel).toHaveBeenCalled();
    });

    it('should return null when source not found', () => {
      const elementRegistry = mockModeler.get('elementRegistry');
      elementRegistry.get.mockReturnValueOnce(null);

      const connection = service.connectElements('invalid', 'el2');

      expect(connection).toBeNull();
    });

    it('should check if elements can connect', () => {
      const canConnect = service.canConnect('el1', 'el2');

      expect(canConnect).toBe(true);
    });

    it('should get element connections', () => {
      const connections = service.getElementConnections('el1');

      expect(connections.incoming).toBeDefined();
      expect(connections.outgoing).toBeDefined();
    });

    it('should remove connection', () => {
      service.removeConnection('flow1');

      const modeling = mockModeler.get('modeling');
      expect(modeling.removeConnection).toHaveBeenCalled();
    });

    it('should update connection waypoints', () => {
      const waypoints = [{ x: 100, y: 100 }, { x: 200, y: 100 }];

      service.updateConnectionWaypoints('flow1', waypoints);

      const modeling = mockModeler.get('modeling');
      expect(modeling.updateWaypoints).toHaveBeenCalled();
    });
  });

  // ==========================================================================
  // Element Movement Tests
  // ==========================================================================
  describe('Element Movement', () => {
    beforeEach(() => {
      service.setModeler(mockModeler);
    });

    it('should move element', () => {
      service.moveElement('el1', { x: 50, y: 50 });

      const modeling = mockModeler.get('modeling');
      expect(modeling.moveElements).toHaveBeenCalled();
    });

    it('should resize element', () => {
      service.resizeElement('el1', { x: 100, y: 100, width: 150, height: 100 });

      const modeling = mockModeler.get('modeling');
      expect(modeling.resizeShape).toHaveBeenCalled();
    });

    it('should get element bounds', () => {
      const bounds = service.getElementBounds('el1');

      expect(bounds).toBeDefined();
      expect(bounds?.x).toBeDefined();
      expect(bounds?.y).toBeDefined();
      expect(bounds?.width).toBeDefined();
      expect(bounds?.height).toBeDefined();
    });
  });

  // ==========================================================================
  // Selection Tests
  // ==========================================================================
  describe('Selection Operations', () => {
    beforeEach(() => {
      service.setModeler(mockModeler);
    });

    it('should select element', () => {
      service.selectElement('el1');

      const selection = mockModeler.get('selection');
      expect(selection.select).toHaveBeenCalled();
    });

    it('should clear selection', () => {
      service.clearSelection();

      const selection = mockModeler.get('selection');
      expect(selection.select).toHaveBeenCalledWith([]);
    });

    it('should get selected elements', () => {
      mockModeler.get('selection').get.mockReturnValue([{ id: 'el1' }]);

      const selected = service.getSelectedElements();

      expect(selected.length).toBe(1);
    });

    it('should select multiple elements', () => {
      service.selectElements(['el1', 'el2']);

      const selection = mockModeler.get('selection');
      expect(selection.select).toHaveBeenCalled();
    });
  });

  // ==========================================================================
  // Canvas Operations Tests
  // ==========================================================================
  describe('Canvas Operations', () => {
    beforeEach(() => {
      service.setModeler(mockModeler);
    });

    it('should get viewport center', () => {
      const center = service.getViewportCenter();

      expect(center.x).toBeDefined();
      expect(center.y).toBeDefined();
    });

    it('should scroll to element', () => {
      service.scrollToElement('el1');

      const canvas = mockModeler.get('canvas');
      expect(canvas.scrollToElement).toHaveBeenCalled();
    });

    it('should get elements by type', () => {
      service.getElementsByType('bpmn:Task');

      const elementRegistry = mockModeler.get('elementRegistry');
      expect(elementRegistry.filter).toHaveBeenCalled();
    });

    it('should get all flow elements', () => {
      service.getAllFlowElements();

      const elementRegistry = mockModeler.get('elementRegistry');
      expect(elementRegistry.filter).toHaveBeenCalled();
    });

    it('should get all sequence flows', () => {
      service.getAllSequenceFlows();

      const elementRegistry = mockModeler.get('elementRegistry');
      expect(elementRegistry.filter).toHaveBeenCalled();
    });
  });

  // ==========================================================================
  // Properties Panel Tests
  // ==========================================================================
  describe('Properties Panel', () => {
    it('should toggle panel', () => {
      expect(service.isPanelOpen()).toBe(false);

      service.togglePanel();
      expect(service.isPanelOpen()).toBe(true);

      service.togglePanel();
      expect(service.isPanelOpen()).toBe(false);
    });

    it('should open panel', () => {
      service.openPanel();

      expect(service.isPanelOpen()).toBe(true);
    });

    it('should close panel', () => {
      service.isPanelOpen.set(true);

      service.closePanel();

      expect(service.isPanelOpen()).toBe(false);
    });
  });

  // ==========================================================================
  // Grid Dots Tests
  // ==========================================================================
  describe('Grid Dots', () => {
    it('should toggle grid dots', () => {
      expect(service.showGridDots()).toBe(false);

      service.toggleGridDots();
      expect(service.showGridDots()).toBe(true);

      service.toggleGridDots();
      expect(service.showGridDots()).toBe(false);
    });
  });

  // ==========================================================================
  // Process Metadata Tests
  // ==========================================================================
  describe('Process Metadata', () => {
    it('should update process name', () => {
      service.updateProcessName('New Process Name');

      expect(service.currentProcess().name).toBe('New Process Name');
    });

    it('should update process version', () => {
      service.updateProcessVersion('2.0.0');

      expect(service.currentProcess().version).toBe('2.0.0');
    });

    it('should update process status', () => {
      service.updateProcessStatus('approved');

      expect(service.currentProcess().status).toBe('approved');
    });

    it('should update process owner', () => {
      service.updateProcessOwner('John Doe');

      expect(service.currentProcess().owner).toBe('John Doe');
    });

    it('should update process description', () => {
      service.updateProcessDescription('Test description');

      expect(service.currentProcess().description).toBe('Test description');
    });
  });

  // ==========================================================================
  // Documentation Extensions Tests
  // ==========================================================================
  describe('Documentation Extensions', () => {
    describe('RACI', () => {
      it('should get RACI for element', () => {
        service.processDocumentation.update(doc => ({
          ...doc,
          raci: [{ activityId: 'task_1', activityName: 'Task 1', responsible: [], accountable: '', consulted: [], informed: [] }]
        }));

        const raci = service.getRaciForElement('task_1');

        expect(raci).toBeDefined();
        expect(raci?.activityId).toBe('task_1');
      });

      it('should update RACI entry', () => {
        const entry = { activityId: 'task_1', activityName: 'Task 1', responsible: ['User'], accountable: 'Manager', consulted: [], informed: [] };

        service.updateRaci(entry);

        expect(service.getRaciForElement('task_1')).toBeDefined();
      });

      it('should remove RACI entry', () => {
        service.updateRaci({ activityId: 'task_1', activityName: 'Task 1', responsible: [], accountable: '', consulted: [], informed: [] });

        service.removeRaci('task_1');

        expect(service.getRaciForElement('task_1')).toBeUndefined();
      });
    });

    describe('KPIs', () => {
      it('should add KPI', () => {
        const kpi = { id: 'kpi_1', name: 'Cycle Time', description: '', targetValue: '24', unit: 'hours', frequency: 'monthly' as const, owner: '' };

        service.addKpi(kpi);

        expect(service.processDocumentation().kpis.length).toBe(1);
      });

      it('should update KPI', () => {
        service.addKpi({ id: 'kpi_1', name: 'Original', description: '', targetValue: '', unit: '', frequency: 'monthly', owner: '' });

        service.updateKpi({ id: 'kpi_1', name: 'Updated', description: '', targetValue: '', unit: '', frequency: 'weekly', owner: '' });

        expect(service.processDocumentation().kpis[0].name).toBe('Updated');
      });

      it('should remove KPI', () => {
        service.addKpi({ id: 'kpi_1', name: 'Test', description: '', targetValue: '', unit: '', frequency: 'monthly', owner: '' });

        service.removeKpi('kpi_1');

        expect(service.processDocumentation().kpis.length).toBe(0);
      });
    });

    describe('Business Rules', () => {
      it('should add business rule', () => {
        const rule = { id: 'rule_1', name: 'Test Rule', description: '', condition: '', action: '', priority: 'medium' as const, status: 'draft' as const };

        service.addBusinessRule(rule);

        expect(service.processDocumentation().businessRules.length).toBe(1);
      });

      it('should update business rule', () => {
        service.addBusinessRule({ id: 'rule_1', name: 'Original', description: '', condition: '', action: '', priority: 'low', status: 'draft' });

        service.updateBusinessRule({ id: 'rule_1', name: 'Updated', description: '', condition: '', action: '', priority: 'high', status: 'active' });

        expect(service.processDocumentation().businessRules[0].priority).toBe('high');
      });

      it('should remove business rule', () => {
        service.addBusinessRule({ id: 'rule_1', name: 'Test', description: '', condition: '', action: '', priority: 'medium', status: 'draft' });

        service.removeBusinessRule('rule_1');

        expect(service.processDocumentation().businessRules.length).toBe(0);
      });
    });

    describe('Compliance Tags', () => {
      it('should get compliance tags for element', () => {
        service.addComplianceTag({ id: 'tag_1', elementId: 'el1', framework: 'GDPR', control: '', requirement: '', status: 'compliant' });

        const tags = service.getComplianceTagsForElement('el1');

        expect(tags.length).toBe(1);
      });

      it('should add compliance tag', () => {
        service.addComplianceTag({ id: 'tag_1', elementId: 'el1', framework: 'ISO27001', control: 'A.5', requirement: 'Test', status: 'compliant' });

        expect(service.processDocumentation().complianceTags.length).toBe(1);
      });

      it('should update compliance tag', () => {
        service.addComplianceTag({ id: 'tag_1', elementId: 'el1', framework: 'GDPR', control: '', requirement: '', status: 'not-assessed' });

        service.updateComplianceTag({ id: 'tag_1', elementId: 'el1', framework: 'GDPR', control: 'Art.5', requirement: 'Data minimization', status: 'compliant' });

        expect(service.processDocumentation().complianceTags[0].status).toBe('compliant');
      });

      it('should remove compliance tag', () => {
        service.addComplianceTag({ id: 'tag_1', elementId: 'el1', framework: 'GDPR', control: '', requirement: '', status: 'compliant' });

        service.removeComplianceTag('tag_1');

        expect(service.processDocumentation().complianceTags.length).toBe(0);
      });
    });
  });

  // ==========================================================================
  // Validation Tests
  // ==========================================================================
  describe('Validation', () => {
    beforeEach(() => {
      service.setModeler(mockModeler);
    });

    it('should validate diagram', () => {
      const errors = service.validate();

      expect(Array.isArray(errors)).toBe(true);
    });

    it('should update validationErrors signal', () => {
      service.validate();

      expect(service.validationErrors()).toBeDefined();
    });

    it('should clear validation errors', () => {
      service.validationErrors.set([{ elementId: 'el1', message: 'Error', severity: 'error' }]);

      service.clearValidationErrors();

      expect(service.validationErrors()).toEqual([]);
    });
  });

  // ==========================================================================
  // Helper Methods Tests
  // ==========================================================================
  describe('Helper Methods', () => {
    it('should format element type', () => {
      expect(service.formatElementType('bpmn:UserTask')).toBe('User Task');
      expect(service.formatElementType('bpmn:ExclusiveGateway')).toBe('Exclusive Gateway');
    });

    it('should identify task elements', () => {
      expect(service.isTaskElement('bpmn:Task')).toBe(true);
      expect(service.isTaskElement('bpmn:UserTask')).toBe(true);
      expect(service.isTaskElement('bpmn:SubProcess')).toBe(true);
      expect(service.isTaskElement('bpmn:StartEvent')).toBe(false);
    });

    it('should identify gateway elements', () => {
      expect(service.isGatewayElement('bpmn:ExclusiveGateway')).toBe(true);
      expect(service.isGatewayElement('bpmn:ParallelGateway')).toBe(true);
      expect(service.isGatewayElement('bpmn:Task')).toBe(false);
    });

    it('should identify event elements', () => {
      expect(service.isEventElement('bpmn:StartEvent')).toBe(true);
      expect(service.isEventElement('bpmn:EndEvent')).toBe(true);
      expect(service.isEventElement('bpmn:IntermediateCatchEvent')).toBe(true);
      expect(service.isEventElement('bpmn:Task')).toBe(false);
    });
  });
});
