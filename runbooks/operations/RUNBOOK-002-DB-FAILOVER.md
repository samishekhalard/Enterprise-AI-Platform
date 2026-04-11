# RUNBOOK-002: Database Failover

## Quick Reference

| Property | Value |
|----------|-------|
| **Runbook ID** | RB-002 |
| **Severity** | SEV-1/SEV-2 |
| **On-Call Required** | Yes |
| **Estimated Duration** | 30-60 minutes |
| **Requires Approval** | Yes (for manual failover) |

---

## 1. Overview

This runbook covers procedures for PostgreSQL database failover scenarios, including automated failover verification, manual failover execution, and post-failover validation.

---

## 2. Symptoms

- Primary database unreachable
- Replication lag alerts
- Connection pool exhausted
- Prometheus alerts: `PostgresDown`, `ReplicationLag`, `HighConnectionCount`

---

## 3. Architecture Context

```
┌─────────────────────────────────────────────────────────────┐
│                  DATABASE ARCHITECTURE                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────┐  Sync Replication  ┌─────────────┐       │
│  │ PRIMARY     │ ──────────────────>│ STANDBY 1   │       │
│  │ (us-east-1) │                    │ (us-east-1) │       │
│  └─────────────┘                    └─────────────┘       │
│         │                                                   │
│         │ Async Replication                                │
│         ▼                                                   │
│  ┌─────────────┐                                           │
│  │ STANDBY 2   │ (DR Site - eu-west-1)                     │
│  └─────────────┘                                           │
│                                                             │
│  Patroni Cluster: Automatic failover within region         │
│  Cross-region: Manual failover required                    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 4. Pre-Failover Checklist

```bash
# 1. Verify current cluster state
kubectl exec -it postgresql-0 -n ems-prod -- \
  patronictl list

# 2. Check replication status
kubectl exec -it postgresql-0 -n ems-prod -- \
  psql -U postgres -c "SELECT * FROM pg_stat_replication;"

# 3. Check replication lag
kubectl exec -it postgresql-0 -n ems-prod -- \
  psql -U postgres -c "SELECT pg_last_wal_receive_lsn() - pg_last_wal_replay_lsn() AS lag_bytes;"

# 4. Document current leader
kubectl exec -it postgresql-0 -n ems-prod -- \
  patronictl show-config
```

---

## 5. Automatic Failover (Patroni)

### 5.1 Verify Automatic Failover Occurred

```bash
# Check Patroni events
kubectl logs -l app=postgresql -n ems-prod --tail=200 | grep -i failover

# Verify new leader
kubectl exec -it postgresql-0 -n ems-prod -- \
  patronictl list

# Expected output shows new leader
# + Member      | Host          | Role    | State   | TL | Lag
# + postgresql-0| 10.0.1.10     | Leader  | running |  3 |
# + postgresql-1| 10.0.1.11     | Replica | running |  3 | 0
```

### 5.2 Validate Automatic Failover

```bash
# Test write to new primary
kubectl exec -it postgresql-0 -n ems-prod -- \
  psql -U postgres -d ems -c "INSERT INTO health_check(ts) VALUES (now());"

# Verify application connectivity
curl -s https://api.ems.com/health | jq .components.database
```

---

## 6. Manual Failover Procedures

### 6.1 Planned Failover (Zero Downtime)

```bash
# 1. Get approval from incident commander
# Document approval in incident channel

# 2. Check standby is healthy and in sync
kubectl exec -it postgresql-0 -n ems-prod -- \
  patronictl list

# 3. Initiate switchover (NOT failover)
kubectl exec -it postgresql-0 -n ems-prod -- \
  patronictl switchover --master postgresql-0 --candidate postgresql-1

# 4. Confirm switchover
kubectl exec -it postgresql-0 -n ems-prod -- \
  patronictl list

# 5. Verify application health
curl -s https://api.ems.com/health | jq .
```

### 6.2 Emergency Failover (With Downtime)

**WARNING: Use only when primary is unrecoverable**

```bash
# 1. Confirm primary is truly down
kubectl exec -it postgresql-1 -n ems-prod -- \
  pg_isready -h postgresql-0 -p 5432
# Should timeout or return error

# 2. Force failover via Patroni
kubectl exec -it postgresql-1 -n ems-prod -- \
  patronictl failover --force

# 3. If Patroni is unresponsive, promote standby directly
kubectl exec -it postgresql-1 -n ems-prod -- \
  pg_ctl promote -D /var/lib/postgresql/data

# 4. Update connection strings (if not using Patroni service)
kubectl patch secret postgresql-credentials -n ems-prod \
  -p '{"stringData":{"host":"postgresql-1.ems-prod.svc"}}'

# 5. Restart application pods to pick up new connection
kubectl rollout restart deployment/api-gateway -n ems-prod
```

### 6.3 Cross-Region Failover (DR)

**WARNING: This is a DR scenario - requires executive approval**

```bash
# 1. Get executive approval
# Document in incident channel with names and timestamps

# 2. Verify DR site database status
aws rds describe-db-instances \
  --db-instance-identifier ems-dr \
  --region eu-west-1

# 3. Promote DR read replica to standalone
aws rds promote-read-replica \
  --db-instance-identifier ems-dr \
  --region eu-west-1

# 4. Update DNS to point to DR
# This is automated via Route53 health checks
# Manual override if needed:
aws route53 change-resource-record-sets \
  --hosted-zone-id $HOSTED_ZONE_ID \
  --change-batch file://dr-dns-change.json

# 5. Verify connectivity from application
# Update Kubernetes secrets to DR endpoint
kubectl patch secret postgresql-credentials -n ems-prod \
  -p '{"stringData":{"host":"ems-dr.eu-west-1.rds.amazonaws.com"}}'

# 6. Restart all application pods
kubectl rollout restart deployment -n ems-prod
```

---

## 7. Post-Failover Validation

### 7.1 Verify Database Operations

```bash
# 1. Write test
kubectl exec -it deploy/api-gateway -n ems-prod -- \
  psql "$DATABASE_URL" -c "INSERT INTO health_check(ts) VALUES (now()) RETURNING *;"

# 2. Read test
kubectl exec -it deploy/api-gateway -n ems-prod -- \
  psql "$DATABASE_URL" -c "SELECT count(*) FROM tenants;"

# 3. Transaction test
kubectl exec -it deploy/api-gateway -n ems-prod -- \
  psql "$DATABASE_URL" -c "BEGIN; SELECT 1; COMMIT;"
```

### 7.2 Verify Application Health

```bash
# 1. Health endpoint
curl -s https://api.ems.com/health | jq .

# 2. API functionality test
curl -s https://api.ems.com/api/v1/status

# 3. Monitor error rates
# Check Grafana dashboard for error rate spike
```

### 7.3 Verify Replication

```bash
# After failover, old primary becomes standby (if recovered)
kubectl exec -it postgresql-0 -n ems-prod -- \
  patronictl list

# Verify replication lag is zero
kubectl exec -it postgresql-0 -n ems-prod -- \
  patronictl show-config | grep -i replication
```

---

## 8. Recovery of Failed Node

### 8.1 Reinitialize as Standby

```bash
# 1. Check node status
kubectl describe pod postgresql-0 -n ems-prod

# 2. If data corruption, reinitialize from leader
kubectl exec -it postgresql-0 -n ems-prod -- \
  patronictl reinit postgresql-0

# 3. Monitor reinitialization progress
kubectl logs -f postgresql-0 -n ems-prod

# 4. Verify node rejoined cluster
kubectl exec -it postgresql-0 -n ems-prod -- \
  patronictl list
```

### 8.2 Timeline Check

```bash
# Ensure all nodes on same timeline
kubectl exec -it postgresql-0 -n ems-prod -- \
  psql -U postgres -c "SELECT pg_current_wal_lsn();"

kubectl exec -it postgresql-1 -n ems-prod -- \
  psql -U postgres -c "SELECT pg_last_wal_replay_lsn();"
```

---

## 9. Rollback Procedures

### 9.1 Switchback to Original Primary

```bash
# Only after original primary is healthy and synced
# 1. Verify original primary caught up
kubectl exec -it postgresql-0 -n ems-prod -- \
  patronictl list | grep "Lag"

# 2. Initiate switchover back
kubectl exec -it postgresql-0 -n ems-prod -- \
  patronictl switchover --master postgresql-1 --candidate postgresql-0

# 3. Verify
kubectl exec -it postgresql-0 -n ems-prod -- \
  patronictl list
```

---

## 10. Monitoring & Metrics

### Key Metrics to Monitor

| Metric | Threshold | Alert |
|--------|-----------|-------|
| `pg_up` | 1 | Critical if 0 |
| `pg_replication_lag_seconds` | < 1s | Warning > 5s |
| `pg_stat_activity_count` | < max_connections | Warning > 80% |
| `pg_database_size_bytes` | < disk capacity | Warning > 80% |

---

## 11. Escalation

| Condition | Action |
|-----------|--------|
| Cannot restore service within 30min | Escalate to SEV-1 |
| Data loss detected | Engage DBA team + management |
| Cross-region failover needed | Executive approval required |
| Corruption suspected | Engage PostgreSQL expert |

---

## 12. Related Runbooks

- [RUNBOOK-001-HEALTH-CHECK.md](RUNBOOK-001-HEALTH-CHECK.md) - Health check failures
- [RUNBOOK-008-BACKUP-RESTORE.md](RUNBOOK-008-BACKUP-RESTORE.md) - Restore from backup
- [RUNBOOK-003-SERVICE-RECOVERY.md](RUNBOOK-003-SERVICE-RECOVERY.md) - Service recovery

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0.0 | 2024 | Platform Team | Initial release |
