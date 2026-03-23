import { Injectable, signal, computed } from '@angular/core';
import type {
  BpmnElement,
  ProcessMetadata,
  ExportFormat,
  ValidationError
} from '../models/bpmn.model';
import {
  createEmptyProcessMetadata,
  getDefaultBpmnXml,
  DEFAULT_ZOOM_CONFIG
} from '../models/bpmn.model';
import type { ProcessDocumentation, RaciEntry, ProcessKpi, BusinessRule, ComplianceTag } from '../models/bpmn-extensions.model';
import { createEmptyProcessDocumentation, calculateQualityScore } from '../models/bpmn-extensions.model';

@Injectable({
  providedIn: 'root'
})
export class BpmnModelerService {
  // Core modeler instance (set after initialization)
  private modeler: any = null;

  // Element counters for auto-naming
  private elementCounters: Record<string, number> = {};

  // ==========================================
  // Signals for Reactive State
  // ==========================================

  // Modeler state
  readonly isLoading = signal<boolean>(false);
  readonly isDirty = signal<boolean>(false);
  readonly canUndo = signal<boolean>(false);
  readonly canRedo = signal<boolean>(false);
  readonly zoomLevel = signal<number>(1);

  // Selection
  readonly selectedElement = signal<BpmnElement | null>(null);

  // Validation
  readonly validationErrors = signal<ValidationError[]>([]);

  // Properties panel visibility (hidden by default, shown when user selects element or clicks Properties)
  readonly isPanelOpen = signal<boolean>(false);

  // Grid dots visibility (hidden by default, toggled via toolbar)
  readonly showGridDots = signal<boolean>(false);

  // Current process
  readonly currentProcess = signal<ProcessMetadata>(createEmptyProcessMetadata());
  readonly currentXml = signal<string>('');

  // Process documentation extensions
  readonly processDocumentation = signal<ProcessDocumentation>(createEmptyProcessDocumentation());

  // ==========================================
  // Computed Values
  // ==========================================

  readonly hasSelection = computed(() => this.selectedElement() !== null);

  readonly elementCount = computed(() => {
    if (!this.modeler) return 0;
    try {
      const elementRegistry = this.modeler.get('elementRegistry');
      return elementRegistry.getAll().length;
    } catch {
      return 0;
    }
  });

  readonly qualityScoreColor = computed(() => {
    const score = this.processDocumentation().qualityScore.overall;
    if (score >= 80) return '#276749'; // Success green
    if (score >= 60) return '#b9a779'; // Gold
    if (score >= 40) return '#c05621'; // Warning orange
    return '#c53030'; // Error red
  });

  readonly zoomPercentage = computed(() => Math.round(this.zoomLevel() * 100));

  // ==========================================
  // Modeler Initialization
  // ==========================================

  setModeler(modeler: any): void {
    this.modeler = modeler;
    this.setupEventListeners();
  }

  getModeler(): any {
    return this.modeler;
  }

  private setupEventListeners(): void {
    if (!this.modeler) return;

    const eventBus = this.modeler.get('eventBus');
    const commandStack = this.modeler.get('commandStack');

    // Selection changed
    eventBus.on('selection.changed', (e: any) => {
      const selected = e.newSelection[0];
      if (selected) {
        this.selectedElement.set({
          id: selected.id,
          type: selected.type,
          name: selected.businessObject?.name || '',
          businessObject: selected.businessObject
        });
      } else {
        this.selectedElement.set(null);
      }
    });

    // Command stack changed (for undo/redo)
    eventBus.on('commandStack.changed', () => {
      this.canUndo.set(commandStack.canUndo());
      this.canRedo.set(commandStack.canRedo());
      this.isDirty.set(true);
    });

    // Canvas zoom
    eventBus.on('canvas.viewbox.changed', (e: any) => {
      if (e.viewbox?.scale) {
        this.zoomLevel.set(e.viewbox.scale);
      }
    });

    // Element changed (for documentation updates)
    eventBus.on('element.changed', (e: any) => {
      const selected = this.selectedElement();
      if (selected && e.element.id === selected.id) {
        this.selectedElement.set({
          ...selected,
          name: e.element.businessObject?.name || ''
        });
      }
    });
  }

  // ==========================================
  // Diagram Operations
  // ==========================================

  async createNewDiagram(): Promise<void> {
    if (!this.modeler) return;

    this.isLoading.set(true);
    const processId = `Process_${Date.now()}`;
    const defaultXml = getDefaultBpmnXml(processId);

    try {
      await this.modeler.importXML(defaultXml);
      this.currentXml.set(defaultXml);
      this.isDirty.set(false);
      this.canUndo.set(false);
      this.canRedo.set(false);
      this.currentProcess.set({
        ...createEmptyProcessMetadata(),
        id: processId
      });
      this.processDocumentation.set(createEmptyProcessDocumentation());
      this.validationErrors.set([]);
      this.resetElementCounters();

      // Fit to viewport
      setTimeout(() => this.zoomFit(), 100);
    } catch (err) {
      console.error('Error creating new diagram:', err);
    } finally {
      this.isLoading.set(false);
    }
  }

  async importDiagram(xml: string): Promise<boolean> {
    if (!this.modeler) return false;

    this.isLoading.set(true);

    try {
      const result = await this.modeler.importXML(xml);
      this.currentXml.set(xml);
      this.isDirty.set(false);
      this.canUndo.set(false);
      this.canRedo.set(false);

      // Extract process info from imported XML
      const definitions = result.definitions;
      if (definitions) {
        const process = definitions.rootElements?.find((el: any) => el.$type === 'bpmn:Process');
        if (process) {
          this.currentProcess.update(p => ({
            ...p,
            id: process.id,
            name: process.name || 'Imported Process'
          }));
        }
      }

      // Fit to viewport
      setTimeout(() => this.zoomFit(), 100);
      return true;
    } catch (err) {
      console.error('Error importing diagram:', err);
      return false;
    } finally {
      this.isLoading.set(false);
    }
  }

  async exportDiagram(format: ExportFormat = 'bpmn'): Promise<string | Blob> {
    if (!this.modeler) return '';

    try {
      switch (format) {
        case 'bpmn': {
          const { xml } = await this.modeler.saveXML({ format: true });
          return xml;
        }
        case 'svg': {
          const { svg } = await this.modeler.saveSVG();
          return svg;
        }
        case 'png': {
          // SVG to PNG conversion would require canvas
          const { svg } = await this.modeler.saveSVG();
          return svg; // Return SVG for now
        }
        default:
          return '';
      }
    } catch (err) {
      console.error('Error exporting diagram:', err);
      return '';
    }
  }

  async saveDiagram(): Promise<string> {
    if (!this.modeler) return '';

    try {
      const { xml } = await this.modeler.saveXML({ format: true });
      this.currentXml.set(xml);
      this.isDirty.set(false);
      this.currentProcess.update(p => ({
        ...p,
        lastModified: new Date()
      }));
      return xml;
    } catch (err) {
      console.error('Error saving diagram:', err);
      return '';
    }
  }

  // ==========================================
  // Edit Operations
  // ==========================================

  undo(): void {
    if (this.modeler && this.canUndo()) {
      this.modeler.get('commandStack').undo();
    }
  }

  redo(): void {
    if (this.modeler && this.canRedo()) {
      this.modeler.get('commandStack').redo();
    }
  }

  deleteSelected(): void {
    const element = this.selectedElement();
    if (!element || !this.modeler) return;

    const modeling = this.modeler.get('modeling');
    const elementRegistry = this.modeler.get('elementRegistry');
    const el = elementRegistry.get(element.id);

    if (el) {
      modeling.removeElements([el]);
    }
  }

  // ==========================================
  // Zoom Operations
  // ==========================================

  zoomIn(): void {
    const canvas = this.modeler?.get('canvas');
    if (canvas) {
      const newZoom = Math.min(
        this.zoomLevel() + DEFAULT_ZOOM_CONFIG.step,
        DEFAULT_ZOOM_CONFIG.max
      );
      canvas.zoom(newZoom);
    }
  }

  zoomOut(): void {
    const canvas = this.modeler?.get('canvas');
    if (canvas) {
      const newZoom = Math.max(
        this.zoomLevel() - DEFAULT_ZOOM_CONFIG.step,
        DEFAULT_ZOOM_CONFIG.min
      );
      canvas.zoom(newZoom);
    }
  }

  zoomFit(): void {
    const canvas = this.modeler?.get('canvas');
    if (canvas) {
      canvas.zoom('fit-viewport');
    }
  }

  zoomReset(): void {
    const canvas = this.modeler?.get('canvas');
    if (canvas) {
      canvas.zoom(DEFAULT_ZOOM_CONFIG.default);
    }
  }

  setZoom(level: number): void {
    const canvas = this.modeler?.get('canvas');
    if (canvas) {
      const clampedLevel = Math.max(
        DEFAULT_ZOOM_CONFIG.min,
        Math.min(level, DEFAULT_ZOOM_CONFIG.max)
      );
      canvas.zoom(clampedLevel);
    }
  }

  // ==========================================
  // Element Operations
  // ==========================================

  updateElementName(elementId: string, name: string): void {
    if (!this.modeler) return;

    const modeling = this.modeler.get('modeling');
    const elementRegistry = this.modeler.get('elementRegistry');
    const element = elementRegistry.get(elementId);

    if (element) {
      modeling.updateLabel(element, name);
    }
  }

  updateElementProperty(elementId: string, property: string, value: any): void {
    if (!this.modeler) return;

    const modeling = this.modeler.get('modeling');
    const elementRegistry = this.modeler.get('elementRegistry');
    const element = elementRegistry.get(elementId);

    if (element) {
      modeling.updateProperties(element, { [property]: value });
    }
  }

  getElementDocumentation(element: BpmnElement): string {
    const docs = element.businessObject?.documentation;
    if (docs && docs.length > 0) {
      return docs[0].text || '';
    }
    return '';
  }

  updateElementDocumentation(elementId: string, text: string): void {
    if (!this.modeler) return;

    const modeling = this.modeler.get('modeling');
    const elementRegistry = this.modeler.get('elementRegistry');
    const moddle = this.modeler.get('moddle');
    const element = elementRegistry.get(elementId);

    if (element) {
      const documentation = moddle.create('bpmn:Documentation', { text });
      modeling.updateProperties(element, { documentation: [documentation] });
    }
  }

  // ==========================================
  // Properties Panel
  // ==========================================

  togglePanel(): void {
    this.isPanelOpen.update(v => !v);
  }

  openPanel(): void {
    this.isPanelOpen.set(true);
  }

  closePanel(): void {
    this.isPanelOpen.set(false);
  }

  // ==========================================
  // Grid Dots Visibility
  // ==========================================

  toggleGridDots(): void {
    this.showGridDots.update(v => !v);
  }

  // ==========================================
  // Process Metadata
  // ==========================================

  updateProcessName(name: string): void {
    this.currentProcess.update(p => ({ ...p, name }));
  }

  updateProcessVersion(version: string): void {
    this.currentProcess.update(p => ({ ...p, version }));
  }

  updateProcessStatus(status: ProcessMetadata['status']): void {
    this.currentProcess.update(p => ({ ...p, status }));
  }

  updateProcessOwner(owner: string): void {
    this.currentProcess.update(p => ({ ...p, owner }));
  }

  updateProcessDescription(description: string): void {
    this.currentProcess.update(p => ({ ...p, description }));
  }

  // ==========================================
  // Documentation Extensions
  // ==========================================

  // RACI
  getRaciForElement(elementId: string): RaciEntry | undefined {
    return this.processDocumentation().raci.find(r => r.activityId === elementId);
  }

  updateRaci(entry: RaciEntry): void {
    this.processDocumentation.update(doc => {
      const index = doc.raci.findIndex(r => r.activityId === entry.activityId);
      const raci = [...doc.raci];
      if (index >= 0) {
        raci[index] = entry;
      } else {
        raci.push(entry);
      }
      return { ...doc, raci };
    });
  }

  removeRaci(activityId: string): void {
    this.processDocumentation.update(doc => ({
      ...doc,
      raci: doc.raci.filter(r => r.activityId !== activityId)
    }));
  }

  // KPIs
  addKpi(kpi: ProcessKpi): void {
    this.processDocumentation.update(doc => ({
      ...doc,
      kpis: [...doc.kpis, kpi]
    }));
  }

  updateKpi(kpi: ProcessKpi): void {
    this.processDocumentation.update(doc => ({
      ...doc,
      kpis: doc.kpis.map(k => k.id === kpi.id ? kpi : k)
    }));
  }

  removeKpi(kpiId: string): void {
    this.processDocumentation.update(doc => ({
      ...doc,
      kpis: doc.kpis.filter(k => k.id !== kpiId)
    }));
  }

  // Business Rules
  addBusinessRule(rule: BusinessRule): void {
    this.processDocumentation.update(doc => ({
      ...doc,
      businessRules: [...doc.businessRules, rule]
    }));
  }

  updateBusinessRule(rule: BusinessRule): void {
    this.processDocumentation.update(doc => ({
      ...doc,
      businessRules: doc.businessRules.map(r => r.id === rule.id ? rule : r)
    }));
  }

  removeBusinessRule(ruleId: string): void {
    this.processDocumentation.update(doc => ({
      ...doc,
      businessRules: doc.businessRules.filter(r => r.id !== ruleId)
    }));
  }

  // Compliance Tags
  getComplianceTagsForElement(elementId: string): ComplianceTag[] {
    return this.processDocumentation().complianceTags.filter(t => t.elementId === elementId);
  }

  addComplianceTag(tag: ComplianceTag): void {
    this.processDocumentation.update(doc => ({
      ...doc,
      complianceTags: [...doc.complianceTags, tag]
    }));
  }

  updateComplianceTag(tag: ComplianceTag): void {
    this.processDocumentation.update(doc => ({
      ...doc,
      complianceTags: doc.complianceTags.map(t => t.id === tag.id ? tag : t)
    }));
  }

  removeComplianceTag(tagId: string): void {
    this.processDocumentation.update(doc => ({
      ...doc,
      complianceTags: doc.complianceTags.filter(t => t.id !== tagId)
    }));
  }

  // Quality Score
  recalculateQualityScore(): void {
    const doc = this.processDocumentation();
    const count = this.elementCount();
    const score = calculateQualityScore(doc, count);
    this.processDocumentation.update(d => ({
      ...d,
      qualityScore: score
    }));
  }

  // ==========================================
  // Validation
  // ==========================================

  validate(): ValidationError[] {
    const errors: ValidationError[] = [];

    if (!this.modeler) return errors;

    try {
      const elementRegistry = this.modeler.get('elementRegistry');
      const elements = elementRegistry.getAll();

      elements.forEach((element: any) => {
        // Skip diagram elements
        if (element.type.startsWith('bpmndi:')) return;

        // Check for unnamed tasks
        if (element.type.includes('Task') && !element.businessObject?.name) {
          errors.push({
            elementId: element.id,
            message: 'Task has no name',
            severity: 'warning'
          });
        }

        // Check for disconnected flow elements
        if (
          element.type.includes('Task') ||
          element.type.includes('Gateway') ||
          (element.type.includes('Event') && !element.type.includes('Boundary'))
        ) {
          const incoming = element.incoming || [];
          const outgoing = element.outgoing || [];

          if (incoming.length === 0 && !element.type.includes('StartEvent')) {
            errors.push({
              elementId: element.id,
              message: 'Element has no incoming connection',
              severity: 'error'
            });
          }

          if (outgoing.length === 0 && !element.type.includes('EndEvent')) {
            errors.push({
              elementId: element.id,
              message: 'Element has no outgoing connection',
              severity: 'error'
            });
          }
        }

        // Check for gateways with single path
        if (element.type.includes('Gateway')) {
          const outgoing = element.outgoing || [];
          if (outgoing.length < 2) {
            errors.push({
              elementId: element.id,
              message: 'Gateway should have multiple outgoing paths',
              severity: 'warning'
            });
          }
        }
      });
    } catch (err) {
      console.error('Error during validation:', err);
    }

    this.validationErrors.set(errors);
    return errors;
  }

  clearValidationErrors(): void {
    this.validationErrors.set([]);
  }

  // ==========================================
  // Helpers
  // ==========================================

  formatElementType(type: string): string {
    return type.replace('bpmn:', '').replace(/([A-Z])/g, ' $1').trim();
  }

  isTaskElement(type: string): boolean {
    return type.includes('Task') || type.includes('Activity') || type.includes('SubProcess');
  }

  isGatewayElement(type: string): boolean {
    return type.includes('Gateway');
  }

  isEventElement(type: string): boolean {
    return type.includes('Event');
  }

  // ==========================================
  // Element Creation
  // ==========================================

  /**
   * Create a new BPMN element at the specified position
   */
  createElement(type: string, position: { x: number; y: number }, properties?: Record<string, any>): any {
    if (!this.modeler) return null;

    try {
      const elementFactory = this.modeler.get('elementFactory');
      const modeling = this.modeler.get('modeling');
      const canvas = this.modeler.get('canvas');
      const rootElement = canvas.getRootElement();

      // Create the shape
      const shape = elementFactory.createShape({
        type,
        ...properties
      });

      // Add to canvas
      modeling.createShape(shape, position, rootElement);

      // Auto-generate name based on type
      const autoName = this.getDefaultNameForType(type);
      if (autoName && shape) {
        this.updateElementName(shape.id, autoName);
      }

      return shape;
    } catch (error) {
      console.error('Error creating element:', error);
      return null;
    }
  }

  /**
   * Get default name for an element type (auto-naming)
   */
  private getDefaultNameForType(type: string): string {
    // Extract base type without 'bpmn:' prefix
    const baseType = type.replace('bpmn:', '');

    // Increment counter for this type
    this.elementCounters[baseType] = (this.elementCounters[baseType] || 0) + 1;
    const count = this.elementCounters[baseType];

    // Return appropriate name based on type
    switch (type) {
      case 'bpmn:StartEvent':
        return 'Start';
      case 'bpmn:EndEvent':
        return 'End';
      case 'bpmn:Task':
        return `Task ${count}`;
      case 'bpmn:UserTask':
        return `User Task ${count}`;
      case 'bpmn:ServiceTask':
        return `Service Task ${count}`;
      case 'bpmn:ScriptTask':
        return `Script Task ${count}`;
      case 'bpmn:ManualTask':
        return `Manual Task ${count}`;
      case 'bpmn:SendTask':
        return `Send Task ${count}`;
      case 'bpmn:ReceiveTask':
        return `Receive Task ${count}`;
      case 'bpmn:BusinessRuleTask':
        return `Business Rule ${count}`;
      case 'bpmn:CallActivity':
        return `Call Activity ${count}`;
      case 'bpmn:SubProcess':
        return `Sub Process ${count}`;
      case 'bpmn:ExclusiveGateway':
        return `Decision ${count}`;
      case 'bpmn:ParallelGateway':
        return `Parallel ${count}`;
      case 'bpmn:InclusiveGateway':
        return `Inclusive ${count}`;
      case 'bpmn:EventBasedGateway':
        return `Event Gateway ${count}`;
      case 'bpmn:ComplexGateway':
        return `Complex ${count}`;
      case 'bpmn:IntermediateThrowEvent':
        return `Throw ${count}`;
      case 'bpmn:IntermediateCatchEvent':
        return `Catch ${count}`;
      case 'bpmn:BoundaryEvent':
        return `Boundary ${count}`;
      case 'bpmn:DataObjectReference':
        return `Data ${count}`;
      case 'bpmn:DataStoreReference':
        return `Data Store ${count}`;
      case 'bpmn:TextAnnotation':
        return '';  // Text annotations shouldn't have auto-names
      case 'bpmn:Participant':
        return `Pool ${count}`;
      default:
        return '';
    }
  }

  /**
   * Reset element counters (e.g., when creating a new diagram)
   */
  resetElementCounters(): void {
    this.elementCounters = {};
  }

  /**
   * Create a start event
   */
  createStartEvent(position: { x: number; y: number }, name?: string): any {
    const element = this.createElement('bpmn:StartEvent', position);
    if (element && name) {
      this.updateElementName(element.id, name);
    }
    return element;
  }

  /**
   * Create an end event
   */
  createEndEvent(position: { x: number; y: number }, name?: string): any {
    const element = this.createElement('bpmn:EndEvent', position);
    if (element && name) {
      this.updateElementName(element.id, name);
    }
    return element;
  }

  /**
   * Create a task
   */
  createTask(position: { x: number; y: number }, name?: string, taskType: string = 'bpmn:Task'): any {
    const element = this.createElement(taskType, position);
    if (element && name) {
      this.updateElementName(element.id, name);
    }
    return element;
  }

  /**
   * Create a user task
   */
  createUserTask(position: { x: number; y: number }, name?: string): any {
    return this.createTask(position, name, 'bpmn:UserTask');
  }

  /**
   * Create a service task
   */
  createServiceTask(position: { x: number; y: number }, name?: string): any {
    return this.createTask(position, name, 'bpmn:ServiceTask');
  }

  /**
   * Create a gateway
   */
  createGateway(position: { x: number; y: number }, gatewayType: string = 'bpmn:ExclusiveGateway', name?: string): any {
    const element = this.createElement(gatewayType, position);
    if (element && name) {
      this.updateElementName(element.id, name);
    }
    return element;
  }

  /**
   * Create an exclusive gateway (XOR)
   */
  createExclusiveGateway(position: { x: number; y: number }, name?: string): any {
    return this.createGateway(position, 'bpmn:ExclusiveGateway', name);
  }

  /**
   * Create a parallel gateway (AND)
   */
  createParallelGateway(position: { x: number; y: number }, name?: string): any {
    return this.createGateway(position, 'bpmn:ParallelGateway', name);
  }

  /**
   * Create an inclusive gateway (OR)
   */
  createInclusiveGateway(position: { x: number; y: number }, name?: string): any {
    return this.createGateway(position, 'bpmn:InclusiveGateway', name);
  }

  // ==========================================
  // Connection Handling
  // ==========================================

  /**
   * Connect two elements with a sequence flow
   */
  connectElements(sourceId: string, targetId: string, name?: string): any {
    if (!this.modeler) return null;

    try {
      const modeling = this.modeler.get('modeling');
      const elementRegistry = this.modeler.get('elementRegistry');

      const source = elementRegistry.get(sourceId);
      const target = elementRegistry.get(targetId);

      if (!source || !target) {
        console.error('Source or target element not found');
        return null;
      }

      // Create the connection
      const connection = modeling.connect(source, target);

      // Set name if provided
      if (connection && name) {
        modeling.updateLabel(connection, name);
      }

      return connection;
    } catch (error) {
      console.error('Error connecting elements:', error);
      return null;
    }
  }

  /**
   * Get all connections for an element
   */
  getElementConnections(elementId: string): { incoming: any[]; outgoing: any[] } {
    if (!this.modeler) return { incoming: [], outgoing: [] };

    try {
      const elementRegistry = this.modeler.get('elementRegistry');
      const element = elementRegistry.get(elementId);

      if (!element) return { incoming: [], outgoing: [] };

      return {
        incoming: element.incoming || [],
        outgoing: element.outgoing || []
      };
    } catch {
      return { incoming: [], outgoing: [] };
    }
  }

  /**
   * Remove a connection
   */
  removeConnection(connectionId: string): void {
    if (!this.modeler) return;

    try {
      const modeling = this.modeler.get('modeling');
      const elementRegistry = this.modeler.get('elementRegistry');
      const connection = elementRegistry.get(connectionId);

      if (connection) {
        modeling.removeConnection(connection);
      }
    } catch (error) {
      console.error('Error removing connection:', error);
    }
  }

  /**
   * Update connection waypoints (for routing)
   */
  updateConnectionWaypoints(connectionId: string, waypoints: Array<{ x: number; y: number }>): void {
    if (!this.modeler) return;

    try {
      const modeling = this.modeler.get('modeling');
      const elementRegistry = this.modeler.get('elementRegistry');
      const connection = elementRegistry.get(connectionId);

      if (connection) {
        modeling.updateWaypoints(connection, waypoints);
      }
    } catch (error) {
      console.error('Error updating waypoints:', error);
    }
  }

  /**
   * Check if two elements can be connected
   */
  canConnect(sourceId: string, targetId: string): boolean {
    if (!this.modeler) return false;

    try {
      const rules = this.modeler.get('rules');
      const elementRegistry = this.modeler.get('elementRegistry');

      const source = elementRegistry.get(sourceId);
      const target = elementRegistry.get(targetId);

      if (!source || !target) return false;

      return rules.allowed('connection.create', {
        source,
        target,
        connection: { type: 'bpmn:SequenceFlow' }
      });
    } catch {
      return false;
    }
  }

  // ==========================================
  // Element Movement & Layout
  // ==========================================

  /**
   * Move an element to a new position
   */
  moveElement(elementId: string, delta: { x: number; y: number }): void {
    if (!this.modeler) return;

    try {
      const modeling = this.modeler.get('modeling');
      const elementRegistry = this.modeler.get('elementRegistry');
      const element = elementRegistry.get(elementId);

      if (element) {
        modeling.moveElements([element], delta);
      }
    } catch (error) {
      console.error('Error moving element:', error);
    }
  }

  /**
   * Resize an element
   */
  resizeElement(elementId: string, newBounds: { x: number; y: number; width: number; height: number }): void {
    if (!this.modeler) return;

    try {
      const modeling = this.modeler.get('modeling');
      const elementRegistry = this.modeler.get('elementRegistry');
      const element = elementRegistry.get(elementId);

      if (element) {
        modeling.resizeShape(element, newBounds);
      }
    } catch (error) {
      console.error('Error resizing element:', error);
    }
  }

  /**
   * Get element bounds
   */
  getElementBounds(elementId: string): { x: number; y: number; width: number; height: number } | null {
    if (!this.modeler) return null;

    try {
      const elementRegistry = this.modeler.get('elementRegistry');
      const element = elementRegistry.get(elementId);

      if (element) {
        return {
          x: element.x,
          y: element.y,
          width: element.width,
          height: element.height
        };
      }
    } catch {
      // Element might not have bounds
    }

    return null;
  }

  // ==========================================
  // Selection Operations
  // ==========================================

  /**
   * Select an element by ID
   */
  selectElement(elementId: string): void {
    if (!this.modeler) return;

    try {
      const selection = this.modeler.get('selection');
      const elementRegistry = this.modeler.get('elementRegistry');
      const element = elementRegistry.get(elementId);

      if (element) {
        selection.select(element);
      }
    } catch (error) {
      console.error('Error selecting element:', error);
    }
  }

  /**
   * Clear selection
   */
  clearSelection(): void {
    if (!this.modeler) return;

    try {
      const selection = this.modeler.get('selection');
      selection.select([]);
    } catch (error) {
      console.error('Error clearing selection:', error);
    }
  }

  /**
   * Get all selected elements
   */
  getSelectedElements(): any[] {
    if (!this.modeler) return [];

    try {
      const selection = this.modeler.get('selection');
      return selection.get();
    } catch {
      return [];
    }
  }

  /**
   * Select multiple elements
   */
  selectElements(elementIds: string[]): void {
    if (!this.modeler) return;

    try {
      const selection = this.modeler.get('selection');
      const elementRegistry = this.modeler.get('elementRegistry');

      const elements = elementIds
        .map(id => elementRegistry.get(id))
        .filter(Boolean);

      selection.select(elements);
    } catch (error) {
      console.error('Error selecting elements:', error);
    }
  }

  // ==========================================
  // Canvas Operations
  // ==========================================

  /**
   * Get the center of the visible viewport
   */
  getViewportCenter(): { x: number; y: number } {
    if (!this.modeler) return { x: 400, y: 300 };

    try {
      const canvas = this.modeler.get('canvas');
      const viewbox = canvas.viewbox();

      return {
        x: viewbox.x + viewbox.width / 2,
        y: viewbox.y + viewbox.height / 2
      };
    } catch {
      return { x: 400, y: 300 };
    }
  }

  /**
   * Scroll canvas to element
   */
  scrollToElement(elementId: string): void {
    if (!this.modeler) return;

    try {
      const canvas = this.modeler.get('canvas');
      const elementRegistry = this.modeler.get('elementRegistry');
      const element = elementRegistry.get(elementId);

      if (element) {
        canvas.scrollToElement(element);
      }
    } catch (error) {
      console.error('Error scrolling to element:', error);
    }
  }

  /**
   * Get all elements of a specific type
   */
  getElementsByType(type: string): any[] {
    if (!this.modeler) return [];

    try {
      const elementRegistry = this.modeler.get('elementRegistry');
      return elementRegistry.filter((element: any) => element.type === type);
    } catch {
      return [];
    }
  }

  /**
   * Get all flow elements (tasks, events, gateways)
   */
  getAllFlowElements(): any[] {
    if (!this.modeler) return [];

    try {
      const elementRegistry = this.modeler.get('elementRegistry');
      return elementRegistry.filter((element: any) => {
        const type = element.type;
        return (
          type.includes('Task') ||
          type.includes('Event') ||
          type.includes('Gateway') ||
          type.includes('Activity') ||
          type.includes('SubProcess')
        );
      });
    } catch {
      return [];
    }
  }

  /**
   * Get all sequence flows
   */
  getAllSequenceFlows(): any[] {
    if (!this.modeler) return [];

    try {
      const elementRegistry = this.modeler.get('elementRegistry');
      return elementRegistry.filter((element: any) =>
        element.type === 'bpmn:SequenceFlow'
      );
    } catch {
      return [];
    }
  }
}
