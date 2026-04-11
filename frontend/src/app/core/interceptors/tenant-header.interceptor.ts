import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { TenantContextService } from '../services/tenant-context.service';

export const tenantHeaderInterceptor: HttpInterceptorFn = (request, next) => {
  const tenantContext = inject(TenantContextService);
  const requestTargetsApi = request.url.includes('/api/');
  const hasTenantHeader = request.headers.has('X-Tenant-ID');
  const resolvedTenantId = tenantContext.tenantId();

  if (!requestTargetsApi || hasTenantHeader || !resolvedTenantId) {
    return next(request);
  }

  return next(
    request.clone({
      setHeaders: {
        'X-Tenant-ID': resolvedTenantId,
      },
    }),
  );
};
