import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, OnInit, signal } from '@angular/core';
import { finalize } from 'rxjs';
import { ApiGatewayService } from '../../core/api/api-gateway.service';
import { TenantListResponse } from '../../core/api/models';
import { PageFrameComponent } from '../../layout/page-frame/page-frame.component';

@Component({
  selector: 'app-tenants-page',
  standalone: true,
  imports: [CommonModule, PageFrameComponent],
  templateUrl: './tenants.page.html',
  styleUrl: './tenants.page.scss',
})
export class TenantsPageComponent implements OnInit {
  private readonly api = inject(ApiGatewayService);

  protected readonly page = signal(1);
  protected readonly limit = 20;
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly response = signal<TenantListResponse | null>(null);

  ngOnInit(): void {
    this.load(this.page());
  }

  protected load(page: number): void {
    this.loading.set(true);
    this.error.set(null);

    this.api
      .listTenants(page, this.limit)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (payload) => {
          this.page.set(payload.page);
          this.response.set(payload);
        },
        error: (error: unknown) => {
          this.error.set(formatHttpError(error));
        },
      });
  }

  protected nextPage(): void {
    const current = this.response();
    if (!current) {
      return;
    }

    const hasMore = current.page * current.limit < current.total;
    if (hasMore) {
      this.load(current.page + 1);
    }
  }

  protected prevPage(): void {
    const current = this.response();
    if (!current || current.page <= 1) {
      return;
    }

    this.load(current.page - 1);
  }
}

function formatHttpError(error: unknown): string {
  if (error instanceof HttpErrorResponse) {
    return `${error.status} ${error.statusText || 'Request failed'}: ${error.message}`;
  }

  return 'Failed to load tenants.';
}
