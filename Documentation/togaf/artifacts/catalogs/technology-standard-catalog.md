> **WP-ARCH-ALIGN (2026-03-24):** This document has been updated to reflect the frozen auth target model (Rev 2).
> See `Foundation/03-ownership-boundaries.md` S FROZEN for the canonical decision.

# Technology Standard Catalog

> **Last Updated:** 2026-03-08
> **Status:** Active
> **Source:** TOGAF Phase D (Technology Architecture), ADR references, EMSIST Implementation Truth

## Overview

This catalog defines all technology standards adopted or targeted by the EMSIST platform. Each entry includes its lifecycle status, governing ADR (if any), and the category of technology concern it addresses.

## Status Definitions

| Status | Definition |
|--------|------------|
| Active | In use in current codebase; verified in pom.xml / package.json / docker-compose.yml |
| Target | Approved for adoption; implementation planned but not yet present in code |
| Planned | Under evaluation; not yet approved |
| Deprecated | Scheduled for removal or replacement |

## Technology Standards

### Core Runtime

| Standard ID | Category | Technology | Version | Status | ADR Reference | Rationale |
|-------------|----------|------------|---------|--------|---------------|-----------|
| TS-001 | Language | Java | 23 (dev) / 21 LTS (prod) | Active | - | Language and runtime baseline; virtual threads, pattern matching |
| TS-002 | Backend Framework | Spring Boot | 3.4.1 | Active | ADR-002 | Microservice framework; auto-configuration, actuator, cloud-native support |
| TS-003 | Frontend Framework | Angular | 21+ | Active | - | SPA framework; standalone components, signals, OnPush change detection |
| TS-004 | Frontend Language | TypeScript | 5.x | Active | - | Type-safe frontend development |

### Data Persistence

| Standard ID | Category | Technology | Version | Status | ADR Reference | Rationale |
|-------------|----------|------------|---------|--------|---------------|-----------|
| TS-005 | Graph Database | Neo4j | 5.x (Community) | Active | ADR-001 | [AS-IS] RBAC identity graph for auth-facade AND object type definitions for definition-service. [TARGET] Object type definitions for definition-service only; RBAC migrates to tenant-service (PostgreSQL). Spring Data Neo4j |
| TS-006 | Relational Database | PostgreSQL | 16+ | Active | ADR-016 | Primary data store for 7 domain services (tenant, user, license, notification, audit, ai, process) + Keycloak persistence |
| TS-007 | Vector Database | pgvector (PostgreSQL extension) | Latest | Active | - | Vector embeddings for AI/RAG retrieval in ai-service |
| TS-008 | Distributed Cache | Valkey | 8+ | Active | ADR-005 | Redis-compatible; active usage: auth-facade (sessions, tokens, roles, rate limiting), api-gateway (token blacklist), license-service (feature gates, seat validation) |
| TS-009 | Database Migration | Flyway | Latest | Active | - | Schema versioning for all PostgreSQL services |
| TS-010 | Graph Migration | Neo4j Migrations | Latest | Active | - | [AS-IS] Schema versioning for Neo4j (auth-facade). [TARGET] Schema versioning for Neo4j (definition-service only); auth-facade removed |

### Messaging and Integration

| Standard ID | Category | Technology | Version | Status | ADR Reference | Rationale |
|-------------|----------|------------|---------|--------|---------------|-----------|
| TS-011 | Event Streaming | Apache Kafka | 7.5.0 (Confluent) | Active | - | Async integration backbone; event-driven architecture |
| TS-012 | Service Discovery | Netflix Eureka | Spring Cloud 2024.x | Active | -- (ADR recommended) | Service registry at :8761; 10 client services register; api-gateway uses lb:// discovery for all routes; Feign client resolution |
| TS-013 | API Gateway | Spring Cloud Gateway | 2024.x | Active | - | Centralized routing, rate limiting, circuit breaking, CORS |

### Identity and Authentication

| Standard ID | Category | Technology | Version | Status | ADR Reference | Rationale |
|-------------|----------|------------|---------|--------|---------------|-----------|
| TS-014 | Identity Provider | Keycloak | 24.x | Active | ADR-004 | Default OIDC/OAuth2 provider; realm-per-tenant; only provider currently implemented |
| TS-015 | Auth Pattern | BFF (Backend-for-Frontend) | - | Active | ADR-007 | Zero-redirect authentication; tokens never exposed to browser |
| TS-016 | Identity Provider | Auth0 | - | Target | ADR-007 | Planned alternative provider; provider-agnostic abstraction exists |
| TS-017 | Identity Provider | Okta | - | Target | ADR-007 | Planned alternative provider |
| TS-018 | Identity Provider | Azure AD / Entra ID | - | Target | ADR-007 | Planned alternative provider |

### Security -- Encryption

| Standard ID | Category | Technology | Version | Status | ADR Reference | Rationale |
|-------------|----------|------------|---------|--------|---------------|-----------|
| TS-019 | Config Encryption | Jasypt | Latest | Active | - | AES-256 encryption for sensitive application.yml properties (DB passwords, API keys) |
| TS-020 | Volume Encryption | LUKS (Linux) / FileVault (macOS) | OS-native | Active | - | Tier 1: full-disk encryption for data-at-rest |
| TS-021 | In-Transit Encryption | TLS | 1.2+ | Active | - | Tier 2: all service-to-service and client-to-gateway communication encrypted |
| TS-022 | DB Authentication | SCRAM-SHA-256 | - | Active | - | Per-service PostgreSQL credentials; no shared superuser |
| TS-023 | Password Hashing | BCrypt | - | Active | - | Keycloak default password hashing; EMSIST does not handle raw passwords |

### Infrastructure -- Current

| Standard ID | Category | Technology | Version | Status | ADR Reference | Rationale |
|-------------|----------|------------|---------|--------|---------------|-----------|
| TS-024 | Containerization | Docker | 24+ | Active | - | Container runtime for all services |
| TS-025 | Local Orchestration | Docker Compose | 2.x | Active | - | Dev/staging environment orchestration |

### Infrastructure -- Target

| Standard ID | Category | Technology | Version | Status | ADR Reference | Rationale |
|-------------|----------|------------|---------|--------|---------------|-----------|
| TS-026 | Production Orchestration | Kubernetes | 1.28+ | Target | - | Production container orchestration; HA, autoscaling, rolling updates |
| TS-027 | Database Operator | CloudNativePG | Latest | Target | - | Kubernetes-native PostgreSQL operator; automated failover, backup |
| TS-028 | Messaging Operator | Strimzi | Latest | Target | - | Kubernetes-native Kafka operator; cluster management |

### Monitoring and Observability

| Standard ID | Category | Technology | Version | Status | ADR Reference | Rationale |
|-------------|----------|------------|---------|--------|---------------|-----------|
| TS-029 | Metrics Collection | Micrometer | Latest | Active | - | Vendor-neutral metrics facade; integrated with Spring Boot Actuator |
| TS-030 | Health Checks | Spring Boot Actuator | 3.4.1 | Active | - | /health, /info, /metrics endpoints for all services |
| TS-031 | Metrics Storage | Prometheus | Latest | Target | - | Time-series metrics database; alerting rules |
| TS-032 | Dashboards | Grafana | Latest | Target | - | Metrics visualization, alerting, SLO dashboards |
| TS-033 | Log Aggregation | ELK Stack / Loki | Latest | Planned | - | Centralized log aggregation; under evaluation |
| TS-034 | Distributed Tracing | OpenTelemetry / Jaeger | Latest | Planned | - | Request tracing across microservices; under evaluation |

### CI/CD and Code Quality

| Standard ID | Category | Technology | Version | Status | ADR Reference | Rationale |
|-------------|----------|------------|---------|--------|---------------|-----------|
| TS-035 | CI/CD Pipeline | GitHub Actions | N/A | Active | - | Automated build, test, and deployment pipelines |
| TS-036 | SAST | SonarQube / SonarCloud | Latest | Active | - | Static analysis; code quality gates; vulnerability detection |
| TS-037 | SCA | OWASP Dependency-Check | Latest | Active | - | Third-party dependency vulnerability scanning |
| TS-038 | Container Scanning | Trivy | Latest | Active | - | Container image vulnerability scanning |
| TS-039 | DAST | OWASP ZAP | Latest | Target | - | Dynamic application security testing in staging |

### Testing Frameworks

| Standard ID | Category | Technology | Version | Status | ADR Reference | Rationale |
|-------------|----------|------------|---------|--------|---------------|-----------|
| TS-040 | Backend Unit Testing | JUnit 5 | 5.x | Active | - | Java unit and integration test framework |
| TS-041 | Backend Mocking | Mockito | Latest | Active | - | Mock framework for isolated unit tests |
| TS-042 | Integration Testing | Testcontainers | Latest | Active | - | Ephemeral Docker containers for Neo4j, PostgreSQL, Valkey, Kafka in tests |
| TS-043 | Frontend Unit Testing | Vitest | Latest | Active | - | Fast frontend unit testing with TypeScript support |
| TS-044 | E2E Testing | Playwright | Latest | Active | - | Cross-browser E2E testing; responsive and accessibility testing |
| TS-045 | Load Testing | k6 / Gatling | Latest | Target | - | Performance and load testing; SLO validation |

### Build and Development Tools

| Standard ID | Category | Technology | Version | Status | ADR Reference | Rationale |
|-------------|----------|------------|---------|--------|---------------|-----------|
| TS-046 | Backend Build | Maven | 3.9+ | Active | - | Java build tool; multi-module reactor build |
| TS-047 | DTO Mapping | MapStruct | 1.6.x | Active | - | Compile-time DTO-to-entity mapping; type-safe |
| TS-048 | Boilerplate Reduction | Lombok | Latest | Active | - | Annotation-based getter/setter/builder generation |
| TS-049 | API Documentation | SpringDoc OpenAPI | Latest | Active | - | Auto-generated Swagger/OpenAPI from annotations |
| TS-050 | Frontend Build | Angular CLI / esbuild | 21+ | Active | - | Frontend build toolchain |
| TS-051 | Process Visualization | bpmn-js | Latest | Active | - | BPMN 2.0 diagram rendering and editing in frontend |
| TS-052 | Data Visualization | ApexCharts | Latest | Active | - | Dashboard charts and data visualization |

## Summary by Status

| Status | Count | Percentage |
|--------|-------|------------|
| Active | 39 | 75% |
| Target | 9 | 17% |
| Planned | 4 | 8% |
| **Total** | **52** | **100%** |

## Summary by Category

| Category | Count | Key Technologies |
|----------|-------|------------------|
| Core Runtime | 4 | Java 23, Spring Boot 3.4.1, Angular 21, TypeScript 5 |
| Data Persistence | 6 | Neo4j, PostgreSQL, pgvector, Valkey, Flyway, Neo4j Migrations |
| Messaging/Integration | 3 | Kafka, Eureka, Spring Cloud Gateway |
| Identity/Auth | 5 | Keycloak, BFF, Auth0 (target), Okta (target), Azure AD (target) |
| Security/Encryption | 5 | Jasypt, LUKS/FileVault, TLS, SCRAM-SHA-256, BCrypt |
| Infrastructure | 5 | Docker, Compose, Kubernetes (target), CloudNativePG (target), Strimzi (target) |
| Monitoring | 6 | Micrometer, Actuator, Prometheus (target), Grafana (target), ELK (planned), OTel (planned) |
| CI/CD/Quality | 5 | GitHub Actions, SonarQube, OWASP DC, Trivy, ZAP (target) |
| Testing | 6 | JUnit 5, Mockito, Testcontainers, Vitest, Playwright, k6 (target) |
| Build/Dev Tools | 7 | Maven, MapStruct, Lombok, SpringDoc, Angular CLI, bpmn-js, ApexCharts |
