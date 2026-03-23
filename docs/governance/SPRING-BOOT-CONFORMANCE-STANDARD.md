# Spring Boot Architectural Conformance Standard

**Version:** 1.0.0  
**Status:** Active  
**Owner:** Architecture Team  
**Effective Date:** 2026-03-01

---

## 1. Purpose

This standard defines mandatory architectural and implementation conformance for Spring Boot services in EMSIST. It converts high-level guidance into enforceable rules for design reviews, implementation, and CI quality gates.

---

## 2. Baseline Technology Profile

| Area | Standard |
|------|----------|
| Java | 23 for development, 21 LTS allowed for production runtime |
| Spring Boot | 3.4.x baseline |
| Spring Cloud | 2024.0.x BOM baseline |
| API Style | REST with `/api/v1` versioning |
| Persistence | Spring Data (JPA/Neo4j as service-specific) |
| Connection Pool | HikariCP |
| Observability | Actuator + Micrometer metrics + distributed tracing |
| Security | Spring Security 6, OAuth2/OIDC, JWT resource server |

Rule: any version deviation from this baseline requires an ADR or an approved exception.

---

## 3. Structural Conformance

### 3.1 Packaging and Module Boundaries

Default model: **feature-first packaging** aligned to business capabilities.

Allowed package pattern:

```text
com.ems.{service}
  ├─ {featureA}
  │   ├─ api
  │   ├─ application
  │   ├─ domain
  │   └─ infrastructure
  └─ {featureB}
```

Rules:

1. Cross-feature access must occur through explicit interfaces/events, not internal class injection.
2. Layer-first layouts are allowed only for small or temporary modules with explicit approval.
3. The `@SpringBootApplication` class must live at the root package to preserve component scan correctness.

### 3.2 Multi-Module Build Direction

When a service is split into modules, enforce one-way dependency flow:

`api -> core -> persistence -> web` is forbidden.  
`web -> core -> persistence` and `core -> api` are allowed.

The parent build must centralize versions through a BOM and dependency management.

---

## 4. Cloud-Native and 12-Factor Conformance

1. One deployable artifact per service and one codebase per service repository segment.
2. Configuration must be externalized (`application-*.yml`, environment variables, secret stores).
3. No credentials in source control, test fixtures excluded.
4. Processes must remain stateless; local filesystem state is non-authoritative.
5. Actuator health endpoints must support orchestrator liveness/readiness probes.
6. Build once, promote same artifact across environments.

---

## 5. Persistence and Transaction Standards

### 5.1 Mandatory Defaults

| Property | Required Setting | Why |
|----------|------------------|-----|
| `spring.jpa.open-in-view` | `false` | Prevent long-lived sessions and hidden lazy loads |
| `spring.datasource.hikari.auto-commit` | `false` (unless justified) | Explicit transaction boundaries |
| `@Transactional` placement | Service layer | Keep transaction scope at business boundary |

### 5.2 Connection Pool Tuning Policy

Hikari values must be workload-tested. Start from conservative defaults and tune with load data.

Suggested baseline:

- `maximumPoolSize`: 20-30 (service- and DB-limit dependent)
- `minimumIdle`: 5
- `idleTimeout`: 30000
- `maxLifetime`: lower than database connection lifetime

### 5.3 Query and Consistency Rules

1. Fetch strategy must be explicit in service methods (DTO projection or join fetch), not implicit in view rendering.
2. N+1 query paths must be covered by integration tests.
3. For DB + broker consistency, prefer transactional outbox over distributed XA transactions.

---

## 6. Concurrency Standard (Virtual Threads)

Virtual threads are recommended for high I/O workloads on Java 21+.

Rules:

1. Enable with `spring.threads.virtual.enabled=true` only after load validation.
2. Avoid long critical sections with `synchronized` around blocking I/O; use lock constructs when needed.
3. Minimize `ThreadLocal` usage in request paths; clear context deterministically.
4. Keep imperative code style unless reactive model is explicitly required by streaming/backpressure constraints.

---

## 7. Observability Standard

### 7.1 Required Signals

| Signal | Standard |
|--------|----------|
| Metrics | Micrometer + Prometheus/OTLP export |
| Tracing | Micrometer Tracing with W3C trace context propagation |
| Logs | Structured logs with trace/span correlation identifiers |
| Health | Actuator health groups for readiness/liveness |

### 7.2 Implementation Rules

1. Expose only required actuator endpoints; secure or isolate management surface.
2. HTTP clients must be created via Spring-managed builders (`RestClient.Builder`, `WebClient.Builder`) to preserve trace propagation.
3. Dashboards and alerts must be defined for latency, error rate, saturation, and availability.

---

## 8. Security Conformance

1. OAuth2/OIDC is the default identity protocol model.
2. Resource APIs must validate JWT access tokens with issuer/audience checks.
3. Public OAuth clients must use PKCE in authorization-code flows.
4. Enforce RBAC/scope-based authorization with least privilege.
5. All traffic must run on HTTPS/TLS 1.2+ outside local development.
6. Apply input validation (`@Valid`) on public request contracts.
7. Apply rate limiting on sensitive and high-abuse endpoints.
8. Secrets must come from environment/secret manager integrations, never hardcoded.

---

## 9. Architectural Governance (Modulith + ArchUnit)

For modular monoliths and large services, use code-level guardrails:

1. Define module boundaries by package and verify dependency direction.
2. Add ArchUnit tests that enforce:
   - Controllers do not depend directly on repositories.
   - Services do not bypass feature/module boundaries.
   - No circular dependencies between feature packages.
3. Treat architecture rules as CI gates; failing rules block merge.

---

## 10. Testing Conformance

| Test Tier | Standard |
|-----------|----------|
| Unit | Fast, isolated, highest volume |
| Slice | `@WebMvcTest`, `@DataJpaTest`, focused context tests |
| Integration | Real dependencies via Testcontainers where feasible |
| Contract | Required for inter-service API compatibility |
| E2E | Limited to critical business flows |

Rules:

1. New endpoints require unit + integration coverage.
2. Data access changes require query-level regression tests.
3. Performance-sensitive changes require benchmark/load evidence before release.

---

## 11. Conformance Checklist (Design/PR Gate)

Mark each item `PASS`, `N/A`, or `FAIL` during reviews:

1. Package structure is feature-aligned and dependency direction is valid.
2. `@SpringBootApplication` class is at service root package.
3. No secrets are committed; runtime config is externalized.
4. `spring.jpa.open-in-view=false` is enforced.
5. Transaction boundaries are in service layer, not controller layer.
6. Connection pool limits are explicitly configured and justified.
7. Actuator health/metrics/tracing are enabled and secured.
8. Trace propagation preserved across outbound HTTP clients.
9. OAuth2/OIDC and JWT validation rules are enforced.
10. ArchUnit (or equivalent) architecture rules are present for boundary enforcement.
11. Testcontainers-backed integration tests exist for persistence-critical paths.
12. CI gates include lint, tests, and architecture conformance checks.

---

## 12. Roadmap Alignment

This standard is forward-compatible with upcoming Spring Boot and Jakarta evolution. Any migration to Spring Boot 4.x or Jakarta EE 11+ must preserve the above conformance domains unless superseded by an ADR.
