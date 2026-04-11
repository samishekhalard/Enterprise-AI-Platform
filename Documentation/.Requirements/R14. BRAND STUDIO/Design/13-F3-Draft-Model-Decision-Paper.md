# R14 F3 Draft Model Decision Paper

**Purpose:** record the accepted decision for the brand draft model.

---

## 1. Accepted decision

F3 is accepted as:

- one editable draft per tenant
- one live active `BrandProfile` per tenant
- no multiple parallel drafts in phase 1

---

## 2. Accepted verdict

---

## 3. Why this is the right decision

### 3.1 Runtime simplicity

Brand runtime already has enough moving parts:

- starter kits
- palette packs
- typography packs
- asset library
- icon library
- publish
- rollback
- tenant bootstrap

Multiple drafts adds workflow complexity without helping runtime correctness.

### 3.2 Cleaner authoring UX

With one draft:

- “what is being edited now” is always clear
- “what is active now” is always clear
- diff and publish screens are simpler
- preview leakage risk is lower

### 3.3 Lower governance burden

Multiple drafts would require:

- draft naming rules
- draft ownership rules
- collision rules
- stale draft cleanup rules
- compare between drafts
- approval routing per draft

That is a later-phase product problem, not a phase-1 runtime problem.

### 3.4 Better alignment with this codebase

The current codebase does not yet have:

- a real draft system
- a real publish system
- a real rollback system
- a real asset pipeline

So starting with multiple drafts would be premature.

---

## 4. Frozen operational model

Per tenant:

- exactly one active `BrandProfile`
- exactly one editable `tenant_brand_draft`
- zero to many historical `BrandProfile` records for audit/rollback

That means:

- edit -> updates the single draft
- publish -> creates a new active profile from that draft
- rollback -> restores a historical profile as active
- preview -> uses the single draft only

---

## 5. What this does not prevent

This does not block future support for:

- approvals
- review comments
- compare views
- rollback history
- starter-kit experimentation

Those can all exist with one-draft mode.

---

## 6. Future upgrade path

If the product later needs multiple drafts, the upgrade path is:

1. change `tenant_brand_draft` from one-row-per-tenant to many-drafts-per-tenant
2. add draft name / owner / status
3. add explicit “set as working draft”
4. update preview/publish permissions

That is an additive later change.

---

## 7. Decision impact

The following docs were updated from open fork to frozen decision:

- `01-PRD-Brand-Studio.md`
- `06-Implementation-Backlog.md`
- `09-Brand-API-and-Persistence-Spec.md`

The phrase “if F3 resolves to single-draft mode” was removed from the package.
