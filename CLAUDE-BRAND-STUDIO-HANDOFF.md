Use this note for the `tenant-factsheet-spec` stream.

## Brand Studio Boundary

Brand Studio is now being designed in a separate worktree:

`/Users/mksulty/Claude/Projects/Emsist-app/.worktrees/brand-studio-spec`

Do not continue design or implementation work for Brand Studio in `tenant-factsheet-spec`.

This includes:

- brand runtime architecture
- theme sweep/runtime CSS-variable design
- palette-pack design
- typography-pack design
- asset-library design
- icon-library design for object definitions
- brand manifest / brand profile / draft-workspace design
- login branding architecture
- shell/splash/favicon brand loading architecture

## Required stop rule

Stop working on Brand Studio itself in this worktree.

If R02 needs a Branding tab placeholder or dependency note, keep it strictly to:

- placeholder shell only
- dependency reference only
- no competing architecture
- no duplicate domain model
- no parallel runtime design

Do not fork or redefine the Brand Studio architecture locally in `tenant-factsheet-spec`.

## Frozen decisions from the Brand Studio stream

These decisions are now frozen and must be treated as input, not re-designed here:

1. User-selectable "available brands" are `Starter Kits`, not live runtime brand profiles.
2. Colors are selected from a shared `Palette Pack` catalog.
3. Fonts are selected from a shared `Typography Pack` catalog.
4. Brand assets use internal media storage with governed metadata records.
5. Object-definition icons use a tenant-governed `Icon Library`.
6. The active runtime brand is one assembled `BrandProfile` manifest stored in per-tenant PostgreSQL.
7. Draft editing persists separately in `tenant_brand_draft`.
8. Frontend branding uses static compiled SCSS plus governed runtime style-tag injection only:
   - `tenant-brand-foundation-vars`
   - `tenant-brand-component-vars`
   - `tenant-brand-fonts`
9. Neo4j graph semantics are limited to:
   - `(:Tenant)-[:HAS_ACTIVE_BRAND]->(:BrandProfile)`
10. Tenant resolution for branding is driven primarily by hostname/login link.
11. Manual `tenantId` entry remains temporary dev/test-only behavior and is not the normal runtime design.
12. Default tenant brand fallback is the current existing live brand, not a redesigned baseline.

One fork is still open in the Brand Studio stream:

- single editable draft per tenant vs multiple drafts

Do not resolve that fork from this worktree unless explicitly asked.

## Required coordination back

Provide a counter-instruction back to the Brand Studio stream to avoid overlap.

That counter-instruction must explicitly list:

- files you still own in `tenant-factsheet-spec`
- routes/screens you still own
- whether you need a Branding tab placeholder
- whether you will touch tenant factsheet branding labels/messages only
- any API contracts you plan to reference but not define
- any file paths the Brand Studio stream must avoid touching while your work is in progress

The goal is zero overlap between:

- `tenant-factsheet-spec`
- `brand-studio-spec`

## Reference documents

Brand Studio decisions live here:

- `/Users/mksulty/Claude/Projects/Emsist-app/.worktrees/brand-studio-spec/Documentation/.Requirements/R14. BRAND STUDIO/Design/01-PRD-Brand-Studio.md`
- `/Users/mksulty/Claude/Projects/Emsist-app/.worktrees/brand-studio-spec/Documentation/.Requirements/R14. BRAND STUDIO/Design/04-Brand-Runtime-Contract.md`
- `/Users/mksulty/Claude/Projects/Emsist-app/.worktrees/brand-studio-spec/Documentation/.Requirements/R14. BRAND STUDIO/Design/07-Brand-Domain-and-Graph-Model.md`
- `/Users/mksulty/Claude/Projects/Emsist-app/.worktrees/brand-studio-spec/Documentation/.Requirements/R14. BRAND STUDIO/Design/08-Brand-Catalog-and-Assembly-Design.md`
