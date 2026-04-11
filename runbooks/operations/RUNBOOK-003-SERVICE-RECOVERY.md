# RUNBOOK-003: Service Recovery

## Quick Reference

| Property | Value |
|----------|-------|
| **Runbook ID** | RB-003 |
| **Severity** | SEV-2/SEV-3 |
| **On-Call Required** | Yes |
| **Estimated Duration** | 15-45 minutes |

---

## 1. Overview

This runbook covers procedures for recovering services that have become unresponsive, are crashing, or experiencing degraded performance.

---

## 2. Symptoms

- Service returning 5xx errors
- Pods in CrashLoopBackOff state
- High latency or timeouts
- Kubernetes events showing failures
- Prometheus alerts: `ServiceDown`, `HighErrorRate`, `HighLatency`

---

## 3. Service Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    EMS SERVICE MAP                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  External Traffic                                               │
│       │                                                         │
│       ▼                                                         │
│  ┌─────────────┐                                               │
│  │ API Gateway │ ◄─── Entry point for all requests              │
│  └──────┬──────┘                                               │
│         │                                                       │
│    ┌────┴────┬────────┬────────┬────────┐                      │
│    ▼         ▼        ▼        ▼        ▼                      │
│ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐                  │
│ │Auth  │ │Tenant│ │Core  │ │Integ │ │Report│                  │
│ │Service│ │Mgmt │ │API   │ │Hub   │ │Engine│                  │
│ └──────┘ └──────┘ └──────┘ └──────┘ └──────┘                  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 4. Initial Assessment

### 4.1 Quick Status Check

```bash
# Get all pods status
kubectl get pods -n ems-prod -o wide

# Check for unhealthy pods
kubectl get pods -n ems-prod | grep -E "(Error|CrashLoopBackOff|Pending|ContainerCreating)"

# Recent events
kubectl get events -n ems-prod --sort-by='.lastTimestamp' | tail -20

# Service endpoint health
kubectl get endpoints -n ems-prod
```

### 4.2 Identify Affected Service

```bash
# List all deployments and their status
kubectl get deployments -n ems-prod

# Check specific service status
SERVICE_NAME="api-gateway"  # Change as needed
kubectl describe deployment $SERVICE_NAME -n ems-prod
```

---

## 5. Service-Specific Recovery

### 5.1 API Gateway Recovery

```bash
# Check API Gateway pods
kubectl get pods -n ems-prod -l app=api-gateway

# View logs
kubectl logs -l app=api-gateway -n ems-prod --tail=100

# Rolling restart (preferred)
kubectl rollout restart deployment/api-gateway -n ems-prod

# Force pod deletion (if stuck)
kubectl delete pod -l app=api-gateway -n ems-prod --force --grace-period=0

# Verify recovery
kubectl rollout status deployment/api-gateway -n ems-prod
```

### 5.2 Auth Service Recovery

```bash
# Auth service affects all authenticated requests
kubectl get pods -n ems-prod -l app=auth-service

# Check for JWT key issues
kubectl logs -l app=auth-service -n ems-prod | grep -i "key\|jwt\|secret"

# Verify secrets are mounted
kubectl exec -it deploy/auth-service -n ems-prod -- ls -la /etc/secrets/

# Restart
kubectl rollout restart deployment/auth-service -n ems-prod
```

### 5.3 Core API Recovery

```bash
# Core API handles main business logic
kubectl get pods -n ems-prod -l app=core-api

# Check database connectivity
kubectl exec -it deploy/core-api -n ems-prod -- \
  psql "$DATABASE_URL" -c "SELECT 1;"

# Check for memory issues
kubectl top pods -l app=core-api -n ems-prod

# Restart
kubectl rollout restart deployment/core-api -n ems-prod
```

### 5.4 Integration Hub Recovery

```bash
# Integration Hub manages tenant integrations
kubectl get pods -n ems-prod -l app=integration-hub

# Check queue connectivity
kubectl exec -it deploy/integration-hub -n ems-prod -- \
  curl -s http://rabbitmq:15672/api/healthchecks/node

# Check for stuck jobs
kubectl exec -it deploy/integration-hub -n ems-prod -- \
  curl -s http://localhost:8080/jobs/pending | jq .

# Restart
kubectl rollout restart deployment/integration-hub -n ems-prod
```

---

## 6. Common Issues & Resolutions

### 6.1 CrashLoopBackOff

```bash
# Get crash reason
kubectl describe pod <pod-name> -n ems-prod | grep -A 10 "Last State"

# Common causes and fixes:

# 1. Missing config/secrets
kubectl get configmaps -n ems-prod
kubectl get secrets -n ems-prod

# 2. Resource limits too low
kubectl patch deployment $SERVICE_NAME -n ems-prod \
  -p '{"spec":{"template":{"spec":{"containers":[{"name":"'$SERVICE_NAME'","resources":{"limits":{"memory":"2Gi","cpu":"1000m"}}}]}}}}'

# 3. Failed health probes (increase timeout)
kubectl patch deployment $SERVICE_NAME -n ems-prod \
  -p '{"spec":{"template":{"spec":{"containers":[{"name":"'$SERVICE_NAME'","livenessProbe":{"initialDelaySeconds":60,"timeoutSeconds":10}}]}}}}'
```

### 6.2 Image Pull Errors

```bash
# Check image pull status
kubectl describe pod <pod-name> -n ems-prod | grep -A 5 "Events"

# Verify image exists
docker manifest inspect $IMAGE_NAME

# Check registry credentials
kubectl get secret regcred -n ems-prod -o yaml

# Update registry credentials if expired
kubectl create secret docker-registry regcred \
  --docker-server=$REGISTRY \
  --docker-username=$USERNAME \
  --docker-password=$PASSWORD \
  -n ems-prod --dry-run=client -o yaml | kubectl apply -f -
```

### 6.3 Resource Exhaustion

```bash
# Check node resources
kubectl top nodes

# Check pod resources
kubectl top pods -n ems-prod

# If node is full, scale down non-critical services
kubectl scale deployment/report-engine -n ems-prod --replicas=1

# Or request node autoscaler
kubectl scale deployment/cluster-autoscaler -n kube-system --replicas=1
```

### 6.4 Network Issues

```bash
# Test service-to-service connectivity
kubectl exec -it deploy/api-gateway -n ems-prod -- \
  curl -v http://auth-service:8080/health

# Check network policies
kubectl get networkpolicies -n ems-prod

# Test DNS resolution
kubectl exec -it deploy/api-gateway -n ems-prod -- \
  nslookup auth-service.ems-prod.svc.cluster.local

# Restart CoreDNS if DNS issues
kubectl rollout restart deployment/coredns -n kube-system
```

---

## 7. Rollback Procedures

### 7.1 Rollback to Previous Version

```bash
# View rollout history
kubectl rollout history deployment/$SERVICE_NAME -n ems-prod

# Rollback to previous version
kubectl rollout undo deployment/$SERVICE_NAME -n ems-prod

# Rollback to specific revision
kubectl rollout undo deployment/$SERVICE_NAME -n ems-prod --to-revision=5

# Verify rollback
kubectl rollout status deployment/$SERVICE_NAME -n ems-prod
```

### 7.2 Pin to Known Good Version

```bash
# Set specific image version
kubectl set image deployment/$SERVICE_NAME \
  $SERVICE_NAME=registry.ems.com/$SERVICE_NAME:v1.2.3 \
  -n ems-prod

# Disable auto-deploy (ArgoCD)
kubectl patch application ems -n argocd \
  -p '{"spec":{"syncPolicy":{"automated":null}}}'
```

---

## 8. Scaling Procedures

### 8.1 Emergency Scale Up

```bash
# Increase replicas
kubectl scale deployment/$SERVICE_NAME -n ems-prod --replicas=10

# Enable HPA if not already
kubectl autoscale deployment/$SERVICE_NAME -n ems-prod \
  --min=3 --max=20 --cpu-percent=70
```

### 8.2 Enable Maintenance Mode

```bash
# Route traffic to maintenance page
kubectl patch ingress ems -n ems-prod \
  -p '{"metadata":{"annotations":{"nginx.ingress.kubernetes.io/custom-http-errors":"503"}}}'

# Or scale down service completely
kubectl scale deployment/$SERVICE_NAME -n ems-prod --replicas=0
```

---

## 9. Verification

### 9.1 Post-Recovery Checks

```bash
# 1. All pods running
kubectl get pods -n ems-prod | grep -v Running

# 2. Health endpoints
curl -s https://api.ems.com/health | jq .

# 3. No error events
kubectl get events -n ems-prod --field-selector type=Warning

# 4. Metrics normalized
# Check Grafana dashboards

# 5. Test critical paths
curl -s https://api.ems.com/api/v1/tenants | jq .
```

### 9.2 Monitoring Period

```bash
# Watch pods for 10 minutes
watch -n 5 "kubectl get pods -n ems-prod"

# Monitor error rates
# Check Grafana: Error Rate < 0.1%

# Monitor latency
# Check Grafana: P99 < 500ms
```

---

## 10. Escalation

| Condition | Action |
|-----------|--------|
| Service still down after 15 min | Escalate to SEV-1 |
| Database-related issue | See [RUNBOOK-002-DB-FAILOVER.md](RUNBOOK-002-DB-FAILOVER.md) |
| Multiple services affected | Engage multiple teams |
| Unknown error | Engage development team |

---

## 11. Related Runbooks

- [RUNBOOK-001-HEALTH-CHECK.md](RUNBOOK-001-HEALTH-CHECK.md) - Health check failures
- [RUNBOOK-002-DB-FAILOVER.md](RUNBOOK-002-DB-FAILOVER.md) - Database issues
- [RUNBOOK-006-DEPLOYMENT-ROLLBACK.md](RUNBOOK-006-DEPLOYMENT-ROLLBACK.md) - Deployment issues

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0.0 | 2024 | Platform Team | Initial release |
