# ISSUE-INF-016: No Encryption at Rest for PostgreSQL Volumes

| Field | Value |
|-------|-------|
| Severity | HIGH |
| Category | Encryption |
| Source | SEC-13 |
| Priority | P1 |
| Status | **PARTIALLY-MITIGATED** |
| Opened | 2026-03-02 |
| Updated | 2026-03-04 |
| Blocked By | — |
| Fixes | Host filesystem configuration (not application code) |
| Closes With | Host-level encryption (LUKS/FileVault) or K8s encrypted StorageClass |
| ADR | ADR-019 |

## Description

PostgreSQL data is stored in Docker named volumes which reside on the host filesystem in plaintext. If the host machine is compromised or the disk is physically accessed, all database contents (including PII, credentials, session data) are readable without decryption.

## Evidence

- Docker volumes at `/var/lib/docker/volumes/` are not encrypted
- No PostgreSQL TDE (Transparent Data Encryption) configured
- Backup files from `scripts/backup-databases.sh` are unencrypted `.sql` dumps

## Remediation

**Docker Compose (Dev/Staging):**
- Enable host filesystem encryption (LUKS on Linux, FileVault on macOS)
- Encrypt backup output with GPG: `pg_dump | gpg --encrypt`

**Kubernetes (Production):**
- Use encrypted StorageClass for PersistentVolumes (AWS EBS encryption, GCE PD encryption)
- Encrypt backup artifacts in object storage (S3 SSE, GCS CMEK)

## Mitigation Applied (2026-03-04)

**Backup archives are now encrypted** via `age` public-key encryption in the `backup-cron` sidecar. When `AGE_PUBLIC_KEY` is set in `.env.dev`/`.env.staging`, all PostgreSQL dumps are stored as `.dump.age` files unreadable without the corresponding private key.

Mitigates the "backup files unencrypted" evidence item. Volume data at rest still requires host-level setup.

See: `RUNBOOK-012-ENCRYPTION-AT-REST.md` for complete setup guide.

## Acceptance Criteria

- [x] Backup files are encrypted before storage (`age` encryption in backup-cron)
- [ ] Host filesystem encryption enabled (see RUNBOOK-012 — requires host setup)
- [ ] K8s StorageClass specifies encrypted volumes (Phase 3 / production)
