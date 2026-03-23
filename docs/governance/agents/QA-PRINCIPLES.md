# QA Agent Principles v2.0

## Version

- **Version:** 2.0.0
- **Last Updated:** 2026-02-27
- **Changelog:** [See bottom of document](#changelog)

---

## MANDATORY (Read Before Any Work)

These rules are NON-NEGOTIABLE. QA agent MUST follow them.

1. **Verify documentation claims against actual code** - Every documented feature must be verified by reading source code
2. **Report discrepancies with evidence** - All discrepancies documented with file paths, line numbers, and code snippets
3. **Use defect severity levels** - All defects classified as CRITICAL, HIGH, MEDIUM, or LOW
4. **Provide verification audit tables** - Every verification task produces a traceable audit table
5. **Test pyramid adherence** - More unit tests, fewer E2E tests (70/20/10 ratio)
6. **80% code coverage minimum** - Unit test coverage target for all services
7. **BA acceptance criteria are tests** - Every Given/When/Then becomes a test case
8. **Test isolation** - Tests must not depend on each other or external state
9. **Testcontainers for integration** - No external dependencies for integration tests
10. **Multi-tenancy tested** - Verify tenant isolation in all tests
11. **Environment-aware testing** - Know which tests run in Dev vs Build/CI vs Staging vs Prod
12. **Tests must be EXECUTED, not just written** - Provide test execution output as evidence

---

## Test Frameworks (EMSIST Stack)

| Layer | Backend | Frontend |
|-------|---------|----------|
| Unit | JUnit 5 + Mockito | **Vitest** + Angular TestBed |
| Component | - | **Vitest** + PrimeNG Harness |
| Integration | Testcontainers + MockMvc | - |
| Contract | Spring Cloud Contract / Pact | - |
| E2E | - | Playwright |
| Responsive | - | Playwright (viewport configs) |
| Accessibility | - | Playwright + @axe-core/playwright |
| Performance | k6 / Gatling | Lighthouse |
| Security | OWASP ZAP | OWASP ZAP |

**IMPORTANT:** Frontend uses **Vitest** (NOT Jasmine/Karma). Use `vi.fn()` not `jasmine.createSpy()`.

---

## Environment-Aware Test Matrix

Tests are organized by the environment where they execute. The QA coordinator must ensure the right tests run at the right stage.

### Development Environment (Local)

Tests that developers run on their machines during development.

| Test Type | Agent | Tools | Trigger | Gate |
|-----------|-------|-------|---------|------|
| Unit Tests (Backend) | `qa-unit` | JUnit 5, Mockito, JaCoCo | Every code change | 80% line / 75% branch coverage |
| Unit Tests (Frontend) | `qa-unit` | Vitest, Angular TestBed, `vi.fn()` | Every code change | 80% line coverage |
| Component Tests (FE) | `qa-unit` | Vitest + PrimeNG harness, DOM rendering | Component changes | Component renders correctly |
| Integration Tests (API) | `qa-int` | Testcontainers (PostgreSQL, Neo4j, Valkey), MockMvc | API changes | All endpoints return expected responses |

### Build / CI Pipeline

Automated tests that run on every push in GitHub Actions. Fast feedback loop.

| Test Type | Agent | Tools | Trigger | Gate |
|-----------|-------|-------|---------|------|
| Linting (FE) | `devops` | ESLint, `ng lint` | Every push | Zero lint errors |
| Linting (BE) | `devops` | Checkstyle, SpotBugs | Every push | Zero violations |
| SAST | `sec` | SonarQube, Semgrep | Every push | No CRITICAL/HIGH findings |
| SCA | `sec` | OWASP dependency-check, `npm audit` | Every push | No known CVEs (CRITICAL/HIGH) |
| Container Scanning | `sec` | Trivy, Docker Scout | Image build | No CRITICAL vulnerabilities |
| Unit Tests (re-run) | `qa-unit` | Same as Dev | Every push | All pass, coverage gates met |
| Contract Tests | `qa-int` | Spring Cloud Contract / Pact | API schema change | Consumer-provider contracts valid |
| BVT (Build Verification) | `qa-reg` | ~20 critical-path tests | Every push | All critical paths pass |

**Pipeline order:** Lint → SAST/SCA → Unit → Container Scan → Contract → BVT → Deploy to Staging

### Staging Environment

Tests that run against deployed services in a staging environment.

| Test Type | Agent | Tools | Trigger | Gate |
|-----------|-------|-------|---------|------|
| Smoke Tests | `qa-reg` | Playwright critical-path subset | Every staging deploy | Login → Navigate → Core feature works |
| Functional E2E | `qa-int` | Playwright, `page.route()` interception | Deploy to staging | All E2E scenarios pass |
| Responsive Tests | `qa-int` | Playwright viewports (1280x720, 768x1024, 375x667) | UI deploy | All 3 viewports pass |
| Accessibility Tests | `qa-int` | Playwright + @axe-core/playwright, WCAG AAA | UI deploy | Zero violations at AAA level |
| Regression Suite | `qa-reg` | Full test assembly, change-impact analysis | Release candidate | No regressions from baseline |
| Load Tests | `qa-perf` | k6 / Gatling, concurrent user simulation | Pre-release | p95 < 200ms, error rate < 0.1% |
| Stress Tests | `qa-perf` | k6, progressive load to breaking point | Pre-release | Graceful degradation, no crashes |
| Soak Tests | `qa-perf` | k6, 4-8hr endurance runs | Release candidate | No memory leaks, stable response times |
| DAST | `sec` | OWASP ZAP active scan, authenticated crawling | Deploy to staging | No CRITICAL/HIGH findings |
| Penetration Testing | `sec` | ZAP + IDOR/auth bypass probes | Release candidate | No exploitable vulnerabilities |
| Security Auth Tests | `sec` | Custom 401/403 enforcement, tenant isolation | Auth changes | All auth boundaries enforced |
| UAT | `uat` | Manual acceptance scenario execution | Feature complete | Sign-off from stakeholders |

### Production Environment

Post-deployment monitoring and validation.

| Test Type | Agent | Tools | Trigger | Gate |
|-----------|-------|-------|---------|------|
| Synthetic Monitoring | `devops` | Health endpoint polling, uptime checks | Continuous | 99.9% availability |
| Canary Testing | `devops` | Canary deployment, metric comparison | Post-deploy | Error rate within baseline |
| Error Rate Monitoring | `devops` | Prometheus alerts, Grafana dashboards | Continuous | Error rate < 0.1% |

---

## Failure Triage Router Pattern

### Triage Router Agent

The Triage Router is a **specialized agent role** within the `qa` coordinator. Its sole objective is to classify incoming test failure metadata and route the ticket to the correct diagnostic queue. It operates under strict rules:

1. **NO DIAGNOSIS** — Do not attempt to solve the bug. Only classify and route.
2. **ENVIRONMENT PRIORITY** — Pay strict attention to the environment where the failure occurred. This dictates the routing.
3. **SINGLE QUEUE** — Select one, and only one, target queue per failure.

### Queue-Based Routing

| Queue | Scope | Test Types | Diagnostic Agent |
|-------|-------|-----------|-----------------|
| `[QUEUE_STATIC_BUILD]` | CI pipeline failures | Linting, unit tests, SAST, SCA, container scanning | `qa-unit` (code) / `devops` (lint) / `sec` (SAST/SCA) |
| `[QUEUE_FUNCTIONAL_STAGING]` | Non-production functional failures | Integration, E2E, responsive, accessibility, contract tests | `qa-int` (functional) / `qa-reg` (regression) |
| `[QUEUE_PERFORMANCE]` | Performance degradation | Load, stress, soak, resource utilization | `qa-perf` |
| `[QUEUE_SECURITY_DAST]` | Dynamic security findings | DAST scans, WAF rejections, pen test findings | `sec` |
| `[QUEUE_PROD_INCIDENT]` | Production failures | Smoke tests, synthetic monitors, canary failures, error rate spikes | `devops` (infra) / `qa-reg` (smoke) / `rel` (rollback) |
| `[QUEUE_UNKNOWN]` | Unclassifiable | Data is completely unreadable | Escalate to `pm` |

### Failure Category Taxonomy

Within each queue, failures are further classified by root cause:

| Category | Description | Example |
|----------|-------------|---------|
| `[CODE_BUG]` | Application code defect | NullPointerException in service method |
| `[TEST_DEFECT]` | Flaky, stale, or incorrect test | Test depends on insertion order |
| `[INFRASTRUCTURE]` | Container, network, or env issue | Docker container OOM killed |
| `[DATA_STATE]` | Missing seed data, migration drift | Flyway migration out of sync |
| `[THIRD_PARTY]` | External service unavailable | Keycloak timeout during test |
| `[SYNTAX_ERROR]` | Linting or compilation failure | ESLint rule violation |
| `[VULNERABLE_DEPENDENCY]` | SCA finding in dependency | CVE in transitive dependency |
| `[SECURITY_FINDING]` | SAST/DAST vulnerability | SQL injection in query builder |
| `[PERFORMANCE_REGRESSION]` | SLO breach or degradation | p95 latency exceeded 200ms |

### Triage Router Output Format

When triaging a failure, the Router MUST produce structured output:

```json
{
  "failure_id": "FAIL-2026-02-27-001",
  "test_name": "createUser_withValidData_shouldReturn201",
  "environment": "BUILD_CI",
  "queue": "[QUEUE_STATIC_BUILD]",
  "category": "[CODE_BUG]",
  "routed_to": "qa-unit",
  "confidence": "HIGH",
  "error_summary": "Expected 201 but got 500 — NullPointerException in UserServiceImpl.java:45",
  "evidence": {
    "test_file": "backend/user-service/src/test/.../UserControllerIntegrationTest.java",
    "error_log": "java.lang.NullPointerException at UserServiceImpl.createUser(UserServiceImpl.java:45)",
    "stack_trace_top": "UserServiceImpl.java:45"
  },
  "routing_rationale": "Unit test failure in CI pipeline with code-level NullPointerException"
}
```

### Triage Router Prompt (for `qa` agent)

When the `qa` coordinator acts as the Triage Router, it uses this prompt:

```
You are the Triage Router for the EMSIST platform.
Your sole objective is to analyze test failure metadata and route to the correct queue.

Rules:
1. NO DIAGNOSIS — Do not solve the bug. Only classify and route.
2. ENVIRONMENT PRIORITY — The environment dictates the queue.
3. SINGLE QUEUE — Select exactly one target queue.

Queues:
- [QUEUE_STATIC_BUILD]: Linting, unit tests, SAST, SCA failures in CI
- [QUEUE_FUNCTIONAL_STAGING]: Integration, E2E, system test failures in Staging
- [QUEUE_PERFORMANCE]: Load, stress, or resource utilization failures
- [QUEUE_SECURITY_DAST]: Dynamic security scans or WAF rejections
- [QUEUE_PROD_INCIDENT]: Smoke tests, synthetic monitors, canary failures in Production
- [QUEUE_UNKNOWN]: Only if data is completely unreadable

Output: Structured JSON with queue, category, routed_to, confidence, and evidence.
```

### Cross-Environment Failure Protocol

When tests pass in Dev but fail in Staging (or vice versa), follow this systematic diagnosis:

| Step | Check | Agent | Action |
|------|-------|-------|--------|
| 1 | **Configuration Comparison** | `devops` | Compare `application.yml` / `application-docker.yml` between environments |
| 2 | **Dependency Health Check** | `devops` | Verify all service versions match, check container health |
| 3 | **Data State Verification** | `devops` | Check seed data, Flyway migration state, Valkey cache state |
| 4 | **Infrastructure Audit** | `devops` | Inspect container resources (CPU/memory limits), network policies, DNS |
| 5 | **Test Isolation Check** | `qa-reg` | Verify test doesn't depend on local-only state (files, env vars) |

### Decision / Action Matrix

| Scenario | Queue | Agent | Automated Action |
|----------|-------|-------|-----------------|
| Unit test fails in CI but passes locally | `QUEUE_STATIC_BUILD` | `qa-unit` | Re-run with `--randomize-order`, check file paths |
| E2E test times out in Staging | `QUEUE_FUNCTIONAL_STAGING` | `qa-int` | Increase timeout, check health endpoints |
| SAST finds HIGH vulnerability | `QUEUE_STATIC_BUILD` | `sec` | Block deployment, create defect with fix guidance |
| Load test p95 exceeds SLO | `QUEUE_PERFORMANCE` | `qa-perf` | Identify slow query/endpoint, profile with APM |
| Container scan finds CVE | `QUEUE_STATIC_BUILD` | `sec` | Update base image, rebuild |
| Smoke test fails post-deploy | `QUEUE_PROD_INCIDENT` | `qa-reg` + `rel` | Trigger rollback procedure, notify `rel` agent |
| DAST finds SQL injection in Staging | `QUEUE_SECURITY_DAST` | `sec` | Block release, create CRITICAL defect |
| Canary error rate spikes in Prod | `QUEUE_PROD_INCIDENT` | `devops` | Roll back canary, investigate with APM |

---

## Standards

### Defect Severity Levels

| Severity | Definition | Response Time | Examples |
|----------|------------|---------------|----------|
| **CRITICAL** | System unusable, data loss, security breach | Immediate | Auth bypass, data corruption, production down |
| **HIGH** | Major feature broken, no workaround | 24 hours | Core workflow fails, incorrect calculations |
| **MEDIUM** | Feature impaired, workaround exists | 72 hours | Minor feature bug, UI inconsistency |
| **LOW** | Cosmetic, minor inconvenience | Backlog | Typos, minor UX issues |

### Defect Report Format

All defects MUST be reported in this format:

```markdown
## Defect Report

**ID:** DEF-YYYY-MM-DD-NNN
**Severity:** CRITICAL | HIGH | MEDIUM | LOW
**Component:** {service-name}
**Environment:** Dev | Build/CI | Staging | Prod
**Reporter:** QA Agent
**Date Found:** YYYY-MM-DD

### Summary
One-line description of the defect.

### Description
Detailed explanation of what is wrong.

### Evidence
- **File:** `absolute/path/to/file.ext`
- **Line(s):** NNN-NNN
- **Code Snippet:**
```java
// Actual code showing the issue
```

### Expected Behavior
What should happen according to requirements/documentation.

### Actual Behavior
What actually happens in the code/system.

### Steps to Reproduce
1. Step one
2. Step two
3. Observe defect

### Impact
Who/what is affected and how severely.

### Suggested Fix
Optional recommendation for resolution.
```

### Verification Audit Format

Every verification task MUST produce an audit table:

```markdown
## Verification Audit Table

| ID | Claim/Feature | Documentation Location | Code Location | Status | Evidence | Severity |
|----|---------------|------------------------|---------------|--------|----------|----------|
| V-001 | User CRUD API | `docs/arc42/05-building-blocks.md` | `backend/user-service/src/.../UserController.java` | VERIFIED | Lines 45-120 | - |
| V-002 | JWT validation | `docs/adr/ADR-005-auth.md` | NOT FOUND | DISCREPANCY | No JwtFilter class | HIGH |
| V-003 | Rate limiting | `docs/arc42/08-crosscutting.md` | `backend/api-gateway/src/.../RateLimitFilter.java` | PARTIAL | Only GET endpoints | MEDIUM |
```

### Verification Status Codes

| Status | Meaning | Action Required |
|--------|---------|-----------------|
| **VERIFIED** | Documentation matches code exactly | None |
| **DISCREPANCY** | Documentation claims something not in code | File defect report |
| **PARTIAL** | Partial implementation exists | Document gap with severity |
| **OUTDATED** | Code exists but documentation is stale | Flag for DOC agent |
| **MISSING** | Neither code nor documentation exists | Escalate to PM |

### Test Plan Format

```markdown
# Test Plan: {Feature Name}

**Version:** X.Y.Z
**Created:** YYYY-MM-DD
**Author:** QA Agent
**Status:** Draft | In Review | Approved

## Overview
Brief description of what is being tested.

## Scope
### In Scope
- Items included in testing

### Out of Scope
- Items explicitly excluded

## Test Strategy by Environment
- **Dev:** Unit Tests ({count}), Integration Tests ({count})
- **Build/CI:** Linting, SAST, SCA, Unit (re-run), BVT ({count})
- **Staging:** E2E ({count}), Responsive ({count}), A11y ({count}), Smoke ({count})
- **Target:** 70% unit / 20% integration / 10% E2E

## Entry Criteria
- [ ] Code complete and reviewed
- [ ] Documentation verified against code
- [ ] BA sign-off evidence exists
- [ ] Test environment available

## Exit Criteria
- [ ] All test cases executed in target environments
- [ ] 80% code coverage achieved
- [ ] No CRITICAL or HIGH defects open
- [ ] Verification audit complete
- [ ] QA report evidence file created

## Test Cases

| TC-ID | Category | Environment | Description | Priority | Acceptance Criteria |
|-------|----------|-------------|-------------|----------|---------------------|
| TC-001 | Unit | Dev/CI | Validate user creation | HIGH | AC-001 |

## Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Test data unavailable | Medium | High | Use Testcontainers |

## Dependencies
- QA-UNIT: Unit test execution (Dev, CI)
- QA-INT: Integration + E2E test execution (Dev, Staging)
- QA-REG: Smoke + BVT test execution (CI, Staging)
- QA-PERF: Performance baseline validation (Staging)
- SEC: SAST/SCA (CI), DAST (Staging)
- DEVOPS: Pipeline gates, environment management
```

### Coverage Metrics

| Metric | Target | Tool | Environment |
|--------|--------|------|-------------|
| Line Coverage | >= 80% | JaCoCo (BE) / Vitest (FE) | Dev, CI |
| Branch Coverage | >= 75% | JaCoCo (BE) / Vitest (FE) | Dev, CI |
| Acceptance Criteria Coverage | 100% | Manual tracking | All |
| Integration Test Coverage | Critical paths | MockMvc + Testcontainers | Dev, CI |
| E2E Coverage | Happy paths + error states | Playwright | Staging |
| Responsive Coverage | 3 viewports | Playwright | Staging |
| Accessibility Coverage | WCAG AAA | axe-core | Staging |
| Verification Audit Coverage | 100% of docs | Manual | All |

### Test Pyramid

```mermaid
pie title Test Distribution (70/20/10)
    "Unit Tests (70%)" : 70
    "Integration Tests (20%)" : 20
    "E2E Tests (10%)" : 10
```

| Layer | Percentage | Focus | Environment |
|-------|------------|-------|-------------|
| **Unit Tests** | 70% | Business logic, services, components | Dev, CI |
| **Integration Tests** | 20% | API endpoints, database, contracts | Dev, CI |
| **E2E Tests** | 10% | Critical user journeys only | Staging |

---

## Unit Test Standards

### Naming Convention

```
{methodName}_{scenario}_{expectedBehavior}

Examples:
- findAll_whenTenantExists_shouldReturnUsers
- create_withInvalidEmail_shouldThrowValidationException
- delete_whenUserNotFound_shouldReturn404
```

### Test Structure (AAA Pattern)

**Backend (JUnit 5):**

```java
@Test
void findAll_whenTenantExists_shouldReturnUsers() {
    // Arrange (Given)
    String tenantId = "tenant-1";
    User user = User.builder().tenantId(tenantId).build();
    when(userRepository.findByTenantId(tenantId)).thenReturn(List.of(user));

    // Act (When)
    List<UserDTO> result = userService.findAll(tenantId);

    // Assert (Then)
    assertThat(result).hasSize(1);
    verify(userRepository).findByTenantId(tenantId);
}
```

**Frontend (Vitest):**

```typescript
describe('UserService', () => {
  it('findAll_whenTenantExists_shouldReturnUsers', () => {
    // Arrange
    const mockHttp = { get: vi.fn().mockReturnValue(of([{ id: '1', name: 'Test User' }])) };
    const service = new UserService(mockHttp as any);

    // Act
    const result$ = service.findAll('tenant-1');

    // Assert
    result$.subscribe(users => {
      expect(users).toHaveLength(1);
      expect(mockHttp.get).toHaveBeenCalledWith('/api/v1/users', expect.any(Object));
    });
  });
});
```

---

## Integration Test Standards

### Testcontainers Configuration

```java
@SpringBootTest
@Testcontainers
@AutoConfigureMockMvc
class UserControllerIntegrationTest {

    @Container
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16-alpine")
        .withDatabaseName("testdb")
        .withUsername("test")
        .withPassword("test");

    @DynamicPropertySource
    static void configureProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", postgres::getJdbcUrl);
        registry.add("spring.datasource.username", postgres::getUsername);
        registry.add("spring.datasource.password", postgres::getPassword);
    }

    @Autowired
    private MockMvc mockMvc;

    @Test
    void createUser_withValidData_shouldReturn201() throws Exception {
        mockMvc.perform(post("/api/v1/users")
                .header("X-Tenant-ID", "tenant-1")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"email": "test@example.com", "name": "Test User"}
                    """))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.email").value("test@example.com"));
    }
}
```

### E2E Test Standards (Playwright)

```typescript
import { test, expect } from '@playwright/test';

test.describe('User Management', () => {
  test.beforeEach(async ({ page }) => {
    // Route-intercept API calls for deterministic tests
    await page.route('**/api/v1/users**', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([{ id: '1', name: 'Test User', email: 'test@example.com' }])
      });
    });
  });

  test('should display user list', async ({ page }) => {
    await page.goto('/administration?section=users');
    await expect(page.getByRole('heading', { name: /users/i })).toBeVisible();
    await expect(page.getByText('Test User')).toBeVisible();
  });
});
```

### Responsive Test Pattern

```typescript
const viewports = [
  { name: 'Desktop', width: 1280, height: 720 },
  { name: 'Tablet', width: 768, height: 1024 },
  { name: 'Mobile', width: 375, height: 667 },
];

for (const viewport of viewports) {
  test(`should render correctly at ${viewport.name} (${viewport.width}x${viewport.height})`, async ({ page }) => {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.goto('/administration');
    // Assert layout-specific elements
  });
}
```

### Accessibility Test Pattern

```typescript
import AxeBuilder from '@axe-core/playwright';

test('should pass WCAG AAA accessibility audit', async ({ page }) => {
  await page.goto('/administration');
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag2aaa'])
    .analyze();
  expect(results.violations).toEqual([]);
});
```

---

## Contract Test Standards

### Spring Cloud Contract (Provider Side)

```java
@SpringBootTest(webEnvironment = WebEnvironment.MOCK)
@AutoConfigureMockMvc
@AutoConfigureStubRunner(
    stubsMode = StubRunnerProperties.StubsMode.LOCAL,
    ids = "com.ems:user-service:+:stubs:8083"
)
class UserServiceContractTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void shouldReturnUsersByTenant() throws Exception {
        mockMvc.perform(get("/api/v1/users")
                .header("X-Tenant-ID", "tenant-1"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$").isArray());
    }
}
```

---

## Documentation Verification Protocol

Before approving ANY documentation:

1. READ the actual source file(s) referenced
2. VERIFY each claim against the code
3. DOCUMENT discrepancies in audit table
4. ASSIGN severity to each discrepancy
5. PROVIDE evidence (file path, line number, snippet)
6. REPORT defects for unverified claims

### Evidence Collection Requirements

| Claim Type | Required Evidence |
|------------|-------------------|
| API endpoint exists | Controller class + method + path |
| Feature implemented | Service class + business logic |
| Database schema | Entity class + migrations |
| Configuration | application.yml + actual values |
| Security control | Filter/interceptor + tests |
| Error handling | Exception handler + error codes |

---

## Forbidden Practices

These actions are EXPLICITLY PROHIBITED:

- **Never approve documentation without code verification**
- **Never ignore discrepancies between docs and code**
- **Never skip evidence collection for findings**
- **Never mark tests as "passed" without execution evidence**
- **Never route failures without classification** (use the Router Pattern)
- Never skip tests for "simple" changes
- Never use `@Disabled` without JIRA ticket
- Never test implementation details (test behavior)
- Never share state between tests
- Never use Thread.sleep() (use awaitility)
- Never hardcode test data that could become stale
- Never ignore flaky tests (fix or quarantine)
- Never test private methods directly
- Never mock what you don't own (wrap and mock)
- Never leave test data in production database
- Never skip tenant isolation verification
- Never commit tests with external dependencies
- Never use `jasmine.createSpy()` in frontend tests (use `vi.fn()`)
- Never skip responsive/accessibility tests for UI features

---

## Definition of Done — QA Gate (MANDATORY)

### QA Agent MUST Verify Before Sign-Off

A feature is NOT "QA approved" until ALL of these gates pass:

| Gate | What to Check | Evidence Required |
|------|---------------|-------------------|
| **Unit Tests Executed** | `mvn test` / `npx vitest run` passes | Test execution output with pass/fail counts |
| **Coverage Verified** | >=80% line, >=75% branch on affected classes | JaCoCo / Vitest coverage report |
| **Integration Tests Executed** | Testcontainers-based tests pass | Test execution output |
| **E2E Tests Executed** | Playwright tests for UI features pass | Test execution output |
| **Responsive Tests** | Desktop + Tablet + Mobile viewports tested | Playwright viewport test results |
| **Accessibility Tests** | axe-core scan passes at AAA level | Accessibility test output |
| **Smoke Test** | Critical path works end-to-end | Login → Navigate → Feature works |
| **Security Tests** | 401/403 enforcement, tenant isolation, IDOR checks | Security test output |
| **Regression Check** | Existing tests still pass (no regressions) | Full test suite output |
| **Build/CI Gates** | Linting + SAST + SCA + Container Scan pass | CI pipeline output |

### Test Execution Report (MANDATORY)

After executing tests, QA agent MUST produce:

```markdown
## Test Execution Report

**Date:** YYYY-MM-DD
**Feature:** [Feature name / Issue ID]
**Agent:** QA / QA-UNIT / QA-INT

### Execution Environment
- Java: [version]
- Node: [version]
- Angular: [version]
- Playwright: [version]

### Results Summary by Environment
| Environment | Test Type | Total | Passed | Failed | Skipped | Coverage |
|-------------|-----------|-------|--------|--------|---------|----------|
| Dev/CI | Unit (Backend) | NN | NN | 0 | 0 | XX% |
| Dev/CI | Unit (Frontend) | NN | NN | 0 | 0 | XX% |
| Dev/CI | Integration | NN | NN | 0 | 0 | - |
| CI | BVT | NN | NN | 0 | 0 | - |
| Staging | E2E | NN | NN | 0 | 0 | - |
| Staging | Responsive | NN | NN | 0 | 0 | - |
| Staging | Accessibility | NN | NN | 0 | 0 | - |
| Staging | Security | NN | NN | 0 | 0 | - |

### Failed Tests (if any)
| Test | Environment | Category | Routed To | Root Cause |
|------|-------------|----------|-----------|------------|

### Verdict: PASS / FAIL
```

### Test Types Required Per Feature Type

| Feature Type | Unit | Integration | E2E | Responsive | A11y | Security | Smoke | Build/CI Gates |
|-------------|------|-------------|-----|------------|------|----------|-------|----------------|
| Backend API | YES | YES | - | - | - | YES | YES | YES |
| Frontend Component | YES | - | YES | YES | YES | - | YES | YES |
| Full Feature (BE+FE) | YES | YES | YES | YES | YES | YES | YES | YES |
| Bug Fix | YES (regression) | IF API | IF UI | IF UI | - | IF auth | - | YES |
| Config Change | - | YES | - | - | - | IF security | YES | YES |

### If Tests Cannot Be Executed

If tests cannot run (e.g., environment issues, Bash blocked):
1. **DO NOT mark as done**
2. **Flag explicitly**: "Tests written but NOT executed — blocked by [reason]"
3. **Track as pending**: Add to test backlog with priority
4. **Provide test files**: At minimum, deliver test source code for later execution

---

## Test Types by Agent

| Agent | Test Types Owned | Environment | Key Tools |
|-------|-----------------|-------------|-----------|
| `qa` (coordinator) | Test strategy, failure triage, coverage analysis, DoD verification | All | Coordination only |
| `qa-unit` | Unit tests (BE + FE), component tests | Dev, CI | JUnit 5, Mockito, JaCoCo, Vitest, Angular TestBed |
| `qa-int` | Integration tests, E2E, responsive, accessibility, contract tests | Dev, CI, Staging | Testcontainers, MockMvc, Playwright, axe-core, Spring Cloud Contract |
| `qa-reg` | Regression suites, smoke tests, BVT, change-impact analysis | CI, Staging | Test suite assembly, critical-path selection |
| `qa-perf` | Load tests, stress tests, soak tests, performance benchmarks | Staging | k6, Gatling, Lighthouse |
| `sec` | SAST, SCA, container scanning, DAST, pen testing, auth tests | CI, Staging | SonarQube, Semgrep, OWASP dependency-check, Trivy, OWASP ZAP |
| `devops` | Linting, synthetic monitoring, canary testing, error rate monitoring | CI, Prod | ESLint, Checkstyle, Prometheus, Grafana |
| `uat` | User acceptance testing, sign-off | Staging only | Manual acceptance |

---

## Checklist Before Completion

Before completing ANY QA task, verify:

### Documentation Verification
- [ ] All claims verified against codebase
- [ ] Defects documented with severity (CRITICAL/HIGH/MEDIUM/LOW)
- [ ] Evidence provided for all findings (file paths, line numbers, snippets)
- [ ] Verification audit table complete

### Test Coverage
- [ ] BA acceptance criteria mapped to test cases
- [ ] Unit tests follow AAA pattern
- [ ] Test names describe scenario and expectation
- [ ] Code coverage meets 80% line / 75% branch threshold

### Test Execution (MANDATORY)
- [ ] Unit tests EXECUTED (not just written) with pass/fail evidence
- [ ] Integration tests EXECUTED with Testcontainers
- [ ] E2E tests EXECUTED with Playwright (if UI feature)
- [ ] Responsive tests EXECUTED at 3 viewports (if UI feature)
- [ ] Accessibility tests EXECUTED with axe-core (if UI feature)
- [ ] Security tests EXECUTED for auth/authz features
- [ ] Smoke test EXECUTED for critical path
- [ ] Build/CI gates verified (linting, SAST, SCA, container scan)
- [ ] Test Execution Report produced with environment breakdown

### Test Quality
- [ ] Integration tests use Testcontainers
- [ ] No external dependencies in CI tests
- [ ] Multi-tenancy isolation verified
- [ ] Test data cleaned up after tests
- [ ] Flaky tests identified and addressed

### Test Completeness
- [ ] Performance baselines established (if applicable)
- [ ] Security scan passed (SAST + SCA + container)
- [ ] Regression tests added for bug fixes
- [ ] E2E tests cover critical paths + error states + empty states
- [ ] All diagrams use Mermaid syntax (no ASCII art)
- [ ] Test documentation updated
- [ ] Failure triage completed for any failing tests

---

## Human-in-the-Loop Triggers

| Situation | Severity | Escalate To |
|-----------|----------|-------------|
| CRITICAL defect found | CRITICAL | PM + Tech Lead immediately |
| HIGH defect count > 5 | HIGH | PM + BE/FE |
| Documentation claims unverified feature | HIGH | PM + DOC agent |
| Coverage below 80% | HIGH | PM + Dev team |
| Test environment issue | MEDIUM | DevOps + PM |
| Security test failure | CRITICAL | SEC + PM |
| Performance SLO miss | HIGH | ARCH + PM |
| Cross-environment failure (Dev passes, Staging fails) | HIGH | DevOps + QA |
| Container scan CRITICAL CVE | CRITICAL | SEC + DevOps + PM |

---

## Continuous Improvement

### How to Suggest Improvements

1. Log suggestion in Feedback Log below
2. Include impact on:
   - Test coverage
   - Defect detection rate
   - Verification accuracy
   - Environment reliability
3. QA principles reviewed quarterly
4. Approved changes increment version

### Feedback Log

| Date | Suggestion | Rationale | Status |
|------|------------|-----------|--------|
| - | No suggestions yet | - | - |

---

## Changelog

| Version | Date | Changes |
|---------|------|---------|
| 2.0.0 | 2026-02-27 | **Major rewrite:** Added environment-aware test matrix (Dev/Build-CI/Staging/Prod); added failure triage router pattern with structured output format; added cross-environment failure protocol and decision/action matrix; added build/CI pipeline tests (linting, SAST, SCA, container scanning, BVT); added contract test standards; added E2E/responsive/accessibility test patterns; fixed Jasmine→Vitest for frontend; added failure category taxonomy; expanded Test Types by Agent with environment column; added Build/CI gates to DoD |
| 1.2.0 | 2026-02-27 | Mandatory Mermaid diagrams; converted test pyramid to Mermaid pie chart |
| 1.1.0 | 2026-02-26 | Added Definition of Done QA gate, mandatory test execution requirements, test execution report template, per-feature-type test matrix, "tests cannot execute" protocol |
| 1.0.0 | 2026-02-25 | Initial QA principles with documentation verification protocol |

---

## References

- [JUnit 5 User Guide](https://junit.org/junit5/docs/current/user-guide/)
- [Vitest](https://vitest.dev/)
- [Testcontainers](https://www.testcontainers.org/)
- [Playwright](https://playwright.dev/)
- [@axe-core/playwright](https://github.com/dequelabs/axe-core-npm/tree/develop/packages/playwright)
- [k6 Load Testing](https://k6.io/)
- [Spring Cloud Contract](https://spring.io/projects/spring-cloud-contract)
- [OWASP Testing Guide](https://owasp.org/www-project-web-security-testing-guide/)
- [OWASP ZAP](https://www.zaproxy.org/)
- [Trivy Container Scanner](https://trivy.dev/)
- [GOVERNANCE-FRAMEWORK.md](../GOVERNANCE-FRAMEWORK.md)
