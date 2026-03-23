# ISSUE-INF-015: Kafka Has No SASL Authentication

| Field | Value |
|-------|-------|
| Severity | HIGH |
| Category | Security |
| Source | SEC-11 |
| Priority | P1 |
| Status | OPEN |
| Opened | 2026-03-02 |
| Blocked By | — |
| Fixes | docker-compose.*.yml, .env.example |
| Closes With | Phase 2 — Docker Tier Split |

## Description

Kafka broker uses plaintext listener (`PLAINTEXT://`) without SASL authentication. Any container on the Docker network can produce or consume messages without credentials.

## Evidence

- docker-compose.dev.yml: Kafka listener `PLAINTEXT://kafka:9092`
- No SASL_PLAINTEXT or SASL_SSL listener configured
- No KAFKA_SASL_PASSWORD or JAAS configuration

## Remediation

1. Add SASL_PLAINTEXT authentication to Kafka broker
2. Configure JAAS with username/password from `.env` file
3. Update any Kafka producers/consumers to use SASL credentials

Note: Currently there are no active Kafka producers (see ISSUE-INF-024), so consumer-side configuration is the immediate concern.

## Acceptance Criteria

- [ ] Kafka broker requires SASL authentication
- [ ] Unauthenticated connections are rejected
- [ ] Kafka credentials in `.env` file, not in source code
