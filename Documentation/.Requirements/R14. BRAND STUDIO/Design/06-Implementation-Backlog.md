# R14 Implementation Backlog -- Brand Studio

**Delivery strategy:** build the runtime foundation first, then the authoring workflow, then governance hardening.

See also:

- `13-F3-Draft-Model-Decision-Paper.md`
- `14-Implementation-Work-Packages.md`

---

## Phase 1 -- Make Branding Real

1. Create brand manifest schema, brand-profile model, draft-workspace model, and authoritative persistence design.
   Reference: `09-Brand-API-and-Persistence-Spec.md`
2. Extend tenant bootstrap to load active branding.
3. Implement brand runtime service with reset + apply lifecycle.
   Reference: `11-Brand-Frontend-Runtime-Design.md`
4. Replace static splash, login, shell, and favicon wiring with runtime brand bindings.
5. Align frontend and backend branding contracts, including `fontFamily` or its approved replacement.
6. Mount the branding editor in a live admin flow.
   Reference: `12-Brand-Studio-Screen-and-IA-Spec.md`
7. Replace asset URL-only flow with upload-backed asset selection.
8. Add tenant icon-library persistence, upload, and active-library selection for object definitions.
9. Add draft save and publish endpoints and UI.
10. If System Cypher is sanctioned, implement the frozen tenant-brand metamodel and graph projection for fact-sheet/query use.
   Reference: `10-Brand-System-Cypher-Projection-Spec.md`
11. Add runtime Playwright coverage for brand load and sweep.

Exit condition:

- active brand loads at bootstrap
- login, shell, splash, and favicon are branded
- draft and publish are distinct

---

## Phase 2 -- Make Branding Safe

1. Add version history and rollback.
2. Add audit views for brand changes.
3. Add typography pack catalog.
4. Add brand presets / starter kits.
5. Add contrast/accessibility scoring before publish.
6. Add compare view between draft and active version.

Exit condition:

- brand changes are reversible
- brand lifecycle is auditable
- typography is a governed product choice

---

## Phase 3 -- Make Branding Durable

1. Add import/export of brand kit.
2. Add dark/light paired brand variants.
3. Add preview sharing for approvals.
4. Add brand-runtime anti-drift scripts to the default governance pipeline.

Exit condition:

- brand operations are portable
- governance blocks regression by default

---

## Immediate Build Sequence

If implementation starts now, the first sequence should be:

1. close remaining backend gaps for assets and icon-library import
2. converge the approved preview sections into the tenant-mounted editor
3. reduce `brand-studio-preview` to a fixture harness around shared sections
4. complete imagery/logo/favicon/login-background management
5. complete login-surface management and runtime sweep verification
6. complete icon-library import and active-library publish flow
7. add browser-backed acceptance on the real tenant-mounted route
8. if sanctioned, tenant-brand graph projection implementation

Do not continue preview-only implementation as a parallel product. The current blocker is convergence plus missing end-to-end asset/login/import support.
