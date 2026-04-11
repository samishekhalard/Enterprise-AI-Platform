import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, HostListener, inject, OnInit, signal } from '@angular/core';
import { finalize } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { MessageModule } from 'primeng/message';
import { PaginatorModule } from 'primeng/paginator';
import { TagModule } from 'primeng/tag';
import { TableModule } from 'primeng/table';
import { ApiGatewayService } from '../../core/api/api-gateway.service';
import { TenantListResponse } from '../../core/api/models';
import { PageFrameComponent } from '../../layout/page-frame/page-frame.component';

@Component({
  selector: 'app-tenants-page',
  standalone: true,
  imports: [
    CommonModule,
    ButtonModule,
    MessageModule,
    PaginatorModule,
    TagModule,
    TableModule,
    PageFrameComponent,
  ],
  templateUrl: './tenants.page.html',
  styleUrl: './tenants.page.scss',
})
export class TenantsPageComponent implements OnInit {
  private readonly api = inject(ApiGatewayService);
  protected readonly isMobileViewport = signal(isMobileTenantViewport());
  protected readonly pageSizeOptions = [10, 20, 50, 100] as const;
  protected readonly tenantTablePt = {
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
  protected readonly tenantPaginatorPt = {
    root: {
      style: {
        border: '0',
        'border-block-start': '1px solid var(--tp-border)',
        background: 'var(--tp-surface-raised)',
        padding: 'var(--tp-space-3) var(--tp-space-4)',
      },
    },
  } as const;

  protected readonly page = signal(1);
  protected readonly pageSize = signal(20);
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly response = signal<TenantListResponse | null>(null);
  protected readonly tenantRows = computed(() => [...(this.response()?.tenants ?? [])]);
  protected readonly paginatorReportTemplate = computed(() =>
    this.isMobileViewport()
      ? 'Page {currentPage} of {totalPages}'
      : 'Showing {first} to {last} of {totalRecords}',
  );
  protected readonly rowsPerPageOptions = computed(() =>
    this.isMobileViewport() ? [] : [...this.pageSizeOptions],
  );

  ngOnInit(): void {
    this.load(this.page());
  }

  @HostListener('window:resize')
  protected onWindowResize(): void {
    this.isMobileViewport.set(isMobileTenantViewport());
  }

  protected load(page: number): void {
    this.loading.set(true);
    this.error.set(null);

    this.api
      .listTenants(page, this.pageSize())
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (payload) => {
          this.page.set(payload.page);
          this.pageSize.set(payload.limit);
          this.response.set(payload);
        },
        error: (error: unknown) => {
          this.error.set(formatHttpError(error));
        },
      });
  }

  protected onPageChange(event: { page?: number; rows?: number }): void {
    this.pageSize.set(event.rows ?? this.pageSize());
    this.load((event.page ?? 0) + 1);
  }

  protected tenantStatusSeverity(
    status: string | undefined,
  ): 'success' | 'warn' | 'danger' | 'contrast' | 'info' | 'secondary' {
    switch ((status ?? '').toUpperCase()) {
      case 'ACTIVE':
        return 'success';
      case 'TRIAL':
      case 'PENDING':
        return 'warn';
      case 'SUSPENDED':
      case 'DECOMMISSIONED':
        return 'danger';
      case 'MASTER':
        return 'contrast';
      default:
        return 'secondary';
    }
  }
}

function formatHttpError(error: unknown): string {
  if (error instanceof HttpErrorResponse) {
    return `${error.status} ${error.statusText || 'Request failed'}: ${error.message}`;
  }

  return 'Failed to load tenants.';
}

function isMobileTenantViewport(): boolean {
  return typeof window !== 'undefined' ? window.innerWidth < 768 : false;
}
