# ADR-006: Platform Services Consolidation

**Status:** Proposed (Not Implemented)
**Date:** 2026-02-24
**Decision Makers:** Architecture Team, PM
**Implementation Status:** 0% - Deferred to future release

## Context

The current platform services decomposition includes five separate microservices:

| Service | Port | Responsibilities |
|---------|------|------------------|
| tenant-service | 8082 | Tenants, Domains, Branding, Auth Config |
| user-service | 8083 | Users, Sessions, Devices |
| license-service | 8085 | Licenses, Seats, Features |
| audit-service | 8087 | Audit Logs, Exports |
| notification-service | 8086 | Email, SMS, Push |

A question has been raised about whether `license-service` and `tenant-service` should be separate services, given that:

1. **Tight Coupling**: Licenses are fundamentally tied to tenants - a license cannot exist without a tenant
2. **Transaction Boundaries**: Tenant provisioning requires creating both tenant and license records atomically
3. **Operational Complexity**: Two services with closely related data creates distributed transaction concerns
4. **Data Ownership Overlap**: Both services reference `tenantId` as a core discriminator

### Current State Analysis

**tenant-service entities:**
- TenantEntity (id, fullName, slug, tier, status)
- TenantDomainEntity (domain, SSL, verification)
- TenantBrandingEntity (logo, colors, theme)
- TenantAuthProviderEntity (SSO configuration)
- TenantMFAConfigEntity
- TenantSessionConfigEntity

**license-service entities:**
- LicenseProductEntity (product catalog - system-wide)
- LicenseFeatureEntity (feature definitions - system-wide)
- TenantLicenseEntity (tenant_id, product_id, seats, validity)
- UserLicenseAssignmentEntity (user_id, license_id)

**Key Observations:**

1. `license-service` stores `tenantId` as a string foreign key (no JPA relationship)
2. No Feign/WebClient calls exist between tenant-service and license-service
3. Both services operate against the same master graph (system database per ADR-003)
4. Tenant provisioning is incomplete without license assignment
5. `TenantTier` enum in tenant-service implies licensing constraints

## Decision

**PROPOSED:** Merge `license-service` into `tenant-service`, creating a unified `tenant-service` with expanded scope.

> **Note:** This decision documents the architectural direction. As of 2026-02-25, `license-service` remains a separate microservice at port 8085. Implementation is deferred to a future release.

The merged service will own the complete "Tenant Lifecycle" bounded context:

```
tenant-service (merged)
├── Tenant Management
│   ├── Tenant CRUD
│   ├── Domain Management
│   └── Branding Configuration
├── Tenant Configuration
│   ├── Auth Provider Config
│   ├── MFA Config
│   └── Session Config
└── Tenant Licensing (NEW)
    ├── License Products (catalog)
    ├── License Features (definitions)
    ├── Tenant Licenses (allocation)
    └── User License Assignments (seats)
```

### Rationale

| Factor | Separate Services | Merged Service | Winner |
|--------|-------------------|----------------|--------|
| **Bounded Context** | Artificial split within tenant lifecycle | Single cohesive bounded context | Merged |
| **Transaction Boundaries** | Distributed transaction on tenant creation | Single transaction for provisioning | Merged |
| **Data Consistency** | Eventual consistency via events | Strong consistency | Merged |
| **Deployment Complexity** | 2 services to deploy/monitor | 1 service | Merged |
| **Team Ownership** | Same team owns both | Same team, clearer ownership | Merged |
| **Scaling Independence** | Could scale license queries separately | License queries are low-volume | Merged |
| **Change Frequency** | Similar change frequency | Combined releases | Merged |

### Bounded Context Analysis

Using Domain-Driven Design principles, the following aggregates naturally belong together:

```
┌─────────────────────────────────────────────────────────────┐
│                 TENANT LIFECYCLE BOUNDED CONTEXT            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   ┌─────────────────┐        ┌─────────────────┐           │
│   │     TENANT      │        │  LICENSE PRODUCT │           │
│   │   (Aggregate)   │        │   (Aggregate)    │           │
│   ├─────────────────┤        ├─────────────────┤           │
│   │ - TenantEntity  │        │ - ProductEntity  │           │
│   │ - Domain        │◀───────│ - FeatureEntity  │           │
│   │ - Branding      │        └─────────────────┘           │
│   │ - AuthProvider  │                                       │
│   │ - MFAConfig     │        ┌─────────────────┐           │
│   │ - SessionConfig │◀───────│  TENANT LICENSE  │           │
│   │ - TenantLicense │        │   (Aggregate)    │           │
│   └─────────────────┘        ├─────────────────┤           │
│                              │ - Seats          │           │
│                              │ - Validity       │           │
│                              │ - UserAssignment │           │
│                              └─────────────────┘           │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Tenant Provisioning Transaction

The merged service enables atomic tenant provisioning:

```java
@Service
@Transactional
public class TenantProvisioningService {

    public Tenant provisionTenant(CreateTenantRequest request) {
        // SINGLE TRANSACTION

        // 1. Create tenant with config
        TenantEntity tenant = createTenantWithConfig(request);

        // 2. Assign default license based on tier
        TenantLicenseEntity license = assignDefaultLicense(tenant, request.tier());

        // 3. Create Neo4j tenant database
        neo4jAdminService.createDatabase("tenant_" + tenant.getSlug());

        // 4. Create Keycloak realm
        keycloakService.createRealm(tenant);

        return tenant;
    }
}
```

### API Structure (Merged)

```
/api/v1/tenants
  GET    /                          # List tenants
  POST   /                          # Create tenant (with default license)
  GET    /{tenantId}                # Get tenant details
  PUT    /{tenantId}                # Update tenant
  DELETE /{tenantId}                # Delete tenant (if no users)

/api/v1/tenants/{tenantId}/domains
  GET    /                          # List domains
  POST   /                          # Add domain
  ...

/api/v1/tenants/{tenantId}/branding
  GET    /                          # Get branding
  PUT    /                          # Update branding

/api/v1/tenants/{tenantId}/licenses          # MOVED FROM license-service
  GET    /                          # List tenant licenses
  POST   /                          # Assign license to tenant
  GET    /{licenseId}               # Get license details
  PUT    /{licenseId}               # Update license (seats, validity)
  DELETE /{licenseId}               # Remove license

/api/v1/tenants/{tenantId}/licenses/{licenseId}/users   # MOVED FROM license-service
  GET    /                          # List users with this license
  POST   /                          # Assign user to license
  DELETE /{userId}                  # Unassign user

/api/v1/license-products                     # System catalog (admin only)
  GET    /                          # List available products
  POST   /                          # Create product
  ...
```

## Additional Service Assessment

### user-service: Keep Separate

**Recommendation: NO MERGE**

| Factor | Assessment |
|--------|------------|
| Bounded Context | Distinct "User Identity" context vs "Tenant Lifecycle" |
| Data Location | User data in tenant graphs, tenant data in master graph |
| Scaling | User queries are high-volume, benefit from separate scaling |
| Change Frequency | User features change independently of tenant config |
| Team Ownership | Could be owned by different team |

User-service correctly manages user-specific concerns (profile, sessions, devices) that are tenant-scoped but not tenant-configuration data.

### audit-service: Keep Separate

**Recommendation: NO MERGE**

| Factor | Assessment |
|--------|------------|
| Bounded Context | Distinct "Compliance/Audit" context |
| Data Characteristics | Append-only, high-volume writes |
| Retention | Different retention policies than operational data |
| Query Patterns | Time-series queries, different optimization |
| Isolation | Audit independence is a compliance requirement |

Audit-service must remain independent for compliance reasons - auditors should not be able to claim audit logs were modified by the system being audited.

### notification-service: Keep Separate

**Recommendation: NO MERGE**

| Factor | Assessment |
|--------|------------|
| Bounded Context | Distinct "Communication" context |
| External Dependencies | SMTP, SMS gateways, push providers |
| Delivery Guarantees | At-least-once, retry logic |
| Async Nature | Fire-and-forget, queue-based |
| Reusability | Used by all services |

Notification-service is correctly isolated as a shared infrastructure service.

## Consequences

### Positive

1. **Atomic Provisioning**: Tenant + License created in single transaction
2. **Simplified Operations**: One service to deploy, monitor, debug
3. **Clearer Ownership**: Single team owns entire tenant lifecycle
4. **Reduced Latency**: No inter-service calls for license checks
5. **Simpler Data Model**: Direct JPA relationships between Tenant and License
6. **API Cohesion**: Nested resources under `/tenants/{id}/licenses`

### Negative

1. **Larger Service**: tenant-service becomes bigger (still reasonable size)
2. **Migration Effort**: Need to move code, merge databases/schemas
3. **API Changes**: license-service endpoints must be deprecated/redirected

### Neutral

- Port 8085 becomes available
- License product catalog remains in master graph
- No impact on other services

## Migration Plan

### Phase 1: Code Consolidation (Week 1)
1. Move license entities to tenant-service
2. Move license repositories, services, controllers
3. Update package structure
4. Merge configurations

### Phase 2: API Migration (Week 2)
1. Add new endpoints under `/tenants/{id}/licenses`
2. Mark old `/licenses` endpoints as deprecated
3. Add API Gateway redirect rules

### Phase 3: Data Migration (Week 3)
1. Verify data model alignment
2. Run migration scripts (if separate DBs)
3. Validate data integrity

### Phase 4: Cleanup (Week 4)
1. Remove deprecated endpoints
2. Remove license-service module
3. Update documentation
4. Remove API Gateway routes

## Alternatives Considered

### Alternative 1: Keep Services Separate with Saga Pattern

**Description:** Use Saga pattern for distributed tenant provisioning.

**Pros:**
- Services remain independently deployable
- Clear separation of concerns

**Cons:**
- Added complexity for compensating transactions
- Eventual consistency issues
- More infrastructure (saga orchestrator)
- Over-engineering for this use case

**Verdict:** Rejected - complexity not justified for tightly coupled domains.

### Alternative 2: Merge All Platform Services

**Description:** Create a single `platform-service` containing tenant, user, license, audit, notification.

**Pros:**
- Maximum simplicity
- Single deployment

**Cons:**
- Violates bounded context principles
- Monolith anti-pattern
- Different scaling requirements
- Compliance issues (audit independence)

**Verdict:** Rejected - too coarse-grained, loses benefits of service isolation.

### Alternative 3: Shared Library Approach

**Description:** Keep services separate but share code via common library.

**Pros:**
- Reuse without merging
- Services remain independent

**Cons:**
- Distributed transaction problem remains
- Tight coupling via shared code (worse than service merge)
- Versioning complexity

**Verdict:** Rejected - doesn't solve the core transaction boundary issue.

## References

- [ADR-003: Graph-per-Tenant Multi-Tenancy](./ADR-003-database-per-tenant.md)
- [Building Blocks](../arc42/05-building-blocks.md)
- [Solution Strategy](../arc42/04-solution-strategy.md)
- [Domain-Driven Design - Bounded Contexts](https://martinfowler.com/bliki/BoundedContext.html)
- [Microservice Patterns - Service Decomposition](https://microservices.io/patterns/decomposition/decompose-by-business-capability.html)

---

## Current State (as of 2026-02-25)

**This ADR documents a proposed architectural change that has NOT been implemented.**

### Actual Production Configuration

| Service | Port | Status | Module Path |
|---------|------|--------|-------------|
| tenant-service | 8082 | Active | `backend/tenant-service` |
| license-service | 8085 | Active (Separate) | `backend/license-service` |

The `license-service` remains a separate, fully independent microservice with:
- Its own `pom.xml` and Maven module
- Independent Spring Boot application on port 8085
- Separate OpenAPI specification (`backend/license-service/openapi.yaml`)
- Full Java package structure at `com.ems.license.*`

### Why Not Implemented

This consolidation was proposed but deferred due to:
1. Current system is functional with services operating independently
2. No immediate pain points from distributed transactions
3. Other priorities took precedence
4. Migration effort requires dedicated sprint

### Implementation Timeline

| Phase | Description | Status |
|-------|-------------|--------|
| Phase 1 | Code Consolidation | Not Started |
| Phase 2 | API Migration | Not Started |
| Phase 3 | Data Migration | Not Started |
| Phase 4 | Cleanup | Not Started |

**Planned For:** Future release (TBD)

---

**Implementation Status:** Proposed (Not Implemented)

**Estimated Effort:** 4 weeks (1 developer)

**Breaking Changes:** Yes - API endpoint changes for license management (when implemented)
