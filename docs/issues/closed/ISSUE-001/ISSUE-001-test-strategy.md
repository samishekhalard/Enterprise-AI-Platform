# Test Strategy: ISSUE-001 - Master Tenant Authentication & Superuser Configuration

**Version:** 1.0.0
**Created:** 2026-02-26
**Author:** QA Agent (QA Lead)
**Status:** Draft
**Related Issue:** ISSUE-001 (ISSUE-001a, ISSUE-001b, ISSUE-001c, ISSUE-001d)

---

## Overview

This test strategy covers the four sub-issues of ISSUE-001: fixing the 404 on identity provider listing (001a), configuring the Keycloak superuser (001b), enabling superuser authentication through auth-facade (001c), and adding a new Users tab to the administration page (001d).

The strategy follows the testing pyramid ratio of 70% unit / 20% integration / 10% E2E as mandated by QA-PRINCIPLES.md v1.0.0. All tests use the Arrange-Act-Assert (AAA) pattern and naming convention `{methodName}_{scenario}_{expectedBehavior}`.

---

## Scope

### In Scope

- AdminProviderController CRUD operations and secret masking
- API Gateway route forwarding for `/api/v1/admin/**`
- DynamicBrokerSecurityConfig authorization (ADMIN role enforcement)
- Neo4jProviderResolver read/write/cache operations
- AuthServiceImpl login flow and realm resolution
- KeycloakIdentityProvider authentication via Direct Access Grant
- AdminUserController (new) user listing with pagination
- UserManagementService (new) Keycloak Admin API integration
- Frontend ProviderAdminService, ProviderListComponent, ProviderEmbeddedComponent
- Frontend Users tab component (new)
- E2E flows: login, navigate to administration, view providers, view users
- Security: 401/403 enforcement, cross-tenant isolation, JWT expiry

### Out of Scope

- Keycloak internal behavior (treated as external dependency; mocked or containerized)
- Neo4j query performance tuning (separate QA-PERF concern)
- Other administration tabs (branding, locale, licenses) unless regression affected
- Auth0/Okta/Azure AD providers (do not exist per CLAUDE.md Known Discrepancies)

---

## Test Strategy Summary

| Level | Count | Ratio | Frameworks |
|-------|-------|-------|------------|
| Unit | 58 | ~70% | JUnit 5 + Mockito (backend), Vitest (frontend) |
| Integration | 16 | ~20% | Spring Boot Test + Testcontainers + MockMvc |
| E2E | 8 | ~10% | Playwright |
| Security | 6 | (cross-cutting) | Spring Security Test + Playwright |
| **Total** | **88** | **100%** | |

---

## Entry Criteria

- [ ] Code complete for the sub-issue under test
- [ ] Codebase compiles without errors (`mvn compile`, `ng build`)
- [ ] Documentation verified against code (per EBD rule)
- [ ] Test environment dependencies available (Testcontainers images pulled)
- [ ] ISSUE-001b completed before ISSUE-001c tests can run
- [ ] ISSUE-001a route fix merged before integration tests target gateway

## Exit Criteria

- [ ] All 88 test cases executed
- [ ] 80% line coverage achieved on affected classes (JaCoCo / Istanbul)
- [ ] 75% branch coverage achieved on affected classes
- [ ] Zero CRITICAL defects open
- [ ] Zero HIGH defects open
- [ ] Verification audit table complete and reviewed
- [ ] Test execution report generated

---

## 1. Unit Tests (58 tests)

### 1.1 Backend Unit Tests (JUnit 5 + Mockito) -- 34 tests

#### 1.1.1 AdminProviderController (10 tests)

**File:** `backend/auth-facade/src/test/java/com/ems/auth/controller/AdminProviderControllerTest.java`

**Verified source:** `/Users/mksulty/Claude/EMSIST/backend/auth-facade/src/main/java/com/ems/auth/controller/AdminProviderController.java` (lines 45-527)

| TC-ID | Test Method | Description | Priority | Acceptance Criteria |
|-------|-------------|-------------|----------|---------------------|
| UT-BE-001 | listProviders_whenTenantHasProviders_shouldReturnList | Mock DynamicProviderResolver.listProviders() returning 2 configs; verify ResponseEntity 200 with 2 items | HIGH | 001a AC-3 |
| UT-BE-002 | listProviders_whenTenantHasNoProviders_shouldReturnEmptyList | Mock listProviders() returning empty; verify 200 with empty list | MEDIUM | 001a AC-3 |
| UT-BE-003 | getProvider_whenProviderExists_shouldReturnConfig | Mock resolveProvider(); verify 200 with ProviderConfigResponse | HIGH | 001a AC-2 |
| UT-BE-004 | getProvider_whenProviderNotFound_shouldThrow | Mock resolveProvider() throwing ProviderNotFoundException; verify exception propagation | HIGH | 001a |
| UT-BE-005 | registerProvider_withValidRequest_shouldReturn201 | Mock registerProvider() and resolveProvider(); verify 201 CREATED | HIGH | 001a |
| UT-BE-006 | updateProvider_withValidRequest_shouldReturn200 | Mock updateProvider() and resolveProvider(); verify 200 | MEDIUM | 001a |
| UT-BE-007 | deleteProvider_whenExists_shouldReturn204 | Mock deleteProvider(); verify 204 NO_CONTENT | MEDIUM | 001a |
| UT-BE-008 | patchProvider_withEnabledFalse_shouldDisable | Mock resolveProvider() returning enabled=true; patch with enabled=false; verify updateProvider called with enabled=false | HIGH | 001a |
| UT-BE-009 | patchProvider_withNoUpdates_shouldReturn400 | Pass ProviderPatchRequest with no fields set; verify 400 BAD_REQUEST | MEDIUM | 001a |
| UT-BE-010 | toResponse_shouldMaskClientSecret | Create ProviderConfig with clientSecret="abcdefgh"; verify response shows "ab****gh" | HIGH | Security |

**Notes:**
- AdminProviderController depends on `DynamicProviderResolver` and `ProviderConnectionTester` -- both must be mocked.
- The `maskSecret` method (lines 518-526) has specific logic: secrets <= 4 chars become "****", longer secrets show first 2 + **** + last 2 chars.
- All endpoints require `@PreAuthorize("hasRole('ADMIN')")` -- unit tests skip security (test security in integration layer).

#### 1.1.2 AdminUserController (NEW) (6 tests)

**File:** `backend/auth-facade/src/test/java/com/ems/auth/controller/AdminUserControllerTest.java` (NEW)

**Source does not yet exist:** `/Users/mksulty/Claude/EMSIST/backend/auth-facade/src/main/java/com/ems/auth/controller/AdminUserController.java` -- [PLANNED]

| TC-ID | Test Method | Description | Priority | Acceptance Criteria |
|-------|-------------|-------------|----------|---------------------|
| UT-BE-011 | listUsers_whenUsersExist_shouldReturnPagedList | Mock UserManagementService returning page of users; verify 200 with pagination metadata | HIGH | 001d AC-1 |
| UT-BE-012 | listUsers_withSearchFilter_shouldPassFilterToService | Pass search query param; verify service receives filter string | MEDIUM | 001d AC-4 |
| UT-BE-013 | listUsers_whenNoUsers_shouldReturnEmptyPage | Mock service returning empty page; verify 200 with empty content list | MEDIUM | 001d AC-5 |
| UT-BE-014 | listUsers_withPagination_shouldRespectPageParams | Pass page=1&size=10; verify service called with correct Pageable | MEDIUM | 001d AC-4 |
| UT-BE-015 | getUser_whenExists_shouldReturnUserDetail | Mock service returning user; verify 200 with roles and status | MEDIUM | 001d |
| UT-BE-016 | getUser_whenNotFound_shouldReturn404 | Mock service throwing UserNotFoundException; verify 404 | MEDIUM | 001d |

#### 1.1.3 UserManagementService (NEW) (6 tests)

**File:** `backend/auth-facade/src/test/java/com/ems/auth/service/UserManagementServiceTest.java` (NEW)

**Source does not yet exist:** `/Users/mksulty/Claude/EMSIST/backend/auth-facade/src/main/java/com/ems/auth/service/UserManagementService.java` -- [PLANNED]

| TC-ID | Test Method | Description | Priority | Acceptance Criteria |
|-------|-------------|-------------|----------|---------------------|
| UT-BE-017 | listUsers_shouldCallKeycloakAdminApi | Mock Keycloak admin client; verify it queries users for correct realm | HIGH | 001d AC-1 |
| UT-BE-018 | listUsers_shouldMapKeycloakUserToDto | Verify UserRepresentation mapped to UserResponse DTO with roles, email, status, lastLogin | HIGH | 001d AC-1 |
| UT-BE-019 | listUsers_shouldResolveMasterTenantRealm | Pass tenantId="master"; verify realm resolved to "master" not "tenant-master" | HIGH | 001c |
| UT-BE-020 | listUsers_shouldResolveRegularTenantRealm | Pass tenantId="acme"; verify realm resolved to "tenant-acme" | MEDIUM | 001d |
| UT-BE-021 | listUsers_whenKeycloakUnavailable_shouldThrowServiceException | Mock Keycloak client throwing exception; verify graceful error handling | HIGH | 001d |
| UT-BE-022 | listUsers_shouldApplySearchFilter | Pass search="admin"; verify Keycloak query includes search parameter | MEDIUM | 001d AC-4 |

#### 1.1.4 AuthServiceImpl (6 tests)

**File:** `backend/auth-facade/src/test/java/com/ems/auth/service/AuthServiceImplTest.java` (NEW -- existing TokenServiceTest covers only TokenService)

**Verified source:** `/Users/mksulty/Claude/EMSIST/backend/auth-facade/src/main/java/com/ems/auth/service/AuthServiceImpl.java` (lines 29-243)

| TC-ID | Test Method | Description | Priority | Acceptance Criteria |
|-------|-------------|-------------|----------|---------------------|
| UT-BE-023 | login_withValidCredentials_shouldReturnAuthResponse | Mock identityProvider.authenticate() returning success; verify AuthResponse returned | HIGH | 001c AC-1 |
| UT-BE-024 | login_withInvalidCredentials_shouldPropagateException | Mock authenticate() throwing AuthenticationException; verify propagation | HIGH | 001c |
| UT-BE-025 | login_whenMfaEnabled_shouldThrowMfaRequiredException | Mock authenticate() success + isMfaEnabled()=true; verify MfaRequiredException | HIGH | 001c |
| UT-BE-026 | login_forMasterTenant_shouldSkipSeatValidation | Pass tenantId="master"; verify seatValidationService.validateUserSeat() NOT called | MEDIUM | 001c |
| UT-BE-027 | resolveRealm_masterTenantId_shouldReturnMaster | Test private via login: tenantId="master" or "tenant-master" should resolve to "master" realm | HIGH | 001c AC-1 |
| UT-BE-028 | resolveRealm_regularTenantId_shouldAddPrefix | Test via login: tenantId="acme" should resolve to "tenant-acme"; tenantId="tenant-acme" should stay as-is | MEDIUM | 001c |

**Notes:**
- AuthServiceImpl depends on `IdentityProvider`, `TokenService`, `StringRedisTemplate`, `SeatValidationService` -- all mocked.
- Lines 47-48: master tenant skips seat validation. Lines 174-185: realm resolution logic.
- The existing `TokenServiceTest` (5 tests) at `/Users/mksulty/Claude/EMSIST/backend/auth-facade/src/test/java/com/ems/auth/service/TokenServiceTest.java` covers isBlacklisted and parseToken edge cases; those remain valid.

#### 1.1.5 Neo4jProviderResolver (6 tests)

**File:** `backend/auth-facade/src/test/java/com/ems/auth/provider/Neo4jProviderResolverTest.java` (NEW)

**Verified source:** `/Users/mksulty/Claude/EMSIST/backend/auth-facade/src/main/java/com/ems/auth/provider/Neo4jProviderResolver.java` (lines 44-403)

| TC-ID | Test Method | Description | Priority | Acceptance Criteria |
|-------|-------------|-------------|----------|---------------------|
| UT-BE-029 | resolveProvider_whenFound_shouldReturnConfig | Mock repository.findProviderConfig() returning ConfigNode; verify ProviderConfig populated correctly | HIGH | 001a AC-2 |
| UT-BE-030 | resolveProvider_whenNotFound_shouldThrowProviderNotFoundException | Mock repository returning empty Optional; verify ProviderNotFoundException | HIGH | 001a |
| UT-BE-031 | listProviders_shouldSortByPriority | Mock repository returning 3 ConfigNodes with priorities 3,1,2; verify list sorted as 1,2,3 | MEDIUM | 001a AC-3 |
| UT-BE-032 | registerProvider_whenDuplicate_shouldThrowProviderAlreadyExistsException | Mock providerExistsForTenant() returning true; verify ProviderAlreadyExistsException | HIGH | 001a |
| UT-BE-033 | registerProvider_shouldEncryptClientSecret | Mock encryptionService; verify encryptionService.encrypt() called with plain secret | HIGH | Security |
| UT-BE-034 | toProviderConfig_shouldDecryptSecrets | Mock encryptionService.decrypt(); verify decrypted value in ProviderConfig | HIGH | Security |

**Notes:**
- Mock `AuthGraphRepository`, `StringRedisTemplate`, `EncryptionService`.
- Cache annotations (`@Cacheable`, `@CacheEvict`) are Spring-managed -- unit tests skip caching behavior (tested at integration level).

### 1.2 Frontend Unit Tests (Vitest) -- 24 tests

#### 1.2.1 Existing Tests (Already Written, Verified)

The following spec files already exist and provide comprehensive coverage:

| File | Test Count | Status |
|------|-----------|--------|
| `/Users/mksulty/Claude/EMSIST/frontend/src/app/features/admin/identity-providers/services/provider-admin.service.spec.ts` | 28 tests | [IMPLEMENTED] |
| `/Users/mksulty/Claude/EMSIST/frontend/src/app/features/admin/identity-providers/components/provider-list/provider-list.component.spec.ts` | 31 tests | [IMPLEMENTED] |
| `/Users/mksulty/Claude/EMSIST/frontend/src/app/features/admin/identity-providers/components/provider-form/provider-form.component.spec.ts` | exists | [IMPLEMENTED] |
| `/Users/mksulty/Claude/EMSIST/frontend/src/app/features/admin/identity-providers/components/provider-embedded/provider-embedded.component.spec.ts` | exists | [IMPLEMENTED] |

These tests already cover: CRUD operations, error handling (status 0, 403, 500), signal state management, connection testing, OIDC discovery, provider templates, list display, loading/error/empty states, delete confirmation, toggle enabled, provider icons, date formatting.

**No additional tests needed for the existing identity providers feature -- the existing spec files are thorough.**

#### 1.2.2 Users Tab Component (NEW) (12 tests)

**File:** `frontend/src/app/features/admin/users/components/user-list/user-list.component.spec.ts` (NEW)

**Source does not yet exist** -- [PLANNED]

| TC-ID | Test Method | Description | Priority | Acceptance Criteria |
|-------|-------------|-------------|----------|---------------------|
| UT-FE-001 | should create component | Component instantiation | LOW | 001d |
| UT-FE-002 | should display users in table | Set mock users signal with 3 users; verify 3 table rows rendered | HIGH | 001d AC-4 |
| UT-FE-003 | should display user email and name | Verify table cell content matches user data | HIGH | 001d AC-4 |
| UT-FE-004 | should display role badges | User with roles ["ADMIN", "USER"]; verify 2 role badge elements rendered | MEDIUM | 001d AC-4 |
| UT-FE-005 | should display user status (active/disabled) | User with enabled=true shows "Active"; enabled=false shows "Disabled" | MEDIUM | 001d AC-4 |
| UT-FE-006 | should show empty state when no users | Empty users array; verify empty state message and icon visible | HIGH | 001d AC-5 |
| UT-FE-007 | should show loading state | isLoading=true; verify skeleton/spinner visible | MEDIUM | 001d |
| UT-FE-008 | should show error state with retry | error signal set; verify error message and retry button visible | MEDIUM | 001d |
| UT-FE-009 | should emit pageChange on pagination click | Click page 2; verify pageChange event emitted with page=1 (0-indexed) | HIGH | 001d AC-4 |
| UT-FE-010 | should emit searchChange on search input | Type "admin" in search; verify searchChange event emitted | MEDIUM | 001d AC-4 |
| UT-FE-011 | should format last login as relative time | User with lastLogin 2 hours ago; verify "2h ago" displayed | LOW | 001d |
| UT-FE-012 | should handle null lastLogin gracefully | User with lastLogin=null; verify "Never" displayed | LOW | 001d |

#### 1.2.3 User Admin Service (NEW) (12 tests)

**File:** `frontend/src/app/features/admin/users/services/user-admin.service.spec.ts` (NEW)

**Source does not yet exist** -- [PLANNED]

| TC-ID | Test Method | Description | Priority | Acceptance Criteria |
|-------|-------------|-------------|----------|---------------------|
| UT-FE-013 | should be created | Service instantiation | LOW | 001d |
| UT-FE-014 | should start with empty users list | Initial signal value = [] | LOW | 001d |
| UT-FE-015 | getUsers_shouldCallCorrectApiUrl | Mock HttpClient.get; verify URL = `{apiUrl}/api/v1/admin/tenants/{tenantId}/users` | HIGH | 001d AC-1 |
| UT-FE-016 | getUsers_shouldPassPaginationParams | Call with page=0, size=20; verify query params in HTTP call | MEDIUM | 001d AC-4 |
| UT-FE-017 | getUsers_shouldPassSearchFilter | Call with search="admin"; verify query param `?search=admin` | MEDIUM | 001d AC-4 |
| UT-FE-018 | getUsers_shouldMapResponseToUserModel | Mock response with Keycloak-style fields; verify mapped to frontend User model | HIGH | 001d |
| UT-FE-019 | getUsers_shouldUpdateUsersSignal | After successful fetch; verify service.users() contains data | HIGH | 001d |
| UT-FE-020 | getUsers_shouldHandleServerError | Mock 500 response; verify error signal set, isLoading=false | HIGH | 001d |
| UT-FE-021 | getUsers_shouldHandleNetworkError | Mock status=0; verify "Unable to connect" message | MEDIUM | 001d |
| UT-FE-022 | getUsers_shouldHandlePermissionError | Mock 403 response; verify permission-specific error message | MEDIUM | Security |
| UT-FE-023 | getUsers_shouldSetLoadingDuringFetch | Before response resolves; verify isLoading()=true | MEDIUM | 001d |
| UT-FE-024 | reset_shouldClearAllState | After fetch, call reset(); verify users=[], error=null, isLoading=false | LOW | 001d |

---

## 2. Integration Tests (16 tests)

### 2.1 Backend Integration Tests (Spring Boot Test + Testcontainers)

#### 2.1.1 AdminProviderController Integration (4 tests)

**File:** `backend/auth-facade/src/test/java/com/ems/auth/controller/AdminProviderControllerIntegrationTest.java` (NEW)

**Dependencies:** Neo4j Testcontainer, Valkey Testcontainer

| TC-ID | Test Method | Description | Priority | Acceptance Criteria |
|-------|-------------|-------------|----------|---------------------|
| IT-BE-001 | listProviders_withNeo4jData_shouldReturnProviders | Start Neo4j container, run V005 migration (create master tenant config); GET /api/v1/admin/tenants/master/providers with mock ADMIN JWT; verify Keycloak config returned | HIGH | 001a AC-2, AC-3 |
| IT-BE-002 | registerProvider_shouldPersistToNeo4j | POST new provider; then GET to verify persisted in Neo4j | HIGH | 001a |
| IT-BE-003 | deleteProvider_shouldRemoveFromNeo4j | Register, then DELETE, then GET returns empty | MEDIUM | 001a |
| IT-BE-004 | listProviders_withCacheInvalidation_shouldRefreshData | Register provider, verify cached list, invalidate cache, verify fresh data | MEDIUM | 001a |

**Testcontainer configuration pattern:**
```java
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@Testcontainers
@AutoConfigureMockMvc
class AdminProviderControllerIntegrationTest {

    @Container
    static Neo4jContainer<?> neo4j = new Neo4jContainer<>("neo4j:5.12.0-community")
        .withAdminPassword("testpassword");

    @Container
    static GenericContainer<?> valkey = new GenericContainer<>("valkey/valkey:8-alpine")
        .withExposedPorts(6379);

    @DynamicPropertySource
    static void configure(DynamicPropertyRegistry registry) {
        registry.add("spring.neo4j.uri", neo4j::getBoltUrl);
        registry.add("spring.neo4j.authentication.username", () -> "neo4j");
        registry.add("spring.neo4j.authentication.password", () -> "testpassword");
        registry.add("spring.data.redis.host", valkey::getHost);
        registry.add("spring.data.redis.port", () -> valkey.getMappedPort(6379));
    }
}
```

#### 2.1.2 Auth Login Flow Integration (4 tests)

**File:** `backend/auth-facade/src/test/java/com/ems/auth/controller/AuthControllerIntegrationTest.java` (NEW)

**Dependencies:** Keycloak Testcontainer (dasniko/testcontainers-keycloak), Neo4j Testcontainer, Valkey Testcontainer

| TC-ID | Test Method | Description | Priority | Acceptance Criteria |
|-------|-------------|-------------|----------|---------------------|
| IT-BE-005 | login_superuser_shouldReturnValidJwt | Start Keycloak container with realm import; POST /api/v1/auth/login with superuser creds; verify 200 with accessToken containing SUPER_ADMIN role | HIGH | 001c AC-1, AC-2 |
| IT-BE-006 | login_invalidCredentials_shouldReturn401 | POST /api/v1/auth/login with wrong password; verify 401 | HIGH | 001c |
| IT-BE-007 | refresh_withValidToken_shouldReturnNewTokens | Login, then POST /api/v1/auth/refresh with refreshToken; verify new accessToken | MEDIUM | 001c AC-4 |
| IT-BE-008 | getMe_withValidJwt_shouldReturnUserProfile | Login, then GET /api/v1/auth/me with Bearer token; verify user info | MEDIUM | 001c AC-3 |

**Keycloak Testcontainer configuration:**
```java
@Container
static KeycloakContainer keycloak = new KeycloakContainer("quay.io/keycloak/keycloak:24.0")
    .withRealmImportFile("realm-export.json")
    .withAdminUsername("admin")
    .withAdminPassword("admin");
```

#### 2.1.3 Security Filter Chain Integration (4 tests)

**File:** `backend/auth-facade/src/test/java/com/ems/auth/config/SecurityFilterChainIntegrationTest.java` (NEW)

**Verified source:** `/Users/mksulty/Claude/EMSIST/backend/auth-facade/src/main/java/com/ems/auth/config/DynamicBrokerSecurityConfig.java` (lines 35-183)

| TC-ID | Test Method | Description | Priority | Acceptance Criteria |
|-------|-------------|-------------|----------|---------------------|
| IT-SEC-001 | adminEndpoint_withoutJwt_shouldReturn401 | GET /api/v1/admin/tenants/master/providers without Authorization header; verify 401 | HIGH | Security |
| IT-SEC-002 | adminEndpoint_withUserRole_shouldReturn403 | GET with JWT containing only USER role; verify 403 | HIGH | Security |
| IT-SEC-003 | adminEndpoint_withAdminRole_shouldReturn200 | GET with JWT containing ADMIN role; verify 200 | HIGH | Security |
| IT-SEC-004 | publicAuthEndpoint_withoutJwt_shouldReturn200 | POST /api/v1/auth/login without JWT; verify endpoint reachable (not 401) | MEDIUM | 001c |

**Notes:**
- DynamicBrokerSecurityConfig defines 3 filter chains at Orders 1, 2, 3.
- Chain 1 (lines 51-73): `/api/v1/admin/**` requires `hasRole("ADMIN")` via JWT OAuth2 Resource Server.
- Chain 2 (lines 93-136): `/api/v1/auth/**` has public endpoints (login, refresh, logout, providers).
- Chain 3 (lines 146-170): catch-all for actuator and swagger.
- Use `@WithMockUser(roles="ADMIN")` or inject mock JWT for Spring Security Test.

#### 2.1.4 API Gateway Route Integration (4 tests)

**File:** `backend/api-gateway/src/test/java/com/ems/gateway/config/RouteConfigIntegrationTest.java` (NEW)

**Verified source:** `/Users/mksulty/Claude/EMSIST/backend/api-gateway/src/main/java/com/ems/gateway/config/RouteConfig.java` (lines 15-90)

**CRITICAL FINDING:** The current `RouteConfig.java` does NOT include a route for `/api/v1/admin/**`. The existing routes are:
- `/api/v1/auth/**` -> `http://localhost:8081` (auth-facade)
- `/api/tenants/**` -> `http://localhost:8082`
- `/api/v1/users/**` -> `http://localhost:8083`
- etc.

The admin endpoint `/api/v1/admin/tenants/{tenantId}/providers` has **no route** to auth-facade:8081. This is the root cause of ISSUE-001a (404 error).

| TC-ID | Test Method | Description | Priority | Acceptance Criteria |
|-------|-------------|-------------|----------|---------------------|
| IT-GW-001 | adminRoute_shouldForwardToAuthFacade | Verify `/api/v1/admin/tenants/master/providers` routes to `http://localhost:8081` | HIGH | 001a AC-1 |
| IT-GW-002 | authRoute_shouldForwardToAuthFacade | Verify `/api/v1/auth/login` routes to `http://localhost:8081` | HIGH | 001c |
| IT-GW-003 | adminRoute_shouldPreservePathAndHeaders | Verify path variables and headers forwarded correctly | MEDIUM | 001a AC-1 |
| IT-GW-004 | unknownRoute_shouldReturn404 | Verify `/api/v1/nonexistent` returns 404 | LOW | Regression |

---

## 3. E2E Tests (8 tests) -- Playwright

### 3.1 Administration Identity Providers Flow

**File:** `/Users/mksulty/Claude/EMSIST/frontend/e2e/identity-providers.e2e.ts` -- ALREADY EXISTS with 30+ tests covering:
- View provider list (cards, status badges, action buttons, empty state, loading state, error state)
- Add new provider (template selection, form fields, validation, creation, cancellation)
- Edit existing provider (form population, update, validation)
- Delete provider (confirmation dialog, cancel, confirm)
- Toggle provider enabled/disabled
- Test connection (success, failure, loading)
- Protocol-specific forms (OIDC, LDAP, advanced settings, OIDC discovery)
- Authorization (non-admin redirect)
- Error handling (conflict, network error, deleted provider)

**Assessment:** The existing E2E tests are comprehensive for the identity provider management feature. No additional E2E tests needed for ISSUE-001a provider display.

### 3.2 New E2E Tests Needed

**File:** `frontend/e2e/admin-users.e2e.ts` (NEW)

| TC-ID | Test Description | Priority | Acceptance Criteria |
|-------|-----------------|----------|---------------------|
| E2E-001 | Login as superuser, navigate to Administration, see Master Tenant in list | HIGH | 001b, 001c |
| E2E-002 | Select Master Tenant, click "Local Authentication" tab, see Keycloak provider card (no 404) | HIGH | 001a AC-3, AC-4 |
| E2E-003 | Click "Users" tab, see superuser in user list with SUPER_ADMIN badge | HIGH | 001d AC-4 |
| E2E-004 | Users tab: verify pagination controls when more than 10 users | MEDIUM | 001d AC-4 |
| E2E-005 | Users tab: search for "superadmin", verify filtered results | MEDIUM | 001d AC-4 |
| E2E-006 | Users tab: verify empty state message when tenant has no users | MEDIUM | 001d AC-5 |
| E2E-007 | Users tab: verify user status badges (active/disabled) | LOW | 001d AC-4 |
| E2E-008 | Users tab: non-admin user redirected or shown access denied | HIGH | Security |

**E2E Test Template:**
```typescript
import { test, expect, Page } from '@playwright/test';

const SUPERUSER = {
  id: 'superuser-001',
  email: 'superadmin@emsist.com',
  firstName: 'Super',
  lastName: 'Admin',
  displayName: 'Super Admin',
  roles: ['SUPER_ADMIN', 'ADMIN'],
  tenantId: 'master',
  tenantRole: 'admin',
  authProvider: 'keycloak',
  lastLogin: new Date().toISOString(),
  createdAt: '2026-01-01T00:00:00Z'
};

async function setupSuperAdminAuth(page: Page): Promise<void> {
  await page.addInitScript((user) => {
    sessionStorage.setItem('auth_user', JSON.stringify(user));
    sessionStorage.setItem('auth_refresh_token', 'mock-super-refresh-token');
    sessionStorage.setItem('auth_tenant_id', user.tenantId);
    localStorage.setItem('auth_access_token', 'mock-super-access-token');
    localStorage.setItem('auth_user', JSON.stringify(user));
  }, SUPERUSER);

  await page.route('**/api/v1/auth/refresh', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        accessToken: 'refreshed-super-token',
        refreshToken: 'mock-super-refresh-token',
        tokenType: 'Bearer',
        expiresIn: 3600,
        user: SUPERUSER
      })
    });
  });
}

async function mockUsersApi(page: Page, users = [SUPERUSER]): Promise<void> {
  await page.route('**/api/v1/admin/tenants/*/users*', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        content: users,
        totalElements: users.length,
        totalPages: 1,
        page: 0,
        size: 20
      })
    });
  });
}
```

---

## 4. Security Tests (6 tests -- cross-cutting)

Security tests span both integration (backend) and E2E (frontend) levels.

### 4.1 Backend Security (covered in IT-SEC-001 through IT-SEC-004 above)

### 4.2 Additional Security Scenarios

| TC-ID | Test Description | Level | Priority | Component |
|-------|-----------------|-------|----------|-----------|
| SEC-001 | Unauthenticated GET /api/v1/admin/tenants/master/providers returns 401 | Integration | HIGH | auth-facade |
| SEC-002 | JWT with USER role (no ADMIN) on admin endpoint returns 403 | Integration | HIGH | auth-facade |
| SEC-003 | Cross-tenant access: JWT for tenant-A requesting tenant-B providers | Integration | HIGH | auth-facade |
| SEC-004 | Expired JWT on admin endpoint returns 401 | Integration | HIGH | auth-facade |
| SEC-005 | Tampered JWT (invalid signature) returns 401 | Integration | HIGH | auth-facade |
| SEC-006 | Non-admin user accessing admin UI route sees access denied | E2E | HIGH | frontend |

**Note on SEC-003 (Cross-tenant isolation):** The current `AdminProviderController` does not perform tenant ownership validation beyond path parameter. The test should verify whether the JWT's tenant claim matches the requested tenantId. If not enforced, this is a **CRITICAL security defect** to report.

---

## 5. Test Data Requirements

### 5.1 Backend Test Fixtures

| Fixture | Purpose | Format |
|---------|---------|--------|
| `test-realm-export.json` | Keycloak realm for integration tests | JSON (Keycloak realm export) |
| V005 migration data | Master tenant with Keycloak config in Neo4j | Cypher script (existing) |
| Mock ProviderConfig | Unit test provider configs | Java builder pattern |
| Mock JWT tokens | Security tests with various roles | HMAC-signed test JWTs |

**Keycloak Test Realm Requirements:**
- Realm: `master` (or `ems`)
- Client: `ems-auth-facade` with Direct Access Grants enabled
- User: `superadmin@emsist.com` / `SuperAdmin123!` with `SUPER_ADMIN` realm role
- Roles: `SUPER_ADMIN`, `ADMIN`, `MANAGER`, `USER`, `VIEWER`

### 5.2 Frontend Test Fixtures

| Fixture | Purpose | Format |
|---------|---------|--------|
| `MOCK_PROVIDERS` | Provider list display tests | TypeScript const (already exists in E2E tests) |
| `MOCK_USERS` | User list display tests | TypeScript const array |
| `SUPERUSER` | Authenticated admin session | TypeScript const |
| `REGULAR_USER` | Non-admin access tests | TypeScript const |

**MOCK_USERS fixture:**
```typescript
const MOCK_USERS = [
  {
    id: 'user-001',
    email: 'superadmin@emsist.com',
    firstName: 'Super',
    lastName: 'Admin',
    roles: ['SUPER_ADMIN', 'ADMIN'],
    enabled: true,
    lastLogin: '2026-02-26T08:00:00Z',
    createdAt: '2026-01-01T00:00:00Z'
  },
  {
    id: 'user-002',
    email: 'manager@emsist.com',
    firstName: 'Jane',
    lastName: 'Manager',
    roles: ['MANAGER'],
    enabled: true,
    lastLogin: '2026-02-25T14:30:00Z',
    createdAt: '2026-01-15T00:00:00Z'
  },
  {
    id: 'user-003',
    email: 'disabled@emsist.com',
    firstName: 'Disabled',
    lastName: 'User',
    roles: ['USER'],
    enabled: false,
    lastLogin: null,
    createdAt: '2026-02-01T00:00:00Z'
  }
];
```

---

## 6. Coverage Targets

| Service/Component | Line Coverage Target | Branch Coverage Target | Measurement Tool |
|-------------------|---------------------|----------------------|-----------------|
| AdminProviderController | >= 80% | >= 75% | JaCoCo |
| AdminUserController (new) | >= 80% | >= 75% | JaCoCo |
| UserManagementService (new) | >= 80% | >= 75% | JaCoCo |
| AuthServiceImpl | >= 80% | >= 75% | JaCoCo |
| Neo4jProviderResolver | >= 80% | >= 75% | JaCoCo |
| DynamicBrokerSecurityConfig | >= 80% | >= 75% | JaCoCo (via integration) |
| ProviderAdminService (FE) | >= 80% | >= 75% | Istanbul/v8 (Vitest) |
| ProviderListComponent (FE) | >= 80% | >= 75% | Istanbul/v8 (Vitest) |
| UserListComponent (new FE) | >= 80% | >= 75% | Istanbul/v8 (Vitest) |
| UserAdminService (new FE) | >= 80% | >= 75% | Istanbul/v8 (Vitest) |

**Acceptance Criteria Coverage:**

| Sub-Issue | Total AC | AC with Tests | Coverage |
|-----------|----------|---------------|----------|
| ISSUE-001a | 4 | 4 | 100% |
| ISSUE-001b | 5 | 3 (testable via integration) | 60% (2 are infra/docs deliverables) |
| ISSUE-001c | 5 | 5 | 100% |
| ISSUE-001d | 5 | 5 | 100% |

---

## 7. Risk Assessment

| Risk | Probability | Impact | Severity | Mitigation |
|------|-------------|--------|----------|------------|
| Missing API Gateway route for `/api/v1/admin/**` causes 404 | **CONFIRMED** | HIGH | **CRITICAL** | Fix RouteConfig.java to add admin route to auth-facade:8081 |
| Keycloak Testcontainer startup time slows CI | Medium | Medium | MEDIUM | Use `@TestMethodOrder` to share container across tests; use reusable containers |
| Neo4j Testcontainer V005 migration not executed automatically | Medium | High | HIGH | Ensure migration scripts run on startup or use `@Sql`-equivalent for Neo4j |
| Cross-tenant provider access not validated (SEC-003) | High | High | **CRITICAL** | Implement tenant ownership check in AdminProviderController or resolver |
| Java 23 + Mockito compatibility issues (noted in TokenServiceTest) | Medium | Medium | MEDIUM | Use Testcontainers for Redis-dependent tests; use mockStatic sparingly |
| Frontend Vitest tests may fail due to missing Angular signal polyfills | Low | Medium | LOW | Ensure `vitest.config.ts` includes Angular testing setup |

---

## 8. Defect Found During Analysis

### DEF-2026-02-26-001

**Severity:** CRITICAL
**Component:** api-gateway (RouteConfig.java)
**Reporter:** QA Agent
**Date Found:** 2026-02-26

**Summary:** API Gateway has no route for `/api/v1/admin/**` endpoints, causing 404 for all admin operations.

**Evidence:**
- **File:** `/Users/mksulty/Claude/EMSIST/backend/api-gateway/src/main/java/com/ems/gateway/config/RouteConfig.java`
- **Lines:** 18-89 (entire route configuration)
- **Code:** The file defines routes for `/api/v1/auth/**`, `/api/tenants/**`, `/api/v1/users/**`, `/api/v1/products/**`, `/api/v1/licenses/**`, `/api/v1/notifications/**`, `/api/v1/audit/**`, `/api/v1/agents/**`, `/api/v1/conversations/**`, `/api/v1/providers/**`, `/api/process/**` but has NO route for `/api/v1/admin/**`.

**Expected Behavior:** A route mapping `/api/v1/admin/**` to `http://localhost:8081` (auth-facade) should exist, matching the `AdminProviderController` request mapping at `/api/v1/admin/tenants/{tenantId}/providers`.

**Actual Behavior:** Requests to `/api/v1/admin/tenants/{tenantId}/providers` return 404 because the gateway has no matching route.

**Impact:** All admin provider management operations fail. This is the confirmed root cause of ISSUE-001a.

**Suggested Fix:**
Add to RouteConfig.java:
```java
// ADMIN ENDPOINTS - Auth Facade (8081)
.route("admin-service", r -> r
    .path("/api/v1/admin/**")
    .uri("http://localhost:8081"))
```

---

## 9. Verification Audit Table

| ID | Claim/Feature | Documentation | Code Location | Status | Evidence | Severity |
|----|---------------|---------------|---------------|--------|----------|----------|
| V-001 | AdminProviderController handles CRUD | ISSUE-001 | `/Users/mksulty/Claude/EMSIST/backend/auth-facade/src/main/java/com/ems/auth/controller/AdminProviderController.java` | VERIFIED | Lines 56-482: GET, POST, PUT, DELETE, PATCH, test, validate, cache-invalidate endpoints | - |
| V-002 | API Gateway routes admin to auth-facade | ISSUE-001a | `/Users/mksulty/Claude/EMSIST/backend/api-gateway/src/main/java/com/ems/gateway/config/RouteConfig.java` | **DISCREPANCY** | No `/api/v1/admin/**` route exists in lines 18-89 | **CRITICAL** |
| V-003 | DynamicBrokerSecurityConfig requires ADMIN role | ISSUE-001 | `/Users/mksulty/Claude/EMSIST/backend/auth-facade/src/main/java/com/ems/auth/config/DynamicBrokerSecurityConfig.java` | VERIFIED | Line 66: `.requestMatchers("/api/v1/admin/**").hasRole("ADMIN")` | - |
| V-004 | Neo4jProviderResolver implements provider storage | ISSUE-001a | `/Users/mksulty/Claude/EMSIST/backend/auth-facade/src/main/java/com/ems/auth/provider/Neo4jProviderResolver.java` | VERIFIED | Lines 44-403: Full CRUD with caching and encryption | - |
| V-005 | AuthServiceImpl handles login with realm resolution | ISSUE-001c | `/Users/mksulty/Claude/EMSIST/backend/auth-facade/src/main/java/com/ems/auth/service/AuthServiceImpl.java` | VERIFIED | Lines 40-64: login(), lines 174-185: resolveRealm() | - |
| V-006 | AdminUserController exists | ISSUE-001d | NOT FOUND | **MISSING** | No file at expected path | - (PLANNED) |
| V-007 | UserManagementService exists | ISSUE-001d | NOT FOUND | **MISSING** | No file at expected path | - (PLANNED) |
| V-008 | Frontend provider specs exist | ISSUE-001a | `/Users/mksulty/Claude/EMSIST/frontend/src/app/features/admin/identity-providers/services/provider-admin.service.spec.ts` | VERIFIED | 28+ tests covering CRUD, errors, state | - |
| V-009 | Frontend E2E provider tests exist | ISSUE-001a | `/Users/mksulty/Claude/EMSIST/frontend/e2e/identity-providers.e2e.ts` | VERIFIED | 30+ E2E scenarios covering full lifecycle | - |
| V-010 | Users tab frontend component exists | ISSUE-001d | NOT FOUND | **MISSING** | No `users/` feature directory exists | - (PLANNED) |
| V-011 | Existing TokenServiceTest | - | `/Users/mksulty/Claude/EMSIST/backend/auth-facade/src/test/java/com/ems/auth/service/TokenServiceTest.java` | VERIFIED | 5 tests: isBlacklisted null/empty/blank, parseToken malformed/empty | - |
| V-012 | Secret masking in AdminProviderController | Security | `/Users/mksulty/Claude/EMSIST/backend/auth-facade/src/main/java/com/ems/auth/controller/AdminProviderController.java` | VERIFIED | Lines 518-526: maskSecret() masks secrets as xx****xx | - |

---

## 10. Test Execution Delegation

| Sub-Agent | Tests Assigned | Scope |
|-----------|---------------|-------|
| QA-UNIT | UT-BE-001 through UT-BE-034, UT-FE-001 through UT-FE-024 | All 58 unit tests |
| QA-INT | IT-BE-001 through IT-BE-008, IT-SEC-001 through IT-SEC-004, IT-GW-001 through IT-GW-004 | All 16 integration tests |
| QA-REG | Existing provider-admin.service.spec.ts, provider-list.component.spec.ts | Verify no regression in existing 59+ frontend tests |
| QA-PERF | (Deferred) | Performance baseline after feature implementation |
| SEC | SEC-001 through SEC-006 | Security test review and execution |

---

## 11. Dependencies Between Sub-Issues and Testing

```
ISSUE-001b (Keycloak config)
    |-- Tests: IT-BE-005 through IT-BE-008 depend on realm-export.json
    |
    v
ISSUE-001c (Superuser auth)
    |-- Tests: UT-BE-023 through UT-BE-028 (unit, no dependency)
    |-- Tests: IT-BE-005 through IT-BE-008 (integration, needs Keycloak)
    |
    v
ISSUE-001a (Fix 404)
    |-- BLOCKER: RouteConfig.java must be fixed first (DEF-2026-02-26-001)
    |-- Tests: UT-BE-001 through UT-BE-010 (unit, no dependency)
    |-- Tests: IT-GW-001 through IT-GW-004 (integration, needs route fix)
    |-- Tests: IT-BE-001 through IT-BE-004 (integration, needs Neo4j)
    |
    v
ISSUE-001d (Users tab)
    |-- Tests: UT-BE-011 through UT-BE-022 (unit, after code written)
    |-- Tests: UT-FE-001 through UT-FE-024 (unit, after code written)
    |-- Tests: E2E-001 through E2E-008 (E2E, after all sub-issues done)
```

---

## Appendix A: Test Naming Convention

Per QA-PRINCIPLES.md:

```
{methodName}_{scenario}_{expectedBehavior}

Backend examples:
- listProviders_whenTenantHasProviders_shouldReturnList
- login_withInvalidCredentials_shouldPropagateException
- resolveRealm_masterTenantId_shouldReturnMaster

Frontend examples:
- should display users in table
- should show empty state when no users
- should emit pageChange on pagination click
```

## Appendix B: Existing Test Inventory (Baseline)

| Location | Count | Status |
|----------|-------|--------|
| `backend/auth-facade/src/test/java/.../TokenServiceTest.java` | 5 | Passing |
| `backend/auth-facade/src/test/java/.../AuthFacadeApplicationTests.java` | 1 | Verify |
| `backend/api-gateway/src/test/java/.../TenantContextFilterTest.java` | exists | Verify |
| `backend/api-gateway/src/test/java/.../TenantContextFilterIntegrationTest.java` | exists | Verify |
| `backend/tenant-service/src/test/java/...` | 3 files | Verify |
| `backend/process-service/src/test/java/...` | 6 files | Verify |
| `frontend/src/app/features/admin/identity-providers/**/*.spec.ts` | 4 files (~100+ tests) | Passing |
| `frontend/e2e/auth.e2e.ts` | ~20 tests | Passing |
| `frontend/e2e/identity-providers.e2e.ts` | ~30 tests | Passing |
| `frontend/src/app/**/*.spec.ts` | 13 files total | Verify |
