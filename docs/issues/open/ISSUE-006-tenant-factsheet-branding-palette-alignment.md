# ISSUE-006: Tenant Factsheet Branding Palette Misalignment + PrimeNG Catalog Deviation

## Metadata

- **Issue ID:** ISSUE-006
- **Status:** Open (Draft)
- **Priority:** High
- **Category:** UX | UI
- **Reported On:** 2026-03-04
- **Affected Areas:**
  - `frontend/src/app/features/administration/sections/tenant-manager/**`
  - `frontend/src/styles.scss`
  - `frontend/src/app/core/theme/**`
  - `backend/tenant-service` branding defaults/fallbacks

## Summary

Tenant factsheet visual styling does not consistently follow the approved tenant palette. Legacy off-brand colors (aqua/slate-blue neutrals) are still present in branding presets, defaults, and some fallback paths. This causes visible mismatch with required brand direction (Forest + Golden Wheat + Charcoal, with Deep Umber for special formatting).

## Approved Palette (Source of Truth)

- **Forest (Primary Teal Family):** `#428177`, `#054239`, `#002623`
- **Golden Wheat (Surface/Accent Family):** `#edebe0`, `#b9a779`, `#988561`
- **Deep Umber (Special Formatting):** `#6b1f2a`, `#4a151e`, `#260f14`
- **Charcoal (Typography Family):** `#3d3a3b`, `#161616`, `#ffffff` (inverse)

## Implemented Alignment (Known Changes)

1. Updated tenant branding defaults to approved palette values in frontend and backend default/fallback paths.
2. Updated branding studio preset values and labels to palette-aligned variants.
3. Reworked tenant factsheet neumorphic shadows/background tones from cool blue-gray to wheat/charcoal-compatible values.
4. Updated PrimeNG base preset primary ramp to Forest family.
5. Updated tenant resolve branding fallback colors in `tenant-service` to prevent off-brand colors from reappearing.

## PrimeNG Catalog vs Actual Usage (Deviation Snapshot)

### Catalog marked **used**, but not currently imported in app code

- `dialog`
- `toggleswitch`

### Imported in app code, but catalog currently marks as **unused**

- `floatlabel` (used in preview)
- `multiselect` (used in preview)

### Imported in app code, but **missing** as catalog entry

- `avatargroup` (used in avatar preview)

## Root Cause (Current Assessment)

### Confirmed

- Multiple hardcoded legacy color constants remained in factsheet/branding SCSS and branding preset logic.
- Branding defaults were split across frontend defaults, theme preset, and backend fallback logic, and were not fully synchronized to one palette baseline.
- Branding catalog “used” metadata is not automatically validated against actual PrimeNG imports.

### Contributing Factors

- Legacy preset names/values (`aqua`, slate-blue accents) were retained during previous iterations.
- No CI guard to detect component-catalog drift from actual imports.

## Missing Inputs Needed from Reporter (Please fill)

- **Environment where mismatch is observed:** `local | dev | stg | prod`
- **Exact tenant ID/UUID affected:** `<MISSING>`
- **Primary page route(s) showing mismatch:** `<MISSING>`
- **Browser + version:** `<MISSING>`
- **Expected special-format usage:**
  - Should Deep Umber be used for `danger only`, or also for `warning/attention` states?
- **Sign-off baseline:**
  - Which screen(s) are the final visual acceptance baseline? (`Tenant factsheet only` or `all administration pages`)

## Verification Plan

1. Launch frontend and open Administration -> Tenant Manager -> Branding.
2. Validate default theme values are from approved palette only.
3. Validate preset switches do not introduce non-palette colors.
4. Confirm backend resolve/fallback branding payload returns approved defaults.
5. Validate PrimeNG catalog deviation list and decide whether to:
   - update catalog metadata, or
   - add/remove actual component usage.

## Acceptance Criteria

- [ ] Tenant factsheet uses only approved palette families unless explicitly exempted.
- [ ] Branding defaults are consistent across frontend and backend fallback responses.
- [ ] No legacy aqua/slate colors appear in branding studio presets.
- [ ] PrimeNG catalog deviation list is reviewed and approved by product/UX owner.
- [ ] Decision recorded on catalog drift handling (`metadata update` vs `code update`).

## Related Code References

- `frontend/src/app/features/administration/models/administration.models.ts`
- `frontend/src/app/features/administration/sections/tenant-manager/branding-studio/global-branding-form.component.ts`
- `frontend/src/app/features/administration/sections/tenant-manager/branding-studio/branding-studio.component.ts`
- `frontend/src/app/features/administration/sections/tenant-manager/tenant-manager-section.component.scss`
- `frontend/src/styles.scss`
- `frontend/src/app/core/theme/thinkplus-preset.ts`
- `frontend/src/app/core/theme/tenant-theme.service.ts`
- `backend/tenant-service/src/main/java/com/ems/tenant/entity/TenantBrandingEntity.java`
- `backend/tenant-service/src/main/java/com/ems/tenant/service/TenantServiceImpl.java`
- `backend/tenant-service/src/main/java/com/ems/tenant/controller/TenantController.java`
