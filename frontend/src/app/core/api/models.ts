export interface GatewayHealth {
  readonly status: string;
  readonly [key: string]: unknown;
}

export interface GatewayVersion {
  readonly version?: string;
  readonly [key: string]: unknown;
}

export interface Tenant {
  readonly id: string;
  readonly uuid?: string;
  readonly shortName?: string;
  readonly fullName?: string;
  readonly description?: string;
  readonly logo?: string;
  readonly logoUrl?: string;
  readonly tenantType?: string;
  readonly tier?: string;
  readonly isProtected?: boolean;
  readonly primaryDomain?: string;
  readonly status?: string;
  readonly [key: string]: unknown;
}

export type TenantType = 'MASTER' | 'DOMINANT' | 'REGULAR';
export type TenantTier = 'FREE' | 'STANDARD' | 'PROFESSIONAL' | 'ENTERPRISE';

export interface CreateTenantRequest {
  readonly fullName: string;
  readonly shortName: string;
  readonly description?: string;
  readonly tenantType: TenantType;
  readonly tier: TenantTier;
  readonly primaryDomain?: string;
  readonly adminEmail: string;
  readonly licenses?: {
    readonly powerUsers: number;
    readonly contributors: number;
    readonly viewers: number;
  };
}

export interface UpdateTenantRequest {
  readonly fullName?: string;
  readonly shortName?: string;
  readonly description?: string;
  readonly logo?: string;
  readonly tier?: TenantTier;
}

export interface TenantListResponse {
  readonly tenants: Tenant[];
  readonly total: number;
  readonly page: number;
  readonly limit: number;
}

export type TenantStatus = 'active' | 'pending' | 'suspended' | 'locked' | 'decommissioned';

export type SuspensionReason =
  | 'License Expired'
  | 'Non-Compliance'
  | 'Security Concern'
  | 'Payment Overdue'
  | 'Administrative Hold'
  | 'Other';

export interface SuspendTenantRequest {
  readonly reason: SuspensionReason;
  readonly notes?: string;
  readonly estimatedReactivationDate?: string;
}

export interface ActivateTenantRequest {
  readonly sendWelcomeNotification: boolean;
}

export interface DecommissionTenantRequest {
  readonly reason: string;
  readonly notes?: string;
  readonly confirmDataDeletion: boolean;
}

export interface TenantStatsResponse {
  readonly totalTenants: number;
  readonly activeTenants: number;
  readonly pendingTenants: number;
  readonly suspendedTenants: number;
  readonly decommissionedTenants: number;
  readonly totalUsers: number;
  readonly avgUtilizationPercent: number;
}

export interface LoginRequest {
  readonly identifier: string;
  readonly password: string;
  readonly tenantId?: string;
  readonly rememberMe?: boolean;
}

export interface LoginResponse {
  readonly success?: boolean;
  readonly accessToken?: string;
  readonly refreshToken?: string;
  readonly tokenType?: string;
  readonly expiresIn?: number;
  readonly message?: string;
  readonly [key: string]: unknown;
}

export interface AuthUiMessage {
  readonly code: string;
  readonly text: string;
  readonly locale: string;
}

export interface PasswordResetRequest {
  readonly email: string;
  readonly tenantId: string;
}

export interface PasswordResetConfirmRequest {
  readonly token: string;
  readonly newPassword: string;
  readonly confirmPassword: string;
}

export interface RefreshTokenRequest {
  readonly refreshToken: string;
}

export interface LogoutRequest {
  readonly refreshToken: string;
}

export interface TenantResolveResponse {
  readonly tenant?: {
    readonly id?: string;
    readonly uuid?: string;
    readonly shortName?: string;
    readonly fullName?: string;
    readonly [key: string]: unknown;
  };
  readonly authProviders?: readonly unknown[];
  readonly branding?: TenantBranding;
  readonly activeBrand?: ActiveBrandResolvePayload;
  readonly resolved?: boolean;
  readonly hostname?: string;
  readonly error?: string;
  readonly message?: string;
}

export interface TenantIdentityProvider {
  readonly id: string;
  readonly providerName: string;
  readonly providerType: string;
  readonly displayName: string;
  readonly protocol: string;
  readonly enabled: boolean;
  readonly status: 'active' | 'inactive';
  readonly clientId?: string;
  readonly discoveryUrl?: string;
  readonly metadataUrl?: string;
  readonly serverUrl?: string;
  readonly port?: number;
  readonly bindDn?: string;
  readonly userSearchBase?: string;
  readonly userSearchFilter?: string;
  readonly idpHint?: string;
  readonly authorizationUrl?: string;
  readonly tokenUrl?: string;
  readonly userInfoUrl?: string;
  readonly jwksUrl?: string;
  readonly issuerUrl?: string;
  readonly scopes?: readonly string[];
  readonly priority?: number;
  readonly lastTestedAt?: string;
  readonly testResult?: 'success' | 'failure' | 'pending';
}

export interface TenantIdentityProviderRequest {
  readonly providerName: string;
  readonly displayName?: string;
  readonly protocol: 'OIDC' | 'SAML' | 'LDAP' | 'OAUTH2';
  readonly clientId?: string;
  readonly clientSecret?: string;
  readonly discoveryUrl?: string;
  readonly metadataUrl?: string;
  readonly serverUrl?: string;
  readonly port?: number;
  readonly bindDn?: string;
  readonly bindPassword?: string;
  readonly userSearchBase?: string;
  readonly userSearchFilter?: string;
  readonly idpHint?: string;
  readonly scopes?: readonly string[];
  readonly authorizationUrl?: string;
  readonly tokenUrl?: string;
  readonly userInfoUrl?: string;
  readonly jwksUrl?: string;
  readonly issuerUrl?: string;
  readonly enabled: boolean;
  readonly priority?: number;
  readonly trustEmail?: boolean;
  readonly storeToken?: boolean;
  readonly linkExistingAccounts?: boolean;
}

export interface TenantIdentityProviderPatchRequest {
  readonly enabled?: boolean;
  readonly priority?: number;
  readonly displayName?: string;
}

export interface ProviderConnectionDetails {
  readonly discoveryUrl?: string;
  readonly issuer?: string;
  readonly supportedScopes?: readonly string[];
  readonly endpoints?: Readonly<Record<string, string>>;
}

export interface ProviderTestConnectionResponse {
  readonly success: boolean;
  readonly message: string;
  readonly details?: ProviderConnectionDetails;
  readonly error?: string;
}

export interface PagedResponse<T> {
  readonly content: readonly T[];
  readonly page: number;
  readonly size: number;
  readonly totalElements: number;
  readonly totalPages: number;
}

export interface TenantUser {
  readonly id: string;
  readonly email: string;
  readonly firstName: string;
  readonly lastName: string;
  readonly displayName: string;
  readonly active: boolean;
  readonly emailVerified: boolean;
  readonly roles: readonly string[];
  readonly groups: readonly string[];
  readonly identityProvider: string;
  readonly lastLoginAt?: string;
  readonly createdAt?: string;
}

export interface TenantUserListQuery {
  readonly page?: number;
  readonly size?: number;
  readonly search?: string;
  readonly role?: string;
  readonly status?: string;
}

export type UserTier = 'TENANT_ADMIN' | 'POWER_USER' | 'CONTRIBUTOR' | 'VIEWER';

export interface SeatAssignment {
  readonly assignmentId: string;
  readonly userId: string;
  readonly tenantId: string;
  readonly tier: UserTier;
  readonly assignedAt?: string;
  readonly assignedBy?: string;
}

export interface SeatAssignmentRequest {
  readonly userId: string;
  readonly tenantId: string;
  readonly tier: UserTier;
}

export interface SeatAvailabilityInfo {
  readonly maxSeats: number;
  readonly assigned: number;
  readonly available: number;
  readonly unlimited: boolean;
}

export type LicenseState = 'UNLICENSED' | 'ACTIVE' | 'GRACE' | 'EXPIRED' | 'TAMPERED';

export interface LicenseStatusResponse {
  readonly state: LicenseState;
  readonly licenseId?: string;
  readonly product?: string;
  readonly versionRange?: string;
  readonly expiresAt?: string;
  readonly gracePeriodDays?: number;
  readonly graceExpiresAt?: string;
  readonly features?: string[];
  readonly degradedFeatures?: string[];
  readonly maxTenants?: number;
  readonly activeTenantCount?: number;
  readonly issuer?: string;
  readonly customerName?: string;
  readonly importedAt?: string;
}

export type ComponentTokenMap = Record<string, Record<string, unknown>>;

export type HoverButton = 'lift' | 'press' | 'glow' | 'none';
export type HoverCard = 'lift' | 'glow' | 'none';
export type HoverInput = 'press' | 'highlight' | 'none';
export type HoverNav = 'slide' | 'lift' | 'highlight' | 'none';
export type HoverTableRow = 'highlight' | 'lift' | 'none';

export interface TenantBranding {
  readonly primaryColor: string;
  readonly primaryColorDark: string;
  readonly secondaryColor: string;
  readonly surfaceColor: string;
  readonly textColor: string;
  readonly shadowDarkColor: string;
  readonly shadowLightColor: string;
  readonly logoUrl: string;
  readonly logoUrlDark: string;
  readonly faviconUrl: string;
  readonly loginBackgroundUrl: string;
  readonly customCss: string;
  readonly cornerRadius: number;
  readonly buttonDepth: number;
  readonly shadowIntensity: number;
  readonly softShadows: boolean;
  readonly compactNav: boolean;
  readonly hoverButton: HoverButton;
  readonly hoverCard: HoverCard;
  readonly hoverInput: HoverInput;
  readonly hoverNav: HoverNav;
  readonly hoverTableRow: HoverTableRow;
  readonly componentTokens?: ComponentTokenMap;
  readonly updatedAt: string;
}

export interface UpdateTenantBrandingRequest {
  readonly primaryColor?: string;
  readonly primaryColorDark?: string;
  readonly secondaryColor?: string;
  readonly surfaceColor?: string;
  readonly textColor?: string;
  readonly shadowDarkColor?: string;
  readonly shadowLightColor?: string;
  readonly logoUrl?: string;
  readonly logoUrlDark?: string;
  readonly faviconUrl?: string;
  readonly loginBackgroundUrl?: string;
  readonly customCss?: string;
  readonly cornerRadius?: number;
  readonly buttonDepth?: number;
  readonly shadowIntensity?: number;
  readonly softShadows?: boolean;
  readonly compactNav?: boolean;
  readonly hoverButton?: HoverButton;
  readonly hoverCard?: HoverCard;
  readonly hoverInput?: HoverInput;
  readonly hoverNav?: HoverNav;
  readonly hoverTableRow?: HoverTableRow;
  readonly componentTokens?: ComponentTokenMap;
}

export interface TenantBrandingValidationResponse {
  readonly valid: boolean;
  readonly violations: readonly string[];
  readonly warnings: readonly string[];
  readonly normalized: Readonly<Record<string, unknown>>;
}

export interface ActiveBrandResolvePayload {
  readonly brandProfileId: string | null;
  readonly manifestVersion: number;
  readonly profileVersion: number;
  readonly manifest: Readonly<Record<string, unknown>>;
  readonly publishedAt: string;
  readonly publishedBy: string;
}

export interface BrandStarterKitSummary {
  readonly starterKitId: string;
  readonly name: string;
  readonly description: string;
  readonly previewThumbnailAssetId: string;
  readonly basePalettePackId: string;
  readonly baseTypographyPackId: string;
  readonly isDefault: boolean;
  readonly status: string;
}

export interface PalettePackSummary {
  readonly palettePackId: string;
  readonly name: string;
  readonly description: string;
  readonly primary: string;
  readonly secondary: string;
  readonly accent: string;
  readonly surface: string;
  readonly surfaceRaised: string;
  readonly text: string;
  readonly textMuted: string;
  readonly border: string;
  readonly success: string;
  readonly warning: string;
  readonly error: string;
  readonly info: string;
  readonly isDefault: boolean;
  readonly status: string;
}

export interface TypographyPackSummary {
  readonly typographyPackId: string;
  readonly name: string;
  readonly description: string;
  readonly headingFontFamily: string;
  readonly bodyFontFamily: string;
  readonly monoFontFamily: string;
  readonly fontSourceType: string;
  readonly isDefault: boolean;
  readonly status: string;
}

export interface BrandAssetSummary {
  readonly assetId: string;
  readonly tenantId: string;
  readonly kind: string;
  readonly displayName: string;
  readonly deliveryUrl: string;
  readonly mimeType: string;
  readonly fileSize: number;
  readonly width: number | null;
  readonly height: number | null;
  readonly createdAt: string;
  readonly createdBy: string;
}

export interface IconLibrarySummary {
  readonly iconLibraryId: string;
  readonly tenantId: string;
  readonly name: string;
  readonly description: string;
  readonly sourceType: string;
  readonly version: number;
  readonly manifest: Readonly<Record<string, unknown>>;
  readonly createdAt: string;
  readonly createdBy: string;
}

export interface BrandDraft {
  readonly tenantId: string;
  readonly selectedStarterKitId: string | null;
  readonly selectedPalettePackId: string | null;
  readonly selectedTypographyPackId: string | null;
  readonly selectedIconLibraryId: string | null;
  readonly manifestOverrides: Readonly<Record<string, unknown>>;
  readonly updatedAt: string;
  readonly updatedBy: string;
  readonly lastValidatedAt: string;
  readonly previewManifest: Readonly<Record<string, unknown>>;
}

export interface UpdateBrandDraftRequest {
  readonly selectedStarterKitId?: string | null;
  readonly selectedPalettePackId?: string | null;
  readonly selectedTypographyPackId?: string | null;
  readonly selectedIconLibraryId?: string | null;
  readonly manifestOverrides?: Readonly<Record<string, unknown>>;
}

export interface BrandHistoryItem {
  readonly brandProfileId: string;
  readonly profileVersion: number;
  readonly publishedAt: string;
  readonly publishedBy: string;
  readonly rolledBackFromProfileId: string;
  readonly appTitle: string;
  readonly themeColor: string;
  readonly starterKitId: string;
  readonly palettePackId: string;
  readonly typographyPackId: string;
}

export interface RollbackBrandRequest {
  readonly targetBrandProfileId: string;
}

export interface LicenseImportResponse {
  readonly licenseFileId: string;
  readonly licenseId: string;
  readonly product: string;
  readonly versionRange: string;
  readonly maxTenants: number;
  readonly expiresAt: string;
  readonly features: string[];
  readonly gracePeriodDays: number;
  readonly tenantCount: number;
  readonly importedAt: string;
}

// ─── Definition Service ────────────────────────────────────────────────────
export interface ObjectTypeResponse {
  readonly id: string;
  readonly tenantId: string;
  readonly name: string;
  readonly typeKey: string;
  readonly code: string;
  readonly description?: string;
  readonly iconName: string;
  readonly iconColor: string;
  readonly status: string;
  readonly state: string;
  readonly createdAt?: string;
  readonly updatedAt?: string;
  readonly attributes?: ObjectTypeAttributeResponse[];
  readonly connections?: ObjectTypeConnectionResponse[];
  readonly parentTypeId?: string;
  readonly instanceCount?: number;
}

export interface ObjectTypeAttributeResponse {
  readonly relId: number;
  readonly attributeTypeId: string;
  readonly name: string;
  readonly attributeKey: string;
  readonly dataType: string;
  readonly isRequired: boolean;
  readonly displayOrder: number;
}

export interface ObjectTypeConnectionResponse {
  readonly relId: number;
  readonly targetObjectTypeId: string;
  readonly targetObjectTypeName: string;
  readonly relationshipKey: string;
  readonly activeName: string;
  readonly passiveName: string;
  readonly cardinality: string;
  readonly isDirected: boolean;
}

export interface ObjectTypeCreateRequest {
  readonly name: string;
  readonly typeKey?: string;
  readonly code?: string;
  readonly description?: string;
  readonly iconName?: string;
  readonly iconColor?: string;
  readonly status?: string;
  readonly state?: string;
}

export interface ObjectTypeUpdateRequest {
  readonly name?: string;
  readonly description?: string;
  readonly iconName?: string;
  readonly iconColor?: string;
  readonly status?: string;
}

export interface AttributeTypeResponse {
  readonly id: string;
  readonly tenantId: string;
  readonly name: string;
  readonly attributeKey: string;
  readonly dataType: string;
  readonly attributeGroup?: string;
  readonly description?: string;
}

export interface AttributeTypeCreateRequest {
  readonly name: string;
  readonly attributeKey?: string;
  readonly dataType: string;
  readonly attributeGroup?: string;
  readonly description?: string;
  readonly defaultValue?: string;
}

export interface DefinitionsPagedResponse<T> {
  readonly content: T[];
  readonly page: number;
  readonly size: number;
  readonly totalElements: number;
  readonly totalPages: number;
}

export interface UserSession {
  readonly id: string;
  readonly deviceName: string | null;
  readonly ipAddress: string | null;
  readonly location: Record<string, unknown> | null;
  readonly createdAt: string;
  readonly lastActivity: string | null;
  readonly expiresAt: string;
  readonly isRemembered: boolean;
  readonly mfaVerified: boolean;
  readonly status: 'ACTIVE' | 'EXPIRED' | 'REVOKED' | 'LOGGED_OUT';
  readonly isCurrent: boolean;
}
