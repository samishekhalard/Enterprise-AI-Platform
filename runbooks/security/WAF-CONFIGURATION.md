# EMS Web Application Firewall (WAF) Configuration

## Document Control

| Property | Value |
|----------|-------|
| **Document ID** | SEC-WAF-001 |
| **Version** | 1.0.0 |
| **Classification** | Confidential |
| **Owner** | Security Team |
| **Last Review** | 2024 |

---

## 1. Overview

### 1.1 Purpose

This document defines the Web Application Firewall (WAF) configuration for EMS, providing defense-in-depth protection against common web attacks, API abuse, and malicious traffic.

### 1.2 Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         WAF ARCHITECTURE                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│    Internet                                                                 │
│       │                                                                     │
│       ▼                                                                     │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                     CLOUDFLARE WAF                                   │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐            │   │
│  │  │ DDoS     │  │ OWASP    │  │ Rate     │  │ Bot      │            │   │
│  │  │ Shield   │  │ CRS      │  │ Limiting │  │ Mgmt     │            │   │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘            │   │
│  │         │            │            │            │                    │   │
│  │         └────────────┴────────────┴────────────┘                    │   │
│  │                              │                                       │   │
│  │                    ┌─────────▼─────────┐                            │   │
│  │                    │  Custom Rules     │                            │   │
│  │                    │  (EMS-specific)│                            │   │
│  │                    └─────────┬─────────┘                            │   │
│  └──────────────────────────────┼──────────────────────────────────────┘   │
│                                 │                                           │
│                                 ▼                                           │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                     AWS WAF (Secondary)                              │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐                          │   │
│  │  │ API      │  │ SQL      │  │ XSS      │                          │   │
│  │  │ Gateway  │  │ Injection│  │ Filter   │                          │   │
│  │  └──────────┘  └──────────┘  └──────────┘                          │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                 │                                           │
│                                 ▼                                           │
│                    ┌────────────────────────┐                              │
│                    │   EMS Application   │                              │
│                    └────────────────────────┘                              │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. WAF Providers

### 2.1 Primary: Cloudflare WAF

```yaml
cloudflare_waf:
  plan: "Enterprise"  # Required for advanced features

  features:
    - ddos_protection: "Advanced"
    - managed_rules: "OWASP Core Rule Set"
    - rate_limiting: true
    - bot_management: true
    - api_shield: true
    - page_shield: true
    - ssl_tls: "Full (Strict)"

  zones:
    production:
      domain: "ems.com"
      ssl_mode: "full_strict"
      min_tls_version: "1.2"

    api:
      domain: "api.ems.com"
      ssl_mode: "full_strict"
      always_use_https: true
```

### 2.2 Secondary: AWS WAF

```yaml
aws_waf:
  scope: "REGIONAL"  # For ALB

  web_acl:
    name: "ems-production-waf"
    default_action: "ALLOW"

  associations:
    - resource_arn: "arn:aws:elasticloadbalancing:us-east-1:123456789:loadbalancer/app/ems-alb"
```

---

## 3. OWASP Core Rule Set (CRS)

### 3.1 Enabled Rule Groups

```yaml
owasp_crs:
  version: "3.3.4"

  rule_groups:
    # SQL Injection Protection
    - name: "SQLi"
      id: "942"
      action: "BLOCK"
      sensitivity: "MEDIUM"

    # Cross-Site Scripting (XSS)
    - name: "XSS"
      id: "941"
      action: "BLOCK"
      sensitivity: "MEDIUM"

    # Remote Code Execution (RCE)
    - name: "RCE"
      id: "932"
      action: "BLOCK"
      sensitivity: "HIGH"

    # Local File Inclusion (LFI)
    - name: "LFI"
      id: "930"
      action: "BLOCK"
      sensitivity: "MEDIUM"

    # Remote File Inclusion (RFI)
    - name: "RFI"
      id: "931"
      action: "BLOCK"
      sensitivity: "MEDIUM"

    # PHP Injection
    - name: "PHP"
      id: "933"
      action: "BLOCK"
      sensitivity: "MEDIUM"

    # Java Injection
    - name: "Java"
      id: "944"
      action: "BLOCK"
      sensitivity: "MEDIUM"

    # Session Fixation
    - name: "Session"
      id: "943"
      action: "BLOCK"
      sensitivity: "MEDIUM"

    # Protocol Violations
    - name: "Protocol"
      id: "920"
      action: "BLOCK"
      sensitivity: "LOW"
```

### 3.2 Sensitivity Levels

| Level | Description | False Positive Rate | Use Case |
|-------|-------------|---------------------|----------|
| **LOW** | Basic protection | Very Low | Protocol validation |
| **MEDIUM** | Balanced | Low | Most attack patterns |
| **HIGH** | Aggressive | Medium | Critical endpoints |
| **PARANOID** | Maximum | High | Highly sensitive data |

---

## 4. Rate Limiting Rules

### 4.1 Global Rate Limits

```yaml
rate_limiting:
  global:
    # Overall request limit
    - name: "global_limit"
      requests: 10000
      period: "1m"
      action: "CHALLENGE"

    # Per-IP limit
    - name: "per_ip_limit"
      requests: 1000
      period: "1m"
      action: "BLOCK"
      block_duration: "10m"

  # API-specific limits
  api:
    # Authentication endpoints (stricter)
    - name: "auth_rate_limit"
      path: "/api/v1/auth/*"
      requests: 10
      period: "1m"
      action: "BLOCK"
      block_duration: "15m"

    # Login endpoint (prevent brute force)
    - name: "login_rate_limit"
      path: "/api/v1/auth/login"
      requests: 5
      period: "5m"
      action: "BLOCK"
      block_duration: "30m"

    # Password reset
    - name: "password_reset_limit"
      path: "/api/v1/auth/reset-password"
      requests: 3
      period: "1h"
      action: "BLOCK"

    # API general limit
    - name: "api_general_limit"
      path: "/api/*"
      requests: 500
      period: "1m"
      action: "CHALLENGE"

    # File upload limit
    - name: "upload_limit"
      path: "/api/v1/files/upload"
      requests: 20
      period: "5m"
      action: "BLOCK"

  # Per-tenant limits (applied at application level)
  tenant:
    free:
      requests_per_minute: 100
    professional:
      requests_per_minute: 1000
    enterprise:
      requests_per_minute: 10000
```

### 4.2 Burst Handling

```yaml
burst_protection:
  # Allow short bursts but enforce sustained limits
  algorithm: "sliding_window"

  rules:
    - name: "burst_protection"
      burst_size: 50       # Allow 50 requests instantly
      rate: 10             # Sustained rate: 10/second
      period: "1s"
      action: "THROTTLE"   # Return 429, not block
```

---

## 5. Custom EMS Rules

### 5.1 API Protection Rules

```yaml
custom_rules:
  # Block requests without tenant header on multi-tenant endpoints
  - name: "require_tenant_header"
    expression: |
      http.request.uri.path matches "/api/v1/tenants/[^/]+/"
      and not any(http.request.headers["x-tenant-id"])
    action: "BLOCK"

  # Validate JWT format in Authorization header
  - name: "validate_jwt_format"
    expression: |
      http.request.uri.path matches "/api/v1/"
      and any(http.request.headers["authorization"])
      and not http.request.headers["authorization"][0] matches "^Bearer [A-Za-z0-9-_]+\\.[A-Za-z0-9-_]+\\.[A-Za-z0-9-_]+$"
    action: "BLOCK"

  # Block common attack patterns in query strings
  - name: "block_attack_patterns"
    expression: |
      http.request.uri.query contains "union" and http.request.uri.query contains "select"
      or http.request.uri.query contains "<script"
      or http.request.uri.query contains "javascript:"
      or http.request.uri.query contains "../"
    action: "BLOCK"

  # Block oversized requests
  - name: "block_large_payloads"
    expression: |
      http.request.body.size > 10485760  # 10MB
      and not http.request.uri.path matches "/api/v1/files/upload"
    action: "BLOCK"

  # Require Content-Type for POST/PUT/PATCH
  - name: "require_content_type"
    expression: |
      http.request.method in {"POST" "PUT" "PATCH"}
      and http.request.body.size > 0
      and not any(http.request.headers["content-type"])
    action: "BLOCK"
```

### 5.2 Geographic Rules

```yaml
geo_rules:
  # Block high-risk countries (adjustable)
  - name: "geo_block_high_risk"
    expression: |
      ip.geoip.country in {"KP" "RU" "CN" "IR"}
      and not ip.src in $allowed_ips
    action: "CHALLENGE"  # CAPTCHA, not block

  # UAE data residency enforcement
  - name: "uae_data_residency"
    expression: |
      http.request.uri.path matches "/api/v1/tenants/uae-.*"
      and ip.geoip.country != "AE"
    action: "LOG"  # Log for compliance, don't block

  # Allow Cloudflare IPs
  - name: "allow_cloudflare"
    expression: |
      ip.src in $cloudflare_ips
    action: "ALLOW"
```

### 5.3 Bot Management

```yaml
bot_management:
  # Known good bots
  verified_bots:
    - "googlebot"
    - "bingbot"
    - "slackbot"

  rules:
    # Block bad bots
    - name: "block_bad_bots"
      expression: |
        cf.bot_management.score < 30
        and not cf.bot_management.verified_bot
      action: "BLOCK"

    # Challenge suspicious bots
    - name: "challenge_suspicious"
      expression: |
        cf.bot_management.score < 50
        and not cf.bot_management.verified_bot
      action: "MANAGED_CHALLENGE"

    # Rate limit bots
    - name: "rate_limit_bots"
      expression: |
        cf.bot_management.score < 70
      requests: 100
      period: "1m"
      action: "CHALLENGE"

    # Block known automation tools on sensitive endpoints
    - name: "block_automation_sensitive"
      expression: |
        http.request.uri.path matches "/api/v1/auth/"
        and (
          http.user_agent contains "curl"
          or http.user_agent contains "wget"
          or http.user_agent contains "python"
          or http.user_agent contains "postman"
        )
        and not ip.src in $internal_ips
      action: "BLOCK"
```

---

## 6. API Shield Configuration

### 6.1 Schema Validation

```yaml
api_shield:
  enabled: true

  endpoints:
    - path: "/api/v1/*"
      schema: "openapi-v1.yaml"
      validation:
        - request_body: true
        - query_params: true
        - headers: true
      action_on_failure: "LOG"  # Start with LOG, move to BLOCK

  discovery:
    enabled: true
    learning_mode: true
    duration: "7d"
```

### 6.2 mTLS for API

```yaml
mtls:
  enabled: true

  endpoints:
    # Require mTLS for tenant-to-tenant integration
    - path: "/api/v1/integration/*"
      client_certificate_required: true

    # Internal service mesh
    - path: "/internal/*"
      client_certificate_required: true
      allowed_certificates:
        - issuer: "CN=EMS Internal CA"
```

---

## 7. Logging & Monitoring

### 7.1 Log Configuration

```yaml
logging:
  enabled: true

  log_fields:
    - "timestamp"
    - "client_ip"
    - "country"
    - "request_method"
    - "request_uri"
    - "user_agent"
    - "rule_id"
    - "action"
    - "threat_score"

  destinations:
    - type: "s3"
      bucket: "ems-waf-logs"
      prefix: "cloudflare/"

    - type: "splunk"
      endpoint: "https://splunk.ems.internal"
      token: "${SPLUNK_HEC_TOKEN}"

    - type: "datadog"
      api_key: "${DATADOG_API_KEY}"
```

### 7.2 Alerting Rules

```yaml
alerts:
  # High volume of blocks
  - name: "high_block_rate"
    condition: "blocks > 1000 in 5m"
    severity: "warning"
    channels: ["slack", "pagerduty"]

  # Potential DDoS
  - name: "ddos_detected"
    condition: "requests > 100000 in 1m"
    severity: "critical"
    channels: ["pagerduty"]

  # SQL injection attempts
  - name: "sqli_detected"
    condition: "rule_id:942* blocks > 10 in 1m"
    severity: "high"
    channels: ["slack", "security-email"]

  # Brute force attempt
  - name: "brute_force"
    condition: "path:/api/v1/auth/login blocks > 50 in 5m from same ip"
    severity: "high"
    channels: ["pagerduty"]
```

---

## 8. Exception Handling

### 8.1 Allowlists

```yaml
allowlists:
  # Internal IPs
  internal_ips:
    - "10.0.0.0/8"
    - "172.16.0.0/12"
    - "192.168.0.0/16"

  # Partner IPs (integration endpoints only)
  partner_ips:
    - name: "payment_provider"
      ips: ["203.0.113.0/24"]
      paths: ["/api/v1/webhooks/payments"]

    - name: "crm_integration"
      ips: ["198.51.100.0/24"]
      paths: ["/api/v1/integration/crm/*"]

  # Monitoring services
  monitoring_ips:
    - name: "uptime_robot"
      ips: ["63.143.42.0/24"]
      paths: ["/health", "/api/v1/health"]
```

### 8.2 False Positive Handling

```yaml
false_positive_exclusions:
  # BPMN XML content triggers XSS rules
  - name: "bpmn_xml_exclusion"
    rule_ids: ["941100", "941110"]
    paths: ["/api/v1/workflows/*/bpmn"]
    condition: "content-type contains 'application/xml'"

  # Rich text editor content
  - name: "rich_text_exclusion"
    rule_ids: ["941100"]
    paths: ["/api/v1/documents/*"]
    fields: ["content", "description"]

  # GraphQL queries look like injection
  - name: "graphql_exclusion"
    rule_ids: ["942100"]
    paths: ["/graphql"]
```

---

## 9. Testing & Validation

### 9.1 WAF Testing Procedures

```bash
# Test SQL injection blocking
curl -v "https://api.ems.com/api/v1/users?id=1' OR '1'='1"
# Expected: 403 Forbidden

# Test XSS blocking
curl -v "https://api.ems.com/api/v1/search?q=<script>alert(1)</script>"
# Expected: 403 Forbidden

# Test rate limiting
for i in {1..100}; do curl -s https://api.ems.com/api/v1/auth/login -d '{}'; done
# Expected: 429 Too Many Requests after threshold

# Test path traversal
curl -v "https://api.ems.com/api/v1/files/../../../etc/passwd"
# Expected: 403 Forbidden
```

### 9.2 Validation Checklist

```
┌─────────────────────────────────────────────────────────────────┐
│                  WAF VALIDATION CHECKLIST                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  □ OWASP Top 10 attacks blocked                                 │
│  □ Rate limiting working correctly                              │
│  □ Bot detection functioning                                    │
│  □ Geographic rules applied                                     │
│  □ Custom rules validated                                       │
│  □ Logging to all destinations                                  │
│  □ Alerts triggering correctly                                  │
│  □ False positives documented and excluded                      │
│  □ mTLS working for integration endpoints                       │
│  □ API Shield schema validation active                          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 10. Incident Response

### WAF-Related Incidents

| Scenario | Response |
|----------|----------|
| High block rate | Investigate for false positives or attack |
| Legitimate traffic blocked | Add to allowlist, tune rules |
| DDoS detected | Enable Under Attack mode, engage DDoS playbook |
| Bypass detected | Emergency rule update, engage security team |

See: [PLAYBOOK-SEC-004-API-ABUSE.md](playbooks/PLAYBOOK-SEC-004-API-ABUSE.md)

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0.0 | 2024 | Security Team | Initial release |
