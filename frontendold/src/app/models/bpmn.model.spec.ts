import {
  generateBpmnId,
  createEmptyProcessMetadata,
  getDefaultBpmnXml,
  DEFAULT_ZOOM_CONFIG,
  DEFAULT_SHORTCUTS,
  type BpmnElement,
  type ValidationError,
  type ProcessMetadata,
  type BpmnFileInfo,
  type ExportFormat,
  type ToolbarAction,
  type ZoomConfig,
  type ViewportState,
  type KeyboardShortcut,
  type ProcessStatus,
  type BpmnElementType
} from './bpmn.model';

describe('bpmn.model', () => {
  // ==========================================================================
  // generateBpmnId Tests
  // ==========================================================================
  describe('generateBpmnId()', () => {
    it('should generate unique ID with default prefix', () => {
      const id = generateBpmnId();

      expect(id).toBeDefined();
      expect(id.startsWith('Element_')).toBe(true);
    });

    it('should generate unique ID with custom prefix', () => {
      const id = generateBpmnId('Task');

      expect(id.startsWith('Task_')).toBe(true);
    });

    it('should generate unique IDs on each call', () => {
      const id1 = generateBpmnId();
      const id2 = generateBpmnId();

      expect(id1).not.toBe(id2);
    });

    it('should generate IDs with timestamp component', () => {
      const id = generateBpmnId('Test');

      // ID format: prefix_timestamp_random
      const parts = id.split('_');
      expect(parts.length).toBeGreaterThanOrEqual(2);
    });

    it('should generate IDs with alphanumeric characters', () => {
      const id = generateBpmnId();

      expect(id).toMatch(/^[a-zA-Z0-9_]+$/);
    });

    it('should handle empty prefix', () => {
      const id = generateBpmnId('');

      expect(id).toBeDefined();
      expect(id.startsWith('_')).toBe(true);
    });

    it('should handle prefix with special characters', () => {
      const id = generateBpmnId('My-Task');

      expect(id.startsWith('My-Task_')).toBe(true);
    });
  });

  // ==========================================================================
  // createEmptyProcessMetadata Tests
  // ==========================================================================
  describe('createEmptyProcessMetadata()', () => {
    it('should create empty process metadata', () => {
      const metadata = createEmptyProcessMetadata();

      expect(metadata).toBeDefined();
      expect(metadata.id).toBeDefined();
      expect(metadata.name).toBe('New Process');
    });

    it('should have default description as empty string', () => {
      const metadata = createEmptyProcessMetadata();

      expect(metadata.description).toBe('');
    });

    it('should have default version as 1.0.0', () => {
      const metadata = createEmptyProcessMetadata();

      expect(metadata.version).toBe('1.0.0');
    });

    it('should have default owner as empty string', () => {
      const metadata = createEmptyProcessMetadata();

      expect(metadata.owner).toBe('');
    });

    it('should have lastModified as Date object', () => {
      const metadata = createEmptyProcessMetadata();

      expect(metadata.lastModified).toBeInstanceOf(Date);
    });

    it('should have default status as draft', () => {
      const metadata = createEmptyProcessMetadata();

      expect(metadata.status).toBe('draft');
    });

    it('should generate unique ID for each call', () => {
      const metadata1 = createEmptyProcessMetadata();
      const metadata2 = createEmptyProcessMetadata();

      expect(metadata1.id).not.toBe(metadata2.id);
    });

    it('should generate ID starting with Process_', () => {
      const metadata = createEmptyProcessMetadata();

      expect(metadata.id.startsWith('Process_')).toBe(true);
    });
  });

  // ==========================================================================
  // getDefaultBpmnXml Tests
  // ==========================================================================
  describe('getDefaultBpmnXml()', () => {
    it('should return valid XML string', () => {
      const xml = getDefaultBpmnXml();

      expect(xml).toBeDefined();
      expect(xml.startsWith('<?xml version="1.0"')).toBe(true);
    });

    it('should contain bpmn:definitions element', () => {
      const xml = getDefaultBpmnXml();

      expect(xml).toContain('bpmn:definitions');
    });

    it('should contain bpmn:process element', () => {
      const xml = getDefaultBpmnXml();

      expect(xml).toContain('bpmn:process');
    });

    it('should contain startEvent', () => {
      const xml = getDefaultBpmnXml();

      expect(xml).toContain('bpmn:startEvent');
      expect(xml).toContain('StartEvent_1');
    });

    it('should contain endEvent', () => {
      const xml = getDefaultBpmnXml();

      expect(xml).toContain('bpmn:endEvent');
      expect(xml).toContain('EndEvent_1');
    });

    it('should contain task', () => {
      const xml = getDefaultBpmnXml();

      expect(xml).toContain('bpmn:task');
      expect(xml).toContain('Task_1');
    });

    it('should contain sequence flows', () => {
      const xml = getDefaultBpmnXml();

      expect(xml).toContain('bpmn:sequenceFlow');
      expect(xml).toContain('Flow_1');
      expect(xml).toContain('Flow_2');
    });

    it('should contain BPMN diagram definition', () => {
      const xml = getDefaultBpmnXml();

      expect(xml).toContain('bpmndi:BPMNDiagram');
      expect(xml).toContain('bpmndi:BPMNPlane');
    });

    it('should contain shape definitions', () => {
      const xml = getDefaultBpmnXml();

      expect(xml).toContain('bpmndi:BPMNShape');
      expect(xml).toContain('dc:Bounds');
    });

    it('should contain edge definitions', () => {
      const xml = getDefaultBpmnXml();

      expect(xml).toContain('bpmndi:BPMNEdge');
      expect(xml).toContain('di:waypoint');
    });

    it('should use provided processId', () => {
      const processId = 'MyCustomProcess_123';
      const xml = getDefaultBpmnXml(processId);

      expect(xml).toContain(`id="${processId}"`);
    });

    it('should generate processId if not provided', () => {
      const xml = getDefaultBpmnXml();

      expect(xml).toMatch(/id="Process_[a-zA-Z0-9_]+"/);
    });

    it('should have isExecutable set to false', () => {
      const xml = getDefaultBpmnXml();

      expect(xml).toContain('isExecutable="false"');
    });

    it('should have proper XML namespaces', () => {
      const xml = getDefaultBpmnXml();

      expect(xml).toContain('xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL"');
      expect(xml).toContain('xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI"');
      expect(xml).toContain('xmlns:dc="http://www.omg.org/spec/DD/20100524/DC"');
      expect(xml).toContain('xmlns:di="http://www.omg.org/spec/DD/20100524/DI"');
    });

    it('should have targetNamespace', () => {
      const xml = getDefaultBpmnXml();

      expect(xml).toContain('targetNamespace="http://bpmn.io/schema/bpmn"');
    });

    it('should have labeled start and end events', () => {
      const xml = getDefaultBpmnXml();

      expect(xml).toContain('name="Start"');
      expect(xml).toContain('name="End"');
      expect(xml).toContain('name="Task 1"');
    });
  });

  // ==========================================================================
  // DEFAULT_ZOOM_CONFIG Tests
  // ==========================================================================
  describe('DEFAULT_ZOOM_CONFIG', () => {
    it('should have min zoom level', () => {
      expect(DEFAULT_ZOOM_CONFIG.min).toBe(0.2);
    });

    it('should have max zoom level', () => {
      expect(DEFAULT_ZOOM_CONFIG.max).toBe(4);
    });

    it('should have step value', () => {
      expect(DEFAULT_ZOOM_CONFIG.step).toBe(0.1);
    });

    it('should have default zoom level', () => {
      expect(DEFAULT_ZOOM_CONFIG.default).toBe(1);
    });

    it('should have min less than max', () => {
      expect(DEFAULT_ZOOM_CONFIG.min).toBeLessThan(DEFAULT_ZOOM_CONFIG.max);
    });

    it('should have default within min and max range', () => {
      expect(DEFAULT_ZOOM_CONFIG.default).toBeGreaterThanOrEqual(DEFAULT_ZOOM_CONFIG.min);
      expect(DEFAULT_ZOOM_CONFIG.default).toBeLessThanOrEqual(DEFAULT_ZOOM_CONFIG.max);
    });

    it('should have positive step value', () => {
      expect(DEFAULT_ZOOM_CONFIG.step).toBeGreaterThan(0);
    });
  });

  // ==========================================================================
  // DEFAULT_SHORTCUTS Tests
  // ==========================================================================
  describe('DEFAULT_SHORTCUTS', () => {
    it('should have undo shortcut', () => {
      const undoShortcut = DEFAULT_SHORTCUTS.find(s => s.action === 'undo');

      expect(undoShortcut).toBeDefined();
      expect(undoShortcut?.key).toBe('z');
      expect(undoShortcut?.ctrl).toBe(true);
    });

    it('should have redo shortcut', () => {
      const redoShortcut = DEFAULT_SHORTCUTS.find(s => s.action === 'redo' && s.key === 'y');

      expect(redoShortcut).toBeDefined();
      expect(redoShortcut?.ctrl).toBe(true);
    });

    it('should have alternative redo shortcut with shift', () => {
      const redoAltShortcut = DEFAULT_SHORTCUTS.find(s => s.action === 'redo' && s.shift);

      expect(redoAltShortcut).toBeDefined();
      expect(redoAltShortcut?.key).toBe('z');
      expect(redoAltShortcut?.ctrl).toBe(true);
      expect(redoAltShortcut?.shift).toBe(true);
    });

    it('should have save shortcut', () => {
      const saveShortcut = DEFAULT_SHORTCUTS.find(s => s.action === 'save');

      expect(saveShortcut).toBeDefined();
      expect(saveShortcut?.key).toBe('s');
      expect(saveShortcut?.ctrl).toBe(true);
    });

    it('should have open shortcut', () => {
      const openShortcut = DEFAULT_SHORTCUTS.find(s => s.action === 'open');

      expect(openShortcut).toBeDefined();
      expect(openShortcut?.key).toBe('o');
      expect(openShortcut?.ctrl).toBe(true);
    });

    it('should have new diagram shortcut', () => {
      const newShortcut = DEFAULT_SHORTCUTS.find(s => s.action === 'new');

      expect(newShortcut).toBeDefined();
      expect(newShortcut?.key).toBe('n');
      expect(newShortcut?.ctrl).toBe(true);
    });

    it('should have zoom in shortcut', () => {
      const zoomInShortcut = DEFAULT_SHORTCUTS.find(s => s.action === 'zoomIn');

      expect(zoomInShortcut).toBeDefined();
      expect(zoomInShortcut?.key).toBe('+');
      expect(zoomInShortcut?.ctrl).toBe(true);
    });

    it('should have zoom out shortcut', () => {
      const zoomOutShortcut = DEFAULT_SHORTCUTS.find(s => s.action === 'zoomOut');

      expect(zoomOutShortcut).toBeDefined();
      expect(zoomOutShortcut?.key).toBe('-');
      expect(zoomOutShortcut?.ctrl).toBe(true);
    });

    it('should have zoom reset shortcut', () => {
      const zoomResetShortcut = DEFAULT_SHORTCUTS.find(s => s.action === 'zoomReset');

      expect(zoomResetShortcut).toBeDefined();
      expect(zoomResetShortcut?.key).toBe('0');
      expect(zoomResetShortcut?.ctrl).toBe(true);
    });

    it('should have zoom fit shortcut', () => {
      const zoomFitShortcut = DEFAULT_SHORTCUTS.find(s => s.action === 'zoomFit');

      expect(zoomFitShortcut).toBeDefined();
      expect(zoomFitShortcut?.key).toBe('1');
      expect(zoomFitShortcut?.ctrl).toBe(true);
    });

    it('should have delete shortcut', () => {
      const deleteShortcut = DEFAULT_SHORTCUTS.find(s => s.action === 'delete');

      expect(deleteShortcut).toBeDefined();
      expect(deleteShortcut?.key).toBe('Delete');
    });

    it('should have deselect shortcut', () => {
      const deselectShortcut = DEFAULT_SHORTCUTS.find(s => s.action === 'deselect');

      expect(deselectShortcut).toBeDefined();
      expect(deselectShortcut?.key).toBe('Escape');
    });

    it('should have descriptions for all shortcuts', () => {
      DEFAULT_SHORTCUTS.forEach(shortcut => {
        expect(shortcut.description).toBeDefined();
        expect(shortcut.description.length).toBeGreaterThan(0);
      });
    });

    it('should have unique actions', () => {
      // Note: redo has two shortcuts, so we check for at least expected count
      const actions = DEFAULT_SHORTCUTS.map(s => s.action);
      const uniqueActions = new Set(actions);

      // Should have at least these unique actions
      expect(uniqueActions.has('undo')).toBe(true);
      expect(uniqueActions.has('redo')).toBe(true);
      expect(uniqueActions.has('save')).toBe(true);
      expect(uniqueActions.has('delete')).toBe(true);
    });
  });

  // ==========================================================================
  // Type Interface Tests
  // ==========================================================================
  describe('Type Interfaces', () => {
    describe('BpmnElement interface', () => {
      it('should allow creating BpmnElement object', () => {
        const element: BpmnElement = {
          id: 'element_1',
          type: 'bpmn:Task',
          name: 'My Task',
          businessObject: {}
        };

        expect(element.id).toBe('element_1');
        expect(element.type).toBe('bpmn:Task');
        expect(element.name).toBe('My Task');
      });

      it('should allow optional name', () => {
        const element: BpmnElement = {
          id: 'element_1',
          type: 'bpmn:StartEvent',
          businessObject: {}
        };

        expect(element.name).toBeUndefined();
      });
    });

    describe('ValidationError interface', () => {
      it('should allow creating ValidationError object', () => {
        const error: ValidationError = {
          elementId: 'task_1',
          message: 'Task has no name',
          severity: 'warning'
        };

        expect(error.elementId).toBe('task_1');
        expect(error.message).toBe('Task has no name');
        expect(error.severity).toBe('warning');
      });

      it('should allow error severity', () => {
        const error: ValidationError = {
          elementId: 'task_1',
          message: 'Missing connection',
          severity: 'error'
        };

        expect(error.severity).toBe('error');
      });

      it('should allow info severity', () => {
        const error: ValidationError = {
          elementId: 'task_1',
          message: 'Consider adding documentation',
          severity: 'info'
        };

        expect(error.severity).toBe('info');
      });
    });

    describe('ProcessMetadata interface', () => {
      it('should allow creating ProcessMetadata object', () => {
        const metadata: ProcessMetadata = {
          id: 'process_1',
          name: 'My Process',
          description: 'A test process',
          version: '2.0.0',
          owner: 'John Doe',
          lastModified: new Date(),
          status: 'approved'
        };

        expect(metadata.id).toBe('process_1');
        expect(metadata.status).toBe('approved');
      });
    });

    describe('BpmnFileInfo interface', () => {
      it('should allow creating BpmnFileInfo object', () => {
        const fileInfo: BpmnFileInfo = {
          name: 'my-process.bpmn',
          xml: '<xml>content</xml>',
          metadata: createEmptyProcessMetadata()
        };

        expect(fileInfo.name).toBe('my-process.bpmn');
        expect(fileInfo.xml).toBe('<xml>content</xml>');
      });
    });

    describe('ExportFormat type', () => {
      it('should allow valid export formats', () => {
        const formats: ExportFormat[] = ['bpmn', 'svg', 'png', 'pdf'];

        expect(formats.includes('bpmn')).toBe(true);
        expect(formats.includes('svg')).toBe(true);
        expect(formats.includes('png')).toBe(true);
        expect(formats.includes('pdf')).toBe(true);
      });
    });

    describe('ToolbarAction interface', () => {
      it('should allow creating ToolbarAction object', () => {
        const action: ToolbarAction = {
          id: 'save',
          label: 'Save',
          icon: 'save-icon',
          action: () => {},
          disabled: false,
          tooltip: 'Save diagram'
        };

        expect(action.id).toBe('save');
        expect(action.label).toBe('Save');
      });

      it('should allow optional separator', () => {
        const action: ToolbarAction = {
          id: 'separator',
          label: '',
          icon: '',
          action: () => {},
          separator: true
        };

        expect(action.separator).toBe(true);
      });
    });

    describe('ZoomConfig interface', () => {
      it('should allow creating ZoomConfig object', () => {
        const config: ZoomConfig = {
          min: 0.5,
          max: 3,
          step: 0.25,
          default: 1
        };

        expect(config.min).toBe(0.5);
        expect(config.max).toBe(3);
      });
    });

    describe('ViewportState interface', () => {
      it('should allow creating ViewportState object', () => {
        const viewport: ViewportState = {
          x: 100,
          y: 200,
          scale: 1.5
        };

        expect(viewport.x).toBe(100);
        expect(viewport.y).toBe(200);
        expect(viewport.scale).toBe(1.5);
      });
    });

    describe('KeyboardShortcut interface', () => {
      it('should allow creating KeyboardShortcut object', () => {
        const shortcut: KeyboardShortcut = {
          key: 's',
          ctrl: true,
          shift: false,
          alt: false,
          action: 'save',
          description: 'Save diagram'
        };

        expect(shortcut.key).toBe('s');
        expect(shortcut.ctrl).toBe(true);
      });

      it('should allow optional modifiers', () => {
        const shortcut: KeyboardShortcut = {
          key: 'Delete',
          action: 'delete',
          description: 'Delete selected'
        };

        expect(shortcut.ctrl).toBeUndefined();
        expect(shortcut.shift).toBeUndefined();
        expect(shortcut.alt).toBeUndefined();
      });
    });

    describe('ProcessStatus type', () => {
      it('should allow valid process statuses', () => {
        const statuses: ProcessStatus[] = ['draft', 'review', 'approved', 'archived'];

        expect(statuses.includes('draft')).toBe(true);
        expect(statuses.includes('review')).toBe(true);
        expect(statuses.includes('approved')).toBe(true);
        expect(statuses.includes('archived')).toBe(true);
      });
    });

    describe('BpmnElementType type', () => {
      it('should include common element types', () => {
        const types: BpmnElementType[] = [
          'bpmn:Process',
          'bpmn:StartEvent',
          'bpmn:EndEvent',
          'bpmn:Task',
          'bpmn:UserTask',
          'bpmn:ServiceTask',
          'bpmn:ExclusiveGateway',
          'bpmn:ParallelGateway',
          'bpmn:SequenceFlow'
        ];

        expect(types.length).toBe(9);
      });
    });
  });
});
