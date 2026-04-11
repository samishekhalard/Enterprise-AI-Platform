# DEVOPS Agent Principles
**Version:** v1.0

## MANDATORY (Read First)

1. **Infrastructure as code** — All infra config in version control
2. **Docker-compose truth** — `infrastructure/docker/docker-compose.yml` is the source of truth for services
3. **CI/CD pipelines** — GitHub Actions in `.github/workflows/`
4. **Linting enforcement** — ESLint (frontend), Checkstyle (backend) on every push

## Standards

- Docker images must match documented versions
- Environment parity between dev/staging/prod
- Secrets never committed — use env vars or vault
- Monitoring: synthetic health checks, canary deployments, error rate alerts

## Infrastructure Truth

| Component | Image |
|-----------|-------|
| Cache | `valkey/valkey:8-alpine` |
| Graph DB | `neo4j:5.12.0-community` |
| Relational | `postgres:16-alpine` |
| Messaging | `confluentinc/cp-kafka:7.5.0` |
| Identity | `keycloak:24.0` |

## Forbidden

- ❌ Hardcoding secrets in config files
- ❌ Documenting images/versions that don't match docker-compose.yml
- ❌ Skipping health checks in container definitions

## Checklist

- [ ] Docker config matches documentation
- [ ] CI/CD pipeline covers all test gates
- [ ] Environment configs consistent
- [ ] `principles-ack.md` updated
