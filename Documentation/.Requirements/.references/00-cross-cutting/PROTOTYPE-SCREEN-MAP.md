# EMSIST Prototype Screen Map

**Generated:** 2026-03-13
**Source Files:** 6 prototype HTML files

> Reference-only note:
> R02 and master-license entries in this prototype inventory are historical prototype mappings.
> The current source of truth for R02 screens, journeys, touchpoints, and variants is the normalized package under `../../R02. TENANT MANAGEMENT/R02.01 Business Requirements/`.

---

## Prototype 1: Main App Shell (`Documentation/prototypes/index.html`)

~1974 lines. Full administration platform prototype with login, tenant management, license management, agent manager, definition manager, release dashboard, and embedded chat.

### Screens

| Screen ID | Screen Name | Type | Parent | Navigation Path | States |
|-----------|-------------|------|--------|-----------------|--------|
| `login-view` | Login Page | Page | Root | Direct URL | signin-section (initial), signin-card-stage (form shown), error-banner |
| `app-shell` | App Shell (Admin) | Shell | Root | After login | Hidden until authenticated |
| `user-landing` | User Landing Page | Page | app-shell | Role=user/viewer | Welcome, cards for Chat/Recent/Agents |
| `section-tenant-manager` | Tenant Manager | Section | app-shell | Dock > Tenant Manager | Populated, Loading, Empty |
| `tenant-list-view` | Tenant List (Cards) | Sub-view | section-tenant-manager | Default populated view | 3 tenant cards |
| `tenant-factsheet` | Tenant Factsheet | Factsheet | section-tenant-manager | Tenant card > View | Tabbed: Overview, Users, Branding, Licenses |
| `user-factsheet` | User Factsheet | Factsheet | tenant-factsheet > Users tab | User table > View | User detail info |
| `license-factsheet` | License Factsheet (Tenant context) | Factsheet | tenant-factsheet > Licenses tab | License row > View | License detail info |
| `section-license-manager` | License Manager | Section | app-shell | Dock > License Manager | Populated, Loading, Empty |
| `license-mgr-list-view` | License List | Sub-view | section-license-manager | Default view | Table view (default), Grid view |
| `license-mgr-factsheet` | License Factsheet (standalone) | Factsheet | section-license-manager | License row > View | License detail with Renew/Add Seats/Revoke |
| `section-agent-manager` | Agent Manager | Section | app-shell | Dock > Agent Manager | Populated, Loading, Empty |
| `am-insights` | Agent Insights Dashboard | Panel | section-agent-manager | AM sidebar > Insights | KPIs, charts, ATS dimensions, maturity grid, activity feed |
| `am-agent-list` | Agent List | Panel | section-agent-manager | AM sidebar > Agent List | Card grid with filter chips |
| `agent-factsheet` | Agent Factsheet | Factsheet | am-agent-list | Agent card > View | Tabbed: Overview, Configuration, Skills, Tools, Training, Performance, History |
| `am-skills` | Skills Registry | Panel | section-agent-manager | AM sidebar > Skills | Skills list with factsheet |
| `am-tools` | Tools Registry | Panel | section-agent-manager | AM sidebar > Tools | Tools list with factsheet |
| `am-templates` | Templates Gallery | Panel | section-agent-manager | AM sidebar > Templates | Template cards with factsheet |
| `am-governance` | Governance | Panel | section-agent-manager | AM sidebar > Governance | Tabbed: Audit Log, Compliance, Approvals, Policies |
| `am-triggers` | Event Triggers | Panel | section-agent-manager | AM sidebar > Triggers | Trigger list with factsheet (tabs: Configuration, Conditions, Execution History) |
| `am-settings` | Agent Manager Settings | Panel | section-agent-manager | AM sidebar > Settings | Tabbed: General, Notifications, Integrations |
| `section-fullpage-chat` | Full-Page Chat | Section | app-shell | Agent card > Chat / Landing > Start Chat | Chat with agent selector, messages, input |
| `section-def-manager` | Definition Manager (Object Types) | Section | app-shell | Dock > Definition Manager | Populated, Loading, Empty |
| `detail-overlay` | Object Type Detail Panel | Overlay | section-def-manager | Object type row click | Tabbed: General, Attributes, Connections, Governance, Maturity, Localization, Measures |
| `wizard-overlay` | Create Object Type Wizard | Dialog | section-def-manager | FAB (+) button | 4 steps: Basic Info, Attributes, Connections, Review |
| `section-release-dashboard` | Release Dashboard | Section | app-shell | Dock > Release Dashboard | Split layout: release list + release detail |
| `chatbot-panel` | Chatbot Mini Panel (FAB) | Floating panel | app-shell | Chatbot FAB button | Mini chat overlay, agent selector, pop-out |

### Dialogs & Modals

| Dialog ID | Trigger | Context Screen | Purpose |
|-----------|---------|----------------|---------|
| `confirm-retire` | Retire action on attribute | detail-overlay > Attributes tab | Confirm single attribute retirement |
| `confirm-bulk-retire` | Bulk retire button | detail-overlay > Attributes tab | Confirm bulk attribute retirement |
| `confirm-delete` | Delete button on object type | detail-overlay footer | Confirm object type deletion |
| `notification-dropdown` | Bell icon click | app-shell header | Show 5 notification items with mark-all-read |
| `chatbot-panel` | Chatbot FAB click | app-shell (any section) | Mini floating chat panel |

### Navigation Structure

**Primary Dock (Sidebar):**
- Tenant Manager (`data-section="tenant-manager"`) -- Roles: platform-admin
- Agent Manager (`data-section="agent-manager"`) -- Roles: platform-admin, tenant-admin, agent-designer, viewer
- License Manager (`data-section="license-manager"`) -- Roles: platform-admin
- Definition Manager (`data-section="def-manager"`) -- Roles: platform-admin, tenant-admin
- Release Dashboard (`data-section="release-dashboard"`) -- Roles: platform-admin, tenant-admin

**Agent Manager Sub-Navigation (am-sidemenu):**
- Insights
- Agent List
- Skills
- Tools
- Templates
- Governance
- Triggers
- Settings

**Header Actions:**
- Notification bell (dropdown)
- Help button
- Persona badge (role switcher)
- Sign out

### Transitions

| From | To | Trigger | Type |
|------|-----|---------|------|
| login-view | app-shell | Form submit (Sign In) | View swap |
| app-shell | login-view | Sign out button | View swap |
| tenant-list-view | tenant-factsheet | View button on card | Factsheet slide |
| tenant-factsheet (Users tab) | user-factsheet | View button on user row | Nested factsheet |
| tenant-factsheet (Licenses tab) | license-factsheet | View button on license row | Nested factsheet |
| license-mgr-list-view | license-mgr-factsheet | View button on row/card | Factsheet slide |
| am-agent-list | agent-factsheet | View button on agent card | Factsheet slide |
| Any section | chatbot-panel | Chatbot FAB click | Floating panel toggle |
| chatbot-panel | section-fullpage-chat | Pop-out button | Panel -> Fullpage |
| section-def-manager | detail-overlay | Object type row click | Slide-in panel |
| section-def-manager | wizard-overlay | FAB (+) button | Modal wizard |
| Any dock item | Corresponding section | Dock button click | Section swap |
| Login page | signin-card-stage | "Sign in with Email" button | Animate form in |
| signin-card-stage | signin-section | Back button | Animate form out |

### User Roles / Personas

| Role | Badge | Dock Items Visible |
|------|-------|-------------------|
| Platform Admin | PA | All 5 sections |
| Tenant Admin | TA | Agent Manager, Definition Manager, Release Dashboard |
| Agent Designer | AD | Agent Manager |
| Regular User | US | User Landing + Agent Manager (view only) |
| Viewer | VW | Agent Manager (view only) |

---

## Prototype 2: Dock Redesign Playground (`Documentation/prototypes/dock-redesign-playground.html`)

~821 lines. Design exploration tool for the admin dock navigation dropdown styling.

### Screens

| Screen ID | Screen Name | Type | Parent | Navigation Path | States |
|-----------|-------------|------|--------|-----------------|--------|
| `adm-page` | Admin Page Preview | Preview | Root | Direct URL | Menu open, Menu closed |
| Controls panel | Design Controls | Sidebar | Root | Always visible | 5 presets: Compact, Chosen, Pill, Card, Minimal |

### Dialogs & Modals

| Dialog ID | Trigger | Context Screen | Purpose |
|-----------|---------|----------------|---------|
| `dock-menu` (dock-float) | Menu trigger / hamburger click | adm-page | Floating dropdown navigation menu |

### Navigation Structure

**Dock Menu Items (Preview):**
- Tenant Manager
- License Manager
- Master Locale
- Master Definitions

**Design Controls:**
- Presets: Compact, Chosen (default), Pill, Card, Minimal
- Menu Geometry sliders (width, radius, padding, gap)
- Icon Style (size, labels, descriptions)
- Shadow Depth
- Animation (fade-drop, scale-up, slide-down)
- Menu Offset

### Transitions

| From | To | Trigger | Type |
|------|-----|---------|------|
| Menu closed | Menu open | Hamburger button / left island click | Animated dropdown |
| Menu open | Menu closed | Backdrop click / Escape key | Animated close |
| Menu item A | Menu item B | Dock item click | Active state swap + breadcrumb update |

---

## Prototype 3: R04 Definition Management (`Documentation/.Requirements/R04. MASTER DESFINITIONS/prototype/index.html`)

~721 lines + external app.js/style.css. Focused definition manager prototype.

### Screens

| Screen ID | Screen Name | Type | Parent | Navigation Path | States |
|-----------|-------------|------|--------|-----------------|--------|
| `section-def-manager` | Object Type List (SCR-01) | Section | app-shell | Dock > Definition Manager | Populated (Table/Card views), Loading (skeleton), Empty |
| `detail-overlay` / `ot-detail-panel` | Object Type Detail (SCR-02) | Overlay panel | section-def-manager | Object type row click | 7 tabs: General, Attributes, Connections, Governance, Maturity, Localization, Measures |
| `wizard-overlay` | Create Object Type Wizard (SCR-03) | Dialog | section-def-manager | FAB (+) / Empty state CTA | 4 steps: Basic Info, Attributes, Connections, Review |
| `section-release-dashboard` | Release Dashboard (SCR-04) | Section | app-shell | Dock > Release Dashboard | Split layout: list + detail |

### Dialogs & Modals

| Dialog ID | Trigger | Context Screen | Purpose |
|-----------|---------|----------------|---------|
| `confirm-retire` (CD-04) | Retire action on attribute row | detail-overlay > Attributes tab | Confirm single attribute retirement |
| `confirm-bulk-retire` (CD-05) | Bulk retire toolbar button | detail-overlay > Attributes tab | Confirm multi-attribute retirement |
| `confirm-delete` (CD-01) | Delete action on object type | detail-overlay context | Confirm object type deletion |

### Navigation Structure

**Dock Sidebar:**
- Definition Manager (active default) -- Roles: super-admin, architect, tenant-admin
- Release Dashboard -- Roles: super-admin, architect, tenant-admin

**Header:**
- Help button
- Persona badge (role: Architect "NR")
- Sign out

**Object Type Detail Tabs:**
- General (info rows)
- Attributes (table with select-all, bulk toolbar)
- Connections (table with add button)
- Governance (mandate flags + tenant override toggles)
- Maturity (radar chart + dimension scores)
- Localization (translation progress bars per locale)
- Measures (accordion: Quality, Usage, Timeliness)

### Transitions

| From | To | Trigger | Type |
|------|-----|---------|------|
| Object Type List | Object Type Detail | Row click | Side panel slide-in |
| Object Type List | Create Wizard | FAB (+) or empty-state button | Modal overlay |
| Wizard Step N | Wizard Step N+1 | Next button | Panel swap within wizard |
| Wizard Step N | Wizard Step N-1 | Back button | Panel swap within wizard |
| def-manager | release-dashboard | Dock item click | Section swap |
| Table View | Card View | View toggle button | Display swap |

### State Variations

| Screen | State | Description |
|--------|-------|-------------|
| Object Type List | Populated | Stats row + toolbar + table/cards |
| Object Type List | Loading | 5 skeleton lines |
| Object Type List | Empty | Icon + "No object types defined" + CTA button |
| Attributes tab | Default | Table with system + custom attributes |
| Attributes tab | Bulk selected | Bulk toolbar visible with count + Activate/Retire buttons |

---

## Prototype 4: R05 Agent Manager (`Documentation/.Requirements/R05. AGENT MANAGER/prototype/index.html`)

~1625 lines. Agent platform prototype with login, tenant management, license management, agent manager, and chat.

### Screens

| Screen ID | Screen Name | Type | Parent | Navigation Path | States |
|-----------|-------------|------|--------|-----------------|--------|
| `login-view` | Login Page | Page | Root | Direct URL | signin-section, signin-card-stage, error-banner |
| `app-shell` | App Shell | Shell | Root | After login | Admin view |
| `section-tenant-manager` | Tenant Manager | Section | app-shell | Dock > Tenant Manager | Populated, Loading, Empty |
| `tenant-factsheet` | Tenant Factsheet | Factsheet | section-tenant-manager | Card > View | Tabs: Overview, Users, Branding, Licenses |
| `user-factsheet` | User Factsheet | Factsheet | tenant-factsheet > Users | User row > View | User detail |
| `license-factsheet` | License Factsheet | Factsheet | tenant-factsheet > Licenses | License row > View | License detail |
| `section-license-manager` | License Manager | Section | app-shell | Dock > License Manager | Populated, Loading, Empty |
| `license-mgr-factsheet` | License Factsheet (standalone) | Factsheet | section-license-manager | License row > View | License detail |
| `section-agent-manager` | Agent Manager | Section | app-shell | Dock > Agent Manager | Populated, Loading, Empty |
| `am-insights` | Agent Insights | Panel | section-agent-manager | AM > Insights | Dashboard KPIs + charts |
| `am-agent-list` | Agent List | Panel | section-agent-manager | AM > Agent List | Card grid with hierarchy badges |
| `agent-factsheet` | Agent Factsheet | Factsheet | am-agent-list | Agent card > View | Tabs: Overview, Configuration, Skills, Tools, Training, Performance, History |
| `am-skills` | Skills | Panel | section-agent-manager | AM > Skills | Skills list + factsheet (tabs: Definition, Versions, Agents Using, Test) |
| `am-tools` | Tools | Panel | section-agent-manager | AM > Tools | Tools list + factsheet (tabs: Configuration, Schema, Logs, Test) |
| `am-templates` | Templates | Panel | section-agent-manager | AM > Templates | Templates list + factsheet (tabs: Preview, Configuration, Fork History) |
| `am-governance` | Governance | Panel | section-agent-manager | AM > Governance | Tabs: Audit Log, Compliance, Approvals, Policies |
| `am-triggers` | Event Triggers | Panel | section-agent-manager | AM > Triggers | Trigger list + factsheet (tabs: Configuration, Conditions, Execution History) |
| `am-settings` | Settings | Panel | section-agent-manager | AM > Settings | Tabs: General, Notifications, Integrations |
| `section-fullpage-chat` | Full-Page Chat | Section | app-shell | Agent > Chat | Chat interface |

### Dialogs & Modals

| Dialog ID | Trigger | Context Screen | Purpose |
|-----------|---------|----------------|---------|
| `notification-dropdown` | Bell icon | app-shell header | Notification list (5 items) |

### Navigation Structure

**Dock Sidebar:**
- Tenant Manager -- Roles: platform-admin
- Agent Manager -- Roles: platform-admin, tenant-admin, agent-designer, viewer
- License Manager -- Roles: platform-admin

**Agent Manager Sub-Navigation:**
- Insights, Agent List, Skills, Tools, Templates, Governance, Triggers, Settings

### Transitions

| From | To | Trigger | Type |
|------|-----|---------|------|
| login-view | app-shell | Sign In submit | View swap |
| Agent card | agent-factsheet | View button | Factsheet slide |
| Agent card/factsheet | section-fullpage-chat | Chat button | Section swap |
| am-insights | am-agent-list | Sidebar click | Panel swap |

---

## Prototype 5: R05 Design Vision (`Documentation/.Requirements/R05. AGENT MANAGER/prototype-design-vision/index.html`)

~3612 lines. Comprehensive agent platform design vision with 20 pages covering the full agent lifecycle.

### Screens

| Screen ID | Screen Name | Type | Parent | Navigation Path | States |
|-----------|-------------|------|--------|-----------------|--------|
| `page-chat` | Chat | Page | app-shell | Sidebar > Chat | Chat sidebar (conversations), main chat area, context panel |
| `page-agents` | Agents (List/Grid) | Page | app-shell | Sidebar > Agents | Populated (grid of agent cards), Loading, Empty |
| `page-gallery` | Agent Configurations (Template Gallery) | Page | app-shell | Sidebar > Template Gallery | Populated (6 template cards), Empty |
| `page-builder` | Agent Builder | Page | app-shell | Sidebar > Agent Builder | 3-column layout: component palette, canvas, config panel |
| `page-skills` | Skills | Page | app-shell | Sidebar > Skills | Skills list (table view) |
| `page-training` | Training Dashboard | Page | app-shell | Sidebar > Training | Populated, Loading, Empty |
| `page-analytics` | Platform Analytics | Page | app-shell | Sidebar > Analytics | KPI cards + charts (conversations, response times, satisfaction, tokens) |
| `page-eval` | Evaluation Harness | Page | app-shell | Sidebar > Eval Harness | Test suite management + results |
| `page-audit` | Audit Log | Page | app-shell | Sidebar > Audit Log | Event log table with filters |
| `page-pipeline` | Pipeline Runs | Page | app-shell | Sidebar > Pipeline | Pipeline execution list + status |
| `page-notifications` | Notification Center | Page | app-shell | Sidebar > Notifications | Notification list with filters |
| `page-knowledge` | Knowledge Management | Page | app-shell | Sidebar > Knowledge | Knowledge base collections + documents |
| `page-comparison` | Agent Comparison | Page | app-shell | Sidebar > Compare | Side-by-side agent metric comparison |
| `page-settings` | Settings | Page | app-shell | Sidebar > Settings | Settings tabs (General, Security, Integrations, Models, Appearance) |
| `page-workspace` | Agent Workspace | Page | app-shell | Sidebar > Workspace (Super Agent) | Multi-agent workspace with split chat panels |
| `page-approval` | Approval Queue | Page | app-shell | Sidebar > Approvals (Super Agent) | HITL approval cards with filters |
| `page-maturity` | Maturity Dashboard | Page | app-shell | Sidebar > Maturity (Super Agent) | Agent maturity levels + progression |
| `page-triggers` | Event Triggers | Page | app-shell | Sidebar > Triggers (Super Agent) | Trigger rules configuration |
| `page-embedded` | Embedded Panel Demo | Page | app-shell | Sidebar > Embedded (Super Agent) | Embedded chat widget preview |
| `page-benchmarking` | Cross-Tenant Benchmarking | Page | app-shell | Sidebar > Benchmarking (Super Agent) | Benchmark comparison across tenants |

### Dialogs & Modals

| Dialog ID | Trigger | Context Screen | Purpose |
|-----------|---------|----------------|---------|
| `.modal-overlay` | Various confirm actions | Any page | Generic confirmation dialog (Confirm/Cancel) |
| Context menus | Three-dot button on agent cards | page-agents | Edit, Duplicate, Export, Delete actions |
| `.sidebar-overlay` | Hamburger on mobile | Any page | Mobile sidebar backdrop |
| Toast notifications | Various actions | Any page | Success/error/info feedback |

### Navigation Structure

**Main Sidebar:**
- Chat
- Agents
- Template Gallery
- Agent Builder
- Skills
- Training
- Analytics
- Eval Harness
- Audit Log
- Pipeline
- Notifications
- Knowledge
- Compare
- Settings

**Super Agent Section (below separator):**
- Workspace
- Approvals
- Maturity
- Triggers
- Embedded
- Benchmarking

**Persona Switcher (sidebar footer):**
- Platform Admin
- Tenant Admin
- Agent Designer
- Regular User
- Viewer

### Transitions

| From | To | Trigger | Type |
|------|-----|---------|------|
| page-agents | page-gallery | "+ New Agent" button | Page swap |
| page-agents | page-chat | Agent card > Chat button | Page swap |
| page-gallery | page-builder | "Build from Scratch" or "Use Configuration" | Page swap |
| page-chat | page-workspace | "Open Workspace" button | Page swap |
| Any sidebar item | Target page | Sidebar nav click | Page swap via `switchPage()` |

### State Variations

| Screen | State | Description |
|--------|-------|-------------|
| page-agents | Populated | 5 agent cards in grid |
| page-agents | Loading | Skeleton cards |
| page-agents | Empty | "No agents yet" + CTA |
| page-gallery | Populated | 6 template cards |
| page-gallery | Empty | "No templates" message |
| page-training | Populated | Training datasets + knowledge bases |
| page-training | Loading | Skeleton lines |
| page-training | Empty | "No training data" + CTA |
| page-notifications | Populated | Notification list |
| page-notifications | Empty | "All clear" message |
| page-pipeline | Populated | Pipeline run list |
| page-pipeline | Empty | "No pipeline runs" |
| page-approval | Populated | Approval cards (Review/Confirmation/Escalation types) |
| page-approval | Empty | "All agent drafts reviewed" |

---

## Prototype 6: R06 Localization (`Documentation/.Requirements/R06. Localization/prototype/index.html`)

~806 lines. Localization/i18n management prototype.

### Screens

| Screen ID | Screen Name | Type | Parent | Navigation Path | States |
|-----------|-------------|------|--------|-----------------|--------|
| Main page | Localization Management | Page | Root | Direct URL | 5 tabs |
| `tab-languages` | Languages Tab | Tab panel | Main page | Tab bar > Languages | Locale table with search, pagination, empty state |
| `tab-dictionary` | Dictionary Tab | Tab panel | Main page | Tab bar > Dictionary | Translation key table with search + pagination |
| `tab-import-export` | Import / Export Tab | Tab panel | Main page | Tab bar > Import / Export | Export CSV section + Import CSV section with preview |
| `tab-rollback` | Rollback Tab | Tab panel | Main page | Tab bar > Rollback | Version history table with rollback actions |
| `tab-ai-translate` | AI Translate Tab | Tab panel | Main page | Tab bar > AI Translate | HITL review table + auto-applied summary + bulk bar |

### Dialogs & Modals

| Dialog ID | Trigger | Context Screen | Purpose |
|-----------|---------|----------------|---------|
| `edit-dialog` | Edit button or translation cell click | tab-dictionary | Edit translations for a key across all locales (en-US source, ar-AE RTL, fr-FR, de-DE) |
| `rollback-dialog` | Rollback button on version row | tab-rollback | Confirm rollback to specific version with warning |
| `import-preview` | "Choose CSV" button | tab-import-export | Import preview card with stats (rows, updates, new, errors) + confirm/cancel |
| Toast notifications | Various save/import/rollback actions | Any tab | Feedback toasts (success 4s, info 5s, error 6s per design system) |

### Navigation Structure

**Header Navigation:**
- Administration (active)
- About
- Language Switcher (dropdown: EN, AR, FR, DE, HI)
- Sign Out

**Tab Bar:**
- Languages (locale management)
- Dictionary (translation keys)
- Import / Export
- Rollback (version history)
- AI Translate (AI-assisted translation with HITL)

### Transitions

| From | To | Trigger | Type |
|------|-----|---------|------|
| Tab N | Tab M | Tab button click | Tab panel swap (hidden attribute) |
| Dictionary tab | edit-dialog | Edit button / cell click | Dialog overlay open |
| Rollback tab | rollback-dialog | Rollback button | Dialog overlay open |
| Import/Export tab | import-preview | "Choose CSV" button | Inline preview expand |
| AI Translate | AI results | "Translate Missing" button | 2s loading spinner then results |
| Language switcher closed | open | Button click | Dropdown toggle |
| Any language | selected language | Language item click | Page dir change (LTR/RTL) |

### State Variations

| Screen | State | Description |
|--------|-------|-------------|
| tab-languages | Populated | Locale table with 10 locales, coverage bars, active toggles |
| tab-languages | Empty (filtered) | "No locales found" empty state with clear search CTA |
| tab-ai-translate | Before translate | Button ready, no results |
| tab-ai-translate | After translate | Auto-applied summary (38 unambiguous) + HITL table (7 ambiguous) |
| tab-import-export | Before import | Just export + import buttons |
| tab-import-export | Import preview | Preview card with stats + timer + confirm/cancel |

---

## Consolidated Screen Inventory

### De-duplicated Master List

| # | Screen | Feature Area | Prototyped In | Type |
|---|--------|-------------|---------------|------|
| 1 | Login Page | Core | P1, P4 | Page |
| 2 | App Shell (Admin layout) | Core | P1, P3, P4 | Shell |
| 3 | User Landing Page | Core | P1 | Page |
| 4 | **Tenant Manager** | R02 | P1, P4 | Section |
| 5 | Tenant List (Cards) | R02 | P1, P4 | Sub-view |
| 6 | Tenant Factsheet | R02 | P1, P4 | Factsheet |
| 7 | Tenant > Overview Tab | R02 | P1, P4 | Tab |
| 8 | Tenant > Users Tab | R02 | P1, P4 | Tab |
| 9 | Tenant > Branding Tab | R02 | P1, P4 | Tab |
| 10 | Tenant > Licenses Tab | R02 | P1, P4 | Tab |
| 11 | User Factsheet | R02 | P1, P4 | Factsheet |
| 12 | **License Manager** | R03 | P1, P4 | Section |
| 13 | License List (Table + Grid views) | R03 | P1, P4 | Sub-view |
| 14 | License Factsheet (standalone) | R03 | P1, P4 | Factsheet |
| 15 | License Factsheet (tenant-nested) | R03 | P1, P4 | Factsheet |
| 16 | **Agent Manager** | R05 | P1, P4 | Section |
| 17 | Agent Insights Dashboard | R05 | P1, P4 | Panel |
| 18 | Agent List (Cards) | R05 | P1, P4 | Panel |
| 19 | Agent Factsheet | R05 | P1, P4 | Factsheet |
| 20 | Agent > Overview Tab | R05 | P1, P4 | Tab |
| 21 | Agent > Configuration Tab (Builder) | R05 | P1, P4 | Tab |
| 22 | Agent > Skills Tab | R05 | P1, P4 | Tab |
| 23 | Agent > Tools Tab | R05 | P1, P4 | Tab |
| 24 | Agent > Training Tab | R05 | P1, P4 | Tab |
| 25 | Agent > Performance Tab | R05 | P1, P4 | Tab |
| 26 | Agent > History Tab | R05 | P1, P4 | Tab |
| 27 | Skills Registry | R05 | P1, P4 | Panel |
| 28 | Skill Factsheet (Definition/Versions/Agents/Test) | R05 | P4 | Factsheet |
| 29 | Tools Registry | R05 | P1, P4 | Panel |
| 30 | Tool Factsheet (Config/Schema/Logs/Test) | R05 | P4 | Factsheet |
| 31 | Templates Gallery | R05 | P1, P4 | Panel |
| 32 | Template Factsheet (Preview/Config/Forks) | R05 | P4 | Factsheet |
| 33 | Agent Governance (Audit/Compliance/Approvals/Policies) | R05 | P1, P4 | Panel |
| 34 | Event Triggers | R05 | P1, P4 | Panel |
| 35 | Trigger Factsheet (Config/Conditions/History) | R05 | P4 | Factsheet |
| 36 | Agent Manager Settings (General/Notifications/Integrations) | R05 | P1, P4 | Panel |
| 37 | Full-Page Chat | R05 | P1, P4 | Section |
| 38 | Chatbot Mini Panel (FAB) | R05 | P1 | Floating |
| 39 | **Definition Manager** (Object Types) | R04 | P1, P3 | Section |
| 40 | Object Type List (Table/Card views) | R04 | P1, P3 | Sub-view |
| 41 | Object Type Detail Panel (7 tabs) | R04 | P1, P3 | Overlay |
| 42 | Create Object Type Wizard (4 steps) | R04 | P1, P3 | Dialog |
| 43 | **Release Dashboard** | R04 | P1, P3 | Section |
| 44 | Release List + Release Detail (split layout) | R04 | P1, P3 | Sub-view |
| 45 | Notification Dropdown | Core | P1, P4 | Dropdown |
| 46 | Dock Navigation (Redesign Playground) | Core | P2 | Interactive |
| 47 | **Localization: Languages Tab** | R06 | P6 | Tab |
| 48 | **Localization: Dictionary Tab** | R06 | P6 | Tab |
| 49 | **Localization: Import/Export Tab** | R06 | P6 | Tab |
| 50 | **Localization: Rollback Tab** | R06 | P6 | Tab |
| 51 | **Localization: AI Translate Tab** | R06 | P6 | Tab |
| 52 | Edit Translations Dialog | R06 | P6 | Dialog |
| 53 | Rollback Confirmation Dialog | R06 | P6 | Dialog |
| 54 | Import Preview Card | R06 | P6 | Inline overlay |
| 55 | Language Switcher Dropdown | R06 | P6 | Dropdown |
| 56 | **Chat Page** (full agent chat with context panel) | R05-Vision | P5 | Page |
| 57 | **Agents Page** (grid/table with context menus) | R05-Vision | P5 | Page |
| 58 | **Template Gallery Page** | R05-Vision | P5 | Page |
| 59 | **Agent Builder Page** (3-column canvas) | R05-Vision | P5 | Page |
| 60 | **Skills Page** | R05-Vision | P5 | Page |
| 61 | **Training Dashboard Page** | R05-Vision | P5 | Page |
| 62 | **Platform Analytics Page** | R05-Vision | P5 | Page |
| 63 | **Evaluation Harness Page** | R05-Vision | P5 | Page |
| 64 | **Audit Log Page** | R05-Vision | P5 | Page |
| 65 | **Pipeline Runs Page** | R05-Vision | P5 | Page |
| 66 | **Notification Center Page** | R05-Vision | P5 | Page |
| 67 | **Knowledge Management Page** | R05-Vision | P5 | Page |
| 68 | **Agent Comparison Page** | R05-Vision | P5 | Page |
| 69 | **Settings Page** (5 tabs) | R05-Vision | P5 | Page |
| 70 | **Agent Workspace Page** (multi-agent) | R05-Vision | P5 | Page |
| 71 | **Approval Queue Page** (HITL) | R05-Vision | P5 | Page |
| 72 | **Maturity Dashboard Page** | R05-Vision | P5 | Page |
| 73 | **Event Triggers Page** | R05-Vision | P5 | Page |
| 74 | **Embedded Panel Demo Page** | R05-Vision | P5 | Page |
| 75 | **Cross-Tenant Benchmarking Page** | R05-Vision | P5 | Page |

### Summary Statistics

| Metric | Count |
|--------|-------|
| **Total unique screens/views** | **75** |
| Total dialogs/modals | 9 |
| Total dropdown/overlay components | 4 |
| Total wizard flows | 1 (4-step Object Type creation) |
| Total factsheet patterns | 9 (Tenant, User, License x2, Agent, Skill, Tool, Template, Trigger) |

### Screens by Feature Area

| Feature Area | Count | Prototypes |
|-------------|-------|------------|
| **Core (Shell, Login, Navigation)** | 6 | P1, P2, P4 |
| **R02 - Tenant Management** | 7 | P1, P4 |
| **R03 - License Management** | 4 | P1, P4 |
| **R04 - Master Definitions** | 6 | P1, P3 |
| **R05 - Agent Manager (Admin)** | 22 | P1, P4 |
| **R05 - Agent Manager (Design Vision)** | 20 | P5 |
| **R06 - Localization** | 9 | P6 |
| **Shared components (dialogs, toasts)** | 1 | All |

### Coverage Gaps (Referenced but Not Prototyped)

| Screen/Feature | Referenced In | Status |
|----------------|--------------|--------|
| Forgot Password flow | Login page placeholder link | Not prototyped (link to mailto only) |
| Tenant Creation wizard | Empty state CTA ("+ Create Tenant") | Button exists, no wizard implemented |
| License Creation wizard | Empty state CTA ("+ Add License") | Button exists, no wizard implemented |
| User invitation flow | Tenant Users tab | Implicit (invited status shown), no creation flow |
| Agent deletion confirmation | Agent card "Delete" button | Button exists, no confirmation dialog |
| Agent creation wizard (admin context) | AM > Agent List "+ New Agent" button | Button exists, no wizard (Vision prototype has full Builder page) |
| Full notifications page | "View all notifications" button | Button exists, no dedicated page in P1 (exists in P5 as page-notifications) |
| Help/documentation page | Help button in header | Button present, no content |
| About page | R06 prototype header link | Link present, no page |
| Persona/role management | Persona badge button | Can switch roles in P1, no management UI |
| License renewal wizard | "Renew" button on license factsheet | Button exists, no flow |
| License seat management | "Add Seats" button on license factsheet | Button exists, no flow |
| Agent Builder (within admin shell) | Agent factsheet > Configuration tab | Embedded builder canvas in P1/P4 (simplified), full version in P5 |
| Knowledge base upload flow | P5 page-knowledge | Page exists but upload flow is minimal |
| Pipeline creation wizard | P5 page-pipeline | List view only, no creation flow |
| Eval test execution | P5 page-eval | Results shown, no execution flow |

### Cross-Prototype Duplications

The following screens appear in multiple prototypes with slight variations:

| Screen | P1 (Main) | P3 (R04) | P4 (R05) | P5 (R05 Vision) |
|--------|-----------|----------|----------|-----------------|
| Login | Yes (Phosphor icons) | No | Yes (SVG icons) | No |
| Tenant Manager | Yes | No | Yes | No |
| License Manager | Yes | No | Yes | No |
| Agent Manager | Yes (full) | No | Yes (full) | No (separate pages) |
| Definition Manager | Yes (embedded) | Yes (standalone) | No | No |
| Release Dashboard | Yes (embedded) | Yes (standalone) | No | No |
| Chat | Yes (fullpage + FAB) | No | Yes (fullpage) | Yes (page-chat, page-workspace) |

**Note:** P1 (Main) is the most comprehensive admin prototype, combining all feature areas. P3 and P6 are standalone feature prototypes. P4 is a parallel version of P1 (SVG-based instead of Phosphor icons). P5 is a standalone design vision with a fundamentally different navigation model (sidebar-driven pages vs. dock-driven sections).
