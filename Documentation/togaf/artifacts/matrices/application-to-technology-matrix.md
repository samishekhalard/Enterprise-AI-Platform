> **WP-ARCH-ALIGN (2026-03-24):** This document has been updated to reflect the frozen auth target model (Rev 2).
> See `Foundation/03-ownership-boundaries.md` FROZEN for the canonical decision.

# Application to Technology Matrix

This matrix maps each EMSIST application component to its full technology stack including runtime, framework, database, cache, messaging, security, monitoring, and container runtime.

## Matrix

| Application | Runtime | Framework | Database | Cache | Messaging | Security Stack | Monitoring Stack | Container Runtime |
|-------------|---------|-----------|----------|-------|-----------|---------------|-----------------|-------------------|
| api-gateway | Java 23 | Spring Cloud Gateway | - | Valkey 8 | - | Spring Security, JWT validation, route-level filters | Micrometer + Actuator | Docker (current), K8s Pod (target) |
| auth-facade | Java 23 | Spring Boot 3.4.1 | [AS-IS] Neo4j 5.x (Community) | [AS-IS] Valkey 8 | - | Spring Security, Jasypt AES-256 [IMPLEMENTED], Keycloak client, JWT issuing | Micrometer + Actuator | Docker (current), K8s Pod (target) | [TRANSITION] Service removed after migration. Neo4j RBAC data migrates to tenant-service (PostgreSQL). Auth endpoints migrate to api-gateway. |
| tenant-service | Java 23 | Spring Boot 3.4.1 | PostgreSQL 16 | - | Kafka (planned) | Spring Security, JWT validation, Jasypt (planned) | Micrometer + Actuator | Docker (current), K8s Pod (target) |
| user-service | Java 23 | Spring Boot 3.4.1 | PostgreSQL 16 | - | Kafka (planned) | Spring Security, JWT validation, Jasypt (planned) | Micrometer + Actuator | Docker (current), K8s Pod (target) |
| license-service | Java 23 | Spring Boot 3.4.1 | PostgreSQL 16 | Valkey 8 | Kafka (planned) | Spring Security, JWT validation, Jasypt (planned) | Micrometer + Actuator | Docker (current), K8s Pod (target) |
| notification-service | Java 23 | Spring Boot 3.4.1 | PostgreSQL 16 | - | Kafka (consumer, disabled by default) | Spring Security, JWT validation, Jasypt (planned) | Micrometer + Actuator | Docker (current), K8s Pod (target) |
| audit-service | Java 23 | Spring Boot 3.4.1 | PostgreSQL 16 | - | Kafka (consumer, disabled by default) | Spring Security, JWT validation, Jasypt (planned) | Micrometer + Actuator | Docker (current), K8s Pod (target) |
| ai-service | Java 23 | Spring Boot 3.4.1 | PostgreSQL 16 (pgvector) | Valkey (planned) | Kafka (planned) | Spring Security, JWT validation, Jasypt (planned) | Micrometer + Actuator | Docker (current), K8s Pod (target) |
| definition-service | Java 23 | Spring Boot 3.4.1 | Neo4j 5.x (Community) | - | Kafka (planned) | Spring Security, JWT validation, Jasypt (planned) | Micrometer + Actuator | Docker (current), K8s Pod (target) |
| service-registry | Java 23 | Spring Cloud Netflix Eureka | - | - | - | - | Actuator health endpoint | Docker (current), K8s Pod (target) |
| frontend | TypeScript 5.x | Angular 21+ | - | Browser memory | - | HTTPS, CSRF protection, JWT in memory | - | Docker nginx (current), K8s Pod (target) |
| Keycloak | Java | Keycloak 24.x runtime | PostgreSQL 16 (dedicated) | Infinispan (embedded) | - | Built-in identity/OAuth2/OIDC, SCRAM-SHA-256 DB auth | Built-in metrics endpoint | Docker (current), K8s Pod (target) |

## Infrastructure Services

| Component | Technology | Version | Purpose | Container Runtime |
|-----------|-----------|---------|---------|-------------------|
| Docker Compose | Docker | Latest | Development + Staging orchestration | Host Docker Engine |
| Kubernetes | K8s | Target (not yet deployed) | Staging + Production orchestration | containerd |
| Ingress Controller | NGINX / Traefik | Target | Edge routing + TLS termination | K8s Pod (target) |
| CDN / WAF | CloudFront / Cloudflare | Target | Static asset caching + DDoS protection | External (managed) |

## Security Stack Detail

| Component | Technology | Scope | Status |
|-----------|-----------|-------|--------|
| Config Encryption | Jasypt PBEWITHHMACSHA512ANDAES_256 | Sensitive `application.yml` values wrapped in `ENC()` | [IMPLEMENTED] auth-facade only; [PLANNED] all other services |
| Authentication Framework | Spring Security + Keycloak adapter | All backend services | [IMPLEMENTED] |
| JWT Validation | Spring Security OAuth2 Resource Server | All backend services except service-registry | [IMPLEMENTED] |
| Identity Provider | Keycloak 24 | OIDC/OAuth2 provider | [IMPLEMENTED] (Keycloak only; Auth0/Okta/Azure AD planned) |
| TLS (service-to-DB) | PostgreSQL `sslmode=verify-full` | 6 of 7 PG services (excludes ai-service) | [IMPLEMENTED] for 6 services; [PLANNED] for ai-service |
| TLS (Neo4j) | `bolt+s://` | auth-facade + definition-service to Neo4j | [PLANNED] |
| TLS (Valkey) | `--tls-port` + `ssl.enabled=true` | auth-facade, api-gateway, license-service to Valkey | [PLANNED] |
| TLS (Kafka) | `SASL_SSL` | All services to Kafka | [PLANNED] |

## Monitoring Stack Detail

| Component | Technology | Scope | Status |
|-----------|-----------|-------|--------|
| Health Checks | Spring Boot Actuator `/actuator/health` | All Spring services | [IMPLEMENTED] |
| Metrics Export | Micrometer (Prometheus registry) | All Spring services | [IMPLEMENTED] -- Actuator metrics endpoint available |
| Prometheus | Prometheus server | Cluster-wide scraping | [PLANNED] |
| Grafana | Grafana dashboards | Visualization | [PLANNED] |
| Distributed Tracing | Micrometer Tracing (Zipkin/Jaeger) | Cross-service trace propagation | [PLANNED] |
| Structured Logging | Logback JSON encoder | All Spring services | [IN-PROGRESS] |

## Container Runtime Detail

| Environment | Orchestration | Image Registry | Deployment Strategy |
|-------------|--------------|----------------|---------------------|
| Development | Docker Compose (`docker-compose.dev.yml`) | Local builds | Manual `docker compose up` |
| Staging | Docker Compose (`docker-compose.staging.yml`) | Local / private registry | Manual deployment |
| Production (target) | Kubernetes (Helm charts) | Private container registry | Rolling updates with PDB, HPA |

## Legend

| Tag | Meaning |
|-----|---------|
| `[IMPLEMENTED]` | Verified in code / configuration |
| `[IN-PROGRESS]` | Partially built |
| `[PLANNED]` | Design only, not yet built |
| `(current)` | Active in current deployment |
| `(target)` | Planned for future deployment |
| `(planned)` | Feature designed but not yet implemented |

## Notes

- **Java 23** is used for development; **Java 21 LTS** is the production target.
- **auth-facade** and **definition-service** both use Neo4j [AS-IS]. [TARGET] Neo4j is used by definition-service only; auth-facade is a [TRANSITION] service to be removed (RBAC/user data migrates to tenant-service on PostgreSQL, auth endpoints migrate to api-gateway). auth-facade additionally has Valkey (active) and Jasypt config encryption implemented. api-gateway and license-service also use Valkey actively.
- **PostgreSQL 16** serves 6 domain services (tenant, user, license, notification, audit, ai) + process-service + Keycloak (8 total consumers), each with a separate logical database. definition-service and auth-facade use Neo4j instead.
- **Kafka** infrastructure (Confluent 7.5.0) is deployed. audit-service and notification-service have `@KafkaListener` consumers with `KafkaConfig` classes, gated by `@ConditionalOnProperty(name = "spring.kafka.enabled", havingValue = "true")` and disabled by default (`KAFKA_ENABLED:false`). No producer (KafkaTemplate) exists in any service.
- **service-registry** (Eureka) has no security stack because it runs on an internal network and is not exposed externally.
- **definition-service** (port 8090, Neo4j) and **process-service** (port 8089, PostgreSQL) both have active source code and coexist in the deployment inventory.
- **Monitoring**: Actuator health endpoints are operational for all Spring services. Full observability stack (Prometheus, Grafana, distributed tracing) is planned.
