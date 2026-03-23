# EMS DDoS Protection Strategy

## Document Control

| Property | Value |
|----------|-------|
| **Document ID** | SEC-DDOS-001 |
| **Version** | 1.0.0 |
| **Classification** | Confidential |
| **Owner** | Security Team |
| **Last Review** | 2024 |

---

## 1. Overview

### 1.1 Purpose

This document defines the comprehensive DDoS protection strategy for EMS, covering Layer 3/4 (Network) and Layer 7 (Application) attack mitigation.

### 1.2 Protection Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       DDoS PROTECTION ARCHITECTURE                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│                            ATTACK TRAFFIC                                   │
│                                 │                                           │
│                                 ▼                                           │
│  ┌───────────────────────────────────────────────────────────────────────┐ │
│  │                    LAYER 3/4 PROTECTION                                │ │
│  │  ┌─────────────────────────────────────────────────────────────────┐  │ │
│  │  │                 CLOUDFLARE SPECTRUM                              │  │ │
│  │  │  • Anycast Network (310+ data centers)                          │  │ │
│  │  │  • 209 Tbps network capacity                                    │  │ │
│  │  │  • Automatic mitigation in < 3 seconds                          │  │ │
│  │  │  • SYN flood, UDP flood, ICMP flood protection                  │  │ │
│  │  └─────────────────────────────────────────────────────────────────┘  │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
│                                 │                                           │
│                                 ▼                                           │
│  ┌───────────────────────────────────────────────────────────────────────┐ │
│  │                    LAYER 7 PROTECTION                                  │ │
│  │  ┌─────────────────────────────────────────────────────────────────┐  │ │
│  │  │                 CLOUDFLARE WAF + BOT MGMT                        │  │ │
│  │  │  • HTTP flood protection                                        │  │ │
│  │  │  • Rate limiting                                                │  │ │
│  │  │  • Bot management                                               │  │ │
│  │  │  • JavaScript/CAPTCHA challenges                                │  │ │
│  │  │  • Under Attack Mode                                            │  │ │
│  │  └─────────────────────────────────────────────────────────────────┘  │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
│                                 │                                           │
│                                 ▼                                           │
│  ┌───────────────────────────────────────────────────────────────────────┐ │
│  │                    APPLICATION LAYER                                   │ │
│  │  ┌─────────────────────────────────────────────────────────────────┐  │ │
│  │  │                 API GATEWAY + AUTO-SCALING                       │  │ │
│  │  │  • Per-tenant rate limiting                                     │  │ │
│  │  │  • Circuit breakers                                             │  │ │
│  │  │  • Queue-based load leveling                                    │  │ │
│  │  │  • Kubernetes HPA                                               │  │ │
│  │  └─────────────────────────────────────────────────────────────────┘  │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
│                                 │                                           │
│                                 ▼                                           │
│                    ┌────────────────────────┐                              │
│                    │   EMS Application   │                              │
│                    │   (Protected)           │                              │
│                    └────────────────────────┘                              │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Attack Classification

### 2.1 Attack Types & Mitigation

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         ATTACK TYPE MATRIX                                  │
├───────────────┬─────────────────┬───────────────────────────────────────────┤
│ Layer         │ Attack Type     │ Mitigation Strategy                       │
├───────────────┼─────────────────┼───────────────────────────────────────────┤
│ L3 (Network)  │ ICMP Flood      │ Anycast + rate limit at edge              │
│               │ IP Fragmentation│ Packet reassembly limits                  │
│               │ Smurf Attack    │ Directed broadcast filtering              │
├───────────────┼─────────────────┼───────────────────────────────────────────┤
│ L4 (Transport)│ SYN Flood       │ SYN cookies, TCP proxy                    │
│               │ UDP Flood       │ UDP rate limiting, protocol validation    │
│               │ ACK Flood       │ Connection state tracking                 │
│               │ NTP Amplification│ NTP reflection filtering                 │
│               │ DNS Amplification│ DNS response rate limiting               │
├───────────────┼─────────────────┼───────────────────────────────────────────┤
│ L7 (Application)│ HTTP Flood    │ Rate limiting, CAPTCHA, bot detection     │
│               │ Slowloris       │ Connection timeout, max connections       │
│               │ RUDY (POST)     │ Request body timeout                      │
│               │ API Abuse       │ API rate limiting, authentication         │
│               │ Cache Bypass    │ Query normalization, cache controls       │
└───────────────┴─────────────────┴───────────────────────────────────────────┘
```

### 2.2 Attack Severity Levels

| Level | Bandwidth | Impact | Response |
|-------|-----------|--------|----------|
| **LOW** | < 1 Gbps | Minor latency | Automatic mitigation |
| **MEDIUM** | 1-10 Gbps | Noticeable degradation | Enhanced mitigation + alert |
| **HIGH** | 10-100 Gbps | Service disruption | Immediate response + escalation |
| **CRITICAL** | > 100 Gbps | Potential outage | War room + all hands |

---

## 3. Layer 3/4 Protection

### 3.1 Cloudflare Spectrum Configuration

```yaml
cloudflare_spectrum:
  enabled: true

  # TCP Applications
  applications:
    - name: "ems-https"
      protocol: "tcp/443"
      origin: "api.ems.com:443"
      ip_firewall: true
      proxy_protocol: "v1"

    - name: "ems-websocket"
      protocol: "tcp/443"
      origin: "ws.ems.com:443"
      ip_firewall: true

  # DDoS settings
  ddos:
    sensitivity: "high"
    action: "block"
```

### 3.2 AWS Shield Advanced

```yaml
aws_shield:
  tier: "Advanced"  # Required for DDoS Response Team (DRT)

  protected_resources:
    - type: "application_load_balancer"
      arn: "arn:aws:elasticloadbalancing:us-east-1:123456789:loadbalancer/app/ems-alb"

    - type: "cloudfront_distribution"
      arn: "arn:aws:cloudfront::123456789:distribution/E1234567890ABC"

    - type: "route53_hosted_zone"
      arn: "arn:aws:route53:::hostedzone/Z1234567890ABC"

  # DDoS Response Team access
  drt_access:
    enabled: true
    role_arn: "arn:aws:iam::123456789:role/aws-shield-drt-access"

  # Proactive engagement
  proactive_engagement:
    enabled: true
    emergency_contacts:
      - email: "security@ems.com"
        phone: "+1-555-123-4567"
```

### 3.3 Network-Level Protections

```yaml
network_protection:
  # Anycast routing
  anycast:
    enabled: true
    providers:
      - cloudflare  # Primary
      - aws_global_accelerator  # Secondary

  # IP reputation
  ip_reputation:
    provider: "cloudflare"
    action:
      known_bad: "block"
      suspicious: "challenge"

  # GeoIP filtering
  geo_filtering:
    mode: "allowlist"  # or "blocklist"
    allowlist:
      - "AE"  # UAE
      - "US"  # USA
      - "EU"  # Europe
      - "GB"  # UK
    # Blocklist high-risk countries during attack
    emergency_blocklist:
      - "KP"
      - "IR"
```

---

## 4. Layer 7 Protection

### 4.1 HTTP Flood Protection

```yaml
http_flood_protection:
  # Rate limiting
  rate_limits:
    # Global limit
    - name: "global"
      requests_per_second: 10000
      burst: 50000
      action: "challenge"

    # Per-IP limit
    - name: "per_ip"
      requests_per_minute: 600
      action: "block"
      block_duration: "10m"

    # Per-session limit
    - name: "per_session"
      requests_per_minute: 300
      action: "challenge"

  # Challenge modes
  challenges:
    javascript:
      enabled: true
      delay_seconds: 5

    captcha:
      enabled: true
      provider: "turnstile"  # Cloudflare Turnstile

    managed:
      enabled: true
      sensitivity: "high"
```

### 4.2 Slowloris & Slow POST Protection

```yaml
slow_attack_protection:
  # Connection limits
  connections:
    max_per_ip: 100
    idle_timeout: "60s"

  # Request timeouts
  timeouts:
    headers: "20s"       # Time to receive all headers
    body: "60s"          # Time to receive body
    body_rate: "1000"    # Minimum bytes/second for body

  # Nginx configuration
  nginx:
    client_body_timeout: "60s"
    client_header_timeout: "20s"
    keepalive_timeout: "75s"
    send_timeout: "60s"
    limit_conn_zone: "$binary_remote_addr zone=addr:10m"
    limit_conn: "addr 100"
```

### 4.3 Under Attack Mode

```yaml
under_attack_mode:
  # Automatic triggering
  auto_trigger:
    enabled: true
    conditions:
      - metric: "requests_per_second"
        threshold: 50000
        duration: "1m"

      - metric: "error_rate"
        threshold: 0.3
        duration: "2m"

      - metric: "unique_ips"
        threshold: 100000
        duration: "5m"

  # Manual override
  manual:
    enabled: true
    api_endpoint: "POST /admin/ddos/under-attack-mode"

  # Settings when activated
  settings:
    javascript_challenge: true
    challenge_passage: "5m"  # Exempt for 5 minutes after passing
    security_level: "under_attack"
```

---

## 5. Application-Layer Defenses

### 5.1 API Gateway Protection

```yaml
api_gateway:
  # Rate limiting per tenant
  tenant_rate_limits:
    free:
      requests_per_minute: 60
      burst: 10

    professional:
      requests_per_minute: 600
      burst: 100

    enterprise:
      requests_per_minute: 6000
      burst: 1000

  # Circuit breaker
  circuit_breaker:
    failure_threshold: 50        # 50% failure rate
    sampling_duration: "10s"
    break_duration: "30s"
    half_open_requests: 5

  # Load shedding
  load_shedding:
    enabled: true
    threshold:
      cpu: 80
      memory: 85
      queue_depth: 1000
    action: "503"
    priority_paths:
      - "/health"
      - "/api/v1/auth/*"
```

### 5.2 Auto-Scaling Configuration

```yaml
kubernetes_hpa:
  api_gateway:
    min_replicas: 3
    max_replicas: 50

    metrics:
      - type: "Resource"
        resource:
          name: "cpu"
          target:
            type: "Utilization"
            averageUtilization: 70

      - type: "Resource"
        resource:
          name: "memory"
          target:
            type: "Utilization"
            averageUtilization: 75

      - type: "External"
        external:
          metric:
            name: "requests_per_second"
            selector:
              matchLabels:
                app: "api-gateway"
          target:
            type: "AverageValue"
            averageValue: "1000"

    scale_up:
      stabilization_window: "30s"
      policies:
        - type: "Pods"
          value: 5
          period_seconds: 30

    scale_down:
      stabilization_window: "300s"
      policies:
        - type: "Pods"
          value: 2
          period_seconds: 60
```

### 5.3 Queue-Based Load Leveling

```yaml
queue_protection:
  # Request queue
  request_queue:
    enabled: true
    provider: "rabbitmq"
    max_queue_depth: 10000

    overflow_action: "reject"
    reject_response:
      status: 503
      body: '{"error": "Service temporarily unavailable"}'
      retry_after: 30

  # Priority queues
  priorities:
    critical:
      paths: ["/api/v1/auth/*", "/health"]
      queue: "requests.critical"
      workers: 20

    normal:
      paths: ["/api/v1/*"]
      queue: "requests.normal"
      workers: 50

    low:
      paths: ["/api/v1/reports/*", "/api/v1/exports/*"]
      queue: "requests.low"
      workers: 10
```

---

## 6. Monitoring & Detection

### 6.1 DDoS Detection Metrics

```yaml
monitoring:
  metrics:
    # Traffic metrics
    - name: "requests_per_second"
      type: "counter"
      labels: ["endpoint", "method", "status"]

    - name: "unique_ips_per_minute"
      type: "gauge"

    - name: "bandwidth_mbps"
      type: "gauge"
      labels: ["direction"]

    # Attack indicators
    - name: "challenge_rate"
      type: "gauge"

    - name: "block_rate"
      type: "gauge"

    - name: "bot_score_distribution"
      type: "histogram"
      buckets: [10, 30, 50, 70, 90]

  # Anomaly detection
  anomaly_detection:
    baseline_period: "7d"
    deviation_threshold: 3  # Standard deviations

    metrics:
      - "requests_per_second"
      - "unique_ips_per_minute"
      - "error_rate"
```

### 6.2 Alert Rules

```yaml
alerts:
  # Traffic anomalies
  - name: "traffic_spike"
    condition: "requests_per_second > 5 * baseline"
    for: "2m"
    severity: "warning"

  - name: "potential_ddos"
    condition: "requests_per_second > 10 * baseline"
    for: "1m"
    severity: "critical"

  # Challenge/Block metrics
  - name: "high_challenge_rate"
    condition: "challenge_rate > 0.3"
    for: "5m"
    severity: "warning"

  - name: "high_block_rate"
    condition: "block_rate > 0.2"
    for: "2m"
    severity: "warning"

  # Resource metrics
  - name: "cpu_spike"
    condition: "cpu_utilization > 0.9"
    for: "3m"
    severity: "critical"

  # Origin health
  - name: "origin_errors"
    condition: "origin_error_rate > 0.1"
    for: "2m"
    severity: "critical"
```

### 6.3 Dashboard Configuration

```yaml
dashboards:
  ddos_overview:
    panels:
      - title: "Request Rate"
        type: "graph"
        query: "sum(rate(http_requests_total[1m]))"

      - title: "Unique IPs"
        type: "graph"
        query: "count(count by (client_ip) (http_requests_total))"

      - title: "Challenge/Block Rate"
        type: "graph"
        queries:
          - "sum(rate(cf_challenges[1m]))"
          - "sum(rate(cf_blocks[1m]))"

      - title: "Geographic Distribution"
        type: "worldmap"
        query: "sum by (country) (http_requests_total)"

      - title: "Attack Indicators"
        type: "stat"
        queries:
          - "cf_threat_score"
          - "bot_traffic_percentage"
```

---

## 7. Response Procedures

### 7.1 Response Playbook

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      DDoS RESPONSE PLAYBOOK                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  PHASE 1: DETECTION (0-5 minutes)                                          │
│  ─────────────────────────────────                                          │
│  □ Alert received / Traffic anomaly detected                               │
│  □ Verify not false positive (legitimate traffic spike)                    │
│  □ Classify attack type and severity                                       │
│  □ Notify on-call engineer and security team                               │
│                                                                             │
│  PHASE 2: INITIAL RESPONSE (5-15 minutes)                                   │
│  ────────────────────────────────────────                                   │
│  □ Enable Under Attack mode (if L7)                                        │
│  □ Increase rate limiting thresholds                                       │
│  □ Activate geo-blocking for attack sources                                │
│  □ Scale up application resources                                          │
│  □ Enable request queuing                                                  │
│                                                                             │
│  PHASE 3: MITIGATION (15-60 minutes)                                       │
│  ────────────────────────────────────                                       │
│  □ Analyze attack patterns                                                 │
│  □ Create custom WAF rules to block attack                                 │
│  □ Contact Cloudflare/AWS DDoS Response Team (if needed)                   │
│  □ Communicate status to stakeholders                                      │
│                                                                             │
│  PHASE 4: RECOVERY (Post-attack)                                           │
│  ─────────────────────────────────                                         │
│  □ Gradually reduce mitigation measures                                    │
│  □ Monitor for attack resumption                                           │
│  □ Document attack details and response                                    │
│  □ Update protection rules based on learnings                              │
│  □ Conduct post-incident review                                            │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 7.2 Emergency Actions

```bash
# Enable Under Attack Mode via API
curl -X PATCH "https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/settings/security_level" \
  -H "Authorization: Bearer ${CF_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"value":"under_attack"}'

# Block specific country
curl -X POST "https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/firewall/rules" \
  -H "Authorization: Bearer ${CF_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "block",
    "filter": {
      "expression": "ip.geoip.country eq \"XX\"",
      "description": "Emergency block - country XX"
    }
  }'

# Scale up immediately
kubectl scale deployment/api-gateway --replicas=20 -n ems-prod

# Enable aggressive rate limiting
kubectl patch configmap rate-limit-config -n ems-prod \
  -p '{"data":{"global_rps":"100","per_ip_rpm":"60"}}'
```

### 7.3 Communication Templates

```markdown
## Internal Communication

**Subject**: DDoS Attack in Progress - [SEVERITY]

Current Status: [ONGOING/MITIGATED]
Start Time: [TIME UTC]
Attack Type: [L3/L4/L7]
Impact: [SERVICE IMPACT]

Current Mitigations:
- [MITIGATION 1]
- [MITIGATION 2]

Next Update: [TIME]

---

## Customer Communication

**Subject**: Service Status Update

We are currently experiencing elevated traffic that is causing
[intermittent slowness/service disruption]. Our team is actively
working to resolve this issue.

Current Status: [STATUS]
Estimated Resolution: [TIME/UNKNOWN]

We apologize for any inconvenience and will provide updates as
the situation develops.

Status Page: https://status.ems.com
```

---

## 8. Testing & Validation

### 8.1 DDoS Simulation Testing

```yaml
ddos_testing:
  # Scheduled tests
  schedule:
    frequency: "quarterly"
    notification: "48 hours advance"

  # Test scenarios
  scenarios:
    - name: "L7 HTTP Flood"
      tool: "locust"
      target_rps: 10000
      duration: "10m"
      expected: "No service degradation"

    - name: "Slowloris"
      tool: "slowloris"
      connections: 1000
      expected: "Connections terminated"

    - name: "Geographic Spike"
      tool: "distributed-load-test"
      regions: ["asia", "europe", "americas"]
      expected: "Load balanced across regions"

  # Validation
  validation:
    - "Alerts triggered appropriately"
    - "Auto-scaling activated"
    - "Under Attack mode functional"
    - "Recovery time < 15 minutes"
```

### 8.2 Tabletop Exercises

```yaml
tabletop_exercises:
  frequency: "semi-annually"
  duration: "2 hours"

  scenarios:
    - name: "Sustained L4 Attack"
      description: "100 Gbps UDP flood for 4 hours"
      questions:
        - "What is the first action?"
        - "Who needs to be notified?"
        - "When do we engage ISP/CDN support?"

    - name: "Application-Layer Attack"
      description: "Sophisticated L7 attack bypassing WAF"
      questions:
        - "How do we identify attack patterns?"
        - "What custom rules can we create?"
        - "How do we protect legitimate users?"
```

---

## 9. Service Provider SLAs

| Provider | SLA | Mitigation Time | Capacity |
|----------|-----|-----------------|----------|
| **Cloudflare** | 100% | < 3 seconds | 209 Tbps |
| **AWS Shield Advanced** | 100% | < 15 minutes | N/A |
| **Emergency Support** | 24/7 | < 15 minutes | DRT access |

---

## 10. Related Documents

- [WAF-CONFIGURATION.md](WAF-CONFIGURATION.md) - WAF rules
- [INCIDENT-RESPONSE-PLAN.md](../operations/INCIDENT-RESPONSE-PLAN.md) - Incident procedures
- [PLAYBOOK-SEC-004-API-ABUSE.md](playbooks/PLAYBOOK-SEC-004-API-ABUSE.md) - API abuse response

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0.0 | 2024 | Security Team | Initial release |
