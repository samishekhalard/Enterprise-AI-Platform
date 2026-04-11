# Documentation Accuracy Sprint - Task Backlog

**Sprint Goal:** Align all documentation (ADRs, arc42, diagrams) with actual implementation state.

**Created:** 2026-02-25
**Status:** Active
**Owner:** PM

> Historical planning snapshot. Current architecture standard is:
> Polyglot persistence per [ADR-016](../adr/ADR-016-polyglot-persistence.md) — Neo4j for auth-facade RBAC/identity graph; PostgreSQL for 7 domain services + Keycloak.
> Canonical references: `docs/arc42/02-constraints.md`, `docs/adr/ADR-001-neo4j-primary.md`, and `docs/adr/ADR-016-polyglot-persistence.md`.
>
> **Historical Note (2026-03-01):** The original documentation baseline ("Neo4j as single application database") was superseded by [ADR-016 Polyglot Persistence](../adr/ADR-016-polyglot-persistence.md) on 2026-02-27. All arc42 sections, governance docs, and validation scripts have been aligned to the polyglot baseline.

---

## Summary

| Priority | Category | Task Count | Estimated Effort |
|----------|----------|------------|------------------|
| P1 | Quick Wins | 4 | 2 hours |
| P2 | Structural Fixes | 5 | 4 hours |
| P3 | Decisions Needed | 3 | 2 hours (discussion) |
| **Total** | | **12** | **8 hours** |

---

## Priority 1: Quick Wins (In Progress)

These are straightforward text corrections that can be completed quickly.

### TASK-DOC-001: Fix ADR-005 Valkey to Valkey

**Status:** Open
**Assignee:** DOC Agent
**Estimated Effort:** 15 minutes

**Description:**
ADR-005 documents Valkey as the caching solution, but the actual `docker-compose.yml` uses Valkey 7 Alpine (`valkey/valkey:8-alpine`). Either update the ADR to reflect Valkey usage or update docker-compose to use Valkey.

**Current State (docker-compose.yml:27-38):**
```yaml
valkey:
  image: valkey/valkey:8-alpine
  container_name: ems-valkey
```

**ADR-005 Claims:**
- Title: "ADR-005: Valkey for Distributed Caching"
- Status: Accepted
- Claims Valkey 8+ as caching layer

**Acceptance Criteria:**
- [ ] ADR-005 title and content updated to reflect Valkey (if keeping Valkey)
- [ ] OR docker-compose.yml updated to use `valkey/valkey:8.0-alpine` (if migrating to Valkey)
- [ ] Application properties reviewed for consistency

**Files to Update:**
- `/Users/mksulty/Claude/EMSIST/docs/adr/ADR-005-valkey-caching.md`
- `/Users/mksulty/Claude/EMSIST/infrastructure/docker/docker-compose.yml` (if migrating)

---

### TASK-DOC-002: Fix ADR-001 Neo4j Scope (auth-facade only)

**Status:** Open
**Assignee:** DOC Agent
**Estimated Effort:** 30 minutes

**Description:**
ADR-001 claims Neo4j is the "primary database engine for all EMS application data." However, docker-compose shows PostgreSQL is actively used and tenant-service connects to PostgreSQL (`DATABASE_URL: jdbc:postgresql://postgres:5432/master_db`).

**Current State:**
- `auth-facade` connects to Neo4j (bolt://neo4j:7687)
- `tenant-service` connects to PostgreSQL (jdbc:postgresql://postgres:5432/master_db)
- PostgreSQL stores master_db (not just Keycloak)

**ADR-001 Claims:**
- "Use Neo4j as the primary database engine for all EMS application data"
- PostgreSQL only for Keycloak

**Acceptance Criteria:**
- [ ] ADR-001 updated to clarify actual Neo4j usage scope (auth-facade for graph roles/permissions)
- [ ] Document that PostgreSQL is used for tenant-service and other platform services
- [ ] Update the decision table to reflect hybrid architecture

**Files to Update:**
- `/Users/mksulty/Claude/EMSIST/docs/adr/ADR-001-neo4j-primary.md`

---

### TASK-DOC-003: Fix ADR-003 Graph-per-Tenant Status

**Status:** Open
**Assignee:** DOC Agent
**Estimated Effort:** 15 minutes

**Description:**
ADR-003 claims graph-per-tenant is "Accepted" and implemented, but the footer says "Implementation Status: Graph-per-tenant is the chosen architecture from day one" without evidence of actual implementation. The docker-compose shows a single Neo4j instance.

**Current State:**
- Single Neo4j instance in docker-compose
- No evidence of multi-database routing implementation
- No TenantContextFilter or TenantAwareNeo4jSessionFactory in codebase

**Acceptance Criteria:**
- [ ] Change ADR-003 status to "Proposed" or "Planned"
- [ ] Add implementation status section showing 0% completion
- [ ] Document current single-database state
- [ ] Add roadmap for future implementation

**Files to Update:**
- `/Users/mksulty/Claude/EMSIST/docs/adr/ADR-003-database-per-tenant.md`

---

### TASK-DOC-004: Fix ADR-006 License-Service Merge Status

**Status:** Open
**Assignee:** DOC Agent
**Estimated Effort:** 15 minutes

**Description:**
ADR-006 is marked as "Proposed (Not Implemented)" with "Implementation Status: 0%", but the arc42 documentation (05-building-blocks.md) states "license-service has been merged into tenant-service." These are contradictory.

**Current State:**
- ADR-006: Status = "Proposed (Not Implemented)", 0% complete
- arc42/05: States merge is complete
- docker-compose: Shows only tenant-service (no license-service)
- But arc42/07: Shows both license-service and license-svc pods

**Acceptance Criteria:**
- [ ] Verify actual codebase state (is license-service merged or separate?)
- [ ] If merged: Update ADR-006 status to "Implemented"
- [ ] If separate: Update arc42/05-building-blocks.md to remove merge claim
- [ ] Ensure arc42/07-deployment-view.md matches actual service list

**Files to Update:**
- `/Users/mksulty/Claude/EMSIST/docs/adr/ADR-006-platform-services-consolidation.md`
- `/Users/mksulty/Claude/EMSIST/docs/arc42/05-building-blocks.md`
- `/Users/mksulty/Claude/EMSIST/docs/arc42/07-deployment-view.md`

---

## Priority 2: Structural Fixes

These require updating diagrams, code blocks, and multiple sections.

### TASK-DOC-005: Fix ADR-007 Auth0/Okta/Azure Status

**Status:** Open
**Assignee:** DOC Agent
**Estimated Effort:** 30 minutes

**Description:**
ADR-007 shows Auth0, Okta, and Azure AD providers as "Planned" in the table, but the architecture diagram and implementation notes suggest they might be implemented. The codebase has application-auth0.yml, application-azure-ad.yml, application-okta.yml files suggesting at least configuration scaffolding exists.

**Current State (from git status):**
- `backend/auth-facade/src/main/resources/application-auth0.yml` (untracked)
- `backend/auth-facade/src/main/resources/application-azure-ad.yml` (untracked)
- `backend/auth-facade/src/main/resources/application-okta.yml` (untracked)

**Acceptance Criteria:**
- [ ] Review actual provider implementation status in auth-facade
- [ ] Update ADR-007 provider status table accurately
- [ ] If config-only exists, mark as "Configuration Ready, Not Tested"
- [ ] If implementations exist, mark as "Implemented" with testing status

**Files to Update:**
- `/Users/mksulty/Claude/EMSIST/docs/adr/ADR-007-auth-facade-provider-agnostic.md`

---

### TASK-DOC-006: Fix arc42/05 Building Blocks Diagram

**Status:** Open
**Assignee:** DOC Agent
**Estimated Effort:** 45 minutes

**Description:**
The arc42/05-building-blocks.md diagram shows "Valkey :6379" but actual docker-compose uses Valkey. The diagram must accurately reflect deployed infrastructure.

**Issues Found:**
1. Shows "Valkey" but implementation uses Valkey
2. Shows merged tenant-service but this contradicts ADR-006 status
3. Missing Eureka service discovery (present in docker-compose)
4. Missing Zookeeper (present in docker-compose)

**Acceptance Criteria:**
- [ ] Update diagram to show Valkey (or Valkey if migrating)
- [ ] Align tenant-service representation with ADR-006 actual status
- [ ] Add Eureka to diagram if still in use
- [ ] Add or document Kafka/Zookeeper in data layer
- [ ] Update "Contained Building Blocks" table

**Files to Update:**
- `/Users/mksulty/Claude/EMSIST/docs/arc42/05-building-blocks.md`

---

### TASK-DOC-007: Fix arc42/06 Runtime Sequence Diagrams

**Status:** Open
**Assignee:** DOC Agent
**Estimated Effort:** 45 minutes

**Description:**
Runtime sequence diagrams reference "Keycloak" directly but ADR-007 states the system is provider-agnostic. Diagrams should show "Identity Provider" abstraction, not specific provider names.

**Issues Found:**
1. Section 6.1: Shows "K as Keycloak" participant
2. Section 6.3: Shows "L as license-service" but ADR-006 says merged into tenant-service
3. Inconsistent service references throughout

**Acceptance Criteria:**
- [ ] Replace "Keycloak" participant with "IDP as Identity Provider"
- [ ] Add note that Keycloak is the default implementation
- [ ] Fix license-service references to align with ADR-006 status
- [ ] Ensure all sequence diagrams use consistent service names

**Files to Update:**
- `/Users/mksulty/Claude/EMSIST/docs/arc42/06-runtime-view.md`

---

### TASK-DOC-008: Fix arc42/07 Deployment View to Match docker-compose

**Status:** Open
**Assignee:** DOC Agent
**Estimated Effort:** 1 hour

**Description:**
The arc42/07-deployment-view.md shows a different architecture than the actual docker-compose.yml. Critical differences exist in infrastructure and service definitions.

**Differences Found:**

| Component | arc42/07 | docker-compose.yml |
|-----------|----------|-------------------|
| Cache | Valkey cluster (3 nodes) | valkey/valkey:8-alpine (single) |
| Service Discovery | Not shown | Eureka (present) |
| license-service | Listed as separate pod | Not present |
| PostgreSQL | Only for Keycloak | Also for master_db |
| Neo4j | Enterprise | Community edition |

**Acceptance Criteria:**
- [ ] Update Kubernetes diagram to reflect actual services
- [ ] Update docker-compose example in section 7.3 to match actual file
- [ ] Fix Valkey vs Valkey references
- [ ] Add or remove license-service consistently
- [ ] Update PostgreSQL usage description
- [ ] Note Neo4j Community vs Enterprise difference

**Files to Update:**
- `/Users/mksulty/Claude/EMSIST/docs/arc42/07-deployment-view.md`

---

### TASK-DOC-009: Remove/Update Eureka-Server References

**Status:** Open
**Assignee:** DOC Agent
**Estimated Effort:** 30 minutes

**Description:**
The docker-compose.yml includes Eureka service discovery (lines 128-136), but neither arc42 architecture documentation nor the building blocks diagram mention it. Either document Eureka properly or confirm if it's being deprecated in favor of Kubernetes service discovery.

**Current State (docker-compose.yml:128-136):**
```yaml
eureka:
  build:
    context: ../../backend/eureka-server
    dockerfile: Dockerfile
  container_name: ems-eureka
  ports:
    - "8761:8761"
```

**Questions to Answer:**
1. Is Eureka required for local development only?
2. Is Kubernetes service discovery used in production?
3. Should services register with Eureka?

**Acceptance Criteria:**
- [ ] Add Eureka to arc42/05-building-blocks.md if it's part of architecture
- [ ] OR add ADR explaining service discovery strategy
- [ ] OR remove Eureka from docker-compose if deprecated
- [ ] Document the service discovery approach in arc42/08-crosscutting.md

**Files to Update:**
- `/Users/mksulty/Claude/EMSIST/docs/arc42/05-building-blocks.md`
- `/Users/mksulty/Claude/EMSIST/docs/arc42/08-crosscutting.md`
- `/Users/mksulty/Claude/EMSIST/infrastructure/docker/docker-compose.yml` (if removing)

---

## Priority 3: Decisions Needed

These tasks require stakeholder input before documentation can be finalized.

### TASK-DEC-001: Decide - Migrate to Valkey or Keep Valkey?

**Status:** Decision Required
**Assignee:** Architecture Team
**Estimated Effort:** 30 minutes discussion

**Description:**
ADR-005 recommends Valkey but implementation uses Valkey. A decision is needed to resolve this inconsistency.

**Options:**
1. **Keep Valkey** - Update ADR-005 to document Valkey choice, remove Valkey references
2. **Migrate to Valkey** - Update docker-compose and all configs to use Valkey 8

**Considerations:**
- Valkey is the open-source fork of Valkey (no license concerns)
- Valkey 7 is source-available (SSPL license)
- Both are protocol-compatible
- Valkey is recommended by Linux Foundation

**Decision Required:**
- [ ] Schedule architecture review
- [ ] Document decision rationale
- [ ] Update ADR-005 based on decision
- [ ] Update infrastructure configs if migrating

**Stakeholders:** Architecture Team, DevOps, PM

---

### TASK-DEC-002: Decide - Implement Multi-Provider Auth or Defer?

**Status:** Decision Required
**Assignee:** Architecture Team, PM
**Estimated Effort:** 30 minutes discussion

**Description:**
ADR-007 describes a provider-agnostic architecture with Auth0, Okta, and Azure AD support. Configuration files exist but implementation status is unclear. Need to decide priority.

**Options:**
1. **Defer** - Mark as "Future Enhancement", focus on Keycloak stability
2. **Implement Auth0 First** - Complete Auth0 implementation as second provider
3. **Full Implementation** - Complete all four providers before next release

**Considerations:**
- Enterprise sales may require provider flexibility
- Additional testing burden per provider
- Government contracts may mandate Azure AD
- Keycloak works well for current use cases

**Decision Required:**
- [ ] Review sales pipeline for provider requirements
- [ ] Assess implementation effort per provider
- [ ] Prioritize based on business value
- [ ] Update ADR-007 status table

**Stakeholders:** PM, Sales, Architecture Team

---

### TASK-DEC-003: Decide - Implement Graph-per-Tenant or Keep Current Model?

**Status:** Decision Required
**Assignee:** Architecture Team, PM
**Estimated Effort:** 1 hour discussion

**Description:**
ADR-003 describes graph-per-tenant isolation using Neo4j multi-database. Current implementation appears to be single-database. Need to decide whether to pursue this architecture.

**Options:**
1. **Keep Single Database** - Use tenant labels for isolation (simpler, lower cost)
2. **Implement Graph-per-Tenant** - Full Neo4j Enterprise multi-database (higher isolation)
3. **Hybrid Approach** - Graph-per-tenant for Enterprise tier only

**Considerations:**
- Neo4j Enterprise required for multi-database (licensing cost)
- Graph-per-tenant provides physical isolation (compliance benefit)
- Single database simpler to operate and backup
- Current load may not justify complexity

**Decision Required:**
- [ ] Review compliance requirements (GDPR, SOC2)
- [ ] Assess Neo4j Enterprise licensing cost
- [ ] Define tenant isolation SLA requirements
- [ ] Update ADR-003 based on decision

**Stakeholders:** PM, Architecture Team, Compliance, Finance

---

## Task Tracking

### Status Key

| Status | Description |
|--------|-------------|
| Open | Not started |
| In Progress | Work underway |
| Blocked | Waiting on dependency |
| Decision Required | Needs stakeholder input |
| Review | Ready for review |
| Done | Completed and verified |

### Sprint Progress

```
P1 Quick Wins:     [____] 0/4 complete
P2 Structural:     [____] 0/5 complete
P3 Decisions:      [____] 0/3 resolved
```

---

## Appendix: File Cross-Reference

| File | Related Tasks |
|------|---------------|
| docs/adr/ADR-001-neo4j-primary.md | TASK-DOC-002 |
| docs/adr/ADR-003-database-per-tenant.md | TASK-DOC-003, TASK-DEC-003 |
| docs/adr/ADR-005-valkey-caching.md | TASK-DOC-001, TASK-DEC-001 |
| docs/adr/ADR-006-platform-services-consolidation.md | TASK-DOC-004 |
| docs/adr/ADR-007-auth-facade-provider-agnostic.md | TASK-DOC-005, TASK-DEC-002 |
| docs/arc42/05-building-blocks.md | TASK-DOC-004, TASK-DOC-006, TASK-DOC-009 |
| docs/arc42/06-runtime-view.md | TASK-DOC-007 |
| docs/arc42/07-deployment-view.md | TASK-DOC-004, TASK-DOC-008 |
| docs/arc42/08-crosscutting.md | TASK-DOC-009 |
| infrastructure/docker/docker-compose.yml | TASK-DOC-001, TASK-DOC-008, TASK-DOC-009 |

---

**Next Actions:**
1. Assign DOC agents to P1 tasks immediately
2. Schedule architecture review for P3 decisions
3. Block P2 tasks pending P3 decision outcomes

**Sprint End Date:** TBD based on team capacity
