import {
  Component,
  ElementRef,
  ViewChild,
  AfterViewInit,
  OnDestroy,
  inject,
  HostListener,
  ViewEncapsulation,
  effect
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BpmnModelerService } from '../../services/bpmn-modeler.service';
import { BpmnElementRegistryService } from '../../services/bpmn-element-registry.service';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-bpmn-canvas',
  standalone: true,
  imports: [CommonModule, FormsModule],
  encapsulation: ViewEncapsulation.None,
  templateUrl: './bpmn-canvas.component.html',
  styleUrl: './bpmn-canvas.component.scss'
})
export class BpmnCanvasComponent implements AfterViewInit, OnDestroy {
  @ViewChild('canvasContainer', { static: true })
  canvasContainer!: ElementRef<HTMLDivElement>;

  readonly modelerService = inject(BpmnModelerService);
  private readonly elementRegistry = inject(BpmnElementRegistryService);

  private resizeObserver: ResizeObserver | null = null;

  showMinimap = false; // Default off, user can toggle on
  showShortcutsHelp = false;

  constructor() {
    // React to grid dots toggle from service
    effect(() => {
      const show = this.modelerService.showGridDots();
      this.updateDotsVisibility(show);
    });
  }
  hoveredElement: { type: string; name: string } | null = null;
  tooltipX = 0;
  tooltipY = 0;
  showTooltip = false;

  // Tooltip delay timer
  private tooltipTimer: ReturnType<typeof setTimeout> | null = null;
  private readonly TOOLTIP_DELAY = 800; // ms before showing tooltip
  private lastMousePosition = { x: 0, y: 0 };

  // Context menu state
  showContextMenu = false;
  contextMenuX = 0;
  contextMenuY = 0;
  contextMenuElement: any = null;
  canPaste = false;
  private clickPosition = { x: 0, y: 0 };

  // Palette submenu state
  showPaletteSubmenu = false;
  paletteSubmenuX = 0;
  paletteSubmenuY = 0;
  paletteSubmenuItems: Array<{ type: string; label: string; icon?: string }> = [];
  private paletteSubmenuCategory = '';

  // Enhanced context menu state
  showChangeTypeDropdown = false;
  showAppendDropdown = false;
  changeTypeSearchQuery = '';
  appendSearchQuery = '';
  filteredChangeTypeOptions: Array<{ type: string; label: string; eventDefinition?: string }> = [];
  filteredAppendCategories: Array<{ name: string; items: Array<{ type: string; label: string }> }> = [];

  // All appendable element categories
  private readonly appendCategories: Array<{ name: string; items: Array<{ type: string; label: string }> }> = [
    {
      name: 'Tasks',
      items: [
        { type: 'bpmn:Task', label: 'Task' },
        { type: 'bpmn:UserTask', label: 'User Task' },
        { type: 'bpmn:ServiceTask', label: 'Service Task' },
        { type: 'bpmn:ScriptTask', label: 'Script Task' },
        { type: 'bpmn:BusinessRuleTask', label: 'Business Rule Task' },
        { type: 'bpmn:SendTask', label: 'Send Task' },
        { type: 'bpmn:ReceiveTask', label: 'Receive Task' },
        { type: 'bpmn:ManualTask', label: 'Manual Task' },
        { type: 'bpmn:CallActivity', label: 'Call Activity' },
        { type: 'bpmn:SubProcess', label: 'Sub Process' }
      ]
    },
    {
      name: 'Gateways',
      items: [
        { type: 'bpmn:ExclusiveGateway', label: 'Exclusive Gateway (XOR)' },
        { type: 'bpmn:ParallelGateway', label: 'Parallel Gateway (AND)' },
        { type: 'bpmn:InclusiveGateway', label: 'Inclusive Gateway (OR)' },
        { type: 'bpmn:EventBasedGateway', label: 'Event-based Gateway' },
        { type: 'bpmn:ComplexGateway', label: 'Complex Gateway' }
      ]
    },
    {
      name: 'Events',
      items: [
        { type: 'bpmn:IntermediateThrowEvent', label: 'Intermediate Throw Event' },
        { type: 'bpmn:IntermediateCatchEvent', label: 'Intermediate Catch Event' },
        { type: 'bpmn:EndEvent', label: 'End Event' },
        { type: 'bpmn:StartEvent', label: 'Start Event' }
      ]
    },
    {
      name: 'Data & Artifacts',
      items: [
        { type: 'bpmn:DataObjectReference', label: 'Data Object' },
        { type: 'bpmn:DataStoreReference', label: 'Data Store' },
        { type: 'bpmn:TextAnnotation', label: 'Text Annotation' }
      ]
    }
  ];

  // Element type options for palette submenu
  private readonly elementTypeOptions: Record<string, Array<{ type: string; label: string }>> = {
    'task': [
      { type: 'bpmn:Task', label: 'Task' },
      { type: 'bpmn:UserTask', label: 'User Task' },
      { type: 'bpmn:ServiceTask', label: 'Service Task' },
      { type: 'bpmn:ScriptTask', label: 'Script Task' },
      { type: 'bpmn:BusinessRuleTask', label: 'Business Rule Task' },
      { type: 'bpmn:SendTask', label: 'Send Task' },
      { type: 'bpmn:ReceiveTask', label: 'Receive Task' },
      { type: 'bpmn:ManualTask', label: 'Manual Task' },
      { type: 'bpmn:CallActivity', label: 'Call Activity' }
    ],
    'subprocess': [
      { type: 'bpmn:SubProcess', label: 'Sub Process' },
      { type: 'bpmn:SubProcess', label: 'Expanded Sub Process' },
      { type: 'bpmn:Transaction', label: 'Transaction' },
      { type: 'bpmn:AdHocSubProcess', label: 'Ad-Hoc Sub Process' }
    ],
    'start-event': [
      { type: 'bpmn:StartEvent', label: 'Start Event' },
      { type: 'bpmn:StartEvent:MessageEventDefinition', label: 'Message Start' },
      { type: 'bpmn:StartEvent:TimerEventDefinition', label: 'Timer Start' },
      { type: 'bpmn:StartEvent:ConditionalEventDefinition', label: 'Conditional Start' },
      { type: 'bpmn:StartEvent:SignalEventDefinition', label: 'Signal Start' }
    ],
    'intermediate-event': [
      { type: 'bpmn:IntermediateThrowEvent', label: 'Intermediate Throw' },
      { type: 'bpmn:IntermediateCatchEvent', label: 'Intermediate Catch' },
      { type: 'bpmn:IntermediateThrowEvent:MessageEventDefinition', label: 'Message Throw' },
      { type: 'bpmn:IntermediateCatchEvent:MessageEventDefinition', label: 'Message Catch' },
      { type: 'bpmn:IntermediateCatchEvent:TimerEventDefinition', label: 'Timer Catch' },
      { type: 'bpmn:IntermediateThrowEvent:SignalEventDefinition', label: 'Signal Throw' },
      { type: 'bpmn:IntermediateCatchEvent:SignalEventDefinition', label: 'Signal Catch' }
    ],
    'end-event': [
      { type: 'bpmn:EndEvent', label: 'End Event' },
      { type: 'bpmn:EndEvent:MessageEventDefinition', label: 'Message End' },
      { type: 'bpmn:EndEvent:ErrorEventDefinition', label: 'Error End' },
      { type: 'bpmn:EndEvent:TerminateEventDefinition', label: 'Terminate End' },
      { type: 'bpmn:EndEvent:SignalEventDefinition', label: 'Signal End' }
    ],
    'gateway': [
      { type: 'bpmn:ExclusiveGateway', label: 'Exclusive Gateway (XOR)' },
      { type: 'bpmn:ParallelGateway', label: 'Parallel Gateway (AND)' },
      { type: 'bpmn:InclusiveGateway', label: 'Inclusive Gateway (OR)' },
      { type: 'bpmn:EventBasedGateway', label: 'Event-based Gateway' },
      { type: 'bpmn:ComplexGateway', label: 'Complex Gateway' }
    ],
    'data': [
      { type: 'bpmn:DataObjectReference', label: 'Data Object' },
      { type: 'bpmn:DataStoreReference', label: 'Data Store' },
      { type: 'bpmn:DataInput', label: 'Data Input' },
      { type: 'bpmn:DataOutput', label: 'Data Output' }
    ],
    'participant': [
      { type: 'bpmn:Participant', label: 'Pool' },
      { type: 'bpmn:Participant:expanded', label: 'Expanded Pool' }
    ]
  };

  @HostListener('document:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent): void {
    // Hide tooltip on any keyboard activity
    this.hideTooltip();

    // Show shortcuts help with ?
    if (event.key === '?' && !event.ctrlKey && !event.metaKey) {
      this.showShortcutsHelp = true;
      event.preventDefault();
    }

    // Close shortcuts with Escape
    if (event.key === 'Escape' && this.showShortcutsHelp) {
      this.showShortcutsHelp = false;
      event.preventDefault();
    }

    // Custom keyboard shortcuts
    if (event.ctrlKey || event.metaKey) {
      switch (event.key) {
        case 's':
          event.preventDefault();
          this.modelerService.saveDiagram();
          break;
        case '0':
          event.preventDefault();
          this.modelerService.zoomReset();
          break;
        case '1':
          event.preventDefault();
          this.modelerService.zoomFit();
          break;
      }
    }
  }

  // Hide tooltip and clear any pending timer
  private hideTooltip(): void {
    this.showTooltip = false;
    if (this.tooltipTimer) {
      clearTimeout(this.tooltipTimer);
      this.tooltipTimer = null;
    }
  }

  // Start tooltip timer - only show after delay if mouse stays still
  private startTooltipTimer(): void {
    this.hideTooltip();
    this.tooltipTimer = setTimeout(() => {
      if (this.hoveredElement) {
        this.showTooltip = true;
      }
    }, this.TOOLTIP_DELAY);
  }

  ngAfterViewInit(): void {
    // Load element types first (applies CSS variables), then initialize modeler
    this.loadElementTypesAndInitialize();
    this.setupResizeObserver();
  }

  private async loadElementTypesAndInitialize(): Promise<void> {
    try {
      // Load element types from backend - this applies CSS variables to document root
      await firstValueFrom(this.elementRegistry.getElementTypes());
      console.log('BPMN element types loaded, CSS variables applied');
    } catch (error) {
      console.warn('Failed to load element types from API, using fallback colors:', error);
    }
    // Initialize modeler after CSS variables are applied
    this.initializeModeler();
  }

  ngOnDestroy(): void {
    this.cleanup();
  }

  private async initializeModeler(): Promise<void> {
    try {
      // Dynamic imports for all modules
      const [
        BpmnModeler,
        MinimapModule,
        PropertiesPanelModule,
        CamundaModdle
      ] = await Promise.all([
        import('bpmn-js/lib/Modeler'),
        import('diagram-js-minimap').catch(() => ({ default: null })),
        import('bpmn-js-properties-panel').catch(() => ({ BpmnPropertiesPanelModule: null, BpmnPropertiesProviderModule: null })),
        import('camunda-bpmn-moddle/resources/camunda').catch(() => ({ default: null }))
      ]);

      const Modeler = BpmnModeler.default;

      // Build additional modules array
      const additionalModules: any[] = [];

      // Add minimap if available
      if (MinimapModule.default) {
        additionalModules.push(MinimapModule.default);
      }

      // Add properties panel modules if available
      if (PropertiesPanelModule.BpmnPropertiesPanelModule) {
        additionalModules.push(PropertiesPanelModule.BpmnPropertiesPanelModule);
      }
      if (PropertiesPanelModule.BpmnPropertiesProviderModule) {
        additionalModules.push(PropertiesPanelModule.BpmnPropertiesProviderModule);
      }

      // Build moddleExtensions for Camunda
      const moddleExtensions: Record<string, any> = {};
      if (CamundaModdle.default) {
        moddleExtensions['camunda'] = CamundaModdle.default;
      }

      const modeler = new Modeler({
        container: this.canvasContainer.nativeElement,
        keyboard: {
          bindTo: document
        },
        additionalModules,
        moddleExtensions,
        // Enable move canvas with space key
        moveCanvas: {
          enabled: true
        }
      });

      // Setup element hover events for tooltips
      this.setupHoverEvents(modeler);

      // Setup palette click handler for submenus
      this.setupPaletteClickHandler(modeler);

      this.modelerService.setModeler(modeler);
      await this.modelerService.createNewDiagram();

      // Initialize minimap visibility (default off)
      if (this.showMinimap) {
        this.updateMinimapVisibility(modeler);
      } else {
        this.hideMinimapElement();
      }

    } catch (error) {
      console.error('Error initializing BPMN modeler:', error);
    }
  }

  private setupHoverEvents(modeler: any): void {
    try {
      const eventBus = modeler.get('eventBus');
      const selection = modeler.get('selection');

      // Add data-element-type attribute for CSS styling
      this.setupElementTypeAttributes(modeler);

      eventBus.on('element.hover', (e: any) => {
        if (e.element && e.element.type && !e.element.type.startsWith('bpmndi:')) {
          // Don't show tooltip if element is selected
          const selectedElements = selection.get();
          const isSelected = selectedElements.some((sel: any) => sel.id === e.element.id);
          if (isSelected) {
            this.hideTooltip();
            return;
          }

          const businessObject = e.element.businessObject;
          this.hoveredElement = {
            type: this.formatType(e.element.type),
            name: businessObject?.name || ''
          };
          // Start timer - tooltip will appear after delay if mouse stays still
          this.startTooltipTimer();
        }
      });

      eventBus.on('element.out', () => {
        this.hoveredElement = null;
        this.hideTooltip();
      });

      // Hide tooltip when selection changes
      eventBus.on('selection.changed', () => {
        this.hideTooltip();
      });

      // Track mouse position and hide tooltip on movement
      this.canvasContainer.nativeElement.addEventListener('mousemove', (e: MouseEvent) => {
        const dx = Math.abs(e.clientX - this.lastMousePosition.x);
        const dy = Math.abs(e.clientY - this.lastMousePosition.y);

        // If mouse moved significantly, hide tooltip and restart timer
        if (dx > 3 || dy > 3) {
          this.hideTooltip();
          // Restart timer for new position
          if (this.hoveredElement) {
            this.startTooltipTimer();
          }
        }

        // Update position
        this.tooltipX = e.clientX + 15;
        this.tooltipY = e.clientY + 15;
        this.lastMousePosition = { x: e.clientX, y: e.clientY };
      });

      // Hide tooltip on canvas scroll/drag
      eventBus.on('canvas.viewbox.changing', () => {
        this.hideTooltip();
      });
    } catch (error) {
      console.warn('Could not setup hover events:', error);
    }
  }

  formatType(type: string): string {
    return type.replace('bpmn:', '').replace(/([A-Z])/g, ' $1').trim();
  }

  toggleMinimap(): void {
    this.showMinimap = !this.showMinimap;
    const modeler = this.modelerService.getModeler();
    if (modeler) {
      this.updateMinimapVisibility(modeler);
    }
  }

  private updateMinimapVisibility(modeler: any): void {
    try {
      const minimap = modeler.get('minimap');
      if (minimap) {
        if (this.showMinimap) {
          minimap.open();
          // Move and style the minimap after it opens
          this.setupMinimapPosition();
        } else {
          minimap.close();
          // Explicitly hide the minimap element to ensure it's hidden
          // (bpmn-js class toggle may not work after DOM relocation)
          this.hideMinimapElement();
        }
      }
    } catch {
      // Minimap might not be available
    }
  }

  /**
   * Explicitly hide the minimap element
   * This is needed because after moving the minimap to canvas-container,
   * the bpmn-js minimap.close() may not properly toggle visibility
   */
  private hideMinimapElement(): void {
    setTimeout(() => {
      const minimapEl = document.querySelector('.djs-minimap') as HTMLElement;
      if (minimapEl) {
        minimapEl.style.setProperty('display', 'none', 'important');
        minimapEl.classList.remove('open');
      }
    }, 0);
  }

  /**
   * Move minimap to canvas-container and position it above the floating controls
   * bpmn-js creates the minimap inside .djs-container which has different bounds
   * Moving it to .canvas-container allows proper positioning relative to the UI
   */
  private setupMinimapPosition(): void {
    setTimeout(() => {
      const minimapEl = document.querySelector('.djs-minimap') as HTMLElement;
      const canvasContainer = this.canvasContainer.nativeElement.closest('.canvas-container');

      if (minimapEl && canvasContainer && minimapEl.parentElement !== canvasContainer) {
        // Move minimap to canvas-container for proper positioning
        canvasContainer.appendChild(minimapEl);
      }

      if (minimapEl) {
        // Explicitly show the minimap (ensure display is set)
        minimapEl.style.setProperty('display', 'block', 'important');
        minimapEl.classList.add('open');

        // Position above the Minimap/Grid floating controls (bottom: 24px + control height ~50px = 80px)
        minimapEl.style.setProperty('position', 'absolute', 'important');
        minimapEl.style.setProperty('bottom', '80px', 'important');
        minimapEl.style.setProperty('right', '24px', 'important');
        minimapEl.style.setProperty('top', 'auto', 'important');
        minimapEl.style.setProperty('left', 'auto', 'important');
        minimapEl.style.setProperty('z-index', '25', 'important');
        minimapEl.style.setProperty('width', '200px', 'important');
        minimapEl.style.setProperty('height', '140px', 'important');
        minimapEl.style.setProperty('background', 'white', 'important');
        minimapEl.style.setProperty('border-radius', '12px', 'important');
        minimapEl.style.setProperty('box-shadow', '0 4px 20px rgba(0,0,0,0.12)', 'important');
        minimapEl.style.setProperty('overflow', 'hidden', 'important');

        // Hide the close toggle button
        const toggle = minimapEl.querySelector('.toggle') as HTMLElement;
        if (toggle) {
          toggle.style.display = 'none';
        }
      }
    }, 100);
  }

  private updateDotsVisibility(show: boolean): void {
    // Dots are CSS-based, toggle class on wrapper (parent of container)
    const wrapper = this.canvasContainer?.nativeElement?.closest('.bpmn-canvas-wrapper');
    if (wrapper) {
      if (show) {
        wrapper.classList.add('show-dots');
      } else {
        wrapper.classList.remove('show-dots');
      }
    }
  }

  private setupResizeObserver(): void {
    this.resizeObserver = new ResizeObserver(() => {
      const modeler = this.modelerService.getModeler();
      if (modeler) {
        try {
          const canvas = modeler.get('canvas');
          canvas?.resized();
        } catch {
          // Canvas might not be ready yet
        }
      }
    });

    this.resizeObserver.observe(this.canvasContainer.nativeElement);
  }

  private cleanup(): void {
    // Clear tooltip timer
    this.hideTooltip();

    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }

    const modeler = this.modelerService.getModeler();
    if (modeler) {
      try {
        modeler.destroy();
      } catch {
        // Modeler might already be destroyed
      }
    }
  }

  // Context Menu Methods
  onContextMenu(event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();

    const modeler = this.modelerService.getModeler();
    if (!modeler) return;

    // Store click position for adding elements
    this.clickPosition = { x: event.clientX, y: event.clientY };

    // Get element at click position
    try {
      const canvas = modeler.get('canvas');
      const elementRegistry = modeler.get('elementRegistry');
      const selection = modeler.get('selection');

      // Convert screen coordinates to canvas coordinates
      const viewbox = canvas.viewbox();
      const canvasX = (event.offsetX / canvas._container.clientWidth) * viewbox.width + viewbox.x;
      const canvasY = (event.offsetY / canvas._container.clientHeight) * viewbox.height + viewbox.y;

      // First check if there's already a selected element
      const currentSelection = selection.get();
      if (currentSelection && currentSelection.length > 0) {
        this.contextMenuElement = currentSelection[0];
      } else {
        // Find element at position
        let clickedElement = null;
        const elements = elementRegistry.getAll();

        // Check shapes first (have bounding boxes)
        for (const element of elements) {
          if (element.type.startsWith('bpmndi:') || element.type === 'bpmn:Process') continue;

          // Skip connections for bounding box check
          if (element.type === 'bpmn:SequenceFlow' || element.waypoints) continue;

          const { x, y, width, height } = element;
          if (x !== undefined && width !== undefined) {
            if (canvasX >= x && canvasX <= x + width && canvasY >= y && canvasY <= y + height) {
              clickedElement = element;
              break;
            }
          }
        }

        // If no shape found, check connections (sequence flows)
        if (!clickedElement) {
          for (const element of elements) {
            if (element.type !== 'bpmn:SequenceFlow' || !element.waypoints) continue;

            // Check if click is near the connection line
            const waypoints = element.waypoints;
            for (let i = 0; i < waypoints.length - 1; i++) {
              const p1 = waypoints[i];
              const p2 = waypoints[i + 1];

              // Calculate distance from point to line segment
              const dist = this.distanceToLineSegment(canvasX, canvasY, p1.x, p1.y, p2.x, p2.y);
              if (dist < 15) { // 15px tolerance for clicking on lines
                clickedElement = element;
                break;
              }
            }
            if (clickedElement) break;
          }
        }

        this.contextMenuElement = clickedElement;

        // If clicked on element, select it
        if (clickedElement) {
          selection.select(clickedElement);
        }
      }
    } catch (error) {
      console.warn('Could not detect element at click position:', error);
      this.contextMenuElement = null;
    }

    // Position the context menu
    this.contextMenuX = event.clientX;
    this.contextMenuY = event.clientY;

    // Ensure menu stays within viewport
    setTimeout(() => {
      const menu = document.querySelector('.context-menu') as HTMLElement;
      if (menu) {
        const rect = menu.getBoundingClientRect();
        if (rect.right > window.innerWidth) {
          this.contextMenuX = event.clientX - rect.width;
        }
        if (rect.bottom > window.innerHeight) {
          this.contextMenuY = event.clientY - rect.height;
        }
      }
    });

    this.showContextMenu = true;
  }

  closeContextMenu(): void {
    this.showContextMenu = false;
    this.contextMenuElement = null;
    this.showChangeTypeDropdown = false;
    this.showAppendDropdown = false;
    this.changeTypeSearchQuery = '';
    this.appendSearchQuery = '';
  }

  // Toggle change type dropdown
  toggleChangeTypeDropdown(event: Event): void {
    event.stopPropagation();
    this.showAppendDropdown = false;
    this.showChangeTypeDropdown = !this.showChangeTypeDropdown;
    if (this.showChangeTypeDropdown) {
      this.filteredChangeTypeOptions = this.getTypeChangeOptions(this.contextMenuElement?.type || '');
      this.changeTypeSearchQuery = '';
    }
  }

  // Filter change type options based on search
  filterChangeTypeOptions(): void {
    const query = this.changeTypeSearchQuery.toLowerCase();
    const allOptions = this.getTypeChangeOptions(this.contextMenuElement?.type || '');
    this.filteredChangeTypeOptions = allOptions.filter(opt =>
      opt.label.toLowerCase().includes(query)
    );
  }

  // Toggle append element dropdown
  toggleAppendDropdown(event: Event): void {
    event.stopPropagation();
    this.showChangeTypeDropdown = false;
    this.showAppendDropdown = !this.showAppendDropdown;
    if (this.showAppendDropdown) {
      this.filteredAppendCategories = [...this.appendCategories];
      this.appendSearchQuery = '';
    }
  }

  // Filter append options based on search
  filterAppendOptions(): void {
    const query = this.appendSearchQuery.toLowerCase();
    if (!query) {
      this.filteredAppendCategories = [...this.appendCategories];
      return;
    }
    this.filteredAppendCategories = this.appendCategories
      .map(cat => ({
        name: cat.name,
        items: cat.items.filter(item =>
          item.label.toLowerCase().includes(query)
        )
      }))
      .filter(cat => cat.items.length > 0);
  }

  // Get color class for element type
  getColorClassForType(type: string): string {
    if (type.includes('StartEvent')) return 'start';
    if (type.includes('EndEvent')) return 'end';
    if (type.includes('Intermediate') || type.includes('Boundary')) return 'intermediate';
    if (type.includes('Task') || type.includes('Activity') || type.includes('SubProcess')) return 'task';
    if (type.includes('Gateway')) return 'gateway';
    if (type.includes('Data')) return 'data';
    if (type.includes('Participant')) return 'participant';
    return 'default';
  }

  // Get BPMN icon path for element type
  getIconForType(type: string): string {
    const iconMap: Record<string, string> = {
      // Tasks
      'bpmn:Task': 'assets/icons/bpmn/task-none.svg',
      'bpmn:UserTask': 'assets/icons/bpmn/task-user.svg',
      'bpmn:ServiceTask': 'assets/icons/bpmn/task-service.svg',
      'bpmn:ScriptTask': 'assets/icons/bpmn/task-script.svg',
      'bpmn:SendTask': 'assets/icons/bpmn/task-send.svg',
      'bpmn:ReceiveTask': 'assets/icons/bpmn/task-receive.svg',
      'bpmn:ManualTask': 'assets/icons/bpmn/task-manual.svg',
      'bpmn:BusinessRuleTask': 'assets/icons/bpmn/task-business-rule.svg',
      'bpmn:CallActivity': 'assets/icons/bpmn/call-activity.svg',
      'bpmn:SubProcess': 'assets/icons/bpmn/subprocess-expanded.svg',
      'bpmn:Transaction': 'assets/icons/bpmn/transaction.svg',
      'bpmn:AdHocSubProcess': 'assets/icons/bpmn/adhoc-subprocess.svg',
      // Gateways
      'bpmn:ExclusiveGateway': 'assets/icons/bpmn/gateway-xor.svg',
      'bpmn:ParallelGateway': 'assets/icons/bpmn/gateway-parallel.svg',
      'bpmn:InclusiveGateway': 'assets/icons/bpmn/gateway-inclusive.svg',
      'bpmn:EventBasedGateway': 'assets/icons/bpmn/gateway-eventbased.svg',
      'bpmn:ComplexGateway': 'assets/icons/bpmn/gateway-complex.svg',
      // Events
      'bpmn:StartEvent': 'assets/icons/bpmn/start-event-none.svg',
      'bpmn:EndEvent': 'assets/icons/bpmn/end-event-none.svg',
      'bpmn:IntermediateThrowEvent': 'assets/icons/bpmn/intermediate-event-none.svg',
      'bpmn:IntermediateCatchEvent': 'assets/icons/bpmn/intermediate-event-none.svg',
      'bpmn:BoundaryEvent': 'assets/icons/bpmn/intermediate-event-none.svg',
      // Data & Artifacts
      'bpmn:DataObjectReference': 'assets/icons/bpmn/data-object.svg',
      'bpmn:DataStoreReference': 'assets/icons/bpmn/data-store.svg',
      'bpmn:DataInputAssociation': 'assets/icons/bpmn/data-input.svg',
      'bpmn:DataOutputAssociation': 'assets/icons/bpmn/data-output.svg',
      'bpmn:TextAnnotation': 'assets/icons/bpmn/text-annotation.svg',
      // Pools & Lanes
      'bpmn:Participant': 'assets/icons/bpmn/participant.svg',
      'bpmn:Lane': 'assets/icons/bpmn/participant.svg'
    };
    return iconMap[type] || 'assets/icons/bpmn/task-none.svg';
  }

  // Get BPMN icon path for element type with event definition support
  getIconForTypeWithDefinition(type: string, eventDefinition?: string): string {
    // If no event definition, use the base type icon
    if (!eventDefinition) {
      return this.getIconForType(type);
    }

    // Map event definition to icon suffix
    const defToSuffix: Record<string, string> = {
      'bpmn:MessageEventDefinition': 'message',
      'bpmn:TimerEventDefinition': 'timer',
      'bpmn:SignalEventDefinition': 'signal',
      'bpmn:ConditionalEventDefinition': 'conditional',
      'bpmn:ErrorEventDefinition': 'error',
      'bpmn:EscalationEventDefinition': 'escalation',
      'bpmn:CompensateEventDefinition': 'compensation',
      'bpmn:CancelEventDefinition': 'cancel',
      'bpmn:TerminateEventDefinition': 'terminate',
      'bpmn:LinkEventDefinition': 'link',
      'bpmn:MultipleEventDefinition': 'multiple',
      'bpmn:ParallelMultipleEventDefinition': 'parallel-multiple'
    };

    // Throw events that have filled icons (different from catch)
    const throwEventSuffixes = ['message', 'signal', 'escalation', 'compensation', 'link', 'multiple'];

    const suffix = defToSuffix[eventDefinition];
    if (!suffix) {
      return this.getIconForType(type);
    }

    // Determine event type prefix and handle throw vs catch
    let prefix = '';
    let iconSuffix = suffix;

    if (type === 'bpmn:StartEvent') {
      prefix = 'start-event';
    } else if (type === 'bpmn:EndEvent') {
      prefix = 'end-event';
    } else if (type === 'bpmn:IntermediateThrowEvent') {
      prefix = 'intermediate-event';
      // Use throw icon (filled) for throw events
      if (throwEventSuffixes.includes(suffix)) {
        iconSuffix = `${suffix}-throw`;
      }
    } else if (type === 'bpmn:IntermediateCatchEvent' || type === 'bpmn:BoundaryEvent') {
      prefix = 'intermediate-event';
      // Use regular icon (outline) for catch events
    }

    if (prefix) {
      return `assets/icons/bpmn/${prefix}-${iconSuffix}.svg`;
    }

    return this.getIconForType(type);
  }

  // Add text annotation connected to element
  addAnnotation(): void {
    const modeler = this.modelerService.getModeler();
    if (!modeler || !this.contextMenuElement) {
      this.closeContextMenu();
      return;
    }

    try {
      const modeling = modeler.get('modeling');
      const elementFactory = modeler.get('elementFactory');
      const canvas = modeler.get('canvas');
      const rootElement = canvas.getRootElement();

      // Position annotation above and to the right of the element
      const sourceElement = this.contextMenuElement;
      const annotationX = sourceElement.x + sourceElement.width + 50;
      const annotationY = sourceElement.y - 30;

      // Create text annotation
      const annotation = elementFactory.createShape({ type: 'bpmn:TextAnnotation' });
      modeling.createShape(annotation, { x: annotationX, y: annotationY }, rootElement);

      // Connect annotation to element with association
      modeling.connect(annotation, sourceElement, { type: 'bpmn:Association' });

      // Select and activate direct editing on annotation
      const selection = modeler.get('selection');
      selection.select(annotation);

      setTimeout(() => {
        try {
          const directEditing = modeler.get('directEditing');
          directEditing.activate(annotation);
        } catch {
          // Direct editing might not be available
        }
      }, 100);

    } catch (error) {
      console.error('Error adding annotation:', error);
    }

    this.closeContextMenu();
  }

  // Default BPMN 2.0 element sizes
  private readonly defaultSizes: Record<string, { width: number; height: number }> = {
    'bpmn:Task': { width: 100, height: 80 },
    'bpmn:UserTask': { width: 100, height: 80 },
    'bpmn:ServiceTask': { width: 100, height: 80 },
    'bpmn:ScriptTask': { width: 100, height: 80 },
    'bpmn:ManualTask': { width: 100, height: 80 },
    'bpmn:SendTask': { width: 100, height: 80 },
    'bpmn:ReceiveTask': { width: 100, height: 80 },
    'bpmn:BusinessRuleTask': { width: 100, height: 80 },
    'bpmn:CallActivity': { width: 100, height: 80 },
    'bpmn:SubProcess': { width: 350, height: 200 },
    'bpmn:Transaction': { width: 350, height: 200 },
    'bpmn:AdHocSubProcess': { width: 350, height: 200 },
    'bpmn:StartEvent': { width: 36, height: 36 },
    'bpmn:EndEvent': { width: 36, height: 36 },
    'bpmn:IntermediateThrowEvent': { width: 36, height: 36 },
    'bpmn:IntermediateCatchEvent': { width: 36, height: 36 },
    'bpmn:BoundaryEvent': { width: 36, height: 36 },
    'bpmn:ExclusiveGateway': { width: 50, height: 50 },
    'bpmn:ParallelGateway': { width: 50, height: 50 },
    'bpmn:InclusiveGateway': { width: 50, height: 50 },
    'bpmn:EventBasedGateway': { width: 50, height: 50 },
    'bpmn:ComplexGateway': { width: 50, height: 50 },
    'bpmn:DataObjectReference': { width: 36, height: 50 },
    'bpmn:DataStoreReference': { width: 50, height: 50 },
    'bpmn:DataInput': { width: 36, height: 50 },
    'bpmn:DataOutput': { width: 36, height: 50 },
    'bpmn:TextAnnotation': { width: 100, height: 30 },
    'bpmn:Group': { width: 300, height: 200 },
    'bpmn:Participant': { width: 600, height: 250 },
    'bpmn:Lane': { width: 600, height: 120 }
  };

  // Check if element has been resized from default
  isElementResized(): boolean {
    if (!this.contextMenuElement) return false;
    const element = this.contextMenuElement;
    const defaultSize = this.defaultSizes[element.type];
    if (!defaultSize) return false;
    return element.width !== defaultSize.width || element.height !== defaultSize.height;
  }

  // Get current element size as string
  getCurrentSize(): string {
    if (!this.contextMenuElement) return '';
    const element = this.contextMenuElement;
    return `${Math.round(element.width)}×${Math.round(element.height)}`;
  }

  // Get default element size as string
  getDefaultSize(): string {
    if (!this.contextMenuElement) return '';
    const defaultSize = this.defaultSizes[this.contextMenuElement.type];
    if (!defaultSize) return '';
    return `${defaultSize.width}×${defaultSize.height}`;
  }

  // Reset element to default size (centered)
  resetElementSize(): void {
    const modeler = this.modelerService.getModeler();
    if (!modeler || !this.contextMenuElement) {
      this.closeContextMenu();
      return;
    }

    try {
      const modeling = modeler.get('modeling');
      const element = this.contextMenuElement;
      const defaultSize = this.defaultSizes[element.type];

      if (defaultSize) {
        // Calculate center point of current element
        const centerX = element.x + element.width / 2;
        const centerY = element.y + element.height / 2;

        // Calculate new position to keep element centered
        const newX = centerX - defaultSize.width / 2;
        const newY = centerY - defaultSize.height / 2;

        // Resize shape with new bounds (preserving center)
        modeling.resizeShape(element, {
          x: newX,
          y: newY,
          width: defaultSize.width,
          height: defaultSize.height
        });
      }

    } catch (error) {
      console.error('Error resetting element size:', error);
    }

    this.closeContextMenu();
  }

  // Open properties panel for element
  openProperties(): void {
    // Emit event or trigger properties panel
    // For now, activate direct editing as a placeholder
    const modeler = this.modelerService.getModeler();
    if (!modeler || !this.contextMenuElement) {
      this.closeContextMenu();
      return;
    }

    try {
      // Try to open properties panel if available
      const propertiesPanel = modeler.get('propertiesPanel');
      if (propertiesPanel) {
        propertiesPanel.attachTo(document.querySelector('.properties-container'));
      }
    } catch {
      // Properties panel might not be available, fall back to direct editing
      try {
        const directEditing = modeler.get('directEditing');
        directEditing.activate(this.contextMenuElement);
      } catch {
        console.warn('Neither properties panel nor direct editing available');
      }
    }

    this.closeContextMenu();
  }

  contextAction(action: string): void {
    const modeler = this.modelerService.getModeler();
    if (!modeler) {
      this.closeContextMenu();
      return;
    }

    switch (action) {
      case 'edit':
        if (this.contextMenuElement) {
          try {
            const directEditing = modeler.get('directEditing');
            directEditing.activate(this.contextMenuElement);
          } catch {
            // Direct editing might not be available
          }
        }
        break;

      case 'copy':
        // bpmn-js handles copy internally via keyboard
        document.execCommand('copy');
        break;

      case 'paste':
        document.execCommand('paste');
        break;

      case 'delete':
        if (this.contextMenuElement) {
          this.modelerService.deleteSelected();
        }
        break;

      case 'connect':
        // Start connection FROM the selected element
        if (this.contextMenuElement) {
          const element = this.contextMenuElement;
          // Close menu first, then start connection after a brief delay
          this.closeContextMenu();

          // Use setTimeout to ensure the context menu is fully closed
          // before starting the connection tool
          setTimeout(() => {
            try {
              const connect = modeler.get('connect');
              const canvas = modeler.get('canvas');

              // Get the container element for coordinate calculation
              const containerEl = canvas.getContainer();
              const containerRect = containerEl.getBoundingClientRect();

              // Calculate element center in screen coordinates
              const viewbox = canvas.viewbox();
              const elementMid = {
                x: element.x + (element.width || 0) / 2,
                y: element.y + (element.height || 0) / 2
              };

              const clientX = containerRect.left + (elementMid.x - viewbox.x) * viewbox.scale;
              const clientY = containerRect.top + (elementMid.y - viewbox.y) * viewbox.scale;

              // Create synthetic mouse event
              const syntheticEvent = new MouseEvent('mousedown', {
                clientX: clientX,
                clientY: clientY,
                bubbles: true,
                cancelable: true,
                view: window
              });

              // Start the connection - pass the source element
              connect.start(syntheticEvent, element, true);

            } catch (error) {
              console.warn('Connect tool error:', error);
              // Fallback: use global connect tool
              try {
                const globalConnect = modeler.get('globalConnect');
                globalConnect.start(null);
              } catch {
                console.warn('Global connect not available');
              }
            }
          }, 50);

          return; // Exit early - we already closed the menu
        }
        break;

      case 'zoomFit':
        this.modelerService.zoomFit();
        break;

      case 'zoomReset':
        this.modelerService.zoomReset();
        break;
    }

    this.closeContextMenu();
  }

  addElement(type: string): void {
    const modeler = this.modelerService.getModeler();
    if (!modeler) {
      this.closeContextMenu();
      return;
    }

    try {
      const canvas = modeler.get('canvas');
      const viewbox = canvas.viewbox();

      // Convert click position to canvas coordinates
      const container = this.canvasContainer.nativeElement;
      const rect = container.getBoundingClientRect();
      const canvasX = ((this.clickPosition.x - rect.left) / rect.width) * viewbox.width + viewbox.x;
      const canvasY = ((this.clickPosition.y - rect.top) / rect.height) * viewbox.height + viewbox.y;

      this.modelerService.createElement(type, { x: canvasX, y: canvasY });
    } catch (error) {
      console.error('Error adding element:', error);
    }

    this.closeContextMenu();
  }

  // Append a new element connected to the selected element
  appendElement(type: string): void {
    const modeler = this.modelerService.getModeler();
    if (!modeler || !this.contextMenuElement) {
      this.closeContextMenu();
      return;
    }

    try {
      const modeling = modeler.get('modeling');
      const elementFactory = modeler.get('elementFactory');
      const canvas = modeler.get('canvas');
      const rootElement = canvas.getRootElement();

      // Get position for new element (to the right of selected element)
      const sourceElement = this.contextMenuElement;
      const newX = sourceElement.x + sourceElement.width + 80;
      const newY = sourceElement.y + (sourceElement.height / 2) - (type.includes('Gateway') ? 25 : 40);

      // Create new shape
      const newShape = elementFactory.createShape({ type });
      modeling.createShape(newShape, { x: newX, y: newY }, rootElement);

      // Connect the elements with sequence flow
      modeling.connect(sourceElement, newShape);

      // Select the new element
      const selection = modeler.get('selection');
      selection.select(newShape);

    } catch (error) {
      console.error('Error appending element:', error);
    }

    this.closeContextMenu();
  }

  // Check if element type is a connection (sequence flow)
  isConnection(type: string): boolean {
    return type === 'bpmn:SequenceFlow' ||
           type === 'bpmn:MessageFlow' ||
           type === 'bpmn:Association' ||
           type === 'bpmn:DataInputAssociation' ||
           type === 'bpmn:DataOutputAssociation';
  }

  // Check if element is a Participant (Pool) or Lane
  isParticipantOrLane(type: string): boolean {
    return type === 'bpmn:Participant' || type === 'bpmn:Lane';
  }

  // Add a lane to a Participant or Lane
  addLane(location: 'top' | 'bottom'): void {
    const modeler = this.modelerService.getModeler();
    if (!modeler || !this.contextMenuElement) {
      this.closeContextMenu();
      return;
    }

    try {
      const modeling = modeler.get('modeling');
      modeling.addLane(this.contextMenuElement, location);
    } catch (error) {
      console.error('Error adding lane:', error);
    }

    this.closeContextMenu();
  }

  // Add an element inside a Pool/Participant
  addElementInPool(type: string): void {
    const modeler = this.modelerService.getModeler();
    if (!modeler || !this.contextMenuElement) {
      this.closeContextMenu();
      return;
    }

    try {
      const modeling = modeler.get('modeling');
      const elementFactory = modeler.get('elementFactory');

      const poolElement = this.contextMenuElement;

      // Calculate position inside the pool (center)
      const newX = poolElement.x + poolElement.width / 2;
      const newY = poolElement.y + poolElement.height / 2;

      // Create new shape
      const newShape = elementFactory.createShape({ type });
      modeling.createShape(newShape, { x: newX, y: newY }, poolElement);

      // Select the new element
      const selection = modeler.get('selection');
      selection.select(newShape);

    } catch (error) {
      console.error('Error adding element in pool:', error);
    }

    this.closeContextMenu();
  }

  // Start message flow connection (between pools)
  startMessageFlow(): void {
    const modeler = this.modelerService.getModeler();
    if (!modeler || !this.contextMenuElement) {
      this.closeContextMenu();
      return;
    }

    try {
      // Activate global connect tool - bpmn-js will automatically
      // determine if it should be a message flow or sequence flow
      // based on whether source and target are in different pools
      const globalConnect = modeler.get('globalConnect');
      globalConnect.start(null);
    } catch (error) {
      console.error('Error starting message flow:', error);
      // Fallback to regular connect
      try {
        const selection = modeler.get('selection');
        selection.select(this.contextMenuElement);
      } catch {
        console.warn('Connect tool not available');
      }
    }

    this.closeContextMenu();
  }

  // Check if element type can be changed
  canChangeType(type: string): boolean {
    return type.includes('Task') ||
           type.includes('Gateway') ||
           type.includes('Event') ||
           type === 'bpmn:SubProcess';
  }

  // Get type change options based on current element type
  getTypeChangeOptions(currentType: string): Array<{ type: string; label: string; eventDefinition?: string }> {
    if (currentType.includes('Task')) {
      return [
        { type: 'bpmn:Task', label: 'Task' },
        { type: 'bpmn:UserTask', label: 'User Task' },
        { type: 'bpmn:ServiceTask', label: 'Service Task' },
        { type: 'bpmn:ScriptTask', label: 'Script Task' },
        { type: 'bpmn:SendTask', label: 'Send Task' },
        { type: 'bpmn:ReceiveTask', label: 'Receive Task' },
        { type: 'bpmn:ManualTask', label: 'Manual Task' },
        { type: 'bpmn:BusinessRuleTask', label: 'Business Rule Task' },
        { type: 'bpmn:CallActivity', label: 'Call Activity' },
        { type: 'bpmn:SubProcess', label: 'Sub Process' }
      ].filter(opt => opt.type !== currentType);
    }

    if (currentType.includes('Gateway')) {
      return [
        { type: 'bpmn:ExclusiveGateway', label: 'Exclusive Gateway (XOR)' },
        { type: 'bpmn:ParallelGateway', label: 'Parallel Gateway (AND)' },
        { type: 'bpmn:InclusiveGateway', label: 'Inclusive Gateway (OR)' },
        { type: 'bpmn:EventBasedGateway', label: 'Event-based Gateway' },
        { type: 'bpmn:ComplexGateway', label: 'Complex Gateway' }
      ].filter(opt => opt.type !== currentType);
    }

    // Start Event sub-types
    if (currentType === 'bpmn:StartEvent') {
      return [
        { type: 'bpmn:StartEvent', label: 'None', eventDefinition: undefined },
        { type: 'bpmn:StartEvent', label: 'Message', eventDefinition: 'bpmn:MessageEventDefinition' },
        { type: 'bpmn:StartEvent', label: 'Timer', eventDefinition: 'bpmn:TimerEventDefinition' },
        { type: 'bpmn:StartEvent', label: 'Signal', eventDefinition: 'bpmn:SignalEventDefinition' },
        { type: 'bpmn:StartEvent', label: 'Conditional', eventDefinition: 'bpmn:ConditionalEventDefinition' },
        { type: 'bpmn:StartEvent', label: 'Error', eventDefinition: 'bpmn:ErrorEventDefinition' },
        { type: 'bpmn:StartEvent', label: 'Escalation', eventDefinition: 'bpmn:EscalationEventDefinition' },
        { type: 'bpmn:StartEvent', label: 'Compensation', eventDefinition: 'bpmn:CompensateEventDefinition' },
        { type: 'bpmn:StartEvent', label: 'Multiple', eventDefinition: 'bpmn:MultipleEventDefinition' },
        { type: 'bpmn:StartEvent', label: 'Parallel Multiple', eventDefinition: 'bpmn:ParallelMultipleEventDefinition' }
      ];
    }

    // End Event sub-types
    if (currentType === 'bpmn:EndEvent') {
      return [
        { type: 'bpmn:EndEvent', label: 'None', eventDefinition: undefined },
        { type: 'bpmn:EndEvent', label: 'Message', eventDefinition: 'bpmn:MessageEventDefinition' },
        { type: 'bpmn:EndEvent', label: 'Signal', eventDefinition: 'bpmn:SignalEventDefinition' },
        { type: 'bpmn:EndEvent', label: 'Error', eventDefinition: 'bpmn:ErrorEventDefinition' },
        { type: 'bpmn:EndEvent', label: 'Escalation', eventDefinition: 'bpmn:EscalationEventDefinition' },
        { type: 'bpmn:EndEvent', label: 'Compensation', eventDefinition: 'bpmn:CompensateEventDefinition' },
        { type: 'bpmn:EndEvent', label: 'Cancel', eventDefinition: 'bpmn:CancelEventDefinition' },
        { type: 'bpmn:EndEvent', label: 'Terminate', eventDefinition: 'bpmn:TerminateEventDefinition' },
        { type: 'bpmn:EndEvent', label: 'Multiple', eventDefinition: 'bpmn:MultipleEventDefinition' }
      ];
    }

    // Intermediate Throw Event sub-types
    if (currentType === 'bpmn:IntermediateThrowEvent') {
      return [
        { type: 'bpmn:IntermediateThrowEvent', label: 'None', eventDefinition: undefined },
        { type: 'bpmn:IntermediateThrowEvent', label: 'Message', eventDefinition: 'bpmn:MessageEventDefinition' },
        { type: 'bpmn:IntermediateThrowEvent', label: 'Signal', eventDefinition: 'bpmn:SignalEventDefinition' },
        { type: 'bpmn:IntermediateThrowEvent', label: 'Escalation', eventDefinition: 'bpmn:EscalationEventDefinition' },
        { type: 'bpmn:IntermediateThrowEvent', label: 'Compensation', eventDefinition: 'bpmn:CompensateEventDefinition' },
        { type: 'bpmn:IntermediateThrowEvent', label: 'Link', eventDefinition: 'bpmn:LinkEventDefinition' },
        { type: 'bpmn:IntermediateThrowEvent', label: 'Multiple', eventDefinition: 'bpmn:MultipleEventDefinition' }
      ];
    }

    // Intermediate Catch Event sub-types
    if (currentType === 'bpmn:IntermediateCatchEvent') {
      return [
        { type: 'bpmn:IntermediateCatchEvent', label: 'Message', eventDefinition: 'bpmn:MessageEventDefinition' },
        { type: 'bpmn:IntermediateCatchEvent', label: 'Timer', eventDefinition: 'bpmn:TimerEventDefinition' },
        { type: 'bpmn:IntermediateCatchEvent', label: 'Signal', eventDefinition: 'bpmn:SignalEventDefinition' },
        { type: 'bpmn:IntermediateCatchEvent', label: 'Conditional', eventDefinition: 'bpmn:ConditionalEventDefinition' },
        { type: 'bpmn:IntermediateCatchEvent', label: 'Link', eventDefinition: 'bpmn:LinkEventDefinition' },
        { type: 'bpmn:IntermediateCatchEvent', label: 'Multiple', eventDefinition: 'bpmn:MultipleEventDefinition' },
        { type: 'bpmn:IntermediateCatchEvent', label: 'Parallel Multiple', eventDefinition: 'bpmn:ParallelMultipleEventDefinition' }
      ];
    }

    // Boundary Event sub-types
    if (currentType === 'bpmn:BoundaryEvent') {
      return [
        { type: 'bpmn:BoundaryEvent', label: 'Message', eventDefinition: 'bpmn:MessageEventDefinition' },
        { type: 'bpmn:BoundaryEvent', label: 'Timer', eventDefinition: 'bpmn:TimerEventDefinition' },
        { type: 'bpmn:BoundaryEvent', label: 'Signal', eventDefinition: 'bpmn:SignalEventDefinition' },
        { type: 'bpmn:BoundaryEvent', label: 'Conditional', eventDefinition: 'bpmn:ConditionalEventDefinition' },
        { type: 'bpmn:BoundaryEvent', label: 'Error', eventDefinition: 'bpmn:ErrorEventDefinition' },
        { type: 'bpmn:BoundaryEvent', label: 'Escalation', eventDefinition: 'bpmn:EscalationEventDefinition' },
        { type: 'bpmn:BoundaryEvent', label: 'Cancel', eventDefinition: 'bpmn:CancelEventDefinition' },
        { type: 'bpmn:BoundaryEvent', label: 'Compensation', eventDefinition: 'bpmn:CompensateEventDefinition' }
      ];
    }

    return [];
  }

  // Change element type using replace
  changeElementType(newType: string, eventDefinition?: string): void {
    const modeler = this.modelerService.getModeler();
    if (!modeler || !this.contextMenuElement) {
      this.closeContextMenu();
      return;
    }

    try {
      const bpmnReplace = modeler.get('bpmnReplace');

      // Build replace target - include eventDefinitionType for events
      const replaceTarget: any = { type: newType };
      if (eventDefinition) {
        replaceTarget.eventDefinitionType = eventDefinition;
      }

      bpmnReplace.replaceElement(this.contextMenuElement, replaceTarget);
    } catch (error) {
      console.error('Error changing element type:', error);
    }

    this.closeContextMenu();
  }

  // Palette submenu methods
  openPaletteSubmenu(category: string, x: number, y: number): void {
    const options = this.elementTypeOptions[category];
    if (options && options.length > 0) {
      this.paletteSubmenuCategory = category;
      this.paletteSubmenuItems = options;
      this.paletteSubmenuX = x;
      this.paletteSubmenuY = y;
      this.showPaletteSubmenu = true;
    }
  }

  closePaletteSubmenu(): void {
    this.showPaletteSubmenu = false;
    this.paletteSubmenuItems = [];
  }

  selectPaletteElement(type: string): void {
    const modeler = this.modelerService.getModeler();
    if (!modeler) {
      this.closePaletteSubmenu();
      return;
    }

    try {
      // Parse type and event definition if present (e.g., "bpmn:StartEvent:MessageEventDefinition")
      const parts = type.split(':');
      const elementType = parts.slice(0, 2).join(':'); // e.g., "bpmn:StartEvent"
      const eventDefinition = parts[2]; // e.g., "MessageEventDefinition"

      const canvas = modeler.get('canvas');
      const viewbox = canvas.viewbox();

      // Place element in center of visible canvas
      const centerX = viewbox.x + viewbox.width / 2;
      const centerY = viewbox.y + viewbox.height / 2;

      // Build properties object if event definition is specified
      const properties: Record<string, any> | undefined = eventDefinition
        ? { eventDefinitionType: eventDefinition }
        : undefined;

      this.modelerService.createElement(
        elementType,
        { x: centerX, y: centerY },
        properties
      );
    } catch (error) {
      console.error('Error creating element:', error);
    }

    this.closePaletteSubmenu();
  }

  getElementColorClass(type: string): string {
    // Color coding based on BPMN element categories
    if (type.includes('Task') || type.includes('Activity') || type.includes('SubProcess')) {
      return 'color-task'; // Blue
    }
    if (type.includes('StartEvent')) {
      return 'color-start'; // Green
    }
    if (type.includes('EndEvent')) {
      return 'color-end'; // Red
    }
    if (type.includes('IntermediateThrowEvent') || type.includes('IntermediateCatchEvent')) {
      return 'color-intermediate'; // Orange
    }
    if (type.includes('Gateway')) {
      return 'color-gateway'; // Yellow/Gold
    }
    if (type.includes('Data')) {
      return 'color-data'; // Purple
    }
    if (type.includes('Participant') || type.includes('Pool')) {
      return 'color-participant'; // Teal
    }
    return 'color-default';
  }

  private setupPaletteClickHandler(modeler: any): void {
    try {
      const eventBus = modeler.get('eventBus');

      // Listen for palette entry clicks
      eventBus.on('palette.getProviders', (_event: any) => {
        // Store reference to intercept later
      });

      // Setup palette tooltips and click handlers
      setTimeout(() => {
        this.setupPaletteTooltips();

        const paletteEntries = document.querySelectorAll('.djs-palette .entry');
        paletteEntries.forEach((entry) => {
          entry.addEventListener('click', (e: Event) => {
            const target = e.currentTarget as HTMLElement;
            const action = target.getAttribute('data-action');

            // Map palette actions to categories
            const categoryMap: Record<string, string> = {
              'create.task': 'task',
              'create.subprocess-expanded': 'subprocess',
              'create.start-event': 'start-event',
              'create.intermediate-event': 'intermediate-event',
              'create.end-event': 'end-event',
              'create.exclusive-gateway': 'gateway',
              'create.data-object': 'data',
              'create.participant-expanded': 'participant'
            };

            const category = categoryMap[action || ''];
            if (category) {
              e.preventDefault();
              e.stopPropagation();
              const rect = target.getBoundingClientRect();
              this.openPaletteSubmenu(category, rect.right + 10, rect.top);
            }
          }, true);
        });
      }, 1000);
    } catch (error) {
      console.warn('Could not setup palette click handler:', error);
    }
  }

  /**
   * Replace native browser tooltips with custom styled tooltips
   * This removes the `title` attribute and uses our own tooltip implementation
   * Styled to match Administration Docker tooltips (charcoal with transparency)
   */
  private setupPaletteTooltips(): void {
    // Create tooltip element - styled to match Admin Docker
    let tooltipEl = document.querySelector('.palette-tooltip') as HTMLElement;
    if (!tooltipEl) {
      tooltipEl = document.createElement('div');
      tooltipEl.className = 'palette-tooltip';
      tooltipEl.style.cssText = `
        position: fixed;
        z-index: 10000;
        background: rgba(48, 48, 48, 0.85);
        backdrop-filter: blur(8px);
        -webkit-backdrop-filter: blur(8px);
        color: white;
        padding: 8px 14px;
        border-radius: 10px;
        font-size: 12px;
        font-weight: 500;
        font-family: 'Gotham Rounded', 'Nunito', -apple-system, BlinkMacSystemFont, sans-serif;
        line-height: 1.3;
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
        max-width: 200px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        pointer-events: none;
        opacity: 0;
        visibility: hidden;
        transition: all 0.2s ease;
      `;
      document.body.appendChild(tooltipEl);

      // Add arrow element
      const arrow = document.createElement('div');
      arrow.style.cssText = `
        position: absolute;
        right: 100%;
        top: 50%;
        transform: translateY(-50%);
        border: 6px solid transparent;
        border-right-color: rgba(48, 48, 48, 0.85);
      `;
      tooltipEl.appendChild(arrow);
    }

    // Find all palette entries with title attributes
    const entries = document.querySelectorAll('.djs-palette .entry[title]');

    entries.forEach((entry) => {
      const el = entry as HTMLElement;
      const title = el.getAttribute('title');
      if (!title) return;

      // Store title in data attribute and remove native title
      el.setAttribute('data-tooltip', title);
      el.removeAttribute('title');

      // Show tooltip on hover
      el.addEventListener('mouseenter', () => {
        const rect = el.getBoundingClientRect();
        const tooltipText = el.getAttribute('data-tooltip') || '';
        // Set text content (first child is the text, arrow is appended)
        if (tooltipEl.childNodes[0]?.nodeType === Node.TEXT_NODE) {
          tooltipEl.childNodes[0].textContent = tooltipText;
        } else {
          tooltipEl.insertBefore(document.createTextNode(tooltipText), tooltipEl.firstChild);
        }
        tooltipEl.style.left = `${rect.right + 12}px`;
        tooltipEl.style.top = `${rect.top + rect.height / 2}px`;
        tooltipEl.style.transform = 'translateY(-50%) translateX(8px)';
        tooltipEl.style.opacity = '1';
        tooltipEl.style.visibility = 'visible';
      });

      el.addEventListener('mouseleave', () => {
        tooltipEl.style.opacity = '0';
        tooltipEl.style.visibility = 'hidden';
        tooltipEl.style.transform = 'translateY(-50%) translateX(-4px)';
      });
    });

    // Also handle dynamically added entries
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const el = node as HTMLElement;
            if (el.classList?.contains('entry') && el.hasAttribute('title')) {
              const title = el.getAttribute('title');
              el.setAttribute('data-tooltip', title || '');
              el.removeAttribute('title');

              el.addEventListener('mouseenter', () => {
                const rect = el.getBoundingClientRect();
                const tooltipText = el.getAttribute('data-tooltip') || '';
                if (tooltipEl.childNodes[0]?.nodeType === Node.TEXT_NODE) {
                  tooltipEl.childNodes[0].textContent = tooltipText;
                } else {
                  tooltipEl.insertBefore(document.createTextNode(tooltipText), tooltipEl.firstChild);
                }
                tooltipEl.style.left = `${rect.right + 12}px`;
                tooltipEl.style.top = `${rect.top + rect.height / 2}px`;
                tooltipEl.style.transform = 'translateY(-50%) translateX(8px)';
                tooltipEl.style.opacity = '1';
                tooltipEl.style.visibility = 'visible';
              });

              el.addEventListener('mouseleave', () => {
                tooltipEl.style.opacity = '0';
                tooltipEl.style.visibility = 'hidden';
                tooltipEl.style.transform = 'translateY(-50%) translateX(-4px)';
              });
            }
          }
        });
      });
    });

    const palette = document.querySelector('.djs-palette');
    if (palette) {
      observer.observe(palette, { childList: true, subtree: true });
    }
  }

  /**
   * Setup element type attributes for CSS styling
   * bpmn-js doesn't include type in element IDs, so we add data-element-type attribute
   */
  private setupElementTypeAttributes(modeler: any): void {
    const eventBus = modeler.get('eventBus');
    const elementRegistry = modeler.get('elementRegistry');

    // Helper to set type attribute on element's DOM node
    const setTypeAttribute = (element: any) => {
      if (!element || !element.type || element.type.startsWith('bpmndi:')) return;

      try {
        const gfx = elementRegistry.getGraphics(element);
        if (gfx) {
          gfx.setAttribute('data-element-type', element.type);
        }
      } catch (e) {
        // Element might not have graphics yet
      }
    };

    // Apply to all existing elements
    const applyToAll = () => {
      try {
        const elements = elementRegistry.getAll();
        elements.forEach((el: any) => setTypeAttribute(el));
      } catch (e) {
        // Registry might not be ready
      }
    };

    // Apply when elements are added
    eventBus.on('shape.added', (e: any) => {
      setTimeout(() => setTypeAttribute(e.element), 0);
    });

    eventBus.on('connection.added', (e: any) => {
      setTimeout(() => setTypeAttribute(e.element), 0);
    });

    // Apply when diagram is imported
    eventBus.on('import.done', () => {
      setTimeout(applyToAll, 100);
    });

    // Apply when element type changes
    eventBus.on('element.changed', (e: any) => {
      setTimeout(() => setTypeAttribute(e.element), 0);
    });

    // Initial application
    setTimeout(applyToAll, 500);
  }

  // Helper: Calculate distance from point to line segment
  private distanceToLineSegment(px: number, py: number, x1: number, y1: number, x2: number, y2: number): number {
    const A = px - x1;
    const B = py - y1;
    const C = x2 - x1;
    const D = y2 - y1;

    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    let param = -1;

    if (lenSq !== 0) {
      param = dot / lenSq;
    }

    let xx: number, yy: number;

    if (param < 0) {
      xx = x1;
      yy = y1;
    } else if (param > 1) {
      xx = x2;
      yy = y2;
    } else {
      xx = x1 + param * C;
      yy = y1 + param * D;
    }

    const dx = px - xx;
    const dy = py - yy;
    return Math.sqrt(dx * dx + dy * dy);
  }
}
