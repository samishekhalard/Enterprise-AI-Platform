# RUNBOOK-008: Backup and Restore

## Quick Reference

| Property | Value |
|----------|-------|
| **Runbook ID** | RB-008 |
| **Severity** | SEV-1/SEV-2 |
| **On-Call Required** | Yes |
| **DBA Approval** | Required for production restore |
| **Estimated Duration** | 30-120 minutes |

---

## 1. Overview

This runbook covers procedures for restoring data from backups, including point-in-time recovery, full database restore, and tenant-specific data recovery.

---

## 2. Backup Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     BACKUP ARCHITECTURE                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  BACKUP TYPES                                                   │
│  ├── Full Backup (Weekly - Sunday 02:00 UTC)                   │
│  ├── Differential (Daily - 02:00 UTC)                          │
│  ├── Incremental (Hourly)                                       │
│  └── Continuous WAL (Real-time)                                │
│                                                                 │
│  STORAGE LOCATIONS                                              │
│  ├── Primary: s3://ems-backup-primary (us-east-1)          │
│  └── DR: s3://ems-backup-dr (eu-west-1)                    │
│                                                                 │
│  RETENTION                                                      │
│  ├── Full: 4 weeks                                              │
│  ├── Differential: 7 days                                       │
│  ├── Incremental: 48 hours                                      │
│  └── WAL: 72 hours                                              │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. Pre-Restore Checklist

```bash
# 1. Verify backup exists
pgbackrest --stanza=ems info

# 2. Check backup integrity
pgbackrest --stanza=ems check

# 3. Identify target restore point
# - Latest backup
# - Specific time (point-in-time recovery)
# - Before specific transaction

# 4. Document current state
kubectl exec -it postgresql-0 -n ems-prod -- \
  psql -U postgres -c "SELECT pg_current_wal_lsn(), now();"

# 5. Get approval
# - DBA approval for production restore
# - Document ticket number in incident channel
```

---

## 4. Full Database Restore

### 4.1 Stop Application Traffic

```bash
# 1. Scale down applications
kubectl scale deployment --all -n ems-prod --replicas=0

# 2. Verify no active connections
kubectl exec -it postgresql-0 -n ems-prod -- \
  psql -U postgres -c "SELECT count(*) FROM pg_stat_activity WHERE application_name != '';"

# 3. Put in maintenance mode
kubectl patch ingress ems -n ems-prod \
  -p '{"metadata":{"annotations":{"nginx.ingress.kubernetes.io/custom-http-errors":"503"}}}'
```

### 4.2 Perform Full Restore

```bash
# 1. Stop PostgreSQL
kubectl scale statefulset/postgresql -n ems-prod --replicas=0

# 2. Clear data directory (DESTRUCTIVE!)
# This is done by the restore process automatically

# 3. Restore from latest backup
kubectl exec -it postgresql-restore-job -n ems-prod -- \
  pgbackrest --stanza=ems --delta restore

# 4. Or restore to specific backup
kubectl exec -it postgresql-restore-job -n ems-prod -- \
  pgbackrest --stanza=ems --set=20240115-020000F --delta restore

# 5. Start PostgreSQL
kubectl scale statefulset/postgresql -n ems-prod --replicas=1

# 6. Wait for recovery to complete
kubectl logs -f postgresql-0 -n ems-prod | grep -i "recovery complete"
```

### 4.3 Using pgBackRest Job

```yaml
# Create restore job
cat <<EOF | kubectl apply -f -
apiVersion: batch/v1
kind: Job
metadata:
  name: postgresql-restore-$(date +%s)
  namespace: ems-prod
spec:
  template:
    spec:
      containers:
      - name: pgbackrest
        image: pgbackrest/pgbackrest:latest
        command:
          - pgbackrest
          - --stanza=ems
          - --repo=1
          - --delta
          - restore
        volumeMounts:
          - name: pgdata
            mountPath: /var/lib/postgresql/data
          - name: pgbackrest-config
            mountPath: /etc/pgbackrest
      restartPolicy: Never
      volumes:
        - name: pgdata
          persistentVolumeClaim:
            claimName: postgresql-data
        - name: pgbackrest-config
          configMap:
            name: pgbackrest-config
  backoffLimit: 0
EOF
```

---

## 5. Point-in-Time Recovery (PITR)

### 5.1 Identify Target Time

```bash
# Determine the exact point to recover to
# Example: Recover to just before accidental DELETE at 14:30:00

TARGET_TIME="2024-01-15 14:29:59+00"
```

### 5.2 Execute PITR

```bash
# 1. Stop applications (same as full restore)
kubectl scale deployment --all -n ems-prod --replicas=0

# 2. Stop PostgreSQL
kubectl scale statefulset/postgresql -n ems-prod --replicas=0

# 3. Restore to target time
kubectl exec -it postgresql-restore-job -n ems-prod -- \
  pgbackrest --stanza=ems \
    --type=time \
    --target="$TARGET_TIME" \
    --target-action=promote \
    --delta \
    restore

# 4. Start PostgreSQL
kubectl scale statefulset/postgresql -n ems-prod --replicas=1

# 5. Verify recovery point
kubectl exec -it postgresql-0 -n ems-prod -- \
  psql -U postgres -c "SELECT pg_last_xact_replay_timestamp();"
```

### 5.3 Recovery to Specific Transaction

```bash
# If you have transaction ID
kubectl exec -it postgresql-restore-job -n ems-prod -- \
  pgbackrest --stanza=ems \
    --type=xid \
    --target="12345678" \
    --target-action=promote \
    --delta \
    restore
```

---

## 6. Tenant-Specific Restore

### 6.1 Single Tenant Database Restore

```bash
# Each tenant has own database (tenant isolation)
TENANT_ID="tenant_abc123"
TARGET_TIME="2024-01-15 14:00:00+00"

# 1. Restore to staging environment first
kubectl exec -it postgresql-restore-job -n ems-staging -- \
  pgbackrest --stanza=ems \
    --type=time \
    --target="$TARGET_TIME" \
    --db-include=ems_$TENANT_ID \
    restore

# 2. Export tenant data
kubectl exec -it postgresql-0 -n ems-staging -- \
  pg_dump -U postgres -d ems_$TENANT_ID > tenant_backup.sql

# 3. Import to production (after verification)
kubectl exec -it postgresql-0 -n ems-prod -- \
  psql -U postgres -d ems_$TENANT_ID < tenant_backup.sql
```

### 6.2 Single Table Restore

```bash
# 1. Restore backup to temporary database
kubectl exec -it postgresql-0 -n ems-prod -- \
  createdb -U postgres ems_restore_temp

# 2. Restore specific table from backup
kubectl exec -it postgresql-restore-job -n ems-prod -- \
  pgbackrest --stanza=ems \
    --type=time \
    --target="$TARGET_TIME" \
    --tablespace-map=all=/tmp/restore \
    restore

# 3. Copy table to temporary database
kubectl exec -it postgresql-0 -n ems-prod -- \
  pg_dump -U postgres -t <table_name> ems_restore > /tmp/table_backup.sql

# 4. Restore table to production
kubectl exec -it postgresql-0 -n ems-prod -- \
  psql -U postgres -d ems -c "DROP TABLE <table_name>;" # Careful!
kubectl exec -it postgresql-0 -n ems-prod -- \
  psql -U postgres -d ems < /tmp/table_backup.sql

# 5. Clean up
kubectl exec -it postgresql-0 -n ems-prod -- \
  dropdb -U postgres ems_restore_temp
```

---

## 7. Verify Restore

### 7.1 Data Integrity Checks

```bash
# 1. Check row counts for critical tables
kubectl exec -it postgresql-0 -n ems-prod -- \
  psql -U postgres -d ems -c "
    SELECT 'tenants' as table_name, count(*) FROM tenants
    UNION ALL
    SELECT 'users', count(*) FROM users
    UNION ALL
    SELECT 'audit_logs', count(*) FROM audit_logs;
  "

# 2. Verify foreign key constraints
kubectl exec -it postgresql-0 -n ems-prod -- \
  psql -U postgres -d ems -c "
    SELECT conname, conrelid::regclass
    FROM pg_constraint
    WHERE NOT convalidated;
  "

# 3. Run application health checks
curl -s https://api.ems.com/health/detailed | jq .components.database

# 4. Check for data anomalies
kubectl exec -it postgresql-0 -n ems-prod -- \
  psql -U postgres -d ems -c "
    SELECT min(created_at), max(created_at) FROM audit_logs;
  "
```

### 7.2 Application Verification

```bash
# 1. Restart applications
kubectl scale deployment --all -n ems-prod --replicas=3

# 2. Run smoke tests
curl -s https://api.ems.com/api/v1/tenants | jq .

# 3. Verify critical flows
# - User login
# - Data retrieval
# - Transaction processing

# 4. Check for errors
kubectl logs -l app=api-gateway -n ems-prod --tail=100 | grep -i error
```

---

## 8. Restore Other Components

### 8.1 Valkey Cache Restore

```bash
# Usually cache can be rebuilt from database
# Only restore if persistent data in cache

# 1. Restore RDB snapshot
kubectl exec -it valkey-master-0 -n ems-prod -- \
  valkey-cli DEBUG RELOAD

# 2. Or restore from backup
aws s3 cp s3://ems-backup-cache/valkey/latest.rdb /tmp/
kubectl cp /tmp/latest.rdb valkey-master-0:/data/dump.rdb -n ems-prod
kubectl exec -it valkey-master-0 -n ems-prod -- \
  valkey-cli DEBUG RELOAD
```

### 8.2 Neo4j Restore

```bash
# 1. Stop Neo4j
kubectl scale statefulset/neo4j -n ems-prod --replicas=0

# 2. Restore from backup
kubectl exec -it neo4j-restore-job -n ems-prod -- \
  neo4j-admin restore \
    --from=s3://ems-backup-graph/neo4j/latest \
    --database=ems

# 3. Start Neo4j
kubectl scale statefulset/neo4j -n ems-prod --replicas=1
```

### 8.3 Kubernetes State Restore (Velero)

```bash
# 1. List available backups
velero backup get

# 2. Restore specific backup
velero restore create --from-backup ems-backup-20240115

# 3. Monitor restore progress
velero restore describe ems-backup-20240115

# 4. Verify resources
kubectl get all -n ems-prod
```

---

## 9. Post-Restore Actions

### 9.1 Re-enable Normal Operations

```bash
# 1. Remove maintenance mode
kubectl patch ingress ems -n ems-prod \
  -p '{"metadata":{"annotations":{"nginx.ingress.kubernetes.io/custom-http-errors":null}}}'

# 2. Scale applications to normal
kubectl scale deployment/api-gateway -n ems-prod --replicas=3

# 3. Re-enable automated backups
kubectl patch cronjob/backup-daily -n ems-prod \
  -p '{"spec":{"suspend":false}}'
```

### 9.2 Notification

```bash
# 1. Update status page
# 2. Notify affected tenants
# 3. Update incident ticket
# 4. Document restore details
```

---

## 10. Backup Verification (Proactive)

### 10.1 Test Restore to Staging

```bash
# Weekly automated test
# 1. Restore latest backup to staging
pgbackrest --stanza=ems-staging --delta restore

# 2. Run validation queries
psql -U postgres -d ems -f /scripts/validate_restore.sql

# 3. Run application tests
kubectl exec -it deploy/api-gateway -n ems-staging -- \
  npm run test:smoke
```

---

## 11. Escalation

| Condition | Action |
|-----------|--------|
| Backup not found | Engage DBA team immediately |
| Corruption in backup | Try earlier backup + WAL |
| Restore fails | Engage PostgreSQL expert |
| Data loss confirmed | Executive notification |

---

## 12. Related Runbooks

- [RUNBOOK-002-DB-FAILOVER.md](RUNBOOK-002-DB-FAILOVER.md) - Database failover
- [RUNBOOK-009-BACKUP-FAILURE.md](RUNBOOK-009-BACKUP-FAILURE.md) - Backup failures

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0.0 | 2024 | Platform Team | Initial release |
