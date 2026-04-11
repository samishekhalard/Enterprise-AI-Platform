# R02 Review Comments Register

**Track:** `R02. TENANT MANAGEMENT`  
**Status:** Active working register  
**Purpose:** Capture review comments, notes, and clarifications during ongoing review.  
**Rule:** This is a working review artifact. Nothing here becomes canonical until it is folded into the approved `R02` / `R04` requirement artifacts.

---

## Entry Rules

- `Comment` = review objection, defect, or criticism
- `Note` = observation, reminder, or nuance
- `Clarification` = statement that narrows meaning, scope, or intent

---

## Register

| ID | Type | Topic | Document / Section | Entry | Status | Canonical Follow-Up |
|----|------|-------|--------------------|-------|--------|---------------------|
| RC-001 | Comment | Tenant identity fields | `03-Data-Model-Tenant-Management.md` / `tenants` | User verdict: UUID is the approved identifier method. Do not keep both `id` and `uuid` patterns in the target model. | Resolved | Rewrite tenant identifiers as UUID-only in the canonical data model and ERD |
| RC-002 | Comment | Tenant naming | `03-Data-Model-Tenant-Management.md` / `tenants` | `slug` should be changed to `shortname` per prior agreement, but the model still uses `slug`. | Captured | Align tenant field naming across PRD, data model, ERD, and APIs |
| RC-003 | Comment | Non-required field | `03-Data-Model-Tenant-Management.md` / `tenants` | `tier` is not required and should not remain in the target tenant model without justification. | Captured | Revalidate `tier` against canonical R02 requirements and remove or justify |
| RC-004 | Comment | Non-required field | `03-Data-Model-Tenant-Management.md` / `tenants` | `version` is not required and should not remain in the target tenant model without justification. | Captured | Revalidate `version` in the canonical data model and remove or justify |
| RC-005 | Comment | Missing tenant flags | `03-Data-Model-Tenant-Management.md` / `tenants` | Required tenant flags and health-related fields were provided earlier but are missing from the current model. | Captured | Restore the missing tenant flags/health fields from prior agreed input into the canonical model |
| RC-006 | Clarification | Artifact scope confusion | `03-Data-Model-Tenant-Management.md` | It is unclear whether the current review is working on the PostgreSQL model or the graph/cypher model. The artifact boundary is not clear enough. | Captured | Clarify artifact scope and separate PG data model concerns from graph/cypher concerns |
| RC-007 | Clarification | Tenant domain meaning | `03-Data-Model-Tenant-Management.md` / `tenant_domains` | Tenant domain is just the URL/host attribute used for routing the user to the tenant. | Captured | Re-evaluate whether domain should stay a separate table or collapse into tenant attributes |
| RC-008 | Comment | Scope exclusion | `03-Data-Model-Tenant-Management.md` / `tenant_branding` | Tenant branding is out of scope for this artifact/review and should not be pulled into this data-model work. | Captured | Remove or explicitly exclude branding from the current review scope and dependent artifacts |
| RC-009 | Comment | Tenant session semantics | `03-Data-Model-Tenant-Management.md` / `tenant_session_config` | The meaning of `tenant_session_config` is unclear. Session behavior here is tenant-specific, not some generic system-level configuration, and the model expression is not making that clear. | Captured | Rephrase or redesign tenant session structures so their tenant-specific purpose is explicit |
| RC-010 | Comment | Product scope confusion | `03-Data-Model-Tenant-Management.md` | The artifact is mixing tenant registry management and tenant management without a clear boundary. | Captured | Separate tenant registry concerns from tenant-management concerns in the canonical data model |
| RC-011 | Clarification | Database scope confusion | `03-Data-Model-Tenant-Management.md` | It is unclear which database is being modeled at each point in the artifact. | Captured | Make database scope explicit section by section and avoid mixing stores in one narrative flow |
| RC-012 | Comment | Reviewability failure | `03-Data-Model-Tenant-Management.md` | The document is not reviewable in its current form. | Captured | Rewrite the artifact into a reviewable structure before further approval attempts |
| RC-013 | Clarification | Architecture baseline | `03-Data-Model-Tenant-Management.md` | The earlier architecture was already stated: PostgreSQL for Tenant Registry, Graph for System Graph, PostgreSQL and other database concerns separated. The current document is not respecting that baseline clearly enough. | Captured | Re-anchor the data model to the already stated architecture baseline and separate the stores explicitly |
| RC-014 | Verdict | Data model status | `03-Data-Model-Tenant-Management.md` | Verdict: rejected. | Captured | Rewrite the artifact before any further approval attempt |
| RC-015 | Clarification | Rewrite structure | `03-Data-Model-Tenant-Management.md` | The data model must be organized by database. | Captured | Restructure the artifact by database instead of by mixed concern flow |
| RC-016 | Clarification | Graph database topology baseline | `03-Data-Model-Tenant-Management.md` | Graph topology baseline: one system database plus per-tenant definition database and per-tenant instance database, alongside PostgreSQL databases. Do not restate a shared single Neo4j database model. | Captured | Remove shared-Neo4j claims and align the rewrite to the stated per-database topology |
| RC-017 | Clarification | Approved source status | `03-Data-Model-Tenant-Management.md` | `_parking` files are approved inputs and may be used as valid supporting source material. | Captured | Treat `_parking` as approved input in the rewrite, but keep canonical requirement artifacts primary where applicable |
| RC-018 | Comment | License model vs tier | `03-Data-Model-Tenant-Management.md` / `tenants` | `tier` must not reappear. The licensing model is based on four license types: tenant license, admin license, viewer license, and user license. This is not a tenant-tier field. | Captured | Remove `tier` from the target tenant model and express licensing through the actual license-type model |
| RC-019 | Clarification | Tenant-to-admin linkage | `R02` package scope / `03A-Data-Model-Tenant-Registry.md` boundary | Do not drop the tenant-to-admin linkage concern. Master tenant admin must be able to view the current tenant admin record and reset/replace the admin user. This edge case must be considered in the data model. `admin_email` alone is insufficient. | Captured | Treat this as an `R02` requirement that must be modeled or explicitly deferred. Do not force it into the registry table unless the registry chunk truly owns that link. |
| RC-020 | Clarification | Drafting rule for analyst input | `03A-Data-Model-Tenant-Registry.md` | Analyst-derived inputs and interpretations must be written as claims/proposals in the artifact, not as settled facts, until they are explicitly approved. | Captured | Mark analyst-derived exclusions, carry-forwards, and rationales as proposed claims or unresolved positions rather than authoritative facts |

---

## Status Values

- `Open`
- `Captured`
- `Addressed in draft`
- `Resolved`
- `Rejected`
- `Folded into canonical artifact`
