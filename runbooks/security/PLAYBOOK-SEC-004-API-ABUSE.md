# PLAYBOOK-SEC-004: API Abuse Response

## Quick Reference

| Property | Value |
|----------|-------|
| **Playbook ID** | SEC-004 |
| **Severity** | SEV-2/SEV-3 |
| **Response Time** | 30 minutes |
| **Owner** | Security Team |

---

## 1. Trigger Conditions

This playbook is activated when:
- Rate limit thresholds exceeded significantly
- Enumeration attacks detected (user/resource enumeration)
- Scraping/data harvesting detected
- API credential abuse (shared keys, leaked tokens)
- Injection attempts via API
- Unauthorized API endpoint access
- GraphQL introspection abuse
- BOLA/IDOR attacks detected

---

## 2. Abuse Classification

### 2.1 Abuse Types

| Type | Description | Severity | Typical Pattern |
|------|-------------|----------|-----------------|
| **Rate Abuse** | Exceeding rate limits | Medium | 10x normal traffic |
| **Enumeration** | Probing for valid resources | High | Sequential IDs, 404 spike |
| **Scraping** | Bulk data extraction | Medium | High read volume |
| **Credential Stuffing** | Testing stolen credentials | High | Many auth failures |
| **Injection** | SQLi, XSS via API | Critical | Malicious payloads |
| **BOLA/IDOR** | Accessing other users' data | Critical | Horizontal access |
| **Business Logic** | Exploiting workflow flaws | High | Unusual sequences |

---

## 3. Immediate Response

### 3.1 Identify Abuse Pattern

```bash
# 1. Check rate limit violations
kubectl logs -l app=api-gateway -n ems-prod | grep "rate_limit_exceeded" | tail -100

# 2. Identify top offending IPs
kubectl logs -l app=api-gateway -n ems-prod | grep -oE 'client_ip=[0-9.]+' | sort | uniq -c | sort -rn | head -20

# 3. Check for enumeration patterns
psql -c "SELECT path, count(*) as hits, count(DISTINCT status_code) as status_variety FROM api_logs WHERE created_at > NOW() - INTERVAL '1 hour' GROUP BY path HAVING count(*) > 1000 ORDER BY hits DESC;"

# 4. Check authentication failures
psql -c "SELECT ip_address, count(*) as failures FROM login_attempts WHERE success=false AND created_at > NOW() - INTERVAL '1 hour' GROUP BY ip_address HAVING count(*) > 10 ORDER BY failures DESC;"
```

### 3.2 Quick Mitigation

```bash
# 1. Block abusive IP immediately
curl -X POST "https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/firewall/rules" \
  -H "Authorization: Bearer ${CF_TOKEN}" \
  -d '{
    "action": "block",
    "filter": {"expression": "ip.src eq <abusive_ip>"},
    "description": "API abuse - auto-blocked"
  }'

# 2. Revoke abused API key
psql -c "UPDATE api_keys SET status='revoked', revoked_reason='abuse_detected' WHERE key_hash='<key_hash>';"

# 3. Enable enhanced CAPTCHA
kubectl set env deployment/api-gateway -n ems-prod \
  CAPTCHA_MODE=aggressive

# 4. Reduce rate limits temporarily
kubectl patch configmap rate-limit-config -n ems-prod \
  -p '{"data":{"global_rpm":"60","per_ip_rpm":"30"}}'
```

---

## 4. Investigation

### 4.1 Analyze Traffic Patterns

```bash
# 1. Request patterns by endpoint
psql -c "
SELECT
  path,
  method,
  count(*) as total_requests,
  count(DISTINCT ip_address) as unique_ips,
  avg(response_time_ms) as avg_response_time,
  count(*) FILTER (WHERE status_code >= 400) as error_count
FROM api_logs
WHERE created_at > NOW() - INTERVAL '1 hour'
GROUP BY path, method
ORDER BY total_requests DESC
LIMIT 50;
"

# 2. User agent analysis
psql -c "
SELECT
  user_agent,
  count(*) as requests,
  count(DISTINCT ip_address) as ips
FROM api_logs
WHERE created_at > NOW() - INTERVAL '1 hour'
GROUP BY user_agent
ORDER BY requests DESC
LIMIT 20;
"

# 3. Geographic distribution
psql -c "
SELECT
  country,
  count(*) as requests,
  count(DISTINCT ip_address) as ips
FROM api_logs
WHERE created_at > NOW() - INTERVAL '1 hour'
GROUP BY country
ORDER BY requests DESC
LIMIT 20;
"
```

### 4.2 Identify Abuse Source

```bash
# 1. Is it a single actor or distributed?
psql -c "
SELECT
  ip_address,
  count(*) as requests,
  min(created_at) as first_seen,
  max(created_at) as last_seen
FROM api_logs
WHERE created_at > NOW() - INTERVAL '1 hour'
GROUP BY ip_address
HAVING count(*) > 100
ORDER BY requests DESC;
"

# 2. Is it using valid credentials?
psql -c "
SELECT
  api_key_id,
  user_id,
  count(*) as requests
FROM api_logs
WHERE api_key_id IS NOT NULL
  AND created_at > NOW() - INTERVAL '1 hour'
GROUP BY api_key_id, user_id
ORDER BY requests DESC
LIMIT 20;
"

# 3. Check if API key was leaked
# Search code repositories, paste sites, etc.
```

---

## 5. Response by Abuse Type

### 5.1 Rate Abuse

```bash
# 1. Verify it's not legitimate traffic spike
# Check if specific tenant or feature launch

# 2. Apply progressive rate limiting
# First warning
kubectl set env deployment/api-gateway -n ems-prod \
  RATE_LIMIT_MODE=strict

# If continues, block
curl -X POST "https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/firewall/rules" \
  -d '{"action":"block","filter":{"expression":"ip.src eq <ip>"}}'

# 3. Contact customer if legitimate API key
if is_valid_customer_key; then
  send_email "Rate limit warning" "Your API key is exceeding rate limits..."
fi
```

### 5.2 Enumeration Attack

```bash
# 1. Identify enumeration pattern
psql -c "
SELECT path, status_code, count(*)
FROM api_logs
WHERE path LIKE '/api/v1/users/%'
  AND created_at > NOW() - INTERVAL '1 hour'
GROUP BY path, status_code
ORDER BY count(*) DESC;
"

# 2. Enable anti-enumeration measures
# Return consistent responses for not found vs forbidden
kubectl set env deployment/api-gateway -n ems-prod \
  ANTI_ENUMERATION=true

# 3. Add random delay to responses
# Implemented at application level

# 4. Block the source
curl -X POST "https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/firewall/rules" \
  -d '{"action":"challenge","filter":{"expression":"ip.src eq <ip>"}}'
```

### 5.3 Data Scraping

```bash
# 1. Identify scraping behavior
# High volume, sequential access, no referrer

# 2. Implement bot detection
# Cloudflare Bot Management
curl -X PATCH "https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/settings/bot_management" \
  -H "Authorization: Bearer ${CF_TOKEN}" \
  -d '{"value":{"enable_js":true}}'

# 3. Add authentication requirements
# Convert public endpoints to require auth

# 4. Implement data access limits
psql -c "
INSERT INTO rate_limits (user_id, limit_type, max_value, period)
VALUES ('<user_id>', 'export_records', 1000, 'day');
"
```

### 5.4 BOLA/IDOR Attack

```bash
# CRITICAL: Potential data breach

# 1. Identify unauthorized access attempts
psql -c "
SELECT
  user_id,
  resource_type,
  resource_id,
  resource_owner_id,
  created_at
FROM audit_logs
WHERE action='access'
  AND user_id != resource_owner_id
  AND created_at > NOW() - INTERVAL '1 hour'
ORDER BY created_at DESC;
"

# 2. If successful unauthorized access found
# Escalate to Data Breach playbook
if unauthorized_access_successful; then
  trigger_playbook "PLAYBOOK-SEC-001-DATA-BREACH"
fi

# 3. Block attacker
psql -c "UPDATE users SET status='suspended' WHERE id='<attacker_user_id>';"

# 4. Patch vulnerability
# Implement proper authorization checks
```

---

## 6. WAF Rule Updates

### 6.1 Create Custom Rules

```bash
# 1. Block specific attack pattern
curl -X POST "https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/firewall/rules" \
  -H "Authorization: Bearer ${CF_TOKEN}" \
  -d '{
    "action": "block",
    "filter": {
      "expression": "http.request.uri.path matches \"^/api/v1/users/[0-9]+$\" and cf.threat_score > 10",
      "description": "Block user enumeration"
    }
  }'

# 2. Rate limit specific endpoint
curl -X POST "https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/ratelimits" \
  -d '{
    "threshold": 10,
    "period": 60,
    "action": {"mode": "challenge"},
    "match": {
      "request": {"url_pattern": "*api.ems.com/api/v1/search*"}
    }
  }'
```

---

## 7. Customer Communication

### 7.1 API Key Abuse Notification

```markdown
Subject: API Key Security Alert - Immediate Action Required

Dear [Customer],

We detected unusual activity using your API key [KEY_PREFIX]***:

- Volume: [X] requests in [Y] time period
- Pattern: [Description of abuse pattern]
- Impact: [Any impact to your account]

REQUIRED ACTIONS:
1. Rotate your API key immediately
2. Review your application code for credential exposure
3. Check your systems for unauthorized access

We have temporarily rate-limited your key to prevent further abuse.

If this activity was intentional, please contact us to discuss appropriate rate limits.

API Documentation: https://docs.ems.com/api
Support: api-support@ems.com

EMS Security Team
```

---

## 8. Monitoring Enhancement

### 8.1 Add Detection Rules

```yaml
# Prometheus alerting rules
groups:
  - name: api_abuse
    rules:
      - alert: HighAPIErrorRate
        expr: rate(http_requests_total{status=~"4.."}[5m]) > 10
        for: 5m
        labels:
          severity: warning

      - alert: EnumerationDetected
        expr: rate(http_requests_total{status="404"}[5m]) > 50
        for: 2m
        labels:
          severity: high

      - alert: UnusualAPIVolume
        expr: rate(http_requests_total[5m]) > 10 * avg_over_time(rate(http_requests_total[5m])[7d:1h])
        for: 5m
        labels:
          severity: warning
```

---

## 9. Post-Incident

### 9.1 Documentation

- Document attack pattern
- Update WAF rules
- Add to threat intelligence
- Update monitoring rules
- Review affected accounts

### 9.2 Prevention Measures

- [ ] Review API authentication
- [ ] Implement additional rate limiting
- [ ] Add anomaly detection
- [ ] Review authorization checks
- [ ] Update API documentation on limits

---

## 10. Escalation

| Condition | Escalation |
|-----------|------------|
| Data accessed | Data Breach playbook |
| Credential leak | Credential Leak playbook |
| DDoS-level traffic | DDoS playbook |
| Internal abuse | Insider Threat playbook |

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0.0 | 2024 | Security Team | Initial release |
