# R14 Brand API and Persistence Spec

**Purpose:** define the authoritative backend contract for Brand Studio: PostgreSQL persistence, API endpoints, payloads, publish flow, rollback flow, and bootstrap load.

---

## 1. Scope

This document defines the authoritative runtime path for branding.

It does **not** define Neo4j metamodel/projection details. Those are separated into:

- `10-Brand-System-Cypher-Projection-Spec.md`

---

## 2. Frozen architectural rule

Authoritative brand data lives in per-tenant PostgreSQL under tenant-service.

Neo4j is not the source of truth for:

- active brand
- draft workspace
- palette selection
- typography selection
- asset selection
- icon-library selection

---

## 3. As-is evidence

Current codebase state:

- backend branding endpoints currently expose only:
  - `GET /api/tenants/{tenantId}/branding`
  - `PUT /api/tenants/{tenantId}/branding`
  - `POST /api/tenants/{tenantId}/branding/validate`
  Evidence:
  - `backend/tenant-service/src/main/java/com/ems/tenant/controller/TenantController.java:325-350`
- frontend currently calls only:
  - `getTenantBranding`
  - `updateTenantBranding`
  - `validateTenantBranding`
  - `resolveTenant`
  Evidence:
  - `frontend/src/app/core/api/api-gateway.service.ts:369-399`
- current request DTO is a flat mutable branding payload:
  - `backend/tenant-service/src/main/java/com/ems/tenant/controller/dto/BrandingUpdateRequest.java:8-57`
- current frontend types expose a flat mutable `TenantBranding` model:
  - `frontend/src/app/core/api/models.ts:312-365`

This is insufficient for:

- draft separation
- publish
- rollback
- asset governance
- icon-library governance
- deterministic bootstrap manifest

---

## 4. Frozen persistence model

### 4.1 Shared/master catalog tables

These are platform-governed catalogs.

#### `platform_brand_starter_kit`

Columns:

- `starter_kit_id`
- `name`
- `description`
- `preview_thumbnail_asset_id`
- `base_palette_pack_id`
- `base_typography_pack_id`
- `base_component_recipe_json`
- `is_default`
- `status`
- `created_at`
- `updated_at`

#### `platform_palette_pack`

Columns:

- `palette_pack_id`
- `name`
- `description`
- `primary`
- `secondary`
- `accent`
- `surface`
- `surface_raised`
- `text`
- `text_muted`
- `border`
- `success`
- `warning`
- `error`
- `info`
- `is_default`
- `status`
- `created_at`
- `updated_at`

#### `platform_typography_pack`

Columns:

- `typography_pack_id`
- `name`
- `description`
- `heading_font_family`
- `body_font_family`
- `mono_font_family`
- `heading_weight_scale_json`
- `body_weight_scale_json`
- `font_source_type`
- `preload_manifest_json`
- `is_default`
- `status`
- `created_at`
- `updated_at`

### 4.2 Per-tenant tables

#### `tenant_brand_asset`

Columns:

- `asset_id`
- `tenant_id`
- `kind`
- `display_name`
- `storage_key`
- `delivery_url`
- `mime_type`
- `checksum`
- `file_size`
- `width`
- `height`
- `created_at`
- `created_by`
- `replaced_by_asset_id`

Kinds:

- `LOGO_LIGHT`
- `LOGO_DARK`
- `LOGIN_BACKGROUND`

Note:

- `FAVICON` is not a direct user-managed asset in phase 1.
- backend/browser integration derives the browser favicon from the active light/dark logo set and current theme context.

#### `tenant_icon_library`

Columns:

- `icon_library_id`
- `tenant_id`
- `name`
- `description`
- `source_type`
- `version`
- `manifest_json`
- `created_at`
- `created_by`

#### `tenant_icon_asset`

Columns:

- `icon_asset_id`
- `icon_library_id`
- `icon_key`
- `display_name`
- `svg_content`
- `tags_json`
- `created_at`

#### `tenant_brand_draft`

Exactly one editable draft workspace per tenant.

Columns:

- `tenant_id`
- `draft_manifest_json`
- `selected_starter_kit_id`
- `selected_palette_pack_id`
- `selected_typography_pack_id`
- `selected_icon_library_id`
- `updated_at`
- `updated_by`
- `last_validated_at`

#### `tenant_brand_profile`

Immutable runtime snapshots.

Columns:

- `brand_profile_id`
- `tenant_id`
- `profile_version`
- `manifest_json`
- `published_at`
- `published_by`
- `rolled_back_from_profile_id`

#### `tenant_brand_audit_event`

Columns:

- `event_id`
- `tenant_id`
- `event_type`
- `actor_id`
- `target_brand_profile_id`
- `target_asset_id`
- `target_icon_library_id`
- `summary`
- `details_json`
- `created_at`

Event types:

- `DRAFT_SAVED`
- `DRAFT_VALIDATED`
- `ASSET_UPLOADED`
- `ASSET_REPLACED`
- `ICON_LIBRARY_UPLOADED`
- `BRAND_PUBLISHED`
- `BRAND_ROLLED_BACK`

---

## 5. Frozen API surface

### 5.1 Bootstrap / runtime read

#### `GET /api/tenants/resolve`

Purpose:

- resolve tenant from hostname/login link
- return tenant identity plus active runtime brand in one payload

Frozen response shape:

```json
{
  "tenant": {
    "id": "acme",
    "name": "Acme",
    "slug": "acme",
    "domain": "acme.example.com"
  },
  "activeBrand": {
    "brandProfileId": "bp_0003",
    "manifestVersion": 1,
    "profileVersion": 3,
    "manifest": {}
  }
}
```

Rule:

- this is the preferred runtime entrypoint
- frontend should not make a second unrelated brand bootstrap request if `resolve` already returned `activeBrand`

### 5.2 Fact-sheet/detail reads

#### `GET /api/tenants/{tenantId}/branding`

Purpose:

- return current active brand profile summary for admin/detail viewing

#### `GET /api/tenants/{tenantId}/branding/draft`

Purpose:

- return the editable draft workspace for Brand Studio

#### `GET /api/tenants/{tenantId}/branding/history`

Purpose:

- list prior brand profiles for compare/rollback

### 5.3 Draft editing

#### `PUT /api/tenants/{tenantId}/branding/draft`

Purpose:

- update the tenant draft workspace

Frozen request shape:

```json
{
  "selectedStarterKitId": "starter-enterprise-warm",
  "selectedPalettePackId": "palette-warm-enterprise",
  "selectedTypographyPackId": "type-gotham-rounded",
  "selectedIconLibraryId": "icons-acme-v2",
  "manifestOverrides": {
    "metadata": {},
    "components": {},
    "surfaces": {}
  }
}
```

#### `POST /api/tenants/{tenantId}/branding/draft/validate`

Purpose:

- validate current draft without publishing

### 5.4 Assets

#### `POST /api/tenants/{tenantId}/branding/assets`

Purpose:

- upload brand assets to internal media storage

Request:

- multipart form-data

Response:

- `assetId`
- `kind`
- `deliveryUrl`
- metadata

#### `GET /api/tenants/{tenantId}/branding/assets`

Purpose:

- list tenant brand assets

### 5.5 Icon library

#### `POST /api/tenants/{tenantId}/branding/icon-library`

Purpose:

- upload or replace tenant icon library package

#### `GET /api/tenants/{tenantId}/branding/icon-library`

Purpose:

- list/select available tenant icon libraries

### 5.6 Publish and rollback

#### `POST /api/tenants/{tenantId}/branding/publish`

Purpose:

- assemble and activate a new `BrandProfile` from the current tenant draft

Frozen response:

- new `brandProfileId`
- `profileVersion`
- active manifest summary

#### `POST /api/tenants/{tenantId}/branding/rollback`

Purpose:

- restore a prior `BrandProfile` as active

Frozen request:

```json
{
  "targetBrandProfileId": "bp_0002"
}
```

---

## 6. Publish flow

Frozen publish flow:

1. read current tenant draft
2. read selected starter kit
3. read selected palette pack
4. read selected typography pack
5. read selected asset references
6. read selected icon-library reference
7. merge on top of platform default baseline
8. validate final manifest
9. persist immutable `tenant_brand_profile`
10. emit brand audit event
11. update tenant graph projection if enabled
12. invalidate runtime caches

---

## 7. Rollback flow

Frozen rollback flow:

1. load requested historical `tenant_brand_profile`
2. verify tenant ownership
3. create or assign new active profile head
4. emit audit event
5. update tenant graph projection if enabled
6. invalidate runtime caches

Rule:

- rollback must not mutate old history in place

---

## 8. Manifest ownership

### Backend owns

- default baseline merge
- starter-kit merge
- palette resolution
- typography resolution
- asset resolution
- icon-library active reference
- final manifest normalization

### Frontend owns

- rendering
- runtime CSS-variable injection
- asset binding
- PrimeNG token application
- preview-session isolation

Rule:

- frontend should consume the assembled manifest
- frontend should not reconstruct the brand from raw relational pieces on every screen

---

## 9. Frontend type changes required

Current flat `TenantBranding` and `UpdateTenantBrandingRequest` are insufficient.

Add new types in frontend API models for:

- `ActiveBrandResolvePayload`
- `BrandDraft`
- `BrandProfile`
- `PalettePackSummary`
- `TypographyPackSummary`
- `BrandAssetSummary`
- `IconLibrarySummary`
- `PublishBrandRequest`
- `RollbackBrandRequest`

Keep tenant types separate from brand types per the R02 boundary.

---

## 10. Build order

Frozen implementation order:

1. add persistence tables/models
2. add draft APIs
3. add asset APIs
4. add icon-library APIs
5. add publish/rollback APIs
6. extend `resolve` to return `activeBrand`
7. wire frontend runtime services

Do not build runtime CSS injection before the backend can return one authoritative active manifest.
