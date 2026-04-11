import { AppEnvironment } from './environment.model';

export const environment: AppEnvironment = {
  production: false,
  apiBaseUrl: 'http://localhost:8080',
  defaultLandingRoute: 'administration',
  defaultTenantId: '68cd2a56-98c9-4ed4-8534-c299566d5b27',
  tenantAliasMap: {
    'tenant-master': '68cd2a56-98c9-4ed4-8534-c299566d5b27',
    master: '68cd2a56-98c9-4ed4-8534-c299566d5b27',
  },
};
