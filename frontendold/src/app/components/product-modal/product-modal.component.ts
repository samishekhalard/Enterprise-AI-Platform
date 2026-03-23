import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProductService } from '../../services/product.service';

@Component({
  selector: 'app-product-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    @if (productService.isAddModalOpen()) {
      <div class="modal-overlay" (click)="close()" role="dialog" aria-modal="true" aria-labelledby="modal-title">
        <div class="modal-container" (click)="$event.stopPropagation()">
          <!-- Modal Header -->
          <header class="modal-header">
            <h2 id="modal-title" class="modal-title">Create Product</h2>
            <button class="btn-close" (click)="close()" aria-label="Close modal">
              <img src="assets/icons/times.svg" alt="" aria-hidden="true">
            </button>
          </header>

          <!-- Modal Body -->
          <div class="modal-body">
            <!-- Product Name -->
            <div class="form-group">
              <label for="product-name" class="form-label">Product Name</label>
              <input type="text"
                     id="product-name"
                     class="form-control"
                     [(ngModel)]="formData.name"
                     placeholder="Enter product name"
                     autofocus>
            </div>

            <!-- Description -->
            <div class="form-group">
              <label for="product-description" class="form-label">Description</label>
              <textarea id="product-description"
                        class="form-control"
                        rows="3"
                        [(ngModel)]="formData.description"
                        placeholder="Product description"></textarea>
            </div>

            <!-- Product Icon -->
            <div class="form-group">
              <label class="form-label">Icon</label>
              <div class="icon-picker">
                <div class="icon-display" (click)="fileInput.click()">
                  @if (formData.icon) {
                    <img [src]="formData.icon" alt="Product icon" class="custom-icon">
                  } @else {
                    <img src="assets/icons/box.svg" alt="" class="default-icon">
                  }
                  <div class="icon-overlay">
                    <img src="assets/icons/edit.svg" alt="" class="edit-icon">
                  </div>
                </div>
                <input type="file"
                       #fileInput
                       class="file-input"
                       accept="image/png,image/jpeg,image/svg+xml,image/webp"
                       (change)="onFileSelected($event)">
                @if (formData.icon) {
                  <button type="button" class="btn-reset" (click)="removeIcon()">
                    Reset to default
                  </button>
                }
              </div>
            </div>

            <!-- Category -->
            <div class="form-group">
              <label for="product-category" class="form-label">Category</label>
              <select id="product-category"
                      class="form-control"
                      [(ngModel)]="formData.category">
                <option value="">- Select category -</option>
                <option value="core">Core</option>
                <option value="support">Support</option>
                <option value="management">Management</option>
              </select>
            </div>
          </div>

          <!-- Modal Footer -->
          <footer class="modal-footer">
            <button type="button"
                    class="btn btn-link"
                    (click)="close()">
              Close
            </button>
            <button type="button"
                    class="btn btn-primary"
                    (click)="createProduct()"
                    [disabled]="!formData.name.trim()">
              Create Product
            </button>
          </footer>
        </div>
      </div>
    }
  `,
  styles: [`
    // ThinkPLUS Brand Colors
    $teal-dark: #035a66;
    $teal: #047481;
    $teal-light: #5ee7f7;

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
    $danger: #ef4444;

    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: flex-start;
      justify-content: center;
      padding: 2rem;
      z-index: 1100;
      overflow-y: auto;
      font-family: 'Gotham Rounded', 'Nunito', -apple-system, BlinkMacSystemFont, sans-serif;
    }

    .modal-container {
      background: $white;
      border-radius: 0.5rem;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
      width: 100%;
      max-width: 640px;
      margin-top: 2rem;
      animation: modalSlideIn 0.2s ease-out;
    }

    @keyframes modalSlideIn {
      from {
        opacity: 0;
        transform: translateY(-20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .modal-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 1.25rem 1.5rem;
      border-bottom: 1px solid $gray-200;
    }

    .modal-title {
      font-size: 1.125rem;
      font-weight: 600;
      color: $gray-800;
      margin: 0;
    }

    .btn-close {
      width: 32px;
      height: 32px;
      padding: 0;
      border: none;
      background: transparent;
      border-radius: 0.25rem;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background 0.15s ease;

      img {
        width: 1.25rem;
        height: 1.25rem;
        opacity: 0.5;
      }

      &:hover {
        background: $gray-100;
        img { opacity: 0.8; }
      }

      &:focus-visible {
        outline: 2px solid $teal;
        outline-offset: 2px;
      }
    }

    .modal-body {
      padding: 1.5rem;
      max-height: calc(100vh - 250px);
      overflow-y: auto;
    }

    .form-group {
      margin-bottom: 1.25rem;

      &:last-child {
        margin-bottom: 0;
      }
    }

    .form-label {
      display: block;
      font-size: 0.8125rem;
      font-weight: 500;
      color: $gray-700;
      margin-bottom: 0.375rem;
    }

    .form-control {
      width: 100%;
      padding: 0.625rem 0.875rem;
      border: 1px solid $gray-200;
      border-radius: 0.375rem;
      font-size: 0.875rem;
      font-family: inherit;
      background: $white;
      color: $gray-800;
      transition: border-color 0.15s ease, box-shadow 0.15s ease;

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

    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;

      @media (max-width: 576px) {
        grid-template-columns: 1fr;
      }
    }

    .file-input {
      display: none;
    }

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

    .icon-preview {
      width: 48px;
      height: 48px;
      border: 1px solid $gray-200;
      border-radius: 0.375rem;
      display: flex;
      align-items: center;
      justify-content: center;
      background: $gray-50;

      img {
        max-width: 32px;
        max-height: 32px;
      }

      .default-icon {
        opacity: 0.3;
      }
    }

    .modal-footer {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 0.75rem;
      padding: 1rem 1.5rem;
      border-top: 1px solid $gray-200;
      background: $gray-50;
      border-radius: 0 0 0.5rem 0.5rem;
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

    .btn-outline-primary {
      background: $white;
      border-color: $teal;
      color: $teal;

      &:hover {
        background: rgba($teal, 0.05);
      }
    }

    .btn-link {
      background: transparent;
      border: none;
      color: $teal;
      padding: 0.5rem 0.75rem;

      &:hover {
        text-decoration: underline;
      }
    }

    .btn-plus {
      font-size: 1rem;
      font-weight: 400;
    }

    .btn-sm {
      padding: 0.375rem 0.75rem;
      font-size: 0.8125rem;
    }
  `]
})
export class ProductModalComponent {
  readonly productService = inject(ProductService);

  formData = {
    name: '',
    description: '',
    category: '',
    icon: ''
  };

  isDragOver = false;

  close(): void {
    this.productService.closeAddModal();
    this.resetForm();
    document.body.style.overflow = '';
  }

  resetForm(): void {
    this.formData = {
      name: '',
      description: '',
      category: '',
      icon: ''
    };
  }

  createProduct(): void {
    if (!this.formData.name.trim()) return;

    this.productService.createProduct({
      name: this.formData.name.trim(),
      description: this.formData.description.trim(),
      icon: this.formData.icon,
      category: this.formData.category,
      status: 'planned'
    });
    this.close();
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.processFile(input.files[0]);
    }
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = false;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = false;

    const files = event.dataTransfer?.files;
    if (files && files[0]) {
      const file = files[0];
      if (file.type.startsWith('image/')) {
        this.processFile(file);
      }
    }
  }

  private processFile(file: File): void {
    if (file.size > 2 * 1024 * 1024) {
      alert('File size must be less than 2MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      this.formData.icon = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  }

  removeIcon(): void {
    this.formData.icon = '';
  }
}
