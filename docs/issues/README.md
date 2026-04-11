# Issue Tracker

## Folder Structure

```
docs/issues/
├── README.md          ← This file
├── open/              ← Active issues under investigation or implementation
└── closed/            ← Resolved issues with closure reports
    └── ISSUE-NNN/     ← Each issue gets its own folder
        ├── CLOSURE-REPORT.md   ← Required: actions taken + lessons learned
        └── ISSUE-NNN-*.md      ← SDLC agent artifacts
```

## Conventions

- **Issue ID format:** `ISSUE-NNN` (zero-padded, sequential)
- **Open issues** live in `open/` as individual `.md` files or sub-folders
- **Closed issues** are moved to `closed/ISSUE-NNN/` with a mandatory `CLOSURE-REPORT.md`
- Each closure report must include: summary, closure actions per sub-issue, known gaps, and lessons learned

## Reusable Templates

- Issue report template: `docs/governance/templates/issue-report-template.md`
- Change request template: `docs/governance/templates/change-request-template.md`
- Requirements template: `docs/governance/templates/requirements-template.md`

## Closed Issues

| Issue | Title | Closed | Summary |
|-------|-------|--------|---------|
| [ISSUE-001](closed/ISSUE-001/CLOSURE-REPORT.md) | Master Tenant Authentication & Superuser Configuration | 2026-03-01 | Fixed API gateway 404, wired Keycloak init sidecar, completed auth-facade login flow, added Users tab |

## Open Issues — Feature/Bug

| Issue | Title | Opened | Summary |
|-------|-------|--------|---------|
| [ISSUE-002](open/ISSUE-002-tenant-auth-providers-access-denied.md) | Tenant Authentication Tab Shows "No Identity Providers" Despite Preconfigured Keycloak | 2026-03-01 | SUPER_ADMIN requests to tenant admin provider endpoints are denied by strict ADMIN-only checks; frontend then renders misleading empty-state. |
| [ISSUE-003](open/ISSUE-003-license-admin-403-gateway-routing.md) | License Management Shows "Insufficient Permissions" Due to Gateway Routing and Auth Mismatch | 2026-03-02 | Docker gateway profile misses explicit license-admin routes, so requests are misrouted to auth-facade `/api/v1/admin/**` and rejected with 403; includes follow-up fix plan for role mapping and import header handling. |
| [ISSUE-004](open/ISSUE-004-admin-back-forward-login-history-loop.md) | Browser Back/Forward Shows Login for Authenticated Admin Sessions | 2026-03-03 | Login route remains in browser history after auth success and `/auth/login` is still accessible while authenticated, causing Back/Forward loop confusion around Tenant Management. |
| [ISSUE-005](open/ISSUE-005-auth-boundary-bypass-header-trust.md) | Auth Boundary Bypass via Permissive Gateway and Header Trust | 2026-03-03 | Gateway and multiple services permit requests without enforced auth while downstream controllers trust identity headers, creating spoofing and unauthorized access risk. |

## Open Issues — Infrastructure Audit (2026-03-02)

**Source:** ARCH (76% adherence), SA (4.7/10 isolation), SEC (17 findings) audit agents

### CRITICAL (P0) — 5 Issues

| Issue | Title | Category | Status |
|-------|-------|----------|--------|
| [ISSUE-INF-001](open/ISSUE-INF-001.md) | Single flat Docker network | Security | OPEN |
| [ISSUE-INF-002](open/ISSUE-INF-002.md) | Frontend can reach databases directly | Security | OPEN |
| [ISSUE-INF-003](open/ISSUE-INF-003.md) | `docker compose down -v` destroys all data | HA | OPEN |
| [ISSUE-INF-004](open/ISSUE-INF-004.md) | All services use `postgres` superuser | Security | OPEN |
| [ISSUE-INF-005](open/ISSUE-INF-005.md) | No network policy enforcement between tiers | Security | OPEN |

### HIGH (P1) — 12 Issues

| Issue | Title | Category | Status |
|-------|-------|----------|--------|
| [ISSUE-INF-006](open/ISSUE-INF-006.md) | Backend ports exposed to host unnecessarily | Security | OPEN |
| [ISSUE-INF-007](open/ISSUE-INF-007.md) | No independent data tier lifecycle | Architecture | OPEN |
| [ISSUE-INF-008](open/ISSUE-INF-008.md) | Hardcoded credential defaults in application.yml | Security | OPEN |
| [ISSUE-INF-009](open/ISSUE-INF-009.md) | 7/8 backend services lack JWT validation | Security | OPEN |
| [ISSUE-INF-010](open/ISSUE-INF-010.md) | No per-service database users | Data Isolation | OPEN |
| [ISSUE-INF-011](open/ISSUE-INF-011.md) | application.yml defaults point to wrong database | Data Isolation | OPEN |
| [ISSUE-INF-012](open/ISSUE-INF-012.md) | ai-service missing sslmode=verify-full | Security | OPEN |
| [ISSUE-INF-013](open/ISSUE-INF-013.md) | Neo4j community — no role-based access | Security | OPEN |
| [ISSUE-INF-014](open/ISSUE-INF-014.md) | Valkey has no AUTH password | Security | OPEN |
| [ISSUE-INF-015](open/ISSUE-INF-015.md) | Kafka has no SASL authentication | Security | OPEN |
| [ISSUE-INF-016](open/ISSUE-INF-016.md) | No encryption at rest for PostgreSQL | Encryption | OPEN |
| [ISSUE-INF-017](open/ISSUE-INF-017.md) | No encryption at rest for Neo4j | Encryption | OPEN |

### MEDIUM (P2) — 10 Issues

| Issue | Title | Category | Status |
|-------|-------|----------|--------|
| [ISSUE-INF-018](open/ISSUE-INF-018.md) | No encryption at rest for Valkey | Encryption | OPEN |
| [ISSUE-INF-019](open/ISSUE-INF-019.md) | Session lifecycle not enforced E2E | Architecture | OPEN |
| [ISSUE-INF-020](open/ISSUE-INF-020.md) | Token blacklist not verified in API gateway | Security | OPEN |
| [ISSUE-INF-021](open/ISSUE-INF-021.md) | No TLS for Valkey connections | Encryption | OPEN |
| [ISSUE-INF-022](open/ISSUE-INF-022.md) | No TLS for Neo4j Bolt connections | Encryption | OPEN |
| [ISSUE-INF-023](open/ISSUE-INF-023.md) | Broken Feign client (auth-facade to license-service) | Architecture | OPEN |
| [ISSUE-INF-024](open/ISSUE-INF-024.md) | Kafka dead listeners (no producers) | Architecture | OPEN |
| [ISSUE-INF-025](open/ISSUE-INF-025.md) | MailHog exposed on host network | Security | OPEN |
| [ISSUE-INF-026](open/ISSUE-INF-026.md) | No container resource limits | Security | OPEN |
| [ISSUE-INF-027](open/ISSUE-INF-027.md) | Flyway repair-on-mismatch enabled | Data Isolation | OPEN |

### LOW (P3) — 3 Issues (Process Service — Lowest Priority)

| Issue | Title | Category | Status |
|-------|-------|----------|--------|
| [ISSUE-INF-028](open/ISSUE-INF-028.md) | process-service no Docker Compose entry | Architecture | OPEN |
| [ISSUE-INF-029](open/ISSUE-INF-029.md) | process-service no API gateway route | Architecture | OPEN |
| [ISSUE-INF-030](open/ISSUE-INF-030.md) | process_db created but not used | Data Isolation | OPEN |

### Infrastructure Issue Summary

| Severity | Count | Percentage |
|----------|-------|------------|
| CRITICAL (P0) | 5 | 17% |
| HIGH (P1) | 12 | 40% |
| MEDIUM (P2) | 10 | 33% |
| LOW (P3) | 3 | 10% |
| **Total** | **30** | **100%** |

### Related Documents

- [Architecture Adherence Audit](../governance/ARCHITECTURE-ADHERENCE-AUDIT.md)
- [Service Boundary Audit](../governance/SERVICE-BOUNDARY-AUDIT.md)
- [Security Tier Boundary Audit](../governance/SECURITY-TIER-BOUNDARY-AUDIT.md)
- [ADR-019: Encryption at Rest](../adr/ADR-019-encryption-at-rest.md)
- [ADR-020: Service Credential Management](../adr/ADR-020-service-credential-management.md)
- [ADR-018: High Availability Multi-Tier](../adr/ADR-018-high-availability-multi-tier.md)
