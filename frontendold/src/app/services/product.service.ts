import { Injectable, signal, computed, inject } from '@angular/core';
import { Product, ProductCategory, Persona, createEmptyProduct } from '../models/product.model';
import { AuditService } from './audit.service';

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private readonly auditService = inject(AuditService);
  // State signals
  readonly products = signal<Product[]>([]);
  readonly selectedProductId = signal<string | null>(null);
  readonly isProductPanelOpen = signal(false);
  readonly productViewMode = signal<'list' | 'factsheet' | 'edit'>('list');
  readonly isAddModalOpen = signal(false);

  // Categories for the side menu
  readonly categories = signal<ProductCategory[]>([
    { id: 'all', name: 'All Products', icon: '📦', productCount: 0 },
    { id: 'core', name: 'Core', icon: '⚙️', productCount: 0 },
    { id: 'support', name: 'Support', icon: '🛠️', productCount: 0 },
    { id: 'management', name: 'Management', icon: '📊', productCount: 0 }
  ]);

  readonly selectedCategory = signal<string>('all');

  // Computed values
  readonly selectedProduct = computed(() => {
    const id = this.selectedProductId();
    if (!id) return null;
    return this.products().find(p => p.id === id) || null;
  });

  readonly filteredProducts = computed(() => {
    const category = this.selectedCategory();
    const allProducts = this.products();
    if (category === 'all') return allProducts;
    return allProducts.filter(p => p.category === category);
  });

  readonly productCount = computed(() => this.products().length);

  readonly categoriesWithCounts = computed(() => {
    const products = this.products();
    return this.categories().map(cat => ({
      ...cat,
      productCount: cat.id === 'all'
        ? products.length
        : products.filter(p => p.category === cat.id).length
    }));
  });

  // Actions
  openProductPanel(): void {
    this.isProductPanelOpen.set(true);
  }

  closeProductPanel(): void {
    this.isProductPanelOpen.set(false);
    this.selectedProductId.set(null);
    this.productViewMode.set('list');
  }

  openAddModal(): void {
    this.isAddModalOpen.set(true);
  }

  closeAddModal(): void {
    this.isAddModalOpen.set(false);
  }

  selectCategory(categoryId: string): void {
    this.selectedCategory.set(categoryId);
    this.selectedProductId.set(null);
    this.productViewMode.set('list');
  }

  selectProduct(productId: string): void {
    this.selectedProductId.set(productId);
    this.productViewMode.set('factsheet');
  }

  addProduct(): void {
    const newProduct = createEmptyProduct();
    newProduct.category = this.selectedCategory() === 'all' ? '' : this.selectedCategory();
    this.products.update(list => [...list, newProduct]);
    this.selectedProductId.set(newProduct.id);
    this.productViewMode.set('edit');
    this.auditService.logAction('product', newProduct.id, newProduct.name || 'Untitled Product', 'created', 'Product created');
  }

  /**
   * Create a product with provided data and log audit action
   */
  createProduct(productData: Partial<Product>): Product {
    const newProduct = createEmptyProduct();
    Object.assign(newProduct, productData);
    this.products.update(list => [...list, newProduct]);
    this.auditService.logAction('product', newProduct.id, newProduct.name || 'Untitled Product', 'created', 'Product created');
    return newProduct;
  }

  updateProduct(productId: string, updates: Partial<Product>): void {
    const product = this.products().find(p => p.id === productId);
    this.products.update(list =>
      list.map(p => p.id === productId
        ? { ...p, ...updates, updatedAt: new Date().toISOString() }
        : p
      )
    );
    if (product) {
      this.auditService.logAction('product', productId, product.name || 'Untitled Product', 'updated', 'Updated product details');
    }
  }

  updateProductFactSheet(productId: string, updates: Partial<Product['factSheet']>): void {
    const product = this.products().find(p => p.id === productId);
    this.products.update(list =>
      list.map(p => p.id === productId
        ? {
            ...p,
            factSheet: { ...p.factSheet, ...updates },
            updatedAt: new Date().toISOString()
          }
        : p
      )
    );
    if (product) {
      this.auditService.logAction('product', productId, product.name || 'Untitled Product', 'updated', 'Updated product fact sheet');
    }
  }

  deleteProduct(productId: string): void {
    const product = this.products().find(p => p.id === productId);
    if (product) {
      this.auditService.logAction('product', productId, product.name || 'Untitled Product', 'deleted', 'Product deleted');
      // Clear audit logs for the product and its personas
      this.auditService.clearLogsForEntity('product', productId);
      product.personas.forEach(persona => {
        this.auditService.clearLogsForEntity('persona', persona.id);
      });
    }
    this.products.update(list => list.filter(p => p.id !== productId));
    if (this.selectedProductId() === productId) {
      this.selectedProductId.set(null);
      this.productViewMode.set('list');
    }
  }

  duplicateProduct(productId: string): void {
    const product = this.products().find(p => p.id === productId);
    if (!product) return;

    const newProduct: Product = {
      ...product,
      id: crypto.randomUUID(),
      name: `${product.name} (Copy)`,
      status: 'planned',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      factSheet: { ...product.factSheet },
      tags: [...product.tags]
    };

    this.products.update(list => [...list, newProduct]);
    this.selectedProductId.set(newProduct.id);
    this.auditService.logAction('product', newProduct.id, newProduct.name, 'created', `Product duplicated from "${product.name}"`);
  }

  setViewMode(mode: 'list' | 'factsheet' | 'edit'): void {
    this.productViewMode.set(mode);
  }

  // Tag management
  addProductTag(productId: string, tag: string): void {
    this.products.update(list =>
      list.map(p => p.id === productId
        ? { ...p, tags: [...p.tags, tag] }
        : p
      )
    );
  }

  removeProductTag(productId: string, index: number): void {
    this.products.update(list =>
      list.map(p => p.id === productId
        ? { ...p, tags: p.tags.filter((_, i) => i !== index) }
        : p
      )
    );
  }

  // Feature management
  addKeyFeature(productId: string, feature: string): void {
    this.products.update(list =>
      list.map(p => p.id === productId
        ? { ...p, factSheet: { ...p.factSheet, keyFeatures: [...p.factSheet.keyFeatures, feature] } }
        : p
      )
    );
  }

  removeKeyFeature(productId: string, index: number): void {
    this.products.update(list =>
      list.map(p => p.id === productId
        ? { ...p, factSheet: { ...p.factSheet, keyFeatures: p.factSheet.keyFeatures.filter((_, i) => i !== index) } }
        : p
      )
    );
  }

  // Integration management
  addIntegration(productId: string, integration: string): void {
    this.products.update(list =>
      list.map(p => p.id === productId
        ? { ...p, factSheet: { ...p.factSheet, integrations: [...p.factSheet.integrations, integration] } }
        : p
      )
    );
  }

  removeIntegration(productId: string, index: number): void {
    this.products.update(list =>
      list.map(p => p.id === productId
        ? { ...p, factSheet: { ...p.factSheet, integrations: p.factSheet.integrations.filter((_, i) => i !== index) } }
        : p
      )
    );
  }

  // Persona management
  addPersona(productId: string, persona: Persona): void {
    this.products.update(list =>
      list.map(p => p.id === productId
        ? { ...p, personas: [...p.personas, persona], updatedAt: new Date().toISOString() }
        : p
      )
    );
    this.auditService.logAction('persona', persona.id, persona.name || 'Unnamed Persona', 'created', `Added persona "${persona.name || 'Unnamed'}"`);
  }

  updatePersona(productId: string, personaId: string, updates: Partial<Persona>): void {
    const product = this.products().find(p => p.id === productId);
    const persona = product?.personas.find(per => per.id === personaId);
    this.products.update(list =>
      list.map(p => p.id === productId
        ? {
            ...p,
            personas: p.personas.map(per =>
              per.id === personaId ? { ...per, ...updates } : per
            ),
            updatedAt: new Date().toISOString()
          }
        : p
      )
    );
    if (persona) {
      this.auditService.logAction('persona', personaId, persona.name || 'Unnamed Persona', 'updated', 'Updated persona details');
    }
  }

  deletePersona(productId: string, personaId: string): void {
    const product = this.products().find(p => p.id === productId);
    const persona = product?.personas.find(per => per.id === personaId);
    if (persona) {
      this.auditService.logAction('persona', personaId, persona.name || 'Unnamed Persona', 'deleted', 'Persona deleted');
      this.auditService.clearLogsForEntity('persona', personaId);
    }
    this.products.update(list =>
      list.map(p => p.id === productId
        ? { ...p, personas: p.personas.filter(per => per.id !== personaId), updatedAt: new Date().toISOString() }
        : p
      )
    );
  }

  getPersona(productId: string, personaId: string): Persona | undefined {
    const product = this.products().find(p => p.id === productId);
    return product?.personas.find(persona => persona.id === personaId);
  }
}
