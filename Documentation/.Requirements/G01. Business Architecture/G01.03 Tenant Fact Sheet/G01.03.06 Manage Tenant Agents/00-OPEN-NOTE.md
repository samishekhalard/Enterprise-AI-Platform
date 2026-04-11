# Manage Tenant Agents - Open Note

**Status**

- Open
- Incomplete by design
- Keep this topic pending until the later exercise is performed

**Why This Folder Is Still Incomplete**

- The `G01.03.06 Manage Tenant Agents` business baseline has not been authored yet
- This topic was intentionally left open and must not be treated as sealed
- The required exercise still needs a full documentation sweep before writing the actual `persona -> journey -> touchpoint -> variant` artifact

**Required Exercise To Be Done Later**

Create the missing business-baseline artifact for `Manage Tenant Agents` using the same template as the other sealed R02 business files:

1. inspect the full source set
2. normalize the actor model into the R02 persona model
3. define the journeys
4. define the touchpoints
5. define the variants
6. define the variant contents
7. resolve the boundary between the tenant fact-sheet `Agents` tab and the broader `R05 Agent Manager` product

**Minimum Business Scope To Cover**

Based on the current R02 story, the later baseline must cover at minimum:

- view list of deployed agents for the tenant
- deploy agents from the master agent catalog
- configure per-tenant agent settings
- enable or disable agents without removing configuration
- `ADMIN (MASTER)` can manage agents for any tenant
- `ADMIN (REGULAR)` and `ADMIN (DOMINANT)` can manage agents for own tenant only

**Expected Questions To Resolve During That Exercise**

- what are the real tenant-scoped touchpoints versus the full `R05 Agent Manager` product touchpoints?
- does the R02 tenant-scoped flow stop at a deployed-agents list and agent fact sheet, or does it open deeper builder/configuration screens from `R05`?
- which screens are true touchpoints for this exercise?
- which states are real requirement-level variants versus implementation detail?
- is the tenant-scoped entry a simple `Agents Tab` shell, or a tenant-scoped `Agent Manager` workspace?

**Candidate Structure To Validate Later**

These are not final. They are only the candidate starting points for the later exercise:

- Personas
  - `ADMIN (MASTER)`
  - `ADMIN (REGULAR)`
  - `ADMIN (DOMINANT)`

- Candidate journeys
  - `View Tenant Agents List`
  - `View Tenant Agent Fact Sheet`
  - `Deploy Tenant Agent`
  - `Configure Tenant Agent`
  - `Enable or Disable Tenant Agent`

- Candidate touchpoints
  - `Agents Tab`
  - `Deployed Agents List`
  - `Agent Fact Sheet`
  - `Deploy Agent Dialog or Wizard`
  - `Configure Agent`
  - `Enable/Disable Agent Confirmation`

- Candidate variants to check
  - initial loading
  - list view
  - card view
  - empty state
  - no results
  - deploy success
  - deploy blocked
  - configuration validation error
  - enabled
  - disabled
  - access denied

**Documentation References That Must Be Considered**

Use all of these when the topic is resumed:

- R02 tenant-management references
  - `Documentation/.Requirements/.references/R02. TENANT MANAGEMENT/Design/R02-COMPLETE-STORY-INVENTORY.md:184-198`
  - `Documentation/.Requirements/.references/R02. TENANT MANAGEMENT/Design/R02-screen-flow-prototype.html:833-840`
  - `Documentation/.Requirements/G01 Business Requirements/G01.03 Tenant Fact Sheet/G01.03.01 View Tenant Fact Sheet/01-Persona-Journey-Touchpoint-Variant.md`

- R05 agent-manager references
  - `Documentation/.Requirements/.references/R05. AGENT MANAGER/Design/01-PRD-AI-Agent-Platform.md`
  - `Documentation/.Requirements/.references/R05. AGENT MANAGER/Design/R05-STORY-INVENTORY-PART1.md:397-399`
  - `Documentation/.Requirements/.references/R05. AGENT MANAGER/prototype/index.html`
  - `Documentation/.Requirements/.references/R05. AGENT MANAGER/prototype/app.js`
  - `Documentation/.Requirements/.references/R05. AGENT MANAGER/validation/06-ux-design-audit.md:123`

- Architecture and cross-cutting references
  - `Documentation/Architecture/02-constraints.md:20`
  - `Documentation/Architecture/05-building-blocks.md:354-357`
  - `Documentation/Architecture/07-deployment-view.md:816-819`

- Persona references to review for later fit
  - `Documentation/persona/PERSONA-REGISTRY.md`
  - `Documentation/persona/personas/EX-PERSONAS-EXTENDED.md`

**Output Expected Later**

When this topic is resumed, create:

- `01-Persona-Journey-Touchpoint-Variant.md`

and only seal it after the full later exercise is completed.
