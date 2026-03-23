# RUNBOOK-010: Tenant Operations

## Quick Reference

| Property | Value |
|----------|-------|
| **Runbook ID** | RB-010 |
| **Severity** | SEV-3/SEV-4 |
| **On-Call Required** | Sometimes |
| **Estimated Duration** | 15-60 minutes |

---

## 1. Overview

This runbook covers operational procedures for tenant management, including tenant provisioning, data export, tenant isolation issues, and tenant-specific troubleshooting.

---

## 2. Tenant Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     TENANT ISOLATION MODEL                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  DATABASE PER TENANT (Production)                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐            │
│  │ ems_    │  │ ems_    │  │ ems_    │            │
│  │ tenant_a    │  │ tenant_b    │  │ tenant_c    │            │
│  └─────────────┘  └─────────────┘  └─────────────┘            │
│                                                                 │
│  SCHEMA PER SANDBOX (Development/Testing)                      │
│  ┌────────────────────────────────────────────┐               │
│  │ ems_tenant_a_sandbox                    │               │
│  │  ├── schema: dev_sandbox_1                  │               │
│  │  ├── schema: test_sandbox_1                 │               │
│  │  └── schema: uat_sandbox_1                  │               │
│  └────────────────────────────────────────────┘               │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. Tenant Provisioning

### 3.1 Create New Tenant

```bash
# 1. Create tenant database
kubectl exec -it postgresql-0 -n ems-prod -- \
  createdb -U postgres ems_tenant_<tenant_id>

# 2. Create tenant user with limited privileges
kubectl exec -it postgresql-0 -n ems-prod -- \
  psql -U postgres -c "
    CREATE USER tenant_<tenant_id> WITH PASSWORD '<secure_password>';
    GRANT CONNECT ON DATABASE ems_tenant_<tenant_id> TO tenant_<tenant_id>;
    GRANT ALL PRIVILEGES ON DATABASE ems_tenant_<tenant_id> TO tenant_<tenant_id>;
  "

# 3. Initialize schema
kubectl exec -it postgresql-0 -n ems-prod -- \
  psql -U postgres -d ems_tenant_<tenant_id> -f /sql/tenant_schema.sql

# 4. Create tenant record in control plane
kubectl exec -it deploy/api-gateway -n ems-prod -- \
  curl -X POST http://localhost:8080/admin/tenants \
    -H "Content-Type: application/json" \
    -d '{
      "tenant_id": "<tenant_id>",
      "name": "<tenant_name>",
      "plan": "professional",
      "status": "active"
    }'

# 5. Create cache namespace
kubectl exec -it valkey-master-0 -n ems-prod -- \
  valkey-cli SELECT 0
# Tenant keys will be prefixed with tenant_id automatically

# 6. Initialize tenant admin user
kubectl exec -it deploy/api-gateway -n ems-prod -- \
  curl -X POST http://localhost:8080/admin/tenants/<tenant_id>/users \
    -H "Content-Type: application/json" \
    -d '{
      "email": "<admin_email>",
      "role": "tenant_admin",
      "send_welcome_email": true
    }'
```

### 3.2 Verify Tenant Setup

```bash
# 1. Check database exists
kubectl exec -it postgresql-0 -n ems-prod -- \
  psql -U postgres -c "\l" | grep ems_tenant_<tenant_id>

# 2. Check tenant record
kubectl exec -it deploy/api-gateway -n ems-prod -- \
  curl http://localhost:8080/admin/tenants/<tenant_id>

# 3. Test tenant isolation
kubectl exec -it deploy/api-gateway -n ems-prod -- \
  curl -H "X-Tenant-ID: <tenant_id>" http://localhost:8080/api/v1/health
```

---

## 4. Tenant Data Export

### 4.1 Full Tenant Data Export

```bash
# 1. Create export job
cat <<EOF | kubectl apply -f -
apiVersion: batch/v1
kind: Job
metadata:
  name: tenant-export-<tenant_id>-$(date +%s)
  namespace: ems-prod
spec:
  template:
    spec:
      containers:
      - name: exporter
        image: ems/data-exporter:latest
        env:
        - name: TENANT_ID
          value: "<tenant_id>"
        - name: EXPORT_FORMAT
          value: "json"  # or csv, sql
        - name: S3_BUCKET
          value: "ems-exports"
      restartPolicy: Never
  backoffLimit: 2
EOF

# 2. Monitor export progress
kubectl logs -f job/tenant-export-<tenant_id>-* -n ems-prod

# 3. Get export location
kubectl exec -it deploy/api-gateway -n ems-prod -- \
  aws s3 ls s3://ems-exports/<tenant_id>/
```

### 4.2 Partial Data Export

```bash
# Export specific tables
kubectl exec -it postgresql-0 -n ems-prod -- \
  pg_dump -U postgres -d ems_tenant_<tenant_id> \
    -t users -t documents -t workflows \
    --format=custom -f /tmp/tenant_partial_export.dump

# Copy to S3
kubectl exec -it postgresql-0 -n ems-prod -- \
  aws s3 cp /tmp/tenant_partial_export.dump \
    s3://ems-exports/<tenant_id>/partial_$(date +%Y%m%d).dump
```

### 4.3 GDPR Data Export (Right to Portability)

```bash
# Generate user-specific export
kubectl exec -it deploy/api-gateway -n ems-prod -- \
  curl -X POST http://localhost:8080/admin/gdpr/export \
    -H "Content-Type: application/json" \
    -d '{
      "tenant_id": "<tenant_id>",
      "user_id": "<user_id>",
      "format": "json",
      "include": ["profile", "activity", "documents"]
    }'

# Export is encrypted and stored in secure location
# User receives download link via email
```

---

## 5. Tenant Troubleshooting

### 5.1 Tenant Cannot Access System

```bash
# 1. Check tenant status
kubectl exec -it deploy/api-gateway -n ems-prod -- \
  curl http://localhost:8080/admin/tenants/<tenant_id> | jq .status

# 2. Check tenant database connectivity
kubectl exec -it deploy/api-gateway -n ems-prod -- \
  psql "postgres://tenant_<tenant_id>:xxx@postgresql:5432/ems_tenant_<tenant_id>" \
    -c "SELECT 1;"

# 3. Check tenant quota
kubectl exec -it deploy/api-gateway -n ems-prod -- \
  curl http://localhost:8080/admin/tenants/<tenant_id>/quota | jq .

# 4. Check for rate limiting
kubectl logs -l app=api-gateway -n ems-prod | \
  grep "<tenant_id>" | grep -i "rate\|limit"

# 5. Verify tenant routing
kubectl exec -it deploy/api-gateway -n ems-prod -- \
  curl -H "X-Tenant-ID: <tenant_id>" http://localhost:8080/api/v1/whoami
```

### 5.2 Slow Performance for Specific Tenant

```bash
# 1. Check tenant-specific metrics
kubectl exec -it deploy/api-gateway -n ems-prod -- \
  curl http://localhost:8080/admin/tenants/<tenant_id>/metrics | jq .

# 2. Check database size
kubectl exec -it postgresql-0 -n ems-prod -- \
  psql -U postgres -c "
    SELECT pg_size_pretty(pg_database_size('ems_tenant_<tenant_id>'));
  "

# 3. Check for slow queries
kubectl exec -it postgresql-0 -n ems-prod -- \
  psql -U postgres -d ems_tenant_<tenant_id> -c "
    SELECT query, calls, mean_time, total_time
    FROM pg_stat_statements
    ORDER BY mean_time DESC
    LIMIT 10;
  "

# 4. Check table bloat
kubectl exec -it postgresql-0 -n ems-prod -- \
  psql -U postgres -d ems_tenant_<tenant_id> -c "
    SELECT relname, n_dead_tup, n_live_tup,
           round(n_dead_tup * 100.0 / nullif(n_live_tup, 0), 2) as dead_ratio
    FROM pg_stat_user_tables
    ORDER BY n_dead_tup DESC
    LIMIT 10;
  "

# 5. Vacuum if needed
kubectl exec -it postgresql-0 -n ems-prod -- \
  psql -U postgres -d ems_tenant_<tenant_id> -c "VACUUM ANALYZE;"
```

### 5.3 Tenant Data Isolation Issue

```bash
# CRITICAL: Potential cross-tenant data access

# 1. Check all recent queries for tenant mixing
kubectl exec -it postgresql-0 -n ems-prod -- \
  psql -U postgres -c "
    SELECT query, calls
    FROM pg_stat_statements
    WHERE query LIKE '%tenant%'
    ORDER BY calls DESC
    LIMIT 20;
  "

# 2. Audit cross-tenant queries
kubectl exec -it postgresql-0 -n ems-prod -- \
  psql -U postgres -c "
    SELECT * FROM audit_logs
    WHERE tenant_id != request_tenant_id
    AND created_at > NOW() - INTERVAL '24 hours';
  "

# 3. Verify row-level security policies
kubectl exec -it postgresql-0 -n ems-prod -- \
  psql -U postgres -d ems_tenant_<tenant_id> -c "
    SELECT tablename, policyname, permissive, roles, qual
    FROM pg_policies;
  "

# 4. If isolation breach confirmed
# - Escalate to SEV-1
# - Engage security team
# - Document affected tenants
# - See RUNBOOK-004-SECURITY-RESPONSE.md
```

---

## 6. Tenant Suspension/Reactivation

### 6.1 Suspend Tenant

```bash
# 1. Update tenant status
kubectl exec -it deploy/api-gateway -n ems-prod -- \
  curl -X PATCH http://localhost:8080/admin/tenants/<tenant_id> \
    -H "Content-Type: application/json" \
    -d '{"status": "suspended", "reason": "non-payment"}'

# 2. Revoke active sessions
kubectl exec -it valkey-master-0 -n ems-prod -- \
  valkey-cli KEYS "session:<tenant_id>:*" | xargs -r valkey-cli DEL

# 3. Disable API access (application handles this via status check)
# Requests will return 403

# 4. Log suspension
kubectl exec -it deploy/api-gateway -n ems-prod -- \
  curl -X POST http://localhost:8080/admin/audit \
    -H "Content-Type: application/json" \
    -d '{
      "event": "tenant_suspended",
      "tenant_id": "<tenant_id>",
      "reason": "non-payment",
      "actor": "<admin_email>"
    }'
```

### 6.2 Reactivate Tenant

```bash
# 1. Update tenant status
kubectl exec -it deploy/api-gateway -n ems-prod -- \
  curl -X PATCH http://localhost:8080/admin/tenants/<tenant_id> \
    -H "Content-Type: application/json" \
    -d '{"status": "active"}'

# 2. Clear any cached denial
kubectl exec -it valkey-master-0 -n ems-prod -- \
  valkey-cli DEL "tenant:<tenant_id>:status"

# 3. Notify tenant admin
kubectl exec -it deploy/api-gateway -n ems-prod -- \
  curl -X POST http://localhost:8080/admin/notifications \
    -H "Content-Type: application/json" \
    -d '{
      "tenant_id": "<tenant_id>",
      "template": "account_reactivated",
      "channel": "email"
    }'
```

---

## 7. Tenant Deletion

### 7.1 Soft Delete (Recommended)

```bash
# 1. Mark tenant as deleted
kubectl exec -it deploy/api-gateway -n ems-prod -- \
  curl -X PATCH http://localhost:8080/admin/tenants/<tenant_id> \
    -H "Content-Type: application/json" \
    -d '{"status": "deleted", "deleted_at": "'$(date -Iseconds)'"}'

# 2. Revoke all access
kubectl exec -it valkey-master-0 -n ems-prod -- \
  valkey-cli KEYS "*:<tenant_id>:*" | xargs -r valkey-cli DEL

# 3. Schedule data retention (keep for 90 days)
kubectl exec -it deploy/api-gateway -n ems-prod -- \
  curl -X POST http://localhost:8080/admin/retention/schedule \
    -H "Content-Type: application/json" \
    -d '{
      "tenant_id": "<tenant_id>",
      "action": "delete",
      "scheduled_for": "'$(date -d "+90 days" -Iseconds)'"
    }'
```

### 7.2 Hard Delete (Requires Approval)

```bash
# CAUTION: IRREVERSIBLE - Requires manager approval
# Document approval in ticket before proceeding

# 1. Export final backup
kubectl exec -it postgresql-0 -n ems-prod -- \
  pg_dump -U postgres -d ems_tenant_<tenant_id> \
    --format=custom -f /tmp/tenant_final_backup.dump
kubectl exec -it postgresql-0 -n ems-prod -- \
  aws s3 cp /tmp/tenant_final_backup.dump \
    s3://ems-archive/<tenant_id>/final_backup_$(date +%Y%m%d).dump

# 2. Delete tenant database
kubectl exec -it postgresql-0 -n ems-prod -- \
  dropdb -U postgres ems_tenant_<tenant_id>

# 3. Delete tenant user
kubectl exec -it postgresql-0 -n ems-prod -- \
  psql -U postgres -c "DROP USER tenant_<tenant_id>;"

# 4. Clear all cache entries
kubectl exec -it valkey-master-0 -n ems-prod -- \
  valkey-cli KEYS "*<tenant_id>*" | xargs -r valkey-cli DEL

# 5. Delete tenant record
kubectl exec -it deploy/api-gateway -n ems-prod -- \
  curl -X DELETE http://localhost:8080/admin/tenants/<tenant_id>?hard=true

# 6. Delete from file storage
kubectl exec -it deploy/api-gateway -n ems-prod -- \
  aws s3 rm s3://ems-files/<tenant_id>/ --recursive
```

---

## 8. Tenant Resource Management

### 8.1 Check Tenant Quotas

```bash
# View current usage vs quota
kubectl exec -it deploy/api-gateway -n ems-prod -- \
  curl http://localhost:8080/admin/tenants/<tenant_id>/quota | jq .

# Example output:
# {
#   "storage_used_gb": 5.2,
#   "storage_quota_gb": 10,
#   "users_count": 45,
#   "users_quota": 50,
#   "api_calls_month": 125000,
#   "api_calls_quota": 500000
# }
```

### 8.2 Adjust Tenant Quota

```bash
# Increase quota (upgrade plan)
kubectl exec -it deploy/api-gateway -n ems-prod -- \
  curl -X PATCH http://localhost:8080/admin/tenants/<tenant_id>/quota \
    -H "Content-Type: application/json" \
    -d '{
      "storage_quota_gb": 50,
      "users_quota": 200,
      "api_calls_quota": 2000000
    }'
```

---

## 9. Sandbox Management

### 9.1 Create Tenant Sandbox

```bash
# Create development sandbox
kubectl exec -it postgresql-0 -n ems-prod -- \
  psql -U postgres -d ems_tenant_<tenant_id> -c "
    CREATE SCHEMA sandbox_dev;
    -- Copy production schema structure (not data)
    SELECT clone_schema('public', 'sandbox_dev', false);
  "

# Initialize with sample data
kubectl exec -it deploy/api-gateway -n ems-prod -- \
  curl -X POST http://localhost:8080/admin/tenants/<tenant_id>/sandbox \
    -H "Content-Type: application/json" \
    -d '{
      "name": "dev",
      "type": "development",
      "seed_data": "sample"
    }'
```

### 9.2 Reset Sandbox

```bash
# Clear sandbox data
kubectl exec -it postgresql-0 -n ems-prod -- \
  psql -U postgres -d ems_tenant_<tenant_id> -c "
    DROP SCHEMA sandbox_dev CASCADE;
    CREATE SCHEMA sandbox_dev;
    SELECT clone_schema('public', 'sandbox_dev', false);
  "
```

---

## 10. Escalation

| Condition | Action |
|-----------|--------|
| Cross-tenant data access | SEV-1 + Security team |
| Tenant database corruption | See [RUNBOOK-008-BACKUP-RESTORE.md](RUNBOOK-008-BACKUP-RESTORE.md) |
| Billing/contract issues | Customer Success team |
| Legal data request | Legal team |

---

## 11. Related Runbooks

- [RUNBOOK-004-SECURITY-RESPONSE.md](RUNBOOK-004-SECURITY-RESPONSE.md) - Security incidents
- [RUNBOOK-008-BACKUP-RESTORE.md](RUNBOOK-008-BACKUP-RESTORE.md) - Data restore
- [RUNBOOK-007-PERFORMANCE-ISSUES.md](RUNBOOK-007-PERFORMANCE-ISSUES.md) - Performance

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0.0 | 2024 | Platform Team | Initial release |
