import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { ProductService } from '../../services/product.service';
import { ProductTableComponent } from './views/product-table/product-table.component';
import { ProductFactsheetComponent } from './views/product-factsheet/product-factsheet.component';
import { ProductEditComponent } from './views/product-edit/product-edit.component';

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [ProductTableComponent, ProductFactsheetComponent, ProductEditComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="product-panel" role="region" aria-label="Product management">
      @switch (productService.productViewMode()) {
        @case ('list') { <app-product-table /> }
        @case ('factsheet') { <app-product-factsheet /> }
        @case ('edit') { <app-product-edit /> }
      }
    </div>
  `,
  styles: [`
    :host {
      display: flex;
      flex: 1;
      width: 100%;
      min-width: 0;
    }

    .product-panel {
      flex: 1;
      display: flex;
      flex-direction: column;
      background: #f8fafc;
      overflow: hidden;
      font-family: 'Gotham Rounded', 'Nunito', -apple-system, BlinkMacSystemFont, sans-serif;
      width: 100%;
      min-width: 0;
    }
  `]
})
export class ProductListComponent {
  readonly productService = inject(ProductService);
}
