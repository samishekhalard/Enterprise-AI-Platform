import { Component, inject, ElementRef, ViewChild } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { BpmnModelerService } from '../../services/bpmn-modeler.service';

@Component({
  selector: 'app-bpmn-toolbar',
  standalone: true,
  imports: [CommonModule, DecimalPipe],
  template: `
    <div class="bpmn-toolbar" role="toolbar" aria-label="BPMN Modeler Toolbar">
      <!-- Menu Button (hamburger) -->
      <div class="toolbar-group">
        <div class="toolbar-dropdown">
          <button class="toolbar-btn menu-btn"
                  (click)="toggleMainMenu()"
                  [class.active]="showMainMenu"
                  aria-label="Menu"
                  aria-haspopup="true"
                  [attr.aria-expanded]="showMainMenu"
                  title="Menu">
            <svg class="toolbar-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="3" y1="6" x2="21" y2="6"/>
              <line x1="3" y1="12" x2="21" y2="12"/>
              <line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
          </button>
          @if (showMainMenu) {
            <div class="dropdown-menu">
              <button class="dropdown-item" (click)="newDiagram()">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                  <line x1="12" y1="18" x2="12" y2="12"/>
                  <line x1="9" y1="15" x2="15" y2="15"/>
                </svg>
                New Diagram
                <span class="shortcut">Ctrl+N</span>
              </button>
              <button class="dropdown-item" (click)="triggerFileInput()">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
                </svg>
                Open File
                <span class="shortcut">Ctrl+O</span>
              </button>
              <div class="dropdown-divider"></div>
              <button class="dropdown-item" (click)="togglePropertiesPanel()">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                  <line x1="15" y1="3" x2="15" y2="21"/>
                </svg>
                Properties Panel
                <span class="shortcut">{{ modelerService.isPanelOpen() ? '✓' : '' }}</span>
              </button>
            </div>
          }
        </div>
      </div>

      <div class="toolbar-separator"></div>

      <!-- File Operations -->
      <div class="toolbar-group">
        <button class="toolbar-btn"
                (click)="saveDiagram()"
                [class.has-changes]="modelerService.isDirty()"
                aria-label="Save diagram"
                title="Save Diagram (Ctrl+S)">
          <svg class="toolbar-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
            <polyline points="17 21 17 13 7 13 7 21"/>
            <polyline points="7 3 7 8 15 8"/>
          </svg>
          <span class="btn-label">Save</span>
        </button>

        <button class="toolbar-btn"
                (click)="triggerFileInput()"
                aria-label="Import diagram"
                title="Import BPMN File">
          <svg class="toolbar-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="17 8 12 3 7 8"/>
            <line x1="12" y1="3" x2="12" y2="15"/>
          </svg>
          <span class="btn-label">Import</span>
        </button>

        <!-- Export dropdown -->
        <div class="toolbar-dropdown">
          <button class="toolbar-btn"
                  (click)="toggleExportMenu()"
                  [class.active]="showExportMenu"
                  aria-label="Export diagram"
                  aria-haspopup="true"
                  [attr.aria-expanded]="showExportMenu"
                  title="Export Diagram">
            <svg class="toolbar-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            <span class="btn-label">Export</span>
            <svg class="dropdown-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </button>
          @if (showExportMenu) {
            <div class="dropdown-menu">
              <button class="dropdown-item" (click)="exportBpmn()">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                </svg>
                Export as BPMN
              </button>
              <button class="dropdown-item" (click)="exportSvg()">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                  <circle cx="8.5" cy="8.5" r="1.5"/>
                  <polyline points="21 15 16 10 5 21"/>
                </svg>
                Export as SVG
              </button>
              <button class="dropdown-item" (click)="exportPng()">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                  <circle cx="8.5" cy="8.5" r="1.5"/>
                  <polyline points="21 15 16 10 5 21"/>
                </svg>
                Export as PNG
              </button>
              <div class="dropdown-divider"></div>
              <button class="dropdown-item" (click)="exportPdf()">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                  <path d="M9 13h6"/>
                  <path d="M9 17h6"/>
                </svg>
                Export as PDF
              </button>
            </div>
          }
        </div>
      </div>

      <div class="toolbar-separator"></div>

      <!-- Edit Operations -->
      <div class="toolbar-group">
        <button class="toolbar-btn"
                (click)="modelerService.undo()"
                [disabled]="!modelerService.canUndo()"
                aria-label="Undo"
                title="Undo (Ctrl+Z)">
          <svg class="toolbar-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M3 7v6h6"/>
            <path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13"/>
          </svg>
        </button>

        <button class="toolbar-btn"
                (click)="modelerService.redo()"
                [disabled]="!modelerService.canRedo()"
                aria-label="Redo"
                title="Redo (Ctrl+Y)">
          <svg class="toolbar-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 7v6h-6"/>
            <path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3l3 2.7"/>
          </svg>
        </button>

        <div class="toolbar-separator-sm"></div>

        <button class="toolbar-btn"
                (click)="copySelection()"
                [disabled]="!modelerService.hasSelection()"
                aria-label="Copy"
                title="Copy (Ctrl+C)">
          <svg class="toolbar-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
          </svg>
        </button>

        <button class="toolbar-btn"
                (click)="pasteSelection()"
                [disabled]="!hasClipboard"
                aria-label="Paste"
                title="Paste (Ctrl+V)">
          <svg class="toolbar-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
            <rect x="8" y="2" width="8" height="4" rx="1" ry="1"/>
          </svg>
        </button>

        <button class="toolbar-btn"
                (click)="deleteSelection()"
                [disabled]="!modelerService.hasSelection()"
                aria-label="Delete"
                title="Delete (Del)">
          <svg class="toolbar-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="3 6 5 6 21 6"/>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
          </svg>
        </button>
      </div>

      <div class="toolbar-separator"></div>

      <!-- View Controls -->
      <div class="toolbar-group">
        <button class="toolbar-btn"
                (click)="toggleGrid()"
                [class.active]="showGrid"
                aria-label="Toggle grid"
                title="Toggle Grid Dots">
          <svg class="toolbar-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
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
        </button>
      </div>

      <div class="toolbar-separator"></div>

      <!-- Validation & Info -->
      <div class="toolbar-group">
        <button class="toolbar-btn"
                (click)="validateDiagram()"
                [class.has-errors]="modelerService.validationErrors().length > 0"
                aria-label="Validate diagram"
                title="Validate Diagram">
          <svg class="toolbar-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
            <polyline points="22 4 12 14.01 9 11.01"/>
          </svg>
          <span class="btn-label">Validate</span>
          @if (modelerService.validationErrors().length > 0) {
            <span class="error-badge">{{ modelerService.validationErrors().length }}</span>
          }
        </button>

        <button class="toolbar-btn"
                (click)="showHelp()"
                aria-label="Help"
                title="Keyboard Shortcuts (?)">
          <svg class="toolbar-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
            <line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
        </button>
      </div>

      <div class="toolbar-separator"></div>

      <!-- Print & XML Viewer -->
      <div class="toolbar-group">
        <button class="toolbar-btn"
                (click)="exportPdf()"
                aria-label="Export PDF"
                title="Export as PDF">
          <svg class="toolbar-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
            <path d="M9 13h6"/>
            <path d="M9 17h6"/>
          </svg>
          <span class="btn-label">PDF</span>
        </button>

        <button class="toolbar-btn"
                (click)="toggleXmlViewer()"
                [class.active]="showXmlViewer"
                aria-label="View XML"
                title="View/Edit XML Source">
          <svg class="toolbar-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="16 18 22 12 16 6"/>
            <polyline points="8 6 2 12 8 18"/>
          </svg>
          <span class="btn-label">XML</span>
        </button>
      </div>

    </div>

    <!-- Enhanced XML Viewer Modal -->
    @if (showXmlViewer) {
      <div class="xml-viewer-overlay" (click)="toggleXmlViewer()">
        <div class="xml-viewer-modal" (click)="$event.stopPropagation()">
          <div class="xml-viewer-header">
            <h3>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:20px;height:20px;margin-right:8px;vertical-align:middle;">
                <polyline points="16 18 22 12 16 6"/>
                <polyline points="8 6 2 12 8 18"/>
              </svg>
              BPMN XML Source
            </h3>
            <div class="xml-viewer-actions">
              <div class="xml-view-toggle">
                <button class="toggle-btn" [class.active]="xmlViewMode === 'formatted'" (click)="setXmlViewMode('formatted')" title="Formatted View">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="21" y1="10" x2="3" y2="10"/>
                    <line x1="21" y1="6" x2="3" y2="6"/>
                    <line x1="21" y1="14" x2="3" y2="14"/>
                    <line x1="21" y1="18" x2="3" y2="18"/>
                  </svg>
                </button>
                <button class="toggle-btn" [class.active]="xmlViewMode === 'raw'" (click)="setXmlViewMode('raw')" title="Raw Edit Mode">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                  </svg>
                </button>
              </div>
              <div class="xml-actions-divider"></div>
              <button class="xml-action-btn" (click)="formatXml()" title="Format/Prettify">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M21 10H7"/>
                  <path d="M11 6H3"/>
                  <path d="M21 14H3"/>
                  <path d="M15 18H3"/>
                </svg>
              </button>
              <button class="xml-action-btn" (click)="toggleAllSections()" title="Expand/Collapse All">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  @if (allExpanded) {
                    <polyline points="4 14 10 14 10 20"/>
                    <polyline points="20 10 14 10 14 4"/>
                    <line x1="14" y1="10" x2="21" y2="3"/>
                    <line x1="3" y1="21" x2="10" y2="14"/>
                  } @else {
                    <polyline points="15 3 21 3 21 9"/>
                    <polyline points="9 21 3 21 3 15"/>
                    <line x1="21" y1="3" x2="14" y2="10"/>
                    <line x1="3" y1="21" x2="10" y2="14"/>
                  }
                </svg>
              </button>
              <div class="xml-actions-divider"></div>
              <button class="xml-action-btn" (click)="copyXmlToClipboard()" title="Copy to clipboard">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                </svg>
              </button>
              <button class="xml-action-btn" (click)="downloadXml()" title="Download XML">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="7 10 12 15 17 10"/>
                  <line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
              </button>
              <button class="xml-action-btn close-btn" (click)="toggleXmlViewer()" title="Close">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
          </div>
          <div class="xml-viewer-content">
            @if (xmlViewMode === 'formatted') {
              <!-- Syntax Highlighted View -->
              <div class="xml-highlighted-view">
                <div class="line-numbers">
                  @for (line of xmlLines; track $index) {
                    <span class="line-number">{{ $index + 1 }}</span>
                  }
                </div>
                <div class="xml-code" #xmlCodeContainer>
                  @for (line of xmlLines; track $index) {
                    <div class="xml-line" [class.collapsed]="isLineCollapsed($index)">
                      @if (canCollapse(line)) {
                        <button class="collapse-btn" (click)="toggleCollapse($index)">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            @if (collapsedLines.has($index)) {
                              <polyline points="9 18 15 12 9 6"/>
                            } @else {
                              <polyline points="6 9 12 15 18 9"/>
                            }
                          </svg>
                        </button>
                      } @else {
                        <span class="collapse-spacer"></span>
                      }
                      <span class="xml-content" [innerHTML]="highlightXml(line)"></span>
                    </div>
                  }
                </div>
              </div>
            } @else {
              <!-- Raw Edit Mode -->
              <div class="xml-raw-view">
                <div class="line-numbers-raw">
                  @for (line of xmlLines; track $index) {
                    <span class="line-number">{{ $index + 1 }}</span>
                  }
                </div>
                <textarea
                  #xmlTextarea
                  class="xml-textarea"
                  [value]="xmlContent"
                  (input)="onXmlChange($event)"
                  (scroll)="syncScroll($event)"
                  spellcheck="false"></textarea>
              </div>
            }
          </div>
          <div class="xml-viewer-footer">
            <div class="xml-footer-info">
              <span class="xml-stats">{{ xmlLines.length }} lines · {{ xmlContent.length | number }} characters</span>
            </div>
            <div class="xml-footer-actions">
              <button class="xml-btn secondary" (click)="toggleXmlViewer()">Cancel</button>
              <button class="xml-btn primary" (click)="applyXmlChanges()" [disabled]="xmlViewMode === 'formatted'">
                Apply Changes
              </button>
            </div>
          </div>
          <!-- Copy Toast Notification -->
          @if (showCopyToast) {
            <div class="copy-toast">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              Copied to clipboard
            </div>
          }
        </div>
      </div>
    }

    <!-- Hidden file input for opening files -->
    <input type="file"
           #fileInput
           class="hidden-input"
           accept=".bpmn,.xml"
           (change)="onFileSelected($event)">

    <!-- Click outside handler for dropdowns -->
    @if (showMainMenu || showExportMenu) {
      <div class="dropdown-backdrop" (click)="closeAllMenus()"></div>
    }
  `,
  styleUrl: './bpmn-toolbar.component.scss'
})
export class BpmnToolbarComponent {
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  readonly modelerService = inject(BpmnModelerService);

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
  showCopyToast = false;

  private clipboard: any[] = [];
  private collapseMap = new Map<number, number>(); // Maps start line to end line
  private toastTimeout: ReturnType<typeof setTimeout> | null = null;

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
    if (this.modelerService.isDirty()) {
      if (!confirm('You have unsaved changes. Create new diagram anyway?')) {
        return;
      }
    }
    await this.modelerService.createNewDiagram();
    this.closeAllMenus();
  }

  triggerFileInput(): void {
    this.fileInput.nativeElement.click();
  }

  async onFileSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (file) {
      if (this.modelerService.isDirty()) {
        if (!confirm('You have unsaved changes. Open new file anyway?')) {
          input.value = '';
          return;
        }
      }

      try {
        const xml = await file.text();
        const success = await this.modelerService.importDiagram(xml);
        if (!success) {
          alert('Failed to import diagram. Please check the file format.');
        }
      } catch (error) {
        console.error('Error reading file:', error);
        alert('Error reading file. Please try again.');
      }
    }

    input.value = '';
  }

  async saveDiagram(): Promise<void> {
    const xml = await this.modelerService.saveDiagram();
    if (!xml) return;

    const processName = this.modelerService.currentProcess().name || 'process';
    const fileName = `${processName.toLowerCase().replace(/\s+/g, '-')}.bpmn`;

    this.downloadFile(xml, fileName, 'application/xml');
    this.closeAllMenus();
  }

  async exportBpmn(): Promise<void> {
    await this.saveDiagram();
    this.closeAllMenus();
  }

  async exportSvg(): Promise<void> {
    const svg = await this.modelerService.exportDiagram('svg');
    if (!svg) return;

    const processName = this.modelerService.currentProcess().name || 'process';
    const fileName = `${processName.toLowerCase().replace(/\s+/g, '-')}.svg`;

    this.downloadFile(svg as string, fileName, 'image/svg+xml');
    this.closeAllMenus();
  }

  async exportPng(): Promise<void> {
    // Convert SVG to PNG using canvas
    const svg = await this.modelerService.exportDiagram('svg') as string;
    if (!svg) return;

    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      // Create a blob URL for the SVG
      const svgBlob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(svgBlob);

      img.onload = () => {
        canvas.width = img.width || 1200;
        canvas.height = img.height || 800;

        // White background
        ctx!.fillStyle = '#ffffff';
        ctx!.fillRect(0, 0, canvas.width, canvas.height);

        ctx!.drawImage(img, 0, 0);
        URL.revokeObjectURL(url);

        canvas.toBlob((blob) => {
          if (blob) {
            const processName = this.modelerService.currentProcess().name || 'process';
            const fileName = `${processName.toLowerCase().replace(/\s+/g, '-')}.png`;
            const pngUrl = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = pngUrl;
            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(pngUrl);
          }
        }, 'image/png');
      };

      img.src = url;
    } catch (error) {
      console.error('Error exporting PNG:', error);
      alert('Error exporting PNG. Please try SVG export instead.');
    }

    this.closeAllMenus();
  }

  copySelection(): void {
    const modeler = this.modelerService.getModeler();
    if (!modeler) return;

    try {
      const selection = modeler.get('selection');
      const copyPaste = modeler.get('copyPaste');
      const selected = selection.get();

      if (selected.length > 0) {
        copyPaste.copy(selected);
        this.hasClipboard = true;
      }
    } catch (error) {
      console.warn('Copy not available:', error);
    }
  }

  pasteSelection(): void {
    const modeler = this.modelerService.getModeler();
    if (!modeler) return;

    try {
      const copyPaste = modeler.get('copyPaste');
      copyPaste.paste();
    } catch (error) {
      console.warn('Paste not available:', error);
    }
  }

  deleteSelection(): void {
    this.modelerService.deleteSelected();
  }

  validateDiagram(): void {
    const errors = this.modelerService.validate();
    if (errors.length === 0) {
      alert('Validation passed! No issues found.');
    }
  }

  showHelp(): void {
    // Dispatch keyboard event to trigger shortcuts help
    const event = new KeyboardEvent('keydown', { key: '?' });
    document.dispatchEvent(event);
  }

  async exportPdf(): Promise<void> {
    const svg = await this.modelerService.exportDiagram('svg') as string;
    if (!svg) return;

    try {
      // Create a new window for printing
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        alert('Please allow popups to export PDF');
        return;
      }

      const processName = this.modelerService.currentProcess().name || 'BPMN Process';

      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>${processName}</title>
          <style>
            @page {
              size: landscape;
              margin: 10mm;
            }
            body {
              margin: 0;
              padding: 20px;
              font-family: 'Segoe UI', Tahoma, sans-serif;
            }
            .header {
              text-align: center;
              margin-bottom: 20px;
              padding-bottom: 10px;
              border-bottom: 2px solid #047481;
            }
            .header h1 {
              margin: 0;
              color: #047481;
              font-size: 24px;
            }
            .header .date {
              color: #666;
              font-size: 12px;
              margin-top: 5px;
            }
            .diagram {
              text-align: center;
            }
            .diagram svg {
              max-width: 100%;
              height: auto;
            }
            @media print {
              body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>${processName}</h1>
            <div class="date">Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</div>
          </div>
          <div class="diagram">${svg}</div>
          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
                window.close();
              }, 500);
            };
          </script>
        </body>
        </html>
      `);
      printWindow.document.close();
    } catch (error) {
      console.error('Error exporting PDF:', error);
      alert('Error exporting PDF. Please try again.');
    }

    this.closeAllMenus();
  }

  async toggleXmlViewer(): Promise<void> {
    if (!this.showXmlViewer) {
      // Opening the viewer - load current XML
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

  onXmlChange(event: Event): void {
    const textarea = event.target as HTMLTextAreaElement;
    this.xmlContent = textarea.value;
    this.updateXmlLines();
  }

  setXmlViewMode(mode: 'formatted' | 'raw'): void {
    this.xmlViewMode = mode;
  }

  formatXml(): void {
    this.xmlContent = this.formatXmlString(this.xmlContent);
    this.updateXmlLines();
    this.buildCollapseMap();
  }

  private formatXmlString(xml: string): string {
    // Simple XML formatting
    let formatted = '';
    let indent = 0;
    const lines = xml.replace(/>\s*</g, '>\n<').split('\n');

    for (let line of lines) {
      line = line.trim();
      if (!line) continue;

      // Decrease indent for closing tags
      if (line.startsWith('</')) {
        indent = Math.max(0, indent - 1);
      }

      formatted += '  '.repeat(indent) + line + '\n';

      // Increase indent for opening tags (not self-closing, not closing)
      if (line.startsWith('<') && !line.startsWith('</') && !line.startsWith('<?') &&
          !line.endsWith('/>') && !line.includes('</')) {
        indent++;
      }
    }

    return formatted.trim();
  }

  private updateXmlLines(): void {
    this.xmlLines = this.xmlContent.split('\n');
  }

  private buildCollapseMap(): void {
    this.collapseMap.clear();
    const stack: { line: number; tag: string }[] = [];

    this.xmlLines.forEach((line, index) => {
      const trimmed = line.trim();

      // Opening tag (not self-closing)
      const openMatch = trimmed.match(/^<([a-zA-Z][a-zA-Z0-9:]*)/);
      if (openMatch && !trimmed.endsWith('/>') && !trimmed.startsWith('<?') && !trimmed.startsWith('<!')) {
        stack.push({ line: index, tag: openMatch[1] });
      }

      // Closing tag
      const closeMatch = trimmed.match(/^<\/([a-zA-Z][a-zA-Z0-9:]*)/);
      if (closeMatch) {
        // Find matching opening tag
        for (let i = stack.length - 1; i >= 0; i--) {
          if (stack[i].tag === closeMatch[1]) {
            const startLine = stack[i].line;
            if (index > startLine + 1) { // Only collapsible if more than 2 lines
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
    // Check if this line is within a collapsed section
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
      // Collapse all
      for (const start of this.collapseMap.keys()) {
        this.collapsedLines.add(start);
      }
      this.allExpanded = false;
    } else {
      // Expand all
      this.collapsedLines.clear();
      this.allExpanded = true;
    }
  }

  highlightXml(line: string): string {
    // XML syntax highlighting
    let highlighted = line;

    // Escape HTML first
    highlighted = highlighted
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    // Tag names
    highlighted = highlighted.replace(
      /&lt;(\/?)([\w:-]+)/g,
      '&lt;$1<span class="xml-tag">$2</span>'
    );

    // Attribute names
    highlighted = highlighted.replace(
      /\s([\w:-]+)=/g,
      ' <span class="xml-attr">$1</span>='
    );

    // Attribute values
    highlighted = highlighted.replace(
      /="([^"]*)"/g,
      '="<span class="xml-value">$1</span>"'
    );

    // Comments
    highlighted = highlighted.replace(
      /(&lt;!--.*?--&gt;)/g,
      '<span class="xml-comment">$1</span>'
    );

    // XML declaration
    highlighted = highlighted.replace(
      /(&lt;\?.*?\?&gt;)/g,
      '<span class="xml-declaration">$1</span>'
    );

    return highlighted;
  }

  syncScroll(event: Event): void {
    const textarea = event.target as HTMLTextAreaElement;
    const lineNumbers = textarea.parentElement?.querySelector('.line-numbers-raw');
    if (lineNumbers) {
      lineNumbers.scrollTop = textarea.scrollTop;
    }
  }

  async copyXmlToClipboard(): Promise<void> {
    try {
      await navigator.clipboard.writeText(this.xmlContent);
      // Show toast notification
      this.showCopyToast = true;
      if (this.toastTimeout) {
        clearTimeout(this.toastTimeout);
      }
      this.toastTimeout = setTimeout(() => {
        this.showCopyToast = false;
      }, 2000);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  }

  downloadXml(): void {
    const processName = this.modelerService.currentProcess().name || 'process';
    const fileName = `${processName.toLowerCase().replace(/\s+/g, '-')}.bpmn`;
    this.downloadFile(this.xmlContent, fileName, 'application/xml');
  }

  async applyXmlChanges(): Promise<void> {
    try {
      const success = await this.modelerService.importDiagram(this.xmlContent);
      if (success) {
        this.showXmlViewer = false;
      } else {
        alert('Invalid BPMN XML. Please check the syntax.');
      }
    } catch (error) {
      console.error('Error applying XML changes:', error);
      alert('Error applying changes. Please check the XML syntax.');
    }
  }

  private downloadFile(content: string, fileName: string, mimeType: string): void {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}
