# ISSUE-INF-026: No Container Resource Limits

| Field | Value |
|-------|-------|
| Severity | MEDIUM |
| Category | Security |
| Source | SEC-15 |
| Priority | P2 |
| Status | OPEN |
| Opened | 2026-03-02 |
| Blocked By | — |
| Fixes | docker-compose.*.yml |
| Closes With | Add `deploy.resources.limits` to all services |

## Description

No Docker Compose service has resource limits (`deploy.resources.limits.memory`, `deploy.resources.limits.cpus`). A single runaway container (memory leak, CPU-bound loop, or crypto-mining exploit) can starve all other containers on the host.

## Evidence

- docker-compose.dev.yml: No `deploy:` section on any service
- docker-compose.staging.yml: Same
- No `mem_limit`, `cpus`, or `deploy.resources` in any service definition

## Remediation

Add resource limits to all services:

```yaml
deploy:
  resources:
    limits:
      memory: 512M
      cpus: '1.0'
    reservations:
      memory: 256M
      cpus: '0.25'
```

Suggested limits by service type:
- PostgreSQL: 1G memory, 2 CPUs
- Neo4j: 1G memory, 2 CPUs
- Valkey: 256M memory, 0.5 CPUs
- Kafka: 1G memory, 1 CPU
- Backend services: 512M memory, 1 CPU
- Frontend (nginx): 128M memory, 0.25 CPUs

## Acceptance Criteria

- [ ] All services have `deploy.resources.limits` defined
- [ ] Limits are appropriate for each service type
- [ ] Services start successfully within their limits
