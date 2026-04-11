import { inject } from '@angular/core';
import { AuthUiTextService } from '../i18n/auth-ui-text.service';
import { TenantContextService } from '../services/tenant-context.service';

export function initializeTenant(): Promise<void> {
  const tenantContext = inject(TenantContextService);
  const authUiText = inject(AuthUiTextService);
  return tenantContext.bootstrap().then(() => authUiText.preload());
}
