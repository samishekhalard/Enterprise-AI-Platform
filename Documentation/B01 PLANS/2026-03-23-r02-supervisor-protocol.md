# R02 Tenant Management Supervisor Protocol

**Date:** 2026-03-23
**Scope:** `.worktrees/tenant-factsheet-spec`
**Purpose:** Govern worker execution for the R02 Tenant Management requirements package without micromanagement while preventing architectural drift, stale-document drift, and unsupported claims.

## 1. Supervisor Verdict

**Verdict:** Conditionally approved.

The worker may execute the full R02 documentation and prototype plan in the `tenant-factsheet-spec` worktree, but the plan is not valid as written yet. The following corrections are mandatory and must be folded into the execution baseline before files are marked complete:

1. Add an explicit stale-document cleanup stream.
2. Separate current-state evidence from target-state contract.
3. Resolve the Neo4j architecture fork instead of writing around it.
4. Treat dynamic fact-sheet discovery as target-state unless backed by implemented metadata and queries.
5. Use the new `ADMIN + tenant type` model in R02 while preserving legacy-role evidence as as-is context, not silently rewriting history.
6. Move System Cypher architecture design into a separate sanctioned track and worktree before later phases depend on it.
7. Treat stale-document cleanup as a cross-worktree governance concern: update the active R02 worktree now, record impact on other worktrees for downstream sync, and do not silently edit parallel streams.

## 2. Why The Plan Is Not Yet Clean

The current repository contains material contradictions that the worker plan did not make explicit:

- Current tenant and object-type fact sheets are separate hardcoded implementations, not a shared shell.
- Current backend tenant access still contains a `SUPER_ADMIN` bypass.
- Current documentation still describes the old tenant fact sheet (`Overview`, `Users`, `Branding`, `Licenses`) and old role labels.
- Current architectural sources disagree on Neo4j topology:
  - canonical data model still says single `neo4j` database
  - graph-per-tenant requirements and LLD describe `tenant_{slug}`
  - current tenant routing code already carries split `auth_db_name` and `definitions_db_name`
  - proposed R02 plan moves to one per-tenant graph holding auth + definitions + instances

If R02 is written without naming those contradictions, the output will look complete but will be structurally untrustworthy.

## 3. Mandatory Plan Amendments

### A. Add a stale cleanup deliverable

The worker plan must add one more Phase 1 artifact:

- `R02-STALE-DOC-IMPACT-MAP.md`

Minimum contents:

- source file
- stale statement
- why stale
- action: `update`, `supersede`, `reference-only`, or `leave as historical as-is`
- owner stream: `R02`, `R09`, or `cross-cutting`
- blocking status: `must-fix-now` or `follow-up`

Seed list for that file:

- `Documentation/.Requirements/PROTOTYPE-SCREEN-MAP.md`
- `Documentation/.Requirements/PERSONA-INTERACTION-SPECIFICATION.md`
- `Documentation/sdlc-evidence/ba-analysis-manage-tenants.md`
- `Documentation/data-models/neo4j-ems-db.md`
- `Documentation/requirements/GRAPH-PER-TENANT-REQUIREMENTS.md`
- `Documentation/lld/graph-per-tenant-lld.md`
- `Documentation/.Requirements/R09 Roles Management/01-As-Is-Roles-Management-Baseline.md`
- tenant E2E and frontend references that still assume old tenant fact-sheet tabs
- equivalent stale copies in other active worktrees, logged as downstream impact targets

### B. Add an as-is vs target-state boundary

R02 must not present target-state architecture as implemented fact.

The PRD must contain a short section or appendix that distinguishes:

- **As-is evidence**
- **Target contract**
- **Known transition gaps**

At minimum this must call out:

- hardcoded fact-sheet tabs in frontend
- lack of shared fact-sheet shell
- current `SUPER_ADMIN` bypass in backend
- current split Neo4j routing metadata (`auth_db_name`, `definitions_db_name`)

### C. Resolve the Neo4j architecture fork

Before the worker finalizes the PRD, it must explicitly choose one of these positions:

1. `R02 documents the target-state unified per-tenant Neo4j model`
2. `R02 aligns to the currently emerging split auth/definitions Neo4j model`
3. `R02 stays topology-agnostic and defines only the fact-sheet contract, not the physical graph layout`

This choice must be stated plainly in the PRD and in the stale-doc impact map.

### D. Narrow the dynamic-discovery claim

`Adding a relationship = adding a tab with no code deployment` is acceptable only as a target contract unless the worker also specifies:

- where tab metadata lives
- how order is determined
- how visibility rules are resolved
- how a new relationship maps to a frontend content component
- what the shell does when it discovers a relationship with no registered renderer

Without that, the worker is allowed to define the pattern, but not to claim it is implementation-ready.

### E. Keep role correction and evidence cleanup separate

R02 must use:

- `ADMIN` in `MASTER`
- `ADMIN` in `REGULAR` or `DOMINANT`
- `MANAGER`
- `USER`
- `VIEWER`

But it must also record that current runtime and legacy documents still reference `SUPER_ADMIN` and `TENANT_ADMIN`. Those references are not “fixed by omission”; they must be logged in the stale-doc impact map or explicitly assigned to the R09 cleanup stream.

### F. Split System Cypher into its own approval track

System Cypher is important enough to require its own track, its own worktree, and its own approval gate.

Rules:

- R02 Phase 1 may reference the intended fact-sheet contract and target graph model.
- R02 Phase 1 must not silently finalize the physical System Cypher architecture as if it were already sanctioned.
- A separate track must define and validate:
  - graph topology
  - registry/meta model
  - relationship naming rules
  - tab discovery metadata
  - renderer registration contract
  - seed migration rules
  - approval and governance process for schema changes

Expected operating model:

- separate worktree for System Cypher design
- separate plan and review cycle
- explicit sanction, validation, and approval before R02 Phase 2 technical specs or implementation depend on it

Until that approval exists, R02 may describe the target direction, but must frame it as pending architectural sanction.

### G. Handle stale documentation across worktrees explicitly

Documentation drift does not stop at one folder. The worker must treat stale updates in three scopes:

1. **Current worktree, in scope now**
   - `Documentation/.Requirements/**`
   - R02 artifacts created under the active `tenant-factsheet-spec` worktree
   - any directly cited source documents needed to make the R02 package internally coherent

2. **Same repository, outside the active R02 path**
   - stale references in `Documentation/requirements`, `Documentation/lld`, `Documentation/data-models`, `Documentation/sdlc-evidence`, `Documentation/Architecture`, and related folders
   - these must be logged in `R02-STALE-DOC-IMPACT-MAP.md`
   - they are updated now only if leaving them untouched would make the active R02 package internally contradictory

3. **Other worktrees**
   - other worktrees are parallel streams, not passive mirrors
   - stale-document impact in those worktrees must be recorded as downstream sync work, not silently edited during R02 unless the user explicitly expands scope

Required behavior:

- The impact map must distinguish:
  - `updated in current worktree`
  - `superseded in current worktree`
  - `downstream sync required in other worktrees`
- Worker claims must say whether a stale fix was:
  - applied now
  - deferred to R09
  - deferred to another worktree sync pass
- No worker may claim “documentation cleanup complete” while cross-worktree impacts remain only implied.

## 4. Worker Authorization

**Authorization level:** Full execution authorized inside the `tenant-factsheet-spec` worktree.

The worker does **not** need per-file approval for:

- drafting the six core R02 artifacts
- creating the stale-doc impact map
- updating plan status files inside the worktree
- building prototypes and journey maps
- adding traceability matrices and message catalogs

The worker **must stop and escalate** only when:

- a decision is required on the Neo4j topology fork
- a System Cypher contract is being promoted from target concept to sanctioned architecture
- R02 would force changes outside documented scope into code or architecture baselines
- prototype approval is needed from the user before locking the PRD

## 5. Claim Format Required From Worker

Every worker claim must include all of the following:

1. **Delta**
   - what changed
   - which files changed

2. **Evidence**
   - repo sources used
   - exact contradictions resolved or preserved
   - whether affected files were in the current worktree or only logged as downstream impact elsewhere

3. **Verification**
   - grep or traceability checks run
   - prototype preview status
   - cross-link status

4. **Risks**
   - unresolved architectural risk
   - stale-doc residual risk
   - role-model residual risk

5. **Verdict request**
   - `ready for supervisor validation`
   - `needs topology decision`
   - `needs user approval`

Claims that omit evidence or verification are not accepted as complete.

## 6. Completion Gates

The supervisor should only accept a file as complete when all gates pass:

### Requirements files

- file exists in the expected R02 path
- cross-references are coherent
- role model uses `ADMIN + tenant type`, not `SUPER_ADMIN`
- every future-state statement is clearly framed
- stale contradictions are either updated or logged
- cross-worktree stale impacts are explicitly logged, not ignored

### Prototype files

- screens reflect the frozen 8-tab tenant design
- no SaaS language
- role toggle demonstrates `ADMIN (master)` vs `ADMIN (regular)`
- nested user fact sheet works as a pattern example
- viewport variants exist for desktop, tablet, mobile

### Registry and inventory files

- message codes use one consistent `TEN-*` pattern
- stories use one consistent `US-TM-*` pattern
- every story maps to screens, interactions, APIs, errors, and messages

## 7. Supervisor Verdict Scale

The supervisor will use only these verdicts:

- `Approved` — claim validated, no blocking risk
- `Approved with reservations` — usable, but residual risk recorded
- `Rework required` — material contradiction or missing evidence
- `Blocked` — cannot proceed without explicit decision

## 8. Risk Register To Monitor During Execution

- **Documentation drift risk:** old R02, persona, and prototype docs remain discoverable and contradict the new package.
- **Architecture fork risk:** unified per-tenant graph vs split auth/definitions routing vs canonical single-database schema.
- **System Cypher sanction risk:** R02 may over-depend on an unsanctioned graph contract unless the separate track is approved first.
- **Role migration risk:** R02 target state is correct, but current runtime still enforces legacy roles.
- **Overclaim risk:** graph-driven dynamic tabs may be described more strongly than current implementation supports.
- **Approval bypass risk:** PRD gets treated as final before prototype review.
- **Cross-worktree drift risk:** other active worktrees may continue carrying stale copies unless downstream sync is explicitly tracked.

## 9. North Star

All planning and supervision should optimize toward one operational objective:

- Tenant Management works on `localhost:24200`
- complete against the approved requirement set
- no missing requirement classes
- no known defects accepted forward

Documentation work is successful only if it improves the probability of that outcome. The protocol should not create churn that delays or obscures the path to a complete, working Tenant Management capability.

## 10. Benchmark From Canvas Worktree

The canvas plan is the right operating model in three ways:

- work is chunked into explicit deliverables
- verification is part of every unit of work
- commit boundaries are narrow and observable

For R02 documentation work, the equivalent pattern is:

- one artifact at a time
- one validation pass at a time
- one supervisor verdict at a time
- no broad “everything is done” claim without file-level evidence

## 11. Immediate Next Step

The worker may proceed, but the first output must be:

1. revised execution plan with the amendments above folded in
2. stale-doc impact map started immediately
3. explicit statement of how R02 will handle the Neo4j topology fork
4. explicit split of `System Cypher` into a separate sanctioned track / worktree with an approval gate before later phases depend on it

Only after that should the worker begin drafting `00-FACT-SHEET-PATTERN.md` and the PRD.
