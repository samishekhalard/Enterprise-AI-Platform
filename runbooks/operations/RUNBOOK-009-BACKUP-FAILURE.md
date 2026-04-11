# RUNBOOK-009: Backup Failure

## Quick Reference

| Property | Value |
|----------|-------|
| **Runbook ID** | RB-009 |
| **Severity** | SEV-2/SEV-3 |
| **On-Call Required** | Yes |
| **Estimated Duration** | 15-45 minutes |

---

## 1. Overview

This runbook covers procedures for diagnosing and resolving backup failures, including automated backup job failures, storage issues, and replication problems.

---

## 2. Backup Schedule

| Backup Type | Schedule | Max Duration | Alert After |
|-------------|----------|--------------|-------------|
| Full | Sunday 02:00 UTC | 4 hours | 6 hours |
| Differential | Daily 02:00 UTC | 1 hour | 2 hours |
| Incremental | Hourly | 15 min | 30 min |
| WAL Archive | Continuous | N/A | 10 min lag |

---

## 3. Symptoms

- Backup job failed
- Backup not completed within expected time
- WAL archive lag increasing
- Storage quota exceeded
- Prometheus alerts: `BackupFailed`, `BackupOverdue`, `WALArchiveLag`

---

## 4. Initial Assessment

### 4.1 Check Backup Status

```bash
# 1. Check pgBackRest info
kubectl exec -it postgresql-0 -n ems-prod -- \
  pgbackrest --stanza=ems info

# 2. Check backup job status
kubectl get jobs -n ems-prod | grep backup

# 3. Check last successful backup age
kubectl exec -it postgresql-0 -n ems-prod -- \
  pgbackrest --stanza=ems info --output=json | \
  jq '.[] | .backup | .[-1] | .timestamp.stop'

# 4. Check WAL archive status
kubectl exec -it postgresql-0 -n ems-prod -- \
  psql -U postgres -c "SELECT * FROM pg_stat_archiver;"
```

### 4.2 Check Backup Logs

```bash
# pgBackRest logs
kubectl exec -it postgresql-0 -n ems-prod -- \
  cat /var/log/pgbackrest/ems-backup.log | tail -100

# Backup job logs
kubectl logs job/backup-daily-<timestamp> -n ems-prod
```

---

## 5. Common Issues & Resolutions

### 5.1 Storage Space Full

```bash
# 1. Check S3 bucket usage
aws s3api list-objects-v2 \
  --bucket ems-backup-primary \
  --query "sum(Contents[].Size)" \
  --output text

# 2. Check retention policy
kubectl exec -it postgresql-0 -n ems-prod -- \
  pgbackrest --stanza=ems info

# 3. Expire old backups
kubectl exec -it postgresql-0 -n ems-prod -- \
  pgbackrest --stanza=ems expire

# 4. Verify space freed
aws s3api list-objects-v2 \
  --bucket ems-backup-primary \
  --query "sum(Contents[].Size)" \
  --output text

# 5. Retry backup
kubectl exec -it postgresql-0 -n ems-prod -- \
  pgbackrest --stanza=ems --type=incr backup
```

### 5.2 S3 Connection Failure

```bash
# 1. Check S3 connectivity
kubectl exec -it postgresql-0 -n ems-prod -- \
  aws s3 ls s3://ems-backup-primary/

# 2. Check IAM credentials
kubectl exec -it postgresql-0 -n ems-prod -- \
  aws sts get-caller-identity

# 3. If credentials expired, refresh
kubectl delete pod -l app=postgresql -n ems-prod
# Pod will restart with fresh credentials

# 4. Check S3 bucket policy
aws s3api get-bucket-policy --bucket ems-backup-primary

# 5. Retry backup
kubectl exec -it postgresql-0 -n ems-prod -- \
  pgbackrest --stanza=ems --type=incr backup
```

### 5.3 WAL Archive Failure

```bash
# 1. Check archive status
kubectl exec -it postgresql-0 -n ems-prod -- \
  psql -U postgres -c "SELECT * FROM pg_stat_archiver;"

# 2. Check archive_command
kubectl exec -it postgresql-0 -n ems-prod -- \
  psql -U postgres -c "SHOW archive_command;"

# 3. Check failed WAL files
kubectl exec -it postgresql-0 -n ems-prod -- \
  ls -la /var/lib/postgresql/data/pg_wal/archive_status/

# 4. Manually archive failed WAL
kubectl exec -it postgresql-0 -n ems-prod -- \
  pgbackrest --stanza=ems archive-push /var/lib/postgresql/data/pg_wal/<wal_file>

# 5. Reset archive status
kubectl exec -it postgresql-0 -n ems-prod -- \
  psql -U postgres -c "SELECT pg_switch_wal();"
```

### 5.4 Backup Lock Contention

```bash
# 1. Check for running backups
kubectl exec -it postgresql-0 -n ems-prod -- \
  pgbackrest --stanza=ems info | grep "running"

# 2. Check lock file
kubectl exec -it postgresql-0 -n ems-prod -- \
  ls -la /tmp/pgbackrest/*.lock

# 3. If stale lock, remove it
kubectl exec -it postgresql-0 -n ems-prod -- \
  rm /tmp/pgbackrest/ems-backup.lock

# 4. Retry backup
kubectl exec -it postgresql-0 -n ems-prod -- \
  pgbackrest --stanza=ems --type=incr backup
```

### 5.5 Network Timeout

```bash
# 1. Check network connectivity
kubectl exec -it postgresql-0 -n ems-prod -- \
  nc -zv s3.us-east-1.amazonaws.com 443

# 2. Increase timeout settings
kubectl exec -it postgresql-0 -n ems-prod -- \
  pgbackrest --stanza=ems \
    --protocol-timeout=1800 \
    --type=incr backup

# 3. Check for rate limiting
kubectl exec -it postgresql-0 -n ems-prod -- \
  cat /var/log/pgbackrest/ems-backup.log | grep -i "throttl\|rate\|limit"
```

### 5.6 Checksum Mismatch

```bash
# 1. Check for corruption
kubectl exec -it postgresql-0 -n ems-prod -- \
  pgbackrest --stanza=ems check

# 2. Verify backup integrity
kubectl exec -it postgresql-0 -n ems-prod -- \
  pgbackrest --stanza=ems verify

# 3. If corruption found, create new full backup
kubectl exec -it postgresql-0 -n ems-prod -- \
  pgbackrest --stanza=ems --type=full backup

# 4. Investigate source of corruption
# Check PostgreSQL logs, disk health, memory errors
```

---

## 6. Manual Backup Execution

### 6.1 Trigger Manual Backup

```bash
# Incremental backup
kubectl exec -it postgresql-0 -n ems-prod -- \
  pgbackrest --stanza=ems --type=incr backup

# Full backup
kubectl exec -it postgresql-0 -n ems-prod -- \
  pgbackrest --stanza=ems --type=full backup

# Monitor progress
kubectl exec -it postgresql-0 -n ems-prod -- \
  tail -f /var/log/pgbackrest/ems-backup.log
```

### 6.2 Create Backup Job

```yaml
cat <<EOF | kubectl apply -f -
apiVersion: batch/v1
kind: Job
metadata:
  name: backup-manual-$(date +%s)
  namespace: ems-prod
spec:
  template:
    spec:
      containers:
      - name: backup
        image: pgbackrest/pgbackrest:latest
        command:
          - pgbackrest
          - --stanza=ems
          - --type=incr
          - backup
        volumeMounts:
          - name: pgbackrest-config
            mountPath: /etc/pgbackrest
      restartPolicy: Never
      volumes:
        - name: pgbackrest-config
          configMap:
            name: pgbackrest-config
  backoffLimit: 2
EOF
```

---

## 7. Recovery from Extended Outage

### 7.1 If Backups Missed for Extended Period

```bash
# 1. Check how far behind
kubectl exec -it postgresql-0 -n ems-prod -- \
  pgbackrest --stanza=ems info

# 2. Create full backup immediately
kubectl exec -it postgresql-0 -n ems-prod -- \
  pgbackrest --stanza=ems --type=full backup

# 3. Verify backup
kubectl exec -it postgresql-0 -n ems-prod -- \
  pgbackrest --stanza=ems verify

# 4. Update monitoring
# Ensure alerts are cleared
```

### 7.2 WAL Archive Recovery

```bash
# 1. Check WAL archive gap
kubectl exec -it postgresql-0 -n ems-prod -- \
  ls /var/lib/postgresql/data/pg_wal/*.ready | wc -l

# 2. Archive all pending WAL files
kubectl exec -it postgresql-0 -n ems-prod -- \
  pgbackrest --stanza=ems archive-push \
    /var/lib/postgresql/data/pg_wal/

# 3. Monitor until caught up
watch -n 5 "kubectl exec -it postgresql-0 -n ems-prod -- \
  ls /var/lib/postgresql/data/pg_wal/*.ready | wc -l"
```

---

## 8. Verification

### 8.1 Post-Fix Verification

```bash
# 1. Verify backup completed
kubectl exec -it postgresql-0 -n ems-prod -- \
  pgbackrest --stanza=ems info | grep "status:"
# Should show: status: ok

# 2. Check backup integrity
kubectl exec -it postgresql-0 -n ems-prod -- \
  pgbackrest --stanza=ems check

# 3. Verify replication to DR
aws s3 ls s3://ems-backup-dr/backup/

# 4. Ensure monitoring alerts cleared
# Check PagerDuty/Grafana
```

### 8.2 Test Restore

```bash
# For critical backups, test restore to staging
kubectl exec -it postgresql-0 -n ems-staging -- \
  pgbackrest --stanza=ems-staging --delta restore

# Run validation queries
kubectl exec -it postgresql-0 -n ems-staging -- \
  psql -U postgres -c "SELECT count(*) FROM tenants;"
```

---

## 9. Prevention

### 9.1 Monitoring Setup

```yaml
# Prometheus alerts
- alert: BackupFailed
  expr: backup_last_success_timestamp < (time() - 86400)
  for: 1h
  labels:
    severity: critical
  annotations:
    summary: "Backup has not completed in 24 hours"

- alert: WALArchiveLag
  expr: pg_stat_archiver_last_archive_age > 600
  for: 10m
  labels:
    severity: warning
  annotations:
    summary: "WAL archive is lagging"
```

### 9.2 Regular Checks

```bash
# Daily check (add to cron)
# 1. Verify backup exists
pgbackrest --stanza=ems info

# 2. Check backup age
last_backup=$(pgbackrest --stanza=ems info --output=json | \
  jq -r '.[] | .backup | .[-1] | .timestamp.stop')
```

---

## 10. Escalation

| Condition | Action |
|-----------|--------|
| No backup in 24+ hours | Escalate to SEV-2 |
| Unable to create backup | Engage DBA team |
| Storage issues | Engage infrastructure team |
| Corruption detected | See [RUNBOOK-008-BACKUP-RESTORE.md](RUNBOOK-008-BACKUP-RESTORE.md) |

---

## 11. Related Runbooks

- [RUNBOOK-008-BACKUP-RESTORE.md](RUNBOOK-008-BACKUP-RESTORE.md) - Restore procedures
- [RUNBOOK-002-DB-FAILOVER.md](RUNBOOK-002-DB-FAILOVER.md) - Database failover

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0.0 | 2024 | Platform Team | Initial release |
