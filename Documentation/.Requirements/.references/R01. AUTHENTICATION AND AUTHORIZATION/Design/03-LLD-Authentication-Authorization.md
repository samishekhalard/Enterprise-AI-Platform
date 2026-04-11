# LLD-03: Authentication and Authorization -- Low-Level Design

**Document ID:** LLD-AUTH-001
**Version:** 1.0.0
**Date:** 2026-03-12
**Status:** [IMPLEMENTED] -- Verified against codebase
**Author:** SA Agent

---

## 1. Introduction and Scope

### 1.1 Purpose

This Low-Level Design document describes the **implemented** authentication and authorization architecture for the EMSIST platform. All claims in this document have been verified against the actual source code as of 2026-03-12.

### 1.2 Scope

| Area | Coverage | Status |
|------|----------|--------|
| auth-facade service (port 8081) | Full auth lifecycle | [IMPLEMENTED] |
| api-gateway security (port 8080) | Edge security, token blacklist, tenant validation | [IMPLEMENTED] |
| Frontend auth layer (Angular) | Guards, interceptors, session management | [IMPLEMENTED] |
| Identity provider abstraction | Strategy pattern, Keycloak implementation | [IMPLEMENTED] |
| MFA (TOTP) | Setup, verify, session management | [IMPLEMENTED] |
| License seat validation | Feign client to license-service with circuit breaker | [IMPLEMENTED] |
| Additional IdP implementations (Auth0, Okta, Azure AD) | Interface exists, no implementations | [PLANNED] |

### 1.3 Technology Stack

| Component | Technology | Evidence |
|-----------|-----------|----------|
| Backend framework | Spring Boot 3.4.1, Java 23 | `backend/auth-facade/pom.xml` |
| Identity provider | Keycloak 24 | `docker-compose.yml`, `KeycloakConfig.java` |
| Token validation | jjwt (io.jsonwebtoken) | `JwtTokenValidator.java` |
| Cache / token blacklist | Valkey 8 (via Spring Data Redis) | `StringRedisTemplate` usage across services |
| Graph database | Neo4j Community 5.12.0 | `Neo4jConfig.java`, provider nodes |
| Service discovery | Eureka | `LicenseServiceClient.java` uses `@FeignClient(name=...)` |
| Gateway | Spring Cloud Gateway (WebFlux) | `api-gateway` uses reactive `ServerHttpSecurity` |
| Frontend | Angular 21, signals | `session.service.ts`, `auth.guard.ts` |
| MFA | TOTP via samstevens totp library | `KeycloakIdentityProvider.java` |

---

## 2. Component Architecture

### 2.1 System Component Overview

```mermaid
graph TD
    subgraph Frontend["Frontend (Angular 21)"]
        AG[auth.guard.ts]
        AI[auth.interceptor.ts]
        THI[tenant-header.interceptor.ts]
        SS[SessionService]
        TCS[TenantContextService]
        GAF[GatewayAuthFacadeService]
        AF_IFACE[AuthFacade interface]
    end

    subgraph Gateway["API Gateway (port 8080)"]
        GW_SEC[SecurityConfig - WebFlux]
        TBF[TokenBlacklistFilter]
        TCF_GW[TenantContextFilter]
        RC[RouteConfig]
    end

    subgraph AuthFacade["auth-facade (port 8081)"]
        AC[AuthController]
        APC[AdminProviderController]
        EC[EventController]
        ASI[AuthServiceImpl]
        TSI[TokenServiceImpl]
        SVS[SeatValidationService]
        IP[IdentityProvider interface]
        KIP[KeycloakIdentityProvider]
        JVF[JwtValidationFilter]
        TCF_AF[TenantContextFilter]
        RLF[RateLimitFilter]
        JTV[JwtTokenValidator]
        DBSC[DynamicBrokerSecurityConfig]
        PARC[ProviderAgnosticRoleConverter]
        RR[RealmResolver]
    end

    subgraph External["External Services"]
        KC[Keycloak 24]
        VK[Valkey 8]
        N4J[Neo4j Community]
        LS[license-service]
    end

    Frontend -->|HTTP| Gateway
    Gateway -->|Route| AuthFacade
    AC --> ASI
    ASI --> IP
    IP -.->|implements| KIP
    KIP --> KC
    ASI --> TSI
    TSI --> VK
    ASI --> SVS
    SVS -->|Feign| LS
    JVF --> JTV
    JTV --> KC
    JVF --> TSI
    TBF --> VK
    APC --> N4J
```

### 2.2 auth-facade Package Structure [IMPLEMENTED]

Verified file tree from actual codebase:

```
com.ems.auth/
├── AuthFacadeApplication.java
├── client/
│   ├── LicenseServiceClient.java              # Feign client to license-service
│   ├── LicenseServiceClientFallbackFactory.java
│   └── SeatValidationResponse.java
├── config/
│   ├── AuthProperties.java                    # @ConfigurationProperties(prefix = "auth.facade")
│   ├── CacheConfig.java
│   ├── DynamicBrokerSecurityConfig.java       # 5 SecurityFilterChain beans
│   ├── EncryptionConfig.java
│   ├── FeignSecurityConfig.java
│   ├── GlobalExceptionHandler.java            # @RestControllerAdvice
│   ├── JasyptConfig.java
│   ├── KeycloakConfig.java                    # @ConfigurationProperties(prefix = "keycloak")
│   ├── Neo4jConfig.java
│   ├── OpenApiConfig.java
│   ├── RedisConfig.java
│   ├── SecurityConfig.java
│   └── SecretsValidationConfig.java
├── controller/
│   ├── AdminProviderController.java           # /api/v1/admin/tenants/{tenantId}/providers
│   ├── AdminUserController.java               # /api/v1/admin/tenants/{tenantId}/users
│   ├── AuthController.java                    # /api/v1/auth/**
│   └── EventController.java                   # /api/v1/events/**
├── domain/
│   ├── ProtocolType.java
│   └── ProviderType.java
├── dto/
│   ├── PagedResponse.java
│   ├── ProviderConfigRequest.java
│   ├── ProviderConfigResponse.java
│   ├── ProviderPatchRequest.java
│   ├── TestConnectionResponse.java
│   └── UserResponse.java
├── exception/
│   └── UserNotFoundException.java
├── filter/
│   ├── JwtValidationFilter.java               # @Order(3) - JWT validation per request
│   ├── RateLimitFilter.java                   # @Order(2) - Valkey-backed rate limiting
│   └── TenantContextFilter.java               # @Order(1) - X-Tenant-ID extraction
├── graph/
│   ├── Neo4jDataInitializer.java
│   ├── entity/
│   │   ├── ConfigNode.java
│   │   ├── GroupNode.java
│   │   ├── ProtocolNode.java
│   │   ├── ProviderNode.java
│   │   ├── RoleNode.java
│   │   ├── TenantNode.java
│   │   └── UserNode.java
│   └── repository/
│       ├── AuthGraphRepository.java
│       └── UserGraphRepository.java
├── provider/
│   ├── DynamicProviderResolver.java
│   ├── IdentityProvider.java                  # Strategy interface (12 methods)
│   ├── InMemoryProviderResolver.java
│   ├── KeycloakIdentityProvider.java          # @ConditionalOnProperty("auth.facade.provider", "keycloak")
│   ├── LoginInitiationResponse.java
│   ├── Neo4jProviderResolver.java
│   ├── ProviderAlreadyExistsException.java
│   ├── ProviderConfig.java
│   └── ProviderNotFoundException.java
├── security/
│   ├── InternalServiceTokenProvider.java
│   ├── JwtTokenValidator.java                 # JWKS-based RS256 validation
│   ├── KeycloakPrincipalExtractor.java
│   ├── PrincipalExtractor.java
│   ├── ProviderAgnosticRoleConverter.java     # Configurable role claim paths
│   └── TenantAccessValidator.java
├── service/
│   ├── AuthService.java                       # Interface
│   ├── AuthServiceImpl.java                   # Core business logic
│   ├── EncryptionService.java
│   ├── GraphRoleService.java
│   ├── JasyptEncryptionService.java
│   ├── KeycloakService.java
│   ├── KeycloakServiceImpl.java
│   ├── ProviderConnectionTester.java
│   ├── SeatValidationService.java             # @CircuitBreaker(name = "licenseService")
│   ├── TokenService.java                      # Interface
│   ├── TokenServiceImpl.java                  # Blacklist + MFA sessions via Valkey
│   ├── UserManagementService.java
│   └── UserManagementServiceImpl.java
└── util/
    └── RealmResolver.java                     # tenantId -> Keycloak realm mapping
```

---

## 3. Service Layer Design

### 3.1 Class Diagram -- Core Services

```mermaid
classDiagram
    class AuthService {
        <<interface>>
        +login(tenantId, LoginRequest) AuthResponse
        +loginWithGoogle(tenantId, GoogleTokenRequest) AuthResponse
        +loginWithMicrosoft(tenantId, MicrosoftTokenRequest) AuthResponse
        +refreshToken(tenantId, RefreshTokenRequest) AuthResponse
        +logout(tenantId, LogoutRequest, accessToken) void
        +setupMfa(userId, tenantId, MfaSetupRequest) MfaSetupResponse
        +verifyMfa(tenantId, MfaVerifyRequest) AuthResponse
        +getCurrentUser(userId, tenantId) UserInfo
    }

    class AuthServiceImpl {
        -identityProvider: IdentityProvider
        -tokenService: TokenService
        -redisTemplate: StringRedisTemplate
        -seatValidationService: SeatValidationService
        -licenseServiceClient: LicenseServiceClient
        +login(tenantId, request) AuthResponse
        +loginWithGoogle(tenantId, request) AuthResponse
        +loginWithMicrosoft(tenantId, request) AuthResponse
        +refreshToken(tenantId, request) AuthResponse
        +logout(tenantId, request, accessToken) void
        +setupMfa(userId, tenantId, request) MfaSetupResponse
        +verifyMfa(tenantId, request) AuthResponse
        -storePendingTokens(mfaSessionToken, accessToken, refreshToken) void
        -retrievePendingTokens(mfaSessionToken) String[]
        -fetchTenantFeatures(tenantId) List~String~
    }

    class TokenService {
        <<interface>>
        +parseToken(token) Claims
        +extractUserInfo(claims) UserInfo
        +isBlacklisted(jti) boolean
        +blacklistToken(jti, expirationTimeSeconds) void
        +createMfaSessionToken(userId, tenantId) String
        +validateMfaSessionToken(token) String
        +invalidateMfaSession(token) void
    }

    class TokenServiceImpl {
        -redisTemplate: StringRedisTemplate
        -blacklistPrefix: String
        -mfaSessionPrefix: String
        -mfaSessionTtlMinutes: long
        -mfaSigningKey: SecretKey
    }

    class SeatValidationService {
        -licenseServiceClient: LicenseServiceClient
        +validateUserSeat(tenantId, userId) void
        -validateSeatFallback(tenantId, userId, ex) void
    }

    AuthService <|.. AuthServiceImpl
    TokenService <|.. TokenServiceImpl
    AuthServiceImpl --> TokenService
    AuthServiceImpl --> SeatValidationService
    AuthServiceImpl --> IdentityProvider
```

**Evidence:** `AuthServiceImpl.java` lines 33-39 show constructor injection of `IdentityProvider`, `TokenService`, `StringRedisTemplate`, `SeatValidationService`, and `LicenseServiceClient`.

### 3.2 Identity Provider Strategy Pattern [IMPLEMENTED]

```mermaid
classDiagram
    class IdentityProvider {
        <<interface>>
        +authenticate(realm, identifier, password) AuthResponse
        +refreshToken(realm, refreshToken) AuthResponse
        +logout(realm, refreshToken) void
        +exchangeToken(realm, token, providerHint) AuthResponse
        +initiateLogin(realm, providerHint, redirectUri) LoginInitiationResponse
        +setupMfa(realm, userId) MfaSetupResponse
        +verifyMfaCode(realm, userId, code) boolean
        +isMfaEnabled(realm, userId) boolean
        +getEvents(realm, query) List~AuthEventDTO~
        +getEventCount(realm, query) long
        +supports(providerType) boolean
        +getProviderType() String
    }

    class KeycloakIdentityProvider {
        -keycloakConfig: KeycloakConfig
        -principalExtractor: PrincipalExtractor
        -restTemplate: RestTemplate
        -secretGenerator: SecretGenerator
        -qrGenerator: QrGenerator
        -recoveryCodeGenerator: RecoveryCodeGenerator
        +authenticate(realm, identifier, password) AuthResponse
        +exchangeToken(realm, token, providerHint) AuthResponse
        +initiateLogin(realm, providerHint, redirectUri) LoginInitiationResponse
        -executeTokenRequest(realm, params) ResponseEntity
        -parseTokenResponse(responseBody) AuthResponse
        -getAdminClient() Keycloak
        -determineTokenType(providerHint) String
    }

    class Auth0IdentityProvider {
        <<PLANNED>>
    }

    class OktaIdentityProvider {
        <<PLANNED>>
    }

    IdentityProvider <|.. KeycloakIdentityProvider : implements
    IdentityProvider <|.. Auth0IdentityProvider : planned
    IdentityProvider <|.. OktaIdentityProvider : planned

    note for KeycloakIdentityProvider "@ConditionalOnProperty(\n  name='auth.facade.provider',\n  havingValue='keycloak',\n  matchIfMissing=true)"
```

**Evidence:**
- Interface: `IdentityProvider.java` -- 12 methods defined (lines 18-92)
- Keycloak: `KeycloakIdentityProvider.java` line 56 -- `@ConditionalOnProperty(name = "auth.facade.provider", havingValue = "keycloak", matchIfMissing = true)`
- Auth0/Okta/Azure AD: No implementation files exist -- [PLANNED]

### 3.3 Realm Resolution [IMPLEMENTED]

```mermaid
graph TD
    A[tenantId input] --> B{Is master tenant?}
    B -->|"master" or MASTER_TENANT_UUID or "tenant-master"| C["master" realm]
    B -->|No| D{Starts with 'tenant-'?}
    D -->|Yes| E[Return as-is]
    D -->|No| F["tenant-" + tenantId]
```

**Evidence:** `RealmResolver.java` lines 39-54. Master tenant UUID is `68cd2a56-98c9-4ed4-8534-c299566d5b27` (line 23).

---

## 4. Filter Chain Design

### 4.1 auth-facade Servlet Filter Order [IMPLEMENTED]

```mermaid
sequenceDiagram
    participant Client
    participant TCF as TenantContextFilter<br/>@Order(1)
    participant RLF as RateLimitFilter<br/>@Order(2)
    participant JVF as JwtValidationFilter<br/>@Order(3)
    participant SC as SecurityFilterChain
    participant Controller

    Client->>TCF: HTTP Request
    TCF->>TCF: Extract X-Tenant-ID header
    TCF->>TCF: Set ThreadLocal CURRENT_TENANT
    TCF->>RLF: doFilter()
    RLF->>RLF: Build key: {cachePrefix}{tenantId}:{ip}
    RLF->>RLF: Increment counter in Valkey
    alt Rate limit exceeded
        RLF-->>Client: 429 Too Many Requests + Retry-After header
    end
    RLF->>RLF: Set X-RateLimit-* headers
    RLF->>JVF: doFilter()
    alt Public endpoint (login, refresh, logout, providers, etc.)
        JVF->>JVF: shouldNotFilter() = true, skip
    else Authenticated endpoint
        JVF->>JVF: Extract Bearer token
        JVF->>JVF: Resolve realm via RealmResolver
        JVF->>JVF: Validate JWT (JWKS from Keycloak)
        JVF->>JVF: Check blacklist via TokenService
        JVF->>JVF: Extract UserInfo, set SecurityContext
    end
    JVF->>SC: doFilter()
    SC->>Controller: Dispatch to controller
    Controller-->>Client: Response
```

**Evidence:**
- `TenantContextFilter.java` line 16: `@Order(1)`
- `RateLimitFilter.java` line 28: `@Order(2)`
- `JwtValidationFilter.java` line 34: `@Order(3)`

### 4.2 JwtValidationFilter Skip Paths [IMPLEMENTED]

The filter skips these paths (verified from `JwtValidationFilter.java` lines 112-127):

| Path | Reason |
|------|--------|
| `/actuator/**` | Health checks |
| `/swagger/**`, `/api-docs/**`, `/v3/api-docs/**` | API documentation |
| `/api/v1/auth/login` | Login endpoint |
| `/api/v1/auth/login/**` | Dynamic provider selection |
| `/api/v1/auth/providers` | List available providers |
| `/api/v1/auth/social/**` | Social login (Google, Microsoft) |
| `/api/v1/auth/refresh` | Token refresh |
| `/api/v1/auth/logout` | Logout |
| `/api/v1/auth/mfa/verify` | MFA verification |

### 4.3 RateLimitFilter Behavior [IMPLEMENTED]

| Property | Value | Source |
|----------|-------|--------|
| Window | 60 seconds | `RateLimitFilter.java` line 62 |
| Default limit | 100 requests/minute | `@Value("${rate-limit.requests-per-minute:100}")` |
| Key pattern | `auth:rate:{tenantId}:{ip}` or `auth:rate:{ip}` | `getClientIdentifier()` lines 91-103 |
| Backed by | Valkey via `StringRedisTemplate` | Line 6 |
| Failure mode | Allow request (fail-open) | Lines 84-88 |
| Response headers | `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset` | Lines 72-74 |

---

## 5. Security Configuration

### 5.1 DynamicBrokerSecurityConfig -- 5 Filter Chains [IMPLEMENTED]

```mermaid
graph TD
    REQ[Incoming Request] --> C1{Matches /api/v1/admin/**?}
    C1 -->|Yes| CH1["Chain 1 - @Order(1)<br/>Admin Management API<br/>JWT + ADMIN/SUPER_ADMIN roles"]
    C1 -->|No| C2{Matches public auth paths?}
    C2 -->|Yes| CH2["Chain 2 - @Order(2)<br/>Public Auth Endpoints<br/>permitAll, no oauth2"]
    C2 -->|No| C3{Matches /api/v1/auth/oauth2/**?}
    C3 -->|Yes| CH3["Chain 3 - @Order(3)<br/>OAuth2 SSO Flow<br/>oauth2Login, redirect-based<br/>@ConditionalOnBean(ClientRegistrationRepository)"]
    C3 -->|No| C4{Matches /api/v1/auth/**?}
    C4 -->|Yes| CH4["Chain 4 - @Order(4)<br/>Authenticated Auth Endpoints<br/>JWT required (/me, /mfa/setup)"]
    C4 -->|No| CH5["Chain 5 - @Order(5)<br/>Default Security<br/>Actuator/Swagger permitAll<br/>Everything else authenticated"]
```

**Evidence:** `DynamicBrokerSecurityConfig.java`:

| Chain | Order | Matcher | Auth Mode | Key Roles |
|-------|-------|---------|-----------|-----------|
| 1 -- Admin | `@Order(1)` | `/api/v1/admin/**` | `oauth2ResourceServer` JWT | `ADMIN`, `SUPER_ADMIN` |
| 2 -- Public Auth | `@Order(2)` | `/api/v1/auth/login`, `/refresh`, `/logout`, `/providers/**`, `/social/**`, `/mfa/verify` | None -- `permitAll()` | None |
| 3 -- OAuth2 SSO | `@Order(3)` | `/api/v1/auth/oauth2/**` | `oauth2Login` redirect flow | None (conditional) |
| 4 -- Authenticated Auth | `@Order(4)` | `/api/v1/auth/**` (remainder) | `oauth2ResourceServer` JWT | Any authenticated |
| 5 -- Default | `@Order(5)` | Everything else | `oauth2ResourceServer` JWT | Authenticated (actuator/swagger exempt) |

All 5 chains share:
- CSRF disabled
- CORS disabled (handled by API Gateway)
- `SessionCreationPolicy.STATELESS`
- Security headers: HSTS (1 year, include subdomains), X-Frame-Options DENY, Content-Type-Options, Referrer-Policy STRICT_ORIGIN_WHEN_CROSS_ORIGIN, CSP `default-src 'self'; frame-ancestors 'none'`

**Critical design note:** Chain 2 deliberately omits `oauth2ResourceServer` and `oauth2Login` to prevent their authentication entry points from intercepting unauthenticated requests to public paths (see `DynamicBrokerSecurityConfig.java` lines 30-32).

### 5.2 API Gateway Security [IMPLEMENTED]

```mermaid
graph LR
    REQ[Request] --> TBF[TokenBlacklistFilter<br/>order -200]
    TBF --> TCF[TenantContextFilter<br/>order -100]
    TCF --> SEC[SecurityWebFilterChain]
    SEC --> ROUTE[RouteConfig]
    ROUTE --> SERVICE[Downstream Service]
```

**Gateway SecurityConfig** (`api-gateway/SecurityConfig.java`):

| Path Pattern | Access |
|-------------|--------|
| `/api/tenants/resolve`, `/api/tenants/validate/**` | permitAll |
| `/api/v1/auth/login`, `/login/**`, `/providers`, `/social/**`, `/refresh`, `/logout`, `/mfa/verify` | permitAll |
| `/api/v1/auth/password/reset`, `/password/reset/confirm` | permitAll |
| `/actuator/health`, `/actuator/health/**` | permitAll |
| `/services/*/health` | permitAll |
| `/api/v1/internal/**` | **denyAll** |
| `/api/v1/admin/**` | `hasAnyRole("ADMIN", "SUPER_ADMIN")` |
| `/api/v1/tenants/*/seats/**` | `hasAnyRole("TENANT_ADMIN", "ADMIN", "SUPER_ADMIN")` |
| Everything else | authenticated |

**Evidence:** `SecurityConfig.java` lines 44-67.

Gateway security headers (lines 72-85):
- HSTS: 1 year, include subdomains
- X-Frame-Options: DENY
- Content-Type-Options: nosniff
- Referrer-Policy: STRICT_ORIGIN_WHEN_CROSS_ORIGIN
- CSP: `default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; frame-ancestors 'none'`
- Permissions-Policy: `camera=(), microphone=(), geolocation=()`

### 5.3 Gateway Global Filters [IMPLEMENTED]

#### TokenBlacklistFilter (`api-gateway/filter/TokenBlacklistFilter.java`)

| Property | Value |
|----------|-------|
| Order | `-200` (runs before TenantContextFilter) |
| Type | `GlobalFilter` (reactive) |
| Backend | `ReactiveStringRedisTemplate` |
| Key pattern | `auth:blacklist:{jti}` |
| JTI extraction | Base64-decode JWT payload, read `jti` claim |
| Reject response | `401 {"error":"token_revoked","message":"Token has been revoked"}` |

#### TenantContextFilter (`api-gateway/filter/TenantContextFilter.java`)

| Property | Value |
|----------|-------|
| Order | `-100` |
| Type | `GlobalFilter` (reactive) |
| Validates | X-Tenant-ID is a valid UUID |
| Cross-validates | X-Tenant-ID header against JWT `tenant_id` claim |
| Generates | `X-Request-ID` (UUID) if not present |
| Rejects | `400` for invalid UUID, `403` for tenant mismatch |

**Evidence:** `TenantContextFilter.java` lines 46-48 validate UUID format; lines 53-58 cross-validate header vs JWT claim.

---

## 6. Frontend Architecture

### 6.1 Angular Auth Layer Class Diagram [IMPLEMENTED]

```mermaid
classDiagram
    class AuthFacade {
        <<abstract>>
        +isAuthenticated: Signal~boolean~
        +message: Signal~string | null~
        +login(credentials: LoginCredentials) Observable~LoginResponse~
        +logout() Observable~void~
        +logoutLocal(redirectReason?) void
        +getAccessToken() string | null
        +getRefreshToken() string | null
    }

    class GatewayAuthFacadeService {
        -messageState: WritableSignal~string | null~
        -api: ApiGatewayService
        -session: SessionService
        -tenantContext: TenantContextService
        -router: Router
        +login(credentials) Observable~LoginResponse~
        +logout() Observable~void~
        +logoutLocal(redirectReason) void
        +getAccessToken() string | null
        +getRefreshToken() string | null
    }

    class SessionService {
        -accessTokenState: WritableSignal~string | null~
        -refreshTokenState: WritableSignal~string | null~
        +accessToken: Signal~string | null~
        +refreshToken: Signal~string | null~
        +isAuthenticated: Signal~boolean~
        +setTokens(accessToken, refreshToken, rememberMe) void
        +clearTokens() void
        +isPersistentSession() boolean
        +getAccessTokenClaims() Record | null
        +getUserId() string | null
    }

    class TenantContextService {
        -tenantIdState: WritableSignal~string | null~
        -tenantNameState: WritableSignal~string~
        -resolvedState: WritableSignal~boolean~
        +tenantId: Signal~string | null~
        +tenantName: Signal~string~
        +resolved: Signal~boolean~
        +bootstrap() Promise~void~
        +setTenantFromInput(input: string) boolean
        -normalizeTenantId(value) string | null
    }

    class LoginCredentials {
        <<interface>>
        +identifier: string
        +password: string
        +tenantId: string
        +rememberMe: boolean
    }

    AuthFacade <|-- GatewayAuthFacadeService
    GatewayAuthFacadeService --> SessionService
    GatewayAuthFacadeService --> TenantContextService
    GatewayAuthFacadeService ..> LoginCredentials
```

**Evidence:**
- `auth-facade.ts` lines 1-21 -- abstract class with Signal-based properties
- `gateway-auth-facade.service.ts` lines 13-96 -- concrete implementation
- `session.service.ts` lines 1-102 -- signal-based token state with localStorage/sessionStorage
- `tenant-context.service.ts` lines 1-85 -- UUID validation, alias mapping, tenant resolution

### 6.2 Token Storage Strategy [IMPLEMENTED]

```mermaid
graph TD
    A[setTokens called] --> B{rememberMe?}
    B -->|true| C[localStorage.setItem]
    B -->|false| D[sessionStorage.setItem]
    E[readToken called] --> F[sessionStorage.getItem]
    F -->|null| G[localStorage.getItem]
    F -->|found| H[Return token]
    G --> H
```

**Evidence:** `SessionService` lines 58-76. Storage keys are `tp_access_token` and `tp_refresh_token` (lines 3-4).

### 6.3 Route Protection -- authGuard [IMPLEMENTED]

```typescript
// auth.guard.ts -- Functional guard using inject()
export const authGuard: CanActivateFn = (_route, state) => {
  const session = inject(SessionService);
  const router = inject(Router);
  if (session.isAuthenticated()) return true;
  return router.createUrlTree(['/auth/login'], {
    queryParams: { returnUrl: state.url },
  });
};
```

**Evidence:** `auth.guard.ts` lines 1-16. Uses `SessionService.isAuthenticated()` which is `computed(() => Boolean(accessTokenState()))`.

### 6.4 HTTP Interceptor Pipeline [IMPLEMENTED]

```mermaid
sequenceDiagram
    participant Component
    participant AuthInt as authInterceptor
    participant TenantInt as tenantHeaderInterceptor
    participant HTTP as HttpClient
    participant API as API Gateway

    Component->>AuthInt: HTTP Request
    AuthInt->>AuthInt: Is /api/ request?
    alt Not API or public endpoint
        AuthInt->>HTTP: Pass through unchanged
    else API request
        AuthInt->>AuthInt: Clone request with<br/>Authorization: Bearer {token}<br/>X-Tenant-ID: {tenantId}
        AuthInt->>HTTP: Send modified request
    end
    HTTP->>API: HTTP Request
    API-->>HTTP: Response
    alt 401 Unauthorized
        AuthInt->>AuthInt: Has refresh token?
        alt No refresh token
            AuthInt->>AuthInt: forceLogout() -> /auth/login?reason=session_expired
        else First 401 (not already refreshing)
            AuthInt->>API: POST /api/v1/auth/refresh
            alt Refresh successful
                AuthInt->>AuthInt: Update tokens in SessionService
                AuthInt->>HTTP: Retry original request with new token
            else Refresh failed
                AuthInt->>AuthInt: forceLogout()
            end
        else Already refreshing
            AuthInt->>AuthInt: Queue request
            AuthInt->>AuthInt: Wait for refresh to complete
            AuthInt->>HTTP: Retry with new token
        end
    end
```

**Evidence:** `auth.interceptor.ts` lines 17-145. Key implementation details:
- Module-level `isRefreshing` flag prevents concurrent refreshes (line 14)
- `BehaviorSubject<boolean>` (`refreshCompleted$`) queues requests during refresh (line 15)
- Public endpoint detection in `isPublicEndpoint()` function (lines 135-144)

### 6.5 Tenant Context Resolution [IMPLEMENTED]

```mermaid
sequenceDiagram
    participant App as APP_INITIALIZER
    participant TCS as TenantContextService
    participant API as ApiGatewayService
    participant GW as API Gateway

    App->>TCS: bootstrap()
    TCS->>API: resolveTenant()
    API->>GW: GET /api/tenants/resolve
    GW-->>API: TenantResolveResponse
    API-->>TCS: { tenant: { uuid, shortName } }
    TCS->>TCS: normalizeTenantId(uuid)
    TCS->>TCS: Set tenantIdState signal
    TCS->>TCS: Set resolvedState = true
```

**Evidence:** `TenantContextService.bootstrap()` lines 22-32. The `normalizeTenantId` method (lines 60-79) validates UUID format and supports alias mapping via `environment.tenantAliasMap`.

---

## 7. Integration Points

### 7.1 auth-facade to Keycloak [IMPLEMENTED]

```mermaid
sequenceDiagram
    participant AF as auth-facade
    participant KC as Keycloak

    Note over AF,KC: Login Flow (Direct Access Grant)
    AF->>KC: POST /realms/{realm}/protocol/openid-connect/token<br/>grant_type=password&username=...&password=...
    KC-->>AF: { access_token, refresh_token, expires_in }

    Note over AF,KC: Token Refresh
    AF->>KC: POST /realms/{realm}/protocol/openid-connect/token<br/>grant_type=refresh_token&refresh_token=...
    KC-->>AF: { access_token, refresh_token, expires_in }

    Note over AF,KC: Social Token Exchange (RFC 8693)
    AF->>KC: POST /realms/{realm}/protocol/openid-connect/token<br/>grant_type=urn:ietf:params:oauth:grant-type:token-exchange<br/>subject_token=...&subject_issuer=google
    KC-->>AF: { access_token, refresh_token, expires_in }

    Note over AF,KC: Logout
    AF->>KC: POST /realms/{realm}/protocol/openid-connect/logout<br/>refresh_token=...
    KC-->>AF: 204

    Note over AF,KC: JWKS Fetch (for JWT validation)
    AF->>KC: GET /realms/{realm}/protocol/openid-connect/certs
    KC-->>AF: { keys: [{ kid, kty, n, e, ... }] }

    Note over AF,KC: Admin API (MFA, User Management)
    AF->>KC: Keycloak Admin Client<br/>realm={masterRealm}, clientId=admin-cli
    KC-->>AF: UserRepresentation, EventRepresentation
```

**Evidence:**
- Token endpoint construction: `KeycloakConfig.getTokenEndpoint()` line 34
- JWKS endpoint: `KeycloakConfig.getJwksUri()` line 47
- Token exchange: `KeycloakIdentityProvider.exchangeToken()` lines 147-172, uses `urn:ietf:params:oauth:grant-type:token-exchange`
- Admin client: `KeycloakIdentityProvider.getAdminClient()` lines 382-389

### 7.2 auth-facade to license-service (Feign) [IMPLEMENTED]

```mermaid
sequenceDiagram
    participant ASI as AuthServiceImpl
    participant SVS as SeatValidationService
    participant LSC as LicenseServiceClient<br/>(Feign)
    participant LS as license-service

    ASI->>SVS: validateUserSeat(tenantId, userId)
    Note over SVS: @CircuitBreaker(name="licenseService")
    SVS->>LSC: validateSeat(tenantId, userUuid)
    LSC->>LS: GET /api/v1/internal/seats/validate?tenantId=...&userId=...
    alt Seat valid
        LS-->>LSC: { valid: true, tenantLicenseId, tier }
        LSC-->>SVS: SeatValidationResponse
        SVS-->>ASI: return (no exception)
    else Seat invalid
        LS-->>LSC: { valid: false }
        SVS-->>ASI: throw NoActiveSeatException
    end

    Note over ASI: Also fetches tenant features
    ASI->>LSC: getUserFeatures(tenantId)
    LSC->>LS: GET /api/v1/internal/features/tenant<br/>X-Tenant-ID: {tenantId}
    LS-->>LSC: ["feature1", "feature2"]
    LSC-->>ASI: List~String~
```

**Evidence:**
- `LicenseServiceClient.java` lines 15-36 -- `@FeignClient(name = "license-service", fallbackFactory = ...)`
- `SeatValidationService.java` line 32 -- `@CircuitBreaker(name = "licenseService", fallbackMethod = "validateSeatFallback")`
- Master tenant bypass: `AuthServiceImpl.java` line 52 -- `if (!RealmResolver.isMasterTenant(tenantId))`
- Feature fetch: `AuthServiceImpl.java` lines 252-261

### 7.3 auth-facade to Valkey [IMPLEMENTED]

| Operation | Key Pattern | TTL | Evidence |
|-----------|------------|-----|----------|
| Token blacklist | `auth:blacklist:{jti}` | Remaining JWT lifetime (min 60s) | `TokenServiceImpl.java` lines 91-103 |
| MFA session | `auth:mfa:{sessionId}` | 5 minutes (configurable) | `TokenServiceImpl.java` lines 106-128 |
| MFA pending tokens | `auth:mfa:pending:{hash}` | 5 minutes | `AuthServiceImpl.java` lines 203-206 |
| Rate limit counter | `auth:rate:{tenantId}:{ip}` | 60 seconds | `RateLimitFilter.java` lines 50-62 |
| Gateway blacklist check | `auth:blacklist:{jti}` | (reads same keys) | `TokenBlacklistFilter.java` lines 52-53 |

### 7.4 Gateway Route Configuration [IMPLEMENTED]

```mermaid
graph LR
    subgraph Routes["API Gateway Routes (RouteConfig.java)"]
        R1["/api/v1/auth/**"] -->|lb://AUTH-FACADE| AF[auth-facade:8081]
        R2["/api/v1/admin/**"] -->|lb://AUTH-FACADE| AF
        R3["/api/v1/events/**"] -->|lb://AUTH-FACADE| AF
        R4["/api/v1/admin/licenses/**"] -->|lb://LICENSE-SERVICE| LS[license-service:8085]
        R5["/api/v1/tenants/*/seats/**"] -->|lb://LICENSE-SERVICE| LS
        R6["/api/tenants/**"] -->|lb://TENANT-SERVICE| TS[tenant-service:8082]
        R7["/api/v1/users/**"] -->|lb://USER-SERVICE| US[user-service:8083]
        R8["/api/v1/notifications/**"] -->|lb://NOTIFICATION-SERVICE| NS[notification-service:8086]
        R9["/api/v1/audit/**"] -->|lb://AUDIT-SERVICE| AS[audit-service:8087]
        R10["/api/v1/definitions/**"] -->|lb://DEFINITION-SERVICE| DS[definition-service:8090]
    end
```

**Evidence:** `RouteConfig.java` lines 20-114. Uses `lb://` prefix for Eureka service discovery. Note: `@Profile("!docker")` on line 17 -- a separate configuration exists for Docker profile.

---

## 8. Error Handling

### 8.1 GlobalExceptionHandler Mapping [IMPLEMENTED]

All exception handling is centralized in `GlobalExceptionHandler.java` (`@RestControllerAdvice`).

| Exception | HTTP Status | Error Code | Evidence (line) |
|-----------|-------------|------------|-----------------|
| `InvalidCredentialsException` | 401 | `invalid_credentials` | 28 |
| `TokenExpiredException` | 401 | `token_expired` | 35 |
| `InvalidTokenException` | 401 | `invalid_token` | 42 |
| `AuthenticationException` | 401 or 503 | varies | 49 (503 if `auth_provider_unavailable`) |
| `AccessDeniedException` | 403 | `access_denied` | 58 |
| `MfaRequiredException` | 403 | `mfa_required` | 66 |
| `AccountLockedException` | 403 | `account_locked` | 72 |
| `NoActiveSeatException` | 403 | `no_active_seat` | 79 |
| `RateLimitExceededException` | 429 | `rate_limit_exceeded` | 87 |
| `TenantNotFoundException` | 404 | `tenant_not_found` | 94 |
| `ProviderNotFoundException` | 404 | `provider_not_found` | 101 |
| `UserNotFoundException` | 404 | `user_not_found` | 108 |
| `ProviderAlreadyExistsException` | 409 | `provider_exists` | 116 |
| `MissingRequestHeaderException` | 400 | `missing_header` | 122 |
| `MethodArgumentNotValidException` | 400 | `validation_error` | 131 |
| `ConstraintViolationException` | 400 | `validation_error` | 143 |
| `IllegalStateException` | 400 | `invalid_operation` | 150 |
| `Exception` (catch-all) | 500 | `internal_error` | 157 |

### 8.2 Error Response Format [IMPLEMENTED]

```json
{
  "error": "string (error code)",
  "message": "string (human-readable)",
  "details": { "field": "validation message" },
  "timestamp": "2026-03-12T10:00:00Z"
}
```

**Evidence:** `GlobalExceptionHandler.ErrorResponse` record at lines 164-177.

MFA-specific response:

```json
{
  "error": "mfa_required",
  "message": "MFA verification required",
  "mfaSessionToken": "eyJ..."
}
```

**Evidence:** `GlobalExceptionHandler.MfaRequiredResponse` record at lines 179-183.

### 8.3 Gateway Error Responses [IMPLEMENTED]

| Filter | Error | HTTP Status | Response Body |
|--------|-------|-------------|---------------|
| `TokenBlacklistFilter` | Revoked token | 401 | `{"error":"token_revoked","message":"Token has been revoked"}` |
| `TenantContextFilter` | Invalid UUID | 400 | `{"error":"invalid_tenant_id","message":"X-Tenant-ID must be a valid UUID"}` |
| `TenantContextFilter` | JWT/header mismatch | 403 | `{"error":"tenant_mismatch","message":"X-Tenant-ID does not match JWT tenant_id claim"}` |

---

## 9. Configuration Management

### 9.1 AuthProperties Configuration [IMPLEMENTED]

Bound to prefix `auth.facade` via `@ConfigurationProperties`:

| Property | Type | Default | Purpose |
|----------|------|---------|---------|
| `provider` | String | `"keycloak"` | Active IdP type |
| `role-claim-paths` | List\<String\> | `[roles, groups, realm_access.roles, resource_access, permissions]` | JWT claim paths for role extraction |
| `user-claim-mappings.user-id` | String | `"sub"` | JWT claim for user ID |
| `user-claim-mappings.email` | String | `"email"` | JWT claim for email |
| `user-claim-mappings.first-name` | String | `"given_name"` | JWT claim for first name |
| `user-claim-mappings.last-name` | String | `"family_name"` | JWT claim for last name |
| `user-claim-mappings.tenant-id` | String | `"tenant_id"` | JWT claim for tenant |
| `tenant-resolution` | String | `"header"` | How tenant is resolved |
| `tenant-header` | String | `"X-Tenant-ID"` | Header name for tenant |
| `tenant-claim` | String | `"tenant_id"` | JWT claim for tenant |
| `token.mfa-session-expiration-minutes` | int | `5` | MFA session TTL |
| `token.mfa-pending-prefix` | String | `"auth:mfa:pending:"` | Valkey key prefix |

**Evidence:** `AuthProperties.java` lines 41-137.

### 9.2 KeycloakConfig [IMPLEMENTED]

Bound to prefix `keycloak`:

| Property | Purpose |
|----------|---------|
| `server-url` | Keycloak base URL |
| `master-realm` | Master realm name (default: `"master"`) |
| `admin.username` | Admin CLI username |
| `admin.password` | Admin CLI password |
| `admin.client-id` | Admin client (default: `"admin-cli"`) |
| `client.client-id` | Application client ID |
| `client.client-secret` | Application client secret |

Endpoint derivation methods:
- `getTokenEndpoint(realm)` -> `{serverUrl}/realms/{realm}/protocol/openid-connect/token`
- `getLogoutEndpoint(realm)` -> `{serverUrl}/realms/{realm}/protocol/openid-connect/logout`
- `getJwksUri(realm)` -> `{serverUrl}/realms/{realm}/protocol/openid-connect/certs`
- `getUserInfoEndpoint(realm)` -> `{serverUrl}/realms/{realm}/protocol/openid-connect/userinfo`

**Evidence:** `KeycloakConfig.java` lines 1-49.

### 9.3 Token Service Configuration [IMPLEMENTED]

| Property | Default | Evidence |
|----------|---------|----------|
| `token.blacklist.prefix` | `auth:blacklist:` | `TokenServiceImpl.java` line 36 |
| `token.mfa-session.prefix` | `auth:mfa:` | `TokenServiceImpl.java` line 37 |
| `token.mfa-session.ttl-minutes` | `5` | `TokenServiceImpl.java` line 38 |
| `token.mfa-signing-key` | (required, no default) | `TokenServiceImpl.java` line 39 |
| `rate-limit.requests-per-minute` | `100` | `RateLimitFilter.java` line 33 |
| `rate-limit.cache-prefix` | `auth:rate:` | `RateLimitFilter.java` line 36 |

---

## 10. Deployment Considerations

### 10.1 Service Dependencies

```mermaid
graph TD
    AF[auth-facade] --> KC[Keycloak 24]
    AF --> VK[Valkey 8]
    AF --> N4J["Neo4j Community 5.12"]
    AF --> EU[Eureka Server]
    AF -->|Feign| LS[license-service]

    GW[api-gateway] --> VK
    GW --> EU
    GW -->|Routes to| AF
    GW -->|Routes to| LS
    GW -->|Routes to| TS[tenant-service]
    GW -->|Routes to| US[user-service]
    GW -->|Routes to| NS[notification-service]
    GW -->|Routes to| AS[audit-service]
    GW -->|Routes to| DS[definition-service]
```

### 10.2 Infrastructure Components [IMPLEMENTED]

| Component | Image | Port |
|-----------|-------|------|
| Keycloak | `keycloak:24.0` | 8180 |
| Valkey | `valkey/valkey:8-alpine` | 6379 |
| Neo4j | `neo4j:5.12.0-community` | 7474/7687 |
| PostgreSQL | `postgres:16-alpine` | 5432 |
| Kafka | `confluentinc/cp-kafka:7.5.0` | 9092 |

### 10.3 Stateless Design

Both `auth-facade` and `api-gateway` are stateless:
- All session state is in Valkey (token blacklist, MFA sessions, rate limit counters)
- JWT tokens are self-contained; validation uses cached JWKS keys (1-hour TTL)
- No HTTP sessions (`SessionCreationPolicy.STATELESS` on all chains)
- Horizontal scaling is supported without sticky sessions

### 10.4 Known Limitations and Planned Work

| Item | Status | Notes |
|------|--------|-------|
| Auth0 / Okta / Azure AD providers | [PLANNED] | `IdentityProvider` interface exists; no implementations beyond Keycloak |
| Graph-per-tenant isolation (ADR-003) | [PLANNED] | Currently uses `tenant_id` column discrimination |
| Service merge (ADR-006, license into auth-facade) | [PLANNED] | `license-service` remains a separate service |
| Kafka event publishing | [PLANNED] | No `KafkaTemplate` usage in auth-facade |
| Caffeine L1 cache | [PLANNED] | Only Valkey is used; no two-tier caching |
| Neo4j Enterprise | [PLANNED] | Currently using Community edition |

---

## Appendix A: Complete API Endpoint Catalog

### AuthController (`/api/v1/auth`)

| Method | Path | Auth Required | Description |
|--------|------|---------------|-------------|
| POST | `/login` | No | Login with credentials |
| POST | `/social/google` | No | Google One Tap login |
| POST | `/social/microsoft` | No | Microsoft MSAL login |
| GET | `/login/{provider}` | No | Initiate IdP login (redirect flow) |
| GET | `/providers` | No (X-Tenant-ID optional) | List available providers |
| POST | `/refresh` | No | Refresh access token |
| POST | `/logout` | No | Logout and invalidate tokens |
| POST | `/mfa/setup` | Yes (Bearer JWT) | Initialize TOTP MFA setup |
| POST | `/mfa/verify` | No | Verify TOTP code |
| GET | `/me` | Yes (Bearer JWT) | Get current user profile |

### AdminProviderController (`/api/v1/admin/tenants/{tenantId}/providers`)

| Method | Path | Auth Required | Description |
|--------|------|---------------|-------------|
| GET | `/` | ADMIN / SUPER_ADMIN | List providers for tenant |
| POST | `/` | ADMIN / SUPER_ADMIN | Register new IdP |
| PUT | `/{providerId}` | ADMIN / SUPER_ADMIN | Update provider |
| DELETE | `/{providerId}` | ADMIN / SUPER_ADMIN | Delete provider |

---

## Appendix B: JWT Validation Flow Detail

```mermaid
sequenceDiagram
    participant JVF as JwtValidationFilter
    participant JTV as JwtTokenValidator
    participant KC as Keycloak JWKS
    participant VK as Valkey

    JVF->>JVF: Extract Bearer token from Authorization header
    JVF->>JVF: Get tenantId from TenantContextFilter.getCurrentTenant()
    JVF->>JVF: RealmResolver.resolve(tenantId) -> realm name

    JVF->>JTV: validateToken(token, realm)
    JTV->>JTV: extractKeyId(token) -- decode JWT header, get "kid"
    JTV->>JTV: getPublicKey(realm, keyId)
    alt Cache miss or expired (TTL: 1 hour)
        JTV->>KC: GET /realms/{realm}/protocol/openid-connect/certs
        KC-->>JTV: JWKS JSON
        JTV->>JTV: Parse RSA public keys, store in ConcurrentHashMap
    end
    JTV->>JTV: Verify RS256 signature with PublicKey
    JTV->>JTV: Check exp claim
    JTV-->>JVF: Claims object

    JVF->>JTV: getJti(claims)
    JVF->>VK: hasKey("auth:blacklist:{jti}")
    alt Blacklisted
        JVF-->>JVF: sendUnauthorizedResponse("Token has been revoked")
    end

    JVF->>JTV: extractUserInfo(claims)
    Note over JTV: Extracts: sub, email, given_name,<br/>family_name, tenant_id (or tenantId),<br/>realm_access.roles
    JTV-->>JVF: UserInfo record

    JVF->>JVF: extractAuthorities(claims) using roleClaimPaths
    JVF->>JVF: Set SecurityContext with UsernamePasswordAuthenticationToken
    JVF->>JVF: Set ThreadLocal CURRENT_USER
```

**Evidence:**
- JWKS cache: `JwtTokenValidator.java` -- `ConcurrentHashMap` at line 32, TTL 3600000ms at line 34
- RSA key construction: `createRsaPublicKey()` at lines 203-213
- UserInfo extraction: `extractUserInfo()` at lines 57-86, checks both `tenant_id` and `tenantId` claims (lines 65-69)
- Authority extraction: `JwtValidationFilter.extractAuthorities()` at lines 151-166, iterates `authProperties.getRoleClaimPaths()`

---

## Appendix C: Login Sequence (Full End-to-End)

```mermaid
sequenceDiagram
    participant User
    participant FE as Angular Frontend
    participant GW as API Gateway
    participant AF as auth-facade
    participant KC as Keycloak
    participant VK as Valkey
    participant LS as license-service

    User->>FE: Enter credentials + tenant ID
    FE->>FE: TenantContextService.setTenantFromInput(tenantId)
    FE->>FE: Validate UUID format
    FE->>GW: POST /api/v1/auth/login<br/>X-Tenant-ID: {uuid}<br/>{ identifier, password }

    GW->>GW: TokenBlacklistFilter: no token, skip
    GW->>GW: TenantContextFilter: validate UUID, add X-Request-ID
    GW->>GW: SecurityConfig: /api/v1/auth/login = permitAll
    GW->>AF: Forward request (lb://AUTH-FACADE)

    AF->>AF: TenantContextFilter: set ThreadLocal
    AF->>AF: RateLimitFilter: increment counter in Valkey
    AF->>AF: JwtValidationFilter: shouldNotFilter(/login) = true, skip
    AF->>AF: DynamicBrokerSecurityConfig Chain 2: permitAll

    AF->>AF: AuthController.login()
    AF->>AF: AuthServiceImpl.login()
    AF->>AF: RealmResolver.resolve(tenantId) -> realm

    AF->>KC: POST /realms/{realm}/protocol/openid-connect/token<br/>grant_type=password
    KC-->>AF: { access_token, refresh_token, expires_in }
    AF->>AF: Parse token, extract UserInfo via PrincipalExtractor

    alt Not master tenant
        AF->>LS: GET /api/v1/internal/seats/validate?tenantId=...&userId=...
        alt No active seat
            LS-->>AF: { valid: false }
            AF-->>GW: 403 { error: "no_active_seat" }
            GW-->>FE: 403
            FE-->>User: "No active license seat"
        end
        LS-->>AF: { valid: true, tier: "PROFESSIONAL" }
    end

    alt MFA enabled for user
        AF->>AF: Create MFA session token (signed JWT, 5 min TTL)
        AF->>VK: Store MFA session in Valkey
        AF->>VK: Store pending tokens in Valkey
        AF-->>GW: 403 { error: "mfa_required", mfaSessionToken: "..." }
        GW-->>FE: 403
        FE-->>User: Show MFA input form

        User->>FE: Enter TOTP code
        FE->>GW: POST /api/v1/auth/mfa/verify<br/>{ mfaSessionToken, code }
        GW->>AF: Forward
        AF->>AF: Validate MFA session token
        AF->>KC: Verify TOTP code via Admin API
        AF->>VK: Retrieve pending tokens
        AF->>VK: Delete MFA session + pending tokens
    end

    AF->>LS: GET /api/v1/internal/features/tenant (X-Tenant-ID)
    LS-->>AF: ["feature1", "feature2"]
    AF->>AF: AuthResponse.withFeatures(features)

    AF-->>GW: 200 { accessToken, refreshToken, expiresIn, user, features }
    GW-->>FE: 200
    FE->>FE: SessionService.setTokens(accessToken, refreshToken, rememberMe)
    FE->>FE: Navigate to returnUrl or dashboard
    FE-->>User: Authenticated view
```

---

## Appendix D: ProviderAgnosticRoleConverter Claim Paths

The role converter checks JWT claims in order, collecting all matching roles. This enables the same codebase to work with multiple identity providers without code changes.

| Claim Path | Provider | Example Value |
|------------|----------|---------------|
| `roles` | Standard OIDC | `["ADMIN", "USER"]` |
| `groups` | Azure AD / Okta | `["admin-group", "users"]` |
| `realm_access.roles` | Keycloak (realm) | `{ "roles": ["ADMIN", "USER"] }` |
| `resource_access` | Keycloak (client) | `{ "my-client": { "roles": ["manage-users"] } }` |
| `permissions` | Auth0 | `["read:users", "write:users"]` |

All extracted roles are normalized to `ROLE_` prefix uppercase format (e.g., `admin` becomes `ROLE_ADMIN`).

**Evidence:** `ProviderAgnosticRoleConverter.java` lines 54-61, `AuthProperties.java` lines 59-65.

---

## Document Verification Summary

| Section | Verification Method | Files Read |
|---------|-------------------|------------|
| Component architecture | Glob + Read all .java files | 60+ files |
| Filter chain order | `@Order` annotations verified | `TenantContextFilter`, `RateLimitFilter`, `JwtValidationFilter` |
| Security filter chains | `@Order` and `securityMatcher` verified | `DynamicBrokerSecurityConfig.java` (294 lines) |
| Gateway security | `SecurityConfig.java` verified | `api-gateway/SecurityConfig.java` (168 lines) |
| Frontend architecture | All .ts files read | `auth.guard.ts`, `gateway-auth-facade.service.ts`, `auth.interceptor.ts`, `tenant-header.interceptor.ts`, `session.service.ts`, `tenant-context.service.ts` |
| Error handling | All exception handlers verified | `GlobalExceptionHandler.java` (184 lines) |
| Configuration | `@ConfigurationProperties` verified | `AuthProperties.java`, `KeycloakConfig.java` |
| Integration points | Feign client and RestTemplate verified | `LicenseServiceClient.java`, `KeycloakIdentityProvider.java` |
| Valkey key patterns | `@Value` annotations verified | `TokenServiceImpl.java`, `RateLimitFilter.java`, `TokenBlacklistFilter.java` |
