import { Component, Input, signal, ContentChild, TemplateRef, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

/**
 * Breadcrumb item interface
 */
export interface BreadcrumbItem {
  label: string;
  route?: string;
  icon?: string;
}

/**
 * Sidebar navigation item interface
 */
export interface SidebarNavItem {
  label: string;
  route: string;
  icon?: string;
  badge?: string | number;
  children?: SidebarNavItem[];
}

/**
 * Page Layout Component
 *
 * Implements the standardized containerized layout:
 * - Breadcrumb Container
 * - Docker Container (Sidebar) - optional
 * - Main Container
 *
 * Usage:
 * ```html
 * <app-page-layout
 *   [breadcrumbs]="breadcrumbItems"
 *   [showSidebar]="true"
 *   [sidebarTitle]="'Filters'"
 *   [sidebarCollapsible]="true">
 *
 *   <ng-template #sidebarContent>
 *     <!-- Sidebar content -->
 *   </ng-template>
 *
 *   <ng-template #actions>
 *     <button class="btn btn-primary">Create</button>
 *   </ng-template>
 *
 *   <!-- Main content goes here -->
 *   <div class="content-section">...</div>
 * </app-page-layout>
 * ```
 */
@Component({
  selector: 'app-page-layout',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './page-layout.component.html',
  styleUrl: './page-layout.component.scss'
})
export class PageLayoutComponent implements OnChanges {
  // Breadcrumb configuration
  @Input() breadcrumbs: BreadcrumbItem[] = [];
  @Input() pageTitle: string = '';
  @Input() showBreadcrumb: boolean = true;

  // Sidebar configuration
  @Input() showSidebar: boolean = false;
  @Input() sidebarTitle: string = '';
  @Input() sidebarCollapsible: boolean = true;
  @Input() sidebarCollapsed: boolean = false;
  @Input() sidebarNavItems: SidebarNavItem[] = [];
  @Input() sidebarWidth: 'narrow' | 'normal' | 'wide' = 'normal';

  // Main content configuration
  @Input() contentPadding: 'none' | 'small' | 'normal' | 'large' = 'normal';
  @Input() contentBackground: 'default' | 'white' | 'transparent' = 'default';

  // Loading and error states
  @Input() loading: boolean = false;
  @Input() loadingMessage: string = 'Loading...';
  @Input() error: string | null = null;
  @Input() emptyState: boolean = false;
  @Input() emptyTitle: string = 'No data found';
  @Input() emptyMessage: string = '';

  // Template refs for custom content
  @ContentChild('sidebarContent') sidebarContent!: TemplateRef<any>;
  @ContentChild('actions') actionsTemplate!: TemplateRef<any>;
  @ContentChild('emptyStateTemplate') emptyStateTemplate!: TemplateRef<any>;

  // Internal state
  isSidebarCollapsed = signal(false);

  constructor() {
    // Initialize collapsed state from input
    this.isSidebarCollapsed.set(this.sidebarCollapsed);
  }

  ngOnChanges(_changes: SimpleChanges): void {
    // Update collapsed state when input changes
    this.isSidebarCollapsed.set(this.sidebarCollapsed);
  }

  toggleSidebar(): void {
    if (this.sidebarCollapsible) {
      this.isSidebarCollapsed.update(v => !v);
    }
  }

  getSidebarWidthClass(): string {
    switch (this.sidebarWidth) {
      case 'narrow': return 'sidebar-narrow';
      case 'wide': return 'sidebar-wide';
      default: return 'sidebar-normal';
    }
  }

  getContentPaddingClass(): string {
    switch (this.contentPadding) {
      case 'none': return 'padding-none';
      case 'small': return 'padding-small';
      case 'large': return 'padding-large';
      default: return 'padding-normal';
    }
  }

  getContentBackgroundClass(): string {
    switch (this.contentBackground) {
      case 'white': return 'bg-white';
      case 'transparent': return 'bg-transparent';
      default: return 'bg-default';
    }
  }

  retryAction(): void {
    // Emit event or callback for retry
    window.dispatchEvent(new CustomEvent('page-layout:retry'));
  }
}
