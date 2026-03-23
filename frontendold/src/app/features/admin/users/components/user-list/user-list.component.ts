import {
  Component,
  Input,
  OnInit,
  OnChanges,
  OnDestroy,
  SimpleChanges,
  ChangeDetectionStrategy,
  inject,
  signal,
  computed
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';
import { UserAdminService } from '../../services/user-admin.service';
import {
  TenantUser,
  UserListParams,
  UserRole,
  ROLE_DISPLAY_MAP,
  USER_STATUS_OPTIONS,
  USER_ROLE_OPTIONS,
  PAGE_SIZE_OPTIONS
} from '../../models/user.model';

/**
 * User List Component
 *
 * Displays a paginated list of tenant users with search, role filter,
 * status filter, and card/table view toggle. Designed as a self-contained
 * component for embedding in the tenant factsheet Users tab.
 */
@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="user-list" data-testid="user-list">
      <!-- Toolbar -->
      <div class="list-toolbar">
        <div class="toolbar-left">
          <!-- Search -->
          <div class="search-wrapper">
            <svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <input
              type="text"
              class="search-input"
              placeholder="Search users by name or email..."
              [ngModel]="searchTerm()"
              (ngModelChange)="onSearchChange($event)"
              aria-label="Search users"
              data-testid="search-input" />
            @if (searchTerm()) {
              <button
                class="search-clear"
                (click)="clearSearch()"
                aria-label="Clear search"
                data-testid="btn-clear-search">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            }
          </div>

          <!-- Role Filter -->
          <select
            class="filter-select"
            [ngModel]="roleFilter()"
            (ngModelChange)="onRoleFilterChange($event)"
            aria-label="Filter by role"
            data-testid="filter-role">
            @for (option of roleOptions; track option.value) {
              <option [value]="option.value">{{ option.label }}</option>
            }
          </select>

          <!-- Status Filter -->
          <select
            class="filter-select"
            [ngModel]="statusFilter()"
            (ngModelChange)="onStatusFilterChange($event)"
            aria-label="Filter by status"
            data-testid="filter-status">
            @for (option of statusOptions; track option.value) {
              <option [value]="option.value">{{ option.label }}</option>
            }
          </select>
        </div>

        <div class="toolbar-right">
          <!-- Result Count -->
          <span class="result-count" data-testid="result-count">
            {{ totalElements() }} user{{ totalElements() === 1 ? '' : 's' }}
          </span>

          <!-- View Toggle -->
          <div class="view-toggle" role="group" aria-label="List view mode">
            <button
              class="toggle-btn"
              [class.active]="userListView() === 'grid'"
              (click)="userListView.set('grid')"
              aria-label="Grid view"
              data-testid="btn-view-grid">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="3" width="7" height="7"></rect>
                <rect x="14" y="3" width="7" height="7"></rect>
                <rect x="3" y="14" width="7" height="7"></rect>
                <rect x="14" y="14" width="7" height="7"></rect>
              </svg>
            </button>
            <button
              class="toggle-btn"
              [class.active]="userListView() === 'table'"
              (click)="userListView.set('table')"
              aria-label="Table view"
              data-testid="btn-view-table">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="8" y1="6" x2="21" y2="6"></line>
                <line x1="8" y1="12" x2="21" y2="12"></line>
                <line x1="8" y1="18" x2="21" y2="18"></line>
                <line x1="3" y1="6" x2="3.01" y2="6"></line>
                <line x1="3" y1="12" x2="3.01" y2="12"></line>
                <line x1="3" y1="18" x2="3.01" y2="18"></line>
              </svg>
            </button>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      @if (isLoading()) {
        <div class="loading-state" data-testid="loading-state">
          @if (userListView() === 'grid') {
            <div class="skeleton-grid">
              @for (i of skeletonItems; track i) {
                <div class="skeleton-card">
                  <div class="skeleton-avatar"></div>
                  <div class="skeleton-line skeleton-name"></div>
                  <div class="skeleton-line skeleton-email"></div>
                  <div class="skeleton-line skeleton-role"></div>
                </div>
              }
            </div>
          } @else {
            <div class="skeleton-table">
              @for (i of skeletonItems; track i) {
                <div class="skeleton-row">
                  <div class="skeleton-cell skeleton-avatar-sm"></div>
                  <div class="skeleton-cell skeleton-name"></div>
                  <div class="skeleton-cell skeleton-email"></div>
                  <div class="skeleton-cell skeleton-role"></div>
                  <div class="skeleton-cell skeleton-status"></div>
                  <div class="skeleton-cell skeleton-date"></div>
                  <div class="skeleton-cell skeleton-actions"></div>
                </div>
              }
            </div>
          }
        </div>
      }

      <!-- Error State -->
      @if (error() && !isLoading()) {
        <div class="error-state" data-testid="error-state">
          <div class="error-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
          </div>
          <h3 class="error-title">Failed to Load Users</h3>
          <p class="error-message">{{ error() }}</p>
          <button
            class="btn btn-primary"
            (click)="retry()"
            aria-label="Retry loading users"
            data-testid="btn-retry">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="23 4 23 10 17 10"></polyline>
              <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
            </svg>
            Retry
          </button>
        </div>
      }

      <!-- Empty State -->
      @if (isEmpty() && !error()) {
        <div class="empty-state" data-testid="empty-state">
          <div class="empty-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
              <circle cx="9" cy="7" r="4"></circle>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
            </svg>
          </div>
          <h3 class="empty-title">
            @if (hasActiveFilters()) {
              No Users Match Filters
            } @else {
              No Users Found
            }
          </h3>
          <p class="empty-description">
            @if (hasActiveFilters()) {
              Try adjusting your search or filter criteria.
            } @else {
              No users have been assigned to this tenant yet.
            }
          </p>
          @if (hasActiveFilters()) {
            <button
              class="btn btn-outline-secondary"
              (click)="clearAllFilters()"
              aria-label="Clear all filters"
              data-testid="btn-clear-filters">
              Clear Filters
            </button>
          }
        </div>
      }

      <!-- Grid View -->
      @if (userListView() === 'grid' && hasUsers() && !isLoading() && !error()) {
        <div class="user-grid" data-testid="user-grid">
          @for (user of users(); track user.id) {
            <div class="user-card" [class.inactive]="!user.active" data-testid="user-card">
              <div class="card-top">
                <div class="user-avatar" [class]="'avatar-' + getAvatarColor(user)">
                  {{ getInitials(user) }}
                </div>
                <span class="status-indicator" [class]="user.active ? 'status-active' : 'status-inactive'"
                      [title]="user.active ? 'Active' : 'Inactive'">
                </span>
              </div>
              <div class="card-body">
                <h4 class="user-name" data-testid="user-name">{{ user.displayName }}</h4>
                <p class="user-email" data-testid="user-email">{{ user.email }}</p>
                <div class="user-provider">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                    <path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  <span>{{ user.identityProvider }}</span>
                </div>
              </div>
              <div class="card-roles" data-testid="user-roles">
                @for (role of user.roles; track role) {
                  <span class="role-pill" [class]="getRoleClass(role)">
                    {{ getRoleLabel(role) }}
                  </span>
                } @empty {
                  <span class="role-pill role-none">No roles</span>
                }
              </div>
              <div class="card-footer">
                <span class="last-login" data-testid="user-last-login">
                  @if (user.lastLoginAt) {
                    Last login: {{ formatDate(user.lastLoginAt) }}
                  } @else {
                    Never logged in
                  }
                </span>
              </div>
            </div>
          }
        </div>
      }

      <!-- Table View -->
      @if (userListView() === 'table' && hasUsers() && !isLoading() && !error()) {
        <div class="table-container" data-testid="user-table">
          <table class="user-table">
            <thead>
              <tr>
                <th class="col-avatar"></th>
                <th class="col-name">Name</th>
                <th class="col-email">Email</th>
                <th class="col-roles">Roles</th>
                <th class="col-status">Status</th>
                <th class="col-login">Last Login</th>
                <th class="col-provider">Provider</th>
              </tr>
            </thead>
            <tbody>
              @for (user of users(); track user.id) {
                <tr [class.inactive]="!user.active" data-testid="user-row">
                  <td class="col-avatar">
                    <div class="table-avatar" [class]="'avatar-' + getAvatarColor(user)">
                      {{ getInitials(user) }}
                    </div>
                  </td>
                  <td class="col-name" data-testid="user-name">
                    <span class="user-name-cell">{{ user.displayName }}</span>
                    @if (user.emailVerified) {
                      <svg class="verified-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                           title="Email verified" aria-label="Email verified">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                        <polyline points="22 4 12 14.01 9 11.01"></polyline>
                      </svg>
                    }
                  </td>
                  <td class="col-email" data-testid="user-email">{{ user.email }}</td>
                  <td class="col-roles" data-testid="user-roles">
                    <div class="roles-cell">
                      @for (role of user.roles; track role) {
                        <span class="role-pill role-pill-sm" [class]="getRoleClass(role)">
                          {{ getRoleLabel(role) }}
                        </span>
                      } @empty {
                        <span class="role-pill role-pill-sm role-none">No roles</span>
                      }
                    </div>
                  </td>
                  <td class="col-status" data-testid="user-status">
                    <span class="status-badge" [class]="user.active ? 'badge-active' : 'badge-inactive'">
                      {{ user.active ? 'Active' : 'Inactive' }}
                    </span>
                  </td>
                  <td class="col-login" data-testid="user-last-login">
                    @if (user.lastLoginAt) {
                      {{ formatDate(user.lastLoginAt) }}
                    } @else {
                      <span class="text-muted">Never</span>
                    }
                  </td>
                  <td class="col-provider">
                    <span class="provider-tag">{{ user.identityProvider }}</span>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }

      <!-- Pagination -->
      @if (hasUsers() && !isLoading() && !error() && totalPages() > 1) {
        <div class="pagination" data-testid="pagination">
          <div class="pagination-info">
            Showing {{ paginationStart() }}--{{ paginationEnd() }} of {{ totalElements() }}
          </div>
          <div class="pagination-controls">
            <select
              class="page-size-select"
              [ngModel]="currentPageSize()"
              (ngModelChange)="onPageSizeChange($event)"
              aria-label="Items per page"
              data-testid="select-page-size">
              @for (size of pageSizeOptions; track size) {
                <option [ngValue]="size">{{ size }} / page</option>
              }
            </select>

            <button
              class="page-btn"
              [disabled]="currentPage() === 0"
              (click)="goToPage(0)"
              aria-label="First page"
              data-testid="btn-first-page">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="11 17 6 12 11 7"></polyline>
                <polyline points="18 17 13 12 18 7"></polyline>
              </svg>
            </button>
            <button
              class="page-btn"
              [disabled]="currentPage() === 0"
              (click)="goToPage(currentPage() - 1)"
              aria-label="Previous page"
              data-testid="btn-prev-page">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="15 18 9 12 15 6"></polyline>
              </svg>
            </button>

            <span class="page-indicator">
              Page {{ currentPage() + 1 }} of {{ totalPages() }}
            </span>

            <button
              class="page-btn"
              [disabled]="currentPage() >= totalPages() - 1"
              (click)="goToPage(currentPage() + 1)"
              aria-label="Next page"
              data-testid="btn-next-page">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="9 18 15 12 9 6"></polyline>
              </svg>
            </button>
            <button
              class="page-btn"
              [disabled]="currentPage() >= totalPages() - 1"
              (click)="goToPage(totalPages() - 1)"
              aria-label="Last page"
              data-testid="btn-last-page">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="13 17 18 12 13 7"></polyline>
                <polyline points="6 17 11 12 6 7"></polyline>
              </svg>
            </button>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    $teal-primary: #047481;
    $teal-dark: #035a66;
    $teal-light: #e0f7fa;

    $gray-50: #f8fafc;
    $gray-100: #f1f5f9;
    $gray-200: #e2e8f0;
    $gray-300: #cbd5e1;
    $gray-400: #94a3b8;
    $gray-500: #64748b;
    $gray-600: #475569;
    $gray-700: #334155;
    $gray-800: #1e293b;

    $white: #ffffff;
    $red-500: #ef4444;
    $red-50: #fef2f2;
    $orange-500: #f97316;
    $orange-50: #fff7ed;
    $blue-500: #3b82f6;
    $blue-50: #eff6ff;
    $green-500: #22c55e;
    $green-50: #f0fdf4;
    $success: #10b981;
    $danger: #ef4444;

    $font-family: 'Gotham Rounded', 'Nunito', -apple-system, BlinkMacSystemFont, sans-serif;
    $shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
    $shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1);
    $shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
    $border-radius: 0.375rem;
    $border-radius-lg: 0.5rem;
    $border-radius-full: 9999px;
    $transition: all 0.15s ease;

    .user-list {
      font-family: $font-family;
    }

    // ── Toolbar ──────────────────────────────────────────────
    .list-toolbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      margin-bottom: 1.25rem;
      flex-wrap: wrap;
    }

    .toolbar-left {
      display: flex;
      align-items: center;
      gap: 0.625rem;
      flex-wrap: wrap;
      flex: 1;
      min-width: 0;
    }

    .toolbar-right {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      flex-shrink: 0;
    }

    .search-wrapper {
      position: relative;
      flex: 1;
      min-width: 200px;
      max-width: 320px;
    }

    .search-icon {
      position: absolute;
      left: 0.625rem;
      top: 50%;
      transform: translateY(-50%);
      width: 16px;
      height: 16px;
      color: $gray-400;
      pointer-events: none;
    }

    .search-input {
      width: 100%;
      padding: 0.5rem 2rem 0.5rem 2.125rem;
      border: 1px solid $gray-200;
      border-radius: $border-radius;
      font-size: 0.8125rem;
      font-family: inherit;
      color: $gray-700;
      background: $white;
      transition: $transition;
      outline: none;

      &::placeholder {
        color: $gray-400;
      }

      &:focus {
        border-color: $teal-primary;
        box-shadow: 0 0 0 3px rgba(4, 116, 129, 0.1);
      }
    }

    .search-clear {
      position: absolute;
      right: 0.375rem;
      top: 50%;
      transform: translateY(-50%);
      display: flex;
      align-items: center;
      justify-content: center;
      width: 20px;
      height: 20px;
      padding: 0;
      background: transparent;
      border: none;
      border-radius: $border-radius;
      color: $gray-400;
      cursor: pointer;

      svg {
        width: 14px;
        height: 14px;
      }

      &:hover {
        color: $gray-600;
        background: $gray-100;
      }
    }

    .filter-select {
      padding: 0.5rem 2rem 0.5rem 0.625rem;
      border: 1px solid $gray-200;
      border-radius: $border-radius;
      font-size: 0.8125rem;
      font-family: inherit;
      color: $gray-700;
      background: $white;
      cursor: pointer;
      outline: none;
      appearance: none;
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
      background-repeat: no-repeat;
      background-position: right 0.5rem center;
      transition: $transition;

      &:focus {
        border-color: $teal-primary;
        box-shadow: 0 0 0 3px rgba(4, 116, 129, 0.1);
      }
    }

    .result-count {
      font-size: 0.75rem;
      color: $gray-500;
      white-space: nowrap;
    }

    .view-toggle {
      display: flex;
      border: 1px solid $gray-200;
      border-radius: $border-radius;
      overflow: hidden;
    }

    .toggle-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 34px;
      height: 34px;
      padding: 0;
      border: none;
      background: $white;
      color: $gray-400;
      cursor: pointer;
      transition: $transition;

      svg {
        width: 16px;
        height: 16px;
      }

      &:hover {
        color: $gray-600;
        background: $gray-50;
      }

      &.active {
        background: $teal-primary;
        color: $white;
      }

      &:not(:last-child) {
        border-right: 1px solid $gray-200;
      }
    }

    // ── Loading / Skeleton ───────────────────────────────────
    .loading-state {
      padding: 1rem 0;
    }

    .skeleton-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
      gap: 1rem;
    }

    .skeleton-card {
      background: $white;
      border: 1px solid $gray-200;
      border-radius: $border-radius-lg;
      padding: 1.25rem;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.75rem;
    }

    .skeleton-table {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .skeleton-row {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 0.75rem 1rem;
      background: $white;
      border: 1px solid $gray-200;
      border-radius: $border-radius;
    }

    .skeleton-avatar {
      width: 48px;
      height: 48px;
      border-radius: $border-radius-full;
      background: linear-gradient(90deg, $gray-100 25%, $gray-200 50%, $gray-100 75%);
      background-size: 200% 100%;
      animation: shimmer 1.5s infinite;
    }

    .skeleton-avatar-sm {
      width: 32px;
      height: 32px;
      border-radius: $border-radius-full;
    }

    .skeleton-line {
      height: 12px;
      border-radius: 4px;
      background: linear-gradient(90deg, $gray-100 25%, $gray-200 50%, $gray-100 75%);
      background-size: 200% 100%;
      animation: shimmer 1.5s infinite;
    }

    .skeleton-cell {
      height: 12px;
      border-radius: 4px;
      background: linear-gradient(90deg, $gray-100 25%, $gray-200 50%, $gray-100 75%);
      background-size: 200% 100%;
      animation: shimmer 1.5s infinite;
    }

    .skeleton-name { width: 120px; }
    .skeleton-email { width: 160px; flex: 1; }
    .skeleton-role { width: 80px; }
    .skeleton-status { width: 60px; }
    .skeleton-date { width: 100px; }
    .skeleton-actions { width: 40px; }

    @keyframes shimmer {
      0% { background-position: -200% 0; }
      100% { background-position: 200% 0; }
    }

    // ── Error State ──────────────────────────────────────────
    .error-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 3rem 1rem;
      text-align: center;
    }

    .error-icon {
      width: 48px;
      height: 48px;
      margin-bottom: 1rem;

      svg {
        width: 100%;
        height: 100%;
        color: $danger;
      }
    }

    .error-title {
      font-size: 1rem;
      font-weight: 600;
      color: $gray-800;
      margin: 0 0 0.5rem;
    }

    .error-message {
      font-size: 0.8125rem;
      color: $gray-500;
      margin: 0 0 1.25rem;
      max-width: 400px;
    }

    // ── Empty State ──────────────────────────────────────────
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 3rem 1rem;
      text-align: center;
    }

    .empty-icon {
      width: 48px;
      height: 48px;
      margin-bottom: 1rem;

      svg {
        width: 100%;
        height: 100%;
        color: $gray-300;
      }
    }

    .empty-title {
      font-size: 1rem;
      font-weight: 600;
      color: $gray-800;
      margin: 0 0 0.5rem;
    }

    .empty-description {
      font-size: 0.8125rem;
      color: $gray-500;
      margin: 0 0 1.25rem;
      max-width: 400px;
    }

    // ── Buttons ──────────────────────────────────────────────
    .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.375rem;
      padding: 0.5rem 1rem;
      border-radius: $border-radius;
      font-size: 0.8125rem;
      font-weight: 500;
      font-family: inherit;
      cursor: pointer;
      transition: $transition;
      border: 1px solid transparent;

      svg {
        width: 16px;
        height: 16px;
      }

      &:focus-visible {
        outline: 2px solid $teal-primary;
        outline-offset: 2px;
      }

      &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
    }

    .btn-primary {
      background: $teal-primary;
      border-color: $teal-primary;
      color: $white;

      &:hover:not(:disabled) {
        background: $teal-dark;
        border-color: $teal-dark;
      }
    }

    .btn-outline-secondary {
      background: $white;
      border-color: $gray-200;
      color: $gray-700;

      &:hover:not(:disabled) {
        background: $gray-50;
        border-color: $gray-300;
      }
    }

    // ── Grid View ────────────────────────────────────────────
    .user-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
      gap: 1rem;
    }

    .user-card {
      background: $white;
      border: 1px solid $gray-200;
      border-radius: $border-radius-lg;
      padding: 1.25rem;
      transition: $transition;

      &:hover {
        box-shadow: $shadow-md;
        border-color: $gray-300;
      }

      &.inactive {
        opacity: 0.65;
      }
    }

    .card-top {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      margin-bottom: 0.75rem;
    }

    .user-avatar, .table-avatar {
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: $border-radius-full;
      font-weight: 600;
      text-transform: uppercase;
      color: $white;
    }

    .user-avatar {
      width: 48px;
      height: 48px;
      font-size: 1rem;
    }

    .table-avatar {
      width: 32px;
      height: 32px;
      font-size: 0.6875rem;
      flex-shrink: 0;
    }

    .avatar-teal { background: $teal-primary; }
    .avatar-blue { background: $blue-500; }
    .avatar-green { background: $green-500; }
    .avatar-orange { background: $orange-500; }
    .avatar-red { background: $red-500; }

    .status-indicator {
      width: 10px;
      height: 10px;
      border-radius: $border-radius-full;
      border: 2px solid $white;
      box-shadow: $shadow-sm;

      &.status-active { background: $success; }
      &.status-inactive { background: $gray-300; }
    }

    .card-body {
      margin-bottom: 0.75rem;
    }

    .user-name {
      font-size: 0.9375rem;
      font-weight: 600;
      color: $gray-800;
      margin: 0 0 0.125rem;
    }

    .user-email {
      font-size: 0.8125rem;
      color: $gray-500;
      margin: 0 0 0.5rem;
      word-break: break-all;
    }

    .user-provider {
      display: flex;
      align-items: center;
      gap: 0.25rem;
      font-size: 0.75rem;
      color: $gray-400;

      svg {
        width: 12px;
        height: 12px;
      }
    }

    .card-roles {
      display: flex;
      flex-wrap: wrap;
      gap: 0.375rem;
      margin-bottom: 0.75rem;
    }

    .card-footer {
      border-top: 1px solid $gray-100;
      padding-top: 0.625rem;
    }

    .last-login {
      font-size: 0.6875rem;
      color: $gray-400;
    }

    // ── Role Pills ───────────────────────────────────────────
    .role-pill {
      display: inline-flex;
      align-items: center;
      padding: 0.125rem 0.5rem;
      border-radius: $border-radius-full;
      font-size: 0.6875rem;
      font-weight: 600;
      letter-spacing: 0.01em;
      white-space: nowrap;
    }

    .role-pill-sm {
      padding: 0.0625rem 0.375rem;
      font-size: 0.625rem;
    }

    .role-super-admin {
      background: $red-50;
      color: $red-500;
    }

    .role-admin {
      background: $orange-50;
      color: $orange-500;
    }

    .role-manager {
      background: $blue-50;
      color: $blue-500;
    }

    .role-user {
      background: $green-50;
      color: $green-500;
    }

    .role-viewer {
      background: $gray-100;
      color: $gray-500;
    }

    .role-none {
      background: $gray-100;
      color: $gray-400;
      font-style: italic;
      font-weight: 400;
    }

    // ── Table View ───────────────────────────────────────────
    .table-container {
      overflow-x: auto;
      border: 1px solid $gray-200;
      border-radius: $border-radius-lg;
    }

    .user-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.8125rem;

      thead {
        background: $gray-50;
        border-bottom: 1px solid $gray-200;

        th {
          padding: 0.625rem 0.75rem;
          text-align: left;
          font-weight: 600;
          font-size: 0.6875rem;
          color: $gray-500;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          white-space: nowrap;
        }
      }

      tbody {
        tr {
          border-bottom: 1px solid $gray-100;
          transition: $transition;

          &:last-child {
            border-bottom: none;
          }

          &:hover {
            background: $gray-50;
          }

          &.inactive {
            opacity: 0.65;
          }
        }

        td {
          padding: 0.625rem 0.75rem;
          color: $gray-700;
          vertical-align: middle;
        }
      }
    }

    .col-avatar {
      width: 48px;
    }

    .user-name-cell {
      font-weight: 500;
      color: $gray-800;
    }

    .verified-icon {
      display: inline-block;
      width: 14px;
      height: 14px;
      color: $success;
      margin-left: 0.25rem;
      vertical-align: middle;
    }

    .roles-cell {
      display: flex;
      flex-wrap: wrap;
      gap: 0.25rem;
    }

    .status-badge {
      display: inline-flex;
      align-items: center;
      padding: 0.125rem 0.5rem;
      border-radius: $border-radius-full;
      font-size: 0.6875rem;
      font-weight: 600;

      &.badge-active {
        background: rgba(16, 185, 129, 0.1);
        color: $success;
      }

      &.badge-inactive {
        background: $gray-100;
        color: $gray-500;
      }
    }

    .text-muted {
      color: $gray-400;
    }

    .provider-tag {
      display: inline-block;
      padding: 0.0625rem 0.375rem;
      border-radius: $border-radius;
      background: $gray-100;
      font-size: 0.6875rem;
      color: $gray-600;
    }

    // ── Pagination ───────────────────────────────────────────
    .pagination {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-top: 1.25rem;
      padding-top: 0.75rem;
      border-top: 1px solid $gray-100;
      flex-wrap: wrap;
      gap: 0.75rem;
    }

    .pagination-info {
      font-size: 0.75rem;
      color: $gray-500;
    }

    .pagination-controls {
      display: flex;
      align-items: center;
      gap: 0.375rem;
    }

    .page-size-select {
      padding: 0.25rem 1.5rem 0.25rem 0.5rem;
      border: 1px solid $gray-200;
      border-radius: $border-radius;
      font-size: 0.75rem;
      font-family: inherit;
      color: $gray-600;
      background: $white;
      cursor: pointer;
      outline: none;
      appearance: none;
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
      background-repeat: no-repeat;
      background-position: right 0.375rem center;
      margin-right: 0.5rem;
    }

    .page-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 30px;
      height: 30px;
      padding: 0;
      border: 1px solid $gray-200;
      border-radius: $border-radius;
      background: $white;
      color: $gray-600;
      cursor: pointer;
      transition: $transition;

      svg {
        width: 14px;
        height: 14px;
      }

      &:hover:not(:disabled) {
        background: $gray-50;
        border-color: $gray-300;
      }

      &:disabled {
        opacity: 0.4;
        cursor: not-allowed;
      }
    }

    .page-indicator {
      font-size: 0.75rem;
      color: $gray-500;
      padding: 0 0.5rem;
      white-space: nowrap;
    }

    // ── Responsive ───────────────────────────────────────────
    @media (max-width: 768px) {
      .toolbar-left {
        flex-direction: column;
        align-items: stretch;
      }

      .search-wrapper {
        max-width: 100%;
      }

      .filter-select {
        width: 100%;
      }

      .user-grid {
        grid-template-columns: 1fr;
      }

      .pagination {
        flex-direction: column;
        align-items: center;
      }
    }
  `]
})
export class UserListComponent implements OnInit, OnChanges, OnDestroy {
  private readonly userService = inject(UserAdminService);
  private readonly destroy$ = new Subject<void>();
  private readonly searchSubject = new Subject<string>();

  @Input({ required: true }) tenantId!: string;

  // View state
  readonly userListView = signal<'grid' | 'table'>('table');
  readonly searchTerm = signal('');
  readonly roleFilter = signal('');
  readonly statusFilter = signal('');
  readonly currentPageSize = signal(10);

  // Service state delegation
  readonly users = this.userService.users;
  readonly totalElements = this.userService.totalElements;
  readonly totalPages = this.userService.totalPages;
  readonly currentPage = this.userService.currentPage;
  readonly isLoading = this.userService.isLoading;
  readonly error = this.userService.error;
  readonly hasUsers = this.userService.hasUsers;
  readonly isEmpty = this.userService.isEmpty;

  // Computed pagination display values
  readonly paginationStart = computed(() => {
    if (this.totalElements() === 0) return 0;
    return this.currentPage() * this.currentPageSize() + 1;
  });

  readonly paginationEnd = computed(() => {
    const end = (this.currentPage() + 1) * this.currentPageSize();
    return Math.min(end, this.totalElements());
  });

  readonly hasActiveFilters = computed(() =>
    this.searchTerm() !== '' || this.roleFilter() !== '' || this.statusFilter() !== ''
  );

  // Static data
  readonly roleOptions = USER_ROLE_OPTIONS;
  readonly statusOptions = USER_STATUS_OPTIONS;
  readonly pageSizeOptions = PAGE_SIZE_OPTIONS;
  readonly skeletonItems = [1, 2, 3, 4, 5, 6];

  private readonly avatarColors = ['teal', 'blue', 'green', 'orange', 'red'];

  ngOnInit(): void {
    // Setup debounced search
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(term => {
      this.searchTerm.set(term);
      this.loadUsers(0);
    });

    if (this.tenantId) {
      this.loadUsers();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['tenantId'] && !changes['tenantId'].firstChange) {
      this.userService.reset();
      this.searchTerm.set('');
      this.roleFilter.set('');
      this.statusFilter.set('');
      this.currentPageSize.set(10);
      this.loadUsers();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Load users with current filter and pagination state.
   */
  loadUsers(page?: number): void {
    if (!this.tenantId) return;

    const params: UserListParams = {
      page: page ?? this.currentPage(),
      size: this.currentPageSize(),
      search: this.searchTerm() || undefined,
      role: this.roleFilter() || undefined,
      status: this.statusFilter() || undefined
    };

    this.userService.getUsers(this.tenantId, params).subscribe({
      error: err => console.error('Failed to load users:', err)
    });
  }

  /**
   * Handle search input changes with debounce.
   */
  onSearchChange(value: string): void {
    this.searchSubject.next(value);
  }

  /**
   * Clear the search input and reload.
   */
  clearSearch(): void {
    this.searchTerm.set('');
    this.searchSubject.next('');
    this.loadUsers(0);
  }

  /**
   * Handle role filter change.
   */
  onRoleFilterChange(role: string): void {
    this.roleFilter.set(role);
    this.loadUsers(0);
  }

  /**
   * Handle status filter change.
   */
  onStatusFilterChange(status: string): void {
    this.statusFilter.set(status);
    this.loadUsers(0);
  }

  /**
   * Clear all active filters and reload.
   */
  clearAllFilters(): void {
    this.searchTerm.set('');
    this.roleFilter.set('');
    this.statusFilter.set('');
    this.loadUsers(0);
  }

  /**
   * Navigate to a specific page.
   */
  goToPage(page: number): void {
    if (page < 0 || page >= this.totalPages()) return;
    this.loadUsers(page);
  }

  /**
   * Handle page size change.
   */
  onPageSizeChange(size: number): void {
    this.currentPageSize.set(size);
    this.loadUsers(0);
  }

  /**
   * Retry loading after an error.
   */
  retry(): void {
    this.userService.clearError();
    this.loadUsers();
  }

  /**
   * Get user initials for avatar display.
   */
  getInitials(user: TenantUser): string {
    const first = user.firstName?.charAt(0) || '';
    const last = user.lastName?.charAt(0) || '';
    if (first && last) return `${first}${last}`;
    if (user.displayName) {
      const parts = user.displayName.split(' ');
      return parts.length > 1
        ? `${parts[0].charAt(0)}${parts[parts.length - 1].charAt(0)}`
        : parts[0].charAt(0);
    }
    return user.email?.charAt(0)?.toUpperCase() || '?';
  }

  /**
   * Get a deterministic avatar color based on user ID.
   */
  getAvatarColor(user: TenantUser): string {
    let hash = 0;
    const str = user.id || user.email;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % this.avatarColors.length;
    return this.avatarColors[index];
  }

  /**
   * Get the CSS class for a role pill.
   */
  getRoleClass(role: string): string {
    const display = ROLE_DISPLAY_MAP[role as UserRole];
    return display?.cssClass || 'role-viewer';
  }

  /**
   * Get the display label for a role.
   */
  getRoleLabel(role: string): string {
    const display = ROLE_DISPLAY_MAP[role as UserRole];
    return display?.label || role;
  }

  /**
   * Format an ISO date string for display.
   */
  formatDate(dateStr: string | null): string {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return dateStr;
    }
  }
}
