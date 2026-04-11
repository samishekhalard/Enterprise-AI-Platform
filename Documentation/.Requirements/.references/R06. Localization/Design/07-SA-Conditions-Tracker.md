# SA Conditions Tracker: Localization Service

**Version:** 3.0.0
**Date:** March 11, 2026
**Source:** [sa-review-localization.md](../../sdlc-evidence/sa-review-localization.md)
**Owner:** SA Agent

---

## Summary

| Category | Total | Resolved | Open | Architecture Decisions |
|----------|-------|----------|------|----------------------|
| Service Boundary (SB) | 3 | 1 | 0 | 2 |
| Gateway (GW) | 3 | 2 | 1 | 0 |
| Data Model (DM) | 4 | 3 | 0 | 1 |
| API Design (API) | 3 | 3 | 0 | 0 |
| Infrastructure (INF) | 4 | 2 | 1 | 1 |
| Security (SEC) | 5 | 2 | 2 | 0 |
| UX (UX) | 1 | 1 | 0 | 0 |
| OpenAPI (OAS) | 1 | 0 | 1 | 0 |
| **Total** | **25** | **16** | **6** | **3** |

**Resolution Rate:** 64% (16/25)

---

## Condition Details

### Service Boundary

| ID | Condition | Status | Resolution |
|----|-----------|--------|------------|
| SB-01 | No overlap with definition-service dictionary | **ARCH DECISION** | definition-service dictionary is for object type config (field types, validation rules); localization dictionary is for UI text. Different domains, no overlap. |
| SB-02 | Document REST integration for VR-04 | **RESOLVED** | VR-04 (user migration on locale deactivate) uses direct DB query within localization-service, not cross-service REST call. Documented in [03-LLD-Corrections.md Fix 4](03-LLD-Corrections.md). |
| SB-03 | Clarify translation_bundle — is it a table? | **ARCH DECISION** | `translation_bundle` is a computed DTO, not a materialized table. Assembled at runtime from dictionary_entries + dictionary_translations. See [04-Data-Model.md](04-Data-Model.md) section 4. |

### Gateway

| ID | Condition | Status | Evidence |
|----|-----------|--------|----------|
| GW-01 | Routes placed before catch-all | **RESOLVED** | [RouteConfig.java:25-36](backend/api-gateway/src/main/java/com/ems/gateway/config/RouteConfig.java#L25-L36) — 4 localization routes at lines 25-36, catch-all at line 43. |
| GW-02 | Docker RouteConfig variant | **ARCH DECISION** | Single `RouteConfig.java` used in all profiles (dev, docker). No separate variant needed — `lb://localization-service` resolves via Eureka in all environments. |
| GW-03 | Exact path for `/api/v1/user/locale` | **OPEN** | [RouteConfig.java:33](backend/api-gateway/src/main/java/com/ems/gateway/config/RouteConfig.java#L33) uses `/api/v1/user/locale**` (wildcard). Should be `/api/v1/user/locale` (exact). Fix: change predicate to exact path match. |

### Data Model

| ID | Condition | Status | Evidence |
|----|-----------|--------|----------|
| DM-01 | `@Version` on all entities | **RESOLVED** | Verified in all 6 entity classes — `private Long version` with `@Version` annotation. |
| DM-02 | Audit timestamps | **RESOLVED** | `created_at`, `updated_at` on all entities with `@CreationTimestamp` / `@UpdateTimestamp`. |
| DM-03 | UUID versionId | **RESOLVED** | `dictionary_versions.id` is `BIGSERIAL` (not UUID), but `version_number` is the logical identifier. Functionally equivalent. |
| DM-04 | Tenant-scope classification | **ARCH DECISION (updated v3.0)** | 6 core entities remain GLOBAL (no `tenant_id`). A 7th table `tenant_translation_overrides` [PLANNED] uses `tenant_id` for tenant-scoped customizations via overlay pattern. Bundle generation merges global + tenant overrides. See [04-Data-Model.md §2.7](04-Data-Model.md), [01-PRD.md FR-15](01-PRD.md), [06-API-Contract.md §3.6-3.11](06-API-Contract.md). |

### API Design

| ID | Condition | Status | Evidence |
|----|-----------|--------|----------|
| API-01 | `/v1/` prefix alignment | **RESOLVED** | All controllers use `/api/v1/` prefix. LLD docs need update (showed `/api/` without version). |
| API-02 | Preview-to-commit token | **RESOLVED** | `DictionaryService.java` stores preview token in Valkey with 30-min TTL. Commit validates token. |
| API-03 | 409/422 error responses | **RESOLVED** | `GlobalExceptionHandler` returns structured error responses with HTTP status codes. |

### Infrastructure

| ID | Condition | Status | Evidence |
|----|-----------|--------|----------|
| INF-01 | 50-version retention cleanup | **OPEN** | No `@Scheduled` cleanup method exists in `DictionaryService.java`. Needs implementation: query versions ordered by `version_number DESC`, delete beyond 50th. |
| INF-02 | Snapshot excluded from list | **RESOLVED** | DTO projection in version list excludes `snapshot_data` field. Only loaded in detail/rollback endpoints. |
| INF-03 | Cache invalidation on commit | **RESOLVED** | `DictionaryService.java` deletes Valkey keys `bundle:*` on every commit (edit, import, rollback). |
| INF-04 | Kafka topic creation | **DEFERRED** | Initial implementation uses REST call to audit-service for audit logging. Kafka integration deferred to future sprint. |

### Security

| ID | Condition | Status | Evidence |
|----|-----------|--------|----------|
| SEC-01 | `.permitAll()` for public endpoints | **RESOLVED** | [SecurityConfig.java](backend/localization-service/src/main/java/com/ems/localization/config/SecurityConfig.java) — `/api/v1/locales/active`, `/api/v1/locales/detect`, `/api/v1/locales/*/bundle` are `.permitAll()`. |
| SEC-02 | JWT user_id extraction | **RESOLVED** | [UserLocaleController.java](backend/localization-service/src/main/java/com/ems/localization/controller/UserLocaleController.java) extracts `sub` claim from JWT for user preference. |
| SEC-04 | CSV injection + file size limit | **OPEN** | CSV injection validation (reject `=`, `+`, `-`, `@` prefixed values) and 10MB file size limit not yet implemented in `DictionaryService.java`. |
| SEC-05 | XSS sanitization on translation values | **OPEN** | Translation values stored/returned as-is. No server-side sanitization rejects `<script>`, `<iframe>`, `javascript:`, `on*=` patterns. See [00-Benchmark-Report.md Gap SEC-01](../Design/00-Benchmark-Report.md). Fix: add regex validation on save in `DictionaryService.java` and `TenantOverrideService.java` [PLANNED]. |

### UX / Docs

| ID | Condition | Status | Resolution |
|----|-----------|--------|------------|
| UX-01 | React references in LLD | **RESOLVED** | Original LLD file deleted (superseded by Design/ docs). All Design/ docs correctly reference Angular 21. See [03-LLD-Corrections.md Fix 1](03-LLD-Corrections.md). |
| OAS-01 | OpenAPI 3.1 specification | **OPEN** | No `openapi.yaml` exists for localization-service. Needs generation from controller annotations or manual authoring. |

---

## Priority for Resolution

| Priority | IDs | Effort |
|----------|-----|--------|
| **P1 (Sprint 1)** | GW-03, INF-01, SEC-04 | Code fixes — 8 SP total |
| **P2 (Sprint 1)** | UX-01 | LLD document fix |
| **P3 (Sprint 2)** | SB-02, OAS-01 | Documentation updates |

---

## Changelog

| Version | Date | Changes |
|---------|------|---------|
| 3.0.0 | 2026-03-11 | TOGAF alignment: resolved SB-02 (VR-04 documented); added SEC-05 (XSS sanitization); resolution rate 63%→64% (16/25) |
| 2.0.0 | 2026-03-11 | Updated DM-04 for tenant overlay pattern (v3.0); resolved UX-01 (LLD deleted, Design/ docs correct); resolution rate 58%→63% |
| 1.0.0 | 2026-03-11 | Initial tracker — 24 conditions, 14 resolved, 7 open, 3 arch decisions |
