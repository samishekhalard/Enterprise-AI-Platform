# Release Checklist v2.0

**Version:** 2.0.0
**Last Updated:** 2026-03-02
**Purpose:** Mandatory verification before deploying to any environment
**Governance:** This checklist is enforced by the Release Manager (REL agent)

---

## Quick Reference

| Release Type | Required Sections | Minimum Lead Time |
|-------------|-------------------|-------------------|
| **MAJOR** | All sections | 48 hours code freeze |
| **MINOR** | Sections 1-5, 7-8 | 24 hours code freeze |
| **PATCH** | Sections 1-3, 5, 7-8 | No code freeze |
| **HOTFIX** | Sections 3, 5, 7-8 (abbreviated) | Immediate |

---

## Section 1: Pre-Release - Code Quality

- [ ] VERSION file updated with target version (SemVer format)
- [ ] All CI pipeline checks pass (docs-quality, frontend-strict-quality)
- [ ] Code coverage meets threshold (>= 80% line, >= 75% branch)
- [ ] No CRITICAL or HIGH SonarQube/linter issues
- [ ] All code reviews approved and merged
- [ ] Feature branch merged to main (or release branch created)
- [ ] SDLC evidence files exist:
  - [ ] `docs/sdlc-evidence/ba-signoff.md`
  - [ ] `docs/sdlc-evidence/principles-ack.md`
  - [ ] `docs/sdlc-evidence/qa-report.md`

---

## Section 2: Pre-Release - Testing

### Backend Testing

- [ ] Unit tests pass: `mvn clean test` (all modules)
- [ ] Integration tests pass: `mvn verify -Pintegration` (where applicable)
- [ ] All Flyway migrations run cleanly on fresh database

### Frontend Testing

- [ ] Unit tests pass: `npm run test` (in `frontend/`)
- [ ] Build succeeds with zero errors: `npm run build`
- [ ] Lint passes: `npm run lint`
- [ ] Typecheck passes: `npm run typecheck`

### Staging Testing (MAJOR/MINOR only)

- [ ] E2E tests pass on staging (Playwright)
- [ ] Responsive tests pass (desktop, tablet, mobile viewports)
- [ ] Accessibility tests pass (axe-core, WCAG AAA)
- [ ] Smoke tests pass (login flow, critical path navigation)

### Security Testing (MAJOR only)

- [ ] SAST scan clean (no CRITICAL/HIGH findings)
- [ ] SCA scan clean (`npm audit`, OWASP dependency-check)
- [ ] Container image scan clean (Trivy/Docker Scout)
- [ ] DAST scan clean (OWASP ZAP against staging) [PLANNED]

### Performance Testing (MAJOR only)

- [ ] Load test results within SLO thresholds [PLANNED]
- [ ] No memory leak detected in soak test [PLANNED]

---

## Section 3: Pre-Release - Database

**RULE: NEVER deploy without a database backup. No exceptions.**

### Backup Verification

- [ ] PostgreSQL: All databases backed up (`pg_dumpall` or per-database `pg_dump -Fc`)
  - [ ] `master_db` (tenant registry)
  - [ ] `keycloak_db` (identity data)
  - [ ] `user_db`
  - [ ] `license_db`
  - [ ] `notification_db`
  - [ ] `audit_db`
  - [ ] `ai_db`
- [ ] Neo4j: Database dump completed (`neo4j-admin database dump`)
- [ ] Valkey: RDB snapshot taken (`BGSAVE`)
- [ ] Backup files verified non-empty and valid
- [ ] Backup stored in designated backup directory with timestamp

### Migration Verification

- [ ] All new Flyway migrations tested on dev environment first
- [ ] No modified existing migrations (new versions only)
- [ ] Destructive migrations (DROP, ALTER with data loss) approved by DBA
- [ ] Rollback SQL scripts exist for major migrations
- [ ] Migration order verified (version numbers sequential)

---

## Section 4: Pre-Release - Documentation

- [ ] Release notes drafted (Keep a Changelog format)
- [ ] Breaking changes documented with migration path
- [ ] API documentation updated (OpenAPI specs)
- [ ] Arc42 sections updated (if architectural change)
- [ ] ADR status tags accurate
- [ ] Runbooks updated (if operational change)

---

## Section 5: Pre-Release - Infrastructure

- [ ] Docker Compose file reviewed for correct image versions
- [ ] Environment variables reviewed (`.env.dev` / `.env.staging`)
- [ ] No secrets committed to repository
- [ ] Resource limits appropriate for target environment
- [ ] Health checks configured for all services
- [ ] Rollback procedure documented and tested

---

## Section 6: Release Preparation - Communication

- [ ] Stakeholders notified of release window
  - Major: 72 hours advance notice
  - Minor: 48 hours advance notice
  - Patch: 24 hours advance notice
- [ ] Support team briefed on changes
- [ ] Known issues and workarounds documented
- [ ] Release announcement prepared

---

## Section 7: Deployment Execution

### Pre-Deployment (T-30 minutes)

- [ ] Verify staging deployment successful (if applicable)
- [ ] Database backup completed and verified (Section 3)
- [ ] Monitoring systems operational
- [ ] Rollback procedure ready and tested
- [ ] On-call engineer confirmed available

### During Deployment

```bash
# Step 1: Pull latest tagged code
git checkout v<X.Y.Z>

# Step 2: Build and deploy (Staging example)
docker compose -f docker-compose.staging.yml --env-file .env.staging up --build -d

# Step 3: Monitor startup
docker compose -f docker-compose.staging.yml logs -f --tail=50
```

- [ ] Deployment command executed
- [ ] Container startup logs reviewed (no errors)
- [ ] All health checks pass (wait for healthy status)
- [ ] Smoke tests pass:
  - [ ] API Gateway responds: `curl localhost:8080/actuator/health`
  - [ ] Frontend loads: `curl -s localhost:4200`
  - [ ] Login flow works (manual verification)

### Post-Deployment (T+0 to T+30 minutes)

- [ ] All services report healthy status
- [ ] Error rates normal (no increase from baseline)
- [ ] Response times normal (p95 < 500ms)
- [ ] Application logs clean (no unexpected errors)
- [ ] Critical user flows verified:
  - [ ] Login/logout
  - [ ] Tenant resolution
  - [ ] Navigation to administration pages

---

## Section 8: Rollback Decision

### Automatic Rollback Triggers

| Condition | Action | Time Limit |
|-----------|--------|------------|
| Error rate > 1% | Immediate rollback | 0 minutes |
| p95 latency > 500ms (sustained) | Investigate, then rollback | 10 minutes |
| Critical functionality broken | Immediate rollback | 0 minutes |
| Database migration failed | Restore from backup | 0 minutes |
| Health checks failing | Immediate rollback | 5 minutes |
| Data corruption detected | Immediate rollback + restore | 0 minutes |

### Rollback Execution

```bash
# Step 1: Stop all application services
docker compose -f docker-compose.staging.yml stop \
  auth-facade tenant-service user-service license-service \
  notification-service audit-service ai-service api-gateway frontend

# Step 2: Restore databases (if migration was applied)
BACKUP_DIR="./backups/<TIMESTAMP>"
docker exec -i postgres psql -U postgres < "${BACKUP_DIR}/pg_dumpall.sql"

# Step 3: Checkout previous version
git checkout v<PREVIOUS.VERSION>

# Step 4: Rebuild and start
docker compose -f docker-compose.staging.yml --env-file .env.staging up --build -d

# Step 5: Verify rollback
curl -s http://localhost:8080/actuator/health | jq .
```

- [ ] Rollback executed successfully (if triggered)
- [ ] All services healthy after rollback
- [ ] Data integrity verified after restore
- [ ] Stakeholders notified of rollback

---

## Section 9: Post-Release

- [ ] Notify stakeholders of successful release
- [ ] Update release notes with actual deployment date
- [ ] Close related issues/tickets
- [ ] Monitor for 24 hours for delayed issues
- [ ] Schedule post-release retrospective (MAJOR releases only)
- [ ] Archive backup files per retention policy

---

## Sign-Off

### Required Approvals

| Role | Signature | Date |
|------|-----------|------|
| Release Manager | [ ] _____________ | ____-__-__ |
| QA Lead | [ ] _____________ | ____-__-__ |
| Tech Lead | [ ] _____________ | ____-__-__ |
| DevOps Lead | [ ] _____________ | ____-__-__ |
| Product Owner (MAJOR only) | [ ] _____________ | ____-__-__ |

### Release Record

```
Release: v___.___.___
Date: YYYY-MM-DD HH:MM UTC
Release Manager: _______________
Environment: Dev / Staging / Production
Duration: ___ minutes
Result: SUCCESS / ROLLBACK
```

---

## Related Documents

- [Release Management Framework](/docs/governance/RELEASE-MANAGEMENT.md)
- [RUNBOOK-006: Deployment Rollback](/runbooks/operations/RUNBOOK-006-DEPLOYMENT-ROLLBACK.md)
- [RUNBOOK-011: Major Upgrade](/runbooks/operations/RUNBOOK-011-MAJOR-UPGRADE.md)
- [Pre-Commit Checklist](./pre-commit-checklist.md)
- [Design Review Checklist](./design-review-checklist.md)

---

## Changelog

| Version | Date | Changes |
|---------|------|---------|
| 2.0.0 | 2026-03-02 | Complete rewrite with database backup gates, rollback procedures, environment-specific sections |
| 1.0.0 | 2026-02-25 | Initial release checklist |
