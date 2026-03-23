# 6. Runtime View

This section documents key runtime scenarios only. Strategic decisions remain in [Solution Strategy](./04-solution-strategy.md) and ADRs.

## 6.1 User Login with Seat Validation and Authorization Context [TARGET STATE]

```mermaid
sequenceDiagram
    participant U as User
    participant FE as Frontend
    participant GW as API Gateway
    participant AF as auth-facade
    participant IDP as Identity Provider (Keycloak default)
    participant LS as license-service
    participant VK as Valkey

    U->>FE: Submit credentials
    FE->>GW: POST /api/v1/auth/login
    GW->>AF: Forward request
    AF->>IDP: Authenticate

    alt Invalid credentials
        IDP-->>AF: 401
        AF-->>GW: 401
        GW-->>FE: Login failed
    else Valid credentials
        IDP-->>AF: Tokens + claims
        AF->>LS: Validate seat(tenantUuid, userId)
        LS->>VK: Check cache
        alt Cache miss
            LS->>LS: Resolve active assignment
            LS->>VK: Cache result (TTL)
        end
        alt No active seat
            LS-->>AF: invalid
            AF-->>GW: 403 NO_ACTIVE_SEAT
            GW-->>FE: Access denied
        else Active seat
            LS-->>AF: valid + seat info
            AF->>LS: Get user feature set
            LS-->>AF: features[]
            AF->>AF: Resolve effective roles + responsibilities + clearance
            AF-->>GW: Auth response + authorization context
            GW-->>FE: Auth response + authorization context
        end
    end
```

> **Note:** auth-facade does NOT call user-service. The only Feign client in auth-facade is
> `LicenseServiceClient` (`backend/auth-facade/src/main/java/com/ems/auth/client/LicenseServiceClient.java`).
> Session/user state is managed via Keycloak tokens and Neo4j graph, not via user-service REST calls.

Authorization context payload contract:

- `roles`: effective roles after inheritance.
- `responsibilities`: policy keys resolved by backend policy mapping.
- `features`: license-validated feature list.
- `clearanceLevel`: user data-classification clearance for this tenant context.
- `policyVersion`: policy package version returned by backend.
- `uiVisibility`: frontend rendering hints derived from policy; backend remains authoritative.

## 6.2 Token Refresh

```mermaid
sequenceDiagram
    participant FE as Frontend
    participant GW as API Gateway
    participant AF as auth-facade
    participant IDP as Identity Provider (Keycloak default)

    FE->>GW: POST /api/v1/auth/refresh
    GW->>AF: Forward refresh token
    AF->>IDP: Refresh grant
    AF->>LS: Refresh user feature set
    LS-->>AF: features[]
    AF->>AF: Recompute responsibilities + uiVisibility + clearance
    IDP-->>AF: New token pair
    AF-->>GW: Token response + authorization context
    GW-->>FE: Token response + authorization context
```

## 6.3 Tenant-Scoped Data Query [IMPLEMENTED]

### Domain Services (PostgreSQL / Spring Data JPA)

All active domain services (tenant-service, user-service, license-service, notification-service,
audit-service, ai-service) use PostgreSQL with Spring Data JPA.
Tenant isolation is enforced via `tenant_id` column filtering.

**Evidence:** `backend/tenant-service/src/main/java/com/ems/tenant/repository/TenantRepository.java`
extends `JpaRepository`; entity `TenantEntity` uses `@Entity` / `@Table(name = "tenants")`.

```mermaid
sequenceDiagram
    participant C as Client
    participant GW as API Gateway
    participant TS as tenant-service
    participant PG as PostgreSQL

    C->>GW: GET /api/v1/tenants/{tenantId}
    GW->>TS: Forward + X-Tenant-ID header
    TS->>PG: SELECT * FROM tenants WHERE id = ?
    PG-->>TS: Tenant-scoped result
    TS-->>GW: Response (JSON)
    GW-->>C: Response
```

### auth-facade (Neo4j / Spring Data Neo4j)

Only auth-facade uses Neo4j for its authentication graph (providers, roles, groups, tenants).

```mermaid
sequenceDiagram
    participant C as Client
    participant GW as API Gateway
    participant AF as auth-facade
    participant NEO as Neo4j

    C->>GW: GET /api/v1/auth/providers
    GW->>AF: Forward + tenant context
    AF->>NEO: MATCH (t:Tenant)-[:HAS_PROVIDER]->(p:Provider) WHERE t.tenantId = $tenantId RETURN p
    NEO-->>AF: Graph-scoped result
    AF-->>GW: Response (JSON)
    GW-->>C: Response
```

> **Note:** `product-service` and `persona-service` are stub-only (have `pom.xml` but no `src/`
> directory). `process-service` has source code but is intentionally kept out of active runtime
> scope. All three are excluded from current runtime flow scope.

## 6.4 Feature and Classification Gate Check [TARGET STATE]

```mermaid
sequenceDiagram
    participant C as Client
    participant S as Service
    participant LS as license-service
    participant PE as Policy Engine

    C->>S: Execute gated operation
    S->>LS: Check feature access
    alt Feature denied
        LS-->>S: allowed=false
        S-->>C: 403 feature_denied
    else Feature allowed
        LS-->>S: allowed=true
        S->>PE: Check classification access (user, resource)
        alt Classification denied
            PE-->>S: denied
            S-->>C: 403 classification_denied
        else Allowed
            PE-->>S: allowed/masked
            S-->>C: 2xx success (full or masked payload)
        end
    end
```

## 6.5 Audit Event Processing

### Current: REST API Ingestion [IMPLEMENTED]

audit-service exposes a REST API (`AuditController`) and persists to PostgreSQL using
JPA (`AuditEventEntity` with `@Entity` / `@Table(name = "audit_events")`).
Schema managed by Flyway.

**Evidence:**
- Controller: `backend/audit-service/src/main/java/com/ems/audit/controller/AuditController.java`
- Entity: `backend/audit-service/src/main/java/com/ems/audit/entity/AuditEventEntity.java` (JPA `@Entity`, PostgreSQL `jsonb` columns)
- Migrations: `backend/audit-service/src/main/resources/db/migration/` (Flyway)

```mermaid
sequenceDiagram
    participant SRC as Source Service
    participant AUD as audit-service (REST)
    participant PG as PostgreSQL

    SRC->>AUD: POST /api/v1/audit-events (JSON)
    AUD->>PG: INSERT INTO audit_events (...)
    PG-->>AUD: Stored
    AUD-->>SRC: 201 Created
```

### Future: Kafka Consumer Path [IN-PROGRESS]

Kafka consumers exist in audit-service and notification-service but are **disabled by default**
(`@ConditionalOnProperty(name = "spring.kafka.enabled", havingValue = "true", matchIfMissing = false)`).
No Kafka producers (`KafkaTemplate`) exist anywhere in the codebase. The `spring.kafka.enabled`
property is not set in any `application.yml`.

**Evidence:**
- Consumer: `backend/audit-service/src/main/java/com/ems/audit/listener/AuditEventListener.java` (conditional, disabled)
- Consumer: `backend/notification-service/src/main/java/com/ems/notification/listener/NotificationEventListener.java` (conditional, disabled)
- Producers: None found (zero `KafkaTemplate` usage in any service)

```mermaid
sequenceDiagram
    participant SRC as Source Service
    participant K as Kafka
    participant AUD as audit-service

    Note over SRC,K: [PLANNED] No KafkaTemplate producers exist yet
    SRC-->>K: Publish audit event (not implemented)
    K-->>AUD: Deliver event (consumer exists but disabled)
    Note over AUD: @ConditionalOnProperty spring.kafka.enabled=true (default: false)
```

## 6.6 Cache Read/Write Pattern [IMPLEMENTED]

Single-tier Valkey cache (see [ADR-005](../adr/ADR-005-valkey-caching.md)).
Caffeine (L1 in-process cache) is **not present** in the codebase -- no dependency, no configuration.

Services use Spring `@Cacheable` / `@CacheEvict` annotations backed by Valkey (via Spring Data Redis).
The backing data store depends on the service: PostgreSQL for domain services, Neo4j for auth-facade.

**Evidence:**
- auth-facade cache config: `backend/auth-facade/src/main/java/com/ems/auth/config/CacheConfig.java`
- license-service cache config: `backend/license-service/src/main/java/com/ems/license/config/RedisConfig.java`
- `@Cacheable` usage: `GraphRoleService.java` (auth-facade)
- Dormant module note: `process-service` contains cache annotations, but the module is out of active runtime scope.
- `@CacheEvict` usage: `Neo4jProviderResolver.java` (auth-facade)
- No `caffeine`, `CaffeineCache`, or `com.github.benmanes` found in any `pom.xml` or source file

```mermaid
sequenceDiagram
    participant S as Service
    participant VK as Valkey
    participant DB as Database (PostgreSQL or Neo4j)

    S->>VK: GET key (@Cacheable)
    alt Cache hit
        VK-->>S: Cached value
    else Cache miss
        VK-->>S: null
        S->>DB: Query (JPA or Cypher)
        DB-->>S: Result
        S->>VK: SET key with TTL
        VK-->>S: OK
    end

    Note over S,VK: Cache invalidation via @CacheEvict on write operations
```

## 6.7 Tenant Creation and Provisioning [TARGET STATE]

```mermaid
sequenceDiagram
    participant SA as Superadmin
    participant FE as Frontend
    participant GW as API Gateway
    participant TS as tenant-service API
    participant W as Provisioning Worker
    participant KC as Keycloak Admin API
    participant DB as PostgreSQL
    participant DNS as DNS Provider (Customer/Managed)
    participant TLS as Certificate Manager/Ingress
    participant LS as license-service

    SA->>FE: Create tenant (name, slug, primary domain mode)
    FE->>GW: POST /api/tenants
    GW->>TS: Forward request
    TS->>DB: Persist tenant + provisioning job (PENDING/PROVISIONING)
    TS-->>FE: 202 Accepted + jobId

    W->>KC: Create realm/client/roles/admin
    W->>DB: Execute schema bootstrap + migrations + seeds

    alt Managed subdomain mode (e.g., acme.emsist.com)
        W->>DNS: Create DNS record via provider API
    else Custom domain mode (e.g., app.customer.com)
        W-->>SA: Publish DNS challenge instructions (TXT/CNAME)
        SA->>DNS: Customer admin applies DNS record
        W->>DNS: Verify challenge
    end

    W->>TLS: Issue/bind certificate and route
    W->>LS: Validate tenant license entitlement
    alt Valid tenant license
        W->>TS: Run readiness checks and promote status
        TS->>DB: Update tenant status ACTIVE
    else Missing/invalid tenant license
        W->>TS: Mark provisioning failed (license gate)
        TS->>DB: Update tenant status PROVISIONING_FAILED
    end
```

Failure path contract:

- Any failed phase sets tenant to `PROVISIONING_FAILED` with step-specific error details.
- Retry resumes from last successful checkpoint; previously completed phases are not repeated unless explicitly requested.
- Each phase retry uses idempotency key `{tenantUuid}:{jobId}:{phase}` with bounded retry budget.
- Terminal phase failure triggers phase-specific compensation before final failure state commit.

## 6.8 Session Lifecycle (End-to-End) [PARTIALLY IMPLEMENTED]

This section documents the full session lifecycle from login through logout, covering token issuance, refresh, blacklisting, and session termination.

```mermaid
sequenceDiagram
    participant U as User
    participant FE as Frontend
    participant GW as API Gateway
    participant AF as auth-facade
    participant IDP as Keycloak
    participant VK as Valkey

    Note over U,VK: LOGIN
    U->>FE: Submit credentials
    FE->>GW: POST /api/v1/auth/login
    GW->>AF: Forward request
    AF->>IDP: Authenticate (password grant)
    IDP-->>AF: Tokens (access + refresh)
    AF->>AF: Build authorization context
    AF-->>FE: Auth response + tokens

    Note over U,VK: ACTIVE SESSION
    FE->>GW: API request + Bearer token
    GW->>GW: Extract tenant from JWT
    GW->>AF: Forward with X-Tenant-ID
    Note right of GW: [PLANNED] Check token blacklist in Valkey

    Note over U,VK: TOKEN REFRESH
    FE->>GW: POST /api/v1/auth/refresh
    GW->>AF: Forward refresh token
    AF->>IDP: Refresh grant
    IDP-->>AF: New access + refresh tokens
    AF-->>FE: Updated tokens

    Note over U,VK: LOGOUT
    FE->>GW: POST /api/v1/auth/logout
    GW->>AF: Forward
    AF->>IDP: Revoke refresh token
    Note right of AF: [PLANNED] AF should also call blacklistToken()
    AF-->>FE: 204 No Content
```

### Implementation Status

| Step | Status | Evidence |
|------|--------|----------|
| Login flow (auth-facade to Keycloak authenticate, return tokens) | [IMPLEMENTED] | `backend/auth-facade/src/main/java/com/ems/auth/service/AuthServiceImpl.java` line 41 (`login()` method calls `identityProvider.authenticate()`) |
| Token refresh (auth-facade to Keycloak refresh grant) | [IMPLEMENTED] | `backend/auth-facade/src/main/java/com/ems/auth/service/AuthServiceImpl.java` line 114 (`refreshToken()` calls `identityProvider.refreshToken()`) |
| Logout (revoke refresh token in Keycloak) | [IMPLEMENTED] | `backend/auth-facade/src/main/java/com/ems/auth/service/AuthServiceImpl.java` line 122 (`logout()` calls `identityProvider.logout()`) |
| Token blacklist mechanism (Valkey SET with TTL) | [IMPLEMENTED] | `backend/auth-facade/src/main/java/com/ems/auth/service/TokenServiceImpl.java` line 91 (`blacklistToken()` stores `auth:blacklist:{jti}` in Valkey) |
| Token blacklist check (isTokenBlacklisted) | [IMPLEMENTED] | `backend/auth-facade/src/main/java/com/ems/auth/service/TokenServiceImpl.java` line 87 (`isTokenBlacklisted()` checks Valkey for key existence) |
| Logout calling blacklistToken | [PLANNED] | The `logout()` method in `AuthServiceImpl` does NOT call `tokenService.blacklistToken()`. It only revokes the refresh token in Keycloak. Access token blacklisting on logout is not wired. |
| API gateway blacklist check | [PLANNED] | The API gateway (`TenantContextFilter`) extracts tenant from JWT but does NOT check Valkey for blacklisted JTIs. See ISSUE-INF-020. |
| MFA pending flow (Valkey `auth:mfa:pending:{hash}` with 5min TTL) | [IN-PROGRESS] | MFA token storage exists in `AuthServiceImpl.storePendingTokens()` (line 175), uses `redisTemplate.opsForValue().set()` with 5-minute TTL. MFA verification flow exists but MFA provider integration is partial. |
| Concurrent session limits per user | [PLANNED] | No implementation exists. |
| Inactivity timeout enforcement | [PLANNED] | No implementation exists. Frontend and backend have no idle-session detection. |

## 6.9 Service-to-Service Authentication [PLANNED]

Currently, backend services communicate over the Docker network without mutual authentication. The API gateway forwards requests to downstream services based on routing rules, but downstream services do not validate JWT tokens or verify the caller's identity.

```mermaid
sequenceDiagram
    participant GW as API Gateway
    participant AF as auth-facade
    participant TS as tenant-service
    participant US as user-service

    Note over GW,US: CURRENT STATE — No Inter-Service Auth
    GW->>AF: HTTP request (no auth header validation)
    GW->>TS: HTTP request (no auth header validation)
    GW->>US: HTTP request (no auth header validation)
    Note right of TS: Services trust Docker network boundary
    Note right of TS: 7/8 services lack JWT validation filters
```

### Current State Evidence

- Only auth-facade has a `JwtValidationFilter` (`backend/auth-facade/src/main/java/com/ems/auth/filter/JwtValidationFilter.java`), but it validates user-facing JWTs, not service-to-service calls.
- The remaining 7 services (tenant-service, user-service, license-service, notification-service, audit-service, ai-service, process-service) have no JWT validation filter. Any request reaching them on the Docker network is trusted implicitly.
- No mTLS, service mesh, or API key mechanism exists between services.

### Future Options [PLANNED]

| Option | Description | Complexity | Suitability |
|--------|-------------|------------|-------------|
| JWT propagation | Gateway forwards user JWT; downstream services validate it | Low | Good for Phase 1 (Docker Compose) |
| mTLS | Mutual TLS certificates between all services | Medium | Good for Kubernetes with cert-manager |
| Service mesh (Istio/Linkerd) | Sidecar proxies handle mutual auth transparently | High | Best for Phase 2+ (Kubernetes) |

Reference: ISSUE-INF-009 (7/8 services lack JWT validation)

---

**Previous Section:** [Building Blocks](./05-building-blocks.md)
**Next Section:** [Deployment View](./07-deployment-view.md)
