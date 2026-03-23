# ISSUE-001 Security Review

| Field | Value |
|-------|-------|
| **Review ID** | SEC-REVIEW-001 |
| **Related Issue** | ISSUE-001: Master Tenant Authentication & Superuser Configuration |
| **Reviewer** | SEC Agent |
| **Date** | 2026-02-26 |
| **Status** | COMPLETE |
| **Overall Risk** | HIGH |
| **OWASP Coverage** | A01, A02, A04, A05, A07, A09 assessed |

---

## SEC Agent Governance Acknowledgment

This review was conducted in accordance with `docs/governance/agents/SEC-PRINCIPLES.md` v1.0.0. The following mandatory constraints were observed:

- OWASP Top 10 awareness applied throughout
- STRIDE threat model produced (Section 5)
- No secrets stored in review artifacts
- Multi-tenancy isolation verified (findings documented)
- Audit logging gaps identified
- Defense in depth evaluated
- Least privilege assessed
- Secure defaults evaluated

---

## Table of Contents

1. [Keycloak Realm Export Security](#1-keycloak-realm-export-security)
2. [Admin API Authorization](#2-admin-api-authorization)
3. [User Data Exposure](#3-user-data-exposure)
4. [Token Security](#4-token-security)
5. [Threat Model (STRIDE)](#5-threat-model-stride)
6. [Recommendations Summary](#6-recommendations-summary)

---

## 1. Keycloak Realm Export Security

### 1.1 Risk: Default Credentials in realm-export.json

**Severity: CRITICAL (for production) / MEDIUM (for local dev)**

The planned `infrastructure/keycloak/realm-export.json` file (per ISSUE-001b) will contain a pre-configured superuser (`superadmin@emsist.com`) with a known password. Shipping default credentials creates the following risks:

| Risk | Description | OWASP |
|------|-------------|-------|
| Credential stuffing | Attacker uses known default password against production | A07 |
| Git history exposure | Password remains in git history even if later rotated | A02 |
| Lateral movement | Superuser has full system access if compromised | A01 |

### 1.2 Recommendations for Password Handling

**R1 (CRITICAL): Force password change on first login.**

The realm-export.json MUST set the `requiredActions` field on the superuser to include `UPDATE_PASSWORD`:

```json
{
  "users": [
    {
      "username": "superadmin@emsist.com",
      "enabled": true,
      "requiredActions": ["UPDATE_PASSWORD"],
      "credentials": [
        {
          "type": "password",
          "value": "${SUPERUSER_INITIAL_PASSWORD:-changeme}",
          "temporary": true
        }
      ]
    }
  ]
}
```

**R2 (CRITICAL): Use environment variable injection for the initial password.**

Never hardcode the password in JSON. Keycloak supports environment variable substitution in realm import files. The docker-compose.yml should inject the password at runtime:

```yaml
environment:
  SUPERUSER_INITIAL_PASSWORD: ${SUPERUSER_INITIAL_PASSWORD:-changeme}
```

For non-dev environments, this variable MUST be set by the deployment pipeline from a secrets manager.

**R3 (HIGH): Disable realm-export.json import in production.**

The `--import-realm` flag should ONLY be active in `docker-compose.yml` (local dev). Production deployments must use the Keycloak Admin API or Terraform Keycloak provider for realm configuration. Add a guard:

```yaml
keycloak:
  command: >
    start-dev
    ${KC_IMPORT_REALM:---import-realm}
```

Set `KC_IMPORT_REALM` to an empty string in production.

### 1.3 Client Secret Management

**Severity: CRITICAL**

The `ems-auth-facade` client secret MUST NOT be stored in realm-export.json in cleartext. Current application.yml already uses an environment variable correctly:

```yaml
# File: backend/auth-facade/src/main/resources/application.yml (line 105)
client-secret: ${KEYCLOAK_CLIENT_SECRET:}
```

**Evidence:** The default is empty string, which is correct for local dev (public client or no secret required for dev mode).

**R4 (CRITICAL): In realm-export.json, configure the client as follows:**

```json
{
  "clientId": "ems-auth-facade",
  "publicClient": false,
  "directAccessGrantsEnabled": true,
  "secret": "${KC_CLIENT_SECRET:-dev-secret-do-not-use-in-production}",
  "serviceAccountsEnabled": true,
  "authorizationServicesEnabled": false
}
```

For production: the client secret must be rotated via Keycloak Admin API and stored in HashiCorp Vault or Kubernetes Secrets.

### 1.4 Acceptable Use Scope

| Environment | Realm Import | Default Credentials | Verdict |
|-------------|-------------|---------------------|---------|
| Local dev | YES | YES (temporary=true) | ACCEPTABLE |
| CI/CD test | YES | YES (temporary=true) | ACCEPTABLE with rotation |
| Staging | NO | NO | MUST use Admin API |
| Production | NO | NO | MUST use Admin API + Vault |

---

## 2. Admin API Authorization

### 2.1 Current State (Evidence-Based)

The admin endpoints are secured by `DynamicBrokerSecurityConfig.java` (Chain 1, Order 1):

```java
// File: backend/auth-facade/src/main/java/com/ems/auth/config/DynamicBrokerSecurityConfig.java (line 62-67)
.authorizeHttpRequests(auth -> auth
    .requestMatchers("/api/v1/admin/swagger-ui/**", "/api/v1/admin/api-docs/**").permitAll()
    .requestMatchers("/api/v1/admin/**").hasRole("ADMIN")
    .anyRequest().authenticated()
)
```

And each controller method has `@PreAuthorize("hasRole('ADMIN')")`:

```java
// File: backend/auth-facade/src/main/java/com/ems/auth/controller/AdminProviderController.java (line 57)
@PreAuthorize("hasRole('ADMIN')")
```

### 2.2 Finding SEC-F01: Missing SUPER_ADMIN Role Distinction

**Severity: HIGH**

All admin endpoints check only for `ADMIN` role. The system defines a role hierarchy in Neo4j (V004 migration) with both `SUPER_ADMIN` and `ADMIN` roles. However, the controller does not distinguish between them. This means a tenant-level ADMIN has the same API access as a SUPER_ADMIN.

**Impact:** An ADMIN of tenant-A could potentially manage providers for tenant-B if they know the tenant ID.

**Recommendation R5 (HIGH):** Implement tiered authorization:

```java
// For cross-tenant operations (e.g., SUPER_ADMIN managing any tenant):
@PreAuthorize("hasRole('SUPER_ADMIN') or (hasRole('ADMIN') and @tenantAuthz.isSameTenant(#tenantId))")

// For system-wide operations:
@PreAuthorize("hasRole('SUPER_ADMIN')")
```

### 2.3 Finding SEC-F02: No Tenant Isolation on Admin Endpoints

**Severity: CRITICAL**

The `AdminProviderController` accepts `tenantId` as a path variable but performs NO validation that the authenticated user belongs to that tenant. The `@PreAuthorize("hasRole('ADMIN')")` check only verifies the role exists in the JWT -- it does not verify the JWT's tenant claim matches the `{tenantId}` path parameter.

**Evidence -- the controller method:**

```java
// File: backend/auth-facade/src/main/java/com/ems/auth/controller/AdminProviderController.java (lines 83-96)
public ResponseEntity<List<ProviderConfigResponse>> listProviders(
        @PathVariable String tenantId
) {
    log.debug("Listing providers for tenant: {}", tenantId);
    List<ProviderConfig> providers = dynamicProviderResolver.listProviders(tenantId);
    // ... no tenant validation against JWT claims
}
```

There is no check that `authentication.principal.tenantId == tenantId`.

**Recommendation R6 (CRITICAL): Implement tenant authorization guard.** Create a `TenantAuthorizationService`:

```java
@Component("tenantAuthz")
public class TenantAuthorizationService {

    public boolean isSameTenant(String requestedTenantId) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null) return false;

        // SUPER_ADMIN can access any tenant
        if (auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_SUPER_ADMIN"))) {
            return true;
        }

        // Extract tenant from JWT claims
        if (auth.getPrincipal() instanceof Jwt jwt) {
            String userTenant = jwt.getClaimAsString("tenant_id");
            return requestedTenantId.equals(userTenant);
        }
        return false;
    }
}
```

Then update `@PreAuthorize`:

```java
@PreAuthorize("hasRole('ADMIN') and @tenantAuthz.isSameTenant(#tenantId)")
```

### 2.4 Finding SEC-F03: Rate Limiting Not Applied to Admin Endpoints

**Severity: MEDIUM**

The `RateLimitFilter` applies a global rate limit of 100 requests/minute per IP. This same limit applies to both public auth endpoints and privileged admin endpoints. Admin endpoints should have separate, stricter limits.

**Evidence:**

```java
// File: backend/auth-facade/src/main/java/com/ems/auth/filter/RateLimitFilter.java (lines 43-48)
// Skip rate limiting for actuator and swagger
String path = request.getRequestURI();
if (path.startsWith("/actuator") || path.startsWith("/swagger") || path.startsWith("/api-docs")) {
    filterChain.doFilter(request, response);
    return;
}
```

No special handling for `/api/v1/admin/**` paths.

**Recommendation R7 (MEDIUM):** Implement differentiated rate limits:

| Endpoint Pattern | Rate Limit |
|-----------------|------------|
| `/api/v1/auth/login` | 10 requests/minute per IP (brute-force protection) |
| `/api/v1/admin/**` | 30 requests/minute per user |
| `/api/v1/auth/refresh` | 20 requests/minute per user |
| All other | 100 requests/minute per IP |

### 2.5 Finding SEC-F04: Missing Audit Logging on Admin Operations

**Severity: HIGH**

The `AdminProviderController` uses `log.info()` for logging, but this is application logging, not security audit logging. There is no structured audit event emitted to the audit-service via Kafka for admin operations like registering, updating, or deleting identity providers.

**Evidence:**

```java
// File: backend/auth-facade/src/main/java/com/ems/auth/controller/AdminProviderController.java (line 178)
log.info("Registering new provider {} ({}) for tenant {}",
    request.providerName(), request.protocol(), tenantId);
```

This writes to application logs only. No Kafka event is produced.

**Recommendation R8 (HIGH):** Emit structured audit events for all admin operations:

```java
// Required audit event structure per SEC-PRINCIPLES.md:
{
  "timestamp": "2026-02-26T10:30:00Z",
  "eventType": "ADMIN_PROVIDER_REGISTERED",
  "tenantId": "tenant-acme",
  "userId": "user-123",        // from JWT
  "action": "CREATE_PROVIDER",
  "target": "keycloak-primary",
  "result": "SUCCESS",
  "ipAddress": "192.168.1.1",
  "userAgent": "Mozilla/5.0..."
}
```

Events that MUST be audited:

| Operation | Event Type |
|-----------|-----------|
| List providers | ADMIN_PROVIDERS_LISTED |
| Register provider | ADMIN_PROVIDER_REGISTERED |
| Update provider | ADMIN_PROVIDER_UPDATED |
| Delete provider | ADMIN_PROVIDER_DELETED |
| Test connection | ADMIN_PROVIDER_TESTED |
| Cache invalidation | ADMIN_CACHE_INVALIDATED |
| List users | ADMIN_USERS_LISTED |

### 2.6 Finding SEC-F05: API Gateway Routes Missing for Admin Endpoints

**Severity: HIGH**

The API Gateway `RouteConfig.java` only routes `/api/v1/auth/**` to auth-facade. There is NO route for `/api/v1/admin/**`:

```java
// File: backend/api-gateway/src/main/java/com/ems/gateway/config/RouteConfig.java (lines 23-25)
.route("auth-service", r -> r
    .path("/api/v1/auth/**")
    .uri("http://localhost:8081"))
```

This means admin API requests via the gateway currently return 404. While this is also a functional bug (ISSUE-001a), it has security implications: once the route is added, the gateway's permissive security config (`anyExchange().permitAll()`) will forward ALL admin requests without any authentication check at the gateway level.

```java
// File: backend/api-gateway/src/main/java/com/ems/gateway/config/SecurityConfig.java (lines 23-31)
.authorizeExchange(exchange -> exchange
    .pathMatchers("/api/tenants/resolve").permitAll()
    .pathMatchers("/api/tenants/validate/**").permitAll()
    .pathMatchers("/api/v1/auth/**").permitAll()
    .pathMatchers("/actuator/**").permitAll()
    .anyExchange().permitAll()  // <-- ALL exchanges permitted
)
```

**Recommendation R9 (HIGH):** When adding the admin route, also update gateway security:

```java
// In RouteConfig.java, add:
.route("admin-service", r -> r
    .path("/api/v1/admin/**")
    .uri("http://localhost:8081"))

// In SecurityConfig.java, change anyExchange() to require auth:
.authorizeExchange(exchange -> exchange
    .pathMatchers("/api/tenants/resolve").permitAll()
    .pathMatchers("/api/tenants/validate/**").permitAll()
    .pathMatchers("/api/v1/auth/**").permitAll()
    .pathMatchers("/actuator/**").permitAll()
    .pathMatchers("/api/v1/admin/**").authenticated()  // ADD THIS
    .anyExchange().authenticated()  // CHANGE from permitAll
)
```

---

## 3. User Data Exposure

### 3.1 Safe Fields for User Listing API

The planned `GET /api/v1/admin/tenants/{tenantId}/users` endpoint (ISSUE-001d) will return user data. Based on the existing `UserNode` entity and Keycloak `UserRepresentation`, the following classification applies:

| Field | Safe to Return | Justification |
|-------|---------------|---------------|
| `id` (UUID) | YES | Non-sensitive identifier |
| `email` | YES (ADMIN only) | PII but required for admin operations |
| `firstName` | YES (ADMIN only) | PII but required for admin operations |
| `lastName` | YES (ADMIN only) | PII but required for admin operations |
| `active` | YES | Status flag |
| `emailVerified` | YES | Status flag |
| `roles` | YES (ADMIN only) | Required for role management |
| `groups` | YES (ADMIN only) | Required for group management |
| `createdAt` | YES | Metadata |
| `lastLoginAt` | YES | Metadata |
| `identityProvider` | YES | Non-sensitive |
| `password` / `credentials` | NEVER | Must never leave Keycloak |
| `passwordHash` | NEVER | Must never leave Keycloak |
| `totpSecret` | NEVER | MFA secret key |
| `recoveryCodes` | NEVER | MFA recovery codes |
| `sessionData` | NEVER | Internal state |
| `externalId` | NO | Potential IdP linkage leakage |
| `federationLink` | NEVER | Internal IdP reference |

### 3.2 Finding SEC-F06: PII Exposure Risk

**Severity: MEDIUM**

The user listing endpoint will expose PII (names, emails) for all users in a tenant. This is acceptable for admin operations but requires safeguards:

**Recommendation R10 (MEDIUM):** Implement the following controls:

1. **Response DTO filtering:** Create a `UserSummaryResponse` DTO that only includes safe fields. Never return raw `UserRepresentation` or `UserNode`:

```java
public record UserSummaryResponse(
    String id,
    String email,
    String firstName,
    String lastName,
    boolean active,
    boolean emailVerified,
    List<String> roles,
    Instant createdAt,
    Instant lastLoginAt
) {}
```

2. **Log access to user data:** Every call to the user listing endpoint must produce an audit event with the requesting admin's identity.

3. **Data minimization:** If the caller only needs a count or summary, provide separate endpoints that return less data.

### 3.3 Finding SEC-F07: Pagination Required to Prevent Data Exfiltration

**Severity: MEDIUM**

Without pagination limits, an admin could retrieve ALL users in a single request, enabling bulk data exfiltration if the admin account is compromised.

**Recommendation R11 (MEDIUM):** Enforce pagination with hard limits:

```java
@GetMapping
@PreAuthorize("hasRole('ADMIN') and @tenantAuthz.isSameTenant(#tenantId)")
public ResponseEntity<Page<UserSummaryResponse>> listUsers(
    @PathVariable String tenantId,
    @RequestParam(defaultValue = "0") int page,
    @RequestParam(defaultValue = "25") @Max(100) int size,  // Max 100 per page
    @RequestParam(required = false) String search
) {
    // ...
}
```

| Parameter | Default | Maximum | Enforced |
|-----------|---------|---------|----------|
| `page` | 0 | Unbounded | Server-side |
| `size` | 25 | 100 | `@Max(100)` validation |
| `search` | null | 255 chars | `@Size(max=255)` |

---

## 4. Token Security

### 4.1 JWT Validation at API Gateway Level

**Finding SEC-F08: Gateway Performs No JWT Validation**

**Severity: HIGH**

The API Gateway currently performs zero JWT validation. Its security config permits all exchanges:

```java
// File: backend/api-gateway/src/main/java/com/ems/gateway/config/SecurityConfig.java (line 30)
.anyExchange().permitAll()
```

All authentication is delegated to individual microservices. While defense in depth is the goal, this means a compromised or misconfigured downstream service could expose data without any gateway-level protection.

**Recommendation R12 (HIGH):** Add JWT validation at the gateway level for non-public endpoints. At minimum, verify the token signature and expiration before forwarding to downstream services. This does not need to check roles (that is the service's responsibility), but it should reject obviously invalid tokens early:

```java
.pathMatchers("/api/v1/admin/**").authenticated()
.pathMatchers("/api/v1/users/**").authenticated()
.pathMatchers("/api/v1/licenses/**").authenticated()
.pathMatchers("/api/v1/notifications/**").authenticated()
.pathMatchers("/api/v1/audit/**").authenticated()
```

Configure the gateway as an OAuth2 Resource Server:

```yaml
spring:
  security:
    oauth2:
      resourceserver:
        jwt:
          jwk-set-uri: ${KEYCLOAK_URL:http://localhost:8180}/realms/master/protocol/openid-connect/certs
```

### 4.2 Token Scope for Admin Operations

**Finding SEC-F09: No Scope-Based Access Control**

**Severity: MEDIUM**

JWT tokens do not carry OAuth2 scopes that distinguish admin operations from regular operations. All access control is role-based. While RBAC is functional, adding scope-based claims would enable finer-grained access control.

**Recommendation R13 (LOW):** Consider adding OAuth2 scopes to the Keycloak client configuration in the future:

| Scope | Grants Access To |
|-------|-----------------|
| `admin:providers:read` | List/get providers |
| `admin:providers:write` | Create/update/delete providers |
| `admin:users:read` | List/get users |
| `admin:users:write` | Create/update/delete users |

This is a future enhancement, not a blocker for the current release.

### 4.3 Refresh Token Rotation Policy

**Finding SEC-F10: No Refresh Token Rotation Configured**

**Severity: MEDIUM**

The `KeycloakIdentityProvider.refreshToken()` method calls the Keycloak token endpoint but relies on Keycloak's default refresh token behavior. The realm-export.json must enforce refresh token rotation to prevent token replay attacks.

**Evidence:**

```java
// File: backend/auth-facade/src/main/java/com/ems/auth/provider/KeycloakIdentityProvider.java (lines 97-116)
public AuthResponse refreshToken(String realm, String refreshToken) {
    // ... calls Keycloak token endpoint with grant_type=refresh_token
}
```

**Recommendation R14 (MEDIUM):** Configure refresh token rotation in realm-export.json:

```json
{
  "realm": "master",
  "ssoSessionIdleTimeout": 1800,
  "ssoSessionMaxLifespan": 36000,
  "accessTokenLifespan": 900,
  "revokeRefreshToken": true,
  "refreshTokenMaxReuse": 0,
  "ssoSessionIdleTimeoutRememberMe": 0,
  "ssoSessionMaxLifespanRememberMe": 0
}
```

Key settings:

| Setting | Value | Meaning |
|---------|-------|---------|
| `accessTokenLifespan` | 900 (15 min) | Aligns with SEC-PRINCIPLES.md |
| `revokeRefreshToken` | true | Enable rotation |
| `refreshTokenMaxReuse` | 0 | No reuse after rotation |

### 4.4 Finding SEC-F11: Default MFA Signing Key in Source Code

**Severity: CRITICAL**

The MFA session token signing key has a default value hardcoded in `TokenServiceImpl.java`:

```java
// File: backend/auth-facade/src/main/java/com/ems/auth/service/TokenServiceImpl.java (line 39)
@Value("${token.mfa-signing-key:default-mfa-key-for-development-only-change-in-production}")
String mfaSigningKey
```

While the name says "change in production", there is no runtime check to enforce this. If the default value is used in production, any attacker who reads the source code can forge MFA session tokens and bypass MFA entirely.

**Recommendation R15 (CRITICAL):** Add a startup validation that rejects the default key:

```java
@PostConstruct
public void validateSigningKey() {
    if ("default-mfa-key-for-development-only-change-in-production".equals(mfaSigningKeyString)) {
        if (isProductionProfile()) {
            throw new IllegalStateException(
                "SECURITY: token.mfa-signing-key must be set to a unique value in production. " +
                "The default development key is not acceptable.");
        }
        log.warn("SECURITY WARNING: Using default MFA signing key. " +
                 "Set token.mfa-signing-key for production deployments.");
    }
}
```

### 4.5 Finding SEC-F12: Default Jasypt Encryption Password

**Severity: CRITICAL**

The Jasypt encryptor password for encrypting client secrets in Neo4j has a default value:

```yaml
# File: backend/auth-facade/src/main/resources/application.yml (line 43)
jasypt:
  encryptor:
    password: ${JASYPT_PASSWORD:ems-secret-key}
```

If `JASYPT_PASSWORD` is not set, the encryption key is `ems-secret-key`, which is in the source code. This means all "encrypted" secrets in Neo4j ConfigNode can be trivially decrypted by anyone with source code access.

**Recommendation R16 (CRITICAL):** Same pattern as R15 -- add startup validation:

```java
@PostConstruct
public void validateEncryptionConfig() {
    // Reject known default Jasypt passwords in non-dev profiles
}
```

And enforce via CI/CD: production deployments MUST set `JASYPT_PASSWORD` from a secrets manager.

### 4.6 Finding SEC-F13: Default Neo4j Password in Source

**Severity: HIGH**

```yaml
# File: backend/auth-facade/src/main/resources/application.yml (line 24)
spring:
  neo4j:
    authentication:
      password: ${NEO4J_PASSWORD:password123}
```

And in docker-compose.yml:

```yaml
# File: infrastructure/docker/docker-compose.yml (line 49)
NEO4J_AUTH=neo4j/password123
```

**Recommendation R17 (HIGH):** Remove default passwords from YAML files. Use empty defaults that force explicit configuration:

```yaml
password: ${NEO4J_PASSWORD:}
```

Add startup checks for empty/default passwords in non-dev profiles.

---

## 5. Threat Model (STRIDE)

### 5.1 Overview

| Attribute | Value |
|-----------|-------|
| Feature | Superuser login + Admin operations |
| Data Sensitivity | HIGH (identity config, user PII, auth tokens) |
| Trust Boundaries | Browser -> Gateway -> Auth-Facade -> Keycloak/Neo4j |

### 5.2 Assets

| Asset | Description | Sensitivity |
|-------|-------------|-------------|
| Superuser credentials | Email/password for SUPER_ADMIN | CRITICAL |
| JWT access tokens | Bearer tokens with role claims | HIGH |
| JWT refresh tokens | Long-lived tokens for session renewal | HIGH |
| MFA session tokens | Short-lived tokens for MFA flow | HIGH |
| Provider configs | OIDC/SAML/LDAP secrets in Neo4j | CRITICAL |
| User PII | Names, emails of tenant users | HIGH |
| Jasypt encryption key | Master key for Neo4j secrets | CRITICAL |
| MFA signing key | Key for MFA session JWT signing | CRITICAL |
| Keycloak admin credentials | Admin API access | CRITICAL |

### 5.3 Data Flow Diagram

```
                    Trust Boundary 1                Trust Boundary 2
                    (Internet/DMZ)                  (Internal Network)
                         |                               |
┌──────────┐      ┌──────┴──────┐      ┌─────────────────┴──────────────────┐
│          │      │             │      │                                     │
│ Browser  │─────>│ API Gateway │─────>│  Auth-Facade                       │
│          │  TLS │  (8080)     │ HTTP │  (8081)                             │
│          │<─────│             │<─────│                                     │
│          │      │  No JWT     │      │  JWT validation                     │
│          │      │  validation │      │  Role-based access                  │
│          │      │  (!)        │      │  Tenant context                     │
└──────────┘      └─────────────┘      │                                     │
                                       │  ┌───────────┐  ┌───────────────┐  │
                                       │  │ Keycloak   │  │ Neo4j         │  │
                                       │  │ Admin API  │  │ (configs,     │  │
                                       │  │ (8180)     │  │  users,       │  │
                                       │  │            │  │  roles)       │  │
                                       │  └───────────┘  └───────────────┘  │
                                       │                                     │
                                       │  ┌───────────┐                     │
                                       │  │ Valkey     │                     │
                                       │  │ (sessions, │                     │
                                       │  │  rate      │                     │
                                       │  │  limits)   │                     │
                                       │  └───────────┘                     │
                                       └─────────────────────────────────────┘
```

### 5.4 Threat Analysis

#### S -- Spoofing

| ID | Threat | Likelihood | Impact | Mitigation Status |
|----|--------|-----------|--------|-------------------|
| S1 | Attacker uses default superuser password from realm-export.json | HIGH | CRITICAL | NOT MITIGATED -- R1, R2 required |
| S2 | Attacker forges MFA session token using default signing key | MEDIUM | CRITICAL | NOT MITIGATED -- R15 required |
| S3 | Attacker impersonates admin by guessing/brute-forcing credentials | MEDIUM | HIGH | PARTIALLY MITIGATED -- Rate limiting exists (100/min) but not tuned for login (R7) |
| S4 | Attacker replays captured JWT token | LOW | HIGH | MITIGATED -- Token blacklist exists in Valkey; JWKS validation with RS256 |
| S5 | Attacker spoofs X-Tenant-ID header to access another tenant | HIGH | CRITICAL | NOT MITIGATED -- R6 required |

**S5 Detailed Analysis:** The `X-Tenant-ID` header is set by the frontend and trusted by the backend without verification against JWT claims. An attacker with a valid ADMIN token for tenant-A can set `X-Tenant-ID: tenant-B` and access tenant-B's providers and users.

```java
// File: backend/auth-facade/src/main/java/com/ems/auth/filter/JwtValidationFilter.java (lines 65-71)
String tenantId = TenantContextFilter.getCurrentTenant();
// Realm derived from header, NOT validated against JWT tenant_id claim
String realm;
if (tenantId != null && tenantId.startsWith("tenant-")) {
    realm = tenantId.substring(7);
} else {
    realm = tenantId != null ? tenantId : "master";
}
```

The tenant from the header is used to determine which Keycloak realm to validate the token against. If the tenant header is spoofed, the token validation may fail (because the token was issued by a different realm's keys) OR succeed (if the same Keycloak instance signs tokens with the same key). Either way, the admin endpoint path parameter `{tenantId}` is never validated against the JWT.

#### T -- Tampering

| ID | Threat | Likelihood | Impact | Mitigation Status |
|----|--------|-----------|--------|-------------------|
| T1 | Modify JWT claims (add ADMIN role) | LOW | CRITICAL | MITIGATED -- RS256 signature validation via JWKS |
| T2 | Tamper with provider config in transit | LOW | HIGH | PARTIALLY MITIGATED -- Internal network HTTP (no TLS between services) |
| T3 | Modify Neo4j data directly (bypass auth) | LOW | CRITICAL | PARTIALLY MITIGATED -- Neo4j requires auth but password is weak default |
| T4 | Tamper with rate limit counters in Valkey | LOW | MEDIUM | PARTIALLY MITIGATED -- Valkey has no password configured |

**T4 Evidence:**

```yaml
# File: backend/auth-facade/src/main/resources/application.yml (line 12)
spring:
  data:
    redis:
      password: ${VALKEY_PASSWORD:}  # Empty default = no authentication
```

```yaml
# File: infrastructure/docker/docker-compose.yml (lines 27-34)
valkey:
  image: valkey/valkey:8-alpine
  # No password/requirepass configured
```

**Recommendation R18 (MEDIUM):** Configure Valkey with authentication:

```yaml
valkey:
  command: valkey-server --requirepass ${VALKEY_PASSWORD}
```

#### R -- Repudiation

| ID | Threat | Likelihood | Impact | Mitigation Status |
|----|--------|-----------|--------|-------------------|
| R1 | Admin deletes provider and denies action | MEDIUM | HIGH | NOT MITIGATED -- Only app logs, no structured audit events (R8) |
| R2 | Admin lists all user data and denies exfiltration | MEDIUM | HIGH | NOT MITIGATED -- No audit trail for data access (R8) |
| R3 | Superuser modifies configs and denies responsibility | MEDIUM | MEDIUM | NOT MITIGATED -- No audit trail distinguishing actors |

**Current audit logging gaps:**
- `AdminProviderController` uses only `log.info()` -- no Kafka events to audit-service
- No correlation between admin action and specific user identity in logs
- No immutable audit trail (application logs can be deleted)

#### I -- Information Disclosure

| ID | Threat | Likelihood | Impact | Mitigation Status |
|----|--------|-----------|--------|-------------------|
| I1 | Admin endpoint leaks cross-tenant provider configs | HIGH | HIGH | NOT MITIGATED -- No tenant isolation check (R6) |
| I2 | Provider config response leaks partial secrets | LOW | MEDIUM | PARTIALLY MITIGATED -- `maskSecret()` exists but reveals first/last 2 chars |
| I3 | Error responses leak stack traces | LOW | LOW | MITIGATED -- `GlobalExceptionHandler` catches all exceptions |
| I4 | Debug logging exposes sensitive data | MEDIUM | MEDIUM | RISK -- `logging.level.com.ems: DEBUG` in default config |
| I5 | Swagger UI exposes admin API documentation publicly | MEDIUM | LOW | RISK -- Admin swagger is permitAll() |

**I2 Analysis -- Secret Masking:**

```java
// File: backend/auth-facade/src/main/java/com/ems/auth/controller/AdminProviderController.java (lines 518-526)
private String maskSecret(String secret) {
    if (secret == null || secret.isEmpty()) {
        return null;
    }
    if (secret.length() <= 4) {
        return "****";
    }
    return secret.substring(0, 2) + "****" + secret.substring(secret.length() - 2);
}
```

Revealing the first 2 and last 2 characters of a secret reduces the search space for brute-force attacks. For a 32-character secret, this reduces unknown characters from 32 to 28, but more importantly, it confirms the secret is set and reveals its format.

**Recommendation R19 (LOW):** Return only `"****"` for all secrets regardless of length. Do not reveal any characters.

**I4 Evidence:**

```yaml
# File: backend/auth-facade/src/main/resources/application.yml (lines 180-184)
logging:
  level:
    com.ems: DEBUG
    org.springframework.security: DEBUG
```

DEBUG-level security logging in the default profile will log JWT details, user information, and authentication flow details. This is acceptable for development but MUST be set to `INFO` or `WARN` in production profiles.

**Recommendation R20 (HIGH):** Create production-specific logging configuration:

```yaml
# application-production.yml
logging:
  level:
    com.ems: INFO
    org.springframework.security: WARN
    io.github.resilience4j: INFO
```

**I5 Evidence:**

```java
// File: backend/auth-facade/src/main/java/com/ems/auth/config/DynamicBrokerSecurityConfig.java (line 64)
.requestMatchers("/api/v1/admin/swagger-ui/**", "/api/v1/admin/api-docs/**").permitAll()
```

**Recommendation R21 (MEDIUM):** Admin API documentation should be behind authentication in non-dev environments. Use a profile-based flag to control Swagger access.

#### D -- Denial of Service

| ID | Threat | Likelihood | Impact | Mitigation Status |
|----|--------|-----------|--------|-------------------|
| D1 | Brute-force login attempts against superuser | HIGH | HIGH | PARTIALLY MITIGATED -- 100/min rate limit exists but too generous for login |
| D2 | Flood admin endpoints | MEDIUM | MEDIUM | PARTIALLY MITIGATED -- Same 100/min global limit |
| D3 | Exhaust Keycloak admin connections | MEDIUM | HIGH | NOT MITIGATED -- `getAdminClient()` creates new connection per call |
| D4 | Valkey unavailability disables rate limiting | MEDIUM | HIGH | RISK -- Rate limiter fails open (allows all requests) |

**D3 Evidence:**

```java
// File: backend/auth-facade/src/main/java/com/ems/auth/provider/KeycloakIdentityProvider.java (lines 372-379)
private Keycloak getAdminClient() {
    return KeycloakBuilder.builder()
        .serverUrl(keycloakConfig.getServerUrl())
        .realm(keycloakConfig.getMasterRealm())
        .clientId(keycloakConfig.getAdmin().getClientId())
        .username(keycloakConfig.getAdmin().getUsername())
        .password(keycloakConfig.getAdmin().getPassword())
        .build();  // Creates a new HTTP client per call
}
```

Each admin API call creates a new Keycloak admin client connection. Under load, this can exhaust HTTP connections to Keycloak.

**Recommendation R22 (MEDIUM):** Use a singleton or pooled Keycloak admin client:

```java
@Bean
public Keycloak keycloakAdminClient(KeycloakConfig config) {
    return KeycloakBuilder.builder()
        .serverUrl(config.getServerUrl())
        .realm(config.getMasterRealm())
        .clientId(config.getAdmin().getClientId())
        .username(config.getAdmin().getUsername())
        .password(config.getAdmin().getPassword())
        .build();
}
```

**D4 Evidence:**

```java
// File: backend/auth-facade/src/main/java/com/ems/auth/filter/RateLimitFilter.java (lines 84-88)
} catch (Exception e) {
    // If Valkey is unavailable, allow the request but log warning
    log.warn("Rate limiting failed, allowing request: {}", e.getMessage());
    filterChain.doFilter(request, response);
}
```

Rate limiting fails open. If Valkey is down, all rate limits are bypassed. This is a conscious design choice for availability, but creates a DoS vector: take down Valkey, then brute-force login.

**Recommendation R23 (MEDIUM):** Implement a local in-memory fallback rate limiter (e.g., Guava RateLimiter) that activates when Valkey is unavailable. This provides degraded but non-zero rate limiting.

#### E -- Elevation of Privilege

| ID | Threat | Likelihood | Impact | Mitigation Status |
|----|--------|-----------|--------|-------------------|
| E1 | Regular USER escalates to ADMIN via API | LOW | CRITICAL | MITIGATED -- `@PreAuthorize("hasRole('ADMIN')")` on endpoints, roles in JWT signed by Keycloak |
| E2 | ADMIN of tenant-A escalates to SUPER_ADMIN | MEDIUM | CRITICAL | NOT MITIGATED -- No SUPER_ADMIN vs ADMIN distinction (R5) |
| E3 | ADMIN accesses another tenant's resources | HIGH | CRITICAL | NOT MITIGATED -- No tenant isolation check (R6) |
| E4 | Attacker with default Keycloak admin credentials gains full system access | HIGH | CRITICAL | NOT MITIGATED -- Default admin/admin in docker-compose |

**E4 Evidence:**

```yaml
# File: infrastructure/docker/docker-compose.yml (lines 104-105)
KEYCLOAK_ADMIN: admin
KEYCLOAK_ADMIN_PASSWORD: admin
```

The Keycloak admin console is exposed on port 8180 with default credentials. An attacker accessing this console can create any user, assign any role, and effectively gain full control of the identity system.

**Recommendation R24 (CRITICAL for production, ACCEPTABLE for local dev):**
- Change Keycloak admin credentials via environment variables sourced from secrets manager
- Restrict Keycloak admin console access via network policy (internal only)
- Enable MFA for Keycloak admin console access

---

## 6. Recommendations Summary

### Priority Matrix

| ID | Finding | Severity | Effort | Priority |
|----|---------|----------|--------|----------|
| R1 | Force password change on first login for superuser | CRITICAL | Low | P0 -- MUST before merge |
| R2 | Use env vars for initial superuser password | CRITICAL | Low | P0 -- MUST before merge |
| R6 | Implement tenant authorization guard on admin endpoints | CRITICAL | Medium | P0 -- MUST before merge |
| R15 | Validate MFA signing key is not default in production | CRITICAL | Low | P0 -- MUST before merge |
| R16 | Validate Jasypt password is not default in production | CRITICAL | Low | P0 -- MUST before merge |
| R5 | Implement SUPER_ADMIN vs ADMIN role distinction | HIGH | Medium | P1 -- MUST before release |
| R8 | Emit structured audit events for admin operations | HIGH | Medium | P1 -- MUST before release |
| R9 | Add admin route to API Gateway with auth | HIGH | Low | P1 -- MUST before release |
| R12 | Add JWT validation at gateway level | HIGH | Medium | P1 -- MUST before release |
| R17 | Remove default Neo4j password from YAML | HIGH | Low | P1 -- MUST before release |
| R20 | Production logging levels (no DEBUG) | HIGH | Low | P1 -- MUST before release |
| R3 | Disable realm import in production | HIGH | Low | P1 -- SHOULD before release |
| R4 | Client secret via env var in realm-export | CRITICAL | Low | P0 -- MUST before merge |
| R7 | Differentiated rate limits for login/admin | MEDIUM | Medium | P2 -- SHOULD for hardening |
| R10 | Create UserSummaryResponse DTO | MEDIUM | Low | P2 -- SHOULD for hardening |
| R11 | Enforce pagination limits on user listing | MEDIUM | Low | P2 -- SHOULD for hardening |
| R14 | Configure refresh token rotation in Keycloak | MEDIUM | Low | P2 -- SHOULD for hardening |
| R18 | Configure Valkey authentication | MEDIUM | Low | P2 -- SHOULD for hardening |
| R21 | Restrict admin Swagger UI access | MEDIUM | Low | P2 -- SHOULD for hardening |
| R22 | Pool Keycloak admin client connections | MEDIUM | Medium | P2 -- SHOULD for hardening |
| R23 | In-memory fallback rate limiter | MEDIUM | Medium | P3 -- NICE to have |
| R13 | OAuth2 scope-based access control | LOW | High | P3 -- Future enhancement |
| R19 | Full secret masking (no char reveal) | LOW | Low | P3 -- NICE to have |
| R24 | Keycloak admin credential rotation | CRITICAL (prod) | Low | P1 -- for production only |

### Blocking Items for ISSUE-001

The following MUST be implemented as part of ISSUE-001 before the superuser and admin API features can go live:

1. **R1 + R2 + R4**: realm-export.json must use temporary passwords, env vars, and no cleartext secrets
2. **R6**: Tenant isolation check on admin endpoints (prevents cross-tenant access)
3. **R9**: API Gateway route for `/api/v1/admin/**` with authenticated exchange
4. **R15 + R16**: Startup validation for default encryption keys

### Security Review Checklist (per SEC-PRINCIPLES.md)

- [x] OWASP Top 10 analysis completed (A01, A02, A04, A05, A07, A09 assessed)
- [x] STRIDE threat model documented (Section 5)
- [x] No secrets in code or configs (findings documented: SEC-F11, SEC-F12, SEC-F13)
- [x] Input validation reviewed (Jakarta validation on DTOs)
- [x] Output encoding reviewed (JSON responses, no HTML rendering)
- [x] Authentication verified (JWT validation via JWKS)
- [x] Authorization checks reviewed (findings SEC-F01, SEC-F02)
- [x] Tenant isolation verified (finding SEC-F02: NOT IMPLEMENTED)
- [x] Audit logging reviewed (finding SEC-F04: GAPS FOUND)
- [x] Security headers reviewed (CORS at gateway level)
- [x] Encryption standards reviewed (Jasypt AES-256, JWKS RS256)
- [x] Error handling reviewed (GlobalExceptionHandler, no stack traces)
- [ ] Dependencies scanned for vulnerabilities (not performed -- requires build environment)
- [ ] SAST scan passed (not performed -- requires build environment)
- [x] Security review documented (this document)

---

## Appendix A: Files Referenced

| File | Relevance |
|------|-----------|
| `/Users/mksulty/Claude/EMSIST/backend/auth-facade/src/main/java/com/ems/auth/controller/AdminProviderController.java` | Admin API endpoints, secret masking |
| `/Users/mksulty/Claude/EMSIST/backend/auth-facade/src/main/java/com/ems/auth/config/DynamicBrokerSecurityConfig.java` | Security filter chains |
| `/Users/mksulty/Claude/EMSIST/backend/auth-facade/src/main/java/com/ems/auth/config/SecurityConfig.java` | Legacy security config |
| `/Users/mksulty/Claude/EMSIST/backend/auth-facade/src/main/java/com/ems/auth/filter/RateLimitFilter.java` | Rate limiting implementation |
| `/Users/mksulty/Claude/EMSIST/backend/auth-facade/src/main/java/com/ems/auth/filter/JwtValidationFilter.java` | JWT validation, tenant derivation |
| `/Users/mksulty/Claude/EMSIST/backend/auth-facade/src/main/java/com/ems/auth/service/TokenServiceImpl.java` | MFA signing key, token blacklist |
| `/Users/mksulty/Claude/EMSIST/backend/auth-facade/src/main/java/com/ems/auth/service/AuthServiceImpl.java` | Login flow, MFA flow |
| `/Users/mksulty/Claude/EMSIST/backend/auth-facade/src/main/java/com/ems/auth/provider/KeycloakIdentityProvider.java` | Keycloak admin client |
| `/Users/mksulty/Claude/EMSIST/backend/auth-facade/src/main/java/com/ems/auth/graph/entity/ConfigNode.java` | Encrypted secrets in Neo4j |
| `/Users/mksulty/Claude/EMSIST/backend/auth-facade/src/main/java/com/ems/auth/graph/entity/UserNode.java` | User data model |
| `/Users/mksulty/Claude/EMSIST/backend/auth-facade/src/main/java/com/ems/auth/config/AuthProperties.java` | Auth configuration |
| `/Users/mksulty/Claude/EMSIST/backend/auth-facade/src/main/resources/application.yml` | Default passwords, encryption config |
| `/Users/mksulty/Claude/EMSIST/backend/api-gateway/src/main/java/com/ems/gateway/config/SecurityConfig.java` | Gateway security (permitAll) |
| `/Users/mksulty/Claude/EMSIST/backend/api-gateway/src/main/java/com/ems/gateway/config/RouteConfig.java` | Missing admin route |
| `/Users/mksulty/Claude/EMSIST/backend/api-gateway/src/main/java/com/ems/gateway/config/CorsConfig.java` | CORS configuration |
| `/Users/mksulty/Claude/EMSIST/backend/api-gateway/src/main/resources/application.yml` | Gateway configuration |
| `/Users/mksulty/Claude/EMSIST/infrastructure/docker/docker-compose.yml` | Default credentials, service config |
| `/Users/mksulty/Claude/EMSIST/docs/governance/agents/SEC-PRINCIPLES.md` | Security governance rules |
