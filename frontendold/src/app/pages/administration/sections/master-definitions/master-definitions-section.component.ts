import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  ObjectType,
  ObjectTypeProperty,
  ObjectTypeView,
  generateUUID
} from '../../models/administration.models';

@Component({
  selector: 'app-master-definitions-section',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
          <!-- Master Definitions List View -->
          @if (objectTypeView() === 'list') {
            <section class="manager-section">
              <header class="manager-header">
                <div class="header-info">
                  <h1 class="manager-title">Master Definitions</h1>
                  <p class="manager-description">Define and manage master data model definitions for your application</p>
                </div>
                <div class="header-actions">
                  <button class="btn btn-primary" (click)="startCreateObjectType()">
                    <img src="assets/icons/plus.svg" alt="" aria-hidden="true" class="btn-icon">
                    Create Object Type
                  </button>
                </div>
              </header>

              @if (objectTypes().length === 0) {
                <!-- Empty State -->
                <div class="empty-state">
                  <div class="empty-state-icon">
                    <img src="assets/icons/layers.svg" alt="" aria-hidden="true">
                  </div>
                  <h2 class="empty-state-title">No Object Types Defined</h2>
                  <p class="empty-state-desc">Create your first object type to define the data model for your application.</p>
                  <button class="btn btn-primary" (click)="startCreateObjectType()">
                    <img src="assets/icons/plus.svg" alt="" aria-hidden="true" class="btn-icon">
                    Create Object Type
                  </button>
                </div>
              } @else {
                <!-- Object Types Grid -->
                <div class="object-types-grid">
                  @for (objectType of objectTypes(); track objectType.id) {
                    <div class="object-type-card">
                      <div class="object-type-header">
                        <div class="object-type-icon" [style.background-color]="objectType.color">
                          <img [src]="'assets/icons/' + objectType.icon + '.svg'" alt="" aria-hidden="true">
                        </div>
                        <div class="object-type-info">
                          <h3 class="object-type-name">{{ objectType.name }}</h3>
                          <code class="object-type-code">{{ objectType.code }}</code>
                        </div>
                      </div>
                      <p class="object-type-desc">{{ objectType.description || 'No description provided' }}</p>
                      <div class="object-type-meta">
                        <span class="meta-item">
                          <img src="assets/icons/layers.svg" alt="" aria-hidden="true" class="meta-icon">
                          {{ objectType.properties.length }} properties
                        </span>
                      </div>
                      <div class="object-type-actions">
                        <button class="btn btn-outline-secondary btn-sm" (click)="viewObjectType(objectType)">View</button>
                        <button class="btn btn-outline-secondary btn-sm" (click)="startEditObjectType(objectType)">Edit</button>
                        <button class="btn btn-outline-danger btn-sm" (click)="confirmDeleteObjectType(objectType)">Delete</button>
                      </div>
                    </div>
                  }
                </div>
              }
            </section>
          }

          <!-- Object Type Detail View -->
          @if (objectTypeView() === 'detail' && selectedObjectType()) {
            <section class="manager-section">
              <header class="manager-header">
                <div class="header-info">
                  <button class="btn-back" (click)="objectTypeView.set('list')">
                    <img src="assets/icons/arrow-left.svg" alt="" aria-hidden="true">
                    Back to Object Types
                  </button>
                </div>
                <div class="header-actions">
                  <button class="btn btn-outline-secondary" (click)="startEditObjectType(selectedObjectType()!)">
                    <img src="assets/icons/edit.svg" alt="" aria-hidden="true" class="btn-icon-dark">
                    Edit
                  </button>
                  <button class="btn btn-outline-danger" (click)="confirmDeleteObjectType(selectedObjectType()!)">
                    <img src="assets/icons/times.svg" alt="" aria-hidden="true" class="btn-icon-dark">
                    Delete
                  </button>
                </div>
              </header>

              <div class="object-type-detail">
                <div class="detail-header">
                  <div class="object-type-icon object-type-icon-lg" [style.background-color]="selectedObjectType()!.color">
                    <img [src]="'assets/icons/' + selectedObjectType()!.icon + '.svg'" alt="" aria-hidden="true">
                  </div>
                  <div class="detail-title">
                    <h1 class="object-type-name-lg">{{ selectedObjectType()!.name }}</h1>
                    <code class="object-type-code-lg">{{ selectedObjectType()!.code }}</code>
                  </div>
                </div>

                @if (selectedObjectType()!.description) {
                  <p class="detail-description">{{ selectedObjectType()!.description }}</p>
                }

                <section class="detail-section">
                  <h2 class="detail-section-title">Properties ({{ selectedObjectType()!.properties.length }})</h2>
                  @if (selectedObjectType()!.properties.length === 0) {
                    <p class="empty-text">No properties defined for this object type.</p>
                  } @else {
                    <table class="properties-table">
                      <thead>
                        <tr>
                          <th>Name</th>
                          <th>Type</th>
                          <th>Required</th>
                          <th>Description</th>
                        </tr>
                      </thead>
                      <tbody>
                        @for (prop of selectedObjectType()!.properties; track prop.id) {
                          <tr>
                            <td class="prop-name">{{ prop.name }}</td>
                            <td><span class="type-badge">{{ prop.type }}</span></td>
                            <td>
                              @if (prop.required) {
                                <span class="required-badge">Required</span>
                              } @else {
                                <span class="optional-badge">Optional</span>
                              }
                            </td>
                            <td class="prop-desc">{{ prop.description || '-' }}</td>
                          </tr>
                        }
                      </tbody>
                    </table>
                  }
                </section>

                <section class="detail-section">
                  <h2 class="detail-section-title">Metadata</h2>
                  <div class="metadata-grid">
                    <div class="metadata-item">
                      <span class="metadata-label">Created</span>
                      <span class="metadata-value">{{ selectedObjectType()!.createdAt | date:'medium' }}</span>
                    </div>
                    <div class="metadata-item">
                      <span class="metadata-label">Last Updated</span>
                      <span class="metadata-value">{{ selectedObjectType()!.updatedAt | date:'medium' }}</span>
                    </div>
                  </div>
                </section>
              </div>
            </section>
          }

          <!-- Object Type Create/Edit Form -->
          @if (objectTypeView() === 'create' || objectTypeView() === 'edit') {
            <section class="manager-section">
              <header class="manager-header">
                <div class="header-info">
                  <button class="btn-back" (click)="cancelObjectTypeForm()">
                    <img src="assets/icons/arrow-left.svg" alt="" aria-hidden="true">
                    Cancel
                  </button>
                </div>
              </header>

              <div class="form-container">
                <div class="form-header">
                  <h1 class="form-title">{{ objectTypeView() === 'create' ? 'Create New Object Type' : 'Edit Object Type' }}</h1>
                  <p class="form-subtitle">Define the structure and properties of your object type</p>
                </div>

                <div class="form-body">
                  <!-- Basic Information -->
                  <section class="form-section">
                    <h2 class="form-section-title">Basic Information</h2>

                    <div class="form-row">
                      <div class="form-group">
                        <label class="form-label required" for="ot-name">Name</label>
                        <input type="text" class="form-control" id="ot-name"
                               [(ngModel)]="objectTypeForm.name" placeholder="e.g., Customer, Product, Order">
                      </div>
                      <div class="form-group">
                        <label class="form-label required" for="ot-code">Code</label>
                        <input type="text" class="form-control" id="ot-code"
                               [(ngModel)]="objectTypeForm.code" placeholder="e.g., CUSTOMER, PRODUCT">
                        <small class="form-hint">Unique identifier (will be uppercase)</small>
                      </div>
                    </div>

                    <div class="form-group">
                      <label class="form-label" for="ot-desc">Description</label>
                      <textarea class="form-control" id="ot-desc" rows="3"
                                [(ngModel)]="objectTypeForm.description" placeholder="Describe the purpose of this object type..."></textarea>
                    </div>

                    <div class="form-row">
                      <div class="form-group">
                        <label class="form-label">Icon</label>
                        <div class="icon-selector">
                          @for (icon of iconOptions; track icon) {
                            <button type="button" class="icon-option"
                                    [class.selected]="objectTypeForm.icon === icon"
                                    (click)="objectTypeForm.icon = icon">
                              <img [src]="'assets/icons/' + icon + '.svg'" [alt]="icon">
                            </button>
                          }
                        </div>
                      </div>
                      <div class="form-group">
                        <label class="form-label">Color</label>
                        <div class="color-selector">
                          @for (color of colorOptions; track color) {
                            <button type="button" class="color-option"
                                    [class.selected]="objectTypeForm.color === color"
                                    [style.background-color]="color"
                                    (click)="objectTypeForm.color = color">
                            </button>
                          }
                        </div>
                      </div>
                    </div>
                  </section>

                  <!-- Properties Section -->
                  <section class="form-section">
                    <h2 class="form-section-title">Properties</h2>
                    <p class="form-section-desc">Define the fields that make up this object type</p>

                    <!-- Existing Properties -->
                    @if (objectTypeForm.properties && objectTypeForm.properties.length > 0) {
                      <div class="properties-list">
                        @for (prop of objectTypeForm.properties; track prop.id; let i = $index) {
                          <div class="property-item">
                            <div class="property-drag">
                              <button type="button" class="btn-reorder" (click)="movePropertyUp(i)" [disabled]="i === 0">
                                <img src="assets/icons/arrow-left.svg" alt="Move up" style="transform: rotate(90deg)">
                              </button>
                              <button type="button" class="btn-reorder" (click)="movePropertyDown(i)" [disabled]="i === objectTypeForm.properties!.length - 1">
                                <img src="assets/icons/arrow-left.svg" alt="Move down" style="transform: rotate(-90deg)">
                              </button>
                            </div>
                            <div class="property-info">
                              <span class="property-name">{{ prop.name }}</span>
                              <span class="property-type">{{ prop.type }}</span>
                              @if (prop.required) {
                                <span class="required-indicator">Required</span>
                              }
                            </div>
                            <button type="button" class="btn-remove" (click)="removeProperty(prop.id)">
                              <img src="assets/icons/times.svg" alt="Remove">
                            </button>
                          </div>
                        }
                      </div>
                    }

                    <!-- Add New Property -->
                    <div class="add-property-form">
                      <h3 class="add-property-title">Add Property</h3>
                      <div class="property-form-grid">
                        <div class="form-group">
                          <label class="form-label" for="prop-name">Property Name</label>
                          <input type="text" class="form-control" id="prop-name"
                                 [(ngModel)]="newProperty.name" placeholder="e.g., firstName, email">
                        </div>
                        <div class="form-group">
                          <label class="form-label" for="prop-type">Type</label>
                          <select class="form-select" id="prop-type" [(ngModel)]="newProperty.type">
                            @for (type of propertyTypes; track type.value) {
                              <option [value]="type.value">{{ type.label }}</option>
                            }
                          </select>
                        </div>
                        <div class="form-group">
                          <label class="form-label" for="prop-desc">Description</label>
                          <input type="text" class="form-control" id="prop-desc"
                                 [(ngModel)]="newProperty.description" placeholder="Optional description">
                        </div>
                        <div class="form-group form-group-checkbox">
                          <label class="checkbox-label">
                            <input type="checkbox" [(ngModel)]="newProperty.required">
                            <span>Required field</span>
                          </label>
                        </div>
                      </div>
                      <button type="button" class="btn btn-outline-primary btn-sm" (click)="addProperty()" [disabled]="!newProperty.name">
                        <img src="assets/icons/plus.svg" alt="" aria-hidden="true" class="btn-icon-dark">
                        Add Property
                      </button>
                    </div>
                  </section>
                </div>

                <!-- Form Actions -->
                <div class="form-actions form-actions-end">
                  <button class="btn btn-outline-secondary" (click)="cancelObjectTypeForm()">Cancel</button>
                  @if (objectTypeView() === 'create') {
                    <button class="btn btn-primary" (click)="saveObjectType()" [disabled]="!canSaveObjectType()">
                      <img src="assets/icons/check.svg" alt="" aria-hidden="true" class="btn-icon">
                      Create Object Type
                    </button>
                  } @else {
                    <button class="btn btn-primary" (click)="updateObjectType()" [disabled]="!canSaveObjectType()">
                      <img src="assets/icons/check.svg" alt="" aria-hidden="true" class="btn-icon">
                      Save Changes
                    </button>
                  }
                </div>
              </div>
            </section>
          }

          <!-- Delete Confirmation Modal -->
          @if (showDeleteConfirm() && objectTypeToDelete()) {
            <div class="modal-overlay" (click)="cancelDeleteObjectType()">
              <div class="confirm-modal" (click)="$event.stopPropagation()">
                <div class="confirm-icon confirm-icon-danger">
                  <img src="assets/icons/times.svg" alt="" aria-hidden="true">
                </div>
                <h2 class="confirm-title">Delete Object Type?</h2>
                <p class="confirm-message">
                  Are you sure you want to delete <strong>{{ objectTypeToDelete()!.name }}</strong>?
                  This action cannot be undone.
                </p>
                <div class="confirm-actions">
                  <button class="btn btn-outline-secondary" (click)="cancelDeleteObjectType()">Cancel</button>
                  <button class="btn btn-danger" (click)="deleteObjectType()">Delete</button>
                </div>
              </div>
            </div>
          }
  `,
  styles: [`
    @use '../../administration.styles' as *;
    :host { display: contents; }
  `]
})
export class MasterDefinitionsSectionComponent {
  // Object Types state
  objectTypeView = signal<ObjectTypeView>('list');
  objectTypes = signal<ObjectType[]>([]);
  selectedObjectType = signal<ObjectType | null>(null);
  editingObjectType = signal<ObjectType | null>(null);
  showDeleteConfirm = signal<boolean>(false);
  objectTypeToDelete = signal<ObjectType | null>(null);

  objectTypeForm: Partial<ObjectType> = {
    name: '',
    code: '',
    description: '',
    icon: 'box',
    color: '#047481',
    properties: []
  };

  newProperty: Partial<ObjectTypeProperty> = {
    name: '',
    type: 'string',
    required: false,
    description: ''
  };

  propertyTypes = [
    { value: 'string', label: 'Text (Single Line)' },
    { value: 'text', label: 'Text (Multi-line)' },
    { value: 'number', label: 'Number' },
    { value: 'boolean', label: 'Boolean (Yes/No)' },
    { value: 'date', label: 'Date' },
    { value: 'email', label: 'Email' },
    { value: 'url', label: 'URL' },
    { value: 'enum', label: 'Dropdown (Enum)' },
    { value: 'reference', label: 'Reference (Link)' }
  ];

  iconOptions = ['box', 'briefcase', 'building', 'user', 'cog', 'layers', 'clock', 'edit', 'search', 'star'];
  colorOptions = ['#047481', '#6366f1', '#f59e0b', '#10b981', '#7c3aed', '#ec4899', '#0ea5e9', '#64748b', '#ef4444', '#84cc16'];

  // Object Types CRUD Methods
  startCreateObjectType(): void {
    this.objectTypeForm = {
      name: '',
      code: '',
      description: '',
      icon: 'box',
      color: '#047481',
      properties: []
    };
    this.objectTypeView.set('create');
  }

  startEditObjectType(objectType: ObjectType): void {
    this.editingObjectType.set(objectType);
    this.objectTypeForm = {
      name: objectType.name,
      code: objectType.code,
      description: objectType.description,
      icon: objectType.icon,
      color: objectType.color,
      properties: [...objectType.properties]
    };
    this.objectTypeView.set('edit');
  }

  viewObjectType(objectType: ObjectType): void {
    this.selectedObjectType.set(objectType);
    this.objectTypeView.set('detail');
  }

  saveObjectType(): void {
    if (!this.objectTypeForm.name || !this.objectTypeForm.code) return;

    const now = new Date();
    const newObjectType: ObjectType = {
      id: generateUUID(),
      name: this.objectTypeForm.name!,
      code: this.objectTypeForm.code!.toUpperCase().replace(/\s+/g, '_'),
      description: this.objectTypeForm.description || '',
      icon: this.objectTypeForm.icon || 'box',
      color: this.objectTypeForm.color || '#047481',
      properties: this.objectTypeForm.properties || [],
      createdAt: now,
      updatedAt: now
    };

    this.objectTypes.update(types => [...types, newObjectType]);
    this.resetObjectTypeForm();
    this.objectTypeView.set('list');
  }

  updateObjectType(): void {
    const editing = this.editingObjectType();
    if (!editing || !this.objectTypeForm.name || !this.objectTypeForm.code) return;

    this.objectTypes.update(types =>
      types.map(t => t.id === editing.id ? {
        ...t,
        name: this.objectTypeForm.name!,
        code: this.objectTypeForm.code!.toUpperCase().replace(/\s+/g, '_'),
        description: this.objectTypeForm.description || '',
        icon: this.objectTypeForm.icon || 'box',
        color: this.objectTypeForm.color || '#047481',
        properties: this.objectTypeForm.properties || [],
        updatedAt: new Date()
      } : t)
    );

    this.resetObjectTypeForm();
    this.editingObjectType.set(null);
    this.objectTypeView.set('list');
  }

  confirmDeleteObjectType(objectType: ObjectType): void {
    this.objectTypeToDelete.set(objectType);
    this.showDeleteConfirm.set(true);
  }

  deleteObjectType(): void {
    const toDelete = this.objectTypeToDelete();
    if (!toDelete) return;

    this.objectTypes.update(types => types.filter(t => t.id !== toDelete.id));
    this.showDeleteConfirm.set(false);
    this.objectTypeToDelete.set(null);

    if (this.selectedObjectType()?.id === toDelete.id) {
      this.selectedObjectType.set(null);
      this.objectTypeView.set('list');
    }
  }

  cancelDeleteObjectType(): void {
    this.showDeleteConfirm.set(false);
    this.objectTypeToDelete.set(null);
  }

  cancelObjectTypeForm(): void {
    this.resetObjectTypeForm();
    this.editingObjectType.set(null);
    this.objectTypeView.set('list');
  }

  private resetObjectTypeForm(): void {
    this.objectTypeForm = {
      name: '',
      code: '',
      description: '',
      icon: 'box',
      color: '#047481',
      properties: []
    };
    this.newProperty = {
      name: '',
      type: 'string',
      required: false,
      description: ''
    };
  }

  // Property management
  addProperty(): void {
    if (!this.newProperty.name) return;

    const property: ObjectTypeProperty = {
      id: generateUUID(),
      name: this.newProperty.name!,
      type: this.newProperty.type as ObjectTypeProperty['type'] || 'string',
      required: this.newProperty.required || false,
      description: this.newProperty.description || '',
      defaultValue: this.newProperty.defaultValue,
      enumValues: this.newProperty.enumValues,
      referenceType: this.newProperty.referenceType
    };

    this.objectTypeForm.properties = [...(this.objectTypeForm.properties || []), property];
    this.newProperty = {
      name: '',
      type: 'string',
      required: false,
      description: ''
    };
  }

  removeProperty(propertyId: string): void {
    this.objectTypeForm.properties = (this.objectTypeForm.properties || []).filter(p => p.id !== propertyId);
  }

  movePropertyUp(index: number): void {
    if (index <= 0 || !this.objectTypeForm.properties) return;
    const props = [...this.objectTypeForm.properties];
    [props[index - 1], props[index]] = [props[index], props[index - 1]];
    this.objectTypeForm.properties = props;
  }

  movePropertyDown(index: number): void {
    if (!this.objectTypeForm.properties || index >= this.objectTypeForm.properties.length - 1) return;
    const props = [...this.objectTypeForm.properties];
    [props[index], props[index + 1]] = [props[index + 1], props[index]];
    this.objectTypeForm.properties = props;
  }

  canSaveObjectType(): boolean {
    return !!(this.objectTypeForm.name && this.objectTypeForm.code);
  }
}
