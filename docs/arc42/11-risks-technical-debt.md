# 11. Risks and Technical Debt

## 11.1 Key Technical Risks

| ID | Risk | Impact | Probability | Mitigation Direction |
|----|------|--------|-------------|----------------------|
| R-01 | Missing tenant predicate in data queries | Critical | Medium | Tenant-isolation tests, repository guardrails, code review checklist |
| R-02 | Keycloak unavailability affecting login | Critical | Medium | HA deployment, health checks, resilience playbooks |
| R-03 | Boundary drift between Neo4j app data and Keycloak PostgreSQL internals | High | Medium | Explicit ownership model and observability across both boundaries |
| R-04 | Documentation drift from runtime/ADR reality | High | High | Docs quality gates + mandatory architecture review in PR process |
| R-05 | Seat-validation dependency in login path | Medium | Medium | Cache + bounded retries + failure-mode handling |
| R-06 | Cache staleness after license/role changes | Medium | Medium | Event-driven invalidation + TTL fallback |
| R-07 | Mixed tenant identifiers (legacy ID vs UUID) across services | High | High | UUID-first contract enforcement + compatibility adapter phase-out plan |
| R-08 | Data loss from single-instance stateful services | Critical | High | Automated backups (Phase 1), database replication (Phase 2), multi-region DR (Phase 3). See [ADR-018](../adr/ADR-018-high-availability-multi-tier.md) |
| R-09 | Single-point-of-failure in all stateful components | Critical | High | No replication for PostgreSQL, Neo4j, Valkey, or Kafka. One container failure cascades to all dependent services. Mitigated by Phase 1 backups and Phase 2 Kubernetes HA |
| R-10 | `docker compose down -v` destroys all data volumes | Critical | Medium | Operational runbook prohibiting `-v` flag in staging/production. Phase 1 adds host bind-mount backups outside Docker volume scope |
| R-11 | No tested restore procedure for any database | High | High | Phase 1 includes restore testing as exit criteria. Upgrade runbook documents pre-upgrade backup + restore validation |
| R-12 | No encryption at rest for any data store (PostgreSQL, Neo4j, Valkey volumes unencrypted) | Critical | High | Volume-level encryption: LUKS/FileVault (Docker), encrypted StorageClass (K8s). See [ADR-019](../adr/ADR-019-encryption-at-rest.md), ISSUE-INF-016/017/018 |
| R-13 | All services share postgres superuser -- any compromised service can DROP ALL DATABASES | Critical | High | Per-service DB users with least privilege (SCRAM-SHA-256). See [ADR-020](../adr/ADR-020-service-credential-management.md), ISSUE-INF-004/010 |
| R-14 | Hardcoded credential defaults in application.yml (e.g., `${DATABASE_PASSWORD:postgres}`) allow silent superuser login on misconfiguration | High | High | Remove fallback defaults, fail-fast on missing env vars. See [ADR-020](../adr/ADR-020-service-credential-management.md), ISSUE-INF-008 |
| R-15 | Browser-specific regressions escape to production due to Chromium-only automated UI coverage | High | Medium | Enforce Chromium/Firefox/WebKit compatibility matrix in CI for critical journeys |
| R-16 | Visual regressions ship unnoticed due to missing baseline diff governance | Medium | High | Introduce visual baseline snapshots + review workflow for critical pages |
| R-17 | SEO regressions on discoverable pages are not detected before release | Medium | Medium | Add Lighthouse/meta/schema quality gates in CI for public pages |
| R-18 | Late UX defects and requirement misunderstandings due to missing formal alpha/beta UAT gate | High | Medium | Enforce staged UAT sign-off (internal alpha + controlled beta) before public rollout |
| R-19 | Environment-level security drift (`http` transport, HTTPS bypass flags) undermines COTS production readiness | Critical | High | Enforce ADR-022 production-parity gate; eliminate allowlisted insecure transport debt |

## 11.2 Technical Debt Register

| ID | Debt Item | Impact | Effort | Priority |
|----|-----------|--------|--------|----------|
| TD-01 | ADR index/status hygiene not fully automated | Medium | Low | High |
| TD-02 | Keycloak provisioning and drift automation incomplete | Medium | Medium | High |
| TD-03 | Cross-tenant regression test depth still limited | High | Medium | High |
| TD-04 | Compose/K8s behavior parity gaps | Medium | Medium | Medium |
| TD-05 | External dependency fallback behavior under-documented | Medium | Medium | Medium |
| TD-06 | Legacy tenant-ID callers still present in selected flows | High | Medium | High |
| TD-07 | No automated database backup in any environment | Critical | Low | Critical |
| TD-08 | Valkey persistence not hardened (AOF disabled by default) | High | Low | High |
| TD-09 | Kafka replication factor 1 (single broker, data loss on failure) | High | Medium | High |
| TD-10 | No upgrade runbook for safe infrastructure version bumps | High | Low | Critical |
| TD-11 | No session lifecycle governance (session TTL, concurrent limits, inactivity timeout) | High | Medium | High |
| TD-12 | No inter-service authentication (backend services trust each other implicitly on Docker network) | High | Medium | Medium |
| TD-13 | Valkey has no AUTH password -- any container on the Docker network can read/write cache | Critical | Low | Critical |
| TD-14 | Kafka has no SASL authentication -- any container can produce/consume messages | High | Low | High |
| TD-15 | Single flat Docker network -- no tier segmentation between data and application layers | Critical | Medium | Critical |
| TD-16 | Playwright project config is single-browser (`chromium`) instead of required browser matrix | High | Low | High |
| TD-17 | No approved visual regression baseline set for administration and tenant critical pages | Medium | Medium | High |
| TD-18 | SEO validation (Lighthouse/meta/schema checks) not integrated into release pipeline | Medium | Medium | Medium |
| TD-19 | UAT alpha/beta sign-off workflow is not standardized in release evidence | High | Medium | High |
| TD-20 | Design-to-implementation parity checklist evidence is not consistently attached to UI feature delivery | Medium | Low | High |
| TD-21 | Insecure transport allowlist baseline still contains legacy HTTP/HTTPS-bypass entries | Critical | High | Critical |

## 11.3 Deferred Features (Intentional)

| Feature | Current State | Tracking |
|---------|---------------|----------|
| Graph-per-tenant routing/runtime | Designed, not implemented | ADR-003, ADR-010 |
| Additional provider implementations | Planned rollout | ADR-011 |
| IdP management UI consolidation | Proposed | ADR-008 |
| Tenant/license service merge | Proposed | ADR-006 |

## 11.4 Risk and Debt Reduction Roadmap

| Timeframe | Focus | Planned Outcome |
|-----------|-------|-----------------|
| Q1 2026 | Documentation/decision hygiene | ADR + arc42 synchronization workflow hardened |
| Q1 2026 | Tenant isolation assurance | Strong integration regression coverage |
| Q1 2026 | Auth resilience | Explicit degraded/failure-mode behavior documented and tested |
| Q2 2026 | Keycloak ops hardening | Automated realm/client provisioning and drift detection |
| Q2 2026 | Cross-system observability | Unified dashboards for Neo4j, Keycloak PostgreSQL, cache |
| Q1 2026 | Data durability (Phase 1) | Automated backups for PostgreSQL, Neo4j, Valkey; upgrade runbook; volume protection |
| Q2-Q3 2026 | HA infrastructure (Phase 2) | Kubernetes migration with operator-managed database replication and failover |
| Q4 2026+ | Disaster recovery (Phase 3) | Multi-region active-passive with cross-region database replication |
| Q1-Q2 2026 | Frontend quality hardening | Multi-browser CI matrix + visual regression baseline for critical user journeys |
| Q2 2026 | UX release governance | Formal design QA handshake and alpha/beta UAT evidence as release gate |
| Q2 2026 | Discoverability quality | SEO quality gates integrated for externally indexed pages |

## 11.5 Accepted Risk Notes

| Date | Risk | Decision |
|------|------|----------|
| 2026-02-25 | R-03 | Accepted with mitigation |
| 2026-02-25 | R-05 | Accepted with mitigation |
| 2026-02-25 | Graph-per-tenant runtime cutover | Deferred pending explicit trigger conditions |
| 2026-03-02 | R-08, R-09 | Active risk -- phased HA architecture proposed (ADR-018). Phase 1 (backups) is immediate priority |
| 2026-03-02 | R-10 | Mitigated by operational procedure -- `-v` flag prohibited in staging/production |
| 2026-03-02 | R-12 | Active risk -- three-tier encryption strategy proposed (ADR-019). Tier 2 (in-transit TLS) is highest-priority immediate action |
| 2026-03-02 | R-13, R-14 | Active risk -- per-service credential management proposed (ADR-020). Requires init-db.sql update and application.yml changes |
| 2026-03-04 | R-19 | Active risk -- production-parity security baseline accepted (ADR-022). CI now blocks net-new insecure transport; debt burn-down remains required |

---

**Previous Section:** [Quality Requirements](./10-quality-requirements.md)
**Next Section:** [Glossary](./12-glossary.md)
