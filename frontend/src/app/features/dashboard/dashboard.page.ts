import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { TagModule } from 'primeng/tag';
import { ApiGatewayService } from '../../core/api/api-gateway.service';
import { SessionService } from '../../core/services/session.service';
import { PageFrameComponent } from '../../layout/page-frame/page-frame.component';

interface DashboardStats {
  readonly totalTenants: number;
  readonly activeUsers: number;
  readonly licenseStatus: string;
  readonly activeProcesses: number;
}

interface ActivityItem {
  readonly id: string;
  readonly icon: string;
  readonly description: string;
  readonly timestamp: string;
  readonly type: 'info' | 'success' | 'warning';
}

interface QuickLink {
  readonly label: string;
  readonly route: string;
  readonly description: string;
  readonly icon: string;
}

const MOCK_ACTIVITIES: readonly ActivityItem[] = [
  {
    id: 'a1',
    icon: 'pi pi-user-plus',
    description: 'New user registered in tenant "Master"',
    timestamp: '2 minutes ago',
    type: 'success',
  },
  {
    id: 'a2',
    icon: 'pi pi-shield',
    description: 'License renewed for Enterprise tier',
    timestamp: '15 minutes ago',
    type: 'info',
  },
  {
    id: 'a3',
    icon: 'pi pi-exclamation-triangle',
    description: 'Tenant "Acme Corp" approaching seat limit',
    timestamp: '1 hour ago',
    type: 'warning',
  },
  {
    id: 'a4',
    icon: 'pi pi-cog',
    description: 'System configuration updated by admin',
    timestamp: '3 hours ago',
    type: 'info',
  },
  {
    id: 'a5',
    icon: 'pi pi-check-circle',
    description: 'Scheduled backup completed successfully',
    timestamp: '6 hours ago',
    type: 'success',
  },
];

const QUICK_LINKS: readonly QuickLink[] = [
  {
    label: 'Administration',
    route: '/administration',
    description: 'Manage tenants, licenses, and system settings',
    icon: 'pi pi-cog',
  },
  {
    label: 'Tenants',
    route: '/tenants',
    description: 'Browse and manage tenant organizations',
    icon: 'pi pi-building',
  },
  {
    label: 'Profile',
    route: '/profile',
    description: 'View and update your account settings',
    icon: 'pi pi-user',
  },
];

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    CardModule,
    ButtonModule,
    ProgressSpinnerModule,
    TagModule,
    PageFrameComponent,
  ],
  templateUrl: './dashboard.page.html',
  styleUrl: './dashboard.page.scss',
})
export class DashboardPageComponent implements OnInit {
  private readonly api = inject(ApiGatewayService);
  private readonly session = inject(SessionService);

  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly stats = signal<DashboardStats | null>(null);
  protected readonly activities = signal<readonly ActivityItem[]>(MOCK_ACTIVITIES);
  protected readonly quickLinks = signal<readonly QuickLink[]>(QUICK_LINKS);

  protected readonly userName = computed(() => {
    const claims = this.session.getAccessTokenClaims();
    if (!claims) {
      return 'User';
    }

    const name =
      asString(claims['name']) ??
      asString(claims['preferred_username']) ??
      asString(claims['email']) ??
      asString(claims['sub']) ??
      'User';

    return name;
  });

  protected readonly userRole = computed(() => {
    const claims = this.session.getAccessTokenClaims();
    if (!claims) {
      return 'Unknown';
    }

    const roles = claims['realm_access'] as Record<string, unknown> | undefined;
    if (roles && Array.isArray(roles['roles'])) {
      const roleList = roles['roles'] as string[];
      return roleList.length > 0 ? roleList[0] : 'User';
    }

    return asString(claims['role']) ?? 'User';
  });

  protected readonly licenseTagSeverity = computed(() => {
    const status = this.stats()?.licenseStatus;
    if (!status) {
      return 'info' as const;
    }

    switch (status.toLowerCase()) {
      case 'active':
      case 'valid':
        return 'success' as const;
      case 'expiring':
        return 'warn' as const;
      case 'expired':
      case 'invalid':
        return 'danger' as const;
      default:
        return 'info' as const;
    }
  });

  ngOnInit(): void {
    this.loadStats();
  }

  protected loadStats(): void {
    this.loading.set(true);
    this.error.set(null);

    forkJoin({
      tenants: this.api.listTenants(1, 1),
      license: this.api.getLicenseStatus(),
    })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: ({ tenants, license }) => {
          this.stats.set({
            totalTenants: tenants.total ?? 0,
            activeUsers: license.activeTenantCount ?? 0,
            licenseStatus: license.state ?? 'Unknown',
            activeProcesses: 0,
          });
        },
        error: (err: unknown) => {
          this.error.set(formatHttpError(err));
          this.stats.set({
            totalTenants: 0,
            activeUsers: 0,
            licenseStatus: 'Unknown',
            activeProcesses: 0,
          });
        },
      });
  }

  protected activitySeverity(type: ActivityItem['type']): 'success' | 'info' | 'warn' {
    switch (type) {
      case 'success':
        return 'success';
      case 'warning':
        return 'warn';
      default:
        return 'info';
    }
  }
}

function asString(value: unknown): string | null {
  return typeof value === 'string' && value.trim().length > 0 ? value : null;
}

function formatHttpError(error: unknown): string {
  if (error instanceof HttpErrorResponse) {
    return `${error.status} ${error.statusText || 'Request failed'}: ${error.message}`;
  }

  return 'Failed to load dashboard data.';
}
