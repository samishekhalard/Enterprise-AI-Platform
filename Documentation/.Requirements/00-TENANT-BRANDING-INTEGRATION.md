# Tenant Branding Integration

## Purpose

This worktree is the integration surface between:

- `R02 Tenant Management`
- `R14 Brand Studio`

It exists so the product can be reviewed through real Angular navigation:

- tenant list
- tenant factsheet
- Branding tab

without forcing either source worktree to absorb the other stream's ownership.

## Review Surfaces

- Real host flow: `/dev/parking`
- Isolated Brand Studio harness: `/brand-studio-preview`

`/dev/parking` is the primary product review surface for integrated navigation.

## Ownership Model

### R02 host responsibilities

- tenant list
- tenant factsheet shell
- tab navigation
- factsheet host layout
- parking flow orchestration

### R14 content responsibilities

- real Brand Studio UI
- branding runtime logic
- branding APIs
- branding persistence model
- branding publish/apply behavior

## Integration Rule

The Branding tab in the factsheet must host R14-owned content.

The target end state is:

```html
<app-branding-studio [tenantId]="tenantId"></app-branding-studio>
```

R02 remains the shell owner.
R14 remains the branding implementation owner.

## What Was Staged Into This Worktree

From `tenant-factsheet-spec`:

- `frontend/src/app/_parking/**/*`
- `Documentation/.Requirements/R02. TENANT MANAGEMENT/**/*`
- `frontend/e2e/parking-final.spec.ts`

From `brand-studio-spec`:

- `frontend/src/app/features/brand-studio/**/*`
- `frontend/src/app/features/administration/sections/tenant-manager/branding-studio/**/*`
- `frontend/src/app/shared/icon-picker/**/*`
- `frontend/src/app/core/theme/brand-runtime.service.ts`
- `Documentation/.Requirements/R14. BRAND STUDIO/**/*`
- brand-related backend controller/service/entity/repository/migration files

## Risk

This approach is workable, but there are real risks:

1. Source drift
If `tenant-factsheet-spec` or `brand-studio-spec` keep moving independently, this integration worktree can become stale quickly.

2. Duplicate truth
If the same component is edited in both the source worktree and this integration worktree, reconciliation becomes expensive.

3. Dirty-source carryover
Some staged assets came from uncommitted source work, so this worktree must be treated as the integration branch, not as a guaranteed replayable branch history yet.

## Recommendation

Use this worktree as the only place for:

- integrated Angular review
- Branding tab mounting
- host/content convergence

Do not continue UI design in the two source worktrees in parallel.

Preferred choreography:

1. freeze approved UI contract in R14
2. integrate it into `/dev/parking` here
3. validate navigation and interaction here
4. once stable, merge back deliberately into the owning branches

## Immediate Next Step

Mount the approved Brand Studio into the factsheet Branding tab in the parking flow, so `/dev/parking` becomes the single integrated review surface.
