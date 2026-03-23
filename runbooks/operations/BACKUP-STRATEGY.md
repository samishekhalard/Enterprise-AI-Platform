# EMS Backup Strategy

## Document Control

| Property | Value |
|----------|-------|
| **Document ID** | OPS-BACKUP-001 |
| **Version** | 1.0.0 |
| **Classification** | Internal |
| **Owner** | Platform Operations |
| **Last Review** | 2024 |

---

## 1. Backup Overview

### 1.1 Purpose

This document defines the comprehensive backup strategy for EMS, ensuring data protection, business continuity, and compliance with regulatory requirements.

### 1.2 Scope

```
┌─────────────────────────────────────────────────────────────────┐
│                    BACKUP SCOPE COVERAGE                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │  Databases  │  │   Files     │  │   Config    │             │
│  │             │  │             │  │             │             │
│  │ • PostgreSQL│  │ • Documents │  │ • Secrets   │             │
│  │ • Valkey    │  │ • Media     │  │ • Env Vars  │             │
│  │ • Neo4j     │  │ • Logs      │  │ • Manifests │             │
│  │ • MongoDB   │  │ • Exports   │  │ • Certs     │             │
│  └─────────────┘  └─────────────┘  └─────────────┘             │
│                                                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │  State      │  │   Audit     │  │   Tenant    │             │
│  │             │  │             │  │             │             │
│  │ • Kubernetes│  │ • Logs      │  │ • Per-DB    │             │
│  │ • etcd      │  │ • Events    │  │ • Schemas   │             │
│  │ • Terraform │  │ • Metrics   │  │ • Sandboxes │             │
│  └─────────────┘  └─────────────┘  └─────────────┘             │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. Backup Classification

### 2.1 Data Tiers

| Tier | Description | RPO | Retention | Examples |
|------|-------------|-----|-----------|----------|
| **Tier 1** | Critical Business Data | 1 hour | 7 years | Tenant data, transactions, audit logs |
| **Tier 2** | Important Operational | 4 hours | 1 year | Configs, secrets, state files |
| **Tier 3** | Standard | 24 hours | 90 days | Application logs, metrics |
| **Tier 4** | Archival | 1 week | 30 days | Debug logs, temp files |

### 2.2 Backup Types

```
┌────────────────────────────────────────────────────────────────┐
│                     BACKUP TYPE MATRIX                         │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  FULL BACKUP ────────────────────────────────────────────────  │
│  │ Complete copy of all data                                   │
│  │ Frequency: Weekly (Sunday 02:00 UTC)                        │
│  │ Retention: 4 weeks                                          │
│  │                                                             │
│  DIFFERENTIAL BACKUP ────────────────────────────────────────  │
│  │ Changes since last FULL backup                              │
│  │ Frequency: Daily (02:00 UTC)                                │
│  │ Retention: 7 days                                           │
│  │                                                             │
│  INCREMENTAL BACKUP ─────────────────────────────────────────  │
│  │ Changes since last backup (any type)                        │
│  │ Frequency: Hourly                                           │
│  │ Retention: 48 hours                                         │
│  │                                                             │
│  CONTINUOUS (WAL/CDC) ───────────────────────────────────────  │
│  │ Real-time transaction logs                                  │
│  │ Frequency: Continuous                                       │
│  │ Retention: 72 hours                                         │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

---

## 3. Database Backup Strategy

### 3.1 PostgreSQL (Primary Data Store)

```yaml
postgresql_backup:
  # Continuous WAL Archiving
  wal_archiving:
    enabled: true
    archive_mode: "on"
    archive_command: "pgbackrest --stanza=ems archive-push %p"
    wal_level: "replica"
    max_wal_senders: 10

  # pgBackRest Configuration
  pgbackrest:
    repo1:
      type: "s3"
      path: "/backup/postgresql"
      s3_bucket: "ems-backup-primary"
      s3_region: "us-east-1"
      encryption: "aes-256-cbc"

    repo2:
      type: "s3"
      path: "/backup/postgresql"
      s3_bucket: "ems-backup-dr"
      s3_region: "eu-west-1"
      encryption: "aes-256-cbc"

  # Backup Schedule
  schedule:
    full:
      frequency: "weekly"
      day: "sunday"
      time: "02:00"
      retention_full: 4

    differential:
      frequency: "daily"
      time: "02:00"
      retention_diff: 7

    incremental:
      frequency: "hourly"
      retention_incr: 48

  # Tenant-Specific Backups
  tenant_backup:
    enabled: true
    isolation: "database"  # Each tenant has own database
    parallel_jobs: 4
    compression: "lz4"
    compression_level: 6
```

### 3.2 Valkey (Cache Layer)

```yaml
valkey_backup:
  # RDB Snapshots
  rdb:
    enabled: true
    save_rules:
      - seconds: 900
        changes: 1
      - seconds: 300
        changes: 10
      - seconds: 60
        changes: 10000
    compression: true
    filename: "ems-cache.rdb"

  # AOF Persistence
  aof:
    enabled: true
    fsync: "everysec"
    rewrite_percentage: 100
    rewrite_min_size: "64mb"

  # Backup to S3
  s3_backup:
    enabled: true
    bucket: "ems-backup-cache"
    prefix: "/valkey/"
    frequency: "6h"
    retention_days: 7
```

### 3.3 Neo4j (Graph Database)

```yaml
neo4j_backup:
  # Online Backup
  online_backup:
    enabled: true
    address: "0.0.0.0:6362"

  # Backup Configuration
  backup_config:
    type: "full"  # full or incremental
    destination: "s3://ems-backup-graph/neo4j/"
    encryption: true
    compression: true

  # Schedule
  schedule:
    full:
      frequency: "daily"
      time: "03:00"
      retention_days: 30

    incremental:
      frequency: "4h"
      retention_days: 7

  # Consistency Check
  consistency_check:
    enabled: true
    after_backup: true
    check_indexes: true
    check_graph: true
```

### 3.4 MongoDB (Document Store)

```yaml
mongodb_backup:
  # Mongodump Configuration
  mongodump:
    enabled: true
    oplog: true  # Point-in-time recovery
    gzip: true

  # Backup Schedule
  schedule:
    full:
      frequency: "daily"
      time: "03:30"
      retention_days: 30

    oplog:
      frequency: "continuous"
      retention_hours: 72

  # Destination
  destination:
    primary: "s3://ems-backup-docs/mongodb/"
    secondary: "s3://ems-backup-dr/mongodb/"

  # Sharded Cluster Backup
  sharded:
    stop_balancer: true
    backup_config_servers: true
    parallel_collections: 4
```

---

## 4. Application Backup Strategy

### 4.1 File Storage

```yaml
file_backup:
  # MinIO/S3 Compatible Storage
  object_storage:
    source_bucket: "ems-files"
    backup_bucket: "ems-backup-files"

    # Cross-Region Replication
    replication:
      enabled: true
      destination_region: "eu-west-1"

    # Versioning
    versioning:
      enabled: true
      mfa_delete: true

    # Lifecycle Rules
    lifecycle:
      - name: "transition-to-glacier"
        prefix: "archive/"
        days: 90
        storage_class: "GLACIER"

      - name: "delete-old-versions"
        noncurrent_days: 365
        action: "delete"

  # Document Attachments
  attachments:
    backup_frequency: "daily"
    retention_days: 365
    encryption: "AES-256"
```

### 4.2 Configuration Backup

```yaml
config_backup:
  # Kubernetes Resources
  kubernetes:
    tool: "velero"
    schedule: "0 */6 * * *"  # Every 6 hours
    ttl: "720h"  # 30 days

    include_namespaces:
      - "ems-prod"
      - "ems-staging"
      - "monitoring"

    exclude_resources:
      - "events"
      - "pods"

    storage:
      provider: "aws"
      bucket: "ems-backup-k8s"

  # Secrets (Encrypted)
  secrets:
    tool: "sealed-secrets"
    backup_sealed: true
    backup_key: true
    key_rotation: "quarterly"

  # Terraform State
  terraform:
    backend: "s3"
    bucket: "ems-terraform-state"
    versioning: true
    encryption: true
    dynamodb_table: "ems-terraform-locks"
```

---

## 5. Backup Schedule Matrix

### 5.1 Complete Schedule

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        BACKUP SCHEDULE MATRIX                           │
├──────────────────┬──────────┬──────────┬──────────┬────────────────────┤
│ Component        │ Full     │ Diff     │ Incr     │ Continuous         │
├──────────────────┼──────────┼──────────┼──────────┼────────────────────┤
│ PostgreSQL       │ Sun 02:00│ Daily    │ Hourly   │ WAL Archive        │
│ Valkey           │ Daily    │ -        │ -        │ AOF + RDB          │
│ Neo4j            │ Daily    │ -        │ 4-hourly │ -                  │
│ MongoDB          │ Daily    │ -        │ -        │ Oplog              │
│ File Storage     │ Weekly   │ Daily    │ -        │ Replication        │
│ Kubernetes       │ Daily    │ 6-hourly │ -        │ etcd streaming     │
│ Secrets          │ Daily    │ On-change│ -        │ -                  │
│ Audit Logs       │ Daily    │ -        │ Hourly   │ Stream to SIEM     │
└──────────────────┴──────────┴──────────┴──────────┴────────────────────┘

Time: All times in UTC
```

### 5.2 Retention Matrix

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        RETENTION POLICY MATRIX                          │
├──────────────────┬──────────┬──────────┬──────────┬────────────────────┤
│ Data Type        │ Hot      │ Warm     │ Cold     │ Archive            │
│                  │ (SSD)    │ (HDD)    │ (S3 IA)  │ (Glacier)          │
├──────────────────┼──────────┼──────────┼──────────┼────────────────────┤
│ Tier 1 Data      │ 7 days   │ 30 days  │ 1 year   │ 7 years            │
│ Tier 2 Data      │ 3 days   │ 14 days  │ 90 days  │ 1 year             │
│ Tier 3 Data      │ 1 day    │ 7 days   │ 30 days  │ 90 days            │
│ Tier 4 Data      │ -        │ 3 days   │ 7 days   │ 30 days            │
│ Audit Logs       │ 30 days  │ 90 days  │ 1 year   │ 7 years            │
│ Transaction Logs │ 72 hours │ 7 days   │ 30 days  │ 1 year             │
└──────────────────┴──────────┴──────────┴──────────┴────────────────────┘
```

---

## 6. Backup Verification

### 6.1 Verification Strategy

```yaml
backup_verification:
  # Automated Verification
  automated:
    # Integrity Check
    integrity:
      enabled: true
      frequency: "after_each_backup"
      checksum_algorithm: "SHA-256"

    # Restore Test
    restore_test:
      enabled: true
      frequency: "weekly"
      environment: "backup-test"
      automated_cleanup: true

    # Data Validation
    validation:
      enabled: true
      sample_rate: 0.01  # 1% of records
      compare_checksums: true

  # Manual Verification
  manual:
    full_restore_test:
      frequency: "quarterly"
      duration: "4 hours"
      documented: true
      sign_off_required: true

    dr_drill:
      frequency: "semi-annually"
      duration: "8 hours"
      involves_failover: true
```

### 6.2 Verification Checklist

```
┌─────────────────────────────────────────────────────────────────┐
│                  BACKUP VERIFICATION CHECKLIST                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  □ Backup completed successfully (exit code 0)                  │
│  □ Backup size within expected range (±20%)                     │
│  □ Checksum generated and stored                                │
│  □ Backup transferred to secondary location                     │
│  □ Encryption verified                                          │
│  □ Sample restore completed                                     │
│  □ Data integrity validated                                     │
│  □ Retention policy applied                                     │
│  □ Monitoring alert cleared                                     │
│  □ Backup catalog updated                                       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 6.3 Restore Testing Procedure

```yaml
restore_test_procedure:
  # Weekly Automated Test
  weekly_test:
    steps:
      - name: "Provision test environment"
        action: "terraform apply -var='environment=backup-test'"
        timeout: "15m"

      - name: "Restore latest backup"
        action: "pgbackrest restore --stanza=ems --target-timeline=latest"
        timeout: "60m"

      - name: "Verify data integrity"
        action: "python verify_backup.py --compare-checksums"
        timeout: "30m"

      - name: "Run application health checks"
        action: "curl -f http://backup-test/health"
        timeout: "5m"

      - name: "Validate sample records"
        action: "python validate_records.py --sample=1000"
        timeout: "10m"

      - name: "Cleanup test environment"
        action: "terraform destroy -var='environment=backup-test' -auto-approve"
        timeout: "10m"

    notifications:
      on_success: "slack:#ops-backup"
      on_failure: "pagerduty:backup-team"
```

---

## 7. Encryption & Security

### 7.1 Encryption Standards

```yaml
encryption:
  # At-Rest Encryption
  at_rest:
    algorithm: "AES-256-GCM"
    key_management: "AWS KMS"
    key_rotation: "annual"

  # In-Transit Encryption
  in_transit:
    protocol: "TLS 1.3"
    certificate_authority: "internal-ca"

  # Backup-Specific Keys
  backup_keys:
    primary_key_alias: "alias/ems-backup-primary"
    dr_key_alias: "alias/ems-backup-dr"
    key_policy: |
      {
        "Version": "2012-10-17",
        "Statement": [
          {
            "Effect": "Allow",
            "Principal": {"Service": "backup.amazonaws.com"},
            "Action": ["kms:Encrypt", "kms:Decrypt", "kms:GenerateDataKey"],
            "Resource": "*"
          }
        ]
      }
```

### 7.2 Access Control

```yaml
backup_access_control:
  # IAM Roles
  roles:
    backup_operator:
      permissions:
        - "backup:CreateBackupPlan"
        - "backup:StartBackupJob"
        - "backup:DescribeBackupJob"
      mfa_required: true

    backup_admin:
      permissions:
        - "backup:*"
        - "kms:CreateGrant"
      mfa_required: true
      approval_required: true

    restore_operator:
      permissions:
        - "backup:StartRestoreJob"
        - "backup:DescribeRestoreJob"
      mfa_required: true
      requires_ticket: true

  # Audit Trail
  audit:
    log_all_access: true
    alert_on_restore: true
    alert_on_delete: true
```

---

## 8. Multi-Tenant Backup

### 8.1 Tenant Isolation

```yaml
tenant_backup_isolation:
  # Database per Tenant
  strategy: "database_per_tenant"

  # Individual Tenant Backup
  per_tenant:
    enabled: true
    schedule:
      follows_global: true
      custom_schedule_allowed: true  # Enterprise tier

    storage:
      isolated_prefix: true  # /backups/{tenant_id}/
      cross_tenant_access: false

    encryption:
      tenant_specific_key: true  # Enterprise tier
      key_pattern: "alias/ems-tenant-{tenant_id}"

  # Self-Service Restore
  self_service:
    enabled: true
    allowed_operations:
      - "point_in_time_restore"
      - "table_restore"
      - "download_export"
    approval_required: false  # For own data
    audit_logged: true
```

### 8.2 Tenant Backup SLA

| Tier | RPO | RTO | Retention | Self-Service |
|------|-----|-----|-----------|--------------|
| **Free** | 24h | 48h | 7 days | No |
| **Professional** | 4h | 8h | 30 days | Limited |
| **Enterprise** | 1h | 4h | 1 year | Full |
| **Government** | 15min | 1h | 7 years | Full + Audit |

---

## 9. Disaster Recovery Integration

### 9.1 Cross-Region Replication

```
┌─────────────────────────────────────────────────────────────────┐
│                 CROSS-REGION BACKUP ARCHITECTURE                │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  PRIMARY REGION (us-east-1)        DR REGION (eu-west-1)       │
│  ┌─────────────────────┐           ┌─────────────────────┐     │
│  │  Production         │           │  DR Site            │     │
│  │  ┌───────────────┐  │           │  ┌───────────────┐  │     │
│  │  │ PostgreSQL    │──┼──WAL──────┼─>│ PostgreSQL    │  │     │
│  │  │ Primary       │  │  Stream   │  │ Standby       │  │     │
│  │  └───────────────┘  │           │  └───────────────┘  │     │
│  │  ┌───────────────┐  │           │  ┌───────────────┐  │     │
│  │  │ Backup Vault  │──┼──S3───────┼─>│ Backup Vault  │  │     │
│  │  │ Primary       │  │  Repl     │  │ Replica       │  │     │
│  │  └───────────────┘  │           │  └───────────────┘  │     │
│  └─────────────────────┘           └─────────────────────┘     │
│           │                                   │                 │
│           └───────────── Sync ────────────────┘                │
│                        < 1 hour                                 │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 9.2 Recovery Objectives Alignment

| Objective | Backup Strategy | Method |
|-----------|-----------------|--------|
| **RPO 1h** | Continuous WAL + Hourly incremental | WAL archiving + pgBackRest |
| **RTO 4h** | Hot standby + verified backups | Streaming replication |
| **Data Integrity** | Checksums + restore tests | SHA-256 + weekly validation |
| **Compliance** | Encrypted + audited | AES-256 + CloudTrail |

---

## 10. Monitoring & Alerting

### 10.1 Backup Monitoring

```yaml
backup_monitoring:
  # Metrics Collection
  metrics:
    - name: "backup_success_rate"
      type: "gauge"
      threshold: 0.99

    - name: "backup_duration_seconds"
      type: "histogram"
      buckets: [60, 300, 900, 1800, 3600]

    - name: "backup_size_bytes"
      type: "gauge"
      alert_on_anomaly: true

    - name: "backup_age_hours"
      type: "gauge"
      threshold: 25  # Alert if backup older than 25h

  # Dashboards
  dashboards:
    - name: "Backup Overview"
      panels:
        - "Backup Success Rate (24h)"
        - "Backup Duration Trend"
        - "Storage Utilization"
        - "Restore Test Results"
```

### 10.2 Alert Rules

```yaml
alerting_rules:
  - name: "BackupFailed"
    condition: "backup_job_status == 'failed'"
    severity: "critical"
    notification: "pagerduty"

  - name: "BackupOverdue"
    condition: "backup_age_hours > 25"
    severity: "warning"
    notification: "slack"

  - name: "BackupSizeAnomaly"
    condition: "abs(backup_size - avg_backup_size) > 3 * stddev"
    severity: "warning"
    notification: "slack"

  - name: "RestoreTestFailed"
    condition: "restore_test_status == 'failed'"
    severity: "critical"
    notification: "pagerduty"

  - name: "ReplicationLag"
    condition: "replication_lag_seconds > 3600"
    severity: "warning"
    notification: "slack"
```

---

## 11. Compliance & Audit

### 11.1 Compliance Requirements

| Regulation | Requirement | Implementation |
|------------|-------------|----------------|
| **GDPR** | Right to erasure | Tenant-specific backup purge capability |
| **SOC 2** | Backup verification | Weekly automated restore tests |
| **ISO 27001** | Encryption | AES-256 at rest, TLS 1.3 in transit |
| **PCI DSS** | Access logging | CloudTrail + backup access audit |
| **UAE PDPL** | Data residency | Regional backup storage options |

### 11.2 Audit Requirements

```yaml
backup_audit:
  # What to Log
  events:
    - "backup_job_started"
    - "backup_job_completed"
    - "backup_job_failed"
    - "restore_job_started"
    - "restore_job_completed"
    - "backup_deleted"
    - "backup_accessed"

  # Log Format
  log_format:
    timestamp: "ISO 8601"
    event_type: "string"
    actor: "string (user/service)"
    resource: "string (backup ID)"
    outcome: "success/failure"
    details: "JSON object"

  # Retention
  audit_retention: "7 years"
  immutable: true
```

---

## 12. Runbook References

| Scenario | Runbook |
|----------|---------|
| Database restore | [RUNBOOK-008-BACKUP-RESTORE.md](runbooks/RUNBOOK-008-BACKUP-RESTORE.md) |
| DR failover | [RUNBOOK-002-DB-FAILOVER.md](runbooks/RUNBOOK-002-DB-FAILOVER.md) |
| Backup failure | [RUNBOOK-009-BACKUP-FAILURE.md](runbooks/RUNBOOK-009-BACKUP-FAILURE.md) |
| Tenant data export | [RUNBOOK-010-TENANT-OPERATIONS.md](runbooks/RUNBOOK-010-TENANT-OPERATIONS.md) |

---

## Appendix A: Backup Commands Reference

```bash
# PostgreSQL Backup (pgBackRest)
pgbackrest --stanza=ems --type=full backup
pgbackrest --stanza=ems --type=diff backup
pgbackrest --stanza=ems --type=incr backup

# PostgreSQL Restore
pgbackrest --stanza=ems --target-time="2024-01-15 14:30:00" restore

# Valkey Backup
valkey-cli BGSAVE
valkey-cli BGREWRITEAOF

# Neo4j Backup
neo4j-admin backup --to=/backup/neo4j --database=ems

# MongoDB Backup
mongodump --uri="mongodb://..." --gzip --archive=/backup/mongo/backup.gz

# Kubernetes Backup (Velero)
velero backup create ems-backup --include-namespaces ems-prod
velero restore create --from-backup ems-backup
```

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0.0 | 2024 | Platform Team | Initial release |
