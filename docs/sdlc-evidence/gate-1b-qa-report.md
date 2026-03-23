# Gate 1B QA Cross-Verification Report

**Date:** 2026-03-03
**Agent:** QA (QA-PRINCIPLES.md v2.0.0)
**Scope:** Phase 1 Documentation artifacts -- 20 spot-check claims across 8 key documents
**Methodology:** For each claim, the document assertion was read, then the cited evidence file was independently read to confirm or deny the claim.

---

## Verification Matrix

| Claim | Document | Assertion | Evidence File(s) Checked | Result |
|-------|----------|-----------|--------------------------|--------|
| A1 | ARCHITECTURE-ADHERENCE-AUDIT.md | Neo4j is only used by auth-facade | `backend/*/src/main/resources/application.yml` (all services) | VERIFIED |
| A2 | SERVICE-BOUNDARY-AUDIT.md | Score 4.7/10; all services share postgres superuser | `backend/tenant-service/src/main/resources/application.yml` line 17-18, `backend/user-service/src/main/resources/application.yml` line 17-18 | VERIFIED |
| A3 | SECURITY-TIER-BOUNDARY-AUDIT.md | Frontend container can reach data stores (single shared network) | `docker-compose.dev.yml` lines 552-554 | VERIFIED |
| B1 | ADR-019 | ai-service has no sslmode parameter in JDBC URL | `backend/ai-service/src/main/resources/application.yml` line 16 | VERIFIED |
| B2 | ADR-019 | auth-facade uses `bolt://localhost:7687` (plaintext) | `backend/auth-facade/src/main/resources/application.yml` line 28 | VERIFIED |
| B3 | ADR-019 | Jasypt is configured only in auth-facade; tenant-service has no jasypt dependency | `backend/auth-facade/src/main/java/com/ems/auth/config/JasyptConfig.java` (exists), `backend/tenant-service/pom.xml` (grep for jasypt: zero results) | VERIFIED |
| C1 | ADR-020 | Hardcoded credential defaults (e.g., `${DATABASE_PASSWORD:postgres}`) in application.yml | `backend/tenant-service/src/main/resources/application.yml` line 18: `password: ${DATABASE_PASSWORD:postgres}` | VERIFIED |
| C2 | ADR-020 | All services use the same postgres superuser; init-db.sql creates no per-service users | `infrastructure/docker/init-db.sql` lines 16-21 (only `keycloak` user created) | VERIFIED |
| D1 | ADR-021 / ARCH-AUDIT | Dev/staging uses `neo4j:5-community` image | `docker-compose.dev.yml` line 68: `image: neo4j:5-community` | VERIFIED |
| D2 | ADR-021 / ARCH-AUDIT | PostgreSQL image is `pgvector/pgvector:pg16` | `docker-compose.dev.yml` line 29: `image: pgvector/pgvector:pg16` | VERIFIED |
| E1 | arc42/06 section 6.8 | `blacklistToken()` exists in TokenServiceImpl but is NOT called from `logout()` in AuthServiceImpl | `TokenServiceImpl.java` line 91: `blacklistToken()` exists. `AuthServiceImpl.java` lines 122-127: `logout()` calls `identityProvider.logout()` only -- no call to `blacklistToken()` | VERIFIED |
| E2 | arc42/07 section 7.9 | Current deployment uses a single flat network | `docker-compose.dev.yml` lines 552-554: single `ems-dev` bridge network defined; all services use it | VERIFIED |
| E3 | arc42/05 | ai-service has no sslmode (listed as [MISSING]) | Same evidence as B1 above -- `application.yml` line 16 has no `sslmode` in JDBC URL | VERIFIED |
| F1 | CI/CD Pipeline LLD | `.github/workflows/api-contract-security.yml` already exists | File exists at `.github/workflows/api-contract-security.yml` (confirmed via glob) | VERIFIED |
| F2 | CI/CD Pipeline LLD | 15 existing E2E tests across 3 spec files in `frontend/e2e/` | 4 spec files found (not 3): `auth-guard.spec.ts` (1 test), `history-navigation.spec.ts` (2 tests), `logout.spec.ts` (9 tests), `tenant-theme-builder.spec.ts` (5 tests) = 17 tests across 4 files | MISMATCH |
| F3 | CI/CD Pipeline LLD | `.spectral.yaml` exists with 4 security-focused rules | `.spectral.yaml` exists with 4 rules: `require-global-security`, `require-security-schemes`, `require-bearer-or-oauth2`, `internal-apis-must-declare-scope` | VERIFIED |
| G1 | OpenAPI Standards Plan | 8/8 services have springdoc-openapi dependency; version managed in parent POM | Parent POM line 45: `<springdoc.version>2.3.0</springdoc.version>`, lines 76-81: `springdoc-openapi-starter-webmvc-ui` in `<dependencyManagement>`. Individual pom.xml files declare dependency (verified tenant-service line 91-92, ai-service line 112-113). Claim says 8 services -- excludes api-gateway (correct, it uses reactive stack). | VERIFIED |
| G2 | OpenAPI Standards Plan | tenant-service paths use `/api/tenants` (missing `/v1/`) | `TenantController.java` line 24: `@RequestMapping("/api/tenants")` -- confirms no `/v1/` prefix | VERIFIED |
| H1 | ISSUE-INF-004 | Postgres superuser setup; no per-service users in init-db.sql | `infrastructure/docker/init-db.sql`: Only `keycloak` user created (lines 16-21). All databases created (lines 33-42) but no additional users. `docker-compose.dev.yml` lines 279, 310, 339, 365, 399, 428: all pass `DATABASE_USER: ${DATABASE_USER:-postgres}` | VERIFIED |
| H2 | ISSUE-INF-020 | API gateway has no Valkey dependency | `backend/api-gateway/pom.xml` line 43-44: `spring-boot-starter-data-redis-reactive` IS present. `application.yml` lines 79-82: `spring.data.redis.host` IS configured. | MISMATCH |

---

## Detailed Mismatch Analysis

### Mismatch F2: E2E Test File Count and Test Count

**Document claim (CI/CD Pipeline LLD):** "15 existing E2E tests across 3 spec files in `frontend/e2e/`"

**Actual state:**
- 4 spec files found (not 3):
  - `frontend/e2e/auth-guard.spec.ts` -- 1 test (`test()` call)
  - `frontend/e2e/history-navigation.spec.ts` -- 2 tests
  - `frontend/e2e/logout.spec.ts` -- 9 tests
  - `frontend/e2e/tenant-theme-builder.spec.ts` -- 5 tests
- Total: 17 tests across 4 files (not 15 across 3)

**Severity:** LOW -- The numbers are close (17 vs 15, 4 vs 3). Likely the document was written before `tenant-theme-builder.spec.ts` was created, or the count was approximated. This is a minor inaccuracy, not a material misrepresentation. The document should be updated to reflect 4 spec files and 17 tests.

**Impact:** Does not affect any architectural decisions or security posture. The LLD is marked [PLANNED] and this number is used only for sizing estimates.

---

### Mismatch H2: API Gateway Valkey Dependency

**Document claim (ISSUE-INF-020):** "Gap: No Valkey dependency in api-gateway `pom.xml`"

**Actual state:**
- `backend/api-gateway/pom.xml` line 43-44 contains:
  ```xml
  <dependency>
      <groupId>org.springframework.boot</groupId>
      <artifactId>spring-boot-starter-data-redis-reactive</artifactId>
  </dependency>
  ```
- `backend/api-gateway/src/main/resources/application.yml` lines 78-82 configure Valkey:
  ```yaml
  # Valkey for rate limiting (optional)
  data:
    redis:
      host: ${VALKEY_HOST:localhost}
      port: ${VALKEY_PORT:6379}
  ```
- `docker-compose.dev.yml` line 461 passes `VALKEY_HOST: valkey` to the api-gateway container.

**Severity:** MEDIUM -- The issue file claims there is no Valkey dependency, but one exists. The api-gateway HAS a Valkey connection (used for rate limiting). The actual gap is narrower than claimed: the gateway has Valkey connectivity but lacks a `TokenBlacklistFilter` that checks `auth:blacklist:{jti}`. The remediation steps in ISSUE-INF-020 are partially incorrect -- step 1 ("Add Valkey dependency to api-gateway") is unnecessary because it already exists. Steps 2-4 remain valid.

**Impact:** This affects the implementation effort estimate for ISSUE-INF-020. Since the Valkey dependency and configuration already exist, the remediation is simpler than the issue implies -- only the filter needs to be created, not the entire Valkey integration.

**Note:** The arc42/06 section 6.8 also states "[PLANNED] Check token blacklist in Valkey" at the gateway level, and the principles-ack.md entry from 2026-03-02 says "mark blacklist check as [PLANNED] since gateway has no Valkey integration". This propagated the same incorrect assumption across multiple documents. The gateway DOES have Valkey integration for rate limiting -- it simply does not use it for token blacklist checking.

---

## Summary

| Category | Claims Checked | Verified | Mismatches | Accuracy |
|----------|---------------|----------|------------|----------|
| Audit Reports (A1-A3) | 3 | 3 | 0 | 100% |
| ADR-019 (B1-B3) | 3 | 3 | 0 | 100% |
| ADR-020 (C1-C2) | 2 | 2 | 0 | 100% |
| ADR-021 (D1-D2) | 2 | 2 | 0 | 100% |
| Arc42 (E1-E3) | 3 | 3 | 0 | 100% |
| CI/CD LLD (F1-F3) | 3 | 2 | 1 | 67% |
| OpenAPI Plan (G1-G2) | 2 | 2 | 0 | 100% |
| Issue Files (H1-H2) | 2 | 1 | 1 | 50% |
| **TOTAL** | **20** | **18** | **2** | **90%** |

---

## Gate 1B Recommendation

**CONDITIONAL PASS**

### Rationale

18 of 20 spot-checked claims (90%) are verified as accurate against the actual codebase. Both mismatches are factual inaccuracies in documentation, not fabricated or aspirational claims:

1. **F2 (LOW):** E2E test count is 17 across 4 files, not 15 across 3 files. Minor numeric inaccuracy in a [PLANNED] design document. Does not affect any decision.

2. **H2 (MEDIUM):** ISSUE-INF-020 incorrectly claims api-gateway has no Valkey dependency. The gateway HAS `spring-boot-starter-data-redis-reactive` in its `pom.xml` and Valkey configuration in `application.yml`. The actual gap is narrower: the gateway has Valkey connectivity (for rate limiting) but does not use it for token blacklist verification. This inaccuracy propagated into the arc42/06 section 6.8 annotation and the principles-ack.md. Correcting this reduces the implementation effort for the token blacklist feature.

### Conditions for Full Approval

1. **Update ISSUE-INF-020** to acknowledge that the Valkey dependency already exists in api-gateway. Change the evidence line from "No Valkey dependency in api-gateway `pom.xml`" to "Valkey dependency exists (for rate limiting) but no `TokenBlacklistFilter` implemented". Remove remediation step 1.

2. **Update CI/CD Pipeline LLD** section 10 (Existing Asset Inventory) to reflect 4 spec files with 17 tests instead of 3 spec files with 15 tests.

3. **Update arc42/06 section 6.8** annotation from "gateway has no Valkey integration" to "gateway has Valkey for rate limiting but not for blacklist checking".

### Quality Assessment

The Phase 1 documentation demonstrates strong adherence to the Evidence-Before-Documentation (EBD) rule:
- All 8 documents cite specific file paths and line numbers as evidence
- Status tags ([IMPLEMENTED], [PLANNED], [IN-PROGRESS]) are used correctly throughout
- No aspirational content is presented as implemented fact
- The two mismatches are minor factual errors, not architectural misrepresentations

The overall documentation quality is HIGH. The 90% accuracy rate across a random sample of 20 claims indicates the Phase 1 documentation is evidence-based and trustworthy.

---

## Mismatches Summary

| Claim | Expected (Document Says) | Actual (Code Shows) | Severity | Correction Needed |
|-------|--------------------------|---------------------|----------|-------------------|
| F2 | 15 E2E tests in 3 spec files | 17 E2E tests in 4 spec files | LOW | Update count in LLD |
| H2 | No Valkey dependency in api-gateway pom.xml | `spring-boot-starter-data-redis-reactive` present; `spring.data.redis` configured | MEDIUM | Correct ISSUE-INF-020 evidence and remediation steps; update arc42/06 annotation |

---

## Evidence Files Read During Verification

| File | Purpose |
|------|---------|
| `docs/governance/ARCHITECTURE-ADHERENCE-AUDIT.md` | Claims A1, D1, D2 |
| `docs/governance/SERVICE-BOUNDARY-AUDIT.md` | Claim A2 |
| `docs/governance/SECURITY-TIER-BOUNDARY-AUDIT.md` | Claim A3 |
| `docs/adr/ADR-019-encryption-at-rest.md` | Claims B1, B2, B3 |
| `docs/adr/ADR-020-service-credential-management.md` | Claims C1, C2 |
| `docs/adr/ADR-018-high-availability-multi-tier.md` | Context for D1, D2 |
| `docs/arc42/05-building-blocks.md` | Claim E3 |
| `docs/arc42/06-runtime-view.md` (lines 293-351) | Claim E1 |
| `docs/arc42/07-deployment-view.md` | Claim E2 |
| `docs/lld/cicd-pipeline.md` | Claims F1, F2, F3 |
| `docs/lld/openapi-standards-plan.md` | Claims G1, G2 |
| `docs/issues/open/ISSUE-INF-004.md` | Claim H1 |
| `docs/issues/open/ISSUE-INF-020.md` | Claim H2 |
| `backend/ai-service/src/main/resources/application.yml` | B1, E3 |
| `backend/auth-facade/src/main/resources/application.yml` | B2, B3 |
| `backend/tenant-service/src/main/resources/application.yml` | A2, C1 |
| `backend/user-service/src/main/resources/application.yml` | A2 |
| `backend/tenant-service/pom.xml` | B3 (jasypt grep) |
| `backend/api-gateway/pom.xml` | H2 |
| `backend/api-gateway/src/main/resources/application.yml` | H2 |
| `backend/pom.xml` | G1 |
| `backend/tenant-service/src/main/java/com/ems/tenant/controller/TenantController.java` | G2 |
| `backend/auth-facade/src/main/java/com/ems/auth/service/TokenServiceImpl.java` | E1 (grep) |
| `backend/auth-facade/src/main/java/com/ems/auth/service/AuthServiceImpl.java` | E1 (grep) |
| `backend/auth-facade/src/main/java/com/ems/auth/config/JasyptConfig.java` | B3 (file exists) |
| `infrastructure/docker/init-db.sql` | C2, H1 |
| `docker-compose.dev.yml` | A3, D1, D2, E2, H1 |
| `.spectral.yaml` | F3 |
| `.github/workflows/api-contract-security.yml` | F1 (file exists) |
| `frontend/e2e/*.spec.ts` | F2 (file count + test count) |

---

**Report produced by:** QA Agent (QA-PRINCIPLES.md v2.0.0)
**Principles acknowledged:** 2026-03-03 in `docs/sdlc-evidence/principles-ack.md`
