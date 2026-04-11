# RUNBOOK-006: Deployment Rollback

## Quick Reference

| Property | Value |
|----------|-------|
| **Runbook ID** | RB-006 |
| **Severity** | SEV-2/SEV-3 |
| **On-Call Required** | Yes |
| **Estimated Duration** | 10-30 minutes |

---

## 1. Overview

This runbook covers procedures for rolling back failed deployments, including application rollbacks, database migration rollbacks, and configuration rollbacks.

---

## 2. Symptoms

- New deployment causing errors
- Increased error rate after deployment
- Health checks failing after deployment
- Performance degradation post-deployment
- User reports of new issues
- Prometheus alerts: `DeploymentFailed`, `HighErrorRate`

---

## 3. Deployment Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    DEPLOYMENT PIPELINE                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  GitHub ──> CI (Tests) ──> Build Image ──> Push Registry        │
│                                   │                             │
│                                   ▼                             │
│                ┌─────────────────────────────────────┐          │
│                │           ArgoCD                    │          │
│                │  ┌─────┐   ┌─────┐   ┌─────────┐   │          │
│                │  │ Dev │──>│ STG │──>│  PROD   │   │          │
│                │  └─────┘   └─────┘   └─────────┘   │          │
│                └─────────────────────────────────────┘          │
│                                                                 │
│  Rollback Strategy: Kubernetes Rolling Update                   │
│  History: 10 revisions retained                                 │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 4. Pre-Rollback Assessment

### 4.1 Identify the Problem

```bash
# 1. Check current deployment status
kubectl rollout status deployment/<service> -n ems-prod

# 2. View recent deployment history
kubectl rollout history deployment/<service> -n ems-prod

# 3. Check error rates
# View Grafana: Error Rate dashboard

# 4. Check logs for errors
kubectl logs -l app=<service> -n ems-prod --tail=100 | grep -i error

# 5. Identify what changed
kubectl describe deployment/<service> -n ems-prod | grep -A 5 "Image:"
```

### 4.2 Confirm Deployment is the Cause

```bash
# Check deployment timestamp vs issue start time
kubectl get deployment/<service> -n ems-prod \
  -o jsonpath='{.metadata.annotations.kubectl\.kubernetes\.io/last-applied-configuration}'

# Compare with alert timestamp
# If deployment time matches issue start, proceed with rollback
```

---

## 5. Application Rollback

### 5.1 Kubernetes Rollback (Recommended)

```bash
# 1. View rollout history
kubectl rollout history deployment/<service> -n ems-prod

# Example output:
# REVISION  CHANGE-CAUSE
# 1         Initial deployment
# 2         v1.2.0 release
# 3         v1.2.1 hotfix
# 4         v1.3.0 release (current, problematic)

# 2. Rollback to previous version
kubectl rollout undo deployment/<service> -n ems-prod

# 3. Rollback to specific revision
kubectl rollout undo deployment/<service> -n ems-prod --to-revision=2

# 4. Monitor rollback progress
kubectl rollout status deployment/<service> -n ems-prod

# 5. Verify rollback completed
kubectl get pods -l app=<service> -n ems-prod
```

### 5.2 ArgoCD Rollback

```bash
# 1. List application history
argocd app history ems-<service>

# 2. Rollback to previous revision
argocd app rollback ems-<service> <revision_number>

# 3. Disable auto-sync to prevent re-deployment
argocd app set ems-<service> --sync-policy none

# 4. Verify application status
argocd app get ems-<service>
```

### 5.3 Force Image Rollback

```bash
# If rollout history is corrupted, set image directly
kubectl set image deployment/<service> \
  <container>=registry.ems.com/<service>:v1.2.1 \
  -n ems-prod

# Verify new image
kubectl get deployment/<service> -n ems-prod \
  -o jsonpath='{.spec.template.spec.containers[0].image}'
```

---

## 6. Database Migration Rollback

### 6.1 Check Migration Status

```bash
# Check current migration version
kubectl exec -it deploy/api-gateway -n ems-prod -- \
  psql "$DATABASE_URL" -c "SELECT * FROM schema_migrations ORDER BY version DESC LIMIT 5;"

# Check for pending migrations
kubectl exec -it deploy/api-gateway -n ems-prod -- \
  psql "$DATABASE_URL" -c "SELECT * FROM schema_migrations WHERE dirty = true;"
```

### 6.2 Rollback Migration (Flyway)

```bash
# 1. Create rollback job
cat <<EOF | kubectl apply -f -
apiVersion: batch/v1
kind: Job
metadata:
  name: migration-rollback-$(date +%s)
  namespace: ems-prod
spec:
  template:
    spec:
      containers:
      - name: flyway
        image: flyway/flyway:latest
        args:
          - undo
        env:
          - name: FLYWAY_URL
            valueFrom:
              secretKeyRef:
                name: db-credentials
                key: jdbc-url
          - name: FLYWAY_USER
            valueFrom:
              secretKeyRef:
                name: db-credentials
                key: username
          - name: FLYWAY_PASSWORD
            valueFrom:
              secretKeyRef:
                name: db-credentials
                key: password
      restartPolicy: Never
  backoffLimit: 0
EOF

# 2. Monitor rollback
kubectl logs -f job/migration-rollback-* -n ems-prod

# 3. Verify rollback
kubectl exec -it deploy/api-gateway -n ems-prod -- \
  psql "$DATABASE_URL" -c "SELECT * FROM schema_migrations ORDER BY version DESC LIMIT 3;"
```

### 6.3 Manual Migration Rollback

```bash
# CAUTION: Manual SQL operations require DBA approval

# 1. Backup affected tables first
kubectl exec -it postgresql-0 -n ems-prod -- \
  pg_dump -U postgres -t <table_name> ems > /tmp/backup_before_rollback.sql

# 2. Execute rollback SQL
kubectl exec -it deploy/api-gateway -n ems-prod -- \
  psql "$DATABASE_URL" -f /app/migrations/rollback/V1.3.0_rollback.sql

# 3. Update migration table
kubectl exec -it deploy/api-gateway -n ems-prod -- \
  psql "$DATABASE_URL" -c "DELETE FROM schema_migrations WHERE version = '1.3.0';"
```

---

## 7. Configuration Rollback

### 7.1 ConfigMap Rollback

```bash
# 1. View ConfigMap history (if using sealed-secrets or git)
git log --oneline -- k8s/configmaps/<configmap>.yaml

# 2. Restore previous ConfigMap
git checkout HEAD~1 -- k8s/configmaps/<configmap>.yaml
kubectl apply -f k8s/configmaps/<configmap>.yaml

# 3. Restart pods to pick up new config
kubectl rollout restart deployment/<service> -n ems-prod
```

### 7.2 Secret Rollback

```bash
# 1. Retrieve previous secret from backup
aws secretsmanager get-secret-value \
  --secret-id ems/<secret-name> \
  --version-id <previous-version-id>

# 2. Update Kubernetes secret
kubectl patch secret <secret-name> -n ems-prod \
  -p '{"stringData":{"key":"previous_value"}}'

# 3. Restart affected pods
kubectl rollout restart deployment/<service> -n ems-prod
```

### 7.3 Terraform Rollback

```bash
# 1. Check Terraform state history
terraform state list

# 2. Restore previous state
terraform state pull > current_state.json
# Edit or restore from backup

# 3. Apply previous configuration
git checkout HEAD~1 -- terraform/
terraform apply

# 4. Or use Terraform Cloud rollback
# Navigate to Terraform Cloud UI and rollback run
```

---

## 8. Helm Chart Rollback

```bash
# 1. View Helm history
helm history <release-name> -n ems-prod

# 2. Rollback to previous revision
helm rollback <release-name> <revision> -n ems-prod

# 3. Wait for rollback to complete
helm status <release-name> -n ems-prod

# 4. Verify pods
kubectl get pods -l app.kubernetes.io/instance=<release-name> -n ems-prod
```

---

## 9. Canary/Blue-Green Rollback

### 9.1 Canary Rollback

```bash
# 1. Stop canary traffic immediately
kubectl patch virtualservice ems -n ems-prod \
  -p '{"spec":{"http":[{"route":[{"destination":{"host":"api-gateway","subset":"stable"},"weight":100}]}]}}'

# 2. Scale down canary
kubectl scale deployment/api-gateway-canary -n ems-prod --replicas=0

# 3. Verify all traffic goes to stable
kubectl exec -it deploy/api-gateway -n ems-prod -- curl http://localhost:8080/version
```

### 9.2 Blue-Green Rollback

```bash
# 1. Switch traffic back to blue (previous)
kubectl patch service api-gateway -n ems-prod \
  -p '{"spec":{"selector":{"version":"blue"}}}'

# 2. Verify traffic routing
kubectl get endpoints api-gateway -n ems-prod

# 3. Keep green running for investigation
# Scale down green after investigation
kubectl scale deployment/api-gateway-green -n ems-prod --replicas=0
```

---

## 10. Post-Rollback Verification

### 10.1 Verify Service Health

```bash
# 1. Health check
curl -s https://api.ems.com/health | jq .

# 2. All pods running
kubectl get pods -l app=<service> -n ems-prod

# 3. No errors in logs
kubectl logs -l app=<service> -n ems-prod --tail=50 | grep -i error

# 4. Correct version deployed
kubectl get deployment/<service> -n ems-prod \
  -o jsonpath='{.spec.template.spec.containers[0].image}'
```

### 10.2 Verify Functionality

```bash
# 1. Run smoke tests
curl -s https://api.ems.com/api/v1/status

# 2. Check error rates (should decrease)
# Monitor Grafana for 10 minutes

# 3. Verify critical paths
# Login, core operations, etc.
```

---

## 11. Preventing Future Issues

### 11.1 Immediate Actions

```bash
# 1. Disable auto-deploy
# ArgoCD
argocd app set ems-<service> --sync-policy none

# Or add deployment annotation
kubectl annotate deployment/<service> -n ems-prod \
  "deployment.kubernetes.io/paused=true"

# 2. Tag problematic version
git tag -a "broken-v1.3.0" -m "DO NOT DEPLOY - causes issue X"
```

### 11.2 Investigation

1. Gather deployment artifacts (image, config, env vars)
2. Reproduce in staging environment
3. Identify root cause
4. Create fix and test thoroughly before next deployment

---

## 12. Escalation

| Condition | Action |
|-----------|--------|
| Rollback fails | Escalate to SEV-1 |
| Database rollback needed | Engage DBA team |
| Data corruption detected | See [RUNBOOK-008-BACKUP-RESTORE.md](RUNBOOK-008-BACKUP-RESTORE.md) |
| Infrastructure issue | Engage DevOps team |

---

## 13. Related Runbooks

- [RUNBOOK-001-HEALTH-CHECK.md](RUNBOOK-001-HEALTH-CHECK.md) - Health checks
- [RUNBOOK-003-SERVICE-RECOVERY.md](RUNBOOK-003-SERVICE-RECOVERY.md) - Service recovery
- [RUNBOOK-008-BACKUP-RESTORE.md](RUNBOOK-008-BACKUP-RESTORE.md) - Restore from backup

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0.0 | 2024 | Platform Team | Initial release |
