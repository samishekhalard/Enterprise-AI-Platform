# RUNBOOK-004: Security Incident Response

## Quick Reference

| Property | Value |
|----------|-------|
| **Runbook ID** | RB-004 |
| **Severity** | SEV-1/SEV-2 |
| **On-Call Required** | Yes |
| **Security Team Required** | Yes |
| **Estimated Duration** | Variable |
| **Legal Notification** | May be required |

---

## 1. Overview

This runbook covers procedures for responding to security incidents including unauthorized access, data breaches, malware, and other security threats.

---

## 2. CRITICAL: First Actions

```
┌─────────────────────────────────────────────────────────────────┐
│              SECURITY INCIDENT FIRST ACTIONS                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. DO NOT PANIC - Follow this runbook                          │
│  2. DO NOT DELETE logs or evidence                              │
│  3. DO NOT ALERT the attacker (if ongoing)                      │
│  4. DO PAGE security team immediately                           │
│  5. DO DOCUMENT everything with timestamps                      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. Incident Categories

### 3.1 Classification Matrix

| Category | Description | Severity | Response Time |
|----------|-------------|----------|---------------|
| **Data Breach** | Confirmed data exfiltration | SEV-1 | Immediate |
| **Unauthorized Access** | Confirmed system compromise | SEV-1 | Immediate |
| **Credential Compromise** | Leaked/stolen credentials | SEV-1/SEV-2 | < 15 min |
| **Malware/Ransomware** | Malicious software detected | SEV-1 | Immediate |
| **DDoS Attack** | Service disruption attempt | SEV-2 | < 15 min |
| **Vulnerability Exploited** | Known CVE exploited | SEV-1/SEV-2 | < 30 min |
| **Suspicious Activity** | Unusual patterns detected | SEV-3 | < 2 hours |

---

## 4. Initial Response

### 4.1 Alert Security Team

```bash
# Page security on-call
# PagerDuty: "EMS Security" service

# Create secure incident channel
# Slack: #sec-incident-YYYYMMDD-XXXX (Private channel)

# Add only essential responders
```

### 4.2 Initial Assessment

```bash
# Gather initial information
# WHO: What systems/users affected?
# WHAT: What type of incident?
# WHEN: When did it start?
# WHERE: Which components affected?
# HOW: How was it detected?

# Document timeline
echo "$(date -u '+%Y-%m-%d %H:%M:%S UTC') - [EVENT]" >> incident_timeline.txt
```

---

## 5. Response Procedures by Category

### 5.1 Unauthorized Access Response

```bash
# 1. Identify compromised accounts
kubectl logs -l app=auth-service -n ems-prod | grep -i "failed\|unauthorized\|suspicious"

# 2. Check for privilege escalation
kubectl exec -it deploy/api-gateway -n ems-prod -- \
  psql "$DATABASE_URL" -c "SELECT * FROM audit_logs WHERE action='privilege_change' AND created_at > NOW() - INTERVAL '24 hours';"

# 3. Disable compromised accounts (DO NOT DELETE)
kubectl exec -it deploy/api-gateway -n ems-prod -- \
  psql "$DATABASE_URL" -c "UPDATE users SET status='suspended' WHERE id='<user_id>';"

# 4. Rotate affected credentials
kubectl exec -it deploy/api-gateway -n ems-prod -- \
  psql "$DATABASE_URL" -c "UPDATE users SET password_hash='LOCKED_PENDING_RESET' WHERE id='<user_id>';"

# 5. Review access logs for affected accounts
kubectl logs -l app=api-gateway -n ems-prod | grep "<user_id>"
```

### 5.2 Data Breach Response

```bash
# CRITICAL: Preserve all evidence first

# 1. Identify scope of breach
# What data was accessed?
# How many records?
# Which tenants affected?

# 2. Capture current state (DO NOT MODIFY)
kubectl exec -it deploy/api-gateway -n ems-prod -- \
  psql "$DATABASE_URL" -c "SELECT * FROM audit_logs WHERE created_at > NOW() - INTERVAL '7 days';" > /tmp/audit_export_$(date +%s).sql

# 3. Block attacker access (if identified)
# Add IP to WAF blocklist
aws wafv2 update-ip-set \
  --name "BlockedIPs" \
  --scope REGIONAL \
  --addresses <attacker_ip>/32

# 4. Notify legal team
# Follow legal escalation procedure

# 5. Prepare regulatory notification
# GDPR: 72 hours to DPA
# Document all findings
```

### 5.3 Credential Compromise Response

```bash
# 1. Identify leaked credentials
# Check: Have I Been Pwned, GitHub secret scanning, etc.

# 2. Immediately rotate affected credentials

# API Keys
kubectl create secret generic api-keys \
  --from-literal=api-key=$(openssl rand -hex 32) \
  -n ems-prod --dry-run=client -o yaml | kubectl apply -f -

# Database passwords
kubectl exec -it postgresql-0 -n ems-prod -- \
  psql -U postgres -c "ALTER USER app_user WITH PASSWORD 'NEW_SECURE_PASSWORD';"

# Update application secrets
kubectl patch secret db-credentials -n ems-prod \
  -p '{"stringData":{"password":"NEW_SECURE_PASSWORD"}}'

# 3. Restart affected services
kubectl rollout restart deployment -n ems-prod

# 4. Revoke active sessions
kubectl exec -it valkey-master-0 -n ems-prod -- \
  valkey-cli FLUSHDB  # Clears session cache
```

### 5.4 Malware/Ransomware Response

```bash
# CRITICAL: ISOLATE IMMEDIATELY

# 1. Network isolation
kubectl cordon <infected_node>
kubectl drain <infected_node> --ignore-daemonsets --delete-emptydir-data

# 2. Stop affected workloads
kubectl scale deployment/<affected_deployment> -n ems-prod --replicas=0

# 3. Preserve infected container for forensics
kubectl cp <pod>:/var/log ./forensics_$(date +%s)/
docker commit <container_id> forensics-image:$(date +%s)

# 4. Do NOT delete anything - preserve evidence

# 5. Scan all other nodes
kubectl get nodes -o jsonpath='{.items[*].metadata.name}' | xargs -I {} kubectl exec -it {} -- clamscan -r /

# 6. Restore from clean backup (after containment)
# See RUNBOOK-008-BACKUP-RESTORE.md
```

### 5.5 DDoS Attack Response

```bash
# 1. Enable DDoS protection mode
# Cloudflare: Under Attack Mode
curl -X PATCH "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/settings/security_level" \
  -H "Authorization: Bearer $CF_TOKEN" \
  -d '{"value":"under_attack"}'

# 2. Rate limit aggressive IPs
kubectl apply -f - <<EOF
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: emergency-rate-limit
  namespace: ems-prod
spec:
  podSelector:
    matchLabels:
      app: api-gateway
  ingress:
  - from:
    - ipBlock:
        cidr: 0.0.0.0/0
        except:
        - <attacker_cidr>
EOF

# 3. Scale up services
kubectl scale deployment/api-gateway -n ems-prod --replicas=20

# 4. Enable caching for static content
kubectl patch configmap nginx-config -n ems-prod \
  -p '{"data":{"cache_enabled":"true"}}'

# 5. Monitor attack patterns
kubectl logs -f -l app=api-gateway -n ems-prod | grep -E "$(date +%H:%M)"
```

---

## 6. Evidence Collection

### 6.1 What to Collect

```bash
# 1. System logs
kubectl logs -l app=api-gateway -n ems-prod --since=24h > evidence/api_logs_$(date +%s).txt
kubectl logs -l app=auth-service -n ems-prod --since=24h > evidence/auth_logs_$(date +%s).txt

# 2. Audit logs
kubectl exec -it deploy/api-gateway -n ems-prod -- \
  psql "$DATABASE_URL" -c "COPY (SELECT * FROM audit_logs WHERE created_at > NOW() - INTERVAL '7 days') TO STDOUT WITH CSV HEADER;" > evidence/audit_$(date +%s).csv

# 3. Network logs
kubectl logs -l app=ingress-nginx -n ingress-nginx --since=24h > evidence/network_$(date +%s).txt

# 4. WAF logs
aws wafv2 get-sampled-requests \
  --web-acl-arn $WAF_ARN \
  --rule-metric-name "ALL" \
  --scope REGIONAL \
  --time-window StartTime=$(date -d "24 hours ago" +%s),EndTime=$(date +%s) \
  --max-items 500 > evidence/waf_$(date +%s).json

# 5. CloudTrail (infrastructure actions)
aws cloudtrail lookup-events \
  --start-time $(date -d "7 days ago" -Iseconds) \
  --end-time $(date -Iseconds) > evidence/cloudtrail_$(date +%s).json
```

### 6.2 Chain of Custody

```markdown
# EVIDENCE CHAIN OF CUSTODY LOG

| Item ID | Description | Collected By | Date/Time | Hash (SHA256) |
|---------|-------------|--------------|-----------|---------------|
| E001 | API Gateway Logs | [Name] | [Timestamp] | [hash] |
| E002 | Audit Log Export | [Name] | [Timestamp] | [hash] |
| ... | ... | ... | ... | ... |

# Generate hash for evidence files
sha256sum evidence/* > evidence/checksums.sha256
```

---

## 7. Communication

### 7.1 Internal Communication

```markdown
## Security Incident Update - CONFIDENTIAL

**Incident ID**: SEC-YYYY-NNNN
**Severity**: SEV-X
**Status**: Active / Contained / Resolved

**Summary**: [Brief description]

**Impact**: [Systems/users affected]

**Current Actions**: [What is being done]

**Next Update**: [Time]

DO NOT SHARE outside incident response team.
```

### 7.2 External Communication

```markdown
## Security Notification Template

Dear [Customer/Partner],

We are writing to inform you of a security incident affecting [scope].

**What Happened**: [Brief factual description]

**What Information Was Involved**: [Types of data, NOT specific records]

**What We Are Doing**: [Actions taken]

**What You Can Do**: [Recommendations]

We apologize for any concern this may cause. Our team is working diligently
to resolve this matter and prevent future occurrences.

For questions: security@ems.com
```

---

## 8. Post-Incident

### 8.1 Immediate Actions

```bash
# 1. Confirm containment
# Verify no ongoing attack activity

# 2. Document lessons learned
# What worked, what didn't

# 3. Reset monitoring to normal
# Check all alerts cleared
```

### 8.2 Post-Mortem

Schedule within 72 hours:

1. Timeline reconstruction
2. Root cause analysis
3. Impact assessment
4. Remediation plan
5. Prevention measures

---

## 9. Regulatory Requirements

| Regulation | Requirement | Timeline |
|------------|-------------|----------|
| **GDPR** | Notify DPA | 72 hours |
| **GDPR** | Notify affected individuals | Without undue delay |
| **PCI DSS** | Report to card brands | 24 hours |
| **SOC 2** | Document incident | Immediately |
| **UAE PDPL** | Notify DPA UAE | 72 hours |

---

## 10. Escalation

| Condition | Action |
|-----------|--------|
| Confirmed data breach | Legal + Executive + PR |
| Active attack ongoing | All hands security |
| Regulatory notification required | Legal + Compliance |
| Customer data exposed | Customer Success + Legal |

---

## 11. Contacts

| Role | Contact |
|------|---------|
| Security On-Call | PagerDuty "Security" |
| Legal | legal@ems.com |
| PR/Communications | pr@ems.com |
| External Forensics | [Retainer contact] |
| Law Enforcement | [Local cybercrime unit] |

---

## 12. Related Runbooks

- [RUNBOOK-001-HEALTH-CHECK.md](RUNBOOK-001-HEALTH-CHECK.md) - System health
- [RUNBOOK-008-BACKUP-RESTORE.md](RUNBOOK-008-BACKUP-RESTORE.md) - Restore from backup

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0.0 | 2024 | Security Team | Initial release |
