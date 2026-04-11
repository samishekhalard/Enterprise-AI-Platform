# R14 Brand Studio Screen and IA Spec

**Purpose:** define the frozen information architecture and screen structure for the Brand Studio editor.

---

## 1. Frozen product shape

Brand Studio is not a flat settings form.

It is a structured editor with:

1. draft workspace
2. live preview
3. publish flow
4. rollback/history

---

## 2. Frozen main navigation

The Brand Studio editor should be organized into six sections:

1. `Starter Kit`
2. `Palette`
3. `Typography`
4. `Assets`
5. `Icon Library`
6. `Publish`

This replaces the current flat “Global Theme” style editor as the primary IA.

---

## 3. Frozen page layout

### 3.1 Desktop

Three-column layout:

- left rail: section navigation
- center: editor form for the selected section
- right: live preview

### 3.2 Tablet

Two-column layout:

- top section navigation
- editor + preview stacked or tabbed

### 3.3 Mobile

Single-column layout:

- section switcher
- section editor
- preview launcher or preview segment

---

## 4. Frozen sections

### 4.1 Starter Kit

Purpose:

- choose the starting brand language

Controls:

- starter-kit card grid or dropdown
- preview thumbnail
- summary of included palette and typography defaults

Data source:

- `platform_brand_starter_kit`

### 4.2 Palette

Purpose:

- choose the governed palette pack

Controls:

- palette-pack list
- semantic swatch preview
- contrast warning area

Data source:

- `platform_palette_pack`

Forbidden:

- arbitrary raw hex entry as the main interaction

### 4.3 Typography

Purpose:

- choose the approved typography pack

Controls:

- typography-pack list
- heading/body/mono preview
- load/performance notes if relevant

Data source:

- `platform_typography_pack`

### 4.4 Assets

Purpose:

- govern logo and image assets

Subsections:

- light logo
- dark logo
- login background

Controls:

- upload
- replace
- preview
- remove
- validation feedback

Notes:

- favicon is not a direct user-managed subsection in phase 1
- backend/browser integration derives and renders favicon from the active logo set

Data source:

- `tenant_brand_asset`

### 4.5 Icon Library

Purpose:

- govern object-definition icon selection

Controls:

- active icon-library selector
- upload/replace icon-library package
- search/filter icon browser
- active icon preview

Data source:

- `tenant_icon_library`
- `tenant_icon_asset`

### 4.6 Publish

Purpose:

- compare draft to current active profile
- validate
- publish
- rollback

Controls:

- validation summary
- draft vs active diff summary
- publish button
- rollback/history list

Data sources:

- `tenant_brand_draft`
- `tenant_brand_profile`
- `tenant_brand_audit_event`

---

## 5. Frozen preview surfaces

Live preview must include at least:

- login panel
- shell header
- button sample
- input sample
- dialog sample
- table/paginator sample
- tag/message sample
- object-definition icon picker sample

Current preview catalog in the repo may be reused as the preview library, but must be reorganized under the new IA.

---

## 6. Frozen action model

### 6.1 Primary actions

- `Save Draft`
- `Validate`
- `Preview`
- `Publish`
- `Rollback`

### 6.2 Secondary actions

- `Reset to Active`
- `Apply Starter Kit`
- `Replace Asset`
- `Replace Icon Library`

### 6.3 Forbidden action model

Do not use:

- immediate-save-as-live behavior
- single `Save` button that silently changes active runtime

---

## 7. Frozen data flow by screen

### 7.1 Editor load

1. load draft workspace
2. if no draft exists, hydrate from active profile or fallback baseline
3. load shared catalogs
4. load tenant assets and icon libraries

### 7.2 Draft save

1. persist draft workspace only
2. show validation feedback
3. do not affect active runtime

### 7.3 Preview

1. assemble preview manifest from current draft
2. apply preview manifest through runtime service
3. isolate preview session
4. restore active runtime on exit

### 7.4 Publish

1. validate current draft
2. assemble active profile
3. create new active brand profile
4. emit audit
5. refresh runtime on next load

---

## 8. Frozen current-component migration guidance

Current as-is files:

- `branding-studio.component.ts`
- `branding-studio.component.html`
- `global-branding-form.component.ts`
- `global-branding-form.component.html`
- `style-variant-picker.component.ts`
- preview components under `branding-studio/previews/*`

Migration rule:

- reuse preview components and some policy helpers
- do not keep the current flat form as the final user-facing IA

Specific replacements:

- hardcoded preset buttons -> Starter Kit selector
- readonly typography field -> Typography Pack selector
- URL text fields -> asset library controls
- raw component variant picker -> bounded preview/diff controls inside preview context

---

## 9. Frozen route strategy

Safe route options for R14:

- embed inside existing administration tenant-management branding surface
- or introduce new R14-owned feature path outside `_parking`

Do not implement the real editor in:

- `frontend/src/app/_parking/**/*`

That remains R02-owned placeholder territory.

---

## 10. Frozen acceptance

The screen/IA is acceptable only when:

- a user can understand draft vs active state clearly
- palette and typography are selected from governed catalogs
- assets are managed through upload-backed controls
- icon library is managed explicitly
- preview is rich enough to detect bad branding before publish
- publish/rollback are visible and auditable
