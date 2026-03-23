# PLAYBOOK-SEC-001: Data Breach Response

## Quick Reference

| Property | Value |
|----------|-------|
| **Playbook ID** | SEC-001 |
| **Severity** | SEV-1 (Critical) |
| **Response Time** | Immediate |
| **Owner** | Security Team |
| **Legal Required** | Yes |

---

## 1. Trigger Conditions

This playbook is activated when:
- Unauthorized access to customer/tenant data is confirmed
- Data exfiltration is detected
- Database dump or export is discovered outside authorized systems
- Third-party reports data exposure
- Data found on dark web/public internet

---

## 2. Immediate Actions (0-15 minutes)

### 2.1 Containment

```bash
# 1. DO NOT PANIC - Follow the playbook

# 2. Preserve evidence - DO NOT delete anything

# 3. Identify and isolate compromised systems
kubectl cordon <affected_node>
kubectl drain <affected_node> --ignore-daemonsets --delete-emptydir-data

# 4. Disable compromised accounts (DO NOT DELETE)
psql -c "UPDATE users SET status='suspended', suspended_reason='security_incident' WHERE id IN (...);"

# 5. Revoke all active sessions for affected users
valkey-cli KEYS "session:*" | xargs -r valkey-cli DEL

# 6. Block attacker IP (if identified)
curl -X POST "https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/firewall/rules" \
  -H "Authorization: Bearer ${CF_TOKEN}" \
  -d '{"action":"block","filter":{"expression":"ip.src eq <attacker_ip>"}}'
```

### 2.2 Notification

```
IMMEDIATELY NOTIFY:
□ Security Team Lead
□ Chief Information Security Officer (CISO)
□ Legal Counsel
□ CEO / Executive Team
□ Chief Privacy Officer (if applicable)

DO NOT NOTIFY YET:
□ Customers (wait for legal guidance)
□ Media (requires PR approval)
□ Regulators (72-hour window, but coordinate with legal)
```

---

## 3. Investigation (15 min - 4 hours)

### 3.1 Scope Assessment

```bash
# 1. Determine what data was accessed
psql -c "SELECT * FROM audit_logs WHERE action='data_access' AND created_at > '<incident_start_time>';"

# 2. Identify affected tenants
psql -c "SELECT DISTINCT tenant_id FROM audit_logs WHERE ... ORDER BY tenant_id;"

# 3. Count affected records
psql -c "SELECT table_name, count(*) FROM accessed_records GROUP BY table_name;"

# 4. Identify data types exposed
# - PII (names, emails, addresses)
# - Financial data (payment info)
# - Authentication data (password hashes)
# - Business data (documents, workflows)
```

### 3.2 Data Classification

| Data Type | Sensitivity | Regulatory Impact |
|-----------|-------------|-------------------|
| Email addresses | Medium | GDPR, CCPA |
| Full names | Medium | GDPR, CCPA |
| Phone numbers | Medium | GDPR, CCPA |
| Password hashes | High | All regulations |
| Payment card data | Critical | PCI DSS |
| Health information | Critical | HIPAA |
| Government IDs | Critical | UAE PDPL, GDPR |

### 3.3 Evidence Collection

```bash
# 1. Export audit logs
psql -c "COPY (SELECT * FROM audit_logs WHERE created_at > '<incident_start_time>') TO STDOUT WITH CSV HEADER;" > evidence/audit_$(date +%s).csv

# 2. Collect application logs
kubectl logs -l app=api-gateway -n ems-prod --since=24h > evidence/app_logs.txt

# 3. Collect network logs
kubectl logs -l app=ingress-nginx -n ingress-nginx --since=24h > evidence/network_logs.txt

# 4. Calculate file hashes for evidence integrity
sha256sum evidence/* > evidence/checksums.sha256

# 5. Create evidence manifest
echo "Evidence collected by: $(whoami)" > evidence/manifest.txt
echo "Date: $(date -Iseconds)" >> evidence/manifest.txt
echo "Incident ID: $INCIDENT_ID" >> evidence/manifest.txt
```

---

## 4. Root Cause Analysis

### 4.1 Common Breach Vectors

| Vector | Investigation Steps |
|--------|---------------------|
| **SQL Injection** | Review WAF logs, check for bypass patterns |
| **Compromised Credentials** | Check login patterns, credential age |
| **Insider Threat** | Review employee access logs, permission escalations |
| **Third-Party Breach** | Audit third-party access, review integration logs |
| **Misconfiguration** | Check access controls, API exposure |
| **Malware** | Scan systems, check for backdoors |

### 4.2 Attack Timeline Reconstruction

```markdown
| Time (UTC) | Event | Evidence |
|------------|-------|----------|
| YYYY-MM-DD HH:MM | Initial access | [Log reference] |
| YYYY-MM-DD HH:MM | Privilege escalation | [Log reference] |
| YYYY-MM-DD HH:MM | Data access | [Log reference] |
| YYYY-MM-DD HH:MM | Data exfiltration | [Log reference] |
| YYYY-MM-DD HH:MM | Detection | [Alert reference] |
```

---

## 5. Regulatory Compliance

### 5.1 Notification Requirements

| Regulation | Authority | Timeline | Threshold |
|------------|-----------|----------|-----------|
| **GDPR** | DPA (Data Protection Authority) | 72 hours | Any personal data breach |
| **UAE PDPL** | UAE Data Office | 72 hours | Personal data breach |
| **PCI DSS** | Card brands | 24 hours | Payment card data |
| **SOC 2** | Auditors | Varies | Documented breach |
| **CCPA** | CA Attorney General | 72 hours | 500+ CA residents |

### 5.2 Notification Templates

#### Regulatory Notification (GDPR)
```markdown
DATA BREACH NOTIFICATION

1. Nature of the personal data breach:
   [Description of what happened]

2. Categories and approximate number of data subjects:
   - Affected individuals: [NUMBER]
   - Categories: [Customers, Employees, etc.]

3. Categories and approximate number of records:
   - [Data type 1]: [COUNT]
   - [Data type 2]: [COUNT]

4. Likely consequences of the breach:
   [Assessment of potential harm]

5. Measures taken or proposed:
   [Mitigation steps]

6. Contact point for more information:
   Data Protection Officer
   Email: dpo@ems.com
   Phone: +1-xxx-xxx-xxxx
```

#### Customer Notification
```markdown
Subject: Important Security Notice

Dear [Customer Name],

We are writing to inform you of a security incident that may affect your data.

WHAT HAPPENED:
[Clear, factual description]

WHAT INFORMATION WAS INVOLVED:
[Types of data, NOT specific records]

WHAT WE ARE DOING:
- [Mitigation step 1]
- [Mitigation step 2]
- [Mitigation step 3]

WHAT YOU CAN DO:
- Change your password immediately
- Enable two-factor authentication
- Monitor your accounts for suspicious activity
- [Additional recommendations]

FOR MORE INFORMATION:
Contact our Security Team at security@ems.com

We sincerely apologize for any concern this may cause.

[Signature]
```

---

## 6. Remediation

### 6.1 Immediate Fixes

```bash
# 1. Patch vulnerability (if known)
# 2. Force password reset for affected users
psql -c "UPDATE users SET password_reset_required=true WHERE id IN (...);"

# 3. Rotate compromised credentials
# Database passwords
psql -c "ALTER USER app_user WITH PASSWORD '<new_password>';"

# API keys
kubectl create secret generic api-keys \
  --from-literal=api-key=$(openssl rand -hex 32) \
  -n ems-prod --dry-run=client -o yaml | kubectl apply -f -

# 4. Update WAF rules to block attack vector
# 5. Enable enhanced logging
```

### 6.2 Long-Term Fixes

- [ ] Security architecture review
- [ ] Penetration testing
- [ ] Enhanced monitoring implementation
- [ ] Security awareness training
- [ ] Incident response drill
- [ ] Third-party security audit

---

## 7. Communication Plan

### 7.1 Internal Communication

| Audience | Update Frequency | Channel |
|----------|------------------|---------|
| Incident Team | Every 30 min | War room / Slack |
| Executive Team | Every 2 hours | Email / Call |
| All Employees | Daily | Email |
| Board of Directors | As needed | Executive briefing |

### 7.2 External Communication

| Audience | Timeline | Channel | Approval |
|----------|----------|---------|----------|
| Regulators | Within 72h | Official channels | Legal |
| Affected Customers | After regulatory | Email | Legal + PR |
| All Customers | After affected | Blog / Email | Legal + PR |
| Media | As needed | Press release | CEO + PR |

---

## 8. Post-Incident

### 8.1 Documentation Requirements

- [ ] Incident timeline
- [ ] Root cause analysis
- [ ] Data impact assessment
- [ ] Remediation steps taken
- [ ] Regulatory notifications sent
- [ ] Customer notifications sent
- [ ] Lessons learned
- [ ] Recommended improvements

### 8.2 Post-Mortem Meeting

**Attendees:**
- Security Team
- Engineering Team
- Legal
- Compliance
- Executive sponsor

**Agenda:**
1. Incident timeline review
2. Root cause discussion
3. Response effectiveness
4. Gaps identified
5. Action items

---

## 9. Escalation Contacts

| Role | Name | Contact |
|------|------|---------|
| Security Lead | [Name] | security@ems.com |
| CISO | [Name] | [Phone] |
| Legal Counsel | [Name] | [Phone] |
| CEO | [Name] | [Phone] |
| External Forensics | [Firm] | [Phone] |
| Law Enforcement | [Contact] | [Phone] |

---

## 10. Related Playbooks

- [PLAYBOOK-SEC-002-ACCOUNT-COMPROMISE.md](PLAYBOOK-SEC-002-ACCOUNT-COMPROMISE.md)
- [PLAYBOOK-SEC-007-CREDENTIAL-LEAK.md](PLAYBOOK-SEC-007-CREDENTIAL-LEAK.md)

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0.0 | 2024 | Security Team | Initial release |
