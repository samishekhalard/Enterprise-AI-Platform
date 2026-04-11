# ADR-012: Migrate Frontend Component Library from Bootstrap/ng-bootstrap to PrimeNG 21

**Status:** Proposed
**Date:** 2026-02-26
**Decision Makers:** Architecture Team, Frontend Lead
**Category:** Strategic ADR (Frontend Technology)

---

## Context and Problem Statement

The EMS frontend is built on Angular 21.1.0 with Bootstrap 5.3.8 and `@ng-bootstrap/ng-bootstrap` ^20.0.0 as the component library layer. This combination has reached a strategic inflection point for the following reasons:

### 1. Angular 21 Compatibility Gap [VERIFIED]

`@ng-bootstrap/ng-bootstrap` version 20.0.0 does not support Angular 21. The ng-bootstrap project has historically lagged behind Angular major releases. The current `package.json` (at `/Users/mksulty/Claude/EMSIST/frontend/package.json`) lists `"@ng-bootstrap/ng-bootstrap": "^20.0.0"` against `"@angular/core": "^21.1.0"`, creating a version incompatibility that will produce build warnings and may cause runtime failures as Angular continues to evolve its rendering pipeline.

### 2. Missing Enterprise Components

The current Bootstrap + ng-bootstrap stack provides basic UI primitives (buttons, cards, forms, modals, dropdowns). However, the EMS platform requires enterprise-grade components that are not available:

| Required Component | Bootstrap/ng-bootstrap | PrimeNG |
|--------------------|----------------------|---------|
| Data Table with virtual scroll, column reorder, row expansion, export | Not available | `p-table` with all features |
| Tree Table (for hierarchical tenant/org data) | Not available | `p-treetable` |
| Multi-select with filtering and templating | Basic only | `p-multiselect` |
| Advanced Date/Time picker (range, inline, locale-aware) | Basic datepicker | `p-calendar` |
| File Upload with drag-drop, preview, chunked upload | Not available | `p-fileupload` |
| Context Menu (right-click) | Not available | `p-contextmenu` |
| Stepper/Wizard (for onboarding, license setup) | Not available | `p-stepper` |
| Sidebar/Drawer (responsive) | Not available | `p-drawer` |
| Splitter (for BPMN editor layouts) | Not available | `p-splitter` |
| Toast/Notification system | Not available (manual) | `p-toast` |
| Confirm Dialog (programmatic) | Not available (manual) | `p-confirmdialog` |
| Chip/Tag Input | Not available | `p-chips` |
| Autocomplete with templating | Not available | `p-autocomplete` |

### 3. Multi-Tenant Theming Limitations

The EMS platform serves multiple tenants, each requiring branding customization (colors, logos, fonts). The current approach uses a monolithic `styles.scss` file (at `/Users/mksulty/Claude/EMSIST/frontend/src/styles.scss`, ~989 lines) that manually overrides Bootstrap component classes with ThinkPLUS design tokens (CSS custom properties prefixed `--tp-*`).

This approach has scaling problems:
- Every Bootstrap component override must be manually maintained.
- Tenant-specific theme switching requires overriding CSS custom properties at the `:root` level, but Bootstrap's internal SCSS variables are compile-time, not runtime-switchable.
- Adding new components means writing new override blocks.

PrimeNG 21's unstyled mode with design tokens provides a runtime-switchable theming system that maps directly to CSS custom properties, enabling per-tenant theme injection without SCSS recompilation.

### 4. RTL and Arabic Support

The EMS platform targets the UAE market (see ADR-011, UAE Pass integration). Arabic RTL support requires that all UI components respect `dir="rtl"` and mirror layouts correctly. Bootstrap's RTL support is CSS-level only (via `bootstrap.rtl.css`). ng-bootstrap components do not guarantee RTL rendering correctness for complex widgets. PrimeNG provides verified RTL support across all components with automatic direction detection.

### 5. Current Design System Investment

The ThinkPLUS design system (verified in `/Users/mksulty/Claude/EMSIST/frontend/src/styles.scss`) has substantial CSS custom property infrastructure:
- Color tokens: `--tp-teal`, `--tp-blue-dark`, `--tp-gray-*` series
- Typography: Gotham Rounded font family with Book/Medium/Bold weights
- Spacing/radius tokens: `--tp-radius-sm` through `--tp-radius-2xl`
- Shadow tokens: `--tp-shadow-sm` through `--tp-shadow-xl`, glass effects
- Transition tokens: `--tp-transition-fast/normal/slow/bounce`
- WCAG focus indicators: `--tp-focus-ring`, `--tp-focus-outline`
- Touch targets: `--tp-touch-target-min: 44px`

This investment is preserved and enhanced by PrimeNG's design token architecture, not discarded.

---

## Decision Drivers

1. **Angular version alignment** -- Component library must support Angular 21+ and track Angular releases promptly.
2. **Enterprise component richness** -- The platform needs data tables, tree tables, file uploads, steppers, and other enterprise widgets out of the box.
3. **Multi-tenant runtime theming** -- Theme switching must be CSS-custom-property-driven, not SCSS-compile-time.
4. **Arabic RTL completeness** -- All components must render correctly in RTL mode.
5. **Accessibility compliance** -- WCAG 2.2 AA minimum, AAA target (aligning with ThinkPLUS standards).
6. **Design system preservation** -- The migration must preserve the ThinkPLUS visual identity, not replace it with a generic theme.
7. **Incremental migration** -- The migration cannot be a big-bang rewrite; it must be component-by-component alongside ongoing feature development.
8. **BPMN editor compatibility** -- `bpmn-js` and its ecosystem must remain unaffected.

---

## Considered Alternatives

### Option 1: PrimeNG 21 (Unstyled + Design Tokens)

PrimeNG is the largest Angular-native component library (80+ components). Version 21 introduces an unstyled mode where components render with no default styling, exposing a design token API that maps to CSS custom properties. This allows the ThinkPLUS design system to control all visual aspects through its existing `--tp-*` token namespace.

**Strengths:**
- Angular-first: built specifically for Angular, tracks Angular releases within days.
- 80+ enterprise components including all missing ones listed above.
- Unstyled mode with design token passthrough enables ThinkPLUS control.
- Built-in RTL support with `dir` attribute detection.
- WCAG 2.1 AA compliant (with AAA achievable through token customization).
- Active maintenance: >12,000 GitHub stars, PrimeTek commercial backing.
- Proven in enterprise: widely adopted in banking, government, healthcare.
- `PrimeIcons` or custom icon adapter (no forced icon library).

**Weaknesses:**
- Large library; bundle size requires tree-shaking discipline.
- Learning curve for design token mapping.
- Migration effort for existing Bootstrap-styled components.

### Option 2: Angular Material (CDK + Material 3)

Angular Material is Google's official component library for Angular, based on Material Design 3 with design tokens.

**Strengths:**
- Official Angular team support; guaranteed version alignment.
- Material Design 3 with design token theming.
- CDK primitives for custom components.
- Good accessibility.

**Weaknesses:**
- **Opinionated Material Design aesthetic** -- Difficult to make look like ThinkPLUS (Gotham Rounded, teal palette, glass morphism). Material Design has a distinct visual language.
- **Fewer enterprise components** -- No tree table, no advanced data table with virtual scroll/export, no file upload, no BPMN-compatible splitter.
- **RTL support is good but theming customization is harder** -- Material tokens are Material-specific, not generic CSS custom properties.
- **Significant visual departure** from current ThinkPLUS look-and-feel.

**Rejected because:** Material Design's opinionated aesthetic conflicts with the ThinkPLUS brand identity. The component gap for enterprise data-heavy views (tree table, data export, advanced filtering) would require building custom components, negating the benefit of a library.

### Option 3: Spartan UI (shadcn/ui for Angular)

Spartan UI is an emerging Angular library inspired by shadcn/ui (React) -- headless components with copy-paste source code.

**Strengths:**
- Full design control (copy source into project).
- Tailwind CSS based theming.
- Modern, minimalist.

**Weaknesses:**
- **Immature** -- Pre-1.0, small community, limited enterprise components.
- **No data table, tree table, file upload, stepper** out of the box.
- **Would require building most enterprise components from scratch.**
- **Tailwind dependency** adds a new build toolchain requirement.
- No guaranteed Angular version tracking.

**Rejected because:** Insufficient component coverage for an enterprise SaaS platform. The effort to build missing components would exceed the effort of migrating to PrimeNG.

### Option 4: Stay on Bootstrap + ng-bootstrap (Workaround Compatibility)

Pin ng-bootstrap at a compatible version or fork to fix Angular 21 compatibility.

**Strengths:**
- No migration effort.
- Team familiarity.

**Weaknesses:**
- **Unresolved enterprise component gap** -- Still no data table, tree table, etc.
- **Fork maintenance burden** if ng-bootstrap does not release Angular 21 support.
- **Theming limitations persist** -- SCSS compile-time variables, manual overrides.
- **Technical debt accumulates** with each Angular version.

**Rejected because:** This does not solve the enterprise component gap or the theming scalability problem. It only defers the inevitable migration while accumulating technical debt.

---

## Decision

**Migrate the EMS frontend from Bootstrap 5 + ng-bootstrap to PrimeNG 21 using the unstyled/design-token approach, with an incremental component-by-component migration strategy.**

### What Changes

| Aspect | Before | After |
|--------|--------|-------|
| Component library | `@ng-bootstrap/ng-bootstrap` ^20.0.0 | `primeng` ^21.x (unstyled mode) |
| CSS framework | `bootstrap` ^5.3.8 | PrimeNG design tokens mapped to `--tp-*` tokens |
| Dependency: `@popperjs/core` | Required by Bootstrap | Removed (PrimeNG uses its own overlay system) |
| Theming approach | SCSS overrides in `styles.scss` | Design token file mapping `--tp-*` to PrimeNG tokens |
| RTL support | `bootstrap.rtl.css` + manual overrides | PrimeNG built-in `dir="rtl"` detection |

### What Stays

| Dependency | Reason |
|------------|--------|
| `bpmn-js` + `@bpmn-io/properties-panel` + `bpmn-js-properties-panel` + `camunda-bpmn-moddle` + `diagram-js-grid` + `diagram-js-minimap` | BPMN process modeler is domain-specific, not a UI component library concern. No migration needed. |
| `apexcharts` + `ng-apexcharts` | Charting library. PrimeNG has `p-chart` (based on Chart.js), but ApexCharts provides superior features for the dashboard use cases. **Evaluate in Phase 3 whether to consolidate to PrimeNG Charts or keep ApexCharts.** |
| ThinkPLUS CSS custom properties (`--tp-*` namespace) | The design token foundation is preserved. PrimeNG unstyled mode consumes these tokens. |
| Gotham Rounded fonts, `@font-face` declarations | Typography is independent of component library. |
| WCAG focus styles, reduced-motion, high-contrast media queries | Accessibility infrastructure is independent. PrimeNG adds its own a11y, which complements these. |

### PrimeNG Unstyled + ThinkPLUS Token Mapping [PLANNED]

PrimeNG unstyled mode renders components with structural HTML and no default CSS. A design token preset maps PrimeNG's token API to ThinkPLUS custom properties:

```typescript
// Planned: src/app/config/primeng-thinkplus-preset.ts
// This file will map PrimeNG design tokens to ThinkPLUS CSS custom properties

export const ThinkPlusPreset = definePreset(Aura, {
  primitive: {
    borderRadius: {
      none: '0',
      xs: '0.375rem',   // --tp-radius-sm
      sm: '0.5rem',     // --tp-radius-md
      md: '0.75rem',    // --tp-radius-lg
      lg: '1rem',       // --tp-radius-xl
      xl: '1.25rem',    // --tp-radius-2xl
    },
  },
  semantic: {
    primary: {
      50:  '{teal.50}',
      100: '{teal.100}',
      // ... mapped to --tp-teal scale
      500: '#047481',   // --tp-teal (primary)
      600: '#035a66',   // --tp-teal-dark
      // ...
    },
    colorScheme: {
      light: {
        surface: {
          0: '#ffffff',      // --tp-bg-surface
          50: '#faf9f5',     // --tp-bg
          // ...
        },
        text: {
          color: '#1a202c',       // --tp-text (--tp-gray-700)
          mutedColor: '#545e6e',  // --tp-text-muted (--tp-gray-400)
        },
      },
    },
    focusRing: {
      width: '2px',
      style: 'solid',
      color: '{primary.500}',
      offset: '2px',
    },
  },
});
```

### Multi-Tenant Theme Switching [PLANNED]

With PrimeNG design tokens, tenant theme switching becomes a runtime operation:

```typescript
// Planned: inject tenant-specific token overrides at login
@Injectable({ providedIn: 'root' })
export class TenantThemeService {
  applyTenantTheme(tenantBranding: TenantBranding): void {
    const root = document.documentElement;
    root.style.setProperty('--tp-primary', tenantBranding.primaryColor);
    root.style.setProperty('--tp-primary-dark', tenantBranding.primaryDarkColor);
    // PrimeNG tokens automatically inherit via the preset mapping
  }
}
```

---

## Migration Strategy

### Guiding Principles

1. **Incremental, not big-bang.** Both Bootstrap and PrimeNG will coexist during migration.
2. **Page-by-page migration.** Each page/feature is migrated as a unit.
3. **New features use PrimeNG from day one.** No new Bootstrap components.
4. **Tests must pass at every step.** Vitest unit tests and Playwright E2E tests gate each migration PR.

### Phase 1: Foundation [PLANNED] (Week 1-2)

| Task | Description |
|------|-------------|
| Install PrimeNG 21 + PrimeIcons | Add `primeng`, `primeicons` to `package.json` |
| Create ThinkPLUS preset | Map `--tp-*` tokens to PrimeNG design token preset |
| Configure unstyled mode | Set `providePrimeNG({ theme: { preset: ThinkPlusPreset, options: { darkModeSelector: '.dark-mode' } } })` |
| Create adapter SCSS | Shared SCSS that bridges Bootstrap utilities still in use (spacing, flex, grid) |
| Verify coexistence | Bootstrap and PrimeNG render side-by-side without CSS conflicts |

### Phase 2: New Feature Pages (PrimeNG-First) [PLANNED] (Week 2-4)

Build all remaining Phase 6 features (from FRONTEND-IMPLEMENTATION-PLAN.md) using PrimeNG:

| Feature | Key PrimeNG Components |
|---------|----------------------|
| User Management List | `p-table` (virtual scroll, sort, filter, export), `p-toolbar`, `p-toast` |
| User Detail Page | `p-tabview`, `p-panel`, `p-confirmdialog` |
| License Dashboard | `p-card`, `p-tag`, `p-progressbar` |
| License Assignment | `p-autocomplete`, `p-stepper`, `p-multiselect` |
| Audit Log Viewer | `p-table` (expandable rows, date range filter), `p-calendar` |
| Session Management | `p-datalist`, `p-confirmpopup` |
| Device Management | `p-datalist`, `p-tag`, `p-toggleswitch` |
| Tenant Settings | `p-tabview`, `p-colorpicker`, `p-fileupload` |

### Phase 3: Existing Page Migration [PLANNED] (Week 4-8)

Migrate existing Bootstrap pages to PrimeNG, one at a time:

| Page | Priority | Complexity |
|------|----------|------------|
| Login page | Medium | Low (simple form) |
| Administration page | High | Medium (skeleton, tabs, lists) |
| Profile page | Medium | Low (form fields) |
| Products module | Medium | Medium (CRUD with table) |
| Personas module | Medium | Medium (CRUD with forms) |
| BPMN Process Modeler | Low | **Minimal** -- BPMN canvas is `bpmn-js`, not Bootstrap. Only toolbar/palette wrappers migrate. |

### Phase 4: Bootstrap Removal [PLANNED] (Week 8-9)

| Task | Description |
|------|-------------|
| Remove `bootstrap` from `package.json` | After all pages migrated |
| Remove `@ng-bootstrap/ng-bootstrap` | After all usages replaced |
| Remove `@popperjs/core` | No longer needed |
| Remove Bootstrap override blocks from `styles.scss` | Replace with PrimeNG preset |
| Audit for leftover Bootstrap CSS classes | Automated grep for `btn-`, `card-`, `form-control`, `modal-`, etc. |
| Final E2E regression | Full Playwright suite on all pages |

### Phase 5: ApexCharts Evaluation [PLANNED] (Week 9-10)

Evaluate whether to keep `apexcharts` + `ng-apexcharts` or migrate to PrimeNG's `p-chart` (Chart.js wrapper). Decision criteria:
- Feature parity for dashboard charts (area, donut, radial bar, heatmap)
- Bundle size impact
- RTL chart rendering

This evaluation does not block the PrimeNG migration; both can coexist.

---

## Consequences

### Positive

- **Angular version alignment** -- PrimeNG tracks Angular releases within days, eliminating the ng-bootstrap version lag.
- **80+ enterprise components** -- Data tables, tree tables, file uploads, steppers, and all missing components become available immediately.
- **Runtime theming** -- Multi-tenant theme switching becomes a CSS custom property operation, no recompilation needed.
- **RTL completeness** -- All PrimeNG components support RTL natively, critical for UAE market.
- **Design system preservation** -- Unstyled mode with token mapping preserves the ThinkPLUS visual identity.
- **Reduced custom CSS** -- Enterprise components replace manual Bootstrap overrides, reducing `styles.scss` from ~989 lines of overrides to a focused token preset.
- **Accessibility improvement** -- PrimeNG components include ARIA attributes, keyboard navigation, and screen reader support out of the box.

### Negative

- **Migration effort** -- Estimated 8-10 weeks of incremental migration alongside feature development.
- **Temporary dual-library coexistence** -- During migration, both Bootstrap and PrimeNG CSS will be loaded, increasing bundle size temporarily.
- **Learning curve** -- Team must learn PrimeNG component APIs and design token system.
- **Bundle size** -- PrimeNG is a large library; tree-shaking and lazy loading must be enforced to keep initial bundle under target.
- **ApexCharts evaluation deferred** -- Charting library decision deferred to Phase 5.

### Neutral

- BPMN editor ecosystem (`bpmn-js`) is unaffected.
- Backend services are unaffected (no API changes required).
- Testing infrastructure (Vitest, Playwright) is unaffected.

---

## Implementation Evidence

Not applicable. Status is **Proposed**. No implementation exists yet.

---

## Risks and Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| CSS conflicts during coexistence | Medium | Medium | Scope Bootstrap CSS with SCSS nesting, test each page after PrimeNG addition |
| PrimeNG unstyled mode token mapping does not cover all ThinkPLUS effects (glass morphism, glow shadows) | Low | Low | ThinkPLUS CSS utilities (`.glass`, `.shadow-glow`, `.hover-lift`) are independent of component library and will continue to work |
| Bundle size exceeds budget | Medium | Medium | Enforce per-component imports, Angular lazy loading per route, monitor with `source-map-explorer` |
| ng-bootstrap releases Angular 21 support during migration | Low | Low | Migration provides value beyond compatibility (enterprise components, theming). Continue migration regardless. |

---

## Related Decisions

- **Related to:** [ADR-011](./ADR-011-multi-provider-authentication.md) -- UAE Pass integration drives RTL requirements.
- **Related to:** [ADR-013](./ADR-013-mobile-platform-strategy.md) -- Mobile strategy depends on responsive component behavior; PrimeNG components are responsive by default.
- **Informs:** Frontend Implementation Plan at `/Users/mksulty/Claude/EMSIST/frontend/docs/FRONTEND-IMPLEMENTATION-PLAN.md`
- **Arc42 Sections:** [04-solution-strategy.md](../arc42/04-solution-strategy.md), [02-constraints.md](../arc42/02-constraints.md), [08-crosscutting.md](../arc42/08-crosscutting.md)

---

## References

- [PrimeNG Documentation](https://primeng.org/)
- [PrimeNG Unstyled Mode](https://primeng.org/unstyled)
- [PrimeNG Design Tokens](https://primeng.org/theming)
- [ng-bootstrap Angular Version Support](https://ng-bootstrap.github.io/#/getting-started)
- [Angular Material](https://material.angular.io/)

---

**Revision History:**

| Date | Change |
|------|--------|
| 2026-02-26 | Initial ADR proposed |
