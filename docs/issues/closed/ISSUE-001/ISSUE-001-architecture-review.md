# ISSUE-001: Architecture Review

| Field | Value |
|-------|-------|
| **Document** | Architecture Review |
| **Author** | ARCH Agent |
| **Date** | 2026-02-26 |
| **Status** | REVIEW |
| **Related** | ISSUE-001-master-tenant-auth-superuser.md |
| **Classification** | Strategic Architecture Decision |

---

## Table of Contents

1. [API Gateway Route Analysis](#1-api-gateway-route-analysis)
2. [Keycloak Bootstrap Architecture Decision](#2-keycloak-bootstrap-architecture-decision)
3. [Tenant Identity Resolution](#3-tenant-identity-resolution)
4. [User Data Source Architecture](#4-user-data-source-architecture)
5. [Security Considerations](#5-security-considerations)
6. [Implementation Priority](#6-implementation-priority)

---

## 1. API Gateway Route Analysis

### 1.1 Current State (Verified)

**Evidence file:** `/Users/mksulty/Claude/EMSIST/backend/api-gateway/src/main/java/com/ems/gateway/config/RouteConfig.java`

The API Gateway defines routes in two locations:
- **YAML routes** (`application.yml`, lines 21-63): Only health check routes (`/services/*/health`)
- **Java RouteConfig** (`RouteConfig.java`, lines 18-89): All API routes

The Java-based routes include:

| Route ID | Path Pattern | Target URI |
|----------|-------------|------------|
| `auth-service` | `/api/v1/auth/**` | `http://localhost:8081` |
| `tenant-service` | `/api/tenants/**` | `http://localhost:8082` |
| `user-service` | `/api/v1/users/**` | `http://localhost:8083` |
| `license-products` | `/api/v1/products/**` | `http://localhost:8085` |
| `license-service` | `/api/v1/licenses/**` | `http://localhost:8085` |
| `notification-service` | `/api/v1/notifications/**` | `http://localhost:8086` |
| `notification-templates` | `/api/v1/notification-templates/**` | `http://localhost:8086` |
| `audit-service` | `/api/v1/audit/**` | `http://localhost:8087` |
| `ai-agents` | `/api/v1/agents/**` | `http://localhost:8088` |
| `ai-conversations` | `/api/v1/conversations/**` | `http://localhost:8088` |
| `ai-providers` | `/api/v1/providers/**` | `http://localhost:8088` |
| `process-service` | `/api/process/**` | `http://localhost:8089` |

### 1.2 Root Cause: Missing Admin Route

**The `/api/v1/admin/**` path has NO route defined.** This is the confirmed root cause of the 404 error.

The frontend calls (from `/Users/mksulty/Claude/EMSIST/frontend/src/app/features/admin/identity-providers/services/provider-admin.service.ts`, line 25):
```typescript
private readonly apiUrl = `${environment.apiUrl}/api/v1/admin/tenants`;
```

Where `environment.apiUrl` resolves to `http://localhost:8080` (the gateway). So the full URL is:
```
GET http://localhost:8080/api/v1/admin/tenants/{tenantId}/providers
```

The backend controller exists at (`/Users/mksulty/Claude/EMSIST/backend/auth-facade/src/main/java/com/ems/auth/controller/AdminProviderController.java`, line 40):
```java
@RequestMapping("/api/v1/admin/tenants/{tenantId}/providers")
```

But the gateway has **no route mapping** `/api/v1/admin/**` to `http://localhost:8081`.

### 1.3 Secondary Issue: Route Collision with AI Providers

The gateway defines:
```java
.route("ai-providers", r -> r
    .path("/api/v1/providers/**")
    .uri("http://localhost:8088"))
```

The auth-facade `AuthController` also exposes:
```java
@GetMapping("/providers")  // Full path: /api/v1/auth/providers
```

Currently these do not collide because the auth path is nested under `/api/v1/auth/**`, which matches the `auth-service` route. However, any future `/api/v1/providers/**` endpoint in auth-facade would be routed to ai-service instead. This is a latent conflict to be aware of.

### 1.4 Recommendation

Add a new admin route to `RouteConfig.java`, placed BEFORE the auth-service route (route ordering matters in Spring Cloud Gateway -- more specific paths should come first):

```java
// ADMIN MANAGEMENT API (8081) - Must be before auth-service route
.route("admin-management", r -> r
    .path("/api/v1/admin/**")
    .uri("http://localhost:8081"))
```

Additionally, consider adding a route for the auth-facade's event controller (`/api/v1/events/**`) if it is intended to be accessed through the gateway.

**Gateway Security Note:** The gateway's `SecurityConfig.java` (line 30) currently uses `.anyExchange().permitAll()`, meaning the gateway itself does NOT enforce authentication. All authentication is delegated to individual services. This is an acceptable pattern since auth-facade has its own `DynamicBrokerSecurityConfig` that enforces `hasRole("ADMIN")` on admin endpoints. However, it means any client can reach the auth-facade admin endpoints -- they will just get a 401/403 from auth-facade itself if they lack a valid JWT.

---

## 2. Keycloak Bootstrap Architecture Decision

### 2.1 Context

Keycloak starts as an empty server with only the built-in `master` realm and the console admin user (`admin/admin`). No application realm, no client, no users, and no roles exist for the EMSIST application.

**Evidence file:** `/Users/mksulty/Claude/EMSIST/infrastructure/docker/docker-compose.yml`, lines 98-122

```yaml
keycloak:
    image: quay.io/keycloak/keycloak:24.0
    command: start-dev
    environment:
      KEYCLOAK_ADMIN: admin
      KEYCLOAK_ADMIN_PASSWORD: admin
```

No `--import-realm` flag, no volume-mounted realm export, no init scripts.

The auth-facade expects the following to exist in Keycloak (from `/Users/mksulty/Claude/EMSIST/backend/auth-facade/src/main/resources/application.yml`, lines 95-106):
- A Keycloak server at `http://localhost:8180`
- A client named `ems-auth-facade`
- Admin access via `admin-cli` client in master realm
- Support for Direct Access Grant (Resource Owner Password Credentials) flow

### 2.2 Considered Alternatives

#### Option A: Realm Import via JSON (Static)

**Description:** Create a JSON realm export file and mount it into the Keycloak container. Use the `--import-realm` command flag for automatic import on startup.

**Configuration:**
```yaml
keycloak:
    command: start-dev --import-realm
    volumes:
      - ./keycloak/realm-export.json:/opt/keycloak/data/import/realm-export.json
```

**Pros:**
- Declarative -- the realm state is version-controlled and reproducible
- Fast startup -- no API calls needed, Keycloak loads realm on boot
- Works offline -- no external dependencies during init
- Keycloak-native feature -- well-documented and supported
- Idempotent -- Keycloak skips import if realm already exists (default behavior)
- All developers get identical local environments

**Cons:**
- JSON file can be large (1000+ lines for a full realm with roles, clients, users)
- Secrets (client secrets, passwords) are embedded in the JSON file (must be excluded from production)
- Changes require re-exporting or manual JSON editing
- Not suitable for production -- production realms should be managed through CI/CD or Keycloak Admin API
- Import behavior on updates can be unpredictable (skip vs overwrite strategies)

#### Option B: Programmatic Setup via Keycloak Admin API

**Description:** Create a Spring Boot `CommandLineRunner` or separate init container that uses the Keycloak Admin Client to create realms, clients, users, and roles on startup.

**Pros:**
- Full control over what gets created and when
- Can be conditional (check if realm exists before creating)
- Easier to test in isolation
- Can handle complex logic (e.g., create realm only if it does not exist, update roles on schema change)
- Code-reviewable and testable with unit tests

**Cons:**
- Requires Keycloak to be healthy before init runs (ordering dependency)
- More code to maintain
- Slower startup (multiple HTTP API calls)
- Keycloak Admin Client adds dependency (already present via `org.keycloak:keycloak-admin-client`)
- Init failures need retry logic

#### Option C: Hybrid (JSON for base, API for customization)

**Description:** Use realm import for the baseline (realm, client, core roles) and programmatic API calls for dynamic content (users, tenant-specific roles, custom attributes).

**Pros:**
- Fast base setup via JSON
- Flexible customization via API
- Clean separation of concerns: static config vs dynamic config
- JSON contains no secrets (client secrets set via API, passwords via Keycloak Admin UI)

**Cons:**
- Two mechanisms to understand and maintain
- Startup order still matters (JSON import happens before API calls)
- Slightly more complex

### 2.3 Decision Recommendation

**Recommended: Option C (Hybrid) for local dev; Option B (Programmatic) for production.**

**Rationale:**

For local development:
1. A realm-export JSON provides a fast, reproducible baseline: realm name, client configuration, realm roles, default scopes.
2. A `KeycloakInitializer` component in auth-facade (Spring Boot `CommandLineRunner`) creates the superuser, sets client secrets from environment variables, and creates any dynamic content.
3. The JSON file is committed to the repository under `infrastructure/keycloak/` for developer convenience.

For production:
1. Realm configuration is managed through CI/CD pipelines using the Keycloak Admin API or Terraform Keycloak provider.
2. No JSON import files in production containers.
3. Secrets are injected via Kubernetes secrets / HashiCorp Vault.

### 2.4 Recommended Bootstrap Content

The realm export JSON should contain:

| Component | Value | Notes |
|-----------|-------|-------|
| Realm name | `master` | Reuse Keycloak's master realm for the master tenant |
| Client ID | `ems-auth-facade` | Confidential client, Direct Access Grant enabled |
| Redirect URIs | `http://localhost:4200/*`, `http://localhost:8080/*` | Local dev only |
| Realm roles | `SUPER_ADMIN`, `ADMIN`, `MANAGER`, `USER`, `VIEWER` | Match Neo4j role hierarchy |
| Superuser | `superadmin@emsist.com` / `admin123` | Local dev only |
| Superuser roles | `SUPER_ADMIN`, `ADMIN` | Full admin access |

**Important:** The `KeycloakInitializer` should check `auth.dynamic-broker.init-data` property to avoid running in production.

### 2.5 Realm Strategy: Master vs Dedicated

A critical sub-decision: should the EMSIST application use Keycloak's built-in `master` realm or create a dedicated `ems` realm?

| Factor | Use `master` realm | Use dedicated `ems` realm |
|--------|-------------------|---------------------------|
| Simplicity | Simpler -- already exists | Requires creation |
| Security | Risky -- mixing admin users with app users | Cleaner separation |
| Multi-tenancy | Each tenant gets `tenant-{id}` realm; master remains special | Each tenant gets `tenant-{id}` realm; `ems` is the platform realm |
| Keycloak Admin API | Admin API access via `master` realm is always required | Admin API still uses `master`; app users live in `ems` |
| Current code | `AuthController.resolveRealm()` maps `"master"` tenant to `"master"` realm | Would need to map `"master"` tenant to `"ems"` realm |

**Recommendation:** Use the `master` realm for local development simplicity, with a clear understanding that production may use a dedicated realm. The `resolveRealm()` method in `AuthController.java` (line 171) already handles this mapping and can be updated later:

```java
private String resolveRealm(String tenantId) {
    if ("master".equalsIgnoreCase(tenantId) || "tenant-master".equalsIgnoreCase(tenantId)) {
        return "master";  // For now; could become "ems" in production
    }
    ...
}
```

---

## 3. Tenant Identity Resolution

### 3.1 Current State (Verified)

**The "Tenant ID Duality" Problem:**

- **Neo4j** uses string ID `"master"` for the master tenant:
  - Evidence: `/Users/mksulty/Claude/EMSIST/backend/auth-facade/src/main/java/com/ems/auth/graph/Neo4jDataInitializer.java`, line 106:
    ```java
    "id", "master",
    ```
  - The `TenantNode` record uses `@Id String id` (string, not UUID)
  - Evidence: `/Users/mksulty/Claude/EMSIST/backend/auth-facade/src/main/java/com/ems/auth/graph/entity/TenantNode.java`, line 29

- **Frontend** may reference UUID `a0000000-0000-0000-0000-000000000001` (reported in the issue context)

- **Auth-facade controller** takes `{tenantId}` as a string path variable:
  - Evidence: `AdminProviderController.java`, line 40:
    ```java
    @RequestMapping("/api/v1/admin/tenants/{tenantId}/providers")
    ```

- **Auth-facade AuthController** maps tenant ID to Keycloak realm:
  - Evidence: `AuthController.java`, lines 171-179:
    ```java
    private String resolveRealm(String tenantId) {
        if ("master".equalsIgnoreCase(tenantId) || "tenant-master".equalsIgnoreCase(tenantId)) {
            return "master";
        }
        if (tenantId.startsWith("tenant-")) {
            return tenantId;
        }
        return "tenant-" + tenantId;
    }
    ```

### 3.2 Considered Alternatives

#### Option A: Change Neo4j to Use UUID

- Change `TenantNode.id` from `"master"` to `"a0000000-0000-0000-0000-000000000001"`
- Change `Neo4jDataInitializer` to use UUID
- Add UUID generation for all new tenants

**Pros:** Consistent with PostgreSQL-based services (tenant-service likely uses UUIDs). Eliminates ambiguity.
**Cons:** Breaking change for existing Neo4j data. The string "master" is also used as a Keycloak realm name, so realm resolution logic would need a mapping table.

#### Option B: Add `externalId` (UUID) Field to TenantNode, Keep `id` as Slug

- Keep `id` as the slug-based natural key ("master", "acme-corp")
- Add a `uuid` field (e.g., `a0000000-0000-0000-0000-000000000001`)
- Use the slug internally for Neo4j lookups and Keycloak realm mapping
- Use the UUID externally for cross-service references

**Pros:** No breaking change. Natural keys remain human-readable. UUID available for external use.
**Cons:** Two identifiers to manage. Queries need to support lookup by either.

#### Option C: Frontend Uses Slug/String ID

- The frontend sends `"master"` (the slug) instead of a UUID
- All tenant references in the auth domain use string slugs
- The tenant-service (PostgreSQL) maintains the UUID mapping if needed

**Pros:** Simplest change. No backend modification. Matches Keycloak realm naming.
**Cons:** Frontend must be aware that auth-facade uses slugs while other services may use UUIDs. Cross-service tenant references become inconsistent.

### 3.3 Recommendation

**Recommended: Option B (Add UUID field, keep string ID as primary key).**

**Rationale:**

1. Neo4j graph node IDs are most effective when they are human-readable and semantically meaningful. A tenant slug like `"master"` or `"acme-corp"` is ideal for graph queries, Cypher statements, and debugging.

2. The Keycloak realm name is derived from the tenant ID (see `resolveRealm()`). Keycloak realm names cannot be UUIDs (they must be URL-safe slugs). Keeping the string ID as the primary key preserves this natural mapping.

3. The UUID field enables cross-service correlation: when tenant-service creates a tenant in PostgreSQL with a UUID, that UUID is also stored in Neo4j's TenantNode. The frontend can use either form depending on context.

4. The `TenantNode` record would become:

```java
@Node("Tenant")
public record TenantNode(
    @Id String id,          // Slug: "master", "acme-corp"
    String uuid,            // Cross-service UUID: "a0000000-..."
    String domain,
    String name,
    boolean active,
    ...
)
```

5. The `AdminProviderController` already accepts `{tenantId}` as a string. The frontend should send the slug (e.g., `"master"`) when calling auth-facade admin endpoints, or the Neo4j resolver should support lookup by either slug or UUID.

### 3.4 Immediate Fix (Short-Term)

For the current 404 issue, the simplest fix is:
- The frontend sends the tenant slug (`"master"`) rather than a UUID when calling auth-facade admin endpoints.
- The `ProviderEmbeddedComponent` receives a `tenantId` input. Wherever that input is set, ensure it uses the string slug.
- If the frontend's tenant model stores both a UUID and a slug, use the slug for auth-facade calls and the UUID for other service calls.

---

## 4. User Data Source Architecture

### 4.1 Context

Users in the EMSIST platform exist in two potential locations:
1. **Keycloak** -- The identity provider where users authenticate. Stores: credentials, email, name, roles, attributes, federation links, sessions.
2. **Neo4j** -- The identity graph in auth-facade. Stores: `UserNode` with graph relationships to groups, roles, and tenants.

**Evidence -- UserNode entity** (`/Users/mksulty/Claude/EMSIST/backend/auth-facade/src/main/java/com/ems/auth/graph/entity/UserNode.java`):
```java
@Node("User")
public record UserNode(
    @Id String id,          // UUID from identity provider
    String email,
    String firstName,
    String lastName,
    String tenantId,
    boolean active,
    boolean emailVerified,
    String externalId,       // External IdP user ID
    String identityProvider, // Which IdP authenticated this user
    List<GroupNode> groups,
    List<RoleNode> directRoles,
    Instant createdAt,
    Instant updatedAt,
    Instant lastLoginAt
)
```

**Evidence -- Keycloak Admin Client** already present in `KeycloakIdentityProvider.java`:
```java
private Keycloak getAdminClient() {
    return KeycloakBuilder.builder()
        .serverUrl(keycloakConfig.getServerUrl())
        .realm(keycloakConfig.getMasterRealm())
        .clientId(keycloakConfig.getAdmin().getClientId())
        .username(keycloakConfig.getAdmin().getUsername())
        .password(keycloakConfig.getAdmin().getPassword())
        .build();
}
```

### 4.2 Considered Alternatives

#### Option A: Keycloak Admin API Only (Single Source)

**Description:** All user listing, search, and detail queries go directly to Keycloak's Admin REST API. No user data persisted in Neo4j.

| Metric | Assessment |
|--------|------------|
| Latency | Medium -- each API call goes to Keycloak (network hop) |
| Consistency | Perfect -- always the latest data from Keycloak |
| Offline access | None -- if Keycloak is down, no user data available |
| Graph queries | Not possible -- cannot traverse user-group-role relationships via graph |
| Pagination | Supported -- Keycloak Admin API supports `first` and `max` parameters |
| Search | Limited -- Keycloak search is basic (by username, email, first/last name) |

**Pros:** Single source of truth. No data sync needed. Simple implementation.
**Cons:** Tight coupling to Keycloak. No graph query capability. Limited search.

#### Option B: Neo4j UserNode Only (Synced from Keycloak)

**Description:** Sync user data from Keycloak to Neo4j on events (login, registration, admin operations). All queries go to Neo4j.

| Metric | Assessment |
|--------|------------|
| Latency | Low -- local Neo4j queries |
| Consistency | Eventual -- depends on sync frequency and reliability |
| Offline access | Full -- Neo4j has all user data cached |
| Graph queries | Full -- can traverse user->group->role->permission graphs |
| Pagination | Supported -- Neo4j SKIP/LIMIT |
| Search | Powerful -- Cypher queries, full-text indexes |

**Pros:** Fast queries. Graph-native relationships. Resilient to Keycloak outages.
**Cons:** Data can be stale. Sync logic adds complexity. Two sources of truth.

#### Option C: Hybrid (Keycloak = Auth, Neo4j = Relationships)

**Description:** Keycloak is the authoritative source for user credentials and authentication. Neo4j stores the user's organizational graph: group memberships, role assignments, tenant associations. User listing for admin pages queries Keycloak for basic user data and enriches with Neo4j graph data.

| Metric | Assessment |
|--------|------------|
| Latency | Medium -- parallel queries to Keycloak + Neo4j, merged in service |
| Consistency | Good -- auth data always from Keycloak; graph data from Neo4j |
| Offline access | Partial -- graph relationships available, auth data requires Keycloak |
| Graph queries | Full -- group/role hierarchy traversals via Neo4j |
| Pagination | Complex -- need to coordinate pagination across two sources |
| Search | Good -- Keycloak for user search, Neo4j for relationship-based queries |

**Pros:** Best of both worlds. Each store handles what it does best.
**Cons:** Complex merge logic. Pagination coordination is non-trivial.

### 4.3 Recommendation

**Recommended: Option C (Hybrid) with sync-on-event.**

**Rationale:**

1. **Keycloak manages identity.** It is the authoritative system for who a user is, their credentials, email verification status, and session management. The Keycloak Admin API should be the source for user listing in admin screens.

2. **Neo4j manages relationships.** The identity graph's value proposition is traversing relationships: "Which groups does this user belong to?" "What roles does this user have across all groups?" "Who else is in the same group?" These are graph-native queries that Keycloak cannot efficiently answer.

3. **Sync strategy: event-driven with lazy initialization.**
   - On login: Create/update `UserNode` in Neo4j with basic profile data from the JWT claims.
   - On admin user creation: Create `UserNode` after creating user in Keycloak.
   - On user listing: Query Keycloak for user list, enrich with Neo4j group/role graph data.

4. **API design for user listing:**

```
GET /api/v1/admin/tenants/{tenantId}/users
    ?page=0&size=20&search=john

Response: {
    users: [
        {
            id: "uuid",
            email: "john@example.com",
            firstName: "John",
            lastName: "Doe",
            enabled: true,
            emailVerified: true,
            // From Neo4j enrichment:
            groups: ["Developers", "Team-Alpha"],
            roles: ["ADMIN", "USER"],
            lastLoginAt: "2026-02-26T10:00:00Z"
        }
    ],
    totalCount: 150,
    page: 0,
    size: 20
}
```

5. **Implementation pattern:**

```
AdminUserController
    -> UserManagementService
        -> KeycloakAdminAPI.getUsers(realm, first, max, search)  // Primary list
        -> Neo4jUserRepository.findByTenantId(tenantId)          // Graph enrichment
        -> merge & return
```

### 4.4 Future Consideration: SCIM

For production multi-tenancy at scale, consider implementing SCIM 2.0 (System for Cross-domain Identity Management) as the standard protocol for user provisioning between Keycloak and the application. This would replace the custom sync logic with a standards-based approach. This is a future consideration, not needed for the current implementation.

---

## 5. Security Considerations

### 5.1 Current Security Architecture (Verified)

Auth-facade has a three-chain security configuration:

**Evidence:** `/Users/mksulty/Claude/EMSIST/backend/auth-facade/src/main/java/com/ems/auth/config/DynamicBrokerSecurityConfig.java`

| Chain | Order | Matcher | Policy |
|-------|-------|---------|--------|
| Admin API | 1 | `/api/v1/admin/**` | `hasRole("ADMIN")` + OAuth2 JWT |
| Public Auth | 2 | `/api/v1/auth/**` | Mix of `permitAll()` and `authenticated()` |
| Default | 3 | Everything else | `permitAll()` for actuator/swagger, `authenticated()` for rest |

The admin chain (line 57) uses:
```java
.securityMatcher("/api/v1/admin/**")
.requestMatchers("/api/v1/admin/**").hasRole("ADMIN")
.oauth2ResourceServer(oauth2 -> oauth2
    .jwt(jwt -> jwt.jwtAuthenticationConverter(jwtAuthenticationConverter()))
)
```

This means admin endpoints require a valid JWT token with an `ADMIN` role.

### 5.2 JWT Validation Flow for Admin Operations

```
1. Frontend sends:
   GET /api/v1/admin/tenants/master/providers
   Headers:
     Authorization: Bearer <JWT_TOKEN>
     X-Tenant-ID: master

2. API Gateway (port 8080):
   - Routes /api/v1/admin/** to auth-facade:8081
   - Gateway does NOT validate JWT (permitAll)
   - TenantContextFilter adds X-Request-ID header

3. Auth-facade (port 8081):
   - DynamicBrokerSecurityConfig Chain 1 matches /api/v1/admin/**
   - Spring Security OAuth2 Resource Server validates JWT
   - ProviderAgnosticRoleConverter extracts roles from JWT claims
   - Checks hasRole("ADMIN")
   - If valid: routes to AdminProviderController
   - If invalid: returns 401 (no token) or 403 (wrong role)
```

### 5.3 Role Extraction (Provider-Agnostic)

**Evidence:** `/Users/mksulty/Claude/EMSIST/backend/auth-facade/src/main/java/com/ems/auth/filter/JwtValidationFilter.java`, lines 153-169

The JWT validation filter uses the configured role claim paths:
```yaml
role-claim-paths:
  - realm_access.roles     # Keycloak Realm Roles
  - resource_access        # Keycloak Client Roles
  - roles                  # Standard OIDC / Azure AD
  - groups                 # Azure AD / Okta
  - permissions            # Auth0
```

For Keycloak, the JWT will contain:
```json
{
  "realm_access": {
    "roles": ["SUPER_ADMIN", "ADMIN", "USER"]
  }
}
```

The filter normalizes roles to `ROLE_SUPER_ADMIN`, `ROLE_ADMIN`, etc. The `hasRole("ADMIN")` check in Spring Security strips the `ROLE_` prefix, so it matches.

**Important note on DynamicBrokerSecurityConfig vs JwtValidationFilter:**
The `DynamicBrokerSecurityConfig` uses Spring's built-in `oauth2ResourceServer().jwt()` with `ProviderAgnosticRoleConverter`, while the legacy `JwtValidationFilter` is a custom filter used by the deprecated `SecurityConfig`. Since `auth.dynamic-broker.enabled` defaults to `true` (based on the `@ConditionalOnProperty` with `matchIfMissing = false` on the legacy config and no conditional on the `DynamicBrokerSecurityConfig`), the new configuration is active. The JWT is validated using Spring Security's built-in mechanism, which requires a valid JWT issuer URI configuration.

### 5.4 Missing JWT Issuer Configuration

**Issue identified:** The `DynamicBrokerSecurityConfig` uses `.oauth2ResourceServer(oauth2 -> oauth2.jwt(...))` but there is NO `spring.security.oauth2.resourceserver.jwt.issuer-uri` or `spring.security.oauth2.resourceserver.jwt.jwk-set-uri` property configured in the auth-facade `application.yml`.

**Evidence:** `/Users/mksulty/Claude/EMSIST/backend/auth-facade/src/main/resources/application.yml` -- no `spring.security.oauth2.resourceserver` section exists.

This means Spring Security will fail to validate JWTs because it has no way to obtain the public key for signature verification. This is a **blocking issue** that must be resolved.

**Required configuration:**
```yaml
spring:
  security:
    oauth2:
      resourceserver:
        jwt:
          issuer-uri: ${KEYCLOAK_URL:http://localhost:8180}/realms/master
          # OR explicit JWK set URI:
          jwk-set-uri: ${KEYCLOAK_URL:http://localhost:8180}/realms/master/protocol/openid-connect/certs
```

### 5.5 Role-Based Access Control Recommendations

| Role | Access Level | Endpoints |
|------|-------------|-----------|
| `SUPER_ADMIN` | Full platform access | All `/api/v1/admin/**` endpoints, all tenants |
| `ADMIN` | Tenant admin access | `/api/v1/admin/tenants/{ownTenantId}/**` only |
| `MANAGER` | Limited admin | Read-only admin views (future) |
| `USER` | Standard user | `/api/v1/auth/**` (own profile, login/logout) |
| `VIEWER` | Read-only user | Read-only application access |

**Current gap:** The admin endpoints use `hasRole("ADMIN")` but do NOT enforce tenant scoping. A user with `ADMIN` role for tenant A can currently access tenant B's provider configurations. This is a known limitation that should be addressed by adding tenant-scoped authorization.

**Recommendation:** Add a tenant authorization check in the `AdminProviderController`:

```java
// Verify the authenticated user belongs to the requested tenant
// or has SUPER_ADMIN role for cross-tenant access
```

This is an SA/DEV concern for detailed design, but architecturally, the pattern should be:
1. `SUPER_ADMIN` can access any tenant's admin endpoints
2. `ADMIN` can only access their own tenant's admin endpoints
3. Tenant scoping is enforced via a shared `TenantAuthorizationService`

---

## 6. Implementation Priority

### 6.1 Dependency Chain

```
[BLOCKING] Add admin route to API Gateway
    |
    v
[BLOCKING] Add JWT issuer-uri configuration to auth-facade
    |
    v
[BLOCKING] Create Keycloak realm + client + superuser
    |
    v
[ENABLED] Frontend can authenticate and call admin endpoints
    |
    v
[ENABLED] Provider list loads without 404
    |
    v
[ENHANCEMENT] Add UUID field to TenantNode
    |
    v
[ENHANCEMENT] Implement user listing endpoint
    |
    v
[ENHANCEMENT] Add tenant-scoped authorization
```

### 6.2 Prioritized Task List

| Priority | Task | Effort | Blocker? |
|----------|------|--------|----------|
| P0 | Add `/api/v1/admin/**` route to API Gateway RouteConfig.java | Small | Yes |
| P0 | Add `spring.security.oauth2.resourceserver.jwt.issuer-uri` to auth-facade | Small | Yes |
| P0 | Create Keycloak realm-export.json with client + superuser + roles | Medium | Yes |
| P0 | Update docker-compose to import realm on startup | Small | Yes |
| P1 | Reconcile tenant ID (add UUID field to TenantNode) | Medium | No |
| P1 | Implement `GET /api/v1/admin/tenants/{tenantId}/users` | Medium | No |
| P2 | Add tenant-scoped authorization to admin endpoints | Medium | No |
| P2 | Implement event-driven user sync (Keycloak -> Neo4j) | Large | No |
| P3 | SCIM 2.0 provisioning support | Large | No |

### 6.3 ADR Implications

The following decisions in this review warrant formal ADRs if approved:

| Decision | Suggested ADR Title | Category |
|----------|-------------------|----------|
| Keycloak bootstrap strategy (hybrid) | ADR-012: Keycloak Bootstrap Strategy | Infrastructure |
| Tenant ID duality resolution | ADR-013: Tenant Identity Resolution | Data Architecture |
| User data source (hybrid Keycloak+Neo4j) | ADR-014: User Data Source Architecture | Data Architecture |

These ADRs should be created by the ARCH agent and routed through the Architecture Review Board before implementation begins.

---

## Appendix A: Files Referenced in This Review

| File | Purpose |
|------|---------|
| `/Users/mksulty/Claude/EMSIST/backend/api-gateway/src/main/java/com/ems/gateway/config/RouteConfig.java` | Gateway route definitions (missing admin route) |
| `/Users/mksulty/Claude/EMSIST/backend/api-gateway/src/main/java/com/ems/gateway/config/SecurityConfig.java` | Gateway security (permitAll) |
| `/Users/mksulty/Claude/EMSIST/backend/api-gateway/src/main/java/com/ems/gateway/filter/TenantContextFilter.java` | Gateway tenant header forwarding |
| `/Users/mksulty/Claude/EMSIST/backend/api-gateway/src/main/resources/application.yml` | Gateway YAML config |
| `/Users/mksulty/Claude/EMSIST/backend/auth-facade/src/main/java/com/ems/auth/controller/AdminProviderController.java` | Admin provider CRUD controller |
| `/Users/mksulty/Claude/EMSIST/backend/auth-facade/src/main/java/com/ems/auth/controller/AuthController.java` | Auth endpoints + realm resolution |
| `/Users/mksulty/Claude/EMSIST/backend/auth-facade/src/main/java/com/ems/auth/config/DynamicBrokerSecurityConfig.java` | Three-chain security config |
| `/Users/mksulty/Claude/EMSIST/backend/auth-facade/src/main/java/com/ems/auth/config/SecurityConfig.java` | Legacy security config (deprecated) |
| `/Users/mksulty/Claude/EMSIST/backend/auth-facade/src/main/java/com/ems/auth/filter/JwtValidationFilter.java` | Custom JWT filter + role extraction |
| `/Users/mksulty/Claude/EMSIST/backend/auth-facade/src/main/java/com/ems/auth/graph/Neo4jDataInitializer.java` | Neo4j seed data (master tenant = "master") |
| `/Users/mksulty/Claude/EMSIST/backend/auth-facade/src/main/java/com/ems/auth/graph/entity/TenantNode.java` | Tenant entity (string ID) |
| `/Users/mksulty/Claude/EMSIST/backend/auth-facade/src/main/java/com/ems/auth/graph/entity/UserNode.java` | User entity (graph relationships) |
| `/Users/mksulty/Claude/EMSIST/backend/auth-facade/src/main/java/com/ems/auth/graph/entity/ProviderNode.java` | Provider entity |
| `/Users/mksulty/Claude/EMSIST/backend/auth-facade/src/main/java/com/ems/auth/provider/Neo4jProviderResolver.java` | Neo4j-backed provider resolution |
| `/Users/mksulty/Claude/EMSIST/backend/auth-facade/src/main/java/com/ems/auth/provider/KeycloakIdentityProvider.java` | Keycloak integration |
| `/Users/mksulty/Claude/EMSIST/backend/auth-facade/src/main/java/com/ems/auth/security/JwtTokenValidator.java` | JWKS-based JWT validation |
| `/Users/mksulty/Claude/EMSIST/backend/auth-facade/src/main/resources/application.yml` | Auth-facade config (no JWT issuer-uri) |
| `/Users/mksulty/Claude/EMSIST/frontend/src/app/features/admin/identity-providers/services/provider-admin.service.ts` | Frontend admin API client |
| `/Users/mksulty/Claude/EMSIST/frontend/src/environments/environment.ts` | Frontend env (apiUrl = localhost:8080) |
| `/Users/mksulty/Claude/EMSIST/infrastructure/docker/docker-compose.yml` | Docker infrastructure (no realm import) |

## Appendix B: Verification Evidence Summary

| Claim | Verified | Evidence |
|-------|----------|----------|
| No `/api/v1/admin/**` route in gateway | YES | `RouteConfig.java` lines 18-89 -- no admin route present |
| Frontend calls `/api/v1/admin/tenants/{id}/providers` | YES | `provider-admin.service.ts` line 25, line 60 |
| AdminProviderController exists at expected path | YES | `AdminProviderController.java` line 40 |
| Keycloak starts empty (no realm export) | YES | `docker-compose.yml` lines 98-122 -- no import config |
| Master tenant ID is string "master" in Neo4j | YES | `Neo4jDataInitializer.java` line 106 |
| TenantNode uses @Id String, not UUID | YES | `TenantNode.java` line 29 |
| UserNode entity exists with graph relationships | YES | `UserNode.java` -- groups, directRoles relationships |
| Keycloak Admin Client already in codebase | YES | `KeycloakIdentityProvider.java` line 373 |
| No JWT issuer-uri configured | YES | `application.yml` -- no `spring.security.oauth2` section |
| DynamicBrokerSecurityConfig is active config | YES | No `@ConditionalOnProperty` on class, legacy has `havingValue="false"` |
| Gateway permits all requests | YES | `SecurityConfig.java` (gateway) line 30 |
