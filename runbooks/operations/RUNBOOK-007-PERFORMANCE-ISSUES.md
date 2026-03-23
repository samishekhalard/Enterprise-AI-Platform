# RUNBOOK-007: Performance Issues

## Quick Reference

| Property | Value |
|----------|-------|
| **Runbook ID** | RB-007 |
| **Severity** | SEV-2/SEV-3 |
| **On-Call Required** | Yes |
| **Estimated Duration** | 30-60 minutes |

---

## 1. Overview

This runbook covers procedures for diagnosing and resolving performance issues including slow response times, high latency, resource exhaustion, and throughput degradation.

---

## 2. Performance Targets (SLOs)

| Metric | Target | Alert Threshold |
|--------|--------|-----------------|
| **API Response P50** | < 50ms | > 100ms |
| **API Response P95** | < 200ms | > 400ms |
| **API Response P99** | < 500ms | > 1000ms |
| **Error Rate** | < 0.1% | > 1% |
| **Availability** | 99.9% | < 99.5% |

---

## 3. Symptoms

- Slow API response times
- Request timeouts
- High CPU/memory usage
- Database connection pool exhaustion
- Increased error rates
- User complaints about slowness
- Prometheus alerts: `HighLatency`, `HighCPU`, `HighMemory`

---

## 4. Initial Assessment

### 4.1 Quick Performance Check

```bash
# 1. Check current latency
curl -w "\nTotal time: %{time_total}s\n" -o /dev/null -s https://api.ems.com/health

# 2. Check service resource usage
kubectl top pods -n ems-prod --sort-by=cpu
kubectl top pods -n ems-prod --sort-by=memory

# 3. Check node resources
kubectl top nodes

# 4. View current request rate
# Check Grafana: Request Rate dashboard
```

### 4.2 Identify Bottleneck Location

```bash
# Use distributed tracing (Jaeger/Zipkin)
# Check span durations to identify slow components

# Component breakdown:
# - Network (< 5ms expected)
# - Application (< 50ms expected)
# - Database (< 20ms expected)
# - Cache (< 1ms expected)
# - External services (variable)
```

---

## 5. Performance Diagnostics

### 5.1 Application Layer

```bash
# 1. Check pod resource limits
kubectl describe pod -l app=api-gateway -n ems-prod | grep -A 5 "Limits:"

# 2. Check for throttling
kubectl get --raw /apis/metrics.k8s.io/v1beta1/namespaces/ems-prod/pods | \
  jq '.items[] | {name: .metadata.name, cpu: .containers[].usage.cpu}'

# 3. Check GC activity (Java)
kubectl logs -l app=api-gateway -n ems-prod | grep -i "gc\|garbage"

# 4. Check thread pool exhaustion
kubectl exec -it deploy/api-gateway -n ems-prod -- \
  curl http://localhost:8080/actuator/metrics/jvm.threads.live

# 5. Check connection pools
kubectl exec -it deploy/api-gateway -n ems-prod -- \
  curl http://localhost:8080/actuator/metrics/hikaricp.connections.active
```

### 5.2 Database Layer

```bash
# 1. Check active queries
kubectl exec -it postgresql-0 -n ems-prod -- \
  psql -U postgres -c "SELECT pid, query, state, wait_event_type, query_start FROM pg_stat_activity WHERE state != 'idle' ORDER BY query_start;"

# 2. Check long-running queries (> 30s)
kubectl exec -it postgresql-0 -n ems-prod -- \
  psql -U postgres -c "SELECT pid, now() - query_start AS duration, query FROM pg_stat_activity WHERE state != 'idle' AND now() - query_start > interval '30 seconds';"

# 3. Check table statistics
kubectl exec -it postgresql-0 -n ems-prod -- \
  psql -U postgres -c "SELECT relname, seq_scan, idx_scan, n_tup_ins, n_tup_upd, n_tup_del FROM pg_stat_user_tables ORDER BY seq_scan DESC LIMIT 10;"

# 4. Check index usage
kubectl exec -it postgresql-0 -n ems-prod -- \
  psql -U postgres -c "SELECT indexrelname, idx_scan, idx_tup_read, idx_tup_fetch FROM pg_stat_user_indexes ORDER BY idx_scan DESC LIMIT 10;"

# 5. Check for lock contention
kubectl exec -it postgresql-0 -n ems-prod -- \
  psql -U postgres -c "SELECT blocked_locks.pid AS blocked_pid, blocking_locks.pid AS blocking_pid, blocked_activity.query AS blocked_query FROM pg_locks blocked_locks JOIN pg_stat_activity blocked_activity ON blocked_activity.pid = blocked_locks.pid JOIN pg_locks blocking_locks ON blocking_locks.locktype = blocked_locks.locktype WHERE NOT blocked_locks.granted;"
```

### 5.3 Cache Layer

```bash
# 1. Check cache hit rate
kubectl exec -it valkey-master-0 -n ems-prod -- \
  valkey-cli INFO stats | grep -E "keyspace_hits|keyspace_misses"

# 2. Calculate hit rate
# hit_rate = hits / (hits + misses) * 100
# Target: > 80%

# 3. Check cache latency
kubectl exec -it valkey-master-0 -n ems-prod -- \
  valkey-cli --latency

# 4. Check slow operations
kubectl exec -it valkey-master-0 -n ems-prod -- \
  valkey-cli SLOWLOG GET 10
```

### 5.4 Network Layer

```bash
# 1. Check ingress latency
kubectl logs -l app=ingress-nginx -n ingress-nginx --tail=100 | \
  awk '{print $NF}' | sort -n | tail -20

# 2. Check DNS resolution
kubectl exec -it deploy/api-gateway -n ems-prod -- \
  time nslookup postgresql.ems-prod.svc.cluster.local

# 3. Check inter-service latency
kubectl exec -it deploy/api-gateway -n ems-prod -- \
  curl -w "DNS: %{time_namelookup}s\nConnect: %{time_connect}s\nTTFB: %{time_starttransfer}s\nTotal: %{time_total}s\n" \
  -o /dev/null -s http://auth-service:8080/health
```

---

## 6. Common Issues & Resolutions

### 6.1 High CPU Usage

```bash
# 1. Identify high CPU pods
kubectl top pods -n ems-prod --sort-by=cpu | head -10

# 2. Check if caused by GC (Java)
kubectl exec -it deploy/api-gateway -n ems-prod -- \
  jstat -gc 1 1000 5

# 3. Scale out if legitimate load
kubectl scale deployment/api-gateway -n ems-prod --replicas=5

# 4. If runaway process, restart pod
kubectl delete pod <pod-name> -n ems-prod

# 5. Increase CPU limits if consistently hitting limits
kubectl patch deployment/api-gateway -n ems-prod \
  -p '{"spec":{"template":{"spec":{"containers":[{"name":"api-gateway","resources":{"limits":{"cpu":"2000m"}}}]}}}}'
```

### 6.2 High Memory Usage

```bash
# 1. Check memory usage
kubectl top pods -n ems-prod --sort-by=memory | head -10

# 2. Check for memory leaks (trending up without recovery)
# View Grafana: Memory usage over time

# 3. Force GC (Java)
kubectl exec -it deploy/api-gateway -n ems-prod -- \
  curl -X POST http://localhost:8080/actuator/gcheap

# 4. If OOM risk, increase limits
kubectl patch deployment/api-gateway -n ems-prod \
  -p '{"spec":{"template":{"spec":{"containers":[{"name":"api-gateway","resources":{"limits":{"memory":"4Gi"}}}]}}}}'

# 5. Restart if memory leak confirmed
kubectl rollout restart deployment/api-gateway -n ems-prod
```

### 6.3 Slow Database Queries

```bash
# 1. Kill long-running queries
kubectl exec -it postgresql-0 -n ems-prod -- \
  psql -U postgres -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE query_start < NOW() - INTERVAL '5 minutes' AND state != 'idle';"

# 2. Analyze query plan
kubectl exec -it postgresql-0 -n ems-prod -- \
  psql -U postgres -c "EXPLAIN (ANALYZE, BUFFERS) <slow_query>;"

# 3. Update statistics
kubectl exec -it postgresql-0 -n ems-prod -- \
  psql -U postgres -c "ANALYZE;"

# 4. Check for missing indexes
kubectl exec -it postgresql-0 -n ems-prod -- \
  psql -U postgres -c "SELECT relname, seq_scan - idx_scan AS too_much_seq FROM pg_stat_user_tables WHERE seq_scan - idx_scan > 0 ORDER BY too_much_seq DESC LIMIT 10;"

# 5. Add missing index (requires dev approval)
kubectl exec -it postgresql-0 -n ems-prod -- \
  psql -U postgres -c "CREATE INDEX CONCURRENTLY idx_<table>_<column> ON <table>(<column>);"
```

### 6.4 Connection Pool Exhaustion

```bash
# 1. Check current connections
kubectl exec -it postgresql-0 -n ems-prod -- \
  psql -U postgres -c "SELECT count(*) FROM pg_stat_activity;"

# 2. Check per-application connections
kubectl exec -it postgresql-0 -n ems-prod -- \
  psql -U postgres -c "SELECT application_name, count(*) FROM pg_stat_activity GROUP BY application_name;"

# 3. Increase pool size (requires restart)
kubectl set env deployment/api-gateway -n ems-prod \
  SPRING_DATASOURCE_HIKARI_MAXIMUM_POOL_SIZE=30

# 4. Terminate idle connections
kubectl exec -it postgresql-0 -n ems-prod -- \
  psql -U postgres -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE state = 'idle' AND query_start < NOW() - INTERVAL '10 minutes';"
```

### 6.5 N+1 Query Problem

```bash
# 1. Identify repeated queries
kubectl exec -it postgresql-0 -n ems-prod -- \
  psql -U postgres -c "SELECT query, calls, total_time/calls as avg_time FROM pg_stat_statements ORDER BY calls DESC LIMIT 20;"

# 2. If same query called hundreds of times, N+1 issue
# Requires application fix (batch loading, eager loading)

# 3. Temporary: Enable query caching
kubectl set env deployment/api-gateway -n ems-prod \
  SPRING_JPA_PROPERTIES_HIBERNATE_CACHE_USE_QUERY_CACHE=true
```

---

## 7. Emergency Actions

### 7.1 Immediate Relief

```bash
# 1. Scale up replicas
kubectl scale deployment/api-gateway -n ems-prod --replicas=10

# 2. Enable rate limiting
kubectl apply -f - <<EOF
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: ems-rate-limit
  namespace: ems-prod
  annotations:
    nginx.ingress.kubernetes.io/limit-rps: "100"
    nginx.ingress.kubernetes.io/limit-connections: "50"
spec:
  rules:
  - host: api.ems.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: api-gateway
            port:
              number: 8080
EOF

# 3. Enable degraded mode (disable non-critical features)
kubectl set env deployment/api-gateway -n ems-prod \
  FEATURE_REPORTING_ENABLED=false \
  FEATURE_ANALYTICS_ENABLED=false
```

### 7.2 Shed Load

```bash
# 1. Return 503 for low-priority endpoints
kubectl apply -f - <<EOF
apiVersion: networking.istio.io/v1alpha3
kind: VirtualService
metadata:
  name: load-shedding
  namespace: ems-prod
spec:
  hosts:
  - api-gateway
  http:
  - match:
    - uri:
        prefix: /api/v1/reports
    fault:
      abort:
        httpStatus: 503
        percentage:
          value: 100
  - route:
    - destination:
        host: api-gateway
EOF

# 2. Or use circuit breaker
kubectl set env deployment/api-gateway -n ems-prod \
  RESILIENCE4J_CIRCUITBREAKER_INSTANCES_DEFAULT_FAILURERATE_THRESHOLD=50
```

---

## 8. Monitoring & Verification

### 8.1 Monitor Recovery

```bash
# Watch latency improve
watch -n 5 "curl -w 'Time: %{time_total}s\n' -o /dev/null -s https://api.ems.com/health"

# Monitor error rate
# Check Grafana: Error Rate should decrease

# Monitor resource usage
watch -n 5 "kubectl top pods -n ems-prod --sort-by=cpu | head -10"
```

### 8.2 Verification

```bash
# 1. Latency within SLO
curl -w "\n%{time_total}s\n" -o /dev/null -s https://api.ems.com/api/v1/tenants
# Should be < 500ms

# 2. Error rate normalized
# Check Grafana: < 0.1%

# 3. Resource usage stable
kubectl top pods -n ems-prod
```

---

## 9. Escalation

| Condition | Action |
|-----------|--------|
| Cannot identify root cause | Engage senior engineers |
| Database-related | Engage DBA team |
| Infrastructure-related | Engage DevOps team |
| No improvement after 30 min | Escalate to SEV-1 |

---

## 10. Related Runbooks

- [RUNBOOK-002-DB-FAILOVER.md](RUNBOOK-002-DB-FAILOVER.md) - Database issues
- [RUNBOOK-005-CACHE-ISSUES.md](RUNBOOK-005-CACHE-ISSUES.md) - Cache issues
- [RUNBOOK-003-SERVICE-RECOVERY.md](RUNBOOK-003-SERVICE-RECOVERY.md) - Service recovery

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0.0 | 2024 | Platform Team | Initial release |
