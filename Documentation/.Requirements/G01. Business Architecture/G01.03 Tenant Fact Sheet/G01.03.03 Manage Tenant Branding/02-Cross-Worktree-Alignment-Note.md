# Cross-Worktree Alignment Note

## Purpose

This note captures the approved alignment between the tenant-management documentation stream and the current Brand Studio implementation stream, while keeping the documentation source of truth inside:

- `/Users/mksulty/Claude/Projects/Emsist-app/.worktrees/tenant-factsheet-spec/Documentation`

## Agreed Rule

- touchpoints come from the approved requirement model
- variants are validated against:
  - the approved requirement model
  - the current implemented preview/editor state
- if a required touchpoint is not yet surfaced in the current UI, it stays in the baseline and is treated as a required implementation gap

## Agreed Touchpoints

- `Typography`
- `Color System`
- `Logos & Imagery`
- `Iconography`
- `Login Screen`
- `Publish`

## Agreed Corrections

- `Publish` remains a required touchpoint even if the current preview does not yet expose it as a visible section
- over-modeled implementation-level variants were removed:
  - typography hover preview
  - staged icon-library file
  - staged login-background file
  - device-preview variants
- missing requirement-level states were added:
  - `Icon Library Validation Error State`
  - `Login Background Validation Error State`
  - `Login Background Reset to Default State`

## Reconciliation Statement

Brand Studio touchpoints are derived from the approved branding requirement model, not only from the currently implemented preview page.

Therefore, the approved touchpoints are:

- `Typography`
- `Color System`
- `Logos & Imagery`
- `Iconography`
- `Login Screen`
- `Publish`

The current preview implementation covers the first five touchpoints.
`Publish` remains a required touchpoint and an implementation gap until surfaced in the UI.
