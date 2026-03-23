# ADR-002: Spring Boot 3.4.1 with Java 23

**Status:** Accepted
**Date:** 2026-02-24
**Decision Makers:** Architecture Team

## Context

EMS backend services need a modern, well-supported framework with:
- Robust dependency injection and configuration
- Native support for reactive and traditional web applications
- Strong security framework integration
- Excellent observability (metrics, tracing, health checks)
- Active community and LTS support

The team evaluated Spring Boot versions and Java versions for development and production use.

## Decision

**Use Spring Boot 3.4.1 with Java 23 for development, with Java 21 LTS as production fallback.**

### Technology Versions

| Component | Version | Notes |
|-----------|---------|-------|
| Java | 23 (dev) / 21 (prod) | Java 21 is LTS, 23 for latest features |
| Spring Boot | 3.4.1 | Latest stable release |
| Spring Cloud | 2024.0.0 | Compatible BOM |
| Keycloak Client | 24.0.1 | Identity integration |
| Flyway | 10.8.1 | Database migrations |
| MapStruct | 1.5.5 | DTO mapping |

### Configuration

```xml
<parent>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-parent</artifactId>
    <version>3.4.1</version>
</parent>

<properties>
    <java.version>23</java.version>
    <spring-cloud.version>2024.0.0</spring-cloud.version>
</properties>
```

## Consequences

### Positive

- **Latest features** - Virtual threads, pattern matching, record patterns
- **Performance** - Spring Boot 3.x optimizations and GraalVM native support
- **Security** - Latest security patches and Spring Security 6.x
- **Observability** - Micrometer, Prometheus, distributed tracing
- **Developer experience** - Enhanced dev tools, faster restarts

### Negative

- **Lombok compatibility** - Requires edge-SNAPSHOT for Java 23
- **Learning curve** - Jakarta EE namespace changes from Spring Boot 2.x
- **Dependency updates** - Some third-party libraries may lag

### Neutral

- Native compilation (GraalVM) available but not currently used
- Virtual threads available but not yet adopted for all services

## Alternatives Considered

### 1. Spring Boot 2.7.x (LTS)

**Rejected because:**
- End of OSS support
- Missing Spring Security 6 features
- No Jakarta EE compatibility
- Missing observability improvements

### 2. Quarkus

**Rejected because:**
- Smaller ecosystem than Spring
- Team expertise is in Spring
- Less mature Keycloak integration
- Fewer production deployments to reference

### 3. Micronaut

**Rejected because:**
- Similar to Quarkus concerns
- Spring has better enterprise adoption
- Existing code patterns are Spring-based

## Implementation Notes

### Java 21 Production Fallback

For production environments requiring LTS Java:

```xml
<properties>
    <java.version>21</java.version>
    <lombok.version>1.18.36</lombok.version> <!-- Stable release -->
</properties>
```

### Lombok with Java 23

Development requires Lombok edge-SNAPSHOT:

```xml
<lombok.version>edge-SNAPSHOT</lombok.version>

<repository>
    <id>lombok-edge</id>
    <url>https://projectlombok.org/edge-releases</url>
</repository>
```

### Module Dependencies

All microservices share:
- `spring-boot-starter-web` - REST APIs
- `spring-boot-starter-data-jpa` - Database access
- `spring-boot-starter-security` - Security framework
- `spring-boot-starter-actuator` - Observability
- `spring-boot-starter-validation` - Input validation

## References

- [Spring Boot 3.4 Release Notes](https://github.com/spring-projects/spring-boot/wiki/Spring-Boot-3.4-Release-Notes)
- [Java 23 Features](https://openjdk.org/projects/jdk/23/)
- [Spring Cloud 2024.0.0](https://spring.io/blog/2024/11/spring-cloud-2024-0-0)

---

**Supersedes:** Initial documentation referencing Spring Boot 3.2.3
