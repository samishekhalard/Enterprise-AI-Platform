import { inject } from '@angular/core';
import { TenantContextService } from '../services/tenant-context.service';

export function initializeTenant(): Promise<void> {
  const tenantContext = inject(TenantContextService);
  return tenantContext.bootstrap();
}
