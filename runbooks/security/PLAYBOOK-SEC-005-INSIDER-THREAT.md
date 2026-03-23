# PLAYBOOK-SEC-005: Insider Threat Response

## Quick Reference

| Property | Value |
|----------|-------|
| **Playbook ID** | SEC-005 |
| **Severity** | SEV-1/SEV-2 |
| **Response Time** | Varies |
| **Owner** | Security Team + HR |
| **Legal Required** | Yes |
| **Confidentiality** | Restricted |

---

## 1. Important Notice

```
╔════════════════════════════════════════════════════════════════╗
║                    CONFIDENTIALITY WARNING                      ║
╠════════════════════════════════════════════════════════════════╣
║                                                                ║
║  This investigation MUST be conducted with:                    ║
║  • Strict need-to-know basis                                   ║
║  • HR and Legal involvement                                    ║
║  • Proper documentation                                        ║
║  • Employee rights consideration                               ║
║                                                                ║
║  DO NOT discuss with colleagues unless authorized.             ║
║  DO NOT confront the suspected individual.                     ║
║                                                                ║
╚════════════════════════════════════════════════════════════════╝
```

---

## 2. Trigger Conditions

This playbook is activated when:
- Unusual data access patterns by employee
- Data exfiltration indicators
- Unauthorized system access attempts
- Access outside normal working hours
- Access after termination notice
- Privilege escalation attempts
- Sensitive data downloads
- Reports from colleagues or managers
- DLP (Data Loss Prevention) alerts

---

## 3. Initial Assessment

### 3.1 Gather Context (Discreetly)

```bash
# DO NOT run these queries from a shared system
# Use a secure, isolated workstation

# 1. Identify the employee's role and access
psql -c "
SELECT
  u.id, u.email, u.name, u.role,
  u.department, u.manager_id, u.hire_date,
  u.last_login, u.created_at
FROM users u
WHERE u.id = '<employee_id>';
"

# 2. Review assigned permissions
psql -c "
SELECT permission, resource, granted_at, granted_by
FROM user_permissions
WHERE user_id = '<employee_id>';
"

# 3. Check for recent permission changes
psql -c "
SELECT *
FROM audit_logs
WHERE (user_id = '<employee_id>' OR target_user_id = '<employee_id>')
  AND action LIKE '%permission%'
ORDER BY created_at DESC;
"
```

### 3.2 Risk Assessment

| Factor | Low Risk | Medium Risk | High Risk |
|--------|----------|-------------|-----------|
| Access Level | Standard user | Power user | Admin |
| Data Sensitivity | Public | Internal | Confidential |
| Employment Status | Active | Notice period | Terminated |
| Historical Behavior | Clean | Minor issues | Previous incidents |
| Intent Indicators | Accidental | Unclear | Deliberate |

---

## 4. Investigation

### 4.1 Activity Analysis

```bash
# Run from isolated investigation workstation
# All queries logged to investigation record

# 1. Login patterns
psql -c "
SELECT
  date_trunc('hour', created_at) as hour,
  ip_address,
  location,
  device_type,
  success
FROM login_history
WHERE user_id = '<employee_id>'
  AND created_at > NOW() - INTERVAL '30 days'
ORDER BY created_at DESC;
"

# 2. Data access patterns
psql -c "
SELECT
  resource_type,
  action,
  date_trunc('day', created_at) as day,
  count(*) as access_count
FROM audit_logs
WHERE user_id = '<employee_id>'
  AND created_at > NOW() - INTERVAL '30 days'
GROUP BY resource_type, action, day
ORDER BY day DESC, access_count DESC;
"

# 3. Unusual access times
psql -c "
SELECT
  extract(dow from created_at) as day_of_week,
  extract(hour from created_at) as hour,
  count(*) as actions
FROM audit_logs
WHERE user_id = '<employee_id>'
  AND created_at > NOW() - INTERVAL '30 days'
GROUP BY day_of_week, hour
ORDER BY day_of_week, hour;
"

# 4. Large data exports/downloads
psql -c "
SELECT *
FROM audit_logs
WHERE user_id = '<employee_id>'
  AND action IN ('export', 'download', 'bulk_read')
  AND created_at > NOW() - INTERVAL '30 days'
ORDER BY created_at DESC;
"
```

### 4.2 Compare Against Baseline

```bash
# 1. Compare against peer group
psql -c "
WITH employee_activity AS (
  SELECT
    count(*) as total_actions,
    count(DISTINCT resource_id) as unique_resources,
    count(*) FILTER (WHERE action = 'download') as downloads
  FROM audit_logs
  WHERE user_id = '<employee_id>'
    AND created_at > NOW() - INTERVAL '30 days'
),
peer_avg AS (
  SELECT
    avg(count) as avg_actions,
    avg(resources) as avg_resources,
    avg(downloads) as avg_downloads
  FROM (
    SELECT
      user_id,
      count(*) as count,
      count(DISTINCT resource_id) as resources,
      count(*) FILTER (WHERE action = 'download') as downloads
    FROM audit_logs
    WHERE user_id IN (SELECT id FROM users WHERE department = '<employee_department>')
      AND created_at > NOW() - INTERVAL '30 days'
    GROUP BY user_id
  ) peer_data
)
SELECT
  e.*,
  p.*,
  e.total_actions / NULLIF(p.avg_actions, 0) as action_ratio,
  e.downloads / NULLIF(p.avg_downloads, 0) as download_ratio
FROM employee_activity e, peer_avg p;
"

# 2. Compare against own historical baseline
psql -c "
WITH current_period AS (
  SELECT count(*) as current_count
  FROM audit_logs
  WHERE user_id = '<employee_id>'
    AND created_at > NOW() - INTERVAL '7 days'
),
historical_avg AS (
  SELECT avg(weekly_count) as avg_count
  FROM (
    SELECT date_trunc('week', created_at), count(*) as weekly_count
    FROM audit_logs
    WHERE user_id = '<employee_id>'
      AND created_at BETWEEN NOW() - INTERVAL '90 days' AND NOW() - INTERVAL '7 days'
    GROUP BY 1
  ) weekly
)
SELECT
  c.current_count,
  h.avg_count,
  c.current_count / NULLIF(h.avg_count, 0) as deviation_ratio
FROM current_period c, historical_avg h;
"
```

---

## 5. Evidence Collection

### 5.1 Documentation Requirements

```markdown
INSIDER THREAT INVESTIGATION RECORD

Investigation ID: INT-YYYY-NNNN
Date Opened: YYYY-MM-DD
Lead Investigator: [Name]
HR Representative: [Name]
Legal Representative: [Name]

Subject:
- Employee ID: [ID]
- Name: [REDACTED until confirmed]
- Department: [Department]
- Role: [Role]

Reason for Investigation:
[Description of triggering event]

Evidence Collected:
1. [Evidence item] - Collected by: [Name] - Date: [Date]
2. ...

Chain of Custody:
| Item | Collected By | Date | Stored At | Access Log |
|------|--------------|------|-----------|------------|
| ... | ... | ... | ... | ... |
```

### 5.2 Evidence Preservation

```bash
# 1. Export relevant audit logs (encrypt immediately)
psql -c "COPY (SELECT * FROM audit_logs WHERE user_id = '<employee_id>' ORDER BY created_at) TO STDOUT WITH CSV HEADER;" | \
  gpg --encrypt --recipient security@ems.com > /secure/evidence/audit_logs_$INVESTIGATION_ID.csv.gpg

# 2. Preserve email metadata (if applicable)
# Coordinate with IT for email archive export

# 3. Preserve system access logs
kubectl logs -l user=<employee_id> --all-containers > /secure/evidence/system_logs_$INVESTIGATION_ID.txt

# 4. Create forensic image of workstation (if required)
# Coordinate with IT and Legal

# 5. Calculate hashes for all evidence
find /secure/evidence/ -type f -exec sha256sum {} \; > /secure/evidence/checksums.sha256
```

---

## 6. Response Actions

### 6.1 Immediate (If Active Threat)

```bash
# ONLY with HR and Legal approval

# 1. Disable account access
psql -c "UPDATE users SET status='suspended', suspended_reason='security_investigation' WHERE id='<employee_id>';"

# 2. Revoke all sessions
valkey-cli KEYS "session:<employee_id>:*" | xargs -r valkey-cli DEL

# 3. Revoke API keys
psql -c "UPDATE api_keys SET status='revoked' WHERE user_id='<employee_id>';"

# 4. Disable SSO access (if applicable)
# Coordinate with IdP administrator

# 5. Preserve email access for investigation
# Do not delete, disable delivery instead
```

### 6.2 Graduated Response

| Risk Level | Action | Approval Required |
|------------|--------|-------------------|
| Low | Enhanced monitoring | Security Lead |
| Medium | Access restrictions | Security + HR |
| High | Account suspension | Security + HR + Legal |
| Critical | Immediate termination | HR + Legal + Executive |

---

## 7. Coordination

### 7.1 Stakeholder Communication

```
NEED-TO-KNOW ONLY

Stakeholders to involve:
□ Security Team Lead (always)
□ HR Representative (always)
□ Legal Counsel (always)
□ Employee's Manager (case-by-case)
□ IT Operations (if system access needed)
□ Executive Sponsor (high-risk cases)

DO NOT involve:
□ Other team members
□ The employee's colleagues
□ Anyone without documented need-to-know
```

### 7.2 Meeting Protocol

- Use secure, private meeting rooms
- No electronic devices for non-participants
- Minutes taken by designated person only
- All materials labeled "CONFIDENTIAL - INVESTIGATION"

---

## 8. Legal Considerations

### 8.1 Employee Rights

- Right to privacy (within legal limits)
- Due process
- Protection from false accusations
- Access to representation (varies by jurisdiction)

### 8.2 Documentation for Legal

- Timeline of events
- Evidence chain of custody
- Interview records (if any)
- Policy violations documented
- Impact assessment

---

## 9. Resolution

### 9.1 If Threat Not Confirmed

```bash
# 1. Remove enhanced monitoring
# 2. Restore any restricted access
# 3. Document false positive for learning
# 4. Update detection rules to reduce false positives
# 5. Securely destroy investigation records (per policy)
```

### 9.2 If Threat Confirmed

```bash
# Work with HR and Legal

# 1. Preserve all evidence
# 2. Permanent access revocation
# 3. Exit interview (if applicable)
# 4. Legal action (if warranted)
# 5. Law enforcement referral (if criminal)
# 6. Insurance notification (if loss)
# 7. Regulatory notification (if data breach)
```

---

## 10. Post-Incident

### 10.1 Lessons Learned

- Could this have been prevented?
- Were warning signs missed?
- Are access controls adequate?
- Is monitoring sufficient?

### 10.2 Control Improvements

- [ ] Review access provisioning
- [ ] Enhance activity monitoring
- [ ] Update termination procedures
- [ ] Improve background checks
- [ ] Enhance security awareness training

---

## 11. Escalation

| Condition | Escalation |
|-----------|------------|
| Data exfiltration confirmed | Data Breach playbook |
| Criminal activity | Law enforcement + Legal |
| Ongoing threat | Immediate access revocation |
| Executive involved | Board notification |

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0.0 | 2024 | Security Team | Initial release |
