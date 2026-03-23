import { ApexChart, ApexStroke, ApexMarkers, ApexTooltip, ApexGrid } from 'ng-apexcharts';

export type SparklineOptions = {
  series: { data: number[] }[];
  chart: ApexChart;
  stroke: ApexStroke;
  markers: ApexMarkers;
  tooltip: ApexTooltip;
  grid: ApexGrid;
  colors: string[];
};

export type AdminSection = 'tenant-manager' | 'license-manager' | 'master-locale' | 'master-definitions' | 'master-auth';
export type TenantView = 'list' | 'factsheet' | 'create' | 'edit';
export type TenantTab = 'overview' | 'locale' | 'authentication' | 'users' | 'branding' | 'licenses';
export type AuthTab = 'providers' | 'sso' | 'mfa' | 'sessions' | 'policies';
export type LocaleTab = 'languages' | 'regions' | 'formats' | 'translations';
export type ObjectTypeView = 'list' | 'detail' | 'create' | 'edit';
export type BrandView = 'list' | 'editor';
export type BrandSection = 'typography' | 'colours' | 'imagery' | 'iconography' | 'content' | 'layout' | 'actions' | 'mobile' | 'accessibility';

export interface BrandTypography {
  primaryFont: string;
  secondaryFont: string;
  headingWeight: number;
  bodyWeight: number;
  baseSize: number;
  scaleRatio: number;
  lineHeight: number;
}

export interface BrandColour {
  name: string;
  variable: string;
  value: string;
}

export interface BrandColours {
  primary: BrandColour[];
  secondary: BrandColour[];
  neutral: BrandColour[];
  semantic: BrandColour[];
}

export interface BrandSpacing {
  baseUnit: number;
  scale: number[];
}

export interface BrandBorderRadius {
  small: string;
  medium: string;
  large: string;
  xlarge: string;
}

export interface BrandHeader {
  showLogo: boolean;
  showTitle: boolean;
  title: string;
  subtitle: string;
  backgroundColor: string;
  textColor: string;
  height: string;
  sticky: boolean;
}

export interface BrandFooter {
  show: boolean;
  content: string;
  copyrightText: string;
  backgroundColor: string;
  textColor: string;
  links: { label: string; url: string }[];
}

export interface Brand {
  id: string;
  name: string;
  description: string;
  isDefault: boolean;
  isActive: boolean;
  typography: BrandTypography;
  colours: BrandColours;
  spacing: BrandSpacing;
  borderRadius: BrandBorderRadius;
  logoUrl: string;
  faviconUrl: string;
  header: BrandHeader;
  footer: BrandFooter;
  createdAt: Date;
  updatedAt: Date;
}

export interface ConfigCard {
  id: AdminSection;
  title: string;
  description: string;
  icon: string;
}

export type TenantType = 'master' | 'dominant' | 'regular';

export interface TenantForm {
  fullName: string;
  shortName: string;
  description: string;
  logo: string;
  tenantType: TenantType;
}

export interface ObjectTypeProperty {
  id: string;
  name: string;
  type: 'string' | 'number' | 'boolean' | 'date' | 'reference' | 'enum' | 'text' | 'url' | 'email';
  required: boolean;
  description: string;
  defaultValue?: string;
  enumValues?: string[];
  referenceType?: string;
}

export interface ObjectType {
  id: string;
  name: string;
  code: string;
  description: string;
  icon: string;
  color: string;
  properties: ObjectTypeProperty[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Tenant {
  id: string;
  uuid: string;
  fullName: string;
  shortName: string;
  description: string;
  logo: string;
  tenantType: TenantType;
  status: 'active' | 'locked' | 'impersonating';
  isProtected: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface TenantLicense {
  id: string;
  tenantId: string;
  name: string;
  seats: number;
  usedSeats: number;
  expiresAt: Date;
  status: 'active' | 'expired' | 'suspended';
}

// ============================================================================
// License Management Types (maps to backend license-service DTOs)
// ============================================================================

export type LicenseState = 'UNLICENSED' | 'ACTIVE' | 'GRACE' | 'EXPIRED' | 'TAMPERED';

export interface LicenseStatusResponse {
  state: LicenseState;
  licenseId?: string;
  licenseFileId?: string;
  product?: string;
  expiresAt?: string;
  gracePeriodDays?: number;
  graceExpiresAt?: string;
  features?: string[];
  degradedFeatures?: string[];
  maxTenants?: number;
  activeTenantCount?: number;
  issuer?: string;
  customerName?: string;
  importedAt?: string;
}

export interface LicenseImportResponse {
  licenseFileId: string;
  licenseId: string;
  product: string;
  versionRange: string;
  maxTenants: number;
  expiresAt: string;
  features: string[];
  gracePeriodDays: number;
  tenantCount: number;
  importedAt: string;
}

export type UserTier = 'TENANT_ADMIN' | 'POWER_USER' | 'CONTRIBUTOR' | 'VIEWER';

export interface SeatAssignmentRequest {
  userId: string;
  tenantId: string;
  tier: UserTier;
}

export interface SeatAssignmentResponse {
  assignmentId: string;
  userId: string;
  tenantId: string;
  tier: UserTier;
  assignedAt: string;
  assignedBy: string;
}

export interface SeatAvailabilityInfo {
  maxSeats: number;
  assigned: number;
  available: number;
  unlimited: boolean;
}

export const LICENSE_STATE_LABELS: Record<LicenseState, string> = {
  UNLICENSED: 'Unlicensed',
  ACTIVE: 'Active',
  GRACE: 'Grace Period',
  EXPIRED: 'Expired',
  TAMPERED: 'Tampered'
};

export const USER_TIER_LABELS: Record<UserTier, string> = {
  TENANT_ADMIN: 'Tenant Admin',
  POWER_USER: 'Power User',
  CONTRIBUTOR: 'Contributor',
  VIEWER: 'Viewer'
};

// ============================================================================
// Utility Functions
// ============================================================================

export function generateUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}
