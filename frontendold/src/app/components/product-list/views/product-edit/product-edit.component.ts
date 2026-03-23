import { Component, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProductService } from '../../../../services/product.service';

@Component({
  selector: 'app-product-edit',
  standalone: true,
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (productService.selectedProduct()) {
      <header class="panel-header detail-header">
        <button class="btn btn-outline-secondary btn-sm"
                (click)="productService.setViewMode('factsheet')"
                aria-label="Cancel editing"
                data-testid="btn-cancel-edit">
          <img src="assets/icons/arrow-left.svg" alt="" class="btn-icon-dark" aria-hidden="true">
          Cancel
        </button>
        <button class="btn btn-primary btn-sm"
                (click)="productService.setViewMode('factsheet')"
                aria-label="Save changes"
                data-testid="btn-save-edit">
          <img src="assets/icons/check.svg" alt="" class="btn-icon" aria-hidden="true">
          Save
        </button>
      </header>

      <form class="edit-form" (ngSubmit)="productService.setViewMode('factsheet')">
        <!-- Product Name -->
        <div class="form-group">
          <label for="edit-product-name" class="form-label">Product Name</label>
          <input type="text"
                 id="edit-product-name"
                 class="form-control"
                 [ngModel]="productService.selectedProduct()!.name"
                 (ngModelChange)="productService.updateProduct(productService.selectedProduct()!.id, { name: $event })"
                 name="name"
                 placeholder="Enter product name"
                 data-testid="edit-product-name">
        </div>

        <!-- Description -->
        <div class="form-group">
          <label for="edit-product-desc" class="form-label">Description</label>
          <textarea id="edit-product-desc"
                    class="form-control"
                    rows="3"
                    [ngModel]="productService.selectedProduct()!.description"
                    (ngModelChange)="productService.updateProduct(productService.selectedProduct()!.id, { description: $event })"
                    name="description"
                    placeholder="Product description"
                    data-testid="edit-product-desc"></textarea>
        </div>

        <!-- Icon -->
        <div class="form-group">
          <label class="form-label">Icon</label>
          <div class="icon-picker">
            <div class="icon-display" (click)="editFileInput.click()" data-testid="edit-icon-picker">
              @if (editIconPreview()) {
                <img [src]="editIconPreview()" alt="Product icon" class="custom-icon">
              } @else {
                <img src="assets/icons/box.svg" alt="" class="default-icon">
              }
              <div class="icon-overlay">
                <img src="assets/icons/edit.svg" alt="" class="edit-icon">
              </div>
            </div>
            <input type="file"
                   #editFileInput
                   class="file-input"
                   accept="image/png,image/jpeg,image/svg+xml,image/webp"
                   (change)="onEditFileSelected($event)">
            @if (editIconPreview()) {
              <button type="button" class="btn-reset" (click)="removeEditIcon()" data-testid="btn-reset-icon">
                Reset to default
              </button>
            }
          </div>
        </div>

        <!-- Category -->
        <div class="form-group">
          <label for="edit-product-category" class="form-label">Category</label>
          <select id="edit-product-category"
                  class="form-control"
                  [ngModel]="productService.selectedProduct()!.category"
                  (ngModelChange)="productService.updateProduct(productService.selectedProduct()!.id, { category: $event })"
                  name="category"
                  data-testid="edit-product-category">
            <option value="">- Select category -</option>
            <option value="core">Core</option>
            <option value="support">Support</option>
            <option value="management">Management</option>
          </select>
        </div>
      </form>
    }
  `,
  styles: [`
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

    .detail-header {
      align-items: center;
    }

    // Button styles
    .btn-icon {
      width: 0.875rem;
      height: 0.875rem;
      filter: brightness(0) invert(1);
    }

    .btn-icon-dark {
      width: 0.875rem;
      height: 0.875rem;
      opacity: 0.6;
    }

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

    .btn-outline-secondary {
      background: $white;
      border-color: $gray-300;
      color: $gray-600;

      &:hover:not(:disabled) {
        background: $gray-50;
        border-color: $gray-400;
        color: $gray-700;
      }
    }

    .btn-sm {
      padding: 0.375rem 0.75rem;
      font-size: 0.8125rem;
    }

    // Edit form styles
    .edit-form {
      flex: 1;
      overflow-y: auto;
      padding: 1.5rem;

      @media (min-width: 1920px) {
        padding: 2rem;
      }
    }

    .form-group {
      display: flex;
      flex-direction: column;
      margin-bottom: 1.25rem;

      &:last-child {
        margin-bottom: 0;
      }
    }

    .form-label {
      font-size: 0.75rem;
      font-weight: 500;
      color: $gray-600;
      margin-bottom: 0.375rem;
    }

    .form-control {
      padding: 0.625rem 0.875rem;
      border: 1px solid $gray-200;
      border-radius: 0.375rem;
      font-size: 0.875rem;
      font-family: inherit;
      background: $white;
      color: $gray-800;

      &:focus {
        outline: none;
        border-color: $teal;
        box-shadow: 0 0 0 3px rgba($teal, 0.1);
      }

      &::placeholder {
        color: $gray-400;
      }
    }

    textarea.form-control {
      resize: vertical;
      min-height: 80px;
    }

    select.form-control {
      cursor: pointer;
      appearance: none;
      -webkit-appearance: none;
      -moz-appearance: none;
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
      background-repeat: no-repeat;
      background-position: right 0.75rem center;
      background-size: 1rem;
      padding-right: 2.5rem;
    }

    .file-input {
      display: none;
    }

    // Icon Picker
    .icon-picker {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.75rem;
    }

    .icon-display {
      position: relative;
      width: 120px;
      height: 120px;
      border-radius: 1rem;
      background: linear-gradient(135deg, $teal 0%, $teal-dark 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      overflow: hidden;
      transition: transform 0.2s ease;

      &:hover {
        transform: scale(1.02);

        .icon-overlay {
          opacity: 1;
        }
      }

      .default-icon {
        width: 56px;
        height: 56px;
        filter: brightness(0) invert(1);
        opacity: 0.9;
      }

      .custom-icon {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      .icon-overlay {
        position: absolute;
        inset: 0;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        opacity: 0;
        transition: opacity 0.2s ease;

        .edit-icon {
          width: 24px;
          height: 24px;
          filter: brightness(0) invert(1);
        }
      }
    }

    .btn-reset {
      background: none;
      border: none;
      font-size: 0.8125rem;
      color: $teal;
      cursor: pointer;
      font-family: inherit;
      padding: 0.25rem 0.5rem;

      &:hover {
        text-decoration: underline;
      }
    }
  `]
})
export class ProductEditComponent {
  readonly productService = inject(ProductService);

  // Signals for edit state
  editIconPreview = signal<string>('');
  isEditDragOver = signal(false);

  onEditFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.processEditFile(input.files[0]);
    }
  }

  private processEditFile(file: File): void {
    if (file.size > 2 * 1024 * 1024) {
      alert('File size must be less than 2MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const iconData = e.target?.result as string;
      this.editIconPreview.set(iconData);
      // Save icon to product
      const productId = this.productService.selectedProductId();
      if (productId) {
        this.productService.updateProduct(productId, { icon: iconData });
      }
    };
    reader.readAsDataURL(file);
  }

  removeEditIcon(): void {
    this.editIconPreview.set('');
    // Clear icon from product
    const productId = this.productService.selectedProductId();
    if (productId) {
      this.productService.updateProduct(productId, { icon: '' });
    }
  }
}
