# RUNBOOK-005: Cache Issues (Valkey)

## Quick Reference

| Property | Value |
|----------|-------|
| **Runbook ID** | RB-005 |
| **Severity** | SEV-2/SEV-3 |
| **On-Call Required** | Yes |
| **Estimated Duration** | 15-30 minutes |

---

## 1. Overview

This runbook covers procedures for diagnosing and resolving issues with the Valkey cache layer, including connection issues, memory problems, cluster issues, and performance degradation.

---

## 2. Cache Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    3-TIER CACHE ARCHITECTURE                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  L1: Application Memory Cache                                   │
│  ├── Response Time: < 1ms                                       │
│  ├── Size: 256MB per pod                                       │
│  └── TTL: 60 seconds                                           │
│                                                                 │
│  L2: Valkey Cluster (Distributed Cache)                        │
│  ├── Response Time: < 5ms                                       │
│  ├── Size: 32GB cluster                                        │
│  ├── Nodes: 3 masters + 3 replicas                             │
│  └── TTL: Varies by key type                                   │
│                                                                 │
│  L3: PostgreSQL (Persistent Storage)                           │
│  ├── Response Time: ~50ms                                       │
│  └── Source of truth                                           │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. Symptoms

- High cache miss rate (> 30%)
- Increased database load
- Slow response times
- Connection timeouts to Valkey
- Memory pressure alerts
- Cluster node failures
- Prometheus alerts: `ValkeyDown`, `HighMemoryUsage`, `ClusterUnhealthy`

---

## 4. Initial Assessment

### 4.1 Quick Status Check

```bash
# Check Valkey pods
kubectl get pods -n ems-prod -l app=valkey

# Check cluster health
kubectl exec -it valkey-master-0 -n ems-prod -- \
  valkey-cli CLUSTER INFO

# Check memory usage
kubectl exec -it valkey-master-0 -n ems-prod -- \
  valkey-cli INFO memory | grep used_memory_human

# Check connection count
kubectl exec -it valkey-master-0 -n ems-prod -- \
  valkey-cli INFO clients | grep connected_clients
```

### 4.2 Cluster Node Status

```bash
# List all cluster nodes
kubectl exec -it valkey-master-0 -n ems-prod -- \
  valkey-cli CLUSTER NODES

# Expected output:
# <node_id> <ip>:<port> master - 0 1234567890 1 connected 0-5460
# <node_id> <ip>:<port> slave <master_id> 0 1234567890 1 connected
# ...
```

---

## 5. Common Issues & Resolutions

### 5.1 Connection Refused / Timeout

```bash
# 1. Check if Valkey is running
kubectl exec -it valkey-master-0 -n ems-prod -- valkey-cli PING
# Should return: PONG

# 2. Check Valkey service
kubectl get svc valkey -n ems-prod
kubectl get endpoints valkey -n ems-prod

# 3. Check network policies
kubectl get networkpolicies -n ems-prod

# 4. Test connectivity from application pod
kubectl exec -it deploy/api-gateway -n ems-prod -- \
  nc -zv valkey-master 6379

# 5. Restart Valkey if unresponsive
kubectl rollout restart statefulset/valkey-master -n ems-prod
```

### 5.2 High Memory Usage

```bash
# 1. Check memory breakdown
kubectl exec -it valkey-master-0 -n ems-prod -- \
  valkey-cli INFO memory

# 2. Identify large keys
kubectl exec -it valkey-master-0 -n ems-prod -- \
  valkey-cli --bigkeys

# 3. Check memory fragmentation
kubectl exec -it valkey-master-0 -n ems-prod -- \
  valkey-cli INFO memory | grep mem_fragmentation_ratio
# Good: 1.0 - 1.5, Bad: > 2.0

# 4. Trigger memory defragmentation
kubectl exec -it valkey-master-0 -n ems-prod -- \
  valkey-cli CONFIG SET activedefrag yes

# 5. If critical, clear expired keys
kubectl exec -it valkey-master-0 -n ems-prod -- \
  valkey-cli MEMORY PURGE

# 6. Emergency: Flush specific DB (CAUTION!)
# Only for non-critical data, requires approval
kubectl exec -it valkey-master-0 -n ems-prod -- \
  valkey-cli SELECT 2  # Session cache DB
kubectl exec -it valkey-master-0 -n ems-prod -- \
  valkey-cli FLUSHDB ASYNC
```

### 5.3 High Cache Miss Rate

```bash
# 1. Check hit/miss ratio
kubectl exec -it valkey-master-0 -n ems-prod -- \
  valkey-cli INFO stats | grep keyspace

# Calculate: hits / (hits + misses) * 100
# Target: > 70% hit rate

# 2. Check key expiration settings
kubectl exec -it valkey-master-0 -n ems-prod -- \
  valkey-cli CONFIG GET maxmemory-policy

# 3. Analyze key patterns
kubectl exec -it valkey-master-0 -n ems-prod -- \
  valkey-cli --scan --pattern "session:*" | wc -l

# 4. Increase TTL for frequently accessed keys
# This requires application code change

# 5. Check eviction policy
kubectl exec -it valkey-master-0 -n ems-prod -- \
  valkey-cli INFO stats | grep evicted_keys
# High eviction = need more memory
```

### 5.4 Cluster Node Failure

```bash
# 1. Identify failed nodes
kubectl exec -it valkey-master-0 -n ems-prod -- \
  valkey-cli CLUSTER NODES | grep fail

# 2. Check failed node logs
kubectl logs valkey-master-X -n ems-prod --tail=100

# 3. If replica failed, restart it
kubectl delete pod valkey-replica-X -n ems-prod

# 4. If master failed, check automatic failover
kubectl exec -it valkey-master-0 -n ems-prod -- \
  valkey-cli CLUSTER INFO | grep cluster_state
# Should be: cluster_state:ok (if failover succeeded)

# 5. Manual failover (if automatic failed)
kubectl exec -it valkey-replica-0 -n ems-prod -- \
  valkey-cli CLUSTER FAILOVER TAKEOVER

# 6. Rebalance slots after recovery
kubectl exec -it valkey-master-0 -n ems-prod -- \
  valkey-cli --cluster rebalance <any_node_ip>:6379
```

### 5.5 Slow Operations

```bash
# 1. Check slow log
kubectl exec -it valkey-master-0 -n ems-prod -- \
  valkey-cli SLOWLOG GET 10

# 2. Identify slow commands
kubectl exec -it valkey-master-0 -n ems-prod -- \
  valkey-cli INFO commandstats | sort -t'=' -k2 -rn | head -10

# 3. Check if KEYS command is being used (bad!)
kubectl exec -it valkey-master-0 -n ems-prod -- \
  valkey-cli INFO commandstats | grep keys

# 4. Disable dangerous commands
kubectl exec -it valkey-master-0 -n ems-prod -- \
  valkey-cli CONFIG SET rename-command KEYS ""

# 5. Check client output buffers
kubectl exec -it valkey-master-0 -n ems-prod -- \
  valkey-cli CLIENT LIST | grep -i buffer
```

### 5.6 Replication Lag

```bash
# 1. Check replication status
kubectl exec -it valkey-master-0 -n ems-prod -- \
  valkey-cli INFO replication

# 2. Check replica lag
# slave_repl_offset vs master_repl_offset

# 3. Check network between master/replica
kubectl exec -it valkey-replica-0 -n ems-prod -- \
  valkey-cli DEBUG SLEEP 0.001
# Should complete quickly

# 4. If persistent lag, resync replica
kubectl exec -it valkey-replica-0 -n ems-prod -- \
  valkey-cli REPLICAOF NO ONE
kubectl exec -it valkey-replica-0 -n ems-prod -- \
  valkey-cli REPLICAOF valkey-master-0.valkey 6379
```

---

## 6. Recovery Procedures

### 6.1 Full Cluster Restart

```bash
# 1. Scale down applications first (prevent write errors)
kubectl scale deployment/api-gateway -n ems-prod --replicas=0

# 2. Restart Valkey statefulsets in order
kubectl rollout restart statefulset/valkey-replica -n ems-prod
kubectl rollout status statefulset/valkey-replica -n ems-prod

kubectl rollout restart statefulset/valkey-master -n ems-prod
kubectl rollout status statefulset/valkey-master -n ems-prod

# 3. Verify cluster health
kubectl exec -it valkey-master-0 -n ems-prod -- \
  valkey-cli CLUSTER INFO

# 4. Scale applications back up
kubectl scale deployment/api-gateway -n ems-prod --replicas=3
```

### 6.2 Rebuild Cluster from Scratch

```bash
# CAUTION: Data loss! Only if cluster is unrecoverable

# 1. Delete all Valkey PVCs
kubectl delete pvc -l app=valkey -n ems-prod

# 2. Restart Valkey statefulset
kubectl rollout restart statefulset/valkey -n ems-prod

# 3. Recreate cluster
kubectl exec -it valkey-master-0 -n ems-prod -- \
  valkey-cli --cluster create \
    valkey-master-0.valkey:6379 \
    valkey-master-1.valkey:6379 \
    valkey-master-2.valkey:6379 \
    --cluster-replicas 0 --cluster-yes

# 4. Cache will warm up gradually from database
# Monitor hit rate over next hour
```

---

## 7. Cache Warming

### 7.1 Pre-warm Critical Keys

```bash
# After cache clear, warm critical data
kubectl exec -it deploy/api-gateway -n ems-prod -- \
  curl -X POST http://localhost:8080/admin/cache/warm-up

# Or trigger via cron job
kubectl create job --from=cronjob/cache-warmer cache-warmer-manual -n ems-prod
```

### 7.2 Monitor Warm-up Progress

```bash
# Watch hit rate recover
watch -n 5 "kubectl exec -it valkey-master-0 -n ems-prod -- valkey-cli INFO stats | grep keyspace_hits"
```

---

## 8. Verification

### 8.1 Post-Recovery Checks

```bash
# 1. Cluster health
kubectl exec -it valkey-master-0 -n ems-prod -- \
  valkey-cli CLUSTER INFO | grep cluster_state
# Expected: cluster_state:ok

# 2. All nodes online
kubectl exec -it valkey-master-0 -n ems-prod -- \
  valkey-cli CLUSTER NODES | grep -c "connected"
# Expected: 6 (3 masters + 3 replicas)

# 3. Memory usage normal
kubectl exec -it valkey-master-0 -n ems-prod -- \
  valkey-cli INFO memory | grep used_memory_human

# 4. Application connectivity
curl -s https://api.ems.com/health | jq .components.cache

# 5. No errors in logs
kubectl logs -l app=valkey -n ems-prod --tail=50 | grep -i error
```

---

## 9. Monitoring

### Key Metrics

| Metric | Warning | Critical |
|--------|---------|----------|
| `valkey_up` | - | 0 |
| `valkey_memory_used_bytes / max` | > 70% | > 85% |
| `valkey_keyspace_hits / (hits+misses)` | < 70% | < 50% |
| `valkey_connected_clients` | > 800 | > 950 |
| `valkey_cluster_state` | - | != ok |

---

## 10. Escalation

| Condition | Action |
|-----------|--------|
| Cluster unrecoverable | Escalate to SEV-1 |
| Data corruption suspected | Engage database team |
| Persistent performance issues | Engage development team |
| Memory exhaustion | Consider vertical scaling |

---

## 11. Related Runbooks

- [RUNBOOK-001-HEALTH-CHECK.md](RUNBOOK-001-HEALTH-CHECK.md) - System health
- [RUNBOOK-003-SERVICE-RECOVERY.md](RUNBOOK-003-SERVICE-RECOVERY.md) - Service recovery
- [RUNBOOK-007-PERFORMANCE-ISSUES.md](RUNBOOK-007-PERFORMANCE-ISSUES.md) - Performance tuning

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0.0 | 2024 | Platform Team | Initial release |
