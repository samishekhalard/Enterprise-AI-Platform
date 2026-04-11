# Localization & i18n Feature Documentation

**Feature:** Localization Management & i18n Runtime
**Status:** [IN-PROGRESS] — Service code-complete; i18n runtime [PLANNED]; tenant overrides [PLANNED]
**Owner:** Architecture / Localization Squad
**Version:** 3.0.0
**Date:** 2026-03-11

---

## Scope

- Localization-service microservice (port 8091) — system languages, translation dictionary, import/export, rollback
- i18n runtime infrastructure — TranslationService, TranslatePipe, language switcher, backend message localization
- Agentic translation — AI-powered translation with HITL for ambiguous terms
- Tenant translation overrides — overlay pattern allowing tenants to customize global translations
- Full-stack string externalization — 816 hardcoded strings (652 frontend + 164 backend)

---

## Documentation Index

### Design Documents (10-Document Set, v3.0)

| # | Document | Status | Description |
|---|----------|--------|-------------|
| 00 | [Benchmark Report](./Design/00-Benchmark-Report.md) | v3.0 | Industry comparison, gap analysis, stakeholder decisions |
| 01 | [PRD](./Design/01-PRD.md) | v3.0 | Product Requirements — 15 FRs, 10 NFRs, 18 business rules, persona-registry aligned |
| 03 | [LLD Corrections](./Design/03-LLD-Corrections.md) | v1.0 | 5 fixes needed for original LLD (React→Angular, /v1/ paths, security, arch decisions) |
| 04 | [Data Model](./Design/04-Data-Model.md) | v3.0 | ER diagram (7 tables incl. tenant overrides), scope classification, bundle DTO |
| 05 | [UI/UX Design Spec](./Design/05-UI-UX-Design-Spec.md) | v3.0 | Component library, design token compliance, responsive, WCAG AAA, RBAC views |
| 06 | [API Contract](./Design/06-API-Contract.md) | v1.0 | 22+ endpoints, auth matrix, error codes, gateway routes |
| 07 | [SA Conditions Tracker](./Design/07-SA-Conditions-Tracker.md) | v1.0 | 24 conditions — 14 resolved, 7 open, 3 arch decisions |
| 11 | [Implementation Backlog](./Design/11-Implementation-Backlog.md) | v3.0 | Sprint assignments, status dashboard, critical path |
| 15 | [Test Strategy](./Design/15-Test-Strategy.md) | v1.0 | Test pyramid, 63 tests inventory, coverage targets, quality gates |
| 16 | [Playwright Test Plan](./Design/16-Playwright-Test-Plan.md) | v1.0 | 5 suites, 42 scenarios, RBAC matrix, accessibility, responsive |

### Backlog Documents

| # | Document | Description |
|---|----------|-------------|
| 00 | [Backlog Overview](./Backlog/00-Backlog-Overview.md) | Master backlog with completion dashboard |
| 01 | [Frontend String Inventory](./Backlog/01-Frontend-String-Inventory.md) | 652 strings with i18n keys, P1-P10 priority |
| 02 | [Backend String Inventory](./Backlog/02-Backend-String-Inventory.md) | 164 strings per service with error codes |
| 03 | [i18n Infrastructure Backlog](./Backlog/03-i18n-Infrastructure-Backlog.md) | 15 components to build (4 backend + 11 frontend) |
| 04 | [Sprint Plan](./Backlog/04-Sprint-Plan.md) | 3-sprint plan — 209 SP, 52 stories, 15 epics |
| 05 | [Scenario Matrix](./Backlog/05-Scenario-Matrix.md) | 28 happy, 9 alternative, 41 edge cases, RBAC matrix |

### Prototype

| File | Description |
|------|-------------|
| [prototype/index.html](./prototype/index.html) | Interactive HTML prototype — 5 tabs, language switcher, AI translation panel with HITL |
| [prototype/style.css](./prototype/style.css) | Neumorphic stylesheet — aligned with Design System Contract v1.0.0 |
| [prototype/DESIGN-SYSTEM-VALIDATION.md](./prototype/DESIGN-SYSTEM-VALIDATION.md) | Compliance report — 82% pass rate (36/44 checks) |

### Design System Cross-References

| Design System Artifact | Localization Usage |
|------------------------|--------------------|
| [DESIGN-SYSTEM-CONTRACT.md](../../design-system/DESIGN-SYSTEM-CONTRACT.md) | Tokens, blocks, patterns referenced in prototype CSS |
| [tokens.css](../../design-system/tokens.css) | `--tp-*`, `--nm-*` tokens replicated in prototype `:root` |
| [blocks/empty-state.md](../../design-system/blocks/empty-state.md) | Empty state block implemented in Languages tab |
| [patterns/loading-states.md](../../design-system/patterns/loading-states.md) | Skeleton shimmer CSS defined |
| [components/toast.md](../../design-system/components/toast.md) | Severity-based duration (4s/5s/6s), `role="alert"` |
| [COMPLIANCE-CHECKLIST.md](../../design-system/COMPLIANCE-CHECKLIST.md) | Checklist validated in prototype validation report |
| [Main Prototype](../../prototypes/index.html) | T6 Localization tab uses aligned `--loc-coverage-*` color classes |

### Session Export

| File | Description |
|------|-------------|
| [CONVERSATION-EXPORT-2026-03-11.md](./CONVERSATION-EXPORT-2026-03-11.md) | 3-session design summary: gap analysis, stakeholder feedback, persona alignment & tenant overrides |

---

## Personas

All personas reference the [EMSIST Persona Registry](../persona/PERSONA-REGISTRY.md):

| Registry ID | Name | Localization Role |
|-------------|------|-------------------|
| PER-UX-001 | Sam Martinez (Super Admin) | Manages global translations, tenant overrides, HITL review |
| PER-UX-003 | Fiona Shaw (Tenant Admin) | Edits translations, manages tenant-specific overrides |
| PER-UX-004 | Lisa Harrison (End User) | Uses localized UI, switches languages |
| PER-CX-001 | Kyle Morrison (Visitor) | Sees login page in detected language |
| PER-AX-001 | EMSIST AI Assistant | Performs agentic translation, HITL classification |

---

## Implementation Status

| Layer | Status | Completion |
|-------|--------|------------|
| localization-service (backend) | [IMPLEMENTED] | 100% |
| Admin UI (Master Locale section) | [IMPLEMENTED] | 100% |
| API Gateway routes | [IMPLEMENTED] | 100% |
| Backend tests (43) | [WRITTEN] | 0% executed |
| Frontend tests (20) | [WRITTEN] | 0% executed |
| i18n runtime (frontend) | [PLANNED] | 0% |
| i18n runtime (backend) | [PLANNED] | 0% |
| Tenant translation overrides | [PLANNED] | 0% |
| String externalization | [PLANNED] | 0/816 (0%) |
| Documentation | [IN-PROGRESS] | 16/18 files |

---

## Next Steps

1. **Sprint 1:** Build i18n infrastructure (TranslationService, MessageResolver, LocaleContextFilter)
2. **Sprint 1:** Fix SA conditions (GW-03, INF-01, SEC-04)
3. **Sprint 1:** Execute existing 63 tests
4. **Sprint 2:** Build language switcher (neighbor pill pattern), begin string externalization (P1-P4)
5. **Sprint 2:** Design agentic translation API + UI with HITL
6. **Sprint 2:** Implement tenant translation overrides (E15: overlay pattern, 13 SP)
7. **Sprint 2:** Schema extensions (E12: translator_notes, max_length, status)
8. **Sprint 3:** Complete string externalization (P5-P10), RTL audit, E2E tests
