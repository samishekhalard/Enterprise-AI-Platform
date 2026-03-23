# ISSUE-INF-013: Neo4j Community Edition — No Role-Based Access Control

| Field | Value |
|-------|-------|
| Severity | HIGH |
| Category | Security |
| Source | SEC-09 |
| Priority | P1 |
| Status | OPEN |
| Opened | 2026-03-02 |
| Blocked By | — |
| Fixes | docker-compose.*.yml (image version) |
| Closes With | Phase 3 — Evaluate Enterprise or application-level ACL |

## Description

EMSIST uses `neo4j:5.12.0-community` which does not support native role-based access control (RBAC). All Neo4j connections use the single `neo4j` admin user. Neo4j Enterprise edition provides fine-grained RBAC with multiple database users and access restrictions.

## Evidence

- docker-compose.dev.yml: `image: neo4j:5.12.0-community`
- docker-compose.staging.yml: same
- Only `neo4j` admin user available in community edition
- No `GRANT` or `DENY` privileges possible

## Remediation

Options (in order of preference):
1. **Application-level ACL:** auth-facade is the only service using Neo4j — enforce access control in Java code
2. **Neo4j Enterprise:** Evaluate licensing costs for RBAC, multiple users, database-level isolation
3. **Accept risk:** Document that Neo4j access control is application-level only (acceptable if auth-facade is the sole consumer)

## Acceptance Criteria

- [ ] Risk documented and accepted OR Enterprise edition adopted
- [ ] If Community: auth-facade code review confirms all Neo4j queries are properly scoped
