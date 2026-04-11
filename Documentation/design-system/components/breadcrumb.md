# Breadcrumb

**Component:** `p-breadcrumb` (BreadcrumbModule)
**Status:** [DOCUMENTED]
**PrimeNG:** v21 — `Breadcrumb` standalone component

## Token Map

| Token | Value | Usage |
|-------|-------|-------|
| `--tp-breadcrumb-bg` | `transparent` | No background |
| `--tp-breadcrumb-color` | `var(--tp-text-muted)` | Inactive crumbs |
| `--tp-breadcrumb-active-color` | `var(--tp-text-dark)` | Current page |
| `--tp-breadcrumb-separator-color` | `var(--tp-grey-light)` | `/` separator |
| `--tp-breadcrumb-font-size` | `var(--tp-font-sm)` | Compact text |

## Usage Rules

- Use for fact sheet navigation: Administration > Tenant Manager > [Tenant Name]
- Home icon links to administration root
- Last item (current page) is not a link — styled with `--tp-text-dark`
- Maximum 4 levels deep
- Truncate middle items with ellipsis if more than 4 levels
