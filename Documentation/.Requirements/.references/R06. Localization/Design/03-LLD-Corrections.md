# LLD Corrections: Localization Service

**Version:** 2.0.0
**Date:** March 11, 2026
**Status:** [IN-PROGRESS] — Documents required fixes; DM-04 updated to reflect tenant overlay pattern; source LLD deleted (superseded by Design/ docs)
**Owner:** SA Agent

**Note:** The original `Localization-Management-LLD.md` has been deleted (superseded by Design/ documents). These corrections are preserved as architectural decisions that inform the current design.

---

## 1. Required Fixes

### Fix 1: React → Angular (SA Condition UX-01)

| Location | Current (Wrong) | Correct |
|----------|-----------------|---------|
| Line 12 | "React" | "Angular 21" |
| Line 19 (Mermaid) | "React SPA" | "Angular SPA" |
| Any "React component" | React terminology | Angular component/standalone |

### Fix 2: API Path Prefix (SA Condition API-01)

| Location | Current (Wrong) | Correct |
|----------|-----------------|---------|
| All API paths | `/api/locales/...` | `/api/v1/locales/...` |
| Admin paths | `/api/admin/...` | `/api/v1/admin/...` |
| User paths | `/api/user/...` | `/api/v1/user/...` |

### Fix 3: Service Boundary Clarification (SA Condition SB-02)

**Add section:** "VR-04 Implementation Detail"

VR-04 (user migration on locale deactivation) is handled entirely within `localization-service`:
- `LocaleService.deactivate()` queries `user_locale_preferences` for affected users
- Updates `locale_code` to alternative locale, sets `preference_source = 'MIGRATED'`
- Returns `migrated_users` count in response
- No cross-service REST call needed (user preference is in `localization_db`)

### Fix 4: Security Section Missing

**Add section:** "Security Configuration"

```
- Public endpoints: /api/v1/locales/active, /detect, /*/bundle — .permitAll()
- User endpoints: /api/v1/user/locale — JWT authentication required
- Admin endpoints: /api/v1/admin/** — @PreAuthorize("hasRole('SUPER_ADMIN')")
- JWT user_id extraction: UserLocaleController reads 'sub' claim
```

### Fix 5: Architecture Decisions

**Add section:** "Architecture Decisions"

| Decision | Resolution |
|----------|------------|
| Translation bundle is a computed DTO, not a table (SB-03) | Assembled from dictionary_entries + dictionary_translations at runtime |
| Core entities are GLOBAL; tenant overrides via overlay pattern (DM-04, **updated v3.0**) | 6 core tables remain GLOBAL (no tenant_id). A 7th table `tenant_translation_overrides` [PLANNED] uses `tenant_id` column for tenant-scoped customizations. Bundle generation merges global + tenant overrides. See [04-Data-Model.md §2.7](04-Data-Model.md) and [01-PRD.md FR-15](01-PRD.md). |
| Single RouteConfig for all profiles (GW-02) | No separate docker RouteConfig |
| Kafka deferred, use REST to audit-service (INF-04) | REST initially, Kafka in future sprint |

---

## 2. Sections to Keep As-Is

The following LLD sections are architecturally correct and should be preserved:
- Database schema (6 tables)
- Service layer design (5 services)
- Controller design (3 controllers, 22 endpoints)
- Valkey caching strategy
- Rate limiting approach
- Snapshot/rollback mechanism

---

## 3. Application Instructions

The original LLD file has been deleted. These architectural decisions are now encoded in the Design/ document set (01-PRD, 04-Data-Model, 06-API-Contract, 07-SA-Conditions-Tracker).

---

## Changelog

| Version | Date | Changes |
|---------|------|---------|
| 2.0.0 | 2026-03-11 | Updated DM-04 to reflect tenant overlay pattern (6 GLOBAL + 1 TENANT-SCOPED); removed reference to deleted LLD source file |
| 1.0.0 | 2026-03-11 | Initial LLD corrections — 5 fixes identified |
