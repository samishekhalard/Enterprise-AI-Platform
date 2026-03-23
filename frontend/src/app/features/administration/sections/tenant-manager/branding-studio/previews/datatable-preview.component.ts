import { CurrencyPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { TableModule } from 'primeng/table';

interface Product {
  name: string;
  category: string;
  quantity: number;
  price: number;
}

@Component({
  selector: 'app-datatable-preview',
  standalone: true,
  imports: [TableModule, CurrencyPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="preview-grid" data-testid="datatable-preview">
      <h4>Basic Table</h4>
      <p-table [value]="products()" [tableStyle]="{ 'min-width': '400px' }" [stripedRows]="true">
        <ng-template #header>
          <tr>
            <th>Name</th>
            <th>Category</th>
            <th>Quantity</th>
            <th>Price</th>
          </tr>
        </ng-template>
        <ng-template #body let-product>
          <tr>
            <td>{{ product.name }}</td>
            <td>{{ product.category }}</td>
            <td>{{ product.quantity }}</td>
            <td>{{ product.price | currency }}</td>
          </tr>
        </ng-template>
      </p-table>
    </div>
  `,
  styles: [
    `
      .preview-grid {
        display: grid;
        gap: 1rem;
      }
      h4 {
        margin: 0;
        font-size: 0.82rem;
        color: var(--nm-muted, #3d3a3b);
        text-transform: uppercase;
        letter-spacing: 0.04em;
      }
    `,
  ],
})
export class DataTablePreviewComponent {
  readonly products = signal<Product[]>([
    { name: 'Widget Pro', category: 'Hardware', quantity: 24, price: 49.99 },
    { name: 'DataSync', category: 'Software', quantity: 100, price: 19.99 },
    { name: 'CloudBox', category: 'Services', quantity: 5, price: 199.0 },
    { name: 'SensorKit', category: 'Hardware', quantity: 42, price: 89.5 },
  ]);
}
