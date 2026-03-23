import { Component, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProductService } from '../../../../services/product.service';
import { AuditService } from '../../../../services/audit.service';
import { AuditEntry } from '../../../../models/audit.model';
import { createEmptyPersona } from '../../../../models/product.model';

@Component({
  selector: 'app-product-factsheet',
  standalone: true,
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './product-factsheet.component.html',
  styleUrl: './product-factsheet.component.scss'
})
export class ProductFactsheetComponent {
  readonly productService = inject(ProductService);
  readonly auditService = inject(AuditService);

  // Signals for state
  activeTab = signal<'overview' | 'personas' | 'processes' | 'journeys' | 'architecture' | 'backlog' | 'history'>('overview');

  // Persona state
  isPersonaModalOpen = signal(false);
  editingPersonaId = signal<string | null>(null);
  selectedPersonaId = signal<string | null>(null);
  personaViewMode = signal<'list' | 'detail' | 'edit'>('list');
  activePersonaTab = signal<'general' | 'journeys' | 'stories' | 'history'>('general');
  personaForm = {
    code: '',
    name: '',
    type: 'internal' as 'internal' | 'external',
    description: '',
    icon: ''
  };

  getCategoryName(categoryId: string): string {
    const cat = this.productService.categories().find(c => c.id === categoryId);
    return cat?.name || 'Uncategorized';
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      'planned': 'Planned',
      'under_development': 'Under Development',
      'production': 'Production',
      'retired': 'Retired'
    };
    return labels[status] || status;
  }

  setActiveTab(tab: 'overview' | 'personas' | 'processes' | 'journeys' | 'architecture' | 'backlog' | 'history'): void {
    this.activeTab.set(tab);
  }

  toggleCurrentStatus(): void {
    const product = this.productService.selectedProduct();
    if (product) {
      const newStatus = product.status === 'production' ? 'retired' : 'production';
      this.productService.updateProduct(product.id, { status: newStatus });
    }
  }

  copyToClipboard(text: string): void {
    navigator.clipboard.writeText(text).then(() => {
      // Could add a toast notification here
    });
  }

  // Persona methods
  openPersonaModal(): void {
    this.resetPersonaForm();
    this.editingPersonaId.set(null);
    this.isPersonaModalOpen.set(true);
  }

  closePersonaModal(): void {
    this.isPersonaModalOpen.set(false);
    this.editingPersonaId.set(null);
    this.resetPersonaForm();
  }

  resetPersonaForm(): void {
    this.personaForm = {
      code: '',
      name: '',
      type: 'internal',
      description: '',
      icon: ''
    };
  }

  viewPersona(personaId: string): void {
    this.selectedPersonaId.set(personaId);
    this.personaViewMode.set('detail');
    this.activePersonaTab.set('general');
  }

  backToPersonaList(): void {
    this.selectedPersonaId.set(null);
    this.personaViewMode.set('list');
  }

  getSelectedPersona() {
    const productId = this.productService.selectedProductId();
    const personaId = this.selectedPersonaId();
    if (!productId || !personaId) return null;
    return this.productService.getPersona(productId, personaId) || null;
  }

  openEditPersonaModal(): void {
    const persona = this.getSelectedPersona();
    if (persona) {
      this.personaForm = {
        code: persona.code,
        name: persona.name,
        type: persona.type,
        description: persona.description,
        icon: persona.icon
      };
      this.editingPersonaId.set(persona.id);
      this.isPersonaModalOpen.set(true);
    }
  }

  savePersona(): void {
    const productId = this.productService.selectedProductId();
    if (!productId || !this.personaForm.name.trim()) return;

    if (this.editingPersonaId()) {
      // Update existing persona
      this.productService.updatePersona(productId, this.editingPersonaId()!, {
        code: this.personaForm.code.trim(),
        name: this.personaForm.name.trim(),
        type: this.personaForm.type,
        description: this.personaForm.description.trim(),
        icon: this.personaForm.icon
      });
    } else {
      // Add new persona with auto-generated code
      const newPersona = createEmptyPersona();
      const personaCount = this.productService.selectedProduct()?.personas.length || 0;
      newPersona.code = `PER-${String(personaCount + 1).padStart(3, '0')}`;
      newPersona.name = this.personaForm.name.trim();
      newPersona.type = this.personaForm.type;
      newPersona.description = this.personaForm.description.trim();
      newPersona.icon = this.personaForm.icon;
      this.productService.addPersona(productId, newPersona);
    }

    this.closePersonaModal();
  }

  deletePersona(personaId: string): void {
    const productId = this.productService.selectedProductId();
    if (!productId) return;

    if (confirm('Are you sure you want to delete this persona?')) {
      this.productService.deletePersona(productId, personaId);
    }
  }

  onPersonaIconSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      if (file.size > 2 * 1024 * 1024) {
        alert('File size must be less than 2MB');
        return;
      }
      const reader = new FileReader();
      reader.onload = (e) => {
        this.personaForm.icon = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  // Audit/History methods
  getProductHistory(): AuditEntry[] {
    const product = this.productService.selectedProduct();
    if (!product) return [];
    const personaIds = product.personas.map(p => p.id);
    return this.auditService.getLogsForProductWithPersonas(product.id, personaIds);
  }

  getProductHistoryCount(): number {
    const product = this.productService.selectedProduct();
    if (!product) return 0;
    const personaIds = product.personas.map(p => p.id);
    return this.auditService.getLogCountForProductWithPersonas(product.id, personaIds);
  }

  getPersonaHistory(): AuditEntry[] {
    const personaId = this.selectedPersonaId();
    if (!personaId) return [];
    return this.auditService.getLogsForEntity('persona', personaId);
  }

  getPersonaHistoryCount(): number {
    const personaId = this.selectedPersonaId();
    if (!personaId) return 0;
    return this.auditService.getLogCountForEntity('persona', personaId);
  }

  formatAuditTimestamp(timestamp: string): string {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) {
      return 'Just now';
    } else if (diffMins < 60) {
      return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    } else if (diffDays < 7) {
      return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    } else {
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
      });
    }
  }
}
