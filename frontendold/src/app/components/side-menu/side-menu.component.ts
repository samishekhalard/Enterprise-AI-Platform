import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProductService } from '../../services/product.service';

@Component({
  selector: 'app-side-menu',
  standalone: true,
  imports: [CommonModule],
  template: `
    <nav class="side-menu" role="navigation" aria-label="Product Portfolio Navigation">
      <!-- Header -->
      <header class="menu-header">
        <h2 class="menu-title">Products</h2>
        <div class="header-actions">
          <button class="icon-btn"
                  (click)="toggleSearch()"
                  aria-label="Search products">
            <img src="assets/icons/search.svg" alt="" aria-hidden="true">
          </button>
          <button class="icon-btn icon-btn-add"
                  (click)="productService.openAddModal()"
                  aria-label="Add new product">
            <img src="assets/icons/plus.svg" alt="" aria-hidden="true">
          </button>
        </div>
      </header>

      <!-- Search (collapsible) -->
      @if (showSearch()) {
        <div class="search-container">
          <input type="text"
                 class="search-input"
                 placeholder="Search products..."
                 [value]="searchQuery()"
                 (input)="onSearchInput($event)"
                 aria-label="Search products">
        </div>
      }

      <!-- Product List -->
      <ul class="product-list" role="list">
        @for (product of filteredProducts(); track product.id) {
          <li class="product-item"
              [class.selected]="productService.selectedProductId() === product.id"
              (click)="selectProduct(product.id)"
              role="button"
              tabindex="0"
              (keydown.enter)="selectProduct(product.id)">
            <span class="product-name">
              {{ product.name || 'Untitled Product' }}
            </span>
          </li>
        } @empty {
          <li class="empty-state">
            @if (searchQuery()) {
              No products match your search.
            } @else {
              No products yet. Click + to add one.
            }
          </li>
        }
      </ul>
    </nav>
  `,
  styles: [`
    // ThinkPLUS Brand Colors
    $teal-dark: #035a66;
    $teal: #047481;
    $teal-light: #5ee7f7;
    $green: #22c55e;
    $danger: #ef4444;

    $gray-50: #f8fafc;
    $gray-100: #f1f5f9;
    $gray-200: #e2e8f0;
    $gray-300: #cbd5e1;
    $gray-400: #545e6e; // WCAG AAA: 7.01:1
    $gray-500: #495567; // WCAG AAA: 7.01:1
    $gray-600: #3f4a5c; // WCAG AAA: 7.03:1
    $gray-700: #334155;
    $gray-800: #1e293b;

    $white: #ffffff;

    .side-menu {
      width: 320px;
      min-width: 320px;
      height: 100%;
      background: $white;
      border-right: 1px solid $gray-200;
      display: flex;
      flex-direction: column;
      font-family: 'Gotham Rounded', 'Nunito', -apple-system, BlinkMacSystemFont, sans-serif;

      @media (max-width: 991px) {
        width: 280px;
        min-width: 280px;
      }

      @media (max-width: 767px) {
        display: none;
      }

      @media (min-width: 1920px) {
        width: 360px;
        min-width: 360px;
      }

      @media (min-width: 3840px) {
        width: 480px;
        min-width: 480px;
      }
    }

    .menu-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 1rem 1.25rem;
      border-bottom: 1px solid $gray-200;
      background: $gray-50;
    }

    .menu-title {
      font-size: 1rem;
      font-weight: 600;
      color: $gray-800;
      margin: 0;
    }

    .header-actions {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .icon-btn {
      width: 32px;
      height: 32px;
      padding: 0;
      border: none;
      background: transparent;
      border-radius: 0.375rem;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.15s ease;

      img {
        width: 1.125rem;
        height: 1.125rem;
        opacity: 0.5;
      }

      &:hover {
        background: $gray-200;
        img { opacity: 0.8; }
      }

      &:focus-visible {
        outline: 2px solid $teal;
        outline-offset: 2px;
      }

      &.icon-btn-add {
        background: $teal;
        img {
          opacity: 1;
          filter: brightness(0) invert(1);
        }

        &:hover {
          background: $teal-dark;
        }
      }
    }

    .search-container {
      padding: 0.75rem 1rem;
      border-bottom: 1px solid $gray-200;
    }

    .search-input {
      width: 100%;
      padding: 0.5rem 0.75rem;
      border: 1px solid $gray-200;
      border-radius: 0.375rem;
      font-size: 0.8125rem;
      font-family: inherit;
      background: $white;

      &:focus {
        outline: none;
        border-color: $teal;
        box-shadow: 0 0 0 3px rgba($teal, 0.1);
      }

      &::placeholder {
        color: $gray-400;
      }
    }

    .product-list {
      list-style: none;
      margin: 0;
      padding: 0;
      flex: 1;
      overflow-y: auto;
    }

    .product-item {
      padding: 0.75rem 1.25rem;
      border-bottom: 1px solid $gray-100;
      transition: background 0.15s ease;
      cursor: pointer;

      &:hover {
        background: $gray-50;

        .product-name {
          color: $teal;
        }
      }

      &:focus-visible {
        outline: 2px solid $teal;
        outline-offset: -2px;
      }

      &.selected {
        background: rgba($teal, 0.06);
        border-left: 3px solid $teal;
        padding-left: calc(1.25rem - 3px);

        .product-name {
          color: $teal;
          font-weight: 500;
        }
      }
    }

    .product-name {
      font-size: 0.875rem;
      font-family: inherit;
      color: $gray-700;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .empty-state {
      padding: 2rem 1.25rem;
      text-align: center;
      color: $gray-400;
      font-size: 0.8125rem;
    }
  `]
})
export class SideMenuComponent {
  readonly productService = inject(ProductService);

  showSearch = signal(false);
  searchQuery = signal('');

  filteredProducts() {
    const products = this.productService.filteredProducts();
    const query = this.searchQuery().toLowerCase().trim();

    if (!query) return products;

    return products.filter(p =>
      p.name.toLowerCase().includes(query) ||
      p.description.toLowerCase().includes(query)
    );
  }

  toggleSearch(): void {
    this.showSearch.set(!this.showSearch());
    if (!this.showSearch()) {
      this.searchQuery.set('');
    }
  }

  onSearchInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchQuery.set(input.value);
  }

  selectProduct(productId: string): void {
    this.productService.selectProduct(productId);
    this.productService.setViewMode('factsheet');
  }
}
