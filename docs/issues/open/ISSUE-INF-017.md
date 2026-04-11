# ISSUE-INF-017: No Encryption at Rest for Neo4j Volumes

| Field | Value |
|-------|-------|
| Severity | HIGH |
| Category | Encryption |
| Source | Infrastructure Audit |
| Priority | P1 |
| Status | **PARTIALLY-MITIGATED** |
| Opened | 2026-03-02 |
| Updated | 2026-03-04 |
| Blocked By | — |
| Fixes | Host filesystem configuration |
| Closes With | Host-level encryption or K8s encrypted StorageClass |
| ADR | ADR-019 |

## Description

Neo4j graph data (containing auth configuration, tenant relationships, role hierarchies, provider configs) is stored in unencrypted Docker volumes. This is especially sensitive because Neo4j stores the auth graph — the source of truth for RBAC, tenant isolation, and identity provider configuration.

## Evidence

- Docker volumes `dev_neo4j_data`, `dev_neo4j_logs` are unencrypted
- Neo4j Community edition does not support native encryption at rest
- Auth graph contains: tenant nodes, role hierarchies, provider configurations, user-group mappings

## Remediation

Same as ISSUE-INF-016: Host filesystem encryption (LUKS/FileVault) for Docker Compose; encrypted StorageClass for Kubernetes.

## Mitigation Applied (2026-03-04)

**Neo4j backup archives are now encrypted** via `age` in the `backup-cron` sidecar. The volume snapshot (`tar -czf | age -r`) is stored as `.tar.gz.age` unreadable without the private key.

Neo4j volume data at rest still requires host-level encryption (FileVault/LUKS). See: `RUNBOOK-012-ENCRYPTION-AT-REST.md`.

## Acceptance Criteria

- [x] Neo4j backup files are encrypted (`age` encryption in backup-cron)
- [ ] Neo4j data volume resides on encrypted filesystem (see RUNBOOK-012)
