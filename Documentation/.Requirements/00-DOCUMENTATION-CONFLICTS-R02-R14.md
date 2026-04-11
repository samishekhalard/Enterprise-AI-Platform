# Documentation Conflicts: R02 vs R14

## Purpose

This note records the documentation conflicts found between:

- `/Users/mksulty/Claude/Projects/Emsist-app/.worktrees/tenant-factsheet-spec/Documentation`
- `/Users/mksulty/Claude/Projects/Emsist-app/.worktrees/brand-studio-spec/Documentation`

The integration worktree should not delete or rename either source documentation tree until these conflicts are resolved.

## Summary

- Shared documentation files across both worktrees: `483`
- Shared-path files with different content: `62`

## Conflict Set

- `Architecture/01-introduction-goals.md`
- `Architecture/02-constraints.md`
- `Architecture/03-context-scope.md`
- `Architecture/04-solution-strategy.md`
- `Architecture/05-building-blocks.md`
- `Architecture/06-runtime-view.md`
- `Architecture/07-deployment-view.md`
- `Architecture/08-crosscutting.md`
- `Architecture/09-architecture-decisions.md`
- `Architecture/11-risks-technical-debt.md`
- `Architecture/12-glossary.md`
- `Architecture/README.md`
- `DOCUMENTATION-GOVERNANCE.md`
- `README.md`
- `design-system/COMPLIANCE-CHECKLIST.md`
- `design-system/DESIGN-SYSTEM-CONTRACT.md`
- `design-system/blocks/dashboard.md`
- `design-system/blocks/detail-page.md`
- `design-system/blocks/empty-state.md`
- `design-system/blocks/filter-bar.md`
- `design-system/blocks/form-page.md`
- `design-system/blocks/list-page.md`
- `design-system/blocks/settings-page.md`
- `design-system/component-showcase.html`
- `design-system/components/tag.md`
- `design-system/patterns/date-time.md`
- `design-system/patterns/error-handling.md`
- `design-system/patterns/form-validation.md`
- `design-system/patterns/loading-states.md`
- `design-system/patterns/pagination.md`
- `design-system/patterns/search.md`
- `design-system/patterns/table-actions.md`
- `design-system/tokens.css`
- `lld/auth-facade-lld.md`
- `lld/auth-providers-lld.md`
- `lld/database-durability-strategy.md`
- `lld/deployment-installer-blueprint.md`
- `lld/graph-per-tenant-lld.md`
- `lld/integration-hub-spec.md`
- `lld/license-service-onprem-lld.md`
- `prototypes/index.html`
- `togaf/01-architecture-vision.md`
- `togaf/02-business-architecture.md`
- `togaf/03-data-architecture.md`
- `togaf/04-application-architecture.md`
- `togaf/05-technology-architecture.md`
- `togaf/07-migration-planning.md`
- `togaf/08-implementation-governance.md`
- `togaf/09-architecture-change-management.md`
- `togaf/README.md`
- `togaf/artifacts/building-blocks/ABB-001-identity-orchestration.md`
- `togaf/artifacts/building-blocks/ABB-002-tenant-context-enforcement.md`
- `togaf/artifacts/catalogs/application-portfolio-catalog.md`
- `togaf/artifacts/catalogs/business-capability-catalog.md`
- `togaf/artifacts/catalogs/data-entity-catalog.md`
- `togaf/artifacts/catalogs/technology-standard-catalog.md`
- `togaf/artifacts/diagrams/README.md`
- `togaf/artifacts/matrices/application-to-data-matrix.md`
- `togaf/artifacts/matrices/application-to-technology-matrix.md`
- `togaf/artifacts/matrices/capability-to-service-matrix.md`
- `togaf/artifacts/principles/architecture-principles.md`
- `togaf/governance/review-checklist.md`

## Decision Needed

Before destructive cleanup, one of these must be chosen:

1. `tenant-factsheet-spec/Documentation` wins for all shared paths.
2. `brand-studio-spec/Documentation` wins for all shared paths.
3. Shared paths are resolved selectively file by file.

## User Decision Applied

The following buckets now use
`/Users/mksulty/Claude/Projects/Emsist-app/.worktrees/tenant-factsheet-spec/Documentation`
as source of truth:

- `Architecture/*`
- `lld/*`
- `togaf/*`
- `design-system/component-showcase.html`
- `design-system/DESIGN-SYSTEM-CONTRACT.md`
- `design-system/tokens.css`

Additional user decision:

- all remaining shared-path conflicts also use
  `/Users/mksulty/Claude/Projects/Emsist-app/.worktrees/tenant-factsheet-spec/Documentation`
  as source of truth

This resolves all `62` conflicting shared-path files in favor of
`tenant-factsheet-spec/Documentation`.

## Remaining Unresolved Conflicts

None. Shared documentation-path conflicts between the two source worktrees are fully resolved by policy:

- source of truth for shared documentation paths: `tenant-factsheet-spec/Documentation`

## Current Safe Operating Rule

Until the above is decided:

- `tenant-branding-integration` owns the integrated frontend/code path.
- `tenant-factsheet-spec` and `brand-studio-spec` remain intact as source worktrees.
- No destructive deletion of either source documentation tree should be performed.
