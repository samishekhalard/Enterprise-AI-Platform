# Design System Centralization & Prototype Remediation — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Eliminate all off-palette colors and duplicate token definitions from prototypes, add design system compliance clauses to requirements, and integrate the R06 localization prototype into the main prototype.

**Architecture:** Documentation-only changes. No source code, backend, or frontend modifications. All work targets files under `Documentation/`. The central design system files (`tokens.css`, `styles.scss`, `default-preset.ts`) are read-only.

**Tech Stack:** CSS, HTML, Markdown. CSS `@import`, `var()`, `color-mix()`.

**Spec:** `Documentation/design-system/specs/2026-03-12-design-system-centralization-and-prototype-remediation.md`

---

## Chunk 1: Foundation — Add `--ai-*` Tokens to Central Design System

### Task 1: Add 16 `--ai-*` tokens to `prototype-extras.css`

**Files:**
- Modify: `Documentation/design-system/prototype-extras.css` (after line 82, before closing `}`)

- [ ] **Step 1: Read the current file**

Read `Documentation/design-system/prototype-extras.css` to confirm the `:root` block ends at line 82 with `}`.

- [ ] **Step 2: Add `--ai-*` tokens before the closing brace**

Insert the following block just before the closing `}` of the `:root` block (before `--font-brand` line):

```css
  /* --- AI Service tokens (migrated from R05 prototype-design-vision) --- */

  /* Status tokens (used by agent-manager section in main prototype) */
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

  /* Agent type accent colors */
  --ai-agent-orchestrator: var(--tp-primary);      /* #428177 */
  --ai-agent-data: var(--tp-primary);              /* #428177 */
  --ai-agent-support: var(--tp-primary);           /* #428177 */
  --ai-agent-code: var(--tp-primary-light);        /* #b9a779 */
  --ai-agent-document: var(--tp-warning);          /* #988561 */
  --ai-agent-custom: var(--tp-primary-dark);       /* #054239 */
```

- [ ] **Step 3: Verify the token count**

Run: `grep -c '\-\-ai-' Documentation/design-system/prototype-extras.css`
Expected: `16`

- [ ] **Step 4: Commit**

```bash
git add Documentation/design-system/prototype-extras.css
git commit -m "feat(design-system): add 16 --ai-* tokens to prototype-extras.css"
```

### Task 2: Expand `--ai-*` row in DESIGN-SYSTEM-CONTRACT.md

**Files:**
- Modify: `Documentation/design-system/DESIGN-SYSTEM-CONTRACT.md` (line 72)

- [ ] **Step 1: Read line 72 in context**

Read `Documentation/design-system/DESIGN-SYSTEM-CONTRACT.md` lines 68-78 to see current `--ai-*` row.

- [ ] **Step 2: Replace the one-liner row**

Replace:
```
| `--ai-*` | AI service tokens | `--ai-primary` |
```

With:
```
| `--ai-*` | AI service tokens (16 in `prototype-extras.css`: status — `--ai-primary`, `--ai-primary-hover`, `--ai-primary-subtle`, `--ai-success`, `--ai-success-bg`, `--ai-warning`, `--ai-warning-bg`, `--ai-error`, `--ai-error-bg`, `--ai-text-disabled`; agent types — `--ai-agent-orchestrator`, `--ai-agent-data`, `--ai-agent-support`, `--ai-agent-code`, `--ai-agent-document`, `--ai-agent-custom`) | `--ai-primary`, `--ai-success` |
```

- [ ] **Step 3: Commit**

```bash
git add Documentation/design-system/DESIGN-SYSTEM-CONTRACT.md
git commit -m "docs(design-system): expand --ai-* token row with 16 migrated token details"
```

---

## Chunk 2: Token Import Migration — Replace Local `:root` Blocks

### Task 3: Main prototype — add `@import` header to `style.css`

**Files:**
- Modify: `Documentation/prototypes/style.css`

The main prototype's `style.css` already has a comment at line 8 (`/* CSS Custom Properties: loaded from ../design-system/tokens.css */`) but no actual `@import`. It has NO `:root` block (tokens come from `tokens.css` via `<link>` in `index.html`).

- [ ] **Step 1: Read lines 1-15 of the file**

Confirm there is no `:root` block and the comment at line 8 exists.

- [ ] **Step 2: Replace the comment with actual `@import` statements**

Replace lines 7-9 (the comment block about CSS Custom Properties):
```css
/* ------------------------------------------------------------------ */
/* CSS Custom Properties: loaded from ../design-system/tokens.css     */
/* ------------------------------------------------------------------ */
```

With:
```css
/* ================================================================
   Design System Tokens — DO NOT define tokens locally.
   Source of truth: frontend/src/styles.scss
   ================================================================ */
@import url('../design-system/tokens.css');
@import url('../design-system/prototype-extras.css');
```

- [ ] **Step 3: Verify imports resolve**

Open `Documentation/prototypes/index.html` in a browser. Confirm colors render correctly (background should be beige `#edebe0`, text should be `#3d3a3b`).

- [ ] **Step 4: Commit**

```bash
git add Documentation/prototypes/style.css
git commit -m "feat(prototype): add @import for central design system tokens"
```

### Task 4: R04 Definition Management prototype — replace `:root` with `@import`

**Files:**
- Modify: `Documentation/.Requirements/R04. MASTER DESFINITIONS/prototype/style.css`

The `:root` block is at lines 9-91 (83 lines of duplicate token definitions).

- [ ] **Step 1: Read lines 1-95 to confirm `:root` boundaries**

Verify `:root {` at line 9 and `}` at line 91.

- [ ] **Step 2: Replace lines 1-91 with import header**

Replace the file header + entire `:root` block (lines 1-91) with:

```css
/* ================================================================== */
/* Definition Management — Prototype Stylesheet                       */
/* Reuses ThinkPLUS neumorphic design tokens from central design system*/
/* ================================================================== */

/* ================================================================
   Design System Tokens — DO NOT define tokens locally.
   Source of truth: frontend/src/styles.scss
   ================================================================ */
@import url('../../../design-system/tokens.css');
@import url('../../../design-system/prototype-extras.css');
```

The rest of the file (line 92 onward: reset, layout, component styles) stays unchanged.

- [ ] **Step 3: Verify no local `:root` remains**

Run: `grep -c ':root' "Documentation/.Requirements/R04. MASTER DESFINITIONS/prototype/style.css"`
Expected: `0`

- [ ] **Step 4: Commit**

```bash
git add "Documentation/.Requirements/R04. MASTER DESFINITIONS/prototype/style.css"
git commit -m "refactor(R04-prototype): replace local :root tokens with @import from central design system"
```

### Task 5: R05 Agent Manager prototype — replace `:root` with `@import`

**Files:**
- Modify: `Documentation/.Requirements/R05. AGENT MANAGER/prototype/style.css`

The `:root` block starts at line 10.

- [ ] **Step 1: Find the end of the `:root` block**

Run: `grep -n '^}' "Documentation/.Requirements/R05. AGENT MANAGER/prototype/style.css" | head -1`

- [ ] **Step 2: Replace file header + `:root` block with `@import`**

Same pattern as Task 4:
```css
/* ================================================================== */
/* Agent Manager — Prototype Stylesheet                               */
/* Reuses ThinkPLUS neumorphic design tokens from central design system*/
/* ================================================================== */

/* ================================================================
   Design System Tokens — DO NOT define tokens locally.
   Source of truth: frontend/src/styles.scss
   ================================================================ */
@import url('../../../design-system/tokens.css');
@import url('../../../design-system/prototype-extras.css');
```

- [ ] **Step 3: Verify**

Run: `grep -c ':root' "Documentation/.Requirements/R05. AGENT MANAGER/prototype/style.css"`
Expected: `0`

- [ ] **Step 4: Commit**

```bash
git add "Documentation/.Requirements/R05. AGENT MANAGER/prototype/style.css"
git commit -m "refactor(R05-prototype): replace local :root tokens with @import from central design system"
```

### Task 6: R05 Agent Manager prototype-design-vision — partial migration

**Files:**
- Modify: `Documentation/.Requirements/R05. AGENT MANAGER/prototype-design-vision/style.css`

This file has both `--tp-*`/`--nm-*` tokens (lines 7-23) and `--ai-*` tokens (lines 35-115) in one `:root` block. The 16 migrated `--ai-*` tokens must be removed. The 43 local `--ai-*` tokens stay.

- [ ] **Step 1: Read lines 1-120 to understand the full `:root` structure**

Identify which tokens are `--tp-*`/`--nm-*` (lines 7-23) vs migrated `--ai-*` (lines 35-53 + 56-63 subset) vs local `--ai-*` (remaining).

- [ ] **Step 2: Replace lines 1-6 (file header) with import header**

```css
/* ============================================================
   AI Agent Platform — Clickable Wireframe Prototype
   Design System: EMSIST Neumorphic Light Theme
   ============================================================ */

/* ================================================================
   Design System Tokens — DO NOT define tokens locally.
   Source of truth: frontend/src/styles.scss
   ================================================================ */
@import url('../../../design-system/tokens.css');
@import url('../../../design-system/prototype-extras.css');
```

- [ ] **Step 3: Remove the `--tp-*` and `--nm-*` tokens from `:root` (lines 7-32)**

These are now supplied by the `@import`. Delete from `:root {` through line 32 (the `--nm-radius` and `--card-shadow` etc. lines).

- [ ] **Step 4: Remove the 16 migrated `--ai-*` tokens from `:root`**

Remove lines containing: `--ai-primary`, `--ai-primary-hover`, `--ai-primary-subtle`, `--ai-success`, `--ai-success-bg`, `--ai-warning`, `--ai-warning-bg`, `--ai-error`, `--ai-error-bg`, `--ai-text-disabled`, `--ai-agent-orchestrator`, `--ai-agent-data`, `--ai-agent-support`, `--ai-agent-code`, `--ai-agent-document`, `--ai-agent-custom`.

- [ ] **Step 5: Add comment to remaining local `:root` block**

The remaining `:root` should look like:
```css
/* Feature-local: promote via change request (see Design System Contract, Section 4.1 Rule 4) */
:root {
  /* AI surfaces & backgrounds */
  --ai-surface: var(--nm-bg);
  --ai-surface-raised: rgba(237, 235, 224, 0.86);
  /* ... remaining 43 tokens ... */
}
```

- [ ] **Step 6: Verify migrated tokens are gone but locals remain**

Run: `grep -c '\-\-ai-agent-data' "Documentation/.Requirements/R05. AGENT MANAGER/prototype-design-vision/style.css"`
Expected: `0` (migrated — now in prototype-extras.css)

Run: `grep -c '\-\-ai-bubble-user' "Documentation/.Requirements/R05. AGENT MANAGER/prototype-design-vision/style.css"`
Expected: `1` (local — stays)

- [ ] **Step 7: Commit**

```bash
git add "Documentation/.Requirements/R05. AGENT MANAGER/prototype-design-vision/style.css"
git commit -m "refactor(R05-design-vision): migrate 16 --ai-* tokens to central, keep 43 local"
```

### Task 7: R06 Localization prototype — replace `:root` with `@import`

**Files:**
- Modify: `Documentation/.Requirements/R06. Localization/prototype/style.css`

The `:root` block is at lines 9-176 (168 lines of duplicate tokens — the most comprehensive local copy).

- [ ] **Step 1: Read lines 170-180 to confirm `:root` closing brace**

Verify `}` at line 176.

- [ ] **Step 2: Replace lines 1-176 with import header**

```css
/* ═══════════════════════════════════════════════════════════════════════════
   EMSIST Localization Prototype — Stylesheet
   Design system tokens imported from central source.
   ═══════════════════════════════════════════════════════════════════════════ */

/* ================================================================
   Design System Tokens — DO NOT define tokens locally.
   Source of truth: frontend/src/styles.scss
   ================================================================ */
@import url('../../../design-system/tokens.css');
@import url('../../../design-system/prototype-extras.css');
```

- [ ] **Step 3: Verify no local `:root` remains**

Run: `grep -c ':root' "Documentation/.Requirements/R06. Localization/prototype/style.css"`
Expected: `0`

- [ ] **Step 4: Commit**

```bash
git add "Documentation/.Requirements/R06. Localization/prototype/style.css"
git commit -m "refactor(R06-prototype): replace local :root tokens (176 lines) with @import"
```

---

## Chunk 3: Fix Off-Palette Colors in Main Prototype

### Task 8: Fix 9 off-palette hex colors in `style.css`

**Files:**
- Modify: `Documentation/prototypes/style.css`

- [ ] **Step 1: Count off-palette occurrences before fix**

Run these to establish baseline:
```bash
grep -cn '#2ecc71' Documentation/prototypes/style.css
grep -cn '#95a5a6' Documentation/prototypes/style.css
grep -cn '#8a7540' Documentation/prototypes/style.css
grep -cn '#5b9bd5' Documentation/prototypes/style.css
grep -cn '#8e6bbf' Documentation/prototypes/style.css
grep -cn '#e8a838' Documentation/prototypes/style.css
```

Expected totals: 4 + 2 + 7 + 1 + 1 + 1 = 16 occurrences in style.css.

- [ ] **Step 2: Replace `#2ecc71` (4 occurrences)**

Replace all instances per the spec:
- `.trend-arrow.up { color: #2ecc71; }` → `color: var(--tp-primary);`
- `.trend-change.positive { color: #2ecc71; }` → `color: var(--tp-primary);`
- `.status-dot.connected { background: #2ecc71; }` → `background: var(--tp-primary); box-shadow: 0 0 6px rgba(66,129,119,0.4);`
- `.status-dot.online { background: #2ecc71; }` → `background: var(--tp-primary); box-shadow: 0 0 6px rgba(66,129,119,0.4);`

- [ ] **Step 3: Replace `#95a5a6` (2 occurrences)**

- `.role-viewer { background: #95a5a6; }` → `background: color-mix(in srgb, var(--tp-text) 35%, transparent);`
- `.status-dot.disconnected { background: #95a5a6; }` → `background: color-mix(in srgb, var(--tp-text) 35%, transparent);`

- [ ] **Step 4: Replace `#8a7540` (7 occurrences)**

Replace all with `var(--tp-warning)`. These are in `.maturity-badge.l2`, factsheet badge colors, and `.toast.warning`.

- [ ] **Step 5: Replace role badge colors (`#5b9bd5`, `#8e6bbf`, `#e8a838`)**

Per spec Section 4.3, replace:
- `.role-tenant-admin { background: #5b9bd5; }` → `background: var(--tp-primary-dark); color: var(--tp-white);`
- `.role-agent-designer { background: #8e6bbf; }` → `background: var(--tp-danger); color: var(--tp-white);`
- `.role-user { background: #e8a838; }` → `background: var(--tp-primary-light); color: var(--tp-text);`

- [ ] **Step 6: Verify zero off-palette colors remain**

Run: `grep -cE '#2ecc71|#95a5a6|#8a7540|#5b9bd5|#8e6bbf|#e8a838' Documentation/prototypes/style.css`
Expected: `0`

- [ ] **Step 7: Commit**

```bash
git add Documentation/prototypes/style.css
git commit -m "fix(prototype): replace 9 off-palette hex colors with design system tokens"
```

### Task 9: Replace ~120 hardcoded approved-palette hex values with `var()` in `style.css`

**Files:**
- Modify: `Documentation/prototypes/style.css`

- [ ] **Step 1: Count hardcoded hex before fix**

```bash
grep -c '#428177' Documentation/prototypes/style.css
grep -c '#054239' Documentation/prototypes/style.css
grep -c '#b9a779' Documentation/prototypes/style.css
grep -c '#edebe0' Documentation/prototypes/style.css
grep -c '#3d3a3b' Documentation/prototypes/style.css
grep -c '#6b1f2a' Documentation/prototypes/style.css
```

- [ ] **Step 2: Replace `#428177` → `var(--tp-primary)`**

Use global find-replace. **Exclude** occurrences inside `rgba()` function calls (e.g., `rgba(66, 129, 119, ...)` — these use the RGB breakdown, not the hex) and SVG data URIs.

- [ ] **Step 3: Replace `#054239` → `var(--tp-primary-dark)`**

Same approach — exclude SVG data URIs and `rgba()` forms.

- [ ] **Step 4: Replace `#b9a779` → `var(--tp-primary-light)`**

- [ ] **Step 5: Replace `#edebe0` → `var(--tp-surface)`**

- [ ] **Step 6: Replace `#fff`/`#ffffff` → `var(--tp-white)`**

**Caution:** Don't replace `#fff` inside SVG data URIs or within `rgba(255, 255, 255, ...)`. Only replace standalone CSS property values like `color: #fff;` or `background: #ffffff;`.

- [ ] **Step 7: Replace `#3d3a3b` → `var(--tp-text)`**

- [ ] **Step 8: Replace `#6b1f2a` → `var(--tp-danger)`**

- [ ] **Step 9: Add gradient utility classes**

Add at the end of the file, before any media queries:
```css
/* ================================================================
   Gradient utilities — replace inline gradient styles in index.html
   ================================================================ */
.gradient-primary { background: linear-gradient(90deg, var(--tp-primary), color-mix(in srgb, var(--tp-primary) 60%, var(--tp-surface))); }
.gradient-dark    { background: linear-gradient(90deg, var(--tp-primary-dark), var(--tp-primary)); }
.gradient-light   { background: linear-gradient(90deg, var(--tp-primary-light), color-mix(in srgb, var(--tp-primary-light) 50%, var(--tp-surface))); }

/* Stacked bar segments (maturity levels) */
.stacked-bar-segment[data-level="l1"] { background: var(--tp-danger); }
.stacked-bar-segment[data-level="l2"] { background: var(--tp-primary-light); }
.stacked-bar-segment[data-level="l3"] { background: var(--tp-primary); }
.stacked-bar-segment[data-level="l4"] { background: var(--tp-primary-dark); }
.stacked-bar-segment[data-level="l5"] { background: var(--tp-text-dark); }
```

- [ ] **Step 10: Verify remaining hex count is minimal**

Run: `grep -oE '#[0-9a-fA-F]{3,8}' Documentation/prototypes/style.css | sort | uniq -c | sort -rn`

Expected: Only hex values inside SVG data URIs and `rgba()` form values should remain. Zero standalone CSS hex color values.

- [ ] **Step 11: Commit**

```bash
git add Documentation/prototypes/style.css
git commit -m "refactor(prototype): replace ~120 hardcoded hex values with var() token references"
```

### Task 10: Fix off-palette colors in `index.html`

**Files:**
- Modify: `Documentation/prototypes/index.html`

- [ ] **Step 1: Find all inline hex in index.html**

Run: `grep -n 'style=.*#[0-9a-fA-F]' Documentation/prototypes/index.html | head -30`

- [ ] **Step 2: Replace inline gradient styles with CSS classes**

Find all lines with `style="...background:linear-gradient(90deg,#428177,#5ba89d)..."` and replace the gradient portion with the `gradient-primary` CSS class. Keep the `width:XX%` as an inline style.

Before: `<div class="horizontal-bar-fill" style="width:78%;background:linear-gradient(90deg,#428177,#5ba89d)"></div>`
After: `<div class="horizontal-bar-fill gradient-primary" style="width:78%"></div>`

- [ ] **Step 3: Replace all inline `#95a5a6` with CSS classes**

Run: `grep -n '#95a5a6' Documentation/prototypes/index.html` to find all 3 occurrences.
Replace each `style="background:#95a5a6"` with `class="status-offline"` (add a CSS class `.status-offline { background: color-mix(in srgb, var(--tp-text) 35%, transparent); }` in style.css if not already present).

- [ ] **Step 4: Replace stacked bar inline colors with data attributes**

Line 818: Replace inline `style="background:#022a23"` etc. with `data-level="l5"` attributes (CSS from Task 9 Step 9 handles the colors).

- [ ] **Step 5: Replace remaining inline hex values**

Replace any remaining inline `#428177` with `var(--tp-primary)`, `#054239` with `var(--tp-primary-dark)`, etc. For inline styles, this means using the CSS variable directly: `style="color:var(--tp-primary)"`.

- [ ] **Step 6: Verify**

Run: `grep -c '#[0-9a-fA-F]\{3,8\}' Documentation/prototypes/index.html`
Expected: Minimal (only within SVG paths which are not colors).

- [ ] **Step 7: Commit**

```bash
git add Documentation/prototypes/index.html
git commit -m "fix(prototype): replace inline hex colors in index.html with CSS classes and var()"
```

---

## Chunk 4: Requirements Compliance Clauses & Documentation Fixes

### Task 11: Add Design System Compliance clause to R04 Design Spec

**Files:**
- Modify: `Documentation/.Requirements/R04. MASTER DESFINITIONS/Design/05-UI-UX-Design-Spec.md`

- [ ] **Step 1: Read lines 1-15 to find insertion point**

Insert after the `---` separator following the document header (after line 10).

- [ ] **Step 2: Insert the compliance clause**

Insert the full "Design System Compliance (MANDATORY)" section from spec Section 4.1 (lines 66-101) after the document header separator.

- [ ] **Step 3: Commit**

```bash
git add "Documentation/.Requirements/R04. MASTER DESFINITIONS/Design/05-UI-UX-Design-Spec.md"
git commit -m "docs(R04): add Design System Compliance clause to UI/UX Design Spec"
```

### Task 12: Add Design System Compliance clause + Prototype Compliance Notes to R05 Design Spec

**Files:**
- Modify: `Documentation/.Requirements/R05. AGENT MANAGER/Design/06-UI-UX-Design-Spec.md`

- [ ] **Step 1: Read lines 1-20 to find insertion point**

Insert after line 16 (`---` separator).

- [ ] **Step 2: Insert the compliance clause**

Same clause as Task 11.

- [ ] **Step 3: Append the Prototype Compliance Notes section**

Add at the end of the file, the full "Prototype Compliance Notes (2026-03-12 BA Audit)" section from spec Section 4.7 (lines 290-326).

- [ ] **Step 4: Commit**

```bash
git add "Documentation/.Requirements/R05. AGENT MANAGER/Design/06-UI-UX-Design-Spec.md"
git commit -m "docs(R05): add Design System Compliance clause and Prototype Compliance Notes"
```

### Task 13: Add Design System Compliance clause to R06 Design Spec

**Files:**
- Modify: `Documentation/.Requirements/R06. Localization/Design/05-UI-UX-Design-Spec.md`

- [ ] **Step 1: Read lines 1-20 to find insertion point**

Insert after line 16 (`---` separator).

- [ ] **Step 2: Insert the compliance clause**

Same clause as Task 11.

- [ ] **Step 3: Commit**

```bash
git add "Documentation/.Requirements/R06. Localization/Design/05-UI-UX-Design-Spec.md"
git commit -m "docs(R06): add Design System Compliance clause to UI/UX Design Spec"
```

### Task 14: Fix README `--tp-success` value

**Files:**
- Modify: `Documentation/prototypes/README.md` (line 94)

- [ ] **Step 1: Read line 94 in context**

Confirm: `| --tp-success | #2e7d32 | Success states |`

- [ ] **Step 2: Replace with correct value**

Replace `#2e7d32` with `#428177` (matching `tokens.css` line 117).

- [ ] **Step 3: Commit**

```bash
git add Documentation/prototypes/README.md
git commit -m "fix(prototype): correct --tp-success value in README (#2e7d32 → #428177)"
```

---

## Chunk 5: R06 Localization Prototype Integration

### Task 15: Add dock item for Localization in main prototype

**Files:**
- Modify: `Documentation/prototypes/index.html`

- [ ] **Step 1: Read the dock sidebar section**

Read around line 259-300 to see the dock items and identify where to add the new item.

- [ ] **Step 2: Add dock item after the last existing entry**

Add a new `<li>` after the last dock item:
```html
<li class="dock-item" data-section="master-locale" data-roles="platform-admin,tenant-admin">
    <div class="dock-icon-wrapper">
        <i class="pi pi-language dock-icon"></i>
        <span class="dock-label">Localization</span>
    </div>
</li>
```

- [ ] **Step 3: Commit**

```bash
git add Documentation/prototypes/index.html
git commit -m "feat(prototype): add Localization dock item to main prototype navigation"
```

### Task 16: Integrate R06 content and replace Translation Progress stub

**Files:**
- Modify: `Documentation/prototypes/index.html`
- Read: `Documentation/.Requirements/R06. Localization/prototype/index.html`

- [ ] **Step 1: Read the Translation Progress stub (around line 1802)**

Read lines 1795-1820 to identify the full stub to replace.

- [ ] **Step 2: Read the R06 prototype's main content area**

Read `Documentation/.Requirements/R06. Localization/prototype/index.html` to find the `<div class="tab-bar">` and all tab panel content. Extract everything between the main app container and the `<script>` section.

- [ ] **Step 3: Replace the Translation Progress stub**

Replace the stub section with:
```html
<div id="master-locale" class="content-section" style="display:none">
    <!-- R06 Localization — integrated from R06 prototype (2026-03-12) -->
    [R06 tab-bar + all 5 tab panels pasted here]
</div>
```

- [ ] **Step 4: Verify dock navigation works**

Open `index.html` in browser. Click the "Localization" dock item. Verify the 5-tab localization UI appears.

- [ ] **Step 5: Commit**

```bash
git add Documentation/prototypes/index.html
git commit -m "feat(prototype): integrate R06 localization 5-tab UI into main prototype"
```

### Task 17: Merge R06 CSS into main prototype

**Files:**
- Modify: `Documentation/prototypes/style.css`
- Read: `Documentation/.Requirements/R06. Localization/prototype/style.css`

- [ ] **Step 1: Check for class name conflicts**

Run: `grep -oE '\.[a-z][a-z0-9-]+' "Documentation/.Requirements/R06. Localization/prototype/style.css" | sort -u > /tmp/r06-classes.txt`
Run: `grep -oE '\.[a-z][a-z0-9-]+' Documentation/prototypes/style.css | sort -u > /tmp/main-classes.txt`
Run: `comm -12 /tmp/r06-classes.txt /tmp/main-classes.txt`

Review collisions. The R06 prototype uses `locale-`, `lang-`, `dict-`, `import-`, `rollback-`, `ai-translate-` prefixes which should not collide.

- [ ] **Step 2: Copy R06 CSS rules (excluding the `:root` block)**

Append to the end of `Documentation/prototypes/style.css`:
```css
/* ================================================================
   R06 LOCALIZATION — Merged from R06 prototype (2026-03-12)
   ================================================================ */
[R06 style.css content from line 177 onward — everything after the :root block]
```

- [ ] **Step 3: Replace any hardcoded hex in the merged CSS with `var()`**

The R06 CSS should already use `var()` references (83% compliance per audit), but fix any remaining hardcoded hex values.

- [ ] **Step 4: Commit**

```bash
git add Documentation/prototypes/style.css
git commit -m "feat(prototype): merge R06 localization CSS into main prototype stylesheet"
```

### Task 18: Add integration comment to R06 standalone prototype

**Files:**
- Modify: `Documentation/.Requirements/R06. Localization/prototype/index.html`

- [ ] **Step 1: Add comment at the top of the file**

Insert after `<!DOCTYPE html>`:
```html
<!-- Integrated into main prototype: Documentation/prototypes/index.html#master-locale -->
```

- [ ] **Step 2: Commit**

```bash
git add "Documentation/.Requirements/R06. Localization/prototype/index.html"
git commit -m "docs(R06): add integration pointer to main prototype"
```

---

## Chunk 6: Final Verification

### Task 19: Run acceptance criteria checks

- [ ] **Step 1: Check for off-palette hex in style.css**

```bash
grep -nE '#2ecc71|#95a5a6|#8a7540|#5ba89d|#d4c99a|#022a23|#5b9bd5|#8e6bbf|#e8a838' Documentation/prototypes/style.css
```
Expected: Zero matches.

- [ ] **Step 2: Check all prototype CSS files have `@import` and no `:root`**

```bash
head -15 Documentation/prototypes/style.css
head -15 "Documentation/.Requirements/R04. MASTER DESFINITIONS/prototype/style.css"
head -15 "Documentation/.Requirements/R05. AGENT MANAGER/prototype/style.css"
head -15 "Documentation/.Requirements/R05. AGENT MANAGER/prototype-design-vision/style.css"
head -15 "Documentation/.Requirements/R06. Localization/prototype/style.css"
```
Expected: All show `@import url('...tokens.css')` within the first 15 lines.

- [ ] **Step 3: Check compliance clauses exist**

```bash
grep -l "Design System Compliance (MANDATORY)" \
  "Documentation/.Requirements/R04. MASTER DESFINITIONS/Design/05-UI-UX-Design-Spec.md" \
  "Documentation/.Requirements/R05. AGENT MANAGER/Design/06-UI-UX-Design-Spec.md" \
  "Documentation/.Requirements/R06. Localization/Design/05-UI-UX-Design-Spec.md"
```
Expected: All 3 files listed.

- [ ] **Step 4: Check `--ai-*` tokens in prototype-extras.css**

```bash
grep -c '\-\-ai-' Documentation/design-system/prototype-extras.css
```
Expected: `16`

- [ ] **Step 5: Check README correction**

```bash
grep 'tp-success' Documentation/prototypes/README.md
```
Expected: `| --tp-success | #428177 | Success states |`

- [ ] **Step 6: Visual check**

Open `Documentation/prototypes/index.html` in browser. Verify:
- Colors are beige/teal theme (no bright green `#2ecc71`, no grey `#95a5a6`)
- Dock navigation works (all sections load)
- Localization section shows 5-tab UI
- Agent Manager section shows status dots in correct palette colors

- [ ] **Step 7: Final commit (if any small fixes needed)**

```bash
git add -A Documentation/
git commit -m "chore(design-system): final verification pass — all acceptance criteria met"
```
