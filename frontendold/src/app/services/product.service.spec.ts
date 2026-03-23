import { TestBed } from '@angular/core/testing';
import { ProductService } from './product.service';
import { AuditService } from './audit.service';
import { Persona } from '../models/product.model';

describe('ProductService', () => {
  let service: ProductService;
  let auditServiceSpy: jasmine.SpyObj<AuditService>;

  beforeEach(() => {
    const spy = jasmine.createSpyObj('AuditService', ['logAction', 'clearLogsForEntity']);

    TestBed.configureTestingModule({
      providers: [
        ProductService,
        { provide: AuditService, useValue: spy }
      ]
    });

    service = TestBed.inject(ProductService);
    auditServiceSpy = TestBed.inject(AuditService) as jasmine.SpyObj<AuditService>;
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // ===========================================================================
  // Initialization Tests
  // ===========================================================================
  describe('Initialization', () => {
    it('should start with empty products list', () => {
      expect(service.products()).toEqual([]);
    });

    it('should start with no selected product', () => {
      expect(service.selectedProductId()).toBeNull();
      expect(service.selectedProduct()).toBeNull();
    });

    it('should start with product panel closed', () => {
      expect(service.isProductPanelOpen()).toBe(false);
    });

    it('should start with list view mode', () => {
      expect(service.productViewMode()).toBe('list');
    });

    it('should have predefined categories', () => {
      const categories = service.categories();
      expect(categories.length).toBe(4);
      expect(categories.map(c => c.id)).toEqual(['all', 'core', 'support', 'management']);
    });

    it('should start with "all" category selected', () => {
      expect(service.selectedCategory()).toBe('all');
    });
  });

  // ===========================================================================
  // Product Panel Tests
  // ===========================================================================
  describe('Product Panel', () => {
    describe('openProductPanel()', () => {
      it('should set panel open state to true', () => {
        service.openProductPanel();
        expect(service.isProductPanelOpen()).toBe(true);
      });
    });

    describe('closeProductPanel()', () => {
      it('should set panel open state to false', () => {
        service.openProductPanel();
        service.closeProductPanel();
        expect(service.isProductPanelOpen()).toBe(false);
      });

      it('should clear selected product', () => {
        service.addProduct();
        service.closeProductPanel();
        expect(service.selectedProductId()).toBeNull();
      });

      it('should reset view mode to list', () => {
        service.setViewMode('edit');
        service.closeProductPanel();
        expect(service.productViewMode()).toBe('list');
      });
    });
  });

  // ===========================================================================
  // Add Modal Tests
  // ===========================================================================
  describe('Add Modal', () => {
    describe('openAddModal()', () => {
      it('should open the add modal', () => {
        service.openAddModal();
        expect(service.isAddModalOpen()).toBe(true);
      });
    });

    describe('closeAddModal()', () => {
      it('should close the add modal', () => {
        service.openAddModal();
        service.closeAddModal();
        expect(service.isAddModalOpen()).toBe(false);
      });
    });
  });

  // ===========================================================================
  // Category Selection Tests
  // ===========================================================================
  describe('Category Selection', () => {
    describe('selectCategory()', () => {
      it('should update selected category', () => {
        service.selectCategory('core');
        expect(service.selectedCategory()).toBe('core');
      });

      it('should clear selected product when changing category', () => {
        service.addProduct();
        service.selectCategory('support');
        expect(service.selectedProductId()).toBeNull();
      });

      it('should reset view mode to list', () => {
        service.setViewMode('factsheet');
        service.selectCategory('management');
        expect(service.productViewMode()).toBe('list');
      });
    });
  });

  // ===========================================================================
  // Product CRUD Tests
  // ===========================================================================
  describe('Product CRUD', () => {
    describe('addProduct()', () => {
      it('should add a new product', () => {
        service.addProduct();
        expect(service.products().length).toBe(1);
      });

      it('should generate unique ID for new product', () => {
        service.addProduct();
        service.addProduct();
        const products = service.products();
        expect(products[0].id).not.toBe(products[1].id);
      });

      it('should select the new product', () => {
        service.addProduct();
        const products = service.products();
        expect(service.selectedProductId()).toBe(products[0].id);
      });

      it('should set view mode to edit', () => {
        service.addProduct();
        expect(service.productViewMode()).toBe('edit');
      });

      it('should set category from selected category', () => {
        service.selectCategory('core');
        service.addProduct();
        expect(service.products()[0].category).toBe('core');
      });

      it('should not set category when "all" is selected', () => {
        service.selectCategory('all');
        service.addProduct();
        expect(service.products()[0].category).toBe('');
      });

      it('should log audit action', () => {
        service.addProduct();
        expect(auditServiceSpy.logAction).toHaveBeenCalled();
      });
    });

    describe('createProduct()', () => {
      it('should create product with provided data', () => {
        const product = service.createProduct({
          name: 'Test Product',
          category: 'core',
          status: 'production'
        });

        expect(product.name).toBe('Test Product');
        expect(product.category).toBe('core');
        expect(product.status).toBe('production');
      });

      it('should add product to list', () => {
        service.createProduct({ name: 'New Product' });
        expect(service.products().length).toBe(1);
      });

      it('should log audit action', () => {
        service.createProduct({ name: 'Audited Product' });
        expect(auditServiceSpy.logAction).toHaveBeenCalledWith(
          'product',
          jasmine.any(String),
          'Audited Product',
          'created',
          'Product created'
        );
      });
    });

    describe('selectProduct()', () => {
      it('should select product by ID', () => {
        service.addProduct();
        const productId = service.products()[0].id;

        service.selectProduct(productId);

        expect(service.selectedProductId()).toBe(productId);
      });

      it('should set view mode to factsheet', () => {
        service.addProduct();
        const productId = service.products()[0].id;

        service.selectProduct(productId);

        expect(service.productViewMode()).toBe('factsheet');
      });
    });

    describe('updateProduct()', () => {
      it('should update product properties', () => {
        service.addProduct();
        const productId = service.products()[0].id;

        service.updateProduct(productId, {
          name: 'Updated Name',
          status: 'production'
        });

        const updated = service.products()[0];
        expect(updated.name).toBe('Updated Name');
        expect(updated.status).toBe('production');
      });

      it('should update updatedAt timestamp', () => {
        service.addProduct();
        const productId = service.products()[0].id;
        const originalTimestamp = service.products()[0].updatedAt;

        // Small delay to ensure timestamp changes
        service.updateProduct(productId, { name: 'New Name' });

        expect(service.products()[0].updatedAt).not.toBe(originalTimestamp);
      });

      it('should log audit action', () => {
        service.addProduct();
        const productId = service.products()[0].id;

        service.updateProduct(productId, { name: 'Test' });

        expect(auditServiceSpy.logAction).toHaveBeenCalledWith(
          'product',
          productId,
          jasmine.any(String),
          'updated',
          'Updated product details'
        );
      });
    });

    describe('updateProductFactSheet()', () => {
      it('should update fact sheet properties', () => {
        service.addProduct();
        const productId = service.products()[0].id;

        service.updateProductFactSheet(productId, {
          overview: 'Product overview',
          targetAudience: 'Enterprise users'
        });

        const product = service.products()[0];
        expect(product.factSheet.overview).toBe('Product overview');
        expect(product.factSheet.targetAudience).toBe('Enterprise users');
      });

      it('should preserve other fact sheet fields', () => {
        service.addProduct();
        const productId = service.products()[0].id;

        service.updateProductFactSheet(productId, { overview: 'First update' });
        service.updateProductFactSheet(productId, { targetAudience: 'Second update' });

        const product = service.products()[0];
        expect(product.factSheet.overview).toBe('First update');
        expect(product.factSheet.targetAudience).toBe('Second update');
      });
    });

    describe('deleteProduct()', () => {
      it('should remove product from list', () => {
        service.addProduct();
        service.addProduct();
        const productId = service.products()[0].id;

        service.deleteProduct(productId);

        expect(service.products().length).toBe(1);
        expect(service.products().find(p => p.id === productId)).toBeUndefined();
      });

      it('should clear selection if deleted product was selected', () => {
        service.addProduct();
        const productId = service.products()[0].id;
        service.selectProduct(productId);

        service.deleteProduct(productId);

        expect(service.selectedProductId()).toBeNull();
        expect(service.productViewMode()).toBe('list');
      });

      it('should log audit action', () => {
        service.addProduct();
        const productId = service.products()[0].id;

        service.deleteProduct(productId);

        expect(auditServiceSpy.logAction).toHaveBeenCalledWith(
          'product',
          productId,
          jasmine.any(String),
          'deleted',
          'Product deleted'
        );
      });

      it('should clear audit logs for product', () => {
        service.addProduct();
        const productId = service.products()[0].id;

        service.deleteProduct(productId);

        expect(auditServiceSpy.clearLogsForEntity).toHaveBeenCalledWith('product', productId);
      });
    });

    describe('duplicateProduct()', () => {
      it('should create a copy of the product', () => {
        service.createProduct({ name: 'Original', category: 'core' });
        const originalId = service.products()[0].id;

        service.duplicateProduct(originalId);

        expect(service.products().length).toBe(2);
      });

      it('should append "(Copy)" to the name', () => {
        service.createProduct({ name: 'Original Product' });
        const originalId = service.products()[0].id;

        service.duplicateProduct(originalId);

        const duplicate = service.products().find(p => p.id !== originalId);
        expect(duplicate?.name).toBe('Original Product (Copy)');
      });

      it('should generate new ID', () => {
        service.addProduct();
        const originalId = service.products()[0].id;

        service.duplicateProduct(originalId);

        const duplicate = service.products().find(p => p.id !== originalId);
        expect(duplicate?.id).not.toBe(originalId);
      });

      it('should reset status to planned', () => {
        service.createProduct({ name: 'Test', status: 'production' });
        const originalId = service.products()[0].id;

        service.duplicateProduct(originalId);

        const duplicate = service.products().find(p => p.id !== originalId);
        expect(duplicate?.status).toBe('planned');
      });

      it('should select the duplicate', () => {
        service.addProduct();
        const originalId = service.products()[0].id;

        service.duplicateProduct(originalId);

        expect(service.selectedProductId()).not.toBe(originalId);
      });
    });
  });

  // ===========================================================================
  // View Mode Tests
  // ===========================================================================
  describe('View Mode', () => {
    describe('setViewMode()', () => {
      it('should set view mode to list', () => {
        service.setViewMode('list');
        expect(service.productViewMode()).toBe('list');
      });

      it('should set view mode to factsheet', () => {
        service.setViewMode('factsheet');
        expect(service.productViewMode()).toBe('factsheet');
      });

      it('should set view mode to edit', () => {
        service.setViewMode('edit');
        expect(service.productViewMode()).toBe('edit');
      });
    });
  });

  // ===========================================================================
  // Tag Management Tests
  // ===========================================================================
  describe('Tag Management', () => {
    beforeEach(() => {
      service.addProduct();
    });

    describe('addProductTag()', () => {
      it('should add tag to product', () => {
        const productId = service.products()[0].id;

        service.addProductTag(productId, 'enterprise');

        expect(service.products()[0].tags).toContain('enterprise');
      });

      it('should support multiple tags', () => {
        const productId = service.products()[0].id;

        service.addProductTag(productId, 'tag1');
        service.addProductTag(productId, 'tag2');

        expect(service.products()[0].tags).toEqual(['tag1', 'tag2']);
      });
    });

    describe('removeProductTag()', () => {
      it('should remove tag at index', () => {
        const productId = service.products()[0].id;
        service.addProductTag(productId, 'tag1');
        service.addProductTag(productId, 'tag2');

        service.removeProductTag(productId, 0);

        expect(service.products()[0].tags).toEqual(['tag2']);
      });
    });
  });

  // ===========================================================================
  // Feature Management Tests
  // ===========================================================================
  describe('Feature Management', () => {
    beforeEach(() => {
      service.addProduct();
    });

    describe('addKeyFeature()', () => {
      it('should add feature to product', () => {
        const productId = service.products()[0].id;

        service.addKeyFeature(productId, 'Real-time sync');

        expect(service.products()[0].factSheet.keyFeatures).toContain('Real-time sync');
      });
    });

    describe('removeKeyFeature()', () => {
      it('should remove feature at index', () => {
        const productId = service.products()[0].id;
        service.addKeyFeature(productId, 'Feature 1');
        service.addKeyFeature(productId, 'Feature 2');

        service.removeKeyFeature(productId, 0);

        expect(service.products()[0].factSheet.keyFeatures).toEqual(['Feature 2']);
      });
    });
  });

  // ===========================================================================
  // Integration Management Tests
  // ===========================================================================
  describe('Integration Management', () => {
    beforeEach(() => {
      service.addProduct();
    });

    describe('addIntegration()', () => {
      it('should add integration to product', () => {
        const productId = service.products()[0].id;

        service.addIntegration(productId, 'Salesforce');

        expect(service.products()[0].factSheet.integrations).toContain('Salesforce');
      });
    });

    describe('removeIntegration()', () => {
      it('should remove integration at index', () => {
        const productId = service.products()[0].id;
        service.addIntegration(productId, 'Integration 1');
        service.addIntegration(productId, 'Integration 2');

        service.removeIntegration(productId, 0);

        expect(service.products()[0].factSheet.integrations).toEqual(['Integration 2']);
      });
    });
  });

  // ===========================================================================
  // Persona Management Tests
  // ===========================================================================
  describe('Persona Management', () => {
    beforeEach(() => {
      service.addProduct();
    });

    describe('addPersona()', () => {
      it('should add persona to product', () => {
        const productId = service.products()[0].id;
        const persona: Persona = {
          id: 'p1',
          code: 'USR001',
          name: 'Power User',
          type: 'internal',
          description: 'Experienced user',
          icon: '👤'
        };

        service.addPersona(productId, persona);

        expect(service.products()[0].personas).toContainEqual(persona);
      });

      it('should log audit action', () => {
        const productId = service.products()[0].id;
        const persona: Persona = {
          id: 'p1',
          code: 'USR001',
          name: 'Test Persona',
          type: 'internal',
          description: '',
          icon: ''
        };

        service.addPersona(productId, persona);

        expect(auditServiceSpy.logAction).toHaveBeenCalledWith(
          'persona',
          'p1',
          'Test Persona',
          'created',
          jasmine.any(String)
        );
      });
    });

    describe('updatePersona()', () => {
      it('should update persona properties', () => {
        const productId = service.products()[0].id;
        const persona: Persona = {
          id: 'p1',
          code: 'USR001',
          name: 'Original Name',
          type: 'internal',
          description: '',
          icon: ''
        };
        service.addPersona(productId, persona);

        service.updatePersona(productId, 'p1', { name: 'Updated Name' });

        const updated = service.products()[0].personas.find(p => p.id === 'p1');
        expect(updated?.name).toBe('Updated Name');
      });
    });

    describe('deletePersona()', () => {
      it('should remove persona from product', () => {
        const productId = service.products()[0].id;
        const persona: Persona = {
          id: 'p1',
          code: 'USR001',
          name: 'To Delete',
          type: 'internal',
          description: '',
          icon: ''
        };
        service.addPersona(productId, persona);

        service.deletePersona(productId, 'p1');

        expect(service.products()[0].personas.length).toBe(0);
      });

      it('should log audit action', () => {
        const productId = service.products()[0].id;
        const persona: Persona = {
          id: 'p1',
          code: 'USR001',
          name: 'Deleted Persona',
          type: 'internal',
          description: '',
          icon: ''
        };
        service.addPersona(productId, persona);

        service.deletePersona(productId, 'p1');

        expect(auditServiceSpy.logAction).toHaveBeenCalledWith(
          'persona',
          'p1',
          'Deleted Persona',
          'deleted',
          'Persona deleted'
        );
      });
    });

    describe('getPersona()', () => {
      it('should return persona by ID', () => {
        const productId = service.products()[0].id;
        const persona: Persona = {
          id: 'p1',
          code: 'USR001',
          name: 'Test Persona',
          type: 'internal',
          description: 'Description',
          icon: '👤'
        };
        service.addPersona(productId, persona);

        const result = service.getPersona(productId, 'p1');

        expect(result).toEqual(persona);
      });

      it('should return undefined for non-existent persona', () => {
        const productId = service.products()[0].id;

        const result = service.getPersona(productId, 'non-existent');

        expect(result).toBeUndefined();
      });
    });
  });

  // ===========================================================================
  // Computed Values Tests
  // ===========================================================================
  describe('Computed Values', () => {
    describe('selectedProduct', () => {
      it('should return null when no product selected', () => {
        expect(service.selectedProduct()).toBeNull();
      });

      it('should return selected product', () => {
        service.createProduct({ name: 'Selected Product' });
        const productId = service.products()[0].id;
        service.selectProduct(productId);

        expect(service.selectedProduct()?.name).toBe('Selected Product');
      });
    });

    describe('filteredProducts', () => {
      beforeEach(() => {
        service.createProduct({ name: 'Core Product', category: 'core' });
        service.createProduct({ name: 'Support Product', category: 'support' });
        service.createProduct({ name: 'Another Core', category: 'core' });
      });

      it('should return all products when "all" category selected', () => {
        service.selectCategory('all');
        expect(service.filteredProducts().length).toBe(3);
      });

      it('should filter by category', () => {
        service.selectCategory('core');
        const filtered = service.filteredProducts();

        expect(filtered.length).toBe(2);
        expect(filtered.every(p => p.category === 'core')).toBe(true);
      });

      it('should return empty array for category with no products', () => {
        service.selectCategory('management');
        expect(service.filteredProducts().length).toBe(0);
      });
    });

    describe('productCount', () => {
      it('should return total product count', () => {
        expect(service.productCount()).toBe(0);

        service.addProduct();
        expect(service.productCount()).toBe(1);

        service.addProduct();
        expect(service.productCount()).toBe(2);
      });
    });

    describe('categoriesWithCounts', () => {
      it('should calculate product counts per category', () => {
        service.createProduct({ category: 'core' });
        service.createProduct({ category: 'core' });
        service.createProduct({ category: 'support' });

        const categories = service.categoriesWithCounts();

        expect(categories.find(c => c.id === 'all')?.productCount).toBe(3);
        expect(categories.find(c => c.id === 'core')?.productCount).toBe(2);
        expect(categories.find(c => c.id === 'support')?.productCount).toBe(1);
        expect(categories.find(c => c.id === 'management')?.productCount).toBe(0);
      });
    });
  });
});
