# ADR-014 / ADR-015 Resolution Analysis

**Date:** 2026-02-27
**Author:** ARCH Agent
**Purpose:** Resolve the tension between ADR-014 (RBAC + Licensing Integration) and ADR-015 (On-Premise Cryptographic Licensing) by clarifying what survives, what is superseded, what conflicts, and what remains undecided.

---

## 1. Executive Summary

ADR-014 and ADR-015 address **different architectural concerns** that overlap in the licensing domain:

- **ADR-014** defines the **authorization architecture** -- how RBAC (roles) and licensing (features) interact at runtime to control user access. It answers: "Given that a user has a role AND a tenant has a license, how does the system decide what is allowed?"

- **ADR-015** defines the **license provisioning and validation mechanism** -- how licenses are created, delivered, imported, stored, and validated. It answers: "How do licenses get into the system, and how is their authenticity and validity verified?"

These are **complementary**, not competing. The confusion arises because ADR-014 was written assuming a SaaS data model (Starter/Pro/Enterprise products with pricing), and ADR-015 replaces that data model with a cryptographic file-based model. The authorization PATTERN from ADR-014 survives intact; the data MODEL it assumed does not.

**Recommendation:** Keep as two complementary ADRs. Update ADR-014 to status "Accepted (Amended by ADR-015)" and update ADR-015 to status "Proposed" (advancing toward Accepted). Do NOT merge them -- they address different concerns and different audiences.

---

## 2. What from ADR-014 SURVIVES (Unchanged)

These decisions from ADR-014 are deployment-model-agnostic and remain fully in effect regardless of whether licensing is SaaS or on-premise:

| ADR-014 Decision | Section | Why It Survives |
|------------------|---------|-----------------|
| **Hybrid authorization: License gates features, Roles gate operations** | Decision, Option C | This is an authorization pattern, not a provisioning pattern. Whether features come from a database seed or a signed license file, the enforcement logic is the same. |
| **Master tenant gets implicit unlimited features** | Section 2 | Master tenant exemption applies in both SaaS and on-premise. Already implemented via `RealmResolver.isMasterTenant()` bypass in `AuthServiceImpl`. |
| **Features returned in auth response, NOT in the JWT** | Section 3 | The delivery mechanism (auth response payload) is independent of where features are sourced. |
| **Feature refresh on token refresh** | Section 5 | Timing of feature state propagation to the frontend is unchanged. |
| **Frontend `featureGuard` and `featureDirective`** [PLANNED] | Section 4 | Frontend enforcement mechanisms are authorization concerns, not provisioning concerns. |
| **Backend `@FeatureGate` annotation** [PLANNED] | Section 4 | Backend enforcement mechanism is unchanged. |
| **`FeatureGateServiceImpl` with Valkey cache (5-min TTL)** | Section 5 | The caching pattern survives. Only the data SOURCE changes (from seeded `license_features` rows to parsed license file features). |
| **Existing `SeatValidationServiceImpl` with Valkey cache** | Section 5 | The pattern survives. Extended in ADR-015 to validate per-tier seat counts instead of a single `total_seats`. |
| **5-chain `DynamicBrokerSecurityConfig`** | Section 4 | RBAC enforcement in auth-facade is completely unchanged. |
| **Neo4j role graph with `INHERITS_FROM` inheritance** | Section 4 | RBAC data model is orthogonal to licensing model. |
| **API Gateway route for `/api/v1/features/**`** [PLANNED] | Section 7 | Still needed. The feature-gate API exists but has no gateway route. |
| **Circuit breaker for license-service calls** | Risks | Resilience pattern is deployment-model-agnostic. |
| **12 feature keys** (basic_workflows, advanced_reports, etc.) | Section 6 | The feature vocabulary survives. What changes is that these keys are no longer statically seeded but come from the license file. ADR-015 uses the same keys in its example payload. |

**Verification against code:**

| Component | File | Status |
|-----------|------|--------|
| `DynamicBrokerSecurityConfig` | `/backend/auth-facade/src/main/java/com/ems/auth/config/DynamicBrokerSecurityConfig.java` | [IMPLEMENTED] |
| `FeatureGateServiceImpl` | `/backend/license-service/src/main/java/com/ems/license/service/FeatureGateServiceImpl.java` | [IMPLEMENTED] |
| `SeatValidationServiceImpl` | `/backend/license-service/src/main/java/com/ems/license/service/SeatValidationServiceImpl.java` | [IMPLEMENTED] |
| `FeatureGateController` | `/backend/license-service/src/main/java/com/ems/license/controller/FeatureGateController.java` | [IMPLEMENTED] |
| `SeatValidationController` | `/backend/license-service/src/main/java/com/ems/license/controller/SeatValidationController.java` | [IMPLEMENTED] |
| Master tenant bypass | `AuthServiceImpl.java` line 48: `!RealmResolver.isMasterTenant(tenantId)` | [IMPLEMENTED] |
| Frontend `featureGuard` | Does not exist yet | [PLANNED] |
| Backend `@FeatureGate` | Does not exist yet | [PLANNED] |
| API Gateway route for `/api/v1/features/**` | Not in `RouteConfig.java` | [PLANNED] |

---

## 3. What ADR-015 REPLACES (Superseded from ADR-014)

These specific assumptions in ADR-014 are invalidated by ADR-015's on-premise pivot:

| ADR-014 Assumption | Where in ADR-014 | What ADR-015 Replaces It With | Impact |
|--------------------|------------------|-------------------------------|--------|
| "Multi-tenant SaaS platform" | Context, line 10 | "On-premise enterprise application" | Framing change. All references to "SaaS" in ADR-014 are now incorrect. |
| Three products: Starter ($9.99/mo), Pro ($29.99/mo), Enterprise ($99.99/mo) | Context, Section 6 | License-file-defined entitlements per tenant. No fixed product tiers. No pricing in the application. | The product catalog concept is eliminated. Each tenant gets a bespoke feature set from the license file. |
| `LicenseProductEntity` with `monthlyPrice`, `annualPrice` fields | Implementation Evidence | Repurposed as user tier definitions (Tenant-Admin, Power User, Contributor, Viewer). Pricing fields removed. | Database schema change. Existing entity needs migration. |
| `TenantLicenseEntity` with `billingCycle`, `autoRenew` fields | Implementation Evidence | Fields removed. Validity comes from signed license file. New `license_file_id` FK added. | Database schema change. |
| Features seeded in `V1__licenses.sql` (12 features across 3 products) | Implementation Evidence | Features are dynamic per license file import. No static seed data. | Seed data becomes irrelevant for production. May remain for development/testing. |
| `UserLicenseAssignmentEntity` has no tier concept | Implementation Evidence | New `tier` field (TENANT_ADMIN, POWER_USER, CONTRIBUTOR, VIEWER) added. | Entity change. |
| Feature staleness "up to 5 minutes" is the only timing concern | Consequences | License state transitions (ACTIVE -> GRACE -> EXPIRED) add a new timing dimension checked daily by scheduler and on startup. | New operational concern. |

### Impact on Existing Code

The following files in the current codebase will need modification if ADR-015 is accepted:

| File | Current State | Required Change |
|------|--------------|-----------------|
| `/backend/license-service/src/main/java/com/ems/license/entity/LicenseProductEntity.java` | Has `monthlyPrice` (BigDecimal), `annualPrice` (BigDecimal) | Remove pricing fields. Repurpose as user tier definitions. |
| `/backend/license-service/src/main/java/com/ems/license/entity/TenantLicenseEntity.java` | Has `billingCycle` (String, default "MONTHLY"), `autoRenew` (Boolean, default true) | Remove `billingCycle`, `autoRenew`. Add `licenseFileId` FK. |
| `/backend/license-service/src/main/java/com/ems/license/entity/UserLicenseAssignmentEntity.java` | No `tier` field. Has `enabledFeatures`/`disabledFeatures` JSONB. | Add `tier` enum field. Feature overrides pattern may change. |
| `/backend/license-service/src/main/resources/db/migration/V1__licenses.sql` | Seeds 3 products with pricing, 12 features across products. | Leave untouched (Flyway immutability). New migration `V3__on_premise_licensing.sql` will alter schema. |
| `/backend/license-service/src/main/java/com/ems/license/service/SeatValidationServiceImpl.java` | Validates against single `totalSeats` per `TenantLicenseEntity`. | Must validate per-tier seat counts (Tenant-Admin: N, Power User: M, etc.). |
| `/backend/license-service/src/main/java/com/ems/license/service/FeatureGateServiceImpl.java` | Reads features from `LicenseFeatureEntity` rows joined through `TenantLicenseEntity` -> `LicenseProductEntity`. | Feature source changes to parsed license file payload. The Valkey caching and check logic remain, but the data access path changes. |

---

## 4. Contradictions and Gaps

### 4.1 Direct Contradictions

| # | Contradiction | ADR-014 Says | ADR-015 Says | Resolution Needed |
|---|---------------|--------------|--------------|-------------------|
| C1 | **User tier model vs. product model** | Features are gated by product tier (Starter/Pro/Enterprise). A tenant subscribes to ONE product, getting its feature set. | Features are listed explicitly per tenant in the license file. There are no "products" -- each tenant gets a bespoke feature list. Additionally, users have tiers (Tenant-Admin, Power User, Contributor, Viewer) that map to roles, not features. | **ADR-015 wins.** The product-tier concept is eliminated. Features are per-tenant, not per-product. User tiers gate seat counts and role mapping, not feature access. ADR-014's Section 6 "Feature Flag Architecture" table (mapping feature keys to "License Tier") must be rewritten to map features to "included in license file or not." |
| C2 | **Feature override mechanism** | `UserLicenseAssignmentEntity` has `enabledFeatures`/`disabledFeatures` JSONB columns allowing per-user feature overrides. | ADR-015 does not mention per-user feature overrides. The license file defines features at the tenant level only. User tiers control seat allocation, not feature access. | **Gap.** ADR-015 must either explicitly preserve or explicitly remove per-user feature overrides. If overrides are removed, the `enabledFeatures`/`disabledFeatures` columns and the `hasFeature()` logic in `UserLicenseAssignmentEntity` become dead code. |
| C3 | **SaaS terminology in requirements** | RBAC-LICENSING-REQUIREMENTS.md (Section 1.1) describes EMSIST as a "multi-tenant SaaS platform." | ON-PREMISE-LICENSING-REQUIREMENTS.md (Section 1.1) says EMSIST is "transitioning from a SaaS-only model to an on-premise enterprise application." | **The requirements documents contradict each other.** REQ-RBAC-001 must be updated to remove SaaS-specific language while preserving the RBAC+feature hybrid pattern. |

### 4.2 Gaps (Undecided Questions)

| # | Gap | Description | Which ADR Should Address |
|---|-----|-------------|--------------------------|
| G1 | **Per-user feature overrides in on-premise model** | The current `UserLicenseAssignmentEntity` supports enabling/disabling specific features per user. ADR-015's license file only defines features at the tenant level. Can an admin override features for individual users? If yes, how? If no, this is a capability regression. | ADR-015 (must decide) |
| G2 | **User tier to feature mapping** | ADR-015 defines four user tiers (Tenant-Admin, Power User, Contributor, Viewer) that map to RBAC roles. But ADR-014 says features are per-TENANT, not per-user-tier. Does the tier affect which features the user can access, or only which operations they can perform? | Clarify in both ADRs. Current position: tiers map to roles (operations), features are per-tenant (capabilities). This is consistent but must be stated explicitly. |
| G3 | **Feature key vocabulary governance** | ADR-014 lists 12 specific feature keys. ADR-015 uses the same 12 keys in its example payload. But in the on-premise model, feature keys come from the license file. Who governs the canonical list of feature keys? What happens if a license file references a feature key the application does not recognize? | ADR-015 (must add validation rule) |
| G4 | **License file for development/testing** | The current V1__licenses.sql seeds 3 products and 12 features for development. ADR-015 removes the seed concept. How do developers run locally without a signed license file? Options: (a) dev-mode bypass, (b) test license file committed to repo, (c) license import in test fixtures. | ADR-015 (add section) |
| G5 | **Seat validation response enrichment** | ADR-014 says auth-facade should fetch user features during login and include them in `AuthResponse`. ADR-015 says seat validation should return the tenant's feature list alongside the seat validation response. These are the same intent expressed differently. Which service returns features to auth-facade: is it the seat validation endpoint or a separate feature endpoint? | Reconcile. Both ADRs point to the same outcome but describe it differently. |
| G6 | **`LicenseProductEntity` repurposing** | ADR-015 says `LicenseProductEntity` "becomes the user tier definition." But the current entity has `name`, `displayName`, `description`, `isActive`, `sortOrder`, and a `OneToMany` to `LicenseFeatureEntity`. If products become tiers, what happens to the `LicenseFeatureEntity` relationship? Tiers do not have features -- tenants do. | ADR-015 schema design is incomplete. The DBA agent must design the actual migration, but ARCH must clarify the entity model intent. |
| G7 | **Grace period feature degradation enforcement** | ADR-015 defines `grace.degradedFeatures` in the license file. But the current `FeatureGateServiceImpl` has no awareness of grace periods or degradation. It checks whether a tenant/user has a feature or not -- binary. There is no concept of "feature available in ACTIVE but disabled in GRACE." | ADR-015 (must describe the enforcement mechanism for grace degradation) |
| G8 | **EXPIRED state read-only enforcement** | ADR-015 defines that in EXPIRED state, users can log in and view data but cannot create/edit/delete. There is no existing mechanism for this. `DynamicBrokerSecurityConfig` does not have a "read-only mode." This requires a new cross-cutting concern. | ADR-015 (must describe how read-only mode is enforced across all services) |
| G9 | **Audit event emission** | ADR-015 requires audit events for `LICENSE_IMPORTED`, validation failures, and state transitions. The current audit-service uses PostgreSQL (not Kafka -- no KafkaTemplate exists in the codebase). How does license-service emit audit events to audit-service? Direct REST call? Shared database? | ADR-015 (must describe integration with audit-service) |

### 4.3 Requirements Document Inconsistencies

| Document | Issue | Resolution |
|----------|-------|------------|
| `RBAC-LICENSING-REQUIREMENTS.md` Section 1.1 | Calls EMSIST a "multi-tenant SaaS platform" | Must be updated to reflect on-premise model |
| `RBAC-LICENSING-REQUIREMENTS.md` AC-002c-03 | References "Starter = 3 features, Pro = 7, Enterprise = 12" | Product tiers are eliminated. Feature counts are per-tenant from license file. |
| `RBAC-LICENSING-REQUIREMENTS.md` UC-002c | "Admin subscribes to Pro tier" | No subscription concept in on-premise model. Admin imports license file. |
| `ON-PREMISE-LICENSING-REQUIREMENTS.md` US-003j | "Feature Gate by License Tier" | Feature gating is per-tenant, not per-tier. Tiers map to roles (seats), not features. The user story title is misleading. |
| `ON-PREMISE-LICENSING-REQUIREMENTS.md` Section 4.2 | References "user tiers: Tenant-Admin, Power User, Contributor, Viewer" as distinct from roles | ADR-015 says tiers MAP to roles (Tenant-Admin = ADMIN, Power User = MANAGER, etc.). The requirements doc treats them as separate concepts. Needs clarification: are tiers just seat-count categories that happen to correspond to roles, or are they a new authorization dimension? |

---

## 5. Recommendation: Two Complementary ADRs

### Why NOT Merge

1. **Different audiences.** ADR-014 is read by developers implementing authorization guards and feature checks. ADR-015 is read by developers implementing license import, cryptographic validation, and lifecycle management. Merging would create a 1000+ line document serving two different concerns.

2. **Different lifecycles.** ADR-014's authorization pattern could be accepted and partially implemented (e.g., frontend `featureGuard`) before ADR-015's cryptographic infrastructure is ready. They can proceed in parallel.

3. **Different change frequency.** The authorization pattern (ADR-014) is architecturally stable. The license provisioning mechanism (ADR-015) will evolve as on-premise requirements solidify (key rotation, revocation lists, multi-instance licensing).

### Recommended ADR Structure

```
ADR-014: RBAC and Licensing Integration Architecture
  Status: Accepted (Amended by ADR-015)
  Scope: HOW authorization is enforced (hybrid feature + role model)
  Amended: Remove SaaS-specific language. Note that the data model is
           defined by ADR-015. Authorization pattern is unchanged.

ADR-015: On-Premise Cryptographic License Architecture
  Status: Proposed (advancing to Accepted)
  Scope: HOW licenses are provisioned, imported, validated, and stored
  Depends on: ADR-014 for the authorization enforcement pattern
  Prerequisite: Human escalation items resolved (key management, grace period,
                license file format finalization)
```

### Required Updates to ADR-014

1. Change "SaaS platform" to "multi-tenant platform" throughout.
2. Remove Section 6 "Feature Flag Architecture" table (Starter/Pro/Enterprise mapping). Replace with a note: "Feature availability is determined by the imported license file (see ADR-015). The feature key vocabulary is shared."
3. Add note to Implementation Evidence: "The SaaS data model (pricing, billing_cycle, auto_renew) in the existing code is superseded by ADR-015. These fields will be removed by migration V3."
4. Change status to "Accepted (Amended by ADR-015)."
5. Add explicit cross-reference: "Related: ADR-015 defines the license provisioning mechanism."

### Required Updates to ADR-015

1. Add section on per-user feature overrides (preserve or remove -- G1).
2. Add section on developer/testing workflow without a signed license file (G4).
3. Add validation rule for unrecognized feature keys in license files (G3).
4. Clarify the `LicenseProductEntity` repurposing (G6) or state that a new entity model is required.
5. Describe grace period degradation enforcement mechanism (G7).
6. Describe EXPIRED state read-only enforcement across services (G8).
7. Describe audit event integration (G9).
8. Resolve all human escalation items before advancing to "Accepted."

---

## 6. Concrete Architectural Decisions: Status Summary

### FINAL (Decided, No Ambiguity)

| Decision | Source | Evidence |
|----------|--------|----------|
| **Hybrid authorization: features gate capabilities, roles gate operations** | ADR-014 Option C | Consistent across both ADRs and both requirements docs |
| **Master tenant is exempt from all license validation** | ADR-014 Section 2 + ADR-015 Section 3.6 | Implemented: `AuthServiceImpl.java` line 48 |
| **Features are returned in the auth response, not in the JWT** | ADR-014 Section 3 + ADR-015 Section 3.1 | Both ADRs agree |
| **Existing `FeatureGateServiceImpl` with Valkey 5-min TTL cache is preserved** | ADR-014 Section 5 + ADR-015 Section 3.3 | Implemented: `FeatureGateServiceImpl.java` line 34 |
| **Existing `SeatValidationServiceImpl` with Valkey 5-min TTL cache is preserved** | ADR-014 Section 5 + ADR-015 Section 3.3 | Implemented: `SeatValidationServiceImpl.java` line 35 |
| **license-service is extended, not replaced or split** | ADR-015 Section 4.4 | Existing service at `/backend/license-service/` |
| **License files use Ed25519 signatures** | ADR-015 Section 1.2 | Both ADR-015 and ON-PREMISE-LICENSING-REQUIREMENTS agree |
| **License file format is a two-part (payload + signature) format, NOT JWT** | ADR-015 Section 1.1 | Explicit decision with rationale |
| **Three-tier license hierarchy: Application -> Tenant -> User-Seat** | ADR-015 Section 1.3 + ON-PREMISE-LICENSING-REQUIREMENTS | Both documents agree |
| **Four user tiers: Tenant-Admin, Power User, Contributor, Viewer** | ADR-015 Section 1.5 + ON-PREMISE-LICENSING-REQUIREMENTS Section 4.2 | Both documents agree |
| **User tiers map to RBAC roles: Tenant-Admin=ADMIN, Power User=MANAGER, Contributor=USER, Viewer=VIEWER** | ADR-015 Section 1.5 | Consistent with existing 5-role hierarchy (SUPER_ADMIN excluded as master-only) |
| **SaaS fields (pricing, billing_cycle, auto_renew) are removed from the data model** | ADR-015 Section 4.1 + Section 7 | Explicit decision |
| **RBAC (Neo4j + `DynamicBrokerSecurityConfig`) is unchanged** | ADR-015 Section 4.2 | Explicit statement: "No change to security chains, role converter, or Neo4j graph" |

### NEEDS DECISION (Open Questions)

| Question | Options | Blocking? |
|----------|---------|-----------|
| Per-user feature overrides: preserve or remove? (G1) | (a) Preserve `enabledFeatures`/`disabledFeatures` columns, admin can override at user level. (b) Remove, features are strictly per-tenant from license file. | Yes -- affects entity model and FeatureGateServiceImpl logic |
| User tiers affect features or only seats? (G2) | (a) Tiers only control seat counts; features are per-tenant. (b) Different tiers get different feature subsets. | Yes -- affects authorization model. Current consensus: (a). |
| Feature key vocabulary governance (G3) | (a) Hardcoded in application, license file must match. (b) Application accepts any key, unknown keys ignored. (c) Application validates and rejects unknown keys. | No -- can be decided during implementation |
| Developer workflow without license file (G4) | (a) `application-dev.yml` flag bypasses license checks. (b) Test `.lic` file in `src/test/resources`. (c) Both. | No -- can be decided during implementation |
| Feature delivery path from license-service to auth-facade (G5) | (a) Extend seat validation response to include features. (b) Separate Feign call to `getUserFeatures()`. (c) Both, with seat validation including a feature summary. | No -- implementation detail |
| Grace period feature degradation enforcement (G7) | (a) `LicenseStateHolder` bean injected into `FeatureGateServiceImpl`, which checks state before returning features. (b) A filter/interceptor that blocks degraded features at the gateway level. | Yes -- affects cross-cutting architecture |
| EXPIRED state read-only enforcement (G8) | (a) A servlet filter that rejects all non-GET requests when state is EXPIRED. (b) Per-service `@ConditionalOnLicenseState` annotation. (c) API Gateway filter. | Yes -- affects cross-cutting architecture |
| Audit event integration (G9) | (a) REST call to audit-service. (b) Shared PostgreSQL schema. (c) Future Kafka (not implemented). (d) Spring Application Events (in-process). | No -- can follow existing audit patterns |

### HUMAN ESCALATION REQUIRED (Cannot Be Decided by ARCH)

| Decision | Escalation To | Reason |
|----------|---------------|--------|
| Ed25519 key management procedures (HSM selection, key ceremony) | CISO / Security Board | Cryptographic key lifecycle is security-critical |
| Grace period duration (30 days default) | CTO + Legal | Commercial and contractual implications |
| License file format finalization (schema lock) | CTO + Product | The format is a vendor-customer contract; changes after release are breaking |
| Vendor License Generation Tool scope and timeline | Product + Engineering | Separate deliverable; must be built in parallel |
| SaaS-to-on-premise migration path for existing deployments | CTO + Engineering | If any SaaS deployments exist, they need a migration plan |
| Whether per-user feature overrides survive (G1) | Product Owner | Business capability decision |

---

## 7. Implementation Priority

If both ADRs are accepted, implementation should proceed in this order:

| Priority | Work Item | Dependencies | ADR Source |
|----------|-----------|--------------|------------|
| 1 | **API Gateway route for `/api/v1/features/**`** | None | ADR-014 |
| 2 | **Auth response enrichment** (add `features[]` to login response) | Priority 1 | ADR-014 |
| 3 | **Frontend `FeatureService` + `featureGuard`** | Priority 2 | ADR-014 |
| 4 | **`LicenseFileEntity` + `LicenseImportController` + `LicenseSignatureVerifier`** | None | ADR-015 |
| 5 | **Database migration `V3__on_premise_licensing.sql`** | Priority 4 | ADR-015 |
| 6 | **`LicenseStateHolder` + `LicenseScheduledValidator` + `LicenseHealthIndicator`** | Priority 5 | ADR-015 |
| 7 | **Tier-based seat validation** (extend `SeatValidationServiceImpl`) | Priority 5 | ADR-015 |
| 8 | **Frontend License Import page + License Status dashboard** | Priority 4 | ADR-015 |
| 9 | **Grace period degradation + EXPIRED read-only mode** | Priority 6, G7/G8 resolved | ADR-015 |
| 10 | **Backend `@FeatureGate` annotation** | Priority 2 | ADR-014 |

Priorities 1-3 (ADR-014 authorization pattern) can proceed immediately because they depend only on the existing codebase. Priorities 4-10 (ADR-015 on-premise mechanism) require the human escalation items to be resolved first.

---

## 8. Existing Codebase State (Verified)

For reference, the current state of the license-service codebase as verified by reading source files:

### Entities (PostgreSQL / JPA)

| Entity | Table | SaaS-Specific Fields | On-Premise Readiness |
|--------|-------|---------------------|---------------------|
| `LicenseProductEntity` | `license_products` | `monthlyPrice`, `annualPrice` | Must remove pricing, repurpose as tier definitions |
| `LicenseFeatureEntity` | `license_features` | `isCore` flag (SaaS concept of "core" vs "addon") | May be obsolete if features come from license file |
| `TenantLicenseEntity` | `tenant_licenses` | `billingCycle`, `autoRenew` | Must remove billing fields, add `licenseFileId` |
| `UserLicenseAssignmentEntity` | `user_license_assignments` | `enabledFeatures`/`disabledFeatures` (JSONB) | Pending G1 decision. Must add `tier` field. |

### Services

| Service | What It Does | On-Premise Impact |
|---------|-------------|-------------------|
| `FeatureGateServiceImpl` | Checks feature access per tenant/user with Valkey cache | Data source changes. Logic preserved. |
| `SeatValidationServiceImpl` | Validates user has active seat in tenant with Valkey cache | Must be extended for per-tier seat validation. |
| `LicenseProductServiceImpl` | CRUD for products | May be repurposed for tier definitions. |
| `TenantLicenseServiceImpl` | CRUD for tenant licenses | Must integrate with license file import. |
| `UserLicenseServiceImpl` | CRUD for user license assignments | Must add tier awareness. |

### Controllers

| Controller | Path | Consumers | On-Premise Impact |
|------------|------|-----------|-------------------|
| `FeatureGateController` | `/api/v1/features/**` | None (no gateway route, no callers) | Must add gateway route. Otherwise unchanged. |
| `SeatValidationController` | `/api/v1/internal/seats/**` | `auth-facade` via Feign | May extend response to include features. |
| `LicenseProductController` | `/api/v1/products/**` | Unknown | May be repurposed. |
| `TenantLicenseController` | `/api/v1/licenses/**` | Unknown | Must integrate with import flow. |
| `UserLicenseController` | `/api/v1/licenses/assignments/**` | Unknown | Must add tier parameter. |

### Seed Data

`V1__licenses.sql` seeds:
- 3 products: EMSIST_STARTER, EMSIST_PRO, EMSIST_ENTERPRISE (with pricing)
- 12 features across the 3 products (Starter: 3, Pro: 7, Enterprise: 12)

In the on-premise model, this seed data is irrelevant for production but potentially useful for development/testing (pending G4 decision).

---

## 9. Summary of Required Actions

| # | Action | Owner | Priority |
|---|--------|-------|----------|
| 1 | Update ADR-014 status to "Accepted (Amended by ADR-015)" and remove SaaS-specific content | ARCH | Immediate |
| 2 | Update ADR-015 to address gaps G1-G9 identified in this analysis | ARCH | Before ARB review |
| 3 | Update `RBAC-LICENSING-REQUIREMENTS.md` to remove SaaS-specific language | BA | Before implementation |
| 4 | Resolve human escalation items (key management, grace period, format lock) | CTO/CISO/Product | Before ADR-015 acceptance |
| 5 | Update `docs/adr/README.md` index to include ADR-015 | ARCH | Immediate |
| 6 | Update arc42 sections (03, 04, 05, 06, 08) after both ADRs accepted | ARCH | After acceptance |
| 7 | Begin implementation of ADR-014 priorities 1-3 (gateway route, auth response, frontend guard) | SA + DEV | Can start now |
| 8 | Begin implementation of ADR-015 priorities 4-8 after human escalation resolved | SA + DEV | After acceptance |
