> **WP-ARCH-ALIGN (2026-03-24):** This document has been updated to reflect the frozen auth target model (Rev 2).
> See `Foundation/03-ownership-boundaries.md` FROZEN for the canonical decision.

# TOGAF Review Checklist

## Phase Completion Checks

- [ ] Phase deliverable sections completed.
- [ ] Required catalogs/matrices updated.
- [ ] Traceability to requirements updated.
- [ ] Relevant ADR references validated.
- [ ] Architecture impact assessed and updated where needed.

## Architecture Quality Checks

- [ ] Tenant isolation concerns covered.
- [ ] Identity boundary is explicit per frozen auth target model: [TARGET] Neo4j is for definition-service only (canonical object types); PostgreSQL (tenant-service) is the authoritative auth/RBAC store; Keycloak handles authentication only; auth-facade and user-service are [TRANSITION] services to be removed. No document may present Neo4j as the target auth store.
- [ ] Provider-agnostic auth model consistency maintained.
- [ ] Operational controls and observability requirements documented.
- [ ] Risks and debt implications captured.

## Security Review Checks

- [ ] Transport security: No new `http://` or HTTPS-bypass entries introduced; all inter-service and service-to-database connections use TLS (ADR-022 production-parity gate).
- [ ] Auth policy: `@PreAuthorize` and `@FeatureGate` annotations present and tested for all protected endpoints; 401/403 response paths verified.
- [ ] Data classification: Access controls validated for OPEN, INTERNAL, CONFIDENTIAL, and RESTRICTED levels per ADR-017; classification metadata present on sensitive endpoints.
- [ ] Credential management: No hardcoded passwords, API keys, or fallback defaults in application.yml or application-*.yml; all secrets injected via environment variables (ADR-020).
- [ ] Encryption: Three-tier encryption verified -- volume encryption (LUKS/FileVault) active on data directories, TLS 1.3 configured for all transport channels, Jasypt AES-256 used for sensitive configuration values (ADR-019).
- [ ] Tenant isolation: Tenant predicate present in all data access queries; no endpoint returns data without tenant context; UUID-first external contracts with no internal database IDs exposed (ADR-003, ADR-010).

## Infrastructure Review Checks

- [ ] Docker Compose and Kubernetes manifest parity validated; service definitions, environment variables, and resource mappings consistent across both deployment targets (ADR-022).
- [ ] Database backup scripts operational and tested; backup schedule documented in runbooks; point-in-time recovery verified for PostgreSQL and Neo4j.
- [ ] Health check endpoints (`/actuator/health`) responding for all services; readiness and liveness probes configured in container orchestration manifests.
- [ ] Resource limits (CPU, memory) defined for all containers in docker-compose.yml and Kubernetes manifests; no unbounded resource allocations.
- [ ] Secrets not committed to version control; .gitignore covers .env files, credential files, and TLS private keys; CI pipeline includes secret scanning step.

## Accessibility and UX Checks

- [ ] WCAG 2.2 AA automated scan passes (axe-core integration in Playwright E2E suite); zero critical or serious violations.
- [ ] Keyboard navigation verified on critical flows: login, dashboard navigation, form submission, modal dialogs, and table sorting/pagination.
- [ ] Multi-browser matrix tested: Chromium, Firefox, and WebKit via Playwright; no rendering or functional regressions across browsers.
- [ ] Visual regression baseline compared: current screenshots match approved UX wireframes; any deviations documented and approved by UX agent.

## Governance Outcome

| Decision | Notes |
|----------|-------|
| Approved |  |
| Approved with Conditions |  |
| Rework Required |  |

## Review Sign-off

| Reviewer Role | Name | Decision | Date |
|---------------|------|----------|------|
| Architecture Board |  |  |  |
| Security Lead |  |  |  |
| DevOps Lead |  |  |  |
| QA Lead |  |  |  |
