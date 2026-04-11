# R14 Brand Catalog and Assembly Design

**Purpose:** define what the Brand Studio user selects from, where each choice is stored, how the active brand is assembled, and how runtime CSS is constructed.

---

## 1. What the user selects from

The Brand Studio UI should not expose a single vague "brand list".

It should expose five governed selectors:

1. **Brand Starter Kit**
2. **Palette Pack**
3. **Typography Pack**
4. **Asset Library**
5. **Icon Library**

Each selector has a different storage home and responsibility.

---

## 2. Frozen selector model

### 2.1 Brand Starter Kit

This is the closest thing to an "available brands" list.

What it is:

- a curated starting configuration
- not the active runtime brand itself
- used to initialize or accelerate draft authoring

User-facing control:

- `Starter Kit` dropdown or card picker

Frozen stored name:

- `platform_brand_starter_kit`

Frozen fields:

- `starterKitId`
- `name`
- `description`
- `previewThumbnailAssetId`
- `basePalettePackId`
- `baseTypographyPackId`
- `baseComponentRecipeId`
- `isDefault`
- `status`

Frozen storage home:

- master/shared PostgreSQL

Reason:

- starter kits are platform-curated, not tenant-owned

### 2.2 Palette Pack

What it is:

- a governed set of semantic colors and derived aliases

User-facing control:

- `Palette Pack` dropdown
- optional preview tiles

Frozen stored name:

- `platform_palette_pack`

Frozen fields:

- `palettePackId`
- `name`
- `description`
- `primary`
- `secondary`
- `accent`
- `surface`
- `surfaceRaised`
- `text`
- `textMuted`
- `border`
- `success`
- `warning`
- `error`
- `info`
- `isDefault`
- `status`

Frozen storage home:

- master/shared PostgreSQL

Reason:

- palette packs should be centrally governed
- tenant draft chooses one and may optionally apply bounded overrides

### 2.3 Typography Pack

What it is:

- the approved font family stack and role mapping

User-facing control:

- `Typography Pack` dropdown

Frozen stored name:

- `platform_typography_pack`

Frozen fields:

- `typographyPackId`
- `name`
- `description`
- `headingFontFamily`
- `bodyFontFamily`
- `monoFontFamily`
- `headingWeightScale`
- `bodyWeightScale`
- `fontSourceType`
- `preloadManifestJson`
- `isDefault`
- `status`

Frozen storage home:

- master/shared PostgreSQL

Reason:

- F1 is frozen to a predefined approved font list
- typography must stay centrally governed

### 2.4 Asset Library

What it is:

- tenant-owned uploaded brand assets

User-facing controls:

- `Logo`
- `Dark Logo`
- `Favicon`
- `Login Background`

Frozen stored name:

- `tenant_brand_asset`

Frozen fields:

- `assetId`
- `tenantId`
- `kind`
- `displayName`
- `storageKey`
- `deliveryUrl`
- `mimeType`
- `checksum`
- `width`
- `height`
- `fileSize`
- `createdAt`
- `createdBy`

Frozen storage home:

- per-tenant PostgreSQL metadata
- internal media/object storage for file bytes

Reason:

- F2 is frozen to internal media
- asset bytes should not live in database blobs

### 2.5 Icon Library

What it is:

- the tenant-approved icon set used by object definitions

User-facing control:

- `Icon Library` selector

Frozen stored names:

- `tenant_icon_library`
- `tenant_icon_asset`

Frozen fields for library:

- `iconLibraryId`
- `tenantId`
- `name`
- `description`
- `sourceType`
- `version`
- `manifestJson`
- `createdAt`
- `createdBy`

Frozen fields for icon:

- `iconAssetId`
- `iconLibraryId`
- `iconKey`
- `displayName`
- `svgContent` or governed asset reference
- `tagsJson`

Frozen storage home:

- per-tenant PostgreSQL

Reason:

- this is tenant-specific governed content
- object-definition icon pickers must read from the tenant's active icon library, not from hardcoded arrays

---

## 3. What is saved for the tenant

### 3.1 Draft workspace

During editing, save one tenant draft record:

- `tenant_brand_draft`

Frozen fields:

- `tenantId`
- `draftManifestJson`
- `selectedStarterKitId`
- `selectedPalettePackId`
- `selectedTypographyPackId`
- `selectedIconLibraryId`
- `updatedAt`
- `updatedBy`

This is the editable workspace only.

### 3.2 Active brand profile

When the user publishes, create or replace:

- `tenant_brand_profile`

Frozen fields:

- `brandProfileId`
- `tenantId`
- `profileVersion`
- `manifestJson`
- `publishedAt`
- `publishedBy`

This is the runtime snapshot.

### 3.3 Neo4j relation

Frozen graph relation only:

- `(:Tenant)-[:HAS_ACTIVE_BRAND]->(:BrandProfile)`

This is enough for fact-sheet semantics.

---

## 4. Frozen manifest construction

The active manifest is a normalized assembled JSON document.

Frozen top-level shape:

```json
{
  "brandProfileId": "bp_2026_0001",
  "tenantId": "acme",
  "version": 3,
  "starterKitId": "starter-enterprise-warm",
  "palettePackId": "palette-warm-enterprise",
  "typographyPackId": "type-gotham-rounded",
  "iconLibraryId": "icons-acme-v2",
  "foundation": {
    "palette": {},
    "typography": {},
    "motion": {},
    "shape": {}
  },
  "assets": {
    "logoLight": {},
    "logoDark": {},
    "favicon": {},
    "loginBackground": {}
  },
  "surfaces": {
    "login": {},
    "shell": {},
    "splash": {}
  },
  "components": {
    "button": {},
    "input": {},
    "dialog": {},
    "table": {},
    "tag": {}
  },
  "objectDefinitions": {
    "iconLibraryId": "icons-acme-v2"
  },
  "metadata": {
    "appTitle": "Acme EMSIST",
    "themeColor": "#428177"
  }
}
```

---

## 5. How the manifest is assembled

The backend assembles the active manifest in this order:

1. start from the current platform default baseline
2. apply selected starter kit defaults
3. apply selected palette pack
4. apply selected typography pack
5. apply active asset references
6. apply active icon-library reference
7. apply allowed tenant-level overrides
8. normalize and validate
9. persist the final manifest snapshot in `tenant_brand_profile.manifestJson`

This avoids reconstructing brand logic on every frontend screen.

---

## 6. How frontend runtime should call it

### 6.1 Backend endpoint contract

Frozen runtime endpoint:

- `GET /api/tenants/resolve`

Returned payload should include:

- tenant identity
- active brand manifest

Optional separate endpoint if needed:

- `GET /api/tenants/{tenantId}/brand/active`

But the preferred path is one bootstrap payload, not multiple fragmented calls.

### 6.2 Frontend service names

Frozen services:

- `TenantContextService`
- `BrandManifestService`
- `BrandRuntimeService`

Responsibilities:

- `TenantContextService`
  resolves tenant context from hostname/link
- `BrandManifestService`
  exposes the resolved active manifest as a single typed source
- `BrandRuntimeService`
  resets old branding, injects CSS variables, updates assets, updates PrimeNG, and marks brand-ready state

---

## 7. How SCSS/CSS should be constructed

### 7.1 What not to do

Do not generate per-tenant `.scss` files.

Do not compile tenant-specific stylesheets during runtime.

Do not allow scattered direct `setProperty()` calls across feature components.

### 7.2 Frozen model

Keep one static compiled design-system stylesheet.

All app components should keep consuming semantic tokens such as:

- `--tp-primary`
- `--tp-surface`
- `--tp-text`
- `--nm-radius-md`

At runtime, construct brand CSS through dedicated injected style blocks.

Frozen DOM ids:

- `tenant-brand-foundation-vars`
- `tenant-brand-component-vars`
- `tenant-brand-fonts`

### 7.3 Style block responsibilities

`tenant-brand-foundation-vars`

- foundation palette tokens
- typography family variables
- shape/motion variables
- global metadata variables

`tenant-brand-component-vars`

- component-level token aliases
- bounded overrides for button, input, dialog, table, tag, etc.

`tenant-brand-fonts`

- approved `@font-face` declarations only when self-hosted approved fonts are used
- otherwise preload links and family variables only

### 7.4 Construction algorithm

`BrandRuntimeService` should:

1. remove any existing injected brand tags
2. create `tenant-brand-foundation-vars`
3. create `tenant-brand-component-vars`
4. create `tenant-brand-fonts` if needed
5. append them to `document.head`
6. update favicon
7. update title and theme-color metadata
8. update logo and surface asset bindings through manifest-aware component bindings

---

## 8. Where each value comes from

### 8.1 Colors

User selects from:

- `Palette Pack`

Saved in:

- `tenant_brand_draft.selectedPalettePackId`
- final resolved values in `tenant_brand_profile.manifestJson.foundation.palette`

Called in runtime as:

- semantic CSS variables in `tenant-brand-foundation-vars`

### 8.2 Fonts

User selects from:

- `Typography Pack`

Saved in:

- `tenant_brand_draft.selectedTypographyPackId`
- final resolved values in `tenant_brand_profile.manifestJson.foundation.typography`

Called in runtime as:

- `--tp-font-family-heading`
- `--tp-font-family-body`
- `--tp-font-family-mono`

### 8.3 Brand choice

User selects from:

- `Starter Kit`

Saved in:

- `tenant_brand_draft.selectedStarterKitId`

Used for:

- pre-filling palette, typography, component recipe, and asset defaults in the draft

### 8.4 Assets

User selects/uploads from:

- tenant asset library

Saved in:

- `tenant_brand_asset`
- resolved asset references inside `tenant_brand_profile.manifestJson.assets`

### 8.5 Object-definition icons

User selects from:

- `Icon Library`

Saved in:

- `tenant_icon_library`
- `tenant_icon_asset`
- final active reference in `tenant_brand_profile.manifestJson.objectDefinitions.iconLibraryId`

---

## 9. Frozen verdict

Frozen design verdict:

- available brands for selection should be **Starter Kits**, not runtime brand profiles
- fonts should come from **Typography Pack catalog**
- colors should come from **Palette Pack catalog**
- assets should come from **tenant asset library**
- object-definition icons should come from **tenant icon library**
- the tenant's active runtime brand should be one assembled **BrandProfile manifest**
- SCSS should remain static; runtime should inject only governed CSS-variable blocks
