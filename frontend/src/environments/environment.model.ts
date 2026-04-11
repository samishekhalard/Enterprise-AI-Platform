export interface AppEnvironment {
  readonly production: boolean;
  readonly apiBaseUrl: string;
  readonly defaultLandingRoute: string;
  readonly defaultTenantId: string;
  readonly tenantAliasMap: Readonly<Record<string, string>>;
}
