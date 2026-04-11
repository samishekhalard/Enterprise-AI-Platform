# EMS Disaster Recovery Plan

**Document Version:** 1.0.0
**Last Updated:** 2024
**Classification:** Confidential
**Owner:** Operations Team

---

```
╔═══════════════════════════════════════════════════════════════════════════════╗
║                    DISASTER RECOVERY PLAN                                     ║
║                                                                               ║
║                    RPO: 1 Hour | RTO: 4 Hours                                 ║
║                    Status: APPROVED                                           ║
╚═══════════════════════════════════════════════════════════════════════════════╝
```

---

## 1. Executive Summary

This Disaster Recovery Plan (DRP) outlines procedures for recovering EMS services following a disaster or major incident. The plan ensures business continuity and minimizes data loss.

### Recovery Objectives

| Objective | Target | Maximum Tolerable |
|-----------|--------|-------------------|
| **RPO** (Recovery Point Objective) | 1 hour | 4 hours |
| **RTO** (Recovery Time Objective) | 4 hours | 8 hours |
| **MTPD** (Max Tolerable Period of Disruption) | 24 hours | 48 hours |

### Scope

This plan covers:
- Application services (Frontend, Backend, Keycloak)
- Database systems (PostgreSQL per tenant)
- Cache layer (Valkey cluster)
- Integration services
- Monitoring and observability

---

## 2. Disaster Classification

### Severity Levels

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│  Level    │ Description                    │ RTO      │ Activation             │
├───────────┼────────────────────────────────┼──────────┼────────────────────────┤
│  LEVEL 1  │ Complete site failure          │ 4 hours  │ Automatic + Manual     │
│  (Critical)│ Data center outage            │          │ DR Team Lead           │
│           │ Region-wide disaster           │          │                        │
├───────────┼────────────────────────────────┼──────────┼────────────────────────┤
│  LEVEL 2  │ Major service degradation      │ 2 hours  │ On-call Engineer       │
│  (Major)  │ Database primary failure       │          │                        │
│           │ Cache cluster failure          │          │                        │
├───────────┼────────────────────────────────┼──────────┼────────────────────────┤
│  LEVEL 3  │ Single service failure         │ 1 hour   │ On-call Engineer       │
│  (Minor)  │ Single node failure            │          │                        │
│           │ Network partition              │          │                        │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Infrastructure Architecture

### Primary and DR Sites

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              DR ARCHITECTURE                                    │
└─────────────────────────────────────────────────────────────────────────────────┘

                    PRIMARY REGION (UAE)              DR REGION (EU)
                    ════════════════════              ═══════════════

                    ┌─────────────────┐              ┌─────────────────┐
                    │   ACTIVE        │              │   STANDBY       │
                    │                 │              │   (Warm)        │
    Users ─────────▶│  Load Balancer  │              │  Load Balancer  │
                    │                 │              │                 │
                    └────────┬────────┘              └────────┬────────┘
                             │                                │
                    ┌────────┴────────┐              ┌────────┴────────┐
                    │   Kubernetes    │              │   Kubernetes    │
                    │   Cluster       │              │   Cluster       │
                    │                 │              │   (Scaled down) │
                    │  • Frontend x3  │              │  • Frontend x1  │
                    │  • Backend x5   │              │  • Backend x2   │
                    │  • Keycloak x2  │              │  • Keycloak x1  │
                    └────────┬────────┘              └────────┬────────┘
                             │                                │
                    ┌────────┴────────┐              ┌────────┴────────┐
                    │   PostgreSQL    │──── Async ──▶│   PostgreSQL    │
                    │   Primary       │  Replication │   Replica       │
                    │                 │   (< 1 min)  │                 │
                    └────────┬────────┘              └────────┬────────┘
                             │                                │
                    ┌────────┴────────┐              ┌────────┴────────┐
                    │   Valkey        │──── Async ──▶│   Valkey        │
                    │   Cluster       │  Replication │   Replica       │
                    └─────────────────┘              └─────────────────┘

REPLICATION:
├── Database: Streaming replication (async, < 1 minute lag)
├── Cache: Cross-region replication (async, < 5 minute lag)
├── Files: S3 cross-region replication
└── Secrets: Vault replication
```

---

## 4. Backup Strategy

### Backup Schedule

| Component | Type | Frequency | Retention | Location |
|-----------|------|-----------|-----------|----------|
| **System Database** | Full | Daily 02:00 UTC | 30 days | S3 (cross-region) |
| **System Database** | Incremental | Hourly | 7 days | S3 (cross-region) |
| **System Database** | WAL Archive | Continuous | 7 days | S3 (cross-region) |
| **Tenant Databases** | Full | Daily 03:00 UTC | 30 days | S3 (cross-region) |
| **Tenant Databases** | Incremental | Hourly | 7 days | S3 (cross-region) |
| **Keycloak DB** | Full | Daily 04:00 UTC | 30 days | S3 (cross-region) |
| **Valkey** | RDB Snapshot | Every 6 hours | 7 days | S3 (cross-region) |
| **Configuration** | Git | On change | Forever | GitHub |
| **Secrets** | Vault Snapshot | Daily | 30 days | Encrypted S3 |

### Backup Verification

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│  BACKUP VERIFICATION SCHEDULE                                                   │
├─────────────────────────────────────────────────────────────────────────────────┤
│  Daily:    Automated backup integrity check (checksum validation)              │
│  Weekly:   Automated restore test to isolated environment                      │
│  Monthly:  Full restore drill with data validation                             │
│  Quarterly: Complete DR drill (see Section 9)                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 5. Recovery Procedures

### 5.1 Level 1: Complete Site Failure

**Trigger:** Primary region completely unavailable

**Procedure:**

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│  STEP 1: ASSESSMENT (0-15 minutes)                                             │
├─────────────────────────────────────────────────────────────────────────────────┤
│  □ Confirm primary region failure (not false alarm)                            │
│  □ Check monitoring dashboards for scope                                       │
│  □ Verify DR region health                                                     │
│  □ Notify DR Team Lead                                                         │
│  □ Decision: Activate DR? (DR Team Lead approval required)                     │
└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────┐
│  STEP 2: DR ACTIVATION (15-60 minutes)                                         │
├─────────────────────────────────────────────────────────────────────────────────┤
│  □ Run DR activation script:                                                   │
│    $ ./scripts/dr-activate.sh --region=eu --level=1                           │
│                                                                                 │
│  □ Scale up DR Kubernetes cluster:                                             │
│    $ kubectl scale deployment --all --replicas=3 -n ems                   │
│                                                                                 │
│  □ Promote database replicas to primary:                                       │
│    $ ./scripts/db-promote.sh --target=dr-primary                              │
│                                                                                 │
│  □ Update DNS to point to DR region:                                           │
│    $ ./scripts/dns-failover.sh --to=eu                                        │
│                                                                                 │
│  □ Verify Keycloak realm is accessible                                         │
│  □ Verify cache connectivity                                                   │
└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────┐
│  STEP 3: VALIDATION (60-120 minutes)                                           │
├─────────────────────────────────────────────────────────────────────────────────┤
│  □ Run health checks:                                                          │
│    $ ./scripts/health-check.sh --full                                         │
│                                                                                 │
│  □ Verify tenant database connectivity (sample 10%)                            │
│  □ Test authentication flow                                                    │
│  □ Test critical API endpoints                                                 │
│  □ Verify integration hub connectivity                                         │
│  □ Check monitoring/alerting is functional                                     │
└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────┐
│  STEP 4: COMMUNICATION (Throughout)                                            │
├─────────────────────────────────────────────────────────────────────────────────┤
│  □ Update status page: https://status.ems.com                              │
│  □ Send customer notification (template: DR-NOTIFY-001)                        │
│  □ Internal Slack: #incidents channel                                          │
│  □ Executive briefing (if > 2 hours)                                           │
└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────┐
│  STEP 5: STABILIZATION (120-240 minutes)                                       │
├─────────────────────────────────────────────────────────────────────────────────┤
│  □ Monitor error rates                                                         │
│  □ Scale services based on load                                                │
│  □ Address any data inconsistencies                                            │
│  □ Confirm all tenants operational                                             │
│  □ Update status page: "Operating from DR site"                                │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 5.2 Level 2: Database Primary Failure

**Trigger:** PostgreSQL primary node failure

**Procedure:**

```bash
# Automatic failover (Patroni)
# 1. Patroni detects primary failure
# 2. Leader election among replicas
# 3. New primary promoted automatically
# 4. Application reconnects via PgBouncer

# Manual intervention (if automatic fails):
$ ./scripts/db-manual-failover.sh --cluster=system-db
$ ./scripts/db-manual-failover.sh --cluster=tenant-dbs

# Verify:
$ ./scripts/db-verify-replication.sh
```

### 5.3 Level 3: Single Service Failure

**Trigger:** Pod crash, node failure

**Procedure:**

```bash
# Kubernetes handles automatically via:
# - Pod restart (restartPolicy: Always)
# - Node replacement (cluster autoscaler)
# - Service mesh retry (if enabled)

# Manual intervention:
$ kubectl rollout restart deployment/ems-backend -n ems
$ kubectl rollout status deployment/ems-backend -n ems
```

---

## 6. Failback Procedures

### After Primary Region Recovery

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│  FAILBACK PROCEDURE (Planned - 4-8 hours)                                      │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  PHASE 1: PREPARE PRIMARY (1-2 hours)                                          │
│  ──────────────────────────────────────                                        │
│  □ Verify primary region infrastructure healthy                                │
│  □ Restore database from DR to primary (if needed)                             │
│  □ Verify data consistency                                                     │
│  □ Run health checks on primary                                                │
│                                                                                 │
│  PHASE 2: SYNC DATA (1-2 hours)                                                │
│  ──────────────────────────────────                                            │
│  □ Enable reverse replication (DR → Primary)                                   │
│  □ Wait for replication lag to reach 0                                         │
│  □ Take final backup of DR                                                     │
│                                                                                 │
│  PHASE 3: CUTOVER (30-60 minutes)                                              │
│  ─────────────────────────────────                                             │
│  □ Announce maintenance window                                                 │
│  □ Put system in read-only mode (5 minutes)                                    │
│  □ Final sync                                                                  │
│  □ Promote primary database                                                    │
│  □ Update DNS to primary                                                       │
│  □ Verify all services                                                         │
│  □ Scale down DR region                                                        │
│                                                                                 │
│  PHASE 4: VALIDATION (1-2 hours)                                               │
│  ───────────────────────────────                                               │
│  □ Monitor error rates for 2 hours                                             │
│  □ Verify all tenants operational                                              │
│  □ Re-establish DR replication                                                 │
│  □ Update status page                                                          │
│  □ Close incident                                                              │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 7. Communication Plan

### Notification Matrix

| Audience | Channel | Template | Timing |
|----------|---------|----------|--------|
| Customers | Email + Status Page | DR-NOTIFY-001 | Within 15 min |
| Internal Team | Slack #incidents | DR-INTERNAL-001 | Immediately |
| Executives | Email + Call | DR-EXEC-001 | Within 30 min |
| Partners | Email | DR-PARTNER-001 | Within 1 hour |

### Status Page Updates

```
URL: https://status.ems.com

Update Frequency:
├── During incident: Every 15 minutes
├── After resolution: Within 30 minutes
└── Post-mortem: Within 48 hours
```

### Communication Templates

**DR-NOTIFY-001 (Customer Notification):**
```
Subject: [EMS] Service Disruption - Recovery in Progress

Dear Customer,

We are currently experiencing a service disruption affecting EMS.

Status: Recovery in progress
Impact: [Description of affected services]
Estimated Resolution: [Time estimate]

We are actively working to restore full service. Updates will be posted to:
https://status.ems.com

We apologize for any inconvenience.

EMS Operations Team
```

---

## 8. Roles and Responsibilities

### DR Team Structure

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              DR TEAM                                            │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  DR Team Lead (Incident Commander)                                              │
│  ├── Primary: [Name] - [Phone] - [Email]                                       │
│  └── Backup:  [Name] - [Phone] - [Email]                                       │
│                                                                                 │
│  Database Administrator                                                         │
│  ├── Primary: [Name] - [Phone] - [Email]                                       │
│  └── Backup:  [Name] - [Phone] - [Email]                                       │
│                                                                                 │
│  Infrastructure Engineer                                                        │
│  ├── Primary: [Name] - [Phone] - [Email]                                       │
│  └── Backup:  [Name] - [Phone] - [Email]                                       │
│                                                                                 │
│  Application Engineer                                                           │
│  ├── Primary: [Name] - [Phone] - [Email]                                       │
│  └── Backup:  [Name] - [Phone] - [Email]                                       │
│                                                                                 │
│  Communications Lead                                                            │
│  ├── Primary: [Name] - [Phone] - [Email]                                       │
│  └── Backup:  [Name] - [Phone] - [Email]                                       │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Responsibilities

| Role | Responsibilities |
|------|-----------------|
| **DR Team Lead** | Declare DR, coordinate recovery, make decisions, communicate with executives |
| **DBA** | Database failover, data integrity, backup restoration |
| **Infrastructure** | Network, DNS, Kubernetes, load balancers |
| **Application** | Service health, API verification, integration testing |
| **Communications** | Status page, customer notifications, internal updates |

---

## 9. Testing and Drills

### DR Test Schedule

| Test Type | Frequency | Duration | Scope |
|-----------|-----------|----------|-------|
| **Backup Restore** | Weekly | 2 hours | Automated |
| **Component Failover** | Monthly | 4 hours | Single component |
| **Partial DR** | Quarterly | 8 hours | Full application, subset of tenants |
| **Full DR Drill** | Annually | 24 hours | Complete failover to DR |

### Drill Checklist

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│  QUARTERLY DR DRILL CHECKLIST                                                   │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  PRE-DRILL:                                                                     │
│  □ Schedule maintenance window                                                 │
│  □ Notify affected tenants (drill tenants only)                                │
│  □ Prepare rollback plan                                                       │
│  □ Assign roles                                                                │
│                                                                                 │
│  DRILL EXECUTION:                                                               │
│  □ Simulate primary failure                                                    │
│  □ Execute DR activation                                                       │
│  □ Verify RTO met                                                              │
│  □ Verify RPO met (check data loss)                                            │
│  □ Test all critical functions                                                 │
│  □ Execute failback                                                            │
│                                                                                 │
│  POST-DRILL:                                                                    │
│  □ Document lessons learned                                                    │
│  □ Update procedures if needed                                                 │
│  □ File drill report                                                           │
│  □ Schedule remediation items                                                  │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 10. Recovery Scripts

### Script Inventory

| Script | Purpose | Location |
|--------|---------|----------|
| `dr-activate.sh` | Activate DR site | `/scripts/dr/` |
| `dr-deactivate.sh` | Return to primary | `/scripts/dr/` |
| `db-promote.sh` | Promote DB replica | `/scripts/db/` |
| `db-manual-failover.sh` | Manual DB failover | `/scripts/db/` |
| `dns-failover.sh` | Switch DNS to DR | `/scripts/dns/` |
| `health-check.sh` | Full system health check | `/scripts/monitoring/` |
| `backup-verify.sh` | Verify backup integrity | `/scripts/backup/` |
| `restore-tenant.sh` | Restore single tenant | `/scripts/restore/` |

---

## 11. Appendix

### A. Contact Information

```
EMERGENCY CONTACTS:
├── Cloud Provider Support: [Provider hotline]
├── DNS Provider Support: [Provider hotline]
├── Security Team: security@ems.com
└── Executive On-call: [Phone number]
```

### B. External Dependencies

| Service | Provider | Support Contact | SLA |
|---------|----------|-----------------|-----|
| Cloud (Primary) | AWS/Azure/GCP | [Contact] | 99.99% |
| Cloud (DR) | AWS/Azure/GCP | [Contact] | 99.99% |
| DNS | Cloudflare | [Contact] | 100% |
| Monitoring | Datadog/Grafana | [Contact] | 99.9% |

### C. Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0.0 | 2024 | Ops Team | Initial version |

---

**Document Approval:**

| Role | Name | Signature | Date |
|------|------|-----------|------|
| CTO | | | |
| VP Engineering | | | |
| Security Officer | | | |
