# Auth Facade - Dynamic Identity Broker

> Multi-tenant, graph-powered authentication facade with dynamic IdP management

## Overview

The Auth Facade is a **Backend-for-Frontend (BFF)** service that acts as a unified authentication layer between the EMS platform and multiple Identity Providers (IdPs). It implements the **Dynamic Identity Broker** pattern, allowing runtime configuration of identity providers without service restarts.

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           Angular Frontend                               │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                      │
│  │ Login Page  │  │ Management  │  │   Guards    │                      │
│  │             │  │     UI      │  │  & Signals  │                      │
│  └──────┬──────┘  └──────┬──────┘  └─────────────┘                      │
└─────────┼────────────────┼──────────────────────────────────────────────┘
          │                │
          ▼                ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                      Auth Facade (This Service)                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐    │
│  │   Auth      │  │   Admin     │  │  Dynamic    │  │    Role     │    │
│  │ Controller  │  │ Controller  │  │  Resolver   │  │  Extractor  │    │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘    │
└─────────┼────────────────┼────────────────┼────────────────┼────────────┘
          │                │                │                │
          ▼                ▼                ▼                ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────────────┐
│  External IdPs  │  │     Neo4j       │  │          Valkey             │
│  ┌───────────┐  │  │  Identity Graph │  │   (Session & Cache)         │
│  │ Keycloak  │  │  │                 │  │                             │
│  │ Auth0     │  │  │ Tenant─Provider │  │  • Token blacklist          │
│  │ Okta      │  │  │ User─Role─Group │  │  • Seat validation cache    │
│  │ Azure AD  │  │  │                 │  │  • Provider config cache    │
│  │ UAE Pass  │  │  │                 │  │                             │
│  │ IBM IAM   │  │  │                 │  │                             │
│  └───────────┘  │  └─────────────────┘  └─────────────────────────────┘
└─────────────────┘
```

## Features

### Core Authentication
- ✅ Provider-agnostic login (Strategy Pattern)
- ✅ Multi-protocol support (OIDC, SAML 2.0, OAuth 2.0, LDAP)
- ✅ MFA support (TOTP, SMS, Email)
- ✅ Social login (Google, Microsoft)
- ✅ Token refresh with blacklisting
- ✅ Seat/license validation

### Dynamic Identity Broker
- ✅ Runtime IdP registration via Admin UI
- ✅ Neo4j-backed configuration storage
- ✅ Graph-based RBAC with role inheritance
- ✅ Multi-tenant isolation
- ✅ Provider template library

### Security
- ✅ BFF pattern (secrets never in browser)
- ✅ Encrypted secret storage (Jasypt)
- ✅ Rate limiting
- ✅ Circuit breaker for resilience

## Quick Start

### Prerequisites

- Java 21+
- Docker & Docker Compose
- Maven 3.9+

### 1. Start Infrastructure

```bash
# From project root
./scripts/deploy-auth-facade.sh

# Or manually
docker-compose -f infrastructure/docker/docker-compose.yml up -d
```

### 2. Run the Service

```bash
cd backend/auth-facade
./mvnw spring-boot:run
```

### 3. Access Endpoints

| Service | URL | Credentials |
|---------|-----|-------------|
| Auth Facade API | http://localhost:8081 | - |
| Swagger UI | http://localhost:8081/swagger-ui.html | - |
| Neo4j Browser | http://localhost:7474 | neo4j / password123 |
| Keycloak | http://localhost:8180 | admin / admin |

## Configuration

### Application Properties

```yaml
auth:
  facade:
    # Active provider (static mode)
    provider: keycloak

    # Enable dynamic broker mode
    dynamic-broker:
      enabled: true

    # JWT claim paths for role extraction
    role-claim-paths:
      - realm_access.roles
      - resource_access
      - roles
      - groups

    # Tenant resolution
    tenant-resolution: header
    tenant-header: X-Tenant-ID

spring:
  neo4j:
    uri: bolt://localhost:7687
    authentication:
      username: neo4j
      password: password123
```

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `AUTH_PROVIDER` | Default identity provider | `keycloak` |
| `NEO4J_URI` | Neo4j Bolt URI | `bolt://localhost:7687` |
| `NEO4J_USER` | Neo4j username | `neo4j` |
| `NEO4J_PASSWORD` | Neo4j password | - |
| `VALKEY_HOST` | Valkey host | `localhost` |
| `KEYCLOAK_URL` | Keycloak server URL | `http://localhost:8180` |

## API Reference

### Authentication Endpoints (Public)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/auth/login` | Password login |
| GET | `/api/v1/auth/login/{tenantId}/{provider}` | Initiate SSO flow |
| POST | `/api/v1/auth/callback` | OAuth2 callback |
| POST | `/api/v1/auth/refresh` | Refresh tokens |
| POST | `/api/v1/auth/logout` | Logout & blacklist |
| GET | `/api/v1/auth/providers` | List active IdPs for login |
| GET | `/api/v1/auth/me` | Get current user |

### Admin Endpoints (Requires ADMIN role)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/admin/tenants/{tenantId}/providers` | List tenant providers |
| POST | `/api/v1/admin/tenants/{tenantId}/providers` | Register new IdP |
| PUT | `/api/v1/admin/tenants/{tenantId}/providers/{id}` | Update provider |
| DELETE | `/api/v1/admin/tenants/{tenantId}/providers/{id}` | Delete provider |

## Neo4j Graph Schema

### Identity Graph

```cypher
// Tenant → Provider → Config relationship
(t:Tenant)-[:USES]->(p:Provider)-[:CONFIGURED_WITH]->(c:Config)
(p:Provider)-[:SUPPORTS]->(proto:Protocol)

// RBAC Graph
(u:User)-[:MEMBER_OF]->(g:Group)-[:HAS_ROLE]->(r:Role)
(r:Role)-[:INHERITS_FROM]->(parent:Role)
```

### Role Hierarchy

```
SUPER_ADMIN
    └── ADMIN
          └── MANAGER
                └── USER
```

## Supported Identity Providers

| Provider | Protocol | Features |
|----------|----------|----------|
| Keycloak | OIDC, SAML | Full support, realm-per-tenant |
| Auth0 | OIDC | Custom claims, MFA |
| Okta | OIDC | Groups sync |
| Azure AD | OIDC | App roles, groups |
| UAE Pass | OAuth 2.0 | Emirates ID integration |
| IBM IAM | SAML 2.0 | Enterprise SAML |
| Active Directory | LDAP | On-premise integration |

## Project Structure

```
backend/auth-facade/
├── src/main/java/com/ems/auth/
│   ├── config/
│   │   ├── AuthProperties.java          # Configuration binding
│   │   ├── DynamicBrokerSecurityConfig.java  # Dual filter chains
│   │   └── GlobalExceptionHandler.java
│   ├── controller/
│   │   ├── AuthController.java          # Public auth endpoints
│   │   └── AdminProviderController.java # Admin management
│   ├── dto/
│   │   ├── AuthRequest.java
│   │   ├── AuthResponse.java
│   │   └── ProviderConfigRequest.java
│   ├── provider/
│   │   ├── IdentityProvider.java        # Strategy interface
│   │   ├── KeycloakIdentityProvider.java
│   │   ├── DynamicProviderResolver.java # Runtime resolution
│   │   └── InMemoryProviderResolver.java
│   ├── security/
│   │   ├── ProviderAgnosticRoleConverter.java
│   │   └── JwtValidationFilter.java
│   └── service/
│       ├── AuthService.java
│       ├── AuthServiceImpl.java
│       └── SeatValidationService.java
├── src/main/resources/
│   ├── application.yml
│   ├── application-auth0.yml
│   ├── application-okta.yml
│   └── application-azure-ad.yml
└── openapi.yaml
```

## Security Configuration

### Dual Filter Chain Architecture

```java
// Chain 1: Admin API (JWT Resource Server)
@Order(1) securityMatcher("/api/v1/admin/**")
→ Requires ADMIN role
→ OAuth2 Resource Server with JWT

// Chain 2: Public Auth Flow (OAuth2 Client)
@Order(2) securityMatcher("/api/v1/auth/**")
→ Public endpoints for login/callback
→ OAuth2Login for BFF handshake
```

## Testing

```bash
# Unit tests
./mvnw test

# Integration tests (requires Docker)
./mvnw verify -Pintegration-test

# Test with Postman
# Import: backend/auth-facade/postman-collection.json
```

## Related Documentation

- [E2E Design Document](../../docs/arc42/auth-facade-dynamic-broker.md)
- [Architecture Overview](../../docs/arc42/auth-facade-architecture.md)
- [Configuration Guide](../../docs/arc42/auth-facade-configuration.md)
- [ADR-007: Provider-Agnostic Auth](../../docs/adr/ADR-007-auth-facade-provider-agnostic.md)

## Troubleshooting

### Common Issues

**Issue: Provider not found**
```
Check Neo4j Browser: MATCH (t:Tenant)-[:USES]->(p:Provider) RETURN t, p
```

**Issue: Roles not extracted**
```yaml
# Verify role-claim-paths matches your IdP's JWT structure
auth.facade.role-claim-paths:
  - realm_access.roles  # Keycloak
  - roles               # Azure AD
```

**Issue: Neo4j connection failed**
```bash
# Verify Neo4j is running
docker logs ems-neo4j
```

## License

Proprietary - EMS Platform
