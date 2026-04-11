# ISSUE-001 Documentation Plan

> **Document Type:** Documentation Plan
> **Version:** 1.0.0
> **Author:** DOC Agent
> **Created:** 2026-02-26
> **Status:** DRAFT
> **Related Issue:** [ISSUE-001](./ISSUE-001-master-tenant-auth-superuser.md)

---

## Table of Contents

1. [Overview](#1-overview)
2. [Documents to Create](#2-documents-to-create)
3. [Documents to Update](#3-documents-to-update)
4. [Runbook: Keycloak and User Administration](#4-runbook-keycloak-and-user-administration)
5. [Developer Guide Updates](#5-developer-guide-updates)
6. [Documentation Governance Compliance](#6-documentation-governance-compliance)
7. [Implementation Schedule](#7-implementation-schedule)
8. [Verification Checklist](#8-verification-checklist)

---

## 1. Overview

This plan identifies all documentation artifacts that must be created or updated once the ISSUE-001 sub-issues (001a through 001d) are implemented. Every document listed here is tied to a specific sub-issue dependency and must follow the project's Evidence-Before-Documentation (EBD) governance rules.

### Current Codebase Evidence (Verified 2026-02-26)

The following evidence was gathered by reading actual source files before writing this plan.

| Fact | Evidence | File Path |
|------|----------|-----------|
| AuthController exists with `/api/v1/auth/login` | `@PostMapping("/login")` | `backend/auth-facade/src/main/java/com/ems/auth/controller/AuthController.java` |
| AdminProviderController exists with CRUD endpoints | `@RequestMapping("/api/v1/admin/tenants/{tenantId}/providers")` | `backend/auth-facade/src/main/java/com/ems/auth/controller/AdminProviderController.java` |
| API Gateway has NO route for `/api/v1/admin/**` | Only `/api/v1/auth/**` routed to 8081 | `backend/api-gateway/src/main/java/com/ems/gateway/config/RouteConfig.java` (line 23) |
| UserController in user-service has admin CRUD endpoints | `GET /api/v1/users`, `POST /api/v1/users`, etc. | `backend/user-service/src/main/java/com/ems/user/controller/UserController.java` |
| No Keycloak realm export exists | `infrastructure/keycloak/` directory does not exist | Verified via glob search |
| Neo4j V005 creates master tenant with Keycloak config | `MERGE (t:Tenant {id: 'master'})`, config with `clientId: 'ems-client'` | `backend/auth-facade/src/main/resources/neo4j/migrations/V005__create_master_tenant.cypher` |
| Neo4j V004 creates role hierarchy | `SUPER_ADMIN -> ADMIN -> MANAGER -> USER -> VIEWER` | `backend/auth-facade/src/main/resources/neo4j/migrations/V004__create_default_roles.cypher` |
| Keycloak docker-compose has NO realm import volume | `command: start-dev`, no `--import-realm` flag | `infrastructure/docker/docker-compose.yml` (line 98-122) |
| AdminUserController does NOT exist | No file in auth-facade controller package | Verified via glob of `backend/auth-facade/src/main/java/com/ems/auth/controller/` |
| KeycloakIdentityProvider is the only provider adapter | Only `KeycloakIdentityProvider.java` in provider package | `backend/auth-facade/src/main/java/com/ems/auth/provider/KeycloakIdentityProvider.java` |
| Auth facade openapi.yaml exists | 53KB+ OpenAPI 3.1 spec | `backend/auth-facade/openapi.yaml` |

---

## 2. Documents to Create

### 2.1 Keycloak Local Development Setup Guide [PLANNED]

| Field | Value |
|-------|-------|
| **Path** | `docs/guides/keycloak-local-setup.md` |
| **Blocked By** | ISSUE-001b (Keycloak realm export must exist first) |
| **Audience** | Developers onboarding to the project |
| **Status Tag** | `[PLANNED]` -- cannot be written until `infrastructure/keycloak/realm-export.json` exists |

**Contents to document (once implemented):**
- Prerequisites (Docker, docker-compose)
- Starting Keycloak with `docker-compose up keycloak`
- Realm auto-import via volume mount and `--import-realm` flag
- Verifying realm creation at `http://localhost:8180/admin`
- Client configuration (`ems-auth-facade` or `ems-client`) with Direct Access Grants
- Default credentials table (Keycloak admin + application superuser)
- Common errors and their resolution

**Governance Rules Applicable:**
- Rule 1 (EBD): Must verify the realm-export.json file exists and the volume mount is configured before documenting
- Rule 2 (Three-State): Mark as `[IMPLEMENTED]` only after verifying `docker-compose up` successfully imports the realm
- Rule 5 (No Aspirational Content): Do not describe the realm configuration until the JSON file is committed

---

### 2.2 Superuser Authentication Runbook [PLANNED]

| Field | Value |
|-------|-------|
| **Path** | `runbooks/operations/RUNBOOK-011-KEYCLOAK-SUPERUSER.md` |
| **Blocked By** | ISSUE-001b + ISSUE-001c |
| **Audience** | Operations team, on-call engineers |
| **Status Tag** | `[PLANNED]` -- runbook number follows existing sequence (RUNBOOK-010 is the latest) |

**Contents to document (once implemented):**
- How to verify Keycloak is running with the correct realm
- How to reset the superuser password
- How to troubleshoot 404 on admin endpoints
- How to add a new user to a tenant
- Full runbook details specified in [Section 4](#4-runbook-keycloak-and-user-administration)

---

### 2.3 User Management API Reference [PLANNED]

| Field | Value |
|-------|-------|
| **Path** | `docs/api/user-management-api.md` |
| **Blocked By** | ISSUE-001d (AdminUserController must exist in auth-facade) |
| **Audience** | Frontend developers, API consumers |
| **Status Tag** | `[PLANNED]` -- AdminUserController.java does not yet exist |

**Note:** The user-service already has user CRUD endpoints at `backend/user-service/src/main/java/com/ems/user/controller/UserController.java`. However, ISSUE-001d specifies a NEW `AdminUserController` in auth-facade for tenant-scoped user management via Keycloak Admin API. The documentation must cover BOTH:

1. **auth-facade admin user endpoints** (NEW, from ISSUE-001d): `GET /api/v1/admin/tenants/{tenantId}/users`
2. **user-service endpoints** (EXISTING): `GET /api/v1/users`, `POST /api/v1/users`, etc.

**Existing user-service endpoints to document (ALREADY IMPLEMENTED):**

| Endpoint | Method | Status | Evidence |
|----------|--------|--------|----------|
| `/api/v1/users/me` | GET | [IMPLEMENTED] | `UserController.java` line 34 |
| `/api/v1/users/me` | PATCH | [IMPLEMENTED] | `UserController.java` line 44 |
| `/api/v1/users/me/sessions` | GET | [IMPLEMENTED] | `UserController.java` line 55 |
| `/api/v1/users/me/sessions/{sessionId}` | DELETE | [IMPLEMENTED] | `UserController.java` line 66 |
| `/api/v1/users/me/devices` | GET | [IMPLEMENTED] | `UserController.java` line 78 |
| `/api/v1/users/me/devices/{deviceId}/trust` | POST | [IMPLEMENTED] | `UserController.java` line 88 |
| `/api/v1/users/me/devices/{deviceId}` | DELETE | [IMPLEMENTED] | `UserController.java` line 99 |
| `/api/v1/users` | GET | [IMPLEMENTED] | `UserController.java` line 115 |
| `/api/v1/users/{userId}` | GET | [IMPLEMENTED] | `UserController.java` line 127 |
| `/api/v1/users` | POST | [IMPLEMENTED] | `UserController.java` line 136 |
| `/api/v1/users/{userId}` | PATCH | [IMPLEMENTED] | `UserController.java` line 148 |
| `/api/v1/users/{userId}` | DELETE | [IMPLEMENTED] | `UserController.java` line 157 |
| `/api/v1/users/{userId}/enable` | POST | [IMPLEMENTED] | `UserController.java` line 167 |
| `/api/v1/users/{userId}/disable` | POST | [IMPLEMENTED] | `UserController.java` line 177 |
| `/api/v1/users/{userId}/sessions` | GET | [IMPLEMENTED] | `UserController.java` line 188 |
| `/api/v1/users/{userId}/sessions` | DELETE | [IMPLEMENTED] | `UserController.java` line 198 |
| `/api/v1/users/{userId}/devices` | GET | [IMPLEMENTED] | `UserController.java` line 209 |
| `/api/v1/users/{userId}/devices/{deviceId}/block` | POST | [IMPLEMENTED] | `UserController.java` line 218 |
| `/api/v1/users/{userId}/devices/{deviceId}/approve` | POST | [IMPLEMENTED] | `UserController.java` line 231 |
| `/api/v1/admin/sessions` | GET | [IMPLEMENTED] | `UserController.java` line 248 |
| `/api/v1/admin/sessions` | DELETE | [IMPLEMENTED] | `UserController.java` line 257 |
| `/api/v1/internal/users/{keycloakId}/sync` | POST | [IMPLEMENTED] | `UserController.java` line 271 |

**Governance Rules Applicable:**
- Rule 1 (EBD): user-service endpoints can be documented now (code exists); auth-facade admin user endpoints cannot until ISSUE-001d is implemented
- Rule 2 (Three-State): Split clearly between `[IMPLEMENTED]` (user-service) and `[PLANNED]` (auth-facade AdminUserController)
- Rule 3 (Present Tense Requires Proof): Only use present tense for user-service endpoints; use future tense for auth-facade admin user endpoints

---

### 2.4 API Gateway Admin Route Documentation [PLANNED]

| Field | Value |
|-------|-------|
| **Path** | Update existing: `backend/api-gateway/README.md` or create `docs/api/gateway-routes.md` |
| **Blocked By** | ISSUE-001a (route must be added first) |
| **Audience** | Developers |

**Current state (verified):**

The `RouteConfig.java` at `backend/api-gateway/src/main/java/com/ems/gateway/config/RouteConfig.java` currently routes:
- `/api/v1/auth/**` to `http://localhost:8081` (auth-facade)
- `/api/v1/users/**` to `http://localhost:8083` (user-service)
- `/api/tenants/**` to `http://localhost:8082` (tenant-service)
- Other service routes as listed in RouteConfig.java

**Missing route (root cause of ISSUE-001a):**
- `/api/v1/admin/**` is NOT routed to auth-facade (port 8081)
- This causes the 404 when the frontend calls `GET /api/v1/admin/tenants/{tenantId}/providers`

Once ISSUE-001a is resolved, document:
- The new `/api/v1/admin/**` route to auth-facade
- Complete route table with all services

---

## 3. Documents to Update

### 3.1 ADR-004: Keycloak Authentication

| Field | Value |
|-------|-------|
| **Path** | `docs/adr/ADR-004-keycloak-authentication.md` |
| **Blocked By** | ISSUE-001b (realm bootstrapping implementation) |
| **Current Status** | Accepted (Partially Superseded) |

**Updates required after ISSUE-001b implementation:**

1. **Add Implementation Status table** following the MADR format:

```markdown
## Implementation Status

| Aspect | Status | Evidence |
|--------|--------|----------|
| BFF Pattern (auth-facade) | [IMPLEMENTED] | `AuthController.java`, `AuthServiceImpl.java` |
| Keycloak Integration | [IMPLEMENTED] | `KeycloakIdentityProvider.java` |
| Direct Access Grant | [IMPLEMENTED] | `KeycloakIdentityProvider.authenticate()` |
| Realm Bootstrapping | [PLANNED] | No realm-export.json exists |
| Per-tenant Realm Configuration | [PLANNED] | V005 uses 'master' realm only |
| Social Login (Google) | [IN-PROGRESS] 50% | Controller exists, no Keycloak IDP config |
| Social Login (Microsoft) | [IN-PROGRESS] 50% | Controller exists, no Keycloak IDP config |
| MFA (TOTP) | [IMPLEMENTED] | `AuthController.setupMfa()`, `AuthController.verifyMfa()` |
| Provider-Agnostic Abstraction | [IMPLEMENTED] | `IdentityProvider` interface, `AuthProperties` config |
```

2. **Add Keycloak Realm Bootstrap section** describing how the realm-export.json imports default configuration

**Governance Rules Applicable:**
- Rule 7 (ADR Status Lifecycle): Status must reflect actual implementation percentage, not just acceptance
- Rule 1 (EBD): Each `[IMPLEMENTED]` tag requires file path evidence
- Rule 5 (No Aspirational Content): Current ADR-004 already contains aspirational code samples (e.g., `KeycloakAuthService` class that does not exist); these must be annotated as design intent, not implementation

**DISCREPANCY FOUND:**
- ADR-004 line 146 shows `KeycloakAuthService` class. The actual implementation is `AuthServiceImpl.java` with `KeycloakIdentityProvider.java` handling Keycloak-specific logic. The ADR design intent differs from the implementation. This must be noted when updating.

---

### 3.2 arc42/05 Building Blocks

| Field | Value |
|-------|-------|
| **Path** | `docs/arc42/05-building-blocks.md` |
| **Blocked By** | ISSUE-001d (user management component) |

**Updates required:**

1. **Fix database discrepancy in Section 5.1 diagram and Service Matrix:**

**DISCREPANCY (pre-existing, verified from CLAUDE.md Known Discrepancies):**
The current diagram (lines 48-54) shows ALL services connected to Neo4j:
```
AF --> NEO
TS --> NEO
US --> NEO
LS --> NEO
NS --> NEO
AS --> NEO
AIS --> NEO
PS --> NEO
```

Reality (per `application.yml` files and docker-compose): Only `auth-facade` uses Neo4j. All other services use PostgreSQL. The Service Matrix at Section 5.5 (lines 119-128) incorrectly lists `Neo4j` as the database for all services.

This is a pre-existing discrepancy logged in CLAUDE.md. It must be corrected as part of this documentation cycle.

2. **Add user management context to auth-facade building block description** (after ISSUE-001d):
   - Add tenant-scoped user listing via Keycloak Admin API
   - Note the relationship between auth-facade (identity data in Keycloak/Neo4j) and user-service (profile data in PostgreSQL)

3. **Add AdminUserController to the auth-facade internal structure** (after ISSUE-001d)

**Governance Rules Applicable:**
- Rule 1 (EBD): Must read updated source files after ISSUE-001d implementation
- Rule 6 (Documentation Corrections): State what was wrong (Neo4j for all services), show actual state (PostgreSQL for non-auth services), correct with evidence

---

### 3.3 arc42/06 Runtime View

| Field | Value |
|-------|-------|
| **Path** | `docs/arc42/06-runtime-view.md` |
| **Blocked By** | ISSUE-001b + ISSUE-001c |

**Updates required:**

1. **Add superuser login sequence diagram** (new section 6.x):

```
Section Title: Superuser Login Flow (Master Tenant)
Participants: User, Frontend, API Gateway, auth-facade, Keycloak, Neo4j, Valkey
```

This diagram should show:
- Superuser submits credentials to `/api/v1/auth/login` with `X-Tenant-ID: master`
- auth-facade resolves master tenant Keycloak config from Neo4j (via `DynamicProviderResolver`)
- auth-facade delegates to `KeycloakIdentityProvider.authenticate()` using Direct Access Grant
- Keycloak validates credentials and returns tokens with `SUPER_ADMIN` role
- auth-facade checks role claims via `ProviderAgnosticRoleConverter`
- Response includes access token + refresh token

2. **Add admin provider listing flow** (new section 6.x):

This diagram should show:
- Admin navigates to tenant detail page
- Frontend calls `GET /api/v1/admin/tenants/{tenantId}/providers` via API Gateway
- API Gateway routes to auth-facade (requires ISSUE-001a fix first)
- auth-facade `AdminProviderController` calls `DynamicProviderResolver.listProviders()`
- `Neo4jProviderResolver` queries Neo4j for Config nodes
- Response with provider list

**Governance Rules Applicable:**
- Rule 1 (EBD): Sequence diagrams must match actual method signatures in source code
- Rule 3 (Present Tense Requires Proof): Only write present-tense descriptions after verifying the flow works end-to-end

---

### 3.4 Auth Facade LLD

| Field | Value |
|-------|-------|
| **Path** | `docs/lld/auth-facade-lld.md` |
| **Blocked By** | ISSUE-001d (user management endpoints) |

**Updates required:**

1. **Add Admin User Management API section** (Section 4.x) once `AdminUserController` is implemented:
   - `GET /api/v1/admin/tenants/{tenantId}/users` -- list users
   - `GET /api/v1/admin/tenants/{tenantId}/users/{userId}` -- get user
   - `POST /api/v1/admin/tenants/{tenantId}/users` -- create user
   - `PATCH /api/v1/admin/tenants/{tenantId}/users/{userId}` -- update user
   - `DELETE /api/v1/admin/tenants/{tenantId}/users/{userId}` -- delete user

2. **Update Section 11 (Implementation Status)** to reflect ISSUE-001 deliverables

3. **Update the LLD Section 10 (Supported Identity Providers):**

**DISCREPANCY:**
Section 10 (lines 961-973) lists Auth0, Okta, Azure AD, UAE Pass, Google, Microsoft, GitHub as "Configuration-ready." This is misleading. The only implemented provider adapter is `KeycloakIdentityProvider.java`. Configuration properties exist in `AuthProperties.java` but no adapter classes exist for any other provider.

Corrected status should be:
| Provider | Protocol | Implementation Status |
|----------|----------|----------------------|
| Keycloak | OIDC, SAML | `[IMPLEMENTED]` - `KeycloakIdentityProvider.java` |
| Auth0 | OIDC | `[PLANNED]` - No adapter class exists |
| Okta | OIDC | `[PLANNED]` - No adapter class exists |
| Azure AD | OIDC | `[PLANNED]` - No adapter class exists |
| UAE Pass | OAuth2 | `[PLANNED]` - No adapter class exists |
| Google | OIDC | `[PLANNED]` - No adapter class exists |
| Microsoft | OIDC | `[PLANNED]` - No adapter class exists |
| GitHub | OAuth2 | `[PLANNED]` - No adapter class exists |
| Generic SAML | SAML | `[PLANNED]` - No adapter class exists |
| Generic LDAP | LDAP | `[PLANNED]` - No adapter class exists |

**Governance Rules Applicable:**
- Rule 2 (Three-State): "Configuration-ready" is not a valid status tag; must use `[PLANNED]`
- Rule 5 (No Aspirational Content): Listing providers as "Configuration-ready" implies they work; they do not

---

### 3.5 Canonical Data Model

| Field | Value |
|-------|-------|
| **Path** | `docs/data-models/CANONICAL-DATA-MODEL.md` |
| **Blocked By** | ISSUE-001d (if new user management model is needed) |

**Assessment:**

The user-service already has a well-defined user model in PostgreSQL:
- `UserProfileEntity` (`backend/user-service/src/main/java/com/ems/user/entity/UserProfileEntity.java`)
- `UserSessionEntity` (`backend/user-service/src/main/java/com/ems/user/entity/UserSessionEntity.java`)
- `UserDeviceEntity` (`backend/user-service/src/main/java/com/ems/user/entity/UserDeviceEntity.java`)

The auth-facade has its own user representation in Neo4j:
- `UserNode` (`backend/auth-facade/src/main/java/com/ems/auth/graph/entity/UserNode.java`)

**Update required:** If ISSUE-001d introduces an `AdminUserController` in auth-facade that bridges Keycloak users to the application, the canonical data model must document:
- The relationship between Keycloak user identity, Neo4j UserNode, and PostgreSQL UserProfileEntity
- Which service is the source of truth for each attribute (email, roles, profile data)
- Cross-service reference pattern (keycloakId as the shared key)

**Governance Rules Applicable:**
- Rule 1 (EBD): Must read both `UserNode.java` and `UserProfileEntity.java` to verify field mappings
- CLAUDE.md Data Model Workflow: Changes to the canonical data model require BA -> SA -> DBA chain

---

### 3.6 OpenAPI Specification

| Field | Value |
|-------|-------|
| **Path** | `backend/auth-facade/openapi.yaml` |
| **Blocked By** | ISSUE-001a (must verify endpoints work) + ISSUE-001d (new endpoints) |

**Updates required:**
1. Add admin user management endpoints (after ISSUE-001d)
2. Verify existing admin provider endpoints match the actual controller (they appear to match based on current review)
3. Add error response schemas for new endpoints

---

## 4. Runbook: Keycloak and User Administration

**Target Path:** `runbooks/operations/RUNBOOK-011-KEYCLOAK-SUPERUSER.md`

**Status:** `[PLANNED]` -- All procedures below must be verified against actual implementation before writing the final runbook. The following is a structural draft.

### 4.1 Runbook Structure

```
RUNBOOK-011: Keycloak & User Administration
Version: 1.0.0
Status: PLANNED (blocked by ISSUE-001b, ISSUE-001c)
Severity: P0 - Critical path for authentication
```

### 4.2 Procedure 1: Verify Keycloak Is Running with Correct Realm

**Precondition:** Docker infrastructure is running via `docker-compose up`

| Step | Action | Expected Result | Verification Command |
|------|--------|-----------------|---------------------|
| 1 | Check Keycloak container status | Container `ems-keycloak` is running and healthy | `docker ps --filter name=ems-keycloak` |
| 2 | Access Keycloak admin console | Login page loads at `http://localhost:8180/admin` | `curl -s -o /dev/null -w "%{http_code}" http://localhost:8180/admin` returns 200 |
| 3 | Login to Keycloak admin | Dashboard loads with realm selector | Username: `admin`, Password: `admin` (from docker-compose env `KEYCLOAK_ADMIN`) |
| 4 | Verify application realm exists | Realm matching config in V005 migration appears in realm selector | Check realm list in admin console |
| 5 | Verify client exists | `ems-client` (or `ems-auth-facade`) client is listed under realm clients | Navigate to Clients tab in realm |
| 6 | Verify Direct Access Grants | Client has "Direct access grants" or "Service accounts" enabled | Client settings page |
| 7 | Test OIDC discovery | Discovery document returns valid JSON | `curl http://localhost:8180/realms/{realm}/.well-known/openid-configuration` |

**NOTE:** The exact realm name depends on ISSUE-001b implementation. Currently, V005 migration references the Keycloak `master` realm. The implementation may use a dedicated `ems` realm instead.

### 4.3 Procedure 2: Reset Superuser Password

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Access Keycloak admin console | `http://localhost:8180/admin` with admin/admin |
| 2 | Navigate to the application realm | Select the realm from the dropdown |
| 3 | Go to Users section | User list appears |
| 4 | Find the superuser | Search for `superadmin@emsist.com` (or configured email) |
| 5 | Click Credentials tab | Password management form appears |
| 6 | Set new password | Enter new password, toggle "Temporary" off |
| 7 | Save | Confirmation message |
| 8 | Verify login | `POST /api/v1/auth/login` with new credentials returns 200 |

**Alternative (via Keycloak Admin API):**
```bash
# Get admin token
ADMIN_TOKEN=$(curl -s -X POST \
  http://localhost:8180/realms/master/protocol/openid-connect/token \
  -d "client_id=admin-cli" \
  -d "username=admin" \
  -d "password=admin" \
  -d "grant_type=password" | jq -r '.access_token')

# Find user ID
USER_ID=$(curl -s \
  http://localhost:8180/admin/realms/{realm}/users?email=superadmin@emsist.com \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq -r '.[0].id')

# Reset password
curl -s -X PUT \
  http://localhost:8180/admin/realms/{realm}/users/$USER_ID/reset-password \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"type":"password","value":"new-password","temporary":false}'
```

### 4.4 Procedure 3: Troubleshoot 404 on Admin Endpoints

**Symptom:** Frontend shows "The requested resource was not found" when accessing the Local Authentication tab.

| Step | Check | Resolution |
|------|-------|------------|
| 1 | Is auth-facade running? | `curl http://localhost:8081/actuator/health` should return `{"status":"UP"}` |
| 2 | Does the route exist in API Gateway? | Check `RouteConfig.java` for `/api/v1/admin/**` route to port 8081 |
| 3 | Is the gateway routing correctly? | `curl -v http://localhost:8080/api/v1/admin/tenants/master/providers` -- check response headers for upstream |
| 4 | Is JWT authentication failing? | Check auth-facade logs: `docker logs ems-auth-facade 2>&1 \| grep -i "401\|403\|unauthorized"` |
| 5 | Is the tenant ID correct? | Frontend sends `tenantId` from tenant detail page. V005 migration uses `id: 'master'`. Verify match. |
| 6 | Is Neo4j reachable? | `curl http://localhost:7474` should return Neo4j browser |
| 7 | Is the V005 migration applied? | Connect to Neo4j Browser and run: `MATCH (t:Tenant {id: 'master'}) RETURN t` |
| 8 | Is the provider config present? | `MATCH (t:Tenant {id: 'master'})-[:CONFIGURED_WITH]->(c:Config) RETURN c` |

**Known Root Cause (ISSUE-001a):**
The API Gateway `RouteConfig.java` (line 23) only routes `/api/v1/auth/**` to auth-facade. The admin endpoints at `/api/v1/admin/**` have no route, causing the 404. This must be fixed by adding:
```java
.route("admin-providers", r -> r
    .path("/api/v1/admin/**")
    .uri("http://localhost:8081"))
```

### 4.5 Procedure 4: Add a New User to a Tenant

**Precondition:** Superuser is authenticated and has a valid JWT with ADMIN or SUPER_ADMIN role.

**Option A: Via user-service API (existing, [IMPLEMENTED])**

```bash
# Create user via user-service
curl -X POST http://localhost:8080/api/v1/users \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "X-Tenant-ID: master" \
  -H "X-User-ID: $SUPERUSER_KEYCLOAK_ID" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newuser@example.com",
    "firstName": "New",
    "lastName": "User",
    "role": "USER"
  }'
```

**Option B: Via auth-facade admin API (PLANNED, after ISSUE-001d)**

```bash
# Create user via auth-facade (also creates in Keycloak)
curl -X POST http://localhost:8080/api/v1/admin/tenants/master/users \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newuser@example.com",
    "firstName": "New",
    "lastName": "User",
    "roles": ["USER"]
  }'
```

**Option C: Via Keycloak Admin Console**
1. Login to `http://localhost:8180/admin`
2. Select the application realm
3. Navigate to Users > Add User
4. Fill in email, first name, last name
5. Go to Credentials tab and set password
6. Go to Role Mappings and assign appropriate realm roles
7. Sync to application: `POST /api/v1/internal/users/{keycloakId}/sync` (user-service internal endpoint at line 271 of UserController.java)

---

## 5. Developer Guide Updates

### 5.1 Local Development Setup

| Path | Status | Blocked By |
|------|--------|------------|
| `docs/guides/local-development-setup.md` (NEW) or update `backend/auth-facade/README.md` | [PLANNED] | ISSUE-001b |

**Content to include once ISSUE-001b is implemented:**

1. **Infrastructure startup sequence:**
   ```bash
   cd infrastructure/docker
   docker-compose up -d postgres valkey neo4j kafka zookeeper keycloak
   ```

2. **Wait for health checks:**
   - PostgreSQL: `pg_isready -U postgres`
   - Neo4j: `http://localhost:7474`
   - Keycloak: `http://localhost:8180/health/ready`
   - Valkey: `valkey-cli ping`

3. **Keycloak realm auto-import:**
   - Describe the `--import-realm` command flag
   - Describe the volume mount for `realm-export.json`
   - Note that first startup creates the realm; subsequent starts reuse existing data

4. **Start application services:**
   ```bash
   # From backend/ directory, or via IDE
   cd backend/auth-facade && mvn spring-boot:run
   cd backend/api-gateway && mvn spring-boot:run
   ```

### 5.2 Default Credentials Table

| System | Username | Password | Purpose | Source |
|--------|----------|----------|---------|--------|
| Keycloak Admin Console | `admin` | `admin` | Keycloak administration | `docker-compose.yml` env `KEYCLOAK_ADMIN` / `KEYCLOAK_ADMIN_PASSWORD` |
| Neo4j Browser | `neo4j` | `password123` | Graph database management | `docker-compose.yml` env `NEO4J_AUTH=neo4j/password123` |
| PostgreSQL | `postgres` | `postgres` | Relational database | `docker-compose.yml` env `POSTGRES_USER` / `POSTGRES_PASSWORD` |
| Grafana | `admin` | `admin` | Monitoring dashboard | `docker-compose.yml` env `GF_SECURITY_ADMIN_PASSWORD` |
| Application Superuser | `superadmin@emsist.com` | TBD | Application administration | Keycloak realm-export.json (ISSUE-001b) |

**Evidence:** All infrastructure credentials verified from `infrastructure/docker/docker-compose.yml` lines 13-15, 49, 105-106, 391.

**WARNING:** These are LOCAL DEVELOPMENT credentials only. Production credentials must NEVER be documented in plain text.

### 5.3 API Endpoint Reference for Admin Operations

**Existing endpoints (verified in source code):**

#### Auth Facade (port 8081)

| Category | Endpoint | Method | Controller | Auth Required |
|----------|----------|--------|------------|---------------|
| Authentication | `/api/v1/auth/login` | POST | `AuthController` | No (public) |
| Authentication | `/api/v1/auth/refresh` | POST | `AuthController` | No (public, needs refresh token) |
| Authentication | `/api/v1/auth/logout` | POST | `AuthController` | No (public, needs refresh token) |
| Authentication | `/api/v1/auth/me` | GET | `AuthController` | Yes (Bearer JWT) |
| Authentication | `/api/v1/auth/mfa/setup` | POST | `AuthController` | Yes (Bearer JWT) |
| Authentication | `/api/v1/auth/mfa/verify` | POST | `AuthController` | No (uses MFA session token) |
| Authentication | `/api/v1/auth/providers` | GET | `AuthController` | No (public) |
| Authentication | `/api/v1/auth/login/{provider}` | GET | `AuthController` | No (public) |
| Social Login | `/api/v1/auth/social/google` | POST | `AuthController` | No (public) |
| Social Login | `/api/v1/auth/social/microsoft` | POST | `AuthController` | No (public) |
| Admin Providers | `/api/v1/admin/tenants/{tenantId}/providers` | GET | `AdminProviderController` | Yes (ADMIN role) |
| Admin Providers | `/api/v1/admin/tenants/{tenantId}/providers/{providerId}` | GET | `AdminProviderController` | Yes (ADMIN role) |
| Admin Providers | `/api/v1/admin/tenants/{tenantId}/providers` | POST | `AdminProviderController` | Yes (ADMIN role) |
| Admin Providers | `/api/v1/admin/tenants/{tenantId}/providers/{providerId}` | PUT | `AdminProviderController` | Yes (ADMIN role) |
| Admin Providers | `/api/v1/admin/tenants/{tenantId}/providers/{providerId}` | PATCH | `AdminProviderController` | Yes (ADMIN role) |
| Admin Providers | `/api/v1/admin/tenants/{tenantId}/providers/{providerId}` | DELETE | `AdminProviderController` | Yes (ADMIN role) |
| Admin Providers | `/api/v1/admin/tenants/{tenantId}/providers/{providerId}/test` | POST | `AdminProviderController` | Yes (ADMIN role) |
| Admin Providers | `/api/v1/admin/tenants/{tenantId}/providers/validate` | POST | `AdminProviderController` | Yes (ADMIN role) |
| Admin Providers | `/api/v1/admin/tenants/{tenantId}/providers/cache/invalidate` | POST | `AdminProviderController` | Yes (ADMIN role) |
| Admin Users | `/api/v1/admin/tenants/{tenantId}/users` | GET | `AdminUserController` [PLANNED] | Yes (ADMIN role) |

#### User Service (port 8083)

| Category | Endpoint | Method | Controller | Auth Required |
|----------|----------|--------|------------|---------------|
| Self-Service | `/api/v1/users/me` | GET | `UserController` | Yes (X-User-ID header) |
| Self-Service | `/api/v1/users/me` | PATCH | `UserController` | Yes (X-User-ID header) |
| Self-Service | `/api/v1/users/me/sessions` | GET | `UserController` | Yes (X-User-ID header) |
| Self-Service | `/api/v1/users/me/sessions/{sessionId}` | DELETE | `UserController` | Yes (X-User-ID header) |
| Self-Service | `/api/v1/users/me/devices` | GET | `UserController` | Yes (X-User-ID header) |
| Self-Service | `/api/v1/users/me/devices/{deviceId}/trust` | POST | `UserController` | Yes (X-User-ID header) |
| Self-Service | `/api/v1/users/me/devices/{deviceId}` | DELETE | `UserController` | Yes (X-User-ID header) |
| Admin | `/api/v1/users` | GET | `UserController` | Yes (X-Tenant-ID header) |
| Admin | `/api/v1/users/{userId}` | GET | `UserController` | Yes (X-Tenant-ID header) |
| Admin | `/api/v1/users` | POST | `UserController` | Yes (X-Tenant-ID + X-User-ID) |
| Admin | `/api/v1/users/{userId}` | PATCH | `UserController` | Yes (X-Tenant-ID header) |
| Admin | `/api/v1/users/{userId}` | DELETE | `UserController` | Yes (X-Tenant-ID header) |
| Admin | `/api/v1/users/{userId}/enable` | POST | `UserController` | Yes (X-Tenant-ID header) |
| Admin | `/api/v1/users/{userId}/disable` | POST | `UserController` | Yes (X-Tenant-ID header) |
| Tenant Admin | `/api/v1/admin/sessions` | GET | `UserController` | Yes (X-Tenant-ID header) |
| Tenant Admin | `/api/v1/admin/sessions` | DELETE | `UserController` | Yes (X-Tenant-ID + X-User-ID) |
| Internal | `/api/v1/internal/users/{keycloakId}/sync` | POST | `UserController` | Internal only |

---

## 6. Documentation Governance Compliance

### Compliance Matrix

For each document artifact, the applicable governance rules from CLAUDE.md are listed below.

| Document | Rule 1 (EBD) | Rule 2 (Tags) | Rule 3 (Present Tense) | Rule 5 (No Aspirational) | Rule 6 (Corrections) | Rule 7 (ADR Status) |
|----------|:---:|:---:|:---:|:---:|:---:|:---:|
| Keycloak Setup Guide (2.1) | YES | YES | YES | YES | -- | -- |
| Superuser Runbook (2.2) | YES | YES | YES | YES | -- | -- |
| User Management API Ref (2.3) | YES | YES | YES | YES | -- | -- |
| API Gateway Route Doc (2.4) | YES | YES | YES | YES | -- | -- |
| ADR-004 Update (3.1) | YES | YES | YES | YES | YES | YES |
| arc42/05 Update (3.2) | YES | YES | YES | YES | YES | -- |
| arc42/06 Update (3.3) | YES | YES | YES | YES | -- | -- |
| Auth Facade LLD Update (3.4) | YES | YES | YES | YES | YES | -- |
| Canonical Data Model (3.5) | YES | YES | YES | YES | -- | -- |
| OpenAPI Spec (3.6) | YES | YES | -- | YES | -- | -- |
| RUNBOOK-011 (4) | YES | YES | YES | YES | -- | -- |
| Developer Guide (5) | YES | YES | YES | YES | -- | -- |

### Rule-by-Rule Enforcement Notes

**Rule 1 (Evidence-Before-Documentation):**
- Every `[IMPLEMENTED]` claim in the documents above must include a file path and line number reference
- The DOC agent must read the actual source file (not assume) before marking anything as implemented
- For ISSUE-001 deliverables: documentation can only be finalized AFTER the code is committed

**Rule 2 (Three-State Classification):**
- All documents must use `[IMPLEMENTED]`, `[IN-PROGRESS]`, or `[PLANNED]` tags
- "Configuration-ready" (currently used in LLD Section 10) is NOT a valid status tag and must be replaced
- Percentages should accompany `[IN-PROGRESS]` tags

**Rule 3 (Present Tense Requires Proof):**
- "The system does X" requires a cited source file
- "The API returns Y" requires an endpoint code reference
- "Users can Z" requires proof that the UI/API exists
- This plan uses future tense ("must", "will", "should") for all PLANNED items

**Rule 5 (No Aspirational Documentation):**
- ADR-004 contains aspirational code samples (`KeycloakAuthService` class) that differ from actual implementation
- LLD Section 10 lists providers as "Configuration-ready" when no adapter code exists
- These must be corrected to clearly separate design intent from implementation reality

**Rule 6 (Documentation Corrections):**
- When correcting arc42/05 database claims, state: "Previously documented as Neo4j for all services. Actual implementation: only auth-facade uses Neo4j; all other services use PostgreSQL (verified from application.yml files)."
- When correcting LLD provider statuses, state: "Previously listed as 'Configuration-ready'. Actual implementation: only KeycloakIdentityProvider.java exists (verified by searching provider package)."

**Rule 7 (ADR Status Lifecycle):**
- ADR-004 status must reflect implementation reality, not just acceptance
- Current status "Accepted (Partially Superseded)" is accurate for the decision status but does not communicate implementation percentage
- Add an Implementation Status section per MADR template

---

## 7. Implementation Schedule

### Dependency Order

Documentation must follow the implementation order:

```
Phase 1: ISSUE-001b implemented (Keycloak realm export)
  |
  +-- Write: Keycloak Setup Guide (2.1) [partial - setup portion]
  +-- Write: Default Credentials Table (5.2) [superuser row]
  +-- Write: RUNBOOK-011 Procedure 1 + 2 (4.2, 4.3)
  |
Phase 2: ISSUE-001a implemented (API Gateway route fix)
  |
  +-- Write: RUNBOOK-011 Procedure 3 (4.4) [verify fix works]
  +-- Update: API Gateway Route Doc (2.4)
  +-- Update: arc42/06 Runtime View (3.3) [admin provider listing flow]
  |
Phase 3: ISSUE-001c implemented (Superuser authentication works)
  |
  +-- Update: ADR-004 (3.1) [realm bootstrapping status]
  +-- Update: arc42/06 Runtime View (3.3) [superuser login flow]
  +-- Write: Keycloak Setup Guide (2.1) [complete - verification portion]
  +-- Write: RUNBOOK-011 Procedure 4 (4.5)
  |
Phase 4: ISSUE-001d implemented (Users tab + AdminUserController)
  |
  +-- Write: User Management API Reference (2.3) [auth-facade portion]
  +-- Update: Auth Facade LLD (3.4) [add user management section]
  +-- Update: arc42/05 Building Blocks (3.2) [add user management component]
  +-- Update: Canonical Data Model (3.5) [if needed]
  +-- Update: OpenAPI Spec (3.6) [add new endpoints]
  |
Phase 5: All issues complete
  |
  +-- Final: Verify all documents pass EBD checklist
  +-- Final: Update Discrepancy Log
  +-- Final: Cross-reference all documents
```

### Pre-existing Corrections (Can Be Done Immediately)

The following corrections do NOT depend on ISSUE-001 implementation and should be done now:

| Correction | Document | Details |
|------------|----------|---------|
| Fix database claims | `docs/arc42/05-building-blocks.md` | Change Neo4j to PostgreSQL for all non-auth-facade services |
| Fix provider statuses | `docs/lld/auth-facade-lld.md` Section 10 | Change "Configuration-ready" to `[PLANNED]` |
| Add Implementation Status section | `docs/adr/ADR-004-keycloak-authentication.md` | Add table with evidence-based status tags |

---

## 8. Verification Checklist

Before marking any document as complete, the DOC agent must verify:

- [ ] Source code read to verify all `[IMPLEMENTED]` claims (Rule 1)
- [ ] Status tags applied correctly: `[IMPLEMENTED]`, `[IN-PROGRESS]`, `[PLANNED]` (Rule 2)
- [ ] Evidence provided for every implementation claim (file path + line number) (Rule 1)
- [ ] No present-tense statements without proof (Rule 3)
- [ ] No aspirational content written as fact (Rule 5)
- [ ] Corrections state what was wrong and show evidence of actual state (Rule 6)
- [ ] ADR statuses reflect implementation reality with percentages (Rule 7)
- [ ] docker-compose.yml matches what documentation describes
- [ ] application.yml matches what documentation describes
- [ ] OpenAPI spec matches actual controller endpoints
- [ ] All cross-references between documents are valid
- [ ] New terms added to glossary (`docs/arc42/12-glossary.md`)
- [ ] Version and date updated on all modified documents
- [ ] No credentials or secrets in documentation (except local dev defaults with warning)
- [ ] Diagrams use C4 model notation where applicable
- [ ] Discrepancy log updated at `docs/governance/DISCREPANCY-LOG.md`

---

## Changelog

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-02-26 | Initial documentation plan for ISSUE-001 |

---

**Author:** DOC Agent
**Review Required By:** SA Agent (API contracts), ARCH Agent (arc42 updates), DEV Agent (code verification)
