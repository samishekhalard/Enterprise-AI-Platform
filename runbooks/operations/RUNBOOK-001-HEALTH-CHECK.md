# RUNBOOK-001: System Health Check

## Quick Reference

| Property | Value |
|----------|-------|
| **Runbook ID** | RB-001 |
| **Severity** | SEV-3/SEV-4 |
| **On-Call Required** | Yes |
| **Estimated Duration** | 15-30 minutes |

---

## 1. Overview

This runbook covers procedures for investigating and resolving system health check failures, including API health endpoints, database connectivity, and service dependencies.

---

## 2. Symptoms

- Health check endpoint returns non-200 status
- Kubernetes readiness/liveness probes failing
- Uptime monitoring alerts
- Prometheus alerts: `HealthCheckFailed`, `ServiceUnavailable`

---

## 3. Pre-Investigation Checklist

```bash
# 1. Verify alert is not a false positive
curl -v https://api.ems.com/health

# 2. Check current service status
kubectl get pods -n ems-prod -l app=api-gateway

# 3. Review recent deployments
kubectl rollout history deployment/api-gateway -n ems-prod
```

---

## 4. Diagnostic Steps

### 4.1 Check Health Endpoint Details

```bash
# Full health check with details
curl -s https://api.ems.com/health/detailed | jq .

# Expected response structure:
# {
#   "status": "healthy",
#   "timestamp": "2024-01-15T14:30:00Z",
#   "components": {
#     "database": { "status": "healthy", "latency_ms": 5 },
#     "cache": { "status": "healthy", "latency_ms": 1 },
#     "queue": { "status": "healthy", "latency_ms": 3 }
#   }
# }
```

### 4.2 Check Individual Components

```bash
# Database connectivity
kubectl exec -it deploy/api-gateway -n ems-prod -- \
  psql "$DATABASE_URL" -c "SELECT 1;"

# Cache connectivity
kubectl exec -it deploy/api-gateway -n ems-prod -- \
  valkey-cli -h valkey-master PING

# Message queue
kubectl exec -it deploy/api-gateway -n ems-prod -- \
  curl -s http://rabbitmq:15672/api/healthchecks/node
```

### 4.3 Check Pod Health

```bash
# Pod status and events
kubectl describe pod -l app=api-gateway -n ems-prod

# Container logs
kubectl logs -l app=api-gateway -n ems-prod --tail=100

# Resource usage
kubectl top pods -l app=api-gateway -n ems-prod
```

### 4.4 Check Dependencies

```bash
# All services in namespace
kubectl get svc -n ems-prod

# Endpoint health for all services
for svc in $(kubectl get svc -n ems-prod -o jsonpath='{.items[*].metadata.name}'); do
  echo "Checking $svc..."
  kubectl get endpoints $svc -n ems-prod
done
```

---

## 5. Common Issues & Resolutions

### 5.1 Database Connection Timeout

**Symptoms:**
- Health check reports `database: unhealthy`
- Error: `connection timed out`

**Resolution:**
```bash
# Check database pod status
kubectl get pods -n ems-prod -l app=postgresql

# Check database connections
kubectl exec -it postgresql-0 -n ems-prod -- \
  psql -U postgres -c "SELECT count(*) FROM pg_stat_activity;"

# If connection pool exhausted, restart affected pods
kubectl rollout restart deployment/api-gateway -n ems-prod
```

### 5.2 Cache Connection Failed

**Symptoms:**
- Health check reports `cache: unhealthy`
- Increased latency on requests

**Resolution:**
```bash
# Check Valkey status
kubectl get pods -n ems-prod -l app=valkey

# Check Valkey cluster info
kubectl exec -it valkey-master-0 -n ems-prod -- \
  valkey-cli CLUSTER INFO

# Restart cache if corrupted
kubectl rollout restart statefulset/valkey -n ems-prod
```

### 5.3 Out of Memory (OOM)

**Symptoms:**
- Pods in `CrashLoopBackOff`
- `OOMKilled` in pod events

**Resolution:**
```bash
# Check OOM events
kubectl get events -n ems-prod --field-selector reason=OOMKilled

# Check current memory usage
kubectl top pods -n ems-prod

# Increase memory limits (requires redeployment)
kubectl patch deployment api-gateway -n ems-prod \
  -p '{"spec":{"template":{"spec":{"containers":[{"name":"api-gateway","resources":{"limits":{"memory":"2Gi"}}}]}}}}'
```

### 5.4 Certificate Expired

**Symptoms:**
- SSL/TLS errors
- Health check fails with certificate error

**Resolution:**
```bash
# Check certificate expiry
kubectl get certificate -n ems-prod
openssl s_client -connect api.ems.com:443 2>/dev/null | openssl x509 -noout -dates

# Force certificate renewal (cert-manager)
kubectl delete certificate api-ems-com -n ems-prod
# cert-manager will auto-renew
```

---

## 6. Recovery Procedures

### 6.1 Restart Service

```bash
# Rolling restart (zero-downtime)
kubectl rollout restart deployment/api-gateway -n ems-prod

# Wait for rollout to complete
kubectl rollout status deployment/api-gateway -n ems-prod

# Verify health
curl -s https://api.ems.com/health | jq .status
```

### 6.2 Scale Up Replicas

```bash
# If under heavy load
kubectl scale deployment/api-gateway -n ems-prod --replicas=5

# Verify new pods are ready
kubectl get pods -l app=api-gateway -n ems-prod -w
```

### 6.3 Rollback Deployment

```bash
# If recent deployment caused issue
kubectl rollout undo deployment/api-gateway -n ems-prod

# Verify rollback
kubectl rollout status deployment/api-gateway -n ems-prod
```

---

## 7. Verification

After resolution, verify system health:

```bash
# 1. Health endpoint returns 200
curl -f https://api.ems.com/health

# 2. All pods running
kubectl get pods -n ems-prod -l app=api-gateway

# 3. No pending alerts
# Check Grafana/PagerDuty

# 4. Monitor for 15 minutes
watch -n 5 "curl -s https://api.ems.com/health | jq .status"
```

---

## 8. Escalation

| Condition | Action |
|-----------|--------|
| Cannot diagnose root cause | Escalate to Team Lead |
| Database-related issue | See [RUNBOOK-002-DB-FAILOVER.md](RUNBOOK-002-DB-FAILOVER.md) |
| Multiple services affected | Escalate to SEV-2 |
| Security-related failure | See [RUNBOOK-004-SECURITY-RESPONSE.md](RUNBOOK-004-SECURITY-RESPONSE.md) |

---

## 9. Related Runbooks

- [RUNBOOK-002-DB-FAILOVER.md](RUNBOOK-002-DB-FAILOVER.md) - Database issues
- [RUNBOOK-003-SERVICE-RECOVERY.md](RUNBOOK-003-SERVICE-RECOVERY.md) - Service recovery
- [RUNBOOK-005-CACHE-ISSUES.md](RUNBOOK-005-CACHE-ISSUES.md) - Cache problems

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0.0 | 2024 | Platform Team | Initial release |
