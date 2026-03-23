# Branding Deviation Fix Prompt (Strict Palette Mode)

Use this prompt when fixing tenant branding or factsheet visual drift.

## Prompt

You are fixing branding deviations in EMSIST admin screens.

Hard rules (non-negotiable):

1. Allowed palette only:
- Forest: `#428177`, `#054239`, `#002623`
- Golden Wheat: `#edebe0`, `#b9a779`, `#988561`
- Deep Umber (special formatting only): `#6b1f2a`, `#4a151e`, `#260f14`
- Charcoal: `#3d3a3b`, `#161616`, `#ffffff`

2. Base page backgrounds must be exact `#edebe0` (no tint, no computed variation).

3. No decorative SVG pattern overlays, no gradient backgrounds, and no off-palette fallback literals unless explicitly approved for a named selector.

4. PrimeNG default blue info look must not appear in tenant factsheet scope. Info/success/error styles must be mapped to the approved palette.

5. Report PrimeNG component-catalog deviations:
- catalog marked used but not imported
- imported but marked unused
- imported but missing from catalog

Output required:

1. Code changes applied.
2. Deviation report with file:line references.
3. List of remaining unresolved deviations (if any).
4. Verification commands run and outcome.

Before applying changes, ask only for missing hard requirements:
- environment
- affected tenant UUID
- exact route(s)
- scope (`tenant factsheet only` or `all admin pages`)
- whether Deep Umber is `danger-only` or also `warning`

If missing details are not provided, proceed with safe defaults and document assumptions.
