# Master Graph Schema

> Legacy focused view. The canonical per-database source is [neo4j-ems-db.md](./neo4j-ems-db.md).

The master graph (database: `system`) contains tenant registry information and system-wide configurations. Each tenant's actual data resides in their own dedicated graph database.

## Overview

```mermaid
graph TB
    subgraph master["MASTER GRAPH (system)"]
        subgraph registry["TENANT REGISTRY"]
            Tenant((Tenant))
            Domain((Domain))
            AuthProvider((AuthProvider))
            Branding((Branding))
            SessionConfig((SessionConfig))
            MFAConfig((MFAConfig))

            Tenant -->|HAS_DOMAIN| Domain
            Tenant -->|HAS_AUTH| AuthProvider
            Tenant -->|HAS_BRANDING| Branding
            Tenant -->|HAS_SESSION_CONFIG| SessionConfig
            Tenant -->|HAS_MFA_CONFIG| MFAConfig
        end

        subgraph licenses["LICENSE PRODUCTS"]
            LicenseProduct((LicenseProduct))
            LicenseFeature((LicenseFeature))

            LicenseProduct -->|HAS_FEATURE| LicenseFeature
        end

        subgraph bpmn["BPMN ELEMENT TYPES"]
            BpmnElementType((BpmnElementType))
        end
    end
```

## ERD (Mermaid)

```mermaid
erDiagram
    TENANT ||--o{ DOMAIN : HAS_DOMAIN
    TENANT ||--o{ AUTH_PROVIDER : HAS_AUTH
    TENANT ||--o| BRANDING : HAS_BRANDING
    TENANT ||--o| SESSION_CONFIG : HAS_SESSION_CONFIG
    TENANT ||--o| MFA_CONFIG : HAS_MFA_CONFIG
    LICENSE_PRODUCT ||--o{ LICENSE_FEATURE : HAS_FEATURE

    TENANT {
        string id PK
        string uuid UK
        string slug UK
        string fullName
        string tenantType
        string tier
        string status
        string databaseName
        string keycloakRealm
    }

    DOMAIN {
        string id PK
        string domain UK
        boolean isPrimary
        boolean isVerified
        string sslStatus
    }

    AUTH_PROVIDER {
        string id PK
        string type
        string name
        boolean isEnabled
        boolean isPrimary
    }

    BRANDING {
        string id PK
        string primaryColor
        string secondaryColor
        string logoUrl
        string fontFamily
    }

    SESSION_CONFIG {
        string id PK
        int accessTokenLifetime
        int refreshTokenLifetime
        int idleTimeout
        int absoluteTimeout
    }

    MFA_CONFIG {
        string id PK
        boolean isEnabled
        boolean isRequired
        string allowedMethods
        string defaultMethod
    }

    LICENSE_PRODUCT {
        string id PK
        string code UK
        string name
        string tier
        boolean isActive
    }

    LICENSE_FEATURE {
        string id PK
        string code UK
        string name
        string category
        boolean isActive
    }

    BPMN_ELEMENT_TYPE {
        string id PK
        string code UK
        string name
        string category
        string bpmnType
        boolean isActive
    }
```

## Node Definitions

### Tenant

Core tenant registry node with database routing information.

```mermaid
classDiagram
    class Tenant {
        +String id
        +String uuid
        +String fullName
        +String shortName
        +String slug
        +String description
        +String logoUrl
        +String tenantType
        +String tier
        +String status
        +String keycloakRealm
        +String databaseName
        +Boolean isProtected
        +DateTime createdAt
        +DateTime updatedAt
        +String createdBy
    }
```

**Properties:**

| Property | Type | Constraints | Description |
|----------|------|-------------|-------------|
| id | String | Required, Unique | Tenant identifier (e.g., "tenant-abc") |
| uuid | String | Required, Unique | System-generated UUID |
| fullName | String | Required | Full organization name |
| shortName | String | Required | Short display name |
| slug | String | Required, Unique | URL-safe identifier |
| description | String | | Organization description |
| logoUrl | String | | Logo URL |
| tenantType | String | Required | MASTER, DOMINANT, REGULAR |
| tier | String | Required | FREE, STANDARD, PROFESSIONAL, ENTERPRISE |
| status | String | Required | ACTIVE, LOCKED, SUSPENDED, PENDING |
| keycloakRealm | String | | Keycloak realm name |
| databaseName | String | Required | Neo4j database name (tenant_{slug}) |
| isProtected | Boolean | | Cannot be deleted if true |
| createdAt | DateTime | Required | |
| updatedAt | DateTime | Required | |
| createdBy | String | | User who created tenant |

**Constraints:**
```cypher
CREATE CONSTRAINT tenant_id FOR (t:Tenant) REQUIRE t.id IS UNIQUE;
CREATE CONSTRAINT tenant_slug FOR (t:Tenant) REQUIRE t.slug IS UNIQUE;
CREATE CONSTRAINT tenant_uuid FOR (t:Tenant) REQUIRE t.uuid IS UNIQUE;
```

### Domain

Custom domains per tenant for multi-domain support.

```mermaid
classDiagram
    class Domain {
        +String id
        +String domain
        +Boolean isPrimary
        +Boolean isVerified
        +String sslStatus
        +String verificationToken
        +DateTime createdAt
    }

    Tenant "1" --> "*" Domain : HAS_DOMAIN
```

**Relationship:** `(:Tenant)-[:HAS_DOMAIN]->(:Domain)`

### AuthProvider

SSO and authentication provider configurations per tenant.

```mermaid
classDiagram
    class AuthProvider {
        +String id
        +String type
        +String name
        +String displayName
        +String icon
        +Boolean isEnabled
        +Boolean isPrimary
        +Integer sortOrder
        +Map config
        +DateTime createdAt
    }
```

**Types:** LOCAL, AZURE_AD, SAML, OIDC, LDAP, UAEPASS, GOOGLE

**Relationship:** `(:Tenant)-[:HAS_AUTH]->(:AuthProvider)`

### Branding

UI customization per tenant.

```mermaid
classDiagram
    class Branding {
        +String id
        +String primaryColor
        +String primaryColorDark
        +String secondaryColor
        +String logoUrl
        +String logoUrlDark
        +String faviconUrl
        +String fontFamily
        +String customCss
        +DateTime createdAt
        +DateTime updatedAt
    }
```

**Relationship:** `(:Tenant)-[:HAS_BRANDING]->(:Branding)`

### SessionConfig

Session and token configuration per tenant.

```mermaid
classDiagram
    class SessionConfig {
        +String id
        +Integer accessTokenLifetime
        +Integer refreshTokenLifetime
        +Integer idleTimeout
        +Integer absoluteTimeout
        +Integer maxConcurrentSessions
        +DateTime createdAt
        +DateTime updatedAt
    }
```

**Relationship:** `(:Tenant)-[:HAS_SESSION_CONFIG]->(:SessionConfig)`

### MFAConfig

MFA configuration per tenant.

```mermaid
classDiagram
    class MFAConfig {
        +String id
        +Boolean isEnabled
        +Boolean isRequired
        +List~String~ allowedMethods
        +String defaultMethod
        +Integer gracePeriodDays
        +DateTime createdAt
        +DateTime updatedAt
    }
```

**Allowed Methods:** TOTP, SMS, EMAIL

**Relationship:** `(:Tenant)-[:HAS_MFA_CONFIG]->(:MFAConfig)`

### LicenseProduct

System-wide license product catalog.

```mermaid
classDiagram
    class LicenseProduct {
        +String id
        +String code
        +String name
        +String description
        +String tier
        +Boolean isActive
        +DateTime createdAt
    }

    class LicenseFeature {
        +String id
        +String code
        +String name
        +String description
    }

    LicenseProduct "1" --> "*" LicenseFeature : HAS_FEATURE
```

**Constraints:**
```cypher
CREATE CONSTRAINT license_product_code FOR (lp:LicenseProduct) REQUIRE lp.code IS UNIQUE;
```

### BpmnElementType

System-wide BPMN element type definitions.

```mermaid
classDiagram
    class BpmnElementType {
        +String id
        +String code
        +String name
        +String description
        +String category
        +String bpmnType
        +String icon
        +String color
        +Map properties
        +Boolean isActive
        +Integer sortOrder
        +DateTime createdAt
    }
```

**Categories:** EVENT, TASK, GATEWAY, SUBPROCESS, DATA, ARTIFACT

**Constraints:**
```cypher
CREATE CONSTRAINT bpmn_element_code FOR (b:BpmnElementType) REQUIRE b.code IS UNIQUE;
```

## Sample Cypher Queries

### Get tenant with all configurations

```cypher
MATCH (t:Tenant {slug: $slug})
OPTIONAL MATCH (t)-[:HAS_DOMAIN]->(d:Domain)
OPTIONAL MATCH (t)-[:HAS_BRANDING]->(b:Branding)
OPTIONAL MATCH (t)-[:HAS_AUTH]->(a:AuthProvider)
RETURN t, collect(d) as domains, b, collect(a) as authProviders
```

### Get active license products with features

```cypher
MATCH (lp:LicenseProduct {isActive: true})-[:HAS_FEATURE]->(lf:LicenseFeature)
RETURN lp, collect(lf) as features
ORDER BY lp.tier
```

---

**Database:** Neo4j 5.x (database: `system`)
**Last Updated:** 2026-02-24
