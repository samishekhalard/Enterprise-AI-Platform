import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, map, Observable, of, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  ActivateTenantRequest,
  ActiveBrandResolvePayload,
  AttributeTypeResponse,
  BrandAssetSummary,
  BrandDraft,
  BrandHistoryItem,
  BrandStarterKitSummary,
  AuthUiMessage,
  CreateTenantRequest,
  DecommissionTenantRequest,
  DefinitionsPagedResponse,
  GatewayHealth,
  GatewayVersion,
  IconLibrarySummary,
  LogoutRequest,
  LicenseImportResponse,
  LicenseStatusResponse,
  LoginRequest,
  LoginResponse,
  ObjectTypeCreateRequest,
  ObjectTypeResponse,
  ObjectTypeUpdateRequest,
  PagedResponse,
  PasswordResetConfirmRequest,
  PasswordResetRequest,
  ProviderTestConnectionResponse,
  PalettePackSummary,
  RefreshTokenRequest,
  RollbackBrandRequest,
  SeatAssignment,
  SeatAssignmentRequest,
  SeatAvailabilityInfo,
  SuspendTenantRequest,
  Tenant,
  TenantBranding,
  TenantBrandingValidationResponse,
  TenantIdentityProvider,
  TenantIdentityProviderPatchRequest,
  TenantIdentityProviderRequest,
  TenantListResponse,
  TenantResolveResponse,
  TenantStatsResponse,
  TenantUser,
  TenantUserListQuery,
  TypographyPackSummary,
  UpdateBrandDraftRequest,
  UpdateTenantBrandingRequest,
  UpdateTenantRequest,
  UserSession,
} from './models';

interface TenantListEnvelope {
  readonly tenants?: unknown;
  readonly content?: unknown;
  readonly total?: number;
  readonly totalElements?: number;
  readonly page?: number;
  readonly limit?: number;
  readonly size?: number;
}

interface TenantProviderEnvelope {
  readonly providers?: unknown;
  readonly content?: unknown;
}

interface TenantUserEnvelope {
  readonly content?: unknown;
  readonly page?: number;
  readonly size?: number;
  readonly totalElements?: number;
  readonly totalPages?: number;
  readonly number?: number;
}

@Injectable({
  providedIn: 'root',
})
export class ApiGatewayService {
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = environment.apiBaseUrl.replace(/\/$/, '');

  getGatewayHealth(): Observable<GatewayHealth> {
    return this.http.get<GatewayHealth>(this.buildUrl('/api/health'));
  }

  getVersion(): Observable<GatewayVersion> {
    return this.http.get<GatewayVersion>(this.buildUrl('/api/version'));
  }

  listTenants(page = 1, limit = 20): Observable<TenantListResponse> {
    const params = new HttpParams().set('page', page.toString()).set('limit', limit.toString());

    return this.http
      .get<unknown>(this.buildUrl('/api/tenants'), { params })
      .pipe(map((payload) => this.normalizeTenantList(payload, page, limit)));
  }

  getTenant(tenantId: string): Observable<Tenant> {
    const encodedTenantId = encodeURIComponent(tenantId);
    return this.http.get<Tenant>(this.buildUrl(`/api/tenants/${encodedTenantId}`));
  }

  createTenant(request: CreateTenantRequest): Observable<Tenant> {
    return this.http.post<Tenant>(this.buildUrl('/api/tenants'), request);
  }

  updateTenant(tenantId: string, request: UpdateTenantRequest): Observable<Tenant> {
    const encodedTenantId = encodeURIComponent(tenantId);
    return this.http.put<Tenant>(this.buildUrl(`/api/tenants/${encodedTenantId}`), request);
  }

  deleteTenant(tenantId: string): Observable<void> {
    const encodedTenantId = encodeURIComponent(tenantId);
    return this.http.delete<void>(this.buildUrl(`/api/tenants/${encodedTenantId}`));
  }

  lockTenant(tenantId: string): Observable<Tenant> {
    const encodedTenantId = encodeURIComponent(tenantId);
    return this.http.post<Tenant>(this.buildUrl(`/api/tenants/${encodedTenantId}/lock`), {});
  }

  unlockTenant(tenantId: string): Observable<Tenant> {
    const encodedTenantId = encodeURIComponent(tenantId);
    return this.http.post<Tenant>(this.buildUrl(`/api/tenants/${encodedTenantId}/unlock`), {});
  }

  activateTenant(tenantId: string, request: ActivateTenantRequest): Observable<Tenant> {
    const encodedTenantId = encodeURIComponent(tenantId);
    return this.http.post<Tenant>(
      this.buildUrl(`/api/tenants/${encodedTenantId}/activate`),
      request,
    );
  }

  suspendTenant(tenantId: string, request: SuspendTenantRequest): Observable<Tenant> {
    const encodedTenantId = encodeURIComponent(tenantId);
    return this.http.post<Tenant>(
      this.buildUrl(`/api/tenants/${encodedTenantId}/suspend`),
      request,
    );
  }

  reactivateTenant(tenantId: string): Observable<Tenant> {
    const encodedTenantId = encodeURIComponent(tenantId);
    return this.http.post<Tenant>(this.buildUrl(`/api/tenants/${encodedTenantId}/reactivate`), {});
  }

  decommissionTenant(tenantId: string, request: DecommissionTenantRequest): Observable<Tenant> {
    const encodedTenantId = encodeURIComponent(tenantId);
    return this.http.post<Tenant>(
      this.buildUrl(`/api/tenants/${encodedTenantId}/decommission`),
      request,
    );
  }

  getTenantStats(): Observable<TenantStatsResponse> {
    return this.http.get<TenantStatsResponse>(this.buildUrl('/api/tenants/stats'));
  }

  validateShortCode(shortCode: string): Observable<{ available: boolean }> {
    return this.http.get<{ available: boolean }>(
      this.buildUrl(`/api/tenants/validate/short-code/${encodeURIComponent(shortCode)}`),
    );
  }

  listTenantIdentityProviders(tenantId: string): Observable<TenantIdentityProvider[]> {
    const encodedTenantId = encodeURIComponent(tenantId);
    return this.http
      .get<unknown>(this.buildUrl(`/api/v1/admin/tenants/${encodedTenantId}/providers`))
      .pipe(map((payload) => this.normalizeTenantProviders(payload)));
  }

  createTenantIdentityProvider(
    tenantId: string,
    request: TenantIdentityProviderRequest,
  ): Observable<TenantIdentityProvider> {
    const encodedTenantId = encodeURIComponent(tenantId);
    return this.http
      .post<unknown>(this.buildUrl(`/api/v1/admin/tenants/${encodedTenantId}/providers`), request)
      .pipe(map((payload) => this.mapTenantProvider(payload)));
  }

  getTenantIdentityProvider(
    tenantId: string,
    providerId: string,
  ): Observable<TenantIdentityProvider> {
    const encodedTenantId = encodeURIComponent(tenantId);
    const encodedProviderId = encodeURIComponent(providerId);
    return this.http
      .get<unknown>(
        this.buildUrl(`/api/v1/admin/tenants/${encodedTenantId}/providers/${encodedProviderId}`),
      )
      .pipe(map((payload) => this.mapTenantProvider(payload)));
  }

  updateTenantIdentityProvider(
    tenantId: string,
    providerId: string,
    request: TenantIdentityProviderRequest,
  ): Observable<TenantIdentityProvider> {
    const encodedTenantId = encodeURIComponent(tenantId);
    const encodedProviderId = encodeURIComponent(providerId);
    return this.http
      .put<unknown>(
        this.buildUrl(`/api/v1/admin/tenants/${encodedTenantId}/providers/${encodedProviderId}`),
        request,
      )
      .pipe(map((payload) => this.mapTenantProvider(payload)));
  }

  patchTenantIdentityProvider(
    tenantId: string,
    providerId: string,
    request: TenantIdentityProviderPatchRequest,
  ): Observable<TenantIdentityProvider> {
    const encodedTenantId = encodeURIComponent(tenantId);
    const encodedProviderId = encodeURIComponent(providerId);
    return this.http
      .patch<unknown>(
        this.buildUrl(`/api/v1/admin/tenants/${encodedTenantId}/providers/${encodedProviderId}`),
        request,
      )
      .pipe(map((payload) => this.mapTenantProvider(payload)));
  }

  deleteTenantIdentityProvider(tenantId: string, providerId: string): Observable<void> {
    const encodedTenantId = encodeURIComponent(tenantId);
    const encodedProviderId = encodeURIComponent(providerId);
    return this.http.delete<void>(
      this.buildUrl(`/api/v1/admin/tenants/${encodedTenantId}/providers/${encodedProviderId}`),
    );
  }

  testTenantIdentityProvider(
    tenantId: string,
    providerId: string,
  ): Observable<ProviderTestConnectionResponse> {
    const encodedTenantId = encodeURIComponent(tenantId);
    const encodedProviderId = encodeURIComponent(providerId);
    return this.http.post<ProviderTestConnectionResponse>(
      this.buildUrl(`/api/v1/admin/tenants/${encodedTenantId}/providers/${encodedProviderId}/test`),
      {},
    );
  }

  listTenantUsers(
    tenantId: string,
    query: TenantUserListQuery = {},
  ): Observable<PagedResponse<TenantUser>> {
    const encodedTenantId = encodeURIComponent(tenantId);
    let params = new HttpParams()
      .set('page', (query.page ?? 0).toString())
      .set('size', (query.size ?? 100).toString());

    if (query.search) {
      params = params.set('search', query.search);
    }
    if (query.role) {
      params = params.set('role', query.role);
    }
    if (query.status) {
      params = params.set('status', query.status);
    }

    return this.http
      .get<unknown>(this.buildUrl(`/api/v1/admin/tenants/${encodedTenantId}/users`), { params })
      .pipe(
        map((payload) => this.normalizeTenantUsers(payload, query.page ?? 0, query.size ?? 100)),
      );
  }

  getUserSessions(userId: string): Observable<UserSession[]> {
    return this.http.get<UserSession[]>(
      this.buildUrl(`/api/v1/users/${encodeURIComponent(userId)}/sessions`),
    );
  }

  revokeAllUserSessions(userId: string): Observable<void> {
    return this.http.delete<void>(
      this.buildUrl(`/api/v1/users/${encodeURIComponent(userId)}/sessions`),
    );
  }

  listTenantSeatAssignments(tenantId: string): Observable<SeatAssignment[]> {
    const encodedTenantId = encodeURIComponent(tenantId);
    return this.http.get<unknown>(this.buildUrl(`/api/v1/tenants/${encodedTenantId}/seats`)).pipe(
      map((payload) => {
        if (!Array.isArray(payload)) {
          return [];
        }
        return payload.map((item) => this.mapSeatAssignment(item));
      }),
    );
  }

  getTenantSeatAvailability(tenantId: string): Observable<Record<string, SeatAvailabilityInfo>> {
    const encodedTenantId = encodeURIComponent(tenantId);
    return this.http
      .get<unknown>(this.buildUrl(`/api/v1/tenants/${encodedTenantId}/seats/availability`))
      .pipe(map((payload) => this.normalizeSeatAvailability(payload)));
  }

  assignTenantSeat(tenantId: string, request: SeatAssignmentRequest): Observable<SeatAssignment> {
    const encodedTenantId = encodeURIComponent(tenantId);
    return this.http
      .post<unknown>(this.buildUrl(`/api/v1/tenants/${encodedTenantId}/seats`), request)
      .pipe(map((payload) => this.mapSeatAssignment(payload)));
  }

  revokeTenantSeat(tenantId: string, userId: string): Observable<void> {
    const encodedTenantId = encodeURIComponent(tenantId);
    const encodedUserId = encodeURIComponent(userId);
    return this.http.delete<void>(
      this.buildUrl(`/api/v1/tenants/${encodedTenantId}/seats/${encodedUserId}`),
    );
  }

  login(request: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(this.buildUrl('/api/v1/auth/login'), {
      identifier: request.identifier,
      password: request.password,
      tenantId: request.tenantId,
    });
  }

  getAuthMessages(codes: readonly string[]): Observable<AuthUiMessage[]> {
    const normalizedCodes = [...new Set(codes.map((code) => code.trim()).filter(Boolean))];
    if (normalizedCodes.length === 0) {
      return of([]);
    }

    const params = new HttpParams().set('codes', normalizedCodes.join(','));
    return this.http.get<AuthUiMessage[]>(this.buildUrl('/api/v1/auth/messages'), { params });
  }

  refreshToken(request: RefreshTokenRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(this.buildUrl('/api/v1/auth/refresh'), request);
  }

  logout(request: LogoutRequest): Observable<void> {
    return this.http.post<void>(this.buildUrl('/api/v1/auth/logout'), request);
  }

  requestPasswordReset(request: PasswordResetRequest): Observable<void> {
    return this.http.post<void>(this.buildUrl('/api/v1/auth/password/reset'), request);
  }

  confirmPasswordReset(request: PasswordResetConfirmRequest): Observable<void> {
    return this.http.post<void>(this.buildUrl('/api/v1/auth/password/reset/confirm'), request);
  }

  getLicenseStatus(): Observable<LicenseStatusResponse> {
    return this.http.get<LicenseStatusResponse>(this.buildUrl('/api/v1/admin/licenses/status'));
  }

  getCurrentLicense(): Observable<LicenseImportResponse | null> {
    return this.http
      .get<LicenseImportResponse>(this.buildUrl('/api/v1/admin/licenses/current'))
      .pipe(
        catchError((error: unknown) => {
          if (error instanceof HttpErrorResponse && error.status === 404) {
            return of(null);
          }
          return throwError(() => error);
        }),
      );
  }

  importLicense(file: File): Observable<LicenseImportResponse> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<LicenseImportResponse>(
      this.buildUrl('/api/v1/admin/licenses/import'),
      formData,
    );
  }

  getTenantBranding(tenantId: string): Observable<TenantBranding> {
    const encodedTenantId = encodeURIComponent(tenantId);
    return this.http.get<TenantBranding>(this.buildUrl(`/api/tenants/${encodedTenantId}/branding`));
  }

  updateTenantBranding(
    tenantId: string,
    branding: UpdateTenantBrandingRequest,
  ): Observable<TenantBranding> {
    const encodedTenantId = encodeURIComponent(tenantId);
    return this.http.put<TenantBranding>(
      this.buildUrl(`/api/tenants/${encodedTenantId}/branding`),
      branding,
    );
  }

  validateTenantBranding(
    tenantId: string,
    branding: UpdateTenantBrandingRequest,
  ): Observable<TenantBrandingValidationResponse> {
    const encodedTenantId = encodeURIComponent(tenantId);
    return this.http.post<TenantBrandingValidationResponse>(
      this.buildUrl(`/api/tenants/${encodedTenantId}/branding/validate`),
      branding,
    );
  }

  resolveTenant(): Observable<TenantResolveResponse> {
    return this.http.get<TenantResolveResponse>(this.buildUrl('/api/tenants/resolve'));
  }

  getTenantBrandDraft(tenantId: string): Observable<BrandDraft> {
    const encodedTenantId = encodeURIComponent(tenantId);
    return this.http.get<BrandDraft>(
      this.buildUrl(`/api/tenants/${encodedTenantId}/branding/draft`),
    );
  }

  updateTenantBrandDraft(
    tenantId: string,
    request: UpdateBrandDraftRequest,
  ): Observable<BrandDraft> {
    const encodedTenantId = encodeURIComponent(tenantId);
    return this.http.put<BrandDraft>(
      this.buildUrl(`/api/tenants/${encodedTenantId}/branding/draft`),
      request,
    );
  }

  validateTenantBrandDraft(tenantId: string): Observable<TenantBrandingValidationResponse> {
    const encodedTenantId = encodeURIComponent(tenantId);
    return this.http.post<TenantBrandingValidationResponse>(
      this.buildUrl(`/api/tenants/${encodedTenantId}/branding/draft/validate`),
      {},
    );
  }

  getTenantBrandHistory(tenantId: string): Observable<readonly BrandHistoryItem[]> {
    const encodedTenantId = encodeURIComponent(tenantId);
    return this.http.get<readonly BrandHistoryItem[]>(
      this.buildUrl(`/api/tenants/${encodedTenantId}/branding/history`),
    );
  }

  publishTenantBrandDraft(tenantId: string): Observable<ActiveBrandResolvePayload> {
    const encodedTenantId = encodeURIComponent(tenantId);
    return this.http.post<ActiveBrandResolvePayload>(
      this.buildUrl(`/api/tenants/${encodedTenantId}/branding/publish`),
      {},
    );
  }

  rollbackTenantBrandProfile(
    tenantId: string,
    request: RollbackBrandRequest,
  ): Observable<ActiveBrandResolvePayload> {
    const encodedTenantId = encodeURIComponent(tenantId);
    return this.http.post<ActiveBrandResolvePayload>(
      this.buildUrl(`/api/tenants/${encodedTenantId}/branding/rollback`),
      request,
    );
  }

  listBrandStarterKits(tenantId: string): Observable<readonly BrandStarterKitSummary[]> {
    const encodedTenantId = encodeURIComponent(tenantId);
    return this.http.get<readonly BrandStarterKitSummary[]>(
      this.buildUrl(`/api/tenants/${encodedTenantId}/branding/starter-kits`),
    );
  }

  listBrandPalettePacks(tenantId: string): Observable<readonly PalettePackSummary[]> {
    const encodedTenantId = encodeURIComponent(tenantId);
    return this.http.get<readonly PalettePackSummary[]>(
      this.buildUrl(`/api/tenants/${encodedTenantId}/branding/palette-packs`),
    );
  }

  listBrandTypographyPacks(tenantId: string): Observable<readonly TypographyPackSummary[]> {
    const encodedTenantId = encodeURIComponent(tenantId);
    return this.http.get<readonly TypographyPackSummary[]>(
      this.buildUrl(`/api/tenants/${encodedTenantId}/branding/typography-packs`),
    );
  }

  listTenantBrandAssets(tenantId: string): Observable<readonly BrandAssetSummary[]> {
    const encodedTenantId = encodeURIComponent(tenantId);
    return this.http.get<readonly BrandAssetSummary[]>(
      this.buildUrl(`/api/tenants/${encodedTenantId}/branding/assets`),
    );
  }

  listTenantIconLibraries(tenantId: string): Observable<readonly IconLibrarySummary[]> {
    const encodedTenantId = encodeURIComponent(tenantId);
    return this.http.get<readonly IconLibrarySummary[]>(
      this.buildUrl(`/api/tenants/${encodedTenantId}/branding/icon-library`),
    );
  }

  // ─── Definition Service ────────────────────────────────────────────────────

  listObjectTypes(params?: {
    page?: number;
    size?: number;
    search?: string;
    status?: string;
  }): Observable<DefinitionsPagedResponse<ObjectTypeResponse>> {
    let httpParams = new HttpParams();
    if (params?.page !== undefined) httpParams = httpParams.set('page', params.page);
    if (params?.size !== undefined) httpParams = httpParams.set('size', params.size);
    if (params?.search) httpParams = httpParams.set('search', params.search);
    if (params?.status) httpParams = httpParams.set('status', params.status);
    return this.http.get<DefinitionsPagedResponse<ObjectTypeResponse>>(
      this.buildUrl('/api/v1/definitions/object-types'),
      { params: httpParams },
    );
  }

  createObjectType(req: ObjectTypeCreateRequest): Observable<ObjectTypeResponse> {
    return this.http.post<ObjectTypeResponse>(
      this.buildUrl('/api/v1/definitions/object-types'),
      req,
    );
  }

  getObjectType(id: string): Observable<ObjectTypeResponse> {
    return this.http.get<ObjectTypeResponse>(
      this.buildUrl(`/api/v1/definitions/object-types/${encodeURIComponent(id)}`),
    );
  }

  updateObjectType(id: string, req: ObjectTypeUpdateRequest): Observable<ObjectTypeResponse> {
    return this.http.put<ObjectTypeResponse>(
      this.buildUrl(`/api/v1/definitions/object-types/${encodeURIComponent(id)}`),
      req,
    );
  }

  deleteObjectType(id: string): Observable<void> {
    return this.http.delete<void>(
      this.buildUrl(`/api/v1/definitions/object-types/${encodeURIComponent(id)}`),
    );
  }

  listAttributeTypes(): Observable<AttributeTypeResponse[]> {
    return this.http.get<AttributeTypeResponse[]>(
      this.buildUrl('/api/v1/definitions/attribute-types'),
    );
  }

  duplicateObjectType(id: string): Observable<ObjectTypeResponse> {
    return this.http.post<ObjectTypeResponse>(
      this.buildUrl(`/api/v1/definitions/object-types/${encodeURIComponent(id)}/duplicate`),
      {},
    );
  }

  restoreObjectType(id: string): Observable<ObjectTypeResponse> {
    return this.http.post<ObjectTypeResponse>(
      this.buildUrl(`/api/v1/definitions/object-types/${encodeURIComponent(id)}/restore`),
      {},
    );
  }

  addAttributeToObjectType(
    objectTypeId: string,
    req: { attributeTypeId: string; isRequired: boolean; displayOrder: number },
  ): Observable<void> {
    return this.http.post<void>(
      this.buildUrl(
        `/api/v1/definitions/object-types/${encodeURIComponent(objectTypeId)}/attributes`,
      ),
      req,
    );
  }

  addConnectionToObjectType(
    objectTypeId: string,
    req: {
      targetObjectTypeId: string;
      relationshipKey: string;
      activeName: string;
      passiveName: string;
      cardinality: string;
      isDirected: boolean;
    },
  ): Observable<void> {
    return this.http.post<void>(
      this.buildUrl(
        `/api/v1/definitions/object-types/${encodeURIComponent(objectTypeId)}/connections`,
      ),
      req,
    );
  }

  removeAttributeFromObjectType(objectTypeId: string, attributeTypeId: string): Observable<void> {
    return this.http.delete<void>(
      this.buildUrl(
        `/api/v1/definitions/object-types/${encodeURIComponent(objectTypeId)}/attributes/${encodeURIComponent(attributeTypeId)}`,
      ),
    );
  }

  removeConnectionFromObjectType(objectTypeId: string, targetTypeId: string): Observable<void> {
    return this.http.delete<void>(
      this.buildUrl(
        `/api/v1/definitions/object-types/${encodeURIComponent(objectTypeId)}/connections/${encodeURIComponent(targetTypeId)}`,
      ),
    );
  }

  createAttributeType(req: {
    name: string;
    attributeKey: string;
    dataType: string;
    attributeGroup?: string;
    description?: string;
    defaultValue?: string;
  }): Observable<AttributeTypeResponse> {
    return this.http.post<AttributeTypeResponse>(
      this.buildUrl('/api/v1/definitions/attribute-types'),
      req,
    );
  }

  private buildUrl(path: string): string {
    return `${this.apiBaseUrl}${path}`;
  }

  private normalizeTenantList(payload: unknown, page: number, limit: number): TenantListResponse {
    if (Array.isArray(payload)) {
      return {
        tenants: payload as Tenant[],
        total: payload.length,
        page,
        limit,
      };
    }

    if (this.isEnvelope(payload)) {
      const rawTenants = Array.isArray(payload.tenants)
        ? payload.tenants
        : Array.isArray(payload.content)
          ? payload.content
          : [];

      return {
        tenants: rawTenants as Tenant[],
        total: payload.total ?? payload.totalElements ?? rawTenants.length,
        page: payload.page ?? page,
        limit: payload.limit ?? payload.size ?? limit,
      };
    }

    return {
      tenants: [],
      total: 0,
      page,
      limit,
    };
  }

  private isEnvelope(value: unknown): value is TenantListEnvelope {
    return typeof value === 'object' && value !== null;
  }

  private normalizeTenantProviders(payload: unknown): TenantIdentityProvider[] {
    if (Array.isArray(payload)) {
      return payload.map((item) => this.mapTenantProvider(item));
    }

    if (this.isProviderEnvelope(payload)) {
      const providers = Array.isArray(payload.providers)
        ? payload.providers
        : Array.isArray(payload.content)
          ? payload.content
          : [];
      return providers.map((item) => this.mapTenantProvider(item));
    }

    return [];
  }

  private normalizeTenantUsers(
    payload: unknown,
    page: number,
    size: number,
  ): PagedResponse<TenantUser> {
    if (!this.isUserEnvelope(payload)) {
      return {
        content: [],
        page,
        size,
        totalElements: 0,
        totalPages: 0,
      };
    }

    const content = Array.isArray(payload.content)
      ? payload.content.map((item) => this.mapTenantUser(item))
      : [];

    return {
      content,
      page: payload.page ?? payload.number ?? page,
      size: payload.size ?? size,
      totalElements: payload.totalElements ?? content.length,
      totalPages: payload.totalPages ?? 1,
    };
  }

  private normalizeSeatAvailability(payload: unknown): Record<string, SeatAvailabilityInfo> {
    if (!this.isRecord(payload)) {
      return {};
    }

    const mapped: Record<string, SeatAvailabilityInfo> = {};
    for (const [tier, value] of Object.entries(payload)) {
      const record = this.asRecord(value);
      mapped[tier] = {
        maxSeats: this.asNumber(record?.['maxSeats']) ?? 0,
        assigned: this.asNumber(record?.['assigned']) ?? 0,
        available: this.asNumber(record?.['available']) ?? 0,
        unlimited: this.asBoolean(record?.['unlimited']) ?? false,
      };
    }

    return mapped;
  }

  private mapTenantProvider(payload: unknown): TenantIdentityProvider {
    const record = this.asRecord(payload);
    const providerName =
      this.asString(record?.['providerName']) ??
      this.asString(record?.['providerType']) ??
      this.asString(record?.['name']) ??
      this.asString(record?.['id']) ??
      'UNKNOWN';
    const enabled =
      this.asBoolean(record?.['enabled']) ??
      this.asString(record?.['status'])?.toLowerCase() === 'active';
    const providerType =
      this.asString(record?.['providerType']) ??
      this.asString(record?.['providerName']) ??
      'CUSTOM';

    return {
      id: this.asString(record?.['id']) ?? providerName,
      providerName,
      providerType,
      displayName: this.asString(record?.['displayName']) ?? this.humanize(providerName),
      protocol: this.asString(record?.['protocol']) ?? 'UNKNOWN',
      enabled,
      status: enabled ? 'active' : 'inactive',
      clientId: this.asString(record?.['clientId']),
      discoveryUrl: this.asString(record?.['discoveryUrl']),
      metadataUrl: this.asString(record?.['metadataUrl']),
      serverUrl: this.asString(record?.['serverUrl']),
      port: this.asNumber(record?.['port']),
      bindDn: this.asString(record?.['bindDn']),
      userSearchBase: this.asString(record?.['userSearchBase']),
      userSearchFilter: this.asString(record?.['userSearchFilter']),
      idpHint: this.asString(record?.['idpHint']),
      authorizationUrl: this.asString(record?.['authorizationUrl']),
      tokenUrl: this.asString(record?.['tokenUrl']),
      userInfoUrl: this.asString(record?.['userInfoUrl']),
      jwksUrl: this.asString(record?.['jwksUrl']),
      issuerUrl: this.asString(record?.['issuerUrl']),
      scopes: this.asStringArray(record?.['scopes']),
      priority: this.asNumber(record?.['priority']),
      lastTestedAt: this.asIsoLikeString(record?.['lastTestedAt']),
      testResult: this.asTestResult(record?.['testResult']),
    };
  }

  private mapTenantUser(payload: unknown): TenantUser {
    const record = this.asRecord(payload);
    const firstName = this.asString(record?.['firstName']) ?? '';
    const lastName = this.asString(record?.['lastName']) ?? '';
    const email = this.asString(record?.['email']) ?? '';
    const derivedDisplayName = `${firstName} ${lastName}`.trim();
    const displayName =
      this.asString(record?.['displayName']) ??
      (derivedDisplayName.length > 0 ? derivedDisplayName : email);

    return {
      id: this.asString(record?.['id']) ?? '',
      email,
      firstName,
      lastName,
      displayName,
      active: this.asBoolean(record?.['active']) ?? false,
      emailVerified: this.asBoolean(record?.['emailVerified']) ?? false,
      roles: this.asStringArray(record?.['roles']) ?? [],
      groups: this.asStringArray(record?.['groups']) ?? [],
      identityProvider: this.asString(record?.['identityProvider']) ?? 'unknown',
      lastLoginAt: this.asIsoLikeString(record?.['lastLoginAt']),
      createdAt: this.asIsoLikeString(record?.['createdAt']),
    };
  }

  private mapSeatAssignment(payload: unknown): SeatAssignment {
    const record = this.asRecord(payload);
    return {
      assignmentId: this.asString(record?.['assignmentId']) ?? '',
      userId: this.asString(record?.['userId']) ?? '',
      tenantId: this.asString(record?.['tenantId']) ?? '',
      tier: this.asUserTier(record?.['tier']) ?? 'VIEWER',
      assignedAt: this.asIsoLikeString(record?.['assignedAt']),
      assignedBy: this.asString(record?.['assignedBy']),
    };
  }

  private isProviderEnvelope(payload: unknown): payload is TenantProviderEnvelope {
    return typeof payload === 'object' && payload !== null;
  }

  private isUserEnvelope(payload: unknown): payload is TenantUserEnvelope {
    return typeof payload === 'object' && payload !== null;
  }

  private asRecord(payload: unknown): Record<string, unknown> | null {
    return typeof payload === 'object' && payload !== null
      ? (payload as Record<string, unknown>)
      : null;
  }

  private isRecord(payload: unknown): payload is Record<string, unknown> {
    return typeof payload === 'object' && payload !== null;
  }

  private asString(payload: unknown): string | undefined {
    return typeof payload === 'string' && payload.trim().length > 0 ? payload : undefined;
  }

  private asBoolean(payload: unknown): boolean | undefined {
    return typeof payload === 'boolean' ? payload : undefined;
  }

  private asNumber(payload: unknown): number | undefined {
    if (typeof payload === 'number') {
      return payload;
    }
    if (typeof payload === 'string' && payload.trim().length > 0) {
      const parsed = Number(payload);
      return Number.isFinite(parsed) ? parsed : undefined;
    }
    return undefined;
  }

  private asStringArray(payload: unknown): readonly string[] | undefined {
    if (!Array.isArray(payload)) {
      return undefined;
    }

    const items = payload.filter((value): value is string => typeof value === 'string');
    return items.length > 0 ? items : undefined;
  }

  private asTestResult(payload: unknown): TenantIdentityProvider['testResult'] {
    if (payload === 'success' || payload === 'failure' || payload === 'pending') {
      return payload;
    }
    return undefined;
  }

  private asUserTier(payload: unknown): SeatAssignment['tier'] | undefined {
    if (
      payload === 'TENANT_ADMIN' ||
      payload === 'POWER_USER' ||
      payload === 'CONTRIBUTOR' ||
      payload === 'VIEWER'
    ) {
      return payload;
    }
    return undefined;
  }

  private asIsoLikeString(payload: unknown): string | undefined {
    if (typeof payload !== 'string' || payload.trim().length === 0) {
      return undefined;
    }
    return payload;
  }

  private humanize(value: string): string {
    return value
      .toLowerCase()
      .replace(/[_-]+/g, ' ')
      .replace(/\b\w/g, (char) => char.toUpperCase());
  }
}
