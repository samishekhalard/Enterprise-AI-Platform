# R14 Brand Domain and Graph Model

**Purpose:** define the authoritative domain model for tenant branding and clarify when branding is a stored aggregate versus when it is a graph relationship or projection.

For catalog selection, manifest assembly, and runtime CSS construction, see `08-Brand-Catalog-and-Assembly-Design.md`.

---

## 1. Decision Summary

### 1.1 What is correct

You are correct that branding must be treated as a first-class domain object with:

- identity
- attributes
- version history
- relations to tenant, assets, typography, and icon library

### 1.2 What is not automatically correct

Under the currently locked R02 target architecture, it is **not automatically correct** to make tenant branding's authoritative source of truth a Neo4j node.

R02 currently locks these target constraints:

- Neo4j Model B is for object definitions and object instances only.
- Branding currently belongs to the per-tenant PostgreSQL side of the tenant domain.

Evidence:

- `R02 PRD -- Tenant Management`, Section 13.2 says Neo4j target scope is object definitions and object instances only.
- `R02 PRD -- Tenant Management`, Section 13.5 maps branding to per-tenant PostgreSQL.

### 1.3 Required architectural split

For R14, the clean model is:

1. **Authoritative persistence**
   Tenant brand profiles and brand draft workspaces live in per-tenant PostgreSQL.
2. **Runtime source**
   Exactly one active brand profile is exposed as the active brand manifest for runtime.
3. **Optional graph projection**
   If the fact sheet or relationship visualization needs graph semantics, branding may be projected into Neo4j as a derived relationship view, but that projection must never become the source of truth.

### 1.4 System Cypher note

If the platform chooses to represent branding in the tenant graph, the first graph step is:

- register the `BrandProfile` and `HAS_ACTIVE_BRAND` metamodel in sanctioned System Cypher

This still does **not** make System Cypher or Neo4j the source of truth for runtime branding.

The order is:

1. sanction System Cypher metamodel
2. define `BrandProfile` and `HAS_ACTIVE_BRAND` in the metamodel
3. keep authoritative brand storage in per-tenant PostgreSQL
4. project active brand into tenant Neo4j after publish or rollback

---

## 2. Frozen Domain Model

### 2.1 Core aggregate

The root aggregate is:

- `Tenant`
- `BrandProfile`

Relationship:

- one tenant has exactly zero or one active brand profile
- one tenant may have one editable brand draft workspace at a time
- one tenant may have historical brand profiles for rollback/audit purposes

### 2.2 Supporting entities

The full brand domain should include:

- `BrandProfile`
- `BrandDraft`
- `BrandAsset`
- `TypographyPack`
- `PaletteProfile`
- `IconLibrary`
- `IconAsset`
- `BrandAuditEvent`

### 2.3 Why this split matters

- `BrandProfile` carries the active immutable snapshot used at runtime.
- `BrandDraft` carries the editable workspace without polluting active runtime.
- `BrandAsset` handles upload-backed media governance.
- `TypographyPack` supports the frozen predefined-font decision.
- `IconLibrary` supports the object-definition icon-library requirement.
- `BrandAuditEvent` supports publish, rollback, and drift-safe governance.

---

## 3. Frozen Authoritative Storage Model

### 3.1 Storage home `[TARGET]`

Authoritative records should live in per-tenant PostgreSQL, not Neo4j.

Frozen tables/records:

- `tenant_brand_profile`
- `tenant_brand_draft`
- `tenant_brand_asset`
- `tenant_brand_publish_event`
- `tenant_icon_library`
- `tenant_icon_asset`

`tenant_branding` in the current codebase is an `[AS-IS]` partial starting point, but it is a single mutable row and does not satisfy active-profile plus draft-workspace needs.

### 3.2 Why PostgreSQL should remain authoritative

- bootstrap/runtime fetch is deterministic
- versioning and rollback are easier to govern
- audit/event history is relational and transactional
- asset metadata and validation fit naturally
- current tenant-service already owns branding
- this avoids violating the locked R02 Neo4j boundary

---

## 4. Graph Semantics vs Storage Semantics

### 4.1 Fact-sheet semantics

In the tenant fact sheet, `HAS_BRANDING` is a valid domain relationship.

That means the UI and requirement model may legitimately say:

- `Tenant` has branding
- `Tenant` has an active brand
- `Tenant` has brand history

### 4.2 Storage semantics

That does **not** require Neo4j to be the system of record.

The fact-sheet relationship may be:

- a UI relationship
- a query-model relationship
- a projected graph relationship

without changing the authoritative storage model.

### 4.3 Required rule

If Neo4j is used for tenant-brand relationships at all, it must be a projection fed from publish events, not an independently editable source.

---

## 5. Frozen Graph Projection Rule

### 5.1 Frozen projected nodes

If a graph view is required, use these projected labels:

- `Tenant`
- `BrandProfile`

### 5.2 Frozen projected relationship

- `(Tenant)-[:HAS_ACTIVE_BRAND]->(BrandProfile)`

This is the only graph relationship required by the current design.

Typography, palette, assets, and icon-library membership do not need to be independently modeled in Neo4j unless a later visualization/query use case proves it is necessary.

### 5.3 Projection rule

Only publish, rollback, and active-brand reassignment events may update the graph projection.

Direct write flows from ad hoc Cypher or frontend screens into the projected graph must be forbidden.

---

## 6. BrandProfile Entity

### 6.1 Identity

Required identifiers:

- `brandProfileId`
- `tenantId`
- `profileVersion`
- `manifestVersion`

No graph status field is required.

Activity is expressed by the tenant relationship:

- the active profile is the one pointed to by `Tenant -[:HAS_ACTIVE_BRAND]-> BrandProfile`

### 6.3 Required attributes

Brand profile must carry:

- `name`
- `description`
- `primaryColor`
- `secondaryColor`
- `accentColor`
- `surfaceColor`
- `textColor`
- `fontPackId`
- `logoAssetId`
- `logoDarkAssetId`
- `faviconAssetId`
- `loginBackgroundAssetId`
- `appTitle`
- `loginHeadline`
- `loginSupportingText`
- `componentTokenOverrides`
- `iconLibraryId`
- `createdAt`
- `createdBy`
- `publishedAt`
- `publishedBy`

### 6.3 Runtime invariants

- only one active brand profile per tenant
- active runtime never reads from the draft workspace
- publish always creates or assigns a new active profile
- rollback creates or reassigns a prior profile as active without mutating audit history
- runtime reads only the active published manifest

### 6.4 BrandDraft workspace

Draft editing still needs persistence, but it does not require a graph status.

Frozen draft record:

- `draftId`
- `tenantId`
- `manifestJson`
- `lastValidatedAt`
- `updatedAt`
- `updatedBy`

The draft workspace is relational and editor-facing. It is not part of runtime graph projection.

---

## 7. BrandAsset Entity

### 7.1 Required asset types

- `LOGO_LIGHT`
- `LOGO_DARK`
- `FAVICON`
- `LOGIN_BACKGROUND`
- `ICON_LIBRARY_ARCHIVE`
- `ICON_SVG`

### 7.2 Required attributes

- `assetId`
- `tenantId`
- `kind`
- `storageKey`
- `publicUrl` or resolved delivery URL
- `mimeType`
- `checksum`
- `fileSize`
- `width`
- `height`
- `status`
- `createdAt`
- `createdBy`

### 7.3 Asset status

Frozen statuses:

- `UPLOADED`
- `VALIDATED`
- `ACTIVE`
- `REPLACED`
- `REJECTED`
- `DELETED`

---

## 8. TypographyPack Entity

Because F1 is frozen to a predefined font list, typography should be modeled as a governed catalog, not arbitrary uploads.

Required attributes:

- `fontPackId`
- `displayName`
- `fontFamilyStack`
- `headingWeight`
- `bodyWeight`
- `sourceType`
- `isDefault`
- `status`

Frozen source types:

- `SYSTEM`
- `GOOGLE_APPROVED`
- `SELF_HOSTED_APPROVED`

---

## 9. Icon Library Model

This supports your requirement that object definitions read from the uploaded library governed in Brand Studio.

### 9.1 IconLibrary

Required attributes:

- `iconLibraryId`
- `tenantId`
- `name`
- `source`
- `version`
- `status`
- `createdAt`
- `createdBy`
- `publishedAt`

Frozen statuses:

- `DRAFT`
- `PUBLISHED`
- `SUPERSEDED`
- `ARCHIVED`

### 9.2 IconAsset

Required attributes:

- `iconAssetId`
- `iconLibraryId`
- `iconKey`
- `displayName`
- `svgContent` or governed asset reference
- `tags`
- `status`

### 9.3 Runtime rule

Object-definition icon pickers must read from the tenant's active published icon library, not from hardcoded frontend arrays.

Default fallback library may be seeded from Phosphor or IconBuddy-approved assets, but tenant usage must still be governed through the same active library contract.

---

## 10. Frozen Cypher Projection Shape

If graph projection is sanctioned, the shape should be:

```cypher
(:Tenant {tenantId, slug, name, type, status})
  -[:HAS_ACTIVE_BRAND]->
(:BrandProfile {brandProfileId, profileVersion, publishedAt})
```

This is frozen as a projection/query model only.

---

## 11. Frozen Verdict for R14

Use this model:

- brand is a first-class domain entity with attributes and version history
- PostgreSQL is the authoritative store
- runtime reads the active published manifest from tenant-service
- Neo4j, if used, is only a derived relationship projection

Do not make brand editing write directly into Neo4j as the only stored source if R02 Model B remains locked as currently written.

That would conflict with:

- R02 Section 13.2 Neo4j boundary
- R02 Section 13.5 data residency map
- current tenant-service ownership of branding

If product later wants graph-native branding, then these documents must be reopened and changed together:

- `R02 PRD -- Tenant Management`, Section 13.2
- `R02 PRD -- Tenant Management`, Section 13.5
- `R14 Brand Runtime Contract`
- backend tenant-service persistence design

That would be an architecture change, not a local requirement tweak.
