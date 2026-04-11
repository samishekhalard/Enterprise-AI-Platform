# Design System Centralization & Prototype Remediation

**Version:** 1.0.0
**Date:** 2026-03-12
**Status:** Draft
**Author:** SDLC Orchestration Agent (brainstorming skill)
**Cross-References:**
- `Documentation/design-system/DESIGN-SYSTEM-CONTRACT.md` (v1.0.0)
- `frontend/src/styles.scss` (token source of truth)
- `frontend/src/app/core/theme/default-preset.ts` (PrimeNG preset)
- `backend/tenant-service/.../BrandingPolicyEnforcer.java` (approved palette)
- `docs/issues/open/ISSUE-006-tenant-factsheet-branding-palette-alignment.md`

---

## 1. Problem Statement

The EMSIST project has a well-structured central design system at `Documentation/design-system/`, with tokens defined in `frontend/src/styles.scss` and enforced by `BrandingPolicyEnforcer.java`. However, three problems exist:

1. **Duplicate token definitions.** Each requirement's prototype (`R04`, `R05`, `R06`) defines its own `:root` CSS tokens locally instead of importing the central `tokens.css`. This creates drift risk when the central tokens evolve.

2. **Off-palette colors in prototypes.** The main prototype (`Documentation/prototypes/`) contains 9 hex colors outside the approved palette (Forest, Golden Wheat, Charcoal, Deep Umber). These colors will not adapt when a tenant applies custom branding, breaking the per-tenant theming system.

3. **No design system compliance clause in requirements.** The R04, R05, and R06 UI/UX Design Specs do not reference the central design system. Designers working from these requirements have no mandate to follow the approved palette or token architecture.

---

## 2. Goals

- **Zero token duplication.** Prototypes import from central `tokens.css` + `prototype-extras.css`. No local `:root` token blocks.
- **Zero off-palette colors.** Every color in every prototype maps to an approved palette token or a `color-mix()` derivative.
- **Mandatory compliance clause.** Every requirement's UI/UX Design Spec references the central design system as the binding visual contract.
- **Centralized change process.** New tokens, components, or blocks must be approved through the Design System Contract before use.

---

## 3. Approved Palette (Source of Truth)

Defined in `BrandingPolicyEnforcer.java` and `branding-policy.config.ts`:

| Group | Colors | Token Mapping |
|-------|--------|---------------|
| **Forest (Primary)** | `#428177`, `#054239`, `#002623` | `--tp-primary`, `--tp-primary-dark`, `--tp-info` |
| **Golden Wheat (Surface)** | `#edebe0`, `#b9a779`, `#988561` | `--tp-surface`/`--tp-bg`, `--tp-primary-light`/`--tp-border`, `--tp-warning` |
| **Charcoal (Typography)** | `#ffffff`, `#3d3a3b`, `#161616` | `--tp-white`/`--tp-on-primary`, `--tp-text`, `--tp-text-dark` |
| **Deep Umber (Special)** | `#6b1f2a`, `#4a151e`, `#260f14` | `--tp-danger`, `--tp-danger-hover`, (reserved) |

**Derived colors** (allowed via `color-mix()` only):
- `color-mix(in srgb, var(--tp-primary) 60%, var(--tp-surface))` for gradient endpoints
- `color-mix(in srgb, var(--tp-text) 35%, transparent)` for disabled/muted states
- `rgba()` with approved palette base colors for badge backgrounds

---

## 4. Changes

### 4.1 Add Design System Compliance Clause to Requirements

**Files to modify:**
- `Documentation/.Requirements/R04. MASTER DESFINITIONS/Design/05-UI-UX-Design-Spec.md`
- `Documentation/.Requirements/R05. AGENT MANAGER/Design/06-UI-UX-Design-Spec.md`
- `Documentation/.Requirements/R06. Localization/Design/05-UI-UX-Design-Spec.md`

**Clause to add** (as a new section near the top, after the document header):

```markdown
## Design System Compliance (MANDATORY)

All visual designs, prototypes, and implementations under this requirement
MUST comply with the central design system. No exceptions.

### Binding References

| Artifact | Location | Role |
|----------|----------|------|
| Design System Contract | `Documentation/design-system/DESIGN-SYSTEM-CONTRACT.md` (v1.0.0) | Master specification |
| Token Source of Truth | `frontend/src/styles.scss` (`:root` block) | All `--tp-*`, `--nm-*`, `--icon-*` tokens |
| PrimeNG Preset | `frontend/src/app/core/theme/default-preset.ts` | Component theme |
| Approved Palette | Forest / Golden Wheat / Charcoal / Deep Umber | Per `BrandingPolicyEnforcer.java` |
| Compliance Checklist | `Documentation/design-system/COMPLIANCE-CHECKLIST.md` | Validation criteria |

### Rules

1. **Token-only colors.** All colors MUST use `var(--tp-*)` or `var(--nm-*)` tokens.
   No hardcoded hex values outside `:root`. Derived colors via `color-mix()` only.
2. **No local token definitions.** Prototypes MUST import from the central design
   system (`tokens.css` + `prototype-extras.css`). No local `:root` overrides.
3. **Approved palette only.** All colors MUST be from the approved palette or
   derived from it. Per-tenant branding requires every color to be themeable.
4. **Change request for new tokens.** If this requirement needs tokens, components,
   or blocks not in the Design System Contract, submit a change request to the
   design system owner before implementation. The change must be approved and
   added to `styles.scss` before use.
5. **PrimeNG components first.** Use PrimeNG components as documented in
   `Documentation/design-system/components/`. Custom components only when
   PrimeNG has no equivalent.
6. **Spacing tokens.** Use `--tp-space-*` tokens (4px base scale). No hardcoded
   pixel values for margins/padding.
7. **Logical properties.** Use `margin-block-start` not `margin-top`, etc.
   (See Design System Contract Section on CSS Architecture.)
```

### 4.2 Remove Local Token Definitions from Prototype CSS Files

**Files to modify:**

| File | Action |
|------|--------|
| `Documentation/.Requirements/R04. MASTER DESFINITIONS/prototype/style.css` | Remove `:root { ... }` block, add `@import` |
| `Documentation/.Requirements/R05. AGENT MANAGER/prototype/style.css` | Remove `:root { ... }` block, add `@import` |
| `Documentation/.Requirements/R05. AGENT MANAGER/prototype-design-vision/style.css` | Remove `:root { ... }` block, add `@import`. Migrate `--ai-*` tokens to `prototype-extras.css`. |
| `Documentation/.Requirements/R06. Localization/prototype/style.css` | Remove `:root { ... }` block, add `@import` |
| `Documentation/prototypes/style.css` | Remove `:root { ... }` block, add `@import` |

**Import pattern** (add to top of each `style.css`):

```css
/* ================================================================
   Design System Tokens — DO NOT define tokens locally.
   Source of truth: frontend/src/styles.scss
   ================================================================ */
@import url('<RELATIVE_PATH>/design-system/tokens.css');
@import url('<RELATIVE_PATH>/design-system/prototype-extras.css');
```

**Exact paths per file** (relative from each CSS file to `Documentation/design-system/`):

| Prototype CSS File | `<RELATIVE_PATH>` | Full Import Example |
|---|---|---|
| `Documentation/prototypes/style.css` | `..` | `@import url('../design-system/tokens.css');` |
| `Documentation/.Requirements/R04. MASTER DESFINITIONS/prototype/style.css` | `../../..` | `@import url('../../../design-system/tokens.css');` |
| `Documentation/.Requirements/R05. AGENT MANAGER/prototype/style.css` | `../../..` | `@import url('../../../design-system/tokens.css');` |
| `Documentation/.Requirements/R05. AGENT MANAGER/prototype-design-vision/style.css` | `../../..` | `@import url('../../../design-system/tokens.css');` |
| `Documentation/.Requirements/R06. Localization/prototype/style.css` | `../../..` | `@import url('../../../design-system/tokens.css');` |

**Note:** All paths are relative from the CSS file location. Each `@import` resolves relative to the importing file, not the HTML document. The R04/R05/R06 prototypes share the same depth (`Documentation/.Requirements/<Req>/prototype/`) so all use `../../..`.

### 4.3 Fix Off-Palette Colors in Main Prototype

**File:** `Documentation/prototypes/style.css`

9 off-palette hex values to replace:

| Current Hex | style.css | index.html | Semantic Use | Replacement |
|-------------|-----------|------------|--------------|-------------|
| `#2ecc71` | 4 | 2 | Online dot, connected dot, positive trend | `var(--tp-primary)` with `box-shadow: 0 0 6px rgba(66,129,119,0.4)` for glow |
| `#95a5a6` | 2 | 3 | Offline dot, disconnected, viewer badge | `color-mix(in srgb, var(--tp-text) 35%, transparent)` |
| `#8a7540` | 7 | 0 | Warning toast, L2 badge text, category badges | `var(--tp-warning)` (`#988561`) |
| `#5ba89d` | 0 | 6 | Gradient endpoint (primary→teal) | `color-mix(in srgb, var(--tp-primary) 60%, var(--tp-surface))` |
| `#d4c99a` | 0 | 2 | Gradient endpoint (light→lighter) | `color-mix(in srgb, var(--tp-primary-light) 50%, var(--tp-surface))` |
| `#022a23` | 0 | 1 | L5 maturity (darkest tier) | `var(--tp-text-dark)` (`#161616`) |
| `#5b9bd5` | 1 | 0 | Tenant Admin role badge | `var(--tp-primary-dark)` |
| `#8e6bbf` | 1 | 1 | Agent Designer role badge | `var(--tp-danger)` |
| `#e8a838` | 1 | 0 | User role badge | `var(--tp-primary-light)` |

**Role badge decision:** Role badges use approved palette colors without color differentiation. Roles are distinguished by label text, not hue. All badges use the same neutral treatment:

```css
.role-platform-admin  { background: var(--tp-primary); color: var(--tp-white); }
.role-tenant-admin    { background: var(--tp-primary-dark); color: var(--tp-white); }
.role-agent-designer  { background: var(--tp-danger); color: var(--tp-white); }
.role-user            { background: var(--tp-primary-light); color: var(--tp-text); }
.role-viewer          { background: color-mix(in srgb, var(--tp-text) 35%, transparent); color: var(--tp-white); }
```

**Additionally:** Replace ~120 occurrences of approved-palette hex values that are hardcoded instead of using `var()`:

| Hardcoded Hex | Count | Replace With |
|---------------|-------|-------------|
| `#428177` | ~38 | `var(--tp-primary)` |
| `#054239` | ~21 | `var(--tp-primary-dark)` |
| `#b9a779` | ~22 | `var(--tp-primary-light)` |
| `#edebe0` | ~13 | `var(--tp-surface)` |
| `#fff`/`#ffffff` | ~23 | `var(--tp-white)` |
| `#3d3a3b` | ~4 | `var(--tp-text)` |
| `#6b1f2a` | ~8 | `var(--tp-danger)` |

### 4.4 Fix Off-Palette Colors in Main Prototype HTML

**File:** `Documentation/prototypes/index.html`

All inline `style="color:#..."` and `style="background:#..."` must be converted to CSS classes that use `var()` references. Where inline styles are unavoidable (e.g., dynamic chart segments), use approved palette hex only.

**Gradient bars (lines 778-802):** Replace inline gradient styles:

```html
<!-- Before -->
<div class="horizontal-bar-fill" style="width:78%;background:linear-gradient(90deg,#428177,#5ba89d)"></div>

<!-- After -->
<div class="horizontal-bar-fill gradient-primary" style="width:78%"></div>
```

With CSS classes:
```css
.gradient-primary { background: linear-gradient(90deg, var(--tp-primary), color-mix(in srgb, var(--tp-primary) 60%, var(--tp-surface))); }
.gradient-dark    { background: linear-gradient(90deg, var(--tp-primary-dark), var(--tp-primary)); }
.gradient-light   { background: linear-gradient(90deg, var(--tp-primary-light), color-mix(in srgb, var(--tp-primary-light) 50%, var(--tp-surface))); }
```

**Stacked bar segments (line 818):** Replace inline background colors with data-attributes + CSS:

```css
.stacked-bar-segment[data-level="l1"] { background: var(--tp-danger); }
.stacked-bar-segment[data-level="l2"] { background: var(--tp-primary-light); }
.stacked-bar-segment[data-level="l3"] { background: var(--tp-primary); }
.stacked-bar-segment[data-level="l4"] { background: var(--tp-primary-dark); }
.stacked-bar-segment[data-level="l5"] { background: var(--tp-text-dark); }
```

### 4.5 Migrate `--ai-*` Tokens to Central Design System

**Source:** `Documentation/.Requirements/R05. AGENT MANAGER/prototype-design-vision/style.css`
**Target:** `Documentation/design-system/prototype-extras.css`

The Agent Manager design-vision prototype defines 50+ `--ai-*` tokens across 8 categories (surfaces, agent types, status, chat bubbles, code highlighting, typography, spacing, radius, shadows). Only the **status** and **agent type** tokens (16 total) migrate to `prototype-extras.css` now — these are needed by the main prototype's agent-manager section. The remaining 43 tokens (chat UI, code blocks, typography scales, spacing, radius, shadows) are AI-service-specific presentation tokens that stay local to the R05 prototype-design-vision until the AI service feature is implemented.

**Rationale:** Migrating all 50+ tokens would pollute the central design system with feature-specific tokens that no other prototype or component needs yet. The change request process (Section 4.1 Rule 4) governs future promotion.

**Tokens to add to `prototype-extras.css`:**

```css
/* AI Service — Status tokens (used by agent-manager section in main prototype) */
--ai-primary: var(--tp-primary);
--ai-primary-hover: var(--tp-primary-dark);
--ai-primary-subtle: rgba(66, 129, 119, 0.12);
--ai-success: var(--tp-primary);           /* Online, positive */
--ai-success-bg: rgba(66, 129, 119, 0.12);
--ai-warning: var(--tp-warning);           /* Busy */
--ai-warning-bg: rgba(185, 167, 121, 0.18);
--ai-error: var(--tp-danger);              /* Error */
--ai-error-bg: rgba(107, 31, 42, 0.1);
--ai-text-disabled: rgba(61, 58, 59, 0.35); /* Offline */

/* AI Service — Agent type accent colors (from R05 prototype-design-vision/style.css lines 48-53) */
--ai-agent-orchestrator: var(--tp-primary);      /* #428177 */
--ai-agent-data: var(--tp-primary);              /* #428177 */
--ai-agent-support: var(--tp-primary);           /* #428177 */
--ai-agent-code: var(--tp-primary-light);        /* #b9a779 */
--ai-agent-document: var(--tp-warning);          /* #988561 */
--ai-agent-custom: var(--tp-primary-dark);       /* #054239 */
```

**Tokens that stay local** in R05 `prototype-design-vision/style.css` (43 tokens):
- Surface/background: `--ai-surface`, `--ai-surface-raised`, `--ai-surface-overlay`, `--ai-background`, `--ai-background-chat`
- Borders: `--ai-border`, `--ai-border-subtle`
- Chat bubbles: `--ai-bubble-user`, `--ai-bubble-user-text`, `--ai-bubble-agent`, `--ai-bubble-agent-text`
- Code: `--ai-code-bg`, `--ai-code-text`, `--ai-tool-bg`, `--ai-tool-border`
- Typography: `--ai-text-primary`, `--ai-text-secondary`, `--ai-text-tertiary`, `--ai-text-link`, `--ai-text-on-primary`, `--ai-font-sans`, `--ai-font-mono` (note: `--ai-text-disabled` migrates, so excluded here)
- Spacing: `--ai-space-1` through `--ai-space-10` (8 tokens)
- Radius: `--ai-radius-sm` through `--ai-radius-full` (6 tokens)
- Shadows: `--ai-shadow-sm` through `--ai-shadow-focus` (5 tokens)
- Info: `--ai-info`, `--ai-info-bg`

Once added to `prototype-extras.css`, the R05 prototype-design-vision removes its migrated 16 tokens and imports centrally. The remaining 43 stay in a local `:root` block prefixed with a comment: `/* Feature-local: promote via change request */`.

### 4.6 Integrate R06 Localization Prototype into Main Prototypes Directory

**Action:** Copy the R06 localization prototype to the main prototype as a new dock section.

The main prototype (`Documentation/prototypes/index.html`) currently has a basic "Translation Progress" section (lines 1802-1812) with coverage bars. This should be replaced with the full R06 prototype content (5 tabs: Languages, Dictionary, Import/Export, Rollback, AI Translate).

**Approach:**

1. **Dock section structure.** Add a new dock item in the main prototype's navigation sidebar with `id="master-locale"` and icon `pi-language`. The section content wraps the R06 prototype's 5-tab UI (Languages, Dictionary, Import/Export, Rollback, AI Translate).

2. **HTML integration.** Copy the R06 prototype's `<div class="locale-management">` container (the main content area from `index.html`, excluding `<head>`, `<body>` wrapper, and any standalone navigation). The copied HTML is wrapped in `<div id="master-locale" class="content-section">...</div>` to match the main prototype's dock pattern.

3. **CSS class conflict handling.** The R06 prototype uses class prefixes (`locale-`, `lang-`, `dict-`, `import-`, `rollback-`, `ai-translate-`) that do not conflict with existing main prototype classes. Merge R06's `style.css` rules into the main prototype's `style.css` in a clearly delimited section:
   ```css
   /* ================================================================
      R06 LOCALIZATION — Merged from R06 prototype (2026-03-12)
      ================================================================ */
   ```
   If any class names collide (verify with grep before merging), prefix with `locale-` namespace.

4. **Replace existing stub.** Remove the current "Translation Progress" section (lines 1802-1812 in `index.html`) which shows only coverage bars, and replace with the full R06 content from step 2.

5. **Standalone prototype preserved.** The R06 prototype at `Documentation/.Requirements/R06. Localization/prototype/` remains as a detailed reference. Add a comment at the top of its `index.html`:
   ```html
   <!-- Integrated into main prototype: Documentation/prototypes/index.html#master-locale -->
   ```

### 4.7 Flag Agent Manager Status Gaps in R05 Requirements

**File:** `Documentation/.Requirements/R05. AGENT MANAGER/Design/06-UI-UX-Design-Spec.md`

Add a "Prototype Compliance Notes" section documenting the gaps found by the BA validation:

```markdown
## Prototype Compliance Notes (2026-03-12 BA Audit)

The following gaps between this specification and the prototype
(`Documentation/prototypes/index.html`, agent-manager section) were
identified during the BA validation audit:

### Critical

1. **Status model conflation.** The prototype shows only Online/Offline.
   This spec defines 4 runtime states (Online, Busy, Offline, Error —
   Section 2.1 lines 1643-1647) and 3 lifecycle states (Active, Suspended,
   Decommissioned — US-E14.7). Both dimensions must be represented.

2. **Missing Busy and Error runtime states.** The prototype must add status
   dot colors for `--ai-warning` (Busy) and `--ai-error` (Error) per
   Section 2.1 line 1645-1647.

3. **Status color violations.** Online dot uses #2ecc71 (off-palette).
   Must use `--ai-success` (#428177). Offline dot uses #95a5a6 (off-palette).
   Must use `--ai-text-disabled` (Charcoal 35%).

4. **Suspension/Decommission dialog missing.** Section 2.24 defines a
   two-mode dialog with cascading effects panel, justification input,
   and safety gate. This is entirely absent from the prototype.

### Moderate

5. **Missing card fields.** Active skill name, performance sparkline, and
   structured metrics row (Section 2.2.1) are absent from agent cards.

6. **Tab mismatch.** Spec defines "Traces" and "Feedback" tabs; prototype
   has "History" and "Training". "Feedback" tab is missing entirely.

7. **Missing screens.** Knowledge Source Management (2.15), Pipeline Viewer
   (2.12), and Agent Comparison (2.16) have no prototype representation.
```

### 4.8 Fix R06 Localization Prototype README Token Error

**File:** `Documentation/prototypes/README.md`

The README claims `--tp-success: #2e7d32` but `styles.scss` defines `--tp-success: #428177`. Correct this.

---

## 5. What Does NOT Change

- **`frontend/src/styles.scss`** — Token source of truth. No modifications.
- **`default-preset.ts`** — PrimeNG preset. No modifications.
- **`BrandingPolicyEnforcer.java`** — Approved palette enforcement. No modifications.
- **`Documentation/design-system/DESIGN-SYSTEM-CONTRACT.md`** — Central contract. The `--ai-*` namespace is already documented at line 72 (one-liner: `| --ai-* | AI service tokens | --ai-primary |`). This spec expands that one-liner to list the 16 migrated tokens with their descriptions. No new section is added — the existing table row is updated in place.
- **`AdminNavItem` / `AdminSection` types** — Angular code unchanged.
- **Backend services** — No backend changes.

---

## 6. Files Modified (Summary)

| File | Change Type | Description |
|------|-------------|-------------|
| `R04/.../05-UI-UX-Design-Spec.md` | ADD section | Design System Compliance clause |
| `R05/.../06-UI-UX-Design-Spec.md` | ADD section | Design System Compliance clause + prototype compliance notes |
| `R06/.../05-UI-UX-Design-Spec.md` | ADD section | Design System Compliance clause |
| `R04/.../prototype/style.css` | MODIFY | Remove `:root` tokens, add `@import` |
| `R05/.../prototype/style.css` | MODIFY | Remove `:root` tokens, add `@import` |
| `R05/.../prototype-design-vision/style.css` | MODIFY | Remove `:root` tokens, add `@import` |
| `R06/.../prototype/style.css` | MODIFY | Remove `:root` tokens, add `@import` |
| `Documentation/prototypes/style.css` | MODIFY | Remove `:root` tokens, add `@import`, fix 9 off-palette + ~120 hardcoded hex |
| `Documentation/prototypes/index.html` | MODIFY | Replace inline hex with CSS classes, integrate R06 localization section |
| `Documentation/prototypes/README.md` | FIX | Correct `--tp-success` value |
| `Documentation/design-system/prototype-extras.css` | ADD tokens | `--ai-*` namespace tokens |
| `Documentation/design-system/DESIGN-SYSTEM-CONTRACT.md` | UPDATE row | Expand existing `--ai-*` one-liner (line 72) with 16 migrated token details |

---

## 7. Acceptance Criteria

1. `grep -rn '#[0-9a-fA-F]\{3,8\}' Documentation/prototypes/style.css` returns zero matches outside of comments and `:root` (which itself is removed in favor of `@import`)
2. All prototype `style.css` files begin with `@import url('...tokens.css')` and contain zero local `:root` token definitions
3. Each requirement's UI/UX Design Spec (R04, R05, R06) contains the "Design System Compliance (MANDATORY)" section
4. R05 UI/UX Design Spec contains the "Prototype Compliance Notes" section documenting the status model gaps
5. `Documentation/design-system/prototype-extras.css` includes `--ai-*` token definitions
6. The main prototype renders correctly with all colors sourced from central tokens
7. `Documentation/prototypes/README.md` shows correct `--tp-success: #428177`

---

## 8. Out of Scope

- **Fixing the Agent Manager status model in the prototype** — flagged as open items in Section 4.7; requires separate UX design work to add Busy/Error states and Suspension dialog
- **Codebase SCSS remediation** — tracked in `docs/governance/DESIGN-SYSTEM-ACTION-PLAN.md` (5-sprint plan)
- **Adding new PrimeNG components** — tracked in Design System Contract component catalog
- **`--ai-*` token implementation in `styles.scss`** — tokens added to `prototype-extras.css` first; production promotion follows the standard change request process
