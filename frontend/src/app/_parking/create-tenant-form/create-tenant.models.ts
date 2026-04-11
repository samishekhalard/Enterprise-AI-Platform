/**
 * Create Tenant Form — Local models for the parking prototype.
 *
 * These interfaces will be merged into core/api/models.ts once approved.
 */

// ─── Provisioning ──────────────────────────────────────────────────────────────

export type ProvisioningStepStatus = 'pending' | 'in-progress' | 'completed' | 'failed';

export interface ProvisioningStep {
  readonly id: string;
  readonly label: string;
  readonly description: string;
  readonly status: ProvisioningStepStatus;
  readonly order: number;
}

/**
 * The 7-step provisioning sequence triggered by POST /api/tenants.
 * Steps are rendered as a vertical stepper/progress indicator.
 */
export const PROVISIONING_STEPS: readonly ProvisioningStep[] = [
  {
    id: 'tenant-registry-pg',
    label: 'Tenant Registry Database',
    description: 'Register tenant in the tenant registry PostgreSQL database',
    status: 'pending',
    order: 1,
  },
  {
    id: 'tenant-pg',
    label: 'Tenant PostgreSQL Database',
    description: 'Create the tenant-specific PostgreSQL database',
    status: 'pending',
    order: 2,
  },
  {
    id: 'keycloak',
    label: 'Keycloak Realm',
    description: 'Create Keycloak realm and tenant admin user',
    status: 'pending',
    order: 3,
  },
  {
    id: 'definition-graph',
    label: 'Definition Graph',
    description: 'Provision the tenant definition graph',
    status: 'pending',
    order: 4,
  },
  {
    id: 'instance-graph',
    label: 'Instance Graph',
    description: 'Provision the tenant instance graph',
    status: 'pending',
    order: 5,
  },
  {
    id: 'defaults',
    label: 'Default Configuration',
    description: 'Seed default roles, permissions, messages, and branding',
    status: 'pending',
    order: 6,
  },
  {
    id: 'activate',
    label: 'Activate Tenant',
    description: 'Set tenant status to active and send welcome notification',
    status: 'pending',
    order: 7,
  },
] as const;

// ─── License Availability ──────────────────────────────────────────────────────

export interface LicenseAvailability {
  readonly type: 'ADMIN' | 'USER' | 'VIEWER';
  readonly label: string;
  readonly totalPlatform: number;    // Total licenses in the platform
  readonly allocatedOther: number;   // Already allocated to other tenants
  readonly available: number;        // totalPlatform - allocatedOther
}

export interface LicenseAllocation {
  readonly adminSeats: number;
  readonly userSeats: number;
  readonly viewerSeats: number;
}

export interface TenantLicenseStatus {
  readonly totalTenantLicenses: number;
  readonly usedTenantLicenses: number;
  readonly available: boolean;  // true if at least 1 tenant license is free
}

// ─── Form Request ──────────────────────────────────────────────────────────────

/**
 * Payload for the simplified Create Tenant form (single dialog, no wizard).
 * Maps to POST /api/tenants with the fields collected in this form.
 */
/**
 * The `id` is an auto-generated UUID (not user-supplied).
 * The `shortName` is the user-entered technical tenant identifier.
 */
export interface CreateTenantFormRequest {
  readonly id: string;          // Auto-generated UUID
  readonly tenantName: string;  // Display name
  readonly shortName: string;   // Technical name — user input
  readonly tenantUrl: string;
  readonly adminEmail: string;
  readonly licenseAllocation: LicenseAllocation;
}

// ─── Provisioning Response ─────────────────────────────────────────────────────

export interface ProvisioningResponse {
  readonly tenantId: string;
  readonly status: 'provisioning' | 'completed' | 'failed';
  readonly currentStep: string;
  readonly steps: readonly ProvisioningStep[];
  readonly failedStep?: string;
  readonly error?: string;
}

// ─── Validation ────────────────────────────────────────────────────────────────

/**
 * TEN-* error codes referenced as comments on user-facing messages.
 * These codes map to the tenant management error catalog.
 */
export const TENANT_ERROR_CODES = {
  TEN_E_002: 'TEN-E-002', // Invalid tenant name
  TEN_E_004: 'TEN-E-004', // Provisioning failed
  TEN_E_009: 'TEN-E-009', // Invalid tenant URL format
  TEN_E_010: 'TEN-E-010', // Tenant URL already claimed
  TEN_E_016: 'TEN-E-016', // Invalid admin email
} as const;

export const TENANT_SUCCESS_CODES = {
  TEN_S_001: 'TEN-S-001', // Tenant created successfully
} as const;
