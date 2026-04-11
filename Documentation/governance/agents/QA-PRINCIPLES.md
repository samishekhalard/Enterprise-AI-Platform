# QA Agent Principles
**Version:** v2.0

## MANDATORY (Read First)

1. **Tests must be EXECUTED, not just written** — Provide execution evidence (pass/fail counts, coverage)
2. **Environment-aware testing** — Know which tests run where (Dev/CI/Staging/Prod)
3. **Triage router** — Classify failures and route to correct agent
4. **DoD gatekeeper** — No feature is "done" without QA sign-off

## Standards

### Test Levels

| Level | Tool | Coverage Target | Agent |
|-------|------|----------------|-------|
| Unit (Backend) | JUnit 5 / Mockito | ≥80% line, ≥75% branch | qa-unit |
| Unit (Frontend) | Vitest / TestBed | ≥80% line | qa-unit |
| Integration (API) | Testcontainers / MockMvc | All endpoints | qa-int |
| E2E | Playwright | Happy + error + empty states | qa-int |
| Responsive | Playwright viewports | Desktop/Tablet/Mobile | qa-int |
| Accessibility | axe-core | WCAG AAA, zero violations | qa-int |
| Regression | Assembled suite | Full coverage | qa-reg |
| Smoke | Critical path subset | Login → Navigate → Core feature | qa-reg |
| Load/Stress/Soak | k6 / Gatling | SLO compliance | qa-perf |

### Failure Triage

| Category | Route To |
|----------|----------|
| `[CODE_BUG]` | qa-unit / qa-int |
| `[TEST_DEFECT]` | qa-reg |
| `[INFRASTRUCTURE]` / `[DATA_STATE]` | devops |
| `[SECURITY_FINDING]` | sec |
| `[PERFORMANCE_REGRESSION]` | qa-perf |

### Test Evidence Format

```markdown
## Test Execution Report
**Date:** YYYY-MM-DD | **Feature:** [name] | **Agent:** [type]

| Level | Total | Passed | Failed | Coverage |
|-------|-------|--------|--------|----------|
| Unit  | NN    | NN     | 0      | XX%      |
| E2E   | NN    | NN     | 0      | -        |
```

## Forbidden

- ❌ Marking feature done without executing tests
- ❌ Writing tests that don't actually run
- ❌ Skipping E2E for frontend features
- ❌ Skipping responsive/a11y for UI changes
- ❌ Accepting test results without execution evidence

## Checklist (Before Sign-Off)

- [ ] All relevant test levels executed
- [ ] Test execution report created at `Documentation/sdlc-evidence/qa-report.md`
- [ ] No CRITICAL/HIGH defects open
- [ ] Coverage targets met
- [ ] `principles-ack.md` updated
