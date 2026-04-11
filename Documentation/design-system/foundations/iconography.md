# Iconography Foundation

**Status:** [DOCUMENTED]
**Version:** 1.0.0

## Purpose

This foundation defines the approved icon families, sizing rules, and
directionality behavior for EMSIST.

## Approved Icon Sources

| Source | Use |
|---|---|
| Phosphor Thin via `ng-icon` | Primary application actions, feature controls, list actions, lightweight decorative icons |
| Product SVG assets under `frontend/src/assets/icons/` | Shell navigation, branded dock glyphs, product-specific markers |
| PrimeIcons | Only where required by PrimeNG internals or documented component examples |

## Size Scale

Use the centralized icon size tokens. Do not hardcode ad hoc icon sizes unless a
documented exception exists.

| Token | Intent |
|---|---|
| `--icon-size-xs` | dense support icons |
| `--icon-size-sm` | inline UI indicators |
| `--icon-size-md` | default action icons |
| `--icon-size-lg` | empty states, large highlights |

## Usage Rules

- Icons support comprehension; they do not replace labels on first-use actions.
- Icon-only actions require `aria-label`.
- Status meaning must not rely on icon alone; pair with text or tag color.
- Reuse the same icon for the same meaning across the app where possible.

## Directional Icons And RTL

- Use logical layout properties so mirrored layouts do not require different icon placement code.
- Directional icons such as chevrons, arrows, and back indicators must visually mirror when the meaning changes under RTL.
- Non-directional icons such as settings, warning, info, or refresh do not flip.

## Decorative Vs Semantic

| Icon Type | Rule |
|---|---|
| Decorative | Mark `aria-hidden="true"` and keep it out of the accessible name |
| Semantic | Ensure the surrounding control or text communicates the meaning |
| Logo / brand mark | Provide equivalent accessible text nearby or via the image alt text |

## Do / Don't

### Do

- Use Phosphor Thin for application-level controls.
- Use tokenized sizes instead of one-off values.
- Keep icon stroke weight visually consistent within the same region.
- Use SVG assets for branded or product-specific shell items.

### Don't

- Do not mix unrelated icon families in one toolbar or table action cluster.
- Do not use icons as the only indicator for destructive or disabled state.
- Do not hardcode left/right positioning that breaks under RTL.
- Do not introduce emoji or illustrative icon styles into production UI controls.
