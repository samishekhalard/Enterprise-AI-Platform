// ─── Tenant List Models ──────────────────────────────────────────────────────

export type TenantType = 'MASTER' | 'REGULAR' | 'DOMINANT';

export type TenantStatus = 'ACTIVE' | 'SUSPENDED' | 'PROVISIONING' | 'PROVISIONING_FAILED';

export type HealthStatus = 'HEALTHY' | 'DEGRADED' | 'UNHEALTHY';

export interface TenantStats {
  readonly users: number;
  readonly agents: number;
  readonly types: number;
}

export interface TenantSummary {
  readonly id: string;
  readonly name: string;
  readonly shortName: string;
  readonly type: TenantType;
  readonly status: TenantStatus;
  readonly health: HealthStatus | null;
  readonly stats: TenantStats;
  readonly logoUrl: string | null;
}

// ─── Filter chips ────────────────────────────────────────────────────────────

export interface FilterChip<T extends string> {
  readonly label: string;
  readonly value: T;
}

export const TENANT_TYPE_FILTERS: readonly FilterChip<TenantType>[] = [
  { label: 'Master', value: 'MASTER' },
  { label: 'Regular', value: 'REGULAR' },
  { label: 'Dominant', value: 'DOMINANT' },
];

export const TENANT_STATUS_FILTERS: readonly FilterChip<TenantStatus>[] = [
  { label: 'Active', value: 'ACTIVE' },
  { label: 'Suspended', value: 'SUSPENDED' },
  { label: 'Provisioning', value: 'PROVISIONING' },
  { label: 'Failed', value: 'PROVISIONING_FAILED' },
];

// ─── Sample data ─────────────────────────────────────────────────────────────

export const SAMPLE_TENANTS: readonly TenantSummary[] = [
  {
    id: 'ten-001',
    name: 'Acme Corp',
    shortName: 'acme-corp',
    type: 'MASTER',
    status: 'ACTIVE',
    health: 'HEALTHY',
    stats: { users: 24, agents: 3, types: 12 },
    logoUrl: null,
  },
  {
    id: 'ten-002',
    name: 'Northwind Trading',
    shortName: 'northwind-trading',
    type: 'REGULAR',
    status: 'ACTIVE',
    health: 'HEALTHY',
    stats: { users: 156, agents: 8, types: 24 },
    logoUrl: null,
  },
  {
    id: 'ten-003',
    name: 'Meridian Health',
    shortName: 'meridian-health',
    type: 'REGULAR',
    status: 'SUSPENDED',
    health: 'HEALTHY',
    stats: { users: 89, agents: 5, types: 18 },
    logoUrl: null,
  },
  {
    id: 'ten-004',
    name: 'Pinnacle Labs',
    shortName: 'pinnacle-labs',
    type: 'REGULAR',
    status: 'PROVISIONING',
    health: null,
    stats: { users: 0, agents: 0, types: 0 },
    logoUrl: null,
  },
  {
    id: 'ten-005',
    name: 'Vanguard Group',
    shortName: 'vanguard-group',
    type: 'DOMINANT',
    status: 'ACTIVE',
    health: 'DEGRADED',
    stats: { users: 45, agents: 4, types: 15 },
    logoUrl: null,
  },
  {
    id: 'ten-006',
    name: 'Cascade Solutions',
    shortName: 'cascade-solutions',
    type: 'REGULAR',
    status: 'ACTIVE',
    health: 'HEALTHY',
    stats: { users: 67, agents: 6, types: 20 },
    logoUrl: null,
  },
  {
    id: 'ten-007',
    name: 'Blue Horizon',
    shortName: 'blue-horizon',
    type: 'REGULAR',
    status: 'ACTIVE',
    health: 'HEALTHY',
    stats: { users: 34, agents: 2, types: 8 },
    logoUrl: null,
  },
  {
    id: 'ten-008',
    name: 'Summit Financial',
    shortName: 'summit-financial',
    type: 'DOMINANT',
    status: 'ACTIVE',
    health: 'HEALTHY',
    stats: { users: 212, agents: 12, types: 31 },
    logoUrl: null,
  },
  {
    id: 'ten-009',
    name: 'RedBridge Consulting',
    shortName: 'redbridge-consulting',
    type: 'REGULAR',
    status: 'SUSPENDED',
    health: null,
    stats: { users: 0, agents: 0, types: 5 },
    logoUrl: null,
  },
  {
    id: 'ten-010',
    name: 'GreenField Energy',
    shortName: 'greenfield-energy',
    type: 'REGULAR',
    status: 'ACTIVE',
    health: 'DEGRADED',
    stats: { users: 78, agents: 4, types: 16 },
    logoUrl: null,
  },
  {
    id: 'ten-011',
    name: 'Atlas Logistics',
    shortName: 'atlas-logistics',
    type: 'REGULAR',
    status: 'ACTIVE',
    health: 'HEALTHY',
    stats: { users: 41, agents: 3, types: 11 },
    logoUrl: null,
  },
  {
    id: 'ten-012',
    name: 'Nova Healthcare',
    shortName: 'nova-healthcare',
    type: 'REGULAR',
    status: 'SUSPENDED',
    health: 'UNHEALTHY',
    stats: { users: 56, agents: 2, types: 9 },
    logoUrl: null,
  },
  {
    id: 'ten-013',
    name: 'Stellar Dynamics',
    shortName: 'stellar-dynamics',
    type: 'REGULAR',
    status: 'ACTIVE',
    health: 'HEALTHY',
    stats: { users: 19, agents: 1, types: 7 },
    logoUrl: null,
  },
  {
    id: 'ten-014',
    name: 'Ironclad Security',
    shortName: 'ironclad-security',
    type: 'DOMINANT',
    status: 'ACTIVE',
    health: 'HEALTHY',
    stats: { users: 134, agents: 9, types: 22 },
    logoUrl: null,
  },
  {
    id: 'ten-015',
    name: 'Pacific Ventures',
    shortName: 'pacific-ventures',
    type: 'REGULAR',
    status: 'PROVISIONING_FAILED',
    health: null,
    stats: { users: 0, agents: 0, types: 0 },
    logoUrl: null,
  },
];
