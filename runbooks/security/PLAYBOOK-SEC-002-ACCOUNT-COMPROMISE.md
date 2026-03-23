# PLAYBOOK-SEC-002: Account Compromise Response

## Quick Reference

| Property | Value |
|----------|-------|
| **Playbook ID** | SEC-002 |
| **Severity** | SEV-1/SEV-2 |
| **Response Time** | 15 minutes |
| **Owner** | Security Team |

---

## 1. Trigger Conditions

This playbook is activated when:
- Suspicious login detected (unusual location, device, time)
- Multiple failed authentication attempts followed by success
- Account activity anomalies reported
- User reports unauthorized access
- Credential stuffing attack detected
- MFA bypass detected

---

## 2. Immediate Actions (0-15 minutes)

### 2.1 Account Lockdown

```bash
# 1. Suspend the compromised account
psql -c "UPDATE users SET status='suspended', suspended_at=NOW(), suspended_reason='potential_compromise' WHERE id='<user_id>';"

# 2. Invalidate all sessions
valkey-cli KEYS "session:<user_id>:*" | xargs -r valkey-cli DEL

# 3. Revoke all refresh tokens
psql -c "DELETE FROM refresh_tokens WHERE user_id='<user_id>';"

# 4. Revoke API keys
psql -c "UPDATE api_keys SET status='revoked', revoked_at=NOW() WHERE user_id='<user_id>';"

# 5. Document lockdown time
echo "$(date -Iseconds) - Account <user_id> locked by <responder>" >> /var/log/security/account_lockdowns.log
```

### 2.2 Notification

```bash
# Notify security team
curl -X POST https://hooks.slack.com/services/xxx \
  -d '{"channel":"#security-alerts","text":"ACCOUNT COMPROMISE: User <user_id> locked. Initiating investigation."}'

# If admin account: Escalate immediately
if is_admin_account; then
  pagerduty_alert "CRITICAL: Admin account compromise detected"
fi
```

---

## 3. Investigation

### 3.1 Gather Account Activity

```bash
# 1. Recent login history
psql -c "SELECT * FROM login_history WHERE user_id='<user_id>' ORDER BY created_at DESC LIMIT 50;"

# 2. IP addresses and locations
psql -c "SELECT ip_address, country, city, user_agent, created_at FROM login_history WHERE user_id='<user_id>' AND created_at > NOW() - INTERVAL '7 days';"

# 3. Recent actions
psql -c "SELECT * FROM audit_logs WHERE user_id='<user_id>' AND created_at > NOW() - INTERVAL '24 hours' ORDER BY created_at;"

# 4. Permission changes
psql -c "SELECT * FROM audit_logs WHERE action LIKE '%permission%' AND (user_id='<user_id>' OR target_user_id='<user_id>');"

# 5. Data access patterns
psql -c "SELECT resource_type, action, count(*) FROM audit_logs WHERE user_id='<user_id>' AND created_at > NOW() - INTERVAL '24 hours' GROUP BY resource_type, action;"
```

### 3.2 Identify Compromise Indicators

| Indicator | Check | Severity |
|-----------|-------|----------|
| Login from new country | Geo-IP analysis | High |
| Login from impossible travel | Time/distance check | Critical |
| Multiple IPs in session | Session analysis | High |
| Unusual hours | Time pattern analysis | Medium |
| Bulk data access | Action frequency | High |
| Permission escalation | Audit log review | Critical |
| New API keys created | API key audit | High |

### 3.3 Determine Compromise Scope

```bash
# 1. What tenant does this user belong to?
psql -c "SELECT tenant_id, role, permissions FROM users WHERE id='<user_id>';"

# 2. What data could they access?
psql -c "SELECT * FROM role_permissions WHERE role_id IN (SELECT role_id FROM user_roles WHERE user_id='<user_id>');"

# 3. What did they actually access?
psql -c "SELECT DISTINCT resource_type, resource_id FROM audit_logs WHERE user_id='<user_id>' AND created_at > '<compromise_start_time>';"

# 4. Did they create any backdoors?
psql -c "SELECT * FROM api_keys WHERE created_by='<user_id>';"
psql -c "SELECT * FROM webhooks WHERE created_by='<user_id>';"
psql -c "SELECT * FROM integrations WHERE created_by='<user_id>';"
```

---

## 4. Containment

### 4.1 If Credential Stuffing Attack

```bash
# 1. Enable enhanced CAPTCHA
kubectl set env deployment/api-gateway -n ems-prod \
  AUTH_CAPTCHA_THRESHOLD=3

# 2. Increase rate limiting
kubectl patch configmap rate-limit-config -n ems-prod \
  -p '{"data":{"login_rpm":"5","login_block_duration":"30m"}}'

# 3. Block known attack IPs
for ip in $(cat attack_ips.txt); do
  curl -X POST "https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/firewall/rules" \
    -H "Authorization: Bearer ${CF_TOKEN}" \
    -d "{\"action\":\"block\",\"filter\":{\"expression\":\"ip.src eq $ip\"}}"
done

# 4. Identify other potentially compromised accounts
psql -c "SELECT user_id FROM login_history WHERE ip_address IN (SELECT ip_address FROM login_history WHERE user_id='<compromised_user_id>') AND user_id != '<compromised_user_id>';"
```

### 4.2 If Admin Account

```bash
# CRITICAL: Admin compromise requires additional steps

# 1. Audit all admin actions
psql -c "SELECT * FROM audit_logs WHERE user_id='<admin_id>' ORDER BY created_at DESC;"

# 2. Check for created accounts
psql -c "SELECT * FROM users WHERE created_by='<admin_id>';"

# 3. Check for permission grants
psql -c "SELECT * FROM audit_logs WHERE action='grant_permission' AND user_id='<admin_id>';"

# 4. Review system configuration changes
psql -c "SELECT * FROM config_changes WHERE changed_by='<admin_id>';"

# 5. Consider rotating all admin credentials
# This requires executive approval
```

---

## 5. Remediation

### 5.1 For the Compromised Account

```bash
# 1. Force password reset
psql -c "UPDATE users SET password_hash=NULL, password_reset_required=true, password_reset_token='$(openssl rand -hex 32)' WHERE id='<user_id>';"

# 2. Reset MFA
psql -c "UPDATE users SET mfa_enabled=false, mfa_secret=NULL WHERE id='<user_id>';"

# 3. Notify user via secure channel
send_email("<user_email>", "Account Security Alert", "
Your account was secured due to suspicious activity.
Please reset your password: https://ems.com/reset?token=<token>
After password reset, please enable MFA.
")

# 4. Document remediation
log_remediation("Account <user_id> password reset required, MFA reset, user notified.")
```

### 5.2 For Related Accounts

```bash
# 1. If credentials were reused (check against breach databases)
# Force password reset for similar accounts

# 2. If same IP accessed other accounts
psql -c "SELECT DISTINCT user_id FROM login_history WHERE ip_address='<attacker_ip>';"
# Review each account for suspicious activity

# 3. If part of tenant, review tenant-wide access
psql -c "SELECT * FROM users WHERE tenant_id='<affected_tenant_id>' AND role IN ('admin', 'owner');"
```

---

## 6. User Communication

### 6.1 Initial Notification

```markdown
Subject: Important Security Notice - Action Required

Dear [User Name],

We detected unusual activity on your EMS account and have temporarily secured it as a precaution.

WHAT HAPPENED:
We observed login activity that did not match your normal patterns.

WHAT WE DID:
Your account has been secured and all active sessions have been terminated.

WHAT YOU NEED TO DO:
1. Reset your password using this link: [LINK]
2. Enable two-factor authentication
3. Review your recent account activity
4. If you recognize the activity as your own, you can ignore this notice

If you have any questions, please contact security@ems.com

Thank you for your understanding.

EMS Security Team
```

### 6.2 If Unauthorized Access Confirmed

```markdown
Subject: Unauthorized Access to Your Account - Important Information

Dear [User Name],

We confirmed that unauthorized access occurred on your EMS account.

WHAT HAPPENED:
On [DATE], an unauthorized party accessed your account from [LOCATION].

WHAT THEY ACCESSED:
Based on our investigation, the following was accessed:
- [Data type 1]
- [Data type 2]

WHAT WE'VE DONE:
1. Secured your account
2. Revoked all access tokens
3. Terminated all sessions

WHAT YOU SHOULD DO:
1. Reset your password immediately
2. Enable two-factor authentication
3. If you used this password elsewhere, change it there too
4. Monitor your accounts for suspicious activity

We apologize for any inconvenience and are here to help.

EMS Security Team
```

---

## 7. Post-Incident

### 7.1 Account Restoration

```bash
# 1. After user resets password and enables MFA
psql -c "UPDATE users SET status='active', suspended_at=NULL, suspended_reason=NULL WHERE id='<user_id>';"

# 2. Monitor account for 30 days
psql -c "INSERT INTO account_monitoring (user_id, start_date, end_date, reason) VALUES ('<user_id>', NOW(), NOW() + INTERVAL '30 days', 'post_compromise_monitoring');"

# 3. Enhanced logging for this account
# Application will check account_monitoring table and log more details
```

### 7.2 Lessons Learned

- Was MFA enabled? If not, why?
- How was the credential compromised?
- Could detection have been faster?
- Were response procedures followed?

---

## 8. Escalation Matrix

| Condition | Escalation |
|-----------|------------|
| Admin account | CISO + CEO |
| Multiple accounts | Security Lead |
| Data exfiltration | Data Breach playbook |
| Ongoing attack | Enable Under Attack mode |

---

## 9. Related Playbooks

- [PLAYBOOK-SEC-001-DATA-BREACH.md](PLAYBOOK-SEC-001-DATA-BREACH.md)
- [PLAYBOOK-SEC-007-CREDENTIAL-LEAK.md](PLAYBOOK-SEC-007-CREDENTIAL-LEAK.md)

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0.0 | 2024 | Security Team | Initial release |
