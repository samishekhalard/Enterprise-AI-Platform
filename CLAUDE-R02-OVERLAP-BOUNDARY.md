# R14 Brand Studio — R02 Overlap Boundary

**Source:** `/Users/mksulty/Claude/Projects/Emsist-app/.worktrees/tenant-factsheet-spec/CLAUDE-R02-COUNTER-INSTRUCTION.md`
**Purpose:** make the R02/R14 ownership boundary explicit inside the `brand-studio-spec` worktree.

---

## Hard avoid

Do not edit these from `brand-studio-spec` while R02 is in progress:

- `frontend/src/app/_parking/**/*`
- `Documentation/.Requirements/R02. TENANT MANAGEMENT/**/*`

This includes:

- parking preview
- tenant list parking screens
- tenant factsheet parking shell
- create tenant parking wizard
- lifecycle parking dialogs
- all R02 requirement docs and parking prototypes

---

## Coordinate first

These are shared files with active R02 edits. R14 may touch them only under the additive-only rules below:

- `frontend/src/styles.scss`
  - allowed: add new brand token groups
  - not allowed: modify or remove existing R02 `--tp-*` / `--p-*` groups
- `frontend/src/app/core/api/models.ts`
  - allowed: add Brand-related types
  - not allowed: modify Tenant-related types
- `Documentation/design-system/component-showcase.html`
  - allowed: add new sections
  - not allowed: modify existing sections `1-25`
- `Documentation/design-system/DESIGN-SYSTEM-CONTRACT.md`
  - allowed: add entries
  - not allowed: remove existing entries
- `Documentation/design-system/components/*.md`
  - allowed: add new files
  - not allowed: modify R02's newly added component docs

---

## Safe zones for R14

These paths are clear for Brand Studio work:

- `frontend/src/app/features/administration/sections/tenant-manager/branding-studio/**/*`
- `Documentation/.Requirements/R14. BRAND STUDIO/**/*`
- any new `frontend/src/app/features/brand-studio/**/*`
- any new `frontend/src/app/shared/brand-*/**/*`

---

## Branding tab boundary

R02 owns:

- the tenant factsheet shell
- the Branding tab entry in the tab list
- the placeholder Branding tab shell in parking

R14 owns:

- the real Brand Studio editor
- runtime brand resolution
- CSS variable injection
- brand manifest/profile assembly

Rule:

- do not edit the R02 placeholder implementation in `_parking`
- if R14 later replaces placeholder content, that replacement must happen outside R02-owned parking files

---

## API boundary

R02 may reference but does not define:

- `GET /api/tenants/{id}/branding`
- `PUT /api/tenants/{id}/branding`
- `GET /api/tenants/{id}/branding/draft`
- brand manifest / brand profile schema

R14 owns those branding contracts.

R14 should not redefine R02-owned tenant lifecycle APIs.

---

## Neo4j boundary

R02 owns:

- `(:Tenant)` properties
- `(:Tenant)-[:HAS_USER]->(:User)`
- `(:Tenant)-[:HAS_INTEGRATION]->(:Provider)`
- `(:Tenant)-[:HAS_DEFINITION]->(:ObjectType)`
- `(:Tenant)-[:HAS_AGENT]->(:Agent)`

R14 owns:

- `(:Tenant)-[:HAS_ACTIVE_BRAND]->(:BrandProfile)`

Do not redefine other `:Tenant` relationships from the Brand Studio stream.

---

## Working rule for this worktree

When in doubt:

1. do not touch `_parking`
2. do not touch `R02` requirement docs
3. keep shared-file edits additive only
4. put Brand Studio implementation in R14-owned paths
