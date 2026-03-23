import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProductService } from '../../services/product.service';
import { SideMenuComponent } from '../../components/side-menu/side-menu.component';
import { ProductListComponent } from '../../components/product-list/product-list.component';
import { ProductModalComponent } from '../../components/product-modal/product-modal.component';
import { BreadcrumbComponent } from '../../components/shared/breadcrumb';

@Component({
  selector: 'app-products-page',
  standalone: true,
  imports: [CommonModule, SideMenuComponent, ProductListComponent, ProductModalComponent, BreadcrumbComponent],
  template: `
    <!-- Breadcrumb (Standardized - Fixed Position) -->
    <app-breadcrumb [items]="[{ label: 'Products' }]" />

    <div class="products-layout">
      <app-side-menu></app-side-menu>
      <div class="products-content">
        <app-product-list></app-product-list>
      </div>
    </div>

    <!-- Add Product Modal -->
    <app-product-modal></app-product-modal>
  `,
  styles: [`
    :host {
      display: flex;
      flex: 1;
      width: 100%;
      height: 100%;
      min-width: 0;
    }

    .products-layout {
      display: flex;
      flex: 1;
      height: 100%;
      width: 100%;
      background: #f8fafc;
    }

    .products-content {
      flex: 1;
      display: flex;
      overflow: hidden;
      min-width: 0;
      background: #f8fafc;
    }
  `]
})
export class ProductsPage {
  readonly productService = inject(ProductService);
}
