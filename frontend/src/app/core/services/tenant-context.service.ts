import { inject, Injectable, signal } from '@angular/core';
import { catchError, firstValueFrom, map, of } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiGatewayService } from '../api/api-gateway.service';
import { TenantResolveResponse } from '../api/models';

@Injectable({
  providedIn: 'root',
})
export class TenantContextService {
  private readonly api = inject(ApiGatewayService);
  private readonly tenantIdState = signal<string | null>(
    this.normalizeTenantId(environment.defaultTenantId),
  );
  private readonly tenantNameState = signal('master');
  private readonly resolvedState = signal(false);

  readonly tenantId = this.tenantIdState.asReadonly();
  readonly tenantName = this.tenantNameState.asReadonly();
  readonly resolved = this.resolvedState.asReadonly();

  bootstrap(): Promise<void> {
    return firstValueFrom(
      this.api.resolveTenant().pipe(
        map((response) => this.applyResolvedTenant(response)),
        catchError(() => {
          this.resolvedState.set(true);
          return of(void 0);
        }),
      ),
    ).then(() => undefined);
  }

  setTenantFromInput(input: string): boolean {
    const normalized = this.normalizeTenantId(input);
    if (!normalized) {
      return false;
    }

    this.tenantIdState.set(normalized);
    return true;
  }

  private applyResolvedTenant(response: TenantResolveResponse): void {
    const candidate = response.tenant?.uuid ?? response.tenant?.id ?? null;
    const normalized = this.normalizeTenantId(candidate);

    if (normalized) {
      this.tenantIdState.set(normalized);
    }

    const tenantName = response.tenant?.shortName?.trim();
    if (tenantName) {
      this.tenantNameState.set(tenantName);
    }

    this.resolvedState.set(true);
  }

  private normalizeTenantId(value: string | null | undefined): string | null {
    if (!value) {
      return null;
    }

    const trimmed = value.trim();
    if (!trimmed) {
      return null;
    }

    if (isUuid(trimmed)) {
      return trimmed.toLowerCase();
    }

    const mapped = environment.tenantAliasMap[trimmed.toLowerCase()];
    if (mapped && isUuid(mapped)) {
      return mapped.toLowerCase();
    }

    return null;
  }
}

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}
