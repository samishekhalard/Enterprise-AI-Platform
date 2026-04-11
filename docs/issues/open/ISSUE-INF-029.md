# ISSUE-INF-029: process-service Has No API Gateway Route

| Field | Value |
|-------|-------|
| Severity | LOW |
| Category | Architecture |
| Source | ARCH-AUDIT-2026-001 |
| Priority | P3 |
| Status | OPEN |
| Opened | 2026-03-02 |
| Blocked By | ISSUE-INF-028 |
| Fixes | backend/api-gateway RouteConfig.java |
| Closes With | Add `/api/v1/processes/**` route to API gateway |

## Description

process-service has no route configured in the API gateway's `RouteConfig.java`. Even if process-service were running, external clients could not reach it through the gateway.

## Evidence

- `api-gateway/src/.../config/RouteConfig.java`: No route for `process-service`
- process-service listens on port 8089 but is unreachable via gateway
- Other services (auth-facade, tenant-service, user-service, license-service) all have gateway routes

## Remediation

Add route to `RouteConfig.java`:
```java
.route("process-service", r -> r
    .path("/api/v1/processes/**")
    .uri("http://process-service:8089"))
```

## Acceptance Criteria

- [ ] `/api/v1/processes/**` routes to process-service through gateway
- [ ] Route includes tenant context filter
- [ ] Route is tested with integration test
