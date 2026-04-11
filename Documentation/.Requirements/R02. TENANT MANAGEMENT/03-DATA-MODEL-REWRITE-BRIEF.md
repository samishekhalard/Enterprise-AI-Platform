# R02 Data Model Rewrite Brief

**Artifact under review:** `Design/03-Data-Model-Tenant-Management.md`  
**Status:** Rejected  
**Basis:** `REVIEW-COMMENTS-REGISTER.md` entries `RC-001` through `RC-020`

---

## 1. Verdict

The current `03-Data-Model-Tenant-Management.md` is rejected.

The next revision must be a structural rewrite, not an incremental patch.

The rewrite rule is:

- organize the data model by database

---

## 2. Rewrite Objective

Rewrite the data model so it is reviewable against the already stated architecture baseline:

- PostgreSQL for **Tenant Registry**
- Graph for **System Graph**
- other database concerns kept explicitly separated

The artifact must stop mixing:

- tenant registry management
- tenant management
- graph/cypher concerns
- cross-store runtime logic

---

## 3. Binding Review Corrections

### 3.1 Tenant Record

The `tenants` model must be reworked.

Required corrections:

- use UUID as the approved identifier method
- change `slug` to `shortname`
- remove `tier`
- remove or justify `version`
- restore the previously provided tenant flags / health-related fields
- do not reduce tenant-admin linkage to provisioning email only; the `R02` model must account for viewing/resetting the current tenant admin record, but this may be deferred from the registry chunk if it belongs to a later management/auth chunk

### 3.2 Tenant Domain

The current `tenant_domains` treatment is not justified by a settled requirement.

Binding clarification:

- tenant domain is the URL/host attribute used for routing the user to the tenant

Required action:

- decide whether domain is:
  - a single tenant attribute
  - or a managed multi-row child structure
- do not keep `tenant_domains` as a target design assumption unless the requirement package explicitly supports it

### 3.3 Branding

Tenant branding is out of scope for this artifact/review and must not drive this data-model work.

Required action:

- remove branding from the active review scope of this data-model rewrite
- if branding remains mentioned, mark it explicitly as excluded from this review

### 3.4 Tenant Session Semantics

`tenant_session_config` is not expressed clearly enough.

Required action:

- rewrite it so its tenant-specific purpose is explicit
- avoid vague “system config” style expression

---

## 4. Artifact Boundary Rules

The rewrite must make the artifact boundary explicit.

It must clearly distinguish:

1. PostgreSQL tenant-registry concerns
2. PostgreSQL tenant-scoped management concerns
3. system graph database concerns
4. per-tenant definition database concerns
5. per-tenant instance database concerns

The reader must never have to guess which database is being modeled.

---

## 5. What This Artifact Must Stop Doing

The next revision must stop:

- mixing PostgreSQL and graph/cypher narrative in the same flow
- mixing tenant registry management with broader tenant-management concerns without boundary
- using the current data model as a place to resolve graph-expression ambiguity
- restating a shared single Neo4j model
- carrying out-of-scope branding detail as if it belongs to this review
- reintroducing `tier` as if it were a tenant-registry attribute

---

## 6. Proposed Rewrite Shape

Use a database-by-database structure:

1. Purpose and review scope
2. Architecture baseline for this artifact
3. PostgreSQL database A: Tenant Registry target model
4. PostgreSQL database B: tenant-scoped management structures in scope
5. System graph database: referenced boundary only
6. Tenant definition database: referenced boundary only
7. Tenant instance database: referenced boundary only
8. Explicit exclusions from this artifact
9. Explicit unresolved items

If graph/system-graph content must be referenced:

- keep it to a short boundary statement only
- point to the correct graph artifact
- do not model graph/cypher detail here

Approved source rule:

- `_parking` files are approved supporting inputs
- license modeling must follow the actual license types:
  - tenant license
  - admin license
  - viewer license
  - user license
- do not translate that model into a tenant `tier` field

Drafting rule:

- analyst-derived carry-forwards, exclusions, interpretations, and architectural readings must be written as draft claims/proposals or unresolved positions until explicitly approved
- only user decisions, canonically sourced requirements, and sealed architecture inputs may be written as settled facts

---

## 7. Immediate Rewrite Priorities

1. Rebuild the `tenants` entity/table section
2. Resolve the domain treatment
3. remove branding from the active scope of this review
4. make database scope explicit section by section
5. separate tenant registry from broader tenant-management concerns
6. reorganize the artifact by database
7. explicitly address tenant-to-current-admin linkage/reset capability, either in this chunk or as an explicit deferred requirement

---

## 8. Source Register

This brief is derived from:

- [REVIEW-COMMENTS-REGISTER.md](./REVIEW-COMMENTS-REGISTER.md)

Primary captured items:

- `RC-001` through `RC-020`
