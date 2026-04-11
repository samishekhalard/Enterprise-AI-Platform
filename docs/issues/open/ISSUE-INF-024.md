# ISSUE-INF-024: Kafka Dead Listeners (Consumers Without Producers)

| Field | Value |
|-------|-------|
| Severity | MEDIUM |
| Category | Architecture |
| Source | SA-AUDIT-2026-002 |
| Priority | P2 |
| Status | OPEN |
| Opened | 2026-03-02 |
| Blocked By | — |
| Fixes | Backend services, docker-compose |
| Closes With | Either implement Kafka producers or remove Kafka dependency |

## Description

Kafka broker is running in the Docker Compose stack, and some services have `spring-kafka` dependency configured. However, no service currently produces messages to any Kafka topic. Consumers are listening on topics that never receive messages, wasting resources and creating misleading architecture.

## Evidence

- docker-compose: Kafka broker running with Zookeeper
- No `KafkaTemplate.send()` calls found in any backend service
- `spring.kafka.bootstrap-servers` configured in some services
- arc42/06 claims "source services publish to Kafka" — this is aspirational, not implemented

## Remediation

Options (in order of preference):
1. **Implement event producers:** Add KafkaTemplate to services that should publish events (audit, notification)
2. **Remove Kafka:** If async messaging is not needed yet, remove Kafka from Docker Compose to reduce resource usage
3. **Document as planned:** Keep Kafka running but document it as `[PLANNED]` infrastructure

## Acceptance Criteria

- [ ] Either: Kafka has active producers AND consumers, OR
- [ ] Kafka is removed from Docker Compose, OR
- [ ] Kafka is documented as `[PLANNED]` with clear implementation timeline
