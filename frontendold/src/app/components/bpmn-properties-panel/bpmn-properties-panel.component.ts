import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BpmnModelerService } from '../../services/bpmn-modeler.service';
import { COMPLIANCE_FRAMEWORKS, COMPLIANCE_STATUSES } from '../../models/bpmn-extensions.model';

@Component({
  selector: 'app-bpmn-properties-panel',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="properties-panel-container">
      <!-- Panel Header -->
      <header class="panel-header">
        <h3 class="panel-title">Properties</h3>
        <button class="panel-close-btn"
                (click)="modelerService.closePanel()"
                aria-label="Close panel"
                title="Close Panel">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </header>

      <!-- Panel Content -->
      <div class="panel-content">
        @if (modelerService.selectedElement(); as element) {
          <!-- Element Properties -->
          <section class="property-section">
            <h4 class="section-title">
              <svg class="section-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
              </svg>
              Element
            </h4>

            <div class="property-group">
              <label class="property-label" for="element-id">ID</label>
              <input type="text"
                     id="element-id"
                     class="form-control form-control-sm"
                     [value]="element.id"
                     readonly>
            </div>

            <div class="property-group">
              <label class="property-label" for="element-type">Type</label>
              <input type="text"
                     id="element-type"
                     class="form-control form-control-sm"
                     [value]="modelerService.formatElementType(element.type)"
                     readonly>
            </div>

            <div class="property-group">
              <label class="property-label" for="element-name">Name</label>
              <input type="text"
                     id="element-name"
                     class="form-control form-control-sm"
                     [ngModel]="element.name"
                     (ngModelChange)="updateElementName(element.id, $event)"
                     placeholder="Enter element name">
            </div>
          </section>

          <!-- Documentation Section -->
          <section class="property-section">
            <h4 class="section-title">
              <svg class="section-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="16" y1="13" x2="8" y2="13"/>
                <line x1="16" y1="17" x2="8" y2="17"/>
              </svg>
              Documentation
            </h4>

            <div class="property-group">
              <label class="property-label" for="element-docs">Description</label>
              <textarea id="element-docs"
                        class="form-control form-control-sm"
                        rows="3"
                        [ngModel]="getDocumentation(element)"
                        (ngModelChange)="updateDocumentation(element.id, $event)"
                        placeholder="Add description..."></textarea>
            </div>
          </section>

          <!-- RACI Section (for Tasks only) -->
          @if (modelerService.isTaskElement(element.type)) {
            <section class="property-section">
              <h4 class="section-title">
                <svg class="section-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                  <circle cx="9" cy="7" r="4"/>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                </svg>
                RACI Assignment
              </h4>

              @if (getRaci(element.id); as raci) {
                <div class="raci-grid">
                  <div class="raci-item">
                    <span class="raci-label raci-r">R</span>
                    <span class="raci-value">{{ raci.responsible.join(', ') || '-' }}</span>
                  </div>
                  <div class="raci-item">
                    <span class="raci-label raci-a">A</span>
                    <span class="raci-value">{{ raci.accountable || '-' }}</span>
                  </div>
                  <div class="raci-item">
                    <span class="raci-label raci-c">C</span>
                    <span class="raci-value">{{ raci.consulted.join(', ') || '-' }}</span>
                  </div>
                  <div class="raci-item">
                    <span class="raci-label raci-i">I</span>
                    <span class="raci-value">{{ raci.informed.join(', ') || '-' }}</span>
                  </div>
                </div>
              } @else {
                <p class="empty-state">No RACI assignment defined</p>
              }

              <button class="btn btn-sm btn-outline" (click)="editRaci(element.id)">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="btn-icon">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
                Edit RACI
              </button>
            </section>

            <!-- Compliance Tags -->
            <section class="property-section">
              <h4 class="section-title">
                <svg class="section-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                </svg>
                Compliance
              </h4>

              <div class="tag-list">
                @for (tag of getComplianceTags(element.id); track tag.id) {
                  <span class="compliance-tag" [class]="'status-' + tag.status">
                    {{ tag.framework }}: {{ tag.control }}
                  </span>
                }
                @empty {
                  <p class="empty-state">No compliance tags</p>
                }
              </div>

              <button class="btn btn-sm btn-outline" (click)="addComplianceTag(element.id)">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="btn-icon">
                  <line x1="12" y1="5" x2="12" y2="19"/>
                  <line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
                Add Tag
              </button>
            </section>
          }

        } @else {
          <!-- Process Properties (no selection) -->
          <section class="property-section">
            <h4 class="section-title">
              <svg class="section-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12 6 12 12 16 14"/>
              </svg>
              Process
            </h4>

            @if (modelerService.currentProcess(); as process) {
              <div class="property-group">
                <label class="property-label" for="process-name">Name</label>
                <input type="text"
                       id="process-name"
                       class="form-control form-control-sm"
                       [ngModel]="process.name"
                       (ngModelChange)="modelerService.updateProcessName($event)">
              </div>

              <div class="property-group">
                <label class="property-label" for="process-version">Version</label>
                <input type="text"
                       id="process-version"
                       class="form-control form-control-sm"
                       [ngModel]="process.version"
                       (ngModelChange)="modelerService.updateProcessVersion($event)">
              </div>

              <div class="property-group">
                <label class="property-label" for="process-status">Status</label>
                <select id="process-status"
                        class="form-control form-control-sm"
                        [ngModel]="process.status"
                        (ngModelChange)="modelerService.updateProcessStatus($event)">
                  <option value="draft">Draft</option>
                  <option value="review">In Review</option>
                  <option value="approved">Approved</option>
                  <option value="archived">Archived</option>
                </select>
              </div>

              <div class="property-group">
                <label class="property-label" for="process-owner">Owner</label>
                <input type="text"
                       id="process-owner"
                       class="form-control form-control-sm"
                       [ngModel]="process.owner"
                       (ngModelChange)="modelerService.updateProcessOwner($event)"
                       placeholder="Enter owner name">
              </div>

              <div class="property-group">
                <label class="property-label" for="process-desc">Description</label>
                <textarea id="process-desc"
                          class="form-control form-control-sm"
                          rows="3"
                          [ngModel]="process.description"
                          (ngModelChange)="modelerService.updateProcessDescription($event)"
                          placeholder="Enter process description..."></textarea>
              </div>
            }
          </section>

          <!-- Quality Score -->
          <section class="property-section">
            <h4 class="section-title">
              <svg class="section-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
              </svg>
              Quality Score
            </h4>

            <div class="quality-score-display">
              <div class="score-circle" [style.borderColor]="modelerService.qualityScoreColor()">
                <span class="score-value">{{ modelerService.processDocumentation().qualityScore.overall }}</span>
              </div>
              <div class="score-details">
                <div class="score-item">
                  <span class="score-item-label">Completeness</span>
                  <span class="score-item-value">{{ modelerService.processDocumentation().qualityScore.completeness }}%</span>
                </div>
                <div class="score-item">
                  <span class="score-item-label">Documentation</span>
                  <span class="score-item-value">{{ modelerService.processDocumentation().qualityScore.documentation }}%</span>
                </div>
                <div class="score-item">
                  <span class="score-item-label">Compliance</span>
                  <span class="score-item-value">{{ modelerService.processDocumentation().qualityScore.compliance }}%</span>
                </div>
              </div>
            </div>

            <button class="btn btn-sm btn-outline" (click)="recalculateScore()">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="btn-icon">
                <polyline points="1 4 1 10 7 10"/>
                <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/>
              </svg>
              Recalculate
            </button>
          </section>

          <!-- Validation Errors -->
          @if (modelerService.validationErrors().length > 0) {
            <section class="property-section">
              <h4 class="section-title error-title">
                <svg class="section-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" y1="8" x2="12" y2="12"/>
                  <line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                Validation Issues ({{ modelerService.validationErrors().length }})
              </h4>

              <ul class="validation-list">
                @for (error of modelerService.validationErrors(); track error.elementId) {
                  <li class="validation-item" [class]="'severity-' + error.severity">
                    <span class="validation-message">{{ error.message }}</span>
                    <span class="validation-element">{{ error.elementId }}</span>
                  </li>
                }
              </ul>

              <button class="btn btn-sm btn-outline" (click)="modelerService.clearValidationErrors()">
                Clear
              </button>
            </section>
          }
        }
      </div>
    </div>
  `,
  styleUrl: './bpmn-properties-panel.component.scss'
})
export class BpmnPropertiesPanelComponent {
  readonly modelerService = inject(BpmnModelerService);
  readonly complianceFrameworks = COMPLIANCE_FRAMEWORKS;
  readonly complianceStatuses = COMPLIANCE_STATUSES;

  updateElementName(elementId: string, name: string): void {
    this.modelerService.updateElementName(elementId, name);
  }

  getDocumentation(element: any): string {
    return this.modelerService.getElementDocumentation(element);
  }

  updateDocumentation(elementId: string, text: string): void {
    this.modelerService.updateElementDocumentation(elementId, text);
  }

  getRaci(elementId: string) {
    return this.modelerService.getRaciForElement(elementId);
  }

  editRaci(elementId: string): void {
    // TODO: Open RACI editor modal
    const name = this.modelerService.selectedElement()?.name || '';
    const responsible = prompt(`Enter Responsible for "${name}" (comma-separated):`, '');
    if (responsible !== null) {
      const accountable = prompt('Enter Accountable (single person):', '') || '';
      const consulted = prompt('Enter Consulted (comma-separated):', '') || '';
      const informed = prompt('Enter Informed (comma-separated):', '') || '';

      this.modelerService.updateRaci({
        activityId: elementId,
        activityName: name,
        responsible: responsible.split(',').map(s => s.trim()).filter(Boolean),
        accountable: accountable.trim(),
        consulted: consulted.split(',').map(s => s.trim()).filter(Boolean),
        informed: informed.split(',').map(s => s.trim()).filter(Boolean)
      });
    }
  }

  getComplianceTags(elementId: string) {
    return this.modelerService.getComplianceTagsForElement(elementId);
  }

  addComplianceTag(elementId: string): void {
    // TODO: Open compliance tag modal
    const framework = prompt('Enter compliance framework (e.g., GDPR, ISO27001, SOX):');
    if (framework) {
      const control = prompt('Enter control reference:') || '';
      const requirement = prompt('Enter requirement description:') || '';

      this.modelerService.addComplianceTag({
        id: `tag_${Date.now()}`,
        elementId,
        framework: framework as any,
        control,
        requirement,
        status: 'not-assessed'
      });
    }
  }

  recalculateScore(): void {
    this.modelerService.recalculateQualityScore();
  }
}
