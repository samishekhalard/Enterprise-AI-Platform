import {
  HoverButton,
  HoverCard,
  HoverInput,
  HoverNav,
  HoverTableRow,
  LicenseState,
  Tenant,
} from '../../../core/api/models';

export type AdminSection =
  | 'tenant-manager'
  | 'license-manager'
  | 'master-locale'
  | 'master-definitions';

export type TenantManagerTab = 'overview' | 'users' | 'branding' | 'licenses' | 'authentication';

export type AuthAdminTab = 'providers' | 'sso' | 'mfa' | 'sessions' | 'policies';

export type LocaleAdminTab = 'languages' | 'regions' | 'formats' | 'translations';

export interface AdminNavItem {
  readonly section: AdminSection;
  readonly label: string;
  readonly description: string;
}

export const ADMIN_NAV_ITEMS: readonly AdminNavItem[] = [
  {
    section: 'tenant-manager',
    label: 'Tenant Manager',
    description: 'Tenant lifecycle, assignment, and embedded administration.',
  },
  {
    section: 'license-manager',
    label: 'License Manager',
    description: 'License state, entitlement visibility, and file import.',
  },
  {
    section: 'master-locale',
    label: 'Master Locale',
    description: 'System-wide language, region, and format defaults.',
  },
  {
    section: 'master-definitions',
    label: 'Master Definitions',
    description: 'Reusable type definitions and metadata contracts.',
  },
] as const;

export const ADMIN_SECTION_LABELS: Record<AdminSection, string> = {
  'tenant-manager': 'Tenant Management',
  'license-manager': 'License Management',
  'master-locale': 'Master Locale',
  'master-definitions': 'Master Definitions',
};

export interface TenantSummary {
  readonly id: string;
  readonly uuid?: string;
  readonly name: string;
  readonly fullName?: string;
  readonly shortName?: string;
  readonly status: string;
  readonly type: string;
  readonly tier?: string;
  readonly description?: string;
  readonly primaryDomain?: string;
  readonly isProtected?: boolean;
  readonly usersCount?: number;
  readonly domainsCount?: number;
}

export interface AdminProvider {
  readonly id: string;
  readonly name: string;
  readonly type: 'local' | 'oidc' | 'saml' | 'uaepass';
  readonly status: 'active' | 'inactive';
  readonly description: string;
  readonly lastSync?: string;
}

export interface AdminUser {
  readonly id: string;
  readonly name: string;
  readonly email: string;
  readonly role: string;
  readonly status: 'active' | 'invited' | 'disabled';
  readonly lastActive: string;
}

export interface DefinitionType {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly propertyCount: number;
  readonly updatedAt: string;
}

export type ObjectTypeStatus = 'active' | 'planned' | 'hold' | 'retired';
export type ObjectTypeState = 'default' | 'customized' | 'user_defined';
export type AttributeDataType =
  | 'string'
  | 'text'
  | 'integer'
  | 'float'
  | 'boolean'
  | 'date'
  | 'datetime'
  | 'enum'
  | 'json';
export type ConnectionCardinality = 'one-to-one' | 'one-to-many' | 'many-to-many';

export interface ObjectType {
  readonly id: string;
  readonly tenantId: string;
  readonly name: string;
  readonly typeKey: string;
  readonly code: string;
  readonly description?: string;
  readonly iconName: string;
  readonly iconColor: string;
  readonly status: ObjectTypeStatus;
  readonly state: ObjectTypeState;
  readonly createdAt?: string;
  readonly updatedAt?: string;
  readonly attributes?: ObjectTypeAttribute[];
  readonly connections?: ObjectTypeConnection[];
  readonly instanceCount?: number;
}

export interface ObjectTypeAttribute {
  readonly attributeTypeId: string;
  readonly name: string;
  readonly attributeKey: string;
  readonly dataType: AttributeDataType;
  readonly attributeGroup?: string;
  readonly description?: string;
  readonly isRequired: boolean;
  readonly displayOrder: number;
}

export interface AttributeType {
  readonly id: string;
  readonly tenantId: string;
  readonly name: string;
  readonly attributeKey: string;
  readonly dataType: AttributeDataType;
  readonly attributeGroup?: string;
  readonly description?: string;
  readonly defaultValue?: string;
  readonly createdAt?: string;
}

export interface ObjectTypeConnection {
  readonly targetTypeId: string;
  readonly targetTypeName: string;
  readonly relationshipKey: string;
  readonly activeName: string;
  readonly passiveName: string;
  readonly cardinality: ConnectionCardinality;
  readonly isDirected: boolean;
}

export const OBJECT_TYPE_STATUS_SEVERITY: Record<ObjectTypeStatus, string> = {
  active: 'success',
  planned: 'info',
  hold: 'warn',
  retired: 'secondary',
};

export const OBJECT_TYPE_STATE_SEVERITY: Record<ObjectTypeState, string> = {
  default: 'info',
  customized: 'warn',
  user_defined: 'success',
};

export const LICENSE_STATE_LABELS: Record<LicenseState, string> = {
  UNLICENSED: 'Unlicensed',
  ACTIVE: 'Active',
  GRACE: 'Grace Period',
  EXPIRED: 'Expired',
  TAMPERED: 'Tampered',
};

export function toTenantSummary(tenant: Tenant): TenantSummary {
  const record = tenant as Record<string, unknown>;
  const fullName = tenant.fullName ?? asOptionalString(record['fullName']);
  const shortName = tenant.shortName ?? asOptionalString(record['shortName']);
  const uuid = tenant.uuid ?? asOptionalString(record['uuid']);
  return {
    id: tenant.id,
    uuid,
    name: shortName ?? fullName ?? tenant.id,
    fullName,
    shortName,
    status: tenant.status ?? 'unknown',
    type: asOptionalString(record['tenantType']) ?? 'regular',
    tier: asOptionalString(record['tier']),
    description: asOptionalString(record['description']),
    primaryDomain: asOptionalString(record['primaryDomain']),
    isProtected: asOptionalBoolean(record['isProtected']),
    usersCount: asOptionalNumber(record['usersCount']),
    domainsCount: asOptionalNumber(record['domainsCount']),
  };
}

function asOptionalNumber(value: unknown): number | undefined {
  return typeof value === 'number' ? value : undefined;
}

function asOptionalString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim().length > 0 ? value : undefined;
}

function asOptionalBoolean(value: unknown): boolean | undefined {
  return typeof value === 'boolean' ? value : undefined;
}

export interface TenantBrandingForm {
  primaryColor: string;
  secondaryColor: string;
  surfaceColor: string;
  textColor: string;
  shadowDarkColor: string;
  shadowLightColor: string;
  logoUrl: string;
  faviconUrl: string;
  loginBackgroundUrl: string;
  fontFamily: string;
  customCss: string;
  cornerRadius: number;
  buttonDepth: number;
  shadowIntensity: number;
  softShadows: boolean;
  compactNav: boolean;
  hoverButton: HoverButton;
  hoverCard: HoverCard;
  hoverInput: HoverInput;
  hoverNav: HoverNav;
  hoverTableRow: HoverTableRow;
}

export function createDefaultBrandingForm(): TenantBrandingForm {
  return {
    primaryColor: '#428177',
    secondaryColor: '#b9a779',
    surfaceColor: '#edebe0',
    textColor: '#3d3a3b',
    shadowDarkColor: '#988561',
    shadowLightColor: '#ffffff',
    logoUrl: '',
    faviconUrl: '',
    loginBackgroundUrl: '',
    fontFamily: "'Gotham Rounded', 'Nunito', sans-serif",
    customCss: '',
    cornerRadius: 16,
    buttonDepth: 12,
    shadowIntensity: 50,
    softShadows: true,
    compactNav: false,
    hoverButton: 'lift',
    hoverCard: 'lift',
    hoverInput: 'press',
    hoverNav: 'slide',
    hoverTableRow: 'highlight',
  };
}
