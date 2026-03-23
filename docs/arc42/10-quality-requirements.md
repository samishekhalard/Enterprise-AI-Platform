# 10. Quality Requirements

## 10.1 Quality Priorities

| Priority | Quality Attribute | Intent |
|----------|-------------------|--------|
| 1 | Security | Strong tenant isolation, authentication, authorization, and auditability |
| 2 | Performance | Responsive APIs and predictable user experience |
| 3 | Reliability | High availability and fast recovery |
| 4 | Scalability | Sustained growth in users and workload |
| 5 | Maintainability | Efficient change, testing, and operations |

## 10.2 Measurable Scenarios

### Security Scenarios

| ID | Scenario | Target |
|----|----------|--------|
| SEC-01 | Tenant-scoped data access | 100% isolation correctness |
| SEC-02 | Invalid credential attempts | Account protection policy always enforced |
| SEC-03 | Expired access token usage | 401 response always returned |
| SEC-04 | Cypher injection attempt | 100% blocked |
| SEC-05 | XSS attack payload | 100% sanitized/escaped |
| SEC-06 | Login auth response includes complete authorization context (`roles`, `responsibilities`, `features`, `policyVersion`) | 100% contract completeness on successful login/refresh |
| SEC-07 | Frontend/UI bypass attempt (manipulated DOM/JS) against protected API | 100% blocked by backend with 403 |
| SEC-08 | Missing policy mapping for a new capability | Default deny always enforced |
| SEC-09 | Tenant is non-active (license/provisioning gate not satisfied) | 100% authentication denial for non-master tenants |
| SEC-10 | Resource with `CONFIDENTIAL`/`RESTRICTED` classification requested by lower-clearance user | 100% deny or mask per policy (no raw leakage) |
| SEC-11 | Tenant-scoped API call uses UUID tenant identifier across gateway/services | 100% UUID contract conformance; legacy aliases accepted only on compatibility endpoints |
| SEC-12 | Runtime config introduces new insecure transport (`http://`, HTTPS-strict bypass flags) | 0 net-new violations vs approved transport-security allowlist |

### Performance Scenarios

| ID | Scenario | Target |
|----|----------|--------|
| PERF-01 | Core GET endpoint under normal load | p95 < 100 ms |
| PERF-02 | Complex query endpoint | p95 < 500 ms |
| PERF-03 | Cached read path | < 5 ms typical cache response |
| PERF-04 | Sustained throughput | >= 1000 req/s on target profile |
| PERF-05 | Initial page interactive time | < 2 s |

### Reliability Scenarios

| ID | Scenario | Target |
|----|----------|--------|
| REL-01 | Monthly uptime | >= 99.9% |
| REL-02 | Service restart recovery | < 30 s |
| REL-03 | Stateful component failover impact | < 60 s service impact |
| REL-04 | Service deployment | Zero planned downtime |

### Maintainability and Operability

| ID | Scenario | Target |
|----|----------|--------|
| MAINT-01 | Isolated service change | No cascading redeployments |
| MAINT-02 | Incident root-cause identification | < 30 min median |
| OPS-01 | Alert detection latency | < 1 min |
| OPS-02 | Rollback execution | < 5 min |

## 10.3 SLO-Oriented Metrics

| Metric | Target | Alert Threshold |
|--------|--------|-----------------|
| API response p95 | < 200 ms | > 500 ms |
| API response p99 | < 1 s | > 2 s |
| Error rate | < 0.1% | > 1% |
| Availability | >= 99.9% | < 99.5% |
| MTTR | < 30 min | > 60 min |

## 10.4 Quality Assurance Model

| Layer | Main Tools | Minimum Expectation |
|-------|------------|---------------------|
| Unit tests | JUnit 5 + Mockito (backend), Vitest + Angular TestBed (frontend) | High confidence in domain logic with >=80% line coverage on changed modules |
| Integration tests | Testcontainers | Critical integration paths covered |
| End-to-end | Playwright | Core user journeys covered |
| Compatibility | Playwright browser matrix (Chromium, Firefox, WebKit) | Critical journeys pass on all supported browsers |
| Visual regression | Playwright snapshot diff and/or Percy/BackstopJS baselines | No unintended UI regressions on critical pages |
| SEO quality checks | Lighthouse CI + metadata/schema checks | No critical SEO regressions on public/discoverable pages |
| Performance | JMeter/k6 | Regular baseline and regression checks |
| Security | SAST + DAST + dependency/container scans + authz/tenant-isolation tests | No critical/high unresolved findings; auth boundaries enforced by automated tests |
| UAT | Alpha/Beta acceptance test packs with signed evidence | Internal alpha sign-off and controlled beta feedback completed before public release |

## 10.5 Quality Governance

- Quality changes affecting architecture must be reflected in ADRs and arc42.
- Quality gates are enforced via CI documentation and code workflows.
- Metrics and risk posture are reviewed per release cycle.
- Production-parity transport-security governance is enforced by CI (`check-transport-security-baseline.sh`) per ADR-022.

## 10.6 Authorization Policy Test Gates [TARGET STATE]

Each increment of RBAC/license policy must ship with the following minimum automated tests:

| Gate | Minimum Coverage |
|------|------------------|
| Contract tests | Validate login/refresh response schema for authorization context fields |
| Backend authorization tests | Positive and negative tests for `@PreAuthorize` and `@FeatureGate` per protected endpoint |
| Data-classification tests | Positive and negative tests for classification levels (`OPEN`, `INTERNAL`, `CONFIDENTIAL`, `RESTRICTED`) including masking rules |
| Drift tests | `policyVersion` mismatch handling validated between frontend and backend |
| E2E visibility tests | Route/menu visibility matches backend authorization context for at least one allow + one deny scenario per policy key |
| Tamper tests | Simulated frontend state tampering still fails at backend authorization boundary |

Release rule:

- A policy increment is not releasable unless all listed gates pass in CI.

## 10.7 Accessibility and UX Quality Gates

| Gate | Minimum Coverage |
|------|------------------|
| Accessibility scan | Automated WCAG 2.2 AA mandatory checks (AAA target) on login + administration + one tenant-scoped business page per release |
| Accessibility execution standard | Playwright + `@axe-core/playwright` in CI and staging, plus manual keyboard-only and screen-reader spot checks on critical flows |
| Keyboard navigation | Full keyboard-only traversal for global shell, login form, and administration dock controls |
| Contrast conformance | Token-level checks for default AA and optional AAA mode without regressions |
| CSS governance audit | Administration SCSS token audit (`check:admin-style-tokens`) blocks new hardcoded style debt |
| Responsive conformance | Visual + interaction checks on mobile (<=599px), tablet (600-1023px), desktop (>=1024px), and foldable media queries |
| Browser compatibility matrix | Chromium + Firefox + WebKit desktop matrix, plus mobile Chrome/Safari viewport coverage for critical journeys |
| Visual regression execution | Baseline screenshot diffs for login, administration shell, tenant manager, and one tenant business page in mobile/tablet/desktop |
| Motion preferences | `prefers-reduced-motion` behavior verified for animations/transitions |

Release rule:

- A frontend release is not complete unless all mandatory accessibility and responsive gates pass.

---

**Previous Section:** [Architecture Decisions](./09-architecture-decisions.md)
**Next Section:** [Risks and Technical Debt](./11-risks-technical-debt.md)
