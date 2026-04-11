/**
 * Tenant Fact Sheet — Local models for the parking prototype.
 *
 * These interfaces will be merged into core/api/models.ts once approved.
 */

// ─── Enums ────────────────────────────────────────────────────────────────────

export type TenantType = 'MASTER' | 'REGULAR' | 'DOMINANT';

export type TenantStatus = 'ACTIVE' | 'SUSPENDED' | 'PROVISIONING' | 'PROVISIONING_FAILED';

export type HealthStatus = 'HEALTHY' | 'DEGRADED' | 'UNHEALTHY';

export type FactsheetTab =
  | 'users'
  | 'branding'
  | 'integrations'
  | 'dictionary'
  | 'agents'
  | 'studio'
  | 'audit'
  | 'health'
  | 'license';

// ─── Tab Metadata ─────────────────────────────────────────────────────────────

export interface TabDefinition {
  readonly value: FactsheetTab;
  readonly label: string;
  readonly icon: string;
  readonly count: number | null;
}

export const FACTSHEET_TABS: readonly TabDefinition[] = [
  { value: 'users', label: 'Users', icon: 'pi pi-users', count: 24 },
  { value: 'branding', label: 'Branding', icon: 'pi pi-palette', count: null },
  { value: 'integrations', label: 'Integrations', icon: 'pi pi-link', count: 3 },
  { value: 'dictionary', label: 'Dictionary', icon: 'pi pi-book', count: 12 },
  { value: 'agents', label: 'Agents', icon: 'pi pi-android', count: 3 },
  { value: 'studio', label: 'Studio', icon: 'pi pi-sitemap', count: 5 },
  { value: 'audit', label: 'Audit Log', icon: 'pi pi-history', count: 1247 },
  { value: 'health', label: 'Health Checks', icon: 'pi pi-heart', count: 4 },
  { value: 'license', label: 'License', icon: 'pi pi-id-card', count: null },
] as const;

// ─── KPI ──────────────────────────────────────────────────────────────────────

export interface KpiChip {
  readonly label: string;
  readonly value: string;
  readonly icon: string;
}

// ─── Tenant ───────────────────────────────────────────────────────────────────

export interface TenantFactsheet {
  readonly id: string;
  readonly name: string;
  readonly shortName: string;
  readonly type: TenantType;
  readonly status: TenantStatus;
  readonly health: HealthStatus;
  readonly logoUrl: string | null;
  readonly kpis: readonly KpiChip[];
}

// ─── Lifecycle Actions ────────────────────────────────────────────────────────

export type LifecycleAction = 'suspend' | 'reactivate';

export interface LifecycleActionDef {
  readonly action: LifecycleAction;
  readonly label: string;
  readonly icon: string;
  readonly severity: 'danger' | 'warn' | 'success' | 'primary' | 'secondary';
}

export const LIFECYCLE_ACTIONS: Record<TenantStatus, LifecycleActionDef | null> = {
  ACTIVE: { action: 'suspend', label: 'Suspend', icon: 'pi pi-pause', severity: 'danger' },
  SUSPENDED: {
    action: 'reactivate',
    label: 'Reactivate',
    icon: 'pi pi-play',
    severity: 'success',
  },
  PROVISIONING: null,
  PROVISIONING_FAILED: null,
};

// ─── Sample Data: Users Tab ───────────────────────────────────────────────────

export interface TenantUser {
  readonly id: string;
  readonly name: string;
  readonly email: string;
  readonly role: string;
  readonly status: 'Active' | 'Invited' | 'Disabled';
  readonly lastActive: string;
}

export const SAMPLE_USERS: readonly TenantUser[] = [
  {
    id: 'u1',
    name: 'Sarah Chen',
    email: 'sarah.chen@acme.com',
    role: 'Admin',
    status: 'Active',
    lastActive: '2 hours ago',
  },
  {
    id: 'u2',
    name: 'Marcus Rivera',
    email: 'marcus.r@acme.com',
    role: 'User',
    status: 'Active',
    lastActive: '1 day ago',
  },
  {
    id: 'u3',
    name: 'Aisha Patel',
    email: 'aisha.p@acme.com',
    role: 'User',
    status: 'Active',
    lastActive: '3 hours ago',
  },
  {
    id: 'u4',
    name: 'James Whitfield',
    email: 'j.whitfield@acme.com',
    role: 'Viewer',
    status: 'Invited',
    lastActive: 'Never',
  },
  {
    id: 'u5',
    name: 'Lina Tomasetti',
    email: 'lina.t@acme.com',
    role: 'Admin',
    status: 'Disabled',
    lastActive: '30 days ago',
  },
] as const;

// ─── Sample Data: Integrations Tab ───────────────────────────────────────────

export interface Integration {
  readonly id: string;
  readonly name: string;
  readonly protocol: 'OIDC' | 'SAML' | 'LDAP';
  readonly enabled: boolean;
  readonly icon: string;
}

export const SAMPLE_INTEGRATIONS: readonly Integration[] = [
  { id: 'i1', name: 'Azure AD', protocol: 'OIDC', enabled: true, icon: 'pi pi-microsoft' },
  { id: 'i2', name: 'Okta', protocol: 'SAML', enabled: true, icon: 'pi pi-shield' },
  { id: 'i3', name: 'Corporate LDAP', protocol: 'LDAP', enabled: false, icon: 'pi pi-server' },
] as const;

// ─── Sample Data: Dictionary Tab ─────────────────────────────────────────────

export interface DictionaryEntry {
  readonly id: string;
  readonly objectType: string;
  readonly attributeCount: number;
  readonly origin: 'Seeded' | 'Custom';
}

export const SAMPLE_DICTIONARY: readonly DictionaryEntry[] = [
  { id: 'd1', objectType: 'Employee', attributeCount: 18, origin: 'Seeded' },
  { id: 'd2', objectType: 'Department', attributeCount: 8, origin: 'Seeded' },
  { id: 'd3', objectType: 'Project', attributeCount: 14, origin: 'Custom' },
  { id: 'd4', objectType: 'Asset', attributeCount: 22, origin: 'Seeded' },
  { id: 'd5', objectType: 'Incident', attributeCount: 11, origin: 'Custom' },
] as const;

// ─── Sample Data: Agents Tab ─────────────────────────────────────────────────

export interface AgentCard {
  readonly id: string;
  readonly name: string;
  readonly status: 'Deployed' | 'Draft';
  readonly skillCount: number;
}

export const SAMPLE_AGENTS: readonly AgentCard[] = [
  { id: 'a1', name: 'Onboarding Bot', status: 'Deployed', skillCount: 5 },
  { id: 'a2', name: 'Compliance Checker', status: 'Deployed', skillCount: 3 },
  { id: 'a3', name: 'Data Enrichment', status: 'Draft', skillCount: 2 },
] as const;

// ─── Sample Data: Audit Log Tab ──────────────────────────────────────────────

export interface AuditEntry {
  readonly id: string;
  readonly timestamp: string;
  readonly actor: string;
  readonly action: string;
  readonly target: string;
}

export const SAMPLE_AUDIT: readonly AuditEntry[] = [
  {
    id: 'al1',
    timestamp: '2026-03-23 09:14:22',
    actor: 'Sarah Chen',
    action: 'Updated branding',
    target: 'Theme Settings',
  },
  {
    id: 'al2',
    timestamp: '2026-03-23 08:45:10',
    actor: 'System',
    action: 'Sync completed',
    target: 'Azure AD',
  },
  {
    id: 'al3',
    timestamp: '2026-03-22 17:30:00',
    actor: 'Marcus Rivera',
    action: 'Created object type',
    target: 'Incident',
  },
  {
    id: 'al4',
    timestamp: '2026-03-22 14:12:55',
    actor: 'Aisha Patel',
    action: 'Deployed agent',
    target: 'Onboarding Bot',
  },
  {
    id: 'al5',
    timestamp: '2026-03-22 10:00:00',
    actor: 'System',
    action: 'Health check passed',
    target: 'All Services',
  },
] as const;

// ─── Sample Data: Health Checks Tab ──────────────────────────────────────────

export interface HealthCheck {
  readonly id: string;
  readonly service: string;
  readonly status: HealthStatus;
  readonly lastChecked: string;
  readonly icon: string;
}

export interface TenantLicenseAllocation {
  readonly licenseType: 'Tenant' | 'Admin' | 'User' | 'Viewer';
  readonly allocated: number;
  readonly assigned: number;
  readonly available: number;
}

export interface TenantLicenseSummary {
  readonly status: 'Active' | 'Expiring Soon' | 'Expired';
  readonly validFrom: string;
  readonly validUntil: string;
  readonly allocations: readonly TenantLicenseAllocation[];
}

export const SAMPLE_HEALTH_CHECKS: readonly HealthCheck[] = [
  {
    id: 'h1',
    service: 'PostgreSQL',
    status: 'HEALTHY',
    lastChecked: '2 min ago',
    icon: 'pi pi-database',
  },
  {
    id: 'h2',
    service: 'Keycloak',
    status: 'HEALTHY',
    lastChecked: '2 min ago',
    icon: 'pi pi-shield',
  },
  {
    id: 'h3',
    service: 'Neo4j',
    status: 'HEALTHY',
    lastChecked: '2 min ago',
    icon: 'pi pi-share-alt',
  },
  {
    id: 'h4',
    service: 'Services',
    status: 'DEGRADED',
    lastChecked: '5 min ago',
    icon: 'pi pi-server',
  },
] as const;

export const SAMPLE_LICENSE: TenantLicenseSummary = {
  status: 'Active',
  validFrom: '2026-01-01',
  validUntil: '2026-12-31',
  allocations: [
    { licenseType: 'Tenant', allocated: 1, assigned: 1, available: 0 },
    { licenseType: 'Admin', allocated: 8, assigned: 5, available: 3 },
    { licenseType: 'User', allocated: 120, assigned: 74, available: 46 },
    { licenseType: 'Viewer', allocated: 200, assigned: 86, available: 114 },
  ],
} as const;

// ─── Sample Tenant (Acme Corp) ───────────────────────────────────────────────

export const SAMPLE_TENANT: TenantFactsheet = {
  id: 'tenant-acme-001',
  name: 'Acme Corp',
  shortName: 'acme-corp',
  type: 'MASTER',
  status: 'ACTIVE',
  health: 'HEALTHY',
  logoUrl: null,
  kpis: [
    { label: 'Users', value: '24', icon: 'pi pi-users' },
    { label: 'Agents', value: '3', icon: 'pi pi-android' },
    { label: 'Object Types', value: '12', icon: 'pi pi-book' },
    { label: 'License', value: '67%', icon: 'pi pi-chart-pie' },
  ],
};
