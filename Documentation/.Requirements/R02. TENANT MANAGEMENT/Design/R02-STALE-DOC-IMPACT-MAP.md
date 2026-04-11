# R02 Stale Document Impact Map

**Date:** 2026-03-23
**Scope:** Documents impacted by R02 Tenant Management requirements package
**Governance:** Per `2026-03-23-r02-supervisor-protocol.md` §3.A

---

## 1. Stale Documents

| # | Source File | Line | Stale Content | Why Stale | Action | Owner | Blocking? | Disposition |
|---|-----------|------|--------------|-----------|--------|-------|-----------|-------------|
| 1 | `Documentation/.Requirements/PROTOTYPE-SCREEN-MAP.md` | 21 | Tenant Factsheet tabs: Overview, Users, Branding, Licenses (4 tabs) | R02 frozen design: banner hero + 8 tabs (Users, Branding, Integrations, Dictionary, Agents, Studio, Audit Log, Health Checks) | supersede | R02 | No | `downstream-sync` |
| 2 | `Documentation/.Requirements/PERSONA-INTERACTION-SPECIFICATION.md` | 33 | Role labels: `platform-admin`, `tenant-admin`, `super-admin` | R02 role model: ADMIN + tenant type context. No SUPER_ADMIN role. | update | R09 | No | `deferred-R09` |
| 3 | `Documentation/sdlc-evidence/ba-analysis-manage-tenants.md` | 50 | US-TM-03 "Tenant Administrator" vs US-TM-06 "Super Administrator" — split by SUPER_ADMIN vs TENANT_ADMIN | R02 unifies: single ADMIN role scoped by tenant type. US-TM-03/06 merged into one journey with visibility rules. | supersede | R02 | No | `downstream-sync` |
| 4 | `Documentation/data-models/neo4j-ems-db.md` | 6 | `"Database: neo4j (single EMS application database)"` — canonical single-DB model | Contradicts graph-per-tenant BRD and per-service routing code. See §3 Neo4j Topology Fork. | `[FORK]` | cross-cutting | **Yes** | `downstream-sync` |
| 5 | `Documentation/requirements/GRAPH-PER-TENANT-REQUIREMENTS.md` | 45 | `"dedicated Neo4j database instance for each tenant, named tenant_{slug}"` — graph-per-tenant model | Contradicts canonical single-DB doc and per-service routing implementation. See §3. | `[FORK]` | cross-cutting | **Yes** | `downstream-sync` |
| 6 | `backend/tenant-service/src/main/resources/db/migration/V8__per_service_routing_metadata.sql` | 48 | Adds `auth_db_name` and `definitions_db_name` columns — per-service routing model | Contradicts both canonical single-DB and unified per-tenant models. See §3. | `[FORK]` | cross-cutting | **Yes** | `downstream-sync` |
| 7 | `Documentation/.Requirements/R09 Roles Management/01-As-Is-Roles-Management-Baseline.md` | — | 5-role hierarchy: VIEWER, USER, MANAGER, ADMIN, SUPER_ADMIN | R02 target: 4-role hierarchy (no SUPER_ADMIN). SUPER_ADMIN capabilities mapped to ADMIN in MASTER tenant. | reference-only | R09 | No | `deferred-R09` |
| 8 | `frontend/src/app/features/administration/sections/tenant-manager/tenant-manager-section.component.ts` | 76 | `type FactSheetTab = 'overview' \| 'license' \| 'auth' \| 'users' \| 'branding'` (5 hardcoded tabs) | R02 frozen design: 8 tabs. Current implementation is `[AS-IS]`, R02 Phase 2 replaces. | R02 Phase 2 | R02 | No | `downstream-sync` |
| 9 | `frontend/src/app/features/administration/sections/master-definitions/master-definitions-section.component.ts` | 111 | Hardcoded `factSheetTab` string state — independent fact sheet implementation | Not R02 scope. R04 owns Object Type fact sheet. Documented as `[AS-IS]` evidence of no shared component. | leave | R04 | No | `deferred-R04` |
| 10 | `Documentation/.Requirements/PROTOTYPE-SCREEN-MAP.md` | 100-106 | Role-to-dock mapping uses `Platform Admin`, `Tenant Admin`, `Agent Designer` labels | R02 target role model uses ADMIN + tenant type. Labels are persona names, not runtime roles. | update | R09 | No | `deferred-R09` |
| 11 | `frontend/e2e/tenant-theme-builder.spec.ts` | — | E2E tests may reference old fact-sheet tab structure | If E2E tests assert on 5-tab structure, they will fail after R02 Phase 2. Must be updated with implementation. | R02 Phase 2 | R02 | No | `downstream-sync` |

---

## 2. SUPER_ADMIN / TENANT_ADMIN References

**Summary:** ~1,500 occurrences of `SUPER_ADMIN` across ~160 files. Additionally, `TENANT_ADMIN` appears in licensing tier enums and role discussions.

**R02 position:** All R02 deliverables use ADMIN + tenant type context. No SUPER_ADMIN or TENANT_ADMIN as runtime role names. The role differentiation comes from tenant type (MASTER vs REGULAR vs DOMINANT), not from separate role labels.

**Cleanup owner:** R09 Roles Management. See `Documentation/.Requirements/R09 Roles Management/README.md`.

**Key evidence files (not exhaustive — full audit is R09 scope):**

| File | Context |
|------|---------|
| `backend/auth-facade/src/main/java/com/ems/auth/security/TenantAccessValidator.java:56` | Cross-tenant bypass: `if (roles.contains("SUPER_ADMIN"))` skips tenant isolation check |
| `backend/auth-facade/src/main/java/com/ems/auth/security/ProviderAgnosticRoleConverter.java` | Generic JWT claim extraction — converts provider roles to internal roles. SUPER_ADMIN flows through as a valid role name from Keycloak realm roles. |
| `infrastructure/keycloak/keycloak-init.sh` | Realm role bootstrap seeds SUPER_ADMIN |
| `backend/auth-facade/src/main/resources/neo4j/migrations/V004__create_default_roles.cypher` | Neo4j role graph seeds SUPER_ADMIN |

**Disposition:** `deferred-R09` — R02 does NOT perform repo-wide role cleanup.

---

## 3. Neo4j Topology Fork

Three competing models existed in the repository. **Decision locked 2026-03-23:** Model B adopted (graph-per-tenant, object data only). Auth migrates from Neo4j to PostgreSQL. Model C retired.

### Model A: Single Shared Database `[AS-IS]`

| Attribute | Value |
|-----------|-------|
| **Source** | `Documentation/data-models/neo4j-ems-db.md:6` |
| **Status** | Phase 1 ACTIVE (per ADR in `Documentation/Architecture/09-architecture-decisions.md:24-31`) |
| **Topology** | One `neo4j` database. All tenants share the database. Isolation via `tenantId` property on every node. |
| **Evidence** | `"Database: neo4j (single EMS application database)"`. Flowchart at line 21 shows single box. |

### Model B: Graph-per-Tenant `[TARGET — Draft BRD]`

| Attribute | Value |
|-----------|-------|
| **Source** | `Documentation/requirements/GRAPH-PER-TENANT-REQUIREMENTS.md:45-95` |
| **Status** | Draft Business Requirements Document. Not implemented. |
| **Topology** | Master graph (`system` database) + one `tenant_{slug}` database per tenant. All tenant data in one graph per tenant. |
| **Evidence** | `"A dedicated Neo4j database instance for each tenant, named tenant_{slug}"`. Master vs tenant split at lines 65-95. |

### Model C: Per-Service Routing `[AS-IS — Built, Feature-Flagged OFF]`

| Attribute | Value |
|-----------|-------|
| **Source** | `V8 migration:48-49`, `TenantAwareAuthDatabaseSelectionProvider.java:21-27`, `application.yml:61-65` |
| **Status** | Infrastructure built. Feature flag `auth.graph-per-tenant.enabled` = `false` by default. |
| **Topology** | Multiple databases per tenant, split by service: `tenant_{slug}_auth` (auth-facade), `tenant_{slug}_definitions` (definition-service). |
| **Evidence** | Migration adds `auth_db_name VARCHAR(255)` and `definitions_db_name VARCHAR(255)` to tenants table. Test uses `"tenant_acme_auth"` and `"tenant_acme_definitions"`. |

### The Contradiction

- Model B assumes ONE database per tenant (all data consolidated).
- Model C implements TWO databases per tenant (split by service).
- Model A is what actually runs today.

**R02 PRD Section 13 locked to Model B (2026-03-23).** Model A remains `[AS-IS]` legacy. Model C retired. Auth migrates from Neo4j to PostgreSQL.

**Additional stale artifacts from this decision:**
- `V004__create_default_roles.cypher` — Neo4j auth role seeding is legacy (auth→PostgreSQL)
- `TenantAwareAuthDatabaseSelectionProvider.java` — Neo4j auth DB routing is legacy (Model C retired)
- `TenantAccessValidator.java:56` — SUPER_ADMIN bypass in Neo4j auth context (auth→PostgreSQL, role→R09)

**Disposition:** `downstream-sync` — resolution impacts `neo4j-ems-db.md`, `GRAPH-PER-TENANT-REQUIREMENTS.md`, `V8 migration` code, and Neo4j auth graph artifacts.

---

## 4. Hardcoded Fact Sheet Tabs

| File | Current Tabs | R02 Target | Disposition |
|------|-------------|------------|-------------|
| `tenant-manager-section.component.ts:76` | `'overview' \| 'license' \| 'auth' \| 'users' \| 'branding'` (5 tabs, hardcoded TypeScript union) | Banner hero + 8 tabs (Users, Branding, Integrations, Dictionary, Agents, Studio, Audit Log, Health Checks) | `downstream-sync` — R02 Phase 2 replaces |
| `master-definitions-section.component.ts:111` | `factSheetTab` string (7 tabs: General, Attributes, Connections, Governance, Maturity, Localization, Measures) | Not R02 scope — R04 owns | `deferred-R04` |

Both implementations are independent with no shared component. `[AS-IS]`: no `FactSheetShellComponent` exists. `[TARGET]`: reusable shell is a Phase 2 deliverable pending System Cypher architecture sanction.

---

## 5. Prototype / Persona / BA Drift

| File | Stale Content | R02 Impact | Disposition |
|------|--------------|-----------|-------------|
| `PROTOTYPE-SCREEN-MAP.md:21-22` | `tenant-factsheet` with tabs: Overview, Users, Branding, Licenses | R02 frozen design differs (8 tabs, no Overview/Licenses tabs — merged into banner) | `downstream-sync` |
| `PERSONA-INTERACTION-SPECIFICATION.md:33, 62-97` | Persona matrix uses `platform-admin`, `super-admin`, `tenant-admin` labels | R02 uses ADMIN + tenant type. Persona labels are display names, not runtime roles. | `deferred-R09` |
| `ba-analysis-manage-tenants.md:48-69` | US-TM-03 (Tenant Admin full view) vs US-TM-06 (Super Admin restricted view) — split by role | R02 merges into single fact sheet with visibility rules per tenant type, not per role name | `downstream-sync` |

---

## 6. Completion Rule

Per supervisor protocol and cross-worktree governance:

No claim of "documentation cleanup complete" is accepted unless this map explicitly states for every item:
- **Updated now** in current worktree
- **Deferred to R09** (role cleanup stream)
- **Deferred to R04** (definitions stream)
- **Downstream sync required** (same repo, outside R02 path)
- **Cross-worktree sync required** (other worktrees)

Current status: **0 items updated-now** (this is the first artifact). All items logged with disposition. No cross-worktree edits made.
