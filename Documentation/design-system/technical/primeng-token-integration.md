# PrimeNG Token Integration

**Status:** [DOCUMENTED]
**Version:** 1.0.0

## Source Of Truth

PrimeNG styling in EMSIST is governed by these layers:

| Layer | File | Role |
|---|---|---|
| Visual contract | `Documentation/design-system/component-showcase.html` | Frozen reference for token values and component appearance |
| Snapshot | `Documentation/design-system/tokens.css` | Generated token snapshot aligned to the showcase |
| Primitive tokens | `frontend/src/styles.scss` | Canonical `--tp-*` and shared root tokens |
| Composite tokens | `frontend/src/app/core/theme/default-preset.scss` | Canonical `--nm-*` composites |
| PrimeNG preset | `frontend/src/app/core/theme/default-preset.ts` | PrimeNG preset values where the TS API requires static values |

## Integration Rules

- PrimeNG components are unstyled-first and must inherit EMSIST tokens.
- New component styling uses documented tokens and `[pt]` passthrough instead of raw `.p-*` overrides.
- If the PrimeNG TypeScript preset requires a static value, keep it centralized in `default-preset.ts`.
- Do not define feature-scoped PrimeNG token forks.

## Styling Decision Order

1. Use existing PrimeNG props and documented component structure.
2. Apply tokens through `[pt]` on the live component.
3. If the style is global and shared, express it in the centralized preset or token layer.
4. Only allow a temporary exception if it is documented and governed by a dedicated check.

## Forbidden Patterns

- `::ng-deep`
- raw `.p-*` selector overrides in feature SCSS
- duplicated hardcoded palette or spacing values around PrimeNG primitives
- local restyling that breaks focus, hover, or disabled states

## Required Verification

- `scripts/check-component-showcase-alignment.sh`
- `scripts/check-design-tokens.sh`
- `scripts/check-admin-style-tokens.sh`
- `scripts/check-primeng-override-governance.sh`
- `scripts/frontend-governance.sh`
