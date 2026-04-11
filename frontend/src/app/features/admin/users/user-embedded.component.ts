import { CommonModule, DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import {
  Component,
  computed,
  DestroyRef,
  inject,
  Input,
  OnChanges,
  OnInit,
  signal,
  SimpleChanges,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { SelectModule } from 'primeng/select';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { TableModule } from 'primeng/table';
import { PaginatorModule } from 'primeng/paginator';
import { TagModule } from 'primeng/tag';
import { NgIcon } from '@ng-icons/core';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, filter } from 'rxjs/operators';
import { ApiGatewayService } from '../../../core/api/api-gateway.service';
import { TenantUser, UserSession } from '../../../core/api/models';
import {
  MOBILE_DIALOG_BREAKPOINTS,
  SESSIONS_DIALOG_STYLE,
  standardDialogPt,
} from '../../../core/theme/overlay-presets';

type UserSortField = 'displayName' | 'email' | 'role' | 'status' | 'lastActive';
type SortDirection = 'asc' | 'desc';

interface SelectOption<T> {
  label: string;
  value: T;
}

@Component({
  selector: 'app-user-embedded',
  standalone: true,
  imports: [
    CommonModule,
    DatePipe,
    FormsModule,
    ButtonModule,
    CardModule,
    DialogModule,
    InputTextModule,
    MessageModule,
    PaginatorModule,
    ProgressSpinnerModule,
    SelectModule,
    TableModule,
    TagModule,
    NgIcon,
  ],
  templateUrl: './user-embedded.component.html',
  styleUrl: './user-embedded.component.scss',
})
export class UserEmbeddedComponent implements OnInit, OnChanges {
  private readonly api = inject(ApiGatewayService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly searchSubject = new Subject<string>();
  protected readonly roleOptions: SelectOption<string>[] = [
    { label: 'All roles', value: '' },
    { label: 'Admin', value: 'ADMIN' },
    { label: 'Super Admin', value: 'SUPER_ADMIN' },
    { label: 'Manager', value: 'MANAGER' },
    { label: 'User', value: 'USER' },
    { label: 'Viewer', value: 'VIEWER' },
    { label: 'Tenant Admin', value: 'TENANT_ADMIN' },
    { label: 'Power User', value: 'POWER_USER' },
    { label: 'Contributor', value: 'CONTRIBUTOR' },
  ];
  protected readonly statusOptions: SelectOption<string>[] = [
    { label: 'All status', value: '' },
    { label: 'Active', value: 'active' },
    { label: 'Inactive', value: 'inactive' },
  ];
  protected readonly userTablePt = {
    root: {
      style: {
        border: '1px solid var(--tp-border)',
        'border-radius': 'var(--nm-radius-lg)',
        overflow: 'hidden',
      },
    },
    headerCell: {
      style: {
        padding: 'var(--tp-space-3)',
        background: 'var(--tp-surface-muted)',
        'border-block-end': '1px solid var(--tp-border)',
      },
    },
    bodyCell: {
      style: {
        padding: 'var(--tp-space-3)',
        'border-block-end': '1px solid color-mix(in srgb, var(--tp-border) 30%, transparent)',
      },
    },
  } as const;
  protected readonly sessionTablePt = {
    root: {
      style: {
        border: '1px solid var(--tp-border)',
        'border-radius': 'var(--nm-radius-lg)',
        overflow: 'hidden',
      },
    },
    headerCell: {
      style: {
        padding: 'var(--tp-space-3)',
        background: 'var(--tp-surface-muted)',
        'border-block-end': '1px solid var(--tp-border)',
      },
    },
    bodyCell: {
      style: {
        padding: 'var(--tp-space-3)',
        'border-block-end': '1px solid color-mix(in srgb, var(--tp-border) 30%, transparent)',
        'vertical-align': 'top',
      },
    },
  } as const;
  protected readonly sessionDialogPt = standardDialogPt;
  protected readonly sessionDialogStyle = SESSIONS_DIALOG_STYLE;
  protected readonly sessionDialogBreakpoints = MOBILE_DIALOG_BREAKPOINTS;

  @Input({ required: true }) tenantId = '';
  @Input() tenantName = 'Tenant';

  protected readonly search = signal('');
  protected readonly roleFilter = signal('');
  protected readonly statusFilter = signal('');
  protected readonly page = signal(0);
  protected readonly pageSize = signal(20);
  protected readonly totalElements = signal(0);
  protected readonly totalPages = signal(0);
  protected readonly sortField = signal<UserSortField>('displayName');
  protected readonly sortDirection = signal<SortDirection>('asc');
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly users = signal<TenantUser[]>([]);

  // ── Session dialog state ─────────────────────────────────────────────────
  protected readonly selectedUser = signal<TenantUser | null>(null);
  protected readonly showSessions = signal(false);
  protected readonly sessions = signal<UserSession[]>([]);
  protected readonly sessionsLoading = signal(false);
  protected readonly sessionsError = signal<string | null>(null);
  protected readonly revokingAll = signal(false);

  protected readonly sortedUsers = computed(() => {
    const field = this.sortField();
    const direction = this.sortDirection();
    const factor = direction === 'asc' ? 1 : -1;

    const sorted = [...this.users()].sort((left, right) => {
      const leftValue = this.sortableValue(left, field);
      const rightValue = this.sortableValue(right, field);
      return leftValue.localeCompare(rightValue, undefined, { sensitivity: 'base' }) * factor;
    });

    return sorted;
  });

  ngOnInit(): void {
    this.searchSubject
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        filter((q) => q.length >= 3 || q.length === 0),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => this.applyFilters());

    this.loadUsers();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['tenantId'] && !changes['tenantId'].firstChange) {
      this.search.set('');
      this.roleFilter.set('');
      this.statusFilter.set('');
      this.page.set(0);
      this.loadUsers();
    }
  }

  protected loadUsers(): void {
    if (!this.tenantId.trim()) {
      this.users.set([]);
      this.error.set('Tenant identifier is missing.');
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    this.api
      .listTenantUsers(this.tenantId, {
        page: this.page(),
        size: this.pageSize(),
        search: this.search().trim() || undefined,
        role: this.roleFilter().trim() || undefined,
        status: this.statusFilter().trim() || undefined,
      })
      .subscribe({
        next: (response) => {
          this.users.set([...response.content]);
          this.totalElements.set(response.totalElements);
          this.totalPages.set(response.totalPages);
          this.loading.set(false);
        },
        error: (error: unknown) => {
          this.users.set([]);
          this.error.set(this.resolveErrorMessage(error));
          this.loading.set(false);
        },
      });
  }

  protected applyFilters(): void {
    this.page.set(0);
    this.loadUsers();
  }

  protected resetFilters(): void {
    this.search.set('');
    this.roleFilter.set('');
    this.statusFilter.set('');
    this.page.set(0);
    this.loadUsers();
  }

  protected onPageChange(event: {
    first: number;
    rows: number;
    page: number;
    pageCount: number;
  }): void {
    this.page.set(event.page);
    this.pageSize.set(event.rows);
    this.loadUsers();
  }

  protected toggleSort(field: UserSortField): void {
    if (this.sortField() === field) {
      this.sortDirection.update((value) => (value === 'asc' ? 'desc' : 'asc'));
      return;
    }

    this.sortField.set(field);
    this.sortDirection.set('asc');
  }

  protected sortIndicator(field: UserSortField): string {
    if (this.sortField() !== field) {
      return '';
    }
    return this.sortDirection() === 'asc' ? '▲' : '▼';
  }

  protected onSearchInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.search.set(value);
    this.searchSubject.next(value);
  }

  protected displayRole(user: TenantUser): string {
    if (user.roles.length === 0) {
      return 'No role';
    }
    return user.roles.map((role) => this.humanizeRole(role)).join(', ');
  }

  protected statusLabel(user: TenantUser): 'active' | 'inactive' {
    return user.active ? 'active' : 'inactive';
  }

  protected statusSeverity(status: 'active' | 'inactive'): 'success' | 'secondary' {
    return status === 'active' ? 'success' : 'secondary';
  }

  protected lastActive(user: TenantUser): string {
    if (!user.lastLoginAt) {
      return 'Never';
    }
    return user.lastLoginAt;
  }

  protected openSessions(user: TenantUser): void {
    this.selectedUser.set(user);
    this.showSessions.set(true);
    this.loadSessions(user.id);
  }

  protected closeSessions(): void {
    this.showSessions.set(false);
    this.selectedUser.set(null);
    this.sessions.set([]);
    this.sessionsError.set(null);
  }

  protected revokeAll(): void {
    const user = this.selectedUser();
    if (!user) return;
    this.revokingAll.set(true);
    this.api.revokeAllUserSessions(user.id).subscribe({
      next: () => {
        this.sessions.update((list) =>
          list.map((s) => (s.status === 'ACTIVE' ? { ...s, status: 'REVOKED' as const } : s)),
        );
        this.revokingAll.set(false);
      },
      error: () => {
        this.sessionsError.set('Failed to revoke sessions.');
        this.revokingAll.set(false);
      },
    });
  }

  protected sessionSeverity(status: string): 'success' | 'warn' | 'danger' | 'secondary' {
    const map: Record<string, 'success' | 'warn' | 'danger' | 'secondary'> = {
      ACTIVE: 'success',
      EXPIRED: 'warn',
      REVOKED: 'danger',
      LOGGED_OUT: 'secondary',
    };
    return map[status] ?? 'secondary';
  }

  protected hasActiveSessions(): boolean {
    return this.sessions().some((s) => s.status === 'ACTIVE');
  }

  protected activeSessionCount(): number {
    return this.sessions().filter((s) => s.status === 'ACTIVE').length;
  }

  private loadSessions(userId: string): void {
    this.sessionsLoading.set(true);
    this.sessionsError.set(null);
    this.api.getUserSessions(userId).subscribe({
      next: (list) => {
        this.sessions.set(list);
        this.sessionsLoading.set(false);
      },
      error: () => {
        this.sessionsError.set('Failed to load sessions.');
        this.sessionsLoading.set(false);
      },
    });
  }

  private sortableValue(user: TenantUser, field: UserSortField): string {
    if (field === 'displayName') {
      return user.displayName ?? '';
    }
    if (field === 'email') {
      return user.email ?? '';
    }
    if (field === 'role') {
      return this.displayRole(user);
    }
    if (field === 'status') {
      return this.statusLabel(user);
    }
    return this.lastActive(user);
  }

  private humanizeRole(role: string): string {
    return role
      .replace(/^ROLE_/i, '')
      .toLowerCase()
      .replace(/[_-]+/g, ' ')
      .replace(/\b\w/g, (char) => char.toUpperCase());
  }

  private resolveErrorMessage(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      if (error.status === 403) {
        return 'Access denied for tenant users. Verify ADMIN scope and tenant context.';
      }
      if (error.status === 404) {
        return 'Tenant users endpoint returned not found.';
      }
      if (typeof error.error === 'string' && error.error.trim().length > 0) {
        return error.error;
      }
      if (typeof error.error === 'object' && error.error !== null) {
        const message = (error.error as Record<string, unknown>)['message'];
        if (typeof message === 'string' && message.trim().length > 0) {
          return message;
        }
      }
    }

    return 'Unable to load tenant users from backend.';
  }
}
