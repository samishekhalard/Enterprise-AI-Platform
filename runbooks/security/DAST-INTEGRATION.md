# EMS Dynamic Application Security Testing (DAST) Integration

## Document Control

| Property | Value |
|----------|-------|
| **Document ID** | SEC-DAST-001 |
| **Version** | 1.0.0 |
| **Classification** | Internal |
| **Owner** | Security Team |
| **Last Review** | 2024 |

---

## 1. Overview

### 1.1 Purpose

This document defines the Dynamic Application Security Testing (DAST) integration for EMS, complementing the existing Static Application Security Testing (SAST) to provide comprehensive security coverage.

### 1.2 Testing Pipeline Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    SECURITY TESTING PIPELINE                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  CODE COMMIT                                                                │
│       │                                                                     │
│       ▼                                                                     │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  STATIC ANALYSIS (SAST)                                              │   │
│  │  ├── Semgrep (Code patterns)                                        │   │
│  │  ├── SonarQube (Quality + Security)                                 │   │
│  │  ├── npm audit / Snyk (Dependencies)                                │   │
│  │  └── Trivy (Container scanning)                                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│       │                                                                     │
│       ▼                                                                     │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  BUILD & DEPLOY TO STAGING                                           │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│       │                                                                     │
│       ▼                                                                     │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  DYNAMIC ANALYSIS (DAST)                                             │   │
│  │  ├── OWASP ZAP (Full Scan)                                          │   │
│  │  ├── Nuclei (CVE scanning)                                          │   │
│  │  ├── API Security (OpenAPI validation)                              │   │
│  │  └── Authentication Testing                                         │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│       │                                                                     │
│       ▼                                                                     │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  SECURITY GATE                                                       │   │
│  │  ├── Critical: 0 allowed                                            │   │
│  │  ├── High: 0 allowed                                                │   │
│  │  └── Medium: Review required                                        │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│       │                                                                     │
│       ▼                                                                     │
│  PRODUCTION DEPLOYMENT (if passed)                                          │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. OWASP ZAP Integration

### 2.1 GitHub Actions Workflow

```yaml
# .github/workflows/dast.yml
name: DAST Security Scan

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]
  schedule:
    - cron: '0 2 * * 1'  # Weekly Monday 2 AM

jobs:
  dast-scan:
    name: OWASP ZAP Full Scan
    runs-on: ubuntu-latest

    services:
      ems-app:
        image: ghcr.io/ems/api:${{ github.sha }}
        ports:
          - 8080:8080
        env:
          DATABASE_URL: ${{ secrets.TEST_DATABASE_URL }}
          VALKEY_URL: redis://localhost:6379

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Wait for application
        run: |
          timeout 60 bash -c 'until curl -s http://localhost:8080/health; do sleep 2; done'

      - name: ZAP Baseline Scan
        uses: zaproxy/action-baseline@v0.10.0
        with:
          target: 'http://localhost:8080'
          rules_file_name: '.zap/baseline-rules.tsv'
          cmd_options: '-a'

      - name: ZAP Full Scan
        uses: zaproxy/action-full-scan@v0.8.0
        with:
          target: 'http://localhost:8080'
          rules_file_name: '.zap/full-scan-rules.tsv'
          cmd_options: '-a -j -l WARN'

      - name: ZAP API Scan
        uses: zaproxy/action-api-scan@v0.5.0
        with:
          target: 'http://localhost:8080/api/v1/openapi.json'
          format: 'openapi'
          rules_file_name: '.zap/api-rules.tsv'

      - name: Upload ZAP Report
        uses: actions/upload-artifact@v4
        if: always()
        with:
          name: zap-report
          path: |
            report_html.html
            report_json.json

      - name: Parse Results
        id: parse
        run: |
          CRITICAL=$(jq '.site[].alerts | map(select(.riskcode == "3")) | length' report_json.json)
          HIGH=$(jq '.site[].alerts | map(select(.riskcode == "2")) | length' report_json.json)
          echo "critical=$CRITICAL" >> $GITHUB_OUTPUT
          echo "high=$HIGH" >> $GITHUB_OUTPUT

      - name: Security Gate
        if: steps.parse.outputs.critical > 0 || steps.parse.outputs.high > 0
        run: |
          echo "::error::Security gate failed: ${{ steps.parse.outputs.critical }} critical, ${{ steps.parse.outputs.high }} high vulnerabilities"
          exit 1
```

### 2.2 ZAP Configuration

```tsv
# .zap/full-scan-rules.tsv
# Rule ID    Action    Description
10016       IGNORE    # Web Browser XSS Protection Not Enabled (deprecated header)
10017       IGNORE    # Cross-Domain JavaScript Source File Inclusion (CDN)
10020       WARN      # X-Frame-Options Header Not Set
10021       FAIL      # X-Content-Type-Options Header Missing
10035       FAIL      # Strict-Transport-Security Header Not Set
10038       FAIL      # Content Security Policy Header Not Set
10055       WARN      # CSP: script-src unsafe-inline
10096       WARN      # Timestamp Disclosure
10098       IGNORE    # Cross-Domain Misconfiguration (CORS)
40012       FAIL      # Cross Site Scripting (Reflected)
40014       FAIL      # Cross Site Scripting (Persistent)
40016       FAIL      # Cross Site Scripting (DOM Based)
40018       FAIL      # SQL Injection
40019       FAIL      # SQL Injection - MySQL
40020       FAIL      # SQL Injection - Hypersonic SQL
40021       FAIL      # SQL Injection - Oracle
40022       FAIL      # SQL Injection - PostgreSQL
90019       FAIL      # Server Side Include
90020       FAIL      # Remote OS Command Injection
90021       FAIL      # XPath Injection
90023       FAIL      # XML External Entity Attack
```

### 2.3 Authentication Script

```javascript
// .zap/auth-script.js
// ZAP authentication script for EMS

function authenticate(helper, paramsValues, credentials) {
    var loginUrl = paramsValues.get("loginUrl");
    var username = credentials.getParam("username");
    var password = credentials.getParam("password");

    var msg = helper.prepareMessage();
    msg.setRequestHeader(
        "POST " + loginUrl + " HTTP/1.1\r\n" +
        "Host: " + helper.getHostName() + "\r\n" +
        "Content-Type: application/json\r\n"
    );

    var body = JSON.stringify({
        email: username,
        password: password
    });

    msg.setRequestBody(body);
    helper.sendAndReceive(msg);

    var response = JSON.parse(msg.getResponseBody().toString());

    if (response.access_token) {
        return response.access_token;
    }

    return null;
}

function getRequiredParamsNames() {
    return ["loginUrl"];
}

function getCredentialsParamsNames() {
    return ["username", "password"];
}
```

---

## 3. Nuclei CVE Scanning

### 3.1 Nuclei Configuration

```yaml
# .nuclei/config.yaml
severity:
  - critical
  - high
  - medium

templates-version: true
update-templates: true

# Rate limiting
rate-limit: 150
bulk-size: 25
concurrency: 25

# Output
output: nuclei-report.json
jsonl: true

# Exclude templates
exclude-templates:
  - ssl/
  - dns/
  - fuzzing/

# Custom tags
tags:
  - owasp-top-10
  - cve
  - exposures
  - misconfiguration
```

### 3.2 Nuclei GitHub Action

```yaml
nuclei-scan:
  name: Nuclei CVE Scan
  runs-on: ubuntu-latest
  needs: [deploy-staging]

  steps:
    - name: Checkout
      uses: actions/checkout@v4

    - name: Install Nuclei
      run: |
        go install -v github.com/projectdiscovery/nuclei/v3/cmd/nuclei@latest
        nuclei -update-templates

    - name: Run Nuclei Scan
      run: |
        nuclei \
          -u https://staging.ems.dev \
          -severity critical,high \
          -o nuclei-results.json \
          -jsonl \
          -rate-limit 100 \
          -c 25 \
          -tags owasp-top-10,cve

    - name: Parse Results
      id: nuclei
      run: |
        CRITICAL=$(grep -c '"severity":"critical"' nuclei-results.json || echo 0)
        HIGH=$(grep -c '"severity":"high"' nuclei-results.json || echo 0)
        echo "critical=$CRITICAL" >> $GITHUB_OUTPUT
        echo "high=$HIGH" >> $GITHUB_OUTPUT

    - name: Upload Report
      uses: actions/upload-artifact@v4
      with:
        name: nuclei-report
        path: nuclei-results.json

    - name: Fail on Critical
      if: steps.nuclei.outputs.critical > 0
      run: exit 1
```

---

## 4. API Security Testing

### 4.1 OpenAPI Validation

```yaml
api-security-scan:
  name: API Security Scan
  runs-on: ubuntu-latest

  steps:
    - name: Checkout
      uses: actions/checkout@v4

    - name: Install spectral
      run: npm install -g @stoplight/spectral-cli

    - name: Lint OpenAPI Spec
      run: |
        spectral lint docs/api/openapi.yaml \
          --ruleset .spectral.yaml \
          --format junit \
          --output spectral-results.xml

    - name: OWASP API Security
      uses: 42crunch/api-security-audit-action@v3
      with:
        api-definition: docs/api/openapi.yaml
        min-score: 75

    - name: Dredd API Testing
      run: |
        npm install -g dredd
        dredd docs/api/openapi.yaml http://localhost:8080 \
          --hookfiles=test/dredd-hooks.js \
          --reporter=junit \
          --output=dredd-results.xml
```

### 4.2 Spectral Security Rules

```yaml
# .spectral.yaml
extends: [[spectral:oas, all]]

rules:
  # Security requirements
  operation-security-defined:
    description: All operations must have security defined
    given: "$.paths.*[get,post,put,patch,delete]"
    then:
      - field: security
        function: truthy

  # HTTPS enforcement
  servers-https-only:
    description: Servers must use HTTPS
    given: "$.servers[*].url"
    then:
      function: pattern
      functionOptions:
        match: "^https://"

  # No credentials in URLs
  no-credentials-in-url:
    description: URLs must not contain credentials
    given: "$.servers[*].url"
    then:
      function: pattern
      functionOptions:
        notMatch: "://.*:.*@"

  # Rate limiting documentation
  rate-limit-headers:
    description: Rate limit headers should be documented
    given: "$.paths.*.*responses[*].headers"
    then:
      function: schema
      functionOptions:
        schema:
          anyOf:
            - required: [X-RateLimit-Limit]
            - required: [X-Rate-Limit-Limit]

  # Sensitive data encryption
  sensitive-data-encryption:
    description: Sensitive fields should mention encryption
    given: "$.components.schemas.*.properties[password,secret,key,token]"
    then:
      field: description
      function: pattern
      functionOptions:
        match: "(encrypt|hash)"
```

---

## 5. Authentication Testing

### 5.1 Auth Security Tests

```yaml
auth-security-test:
  name: Authentication Security Testing
  runs-on: ubuntu-latest

  steps:
    - name: Test Password Policy
      run: |
        # Test weak passwords are rejected
        WEAK_PASSWORDS=("password" "123456" "admin" "test")
        for pwd in "${WEAK_PASSWORDS[@]}"; do
          response=$(curl -s -o /dev/null -w "%{http_code}" \
            -X POST http://localhost:8080/api/v1/auth/register \
            -H "Content-Type: application/json" \
            -d "{\"email\":\"test@example.com\",\"password\":\"$pwd\"}")
          if [ "$response" != "400" ]; then
            echo "FAIL: Weak password '$pwd' was accepted"
            exit 1
          fi
        done

    - name: Test Brute Force Protection
      run: |
        # Attempt 10 failed logins
        for i in {1..10}; do
          curl -s -X POST http://localhost:8080/api/v1/auth/login \
            -H "Content-Type: application/json" \
            -d '{"email":"test@example.com","password":"wrong"}'
        done

        # 11th attempt should be rate limited
        response=$(curl -s -o /dev/null -w "%{http_code}" \
          -X POST http://localhost:8080/api/v1/auth/login \
          -H "Content-Type: application/json" \
          -d '{"email":"test@example.com","password":"wrong"}')

        if [ "$response" != "429" ]; then
          echo "FAIL: Brute force protection not working"
          exit 1
        fi

    - name: Test Session Security
      run: |
        # Login and get token
        TOKEN=$(curl -s -X POST http://localhost:8080/api/v1/auth/login \
          -H "Content-Type: application/json" \
          -d '{"email":"test@example.com","password":"Test123!@#"}' | jq -r '.access_token')

        # Verify token is JWT
        if [[ ! "$TOKEN" =~ ^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$ ]]; then
          echo "FAIL: Token is not valid JWT format"
          exit 1
        fi

        # Logout
        curl -s -X POST http://localhost:8080/api/v1/auth/logout \
          -H "Authorization: Bearer $TOKEN"

        # Verify token is invalidated
        response=$(curl -s -o /dev/null -w "%{http_code}" \
          http://localhost:8080/api/v1/users/me \
          -H "Authorization: Bearer $TOKEN")

        if [ "$response" != "401" ]; then
          echo "FAIL: Token not invalidated after logout"
          exit 1
        fi
```

---

## 6. Scheduled Security Scans

### 6.1 Weekly Full Scan

```yaml
# .github/workflows/weekly-security-scan.yml
name: Weekly Security Scan

on:
  schedule:
    - cron: '0 3 * * 0'  # Sunday 3 AM
  workflow_dispatch:

jobs:
  full-security-scan:
    name: Comprehensive Security Scan
    runs-on: ubuntu-latest

    steps:
      - name: OWASP ZAP Extended Scan
        uses: zaproxy/action-full-scan@v0.8.0
        with:
          target: 'https://staging.ems.dev'
          cmd_options: '-a -j -T 60'  # Extended timeout

      - name: Nuclei Full Template Scan
        run: |
          nuclei -u https://staging.ems.dev \
            -severity critical,high,medium \
            -t nuclei-templates/ \
            -o nuclei-full-report.json

      - name: SSL/TLS Analysis
        run: |
          docker run --rm drwetter/testssl.sh \
            --jsonfile ssl-report.json \
            https://staging.ems.dev

      - name: Security Headers Check
        run: |
          curl -sI https://staging.ems.dev | grep -E "^(Strict-Transport-Security|Content-Security-Policy|X-Frame-Options|X-Content-Type-Options|X-XSS-Protection):"

      - name: Aggregate Reports
        run: |
          python scripts/aggregate-security-reports.py \
            --zap zap-report.json \
            --nuclei nuclei-full-report.json \
            --ssl ssl-report.json \
            --output weekly-security-report.html

      - name: Send Report
        uses: dawidd6/action-send-mail@v3
        with:
          to: security@ems.com
          subject: Weekly Security Scan Report
          html_body: file://weekly-security-report.html
```

---

## 7. Vulnerability Management

### 7.1 Severity Classification

| Severity | CVSS Score | SLA | Action |
|----------|------------|-----|--------|
| **Critical** | 9.0 - 10.0 | 24 hours | Immediate fix, deploy hotfix |
| **High** | 7.0 - 8.9 | 7 days | Prioritize in current sprint |
| **Medium** | 4.0 - 6.9 | 30 days | Add to backlog, schedule fix |
| **Low** | 0.1 - 3.9 | 90 days | Track, fix in regular development |
| **Informational** | 0.0 | N/A | Document, consider for hardening |

### 7.2 Vulnerability Tracking

```yaml
vulnerability_tracking:
  # Integration with issue tracker
  jira:
    project: "SEC"
    issue_type: "Security Bug"

    priority_mapping:
      critical: "Blocker"
      high: "Critical"
      medium: "Major"
      low: "Minor"

  # Automatic issue creation
  auto_create:
    enabled: true
    threshold: "medium"

  # SLA tracking
  sla:
    critical:
      response: "4h"
      resolution: "24h"
    high:
      response: "24h"
      resolution: "7d"
```

---

## 8. Reporting

### 8.1 DAST Report Template

```markdown
# DAST Security Report

## Executive Summary
- **Scan Date**: {{date}}
- **Target**: {{target}}
- **Duration**: {{duration}}
- **Findings**: {{total_findings}}

## Risk Summary
| Severity | Count | % |
|----------|-------|---|
| Critical | {{critical}} | {{critical_pct}} |
| High | {{high}} | {{high_pct}} |
| Medium | {{medium}} | {{medium_pct}} |
| Low | {{low}} | {{low_pct}} |

## Critical Findings
{{#each critical_findings}}
### {{name}}
- **URL**: {{url}}
- **CWE**: {{cwe}}
- **Description**: {{description}}
- **Remediation**: {{remediation}}
{{/each}}

## Recommendations
1. Address all critical and high findings immediately
2. Review and fix medium findings within sprint
3. Track low findings in backlog

## Appendix
- Full scan log: [Download]({{log_url}})
- JSON report: [Download]({{json_url}})
```

---

## 9. Security Gates

### 9.1 Pipeline Gates

```yaml
security_gates:
  # Pull Request gate
  pull_request:
    blocking: true
    rules:
      - "critical == 0"
      - "high == 0"
      - "no new vulnerabilities"

  # Staging deployment gate
  staging:
    blocking: true
    rules:
      - "critical == 0"
      - "high == 0"
      - "DAST scan completed"

  # Production deployment gate
  production:
    blocking: true
    rules:
      - "critical == 0"
      - "high == 0"
      - "medium < 5"
      - "all scans passed in last 24h"
      - "security team approval"
```

---

## 10. Related Documents

- [WAF-CONFIGURATION.md](WAF-CONFIGURATION.md) - WAF rules
- [DDOS-PROTECTION.md](DDOS-PROTECTION.md) - DDoS protection
- Security Playbooks - Incident response

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0.0 | 2024 | Security Team | Initial release |
