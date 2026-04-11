# API Contract: Localization Service

**Version:** 2.0.0
**Date:** March 11, 2026
**Status:** [IMPLEMENTED] — 22 endpoints verified in controller code; 5 tenant override endpoints [PLANNED]
**Owner:** SA Agent

**Base URL:** `/api/v1`
**Service Port:** 8091
**Gateway Routes:** 4 routes in [RouteConfig.java:25-36](backend/api-gateway/src/main/java/com/ems/gateway/config/RouteConfig.java#L25-L36)

---

## 1. Endpoint Summary

| # | Method | Path | Auth | Description |
|---|--------|------|------|-------------|
| 1 | GET | `/admin/locales` | SUPER_ADMIN | List all system locales (paginated) |
| 2 | GET | `/admin/locales/{id}` | SUPER_ADMIN | Get locale by ID |
| 3 | PUT | `/admin/locales/{id}/activate` | SUPER_ADMIN | Activate a locale |
| 4 | PUT | `/admin/locales/{id}/deactivate` | SUPER_ADMIN | Deactivate a locale |
| 5 | PUT | `/admin/locales/{id}/set-alternative` | SUPER_ADMIN | Set as alternative locale |
| 6 | GET | `/admin/locales/{id}/format-config` | SUPER_ADMIN | Get format config for locale |
| 7 | PUT | `/admin/locales/{id}/format-config` | SUPER_ADMIN | Update format config |
| 8 | GET | `/admin/dictionary` | SUPER_ADMIN | List dictionary entries (paginated) |
| 9 | GET | `/admin/dictionary/{id}` | SUPER_ADMIN | Get single entry with translations |
| 10 | PUT | `/admin/dictionary/translations` | SUPER_ADMIN | Update translations for an entry |
| 11 | GET | `/admin/dictionary/export` | SUPER_ADMIN | Export dictionary as CSV |
| 12 | POST | `/admin/dictionary/import/preview` | SUPER_ADMIN | Upload CSV and preview changes |
| 13 | POST | `/admin/dictionary/import/commit` | SUPER_ADMIN | Commit previewed import |
| 14 | GET | `/admin/dictionary/versions` | SUPER_ADMIN | List version history |
| 15 | GET | `/admin/dictionary/versions/{id}` | SUPER_ADMIN | Get version detail with snapshot |
| 16 | POST | `/admin/dictionary/rollback/{versionId}` | SUPER_ADMIN | Rollback to version |
| 17 | GET | `/admin/dictionary/coverage` | SUPER_ADMIN | Get coverage stats per locale |
| 18 | GET | `/locales/active` | Public | List active locales |
| 19 | GET | `/locales/detect` | Public | Detect locale from Accept-Language |
| 20 | GET | `/locales/{code}/bundle` | Public | Get translation bundle |
| 21 | GET | `/user/locale` | Authenticated | Get user's locale preference |
| 22 | PUT | `/user/locale` | Authenticated | Set user's locale preference |
| 23 | GET | `/admin/tenant/{tenantId}/overrides` | ADMIN | List tenant translation overrides [PLANNED] |
| 24 | POST | `/admin/tenant/{tenantId}/overrides` | ADMIN | Create or update tenant override [PLANNED] |
| 25 | DELETE | `/admin/tenant/{tenantId}/overrides/{id}` | ADMIN | Remove tenant override [PLANNED] |
| 26 | POST | `/admin/tenant/{tenantId}/overrides/import` | ADMIN | Import overrides from CSV [PLANNED] |
| 27 | GET | `/admin/tenant/{tenantId}/overrides/export` | ADMIN | Export overrides as CSV [PLANNED] |

---

## 2. Authentication Matrix

| Path Pattern | Required Role | Public? |
|--------------|---------------|---------|
| `/admin/**` | `ROLE_SUPER_ADMIN` | No |
| `/locales/active` | None | Yes (`.permitAll()`) |
| `/locales/detect` | None | Yes (`.permitAll()`) |
| `/locales/{code}/bundle` | None | Yes (`.permitAll()`) |
| `/user/locale` | Any authenticated | No |
| `/admin/tenant/*/overrides/**` | `ROLE_ADMIN` | No |

**Evidence:** [SecurityConfig.java](backend/localization-service/src/main/java/com/ems/localization/config/SecurityConfig.java)

**Note:** `ROLE_SUPER_ADMIN` manages global locales and dictionary. `ROLE_ADMIN` (Tenant Admin) manages overrides scoped to their own tenant. Tenant ID is validated against JWT `tenant_id` claim to prevent IDOR.

---

## 3. Key Endpoint Details

### 3.1 GET `/admin/locales`

**Query Parameters:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `page` | int | 0 | Page number |
| `size` | int | 10 | Page size |
| `search` | string | | Filter by name or code |

**Response:** `200 OK`
```json
{
  "content": [
    {
      "id": 1,
      "code": "en-US",
      "name": "English (United States)",
      "country_code": "US",
      "lcid": 1033,
      "text_direction": "LTR",
      "is_active": true,
      "is_alternative": true,
      "activated_at": "2026-03-01T00:00:00Z",
      "created_at": "2026-03-01T00:00:00Z",
      "updated_at": "2026-03-01T00:00:00Z"
    }
  ],
  "totalElements": 10,
  "totalPages": 1,
  "number": 0,
  "size": 10
}
```

### 3.2 PUT `/admin/locales/{id}/deactivate`

**Response:** `200 OK`
```json
{
  "id": 3,
  "code": "fr-FR",
  "is_active": false,
  "migrated_users": 5
}
```

**Error Responses:**
| Status | Code | Condition |
|--------|------|-----------|
| 409 | `LOC-E-001` | Cannot deactivate alternative locale |
| 409 | `LOC-E-002` | Cannot deactivate last active locale |

### 3.3 GET `/locales/{code}/bundle`

**Response:** `200 OK`
```json
{
  "locale": "ar-AE",
  "version": 48,
  "entries": {
    "auth.login.welcome": "مرحباً بكم في EMSIST",
    "auth.login.sign_in": "تسجيل الدخول"
  }
}
```

**Headers:**
| Header | Value | Purpose |
|--------|-------|---------|
| `X-Bundle-Version` | `48` | For client-side cache invalidation polling |
| `Cache-Control` | `public, max-age=300` | 5-minute browser cache |

**Error:** `404` if locale code not found or not active

### 3.4 POST `/admin/dictionary/import/preview`

**Request:** `multipart/form-data` with `file` field (CSV)

**Response:** `200 OK`
```json
{
  "preview_token": "abc123-preview-token",
  "total_rows": 500,
  "rows_to_update": 12,
  "new_keys": 3,
  "errors": 0,
  "error_details": [],
  "expires_at": "2026-03-11T10:30:00Z"
}
```

**Error Responses:**
| Status | Code | Condition |
|--------|------|-----------|
| 400 | `LOC-E-003` | Empty CSV file |
| 413 | `LOC-E-004` | File exceeds 10MB |
| 429 | `LOC-E-005` | Rate limit exceeded (5 imports/hr) |

### 3.5 PUT `/user/locale`

**Request:**
```json
{
  "locale_code": "ar-AE"
}
```

**Response:** `200 OK`
```json
{
  "user_id": "user-123",
  "locale_code": "ar-AE",
  "preference_source": "MANUAL"
}
```

**Error:** `422` if locale_code is not an active locale

### 3.6 GET `/locales/{code}/bundle` — Tenant-Aware [PLANNED]

When `X-Tenant-ID` header is present, the bundle merges global translations with tenant overrides (overlay pattern).

**Request Headers:**
| Header | Required | Description |
|--------|----------|-------------|
| `X-Tenant-ID` | Optional | Tenant UUID — if absent, returns global-only bundle |

**Response:** Same structure as §3.3. Override values replace global values for matching keys.

**Cache Key Pattern:**
- No tenant header: `bundle:global:{localeCode}`
- With tenant header: `bundle:{tenantId}:{localeCode}`

**Cache Invalidation:**
- Global dictionary change → invalidate ALL keys matching `bundle:*:{localeCode}`
- Tenant override change → invalidate only `bundle:{tenantId}:{localeCode}`

### 3.7 GET `/admin/tenant/{tenantId}/overrides` [PLANNED]

**Query Parameters:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `page` | int | 0 | Page number |
| `size` | int | 20 | Page size |
| `locale_code` | string | | Filter by locale code |
| `search` | string | | Filter by key or override value |

**Response:** `200 OK`
```json
{
  "content": [
    {
      "id": 1,
      "tenant_id": "tenant-abc",
      "entry_id": 42,
      "technical_name": "admin.dashboard.title",
      "locale_code": "en-US",
      "global_value": "Dashboard",
      "override_value": "Command Center",
      "override_source": "MANUAL",
      "is_active": true,
      "created_at": "2026-03-11T10:00:00Z",
      "updated_at": "2026-03-11T10:00:00Z"
    }
  ],
  "totalElements": 15,
  "totalPages": 1,
  "number": 0,
  "size": 20
}
```

**Error:** `403` if JWT `tenant_id` does not match path `{tenantId}`

### 3.8 POST `/admin/tenant/{tenantId}/overrides` [PLANNED]

**Request:**
```json
{
  "entry_id": 42,
  "locale_code": "en-US",
  "override_value": "Command Center"
}
```

**Response:** `201 Created` (new) or `200 OK` (upsert on existing entry_id + locale_code)
```json
{
  "id": 1,
  "tenant_id": "tenant-abc",
  "entry_id": 42,
  "technical_name": "admin.dashboard.title",
  "locale_code": "en-US",
  "override_value": "Command Center",
  "override_source": "MANUAL",
  "is_active": true
}
```

**Error Responses:**
| Status | Code | Condition |
|--------|------|-----------|
| 400 | `LOC-E-010` | `entry_id` does not exist in `dictionary_entries` |
| 400 | `LOC-E-011` | `locale_code` is not an active locale |
| 403 | `LOC-E-012` | Tenant ID mismatch (IDOR protection) |

### 3.9 DELETE `/admin/tenant/{tenantId}/overrides/{id}` [PLANNED]

**Response:** `204 No Content`

**Error Responses:**
| Status | Code | Condition |
|--------|------|-----------|
| 404 | `LOC-E-013` | Override not found |
| 403 | `LOC-E-012` | Tenant ID mismatch |

### 3.10 POST `/admin/tenant/{tenantId}/overrides/import` [PLANNED]

**Request:** `multipart/form-data` with `file` field (CSV)

**CSV Format:**
```csv
technical_name,locale_code,override_value
admin.dashboard.title,en-US,Command Center
admin.dashboard.title,ar-AE,مركز القيادة
```

**Response:** `200 OK`
```json
{
  "imported": 25,
  "updated": 10,
  "skipped": 2,
  "errors": 0,
  "error_details": []
}
```

**Error Responses:**
| Status | Code | Condition |
|--------|------|-----------|
| 400 | `LOC-E-003` | Empty CSV file |
| 400 | `LOC-E-014` | CSV injection detected (`=`, `+`, `-`, `@` prefix) |
| 413 | `LOC-E-004` | File exceeds 10MB |
| 429 | `LOC-E-005` | Rate limit exceeded |

### 3.11 GET `/admin/tenant/{tenantId}/overrides/export` [PLANNED]

**Response:** `200 OK` with `Content-Type: text/csv`

**CSV columns:** `technical_name`, `locale_code`, `global_value`, `override_value`, `override_source`, `is_active`

---

## 4. Error Response Format

All error responses follow a consistent structure:

```json
{
  "timestamp": "2026-03-11T09:45:00Z",
  "status": 409,
  "error": "Conflict",
  "code": "LOC-E-001",
  "message": "Cannot deactivate alternative locale. Change the alternative locale first.",
  "path": "/api/v1/admin/locales/2/deactivate"
}
```

---

## 5. Gateway Route Configuration

**Evidence:** [RouteConfig.java:25-36](backend/api-gateway/src/main/java/com/ems/gateway/config/RouteConfig.java#L25-L36)

| Route | Path Pattern | Target |
|-------|-------------|--------|
| localization-admin | `/api/v1/admin/locales/**`, `/api/v1/admin/dictionary/**` | `lb://localization-service` |
| localization-tenant-admin | `/api/v1/admin/tenant/*/overrides/**` | `lb://localization-service` |
| localization-public | `/api/v1/locales/**` | `lb://localization-service` |
| localization-user | `/api/v1/user/locale` | `lb://localization-service` |

**SA Condition GW-03 [OPEN]:** Route for user locale uses `/api/v1/user/locale**` (wildcard) — should be exact path `/api/v1/user/locale` to prevent unintended matches.

**[PLANNED]** The `localization-tenant-admin` route will be added to [RouteConfig.java](backend/api-gateway/src/main/java/com/ems/gateway/config/RouteConfig.java) when tenant overrides are implemented.

---

## Changelog

| Version | Date | Changes |
|---------|------|---------|
| 2.0.0 | 2026-03-11 | Added 5 tenant override endpoints (#23-#27) [PLANNED]; tenant-aware bundle §3.6; ROLE_ADMIN auth for tenant routes; error codes LOC-E-010 through LOC-E-014; gateway route for tenant-admin |
| 1.0.0 | 2026-03-11 | Initial API contract with all 22 endpoints, auth matrix, error codes |
