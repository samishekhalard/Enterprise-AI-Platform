# ISSUE-001: Master Tenant Authentication & Superuser Configuration

| Field | Value |
|-------|-------|
| **ID** | ISSUE-001 |
| **Title** | Master Tenant Authentication, Superuser & User Management |
| **Priority** | P0 - Critical |
| **Type** | Bug + Feature Request |
| **Status** | OPEN |
| **Created** | 2026-02-26 |
| **Assignee** | SDLC Agent Team |
| **Sprint** | Current |
| **Epic** | Authentication & Identity Management |

---

## Summary

The Master Tenant administration page has critical authentication infrastructure gaps: the "Local Authentication" tab shows no identity providers despite a Keycloak config existing in Neo4j migrations, a 404 error appears on the page, no superuser is pre-configured in Keycloak for local development, and there is no "Users" tab to list tenant users.

---

## Sub-Issues

### ISSUE-001a: Identity Providers Not Displayed (404 Error)

| Field | Value |
|-------|-------|
| **Type** | Bug |
| **Severity** | Critical |
| **Component** | Frontend (administration.page.ts) + Backend (API Gateway routing) |

**Current Behavior:**
- The "Local Authentication" tab on the Master Tenant detail page shows "No Identity Providers"
- A 404 error banner appears: "The requested resource was not found."
- Screenshot evidence: see `/docs/issues/screenshots/` (attached by reporter)

**Expected Behavior:**
- The default Keycloak provider (created by `V005__create_master_tenant.cypher`) should appear in the identity providers list
- No 404 errors

**Root Cause Analysis:**

The frontend calls:
```
GET http://localhost:8080/api/v1/admin/tenants/{tenantId}/providers
```

via `ProviderAdminService` (`frontend/src/app/features/admin/identity-providers/services/provider-admin.service.ts`).

The backend `AdminProviderController` exists at:
```
backend/auth-facade/src/main/java/com/ems/auth/controller/AdminProviderController.java
```

Possible causes:
1. **API Gateway not routing** `/api/v1/admin/**` to auth-facade (port 8081)
2. **Auth-facade service not running** or not registered with gateway
3. **Authorization filter rejecting** the request before reaching the controller (missing/invalid JWT, missing ADMIN role)
4. **Tenant ID mismatch** between frontend (`a0000000-0000-0000-0000-000000000001`) and Neo4j (`master`)

**Files to Investigate:**
- `backend/api-gateway/src/main/resources/application.yml` — Route definitions
- `backend/auth-facade/src/main/java/com/ems/auth/controller/AdminProviderController.java` — Controller mapping
- `backend/auth-facade/src/main/java/com/ems/auth/security/` — Security filters
- `frontend/src/app/features/admin/identity-providers/services/provider-admin.service.ts` — API call (line 60)

**Acceptance Criteria:**
- [ ] API Gateway routes `/api/v1/admin/tenants/**` to auth-facade
- [ ] `GET /api/v1/admin/tenants/master/providers` returns the Keycloak config from V005 migration
- [ ] Frontend "Local Authentication" tab displays the Keycloak provider card
- [ ] No 404 error on the page

---

### ISSUE-001b: Superuser Not Configured in Keycloak

| Field | Value |
|-------|-------|
| **Type** | Feature Request |
| **Severity** | Critical |
| **Component** | Infrastructure (Keycloak) + Backend (auth-facade) |

**Current State:**
- Keycloak starts with only the built-in `admin` console user (`KEYCLOAK_ADMIN=admin`)
- No application-level superuser exists in any Keycloak realm
- No realm export/import JSON file exists for bootstrapping
- The `ems-auth-facade` client referenced in config may not exist in Keycloak

**Required State:**
- A Keycloak realm (e.g., `master` or `ems`) must have:
  - A client: `ems-auth-facade` (or `ems-client`) with proper configuration
  - A superuser account (e.g., `superadmin@emsist.com`) with `SUPER_ADMIN` role
  - Direct Access Grants enabled for the client
  - Proper role mappings (realm roles matching Neo4j role hierarchy from V004)

**Deliverables:**
- [ ] Keycloak realm export JSON for local dev bootstrapping
- [ ] Pre-configured client with correct redirect URIs, scopes, and grant types
- [ ] Superuser account with `SUPER_ADMIN` realm role
- [ ] Docker-compose volume mount to auto-import realm on startup
- [ ] Documentation of default credentials for local development

**Files to Create/Modify:**
- `infrastructure/keycloak/realm-export.json` (NEW) — Realm configuration
- `backend/docker-compose.yml` — Add volume mount for realm import
- `infrastructure/docker/docker-compose.yml` — Add volume mount for realm import

---

### ISSUE-001c: Superuser Authentication Through Auth-Facade

| Field | Value |
|-------|-------|
| **Type** | Feature Request |
| **Severity** | High |
| **Component** | Backend (auth-facade) |

**Current State:**
- `AuthController.login()` accepts email/password and delegates to `KeycloakIdentityProvider.authenticate()`
- The provider uses Keycloak's Direct Access Grant (Resource Owner Password Credentials)
- Token parsing extracts roles from `realm_access.roles` claim path
- But no actual user exists in Keycloak to authenticate against

**Required State:**
- Superuser can POST to `/api/v1/auth/login` with credentials and receive a valid JWT
- The JWT contains `SUPER_ADMIN` role in the claims
- Auth-facade correctly resolves the master tenant's Keycloak provider config from Neo4j
- Token refresh and logout work for the superuser session

**Acceptance Criteria:**
- [ ] `POST /api/v1/auth/login` with superuser credentials returns `200 OK` with access/refresh tokens
- [ ] Access token contains `SUPER_ADMIN` in `realm_access.roles`
- [ ] `GET /api/v1/auth/me` returns the superuser profile
- [ ] Token refresh works via `POST /api/v1/auth/refresh`
- [ ] Frontend can use the token to access admin pages

---

### ISSUE-001d: Users Tab Missing on Tenant Detail Page

| Field | Value |
|-------|-------|
| **Type** | Feature Request |
| **Severity** | Medium |
| **Component** | Frontend (administration.page.ts) |

**Current State:**
- Tenant detail page has 5 tabs: Overview, Locale Definition, Local Authentication, Branding, Licenses
- No "Users" tab exists
- No user listing API endpoint exists in auth-facade

**Required State:**
- A "Users" tab on the tenant detail page
- Lists all users belonging to the tenant
- User data sourced from Keycloak (via auth-facade) or Neo4j UserNode
- Displays: name, email, roles, status, last login
- Supports pagination and search

**Deliverables:**
- [ ] Backend: New endpoint `GET /api/v1/admin/tenants/{tenantId}/users` in auth-facade
- [ ] Backend: Service to fetch users from Keycloak Admin API for the tenant's realm
- [ ] Frontend: New "Users" tab component on tenant detail page
- [ ] Frontend: User list with table, pagination, search, and role badges
- [ ] Frontend: Empty state when no users exist

**Files to Create/Modify:**
- `backend/auth-facade/src/main/java/com/ems/auth/controller/AdminUserController.java` (NEW)
- `backend/auth-facade/src/main/java/com/ems/auth/service/UserManagementService.java` (NEW)
- `frontend/src/app/features/admin/users/` (NEW feature module)
- `frontend/src/app/pages/administration/administration.page.ts` — Add Users tab

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│  FRONTEND (Angular)                                             │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  Administration Page                                     │    │
│  │  ├── Local Authentication Tab                            │    │
│  │  │   └── ProviderEmbeddedComponent                       │    │
│  │  │       └── GET /api/v1/admin/tenants/{id}/providers    │    │
│  │  └── Users Tab (NEW)                                     │    │
│  │      └── UserListComponent (NEW)                         │    │
│  │          └── GET /api/v1/admin/tenants/{id}/users (NEW)  │    │
│  └─────────────────────────────────────────────────────────┘    │
│                              │                                   │
│                              ▼                                   │
├─────────────────────────────────────────────────────────────────┤
│  API GATEWAY (:8080)                                            │
│  Route: /api/v1/admin/** → auth-facade:8081                     │
│  Route: /api/v1/auth/** → auth-facade:8081                      │
├─────────────────────────────────────────────────────────────────┤
│  AUTH-FACADE (:8081)                                            │
│  ├── AdminProviderController (EXISTS)                           │
│  │   └── DynamicProviderResolver → Neo4j (ConfigNode)           │
│  ├── AdminUserController (NEW)                                  │
│  │   └── KeycloakAdminAPI → Keycloak realm users                │
│  └── AuthController (EXISTS)                                    │
│      └── KeycloakIdentityProvider → Keycloak Direct Access      │
├─────────────────────────────────────────────────────────────────┤
│  KEYCLOAK (:8180)                                               │
│  ├── master realm (auto-created)                                │
│  │   └── admin/admin (console only)                             │
│  ├── ems realm (NEW - from realm-export.json)                   │
│  │   ├── Client: ems-auth-facade                                │
│  │   ├── User: superadmin@emsist.com / SUPER_ADMIN role         │
│  │   └── Roles: SUPER_ADMIN, ADMIN, MANAGER, USER, VIEWER      │
│  └── Volume: ./keycloak/realm-export.json                       │
├─────────────────────────────────────────────────────────────────┤
│  NEO4J (:7687)                                                  │
│  ├── V005: Master Tenant → Keycloak Config (EXISTS)             │
│  ├── V004: Role Hierarchy (EXISTS)                              │
│  └── V006: Default Groups (EXISTS)                              │
└─────────────────────────────────────────────────────────────────┘
```

---

## Dependencies Between Sub-Issues

```
ISSUE-001b (Keycloak superuser config)
    │
    ▼
ISSUE-001c (Auth-facade superuser login)
    │
    ▼
ISSUE-001a (Fix 404 + show providers)
    │
    ▼
ISSUE-001d (Users tab)
```

**ISSUE-001b must be completed first** — without a configured Keycloak realm/client/user, nothing downstream can work.

---

## Affected Files Inventory

### Backend
| File | Action | Sub-Issue |
|------|--------|-----------|
| `backend/api-gateway/src/main/resources/application.yml` | VERIFY/FIX routes | 001a |
| `backend/auth-facade/.../AdminProviderController.java` | VERIFY working | 001a |
| `backend/auth-facade/.../AdminUserController.java` | CREATE | 001d |
| `backend/auth-facade/.../UserManagementService.java` | CREATE | 001d |
| `backend/auth-facade/.../KeycloakIdentityProvider.java` | VERIFY auth flow | 001c |
| `backend/docker-compose.yml` | ADD realm import volume | 001b |

### Frontend
| File | Action | Sub-Issue |
|------|--------|-----------|
| `frontend/.../administration.page.ts` | ADD Users tab | 001d |
| `frontend/.../provider-admin.service.ts` | VERIFY API URL | 001a |
| `frontend/.../users/` (new module) | CREATE | 001d |

### Infrastructure
| File | Action | Sub-Issue |
|------|--------|-----------|
| `infrastructure/keycloak/realm-export.json` | CREATE | 001b |
| `infrastructure/docker/docker-compose.yml` | ADD realm import | 001b |

---

## Labels

`authentication` `keycloak` `master-tenant` `superuser` `identity-providers` `user-management` `P0` `bug` `feature`
