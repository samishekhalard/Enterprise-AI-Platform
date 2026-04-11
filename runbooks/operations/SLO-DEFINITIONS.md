# EMS Service Level Objectives (SLOs)

**Document Version:** 1.0.0
**Last Updated:** 2024
**Owner:** Operations Team

---

```
╔═══════════════════════════════════════════════════════════════════════════════╗
║                    SERVICE LEVEL OBJECTIVES                                   ║
║                                                                               ║
║                    "What we promise, measured and tracked"                    ║
╚═══════════════════════════════════════════════════════════════════════════════╝
```

---

## 1. Overview

### SLO Hierarchy

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           SLA / SLO / SLI HIERARCHY                            │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  SLA (Service Level Agreement)                                                  │
│  └── Contractual commitment to customers                                        │
│      └── "99.9% availability, measured monthly"                                │
│                                                                                 │
│  SLO (Service Level Objective)                                                  │
│  └── Internal target (stricter than SLA)                                       │
│      └── "99.95% availability target"                                          │
│                                                                                 │
│  SLI (Service Level Indicator)                                                  │
│  └── Actual measurement                                                         │
│      └── "Successful requests / Total requests"                                │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Availability SLOs

### 2.1 Platform Availability

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│  SLO: PLATFORM AVAILABILITY                                                     │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  Target:        99.9% (three nines)                                            │
│  Measurement:   Monthly rolling window                                          │
│                                                                                 │
│  SLI Formula:                                                                   │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │  Availability = (Total Minutes - Downtime Minutes) / Total Minutes      │   │
│  │                                                                          │   │
│  │  Where Downtime = Minutes where error rate > 5% OR latency p99 > 5s     │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│  Error Budget:                                                                  │
│  ├── Monthly:  43.2 minutes (0.1% of 43,200 minutes)                           │
│  ├── Quarterly: 129.6 minutes                                                  │
│  └── Yearly:   525.6 minutes (8.76 hours)                                      │
│                                                                                 │
│  Measurement Points:                                                            │
│  ├── Synthetic monitoring (every 1 minute, 5 global locations)                 │
│  ├── Real user monitoring (RUM)                                                │
│  └── Load balancer health checks                                               │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Per-Service Availability

| Service | SLO Target | Error Budget (monthly) | Measurement |
|---------|------------|------------------------|-------------|
| **Frontend** | 99.95% | 21.6 minutes | Synthetic + RUM |
| **Backend API** | 99.9% | 43.2 minutes | Health endpoint |
| **Keycloak** | 99.9% | 43.2 minutes | Auth endpoint |
| **Database** | 99.99% | 4.32 minutes | Connection success |
| **Cache** | 99.9% | 43.2 minutes | Ping success |
| **Integration Hub** | 99.5% | 216 minutes | Webhook delivery |

---

## 3. Latency SLOs

### 3.1 API Response Time

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│  SLO: API LATENCY                                                               │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  Percentile Targets:                                                            │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │  Percentile │ Target    │ Max Acceptable │ SLO                          │   │
│  │  ───────────┼───────────┼────────────────┼────────────────────────────  │   │
│  │  p50        │ < 50ms    │ 100ms          │ 99% of requests              │   │
│  │  p95        │ < 200ms   │ 500ms          │ 95% of requests              │   │
│  │  p99        │ < 500ms   │ 1000ms         │ 99% of requests              │   │
│  │  p99.9      │ < 1000ms  │ 2000ms         │ 99.9% of requests            │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│  SLI Formula:                                                                   │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │  Latency SLI = Requests with latency < threshold / Total requests       │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│  Exclusions:                                                                    │
│  ├── Batch operations (> 1000 records)                                         │
│  ├── Export operations                                                         │
│  └── Intentionally slow endpoints (marked in API spec)                         │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 3.2 Per-Operation Latency

| Operation Type | p50 Target | p95 Target | p99 Target |
|----------------|------------|------------|------------|
| **GET (single)** | 20ms | 50ms | 100ms |
| **GET (list)** | 50ms | 150ms | 300ms |
| **POST (create)** | 50ms | 150ms | 300ms |
| **PUT (update)** | 50ms | 150ms | 300ms |
| **DELETE** | 30ms | 100ms | 200ms |
| **Auth (token)** | 100ms | 300ms | 500ms |
| **Search** | 100ms | 300ms | 500ms |

### 3.3 Frontend Performance

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│  SLO: FRONTEND PERFORMANCE (Core Web Vitals)                                   │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  Metric              │ Target      │ SLO (% of sessions meeting target)        │
│  ────────────────────┼─────────────┼───────────────────────────────────────    │
│  FCP (First Paint)   │ < 1.0s      │ 90%                                       │
│  LCP (Largest Paint) │ < 2.5s      │ 90%                                       │
│  FID (First Input)   │ < 100ms     │ 90%                                       │
│  CLS (Layout Shift)  │ < 0.1       │ 90%                                       │
│  TTI (Interactive)   │ < 3.0s      │ 85%                                       │
│                                                                                 │
│  Measurement: Google Lighthouse + Real User Monitoring                          │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Error Rate SLOs

### 4.1 API Error Rate

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│  SLO: ERROR RATE                                                                │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  Target: < 0.1% (5xx errors)                                                   │
│                                                                                 │
│  SLI Formula:                                                                   │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │  Error Rate = (5xx responses) / (Total responses) × 100                 │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│  Classification:                                                                │
│  ├── 5xx (Server errors): Count against SLO                                    │
│  ├── 4xx (Client errors): Do NOT count against SLO                             │
│  ├── 429 (Rate limit): Do NOT count against SLO                                │
│  └── Timeout (> 30s): Count as 5xx                                             │
│                                                                                 │
│  Error Budget:                                                                  │
│  └── 0.1% of requests can be 5xx                                               │
│      For 10M requests/month = 10,000 allowed errors                            │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 4.2 Per-Service Error Rate

| Service | Error Rate Target | Error Budget |
|---------|-------------------|--------------|
| **Backend API** | < 0.1% | 0.1% of requests |
| **Keycloak** | < 0.05% | 0.05% of auth requests |
| **Integration Sync** | < 1% | 1% of sync operations |
| **Webhook Delivery** | < 0.5% | 0.5% of webhooks |

---

## 5. Data Durability SLOs

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│  SLO: DATA DURABILITY                                                           │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  Target: 99.999999999% (11 nines)                                              │
│                                                                                 │
│  Commitment: Zero data loss for committed transactions                          │
│                                                                                 │
│  Achieved Through:                                                              │
│  ├── Synchronous replication within region                                     │
│  ├── Asynchronous replication to DR (< 1 hour RPO)                             │
│  ├── Daily backups with 30-day retention                                       │
│  ├── Point-in-time recovery capability                                         │
│  └── Cross-region backup storage                                               │
│                                                                                 │
│  Measurement:                                                                   │
│  ├── Backup success rate: 100%                                                 │
│  ├── Restore test success rate: 100%                                           │
│  └── Data corruption incidents: 0                                              │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 6. Integration SLOs

### 6.1 External System Availability

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│  SLO: INTEGRATION AVAILABILITY                                                  │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  Note: External system availability affects but doesn't break platform SLO     │
│                                                                                 │
│  Integration Hub SLO:                                                           │
│  ├── Availability: 99.5%                                                       │
│  ├── Webhook delivery success: 99%                                             │
│  └── Retry success (within 24h): 99.9%                                         │
│                                                                                 │
│  Per-Connector Targets (best effort):                                           │
│  ├── Salesforce: 99.9% (dependent on Salesforce SLA)                           │
│  ├── SAP: 99.5%                                                                │
│  ├── Stripe: 99.99% (Stripe's SLA)                                             │
│  └── Slack: 99.9%                                                              │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 7. Error Budget Policy

### 7.1 Error Budget Calculation

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│  ERROR BUDGET TRACKING                                                          │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  Monthly Error Budget (Availability):                                           │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │  SLO: 99.9%                                                              │   │
│  │  Error Budget: 0.1% = 43.2 minutes/month                                 │   │
│  │                                                                          │   │
│  │  Week 1: Used 5 minutes   → Remaining: 38.2 minutes (88%)               │   │
│  │  Week 2: Used 10 minutes  → Remaining: 28.2 minutes (65%)               │   │
│  │  Week 3: Used 3 minutes   → Remaining: 25.2 minutes (58%)               │   │
│  │  Week 4: Used 8 minutes   → Remaining: 17.2 minutes (40%)               │   │
│  │                                                                          │   │
│  │  Status: HEALTHY (40% remaining)                                         │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 7.2 Error Budget Actions

| Budget Remaining | Status | Actions |
|------------------|--------|---------|
| **> 50%** | HEALTHY | Normal development velocity |
| **25-50%** | CAUTION | Review recent deployments, increase testing |
| **10-25%** | WARNING | Freeze non-critical changes, focus on reliability |
| **< 10%** | CRITICAL | Freeze all changes except reliability fixes |
| **0%** | EXHAUSTED | Only emergency fixes, postmortem required |

### 7.3 Error Budget Policy

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│  ERROR BUDGET POLICY                                                            │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  When Error Budget is EXHAUSTED:                                                │
│                                                                                 │
│  1. All feature deployments frozen                                              │
│  2. Engineering focus shifts to reliability                                     │
│  3. Mandatory postmortem for incidents that consumed budget                     │
│  4. Action items must be completed before resuming features                     │
│  5. Weekly review with leadership until budget recovers to 25%                  │
│                                                                                 │
│  Exceptions (can deploy even with exhausted budget):                            │
│  ├── Security patches (critical/high severity)                                 │
│  ├── Bug fixes for data loss issues                                            │
│  └── Compliance-required changes                                               │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 8. SLO Dashboard

### 8.1 Key Metrics Display

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           SLO DASHBOARD                                         │
│                        (Real-time Display)                                      │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  AVAILABILITY (30-day rolling)                                                  │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │  Current: 99.94%    Target: 99.9%    Status: ✅ MEETING SLO             │   │
│  │  ████████████████████████████████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  │   │
│  │  Error Budget: 62% remaining (26.8 minutes)                             │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│  LATENCY P99 (24-hour rolling)                                                  │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │  Current: 287ms     Target: 500ms    Status: ✅ MEETING SLO             │   │
│  │  ████████████████████████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  │   │
│  │  Headroom: 42%                                                          │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│  ERROR RATE (24-hour rolling)                                                   │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │  Current: 0.03%     Target: 0.1%     Status: ✅ MEETING SLO             │   │
│  │  ███████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  │   │
│  │  Budget Used: 30%                                                       │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 8.2 Alerting Thresholds

| Metric | Warning | Critical | Page |
|--------|---------|----------|------|
| Availability | < 99.95% | < 99.9% | < 99.5% |
| Latency p99 | > 400ms | > 500ms | > 1000ms |
| Error Rate | > 0.05% | > 0.1% | > 1% |
| Error Budget | < 50% | < 25% | < 10% |

---

## 9. Reporting

### 9.1 Weekly SLO Report

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│  WEEKLY SLO REPORT                                                              │
│  Week of: [Date]                                                                │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  Executive Summary:                                                             │
│  ├── All SLOs: MET / NOT MET                                                   │
│  ├── Incidents: X (Severity breakdown)                                         │
│  └── Error Budget Status: X% remaining                                         │
│                                                                                 │
│  SLO Performance:                                                               │
│  ┌───────────────────┬──────────┬──────────┬──────────┐                        │
│  │ Metric            │ Target   │ Actual   │ Status   │                        │
│  ├───────────────────┼──────────┼──────────┼──────────┤                        │
│  │ Availability      │ 99.9%    │ 99.94%   │ ✅       │                        │
│  │ Latency p99       │ 500ms    │ 287ms    │ ✅       │                        │
│  │ Error Rate        │ 0.1%     │ 0.03%    │ ✅       │                        │
│  └───────────────────┴──────────┴──────────┴──────────┘                        │
│                                                                                 │
│  Incidents Impacting SLOs:                                                      │
│  ├── INC-001: [Description] - 5 minutes downtime                               │
│  └── INC-002: [Description] - 3 minutes elevated latency                       │
│                                                                                 │
│  Actions:                                                                       │
│  ├── [Action item from incidents]                                              │
│  └── [Proactive improvement]                                                   │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 9.2 Monthly SLO Review

- Generated automatically on 1st of each month
- Distributed to: Engineering, Product, Leadership
- Includes: Trend analysis, top incidents, improvement recommendations

---

## 10. Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0.0 | 2024 | Ops Team | Initial version |
