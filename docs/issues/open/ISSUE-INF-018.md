# ISSUE-INF-018: No Encryption at Rest for Valkey Persistence

| Field | Value |
|-------|-------|
| Severity | MEDIUM |
| Category | Encryption |
| Source | Infrastructure Audit |
| Priority | P2 |
| Status | **PARTIALLY-MITIGATED** |
| Opened | 2026-03-02 |
| Updated | 2026-03-04 |
| Blocked By | — |
| Fixes | Host filesystem configuration |
| Closes With | Host-level encryption or K8s encrypted StorageClass |
| ADR | ADR-019 |

## Description

Valkey persists RDB snapshots and AOF files to a Docker volume without encryption. While Valkey data is primarily ephemeral cache (token blacklist, role cache, MFA pending), the token blacklist contains JTIs that could be used to infer active session patterns.

## Evidence

- Docker volumes `dev_valkey_data` are unencrypted
- Valkey does not support native encryption at rest
- Cached data includes: `auth:blacklist:{jti}`, `auth:roles:{userId}`, `auth:mfa:pending:{hash}`

## Remediation

Same as ISSUE-INF-016: Host filesystem encryption (LUKS/FileVault) for Docker Compose; encrypted StorageClass for Kubernetes.

## Mitigation Applied (2026-03-04)

Two improvements applied:

1. **AOF persistence enabled** — Valkey now has `appendonly yes` + `appendfsync everysec`, reducing RPO from ~15 min to ~1 sec. AOF files are written to the data volume alongside RDB.

2. **Valkey backup exports are now encrypted** — hourly BGSAVE → `cp dump.rdb` → `age -r` encryption. Exported `.rdb.age` files are unreadable without the private key.

Live Valkey volume data at rest still requires host-level encryption. See: `RUNBOOK-012-ENCRYPTION-AT-REST.md`.

## Acceptance Criteria

- [x] Valkey RDB backup files are encrypted when exported (`age` encryption in backup-cron)
- [x] AOF enabled — near-zero RPO for live data
- [ ] Valkey data volume resides on encrypted filesystem (see RUNBOOK-012)
