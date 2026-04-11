# PLAYBOOK-SEC-006: Third-Party Breach Response

## Quick Reference

| Property | Value |
|----------|-------|
| **Playbook ID** | SEC-006 |
| **Severity** | SEV-2/SEV-3 |
| **Response Time** | 4 hours |
| **Owner** | Security Team |
| **Vendor Management** | Required |

---

## 1. Trigger Conditions

This playbook is activated when:
- Third-party vendor reports a breach
- News of vendor breach affecting our data
- Vendor security advisory published
- Integration partner compromise detected
- SaaS provider outage with security concerns
- Supply chain attack suspected

---

## 2. Third-Party Inventory

### 2.1 Critical Third-Parties

| Category | Vendor | Data Shared | Integration Type |
|----------|--------|-------------|------------------|
| **Cloud Infrastructure** | AWS/Azure | All | API + Console |
| **Identity** | Keycloak | User data | OIDC |
| **Payment** | Stripe | Payment data | API |
| **Email** | SendGrid | Email addresses | API |
| **Monitoring** | Datadog | Logs, metrics | Agent |
| **CDN** | Cloudflare | Traffic data | DNS + Proxy |

### 2.2 Integration Types

```
┌─────────────────────────────────────────────────────────────────┐
│                  THIRD-PARTY INTEGRATION MAP                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────┐                                           │
│  │   EMS       │                                           │
│  │   Platform      │                                           │
│  └────────┬────────┘                                           │
│           │                                                     │
│    ┌──────┴───────┬────────────┬────────────┬─────────────┐   │
│    ▼              ▼            ▼            ▼             ▼   │
│ ┌──────┐    ┌──────┐    ┌──────┐    ┌──────┐    ┌──────┐    │
│ │Cloud │    │IdP   │    │Payment│   │Comms │    │ SaaS │    │
│ │Infra │    │      │    │       │   │      │    │Tools │    │
│ ├──────┤    ├──────┤    ├──────┤   ├──────┤    ├──────┤    │
│ │ AWS  │    │Keycloak   │Stripe │   │SendGrid   │Slack │    │
│ │Azure │    │UAEPass│   │       │   │Twilio│    │Jira  │    │
│ └──────┘    └──────┘    └──────┘   └──────┘    └──────┘    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. Immediate Assessment

### 3.1 Identify Impact

```bash
# 1. Determine which vendor is affected
VENDOR_NAME="<vendor>"

# 2. Identify what data we share with this vendor
psql -c "SELECT * FROM vendor_data_sharing WHERE vendor_name='$VENDOR_NAME';"

# 3. Identify integration points
psql -c "SELECT * FROM integrations WHERE provider='$VENDOR_NAME';"

# 4. Check for recent API activity
psql -c "
SELECT
  date_trunc('day', created_at) as day,
  count(*) as api_calls,
  count(DISTINCT user_id) as users
FROM external_api_logs
WHERE provider='$VENDOR_NAME'
  AND created_at > NOW() - INTERVAL '30 days'
GROUP BY day
ORDER BY day DESC;
"
```

### 3.2 Risk Classification

| Factor | Low Risk | Medium Risk | High Risk |
|--------|----------|-------------|-----------|
| **Data Type** | Public data | Internal data | PII/Credentials |
| **Integration** | Read-only | Read/Write | Admin access |
| **User Impact** | None | Some users | All users |
| **Credential Exposure** | None | API keys | User passwords |

---

## 4. Response by Breach Type

### 4.1 Vendor Reports Breach

```bash
# 1. Get official details from vendor
# - What data was compromised?
# - What is the timeline?
# - What are they doing about it?
# - What should we do?

# 2. If our credentials were exposed
# Immediately rotate all credentials for this vendor

# API Keys
kubectl create secret generic ${VENDOR}_api_key \
  --from-literal=api-key=$(openssl rand -hex 32) \
  -n ems-prod --dry-run=client -o yaml | kubectl apply -f -

# OAuth tokens
# Revoke and regenerate via vendor portal

# 3. If user data was exposed
# Identify affected users
psql -c "
SELECT user_id, email
FROM users u
JOIN vendor_data_sync v ON u.id = v.user_id
WHERE v.vendor='$VENDOR_NAME'
  AND v.sync_date > '<breach_start_date>';
"

# 4. Notify affected users
# See communication templates below
```

### 4.2 Supply Chain Attack

```bash
# 1. If vendor's code/package was compromised

# Check if we use the affected version
npm ls <package_name>
pip show <package_name>

# 2. If affected, immediately patch
npm update <package_name>
pip install --upgrade <package_name>

# 3. Scan for indicators of compromise
# Run security scans
trivy image ems/api:latest
grype ems/api:latest

# 4. Review recent changes from vendor
git log --oneline --since="<breach_date>" -- "**/node_modules/<package>/**"
```

### 4.3 Vendor System Compromise

```bash
# 1. Disable integration temporarily
kubectl set env deployment/api-gateway -n ems-prod \
  VENDOR_${VENDOR_UPPER}_ENABLED=false

# 2. Check for suspicious activity via vendor
psql -c "
SELECT *
FROM audit_logs
WHERE source='vendor_api'
  AND vendor='$VENDOR_NAME'
  AND created_at > '<breach_start_date>'
ORDER BY created_at DESC;
"

# 3. Verify data integrity
# Compare our data with last known good state

# 4. Implement fallback (if available)
# Route to backup provider or graceful degradation
```

---

## 5. Communication

### 5.1 Internal Communication

```markdown
Subject: Third-Party Security Incident - [VENDOR]

CONFIDENTIAL - INTERNAL ONLY

Incident Summary:
- Vendor: [VENDOR NAME]
- Date Discovered: [DATE]
- Nature: [Brief description]

Our Exposure:
- Data shared with vendor: [Types]
- Users potentially affected: [Number]
- Integration status: [Active/Disabled]

Actions Taken:
1. [Action 1]
2. [Action 2]

Next Steps:
1. [Next step 1]
2. [Next step 2]

Contact: security@ems.com
```

### 5.2 Customer Communication (If Required)

```markdown
Subject: Security Update Regarding [VENDOR]

Dear Valued Customer,

We are writing to inform you about a security incident at one of our
service providers, [VENDOR], which may affect your data.

WHAT HAPPENED:
[Clear factual description]

YOUR DATA:
[What data was shared with vendor]

OUR RESPONSE:
1. We have [action taken]
2. We are [ongoing action]
3. We will [future action]

WHAT YOU CAN DO:
- [Recommendation 1]
- [Recommendation 2]

We take the security of your data seriously and are working closely
with [VENDOR] to understand the full scope of this incident.

Questions? Contact: security@ems.com

EMS Security Team
```

---

## 6. Credential Rotation

### 6.1 Rotation Checklist

```bash
# For each affected vendor integration:

□ API Keys
  kubectl delete secret ${VENDOR}-api-key -n ems-prod
  # Regenerate via vendor portal
  kubectl create secret generic ${VENDOR}-api-key \
    --from-literal=key=<new_key> -n ems-prod

□ OAuth Client Secrets
  # Regenerate via vendor OAuth settings
  # Update in secrets management

□ Webhook Secrets
  # Regenerate webhook signing secrets
  # Update in both systems

□ Service Accounts
  # Rotate service account credentials
  # Update permissions if needed

□ Encryption Keys (if shared)
  # Generate new keys
  # Re-encrypt affected data

□ SSH Keys (if applicable)
  # Generate new keypair
  # Update authorized_keys
```

### 6.2 Post-Rotation Verification

```bash
# 1. Test integration functionality
curl -H "Authorization: Bearer $NEW_API_KEY" https://api.vendor.com/health

# 2. Verify webhooks working
# Send test webhook

# 3. Check application logs for errors
kubectl logs -l app=api-gateway -n ems-prod | grep -i "$VENDOR_NAME\|error"

# 4. Monitor for failed authentications
# Check vendor dashboard for auth failures
```

---

## 7. Vendor Management

### 7.1 Vendor Communication

```markdown
To: [Vendor Security Contact]
Subject: Security Incident - Information Request

Dear [Vendor] Security Team,

We are writing regarding the recently disclosed security incident
affecting your systems.

As a customer, we require the following information:

1. What customer data was potentially accessed?
2. What is the timeline of the incident?
3. Were our API credentials or access tokens compromised?
4. What logs/evidence can you provide regarding our account?
5. What remediation steps should we take?
6. What are you doing to prevent recurrence?
7. Will there be a formal incident report?

Please respond within 24 hours given the urgency.

Contact: security@ems.com
Phone: [Emergency contact]

Regards,
EMS Security Team
```

### 7.2 Vendor Assessment

| Question | Answer | Risk Level |
|----------|--------|------------|
| Was our data accessed? | | |
| What data was exposed? | | |
| Timeline of exposure | | |
| Root cause | | |
| Remediation status | | |
| Future prevention | | |
| SOC 2/ISO 27001 status | | |

---

## 8. Ongoing Monitoring

### 8.1 Enhanced Monitoring

```yaml
# Add monitoring rules for vendor integration
alerts:
  - name: "VendorAuthFailures"
    expr: "vendor_auth_failures{vendor='$VENDOR'} > 5"
    for: "5m"
    severity: "warning"

  - name: "VendorAPIAnomalies"
    expr: "rate(vendor_api_calls{vendor='$VENDOR'}[5m]) > 2 * avg_over_time(vendor_api_calls{vendor='$VENDOR'}[7d])"
    for: "10m"
    severity: "warning"

  - name: "VendorDataSync"
    expr: "vendor_last_sync_seconds{vendor='$VENDOR'} > 3600"
    for: "15m"
    severity: "warning"
```

---

## 9. Legal and Compliance

### 9.1 Documentation

- Vendor breach notification received
- Our response timeline
- Data impact assessment
- User notification (if sent)
- Regulatory notification (if required)
- Vendor remediation confirmation

### 9.2 Regulatory Considerations

| If vendor had... | Then we may need to... |
|------------------|------------------------|
| EU user PII | Notify under GDPR |
| Payment data | Notify under PCI DSS |
| Health data | Notify under HIPAA |
| UAE user data | Notify under UAE PDPL |

---

## 10. Post-Incident

### 10.1 Vendor Review

- [ ] Review vendor security questionnaire
- [ ] Request updated SOC 2 report
- [ ] Review contract terms
- [ ] Assess vendor alternatives
- [ ] Update vendor risk assessment

### 10.2 Process Improvements

- [ ] Improve vendor monitoring
- [ ] Reduce data sharing where possible
- [ ] Implement data minimization
- [ ] Add contractual breach notification requirements
- [ ] Regular vendor security reviews

---

## 11. Escalation

| Condition | Escalation |
|-----------|------------|
| User data exposed | Data Breach playbook |
| Payment data exposed | PCI incident + Legal |
| Credentials leaked | Credential Leak playbook |
| Ongoing attack via vendor | Immediate disconnect |

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0.0 | 2024 | Security Team | Initial release |
