import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { BpmnModelerService } from '../../services/bpmn-modeler.service';
import { firstValueFrom } from 'rxjs';

interface PaletteItem {
  id: string;
  type: string;
  label: string;
  iconPath: string;
  category: 'tool' | 'element';
  expandable?: boolean;
  subItems?: SubItem[];
}

interface SubItem {
  type: string;
  label: string;
  iconPath: string;
  sectionHeader?: boolean; // If true, this is a section header (non-clickable)
}

interface PaletteSeparator {
  id: string;
  type: 'separator';
}

type PaletteEntry = PaletteItem | PaletteSeparator;

@Component({
  selector: 'app-bpmn-palette-docker',
  standalone: true,
  imports: [CommonModule],
  template: `
    <aside class="palette-dock">
      <div class="dock-items">
        @for (item of paletteItems; track item.id) {
          @if (isSeparator(item)) {
            <div class="dock-separator"></div>
          } @else {
            <div class="dock-item-wrapper"
                 (mouseenter)="onItemHover(item)"
                 (mouseleave)="onItemLeave()">
              <button
                class="dock-item"
                [class.active]="isToolActive(item)"
                [class.is-tool]="item.category === 'tool'"
                [attr.data-tooltip]="item.label"
                [attr.data-element-type]="item.type"
                [draggable]="item.category === 'element'"
                (dragstart)="onDragStart($event, item)"
                (dragend)="onDragEnd($event)"
                (click)="onItemClick(item)">
                <span class="dock-icon" [innerHTML]="getIcon(item.iconPath)"></span>
              </button>

              <!-- Hover Extension Panel -->
              @if (item.expandable && item.subItems && hoveredItem()?.id === item.id) {
                <div class="extension-panel" (mouseenter)="keepPanelOpen()" (mouseleave)="onItemLeave()">
                  <div class="extension-header">{{ getExtensionTitle(item) }}</div>
                  <div class="extension-items">
                    @for (subItem of item.subItems; track subItem.type + subItem.label) {
                      @if (subItem.sectionHeader) {
                        <div class="section-header">{{ subItem.label }}</div>
                      } @else {
                        <button
                          class="extension-item"
                          draggable="true"
                          (dragstart)="onSubItemDragStart($event, subItem)"
                          (dragend)="onDragEnd($event)"
                          (click)="onSubItemClick(subItem)">
                          <span class="extension-icon" [innerHTML]="getIcon(subItem.iconPath)"></span>
                          <span class="extension-label">{{ subItem.label }}</span>
                        </button>
                      }
                    }
                  </div>
                </div>
              }
            </div>
          }
        }
      </div>
    </aside>
  `,
  styleUrl: './bpmn-palette-docker.component.scss'
})
export class BpmnPaletteDockerComponent implements OnInit {
  private readonly modelerService = inject(BpmnModelerService);
  private readonly sanitizer = inject(DomSanitizer);
  private readonly http = inject(HttpClient);

  hoveredItem = signal<PaletteItem | null>(null);
  activeTool = signal<string | null>(null);
  private hoverTimeout: any;
  private iconCache = new Map<string, SafeHtml>();
  private rawIconCache = new Map<string, string>(); // Raw SVG strings for drag images

  // Base path for BPMN icons
  private readonly iconBasePath = 'assets/icons/bpmn';

  readonly paletteItems: PaletteEntry[] = [
    // Tools
    { id: 'hand', type: 'hand-tool', label: 'Hand Tool', iconPath: 'hand-tool.svg', category: 'tool' },
    { id: 'lasso', type: 'lasso-tool', label: 'Lasso Tool', iconPath: 'lasso-tool.svg', category: 'tool' },
    { id: 'space', type: 'space-tool', label: 'Space Tool', iconPath: 'space-tool.svg', category: 'tool' },
    { id: 'connect', type: 'global-connect', label: 'Connect', iconPath: 'connection.svg', category: 'tool' },
    { id: 'sep1', type: 'separator' },

    // Start Events
    {
      id: 'start-event',
      type: 'bpmn:StartEvent',
      label: 'Start Event',
      iconPath: 'start-event-none.svg',
      category: 'element',
      expandable: true,
      subItems: [
        { type: 'bpmn:StartEvent', label: 'None', iconPath: 'start-event-none.svg' },
        { type: 'bpmn:StartEvent:message', label: 'Message', iconPath: 'start-event-message.svg' },
        { type: 'bpmn:StartEvent:timer', label: 'Timer', iconPath: 'start-event-timer.svg' },
        { type: 'bpmn:StartEvent:signal', label: 'Signal', iconPath: 'start-event-signal.svg' },
        { type: 'bpmn:StartEvent:conditional', label: 'Conditional', iconPath: 'start-event-conditional.svg' },
        { type: 'bpmn:StartEvent:error', label: 'Error', iconPath: 'start-event-error.svg' },
        { type: 'bpmn:StartEvent:escalation', label: 'Escalation', iconPath: 'start-event-escalation.svg' },
        { type: 'bpmn:StartEvent:compensation', label: 'Compensation', iconPath: 'start-event-compensation.svg' },
        { type: 'bpmn:StartEvent:multiple', label: 'Multiple', iconPath: 'start-event-multiple.svg' },
        { type: 'bpmn:StartEvent:parallelMultiple', label: 'Parallel Multiple', iconPath: 'start-event-parallel-multiple.svg' }
      ]
    },

    // Intermediate Events
    {
      id: 'intermediate-event',
      type: 'bpmn:IntermediateThrowEvent',
      label: 'Intermediate Event',
      iconPath: 'intermediate-event-none.svg',
      category: 'element',
      expandable: true,
      subItems: [
        // Catch Events Section
        { type: 'section', label: 'CATCH EVENTS', iconPath: '', sectionHeader: true },
        { type: 'bpmn:IntermediateCatchEvent', label: 'None', iconPath: 'intermediate-event-none.svg' },
        { type: 'bpmn:IntermediateCatchEvent:message', label: 'Message', iconPath: 'intermediate-event-message.svg' },
        { type: 'bpmn:IntermediateCatchEvent:timer', label: 'Timer', iconPath: 'intermediate-event-timer.svg' },
        { type: 'bpmn:IntermediateCatchEvent:signal', label: 'Signal', iconPath: 'intermediate-event-signal.svg' },
        { type: 'bpmn:IntermediateCatchEvent:conditional', label: 'Conditional', iconPath: 'intermediate-event-conditional.svg' },
        { type: 'bpmn:IntermediateCatchEvent:link', label: 'Link', iconPath: 'intermediate-event-link.svg' },
        { type: 'bpmn:IntermediateCatchEvent:multiple', label: 'Multiple', iconPath: 'intermediate-event-multiple.svg' },
        { type: 'bpmn:IntermediateCatchEvent:parallelMultiple', label: 'Parallel Multiple', iconPath: 'intermediate-event-parallel-multiple.svg' },
        // Throw Events Section (filled symbols)
        { type: 'section', label: 'THROW EVENTS', iconPath: '', sectionHeader: true },
        { type: 'bpmn:IntermediateThrowEvent', label: 'None', iconPath: 'intermediate-event-none.svg' },
        { type: 'bpmn:IntermediateThrowEvent:message', label: 'Message', iconPath: 'intermediate-event-message-throw.svg' },
        { type: 'bpmn:IntermediateThrowEvent:signal', label: 'Signal', iconPath: 'intermediate-event-signal-throw.svg' },
        { type: 'bpmn:IntermediateThrowEvent:escalation', label: 'Escalation', iconPath: 'intermediate-event-escalation-throw.svg' },
        { type: 'bpmn:IntermediateThrowEvent:compensation', label: 'Compensation', iconPath: 'intermediate-event-compensation-throw.svg' },
        { type: 'bpmn:IntermediateThrowEvent:link', label: 'Link', iconPath: 'intermediate-event-link-throw.svg' },
        { type: 'bpmn:IntermediateThrowEvent:multiple', label: 'Multiple', iconPath: 'intermediate-event-multiple-throw.svg' }
      ]
    },

    // End Events
    {
      id: 'end-event',
      type: 'bpmn:EndEvent',
      label: 'End Event',
      iconPath: 'end-event-none.svg',
      category: 'element',
      expandable: true,
      subItems: [
        { type: 'bpmn:EndEvent', label: 'None', iconPath: 'end-event-none.svg' },
        { type: 'bpmn:EndEvent:message', label: 'Message', iconPath: 'end-event-message.svg' },
        { type: 'bpmn:EndEvent:error', label: 'Error', iconPath: 'end-event-error.svg' },
        { type: 'bpmn:EndEvent:escalation', label: 'Escalation', iconPath: 'end-event-escalation.svg' },
        { type: 'bpmn:EndEvent:cancel', label: 'Cancel', iconPath: 'end-event-cancel.svg' },
        { type: 'bpmn:EndEvent:compensation', label: 'Compensation', iconPath: 'end-event-compensation.svg' },
        { type: 'bpmn:EndEvent:signal', label: 'Signal', iconPath: 'end-event-signal.svg' },
        { type: 'bpmn:EndEvent:terminate', label: 'Terminate', iconPath: 'end-event-terminate.svg' },
        { type: 'bpmn:EndEvent:multiple', label: 'Multiple', iconPath: 'end-event-multiple.svg' }
      ]
    },

    // Boundary Events
    {
      id: 'boundary-event',
      type: 'bpmn:BoundaryEvent',
      label: 'Boundary Event',
      iconPath: 'boundary-event-interrupting-message.svg',
      category: 'element',
      expandable: true,
      subItems: [
        // Interrupting Section (solid circles)
        { type: 'section', label: 'INTERRUPTING', iconPath: '', sectionHeader: true },
        { type: 'bpmn:BoundaryEvent:message:interrupting', label: 'Message', iconPath: 'boundary-event-interrupting-message.svg' },
        { type: 'bpmn:BoundaryEvent:timer:interrupting', label: 'Timer', iconPath: 'boundary-event-interrupting-timer.svg' },
        { type: 'bpmn:BoundaryEvent:signal:interrupting', label: 'Signal', iconPath: 'boundary-event-interrupting-signal.svg' },
        { type: 'bpmn:BoundaryEvent:conditional:interrupting', label: 'Conditional', iconPath: 'boundary-event-interrupting-conditional.svg' },
        { type: 'bpmn:BoundaryEvent:error:interrupting', label: 'Error', iconPath: 'boundary-event-interrupting-error.svg' },
        { type: 'bpmn:BoundaryEvent:escalation:interrupting', label: 'Escalation', iconPath: 'boundary-event-interrupting-escalation.svg' },
        { type: 'bpmn:BoundaryEvent:cancel:interrupting', label: 'Cancel', iconPath: 'boundary-event-interrupting-cancel.svg' },
        { type: 'bpmn:BoundaryEvent:compensation:interrupting', label: 'Compensation', iconPath: 'boundary-event-interrupting-compensation.svg' },
        // Non-Interrupting Section (dashed circles)
        { type: 'section', label: 'NON-INTERRUPTING', iconPath: '', sectionHeader: true },
        { type: 'bpmn:BoundaryEvent:message:nonInterrupting', label: 'Message', iconPath: 'boundary-event-non-interrupting-message.svg' },
        { type: 'bpmn:BoundaryEvent:timer:nonInterrupting', label: 'Timer', iconPath: 'boundary-event-non-interrupting-timer.svg' },
        { type: 'bpmn:BoundaryEvent:signal:nonInterrupting', label: 'Signal', iconPath: 'boundary-event-non-interrupting-signal.svg' },
        { type: 'bpmn:BoundaryEvent:conditional:nonInterrupting', label: 'Conditional', iconPath: 'boundary-event-non-interrupting-conditional.svg' },
        { type: 'bpmn:BoundaryEvent:escalation:nonInterrupting', label: 'Escalation', iconPath: 'boundary-event-non-interrupting-escalation.svg' }
      ]
    },

    // Gateways
    {
      id: 'gateway',
      type: 'bpmn:ExclusiveGateway',
      label: 'Gateway',
      iconPath: 'gateway-none.svg',
      category: 'element',
      expandable: true,
      subItems: [
        { type: 'bpmn:ExclusiveGateway', label: 'Exclusive (XOR)', iconPath: 'gateway-xor.svg' },
        { type: 'bpmn:ParallelGateway', label: 'Parallel (AND)', iconPath: 'gateway-parallel.svg' },
        { type: 'bpmn:InclusiveGateway', label: 'Inclusive (OR)', iconPath: 'gateway-inclusive.svg' },
        { type: 'bpmn:EventBasedGateway', label: 'Event-based', iconPath: 'gateway-eventbased.svg' },
        { type: 'bpmn:ComplexGateway', label: 'Complex', iconPath: 'gateway-complex.svg' }
      ]
    },

    // Tasks
    {
      id: 'task',
      type: 'bpmn:Task',
      label: 'Task',
      iconPath: 'task-none.svg',
      category: 'element',
      expandable: true,
      subItems: [
        { type: 'bpmn:Task', label: 'Task', iconPath: 'task-none.svg' },
        { type: 'bpmn:UserTask', label: 'User Task', iconPath: 'task-user.svg' },
        { type: 'bpmn:ServiceTask', label: 'Service Task', iconPath: 'task-service.svg' },
        { type: 'bpmn:ScriptTask', label: 'Script Task', iconPath: 'task-script.svg' },
        { type: 'bpmn:SendTask', label: 'Send Task', iconPath: 'task-send.svg' },
        { type: 'bpmn:ReceiveTask', label: 'Receive Task', iconPath: 'task-receive.svg' },
        { type: 'bpmn:ManualTask', label: 'Manual Task', iconPath: 'task-manual.svg' },
        { type: 'bpmn:BusinessRuleTask', label: 'Business Rule', iconPath: 'task-business-rule.svg' }
      ]
    },

    // Sub Process & Call Activity
    {
      id: 'subprocess',
      type: 'bpmn:SubProcess',
      label: 'Sub Process',
      iconPath: 'subprocess-collapsed.svg',
      category: 'element',
      expandable: true,
      subItems: [
        { type: 'bpmn:SubProcess', label: 'Collapsed', iconPath: 'subprocess-collapsed.svg' },
        { type: 'bpmn:SubProcess:expanded', label: 'Expanded', iconPath: 'subprocess-expanded.svg' },
        { type: 'bpmn:Transaction', label: 'Transaction', iconPath: 'transaction.svg' },
        { type: 'bpmn:AdHocSubProcess', label: 'Ad-Hoc', iconPath: 'adhoc-subprocess.svg' },
        { type: 'bpmn:SubProcess:event', label: 'Event Sub Process', iconPath: 'event-subprocess.svg' },
        { type: 'bpmn:CallActivity', label: 'Call Activity', iconPath: 'call-activity.svg' }
      ]
    },
    { id: 'sep2', type: 'separator' },

    // Data
    {
      id: 'data',
      type: 'bpmn:DataObjectReference',
      label: 'Data',
      iconPath: 'data-object.svg',
      category: 'element',
      expandable: true,
      subItems: [
        { type: 'bpmn:DataObjectReference', label: 'Data Object', iconPath: 'data-object.svg' },
        { type: 'bpmn:DataStoreReference', label: 'Data Store', iconPath: 'data-store.svg' },
        { type: 'bpmn:DataInput', label: 'Data Input', iconPath: 'data-input.svg' },
        { type: 'bpmn:DataOutput', label: 'Data Output', iconPath: 'data-output.svg' }
      ]
    },
    { id: 'sep3', type: 'separator' },

    // Pool & Lane
    { id: 'participant', type: 'bpmn:Participant', label: 'Pool / Participant', iconPath: 'participant.svg', category: 'element' },
    { id: 'sep4', type: 'separator' },

    // Artifacts
    { id: 'annotation', type: 'bpmn:TextAnnotation', label: 'Text Annotation', iconPath: 'text-annotation.svg', category: 'element' },
    { id: 'group', type: 'bpmn:Group', label: 'Group', iconPath: 'group.svg', category: 'element' }
  ];

  async ngOnInit(): Promise<void> {
    // Preload all icons
    await this.preloadIcons();
  }

  private async preloadIcons(): Promise<void> {
    const iconPaths = new Set<string>();

    for (const item of this.paletteItems) {
      if (!this.isSeparator(item)) {
        iconPaths.add(item.iconPath);
        if (item.subItems) {
          for (const subItem of item.subItems) {
            iconPaths.add(subItem.iconPath);
          }
        }
      }
    }

    for (const path of iconPaths) {
      try {
        const fullPath = `${this.iconBasePath}/${path}`;
        const svg = await firstValueFrom(this.http.get(fullPath, { responseType: 'text' }));
        this.iconCache.set(path, this.sanitizer.bypassSecurityTrustHtml(svg));
        this.rawIconCache.set(path, svg); // Store raw SVG for drag images
      } catch (error) {
        console.warn(`Failed to load icon: ${path}`, error);
        // Fallback to a placeholder
        const fallbackSvg = '<svg viewBox="0 0 32 32"><rect x="4" y="4" width="24" height="24" fill="#eee" stroke="#ccc" stroke-width="2" rx="4"/></svg>';
        this.iconCache.set(path, this.sanitizer.bypassSecurityTrustHtml(fallbackSvg));
        this.rawIconCache.set(path, fallbackSvg);
      }
    }
  }

  getIcon(iconPath: string): SafeHtml {
    return this.iconCache.get(iconPath) || this.sanitizer.bypassSecurityTrustHtml(
      '<svg viewBox="0 0 32 32"><circle cx="16" cy="16" r="12" fill="#eee" stroke="#ccc" stroke-width="2"/></svg>'
    );
  }

  isSeparator(item: PaletteEntry): item is PaletteSeparator {
    return item.type === 'separator';
  }

  isToolActive(item: PaletteItem): boolean {
    return this.activeTool() === item.type;
  }

  getExtensionTitle(item: PaletteItem): string {
    const titles: Record<string, string> = {
      'start-event': 'Start Event Types',
      'intermediate-event': 'Intermediate Event Types',
      'end-event': 'End Event Types',
      'gateway': 'Gateway Types',
      'task': 'Task Types',
      'subprocess': 'Sub Process Types'
    };
    return titles[item.id] || `${item.label} Types`;
  }

  onItemHover(item: PaletteItem): void {
    if (this.hoverTimeout) {
      clearTimeout(this.hoverTimeout);
    }
    this.hoveredItem.set(item);
  }

  keepPanelOpen(): void {
    if (this.hoverTimeout) {
      clearTimeout(this.hoverTimeout);
    }
  }

  onItemLeave(): void {
    this.hoverTimeout = setTimeout(() => {
      this.hoveredItem.set(null);
    }, 150);
  }

  onItemClick(item: PaletteItem): void {
    if (item.category === 'tool') {
      this.handleToolClick(item);
    } else if (!item.expandable) {
      this.createElementAtCenter(item.type);
    }
  }

  onSubItemClick(subItem: SubItem): void {
    if (subItem.sectionHeader) return; // Don't do anything for section headers

    const elementInfo = this.parseElementType(subItem.type);
    this.createElementAtCenter(elementInfo.baseType, elementInfo.eventDefinition, elementInfo.cancelActivity);
    this.hoveredItem.set(null);
  }

  // Parse element type string to extract base type, event definition, and cancelActivity flag
  private parseElementType(typeString: string): { baseType: string; eventDefinition?: string; cancelActivity?: boolean } {
    const parts = typeString.split(':');

    // Base format: bpmn:ElementType[:eventDef[:interrupting/nonInterrupting]]
    const baseType = parts.slice(0, 2).join(':'); // e.g., bpmn:StartEvent

    // Event definition mapping
    const eventDefMap: Record<string, string> = {
      'message': 'bpmn:MessageEventDefinition',
      'timer': 'bpmn:TimerEventDefinition',
      'signal': 'bpmn:SignalEventDefinition',
      'conditional': 'bpmn:ConditionalEventDefinition',
      'error': 'bpmn:ErrorEventDefinition',
      'escalation': 'bpmn:EscalationEventDefinition',
      'cancel': 'bpmn:CancelEventDefinition',
      'compensation': 'bpmn:CompensateEventDefinition',
      'link': 'bpmn:LinkEventDefinition',
      'multiple': 'bpmn:MultipleEventDefinition',
      'parallelMultiple': 'bpmn:ParallelMultipleEventDefinition',
      'terminate': 'bpmn:TerminateEventDefinition'
    };

    let eventDefinition: string | undefined;
    let cancelActivity: boolean | undefined;

    if (parts.length > 2) {
      const eventDefKey = parts[2];
      eventDefinition = eventDefMap[eventDefKey];
    }

    if (parts.length > 3) {
      // interrupting = cancelActivity true, nonInterrupting = cancelActivity false
      cancelActivity = parts[3] === 'interrupting';
    }

    return { baseType, eventDefinition, cancelActivity };
  }

  private handleToolClick(item: PaletteItem): void {
    const modeler = this.modelerService.getModeler();
    if (!modeler) return;

    try {
      switch (item.type) {
        case 'hand-tool': {
          const handTool = modeler.get('handTool');
          handTool.activateHand();
          this.activeTool.set('hand-tool');
          break;
        }
        case 'lasso-tool': {
          const lassoTool = modeler.get('lassoTool');
          lassoTool.activateSelection();
          this.activeTool.set('lasso-tool');
          break;
        }
        case 'space-tool': {
          const spaceTool = modeler.get('spaceTool');
          spaceTool.activateSelection();
          this.activeTool.set('space-tool');
          break;
        }
        case 'global-connect': {
          const globalConnect = modeler.get('globalConnect');
          globalConnect.start();
          this.activeTool.set('global-connect');
          break;
        }
      }
    } catch (error) {
      console.warn('Tool activation failed:', error);
    }
  }

  private createElementAtCenter(type: string, eventDefinition?: string, cancelActivity?: boolean): void {
    const modeler = this.modelerService.getModeler();
    if (!modeler) return;

    try {
      const create = modeler.get('create');
      const elementFactory = modeler.get('elementFactory');

      // Build shape options
      const shapeOptions: any = { type };

      // Add event definition if specified
      if (eventDefinition) {
        shapeOptions.eventDefinitionType = eventDefinition;
      }

      // Add cancelActivity for boundary events (interrupting = true, non-interrupting = false)
      if (cancelActivity !== undefined) {
        shapeOptions.cancelActivity = cancelActivity;
      }

      const shape = elementFactory.createShape(shapeOptions);
      create.start(null as any, shape);
    } catch (error) {
      console.warn('Could not start create action:', error);
    }
  }

  // Track drag image element for cleanup
  private currentDragImage: HTMLElement | null = null;

  onDragStart(event: DragEvent, item: PaletteItem): void {
    if (item.category === 'tool' || !event.dataTransfer) return;

    event.dataTransfer.setData('application/bpmn-element', JSON.stringify({
      type: item.type,
      label: item.label
    }));
    event.dataTransfer.effectAllowed = 'copy';

    const dragImage = this.createDragImage(item.iconPath);
    this.currentDragImage = dragImage;
    document.body.appendChild(dragImage);
    event.dataTransfer.setDragImage(dragImage, 25, 25);
  }

  onSubItemDragStart(event: DragEvent, subItem: SubItem): void {
    if (!event.dataTransfer || subItem.sectionHeader) return;

    const elementInfo = this.parseElementType(subItem.type);

    event.dataTransfer.setData('application/bpmn-element', JSON.stringify({
      type: elementInfo.baseType,
      label: subItem.label,
      eventDefinition: elementInfo.eventDefinition,
      cancelActivity: elementInfo.cancelActivity
    }));
    event.dataTransfer.effectAllowed = 'copy';

    const dragImage = this.createDragImage(subItem.iconPath);
    this.currentDragImage = dragImage;
    document.body.appendChild(dragImage);
    event.dataTransfer.setDragImage(dragImage, 25, 25);

    this.hoveredItem.set(null);
  }

  onDragEnd(_event: DragEvent): void {
    // Clean up drag image after drag operation completes
    if (this.currentDragImage && this.currentDragImage.parentNode) {
      this.currentDragImage.parentNode.removeChild(this.currentDragImage);
      this.currentDragImage = null;
    }
  }

  private createDragImage(iconPath: string): HTMLElement {
    const container = document.createElement('div');

    // Get raw SVG from cache or use fallback
    const rawSvg = this.rawIconCache.get(iconPath);
    const iconHtml = rawSvg || this.getFallbackIcon();

    container.innerHTML = iconHtml;

    // Style the container - TRANSPARENT background, no border
    container.style.cssText = `
      position: fixed;
      top: -200px;
      left: -200px;
      width: 50px;
      height: 50px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: transparent;
      border: none;
      box-shadow: none;
      pointer-events: none;
      z-index: 10000;
    `;

    // Style the SVG inside
    const svg = container.querySelector('svg');
    if (svg) {
      svg.style.width = '40px';
      svg.style.height = '40px';
      svg.style.display = 'block';
    }

    return container;
  }

  // Fallback icon when cache is empty
  private getFallbackIcon(): string {
    return `<svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="4" y="4" width="24" height="24" rx="4" fill="#F5F5F5" stroke="#BDBDBD" stroke-width="2"/>
      <circle cx="16" cy="14" r="4" fill="#BDBDBD"/>
      <path d="M8 26c0-4 4-6 8-6s8 2 8 6" fill="#BDBDBD"/>
    </svg>`;
  }
}
