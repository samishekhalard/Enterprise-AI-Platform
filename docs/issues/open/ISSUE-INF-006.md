# ISSUE-INF-006: Backend Services Expose Ports to Host Unnecessarily

| Field | Value |
|-------|-------|
| Severity | HIGH |
| Category | Security |
| Source | SEC-05 |
| Priority | P1 |
| Status | OPEN |
| Opened | 2026-03-02 |
| Blocked By | — |
| Fixes | docker-compose.dev-app.yml, docker-compose.staging-app.yml |
| Closes With | Phase 2 — Docker Tier Split |

## Description

All backend services have `ports:` bindings that expose their internal ports to the host network. In production, backend services should only be accessible via the API gateway. Direct host access bypasses gateway-level security (rate limiting, tenant context, JWT validation).

## Evidence

- docker-compose.dev.yml: auth-facade `28081:8081`, tenant-service `28082:8082`, etc.
- docker-compose.staging.yml: auth-facade `8081:8081`, tenant-service `8082:8082`, etc.
- All 8 backend services have host port bindings

## Remediation

- **Dev:** Keep port bindings for debugging but document as debug-only
- **Staging:** Remove all backend `ports:` bindings; access only via api-gateway
- **Production (K8s):** Services use ClusterIP (no NodePort/LoadBalancer except gateway)

## Acceptance Criteria

- [ ] In staging, `curl localhost:8081/actuator/health` fails (port not bound)
- [ ] In staging, `curl localhost:8080/api/v1/auth/health` succeeds (via gateway)
- [ ] Dev retains debug ports with clear documentation
