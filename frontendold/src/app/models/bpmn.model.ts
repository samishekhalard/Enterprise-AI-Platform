// BPMN 2.0 Core Model Types

/**
 * BPMN Element Types following BPMN 2.0 specification
 */
export type BpmnElementType =
  | 'bpmn:Process'
  | 'bpmn:StartEvent'
  | 'bpmn:EndEvent'
  | 'bpmn:Task'
  | 'bpmn:UserTask'
  | 'bpmn:ServiceTask'
  | 'bpmn:ScriptTask'
  | 'bpmn:ManualTask'
  | 'bpmn:BusinessRuleTask'
  | 'bpmn:SendTask'
  | 'bpmn:ReceiveTask'
  | 'bpmn:ExclusiveGateway'
  | 'bpmn:ParallelGateway'
  | 'bpmn:InclusiveGateway'
  | 'bpmn:EventBasedGateway'
  | 'bpmn:ComplexGateway'
  | 'bpmn:IntermediateCatchEvent'
  | 'bpmn:IntermediateThrowEvent'
  | 'bpmn:BoundaryEvent'
  | 'bpmn:SubProcess'
  | 'bpmn:CallActivity'
  | 'bpmn:SequenceFlow'
  | 'bpmn:MessageFlow'
  | 'bpmn:DataStoreReference'
  | 'bpmn:DataObjectReference'
  | 'bpmn:Participant'
  | 'bpmn:Lane'
  | 'bpmn:TextAnnotation'
  | 'bpmn:Group';

/**
 * Selected BPMN element representation
 */
export interface BpmnElement {
  id: string;
  type: BpmnElementType | string;
  name?: string;
  businessObject: any; // bpmn-js business object reference
}

/**
 * Validation error for diagram elements
 */
export interface ValidationError {
  elementId: string;
  message: string;
  severity: 'error' | 'warning' | 'info';
}

/**
 * Process metadata for documentation
 */
export interface ProcessMetadata {
  id: string;
  name: string;
  description: string;
  version: string;
  owner: string;
  lastModified: Date;
  status: ProcessStatus;
}

export type ProcessStatus = 'draft' | 'review' | 'approved' | 'archived';

/**
 * BPMN file information
 */
export interface BpmnFileInfo {
  name: string;
  xml: string;
  metadata: ProcessMetadata;
}

/**
 * Export format options
 */
export type ExportFormat = 'bpmn' | 'svg' | 'png' | 'pdf';

/**
 * Toolbar action definition
 */
export interface ToolbarAction {
  id: string;
  label: string;
  icon: string;
  action: () => void;
  disabled?: boolean;
  separator?: boolean;
  tooltip?: string;
}

/**
 * Zoom level constraints
 */
export interface ZoomConfig {
  min: number;
  max: number;
  step: number;
  default: number;
}

export const DEFAULT_ZOOM_CONFIG: ZoomConfig = {
  min: 0.2,
  max: 4,
  step: 0.1,
  default: 1
};

/**
 * Canvas viewport state
 */
export interface ViewportState {
  x: number;
  y: number;
  scale: number;
}

/**
 * Modeler keyboard shortcuts
 */
export interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  action: string;
  description: string;
}

export const DEFAULT_SHORTCUTS: KeyboardShortcut[] = [
  { key: 'z', ctrl: true, action: 'undo', description: 'Undo' },
  { key: 'y', ctrl: true, action: 'redo', description: 'Redo' },
  { key: 'z', ctrl: true, shift: true, action: 'redo', description: 'Redo (Alt)' },
  { key: 's', ctrl: true, action: 'save', description: 'Save' },
  { key: 'o', ctrl: true, action: 'open', description: 'Open' },
  { key: 'n', ctrl: true, action: 'new', description: 'New Diagram' },
  { key: '+', ctrl: true, action: 'zoomIn', description: 'Zoom In' },
  { key: '-', ctrl: true, action: 'zoomOut', description: 'Zoom Out' },
  { key: '0', ctrl: true, action: 'zoomReset', description: 'Reset Zoom' },
  { key: '1', ctrl: true, action: 'zoomFit', description: 'Fit to View' },
  { key: 'Delete', action: 'delete', description: 'Delete Selected' },
  { key: 'Escape', action: 'deselect', description: 'Deselect All' }
];

/**
 * Generate unique ID for elements
 */
export function generateBpmnId(prefix: string = 'Element'): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Create empty process metadata
 */
export function createEmptyProcessMetadata(): ProcessMetadata {
  return {
    id: generateBpmnId('Process'),
    name: 'New Process',
    description: '',
    version: '1.0.0',
    owner: '',
    lastModified: new Date(),
    status: 'draft'
  };
}

/**
 * Default BPMN XML template for new diagrams
 */
export function getDefaultBpmnXml(processId?: string): string {
  const id = processId || generateBpmnId('Process');
  return `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL"
                  xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI"
                  xmlns:dc="http://www.omg.org/spec/DD/20100524/DC"
                  xmlns:di="http://www.omg.org/spec/DD/20100524/DI"
                  id="Definitions_${id}"
                  targetNamespace="http://bpmn.io/schema/bpmn">
  <bpmn:process id="${id}" isExecutable="false" name="New Process">
    <bpmn:startEvent id="StartEvent_1" name="Start">
      <bpmn:outgoing>Flow_1</bpmn:outgoing>
    </bpmn:startEvent>
    <bpmn:task id="Task_1" name="Task 1">
      <bpmn:incoming>Flow_1</bpmn:incoming>
      <bpmn:outgoing>Flow_2</bpmn:outgoing>
    </bpmn:task>
    <bpmn:endEvent id="EndEvent_1" name="End">
      <bpmn:incoming>Flow_2</bpmn:incoming>
    </bpmn:endEvent>
    <bpmn:sequenceFlow id="Flow_1" sourceRef="StartEvent_1" targetRef="Task_1" />
    <bpmn:sequenceFlow id="Flow_2" sourceRef="Task_1" targetRef="EndEvent_1" />
  </bpmn:process>
  <bpmndi:BPMNDiagram id="BPMNDiagram_1">
    <bpmndi:BPMNPlane id="BPMNPlane_1" bpmnElement="${id}">
      <bpmndi:BPMNShape id="StartEvent_1_di" bpmnElement="StartEvent_1">
        <dc:Bounds x="180" y="160" width="36" height="36" />
        <bpmndi:BPMNLabel>
          <dc:Bounds x="186" y="203" width="24" height="14" />
        </bpmndi:BPMNLabel>
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_1_di" bpmnElement="Task_1">
        <dc:Bounds x="280" y="138" width="100" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="EndEvent_1_di" bpmnElement="EndEvent_1">
        <dc:Bounds x="450" y="160" width="36" height="36" />
        <bpmndi:BPMNLabel>
          <dc:Bounds x="458" y="203" width="20" height="14" />
        </bpmndi:BPMNLabel>
      </bpmndi:BPMNShape>
      <bpmndi:BPMNEdge id="Flow_1_di" bpmnElement="Flow_1">
        <di:waypoint x="216" y="178" />
        <di:waypoint x="280" y="178" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="Flow_2_di" bpmnElement="Flow_2">
        <di:waypoint x="380" y="178" />
        <di:waypoint x="450" y="178" />
      </bpmndi:BPMNEdge>
    </bpmndi:BPMNPlane>
  </bpmndi:BPMNDiagram>
</bpmn:definitions>`;
}
