# R07 Acceptance Criteria and Release Gates

**Status:** Draft
**Owner:** Architecture / DevOps / QA
**Date:** 2026-03-13

---

## 1. Purpose

This document turns the R07 platform requirements into testable acceptance criteria and release approval gates.

## 2. P0 Acceptance Criteria

| P0 ID | Acceptance Criteria |
|-------|---------------------|
| P0-01 | Given a populated customer environment, when the app tier is rebuilt or upgraded, then Postgres, Neo4j, Valkey, and Keycloak customer data remain intact and readable after the rollout. |
| P0-02 | Given a customer production install package, when operations deploy it, then installation requires only versioned runtime artifacts, manifests/templates, scripts, and runbooks; no source code, source checkout, local build, or Docker build context is required. |
| P0-03 | Given the provisioning entrypoint, when operators choose `preflight`, `first_install`, `upgrade`, or `restore`, then each mode executes only its allowed actions and rejects unsafe cross-mode behavior. |
| P0-04 | Given existing Keycloak realm and user data, when containers restart, upgrade, or restore, then the same users can still authenticate and tenant login rules still apply. |
| P0-05 | Given any staging or production automation path, when destructive Compose operations are attempted, then `down -v` is blocked or absent from the approved workflow. |
| P0-06 | Given a release candidate, when release evidence is reviewed, then backup/restore proof and login-after-upgrade proof are present before approval. |

## 3. Release Gate Matrix

| Gate | Minimum Evidence | Owner |
|------|------------------|-------|
| Packaging gate | Release manifest listing runtime artifacts, env template, deploy/rollback entrypoints, checksums, and no-source-code delivery confirmation | DevOps |
| Preflight gate | Output showing secrets, URLs, clock sync, certs, and backup target validation | DevOps |
| Upgrade safety gate | App-only rollout evidence showing protected data volumes unchanged | DevOps + DBA |
| Restore gate | Restore execution log for Postgres, Neo4j, Valkey, and Keycloak-backed identity data | DevOps + DBA |
| Login continuity gate | Successful login with a persistent user after restart/upgrade/restore | QA + Security |
| Automation safety gate | CI/script review proving no approved non-disposable workflow uses `down -v` | DevOps |

## 4. Evidence Model

The following evidence should be collected per release:

- versioned deployment manifest and checksum list
- preflight execution output
- backup execution output
- restore execution output
- login continuity test result
- rollback execution output
- runbook or script delta if provisioning behavior changed

## 5. Automation Targets

| Target | Candidate Implementation |
|--------|--------------------------|
| Preflight validation | Shell entrypoint or Make target validating env vars, URLs, ports, clock skew, TLS, and backup target reachability |
| App-only rollout proof | Scripted deployment mode that updates application services without touching persistent volumes |
| Restore proof | CI/manual evidence pack with checksum or record-count validation plus login verification |
| `down -v` guardrail | Static grep check in CI plus runbook linting for forbidden commands |
| Login continuity | Smoke test using a persisted user against the deployed auth path |

## 6. Exit Rule

R07 is not considered implemented until every P0 rule has both:

1. documented requirement coverage, and
2. repeatable runtime evidence.
