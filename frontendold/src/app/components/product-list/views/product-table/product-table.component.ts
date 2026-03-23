import { Component, inject, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProductService } from '../../../../services/product.service';

@Component({
  selector: 'app-product-table',
  standalone: true,
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- Sticky Header -->
    <header class="panel-header">
      <div class="header-left">
        <h1 class="panel-title">
          <img src="assets/icons/package.svg" alt="" class="title-icon" aria-hidden="true">
          Product Portfolio
        </h1>
        <div class="status-filters">
          <span class="status-filter" [class.active]="statusFilter() === 'all'" (click)="setStatusFilter('all')" data-testid="filter-all">
            <span class="status-dot status-all"></span>
            All <span class="count">{{ productService.productCount() }}</span>
          </span>
          <span class="status-filter" [class.active]="statusFilter() === 'planned'" (click)="setStatusFilter('planned')" data-testid="filter-planned">
            <span class="status-dot status-planned"></span>
            Planned <span class="count">{{ getStatusCount('planned') }}</span>
          </span>
          <span class="status-filter" [class.active]="statusFilter() === 'under_development'" (click)="setStatusFilter('under_development')" data-testid="filter-development">
            <span class="status-dot status-development"></span>
            Under Development <span class="count">{{ getStatusCount('under_development') }}</span>
          </span>
          <span class="status-filter" [class.active]="statusFilter() === 'production'" (click)="setStatusFilter('production')" data-testid="filter-production">
            <span class="status-dot status-production"></span>
            Production <span class="count">{{ getStatusCount('production') }}</span>
          </span>
          <span class="status-filter" [class.active]="statusFilter() === 'retired'" (click)="setStatusFilter('retired')" data-testid="filter-retired">
            <span class="status-dot status-retired"></span>
            Retired <span class="count">{{ getStatusCount('retired') }}</span>
          </span>
        </div>
      </div>
    </header>

    <!-- Sub Header with count, search, and add button -->
    <div class="sub-header">
      <span class="result-count">{{ filteredProducts().length }} products</span>
      <div class="sub-header-actions">
        <div class="search-box">
          <img src="assets/icons/search.svg" alt="" class="search-icon" aria-hidden="true">
          <input type="text"
                 class="search-input"
                 placeholder="Search by name..."
                 [ngModel]="searchQuery()"
                 (ngModelChange)="searchQuery.set($event)"
                 aria-label="Search products"
                 data-testid="search-input">
        </div>
        <button class="btn btn-primary btn-sm"
                (click)="productService.openAddModal()"
                aria-label="Add new product"
                data-testid="btn-new-product">
          <span class="btn-plus">+</span>
          New
        </button>
      </div>
    </div>

    <!-- Table with sticky header -->
    <div class="table-container">
      @if (filteredProducts().length === 0) {
        <div class="empty-state" role="status" data-testid="empty-state">
          <div class="empty-icon">
            <img src="assets/icons/package.svg" alt="" aria-hidden="true">
          </div>
          <h3 class="empty-title">No products found</h3>
          <p class="empty-text">
            @if (searchQuery() || statusFilter() !== 'all') {
              Try adjusting your filters or search query.
            } @else {
              Add your first product to get started.
            }
          </p>
          @if (!searchQuery() && statusFilter() === 'all') {
            <button class="btn btn-primary" (click)="productService.openAddModal()" data-testid="btn-add-first">
              <span class="btn-plus">+</span>
              New Product
            </button>
          }
        </div>
      } @else {
        <table class="product-table" role="grid" aria-label="Products list" data-testid="product-table">
          <thead>
            <tr>
              <th scope="col" class="col-name">
                <span class="th-content">NAME</span>
              </th>
              <th scope="col" class="col-category">
                <span class="th-content">CATEGORY</span>
              </th>
              <th scope="col" class="col-status">
                <span class="th-content">STATUS</span>
              </th>
              <th scope="col" class="col-actions">
                <span class="th-content">ACTIONS</span>
              </th>
            </tr>
          </thead>
          <tbody>
            @for (product of paginatedProducts(); track product.id) {
              <tr data-testid="product-row">
                <td class="cell-name">
                  <div class="product-info">
                    <img src="assets/icons/box.svg" alt="" class="product-icon" aria-hidden="true">
                    <span class="product-name">{{ product.name || 'Untitled Product' }}</span>
                  </div>
                </td>
                <td class="cell-category">
                  {{ getCategoryName(product.category) }}
                </td>
                <td class="cell-status">
                  <span class="status-badge"
                        [class.status-planned]="product.status === 'planned'"
                        [class.status-development]="product.status === 'under_development'"
                        [class.status-production]="product.status === 'production'"
                        [class.status-retired]="product.status === 'retired'">
                    {{ getStatusLabel(product.status) }}
                  </span>
                </td>
                <td class="cell-actions">
                  <button class="btn-menu"
                          [attr.aria-label]="'Actions for ' + (product.name || 'product')"
                          (click)="toggleMenu(product.id, $event)"
                          data-testid="btn-actions">
                    <span class="menu-dots">&#x22EE;</span>
                  </button>
                  @if (openMenuId() === product.id) {
                    <div class="dropdown-menu show">
                      <button class="dropdown-item" (click)="viewProduct(product.id)" data-testid="btn-view">
                        <img src="assets/icons/eye.svg" alt="" aria-hidden="true">
                        View
                      </button>
                      <button class="dropdown-item" (click)="editProduct(product.id)" data-testid="btn-edit">
                        <img src="assets/icons/edit.svg" alt="" aria-hidden="true">
                        Edit
                      </button>
                      <button class="dropdown-item dropdown-item-danger" (click)="deleteProduct(product.id, $event)" data-testid="btn-delete">
                        <img src="assets/icons/trash.svg" alt="" aria-hidden="true">
                        Delete
                      </button>
                    </div>
                  }
                </td>
              </tr>
            }
          </tbody>
        </table>
      }
    </div>

    <!-- Sticky Footer with Pagination -->
    @if (filteredProducts().length > 0) {
      <footer class="panel-footer" data-testid="pagination-footer">
        <div class="pagination-info">
          Showing {{ paginationStart() }} - {{ paginationEnd() }} of {{ filteredProducts().length }}
        </div>
        <div class="pagination-controls">
          <label class="per-page-label">
            Per page:
            <select class="per-page-select"
                    [ngModel]="pageSize()"
                    (ngModelChange)="setPageSize($event)"
                    data-testid="page-size-select">
              <option [value]="10">10</option>
              <option [value]="25">25</option>
              <option [value]="50">50</option>
              <option [value]="100">100</option>
            </select>
          </label>
          <div class="page-buttons">
            <button class="btn-page"
                    [disabled]="currentPage() === 1"
                    (click)="previousPage()"
                    aria-label="Previous page"
                    data-testid="btn-prev-page">
              &#x2039;
            </button>
            @for (page of visiblePages(); track page) {
              <button class="btn-page"
                      [class.active]="page === currentPage()"
                      (click)="goToPage(page)"
                      data-testid="btn-page">
                {{ page }}
              </button>
            }
            <button class="btn-page"
                    [disabled]="currentPage() === totalPages()"
                    (click)="nextPage()"
                    aria-label="Next page"
                    data-testid="btn-next-page">
              &#x203A;
            </button>
          </div>
        </div>
      </footer>
    }
  `,
  styles: [`
    @use 'sass:color';
    // ThinkPLUS Brand Colors
    $teal-dark: #035a66;
    $teal: #047481;
    $green: #22c55e;
    $orange: #f59e0b;
    $danger: #ef4444;

    $gray-50: #f8fafc;
    $gray-100: #f1f5f9;
    $gray-200: #e2e8f0;
    $gray-300: #cbd5e1;
    $gray-400: #545e6e;
    $gray-500: #495567;
    $gray-600: #3f4a5c;
    $gray-700: #334155;
    $gray-800: #1e293b;

    $white: #ffffff;

    :host {
      display: flex;
      flex-direction: column;
      flex: 1;
      width: 100%;
      min-width: 0;
      overflow: hidden;
    }

    // Sticky Header
    .panel-header {
      position: sticky;
      top: 0;
      z-index: 10;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      padding: 1.25rem 1.5rem;
      background: $white;
      border-bottom: 1px solid $gray-200;

      @media (max-width: 576px) {
        padding: 1rem;
        flex-direction: column;
        gap: 0.75rem;
      }

      @media (min-width: 1920px) {
        padding: 1.5rem 2rem;
      }
    }

    .header-left {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .panel-title {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 1.125rem;
      font-weight: 600;
      color: $gray-800;
      margin: 0;
    }

    .title-icon {
      width: 1.25rem;
      height: 1.25rem;
      opacity: 0.7;
    }

    .status-filters {
      display: flex;
      gap: 1.25rem;
      flex-wrap: wrap;

      @media (max-width: 576px) {
        gap: 0.75rem;
      }
    }

    .status-filter {
      display: flex;
      align-items: center;
      gap: 0.375rem;
      font-size: 0.8125rem;
      color: $gray-500;
      cursor: pointer;
      transition: color 0.15s ease;

      &:hover, &.active {
        color: $gray-800;
      }

      .count {
        color: $gray-400;
        font-size: 0.75rem;
      }
    }

    .status-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;

      &.status-all { background: $teal; }
      &.status-planned { background: #6366f1; }
      &.status-development { background: $orange; }
      &.status-production { background: $green; }
      &.status-retired { background: $gray-400; }
    }

    // Sub Header
    .sub-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.75rem 1.5rem;
      background: $gray-50;
      border-bottom: 1px solid $gray-200;

      @media (max-width: 576px) {
        padding: 0.75rem 1rem;
        flex-direction: column;
        gap: 0.75rem;
        align-items: stretch;
      }
    }

    .result-count {
      font-size: 0.8125rem;
      color: $gray-600;
    }

    .sub-header-actions {
      display: flex;
      align-items: center;
      gap: 0.75rem;

      @media (max-width: 576px) {
        width: 100%;
      }
    }

    .search-box {
      position: relative;
      display: flex;
      align-items: center;

      @media (max-width: 576px) {
        flex: 1;
      }
    }

    .search-icon {
      position: absolute;
      left: 0.75rem;
      width: 1rem;
      height: 1rem;
      opacity: 0.4;
    }

    .search-input {
      width: 220px;
      padding: 0.5rem 0.75rem 0.5rem 2.25rem;
      border: 1px solid $gray-200;
      border-radius: 0.375rem;
      font-size: 0.8125rem;
      font-family: inherit;
      background: $white;

      @media (max-width: 576px) {
        width: 100%;
        flex: 1;
      }

      &:focus {
        outline: none;
        border-color: $teal;
        box-shadow: 0 0 0 3px rgba($teal, 0.1);
      }

      &::placeholder {
        color: $gray-400;
      }
    }

    .btn-plus {
      font-size: 1rem;
      font-weight: 400;
      margin-right: 0.25rem;
    }

    // Table Container
    .table-container {
      flex: 1;
      overflow-y: auto;
    }

    .product-table {
      width: 100%;
      border-collapse: collapse;

      thead {
        position: sticky;
        top: 0;
        z-index: 5;
        background: $gray-50;

        th {
          padding: 0.75rem 1rem;
          text-align: left;
          font-weight: 500;
          font-size: 0.6875rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: $gray-500;
          border-bottom: 1px solid $gray-200;

          &.col-name { width: 35%; padding-left: 1.5rem; }
          &.col-category {
            width: 25%;
            @media (max-width: 767px) { display: none; }
          }
          &.col-status { width: 20%; }
          &.col-actions { width: 80px; text-align: center; }

          @media (max-width: 576px) {
            padding: 0.625rem 0.75rem;
            &.col-name { padding-left: 1rem; }
          }
        }
      }

      tbody {
        tr {
          border-bottom: 1px solid $gray-100;
          transition: background 0.15s ease;

          &:hover {
            background: $gray-50;
          }
        }

        td {
          padding: 0.875rem 1rem;
          vertical-align: middle;
          font-size: 0.875rem;
          color: $gray-600;

          &.cell-name {
            padding-left: 1.5rem;
            @media (max-width: 576px) { padding-left: 1rem; }
          }

          &.cell-category {
            @media (max-width: 767px) { display: none; }
          }

          &.cell-actions {
            position: relative;
            text-align: center;
          }

          @media (max-width: 576px) {
            padding: 0.75rem;
            font-size: 0.8125rem;
          }
        }
      }
    }

    .product-info {
      display: flex;
      align-items: center;
      gap: 0.625rem;
    }

    .product-icon {
      width: 1.125rem;
      height: 1.125rem;
      opacity: 0.5;
    }

    .product-name {
      font-weight: 500;
      color: $gray-800;
    }

    .status-badge {
      display: inline-block;
      font-size: 0.75rem;
      font-weight: 500;
      padding: 0.25rem 0.625rem;
      border-radius: 0.25rem;

      &.status-planned {
        background: rgba(#6366f1, 0.12);
        color: #4f46e5;
      }

      &.status-development {
        background: rgba($orange, 0.12);
        color: color.adjust($orange, $lightness: -15%);
      }

      &.status-production {
        background: rgba($green, 0.12);
        color: color.adjust($green, $lightness: -15%);
      }

      &.status-retired {
        background: rgba($gray-400, 0.15);
        color: $gray-500;
      }
    }

    .btn-menu {
      width: 32px;
      height: 32px;
      padding: 0;
      border: none;
      background: transparent;
      border-radius: 0.25rem;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      justify-content: center;

      &:hover {
        background: $gray-100;
      }

      &:focus-visible {
        outline: 2px solid $teal;
        outline-offset: 2px;
      }
    }

    .menu-dots {
      font-size: 1.25rem;
      color: $gray-400;
      line-height: 1;
    }

    .dropdown-menu {
      position: absolute;
      right: 1rem;
      top: 100%;
      z-index: 20;
      min-width: 140px;
      background: $white;
      border: 1px solid $gray-200;
      border-radius: 0.5rem;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      padding: 0.25rem;

      &.show {
        display: block;
      }
    }

    .dropdown-item {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      width: 100%;
      padding: 0.5rem 0.75rem;
      border: none;
      background: transparent;
      font-size: 0.8125rem;
      font-family: inherit;
      color: $gray-600;
      text-align: left;
      cursor: pointer;
      border-radius: 0.25rem;

      img {
        width: 1rem;
        height: 1rem;
        opacity: 0.5;
      }

      &:hover {
        background: $gray-50;
        color: $gray-800;
      }

      &.dropdown-item-danger {
        color: $danger;

        &:hover {
          background: rgba($danger, 0.05);
        }

        img {
          filter: invert(40%) sepia(90%) saturate(1500%) hue-rotate(340deg);
        }
      }
    }

    // Empty State
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 4rem 2rem;
      text-align: center;
    }

    .empty-icon {
      width: 4rem;
      height: 4rem;
      margin-bottom: 1rem;
      opacity: 0.2;

      img {
        width: 100%;
        height: 100%;
      }
    }

    .empty-title {
      font-size: 1rem;
      font-weight: 600;
      color: $gray-700;
      margin: 0 0 0.25rem 0;
    }

    .empty-text {
      font-size: 0.875rem;
      color: $gray-400;
      margin: 0 0 1.25rem 0;
    }

    // Sticky Footer with Pagination
    .panel-footer {
      position: sticky;
      bottom: 0;
      z-index: 10;
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.75rem 1.5rem;
      background: $white;
      border-top: 1px solid $gray-200;

      @media (max-width: 576px) {
        padding: 0.75rem 1rem;
        flex-direction: column;
        gap: 0.75rem;
      }
    }

    .pagination-info {
      font-size: 0.8125rem;
      color: $gray-500;
    }

    .pagination-controls {
      display: flex;
      align-items: center;
      gap: 1.5rem;

      @media (max-width: 576px) {
        gap: 1rem;
        width: 100%;
        justify-content: space-between;
      }
    }

    .per-page-label {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.8125rem;
      color: $gray-500;
    }

    .per-page-select {
      padding: 0.25rem 0.5rem;
      border: 1px solid $gray-200;
      border-radius: 0.25rem;
      font-size: 0.8125rem;
      font-family: inherit;
      background: $white;
      cursor: pointer;

      &:focus {
        outline: none;
        border-color: $teal;
      }
    }

    .page-buttons {
      display: flex;
      align-items: center;
      gap: 0.25rem;
    }

    .btn-page {
      min-width: 32px;
      height: 32px;
      padding: 0 0.5rem;
      border: 1px solid $gray-200;
      background: $white;
      border-radius: 0.25rem;
      font-size: 0.8125rem;
      font-family: inherit;
      color: $gray-600;
      cursor: pointer;
      transition: all 0.15s ease;

      &:hover:not(:disabled) {
        background: $gray-50;
        border-color: $gray-300;
      }

      &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      &.active {
        background: $teal;
        border-color: $teal;
        color: $white;
      }

      &:focus-visible {
        outline: 2px solid $teal;
        outline-offset: 2px;
      }
    }

    // Button styles
    .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.375rem;
      padding: 0.5rem 1rem;
      border-radius: 0.375rem;
      font-size: 0.875rem;
      font-weight: 500;
      font-family: inherit;
      cursor: pointer;
      transition: all 0.15s ease;
      border: 1px solid transparent;

      &:focus-visible {
        outline: 2px solid $teal;
        outline-offset: 2px;
      }

      &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
    }

    .btn-primary {
      background: $teal;
      border-color: $teal;
      color: $white;

      &:hover:not(:disabled) {
        background: $teal-dark;
        border-color: $teal-dark;
      }
    }

    .btn-sm {
      padding: 0.375rem 0.75rem;
      font-size: 0.8125rem;
    }
  `]
})
export class ProductTableComponent {
  readonly productService = inject(ProductService);

  // Signals for state
  statusFilter = signal<'all' | 'planned' | 'under_development' | 'production' | 'retired'>('all');
  searchQuery = signal('');
  currentPage = signal(1);
  pageSize = signal(25);
  openMenuId = signal<string | null>(null);

  // Computed: filtered products
  filteredProducts = computed(() => {
    let products = this.productService.filteredProducts();

    // Apply status filter
    if (this.statusFilter() !== 'all') {
      products = products.filter(p => p.status === this.statusFilter());
    }

    // Apply search filter
    const query = this.searchQuery().toLowerCase().trim();
    if (query) {
      products = products.filter(p =>
        p.name.toLowerCase().includes(query) ||
        p.description.toLowerCase().includes(query)
      );
    }

    return products;
  });

  // Pagination computed properties
  totalPages = computed(() => Math.max(1, Math.ceil(this.filteredProducts().length / this.pageSize())));

  paginatedProducts = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize();
    const end = start + this.pageSize();
    return this.filteredProducts().slice(start, end);
  });

  paginationStart = computed(() => {
    if (this.filteredProducts().length === 0) return 0;
    return (this.currentPage() - 1) * this.pageSize() + 1;
  });

  paginationEnd = computed(() => {
    const end = this.currentPage() * this.pageSize();
    return Math.min(end, this.filteredProducts().length);
  });

  visiblePages = computed(() => {
    const total = this.totalPages();
    const current = this.currentPage();
    const pages: number[] = [];

    if (total <= 5) {
      for (let i = 1; i <= total; i++) pages.push(i);
    } else {
      if (current <= 3) {
        pages.push(1, 2, 3, 4, 5);
      } else if (current >= total - 2) {
        for (let i = total - 4; i <= total; i++) pages.push(i);
      } else {
        for (let i = current - 2; i <= current + 2; i++) pages.push(i);
      }
    }

    return pages;
  });

  getCategoryName(categoryId: string): string {
    const cat = this.productService.categories().find(c => c.id === categoryId);
    return cat?.name || 'Uncategorized';
  }

  getStatusCount(status: string): number {
    return this.productService.filteredProducts().filter(p => p.status === status).length;
  }

  setStatusFilter(filter: 'all' | 'planned' | 'under_development' | 'production' | 'retired'): void {
    this.statusFilter.set(filter);
    this.currentPage.set(1);
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

  setPageSize(size: number): void {
    this.pageSize.set(Number(size));
    this.currentPage.set(1);
  }

  goToPage(page: number): void {
    this.currentPage.set(page);
  }

  previousPage(): void {
    if (this.currentPage() > 1) {
      this.currentPage.set(this.currentPage() - 1);
    }
  }

  nextPage(): void {
    if (this.currentPage() < this.totalPages()) {
      this.currentPage.set(this.currentPage() + 1);
    }
  }

  toggleMenu(productId: string, event: Event): void {
    event.stopPropagation();
    if (this.openMenuId() === productId) {
      this.openMenuId.set(null);
    } else {
      this.openMenuId.set(productId);
    }
  }

  viewProduct(productId: string): void {
    this.openMenuId.set(null);
    this.productService.selectProduct(productId);
    this.productService.setViewMode('factsheet');
  }

  editProduct(productId: string): void {
    this.openMenuId.set(null);
    this.productService.selectProduct(productId);
    this.productService.setViewMode('edit');
  }

  deleteProduct(productId: string, event: Event): void {
    event.stopPropagation();
    this.openMenuId.set(null);
    if (confirm('Are you sure you want to delete this product?')) {
      this.productService.deleteProduct(productId);
    }
  }
}
