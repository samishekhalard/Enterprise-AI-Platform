# Terra — The EMSIST Design Language

**Version:** 1.0.0
**Status:** [DOCUMENTED]
**Date:** 2026-03-23
**Audience:** Stakeholders, designers, developers, AI agents

> Terra is the design philosophy that governs how EMSIST looks, feels, and communicates.

This document is the **WHY** layer. It explains the principles, aesthetics, and identity behind every design decision. The [Design System Contract](DESIGN-SYSTEM-CONTRACT.md) is the **WHAT** layer (tokens, rules, architecture). The [component showcase](component-showcase.html) is the **frozen visual contract** — what Terra looks like when rendered.

**Reading order:** Terra Design Language (this) → Design System Contract → Component Showcase → Foundations → Blocks → Components.

---

## Origin Story — Why Terra

EMSIST manages enterprises. Terra is the ground those enterprises stand on.

The name evokes earth, terrain, and foundation. It was chosen because the entire visual identity draws from the natural world: teal from weathered copper, cream from sandstone, gold from desert sand, maroon from fired clay. Every color in Terra could exist in a landscape photograph.

Terra began as a neumorphic experiment — soft, sculpted, pillow-like surfaces with dual-tone shadows that made the UI feel physical. As the system matured, neumorphism was retired from everyday surfaces. It created accessibility challenges (low-contrast borders), theming complexity (shadows must shift with surface color), and visual noise in data-heavy admin screens.

What survived is more interesting than what was removed. The warmth of neumorphic shadows lives on in overlay treatments. The bezel button — the most expressive neumorphic artifact — remains in the shell navigation. The rounded, organic forms that defined early surfaces are now the DNA of every container, button, and input. The `--nm-*` token namespace preserves the neumorphic heritage in its name.

Terra is what emerged from this evolution: a design language that remembers where it came from.

It is not Material Design's geometric confidence, or Apple HIG's glass clarity, or Atlassian's utilitarian pragmatism. Terra is warmer, softer, more grounded — literally named for the earth it evokes.

**Where enterprise meets earth.**

---

## Core Principles

Five principles define Terra. When a design decision feels ambiguous, these resolve it.

### 1. Grounded Warmth

> Cold interfaces create distance. Warm interfaces invite trust.

Every surface in Terra carries warmth. Cream backgrounds instead of stark white. Warm grey borders instead of silver. Teal accents drawn from nature rather than synthetic blue. Even shadows use warm brown tones, never pure black.

This warmth is not decorative. It is a signal that the system was made for humans managing real organizations, not abstract data. Enterprise users spend hours in administrative interfaces. Cold, clinical design creates cognitive distance. Warm design reduces fatigue and invites focused work.

**In practice:**
- No cold greys (`#e5e7eb`, `#f3f4f6`). No pure white surfaces. No `rgba(0,0,0)` shadows.
- Every neutral is tinted warm — toward yellow and brown, away from blue.
- The warm near-black (`#2A241C`) anchors the palette. Even the lightest surface (`#FAF8F4`) has visible yellow warmth.

### 2. Quiet Confidence

> The best interfaces earn trust by what they do not shout.

Terra communicates hierarchy through subtle surface shifts, not dramatic shadows or bold color blocks. The three-tier depth model uses background color differences of just a few HSL steps. Borders nearly disappear. Elevation is `none`.

This restraint is confidence. The system does not need visual pyrotechnics to be understood. Information architecture does the work — type hierarchy, spatial grouping, and surface color carry meaning without noise.

**In practice:**
- `--nm-elevation-default: none`. No drop shadows on cards, panels, or containers.
- Border color (`#E0DDDA`) matches the inset surface, creating a whisper-line, not a wall.
- Type hierarchy is the primary signal for importance: size, weight, and color do the work.

### 3. Organic Form

> Rounded shapes soften complexity. Gentle curves invite interaction.

Terra uses generous border radii — 16px default for containers, pill shapes for navigation and search. The typeface (Gotham Rounded) has rounded terminals that echo the UI's rounded containers. These forms trace back to the neumorphic heritage, where soft, pillowy shapes were the defining characteristic.

Nothing in Terra has sharp corners unless it is a deliberate signal — like a code block or a monospace data field.

**In practice:**
- `--nm-radius-lg` (16px) as the default card and panel radius.
- `--nm-radius-pill` (999px) for buttons, chips, search bars, and navigation islands.
- Gotham Rounded as the brand typeface — geometric structure, softened at every endpoint.
- No 2px or 4px radius on primary containers. Minimum 8px for interactive elements.

### 4. Respectful Density

> Give information room to breathe, but never waste the space.

Terra targets enterprise users who work with data-heavy interfaces daily. It does not chase consumer-app spaciousness, but it refuses the cramped utilitarian grid of legacy enterprise tools.

The 4px base grid with intentional gaps in the scale (no 7x, 9x, 11x) forces deliberate spacing decisions. Touch targets meet WCAG's 44px minimum — not as a concession to mobile, but as a core value. Administrative interfaces are used on tablets in warehouses, on touchscreens in meeting rooms. Touch is not an afterthought.

**In practice:**
- 12px default inner padding. 16px standard gap. 24px section padding.
- 44px minimum touch targets (`--tp-touch-target`).
- Content panels use generous padding but keep related elements tight.
- Spacing drops by one step at each breakpoint: desktop 32px → tablet 24px → mobile 16px.

### 5. Adaptive Identity

> The platform has a soul. Tenants have their own voice.

EMSIST is multi-tenant. Each tenant can customize colors — primary, secondary, surface, shadow tones. Terra defines the structural grammar that remains constant: spacing, typography, depth model, border behavior, interaction patterns. Color is the vocabulary that tenants change.

This separation means a tenant can look dramatically different in color while remaining unmistakably Terra in structure. The frozen component showcase defines Terra independent of any tenant's brand.

**In practice:**
- Structural tokens (spacing, radius, typography, elevation) are not tenant-customizable.
- Color tokens are overridable via `TenantThemeService` at runtime.
- The component showcase is the tenant-neutral visual contract.
- Terra must work across a wide range of primary colors — which is why depth uses surface shifts, not colored shadows.

---

## The Color World

### Palette Philosophy

Terra's palette is drawn from natural materials:

| Role | Token | Hex | Natural Origin |
|------|-------|-----|----------------|
| Primary | `--tp-primary` | `#428177` | Weathered copper, teal patina |
| Primary dark | `--tp-primary-dark` | `#054239` | Deep forest, oxidized bronze |
| Warning | `--tp-warning` | `#988561` | Desert sand, aged parchment |
| Danger | `--tp-danger` | `#6b1f2a` | Fired clay, dried earth |
| Surface | `--tp-surface` | `#F2EFE9` | Sandstone, warm limestone |
| Raised surface | `--tp-surface-raised` | `#FAF8F4` | Bleached cotton, sunlit paper |
| Inset surface | `--nm-surface` | `#E0DDDA` | Weathered stone, slate dust |
| Text | `--tp-text` | `#3d3a3b` | Wet earth, dark loam |
| Heading text | `--tp-text-dark` | `#2A241C` | Night soil, charcoal |
| Border | `--tp-border` | `#E0DDDA` | Dry limestone edge |

### The Warmth Rule

Every neutral in Terra is tinted warm. The warm near-black (`#2A241C`) appears in overlays, deep text, and shadow RGB channels. Even the lightest surface (`#FAF8F4`) has visible yellow warmth. This is not accidental — it is the single most defining characteristic of Terra's color world.

Test: take any neutral from the palette and check its hue. If it leans blue or purely gray, it is not Terra.

### The Surface Hierarchy as a Color Story

Depth in Terra is painting, not physics. Three tones from the same warm family:

```
Page ground:    #F2EFE9  (sandstone)
     ↓  darker, recessed
Inset surface:  #E0DDDA  (weathered stone)
     ↑  lighter, raised
Raised surface: #FAF8F4  (sunlit paper)
```

No shadows separate these layers. The eye reads lighter as closer, darker as further. This is Terra's most architecturally distinctive decision.

### Semantic Intent vs Visual Identity

`--tp-primary` and `--tp-success` share the same hex today (`#428177`) but are separate tokens because they carry different meanings. Color is communication, not identity. When a tenant overrides the primary color, success remains independently meaningful.

---

## The Voice of Type

### Typeface Personality

Gotham Rounded was chosen because its rounded terminals echo Terra's organic forms. It is geometric in structure — legible, modern, clean — but softened at every endpoint. It says "professional but not corporate."

Nunito as the first fallback preserves the rounded character when the brand font is unavailable. Both share soft terminal shapes. The system degrades gracefully through platform fonts to generic sans-serif.

### The Compact Scale

Five steps — `xs` through `xl` — is deliberately fewer than most design systems. This constraint prevents typographic noise in data-dense enterprise screens. When every heading size is meaningful, users learn the hierarchy faster.

| Token | Value | Role |
|-------|-------|------|
| `--tp-font-xs` | 0.72rem | Captions, timestamps, microcopy |
| `--tp-font-sm` | 0.82rem | Table cells, labels, compact content |
| `--tp-font-md` | 0.92rem | Default body text, form inputs |
| `--tp-font-lg` | 1.15rem | Card titles, subheadings |
| `--tp-font-xl` | 1.35rem | Page titles, section headings |

### Weight as Emphasis

Three weights map to three roles:

| Weight | Name | Role |
|--------|------|------|
| 400 | Book | Reading — body text, labels, secondary content |
| 600 | Medium | Emphasis — buttons, navigation, table headers, badges |
| 700 | Bold | Structure — headings, strong emphasis |

No exceptions. If text is interactive, it is 600. If text is a heading, it is 700. If text is read, it is 400.

### Type as Structure

In Terra, type hierarchy does the heavy lifting that shadows and colored panels do in other systems. Because surfaces are quiet — flat, warm, same-family colors — font size and weight become the primary means of communicating what matters. This is why the type scale is precise and the weight rules are strict.

---

## Spatial Rhythm and Breathing Room

### The 4px Heartbeat

Every measurement is a multiple of 4px. This creates a subtle visual rhythm that the eye perceives as order without consciously noticing it. The gaps in the scale (no 28px, no 36px, no 44px as spacing) are intentional — they prevent the "1px difference" debates that plague design systems.

```
0 → 4 → 8 → 12 → 16 → 20 → 24 → 32 → 40 → 48 → 64
```

### Density Philosophy

Terra sits between compact enterprise tools (8px grids, tight tables) and spacious consumer apps (24px grids, generous white space). The 12px default inner padding is the fulcrum of this balance — tight enough for data density, generous enough for reading comfort.

### The Responsive Contract

Spacing drops by one scale step at each breakpoint. Desktop `var(--tp-space-8)` becomes tablet `var(--tp-space-6)` becomes mobile `var(--tp-space-4)`. This mechanical rule removes subjective decisions from responsive adaptation.

### Touch as a First-Class Citizen

The 44px minimum touch target (`--tp-touch-target`) is not a concession to mobile. It is a core Terra value. Administrative interfaces are used on tablets in warehouses, on touchscreens in meeting rooms, by users with motor impairments. Every interactive element must be comfortably tappable.

---

## Surface and Depth — The Flat Neumorphic Legacy

### The Neumorphic Origin

Terra began as a neumorphic design system. Soft dual-tone shadows, embossed buttons, inset containers — surfaces that felt like sculpted material. The `--nm-*` token namespace is the archaeological record of this era.

### What Was Retired

Neumorphic shadows on everyday surfaces. They created three problems:
1. **Accessibility**: Low-contrast borders meant some users could not distinguish where one element ended and another began.
2. **Theming complexity**: Shadows must change when surface colors change. In a multi-tenant system, this made branding fragile.
3. **Visual noise**: In data-heavy admin screens, dual-tone shadows on every card and input created relentless visual texture that fatigued the eye.

### What Survived

The most expressive elements kept their neumorphic treatment:

- **Bezel buttons** in the shell navigation — gradient background layer, face layer, dual shadow. The most physical-feeling elements in Terra.
- **Overlay shadows** on dialogs and modals — warm brown tones (`rgba(42, 36, 28, 0.18)`) that feel like natural shadow, not synthetic black.
- **The island metaphor** — self-contained, rounded, bordered containers that float over the page. Islands are the highest-fidelity expression of Terra's visual identity.

### The Three-Tier Depth Model

Depth in Terra is communicated through background color, not elevation:

| Tier | Surface | Hex | Meaning |
|------|---------|-----|---------|
| Ground | Page background | `#F2EFE9` | The earth — default context |
| Below | Inset surface | `#E0DDDA` | Recessed — tab wells, search containers, disabled states |
| Above | Raised surface | `#FAF8F4` | Floating — cards, panels, active inputs |

No drop shadows. No `box-shadow` on cards. Depth is painted, not cast.

### Glass Morphism — The Controlled Exception

Backdrop-filter blur is reserved for overlays and dialogs only:

```scss
// Dialog backdrop
background: rgba(var(--nm-text-deep-rgb), 0.18);
backdrop-filter: blur(6px);

// Dialog card
background: rgba(242, 239, 233, 0.72);
backdrop-filter: blur(20px);
border: 1px solid rgba(255, 255, 255, 0.35);
```

This creates a "frosted glass" effect that signals modality — the user has entered a temporary state. Glass morphism is never used for persistent surfaces. It would violate Quiet Confidence.

---

## Motion and Interaction Intent

### Motion Philosophy

Terra's motion is natural and unhurried. Nothing snaps. Nothing bounces aggressively. Transitions feel like settling — a stone coming to rest, not a spring releasing.

### Duration Principles

| Speed | Duration | Use |
|-------|----------|-----|
| Fast | 0.12s | Hover color changes, focus rings, opacity shifts |
| Normal | 0.2s | Panel expansion, tab switches, state transitions |
| Slow | 0.3s | Dialog entry, page transitions, large-scale layout shifts |

### The "No transition: all" Rule

Terra specifies individual transition properties because deliberate animation is a design choice, not blanket behavior. Each property that transitions was chosen intentionally. `transition: all` is a lint violation.

### Interaction Tone

- **Hover states** are invitations, not announcements. Subtle color shifts, not dramatic overlays.
- **Active/pressed states** use bezel inversion — the neumorphic pressed effect inherited from the shell buttons. Light-to-dark shadow flip.
- **Focus states** use a colored outline (`--tp-focus-ring`), never shadow-only. Focus must be visible to keyboard users in all lighting conditions.

### Future Motion Direction (PLANNED)

These are aspirational directions, not current implementations:
- Page transitions should feel like turning earth — lateral slides with slight depth shift.
- Dialog entry should feel like rising from the ground — upward motion with gentle opacity fade.
- Toast notifications should settle in from above — a natural descent, not a snap.
- Loading states should pulse with warmth — breathing, not spinning.

---

## Accessibility as a Foundation, Not an Overlay

### WCAG AAA as Default

Terra targets AAA, not AA. This is philosophy-driven, not compliance-driven. If an interface claims to be warm and inviting, it must be warm and inviting to everyone.

| Standard | Ratio Required | Terra Achieves |
|----------|---------------|----------------|
| Normal text (AAA) | 7:1 | 7.6:1 (body on surface) |
| Large text (AAA) | 4.5:1 | 10.8:1 (headings on surface) |
| Non-text elements (AA) | 3:1 | 3.8:1+ (borders, icons) |

### The Warm-Palette Challenge

Warm palettes are harder to make accessible than cold palettes because warm neutrals have lower intrinsic contrast. Terra solves this with a very dark warm text color (`#3d3a3b` at 7.6:1 on cream) and an even darker heading color (`#2A241C` at 10.8:1 on cream).

**Known limitation:** White text on teal (`#428177`) achieves only 3.8:1 — insufficient for AAA normal text. Terra requires either dark text on teal backgrounds or teal text on light backgrounds.

### No Color-Alone Meaning

Every semantic state (danger, warning, success, info) is paired with an icon or text label. Color reinforces meaning; it never carries meaning alone. A colorblind user must be able to distinguish a success toast from an error toast without seeing the color.

### Touch, Not Just Click

44px minimum touch targets. Hover-only interactions guarded with `@media (hover: hover) and (pointer: fine)`. These are structural decisions enforced in the governance layer, not optional guidance.

---

## Multi-Tenant Identity

### The Grammar/Vocabulary Separation

Terra defines the **grammar** — structure, spacing, typography, depth model, interaction patterns. Tenant branding defines the **vocabulary** — primary color, secondary color, surface tint, shadow tone.

This separation means a tenant can look dramatically different in color while remaining unmistakably Terra in structure. The rounded corners, the breathing room, the quiet surfaces, the type hierarchy — these persist across every tenant.

### What Tenants Can Change

| Token | Branding Field | Scope |
|-------|---------------|-------|
| `--tp-primary` | primaryColor | Actions, links, active states |
| `--tp-primary-dark` | primaryColorDark | Hover, pressed states |
| `--tp-warning` | secondaryColor | Warning, caution states |
| `--tp-surface` | surfaceColor | Page background |
| `--nm-shadow-dark` | shadowDarkColor | Shadow base tone |
| `--nm-shadow-light` | shadowLightColor | Shadow highlight tone |

### What Tenants Cannot Change

- Font family, type scale, font weights
- Spacing scale, touch targets
- Border radius scale
- Depth model (surface hierarchy, no shadows)
- Interaction patterns (hover, focus, active behavior)
- Accessibility requirements (contrast minimums, touch targets)

These are structural commitments that ensure every tenant's instance is still recognizably Terra.

### The Component Showcase as Anchor

The frozen HTML showcase defines Terra independent of tenant customization. It is the visual proof that the system works before any branding is applied. When evaluating a tenant's customization, compare it against the showcase structure — the shapes, spacing, and hierarchy should remain legible.

---

## The Terra Decision Framework

When designing or reviewing a new component, answer five questions. If any answer is "no," the component does not feel like Terra.

### The Five Questions

**1. Is it warm?**
Does every surface, border, shadow, and neutral use a warm-tinted color? Are there any cold greys, pure whites, or `rgba(0,0,0)` shadows?

**2. Is it quiet?**
Does it communicate hierarchy through surface color and typography rather than shadows, borders, and color blocks? Could you remove the borders and still understand the layout?

**3. Is it organic?**
Are the corners rounded (minimum 8px for interactive elements, 16px for containers)? Does the shape feel soft rather than sharp? Would it look natural next to Gotham Rounded text?

**4. Is it respectful?**
Does it give content room to breathe without wasting space? Are touch targets at least 44px? Does it work at desktop, tablet, and mobile widths? Could someone with low vision use it comfortably?

**5. Is it structurally stable?**
If you changed the primary color from teal to purple, would it still work? Does the component depend on color for meaning, or does structure carry the message?

### Common Decision Scenarios

| Scenario | Terra Answer |
|----------|-------------|
| Should this card have a shadow? | No. Use `--tp-surface-raised` background and `--tp-border`. Shadows are for overlays only. |
| Should I use white for this background? | No. Use `--tp-surface-raised` (`#FAF8F4`) for floating surfaces or `--tp-surface` (`#F2EFE9`) for page backgrounds. |
| What grey for this border? | `--tp-border` (`#E0DDDA`). It is warm and matches the inset surface. |
| Should I animate this? | Specify individual properties. Use 0.2s for most state changes. Never `transition: all`. |
| Is 4px radius enough for this button? | No. Buttons use `--nm-radius-sm` (8px) minimum. Navigation uses `--nm-radius-pill`. |
| Can I use a hover-only tooltip? | Only behind `@media (hover: hover)`. Provide a tap/focus alternative. |
| PrimeNG renders a white background. Okay? | No. Override via preset or passthrough to use `--tp-surface-raised`. |
| Should this text be pure black? | No. Use `--tp-text-dark` (`#2A241C`) for headings or `--tp-text` (`#3d3a3b`) for body. |

---

## Relationship to Existing Documentation

| Document | Layer | Purpose |
|----------|-------|---------|
| **TERRA-DESIGN-LANGUAGE.md** (this) | WHY | Philosophy, principles, identity, decision framework |
| **DESIGN-SYSTEM-CONTRACT.md** | WHAT | Source-of-truth hierarchy, token architecture, reading order |
| **foundations/** | HOW (primitives) | Color tokens, type scale, spacing scale |
| **components/** | HOW (components) | Per-component usage, props, token integration |
| **blocks/** | HOW (templates) | Layout patterns for common page types |
| **patterns/** | HOW (interactions) | Search, pagination, validation, error handling |
| **component-showcase.html** | FROZEN CONTRACT | The canonical rendering of Terra |
| **COMPLIANCE-CHECKLIST.md** | GATE | Self-assessment for design system compliance |

---

## Glossary

| Term | Definition |
|------|-----------|
| **Island** | A self-contained, rounded, bordered container that floats over the page background. Used for header and footer elements in the shell layout. |
| **Three-tier depth** | The page/inset/raised surface model that communicates depth through background color, not shadow. |
| **Bezel button** | The neumorphic-heritage button treatment with gradient background layer, face layer, and dual shadow. Reserved for shell navigation CTAs. |
| **Grey Neutral** | The accepted default surface language: warm cream page, warm near-white raised surfaces, warm grey borders and inset areas. No pure white, no cold grey. |
| **ThinkPLUS tokens (`--tp-*`)** | Primitive design tokens declared in `:root`. The canonical palette and scale values. |
| **Neumorphic composites (`--nm-*`)** | Derived composite tokens that build on `--tp-*` primitives. Named for the neumorphic heritage even though most surfaces are now flat. |
| **Component showcase** | The frozen HTML file that serves as the canonical visual contract for Terra. |
| **Tenant branding** | Runtime color overrides applied by `TenantThemeService` without changing Terra's structural grammar. |
| **Grammar** | The structural constants of Terra: spacing, typography, radius, depth model. Not tenant-customizable. |
| **Vocabulary** | The color layer of Terra: primary, secondary, surface, shadow tones. Tenant-customizable. |
