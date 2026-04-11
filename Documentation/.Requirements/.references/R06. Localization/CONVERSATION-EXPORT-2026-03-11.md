# Localization Feature — Conversation Export

**Date:** 2026-03-11
**Sessions:** Design, Documentation, Gap Analysis, Stakeholder Feedback, Persona Alignment
**Last Updated:** 2026-03-11 (Session 3)

---

## Session History

### Session 1 — Gap Analysis & Backlog (2026-03-11)

Produced a comprehensive analysis and documentation package:

1. **Documentation Schema Analysis** — Studied the 18-document pattern from `definition-management` and `ai-service`
2. **Implementation Truth Verification** — Crawled the entire codebase to verify what EXISTS vs. what's PLANNED
3. **Full Codebase Gap Inventory** — Identified ALL hardcoded strings (816 total: 652 frontend + 164 backend)
4. **Design System Analysis** — Extracted complete design tokens, color palette, typography, spacing, button patterns
5. **Backlog Creation** — Created 5 backlog documents with sprint plan, scenarios, and infrastructure requirements

### Session 2 — Stakeholder Feedback & Design Updates (2026-03-11)

Applied stakeholder decisions across 8 design/backlog/prototype files (v1.0→v2.0):

1. **PrimeNG Text Expansion** — Identified 5 critical fixed-width CSS constraints (280px search, 200px cell, 60rem table, 480px dialog, 460px brand island)
2. **3 Translation Scenarios** — Manual (no workflow), Import/Export (no validation), Agentic (HITL only for ambiguous terms)
3. **Simplified Status Model** — ACTIVE, PENDING_REVIEW, REJECTED (no DRAFT or UNDER_REVIEW)
4. **Translation Reflection Flow** — Cache-invalidation + Signal-based refresh; 5-min polling; no WebSocket
5. **No Role Proliferation** — No ROLE_TRANSLATOR or ROLE_REVIEWER
6. **Duplication Detection Flag** — Computed `is_duplicate` badge; deferred bulk edit to next release

### Session 3 — Persona Alignment & Tenant Overrides (2026-03-11)

Applied 4 refinements across all design docs (v2.0→v3.0):

1. **Persona Alignment (F1)** — Replaced ad-hoc personas (Ranya, Khalid, Fatima, Visitor) with official registry references (PER-UX-001, PER-UX-003, PER-UX-004, PER-CX-001) + 6 secondary personas
2. **Tenant Translation Overrides (F2)** — Added FR-15 with overlay pattern: new `tenant_translation_overrides` table, 5 REST endpoints, bundle merge logic, tenant-scoped caching. New epic E15 (13 SP in Sprint 2)
3. **Bulk Find-and-Replace Rationale (F3)** — Expanded deferral rationale: Phase 1 detection (duplication flag) / Phase 2 correction (bulk replace)
4. **Language Switcher Compliance (F4)** — Added design compliance mandate + full property-to-SCSS-source mapping table for neighbor pill pattern
5. **File Cleanup** — Deleted 3 superseded legacy files (Spec, LLD, UI)

---

## Key Findings

### Completion Ratio: 0 / 816 strings externalized (0.0%)

| Layer | Strings | Externalized | Ratio |
|-------|---------|-------------|-------|
| Frontend HTML templates | 420 | 0 | 0.0% |
| Frontend TypeScript | 180 | 0 | 0.0% |
| Frontend Models/Config | 44 | 0 | 0.0% |
| Frontend SCSS | 8 | 0 | 0.0% |
| Backend Exceptions | 122 | 0 | 0.0% |
| Backend Validation | 42 | 0 | 0.0% |
| **Total** | **816** | **0** | **0.0%** |

### What EXISTS (Code-Complete, Untested)

- **localization-service** — Full microservice at port 8091 with 6 tables, 5 services, 3 controllers, 22 endpoints
- **Frontend Admin UI** — 4-tab Master Locale section (Languages, Dictionary, Import/Export, Rollback)
- **AdminLocaleService** — Signals-based state management with 14 API methods
- **API Gateway Routes** — 4 routes correctly placed before catch-all
- **Docker + DB** — docker-compose entry + init-db.sql with localization_db
- **43 backend + 20 frontend tests** — Written but NOT executed

### What Does NOT Exist

- Zero i18n runtime infrastructure (no TranslationService, no translate pipe, no translation files)
- No language switcher component
- No Accept-Language header propagation
- No MessageResolver / MessageSource for backend error localization
- No inter-service locale propagation (Feign clients don't forward locale)
- No RTL CSS audit
- No tenant translation overrides (planned in Sprint 2)

---

## Deliverables Produced

### Documentation — Design/ (10-Document Set, v3.0)

| File | Purpose | Version |
|------|---------|---------|
| `Design/00-Benchmark-Report.md` | Industry comparison + gap analysis + stakeholder decisions | v3.0 |
| `Design/01-PRD.md` | Product requirements, 15 FRs, 18 BRs, persona-registry aligned | v3.0 |
| `Design/03-LLD-Corrections.md` | Corrections to original LLD (React→Angular, path fixes) | v1.0 |
| `Design/04-Data-Model.md` | ER diagram (7 tables incl. tenant overrides), scope classification | v3.0 |
| `Design/05-UI-UX-Design-Spec.md` | Full UI/UX spec, design tokens, WCAG AAA, responsive, journey maps | v3.0 |
| `Design/06-API-Contract.md` | 22 endpoints, OpenAPI 3.1 structure | v1.0 |
| `Design/07-SA-Conditions-Tracker.md` | 24 SA conditions with resolution status | v1.0 |
| `Design/11-Implementation-Backlog.md` | Component dashboard, critical path, sprint summary | v3.0 |
| `Design/15-Test-Strategy.md` | Test pyramid, coverage targets, environment matrix | v1.0 |
| `Design/16-Playwright-Test-Plan.md` | E2E test scenarios for all 4 tabs + language switcher | v1.0 |

### Documentation — Backlog/ (6 Files)

| File | Purpose |
|------|---------|
| `Backlog/00-Backlog-Overview.md` | Master backlog index with completion dashboard |
| `Backlog/01-Frontend-String-Inventory.md` | 652 frontend strings with i18n keys (P1-P10 prioritized) |
| `Backlog/02-Backend-String-Inventory.md` | 164 backend strings with error codes per service |
| `Backlog/03-i18n-Infrastructure-Backlog.md` | 15 infrastructure components to build |
| `Backlog/04-Sprint-Plan.md` | 3-sprint plan (209 SP, 52 stories, 15 epics) |
| `Backlog/05-Scenario-Matrix.md` | 28 happy scenarios, 9 alternative flows, 41 edge cases, RBAC matrix |

### Other

| File | Purpose |
|------|---------|
| `prototype/index.html` | Interactive HTML prototype (5 tabs: Languages, Dictionary, Import/Export, Rollback, AI Translate) |
| `README.md` | Documentation index |

### Plan File

| File | Purpose |
|------|---------|
| `~/.claude/plans/floating-hatching-orbit.md` | Full implementation plan (5 phases + Part F refinements) |

---

## Implementation Plan Overview

### Phase 1: Backend i18n Infrastructure
- MessageResolver in backend/common
- LocaleContextFilter + LocalePropagationInterceptor
- Error code constants per service
- Fix GW-03, INF-01, SEC-04

### Phase 2: Frontend i18n Infrastructure
- TranslationService (Signals-based, bundle API integration)
- TranslatePipe + LocalizedDatePipe
- APP_INITIALIZER locale bootstrap
- Accept-Language HTTP interceptor
- Seed translation files (en-US.json, ar-AE.json)

### Phase 3: User-Facing Features
- Language switcher component (matching island button style, neighbor pill pattern)
- String externalization (P1-P10 phased)
- Agentic translation with HITL (ambiguous terms only)
- Tenant translation overrides (overlay pattern, E15)

### Phase 4: Documentation (10-Document Set)
- All 10 Design/ documents produced (v3.0)

### Phase 5: Testing & QA
- Execute existing 63 tests
- Write Testcontainers integration tests
- Write Playwright E2E tests
- Responsive + accessibility + RTL testing

---

## Architecture Decisions Made

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Translation workflow | 3 scenarios (manual, import/export, agentic) | No role proliferation, covers all use cases |
| HITL scope | Ambiguous terms only | Simple terms auto-applied; only multi-meaning words flagged |
| Translation status | ACTIVE / PENDING_REVIEW / REJECTED | Minimal states; no DRAFT or UNDER_REVIEW |
| Reflection mechanism | Polling (5 min) + Signal-based refresh | No WebSocket; simpler, sufficient for translation changes |
| Tenant overrides | Overlay pattern (global base + tenant overrides) | Keeps global architecture intact; tenants customize only what differs |
| Personas | Official registry references (PER-UX-001/003/004, PER-CX-001) | Complies with PERSONA-REGISTRY.md single-source-of-truth rule |
| Language Switcher | Neighbor pill inside `.topnav.header-island` | Design compliance with shell layout neumorphic pattern |
| Bulk find-and-replace | Deferred to Phase 2 | Phase 1 detection (duplication flag), Phase 2 correction |
| Cache key strategy | `bundle:{tenantId}:{localeCode}` | Tenant-scoped caching; null tenantId → `bundle:global:{code}` |

---

## SA Review Conditions Status

| ID | Condition | Status |
|----|-----------|--------|
| SB-01 | No overlap with definition-service | Architecture Decision: No overlap (different domains) |
| SB-02 | Document REST integration for VR-04 | OPEN — needs LLD update |
| SB-03 | Clarify translation_bundle | Architecture Decision: Computed DTO, not table |
| GW-01 | Routes before catch-all | RESOLVED — verified in RouteConfig.java:25-36 |
| GW-02 | Docker RouteConfig variant | Architecture Decision: Single RouteConfig for all profiles |
| GW-03 | Exact path for user/locale | OPEN — needs code fix (line 33) |
| DM-01 | @Version on all entities | RESOLVED — verified in entity classes |
| DM-02 | Audit timestamps | RESOLVED — verified |
| DM-03 | UUID versionId | RESOLVED — verified |
| DM-04 | Tenant-scope classification | Updated: GLOBAL base + tenant overlay for overrides |
| API-01 | /v1/ prefix alignment | RESOLVED in code — LLD docs need fix |
| API-02 | Preview-to-commit token | RESOLVED — Valkey previewToken pattern |
| API-03 | 409/422 error responses | RESOLVED — GlobalExceptionHandler |
| INF-01 | 50-version retention cleanup | OPEN — needs @Scheduled method |
| INF-02 | Snapshot excluded from list | RESOLVED — DTO excludes snapshotData |
| INF-03 | Cache invalidation on commit | RESOLVED — Valkey keys deleted |
| INF-04 | Kafka topic creation | DEFERRED — use REST to audit-service |
| SEC-01 | .permitAll() for public endpoints | RESOLVED — SecurityConfig verified |
| SEC-02 | JWT user_id extraction | RESOLVED — UserLocaleController verified |
| SEC-04 | CSV injection + file size limit | OPEN — needs code fix |
| UX-01 | React → Angular in LLD | RESOLVED in code — LLD docs need fix |
| OAS-01 | OpenAPI 3.1 specification | OPEN — needs generation |

**Resolved:** 14/24 (58%) | **Open:** 7/24 | **Architecture Decisions:** 3/24

---

## Deleted Files (Session 3)

| File | Reason |
|------|--------|
| `Localization-Management-Spec.md` | Superseded by `Design/01-PRD.md` v3.0 |
| `Localization-Management-LLD.md` | Superseded by `Design/03-LLD-Corrections.md` + `Design/06-API-Contract.md` |
| `Localization-Management-UI.md` | Superseded by `Design/05-UI-UX-Design-Spec.md` v3.0 |
