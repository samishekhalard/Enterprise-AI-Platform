# Integration Hub - Fullstack Implementation Requirements

> Document type: Product-to-build handoff
> Scope: R08 Integration Hub
> Status: Working baseline for implementation
> Purpose: This document restructures the working conversation into one build-ready view of the Integration Hub so frontend, backend, and operations can move without requirement drift.
> Companion documents: `Documentation/lld/integration-hub-spec.md`, `03-Integration-Hub-Phase0-Phase1-Implementation-Plan.md`

---

## 1. What We Are Building

The Integration Hub is the control plane for every governed exchange that moves into, out of, or across EMSIST. It gives the platform one place to define connectors, test them safely, map external structures to EMSIST concepts, run synchronization, monitor health, investigate failures, and apply approvals where risk is higher.

It must support four interaction shapes:

| Interaction shape | Why it exists | Initial delivery | Expansion path |
|---|---|---|---|
| EMSIST <-> external EA/BPM tools | Bring architecture and process data in and out of EMSIST in a governed way | Connector setup, test, sync, monitoring | Richer product-specific plugins and webhook normalization |
| Tenant <-> tenant exchange | Allow controlled sharing across tenants without leaking data | Approval-ready design and policy model | Runtime link management and governed transfer flows |
| Agent <-> agent governance | Control how internal agents communicate and what channels they use | Model and contracts prepared | Full channel registration, testing, and audit |
| EMSIST <-> external AI agents | Connect EMSIST workflows to external agent tools safely | Outbound-safe design and policies | MCP and external agent channel operations |

The hub is not a replica store. It owns control-plane and operational data only:

- connector definitions
- credential references or secure secret material per approved phase
- mapping definitions and schema snapshots
- sync profiles, checkpoints, runs, and exception records
- health signals, audit references, and outbox events

It does not become the long-term home of business-domain truth from external systems.

---

## 2. What Good Looks Like

The hub is successful when:

- a user with `TENANT_ADMIN` access can register a connector and make it usable without engineering help
- the team can test connectivity, auth, schema, and sample reads safely before activating a sync
- mappings are versioned and previewable before they are pinned to a live profile
- sync runs are observable, recoverable, and auditable
- risky actions such as archive, replay, revoke, or approval-gated sharing are controlled and recorded
- platform teams can trust that tenant boundaries, secrets, webhook ingress, and outbound calls are protected

---

## 3. People, Systems, and Responsibilities

| Actor / Runtime Role | Why they are here | What they can do |
|---|---|---|
| `TENANT_ADMIN` | Owns integrations for one tenant | Create and manage connectors, run playground checks, configure mappings and sync profiles, trigger sync, review history and health |
| `ADMIN` | Provides elevated tenant-scoped administration | Archive connectors, approve higher-risk tenant-local actions, and access the broader admin surfaces that already accept `ADMIN` or `SUPER_ADMIN` |
| `VIEWER` | Needs visibility without change rights | View connector status, run history, health, and audit trails inside tenant scope |
| `SUPER_ADMIN` | Governs higher-risk cross-tenant behavior, platform security, and operations | Approve tenant-to-tenant links, review agent channels, manage feature rollout, inspect cross-tenant operational signals, and respond to platform-wide connector incidents |
| System Scheduler | Runs scheduled work | Starts sync runs from active profiles according to `schedule_cron` and policy |
| Outbox Poller or CDC pipeline | Publishes events safely | Moves committed outbox rows to Kafka without losing transaction integrity |
| External System | Source or target of synced data | Responds to plugin-driven calls and may emit callbacks or webhooks |
| External Webhook Sender | Pushes near-real-time changes | Sends signed, time-bounded callbacks to webhook endpoints |
| Internal AI Service or Agent | Participates in governed channels | Uses approved internal agent communication paths |
| External AI Agent | Exchanges context or actions through approved adapters | Operates through configured outbound channels, limits, and audit rules |

Use runtime role keys directly in this requirement set. `PLATFORM_ADMIN` is not a role in the current codebase. `TENANT_ADMIN`, `ADMIN`, and `SUPER_ADMIN` are the privileged roles enforced today, while `VIEWER` exists in the auth graph and should remain read-only when exposed in Integration Hub flows.

---

## 4. Capability Map

This is the complete product shape the hub must support. Not every area lands in the first delivery slice, but the document and implementation path must make room for all of them.

| Area | Must support | First usable slice | Later depth |
|---|---|---|---|
| Connector registry | Create, edit, activate, pause, archive, search, filter | Yes | Product-specific policy presets and richer status models |
| Secure connection setup | Auth mode selection, secret handling, expiry awareness | Yes | Vault-native secret lifecycle and rotation workflows |
| Playground | Connectivity test, auth test, schema discovery, dry-read, dry-write guardrails | Yes | Sample transformation preview and advanced troubleshooting |
| Mapping workspace | Definition mapping, attribute mapping, match rules, preview, validation, version pinning | Baseline structure | Full studio with richer visual editing |
| Sync profile management | Direction, strategy, schedule, retry, conflict handling, manual trigger | Yes | More advanced orchestration and dependency controls |
| Run history | Run list, stats, statuses, error summary | Yes | Deeper drill-down and timeline views |
| Exception handling | Retry, resolve, dead-letter, manual review | Baseline contracts | Rich operational workflows and bulk recovery |
| Health and monitoring | Summary cards, degradation signals, alert feed, recent failures | Baseline summary | Rich dashboards and external observability exports |
| Approval-led actions | Confirmation, elevated approval, immutable audit | Yes for risky actions | Broader governance policies |
| Tenant sharing and agent channels | Approval, policy, channel registration, testing | Model now | Full runtime support in later phases |

---

## 5. Where Interaction Happens

| Touchpoint | Direction | Purpose | Notes |
|---|---|---|---|
| Administration UI | Human -> EMSIST | Main operating surface for setup, review, and control | Lives under `/administration?section=integration-hub` |
| Gateway REST API | UI/system -> integration-service | All authenticated configuration and control flows | JWT enforced for `/api/v1/integrations/**` |
| Webhook ingress | External -> integration-service | Accept event-driven changes from external products | No bearer JWT; use signature, timestamp, and IP policy |
| Kafka topics | integration-service <-> platform | Publish events, commands, and normalized webhook traffic | Backed by outbox pattern |
| Secret management | integration-service -> secure secret store | Resolve credentials safely | Phase 1 secure storage, phase 2 Vault-native target |
| auth-facade | integration-service -> auth layer | Connector token issuance and scoped auth support | Required for OAuth and cross-boundary trust |
| audit-service | integration-service -> audit layer | Immutable event record for config, sync, policy, and security activity | Must receive canonical audit signals |
| notification-service | integration-service -> alerts | Surface failed syncs, degradations, and expiring auth | User-facing alerts stay outside integration-service |
| External product APIs | integration-service -> external systems | Read, write, test, and discover remote structures | All outbound traffic passes framework safeguards |
| MCP or AI channel adapters | integration-service <-> agent tools | Governed AI communication | Feature-flagged until later rollout |

---

## 6. Main Workspaces in the Administration Section

The hub should feel like one operating area, not a loose collection of unrelated tabs.

| Workspace | Purpose | Primary actions | Key dependencies |
|---|---|---|---|
| Overview | Show the current state of the hub at a glance | Review healthy vs degraded connectors, recent sync results, alerts, backlog | `health-summary`, recent runs, alert feed |
| Connectors | Inventory and entry point for all integrations | Search, filter, create, edit, activate, pause, archive | Connector CRUD, policy state, lifecycle rules |
| Connector setup | Configure one connector end to end | Edit base details, choose auth mode, attach secret, set direction and protocol | Connector detail API, secure secret handling, validation |
| Playground | Safely inspect whether the connector is usable | Run connection test, auth test, discover schema, execute dry-read, validate dry-write guardrails | Plugin SPI, timeout rules, masked samples |
| Mapping workspace | Define how external records align to EMSIST | Create mapping, edit attribute rules, set match behavior, validate, preview | Mapping APIs, schema snapshots, versioning |
| Sync profiles | Define when and how a connector moves data | Create profile, set strategy and schedule, choose conflict behavior, trigger or pause | Sync profile APIs, checkpoint rules, lock strategy |
| Run history | Review execution results over time | Filter runs, inspect stats, open error summary, investigate partial failures | Sync run APIs, cursor pagination |
| Exception queue | Recover or route failed records | Retry, resolve, dead-letter, inspect masked payload | Exception APIs, audit, policy checks |
| Health timeline | Track connector health and drift over time | Review degradation, auth expiry, quota issues, webhook failures | Health logs, summary endpoint, metrics |
| Activity and approvals | Track sensitive actions and approval-gated work | Review audit trail, approve or reject restricted actions, inspect security events | audit-service, approval rules, feature flags |
| Channel governance | Govern tenant-sharing and agent channels | Register channel, test channel, pause, revoke, inspect audit | Later-phase APIs and approval policy |

---

## 7. How People Move Through the Hub

### 7.1 Register a connector and make it usable

- Actor: `TENANT_ADMIN`
- Trigger: A new external system or endpoint must be connected
- Preconditions: Caller has `TENANT_ADMIN`, `ADMIN`, or `SUPER_ADMIN` access, feature flag is enabled, and required endpoint details are available
- Main path:
  - Open Connectors
  - Create a new connector in `DRAFT`
  - Enter product type, protocol, direction, and base URL
  - Bind the credential or secure secret material according to the approved phase model
  - Save configuration and move to Playground
  - Run connection and auth tests
  - If tests succeed, move connector to an active working state
- Alternate path:
  - Connector stays `CONFIGURED` if setup is valid but testing has not been completed
  - Connector can be paused later without losing configuration
- Failure path:
  - Validation errors stay inline on the form
  - Auth or connectivity failures keep the connector out of the active state
  - Policy violations block activation and create an audit record
- Done when: The connector is saved, tested, visible in the registry, and available for mapping and sync profile work

### 7.2 Explore the remote system safely

- Actor: `TENANT_ADMIN`
- Trigger: The admin needs to confirm whether the connector can see the target system correctly
- Preconditions: Connector exists and has enough configuration to test
- Main path:
  - Open Playground from connector setup
  - Execute connectivity and auth tests
  - Discover schema or inspect available object types
  - Run dry-read against a limited sample
  - Review masked sample output and compatibility notes
- Alternate path:
  - If schema discovery is unsupported, the user can proceed with manual mapping inputs
- Failure path:
  - Timeout, rate limit, expired credential, and schema errors are surfaced clearly
  - Playground never hides uncertainty; if the test is inconclusive, the result is inconclusive
  - `dry_write` mode never sends a real network request
- Done when: The admin understands whether the connector works, what the remote shape looks like, and whether mapping can proceed

### 7.3 Prepare mapping and preview the transformation

- Actor: `TENANT_ADMIN`
- Trigger: A connector is ready to translate external records into EMSIST structures or vice versa
- Preconditions: Connector exists; remote schema has been discovered or entered manually
- Main path:
  - Create a mapping definition
  - Define attribute mappings and transformation expressions
  - Set match rules for identity resolution
  - Run validation and preview against sample payloads
  - Publish or save the mapping version
- Alternate path:
  - User saves a draft mapping without publishing it to live sync
- Failure path:
  - Invalid expressions, missing required fields, or incompatible schema changes block publish
  - Preview errors show field-level detail without exposing secrets
- Done when: A versioned mapping exists and can be pinned by a sync profile

### 7.4 Create a sync profile and run it

- Actor: `TENANT_ADMIN`
- Trigger: The team is ready to move data on demand, on a schedule, or in response to events
- Preconditions: Connector exists; mapping is ready; permissions are valid
- Main path:
  - Create a sync profile
  - Set direction, strategy, schedule, timezone, retries, and conflict behavior
  - Trigger a manual run or allow the scheduler to run it
  - Acquire a run lock
  - Read via the plugin, process records, write checkpoints, and create outbox events in the same transaction scope where required
- Alternate path:
  - Profile can remain configured but paused until the business is ready
- Failure path:
  - If a run lock already exists, return `409 Conflict`
  - Record-level failures move to the exception queue and the run can finish as `PARTIAL`
  - Major auth or policy failures stop the run and degrade health
- Done when: The profile is active or paused by choice, and a run history entry exists for each execution

### 7.5 Investigate a failed or partial run

- Actor: `TENANT_ADMIN`, `ADMIN`, or `SUPER_ADMIN`
- Trigger: A run fails, completes partially, or an alert appears
- Preconditions: Run history and exception records exist
- Main path:
  - Open run history
  - Inspect the failed or partial run
  - Open the related exception queue items
  - Retry, resolve, or dead-letter individual failures according to policy
  - Confirm recovery actions and review the next health state
- Alternate path:
  - Use the outcome to adjust mapping or connector policy before retrying
- Failure path:
  - Repeat failures remain visible; the system does not silently clear them
  - Dead-letter is explicit and audited
- Done when: The issue is either recovered, intentionally parked, or escalated with clear traceability

### 7.6 Rotate or revoke access safely

- Actor: `TENANT_ADMIN`, `ADMIN`, or `SUPER_ADMIN`
- Trigger: Credential expiry, suspected exposure, or policy rotation
- Preconditions: Connector exists and the user has the required privileges
- Main path:
  - Open connector security controls
  - Rotate or replace the credential reference
  - Re-run connection and auth checks
  - Resume connector if validation succeeds
- Alternate path:
  - Revoke immediately and pause the connector if there is active risk
- Failure path:
  - Invalid replacement leaves the connector unavailable but auditable
  - The previous secret must never be shown back to the user
- Done when: Secret state is updated, connector status reflects reality, and the action is captured immutably

### 7.7 Approve cross-boundary sharing or channels

- Actor: `SUPER_ADMIN`
- Trigger: Tenant-to-tenant sharing or agent communication needs explicit governance
- Preconditions: Channel request exists and approval features are enabled
- Main path:
  - Review the request, purpose, policy, limits, and trust boundary
  - Approve or reject the request
  - If approved, the channel becomes testable and then operational
- Alternate path:
  - Request is returned for revision without activation
- Failure path:
  - Missing policy, unsafe endpoint, or out-of-scope data use blocks approval
- Done when: The decision, rationale, and resulting state are fully auditable

---

## 8. Navigation and Screen Flow

The administration section should guide users through a clear operating sequence:

1. Overview -> see current health and recent activity
2. Connectors -> find an existing connector or create a new one
3. Connector setup -> finish base configuration and attach the auth method
4. Playground -> prove connectivity, auth, and schema access safely
5. Mapping workspace -> define how records should translate
6. Sync profiles -> define when and how synchronization runs
7. Run history and exception queue -> investigate results and recover failures
8. Activity and approvals -> inspect sensitive actions and approve restricted work

Navigation rules:

- The entry point stays `/administration?section=integration-hub`
- Connector detail should be reachable from the list and from health alerts
- Playground, mapping, and sync profiles should open in the context of a selected connector
- Run history and health should allow drill-down back to the connector and profile that generated the issue
- Approval-led flows must deep-link back to the object under review

---

## 9. Layout Rules Across Devices

| Surface | Desktop | Tablet | Mobile |
|---|---|---|---|
| Overview | Multi-card summary with recent activity side panel | Summary cards in two columns, activity stacked below | Single-column cards with sticky filter or action bar |
| Connector inventory | Table plus side detail or drawer | Table with condensed columns and slide-over detail | Card list with search and filter chips, detail opens full screen |
| Connector setup | Form and help panel side by side | Form-first layout, secondary info collapses below | Step-based form with sticky primary action |
| Playground | Result panes visible together where space allows | Inputs above, results below | Single result panel at a time, no cramped split view |
| Mapping workspace | Wide canvas or multi-panel editor | Reduced side panels, focus on one mapping group at a time | Limited mobile support; use guided editor instead of dense canvas |
| Sync profiles and runs | Table with filters and inline status chips | Table with key fields only | Card list with status, trigger, and action menu |
| Exception queue | Filterable table with masked payload drawer | Compact list with detail drawer | Prioritized list with a dedicated detail route |

General responsive rules:

- destructive actions stay reachable but never become easy to mis-tap
- sticky primary actions are allowed on smaller screens
- tables collapse to cards before text becomes unreadable
- long payloads and logs must scroll inside contained panels, not break the page
- minimum mobile behavior must still support review, retry, approve, and pause actions

---

## 10. States, Exceptions, and Edge Handling

Every major screen must support loading, empty, success, warning, and failure states. The hub should make uncertainty visible instead of pretending the system is healthier than it is.

| Situation | Expected user experience | Service behavior |
|---|---|---|
| No connectors exist | Empty state with clear CTA to create the first connector | Return empty list, not an error |
| Invalid connector form input | Inline field errors and blocked save | Validation returns RFC 9457 field detail |
| Connector auth fails | Show failure reason, keep connector out of active use | Test result captured, health reflects degraded or blocked state |
| Connection timeout | Show timeout and retry option | Respect timeout policy and audit the failed test if required |
| Schema discovery returns nothing | Show unsupported or empty result state | Preserve raw result metadata safely for review |
| Mapping validation fails | Highlight the failing fields or expressions | Do not allow publish or live pinning |
| Manual trigger collides with active run | Show clear conflict state | Return `409 Conflict` from lock strategy |
| Run partially succeeds | Show `PARTIAL` with counts and direct path to exceptions | Commit successful work, queue failed records |
| Retry fails again | Keep the item visible with updated retry count | Never erase the failure trail |
| Connector is archived | Disable mutating actions except allowed restore path if supported | Reject disallowed operations consistently |
| Secret is near expiry | Warning banner and action to rotate | Health summary exposes the warning |
| Webhook signature is invalid | Reject request and record the event | No downstream processing |
| Webhook replay is detected | Reject and audit replay attempt | Protect against duplicate or malicious resend |
| Outbox backlog grows | Warning in monitoring surfaces and alerts | Preserve pending rows, do not fake publish success |
| Tenant mismatch | Do not reveal resource existence | Return `404`, not `403` |

---

## 11. Messages, Confirmations, and Approvals

The implementation needs a real message layer, not ad hoc strings scattered through components and controllers. At minimum, it must define:

- page titles and section labels
- button and action labels
- helper text for risky or unfamiliar inputs
- inline validation messages
- warning banners
- success toasts
- failure toasts
- confirmation dialog titles and body text
- audit-friendly event labels

Suggested message groups:

| Group | Examples that must exist |
|---|---|
| Navigation | `Integration Hub`, `Connectors`, `Playground`, `Sync Profiles`, `Health`, `Activity` |
| Primary actions | `Add Connector`, `Test Connection`, `Discover Schema`, `Validate Mapping`, `Trigger Sync`, `Pause Profile` |
| Success feedback | `Connector saved`, `Connector activated`, `Profile updated`, `Sync triggered`, `Record retried` |
| Warnings | `Credential expires soon`, `Schema changed`, `Playground result is partial`, `Outbox backlog is growing` |
| Failures | `Connection test failed`, `Run lock already held`, `Webhook rejected`, `Mapping preview failed` |
| Approval copy | `Approve sharing request`, `Reject channel request`, `Archive connector`, `Revoke access` |

Risky actions require explicit handling:

| Action | Allowed actor | Confirmation required | Approval required | Audit required | Rollback path |
|---|---|---|---|---|---|
| Activate connector | `TENANT_ADMIN`, `ADMIN`, or `SUPER_ADMIN` | Yes | No | Yes | Pause or archive |
| Archive connector | `ADMIN` or `SUPER_ADMIN` | Yes | No | Yes | Restore only if policy allows |
| Trigger sync now | `TENANT_ADMIN`, `ADMIN`, or `SUPER_ADMIN` | Yes when profile is high impact | No | Yes | Cancel if supported later, otherwise observe and recover |
| Retry failed record | `TENANT_ADMIN`, `ADMIN`, or `SUPER_ADMIN` | Yes | No | Yes | Retry again or resolve |
| Dead-letter exception | `TENANT_ADMIN`, `ADMIN`, or `SUPER_ADMIN` | Yes | No | Yes | Manual replay path only |
| Rotate credential | `TENANT_ADMIN`, `ADMIN`, or `SUPER_ADMIN` | Yes | No | Yes | Re-bind a new secret and retest |
| Revoke credential | `ADMIN` or `SUPER_ADMIN` | Yes | Sometimes | Yes | Reissue and retest before resume |
| Run elevated playground action | `ADMIN` or `SUPER_ADMIN` | Yes | Sometimes | Yes | No real write in `dry_write` mode |
| Approve tenant-sharing link | `SUPER_ADMIN` | Yes | Yes | Yes | Pause or revoke the link |
| Approve agent channel | `SUPER_ADMIN` | Yes | Yes | Yes | Pause or revoke the channel |

---

## 12. Core Service Behavior

The hub runs as a dedicated `integration-service` and keeps product-specific logic behind plugins while platform rules stay in the shared core.

Key rules:

| Rule | Implementation meaning |
|---|---|
| The service is a control plane | Store configuration, runtime metadata, and audit-friendly state, not replicated business truth |
| Product quirks live in plugins | HOPEX, ARIS, webMethods, and future products use the same framework boundary |
| Generic safeguards stay in the framework | Retry, rate limiting, secret resolution, policy checks, audit publishing, and mapping runtime are not plugin code |
| `sync_profiles` is the single source of truth for scheduling and execution intent | There is no separate scheduling entity to drift from the profile |
| Runs are lock-protected | Concurrent execution of the same profile is rejected safely |
| Outbox is mandatory for event publication | Sync state and emitted events cannot drift apart |
| Health is both user-facing and operator-facing | Admins need summary views while platform teams need metrics and logs |

Connector lifecycle expectations:

- `DRAFT` after initial creation
- `CONFIGURED` when enough setup exists to test
- `TESTING` during active validation
- `ACTIVE` when usable
- `PAUSED` when intentionally stopped
- `DEGRADED` when the connector is still known but unhealthy
- `ARCHIVED` when retired from active use

Supported trigger modes:

- on demand
- scheduled
- event-driven

---

## 13. Information the Hub Must Keep

### 13.1 Core records

| Record | Why it exists |
|---|---|
| `connectors` | Canonical definition of each integration point |
| `connector_credentials` | Secure auth material or secure reference according to approved rollout phase |
| `definition_mappings` | Versioned mapping definitions between external and EMSIST structures |
| `attribute_mappings` | Field-level transformation and defaulting rules |
| `match_rules` | Identity resolution behavior |
| `identity_bindings` | Known source-target identity relationships |
| `schema_snapshots` | Versioned record of discovered remote shapes |
| `connector_policies` | Rate, IP, schedule, and data handling rules |
| `webhook_registrations` | Inbound or outbound webhook registration data |
| `agent_channels` | Governed tenant-sharing or agent communication channels |

### 13.2 Operational records

| Record | Why it exists |
|---|---|
| `sync_profiles` | Define what, when, and how data moves |
| `sync_runs` | Immutable record of each execution |
| `sync_checkpoints` | Resume incremental work safely |
| `run_locks` | Prevent unsafe concurrent execution |
| `sync_exception_queue` | Hold per-record failures for retry or review |
| `outbox_events` | Guarantee event publication without dual-write drift |
| `connector_health_log` | Track health history over time |

Data boundary rules:

- every tenant-owned record is tenant-aware
- secrets must never be returned in API responses
- masked payloads are allowed for troubleshooting; raw sensitive payloads are not
- run history is immutable; recovery actions create more history rather than rewriting it

---

## 14. Contracts the Frontend and Backend Build Against

### 14.1 API groups

| Group | Core endpoints |
|---|---|
| Connector management | create, list, get, update, delete or archive, test, discover schema |
| Health summary | aggregated connector and sync status for the hub overview |
| Sync profile management | create, list, get, update, trigger, pause, resume |
| Run history and exceptions | list runs, get run detail, list exceptions, retry, dead-letter |
| Mapping workspace | list, create, update, validate, preview |
| Playground | execute ad hoc test, transform sample payload |
| Webhook receiver | accept inbound webhook by connector |
| Channel governance | list, create, update, test, inspect audit for channels |

### 14.2 Contract rules

| Rule | Requirement |
|---|---|
| Base paths | `/api/v1/integrations/**` and `/api/v1/webhooks/**` |
| Error format | RFC 9457 `ProblemDetail` |
| Tenant scope | Extract `tenant_id` from JWT and treat cross-tenant lookups as `404` |
| Small admin lists | Use `page` and `limit` |
| High-volume history | Use cursor pagination |
| Filtering | Support LHS bracket syntax such as `filter[status]=FAILED` |
| Search and sort | Provide lightweight list refinement for admin workflows |

### 14.3 Event publication

| Topic | Purpose |
|---|---|
| `integration-events` | Domain and operational events from the hub |
| `integration-events.dlq` | Failed event handling path |
| `integration-sync-commands` | Async sync command flow |
| `integration-webhooks` | Normalized inbound webhook traffic |
| `audit-events` | Canonical audit publication |

Event rules:

- CloudEvents structured mode
- partitioning that preserves meaningful order
- retry and DLQ behavior for publish and consume failures
- audit-worthy actions emit predictable event types

---

## 15. Trust, Control, and Recovery

The hub is only useful if teams trust it. These controls are part of the product, not later hardening.

| Area | Required behavior |
|---|---|
| Authentication | Gateway validates JWT for authenticated routes |
| Tenant isolation | Every tenant-owned lookup and mutation is tenant-scoped; cross-tenant access returns `404` |
| Secret handling | No plain secrets in logs, UI payloads, Kafka payloads, or audit metadata |
| Webhook ingress | Validate signature, timestamp freshness, and IP policy before processing |
| Outbound safety | Apply allowlists, SSRF protection, timeout policy, and rate control |
| Plugin execution | Wrap plugin calls with retry, circuit breaker, and audit in the core layer |
| Audit | Record connector changes, sync actions, approval decisions, security events, and webhook violations |
| Observability | Expose metrics, structured logs, and health summaries; do not rely on audit replay for runtime status |
| Recovery | Support retries, dead-letter handling, lock expiry recovery, and checkpoint-based resume |

Operational signals that must exist:

- connector health status
- recent sync outcomes
- outbox backlog
- webhook acceptance or rejection counts
- playground execution counts
- auth expiry or credential risk signals

Non-negotiable negative cases:

- no cross-tenant leakage
- no secret exposure
- no ungoverned webhook acceptance
- no fake success when event publication fails

---

## 16. Delivery Path

The full vision is broader than the first release, but the first release has to be genuinely usable.

### 16.1 First usable slice

The first slice should include:

- connector registry
- connector setup
- playground with connection, auth, schema, and dry-read checks
- sync profile creation and manual trigger
- run history and baseline health summary
- audit publication
- administration section wiring through the gateway

### 16.2 Expansion path

| Phase | Focus |
|---|---|
| Phase 0 | Service skeleton, schema, gateway route, health endpoint |
| Phase 1 | Connector registry, playground, sync profiles, outbox publish path, baseline monitoring |
| Phase 2 | Rich mapping workspace, exception handling depth, health dashboards, notification hooks |
| Phase 3 | Tenant-sharing runtime, agent channel governance, broader webhook and command flows |
| Phase 4 | CDC-based outbox, schema registry, advanced observability export and hardening |

### 16.3 Practical build sequence

The safest implementation order is:

1. backend foundation and contracts
2. frontend administration section and core screens
3. wire the UI to live backend contracts through the gateway
4. run the system end to end with Docker and verify the core journeys

That keeps the product flow intact while reducing API drift.

---

## 17. Ready-for-Build Checklist

This work is ready for implementation only when all of the following are true:

- every major workspace is listed and has a purpose
- every key journey is documented from trigger to done state
- every risky action has confirmation, approval, audit, and rollback expectations
- every screen has loading, empty, success, warning, and failure behavior
- every backend endpoint maps to a user flow or system flow
- every high-risk edge case has an expected result
- every critical message category is defined
- frontend and backend share the same names, phases, and event vocabulary
- testing can trace from requirement -> workspace -> API or event -> verification

---

## 18. Build Verification Baseline

When the first usable slice is implemented, the team should be able to prove all of this in a running environment:

- the administration section renders under `/administration?section=integration-hub`
- connector CRUD works inside tenant scope
- playground tests can validate connection and auth safely
- schema discovery or manual setup can feed mapping work
- a sync profile can be created and manually triggered
- run history records success, partial completion, and failure correctly
- exception handling leaves a visible trail
- audit events are emitted for sensitive actions
- health summary reflects actual connector and sync state
- the system starts, routes, and runs through Docker without special manual steps

---

## 19. Working Rule for Future Updates

This document is the product-to-build bridge for R08. The LLD remains the detailed technical source, and the phase plan remains the execution plan. If one of them changes, this document must be updated in the same pass so the hub keeps one story across product intent, implementation, and operations.
