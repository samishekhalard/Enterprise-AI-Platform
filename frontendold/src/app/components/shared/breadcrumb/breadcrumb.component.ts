import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

/**
 * Breadcrumb item interface
 */
export interface BreadcrumbItem {
  label: string;
  route?: string;
  action?: () => void;
}

/**
 * BreadcrumbComponent
 *
 * Shared breadcrumb navigation component with standardized styling.
 *
 * Design Specifications (Reference: Administration page):
 * - Position: Fixed (top: 109px, left: 56px)
 * - Background: Transparent
 * - Separator: Dot (•)
 * - Font size: 14px (0.875rem)
 * - Links: Teal (#047481) with underline on hover
 * - Active item: Gray (#545e6e)
 *
 * Usage with routes:
 * ```html
 * <app-breadcrumb [items]="[
 *   { label: 'Administration', route: '/administration' },
 *   { label: 'Tenant Management' }
 * ]" />
 * ```
 *
 * Usage with actions:
 * ```html
 * <app-breadcrumb [items]="[
 *   { label: 'Administration' },
 *   { label: 'Tenant Management', action: () => goToList() },
 *   { label: 'Edit Tenant' }
 * ]" />
 * ```
 */
@Component({
  selector: 'app-breadcrumb',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <nav class="breadcrumb-nav" aria-label="Breadcrumb">
      <ol class="breadcrumb">
        @for (item of items; track item.label; let last = $last) {
          <li class="breadcrumb-item" [class.active]="last">
            @if (!last && item.route) {
              <a [routerLink]="item.route" class="breadcrumb-link">{{ item.label }}</a>
            } @else if (!last && item.action) {
              <button type="button" class="breadcrumb-link" (click)="item.action()">{{ item.label }}</button>
            } @else {
              <span class="breadcrumb-current">{{ item.label }}</span>
            }
          </li>
        }
      </ol>
    </nav>
  `,
  styleUrl: './breadcrumb.component.scss'
})
export class BreadcrumbComponent {
  @Input() items: BreadcrumbItem[] = [];
}
