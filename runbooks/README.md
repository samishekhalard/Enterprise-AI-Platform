# Runbooks

Operational documentation for the EMS platform.

## Structure

```
runbooks/
├── operations/      # Operational runbooks, DR, backup, SLOs
└── security/        # Security playbooks and incident response
```

## Operations

| Runbook | Purpose |
|---------|---------|
| [RUNBOOK-001](operations/RUNBOOK-001-HEALTH-CHECK.md) | Health check procedures |
| [RUNBOOK-002](operations/RUNBOOK-002-DB-FAILOVER.md) | Database failover |
| [RUNBOOK-003](operations/RUNBOOK-003-SERVICE-RECOVERY.md) | Service recovery |
| [RUNBOOK-004](operations/RUNBOOK-004-SECURITY-RESPONSE.md) | Security response |
| [RUNBOOK-005](operations/RUNBOOK-005-CACHE-ISSUES.md) | Cache issues |
| [RUNBOOK-006](operations/RUNBOOK-006-DEPLOYMENT-ROLLBACK.md) | Deployment rollback |
| [RUNBOOK-007](operations/RUNBOOK-007-PERFORMANCE-ISSUES.md) | Performance issues |
| [RUNBOOK-008](operations/RUNBOOK-008-BACKUP-RESTORE.md) | Backup restore |
| [RUNBOOK-009](operations/RUNBOOK-009-BACKUP-FAILURE.md) | Backup failure |
| [RUNBOOK-010](operations/RUNBOOK-010-TENANT-OPERATIONS.md) | Tenant operations |

### Plans & Strategies

- [Backup Strategy](operations/BACKUP-STRATEGY.md)
- [Disaster Recovery Plan](operations/DISASTER-RECOVERY-PLAN.md)
- [Incident Response Plan](operations/INCIDENT-RESPONSE-PLAN.md)
- [SLO Definitions](operations/SLO-DEFINITIONS.md)

## Security Playbooks

| Playbook | Incident Type |
|----------|---------------|
| [SEC-001](security/PLAYBOOK-SEC-001-DATA-BREACH.md) | Data breach |
| [SEC-002](security/PLAYBOOK-SEC-002-ACCOUNT-COMPROMISE.md) | Account compromise |
| [SEC-003](security/PLAYBOOK-SEC-003-MALWARE-DETECTION.md) | Malware detection |
| [SEC-004](security/PLAYBOOK-SEC-004-API-ABUSE.md) | API abuse |
| [SEC-005](security/PLAYBOOK-SEC-005-INSIDER-THREAT.md) | Insider threat |
| [SEC-006](security/PLAYBOOK-SEC-006-THIRD-PARTY-BREACH.md) | Third-party breach |
| [SEC-007](security/PLAYBOOK-SEC-007-CREDENTIAL-LEAK.md) | Credential leak |

### Security Configuration

- [WAF Configuration](security/WAF-CONFIGURATION.md)
- [DDoS Protection](security/DDOS-PROTECTION.md)
- [DAST Integration](security/DAST-INTEGRATION.md)
