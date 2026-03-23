# ISSUE-INF-021: No TLS for Valkey Connections

| Field | Value |
|-------|-------|
| Severity | MEDIUM |
| Category | Encryption |
| Source | Infrastructure Audit |
| Priority | P2 |
| Status | OPEN |
| Opened | 2026-03-02 |
| Blocked By | — |
| Fixes | docker-compose.*.yml, backend service application.yml |
| Closes With | Valkey TLS configuration + Spring `ssl.enabled=true` |
| ADR | ADR-019 |

## Description

All connections between backend services and Valkey use plaintext TCP (port 6379). Token blacklist entries, role caches, and MFA pending states are transmitted unencrypted on the Docker network.

## Evidence

- docker-compose.dev.yml: Valkey exposes port `6379` (plaintext)
- No `--tls-port`, `--tls-cert-file`, `--tls-key-file` in Valkey command
- `spring.data.redis.ssl.enabled` not set in any service
- auth-facade `application.yml`: `spring.data.redis.host: valkey` (no TLS)

## Remediation

1. Generate TLS certificates for Valkey (self-signed for dev, CA-signed for staging/production)
2. Configure Valkey with `--tls-port 6380 --port 0` (disable plaintext)
3. Add `spring.data.redis.ssl.enabled: true` to consuming services
4. Mount certificates via Docker volumes

## Acceptance Criteria

- [ ] Valkey accepts only TLS connections
- [ ] Plaintext port 6379 is disabled
- [ ] All consuming services connect via TLS
- [ ] Certificate rotation documented
