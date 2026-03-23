# ISSUE-INF-022: No TLS for Neo4j Bolt Connections

| Field | Value |
|-------|-------|
| Severity | MEDIUM |
| Category | Encryption |
| Source | Infrastructure Audit |
| Priority | P2 |
| Status | OPEN |
| Opened | 2026-03-02 |
| Blocked By | — |
| Fixes | docker-compose.*.yml, auth-facade application.yml |
| Closes With | Neo4j TLS configuration + `bolt+s://` URI |
| ADR | ADR-019 |

## Description

auth-facade connects to Neo4j using plaintext Bolt protocol (`bolt://neo4j:7687`). The auth graph — containing tenant relationships, role hierarchies, provider configurations, and user-group mappings — is transmitted unencrypted.

## Evidence

- auth-facade `application.yml`: `spring.neo4j.uri: bolt://neo4j:7687` (plaintext)
- docker-compose: Neo4j has no TLS configuration (`NEO4J_dbms_ssl_policy_bolt_*` not set)
- Neo4j Community does support TLS for Bolt connections

## Remediation

1. Generate TLS certificates for Neo4j
2. Configure Neo4j SSL policy: `NEO4J_dbms_ssl_policy_bolt_enabled=true`
3. Update auth-facade URI to `bolt+s://neo4j:7687` or `neo4j+s://neo4j:7687`
4. Add `spring.neo4j.security.encrypted: true` to auth-facade

## Acceptance Criteria

- [ ] Neo4j Bolt connections use TLS
- [ ] auth-facade connects via `bolt+s://` or `neo4j+s://`
- [ ] Plaintext Bolt connections are rejected
- [ ] Certificate management documented
