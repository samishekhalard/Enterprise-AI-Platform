# Fact Sheet Pattern

## 1. What Is a Fact Sheet `[TARGET]`

A Fact Sheet is the system's universal detail view for any graph entity. The pattern maps directly to a graph data model: one node and its outgoing relationships.

| Structural Element | Graph Concept | UI Mapping |
|--------------------|---------------|------------|
| **Banner** | Node properties | Identity, status, KPI chips |
| **Tab Bar** | Outgoing relationship types | One tab per relationship type |
| **Tab Content** | Related node collection | List/detail with CRUD for related entities |

A Fact Sheet is not a one-off component. It is the standard way every entity in the system is viewed and managed. Adding a new entity type means adding a new fact sheet instance -- not building a new screen. The shell, tab bar, banner layout, empty states, error handling, and permission resolution are shared. Only the banner fields and tab content renderers vary per entity type.

The pattern enforces consistency across the entire application: every entity detail view has the same interaction model, the same loading states, the same permission behavior, and the same navigation mechanics.

---

## 2. As-Is Implementations `[AS-IS]`

Two independent fact sheet implementations exist today. They share no component, no base class, and no structural contract.

### Tenant Fact Sheet `[AS-IS]`

- **File:** `frontend/src/app/features/administration/sections/tenant-manager/tenant-manager-section.component.ts:76`
- **Type definition:** `type FactSheetTab = 'overview' | 'license' | 'auth' | 'users' | 'branding'`
- **Tab count:** 5 hardcoded tabs
- **Container:** Modal dialog
- **State management:** Signal-based (`factSheetTab` signal, line 356)
- **Tab switching:** `onFactSheetTabChange` method (line 587)

### Object Type Fact Sheet `[AS-IS]`

- **File:** `frontend/src/app/features/administration/sections/master-definitions/master-definitions-section.component.ts:112`
- **State definition:** `readonly factSheetTab = signal<string>('attributes')`
- **Tabs:** 3 tabs implemented in template (Attributes, Connections, Instances) at `master-definitions-section.component.html:432-443`
- **Container:** Inline detail panel (slide-in)
- **State management:** Signal-based (`factSheetTab` signal)
- **Tab styling:** Custom PrimeNG `pt` passthrough object (`factSheetTabsPt`, line 381)

### Structural Comparison `[AS-IS]`

| Dimension | Tenant Fact Sheet | Object Type Fact Sheet |
|-----------|-------------------|----------------------|
| Tab type | TypeScript union type | Untyped string |
| Tab count | 5 | 3 |
| Container | Modal dialog | Inline panel |
| Banner | Custom layout per entity | Custom layout per entity |
| Empty states | Per-tab custom | Per-tab custom |
| Error handling | Per-tab custom | Per-tab custom |
| Permissions | Inline conditional checks | Inline conditional checks |
| Shared code | None | None |

**No shared `FactSheetShellComponent` exists.** Each implementation duplicates the structural pattern independently.

---

## 3. Target Pattern Structure `[TARGET]`

The abstract structure below applies to every fact sheet in the system.

### Banner (Node Properties)

| Element | Description | Example (Tenant) |
|---------|-------------|-------------------|
| Entity identity | Name, slug, icon or logo | "Acme Corp", `acme`, company logo |
| Entity type badge | Type label with icon | "Tenant" badge |
| Status indicator | Lifecycle state chip | Active / Suspended / Provisioning |
| KPI chips | Counts of key related entities | "12 Users", "3 Integrations" |
| Primary actions | Edit, lifecycle transitions, delete | Edit Tenant, Suspend Tenant |

### Tab Bar (Relationships)

Each tab represents one outgoing relationship type from the entity node.

| Property | Description |
|----------|-------------|
| Label | Relationship display name |
| Badge | Count of related entities (live-updating) |
| Icon | Relationship-type icon |
| Visibility | Resolved from `f(role, tenantType, entityOwnership)` |
| Order | Defined by fact sheet configuration, not alphabetical |

### Tab Content (Related Entities)

Every tab has exactly four possible states:

| State | Condition | UI |
|-------|-----------|-----|
| **Empty** | Zero related entities | Illustration, description, creation prompt button |
| **List** | One or more related entities | Table or grid with search, filter, sort, pagination |
| **Detail** | User selects a related entity | Inline detail view or navigation to nested fact sheet |
| **Error** | Load failure | Error message with retry action |

State transitions are deterministic: the tab always starts in List or Empty (depending on count), Detail is entered by row selection, Error is entered on API failure from any state.

---

## 4. Fact Sheet Registry `[TARGET]`

Nine planned fact sheets. Tenant is the pilot implementation for the shared shell.

| # | Entity Node | Planned Tabs | Current Status |
|---|-------------|-------------|----------------|
| 1 | **Tenant** | Users, Branding, Integrations, Dictionary, Agents, Studio, Audit Log, Health Checks | `[AS-IS]` 5-tab hardcoded. `[TARGET]` 8-tab on shared shell. |
| 2 | **Object Type** | Attributes, Connections, Instances, Governance, Maturity, Localization, Measures | `[AS-IS]` 3-tab hardcoded. `[TARGET]` 7-tab on shared shell. |
| 3 | **Agent** | Skills, Tools, Templates, Triggers, Conversations, Knowledge Sources | `[TARGET]` |
| 4 | **User** | Profile, Roles, Groups, Licenses, Sessions, Audit Log | `[TARGET]` |
| 5 | **Skill** | Parameters, Agents (used by), Execution History | `[TARGET]` |
| 6 | **Tool** | Configuration, Agents (used by), Execution History | `[TARGET]` |
| 7 | **Template** | Variables, Agents (used by), Versions | `[TARGET]` |
| 8 | **Trigger** | Configuration, Agents (bound to), Execution History | `[TARGET]` |
| 9 | **License** | Tiers, Assignments, Usage Metrics | `[TARGET]` |

Tenant (row 1) is the pilot. The shared shell component will be extracted from the Tenant Fact Sheet implementation and validated against the Object Type Fact Sheet before other entity types are onboarded.

---

## 5. Separate Architecture Track `[TARGET -- PENDING SANCTION]`

System Cypher -- the graph-driven tab discovery mechanism where relationship metadata in the graph database drives tab rendering -- is a **target-state architectural direction**. It is NOT a sanctioned R02 Phase 1 contract.

The physical System Cypher design must be designed and approved in a **separate track and separate worktree** before R02 Phase 2+ depends on it. That track must resolve:

| Decision | Description |
|----------|-------------|
| Graph topology | Resolve the 3-model fork (property graph, labeled property graph, hypergraph) |
| Registry / metamodel | Where entity-type metadata lives and how it is queried |
| Relationship naming | Naming conventions for relationship types across the graph |
| Tab discovery metadata | Where tab ordering, grouping, and visibility rules are stored |
| Renderer registration | How a graph relationship type maps to a frontend component |
| Fallback behavior | What the shell does when it discovers a relationship with no registered renderer |
| Seed migration | How initial graph topology is provisioned and versioned |
| Schema governance | Approval process for topology changes |

### R02 Phase 1 Boundaries

**What R02 Phase 1 may do:**

- Describe the fact sheet pattern abstractly (this document)
- Reference System Cypher as target direction
- Define tab structure, content types, permission rules
- Build a shared shell component with static tab configuration

**What R02 Phase 1 must NOT do:**

- Finalize System Cypher as source-of-truth architecture
- Claim "the graph IS the schema" as sanctioned design
- Claim "adding a relationship = adding a tab" as implementation-ready
- Pre-select any Neo4j topology model
- Build dynamic tab discovery from graph queries

---

## 6. Permission Model `[TARGET]`

Tab visibility is a pure function of three inputs:

```
visible(tab) = f(role, tenantType, entityOwnership)
```

### Input Dimensions

| Input | Values | Effect |
|-------|--------|--------|
| `role` | ADMIN, MANAGER, USER, VIEWER | Determines which tabs are accessible |
| `tenantType` | MASTER, REGULAR, DOMINANT | Determines which tabs appear (MASTER sees cross-tenant tabs) |
| `entityOwnership` | own-tenant, other-tenant | Determines read vs write access within a tab |

### Visibility Matrix: Tenant Fact Sheet `[TARGET]`

| Tab | ADMIN (MASTER) | ADMIN (REGULAR) | MANAGER | USER | VIEWER |
|-----|---------------|----------------|---------|------|--------|
| Users | Read/Write | Read/Write (own) | Read | -- | -- |
| Branding | Read/Write | Read/Write (own) | Read | -- | -- |
| Integrations | Read/Write | Read/Write (own) | Read | -- | -- |
| Dictionary | Read/Write | Read/Write (own) | Read | Read | -- |
| Agents | Read/Write | Read/Write (own) | Read | Read | Read |
| Studio | Read/Write | Read/Write (own) | Read | Read | Read |
| Audit Log | Read | Read (own) | -- | -- | -- |
| Health Checks | Read | Read (own) | -- | -- | -- |

"--" means the tab is not rendered. The tab element is absent from the DOM, not hidden or disabled.

### Resolution Order

1. **tenantType** filter: remove tabs not applicable to this tenant type
2. **role** filter: remove tabs the role cannot access
3. **entityOwnership** filter: downgrade write to read for other-tenant entities
4. Result: ordered list of `{ tab, accessLevel }` tuples passed to the shell

---

## 7. Nested Fact Sheets `[TARGET]`

Navigation between related fact sheets follows a breadcrumb pattern. Selecting a related entity in a tab opens that entity's own fact sheet.

### Navigation Flow

```
Tenant List --> Tenant Fact Sheet --> Users Tab --> User Fact Sheet --> Roles Tab --> ...
```

### Rules

| Rule | Description |
|------|-------------|
| **Entity click** | Clicking a related entity in a tab opens that entity's own fact sheet |
| **Breadcrumb trail** | Shows full navigation path; each segment is clickable |
| **Back navigation** | Returns to previous fact sheet at the same tab and scroll position |
| **Deep-link URLs** | Encode full navigation context: `/admin/tenants/{slug}/users/{userId}/roles` |
| **Maximum depth** | 3 levels (configurable per deployment) |
| **Cross-entity type** | Navigation can cross entity types (Tenant --> User --> License) |

### Breadcrumb Structure

```
[Tenants] / [Acme Corp] / [Users] / [Jane Doe] / [Roles]
 ^list       ^fact-sheet   ^tab      ^nested-fs    ^nested-tab
```

Each breadcrumb segment encodes both the entity reference and the active tab, so back-navigation restores full context without re-fetching the parent entity list.

### Container Behavior

When a nested fact sheet opens, the parent fact sheet is preserved in memory (not destroyed). This enables instant back-navigation without reload. At maximum nesting depth, clicking a related entity opens it in the current level (replaces the deepest fact sheet) rather than adding a new level.
