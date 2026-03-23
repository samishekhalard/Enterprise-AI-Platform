import { Component, inject, signal, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { BpmnCanvasComponent } from '../../components/bpmn-canvas/bpmn-canvas.component';
import { BpmnToolbarComponent } from '../../components/bpmn-toolbar/bpmn-toolbar.component';
import { BpmnPaletteDockerComponent } from '../../components/bpmn-palette-docker/bpmn-palette-docker.component';
import { BpmnModelerService } from '../../services/bpmn-modeler.service';
import { BreadcrumbComponent } from '../../components/shared/breadcrumb';
import type { ExportFormat } from '../../models/bpmn.model';

type PanelTab = 'properties' | 'raci' | 'compliance' | 'kpis';

@Component({
  selector: 'app-process-modeler-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    BpmnCanvasComponent,
    BpmnToolbarComponent,
    BpmnPaletteDockerComponent,
    BreadcrumbComponent
  ],
  template: `
    <!-- Breadcrumb (Standardized - Fixed Position) -->
    <app-breadcrumb [items]="[{ label: 'Processes' }]" />

    <!-- Fixed Position Dock: BPMN Palette (like admin-dock) -->
    <app-bpmn-palette-docker></app-bpmn-palette-docker>

    <!-- Content Area (with left padding for fixed dock) -->
    <div class="content-area">
      <!-- Main Container -->
      <div class="main-container">
        <div class="modeler-layout">
          <!-- Toolbar -->
          <app-bpmn-toolbar></app-bpmn-toolbar>

          <!-- Main content area -->
          <div class="modeler-content"
               (dragover)="onDragOver($event)"
               (drop)="onDrop($event)">
            <!-- Canvas -->
            <div class="canvas-container" [class.panel-open]="modelerService.isPanelOpen()">
              <app-bpmn-canvas #bpmnCanvas></app-bpmn-canvas>

              <!-- Floating Controls - Bottom Left: Zoom Controls -->
              <div class="floating-controls floating-controls-left">
                <button class="floating-btn"
                        (click)="modelerService.zoomOut()"
                        title="Zoom Out">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="11" cy="11" r="8"/>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"/>
                    <line x1="8" y1="11" x2="14" y2="11"/>
                  </svg>
                </button>
                <button class="zoom-display-btn"
                        (click)="showZoomMenu = !showZoomMenu"
                        [class.active]="showZoomMenu"
                        title="Zoom Level">
                  {{ modelerService.zoomPercentage() }}%
                  <svg class="dropdown-arrow-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="6 9 12 15 18 9"/>
                  </svg>
                </button>
                @if (showZoomMenu) {
                  <div class="zoom-menu-floating">
                    <button class="zoom-option" (click)="setZoom(0.5)">50%</button>
                    <button class="zoom-option" (click)="setZoom(0.75)">75%</button>
                    <button class="zoom-option" (click)="setZoom(1)">100%</button>
                    <button class="zoom-option" (click)="setZoom(1.25)">125%</button>
                    <button class="zoom-option" (click)="setZoom(1.5)">150%</button>
                    <button class="zoom-option" (click)="setZoom(2)">200%</button>
                    <div class="zoom-divider"></div>
                    <button class="zoom-option" (click)="modelerService.zoomFit(); showZoomMenu = false">Fit to View</button>
                  </div>
                }
                <button class="floating-btn"
                        (click)="modelerService.zoomIn()"
                        title="Zoom In">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="11" cy="11" r="8"/>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"/>
                    <line x1="11" y1="8" x2="11" y2="14"/>
                    <line x1="8" y1="11" x2="14" y2="11"/>
                  </svg>
                </button>
                <button class="floating-btn"
                        (click)="modelerService.zoomFit()"
                        title="Fit to View">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/>
                  </svg>
                </button>
              </div>

              <!-- Floating Controls - Bottom Right: Minimap + Grid -->
              <div class="floating-controls floating-controls-right">
                <button class="floating-btn"
                        [class.active]="bpmnCanvas?.showMinimap"
                        (click)="bpmnCanvas?.toggleMinimap()"
                        title="Toggle Minimap">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="3" y="3" width="18" height="18" rx="2"/>
                    <rect x="6" y="6" width="5" height="5"/>
                  </svg>
                  <span>Minimap</span>
                </button>
                <button class="floating-btn"
                        [class.active]="modelerService.showGridDots()"
                        (click)="modelerService.toggleGridDots()"
                        title="Toggle Grid Dots">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="4" cy="4" r="1.5"/>
                    <circle cx="12" cy="4" r="1.5"/>
                    <circle cx="20" cy="4" r="1.5"/>
                    <circle cx="4" cy="12" r="1.5"/>
                    <circle cx="12" cy="12" r="1.5"/>
                    <circle cx="20" cy="12" r="1.5"/>
                    <circle cx="4" cy="20" r="1.5"/>
                    <circle cx="12" cy="20" r="1.5"/>
                    <circle cx="20" cy="20" r="1.5"/>
                  </svg>
                  <span>Grid</span>
                </button>
              </div>

              <!-- Backdrop for zoom menu -->
              @if (showZoomMenu) {
                <div class="floating-menu-backdrop" (click)="showZoomMenu = false"></div>
              }
            </div>

            <!-- Properties Sidebar - Only shown when panel is open AND element is selected -->
            @if (modelerService.isPanelOpen() && modelerService.selectedElement(); as element) {
              <aside class="properties-sidebar" role="complementary" aria-label="Properties Panel">
                <!-- Sidebar Header -->
                <div class="sidebar-header">
              <div class="selected-element-info">
                <span class="element-type-badge">{{ modelerService.formatElementType(element.type) }}</span>
                <span class="element-name">{{ element.name || 'Unnamed' }}</span>
              </div>
              <button class="close-panel-btn" (click)="modelerService.closePanel()" title="Close">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>

            <!-- Tab Navigation -->
            <div class="sidebar-tabs">
              <button
                class="sidebar-tab"
                [class.active]="activeTab() === 'properties'"
                (click)="activeTab.set('properties')">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="3"/>
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
                </svg>
                Properties
              </button>
              <button
                class="sidebar-tab"
                [class.active]="activeTab() === 'raci'"
                (click)="activeTab.set('raci')"
                [disabled]="!modelerService.isTaskElement(element.type)">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                  <circle cx="9" cy="7" r="4"/>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                </svg>
                RACI
              </button>
              <button
                class="sidebar-tab"
                [class.active]="activeTab() === 'compliance'"
                (click)="activeTab.set('compliance')">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                </svg>
                Compliance
              </button>
              <button
                class="sidebar-tab"
                [class.active]="activeTab() === 'kpis'"
                (click)="activeTab.set('kpis')"
                [disabled]="!modelerService.isTaskElement(element.type)">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="18" y1="20" x2="18" y2="10"/>
                  <line x1="12" y1="20" x2="12" y2="4"/>
                  <line x1="6" y1="20" x2="6" y2="14"/>
                </svg>
                KPIs
              </button>
            </div>

            <!-- Tab Content -->
            <div class="sidebar-content">
              @switch (activeTab()) {
                @case ('properties') {
                  <!-- Element Properties Only -->
                  <div class="properties-tab">
                    <div class="property-group">
                      <div class="property-group-header">General</div>
                      <div class="property-row">
                        <label>ID</label>
                        <input type="text" [value]="element.id" readonly class="readonly">
                      </div>
                      <div class="property-row">
                        <label>Name</label>
                        <input type="text"
                               [value]="element.name || ''"
                               (input)="updateElementName(element.id, $event)"
                               placeholder="Enter name">
                      </div>
                      <div class="property-row">
                        <label>Type</label>
                        <input type="text" [value]="modelerService.formatElementType(element.type)" readonly class="readonly">
                      </div>
                    </div>

                    <div class="property-group">
                      <div class="property-group-header">Documentation</div>
                      <div class="property-row">
                        <textarea
                          rows="4"
                          [value]="modelerService.getElementDocumentation(element)"
                          (input)="updateElementDocumentation(element.id, $event)"
                          placeholder="Add documentation..."></textarea>
                      </div>
                    </div>

                    @if (modelerService.isTaskElement(element.type)) {
                      <div class="property-group">
                        <div class="property-group-header">Execution</div>
                        <div class="property-row">
                          <label>Assignee</label>
                          <input type="text" placeholder="e.g. \${assignee}">
                        </div>
                        <div class="property-row">
                          <label>Candidate Groups</label>
                          <input type="text" placeholder="e.g. management, sales">
                        </div>
                        <div class="property-row">
                          <label>Due Date</label>
                          <input type="text" placeholder="e.g. \${dueDate}">
                        </div>
                      </div>
                    }
                  </div>
                }

                @case ('raci') {
                  <div class="raci-tab">
                    <div class="tab-intro">
                      <p>Define responsibilities for this activity.</p>
                    </div>

                    @if (modelerService.isTaskElement(element.type)) {
                      <div class="raci-form">
                        <div class="raci-element-name">{{ element.name || 'Unnamed Task' }}</div>
                        <div class="raci-row">
                          <label>
                            <span class="raci-letter">R</span>
                            Responsible
                          </label>
                          <input type="text"
                                 placeholder="Who performs the work?"
                                 [value]="getRaciValue(element.id, 'responsible')"
                                 (input)="updateRaci(element.id, 'responsible', $event)">
                        </div>
                        <div class="raci-row">
                          <label>
                            <span class="raci-letter">A</span>
                            Accountable
                          </label>
                          <input type="text"
                                 placeholder="Who is ultimately accountable?"
                                 [value]="getRaciValue(element.id, 'accountable')"
                                 (input)="updateRaci(element.id, 'accountable', $event)">
                        </div>
                        <div class="raci-row">
                          <label>
                            <span class="raci-letter">C</span>
                            Consulted
                          </label>
                          <input type="text"
                                 placeholder="Who provides input?"
                                 [value]="getRaciValue(element.id, 'consulted')"
                                 (input)="updateRaci(element.id, 'consulted', $event)">
                        </div>
                        <div class="raci-row">
                          <label>
                            <span class="raci-letter">I</span>
                            Informed
                          </label>
                          <input type="text"
                                 placeholder="Who needs to know?"
                                 [value]="getRaciValue(element.id, 'informed')"
                                 (input)="updateRaci(element.id, 'informed', $event)">
                        </div>
                      </div>
                    } @else {
                      <div class="empty-state">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                          <circle cx="9" cy="7" r="4"/>
                        </svg>
                        <p>RACI is only available for <strong>tasks</strong> and <strong>activities</strong></p>
                      </div>
                    }
                  </div>
                }

                @case ('compliance') {
                  <div class="compliance-tab">
                    <div class="tab-intro">
                      <p>Track regulatory requirements for this element.</p>
                    </div>

                    <div class="compliance-frameworks">
                      <div class="frameworks-header">Frameworks</div>
                      @for (framework of complianceFrameworks; track framework.id) {
                        <label class="framework-checkbox">
                          <input type="checkbox"
                                 [checked]="isFrameworkSelected(framework.id)"
                                 (change)="toggleFramework(framework.id)">
                          <span class="checkbox-custom"></span>
                          <span class="framework-badge" [style.background]="framework.color">{{ framework.abbr }}</span>
                          <span class="framework-name">{{ framework.name }}</span>
                        </label>
                      }
                    </div>

                    <div class="element-tags">
                      <div class="tags-header">Tags for: {{ element.name || 'Unnamed' }}</div>
                      <div class="tag-list">
                        @for (tag of getElementComplianceTags(element.id); track tag.id) {
                          <span class="compliance-tag">
                            {{ tag.framework }}
                            <button class="remove-tag" (click)="removeComplianceTag(tag.id)">&times;</button>
                          </span>
                        } @empty {
                          <span class="no-tags">No compliance tags</span>
                        }
                      </div>
                      <button class="add-tag-btn">+ Add Tag</button>
                    </div>
                  </div>
                }

                @case ('kpis') {
                  <div class="kpis-tab">
                    @if (modelerService.isTaskElement(element.type)) {
                      <div class="tab-intro">
                        <p>Define key performance indicators for this activity.</p>
                      </div>

                      <div class="kpi-list">
                        @for (kpi of modelerService.processDocumentation().kpis; track kpi.id) {
                          <div class="kpi-card">
                            <div class="kpi-header">
                              <span class="kpi-name">{{ kpi.name }}</span>
                              <button class="kpi-remove" (click)="removeKpi(kpi.id)">&times;</button>
                            </div>
                            <div class="kpi-details">
                              <span>Target: {{ kpi.targetValue }} {{ kpi.unit }}</span>
                              <span class="kpi-frequency">{{ kpi.frequency }}</span>
                            </div>
                          </div>
                        } @empty {
                          <div class="empty-state small">
                            <p>No KPIs defined yet</p>
                          </div>
                        }
                      </div>

                      <button class="add-kpi-btn">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <line x1="12" y1="5" x2="12" y2="19"/>
                          <line x1="5" y1="12" x2="19" y2="12"/>
                        </svg>
                        Add KPI
                      </button>
                    } @else {
                      <div class="empty-state">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                          <line x1="18" y1="20" x2="18" y2="10"/>
                          <line x1="12" y1="20" x2="12" y2="4"/>
                          <line x1="6" y1="20" x2="6" y2="14"/>
                        </svg>
                        <p>KPIs are only available for <strong>tasks</strong> and <strong>activities</strong></p>
                      </div>
                    }
                  </div>
                }
              }
            </div>
          </aside>
          }
        </div>
        </div>
      </div>
    </div>
  `,
  styleUrl: './process-modeler.page.scss'
})
export class ProcessModelerPage {
  @ViewChild('bpmnCanvas') bpmnCanvas!: BpmnCanvasComponent;

  readonly modelerService = inject(BpmnModelerService);

  // Tab state
  readonly activeTab = signal<PanelTab>('properties');

  // Zoom menu state
  showZoomMenu = false;

  // Compliance frameworks
  readonly complianceFrameworks = [
    { id: 'gdpr', name: 'GDPR', abbr: 'GDPR', color: '#3b82f6' },
    { id: 'sox', name: 'Sarbanes-Oxley', abbr: 'SOX', color: '#8b5cf6' },
    { id: 'hipaa', name: 'HIPAA', abbr: 'HIPAA', color: '#10b981' },
    { id: 'iso27001', name: 'ISO 27001', abbr: 'ISO', color: '#f59e0b' },
    { id: 'pci', name: 'PCI DSS', abbr: 'PCI', color: '#ef4444' }
  ];

  private selectedFrameworks = new Set<string>();

  // Element property updates
  updateElementName(elementId: string, event: Event): void {
    const input = event.target as HTMLInputElement;
    this.modelerService.updateElementName(elementId, input.value);
  }

  updateElementDocumentation(elementId: string, event: Event): void {
    const textarea = event.target as HTMLTextAreaElement;
    this.modelerService.updateElementDocumentation(elementId, textarea.value);
  }

  // Process property updates
  updateProcessName(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.modelerService.updateProcessName(input.value);
  }

  updateProcessVersion(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.modelerService.updateProcessVersion(input.value);
  }

  updateProcessDescription(event: Event): void {
    const textarea = event.target as HTMLTextAreaElement;
    this.modelerService.updateProcessDescription(textarea.value);
  }

  // RACI methods
  getRaciValue(elementId: string, role: 'responsible' | 'accountable' | 'consulted' | 'informed'): string {
    const raci = this.modelerService.getRaciForElement(elementId);
    if (!raci) return '';
    const value = raci[role];
    return Array.isArray(value) ? value.join(', ') : (value || '');
  }

  updateRaci(elementId: string, role: 'responsible' | 'accountable' | 'consulted' | 'informed', event: Event): void {
    const input = event.target as HTMLInputElement;
    const inputValue = input.value;

    const existing = this.modelerService.getRaciForElement(elementId);

    this.modelerService.updateRaci({
      activityId: elementId,
      activityName: this.modelerService.selectedElement()?.name || '',
      responsible: role === 'responsible'
        ? inputValue.split(',').map(s => s.trim()).filter(Boolean)
        : existing?.responsible || [],
      accountable: role === 'accountable'
        ? inputValue.trim()
        : existing?.accountable || '',
      consulted: role === 'consulted'
        ? inputValue.split(',').map(s => s.trim()).filter(Boolean)
        : existing?.consulted || [],
      informed: role === 'informed'
        ? inputValue.split(',').map(s => s.trim()).filter(Boolean)
        : existing?.informed || []
    });
  }

  // Compliance methods
  isFrameworkSelected(frameworkId: string): boolean {
    return this.selectedFrameworks.has(frameworkId);
  }

  toggleFramework(frameworkId: string): void {
    if (this.selectedFrameworks.has(frameworkId)) {
      this.selectedFrameworks.delete(frameworkId);
    } else {
      this.selectedFrameworks.add(frameworkId);
    }
  }

  getElementComplianceTags(elementId: string) {
    return this.modelerService.getComplianceTagsForElement(elementId);
  }

  removeComplianceTag(tagId: string): void {
    this.modelerService.removeComplianceTag(tagId);
  }

  // KPI methods
  removeKpi(kpiId: string): void {
    this.modelerService.removeKpi(kpiId);
  }

  // Zoom methods
  setZoom(level: number): void {
    this.modelerService.setZoom(level);
    this.showZoomMenu = false;
  }

  // Process actions
  async saveProcess(): Promise<void> {
    const xml = await this.modelerService.saveDiagram();
    if (!xml) {
      console.error('Unable to save process diagram');
      return;
    }

    this.downloadFile(xml, this.buildFileName('bpmn'), 'application/xml');
  }

  async exportProcess(format: ExportFormat = 'svg'): Promise<void> {
    const exported = await this.modelerService.exportDiagram(format);
    if (!exported || exported instanceof Blob) {
      console.error(`Unable to export process diagram as ${format.toUpperCase()}`);
      return;
    }

    const mimeType = format === 'bpmn' ? 'application/xml' : 'image/svg+xml';
    const extension = format === 'bpmn' ? 'bpmn' : format;
    this.downloadFile(exported, this.buildFileName(extension), mimeType);
  }

  private buildFileName(extension: string): string {
    const processName = this.modelerService.currentProcess().name || 'process-diagram';
    const safeName = processName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'process-diagram';
    return `${safeName}.${extension}`;
  }

  private downloadFile(content: string, fileName: string, mimeType: string): void {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = url;
    link.download = fileName;
    link.click();

    URL.revokeObjectURL(url);
  }

  // Drag and drop handling for palette elements
  onDragOver(event: DragEvent): void {
    // Allow drop
    event.preventDefault();
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'copy';
    }
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();

    if (!event.dataTransfer) return;

    const data = event.dataTransfer.getData('application/bpmn-element');
    if (!data) return;

    try {
      const elementData = JSON.parse(data);
      const modeler = this.modelerService.getModeler();
      if (!modeler) return;

      const canvas = modeler.get('canvas');
      const elementFactory = modeler.get('elementFactory');
      const modeling = modeler.get('modeling');

      // Get canvas container for coordinate conversion
      const canvasContainer = canvas._container;
      const rect = canvasContainer.getBoundingClientRect();

      // Convert screen coordinates to canvas coordinates
      const viewbox = canvas.viewbox();
      const canvasX = ((event.clientX - rect.left) / rect.width) * viewbox.width + viewbox.x;
      const canvasY = ((event.clientY - rect.top) / rect.height) * viewbox.height + viewbox.y;

      // Build shape options with event definition and cancelActivity if provided
      const shapeOptions: any = { type: elementData.type };
      if (elementData.eventDefinition) {
        shapeOptions.eventDefinitionType = elementData.eventDefinition;
      }
      if (elementData.cancelActivity !== undefined) {
        shapeOptions.cancelActivity = elementData.cancelActivity;
      }

      // Create and add the element
      const shape = elementFactory.createShape(shapeOptions);
      const rootElement = canvas.getRootElement();

      modeling.createShape(shape, { x: canvasX, y: canvasY }, rootElement);

      // Select the new element
      const selection = modeler.get('selection');
      selection.select(shape);
    } catch (error) {
      console.warn('Could not drop element:', error);
    }
  }
}
