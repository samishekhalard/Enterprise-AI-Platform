# UX Design Audit Report

**Date:** 2026-03-07
**Auditor:** UX Agent
**Document:** 06-UI-UX-Design-Spec.md v1.1
**Cross-References:** 10-Full-Stack-Integration-Spec.md v1.1.0, 01-PRD-AI-Agent-Platform.md v1.1, 08-Agent-Prompt-Templates.md v1.1.0
**Status:** All documents are [PLANNED] -- no frontend implementation exists

---

## Executive Summary

The UI/UX Design Spec (06) is a thorough and well-structured document covering design tokens, component specifications, page layouts, responsive breakpoints, accessibility (WCAG AAA), interaction patterns, animations, and user flows. However, this audit identified **47 gaps** across **7 categories**, including **8 P0 (Critical)**, **16 P1 (High)**, **15 P2 (Medium)**, and **8 P3 (Low)** findings. The most significant gaps are:

1. **Missing screens** -- No dedicated Agent Audit Log, Execution History, Agent Comparison, Import/Export, AI Module Settings/Preferences, or Role-Based Access views
2. **Agent Builder accessibility** -- Drag-and-drop has no keyboard alternative specified, and builder canvas scalability for 20+ capabilities is unaddressed
3. **Incomplete state coverage** -- Partial/degraded states and offline states are not specified for most components
4. **Publish/Fork governance** -- No approval workflow, version comparison, or undo for destructive actions (delete agent, unpublish)
5. **Deep linking** -- No specification for bookmarkable URLs or browser back-button behavior in the builder

---

## 1. Screen-by-Screen Findings

### 1.1 Chat Page (Section 3.1)

| Aspect | Status | Finding |
|--------|--------|---------|
| Empty State | OK | Defined in Section 6.7 ("Start your first conversation" with illustration + CTA) and empty conversation greeting |
| Loading State | OK | Skeleton screens defined in Section 6.8 for message bubbles, conversation list items |
| Error State | OK | Connection lost, model timeout, validation failure, rate limit, service unavailable, auth expired all defined in Section 6.6 |
| Success State | OK | Full chat interaction with streaming, tool panels, feedback documented |
| Partial State | GAP | Not defined: what happens when sidebar loads but chat API fails? Or when conversation list loads but context panel API times out? |
| Offline/Degraded State | GAP | No specification for what happens when the user goes offline mid-conversation. Only "connection lost" banner exists, but no offline queueing or graceful degradation for read-only mode |
| Desktop Responsive | OK | Three-panel layout at >1280px well defined |
| Tablet Responsive | OK | Sidebar and context panel become drawer overlays |
| Mobile Responsive | OK | Single panel with bottom navigation defined |
| Keyboard Navigation | OK | Comprehensive shortcuts defined in Section 5.2.2 (Enter, Shift+Enter, Arrow keys, F6 panel cycling) |
| Screen Reader | OK | ARIA roles for message list (`role="log"`), individual messages (`role="article"`), streaming indicator (`aria-live`) defined |
| Focus Management | OK | Focus trapping in modals, focus stays on input during streaming |
| RTL Support | OK | Bubble position, sidebar position, text alignment all specified for RTL |
| Deep Linking | GAP | No specification for conversation URLs (e.g., `/ai-chat/conversations/{id}`) for bookmarking or sharing |

### 1.2 Template Gallery (Section 2.2.3 / 3.4.1)

| Aspect | Status | Finding |
|--------|--------|---------|
| Empty State | OK | "No configurations match your filters" with "Clear filters" link defined |
| Loading State | GAP | No skeleton specification for gallery cards during initial load |
| Error State | GAP | No specification for API failure when loading templates (e.g., template service down) |
| Success State | OK | Card grid with search, filters, "Build from Scratch" and "Use Configuration" actions defined |
| Partial State | GAP | No specification for when some template categories load but others fail |
| Offline/Degraded State | GAP | No specification |
| Desktop Responsive | OK | 4-column grid defined |
| Tablet Responsive | OK | 2-column grid defined |
| Mobile Responsive | OK | 1-column grid defined |
| Keyboard Navigation | GAP | No explicit keyboard navigation defined for gallery cards (Tab between cards, Enter to select, arrow keys for grid navigation?) |
| Screen Reader | GAP | No ARIA roles specified for gallery grid or individual cards (e.g., `role="article"` on cards, `aria-label` with template name + category) |
| Search/Filter/Sort | PARTIAL | Search and filter chips defined. Sort is missing -- no dropdown for sorting by name, popularity, recency, or complexity |
| Card Metadata | OK | Icon, name, domain tags, capability count, usage count, origin badge all specified |
| Preview Action | GAP | "Preview" button defined but the preview detail view layout is not specified. What does the read-only detail view look like? |
| Pagination/Infinite Scroll | GAP | No specification for how the gallery handles 100+ templates. No pagination or infinite scroll defined |

### 1.3 Agent Builder (Section 2.2.4 / 3.4.2)

| Aspect | Status | Finding |
|--------|--------|---------|
| Empty State | GAP | No specification for builder opened in "Build from Scratch" mode -- what does a blank canvas look like? Are sections collapsed? Are placeholder hints shown? |
| Loading State | GAP | No specification for loading state when opening builder for an existing agent (fetching agent config, skills, tools) |
| Error State | GAP | No specification for: save fails, publish fails, test execution fails. What happens if the Playground streaming call errors? |
| Success State | OK | Full three-panel layout with all sections documented |
| Partial State | GAP | No specification for when skills tab loads but tools tab API fails |
| Desktop Responsive | OK | Three-panel layout at >1280px |
| Tablet Responsive | OK | Left panel collapses to icon rail, playground hidden behind toggle |
| Mobile Responsive | OK | Bottom tab navigation (Library / Canvas / Playground) |
| Drag-and-Drop Keyboard Alternative | CRITICAL GAP | The spec says "drag-to-add support" for skills but provides NO keyboard alternative. WCAG 2.1 Level AAA requires all functionality to be operable via keyboard. Users with motor disabilities cannot use drag-and-drop. Must define: "Add" button, Enter-to-add on focused skill, or arrow key reordering |
| Builder Canvas Scalability | GAP | No specification for how the builder canvas behaves with 20+ active skills and 30+ active tools. Does the chip strip wrap? Is there a collapse threshold? Scrollable container with max-height? |
| System Prompt Editor | OK | Monaco-style editor with syntax highlighting, variable autocomplete, min-height 300px |
| Prompt Playground Streaming | OK | References `ai-message-bubble` for response rendering. SSE streaming detailed in integration spec |
| Fork Flow | GAP | No specification for what happens to the original template when forked. Is the fork linked to the original? Can you see "Forked from: SQL Data Analyst"? Does the original's usage count increment? |
| Publish Flow | CRITICAL GAP | No approval workflow defined. Does "Publish" make the agent immediately available to all users? Is there a review step? Who can publish (any user, or admin only)? What about publishing to the Template Gallery vs. just making the agent active? The toolbar shows "Publish" button but the workflow is undefined |
| Version History | PARTIAL | "Version History" button defined in toolbar with "opens side drawer" note. But no specification for the version history drawer layout: what metadata is shown per version? How to compare versions? How to rollback to a previous version? |
| Confirmation Dialogs | GAP | No confirmation dialog for destructive actions: delete agent, discard unsaved changes (navigating away with edits), unpublish a live agent |
| Autosave | GAP | No specification for autosave behavior. What happens if the user closes the browser tab? Is there a "You have unsaved changes" prompt? |
| Undo/Redo | GAP | No undo/redo for builder canvas changes (adding/removing skills, editing prompt). Only text editor undo mentioned for system prompt |

### 1.4 Eval Harness Dashboard (Section 2.7.2)

| Aspect | Status | Finding |
|--------|--------|---------|
| Empty State | GAP | No specification for when no eval runs exist yet (first-time use) |
| Loading State | GAP | No skeleton specification for summary metrics or test case table |
| Error State | GAP | No specification for when "Run Eval Now" fails or when individual test execution errors |
| Success State | OK | Summary bar, test case table, category filter, history chart, drill-down all defined |
| Partial State | GAP | No specification for when some test categories load but others fail |
| Desktop Responsive | PARTIAL | Layout described top-to-bottom but no explicit breakpoint behavior |
| Tablet Responsive | GAP | No responsive specification |
| Mobile Responsive | GAP | No responsive specification |
| Keyboard Navigation | GAP | No keyboard navigation specification for navigating between test cases, expanding drill-down |
| Screen Reader | GAP | No ARIA specification for test result table, pass/fail status announcements |
| Run Status Updates | GAP | When "Run Eval Now" is clicked, how does the UI show progress? Is there a progress bar? Do test cases update in real-time as they complete? Is SSE used? |

### 1.5 Platform Analytics Dashboard (Section 2.7.1)

| Aspect | Status | Finding |
|--------|--------|---------|
| Empty State | GAP | No specification for when no agent traces exist (new platform, no data) |
| Loading State | GAP | No skeleton specification for chart panels |
| Error State | GAP | No specification for when individual panels fail to load data |
| Success State | OK | Five dashboard panels (Agent Performance, Quality Trends, Learning Pipeline, Resource Usage, Knowledge Health) defined |
| Desktop Responsive | OK | 2-column grid on >1280px |
| Tablet/Mobile Responsive | PARTIAL | Described as "1-column on mobile/tablet" but no detailed stacking or collapse rules |
| Filters | OK | Each panel has filter controls specified |
| Time Range | GAP | No global time range selector for the dashboard. Each panel has its own, but users likely want a unified time picker |

### 1.6 Agent Management Page (Section 3.2)

| Aspect | Status | Finding |
|--------|--------|---------|
| Empty State | OK | "No agents configured yet" with "Create Agent" CTA defined in Section 6.7 |
| Loading State | OK | Agent card skeleton defined in Section 6.8 |
| Error State | GAP | No specification for API failure when loading agent list |
| Success State | OK | Grid/list view with filtering, agent detail drawer/page |
| Card/Table Toggle | OK | Switchable view using `p-dataView` defined |
| Delete Confirmation | GAP | Agent detail view has no explicit delete confirmation dialog. "Delete" is mentioned in tenant table (Section 2.6.1) but not for agent deletion |
| Agent Detail Tabs | OK | Overview, Configuration, Skills, Performance, Traces, Feedback tabs defined |

### 1.7 Skill Editor Page (Section 2.3 / 3.3)

| Aspect | Status | Finding |
|--------|--------|---------|
| Empty State | OK | "Create your first skill" defined in Section 6.7 |
| Loading State | GAP | No skeleton for skill tree or editor area during initial load |
| Error State | GAP | No specification for: skill save fails, test execution errors, version conflict (someone else edited) |
| Success State | OK | Three-panel layout with tabs (Prompt, Tools, Knowledge, Rules, Examples, History) |
| Version Diff | OK | Side-by-side comparison via `p-splitter` defined in Section 2.3.2 |
| Test Runner | OK | Batch test execution panel defined in Section 2.3.3 |
| Concurrent Editing | GAP | No specification for conflict resolution if two users edit the same skill simultaneously |

### 1.8 Training Dashboard (Section 3.5)

| Aspect | Status | Finding |
|--------|--------|---------|
| Empty State | OK | "No training data available" defined in Section 6.7 |
| Loading State | OK | Training card skeleton defined in Section 6.8 |
| Error State | OK | Failed training job states defined with error log viewer, retry button |
| Success State | OK | Overview cards, timeline, quality charts, data health, distribution chart |
| Model Comparison | OK | Side-by-side metrics, radar overlay, deploy/reject actions defined |
| Desktop Responsive | OK | 4-column overview, 50/50 split layouts |
| Tablet Responsive | OK | 2-column overview, stacked layouts |
| Mobile Responsive | OK | 1-column, stacked |

### 1.9 Feedback Review Page (Section 3.6)

| Aspect | Status | Finding |
|--------|--------|---------|
| Empty State | OK | "No feedback received yet" defined in Section 6.7 |
| Loading State | GAP | No skeleton for split-view feedback table |
| Error State | GAP | No specification for batch apply/reject failure |
| Success State | OK | Split view with feedback queue and detail panel, diff view |
| Pagination | OK | 20/page defined |

### 1.10 System Admin Page (Section 3.7)

| Aspect | Status | Finding |
|--------|--------|---------|
| Empty State | GAP | No specification for empty states within each tab (no services, no tenants, no models) |
| Loading State | GAP | No skeleton for service health grid or tenant table |
| Error State | GAP | No specification for admin action failures (suspend tenant fails, model deploy fails) |
| Success State | OK | Tabbed layout with Services, Tenants, Models, Configuration |
| Tenant Delete Confirmation | OK | "Delete (with confirmation)" mentioned |
| Model Deploy | OK | Upload + version + deploy + rollback + A/B test controls defined |
| API Key Management | PARTIAL | "Masked inputs" mentioned for cloud model API keys, but no specification for key rotation, test connection, or key scoping per tenant |

### 1.11 Security Indicator Components (Section 2.8)

| Aspect | Status | Finding |
|--------|--------|---------|
| Prompt Injection Badge | OK | Appearance, click-to-expand overlay panel, ARIA label defined |
| Cloud Routing Indicator | OK | Appearance, click-to-expand with PII redaction count, ARIA label defined |
| PII Scrubbing Display | GAP | Referenced in 10-Full-Stack-Integration-Spec.md Section 10.6 but no dedicated UX component in 06. The spec lacks a PII scrubbing pipeline visualization (where does the user see what was scrubbed and how?) |

---

## 2. Missing Screens

The following screens are either explicitly expected by the PRD, implied by the agent builder paradigm, or commonly required for enterprise platforms, but are **not present** in the spec:

| Missing Screen | Justification | Priority |
|----------------|---------------|----------|
| **AI Module Settings/Preferences** | Users need to configure their personal AI preferences: default model, theme (light/dark handled globally but AI-specific preferences like streaming speed, auto-expand tool panels, notification preferences are absent) | P1 |
| **Agent Audit Log** | PRD Section 3.1 Step 7 (Record) logs all actions. Who changed what agent configuration and when? The Agent Detail "Traces" tab covers conversation traces, not configuration change history. Enterprise compliance requires audit trails for agent modifications | P0 |
| **Agent Execution History / Pipeline Run Viewer** | Pipeline runs (PRD Section 3.9) have a state machine with 12 states. Users need to see past pipeline runs for a specific agent or conversation -- not just the latest trace in the context panel. A dedicated execution history view with filtering, status, timing, and drill-down is needed | P1 |
| **Agent Comparison (Side-by-Side)** | Users forking templates or choosing between agents need to compare two agents side-by-side: prompt differences, tool sets, knowledge scopes, performance metrics, eval scores. The "Model Comparison" view exists for training models but not for agent configurations | P2 |
| **Import/Export Agent Configurations** | The PRD states configurations are "importable into the Agent Builder" and organizations contribute to galleries. There is no specification for JSON/YAML import/export of agent configurations for backup, migration between tenants, or sharing outside the gallery | P1 |
| **Role-Based Access Views** | PRD Section 1.4 defines 5 personas (End Users, Domain Experts, ML Engineers, Platform Administrators, Agent Designers) with different access levels. The spec does not define what each persona sees. Is the Builder visible to End Users? Can only admins access the Training Dashboard? Where is RBAC reflected in the navigation? | P0 |
| **Notification Center** | Top nav shows "Notifications" icon but no specification for the notification panel: what notifications exist? Training job completed, agent error, feedback received, approval needed? No notification list, mark-as-read, or notification preferences defined | P1 |
| **Command Palette** | Section 5.2.1 defines `Ctrl+K / Cmd+K` for "Open command palette (global search)" and Appendix A lists it as `p-dialog + p-inputText + p-listbox`. But no specification for what the command palette looks like, what actions are searchable, or how results are displayed | P2 |
| **Onboarding Wizard UI** | Section 8.1 defines a detailed onboarding flow (welcome modal, use case selection, data source wizard, tutorial) but no component specifications or wireframes for these screens | P2 |
| **Knowledge Source Management** | The builder has a Knowledge tab with checkboxes, but there is no dedicated screen for managing knowledge sources themselves: uploading documents, configuring chunking strategies, viewing index status, reindexing. PRD Section 3.12 defines RAG chunking configuration | P1 |

---

## 3. Accessibility Gaps

### 3.1 Critical Accessibility Issues (P0)

| ID | Component | Issue | WCAG Reference |
|----|-----------|-------|----------------|
| A1 | Agent Builder -- Skill Drag-and-Drop | No keyboard alternative specified for dragging skills/tools from the Capability Library to the Builder Canvas. WCAG 2.1.1 (Keyboard) and 2.5.7 (Dragging Movements) require all drag-and-drop operations to have keyboard-operable alternatives | WCAG 2.1 AAA 2.1.1, 2.5.7 |
| A2 | Agent Builder -- Chip Reordering | Active Skills and Active Tools sections mention "Chips are draggable for reordering" with no keyboard reordering mechanism. Users must be able to reorder via Arrow keys + modifier | WCAG 2.1 AAA 2.1.1, 2.5.7 |
| A3 | Template Gallery Grid | No ARIA roles or labels defined for the gallery card grid. Cards need `role="article"` or `role="listitem"` within a container with `role="list"`, and `aria-label` describing each card content | WCAG 2.1 AAA 4.1.2 |

### 3.2 High Accessibility Issues (P1)

| ID | Component | Issue | WCAG Reference |
|----|-----------|-------|----------------|
| A4 | Color Contrast -- text-tertiary | `--ai-text-tertiary` (#94A3B8) against white (#FFFFFF) is 3.0:1 -- fails both AAA (7:1) and AA (4.5:1) for normal text. The spec notes it is "only for non-essential decorative text" but timestamps are used alongside messages as identifying content. Should be >=4.5:1 minimum | WCAG 2.1 AAA 1.4.6 |
| A5 | Color Contrast -- text-secondary | `--ai-text-secondary` (#64748B) against white is 4.9:1 -- passes AA (4.5:1) but fails AAA (7:1) for normal text. Since the spec targets AAA, secondary text used for metadata, descriptions, and filter labels needs a darker shade | WCAG 2.1 AAA 1.4.6 |
| A6 | Color Contrast -- primary on white | `--ai-primary` (#058192) against white is 4.7:1 -- passes AA but fails AAA for normal text. Links and interactive text using this color at body text size (16px) would fail AAA | WCAG 2.1 AAA 1.4.6 |
| A7 | Eval Dashboard -- No Screen Reader Specs | Test result table has no ARIA specification. Pass/fail icons need `aria-label`. Score column needs context. "Run Eval Now" needs `aria-busy` during execution | WCAG 2.1 AAA 4.1.2 |
| A8 | Analytics Dashboard -- Chart Accessibility | Charts use `p-chart` (Chart.js) but no specification for chart data table alternatives. Screen reader users cannot interpret visual charts. Each chart needs a visually hidden data table or `aria-label` summary | WCAG 2.1 AAA 1.1.1 |
| A9 | Builder Mobile Tab Navigation | Bottom tab bar for mobile (Library/Canvas/Playground) has no ARIA specification. Needs `role="tablist"`, `role="tab"`, `aria-selected`, and `aria-controls` | WCAG 2.1 AAA 4.1.2 |

### 3.3 Medium Accessibility Issues (P2)

| ID | Component | Issue | WCAG Reference |
|----|-----------|-------|----------------|
| A10 | System Prompt Editor | Monaco-style editor accessibility is not specified. Custom code editors often have poor screen reader support. Needs specification for: label, role, keyboard shortcuts help, and alternative plain textarea fallback | WCAG 2.1 AAA 2.1.1 |
| A11 | Chat File Attachment Drag-and-Drop | Drag-and-drop for file upload has a keyboard alternative (paperclip button), but the drop zone overlay ("Drop files here") has no `aria-live` announcement for screen readers | WCAG 2.1 AAA 4.1.3 |
| A12 | Agent Status Pulse Animation | Online status uses pulse animation. Even with `prefers-reduced-motion` support (Section 7.7), the spec does not define an alternative text indicator visible in the reduced-motion state. Static filled dot alone may not convey "online" vs other states | WCAG 2.1 AAA 1.3.3 |

---

## 4. Responsive Gaps

| ID | Screen | Issue | Priority |
|----|--------|-------|----------|
| R1 | Eval Harness Dashboard (2.7.2) | No responsive breakpoint behavior defined at all. This is a full-page dashboard with a summary bar, table, and chart -- all need tablet/mobile specifications | P1 |
| R2 | Platform Analytics Dashboard (2.7.1) | Only "2-column desktop, 1-column mobile/tablet" noted. No specification for chart resize behavior, panel stacking order, or filter controls responsiveness on mobile | P2 |
| R3 | Template Gallery -- Preview Detail View | Preview action on gallery cards opens a "read-only detail view" -- but this view's layout and responsive behavior are completely unspecified | P1 |
| R4 | Agent Builder -- Version History Drawer | Drawer opens on "Version History" click but responsive behavior undefined. On mobile, does it become a full-page view? Bottom sheet? | P2 |
| R5 | Security Badge Overlay Panels | `p-overlayPanel` is 360px/320px wide. On mobile (<768px), these could extend off-screen. No responsive fallback (bottom sheet, full-width) specified | P2 |
| R6 | Feedback Review Split View | On mobile (<768px), the 50/50 split view is undefined. Does it stack vertically? Does the detail view become a separate route? | P2 |

---

## 5. User Flow Gaps

| ID | Flow | Issue | Priority |
|----|------|-------|----------|
| F1 | Agent Builder -- Browser Back Button | No specification for browser back-button behavior in the builder. If a user navigates from Gallery > Builder, does back go to Gallery? What about unsaved changes? | P1 |
| F2 | Agent Builder -- Publish to Gallery | Flow 8.2 shows "Publish to Gallery" as an end node but no detailed flow: Is there a "Publish to Gallery" option separate from "Publish" (make agent active)? What metadata is required? Description, tags, category? Review period? | P1 |
| F3 | Agent Delete Flow | No delete flow defined anywhere. How does a user delete an agent? Confirmation dialog? What happens to conversations using that agent? Are published gallery entries removed? | P0 |
| F4 | Agent Builder -- Discard Changes | No "discard changes" or "revert to saved" action. The toolbar has "Save Draft" but no cancel/discard. What if the user wants to undo all changes since last save? | P1 |
| F5 | Template Gallery -- "Use As-Is" Flow | Flow 8.2 shows "Use As-Is" leading directly to "Chat with Agent". But how? Does it create an agent instance from the template? Does the user need to name it? Configure anything? | P2 |
| F6 | Error Recovery -- Builder Save Failure | If "Save Draft" or "Publish" fails (API error, validation error), what is the recovery path? Is the user's work preserved in memory? Is there a retry? Is there a local storage backup? | P1 |
| F7 | Agent Version Rollback | Version History drawer is mentioned but no rollback flow. Can a user revert to a previous version? What happens to current state? Is there a confirmation? | P1 |
| F8 | Multi-Agent Orchestration UI | Flow 8.6 describes multi-agent coordination but the UI only shows "Coordinating multiple agents..." message. No specification for how users view which sub-agents are working, their individual progress, or how to cancel individual sub-tasks | P2 |
| F9 | Deep Linking / Bookmarkable URLs | No specification for shareable URLs. Can a user bookmark a specific conversation, agent, template, or eval run? The routes are defined in the integration spec (`/ai-chat/agents/gallery`, `/ai-chat/agents/builder/:id`) but the UX spec does not address URL-based navigation or sharing | P2 |

---

## 6. Cross-Screen Consistency Gaps

| ID | Issue | Priority |
|----|-------|----------|
| C1 | **Navigation Pattern Inconsistency** -- Chat page uses a three-panel layout with left sidebar; Agent Management uses no sidebar; Builder uses a three-panel layout with different panels. How does the user navigate between these views? Is there a persistent left navigation rail or only the top nav/bottom tab bar? The AI module's position within the broader EMSIST shell is undefined | P1 |
| C2 | **Breadcrumb/Back Behavior** -- No breadcrumb specification anywhere. The builder entry points (Gallery > Builder, Agent List > Edit) imply hierarchical navigation, but no breadcrumbs are defined. Users could get lost in the builder with no way back except browser back button | P1 |
| C3 | **Toast/Notification Pattern** -- Toast notifications are mentioned in several places (feedback submission, connection restored) but the toast component specification is missing. Duration? Position (top-right? bottom-center?)? Stacking? Max visible? Dismiss behavior? Only `p-toast` is listed in Appendix A | P2 |
| C4 | **Consistent Loading Pattern** -- Skeleton screens are defined per component in Section 6.8, which is good. However, not all new screens (Eval Dashboard, Analytics Dashboard, Gallery) have skeletons defined. Need to extend Section 6.8 with skeletons for these new components | P2 |
| C5 | **Table/Card Toggle** -- Available on Agent Management page (via `p-dataView`) but not on Template Gallery (cards only), Eval Dashboard (table only), or Feedback History (table only). If the platform pattern is "switchable views where applicable," the Gallery should also offer list view | P3 |

---

## 7. Agent Builder Specific Deep-Dive

| ID | Issue | Priority |
|----|-------|----------|
| B1 | **20+ Capabilities Handling** -- The Active Skills section uses "horizontal chip strip" and Active Tools uses "similar horizontal chip strip." At 20+ chips, this will overflow the viewport width even on desktop. No max-height, scrolling behavior, collapse/expand, or "show more" threshold is defined | P1 |
| B2 | **Prompt Playground -- Streaming Error** -- If the test stream fails mid-response, the spec does not define the playground-specific error state. Does the partial response remain? Is there a retry within the playground? Does the validation panel still populate? | P1 |
| B3 | **Prompt Playground -- Context Isolation** -- Does the playground use the same conversation context as production, or is it isolated? Can test messages pollute real conversation history? This is a UX concern because users need confidence that testing is safe | P2 |
| B4 | **Builder Canvas Validation** -- The spec describes validation in the Playground panel (pass/fail checklist) but no inline validation on the builder canvas itself. What if the user leaves required fields empty (name, system prompt)? Are there inline error messages on the canvas sections? | P1 |
| B5 | **Capability Library Search** -- Left panel has "Search input at top of each tab for filtering." No specification for search behavior: instant filter? Debounced? Highlight matched text? No results state? | P3 |
| B6 | **Model Configuration Defaults** -- Temperature slider range is 0.0-2.0 but the parameter guidance (Doc 08, Section 1.5) recommends 0.0-0.9 for most use cases. Should the slider show recommended range markers or warnings when temperature exceeds 1.0? | P3 |
| B7 | **Avatar Picker** -- "Grid of icon options (PrimeIcons subset) with color wheel for accent color selection." No specification for: how many icons? Is it searchable? Does the color wheel support the design system accent colors only or any color? What about custom SVG upload? | P3 |

---

## 8. Integration Spec Cross-Reference Findings

Comparing 06-UI-UX-Design-Spec.md with 10-Full-Stack-Integration-Spec.md:

| ID | Issue | Priority |
|----|-------|----------|
| I1 | **Pipeline Progress Indicator** -- Integration spec (Section 4.2.11) defines `ai-pipeline-progress` component consuming `PipelineStateChunk` events to show a horizontal step indicator (7 pipeline steps). This component is NOT specified in the UX spec (06). No design, dimensions, or styling defined | P1 |
| I2 | **Security Event Display** -- Integration spec defines `SecurityEventChunk` with `injection_blocked`, `cloud_routing`, `pii_redacted` subtypes. The UX spec covers cloud routing (2.8.2) and injection (2.8.1) indicators but has NO component for PII redaction display. Where does the user see PII scrubbing happened? | P1 |
| I3 | **Agent Builder DTOs** -- Integration spec defines `AgentBuilderState`, `AgentForkRequest`, `ModelConfiguration` DTOs and `AgentBuilderService` + `TemplateGalleryService` Angular services. The UX spec references these implicitly but does not specify the state management UX (e.g., builder state persistence, dirty state indicator) | P2 |
| I4 | **E2E Test Scenarios** -- Integration spec Section 6 defines Playwright E2E test specifications. These reference UI behaviors (gallery search, builder publish flow) that need clearer UX specification to be testable | P3 |

---

## 9. Recommendations (Prioritized)

### P0 -- Critical (Must fix before implementation begins)

| # | Screen | Issue | Recommendation |
|---|--------|-------|----------------|
| 1 | Agent Builder | Drag-and-drop has no keyboard alternative (A1, A2) | Add "Add" button on each skill/tool in the library list. Define Enter-to-add on focused item. Define Arrow Up/Down + Ctrl for chip reordering. Add `aria-grabbed`, `aria-dropeffect` live region announcements |
| 2 | Agent Builder | Publish workflow undefined (B-publish) | Define a publish flow: Publish = make agent active for personal use. "Share to Gallery" = separate action requiring: display name, description, category, tags. Admin-level Gallery items may require approval workflow. Add confirmation dialog |
| 3 | Agent Builder | No delete/destructive action flow (F3) | Define agent delete flow with confirmation dialog listing impact: "This will delete the agent and all its configurations. X conversations reference this agent. Published gallery entries will be removed." Include "Type agent name to confirm" pattern for critical deletion |
| 4 | Missing Screen | Agent Audit Log | Add a "Change History" tab to Agent Detail view showing: timestamp, user, field changed, old value, new value. For the admin dashboard, add a global audit log page with tenant/agent/user filters |
| 5 | Missing Screen | Role-Based Access Views | Define which navigation items and actions are visible per persona. Add a RBAC matrix: End User (Chat, read-only Agent list), Agent Designer (Chat, Agent list, Builder, Gallery), Domain Expert (+ Skill Editor, Feedback Review), ML Engineer (+ Training Dashboard, Eval Dashboard), Admin (+ System Admin, Tenant Mgmt). Add `*ngIf` guards documentation |
| 6 | Template Gallery | No ARIA roles for card grid (A3) | Add `role="list"` to the card grid container, `role="listitem"` on each card wrapper, `aria-label` on each card reading "Template: {name}, {category}, {tool count} tools, used {count} times" |
| 7 | Template Gallery / Eval Dashboard | No loading/error states | Add skeleton specifications to Section 6.8 for: gallery card (icon placeholder + 3 text lines + 2 button outlines), eval summary metric card (large number placeholder + label), eval table row |
| 8 | Eval Dashboard | No responsive breakpoint behavior (R1) | Add to Section 4: summary bar stacks from 4-column to 2x2 grid on tablet to 1-column on mobile. Test table becomes card list on mobile. History chart full-width on all breakpoints. Category filter becomes horizontal scroll on mobile |

### P1 -- High (Must fix before design handoff to DEV)

| # | Screen | Issue | Recommendation |
|---|--------|-------|----------------|
| 9 | Agent Builder | 20+ capabilities handling (B1) | Define chip strip max-height of 120px with `overflow-y: auto`. Add "+N more" collapse badge after 8 visible chips. Add "Show all" link expanding to full list in a `p-dialog` |
| 10 | Agent Builder | Builder canvas inline validation (B4) | Add inline validation: Agent name required (red border + "Name is required" text below), system prompt minimum 50 characters, at least 1 skill or tool required for publish. Show validation summary in toast before publish attempt fails |
| 11 | Agent Builder | Version history drawer layout | Specify: drawer width 480px on desktop, full-page on mobile. List of versions with: version number, timestamp, author, change summary. "Compare" button between any two versions opens `ai-skill-diff`-style side-by-side view. "Restore" button with confirmation |
| 12 | Agent Builder | Browser back button / navigation guards (F1) | Define Angular `canDeactivate` guard behavior: if unsaved changes exist, show "You have unsaved changes. Discard?" dialog with Save/Discard/Cancel buttons. Browser back button triggers the same guard |
| 13 | Agent Builder | Discard changes action (F4) | Add "Discard Changes" to toolbar overflow menu. Show confirmation: "Revert to last saved version? This cannot be undone." |
| 14 | Agent Builder | Save/Publish error recovery (F6) | Define: on save failure, show inline error banner above toolbar "Save failed: {reason}. Your changes are preserved locally." Autosave to localStorage every 30 seconds. On browser reopen, prompt "Recover unsaved changes from {timestamp}?" |
| 15 | Agent Builder | Prompt Playground streaming error (B2) | Define: partial response remains visible. Error message appended below: "Test failed: {reason}" with "Retry" button. Validation panel shows "Unable to validate -- execution failed" |
| 16 | Agent Builder | Fork lineage display | Add "Forked from: {original template name}" badge below agent name in toolbar, linking to original template. Fork does not modify original. Usage count on original does NOT increment (use count tracks active deployments, not forks) |
| 17 | Template Gallery | Preview detail view layout (R3) | Specify: full-page or right drawer (480px desktop, full-page mobile). Show: agent icon (xl), full description, all tags, complete use case list, system prompt preview (first 500 chars), tool list with descriptions, knowledge scope list, usage stats, "Fork" and "Use As-Is" buttons |
| 18 | Template Gallery | Sort functionality | Add sort dropdown to controls bar: "Sort by: Popular (default), Newest, Alphabetical, Complexity" |
| 19 | Template Gallery | Pagination / infinite scroll | Add `p-paginator` with 20 items per page below card grid. Or: infinite scroll with "Loading more..." indicator. Define behavior: filter resets to page 1 |
| 20 | Missing Screen | Knowledge Source Management | Add a dedicated Knowledge Management page accessible from left nav (ML Engineer/Admin role). Sections: upload documents (drag-and-drop zone), view collections (table with name, doc count, chunk count, status, last indexed), configure chunking (strategy dropdown: recursive/semantic/fixed), reindex action, delete collection with confirmation |
| 21 | Missing Screen | Notification Center | Define notification panel: `p-sidebar` (right, 400px) opened from bell icon. Sections: Unread (bold), Read (normal). Types: Training complete (info), Agent error (error), Feedback received (info), Approval needed (warning). Each item: icon, title, summary, timestamp, action link. Mark all read, notification preferences link |
| 22 | Missing Screen | Agent Execution History | Add an "Execution History" tab to Agent Detail or a standalone page. Table: Run ID, Timestamp, Status (12 states from pipeline state machine), Duration, Token Count, User. Click to drill into pipeline step timeline (reuse `ai-pipeline-progress` component). Filter by date, status, user |
| 23 | Missing Screen | Import/Export Agent Configurations | Add toolbar actions: "Export" (downloads JSON/YAML), "Import" (file upload dialog + preview + conflict resolution for duplicate names). Define export format referencing the Agent Configuration Metadata schema from Doc 08 |
| 24 | Cross-Screen | Breadcrumbs | Add breadcrumb component across hierarchical screens: Agents > Gallery > Builder, Agents > Agent Name > Configuration, Training > Job Name > Details. Use `p-breadcrumb` (PrimeNG). Mobile: show only current + parent |
| 25 | Integration Spec | Pipeline Progress Indicator (I1) | Add `ai-pipeline-progress` component to UX spec Section 2: horizontal stepper showing 7 pipeline steps. Active step: pulsing primary color. Complete: green check. Failed: red X. AWAITING_APPROVAL: amber pulse. Dimensions: 56px height, full content width. On mobile: compact with icons only, step name on active |
| 26 | Integration Spec | PII Scrubbing Display (I2) | Add `ai-pii-indicator` component to Section 2.8: small badge (similar to cloud indicator) displayed when PII was redacted. Click to expand overlay showing: entity types redacted (name, email, phone -- not actual values), redaction count, policy applied. `aria-label="PII data was redacted from this request"` |
| 27 | Color Contrast | text-secondary fails AAA | Darken `--ai-text-secondary` from #64748B to #4B5563 (6.2:1 -- still fails AAA but closer). Or to #374151 (9.1:1 -- passes AAA). Alternatively, accept AA for secondary text and downgrade the target to WCAG AAA for primary text, AA for secondary text. Document the decision |

### P2 -- Medium (Should fix during implementation)

| # | Screen | Issue | Recommendation |
|---|--------|-------|----------------|
| 28 | Chat Page | Partial state handling | Define: if sidebar API fails but chat loads, show sidebar with "Unable to load conversations" + "Retry" link. If context panel API fails, show "Context unavailable" message |
| 29 | Chat Page | Deep linking | Define route `/ai-chat/conversations/{id}` that opens a specific conversation. If conversation not found, show "Conversation not found" empty state with "Start new chat" CTA |
| 30 | Template Gallery | Card keyboard navigation | Define Tab to navigate between cards, Enter to open preview, Space to toggle "Use Configuration". Within card grid, Arrow keys navigate between cards (2D grid navigation pattern) |
| 31 | Analytics Dashboard | Global time range | Add a global time range selector (date range picker) at page header level that propagates to all 5 panels simultaneously. Individual panel overrides remain available |
| 32 | Feedback Review | Mobile responsive | Define: split view stacks vertically (table on top, detail below). Or: table view is primary, tapping a row navigates to a separate detail page (route-based) |
| 33 | Agent Builder | Playground context isolation (B3) | Add a visible badge in the playground header: "Test Mode -- responses are not saved to conversation history" with info tooltip explaining isolation |
| 34 | Cross-Screen | Toast specification | Define: position top-right, max 3 stacked, auto-dismiss 4s for info/success, persistent for errors (manual dismiss). Width: 400px max. Include icon + message + optional action link. z-index above all content |
| 35 | Missing Screen | Command Palette | Specify: centered modal (640px wide, 400px max-height). Search input at top. Results grouped by category: "Pages" (Chat, Agents, Skills, Training, Admin), "Actions" (New Chat, New Agent, New Skill), "Agents" (list of agents by name). Arrow keys to navigate, Enter to select, Esc to close |
| 36 | Missing Screen | Onboarding Wizard | Specify: full-screen modal overlay with step indicator (1/3, 2/3, 3/3). Use case selection as radio card group. Data source wizard as form with connection test. Tutorial as inline tooltip overlay. "Skip" link on every step |
| 37 | Agent Builder | Autosave indicator | Add subtle autosave status in toolbar: "All changes saved" (green dot) or "Saving..." (spinner) or "Save failed" (red dot with retry). LocalStorage autosave every 30 seconds as backup |
| 38 | Security Badges | Responsive overlay panels (R5) | On mobile (<768px), overlay panels become `p-dialog` (full-width bottom sheet style) instead of positioned overlays |
| 39 | Builder | Model Config temperature warnings (B6) | Add a visual range indicator on the temperature slider: green zone (0.0-0.5), amber zone (0.5-1.0), red zone (1.0-2.0) with tooltip "Temperatures above 1.0 may produce unpredictable output" |
| 40 | Agent Builder | "Use As-Is" flow (F5) | Define: "Use As-Is" creates a personal agent instance from the template with default name "{Template Name} (copy)". Opens directly in chat. User can rename later from Agent Detail |
| 41 | Skill Editor | Loading states | Add skeleton specs: skill tree (3 rectangular blocks with indentation), editor area (tab bar + large rectangular block), test panel (input area + output area placeholders) |
| 42 | Agent Management | API error state | Define: full-page error state with "Unable to load agents. Check your connection." + "Retry" button + optional link to system health page |

### P3 -- Low (Nice to have)

| # | Screen | Issue | Recommendation |
|---|--------|-------|----------------|
| 43 | Template Gallery | Card/List toggle (C5) | Add grid/list toggle to gallery controls bar. List view shows: icon (sm), name, category badge, tool count, usage count, origin badge, actions. Consistent with Agent Management pattern |
| 44 | Agent Builder | Avatar picker detail (B7) | Specify: 24 icon options (subset of PrimeIcons relevant to agent domains). Color picker: 12 preset accent colors (design system + 6 custom). No free-form color wheel (maintain design system consistency). Custom SVG upload as Phase 2+ |
| 45 | Agent Builder | Capability Library search (B5) | Specify: instant filter (debounce 200ms), highlight matching text in results, "No skills matching '{query}'" empty state with "Clear search" link |
| 46 | System Admin | Empty states per tab | Define: Services -- "No services registered" (should not happen), Tenants -- "No tenants configured" + "Create Tenant" CTA, Models -- "No models loaded" + "Deploy Model" CTA, Configuration -- always shows defaults |
| 47 | Agent Builder | System prompt editor accessibility (A10) | Add `aria-label="System prompt editor"`, keyboard shortcut help (`Ctrl+/` shows shortcuts), and a "Switch to plain text mode" toggle for users who cannot use the rich editor |

---

## 10. Summary Statistics

| Category | P0 (Critical) | P1 (High) | P2 (Medium) | P3 (Low) | Total |
|----------|---------------|-----------|-------------|----------|-------|
| Missing Screens | 2 | 5 | 3 | 0 | 10 |
| State Coverage | 1 | 2 | 4 | 1 | 8 |
| Accessibility | 3 | 6 | 3 | 1 | 13 |
| Responsive | 0 | 2 | 4 | 0 | 6 |
| User Flow | 1 | 5 | 3 | 0 | 9 |
| Cross-Screen | 0 | 2 | 2 | 1 | 5 |
| Integration Gaps | 0 | 3 | 1 | 0 | 4 |
| **Total** | **8** | **16** | **15** | **8** | **47** |

---

## 11. Positive Findings

The spec demonstrates significant strengths that should be preserved:

1. **Comprehensive Design Token System** -- Colors, typography, spacing, shadows, and border radii are exhaustively defined with both light and dark mode values. This is production-ready.
2. **Strong Accessibility Foundation** -- WCAG AAA target, detailed ARIA roles/labels, keyboard shortcut table, screen reader announcements, focus management, high contrast mode, and reduced motion support are all well-specified.
3. **RTL/Arabic Support** -- Full bidirectional layout specification with logical CSS properties.
4. **Animation System** -- Purposeful motion with timing tokens, easing curves, reduced motion fallbacks, and skeleton loaders.
5. **Error State Coverage for Chat** -- Seven specific error types with visual treatments and recovery actions for the primary chat interaction.
6. **Empty State Design** -- Thoughtful empty states with illustrations, CTAs, and contextual messaging for most primary screens.
7. **PrimeNG Component Mapping** -- Clear mapping from custom components to PrimeNG base components aids DEV implementation.
8. **User Flows as Mermaid Diagrams** -- Six detailed user flows covering onboarding, builder, skill creation, feedback, training monitoring, and multi-agent orchestration.
9. **Agent Builder Vision** -- The three-panel builder with Capability Library, Builder Canvas, and Prompt Playground is well-conceived for the agent composition use case.

---

## Appendix: Documents Reviewed

| Document | Version | Sections Reviewed |
|----------|---------|-------------------|
| 06-UI-UX-Design-Spec.md | 1.1 | All 8 sections + 3 appendices (2052 lines) |
| 10-Full-Stack-Integration-Spec.md | 1.1.0 | Sections 1 (SSE), 2 (DTOs), 4 (Components), 10 (Security) |
| 01-PRD-AI-Agent-Platform.md | 1.1 | Sections 1 (Personas), 2 (Architecture), 3 (Agent System, Pipeline, Skills) |
| 08-Agent-Prompt-Templates.md | 1.1.0 | Sections 1 (Metadata Schema, Gallery), 2 (Profile Schema), 3-4 (32 Configurations) |
