# R14 Typography Page Fixture Plan

**Purpose:** define the exact corrective slice needed to bring the current Typography proposal back into compliance with the active UI baselines before more Brand Studio UI is built.

---

## 1. Current verdict

Current Typography proposal is **rejected**.

Reason:

- it drifts from the active typography baseline
- it invents custom page-shell patterns not present in the design system
- it uses custom surface treatments that break the component showcase rules
- it uses a guessed heading hierarchy that does not match the provided baseline

This fixture plan is the corrective contract for the next pass.

---

## 2. Frozen baselines for this fixture

This page must align to these sources only:

1. `main` frontend token source:
   - `frontend/src/styles.scss`

2. design-system visual baseline:
   - `Documentation/design-system/component-showcase.html`

3. datatable component contract:
   - `Documentation/design-system/components/datatable.md`

If these sources disagree, the disagreement must be recorded as a baseline conflict and must not be silently “fixed” inside the Typography page.

---

## 3. Exact violations to fix

### 3.1 Typography baseline drift

Current proposal drifts from the active font baseline by rendering `Roboto` / `Inter` as the default active combination instead of the current live baseline.

Fix:

- first render must reflect the active brand baseline, not a speculative future font pack
- the surrounding page chrome must remain on `var(--tp-font-family)`
- the page may preview candidate font selections inside the matrix row preview only

### 3.2 Wrong heading hierarchy

Current proposal maps:

- `H1` and `H2` to the same size token
- `H3` and `H4` to the same size token

Fix:

- the matrix must show the current text roles as governed by the provided baseline
- if the live system only exposes a 5-step token scale, the matrix must present roles honestly as:
  - `Page Title`
  - `Section Heading`
  - `Card Title`
  - `Group Label`
  - `Body`
- do not fake a unique H1/H2/H3/H4 token model if the active token system does not currently provide one

### 3.3 Custom summary-chip pattern

Current proposal adds non-baseline summary chips in the page action area.

Fix:

- remove custom summary chips
- use the system page-frame title/subtitle area only
- if extra metadata is needed, render it as plain supporting text inside the content body, not as a new chip system

### 3.4 Nested custom stage surface

Current proposal adds a second shadowed “stage” surface inside the system shell.

Fix:

- remove the nested stage card
- the table itself becomes the main content hero
- use the system shell and page frame only
- do not add additional island/elevation wrappers around the matrix

### 3.5 Card rule violations

Current proposal uses custom shadowed cards for mobile and internal sections.

Fix:

- no new shadowed cards for this page
- if mobile fallback is needed, use the sanctioned surface treatment only:
  - `--tp-surface-raised`
  - no box-shadow
  - existing spacing/radius tokens only

### 3.6 Datatable contract drift

Current proposal uses a near-match table token map, but not the actual contract.

Fix:

- use `p-table`
- use the datatable contract token map exactly
- remove custom deviations such as altered row-border opacity
- include `emptymessage` even if fixture data is present
- do not create a page-specific datatable visual dialect

### 3.7 Custom color field composition

Current proposal adds a custom swatch-plus-select field pattern.

Fix:

- the Typography page must use the governed select pattern directly
- any swatch preview must be inside the select option template or hover preview, not as a new field composition beside the select

### 3.8 Raw palette-driven text colors

Current proposal binds row colors to raw palette values.

Fix:

- dropdown options must be semantic text roles, resolved from the active brand
- allowed options for phase 1:
  - `Primary Text`
  - `Secondary Text`
  - `Muted Text`
- do not expose raw hex values as the main editing model
- do not expose accent colors as typography colors on this page unless later sanctioned

### 3.9 Custom shell width and padding

Current proposal overrides the system shell width and page padding.

Fix:

- remove custom max-width and padding shell overrides
- inherit the existing system shell and page-frame behavior

---

## 4. Frozen product shape for the corrective page

This page is a **dedicated Typography management page**.

It manages only:

- font face
- font color

It does **not** manage:

- font size
- palette packs
- starter kits
- logo/image assets
- iconography
- login preview

---

## 5. Frozen matrix structure

### 5.1 Main content

The page hero is one design-system-compliant table.

Columns:

1. `Item`
2. `Font`
3. `Font Color`

### 5.2 Row model

Phase 1 rows must be honest to the active token system and the current showcase:

1. `Page Title`
2. `Section Heading`
3. `Card Title`
4. `Group Label`
5. `Body`
6. `Body Small`
7. `Caption`

If product later insists on `H1` to `H6`, that requires a separate typography-token expansion decision first.

### 5.3 Preview behavior

- preview is required
- preview lives inside the same `Item` cell
- preview appears on hover/focus only
- preview text must use the selected candidate font family and selected semantic color
- preview must not change the shell typography around it

---

## 6. Frozen control model

### 6.1 Font column

- use `p-select`
- options:
  - `Roboto`
  - `Inter`
  - `Gotham Rounded`
- page shell remains on the current active font token
- selected candidate font is visible inside the row preview only

### 6.2 Font Color column

- use `p-select`
- options are semantic text roles only
- phase 1 options:
  - `Primary Text`
  - `Secondary Text`
  - `Muted Text`

### 6.3 Sizing rule

- no font-size control on this page
- size remains governed by the existing system tokens

---

## 7. Files to change

Primary page files:

- `frontend/src/app/features/brand-studio/brand-studio-preview.page.ts`
- `frontend/src/app/features/brand-studio/brand-studio-preview.page.html`
- `frontend/src/app/features/brand-studio/brand-studio-preview.page.scss`
- `frontend/src/app/features/brand-studio/brand-studio-preview.fixtures.ts`

Allowed supporting changes:

- additive updates in `frontend/src/styles.scss` only if strictly required and coordinated

Do not touch:

- `frontend/src/app/_parking/**/*`
- `Documentation/.Requirements/R02. TENANT MANAGEMENT/**/*`

---

## 8. Global baseline conflict to record, not hide

There is an existing cross-baseline conflict:

- `main` `styles.scss` sets select/input backgrounds to `transparent`
- `component-showcase.html` says select/input background should be `--tp-surface-raised`

For this fixture:

- the page must inherit the current live `main` token behavior
- the conflict must be recorded as a design-system baseline issue
- the Typography page must not locally patch this mismatch with ad hoc CSS

---

## 9. Acceptance criteria

The Typography page is acceptable only if all are true:

1. no custom summary chips remain
2. no nested shadowed stage panel remains
3. no custom shadowed mobile cards remain
4. page uses the existing system shell and page frame only
5. table uses `p-table` with the sanctioned datatable contract
6. `emptymessage` exists
7. font-color control uses semantic text roles, not raw palette labels
8. preview is in the same `Item` cell
9. shell typography remains on the active system font token
10. row definitions are honest to the current token system and showcase hierarchy

---

## 10. Execution order

1. remove shell-level customizations and summary chips
2. remove nested stage surface
3. rebuild the page around one compliant table
4. replace raw color options with semantic text-role options
5. correct row model to match the real active typography baseline
6. add empty-message and no-data handling
7. run browser review again against the rendered page

---

## 11. Exit evidence

Exit evidence must include:

- one rendered screenshot of the corrected page
- one rendered screenshot of the row-hover preview
- one short mismatch report showing that the violations in this plan are cleared or explicitly escalated as global baseline conflicts
