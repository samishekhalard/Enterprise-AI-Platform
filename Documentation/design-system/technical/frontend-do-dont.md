# Frontend Do/Don't

**Status:** [DOCUMENTED]
**Version:** 1.0.0

## Do

- Build route templates with `app-page-frame`.
- Choose documented blocks and patterns before inventing a surface.
- Prefer PrimeNG primitives over custom equivalents.
- Style PrimeNG through tokens and `[pt]` passthrough where available.
- Keep route, section, and dialog states explicit with signals or form state.
- Use logical properties and `text-align: start/end`.
- Use the documented date format `dd MMM y, HH:mm`.
- Keep loading states contextual: skeleton first load, inline spinner refresh, button loading for actions.

## Don't

- Do not introduce raw `.p-*` CSS overrides.
- Do not use `::ng-deep`.
- Do not create custom tables, paginators, dialogs, selects, or wizards when documented PrimeNG patterns exist.
- Do not add route templates outside the page-frame contract.
- Do not hardcode new token values, arbitrary spacing, or ad hoc radius values.
- Do not duplicate repo-wide UI rules under feature requirement documents.

## Review Checklist For Frontend Changes

Every frontend change should answer yes to these questions:

- Does it map to a documented block, pattern, or component?
- Does it use the canonical tokens from `styles.scss`, `default-preset.scss`, and `tokens.css`?
- Does it avoid new legacy selectors, stale custom primitives, or dead CSS?
- Does it preserve keyboard access, focus visibility, and touch-target size?
- Does it pass `scripts/frontend-governance.sh`?

## Allowed Exceptions

An exception is allowed only when all of the following are true:

- PrimeNG or the documented baseline does not cover the need directly.
- The exception is documented in `Documentation/design-system/`.
- The exception has an automated guard or an explicit dated allowlist entry.
- The exception does not create a second competing primitive.
